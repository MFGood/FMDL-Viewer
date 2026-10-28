import struct, json, glob, os, collections
import numpy as np
f=json.load(open('faceHi.json')); M=np.concatenate([np.array(m['position']).reshape(-1,3) for m in f['meshes']]); NM=len(M)
sk=open('face/montage/skull/skull.bin','rb').read()
NA=1548
W=np.frombuffer(sk,'<f4',NA*4,0x7a0).reshape(-1,4); I=np.frombuffer(sk,'<u4',NA*4,0x6860).reshape(-1,4)
# skull bone rest positions: negated translation of the 3x4 inverse bind (identity rotation)
rest=np.array([[-struct.unpack_from('<12f',sk,0x200+b*0x30)[k] for k in (3,7,11)] for b in range(30)])
est=(W[:,:,None]*rest[I]).sum(1)          # centroid of each skull vertex's bones
# part-file positions where known
pp=open('face/montage/parts/parts.bin','rb').read()
u=lambda o: struct.unpack_from('<I',pp,o)[0]
cs=lambda o: pp[o:pp.index(b'\0',o)].decode()
groups={}
for k in range(9):
    n,no,a,b,z,c=[u(0xc+k*0x18+i) for i in range(0,0x18,4)]
    groups[cs(no)]=np.array(struct.unpack_from(f'<{n}I',pp,a))
files={'Cheek':'bone_cheek','EyelidL':'bone_eyes_b','EyelidU':'bone_eyes_u','MouthB':'bone_mouth_b','MouthU':'bone_mouth_u','Nose':'bone_nose','UnderChin':'bone_underchin'}
known=collections.defaultdict(list)
for fn in sorted(glob.glob('face/montage/parts/FaceParts*XX.bin'))+sorted(glob.glob('face/montage/parts/FaceParts*00.bin'))+sorted(glob.glob('face/montage/parts/FaceParts*01.bin')):
    part=[k for k in files if os.path.basename(fn).startswith('FaceParts'+k)][0]; A=groups[files[part]]
    d=open(fn,'rb').read(); n=struct.unpack_from('<I',d,0xc)[0]; off=struct.unpack_from('<I',d,0x10)[0]
    P=np.frombuffer(d,'<f4',n*3,off).reshape(-1,3)
    for k in range(n): known[int(A[k])].append(P[k])
pos=est.copy(); haspos=np.zeros(NA,bool)
for a,ps in known.items(): pos[a]=np.mean(ps,0); haspos[a]=True
print('skull verts with part positions', haspos.sum(), 'centroid error vs part pos (median m)', float(np.median(np.linalg.norm(est[haspos]-pos[haspos],axis=1))))
# DP: map every skull vertex a to an increasing mesh index; mesh vertices may be skipped at a cost
D=np.linalg.norm(pos[:,None,:]-M[None,:,:],axis=2)
scale=np.where(haspos,1.0,0.25)[:,None]          # trust centroids less
C=D*scale
# exact matches are hard: that skull vertex must take that mesh vertex
nanch=0
for a,ps in known.items():
    hits=set()
    for p in ps:
        h=np.where(np.linalg.norm(M-p,axis=1)<1e-6)[0]
        if len(h)==1: hits.add(int(h[0]))
    if len(hits)==1:
        m=hits.pop(); row=np.full(NM,1.0); row[m]=0.0; C[a]=row; nanch+=1
print('hard anchors', nanch)
SKIP=0.004
INF=1e9
best=np.full(NM+1, 0.0); best[1:]=np.arange(1,NM+1)*SKIP   # best[m]: a skull verts placed using mesh[:m]
back=np.zeros((NA,NM),bool)
for a in range(NA):
    take=best[:-1]+C[a]                     # place a on mesh m (using mesh[:m] for earlier)
    new=np.full(NM+1, INF)
    # new[m+1] = min(new[m]+SKIP, take[m])
    cur=INF
    for m in range(NM):
        sk_=cur+SKIP
        if take[m] < sk_: cur=take[m]; back[a,m]=True
        else: cur=sk_
        new[m+1]=cur
    best=new
# backtrack
mapping=[None]*NA; m=NM-1; a=NA-1
while a>=0 and m>=0:
    if back[a,m]: mapping[a]=m; a-=1; m-=1
    else: m-=1
json.dump(mapping, open('skull_to_mesh.json','w'))
err=np.array([np.linalg.norm(pos[a]-M[mapping[a]]) for a in range(NA) if haspos[a] and mapping[a] is not None])
print('mapped', sum(x is not None for x in mapping), 'of', NA, '| on part-known verts: median', round(float(np.median(err))*1000,2),'mm, 95%', round(float(np.percentile(err,95))*1000,2),'mm')
ins=sorted(set(range(NM))-set(mapping)); print('inserted mesh verts', len(ins), 'first', ins[:12])
