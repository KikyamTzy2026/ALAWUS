import { db } from '../firebase.js';
import { ref, update, onValue, off } from 'firebase/database';

export function updatePosition(roomId, playerId, x, y) {
  update(ref(db, `rooms/${roomId}/players/${playerId}`), { x, y });
}

export function setAlive(roomId, playerId, alive) {
  update(ref(db, `rooms/${roomId}/players/${playerId}`), { alive });
}

export function assignRole(roomId, playerId, role) {
  update(ref(db, `rooms/${roomId}/players/${playerId}`), { role });
}

export function listenToPlayers(roomId, callback) {
  const playersRef = ref(db, `rooms/${roomId}/players`);
  onValue(playersRef, (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
  return () => off(playersRef);
}
