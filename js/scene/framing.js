// framing.js — pointing the camera at the model, and spotting stray meshes (pieces of geometry well away
// from the rest of the model, which framing can leave out).

import * as THREE from 'three';
import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { stage } from './stage.js';
import { FOV, view, goal, animateTo, setView } from './navigation.js';

/**
 * Connected pieces of a mesh (triangles sharing vertices), each with its triangle count and bounds.
 * Cached per position array, so it's redone only when weight scaling swaps the positions.
 */
function meshPieces(mesh, positions) {
  const v = mesh.vertices;
  if (v.pieces && v.pieces.positions === positions) return v.pieces.list;
  const parent = new Int32Array(v.count).map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const faces = mesh.faces;
  for (let i = 0; i < faces.length; i += 3) {
    const a = find(faces[i]), b = find(faces[i + 1]), c = find(faces[i + 2]);
    parent[b] = a; parent[c] = a;
  }
  const byRoot = new Map();
  const point = new THREE.Vector3();
  for (let i = 0; i < faces.length; i += 3) {
    const root = find(faces[i]);
    let piece = byRoot.get(root);
    if (!piece) byRoot.set(root, (piece = { tris: 0, box: new THREE.Box3() }));
    piece.tris++;
    for (let k = 0; k < 3; k++) {
      const j = faces[i + k] * 3;
      piece.box.expandByPoint(point.set(positions[j], positions[j + 1], positions[j + 2]));
    }
  }
  const list = [...byRoot.values()];
  v.pieces = { positions, list };
  return list;
}

/**
 * The main body: start from the piece with the most triangles and keep adding any piece within ~1 m
 * (or half the body's size, if larger) of what's gathered so far. Everything left over is stray.
 */
function mainBody(meshObjects) {
  const pieces = [];
  for (const m of meshObjects) pieces.push(...meshPieces(m.mesh, m.obj.geometry.getAttribute('position').array));
  if (!pieces.length) return { box: new THREE.Box3(), stray: 0 };
  pieces.sort((a, b) => b.tris - a.tris);
  const box = pieces[0].box.clone(), used = new Set([pieces[0]]);
  for (let grew = true; grew;) {
    grew = false;
    const reach = Math.max(1, box.getSize(new THREE.Vector3()).length() / 2);
    const zone = box.clone().expandByScalar(reach);
    for (const p of pieces) if (!used.has(p) && zone.intersectsBox(p.box)) { box.union(p.box); used.add(p); grew = true; }
  }
  return { box, stray: pieces.length - used.size };
}

const shownMeshes = () => {
  const shown = state.meshObjects.filter((m) => m.shown);
  return shown.length ? shown : state.meshObjects;
};

/** Number of stray pieces among the meshes shown. */
export const strayCount = () => (state.meshObjects.length ? mainBody(shownMeshes()).stray : 0);

/** The box framing aims at: the shown meshes, leaving out stray pieces unless "Frame stray meshes" is on. */
function framedBox() {
  const box = new THREE.Box3();
  if (!options.frameStray) box.copy(mainBody(shownMeshes()).box);
  else for (const m of shownMeshes()) { m.obj.geometry.computeBoundingBox(); box.union(m.obj.geometry.boundingBox); }
  return box;
}

/** Distance from the box's centre that fits it in the viewport, at the normal field of view. */
function fitDistance(box) {
  const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 1e-3);
  const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const aspect = stage.clientWidth / Math.max(stage.clientHeight, 1);
  const halfAngle = Math.atan(halfTan * Math.min(1, aspect)); // the narrower way, vertical or horizontal
  // Orthographic shows what perspective shows at the target, so this fits it too.
  return (radius / Math.sin(halfAngle)) * 1.05;
}

/** Point the camera at the shown meshes from the default angle, at once. */
export function frameModel() {
  const box = framedBox();
  if (box.isEmpty()) return;
  const dir = new THREE.Vector3(0.55, 0.35, 1).normalize();
  setView({ target: box.getCenter(new THREE.Vector3()), distance: fitDistance(box), yaw: Math.atan2(dir.x, dir.z), pitch: -Math.asin(dir.y) });
}

/** Aim a view (as from goal()) at the shown meshes and back it off to fit them, keeping its angle. */
export function frameView(to) {
  const box = framedBox();
  if (box.isEmpty()) return to;
  to.target = box.getCenter(new THREE.Vector3());
  to.distance = fitDistance(box);
  return to;
}

/** Move smoothly to fit the shown meshes in view, keeping the camera's angle (pan and zoom only). */
export const frameKeepingAngle = () => animateTo(frameView(goal()));

/** The middle of the box framing aims at (leaving out stray meshes unless "Frame stray meshes" is on), or null. */
export function framedCenter() {
  const box = framedBox();
  return box.isEmpty() ? null : box.getCenter(new THREE.Vector3());
}

/** The camera, to put back after a reload. */
export const cameraView = () => goal();

export function restoreCameraView(saved) {
  setView(saved);
}
