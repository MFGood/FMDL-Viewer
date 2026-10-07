// sevenzip-worker.js — extracts a .7z / .rar (or .zip) archive with 7-Zip compiled to WebAssembly.
// Message in: { file: File }.
// Messages out: { type: 'file', path, data } for each file, then { type: 'done', count, warning }
// or { type: 'error', message }.

importScripts('../vendor/7zip/7zz.umd.js'); // defines SevenZip

const wasmUrl = new URL('../vendor/7zip/7zz.wasm', self.location.href).href;

/** The useful lines of 7-Zip's log, for error messages. */
const problemLines = (log) => log
  .map((line) => line.replace(/\/in\//g, '').trim())
  .filter((line) => /error|cannot|can not|is not archive|wrong password|unsupported|unexpected end|crc failed|data error/i.test(line) && !/^errors?:?$/i.test(line))
  .filter((line, i, all) => all.indexOf(line) === i)
  .slice(0, 4)
  .join(' · ');

async function startSevenZip(log) {
  try {
    return await SevenZip({ locateFile: () => wasmUrl, print: (s) => log.push(s), printErr: (s) => log.push(s) });
  } catch (err) {
    throw new Error(`7-Zip couldn't start in this browser (${err && err.message ? err.message : err}).`);
  }
}

/** Hand every extracted file to the page, freeing the worker's copy as each one goes. */
function sendFiles(FS) {
  let count = 0;
  const folders = ['/out'];
  while (folders.length) {
    const folder = folders.pop();
    for (const name of FS.readdir(folder)) {
      if (name === '.' || name === '..') continue;
      const path = `${folder}/${name}`;
      if (FS.isDir(FS.stat(path).mode)) { folders.push(path); continue; }
      const data = FS.readFile(path);
      FS.unlink(path);
      self.postMessage({ type: 'file', path: path.slice('/out/'.length), data: data.buffer }, [data.buffer]);
      count++;
    }
  }
  return count;
}

self.onmessage = async ({ data: { file } }) => {
  const log = [];
  try {
    const sevenZip = await startSevenZip(log);
    const FS = sevenZip.FS;
    FS.mkdir('/in');
    FS.mount(sevenZip.WORKERFS, { files: [file] }, '/in'); // reads the archive in place, without copying it
    FS.mkdir('/out');
    let exitCode;
    try {
      // -p with no value: never wait for a password prompt. -bsp0 / -bso0: no progress or info output.
      exitCode = sevenZip.callMain(['x', `/in/${file.name}`, '-o/out', '-y', '-p', '-bsp0', '-bso0']);
    } catch {
      throw new Error('7-Zip stopped while extracting. The archive may be password-protected or damaged.');
    }
    if (/wrong password|encrypted/i.test(log.join('\n'))) throw new Error('The archive is password-protected, which the viewer can\'t open.');

    const count = sendFiles(FS);
    if (exitCode !== 0 && !count) throw new Error(problemLines(log) || `7-Zip couldn't extract the archive (exit code ${exitCode}).`);
    const warning = exitCode !== 0 ? (problemLines(log) || `7-Zip reported problems (exit code ${exitCode}).`) : null;
    self.postMessage({ type: 'done', count, warning });
  } catch (err) {
    self.postMessage({ type: 'error', message: err && err.message ? err.message : String(err) });
  }
};
