// keyboard-camera.js — moving the camera with the keyboard, in both mouse schemes.
// Arrows orbit, Shift + Up/Down zooms, Alt (Option) + arrows pans; held keys move smoothly each frame.
// Ctrl / Cmd + arrows are left for switching players and kits.
// Blender-style view keys (numpad or the number row):
//   1 / Ctrl+1 front / back, 3 / Ctrl+3 right / left, 7 / Ctrl+7 top / bottom (each also framing the model),
//   5 perspective ↔ orthographic, 9 turn 180° (top ↔ bottom from those views), 4 / 6 orbit ±15° about the
//   vertical, 8 / 2 orbit ±15° over the top, . frame the model keeping the angle, + / = and − zoom.
// 4, 6, 8, 2 and zoom act at once; the rest move smoothly.

import * as THREE from 'three';
import { isTyping } from '../core/dom.js';
import { view, goal, animateTo, finishAnimation, orbit, pan, zoom, zoomStep } from './navigation.js';
import { frameKeepingAngle, frameView, framedCenter } from './framing.js';

const held = new Set();
let shift = false, alt = false;
const STEP = THREE.MathUtils.degToRad(15);
const QUARTER = Math.PI / 2;

/** Head for this yaw / pitch (unrolled) the short way round, framing the model as the period key does. */
function turnTo(yaw, pitch) {
  const to = frameView(goal());
  to.yaw += THREE.MathUtils.euclideanModulo(yaw - to.yaw + Math.PI, 2 * Math.PI) - Math.PI;
  to.pitch = pitch;
  to.roll = 0;
  animateTo(to);
}

/** Orbit over the top by `angle`, first moving the target level with the middle of the model so it stays centred. */
function orbitOver(angle) {
  finishAnimation();
  const center = framedCenter();
  if (center) view.target.y = center.y;
  orbit(0, angle);
}

/** Handle a view key; true if it was one. */
function viewKey(e) {
  if (e.altKey || e.metaKey || e.shiftKey) return false;
  const digit = /^(?:Numpad|Digit)(\d)$/.exec(e.code)?.[1];
  const ctrl = e.ctrlKey;
  if (ctrl && !['1', '3', '7'].includes(digit)) return false;
  switch (digit) {
    case '1': turnTo(ctrl ? Math.PI : 0, 0); return true;
    case '3': turnTo(ctrl ? -QUARTER : QUARTER, 0); return true;
    case '7': turnTo(0, ctrl ? QUARTER : -QUARTER); return true;
    case '5': { const to = goal(); to.ortho = to.ortho >= 0.5 ? 0 : 1; animateTo(to); return true; }
    case '9': {
      const to = goal();
      if (Math.abs(Math.abs(to.pitch) - QUARTER) < 1e-3) to.pitch = -to.pitch; // top ↔ bottom
      else to.yaw += Math.PI;
      animateTo(to);
      return true;
    }
    case '4': finishAnimation(); orbit(-STEP, 0); return true;
    case '6': finishAnimation(); orbit(STEP, 0); return true;
    case '8': orbitOver(-STEP); return true;
    case '2': orbitOver(STEP); return true;
  }
  switch (e.code) {
    case 'Period': case 'NumpadDecimal': frameKeepingAngle(); return true;
    case 'Equal': case 'NumpadAdd': finishAnimation(); zoomStep(1); return true;
    case 'Minus': case 'NumpadSubtract': finishAnimation(); zoomStep(-1); return true;
  }
  return false;
}

export function initKeyboardCamera() {
  addEventListener('keydown', (e) => {
    shift = e.shiftKey; alt = e.altKey;
    if (isTyping(e.target)) return;
    if (viewKey(e)) { e.preventDefault(); return; } // Ctrl + 1 / 3 / 7 would otherwise switch browser tabs
    if (!e.key.startsWith('Arrow') || e.ctrlKey || e.metaKey) return;
    e.preventDefault(); // no page scrolling, and Alt + Left/Right don't go Back / Forward
    held.add(e.key);
  });
  addEventListener('keyup', (e) => { shift = e.shiftKey; alt = e.altKey; held.delete(e.key); });
  addEventListener('blur', () => held.clear());
}

/** Move the camera for the arrows held down, over dt seconds. */
export function updateKeyboardCamera(dt) {
  if (!held.size) return;
  finishAnimation();
  const axis = (negative, positive) => (held.has(positive) ? 1 : 0) - (held.has(negative) ? 1 : 0);
  const h = axis('ArrowLeft', 'ArrowRight'), v = axis('ArrowDown', 'ArrowUp');
  if (alt) pan(h * 1.25 * dt, v * 1.25 * dt); // 1.25 view heights a second
  else if (shift) { if (v) zoom(Math.exp(-v * 1.6 * dt)); }
  else orbit(h * 1.8 * dt, -v * 1.4 * dt, true);
}
