export const MOVE_SPEED = 3.2; // pixels per frame at 60fps baseline

export function createInputState(scene) {
  const keys = scene.input.keyboard.addKeys({
    up: 'W',
    down: 'S',
    left: 'A',
    right: 'D',
    up2: 'UP',
    down2: 'DOWN',
    left2: 'LEFT',
    right2: 'RIGHT'
  });
  return keys;
}

export function getMovementDelta(keys, speed = MOVE_SPEED) {
  let dx = 0;
  let dy = 0;

  if (keys.left.isDown || keys.left2.isDown) dx -= 1;
  if (keys.right.isDown || keys.right2.isDown) dx += 1;
  if (keys.up.isDown || keys.up2.isDown) dy -= 1;
  if (keys.down.isDown || keys.down2.isDown) dy += 1;

  if (dx !== 0 && dy !== 0) {
    // normalize diagonal movement
    const norm = Math.SQRT1_2;
    dx *= norm;
    dy *= norm;
  }

  return { dx: dx * speed, dy: dy * speed };
}
