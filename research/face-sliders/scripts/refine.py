import struct, json, glob, os, collections
import numpy as np
exec(open('align4.py').read().split('# DP:')[0])   # M, NM, NA, W, I, rest, est, known, pos, haspos
mp=json.load(open('skull_to_mesh.json'))
hard={}
for a,ps in known.items():
    hits=set()
    for p in ps:
        h=np.where(np.linalg.norm(M-p,axis=1)<1e-6)[0]
        if len(h)==1: hits.add(int(h[0]))
    if len(hits)==1: hard[a]=hits.pop()
wt=np.where(haspos,1.0,0.25)
cost=lambda a,m: float(np.linalg.norm(M[m]-pos[a]))*wt[a]
owner={m:a for a,m in enumerate(mp)}
WIN=16; improved=True; passes=0
while improved and passes<20:
    improved=False; passes+=1
    for a in range(NA):
        if a in hard: continue
        m=mp[a]; base=cost(a,m)
        for m2 in range(max(0,m-WIN), min(NM,m+WIN+1)):
            if m2==m: continue
            b=owner.get(m2)
            if b is None:
                if cost(a,m2) < base-1e-9:
                    del owner[m]; owner[m2]=a; mp[a]=m2; m=m2; base=cost(a,m2); improved=True
            elif b not in hard:
                if cost(a,m2)+cost(b,m) < base+cost(b,m2)-1e-9:
                    mp[a],mp[b]=m2,m; owner[m2]=a; owner[m]=b; m=m2; base=cost(a,m2); improved=True
json.dump(mp, open('skull_to_mesh.json','w')); print('passes', passes)
