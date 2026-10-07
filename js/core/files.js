// files.js — the virtual file system. Every opened file (loose, from an archive, from a folder, or one of
// the viewer's own assets) is registered here under a path, with a function that reads it on demand.

import { FileIndex, normPath } from '../formats/aet.js';

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
