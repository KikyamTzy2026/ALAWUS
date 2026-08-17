import { db } from '../firebase.js';
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  runTransaction,
  serverTimestamp
} from 'firebase/database';
import { COLORS, MAX_PLAYERS } from '../game/roles.js';

function randomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Pick the first color not currently occupied by an active player.
function pickAvailableColor(players, preferredColorId) {
  const taken = new Set(Object.values(players || {}).map((p) => p.color?.id));
  if (preferredColorId && !taken.has(preferredColorId)) {
    return COLORS.find((c) => c.id === preferredColorId) || null;
  }
  return COLORS.find((c) => !taken.has(c.id)) || null;
}

export async function createRoom(hostId, hostProfile) {
  let roomId = randomRoomCode();
  let attempts = 0;
  // avoid rare collisions
  while (attempts < 5) {
    const existing = await get(ref(db, `rooms/${roomId}`));
    if (!existing.exists()) break;
    roomId = randomRoomCode();
    attempts++;
  }

  const color = pickAvailableColor({}, hostProfile.color?.id) || COLORS[0];

  const roomRef = ref(db, `rooms/${roomId}`);
  await set(roomRef, {
    host: hostId,
    status: 'lobby',
    createdAt: serverTimestamp(),
    players: {
      [hostId]: {
        username: hostProfile.username,
        color,
        avatar: hostProfile.avatar,
        x: 400,
        y: 300,
        role: null,
        alive: true,
        ready: false
      }
    },
    gameState: {
      phase: 'lobby',
      timer: 0,
      winner: null
    }
  });

  return roomId;
}

// Transactional join: atomically enforces the 10-player cap and assigns a
// unique color, so two players joining at the same instant can never both
// slip in as an 11th player or collide on the same color.
export async function joinRoom(roomId, playerId, profile) {
  const roomRef = ref(db, `rooms/${roomId}`);

  const result = await runTransaction(roomRef, (room) => {
    if (room === null) {
      // Room doesn't exist yet - abort, nothing to write.
      return room;
    }
    if (room.status !== 'lobby') {
      // Abort the transaction (undefined = abort) - game already started.
      return undefined;
    }

    const players = room.players || {};
    const alreadyIn = !!players[playerId];
    const playerCount = Object.keys(players).length;

    if (!alreadyIn && playerCount >= MAX_PLAYERS) {
      return undefined; // ROOM FULL - abort transaction, no write happens.
    }

    const color = pickAvailableColor(players, profile.color?.id);
    if (!color) {
      return undefined; // no colors left (shouldn't happen if count check passed)
    }

    if (!room.players) room.players = {};
    room.players[playerId] = {
      username: profile.username,
      color,
      avatar: profile.avatar,
      x: 400,
      y: 300,
      role: null,
      alive: true,
      ready: false
    };
    return room;
  });

  if (!result.committed) {
    const snap = await get(roomRef);
    if (!snap.exists()) {
      throw new Error('Room not found.');
    }
    const room = snap.val();
    if (room.status !== 'lobby') {
      throw new Error('Game already in progress.');
    }
    throw new Error('ROOM FULL');
  }

  return result.snapshot.val();
}

export async function leaveRoom(roomId, playerId) {
  await remove(ref(db, `rooms/${roomId}/players/${playerId}`));
}

export async function kickPlayer(roomId, playerId) {
  await remove(ref(db, `rooms/${roomId}/players/${playerId}`));
}

export async function setReady(roomId, playerId, ready) {
  await update(ref(db, `rooms/${roomId}/players/${playerId}`), { ready });
}

export function listenToRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`);
  onValue(roomRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return () => off(roomRef);
}

export async function deleteRoom(roomId) {
  await remove(ref(db, `rooms/${roomId}`));
}

export { COLORS, MAX_PLAYERS };
