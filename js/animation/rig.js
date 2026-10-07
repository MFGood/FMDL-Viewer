// rig.js — plays the run cycle on the loaded models. Each mesh with bone weights gets a skinned copy bound
// to a rig of the full PES skeleton; the copies are shown instead of the rigid meshes while it runs.

import * as THREE from 'three';
import { fetchAsset } from '../core/files.js';
import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { scene } from '../scene/stage.js';
import { runPose } from './run-cycle.js';

// The full PES skeleton (158 bones, root dsk_hip) from pes-fmdl-blender's PesSkeletonData.py, which took
// the positions from PES's body / hand_l / hand_r / face .skl files: { name: { parent, pos: [x, y, z] } }.
// Hand bones (skh_*) hang off sk_hand_l / sk_hand_r and face bones (skf_*) off sk_head, so gloves and
// faces follow the body. Loaded the first time the run animation is turned on.
let skeleton = null;
let skeletonLoading = null;
function loadSkeleton() {
  skeletonLoading ||= fetchAsset('assets/pes-skeleton.json')
    .then((buffer) => (skeleton = JSON.parse(new TextDecoder().decode(buffer))));
  return skeletonLoading;
}

/** { root, bones: Map name -> Bone, staticBone, index: Map Bone -> i, skeleton, rest: Map Bone -> position } */
let rig = null;
export const currentRig = () => rig;

/** True while the run animation is on and a rig is built. */
export const running = () => options.run && !!rig;

/** A rig of the PES skeleton plus any bone the loaded models use that it doesn't have. */
function buildRig() {
  disposeRig();
  const root = new THREE.Group();
  const staticBone = new THREE.Bone(); // never moves: unknown bones and lost weights
  staticBone.name = '(static)';
  root.add(staticBone);
  const bones = new Map(), list = [staticBone];
  for (const name of Object.keys(skeleton)) {
    const bone = new THREE.Bone();
    bone.name = name;
    bones.set(name, bone);
    list.push(bone);
  }
  for (const [name, d] of Object.entries(skeleton)) {
    const parent = d.parent && bones.get(d.parent), parentPos = parent ? skeleton[d.parent].pos : [0, 0, 0];
    const bone = bones.get(name);
    bone.position.set(d.pos[0] - parentPos[0], d.pos[1] - parentPos[1], d.pos[2] - parentPos[2]);
    (parent || root).add(bone);
  }
  // Bones a model has that the PES skeleton doesn't: placed where the model puts them, under the nearest
  // ancestor the rig knows (otherwise the static bone).
  root.updateMatrixWorld(true);
  const addModelBone = (fmdlBone) => {
    if (bones.has(fmdlBone.name)) return bones.get(fmdlBone.name);
    const parent = fmdlBone.parent ? addModelBone(fmdlBone.parent) : staticBone;
    const bone = new THREE.Bone();
    bone.name = fmdlBone.name;
    const at = new THREE.Vector3(fmdlBone.globalPosition.x, fmdlBone.globalPosition.y, fmdlBone.globalPosition.z);
    parent.updateMatrixWorld(true);
    bone.position.copy(at.sub(parent.getWorldPosition(new THREE.Vector3())));
    parent.add(bone);
    bones.set(fmdlBone.name, bone);
    list.push(bone);
    return bone;
  };
  for (const model of state.models) for (const bone of model.parsed.bones) addModelBone(bone);
  scene.add(root);
  root.updateMatrixWorld(true);
  rig = {
    root, bones, staticBone,
    index: new Map(list.map((b, i) => [b, i])),
    skeleton: new THREE.Skeleton(list), // rest pose = these positions, identity rotations
    rest: new Map(list.map((b) => [b, b.position.clone()])),
  };
}

function disposeRig() {
  if (!rig) return;
  scene.remove(rig.root);
  rig.skeleton.dispose();
  rig = null;
}

/** A skinned copy of a mesh: same attributes and material, positions as modelled, bone weights added. */
function makeSkinned(m) {
  const v = m.mesh.vertices;
  if (!v.weightSum) return null; // no bone weights in this mesh's vertex format: it stays rigid
  const source = m.obj.geometry, geometry = new THREE.BufferGeometry();
  for (const name of ['normal', 'uv', 'uv1', 'timingUv']) {
    const attribute = source.getAttribute(name);
    if (attribute) geometry.setAttribute(name, attribute);
  }
  geometry.setIndex(source.index);
  geometry.setAttribute('position', new THREE.BufferAttribute(v.position, 3));

  const n = v.count, indices = new Uint16Array(n * 4), raw = new Float32Array(n * 4), normalised = new Float32Array(n * 4);
  const staticIndex = rig.index.get(rig.staticBone);
  for (let i = 0; i < n; i++) {
    let valid = 0;
    for (let k = 0; k < 4; k++) {
      const bone = v.skinBones?.[i * 4 + k];
      if (!bone) { indices[i * 4 + k] = staticIndex; continue; }
      indices[i * 4 + k] = rig.index.get(rig.bones.get(bone.name)) ?? staticIndex;
      raw[i * 4 + k] = v.skinWeights[i * 4 + k];
      valid += raw[i * 4 + k];
    }
    // Weight on bone slots the mesh's bone group doesn't have still counts in PES; keep it on the static bone.
    const lost = v.weightSum[i] - valid;
    if (lost > 1e-6) for (let k = 0; k < 4; k++) if (!raw[i * 4 + k]) { indices[i * 4 + k] = staticIndex; raw[i * 4 + k] = lost; break; }
    const sum = raw[i * 4] + raw[i * 4 + 1] + raw[i * 4 + 2] + raw[i * 4 + 3];
    if (sum > 0) for (let k = 0; k < 4; k++) normalised[i * 4 + k] = raw[i * 4 + k] / sum;
    else { indices[i * 4] = staticIndex; normalised[i * 4] = 1; } // unweighted: stays put when weight scaling is off
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  // Raw weights reproduce PES weight scaling (Σ wᵢ·Mᵢ·p, so at rest Σw·p); normalised ones don't.
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(options.weightScaling ? raw : normalised, 4));
  geometry.userData.weights = { raw, normalised };

  const skinned = new THREE.SkinnedMesh(geometry, m.obj.material);
  skinned.bind(rig.skeleton, new THREE.Matrix4());
  skinned.frustumCulled = false; // bounds move with the pose
  skinned.userData = m.obj.userData;
  skinned.renderOrder = m.obj.renderOrder;
  m.model.group.add(skinned);
  return skinned;
}

/** Build the rig and skinned copies for the loaded models. */
export async function startRun() {
  await loadSkeleton();
  stopRun();
  if (!state.models.length || !options.run) return;
  buildRig();
  for (const m of state.meshObjects) m.skinned = makeSkinned(m);
}

/** Remove the rig and skinned copies. */
export function stopRun() {
  for (const m of state.meshObjects) {
    if (!m.skinned) continue;
    m.model.group.remove(m.skinned);
    m.skinned.geometry.dispose();
    m.skinned = null;
  }
  disposeRig();
}

/** Switch the skinned copies between raw (PES weight scaling) and normalised weights. */
export function applySkinWeights() {
  for (const m of state.meshObjects) {
    if (!m.skinned) continue;
    const { raw, normalised } = m.skinned.geometry.userData.weights;
    const wanted = options.weightScaling ? raw : normalised;
    if (m.skinned.geometry.getAttribute('skinWeight').array !== wanted) m.skinned.geometry.setAttribute('skinWeight', new THREE.BufferAttribute(wanted, 4));
  }
}

/** Pose the rig at time t (seconds). */
export function poseRun(t) {
  const { local, offsets, hipOffset } = runPose(t, skeleton);
  for (const [name, q] of local) rig.bones.get(name)?.quaternion.set(q[0], q[1], q[2], q[3]);
  // Shirt-hem and shorts bones also move (each panel swings about its own pivot).
  for (const [name, o] of offsets) {
    const bone = rig.bones.get(name);
    if (bone) bone.position.copy(rig.rest.get(bone)).add(new THREE.Vector3(o[0], o[1], o[2]));
  }
  const hip = rig.bones.get('dsk_hip');
  if (hip) hip.position.copy(rig.rest.get(hip)).add(new THREE.Vector3(...hipOffset));
  rig.root.updateMatrixWorld(true);
}
