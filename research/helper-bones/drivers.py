"""Runs PES 2016's helper-bone driver code in an emulator, to read off the formulas in js/animation/helper-bones.js.

    python drivers.py ENTRY [read|extra]      sweep one joint's angles and print the helper's change
    python drivers.py ENTRY toe                sweep the toe tip's height (dsk_toe)

ENTRY is the row in the game's driver table (printed by `python drivers.py table`). It uses the PE reader and
emulator from ../face-sliders/scripts (PES2016.orig.exe, Unicorn, Capstone).

The game's update for one driver is 0x1740a90 (thiscall, the driver in ecx), called by 0x174c290 with the
skeleton, the joint cache (&manager+0x74) and the manager's +0x20 (sk_neck's scale, from the body shape),
+0x30/+0x40 (shoulder-height turns), +0x50/+0x60 (shoulder-height shifts). Layouts used here:
  skeleton +0x3c: bones, 0x30 each {scale, rotation (x, y, z, w), position}; +0x48: extra scale per bone
  joint cache: 0x40 each {u16 bone, u16 parent, bind rotation under the parent at +4, angles out at +0x14,
               relative rotation out at +0x20, position out at +0x30, dirty byte at +0x3c}; getter 0x17406c0
  driver: +0x20 R0, +0x30 T0, +0x42 source bone, +0x46 joint read, +0x70 / +0x72 extra joints, +0x74 table row
The driver's own result is the scale / rotation / offset passed to 0x16a4480 (it builds T·R·S), which is what
this captures; the composition with the source after that isn't reproduced here.
"""
import math
import os
import struct
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'face-sliders', 'scripts'))
from emu import mkemu, HOOKS  # noqa: E402
from pe import D, v2f, cstr  # noqa: E402
from unicorn import UC_HOOK_CODE  # noqa: E402
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_ECX  # noqa: E402

TABLE = 0x26050c8
mu = mkemu()

# The CRT's x87 math (_CIasin, _CIatan, …) is imported; replace each import thunk with the x87 instructions.
STUB = 0x30000000
mu.mem_map(STUB, 0x1000)
floor = '83EC04D93C24668B04246625FFF3660D00046689442402D96C2402DD442408D9FCD92C2483C404C3'
for i, (thunk, code) in enumerate({
    0xfbeac6: 'D9C0D8C8D9E8DEE1D9FAD9C9D9F3C3',  # acos
    0xfbeacc: 'D9C0D8C8D9E8DEE1D9FAD9F3C3',  # asin
    0xfbead2: 'D9E8D9F3C3',  # atan
    0xfbead8: 'D9F3C3',  # atan2
    0xfbeade: floor.replace('660D0004', '660D0008'),  # ceil
    0xfbeae4: 'D9FFC3',  # cos
    0xfbeaf0: floor,
    0xfbeb02: 'D9FEC3',  # sin
    0xfbeb08: 'D9FAC3',  # sqrt
}.items()):
    mu.mem_write(STUB + 0x40 * i, bytes.fromhex(code))
    mu.mem_write(thunk, b'\xe9' + struct.pack('<i', STUB + 0x40 * i - (thunk + 5)))

H = 0x20000000


def wf(a, vals): mu.mem_write(a, struct.pack('<%df' % len(vals), *vals))
def rf(a, n): return list(struct.unpack('<%df' % n, mu.mem_read(a, 4 * n)))


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]


def euler_q(x, y, z):  # q = Rz·Ry·Rx
    ax = lambda i, a: [math.sin(a / 2) if j == i else 0 for j in range(3)] + [math.cos(a / 2)]
    return qmul(qmul(ax(2, z), ax(1, y)), ax(0, x))


def q_euler(q):
    x, y, z, w = q
    return [math.degrees(math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))),
            math.degrees(math.asin(max(-1, min(1, 2 * (w * y - z * x))))),
            math.degrees(math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)))]


def row(i):
    return struct.unpack_from('<III', D, v2f(TABLE + 12 * i))


def run(entry, read=(0, 0, 0), extra=(0, 0, 0), readpos=(0, 0, 0), R0=(0, 0, 0, 1), T0=(0, 0, 0), neck=(1, 1, 1, 1)):
    """The driver's (scale, rotation, offset) for joint angles `read` / `extra` (radians) and the read joint's position."""
    skel, bones, scl, cache, cvec, drv, misc = (H + 0x1000 * k for k in range(7))
    mu.mem_write(H, b'\0' * 0x8000)
    mu.mem_write(skel + 0x3c, struct.pack('<I', bones))
    mu.mem_write(skel + 0x48, struct.pack('<I', scl))
    for i in range(8):  # 0 source, 1 read, 2 its parent, 3 extra, 4 its parent
        wf(bones + 0x30 * i, [1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1])
        wf(scl + 16 * i, [1, 1, 1, 1])
    wf(bones + 0x30 + 0x10, euler_q(*read) + list(readpos) + [1])
    wf(bones + 0x90 + 0x10, euler_q(*extra))
    for ci, (b, p) in enumerate([(1, 2), (3, 4)]):
        mu.mem_write(cache + 0x40 * ci, struct.pack('<hh', b, p))
        wf(cache + 0x40 * ci + 4, [0, 0, 0, 1])
        mu.mem_write(cache + 0x40 * ci + 0x3c, b'\1')
    mu.mem_write(cvec, struct.pack('<II', cache, cache + 0x80))
    wf(drv + 0x10, [1, 1, 1, 1])
    wf(drv + 0x20, list(R0) + list(T0) + [0])
    mu.mem_write(drv + 0x40, struct.pack('<hhhh', 5, 0, -1, 0))
    mu.mem_write(drv + 0x70, struct.pack('<hhI', 1, -1, row(entry)[2]))
    wf(misc, list(neck) + [0, 0, 0, 1, 0, 0, 0, 1] + [0] * 20)
    args = [skel, cvec, misc, misc + 0x10, misc + 0x20, misc + 0x30, misc + 0x40, misc + 0x50, misc + 0x60]
    esp = 0x10100000 - 4 * (len(args) + 1)
    mu.mem_write(esp, struct.pack('<%dI' % (len(args) + 1), 0xdead0000, *args))
    mu.reg_write(UC_X86_REG_ESP, esp)
    mu.reg_write(UC_X86_REG_ECX, drv)
    if not any(r[0] == 0xdead0000 for r in mu.mem_regions()):
        mu.mem_map(0xdead0000, 0x1000)
    got = []

    def code(m, addr, size, user):
        if addr == 0x16a4480:
            ret, s, r, t = struct.unpack('<IIII', m.mem_read(m.reg_read(UC_X86_REG_ESP), 16))
            got.append((rf(s, 3), rf(r, 4), rf(t, 3)))
        elif addr == 0xdead0000:
            m.emu_stop()
        elif addr in HOOKS:
            HOOKS[addr](m)
    h = mu.hook_add(UC_HOOK_CODE, code)
    mu.emu_start(0x1740a90, 0xdead0001, count=5 * 10**6)
    mu.hook_del(h)
    return got[-1]


def show(entry, what):
    if what == 'toe':
        for y in (0.01, 0, -0.01, -0.03, -0.06, -0.1):
            S, R, T = run(entry, readpos=(0, y, 0))
            print(f'tip height {y:6}  R={[round(v, 3) for v in q_euler(R)]}')
        return
    for ax in range(3):
        print(f'-- {what} angle {"xyz"[ax]}')
        for d in (-150, -90, -60, -30, -10, 0, 10, 30, 60, 90, 150):
            a = [0, 0, 0]
            a[ax] = math.radians(d)
            S, R, T = run(entry, **{what: tuple(a)})
            print(f'{d:5}  S={[round(v, 4) for v in S]}  R={[round(v, 3) for v in q_euler(R)]}  T(cm)={[round(v * 100, 3) for v in T]}')


if __name__ == '__main__':
    if sys.argv[1] == 'table':
        for i in range(52):
            target, source, params = row(i)
            p = v2f(params) if params else None
            print(i, cstr(target), cstr(source), *(('read', cstr(struct.unpack_from('<I', D, p)[0]), 'type', hex(struct.unpack_from('<I', D, p + 4)[0])) if p else ()))
    else:
        show(int(sys.argv[1]), sys.argv[2] if len(sys.argv) > 2 else 'read')
