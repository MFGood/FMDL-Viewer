// main.js — starts the viewer: hooks up the page's controls, keyboard and drag-and-drop, and runs the
// render loop.

import * as THREE from 'three';
import { $, isTyping, buttonRow } from './core/dom.js';
import { initNotices } from './core/notices.js';
import { options, bindOptions } from './core/options.js';
import { state } from './core/state.js';
import { viewedPlayer, settingsOf, setSetting } from './export/players.js';
import { kitsAvailable } from './export/texture-lookup.js';
import { stage, boxLayer, boneLayer, makeGrid, showGrid, setBackground, resize, render } from './scene/stage.js';
import { frameModel } from './scene/framing.js';
import { initKeyboardCamera, updateKeyboardCamera } from './scene/keyboard-camera.js';
import { navigationScheme, setNavigationScheme, updateNavigation } from './scene/navigation.js';
import { updateUvAnimations } from './scene/materials.js';
import { followRig } from './scene/overlays.js';
import { running, poseRun, currentRig } from './animation/rig.js';
import {
  refreshMaterials, applyVisibility, applyWireframe, applyWeightOption, applyRunOption, applyTheme, stepKit,
} from './viewer.js';
import { renderTeam, playablePlayers, stepPlayer, reloadForDefaults } from './ui/team.js';
import { renderPlayerPanel } from './ui/details.js';
import { openBatch, reload, canReload, openSample } from './open/opening.js';
import { pickedBatch, droppedBatch } from './open/gather.js';

initNotices();
makeGrid();

// ---------------------------------------------------------------- display options

bindOptions({
  textures: refreshMaterials,
  backFaces: refreshMaterials,
  wireframe: applyWireframe,
  boundingBoxes: () => (boxLayer.visible = options.boundingBoxes),
  bones: () => (boneLayer.visible = options.bones),
  grid: () => showGrid(options.grid),
  hiddenMeshes: applyVisibility,
  frameStray: frameModel,
  weightScaling: applyWeightOption,
  run: applyRunOption,
  defaultModels: async () => {
    if (!state.aet) return;
    const player = viewedPlayer();
    if (player && settingsOf(player).useDefaults != null) { // their own setting wins
      await renderTeam();
      renderPlayerPanel();
      return;
    }
    await reloadForDefaults();
  },
});

$('tPlayerDefaults').addEventListener('change', async () => {
  const player = viewedPlayer();
  if (!player) return;
  setSetting(player, 'useDefaults', $('tPlayerDefaults').checked);
  await reloadForDefaults();
});

// ---------------------------------------------------------------- buttons and keys

const openPicked = (input) => { openBatch(pickedBatch(input.files)); input.value = ''; };
$('fileInput').addEventListener('change', (e) => openPicked(e.target));
$('folderInput').addEventListener('change', (e) => openPicked(e.target));
$('reload').addEventListener('click', reload);
$('resetView').addEventListener('click', frameModel);

addEventListener('keydown', (e) => {
  if (isTyping(e.target)) return;
  // Ctrl + arrows (Cmd on a Mac, where the system takes Ctrl + arrows):
  // Up / Down = previous / next player, Left / Right = previous / next kit.
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (playablePlayers().length) { e.preventDefault(); stepPlayer(e.key === 'ArrowUp' ? -1 : 1); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (kitsAvailable().length > 1) { e.preventDefault(); stepKit(e.key === 'ArrowLeft' ? -1 : 1); }
    }
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.toLowerCase() === 'r' && canReload()) reload();
});
initKeyboardCamera();

// ---------------------------------------------------------------- mouse navigation scheme

const HELP = {
  blender: 'middle-drag: orbit · shift+middle-drag: pan · ctrl+middle-drag / wheel: zoom · numpad: views',
  classic: 'drag / arrows: rotate · right-drag / shift-drag / alt+arrows: pan · wheel / pinch / shift+↑↓: zoom',
};
function renderNavigation() {
  const scheme = navigationScheme();
  $('help').textContent = HELP[scheme];
  buttonRow($('navSchemes'), [['blender', 'Blender'], ['classic', 'Classic']].map(([id, label]) => ({
    label, on: scheme === id, onClick: () => { setNavigationScheme(id); renderNavigation(); },
  })));
}
renderNavigation();

// ---------------------------------------------------------------- drag and drop

let dragDepth = 0;
addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('drop').hidden = false; });
addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop').hidden = true; } });
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  $('drop').hidden = true;
  droppedBatch(e.dataTransfer).then(openBatch);
});

// ---------------------------------------------------------------- theme, size and drawing

// Custom background colour, remembered in this browser. Picking a colour turns it on.
try {
  const saved = JSON.parse(localStorage.getItem('background') || 'null');
  if (saved) { $('tBg').checked = !!saved.on; $('bgColor').value = saved.color; }
} catch {}
function applyBackground() {
  const on = $('tBg').checked, color = $('bgColor').value;
  setBackground(on ? color : null);
  try { localStorage.setItem('background', JSON.stringify({ on, color })); } catch {}
}
$('tBg').addEventListener('change', applyBackground);
$('bgColor').addEventListener('input', () => { $('tBg').checked = true; applyBackground(); });
applyBackground();

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { makeGrid(); applyTheme(); });
new ResizeObserver(resize).observe(stage);
resize();

const clock = new THREE.Clock();
let lastFrame = 0;
function loop() {
  const now = clock.getElapsedTime(), dt = Math.min(0.1, now - lastFrame);
  lastFrame = now;
  updateKeyboardCamera(dt);
  updateNavigation(dt);
  updateUvAnimations(now);
  if (running()) { poseRun(now); followRig(currentRig()); }
  render();
  requestAnimationFrame(loop);
}
loop();

openSample();
