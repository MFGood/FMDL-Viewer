# Around the mouth, re-skin vertices that lean on bones that don't belong there (neck, nose_middle, brows, eye corners, the other
# side's jaw) from their nearest well-skinned mouth vertices (inverse-distance blend of 6, top 8 influences).
import numpy as np
import slidertest3, slidertest as st
M=st.M; n=len(M)
MOUTH={4,16,17,29,9,22,8,21,7,20,3}       # lips, mouth interior, jaw, cheeks, nose (upper lip)
RIGHT={4,7,8,9}; LEFT={17,20,21,22}
area=(np.abs(M[:,0])<0.045)&(M[:,1]>1.605)&(M[:,1]<1.65)&(M[:,2]>0.12)&(np.arange(n)<1730)
def bad_frac(i):
    f=0
    for b,w in zip(st.VI[i],st.VW[i]):
        if w<=0: continue
        wrong_side=(M[i,0]<-0.004 and b in LEFT) or (M[i,0]>0.004 and b in RIGHT)
        if b not in MOUTH or wrong_side: f+=w
    return f
bad=np.array([i for i in np.where(area)[0] if bad_frac(i)>0.2])
good=np.array([i for i in np.where(area)[0] if bad_frac(i)<=0.05])
print('mouth-area verts',area.sum(),'badly skinned',len(bad),'good',len(good))
VW,VI=st.VW.copy(),st.VI.copy()
for i in bad:
    side=good[np.sign(np.round(M[good,0],3))==np.sign(np.round(M[i,0],3))] if abs(M[i,0])>0.004 else good
    d=np.linalg.norm(M[side]-M[i],axis=1); near=side[np.argsort(d)[:6]]; wd=1/(np.sort(d)[:6]+1e-4)
    acc={}
    for j,wj in zip(near,wd):
        for b,w in zip(st.VI[j],st.VW[j]):
            if w>0: acc[b]=acc.get(b,0)+w*wj
    top=sorted(acc.items(),key=lambda t:-t[1])[:VW.shape[1]]; tot=sum(w for _,w in top)
    VW[i]=0; VI[i]=0
    for k,(b,w) in enumerate(top): VW[i,k]=w/tot; VI[i,k]=b
st.VW,st.VI=VW,VI
np.save('sym_VW.npy',VW); np.save('sym_VI.npy',VI)
print('re-skinned', len(bad))
