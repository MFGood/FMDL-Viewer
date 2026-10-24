// files.js — the virtual file system. Every opened file (loose, from an archive, from a folder, or one of
// the viewer's own assets) is registered here under a path, with a function that reads it on demand.

import { FileIndex, normPath, dirOf, fileOf } from '../formats/aet.js';
import { parseModelXml, resolveRelative } from '../formats/mtl.js';
import { unwrapWesys } from '../formats/model.js';

/** Folder that files opened on their own are put under. */
export const LOOSE = 'loose';

const sources = new Map(); // lowercase path -> { path, read: () => Promise<ArrayBuffer> }

/** Index of every open path, for looking files up by folder and name. Rebuilt by rebuildIndex(). */
export let index = new FileIndex();

export function rebuildIndex() { index = new FileIndex(allPaths()); }

export function addSource(path, read) {
  path = normPath(path);
  sources.set(path.toLowerCase(), { path, read });
}

export function removeSources(test) {
  for (const key of [...sources.keys()]) if (test(key)) sources.delete(key);
}

export function clearSources() { sources.clear(); }

export const allPaths = () => [...sources.values()].map((s) => s.path);

export async function readFile(path) {
  const source = sources.get(normPath(path).toLowerCase());
  if (!source) throw new Error(`${path} is not open`);
  return source.read();
}

export const readText = async (path) => new TextDecoder('utf-8').decode(await readFile(path));

/** A text file that may be WESYS zlib-compressed (Pre-Fox .xml and .mtl files can be). */
export const readGameText = async (path) => new TextDecoder('utf-8').decode(await unwrapWesys(await readFile(path)));

// ---------------------------------------------------------------- Pre-Fox model lists

/**
 * Pre-Fox .model files listed in the open .xml files: lowercase path -> { path, mtl, type, xml }, where mtl
 * is the .mtl the .xml assigns (null if none) and type the .xml's type for it. Only listed .model files that
 * exist are kept, and only they are loaded, as in the game.
 * Rebuilt by readModelLists().
 */
export let listedModels = new Map();

/** A path from an .xml or .mtl in folder `dir`, as an open file: relative to it, else by name in it. */
function openPathFrom(dir, path) {
  const relative = resolveRelative(dir, path);
  return index.real(relative) || index.real(`${dir ? `${dir}/` : ''}${fileOf(normPath(path))}`) || relative;
}

/**
 * A model path from an .xml in folder `dir`. Its file name can have wildcards ("./face_high_*.model", which
 * the game fills in per platform); several matches prefer the PC one (win32).
 */
function modelPathFrom(dir, path) {
  if (!/[*?]/.test(path)) return openPathFrom(dir, path);
  const target = resolveRelative(dir, path);
  const pattern = new RegExp(`^${fileOf(target).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i');
  const matches = index.filesIn(dirOf(target)).filter((p) => pattern.test(fileOf(p)));
  return matches.find((p) => /win32/i.test(fileOf(p))) || matches[0] || target;
}

/** Read every open .xml for the .model files it lists (call after rebuildIndex). Returns problems found. */
export async function readModelLists() {
  const lists = new Map(), problems = [];
  for (const xml of allPaths().filter((p) => /\.xml$/i.test(p))) {
    let entries;
    try { entries = parseModelXml(await readGameText(xml)); }
    catch (e) { if (!isGone(e)) problems.push(`Couldn't read ${fileOf(xml)}: ${e.message}`); continue; }
    const dir = dirOf(xml);
    for (const entry of entries) {
      const path = modelPathFrom(dir, entry.model);
      if (!index.has(path) || lists.has(path.toLowerCase())) continue;
      lists.set(path.toLowerCase(), { path, mtl: entry.mtl ? openPathFrom(dir, entry.mtl) : null, type: entry.type, xml });
    }
  }
  listedModels = lists;
  return problems;
}

/** Whether a path is a model the viewer loads: any .fmdl, or a .model an .xml lists. */
export const isModelPath = (path) => /\.fmdl$/i.test(path) || listedModels.has(normPath(path).toLowerCase());

/**
 * A file deleted from disk after it was opened. Browsers report it as NotFoundError; a file that was
 * only changed (which Chrome also refuses to re-read) gives a different error.
 */
export const isGone = (error) => error?.name === 'NotFoundError';

/** URL of one of the viewer's own files (assets/, vendor/, workers/), relative to the site root. */
export const siteUrl = (path) => new URL(`../../${path}`, import.meta.url).href;

/** Fetch one of the viewer's own files as an ArrayBuffer. */
export async function fetchAsset(path) {
  const response = await fetch(siteUrl(path));
  if (!response.ok) throw new Error(`couldn't load ${path} (${response.status})`);
  return response.arrayBuffer();
}
