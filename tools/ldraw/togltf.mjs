// LDraw model (.mpd) → glTF (.gltf + .bin) pro Blender: mesh pro každý (dílek, barva), uzel pro každé umístění.
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { toCreasedNormals, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { readMPD, findLib, flatten, libLines, mul, lineMat, I, loadColors, colorOf } from './ldparse.mjs';

const [file, outFile, keepFile] = process.argv.slice(2);
const SKIP = /(^|\/)(stud4|stud3|stud6|stud4a|stud3a|stud10|stud4f|stud4o|stud4s|stud4h|stud2s|stud16|stud12|stud17|stud18)|peghol|axlehol|axleho|connhol|beamhol|npeghol|confric|axl2hol|axl3hol|joint|tooth|gear|-4cylo|bush/;
const colors = loadColors();
const mpd = readMPD(file);
const getLines = (name, lr) => { const n = name.toLowerCase(); if (mpd.files.has(n)) return mpd.files.get(n); const f = findLib(n, lr); return f ? libLines(f.path) : null; };
const placements = []; let step = 0;
function walk(name, m, color) {
  for (const raw of mpd.files.get(name)) {
    const t = raw.trim().split(/\s+/);
    if (t[0] === '0' && t[1] === 'STEP') step++;
    if (t[0] !== '1') continue;
    const ref = t.slice(14).join(' ').toLowerCase(); const code = +t[1]; const col = code === 16 ? color : code;
    const mm = mul(m, lineMat(t));
    if (mpd.files.has(ref) && !mpd.isPartFile(mpd.files.get(ref))) walk(ref, mm, col);
    else placements.push({ ref, col, m: mm, step });
  }
}
walk(mpd.main, I, 7);
let used = placements;
if (keepFile && fs.existsSync(keepFile)) { const keep = new Set(JSON.parse(fs.readFileSync(keepFile, 'utf8'))); used = placements.filter((_, i) => keep.has(i)); }
if (!process.env.KEEP_ALL) { // volné kousky mimo auto pryč (u květin vypnuto: KEEP_ALL=1)
  const pct = (arr, q) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
  const lim = [9, 10, 11].map((k) => { const v = used.map((p) => p.m[k]); const lo = pct(v, 0.02), hi = pct(v, 0.98), e = (hi - lo) * 0.1 + 20; return [lo - e, hi + e]; });
  used = used.filter((p) => [9, 10, 11].every((k, j) => p.m[k] >= lim[j][0] && p.m[k] <= lim[j][1]));
}
// geometrie dílků rozdělené podle barvy (16 = barva umístění)
const partGeo = new Map();
function partGeometry(ref) {
  if (partGeo.has(ref)) return partGeo.get(ref);
  const tris = []; const missing = new Set();
  flatten(getLines(ref, true) || [], I, 16, false, tris, { lowres: true, missing, skip: SKIP }, getLines);
  const byCol = new Map();
  for (const t of tris) { if (!byCol.has(t.col)) byCol.set(t.col, []); byCol.get(t.col).push(t); }
  const prims = [];
  for (const [col, list] of byCol) {
    const pos = new Float32Array(list.length * 9);
    list.forEach((t, k) => { for (let v = 0; v < 3; v++) pos.set(t.v[v], k * 9 + v * 3); });
    let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g = mergeVertices(g, 0.01); g = g.toNonIndexed(); g = toCreasedNormals(g, Math.PI / 6); g.deleteAttribute('uv'); g = mergeVertices(g, 0.01);
    // LDU → výstupky, osa Y nahoru (otočení o 180° kolem X)
    g.applyMatrix4(new THREE.Matrix4().makeScale(1 / 20, -1 / 20, -1 / 20));
    g.index.array.reverse !== undefined && null;
    prims.push({ col, g });
  }
  partGeo.set(ref, prims);
  return prims;
}
// --- zápis glTF
const bufs = []; let off = 0;
const view = (typed, target) => { const pad = (4 - (off % 4)) % 4; if (pad) { bufs.push(Buffer.alloc(pad)); off += pad; } const b = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength); bufs.push(b); const v = { buffer: 0, byteOffset: off, byteLength: b.length }; if (target) v.target = target; off += b.length; return v; };
const gltf = { asset: { version: '2.0', generator: 'love-bricks togltf' }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [] };
const matIdx = new Map();
function material(code) {
  if (matIdx.has(code)) return matIdx.get(code);
  const c = colorOf(colors, code), col = new THREE.Color(c.hex); // sRGB → lineární
  const m = { name: 'ld_' + code, pbrMetallicRoughness: { baseColorFactor: [col.r, col.g, col.b, c.alpha], metallicFactor: c.metal ? 0.8 : 0, roughnessFactor: c.alpha < 1 ? 0.05 : 0.3 }, doubleSided: true };
  if (c.alpha < 1) m.alphaMode = 'BLEND';
  matIdx.set(code, gltf.materials.length); gltf.materials.push(m); return matIdx.get(code);
}
const accessorsCache = new Map(); // geometrie dílku se zapíše jen jednou
function accessorsFor(ref, k, g) {
  const key = ref + '#' + k; if (accessorsCache.has(key)) return accessorsCache.get(key);
  const P = g.attributes.position.array, N = g.attributes.normal.array, IX = g.index.array;
  const bb = new THREE.Box3().setFromBufferAttribute(g.attributes.position);
  const add = (typed, type, comp, target, extra = {}) => { gltf.bufferViews.push(view(typed, target)); gltf.accessors.push({ bufferView: gltf.bufferViews.length - 1, componentType: comp, count: typed.length / (type === 'VEC3' ? 3 : 1), type, ...extra }); return gltf.accessors.length - 1; };
  const r = {
    POSITION: add(new Float32Array(P), 'VEC3', 5126, 34962, { min: bb.min.toArray(), max: bb.max.toArray() }),
    NORMAL: add(new Float32Array(N), 'VEC3', 5126, 34962),
    indices: add(new Uint32Array(IX), 'SCALAR', 5125, 34963)
  };
  accessorsCache.set(key, r); return r;
}
const meshIdx = new Map();
function meshFor(ref, col) {
  const key = ref + '|' + col; if (meshIdx.has(key)) return meshIdx.get(key);
  const prims = partGeometry(ref).map((pr, k) => { const a = accessorsFor(ref, k, pr.g); return { attributes: { POSITION: a.POSITION, NORMAL: a.NORMAL }, indices: a.indices, material: material(pr.col === 16 ? col : pr.col) }; });
  gltf.meshes.push({ name: key, primitives: prims }); meshIdx.set(key, gltf.meshes.length - 1); return meshIdx.get(key);
}
const C = new THREE.Matrix4().makeScale(1 / 20, -1 / 20, -1 / 20), Ci = C.clone().invert();
used.forEach((p, i) => {
  const a = p.m, M = new THREE.Matrix4().set(a[0], a[1], a[2], a[9], a[3], a[4], a[5], a[10], a[6], a[7], a[8], a[11], 0, 0, 0, 1);
  const W = C.clone().multiply(M).multiply(Ci); // umístění v souřadnicích výstupků (geometrie už je převedená)
  gltf.nodes.push({ name: 'p' + i, mesh: meshFor(p.ref, p.col), matrix: W.elements, extras: { step: p.step, code: p.col } });
  gltf.scenes[0].nodes.push(gltf.nodes.length - 1);
});
const bin = Buffer.concat(bufs);
gltf.buffers.push({ byteLength: bin.length, uri: path.basename(outFile).replace(/\.gltf$/, '.bin') });
fs.writeFileSync(outFile, JSON.stringify(gltf));
fs.writeFileSync(outFile.replace(/\.gltf$/, '.bin'), bin);
console.log(path.basename(outFile), 'nodes', gltf.nodes.length, 'meshes', gltf.meshes.length, 'materials', gltf.materials.length, 'bin', bin.length);
