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
 * Pre-Fox .model files listed in the open .xml files: lowercase path -> { path, mtl, type, xml, kit }, where
 * mtl is the .mtl the .xml assigns (null if none), type the .xml's type for it and kit the kit a kit-numbered
 * model is for (null for any). Only listed .model files that exist are kept, and only they are loaded, as in
 * the game (plus what the compiler and game add; see readModelLists).
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

// ---------------------------------------------------------------- the 4cc AET compiler's rules

// Kit-numbered names: u0XXXp1 … p9 (XXX the team ID). The compiler writes them into a face.xml as p0, which the
// game fills in with the kit being worn, so only the current kit's file of a set is shown (see kitOfModel).
const KIT_NUMBERED = /(u0[a-z0-9]{3}p)([0-9])/i;

/** The kit ("p1"…) a kit-numbered name is for, or null. */
const kitOfName = (name) => { const m = KIT_NUMBERED.exec(name); return m && m[2] !== '0' ? `p${m[2]}` : null; };

/** A kit-numbered path with its kit number swapped for this kit's ("p2"), if that file is open; else the path. */
function forKit(path, kit) {
  if (!path || !kit || !KIT_NUMBERED.test(fileOf(path))) return path;
  return index.real(`${dirOf(path)}/${fileOf(path).replace(KIT_NUMBERED, `$1${kit.slice(1)}`)}`) || path;
}

/** The open files of a p0 path's set, one per kit: [{ path, kit }] (none if the path isn't a p0 one). */
function kitFilesOf(path) {
  const m = KIT_NUMBERED.exec(fileOf(path));
  if (!m || m[2] !== '0') return [];
  const pattern = new RegExp(`^${fileOf(path).replace(/[.+^${}()|[\]\\*?]/g, '\\$&').replace(KIT_NUMBERED, `$1[1-9]`)}$`, 'i');
  return index.filesIn(dirOf(path)).filter((p) => pattern.test(fileOf(p))).map((p) => ({ path: p, kit: kitOfName(fileOf(p)) }));
}

// .common links: "name.model.common" (or ".common.txt") in a face folder stands for name.model in the export's
// Common folder, in the subfolder of the same name as the link's; the same for .mtl files.
const COMMON_LINK = /\.common(\.txt)?$/i;

/** The export's Common folder for a folder inside it, or null. */
function commonFolderOf(dir) {
  for (let d = dirOf(dir); ; d = dirOf(d)) {
    const common = index.subdir(d, 'Common');
    if (common) return common;
    if (!d) return null;
  }
}

/**
 * The file a .common link in face folder `faceDir` stands for, or null when Common hasn't it. The compiler adds
 * oral_ and _win32 to a Common .model's name, so that name is tried too.
 */
function commonTarget(link, faceDir) {
  const common = commonFolderOf(faceDir);
  if (!common) return null;
  const name = fileOf(link).replace(COMMON_LINK, ''), sub = dirOf(link).slice(faceDir.length).replace(/^\//, '');
  const dir = sub ? `${common}/${sub}` : common;
  return index.real(`${dir}/${name}`) || (/\.model$/i.test(name) && index.real(`${dir}/oral_${name.replace(/\.model$/i, '_win32.model')}`)) || null;
}

/** A face.xml path into the game's uniform common folder, as the open export's Common file; else null. */
function commonPathFrom(dir, path) {
  const m = /(?:^|\/)model\/character\/uniform\/common\/[^/]+\/(.+)$/i.exec(normPath(path));
  const common = m && commonFolderOf(dir);
  if (!common) return null;
  const name = fileOf(m[1]), sub = dirOf(m[1]);
  const inCommon = (file) => index.real(`${common}/${sub ? `${sub}/` : ''}${file}`);
  return inCommon(name) || inCommon(name.replace(/^oral_(.*)_win32(\.model)$/i, '$1$2'));
}

// Types a face.xml can give a model, matched against the start of its name by the 4cc AET compiler.
const FACE_MODEL_TYPES = ['face_neck', 'handL', 'handR', 'gloveL', 'gloveR', 'uniform', 'shirt', 'pants_nocloth', 'eye', 'mouth'];

/**
 * The face.xml entries the 4cc AET compiler writes for a face folder without one: every .model in it (and its
 * subfolders, and the Common ones its .common links stand for) but hair_high_win32.model, which the game loads
 * anyway. The type comes from the start of the name without oral_ / _win32 (face_high_win32 is face_neck;
 * "…model_type_X" is X; else parts). The .mtl is one whose name starts or ends the model's, else materials.mtl,
 * else any, looked for in the model's folder, then the face folder; for a Common model, one in the link's folder
 * whose name matches comes first, then Common's folder. An .mtl can be a .common link too. A kit-numbered model
 * is for one kit (kit), and so is its .mtl.
 */
function compilerFaceList(dir) {
  const entries = [];
  const models = index.filesUnder(dir).filter((p) => /\.model(\.common(\.txt)?)?$/i.test(p));
  for (const file of models) {
    const link = COMMON_LINK.test(file);
    const path = link ? commonTarget(file, dir) : file;
    if (!path) continue;
    const name = fileOf(link ? file.replace(COMMON_LINK, '') : file).toLowerCase();
    if (name === 'hair_high_win32.model') continue;
    const core = name === 'face_high_win32.model' ? 'face_neck'
      : /^oral_.*_win32\.model$/.test(name) ? name.replace(/^oral_/, '').replace(/_win32\.model$/, '') : name.replace(/\.model$/, '');
    const simple = core.replace(/_/g, '');
    const type = FACE_MODEL_TYPES.find((t) => simple.startsWith(t.replace(/_/g, '').toLowerCase()))
      || (core.includes('model_type_') ? core.split('model_type_')[1] : 'parts');
    // .mtl files of a folder, links followed: [{ path, stem }].
    const mtlsIn = (folder) => index.filesIn(folder).filter((p) => /\.mtl(\.common(\.txt)?)?$/i.test(p))
      .map((p) => ({ path: COMMON_LINK.test(p) ? commonTarget(p, dir) : p, stem: fileOf(p).replace(COMMON_LINK, '').toLowerCase().replace(/\.mtl$/, '') }))
      .filter((m) => m.path);
    const matching = (folder) => mtlsIn(folder).find((m) => core.startsWith(m.stem) || core.endsWith(m.stem))?.path || null;
    const mtlIn = (folder) => {
      const mtls = mtlsIn(folder);
      return matching(folder) || mtls.find((m) => m.stem === 'materials')?.path || mtls[0]?.path || null;
    };
    const mtl = link
      ? matching(dirOf(file)) || mtlIn(dirOf(path)) || mtlIn(dirOf(file)) || mtlIn(dir)
      : mtlIn(dirOf(path)) || mtlIn(dir);
    const kit = kitOfName(fileOf(path));
    entries.push({ path, mtl: forKit(mtl, kit), type, kit });
  }
  return entries;
}

/**
 * Listed .model files outside the folder whose list has them (Common models, through a .common link or a
 * face.xml path into the game's common folder), so they count as that folder's.
 */
export function modelsListedFor(dir) {
  const key = dir.toLowerCase();
  return [...listedModels.values()].filter((e) => e.owner?.toLowerCase() === key && !e.path.toLowerCase().startsWith(`${key}/`)).map((e) => e.path);
}

/** The kit a listed kit-numbered .model is for ("p1"…), or null for a model shown with any kit. */
export const kitOfModel = (path) => listedModels.get(normPath(path).toLowerCase())?.kit ?? null;

/**
 * Read every open .xml for the .model files it lists (call after rebuildIndex). Returns problems found.
 *
 * A face folder without a face.xml gets the one the 4cc AET compiler would write for it (compilerFaceList), as
 * exports leave it to the compiler, and so does a gloves folder without a glove.xml (glove_l / glove_r.model,
 * with glove_l / glove_r.mtl, else materials.mtl). A boots folder has no .xml: the game loads its boots.model,
 * with boots.mtl. Hair is the other exception: a face folder's hair_*.model files are always loaded, unless
 * the folder has a hair.xml, which then decides like any other .xml. They use the folder's hair.mtl, else its
 * face.mtl. Entries for the viewer's own default .model files come in `defaults`.
 */
export async function readModelLists(defaults = []) {
  const lists = new Map(), problems = [];
  for (const xml of allPaths().filter((p) => /\.xml$/i.test(p))) {
    let entries;
    try { entries = parseModelXml(await readGameText(xml)); }
    catch (e) { if (!isGone(e)) problems.push(`Couldn't read ${fileOf(xml)}: ${e.message}`); continue; }
    const dir = dirOf(xml);
    for (const entry of entries) {
      // A path into the game's uniform common folder is the export's Common file; a kit-numbered p0 one stands
      // for each kit's file.
      const path = commonPathFrom(dir, entry.model) || modelPathFrom(dir, entry.model);
      const mtl = entry.mtl ? commonPathFrom(dir, entry.mtl) || openPathFrom(dir, entry.mtl) : null;
      const files = index.has(path) ? [{ path, kit: null }] : kitFilesOf(path);
      for (const file of files) {
        if (lists.has(file.path.toLowerCase())) continue;
        lists.set(file.path.toLowerCase(), { path: file.path, mtl: forKit(mtl, file.kit), type: entry.type, xml, kit: file.kit, owner: dir });
      }
    }
  }
  for (const dir of faceFolders()) {
    const inDir = (name) => index.real(`${dir ? `${dir}/` : ''}${name}`);
    if (!inDir('face.xml')) {
      for (const entry of compilerFaceList(dir)) {
        if (!lists.has(entry.path.toLowerCase())) lists.set(entry.path.toLowerCase(), { ...entry, xml: null, owner: dir });
      }
    }
    if (inDir('hair.xml')) continue;
    const mtl = inDir('hair.mtl') || inDir('face.mtl');
    for (const path of index.filesIn(dir).filter((p) => /^hair_.*\.model$/i.test(fileOf(p)))) {
      if (!lists.has(path.toLowerCase())) lists.set(path.toLowerCase(), { path, mtl, type: 'hair', xml: null });
    }
  }
  const add = (entry) => { if (!lists.has(entry.path.toLowerCase())) lists.set(entry.path.toLowerCase(), { ...entry, xml: null }); };
  defaults.forEach(add);
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
