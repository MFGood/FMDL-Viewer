// settings.js — the settings panel behind the cog button in the header: the global settings (display
// options, default models, the PES save file, navigation). It's laid over the details pane, which keeps its scroll position
// underneath, and leaves the viewport in view so changes show as they're made. Esc, the close button, a
// click outside or the cog again closes it.

import { $, buttonRow } from '../core/dom.js';
import { state } from '../core/state.js';
import { showError } from '../core/notices.js';
import { openSave, restoreSave, forgetSave } from '../core/save.js';
import { DEFAULT_VERSIONS, defaultVersion, setDefaultVersion, isDefaultModel, isPreFox } from '../export/players.js';
import { reloadForDefaults, refreshSaveLink } from './team.js';

const panel = () => $('settings');
const isOpen = () => !panel().hidden;

function setOpen(open) {
  panel().hidden = !open;
  $('settingsButton').setAttribute('aria-expanded', String(open));
  if (open) renderDefaultVersions();
}

/**
 * Which version of the default models to use: one choice for Fox (.fmdl) players and one for Pre-Fox
 * (.model) players. Picking one reloads the player shown if it changes their default models.
 */
export function renderDefaultVersions() {
  for (const [id, prefox] of [['defaultVersionsFox', false], ['defaultVersionsPreFox', true]]) {
    buttonRow($(id), Object.entries(DEFAULT_VERSIONS).map(([version, label]) => ({
      label, on: version === defaultVersion(prefox), onClick: async () => {
        if (version === defaultVersion(prefox)) return;
        setDefaultVersion(version, prefox);
        renderDefaultVersions();
        const paths = state.models.map((m) => m.path);
        if (paths.some(isDefaultModel) && isPreFox(paths) === prefox) await reloadForDefaults();
      },
    })));
  }
}

/** The Save file section: what's loaded, or what to load. note is added after it. */
function renderSave(note = '') {
  const save = state.save;
  refreshSaveLink(); // the open export's team in this save
  $('saveForget').hidden = !save;
  if (!save) {
    $('saveInfo').textContent = 'An EDIT00000000 (PES 16–21) or EDIT.bin (PES 15). It stays loaded in this browser between visits.';
    return;
  }
  const players = Object.keys(save.parsed.players).length;
  const teams = Object.values(save.parsed.teams).filter((team) => 'name' in team).length;
  $('saveInfo').textContent = `${save.name} · PES ${save.parsed.pes} · ${players.toLocaleString()} players · ${teams.toLocaleString()} teams${note}`;
}

function initSave() {
  const input = $('saveInput');
  input.addEventListener('change', async () => {
    const file = input.files[0];
    input.value = '';  // so picking the same file again still loads it
    if (!file) return;
    $('saveInfo').textContent = `Reading ${file.name}…`;
    try {
      const kept = await openSave(file);
      renderSave(kept ? '' : ". Couldn't keep it in this browser, so it'll need loading again next visit.");
    } catch (e) {
      renderSave();
      showError(e.message);
    }
  });

  $('saveForget').addEventListener('click', async () => {
    try { await forgetSave(); } catch (e) { console.warn("Couldn't remove the save file from this browser:", e); }
    renderSave();
  });

  renderSave();
  restoreSave().then(
    (save) => { if (save) renderSave(); },
    (e) => console.warn("Couldn't read the save file kept in this browser:", e),
  );
}

export function initSettings() {
  $('settingsButton').addEventListener('click', () => setOpen(!isOpen()));
  $('settingsClose').addEventListener('click', () => { setOpen(false); $('settingsButton').focus(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); $('settingsButton').focus(); }
  });
  addEventListener('pointerdown', (e) => {
    if (isOpen() && !panel().contains(e.target) && !$('settingsButton').contains(e.target)) setOpen(false);
  });
  renderDefaultVersions();
  initSave();
}
