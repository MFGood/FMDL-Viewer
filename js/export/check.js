// check.js — looks the open export over for problems: models that don't read, textures that aren't there or
// can't be read, vertex weights that don't add up, stray geometry, model names the game won't load, gear IDs
// with no roster slot, and a missing note, logo or kit config. Only the player's own models are checked, not
// the defaults the viewer adds.

import { index, readFile } from '../core/files.js';
import { state } from '../core/state.js';
import { dirOf, fileOf, parseKitName, kitLabel, kitSort } from '../formats/aet.js';
import { readDds, readFtex } from '../formats/texture-files.js';
import { readModels } from '../viewer.js';
import { playerTitle, twoDigits, usesSkin } from './players.js';
import { texturePath } from './texture-lookup.js';
import { isPlaceholder } from '../scene/materials.js';
import { displayPositions, offWeightCount } from '../scene/geometry.js';
import { mainBody } from '../scene/framing.js';

/** How bad a finding is, worst first. */
export const LEVELS = ['error', 'warn', 'note'];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;

/** A path inside the export, without the export's own folder. */
function shortPath(path) {
  const root = state.aet?.root;
  const prefix = root ? `${root}/`.toLowerCase() : '';
  return prefix && path.toLowerCase().startsWith(prefix) ? path.slice(prefix.length) : path;
}

/** What's wrong with a texture file, as a finding, or null. PNG and JPG are left to the browser. */
async function textureProblem(path) {
  if (!/\.(dds|ftex)$/i.test(path)) return null;
  try {
    const buffer = await readFile(path);
    const image = /\.ftex$/i.test(path) ? await readFtex(buffer) : readDds(buffer);
    if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
      return { level: 'warn', text: `${shortPath(path)} is ${image.width}×${image.height}, which isn't a power of two` };
    }
    return null;
  } catch (e) {
    // A format the viewer doesn't decode may still be fine in the game.
    const viewerOnly = /by this viewer|which are not supported/.test(e.message);
    return { level: viewerOnly ? 'note' : 'error', text: `${shortPath(path)} can't be read: ${e.message}` };
  }
}

// The .fmdl names the game loads from each kind of folder (aet.js gameModels), for the finding's wording.
const LOADED_NAMES = { face: 'face_high, hair_high, oral and fcl_hair', boots: 'boots', gloves: 'glove_l and glove_r' };

/**
 * Check one player's (or the Collars') own models: what reads, their textures and weights, and stray pieces.
 * `seen` keeps texture findings to one per texture across the export.
 */
async function checkModels(paths, player, items, seen) {
  const { loaded, problems } = await readModels(paths);
  for (const text of problems) items.push({ level: /^Couldn't read/.test(text) ? 'error' : 'warn', text });
  const parts = [];
  for (const { path, parsed } of loaded) {
    const model = { path, ownDir: dirOf(path), player, parsed };
    const file = fileOf(path);

    const offWeight = parsed.meshes.reduce((n, mesh) => n + offWeightCount(mesh.vertices), 0);
    if (offWeight) items.push({ level: 'warn', text: `${file}: ${offWeight === 1 ? '1 vertex' : `${offWeight} vertices`} whose bone weights don't add up to 1, which PES pulls toward or pushes away from the origin` });

    const missing = new Set();
    for (const mi of new Set(parsed.meshes.map((m) => m.materialInstance))) {
      for (const [role, ref] of mi.textures) {
        if (isPlaceholder(role, ref) || usesSkin(ref)) continue; // the game fills these in
        const found = texturePath(model, ref);
        if (!found) {
          // A missing kit texture is the same for every player: name it once.
          const key = parseKitName(ref.filename) ? `kit|${ref.filename.toLowerCase()}` : `${path}|${ref.directory}|${ref.filename}`.toLowerCase();
          if (!seen.has(key)) { seen.add(key); missing.add(ref.filename); }
          continue;
        }
        const key = found.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const problem = await textureProblem(found);
        if (problem) items.push(problem);
      }
    }
    if (missing.size) items.push({ level: 'warn', text: `${file}: can't find ${[...missing].join(', ')}` });

    for (const mesh of parsed.meshes) parts.push({ mesh, positions: displayPositions(mesh.vertices) });
  }
  const { stray } = mainBody(parts);
  if (stray) items.push({ level: 'warn', text: `${plural(stray, 'stray piece')} of geometry well away from the rest of the model` });
}

/** The findings that aren't about any one player: the note, the logo, the kits and their configs. */
function checkTeam(aet) {
  const items = [];
  if (!aet.notePath) items.push({ level: 'warn', text: 'No team note (.txt) next to the export\'s folders' });
  else if (!aet.teamName) items.push({ level: 'warn', text: `${fileOf(aet.notePath)} has no "Team:" line` });
  else if (!aet.teamColors?.length) items.push({ level: 'note', text: `${fileOf(aet.notePath)} lists no colors under "Team Colours:"` });

  if (!index.subdir(aet.root, 'Logo')) items.push({ level: 'warn', text: 'No Logo folder' });
  else if (!aet.logoPath) items.push({ level: 'warn', text: 'The Logo folder has no .png' });

  if (!aet.kitDir) items.push({ level: 'error', text: 'No Kit Textures folder' });
  else {
    const kits = [...new Set(index.textureStems(aet.kitDir).map((t) => parseKitName(t.stem))
      .filter((k) => k && !k.dummy && !k.prefix && !k.suffix).map((k) => k.id))].sort(kitSort);
    if (!kits.length) items.push({ level: 'warn', text: 'Kit Textures has no kit textures (u0XXXp1.dds…)' });
    const configs = aet.kitConfigs || new Map();
    for (const kit of kits) {
      if (!configs.has(kit)) items.push({ level: 'note', text: `${kitLabel(kit)} has no kit config, so the AET compiler gives it its generic one` });
    }
  }
  if (!aet.players.length) items.push({ level: 'warn', text: 'No players found in Faces, Boots, Gloves or Portraits' });
  return items;
}

/** A player's .fmdl files that the game won't load for their names. */
function unloadedModels(player) {
  const items = [];
  for (const [kind, part] of [['face', player.face], ['boots', player.boots], ['gloves', player.gloves]]) {
    if (!part) continue;
    const loaded = new Set(part.fmdls.map((p) => p.toLowerCase()));
    for (const path of index.filesUnder(part.dir)) {
      if (/\.fmdl$/i.test(path) && !loaded.has(path.toLowerCase())) {
        items.push({ level: 'warn', text: `${fileOf(path)} isn't loaded: the game only loads ${LOADED_NAMES[kind]} from a ${kind} folder` });
      }
    }
  }
  return items;
}

/**
 * Check the open export. `progress(message)` hears which player is being checked. Resolves to groups of
 * findings: [{ title, player (or null), items: [{ level, text }] }], the team's first, then each player with
 * findings, then the Collars.
 */
export async function checkExport(progress = () => {}) {
  const { aet } = state;
  if (!aet) return [];
  const groups = [{ title: aet.teamName || 'Export', player: null, items: checkTeam(aet) }];
  const seen = new Set();
  for (const [i, player] of aet.players.entries()) {
    const title = playerTitle(player);
    progress(`Checking ${title} (${i + 1} of ${aet.players.length})…`);
    const items = [];
    if (player.number == null && player.gearId) {
      items.push({ level: 'warn', text: `ID ${player.gearId} fits no roster slot: IDs ending in 25, 50, 75 or 00 don't go with a player` });
    }
    if (!player.fmdls.length) items.push({ level: 'note', text: player.portrait ? 'Only a portrait, no models' : 'No models' });
    else if (player.number != null && !player.portrait) items.push({ level: 'note', text: 'No portrait' });
    items.push(...unloadedModels(player));
    if (player.fmdls.length) await checkModels(player.fmdls, player, items, seen);
    const number = player.number != null ? `${twoDigits(player.number)} · ` : '';
    groups.push({ title: `${number}${title}`, player, items });
  }
  if (aet.collars.length) {
    progress('Checking the collars…');
    const items = [];
    await checkModels(aet.collars, aet.collarsEntry || null, items, seen);
    groups.push({ title: 'Collars', player: aet.collarsEntry || null, items });
  }
  for (const group of groups) group.items.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  return groups.filter((group, i) => i === 0 || group.items.length);
}

/** The findings as plain text, for copying. */
export function reportText(groups) {
  const lines = [];
  for (const group of groups) {
    if (!group.items.length) continue;
    lines.push(group.title);
    for (const item of group.items) lines.push(`  [${item.level === 'warn' ? 'warning' : item.level}] ${item.text}`);
    lines.push('');
  }
  return lines.join('\n') || 'No problems found.';
}
