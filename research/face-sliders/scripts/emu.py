from pe import *
from unicorn import *
from unicorn.x86_const import *
import struct
def mkemu():
    mu=Uc(UC_ARCH_X86,UC_MODE_32)
    for n,va,vs,ra,rs in SECS:
        size=(max(vs,rs)+0xfff)&~0xfff
        mu.mem_map(va,size)
        mu.mem_write(va,D[ra:ra+min(rs,size)])
    mu.mem_map(0,0x10000)
    mu.mem_map(0x10000000,0x200000)  # stack
    mu.mem_map(0x20000000,0x1000000) # heap
    return mu
NAMES={}
def hash_hook(mu):
    esp=mu.reg_read(UC_X86_REG_ESP)
    ret,p,n=struct.unpack('<III',mu.mem_read(esp,12))
    s=bytes(mu.mem_read(p,n)).decode()
    h=0x7f000000|(abs(hash(s))&0xffff)
    NAMES[h]=s
    mu.reg_write(UC_X86_REG_EAX,h); mu.reg_write(UC_X86_REG_EDX,0)
    mu.reg_write(UC_X86_REG_ESP,esp+4); mu.reg_write(UC_X86_REG_EIP,ret)
def ret_hook(mu):
    esp=mu.reg_read(UC_X86_REG_ESP)
    ret=struct.unpack('<I',mu.mem_read(esp,4))[0]
    mu.reg_write(UC_X86_REG_ESP,esp+4); mu.reg_write(UC_X86_REG_EIP,ret)
HOOKS={0x17a4d70:hash_hook,0xfbe4db:ret_hook}
def run(mu,fn,args=(),hooks=HOOKS,ecx=0,maxi=10**7):
    esp=0x10100000
    stk=struct.pack('<I',0xdead0000)+b''.join(struct.pack('<I',a) for a in args)
    esp-=len(stk); mu.mem_write(esp,stk)
    mu.reg_write(UC_X86_REG_ESP,esp); mu.reg_write(UC_X86_REG_ECX,ecx)
    mu.mem_map(0xdead0000,0x1000) if not any(r[0]==0xdead0000 for r in mu.mem_regions()) else None
    def code(mu,addr,size,u):
        if addr in hooks: hooks[addr](mu)
        elif addr==0xdead0000: mu.emu_stop()
    h=mu.hook_add(UC_HOOK_CODE,code)
    mu.emu_start(fn,0xdead0001,count=maxi)
    mu.hook_del(h)
    return mu.reg_read(UC_X86_REG_EAX)
