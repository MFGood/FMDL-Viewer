# Make faceHi's skull skinning left/right symmetric: for each mirror pair whose skinning doesn't mirror,
# keep the side whose movement agrees better with its mesh neighbours and mirror it onto the other.
import numpy as np
import slidertest as st
from slidertest3 import record, preset, bones
st.VW=st.W[st.choice].copy(); st.VI=st.I[st.choice].copy()   # start from the mapped skinning, not an earlier fix
M=st.M; n=len(M)
mir=M*np.array([-1,1,1])
mesh=np.searchsorted(st.offs[1:], np.arange(n), side='right')   # mirror partners stay within their own mesh
P=np.array([np.where(mesh==mesh[i])[0][((mir[i]-M[mesh==mesh[i]])**2).sum(1).argmin()] for i in range(n)])
print('worst mirror-partner distance %.3f mm'%(np.linalg.norm(mir-M[P],axis=1).max()*1000))
BM=list(range(30))
for r,l in zip(range(4,16),range(17,29)): BM[r]=l; BM[l]=r
BM=np.array(BM)
nb=[set() for _ in range(n)]
for a,b,c in st.faces:
    for x,y in ((a,b),(b,c),(c,a)): nb[x].add(y); nb[y].add(x)
tests=[{}]+[{f:v} for f in (36,37,40,45,48,53,64,65,71,72,79,80,93,94) for v in (0,14)]
H=[(lambda v,h: (v,h))(*record(t)) for t in tests]
def moves():
    return [st.deform(bones(preset(v,h)))-M for v,h in H]
def disagree(D, i):
    js=list(nb[i]); return sum(np.linalg.norm(d[i]-d[js],axis=1).mean() for d in D)
VW=st.VW.copy(); VI=st.VI.copy()
for it in range(3):
    st.VW,st.VI=VW,VI
    D=moves()
    flip=np.array([-1,1,1])
    bad=[i for i in range(n) if i<P[i] and max(np.linalg.norm(d[i]-d[P[i]]*flip) for d in D)>0.0003]
    print('pass',it,'asymmetric pairs',len(bad))
    if not bad: break
    for i in bad:
        j=P[i]
        src,dst=(i,j) if disagree(D,i)<=disagree(D,j) else (j,i)
        VW[dst]=VW[src]; VI[dst]=BM[VI[src]]
st.VW,st.VI=VW,VI
np.save('sym_VW.npy',VW); np.save('sym_VI.npy',VI)
D=moves()
print('max asym after: %.3f mm'%(max(np.linalg.norm(d-d[P]*np.array([-1,1,1]),axis=1).max() for d in D)*1000))
# Vertices on the center line: split each side bone's weight half and half with its mirror (up to 8 influences).
W8=np.zeros((n,8)); I8=np.zeros((n,8),int)
W8[:,:4]=VW; I8[:,:4]=VI
cen=[i for i in range(n) if P[i]==i]
for i in cen:
    w=[];b=[]
    for k in range(4):
        if VW[i,k]==0: continue
        if BM[VI[i,k]]==VI[i,k]: w.append(VW[i,k]); b.append(VI[i,k])
        else: w+= [VW[i,k]/2]*2; b+=[VI[i,k],BM[VI[i,k]]]
    W8[i]=0; I8[i]=0; W8[i,:len(w)]=w; I8[i,:len(b)]=b
st.VW,st.VI=W8,I8
np.save('sym_VW.npy',W8); np.save('sym_VI.npy',I8)
D=moves()
print('center-line vertices',len(cen),'| max asym after: %.3f mm'%(max(np.linalg.norm(d-d[P]*np.array([-1,1,1]),axis=1).max() for d in D)*1000))
