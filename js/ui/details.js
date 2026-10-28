// details.js — the right-hand panel: counts, kits, skin colour, the "This player" settings, the model
// tree and the materials list.

import { $, el, checkbox, buttonRow } from '../core/dom.js';
import { state } from '../core/state.js';
import { fileOf, kitLabel } from '../formats/aet.js';
import {
  viewedPlayer, defaultParts, defaultsOn, hasOwnBoots, settingsOf, setSetting, usesSkin, defaultHandsLabel,
} from '../export/players.js';
import { kitsAvailable, texturePath, skinFor, customSkinAvailable, CUSTOM_SKIN } from '../export/texture-lookup.js';
import { classify, isUsedRole } from '../scene/materials.js';
import { textureState } from '../scene/textures.js';
import { offWeightCount } from '../scene/geometry.js';
import { strayCount } from '../scene/framing.js';
import { applyVisibility, selectKit, selectSkin } from '../viewer.js';
import { reloadForDefaults } from './team.js';
import { inGameLook, hiddenInWords } from '../export/in-game.js';

/** Vertex, triangle and mesh counts for what's shown, and the stray-mesh count. */
export function renderStats() {
  let vertices = 0, triangles = 0, shown = 0;
  for (const m of state.meshObjects) {
    if (!m.shown) continue;
    vertices += m.mesh.vertices.count;
    triangles += m.mesh.faces.length / 3;
    shown++;
  }
  $('sVerts').textContent = vertices.toLocaleString();
  $('sTris').textContent = triangles.toLocaleString();
  $('sMeshes').textContent = `${shown}/${state.meshObjects.length}`;
  $('strayCount').textContent = state.meshObjects.length ? `(${strayCount()})` : '';
}

export function renderKits() {
  const kits = kitsAvailable();
  $('kitSection').hidden = kits.length === 0;
  buttonRow($('kits'), kits.map((kit) => ({ label: kitLabel(kit), on: kit === state.currentKit, onClick: () => selectKit(kit) })));
}

/** Skin colours 1–6 (plus 7 for custom skin textures), shown when a loaded mesh uses a skin texture. */
export function renderSkins() {
  const used = state.meshObjects.some((m) => m.mesh.materialInstance.textures.some(([, ref]) => usesSkin(ref)));
  $('skinSection').hidden = !used;
  if (!used) { $('skins').textContent = ''; return; }
  const current = skinFor(viewedPlayer());
  const numbers = [1, 2, 3, 4, 5, 6];
  if (customSkinAvailable()) numbers.push(CUSTOM_SKIN);
  const title = (n) => (n === CUSTOM_SKIN ? 'custom skin textures' : `skin_color_${n}`);
  buttonRow($('skins'), numbers.map((n) => ({ label: String(n), title: title(n), on: n === current, onClick: () => selectSkin(n) })));
}

/** "This player": default models for the viewed player, overriding the global setting (or the save's, when linked). */
export function renderPlayerPanel() {
  const player = viewedPlayer(), parts = defaultParts(player);
  // Any player with models can get defaults; portrait-only players have nothing for them to complete.
  $('playerSection').hidden = !player || !parts.boots;
  if ($('playerSection').hidden) return;
  $('tPlayerDefaults').checked = defaultsOn(player);
  const note = $('playerDefaultsNote'), look = inGameLook(player);
  $('tPlayerDefaults').disabled = !!look;
  note.textContent = '';
  if (look) {
    // Linked to the save: the game's rules, from the player's appearance settings and the kit's config.
    const hidden = hiddenInWords(look);
    note.append(`As in the game, from their settings in ${state.save.name} and the kit's config: `
      + `${hidden ? `the default body without its ${hidden}` : 'all of the default body and hands'}.`);
    return;
  }
  const hands = defaultHandsLabel(parts);
  const what = hands === 'hands' ? 'the default body and hands'
    : hands ? `the default body and ${hands} (they have their own other hand)`
      : 'the default body (they have their own gloves or no face, so no default hands)';
  if (settingsOf(player).useDefaults == null) {
    note.append(hasOwnBoots(player) ? `Off: they have their own boots or body model. Turn on to add ${what}.` : `Following the global setting. Shows ${what}.`);
    return;
  }
  const reset = el('button', { type: 'button', class: 'linkish' }, 'Use global setting');
  reset.addEventListener('click', async () => {
    setSetting(player, 'useDefaults', undefined);
    await reloadForDefaults();
  });
  note.append(`Set for this player. Shows ${what}. `, reset);
}

// Lists collapsed in the model tree, by key ("models", or a model's path and a group index), so they stay
// collapsed when the tree is redrawn.
const collapsed = new Set();
const PLURALS = { model: 'models', mesh: 'meshes' };

/**
 * A collapsible part of the model tree: its contents with a rail beside them, the vertical line. Clicking
 * the rail collapses the contents to one "+ Show N meshes" line; clicking that opens them again.
 */
function collapsible(key, count, noun, ...contents) {
  const what = count === 1 ? noun : PLURALS[noun];
  const body = el('div', { class: 'branch-body' }, ...contents);
  const rail = el('button', { type: 'button', class: 'rail', title: `Hide these ${PLURALS[noun]}`, 'aria-label': `Hide ${count} ${what}` });
  const show = el('button', { type: 'button', class: 'show-more' }, el('span', { class: 'plus', 'aria-hidden': 'true' }, '+'), `Show ${count} ${what}`);
  const branch = el('div', { class: 'branch' }, rail, body, show);
  const set = (closed) => {
    body.hidden = rail.hidden = closed;
    show.hidden = !closed;
    if (closed) collapsed.add(key); else collapsed.delete(key);
  };
  rail.addEventListener('click', () => { set(true); show.focus(); });
  show.addEventListener('click', () => { set(false); rail.focus(); });
  set(collapsed.has(key));
  return branch;
}

/** Models, their mesh groups and meshes, with checkboxes to hide them. */
export function renderTree() {
  const tree = $('tree');
  tree.textContent = '';
  if (!state.models.length) { tree.append(el('p', { class: 'hint' }, 'No model loaded.')); return; }
  const top = el('ul');
  for (const model of state.models) {
    const meshesIn = (group) => state.meshObjects.filter((m) => m.model === model && m.mesh.group === group);
    const meshesUnder = (group) => meshesIn(group).length + group.children.reduce((n, g) => n + meshesUnder(g), 0);
    // Unticked groups and meshes are remembered in model.hidden, so they stay hidden next time. Linked to the
    // save, a group whose meshes the game hides is unticked too; ticking it shows them anyway (hidden.unhid).
    const { hidden } = model, groupIndex = (g) => model.parsed.meshGroups.indexOf(g);
    const allUnder = (group) => [...meshesIn(group), ...group.children.flatMap(allUnder)];
    const gameHidesAll = (group) => { const all = allUnder(group); return all.length > 0 && all.every((m) => m.gameHides); };
    const groupItem = (group) => {
      const item = el('li');
      const { label } = checkbox(group.name || '(unnamed)', !hidden.groups.has(groupIndex(group)) && !gameHidesAll(group), (on) => {
        item.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = on));
        const setGroup = (g) => {
          if (on) hidden.groups.delete(groupIndex(g)); else hidden.groups.add(groupIndex(g));
          for (const m of meshesIn(g)) {
            m.groupVisible = on;
            if (on) hidden.meshes.delete(m.mesh.index); else hidden.meshes.add(m.mesh.index);
            if (on && m.hiddenInGame) hidden.unhid.add(m.mesh.index); else hidden.unhid.delete(m.mesh.index);
          }
          g.children.forEach(setGroup);
        };
        setGroup(group);
        applyVisibility();
      });
      item.append(label);
      const own = meshesIn(group);
      if (own.length || group.children.length) {
        item.append(collapsible(`${model.path}|${groupIndex(group)}`, meshesUnder(group), 'mesh',
          own.length ? el('div', { class: 'mesh' }, ...own.map(meshLine)) : null,
          group.children.length ? el('ul', {}, ...group.children.map(groupItem)) : null));
      }
      return item;
    };
    const item = el('li');
    const { label } = checkbox(model.kit ? `${model.label} (${kitLabel(model.kit)} only)` : model.label, model.visible, (on) => { model.visible = on; model.hidden.model = !on; applyVisibility(); });
    label.title = model.path;
    item.append(label);
    const roots = model.parsed.meshGroups.filter((g) => !g.parent);
    const meshCount = state.meshObjects.filter((m) => m.model === model).length;
    if (roots.length) item.append(collapsible(model.path, meshCount, 'mesh', el('ul', {}, ...roots.map(groupItem))));
    top.append(item);
  }
  tree.append(collapsible('models', state.models.length, 'model', top));
}

/** One mesh in the tree; its material name links to the material in the Materials list. */
function meshLine(m) {
  const offWeight = offWeightCount(m.mesh.vertices);
  const flags = (m.obj.userData.antiblur ? ' · anti-blur' : m.obj.userData.invisible ? ' · invisible' : '') + (m.hiddenInGame ? ' · hidden in game' : '');
  const mi = m.mesh.materialInstance;
  const link = el('button', { type: 'button', class: 'mat-link', title: 'Show this material' }, mi.name);
  link.addEventListener('click', () => showMaterial(mi));
  return el('div', {}, `#${m.mesh.index} · ${m.mesh.vertices.count} v · `, link,
    `${flags}${offWeight ? ` · ${offWeight} v not weighted to 1` : ''}`);
}

// ---------------------------------------------------------------- materials

const materialEntries = new Map(); // material instance -> its entry in the Materials list
let pickedMaterial = null;          // the material last picked from the tree, highlighted

/** Scroll the details pane to a material's entry and highlight it. */
function showMaterial(mi) {
  pickedMaterial = mi;
  markPickedMaterial();
  materialEntries.get(mi)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function markPickedMaterial() {
  for (const [mi, entry] of materialEntries) entry.classList.toggle('picked', mi === pickedMaterial);
}

/** A found texture's path relative to the export root (or just its name for loose files). */
function shortPath(path) {
  const root = state.aet?.root;
  if (state.aet) {
    const prefix = root ? `${root}/`.toLowerCase() : '';
    if (path.toLowerCase().startsWith(prefix)) return path.slice(prefix.length);
  }
  return fileOf(path);
}

/** Each material the loaded meshes use, its shader, and where each texture was found. */
export function renderMaterials() {
  const box = $('mats');
  box.textContent = '';
  materialEntries.clear();
  for (const model of state.models) {
    if (state.models.length > 1) box.append(el('div', { class: 'model-h' }, model.label));
    const used = new Set(model.parsed.meshes.map((m) => m.materialInstance));
    for (const mi of model.parsed.materialInstances) {
      if (!used.has(mi)) continue;
      const entry = el('div', { class: 'mat' }, el('div', {}, mi.name), el('code', {}, `${mi.technique} · ${classify(mi).label}`));
      for (const [role, ref] of mi.textures) entry.append(textureLine(model, role, ref));
      materialEntries.set(mi, entry);
      box.append(entry);
    }
  }
  markPickedMaterial(); // the picked material stays highlighted as the list is redrawn (kit changes…)
}

function textureLine(model, role, ref) {
  const path = texturePath(model, ref);
  const decoded = path && textureState(path);
  const found = !!path && !decoded?.error;
  const drawn = isUsedRole(role);
  const title = [
    `${ref.directory}${ref.filename}`,
    path ? `found: ${path}` : 'not found',
    decoded?.error ? `couldn't decode: ${decoded.error}` : null,
    drawn ? null : '(not drawn by the viewer)',
  ].filter(Boolean).join('\n');
  return el('div', { class: `tex ${found ? 'ok' : 'missing'} ${drawn ? 'used' : ''}`, title },
    el('span', { class: 'dot' }), `${role}: ${ref.filename}${path ? ` → ${shortPath(path)}` : ''}`);
}
