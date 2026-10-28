// face-shape.js — PES 16's face edit sliders, as the game applies them to its editable face, faceHi.model.
//
// Each slider is 0–14 in the save (−7…+7 in the game's edit menu). The game's converter (0x1ccc210 in PES 2016)
// turns the face settings into 76 bone values: positions in meters and scales for the face's "skull" bones,
// in the order of the FaceData presets. Each value is a lerp between a low, a neutral and a high one, and the
// sliders add up, so face-shape.json keeps it as tables: value = base + the sum of each slider's change. Two
// more sliders give face size (about the jaw line, y 1.58756) and the face's height.
//
// The values are written into the reset FaceData pose (0x16e53f0): positions as they are, scales onto the
// bone's matrix, the lip's width also onto its depth. Then every bone but the jaw scales by the face size
// about the jaw line and everything moves up or down by the face height. faceHi is deformed by those bones
// through skull.bin's weights (a CPU skin: each vertex moves by sum(w · bone · inverse bind)); skull bone_29,
// which holds the mouth's inside, follows the lip as the game moves its oral group with it.
//
// Not done: the eye models and eyeballs (eye size), and the game's photo-face path (its 11 constraint steps).
// The outer brows' depth below neutral keeps its neutral value: the game's lerp returns 0 there (its low and
// neutral ends are equal), which sinks the brows into the skull.

import { fetchAsset } from '../core/files.js';

/** The sliders, by group: save field, label, and the appearance field ID in PES 2016's table. */
export const FACE_GROUPS = [
  ['Face', [
    ['face_size', 'Face size', 93],
    ['face_height', 'Face height', 94],
  ]],
  ['Cheeks', [
    ['cheekbone_wid', 'Cheekbone width', 39],
    ['cheekbone_hi', 'Cheekbone height', 40],
    ['cheek_wid', 'Lower cheek width', 36],
    ['cheek_hi', 'Lower cheek height', 37],
  ]],
  ['Eyebrows', [
    ['brow_hi', 'Brow height', 45],
    ['brow_dep', 'Brow depth', 46],
    ['brow_in_x', 'Inner brow spacing', 44],
    ['brow_out_x', 'Outer brow spacing', 47],
    ['brow_out_hi', 'Outer brow height', 48],
  ]],
  ['Eyes', [
    ['eye_x', 'Eye spacing', 62],
    ['eye_hi', 'Eye height', 63],
    ['eye_dep', 'Eye depth', 51],
    ['eye_size', 'Eye size', 50],
  ]],
  ['Eyelids', [
    ['lid_ui_x', 'Upper lid, inner: across', 56],
    ['lid_ui_y', 'Upper lid, inner: height', 57],
    ['lid_uo_x', 'Upper lid, outer: across', 58],
    ['lid_uo_y', 'Upper lid, outer: height', 59],
    ['lid_bi_x', 'Lower lid, inner: across', 52],
    ['lid_bi_y', 'Lower lid, inner: height', 53],
    ['lid_bm_y', 'Lower lid, middle: height', 61],
    ['lid_bo_x', 'Lower lid, outer: across', 54],
    ['lid_bo_y', 'Lower lid, outer: height', 55],
  ]],
  ['Nose', [
    ['nose_hi', 'Nose height', 64],
    ['nose_dep', 'Nose depth', 65],
    ['nose_wid', 'Nose width', 66],
    ['bridge_dep', 'Bridge depth', 68],
    ['bridge_wid', 'Bridge width', 69],
  ]],
  ['Mouth', [
    ['mouth_hi', 'Mouth height', 71],
    ['mouth_dep', 'Mouth depth', 72],
    ['mouth_wid', 'Mouth width', 76],
    ['lip_thick', 'Lip thickness', 73],
    ['mouth_crnr', 'Mouth corner height', 75],
  ]],
  ['Chin', [
    ['chin_wid', 'Chin width', 78],
    ['chin_hi', 'Chin height', 79],
    ['chin_dep', 'Chin depth', 80],
  ]],
].map(([name, list]) => ({ name, settings: list.map(([key, label, id]) => ({ key, label, id })) }));

export const FACE_SETTINGS = FACE_GROUPS.flatMap((g) => g.settings);

/** The value of every slider in the middle of its range. */
export const NEUTRAL = 7;

/** The editable face the defaults add for a Pre-Fox player whose face folder has no face model of its own. */
export const FACE_MODEL = 'face/faceHi.model';

/**
 * The editable face and the parts the game shows with it (face_config.xml, in their high-detail versions): model,
 * .mtl, the .xml type, and for the eyes and mouth the type of a face folder's own model that replaces them.
 */
export const FACE_PARTS = [
  { part: 'face', model: FACE_MODEL, mtl: 'face/face.mtl', type: 'face' },
  { part: 'eye', model: 'face/eyeHi.model', mtl: 'face/eyeHi.mtl', type: 'eye', ownType: 'eye' },
  { part: 'mouth', model: 'face/mouthHi.model', mtl: 'face/mouthHi.mtl', type: 'mouth', ownType: 'mouth' },
  { part: 'neck', model: 'face/neckHi.model', mtl: 'face/neckHi.mtl', type: 'neck' },
  { part: 'head', model: 'face/headHi.model', mtl: 'face/headHi.mtl', type: 'head' },
];

/** Which face part a model path is ("face", "eye", …), or null. */
export const facePartOf = (path) => FACE_PARTS.find((p) => path.toLowerCase().endsWith(p.model.toLowerCase()))?.part ?? null;

const JAW_LINE = 1.587559312582016;   // the face size scales about this height (0x22b4088)
const JAW = new Set(['bone_09', 'bone_22']);
const EYEBALL_SCALE = 0x14, LIP_WIDTH = 0x2b; // outputs the game treats on their own

export const isNeutral = (face) => !face || FACE_SETTINGS.every(({ key }) => (face[key] ?? NEUTRAL) === NEUTRAL);

let data = null;

/** Load face-shape.json once (the tables, rest pose, skull inverse binds and faceHi's weights). */
export async function loadFaceData() {
  data ??= JSON.parse(new TextDecoder().decode(await fetchAsset('assets/defaults/face/face-shape.json')));
  return data;
}

/** The converter's 76 bone values and the face's size and height offset for these slider values. */
function converterOutputs(face) {
  const out = data.base.slice();
  for (const { key, id } of FACE_SETTINGS) {
    const n = Math.max(0, Math.min(14, face?.[key] ?? NEUTRAL)), field = data.fields[id];
    if (!field || n === NEUTRAL) continue;
    for (const [i, row] of Object.entries(field.outputs)) out[i] += row[n];
  }
  return { values: out.slice(0, 76), height: out[76], size: out[77] };
}

/** The FaceData bones for these slider values: Map name -> { pos, scale }, and the eyeball scale. */
function faceBones(face) {
  const { values, height, size } = converterOutputs(face), unset = new Set(data.unset);
  const bones = new Map(Object.entries(data.rest).map(([name, pos]) => [name, { pos: pos.slice(), scale: [1, 1, 1] }]));
  values.forEach((v, i) => {
    if (unset.has(i) || i === EYEBALL_SCALE) return;
    const [name, isScale, axis] = data.outputs[i], bone = bones.get(name);
    if (isScale) {
      bone.scale[axis] = v;
      if (i === LIP_WIDTH) bone.scale[2] = v;
    } else bone.pos[axis] = v;
  });
  const jawX = (bones.get('bone_09').pos[0] + bones.get('bone_22').pos[0]) / 2;
  for (const [name, { pos }] of bones) {
    if (!JAW.has(name)) {
      pos[0] = (pos[0] - jawX) * size;
      pos[1] = (pos[1] - JAW_LINE) * size + JAW_LINE;
    }
    pos[1] += height;
  }
  bones.eyeScale = values[EYEBALL_SCALE];
  return bones;
}

/**
 * Each skull bone's skinning matrix (bone · inverse bind) as 12 numbers (3 rows of 4). Bones with no FaceData
 * bone stay put, but bone_29, which holds the mouth's inside, goes where the lip goes.
 */
function skullMatrices(face) {
  const bones = faceBones(face), { bones: names, inverseBinds } = data.skull;
  return names.map((name, b) => {
    const bone = name === 'bone_29' ? { pos: bones.get('bone_16').pos, scale: [1, 1, 1] } : bones.get(name);
    const inv = inverseBinds[b];
    if (!bone) return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    const m = [];
    for (let r = 0; r < 3; r++) {
      const s = bone.scale[r], t = bone.pos[r];
      m.push(s * inv[r * 4], s * inv[r * 4 + 1], s * inv[r * 4 + 2], s * inv[r * 4 + 3] + t);
    }
    return m;
  });
}

/** Keep a mesh's modeled positions in vertices.restPosition, and the caches that depend on positions cleared. */
function restOf(v) {
  v.restPosition ??= v.position.slice();
  v.scaledPosition = null; // weight scaling and framing cache what they work out from the positions
  v.pieces = null;
  return v.restPosition;
}

/**
 * Move the eyes or the mouth for these slider values (null: as modeled). Each eye vertex goes with its main bone,
 * skf_eye_l / _r, from the bone's bind position to its FaceData eyeball, scaled by the eye size; the mouth moves by
 * the lip's offset from its neutral place (where bone_29, faceHi's mouth inside, binds).
 */
export function shapeFacePart(parsed, part, face) {
  const bones = face ? faceBones(face) : null;
  const lip = data.skull.inverseBinds[data.skull.bones.indexOf('bone_29')];
  for (const mesh of parsed.meshes) {
    const v = mesh.vertices, rest = restOf(v), pos = v.position;
    for (let i = 0; i < v.count; i++) {
      let x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2];
      if (bones && part === 'eye') {
        const bone = v.skinBones?.[i * 4], eye = bone && bones.get(/_l$/.test(bone.name) ? 'eyeball_l' : 'eyeball_r');
        if (eye) {
          const c = bone.globalPosition, s = bones.eyeScale;
          x = eye.pos[0] + s * (x - c.x); y = eye.pos[1] + s * (y - c.y); z = eye.pos[2] + s * (z - c.z);
        }
      } else if (bones && part === 'mouth') {
        const p = bones.get('bone_16').pos; // the inverse bind's translation is minus the lip's neutral place
        x += p[0] + lip[3]; y += p[1] + lip[7]; z += p[2] + lip[11];
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
  }
}

// The skull's eyelid bones on each side (FaceData names): right bone_10…14, left bone_23…27.
const LID_BONES = { r: [10, 11, 12, 13, 14], l: [23, 24, 25, 26, 27] };
const mean = (list) => [0, 1, 2].map((k) => list.reduce((sum, p) => sum + p[k], 0) / list.length);

// The eyeball's radius (eyeHi's median, about its skf_eye bind), and how far from its center faceHi follows it:
// fully up to the lids' rim, fading out before the brows.
const EYE_RADIUS = 0.013, RIM_FULL = 0.0145, RIM_END = 0.0185;
const rimWeight = (d) => (d <= RIM_FULL ? 1 : d >= RIM_END ? 0 : (RIM_END - d) / (RIM_END - RIM_FULL));

// The left eyeball's shape (face-shape.json's eyeball: eyeHi's vertices about the eye's bind) as unit directions
// with their radius; the right eye is its mirror.
let eyeShape = null;
function eyeRadius(dx, dy, dz, side) {
  eyeShape ??= Array.from({ length: data.eyeball.length / 3 }, (_, i) => {
    const [x, y, z] = data.eyeball.slice(i * 3, i * 3 + 3), r = Math.hypot(x, y, z);
    return [x / r, y / r, z / r, r];
  });
  const d = Math.hypot(dx, dy, dz) || 1, ux = (side === 'r' ? -dx : dx) / d, uy = dy / d, uz = dz / d;
  let best = -2, radius = EYE_RADIUS;
  for (const [x, y, z, r] of eyeShape) { const cos = x * ux + y * uy + z * uz; if (cos > best) { best = cos; radius = r; } }
  return radius;
}

// How close the lids may come to the eyeball's surface: what they clear it by at rest, between these bounds.
const LID_GAP_MIN = 0.0001, LID_GAP_MAX = 0.0005;

/**
 * How faceHi around each eyeball (the lids and the eye's rim, by distance from the eyeball at rest) follows it, as
 * the game places its eyelid bones from the eyeballs: by the eyeball's move from neutral that the skull's eyelid
 * bones don't already make (eye depth), and outward by as much as the eye size grows the eyeball's surface.
 * { l, r: { move, center, grow, rest, scale } }.
 */
function eyelidFollow(face) {
  const bones = faceBones(face), neutral = faceBones({}), out = {};
  for (const side of ['l', 'r']) {
    const eye = bones.get(`eyeball_${side}`).pos, eye0 = neutral.get(`eyeball_${side}`).pos;
    const names = LID_BONES[side].map((n) => `bone_${String(n).padStart(2, '0')}`);
    const lid = mean(names.map((n) => bones.get(n).pos)), lid0 = mean(names.map((n) => neutral.get(n).pos));
    out[side] = {
      move: [0, 1, 2].map((k) => eye[k] - eye0[k] - (lid[k] - lid0[k])), center: eye,
      grow: (bones.eyeScale / neutral.eyeScale - 1) * EYE_RADIUS, rest: data.rest[`eyeball_${side}`], scale: bones.eyeScale,
    };
  }
  return out;
}

/** Whether a parsed model is faceHi as face-shape.json knows it (its three meshes' vertex counts). */
export const isFaceHi = (parsed) => !!data && parsed.meshes.length === data.meshVertices.length
  && parsed.meshes.every((m, i) => m.vertices.count === data.meshVertices[i]);

/**
 * Put faceHi's vertices where these slider values put them (null: as modeled). All-neutral sliders aren't quite
 * the model: the game's neutral face size and height (1.036, −0.86 mm) still apply. The modeled positions are
 * kept in vertices.restPosition; positions change in place, so the rig's skinned copies follow.
 */
export function shapeFaceHi(parsed, face) {
  const S = face ? skullMatrices(face) : null, lids = face ? eyelidFollow(face) : null;
  let v0 = 0;
  for (const mesh of parsed.meshes) {
    const v = mesh.vertices, rest = restOf(v), pos = v.position;
    for (let i = 0; i < v.count; i++) {
      const x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2], w = data.weights[v0 + i];
      let ox = x, oy = y, oz = z;
      if (S && w.length) {
        let total = 0; ox = oy = oz = 0;
        for (let k = 0; k < w.length; k += 2) {
          const m = S[w[k]], wk = w[k + 1];
          ox += wk * (m[0] * x + m[1] * y + m[2] * z + m[3]);
          oy += wk * (m[4] * x + m[5] * y + m[6] * z + m[7]);
          oz += wk * (m[8] * x + m[9] * y + m[10] * z + m[11]);
          total += wk;
        }
        ox += (1 - total) * x; oy += (1 - total) * y; oz += (1 - total) * z;
      }
      for (const side of lids ? ['l', 'r'] : []) {
        const { move, center, grow, rest: c0 } = lids[side];
        const wk = rimWeight(Math.hypot(x - c0[0], y - c0[1], z - c0[2]));
        if (!wk) continue;
        ox += wk * move[0]; oy += wk * move[1]; oz += wk * move[2];
        let dx = ox - center[0], dy = oy - center[1], dz = oz - center[2], d = Math.hypot(dx, dy, dz) || 1;
        ox += wk * grow * dx / d; oy += wk * grow * dy / d; oz += wk * grow * dz / d;
        // Other sliders move the skull's lid points and the eyeball apart: keep a lid that clears the eyeball at
        // rest outside it, pushing it straight out from the eye's center.
        const rx = x - c0[0], ry = y - c0[1], rz = z - c0[2], gap = Math.hypot(rx, ry, rz) - eyeRadius(rx, ry, rz, side);
        if (gap < -LID_GAP_MIN) continue;
        dx = ox - center[0]; dy = oy - center[1]; dz = oz - center[2]; d = Math.hypot(dx, dy, dz) || 1;
        const least = lids[side].scale * eyeRadius(dx, dy, dz, side) + Math.min(Math.max(gap, LID_GAP_MIN), LID_GAP_MAX);
        if (d < least) { const k = least / d - 1; ox += dx * k; oy += dy * k; oz += dz * k; }
      }
      pos[i * 3] = ox; pos[i * 3 + 1] = oy; pos[i * 3 + 2] = oz;
    }
    v0 += v.count;
  }
}
