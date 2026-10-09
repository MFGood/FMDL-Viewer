// helper-bones.js — places PES's helper bones (dsk_*) the way the game does.
//
// PES animates only the main skeleton (sk_* and dsk_hip). Every frame it then places the helper bones
// from a table in its code: each helper follows a source bone, and many also turn, slide or swell with the
// angle of a nearby joint (the shorts' panels with the thigh and knee, the sleeve and shoulder bones with
// the upper arm, the collar with the neck). The table, formulas and constants below were read out of PES
// 2016's executable and checked against that code running in an emulator. PES 2017–2021 keep the same
// bones and bind pose, so they carry over; bones only the later games have (the sleeve rings, the hem
// "fake" extensions…) aren't in the readable code, so they just follow their parents, except the shirt's
// belly panels, which are approximated from the shorts' panels (see H.bellyRoot).
//
// Game conventions: each bone has a bind frame (its orientation in body.skl, pes-bind-frames.json), and
// its world rotation in game terms is the pose's rotation times that frame. A joint's angles are its
// rotation relative to its animation parent, measured from the bind pose in the joint's own frame, as
// Euler angles with q = Rz·Ry·Rx (x runs along the bone). The upper arm is measured from the shoulder's
// frame instead, so it reads zero held straight out to the side.

import * as THREE from 'three';
import { qMul, qInv, qRotate } from './quat.js';

const deg = (r) => (r * 180) / Math.PI, rad = (d) => (d * Math.PI) / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const qX = (a) => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
const qY = (a) => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
const qZ = (a) => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
const ID = [0, 0, 0, 1];

/** The game's Euler angles [x, y, z] of q, where q = Rz·Ry·Rx. */
function euler([x, y, z, w]) {
  return [
    Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
    Math.asin(clamp(2 * (w * y - z * x), -1, 1)),
    Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
  ];
}

/** q = swing · twist, the twist about the bone (x). */
function swingTwist(q) {
  const n = Math.hypot(q[0], q[3]);
  let twist = n > 1e-9 ? [q[0] / n, 0, 0, q[3] / n] : ID;
  if (twist[3] < 0) twist = twist.map((v) => -v);
  let swing = qMul(q, qInv(twist));
  if (swing[3] < 0) swing = swing.map((v) => -v);
  return { swing, twist, twistAngle: 2 * Math.atan2(twist[0], twist[3]) };
}
/** Swing angles about y and z and the twist angle, as the game splits a rotation. */
function splitAngles(q) {
  const { swing: s, twistAngle } = swingTwist(q);
  return [2 * Math.atan2(s[1], s[3]), 2 * Math.atan2(s[2], s[3]), twistAngle];
}
/** q with only part of its twist kept. */
function partTwist(q, k) {
  const { swing, twistAngle } = swingTwist(q);
  return qMul(swing, qX(k * twistAngle));
}

// Animation skeleton parents (PES's player_skeletons.hkx). The viewer has no sk_root_hip; it turns with dsk_hip.
const ANIM_PARENT = { dsk_hip: 'sk_root_hip', sk_belly: 'sk_root_hip', sk_chest: 'sk_belly', sk_neck: 'sk_chest', sk_head: 'sk_neck' };
for (const s of ['l', 'r']) Object.assign(ANIM_PARENT, {
  [`sk_shoulder_${s}`]: 'sk_chest', [`sk_upperarm_${s}`]: `sk_shoulder_${s}`, [`sk_forearm_${s}`]: `sk_upperarm_${s}`,
  [`sk_hand_${s}`]: `sk_forearm_${s}`, [`sk_thigh_${s}`]: 'dsk_hip', [`sk_leg_${s}`]: `sk_thigh_${s}`, [`sk_foot_${s}`]: `sk_leg_${s}`,
});

// Each handler gets the side, the joint it reads (`a`: angles, `q`: rotation) and up to two more (`b`, `c`),
// and the driver's rest relation (R0, T0: the helper's bind transform in its source's frame; P: the source's
// parent; q60: the source's bind rotation under that parent). It returns the helper's scale, rotation and
// change of position in the source's frame, and optionally a new frame for the source (`base`).
const H = {
  // Shorts: the root follows the thigh's swing (not its twist) and stretches as the leg lifts.
  hemRoot(side, a, b, c, d) {
    const [s0, s1, tw] = splitAngles(a.q).map(deg);
    const m = Math.max(Math.abs(s1), 0.5);
    const t = side === 'l' ? s0 - 7 + m : s0 + 7 - m;
    const sx = side === 'l' ? clamp(1 - t * 0.003, 0.9, 1) : clamp(1 + t * 0.003, 0.9, 1);
    const sy = clamp(Math.abs(t) * 0.002 + 1, 1, 1.1);
    const R = qMul(d.R0, qZ(rad(Math.abs(tw) * 0.05)));
    // The panels read the thigh through the root: twist, then the two swing angles.
    const [x0, x1, x2] = splitAngles(a.q);
    return { S: [sx, sy, sy], R, base: qMul(qMul(d.P, d.q60), swingTwist(a.q).swing), write: { a: [x2, x0, x1], q: R } };
  },
  hemInner: (side, a, b, c, d) => ({ R: d.R0, T: [d.T0[0], d.T0[1], side === 'l' ? 0.1213 : -0.1213] }),
  hemFront(side, a, b, c, d) {
    const dz = deg(a.a[2]), knee = deg(b.a[2]);
    const x = Math.max(dz * 0.1 + 10.5, 10.5), y = Math.min(12.5 - dz * (side === 'l' ? 0.025 : 0.015), 12.5) + 1.75;
    const sx = Math.min(1 - dz * 0.005, 1);
    return { S: [sx, clamp(sx - dz * 0.005, 0.8, 1), 1], R: qMul(d.R0, qZ(rad(knee * -0.05))), T: [x * 0.01, y * 0.01, d.T0[2]] };
  },
  hemOuter(side, a, b, c, d) {
    const tw = deg(a.a[0]), z = side === 'l' ? Math.min(tw * 0.045 - 9.7, -9.7) : Math.max(tw * 0.045 + 9.7, 9.7);
    return { R: qMul(d.R0, qZ(rad(deg(a.a[2]) * -0.015))), T: [d.T0[0], d.T0[1], z * 0.01] };
  },
  hemBack: (side, a, b, c, d) => ({ S: [clamp(deg(a.a[2]) * 0.007 + 1.3, 0.6, 1), 1, 1], R: d.R0 }),
  // Shirt: the belly bulges as the body bends forward over the hips.
  belly: (side, a, b, c, d) => ({ S: [1, clamp(1 - 0.009 * (0.7 * deg(a.a[2]) + deg(b.a[2])), 1, 2), 1], R: d.R0 }),
  // The shirt's bottom panels (PES 2017+). PES 2021 drives them from the thigh through dsk_pos_belly, the way
  // the shorts' panels hang off dsk_hem, but that code is packed. As an approximation the root stays with the
  // hips and hands the thigh's angles on, and the panels reuse the shorts' panel formulas.
  bellyRoot(side, a, b, c, d) {
    const [x0, x1, x2] = splitAngles(a.q);
    return { R: d.R0, write: { a: [x2, x0, x1], q: d.R0 } };
  },
  collar(side, a, b, c, d) {
    const [, ny, nz] = b.a, sh = deg(c.a[1]);
    const l = side === 'l';
    const ry = l ? -Math.max(ny, 0) : Math.min(ny, 0);
    const x = l ? Math.max(0.06 * sh, 0) : Math.max(-0.06 * sh, 0);
    const z = l ? clamp(-0.06 * sh - 0.06 * ny, -2.5, 0) : clamp(-0.06 * sh - 0.06 * ny, 0, 2.5);
    const y = Math.max(0.125 * deg(nz), -0.3);
    return { R: qMul(d.R0, qMul(qZ(-Math.max(nz, 0)), qY(ry))), dT: [x * 0.01, y * 0.01, z * 0.01] };
  },
  // Shoulders and arms.
  clavicle(side, a) {
    const y = deg(a.a[1]);
    return { S: [side === 'l' ? clamp(1 - 0.008 * y, 0.6, 1) : clamp(1 + 0.008 * y, 0.6, 1), 1, 1], R: ID };
  },
  trapezius(side, a, b, c, d) {
    const y = deg(a.a[1]);
    return {
      S: [side === 'l' ? clamp(1 - y * 0.015, 0.6, 1) : clamp(1 + y * 0.015, 0.6, 1), 1, 1],
      R: qMul(d.R0, qMul(qZ(0.4 * a.a[2]), qY(0.8 * a.a[1]))),
    };
  },
  pectoralis: (side, a, b, c, d) => ({ R: qMul(d.R0, qMul(qZ(0.2 * b.a[2]), qY(0.65 * b.a[1]))) }),
  scapula(side, a, b, c, d) {
    const z = deg(b.a[2]);
    return { S: [clamp(1 + 0.007 * z, 0.6, 1), 1, 1], R: qMul(d.R0, qMul(qZ(rad(Math.min(0.5 * z, 5))), qY(0.65 * b.a[1]))) };
  },
  deltoid(side, a, b, c, d) {
    const A = deg(a.a[1]), B = deg(a.a[0]), l = side === 'l';
    const t = l ? Math.abs(0.2 * B) + A : A - Math.abs(0.2 * B);
    const x = l ? Math.max(A * 0.05 + 2.25, 0) : Math.max(2.25 - 0.05 * A, 0);
    const z = l ? clamp(t * -0.1 - 4.5, -8, 2) : clamp(4.5 - 0.1 * t, -2, 8);
    const s = l ? (A + 45) * 0.008 + 1 : 1 - (A - 45) * 0.008;
    return { S: [1, 1, clamp(s, 0.65, 1)], R: d.R0, dT: [x * 0.01, 0, z * 0.01], base: qMul(d.P, swingTwist(a.q).swing) };
  },
  upperarm(side, a, b, c, d) {
    const [s0, s1, tw] = splitAngles(a.q).map(deg), l = side === 'l';
    const u = l ? s1 + s0 + 45 : s1 - s0 + 45;
    const ay = l ? clamp(Math.abs(tw) * 0.025, -3, 3.75) : clamp(-Math.abs(tw) * 0.025, -3.75, 3);
    const az = l ? clamp(tw * -0.05, -3, 2.5) : clamp(tw * 0.05, -3, 2.5);
    const sy = clamp(1 + 0.003 * Math.abs(l ? tw - 0.6 * Math.abs(u) : 0.6 * Math.abs(u) + tw), 1, 1.05);
    return {
      S: [clamp(1 - 0.002 * u, 0.9, 1), sy, clamp(1 + 0.001 * (Math.abs(u) + Math.abs(tw)), 0.95, 1.1)],
      R: qMul(d.R0, qMul(qZ(rad(az)), qY(rad(ay)))), base: qMul(d.P, partTwist(a.q, 0.25)),
    };
  },
  upperarmLong: (side, a, b, c, d) => ({ R: d.R0, base: qMul(d.P, partTwist(a.q, 0.65)) }),
  elbow(side, a, b, c, d) {
    const z = a.a[2];
    return { S: [clamp(1 + 0.008 * deg(z), 1, 1.7), 1, 1], R: qMul(qZ(-0.55 * z), d.R0), dT: [clamp(-0.02 * deg(z), -1.9, 0) * 0.01, 0, 0] };
  },
  forearmTwist: (side, a, b, c, d) => {
    const s = clamp(1 + 0.001 * Math.abs(deg(a.a[0])), 1, 1.2);
    return { S: [1, s, s], R: d.R0 };
  },
};
/** Copies a share of the joint's rotation, and optionally slides along one axis with one of its angles. */
const copy = (w, slide) => (side, a, b, c, d) => {
  const e = a.a.map((v, i) => v * w[i]), dT = [0, 0, 0];
  if (slide) {
    const [from, k, to, lo, hi] = slide(side);
    dT[to] = clamp(deg(a.a[from]) * k, lo, hi);
  }
  return { R: qMul(d.R0, qMul(qMul(qZ(e[2]), qY(e[1])), qX(e[0]))), dT };
};

// The game's table, in its order (a helper used as a source comes before the helpers that use it):
// [helper, source, joint read, handler, extra joints read]. "{s}" is the side.
const DRIVERS = [
  ['dsk_deltoid_{s}', 'sk_upperarm_{s}', 'sk_upperarm_{s}', H.deltoid],
  ['dsk_upperarm_{s}', 'sk_upperarm_{s}', 'sk_upperarm_{s}', H.upperarm],
  ['dsk_upperarm_long_{s}', 'sk_upperarm_{s}', 'sk_upperarm_{s}', H.upperarmLong],
  ['dsk_trapezius_{s}', 'sk_chest', 'sk_shoulder_{s}', H.trapezius],
  ['dsk_wrist_{s}', 'sk_hand_{s}', 'sk_hand_{s}', copy([1, 0.4, 0.5], (s) => [1, -0.00014, 2, s === 'l' ? -0.03 : 0, s === 'l' ? 0 : 0.03])],
  ['dsk_elbow_{s}', 'sk_forearm_{s}', 'sk_forearm_{s}', H.elbow],
  ['dsk_forearm_t_{s}', 'sk_forearm_{s}', 'sk_hand_{s}', H.forearmTwist],
  ['dsk_forearm_{s}', 'sk_forearm_{s}', 'sk_hand_{s}', copy([0.4, 0, 0])],
  ['dsk_scm', 'sk_neck', 'sk_neck', copy([0.5, 0.5, 0.5])],
  ['dsk_collar_{s}', 'sk_chest', 'sk_chest', H.collar, 'sk_neck', 'sk_shoulder_{s}'],
  ['dsk_clavicle_{s}', 'sk_chest', 'sk_shoulder_{s}', H.clavicle],
  ['dsk_pectoralis_{s}', 'sk_chest', 'sk_upperarm_{s}', H.pectoralis, 'sk_shoulder_{s}'],
  ['dsk_belly_scale', 'sk_belly', 'sk_belly', H.belly, 'dsk_hip'],
  ['dsk_scapula_{s}', 'sk_chest', 'sk_upperarm_{s}', H.scapula, 'sk_shoulder_{s}'],
  ['dsk_hem_{s}', 'sk_thigh_{s}', 'sk_thigh_{s}', H.hemRoot],
  ['dsk_hem_i_{s}', 'dsk_hem_{s}', 'sk_thigh_{s}', H.hemInner],
  ['dsk_hem_f_{s}', 'dsk_hem_{s}', 'dsk_hem_{s}', H.hemFront, 'sk_leg_{s}'],
  ['dsk_hem_o_{s}', 'dsk_hem_{s}', 'dsk_hem_{s}', H.hemOuter],
  ['dsk_hem_ba_{s}', 'dsk_hem_{s}', 'sk_leg_{s}', H.hemBack],
  // Approximations, see H.bellyRoot.
  ['dsk_pos_belly_{s}', 'dsk_hip', 'sk_thigh_{s}', H.bellyRoot],
  ['dsk_belly_f_{s}', 'dsk_pos_belly_{s}', 'dsk_pos_belly_{s}', H.hemFront, 'sk_thigh_{s}'],
  ['dsk_belly_o_{s}', 'dsk_pos_belly_{s}', 'dsk_pos_belly_{s}', H.hemOuter],
  ['dsk_belly_ba_{s}', 'dsk_pos_belly_{s}', 'sk_thigh_{s}', H.hemBack],
].flatMap(([target, ...rest]) => (target.includes('{s}') ? ['l', 'r'] : [''])
  .map((side) => ({ side, target: target.replace('{s}', side), handler: rest[2], names: [rest[0], rest[1], rest[3], rest[4]].map((n) => n?.replace('{s}', side)) })));

const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const toQ = (q) => _q.set(q[0], q[1], q[2], q[3]);
const trs = (p, q, s = [1, 1, 1]) => new THREE.Matrix4().compose(_v.set(p[0], p[1], p[2]), toQ(q), _s.set(s[0], s[1], s[2]));

/**
 * The game's world matrices for the helper bones it drives, for the posed rig (its world matrices up to
 * date). `bind`: bone -> bind rotation, `rest`: bone -> rest world position. Returns Map name -> THREE.Matrix4.
 * At the bind pose these aren't quite the bind transforms (the formulas' neutral points sit a little off it,
 * and the collarbone takes the chest's orientation), so callers measure poses against the result at rest.
 */
export function helperBoneMatrices(bones, bind, rest) {
  const pose = new Map(); // game world: { q, p, m }
  const viewer = (name) => {
    if (name === 'sk_root_hip') name = 'dsk_hip';
    const b = bones.get(name);
    if (!b) return null;
    b.getWorldQuaternion(_q);
    return { q: [_q.x, _q.y, _q.z, _q.w], p: b.getWorldPosition(new THREE.Vector3()).toArray() };
  };
  const world = (name) => {
    if (pose.has(name)) return pose.get(name);
    const v = viewer(name);
    if (!v || !bind[name]) return null;
    const q = qMul(v.q, bind[name]), g = { q, p: v.p, m: trs(v.p, q) };
    pose.set(name, g);
    return g;
  };
  const written = new Map();
  const joint = (name) => {
    if (!name) return null;
    if (written.has(name)) return written.get(name);
    const parent = ANIM_PARENT[name], g = world(name), gp = parent && world(parent);
    if (!g || !gp) return null;
    const q0 = name.startsWith('sk_upperarm') ? ID : qMul(qInv(bind[parent]), bind[name]);
    const q = qMul(qMul(qInv(q0), qInv(gp.q)), g.q);
    return { q, a: euler(q) };
  };
  const out = new Map();
  for (const { side, target, handler, names: [source, read, extra1, extra2] } of DRIVERS) {
    const src = world(source), a = joint(read);
    if (!src || !a || !bind[target] || !rest.has(target) || !rest.has(source)) continue;
    const parent = ANIM_PARENT[source], P = parent && world(parent);
    const R0 = qMul(qInv(bind[source]), bind[target]);
    const r = rest.get(target), rs = rest.get(source);
    const T0 = qRotate(qInv(bind[source]), [r[0] - rs[0], r[1] - rs[1], r[2] - rs[2]]);
    const d = { R0, T0, P: P?.q ?? ID, q60: parent ? qMul(qInv(bind[parent]), bind[source]) : ID };
    const res = handler(side, a, joint(extra1) ?? { a: [0, 0, 0], q: ID }, joint(extra2) ?? { a: [0, 0, 0], q: ID }, d);
    const T = res.T ?? (res.dT ? T0.map((v, i) => v + res.dT[i]) : T0);
    const base = res.base ? trs(src.p, res.base) : src.m;
    const m = base.clone().multiply(trs(T, res.R ?? R0, res.S));
    m.decompose(_v, _q, _s);
    pose.set(target, { q: [_q.x, _q.y, _q.z, _q.w], p: _v.toArray(), m });
    if (res.write) written.set(target, res.write);
    out.set(target, m);
  }
  return out;
}
