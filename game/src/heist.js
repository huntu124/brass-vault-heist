// THE BRASS VAULT heist logic: the vault target, loose loot bags and the getaway door.
// Crack the vault (hold E beside it), grab what loot you can, slip out the getaway door.
import { TILE, VAULT_RANGE, VAULT_CRACK_TICKS, LOOT_VALUE } from './config.js';

export function findHeistPoints(state) {
  for (let r = 0; r < state.map.length; r++) {
    for (let c = 0; c < state.map[r].length; c++) {
      const t = state.map[r][c];
      const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
      if (t === 'V') state.vault = { x, y, progress: 0, cracked: false };
      if (t === 'L') state.loot.push({ x, y, taken: false });
    }
  }
}

export function stepHeist(state, crackHeld) {
  if (state.vault && !state.vault.cracked) {
    const d = Math.hypot(state.vault.x - state.player.x, state.vault.y - state.player.y);
    if (d < VAULT_RANGE && crackHeld) {
      state.vault.progress++;
      state.drilling = true;
      if (state.vault.progress >= VAULT_CRACK_TICKS) {
        state.vault.cracked = true;
        state.banner = 'VAULT CRACKED — head for the getaway';
        state.bannerT = 150;
      }
    } else {
      state.drilling = false;
    }
  }
  for (const bag of state.loot) {
    if (!bag.taken && Math.hypot(bag.x - state.player.x, bag.y - state.player.y) < TILE) {
      bag.taken = true;
      state.carrying++;
      state.banner = 'LOOT BAG secured — escape with it';
      state.bannerT = 150;
    }
  }
}

export function bankScore(state) {
  return state.banked + state.carrying * LOOT_VALUE;
}
