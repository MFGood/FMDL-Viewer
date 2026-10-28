// Adds the left eyeball's shape to face-shape.json: eyeHi's left-eye vertices as offsets from skf_eye_l's bind (mm precision).
import fs from 'fs';
const { parseModel } = await import('./jsmod/formats/model.js');
const b = fs.readFileSync('C:/GitHub/fmdlviewer.github.io/assets/defaults/face/eyeHi.model');
const m = await parseModel(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
const v = m.meshes[0].vertices, out = [];
for (let i = 0; i < v.count; i++) {
  const bone = v.skinBones[i * 4]; if (bone?.name !== 'skf_eye_l') continue;
  const c = bone.globalPosition; out.push(...[v.position[i * 3] - c.x, v.position[i * 3 + 1] - c.y, v.position[i * 3 + 2] - c.z].map((x) => Math.round(x * 1e5) / 1e5));
}
const p = 'C:/GitHub/fmdlviewer.github.io/assets/defaults/face/face-shape.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8')); data.eyeball = out;
fs.writeFileSync(p, JSON.stringify(data));
console.log('eye vertices', out.length / 3);
