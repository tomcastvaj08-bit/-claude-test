// Love Bricks – procedurální 3D modely složené z kostek.
// Každý model je seznam dílků (geometrie + barva + výsledná matice).
// Dílky se stejnou geometrií a barvou se kreslí jedním InstancedMesh,
// takže i model se stovkami kostek stojí jen pár draw callů (plynulé i na mobilu).
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/addons/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/three/addons/BufferGeometryUtils.js';

export const C = {
  white: '#F2F3F2', red: '#C91A09', dred: '#8E1A12', pink: '#FC97AC', bpink: '#E4ADC8',
  mpink: '#C870A0', magenta: '#D3359D', dgreen: '#184632', green: '#237841', bgreen: '#4B9F4A',
  lgreen: '#C2DAB8', lime: '#A5CA18', yellow: '#F2CD37', lyellow: '#F8F184', orange: '#FE8A18',
  rbrown: '#582A12', dtan: '#958A73', tan: '#E4CD9E', black: '#1B1F24', dgray: '#3E4347',
  lgray: '#A0A5A9', sandblue: '#8E9AB8', blue: '#0055BF', dblue: '#0A3463', lavender: '#CDA4DE',
  purple: '#8E5AA8', silver: '#C9CCD0', gold: '#C9A14A', terracotta: '#B8572C'
};

const STUD_R = 0.3, STUD_H = 0.17;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- seeded random ----------
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- geometrie ----------
const geoCache = new Map();
export function getGeo(key) {
  let g = geoCache.get(key);
  if (!g) {
    g = makeGeo(key);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    geoCache.set(key, g);
  }
  return g;
}

function studParts(w, d, topY) {
  const parts = [];
  const nx = Math.max(1, Math.round(w)), nz = Math.max(1, Math.round(d));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = i - (nx - 1) / 2, z = j - (nz - 1) / 2;
    const side = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 12, 1, true);
    side.translate(x, topY + STUD_H / 2, z);
    const cap = new THREE.CircleGeometry(STUD_R, 12);
    cap.rotateX(-Math.PI / 2);
    cap.translate(x, topY + STUD_H, z);
    parts.push(side, cap);
  }
  return parts;
}

function leafGeo(widthF = 0.3, arch = 0.55, fold = 0.35) {
  const seg = 16, ws = 4;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const w = widthF * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.7);
    const y = arch * (t - 1.15 * t * t);
    for (let j = 0; j <= ws; j++) {
      const s = (j / ws) * 2 - 1;
      pos.push(t, y + fold * w * Math.abs(s), s * w);
      uv.push(t, j / ws);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < ws; j++) {
    const a = i * (ws + 1) + j, b = a + ws + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function heartShape(s = 1) {
  const h = new THREE.Shape();
  h.moveTo(0, -0.9 * s);
  h.bezierCurveTo(-0.35 * s, -0.55 * s, -1.0 * s, -0.25 * s, -1.0 * s, 0.25 * s);
  h.bezierCurveTo(-1.0 * s, 0.75 * s, -0.45 * s, 0.95 * s, 0, 0.55 * s);
  h.bezierCurveTo(0.45 * s, 0.95 * s, 1.0 * s, 0.75 * s, 1.0 * s, 0.25 * s);
  h.bezierCurveTo(1.0 * s, -0.25 * s, 0.35 * s, -0.55 * s, 0, -0.9 * s);
  return h;
}

const ni = (g) => (g.index ? g.toNonIndexed() : g);
function makeGeo(key) {
  const p = key.split(':');
  const n = (i) => parseFloat(p[i]);
  switch (p[0]) {
    case 'brick': case 'tile': {
      const w = n(1), d = n(2), h = n(3);
      const box = new RoundedBoxGeometry(w - 0.04, h - 0.02, d - 0.04, h <= 0.4 ? 1 : 2, Math.min(0.07, h * 0.2));
      if (p[0] === 'tile') return box;
      const parts = [ni(box), ...studParts(w, d, h / 2 - 0.01).map(ni)];
      return mergeGeometries(parts);
    }
    case 'round': { // round:r:h:studs(0|1|4)
      const r = n(1), h = n(2), s = p[3] || '0';
      const cyl = ni(new THREE.CylinderGeometry(r - 0.02, r - 0.02, h - 0.02, 20, 1));
      const parts = [cyl];
      if (s === '1') parts.push(...studParts(1, 1, h / 2 - 0.01).map(ni));
      if (s === '4') parts.push(...studParts(2, 2, h / 2 - 0.01).map(ni));
      return mergeGeometries(parts);
    }
    case 'dish': { // miskovitý okvětní lístek, otevřený směrem +z, okraj má poloměr 1
      const th = Math.PI * 0.3;
      const g = new THREE.SphereGeometry(1, 18, 6, 0, Math.PI * 2, 0, th);
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0, Math.cos(th));
      const s = 1 / Math.sin(th);
      g.scale(s, s, s);
      return g;
    }
    case 'ball': return new THREE.SphereGeometry(1, 14, 10);
    case 'bar': return new THREE.CylinderGeometry(1, 1, 1, 8, 1);
    case 'cone': return new THREE.ConeGeometry(1, 1, 10);
    case 'leaf': return leafGeo(0.3, 0.55, 0.35);
    case 'leafN': return leafGeo(0.09, 0.7, 0.5);
    case 'heart': {
      const g = new THREE.ExtrudeGeometry(heartShape(1), { depth: 0.45, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2, curveSegments: 10 });
      g.translate(0, 0, -0.225);
      return g;
    }
    case 'tire': {
      const g = new THREE.CylinderGeometry(1, 1, 1, 26, 1);
      g.rotateX(Math.PI / 2);
      return g;
    }
    default: throw new Error('Neznámá geometrie ' + key);
  }
}

// ---------- materiály ----------
const matCache = new Map();
export function getMat(key) {
  let m = matCache.get(key);
  if (m) return m;
  const [col, flag] = key.split('|');
  if (col === 'glass') m = new THREE.MeshStandardMaterial({ color: '#1d2a3a', roughness: 0.06, metalness: 0.35 });
  else if (col === 'chrome') m = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.18, metalness: 1 });
  else if (col === 'light') m = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#fff1b8', emissiveIntensity: 0.6, roughness: 0.2 });
  else if (col === 'tail') m = new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#b00000', emissiveIntensity: 0.7, roughness: 0.2 });
  else m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0 });
  if (flag === '2') m.side = THREE.DoubleSide;
  matCache.set(key, m);
  return m;
}

// ---------- stavebnice ----------
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export class Build {
  constructor() { this.pieces = []; }
  put(geo, mat, m, order) { this.pieces.push({ geo, mat, m: m.clone(), order }); return this; }
  at(geo, mat, x, y, z, o = {}) {
    _e.set(o.rx || 0, o.ry || 0, o.rz || 0, o.order3 || 'YXZ');
    _q.setFromEuler(_e);
    const m = new THREE.Matrix4().compose(_v.set(x, y, z), _q, _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1));
    return this.put(geo, mat, m, o.o ?? y);
  }
  // y = spodní hrana kostky
  brick(w, d, h, mat, x, y, z, o = {}) { return this.at(`brick:${w}:${d}:${h}`, mat, x, y + h / 2, z, o); }
  tile(w, d, h, mat, x, y, z, o = {}) { return this.at(`tile:${w}:${d}:${h}`, mat, x, y + h / 2, z, o); }
  local(M, geo, mat, p, r = [0, 0, 0], s = [1, 1, 1], order = 0) {
    _e.set(r[0], r[1], r[2], 'XYZ');
    _q.setFromEuler(_e);
    const L = new THREE.Matrix4().compose(_v.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
    return this.put(geo, mat, M.clone().multiply(L), order);
  }
  // segmentovaný stonek podél křivky
  stem(points, r, mat, segs, order0 = 0, orderSpan = 1, jointMat) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const up = V(0, 1, 0);
    for (let i = 0; i < segs; i++) {
      const a = curve.getPoint(i / segs), b = curve.getPoint((i + 1) / segs);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const m = new THREE.Matrix4().compose(mid, q, V(r, len * 0.9, r));
      const o = order0 + (i / segs) * orderSpan;
      this.put('bar', mat, m, o);
      if (jointMat && i > 0) this.put('ball', jointMat, new THREE.Matrix4().compose(a, q, V(r * 1.3, r * 1.1, r * 1.3)), o);
    }
    return curve;
  }
}

export function frame(pos, forward, scale = 1, upHint = V(0, 1, 0)) {
  const z = forward.clone().normalize();
  let x = upHint.clone().cross(z);
  if (x.lengthSq() < 1e-6) x = V(1, 0, 0);
  x.normalize();
  const y = z.clone().cross(x).normalize();
  const M = new THREE.Matrix4().makeBasis(x, y, z);
  M.scale(V(scale, scale, scale));
  M.setPosition(pos);
  return M;
}

// ---------- animovaný model ----------
const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export class BrickModel {
  constructor(pieces, opts = {}) {
    const { variants = {}, seed = 7, drop = 9 } = opts;
    this.group = new THREE.Group();
    this.variantMats = {};
    for (const [name, v] of Object.entries(variants)) {
      const m = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3 });
      if (v.double) m.side = THREE.DoubleSide;
      this.variantMats[name] = m;
    }
    const R = rng(seed);
    // pořadí skládání
    const sorted = pieces.map((p, i) => ({ p, i, k: p.order + R() * 0.35 })).sort((a, b) => a.k - b.k);
    const N = sorted.length;
    this.dur = Math.min(0.35, Math.max(0.12, 14 / N));
    sorted.forEach((s, rank) => { s.p.start = (rank / Math.max(1, N - 1)) * (1 - this.dur); });

    // bounding box
    const box = new THREE.Box3(), tmp = new THREE.Box3();
    for (const p of pieces) { tmp.copy(getGeo(p.geo).boundingBox).applyMatrix4(p.m); box.union(tmp); }
    this.box = box;
    const size = box.getSize(V());
    const sizeK = Math.max(0.6, size.y / 18);

    // skupiny pro instancing
    const groups = new Map();
    for (const p of pieces) {
      const k = p.geo + '#' + p.mat;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    this.meshes = [];
    this.items = [];
    for (const list of groups.values()) {
      const { geo, mat } = list[0];
      let material;
      if (mat.startsWith('var:')) material = this.variantMats[mat.slice(4)];
      else material = getMat(mat);
      const mesh = new THREE.InstancedMesh(getGeo(geo), material, list.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      list.forEach((p, idx) => {
        const pos = V(), q = new THREE.Quaternion(), s = V();
        p.m.decompose(pos, q, s);
        const off = V((R() - 0.5) * 3 * sizeK, (drop + R() * 5) * sizeK, (R() - 0.5) * 3 * sizeK + 1.5 * sizeK);
        const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 1.6, (R() - 0.5) * 1.6, (R() - 0.5) * 1.6)).multiply(q);
        this.items.push({ mesh, idx, pos, q, s, off, q0, start: p.start, state: -1 });
        mesh.setMatrixAt(idx, p.m);
      });
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
    this.progress = 1;
    this._m = new THREE.Matrix4(); this._p = V(); this._q = new THREE.Quaternion(); this._s = V();
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
  }

  setVariant(name, color) { if (this.variantMats[name]) this.variantMats[name].color.set(color); }

  setProgress(t) {
    t = Math.min(1, Math.max(0, t));
    if (Math.abs(t - this.progress) < 1e-5) return;
    this.progress = t;
    const D = this.dur;
    const dirty = new Set();
    for (const it of this.items) {
      const u = (t - it.start) / D;
      if (u >= 1) {
        if (it.state === 2) continue;
        it.state = 2;
        this._m.compose(it.pos, it.q, it.s);
      } else if (u <= 0) {
        if (it.state === 0) continue;
        it.state = 0;
        this._m.copy(this.zero);
      } else {
        it.state = 1;
        const e = easeOutBack(u), k = 1 - e;
        this._p.set(it.pos.x + it.off.x * k, it.pos.y + it.off.y * k, it.pos.z + it.off.z * k);
        this._q.copy(it.q0).slerp(it.q, easeOutCubic(Math.min(1, u * 1.3)));
        const sc = Math.min(1, 0.35 + u * 2.5);
        this._s.copy(it.s).multiplyScalar(sc);
        this._m.compose(this._p, this._q, this._s);
      }
      it.mesh.setMatrixAt(it.idx, this._m);
      dirty.add(it.mesh);
    }
    for (const m of dirty) m.instanceMatrix.needsUpdate = true;
  }
}

// =====================================================================
//                              MODELY
// =====================================================================

// ---------- orchidejový květ ----------
function orchidFlower(b, M, o, opt = {}) {
  const { petal = C.white, lip = C.bpink, center = C.magenta, accent = null, lipBig = 1 } = opt;
  const W = petal + '|2';
  b.local(M, 'dish', W, [0.95, -0.05, 0], [0, 0.28, -0.2], [1.05, 1.0, 0.5], o);
  b.local(M, 'dish', W, [-0.95, -0.05, 0], [0, -0.28, 0.2], [1.05, 1.0, 0.5], o);
  b.local(M, 'dish', W, [0, 1.0, -0.18], [-0.3, 0, 0], [0.5, 0.85, 0.35], o + 0.01);
  b.local(M, 'dish', W, [0.52, -0.92, -0.18], [0.25, 0, 0.5], [0.42, 0.8, 0.35], o);
  b.local(M, 'dish', W, [-0.52, -0.92, -0.18], [0.25, 0, -0.5], [0.42, 0.8, 0.35], o);
  const L = lip + '|2';
  b.local(M, 'cone', L, [0.16, -0.42, 0.42], [Math.PI - 0.55, 0, 0.25], [0.2 * lipBig, 0.7 * lipBig, 0.13 * lipBig], o + 0.02);
  b.local(M, 'cone', L, [-0.16, -0.42, 0.42], [Math.PI - 0.55, 0, -0.25], [0.2 * lipBig, 0.7 * lipBig, 0.13 * lipBig], o + 0.02);
  b.local(M, 'tile:1:1:0.4', lip, [0, -0.08, 0.36], [0.3, 0, 0], [0.55 * lipBig, 0.6, 0.6 * lipBig], o + 0.02);
  b.local(M, 'ball', center, [0, 0.2, 0.38], [0, 0, 0], [0.2, 0.2, 0.2], o + 0.03);
  for (const [dx, dy] of [[0.3, 0.2], [-0.3, 0.2], [0, 0.48], [0, -0.06]]) {
    b.local(M, 'ball', center, [dx, dy, 0.42], [0, 0, 0], [0.11, 0.11, 0.11], o + 0.03);
  }
  if (accent) b.local(M, 'ball', accent, [0, -0.2, 0.55], [0, 0, 0], [0.2, 0.1, 0.1], o + 0.04);
}

function bud(b, pos, dir, s, col, o) {
  const M = frame(pos, dir, s);
  b.local(M, 'ball', col, [0, 0, 0], [0, 0, 0], [0.36, 0.5, 0.36], o);
  b.local(M, 'dish', col + '|2', [0, -0.25, 0], [-Math.PI / 2, 0, 0], [0.32, 0.32, 0.3], o);
}

function smallBlossom(b, pos, dir, s, petal, center, o) {
  const M = frame(pos, dir, s);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.local(M, 'dish', petal + '|2', [Math.cos(a) * 0.45, Math.sin(a) * 0.45, -0.05], [-Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0], [0.42, 0.42, 0.25], o);
  }
  b.local(M, 'round:0.5:0.4:1', center, [0, 0, 0.1], [Math.PI / 2, 0, 0], [0.7, 0.7, 0.7], o + 0.01);
}

// ---------- velká orchidej (dle fotky 2) ----------
export function buildOrchid() {
  const b = new Build();
  const N = 14, R0 = 3.3, R1 = 4.1, H = 6.4;
  const tilt = Math.atan((R1 - R0) / H);
  for (let tier = 0; tier < 2; tier++) {
    for (let i = 0; i < N; i++) {
      const a = ((i + tier * 0.5) / N) * Math.PI * 2;
      const f = (tier + 0.5) / 2;
      const r = R0 + (R1 - R0) * f + (i % 2 ? 0.16 : 0) - 0.4;
      b.at('tile:1.75:0.8:3.2', 'var:pot', Math.sin(a) * r, tier * (H / 2) + H / 4, Math.cos(a) * r, { ry: a, rx: tilt, o: tier * 3 + i * 0.01 });
    }
  }
  b.at('round:3.2:0.4:0', 'var:pot', 0, 0.2, 0, { o: -1 });
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.25) / N) * Math.PI * 2;
    b.brick(2, 1, 0.4, 'var:pot', Math.sin(a) * (R1 - 0.45), H, Math.cos(a) * (R1 - 0.45), { ry: a, o: 6.6 });
  }
  b.at('round:3.6:0.4:0', C.rbrown, 0, H - 0.3, 0, { o: 6.5 });
  const r = rng(3);
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = r() * 2.8;
    b.brick(1, r() > 0.5 ? 2 : 1, 0.4, r() > 0.5 ? C.rbrown : C.dtan, Math.sin(a) * d, H - 0.1, Math.cos(a) * d, { ry: r() * 3, rx: (r() - 0.5) * 0.5, o: 6.8 });
  }
  // listy
  const leaves = [[-0.35, 9.5, 0.1], [Math.PI + 0.25, 8.5, 0.0], [Math.PI / 2 + 0.9, 7.5, 0.15]];
  leaves.forEach(([ry, s, rz], i) => b.at('leaf', C.dgreen + '|2', 0, H + 0.3, 0, { ry, rz, sx: s, sy: s, sz: s * 1.05, order3: 'YZX', o: 7 + i * 0.1 }));
  // opěrné tyčky
  for (const x of [-0.7, 0.7]) {
    b.stem([V(x, H, -1.2), V(x, H + 8, -1.2), V(x, H + 15.5, -1.2)], 0.17, C.black, 6, 7.5, 2);
    b.at('ball', C.black, x, H + 15.6, -1.2, { sx: 0.22, sy: 0.3, sz: 0.22, o: 9.6 });
  }
  // hlavní stonek
  const S = C.dgreen, J = '#0f2c1f';
  const left = b.stem([V(0.2, H, 0.2), V(0.1, H + 6, 0.5), V(-0.8, H + 12, 0.9), V(-2.8, H + 17, 1.1), V(-5.2, H + 20.5, 1.0), V(-6.8, H + 22, 0.6), V(-7.3, H + 22.4, 0.3)], 0.2, S, 22, 8, 6, J);
  const lf = [[0.4, [1.7, -0.6, 1.0]], [0.57, [-1.8, -0.9, 1.1]], [0.73, [1.5, -1.4, 1.3]], [0.89, [-0.6, -1.9, 1.2]]];
  lf.forEach(([u, off], i) => {
    const p = left.getPoint(u).add(V(...off));
    const M = frame(p, V(off[0] * 0.08, 0.15, 1), 1.85);
    orchidFlower(b, M, 10 + i * 1.2);
  });
  bud(b, left.getPoint(0.99).add(V(-0.2, -0.5, 0.3)), V(-0.4, -0.3, 1), 1.3, C.white, 15.5);
  // boční větev
  const P0 = left.getPoint(0.28);
  const right = b.stem([P0, P0.clone().add(V(1.5, 2.2, 0.3)), P0.clone().add(V(3.6, 4.8, 0.6)), P0.clone().add(V(5.0, 7.8, 0.6)), P0.clone().add(V(5.4, 9.8, 0.3))], 0.19, S, 12, 9, 4, J);
  [[0.5, [1.6, -0.6, 1.0]], [0.98, [0.4, 0.4, 1.0]]].forEach(([u, off], i) => {
    const p = right.getPoint(u).add(V(...off));
    orchidFlower(b, frame(p, V(0.1, 0.15, 1), 1.75), 12 + i * 2);
  });
  bud(b, V(1.2, H + 3.5, 1.4), V(0.3, 0.2, 1), 0.9, C.bpink, 9);
  return { pieces: b.pieces, variants: { pot: { color: C.sandblue } } };
}

// ---------- mini orchidej (dle fotky 1) ----------
export function buildMiniOrchid() {
  const b = new Build();
  const N = 8, R = 3.0, layers = 4;
  for (let l = 0; l < layers; l++) {
    for (let i = 0; i < N; i++) {
      const a = ((i + (l % 2) * 0.5) / N) * Math.PI * 2;
      b.tile(2.3, 1, 1.2, l === 1 ? 'var:band' : 'var:pot', Math.sin(a) * (R - 0.5), l * 1.2, Math.cos(a) * (R - 0.5), { ry: a, o: l });
    }
  }
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    b.brick(2, 1, 0.4, 'var:pot', Math.sin(a) * (R - 0.5), layers * 1.2, Math.cos(a) * (R - 0.5), { ry: a, o: 4.8 });
  }
  const H = layers * 1.2 + 0.4;
  b.at('round:2.6:0.4:0', C.rbrown, 0, H - 0.4, 0, { o: 5 });
  const r = rng(11);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = r() * 1.8;
    b.brick(1, 1, 0.4, C.rbrown, Math.sin(a) * d, H - 0.2, Math.cos(a) * d, { ry: r() * 3, rx: (r() - 0.5) * 0.6, o: 5.2 });
  }
  b.at('leaf', C.dgreen + '|2', 0, H, 0, { ry: Math.PI + 0.35, sx: 6.5, sy: 6.5, sz: 7.5, o: 5.5 });
  b.at('leaf', C.dgreen + '|2', 0, H, 0, { ry: -0.55, sx: 5.5, sy: 5.5, sz: 6.5, o: 5.6 });
  const S = C.green;
  // stonek s velkými květy – oblouk doleva
  const a = b.stem([V(0, H, 0.3), V(-0.6, H + 5, 0.4), V(-2.2, H + 10, 0.6), V(-4.6, H + 13.5, 0.6), V(-6.8, H + 15.2, 0.3), V(-8.2, H + 15.4, 0)], 0.2, S, 18, 6, 5, '#1c5f33');
  [[0.42, [-1.4, -0.4, 1.1]], [0.66, [1.2, -1.3, 1.2]], [0.97, [0.2, -1.2, 1.0]]].forEach(([u, off], i) => {
    orchidFlower(b, frame(a.getPoint(u).add(V(...off)), V(0, 0.1, 1), 1.75), 8 + i * 1.5, { lip: C.pink, center: C.mpink, accent: C.lyellow, lipBig: 1.35 });
  });
  // vzpřímený stonek s bílými kvítky
  const s2 = b.stem([V(0.6, H, 0), V(1.1, H + 6, 0.3), V(1.7, H + 11, 0.4), V(1.6, H + 15, 0.3), V(0.8, H + 17.5, 0.2)], 0.2, S, 14, 6, 6, '#1c5f33');
  orchidFlower(b, frame(s2.getPoint(0.36).add(V(1.0, -0.6, 1.2)), V(0.15, 0.1, 1), 1.7), 9.5, { lip: C.pink, center: C.mpink, accent: C.lyellow, lipBig: 1.35 });
  smallBlossom(b, s2.getPoint(0.72).add(V(0, 0, 0.7)), V(0, 0.2, 1), 1.0, C.white, C.yellow, 12);
  smallBlossom(b, s2.getPoint(1).add(V(0, 0.2, 0.2)), V(0, 0.7, 0.7), 0.9, C.white, C.yellow, 13);
  // boční větvička s pupenem
  const P = s2.getPoint(0.58);
  b.stem([P, P.clone().add(V(2.0, 0.3, 0)), P.clone().add(V(3.6, 0.6, 0)), P.clone().add(V(4.6, 1.4, 0))], 0.18, S, 6, 11, 1);
  const bp = P.clone().add(V(5.0, 1.8, 0));
  const BM = frame(bp, V(0.3, 0.2, 1), 1.0);
  for (let i = 0; i < 5; i++) { const t = (i / 5) * Math.PI * 2; b.local(BM, 'cone', C.lgreen, [Math.cos(t) * 0.35, 0.1, Math.sin(t) * 0.35], [Math.sin(t) * 0.5, 0, -Math.cos(t) * 0.5], [0.35, 0.9, 0.35], 12.2); }
  b.local(BM, 'ball', C.lgreen, [0, 0, 0], [0, 0, 0], [0.55, 0.45, 0.55], 12.1);
  // úponek
  const P2 = s2.getPoint(0.25);
  b.stem([P2, P2.clone().add(V(2.2, 0.8, 0.5)), P2.clone().add(V(3.4, 1.8, 0.5)), P2.clone().add(V(3.0, 2.4, 0.5)), P2.clone().add(V(2.6, 2.0, 0.5))], 0.13, S, 8, 9, 1);
  return { pieces: b.pieces, variants: { pot: { color: C.white }, band: { color: C.lyellow } } };
}

// ---------- růže ----------
function roseHead(b, pos, dir, s, mat, o) {
  const M = frame(pos, dir, s, V(0, 0, 1));
  // lokálně: osa květu = +z (ve frame) → přestavíme na +y pomocí rotace
  const R = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  const F = M.clone().multiply(R); // v F je osa květu +y
  b.local(F, 'ball', mat, [0, 0.15, 0], [0, 0, 0], [0.38, 0.55, 0.38], o);
  const rings = [[3, 0.3, 0.35, 0.55, 0.15], [4, 0.52, 0.2, 0.7, 0.55], [5, 0.72, 0.0, 0.85, 1.0]];
  rings.forEach(([n, rad, y, sc, open], ri) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ri * 0.6;
      const p = V(Math.cos(a) * rad, y, Math.sin(a) * rad);
      const inward = V(-Math.cos(a), open, -Math.sin(a)).normalize();
      const L = new THREE.Matrix4().lookAt(inward, V(0, 0, 0), V(0, 1, 0));
      L.scale(V(sc * 0.75, sc, sc * 0.45));
      L.setPosition(p);
      b.put('dish', mat, F.clone().multiply(L), o + 0.01 * (ri + 1));
    }
  });
  // kališní lístky
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const L = new THREE.Matrix4().lookAt(V(-Math.cos(a), -0.6, -Math.sin(a)).normalize(), V(), V(0, 1, 0));
    L.scale(V(0.2, 0.6, 0.2)); L.setPosition(V(Math.cos(a) * 0.35, -0.3, Math.sin(a) * 0.35));
    b.put('cone', C.green, F.clone().multiply(L), o - 0.01);
  }
}

export function buildRoses() {
  const b = new Build();
  // váza z kulatých kostek
  const prof = [2.2, 2.5, 2.75, 2.85, 2.8, 2.6, 2.3, 2.0, 1.8, 1.7, 1.85];
  prof.forEach((r, i) => {
    b.at(`round:${r}:1.2:0`, i % 4 === 2 ? 'var:accent' : 'var:vase', 0, i * 1.2 + 0.6, 0, { o: i });
  });
  const top = prof.length * 1.2;
  b.at('round:1.7:0.4:4', 'var:vase', 0, top + 0.2, 0, { o: 12 });
  const heads = [[0, top + 12, 0.4], [-3.4, top + 10.2, 0.8], [3.3, top + 10.6, 0.2], [-1.7, top + 8, 2.6], [1.9, top + 8.4, 2.5], [0.2, top + 9.5, -2.2], [-3.5, top + 7.2, -1.4]];
  heads.forEach(([x, y, z], i) => {
    const base = V(x * 0.15, top, z * 0.15);
    const head = V(x, y, z);
    const mid = base.clone().lerp(head, 0.55).add(V(x * 0.15, 0, z * 0.15));
    const curve = b.stem([base, mid, head.clone().add(V(0, -0.9, 0))], 0.17, C.green, 8, 13 + i * 0.3, 2);
    const dir = head.clone().sub(V(0, top - 6, 0)).normalize();
    roseHead(b, head, dir, 1.75, 'var:petal', 16 + i * 0.4);
    const lp = curve.getPoint(0.55);
    b.at('leaf', C.green + '|2', lp.x, lp.y, lp.z, { ry: Math.atan2(-x, -z) + (i % 2 ? 0.9 : -0.9), rz: 0.4, sx: 2.6, sy: 2.6, sz: 3.2, order3: 'YZX', o: 15 });
  });
  return { pieces: b.pieces, variants: { petal: { color: C.red, double: true }, vase: { color: C.white }, accent: { color: C.pink } } };
}

// ---------- tulipány ----------
function tulipHead(b, pos, dir, s, col, o) {
  const F = frame(pos, dir, s, V(0, 0, 1)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + (i % 2) * 0.2;
    const rad = i % 2 ? 0.42 : 0.5;
    const inward = V(-Math.cos(a), -0.25, -Math.sin(a)).normalize();
    const L = new THREE.Matrix4().lookAt(inward, V(), V(0, 1, 0));
    L.scale(V(0.62, 1.15, 0.5)); L.setPosition(V(Math.cos(a) * rad, 0.75, Math.sin(a) * rad));
    b.put('dish', col + '|2', F.clone().multiply(L), o + (i % 2) * 0.01);
  }
  b.local(F, 'ball', C.yellow, [0, 0.4, 0], [0, 0, 0], [0.25, 0.3, 0.25], o - 0.01);
}

export function buildTulips() {
  const b = new Build();
  const layers = 4;
  for (let l = 0; l < layers; l++) b.at(`round:${2.9 + l * 0.2}:1.2:0`, 'var:pot', 0, l * 1.2 + 0.6, 0, { o: l });
  const top = layers * 1.2;
  b.at('round:3.4:0.4:4', 'var:pot', 0, top + 0.2, 0, { o: 4.5 });
  b.at('round:3.1:0.4:0', C.rbrown, 0, top + 0.2, 0, { o: 4.6 });
  const T = [[0, 14.5, 0, C.red], [-2.4, 12.6, 0.6, C.pink], [2.5, 13.2, 0.3, C.yellow], [-1.2, 11, 2.2, C.orange], [1.4, 11.4, 2.3, C.purple], [0.6, 12, -2, C.magenta]];
  T.forEach(([x, y, z, col], i) => {
    const base = V(x * 0.35, top + 0.4, z * 0.35), head = V(x, top + y, z);
    b.stem([base, base.clone().lerp(head, 0.5), head.clone().add(V(0, -0.6, 0))], 0.17, C.bgreen, 7, 6 + i * 0.2, 2);
    tulipHead(b, head.clone().add(V(0, -0.4, 0)), head.clone().sub(base).normalize(), 1.55, col, 10 + i * 0.3);
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    b.at('leafN', C.bgreen + '|2', Math.sin(a) * 1.2, top + 0.4, Math.cos(a) * 1.2, { ry: a - Math.PI / 2, rz: 1.15, sx: 7.5, sy: 7.5, sz: 9, order3: 'YZX', o: 6 });
  }
  return { pieces: b.pieces, variants: { pot: { color: C.terracotta } } };
}

// ---------- srdce z kostek ----------
const HEART = [
  '..XXX...XXX..',
  '.XXXXX.XXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  '.XXXXXXXXXXX.',
  '..XXXXXXXXX..',
  '...XXXXXXX...',
  '....XXXXX....',
  '.....XXX.....',
  '......X......'
];
export function buildHeart({ base = true } = {}) {
  const b = new Build();
  const rows = HEART.length, H = 1.2, cols = HEART[0].length;
  const y0 = base ? 1.6 : 0;
  for (let r = 0; r < rows; r++) {
    const row = HEART[rows - 1 - r];
    let x = 0;
    const runs = [];
    while (x < cols) {
      if (row[x] !== 'X') { x++; continue; }
      let e = x; while (e < cols && row[e] === 'X') e++;
      // rozdělení na kostky 1–4 s vazbou (vystřídání spár)
      let len = e - x, cur = x, first = true;
      while (len > 0) {
        let w = Math.min(4, len);
        if (first && r % 2 && len > 2) w = Math.min(2, len);
        if (len - w === 1 && w > 2) w -= 1;
        runs.push([cur, w]); cur += w; len -= w; first = false;
      }
      x = e;
    }
    for (const [cx, w] of runs) {
      const cxm = cx + w / 2 - cols / 2;
      const hi = (r > rows - 5 && cx < 5) || (r === rows - 3 && cx < 7);
      const col = hi ? 'var:light' : (r < 2 ? 'var:dark' : 'var:main');
      b.brick(w, 2, H, col, cxm, y0 + r * H, 0, { o: r });
    }
  }
  if (base) {
    b.brick(4, 4, 0.4, C.white, -2, 0, 0, { o: -2 });
    b.brick(4, 4, 0.4, C.white, 2, 0, 0, { o: -2 });
    b.brick(2, 2, 1.2, C.white, 0, 0.4, 0, { o: -1 });
  }
  return { pieces: b.pieces, variants: { main: { color: C.red }, dark: { color: C.dred }, light: { color: '#ff5a6e' } } };
}

// ---------- auta ----------
// profil = výška (v plates) pro každý sloupec od zádi (index 0) po příď
function buildCar(spec) {
  const b = new Build();
  const { profile, cabin, wheels, glassFrom = 6, width = 8, spoiler = null, intake = null, rimR = 0.8 } = spec;
  const len = profile.length, P = 0.4;
  const WR = 1.3; // poloměr kola
  const filled = (x, l, z) => {
    if (x < 0 || x >= len || l < 1 || l >= profile[x]) return false;
    if (l >= 7 && (z === 0 || z === width - 1)) return false; // zúžená kabina
    if (z === 0 || z === width - 1) for (const w of wheels) if (Math.abs(x + 0.5 - w) <= 1.6 && l <= 6) return false;
    return true;
  };
  const matAt = (x, l, z) => {
    const top = profile[x] - 1;
    const inCab = x >= cabin[0] && x <= cabin[1];
    for (const w of wheels) if (Math.abs(x + 0.5 - w) <= 1.6 && l <= 6 && (z === 1 || z === width - 2)) return C.black;
    if (l === 1) return C.dgray;
    if (inCab && l >= glassFrom && l < top) return 'glass';
    if (x === len - 1 && l === 3 && (z === 1 || z === 2 || z === width - 2 || z === width - 3)) return 'light';
    if (x === len - 1 && l <= 2 && z > 2 && z < width - 3) return C.black;
    if (x === 0 && l === 4 && (z <= 2 || z >= width - 3)) return 'tail';
    if (x === 0 && l === 2) return C.dgray;
    if (intake && x >= intake[0] && x <= intake[1] && (l === 4 || l === 5) && (z === 0 || z === width - 1)) return C.black;
    return 'var:body';
  };
  const studTop = (x, l, z) => !filled(x, l + 1, z);
  let n = 0;
  for (let l = 1; l < 14; l++) {
    for (let z = 0; z < width; z++) {
      let x = 0, rowStart = true;
      while (x < len) {
        if (!filled(x, l, z)) { x++; rowStart = true; continue; }
        const m = matAt(x, l, z), st = studTop(x, l, z);
        let e = x + 1;
        const maxRun = (l + z) % 2 && rowStart ? 2 : 4;
        rowStart = false;
        while (e < len && e - x < maxRun && filled(e, l, z) && matAt(e, l, z) === m && studTop(e, l, z) === st) e++;
        const w = e - x;
        const kind = st && m !== 'glass' ? 'brick' : 'tile';
        b.at(`${kind}:${w}:1:${P}`, m, x + w / 2 - len / 2, l * P + P / 2, z + 0.5 - width / 2, { o: l + z * 0.02 + x * 0.003 });
        n++; x = e;
      }
    }
  }
  // kola
  for (const w of wheels) for (const side of [-1, 1]) {
    const x = w - len / 2, z = side * (width / 2 - 0.45);
    b.at('tire', C.black, x, WR, z, { sx: WR, sy: WR, sz: 0.95, o: 0.5 });
    b.at('tire', 'var:rim', x, WR, z + side * 0.05, { sx: rimR, sy: rimR, sz: 0.95, o: 0.6 });
    b.at('tire', C.dgray, x, WR, z + side * 0.1, { sx: 0.25, sy: 0.25, sz: 0.95, o: 0.7 });
  }
  if (spoiler) {
    const [sx, h] = spoiler;
    const top = profile[sx] * P;
    b.tile(1, 1, h, C.black, sx - len / 2 + 0.5, top, -2, { o: 20 });
    b.tile(1, 1, h, C.black, sx - len / 2 + 0.5, top, 2, { o: 20 });
    b.tile(2, width, 0.4, 'var:body', sx - len / 2 + 0.5, top + h, 0, { o: 21 });
  }
  return b;
}

export function buildLambo() {
  const b = buildCar({ profile: [6, 7, 7, 7, 8, 8, 9, 10, 10, 10, 10, 9, 8, 7, 6, 5, 5, 4, 4, 4], cabin: [7, 12], glassFrom: 6, wheels: [4, 15.5], intake: [4, 6], spoiler: [1, 0.8] });
  return { pieces: b.pieces, variants: { body: { color: C.lime }, rim: { color: C.gold } } };
}
export function buildPorsche() {
  const b = buildCar({ profile: [5, 6, 7, 7, 8, 9, 10, 10, 10, 10, 9, 8, 7, 6, 6, 6, 5, 5], cabin: [5, 10], glassFrom: 6, wheels: [3.5, 14], spoiler: [1, 0.6] });
  return { pieces: b.pieces, variants: { body: { color: C.white }, rim: { color: C.silver } } };
}
export function buildFerrari() {
  const b = buildCar({ profile: [7, 7, 7, 8, 8, 9, 10, 10, 10, 9, 8, 7, 7, 6, 6, 6, 6, 5, 5, 5], cabin: [5, 9], glassFrom: 6, wheels: [3.5, 15.5], intake: [10, 11], spoiler: [0, 0.6] });
  return { pieces: b.pieces, variants: { body: { color: C.red }, rim: { color: C.black } } };
}
export function buildAudi() {
  const b = buildCar({ profile: [7, 7, 7, 8, 9, 10, 10, 10, 10, 10, 9, 8, 7, 7, 6, 6, 6, 6, 6], cabin: [5, 10], glassFrom: 6, wheels: [3.5, 14.5] });
  return { pieces: b.pieces, variants: { body: { color: '#8C9096' }, rim: { color: C.dgray } } };
}

export const BUILDERS = {
  orchid: buildOrchid, miniorchid: buildMiniOrchid, roses: buildRoses, tulips: buildTulips,
  lambo: buildLambo, porsche: buildPorsche, ferrari: buildFerrari, audi: buildAudi, heart: buildHeart
};

const defCache = new Map();
export function createModel(id, opts = {}) {
  if (!defCache.has(id)) defCache.set(id, BUILDERS[id]());
  const def = defCache.get(id);
  return new BrickModel(def.pieces, { variants: def.variants, seed: id.length * 13 + 5, ...opts });
}
