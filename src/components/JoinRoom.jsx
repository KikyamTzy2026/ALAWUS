import React, { useState } from 'react';
import { joinRoom } from '../firebase/roomService.js';

export default function JoinRoom({ profile, playerId, onBack, onJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    const roomId = code.trim().toUpperCase();
    if (roomId.length < 4) {
      setError('Enter a valid room code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await joinRoom(roomId, playerId, profile);
      onJoined(roomId);
    } catch (e) {
      setError(e.message || 'Failed to join room.');
      setLoading(false);
    }
  };

  return (
    <div className="panel fade-in" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
      <h2 className="title-font" style={{ marginTop: 0 }}>JOIN GAME</h2>
      <p className="text-muted" style={{ fontSize: 14, marginBottom: 20 }}>
        Enter the room code shared by your host.
      </p>

      <input
        type="text"
        maxLength={5}
        placeholder="ROOM CODE"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        style={{ textAlign: 'center', fontSize: 20, letterSpacing: '0.3em', marginBottom: 16 }}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
      />

      {error && (
        <p style={{ color: '#e0393e', fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn full" onClick={handleJoin} disabled={loading}>
          {loading ? 'JOINING...' : 'JOIN ROOM'}
        </button>
        <button className="btn secondary full" onClick={onBack} disabled={loading}>
          BACK
        </button>
      </div>
    </div>
  );
}
