// fmdl.js — PES / Fox Engine .fmdl model reader.
// Port of FmdlFile.py (FmdlContainer.readStream + FmdlFile.readFile) from
// https://github.com/the4chancup/pes-fmdl-blender. Read-only; no dependencies.

export class InvalidFmdl extends Error {}

const SECTION0_BLOCK_ENTRY_SIZES = {
  0: 48, 1: 8, 2: 32, 3: 48, 4: 16, 5: 68, 6: 4, 7: 4, 8: 4, 9: 8,
  10: 8, 11: 4, 12: 8, 13: 32, 14: 16, 16: 16, 17: 8, 18: 8, 20: 128,
};

export const DatumType = {
  position: 0, boneWeights: 1, normal: 2, color: 3, boneIndices: 7,
  uv0: 8, uv1: 9, uv2: 10, uv3: 11, tangent: 14,
};
export const DatumFormat = {
  tripleFloat32: 1, doubleFloat32: 2, quadFloat16: 6, doubleFloat16: 7, quadFloat8: 8, quadInt8: 9,
};

// ---------------------------------------------------------------- container

function readContainer(buffer) {
  const dv = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  if (buffer.byteLength < 56) throw new InvalidFmdl('Incomplete header');
  const magic = String.fromCharCode(u8[0], u8[1], u8[2], u8[3]);
  if (magic !== 'FMDL') throw new InvalidFmdl('Unexpected magic number (not an FMDL file)');

  const version = dv.getUint32(4, true);
  const descriptorsOffset = Number(dv.getBigUint64(8, true));
  const section0BlockCount = dv.getUint32(32, true);
  const section1BlockCount = dv.getUint32(36, true);
  const section0Offset = dv.getUint32(40, true);
  const section1Offset = dv.getUint32(48, true);

  let p = descriptorsOffset;
  const s0Desc = [];
  for (let i = 0; i < section0BlockCount; i++, p += 8) {
    if (p + 8 > buffer.byteLength) throw new InvalidFmdl('Incomplete block descriptor');
    s0Desc.push([dv.getUint16(p, true), dv.getUint16(p + 2, true), dv.getUint32(p + 4, true)]);
  }
  const s1Desc = [];
  for (let i = 0; i < section1BlockCount; i++, p += 12) {
    if (p + 12 > buffer.byteLength) throw new InvalidFmdl('Incomplete block descriptor');
    s1Desc.push([dv.getUint32(p, true), dv.getUint32(p + 4, true), dv.getUint32(p + 8, true)]);
  }

  // Section 0: arrays of fixed-size entries, each exposed as {dv, o} (a DataView + offset).
  const seg0 = {};
  for (const [blockID, entryCount, off] of s0Desc) {
    const size = SECTION0_BLOCK_ENTRY_SIZES[blockID];
    if (size === undefined) continue;
    if (seg0[blockID]) throw new InvalidFmdl(`Duplicate segment 0 block ${blockID}`);
    const base = section0Offset + off;
    if (base + entryCount * size > buffer.byteLength)
      throw new InvalidFmdl(`Unexpected end of file reading section 0 block ${blockID} entry`);
    const block = [];
    for (let i = 0; i < entryCount; i++) block.push({ dv, o: base + i * size });
    seg0[blockID] = block;
  }

  // Section 1: raw byte blobs. Lengths are sometimes slightly wrong — read liberally.
  const seg1 = {};
  const fileLength = buffer.byteLength;
  for (const [blockID, off, len] of s1Desc) {
    if (seg1[blockID]) throw new InvalidFmdl(`Duplicate segment 1 block ${blockID}`);
    const start = off + section1Offset;
    let length = len;
    const remaining = fileLength - start;
    if (length > remaining || blockID === 3) length = remaining;
    seg1[blockID] = new Uint8Array(buffer, start, Math.max(0, length));
  }
  return { version, seg0, seg1 };
}

// ---------------------------------------------------------------- helpers

export function parseFloat16(h) {
  const sign = (h >> 15) & 1, exp = (h >> 10) & 0x1f, man = h & 0x3ff;
  let v;
  if (exp === 31) v = man === 0 ? Infinity : NaN;
  else if (exp === 0) v = man * Math.pow(2, -24);
  else v = (man + 1024) * Math.pow(2, exp - 25);
  return sign ? -v : v;
}

const utf8 = new TextDecoder('utf-8');
const v4 = (dv, o) => ({ x: dv.getFloat32(o, true), y: dv.getFloat32(o + 4, true), z: dv.getFloat32(o + 8, true), w: dv.getFloat32(o + 12, true) });
const blockDV = (u8) => new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

// ---------------------------------------------------------------- section parsers

function parseStrings(f) {
  const strings = [];
  let extensionHeaders = null;
  const block12 = f.seg0[12];
  if (!block12) return { strings, extensionHeaders };
  let lastStringPosition = 0;
  for (const { dv, o } of block12) {
    const blockID = dv.getUint16(o, true), length = dv.getUint16(o + 2, true), offset = dv.getUint32(o + 4, true);
    const block = f.seg1[blockID];
    if (!block) throw new InvalidFmdl(`Invalid block ${blockID} referenced by string`);
    if (offset + length > block.length) throw new InvalidFmdl(`Invalid block location ${offset}+${length} referenced by string`);
    strings.push(utf8.decode(block.subarray(offset, offset + length)));
    if (blockID === 3 && lastStringPosition < length + offset) lastStringPosition = length + offset;
  }
  // Optional nul-terminated "X-FMDL-Extensions:" header after the last string.
  const block = f.seg1[3];
  const start = lastStringPosition + 1;
  if (block && start < block.length) {
    let end = start;
    while (end < block.length && block[end] !== 0) end++;
    const s = utf8.decode(block.subarray(start, end));
    if (s.slice(0, 18).toLowerCase() === 'x-fmdl-extensions:') {
      extensionHeaders = {};
      for (const line of s.split('\n')) {
        const pos = line.indexOf(':');
        if (pos === -1) continue;
        const key = line.slice(0, pos).trim().toLowerCase();
        if (/\s/.test(key) || key in extensionHeaders) continue;
        extensionHeaders[key] = line.slice(pos + 1).trim().split(',').map((v) => v.trim());
      }
    }
  }
  return { strings, extensionHeaders };
}

function parseBoundingBoxes(f) {
  return (f.seg0[13] || []).map(({ dv, o }) => ({ max: v4(dv, o), min: v4(dv, o + 16) }));
}

function parseBones(f, strings, boxes) {
  const bones = (f.seg0[0] || []).map(({ dv, o }) => {
    const nameID = dv.getUint16(o, true), boxID = dv.getUint16(o + 4, true);
    if (nameID >= strings.length) throw new InvalidFmdl(`Invalid string ${nameID} referenced by bone`);
    if (boxID >= boxes.length) throw new InvalidFmdl(`Invalid bounding box ${boxID} referenced by bone`);
    return {
      name: strings[nameID], parentID: dv.getInt16(o + 2, true), parent: null, children: [],
      boundingBox: boxes[boxID], localPosition: v4(dv, o + 16), globalPosition: v4(dv, o + 32),
    };
  });
  for (const b of bones) {
    if (b.parentID >= 0) {
      if (b.parentID >= bones.length) throw new InvalidFmdl(`Invalid bone parent ID ${b.parentID}`);
      b.parent = bones[b.parentID];
      b.parent.children.push(b);
    }
    delete b.parentID;
  }
  return bones;
}

function parseMaterialInstances(f, strings) {
  if (!f.seg0[4]) return [];
  const str = (id, what) => { if (id >= strings.length) throw new InvalidFmdl(`Invalid string ID ${id} referenced by ${what}`); return strings[id]; };
  const materials = (f.seg0[8] || []).map(({ dv, o }) => ({ shader: str(dv.getUint16(o, true), 'material'), technique: str(dv.getUint16(o + 2, true), 'material') }));
  const textures = (f.seg0[6] || []).map(({ dv, o }) => ({ filename: str(dv.getUint16(o, true), 'texture'), directory: str(dv.getUint16(o + 2, true), 'texture') }));
  const assignments = (f.seg0[7] || []).map(({ dv, o }) => [str(dv.getUint16(o, true), 'assignment'), dv.getUint16(o + 2, true)]);
  const params = [];
  if (f.seg1[0]) {
    const pdv = blockDV(f.seg1[0]);
    for (let i = 0; i + 16 <= f.seg1[0].length; i += 16)
      params.push([pdv.getFloat32(i, true), pdv.getFloat32(i + 4, true), pdv.getFloat32(i + 8, true), pdv.getFloat32(i + 12, true)]);
  }
  return f.seg0[4].map(({ dv, o }) => {
    const name = str(dv.getUint16(o, true), 'material instance');
    const materialID = dv.getUint16(o + 4, true);
    const textureCount = dv.getUint8(o + 6), paramCount = dv.getUint8(o + 7);
    const firstTex = dv.getUint16(o + 8, true), firstParam = dv.getUint16(o + 10, true);
    if (materialID >= materials.length) throw new InvalidFmdl(`Invalid material ID ${materialID} referenced by material instance`);
    const inst = { name, technique: materials[materialID].technique, shader: materials[materialID].shader, textures: [], parameters: [] };
    for (let i = firstTex; i < firstTex + textureCount; i++) {
      if (i >= assignments.length) throw new InvalidFmdl(`Invalid texture assignment ${i}`);
      const [role, texID] = assignments[i];
      if (texID >= textures.length) throw new InvalidFmdl(`Invalid texture ${texID} referenced by texture assignment`);
      inst.textures.push([role, textures[texID]]);
    }
    for (let i = firstParam; i < firstParam + paramCount; i++) {
      if (i >= assignments.length) throw new InvalidFmdl(`Invalid material parameter assignment ${i}`);
      const [pname, pID] = assignments[i];
      if (pID >= params.length) throw new InvalidFmdl(`Invalid material parameter ${pID}`);
      inst.parameters.push([pname, params[pID]]);
    }
    return inst;
  });
}

function parseBoneGroups(f, bones) {
  return (f.seg0[5] || []).map(({ dv, o }) => {
    const count = Math.min(32, dv.getUint16(o + 2, true));
    const list = [];
    for (let i = 0; i < count; i++) {
      const id = dv.getUint16(o + 4 + i * 2, true);
      if (id >= bones.length) throw new InvalidFmdl(`Invalid bone ID ${id} referenced by bone group`);
      list.push(bones[id]);
    }
    return { bones: list };
  });
}

function parseMeshFormatAssignments(f, bufferOffsets) {
  if (!f.seg0[9]) return [];
  const meshFormats = (f.seg0[10] || []).map(({ dv, o }) => ({
    bufferID: dv.getUint8(o), entryCount: dv.getUint8(o + 1), increment: dv.getUint8(o + 2), offset: dv.getUint32(o + 4, true),
  }));
  const vertexFormats = (f.seg0[11] || []).map(({ dv, o }) => {
    const type = dv.getUint8(o), format = dv.getUint8(o + 1);
    if (!Object.values(DatumType).includes(type)) throw new InvalidFmdl(`Invalid vertex datum type ${type}`);
    if (!Object.values(DatumFormat).includes(format)) throw new InvalidFmdl(`Invalid vertex datum format ${format}`);
    return { type, format, offset: dv.getUint16(o + 2, true) };
  });
  return f.seg0[9].map(({ dv, o }) => {
    const meshFormatCount = dv.getUint8(o), vertexFormatCount = dv.getUint8(o + 1);
    const firstMeshFormat = dv.getUint16(o + 4, true), firstVertexFormat = dv.getUint16(o + 6, true);
    if (firstMeshFormat + meshFormatCount > meshFormats.length) throw new InvalidFmdl('Invalid mesh format entry');
    if (firstVertexFormat + vertexFormatCount > vertexFormats.length) throw new InvalidFmdl('Invalid vertex format entry');
    const offsets = [], increments = [];
    for (let i = firstMeshFormat; i < firstMeshFormat + meshFormatCount; i++) {
      const mf = meshFormats[i];
      if (mf.bufferID >= bufferOffsets.length) throw new InvalidFmdl(`Invalid buffer offset ID ${mf.bufferID}`);
      for (let j = 0; j < mf.entryCount; j++) { offsets.push(bufferOffsets[mf.bufferID] + mf.offset); increments.push(mf.increment); }
    }
    if (offsets.length !== vertexFormatCount) throw new InvalidFmdl(`Incorrect number of mesh format definitions: found ${offsets.length}, expected ${vertexFormatCount}`);
    const entries = [];
    for (let i = 0; i < vertexFormatCount; i++) {
      const vf = vertexFormats[firstVertexFormat + i];
      entries.push({ type: vf.type, format: vf.format, offset: offsets[i] + vf.offset, increment: increments[i] });
    }
    return entries;
  });
}

// Vertices are decoded straight into typed arrays (ready for a GPU) rather than per-vertex objects.
function parseVertices(f, format, boneGroup, vertexCount) {
  const vb = f.seg1[2];
  if (!vb) throw new InvalidFmdl('Vertex block not found');
  const dv = blockDV(vb);
  const out = { count: vertexCount, position: new Float32Array(vertexCount * 3), uv: [] };
  const h = (p) => parseFloat16(dv.getUint16(p, true));
  let weights = null, indices = null;
  for (const { type, format: fmt, offset, increment } of format) {
    if (offset + (vertexCount - 1) * increment >= vb.length && vertexCount > 0) throw new InvalidFmdl('Vertex data out of range');
    switch (type) {
      case DatumType.position: {
        if (fmt !== DatumFormat.tripleFloat32) throw new InvalidFmdl(`Unexpected format ${fmt} for vertex position data`);
        for (let i = 0; i < vertexCount; i++) {
          const p = offset + i * increment;
          out.position[i * 3] = dv.getFloat32(p, true); out.position[i * 3 + 1] = dv.getFloat32(p + 4, true); out.position[i * 3 + 2] = dv.getFloat32(p + 8, true);
        }
        break;
      }
      case DatumType.normal: case DatumType.tangent: {
        if (fmt !== DatumFormat.quadFloat16) throw new InvalidFmdl(`Unexpected format ${fmt} for vertex normal/tangent data`);
        const arr = new Float32Array(vertexCount * (type === DatumType.normal ? 3 : 4));
        const n = type === DatumType.normal ? 3 : 4;
        for (let i = 0; i < vertexCount; i++) {
          const p = offset + i * increment;
          for (let k = 0; k < n; k++) arr[i * n + k] = h(p + k * 2);
        }
        out[type === DatumType.normal ? 'normal' : 'tangent'] = arr;
        break;
      }
      case DatumType.color: {
        if (fmt !== DatumFormat.quadFloat8) throw new InvalidFmdl(`Unexpected format ${fmt} for vertex color data`);
        const arr = new Float32Array(vertexCount * 4);
        for (let i = 0; i < vertexCount; i++) for (let k = 0; k < 4; k++) arr[i * 4 + k] = vb[offset + i * increment + k] / 255;
        out.color = arr;
        break;
      }
      case DatumType.boneWeights: case DatumType.boneIndices: {
        const want = type === DatumType.boneWeights ? DatumFormat.quadFloat8 : DatumFormat.quadInt8;
        if (fmt !== want) throw new InvalidFmdl(`Unexpected format ${fmt} for vertex bone data`);
        const arr = new Uint8Array(vertexCount * 4);
        for (let i = 0; i < vertexCount; i++) for (let k = 0; k < 4; k++) arr[i * 4 + k] = vb[offset + i * increment + k];
        if (type === DatumType.boneWeights) weights = arr; else indices = arr;
        break;
      }
      default: { // uv0..uv3
        const slot = type - DatumType.uv0;
        const arr = new Float32Array(vertexCount * 2);
        for (let i = 0; i < vertexCount; i++) {
          const p = offset + i * increment;
          if (fmt === DatumFormat.doubleFloat16) { arr[i * 2] = h(p); arr[i * 2 + 1] = h(p + 2); }
          else if (fmt === DatumFormat.doubleFloat32) { arr[i * 2] = dv.getFloat32(p, true); arr[i * 2 + 1] = dv.getFloat32(p + 4, true); }
          else throw new InvalidFmdl(`Unexpected format ${fmt} for vertex uv data`);
        }
        out.uv[slot] = arr;
      }
    }
  }
  out.uv = out.uv.filter(Boolean);
  if (weights) {
    // Total bone weight per vertex, from all four raw weight bytes (255 = 1.0). Counted even where
    // the bone index is out of range, since the game still applies that weight.
    out.weightSum = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++)
      out.weightSum[i] = (weights[i * 4] + weights[i * 4 + 1] + weights[i * 4 + 2] + weights[i * 4 + 3]) / 255;
  }
  if (weights && indices && boneGroup) {
    // Remap group-local bone indices to global skeleton indices; drop out-of-range ones (as the Python does).
    out.skinWeights = new Float32Array(vertexCount * 4);
    out.skinBones = new Array(vertexCount * 4).fill(null);
    for (let i = 0; i < vertexCount * 4; i++) {
      if (weights[i] > 0 && indices[i] < boneGroup.bones.length) {
        out.skinWeights[i] = weights[i] / 255;
        out.skinBones[i] = boneGroup.bones[indices[i]];
      }
    }
  }
  return out;
}

function parseMeshes(f, bones, materialInstances, extensionHeaders) {
  if (!f.seg0[3]) return [];
  const boneGroups = parseBoneGroups(f, bones);
  if (!f.seg0[16]) throw new InvalidFmdl('Level Of Detail specification missing');
  const faceIndices = (f.seg0[17] || []).map(({ dv, o }) => [dv.getUint32(o, true), dv.getUint32(o + 4, true)]);
  const bufferOffsets = (f.seg0[14] || []).map(({ dv, o }) => dv.getUint32(o + 8, true));
  const meshFormats = parseMeshFormatAssignments(f, bufferOffsets);
  if (bufferOffsets.length < 3) throw new InvalidFmdl('Missing face buffer');
  const vb = f.seg1[2];
  const vdv = blockDV(vb);

  return f.seg0[3].map(({ dv, o }, meshIndex) => {
    const alphaFlags = dv.getUint8(o), shadowFlags = dv.getUint8(o + 1);
    const materialInstanceID = dv.getUint16(o + 4, true), boneGroupID = dv.getUint16(o + 6, true);
    const meshFormatID = dv.getUint16(o + 8, true), vertexCount = dv.getUint16(o + 10, true);
    const firstFaceVertexIndex = dv.getUint32(o + 16, true);
    const firstFaceIndexID = Number(dv.getBigUint64(o + 24, true));

    if (meshFormatID >= meshFormats.length) throw new InvalidFmdl(`Invalid mesh format ID ${meshFormatID} referenced by mesh`);
    if (materialInstanceID >= materialInstances.length) throw new InvalidFmdl(`Invalid material instance ID ${materialInstanceID} referenced by mesh`);
    const fmt = meshFormats[meshFormatID];
    const hasBones = fmt.some((e) => e.type === DatumType.boneIndices);
    let boneGroup = null;
    if (hasBones) {
      if (boneGroupID >= boneGroups.length) throw new InvalidFmdl(`Invalid bone group ID ${boneGroupID} referenced by mesh`);
      boneGroup = boneGroups[boneGroupID];
    }
    if (firstFaceIndexID >= faceIndices.length) throw new InvalidFmdl(`Invalid face index ID ${firstFaceIndexID} referenced by mesh`);
    const [lodFirst, lodCount] = faceIndices[firstFaceIndexID]; // LOD 0

    const vertices = parseVertices(f, fmt, boneGroup, vertexCount);
    const first = firstFaceVertexIndex + lodFirst;
    const faces = new Uint16Array(lodCount - (lodCount % 3));
    for (let i = 0; i < faces.length; i++) {
      const idx = vdv.getUint16(bufferOffsets[2] + (first + i) * 2, true);
      if (idx >= vertexCount) throw new InvalidFmdl('Invalid vertex referenced by face');
      faces[i] = idx;
    }
    const ext = new Set();
    if (extensionHeaders)
      for (const k of ['custom-bounding-box-meshes', 'has-antiblur-meshes', 'is-antiblur-meshes'])
        if (extensionHeaders[k] && extensionHeaders[k].includes(String(meshIndex))) ext.add(k);

    return {
      index: meshIndex, vertices, faces, boneGroup, materialInstance: materialInstances[materialInstanceID],
      alphaFlags, shadowFlags, extensionHeaders: ext,
    };
  });
}

function parseMeshGroups(f, strings, boxes, meshes, extensionHeaders) {
  const groups = (f.seg0[1] || []).map(({ dv, o }, i) => {
    const nameID = dv.getUint16(o, true);
    if (nameID >= strings.length) throw new InvalidFmdl(`Invalid string ${nameID} referenced by mesh group`);
    const ext = new Set();
    if (extensionHeaders && extensionHeaders['split-mesh-groups'] && extensionHeaders['split-mesh-groups'].includes(String(i))) ext.add('split-mesh-groups');
    return {
      name: strings[nameID], visible: dv.getUint16(o + 2, true) === 0, parentID: dv.getInt16(o + 4, true),
      parent: null, children: [], meshes: [], boundingBox: null, extensionHeaders: ext,
    };
  });
  for (const g of groups) {
    if (g.parentID >= 0) {
      if (g.parentID >= groups.length) throw new InvalidFmdl(`Invalid mesh group parent ID ${g.parentID}`);
      g.parent = groups[g.parentID];
      g.parent.children.push(g);
    }
    delete g.parentID;
  }
  const assigned = new Array(meshes.length).fill(null);
  for (const { dv, o } of f.seg0[2] || []) {
    const groupID = dv.getUint16(o + 4, true), meshCount = dv.getUint16(o + 6, true);
    const firstMesh = dv.getUint16(o + 8, true), boxID = dv.getUint16(o + 10, true);
    if (groupID >= groups.length) throw new InvalidFmdl(`Invalid mesh group ID ${groupID} referenced by mesh group assignment`);
    if (firstMesh + meshCount > meshes.length) throw new InvalidFmdl('Invalid mesh ID referenced by mesh group assignment');
    for (let i = firstMesh; i < firstMesh + meshCount; i++) assigned[i] = groupID;
    if (boxID < boxes.length) groups[groupID].boundingBox = boxes[boxID];
  }
  assigned.forEach((g, i) => { if (g !== null) groups[g].meshes.push(meshes[i]); meshes[i].group = g !== null ? groups[g] : null; });
  return groups;
}

/** Parse an .fmdl ArrayBuffer. Returns { bones, materialInstances, meshes, meshGroups, extensionHeaders }. */
export function parseFmdl(buffer) {
  const f = readContainer(buffer);
  const { strings, extensionHeaders } = parseStrings(f);
  const boxes = parseBoundingBoxes(f);
  const bones = parseBones(f, strings, boxes);
  const materialInstances = parseMaterialInstances(f, strings);
  const meshes = parseMeshes(f, bones, materialInstances, extensionHeaders);
  const meshGroups = parseMeshGroups(f, strings, boxes, meshes, extensionHeaders);
  return { version: f.version, bones, materialInstances, meshes, meshGroups, extensionHeaders };
}
