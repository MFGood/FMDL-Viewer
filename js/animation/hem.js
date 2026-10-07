// hem.js — keeps the shirt hem and shorts on the legs during the run cycle.

import { qMul, qInv, norm, sub, qRotate, qSlerp, forwardKinematics } from './quat.js';

// Shirt hem and shorts. dsk_hem_l/_r sit on the hip joints and their children (front, outer, back, inner)
// carry the panels of each shorts leg and the bottom of the shirt. The panels are one tube of cloth, so
// they turn with the thigh and keep the shape they have around it at rest: the front pushed out as the
// leg comes up, the back following close behind. Where following exactly would still put cloth inside the
// thigh, a panel turns a little further (or less) until it's clear.
//
// Each panel turns about its own pivot. The back and inner panels turn about the hip joint, so they stay
// on the thigh. The front and outer panels also carry the bottom of the shirt, which overlaps the
// waistband; turning them about the hip joint would lift the waistband up and back into the shirt, so
// their pivot sits up at the waistband, toward the panel.
const HEM_PANELS = ['f', 'o', 'ba', 'i'];
const HEM_PIVOT = { f: [0.7, 0.04], o: [0.7, 0.04], ba: [0, 0], i: [0, 0] }; // [fraction of the way from the hip joint toward the panel, height above the joint]
const HEM_DEPTHS = [0.24, 0.34, 0.42]; // points checked down each panel, metres below the hip joint
const HEM_SLACK = 0.95;  // cloth may close in to 95% of its rest distance from the thigh's axis
const HEM_MAX = 1.6;     // most a panel turns, as a multiple of the thigh's turn
export function hemPose(sk, local, world, pelvis) {
  const offsets = new Map();
  const pose = forwardKinematics(sk, local);
  for (const side of ['l', 'r']) {
    const hem = `dsk_hem_${side}`, thigh = `sk_thigh_${side}`, knee = `sk_leg_${side}`;
    if (!sk[hem] || !sk[thigh] || !sk[knee] || !sk[hem].parent) continue;
    const parent = pose(sk[hem].parent);
    // The hem root takes the pelvis's rotation and sits exactly on the hip joint.
    local.set(hem, qMul(qInv(parent.q), pelvis));
    pose.reset(); // the hem root just changed
    const joint = pose(thigh).p, now = pose(hem).p;
    offsets.set(hem, qRotate(qInv(parent.q), sub(joint, now)));
    // Work in the pelvis's frame, with the hip joint at the origin.
    const h = sk[thigh].pos;
    const rel = qMul(qInv(pelvis), world.get(thigh) || pelvis);
    const a0 = norm(sub(sk[knee].pos, h)), a = qRotate(rel, a0);
    const radial = (v, ax) => { const t = v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]; return { t, r: Math.hypot(v[0] - ax[0] * t, v[1] - ax[1] * t, v[2] - ax[2] * t) }; };

    const panels = HEM_PANELS.filter((p) => sk[`dsk_hem_${p}_${side}`]).map((p) => {
      const c0 = sub(sk[`dsk_hem_${p}_${side}`].pos, h), [toward, up] = HEM_PIVOT[p];
      const pivot = [toward * c0[0], up, toward * c0[2]];
      const turn = (k) => qSlerp([0, 0, 0, 1], rel, k);
      // Where a rest point `s` moving with this panel ends up when the panel turns by k.
      const move = (k, s) => { const r = qRotate(turn(k), sub(s, pivot)); return [pivot[0] + r[0], pivot[1] + r[1], pivot[2] + r[2]]; };
      return { name: `dsk_hem_${p}_${side}`, c0, k: 1, turn, move };
    });
    // Cloth weighted (1 - w) to A and w to B, below the point between them, is clear of the thigh if >= 0.
    const clearance = (A, kA, B, kB, w) => {
      let worst = Infinity;
      for (const d of HEM_DEPTHS) {
        const s = [A.c0[0] * (1 - w) + B.c0[0] * w, -d, A.c0[2] * (1 - w) + B.c0[2] * w];
        const pa = A.move(kA, s), pb = B.move(kB, s), p = pa.map((x, j) => x * (1 - w) + pb[j] * w);
        const { t, r } = radial(p, a);
        if (t > 0) worst = Math.min(worst, r - HEM_SLACK * radial(s, a0).r);
      }
      return worst;
    };
    // The k nearest `want` (in [0, HEM_MAX]) for which fn(k) is clear.
    const nearest = (want, fn) => {
      if (fn(want) >= 0) return want;
      let best = null;
      for (let k = 0; k <= HEM_MAX + 1e-9; k += 0.05) if (fn(k) >= 0 && (best == null || Math.abs(k - want) < Math.abs(best - want))) best = k;
      if (best == null) return want;
      let lo = best, hi = want; // lo clear, hi not: close in on the boundary
      for (let it = 0; it < 16; it++) { const m = (lo + hi) / 2; if (fn(m) >= 0) lo = m; else hi = m; }
      return lo;
    };
    for (const P of panels) P.k = nearest(1, (k) => clearance(P, k, P, k, 0));
    // Cloth between neighbouring panels moves with a blend of both, so the blends must be clear too.
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < panels.length; i++) {
        const A = panels[i], B = panels[(i + 1) % panels.length];
        for (const w of [0.25, 0.5, 0.75]) {
          A.k = nearest(A.k, (k) => clearance(A, k, B, B.k, w));
          B.k = nearest(B.k, (k) => clearance(A, A.k, B, k, w));
        }
      }
    }
    for (const P of panels) {
      local.set(P.name, P.turn(P.k)); // relative to the hem root, which has the pelvis's rotation
      offsets.set(P.name, sub(P.move(P.k, P.c0), P.c0)); // turning about the panel's pivot, not the bone itself
    }
  }
  return offsets;
}
