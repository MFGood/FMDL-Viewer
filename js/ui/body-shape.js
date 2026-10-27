// body-shape.js — the "Body shape" section of the details pane: PES's physique settings for the viewed player
// (or for models opened on their own), as sliders. When the open export is linked to a team in the loaded save
// file, a player's sliders are their settings in the save, and moving them edits the save.

import { $, el } from '../core/dom.js';
import { state } from '../core/state.js';
import { keepSaveEdits } from '../core/save.js';
import { viewedPlayer, setSetting } from '../export/players.js';
import { savePlayerOf, plainName } from '../export/save-team.js';
import { SHAPE_SETTINGS, NEUTRAL, isNeutral, shownShape, shapeToSave } from '../animation/body-shape.js';
import { applyBodyShapeOption } from '../viewer.js';

async function setShape(shape) {
  const player = viewedPlayer(), own = savePlayerOf(player), next = isNeutral(shape) ? undefined : shape;
  if (own) {
    shapeToSave(own, next);
    keepSaveEdits();
  } else if (player) setSetting(player, 'bodyShape', next);
  else state.looseShape = next ?? null;
  await applyBodyShapeOption();
}

/** −7…+7 as the game's edit menu shows it. */
const signed = (value) => {
  const v = value - NEUTRAL;
  return v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
};

/** Where the viewed player's shape comes from and goes to. */
function sourceNote() {
  const player = viewedPlayer(), link = state.saveLink;
  if (!player) return '';
  const own = savePlayerOf(player);
  if (own) return `${plainName(own.name)} (ID ${own.id}) in ${state.save.name}: changes are made to the save kept in this browser. `;
  if (link?.unmatched) return 'Give the team ID under the team name to use the save file\'s players. ';
  if (link?.team) return `Not on ${link.team.name} in the save file, so kept in this browser only. `;
  return state.save ? '' : 'Load a save file in the settings to use the players\' own shapes. ';
}

/** Show the section for what's loaded: sliders with the shape shown. */
export function renderBodyPanel() {
  const skinnable = state.meshObjects.some((m) => m.mesh.vertices.weightSum);
  $('bodySection').hidden = !skinnable;
  if (!skinnable) return;
  const shape = shownShape();

  const sliders = $('bodySliders');
  sliders.textContent = '';
  for (const { key, label } of SHAPE_SETTINGS) {
    const value = shape?.[key] ?? NEUTRAL;
    const id = `body-${key}`;
    const output = el('output', { for: id }, signed(value));
    const input = el('input', { type: 'range', id, min: '0', max: '14', step: '1', value: String(value) });
    input.addEventListener('input', () => {
      output.textContent = signed(+input.value);
      setShape({ ...(shownShape() || {}), [key]: +input.value });
      reset.hidden = false;
    });
    sliders.append(el('label', { for: id }, label), input, output);
  }

  const reset = el('button', { type: 'button', class: 'linkish' }, 'Reset');
  reset.hidden = isNeutral(shape);
  reset.addEventListener('click', async () => { await setShape(null); renderBodyPanel(); });
  const noteBox = $('bodyNote');
  noteBox.textContent = '';
  noteBox.append(el('span', {}, sourceNote()), reset);
}
