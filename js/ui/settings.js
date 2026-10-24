// settings.js — the settings panel behind the cog button in the header: the global settings (display
// options, default models, navigation). It stays open over the viewport so changes show as they're made;
// Esc, a click outside or the cog again closes it.

import { $, buttonRow } from '../core/dom.js';
import { state } from '../core/state.js';
import { DEFAULT_VERSIONS, defaultVersion, setDefaultVersion, isDefaultModel, isPreFox } from '../export/players.js';
import { reloadForDefaults } from './team.js';

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
}
