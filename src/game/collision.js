import { WALLS, WORLD_WIDTH, WORLD_HEIGHT } from './mapData.js';

const PLAYER_RADIUS = 14;

function rectIntersectsCircle(rect, cx, cy, radius) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function isBlocked(x, y) {
  if (x - PLAYER_RADIUS < 0 || x + PLAYER_RADIUS > WORLD_WIDTH) return true;
  if (y - PLAYER_RADIUS < 0 || y + PLAYER_RADIUS > WORLD_HEIGHT) return true;

  for (const wall of WALLS) {
    if (rectIntersectsCircle(wall, x, y, PLAYER_RADIUS)) {
      return true;
    }
  }
  return false;
}

export function resolveMove(x, y, dx, dy) {
  let nx = x + dx;
  let ny = y + dy;

  if (isBlocked(nx, y)) {
    nx = x;
  }
  if (isBlocked(x, ny)) {
    ny = y;
  }
  if (isBlocked(nx, ny)) {
    return { x, y };
  }
  return { x: nx, y: ny };
}
