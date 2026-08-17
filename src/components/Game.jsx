import React, { useCallback, useEffect, useRef, useState } from 'react';
import Map from './Map.jsx';
import HUD from './HUD.jsx';
import TaskPanel from './TaskPanel.jsx';
import Meeting from './Meeting.jsx';
import { ROLE_INFO, ROLES, KILL_COOLDOWN_MS } from '../game/roles.js';
import {
  callMeeting,
  reportBody,
  killPlayer,
  triggerSabotage,
  clearSabotage,
  listenToGameState,
  listenToTasks,
  listenToBodies
} from '../firebase/gameService.js';

const SABOTAGE_DURATION_MS = 15000;
const COOLDOWN_MS = 25000;

export default function Game({ room, roomId, playerId, onLeave }) {
  const [gameState, setGameState] = useState(room.gameState || {});
  const [tasks, setTasks] = useState(room.tasks || {});
  const [bodies, setBodies] = useState(room.bodies || {});
  const [showRoleReveal, setShowRoleReveal] = useState(true);
  const [nearbyTask, setNearbyTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [nearbyKillTarget, setNearbyKillTarget] = useState(null);
  const [nearbyBody, setNearbyBody] = useState(null);
  const [killCooldownLeft, setKillCooldownLeft] = useState(0);
  const [eliminationBanner, setEliminationBanner] = useState(null);
  const [cooldowns, setCooldowns] = useState({ system: false, server: false });
  const sabotageTimeoutRef = useRef(null);
  const lastSeenKillRef = useRef(null);

  const me = room.players?.[playerId];
  const role = me?.role || ROLES.EMPLOYEE;
  const isSaboteur = role === ROLES.SABOTEUR;
  const alive = me?.alive !== false;

  useEffect(() => {
    const unsub1 = listenToGameState(roomId, setGameState);
    const unsub2 = listenToTasks(roomId, setTasks);
    const unsub3 = listenToBodies(roomId, setBodies);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [roomId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowRoleReveal(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  // host auto-clears sabotage after its duration so the UI doesn't stay stuck
  useEffect(() => {
    if (room.host !== playerId) return undefined;
    if (gameState.sabotage) {
      if (sabotageTimeoutRef.current) clearTimeout(sabotageTimeoutRef.current);
      sabotageTimeoutRef.current = setTimeout(() => {
        clearSabotage(roomId);
      }, SABOTAGE_DURATION_MS);
    }
    return () => {
      if (sabotageTimeoutRef.current) clearTimeout(sabotageTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.sabotage, room.host, playerId, roomId]);

  // show "COLOR ELIMINATED" the moment a kill happens, to the player who
  // performed it (a live confirmation of who they just took out).
  useEffect(() => {
    const lastKill = gameState.lastKill;
    if (!lastKill || lastKill.at === lastSeenKillRef.current) return;
    lastSeenKillRef.current = lastKill.at;
    if (lastKill.killerId === playerId) {
      setEliminationBanner(lastKill);
      const t = setTimeout(() => setEliminationBanner(null), 2600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [gameState.lastKill, playerId]);

  // live countdown for the kill cooldown, driven by the synced lastKillAt
  useEffect(() => {
    if (!isSaboteur) return undefined;
    const lastKillAt = me?.lastKillAt || 0;
    const tick = () => {
      const remaining = Math.max(0, KILL_COOLDOWN_MS - (Date.now() - lastKillAt));
      setKillCooldownLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [isSaboteur, me?.lastKillAt]);

  const handleCallMeeting = useCallback(() => {
    callMeeting(roomId, playerId, 'emergency');
  }, [roomId, playerId]);

  const handleReportBody = useCallback(() => {
    if (!nearbyBody) return;
    reportBody(roomId, playerId, nearbyBody.id).catch(() => {});
  }, [roomId, playerId, nearbyBody]);

  const handleKill = useCallback(() => {
    if (!nearbyKillTarget || killCooldownLeft > 0) return;
    killPlayer(roomId, playerId, nearbyKillTarget.id).catch(() => {});
  }, [roomId, playerId, nearbyKillTarget, killCooldownLeft]);

  const handleSabotage = useCallback(
    (type) => {
      const key = type === 'disable_server' ? 'server' : 'system';
      if (cooldowns[key]) return;
      triggerSabotage(roomId, type);
      setCooldowns((c) => ({ ...c, [key]: true }));
      setTimeout(() => setCooldowns((c) => ({ ...c, [key]: false })), COOLDOWN_MS);
    },
    [roomId, cooldowns]
  );

  const handleNearTask = useCallback((task) => setNearbyTask(task), []);
  const handleNearPlayer = useCallback((p) => setNearbyKillTarget(p), []);
  const handleNearBody = useCallback((b) => setNearbyBody(b), []);

  const completedCount = Object.values(tasks).filter((t) => t.completed).length;
  const totalTasks = Object.values(tasks).length || 6;

  const roleMeta = ROLE_INFO[role] || ROLE_INFO.EMPLOYEE;
  const playerList = Object.entries(room.players || {}).map(([id, p]) => ({ id, ...p }));

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {showRoleReveal && (
        <div className="role-reveal">
          <div className={`role-card panel ${isSaboteur ? 'saboteur' : 'employee'}`}>
            <p className="text-muted" style={{ letterSpacing: '0.2em', fontSize: 12, marginBottom: 8 }}>
              YOUR ROLE
            </p>
            <h1 className="title-font" style={{ fontSize: 40, margin: '0 0 14px', color: isSaboteur ? '#e0393e' : '#22c55e' }}>
              {roleMeta.title}
            </h1>
            <p style={{ fontSize: 15, maxWidth: 320 }}>{roleMeta.description}</p>
          </div>
        </div>
      )}

      {gameState.sabotage && (
        <div
          className="hud-pill"
          style={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#e0393e',
            zIndex: 40,
            animation: 'pulseGlow 1s infinite'
          }}
        >
          ⚠ SABOTAGE: {gameState.sabotage.replace('_', ' ').toUpperCase()} IN PROGRESS
        </div>
      )}

      {eliminationBanner && (
        <div
          className="role-reveal"
          style={{ background: 'rgba(3,5,10,0.55)', pointerEvents: 'none' }}
        >
          <div className="panel fade-in" style={{ textAlign: 'center', padding: '28px 40px' }}>
            <h1
              className="title-font"
              style={{
                fontSize: 42,
                margin: 0,
                color: eliminationBanner.victimColor?.hex || '#e0393e'
              }}
            >
              {eliminationBanner.victimColor?.id || 'PLAYER'}
            </h1>
            <p className="title-font" style={{ fontSize: 20, margin: '6px 0 0', color: '#e6ebf5' }}>
              ELIMINATED
            </p>
            {eliminationBanner.victimName && (
              <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                {eliminationBanner.victimName}
              </p>
            )}
          </div>
        </div>
      )}

      <Map
        roomId={roomId}
        players={room.players || {}}
        playerId={playerId}
        role={role}
        alive={alive}
        tasks={tasks}
        bodies={bodies}
        onNearTask={handleNearTask}
        onNearPlayer={handleNearPlayer}
        onNearBody={handleNearBody}
      />

      <HUD
        role={role}
        alive={alive}
        completedCount={completedCount}
        totalTasks={totalTasks}
        onCallMeeting={handleCallMeeting}
        onReportBody={handleReportBody}
        onLeave={onLeave}
        isSaboteur={isSaboteur}
        cooldowns={cooldowns}
        onSabotage={handleSabotage}
        nearbyKillTarget={nearbyKillTarget}
        onKill={handleKill}
        killCooldownLeft={killCooldownLeft}
        nearbyBody={nearbyBody}
        playerList={playerList}
      />

      {nearbyTask && !activeTask && !gameState.sabotage && gameState.phase === 'playing' && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
          <button className="btn" onClick={() => setActiveTask(nearbyTask)}>
            PRESS TO START: {nearbyTask.label.toUpperCase()}
          </button>
        </div>
      )}

      {activeTask && (
        <TaskPanel roomId={roomId} task={activeTask} onClose={() => setActiveTask(null)} />
      )}

      {gameState.phase === 'meeting' && <Meeting room={room} roomId={roomId} playerId={playerId} />}
    </div>
  );
}
