import React, { useState } from 'react';
import { COLORS, AVATARS } from '../game/roles.js';

export default function MainMenu({ profile, setProfile, onCreate, onJoin }) {
  const [showHowTo, setShowHowTo] = useState(false);
  const canProceed = profile.username.trim().length >= 2 && profile.color;

  return (
    <div className="panel fade-in" style={{ maxWidth: 480, width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 className="title-font" style={{ fontSize: 44, margin: 0, letterSpacing: '0.05em', color: '#e6ebf5' }}>
          ALAW <span style={{ color: '#3b82f6' }}>US</span>
        </h1>
        <p className="text-muted" style={{ marginTop: 8, fontSize: 14 }}>
          Find the Saboteur. Protect the Company.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Username
        </label>
        <input
          type="text"
          maxLength={16}
          placeholder="Enter your name"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
          Character Color
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {COLORS.map((c) => (
            <div
              key={c.id}
              className={`color-swatch${profile.color?.id === c.id ? ' selected' : ''}`}
              style={{ background: c.hex }}
              onClick={() => setProfile({ ...profile, color: c })}
              title={c.id}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
          Avatar
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {AVATARS.map((a) => (
            <div
              key={a}
              onClick={() => setProfile({ ...profile, avatar: a })}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                background: profile.avatar === a ? '#3b82f6' : '#0a0f19',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'background 0.15s ease'
              }}
            >
              {a}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn full" disabled={!canProceed} onClick={onCreate}>
          CREATE GAME
        </button>
        <button className="btn secondary full" disabled={!canProceed} onClick={onJoin}>
          JOIN GAME
        </button>
        <button className="btn secondary full" onClick={() => setShowHowTo(true)}>
          HOW TO PLAY
        </button>
      </div>

      {!canProceed && (
        <p className="text-muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 14 }}>
          Enter a username and pick a color to continue.
        </p>
      )}

      {showHowTo && (
        <div className="role-reveal" onClick={() => setShowHowTo(false)}>
          <div className="panel" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="title-font" style={{ marginTop: 0 }}>HOW TO PLAY</h2>
            <p className="text-muted" style={{ lineHeight: 1.6, fontSize: 14 }}>
              Employees complete tasks around the office to keep the company running.
              One player is secretly the Impostor, working to sabotage systems and
              eliminate employees without being caught. Call a meeting if you find a
              body or suspect someone, then vote to eject a suspect. Employees win by
              finishing all tasks or ejecting the Impostor. The Impostor wins by
              reducing employees to equal or fewer numbers.
            </p>
            <button className="btn full" onClick={() => setShowHowTo(false)}>
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
