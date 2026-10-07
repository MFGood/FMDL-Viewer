// state.js — what the viewer is showing right now, shared between modules.

export const state = {
  /** Loaded models: { label, path, ownDir, player, parsed, group, visible }. */
  models: [],
  /** Every mesh of every loaded model: { mesh, obj, model, groupVisible, shown, skinned }. */
  meshObjects: [],
  /** The open aesthetics export (scanExport() result), or null. */
  aet: null,
  /** The export player whose models are shown, or null. */
  activePlayer: null,
  /** Kit shown now ("p1", "g1"), or null. */
  currentKit: null,
  /** The kit last picked; shown whenever the loaded model has it. */
  chosenKit: null,
  /** Skin colour (1–6) for models opened on their own. Export players each keep their own. */
  looseSkin: 1,
  /** While a reload is reopening things: { player, kit, camera } to put back. */
  pendingRestore: null,
};
