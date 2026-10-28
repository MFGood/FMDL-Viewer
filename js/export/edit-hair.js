// edit-hair.js — PES 16's edit hair: which of the game's hair models and textures a player's save settings
// name, as the game builds the names (0x1ccd940 in PES 2016), and their hair color.
//
// A style is length_type_direction(_hairline)_part, e.g. lg_nr_bk_00_NM or md_af_up_WD, with _acc for the
// medium and long styles with the accessory (a hairband); short hair is sh_<part>, and the special styles
// sp_ty001 … sp_ty029. The hair .mtl files name no textures: the game gives the hair cards a parts texture
// (<style or type>_sb0 … sb3) and the tube (the hair's blended layer over the scalp) a shell texture
// (S_<style>_<O / V / M>_<part>_pt<NN>, in the tube's own UVs), both gray, colored by the hair color (as an
// overlay: the texture's mid-gray takes the color). The editable face gets this hair when the face folder has
// no hair of its own; the hair's head (skin under the tube) then replaces headHi.

import { HAIR_STYLES } from './edit-hair-styles.js';

/** Where the edit hair is, under the default models: model/<style>/, parts/ and shell/. */
export const HAIR_DIR = 'edithair';

const STYLES = new Set(HAIR_STYLES);
const TYPE = ['', 'nr', 'sg', 'mh', 'af', 'dd', 'cr', 'sp'];
const LENGTH = ['', 'sh', 'vs', 'st', 'md', 'lg'];
const TEXTURE = ['', 'st1', 'st2', 'wa1', 'wa2', 'wa3', 'cl1', 'cl2'];
const DIRECTION = ['', 'up', 'dw', 'bk'];
const HAIRLINE = ['', '00', '91', '73', '55', '37', '19'];
const SHAPE = ['', 'O', 'V', 'M'];
const PART = ['', 'NW', 'NM', 'WD'];
const STRANDS = ['', 'sb0', 'sb1', 'sb2', 'sb3'];
const SHELL = ['', 'pt10', 'pt05', 'pt01', 'pt91', 'pt92', 'pt93'];

/** The settings a player has without a save: the game's default hair (very short, natural, up, middle part). */
export const DEFAULT_HAIR = {
  hair_type: 1, hair_pt: 1, hair_len: 2, hair_tex: 1, hair_acc: 0, hair_sp: 0,
  hair_dir: 1, hair_line: 0, hair_sb: 4, hair_ovm: 1, hair_part: 2, hair_col_r: 11, hair_col_g: 9, hair_col_b: 3,
};

/**
 * The edit hair these settings name: { style, parts, shell, color } (parts and shell are texture names, or null
 * for none; color is [r, g, b], 0–1), or null when the settings name no hair the game has.
 */
export function editHair(f) {
  const color = [f.hair_col_r, f.hair_col_g, f.hair_col_b].map((c) => Math.min(255, (c ?? 0) * 4) / 255);
  const type = f.hair_type, length = f.hair_len, part = PART[f.hair_part];
  if (TYPE[type] === 'sp') {
    if (!f.hair_sp) return null;
    const style = `sp_ty${String(f.hair_sp).padStart(3, '0')}`;
    return STYLES.has(style) ? { style, parts: style, shell: `S_${style}`, color } : null;
  }
  let strands = f.hair_sb, shell = f.hair_pt, texture = f.hair_tex, plain = false, byType = false;
  if (LENGTH[length] === 'vs') { plain = true; strands = 4; }
  else if (strands >= 1 && strands <= 3) shell = 1;
  if (TYPE[type] === 'mh') plain = true;
  else if (TYPE[type] === 'af' || TYPE[type] === 'dd') { texture = 6; byType = true; plain = true; }
  else if (TYPE[type] === 'cr') { texture = 7; byType = true; plain = true; }
  const shape = SHAPE[f.hair_ovm], shellName = `S_${TEXTURE[texture]}_${shape}_${part}_${SHELL[shell]}`;
  if (LENGTH[length] === 'sh') {
    if (!part || !TEXTURE[texture] || !shape || !SHELL[shell]) return null;
    return { style: `sh_${part}`, parts: null, shell: `S_sh_${TEXTURE[texture]}_${shape}_${part}_${SHELL[shell]}`, color };
  }
  if (!LENGTH[length] || !TYPE[type] || !DIRECTION[f.hair_dir] || !part || (!plain && !HAIRLINE[f.hair_line])) return null;
  let style = [LENGTH[length], TYPE[type], DIRECTION[f.hair_dir], plain ? null : HAIRLINE[f.hair_line], part].filter(Boolean).join('_');
  if ((LENGTH[length] === 'md' || LENGTH[length] === 'lg') && f.hair_acc) style += '_acc';
  if (!STYLES.has(style)) return null;
  const parts = STRANDS[strands] ? `${byType ? TYPE[type] : TEXTURE[texture]}_${STRANDS[strands]}` : null;
  return { style, parts, shell: TEXTURE[texture] && shape && SHELL[shell] ? shellName : null, color };
}

/** The hair model of a style, relative to the default models. */
export const hairModel = (style) => `${HAIR_DIR}/model/${style}/hair_high_win32.model`;

/** The style an edit hair model path is for, or null. */
export const hairStyleOf = (path) => new RegExp(`/${HAIR_DIR}/model/([^/]+)/hair_high_win32\\.model$`, 'i').exec(path)?.[1] ?? null;

/**
 * Give an edit hair model its textures and color. The tube (hairTubeShader) takes the shell texture and the hair
 * cards (the other Hair materials) the parts texture, both tinted by the hair color. The hair model's head
 * (head_phong, which stands in for the editable face's headHi) takes the skin texture, following the skin color.
 * A material left without a texture is hidden. `dir` is where the default models are.
 */
export function dressEditHair(parsed, hair, dir) {
  const bare = new Set(), image = (sub, name) => ({ filename: `${name}.avif`, directory: './', baseDir: `${dir}/${HAIR_DIR}/${sub}`, srgb: true });
  for (const mi of parsed.materialInstances) {
    const name = mi.name.toLowerCase();
    if (name === 'head_phong') {
      mi.textures.unshift(['DiffuseMap', { filename: 'head_color_w.dds', directory: './', baseDir: `${dir}/face`, srgb: true }]);
      continue;
    }
    const [sub, texture] = name === 'hairtubeshader' ? ['shell', hair.shell] : ['parts', hair.parts];
    if (!texture) { bare.add(mi); continue; }
    mi.textures.unshift(['DiffuseMap', image(sub, texture)]);
    mi.tint = hair.color;
  }
  // Without a texture (the cards of short hair) the game draws nothing there: mark those meshes invisible.
  for (const mesh of parsed.meshes) if (bare.has(mesh.materialInstance)) mesh.shadowFlags |= 0x2;
}
