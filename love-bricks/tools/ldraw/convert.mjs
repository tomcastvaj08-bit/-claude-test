// LDraw model → .lbm (Love Bricks Model): unique part geometries + placements, compact binary.
import fs from 'fs';
import * as THREE from 'three';
import { toCreasedNormals, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
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
let keep = null;
if (keepFile && fs.existsSync(keepFile)) keep = new Set(JSON.parse(fs.readFileSync(keepFile, 'utf8')));
let used = keep ? placements.filter((_, i) => keep.has(i)) : placements;
// volné kousky mimo auto (klíček, štítek, stojánek) pryč
{
  const pct = (arr, q) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
  const lim = [9, 10, 11].map((k) => { const v = used.map((p) => p.m[k]); const lo = pct(v, 0.02), hi = pct(v, 0.98), e = (hi - lo) * 0.1 + 20; return [lo - e, hi + e]; });
  const before = used.length;
  used = used.filter((p) => [9, 10, 11].every((k, j) => p.m[k] >= lim[j][0] && p.m[k] <= lim[j][1]));
  console.log('outliers removed', before - used.length);
}

// unique geometries
const geomIndex = new Map(); const geoms = [];
for (const p of used) {
  if (geomIndex.has(p.ref)) continue;
  const tris = []; const missing = new Set();
  flatten(getLines(p.ref, true) || [], I, 16, false, tris, { lowres: true, missing, skip: SKIP }, getLines);
  const pos = new Float32Array(tris.length * 9), col = new Float32Array(tris.length * 9), fix = new Float32Array(tris.length * 3);
  tris.forEach((tr, k) => {
    for (let v = 0; v < 3; v++) {
      pos.set(tr.v[v], k * 9 + v * 3);
      const c = tr.col === 16 ? null : colorOf(colors, tr.col);
      const rgb = c ? new THREE.Color(c.hex) : new THREE.Color(1, 1, 1);
      col.set([rgb.r, rgb.g, rgb.b], k * 9 + v * 3);
      fix[k * 3 + v] = c ? 1 : 0;
    }
  });
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('vfix', new THREE.BufferAttribute(fix, 1));
  // 1) svaření vrcholů (bez normál), 2) zjednodušení, 3) hladké normály s ostrými hranami
  g = mergeVertices(g, 0.01);
  if (process.env.SIMPLIFY && g.index.count > 240) {
    const pos = g.attributes.position.array, idx = new Uint32Array(g.index.array);
    const target = Math.floor((idx.length * Number(process.env.SIMPLIFY)) / 3) * 3;
    const [res] = MeshoptSimplifier.simplify(idx, pos, 3, target, Number(process.env.SERR || 0.012), []);
    if (res.length >= 3) g.setIndex(new THREE.BufferAttribute(res, 1));
  }
  g = g.toNonIndexed();
  g = toCreasedNormals(g, Math.PI / 6);
  g.deleteAttribute('uv');
  g = mergeVertices(g, 0.01);
  geomIndex.set(p.ref, geoms.length);
  geoms.push({ ref: p.ref, g, tris: tris.length });
}
// binary packing
const chunks = []; let off = 0;
const push = (typed) => { const pad = (4 - (off % 4)) % 4; if (pad) { chunks.push(new Uint8Array(pad)); off += pad; } const b = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength); chunks.push(b); const o = off; off += b.byteLength; return o; };
const gmeta = geoms.map(({ ref, g }) => {
  const P = g.attributes.position.array, N = g.attributes.normal.array, Cc = g.attributes.color.array, F = g.attributes.vfix.array;
  const n = P.length / 3;
  const nrm = new Int8Array(n * 3); for (let i = 0; i < n * 3; i++) nrm[i] = Math.round(N[i] * 127);
  const c8 = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { c8[i * 4] = Math.round(Cc[i * 3] * 255); c8[i * 4 + 1] = Math.round(Cc[i * 3 + 1] * 255); c8[i * 4 + 2] = Math.round(Cc[i * 3 + 2] * 255); c8[i * 4 + 3] = F[i] > 0.5 ? 255 : 0; }
  const idx = g.index.array; const ix = n < 65536 ? new Uint16Array(idx) : new Uint32Array(idx);
  return { ref, n, pos: push(new Float32Array(P)), nrm: push(nrm), col: push(c8), idx: push(ix), ni: ix.length, i32: ix instanceof Uint32Array };
});
const pm = new Float32Array(used.length * 12), pg = new Int32Array(used.length), pc = new Int32Array(used.length), ps = new Int32Array(used.length);
used.forEach((p, i) => { pm.set(p.m, i * 12); pg[i] = geomIndex.get(p.ref); pc[i] = p.col; ps[i] = p.step; });
const place = { m: push(pm), g: push(pg), c: push(pc), s: push(ps), n: used.length };
const usedColors = {}; for (const p of used) { const c = colorOf(colors, p.col); usedColors[p.col] = [c.hex, c.alpha, c.metal ? 1 : 0, c.name]; }
const header = JSON.stringify({ v: 1, name: mpd.main, geoms: gmeta, place, colors: usedColors, steps: step });
const hb = new TextEncoder().encode(header);
const hl = new Uint32Array([hb.length]);
const body = new Uint8Array(off); let o2 = 0; for (const c of chunks) { body.set(c, o2); o2 += c.byteLength; }
const hpad = (4 - ((4 + hb.length) % 4)) % 4;
fs.writeFileSync(outFile, Buffer.concat([Buffer.from(hl.buffer), Buffer.from(hb), Buffer.alloc(hpad), Buffer.from(body)]));
const totalTris = used.reduce((a, p) => a + geoms[geomIndex.get(p.ref)].g.index.count / 3, 0);
console.log(outFile.split('/').pop(), 'placements', used.length, 'geoms', geoms.length, 'tris', Math.round(totalTris), 'bytes', fs.statSync(outFile).size, 'colors', Object.values(usedColors).map(c => c[3]).join(','));
