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

/** Show the team panel for the open export (or hide it when there isn't one). */
export async function renderTeam() {
  const { aet } = state;
  $('team').hidden = !aet;
  $('main').classList.toggle('has-team', !!aet);
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
