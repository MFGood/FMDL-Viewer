// team.js — the left-hand panel for an open export: team name and logo, and the player list.

import { $, el } from '../core/dom.js';
import { index, readFile } from '../core/files.js';
import { setStatus } from '../core/notices.js';
import { state } from '../core/state.js';
import { fileOf, parseKitName } from '../formats/aet.js';
import { readDds } from '../formats/texture-files.js';
import { decodeToRGBA } from '../formats/block-decode.js';
import { modelsFor, playerTitle, playerSummary, viewedPlayer, twoDigits } from '../export/players.js';
import { loadModels, showNoModels } from '../viewer.js';
import { renderPlayerPanel } from './details.js';
import { renderBodyPanel } from './body-shape.js';
import { linkSaveTeam, useTeamId, preFoxSave } from '../export/save-team.js';
import { captureView } from '../open/opening.js';

// ---------------------------------------------------------------- portraits

const portraits = new Map(); // path -> Promise<data URL | null>

function portraitUrl(path) {
  if (!portraits.has(path)) portraits.set(path, (async () => {
    const image = readDds(await readFile(path));
    const rgba = decodeToRGBA(image);
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), image.width, image.height), 0, 0);
    return canvas.toDataURL();
  })().catch(() => null));
  return portraits.get(path);
}

export function forgetPortraits() { portraits.clear(); }

// ---------------------------------------------------------------- the panel

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

async function renderHeader() {
  const { aet } = state;
  $('teamName').textContent = aet.teamName || fileOf(aet.root) || 'Aesthetics export';
  const kitCount = index.textureStems(aet.kitDir).filter((t) => { const kit = parseKitName(t.stem); return kit && !kit.prefix && !kit.suffix; }).length;
  const withModels = aet.players.filter((p) => p.fmdls.length).length;
  $('teamMeta').textContent = `${plural(aet.players.length, 'player')} · ${withModels} with models · ${plural(kitCount, 'kit')}`;

  const crest = $('crest');
  crest.hidden = true;
  $('crestBlank').hidden = false;
  if (!aet.logoPath) return;
  try {
    crest.src = URL.createObjectURL(new Blob([await readFile(aet.logoPath)], { type: 'image/png' }));
    crest.alt = `${aet.teamName || 'Team'} logo`;
    crest.hidden = false;
    $('crestBlank').hidden = true;
  } catch { /* keep the blank crest */ }
}

function playerRow(player) {
  const badge = player.number != null ? twoDigits(player.number) : player.collars ? 'C' : '–';
  const thumb = el('div', { class: 'thumb' }, badge);
  const number = player.number != null && player.name ? el('span', { class: 'num' }, twoDigits(player.number)) : null;
  const body = el('div', {}, el('div', { class: 'pname' }, number, playerTitle(player)), el('div', { class: 'pmeta' }, playerSummary(player)));
  const viewable = modelsFor(player).length > 0;
  const active = player === state.activePlayer;
  const row = viewable
    ? el('button', { type: 'button', class: active ? 'player on' : 'player', 'aria-pressed': String(active) }, thumb, body)
    : el('div', { class: 'player static' }, thumb, body);
  if (viewable) row.addEventListener('click', () => openPlayer(player));
  if (player.portrait) portraitUrl(player.portrait).then((url) => { if (url) thumb.replaceWith(el('img', { class: 'thumb', src: url, alt: '' })); });
  player.row = row;
  return row;
}

// ---------------------------------------------------------------- the team in the save file

let changingTeam = false; // the team ID field is open over a linked team

/** The export's team in the save file: which one it's linked to, or a field for its team ID. */
function renderSaveLink() {
  const link = state.saveLink, box = $('saveLink');
  box.hidden = !link;
  if (!link) return;
  const text = $('saveLinkText');
  text.textContent = '';
  if (link.wrongVersion) {
    $('saveLinkRow').hidden = true;
    text.textContent = preFoxSave()
      ? `${state.save.name} is a PES ${state.save.parsed.pes} save, for Pre-Fox (.model) players, but this export's players are Fox (.fmdl) models. Load a PES 18–21 save in the settings to use its players.`
      : `${state.save.name} is a PES ${state.save.parsed.pes} save, for Fox (.fmdl) players, but this export's players are Pre-Fox (.model) models. Load a PES 15–17 save in the settings to use its players.`;
    return;
  }
  const asking = link.unmatched || changingTeam;
  $('saveLinkRow').hidden = !asking;
  if (link.team && !changingTeam) {
    const change = el('button', { type: 'button', class: 'linkish' }, 'Change');
    change.addEventListener('click', () => { changingTeam = true; renderSaveLink(); $('saveTeamId').focus(); });
    text.append(`Names, body shapes and skin colors from ${link.team.name} (ID ${link.team.id}) in ${state.save.name}. `, change);
    return;
  }
  const name = state.aet.teamName;
  text.append(link.team ? `Which team ID in ${state.save.name} is this export? It's ${link.team.name} (ID ${link.team.id}) now.`
    : link.ambiguous ? `More than one team in ${state.save.name} is called ${name}. Which team ID is this export?`
    : name ? `No team called ${name} in ${state.save.name}. Which team ID is this export?`
      : `This export's note gives no team name. Which team ID in ${state.save.name} is it?`);
}

$('saveLink').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('saveTeamId');
  if (!useTeamId(input.value)) {
    $('saveLinkText').textContent = `${state.save.name} has no team with ID ${input.value.trim() || '(empty)'}. Which team ID is this export?`;
    input.select();
    return;
  }
  input.value = '';
  changingTeam = false;
  await showSaveLink();
});

/**
 * Show the export's link to the save as it is now: names in the roster, and the viewed player reloaded, as
 * the save decides their default models, body shape and skin color.
 */
async function showSaveLink() {
  await reloadForDefaults();
  if (state.activePlayer?.row) markActive(state.activePlayer);
  renderBodyPanel();
}

/** Link the open export with the save file again (after either changes), and show it. */
export async function refreshSaveLink() {
  changingTeam = false;
  linkSaveTeam();
  await showSaveLink();
}

// ---------------------------------------------------------------- the panel

/** Show the team panel for the open export (or hide it when there isn't one). */
export async function renderTeam() {
  const { aet } = state;
  $('team').hidden = !aet;
  $('checkButton').hidden = !aet;
  $('main').classList.toggle('has-team', !!aet);
  renderSaveLink();
  if (!aet) return;
  await renderHeader();
  const roster = $('roster');
  roster.textContent = '';
  const list = [...aet.players];
  if (aet.collars.length) list.push(aet.collarsEntry ||= { collars: true, fmdls: aet.collars, portrait: null });
  if (!list.length) roster.append(el('p', { class: 'hint', style: 'padding: 0 16px' }, 'No players found in Faces, Boots, Gloves or Portraits.'));
  for (const player of list) roster.append(playerRow(player));
}

/** Highlight a player in the list. */
export function markActive(player) {
  state.activePlayer = player;
  for (const row of $('roster').querySelectorAll('button.player')) {
    const on = row === player?.row;
    row.classList.toggle('on', on);
    row.setAttribute('aria-pressed', String(on));
  }
  player?.row?.scrollIntoView({ block: 'nearest' });
}

// ---------------------------------------------------------------- choosing players

// Loads run one at a time. Choosing players while one is loading (clicks, held hotkeys) moves the
// highlight at once, and only the last choice is loaded next.
let loading = false, queued = null;

export async function openPlayer(player) {
  markActive(player);
  renderPlayerPanel();
  if (loading) { queued = player; return; }
  loading = true;
  try {
    for (let next = player; next; next = queued, queued = null) {
      setStatus(`Loading ${playerTitle(next)}…`);
      const teamName = state.aet.teamName ? `${state.aet.teamName} · ` : '';
      await loadModels(modelsFor(next), `${teamName}${playerTitle(next)}`, next);
    }
  } finally {
    loading = false;
    setStatus(null);
  }
}

/** Players with models, in list order (Collars last). */
export function playablePlayers() {
  const { aet } = state;
  if (!aet) return [];
  return [...aet.players.filter((p) => modelsFor(p).length), ...(aet.collarsEntry ? [aet.collarsEntry] : [])].filter((p) => p.row);
}

/** Previous (-1) or next (+1) player. */
export function stepPlayer(direction) {
  const list = playablePlayers();
  if (!list.length) return;
  const i = list.indexOf(state.activePlayer);
  const next = i < 0 ? (direction > 0 ? 0 : list.length - 1) : (i + direction + list.length) % list.length;
  openPlayer(list[next]);
}

/** Reload the viewed player (keeping the camera) after their default models change. */
export async function reloadForDefaults() {
  await renderTeam();
  const player = viewedPlayer();
  if (!player) return;
  state.pendingRestore = captureView();
  try {
    if (modelsFor(player).length) await openPlayer(player);
    else showNoModels();
  } finally {
    state.pendingRestore = null;
  }
  renderPlayerPanel();
}
