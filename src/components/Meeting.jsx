import React, { useEffect, useRef, useState } from 'react';
import Voting from './Voting.jsx';
import { resolveVotes, listenToVotes } from '../firebase/gameService.js';

export default function Meeting({ room, roomId, playerId }) {
  const [votes, setVotes] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(60);
  const resolvedRef = useRef(false);
  const isHost = room.host === playerId;

  useEffect(() => {
    const unsubscribe = listenToVotes(roomId, setVotes);
    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    resolvedRef.current = false;
    setSecondsLeft(60);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [room.gameState?.meetingCaller, room.gameState?.timer]);

  useEffect(() => {
    const players = room.players || {};
    const aliveCount = Object.values(players).filter((p) => p.alive !== false).length;
    const voteCount = Object.keys(votes || {}).length;
    const allVoted = aliveCount > 0 && voteCount >= aliveCount;

    if (isHost && !resolvedRef.current && (secondsLeft === 0 || allVoted)) {
      resolvedRef.current = true;
      resolveVotes(roomId);
    }
  }, [secondsLeft, votes, room.players, isHost, roomId]);

  const caller = room.players?.[room.gameState?.meetingCaller];
  const me = room.players?.[playerId];
  const lastEjected = room.gameState?.lastEjected;
  const ejectedPlayer = lastEjected ? room.players?.[lastEjected] : null;

  return (
    <div className="meeting-overlay">
      <div className="panel fade-in" style={{ maxWidth: 720, width: '92%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2
            className="title-font"
            style={{ margin: 0, color: room.gameState?.meetingReason === 'body' ? (room.gameState?.meetingVictimColor?.hex || '#e6ebf5') : '#e6ebf5' }}
          >
            {room.gameState?.meetingReason === 'body'
              ? `${room.gameState?.meetingVictimColor?.id || ''} — BODY FOUND`
              : 'EMERGENCY MEETING'}
          </h2>
          <div className="hud-pill" style={{ color: secondsLeft <= 10 ? '#e0393e' : '#e6ebf5' }}>
            {secondsLeft}s
          </div>
        </div>
        <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
          {room.gameState?.meetingReason === 'body'
            ? `${room.gameState?.meetingVictimName || 'A player'} was found dead. Reported by ${caller?.username || 'a player'}. Discuss, then cast your vote.`
            : `Called by ${caller?.username || 'a player'}. Discuss, then cast your vote.`}
        </p>

        {ejectedPlayer && (
          <div className="hud-pill" style={{ marginBottom: 16, display: 'inline-block' }}>
            Last meeting: {ejectedPlayer.username} was ejected
            {room.gameState?.lastEjectedWasSaboteur ? ' — they were the Impostor!' : ' — they were not the Impostor.'}
          </div>
        )}

        <Voting
          roomId={roomId}
          players={room.players}
          playerId={playerId}
          votes={votes}
          alive={me?.alive !== false}
        />
      </div>
    </div>
  );
}
