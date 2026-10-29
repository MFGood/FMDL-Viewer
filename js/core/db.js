// db.js — the viewer's IndexedDB database, for what it keeps between visits: the save file ("saves") and
// the last export folder opened ("folders").

import { openDB } from 'idb';

let db = null;

export function database() {
  db ??= openDB('fmdl-viewer', 2, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) database.createObjectStore('saves');
      if (oldVersion < 2) database.createObjectStore('folders');
    },
  }).catch((e) => { db = null; throw e; });
  return db;
}
