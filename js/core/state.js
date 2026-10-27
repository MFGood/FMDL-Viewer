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
  /** Skin colour (1–7) picked for models opened on their own, or null for the default. Export players each keep their own. */
  looseSkin: null,
  /** Body shape ({ setting: 0–14 }) set for models opened on their own, or null. Export players each keep their own. */
  looseShape: null,
  /** The PES save loaded in the settings: { name, parsed } with parsed a SaveFile, or null. */
  save: null,
  /** The open export's team in the save: { team }, { unmatched, ambiguous } until a team ID is given, or null. */
  saveLink: null,
  /** While a reload is reopening things: { player, kit, camera } to put back. */
  pendingRestore: null,
};
