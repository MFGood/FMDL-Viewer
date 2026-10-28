// texture-lookup.js — which file a model's texture reference resolves to, and the kit choice.

import { index } from '../core/files.js';
import { state } from '../core/state.js';
import { resolveTexture, availableKits } from '../formats/aet.js';
import { DEFAULTS, skinTexture, chosenSkin } from './players.js';
import { ownSkinWins, customSkinTexture, saveHasCustomSkin } from './in-game.js';

/** Where to look for a model's textures: its own folder, plus the export's shared folders. */
export const lookupContext = (model) => ({
  ownDir: model.ownDir,
  kitDir: state.aet?.kitDir ?? null,
  commonDir: state.aet?.commonDir ?? null,
  bootsDir: model.player?.boots?.dir ?? null,
  glovesDir: model.player?.gloves?.dir ?? null,
});

/**
 * Where to look for one texture reference. A Pre-Fox .mtl's paths are relative to the .mtl, so the folder
 * they point to stands in for the model's own folder.
 */
const refContext = (model, ref) => (ref.baseDir != null ? { ...lookupContext(model), ownDir: ref.baseDir } : lookupContext(model));

/**
 * The open file a texture reference resolves to, or null. Kit textures follow the current kit; skin
 * textures follow the player's skin color (or their own skin textures, linked to a PES 18+ save), looked up
 * next to the model first and then in the defaults. With the mesh, the default body's arms and thighs can take
 * the player's own arm_bsm / thigh_bsm (customSkinTexture).
 */
export function texturePath(model, ref, mesh = null) {
  const skinned = skinTexture(ref);
  if (skinned) {
    const own = mesh && customSkinTexture(model, mesh);
    if (own) return own;
    const skin = skinFor(model.player);
    if (skin === CUSTOM_SKIN || ownSkinWins(model.player)) {
      const custom = customSkinPath(model, ref, skinned) || playerSkinPath(model.player, skinned) || firstCustomSkin(skinned);
      if (custom) return custom;
    }
    const name = skinned.numbered(skin === CUSTOM_SKIN ? 1 : skin);
    return resolveTexture(index, { ...ref, filename: `${name}.dds` }, refContext(model, ref), state.currentKit) || index.texture(DEFAULTS, name);
  }
  return resolveTexture(index, ref, refContext(model, ref), state.currentKit)
    // A Pre-Fox path that leads nowhere: try the model's own folder too.
    || (ref.baseDir != null ? resolveTexture(index, ref, lookupContext(model), state.currentKit) : null);
}

// ---------------------------------------------------------------- skin color

/** Skin color 7: skin_color.dds, thigh_bsm.dds or arm_bsm.dds found as named in the referenced folder. */
export const CUSTOM_SKIN = 7;

const customSkinPath = (model, ref, skinned) =>
  resolveTexture(index, { ...ref, filename: `${skinned.custom}.dds` }, refContext(model, ref), null);

/** A custom skin texture in the player's own face, boots or gloves folder, or null. */
const playerSkinPath = (player, skinned) => {
  for (const part of [player?.face, player?.boots, player?.gloves]) {
    const path = part && index.texture(part.dir, skinned.custom);
    if (path) return path;
  }
  return null;
};

/** The first custom texture the loaded models' skin textures can use (of one kind, or any), or null. */
function firstCustomSkin(kind = null) {
  for (const model of state.models) {
    const used = new Set(model.parsed.meshes.map((m) => m.materialInstance));
    for (const mi of used) {
      for (const [, ref] of mi.textures) {
        const skinned = skinTexture(ref);
        if (!skinned || (kind && skinned !== kind)) continue;
        const path = customSkinPath(model, ref, skinned);
        if (path) return path;
      }
    }
  }
  return null;
}

export const customSkinAvailable = () => firstCustomSkin() != null;

/**
 * Skin color (1–7) for a model's player, or for loose models when there's no player. Without a choice,
 * the custom skin when the loaded models have one, else 1. A custom skin in a PES 15–17 save stays custom
 * without custom textures (the game then hides the default body's skin).
 */
export function skinFor(player) {
  const chosen = chosenSkin(player), custom = customSkinAvailable() || (chosen === CUSTOM_SKIN && saveHasCustomSkin(player));
  if (chosen == null || (chosen === CUSTOM_SKIN && !custom)) return custom ? CUSTOM_SKIN : 1;
  return chosen;
}

// ---------------------------------------------------------------- kits

function allTextureRefs() {
  const refs = [];
  for (const model of state.models) {
    const used = new Set(model.parsed.meshes.map((m) => m.materialInstance));
    for (const mi of used) for (const [, ref] of mi.textures) refs.push({ ref, ctx: refContext(model, ref) });
  }
  return refs;
}

/** Kits the loaded models can show ("p1", "p2", "g1", …). */
export const kitsAvailable = () => availableKits(index, allTextureRefs());

/** Show the chosen kit if the loaded models have it; otherwise their first kit, without forgetting the choice. */
export function pickCurrentKit() {
  const kits = kitsAvailable();
  const { chosenKit } = state;
  state.currentKit = chosenKit && kits.includes(chosenKit) ? chosenKit : kits.find((k) => k[0] === 'p') || kits[0] || null;
}
