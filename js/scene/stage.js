// stage.js — the three.js renderer, scene, cameras, lights and ground grid.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $, cssVar } from '../core/dom.js';
import { options } from '../core/options.js';

export const stage = $('stage');

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.prepend(renderer.domElement);

export const scene = new THREE.Scene();
export const perspectiveCamera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
export const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
/** The camera drawn with: one of the two above (navigation.js places both and picks one). */
export let camera = perspectiveCamera;

scene.add(new THREE.HemisphereLight(0xffffff, 0x445544, 1.4));
// A neutral studio environment so metallic (GGX) and glass shaders have something to reflect.
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(1, 2, 3);
camera.add(keyLight); // the key light moves with the camera
scene.add(perspectiveCamera, orthographicCamera);

/** Draw with this camera from now on. */
export function useCamera(next) {
  if (next === camera) return;
  next.add(keyLight);
  camera = next;
}

/** Bounding boxes, drawn in the scene. */
export const boxLayer = new THREE.Group();
scene.add(boxLayer);

/** Bones, drawn after the scene over a cleared depth buffer so they're always on top. */
export const boneLayer = new THREE.Group();
const overlay = new THREE.Scene();
overlay.add(boneLayer);

/** Fat-line materials whose resolution must follow the viewport size. */
export const lineMaterials = new Set();

// ---------------------------------------------------------------- ground grid

// Fixed: centred on the origin at floor height, 5 m out in every horizontal direction (10 m × 10 m),
// with 1 m squares. The two lines through the origin are drawn in the accent colour.
let grid = null;

/** (Re)build the grid in the current theme's colours. */
export function makeGrid() {
  if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
  grid = new THREE.GridHelper(10, 10, new THREE.Color(cssVar('--accent')), new THREE.Color(cssVar('--muted')));
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  grid.visible = options.grid;
  scene.add(grid);
}

export function showGrid(on) { if (grid) grid.visible = on; }

// ---------------------------------------------------------------- background

/** The viewport background: a CSS colour, or null for the theme's. */
export function setBackground(color) { stage.style.background = color || ''; }

// ---------------------------------------------------------------- size and drawing

export function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  perspectiveCamera.aspect = w / Math.max(h, 1);
  perspectiveCamera.updateProjectionMatrix();
  for (const m of lineMaterials) m.resolution.set(w, h);
}

export function render() {
  renderer.render(scene, camera);
  if (boneLayer.visible && boneLayer.children.length) {
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlay, camera);
    renderer.autoClear = true;
  }
}
