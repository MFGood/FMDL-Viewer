"""Build assets/animations/hands.json from a PES 2021 install: the game's hand poses and, for each clip in
assets/animations/clips.json, which pose each hand holds over which frames.

    python -I build_hands.py "C:/Games/Pro Evolution Soccer 2021" ../../assets/animations

Read only; nothing in the game folder is changed. What it reads:
  dt13_all.cpk  common/anime/FoxAnim/Hand/Animations/*.gani    162 one-frame left-hand poses
                common/anime/FHSequence/bin/Handlbase.bin      12-byte records: motion id, frames, pose
                common/anime/FHSequence/bin/Handrbase.bin      (same for the right hand)
                common/anime/FHSequence/bin/Sequenceinfo.bin   motion id -> motion number
  dt12_g4.cpk   common/demo/anime/FoxAnim/FixDemo/Animations   the celebrations' file names
  PES2021.exe   name tables: the 4161 gameplay motion files (a motion id >= 0 is an index into it) and the
                face and hand motion names (a record's pose is an index into the hand part)

Record layout (PES 2020/2021) from animation_tool.py. Celebrations have negative ids; their motion numbers
index the FixDemo celebration names (without _eyes_target) sorted, from number 85. That matches the record
ends to the clips' lengths for ids -22..-117 exactly; -3..-21 fit the pose names (Ozil_m1, bale_hearts) but
end early or late; past -117 it doesn't fit, so only -3..-117 are used.
"""
import json, math, mmap, os, re, struct, sys

# ---------------------------------------------------------------- CRI CPK (read only)

def utf(buf):
    if buf[:4] != b'@UTF':
        out, m = bytearray(len(buf)), 0x655f  # CRI's table mask
        for i, c in enumerate(buf):
            out[i] = c ^ (m & 0xff); m = (m * 0x4115) & 0xffffffff
        buf = bytes(out)
    rows_off, str_off, data_off, _, ncols, rowlen, nrows = struct.unpack_from('>xxHIIIHHI', buf, 8)
    s = lambda o: buf[8 + str_off + o: buf.index(b'\0', 8 + str_off + o)].decode('utf-8', 'replace')
    def read(t, p):
        fmt = {0: '>B', 1: '>b', 2: '>H', 3: '>h', 4: '>I', 5: '>i', 6: '>Q', 7: '>q', 8: '>f'}.get(t)
        if fmt: return struct.unpack_from(fmt, buf, p)[0], struct.calcsize(fmt)
        if t == 0xA: return s(struct.unpack_from('>I', buf, p)[0]), 4
        o, n = struct.unpack_from('>II', buf, p); return buf[8 + data_off + o: 8 + data_off + o + n], 8
    cols, p = [], 32
    for _ in range(ncols):
        flags, name = buf[p], s(struct.unpack_from('>I', buf, p + 1)[0]); p += 5
        const = None
        if flags & 0xF0 == 0x30: const, n = read(flags & 0x0F, p); p += n
        cols.append((name, flags & 0xF0, flags & 0x0F, const))
    rows = []
    for r in range(nrows):
        p, row = 8 + rows_off + r * rowlen, {}
        for name, storage, t, const in cols:
            if storage == 0x50: row[name], n = read(t, p); p += n
            else: row[name] = const
        rows.append(row)
    return rows

def cpk_files(path, pattern):
    """{name: bytes} of the files in a cpk whose path matches `pattern` (CRILAYLA files decompressed)."""
    rx, out = re.compile(pattern), {}
    with open(path, 'rb') as f:
        def packet(off):
            f.seek(off + 8); size = struct.unpack('<Q', f.read(8))[0]; return f.read(size)
        header = utf(packet(0))[0]
        base = min(header['TocOffset'], header.get('ContentOffset') or header['TocOffset'])
        for r in utf(packet(header['TocOffset'])):
            name = (r['DirName'] + '/' if r.get('DirName') else '') + r['FileName']
            if not rx.search(name): continue
            f.seek(r['FileOffset'] + base); data = f.read(r['FileSize'])
            if r['FileSize'] != (r.get('ExtractSize') or r['FileSize']): data = crilayla(data)
            out[name] = data
    return out

def crilayla(d):
    usize, hsize = struct.unpack_from('<II', d, 8)
    comp, body, pos, w = d[16:16 + hsize], bytearray(usize), hsize - 1, usize - 1
    state = [0, 0]  # bit buffer, bits left
    def bits(n):
        nonlocal pos
        v = 0
        for _ in range(n):
            if not state[1]: state[0] = comp[pos]; pos -= 1; state[1] = 8
            state[1] -= 1; v = (v << 1) | ((state[0] >> state[1]) & 1)
        return v
    while w >= 0:
        if bits(1):
            back, length = bits(13) + 3, 3
            for size in (2, 3, 5, 8):
                n = bits(size); length += n
                if n != (1 << size) - 1: break
            else:
                while True:
                    n = bits(8); length += n
                    if n != 255: break
            for _ in range(length):
                body[w] = body[w + back]; w -= 1
                if w < 0: break
        else:
            body[w] = bits(8); w -= 1
    return d[16 + hsize:16 + hsize + 0x100] + bytes(body)

# ---------------------------------------------------------------- PES2021.exe name tables

class Exe:
    def __init__(self, path):
        self.file = open(path, 'rb')
        self.m = mmap.mmap(self.file.fileno(), 0, access=mmap.ACCESS_READ)
        e = struct.unpack_from('<I', self.m, 0x3c)[0]
        count, optional = struct.unpack_from('<H', self.m, e + 6)[0], struct.unpack_from('<H', self.m, e + 20)[0]
        self.base = struct.unpack_from('<Q', self.m, e + 48)[0]
        self.sections = [struct.unpack_from('<IIII', self.m, e + 24 + optional + i * 40 + 8) for i in range(count)]
    def to_va(self, off):
        for vsize, va, rsize, raw in self.sections:
            if raw <= off < raw + rsize: return self.base + va + off - raw
    def to_off(self, v):
        for vsize, va, rsize, raw in self.sections:
            if va <= v - self.base < va + rsize: return raw + v - self.base - va
    def string_at(self, v):
        o = self.to_off(v)
        if o is None or self.m[o - 1] != 0 or not 32 < self.m[o] < 127: return None
        return self.m[o:self.m.find(b'\0', o)].decode('latin1')
    def table_with(self, name):
        """The array of string pointers that holds `name` (the longest one, if several)."""
        best, at = [], self.m.find(b'\0' + name.encode() + b'\0')
        while at >= 0:
            ref = self.m.find(struct.pack('<Q', self.to_va(at + 1)))
            while ref >= 0:
                a = ref
                while self.string_at(struct.unpack_from('<Q', self.m, a - 8)[0]): a -= 8
                names, b = [], a
                while (n := self.string_at(struct.unpack_from('<Q', self.m, b)[0])): names.append(n); b += 8
                if len(names) > len(best): best = names
                ref = self.m.find(struct.pack('<Q', self.to_va(at + 1)), ref + 1)
            at = self.m.find(b'\0' + name.encode() + b'\0', at + 1)
        return best

# ---------------------------------------------------------------- hand poses (.gani)

def hand_pose(data):
    """A one-frame hand .gani -> {bone: [x, y, z, w]} for the 19 finger joints (left hand)."""
    names = [None] * 4 + [f'skh_{f}_l' for f in ('thumb_mata', 'thumb_mcp', 'thumb_pip')] + [
        f'skh_{finger}_{joint}_l' for finger in ('index', 'middle', 'pinky', 'ring') for joint in ('mata', 'mcp', 'pip', 'dip')]
    h = struct.unpack_from('<I', data, 4)[0] + 112
    units, pose = struct.unpack_from('<i', data, h)[0], {}
    for u in range(units):
        a = h + struct.unpack_from('<I', data, h + 20 + 4 * u)[0]
        for s in range(data[a + 4]):
            e = a + 8 + 8 * s
            start, index, kind, n = e + struct.unpack_from('<I', data, e)[0], struct.unpack_from('<h', data, e + 4)[0], data[e + 6] & 15, data[e + 7]
            if kind != 0 or index >= len(names) or not names[index]: continue
            value, at = 0, start * 8
            def take(count):
                nonlocal at
                v = 0
                for i in range(count):
                    v |= ((data[at >> 3] >> (at & 7)) & 1) << i; at += 1
                return v
            top = (1 << n) - 1
            theta, px, py, sx, sy, sz = take(n) / top, take(n) / top, take(n) / top, take(1), take(1), take(1)
            pz = 1 - px - py; length = math.sqrt(px * px + py * py + pz * pz) or 1; s_ = math.sin(theta * math.pi / 2) / length
            q = [(-1 if sx else 1) * px * s_, (-1 if sy else 1) * py * s_, (-1 if sz else 1) * pz * s_, math.cos(theta * math.pi / 2)]
            pose[names[index]] = [round(c, 5) for c in q]
    return pose

# ---------------------------------------------------------------- sequences

def records(data, side):
    out = []
    for i in range(len(data) // 12):
        d0, d1, d2 = struct.unpack_from('<III', data, i * 12)
        out.append({'id': (d0 & 0x1FFF) - 216, 'start': ((d1 >> 10) & 0x3FF) - 11, 'pose': (d1 >> 20) & 0xFF,
                    'end': (d1 & 0x3FF) - (8 if side == 'l' else 9)})
    return out

def main(game, assets):
    data = os.path.join(game, 'Data')
    files = cpk_files(os.path.join(data, 'dt13_all.cpk'), r'^common/anime/(FHSequence/bin/(Handlbase|Handrbase|Sequenceinfo)\.bin|FoxAnim/Hand/Animations/.*\.gani)$')
    fixdemo = cpk_files(os.path.join(data, 'dt12_g4.cpk'), r'^common/demo/anime/FoxAnim/FixDemo/Animations/dml_goal_celebrate[^/]*\.gani$')
    exe = Exe(os.path.join(game, 'PES2021.exe'))
    motions = exe.table_with('fk_runup_cristiano')       # gameplay motion files, by motion id
    face_hand = exe.table_with('move_nigiri')            # face motions, then hand poses, then more
    hand_names = [n for n in face_hand if f'common/anime/FoxAnim/Hand/Animations/{n}.gani' in files]
    first = face_hand.index(hand_names[0])
    assert face_hand[first:first + len(hand_names)] == hand_names, 'hand poses not contiguous'
    print(len(motions), 'motions,', len(hand_names), 'hand poses')

    poses = {n: hand_pose(files[f'common/anime/FoxAnim/Hand/Animations/{n}.gani']) for n in hand_names}
    seq = files['common/anime/FHSequence/bin/Sequenceinfo.bin']
    number = {}
    for i in range(len(seq) // 8):
        d0 = struct.unpack_from('<I', seq, i * 8)[0]; number[(d0 & 0x1FFF) - 216] = (d0 >> 13) & 0xFFF
    celebrations = sorted(os.path.basename(n)[:-5] for n in fixdemo if not n.endswith('_eyes_target.gani'))
    id_of = {n: i for i, n in enumerate(motions)}
    for i in range(-117, -2):
        id_of.setdefault(celebrations[number[i] - 85], i)

    by_id = {'l': {}, 'r': {}}
    for side, name in (('l', 'Handlbase'), ('r', 'Handrbase')):
        for r in records(files[f'common/anime/FHSequence/bin/{name}.bin'], side):
            by_id[side].setdefault(r['id'], []).append([r['start'], r['end'], hand_names[r['pose']]])
    clips = {}
    listed = json.load(open(os.path.join(assets, 'clips.json')))
    for path in (p for paths in listed.values() for p in paths if p.endswith('.gani')):
        i = id_of.get(os.path.basename(path)[:-5])
        if i is None: continue
        hands = {side: sorted(by_id[side].get(i, [])) for side in 'lr'}
        if hands['l'] or hands['r']: clips[path] = hands
    out = os.path.join(assets, 'hands.json')
    with open(out, 'w', newline='\n') as f:
        json.dump({'poses': poses, 'clips': clips}, f, separators=(',', ':'))
    print('wrote', out, len(clips), 'clips with hand poses')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
