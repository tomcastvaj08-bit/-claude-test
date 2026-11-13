// Přidá do modelu auta ohebné hadičky („špagety“) vedené po povrchu karoserie.
// node hoses.mjs model.mpd surf.json out.mpd keepIn.json keepOut.json spec
import fs from 'fs';
const [src, surfF, dst, keepIn, keepOut, spec] = process.argv.slice(2);
const S = JSON.parse(fs.readFileSync(surfF, 'utf8')), C = S.C;
const H = new Map(Object.entries(S.H).map(([k, v]) => [k, v]));
const top = (x, z) => { let best; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const v = H.get(Math.round(x / C + dx) + ',' + Math.round(z / C + dz)); if (v !== undefined && (best === undefined || v < best)) best = v; } return best; };
// nejvzdálenější x (na straně s), kde je karoserie výš než ythr
const edgeX = (z, s, ythr) => { for (let x = 260; x > 0; x -= 4) { const v = top(s * x, z); if (v !== undefined && v < ythr) return x; } return 0; };
const len = (a) => Math.hypot(...a), sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]), scl = (a, k) => a.map((v) => v * k);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a) => scl(a, 1 / (len(a) || 1));
const lines = [];
// hadička: body (x,z), výška z povrchu – lift; tyčka 3L (60 LDU) natažená na délku úseku, tloušťka th
function hose(xz, col, { lift = 5, th = 0.7, step = 10 } = {}) {
  const pts = [];
  for (let i = 0; i + 1 < xz.length; i++) { const [a, b] = [xz[i], xz[i + 1]]; const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) { const t = k / n; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
  pts.push(xz[xz.length - 1]);
  let p3 = pts.map(([x, z]) => [x, top(x, z), z]).filter((p) => p[1] !== undefined);
  // vyhlazení výšky
  const ys = p3.map((p) => p[1]);
  p3 = p3.map((p, i) => { let s = 0, n = 0; for (let j = -3; j <= 3; j++) if (ys[i + j] !== undefined) { s += ys[i + j]; n++; } return [p[0], s / n - lift, p[2]]; });
  for (let i = 0; i + 1 < p3.length; i++) {
    const a = p3[i], d = sub(p3[i + 1], a), L = len(d); if (L < 1) continue;
    const y = norm(d), ref = Math.abs(y[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const x = scl(norm(cross(ref, y)), th), z = scl(norm(cross(x, y)), th), yy = scl(y, L / 60);
    const f = (v) => +v.toFixed(4);
    lines.push(`1 ${col} ${a.map(f).join(' ')} ${[x[0], yy[0], z[0], x[1], yy[1], z[1], x[2], yy[2], z[2]].map(f).join(' ')} 87994.dat`);
  }
}

const SXm = new Map(Object.entries(S.SX || {}));
const sideX = (z, y) => { let best = 0; for (let dz = -2; dz <= 2; dz++) for (let dy = -2; dy <= 2; dy++) { const v = SXm.get(Math.round(z / C + dz) + ',' + Math.round(y / C + dy)); if (v !== undefined && v < 260 && v > best) best = v; } return best; };
function catmull(P, n = 8) { const out = []; for (let i = 0; i + 1 < P.length; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } } out.push(P[P.length - 1]); return out; }
// body: [x, z, lift] nad povrchem nebo ['abs', x, y, z]
function tube(ctrl, col, th = 1.4) {
  const P = ctrl.map((c) => c[0] === 'abs' ? c.slice(1) : [c[0], (top(c[0], c[1]) ?? -100) - c[2], c[1]]);
  const pts = catmull(P, 10);
  for (let i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], col, th);
}
function seg(a, b2, col, th) {
  const d = sub(b2, a), L = len(d); if (L < 0.5) return;
  const y = norm(d), ref = Math.abs(y[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const x = scl(norm(cross(ref, y)), th), z = scl(norm(cross(x, y)), th), yy = scl(y, L / 60), f = (v) => +v.toFixed(4);
  lines.push(`1 ${col} ${a.map(f).join(' ')} ${[x[0], yy[0], z[0], x[1], yy[1], z[1], x[2], yy[2], z[2]].map(f).join(' ')} 87994.dat`);
}
function part(id, col, pos, M = [1, 0, 0, 0, 1, 0, 0, 0, 1]) { const f = (v) => +v.toFixed(4); lines.push(`1 ${col} ${pos.map(f).join(' ')} ${M.map(f).join(' ')} ${id}.dat`); }
const SPECS = {
  // Lambo: stříbrné hadičky po kapotě (V k předku), růžový oblouk nad dveřmi, stříbrná podél prahu
  sian() {
    for (const s of [-1, 1]) {
      tube([[s * 60, -1110, 8], [s * 130, -1000, 16], [s * 172, -880, 18], [s * 160, -760, 12]], 7, 1.1);
      tube([[s * 20, -1100, 8], [s * 70, -980, 16], [s * 95, -860, 18], [s * 90, -760, 12]], 7, 1.1);
      const arch = []; for (let z = -800; z <= -120; z += 85) arch.push([s * (edgeX(z, s, -150) - 10), z, 12]);
      tube(arch, 7, 1.1);
      const sill = []; for (let z = -760; z <= -180; z += 116) sill.push([s * (edgeX(z, s, -60) - 4), z, 6]);
      tube(sill, 7, 1.0);
      // zrcátko: krátká tyčka ven a černá destička
      const zm = -650, xm = edgeX(zm, s, -150), ym = top(s * xm, zm);
      if (ym !== undefined) {
        const f = (v) => +v.toFixed(3);
        lines.push(`1 0 ${f(s * (xm - 6))} ${f(ym - 6)} ${zm} 0 ${f(s * 0.5)} 0 -0.6 0 0 0 0 0.6 87994.dat`);
        lines.push(`1 0 ${f(s * (xm + 28))} ${f(ym - 14)} ${zm} 0 0 ${f(s)} 0 1 0 ${f(-s)} 0 0 3069b.dat`);
      }
    }
    // tmavé prosklení střechy: dlaždice 2x2 sledující sklon střechy
    for (let z = -560; z <= -360; z += 40) for (let x = -60; x <= 60; x += 40) {
      const y0 = top(x, z - 20), y1 = top(x, z + 20); if (y0 === undefined || y1 === undefined) continue;
      const a = Math.atan2(y1 - y0, 40), c = Math.cos(a), sn = Math.sin(a), f = (v) => +v.toFixed(4);
      lines.push(`1 40 ${x} ${f((y0 + y1) / 2 - 9)} ${z} 1 0 0 0 ${f(c)} ${f(-sn)} 0 ${f(sn)} ${f(c)} 3068b.dat`);
    }
  },
  // Chiron: bílé hadice přes kapotu a „C“ oblouk na boku, přes motor dva oblouky
  chiron() {
    const hz = -560; // střed kapoty
    // šedý kulatý díl uprostřed kapoty a šedé spojky u předního skla
    part('3960', 71, [0, (top(0, hz) ?? -150) - 10, hz]);
    for (const s of [-1, 1]) {
      const cz = -410, cx = s * 62, cy = (top(cx, cz) ?? -170) - 24;
      part('42003', 71, [cx, cy, cz], [1, 0, 0, 0, 0, -1, 0, 1, 0]);
      // hadice z předního rohu obloukem nahoru do spojky
      tube([[s * 130, -740, 6], [s * 125, -660, 30], [s * 95, -520, 40], ['abs', cx, cy - 6, cz - 14]], 15);
      // smyčka kolem kulatého dílu: ze spojky dopředu kolem a zpět ke středu
      tube([['abs', cx, cy, cz - 14], [s * 70, hz + 10, 22], [s * 50, hz - 70, 16], [0, hz - 85, 14]], 15);
      // velký bílý oblouk „C“ na boku za dveřmi (ve svislé rovině boku)
      const zc = -60, yc = -175, R = 115, arc = [];
      for (let a = -105; a <= 100; a += 12) { const t = a * Math.PI / 180, z = zc + R * Math.cos(t), y = yc + R * Math.sin(t); arc.push(['abs', s * 312, y, z]); }
      tube(arc, 15, 1.5);
      // růžová vzpěra od střechy dopředu na blatník
      const ra = [s * 140, (top(s * 140, -300) ?? -300) - 16, -300], rb = [s * 165, (top(s * 165, -620) ?? -180) - 22, -620];
      tube([['abs', ...ra], ['abs', ...rb]], 272, 1.6);
      part('6536', 272, rb);
    }
  }
};
SPECS[spec]();
// vložit na konec hlavního souboru MPD
const text = fs.readFileSync(src, 'utf8').split(/\r?\n/);
let idx = text.findIndex((l, i) => i > 0 && /^0\s+FILE\s/.test(l));
if (idx < 0) idx = text.length;
text.splice(idx, 0, ...lines);
fs.writeFileSync(dst, text.join('\n'));
const keep = JSON.parse(fs.readFileSync(keepIn, 'utf8'));
for (let i = 0; i < lines.length; i++) keep.push(S.n + i);
fs.writeFileSync(keepOut, JSON.stringify(keep));
console.log(spec, 'hose segments', lines.length);
