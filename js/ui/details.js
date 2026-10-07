// details.js — the right-hand panel: counts, kits, skin colour, the "This player" settings, the model
// tree and the materials list.

import { $, el, checkbox, buttonRow } from '../core/dom.js';
import { state } from '../core/state.js';
import { fileOf, kitLabel } from '../formats/aet.js';
import { viewedPlayer, defaultParts, defaultsOn, settingsOf, setSetting, usesSkin, skinFor } from '../export/players.js';
import { kitsAvailable, texturePath } from '../export/texture-lookup.js';
import { classify, isUsedRole } from '../scene/materials.js';
import { textureState } from '../scene/textures.js';
import { offWeightCount } from '../scene/geometry.js';
import { strayCount } from '../scene/framing.js';
import { applyVisibility, selectKit, selectSkin } from '../viewer.js';
import { reloadForDefaults } from './team.js';

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

/** Skin colours 1–6, shown when a loaded mesh uses a skin texture. */
export function renderSkins() {
  const used = state.meshObjects.some((m) => m.mesh.materialInstance.textures.some(([, ref]) => usesSkin(ref)));
  $('skinSection').hidden = !used;
  if (!used) { $('skins').textContent = ''; return; }
  const current = skinFor(viewedPlayer());
  const numbers = [1, 2, 3, 4, 5, 6];
  buttonRow($('skins'), numbers.map((n) => ({ label: String(n), title: `skin_color_${n}`, on: n === current, onClick: () => selectSkin(n) })));
}

/** "This player": default models for the viewed player, overriding the global setting. */
export function renderPlayerPanel() {
  const player = viewedPlayer(), parts = defaultParts(player);
  // Only players with models but no boots of their own can get defaults.
  $('playerSection').hidden = !player || !parts.boots;
  if ($('playerSection').hidden) return;
  $('tPlayerDefaults').checked = defaultsOn(player);
  const note = $('playerDefaultsNote');
  note.textContent = '';
  const what = parts.hands ? 'the default body and hands' : 'the default body (they have their own gloves or no face, so no default hands)';
  if (settingsOf(player).useDefaults == null) {
    note.append(`Following the global setting. Shows ${what}.`);
    return;
  }
  const reset = el('button', { type: 'button', class: 'linkish' }, 'Use global setting');
  reset.addEventListener('click', async () => {
    setSetting(player, 'useDefaults', undefined);
    await reloadForDefaults();
  });
  note.append(`Set for this player. Shows ${what}. `, reset);
}

/** Models, their mesh groups and meshes, with checkboxes to hide them. */
export function renderTree() {
  const tree = $('tree');
  tree.textContent = '';
  if (!state.models.length) { tree.append(el('p', { class: 'hint' }, 'No model loaded.')); return; }
  const top = el('ul');
  for (const model of state.models) {
    const meshesIn = (group) => state.meshObjects.filter((m) => m.model === model && m.mesh.group === group);
    const groupItem = (group) => {
      const item = el('li');
      const { label } = checkbox(group.name || '(unnamed)', true, (on) => {
        item.querySelectorAll('input[type=checkbox]').forEach((c) => (c.checked = on));
        const setGroup = (g) => { meshesIn(g).forEach((m) => (m.groupVisible = on)); g.children.forEach(setGroup); };
        setGroup(group);
        applyVisibility();
      });
      item.append(label);
      const own = meshesIn(group);
      if (own.length) item.append(el('div', { class: 'mesh' }, own.map(meshLine).join('\n')));
      if (group.children.length) item.append(el('ul', {}, ...group.children.map(groupItem)));
      return item;
    };
    const item = el('li');
    const { label } = checkbox(model.label, model.visible, (on) => { model.visible = on; applyVisibility(); });
    label.title = model.path;
    item.append(label);
    const roots = model.parsed.meshGroups.filter((g) => !g.parent);
    if (roots.length) item.append(el('ul', {}, ...roots.map(groupItem)));
    top.append(item);
  }
  tree.append(top);
}

function meshLine(m) {
  const offWeight = offWeightCount(m.mesh.vertices);
  const flags = m.obj.userData.antiblur ? ' · anti-blur' : m.obj.userData.invisible ? ' · invisible' : '';
  return `#${m.mesh.index} · ${m.mesh.vertices.count} v · ${m.mesh.materialInstance.name}${flags}${offWeight ? ` · ${offWeight} v not weighted to 1` : ''}`;
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
  for (const model of state.models) {
    if (state.models.length > 1) box.append(el('div', { class: 'model-h' }, model.label));
    const used = new Set(model.parsed.meshes.map((m) => m.materialInstance));
    for (const mi of model.parsed.materialInstances) {
      if (!used.has(mi)) continue;
      const entry = el('div', { class: 'mat' }, el('div', {}, mi.name), el('code', {}, `${mi.technique} · ${classify(mi).label}`));
      for (const [role, ref] of mi.textures) entry.append(textureLine(model, role, ref));
      box.append(entry);
    }
  }
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
