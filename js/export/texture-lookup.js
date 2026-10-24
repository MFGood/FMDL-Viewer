// texture-lookup.js — which file a model's texture reference resolves to, and the kit choice.

import { index } from '../core/files.js';
import { state } from '../core/state.js';
import { resolveTexture, availableKits } from '../formats/aet.js';
import { DEFAULTS, skinTexture, chosenSkin } from './players.js';

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
 * textures follow the player's skin colour, looked up next to the model first and then in the defaults.
 */
export function texturePath(model, ref) {
  const skinned = skinTexture(ref);
  if (skinned) {
    const skin = skinFor(model.player);
    if (skin === CUSTOM_SKIN) {
      const custom = customSkinPath(model, ref, skinned) || firstCustomSkin(skinned);
      if (custom) return custom;
    }
    const name = skinned.numbered(skin === CUSTOM_SKIN ? 1 : skin);
    return resolveTexture(index, { ...ref, filename: `${name}.dds` }, refContext(model, ref), state.currentKit) || index.texture(DEFAULTS, name);
  }
  return resolveTexture(index, ref, refContext(model, ref), state.currentKit)
    // A Pre-Fox path that leads nowhere: try the model's own folder too.
    || (ref.baseDir != null ? resolveTexture(index, ref, lookupContext(model), state.currentKit) : null);
}

// ---------------------------------------------------------------- skin colour

/** Skin colour 7: skin_color.dds, thigh_bsm.dds or arm_bsm.dds found as named in the referenced folder. */
export const CUSTOM_SKIN = 7;

const customSkinPath = (model, ref, skinned) =>
  resolveTexture(index, { ...ref, filename: `${skinned.custom}.dds` }, refContext(model, ref), null);

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
 * Skin colour (1–7) for a model's player, or for loose models when there's no player. Without a choice,
 * the custom skin when the loaded models have one, else 1.
 */
export function skinFor(player) {
  const chosen = chosenSkin(player), custom = customSkinAvailable();
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
