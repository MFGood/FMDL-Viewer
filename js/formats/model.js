// model.js — Pre-Fox PES (PES 16 / 17) .model reader.
// Port of ModelFile.py (readModelBuffer) from https://github.com/the4chancup/pes-model-blender; see its
// format.txt for the layout. Read-only; no dependencies beyond inflate.
//
// Returns the same shape as parseFmdl, so the rest of the viewer handles both. The differences:
//   - a .model only names each mesh's material; the material itself is in the .mtl the model's .xml
//     assigns, so meshes come back with materialName and materialInstance is filled in later (mtl.js);
//   - faces are stored counter-clockwise (the Blender importer doesn't reverse them), flagged ccw;
//   - bones carry the inverse of their bind matrix, with no hierarchy;
//   - there are no mesh groups, so each mesh gets a group of its own for the model tree.

import { inflate } from './texture-files.js';

export class InvalidModel extends Error {}

const DatumType = {
  position: 2, normal: 3, color: 4, uv0: 7, uv1: 8, uv2: 9, uv3: 10,
  tangent: 15, bitangent: 16, boneWeights: 17, boneIndices: 18,
};
const DatumFormat = {
  uint16: 1, uint32: 2, float32: 3, doubleFloat32: 4, tripleFloat32: 5, quadFloat32: 6,
  float32Matrix34: 7, quadInt8: 8, quadFloat8: 9,
};

/** Unpack a WESYS zlib-compressed file (.model, .mtl and .xml can all be); anything else is returned as is. */
export async function unwrapWesys(buffer) {
  const u8 = new Uint8Array(buffer);
  if (u8.length < 16 || String.fromCharCode(u8[4], u8[5], u8[6], u8[7]) !== 'ESYS') return buffer;
  const out = await inflate(u8.subarray(16));
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}

const utf8 = new TextDecoder('utf-8');

/** Parse a .model ArrayBuffer (zlib-compressed or not). */
export async function parseModel(buffer) {
  buffer = await unwrapWesys(buffer);
  const dv = new DataView(buffer), u8 = new Uint8Array(buffer), size = buffer.byteLength;
  const warnings = [];

  const need = (address, length, what = 'record') => {
    if (address < 0 || address + length > size) throw new InvalidModel(`Unexpected end of ${what}`);
  };
  const u32 = (a) => { need(a, 4); return dv.getUint32(a, true); };
  const i32 = (a) => { need(a, 4); return dv.getInt32(a, true); };
  const readString = (a) => {
    let end = a;
    while (end < size && u8[end] !== 0) end++;
    if (end >= size) throw new InvalidModel('Unexpected end of string');
    return utf8.decode(u8.subarray(a, end));
  };

  /**
   * A StructArray at an absolute address: { base, header, recordSize, records: [address] }.
   * Offsets inside a StructArray's records are usually relative to its base.
   */
  const structArray = (base, recordSizes = null, headerSizes = [0]) => {
    const offset = u32(base), count = u32(base + 4), recordSize = u32(base + 8);
    const headerSize = offset - 12;
    if (headerSizes && !headerSizes.includes(headerSize)) throw new InvalidModel('Unexpected record array header size');
    if (recordSizes && !recordSizes.includes(recordSize)) throw new InvalidModel('Unexpected record array record size');
    need(base + offset, count * recordSize);
    const records = [];
    for (let i = 0; i < count; i++) records.push(base + offset + i * recordSize);
    return { base, header: base + 12, recordSize, records };
  };

  // ------------------------------------------------------------ sections
  if (size < 24 || utf8.decode(u8.subarray(0, 5)) !== 'MODEL') throw new InvalidModel('Unexpected magic (not a .model file)');
  const tocOffset = u32(8), version = dv.getUint16(14, true);
  const sectionArray = structArray(tocOffset + 8, [4]);
  const sections = sectionArray.records.map((r) => sectionArray.base + u32(r));
  if (sections.length < 7) throw new InvalidModel('Missing sections');

  // ------------------------------------------------------------ bones (sections 0 and 5)
  const boneNames = (() => {
    const array = structArray(sections[5], [4]);
    return array.records.map((r) => readString(array.base + u32(r)));
  })();
  const boneMatrices = [], boneIndexGroups = new Map(); // bone group address -> bone ids
  {
    const array = structArray(sections[0], [4]);
    for (const r of array.records) {
      const data = structArray(array.base + u32(r), [12], [4]);
      for (const d of data.records) {
        const entryOffset = u32(d), entryType = u32(d + 4), entryCount = u32(d + 8);
        const at = data.base + entryOffset;
        if (entryType === DatumFormat.float32Matrix34) {
          if (entryCount !== 1) throw new InvalidModel('Bone matrix record with count != 1');
          need(at, 48, 'bone matrix');
          const m = [];
          for (let i = 0; i < 12; i++) m.push(dv.getFloat32(at + i * 4, true));
          boneMatrices.push(m);
        } else if (entryType === DatumFormat.uint16) {
          need(at, entryCount * 2, 'bone group');
          const ids = [];
          for (let i = 0; i < entryCount; i++) ids.push(dv.getUint16(at + i * 2, true));
          boneIndexGroups.set(data.base, ids);
        }
      }
    }
  }
  if (boneNames.length !== boneMatrices.length) throw new InvalidModel('Incomplete bone definitions');
  const bones = boneNames.map((name, i) => {
    const p = bindPosition(boneMatrices[i]);
    return { name, parent: null, children: [], matrix: boneMatrices[i], localPosition: p, globalPosition: p, boundingBox: null };
  });
  const boneGroups = new Map();
  for (const [address, ids] of boneIndexGroups) {
    if (ids.some((id) => id >= bones.length)) throw new InvalidModel('Invalid bone referenced in bone group');
    boneGroups.set(address, { bones: ids.map((id) => bones[id]) });
  }

  // ------------------------------------------------------------ material names (section 6)
  const materials = new Map(); // record address -> name
  {
    const array = structArray(sections[6], [4]);
    for (const r of array.records) materials.set(r, readString(array.base + u32(r)));
  }

  // ------------------------------------------------------------ geometry (section 1)
  const s1 = sections[1];

  function parseVertices(fieldArray) {
    if (u32(fieldArray.header) !== 0) warnings.push('cloth physics, which is not supported');
    let count = null;
    const seen = new Set(), fields = {};
    for (const r of fieldArray.records) {
      const offset = u32(r), type = u32(r + 4), format = u32(r + 8), n = u32(r + 12);
      if (seen.has(type)) continue;
      seen.add(type);
      if (count === null) count = n;
      else if (count !== n) continue;
      fields[type] = { at: s1 + offset, format };
    }
    count ??= 0;
    const out = { count, position: new Float32Array(count * 3), uv: [] };
    const floats = (field, n, what) => {
      need(field.at, count * n * 4, `vertex ${what} data`);
      const arr = new Float32Array(count * n);
      for (let i = 0; i < arr.length; i++) arr[i] = dv.getFloat32(field.at + i * 4, true);
      return arr;
    };
    const expect = (field, format, what) => {
      if (field.format !== format) throw new InvalidModel(`Unexpected format ${field.format} for vertex ${what} data`);
    };
    const f = fields;
    if (f[DatumType.position]) { expect(f[DatumType.position], DatumFormat.tripleFloat32, 'position'); out.position = floats(f[DatumType.position], 3, 'position'); }
    if (f[DatumType.normal]) { expect(f[DatumType.normal], DatumFormat.tripleFloat32, 'normal'); out.normal = floats(f[DatumType.normal], 3, 'normal'); }
    if (f[DatumType.color]) {
      const c = f[DatumType.color];
      expect(c, DatumFormat.quadFloat8, 'color');
      need(c.at, count * 4, 'vertex color data');
      out.color = Float32Array.from(u8.subarray(c.at, c.at + count * 4), (x) => x / 255);
    }
    for (const type of [DatumType.uv0, DatumType.uv1, DatumType.uv2, DatumType.uv3]) {
      if (!f[type]) continue;
      expect(f[type], DatumFormat.doubleFloat32, 'uv');
      out.uv.push(floats(f[type], 2, 'uv'));
    }

    const indicesField = f[DatumType.boneIndices];
    if (indicesField) {
      expect(indicesField, DatumFormat.quadInt8, 'bone indices');
      need(indicesField.at, count * 4, 'vertex bone indices data');
      const weightsField = f[DatumType.boneWeights];
      let perVertex = 0, weights = null;
      if (weightsField) {
        perVertex = { [DatumFormat.quadFloat32]: 4, [DatumFormat.tripleFloat32]: 3, [DatumFormat.doubleFloat32]: 2 }[weightsField.format];
        if (!perVertex) throw new InvalidModel(`Unexpected format ${weightsField.format} for vertex bone weights data`);
        weights = floats(weightsField, perVertex, 'bone weights');
      }
      // As the Python: each listed bone counts once (its first weight), zero weights are dropped, and with
      // no weights at all the first bone gets everything.
      out.boneSlots = new Uint8Array(count * 4);
      out.boneWeights = new Float32Array(count * 4);
      out.weightSum = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const used = [];
        const slots = weights ? perVertex : 1;
        for (let k = 0; k < slots; k++) {
          const index = u8[indicesField.at + i * 4 + k], weight = weights ? weights[i * perVertex + k] : 1;
          if (weight > 0 && !used.includes(index)) {
            out.boneSlots[i * 4 + used.length] = index;
            out.boneWeights[i * 4 + used.length] = weight;
            used.push(index);
            out.weightSum[i] += weight;
          }
        }
      }
    }
    return out;
  }

  function parseFaces(descriptor, recordSize, vertexCount) {
    const facesStart = u32(descriptor), format = u32(descriptor + 8), faceVertexCount = u32(descriptor + 12);
    if (format !== DatumFormat.uint16) warnings.push('face vertex format other than uint16');
    let start = 0, end = faceVertexCount;
    if (recordSize >= 24 && u32(descriptor + 16) !== 0) { // LOD levels: keep the first, the best
      const lod = s1 + u32(descriptor + 20);
      start = u32(lod); end = u32(lod + 4);
    }
    const at = s1 + facesStart + start * 2, n = Math.floor((end - start) / 3) * 3;
    need(at, n * 2, 'face data');
    const raw = new Uint16Array(n);
    for (let i = 0; i < n; i++) raw[i] = dv.getUint16(at + i * 2, true);

    let remap = null;
    if (raw.some((v) => v >= vertexCount)) {
      // Exported by the old plugin with loose vertices, which take up vertex IDs without being stored.
      // When the IDs used number exactly the vertices stored, renumber them in order (as the Python does).
      const used = [...new Set(raw)].sort((a, b) => a - b);
      if (used.length !== vertexCount) throw new InvalidModel('Invalid vertex referenced by face');
      remap = new Map(used.map((v, i) => [v, i]));
    }
    const faces = [];
    for (let i = 0; i < n; i += 3) {
      const a = raw[i], b = raw[i + 1], c = raw[i + 2];
      if (a === b || a === c || b === c) continue;
      faces.push(...(remap ? [remap.get(a), remap.get(b), remap.get(c)] : [a, b, c]));
    }
    return Uint16Array.from(faces);
  }

  const geometries = new Map(); // record address -> { vertices, faces, boundingBox }
  {
    const array = structArray(s1, [16, 20]);
    for (const r of array.records) {
      const vertexSetOffset = u32(r + 4), faceDescriptorOffset = u32(r + 8);
      const miscOffset = array.recordSize >= 20 ? u32(r + 16) : 0;
      const vertexSets = structArray(s1 + vertexSetOffset, [4]);
      if (vertexSets.records.length !== 1) throw new InvalidModel('Number of geometry vertex sets != 1');
      const vertices = parseVertices(structArray(s1 + u32(vertexSets.records[0]), [20], [8]));
      const descriptors = structArray(s1 + faceDescriptorOffset, null);
      if (descriptors.records.length !== 1) throw new InvalidModel('Unexpected number of face header array entries');
      const faces = parseFaces(descriptors.records[0], descriptors.recordSize, vertices.count);
      let boundingBox = null;
      if (miscOffset) {
        const misc = structArray(s1 + miscOffset, [4]);
        if (misc.records.length >= 1) {
          const at = misc.base + u32(misc.records[0]);
          need(at, 32, 'bounding box');
          const v = (o) => ({ x: dv.getFloat32(at + o, true), y: dv.getFloat32(at + o + 4, true), z: dv.getFloat32(at + o + 8, true) });
          boundingBox = { min: v(0), max: v(16) };
        }
        if (misc.records.length >= 2) {
          const at = misc.base + u32(misc.records[1]);
          if (u32(at) !== 1 || u32(at + 4) || u32(at + 8) || u32(at + 12)) warnings.push('material combinations, which are not supported');
        }
      }
      geometries.set(r, { vertices, faces, boundingBox });
    }
  }

  // ------------------------------------------------------------ annotations (section 2)
  const annotationStrings = new Map(); // record address -> string
  {
    const array = structArray(sections[2], [8]);
    for (const r of array.records) annotationStrings.set(r, readString(array.base + u32(r)));
  }

  // ------------------------------------------------------------ meshes (section 4)
  const MESH_NAME = 128, EXTENSION_HEADER = 129;
  const meshes = [];
  {
    const array = structArray(sections[4], [20, 24]);
    const at = (relative) => array.base + relative;
    for (const r of array.records) {
      const geometryAddress = at(i32(r)), boneGroupOffset = u32(r + 4), annotationsOffset = u32(r + 8);
      const materialAddress = at(i32(r + 12)), section10 = i32(r + 16);

      let boneGroup = null;
      if (boneGroupOffset) {
        const groups = structArray(at(boneGroupOffset), [4]);
        if (groups.records.length > 1) throw new InvalidModel('Unexpected mesh bone group format');
        if (groups.records.length === 1) {
          boneGroup = boneGroups.get(at(i32(groups.records[0])));
          if (!boneGroup) throw new InvalidModel('Invalid bone group referenced by mesh');
        }
      }

      let name = null;
      const annotations = [];
      if (annotationsOffset) {
        const list = structArray(at(annotationsOffset), [16]);
        for (const a of list.records) {
          const text = annotationStrings.get(at(i32(a)));
          if (text == null) continue;
          const type = i32(a + 12);
          if (type === MESH_NAME) name = text;
          else if (type === EXTENSION_HEADER) annotations.push(text);
        }
      }
      if (section10) warnings.push('locator meshes, which are not supported');

      const geometry = geometries.get(geometryAddress);
      if (!geometry) throw new InvalidModel('Invalid geometry referenced by mesh');
      const materialName = materials.get(materialAddress);
      if (materialName == null) throw new InvalidModel('Invalid material referenced by mesh');

      meshes.push({
        index: meshes.length, name, materialName, materialInstance: null, annotations,
        vertices: skinned(geometry.vertices, boneGroup), faces: geometry.faces, boundingBox: geometry.boundingBox,
        boneGroup, alphaFlags: 0, shadowFlags: 0, extensionHeaders: new Set(), ccw: true,
      });
    }
  }

  // A group per mesh, named after the mesh (or its material), so each can be hidden in the model tree.
  const meshGroups = meshes.map((mesh) => {
    const group = { name: mesh.name || mesh.materialName, visible: true, parent: null, children: [], meshes: [mesh], boundingBox: mesh.boundingBox, extensionHeaders: new Set() };
    mesh.group = group;
    return group;
  });

  return {
    format: 'model', version, bones, materialNames: [...new Set(materials.values())], materialInstances: [],
    meshes, meshGroups, extensionHeaders: null, warnings: [...new Set(warnings)],
  };
}

/**
 * Per-mesh skinning: the geometry's group-local bone slots mapped to the mesh's bone group, as
 * skinWeights / skinBones like parseFmdl gives. (A geometry could in theory be shared by two meshes.)
 */
function skinned(v, boneGroup) {
  const { boneSlots, boneWeights, ...out } = v;
  if (!boneSlots || !boneGroup) return out;
  out.skinWeights = new Float32Array(v.count * 4);
  out.skinBones = new Array(v.count * 4).fill(null);
  for (let i = 0; i < v.count * 4; i++) {
    if (boneWeights[i] > 0 && boneSlots[i] < boneGroup.bones.length) {
      out.skinWeights[i] = boneWeights[i];
      out.skinBones[i] = boneGroup.bones[boneSlots[i]];
    }
  }
  return out;
}

/** Where a bone sits at bind: the translation of the inverse of the file's (inverse bind) 3×4 matrix. */
function bindPosition(m) {
  const [a, b, c, tx, d, e, f, ty, g, h, i, tz] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (!det) return { x: 0, y: 0, z: 0, w: 1 };
  // inverse(R) · -t
  const inv = [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ];
  return {
    x: -(inv[0] * tx + inv[1] * ty + inv[2] * tz),
    y: -(inv[3] * tx + inv[4] * ty + inv[5] * tz),
    z: -(inv[6] * tx + inv[7] * ty + inv[8] * tz),
    w: 1,
  };
}
