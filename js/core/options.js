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
  frameStray: true,      // include stray meshes when framing the model
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
  frameStray: 'tStray',
  hiddenMeshes: 'tBlur',
  weightScaling: 'tWeight',
};

/** Read the checkboxes, and keep `options` in step with them. onChange[name]() runs after each change. */
export function bindOptions(onChange) {
  for (const [name, id] of Object.entries(CHECKBOX_IDS)) {
    const input = $(id);
    options[name] = input.checked;
    input.addEventListener('change', () => {
      options[name] = input.checked;
      onChange[name]?.();
    });
  }
}
