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
 * exist are kept, and only they are loaded, as in the game (plus face-folder hair; see readModelLists).
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

// Types a face.xml can give a model, matched against the start of its name by the 4cc AET compiler.
const FACE_MODEL_TYPES = ['face_neck', 'handL', 'handR', 'gloveL', 'gloveR', 'uniform', 'shirt', 'pants_nocloth', 'eye', 'mouth'];

/**
 * The face.xml entries the 4cc AET compiler writes for a face folder without one: every .model in it (and its
 * subfolders) but hair_high_win32.model, which the game loads anyway. The type comes from the start of the name
 * without oral_ / _win32 (face_high_win32 is face_neck; "…model_type_X" is X; else parts); the .mtl is one in
 * the model's folder, then the face folder, whose name starts or ends the model's (else materials.mtl, else any).
 */
function compilerFaceList(dir) {
  const entries = [];
  for (const path of index.filesUnder(dir).filter((p) => /\.model$/i.test(p))) {
    const name = fileOf(path).toLowerCase();
    if (name === 'hair_high_win32.model') continue;
    const core = name === 'face_high_win32.model' ? 'face_neck'
      : /^oral_.*_win32\.model$/.test(name) ? name.replace(/^oral_/, '').replace(/_win32\.model$/, '') : name.replace(/\.model$/, '');
    const simple = core.replace(/_/g, '');
    const type = FACE_MODEL_TYPES.find((t) => simple.startsWith(t.replace(/_/g, '').toLowerCase()))
      || (core.includes('model_type_') ? core.split('model_type_')[1] : 'parts');
    const mtlIn = (folder) => {
      const mtls = index.filesIn(folder).filter((p) => /\.mtl$/i.test(p));
      const stemOf = (p) => fileOf(p).toLowerCase().replace(/\.mtl$/, '');
      return mtls.find((p) => core.startsWith(stemOf(p)) || core.endsWith(stemOf(p)))
        || mtls.find((p) => stemOf(p) === 'materials') || mtls[0] || null;
    };
    entries.push({ path, mtl: mtlIn(dirOf(path)) || mtlIn(dir), type });
  }
  return entries;
}

/**
 * Read every open .xml for the .model files it lists (call after rebuildIndex). Returns problems found.
 *
 * A face folder without a face.xml gets the one the 4cc AET compiler would write for it (compilerFaceList), as
 * exports leave it to the compiler, and so does a gloves folder without a glove.xml (glove_l / glove_r.model,
 * with glove_l / glove_r.mtl, else materials.mtl). A boots folder has no .xml: the game loads its boots.model,
 * with boots.mtl. Hair is the other exception: a face folder's hair_*.model files are always loaded, unless
 * the folder has a hair.xml, which then decides like any other .xml. They use the folder's hair.mtl, else its
 * face.mtl.
 */
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
  for (const dir of faceFolders()) {
    const inDir = (name) => index.real(`${dir ? `${dir}/` : ''}${name}`);
    if (!inDir('face.xml')) {
      for (const entry of compilerFaceList(dir)) {
        if (!lists.has(entry.path.toLowerCase())) lists.set(entry.path.toLowerCase(), { ...entry, xml: null });
      }
    }
    if (inDir('hair.xml')) continue;
    const mtl = inDir('hair.mtl') || inDir('face.mtl');
    for (const path of index.filesIn(dir).filter((p) => /^hair_.*\.model$/i.test(fileOf(p)))) {
      if (!lists.has(path.toLowerCase())) lists.set(path.toLowerCase(), { path, mtl, type: 'hair', xml: null });
    }
  }
  const add = (entry) => { if (!lists.has(entry.path.toLowerCase())) lists.set(entry.path.toLowerCase(), { ...entry, xml: null }); };
  for (const dir of gearFolders('boots')) {
    const inDir = (name) => index.real(`${dir}/${name}`);
    const path = inDir('boots.model');
    if (path) add({ path, mtl: inDir('boots.mtl') || inDir('materials.mtl'), type: 'boots' });
  }
  for (const dir of gearFolders('gloves')) {
    const inDir = (name) => index.real(`${dir}/${name}`);
    if (inDir('glove.xml')) continue;
    for (const side of ['l', 'r']) {
      const path = inDir(`glove_${side}.model`);
      if (path) add({ path, mtl: inDir(`glove_${side}.mtl`) || inDir('materials.mtl'), type: `glove${side.toUpperCase()}` });
    }
  }
  listedModels = lists;
  return problems;
}

/** Boots or gloves folders: those directly inside a Boots / Gloves folder (or the game's boots / glove). */
function gearFolders(kind) {
  const parent = kind === 'boots' ? /^boots$/i : /^gloves?$/i, dirs = new Set();
  for (const path of allPaths()) {
    const dir = dirOf(path);
    if (dir && parent.test(fileOf(dirOf(dir)))) dirs.add(dir);
  }
  return dirs;
}

/** Face folders: those with a face.xml, and any folder directly inside a Faces folder. */
function faceFolders() {
  const dirs = new Set();
  for (const path of allPaths()) {
    const dir = dirOf(path);
    if (/^face\.xml$/i.test(fileOf(path)) || /^faces$/i.test(fileOf(dirOf(dir)))) dirs.add(dir);
  }
  return dirs;
}

/** Whether a path is a model the viewer loads: any .fmdl, or a .model an .xml (or readModelLists' rules) lists. */
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
