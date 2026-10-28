from emu import *
from unicorn import *
from unicorn.x86_const import *
import struct, json
FIELDS=json.load(open('fieldtable.json'))
def setbits(rec, byte, bit, bits, val):
    pos=byte*8+bit
    for i in range(bits):
        b=(pos+i)//8; o=(pos+i)%8
        if (val>>i)&1: rec[b]|=(1<<o)
        else: rec[b]&=~(1<<o)
def base_record():
    rec=bytearray(0x48)
    for f in FIELDS:
        sv=f['save']
        if isinstance(sv,list) and f['bits']<32 and f['id']>=9:
            setbits(rec, sv[0], sv[1], f['bits'], f['default'] if f['default']<=f['max'] else 0)
    # record +0xC to +0x43 as the game's default face buffer (0x19c1200)
    rec[0xc:0x44]=b''.join(struct.pack('<I',v) for v in (0x77777777,0x777777,0x77720000,0x77777777,0x77777777,0x77777777,0x77777777,0x77777777,0x177,0x77007770,0x40,0xc00011,0xc000000a,0x23012000))
    return rec
tables=open('facetables.bin','rb').read()
_MU=None
# The game's lerp 0x1ccbd30 returns 0 when its two ends are equal (the outer brows' depth below neutral).
# With this on, it returns the shared end instead: patch "fstp st0; fstp st0; fldz" to "fstp st1; jmp past fldz".
FIX_EQUAL_ENDS=True
def run_conv(rec):
    global _MU
    if _MU is None:
        _MU=mkemu(); _MU.mem_write(0x26b3000, tables)   # one emulator, reused (each mkemu maps the whole exe)
        if FIX_EQUAL_ENDS: _MU.mem_write(0x1ccbd8f, bytes([0xdd,0xd9,0xeb,0x02]))
    mu=_MU
    H=0x20000000
    recA=H; inner=H+0x1000; arr=H+0x2000; obj=H+0x3000
    mu.mem_write(recA, bytes(rec[0xc:0xc+0x38]))   # 0x19c12c0 hands the converter the 0x38 bytes from record +0xC
    mu.mem_write(arr, b'\0'*(76*8))
    mu.mem_write(inner, struct.pack('<7I', 0x22baed4, arr, 76, 0, struct.unpack('<I',struct.pack('<f',1.0))[0], 0, 0))
    mu.mem_write(obj, struct.pack('<3I', 0x22baedc, 0, inner))
    bad=[]
    def unm(mu, access, addr, size, value, u): bad.append((hex(addr), hex(mu.reg_read(UC_X86_REG_EIP)))); return False
    hk=mu.hook_add(UC_HOOK_MEM_UNMAPPED, unm)
    try: run(mu, 0x1ccc210, (obj, recA), maxi=5_000_000)
    except Exception as e: return None, (str(e), bad[:2])
    finally: mu.hook_del(hk)
    vals=struct.unpack('<'+'fI'*76, bytes(mu.mem_read(arr, 76*8)))
    hdr=struct.unpack('<3f', bytes(mu.mem_read(inner+0xc, 12)))
    return ([ (round(vals[2*i],5), vals[2*i+1]&0xff) for i in range(76)], hdr), None
if __name__=='__main__':
    r,err=run_conv(base_record())
    print('err', err)
    if r: print('hdr', r[1]); print(r[0])
