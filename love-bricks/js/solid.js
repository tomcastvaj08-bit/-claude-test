// Love Bricks – hotové modely (květiny, bonsaj, kytice) jako JEDEN slitý model z Blenderu.
// Žádné tisíce samostatných dílků: model se načte vcelku, spadne z nebe a dopadne s lehkým odrazem.
import * as THREE from 'three';

let loader = null;
async function getLoader() {
  if (loader) return loader;
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('../vendor/three/addons/loaders/GLTFLoader.js'),
    import('../vendor/three/addons/libs/meshopt_decoder.module.js')
  ]);
  loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}
const cache = new Map();
// GLB z Blenderu má dílky jako instance (malý soubor). Po načtení je jednou slijeme:
// jedna geometrie na barvu → pár draw callů a za běhu se už nic nepřepočítává.
export function loadSolid(url) {
  if (!cache.has(url)) cache.set(url, getLoader().then((l) => l.loadAsync(url)).then((g) => merge(g.scene)));
  return cache.get(url);
}
function merge(scene) {
  scene.updateMatrixWorld(true);
  const groups = new Map(); // název materiálu → { mat, parts: [{ geo, mats: [Matrix4] }] , v, i }
  const im = new THREE.Matrix4();
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.material.name || o.material.uuid;
    if (!groups.has(key)) groups.set(key, { mat: o.material, parts: [], v: 0, i: 0 });
    const G = groups.get(key), list = [];
    if (o.isInstancedMesh) for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, im); list.push(o.matrixWorld.clone().multiply(im)); }
    else list.push(o.matrixWorld.clone());
    const n = o.geometry.attributes.position.count, ni = o.geometry.index ? o.geometry.index.count : n;
    G.parts.push({ geo: o.geometry, list }); G.v += n * list.length; G.i += ni * list.length;
  });
  const out = new THREE.Group(), v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const G of groups.values()) {
    const pos = new Float32Array(G.v * 3), nrm = new Float32Array(G.v * 3), idx = new Uint32Array(G.i);
    let vo = 0, io = 0;
    for (const { geo, list } of G.parts) {
      const P = geo.attributes.position, N = geo.attributes.normal, n = P.count, I = geo.index;
      for (const M of list) {
        nm.getNormalMatrix(M);
        for (let k = 0; k < n; k++) {
          v.fromBufferAttribute(P, k).applyMatrix4(M); pos.set([v.x, v.y, v.z], (vo + k) * 3);
          if (N) { v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); nrm.set([v.x, v.y, v.z], (vo + k) * 3); }
        }
        if (I) for (let k = 0; k < I.count; k++) idx[io + k] = I.getX(k) + vo; else for (let k = 0; k < n; k++) idx[io + k] = vo + k;
        vo += n; io += I ? I.count : n;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    out.add(new THREE.Mesh(g, G.mat));
  }
  return out;
}

const codeOf = (mat) => { const m = /ld_(\d+)/.exec(mat?.name || ''); return m ? +m[1] : -1; };
const easeOutBounce = (x) => {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};

export class SolidModel {
  // scene: načtená scéna GLB; opts.drop: výška pádu v jednotkách modelu
  constructor(scene, opts = {}) {
    this.group = new THREE.Group();
    this.model = scene.clone(true);
    this.mats = new Map(); // kód barvy → materiál (každý exemplář má vlastní, kvůli variantám)
    this.base = new Map();
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = (Array.isArray(o.material) ? o.material : [o.material]).map((src) => {
        const code = codeOf(src);
        if (this.mats.has(code)) return this.mats.get(code);
        const m = new THREE.MeshStandardMaterial({
          color: src.color, roughness: src.transparent ? 0.05 : 0.3, metalness: src.metalness > 0.5 ? 0.75 : 0,
          transparent: src.transparent, opacity: src.opacity, depthWrite: !src.transparent, side: THREE.DoubleSide
        });
        this.mats.set(code, m); this.base.set(code, src.color.clone());
        return m;
      });
      if (o.material.length === 1) o.material = o.material[0];
      o.frustumCulled = true;
    });
    this.group.add(this.model);
    this.box = new THREE.Box3().setFromObject(this.model);
    this.drop = (opts.drop ?? 30) * (this.box.max.y - this.box.min.y) * 0.08;
    this.progress = 1;
    this.setProgress(0);
  }
  setProgress(t) {
    t = Math.min(1, Math.max(0, t));
    if (Math.abs(t - this.progress) < 1e-4) return;
    this.progress = t;
    // první čtvrtina: neviditelné nahoře, pak pád s odrazem
    const k = Math.min(1, Math.max(0, (t - 0.15) / 0.85));
    this.model.visible = t > 0.15;
    this.model.position.y = (1 - easeOutBounce(k)) * this.drop;
    this.model.rotation.y = (1 - k) * (1 - k) * 0.6;
  }
  // přebarvení: kódy barev LDraw → barva (null = původní)
  recolor(map) {
    for (const [code, hex] of Object.entries(map)) {
      const m = this.mats.get(+code); if (!m) continue;
      m.color.copy(hex ? new THREE.Color(hex) : this.base.get(+code));
    }
  }
}
