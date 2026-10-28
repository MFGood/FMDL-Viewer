// face-layers.js — what PES 16 paints onto the editable face's skin texture (its "montage" textures, 0x16e2ed0 in
// PES 2016), from the player's face settings: the forehead wrinkles and the upper and lower eyelid shading, each
// made for the player's skin color (C1 … C6), then the eyebrow and the beard, gray, in their own colors.
//
// The settings come from the save's face description (0x19c6030): the eyebrow is one number, 9 × shape group +
// 3 × variant + thickness, naming Eyebrow<number ÷ 3 + 1><Middle / Thick / Thin>; its color and the beard's are
// 6-bit RGB (× 4), with a 2-bit strength (the eyebrow's alpha is 25 / 50 / 75 / 100 %; the beard's texture
// alpha is multiplied by 1–4).
// Beard00 is no beard. The layers are drawn in the montage face's own UV layout: faceHi's second UV set, which its
// first (the skin texture's) is a zoomed copy of: uv0 = 0.704225 × uv1 + (0.147887, 0.151880).

/** Where the layers are, under the default models: eyebrow/, beard/, forehead/ and eyelid/. */
export const LAYER_DIR = 'face/montage';

/** The settings a player has without a save: the game's default face (black eyebrows, no beard). */
export const DEFAULT_LOOK = {
  forehead: 0, lid_u_type: 0, lid_l_type: 0,
  brow_shape: 0, brow_var: 0, brow_thick: 0, brow_col_r: 0, brow_col_g: 0, brow_col_b: 0, brow_alpha: 3,
  beard: 0, beard_col_r: 0, beard_col_g: 0, beard_col_b: 0, beard_alpha: 3,
};

/** How many of each there are: the settings' ranges (0 … count − 1). */
export const LAYER_COUNTS = { forehead: 6, lid_u_type: 7, lid_l_type: 3, brow_shape: 6, brow_var: 3, brow_thick: 3, beard: 13, brow_alpha: 4, beard_alpha: 4 };

const THICKNESS = ['Middle', 'Thick', 'Thin'];
const pad = (n, width) => String(n).padStart(width, '0');
const inRange = (f, key) => Math.max(0, Math.min(LAYER_COUNTS[key] - 1, f[key] ?? DEFAULT_LOOK[key]));
const color = (f, prefix) => ['r', 'g', 'b'].map((c) => Math.min(255, (f[`${prefix}_col_${c}`] ?? 0) * 4) / 255);

/** The eyebrow texture's shape number (1–18) and thickness name for these settings. */
export function eyebrowOf(f) {
  const n = 9 * inRange(f, 'brow_shape') + 3 * inRange(f, 'brow_var') + inRange(f, 'brow_thick');
  return { shape: Math.floor(n / 3) + 1, thickness: THICKNESS[n % 3] };
}

/**
 * The layers for these settings and skin color (1–6; others as 1), bottom first: [{ path (relative to the default
 * models), tint ([r, g, b] 0–1, or null), alpha (multiplying the texture's) }].
 */
export function faceLayers(f, skin) {
  const c = skin >= 1 && skin <= 6 ? skin : 1, file = (sub, name) => `${LAYER_DIR}/${sub}/${name}.avif`;
  const { shape, thickness } = eyebrowOf(f), layers = [
    { path: file('forehead', `Forehead${pad(inRange(f, 'forehead') + 1, 2)}C${c}`), tint: null, alpha: 1 },
    { path: file('eyelid', `EyelidU${pad(inRange(f, 'lid_u_type') + 1, 2)}C${c}`), tint: null, alpha: 1 },
    { path: file('eyelid', `EyelidL${pad(inRange(f, 'lid_l_type') + 1, 2)}C${c}`), tint: null, alpha: 1 },
    { path: file('eyebrow', `Eyebrow${pad(shape, 3)}${thickness}`), tint: color(f, 'brow'), alpha: (inRange(f, 'brow_alpha') + 1) / 4 },
  ];
  const beard = inRange(f, 'beard');
  // The beard's strength (+1, so 1–4) multiplies its texture's faint alpha (stubble).
  if (beard) layers.push({ path: file('beard', `Beard${pad(beard, 2)}`), tint: color(f, 'beard'), alpha: inRange(f, 'beard_alpha') + 1 });
  return layers;
}

/** Every layer file, relative to the default models, for registering them. */
export function allLayerFiles() {
  const files = [];
  for (let n = 1; n <= 18; n++) for (const t of THICKNESS) files.push(`${LAYER_DIR}/eyebrow/Eyebrow${pad(n, 3)}${t}.avif`);
  for (let n = 0; n <= 12; n++) files.push(`${LAYER_DIR}/beard/Beard${pad(n, 2)}.avif`);
  for (let c = 1; c <= 6; c++) {
    for (let n = 1; n <= 6; n++) files.push(`${LAYER_DIR}/forehead/Forehead${pad(n, 2)}C${c}.avif`);
    for (let n = 1; n <= 7; n++) files.push(`${LAYER_DIR}/eyelid/EyelidU${pad(n, 2)}C${c}.avif`);
    for (let n = 1; n <= 3; n++) files.push(`${LAYER_DIR}/eyelid/EyelidL${pad(n, 2)}C${c}.avif`);
  }
  return files;
}

// faceHi's uv1 from its uv0, as [scale, x, y]: uv1 = (uv0 − (x, y)) / scale.
const LAYER_UV = [0.704225, 0.147887, 0.151880];

/**
 * Put these layers on the editable face's skin (face_mat) as LayerMap textures, replacing any put there before.
 * `dir` is where the default models are.
 */
export function dressFaceLayers(parsed, layers, dir) {
  const mi = parsed.materialInstances.find((m) => m.name.toLowerCase() === 'face_mat');
  if (!mi) return;
  mi.textures = mi.textures.filter(([role]) => role !== 'LayerMap');
  for (const { path, tint, alpha } of layers) {
    const slash = path.lastIndexOf('/');
    mi.textures.push(['LayerMap', { filename: path.slice(slash + 1), directory: './', baseDir: `${dir}/${path.slice(0, slash)}`, srgb: true, tint, alpha, uv: LAYER_UV }]);
  }
}
