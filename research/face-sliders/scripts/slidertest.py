import struct, json
import numpy as np
from emuface import run_conv, base_record, setbits, FIELDS
from pe import u32, D, v2f
# metadata: per output (isScale, comp, node index in FaceData order)
META=[(D[v2f(0x22babe8+i*8)+4], D[v2f(0x22babe8+i*8)+5], D[v2f(0x22babe8+i*8)+6]) for i in range(76)]
def facedata(fn):
    d=open(fn,'rb').read(); u=lambda o: struct.unpack_from('<I',d,o)[0]; out=[]
    for i in range(u(4)):
        no,do=u(12+i*8),u(16+i*8); nm=d[no:d.index(b'\0',no)].decode()
        f=struct.unpack_from('<24f',d,do)
        out.append(dict(name=nm, M=np.vstack([np.array(f[:12]).reshape(3,4),[0,0,0,1]]), pos=np.array(f[12:15]), scl=np.array(f[16:19])))
    return out
RESET=facedata('face/montage/skull/preset/resetFaceData.bin')
# faceHi + skull skin
f=json.load(open('faceHi.json'))
Ms=[np.array(m['position']).reshape(-1,3) for m in f['meshes']]; M=np.concatenate(Ms); NM=len(M)
offs=np.cumsum([0]+[len(x) for x in Ms])
faces=np.concatenate([np.array(m['faces']).reshape(-1,3)+offs[i] for i,m in enumerate(f['meshes'])])
sk=open('face/montage/skull/skull.bin','rb').read(); NA=1548
W=np.frombuffer(sk,'<f4',NA*4,0x7a0).reshape(-1,4); I=np.frombuffer(sk,'<u4',NA*4,0x6860).reshape(-1,4).astype(int)
skn=[]; inv=[]
for b in range(30):
    no=struct.unpack_from('<I',sk,0x14+b*8)[0]+8; skn.append(sk[no:sk.index(b'\0',no)].decode())
    r=np.array(struct.unpack_from('<12f',sk,0x200+b*0x30)).reshape(3,4); inv.append(np.vstack([r,[0,0,0,1]]))
choice=np.load('mesh_choice.npy')
VW=W[choice]; VI=I[choice]
def bones_from(outputs):
    nodes=[dict(n, pos=n['pos'].copy(), scl=n['scl'].copy()) for n in RESET]
    for (val,flag),(isS,comp,idx) in zip(outputs, META):
        if not flag or idx>=len(nodes): continue
        if isS: nodes[idx]['scl'][comp]=val
        else: nodes[idx]['pos'][comp]=val
    byname={}
    for n in nodes:
        R=n['M'][:3,:3]
        B=np.eye(4); B[:3,:3]=R*n['scl'][None,:]; B[:3,3]=n['pos']
        byname[n['name']]=B
    return byname
def deform(byname):
    S=np.array([byname[nm]@inv[b] if nm in byname else np.eye(4) for b,nm in enumerate(skn)])
    h=np.c_[M,np.ones(NM)]; out=np.zeros_like(M)
    for k in range(VW.shape[1]): out+=VW[:,k:k+1]*np.einsum('nij,nj->ni', S[VI[:,k]], h)[:,:3]
    out+=(1-VW.sum(1,keepdims=True))*M
    return out
base=base_record()
def setting(changes):
    r=bytearray(base)
    for fid,n in changes.items():
        fdef=[x for x in FIELDS if x['id']==fid][0]; setbits(r, fdef['save'][0], fdef['save'][1], fdef['bits'], n)
    (vals,hdr),err=run_conv(r); assert not err, err
    return deform(bones_from(vals))
neutral=setting({})
print('neutral vs model: median move mm', round(float(np.median(np.linalg.norm(neutral-M,axis=1)))*1000,2), 'max', round(float(np.max(np.linalg.norm(neutral-M,axis=1)))*1000,2))
tests={'all 7 (neutral)':{}}
for fid in (37,38,39,40,41,42,44,45,47,48,49,51,52,54,55,56):
    tests[f'id {fid} = 0']={fid:0}; tests[f'id {fid} = 14']={fid:14}
out={'orig':np.round(M,5).ravel().tolist(),'faces':faces.ravel().tolist(),'settings':{}}
for name,ch in tests.items():
    p=setting(ch); d=np.linalg.norm(p-neutral,axis=1)
    out['settings'][name]=np.round(p,5).ravel().tolist()
    print(f'{name:16s} change vs neutral: max {d.max()*1000:6.2f} mm, verts moved >0.5 mm {int((d>0.0005).sum())}')
json.dump(out, open('C:/GitHub/fmdlviewer.github.io/.claude/tmp-test/face-sliders.json','w'))
