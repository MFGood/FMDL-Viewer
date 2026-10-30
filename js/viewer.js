// viewer.js — what's on screen: loading models into the scene, rebuilding their materials when
// textures, kits or options change, and which meshes are shown.

import * as THREE from 'three';
import { readFile, readGameText, isGone, listedModels, kitOfModel } from './core/files.js';
import { setStatus, showError, hideError } from './core/notices.js';
import { options } from './core/options.js';
import { state } from './core/state.js';
import { $ } from './core/dom.js';
import { parseFmdl } from './formats/fmdl.js';
import { parseModel } from './formats/model.js';
import { parseMtl, attachMaterials } from './formats/mtl.js';
import { dirOf, fileOf } from './formats/aet.js';
import { isDefaultModel, viewedPlayer, setSetting, hiddenParts, hairFor, lookOf, DEFAULTS } from './export/players.js';
import { hairStyleOf, dressEditHair } from './export/edit-hair.js';
import { faceLayers, dressFaceLayers } from './export/face-layers.js';
import { pickCurrentKit, kitsAvailable, skinFor } from './export/texture-lookup.js';
import { savePlayerOf, skinToSave } from './export/save-team.js';
import { inGameLook, hiddenInGame } from './export/in-game.js';
import { keepSaveEdits } from './core/save.js';
import { scene, boxLayer, boneLayer } from './scene/stage.js';
import { buildGeometry, applyWeightScaling, displayPositions } from './scene/geometry.js';
import { makeMaterial, clearAnimated, texturesNeeded } from './scene/materials.js';
import { loadTexture, isDecoded } from './scene/textures.js';
import { buildBoxes, buildBones } from './scene/overlays.js';
import { frameModel, restoreCameraView } from './scene/framing.js';
import { startRun, stopRun, rigged, wantRig, poseRun, applySkinWeights } from './animation/rig.js';
import { renderTree, renderMaterials, renderKits, renderSkins, renderPlayerPanel, renderStats } from './ui/details.js';
import { renderBodyPanel } from './ui/body-shape.js';
import { renderFacePanel, shownFace } from './ui/face-editor.js';
import { facePartOf, loadFaceData, isFaceHi, shapeFaceHi, shapeFacePart } from './animation/face-shape.js';
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

/**
 * Read and parse a Pre-Fox .model, with the materials from the .mtl its .xml assigns. Problems that still
 * leave something to show are added to `problems`.
 */
async function readPreFoxModel(path, problems) {
  const parsed = await parseModel(await readFile(path));
  const listing = listedModels.get(path.toLowerCase());
  let mtl = null;
  if (!listing?.mtl) {
    problems.push(listing && !listing.xml
      ? `${fileOf(path)}: no hair.mtl or face.mtl next to it, so it has no materials`
      : `${fileOf(path)}: its .xml assigns no .mtl, so it has no materials`);
  }
  else {
    try { mtl = parseMtl(await readGameText(listing.mtl)); }
    catch (e) { problems.push(`${fileOf(path)}: couldn't read ${fileOf(listing.mtl)}${isGone(e) || /is not open/.test(e.message) ? ' (not found)' : `: ${e.message}`}`); }
  }
  const uniform = listing?.type?.toLowerCase() === 'uniform';
  const missing = attachMaterials(parsed, mtl, dirOf(listing?.mtl || path), { uniform });
  if (mtl && missing.length) problems.push(`${fileOf(path)}: ${missing.join(', ')} not in ${fileOf(listing.mtl)}`);
  if (parsed.warnings.length) problems.push(`${fileOf(path)} uses ${parsed.warnings.join(', ')}`);
  return parsed;
}

/**
 * Read and parse .fmdl and .model files: { loaded: [{ path, parsed }], problems }. Files deleted from disk since
 * they were opened are forgotten.
 */
export async function readModels(paths) {
  const loaded = [], problems = [], gone = [];
  for (const path of paths) {
    try { loaded.push({ path, parsed: /\.model$/i.test(path) ? await readPreFoxModel(path, problems) : parseFmdl(await readFile(path)) }); }
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
  // Put back what was unticked in the model tree last time this model was shown for this player.
  const hidden = hiddenParts(player, path);
  const model = {
    label: isDefaultModel(path) ? `${fileOf(path)} (default)` : fileOf(path),
    path, ownDir: dirOf(path), player, parsed, group: new THREE.Group(), visible: !hidden.model, hidden,
    kit: kitOfModel(path), // a kit-numbered model is only shown with its kit
    facePart: isDefaultModel(path) ? facePartOf(path) : null, // the editable face and its parts follow the face settings
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
    state.meshObjects.push({ mesh, obj, model, groupVisible: !hidden.meshes.has(mesh.index), shown: true, skinned: null });
  }
  scene.add(model.group);
  state.models.push(model);
}

/** Replace what's shown with these .fmdl / .model files (paths in the virtual file system), with notes to show. */
export async function loadModels(paths, label, player = null, notes = []) {
  const { loaded, problems } = await readModels(paths);
  problems.unshift(...notes);
  clearModels();
  for (const item of loaded) {
    if (!isDefaultModel(item.path)) continue;
    if (facePartOf(item.path)) await shapeFace(item.parsed, facePartOf(item.path), player);
    const hair = hairStyleOf(item.path) && hairFor(player);
    if (hair) dressEditHair(item.parsed, hair, DEFAULTS);
  }
  for (const item of loaded) addModel(item, player);
  $('fileName').textContent = label;
  if (wantRig()) await startRun();
  buildBoxes();
  buildBones();
  applyVisibility();
  renderTree();
  renderMaterials();
  if (state.pendingRestore?.camera) restoreCameraView(state.pendingRestore.camera);
  else frameModel();
  renderPlayerPanel();
  renderBodyPanel();
  renderFacePanel();
  if (problems.length) showError(problems.join(' · '));
  else hideError();
  await refreshMaterials();
}

/**
 * Shape a parsed part of the editable face ("face", "eye"…) by a player's face settings (as modeled when their
 * face isn't edited). The neck and back of the head don't move.
 */
async function shapeFace(parsed, part, player) {
  try { await loadFaceData(); }
  catch (e) { showError(`Couldn't load the face sliders: ${e.message}`); return false; }
  if (part === 'face') {
    if (!isFaceHi(parsed)) return false;
    shapeFaceHi(parsed, shownFace(player));
  } else if (part === 'eye' || part === 'mouth') shapeFacePart(parsed, part, shownFace(player));
  else return false;
  return true;
}

/** Reshape the shown editable face and its parts after the player's face settings change, and redraw them. */
export async function applyFaceShape() {
  const shaped = new Set();
  for (const model of state.models) if (model.facePart && await shapeFace(model.parsed, model.facePart, model.player)) shaped.add(model);
  for (const m of state.meshObjects) {
    if (!shaped.has(m.model)) continue;
    const geometry = m.obj.geometry, positions = displayPositions(m.mesh.vertices);
    if (geometry.getAttribute('position').array !== positions) geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    else geometry.getAttribute('position').needsUpdate = true;
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    if (m.skinned) m.skinned.geometry.getAttribute('position').needsUpdate = true;
  }
  renderStats();
}

// ---------------------------------------------------------------- materials

// A newer refresh supersedes an older one still waiting for textures.
let refreshCount = 0;

/** Paint the editable face's skin layers (eyebrows, beard…) for its player's settings and skin color. */
function dressFace() {
  for (const model of state.models) {
    if (model.facePart === 'face') dressFaceLayers(model.parsed, faceLayers(lookOf(model.player), skinFor(model.player)), DEFAULTS);
  }
}

/** Rebuild every material once the textures it needs are decoded. */
export async function refreshMaterials() {
  const refresh = ++refreshCount;
  pickCurrentKit();
  dressFace();
  applyVisibility(); // linked to the save, the kit's config and the skin color decide what of the default body shows
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

/** Skin color for the viewed player (or for loose models). */
export function selectSkin(n) {
  const player = viewedPlayer(), own = savePlayerOf(player);
  if (own) {
    skinToSave(own, n);
    keepSaveEdits();
  } else if (player) setSetting(player, 'skin', n);
  else state.looseSkin = n;
  refreshMaterials();
}

// ---------------------------------------------------------------- what's shown

let hiddenInGameBefore = '';

/**
 * Show or hide meshes per the model tree, the options and (linked to the save) the game, then update the counts.
 * The tree is redrawn when what the game hides changes, as its boxes show that.
 */
export function applyVisibility() {
  const animating = rigged(), looks = new Map();
  const lookOf = (model) => {
    if (!isDefaultModel(model.path)) return null;
    if (!looks.has(model.player)) looks.set(model.player, inGameLook(model.player));
    return looks.get(model.player);
  };
  for (const m of state.meshObjects) {
    m.hiddenInGame = hiddenInGame(m.mesh, lookOf(m.model));
    m.gameHides = m.hiddenInGame && !m.model.hidden.unhid.has(m.mesh.index);
    m.shown = m.model.visible && m.groupVisible && !m.gameHides && (!m.model.kit || m.model.kit === state.currentKit)
      && (options.hiddenMeshes || !m.obj.userData.hiddenByFile);
    m.obj.visible = m.shown && !(animating && m.skinned);
    if (m.skinned) m.skinned.visible = m.shown && animating;
  }
  const hiddenNow = state.meshObjects.map((m) => (m.hiddenInGame ? 1 : 0)).join('');
  if (hiddenNow !== hiddenInGameBefore) { hiddenInGameBefore = hiddenNow; renderTree(); }
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

/** Build or drop the rig as the run animation and body shape need it. */
export async function applyRunOption() {
  if (wantRig()) await startRun();
  else { stopRun(); buildBones(); }
  applyVisibility();
}

/** Show a changed body shape: on the rig if there is one, building or dropping the rig as needed. */
export async function applyBodyShapeOption() {
  if (rigged() && wantRig()) poseRun(0);
  else await applyRunOption();
}

/** Redraw what uses theme colors. */
export function applyTheme() {
  if (!state.models.length) return;
  buildBoxes();
  buildBones();
}
