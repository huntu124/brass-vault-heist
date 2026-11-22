// Deterministic screenshot driver: ?shot=start|play|end&seed=N plays scripted
// inputs for N frames then freezes, so the shots are real renders of the game.
import { mulberry32 } from './random.js';

// Simple scripted routes per shot: sequences of {frames, move:{x,y}, sneak}
const SCRIPTS = {
  start: [{ frames: 1, move: { x: 0, y: 0 } }],
  vault: [{ frames: 100, move: { x: 0, y: 0 }, crack: true }],
  play: [
    { frames: 30, move: { x: 1, y: 0 } },
    { frames: 150, move: { x: 1, y: 1 }, sneak: true },
    { frames: 120, move: { x: 1, y: 0 }, sneak: true },
    { frames: 40, move: { x: 0.4, y: 1 }, sneak: true },
    { frames: 90, move: { x: 0, y: 0 }, crack: true },
  ],
  end: [
    { frames: 40, move: { x: 0, y: 1 } },
    { frames: 160, move: { x: 1, y: 0.6 }, sneak: true },
    { frames: 120, move: { x: 1, y: -0.4 }, sneak: true },
    { frames: 60, move: { x: 0.5, y: 1 }, sneak: true },
    { frames: 110, move: { x: 0, y: 0 }, crack: true },
    { frames: 120, move: { x: 1, y: 0.5 }, sneak: true },
  ],
};

export function makeShotDriver(params) {
  const shot = params.get('shot');
  if (!shot || !SCRIPTS[shot]) return null;
  const seed = Number(params.get('seed') || 1);
  const rng = mulberry32(seed);
  const frames = SCRIPTS[shot].reduce((s, seg) => s + seg.frames, 0);
  let consumed = 0;
  return {
    rng,
    frame(moveRef, sneakRef, crackRef) {
      if (consumed >= frames) return false;
      let acc = 0;
      for (const seg of SCRIPTS[shot]) {
        if (consumed < acc + seg.frames) {
          moveRef.x = seg.move.x; moveRef.y = seg.move.y;
          if (seg.sneak) sneakRef.on = true;
          if (seg.crack) crackRef.on = true;
          break;
        }
        acc += seg.frames;
      }
      consumed++;
      return consumed < frames;
    },
    get done() { return consumed >= frames; },
  };
}
