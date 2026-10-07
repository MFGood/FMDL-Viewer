// opening.js — opening exports, archives, folders and loose files, and reloading them.
//
// Opening a model, folder or archive replaces what's open; textures opened on their own are added on
// top. Reload (and opening the same thing again) reopens everything while keeping the player, kit and
// camera.

import { $ } from '../core/dom.js';
import {
  LOOSE, index, addSource, removeSources, clearSources, rebuildIndex, allPaths, readText, isGone, fetchAsset,
} from '../core/files.js';
import { setStatus, flashStatus, showError, hideError, forgetDismissedErrors } from '../core/notices.js';
import { state } from '../core/state.js';
import { normPath, scanExport } from '../formats/aet.js';
import { DEFAULTS, DEFAULT_FILES, playerSettings } from '../export/players.js';
import { forgetTextures } from '../scene/textures.js';
import { cameraView } from '../scene/framing.js';
import { clearModels, loadModels, refreshMaterials, showNoModels } from '../viewer.js';
import { renderTeam, markActive, openPlayer, forgetPortraits } from '../ui/team.js';
import { readZip, readWith7zip } from './archives.js';
import { batchFiles, batchKey, isArchive, hasFolder } from './gather.js';

// ---------------------------------------------------------------- the viewer's own files

/** Register the default models (fetched from assets/defaults/ when first read). */
function addDefaultSources() {
  for (const name of DEFAULT_FILES) addSource(`${DEFAULTS}/${name}`, () => fetchAsset(`assets/defaults/${name}`));
}

/** Start with the bundled example, so the viewer opens in a working state. */
export async function openSample() {
  addDefaultSources();
  for (const name of ['sample.fmdl', 'u0101p1.ftex', 'u0101p2.ftex', 'u0101p3.ftex']) {
    addSource(`${LOOSE}/${name}`, () => fetchAsset(`assets/sample/${name}`));
  }
  rebuildIndex();
  await loadModels([`${LOOSE}/sample.fmdl`], 'sample.fmdl (example)');
}

// ---------------------------------------------------------------- replacing what's open

function resetAll() {
  $('playerSection').hidden = true;
  clearModels();
  forgetTextures();
  forgetPortraits();
  clearSources();
  addDefaultSources();
  rebuildIndex();
  Object.assign(state, { aet: null, activePlayer: null, currentKit: null, chosenKit: null });
}

/** The player to show after (re)opening an export: the one viewed before a reload, or the first with models. */
function playerToOpen() {
  const { aet } = state, want = state.pendingRestore?.player;
  const same = want && (want.collars
    ? aet.collarsEntry
    : aet.players.find((p) => p.fmdls.length && p.number === want.number && p.gearId === want.gearId && (p.number != null || p.gearId || p.name === want.name)));
  return same || aet.players.find((p) => p.fmdls.length);
}

/** Open what's registered in the file system as an aesthetics export. */
async function openExport(label) {
  rebuildIndex();
  setStatus('Reading export…');
  state.aet = await scanExport(index, readText);
  if (!state.aet) {
    setStatus(null);
    // Not an export: show any models it contains as loose files.
    const models = allPaths().filter((p) => /\.fmdl$/i.test(p));
    if (!models.length) { showError(`${label} doesn't look like an aesthetics export: no "Kit Textures" folder and no .fmdl files.`); return; }
    await renderTeam();
    await loadModels(models, label);
    showError(`${label} has no "Kit Textures" folder, so it isn't treated as an aesthetics export. Showing its .fmdl files.`);
    return;
  }
  await renderTeam();
  if (state.pendingRestore?.kit) state.chosenKit = state.pendingRestore.kit; // shown again if the files still have it
  const player = playerToOpen();
  if (player) await openPlayer(player);
  else { showNoModels(); $('fileName').textContent = state.aet.teamName || label; }
  setStatus(null);
}

async function openZip(file) {
  setStatus(`Unzipping ${file.name}…`);
  const files = await readZip(file);
  if (!files) return openWith7zip(file); // 7-Zip reads more zip variants
  resetAll();
  for (const { path, read } of files) addSource(path, read);
  await openExport(file.name);
}

async function openWith7zip(file) {
  setStatus(`Extracting ${file.name}…`);
  let result;
  try { result = await readWith7zip(file, (n) => setStatus(`Extracting ${file.name}… ${n} files`)); }
  catch (e) { setStatus(null); showError(`Couldn't open ${file.name}: ${e.message}`); return; }
  resetAll();
  for (const { path, read } of result.files) addSource(path, read);
  await openExport(file.name);
  if (result.warning) showError(`${file.name} opened with problems: ${result.warning}`);
}

async function openFolder(items, label) {
  resetAll();
  for (const { path, file } of items) addSource(path, () => file.arrayBuffer());
  await openExport(label);
}

/**
 * Loose .fmdl / .dds / .ftex files. They're looked up next to each other, and an open export's Kit
 * Textures and Common folders still apply. Returns false if they were only textures (added, not replacing).
 */
async function openLoose(files) {
  const models = files.filter((f) => /\.fmdl$/i.test(f.name));
  const textures = files.filter((f) => /\.(dds|ftex)$/i.test(f.name));
  if (!models.length && !textures.length) {
    showError('Open an aesthetics export (.zip, .7z, .rar or folder), or .fmdl files with their .dds / .ftex textures.');
    return true;
  }
  if (models.length) removeSources((key) => key.startsWith(`${LOOSE}/`));
  for (const file of [...models, ...textures]) {
    const path = `${LOOSE}/${file.name}`;
    addSource(path, () => file.arrayBuffer());
    forgetTextures(path); // a newer copy of a texture already shown
  }
  rebuildIndex();
  if (!models.length) { await refreshMaterials(); return false; }
  markActive(null);
  await loadModels(models.map((f) => `${LOOSE}/${f.name}`), models.map((f) => f.name).join(', '));
  return true;
}

/** Open a batch's files. Returns false if they were textures on their own (added, not replacing). */
async function openItems(items, label) {
  const archive = items.map((i) => i.file).find(isArchive);
  if (archive) {
    await (/\.zip$/i.test(archive.name) ? openZip(archive) : openWith7zip(archive));
    return true;
  }
  const inFolder = items.filter((i) => i.path);
  if (inFolder.length) {
    await openFolder(inFolder, label || inFolder[0].path.split('/')[0]);
    return true;
  }
  return openLoose(items.map((i) => i.file));
}

// ---------------------------------------------------------------- batches and reloading

let openBatches = []; // what's open now, oldest first (see gather.js)
let openKey = null;   // batchKey of what's open now

/** The player, kit and camera to put back after reopening the same thing. */
export function captureView() {
  const p = state.activePlayer;
  return {
    player: p ? { number: p.number, gearId: p.gearId, name: p.name, collars: !!p.collars } : null,
    kit: state.chosenKit,
    camera: state.models.length ? cameraView() : null,
  };
}

/** Open a dropped or picked batch. */
export async function openBatch(batch) {
  if (!batch) return;
  if (!state.pendingRestore) forgetDismissedErrors(); // a reload does this itself
  if (hasFolder(batch)) setStatus('Reading folder…');
  let items;
  try { items = await batchFiles(batch); }
  catch (e) { setStatus(null); showError(`Couldn't read ${batch.label}: ${e.message}`); return; }
  if (!items.length) { setStatus(null); return; }

  // Opening the same export, archive or model again counts as a reload: keep the view.
  const key = batchKey(items);
  const reopening = !state.pendingRestore && key && key === openKey && state.models.length > 0;
  if (reopening) state.pendingRestore = captureView();
  let replaced;
  try { replaced = await openItems(items, batch.label); }
  finally { if (reopening) state.pendingRestore = null; }

  if (replaced) {
    if (key !== openKey) playerSettings.clear(); // a different export
    openBatches = [batch];
    openKey = key;
  } else openBatches.push(batch);
  $('reload').disabled = false;
  if (reopening) flashStatus('Same files as before: kept your player, kit and view');
}

/** Picked files that changed on disk can't be re-read in Chrome: check before tearing anything down. */
async function checkReadable(batch) {
  const gone = [];
  if (!batch.picked) return { problem: null, gone };
  for (const item of batch.picked) {
    try { await item.file.slice(0, 1).arrayBuffer(); }
    catch (e) {
      if (isGone(e)) { gone.push(item); continue; } // deleted: just leave it out
      return {
        gone,
        problem: `${item.file.name} changed on disk, and this browser won't re-read files chosen with the Open buttons once they change. Open or drop it again: the viewer will see it's the same one and keep your player, kit and view.`,
      };
    }
  }
  return { problem: null, gone };
}

/** Reopen everything that's open, keeping the player, kit and camera. */
export async function reload() {
  if (!openBatches.length) return;
  const batches = [...openBatches];
  const goneNames = [];
  forgetDismissedErrors();
  for (const batch of batches) {
    const { problem, gone } = await checkReadable(batch);
    if (problem) { showError(problem); return; }
    if (gone.length) {
      batch.picked = batch.picked.filter((i) => !gone.includes(i));
      goneNames.push(...gone.map((i) => i.file.name));
    }
  }
  state.pendingRestore = captureView();
  hideError();
  setStatus('Reloading…');
  try {
    openBatches = [];
    for (const batch of batches) await openBatch(batch);
  } finally {
    state.pendingRestore = null;
    setStatus(null);
  }
  if (goneNames.length) showError(`No longer on disk, so left out: ${goneNames.join(', ')}`);
}

export const canReload = () => openBatches.length > 0;

/** Drop files that no longer exist: from the file system, the batches to reload and the export's player lists. */
export async function forgetFiles(paths) {
  const drop = new Set(paths.map((p) => normPath(p).toLowerCase()));
  removeSources((key) => drop.has(key));
  rebuildIndex();
  for (const batch of openBatches) {
    if (batch.picked) batch.picked = batch.picked.filter((i) => !drop.has(normPath(i.path || `${LOOSE}/${i.file.name}`).toLowerCase()));
  }
  const { aet } = state;
  if (!aet) return;
  const keep = (list) => list.filter((p) => !drop.has(normPath(p).toLowerCase()));
  for (const player of aet.players) {
    player.fmdls = keep(player.fmdls);
    for (const part of [player.face, player.boots, player.gloves]) if (part) part.fmdls = keep(part.fmdls);
  }
  aet.collars = keep(aet.collars);
  if (aet.collarsEntry) aet.collarsEntry.fmdls = aet.collars;
  await renderTeam();
  if (state.activePlayer?.row) markActive(state.activePlayer);
}
