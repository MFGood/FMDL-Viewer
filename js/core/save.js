// save.js — the PES save file (EDIT00000000 for PES 16–21, EDIT.bin for PES 15) loaded in the settings.
// Its bytes are kept in IndexedDB, which allows far more than localStorage, so it's read again on the
// next visit.

import { SaveFile } from '../formats/pes_save.js';
import { database } from './db.js';
import { state } from './state.js';

const STORE = 'saves';
const KEY = 'current';  // one save at a time: { name, bytes, savedAt }

// Bumped by openSave and forgetSave, so a restore still under way doesn't undo them.
let generation = 0;

/** Parse save bytes, throwing if they aren't a PES 15–21 save. */
async function parse(name, bytes) {
  const parsed = new SaveFile();
  if (!await parsed.load(bytes)) throw new Error(`${name} isn't a PES 15–21 save file.`);
  return parsed;
}

/**
 * Read a save the user picked and make it state.save, replacing any other. Resolves to whether it was
 * kept in the browser too (IndexedDB can be unavailable, as in some private windows).
 * @param {File} file
 * @param {FileSystemFileHandle} [handle] - where the file came from, when picked with showOpenFilePicker
 */
export async function openSave(file, handle = null) {
  generation++;
  const bytes = await file.arrayBuffer();
  state.save = { name: file.name, parsed: await parse(file.name, bytes), handle };
  try {
    await (await database()).put(STORE, { name: file.name, bytes, handle, savedAt: Date.now() }, KEY);
    return true;
  } catch (e) {
    console.warn("Couldn't keep the save file in the browser:", e);
    return false;
  }
}

/** Make the save kept in the browser state.save. Resolves to it, or null if none is kept. */
export async function restoreSave() {
  const started = generation;
  const kept = await (await database()).get(STORE, KEY);
  if (!kept) return null;
  const parsed = await parse(kept.name, kept.bytes);
  if (generation !== started) return null;  // another save was picked, or this one forgotten, meanwhile
  state.save = { name: kept.name, parsed, handle: kept.handle ?? null };
  return state.save;
}

let keepTimer = null;
/**
 * Write edits made to the save's players back into it and keep it in the browser, a moment after the last
 * edit (re-encrypting the whole save on every slider step would be wasteful).
 */
export function keepSaveEdits() {
  clearTimeout(keepTimer);
  const save = state.save, started = generation;
  keepTimer = setTimeout(async () => {
    if (state.save !== save || generation !== started) return;
    try {
      const bytes = save.parsed.save();
      await (await database()).put(STORE, { name: save.name, bytes: bytes.buffer, handle: save.handle, savedAt: Date.now() }, KEY);
    } catch (e) {
      console.warn("Couldn't keep the edited save file in the browser:", e);
    }
  }, 500);
}

/**
 * Save the save, with any edits made to it, under the name it was loaded with: through a save dialog
 * opened in the folder it was loaded from where the browser can, else as a download.
 */
export async function exportSave() {
  const { name, parsed, handle } = state.save;
  const bytes = parsed.save();
  if (window.showSaveFilePicker) {
    let target;
    try {
      target = await showSaveFilePicker({ suggestedName: name, ...(handle && { startIn: handle }) });
    } catch (e) {
      if (e.name === 'AbortError') return;  // cancelled
      throw e;
    }
    const writable = await target.createWritable();
    await writable.write(bytes);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Drop the save, here and in the browser's storage. */
export async function forgetSave() {
  generation++;
  state.save = null;
  await (await database()).delete(STORE, KEY);
}
