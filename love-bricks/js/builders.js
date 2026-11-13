// Registr všech modelů Love Bricks.
export const MODEL_V = '20261113n'; // zvýšit při každé změně modelů (obejde mezipaměť prohlížeče)
// Bonsaj, kytice i květiny jsou stavby z originálních dílků (LDraw → Blender → .glb),
// které se po načtení slijí do jednoho modelu (js/solid.js). Procedurálně zůstalo jen srdce.
import * as THREE from 'three';
import { BrickModel, buildHeart } from './models.js';
import { loadSolid, SolidModel } from './solid.js';

export const BUILDERS = { heart: buildHeart }; // procedurální modely (srdce v úvodu přehledu)

// hotové modely z originálních dílků (LDraw), v Blenderu zjednodušené a po načtení slité do jednoho modelu
// body = kódy barev laku pro varianty, fixed = pevné přebarvení, looks = sady přebarvení podle varianty
const BASE = new URL('../models/', import.meta.url);
export const LD_CARS = {
  // bonsaj 10281: varianta Sakura přebarví listy (zelená, světle zelená) na růžové květy
  bonsai: { file: 'bonsai', flower: true, key: 'foliage', looks: { '#F59BC0': { 2: '#F59BC0', 10: '#FFD3E4' } } },
  // květiny složené z dílků (tools/flowers); looks = přebarvení podle zvolené varianty (první varianta = původní barvy)
  orchid: { file: 'orchid', flower: true, key: 'pot', looks: { '#F2F3F2': { 379: '#F2F3F2' }, '#3E4347': { 379: '#3E4347' } } },
  miniorchid: { file: 'miniorchid', flower: true, fixed: { 82: '#C98F2A' }, key: 'petal', looks: { '#F2F3F2': { 78: '#F2F3F2' }, '#FC97AC': { 78: '#FC97AC' } } },
  // kytice 10280: přesná stavba z LDraw OMR, stonky sesazené do vázy (tools/flowers/bouquet.mjs)
  bouquet: { file: 'bouquet', flower: true, vase: { bottom: 30, top: -400, r: 190, rb: 136 } },
  tulips: { file: 'tulips', flower: true, vase: { bottom: 0, top: -320, r: 112, rb: 80 } }, // sada 11501 podle návodů, černá keramická váza
  cactus: { file: 'cactus', flower: true, key: 'pot', looks: { '#FC97AC': { 212: '#FC97AC' }, '#F2F3F2': { 212: '#F2F3F2' } } },
  chrysanthemum: { file: 'chrysanthemum', flower: true, key: 'flower', looks: { '#F5C518': { 25: '#F5C518', 484: '#E0A800', 191: '#FFE066' }, '#E4569A': { 25: '#E4569A', 484: '#C2307A', 191: '#F59BC0' } } },
  peacelily: { file: 'peacelily', flower: true, key: 'pot', looks: { '#F2F3F2': { 78: '#F2F3F2' }, '#A3501E': { 78: '#A3501E' } } },
  plum: { file: 'plum', flower: true, key: 'flower', looks: { '#FC97AC': { 4: '#FC97AC' }, '#F2F3F2': { 4: '#F2F3F2' } } }
};
const solidData = new Map();
// vždy plná verze modelu (odlehčená byla na mobilu roztřepená)
export const LITE = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 820;
export function ready(ids = Object.keys(LD_CARS)) {
  return Promise.all(ids.filter((id) => LD_CARS[id] && !solidData.has(id)).map((id) =>
    loadSolid(new URL(LD_CARS[id].file + '.glb?v=' + MODEL_V, BASE).href, new URL(LD_CARS[id].file + '.ao.gz?v=' + MODEL_V, BASE).href).then((s) => solidData.set(id, s))));
}

// jednoduchá černá keramická váza: rovný kužel (dole užší, nahoře širší), zaoblená hrana dna, tlustší okraj.
// Rozměry v LDU, osa Y dolů jako v LDraw: bottom = dno, top = horní okraj, r = poloměr nahoře, rb = poloměr dole
function addVase(sm, { bottom, top, r, rb = r * 5 / 7 }) {
  const mat = new THREE.MeshPhysicalMaterial({ color: '#1E1D1C', roughness: 0.38, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.16, specularIntensity: 0.55, ior: 1.5, envMapIntensity: 1.0, side: THREE.DoubleSide });
  const inner = new THREE.MeshStandardMaterial({ color: '#0E0D0C', roughness: 0.95, side: THREE.DoubleSide });
  const yb = -bottom / 20, yt = -top / 20, R = r / 20, Rb = rb / 20, T = 0.22, f = 0.18, pts = [];
  pts.push(new THREE.Vector2(0.001, yb));
  for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI / 2; pts.push(new THREE.Vector2(Rb - f + Math.sin(a) * f, yb + f - Math.cos(a) * f)); } // zaoblená hrana dna
  pts.push(new THREE.Vector2(R, yt - 0.04));
  for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI; pts.push(new THREE.Vector2(R - T / 2 + Math.cos(a) * T / 2, yt + Math.sin(a) * 0.08)); } // oblý okraj
  pts.push(new THREE.Vector2(R - T, yt - 0.3));
  const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat);
  const fill = new THREE.Mesh(new THREE.CircleGeometry(R - T, 64), inner); // tmavý vnitřek kousek pod okrajem
  fill.rotation.x = -Math.PI / 2; fill.position.y = yt - 0.3;
  sm.model.add(vase, fill);
  const py = sm.model.position.y; sm.model.position.y = 0; sm.model.updateMatrixWorld(true);
  sm.box = new THREE.Box3().setFromObject(sm.model);
  sm.model.position.y = py;
}

class LDCar {
  constructor(id, opts) {
    const spec = this.spec = LD_CARS[id];
    this.m = new SolidModel(solidData.get(id), opts);
    if (spec.vase) addVase(this.m, spec.vase);
    this.group = new THREE.Group();
    const inner = new THREE.Group(); inner.rotation.y = spec.flower ? 0 : Math.PI / 2; inner.add(this.m.group); // příď do +x
    this.group.add(inner);
    this.box = this.m.box.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(spec.flower ? 0 : Math.PI / 2));
    if (spec.fixed) this.m.recolor(spec.fixed);
  }
  get progress() { return this.m.progress; }
  setProgress(t) { this.m.setProgress(t); }
  setVariant(key, hex) {
    const s = this.spec;
    if (s.looks) {
      if (key !== s.key) return;
      const reset = {}; for (const l of Object.values(s.looks)) for (const c of Object.keys(l)) reset[c] = null;
      this.m.recolor({ ...reset, ...(s.looks[hex] || {}) });
    } else if (key === 'body') this.m.recolor(Object.fromEntries(s.body.map((c) => [c, hex])));
  }
}

const defCache = new Map();
export function createModel(id, opts = {}) {
  if (LD_CARS[id]) {
    if (!solidData.has(id)) throw new Error('Model ' + id + ' ještě není načtený – zavolej ready()');
    return new LDCar(id, opts);
  }
  if (!defCache.has(id)) defCache.set(id, BUILDERS[id]());
  const def = defCache.get(id);
  return new BrickModel(def.pieces, { variants: def.variants, seed: id.length * 13 + 5, ...opts });
}
