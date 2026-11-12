// Love Bricks – květiny z kostek (jednotka = 1 výstupek).
import * as THREE from 'three';
import { Build, frame, rng, registerGeo, C } from './models.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// ------------------------------------------------------------ pomocníci
// Rotační tvar (květináč, váza, stojánek) rozdělený na dílky po obvodu.
function lathe(b, key, pts, segs, mat, order = 0, o = {}) {
  const dphi = (2 * PI) / segs;
  const gap = o.gap ?? 0.012;
  const g = registerGeo(`lathe:${key}:${segs}`, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), Math.max(2, Math.round(32 / segs)), gap, dphi - gap * 2));
  const S = new THREE.Matrix4().makeScale(o.sx ?? 1, 1, o.sz ?? 1);
  for (let i = 0; i < segs; i++) {
    const m = new THREE.Matrix4().makeRotationY(i * dphi + (o.phase ?? 0));
    m.premultiply(S);
    m.setPosition(o.x ?? 0, o.y ?? 0, o.z ?? 0);
    b.put(g, mat, m, order + (o.span ?? 0.6) * (i / segs));
  }
}
// kulatý stojánek s nožičkami (chryzantéma, švestka, mini orchidej)
function stand(b, r, mat, order = -2) {
  lathe(b, `stand${r}`, [[0, 0.9], [r * 0.82, 0.9], [r, 1.15], [r, 1.6], [r * 0.9, 1.8], [0, 1.8]], 8, mat, order);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * 2 * PI + PI / 4;
    b.at('tile:1.2:1.2:0.9', mat, Math.cos(a) * r * 0.75, 0.45, Math.sin(a) * r * 0.75, { ry: -a, o: order - 0.5 });
  }
}
function soil(b, r, y, o, n = 14, seed = 3, cols = [C.rbrown, '#3B2314']) {
  b.at('cyl:20', cols[1], 0, y - 0.1, 0, { sx: r, sy: 0.25, sz: r, o });
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * 2 * PI, d = Math.sqrt(R()) * r * 0.85;
    b.at('round:0.5:0.4:1', cols[i % cols.length], Math.cos(a) * d, y + 0.05, Math.sin(a) * d, { rx: (R() - 0.5) * 0.4, rz: (R() - 0.5) * 0.4, o: o + 0.1 });
  }
}
function petalAt(b, M, key, mat, p, dir, up, s, o) {
  // umístí lístek (dlouhý podél +y) tak, aby rostl ve směru dir a vnitřkem mířil k up
  const y = dir.clone().normalize();
  const z = up.clone().sub(y.clone().multiplyScalar(up.dot(y))).normalize();
  const x = y.clone().cross(z).normalize();
  const L = new THREE.Matrix4().makeBasis(x, y, z);
  L.scale(V(s[0], s[1], s[2]));
  L.setPosition(p);
  b.put(key, mat, M ? M.clone().multiply(L) : L, o);
}

// ------------------------------------------------------------ orchidejový květ
function orchidFlower(b, M, o, opt = {}) {
  const { petal = C.white, lip = C.bpink, center = C.magenta, accent = null, lipBig = 1, pointed = false } = opt;
  const W = petal + '|2';
  const g = pointed ? 'petal:0.42:0.18:0.12:0.6' : 'dish';
  if (pointed) {
    // menší orchidej má špičatější lístky – pětice do hvězdy
    for (let i = 0; i < 5; i++) {
      const a = PI / 2 + (i / 5) * 2 * PI;
      const big = i === 1 || i === 4;
      petalAt(b, M, g, W, V(Math.cos(a) * 0.15, Math.sin(a) * 0.15, -0.05), V(Math.cos(a), Math.sin(a), 0.12), V(0, 0, 1), [big ? 1.5 : 1.1, 1.15, 1], o);
    }
  } else {
    b.local(M, 'dish', W, [0.95, -0.05, 0], [0, 0.28, -0.2], [1.05, 1.0, 0.5], o);
    b.local(M, 'dish', W, [-0.95, -0.05, 0], [0, -0.28, 0.2], [1.05, 1.0, 0.5], o);
    b.local(M, 'dish', W, [0, 1.0, -0.18], [-0.3, 0, 0], [0.5, 0.85, 0.35], o + 0.01);
    b.local(M, 'dish', W, [0.52, -0.92, -0.18], [0.25, 0, 0.5], [0.42, 0.8, 0.35], o);
    b.local(M, 'dish', W, [-0.52, -0.92, -0.18], [0.25, 0, -0.5], [0.42, 0.8, 0.35], o);
  }
  const L = lip + '|2';
  b.local(M, 'cone', L, [0.16, -0.42, 0.42], [PI - 0.55, 0, 0.25], [0.2 * lipBig, 0.7 * lipBig, 0.13 * lipBig], o + 0.02);
  b.local(M, 'cone', L, [-0.16, -0.42, 0.42], [PI - 0.55, 0, -0.25], [0.2 * lipBig, 0.7 * lipBig, 0.13 * lipBig], o + 0.02);
  b.local(M, 'tile:1:1:0.4', lip, [0, -0.08, 0.36], [0.3, 0, 0], [0.55 * lipBig, 0.6, 0.6 * lipBig], o + 0.02);
  b.local(M, 'ball', center, [0, 0.2, 0.38], [0, 0, 0], [0.2, 0.2, 0.2], o + 0.03);
  for (const [dx, dy] of [[0.3, 0.2], [-0.3, 0.2], [0, 0.48], [0, -0.06]]) b.local(M, 'ball', center, [dx, dy, 0.42], [0, 0, 0], [0.11, 0.11, 0.11], o + 0.03);
  if (accent) b.local(M, 'ball', accent, [0, -0.2, 0.55], [0, 0, 0], [0.22, 0.12, 0.12], o + 0.04);
}
function bud(b, pos, dir, s, col, o) {
  const M = frame(pos, dir, s);
  b.local(M, 'ball', col, [0, 0, 0], [0, 0, 0], [0.36, 0.5, 0.36], o);
  b.local(M, 'dish', col + '|2', [0, -0.25, 0], [-PI / 2, 0, 0], [0.32, 0.32, 0.3], o);
}

// ============================================================ 1) ORCHIDEJ (velká)
export function buildOrchid() {
  const b = new Build();
  const N = 16, R0 = 3.3, R1 = 4.0, H = 6.8;
  const tilt = Math.atan((R1 - R0) / H);
  for (let i = 0; i < N; i++) { // svislé destičky jako na fotce
    const a = (i / N) * 2 * PI;
    const r = (R0 + R1) / 2 - 0.35 + (i % 2 ? 0.14 : 0);
    b.at(`tile:1.45:0.6:${H}`, 'var:pot', Math.sin(a) * r, H / 2, Math.cos(a) * r, { ry: a, rx: tilt, o: i * 0.02 });
  }
  b.at('cyl:20', 'var:pot', 0, 0.2, 0, { sx: 3.2, sy: 0.4, sz: 3.2, o: -1 });
  soil(b, 3.5, H - 0.2, 6.5, 16, 3, [C.rbrown, C.dtan, '#3B2314']);
  // široké tmavé listy z destiček
  [[-0.35, 9.5, 0.1], [PI + 0.25, 8.5, 0.0], [PI / 2 + 0.9, 7.5, 0.15], [-PI / 2 - 0.4, 6.5, 0.2]].forEach(([ry, s, rz], i) =>
    b.at('leafX:0.3:0.55:0.35:0', C.dgreen + '|2', 0, H + 0.3, 0, { ry, rz, sx: s, sy: s, sz: s * 1.05, order3: 'YZX', o: 7 + i * 0.1 }));
  // vzdušné kořeny (béžové)
  [[1.2, 0.8, 1], [-1.4, 0.6, -1], [0.6, -1.4, 1]].forEach(([dx, dz, s], i) => {
    const p0 = V(dx * 0.8, H + 0.1, dz * 0.8);
    b.stem([p0, p0.clone().add(V(dx * 2.2, 0.6, dz * 2.2)), p0.clone().add(V(dx * 4, -0.8, dz * 3.6)), p0.clone().add(V(dx * 4.8, -2.2, dz * 4.4 + s))], 0.22, C.tan, 8, 7.2 + i * 0.1, 1);
  });
  for (const x of [-0.7, 0.7]) { // opěrné tyčky
    b.stem([V(x, H, -1.2), V(x, H + 8, -1.2), V(x, H + 15.5, -1.2)], 0.17, C.black, 6, 7.5, 2);
  }
  const S = C.dgreen, J = '#0f2c1f';
  const left = b.stem([V(0.2, H, 0.2), V(0.1, H + 6, 0.5), V(-0.8, H + 12, 0.9), V(-2.8, H + 17, 1.1), V(-5.2, H + 20.5, 1.0), V(-6.8, H + 22, 0.6), V(-7.3, H + 22.4, 0.3)], 0.2, S, 22, 8, 6, J);
  [[0.4, [1.7, -0.6, 1.0]], [0.57, [-1.8, -0.9, 1.1]], [0.73, [1.5, -1.4, 1.3]], [0.89, [-0.6, -1.9, 1.2]]].forEach(([u, off], i) => {
    orchidFlower(b, frame(left.getPoint(u).add(V(...off)), V(off[0] * 0.08, 0.15, 1), 1.85), 10 + i * 1.2, { lip: C.magenta, center: C.mpink });
  });
  bud(b, left.getPoint(0.99).add(V(-0.2, -0.5, 0.3)), V(-0.4, -0.3, 1), 1.3, C.white, 15.5);
  const P0 = left.getPoint(0.28);
  const right = b.stem([P0, P0.clone().add(V(1.5, 2.2, 0.3)), P0.clone().add(V(3.6, 4.8, 0.6)), P0.clone().add(V(5.0, 7.8, 0.6)), P0.clone().add(V(5.4, 9.8, 0.3))], 0.19, S, 12, 9, 4, J);
  [[0.5, [1.6, -0.6, 1.0]], [0.98, [0.4, 0.4, 1.0]]].forEach(([u, off], i) => orchidFlower(b, frame(right.getPoint(u).add(V(...off)), V(0.1, 0.15, 1), 1.75), 12 + i * 2, { lip: C.magenta, center: C.mpink }));
  return { pieces: b.pieces, variants: { pot: { color: '#7F8FA6' } } };
}

// ============================================================ 2) MINI ORCHIDEJ (broskvová)
export function buildMiniOrchid() {
  const b = new Build();
  stand(b, 3.4, C.rbrown);
  const potPts = [[0, 1.8], [2.2, 1.8], [3.0, 2.4], [3.45, 3.6], [3.45, 4.6], [3.2, 5.6], [2.9, 6.0], [2.6, 6.0], [2.7, 5.4], [0, 5.4]];
  lathe(b, 'miniPot', potPts, 10, 'var:pot', 0);
  lathe(b, 'miniBand', [[3.47, 4.55], [3.5, 4.75], [3.5, 5.05], [3.4, 5.25]], 8, 'gold', 1.5, { gap: 0.004 });
  soil(b, 2.5, 5.6, 2, 10, 7);
  const top = 5.7;
  b.at('leafX:0.3:0.5:0.4:0', C.dgreen + '|2', 0, top, 0, { ry: PI + 0.3, rz: 0.15, sx: 7.5, sy: 7.5, sz: 8.5, order3: 'YZX', o: 3 });
  b.at('leafX:0.3:0.5:0.4:0', C.dgreen + '|2', 0, top, 0, { ry: -0.4, rz: 0.1, sx: 7, sy: 7, sz: 8, order3: 'YZX', o: 3.1 });
  b.at('leafX:0.3:0.5:0.4:0', C.dgreen + '|2', 0, top, 0, { ry: PI / 2 + 0.2, rz: 0.25, sx: 5.5, sy: 5.5, sz: 6.5, order3: 'YZX', o: 3.2 });
  b.stem([V(-0.6, top, -0.6), V(-0.6, top + 12, -0.6)], 0.2, C.rbrown, 4, 3.5, 1);
  const S = C.dgreen;
  const st = b.stem([V(0, top, 0), V(-0.4, top + 6, 0.3), V(0.4, top + 11, 0.5), V(3, top + 14.5, 0.5), V(6.5, top + 16, 0.3), V(9.5, top + 15.5, 0.2)], 0.22, S, 18, 4, 5, '#0f2c1f');
  const PE = { petal: 'var:petal', lip: C.mpink, center: '#F08A3E', accent: C.orange, lipBig: 0.9, pointed: true };
  [[0.42, [-1.6, 0.2, 1.0]], [0.55, [1.5, -0.2, 1.1]], [0.66, [-0.2, 1.6, 1.0]], [0.75, [1.2, -1.6, 1.2]], [0.86, [0.8, 1.4, 0.9]]].forEach(([u, off], i) => {
    orchidFlower(b, frame(st.getPoint(u).add(V(...off)), V(0.05, 0.2, 1), 1.7), 9 + i, PE);
  });
  for (let i = 0; i < 4; i++) { const p = st.getPoint(0.93 + i * 0.02).add(V(0.4 * i, 0.5 * (i % 2), 0.3)); b.at('ball', C.bgreen, p.x, p.y, p.z, { sx: 0.55, sy: 0.45, sz: 0.45, o: 14 }); }
  return { pieces: b.pieces, variants: { pot: { color: '#D9935E' }, petal: { color: '#F7CBA8', double: true } } };
}

// ============================================================ 3) KYTICE TULIPÁNŮ
function tulipHead(b, pos, dir, s, col, kind, o) {
  const F = frame(pos, dir, s, V(0, 0, 1)).multiply(new THREE.Matrix4().makeRotationX(PI / 2));
  const mat = col + '|2';
  if (kind === 'star') { // oranžový liliokvětý – špičaté lístky do hvězdy
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 2 * PI;
      const d = V(Math.cos(a) * 0.9, 0.55, Math.sin(a) * 0.9);
      petalAt(b, F, 'petal:0.32:0.22:-0.25:0.9', mat, V(Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2), d, V(0, 1, 0), [1.4, 1.6, 1], o);
    }
  } else if (kind === 'bud') {
    b.local(F, 'ball', col, [0, 0.8, 0], [0, 0, 0], [0.75, 1.05, 0.75], o);
    return;
  } else {
    const open = kind === 'open' ? 0.75 : 0.18;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 2 * PI + (i % 2) * 0.25;
      const r = i % 2 ? 0.42 : 0.52;
      const d = V(Math.cos(a) * open, 1, Math.sin(a) * open);
      petalAt(b, F, 'petal:0.55:0.35:-0.12:0.15', mat, V(Math.cos(a) * r, 0.1, Math.sin(a) * r), d, V(-Math.cos(a), 0, -Math.sin(a)), [1.3, 1.55, 1], o + (i % 2) * 0.01);
    }
  }
  // tyčinky
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * PI;
    b.local(F, 'bar', C.white, [Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18], [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25], [0.05, 0.7, 0.05], o + 0.02);
    b.local(F, 'ball', '#F5C518', [Math.cos(a) * 0.28, 0.92, Math.sin(a) * 0.28], [0, 0, 0], [0.08, 0.13, 0.08], o + 0.03);
  }
  b.local(F, 'bar', '#B9D98B', [0, 0.5, 0], [0, 0, 0], [0.13, 0.7, 0.13], o);
}
export function buildTulips() {
  const b = new Build();
  // skleněná váza
  lathe(b, 'tvase', [[0, 0], [3.2, 0], [3.5, 0.6], [3.3, 6], [2.9, 9], [3.2, 10], [3.0, 10.1], [2.7, 9.1], [3.05, 6], [3.2, 0.6], [0, 0.4]], 1, 'vase', 30, { gap: 0 });
  const T = [
    [0, 23, 0, '#D01012', 'cup'], [-3.3, 21.5, 1.2, '#F6A9C8', 'open'], [3.2, 22, 0.6, '#7B4FA0', 'cup'], [-1.4, 20, 3.4, '#F5C518', 'open'],
    [1.8, 20.2, 3.2, '#FE8A18', 'star'], [-5.4, 18.5, -0.4, '#FE8A18', 'star'], [5.2, 19, -0.6, '#F5C518', 'cup'], [1.2, 21.5, -2.8, '#F6A9C8', 'cup'],
    [-2.6, 20.2, -2.6, '#7B4FA0', 'open'], [4.3, 17.6, 2.8, '#D01012', 'open'], [-4.4, 17.4, 2.6, '#B9D98B', 'bud'], [2.6, 18.5, -4.2, '#B9D98B', 'bud']
  ];
  T.forEach(([x, y, z, col, kind], i) => {
    const base = V(x * 0.12, 1, z * 0.12), head = V(x * 1.15, y - 2.5, z * 1.15);
    const mid = V(x * 0.35, y * 0.55, z * 0.35);
    b.stem([base, V(x * 0.15, 9.5, z * 0.15), mid, head.clone().add(V(0, -0.6, 0))], 0.2, '#4B9F4A', 10, 2 + i * 0.25, 4);
    tulipHead(b, head.clone().add(V(0, -0.5, 0)), head.clone().sub(V(0, 2, 0)).normalize(), 2.35, col, kind, 8 + i * 0.3);
  });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 2 * PI + 0.2;
    b.at('leafX:0.13:0.8:0.5:0', '#3F9E3A|2', Math.sin(a) * 0.8, 9.6, Math.cos(a) * 0.8, { ry: a - PI / 2, rz: 0.95 + (i % 3) * 0.12, sx: 9 + (i % 2) * 2, sy: 9, sz: 12, order3: 'YZX', o: 6 });
  }
  return { pieces: b.pieces, variants: {} };
}

// ============================================================ 4) MALÉ ROSTLINKY (9 květináčků)
function tinyPot(b, x, z, s, o) {
  const pts = [[0, 0], [1.55 * s, 0], [1.75 * s, 2.7 * s], [2.0 * s, 2.75 * s], [2.0 * s, 3.5 * s], [1.75 * s, 3.5 * s], [1.6 * s, 3.1 * s], [0, 3.1 * s]];
  lathe(b, 'tiny' + s, pts, 6, 'var:pot', o, { x, z });
  b.at('cyl:16', C.rbrown, x, 3.15 * s, z, { sx: 1.6 * s, sy: 0.2, sz: 1.6 * s, o: o + 0.5 });
  return 3.2 * s;
}
function rosette(b, x, y, z, col, n, rings, len, o, up = 0.55) {
  for (let r = 0; r < rings; r++) for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI + r * 0.5;
    const d = V(Math.cos(a), up + r * 0.35, Math.sin(a));
    petalAt(b, null, 'petal:0.35:0.3:0.1:0.7', col + '|2', V(x, y + r * 0.15, z), d, V(0, 1, 0), [len * (1 - r * 0.22), len * (1 - r * 0.25), len * 0.6], o + r * 0.02);
  }
}
export function buildTinyPlants() {
  const b = new Build();
  const R = rng(17);
  // zadní řada
  let h = tinyPot(b, -9, -3.5, 1.15, 0); // láčkovka
  [[0, 0, 6.5], [0.9, 0.5, 5], [-0.8, 0.6, 4.2], [0.2, -0.9, 3.5]].forEach(([dx, dz, l], i) => {
    b.at('cyl:12', '#A5CA18', -9 + dx, h + l / 2, -3.5 + dz, { sx: 0.55, sy: l, sz: 0.55, o: 2 + i * 0.1 });
    b.at('dish', '#8A2B2B|2', -9 + dx, h + l + 0.15, -3.5 + dz, { rx: -PI / 2 + 0.5, sx: 0.65, sy: 0.65, sz: 0.4, o: 2.5 });
  });
  h = tinyPot(b, -3, -4.2, 1.2, 0.2); // opuncie
  [[0, 2.2, 0, 0, 1.5], [-1.2, 4.6, 0, -0.5, 1.15], [1.3, 4.9, 0, 0.45, 1.1], [0.2, 6.6, 0, 0.1, 0.9]].forEach(([dx, dy, dz, rz, s], i) => {
    b.at('ball', '#8EB39B', -3 + dx, h + dy, -4.2 + dz, { rz, sx: 1.25 * s, sy: 1.65 * s, sz: 0.42 * s, o: 3 + i * 0.2 });
    for (let k = 0; k < 4; k++) b.at('ball', '#E4CD9E', -3 + dx + (R() - 0.5) * 1.6 * s, h + dy + (R() - 0.5) * 2 * s, -4.2 + 0.45 * s, { sx: 0.1, sy: 0.1, sz: 0.1, o: 4 });
  });
  smallFlower(b, V(-2.8, h + 8.0, -4.2), '#F5C518', 0.8, 5);
  h = tinyPot(b, 3, -4.2, 1.25, 0.4); // kulatý kaktus s bodlinami
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 2 * PI;
    b.at('ball', '#5E8F4E', 3 + Math.cos(a) * 1.5, h + 2.4, -4.2 + Math.sin(a) * 1.5, { ry: -a, sx: 0.8, sy: 2.4, sz: 0.9, o: 3 });
    for (let k = 0; k < 2; k++) {
      const p = V(3 + Math.cos(a) * 2.3, h + 1.6 + k * 1.6, -4.2 + Math.sin(a) * 2.3);
      const d = V(Math.cos(a), 0.4 + k * 0.5, Math.sin(a));
      petalAt(b, null, 'cone2:6', '#E4CD9E', p, d, V(0, 1, 0), [0.1, 1.3, 0.1], 4);
    }
  }
  b.at('ball', '#6FA55B', 3, h + 4.3, -4.2, { sx: 1.3, sy: 0.7, sz: 1.3, o: 3.5 });
  h = tinyPot(b, 9.2, -3.4, 1.15, 0.6); // vysoká rostlina s červenými květy
  [[0, 9, 0], [1.6, 7, 0.4], [-1.3, 6, 0.6]].forEach(([dx, y, dz], i) => {
    b.stem([V(9.2, h, -3.4), V(9.2 + dx * 0.5, h + y * 0.6, -3.4 + dz), V(9.2 + dx, h + y, -3.4 + dz)], 0.16, '#237841', 5, 3 + i * 0.2, 1);
    const p = V(9.2 + dx, h + y + 0.6, -3.4 + dz);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * 2 * PI; petalAt(b, null, 'dish', '#C91A09|2', p, V(Math.cos(a), 0.9, Math.sin(a)), V(-Math.cos(a), 0.4, -Math.sin(a)), [0.9, 1.1, 0.5], 5); }
  });
  for (let i = 0; i < 4; i++) b.at('leafX:0.32:0.4:0.3:0', '#237841|2', 9.2, h + 0.5, -3.4, { ry: i * 1.6, rz: 0.6, sx: 4, sy: 4, sz: 4.5, order3: 'YZX', o: 3 });
  // přední řada
  h = tinyPot(b, -11.5, 3.5, 0.95, 0.8); // růžový květ s tmavě červenou růžicí
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 2 * PI; petalAt(b, null, 'cone2:4', '#7A1E26', V(-11.5, h + 0.3, 3.5), V(Math.cos(a), 0.25, Math.sin(a)), V(0, 1, 0), [0.25, 3.4, 0.15], 3); }
  b.stem([V(-11.5, h, 3.5), V(-11.5, h + 5.5, 3.5)], 0.12, '#7A1E26', 3, 3.2, 1);
  smallFlower(b, V(-11.5, h + 6, 3.5), '#FC97AC', 1, 4);
  h = tinyPot(b, -5.5, 4.2, 1.0, 1); // láčkovka světle zelená s fialovou
  [[0, 0, 4.6], [0.8, 0.4, 3.4], [-0.7, 0.5, 2.6]].forEach(([dx, dz, l], i) => {
    b.at('cone2:10', '#C2DAB8', -5.5 + dx, h + l / 2, 4.2 + dz, { rx: PI, sx: 0.75, sy: l, sz: 0.75, o: 3 + i * 0.1 });
    b.at('ball', '#8E5AA8', -5.5 + dx, h + l, 4.2 + dz, { sx: 0.75, sy: 0.25, sz: 0.75, o: 3.4 });
  });
  h = tinyPot(b, 0.5, 4.8, 0.9, 1.2); rosette(b, 0.5, h + 0.3, 4.8, '#7FA3D8', 6, 3, 2.4, 3); // modrý sukulent
  h = tinyPot(b, 6.2, 4.6, 0.9, 1.4); rosette(b, 6.2, h + 0.3, 4.6, '#7B4FA0', 7, 3, 2.3, 3); // fialový sukulent
  h = tinyPot(b, 11.8, 3.8, 1.0, 1.6); rosette(b, 11.8, h + 0.3, 3.8, '#184632', 8, 4, 2.6, 3, 1.1); // tmavě zelený
  return { pieces: b.pieces, variants: { pot: { color: '#A3501E' } } };
}
function smallFlower(b, p, col, s, o) {
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 2 * PI; petalAt(b, null, 'petal:0.45:0.2:0.1:0.3', col + '|2', p, V(Math.cos(a), 0.5, Math.sin(a)), V(0, 1, 0), [1.1 * s, 1.1 * s, 1], o); }
  b.at('ball', '#F5C518', p.x, p.y + 0.15, p.z, { sx: 0.35 * s, sy: 0.25 * s, sz: 0.35 * s, o: o + 0.1 });
}

// ============================================================ 5) KVETOUCÍ KAKTUS
function cactusColumn(b, x, z, r, h, o, spines = 3) {
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI;
    b.at(`tile:1.25:0.9:${h}`, 'var:cactus', x + Math.cos(a) * r, 0 + h / 2, z + Math.sin(a) * r, { ry: -a + PI / 2, o: o + i * 0.01 });
    for (let k = 0; k < spines; k++) {
      const p = V(x + Math.cos(a) * (r + 0.5), (h * (k + 0.6)) / (spines + 0.2), z + Math.sin(a) * (r + 0.5));
      petalAt(b, null, 'cone2:5', C.tan, p, V(Math.cos(a), 0.25, Math.sin(a)), V(0, 1, 0), [0.11, 1.5, 0.11], o + 1);
      b.at('ball', C.tan, p.x, p.y, p.z, { sx: 0.18, sy: 0.18, sz: 0.18, o: o + 1 });
    }
  }
  b.at('ball', 'var:cactus', x, h, z, { sx: r + 0.35, sy: r * 0.7, sz: r + 0.35, o: o + 1.2 });
}
export function buildCactus() {
  const b = new Build();
  // světle modrý oválný květináč s drážkami
  const pts = [[0, 0], [3.6, 0], [4.1, 0.6], [4.3, 4.6], [4.1, 5.1], [3.7, 5.1], [3.6, 4.6], [0, 4.6]];
  lathe(b, 'cactPot', pts, 14, 'var:pot', 0, { sx: 1.3, gap: 0.02 });
  b.at('cyl:24', '#6B3A1E', 0, 4.65, 0, { sx: 3.6 * 1.3, sy: 0.25, sz: 3.6, o: 1 });
  const R = rng(5);
  for (let i = 0; i < 12; i++) b.at('round:0.5:0.4:1', i % 2 ? C.orange : '#C26B2A', (R() - 0.5) * 8, 4.85, (R() - 0.5) * 5, { o: 1.2 });
  // vysoký sloup
  const tall = new Build(); cactusColumn(tall, 0, 0, 1.85, 13, 2, 4);
  tall.pieces.forEach(p => { p.m.premultiply(new THREE.Matrix4().makeTranslation(1.7, 4.6, 0.2)); b.pieces.push(p); });
  const short = new Build(); cactusColumn(short, 0, 0, 1.75, 8, 2, 3);
  short.pieces.forEach(p => { p.m.premultiply(new THREE.Matrix4().makeTranslation(-2.3, 4.6, 0.4)); b.pieces.push(p); });
  // velký růžový květ
  const top = V(1.7, 4.6 + 13 + 1.0, 0.2);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 2 * PI + r * 0.4;
    petalAt(b, null, 'petal:0.36:0.25:0.15:0.85', (r === 2 ? '#FC97AC' : 'var:flower') + '|2'.replace('var:flower|2', ''), top.clone().add(V(0, r * 0.2, 0)), V(Math.cos(a), 0.6 + r * 0.45, Math.sin(a)), V(0, 1, 0), [4.2 - r * 0.8, 5.0 - r * 1.0, 2.4], 6 + r * 0.2);
  }
  b.at('ball', '#F5C518', top.x, top.y + 0.9, top.z, { sx: 1.3, sy: 0.7, sz: 1.3, o: 7 });
  b.at('ball', C.bgreen, top.x, top.y + 1, top.z, { sx: 0.35, sy: 0.35, sz: 0.35, o: 7.1 });
  // růžičky na malém
  [[-2.3, 13.8, 0.4], [-1.0, 13.3, 1.6], [-3.5, 13.2, 1.2], [-1.9, 12.8, -1.3], [-3.5, 12.9, -0.8]].forEach(([x, y, z], i) => {
    b.at('ball', '#D3359D', x, y, z, { sx: 0.85, sy: 0.75, sz: 0.85, o: 6 + i * 0.05 });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * 2 * PI; petalAt(b, null, 'dish', '#E4569A|2', V(x, y - 0.15, z), V(Math.cos(a), 0.9, Math.sin(a)), V(-Math.cos(a), 0.3, -Math.sin(a)), [0.85, 0.9, 0.45], 6.2); }
  });
  return { pieces: b.pieces.map(p => (p.mat === 'var:flower|2' ? { ...p, mat: 'var:flower' } : p)), variants: { pot: { color: '#9CC8EC' }, cactus: { color: '#7FA58C' }, flower: { color: '#E4569A', double: true } } };
}

// ============================================================ 6) CHRYZANTÉMA
function mumFlower(b, c, dir, s, o) {
  const y = dir.clone().normalize();
  const R = rng(Math.round(c.x * 10 + c.y));
  // vnější paprsky – dlouhé tenké zahnuté lístky
  for (let ring = 0; ring < 4; ring++) {
    const n = 14 - ring * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * PI + ring * 0.37 + R() * 0.2;
      const elev = -0.25 + ring * 0.42;
      const local = V(Math.cos(a), elev, Math.sin(a)).normalize();
      // natočení do směru květu
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), y);
      const d = local.clone().applyQuaternion(q);
      const len = (3.4 - ring * 0.55) * s;
      petalAt(b, null, `petal:0.16:0.35:${ring < 2 ? 0.35 : 0.25}:0.4`, (ring >= 2 ? '#E2541B' : 'var:flower') + (ring >= 2 ? '|2' : ''), c.clone().addScaledVector(d, 0.25 * s), d, y, [len, len, len * 0.9], o + ring * 0.05);
    }
  }
  b.at('ball', '#B8350F', c.x, c.y, c.z, { sx: 0.9 * s, sy: 0.7 * s, sz: 0.9 * s, o: o + 0.3 });
}
export function buildChrysanthemum() {
  const b = new Build();
  stand(b, 3.8, C.rbrown);
  const pot = [[0, 1.8], [2.0, 1.8], [3.3, 2.5], [4.3, 4.0], [4.5, 5.6], [4.1, 7.2], [3.4, 8.2], [3.6, 8.6], [3.2, 8.7], [3.0, 8.2], [0, 8.2]];
  lathe(b, 'mumPot', pot, 12, 'var:pot', 0);
  lathe(b, 'mumBand', [[4.47, 5.1], [4.55, 5.3], [4.55, 6.0], [4.45, 6.2]], 8, 'gold', 1.6, { gap: 0.004 });
  soil(b, 3.0, 8.3, 2, 8, 9);
  const S = C.dgreen;
  const main = b.stem([V(0, 8.3, 0), V(0.2, 14, 0.3), V(-0.2, 20, 0.4), V(0, 24.5, 0.6)], 0.32, S, 10, 3, 3, '#0f2c1f');
  const side = b.stem([V(0, 12, 0.2), V(-2, 15, 0.6), V(-4.2, 17.5, 1.2), V(-4.8, 19, 1.8)], 0.28, S, 7, 4, 2, '#0f2c1f');
  b.stem([V(0, 14, 0.2), V(2.5, 16.5, 0.8), V(4.2, 19.5, 1.0), V(4.4, 21, 1.2)], 0.24, S, 6, 4, 2, '#0f2c1f');
  b.stem([V(0, 17, 0.3), V(1.6, 19, 1.4), V(2.4, 21.8, 2.2)], 0.2, S, 5, 4.5, 1, '#0f2c1f');
  b.stem([V(0, 10.5, 0), V(-2.5, 12, -0.3), V(-3.8, 13.6, -0.2)], 0.2, S, 5, 4.5, 1, '#0f2c1f');
  mumFlower(b, V(0, 26, 0.8), V(0, 1, 0.35), 1.5, 8);
  mumFlower(b, V(-5.0, 20.4, 2.2), V(-0.3, 1, 0.5), 1.3, 9);
  for (const [p, d] of [[V(4.5, 21.8, 1.3), V(0.2, 1, 0.2)], [V(2.5, 22.6, 2.4), V(0.1, 1, 0.4)], [V(-4, 14.4, -0.2), V(-0.4, 1, 0)]]) {
    b.at('ball', C.orange, p.x, p.y, p.z, { sx: 0.95, sy: 1.15, sz: 0.95, o: 9 });
    for (let k = 0; k < 4; k++) { const a = (k / 4) * 2 * PI; petalAt(b, null, 'petal:0.3:0.2:0.1:0.7', S + '|2', p.clone().add(V(0, -0.6, 0)), V(Math.cos(a), 1.2, Math.sin(a)), V(-Math.cos(a), 0, -Math.sin(a)), [0.9, 1.2, 0.8], 9); }
  }
  // zubaté listy
  [[side.getPoint(0.4), -2.4, 0.4], [main.getPoint(0.35), 0.8, 0.3], [main.getPoint(0.55), 2.6, 0.5], [main.getPoint(0.2), PI + 0.6, 0.3], [side.getPoint(0.75), -1.6, 0.2], [main.getPoint(0.7), -0.4, 0.5]].forEach(([p, ry, rz], i) =>
    b.at('leafX:0.32:0.25:0.25:0.6', C.dgreen + '|2', p.x, p.y, p.z, { ry, rz, sx: 5, sy: 5, sz: 6, order3: 'YZX', o: 5 + i * 0.1 }));
  return { pieces: b.pieces, variants: { pot: { color: '#86A88E' }, flower: { color: '#FE8A18', double: true } } };
}

// ============================================================ 7) LOPATKOVEC (Peace lily)
export function buildPeaceLily() {
  const b = new Build();
  const n = 16, R = 4.3;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI;
    b.at('cyl:16', 'var:pot', Math.cos(a) * R, 3.6, Math.sin(a) * R, { sx: 0.88, sy: 7.2, sz: 0.88, o: i * 0.02 });
    b.at('cyl:16', 'var:pot', Math.cos(a) * R, 7.25, Math.sin(a) * R, { sx: 0.5, sy: 0.15, sz: 0.5, o: 0.5 });
  }
  b.at('cyl:20', 'var:pot', 0, 0.2, 0, { sx: R, sy: 0.4, sz: R, o: -1 });
  soil(b, 3.8, 7.0, 1, 12, 13);
  const G = '#2C9A3C';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 2 * PI + 0.3;
    const len = 6 + (i % 3) * 2.2;
    const tip = V(Math.cos(a) * (3 + (i % 2) * 1.5), 7 + len, Math.sin(a) * (3 + (i % 2) * 1.5));
    const st = b.stem([V(Math.cos(a) * 0.6, 7, Math.sin(a) * 0.6), V(Math.cos(a) * 1.8, 7 + len * 0.6, Math.sin(a) * 1.8), tip], 0.2, G, 6, 2 + i * 0.1, 1);
    const d = V(Math.cos(a) * 0.75, 1.15 - (i % 3) * 0.25, Math.sin(a) * 0.75);
    petalAt(b, null, 'petal:0.42:0.3:-0.9:0.35', G + '|2', tip, d, V(-Math.cos(a), 0.3, -Math.sin(a)), [6.2 + (i % 2), 9.5 + (i % 3) * 0.8, 5], 4 + i * 0.1);
  }
  [[0.6, 30, 1.2], [-2.6, 27, 2.2], [2.8, 25, 1.6], [-1.0, 24, -2.4]].forEach(([x, y, z], i) => {
    b.stem([V(x * 0.2, 7, z * 0.2), V(x * 0.6, y * 0.6, z * 0.6), V(x, y - 2, z)], 0.18, '#58AB41', 8, 5 + i * 0.2, 2);
    const p = V(x, y - 2.2, z);
    petalAt(b, null, 'petal:0.5:0.75:0.25:0.6', C.white + '|2', p.clone().add(V(0, 0, -0.3)), V(0, 1, 0.08), V(x, 0, Math.abs(z) + 2).normalize(), [4.2, 6.4, 3.0], 8 + i * 0.2);
    b.at('cyl:10', '#F5C518', p.x, p.y + 2.0, p.z + 0.5, { sx: 0.45, sy: 3.2, sz: 0.45, o: 8.5 + i * 0.2 });
  });
  return { pieces: b.pieces, variants: { pot: { color: '#E9B98F' } } };
}

// ============================================================ 8) KVETOUCÍ SLIVOŇ (Plum blossom)
function plumFlower(b, p, d, s, o) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 2 * PI;
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
    const dir = V(Math.cos(a), 0.35, Math.sin(a)).applyQuaternion(q);
    petalAt(b, null, 'dish', 'var:flower', p.clone().addScaledVector(dir, 0.55 * s), dir, d, [0.85 * s, 0.85 * s, 0.4 * s], o);
  }
  b.at('ball', '#F5C518', p.x, p.y, p.z, { sx: 0.45 * s, sy: 0.45 * s, sz: 0.45 * s, o: o + 0.05 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 2 * PI;
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
    const t = V(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4).applyQuaternion(q).multiplyScalar(0.7 * s).add(p);
    b.at('ball', '#F8F184', t.x, t.y, t.z, { sx: 0.13, sy: 0.13, sz: 0.13, o: o + 0.06 });
  }
}
export function buildPlumBlossom() {
  const b = new Build();
  stand(b, 3.4, C.rbrown);
  lathe(b, 'plumVase', [[0, 1.8], [3.6, 1.8], [3.8, 2.2], [3.8, 3.6], [3.3, 4.2], [2.9, 6.5], [2.9, 9.5], [3.2, 10], [2.7, 10.1], [2.5, 9.6], [0, 9.6]], 10, 'var:pot', 0);
  lathe(b, 'plumBand', [[3.82, 2.5], [3.9, 2.6], [3.9, 3.3], [3.82, 3.4]], 8, 'gold', 1.4, { gap: 0.004 });
  const BR = '#5A2E1A';
  const trunk = b.stem([V(0, 9.5, 0), V(-0.5, 14, 0.4), V(1.2, 19, 0.6), V(0.4, 24, 0.8), V(2.4, 29, 0.6), V(4.2, 33, 0.3), V(5.5, 36, 0)], 0.55, BR, 18, 2, 6, null, 0.22);
  const twigs = [
    [0.18, [V(-3.5, 2.5, 0.6), V(-6, 2, 1)]], [0.35, [V(3.2, 2.2, 0.8), V(5.6, 4.0, 1.2)]], [0.5, [V(-2.8, 3, 0.3), V(-5.2, 6.0, 0.8)]],
    [0.62, [V(3.5, 1.2, 1.2), V(6.5, 2.4, 1.6)]], [0.78, [V(-2.6, 2.4, 0.4), V(-4.2, 5.0, 0.2)]], [0.9, [V(2.4, 0.6, 0.6), V(4.5, 0.2, 0.4)]]
  ];
  const flowerSpots = [];
  twigs.forEach(([u, offs], i) => {
    const p0 = trunk.getPoint(u);
    const pts = [p0, ...offs.map(o => p0.clone().add(o))];
    const tw = b.stem(pts, 0.24, BR, 6, 4 + i * 0.4, 1, null, 0.12);
    for (let k = 1; k <= 5; k++) {
      const p = tw.getPoint(k / 5.4);
      b.at('ball', C.magenta, p.x + 0.35, p.y + 0.3, p.z + 0.25, { sx: 0.32, sy: 0.4, sz: 0.32, o: 8 + i * 0.1 });
    }
    flowerSpots.push(tw.getPoint(0.5), tw.getPoint(0.95));
  });
  [0.3, 0.45, 0.58, 0.7, 0.86].forEach(u => flowerSpots.push(trunk.getPoint(u)));
  flowerSpots.forEach((p, i) => plumFlower(b, p.clone().add(V((i % 2 ? 1 : -1) * 0.8, 0.4, 1.0)), V((i % 2 ? 0.3 : -0.3), 0.3, 1), 1.35, 9 + i * 0.15));
  for (let k = 0; k < 8; k++) { const p = trunk.getPoint(0.9 + k * 0.012); b.at('ball', C.magenta, p.x + 0.4, p.y + 0.3, p.z + 0.3, { sx: 0.3, sy: 0.38, sz: 0.3, o: 12 }); }
  return { pieces: b.pieces, variants: { pot: { color: '#8FA3BC' }, flower: { color: '#C91A09', double: true } } };
}

// ============================================================ 9) BONSAJ
export function buildBonsai() {
  const b = new Build();
  const RB = C.rbrown;
  // dřevěný stojánek z lamel
  for (let i = 0; i < 7; i++) b.tile(18, 1.6, 0.6, '#6B3A1E', 0, 1.6, -5.4 + i * 1.8, { o: 0 });
  for (const x of [-7.5, 7.5]) for (const z of [-5, 5]) b.tile(1.6, 1.6, 1.6, '#4A2513', x, 0, z, { o: -1 });
  b.tile(19, 1, 0.8, '#4A2513', 0, 0.9, -6.1, { o: -0.5 }); b.tile(19, 1, 0.8, '#4A2513', 0, 0.9, 6.1, { o: -0.5 });
  // černá miska
  b.tile(14, 9, 0.8, C.black, 0, 2.2, 0, { o: 1 });
  b.tile(14, 1, 2.2, C.black, 0, 3.0, -4, { o: 1.2 }); b.tile(14, 1, 2.2, C.black, 0, 3.0, 4, { o: 1.2 });
  b.tile(1, 9, 2.2, C.black, -6.5, 3.0, 0, { o: 1.2 }); b.tile(1, 9, 2.2, C.black, 6.5, 3.0, 0, { o: 1.2 });
  const R = rng(21);
  for (let i = 0; i < 46; i++) b.at('round:0.5:0.4:1', [C.dtan, C.tan, C.lgray, '#6E6E6E'][i % 4], (R() - 0.5) * 11.5, 4.9 + R() * 0.2, (R() - 0.5) * 6.5, { rx: (R() - 0.5) * 0.5, o: 2 });
  // kmen a větve
  const trunk = b.stem([V(0.5, 4.8, 0), V(-1, 8, 0.2), V(1.5, 11, 0), V(0.2, 14, 0.2), V(-1.5, 16.5, 0)], 1.25, RB, 12, 3, 4, null, 0.6);
  const pads = [];
  [[0.35, [V(3.5, 1.5, 0.5), V(6.8, 2.0, 0.6)]], [0.55, [V(-3.2, 1.2, -0.3), V(-6.5, 1.6, 0.2)]], [0.8, [V(2.8, 1.8, 0.3), V(5.2, 3.6, 0.2)]], [1.0, [V(-1.2, 1.4, 0), V(-2.2, 2.6, 0)]]].forEach(([u, offs], i) => {
    const p0 = trunk.getPoint(u);
    const pts = [p0, ...offs.map(o => p0.clone().add(o))];
    b.stem(pts, 0.55, RB, 6, 6 + i * 0.3, 1, null, 0.28);
    pads.push(pts[pts.length - 1]);
  });
  pads.push(trunk.getPoint(0.65).add(V(0.5, 1, 2.2)));
  // listové polštáře z malých kulatých placek (jako „žabky“)
  const sizes = [[4.2, 1.8, 3.2], [4.0, 1.6, 3.0], [3.6, 1.7, 2.8], [3.4, 1.8, 2.8], [2.6, 1.2, 2.2]];
  pads.forEach((c, i) => {
    const [rx, ry, rz] = sizes[i];
    const n = 70;
    for (let k = 0; k < n; k++) {
      const a = R() * 2 * PI, e = R() * 0.9 + 0.1;
      const x = Math.cos(a) * rx * Math.sqrt(R()), z = Math.sin(a) * rz * Math.sqrt(R());
      const y = ry * (1 - (x * x) / (rx * rx) - (z * z) / (rz * rz)) * e;
      b.at('round:0.5:0.4:1', k % 3 ? 'var:foliage' : 'var:foliage2', c.x + x, c.y + y + 0.4, c.z + z, { rx: (R() - 0.5) * 0.9, rz: (R() - 0.5) * 0.9, o: 9 + i * 0.4 + k * 0.002 });
    }
  });
  return { pieces: b.pieces, variants: { foliage: { color: '#4B9F4A' }, foliage2: { color: '#7DBE3C' } } };
}
