// players.js — rules for export players: which models they show (their own plus any defaults), their
// per-player settings (skin color, default-model override), and how they're named in the roster.

import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { listedModels } from '../core/files.js';
import { stem } from '../formats/aet.js';
import { savePlayerOf, skinFromSave } from './save-team.js';
import { inGameLook } from './in-game.js';
import { FACE_MODEL } from '../animation/face-shape.js';

// ---------------------------------------------------------------- default boots and hands

/** Folder the default models are registered under in the virtual file system. */
export const DEFAULTS = 'default models';

/** The default face's skin textures, head_color_<letter>.dds, for skin colors 1–6 (the game's face_config.xml). */
const HEAD_COLORS = ['w', 'y', 'o', 'r', 'd', 'b'];

/** Versions of the default models, picked under "Default models": id → button label. */
export const DEFAULT_VERSIONS = { 17: 'PES 17', 21: 'PES 21' };

/**
 * The default models and their textures, in assets/defaults/: a PES body without a head (boots.<version>.fmdl,
 * with kit, shoes and skin meshes) and hands (glove_l / glove_r.<version>.fmdl), with skin, thigh and arm
 * textures in skin colors 1–6; and PES 16's editable face (face/faceHi.model with face.mtl, its head_color
 * textures in the six skin colors, eyelashes and eye shadow).
 */
export const DEFAULT_FILES = [
  ...Object.keys(DEFAULT_VERSIONS).flatMap((v) => [`boots.${v}.fmdl`, `glove_l.${v}.fmdl`, `glove_r.${v}.fmdl`]),
  'shoes_bsm.jpg',
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [`skin_color_${n}.jpg`, `thigh_${n}_bsm.jpg`, `arm_${n}_bsm.jpg`]),
  FACE_MODEL, 'face/face.mtl', 'face/face_eyelash.dds', 'face/EyeOcclusion01.dds',
  ...HEAD_COLORS.map((c) => `face/head_color_${c}.dds`),
];

/** The default .model files' list entries for readModelLists: the editable face with its face.mtl. */
export const DEFAULT_LISTINGS = [{ path: `${DEFAULTS}/${FACE_MODEL}`, mtl: `${DEFAULTS}/face/face.mtl`, type: 'face' }];

export const isDefaultModel = (path) => path.startsWith(`${DEFAULTS}/`);

/** Whether any of these model paths is a Pre-Fox .model (PES 16 / 17). */
export const isPreFox = (paths) => paths.some((p) => /\.model$/i.test(p));

// Which version of the default models is used, remembered in the browser: one choice for Fox (.fmdl)
// players, PES 21 to start with, and one for Pre-Fox (.model) players, PES 17 to start with.
const STORAGE_KEYS = { fox: 'defaultModels', prefox: 'defaultModelsPreFox' };
const versions = { fox: '21', prefox: '17' };
for (const [kind, key] of Object.entries(STORAGE_KEYS)) {
  try { const saved = localStorage.getItem(key); if (saved in DEFAULT_VERSIONS) versions[kind] = saved; } catch {}
}

const kindOf = (prefox) => (prefox ? 'prefox' : 'fox');
export const defaultVersion = (prefox = false) => versions[kindOf(prefox)];
export function setDefaultVersion(next, prefox = false) {
  versions[kindOf(prefox)] = next;
  try { localStorage.setItem(STORAGE_KEYS[kindOf(prefox)], next); } catch {}
}

const defaultModel = (name, prefox) => `${DEFAULTS}/${name}.${defaultVersion(prefox)}.fmdl`;

// ---------------------------------------------------------------- per-player settings

// Kept by player identity rather than object, so they survive Reload and reopening the same export.
// Cleared when a different export is opened.
export const playerSettings = new Map();

const playerKey = (p) => `${p.number ?? ''}|${p.gearId ?? ''}|${p.number == null && !p.gearId ? p.name ?? '' : ''}`;

export const settingsOf = (p) => playerSettings.get(playerKey(p)) || {};

/** Set one setting for a player; undefined removes it. */
export function setSetting(p, name, value) {
  const settings = { ...settingsOf(p) };
  if (value === undefined) delete settings[name];
  else settings[name] = value;
  playerSettings.set(playerKey(p), settings);
}

/** The export player being viewed (not the Collars entry), or null. */
export const viewedPlayer = () => (state.aet && state.activePlayer && !state.activePlayer.collars ? state.activePlayer : null);

// ---------------------------------------------------------------- which models a player shows

/** The .xml type of each of a player's Pre-Fox models ("parts", "gloveL"…), with the model's path. */
const listedTypes = (p) => (p?.fmdls || []).map((path) => ({ path, type: (listedModels.get(path.toLowerCase())?.type || '').toLowerCase() }));

// Pre-Fox models a face folder's .xml lists to do without the Boots folder (a common trick), and parts_body,
// which the 4cc AET compiler lists for a face folder without an .xml (as oral_parts_body_win32).
const ORAL_BODY_MODELS = ['oral_body', 'oral_boots', 'oral_kit', 'oral_body_win32', 'oral_boots_win32', 'oral_kit_win32', 'parts_body', 'oral_parts_body_win32'];

/**
 * A body model of the player's own: a Boots folder model, or an oral_body, oral_boots, oral_kit or parts_body
 * .model their face folder lists (whatever its type: "parts", "uniform"…).
 */
export const hasOwnBoots = (p) => !!p?.boots?.fmdls.length
  || (p?.fmdls || []).some((path) => /\.model$/i.test(path) && ORAL_BODY_MODELS.includes(stem(path)));

/** Which hands the player has a model of: both from a Gloves folder, or each from a gloveL / gloveR .xml entry. */
function ownHands(p) {
  const types = listedTypes(p).map((t) => t.type), gloves = !!p?.gloves?.fmdls.length;
  return { left: gloves || types.includes('glovel'), right: gloves || types.includes('glover') };
}

/**
 * Whether a player gets the default models: always for a player linked to the save, as the game always loads
 * the body (in-game.js decides what of it shows); else their own setting if they have one, off for players
 * with their own boots model, and the global setting for the rest.
 */
export const defaultsOn = (p) => (savePlayerOf(p) ? true : settingsOf(p).useDefaults ?? (hasOwnBoots(p) ? false : options.defaultModels));

// Face .xml types that replace the game's own face (the editable faceHi).
const FACE_TYPES = ['face_neck', 'face'];

/** Whether a player's face folder has a face model of its own, standing in for the game's editable face. */
export const hasOwnFace = (p) => listedTypes(p).some((t) => FACE_TYPES.includes(t.type));

/**
 * Which default models a player would get: { boots, left, right, hands, face } (hands: either hand). Defaults
 * complete a player's own models, so a player with none (portrait only) gets nothing. The body is added for
 * any player with models, and each hand when they have a face model but no model of that hand (and, linked
 * to the save, the game shows the default hands). A Pre-Fox player without a face model of their own gets the
 * game's editable face, which their face settings shape.
 */
export function defaultParts(p) {
  if (!p || p.collars) return { boots: false, left: false, right: false, hands: false, face: false };
  const boots = !!(p.face?.fmdls.length || p.boots?.fmdls.length || p.gloves?.fmdls.length);
  const own = ownHands(p), face = boots && !!p.face?.fmdls.length && (inGameLook(p)?.hands ?? true);
  const left = face && !own.left, right = face && !own.right;
  return { boots, left, right, hands: left || right, face: boots && isPreFox(p.fmdls) && !hasOwnFace(p) };
}

/** The .fmdl / .model paths to show for an export player: their own, plus the defaults they get. */
export function modelsFor(p) {
  if (!p || p.collars || !defaultsOn(p)) return p?.fmdls || [];
  const parts = defaultParts(p), extra = [], prefox = isPreFox(p.fmdls);
  if (parts.boots) extra.push(defaultModel('boots', prefox));
  if (parts.left) extra.push(defaultModel('glove_l', prefox));
  if (parts.right) extra.push(defaultModel('glove_r', prefox));
  if (parts.face) extra.push(`${DEFAULTS}/${FACE_MODEL}`);
  return [...p.fmdls, ...extra];
}

/** Which default hands a player gets, as words: "hands", "left hand", "right hand" or null. */
export function defaultHandsLabel(parts) {
  return parts.left && parts.right ? 'hands' : parts.left ? 'left hand' : parts.right ? 'right hand' : null;
}

// ---------------------------------------------------------------- skin color

// Skin-colored textures. Meshes reference skin_color(_0).dds, thigh_bsm.dds or arm_bsm.dds (the editable face
// head_color_w.dds); PES swaps in the player's skin color (skin_color_1 … _6, thigh_1_bsm … _6, arm_1_bsm … _6,
// head_color_w / y / o / r / d / b). When the texture is found
// as named in the referenced folder, it's offered as a 7th, custom color.
const SKIN_TEXTURES = [
  { pattern: /^skin_color(_\d+)?$/i, custom: 'skin_color', numbered: (n) => `skin_color_${n}` },
  { pattern: /^thigh(_\d+)?_bsm$/i, custom: 'thigh_bsm', numbered: (n) => `thigh_${n}_bsm` },
  { pattern: /^arm(_\d+)?_bsm$/i, custom: 'arm_bsm', numbered: (n) => `arm_${n}_bsm` },
  { pattern: /^head_color(_[wyordb])?$/i, custom: 'head_color', numbered: (n) => `head_color_${HEAD_COLORS[n - 1]}` },
];

/** Which skin-colored texture a reference is ({ custom, numbered(n) }), or null. */
export const skinTexture = (ref) => SKIN_TEXTURES.find((t) => t.pattern.test(stem(ref.filename))) || null;

export const usesSkin = (ref) => !!skinTexture(ref);

/** The skin color (1–7) chosen for a model's player, or for loose models when there's no player; null if none. */
export function chosenSkin(player) {
  const own = savePlayerOf(player);
  if (own) return skinFromSave(own);
  return (player ? settingsOf(player).skin : state.looseSkin) ?? null;
}

// ---------------------------------------------------------------- hidden models and meshes

// What's unticked in the model tree, by model path, so Reload and switching players keep it. Export
// players keep theirs in their settings; loose models and Collars share one list for the session.
const looseHidden = new Map();

/**
 * What's hidden of one model: { model, groups (mesh group indices), meshes (mesh indices), unhid (indices of
 * meshes ticked back on although the game hides them, for a player linked to the save) }.
 */
export function hiddenParts(player, path) {
  const own = player && !player.collars;
  let all = own ? settingsOf(player).hidden : looseHidden;
  if (!all) setSetting(player, 'hidden', (all = new Map()));
  let parts = all.get(path);
  if (!parts) all.set(path, (parts = { model: false, groups: new Set(), meshes: new Set(), unhid: new Set() }));
  parts.unhid ||= new Set();
  return parts;
}

// ---------------------------------------------------------------- names in the roster

export const twoDigits = (n) => String(n).padStart(2, '0');

export function playerTitle(p) {
  if (p.collars) return 'Collars';
  return p.name || (p.number != null ? `Player ${twoDigits(p.number)}` : p.gearId ? `Boots / gloves ${p.gearId}` : 'Unnamed');
}

/** One line under the player's name: which models they have. */
export function playerSummary(p) {
  if (p.collars) return `${p.fmdls.length} collar model${p.fmdls.length === 1 ? '' : 's'}`;
  const parts = [];
  if (p.face?.fmdls.length) parts.push('face');
  if (p.boots?.fmdls.length) parts.push(`boots k${p.gearId}`);
  if (p.gloves?.fmdls.length) parts.push(`gloves g${p.gearId}`);
  if (defaultsOn(p)) {
    const d = defaultParts(p);
    if (d.boots) parts.push(d.hands ? `default boots & ${defaultHandsLabel(d)}` : 'default boots');
  }
  return parts.length ? parts.join(' · ') : p.portrait ? 'portrait only' : 'no models';
}

