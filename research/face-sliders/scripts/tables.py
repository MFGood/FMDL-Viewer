# Per-field tables for the face converter: output = base + sum over fields of delta[field][n]. Checks additivity on random records.
import json, random, numpy as np
from emuface import run_conv, base_record, setbits, FIELDS
F={f['id']:f for f in FIELDS}
IDS=[36,37,39,40,44,45,46,47,48,50,51,52,53,54,55,56,57,58,59,61,62,63,64,65,66,68,69,71,72,73,75,76,78,79,80,93,94]
# also probe every other 4-bit field in the face area in case the sweep missed one
cand=[f['id'] for f in FIELDS if isinstance(f['save'],list) and f['bits']==4 and 0x16<=f['save'][0]<=0x33]
def out(rec):
    (v,h),e=run_conv(rec); assert not e,e
    return np.array([x[0] for x in v]+list(h[:2]))
base=out(base_record())
delta={}
for fid in cand:
    f=F[fid]; rows=[]
    for n in range(15):
        r=base_record(); setbits(r,f['save'][0],f['save'][1],4,n); rows.append(out(r)-base)
    rows=np.array(rows)
    if np.abs(rows).max()>1e-7: delta[fid]=rows
print('fields that move outputs:', sorted(delta), 'missing from list:', sorted(set(delta)-set(IDS)), 'listed but inert:', sorted(set(IDS)-set(delta)))
random.seed(1); worst=0
for t in range(40):
    r=base_record(); ns={}
    for fid in delta:
        n=random.randint(0,14); ns[fid]=n; f=F[fid]; setbits(r,f['save'][0],f['save'][1],4,n)
    pred=base+sum(delta[fid][n] for fid,n in ns.items())
    worst=max(worst,np.abs(out(r)-pred).max())
print('max additivity error over 40 random faces: %.3g'%worst)
json.dump({'base':base.tolist(),'delta':{str(k):v.tolist() for k,v in delta.items()}}, open('convtables.json','w'))
