// gani.js — Fox Engine .gani motion files (PES 2018–2021 body animations).
// Layout and codecs from animation_tool.py (a GANI editor reversed from PES's runtime decoder):
// a MOTION node, a UNIT node, then a track header whose units each hold channels (segments). A channel's
// keys are a first value, then [step byte, value] pairs until a step of 0. Rotations are packed in
// 3·N + 3 bits (half-angle, x and y shares of the axis, three signs); vectors are half or full floats.

const MAGIC = 0x0bfca2d2;
const QUAT = 0, FLOAT = 1, VECTOR2 = 2, VECTOR3 = 3, VECTOR4 = 4, QUAT_DIFF = 5, VECTOR_DIFF = 6;

// Body skeleton: segment index -> what it animates (PES 2018–2021; PES 2017's layout differs).
// The ROOT unit moves the whole player (QUAT_DIFF + VECTOR_DIFF). Each leg is a TWO_BONE unit: a foot
// target position, then the thigh's and the leg's rotations (the game plays them without IK by default).
// Each arm is an ARM unit: the shoulder's rotation and position, then the upper arm's and the forearm's.
const BODY_SEGMENTS = [
  ['ROOT', 'rotation'], ['ROOT', 'position'],
  ['sk_root_hip', 'rotation'], ['sk_root_hip', 'position'],
  ['dsk_hip', 'rotation'],
  ['sk_foot_l', 'target'], ['sk_thigh_l', 'rotation'], ['sk_leg_l', 'rotation'], ['sk_foot_l', 'rotation'],
  ['sk_foot_r', 'target'], ['sk_thigh_r', 'rotation'], ['sk_leg_r', 'rotation'], ['sk_foot_r', 'rotation'],
  ['sk_belly', 'rotation'], ['sk_chest', 'rotation'], ['sk_neck', 'rotation'], ['sk_head', 'rotation'],
  ['sk_shoulder_l', 'rotation'], ['sk_shoulder_l', 'position'], ['sk_upperarm_l', 'rotation'], ['sk_forearm_l', 'rotation'], ['sk_hand_l', 'rotation'],
  ['sk_shoulder_r', 'rotation'], ['sk_shoulder_r', 'position'], ['sk_upperarm_r', 'rotation'], ['sk_forearm_r', 'rotation'], ['sk_hand_r', 'rotation'],
];

/** Bits from `bytes` starting at bit `at`, least significant first: [value, next bit]. */
function bits(bytes, count, at) {
  let value = 0;
  for (let i = 0; i < count; i++, at++) if ((bytes[at >> 3] >> (at & 7)) & 1) value += 2 ** i;
  return [value, at];
}

/** A packed rotation: [[x, y, z, w], next bit]. */
function packedQuat(bytes, n, at) {
  const max = 2 ** n - 1;
  let theta, px, py, sx, sy, sz;
  [theta, at] = bits(bytes, n, at); [px, at] = bits(bytes, n, at); [py, at] = bits(bytes, n, at);
  [sx, at] = bits(bytes, 1, at); [sy, at] = bits(bytes, 1, at); [sz, at] = bits(bytes, 1, at);
  const x = px / max, y = py / max, z = 1 - x - y, len = Math.hypot(x, y, z), half = (theta / max) * Math.PI / 2;
  const s = len > 1e-6 ? Math.sin(half) / len : 0;
  return [[(sx ? -1 : 1) * x * s, (sy ? -1 : 1) * y * s, (sz ? -1 : 1) * z * s, Math.cos(half)], at];
}

function half(h) {
  const sign = h & 0x8000 ? -1 : 1, exp = (h >> 10) & 0x1f, mant = h & 0x3ff;
  return exp === 0 ? sign * mant * 2 ** -24 : sign * (1 + mant / 1024) * 2 ** (exp - 15);
}

/** A channel's keys: [[frame, value], …]. */
function readKeys(view, start, end, type, size, frames) {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + start, end - start), keys = [];
  if (type === QUAT || type === QUAT_DIFF) {
    const keyBits = 3 * size + 3;
    let at = 0, frame = 0, q;
    if (keyBits > bytes.length * 8) return keys;
    [q, at] = packedQuat(bytes, size, at);
    keys.push([frame, q]);
    while (frame < frames && at + 8 <= bytes.length * 8) {
      let step;
      [step, at] = bits(bytes, 8, at);
      if (!step || at + keyBits > bytes.length * 8) break;
      frame += step;
      [q, at] = packedQuat(bytes, size, at);
      keys.push([frame, q]);
    }
    return keys;
  }
  const comps = { [FLOAT]: 1, [VECTOR2]: 2, [VECTOR3]: 3, [VECTOR4]: 4, [VECTOR_DIFF]: 3 }[type];
  if (!comps) return keys;
  const width = size === 16 ? 2 : 4, keySize = comps * width;
  const value = (at) => Array.from({ length: comps }, (_, k) => (width === 2 ? half(view.getUint16(at + k * 2, true)) : view.getFloat32(at + k * 4, true)));
  let at = start, frame = 0;
  if (at + keySize > end) return keys;
  keys.push([frame, value(at)]); at += keySize;
  while (frame < frames && at + 1 <= end) {
    const step = view.getUint8(at); at += 1;
    if (!step || at + keySize > end) break;
    frame += step;
    keys.push([frame, value(at)]); at += keySize;
  }
  return keys;
}

/**
 * Parse a body .gani: { frames, fps, tracks: Map 'bone:kind' -> [[frame, value], …] } where kind is
 * rotation ([x, y, z, w]), position or target ([x, y, z]). Throws on anything else (hand, face or PES 2017 files).
 */
export function parseGani(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 0xa4 || view.getUint32(0, true) !== MAGIC) throw new Error('Not a .gani file');
  const header = view.getUint32(4, true) + 48 + 16 + 48; // MOTION node, its name, UNIT node
  const unitCount = view.getInt32(header, true), frames = view.getInt32(header + 12, true), ticks = view.getInt8(header + 16);
  const channels = [];
  for (let u = 0; u < unitCount; u++) {
    let at = header + view.getUint32(header + 20 + u * 4, true);
    const segments = view.getUint8(at + 4);
    at += 8;
    for (let s = 0; s < segments; s++, at += 8) {
      const typeByte = view.getUint8(at + 6);
      channels.push({ start: at + view.getUint32(at, true), index: view.getInt16(at + 4, true), type: typeByte & 0x0f, size: view.getUint8(at + 7) });
    }
  }
  // Each channel's data runs to the next one's.
  const byStart = [...channels].sort((a, b) => a.start - b.start);
  byStart.forEach((c, i) => (c.end = i + 1 < byStart.length ? byStart[i + 1].start : buffer.byteLength));
  const tracks = new Map();
  for (const c of channels) {
    const segment = BODY_SEGMENTS[c.index];
    if (!segment) throw new Error('Not a PES 2018–2021 body animation');
    const keys = readKeys(view, c.start, c.end, c.type, c.size, frames);
    if (keys.length) tracks.set(`${segment[0]}:${segment[1]}`, keys);
  }
  if (!tracks.has('dsk_hip:rotation')) throw new Error('Not a PES 2018–2021 body animation');
  return { frames, fps: ticks > 0 ? 300 / ticks : 30, tracks };
}
