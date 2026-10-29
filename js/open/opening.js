// opening.js — opening exports, archives, folders and loose files, and reloading them.
//
// Opening a model, folder or archive replaces what's open; textures opened on their own are added on
// top. Reload (and opening the same thing again) reopens everything while keeping the player, kit and
// camera.

import { $, el } from '../core/dom.js';
import {
  LOOSE, index, addSource, removeSources, clearSources, rebuildIndex, allPaths, readText, isGone, fetchAsset,
  readModelLists, isModelPath, modelsListedFor,
} from '../core/files.js';
import { setStatus, flashStatus, showError, hideError, forgetDismissedErrors } from '../core/notices.js';
import { state } from '../core/state.js';
import { database } from '../core/db.js';
import { FileIndex, normPath, fileOf, scanExport, findRoots } from '../formats/aet.js';
import { linkSaveTeam } from '../export/save-team.js';
import { readKitConfigs } from '../export/in-game.js';
import { DEFAULTS, DEFAULT_FILES, DEFAULT_LISTINGS, playerSettings } from '../export/players.js';
import { forgetTextures } from '../scene/textures.js';
import { cameraView } from '../scene/framing.js';
import { clearModels, loadModels, refreshMaterials, showNoModels } from '../viewer.js';
import { renderTeam, markActive, openPlayer, forgetPortraits } from '../ui/team.js';
import { readZip, readWith7zip } from './archives.js';
import { batchFiles, batchKey, isArchive, hasFolder, folderBatch, folderHandle } from './gather.js';

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
  const listProblems = await readModelLists(DEFAULT_LISTINGS);
  state.aet = await scanExport(index, readText, isModelPath, modelsListedFor);
  if (state.aet) state.aet.kitConfigs = await readKitConfigs(state.aet);
  linkSaveTeam();
  if (!state.aet) {
    setStatus(null);
    // Not an export: show any models it contains as loose files.
    const models = allPaths().filter((p) => isModelPath(p) && !p.startsWith(`${DEFAULTS}/`));
    if (!models.length) {
      showError(`${label} doesn't look like an aesthetics export: no "Kit Textures" folder and no .fmdl files${unlistedNote(allPaths())}.`);
      return;
    }
    await renderTeam();
    await loadModels(models, label, null, [
      `${label} has no "Kit Textures" folder, so it isn't treated as an aesthetics export. Showing its models.`, ...listProblems,
    ]);
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

/** " (… .model files, which no .xml lists)", for messages about what wasn't found, or ''. */
function unlistedNote(paths) {
  const unlisted = paths.filter((p) => /\.model$/i.test(p) && !isModelPath(p));
  if (!unlisted.length) return '';
  const names = unlisted.slice(0, 3).map(fileOf).join(', ') + (unlisted.length > 3 ? '…' : '');
  return ` (${names}: .model files are only loaded when an .xml next to them lists them, with their .mtl)`;
}

/**
 * Loose .fmdl / .dds / .ftex files, or Pre-Fox .model files with the .xml that lists them and their .mtl.
 * They're looked up next to each other, and an open export's Kit Textures and Common folders still apply.
 * Returns false if they were only textures or materials (added, not replacing).
 */
async function openLoose(files) {
  const models = files.filter((f) => /\.(fmdl|model)$/i.test(f.name));
  const support = files.filter((f) => /\.(dds|ftex|png|jpe?g|xml|mtl)$/i.test(f.name));
  if (!models.length && !support.length) {
    showError('Open an aesthetics export (.zip, .7z, .rar or folder), .fmdl files with their .dds / .ftex textures, or .model files with their .xml, .mtl and textures.');
    return true;
  }
  if (models.length) removeSources((key) => key.startsWith(`${LOOSE}/`));
  for (const file of [...models, ...support]) {
    const path = `${LOOSE}/${file.name}`;
    addSource(path, () => file.arrayBuffer());
    forgetTextures(path); // a newer copy of a texture already shown
  }
  rebuildIndex();
  const listProblems = await readModelLists(DEFAULT_LISTINGS);
  if (!models.length) { await refreshMaterials(); return false; }
  const paths = models.map((f) => `${LOOSE}/${f.name}`), shown = paths.filter(isModelPath);
  markActive(null);
  if (!shown.length) {
    showNoModels();
    showError(`Nothing to show${unlistedNote(paths)}.`);
    return true;
  }
  const unlisted = unlistedNote(paths).replace(/^ \((.*)\)$/, 'Not shown: $1');
  await loadModels(shown, shown.map(fileOf).join(', '), null, [...listProblems, unlisted].filter(Boolean));
  return true;
}

const openArchive = (file) => (/\.zip$/i.test(file.name) ? openZip(file) : openWith7zip(file));

// ---------------------------------------------------------------- several teams at once

let teams = [];       // the exports of what's open, when it has more than one: [{ key, label, archive | items }]
let teamKey = null;   // the one shown
const teamSettings = new Map(); // team key -> its players' settings, kept while another team is shown

/**
 * The exports in a batch's files, by name: every archive (opened on its own or in a folder), and each folder
 * holding a Kit Textures folder (findRoots).
 */
function teamsIn(items) {
  const inFolder = items.filter((i) => i.path && !isArchive(i.file));
  const found = items.filter((i) => isArchive(i.file))
    .map((i) => ({ key: `archive:${(i.path || i.file.name).toLowerCase()}`, label: i.file.name, archive: i.file }));
  for (const root of findRoots(new FileIndex(inFolder.map((i) => i.path)))) {
    const under = inFolder.filter((i) => !root || normPath(i.path).toLowerCase().startsWith(`${root.toLowerCase()}/`));
    found.push({ key: `folder:${root.toLowerCase()}`, label: fileOf(root) || under[0].path.split('/')[0], items: under });
  }
  return found.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * The team selector in the header, shown while more than one export is open, or listing the teams of the
 * folder remembered from the last visit until one is picked.
 */
function renderTeamSelect() {
  const select = $('teamSelect');
  select.hidden = teams.length < 2;
  select.textContent = '';
  if (remembered) select.append(el('option', { value: '', disabled: '' }, `${remembered.name}: pick a team`));
  for (const team of teams) select.append(el('option', { value: team.key }, team.label));
  select.value = teamKey ?? '';
}

function clearTeams() {
  teams = [];
  teamKey = remembered = null;
  renderTeamSelect();
}

async function openTeam(team) {
  teamKey = team.key;
  remembered = null;
  renderTeamSelect();
  $('teamSelect').disabled = true;
  try { await (team.archive ? openArchive(team.archive) : openFolder(team.items, team.label)); }
  finally { $('teamSelect').disabled = false; }
}

/** Show another of the open exports, each keeping its players' settings. */
async function switchTeam(key) {
  const team = teams.find((t) => t.key === key);
  if (!team || key === teamKey) return;
  if (remembered) return openRemembered(key);
  forgetDismissedErrors();
  hideError();
  teamSettings.set(teamKey, new Map(playerSettings));
  playerSettings.clear();
  for (const [player, settings] of teamSettings.get(key) || []) playerSettings.set(player, settings);
  await openTeam(team);
}

$('teamSelect').addEventListener('change', (e) => switchTeam(e.target.value));

/**
 * Open a batch's files. Returns false if they were textures on their own (added, not replacing).
 * With more than one export among them, the one keyed `keepTeam` is shown if it's there, else the first.
 */
async function openItems(items, label, keepTeam = null) {
  const found = teamsIn(items);
  const inFolder = items.filter((i) => i.path && !isArchive(i.file));
  if (found.length > 1) {
    teams = found;
    await openTeam(found.find((t) => t.key === keepTeam) || found[0]);
    return true;
  }
  if (found.length || inFolder.length) clearTeams();
  if (found[0]?.archive) {
    await openArchive(found[0].archive);
    return true;
  }
  if (inFolder.length) {
    await openFolder(inFolder, label || inFolder[0].path.split('/')[0]);
    return true;
  }
  const replaced = await openLoose(items.map((i) => i.file));
  if (replaced && teams.length) clearTeams();
  return replaced;
}

// ---------------------------------------------------------------- the folder remembered for the next visit

// The last folder opened with a handle (Open export folder… where the browser has showDirectoryPicker, or a
// dropped folder), kept in IndexedDB with its teams, so the next visit's team selector lists them. Reading it
// again needs the user's permission, asked for when a team is picked.
const FOLDERS = 'folders', LAST_FOLDER = 'last'; // { handle, teams: [{ key, label }] }
let remembered = null; // its handle, while the team selector lists its teams and none is open yet

async function rememberFolder(handle) {
  const kept = { handle, teams: teams.map(({ key, label }) => ({ key, label })) };
  try { await (await database()).put(FOLDERS, kept, LAST_FOLDER); }
  catch (e) { console.warn("Couldn't remember the folder in the browser:", e); }
}

/** List the teams of the folder remembered from the last visit in the team selector, if it had more than one. */
export async function restoreFolder() {
  let kept;
  try { kept = await (await database()).get(FOLDERS, LAST_FOLDER); } catch { return; }
  if (!kept || kept.teams.length < 2 || openKey || teams.length) return; // or something was opened meanwhile
  teams = kept.teams;
  teamKey = null;
  remembered = kept.handle;
  renderTeamSelect();
}

/** Open a team of the remembered folder, once the browser allows reading it again. */
async function openRemembered(key) {
  const handle = remembered;
  let allowed = false;
  try { allowed = await handle.requestPermission({ mode: 'read' }) === 'granted'; } catch { /* no longer there */ }
  if (!allowed) {
    renderTeamSelect();
    showError(`The browser didn't allow reading ${handle.name} again. Open it with Open export folder… or drop it here.`);
    return;
  }
  await openBatch(folderBatch(handle), key);
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

/** Open a dropped or picked batch; with more than one export in it, the one keyed `team` if it's there. */
export async function openBatch(batch, team = null) {
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
  try { replaced = await openItems(items, batch.label, team ?? (key && key === openKey ? teamKey : null)); }
  finally { if (reopening) state.pendingRestore = null; }

  if (replaced) {
    if (key !== openKey) { playerSettings.clear(); teamSettings.clear(); } // a different export
    openBatches = [batch];
    openKey = key;
    const folder = folderHandle(batch);
    if (folder) rememberFolder(folder);
  } else openBatches.push(batch);
  $('reload').disabled = false;
  if (reopening) flashStatus('Same files as before: kept your player, kit and view');
  if (batch.drop?.snapshot) showError(SNAPSHOT_NOTE);
}

// Where the browser won't let the viewer read dropped files again (the Claude app's browser pane), it keeps the
// copies the drop handed over.
const SNAPSHOT_NOTE = "The browser didn't let the viewer keep access to the dropped files, so Reload (R) won't pick up changes to them. Drop them again after changing them.";

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
        problem: `${item.file.name} changed on disk, and the browser won't re-read files chosen with the Open buttons once they change. Open or drop it again: the viewer will see it's the same one and keep your player, kit and view.`,
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
