import { db } from '../firebase.js';
import { ref, update, set, get, onValue, off, remove, runTransaction, push } from 'firebase/database';
import { ROLES, getImpostorCount, KILL_COOLDOWN_MS, MAX_PLAYERS } from '../game/roles.js';
import { TASK_LIST } from '../game/tasks.js';
import { SPAWN_POINTS } from '../game/mapData.js';

export async function startGame(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return;
  const room = snap.val();
  const playerIds = Object.keys(room.players || {});
  if (playerIds.length < 3) {
    throw new Error('Need at least 3 players to start.');
  }
  if (playerIds.length > MAX_PLAYERS) {
    throw new Error(`Room exceeds the ${MAX_PLAYERS}-player maximum.`);
  }

  // Shuffle player order, then take the first N as impostors so the
  // impostor count scales with lobby size instead of always being 1.
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const impostorCount = Math.min(getImpostorCount(playerIds.length), playerIds.length - 1);
  const impostors = new Set(shuffled.slice(0, impostorCount));

  const updates = {};
  playerIds.forEach((id, i) => {
    const spawn = SPAWN_POINTS[i % SPAWN_POINTS.length];
    updates[`players/${id}/role`] = impostors.has(id) ? ROLES.SABOTEUR : ROLES.EMPLOYEE;
    updates[`players/${id}/alive`] = true;
    updates[`players/${id}/lastKillAt`] = null;
    updates[`players/${id}/x`] = spawn.x;
    updates[`players/${id}/y`] = spawn.y;
  });

  // seed tasks
  const tasks = {};
  TASK_LIST.forEach((t) => {
    tasks[t.id] = { completed: false };
  });
  updates['tasks'] = tasks;
  updates['bodies'] = null;
  updates['gameState'] = {
    phase: 'playing',
    timer: 0,
    winner: null
  };
  updates['status'] = 'playing';
  updates['votes'] = null;

  await update(roomRef, updates);
}

export async function completeTask(roomId, taskId) {
  await update(ref(db, `rooms/${roomId}/tasks/${taskId}`), { completed: true });
  await checkEmployeeVictory(roomId);
}

export async function checkEmployeeVictory(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}/tasks`));
  if (!snap.exists()) return;
  const tasks = snap.val();
  const allDone = Object.values(tasks).every((t) => t.completed);
  if (allDone) {
    await update(ref(db, `rooms/${roomId}/gameState`), {
      phase: 'ended',
      winner: 'employees'
    });
    await update(ref(db, `rooms/${roomId}`), { status: 'ended' });
  }
}

export async function callMeeting(roomId, callerId, reason, bodyInfo) {
  await update(ref(db, `rooms/${roomId}/gameState`), {
    phase: 'meeting',
    timer: 60,
    meetingCaller: callerId,
    meetingReason: reason || 'emergency',
    meetingVictimColor: bodyInfo?.victimColor || null,
    meetingVictimName: bodyInfo?.victimName || null
  });
  await remove(ref(db, `rooms/${roomId}/votes`));
}

// Player finds a bone/remains and calls a meeting to report it. Marks the
// body as reported (so it can't be reported twice) and surfaces the
// victim's color/name in the meeting UI.
export async function reportBody(roomId, callerId, bodyId) {
  const bodyRef = ref(db, `rooms/${roomId}/bodies/${bodyId}`);
  const snap = await get(bodyRef);
  if (!snap.exists()) throw new Error('That body is no longer there.');
  const body = snap.val();
  if (body.reported) throw new Error('That body was already reported.');

  await update(bodyRef, { reported: true });
  await callMeeting(roomId, callerId, 'body', {
    victimColor: body.victimColor,
    victimName: body.victimName
  });
}

export async function castVote(roomId, voterId, targetId) {
  await set(ref(db, `rooms/${roomId}/votes/${voterId}`), {
    voteTarget: targetId
  });
}

export async function resolveVotes(roomId) {
  const [votesSnap, playersSnap] = await Promise.all([
    get(ref(db, `rooms/${roomId}/votes`)),
    get(ref(db, `rooms/${roomId}/players`))
  ]);
  const votes = votesSnap.exists() ? votesSnap.val() : {};
  const players = playersSnap.exists() ? playersSnap.val() : {};

  const tally = {};
  Object.values(votes).forEach((v) => {
    const target = v.voteTarget;
    if (!target || target === 'skip') return;
    tally[target] = (tally[target] || 0) + 1;
  });

  let ejectedId = null;
  let maxVotes = 0;
  let tie = false;
  Object.entries(tally).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      ejectedId = id;
      tie = false;
    } else if (count === maxVotes) {
      tie = true;
    }
  });

  const updates = {};
  let ejectedWasSaboteur = false;
  if (ejectedId && !tie) {
    updates[`players/${ejectedId}/alive`] = false;
    ejectedWasSaboteur = players[ejectedId]?.role === ROLES.SABOTEUR;
  }

  updates['gameState/phase'] = 'playing';
  updates['gameState/lastEjected'] = ejectedId && !tie ? ejectedId : null;
  updates['gameState/lastEjectedWasSaboteur'] = ejectedWasSaboteur;

  await update(ref(db, `rooms/${roomId}`), updates);
  await remove(ref(db, `rooms/${roomId}/votes`));

  if (ejectedWasSaboteur) {
    await checkSaboteurEjectedVictory(roomId, ejectedId);
  } else {
    await checkSaboteurVictory(roomId);
  }
}

async function checkSaboteurEjectedVictory(roomId, ejectedId) {
  // There may be more than one impostor - only end the game once every
  // impostor has been ejected or eliminated.
  const snap = await get(ref(db, `rooms/${roomId}/players`));
  if (!snap.exists()) return;
  const players = snap.val();
  const remainingImpostors = Object.values(players).filter(
    (p) => p.role === ROLES.SABOTEUR && p.alive
  ).length;
  if (remainingImpostors === 0) {
    await update(ref(db, `rooms/${roomId}/gameState`), {
      phase: 'ended',
      winner: 'employees'
    });
    await update(ref(db, `rooms/${roomId}`), { status: 'ended' });
  } else {
    await checkSaboteurVictory(roomId);
  }
}

export async function checkSaboteurVictory(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}/players`));
  if (!snap.exists()) return;
  const players = snap.val();
  const alive = Object.values(players).filter((p) => p.alive);
  const aliveSaboteur = alive.filter((p) => p.role === ROLES.SABOTEUR).length;
  const aliveEmployees = alive.filter((p) => p.role === ROLES.EMPLOYEE).length;

  if (aliveSaboteur > 0 && aliveSaboteur >= aliveEmployees) {
    await update(ref(db, `rooms/${roomId}/gameState`), {
      phase: 'ended',
      winner: 'saboteur'
    });
    await update(ref(db, `rooms/${roomId}`), { status: 'ended' });
  }
}

// Impostor kill: validates target is alive, respects kill cooldown, marks
// the victim dead, drops exactly one bone/remains record at the death
// location, and syncs everything through Firebase in one atomic update.
export async function killPlayer(roomId, killerId, targetId) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) throw new Error('Room not found.');
  const room = snap.val();

  const killer = room.players?.[killerId];
  const target = room.players?.[targetId];
  if (!killer || !target) throw new Error('Invalid player.');
  if (killer.role !== ROLES.SABOTEUR) throw new Error('Only the impostor can kill.');
  if (killer.alive === false) throw new Error('You are eliminated.');
  if (target.alive === false) throw new Error('Target is already eliminated.');

  const lastKillAt = killer.lastKillAt || 0;
  if (Date.now() - lastKillAt < KILL_COOLDOWN_MS) {
    throw new Error('Kill is on cooldown.');
  }

  const bodyId = push(ref(db, `rooms/${roomId}/bodies`)).key;
  const now = Date.now();

  const updates = {};
  updates[`players/${targetId}/alive`] = false;
  updates[`players/${killerId}/lastKillAt`] = now;
  updates[`bodies/${bodyId}`] = {
    bodyId,
    victimId: targetId,
    victimColor: target.color,
    victimName: target.username,
    x: target.x,
    y: target.y,
    reported: false,
    createdAt: now
  };
  updates['gameState/lastKill'] = {
    victimId: targetId,
    victimColor: target.color,
    victimName: target.username,
    killerId,
    at: now
  };

  await update(roomRef, updates);
  await checkSaboteurVictory(roomId);

  return { bodyId };
}

export async function triggerSabotage(roomId, type) {
  await update(ref(db, `rooms/${roomId}/gameState`), {
    sabotage: type,
    sabotageAt: Date.now()
  });
}

export async function clearSabotage(roomId) {
  await update(ref(db, `rooms/${roomId}/gameState`), {
    sabotage: null
  });
}

export function listenToGameState(roomId, callback) {
  const stateRef = ref(db, `rooms/${roomId}/gameState`);
  onValue(stateRef, (snap) => callback(snap.exists() ? snap.val() : {}));
  return () => off(stateRef);
}

export function listenToTasks(roomId, callback) {
  const tasksRef = ref(db, `rooms/${roomId}/tasks`);
  onValue(tasksRef, (snap) => callback(snap.exists() ? snap.val() : {}));
  return () => off(tasksRef);
}

export function listenToVotes(roomId, callback) {
  const votesRef = ref(db, `rooms/${roomId}/votes`);
  onValue(votesRef, (snap) => callback(snap.exists() ? snap.val() : {}));
  return () => off(votesRef);
}

export function listenToBodies(roomId, callback) {
  const bodiesRef = ref(db, `rooms/${roomId}/bodies`);
  onValue(bodiesRef, (snap) => callback(snap.exists() ? snap.val() : {}));
  return () => off(bodiesRef);
}
