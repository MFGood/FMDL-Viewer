// texture-lookup.js — which file a model's texture reference resolves to, and the kit choice.

import { index } from '../core/files.js';
import { state } from '../core/state.js';
import { resolveTexture, availableKits } from '../formats/aet.js';
import { DEFAULTS, usesSkin, skinFor } from './players.js';

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
    const name = `skin_color_${skinFor(model.player)}`;
    return resolveTexture(index, { ...ref, filename: `${name}.dds` }, lookupContext(model), state.currentKit) || index.texture(DEFAULTS, name);
  }
  return resolveTexture(index, ref, lookupContext(model), state.currentKit);
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
