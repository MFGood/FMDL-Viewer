# Writes assets/defaults/face/face-shape.json for js/animation/face-shape.js.
import json, struct, numpy as np
from pe import D, v2f
from emuskull import facedata_nodes
t=json.load(open('convtables.json'))
F={f['id']:f for f in json.load(open('fieldtable.json'))}
rest=facedata_nodes(open('face/montage/skull/preset/resetFaceData.bin','rb').read()); order=list(rest)
META=[(D[v2f(0x22babe8+i*8)+4], D[v2f(0x22babe8+i*8)+5], D[v2f(0x22babe8+i*8)+6]) for i in range(76)]
sk=open('face/montage/skull/skull.bin','rb').read()
skn=[]; inv=[]
for b in range(30):
    no=struct.unpack_from('<I',sk,0x14+b*8)[0]+8; skn.append(sk[no:sk.index(b'\0',no)].decode())
    inv.append([round(x,7) for x in struct.unpack_from('<12f',sk,0x200+b*0x30)])
VW=np.load('sym_VW.npy'); VI=np.load('sym_VI.npy')
weights=[]
for i in range(len(VW)):
    row=[[int(b),round(float(w),5)] for b,w in zip(VI[i],VW[i]) if w>1e-5]
    weights.append(sum(row,[]))
fields={}
for fid,rows in t['delta'].items():
    rows=np.array(rows)
    fields[fid]={'save':F[int(fid)]['save'], 'outputs':{str(i):[round(x,6) for x in rows[:,i]] for i in range(78) if np.abs(rows[:,i]).max()>1e-7}}
data={
  'about':'PES 2016 face sliders: the converter 0x1ccc210 as per-slider tables (output = base + sum of deltas), the outputs\' FaceData bones (0x22babe8), resetFaceData rest positions, skull.bin inverse binds, and faceHi.model\'s skull weights.',
  'base':[round(x,6) for x in t['base']],
  'outputs':[[order[idx],int(isS),int(c)] for isS,c,idx in META],
  'rest':{nm:[round(x,6) for x in f[12:15]] for nm,f in rest.items()},
  'fields':fields,
  'skull':{'bones':skn,'inverseBinds':inv},
  'meshVertices':[1730,156,40],
  'weights':weights,
}
s=json.dumps(data,separators=(',',':'))
open('C:/GitHub/fmdlviewer.github.io/assets/defaults/face/face-shape.json','w').write(s)
print(len(s),'bytes; fields',len(fields))
