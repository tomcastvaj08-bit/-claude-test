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

function leafGeo(widthF = 0.3, arch = 0.55, fold = 0.35, serr = 0) {
  const seg = serr ? 28 : 16, ws = 4;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    let w = widthF * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.7);
    if (serr) w *= 1 - serr * (i % 2) * Math.sin(Math.PI * t);
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

function petalGeo(w, cup, curl, tip) {
  const seg = 12, ws = 6, pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const e = Math.max(0, 1 - (2 * u - 1) ** 2);
    const wid = w * Math.pow(e, 0.5 + tip * 0.7) * (1 - tip * 0.35 * u) + (i === 0 ? w * 0.08 : 0);
    for (let j = 0; j <= ws; j++) {
      const v = (j / ws) * 2 - 1;
      pos.push(v * wid, u, cup * v * v * (wid / Math.max(w, 1e-3)) + curl * u * u);
      uv.push(j / ws, u);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < ws; j++) {
    const a = i * (ws + 1) + j, b = a + ws + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
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
    case 'petal': { // petal:šířka:miska:zahnutí:špička  – lístek dlouhý 1 podél +y, vnitřek k +z
      return petalGeo(n(1), n(2), n(3), n(4) || 0);
    }
    case 'leafX': return leafGeo(n(1), n(2), n(3), n(4) || 0);
    case 'cyl': return new THREE.CylinderGeometry(1, 1, 1, Number(p[1]) || 16, 1);
    case 'cone2': return new THREE.ConeGeometry(1, 1, Number(p[1]) || 8);
    case 'torus': return new THREE.TorusGeometry(1, n(1), 8, 24, (n(2) || 2) * Math.PI);
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
export function registerMat(key, m) { if (!matCache.has(key)) matCache.set(key, m); return key; }
export function registerGeo(key, make) {
  if (!geoCache.has(key)) { const g = make(); g.computeBoundingBox(); g.computeBoundingSphere(); geoCache.set(key, g); }
  return key;
}
// klíč materiálu: barva|příznaky  (2 = oboustranný, m = kov, t = průhledný, e = svítí, r = guma/matný)
export function getMat(key) {
  let m = matCache.get(key);
  if (m) return m;
  const [col, flags = ''] = key.split('|');
  if (col === 'glass') m = new THREE.MeshStandardMaterial({ color: '#16202b', roughness: 0.05, metalness: 0.5 });
  else if (col === 'chrome') m = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.16, metalness: 1 });
  else if (col === 'light') m = new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#fff4d0', emissiveIntensity: 0.9, roughness: 0.2 });
  else if (col === 'tail') m = new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#c00000', emissiveIntensity: 0.9, roughness: 0.2 });
  else if (col === 'gold') m = new THREE.MeshStandardMaterial({ color: '#d9ad4f', roughness: 0.28, metalness: 1 });
  else if (col === 'rubber') m = new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.85, metalness: 0 });
  else if (col === 'vase') m = new THREE.MeshPhysicalMaterial({ color: '#dff3f2', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
  else m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0 });
  if (flags.includes('2')) m.side = THREE.DoubleSide;
  if (flags.includes('m')) { m.metalness = 0.85; m.roughness = 0.3; }
  if (flags.includes('r')) { m.roughness = 0.75; }
  if (flags.includes('e')) { m.emissive = new THREE.Color(col); m.emissiveIntensity = 0.7; }
  if (flags.includes('t')) { m.transparent = true; m.opacity = 0.45; m.depthWrite = false; }
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
  stem(points, r, mat, segs, order0 = 0, orderSpan = 1, jointMat, r1 = r) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const up = V(0, 1, 0);
    for (let i = 0; i < segs; i++) {
      const a = curve.getPoint(i / segs), b = curve.getPoint((i + 1) / segs);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      const rr = r + (r1 - r) * ((i + 0.5) / segs);
      const m = new THREE.Matrix4().compose(mid, q, V(rr, len * (jointMat ? 0.9 : 1.02), rr));
      const o = order0 + (i / segs) * orderSpan;
      this.put('bar', mat, m, o);
      if (jointMat && i > 0) this.put('ball', jointMat, new THREE.Matrix4().compose(a, q, V(rr * 1.3, rr * 1.1, rr * 1.3)), o);
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
export const geoOf = (g) => { if (typeof g === 'string') return getGeo(g); if (!g.boundingBox) g.computeBoundingBox(); return g; };
const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export class BrickModel {
  constructor(pieces, opts = {}) {
    const { variants = {}, seed = 7, drop = 9 } = opts;
    this.group = new THREE.Group();
    this.variantMats = {};
    for (const [name, v] of Object.entries(variants)) {
      const m = new THREE.MeshStandardMaterial({ color: v.color, roughness: v.metal ? 0.3 : (v.rough ?? 0.3), metalness: v.metal ? 0.85 : 0 });
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
    for (const p of pieces) { tmp.copy(geoOf(p.geo).boundingBox).applyMatrix4(p.m); box.union(tmp); }
    this.box = box;
    const size = box.getSize(V());
    const sizeK = Math.max(size.x, size.y, size.z) / 22;

    // skupiny pro instancing
    const groups = new Map();
    for (const p of pieces) {
      const k = (typeof p.geo === 'string' ? p.geo : p.geo.uuid) + '#' + p.mat;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    }
    this.meshes = [];
    this.items = [];
    for (const list of groups.values()) {
      const { geo, mat } = list[0];
      let material;
      if (mat.startsWith('var:')) material = this.variantMats[mat.slice(4).split('|')[0]] || getMat('#ff00ff');
      else material = getMat(mat);
      const mesh = new THREE.InstancedMesh(geoOf(geo), material, list.length);
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

  setVariant(name, color) {
    if (this.variantMats[name]) this.variantMats[name].color.set(color);
    // odstín pro druhý materiál (např. světlejší listy bonsaje)
    if (this.variantMats[name + '2']) this.variantMats[name + '2'].color.set(color).lerp(new THREE.Color('#ffffff'), 0.22);
  }

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

