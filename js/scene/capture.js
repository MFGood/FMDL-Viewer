// capture.js — pictures of what's shown, for saving: the model framed to fit at the view's angle, drawn at any
// size without the grid, bounding boxes or bones, over a transparent or colored background; turntables of it
// turning once around; and GIFs of those (gifenc, loaded the first time one is made).

import * as THREE from 'three';
import { renderFrame } from './stage.js';
import { FOV, view } from './navigation.js';
import { framedBox } from './framing.js';
import { updateUvAnimations } from './materials.js';
import { running, poseRun } from '../animation/rig.js';

const HALF_TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const FILL = 0.92; // of the picture's width or height the model may take up

/** The view's angle now ({ yaw, pitch, roll, ortho }), to capture other players or frames from. */
export const viewAngle = () => ({ yaw: view.yaw, pitch: view.pitch, roll: view.roll, ortho: view.ortho > 0.5 });

const orientation = ({ yaw, pitch, roll }) => new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll ?? 0, 'YXZ'));

/** The box's corners relative to its center, turned into the camera's axes (x right, y up, z toward the camera). */
function cornersSeenFrom(box, q) {
  const center = box.getCenter(new THREE.Vector3()), inverse = q.clone().invert(), out = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    out.push(new THREE.Vector3(x, y, z).sub(center).applyQuaternion(inverse));
  }
  return out;
}

/** How far back a perspective camera at this angle has to be for the box to fit, or the ortho half-height. */
function fit(box, angle, aspect) {
  const corners = cornersSeenFrom(box, orientation(angle));
  if (angle.ortho) return Math.max(...corners.map((c) => Math.max(Math.abs(c.y), Math.abs(c.x) / aspect))) / FILL;
  const tanV = HALF_TAN * FILL, tanH = tanV * aspect;
  return Math.max(...corners.map((c) => c.z + Math.max(Math.abs(c.x) / tanH, Math.abs(c.y) / tanV)));
}

/**
 * A camera at this angle looking at the box's center moved by `shift` (a world vector), `reach` back (or as
 * ortho half-height).
 */
function cameraAt(box, angle, aspect, reach, shift = new THREE.Vector3()) {
  const q = orientation(angle), center = box.getCenter(new THREE.Vector3()).add(shift);
  const size = box.getSize(new THREE.Vector3()).length();
  const distance = angle.ortho ? size * 2 + 1 : reach;
  const cam = angle.ortho
    ? new THREE.OrthographicCamera(-reach * aspect, reach * aspect, reach, -reach, 0.01, size * 4 + 10)
    : new THREE.PerspectiveCamera(FOV, aspect, Math.max(0.005, reach * 0.01), reach * 4 + size * 2);
  cam.quaternion.copy(q);
  cam.position.copy(center).add(new THREE.Vector3(0, 0, distance).applyQuaternion(q));
  cam.updateProjectionMatrix();
  return cam;
}

/** Where a frame has anything drawn: { minX, minY, maxX, maxY } in pixels, or null if it's empty. */
function drawnBounds(frame) {
  const { width, height } = frame, data = frame.getContext('2d').getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0, i = y * width * 4 + 3; x < width; x++, i += 4) {
      if (data[i] < 8) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX: maxX + 1, maxY: maxY + 1 };
}

/** The view's height at the target, in world units, for this reach. */
const viewHeight = (angle, reach) => (angle.ortho ? 2 * reach : 2 * reach * HALF_TAN);

/**
 * How much bigger (> 1) or smaller the reach should be for what's drawn to fill FILL of the frame, and how far off
 * the middle it is, in view heights: { scale, right, down }, or null for an empty frame.
 */
function misfit(frame) {
  const b = drawnBounds(frame);
  if (!b) return null;
  const { width, height } = frame;
  return {
    scale: Math.max((b.maxX - b.minX) / (width * FILL), (b.maxY - b.minY) / (height * FILL)),
    right: ((b.minX + b.maxX) / 2 - width / 2) / height,
    down: ((b.minY + b.maxY) / 2 - height / 2) / height,
  };
}

/** A frame over a background color (a CSS color), or the frame itself for null (transparent). */
function onBackground(frame, background) {
  if (!background) return frame;
  const out = document.createElement('canvas');
  out.width = frame.width; out.height = frame.height;
  const g = out.getContext('2d');
  g.fillStyle = background;
  g.fillRect(0, 0, out.width, out.height);
  g.drawImage(frame, 0, 0);
  return out;
}

/** The box framing aims at, or an error if nothing is shown. */
function shownBox() {
  const box = framedBox();
  if (box.isEmpty()) throw new Error('Nothing is shown to capture');
  return box;
}

/**
 * A picture of what's shown, fitted at `angle` (the view's, by default): a canvas. The box gives a first fit;
 * then what's actually drawn is measured, and the camera moved in and across to center it and fill the frame.
 */
export function capturePicture({ width, height, background = null, angle = viewAngle() }) {
  const box = shownBox(), aspect = width / height, q = orientation(angle);
  let reach = fit(box, angle, aspect), shift = new THREE.Vector3();
  let frame = renderFrame(cameraAt(box, angle, aspect, reach), width, height);
  for (let pass = 0; pass < 2; pass++) {
    const off = misfit(frame);
    if (!off) break;
    const across = viewHeight(angle, reach);
    shift.add(new THREE.Vector3(off.right * across, -off.down * across, 0).applyQuaternion(q));
    reach *= off.scale;
    frame = renderFrame(cameraAt(box, angle, aspect, reach, shift), width, height);
  }
  return onBackground(frame, background);
}

/**
 * Frames of what's shown turning once around, from the view's angle, `seconds` long at `fps` (UV animations and
 * the run animation play along): yields one canvas per frame. The size stays the same all the way round.
 */
export async function* turntableFrames({ width, height, background, seconds, fps }) {
  const box = shownBox(), aspect = width / height, start = viewAngle(), count = Math.max(2, Math.round(seconds * fps));
  const angles = Array.from({ length: count }, (_, i) => ({ ...start, yaw: start.yaw + (2 * Math.PI * i) / count }));
  let reach = Math.max(...angles.map((a) => fit(box, a, aspect))), lift = 0;
  // Measure what's drawn at a few angles round, and move in (and up or down) until the widest just fills the
  // frame; the turn stays about the model's middle.
  const samples = angles.filter((_, i) => i % Math.max(1, Math.floor(count / 8)) === 0);
  for (let pass = 0; pass < 2; pass++) {
    const offs = samples.map((a) => misfit(renderFrame(cameraAt(box, a, aspect, reach, new THREE.Vector3(0, lift, 0)), width, height))).filter(Boolean);
    if (!offs.length) break;
    lift -= (offs.reduce((n, o) => n + o.down, 0) / offs.length) * viewHeight(start, reach) / Math.max(0.2, Math.cos(start.pitch));
    reach *= Math.max(...offs.map((o) => o.scale));
  }
  for (const [i, angle] of angles.entries()) {
    const t = i / fps;
    updateUvAnimations(t);
    if (running()) poseRun(t);
    yield onBackground(renderFrame(cameraAt(box, angle, aspect, reach, new THREE.Vector3(0, lift, 0)), width, height), background);
    await new Promise(requestAnimationFrame); // let the page breathe (and show progress) between frames
  }
}

/** Encode canvases into a looping GIF, `fps` frames a second, each with its own palette. Resolves to a Blob. */
export async function encodeGif(frames, fps, progress = () => {}) {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const gif = GIFEncoder(), delay = Math.round(1000 / fps);
  let n = 0;
  for await (const frame of frames) {
    const { data, width, height } = frame.getContext('2d').getImageData(0, 0, frame.width, frame.height);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay });
    progress(++n);
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}
