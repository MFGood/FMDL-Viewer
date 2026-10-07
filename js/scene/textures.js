// textures.js — decoding texture files and turning them into GPU textures.
// Each file is decoded once; GPU textures are made per colour space on demand
// (_SRGB roles are colour, _LIN roles are linear data, timing textures are read unfiltered).

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
      const entry = { ...image, srgb: null, lin: null, timing: null };
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

/** GPU texture for a decoded file, in 'srgb' (colour) or 'lin' (data) colour space. null if not available. */
export function gpuTexture(path, space) {
  const entry = path && decoded.get(path.toLowerCase());
  if (!entry || entry.error) return null;
  entry[space] ||= makeDataTexture(entry, { srgb: space === 'srgb' });
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
    entry?.srgb?.dispose(); entry?.lin?.dispose(); entry?.timing?.dispose();
    decoded.delete(key); loading.delete(key);
  }
}
