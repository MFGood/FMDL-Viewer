# Re-skin vertices whose slider movement disagrees with their mesh neighbours (mapping errors, e.g. the lip seam):
# give them the blended weights of their agreeing neighbours (top 8 influences, normalised). Runs on sym_VW/sym_VI.
import numpy as np
import slidertest3 as s3, slidertest as st
from slidertest3 import record, preset, bones
M=st.M; n=len(M)
nb=[set() for _ in range(n)]
for a,b,c in st.faces:
    for x,y in ((a,b),(b,c),(c,a)): nb[x].add(y); nb[y].add(x)
tests=[{}]+[{f:v} for f in (37,40,45,64,65,71,72,73,75,76,79,80) for v in (0,14)]
H=[record(t) for t in tests]
def moves():
    base=st.deform(bones(preset(*H[0])))
    return [st.deform(bones(preset(v,h)))-base for v,h in H[1:]]
for it in range(6):
    D=moves()
    err=np.zeros(n)
    for d in D:
        nbm=np.array([d[list(nb[i])].mean(0) for i in range(n)])
        err=np.maximum(err, np.linalg.norm(d-nbm,axis=1))
    bad=np.where(err>0.002)[0]
    print('pass',it,'vertices more than 2 mm off their neighbours:',len(bad))
    if not len(bad): break
    VW,VI=st.VW.copy(),st.VI.copy(); badset=set(bad)
    for i in bad:
        src=[j for j in nb[i] if j not in badset] or list(nb[i])
        acc={}
        for j in src:
            for b,w in zip(st.VI[j],st.VW[j]):
                if w>0: acc[b]=acc.get(b,0)+w/len(src)
        top=sorted(acc.items(),key=lambda t:-t[1])[:VW.shape[1]]
        tot=sum(w for _,w in top)
        VW[i]=0; VI[i]=0
        for k,(b,w) in enumerate(top): VW[i,k]=w/tot; VI[i,k]=b
    st.VW,st.VI=VW,VI
np.save('sym_VW.npy',st.VW); np.save('sym_VI.npy',st.VI)
