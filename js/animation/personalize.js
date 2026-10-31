// personalize.js — the turns PES 2021 adds on top of a clip from the player's hunching and arm movement
// settings, for clips the game flags as personalized (assets/animations/personalized.json). The angles are
// the game's own tables from PES2021.exe; research/hand-animations/personalized-motion.md has where they
// are and how the game applies them.

/** Hunching levels 0–4 and arm movement levels 0–9; 0 changes nothing. */
export const HUNCHING_LEVELS = 5, ARM_LEVELS = 10;

// The game switches to its "fast" tables above this running speed (km/h, as far as can be told), and drops
// arm level 4 below the slow one.
const FAST_KMH = 22, SLOW_ARM_KMH = 13.5;

// The back: [bone, axis in the bone's bind frame, degrees by level, degrees by level when fast]. Each turns
// about its bind Z, which runs across the body, so it leans the bone forward or back. (The game's hip slot
// is in the list too, but 0 at every level.)
const SPINE = [
  ['sk_belly', [0, 0, 1], [0, -5, 6, -7, 0], [0, -5, 6, -7, 0]],
  ['sk_chest', [0, 0, 1], [0, -4, 4, 20, 0], [0, -4, 4, 15, 0]],
  ['sk_neck', [0, 0, 1], [0, 0, 0, 0, -22.5], [0, 0, 0, 0, -22.5]],
  ['sk_head', [0, 0, 1], [0, 0, 0, 0, 22.5], [0, 0, 0, 0, 22.5]],
];

// An arm's seven turns in the game's row order: hand X, hand Z, hand Y, elbow (forearm Z), upper arm Y,
// upper arm X, upper arm Z; degrees by level 0–9. Set A is for the arm on the side of the player's strong
// foot, set B for the other; each has a slow and a fast table. Both arms use the same numbers.
const ARM_A = [
  [0, 0, 0, 0, 0, 20, 0, 0, 45, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, -22.5, 0],
  [0, 25, -3, 3, 0, -3, 15, -5, 22.5, 0],
  [0, -20, 15, -25, -5, 8, 5, 20, 0, 15],
  [0, -5, 5, -5, -8, -5, -10, 0, 0, -5],
  [0, 0, -10, 0, 28, 30, 30, 12, -5, 15],
  [0, -20, -20, 5, 0, -15, -15, 0, -20, 20],
];
const ARM_A_FAST = [
  ARM_A[0], ARM_A[1], ARM_A[2],
  [0, -20, 15, -25, -5, 8, 5, 12, 0, 15],
  ARM_A[4],
  [0, 0, -10, 0, 15, 30, 20, 12, -5, 10],
  [0, -20, -20, 5, 0, -15, -15, 0, -20, 0],
];
const ARM_B = [
  [0, 0, 0, 0, 0, 20, 0, 0, 90, 0],
  [0, 0, 0, 0, 0, -20, 0, 0, -45, 0],
  [0, 25, -3, 3, 0, 0, -12, -5, 22.5, 0],
  [0, -20, 15, -25, -5, -20, -5, -10, 0, 15],
  [0, -5, 5, -5, -8, -5, -5, -3, 0, -5],
  [0, 0, -10, 0, 28, 0, 10, -8, -5, 15],
  [0, -20, -20, 5, 0, 5, 0, -20, -20, 20],
];
const ARM_B_FAST = [
  ARM_B[0], ARM_B[1], ARM_B[2], ARM_B[3], ARM_B[4],
  [0, 0, -10, 0, 15, 0, 10, -8, -5, 10],
  [0, -20, -20, 5, 0, 5, 0, -20, -20, 0],
];

// Each row's bone and bind-frame axis, per side, listed in the order the game applies them (its slots
// 9–15 and 16–22): [row, bone, axis].
const ARM_SLOTS = {
  l: [[0, 'sk_hand_l', [1, 0, 0]], [1, 'sk_hand_l', [0, 0, 1]], [2, 'sk_hand_l', [0, 1, 0]], [3, 'sk_forearm_l', [0, 0, 1]],
    [5, 'sk_upperarm_l', [-1, 0, 0]], [6, 'sk_upperarm_l', [0, 0, 1]], [4, 'sk_upperarm_l', [0, 1, 0]]],
  r: [[0, 'sk_hand_r', [-1, 0, 0]], [1, 'sk_hand_r', [0, 0, 1]], [2, 'sk_hand_r', [0, -1, 0]], [3, 'sk_forearm_r', [0, 0, 1]],
    [5, 'sk_upperarm_r', [1, 0, 0]], [6, 'sk_upperarm_r', [0, 0, 1]], [4, 'sk_upperarm_r', [0, -1, 0]]],
};

/**
 * The turns for a clip whose flagged `parts` are { spine, leftarm, rightarm }, running at `kmh`, for a player
 * with `hunching` and `arm` levels and strong foot `foot` ('l' or 'r'): [{ bone, axis, degrees }] in the order
 * the game applies them, each axis in the bone's bind frame. Empty when nothing turns.
 */
export function personalTurns(parts, { hunching = 0, arm = 0, foot = 'r' }, kmh = 0) {
  const turns = [], fast = kmh > FAST_KMH;
  if (parts?.spine && hunching > 0 && hunching < HUNCHING_LEVELS) {
    for (const [bone, axis, slow, quick] of SPINE) turns.push({ bone, axis, degrees: (fast ? quick : slow)[hunching] });
  }
  const level = arm === 4 && kmh < SLOW_ARM_KMH ? 0 : arm;
  for (const [s, flag] of [['l', parts?.leftarm], ['r', parts?.rightarm]]) {
    if (!flag || level <= 0 || level >= ARM_LEVELS) continue;
    const table = s === foot ? (fast ? ARM_A_FAST : ARM_A) : fast ? ARM_B_FAST : ARM_B;
    for (const [row, bone, axis] of ARM_SLOTS[s]) turns.push({ bone, axis, degrees: table[row][level] });
  }
  return turns.filter((t) => t.degrees);
}
