// capture.js — the Capture panel (the camera button in the header): save a PNG of the player shown, a
// turntable GIF of them, or a PNG grid of the whole team with a first tile for the team and the cup. Pictures
// take the view's angle and are framed to fit; the settings are remembered in the browser.

import { $, buttonRow, el } from '../core/dom.js';
import { state } from '../core/state.js';
import { showError } from '../core/notices.js';
import { capturePicture, turntableFrames, encodeGif } from '../scene/capture.js';
import { stage } from '../scene/stage.js';
import { teamGrid, gridPlayers } from './team-grid.js';
import { addPanel } from './panels.js';

const MODES = {
  player: { label: 'Player', size: [1024, 1536], backgrounds: ['transparent', 'viewport', 'custom'], save: 'Save PNG',
    note: 'What\'s shown now, framed to fit at the view\'s angle.' },
  turntable: { label: 'Turntable', size: [480, 720], backgrounds: ['viewport', 'custom'], save: 'Save GIF',
    note: 'One turn around what\'s shown, starting from the view\'s angle. GIFs can\'t be partly see-through, so it goes on a background.' },
  grid: { label: 'Team grid', size: [400, 600], backgrounds: ['team', 'transparent', 'custom'], save: 'Save grid',
    note: 'Every player with models, in the kit shown now and from the view\'s angle, after a tile with the cup name and the team\'s logo, name and colors.' },
};
const BACKGROUNDS = { transparent: 'Transparent', viewport: 'Viewport', custom: 'Custom', team: 'Team colors' };

// ---------------------------------------------------------------- remembered settings

const STORAGE_KEY = 'capture', COLORS_KEY = 'teamColors';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

const settings = {
  mode: 'player', sizes: {}, backgrounds: {}, seconds: 3, fps: 20, color: '#202624', cup: '', columns: null,
  ...read(STORAGE_KEY, {}),
};
const remember = () => write(STORAGE_KEY, settings);
const sizeOf = (mode) => settings.sizes[mode] || MODES[mode].size;
const backgroundOf = (mode) => (MODES[mode].backgrounds.includes(settings.backgrounds[mode]) ? settings.backgrounds[mode] : MODES[mode].backgrounds[0]);

// ---------------------------------------------------------------- team colors

/** A 6-bit save color channel as 0–255. */
const channel = (v) => Math.round((v ?? 0) * 255 / 63);

/**
 * The team's two colors: as last set here for this team, else its note's "Team Colours:", else its team's in the
 * linked save (PES 17 on), else the viewer's green and white.
 */
function teamColors() {
  const name = state.aet?.teamName || '', kept = read(COLORS_KEY, {})[name];
  if (kept) return { colors: kept, from: 'as you set them' };
  const note = state.aet?.teamColors || [];
  if (note.length) return { colors: [note[0], note[1] || note[0]], from: 'from the team note' };
  const team = state.saveLink?.team;
  if (team && team.color1_red != null) {
    const hex = (n) => `#${['red', 'green', 'blue'].map((c) => channel(team[`color${n}_${c}`]).toString(16).padStart(2, '0')).join('')}`;
    return { colors: [hex(1), hex(2)], from: 'from the save' };
  }
  return { colors: ['#1f8a4c', '#ffffff'], from: 'not given, so these are placeholders' };
}

function keepTeamColors() {
  const name = state.aet?.teamName || '';
  write(COLORS_KEY, { ...read(COLORS_KEY, {}), [name]: [$('captureColor1').value, $('captureColor2').value] });
  $('captureColorsNote').textContent = 'Team colors, as you set them';
}

// ---------------------------------------------------------------- the panel

function render() {
  const mode = settings.mode, spec = MODES[mode];
  buttonRow($('captureModes'), Object.entries(MODES).map(([id, m]) => ({
    label: m.label, on: id === mode, onClick: () => { settings.mode = id; remember(); render(); if (id === 'grid' && !settings.cup) $('captureCup').focus(); },
  })));
  $('captureModeNote').textContent = spec.note;
  const [width, height] = sizeOf(mode);
  $('captureWidth').value = width;
  $('captureHeight').value = height;
  $('captureSizeLabel').textContent = mode === 'grid' ? 'Tile size' : 'Size';
  $('captureMotion').hidden = mode !== 'turntable';
  $('captureSeconds').value = settings.seconds;
  $('captureFps').value = settings.fps;

  const background = backgroundOf(mode);
  buttonRow($('captureBackgrounds'), spec.backgrounds.map((id) => ({
    label: BACKGROUNDS[id], on: id === background, onClick: () => { settings.backgrounds[mode] = id; remember(); render(); },
  })));
  $('captureCustomRow').hidden = background !== 'custom';
  $('captureColor').value = settings.color;

  $('captureGrid').hidden = mode !== 'grid';
  if (mode === 'grid') {
    $('captureCup').value = settings.cup;
    $('captureColumns').value = settings.columns ?? '';
    const { colors, from } = teamColors();
    $('captureColor1').value = colors[0];
    $('captureColor2').value = colors[1];
    $('captureColorsNote').textContent = `Team colors, ${from}`;
  }
  $('captureSave').textContent = spec.save;
  renderAvailability();
}

/** Why there's nothing to capture in this mode now, or null. */
function unavailable() {
  if (settings.mode !== 'grid') return state.meshObjects.some((m) => m.shown) ? null : 'Nothing is shown to capture.';
  return !state.aet ? 'Open an export for a team grid.' : !gridPlayers().length ? 'No players in this export have models.' : null;
}

let busy = false;

function renderAvailability(note = '') {
  $('captureSave').disabled = busy;
  $('captureNote').textContent = note;
}

const clampSize = (v) => Math.min(4096, Math.max(64, Math.round(+v || 0)));

function readSize() {
  const size = [clampSize($('captureWidth').value), clampSize($('captureHeight').value)];
  settings.sizes[settings.mode] = size;
  remember();
  return size;
}

/** The background as a CSS color, 'team', or null for transparent. */
function backgroundColor() {
  const id = backgroundOf(settings.mode);
  if (id === 'viewport') return getComputedStyle(stage).backgroundColor;
  if (id === 'custom') return settings.color;
  return id === 'team' ? 'team' : null;
}

/** A file name from the label of what's shown ("Team · Player"), without characters file systems refuse. */
function fileName(suffix, ext) {
  const label = settings.mode === 'grid' ? (state.aet?.teamName || 'team') : $('fileName').textContent;
  const clean = label.replace(/\s*·\s*/g, ' - ').replace(/\.(fmdl|model)$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'capture';
  return `${clean}${suffix ? ` ${suffix}` : ''}.${ext}`;
}

function download(blob, name) {
  const a = el('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

const pngOf = (canvas) => new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('the picture is too big'))), 'image/png'));

async function save() {
  if (busy) return;
  const why = unavailable();
  if (why) { renderAvailability(why); return; }
  const mode = settings.mode, [width, height] = readSize();
  if (mode === 'grid') {
    settings.cup = $('captureCup').value.trim();
    remember();
    const missing = !settings.cup;
    $('captureCupNote').hidden = !missing;
    $('captureCup').setAttribute('aria-invalid', String(missing));
    if (missing) { $('captureCup').focus(); return; }
  }
  busy = true;
  renderAvailability('Working…');
  const progress = (message) => { $('captureNote').textContent = message; };
  try {
    if (mode === 'player') {
      download(await pngOf(capturePicture({ width, height, background: backgroundColor() })), fileName('', 'png'));
    } else if (mode === 'turntable') {
      const seconds = Math.min(20, Math.max(1, +$('captureSeconds').value || 3)), fps = Math.min(50, Math.max(5, Math.round(+$('captureFps').value || 20)));
      Object.assign(settings, { seconds, fps });
      remember();
      const total = Math.max(2, Math.round(seconds * fps));
      const frames = turntableFrames({ width, height, background: backgroundColor(), seconds, fps });
      download(await encodeGif(frames, fps, (n) => progress(`Frame ${n} of ${total}…`)), fileName('turntable', 'gif'));
    } else {
      const columns = Math.round(+$('captureColumns').value) || null;
      settings.columns = columns;
      remember();
      const canvas = await teamGrid({
        tileWidth: width, tileHeight: height, columns, cup: settings.cup,
        colors: [$('captureColor1').value, $('captureColor2').value], background: backgroundColor(), progress,
      });
      download(await pngOf(canvas), fileName('grid', 'png'));
    }
    busy = false;
    renderAvailability('Saved.');
  } catch (e) {
    busy = false;
    renderAvailability();
    showError(`Couldn't capture: ${e.message}`);
  }
}

export function initCapture() {
  addPanel({ panel: $('capture'), button: $('captureButton'), close: $('captureClose'), onOpen: render });
  $('captureSave').addEventListener('click', save);
  for (const id of ['captureWidth', 'captureHeight']) $(id).addEventListener('change', readSize);
  $('captureColor').addEventListener('input', () => { settings.color = $('captureColor').value; remember(); });
  for (const id of ['captureColor1', 'captureColor2']) $(id).addEventListener('input', keepTeamColors);
  $('captureCup').addEventListener('input', () => {
    settings.cup = $('captureCup').value.trim();
    remember();
    if (settings.cup) { $('captureCupNote').hidden = true; $('captureCup').setAttribute('aria-invalid', 'false'); }
  });
}
