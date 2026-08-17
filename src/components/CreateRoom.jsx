import React, { useState } from 'react';
import { createRoom } from '../firebase/roomService.js';

export default function CreateRoom({ profile, playerId, onBack, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const roomId = await createRoom(playerId, profile);
      onCreated(roomId);
    } catch (e) {
      setError(e.message || 'Failed to create room.');
      setLoading(false);
    }
  };

  return (
    <div className="panel fade-in" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
      <h2 className="title-font" style={{ marginTop: 0 }}>CREATE GAME</h2>
      <p className="text-muted" style={{ fontSize: 14, marginBottom: 28 }}>
        A new company room will be generated with a unique code your friends can use
        to join. You'll be the host.
      </p>

      {error && (
        <p style={{ color: '#e0393e', fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn full" onClick={handleCreate} disabled={loading}>
          {loading ? 'CREATING ROOM...' : 'GENERATE ROOM CODE'}
        </button>
        <button className="btn secondary full" onClick={onBack} disabled={loading}>
          BACK
        </button>
      </div>
    </div>
  );
}
