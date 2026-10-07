// overlays.js — bounding boxes and the bone overlay.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { cssVar } from '../core/dom.js';
import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { stage, boxLayer, boneLayer, lineMaterials } from './stage.js';

// ---------------------------------------------------------------- bounding boxes

/** The mesh groups' bounding boxes as stored in the files. */
export function buildBoxes() {
  boxLayer.clear();
  for (const model of state.models) {
    const seen = new Set();
    for (const group of model.parsed.meshGroups) {
      const bb = group.boundingBox;
      if (!bb || seen.has(bb) || !group.meshes.length) continue;
      seen.add(bb);
      const box = new THREE.Box3(new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z), new THREE.Vector3(bb.max.x, bb.max.y, bb.max.z));
      if (!box.isEmpty()) boxLayer.add(new THREE.Box3Helper(box, new THREE.Color(cssVar('--warn'))));
    }
  }
  boxLayer.visible = options.boundingBoxes;
}

// ---------------------------------------------------------------- bones

const BONE_COLOR = 0x5ef08f; // bright green, the same in light and dark themes

// Round point sprite for bone nodes.
const nodeSprite = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
})();

// Bone names behind each node and line end, so the overlay can follow an animated rig.
let overlayNames = { nodes: [], lines: [] };

/**
 * Nodes at each bone and lines to its parent, drawn on top of everything: dark half-opacity outlines
 * first, bright lines and nodes over them. FMDL bone positions have loose semantics (see FmdlFile.py);
 * globalPosition is the closest to a world-space joint.
 */
export function buildBones() {
  for (const child of boneLayer.children) { child.geometry.dispose(); child.material.dispose(); }
  boneLayer.clear();
  lineMaterials.clear();
  const nodes = [], lines = [];
  overlayNames = { nodes: [], lines: [] };
  for (const model of state.models) for (const bone of model.parsed.bones) {
    const p = bone.globalPosition;
    nodes.push(p.x, p.y, p.z); overlayNames.nodes.push(bone.name);
    if (bone.parent) {
      const q = bone.parent.globalPosition;
      lines.push(p.x, p.y, p.z, q.x, q.y, q.z); overlayNames.lines.push(bone.name, bone.parent.name);
    }
  }
  boneLayer.visible = options.bones;
  if (!nodes.length) return;

  const layer = { depthTest: false, depthWrite: false, transparent: true };
  const addLines = (width, color, opacity, order) => {
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(lines);
    const material = new LineMaterial({ ...layer, color, linewidth: width, opacity, worldUnits: false });
    material.resolution.set(stage.clientWidth, stage.clientHeight);
    lineMaterials.add(material);
    const segments = new LineSegments2(geometry, material);
    segments.renderOrder = order;
    boneLayer.add(segments);
  };
  const addNodes = (size, color, opacity, order) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(nodes, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ ...layer, color, size, opacity, sizeAttenuation: false, map: nodeSprite, alphaTest: 0.25 }));
    points.renderOrder = order;
    boneLayer.add(points);
  };
  if (lines.length) addLines(5, 0x000000, 0.5, 0);
  addNodes(12, 0x000000, 0.5, 1);
  if (lines.length) addLines(2, BONE_COLOR, 1, 2);
  addNodes(8, BONE_COLOR, 1, 3);
}

/** While the run animation plays, move the overlay to the animated rig's bones. */
export function followRig(rig) {
  if (!boneLayer.visible || !boneLayer.children.length || !rig) return;
  const v = new THREE.Vector3();
  const positionsOf = (names) => {
    const out = new Float32Array(names.length * 3);
    names.forEach((name, i) => {
      const bone = rig.bones.get(name);
      if (bone) { bone.getWorldPosition(v); out.set([v.x, v.y, v.z], i * 3); }
    });
    return out;
  };
  const nodes = positionsOf(overlayNames.nodes), lines = positionsOf(overlayNames.lines);
  for (const child of boneLayer.children) {
    if (child.isLineSegments2) child.geometry.setPositions(lines);
    else {
      const position = child.geometry.getAttribute('position');
      position.array.set(nodes);
      position.needsUpdate = true;
    }
  }
}
