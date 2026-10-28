# Save-slider path of 0x16e53f0: converter outputs -> "preset" FaceData nodes, then the h0/h1 transform, then skull-skinned faceHi.
import json, numpy as np
from emuface import run_conv, setbits, FIELDS
from emuskull import facedata_nodes
import slidertest as st
import os
if os.path.exists('sym_VW.npy'): st.VW=np.load('sym_VW.npy'); st.VI=np.load('sym_VI.npy')   # mirrored skinning from symfix.py
REST=facedata_nodes(open('face/montage/skull/preset/resetFaceData.bin','rb').read()); ORDER=list(REST)
PIN=1.587559312582016   # 0x22b4088
JAW=('bone_09','bone_22')
def preset(outputs, hdr):
    h0,h1=hdr[0],hdr[1]
    nodes={nm:dict(pos=np.array(f[12:15]), scl=np.ones(3)) for nm,f in REST.items()}
    for i,((val,flag),(isS,comp,idx)) in enumerate(zip(outputs, st.META)):
        if not flag or i==0x14: continue          # eyeball scale is applied to the eyeballs separately
        n=nodes[ORDER[idx]]
        if isS:
            n['scl'][comp]=val
            if i==0x2b: n['scl'][2]=val            # lip width also sets the lip's z scale
        else: n['pos'][comp]=val
    jx=(nodes['bone_09']['pos'][0]+nodes['bone_22']['pos'][0])*0.5
    for nm,n in nodes.items():
        if nm not in JAW:                          # every bone but the jaw scales by h1 about the jaw line
            n['pos'][0]=(n['pos'][0]-jx)*h1
            n['pos'][1]=(n['pos'][1]-PIN)*h1+PIN
        n['pos'][1]+=h0
    return nodes
# faceHi's own skf_jaw weight per vertex (mesh 0 only); 0x16e53f0 moves skf_jaw by the lip's offset from neutral
import json as _json
_sk=_json.load(open('faceHi_skin.json')); _grp=_json.load(open('faceHi.json'))['meshes'][0]['boneGroup']
_JI=_grp.index('skf_jaw'); W_JAW=np.zeros(len(st.M))
for v in range(len(_sk['skinBones'])//4):
    for k in range(4):
        if _sk['skinBones'][v*4+k]=='skf_jaw': W_JAW[v]+=_sk['skinWeights'][v*4+k]
LIP=[i for i,(isS,comp,idx) in enumerate(st.META) if not isS and ORDER[idx]=='bone_16']
def lip_offset(outputs, neutral):
    d=np.zeros(3)
    for i in LIP: d[st.META[i][1]]=outputs[i][0]-neutral[i][0]
    return d
def bones(nodes):
    out={}
    for nm,n in nodes.items():
        B=np.eye(4); B[:3,:3]=np.diag(n['scl']); B[:3,3]=n['pos']; out[nm]=B
    # skull bone_29 (bind = the lip's) carries the mouth interior; like group_oral / skf_jaw in game it follows the lip's position
    B=np.eye(4); B[:3,3]=nodes['bone_16']['pos']; out['bone_29']=B
    return out
def record(changes):
    r=bytearray(st.base)
    for fid,n in changes.items():
        f=[x for x in FIELDS if x['id']==fid][0]; setbits(r, f['save'][0], f['save'][1], f['bits'], n)
    (vals,hdr),err=run_conv(r); assert not err, err
    return vals, hdr
if __name__=='__main__':
    v0,h0=record({})
    face=lambda v,h: st.deform(bones(preset(v,h)))   # faceHi's skf_jaw verts are all skull-weighted, so no extra jaw offset here
    print('vertices on skf_jaw:', int((W_JAW>0.01).sum()), 'lip outputs', LIP)
    neutral=face(v0,h0)
    raw=st.deform(bones(preset(v0,(0.0,1.0))))
    dn=np.linalg.norm(neutral-st.M,axis=1); dr=np.linalg.norm(raw-st.M,axis=1)
    print(f'neutral vs faceHi: median {np.median(dn)*1000:.2f} mm, max {dn.max()*1000:.2f} mm (without h0/h1: median {np.median(dr)*1000:.2f}, max {dr.max()*1000:.2f})')
    res={'orig':np.round(st.M,5).ravel().tolist(),'faces':st.faces.ravel().tolist(),'settings':{'all 7 (neutral)':np.round(neutral,5).ravel().tolist()}}
    for fid in (36,37,39,40,44,45,46,47,48,50,51,52,53,54,55,56,57,58,59,61,62,63,64,65,66,68,69,71,72,73,75,76,78,79,80,93,94):
        for n in (0,14):
            v,h=record({fid:n}); p=face(v,h); d=np.linalg.norm(p-neutral,axis=1)
            k=f'id {fid} = {n}'; res['settings'][k]=np.round(p,5).ravel().tolist()
            print(f'{k:12s} max {d.max()*1000:6.2f} mm, verts >0.5 mm {int((d>0.0005).sum()):4d}  h0 {h[0]:+.4f} h1 {h[1]:.3f}')
    json.dump(res, open('C:/GitHub/fmdlviewer.github.io/.claude/tmp-test/face-sliders-save.json','w'))
