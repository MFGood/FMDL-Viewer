// face-editor.js — the viewed player's face settings, shown on the game's editable face (faceHi, added by the
// defaults when their face folder has no face model of its own). The "Face" section of the details pane says
// whether the face is edited (b_edit_face in the save: only an edited face takes the sliders), and its Face
// editor button frames the face and swaps the details pane for the sliders. When the open export is linked to
// a team in the loaded save file, a player's settings are theirs in the save, and changes edit it; otherwise
// they're kept in the browser for the player.

import { $, el } from '../core/dom.js';
import { state } from '../core/state.js';
import { keepSaveEdits } from '../core/save.js';
import { viewedPlayer, settingsOf, setSetting } from '../export/players.js';
import { savePlayerOf, plainName } from '../export/save-team.js';
import { FACE_GROUPS, FACE_SETTINGS, NEUTRAL, isNeutral } from '../animation/face-shape.js';
import { frameFront } from '../scene/framing.js';
import { applyFaceShape } from '../viewer.js';

/** The loaded editable face, or null. */
export const faceModel = () => state.models.find((m) => m.facePart === 'face') || null;

/** A player's face settings: { edited (b_edit_face), face: { setting: 0–14 } }. */
export function faceSettings(player) {
  const own = savePlayerOf(player);
  if (own) return { edited: own.b_edit_face === 1, face: Object.fromEntries(FACE_SETTINGS.map(({ key }) => [key, own[key] ?? NEUTRAL])) };
  const settings = player ? settingsOf(player) : {};
  return { edited: !!settings.editFace, face: settings.face || {} };
}

/** The face settings that shape the editable face: the player's when their face is edited, else null. */
export function shownFace(player) {
  const { edited, face } = faceSettings(player);
  return edited ? face : null;
}

async function setEdited(on) {
  const player = viewedPlayer(), own = savePlayerOf(player);
  if (own) {
    own.b_edit_face = on ? 1 : 0;
    keepSaveEdits();
  } else setSetting(player, 'editFace', on || undefined);
  if (!on) closeFaceEditor();
  await applyFaceShape();
  renderFacePanel();
}

async function setFace(face) {
  const player = viewedPlayer(), own = savePlayerOf(player);
  if (own) {
    for (const { key } of FACE_SETTINGS) own[key] = face?.[key] ?? NEUTRAL;
    keepSaveEdits();
  } else setSetting(player, 'face', isNeutral(face) ? undefined : face);
  await applyFaceShape();
}

/** −7…+7 as the game's edit menu shows it. */
const signed = (value) => {
  const v = value - NEUTRAL;
  return v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
};

/** Where the viewed player's face settings come from and go to. */
function sourceNote() {
  const player = viewedPlayer(), own = savePlayerOf(player), link = state.saveLink;
  if (own) return `${plainName(own.name)} (ID ${own.id}) in ${state.save.name}: changes are made to the save kept in the browser.`;
  if (link?.wrongVersion) return 'The save file is for another version of PES (see under the team name), so kept in the browser only.';
  if (link?.unmatched) return 'Give the team ID under the team name to use the save file\'s players.';
  if (link?.team) return `Not on ${link.team.name} in the save file, so kept in the browser only.`;
  return state.save ? 'Kept in the browser only.' : 'Load a save file in the settings to use the players\' own faces.';
}

/** The "Face" section: shown with the editable face, with the edited-face toggle and the Face editor button. */
export function renderFacePanel() {
  const player = viewedPlayer(), shown = !!(player && faceModel());
  $('faceSection').hidden = !shown;
  if (!shown) { closeFaceEditor(); return; }
  const { edited } = faceSettings(player);
  $('tEditFace').checked = edited;
  $('openFaceEditor').hidden = !edited;
  $('faceNote').textContent = edited
    ? 'The face settings shape the game\'s editable face (faceHi). '
    : 'Not edited: the game shows the face as modeled. Turn on to use the face settings (b_edit_face). ';
  $('faceNote').append(sourceNote());
  if (!edited) closeFaceEditor();
  else if (state.faceEditing) renderFaceEditor();
}

/** The sliders, by group, with the player's settings. */
function renderFaceEditor() {
  const { face } = faceSettings(viewedPlayer());
  const box = $('faceSliders');
  box.textContent = '';
  for (const group of FACE_GROUPS) {
    box.append(el('h3', {}, group.name));
    const sliders = el('div', { class: 'body-sliders' });
    for (const { key, label } of group.settings) {
      const value = face[key] ?? NEUTRAL, id = `face-${key}`;
      const output = el('output', { for: id }, signed(value));
      const input = el('input', { type: 'range', id, min: '0', max: '14', step: '1', value: String(value) });
      input.addEventListener('input', () => {
        output.textContent = signed(+input.value);
        setFace({ ...faceSettings(viewedPlayer()).face, [key]: +input.value });
        $('resetFace').hidden = false;
      });
      sliders.append(el('label', { for: id }, label), input, output);
    }
    box.append(sliders);
  }
  $('resetFace').hidden = isNeutral(face);
  $('faceEditorNote').textContent = sourceNote();
}

export function openFaceEditor() {
  if (!faceModel()) return;
  state.faceEditing = true;
  $('details').classList.add('face-editing');
  renderFaceEditor();
  frameFront(); // framing aims at the face while the editor is open, so Period comes back here
}

export function closeFaceEditor() {
  if (!state.faceEditing) return;
  state.faceEditing = false;
  $('details').classList.remove('face-editing');
}

$('tEditFace').addEventListener('change', () => setEdited($('tEditFace').checked));
$('openFaceEditor').addEventListener('click', openFaceEditor);
$('closeFaceEditor').addEventListener('click', closeFaceEditor);
$('resetFace').addEventListener('click', async () => { await setFace(null); renderFaceEditor(); });
