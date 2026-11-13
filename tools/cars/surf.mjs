// výšková mapa povrchu auta (LDraw: Y dolů) + bounding box; node surf.mjs model.mpd out.json [colors]
import fs from 'fs';
import { readMPD, findLib, flatten, libLines, mul, lineMat, I } from '../conv/ldparse.mjs';
const [file, out] = process.argv.slice(2);
const mpd = readMPD(file);
const getLines = (name, lr) => { const n = name.toLowerCase(); if (mpd.files.has(n)) return mpd.files.get(n); const f = findLib(n, lr); return f ? libLines(f.path) : null; };
const placements = [];
function walk(name, m, color) {
  for (const raw of mpd.files.get(name)) {
    const t = raw.trim().split(/\s+/);
    if (t[0] !== '1') continue;
    const ref = t.slice(14).join(' ').toLowerCase(); const code = +t[1]; const col = code === 16 ? color : code;
    const mm = mul(m, lineMat(t));
    if (mpd.files.has(ref) && !mpd.isPartFile(mpd.files.get(ref))) walk(ref, mm, col); else placements.push({ ref, col, m: mm });
  }
}
walk(mpd.main, I, 7);
const cache = new Map(), C = 4, H = new Map(), SX = new Map();
let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
const ap = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[9], m[3] * v[0] + m[4] * v[1] + m[5] * v[2] + m[10], m[6] * v[0] + m[7] * v[1] + m[8] * v[2] + m[11]];
for (const p of placements) {
  if (!cache.has(p.ref)) { const tris = []; flatten(getLines(p.ref, true) || [], I, 16, false, tris, { lowres: true, missing: new Set(), skip: /stud/ }, getLines); cache.set(p.ref, tris.flatMap((t) => t.v)); }
  for (const v0 of cache.get(p.ref)) {
    const v = ap(p.m, v0);
    for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], v[k]); mx[k] = Math.max(mx[k], v[k]); }
    const key = Math.round(v[0] / C) + ',' + Math.round(v[2] / C);
    if (!H.has(key) || v[1] < H.get(key)) H.set(key, v[1]);
    const ks = Math.round(v[2] / C) + ',' + Math.round(v[1] / C); // bok: max |x| pro (z, y)
    if (!SX.has(ks) || Math.abs(v[0]) > SX.get(ks)) SX.set(ks, Math.abs(v[0]));
  }
}
fs.writeFileSync(out, JSON.stringify({ n: placements.length, C, mn, mx, H: Object.fromEntries(H), SX: Object.fromEntries(SX) }));
console.log('placements', placements.length, 'min', mn.map(Math.round), 'max', mx.map(Math.round));
