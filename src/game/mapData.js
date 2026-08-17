// Original top-down office map. All coordinates in world pixels.
// World size: 900 x 600

export const WORLD_WIDTH = 900;
export const WORLD_HEIGHT = 600;

export const ROOMS = [
  { id: 'main_office', name: 'Main Office', x: 350, y: 220, w: 200, h: 160, color: 0x1e293b },
  { id: 'it_department', name: 'IT Department', x: 60, y: 60, w: 220, h: 160, color: 0x172554 },
  { id: 'finance_room', name: 'Finance Room', x: 560, y: 60, w: 220, h: 160, color: 0x14532d },
  { id: 'hr_department', name: 'HR Department', x: 560, y: 340, w: 220, h: 160, color: 0x581c87 },
  { id: 'conference_room', name: 'Conference Room', x: 350, y: 400, w: 200, h: 140, color: 0x7c2d12 },
  { id: 'storage', name: 'Storage', x: 60, y: 400, w: 220, h: 140, color: 0x374151 },
  { id: 'server_room', name: 'Server Room', x: 60, y: 240, w: 220, h: 140, color: 0x0f172a },
  { id: 'cafeteria', name: 'Cafeteria', x: 760, y: 240, w: 120, h: 260, color: 0x78350f }
];

// Walls as rectangles (x, y, w, h) used for simple AABB collision.
export const WALLS = [
  // outer boundary
  { x: 0, y: 0, w: WORLD_WIDTH, h: 20 },
  { x: 0, y: 0, w: 20, h: WORLD_HEIGHT },
  { x: WORLD_WIDTH - 20, y: 0, w: 20, h: WORLD_HEIGHT },
  { x: 0, y: WORLD_HEIGHT - 20, w: WORLD_WIDTH, h: 20 },

  // internal separators (with door gaps built in visually via renderer)
  { x: 280, y: 20, w: 20, h: 180 }, // IT / Main divider (top)
  { x: 280, y: 300, w: 20, h: 100 },
  { x: 540, y: 20, w: 20, h: 180 }, // Main / Finance divider
  { x: 540, y: 300, w: 20, h: 100 },
  { x: 280, y: 400, w: 60, h: 20 }, // storage/office divider
  { x: 500, y: 400, w: 60, h: 20 }, // office/conference divider

  { x: 736, y: 20, w: 24, h: 560 } // cafeteria wall
];

export const SPAWN_POINTS = [
  { x: 420, y: 280 },
  { x: 450, y: 280 },
  { x: 420, y: 310 },
  { x: 450, y: 310 },
  { x: 400, y: 260 },
  { x: 480, y: 260 },
  { x: 400, y: 330 },
  { x: 480, y: 330 },
  { x: 420, y: 250 },
  { x: 450, y: 250 }
];
