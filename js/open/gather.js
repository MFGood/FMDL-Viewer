// gather.js — turning what was dropped or picked into a list of files.
//
// Everything opened is a "batch": what one drop or one pick handed over.
//   { label, drop: { handles, entries } }  dropped items, which can be read again (the browser keeps access)
//   { label, picked: [{ path, file }] }      files from the Open buttons (Chrome refuses to re-read these
//                                            once they change on disk)

const ARCHIVE = /\.(zip|7z|rar)$/i;

// Dropped folders are walked with the File System entries API…
async function filesFromEntry(entry, out) {
  if (entry.isFile) {
    out.push({ path: entry.fullPath.replace(/^\//, ''), file: await new Promise((resolve, reject) => entry.file(resolve, reject)) });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    for (;;) {
      const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      if (!batch.length) break;
      for (const child of batch) await filesFromEntry(child, out);
    }
  }
}

// …or through File System Access handles where the browser has them (Chrome, Edge), which keep live access to disk.
async function filesFromHandle(handle, prefix, out) {
  if (handle.kind === 'file') out.push({ path: prefix + handle.name, file: await handle.getFile() });
  else for await (const child of handle.values()) await filesFromHandle(child, `${prefix}${handle.name}/`, out);
}

/** The batch's files as they are now: [{ path, file }], where path is null for a file on its own. */
export async function batchFiles(batch) {
  if (batch.picked) return batch.picked;
  const { handles, entries } = batch.drop;
  const hasFolder = (handles || entries).some((x) => x.kind === 'directory' || x.isDirectory);
  const out = [];
  if (handles) for (const handle of handles) await filesFromHandle(handle, '', out);
  else for (const entry of entries) await filesFromEntry(entry, out);
  return hasFolder ? out : out.map(({ file }) => ({ path: null, file }));
}

/** A batch from the Open buttons. */
export function pickedBatch(fileList) {
  const files = [...fileList];
  if (!files.length) return null;
  const folder = files.find((f) => f.webkitRelativePath)?.webkitRelativePath.split('/')[0];
  return { label: folder || files.map((f) => f.name).join(', '), picked: files.map((f) => ({ path: f.webkitRelativePath || null, file: f })) };
}

/**
 * A batch from a drop. The lookups have to start during the drop event itself, so call this from the
 * event handler; it resolves to null when the drop held nothing usable.
 */
export function droppedBatch(dataTransfer) {
  const items = [...(dataTransfer.items || [])].filter((i) => i.kind === 'file');
  const handlePromises = items.map((i) => i.getAsFileSystemHandle?.() ?? null);
  const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
  const label = entries.find((e) => e.isDirectory)?.name || entries.map((e) => e.name).join(', ');
  const fallback = pickedBatch(dataTransfer.files);
  return (async () => {
    let handles = null;
    if (handlePromises.length && handlePromises.every(Boolean)) {
      try {
        handles = (await Promise.all(handlePromises)).filter(Boolean);
        if (handles.length !== items.length) handles = null;
      } catch { handles = null; } // not allowed here: fall back to entries
    }
    if (!handles && !entries.length) return fallback;
    return { label, drop: { handles, entries } };
  })();
}

/** Whether the batch has a folder in it (reading those takes a moment). */
export const hasFolder = (batch) => !!batch.drop?.entries.some((e) => e.isDirectory);

/**
 * What a batch is, for spotting that the same thing was opened again: the archive's name, the top
 * folder's name, or the set of .fmdl names for loose models. Textures on their own have no key.
 */
export function batchKey(items) {
  const archive = items.find((i) => ARCHIVE.test(i.file.name));
  if (archive) return `archive:${archive.file.name.toLowerCase()}`;
  const inFolder = items.find((i) => i.path);
  if (inFolder) return `folder:${inFolder.path.split('/')[0].toLowerCase()}`;
  const models = items.filter((i) => /\.fmdl$/i.test(i.file.name)).map((i) => i.file.name.toLowerCase()).sort();
  return models.length ? `loose:${models.join('|')}` : null;
}

export const isArchive = (file) => ARCHIVE.test(file.name);
