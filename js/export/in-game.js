// in-game.js — what PES shows of the default body for a player of an export linked to a team in the save file,
// following the "FPC" (full player customisation) setups. The export's kit config turns a kit piece's model
// into one that can be hidden (shirt model 176, shorts model 16, collar 105; a kit without a config gets the
// 4cc AET compiler's generic one, which is set up that way), and then each player's appearance settings in the
// save show or hide it:
//
//   shirt      shirt model 176 and a tucked shirt hide it      sleeves  shirt model 176 and long sleeves
//   shorts     shorts model 16 and a tucked shirt              socks    shorts model 16 and short socks
//   boots      boots 55, or any ID over 100 (a modded team's: their own boots model, or nothing)
//   hands      a GK gloves ID that doesn't exist (11–100; 1–10 are goalkeeper gloves), or any over 100;
//              in PES 18 also an arm_bsm texture of the player's own (a transparent one hides summer hands)
//   skin       a custom skin colour hides the arms and thighs, but not the kit (PES 15–17), except that an
//              arm_bsm or thigh_bsm of the player's own puts its texture on the arms or thighs instead; later
//              games have no custom skin colour, and use the player's own skin textures whatever it is (ownSkinWins)
//
// Without a save, or for players not linked to one, the viewer's own default boots and hands rules apply.

import { index, readFile } from '../core/files.js';
import { state } from '../core/state.js';
import { stem } from '../formats/aet.js';
import { savePlayerOf, skinFromSave } from './save-team.js';
import { isDefaultModel } from './players.js';

// ---------------------------------------------------------------- kit configs

/**
 * A kit config (Kit Configs/*.bin): its kit ("p1", "g1"…, from the file name, else the kit textures it uses,
 * which later kits can share with an earlier one) and the model numbers that matter here.
 */
export function readKitConfig(bytes, name = '') {
  const b = new Uint8Array(bytes);
  const fromName = /(gk)?(\d+)(st|nd|rd|th)/i.exec(name);
  const textures = /^u0.{3}([pg]\d+)/i.exec(new TextDecoder('latin1').decode(b.subarray(0x28, 0x38)));
  const kit = fromName ? `${fromName[1] ? 'g' : 'p'}${+fromName[2]}` : textures ? textures[1].toLowerCase() : null;
  return { kit, shirt: b[1], shorts: b[3], collar: b[0x14], winterCollar: b[0x15] };
}

/** The export's kit configs by kit: Map kit id → config. */
export async function readKitConfigs(aet) {
  const configs = new Map();
  for (const path of index.filesIn(aet?.kitConfigDir).filter((p) => /\.bin$/i.test(p))) {
    try {
      const config = readKitConfig(await readFile(path), stem(path));
      if (config.kit && !configs.has(config.kit)) configs.set(config.kit, config);
    } catch { /* an unreadable config shows everything */ }
  }
  return configs;
}

// The 4cc AET compiler fills in a kit the export has no config for with its generic one
// (templates/XXX_DEF_xxx_realUni.bin), which is set up for FPC.
const GENERIC_KIT_CONFIG = { kit: null, shirt: 176, shorts: 16, collar: 105, winterCollar: 105 };

/** The kit config for the kit shown: its own, else the compiler's generic one. */
const shownKitConfig = () => state.aet?.kitConfigs?.get(state.currentKit) || GENERIC_KIT_CONFIG;

// ---------------------------------------------------------------- the rules

/** The first GK gloves ID that doesn't exist (the FPC wiki's 11, which the saves' hidden players use). */
const FIRST_MISSING_GLOVES = 11;

/** The player's texture of this name in their own face, boots or gloves folder, or null. */
function ownTexture(player, name) {
  for (const part of [player?.face, player?.boots, player?.gloves]) {
    const path = part && index.texture(part.dir, name);
    if (path) return path;
  }
  return null;
}
const hasOwnTexture = (player, name) => !!ownTexture(player, name);

/**
 * For the default body's arms or thighs under a custom skin colour in PES 15–17, the player's own arm_bsm or
 * thigh_bsm, which the game puts on them (whatever texture the default model names); else null.
 */
export function customSkinTexture(model, mesh) {
  const own = savePlayerOf(model.player);
  if (!own || !isDefaultModel(model.path) || parseInt(state.save.parsed.pes) >= 18 || skinFromSave(own) !== 7) return null;
  for (let g = mesh?.group; g; g = g.parent) {
    const name = g.name === 'Arms' ? 'arm_bsm' : g.name === 'Thighs' ? 'thigh_bsm' : null;
    if (name) return ownTexture(model.player, name);
  }
  return null;
}

/**
 * What the game shows of the default body for an export player linked to the save, or null when they aren't:
 * { hidden: names of the default body's mesh groups it hides, hands: whether it shows the default hands }.
 */
export function inGameLook(player) {
  const own = savePlayerOf(player);
  if (!own) return null;
  const pes = parseInt(state.save.parsed.pes), config = shownKitConfig();
  const hidden = new Set();
  const tucked = !own.untucked;
  if (config.shirt === 176) {
    if (tucked) hidden.add('Kit Shirt');
    if (own.sleeve === 2) hidden.add('Kit Sleeves');
  }
  if (config.shorts === 16) {
    if (tucked) hidden.add('Kit Shorts');
    if (own.socks === 2) hidden.add('Kit Socks');
  }
  if (own.boot_id === 55 || own.boot_id > 100) hidden.add('Shoes');
  if (pes < 18 && skinFromSave(own) === 7) {
    if (!hasOwnTexture(player, 'arm_bsm')) hidden.add('Arms');
    if (!hasOwnTexture(player, 'thigh_bsm')) hidden.add('Thighs');
  }
  const hands = own.glove_id < FIRST_MISSING_GLOVES && !(pes === 18 && hasOwnTexture(player, 'arm_bsm'));
  return { hidden, hands };
}

/** Whether the player's skin colour in the save can be custom (7, "C"): PES 15–17 have it, later games don't. */
export const saveHasCustomSkin = (player) => !!savePlayerOf(player) && parseInt(state.save.parsed.pes) < 18;

/**
 * Whether the player's own skin textures (arm_bsm, thigh_bsm, skin_color in their folders) win over their skin
 * colour: in PES 18 on, which has no custom skin colour, they always do (a transparent arm_bsm hides the hands).
 */
export const ownSkinWins = (player) => !!savePlayerOf(player) && parseInt(state.save.parsed.pes) >= 18;

/** Whether the game hides one of the default body's meshes for its player. */
export function hiddenInGame(mesh, look) {
  if (!look?.hidden.size) return false;
  for (let g = mesh.group; g; g = g.parent) if (look.hidden.has(g.name)) return true;
  return false;
}

/** The kit pieces and body parts the game hides, in words: "shirt, sleeves and shoes", or null. */
export function hiddenInWords(look) {
  const words = { 'Kit Shirt': 'shirt', 'Kit Sleeves': 'sleeves', 'Kit Shorts': 'shorts', 'Kit Socks': 'socks', Shoes: 'boots', Arms: 'arms', Thighs: 'thighs' };
  const list = Object.keys(words).filter((g) => look.hidden.has(g)).map((g) => words[g]);
  if (!look.hands) list.push('hands');
  return list.length ? list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}` : null;
}
