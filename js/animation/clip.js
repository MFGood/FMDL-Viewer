// clip.js — keyframed animation clips on the PES skeleton: .anim text clips and PES's own .gani motions.
// A clip is { frames, fps, parents, rotations, hip, legsStraight, ground }: rotations (Map bone -> keys,
// [[frame, quaternion], …]) relative to the bone's parent in the clip's own rig (`parents`), and the hip's
// offset from rest (keys of [x, y, z] in PES axes and meters). Both rigs hold the arms straight out at
// rest (a T-pose), where PES's rest pose is an A-pose with identity rotations, so each arm is first
// turned from its A-pose direction to the T-pose one, then by the clip; the .anim rig's legs hang
// straight down too (legsStraight). Clips play in place, looping. A clip may also carry hand poses
// (hands: { l, r }, see withHands), which the fingers blend between as it plays.

import { qMul, qInv, qRotate, qSlerp, qFromTo, norm, sub, forwardKinematics } from './quat.js';
import { parseGani } from '../formats/gani.js';

// ---------------------------------------------------------------- .anim

// An .anim file is text: one line per bone, "name,frame,values,frame,values,…", then a few <tag>s.
// `player` keys are a position (x, y, z), every other bone's a rotation quaternion (x, y, z, w).
// Axes: +X = the player's left, -Y = forward, +Z = up. Rotations are relative to a T-pose rig
// (<tpose_rig> 1) and to the bone's parent, as below.
const ANIM_FPS = 30; // not in the files; strides come out about right at 30

// .anim bone -> [PES bone, parent .anim bone]. `hip` is the legs' pelvis under `body`; PES has one bone
// (dsk_hip) for both, so the legs get body × hip and the spine just body.
const ANIM_BONES = {
  body: ['dsk_hip', null], hip: ['(hip)', 'body'],
  middle: ['sk_belly', 'body'], chest: ['sk_chest', 'middle'], neck: ['sk_neck', 'chest'], head: ['sk_head', 'neck'],
};
for (const [side, s] of [['left', 'l'], ['right', 'r']]) Object.assign(ANIM_BONES, {
  [`${side}_shoulder`]: [`sk_upperarm_${s}`, 'chest'], [`${side}_elbow`]: [`sk_forearm_${s}`, `${side}_shoulder`],
  [`${side}_hand`]: [`sk_hand_${s}`, `${side}_elbow`],
  [`${side}_thigh`]: [`sk_thigh_${s}`, 'hip'], [`${side}_knee`]: [`sk_leg_${s}`, `${side}_thigh`],
  [`${side}_ankle`]: [`sk_foot_${s}`, `${side}_knee`],
});
const ANIM_PARENTS = Object.fromEntries(Object.values(ANIM_BONES).map(([bone, parent]) => [bone, parent && ANIM_BONES[parent][0]]));

/** .anim axes -> PES axes: (x, y, z) -> (x, z, -y). It's a proper rotation, so quaternions map the same way. */
const toPes = (v) => [v[0], v[2], -v[1]];

/** Parse an .anim file into a clip. */
export function parseAnim(text) {
  const rotations = new Map();
  let frames = 0, player = null;
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(',');
    if (parts.length < 4 || parts[0].startsWith('<')) continue;
    const name = parts[0], size = name === 'player' ? 3 : 4, keys = [];
    if (name !== 'player' && !ANIM_BONES[name]) continue;
    for (let i = 1; i + size < parts.length + 1; i += size + 1) {
      if (parts[i] === '') break;
      const values = parts.slice(i + 1, i + 1 + size).map(Number);
      if (values.length < size || values.some(Number.isNaN)) break;
      keys.push([Number(parts[i]), name === 'player' ? toPes(values) : [...toPes(values), values[3]]]);
    }
    if (!keys.length) continue;
    keys.sort((a, b) => a[0] - b[0]);
    if (name === 'player') player = keys; else rotations.set(ANIM_BONES[name][0], keys);
    frames = Math.max(frames, keys[keys.length - 1][0]);
  }
  if (!rotations.size) throw new Error('No bone keys in this .anim file');
  // The player position is the hip's, travel and all; its height comes from a rig that isn't PES's, so
  // the clip is grounded instead (see placement) and only the height's changes are kept.
  return { frames, fps: ANIM_FPS, parents: ANIM_PARENTS, rotations, hip: player && withoutTravel(player), legsStraight: true, ground: 'clip' };
}

/** Position keys with the travel from the first to the last key taken out, so it plays in place but keeps its sway. */
function withoutTravel(keys) {
  const [f0, a] = keys[0], [f1, b] = keys[keys.length - 1], span = f1 - f0;
  return keys.map(([f, p]) => {
    const u = span > 0 ? (f - f0) / span : 0;
    return [f, [p[0] - (a[0] + (b[0] - a[0]) * u), p[1], p[2] - (a[2] + (b[2] - a[2]) * u)]];
  });
}

// ---------------------------------------------------------------- .gani

// The animation skeleton's parents (PES's player_skeletons.hkx); ROOT is the player's place and facing.
const GANI_PARENTS = { ROOT: null, sk_root_hip: 'ROOT', dsk_hip: 'sk_root_hip', sk_belly: 'sk_root_hip', sk_chest: 'sk_belly', sk_neck: 'sk_chest', sk_head: 'sk_neck' };
for (const s of ['l', 'r']) Object.assign(GANI_PARENTS, {
  [`sk_shoulder_${s}`]: 'sk_chest', [`sk_upperarm_${s}`]: `sk_shoulder_${s}`, [`sk_forearm_${s}`]: `sk_upperarm_${s}`,
  [`sk_hand_${s}`]: `sk_forearm_${s}`, [`sk_thigh_${s}`]: 'dsk_hip', [`sk_leg_${s}`]: `sk_thigh_${s}`, [`sk_foot_${s}`]: `sk_leg_${s}`,
});

/** Parse a PES 2018–2021 body .gani into a clip. Its hip moves in centimeters from rest, under ROOT's facing. */
export function ganiClip(buffer) {
  const { frames, fps, tracks } = parseGani(buffer);
  const rotations = new Map();
  for (const bone of Object.keys(GANI_PARENTS)) if (tracks.has(`${bone}:rotation`)) rotations.set(bone, tracks.get(`${bone}:rotation`));
  const hip = tracks.get('sk_root_hip:position')?.map(([f, p]) => [f, p.map((x) => x / 100)]);
  // ROOT's own travel (the player running across the pitch) is left out, so the clip plays in place.
  // The game's rig and foot IK don't quite match this skeleton, so a planted foot can sink a few
  // centimeters; each frame is lifted just enough to keep the feet out of the floor.
  return { frames, fps, parents: GANI_PARENTS, rotations, hip, hipFrame: 'ROOT', legsStraight: false, ground: 'frame' };
}

// ---------------------------------------------------------------- hands

// The finger joints, parents before children (the game's hand rig and PES's skeleton agree on the parents).
const FINGERS = ['thumb_mata', 'thumb_mcp', 'thumb_pip', ...['index', 'middle', 'ring', 'pinky'].flatMap((f) => ['mata', 'mcp', 'pip', 'dip'].map((j) => `${f}_${j}`))];

// The game's hand rig (hand_anim_skel) lies turned from PES's hand: this rotation takes its rest positions
// onto PES's left-hand bones exactly (a fit of all 19 joints, research/hand-animations). A finger's rotation
// in the game's rig is HAND_RIG · q · HAND_RIG⁻¹ in PES's; the right hand's rig is its mirror.
const HAND_RIG = { l: [0.62851, -0.26665, -0.27235, 0.67802], r: [0.62851, 0.26665, 0.27235, 0.67802] };

/** A left-hand pose ({ skh_…_l: quaternion }) for the right hand: mirrored across the body's middle. */
const mirrorPose = (pose) => Object.fromEntries(Object.entries(pose).map(([bone, q]) => [bone.replace(/_l$/, '_r'), [q[0], -q[1], -q[2], q[3]]]));

// The pose for clips the game gives no hand poses (its runs, and the .anim clips): a guess, as where the game
// picks one for those isn't known. move_nigiri is the loose running grip most free kicks and penalties use.
export const DEFAULT_HAND_POSE = 'move_nigiri';

/** Hands choices besides a pose's name: the clip's own (the game's timing, or else DEFAULT_HAND_POSE) and open. */
export const CLIP_HANDS = '', OPEN_HANDS = 'open';

/**
 * The clip with hand poses from hands.json ({ poses: { name: left-hand pose }, clips: { path: { l, r } } }), where
 * each hand's records are [start frame, end frame, pose name]: the hand takes each pose from its start, blending
 * from the one before while their frames overlap, and holds the last. `choice` is CLIP_HANDS (the game's
 * records for the clip, or DEFAULT_HAND_POSE without any), OPEN_HANDS (none) or a pose held throughout.
 */
export function withHands(clip, hands, path, choice = CLIP_HANDS) {
  if (!hands || choice === OPEN_HANDS) return { ...clip, hands: null };
  const hold = (name) => ({ l: [[0, 0, name]], r: [[0, 0, name]] });
  const records = choice !== CLIP_HANDS ? hold(choice) : hands.clips[path] || hold(DEFAULT_HAND_POSE);
  const side = (s) => records[s].map(([start, end, name]) => [start, end, s === 'l' ? hands.poses[name] : mirrorPose(hands.poses[name])]).filter((r) => r[2]);
  return { ...clip, hands: { l: side('l'), r: side('r') } };
}

/** A hand's pose (Map bone -> local rotation) at frame f, or null before it has any. */
function handPose(records, f) {
  let pose = null, end = 0;
  for (const [start, stop, next] of records) {
    if (start > f) break;
    const k = pose && start < end ? Math.min(1, (f - start) / (end - start)) : 1;
    if (!pose) pose = new Map(Object.entries(next));
    else for (const [bone, q] of Object.entries(next)) pose.set(bone, pose.has(bone) ? qSlerp(pose.get(bone), q, k) : q);
    end = stop;
  }
  return pose;
}

// ---------------------------------------------------------------- posing

/** A track's value at frame f: rotations slerped, positions lerped, held before the first and after the last key. */
function sample(keys, f, slerp) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f > keys[i][0]) continue;
    const [f0, a] = keys[i - 1], [f1, b] = keys[i], u = (f - f0) / (f1 - f0 || 1);
    return slerp ? qSlerp(a, b, u) : a.map((x, k) => x + (b[k] - x) * u);
  }
  return keys[keys.length - 1][1];
}

/** Clip length in seconds (at least one frame). */
export const clipDuration = (clip) => Math.max(1, clip.frames) / clip.fps;

// Turn from each limb bone's A-pose direction to the rig's rest one, in rest space; the hand follows its forearm.
const turnCache = new WeakMap();
function restTurns(sk, legsStraight) {
  let cached = turnCache.get(sk);
  if (!cached) turnCache.set(sk, (cached = {}));
  if (cached[legsStraight]) return cached[legsStraight];
  const turns = new Map(), dir = (a, b) => (sk[a] && sk[b] ? norm(sub(sk[b].pos, sk[a].pos)) : null);
  for (const [s, out] of [['l', [1, 0, 0]], ['r', [-1, 0, 0]]]) {
    const limbs = [[`sk_upperarm_${s}`, `sk_forearm_${s}`, out], [`sk_forearm_${s}`, `sk_hand_${s}`, out]];
    if (legsStraight) limbs.push([`sk_thigh_${s}`, `sk_leg_${s}`, [0, -1, 0]], [`sk_leg_${s}`, `sk_foot_${s}`, [0, -1, 0]]);
    for (const [from, to, target] of limbs) { const d = dir(from, to); if (d) turns.set(from, qFromTo(d, target)); }
    if (turns.has(`sk_forearm_${s}`)) turns.set(`sk_hand_${s}`, turns.get(`sk_forearm_${s}`));
  }
  return (cached[legsStraight] = turns);
}

/** Local rotations (Map PES bone -> quaternion relative to its PES parent) at frame f, and the hip's offset. */
function framePose(clip, f, sk) {
  const turns = restTurns(sk, clip.legsStraight), clipWorld = new Map();
  const worldOf = (bone) => {
    if (clipWorld.has(bone)) return clipWorld.get(bone);
    const parent = clip.parents[bone], keys = clip.rotations.get(bone);
    const own = keys ? sample(keys, f, true) : [0, 0, 0, 1];
    const w = parent ? qMul(worldOf(parent), own) : own;
    clipWorld.set(bone, w);
    return w;
  };
  // PES world rotations of the bones the clip drives; the rest keep their parent's.
  const world = new Map();
  for (const bone of Object.keys(clip.parents)) if (sk[bone]) world.set(bone, qMul(worldOf(bone), turns.get(bone) || [0, 0, 0, 1]));
  // The fingers, under PES's hand, with their rotations brought over from the game's hand rig.
  for (const s of clip.hands ? ['l', 'r'] : []) {
    const pose = handPose(clip.hands[s], f), hand = `sk_hand_${s}`;
    if (!pose || !world.has(hand)) continue;
    const rig = HAND_RIG[s], rigInverse = qInv(rig);
    for (const joint of FINGERS) {
      const bone = `skh_${joint}_${s}`, parent = sk[bone]?.parent;
      if (!parent || !world.has(parent)) continue;
      world.set(bone, qMul(world.get(parent), qMul(qMul(rig, pose.get(bone) || [0, 0, 0, 1]), rigInverse)));
    }
  }
  const local = new Map(), worldAll = new Map();
  const visit = (n) => {
    if (worldAll.has(n)) return worldAll.get(n);
    const parent = sk[n].parent, pw = parent ? visit(parent) : [0, 0, 0, 1];
    const w = world.get(n) || pw;
    worldAll.set(n, w);
    local.set(n, qMul(qInv(pw), w));
    return w;
  };
  for (const n of Object.keys(sk)) visit(n);
  let hip = clip.hip ? sample(clip.hip, f, false) : [0, 0, 0];
  if (clip.hipFrame) hip = qRotate(worldOf(clip.hipFrame), hip);
  return { local, hip };
}

// Points on the sole, in rest space (as in run-cycle.js): the heel and the toe tip.
const HEEL = (s) => [s === 'l' ? 0.19 : -0.19, 0.0, -0.03], TOE_TIP = (s) => [s === 'l' ? 0.205 : -0.205, 0.0, 0.2];

/** Lowest sole point of pose `local` with the hip at its rest height plus `hip`. */
function lowestSole(local, hip, sk) {
  const pose = forwardKinematics(sk, local);
  const height = (bone, point) => { const b = pose(bone); return b.p[1] + qRotate(b.q, sub(point, sk[bone].pos))[1]; };
  let low = Infinity;
  for (const s of ['l', 'r']) {
    if (!sk[`sk_foot_${s}`]) continue;
    const toe = sk[`dsk_toe_${s}`] ? `dsk_toe_${s}` : `sk_foot_${s}`;
    low = Math.min(low, height(`sk_foot_${s}`, HEEL(s)), height(toe, TOE_TIP(s)));
  }
  return low + hip[1];
}

// How far to lift a clip grounded as a whole (ground 'clip'), worked out once per clip and skeleton: so the
// lowest sole point over the clip touches the floor.
const liftCache = new WeakMap();
function clipLift(clip, sk) {
  let bySkeleton = liftCache.get(clip);
  if (!bySkeleton) liftCache.set(clip, (bySkeleton = new WeakMap()));
  if (!bySkeleton.has(sk)) {
    let low = Infinity;
    for (let f = 0; f <= clip.frames; f += 0.5) { const { local, hip } = framePose(clip, f, sk); low = Math.min(low, lowestSole(local, hip, sk)); }
    bySkeleton.set(sk, Number.isFinite(low) ? -low : 0);
  }
  return bySkeleton.get(sk);
}

/**
 * Pose at time t (seconds, looping) for skeleton `sk` = { name: { parent, pos } }, as runPose does:
 * { local: Map(name -> quaternion relative to parent), hipOffset: [x, y, z] from the hip's rest position }.
 */
export function clipPose(clip, t, sk) {
  const length = clipDuration(clip), f = Math.min((((t % length) + length) % length) * clip.fps, clip.frames);
  const { local, hip } = framePose(clip, f, sk);
  const lift = clip.ground === 'clip' ? clipLift(clip, sk) : clip.ground === 'frame' ? Math.max(0, -lowestSole(local, hip, sk)) : 0;
  return { local, hipOffset: [hip[0], hip[1] + lift, hip[2]] };
}
