// Exportuje originální díly figurky (LDraw) do JSON pro web: geometrie + montážní pozice.
import fs from 'fs';
import * as THREE from 'three';
import { toCreasedNormals, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { findLib, flatten, libLines, I } from './ldparse.mjs';
const SKIP = /(^|\/)(stud4|stud3|stud6|stud10|stud4a|stud3a)/;
const getLines = (name, lr) => { const f = findLib(name.toLowerCase(), lr); return f ? libLines(f.path) : null; };
function geo(ref) {
  const tris = []; const missing = new Set();
  flatten(getLines(ref, false), I, 16, false, tris, { lowres: false, missing, skip: SKIP }, getLines);
  const pos = new Float32Array(tris.length * 9);
  tris.forEach((t, k) => { for (let v = 0; v < 3; v++) pos.set(t.v[v], k * 9 + v * 3); });
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g = toCreasedNormals(g, Math.PI / 5); g.deleteAttribute('uv'); g = mergeVertices(g, 0.01);
  const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  return { pos: b64(new Float32Array(g.attributes.position.array)), nrm: b64(new Float32Array(g.attributes.normal.array)), idx: b64(new Uint32Array(g.index.array)), tris: g.index.count / 3 };
}
const parts = { hips: '3815b.dat', legR: '3816b.dat', legL: '3817b.dat', torso: '973.dat', armR: '3818.dat', armL: '3819.dat', hand: '3820.dat', head: '3626b.dat', legsShort: '41879a.dat' };
const hairs = (process.argv[3] || '62810,35701').split(',');
const out = { parts: {}, hairs: {} };
for (const [k, f] of Object.entries(parts)) out.parts[k] = geo(f);
for (const h of hairs) out.hairs[h] = geo(h + '.dat');
// montáž (LDraw jednotky, osa Y dolů), převzato z modelu 75878
out.assembly = {
  hips: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], legR: [0, 12, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], legL: [0, 12, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  torso: [0, -32, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  armR: [-15.552, -23, 0, 0.985, -0.17, 0, 0.17, 0.985, 0, 0, 0, 1], armL: [15.552, -23, 0, 0.985, 0.17, 0, -0.17, 0.985, 0, 0, 0, 1],
  handR: [-23.69, -5.226, -9.898, 0.985, -0.12, 0.12, 0.17, 0.696, -0.696, 0, 0.707, 0.707], handL: [23.69, -5.226, -9.898, 0.985, 0.12, -0.12, -0.17, 0.696, -0.696, 0, 0.707, 0.707],
  head: [0, -56, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], hair: [0, -56, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
};
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(Object.entries(out.parts).map(([k, v]) => k + ':' + v.tris).join(' '), '|', Object.entries(out.hairs).map(([k, v]) => k + ':' + v.tris).join(' '), fs.statSync(process.argv[2]).size);
