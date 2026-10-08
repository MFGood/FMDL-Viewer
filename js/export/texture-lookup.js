// texture-lookup.js — which file a model's texture reference resolves to, and the kit choice.

import { index } from '../core/files.js';
import { state } from '../core/state.js';
import { resolveTexture, availableKits } from '../formats/aet.js';
import { DEFAULTS, usesSkin, chosenSkin } from './players.js';

/** Where to look for a model's textures: its own folder, plus the export's shared folders. */
export const lookupContext = (model) => ({
  ownDir: model.ownDir,
  kitDir: state.aet?.kitDir ?? null,
  commonDir: state.aet?.commonDir ?? null,
  bootsDir: model.player?.boots?.dir ?? null,
  glovesDir: model.player?.gloves?.dir ?? null,
});

/**
 * The open file a texture reference resolves to, or null. Kit textures follow the current kit; skin
 * textures follow the player's skin colour, looked up next to the model first and then in the defaults.
 */
export function texturePath(model, ref) {
  if (usesSkin(ref)) {
    const skin = skinFor(model.player);
    if (skin === CUSTOM_SKIN) {
      const custom = customSkinPath(model, ref) || firstCustomSkin();
      if (custom) return custom;
    }
    const name = `skin_color_${skin === CUSTOM_SKIN ? 1 : skin}`;
    return resolveTexture(index, { ...ref, filename: `${name}.dds` }, lookupContext(model), state.currentKit) || index.texture(DEFAULTS, name);
  }
  return resolveTexture(index, ref, lookupContext(model), state.currentKit);
}

// ---------------------------------------------------------------- skin colour

/** Skin colour 7: a skin_color.dds in the folder a skin texture reference points to. */
export const CUSTOM_SKIN = 7;

const customSkinPath = (model, ref) => resolveTexture(index, { ...ref, filename: 'skin_color.dds' }, lookupContext(model), null);

/** The first custom skin_color.dds the loaded models' skin textures can use, or null. */
function firstCustomSkin() {
  for (const model of state.models) {
    const used = new Set(model.parsed.meshes.map((m) => m.materialInstance));
    for (const mi of used) {
      for (const [, ref] of mi.textures) {
        const path = usesSkin(ref) && customSkinPath(model, ref);
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
    for (const mi of used) for (const [, ref] of mi.textures) refs.push({ ref, ctx: lookupContext(model) });
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
