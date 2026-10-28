// face-editor.js — the viewed player's face settings, shown on the game's editable face (faceHi, added by the
// defaults when their face folder has no face model of its own). The "Face" section of the details pane says
// whether the face is edited (b_edit_face in the save: only an edited face takes the sliders), and its Face
// editor button frames the face and swaps the details pane for the sliders, then the hair, eyebrow, beard and
// skin detail selectors (edit-hair.js, face-layers.js). When the open export is linked to a team in the loaded
// save file, a player's settings are theirs in the save, and changes edit it; otherwise they're kept in the
// browser for the player.

import { $, el } from '../core/dom.js';
import { state } from '../core/state.js';
import { keepSaveEdits } from '../core/save.js';
import { viewedPlayer, settingsOf, setSetting, lookOf, hairFor, hasOwnHair } from '../export/players.js';
import { savePlayerOf, plainName } from '../export/save-team.js';
import { FACE_GROUPS, FACE_SETTINGS, NEUTRAL, isNeutral } from '../animation/face-shape.js';
import { frameFront } from '../scene/framing.js';
import { applyFaceShape, refreshMaterials } from '../viewer.js';
import { DEFAULT_HAIR } from '../export/edit-hair.js';
import { reloadForDefaults } from './team.js';

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

// ---------------------------------------------------------------- hair and face textures

// Hair settings start at 1; 0 is unset (some styles leave a setting unused), shown as a dash.
const options = (labels, first = 0) => [...(first ? [[0, '—']] : []), ...labels.map((label, i) => [i + first, label])];

/**
 * The selectors after the sliders: [group, [{ key, label, options: [[value, label]] } | { color: prefix, label }
 * | { key, label, check }]]. Option labels give the game's own codes where the meaning is a guess.
 */
const LOOK_GROUPS = [
  ['Hair', [
    { key: 'hair_type', label: 'Type', options: options(['Normal (nr)', 'sg', 'Mohican (mh)', 'Afro (af)', 'Dreadlocks (dd)', 'Cornrows (cr)', 'Special (sp)'], 1) },
    { key: 'hair_sp', label: 'Special style', options: options(Array.from({ length: 29 }, (_, i) => `sp_ty${String(i + 1).padStart(3, '0')}`), 1) },
    { key: 'hair_len', label: 'Length', options: options(['Shaved (sh)', 'Very short (vs)', 'Short (st)', 'Medium (md)', 'Long (lg)'], 1) },
    { key: 'hair_dir', label: 'Direction', options: options(['Up', 'Down', 'Back'], 1) },
    { key: 'hair_line', label: 'Hairline', options: options(['00', '91', '73', '55', '37', '19'], 1) },
    { key: 'hair_part', label: 'Part', options: options(['NW', 'NM', 'WD'], 1) },
    { key: 'hair_acc', label: 'Hairband (medium, long)', check: true },
    { key: 'hair_tex', label: 'Strand texture', options: options(['st1', 'st2', 'wa1', 'wa2', 'wa3', 'cl1', 'cl2'], 1) },
    { key: 'hair_sb', label: 'Strands', options: options(['sb0', 'sb1', 'sb2', 'sb3'], 1) },
    { key: 'hair_ovm', label: 'Scalp shape', options: options(['O', 'V', 'M'], 1) },
    { key: 'hair_pt', label: 'Scalp', options: options(['pt10', 'pt05', 'pt01', 'pt91', 'pt92', 'pt93'], 1) },
    { color: 'hair', label: 'Color' },
  ]],
  ['Eyebrows', [
    { key: 'brow', label: 'Shape', options: options(Array.from({ length: 18 }, (_, i) => String(i + 1))) },
    { key: 'brow_thick', label: 'Thickness', options: options(['Middle', 'Thick', 'Thin']) },
    { color: 'brow', label: 'Color' },
    { key: 'brow_alpha', label: 'Strength', options: options(['25%', '50%', '75%', '100%']) },
  ]],
  ['Beard', [
    { key: 'beard', label: 'Beard', options: options(['None', ...Array.from({ length: 12 }, (_, i) => String(i + 1))]) },
    { color: 'beard', label: 'Color' },
    { key: 'beard_alpha', label: 'Strength', options: options(['1', '2', '3', '4']) },
  ]],
  ['Skin details', [
    { key: 'forehead', label: 'Forehead', options: options(['1', '2', '3', '4', '5', '6']) },
    { key: 'lid_u_type', label: 'Upper eyelids', options: options(['1', '2', '3', '4', '5', '6', '7']) },
    { key: 'lid_l_type', label: 'Lower eyelids', options: options(['1', '2', '3']) },
  ]],
];

// The eyebrow shape (1–18) is two settings in the save: shape group (0–5) and variant (0–2).
const lookValue = (look, key) => (key === 'brow' ? 3 * look.brow_shape + look.brow_var : look[key]);
const lookChanges = (key, value) => (key === 'brow' ? { brow_shape: Math.floor(value / 3), brow_var: value % 3 } : { [key]: value });

const HAIR_KEYS = new Set(Object.keys(DEFAULT_HAIR));
const hex = (look, prefix) => `#${['r', 'g', 'b'].map((c) => Math.min(255, (look[`${prefix}_col_${c}`] ?? 0) * 4).toString(16).padStart(2, '0')).join('')}`;
const fromHex = (value, prefix) => Object.fromEntries(['r', 'g', 'b'].map((c, i) => [`${prefix}_col_${c}`, Math.round(parseInt(value.slice(1 + i * 2, 3 + i * 2), 16) / 4) & 63]));

/**
 * Change hair or face texture settings: in the save (marking the hair or face as edited) or in the browser. The hair
 * can change model, so the player is reloaded; the face textures are repainted.
 */
async function setLook(changes) {
  const player = viewedPlayer(), own = savePlayerOf(player), hair = Object.keys(changes).some((k) => HAIR_KEYS.has(k));
  if (own) {
    Object.assign(own, changes);
    if (hair) own.b_edit_hair = 1;
    keepSaveEdits();
  } else setSetting(player, 'look', { ...settingsOf(player).look, ...changes });
  if (hair) await reloadForDefaults();
  else await refreshMaterials();
}

/** The hair, eyebrow, beard and skin detail selectors, with the player's settings. */
function renderLook(box) {
  const player = viewedPlayer(), look = lookOf(player);
  for (const [name, controls] of LOOK_GROUPS) {
    box.append(el('h3', {}, name));
    if (name === 'Hair') {
      const note = hasOwnHair(player) ? 'Their face folder has its own hair, which the game shows instead.'
        : hairFor(player) ? null : 'The game has no hair for these settings, so none is shown.';
      if (note) box.append(el('p', { class: 'hint' }, note));
    }
    const grid = el('div', { class: 'body-sliders look' });
    for (const control of controls) {
      const id = `look-${control.key || `${control.color}-color`}`;
      let input;
      if (control.color) {
        input = el('input', { type: 'color', id, value: hex(look, control.color) });
        input.addEventListener('change', () => setLook(fromHex(input.value, control.color)));
      } else if (control.check) {
        input = el('input', { type: 'checkbox', id });
        input.checked = !!look[control.key];
        input.addEventListener('change', () => setLook({ [control.key]: input.checked ? 1 : 0 }));
      } else {
        input = el('select', { id }, ...control.options.map(([value, label]) => el('option', { value: String(value) }, label)));
        input.value = String(lookValue(look, control.key));
        input.addEventListener('change', () => setLook(lookChanges(control.key, +input.value)));
      }
      grid.append(el('label', { for: id }, control.label), input, el('span'));
    }
    box.append(grid);
  }
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
  renderLook(box);
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
