// navigation.js — the view (what the camera looks at, from where) and moving it with the mouse and touch.
// Two mouse schemes:
//   Blender (default): middle-drag orbits, Shift + middle-drag pans, Ctrl + middle-drag zooms smoothly
//     (down = in), the wheel zooms in steps.
//   Classic: left-drag orbits, right-drag / Shift + left-drag pans, middle-drag / wheel zooms; orbit and pan
//     glide to a stop.
// Touch is the same in both: one finger orbits, two pinch to zoom and drag to pan.
// The view keys (keyboard-camera.js) animate the view with animateTo() or change it at once.

import * as THREE from 'three';
import { renderer, stage, perspectiveCamera, orthographicCamera, useCamera } from './stage.js';

export const FOV = 40;            // degrees, the perspective camera's vertical field of view
const ORTHO_FOV = 1;              // perspective narrows to this on its way to orthographic, and back
const ANIMATION_TIME = 0.25;      // seconds
const ZOOM_STEP = 1.2;            // distance factor per wheel notch or zoom key (Blender scheme)
const HALF_TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const QUARTER = Math.PI / 2;

/**
 * The view. The camera turns `yaw` about the vertical axis, then `pitch` about its own horizontal axis, and
 * sits `distance` back from `target`: yaw 0 / pitch 0 is the front view (from +Z), yaw 90° the right view
 * (from +X), pitch −90° the top view. Pitch isn't limited, so past ±90° the view is upside down.
 * `ortho` blends perspective (0) into orthographic (1); orthographic shows what perspective shows at the target.
 */
export const view = { target: new THREE.Vector3(0, 1, 0), yaw: 0, pitch: 0, distance: 3, ortho: 0 };

const copyView = (v) => ({ ...v, target: v.target.clone() });
const wrapAngle = (a) => THREE.MathUtils.euclideanModulo(a + Math.PI, 2 * Math.PI) - Math.PI;
const orientation = (v) => new THREE.Quaternion().setFromEuler(new THREE.Euler(v.pitch, v.yaw, 0, 'YXZ'));

export const upsideDown = () => Math.abs(wrapAngle(view.pitch)) > QUARTER + 1e-6;

// ---------------------------------------------------------------- mouse scheme

let scheme = 'blender';
try { if (localStorage.getItem('navigation') === 'classic') scheme = 'classic'; } catch {}

export const navigationScheme = () => scheme;
export function setNavigationScheme(next) {
  scheme = next;
  try { localStorage.setItem('navigation', next); } catch {}
}

// ---------------------------------------------------------------- smooth moves

let animation = null; // { from, to, t }

/** Where the view is heading: the end of the current animation, or the view itself. */
export const goal = () => copyView(animation ? animation.to : view);

/** Move smoothly to `to` (a view, as from goal()). */
export function animateTo(to) {
  to.pitch = wrapAngle(to.pitch);
  animation = { from: copyView(view), to, t: 0 };
}

/** Jump to the end of any animation; anything that moves the view at once calls this first. */
export function finishAnimation() {
  if (!animation) return;
  Object.assign(view, copyView(animation.to));
  view.yaw = wrapAngle(view.yaw);
  animation = null;
}

function stepAnimation(dt) {
  if (!animation) return;
  animation.t = Math.min(1, animation.t + dt / ANIMATION_TIME);
  const { from, to } = animation, k = THREE.MathUtils.smootherstep(animation.t, 0, 1);
  view.target.lerpVectors(from.target, to.target, k);
  view.yaw = from.yaw + (to.yaw - from.yaw) * k;
  view.pitch = from.pitch + (to.pitch - from.pitch) * k;
  view.distance = from.distance * Math.pow(to.distance / from.distance, k);
  view.ortho = from.ortho + (to.ortho - from.ortho) * k;
  if (animation.t >= 1) finishAnimation();
}

// ---------------------------------------------------------------- moving the view

/** Turn the view. With `limited`, pitch stops at straight up / down unless it's already past them. */
export function orbit(dYaw, dPitch, limited = false) {
  view.yaw = wrapAngle(view.yaw + dYaw);
  const pitch = view.pitch + dPitch;
  view.pitch = limited && Math.abs(view.pitch) <= QUARTER ? THREE.MathUtils.clamp(pitch, -QUARTER, QUARTER) : wrapAngle(pitch);
}

/** Move the target (and camera) by screen amounts, in units of the visible height. */
export function pan(right, up) {
  const q = orientation(view), height = 2 * view.distance * HALF_TAN;
  view.target
    .addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(q), right * height)
    .addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(q), up * height);
}

/** Zoom: distance × factor (< 1 is in). */
export function zoom(factor) {
  view.distance = THREE.MathUtils.clamp(view.distance * factor, 1e-3, 1e4);
}

/** One zoom step in (+1) or out (−1), as the wheel and zoom keys do in the Blender scheme. */
export const zoomStep = (direction) => zoom(Math.pow(ZOOM_STEP, -direction));

/** Set the view at once. */
export function setView(next) {
  animation = null;
  glide.yaw = glide.pitch = glide.right = glide.up = 0;
  Object.assign(view, copyView({ ...view, ...next }));
  view.pitch = wrapAngle(view.pitch);
}

// ---------------------------------------------------------------- placing the camera

/** Place the cameras for the view, gliding classic drags along by dt seconds. Runs every frame. */
export function updateNavigation(dt) {
  stepAnimation(dt);
  stepGlide(dt);
  const q = orientation(view);
  const back = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  const w = stage.clientWidth, h = Math.max(stage.clientHeight, 1);
  if (view.ortho >= 1) {
    const halfHeight = view.distance * HALF_TAN, depth = Math.max(view.distance * 50, 100);
    Object.assign(orthographicCamera, { left: -halfHeight * w / h, right: halfHeight * w / h, top: halfHeight, bottom: -halfHeight, near: -depth, far: depth });
    orthographicCamera.position.copy(view.target).addScaledVector(back, view.distance);
    orthographicCamera.quaternion.copy(q);
    orthographicCamera.updateProjectionMatrix();
    useCamera(orthographicCamera);
  } else {
    // On the way to orthographic the field of view narrows as the camera backs off, keeping the target's
    // plane the same size on screen, so the switch at the end is seamless.
    const tan = HALF_TAN * Math.pow(Math.tan(THREE.MathUtils.degToRad(ORTHO_FOV / 2)) / HALF_TAN, view.ortho);
    const distance = view.distance * HALF_TAN / tan;
    perspectiveCamera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tan));
    perspectiveCamera.near = distance / 200;
    perspectiveCamera.far = Math.max(distance * 50, distance + 60); // far enough for the whole grid
    perspectiveCamera.position.copy(view.target).addScaledVector(back, distance);
    perspectiveCamera.quaternion.copy(q);
    perspectiveCamera.updateProjectionMatrix();
    useCamera(perspectiveCamera);
  }
}

// ---------------------------------------------------------------- mouse and touch

// Classic drags (and touch) glide: what's still to apply, eased in each frame (30% of it at 60 fps), so the
// view trails the cursor slightly and settles within about a tenth of a second of letting go.
const glide = { yaw: 0, pitch: 0, right: 0, up: 0 };

function stepGlide(dt) {
  const f = 1 - Math.pow(0.7, dt * 60);
  if (Math.abs(glide.yaw) + Math.abs(glide.pitch) > 1e-6) orbit(glide.yaw * f, glide.pitch * f, true);
  if (Math.abs(glide.right) + Math.abs(glide.up) > 1e-6) pan(glide.right * f, glide.up * f);
  for (const k in glide) glide[k] *= 1 - f;
}

const canvas = renderer.domElement;
let drag = null;               // { mode: 'orbit' | 'pan' | 'zoom' | 'dolly', x, y, glides }
const touches = new Map();     // pointerId → { x, y }
let wheelRest = 0;             // wheel movement not yet a whole Blender-scheme step

/** Apply a drag of dx, dy pixels. */
function dragBy(mode, dx, dy, glides) {
  const h = Math.max(stage.clientHeight, 1);
  if (mode === 'orbit') {
    const flip = !glides && upsideDown() ? -1 : 1; // Blender keeps left-right drags turning the same way on screen
    const dYaw = -flip * 2 * Math.PI * dx / h, dPitch = -2 * Math.PI * dy / h;
    if (glides) { glide.yaw += dYaw; glide.pitch += dPitch; } else orbit(dYaw, dPitch);
  } else if (mode === 'pan') {
    if (glides) { glide.right -= dx / h; glide.up += dy / h; } else pan(-dx / h, dy / h);
  } else if (mode === 'zoom') zoom(Math.exp(-dy * 0.005)); // Blender: drag down to zoom in
  else if (mode === 'dolly') zoom(Math.exp(dy * 0.005));   // classic: drag up to zoom in
}

function dragMode(e) {
  if (scheme === 'blender') return e.button === 1 ? (e.ctrlKey || e.metaKey ? 'zoom' : e.shiftKey ? 'pan' : 'orbit') : null;
  if (e.button === 0) return e.shiftKey || e.ctrlKey || e.metaKey ? 'pan' : 'orbit';
  return e.button === 2 ? 'pan' : e.button === 1 ? 'dolly' : null;
}

const touchCentre = () => {
  const list = [...touches.values()], n = list.length;
  return { x: list.reduce((s, t) => s + t.x, 0) / n, y: list.reduce((s, t) => s + t.y, 0) / n, spread: n > 1 ? Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y) : 0 };
};
let touchLast = null;

canvas.style.touchAction = 'none';
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); }); // no auto-scroll
canvas.addEventListener('auxclick', (e) => e.preventDefault()); // no middle-click paste

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') {
    finishAnimation();
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    touchLast = touchCentre();
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  const mode = dragMode(e);
  if (!mode || drag) return;
  e.preventDefault();
  finishAnimation();
  drag = { mode, x: e.clientX, y: e.clientY, glides: scheme === 'classic', id: e.pointerId };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const now = touchCentre();
    if (touches.size === 1) dragBy('orbit', now.x - touchLast.x, now.y - touchLast.y, true);
    else {
      if (touchLast.spread && now.spread) zoom(touchLast.spread / now.spread);
      dragBy('pan', now.x - touchLast.x, now.y - touchLast.y, true);
    }
    touchLast = now;
    return;
  }
  if (!drag || e.pointerId !== drag.id) return;
  dragBy(drag.mode, e.clientX - drag.x, e.clientY - drag.y, drag.glides);
  drag.x = e.clientX; drag.y = e.clientY;
});

const endPointer = (e) => {
  if (e.pointerType === 'touch') {
    touches.delete(e.pointerId);
    if (touches.size) touchLast = touchCentre();
  } else if (drag && e.pointerId === drag.id) drag = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  finishAnimation();
  const delta = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 800 : 1);
  if (!delta) return;
  if (scheme === 'classic') { zoom(Math.pow(0.95, -Math.sign(delta))); return; }
  // Blender: whole steps. A mouse wheel notch is about 100; smaller amounts (touchpads) add up to one.
  if (Math.abs(delta) >= 50) { wheelRest = 0; zoomStep(-Math.sign(delta)); return; }
  wheelRest += delta;
  while (Math.abs(wheelRest) >= 100) { zoomStep(-Math.sign(wheelRest)); wheelRest -= 100 * Math.sign(wheelRest); }
}, { passive: false });
