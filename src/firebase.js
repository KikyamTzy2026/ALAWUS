import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDgyLGXaQsYE7lsDFpFwuWsXz1tlIYkY",
  authDomain: "alaw-us.firebaseapp.com",
  databaseURL: "https://alaw-us-default-rtdb.firebaseio.com",
  projectId: "alaw-us",
  storageBucket: "alaw-us.firebasestorage.app",
  messagingSenderId: "189491769454",
  appId: "1:189491769454:web:3aee89cb9e7ae5926e767f"
};

export const isFirebaseConfigured = true;

let app = null;
let db = null;
let auth = null;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);

  console.log("ALAW US Firebase connected");
} catch (err) {
  console.error("Firebase failed to initialize:", err);
}

export { db, auth };

export async function ensureAuth() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  return auth.currentUser;
}
