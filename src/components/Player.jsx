import React from 'react';

export default function Player({ player, size = 32, showStatus = false, right = null }) {
  if (!player) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        className="avatar-dot"
        style={{
          width: size,
          height: size,
          background: player.color?.hex || '#334155',
          opacity: player.alive === false ? 0.35 : 1
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {player.username}
          {player.alive === false && (
            <span className="text-muted" style={{ fontSize: 11 }}> · ELIMINATED</span>
          )}
        </div>
        {showStatus && (
          <div className="text-muted" style={{ fontSize: 11 }}>
            {player.ready ? 'Ready' : 'Not ready'}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}
