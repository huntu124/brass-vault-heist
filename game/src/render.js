// THE BRASS VAULT renderer: canvas drawing of map, guard and camera cones, the vault, loot and HUD.
import { TILE, COLS, ROWS, WIDTH, HEIGHT, VISION_RANGE, VISION_FOV, CAM_RANGE, CAM_FOV, VAULT_CRACK_TICKS } from './config.js';
import { tileAt, guardSees } from './world.js';
import { cameraSees } from './cameras.js';

const COLORS = {
  wall: '#3a4358', wallTop: '#4d5872', floor: '#1b2130', carpet: '#241f38', crate: '#7a5a33',
  crateTop: '#7a5a33', exitLocked: '#5c1c1c', exitOpen: '#1c5c3a', player: '#e8d87a', guard: '#c04b4b',
  coneLit: 'rgba(255,96,60,0.34)', cone: 'rgba(255,160,90,0.18)', camCone: 'rgba(90,235,195,0.16)',
  hud: '#cfd6e4', alert: '#ff5a5a', gold: '#f5c542',
};

export function render(ctx, state) {
  // Floor
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Vision cones drawn under entities
  for (const g of state.guards) drawGuardCone(ctx, state, g);
  for (const cam of state.cameras) drawCamCone(ctx, state, cam);

  // Tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = tileAt(state.map, c, r);
      const x = c * TILE, y = r * TILE;
      if (t === '#') {
        ctx.fillStyle = COLORS.wall; ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop; ctx.fillRect(x, y, TILE, 4);
      } else if (t === 'c') {
        ctx.fillStyle = COLORS.crate; ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.crateTop; ctx.fillRect(x + 3, y + 3, TILE - 6, 5);
      } else if (t === 'E') {
        const open = !state.vault || state.vault.cracked;
        ctx.fillStyle = open ? COLORS.exitOpen : COLORS.exitLocked;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = open ? '#57e389' : '#ff8888';
        ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        ctx.fillText(open ? 'GETAWAY' : 'LOCKED', x + TILE / 2, y + TILE / 2 + 4);
      }
      // Subtle checker on the gallery floor
      if (t === '.' && (r + c) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.022)';
        ctx.fillRect(x, y, TILE - 1, TILE - 1);
      }
    }
  }

  // Loot bags
  for (const bag of state.loot) {
    if (bag.taken) continue;
    const bob = Math.sin((state.steps + bag.x) / 18) * 2;
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(bag.x - 10, bag.y + 8 + bob);
    ctx.lineTo(bag.x, bag.y - 8 + bob);
    ctx.lineTo(bag.x + 10, bag.y + 8 + bob);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a6a10'; ctx.stroke();
  }

  // The vault: a brass-ringed safe with a drill progress ring
  if (state.vault) {
    const v = state.vault;
    ctx.fillStyle = '#3d3428';
    ctx.beginPath(); ctx.arc(v.x, v.y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(v.x, v.y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#241f16'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(v.x - 9, v.y); ctx.lineTo(v.x + 9, v.y); ctx.stroke();
    if (!v.cracked && v.progress > 0) {
      ctx.strokeStyle = '#8ef0ff'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 26, -Math.PI / 2, -Math.PI / 2 + (v.progress / VAULT_CRACK_TICKS) * Math.PI * 2);
      ctx.stroke();
    }
    if (v.cracked) {
      ctx.fillStyle = '#8ef0ff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('OPEN', v.x, v.y - 26);
    }
  }

  // Alert pings
  for (const p of state.alertPings) {
    ctx.strokeStyle = `rgba(255,90,90,${Math.max(0, 1 - p.t / 40)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 + p.t, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cameras: a dark body on its wall tile with a lens toward its facing
  for (const cam of state.cameras) {
    ctx.fillStyle = '#20242e';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#69d4b0'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#a7ffe4';
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.dir) * 13, cam.y + Math.sin(cam.dir) * 13);
    ctx.stroke();
  }

  // Guards
  for (const g of state.guards) {
    ctx.fillStyle = g.alert ? COLORS.alert : COLORS.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1d26'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#ffd7d7'; ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 16, g.y + Math.sin(g.dir) * 16);
    ctx.stroke();
  }

  // Player thief
  const p = state.player;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1a1d26'; ctx.lineWidth = 2; ctx.stroke();
  if (state.carrying > 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(p.x - 6, p.y - 24, 12, 8);
    ctx.fillStyle = '#8a6a10'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('$', p.x, p.y - 17);
  }

  // HUD
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hud;
  ctx.font = '14px monospace';
  ctx.fillText(`THE BRASS VAULT — ${state.levelName}  (job ${state.levelIndex + 1}/3)`, 12, 22);
  ctx.fillText('WASD move · SHIFT sneak · hold E to drill · R restart', 12, 40);
  // Loot tally
  const score = state.banked || state.carrying * 500;
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`LOOT $${score}`, 12, 60);
  // Alarm meter
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(WIDTH - 240, 14, 220, 12);
  const hot = state.alarm > 0.55;
  ctx.fillStyle = hot ? COLORS.alert : '#e8b84a';
  ctx.fillRect(WIDTH - 240, 14, 220 * state.alarm, 12);
  ctx.strokeStyle = '#0a0d14'; ctx.strokeRect(WIDTH - 240, 14, 220, 12);
  ctx.fillStyle = hot ? COLORS.alert : COLORS.hud;
  ctx.fillText(hot ? 'ALARM RISING!' : 'alarm meter', WIDTH - 240, 44);

  // Banner
  if (state.status !== 'playing' || state.bannerT > 0) {
    const mid = state.status !== 'playing';
    if (mid) {
      ctx.fillStyle = 'rgba(6,8,12,0.72)';
      ctx.fillRect(0, HEIGHT / 2 - 60, WIDTH, 120);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = mid ? (state.status === 'won' ? '#57e389' : COLORS.alert) : '#ffe9a8';
    ctx.font = mid ? 'bold 34px monospace' : 'bold 20px monospace';
    ctx.fillText(state.banner || (state.status === 'won' ? 'CLEAN GETAWAY' : 'BUSTED'), WIDTH / 2, mid ? HEIGHT / 2 + 4 : HEIGHT - 24);
    if (mid) {
      ctx.fillStyle = COLORS.hud;
      ctx.font = '16px monospace';
      ctx.fillText(state.status === 'won' ? 'press N for the next job' : 'press R to try again', WIDTH / 2, HEIGHT / 2 + 40);
    }
  }
}

function drawGuardCone(ctx, state, g) {
  const sees = guardSees(state, g, state.player.x, state.player.y);
  ctx.fillStyle = (sees || g.alert) ? COLORS.coneLit : COLORS.cone;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, VISION_RANGE, g.dir - VISION_FOV / 2, g.dir + VISION_FOV / 2);
  ctx.closePath();
  ctx.fill();
}

function drawCamCone(ctx, state, cam) {
  const sees = cameraSees(state, cam, state.player.x, state.player.y);
  ctx.fillStyle = sees ? COLORS.coneLit : COLORS.camCone;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.arc(cam.x, cam.y, CAM_RANGE, cam.dir - CAM_FOV / 2, cam.dir + CAM_FOV / 2);
  ctx.closePath();
  ctx.fill();
}
