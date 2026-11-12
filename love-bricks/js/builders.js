// Registr všech modelů Love Bricks.
// Auta, bonsaj i květiny jsou stavby z originálních dílků (LDraw → Blender → .glb),
// které se po načtení slijí do jednoho modelu (js/solid.js). Procedurálně zůstalo jen srdce.
import * as THREE from 'three';
import { BrickModel, buildHeart } from './models.js';
import { loadSolid, SolidModel } from './solid.js';

export const BUILDERS = { heart: buildHeart }; // procedurální modely (srdce v úvodu přehledu)

// hotové modely z originálních dílků (LDraw), v Blenderu zjednodušené a po načtení slité do jednoho modelu
// body = kódy barev laku pro varianty, fixed = pevné přebarvení, looks = sady přebarvení podle varianty
const BASE = new URL('../models/', import.meta.url);
export const LD_CARS = {
  porsche911: { file: 'porsche911', body: [15] },
  sian: { file: 'sian', body: [27], fixed: { 82: '#C2309A' } },          // růžová verze: purpurové disky
  chiron: { file: 'chiron', body: [321], fixed: { 272: '#1B1D22', 1: '#1B1D22' } }, // oranžová s černou
  // bonsaj 10281: varianta Sakura přebarví listy (zelená, světle zelená) na růžové květy
  bonsai: { file: 'bonsai', flower: true, key: 'foliage', looks: { '#F59BC0': { 2: '#F59BC0', 10: '#FFD3E4' } } },
  // květiny složené z dílků (tools/flowers); looks = přebarvení podle zvolené varianty (první varianta = původní barvy)
  orchid: { file: 'orchid', flower: true, key: 'pot', looks: { '#F2F3F2': { 379: '#F2F3F2' }, '#3E4347': { 379: '#3E4347' } } },
  miniorchid: { file: 'miniorchid', flower: true, key: 'petal', looks: { '#F2F3F2': { 78: '#F2F3F2' }, '#FC97AC': { 78: '#FC97AC' } } },
  tulips: { file: 'tulips', flower: true },
  tinyplants: { file: 'tinyplants', flower: true, key: 'pot', looks: { '#F2F3F2': { 484: '#F2F3F2' }, '#3E4347': { 484: '#3E4347' } } },
  cactus: { file: 'cactus', flower: true, key: 'pot', looks: { '#FC97AC': { 212: '#FC97AC' }, '#F2F3F2': { 212: '#F2F3F2' } } },
  chrysanthemum: { file: 'chrysanthemum', flower: true, key: 'flower', looks: { '#F5C518': { 25: '#F5C518', 484: '#E0A800' }, '#E4569A': { 25: '#E4569A', 484: '#C2307A' } } },
  peacelily: { file: 'peacelily', flower: true, key: 'pot', looks: { '#F2F3F2': { 78: '#F2F3F2' }, '#A3501E': { 78: '#A3501E' } } },
  plum: { file: 'plum', flower: true, key: 'flower', looks: { '#FC97AC': { 4: '#FC97AC', 320: '#E87FA0' }, '#F2F3F2': { 4: '#F2F3F2', 320: '#E4E4E4' } } }
};
const solidData = new Map();
// na mobilu se načítá odlehčená verze (méně ploch), na počítači plná
export const LITE = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 820;
export function ready(ids = Object.keys(LD_CARS)) {
  return Promise.all(ids.filter((id) => LD_CARS[id] && !solidData.has(id)).map((id) =>
    loadSolid(new URL(LD_CARS[id].file + (LITE ? '-lite' : '') + '.glb', BASE).href).then((s) => solidData.set(id, s))));
}

class LDCar {
  constructor(id, opts) {
    const spec = this.spec = LD_CARS[id];
    this.m = new SolidModel(solidData.get(id), opts);
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
