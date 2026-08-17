import React, { useState } from 'react';
import { setReady, kickPlayer } from '../firebase/roomService.js';
import { startGame } from '../firebase/gameService.js';

export default function Lobby({ room, roomId, playerId, onLeave, onGameStart }) {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const players = room.players || {};
  const playerList = Object.entries(players).map(([id, p]) => ({ id, ...p }));
  const isHost = room.host === playerId;
  const me = players[playerId];
  const allReady = playerList.length >= 3 && playerList.every((p) => p.id === room.host || p.ready);

  const handleReadyToggle = () => {
    setReady(roomId, playerId, !me?.ready);
  };

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      await startGame(roomId);
      onGameStart();
    } catch (e) {
      setError(e.message || 'Could not start game.');
      setStarting(false);
    }
  };

  const handleKick = (targetId) => {
    kickPlayer(roomId, targetId);
  };

  return (
    <div className="panel fade-in" style={{ maxWidth: 560, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 className="title-font" style={{ margin: 0 }}>LOBBY</h2>
        <div className="hud-pill">CODE: {roomId}</div>
      </div>
      <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
        {playerList.length}/10 players connected · minimum 3 to start
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22, maxHeight: 320, overflowY: 'auto' }}>
        {playerList.map((p) => (
          <div key={p.id} className="lobby-player-card">
            <div className="avatar-dot" style={{ background: p.color?.hex || '#334155' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {p.username} {p.id === room.host && <span style={{ color: '#f59e0b', fontSize: 11 }}>· HOST</span>}
                {p.id === playerId && <span style={{ color: '#3b82f6', fontSize: 11 }}> · YOU</span>}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Avatar {p.avatar}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: p.id === room.host ? '#f59e0b' : p.ready ? '#22c55e' : '#8b98b3'
              }}
            >
              {p.id === room.host ? 'HOST' : p.ready ? 'READY' : 'WAITING'}
            </div>
            {isHost && p.id !== playerId && (
              <button
                className="btn danger"
                style={{ padding: '6px 10px', fontSize: 11 }}
                onClick={() => handleKick(p.id)}
              >
                KICK
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#e0393e', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        {!isHost && (
          <button className="btn full" onClick={handleReadyToggle}>
            {me?.ready ? 'CANCEL READY' : 'READY UP'}
          </button>
        )}
        {isHost && (
          <button
            className="btn full"
            disabled={!allReady || starting}
            onClick={handleStart}
            title={!allReady ? 'All players must be ready (min 3 players)' : ''}
          >
            {starting ? 'STARTING...' : 'START GAME'}
          </button>
        )}
        <button className="btn secondary" onClick={onLeave}>
          LEAVE
        </button>
      </div>
    </div>
  );
}
