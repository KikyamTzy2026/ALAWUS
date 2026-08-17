# ALAW US

**Find the Saboteur. Protect the Company.**

An original corporate social-deduction multiplayer game built with React, Vite,
Phaser, and Firebase Realtime Database.

## Features

- Create/join rooms with a 5-character code, up to 10 players
- Lobby with ready-up, host controls (start, kick)
- Original top-down office map (Main Office, IT, Finance, HR, Conference Room,
  Storage, Server Room, Cafeteria) with WASD movement and collision
- Realtime multiplayer position sync via Firebase Realtime Database
- Role assignment (Employee / Saboteur) with an animated reveal
- Six interactive tasks (sequence, hold, sort, match minigames)
- Saboteur sabotage abilities (System Error, Disable Server) with cooldowns,
  plus a proximity-based elimination action
- Emergency meetings / report body, live voting, ejection resolution
- Victory screens for both Employees and Saboteur with match stats

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Firebase

1. Create a project at https://console.firebase.google.com
2. Add a Web App to the project and copy the config values
3. Enable **Realtime Database** (start in test mode, then apply
   `database.rules.json` from this repo — see the Security section below)
4. Anonymous Authentication is optional; this project generates a random
   per-session player ID on the client and does not require Firebase Auth to
   run. If you want to enable Firebase Authentication for extra protection,
   turn on **Anonymous** sign-in under Authentication → Sign-in method.
5. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
```

## 3. Run locally

```bash
npm run dev
```

Open the printed local URL, open a second browser tab (or share your local
network URL with a friend on the same network) to test multiplayer.

## 4. Build

```bash
npm run build
npm run preview
```

## 5. Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Framework preset: **Vite**
4. Add the same environment variables from `.env` in the Vercel project
   settings (Settings → Environment Variables)
5. Deploy — `vercel.json` is included so client-side routing works correctly

## Database structure

```
rooms/
  {roomId}/
    host
    status
    createdAt
    players/
      {playerId}/ { username, color, avatar, x, y, role, alive, ready }
    gameState/
      { phase, timer, winner, sabotage, meetingCaller, ... }
    tasks/
      {taskId}/ { completed }
    votes/
      {playerId}/ { voteTarget }
```

## Security notes

`database.rules.json` ships with permissive rules so the game works
out-of-the-box for casual/private play. Because there is no login system,
Realtime Database rules alone cannot fully distinguish players. For a public
deployment, consider:

- Enabling Firebase Anonymous Authentication and scoping writes to
  `auth.uid === $playerId`
- Adding a Cloud Function to validate host-only actions (starting the game,
  resolving votes) instead of trusting the client
- Rate-limiting room creation

## Tech stack

- React 18 + Vite 5
- Phaser 3 (top-down rendering, input, camera)
- Firebase Realtime Database (state sync)
- Plain CSS (no framework) for the UI shell

## Notes

ALAW US is an original title, story, and map — it does not reuse any
characters, names, maps, or assets from any other game.
