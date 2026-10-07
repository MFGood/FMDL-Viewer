// archives.js — reading .zip, .7z and .rar files. Both return the files inside as [{ path, read }].
//
// .zip uses JSZip, which reads entries on demand. .7z and .rar use 7-Zip 24.09 compiled to WebAssembly
// (7z-wasm, LGPL; RAR decoding under the unRAR licence restriction), which runs in a worker and
// extracts everything up front. Both libraries are loaded the first time they're needed.

import { loadScript } from '../core/dom.js';
import { siteUrl } from '../core/files.js';

const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

/** A zip's files, or null if JSZip can't read it (the caller can try 7-Zip instead). */
export async function readZip(file) {
  try {
    await loadScript(JSZIP_URL);
    const zip = await window.JSZip.loadAsync(file);
    const files = [];
    zip.forEach((path, entry) => { if (!entry.dir) files.push({ path, read: () => entry.async('arraybuffer') }); });
    return files;
  } catch {
    return null; // JSZip unavailable, or zip features it lacks
  }
}

/**
 * Extract an archive with 7-Zip. onProgress(count) is called as files come out.
 * Resolves to { files: [{ path, read }], warning } (warning: problems 7-Zip reported but got past).
 */
export function readWith7zip(file, onProgress) {
  return new Promise((resolve, reject) => {
    let worker;
    try { worker = new Worker(siteUrl('workers/sevenzip-worker.js')); } // a fresh 7-Zip per archive
    catch (e) { reject(new Error(`the browser wouldn't start the 7-Zip worker (${e.message})`)); return; }
    const files = [];
    worker.onmessage = ({ data: message }) => {
      if (message.type === 'file') {
        const { path, data } = message;
        files.push({ path, read: async () => data });
        onProgress?.(files.length);
        return;
      }
      worker.terminate();
      if (message.type === 'done') resolve({ files, warning: message.warning });
      else reject(new Error(message.message));
    };
    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message || '7-Zip failed to run')); };
    worker.postMessage({ file });
  });
}
