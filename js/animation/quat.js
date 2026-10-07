// quat.js — small vector and quaternion helpers for posing the skeleton. Quaternions are [x, y, z, w].

export const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
export const qInv = (q) => [-q[0], -q[1], -q[2], q[3]];
export const qAxis = (ax, a) => { const s = Math.sin(a / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)]; };
export const X = [1, 0, 0], Y = [0, 1, 0];
export const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** Shortest rotation taking unit vector a to unit vector b. */
export function qFromTo(a, b) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  if (d < -0.999999) return qAxis(Math.abs(a[0]) < 0.9 ? X : Y, Math.PI);
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return norm([c[0], c[1], c[2], 1 + d]);
}
export const qRotate = (q, v) => { const r = qMul(qMul(q, [v[0], v[1], v[2], 0]), qInv(q)); return [r[0], r[1], r[2]]; };

export function qSlerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const bb = d < 0 ? b.map((x) => -x) : b; d = Math.abs(d);
  if (d > 0.9995) return norm(a.map((x, i) => x + (bb[i] - x) * t));
  const th = Math.acos(d), s0 = Math.sin((1 - t) * th) / Math.sin(th), s1 = Math.sin(t * th) / Math.sin(th);
  return a.map((x, i) => x * s0 + bb[i] * s1);
}

/**
 * Forward kinematics over a skeleton `sk` = { name: { parent, pos } } (rest rotations are identity)
 * with local rotations `local` (Map name -> quaternion). Returns pose(name) -> { q: world rotation, p: world position }.
 */
export function forwardKinematics(sk, local) {
  const cache = new Map();
  const pose = (n) => {
    if (cache.has(n)) return cache.get(n);
    const par = sk[n].parent, pp = par ? pose(par) : { q: [0, 0, 0, 1], p: [0, 0, 0] };
    const pr = par ? sk[par].pos : [0, 0, 0], r = qRotate(pp.q, sub(sk[n].pos, pr));
    const out = { q: qMul(pp.q, local.get(n) || [0, 0, 0, 1]), p: [pp.p[0] + r[0], pp.p[1] + r[1], pp.p[2] + r[2]] };
    cache.set(n, out);
    return out;
  };
  pose.reset = () => cache.clear();
  return pose;
}
