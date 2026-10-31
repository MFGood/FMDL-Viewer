// tabs.js — the details pane's tabs: Player, Animation and Model. The Player tab is only offered while one
// of its sections is shown; until then the pane shows Model. The tab picked last is remembered in the browser.

import { $ } from '../core/dom.js';

const STORAGE_KEY = 'detailsTab';
const tabs = [...document.querySelectorAll('#details [role=tab]')];
const panelOf = (tab) => $(tab.getAttribute('aria-controls'));

let wanted = 'player';
try { wanted = localStorage.getItem(STORAGE_KEY) || wanted; } catch {}

/** Show the wanted tab, or Model while the wanted one has nothing to show. */
function render() {
  const player = tabs.find((tab) => tab.dataset.tab === 'player');
  player.hidden = [...panelOf(player).children].every((section) => section.hidden);
  const shown = tabs.find((tab) => tab.dataset.tab === wanted && !tab.hidden) || tabs.find((tab) => tab.dataset.tab === 'model');
  for (const tab of tabs) {
    const on = tab === shown, panel = panelOf(tab);
    tab.setAttribute('aria-selected', on);
    tab.tabIndex = on ? 0 : -1;
    if (panel.hidden === on) panel.hidden = !on; // only on a change, as the observer below sees every set
  }
}

/** Show tab `name` ('player', 'animation' or 'model') and remember it. */
export function showTab(name) {
  wanted = name;
  try { localStorage.setItem(STORAGE_KEY, name); } catch {}
  render();
}

export function initTabs() {
  for (const tab of tabs) tab.addEventListener('click', () => showTab(tab.dataset.tab));
  // Arrow keys move between the tabs, as in a tab list.
  $('details').querySelector('[role=tablist]').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const visible = tabs.filter((tab) => !tab.hidden), i = visible.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = visible[(i + (e.key === 'ArrowLeft' ? -1 : 1) + visible.length) % visible.length];
    showTab(next.dataset.tab);
    next.focus();
  });
  // The Player sections are shown and hidden as players load; follow them.
  new MutationObserver(render).observe($('panelPlayer'), { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  render();
}
