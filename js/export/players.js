// players.js — rules for export players: which models they show (their own plus any defaults), their
// per-player settings (skin colour, default-model override), and how they're named in the roster.

import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { stem } from '../formats/aet.js';

// ---------------------------------------------------------------- default boots and hands

/** Folder the default models are registered under in the virtual file system. */
export const DEFAULTS = 'default models';

/**
 * The default models and their textures, in assets/defaults/: a PES body without a head (boots.fmdl, with
 * kit, shoes and skin meshes) and hands (glove_l / glove_r.fmdl), with skin colours 1–6.
 */
export const DEFAULT_FILES = [
  'boots.fmdl', 'glove_l.fmdl', 'glove_r.fmdl', 'shoes_bsm.jpg',
  'skin_color_1.jpg', 'skin_color_2.jpg', 'skin_color_3.jpg', 'skin_color_4.jpg', 'skin_color_5.jpg', 'skin_color_6.jpg',
];

export const isDefaultModel = (path) => path.startsWith(`${DEFAULTS}/`);

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

/** Whether a player gets the default models: their own setting if they have one, else the global one. */
export const defaultsOn = (p) => settingsOf(p).useDefaults ?? options.defaultModels;

/**
 * Which default models a player would get. Defaults complete a player's own models, so a player with none
 * (portrait only) gets nothing. The body is added when they have no boots model, and the hands only when
 * their own models are face models alone (no boots and no gloves).
 */
export function defaultParts(p) {
  if (!p || p.collars) return { boots: false, hands: false };
  const boots = !p.boots?.fmdls.length && !!(p.face?.fmdls.length || p.gloves?.fmdls.length);
  return { boots, hands: boots && !p.gloves?.fmdls.length && !!p.face?.fmdls.length };
}

/** The .fmdl paths to show for an export player: their own, plus the defaults they get. */
export function modelsFor(p) {
  if (!p || p.collars || !defaultsOn(p)) return p?.fmdls || [];
  const parts = defaultParts(p), extra = [];
  if (parts.boots) extra.push(`${DEFAULTS}/boots.fmdl`);
  if (parts.hands) extra.push(`${DEFAULTS}/glove_l.fmdl`, `${DEFAULTS}/glove_r.fmdl`);
  return [...p.fmdls, ...extra];
}

// ---------------------------------------------------------------- skin colour

// Skin meshes reference skin_color_0.dds (or skin_color.dds); PES swaps in skin_color_1 … _6 for the
// player's skin colour.
const SKIN_TEXTURE = /^skin_colou?r(_\d+)$/i;

export const usesSkin = (ref) => SKIN_TEXTURE.test(stem(ref.filename));

/** Skin colour (1–6) for a model's player, or for loose models when there's no player. */
export const skinFor = (player) => (player ? settingsOf(player).skin ?? 1 : state.looseSkin);

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
    if (d.boots) parts.push(d.hands ? 'default boots & hands' : 'default boots');
  }
  return parts.length ? parts.join(' · ') : p.portrait ? 'portrait only' : 'no models';
}

