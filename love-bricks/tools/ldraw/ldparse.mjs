// Minimal LDraw parser: flattens a model into part placements + per-part triangle geometry.
import fs from 'fs';
import path from 'path';
export const LIB = process.env.LDRAW || '../ldraw/ldraw';

// ---------- colors
export function loadColors() {
  const m = new Map();
  for (const line of fs.readFileSync(path.join(LIB, 'LDConfig.ldr'), 'utf8').split(/\r?\n/)) {
    const r = line.match(/!COLOUR\s+(\S+)\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})\s+EDGE\s+\S+(.*)$/);
    if (!r) continue;
    const alpha = (r[4].match(/ALPHA\s+(\d+)/) || [])[1];
    const metal = /CHROME|METAL|PEARLESCENT/.test(r[4]);
    m.set(+r[2], { name: r[1], hex: '#' + r[3].toUpperCase(), alpha: alpha ? +alpha / 255 : 1, metal });
  }
  return m;
}
export function colorOf(colors, code) {
  if (colors.has(code)) return colors.get(code);
  if (code >= 0x2000000) return { name: 'direct', hex: '#' + (code & 0xffffff).toString(16).padStart(6, '0'), alpha: 1 };
  return { name: '?', hex: '#888888', alpha: 1 };
}

// ---------- library lookup
const dirs = ['parts', 'p', 'parts/s', 'models'];
const libCache = new Map();
export function findLib(name, lowres) {
  const n = name.toLowerCase().replace(/\\/g, '/');
  const key = n + (lowres ? '|8' : '');
  if (libCache.has(key)) return libCache.get(key);
  let found = null;
  const cands = [];
  if (lowres) cands.push(path.join(LIB, 'p/8', n));
  for (const d of dirs) cands.push(path.join(LIB, d, n));
  for (const c of cands) if (fs.existsSync(c)) { found = { path: c, isPart: c.includes('/parts/') && !c.includes('/parts/s/') && !n.startsWith('s/') }; break; }
  libCache.set(key, found);
  return found;
}

// ---------- MPD
export function readMPD(file) {
  const text = fs.readFileSync(file, 'utf8');
  const files = new Map(); let cur = null, first = null;
  for (const line of text.split(/\r?\n/)) {
    const f = line.match(/^0\s+FILE\s+(.+?)\s*$/);
    if (f) { cur = f[1].toLowerCase(); files.set(cur, []); if (!first) first = cur; continue; }
    if (/^0\s+NOFILE/.test(line)) { cur = null; continue; }
    if (cur) files.get(cur).push(line);
  }
  if (!first) { first = path.basename(file).toLowerCase(); files.set(first, text.split(/\r?\n/)); }
  const isPartFile = (lines) => lines.some(l => /^0\s+!LDRAW_ORG\s+.*(Part|Shortcut|Unofficial_Part|Unofficial_Shortcut)/i.test(l));
  return { files, main: first, isPartFile };
}

// ---------- geometry flattening (part → triangles)
const fileLines = new Map();
function libLines(p) { if (!fileLines.has(p)) fileLines.set(p, fs.readFileSync(p, 'latin1').split(/\r?\n/)); return fileLines.get(p); }
function mul(a, b) { // 4x4 row-major-ish affine [a b c x; d e f y; g h i z]
  return [
    a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
    a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
    a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8],
    a[0]*b[9]+a[1]*b[10]+a[2]*b[11]+a[9], a[3]*b[9]+a[4]*b[10]+a[5]*b[11]+a[10], a[6]*b[9]+a[7]*b[10]+a[8]*b[11]+a[11]
  ];
}
const det = (m) => m[0]*(m[4]*m[8]-m[5]*m[7]) - m[1]*(m[3]*m[8]-m[5]*m[6]) + m[2]*(m[3]*m[7]-m[4]*m[6]);
const ap = (m, x, y, z) => [m[0]*x+m[1]*y+m[2]*z+m[9], m[3]*x+m[4]*y+m[5]*z+m[10], m[6]*x+m[7]*y+m[8]*z+m[11]];
export const I = [1,0,0,0,1,0,0,0,1,0,0,0];
export function lineMat(t) { // t = tokens of a type-1 line
  const [x,y,z,a,b,c,d,e,f,g,h,i] = t.slice(2, 14).map(Number);
  return [a,b,c,d,e,f,g,h,i,x,y,z];
}
// emits triangles: out.push({col, v:[[x,y,z]x3]}) with CCW orientation when certified
export function flatten(lines, m, color, invert, out, opts, getLines, depth = 0) {
  let ccw = true, certified = false, invNext = false;
  for (const raw of lines) {
    const line = raw.trim(); if (!line) continue;
    const t = line.split(/\s+/);
    if (t[0] === '0') {
      if (t[1] === 'BFC') {
        if (line.includes('CERTIFY')) { certified = true; if (line.includes('CW') && !line.includes('CCW')) ccw = false; }
        else if (line.includes('INVERTNEXT')) invNext = true;
        else if (line.includes(' CCW')) ccw = true; else if (line.includes(' CW')) ccw = false;
      }
      continue;
    }
    const code = +t[1]; const col = code === 16 ? color : code === 24 ? -1 : code;
    if (t[0] === '1') {
      const name = t.slice(14).join(' ');
      if (opts.skip && opts.skip.test(name.toLowerCase())) { invNext = false; continue; }
      const sub = getLines(name, opts.lowres);
      if (!sub) { opts.missing.add(name); invNext = false; continue; }
      const mm = mul(m, lineMat(t));
      const inv = invert !== (invNext !== (det(lineMat(t)) < 0));
      flatten(sub, mm, col, inv, out, opts, getLines, depth + 1);
      invNext = false;
    } else if (t[0] === '3' || t[0] === '4') {
      if (col === -1) continue;
      const n = t[0] === '3' ? 3 : 4;
      const pts = []; for (let k = 0; k < n; k++) pts.push(ap(m, +t[2+k*3], +t[3+k*3], +t[4+k*3]));
      let flip = (!ccw) !== invert;
      const ds = !certified;
      const tri = (a, b, c) => out.push({ col, ds, v: flip ? [a, c, b] : [a, b, c] });
      tri(pts[0], pts[1], pts[2]); if (n === 4) tri(pts[0], pts[2], pts[3]);
    }
  }
}
export { libLines, mul, det };
