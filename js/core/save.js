// save.js — the PES save file (EDIT00000000 for PES 16–21, EDIT.bin for PES 15) loaded in the settings.
// Its bytes are kept in IndexedDB, which allows far more than localStorage, so it's read again on the
// next visit.

import { openDB } from 'idb';
import { SaveFile } from '../formats/pes_save.js';
import { state } from './state.js';

const STORE = 'saves';
const KEY = 'current';  // one save at a time: { name, bytes, savedAt }

let db = null;
// Bumped by openSave and forgetSave, so a restore still under way doesn't undo them.
let generation = 0;
function database() {
  db ??= openDB('fmdl-viewer', 1, {
    upgrade(database) { database.createObjectStore(STORE); },
  }).catch((e) => { db = null; throw e; });
  return db;
}

/** Parse save bytes, throwing if they aren't a PES 15–21 save. */
async function parse(name, bytes) {
  const parsed = new SaveFile();
  // The PES 15 reader decrypts in place, so give it a copy and keep bytes as they are on disk.
  if (!await parsed.load(bytes.slice(0))) throw new Error(`${name} isn't a PES 15–21 save file.`);
  return parsed;
}

/**
 * Read a save the user picked and make it state.save, replacing any other. Resolves to whether it was
 * kept in this browser too (IndexedDB can be unavailable, as in some private windows).
 * @param {File} file
 */
export async function openSave(file) {
  generation++;
  const bytes = await file.arrayBuffer();
  state.save = { name: file.name, parsed: await parse(file.name, bytes) };
  try {
    await (await database()).put(STORE, { name: file.name, bytes, savedAt: Date.now() }, KEY);
    return true;
  } catch (e) {
    console.warn("Couldn't keep the save file in this browser:", e);
    return false;
  }
}

/** Make the save kept in this browser state.save. Resolves to it, or null if none is kept. */
export async function restoreSave() {
  const started = generation;
  const kept = await (await database()).get(STORE, KEY);
  if (!kept) return null;
  const parsed = await parse(kept.name, kept.bytes);
  if (generation !== started) return null;  // another save was picked, or this one forgotten, meanwhile
  state.save = { name: kept.name, parsed };
  return state.save;
}

/** Drop the save, here and in this browser's storage. */
export async function forgetSave() {
  generation++;
  state.save = null;
  await (await database()).delete(STORE, KEY);
}
