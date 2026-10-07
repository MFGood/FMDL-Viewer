// run-cycle.js — procedural run cycle for the PES skeleton.
// Axes (PES model space): +X = the player's left, +Y = up, +Z = forward.
// The rest pose is PES's A-pose: arms angled ~45° down, legs slightly apart, all bone rotations identity.
// Limbs are aimed at target directions relative to their own rest direction, so the A-pose is accounted for:
// legs are aimed in the pelvis's frame, arms in the chest's frame; feet and head keep a world-level orientation.

import { qMul, qInv, qAxis, X, Y, norm, sub, qFromTo, qRotate, qSlerp, forwardKinematics } from './quat.js';
import { hemPose } from './hem.js';

/** Smoothstep from 0 at a to 1 at b. */
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Unit vector pointing `ang` radians forward from straight down, with a little sideways lean `side`. */
const hang = (ang, side) => norm([side, -Math.cos(ang), Math.sin(ang)]);

/** Smooth periodic curve through keys [[phase 0..1, value], ...] (Catmull-Rom, wraps at 1). */
function loopCurve(keys, c) {
  const n = keys.length, at = (i) => { const k = keys[((i % n) + n) % n]; return [k[0] + Math.floor(i / n), k[1]]; };
  let i = keys.findIndex((k, j) => c >= k[0] && c < (j + 1 < n ? keys[j + 1][0] : 1 + keys[0][0]));
  if (i < 0) i = n - 1;
  const [x0, p0] = at(i - 1), [x1, p1] = at(i), [x2, p2] = at(i + 1), [x3, p3] = at(i + 2);
  let cc = c; if (cc < x1) cc += 1;
  const u = (cc - x1) / (x2 - x1);
  // Catmull-Rom with tangents scaled for uneven key spacing
  const m1 = ((p2 - p0) / (x2 - x0)) * (x2 - x1), m2 = ((p3 - p1) / (x3 - x1)) * (x2 - x1);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
}

// One leg's cycle, phase 0 = toe-off (leg driven straight out behind). Angles in radians.
// thigh: forward from straight down. knee: flexion (shin folds back from the thigh line).
// Shaped on a hand-drawn side-view run: full extension at push-off, the heel folding up to the
// buttock as the leg comes through, a high knee in front, landing under the body.
const THIGH = [[0, -0.55], [0.12, -0.38], [0.27, 0.05], [0.42, 0.72], [0.52, 0.85], [0.64, 0.55], [0.72, 0.32], [0.86, -0.02]];
const KNEE = [[0, 0.12], [0.12, 1.35], [0.27, 2.05], [0.42, 1.75], [0.52, 1.45], [0.64, 0.55], [0.72, 0.28], [0.86, 0.5]];
const LAND = 0.72, STANCE = 1 - LAND; // on the ground from LAND to toe-off at 1 (= 0)

/**
 * Pose at time t (seconds) for skeleton `sk` = { name: { parent, pos:[x,y,z] } }.
 * Returns { local: Map(name -> quaternion [x,y,z,w] relative to parent), offsets: Map(name -> [x,y,z] added to
 * the bone's rest position, in its parent's frame), hipOffset: [x,y,z] }.
 */
export function runPose(t, sk) {
  const PERIOD = 0.74; // seconds per stride (both legs)
  const cyc = ((t / PERIOD) % 1 + 1) % 1;
  const now = poseAt(cyc, sk);
  const table = heightTable(sk), f = cyc * table.length, i = Math.floor(f) % table.length;
  const y = table[i] + (table[(i + 1) % table.length] - table[i]) * (f - Math.floor(f));
  return { local: now.local, offsets: now.offsets, hipOffset: [0, y, 0] };
}

// Body height over one stride, worked out once per skeleton. Raw: while a foot is down, its lowest
// point (heel or toe tip) sits on the floor; in flight the body arcs between toe-off and landing.
// That raw curve has small kinks where support switches feet, so it's smoothed (only the first few
// harmonics of the stride are kept) and then raised just enough that no foot goes through the floor.
const heightCache = new WeakMap();
function heightTable(sk) {
  if (heightCache.has(sk)) return heightCache.get(sk);
  const N = 240, raw = new Float64Array(N), need = new Float64Array(N).fill(-Infinity);
  const ground = (c) => poseAt(((c % 1) + 1) % 1, sk).ground;
  for (let k = 0; k < N; k++) {
    const c = k / N, g = ground(c);
    if (g != null) { raw[k] = g; need[k] = g; continue; }
    const start = c < 0.5 ? 0 : 0.5, end = start + (LAND - 0.5), s = (c - start) / (end - start);
    raw[k] = (ground(start + 1e-6) ?? 0) * (1 - s) + (ground(end) ?? 0) * s + 0.02 * Math.sin(Math.PI * s);
  }
  const smoothCurve = new Float64Array(N);
  for (let h = 0; h <= 6; h++) { // low-pass: keep harmonics 0..6 of the stride
    let a = 0, b = 0;
    for (let k = 0; k < N; k++) { const w = (2 * Math.PI * h * k) / N; a += raw[k] * Math.cos(w); b += raw[k] * Math.sin(w); }
    const sc = h === 0 ? 1 / N : 2 / N;
    for (let k = 0; k < N; k++) { const w = (2 * Math.PI * h * k) / N; smoothCurve[k] += sc * (a * Math.cos(w) + b * Math.sin(w)); }
  }
  let lift = 0;
  for (let k = 0; k < N; k++) lift = Math.max(lift, need[k] - smoothCurve[k]);
  const table = Array.from(smoothCurve, (v) => v + lift);
  heightCache.set(sk, table);
  return table;
}

// Points on the sole, in rest space: the heel (moves with the foot) and the toe tip (moves with the toe).
const HEEL = (side) => [side === 'l' ? 0.19 : -0.19, 0.0, -0.03], TOE_TIP = (side) => [side === 'l' ? 0.205 : -0.205, 0.0, 0.2];

function poseAt(cyc, sk) {
  const ph = cyc * Math.PI * 2;
  const P = (n) => sk[n]?.pos;
  const rest = (from, to) => (P(from) && P(to) ? norm(sub(P(to), P(from))) : null);
  const world = new Map(), toeBend = new Map(), fingerCurl = new Map();
  // Across-the-knuckles axis of each hand (index to pinky knuckle), the hinge for wrist flex and finger curl.
  const palmAxis = (side) => norm(sub(P(`skh_index_mcp_${side}`) || [0, 0, 1], P(`skh_pinky_mcp_${side}`) || [0, 0, 0]));

  // Hips turn toward the leg that's in front; the whole body leans into the run and the chest
  // counter-twists. Legs are posed in a level frame (hip yaw only), so the lean doesn't tip them.
  const yawSwing = Math.sin(ph + 0.6); // left leg ahead around cycle 0.5
  const yaw = qAxis(Y, -0.12 * yawSwing);
  const pelvis = qMul(yaw, qAxis(X, 0.12));
  world.set('dsk_hip', pelvis);
  world.set('sk_belly', qMul(qAxis(Y, -0.04 * yawSwing), qAxis(X, 0.2)));
  const chest = qMul(qAxis(Y, 0.18 * yawSwing), qAxis(X, 0.3)); // leaning forward ~17°
  world.set('sk_chest', chest);
  world.set('sk_neck', qMul(qAxis(Y, 0.06 * yawSwing), qAxis(X, 0.1)));
  world.set('sk_head', qAxis(X, 0.02)); // eyes forward

  for (const [side, sign, offset] of [['l', 1, 0], ['r', -1, 0.5]]) {
    const c = (cyc + offset) % 1;
    const thighAng = loopCurve(THIGH, c), knee = loopCurve(KNEE, c);
    const thighRest = rest(`sk_thigh_${side}`, `sk_leg_${side}`), shinRest = rest(`sk_leg_${side}`, `sk_foot_${side}`);
    // The A-pose spreads the legs; bring the knees and feet in under the hips.
    if (thighRest) world.set(`sk_thigh_${side}`, qMul(yaw, qFromTo(thighRest, hang(thighAng, sign * 0.03))));
    const shin = qMul(yaw, qFromTo(shinRest || [0, -1, 0], hang(thighAng - knee, sign * 0.0)));
    if (shinRest) world.set(`sk_leg_${side}`, shin);

    // Foot. In the air it follows the shin (pointed after toe-off, toes lifting before landing).
    // On the ground: heel strike with the toes up, roll to flat, then the heel lifts and it springs off
    // the toes. Positive pitch about X = toes down.
    const onGround = c >= LAND, u = onGround ? (c - LAND) / STANCE : 0, v = onGround ? 1 : c / LAND; // v = 1: the air pose at landing, which the foot blends out of
    const groundPitch = u < 0.15 ? -0.3 * (1 - u / 0.15) : u < 0.5 ? 0 : 0.95 * Math.pow((u - 0.5) / 0.5, 1.4);
    const ankle = 0.55 * (1 - v) * (1 - v) - 0.2 * v; // relative to the shin in the air
    const contact = onGround ? smooth(0, 0.08, u) : 1 - smooth(0, 0.1, v); // eases out just after toe-off
    const footAir = qMul(shin, qAxis(X, ankle));
    const footGround = qMul(yaw, qAxis(X, onGround ? groundPitch : 0.95));
    world.set(`sk_foot_${side}`, qSlerp(footAir, footGround, contact));
    toeBend.set(`dsk_toe_${side}`, -0.75 * contact * Math.max(0, onGround ? groundPitch : 0.95)); // toes stay down as the heel rises

    // Arms, in the chest frame, opposite to this leg: forward as it pushes off, driving back as it comes
    // through. Elbows stay near 90°: the hand rises to the chest in front, the elbow drives high behind.
    const swing = Math.cos(c * Math.PI * 2);
    const armAng = -0.2 + 0.7 * swing;            // +0.5 forward ... -0.9 back
    const elbow = 1.6 + 0.25 * swing;             // tighter in front
    const upperRest = rest(`sk_upperarm_${side}`, `sk_forearm_${side}`), foreRest = rest(`sk_forearm_${side}`, `sk_hand_${side}`);
    if (upperRest) world.set(`sk_upperarm_${side}`, qMul(chest, qFromTo(upperRest, hang(armAng, sign * 0.3)))); // elbows out
    if (foreRest) {
      const fore = qMul(chest, qFromTo(foreRest, hang(armAng + elbow, sign * -0.08)));
      world.set(`sk_forearm_${side}`, fore);
      // Wrist flexes with the swing; fingers curl into a loose fist that tightens as the arm drives.
      const knuckles = palmAxis(side);
      world.set(`sk_hand_${side}`, qMul(fore, qAxis(knuckles, -sign * (0.1 + 0.25 * swing))));
      fingerCurl.set(side, { axis: knuckles, amount: 0.92 - 0.08 * swing, sign });
    }
  }

  // World rotations -> local (parent-relative). Bones not posed keep their parent's world rotation.
  const local = new Map(), worldAll = new Map();
  const visit = (n) => {
    if (worldAll.has(n)) return worldAll.get(n);
    const par = sk[n].parent;
    const pw = par ? visit(par) : [0, 0, 0, 1];
    const w = world.get(n) || pw;
    worldAll.set(n, w);
    local.set(n, qMul(qInv(pw), w));
    return w;
  };
  for (const n of Object.keys(sk)) visit(n);
  // Joints bent relative to their parent (axes are in rest space, since rest rotations are identity).
  for (const [n, a] of toeBend) if (sk[n]) local.set(n, qAxis(X, a));
  for (const [side, { axis, amount, sign }] of fingerCurl) {
    const curlQ = (a) => qAxis(axis, -sign * a * amount);
    const curl = (n, a) => { if (sk[n]) local.set(n, curlQ(a)); };
    // The A-pose fans the fingers out. Draw index, ring and pinky most of the way toward the middle
    // finger's direction at the knuckle, then curl.
    const dir = (f) => rest(`skh_${f}_mcp_${side}`, `skh_${f}_pip_${side}`);
    const mid = dir('middle');
    for (const f of ['index', 'middle', 'ring', 'pinky']) {
      const d = dir(f), mcp = `skh_${f}_mcp_${side}`;
      if (!sk[mcp]) continue;
      const together = d && mid && f !== 'middle' ? qFromTo(d, norm(d.map((x, i) => x * 0.25 + mid[i] * 0.75))) : [0, 0, 0, 1];
      local.set(mcp, qMul(curlQ(1.0), together));
      curl(`skh_${f}_pip_${side}`, 1.3); curl(`skh_${f}_dip_${side}`, 0.8);
    }
    // Thumb tucks in across the curled fingers.
    const thumbIn = qAxis(norm(sub(P(`skh_thumb_mcp_${side}`) || [0, 0, 0], P(`skh_thumb_mata_${side}`) || [0, -1, 0])), 0);
    if (sk[`skh_thumb_mata_${side}`]) local.set(`skh_thumb_mata_${side}`, qMul(qAxis(mid || [0, -1, 0], sign * 0.35), thumbIn));
    curl(`skh_thumb_mcp_${side}`, 0.5); curl(`skh_thumb_pip_${side}`, 0.6);
  }
  const offsets = hemPose(sk, local, world, pelvis);
  // How far the hips must move so the lowest sole point of each grounded foot touches the floor.
  const pose = forwardKinematics(sk, local);
  const height = (bone, point) => { const b = pose(bone); return b.p[1] + qRotate(b.q, sub(point, sk[bone].pos))[1]; };
  let ground = null;
  for (const [side, offset] of [['l', 0], ['r', 0.5]]) {
    if ((cyc + offset) % 1 < LAND || !sk[`sk_foot_${side}`]) continue;
    const toeBone = sk[`dsk_toe_${side}`] ? `dsk_toe_${side}` : `sk_foot_${side}`;
    const lowest = Math.min(height(`sk_foot_${side}`, HEEL(side)), height(toeBone, TOE_TIP(side)));
    ground = ground == null ? -lowest : Math.max(ground, -lowest);
  }
  return { local, offsets, ground };
}
