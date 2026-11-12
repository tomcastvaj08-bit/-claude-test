// Registr všech modelů Love Bricks.
// Květiny se staví procedurálně z kostek, auta se načítají jako skutečné modely
// poskládané z originálních dílků (převedené z knihovny LDraw, viz models/).
import * as THREE from 'three';
import { BrickModel, buildHeart } from './models.js';
import { buildOrchid, buildMiniOrchid, buildTulips, buildTinyPlants, buildCactus, buildChrysanthemum, buildPeaceLily, buildPlumBlossom, buildBonsai } from './flowers.js';
import { loadLDraw, loadCarGLB, LDrawModel } from './ldmodel.js';

export const BUILDERS = {
  orchid: buildOrchid, miniorchid: buildMiniOrchid, tulips: buildTulips, tinyplants: buildTinyPlants, cactus: buildCactus,
  chrysanthemum: buildChrysanthemum, peacelily: buildPeaceLily, plum: buildPlumBlossom, bonsai: buildBonsai,
  heart: buildHeart
};

// auta z originálních dílků: soubor, původní barvy laku (kódy LDraw) a pevné přebarvení
const BASE = new URL('../models/', import.meta.url);
export const LD_CARS = {
  porsche911: { glb: 'porsche911.glb', body: [15] },
  sian: { glb: 'sian.glb', body: [27], fixed: { 82: '#C2309A' } },          // růžová verze: purpurové disky
  // bonsaj 10281: varianta Sakura přebarví listy (zelená, světle zelená) na růžové květy
  bonsai: { glb: 'bonsai.glb', flower: true, key: 'foliage', looks: { '#F59BC0': { 2: '#F59BC0', 10: '#FFD3E4' } } },
  chiron: { glb: 'chiron.glb', body: [321], fixed: { 272: '#1B1D22', 1: '#1B1D22' } } // oranžová s černou
};
const ldData = new Map();
// načte data aut (volitelně jen vybraná) – voláme před stavbou scény
// na mobilu se načítá odlehčená verze z Blenderu (méně ploch), na počítači plná
export const LITE = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 820;
export function ready(ids = Object.keys(LD_CARS)) {
  return Promise.all(ids.filter((id) => LD_CARS[id]).map((id) => {
    const spec = LD_CARS[id];
    const p = spec.glb ? loadCarGLB(new URL(LITE ? spec.glb.replace('.glb', '-lite.glb') : spec.glb, BASE).href) : loadLDraw(new URL(spec.file, BASE).href);
    return p.then((d) => ldData.set(id, d));
  }));
}

class LDCar {
  constructor(id, opts) {
    const spec = LD_CARS[id];
    this.m = new LDrawModel(ldData.get(id), opts);
    for (const [code, hex] of Object.entries(spec.fixed || {})) this.m.recolor.set(+code, new THREE.Color(hex));
    this.spec = spec;
    this.group = new THREE.Group();
    const inner = new THREE.Group(); inner.rotation.y = spec.flower ? 0 : Math.PI / 2; inner.add(this.m.group); // příď do +x
    this.group.add(inner);
    this.box = this.m.box.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(spec.flower ? 0 : Math.PI / 2));
    this.m.applyColors();
  }
  get progress() { return this.m.progress; }
  get items() { return this.m.items; }
  get meshes() { return this.m.meshes; }
  setProgress(t) { this.m.setProgress(t); }
  setVariant(key, hex) {
    const s = this.spec;
    if (s.looks) { // pevné sady přebarvení (původní barvy = bez přebarvení)
      if (key !== s.key) return;
      const all = new Set(Object.values(s.looks).flatMap((l) => Object.keys(l)));
      for (const code of all) if (!(s.fixed && code in s.fixed)) this.m.recolor.delete(+code);
      for (const [code, h] of Object.entries(s.looks[hex] || {})) this.m.recolor.set(+code, new THREE.Color(h));
      this.m.refresh();
    } else if (key === 'body') this.m.setVariant(key, hex, s.body);
  }
}

const defCache = new Map();
export function createModel(id, opts = {}) {
  if (LD_CARS[id]) {
    if (!ldData.has(id)) throw new Error('Model ' + id + ' ještě není načtený – zavolej ready()');
    return new LDCar(id, opts);
  }
  if (!defCache.has(id)) defCache.set(id, BUILDERS[id]());
  const def = defCache.get(id);
  return new BrickModel(def.pieces, { variants: def.variants, seed: id.length * 13 + 5, ...opts });
}
