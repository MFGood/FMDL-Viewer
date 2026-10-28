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
    ['eye_size', 'Eye size (eyeballs, not shown)', 50],
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

/** The FaceData bones for these slider values: Map name -> { pos, scale }. */
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

/** Whether a parsed model is faceHi as face-shape.json knows it (its three meshes' vertex counts). */
export const isFaceHi = (parsed) => !!data && parsed.meshes.length === data.meshVertices.length
  && parsed.meshes.every((m, i) => m.vertices.count === data.meshVertices[i]);

/**
 * Put faceHi's vertices where these slider values put them (null: as modeled). All-neutral sliders aren't quite
 * the model: the game's neutral face size and height (1.036, −0.86 mm) still apply. The modeled positions are
 * kept in vertices.restPosition; positions change in place, so the rig's skinned copies follow.
 */
export function shapeFaceHi(parsed, face) {
  const S = face ? skullMatrices(face) : null;
  let v0 = 0;
  for (const mesh of parsed.meshes) {
    const v = mesh.vertices;
    v.restPosition ??= v.position.slice();
    const rest = v.restPosition, pos = v.position;
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
      pos[i * 3] = ox; pos[i * 3 + 1] = oy; pos[i * 3 + 2] = oz;
    }
    v0 += v.count;
    // Weight scaling and framing cache what they work out from the positions.
    v.scaledPosition = null;
    v.pieces = null;
  }
}
