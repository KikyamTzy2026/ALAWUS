import React from 'react';
import { ROLES, ROLE_INFO } from '../game/roles.js';

export default function Victory({ room, playerId, onPlayAgain }) {
  const winner = room.gameState?.winner;
  const players = room.players || {};
  const playerList = Object.entries(players).map(([id, p]) => ({ id, ...p }));
  const tasks = room.tasks || {};
  const completedCount = Object.values(tasks).filter((t) => t.completed).length;
  const totalTasks = Object.values(tasks).length;
  const saboteur = playerList.find((p) => p.role === ROLES.SABOTEUR);
  const eliminatedCount = playerList.filter((p) => p.alive === false).length;

  const won =
    (winner === 'employees' && players[playerId]?.role === ROLES.EMPLOYEE) ||
    (winner === 'saboteur' && players[playerId]?.role === ROLES.SABOTEUR);

  return (
    <div className={`victory-screen ${winner === 'saboteur' ? 'saboteur' : 'employees'} fade-in`}>
      <h1 className="title-font" style={{ fontSize: 46, margin: 0, color: winner === 'saboteur' ? '#e0393e' : '#22c55e' }}>
        {winner === 'saboteur' ? 'SYSTEM FAILURE!' : 'COMPANY SAVED!'}
      </h1>
      <p className="text-muted" style={{ fontSize: 16 }}>
        {won ? 'Victory is yours.' : 'Better luck next shift.'}
      </p>

      <div className="panel" style={{ maxWidth: 480, width: '90%', textAlign: 'left' }}>
        <h3 className="title-font" style={{ marginTop: 0, fontSize: 16 }}>MATCH SUMMARY</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <div className="task-list-item">
            <span>Impostor</span>
            <span style={{ fontWeight: 700, color: '#e0393e' }}>{saboteur?.username || 'Unknown'}</span>
          </div>
          <div className="task-list-item">
            <span>Tasks Completed</span>
            <span style={{ fontWeight: 700 }}>{completedCount}/{totalTasks}</span>
          </div>
          <div className="task-list-item">
            <span>Employees Eliminated</span>
            <span style={{ fontWeight: 700 }}>{eliminatedCount}</span>
          </div>
        </div>

        <h4 style={{ fontSize: 13, marginBottom: 10 }}>ROLES</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {playerList.map((p) => (
            <div key={p.id} className="task-list-item">
              <span>{p.username}</span>
              <span style={{ color: p.role === ROLES.SABOTEUR ? '#e0393e' : '#22c55e', fontWeight: 700 }}>
                {ROLE_INFO[p.role]?.title || p.role}
              </span>
            </div>
          ))}
        </div>

        <button className="btn full" onClick={onPlayAgain}>
          RETURN TO MAIN MENU
        </button>
      </div>
    </div>
  );
}
