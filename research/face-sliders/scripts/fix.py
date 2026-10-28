import struct, json
import numpy as np
f=json.load(open('faceHi.json'))
Ms=[np.array(m['position']).reshape(-1,3) for m in f['meshes']]; M=np.concatenate(Ms); NM=len(M)
offs=np.cumsum([0]+[len(x) for x in Ms])
faces=np.concatenate([np.array(m['faces']).reshape(-1,3)+offs[i] for i,m in enumerate(f['meshes'])])
sk=open('face/montage/skull/skull.bin','rb').read(); NA=1548
W=np.frombuffer(sk,'<f4',NA*4,0x7a0).reshape(-1,4); I=np.frombuffer(sk,'<u4',NA*4,0x6860).reshape(-1,4).astype(int)
names=[]; inv=[]
for b in range(30):
    no=struct.unpack_from('<I',sk,0x14+b*8)[0]+8; names.append(sk[no:sk.index(b'\0',no)].decode())
    r=np.array(struct.unpack_from('<12f',sk,0x200+b*0x30)).reshape(3,4); inv.append(np.vstack([r,[0,0,0,1]]))
rest=np.array([-np.linalg.inv(x)[:3,3]*-1 for x in inv])  # bone rest positions
def facedata(fn):
    d=open(fn,'rb').read(); u=lambda o: struct.unpack_from('<I',d,o)[0]; out={}
    for i in range(u(4)):
        no,do=u(12+i*8),u(16+i*8); nm=d[no:d.index(b'\0',no)].decode()
        r=np.array(struct.unpack_from('<12f',d,do)).reshape(3,4); out[nm]=np.vstack([r,[0,0,0,1]])
    return out
base=facedata('face/montage/skull/preset/baseFaceData1.bin')
S=np.array([base[nm]@inv[b] if nm in base else np.eye(4) for b,nm in enumerate(names)])
def disp(a, v):  # movement of point v skinned with skull vertex a's weights
    h=np.append(v,1.0); out=sum(W[a,k]*(S[I[a,k]]@h)[:3] for k in range(4)) + (1-W[a].sum())*v
    return out-v
mp=json.load(open('skull_to_mesh.json'))
choice=np.full(NM,-1); 
for a,m in enumerate(mp): choice[m]=a
# neighbours
nb=[set() for _ in range(NM)]
for t in faces:
    for x in t:
        for y in t:
            if x!=y: nb[x].add(int(y))
# skull-vertex position estimate (centroid of its bones) for a weak locality term
cent=(W[:,:,None]*np.array([np.linalg.inv(x)[:3,3] for x in inv])[I]).sum(1)
src=np.where(choice>=0)[0]
for m in np.where(choice<0)[0]:      # inserted: start from the nearest mapped vertex
    choice[m]=choice[src[np.argmin(np.linalg.norm(M[src]-M[m],axis=1))]]
def D_all(): return np.array([disp(choice[m], M[m]) for m in range(NM)])
def bad_edges(D):
    e=np.unique(np.sort(np.vstack([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),1),axis=0)
    dd=np.linalg.norm(D[e[:,0]]-D[e[:,1]],axis=1); return e, dd
D=D_all(); e,dd=bad_edges(D); print('before: torn edges', int((dd>0.002).sum()))
WIN=40; LAM=0.05
for it in range(6):
    changed=0
    nbmean=np.array([D[list(nb[m])].mean(0) if nb[m] else D[m] for m in range(NM)])
    score=np.linalg.norm(D-nbmean,axis=1)
    for m in np.argsort(-score):
        if score[m] < 0.0012: break
        cur=choice[m]
        cands=set(range(max(0,cur-WIN),min(NA,cur+WIN+1)))|{choice[n] for n in nb[m]}
        target=np.mean([D[n] for n in nb[m]],0)
        best=None
        for a in cands:
            c=np.linalg.norm(disp(a,M[m])-target)+LAM*np.linalg.norm(cent[a]-M[m])*0.01
            if best is None or c<best[0]: best=(c,a)
        if best[1]!=cur: choice[m]=best[1]; D[m]=disp(best[1],M[m]); changed+=1
    e,dd=bad_edges(D); print(f'pass {it+1}: changed {changed}, torn edges {int((dd>0.002).sum())}')
    if not changed: break
np.save('mesh_choice.npy', choice)
# export for the page
out=M+D
mapped=np.zeros(NM,bool); mapped[mp]=True
bad=e[dd>0.002]; ins=~(mapped[bad[:,0]] & mapped[bad[:,1]])
data={'orig':np.round(M,5).ravel().tolist(),'def':np.round(out,5).ravel().tolist(),'faces':faces.ravel().tolist(),
 'meshStart':offs.tolist(),'mapped':mapped.astype(int).tolist(),'move':np.round(np.linalg.norm(D,axis=1)*1000,2).tolist(),
 'bad':bad.ravel().tolist(),'badMM':np.round(dd[dd>0.002]*1000,2).tolist(),'badIns':ins.astype(int).tolist()}
json.dump(data, open('C:/GitHub/fmdlviewer.github.io/.claude/tmp-test/face-tear-fixed.json','w'))
print('lip-line check: torn edges with both ends near y 1.62-1.64', int(((M[bad[:,0],1]>1.61)&(M[bad[:,0],1]<1.645)).sum()))
