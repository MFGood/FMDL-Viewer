// materials.js — three.js materials for Fox Engine shaders, following the implyingrigged.info
// "Materials" wiki (Fox Engine section):
//   Deferred (3DDF): lit; alpha flag 0x80 = dithered transparency, 0x20 = two-sided.
//   Forward (3DFW): always alpha-blended; alpha 16 / 48 (0x20 = two-sided).
//   Shadow flag 0x2 = invisible, in both families.
// Glass, metallic (GGX) and fresnel-rim shaders are approximated; UV scroll and UV step animate.
//
// Pre-Fox (.model) materials come from .mtl files instead (wiki: "Pre-Fox" .mtl file): the shader name
// plus states. alphablend = blended, alphatest = cut out below alpharef (0–255), twosided, ztest / zwrite.
// Shadeless and Constant draw unlit; every other shader is drawn lit with its DiffuseMap.

import * as THREE from 'three';
import { options } from '../core/options.js';
import { texturePath } from '../export/texture-lookup.js';
import { gpuTexture, timingTexture } from './textures.js';

// ---------------------------------------------------------------- reading a material instance

/** A material parameter's i-th value, or fallback if it's missing. */
export const param = (mi, name, i = 0, fallback = 0) => {
  const p = mi.parameters.find(([n]) => n.toLowerCase() === name.toLowerCase());
  return p && Number.isFinite(p[1][i]) ? p[1][i] : fallback;
};

/** What kind of shader a material uses: { forward, kind, anim, label }. */
export function classify(mi) {
  if (mi.prefox) return classifyPreFox(mi.prefox);
  const tech = `${mi.technique} ${mi.shader}`.toLowerCase();
  const forward = /3dfw/.test(tech);
  const kind = /glass/.test(tech) ? 'glass' : /constant/.test(tech) ? 'constant' : /ggx/.test(tech) ? 'ggx' : /incidence/.test(tech) ? 'fresnel' : 'blin';
  const anim = /uvscroll/.test(tech) ? 'scroll' : /uvstep/.test(tech) ? 'step' : null;
  const kindLabels = { glass: 'glass', constant: 'unlit', ggx: 'metallic', fresnel: 'fresnel rim', blin: 'lit' };
  const animLabels = { scroll: 'UV scroll', step: 'UV step' };
  const label = [forward ? 'forward' : 'deferred', kindLabels[kind], animLabels[anim]].filter(Boolean).join(' · ');
  return { forward, kind, anim, label };
}

function classifyPreFox({ shader, states, missing }) {
  const forward = states.alphablend >= 1;
  const kind = /shadeless|constant/i.test(shader) ? 'constant' : 'blin';
  const label = [
    'pre-Fox', missing ? 'material not found' : kind === 'constant' ? 'unlit' : 'lit',
    forward && 'blended', states.alphatest >= 1 && `alpha test ${states.alpharef ?? 0}`, states.twosided >= 1 && 'two-sided',
  ].filter(Boolean).join(' · ');
  return { forward, kind, anim: null, label };
}

// Texture roles the viewer draws with. DiffuseMap is Pre-Fox's base texture; LayerMap is the viewer's own, a texture
// layered over it by its alpha (edit hair's shell on the skin). The normal, specular and roughness
// maps (Fox and Pre-Fox names) are drawn on lit materials while "Normal and specular maps" is on.
const USED_ROLES = ['Base_Tex_SRGB', 'Base_Tex_LIN', 'MetalnessMap_Tex_LIN', 'GlassReflection_Tex_SRGB', 'Timing_Tex_LIN', 'DiffuseMap', 'LayerMap'];
const SURFACE_ROLES = {
  normal: ['NormalMap_Tex_NRM', 'NormalMap'],
  specular: ['SpecularMap_Tex_LIN', 'SpecularMap'],
  roughness: ['RoughnessMap_Tex_LIN', 'RoughnessMap'],
};
const isRole = (list, role) => list.some((r) => r.toLowerCase() === role.toLowerCase());

/** A normal, specular or roughness map that's the game's flat placeholder (dummy_nrm, dummy_srm…): nothing to draw. */
export const isPlaceholder = (role, ref) => Object.values(SURFACE_ROLES).some((list) => isRole(list, role)) && /^dummy_/i.test(ref.filename);
export const isUsedRole = (role) => isRole(USED_ROLES, role) || /^Base_Tex/i.test(role)
  || (options.surfaceMaps && Object.values(SURFACE_ROLES).some((list) => isRole(list, role)));
const roleRef = (mi, role) => mi.textures.find(([r]) => r.toLowerCase() === role.toLowerCase())?.[1] || null;

/**
 * A lit material's normal, specular and roughness maps (those its material names), as three.js material
 * settings. PES normal maps are DirectX-style (green down), hence the flipped y. Specular goes to
 * MeshPhysicalMaterial's specular intensity, so `physical` says whether that material is needed.
 */
function surfaceMaps(model, mi, mesh) {
  if (!options.surfaceMaps || !options.textures) return { settings: {}, physical: false };
  const map = (kind) => {
    const found = mi.textures.find(([role, ref]) => isRole(SURFACE_ROLES[kind], role) && !isPlaceholder(role, ref));
    const path = found && texturePath(model, found[1], mesh);
    return path ? gpuTexture(path, kind) : null;
  };
  const normal = map('normal'), specular = map('specular'), roughness = map('roughness');
  const settings = {};
  if (normal) Object.assign(settings, { normalMap: normal, normalScale: new THREE.Vector2(1, -1) });
  if (specular) Object.assign(settings, { specularIntensityMap: specular, specularIntensity: 1 });
  if (roughness) Object.assign(settings, { roughnessMap: roughness, roughness: 1 });
  return { settings, physical: !!specular };
}

/** A lit material: MeshStandardMaterial, or MeshPhysicalMaterial when it has a specular map. */
function litMaterial(params, model, mi, mesh) {
  const { settings, physical } = surfaceMaps(model, mi, mesh);
  return physical ? new THREE.MeshPhysicalMaterial({ ...params, ...settings }) : new THREE.MeshStandardMaterial({ ...params, ...settings });
}
const baseRole = (mi) => mi.textures.find(([r]) => /^(Base_Tex|DiffuseMap$)/i.test(r)) || null;

function textureFor(model, role, ref, mesh) {
  if (!ref || !options.textures) return null;
  // A Pre-Fox sampler says its own color space (srgb="1"); Fox roles end in _SRGB or _LIN.
  const srgb = ref.srgb ?? /_SRGB$/i.test(role);
  return gpuTexture(texturePath(model, ref, mesh), srgb ? 'srgb' : 'lin');
}

/** Every texture file the meshes need, so they can be decoded before the materials are built. */
export function texturesNeeded(meshObjects) {
  const paths = new Set();
  if (!options.textures) return paths;
  for (const { mesh, model } of meshObjects) {
    for (const [role, ref] of mesh.materialInstance.textures) {
      if (!isUsedRole(role) || isPlaceholder(role, ref)) continue;
      const path = texturePath(model, ref, mesh);
      if (path) paths.add(path);
    }
  }
  return paths;
}

// ---------------------------------------------------------------- UV animation

// Animated materials: { map, mi, cls } for UV scroll / UV step, { timing, mi, cls } for timing-texture UV step.
const animated = [];

export function clearAnimated() {
  for (const a of animated) a.map?.dispose();
  animated.length = 0;
}

const tileCounts = (mi) => {
  const u = Math.max(1, Math.round(param(mi, 'Tile_Count_U', 0, 1)));
  const v = Math.max(1, Math.round(param(mi, 'Tile_Count_V', 0, 1)));
  const used = Math.max(1, Math.min(u * v, Math.round(param(mi, 'Tiles_Used', 0, u * v))));
  return { u, v, used };
};

/**
 * UV step with a timing texture (wiki: "Timing textures"). Each pixel looks up the timing texture at its
 * timing UV (the mesh's second UV map), scrolled right by t / Seconds_Per_Timing_U_Cycle and down by
 * t / Seconds_Per_Timing_V_Cycle (0 = no scroll). The red channel picks the frame: R 0..255 spans frames
 * 1..Tiles_Used in equal bands, and alpha 0 hides the pixel (geometry animation: several poses in one
 * mesh, each visible only while its timing row is opaque). Seconds_Per_Animation_Cycle is ignored.
 */
function addTimingStep(material, mi, cls, timingMap) {
  const tiles = tileCounts(mi);
  const scaleToTiles = param(mi, 'Scale_UVs_To_Tiles', 0, 1) >= 0.5;
  const uniforms = {
    timingMap: { value: timingMap },
    timingScroll: { value: new THREE.Vector2() },
    tileCount: { value: new THREE.Vector2(tiles.u, tiles.v) },
    tilesUsed: { value: tiles.used },
    frameScale: { value: scaleToTiles ? new THREE.Vector2(1 / tiles.u, 1 / tiles.v) : new THREE.Vector2(1, 1) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'attribute vec2 timingUv;\nvarying vec2 vTimingUv;\n' +
      shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vTimingUv = timingUv;');
    shader.fragmentShader = 'uniform sampler2D timingMap; uniform vec2 timingScroll; uniform vec2 tileCount; uniform float tilesUsed; uniform vec2 frameScale;\nvarying vec2 vTimingUv;\n' +
      shader.fragmentShader.replace('#include <map_fragment>', `
  vec4 timingTexel = texture2D(timingMap, vTimingUv + timingScroll);
#ifdef USE_MAP
  float frameIdx = min(floor(timingTexel.r * tilesUsed), tilesUsed - 1.0);
  vec2 frameOff = vec2(mod(frameIdx, tileCount.x), floor(frameIdx / tileCount.x)) / tileCount;
  vec2 frameUv = vMapUv * frameScale;
  // Gradients from the continuous UV so frame changes don't cause mipmap seams.
  vec4 sampledDiffuseColor = textureGrad(map, frameUv + frameOff, dFdx(frameUv), dFdy(frameUv));
  diffuseColor *= sampledDiffuseColor;
#endif
  // The timing texel's alpha shows or hides geometry, which is how geometry animation works:
  // each pose of a mesh sits on its own row of the timing texture and is only opaque in its turn.
  diffuseColor.a *= timingTexel.a;`);
  };
  material.alphaTest = Math.max(material.alphaTest, 0.01); // discard pixels the timing texture hides
  material.customProgramCacheKey = () => `timingstep-${cls.kind}`;
  animated.push({ timing: uniforms, mi, cls });
  return material;
}

/**
 * Move animated textures to time t (seconds).
 * UV scroll: UV0_Speed_U/V full scrolls per second, from Offset.
 * UV step: a flipbook of Tile_Count_U × Tile_Count_V frames, Tiles_Used of them, over Seconds_Per_Animation_Cycle.
 * UV step with a timing texture is driven per pixel in the shader (see addTimingStep).
 */
export function updateUvAnimations(t) {
  const on = options.animateUv;
  for (const { map, timing, mi, cls } of animated) {
    if (timing) {
      const su = param(mi, 'Seconds_Per_Timing_U_Cycle'), sv = param(mi, 'Seconds_Per_Timing_V_Cycle');
      timing.timingScroll.value.set(on && su > 0 ? t / su : 0, on && sv > 0 ? t / sv : 0);
    } else if (cls.anim === 'scroll') {
      const offset = param(mi, 'Offset');
      map.offset.set(offset + (on ? param(mi, 'UV0_Speed_U') * t : 0), offset + (on ? param(mi, 'UV0_Speed_V') * t : 0));
    } else {
      const tiles = tileCounts(mi);
      const cycle = Math.max(0.01, param(mi, 'Seconds_Per_Animation_Cycle', 0, 1));
      const frame = on ? Math.floor((t / cycle) * tiles.used) % tiles.used : 0;
      if (param(mi, 'Scale_UVs_To_Tiles', 0, 1) >= 0.5) map.repeat.set(1 / tiles.u, 1 / tiles.v);
      map.offset.set((frame % tiles.u) / tiles.u, Math.floor(frame / tiles.u) / tiles.v);
    }
  }
}

// ---------------------------------------------------------------- building materials

/** The material for one mesh of a model, using whatever textures are decoded. */
export function makeMaterial(mesh, model) {
  const mi = mesh.materialInstance, cls = classify(mi);
  const base = baseRole(mi);
  let map = base ? textureFor(model, base[0], base[1], mesh) : null;
  // Timing-texture UV step needs the timing texture and a second (timing) UV map on the mesh.
  if (cls.anim === 'step' && param(mi, 'Use_Timing_Texture') >= 0.5 && mesh.vertices.uv[1] && options.textures) {
    const ref = roleRef(mi, 'Timing_Tex_LIN');
    const timingMap = ref ? timingTexture(texturePath(model, ref)) : null;
    if (timingMap) return addTimingStep(materialFor(mesh, model, map, cls), mi, cls, timingMap);
  }
  if (map && cls.anim) { // its own copy, so its UV offset can animate independently (shares the GPU image)
    map = map.clone();
    map.needsUpdate = true;
    animated.push({ map, mi, cls });
  }
  return materialFor(mesh, model, map, cls);
}

/** A Pre-Fox material, following its .mtl states, with its tint and layer if it has them. */
function preFoxMaterial(mesh, model, map, cls) {
  const mi = mesh.materialInstance;
  const { states } = mi.prefox;
  const common = {
    color: map ? 0xffffff : 0xb9c4bd,
    map,
    side: options.backFaces || states.twosided >= 1 ? THREE.DoubleSide : THREE.FrontSide,
    wireframe: options.wireframe,
    depthTest: (states.ztest ?? 1) >= 1,
    depthWrite: (states.zwrite ?? 1) >= 1,
    transparent: !!map && cls.forward,
    // Alpha test drops pixels at or below alpharef; blending drops only fully transparent ones.
    alphaTest: !map ? 0 : states.alphatest >= 1 ? Math.min(1, ((states.alpharef ?? 0) + 1) / 255) : cls.forward ? 0.01 : 0,
  };
  const material = cls.kind === 'constant' ? new THREE.MeshBasicMaterial(common)
    : litMaterial({ ...common, roughness: 0.75, metalness: 0, envMapIntensity: 0.35 }, model, mi, mesh);
  if (map && mi.tint) addOverlayTint(material, mi.tint);
  const layerRef = map && roleRef(mi, 'LayerMap'), layer = layerRef && textureFor(model, 'LayerMap', layerRef, mesh);
  if (layer) addLayer(material, layer, mi.layerTint);
  return material;
}

// GLSL: color a gray texel by overlay, in sRGB. Mid-gray becomes the tint, darker and lighter texels darken and
// lighten it, so the texture keeps its shading in any color.
const OVERLAY_GLSL = `
  vec3 overlayTint(vec3 texel, vec3 tint) {
    vec3 base = pow(texel, vec3(1.0 / 2.2)), c = pow(tint, vec3(1.0 / 2.2));
    return pow(mix(2.0 * base * c, 1.0 - 2.0 * (1.0 - base) * (1.0 - c), step(0.5, base)), vec3(2.2));
  }`;

const linearTint = (tint) => {
  const color = new THREE.Color().setRGB(...tint, THREE.SRGBColorSpace);
  return new THREE.Vector3(color.r, color.g, color.b);
};

/** Color a gray texture (edit hair's strands) by overlay with a tint ([r, g, b], sRGB 0–1). */
function addOverlayTint(material, tint) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.tint = { value: linearTint(tint) };
    shader.fragmentShader = `uniform vec3 tint;\n${OVERLAY_GLSL}\n${shader.fragmentShader}`
      .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = overlayTint(diffuseColor.rgb, tint);');
  };
  material.customProgramCacheKey = () => 'overlay-tint';
}

/**
 * Layer a texture over the base texture by its alpha (edit hair's shell on the skin), on the base texture's UVs,
 * tinted by overlay when there's a tint.
 */
function addLayer(material, layer, tint) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      layerMap: { value: layer }, layerTint: { value: linearTint(tint || [0.5, 0.5, 0.5]) }, layerTinted: { value: tint ? 1 : 0 },
    });
    shader.fragmentShader = `uniform sampler2D layerMap;\nuniform vec3 layerTint;\nuniform float layerTinted;\n${OVERLAY_GLSL}\n${shader.fragmentShader}`
      .replace('#include <map_fragment>', `#include <map_fragment>
  {
    vec4 layer = texture2D(layerMap, vMapUv);
    vec3 color = layerTinted > 0.5 ? overlayTint(layer.rgb, layerTint) : layer.rgb;
    diffuseColor.rgb = mix(diffuseColor.rgb, color, layer.a);
  }`);
  };
  material.customProgramCacheKey = () => 'layer';
}

function materialFor(mesh, model, map, cls) {
  const mi = mesh.materialInstance;
  if (mi.prefox) return preFoxMaterial(mesh, model, map, cls);
  const twoSided = !!(mesh.alphaFlags & 0x20);
  const common = {
    color: map ? 0xffffff : 0xb9c4bd,
    map,
    side: options.backFaces || twoSided ? THREE.DoubleSide : THREE.FrontSide,
    wireframe: options.wireframe,
  };
  if (cls.forward) {
    // Forward shaders always blend. Keep depth writes on (except glass) so nearer opaque parts still
    // hide what's behind them, and drop fully transparent pixels.
    Object.assign(common, { transparent: !!map, alphaTest: map ? 0.01 : 0, depthWrite: cls.kind !== 'glass' });
  } else {
    // Deferred shaders can't blend; the game dithers instead. Alpha-to-coverage is the same idea.
    const useAlpha = !!map && !!(mesh.alphaFlags & 0x80);
    Object.assign(common, { alphaTest: useAlpha ? 0.02 : 0, alphaToCoverage: useAlpha, transparent: false, depthWrite: true });
  }

  if (cls.kind === 'constant') return new THREE.MeshBasicMaterial(common);

  if (cls.kind === 'glass') {
    const reflection = textureFor(model, 'GlassReflection_Tex_SRGB', roleRef(mi, 'GlassReflection_Tex_SRGB'));
    let envMap = null;
    if (reflection) {
      envMap = reflection.clone();
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      envMap.needsUpdate = true;
    }
    return new THREE.MeshStandardMaterial({
      ...common, transparent: true, opacity: map ? 1 : 0.35, metalness: 0,
      roughness: THREE.MathUtils.clamp(param(mi, 'GlassRoughness'), 0.02, 1),
      envMap, envMapIntensity: param(mi, 'ReflectionIntensity', 0, 1),
    });
  }

  if (cls.kind === 'ggx') {
    const metalnessMap = textureFor(model, 'MetalnessMap_Tex_LIN', roleRef(mi, 'MetalnessMap_Tex_LIN'));
    return litMaterial({ ...common, roughness: 0.4, metalness: 1, metalnessMap, envMapIntensity: 1 }, model, mi, mesh);
  }

  const material = litMaterial({ ...common, roughness: 0.75, metalness: 0, envMapIntensity: 0.35 }, model, mi, mesh);
  if (cls.kind === 'fresnel') addFresnelRim(material, mi);
  return material;
}

/**
 * Rim color by angle of incidence. Incidence_Color is RGBA (alpha read as a 0–100 strength); a higher
 * Incidence_Roughness needs a more grazing angle. The game's exact falloff isn't documented.
 */
function addFresnelRim(material, mi) {
  const color = new THREE.Vector3(param(mi, 'Incidence_Color', 0, 1), param(mi, 'Incidence_Color', 1, 1), param(mi, 'Incidence_Color', 2, 1));
  const strength = THREE.MathUtils.clamp(param(mi, 'Incidence_Color', 3, 50) / 100, 0, 4);
  const power = Math.max(0.5, param(mi, 'Incidence_Roughness', 0, 4) * 0.5);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { rimColor: { value: color }, rimStrength: { value: strength }, rimPower: { value: power } });
    shader.fragmentShader = 'uniform vec3 rimColor; uniform float rimStrength; uniform float rimPower;\n' +
      shader.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n totalEmissiveRadiance += rimColor * rimStrength * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), rimPower);');
  };
  material.customProgramCacheKey = () => 'fresnel';
}
