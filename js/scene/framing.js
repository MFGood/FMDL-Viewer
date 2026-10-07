// framing.js — pointing the camera at the model, and spotting stray meshes (pieces of geometry well away
// from the rest of the model, which framing can leave out).

import * as THREE from 'three';
import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { camera, controls } from './stage.js';

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

/** Point the camera at the shown meshes (leaving out stray pieces unless "Frame stray meshes" is on). */
export function frameModel() {
  const box = new THREE.Box3();
  if (!options.frameStray) box.copy(mainBody(shownMeshes()).box);
  else for (const m of shownMeshes()) { m.obj.geometry.computeBoundingBox(); box.union(m.obj.geometry.boundingBox); }
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, 1e-3);
  const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.05;
  camera.near = distance / 200;
  camera.far = Math.max(distance * 50, 60); // far enough for the whole grid
  camera.updateProjectionMatrix();
  camera.position.copy(center).add(new THREE.Vector3(0.55, 0.35, 1).normalize().multiplyScalar(distance));
  controls.target.copy(center);
  controls.update();
}

/** The camera, to put back after a reload. */
export const cameraView = () => ({ position: camera.position.clone(), target: controls.target.clone() });

export function restoreCameraView(view) {
  camera.position.copy(view.position);
  controls.target.copy(view.target);
  controls.update();
}
