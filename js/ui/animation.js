// animation.js — the Animation tab's picker: a category (the run cycle, or a folder of clips from
// assets/animations/clips.json), a clip in it and its hands. The clip is remembered in the browser; picking
// one turns the animation on. The hands go back to the clip's own with each new clip.

import { $ } from '../core/dom.js';
import { flashStatus } from '../core/notices.js';
import { options } from '../core/options.js';
import { listClips, setAnimation, currentAnimation, currentClipInfo, handOptions, setHandChoice, RUN_CYCLE } from '../animation/rig.js';
import { CLIP_HANDS, OPEN_HANDS, DEFAULT_HAND_POSE } from '../animation/clip.js';

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
  select.parentElement.hidden = select.labels[0].hidden = !paths.length;
}

/**
 * The hands list for the playing clip: first the clip's own, which is the game's timing for it (default) or else
 * DEFAULT_HAND_POSE (guessed, as where the game picks one for such clips isn't known); then open hands and each of
 * the game's poses, held throughout. Hidden for the run cycle, which poses its own hands.
 */
function renderHands() {
  const select = $('animHands'), info = handOptions();
  select.parentElement.hidden = select.labels[0].hidden = !info;
  if (!info) return;
  const own = new Option(info.gameTiming ? "Game's timing (default)" : `${DEFAULT_HAND_POSE} (guessed)`, CLIP_HANDS);
  const poses = [...info.poses].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).filter((name) => info.gameTiming || name !== DEFAULT_HAND_POSE);
  select.replaceChildren(own, new Option('Open', OPEN_HANDS), ...poses.map((name) => new Option(name, name)));
  select.value = info.choice;
}

function renderNote() {
  const info = currentClipInfo();
  $('animNote').textContent = info ? `${info.seconds.toFixed(1)} s · ${info.frames} frames at ${info.fps} fps` : '';
}

/**
 * Load `path` (a clip or RUN_CYCLE) and show it as picked; the run cycle if it won't load. The lists aren't
 * touched if `latest()` says another pick has come since, as they already show that one.
 */
async function pick(path, latest = () => true) {
  try { await setAnimation(path); } catch (e) { flashStatus(`Couldn't load the ${path} animation: ${e.message}`); await setAnimation(RUN_CYCLE); }
  if (!latest()) return;
  const now = currentAnimation(), category = now === RUN_CYCLE ? RUN_CYCLE : categoryOf(now);
  $('animCategory').value = category;
  showClips(category);
  if (now !== RUN_CYCLE) $('animSelect').value = now;
  renderHands();
  renderNote();
}

// Picks load one after another, so the last one picked is the one that plays even if an earlier one loads slower;
// one picked over before its turn comes (stepping through quickly) is skipped.
let picking = Promise.resolve(), lastPick = 0;

function picked(path) {
  const id = ++lastPick;
  picking = picking.then(async () => {
    if (id !== lastPick) return;
    await pick(path, () => id === lastPick);
    try { localStorage.setItem(STORAGE_KEY, currentAnimation()); } catch {}
    if (!options.run) $('tRun').click(); // turns it on (and builds the rig) through the checkbox
  });
}

export async function initAnimationPicker() {
  showClips(RUN_CYCLE);
  renderHands();
  try { categories = await listClips(); } catch {}
  $('animCategory').append(...Object.keys(categories).map((c) => new Option(c, c)));
  $('animCategory').addEventListener('change', () => {
    const category = $('animCategory').value;
    showClips(category); // straight away, not once its first clip has loaded
    picked(category === RUN_CYCLE ? RUN_CYCLE : categories[category][0]);
  });
  $('animSelect').addEventListener('change', () => picked($('animSelect').value));
  $('animHands').addEventListener('change', () => setHandChoice($('animHands').value));
  // ‹ and › beside each list step to the previous or next entry, round from the end to the start.
  for (const button of document.querySelectorAll('.anim-picker [data-step]')) {
    button.addEventListener('click', () => {
      const select = button.parentElement.querySelector('select'), n = select.options.length;
      if (!n) return;
      select.selectedIndex = (select.selectedIndex + Number(button.dataset.step) + n) % n;
      select.dispatchEvent(new Event('change'));
    });
  }
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  if (saved && !categoryOf(saved)) saved = `locomotion/${saved}`; // remembered before the clips moved up a folder
  if (categoryOf(saved)) await pick(saved);
}
