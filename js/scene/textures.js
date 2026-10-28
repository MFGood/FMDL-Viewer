// textures.js — decoding texture files and turning them into GPU textures.
// Each file is decoded once; GPU textures are made per color space on demand
// (_SRGB roles are color, _LIN roles are linear data, timing textures are read unfiltered), and per use for
// normal, specular and roughness maps, rearranged into the channels three.js reads them from.

import * as THREE from 'three';
import { readFile } from '../core/files.js';
import { readFtex, readDds } from '../formats/texture-files.js';
import { decodeToRGBA } from '../formats/block-decode.js';

const loading = new Map(); // lowercase path -> Promise<entry | null>
const decoded = new Map(); // lowercase path -> { rgba, width, height, srgb, lin, timing } | { error }

/** Decode PNG / JPG with the browser. */
async function decodeImage(buffer) {
  const bitmap = await createImageBitmap(new Blob([buffer]), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width; canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);
  const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
  return { rgba: new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.length), width: bitmap.width, height: bitmap.height };
}

/** Decode .dds / .ftex in software. */
async function decodeGameTexture(path, buffer) {
  const image = /\.ftex$/i.test(path) ? await readFtex(buffer) : readDds(buffer);
  return { rgba: decodeToRGBA(image), width: image.width, height: image.height };
}

/** Decode a texture file (once). Resolves to its entry, or null if it couldn't be read. */
export function loadTexture(path) {
  const key = path.toLowerCase();
  if (!loading.has(key)) loading.set(key, (async () => {
    try {
      const buffer = await readFile(path);
      const image = /\.(png|jpe?g)$/i.test(path) ? await decodeImage(buffer) : await decodeGameTexture(path, buffer);
      const entry = { ...image, srgb: null, lin: null, timing: null, normal: null, specular: null, roughness: null };
      decoded.set(key, entry);
      return entry;
    } catch (e) {
      decoded.set(key, { error: e.message });
      return null;
    }
  })());
  return loading.get(key);
}

/** Decoding result for a path: an entry, { error }, or undefined if it hasn't been decoded yet. */
export const textureState = (path) => decoded.get(path.toLowerCase());

export const isDecoded = (path) => decoded.has(path.toLowerCase());

function makeDataTexture(entry, { srgb, nearest }) {
  const texture = new THREE.DataTexture(entry.rgba, entry.width, entry.height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  if (nearest) {
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
  } else {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
  }
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A normal map as three.js reads it: the normal's x, y, z in RGB. PES normal maps are mostly DXT5nm, x in alpha
 * and y in green (the other channels are filler); a texture with an opaque alpha already has x, y in red and
 * green. z is worked out again from x and y either way.
 */
function normalPixels({ rgba }) {
  let alphaUsed = false;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 250) { alphaUsed = true; break; }
  const out = new Uint8Array(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const x = (alphaUsed ? rgba[i + 3] : rgba[i]) / 127.5 - 1, y = rgba[i + 1] / 127.5 - 1;
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    out[i] = (x + 1) * 127.5; out[i + 1] = (y + 1) * 127.5; out[i + 2] = (z + 1) * 127.5; out[i + 3] = 255;
  }
  return out;
}

/** A gray map's value (red) copied to where three.js reads it: alpha for specular, green for roughness. */
function grayPixels({ rgba }, channel) {
  const out = rgba.slice();
  for (let i = 0; i < rgba.length; i += 4) out[i + channel] = rgba[i];
  return out;
}

const REARRANGED = { normal: (e) => normalPixels(e), specular: (e) => grayPixels(e, 3), roughness: (e) => grayPixels(e, 1) };

/**
 * GPU texture for a decoded file: in 'srgb' (color) or 'lin' (data) color space, or rearranged as a 'normal',
 * 'specular' or 'roughness' map. null if not available.
 */
export function gpuTexture(path, space) {
  const entry = path && decoded.get(path.toLowerCase());
  if (!entry || entry.error) return null;
  const rearrange = REARRANGED[space];
  entry[space] ||= makeDataTexture(rearrange ? { ...entry, rgba: rearrange(entry) } : entry, { srgb: space === 'srgb' });
  return entry[space];
}

/** Timing textures get their own copy with nearest filtering: texels are frame numbers and show/hide flags. */
export function timingTexture(path) {
  const entry = path && decoded.get(path.toLowerCase());
  if (!entry || entry.error) return null;
  entry.timing ||= makeDataTexture(entry, { srgb: false, nearest: true });
  return entry.timing;
}

/** Forget one file (it was replaced), or every file with no argument. */
export function forgetTextures(path) {
  const entries = path ? [[path.toLowerCase(), decoded.get(path.toLowerCase())]] : [...decoded];
  for (const [key, entry] of entries) {
    for (const space of ['srgb', 'lin', 'timing', ...Object.keys(REARRANGED)]) entry?.[space]?.dispose();
    decoded.delete(key); loading.delete(key);
  }
}
