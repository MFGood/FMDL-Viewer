import struct, re, capstone
EXE=r'C:\Games\Pro Evolution Soccer 2016\PES2016.orig.exe'
D=open(EXE,'rb').read()
pe=struct.unpack_from('<I',D,0x3c)[0]
nsec=struct.unpack_from('<H',D,pe+6)[0]; opt=struct.unpack_from('<H',D,pe+20)[0]
BASE=struct.unpack_from('<I',D,pe+24+28)[0]
SECS=[]
o=pe+24+opt
for i in range(nsec):
    name=D[o:o+8].rstrip(b'\0').decode(); vs,va,rs,ra=struct.unpack_from('<IIII',D,o+8)
    SECS.append((name,BASE+va,vs,ra,rs)); o+=40
def f2v(f):
    for n,va,vs,ra,rs in SECS:
        if ra<=f<ra+rs: return va+f-ra
def v2f(v):
    for n,va,vs,ra,rs in SECS:
        if va<=v<va+rs: return ra+v-va
def u32(v): return struct.unpack_from('<I',D,v2f(v))[0]
def f32(v): return struct.unpack_from('<f',D,v2f(v))[0]
def cstr(v):
    f=v2f(v); e=D.find(b'\0',f); return D[f:e].decode('latin1')
def xrefs(v):
    b=struct.pack('<I',v); return [f2v(m.start()) for m in re.finditer(re.escape(b),D)]
md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32); md.detail=False
def dis(v,n=60,stop_ret=True):
    f=v2f(v); out=[]
    for i in md.disasm(D[f:f+n*16],v):
        out.append(i)
        print(f'{i.address:08x}  {i.mnemonic} {i.op_str}')
        if len(out)>=n or (stop_ret and i.mnemonic=='ret'): break
    return out
import numpy as np
_T=None
def callers(target):
    global _T
    n,va,vs,ra,rs=SECS[0]
    if _T is None:
        _T=np.frombuffer(D,dtype=np.uint8)
    seg=_T[ra:ra+rs]
    idx=np.nonzero(seg==0xE8)[0]
    idx=idx[idx+5<=len(seg)]
    rel=seg[idx+1].astype(np.int64)|(seg[idx+2].astype(np.int64)<<8)|(seg[idx+3].astype(np.int64)<<16)|(seg[idx+4].astype(np.int64)<<24)
    rel=np.where(rel>=2**31,rel-2**32,rel)
    dest=va+idx+5+rel
    return [int(va+i) for i in idx[dest==target]]
def sweep(lo,hi):
    f=v2f(lo); return list(md.disasm(D[f:v2f(hi)],lo))
def sweep(lo,hi):
    out=[]; a=lo
    while a<hi:
        f=v2f(a); got=False
        for (addr,size,mn,op) in md.disasm_lite(D[f:f+(hi-a)],a):
            out.append((addr,mn,op)); a=addr+size; got=True
        if a<hi: a+=1
    return out
