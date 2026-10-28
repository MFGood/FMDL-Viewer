import json
from emuface import *
from emuskull import facedata_nodes
import struct
META=[(D[v2f(0x22babe8+i*8)+4], D[v2f(0x22babe8+i*8)+5], D[v2f(0x22babe8+i*8)+6]) for i in range(76)]
order=list(facedata_nodes(open('face/montage/skull/preset/resetFaceData.bin','rb').read()))
(v0,h0),_=run_conv(base_record())
print('neutral hdr',h0)
res={}
for f in FIELDS:
    sv=f['save']
    if not isinstance(sv,list) or f['bits']>8 or not (0xc<=sv[0]<0x44): continue
    eff=[]
    for n in (0,f['max']):
        r=base_record(); setbits(r,sv[0],sv[1],f['bits'],n)
        (v,h),_=run_conv(r)
        ch=sorted({(order[META[i][2]],('scl' if META[i][0] else 'pos')+'xyz'[META[i][1]]) for i in range(76) if abs(v[i][0]-v0[i][0])>1e-6})
        hc=[k for k in range(3) if abs(h[k]-h0[k])>1e-6]
        eff.append((ch,hc))
    if any(e[0] or e[1] for e in eff):
        res[f['id']]=eff
        print(f['id'], sv, 'max',f['max'], eff[1][0][:6], 'hdr', eff[1][1])
json.dump({str(k):v for k,v in res.items()}, open('sweep2.json','w'))
