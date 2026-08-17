import React, { useState } from 'react';
import { ROLE_INFO } from '../game/roles.js';

export default function HUD({
  role,
  alive,
  completedCount,
  totalTasks,
  onCallMeeting,
  onReportBody,
  onLeave,
  isSaboteur,
  cooldowns,
  onSabotage,
  nearbyKillTarget,
  onKill,
  killCooldownLeft = 0,
  nearbyBody,
  playerList = []
}) {
  const [showPlayers, setShowPlayers] = useState(false);
  const roleLabel = ROLE_INFO[role]?.hudLabel || role;
  const onKillCooldown = killCooldownLeft > 0;

  const killLabel = !nearbyKillTarget
    ? 'NO TARGET NEARBY'
    : onKillCooldown
    ? `COOLDOWN ${Math.ceil(killCooldownLeft / 1000)}s`
    : `KILL ${nearbyKillTarget.color?.id || nearbyKillTarget.username?.toUpperCase() || ''}`;

  return (
    <div className="hud">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div className="hud-pill">{roleLabel}</div>
        {!isSaboteur && (
          <div className="hud-pill">
            TASKS {completedCount}/{totalTasks}
          </div>
        )}
        {!alive && <div className="hud-pill" style={{ color: '#8b98b3' }}>ELIMINATED — SPECTATING</div>}
        <button
          className="btn secondary"
          style={{ padding: '6px 12px', fontSize: 11 }}
          onClick={() => setShowPlayers((s) => !s)}
        >
          PLAYERS {playerList.length}/10
        </button>
      </div>

      {showPlayers && (
        <div
          className="panel fade-in"
          style={{
            position: 'fixed',
            top: 60,
            left: 16,
            width: 220,
            padding: 14,
            zIndex: 45,
            maxHeight: '60vh',
            overflowY: 'auto'
          }}
        >
          {playerList.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="avatar-dot" style={{ background: p.color?.hex || '#334155', width: 12, height: 12 }} />
              <span style={{ fontSize: 12, flex: 1 }}>
                {p.color?.id} — {p.username}
              </span>
              {p.alive === false && <span style={{ fontSize: 10, color: '#8b98b3' }}>DEAD</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {alive && (
          <>
            <button className="btn danger" style={{ padding: '10px 16px', fontSize: 12 }} onClick={onCallMeeting}>
              CALL MEETING
            </button>
            <button
              className="btn secondary"
              style={{ padding: '10px 16px', fontSize: 12 }}
              disabled={!nearbyBody}
              onClick={onReportBody}
            >
              {nearbyBody ? `REPORT ${nearbyBody.victimColor?.id || 'BODY'}` : 'NO BODY NEARBY'}
            </button>
            {isSaboteur && (
              <>
                <button
                  className="btn danger"
                  style={{ padding: '10px 16px', fontSize: 12 }}
                  disabled={!nearbyKillTarget || onKillCooldown}
                  onClick={onKill}
                >
                  {killLabel}
                </button>
                <button
                  className="btn secondary"
                  style={{ padding: '10px 16px', fontSize: 12 }}
                  disabled={cooldowns?.system}
                  onClick={() => onSabotage('system_error')}
                >
                  SYSTEM ERROR
                </button>
                <button
                  className="btn secondary"
                  style={{ padding: '10px 16px', fontSize: 12 }}
                  disabled={cooldowns?.server}
                  onClick={() => onSabotage('disable_server')}
                >
                  DISABLE SERVER
                </button>
              </>
            )}
          </>
        )}
        <button className="btn secondary" style={{ padding: '10px 16px', fontSize: 12 }} onClick={onLeave}>
          LEAVE
        </button>
      </div>
    </div>
  );
}
