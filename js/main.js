// main.js — starts the viewer: hooks up the page's controls, keyboard and drag-and-drop, and runs the
// render loop.

import * as THREE from 'three';
import { $, isTyping, buttonRow } from './core/dom.js';
import { initNotices, flashStatus } from './core/notices.js';
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
import { running, rigged, poseRun, currentRig } from './animation/rig.js';
import {
  refreshMaterials, applyVisibility, applyWireframe, applyWeightOption, applyRunOption, applyTheme, stepKit,
} from './viewer.js';
import { renderTeam, playablePlayers, stepPlayer, reloadForDefaults } from './ui/team.js';
import { renderPlayerPanel } from './ui/details.js';
import { initSettings, loadSave } from './ui/settings.js';
import { openBatch, reload, canReload, openSample, restoreFolder } from './open/opening.js';
import { pickedBatch, droppedBatch, batchFiles, folderBatch, canReadFolder } from './open/gather.js';

initNotices();
restoreFolder(); // before the save, so its teams aren't listed only once the save is read
initSettings();
makeGrid();

// ---------------------------------------------------------------- display options

bindOptions({
  textures: refreshMaterials,
  surfaceMaps: refreshMaterials,
  backFaces: refreshMaterials,
  wireframe: applyWireframe,
  boundingBoxes: () => (boxLayer.visible = options.boundingBoxes),
  bones: () => (boneLayer.visible = options.bones),
  grid: () => showGrid(options.grid),
  controlHints: () => applyHints(),
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
showGrid(options.grid); // as remembered (the grid was made before the options were read)
function applyHints() { document.body.classList.toggle('no-hints', !options.controlHints); }
applyHints();

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

// Where the browser can, pick the folder with a handle instead, which can be remembered for the next visit
// (see rememberFolder). Some won't read the handle they give (the Claude app's browser pane), so then it's
// the plain folder input.
let folderHandlesWork = true;
$('folderInput').closest('label').addEventListener('click', async (e) => {
  if (!window.showDirectoryPicker || !folderHandlesWork) return;
  e.preventDefault();
  let handle;
  try { handle = await showDirectoryPicker({ id: 'exports' }); } catch { return; } // cancelled
  if (!await canReadFolder(handle)) {
    folderHandlesWork = false;
    $('folderInput').click();
    return;
  }
  openBatch(folderBatch(handle));
});
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
  blender: 'middle-drag: orbit · shift+middle-drag: pan · ctrl+middle-drag / wheel: zoom · ctrl / shift+wheel: pan · ctrl+shift+wheel: roll · numpad: views',
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
  droppedBatch(e.dataTransfer).then(openDropped);
});

// A file dropped on its own whose name starts like a PES save's (EDIT00000000 or EDIT.bin, so copies such
// as EDIT00000000.bak count), or that has no extension, is tried as the save file first; an extensionless
// file that isn't one is opened as usual.
const SAVE_NAME = /^EDIT(\d{8}|\.bin)/i;
async function openDropped(batch) {
  const items = batch && await batchFiles(batch).catch(() => null);
  const file = items?.length === 1 && !items[0].path ? items[0].file : null;
  if (file && (SAVE_NAME.test(file.name) || !file.name.includes('.'))) {
    const handle = batch.drop?.handles?.[0] ?? null;
    if (await loadSave(file, handle, !SAVE_NAME.test(file.name))) {
      flashStatus(`Loaded ${file.name} as the save file`);
      return;
    }
    if (SAVE_NAME.test(file.name)) return;
  }
  openBatch(batch);
}

// ---------------------------------------------------------------- theme, size and drawing

// Custom background color, remembered in the browser. Picking a color turns it on.
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
  if (running()) poseRun(now);
  if (rigged()) followRig(currentRig());
  render();
  requestAnimationFrame(loop);
}
loop();

openSample();
