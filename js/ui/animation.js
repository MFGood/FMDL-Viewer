// animation.js — the Animation tab's picker: a category (the run cycle, or a folder of clips from
// assets/animations/clips.json) and a clip in it. The pick is remembered in the browser; picking one
// turns the animation on.

import { $ } from '../core/dom.js';
import { flashStatus } from '../core/notices.js';
import { options } from '../core/options.js';
import { listClips, setAnimation, currentAnimation, currentClipInfo, RUN_CYCLE } from '../animation/rig.js';

const STORAGE_KEY = 'animation';
let categories = {}; // { category: [path, …] }

/** A clip's name in its list: its path below the category's folder, without the extension or a file prefix every celebration has. */
function clipNames(paths) {
  const dirs = paths.map((p) => p.split('/').slice(0, -1));
  let common = dirs[0]?.length ?? 0;
  for (const d of dirs) while (common && d.slice(0, common).join('/') !== dirs[0].slice(0, common).join('/')) common--;
  return paths.map((p) => p.split('/').slice(common).join(' / ').replace(/\.(anim|gani)$/i, '').replace(/^dml_goal_celebrate_/, ''));
}

const categoryOf = (path) => Object.keys(categories).find((c) => categories[c].includes(path));

function showClips(category) {
  const select = $('animSelect'), paths = categories[category] || [];
  const names = clipNames(paths);
  select.replaceChildren(...paths.map((p, i) => new Option(names[i], p)));
  select.hidden = $('animSelect').labels[0].hidden = !paths.length;
}

function renderNote() {
  const info = currentClipInfo();
  $('animNote').textContent = info ? `${info.seconds.toFixed(1)} s · ${info.frames} frames at ${info.fps} fps` : '';
}

/** Load `path` (a clip or RUN_CYCLE) and show it as picked; the run cycle if it won't load. */
async function pick(path) {
  try { await setAnimation(path); } catch (e) { flashStatus(`Couldn't load the ${path} animation: ${e.message}`); await setAnimation(RUN_CYCLE); }
  const now = currentAnimation(), category = now === RUN_CYCLE ? RUN_CYCLE : categoryOf(now);
  $('animCategory').value = category;
  showClips(category);
  if (now !== RUN_CYCLE) $('animSelect').value = now;
  renderNote();
}

// Picks load one after another, so the last one picked is the one that plays even if an earlier one loads slower.
let picking = Promise.resolve();

function picked(path) {
  picking = picking.then(async () => {
    await pick(path);
    try { localStorage.setItem(STORAGE_KEY, currentAnimation()); } catch {}
    if (!options.run) $('tRun').click(); // turns it on (and builds the rig) through the checkbox
  });
}

export async function initAnimationPicker() {
  showClips(RUN_CYCLE);
  try { categories = await listClips(); } catch {}
  $('animCategory').append(...Object.keys(categories).map((c) => new Option(c, c)));
  $('animCategory').addEventListener('change', () => {
    const category = $('animCategory').value;
    showClips(category); // straight away, not once its first clip has loaded
    picked(category === RUN_CYCLE ? RUN_CYCLE : categories[category][0]);
  });
  $('animSelect').addEventListener('change', () => picked($('animSelect').value));
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  if (saved && !categoryOf(saved)) saved = `locomotion/${saved}`; // remembered before the clips moved up a folder
  if (categoryOf(saved)) await pick(saved);
}
