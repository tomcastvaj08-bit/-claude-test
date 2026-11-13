// Registr všech modelů Love Bricks.
export const MODEL_V = '20261113p'; // zvýšit při každé změně modelů (obejde mezipaměť prohlížeče)
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
  bouquet: { file: 'bouquet', flower: true, vase: { bottom: 30, top: -300, r: 205 } },
  tulips: { file: 'tulips', flower: true, vase: { bottom: 0, top: -215, r: 128 } }, // sada 11501 podle návodů, terakotový květináč
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

// klasický terakotový květináč (podle fotky): kónický, matný, nahoře silnější límec.
// Rozměry v LDU, osa Y dolů jako v LDraw: bottom = dno, top = horní okraj, r = poloměr límce, rb = poloměr dna
function addVase(sm, { bottom, top, r, rb = r * 0.68 }) {
  const mat = new THREE.MeshStandardMaterial({ color: '#C2643C', roughness: 0.86, metalness: 0, envMapIntensity: 0.7, side: THREE.DoubleSide });
  const soil = new THREE.MeshStandardMaterial({ color: '#3B2A1F', roughness: 1 });
  const yb = -bottom / 20, yt = -top / 20, H = yt - yb, R = r / 20, Rb = rb / 20, Rt = R * 0.925, yc = yb + H * 0.79, T = R * 0.07, f = 0.12;
  const body = (y) => Rb + (Rt - Rb) * (y - yb) / H;
  const pts = [new THREE.Vector2(0.001, yb)];
  for (let k = 0; k <= 5; k++) { const a = (k / 5) * Math.PI / 2; pts.push(new THREE.Vector2(Rb - f + Math.sin(a) * f, yb + f - Math.cos(a) * f)); } // zaoblené dno
  pts.push(new THREE.Vector2(body(yc), yc));                                                    // kónické tělo
  pts.push(new THREE.Vector2(R - 0.04, yc + 0.02), new THREE.Vector2(R, yc + 0.08));             // spodní hrana límce
  pts.push(new THREE.Vector2(R, yt - 0.06));
  for (let k = 0; k <= 5; k++) { const a = (k / 5) * Math.PI / 2; pts.push(new THREE.Vector2(R - 0.06 + Math.cos(a) * 0.06, yt - 0.06 + Math.sin(a) * 0.06)); } // oblý okraj
  pts.push(new THREE.Vector2(R - T, yt), new THREE.Vector2(R - T * 1.1, yt - H * 0.12));         // vnitřní stěna
  const pot = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat);
  const fill = new THREE.Mesh(new THREE.CircleGeometry(R - T * 1.1, 64), soil);                 // hlína kousek pod okrajem
  fill.rotation.x = -Math.PI / 2; fill.position.y = yt - H * 0.12;
  sm.model.add(pot, fill);
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
