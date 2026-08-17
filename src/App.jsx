import React, { useEffect, useState, useCallback } from 'react';
import MainMenu from './components/MainMenu.jsx';
import CreateRoom from './components/CreateRoom.jsx';
import JoinRoom from './components/JoinRoom.jsx';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import Victory from './components/Victory.jsx';
import { listenToRoom, leaveRoom } from './firebase/roomService.js';
import { isFirebaseConfigured } from './firebase.js';

function getPlayerId() {
  let id = sessionStorage.getItem('alawus_player_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('alawus_player_id', id);
  }
  return id;
}

export default function App() {
  const [screen, setScreen] = useState('menu'); // menu | create | join | lobby | game | victory
  const [profile, setProfile] = useState({ username: '', color: null, avatar: 'A1' });
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);
  const playerId = getPlayerId();

  useEffect(() => {
    if (!roomId) return undefined;
    const unsubscribe = listenToRoom(roomId, (data) => {
      setRoom(data);
      if (!data) {
        // room was deleted
        setScreen('menu');
        setRoomId(null);
        return;
      }
      if (data.gameState?.phase === 'ended') {
        setScreen('victory');
      } else if (data.status === 'playing' && screen === 'lobby') {
        setScreen('game');
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleRoomCreated = useCallback((id) => {
    setRoomId(id);
    setScreen('lobby');
  }, []);

  const handleRoomJoined = useCallback((id) => {
    setRoomId(id);
    setScreen('lobby');
  }, []);

  const handleLeave = useCallback(async () => {
    if (roomId) {
      try {
        await leaveRoom(roomId, playerId);
      } catch (e) {
        // ignore
      }
    }
    setRoomId(null);
    setRoom(null);
    setScreen('menu');
  }, [roomId, playerId]);

  const handleGameStart = useCallback(() => {
    setScreen('game');
  }, []);

  const handlePlayAgain = useCallback(() => {
    setRoomId(null);
    setRoom(null);
    setScreen('menu');
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="app-shell">
        <div className="panel" style={{ maxWidth: 480, textAlign: 'center' }}>
          <h2 className="title-font" style={{ marginTop: 0 }}>SETUP NEEDED</h2>
          <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            ALAW US needs Firebase environment variables to run. Copy
            <code style={{ margin: '0 4px' }}>.env.example</code> to
            <code style={{ margin: '0 4px' }}>.env</code> locally, or add
            <code style={{ margin: '0 4px' }}>VITE_FIREBASE_API_KEY</code>,
            <code style={{ margin: '0 4px' }}>VITE_FIREBASE_AUTH_DOMAIN</code>,
            <code style={{ margin: '0 4px' }}>VITE_FIREBASE_DATABASE_URL</code>, and
            <code style={{ margin: '0 4px' }}>VITE_FIREBASE_PROJECT_ID</code>
            in your Vercel Project Settings → Environment Variables, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {screen === 'menu' && (
        <MainMenu
          profile={profile}
          setProfile={setProfile}
          onCreate={() => setScreen('create')}
          onJoin={() => setScreen('join')}
        />
      )}

      {screen === 'create' && (
        <CreateRoom
          profile={profile}
          playerId={playerId}
          onBack={() => setScreen('menu')}
          onCreated={handleRoomCreated}
        />
      )}

      {screen === 'join' && (
        <JoinRoom
          profile={profile}
          playerId={playerId}
          onBack={() => setScreen('menu')}
          onJoined={handleRoomJoined}
        />
      )}

      {(screen === 'game' || screen === 'lobby' || screen === 'victory') && !room && (
        <div className="loading-screen">
          <h2 className="title-font" style={{ fontSize: 28 }}>ALAW US</h2>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
          <p className="text-muted" style={{ fontSize: 13 }}>Connecting…</p>
        </div>
      )}

      {screen === 'lobby' && room && (
        <Lobby
          room={room}
          roomId={roomId}
          playerId={playerId}
          onLeave={handleLeave}
          onGameStart={handleGameStart}
        />
      )}

      {screen === 'game' && room && room.status === 'playing' && (
        <Game room={room} roomId={roomId} playerId={playerId} onLeave={handleLeave} />
      )}

      {screen === 'game' && room && room.status !== 'playing' && (
        <div className="loading-screen">
          <h2 className="title-font" style={{ fontSize: 28 }}>ALAW US</h2>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
          <p className="text-muted" style={{ fontSize: 13 }}>Starting the round…</p>
        </div>
      )}

      {screen === 'victory' && room && (
        <Victory room={room} playerId={playerId} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
