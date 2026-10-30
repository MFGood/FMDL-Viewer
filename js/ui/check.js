// check.js — the Export check panel (the header's Check export button): the findings of export/check.js for
// the open export, grouped by player. Clicking a player shows them; Copy report puts the findings on the
// clipboard as text.

import { $, el } from '../core/dom.js';
import { state } from '../core/state.js';
import { flashStatus, showError } from '../core/notices.js';
import { checkExport, reportText, LEVELS } from '../export/check.js';
import { modelsFor } from '../export/players.js';
import { openPlayer } from './team.js';
import { addPanel } from './panels.js';

const LEVEL_WORDS = { error: ['error', 'errors'], warn: ['warning', 'warnings'], note: ['note', 'notes'] };

let groups = [], checkedAet = null, running = false;

function renderReport() {
  const list = $('checkList');
  list.textContent = '';
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const group of groups) for (const item of group.items) counts[item.level]++;
  const parts = LEVELS.filter((l) => counts[l]).map((l) => `${counts[l]} ${LEVEL_WORDS[l][counts[l] === 1 ? 0 : 1]}`);
  $('checkSummary').textContent = parts.length ? parts.join(' · ') : 'No problems found.';
  for (const group of groups) {
    if (!group.items.length) continue;
    const viewable = group.player && modelsFor(group.player).length;
    const head = viewable ? el('button', { type: 'button', title: 'Show this player' }, group.title) : el('h3', {}, group.title);
    if (viewable) head.addEventListener('click', () => openPlayer(group.player));
    const items = el('ul', {}, ...group.items.map((item) => el('li', { class: `issue ${item.level}`, title: LEVEL_WORDS[item.level][0] }, item.text)));
    list.append(el('section', { class: 'check-group' }, head, items));
  }
}

/** Check the open export again and show what's found. */
async function run() {
  if (running || !state.aet) return;
  running = true;
  $('checkRun').disabled = true;
  $('checkList').textContent = '';
  try {
    checkedAet = state.aet;
    groups = await checkExport((message) => { $('checkSummary').textContent = message; });
    renderReport();
  } catch (e) {
    $('checkSummary').textContent = '';
    showError(`Couldn't check the export: ${e.message}`);
  } finally {
    running = false;
    $('checkRun').disabled = false;
  }
}

export function initCheck() {
  addPanel({
    panel: $('check'), button: $('checkButton'), close: $('checkClose'),
    onOpen: () => { if (state.aet !== checkedAet) run(); },
  });
  $('checkRun').addEventListener('click', run);
  $('checkCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(`${state.aet?.teamName || 'Export'} check\n\n${reportText(groups)}`); flashStatus('Copied the report'); }
    catch { showError("The browser didn't allow copying to the clipboard."); }
  });
}
