// geometry.js — three.js geometry for FMDL meshes, and PES weight scaling.

import * as THREE from 'three';
import { options } from '../core/options.js';

/**
 * Vertex positions to draw. PES scales each skinned vertex by its total bone weight, measured from the
 * model's origin: weights totalling 0.5 put it halfway to (0, 0, 0), 2 puts it twice as far, 0 puts it at
 * the origin. (At rest every bone's skinning matrix is the identity, so the result is sum(w) × position.)
 * Meshes without bone weights in their vertex format are left as they are.
 */
export function displayPositions(v) {
  if (!v.weightSum || !options.weightScaling) return v.position;
  if (!v.scaledPosition) {
    const p = new Float32Array(v.position.length);
    for (let i = 0; i < v.count; i++) {
      const s = v.weightSum[i];
      p[i * 3] = v.position[i * 3] * s;
      p[i * 3 + 1] = v.position[i * 3 + 1] * s;
      p[i * 3 + 2] = v.position[i * 3 + 2] * s;
    }
    v.scaledPosition = p;
  }
  return v.scaledPosition;
}

/** Number of vertices whose weights don't total exactly 1 (255 in the file's 8-bit weights). */
export function offWeightCount(v) {
  if (!v.weightSum) return 0;
  if (v.offWeight == null) {
    let n = 0;
    for (let i = 0; i < v.count; i++) if (Math.round(v.weightSum[i] * 255) !== 255) n++;
    v.offWeight = n;
  }
  return v.offWeight;
}

/** Swap every mesh's positions after weight scaling is turned on or off. */
export function applyWeightScaling(meshObjects) {
  for (const m of meshObjects) {
    const attribute = m.obj.geometry.getAttribute('position'), positions = displayPositions(m.mesh.vertices);
    if (attribute.array === positions) continue;
    m.obj.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    m.obj.geometry.computeBoundingSphere();
    m.obj.geometry.computeBoundingBox();
  }
}

export function buildGeometry(mesh) {
  const v = mesh.vertices, geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(displayPositions(v), 3));
  if (v.uv[0]) geometry.setAttribute('uv', new THREE.BufferAttribute(v.uv[0], 2));
  if (v.uv[1]) geometry.setAttribute('uv1', new THREE.BufferAttribute(v.uv[1], 2));
  // The timing UV map for UV step timing textures (the second UV map), under its own name.
  geometry.setAttribute('timingUv', new THREE.BufferAttribute(v.uv[1] || new Float32Array(v.count * 2), 2));

  // FMDL stores triangles clockwise; three.js treats counter-clockwise as front-facing.
  // Reverse each triangle, as the Blender importer does (IO.py: reversed(face.vertices)).
  const indices = new Uint16Array(mesh.faces.length);
  for (let i = 0; i < indices.length; i += 3) {
    indices[i] = mesh.faces[i + 2];
    indices[i + 1] = mesh.faces[i + 1];
    indices[i + 2] = mesh.faces[i];
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const hasNormals = v.normal && v.normal.subarray(0, 30).some((x) => x !== 0);
  if (hasNormals) geometry.setAttribute('normal', new THREE.BufferAttribute(v.normal, 3));
  else geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
