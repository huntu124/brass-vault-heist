// THE BRASS VAULT configuration: tile size, canvas size, timing and tuning knobs.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const WIDTH = COLS * TILE;   // 1280
export const HEIGHT = ROWS * TILE;  // 720

export const PLAYER_SPEED = 3.4;      // px per tick, walking
export const SNEAK_SPEED = 1.6;       // px per tick, sneaking (Shift)
export const PLAYER_RADIUS = 11;
export const GUARD_ALERT_SPEED = 2.2;
export const GUARD_RADIUS = 12;

export const VISION_RANGE = 300;      // px, guard sight distance
export const VISION_FOV = (70 * Math.PI) / 180; // degrees of the vision cone
export const CATCH_RANGE = 20;        // px, guard touching the player

export const CAM_RANGE = 260;         // px, camera sight distance
export const CAM_FOV = (55 * Math.PI) / 180; // degrees of a camera's view cone
export const CAM_SWEEP = 0.011;       // radians per tick a camera sweeps

export const DETECT_RATE = 0.55;      // alarm gained per tick while spotted
export const DECAY_RATE = 0.2;        // alarm lost per tick hidden
export const ALARM_MAX = 1.0;         // alarm that triggers lockdown

export const VAULT_RANGE = 52;        // px: stand this close to crack the vault
export const VAULT_CRACK_TICKS = 150; // ticks of holding E to crack the vault
export const LOOT_VALUE = 500;        // score per loot bag carried out

export const NOISE_WALK = 130;        // px radius: running footsteps alert guards
export const NOISE_SNEAK = 30;

export const TICK_MS = 1000 / 60;
export const MAX_LEVELS = 3;
