// Love Bricks – modely sestavené z originálních dílků (formát .lbm převedený z LDraw).
// Každý dílek je samostatný kus, který při skládání dopadne na své místo.
// Po složení se celý model spojí do jedné geometrie (ve workeru), aby se kreslil rychle.
import * as THREE from 'three';

const C = new THREE.Matrix4().makeScale(1 / 20, -1 / 20, -1 / 20); // LDU → výstupky, osa Y nahoru

function parse(buf) {
  const dv = new DataView(buf);
  const hl = dv.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
  const base = 4 + hl + ((4 - ((4 + hl) % 4)) % 4);
  const at = (Type, off, n) => new Type(buf, base + off, n);
  const geoms = header.geoms.map((g) => ({
    ref: g.ref,
    pos: at(Float32Array, g.pos, g.n * 3), nrm: at(Int8Array, g.nrm, g.n * 3), col: at(Uint8Array, g.col, g.n * 4),
    idx: g.i32 ? at(Uint32Array, g.idx, g.ni) : at(Uint16Array, g.idx, g.ni)
  }));
  const P = header.place;
  return { buffer: buf, header, geoms, m: at(Float32Array, P.m, P.n * 12), g: at(Int32Array, P.g, P.n), c: at(Int32Array, P.c, P.n), s: at(Int32Array, P.s, P.n), n: P.n };
}

// materiál: barva dílku z instance, pevné barvy (potisk) z vertexu
function makeMaterial(transparent) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0, side: THREE.DoubleSide });
  if (transparent) { m.transparent = true; m.opacity = 0.55; m.depthWrite = false; m.roughness = 0.05; }
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <color_pars_vertex>', '#include <color_pars_vertex>\nattribute vec4 color4;')
      .replace('#include <color_vertex>', `
        vColor = vec3(1.0);
        #ifdef USE_INSTANCING_COLOR
          vColor = mix(instanceColor.rgb, color4.rgb, color4.a);
        #else
          vColor = color4.rgb;
        #endif`);
  };
  m.customProgramCacheKey = () => 'lb-ld-' + (transparent ? 't' : 'o');
  return m;
}
const MAT = { o: null, t: null, bo: null, bt: null };
function mats() {
  if (!MAT.o) { MAT.o = makeMaterial(false); MAT.t = makeMaterial(true); MAT.bo = makeMaterial(false); MAT.bt = makeMaterial(true); }
  return MAT;
}

const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
let worker = null, jobId = 0; const jobs = new Map();
function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./ldbake.worker.js', import.meta.url));
    worker.onmessage = (e) => { const j = jobs.get(e.data.id); if (j) { jobs.delete(e.data.id); j(e.data); } };
  }
  return worker;
}

export class LDrawModel {
  constructor(data, opts = {}) {
    const d = data, M = mats();
    this.data = d;
    this.group = new THREE.Group();
    this.colorOf = new Map();
    for (const [code, [hex, alpha]] of Object.entries(d.header.colors)) this.colorOf.set(+code, { color: new THREE.Color(hex), trans: alpha < 0.99 });
    this.recolor = new Map(); // kód barvy → nová barva (varianty laku)
    // geometrie dílků
    this.geos = d.geoms.map((g) => {
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(g.pos, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(g.nrm, 3, true));
      bg.setAttribute('color4', new THREE.BufferAttribute(g.col, 4, true));
      bg.setIndex(new THREE.BufferAttribute(g.idx, 1));
      bg.computeBoundingBox();
      return bg;
    });
    // umístění
    const tmp = new THREE.Matrix4(), box = new THREE.Box3(), gb = new THREE.Box3();
    this.items = [];
    const groups = new Map();
    for (let i = 0; i < d.n; i++) {
      const a = d.m.subarray(i * 12, i * 12 + 12);
      tmp.set(a[0], a[1], a[2], a[9], a[3], a[4], a[5], a[10], a[6], a[7], a[8], a[11], 0, 0, 0, 1);
      const m = C.clone().multiply(tmp);
      gb.copy(this.geos[d.g[i]].boundingBox).applyMatrix4(m); box.union(gb);
      const code = d.c[i], info = this.colorOf.get(code) || { color: new THREE.Color('#888'), trans: false };
      const key = d.g[i] + (info.trans ? 't' : 'o');
      if (!groups.has(key)) groups.set(key, []);
      const it = { i, m, code, geo: d.g[i], trans: info.trans, step: d.s[i], y: gb.getCenter(new THREE.Vector3()).y };
      groups.get(key).push(it); this.items.push(it);
    }
    this.box = box;
    const size = box.getSize(new THREE.Vector3());
    const sizeK = Math.max(size.x, size.y, size.z) / 22;
    // pořadí skládání: podle kroků návodu, uvnitř kroku zdola nahoru
    const maxStep = Math.max(1, d.header.steps);
    const sorted = this.items.slice().sort((a, b) => (a.step - b.step) || (a.y - b.y));
    const N = sorted.length;
    this.dur = Math.min(0.3, Math.max(0.05, 30 / N));
    sorted.forEach((it, r) => { it.start = (r / Math.max(1, N - 1)) * (1 - this.dur); });
    let seed = 7; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const drop = opts.drop ?? 14;
    this.meshes = [];
    for (const [key, list] of groups) {
      const trans = key.endsWith('t');
      const mesh = new THREE.InstancedMesh(this.geos[list[0].geo], trans ? M.t : M.o, list.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      list.forEach((it, k) => {
        it.mesh = mesh; it.idx = k;
        it.pos = new THREE.Vector3(); it.q = new THREE.Quaternion(); it.s = new THREE.Vector3();
        it.m.decompose(it.pos, it.q, it.s);
        it.off = new THREE.Vector3((R() - 0.5) * 3 * sizeK, (drop + R() * 6) * sizeK, (R() - 0.5) * 3 * sizeK);
        it.q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 2, (R() - 0.5) * 2, (R() - 0.5) * 2)).multiply(it.q);
        it.state = -1;
        mesh.setMatrixAt(k, it.m);
      });
      this.meshes.push(mesh); this.group.add(mesh);
    }
    this.applyColors();
    this.progress = 1;
    this.baked = null; this.baking = false; this.bakeVersion = 0;
    this._m = new THREE.Matrix4(); this._p = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
  }

  colorFor(code) { return this.recolor.get(code) || (this.colorOf.get(code)?.color ?? new THREE.Color('#888')); }
  applyColors() {
    for (const it of this.items) it.mesh.setColorAt(it.idx, this.colorFor(it.code));
    for (const m of this.meshes) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
  // varianta laku: přebarví všechny dílky v daných původních barvách
  setVariant(_key, hex, codes) {
    if (!codes) return;
    const c = new THREE.Color(hex);
    for (const code of codes) this.recolor.set(code, c);
    this.refresh();
  }
  // po změně this.recolor: přebarví dílky a znovu spojí složený model
  refresh() {
    this.applyColors();
    this.bakeVersion++;
    if (this.baked) { this.group.remove(this.baked); this.baked = null; }
    if (this.progress >= 1) this.bake();
    this.meshes.forEach((m) => { m.visible = !this.baked; });
  }

  setProgress(t) {
    t = Math.min(1, Math.max(0, t));
    if (Math.abs(t - this.progress) < 1e-5) return;
    this.progress = t;
    if (t < 1 && this.baked) { this.baked.visible = false; this.meshes.forEach((m) => { m.visible = true; }); }
    const D = this.dur, dirty = new Set();
    for (const it of this.items) {
      const u = (t - it.start) / D;
      if (u >= 1) { if (it.state === 2) continue; it.state = 2; this._m.copy(it.m); }
      else if (u <= 0) { if (it.state === 0) continue; it.state = 0; this._m.copy(this.zero); }
      else {
        it.state = 1;
        const k = 1 - easeOutBack(u);
        this._p.set(it.pos.x + it.off.x * k, it.pos.y + it.off.y * k, it.pos.z + it.off.z * k);
        this._q.copy(it.q0).slerp(it.q, easeOutCubic(Math.min(1, u * 1.3)));
        this._s.copy(it.s).multiplyScalar(Math.min(1, 0.4 + u * 2.4));
        this._m.compose(this._p, this._q, this._s);
      }
      it.mesh.setMatrixAt(it.idx, this._m); dirty.add(it.mesh);
    }
    for (const m of dirty) m.instanceMatrix.needsUpdate = true;
    if (t >= 1) this.bake();
  }

  // spojí složený model do 2 meshů (neprůhledné + průhledné) – v pozadí ve workeru
  bake() {
    if (this.baked) { this.baked.visible = true; this.meshes.forEach((m) => { m.visible = false; }); return; }
    if (this.baking) return;
    this.baking = true;
    const version = this.bakeVersion;
    const n = this.items.length;
    const mm = new Float32Array(n * 16), cols = new Float32Array(n * 3), geo = new Int32Array(n), trans = new Uint8Array(n);
    this.items.forEach((it, k) => { mm.set(it.m.elements, k * 16); const c = this.colorFor(it.code); cols.set([c.r, c.g, c.b], k * 3); geo[k] = it.geo; trans[k] = it.trans ? 1 : 0; });
    const id = ++jobId;
    jobs.set(id, (res) => {
      this.baking = false;
      if (version !== this.bakeVersion) return this.progress >= 1 && this.bake();
      const M = mats();
      const g = new THREE.Group();
      for (const part of [['o', M.bo], ['t', M.bt]]) {
        const r = res[part[0]]; if (!r || !r.idx.length) continue;
        const bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.BufferAttribute(r.pos, 3));
        bg.setAttribute('normal', new THREE.BufferAttribute(r.nrm, 3, true));
        bg.setAttribute('color4', new THREE.BufferAttribute(r.col, 4, true));
        bg.setIndex(new THREE.BufferAttribute(r.idx, 1));
        bg.computeBoundingSphere();
        g.add(new THREE.Mesh(bg, part[1]));
      }
      this.baked = g; this.group.add(g);
      const show = this.progress >= 1;
      g.visible = show; this.meshes.forEach((m) => { m.visible = !show; });
    });
    const w = getWorker(), d = this.data;
    if (!d.sentToWorker) { // data modelu pošleme jen jednou (kopie souboru), dál jen odkazy
      d.sentToWorker = true; d.key = d.key || 'm' + (++jobId);
      const spec = (v) => [v.byteOffset, v.length];
      w.postMessage({ type: 'data', key: d.key, buffer: d.buffer, geoms: d.geoms.map((x) => ({ pos: spec(x.pos), nrm: spec(x.nrm), col: spec(x.col), idx: spec(x.idx), i32: x.idx instanceof Uint32Array })) });
    }
    w.postMessage({ type: 'bake', id, key: d.key, mats: mm, cols, geo, trans });
  }
}

const cache = new Map();
export function loadLDraw(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); }).then(parse));
  return cache.get(url);
}

// ---------------------------------------------------------------------------
// Auta zoptimalizovaná v Blenderu (GLB + meshopt). Převedeme je do stejné
// struktury jako .lbm, takže skládání po dílcích i spojení ve workeru fungují stejně.
let gltfLoader = null;
async function getGLTFLoader() {
  if (gltfLoader) return gltfLoader;
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('../vendor/three/addons/loaders/GLTFLoader.js'),
    import('../vendor/three/addons/libs/meshopt_decoder.module.js')
  ]);
  gltfLoader = new GLTFLoader(); gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  return gltfLoader;
}
export function loadCarGLB(url) {
  if (cache.has(url)) return cache.get(url);
  const p = getGLTFLoader().then((l) => l.loadAsync(url)).then((gltf) => {
    gltf.scene.updateMatrixWorld(true);
    const Cinv = C.clone().invert();
    const geoKey = new Map(), geomsRaw = [], places = [], colors = {};
    const codeOf = (mat) => { const m = /ld_(\d+)/.exec(mat.name || ''); return m ? +m[1] : 7; };
    const addGeo = (g) => {
      if (geoKey.has(g.uuid)) return geoKey.get(g.uuid);
      const P = g.attributes.position, N = g.attributes.normal, n = P.count;
      const pos = new Float32Array(n * 3), nrm = new Int8Array(n * 3), col = new Uint8Array(n * 4).fill(255);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = P.getX(i); pos[i * 3 + 1] = P.getY(i); pos[i * 3 + 2] = P.getZ(i);
        if (N) { nrm[i * 3] = Math.round(N.getX(i) * 127); nrm[i * 3 + 1] = Math.round(N.getY(i) * 127); nrm[i * 3 + 2] = Math.round(N.getZ(i) * 127); }
        col[i * 4 + 3] = 0;
      }
      const idx = g.index ? (n < 65536 ? new Uint16Array(g.index.array) : new Uint32Array(g.index.array)) : (n < 65536 ? Uint16Array : Uint32Array).from({ length: n }, (_, i) => i);
      geomsRaw.push({ pos, nrm, col, idx }); geoKey.set(g.uuid, geomsRaw.length - 1);
      return geomsRaw.length - 1;
    };
    const im = new THREE.Matrix4(), w = new THREE.Matrix4();
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const gi = addGeo(o.geometry), code = codeOf(o.material);
      if (!colors[code]) colors[code] = ['#' + o.material.color.getHexString(), o.material.transparent ? o.material.opacity : 1, o.material.metalness > 0.5 ? 1 : 0, o.material.name];
      const count = o.isInstancedMesh ? o.count : 1;
      for (let k = 0; k < count; k++) {
        if (o.isInstancedMesh) { o.getMatrixAt(k, im); w.multiplyMatrices(o.matrixWorld, im); } else w.copy(o.matrixWorld);
        const t = Cinv.clone().multiply(w).elements; // zpět do souřadnic LDraw, LDrawModel je znovu převede
        places.push({ g: gi, c: code, m: [t[0], t[4], t[8], t[1], t[5], t[9], t[2], t[6], t[10], t[12], t[13], t[14]] });
      }
    });
    // vše do jednoho bufferu (worker dostane soubor jednou a pracuje s posuny)
    let size = 0; const al = (s) => (s + 3) & ~3;
    for (const g of geomsRaw) size += al(g.pos.byteLength) + al(g.nrm.byteLength) + al(g.col.byteLength) + al(g.idx.byteLength);
    const buf = new ArrayBuffer(size); let off = 0;
    const put = (a) => { const T = a.constructor; const v = new T(buf, off, a.length); v.set(a); off += al(a.byteLength); return v; };
    const geoms = geomsRaw.map((g) => ({ pos: put(g.pos), nrm: put(g.nrm), col: put(g.col), idx: put(g.idx) }));
    const n = places.length, m = new Float32Array(n * 12), gg = new Int32Array(n), cc = new Int32Array(n), ss = new Int32Array(n);
    places.forEach((p, i) => { m.set(p.m, i * 12); gg[i] = p.g; cc[i] = p.c; });
    return { buffer: buf, header: { colors, steps: 1 }, geoms, m, g: gg, c: cc, s: ss, n };
  });
  cache.set(url, p);
  return p;
}
