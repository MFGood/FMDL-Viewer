// options.js — the Display checkboxes, mirrored into a plain object the rest of the code reads.

import { $ } from './dom.js';

/** Current display options. The values here are the defaults; bindOptions() syncs them with the page. */
export const options = {
  textures: true,
  defaultModels: true,   // default boots and hands for export players without their own boots
  wireframe: false,
  backFaces: false,
  boundingBoxes: false,
  bones: false,
  animateUv: true,       // UV scroll / UV step
  run: false,            // run animation
  grid: true,
  controlHints: true,    // key and mouse hints for players, kits and the view
  frameStray: false,     // include stray meshes when framing the model
  hiddenMeshes: false,   // anti-blur and invisible meshes
  weightScaling: true,   // PES weight scaling
};

const CHECKBOX_IDS = {
  textures: 'tTex',
  defaultModels: 'tDefaults',
  wireframe: 'tWire',
  backFaces: 'tBack',
  boundingBoxes: 'tBox',
  bones: 'tBones',
  animateUv: 'tAnim',
  run: 'tRun',
  grid: 'tGrid',
  controlHints: 'tHints',
  frameStray: 'tStray',
  hiddenMeshes: 'tBlur',
  weightScaling: 'tWeight',
};

// The checkboxes as last set, remembered in the browser: { name: checked }.
const STORAGE_KEY = 'displayOptions';

function savedOptions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; }
}

function saveOptions() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(options)); } catch {}
}

/**
 * Set the checkboxes as they were last left in the browser, read them, and keep `options` in step with
 * them. onChange[name]() runs after each change.
 */
export function bindOptions(onChange) {
  const saved = savedOptions();
  for (const [name, id] of Object.entries(CHECKBOX_IDS)) {
    const input = $(id);
    if (typeof saved[name] === 'boolean') input.checked = saved[name];
    options[name] = input.checked;
    input.addEventListener('change', () => {
      options[name] = input.checked;
      saveOptions();
      onChange[name]?.();
    });
  }
}
