// Mini DSL pro skládání květin z dílků LDraw (souřadnice LDU, osa Y dolů = LDraw).
import fs from 'fs';
export const D = Math.PI / 180;
export const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export const rx = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
export const ry = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
export const rz = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
export function mul(...ms) { return ms.reduce((A, B) => { const r = new Array(9).fill(0); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j]; return r; }); }
export const apply = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => scl(a, 1 / (len(a) || 1));
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const lerp = (a, b, t) => add(a, scl(sub(b, a), t));
// matice, která pošle místní osu +Y do směru d (sloupce = obrazy os), twist = otočení kolem d
export function alignY(d, twist = 0) {
  const y = norm(d);
  let ref = Math.abs(y[1]) < 0.9 ? [0, -1, 0] : [0, 0, 1];
  let x = norm(cross(ref, y)), z = cross(x, y);
  if (twist) { const c = Math.cos(twist), s = Math.sin(twist); const x2 = add(scl(x, c), scl(z, s)), z2 = add(scl(z, c), scl(x, -s)); x = x2; z = z2; }
  return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
}
// natočení: místní -Y (strana s výstupkem / líc květu) míří do směru n
export const face = (n, twist = 0) => alignY(scl(n, -1), twist);
let seed = 1;
export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const setSeed = (s) => { seed = s; };
export class Build {
  constructor(name) { this.name = name; this.lines = []; this.n = 0; }
  part(id, col, pos, M = I3) {
    const f = (v) => (Math.abs(v) < 1e-6 ? 0 : +v.toFixed(4));
    this.lines.push(`1 ${col} ${pos.map(f).join(' ')} ${M.map(f).join(' ')} ${id}.dat`); this.n++;
    return this;
  }
  // stonek z tyček podél lomené čáry (body po sobě), tyčka 3L = 60 LDU
  stem(points, col, { part = '87994', L = 60 } = {}) {
    const pts = resample(points, L);
    for (let i = 0; i + 1 < pts.length; i++) this.part(part, col, pts[i], alignY(sub(pts[i + 1], pts[i])));
    return pts;
  }
  save(file) { fs.writeFileSync(file, `0 FILE ${this.name}.ldr\n0 ${this.name}\n0 Name: ${this.name}.ldr\n0 Author: Love Bricks\n\n` + this.lines.join('\n') + '\n'); return this; }
}
export function bezier(p0, p1, p2, p3, n = 40) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push(add(add(scl(p0, u * u * u), scl(p1, 3 * u * u * t)), add(scl(p2, 3 * u * t * t), scl(p3, t * t * t)))); } return o; }
export function resample(pts, L) {
  const out = [pts[0]]; let acc = 0, prev = pts[0];
  for (let i = 1; i < pts.length; i++) {
    let a = prev, b = pts[i], d = len(sub(b, a));
    while (acc + d >= L) { const t = (L - acc) / d; const p = lerp(a, b, t); out.push(p); a = p; d = len(sub(b, a)); acc = 0; }
    acc += d; prev = b;
  }
  return out;
}
// prstenec dílků po kružnici (osa Y): r poloměr, n kusů, y výška, natočení k ose
export function ring(b, id, col, r, n, y, { phase = 0, extra = I3, cx = 0, cz = 0 } = {}) {
  for (let k = 0; k < n; k++) { const a = phase + (k / n) * Math.PI * 2; b.part(id, col, [cx + Math.sin(a) * r, y, cz + Math.cos(a) * r], mul(ry(a), extra)); }
}
// široký list ze dvou klínů (Wing 3x8 pentagonal L+P): střed listu v c, matice M (místní z = podél listu)
export function leaf(b, col, c, M, { size = 8 } = {}) {
  const [R, L, w] = size === 8 ? ['50304', '50305', 30] : size === 6 ? ['54383', '54384', 30] : ['41769', '41770', 20];
  b.part(R, col, add(c, apply(M, [w, 0, 0])), M);
  b.part(L, col, add(c, apply(M, [-w, 0, 0])), M);
}
// válec 8x8 z rohových kostek 4x4 (lv úrovní od y0 dolů)
export function pot8(b, col, lv, y0 = 0) { for (let l = 0; l < lv; l++) for (let q = 0; q < 4; q++) b.part('2577', col, [0, y0 + 24 * l, 0], ry(q * Math.PI / 2)); }
// pásek z dlaždic 1x2 po obvodu (tečně), r poloměr, y výška
export function band(b, col, r, y, n, id = '3069b') { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.part(id, col, [Math.sin(a) * r, y, Math.cos(a) * r], mul(ry(a), rx(-Math.PI / 2))); } }
export const I3c = () => [1, 0, 0, 0, 1, 0, 0, 0, 1];
// květ ze 4 okvětních lístků (Plant Leaves 4x3) do kalichu: base = spodek květu, up = osa květu
export function cup(b, col, base, up, { n = 4, open = 18, id = '2423', r = 8, twist = 0 } = {}) {
  const U = alignY(scl(up, -1)); // místní -Y = up
  for (let k = 0; k < n; k++) {
    const a = twist + (k / n) * Math.PI * 2;
    // lístek: místní -z = špička; zvednout špičku nahoru (rx -90+open) a natočit kolem osy
    const M = mul(U, ry(a), rx((-90 + open) * Math.PI / 180));
    b.part(id, col, add(base, apply(U, [Math.sin(a) * r, 0, Math.cos(a) * r].map((v, i) => (i === 1 ? 0 : v)))), M);
  }
}
// tulipán: obrácená kopule 2x2 + 4 oblé díly 2x1 jako okvětní lístky (base = střed kalichu, up = osa)
export function tulip(b, col, base, up, twist = 0, lean = 6) {
  const U = mul(alignY(scl(up, -1)), ry(twist)); // místní -Y = up
  b.part('30367a', col, add(base, apply(U, [0, 30, 0])), mul(U, rx(Math.PI)));
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; b.part('11477', col, add(base, apply(U, [Math.sin(a) * 12, 0, Math.cos(a) * 12])), mul(U, ry(a), rx((-90 - lean) * Math.PI / 180))); }
}
// matice ze sloupců (obrazy místních os x, y, z)
export const basis = (ex, ey, ez) => [ex[0], ey[0], ez[0], ex[1], ey[1], ez[1], ex[2], ey[2], ez[2]];
// hladký klenutý list ze tří oblých dílů 6x1 (střední delší); a = směr ven (úhel kolem Y), tilt = zvednutí
export function leaf6(b, col, base, a, tilt = 0, roll = 0) {
  const M = mul(ry(a + Math.PI), rx(-tilt), rz(roll));
  for (const [dx, dz] of [[-20, 0], [0, -20], [20, 0]]) b.part('42022', col, add(base, apply(M, [dx, 0, dz])), M);
}
// silný stonek z kulatých kostek 1x1 podél křivky (body zdola nahoru)
export function stalk(b, col, pts0, id = '3062b') {
  const pts = resample(pts0, 24);
  for (let i = 0; i + 1 < pts.length; i++) b.part(id, col, pts[i + 1], alignY(sub(pts[i], pts[i + 1])));
  return pts;
}
// kuželový květináč z lamel (dlaždice 1x6 svisle): r poloměr nahoře, n lamel, taper = zúžení dolů
export function slatPot(b, col, r, n, { y0 = 0, taper = 0.12, id = '6636', half = 60 } = {}) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, out = [Math.sin(a), 0, Math.cos(a)];
    const ex = norm([-out[0] * taper, 1, -out[2] * taper]); // dlouhá osa dílu míří dolů a dovnitř
    const ey0 = scl(out, -1); const ez = norm(cross(ex, ey0)); const ey = cross(ez, ex);
    const c = add([out[0] * (r - taper * half), y0 + half, out[2] * (r - taper * half)], [0, 0, 0]);
    b.part(id, col, c, basis(ex, ey, ez));
  }
}
