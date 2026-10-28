# Run the game's MontageSkullJob builder update on an emulated builder object.
import struct, numpy as np
from emu import *
from pe import u32, D, v2f
def cstr(va):
    o=v2f(va); return D[o:D.index(b'\0',o)].decode()
TABLE=[]  # 44 entries: flags, name, alias, cp index
for i in range(44):
    a=0x2603680+i*0x10
    fl=D[v2f(a)]; nm=u32(a+4); al=u32(a+8); cp=struct.unpack('<i',D[v2f(a+12):v2f(a+16)])[0]
    TABLE.append(dict(flag=fl, name=cstr(nm), alias=cstr(al) if al else '', cp=cp))
def facedata_nodes(buf):
    u=lambda o: struct.unpack_from('<I',buf,o)[0]; out={}
    for i in range(u(4)):
        no,do=u(12+i*8),u(16+i*8); nm=buf[no:buf.index(b'\0',no)].decode()
        out[nm]=list(struct.unpack_from('<24f',buf,do))
    return out
def pack_nodes(nodes, order):
    b=b''
    for nm in order:
        f=nodes[nm]; m=f[:12]+[0,0,0,1]
        b+=struct.pack('<16f',*m)+struct.pack('<12f',*f[12:24])
    return b
DEFAULTS={0x60:1,0x64:1,0x6c:1,0x70:1,0x74:1,0x88:1,0x90:1,0x94:1,0x98:1,0xa0:1}
def run_builder(rest_buf, pairs, floats={}, z_nodes=None, entry=0x1764920, flag_tables=None, final_flag=None):
    """rest_buf: FaceData file bytes. pairs: {cp index: (x, y)}. z_nodes: dict name -> 24 floats for the z source."""
    mu=mkemu(); mu.mem_write(0xfbeb08, bytes([0xd9,0xfa,0xc3]))  # _CIsqrt import thunk -> fsqrt; ret
    if flag_tables: mu.mem_write(0x26b3000, flag_tables)
    H=0x20000000
    rest=facedata_nodes(rest_buf); order=list(rest)
    fbuf=H+0x10000; mu.mem_write(fbuf, rest_buf)
    nodes=H+0x20000; mu.mem_write(nodes, pack_nodes(rest, order))
    look=H+0x1000; mu.mem_write(look, struct.pack('<4I', 0, fbuf, fbuf+12, nodes))
    zlook=0
    if z_nodes:
        zn=H+0x30000; mu.mem_write(zn, pack_nodes(z_nodes, order))
        zlook=H+0x1100; mu.mem_write(zlook, struct.pack('<4I', 0, fbuf, fbuf+12, zn))
    state=H+0x40000; mu.mem_write(state, b'\0'*(44*0x90))
    for i,t in enumerate(TABLE):
        if t['cp']>=0 and t['cp'] in pairs:
            x,y=pairs[t['cp']]
            mu.mem_write(state+i*0x90+0x70, struct.pack('<2f',x,y)); mu.mem_write(state+i*0x90+0x84, b'\1')
    b=H+0x2000; mu.mem_write(b, b'\0'*0x100)
    mu.mem_write(b+8, struct.pack('<2I', look, zlook)); mu.mem_write(b+0x4c, struct.pack('<I', state))
    for o,v in {**DEFAULTS, **floats}.items(): mu.mem_write(b+o, struct.pack('<f', v))
    bad=[]
    mu.hook_add(UC_HOOK_MEM_UNMAPPED, lambda mu,a,addr,s,v,u: bad.append((hex(addr),hex(mu.reg_read(UC_X86_REG_EIP)))) or False)
    try: ok=run(mu, entry, (), ecx=b, maxi=20_000_000)&0xff
    except Exception as e: raise RuntimeError(f'{e} {bad[:3]}')
    if final_flag is not None:  # rebuild the matrices with 0x1763940(flag), e.g. 1 to apply +0x98/+0x9c
        run(mu, 0x1763940, (final_flag,), ecx=b, maxi=2_000_000)
    out={}
    for i,t in enumerate(TABLE):
        s=bytes(mu.mem_read(state+i*0x90, 0x90))
        f=struct.unpack('<36f', s)
        out[t['name']]=dict(M=np.array(f[0:16]).reshape(4,4), pos=np.array(f[16:19]), euler=np.array(f[20:23]), scl=np.array(f[24:27]), xyz=np.array(f[30:33]), alias=t['alias'])
    return ok, out
if __name__=='__main__':
    buf=open('face/montage/skull/preset/resetFaceData.bin','rb').read()
    rest=facedata_nodes(buf)
    for t in TABLE: print(t)
    # pairs = rest x/y of each control-point bone
    pairs={t['cp']:(rest[t['name']][12],rest[t['name']][13]) for t in TABLE if t['cp']>=0 and t['name'] in rest}
    ok,out=run_builder(buf, pairs)
    print('ok',ok)
    for nm,o in out.items():
        r=rest.get(nm)
        dv=(o['M'][:3,3] if abs(o['M'][3,3])<0.5 else o['M'][3,:3])
        print(f"{nm:16s} {o['alias']:14s} xyz {np.round(o['xyz'],4)} rest {np.round(r[12:15],4) if r else None} M {np.round(o['M'].ravel(),3)[[3,7,11,12,13,14]]}")
