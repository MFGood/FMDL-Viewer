// block-decode.js — software decoding of block-compressed textures (DXT1/3/5, BC4, BC5, BC7) to RGBA8,
// so textures show without GPU support for those formats.

function decode565(c, out, o) {
  out[o] = ((c >> 11) & 31) * 255 / 31 | 0; out[o + 1] = ((c >> 5) & 63) * 255 / 63 | 0; out[o + 2] = (c & 31) * 255 / 31 | 0; out[o + 3] = 255;
}
function bc4Block(src, s, out, w, x0, y0, h, ch, stride) {
  const a0 = src[s], a1 = src[s + 1], pal = [a0, a1];
  if (a0 > a1) for (let i = 1; i < 7; i++) pal.push(((7 - i) * a0 + i * a1) / 7 | 0);
  else { for (let i = 1; i < 5; i++) pal.push(((5 - i) * a0 + i * a1) / 5 | 0); pal.push(0, 255); }
  let bits = 0n; for (let i = 0; i < 6; i++) bits |= BigInt(src[s + 2 + i]) << BigInt(8 * i);
  for (let i = 0; i < 16; i++) {
    const x = x0 + (i & 3), y = y0 + (i >> 2);
    if (x < w && y < h) out[(y * w + x) * stride + ch] = pal[Number((bits >> BigInt(3 * i)) & 7n)];
  }
}

/** Decode a texture to RGBA8 (top row first). Done in software so it works without S3TC GPU support. */
export function decodeToRGBA({ width: w, height: h, format, data }) {
  const out = new Uint8Array(w * h * 4);
  if (format === 'RGBA8' || format === 'BGRA8' || format === 'BGR8' || format === 'R8') {
    const n = format === 'BGR8' ? 3 : format === 'R8' ? 1 : 4;
    for (let i = 0; i < w * h; i++) {
      const s = i * n, o = i * 4;
      if (format === 'R8') { out[o] = out[o + 1] = out[o + 2] = data[s]; out[o + 3] = 255; }
      else if (format === 'RGBA8') { out[o] = data[s]; out[o + 1] = data[s + 1]; out[o + 2] = data[s + 2]; out[o + 3] = data[s + 3]; }
      else { out[o] = data[s + 2]; out[o + 1] = data[s + 1]; out[o + 2] = data[s]; out[o + 3] = n === 4 ? data[s + 3] : 255; }
    }
    return out;
  }
  if (format === 'BC7') return decodeBC7(w, h, data, out);
  const bw = Math.max(1, (w + 3) >> 2), bh = Math.max(1, (h + 3) >> 2);
  const bsize = format === 'DXT1' || format === 'BC4' ? 8 : 16;
  const pal = new Uint8Array(16);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const s = (by * bw + bx) * bsize;
    if (s + bsize > data.length) return out;
    if (format === 'BC4' || format === 'BC5') {
      bc4Block(data, s, out, w, bx * 4, by * 4, h, 0, 4);
      if (format === 'BC5') bc4Block(data, s + 8, out, w, bx * 4, by * 4, h, 1, 4);
      for (let i = 0; i < 16; i++) {
        const x = bx * 4 + (i & 3), y = by * 4 + (i >> 2);
        if (x < w && y < h) { const o = (y * w + x) * 4; if (format === 'BC4') out[o + 1] = out[o + 2] = out[o]; else out[o + 2] = 255; out[o + 3] = 255; }
      }
      continue;
    }
    const cs = format === 'DXT1' ? s : s + 8;
    const c0 = data[cs] | (data[cs + 1] << 8), c1 = data[cs + 2] | (data[cs + 3] << 8);
    decode565(c0, pal, 0); decode565(c1, pal, 4);
    if (c0 > c1 || format !== 'DXT1') {
      for (let k = 0; k < 3; k++) { pal[8 + k] = (2 * pal[k] + pal[4 + k]) / 3 | 0; pal[12 + k] = (pal[k] + 2 * pal[4 + k]) / 3 | 0; }
      pal[11] = pal[15] = 255;
    } else {
      for (let k = 0; k < 3; k++) pal[8 + k] = (pal[k] + pal[4 + k]) >> 1;
      pal[11] = 255; pal[12] = pal[13] = pal[14] = pal[15] = 0;
    }
    const idx = data[cs + 4] | (data[cs + 5] << 8) | (data[cs + 6] << 16) | (data[cs + 7] << 24);
    for (let i = 0; i < 16; i++) {
      const x = bx * 4 + (i & 3), y = by * 4 + (i >> 2);
      if (x >= w || y >= h) continue;
      const o = (y * w + x) * 4, p = ((idx >>> (2 * i)) & 3) * 4;
      out[o] = pal[p]; out[o + 1] = pal[p + 1]; out[o + 2] = pal[p + 2]; out[o + 3] = pal[p + 3];
      if (format === 'DXT3') { const a = (data[s + (i >> 1)] >> ((i & 1) * 4)) & 15; out[o + 3] = a * 17; }
    }
    if (format === 'DXT5') bc4Block(data, s, out, w, bx * 4, by * 4, h, 3, 4);
  }
  return out;
}

/* ---------------- BC7 (DXGI_FORMAT_BC7_UNORM / _SRGB) ---------------- */

// Per the D3D11 BC7 specification: 8 modes, 1–3 subsets, partition and anchor tables below.
const BC7_MODES = [ // subsets, partition bits, rotation bits, index-selection bit, color bits, alpha bits, endpoint p-bits, shared p-bits, index bits, index2 bits
  [3, 4, 0, 0, 4, 0, 1, 0, 3, 0], [2, 6, 0, 0, 6, 0, 0, 1, 3, 0], [3, 6, 0, 0, 5, 0, 0, 0, 2, 0], [2, 6, 0, 0, 7, 0, 1, 0, 2, 0],
  [1, 0, 2, 1, 5, 6, 0, 0, 2, 3], [1, 0, 2, 0, 7, 8, 0, 0, 2, 2], [1, 0, 0, 0, 7, 7, 1, 0, 4, 0], [2, 6, 0, 0, 5, 5, 1, 0, 2, 0],
];
const BC7_P2 = ['0011001100110011','0001000100010001','0111011101110111','0001001100110111','0000000100010011','0011011101111111','0001001101111111','0000000100110111','0000000000010011','0011011111111111','0000000101111111','0000000000010111','0001011111111111','0000000011111111','0000111111111111','0000000000001111','0000100011101111','0111000100000000','0000000010001110','0111001100010000','0011000100000000','0000100011001110','0000000010001100','0111001100110001','0011000100010000','0000100010001100','0110011001100110','0011011001101100','0001011111101000','0000111111110000','0111000110001110','0011100110011100','0101010101010101','0000111100001111','0101101001011010','0011001111001100','0011110000111100','0101010110101010','0110100101101001','0101101010100101','0111001111001110','0001001111001000','0011001001001100','0011101111011100','0110100110010110','0011110011000011','0110011010011001','0000011001100000','0100111001000000','0010011100100000','0000001001110010','0000010011100100','0110110010010011','0011011011001001','0110001110011100','0011100111000110','0110110011001001','0110001100111001','0111111010000001','0001100011100111','0000111100110011','0011001111110000','0010001011101110','0100010001110111'];
const BC7_P3 = ['0011001102212222','0001001122112221','0000200122112211','0222002200110111','0000000011221122','0011001100220022','0022002211111111','0011001122112211','0000000011112222','0000111111112222','0000111122222222','0012001200120012','0112011201120112','0122012201220122','0011011211221222','0011200122002220','0001001101121122','0111001120012200','0000112211221122','0022002200221111','0111011102220222','0001000122212221','0000001101220122','0000110022102210','0122012200110000','0012001211222222','0110122112210110','0000011012211221','0022110211020022','0110011020022222','0011012201220011','0000200022112221','0000000211221222','0222002200120011','0011001200220222','0120012001200120','0000111122220000','0120120120120120','0120201212010120','0011220011220011','0011112222000011','0101010122222222','0000000021212121','0022112200221122','0022001100220011','0220122102201221','0101222222220101','0000212121212121','0101010101012222','0222011102220111','0002111200021112','0000211221122112','0222011101110222','0002111211120002','0110011001102222','0000000021122112','0110011022222222','0022001100110022','0022112211220022','0000000000002112','0002000100020001','0222122202221222','0101222222222222','0111201122012220'];
const BC7_A2 = [15,15,15,15,15,15,15,15, 15,15,15,15,15,15,15,15, 15,2,8,2,2,8,8,15, 2,8,2,2,8,8,2,2, 15,15,6,8,2,8,15,15, 2,8,2,2,2,15,15,6, 6,2,6,8,15,15,2,2, 15,15,15,15,15,2,2,15];
const BC7_A3a = [3,3,15,15,8,3,15,15, 8,8,6,6,6,5,3,3, 3,3,8,15,3,3,6,10, 5,8,8,6,8,5,15,15, 8,15,3,5,6,10,8,15, 15,3,15,5,15,15,15,15, 3,15,5,5,5,8,5,10, 5,10,8,13,15,12,3,3];
const BC7_A3b = [15,8,8,3,15,15,3,8, 15,15,15,15,15,15,15,8, 15,8,15,3,15,8,15,8, 3,15,6,10,15,15,10,8, 15,3,15,10,10,8,9,10, 6,15,8,15,3,6,6,8, 15,3,15,15,15,15,15,15, 15,15,15,15,3,15,15,8];
const BC7_W = { 2: [0, 21, 43, 64], 3: [0, 9, 18, 27, 37, 46, 55, 64], 4: [0, 4, 9, 13, 17, 21, 26, 30, 34, 38, 43, 47, 51, 55, 60, 64] };
const BC7_P2N = BC7_P2.map((s) => [...s].map(Number)), BC7_P3N = BC7_P3.map((s) => [...s].map(Number));

function decodeBC7(w, h, data, out) {
  const bw = Math.max(1, (w + 3) >> 2), bh = Math.max(1, (h + 3) >> 2);
  const ep = new Uint8Array(6 * 4); // up to 3 subsets × 2 endpoints × RGBA
  const px = new Uint8Array(64);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const s = (by * bw + bx) * 16;
    if (s + 16 > data.length) return out;
    let pos = 0;
    const bits = (n) => { let v = 0; for (let i = 0; i < n; i++, pos++) v |= ((data[s + (pos >> 3)] >> (pos & 7)) & 1) << i; return v; };
    let mode = 0;
    while (mode < 8 && !bits(1)) mode++;
    if (mode === 8) { px.fill(0); writeBlock(); continue; } // reserved mode: transparent black
    const [ns, pb, rb, isb, cb, ab, epb, spb, ib, ib2] = BC7_MODES[mode];
    const part = bits(pb), rot = bits(rb), sel = bits(isb);
    const ne = ns * 2;
    const raw = [[], [], [], []];
    for (let c = 0; c < 3; c++) for (let e = 0; e < ne; e++) raw[c][e] = bits(cb);
    if (ab) for (let e = 0; e < ne; e++) raw[3][e] = bits(ab);
    const pbits = [];
    if (epb) for (let e = 0; e < ne; e++) pbits[e] = bits(1);
    if (spb) for (let k = 0; k < ns; k++) { const p = bits(1); pbits[k * 2] = p; pbits[k * 2 + 1] = p; }
    for (let e = 0; e < ne; e++) for (let c = 0; c < 4; c++) {
      if (c === 3 && !ab) { ep[e * 4 + 3] = 255; continue; }
      let v = raw[c][e], n = c === 3 ? ab : cb;
      if (epb || spb) { v = (v << 1) | pbits[e]; n++; }
      v <<= 8 - n; v |= v >> n;
      ep[e * 4 + c] = v;
    }
    const subsetOf = ns === 1 ? null : ns === 2 ? BC7_P2N[part] : BC7_P3N[part];
    const isAnchor = (i) => i === 0 || (ns === 2 && i === BC7_A2[part]) || (ns === 3 && (i === BC7_A3a[part] || i === BC7_A3b[part]));
    const idx1 = new Uint8Array(16), idx2 = new Uint8Array(16);
    for (let i = 0; i < 16; i++) idx1[i] = bits(isAnchor(i) ? ib - 1 : ib);
    if (ib2) for (let i = 0; i < 16; i++) idx2[i] = bits(i === 0 ? ib2 - 1 : ib2);
    const interp = (a, b, wt) => ((64 - wt) * a + wt * b + 32) >> 6;
    for (let i = 0; i < 16; i++) {
      const sub = subsetOf ? subsetOf[i] : 0, e0 = sub * 8, e1 = e0 + 4;
      let cIdx = idx1[i], cBits = ib, aIdx = idx1[i], aBits = ib;
      if (ib2) { if (sel) { cIdx = idx2[i]; cBits = ib2; } else { aIdx = idx2[i]; aBits = ib2; } }
      const cw = BC7_W[cBits][cIdx], aw = BC7_W[aBits][aIdx];
      let r = interp(ep[e0], ep[e1], cw), g = interp(ep[e0 + 1], ep[e1 + 1], cw), b = interp(ep[e0 + 2], ep[e1 + 2], cw), a = interp(ep[e0 + 3], ep[e1 + 3], aw);
      if (rot === 1) [r, a] = [a, r]; else if (rot === 2) [g, a] = [a, g]; else if (rot === 3) [b, a] = [a, b];
      px[i * 4] = r; px[i * 4 + 1] = g; px[i * 4 + 2] = b; px[i * 4 + 3] = a;
    }
    writeBlock();
    function writeBlock() {
      for (let i = 0; i < 16; i++) {
        const x = bx * 4 + (i & 3), y = by * 4 + (i >> 2);
        if (x < w && y < h) out.set(px.subarray(i * 4, i * 4 + 4), (y * w + x) * 4);
      }
    }
  }
  return out;
}
