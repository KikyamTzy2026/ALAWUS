import React, { useState } from 'react';
import { castVote } from '../firebase/gameService.js';

export default function Voting({ roomId, players, playerId, votes, alive }) {
  const [selected, setSelected] = useState(votes?.[playerId]?.voteTarget || null);

  const playerList = Object.entries(players || {})
    .map(([id, p]) => ({ id, ...p }))
    .filter((p) => p.alive !== false);

  const handleVote = (targetId) => {
    if (!alive) return;
    setSelected(targetId);
    castVote(roomId, playerId, targetId);
  };

  const voteCountFor = (id) =>
    Object.values(votes || {}).filter((v) => v.voteTarget === id).length;

  if (!alive) {
    return (
      <p className="text-muted" style={{ fontSize: 13, textAlign: 'center' }}>
        You have been eliminated and cannot vote. Watch the outcome.
      </p>
    );
  }

  return (
    <div className="vote-grid">
      {playerList.map((p) => (
        <div
          key={p.id}
          className={`vote-card${selected === p.id ? ' selected' : ''}`}
          onClick={() => handleVote(p.id)}
        >
          <div
            className="avatar-dot"
            style={{ background: p.color?.hex || '#334155', margin: '0 auto 8px' }}
          />
          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.username}</div>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
            {voteCountFor(p.id)} vote{voteCountFor(p.id) === 1 ? '' : 's'}
          </div>
        </div>
      ))}
      <div className={`vote-card${selected === 'skip' ? ' selected' : ''}`} onClick={() => handleVote('skip')}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>⏭</div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Skip Vote</div>
        <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
          {voteCountFor('skip')} vote{voteCountFor('skip') === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
}
