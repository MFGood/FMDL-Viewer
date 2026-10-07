// texture-files.js — reads mip 0 of PES textures: .ftex (port of Ftex.py from pes-fmdl-blender) and .dds.
// Both return { width, height, format, data }, where format is a DXT/BC name or 'RGBA'; decode it with
// decodeToRGBA from block-decode.js.


async function inflate(bytes) {
  const ds = new DecompressionStream('deflate'); // zlib-wrapped, matching Python's zlib.decompress
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Port of Ftex.ftexToDds, but returns { width, height, format, data } for mip 0 instead of writing a DDS. */
export async function readFtex(buffer) {
  const dv = new DataView(buffer), u8 = new Uint8Array(buffer);
  if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'FTEX') throw new Error('Not an FTEX file');
  const version = dv.getFloat32(4, true);
  const pixelFormat = dv.getUint16(8, true), width = dv.getUint16(10, true), height = dv.getUint16(12, true);
  const mipCount = dv.getUint8(16), ftexsCount = dv.getUint8(32);
  if (version < 2.025 || version > 2.045) throw new Error(`Unsupported FTEX version ${version.toFixed(3)}`);
  if (ftexsCount > 0) throw new Error('FTEX references external .ftexs files, which are not supported');
  if (mipCount === 0) throw new Error('FTEX has no mipmaps');
  // First mipmap header (64-byte file header, then 16-byte mip headers)
  const offset = dv.getUint32(64, true), uncompressedSize = dv.getUint32(68, true), compressedSize = dv.getUint32(72, true);
  const chunkCount = dv.getUint16(78, true);
  let data;
  if (chunkCount === 0) {
    data = compressedSize === 0 ? u8.slice(offset, offset + uncompressedSize) : await inflate(u8.subarray(offset, offset + compressedSize));
  } else {
    const parts = [];
    for (let i = 0; i < chunkCount; i++) {
      const hp = offset + i * 8;
      const cSize = dv.getUint16(hp, true);
      let cOff = dv.getUint32(hp + 4, true);
      const isCompressed = (cOff & 0x80000000) === 0;
      cOff &= 0x7fffffff;
      const chunk = u8.subarray(offset + cOff, offset + cOff + cSize);
      parts.push(isCompressed ? await inflate(chunk) : chunk);
    }
    data = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let w = 0; for (const p of parts) { data.set(p, w); w += p.length; }
  }
  const map = { 0: 'RGBA8', 1: 'R8', 2: 'DXT1', 3: 'DXT3', 4: 'DXT5', 8: 'BC4', 9: 'BC5', 11: 'BC7' };
  const format = map[pixelFormat];
  if (!format) throw new Error(`FTEX pixel format ${pixelFormat} is not supported by this viewer`);
  return { width, height, format, data };
}

/** Read mip 0 of a .dds file. */
export function readDds(buffer) {
  const dv = new DataView(buffer), u8 = new Uint8Array(buffer);
  if (dv.getUint32(0, true) !== 0x20534444) throw new Error('Not a DDS file');
  const height = dv.getUint32(12, true), width = dv.getUint32(16, true);
  const pfFlags = dv.getUint32(80, true);
  const fourCC = String.fromCharCode(u8[84], u8[85], u8[86], u8[87]);
  let start = 128, format;
  if (pfFlags & 0x4) {
    if (fourCC === 'DX10') {
      const dxgi = dv.getUint32(128, true); start = 148;
      format = { 28: 'RGBA8', 29: 'RGBA8', 87: 'BGRA8', 61: 'R8', 71: 'DXT1', 72: 'DXT1', 74: 'DXT3', 75: 'DXT3', 77: 'DXT5', 78: 'DXT5', 80: 'BC4', 83: 'BC5', 98: 'BC7', 99: 'BC7' }[dxgi];
      if (!format) throw new Error(`DDS DXGI format ${dxgi} is not supported by this viewer`);
    } else {
      format = { DXT1: 'DXT1', DXT2: 'DXT3', DXT3: 'DXT3', DXT4: 'DXT5', DXT5: 'DXT5', ATI1: 'BC4', BC4U: 'BC4', ATI2: 'BC5', BC5U: 'BC5' }[fourCC];
      if (!format) throw new Error(`DDS FourCC ${fourCC} is not supported by this viewer`);
    }
  } else {
    const bits = dv.getUint32(88, true), rMask = dv.getUint32(92, true);
    if (bits === 32) format = rMask === 0x00ff0000 ? 'BGRA8' : 'RGBA8';
    else if (bits === 24) format = 'BGR8';
    else throw new Error(`Uncompressed ${bits}-bit DDS is not supported by this viewer`);
  }
  return { width, height, format, data: u8.subarray(start) };
}
