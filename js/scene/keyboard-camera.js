// keyboard-camera.js — moving the camera with the arrow keys. Arrows orbit, Shift + Up/Down zooms,
// Alt (Option) + arrows pans. Held keys move smoothly each frame. Ctrl / Cmd + arrows are left for
// switching players and kits.

import * as THREE from 'three';
import { isTyping } from '../core/dom.js';
import { camera, controls } from './stage.js';

const held = new Set();
let shift = false, alt = false;

export function initKeyboardCamera() {
  addEventListener('keydown', (e) => {
    shift = e.shiftKey; alt = e.altKey;
    if (!e.key.startsWith('Arrow') || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
    e.preventDefault(); // no page scrolling, and Alt + Left/Right don't go Back / Forward
    held.add(e.key);
  });
  addEventListener('keyup', (e) => { shift = e.shiftKey; alt = e.altKey; held.delete(e.key); });
  addEventListener('blur', () => held.clear());
}

/** Move the camera for the arrows held down, over dt seconds. */
export function updateKeyboardCamera(dt) {
  if (!held.size) return;
  const axis = (negative, positive) => (held.has(positive) ? 1 : 0) - (held.has(negative) ? 1 : 0);
  const h = axis('ArrowLeft', 'ArrowRight'), v = axis('ArrowDown', 'ArrowUp');
  const offset = camera.position.clone().sub(controls.target);
  const distance = offset.length();
  if (alt) { // pan: camera and target move together, in screen directions
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    const move = right.multiplyScalar(h).add(up.multiplyScalar(v)).multiplyScalar(distance * 0.9 * dt);
    camera.position.add(move);
    controls.target.add(move);
  } else if (shift) { // zoom in on Up, out on Down
    if (v) camera.position.copy(controls.target).add(offset.multiplyScalar(Math.exp(-v * 1.6 * dt)));
  } else { // orbit around the target
    const s = new THREE.Spherical().setFromVector3(offset);
    s.theta += h * 1.8 * dt;
    s.phi = THREE.MathUtils.clamp(s.phi - v * 1.4 * dt, 0.05, Math.PI - 0.05);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));
  }
  camera.lookAt(controls.target);
}
