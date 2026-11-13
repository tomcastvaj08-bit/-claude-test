// Registr všech modelů Love Bricks.
export const MODEL_V = '20261113k'; // zvýšit při každé změně modelů (obejde mezipaměť prohlížeče)
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
  bouquet: { file: 'bouquet', flower: true, vase: { bottom: 30, top: -440, r: 175, prof: [[0, 0.62], [0.015, 0.8], [0.06, 0.9], [0.3, 0.97], [0.55, 0.92], [0.72, 0.95], [0.86, 1.05], [0.95, 1.13], [1, 1.17]] } }, // rozevřené hrdlo – stonky se nahoře rozbíhají
  tulips: { file: 'tulips', flower: true, vase: { bottom: 0, top: -430, r: 150, prof: [[0, 0.62], [0.015, 0.8], [0.06, 0.9], [0.3, 0.97], [0.55, 0.92], [0.72, 0.95], [0.86, 1.05], [0.95, 1.13], [1, 1.17]] } }, // sada 11501 podle návodů
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

// baňatá spodní část, zúžené hrdlo, mírně rozevřený okraj
const VASE_PROF = [[0, 0.62], [0.015, 0.8], [0.06, 0.9], [0.24, 1], [0.48, 0.97], [0.72, 0.83], [0.88, 0.76], [0.96, 0.78], [1, 0.82]];
// designová keramická váza (krémová glazura, jemné svislé žebrování) – rozměry v LDU, osa Y dolů jako v LDraw
function addVase(sm, { bottom, top, r, prof = VASE_PROF }) {
  const mat = new THREE.MeshPhysicalMaterial({ color: '#EEE7DB', roughness: 0.42, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.12, specularIntensity: 0.6, ior: 1.5, envMapIntensity: 0.9, side: THREE.DoubleSide });
  const inner = new THREE.MeshStandardMaterial({ color: '#4A3F36', roughness: 0.9 });
  const yb = -bottom / 20, yt = -top / 20, R = r / 20, pts = [];
  pts.push(new THREE.Vector2(0.001, yb));
  for (const [t, k] of prof) pts.push(new THREE.Vector2(R * k, yb + (yt - yb) * t));
  const g = new THREE.LatheGeometry(pts, 144), P = g.attributes.position, RIBS = 22;
  for (let i = 0; i < P.count; i++) { // žebra: zaoblené vlnky po obvodu, u dna a okraje slábnou
    const x = P.getX(i), z = P.getZ(i), y = P.getY(i), a = Math.atan2(x, z), t = (y - yb) / (yt - yb);
    const fade = Math.min(1, Math.max(0, t / 0.08)) * Math.min(1, Math.max(0, (0.95 - t) / 0.06));
    const k = 1 + 0.028 * fade * (Math.pow(Math.abs(Math.cos(a * RIBS / 2)), 0.6) - 0.6);
    P.setX(i, x * k); P.setZ(i, z * k);
  }
  g.computeVertexNormals();
  const vase = new THREE.Mesh(g, mat);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(R * prof[prof.length - 2][1] * 0.95, 48), inner); // tmavý vnitřek hrdla
  hole.rotation.x = -Math.PI / 2; hole.position.y = yt - (yt - yb) * 0.05;
  sm.model.add(vase, hole);
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
