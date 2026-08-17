export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  SABOTEUR: 'SABOTEUR'
};

export const ROLE_INFO = {
  EMPLOYEE: {
    title: 'EMPLOYEE',
    hudLabel: 'EMPLOYEE',
    description: 'Complete company tasks and expose the impostor.'
  },
  SABOTEUR: {
    title: 'IMPOSTOR',
    hudLabel: 'IMPOSTOR',
    description: 'Secretly damage company systems and avoid detection.'
  }
};

// 10 unique player colors (max 10 players per room).
export const COLORS = [
  { id: 'RED', hex: '#c51111' },
  { id: 'BLUE', hex: '#132ed1' },
  { id: 'GREEN', hex: '#117f2d' },
  { id: 'YELLOW', hex: '#f5f557' },
  { id: 'WHITE', hex: '#e9f7ff' },
  { id: 'PINK', hex: '#ee54bb' },
  { id: 'ORANGE', hex: '#f07d0d' },
  { id: 'PURPLE', hex: '#6b2fbb' },
  { id: 'CYAN', hex: '#38fedc' },
  { id: 'LIME', hex: '#50ef39' }
];

export const MAX_PLAYERS = COLORS.length;

export const AVATARS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];

// Reasonable impostor count scaled to lobby size.
// 1-4 players -> 1 impostor, 5-6 -> 1, 7-10 -> 2 impostors.
export function getImpostorCount(playerCount) {
  if (playerCount <= 6) return 1;
  return 2;
}

export const KILL_COOLDOWN_MS = 20000;
export const KILL_RANGE = 34;
export const REPORT_RANGE = 44;
