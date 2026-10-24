// mtl.js — Pre-Fox PES (PES 16 / 17) materials: the .xml that lists a folder's .model files and the
// .mtl each one uses, and the .mtl files themselves (implyingrigged.info wiki, "Pre-Fox" .mtl file):
//
//   <materialset>
//     <material name="hair" shader="Basic_C">
//       <sampler name="DiffuseMap" path="./hair_c.dds" srgb="1" … />
//       <state name="alphablend" value="1" />
//       <vector name="Reflection" x="1" y="1" z="1" w="0" />
//     </material>
//   </materialset>
//
// A .model only stores each mesh's material name; it's looked up in the .mtl. Texture paths are relative
// to the .mtl's folder.

import { normPath, dirOf, fileOf } from './aet.js';

/** Parse XML leniently: as XML, else as HTML (which tolerates stray text and broken markup). */
function parseMarkup(text) {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (!xml.querySelector('parsererror')) return xml;
  return new DOMParser().parseFromString(text, 'text/html');
}

/** Join a path from a file with the folder it's relative to, resolving "." and "..". */
export function resolveRelative(dir, path) {
  const parts = dir ? dir.split('/') : [];
  for (const part of normPath(path).split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

/**
 * The models an .xml lists: [{ model, mtl, type }] as written, relative to the .xml's folder. Any element
 * with an attribute naming a .model file counts; its .mtl is the attribute naming a .mtl file, if any, and
 * its type the type attribute ("face_neck", "parts", "gloveL", "gloveR", "uniform"…), if any.
 */
export function parseModelXml(text) {
  const out = [];
  for (const element of parseMarkup(text).querySelectorAll('*')) {
    const values = [...element.attributes].map((a) => a.value.trim());
    const model = values.find((v) => /\.model$/i.test(v));
    if (model) out.push({ model, mtl: values.find((v) => /\.mtl$/i.test(v)) || null, type: element.getAttribute('type') || null });
  }
  return out;
}

/**
 * Parse an .mtl: Map material name -> { name, shader, samplers: [{ name, path, srgb }], states: { name: number },
 * vectors: [[name, [x, y, z, w]]] }.
 */
export function parseMtl(text) {
  const materials = new Map();
  const number = (v, fallback = 0) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : fallback);
  for (const element of parseMarkup(text).querySelectorAll('material')) {
    const name = element.getAttribute('name');
    if (!name || materials.has(name)) continue;
    const children = (tag) => [...element.querySelectorAll(tag)];
    materials.set(name, {
      name,
      shader: element.getAttribute('shader') || '',
      samplers: children('sampler').map((s) => ({
        name: s.getAttribute('name') || '', path: s.getAttribute('path') || '', srgb: s.getAttribute('srgb') === '1',
      })).filter((s) => s.name && s.path),
      states: Object.fromEntries(children('state').map((s) => [(s.getAttribute('name') || '').toLowerCase(), number(s.getAttribute('value'))])),
      vectors: children('vector').map((v) => [v.getAttribute('name') || '', ['x', 'y', 'z', 'w'].map((k) => number(v.getAttribute(k)))]),
    });
  }
  return materials;
}

/**
 * Material instances for a parsed .model's meshes, in the shape .fmdl materials have, from its .mtl
 * (null if it has none) in folder mtlDir. Sets each mesh's materialInstance. Returns the names of
 * materials the .mtl doesn't define.
 *
 * Each instance has `prefox`: { shader, states, missing }, and texture refs carry `baseDir` (the folder the
 * path points to) and `srgb` (from the sampler).
 *
 * `uniform`: the model is listed in its .xml as type="uniform". The game then draws every mesh with the
 * kit's main texture, whatever the .mtl's DiffuseMap says (or with none there), so DiffuseMap becomes the
 * selected kit's texture in Kit Textures, as dummy_kit does in .fmdl materials.
 */
export function attachMaterials(parsed, mtl, mtlDir, { uniform = false } = {}) {
  const instances = new Map(), missing = [];
  const lower = mtl && new Map([...mtl.values()].map((m) => [m.name.toLowerCase(), m]));
  const kitTexture = ['DiffuseMap', { filename: 'dummy_kit.dds', directory: '/Assets/pes16/model/character/uniform/texture/', srgb: true }];
  for (const name of parsed.materialNames) {
    const def = mtl && (mtl.get(name) || lower.get(name.toLowerCase()));
    if (!def) missing.push(name);
    const textures = (def?.samplers || []).map((s) => {
      const path = normPath(s.path.replace(/^\.\//, '')), dir = dirOf(path);
      return [s.name, { filename: fileOf(path), directory: dir ? `./${dir}/` : './', baseDir: resolveRelative(mtlDir, dir), srgb: s.srgb }];
    });
    if (uniform) textures.splice(0, textures.length, kitTexture, ...textures.filter(([role]) => role.toLowerCase() !== 'diffusemap'));
    instances.set(name, {
      name,
      shader: def ? def.shader : '',
      technique: def ? def.shader : mtl ? 'not in the .mtl' : 'no .mtl',
      textures,
      parameters: def ? def.vectors : [],
      prefox: { shader: def ? def.shader : '', states: def ? def.states : {}, missing: !def },
    });
  }
  parsed.materialInstances = [...instances.values()];
  for (const mesh of parsed.meshes) mesh.materialInstance = instances.get(mesh.materialName);
  return missing;
}
