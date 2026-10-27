// body-shape.js — PES's physique settings (neck length … head depth) as the game applies them to the skeleton.
//
// Each setting is 0–14 in the save, −7…+7 in the game's edit menu, and −1…+1 to the code. The game keeps a
// table per setting of bones with a scale at −1 and a scale at +1 (x runs along the bone, as in the bind
// frames); a bone's scale for one setting goes linearly from the −1 scale through 1 at 0 to the +1 scale,
// and its scale is the product over every setting. The tables, the formula and the overall size change
// for leg length were read out of PES 2016's executable (the list the in-game character uses).
//
// The scale is in the bone's own axes and isn't passed on to its children, but it does scale the offsets of
// its children (so a wider shoulder moves the arm out, a longer belly lifts the chest): what the tables
// assume, as every bone carries the same leg-length factor. Not done here: the game also hands the neck's
// scale and the shoulder height to a few helper-bone drivers, which turn the collarbone area a little.

import * as THREE from 'three';
import { state } from '../core/state.js';
import { viewedPlayer, settingsOf } from '../export/players.js';
import { savePlayerOf } from '../export/save-team.js';
import { HELPER_SOURCES } from './helper-bones.js';

/** The settings, in the game's order: key, label, and the field the save reader gives it. */
export const SHAPE_SETTINGS = [
  ['neckLength', 'Neck length', 'neck_len'],
  ['neckSize', 'Neck size', 'neck_size'],
  ['shoulderHeight', 'Shoulder height', 'shldr_hi'],
  ['shoulderWidth', 'Shoulder width', 'shldr_wid'],
  ['chest', 'Chest size', 'chest'],
  ['waist', 'Waist size', 'waist'],
  ['armLength', 'Arm length', 'arm_len'],
  ['armSize', 'Arm size', 'arm_size'],
  ['thigh', 'Thigh size', 'thigh'],
  ['calf', 'Calf size', 'calf'],
  ['legLength', 'Leg length', 'leg_len'],
  ['headLength', 'Head length', 'head_len'],
  ['headWidth', 'Head width', 'head_wid'],
  ['headDepth', 'Head depth', 'head_dep'],
].map(([key, label, saveField]) => ({ key, label, saveField }));

/** The value of every setting in the middle of its range. */
export const NEUTRAL = 7;

// setting -> [bone, scale at −1, scale at +1]. A bone listed twice for one setting gets both factors.
const both = (bone, min, max) => [[`${bone}_l`, min, max], [`${bone}_r`, min, max]];
const uniform = (bones, min, max) => bones.map((b) => [b, [min, min, min], [max, max, max]]);
const LEG_SHORT = 1.01937, LEG_LONG = 0.982318;
const TABLES = {
  neckLength: [['sk_neck', [0.8, 1, 1], [1.1, 1, 1]]],
  neckSize: [['sk_neck', [1, 0.9, 0.9], [1, 1.025, 1.1]]],
  shoulderHeight: [
    ...both('sk_shoulder', [1, 1, 0.8], [1, 1, 1.55]),
    ...both('dsk_clavicle', [1, 1, 1.2], [1, 1, 0.8]),
  ],
  shoulderWidth: [
    ['sk_chest', [1, 1, 0.9], [1, 1, 1.05]],
    ...both('dsk_clavicle', [1, 1, 0.95], [1, 1, 1.1]),
    ...both('sk_shoulder', [0.9, 1, 1], [1.2, 1, 1]),
  ],
  chest: [
    ['sk_neck', [1, 1, 1], [1, 1.15, 1]],
    ['sk_chest', [1, 0.95, 1], [1, 1.05, 1]],
    ...both('dsk_clavicle', [1, 1, 1], [1, 1.1, 1]),
    ...both('dsk_collar', [1, 1, 1], [1, 1.15, 1]),
  ],
  waist: [
    ['dsk_hip', [1, 0.9, 1], [1, 1.05, 1]],
    ['sk_belly', [1, 0.9, 0.9], [1, 1.05, 1.02]],
    ...both('sk_thigh', [1, 0.95, 1], [1, 1.02, 1]),
  ],
  armLength: [...both('sk_upperarm', [0.95, 1, 1], [1.05, 1, 1]), ...both('sk_forearm', [0.95, 1, 1], [1.05, 1, 1])],
  armSize: [...both('sk_upperarm', [1, 0.9, 0.9], [1, 1.2, 1.2]), ...both('sk_forearm', [1, 0.9, 0.9], [1, 1.1, 1.1])],
  thigh: both('sk_thigh', [1, 0.96, 0.9], [1, 1.08, 1.02]),
  calf: [...both('sk_leg', [1, 0.9, 0.9], [1, 1.08, 1.04]), ...both('dsk_knee', [1, 1.1, 1.1], [1, 0.92, 0.96])],
  // Every bone shrinks as much as the whole body grows (see overallScale), except along the belly, the hip and
  // the legs: longer legs, a shorter torso.
  legLength: [
    ...uniform(['sk_head', 'sk_neck', 'sk_chest'], LEG_SHORT, LEG_LONG),
    ['sk_belly', [1.1465, LEG_SHORT, LEG_SHORT], [0.8665, LEG_LONG, LEG_LONG]],
    ...['dsk_hip', 'sk_thigh_l', 'sk_leg_l', 'sk_thigh_r', 'sk_leg_r'].map((b) => [b, [0.9978, LEG_SHORT, LEG_SHORT], [1.0019, LEG_LONG, LEG_LONG]]),
    ...uniform(['sk_foot_l', 'sk_foot_r'], LEG_SHORT, LEG_LONG),
    ...['shoulder', 'upperarm', 'forearm', 'hand'].flatMap((b) => uniform([`sk_${b}_l`, `sk_${b}_r`], LEG_SHORT, LEG_LONG)),
  ],
  headLength: [['sk_head', [0.9, 1, 1], [1.1, 1, 1]]],
  headWidth: [['sk_head', [1, 1, 0.9], [1, 1, 1.1]]],
  headDepth: [['sk_head', [1, 0.9, 1], [1, 1.1, 1]]],
};

/** A setting's value for the game's code: −1…+1. */
const amount = (shape, key) => ((shape?.[key] ?? NEUTRAL) - NEUTRAL) / 7;

export const isNeutral = (shape) => !shape || SHAPE_SETTINGS.every(({ key }) => (shape[key] ?? NEUTRAL) === NEUTRAL);

/**
 * The body shape set for what's shown, neutral or not: the viewed export player's in the save file when the
 * export is linked to a team there, else the one set for them in this browser, or the one for loose models.
 */
export function shownShape() {
  const player = viewedPlayer(), own = savePlayerOf(player);
  if (own) return shapeFromSave(own);
  return (player ? settingsOf(player).bodyShape : state.looseShape) || null;
}

/** The body shape for what's shown, or null if it's neutral. */
export function currentShape() {
  const shape = shownShape();
  return isNeutral(shape) ? null : shape;
}

/** The shape a save file's player has: { key: 0–14 }. */
export function shapeFromSave(savePlayer) {
  return Object.fromEntries(SHAPE_SETTINGS.map(({ key, saveField }) => [key, savePlayer[saveField] ?? NEUTRAL]));
}

/** Set a save file's player's settings to a shape (null: neutral), marking their physique as edited. */
export function shapeToSave(savePlayer, shape) {
  for (const { key, saveField } of SHAPE_SETTINGS) savePlayer[saveField] = shape?.[key] ?? NEUTRAL;
  if (!isNeutral(shape)) savePlayer.b_edit_phys = 1;
}

/** Each scaled bone's scale in its own (bind frame) axes: Map name -> [x, y, z]. */
export function boneScales(shape) {
  const scales = new Map();
  for (const { key } of SHAPE_SETTINGS) {
    const v = amount(shape, key);
    if (!v) continue;
    for (const [bone, min, max] of TABLES[key]) {
      const end = v < 0 ? min : max, t = Math.abs(v);
      const s = scales.get(bone) || [1, 1, 1];
      scales.set(bone, s.map((x, i) => x * (1 + (end[i] - 1) * t)));
    }
  }
  return scales;
}

/** The size of the whole body: the game makes it larger as the legs get longer (at 180 cm). */
export function overallScale(shape) {
  const v = amount(shape, 'legLength');
  return 1 + (v < 0 ? 0.019 : 0.018) * v;
}

// ---------------------------------------------------------------- the rig

/** A bone's scale as a matrix in the rig's axes, where its rest orientation is its bind frame. */
function scaleMatrix(scale, frame) {
  const f = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion(...frame));
  return f.clone().multiply(new THREE.Matrix4().makeScale(...scale)).multiply(f.invert());
}

const _p = new THREE.Vector3(), _o = new THREE.Vector3(), _m = new THREE.Matrix4();

/**
 * Reshape a posed rig whose world matrices are up to date. `order` lists its bones parents first; `bind`
 * has their bind frames. A main bone (sk_*, dsk_hip) moves by its parent's scale but doesn't take it on;
 * a helper bone (dsk_*) follows the bone that drives it (its parent if none does) whole, scale included,
 * the way the game composes a driven helper with its source; the calf table, which shrinks the knee helper
 * as much as it thickens the shin, is made for that. Each bone's local matrix is set to match, with
 * matrixAutoUpdate off, so the next updateMatrixWorld keeps the shape.
 */
export function applyBodyShape(order, bind, shape) {
  const scales = boneScales(shape);
  const byName = new Map(order.map((b) => [b.name, b]));
  const before = new Map(order.map((b) => [b, b.matrixWorld.clone()]));
  const own = new Map();
  for (const bone of order) {
    const s = scales.get(bone.name);
    if (s && bind[bone.name]) own.set(bone, scaleMatrix(s, bind[bone.name]));
  }
  const shaped = new Map();
  const shapedOf = (bone) => {
    if (shaped.has(bone)) return shaped.get(bone);
    const w = before.get(bone), parent = bone.parent;
    let world;
    const helper = bone.name.startsWith('dsk_') && bone.name !== 'dsk_hip';
    const source = helper ? byName.get(HELPER_SOURCES.get(bone.name)) || parent : parent;
    const sourceShaped = before.has(source) ? shapedOf(source) : null; // first, as it uses the temporaries too
    if (!sourceShaped) world = w.clone();
    else if (helper) {
      // Where it sits on its source, carried by the source as reshaped.
      world = sourceShaped.clone().multiply(_m.copy(before.get(source)).invert().multiply(w));
    } else {
      // Its offset from the parent, in the parent's axes, scaled by the parent's own scale.
      const wp = before.get(source);
      const local = _m.copy(wp).invert().multiply(w); // the bone in its parent's frame
      _o.setFromMatrixPosition(local);
      if (own.has(source)) _o.applyMatrix4(own.get(source));
      _o.applyMatrix4(_m.copy(wp).setPosition(0, 0, 0)).add(_p.setFromMatrixPosition(sourceShaped));
      world = w.clone().setPosition(_o);
    }
    if (own.has(bone)) world.multiply(own.get(bone));
    shaped.set(bone, world);
    return world;
  };
  for (const bone of order) shapedOf(bone);
  // Then the whole body grows about the ground under it.
  const overall = overallScale(shape), grow = new THREE.Matrix4().makeScale(overall, overall, overall);
  for (const world of shaped.values()) world.premultiply(grow);
  for (const bone of order) {
    const world = shaped.get(bone), parentWorld = shaped.get(bone.parent) || bone.parent.matrixWorld;
    bone.matrixAutoUpdate = false;
    bone.matrix.copy(parentWorld).invert().multiply(world);
    bone.matrixWorld.copy(world);
  }
}
