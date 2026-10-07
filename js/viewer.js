// viewer.js — what's on screen: loading models into the scene, rebuilding their materials when
// textures, kits or options change, and which meshes are shown.

import * as THREE from 'three';
import { readFile, isGone } from './core/files.js';
import { setStatus, showError, hideError } from './core/notices.js';
import { options } from './core/options.js';
import { state } from './core/state.js';
import { $ } from './core/dom.js';
import { parseFmdl } from './formats/fmdl.js';
import { dirOf, fileOf } from './formats/aet.js';
import { isDefaultModel, viewedPlayer, setSetting } from './export/players.js';
import { pickCurrentKit, kitsAvailable } from './export/texture-lookup.js';
import { scene, boxLayer, boneLayer } from './scene/stage.js';
import { buildGeometry, applyWeightScaling } from './scene/geometry.js';
import { makeMaterial, clearAnimated, texturesNeeded } from './scene/materials.js';
import { loadTexture, isDecoded } from './scene/textures.js';
import { buildBoxes, buildBones } from './scene/overlays.js';
import { frameModel, restoreCameraView } from './scene/framing.js';
import { startRun, stopRun, running, applySkinWeights } from './animation/rig.js';
import { renderTree, renderMaterials, renderKits, renderSkins, renderPlayerPanel, renderStats } from './ui/details.js';
import { forgetFiles } from './open/opening.js';

// ---------------------------------------------------------------- loading models

export function clearModels() {
  stopRun();
  for (const m of state.meshObjects) { m.obj.geometry.dispose(); m.obj.material.dispose(); }
  for (const model of state.models) scene.remove(model.group);
  state.models.length = 0;
  state.meshObjects.length = 0;
  clearAnimated();
  boxLayer.clear();
  boneLayer.clear();
}

/** Show nothing (keeping the panels in step). */
export function showNoModels() {
  clearModels();
  renderTree(); renderMaterials(); renderKits(); applyVisibility();
}

/** Read and parse .fmdl files. Files deleted from disk since they were opened are forgotten. */
async function readModels(paths) {
  const loaded = [], problems = [], gone = [];
  for (const path of paths) {
    try { loaded.push({ path, parsed: parseFmdl(await readFile(path)) }); }
    catch (e) {
      if (isGone(e)) gone.push(path);
      else problems.push(`Couldn't read ${fileOf(path)}: ${e.message}`);
    }
  }
  if (gone.length) {
    await forgetFiles(gone);
    const one = gone.length === 1;
    problems.push(`${gone.map(fileOf).join(', ')} no longer exist${one ? 's' : ''} on disk, so ${one ? 'it was' : 'they were'} removed from the list`);
  }
  return { loaded, problems };
}

function addModel({ path, parsed }, player) {
  const model = {
    label: isDefaultModel(path) ? `${fileOf(path)} (default)` : fileOf(path),
    path, ownDir: dirOf(path), player, parsed, group: new THREE.Group(), visible: true,
  };
  for (const mesh of parsed.meshes) {
    const obj = new THREE.Mesh(buildGeometry(mesh), new THREE.MeshStandardMaterial({ color: 0xb9c4bd }));
    // Draw in file order, like the game, so a blended mesh layered over another comes after it rather than
    // being depth-sorted. Negative so the bone overlays (render order 0–3) still draw last.
    obj.renderOrder = mesh.index - parsed.meshes.length;
    obj.userData.antiblur = mesh.extensionHeaders.has('is-antiblur-meshes');
    // Shadow flag 0x2 = invisible (shadow-only) mesh; a hidden mesh group hides its meshes too.
    obj.userData.invisible = !!(mesh.shadowFlags & 0x2) || !!(mesh.group && !mesh.group.visible);
    obj.userData.hiddenByFile = obj.userData.antiblur || obj.userData.invisible;
    model.group.add(obj);
    state.meshObjects.push({ mesh, obj, model, groupVisible: true, shown: true, skinned: null });
  }
  scene.add(model.group);
  state.models.push(model);
}

/** Replace what's shown with these .fmdl files (paths in the virtual file system). */
export async function loadModels(paths, label, player = null) {
  const { loaded, problems } = await readModels(paths);
  clearModels();
  for (const item of loaded) addModel(item, player);
  $('fileName').textContent = label;
  if (options.run) await startRun();
  buildBoxes();
  buildBones();
  applyVisibility();
  renderTree();
  renderMaterials();
  if (state.pendingRestore?.camera) restoreCameraView(state.pendingRestore.camera);
  else frameModel();
  renderPlayerPanel();
  if (problems.length) showError(problems.join(' · '));
  else hideError();
  await refreshMaterials();
}

// ---------------------------------------------------------------- materials

// A newer refresh supersedes an older one still waiting for textures.
let refreshCount = 0;

/** Rebuild every material once the textures it needs are decoded. */
export async function refreshMaterials() {
  const refresh = ++refreshCount;
  pickCurrentKit();
  renderKits();
  renderSkins();
  const needed = [...texturesNeeded(state.meshObjects)];
  const pending = needed.filter((p) => !isDecoded(p)).length;
  if (pending) setStatus(`Loading ${pending} texture${pending > 1 ? 's' : ''}…`);
  await Promise.all(needed.map(loadTexture));
  if (refresh !== refreshCount) return;
  setStatus(null);
  clearAnimated();
  for (const m of state.meshObjects) {
    m.obj.material.dispose();
    m.obj.material = makeMaterial(m.mesh, m.model);
    if (m.skinned) m.skinned.material = m.obj.material;
  }
  renderMaterials();
}

export function selectKit(kit) {
  state.chosenKit = state.currentKit = kit;
  refreshMaterials();
}

/** Previous (-1) or next (+1) kit. */
export function stepKit(direction) {
  const kits = kitsAvailable();
  if (kits.length < 2) return;
  selectKit(kits[(kits.indexOf(state.currentKit) + direction + kits.length) % kits.length]);
}

/** Skin colour for the viewed player (or for loose models). */
export function selectSkin(n) {
  const player = viewedPlayer();
  if (player) setSetting(player, 'skin', n);
  else state.looseSkin = n;
  refreshMaterials();
}

// ---------------------------------------------------------------- what's shown

/** Show or hide meshes per the model tree and options, then update the counts. */
export function applyVisibility() {
  const animating = running();
  for (const m of state.meshObjects) {
    m.shown = m.model.visible && m.groupVisible && (options.hiddenMeshes || !m.obj.userData.hiddenByFile);
    m.obj.visible = m.shown && !(animating && m.skinned);
    if (m.skinned) m.skinned.visible = m.shown && animating;
  }
  renderStats();
}

export function applyWireframe() {
  for (const m of state.meshObjects) m.obj.material.wireframe = options.wireframe;
}

export function applyWeightOption() {
  applyWeightScaling(state.meshObjects);
  applySkinWeights();
  renderStats(); // scaled positions can move pieces apart or together
}

export async function applyRunOption() {
  if (options.run) await startRun();
  else { stopRun(); buildBones(); }
  applyVisibility();
}

/** Redraw what uses theme colours. */
export function applyTheme() {
  if (!state.models.length) return;
  buildBoxes();
  buildBones();
}
