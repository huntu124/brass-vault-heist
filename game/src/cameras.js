// THE BRASS VAULT cameras: wall-mounted CCTV units with sweeping view cones.
// A camera that catches the thief raises the alarm meter and pings the nearest guard.
import { TILE, CAM_RANGE, CAM_FOV, CAM_SWEEP } from './config.js';
import { segHitsSolid } from './world.js';

export function makeCamera(c, r, rng) {
  return {
    x: c * TILE + TILE / 2,
    y: r * TILE + TILE / 2,
    dir: rng() * Math.PI * 2,
    spin: rng() < 0.5 ? -1 : 1,
    flipT: 120 + Math.floor(rng() * 180),
  };
}

export function cameraSees(state, cam, px, py) {
  const dx = px - cam.x, dy = py - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAM_RANGE) return false;
  let da = Math.atan2(dy, dx) - cam.dir;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  if (Math.abs(da) > CAM_FOV / 2) return false;
  return !segHitsSolid(state, cam.x, cam.y, px, py);
}

export function stepCameras(state) {
  for (const cam of state.cameras) {
    cam.dir += cam.spin * CAM_SWEEP;
    cam.flipT--;
    if (cam.flipT <= 0) { cam.spin = -cam.spin; cam.flipT = 120 + Math.floor(state.rng() * 180); }
    if (state.status !== 'playing') continue;
    if (cameraSees(state, cam, state.player.x, state.player.y)) {
      state.spotted = true;
      state.alertPings.push({ x: cam.x, y: cam.y, t: 0 });
      let best = null, bd = Infinity;
      for (const g of state.guards) {
        const d = Math.hypot(g.x - cam.x, g.y - cam.y);
        if (d < bd) { bd = d; best = g; }
      }
      if (best) best.lastSeen = { x: state.player.x, y: state.player.y }, best.alert = 1;
    }
  }
}
