// rig.js — plays the animation (the run cycle or an .anim clip) and shows the body shape on the loaded models.
// Each mesh with bone weights gets a skinned copy bound to a rig of the full PES skeleton; the copies are
// shown instead of the rigid meshes while the animation is on or a body shape is set (standing at rest if
// it isn't playing).

import * as THREE from 'three';
import { fetchAsset } from '../core/files.js';
import { options } from '../core/options.js';
import { state } from '../core/state.js';
import { scene } from '../scene/stage.js';
import { runPose } from './run-cycle.js';
import { parseAnim, ganiClip, withHands, clipPose, clipDuration } from './clip.js';
import { helperBoneMatrices } from './helper-bones.js';
import { currentShape, applyBodyShape, shoulderHeightOf } from './body-shape.js';

// The full PES skeleton (158 bones, root dsk_hip) from pes-fmdl-blender's PesSkeletonData.py, which took
// the positions from PES's body / hand_l / hand_r / face .skl files: { name: { parent, pos: [x, y, z] } }.
// Hand bones (skh_*) hang off sk_hand_l / sk_hand_r and face bones (skf_*) off sk_head, so gloves and
// faces follow the body. Loaded the first time the run animation is turned on.
// The bind orientations of the bones (from PES's body.skl) go with it, for the helper-bone drivers.
let skeleton = null, bindFrames = null;
let skeletonLoading = null;
function loadSkeleton() {
  const json = (path) => fetchAsset(path).then((buffer) => JSON.parse(new TextDecoder().decode(buffer)));
  skeletonLoading ||= Promise.all([json('assets/pes-skeleton.json'), json('assets/pes-bind-frames.json')])
    .then(([sk, frames]) => { skeleton = sk; bindFrames = frames; });
  return skeletonLoading;
}

// The animation played: the run cycle (RUN_CYCLE) or a clip's path under CLIP_FOLDER (.anim or .gani), and
// that clip once loaded. Clips start from their first frame when picked.
export const RUN_CYCLE = 'run', CLIP_FOLDER = 'assets/animations';
let animation = RUN_CYCLE, clip = null, clipStart = null;
export const currentAnimation = () => animation;

/** The playing clip's length: { seconds, frames, fps }, or null for the run cycle. */
export const currentClipInfo = () => clip && { seconds: clipDuration(clip), frames: clip.frames, fps: clip.fps };

/** The clips that come with the viewer, by category: { category: [path under CLIP_FOLDER, …] } (its clips.json). */
export const listClips = () => fetchAsset(`${CLIP_FOLDER}/clips.json`).then((buffer) => JSON.parse(new TextDecoder().decode(buffer)));

// The game's hand poses and which clips use them (built by research/hand-animations), loaded with the first
// clip; null if it won't load, and the hands then stay open.
let handsLoading = null;
const loadHands = () => (handsLoading ||= fetchAsset(`${CLIP_FOLDER}/hands.json`)
  .then((buffer) => JSON.parse(new TextDecoder().decode(buffer)), () => null));

/** Play the run cycle (RUN_CYCLE) or the clip at `path` under CLIP_FOLDER. Throws if the clip won't load. */
export async function setAnimation(path) {
  if (path === RUN_CYCLE) { animation = RUN_CYCLE; clip = null; return; }
  const buffer = await fetchAsset(`${CLIP_FOLDER}/${path}`);
  const parsed = withHands(/\.gani$/i.test(path) ? ganiClip(buffer) : parseAnim(new TextDecoder().decode(buffer)), await loadHands(), path);
  animation = path; clip = parsed; clipStart = null;
}

/** { root, bones: Map name -> Bone, staticBone, index: Map Bone -> i, skeleton, rest: Map Bone -> position } */
let rig = null;
export const currentRig = () => rig;

/** Whether the loaded models need the rig: the animation is on, or a body shape is set. */
export const wantRig = () => options.run || !!currentShape();

/** True while the rig is built and its skinned copies are shown. */
export const rigged = () => !!rig;

/** True while the animation is on and a rig is built. */
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
  const depth = (b) => (b.parent?.isBone ? 1 + depth(b.parent) : 0);
  const restWorld = new Map(Object.entries(skeleton).map(([name, d]) => [name, d.pos]));
  // Helper bones move by how far the game's placement has moved from its placement at rest.
  const helperRest = new Map([...helperBoneMatrices(bones, bindFrames, restWorld)].map(([name, m]) => {
    const p = bones.get(name).getWorldPosition(new THREE.Vector3());
    return [name, m.invert().multiply(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))];
  }));
  rig = {
    root, bones, staticBone,
    restWorld, helperRest,
    index: new Map(list.map((b, i) => [b, i])),
    order: [...list].sort((a, b) => depth(a) - depth(b)), // parents before children
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

/** A skinned copy of a mesh: same attributes and material, positions as modeled, bone weights added. */
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

  const n = v.count, indices = new Uint16Array(n * 4), raw = new Float32Array(n * 4), normalized = new Float32Array(n * 4);
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
    if (sum > 0) for (let k = 0; k < 4; k++) normalized[i * 4 + k] = raw[i * 4 + k] / sum;
    else { indices[i * 4] = staticIndex; normalized[i * 4] = 1; } // unweighted: stays put when weight scaling is off
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  // Raw weights reproduce PES weight scaling (Σ wᵢ·Mᵢ·p, so at rest Σw·p); normalized ones don't.
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(options.weightScaling ? raw : normalized, 4));
  geometry.userData.weights = { raw, normalized };

  const skinned = new THREE.SkinnedMesh(geometry, m.obj.material);
  skinned.bind(rig.skeleton, new THREE.Matrix4());
  skinned.frustumCulled = false; // bounds move with the pose
  skinned.userData = m.obj.userData;
  skinned.renderOrder = m.obj.renderOrder;
  m.model.group.add(skinned);
  return skinned;
}

/** Build the rig and skinned copies for the loaded models, if they need them (see wantRig). */
export async function startRun() {
  await loadSkeleton();
  stopRun();
  if (!state.models.length || !wantRig()) return;
  buildRig();
  for (const m of state.meshObjects) m.skinned = makeSkinned(m);
  poseRun(0);
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

/** Switch the skinned copies between raw (PES weight scaling) and normalized weights. */
export function applySkinWeights() {
  for (const m of state.meshObjects) {
    if (!m.skinned) continue;
    const { raw, normalized } = m.skinned.geometry.userData.weights;
    const wanted = options.weightScaling ? raw : normalized;
    if (m.skinned.geometry.getAttribute('skinWeight').array !== wanted) m.skinned.geometry.setAttribute('skinWeight', new THREE.BufferAttribute(wanted, 4));
  }
}

/** Pose the rig at time t (seconds), or at rest while the animation is off; then give it the body shape. */
export function poseRun(t) {
  for (const bone of rig.order) bone.matrixAutoUpdate = true; // the shape and helpers of the last pose go
  if (options.run) {
    if (clip && clipStart == null) clipStart = t;
    const { local, hipOffset } = clip ? clipPose(clip, t - clipStart, skeleton) : runPose(t, skeleton);
    for (const [name, q] of local) rig.bones.get(name)?.quaternion.set(q[0], q[1], q[2], q[3]);
    const hip = rig.bones.get('dsk_hip');
    if (hip) hip.position.copy(rig.rest.get(hip)).add(new THREE.Vector3(...hipOffset));
  } else {
    for (const bone of rig.order) { bone.quaternion.identity(); bone.position.copy(rig.rest.get(bone)); }
  }
  rig.root.updateMatrixWorld(true);
  // Then the helper bones, as PES places them: each moves as the game's placement moves from rest (which
  // may scale it unevenly), set as a fixed local matrix under its parent; parents are done before children.
  const shape = currentShape();
  const helpers = helperBoneMatrices(rig.bones, bindFrames, rig.restWorld, shape ? shoulderHeightOf(shape) : 0);
  for (const [name, m] of helpers) m.multiply(rig.helperRest.get(name));
  const inverse = new THREE.Matrix4();
  for (const bone of rig.order) {
    const world = helpers.get(bone.name);
    if (!world) continue;
    bone.matrixAutoUpdate = false;
    bone.matrix.copy(inverse.copy(bone.parent.matrixWorld).invert().multiply(world));
    bone.updateMatrixWorld(true);
  }
  if (shape) applyBodyShape(rig.order, bindFrames, shape);
}
