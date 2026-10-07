// aet.js — aesthetics export (AET) structure, player discovery and texture path resolution.
// Pure logic: works on a list of file paths, no DOM or three.js. Paths use "/" and keep their case;
// all comparisons are case-insensitive.

export const normPath = (p) => p.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.?\//, '').replace(/\/$/, '');
export const dirOf = (p) => { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i); };
export const fileOf = (p) => p.slice(p.lastIndexOf('/') + 1);
export const stem = (p) => fileOf(normPath(p)).replace(/\.[^.]*$/, '').toLowerCase();
const join = (a, b) => (a ? `${a}/${b}` : b);
const TEXTURE_EXTS = ['dds', 'ftex', 'png', 'jpg', 'jpeg']; // .dds first; images are accepted too

/** Index of a set of file paths: folder listings and texture lookup by folder + stem. */
export class FileIndex {
  constructor(paths = []) { this.files = new Map(); this.dirs = new Map(); for (const p of paths) this.add(p); }
  add(path) {
    path = normPath(path);
    this.files.set(path.toLowerCase(), path);
    let d = dirOf(path), child = fileOf(path), isFile = true;
    for (;;) {
      const key = d.toLowerCase();
      if (!this.dirs.has(key)) this.dirs.set(key, { path: d, files: [], subdirs: new Map() });
      const entry = this.dirs.get(key);
      if (isFile) entry.files.push(path);
      else if (!entry.subdirs.has(child.toLowerCase())) entry.subdirs.set(child.toLowerCase(), join(d, child));
      if (d === '') break;
      child = fileOf(d); d = dirOf(d); isFile = false;
    }
    return path;
  }
  has(path) { return this.files.has(normPath(path).toLowerCase()); }
  real(path) { return this.files.get(normPath(path).toLowerCase()) || null; }
  dir(path) { return this.dirs.get(normPath(path).toLowerCase()) || null; }
  filesIn(dir) { return this.dir(dir)?.files || []; }
  subdirs(dir) { return [...(this.dir(dir)?.subdirs.values() || [])]; }
  subdir(dir, name) { return this.dir(dir)?.subdirs.get(name.toLowerCase()) || null; }
  filesUnder(dir) {
    const out = [], stack = [dir];
    while (stack.length) { const d = stack.pop(); out.push(...this.filesIn(d)); stack.push(...this.subdirs(d)); }
    return out;
  }
  /** A texture in `dir` whose name (without extension) is `name`; .dds preferred over .ftex. */
  texture(dir, name) {
    if (dir == null) return null;
    for (const ext of TEXTURE_EXTS) { const p = this.real(join(dir, `${name}.${ext}`)); if (p) return p; }
    return null;
  }
  textureStems(dir) {
    if (dir == null) return [];
    return this.filesIn(dir).filter((p) => /\.(dds|ftex|png|jpe?g)$/i.test(p)).map((p) => ({ path: p, stem: stem(p) }));
  }
}

/* ---------- export layout ---------- */

/** The folder that holds "Kit Textures" (shallowest wins); falls back to one holding other AET folders. */
export function findRoot(index) {
  const known = ['kit textures', 'faces', 'boots', 'gloves', 'logo', 'portraits', 'kit configs', 'common', 'collars'];
  let best = null, fallback = null;
  for (const entry of index.dirs.values()) {
    const depth = entry.path ? entry.path.split('/').length : 0;
    if (entry.subdirs.has('kit textures') && (!best || depth < best.depth)) best = { path: entry.path, depth };
    const hits = known.filter((k) => entry.subdirs.has(k)).length;
    if (hits >= 2 && (!fallback || hits > fallback.hits || (hits === fallback.hits && depth < fallback.depth))) fallback = { path: entry.path, depth, hits };
  }
  return best ? best.path : fallback ? fallback.path : null;
}

const cleanName = (s) => s.replace(/\s+/g, ' ').trim();

/** Roster slot (1–24) for a 4-digit boots/gloves ID, or null if it isn't in a player block. */
export function gearSlot(id) {
  if (!/^\d{4}$/.test(id)) return null;
  const d = (+id % 100) || 100;
  const slot = ((d - 1) % 25) + 1;
  return slot <= 24 ? slot : null;
}

/**
 * Read an export's structure. `readText(path)` returns a file's text (async).
 * Returns { root, teamName, notePath, logoPath, kitDir, commonDir, players, collars }.
 */
export async function scanExport(index, readText) {
  const root = findRoot(index);
  if (root === null) return null;
  const folder = (name) => index.subdir(root, name);
  const out = { root, teamName: null, notePath: null, logoPath: null, kitDir: folder('Kit Textures'), commonDir: folder('Common'), players: [], collars: [] };

  // Team note: a .txt at the top level, preferring one with "note" in its name. First "Team:" line.
  const txts = index.filesIn(root).filter((p) => /\.txt$/i.test(p)).sort((a, b) => /note/i.test(fileOf(b)) - /note/i.test(fileOf(a)));
  for (const p of txts) {
    const text = await readText(p);
    const m = /^\s*team\s*:\s*(.*?)\s*$/im.exec(text);
    if (m && m[1]) { out.teamName = m[1]; out.notePath = p; break; }
    if (!out.notePath) out.notePath = p;
  }

  // Logo: Logo/emblem_0XXX_r.png, else the smallest-looking emblem, else any png in Logo.
  const logoDir = folder('Logo');
  if (logoDir) {
    const pngs = index.filesIn(logoDir).filter((p) => /\.png$/i.test(p));
    out.logoPath = pngs.find((p) => /^emblem_0.{3}_r\.png$/i.test(fileOf(p))) || pngs.find((p) => /_r\.png$/i.test(p)) || pngs[0] || null;
  }

  // Portraits folder: player_XXXnn.dds -> team number nn.
  const portraitsByNumber = new Map();
  const portraitsDir = folder('Portraits');
  if (portraitsDir) for (const p of index.filesIn(portraitsDir)) {
    const m = /^player_(?:[xX]{3})?(\d{2})\.dds$/i.exec(fileOf(p));
    if (m) portraitsByNumber.set(+m[1], p);
  }

  const fmdlsUnder = (dir) => index.filesUnder(dir).filter((p) => /\.fmdl$/i.test(p)).sort();
  const players = [];

  // Faces: "XXXnn - Player Name".
  const facesDir = folder('Faces');
  if (facesDir) for (const dir of index.subdirs(facesDir)) {
    const m = /^(.{3})(\d{2})(?:\s*-\s*(.*))?$/.exec(fileOf(dir));
    const files = index.filesUnder(dir);
    players.push({
      number: m ? +m[2] : null,
      name: cleanName(m ? m[3] || '' : fileOf(dir)) || null,
      face: { dir, fmdls: fmdlsUnder(dir) },
      portrait: files.find((p) => /portrait\.dds$/i.test(p)) || null,
    });
  }
  for (const p of players) if (!p.portrait && p.number != null) p.portrait = portraitsByNumber.get(p.number) || null;

  // Boots "k#### - name" and Gloves "g#### - name", paired by their 4-digit ID.
  const gear = new Map();
  for (const [folderName, kind, letter] of [['Boots', 'boots', 'k'], ['Gloves', 'gloves', 'g']]) {
    const base = folder(folderName);
    if (!base) continue;
    for (const dir of index.subdirs(base)) {
      const m = new RegExp(`^${letter}(\\d{4})(?:\\s*-\\s*(.*))?`, 'i').exec(fileOf(dir));
      const id = m ? m[1] : fileOf(dir);
      if (!gear.has(id)) gear.set(id, { id, name: null, boots: null, gloves: null });
      const g = gear.get(id);
      g[kind] = { dir, fmdls: fmdlsUnder(dir) };
      const nm = cleanName(m ? m[2] || '' : '');
      if (nm && (!g.name || kind === 'boots')) g.name = nm;
    }
  }
  // Attach boots/gloves to roster slots. Gear IDs run in blocks starting at NN01, NN26, NN51 or NN76,
  // so the last two digits give the slot: 01/26/51/76 -> 1, 02/27/52/77 -> 2, ... A face folder
  // XXXnn is slot nn. Gear whose ID fits no slot is listed on its own.
  const sortedGear = [...gear.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const g of sortedGear) {
    const slot = gearSlot(g.id);
    let owner = slot != null && players.find((p) => p.number === slot);
    if (owner && owner.gearId) owner = null; // slot already has gear (a second ID block): keep this one separate
    if (!owner && slot != null && !players.some((p) => p.number === slot)) {
      owner = { number: slot, name: null, face: null, portrait: portraitsByNumber.get(slot) || null };
      players.push(owner);
    }
    if (owner) {
      Object.assign(owner, { gearId: g.id, boots: g.boots, gloves: g.gloves });
      // Name priority: Faces folder, then Boots, then Gloves (g.name already prefers the Boots name).
      if (!owner.name) owner.name = g.name;
    } else players.push({ number: null, name: g.name, gearId: g.id, boots: g.boots, gloves: g.gloves, face: null, portrait: null });
  }
  // Portraits with no face or gear folder.
  for (const [n, p] of portraitsByNumber) if (!players.some((pl) => pl.number === n)) players.push({ number: n, name: null, face: null, portrait: p });

  for (const p of players) {
    p.boots ||= null; p.gloves ||= null; p.gearId ||= null;
    p.fmdls = [...(p.face?.fmdls || []), ...(p.boots?.fmdls || []), ...(p.gloves?.fmdls || [])];
  }
  players.sort((a, b) => (a.number ?? 1e9) - (b.number ?? 1e9) || (a.gearId || '').localeCompare(b.gearId || '') || (a.name || '').localeCompare(b.name || ''));
  out.players = players;

  const collarsDir = folder('Collars');
  if (collarsDir) out.collars = index.filesIn(collarsDir).filter((p) => /\.fmdl$/i.test(p));
  return out;
}

/* ---------- kits ---------- */
// <prefix>u0XXX<p|g><N><suffix>: the three characters after "u0" (team ID or XXX) are ignored.
// p = outfield kit N, g = goalkeeper kit N. dummy_kit is the main kit texture (empty prefix/suffix).
const KIT_RE = /^(.*?)u0([0-9a-z]{3})([pg])(\d+)(.*)$/i;
export function parseKitName(name) {
  const s = stem(name);
  if (s === 'dummy_kit') return { prefix: '', suffix: '', type: 'p', num: null, id: null, dummy: true };
  const m = KIT_RE.exec(s);
  return m ? { prefix: m[1], suffix: m[5], type: m[3].toLowerCase(), num: +m[4], id: `${m[3].toLowerCase()}${+m[4]}` } : null;
}
const sameSlot = (a, b) => a.prefix === b.prefix && a.suffix === b.suffix;
export const kitLabel = (id) => (id[0] === 'g' ? `GK ${id.slice(1)}` : `Kit ${id.slice(1)}`);
export const kitSort = (a, b) => (a[0] === b[0] ? +a.slice(1) - +b.slice(1) : a[0] === 'p' ? -1 : 1);

/* ---------- texture paths ---------- */
// Where a material's texture directory points, per the AET conventions:
//   /Assets/pesNN/model/character/uniform/texture/       -> Kit Textures
//   /Assets/pesNN/model/character/common/000/sourceimages/ (or uniform/common) -> Common
//   /Assets/pesNN/model/character/boots/kNNNN/ (glove/gNNNN/) -> the player's Boots (Gloves) folder,
//                                                         which is the .fmdl's own folder for boots models
//   anything else (face folders, ./)                    -> the folder the .fmdl was loaded from
export function searchOrder(directory, ctx) {
  const d = normPath(directory || '').toLowerCase();
  let order;
  if (/model\/character\/uniform\/texture(\/|$)/.test(d)) order = [ctx.kitDir, ctx.ownDir, ctx.commonDir];
  else if (/model\/character\/(uniform\/)?common(\/|$)/.test(d)) order = [ctx.commonDir, ctx.ownDir, ctx.kitDir];
  else if (/model\/character\/boots\//.test(d)) order = [ctx.bootsDir ?? ctx.ownDir, ctx.ownDir, ctx.commonDir, ctx.kitDir];
  else if (/model\/character\/gloves?\//.test(d)) order = [ctx.glovesDir ?? ctx.ownDir, ctx.ownDir, ctx.commonDir, ctx.kitDir];
  else order = [ctx.ownDir, ctx.commonDir, ctx.kitDir];
  return [...new Set(order.filter((x) => x != null))];
}

/**
 * Resolve a material texture reference {directory, filename} to a file path, or null.
 * ctx = { ownDir, kitDir, commonDir }; kit = selected kit id ("p1", "g1") or null.
 */
export function resolveTexture(index, ref, ctx, kit) {
  const dirs = searchOrder(ref.directory, ctx);
  const k = parseKitName(ref.filename);
  if (k) {
    const slot = kitSlotTextures(index, k, ref, ctx);
    if (slot) {
      const pick = (kit && slot.find((t) => t.kit.id === kit)) || (k.id && slot.find((t) => t.kit.id === k.id))
        || slot.find((t) => t.kit.type === k.type) || slot[0];
      return pick.path;
    }
  }
  const name = stem(ref.filename);
  for (const dir of dirs) { const p = index.texture(dir, name); if (p) return p; }
  return null;
}

/**
 * The kit textures a kit-style reference can use: those for its slot (same prefix and suffix) in the
 * FIRST folder of its search order that has any. resolveTexture picks from this list and
 * availableKits lists it, so the kit buttons only offer kits that actually change the texture.
 */
function kitSlotTextures(index, k, ref, ctx) {
  const dirs = searchOrder(ref.directory, ctx);
  // dummy_kit means the selected kit's main texture, which lives in Kit Textures.
  const order = k.dummy ? [...new Set([ctx.kitDir, ...dirs].filter((x) => x != null))] : dirs;
  for (const dir of order) {
    const slot = index.textureStems(dir).map((t) => ({ ...t, kit: parseKitName(t.stem) })).filter((t) => t.kit && !t.kit.dummy && sameSlot(t.kit, k));
    if (slot.length) return slot;
  }
  return null;
}

/** Kit ids available for a set of texture references (each with its ctx). */
export function availableKits(index, refs) {
  const kits = new Set();
  for (const { ref, ctx } of refs) {
    const k = parseKitName(ref.filename);
    if (!k) continue;
    for (const t of kitSlotTextures(index, k, ref, ctx) || []) kits.add(t.kit.id);
  }
  return [...kits].sort(kitSort);
}
