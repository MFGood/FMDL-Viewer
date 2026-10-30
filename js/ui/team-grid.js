// team-grid.js — the team grid: every player of the open export with models, each pictured in their own tile
// with their number and name, after a first tile with the cup's name, the team's logo and name, and its colors.
// The players are shown one after another to picture them, then the player shown before comes back.

import { readFile } from '../core/files.js';
import { state } from '../core/state.js';
import { playerTitle, twoDigits } from '../export/players.js';
import { capturePicture, viewAngle } from '../scene/capture.js';
import { playablePlayers, openPlayer } from './team.js';
import { captureView } from '../open/opening.js';

const DISPLAY = '"Barlow Semi Condensed", "Arial Narrow", system-ui, sans-serif';
const BODY = '"Barlow", system-ui, sans-serif';

// ---------------------------------------------------------------- colors

const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hexOf = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
/** `a` moved toward `b` by t (0–1). */
const mix = (a, b, t) => { const x = rgbOf(a), y = rgbOf(b); return hexOf(x.map((v, i) => v + (y[i] - v) * t)); };
const luminance = (hex) => {
  const [r, g, b] = rgbOf(hex).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
/** White or near-black, whichever reads better on `background`. */
const ink = (background) => (contrast(background, '#ffffff') >= contrast(background, '#111111') ? '#ffffff' : '#111111');
/** `preferred` for text on `background` if it reads well enough there, else ink(). */
const textOn = (background, preferred) => (contrast(background, preferred) >= 3 ? preferred : ink(background));

// ---------------------------------------------------------------- drawing

/** Set the font for `text` at the largest size up to `size` that fits `width`. */
function fitFont(g, text, width, size, weight, family) {
  for (let s = size; s > 6; s *= 0.94) {
    g.font = `${weight} ${Math.round(s)}px ${family}`;
    if (g.measureText(text).width <= width) return;
  }
}

function spaced(g, px) { if ('letterSpacing' in g) g.letterSpacing = `${px}px`; }

/** The first tile: the cup name, the logo, the team name, and a band in the second team color. */
function drawHeaderTile(g, x, y, w, h, band, { cup, teamName, logo, colors: [c1, c2] }) {
  g.fillStyle = c1;
  g.fillRect(x, y, w, h);
  g.fillStyle = c2;
  g.fillRect(x, y + h - band, w, band);
  const text = textOn(c1, c2);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = text;

  const cupText = cup.toUpperCase();
  spaced(g, Math.round(w * 0.012));
  fitFont(g, cupText, w * 0.86, w * 0.075, 700, DISPLAY);
  g.fillText(cupText, x + w / 2, y + h * 0.09);
  spaced(g, 0);

  const nameY = y + h - band - h * 0.13;
  if (logo) {
    const top = y + h * 0.16, bottom = nameY - h * 0.09;
    const scale = Math.min((w * 0.7) / logo.width, (bottom - top) / logo.height);
    const lw = logo.width * scale, lh = logo.height * scale;
    g.drawImage(logo, x + (w - lw) / 2, top + (bottom - top - lh) / 2, lw, lh);
  }
  fitFont(g, teamName, w * 0.88, logo ? w * 0.17 : w * 0.24, 700, DISPLAY);
  g.fillText(teamName, x + w / 2, logo ? nameY : y + (h - band) / 2);
}

/** A player's tile: their picture over the background, and a plate with their number and name. */
function drawPlayerTile(g, x, y, w, h, band, { image, player, colors: [c1, c2], background }) {
  if (background === 'team') {
    const fill = g.createLinearGradient(0, y, 0, y + h);
    fill.addColorStop(0, mix(c1, '#000000', 0.35));
    fill.addColorStop(1, mix(c1, '#000000', 0.75));
    g.fillStyle = fill;
    g.fillRect(x, y, w, h - band);
  } else if (background) {
    g.fillStyle = background;
    g.fillRect(x, y, w, h - band);
  }
  g.drawImage(image, x, y);

  g.fillStyle = c1;
  g.fillRect(x, y + h - band, w, band);
  g.textBaseline = 'middle';
  let left = x + band * 0.3;
  if (player.number != null) {
    const box = band * 1.2;
    g.fillStyle = c2;
    g.fillRect(x, y + h - band, box, band);
    g.fillStyle = ink(c2);
    g.textAlign = 'center';
    fitFont(g, '00', box * 0.8, band * 0.62, 700, DISPLAY);
    g.fillText(twoDigits(player.number), x + box / 2, y + h - band / 2);
    left = x + box + band * 0.25;
  }
  const name = playerTitle(player);
  g.fillStyle = ink(c1);
  g.textAlign = 'left';
  fitFont(g, name, x + w - left - band * 0.25, band * 0.5, 500, BODY);
  g.fillText(name, left, y + h - band / 2);
}

/** The export's logo as an image, or null. */
async function loadLogo() {
  if (!state.aet?.logoPath) return null;
  try { return await createImageBitmap(new Blob([await readFile(state.aet.logoPath)])); } catch { return null; }
}

// ---------------------------------------------------------------- the grid

/** Players the grid pictures: those with models, without the Collars. */
export const gridPlayers = () => playablePlayers().filter((p) => !p.collars);

/**
 * Picture every player and lay out the grid. tileWidth × tileHeight per tile, `columns` across (0 for about
 * square), `background` 'team', null (transparent) or a CSS color behind the players. `progress(message)`
 * hears which player is being pictured. Resolves to a canvas.
 */
export async function teamGrid({ tileWidth, tileHeight, columns, cup, colors, background, progress = () => {} }) {
  const players = gridPlayers();
  if (!players.length) throw new Error('No players with models to picture');
  await Promise.all([document.fonts.load(`700 40px ${DISPLAY}`), document.fonts.load(`500 40px ${BODY}`)]).catch(() => {});
  const angle = viewAngle(), band = Math.round(tileHeight * 0.11);
  const before = state.activePlayer, view = captureView(), pictures = [];
  try {
    for (const [i, player] of players.entries()) {
      progress(`Picturing ${playerTitle(player)} (${i + 1} of ${players.length})…`);
      await openPlayer(player);
      pictures.push({ player, image: capturePicture({ width: tileWidth, height: tileHeight - band, angle }) });
    }
  } finally {
    progress('Putting the grid together…');
    if (before) {
      state.pendingRestore = view;
      try { await openPlayer(before); } finally { state.pendingRestore = null; }
    }
  }

  const count = pictures.length + 1;
  const across = columns || Math.max(1, Math.round(Math.sqrt((count * tileHeight) / tileWidth)));
  const down = Math.ceil(count / across), gap = Math.max(2, Math.round(tileWidth * 0.02));
  const canvas = document.createElement('canvas');
  canvas.width = across * tileWidth + (across + 1) * gap;
  canvas.height = down * tileHeight + (down + 1) * gap;
  const g = canvas.getContext('2d');
  if (background) {
    g.fillStyle = background === 'team' ? mix(colors[0], '#000000', 0.85) : background;
    g.fillRect(0, 0, canvas.width, canvas.height);
  }
  const at = (i) => [gap + (i % across) * (tileWidth + gap), gap + Math.floor(i / across) * (tileHeight + gap)];
  const teamName = state.aet.teamName || 'Team';
  drawHeaderTile(g, ...at(0), tileWidth, tileHeight, band, { cup, teamName, logo: await loadLogo(), colors });
  for (const [i, picture] of pictures.entries()) drawPlayerTile(g, ...at(i + 1), tileWidth, tileHeight, band, { ...picture, colors, background });
  return canvas;
}
