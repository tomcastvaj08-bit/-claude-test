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
export function loadSolid(url, aoUrl = null) {
  if (!cache.has(url)) cache.set(url, Promise.all([
    getLoader().then((l) => l.loadAsync(url)),
    aoUrl ? fetch(aoUrl).then((r) => (r.ok ? r.arrayBuffer() : null)).then(gunzip).catch(() => null) : null
  ]).then(([g, ao]) => applyAO(merge(g.scene), ao)));
  return cache.get(url);
}
// stínování je uložené zkomprimované (gzip); když ho server/prohlížeč už rozbalil, použije se rovnou
async function gunzip(buf) {
  if (!buf) return null;
  const u = new Uint8Array(buf);
  if (u[0] !== 0x1f || u[1] !== 0x8b) return buf;
  if (typeof DecompressionStream === 'undefined') return null;
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
// zapečené stínování v záhybech (Blender, ambient occlusion): 1 bajt na vrchol, ve stejném pořadí jako slité geometrie
function applyAO(group, buf) {
  if (!buf) return group;
  const a = new Uint8Array(buf);
  const total = group.children.reduce((n, m) => n + m.geometry.attributes.position.count, 0);
  if (a.length !== total) { console.warn('AO nesedí k modelu', a.length, total); return group; }
  let o = 0;
  for (const m of group.children) {
    const n = m.geometry.attributes.position.count, ao = new Float32Array(n);
    for (let k = 0; k < n; k++) ao[k] = a[o + k] / 255;
    m.geometry.setAttribute('ao', new THREE.BufferAttribute(ao, 1)); o += n;
  }
  return group;
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
    const pos = new Float32Array(G.v * 3), nrm = new Float32Array(G.v * 3), ao = new Float32Array(G.v).fill(1), idx = new Uint32Array(G.i);
    let vo = 0, io = 0;
    for (const { geo, list } of G.parts) {
      const P = geo.attributes.position, N = geo.attributes.normal, C = geo.attributes.color, n = P.count, I = geo.index;
      for (const M of list) {
        nm.getNormalMatrix(M);
        for (let k = 0; k < n; k++) {
          v.fromBufferAttribute(P, k).applyMatrix4(M); pos.set([v.x, v.y, v.z], (vo + k) * 3);
          if (N) { v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); nrm.set([v.x, v.y, v.z], (vo + k) * 3); }
          if (C) ao[vo + k] = C.getX(k); // zapečené stínování v záhybech (Blender, ambient occlusion)
        }
        if (I) for (let k = 0; k < I.count; k++) idx[io + k] = I.getX(k) + vo; else for (let k = 0; k < n; k++) idx[io + k] = vo + k;
        vo += n; io += I ? I.count : n;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('ao', new THREE.BufferAttribute(ao, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    out.add(new THREE.Mesh(g, G.mat));
  }
  return out;
}

// Realistický ABS plast: lesklý lak (clearcoat), jemné odlesky okolí, zapečené stínování v záhybech.
const METAL = new Set([82, 297, 80, 383, 334, 135, 179]); // kovové zlaté a stříbrné barvy
function plastic(src) {
  const code = codeOf(src), metal = METAL.has(code) || src.metalness > 0.5;
  const m = new THREE.MeshPhysicalMaterial({
    color: src.color, transparent: src.transparent, opacity: src.opacity, depthWrite: !src.transparent, side: THREE.DoubleSide,
    roughness: src.transparent ? 0.05 : metal ? 0.3 : 0.34, metalness: metal ? 0.85 : 0, sheen: metal ? 0 : 0.25, sheenRoughness: 0.6, sheenColor: '#ffffff',
    clearcoat: metal ? 0.2 : 0.45, clearcoatRoughness: 0.18, specularIntensity: 0.7, ior: 1.46, envMapIntensity: metal ? 1.25 : 1.0
  });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float ao;\nvarying float vAO;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAO = ao;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAO;')
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
        float aoV = mix(1.0, pow(clamp(vAO, 0.0, 1.0), 0.8), 0.78); // měkké stíny v záhybech
        reflectedLight.indirectDiffuse *= aoV; reflectedLight.indirectSpecular *= aoV;
        reflectedLight.directDiffuse *= mix(1.0, aoV, 0.6); reflectedLight.directSpecular *= aoV;`);
  };
  m.customProgramCacheKey = () => 'lb-plastic';
  return m;
}
const codeOf = (mat) => { const m = /ld_(\d+)/.exec(mat?.name || ''); return m ? +m[1] : -1; };

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
        const m = plastic(src);
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
    const e = 1 - Math.pow(1 - t, 3);
    this.model.visible = t > 0.001;
    if (this.appear) { // jen se objeví na místě (jemné prolnutí), nepadá
      this.model.position.y = 0; this.model.rotation.y = 0; this.model.scale.set(1, 1, 1); this.setOpacity(e);
      return;
    }
    this.setOpacity(1);
    // pád jako ze skutečné výšky (zrychluje), tvrdý dopad: krátké přimáčknutí k podlaze, žádný odskok
    const FALL = 0.72, f = Math.min(1, t / FALL), u = Math.max(0, (t - FALL) / (1 - FALL));
    const sq = t < FALL ? 0 : Math.sin(Math.PI * Math.min(1, u * 1.15)) * Math.exp(-u * 2.2) * 0.075;
    const sy = 1 - sq, sxz = 1 + sq * 0.45, y0 = this.box.min.y;
    this.model.scale.set(sxz, sy, sxz);
    this.model.position.y = (1 - f * f) * this.drop + y0 * (1 - sy);
    this.model.rotation.y = (1 - f) * 0.25;
  }
  setOpacity(o) {
    if (!this._fade) { this._fade = []; const seen = new Set(); this.model.traverse((m) => { if (!m.isMesh) return; for (const mt of [].concat(m.material)) if (!seen.has(mt)) { seen.add(mt); this._fade.push([mt, mt.opacity, mt.transparent]); } }); }
    const fading = o < 0.999;
    if (fading === this._fading && (!fading || Math.abs(o - this._o) < 1e-3)) return;
    this._fading = fading; this._o = o;
    for (const [mt, op, tr] of this._fade) {
      mt.opacity = op * o;
      const want = tr || fading; if (mt.transparent !== want) { mt.transparent = want; mt.needsUpdate = true; }
    }
  }
  // přebarvení: kódy barev LDraw → barva (null = původní)
  recolor(map) {
    for (const [code, hex] of Object.entries(map)) {
      const m = this.mats.get(+code); if (!m) continue;
      m.color.copy(hex ? new THREE.Color(hex) : this.base.get(+code));
      if (hex) m.metalness = Math.min(m.metalness, 0.3); // přebarvené kovové dílky (zlatý pás) nesmí zešednout
    }
  }
}
