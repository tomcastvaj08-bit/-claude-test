// Love Bricks – 3D galerie v pohledu první osoby.
// Nekonečná bílá chodba, exponáty střídavě vpravo a vlevo. Pohyb scrollem,
// swipem, šipkou nebo klávesami. Klik na exponát → kamera se k němu otočí
// a vyjede panel s popisem a košíkem.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { initCommon, studify, cart, toast, reduceMotion, flyBrick } from './common.js';
import { byId, fmt } from './products.js';
import { createModel, ready, LITE } from './builders.js?v=20261113j';
import { Figure, loadFigureKit } from './figures.js';

initCommon();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1.3 12H5.3z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/></svg>';

// pořadí v chodbě: dvojice květin naproti sobě
const ORDER = ['orchid', 'miniorchid', 'tulips', 'bonsai', 'bouquet', 'chrysanthemum', 'peacelily', 'plum', 'cactus']; // obě orchideje hned na začátku
// velikost v metrech (výška obřích květin)
const SIZE = { orchid: 3.6, miniorchid: 3.1, tulips: 3.3, bouquet: 3.6, cactus: 3.1, chrysanthemum: 3.5, peacelily: 3.4, plum: 4.0, bonsai: 2.7,
  };
const N = ORDER.length;
const SPACING = 7.6, START = 8.5, EYE = 1.62, WINDOW = 8, REVEAL = 13.5; // okno max. N exponátů (jinak se první místo přepíše)
const BG = '#FFFFFF', FOG = '#FFFFFF';

const portrait = () => innerWidth / innerHeight < 0.9;
const sideX = () => (portrait() ? 1.25 : 1.6);
const stopBefore = () => (portrait() ? 6.2 : 4.6);
// vždy dvojice na jedné úrovni: k sudé + k liché stojí naproti sobě
const slotS = (k) => START + Math.floor(k / 2) * SPACING;
const sideOf = (k) => (k % 2 === 0 ? 1 : -1) * (Math.floor(k / 2) % 2 ? -1 : 1);

// ------------------------------------------------------------ renderer & scéna
const canvas = $('#gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  location.replace('prehled.html');
  throw e;
}
const isTouch = matchMedia('(pointer: coarse)').matches;
const MAX_DPR = Math.min(devicePixelRatio || 1, isTouch ? 2 : 2), MIN_DPR = Math.min(devicePixelRatio || 1, 1.5);
let dpr = MAX_DPR;
renderer.setPixelRatio(dpr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
// golden hour: teplé růžovozlaté světlo, na konci chodby září slunce
scene.background = new THREE.Color(BG); // čistě bílá galerie
scene.fog = new THREE.Fog(FOG, 8, 22); // dál v chodbě jen teplý opar – exponáty se objevují až zblízka
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.9; // odlesky okolí na lesklém plastu
pm.dispose();
scene.add(new THREE.HemisphereLight(0xFFFDF8, 0xE6DED4, 0.9)); // teplý odraz od podlahy, měkké přechody // méně plochého světla – víc hloubky a stínů v záhybech
// měkké světlo zepředu (aby exponáty nebyly tmavé) + nízké zlaté slunce z konce chodby
const sun = new THREE.DirectionalLight(0xFFF4E6, 1.25); sun.position.set(4, 10, 6); scene.add(sun);
const sunT = new THREE.Object3D(); scene.add(sunT); sun.target = sunT;
const gold = new THREE.DirectionalLight(0xFFFFFF, 1.1); scene.add(gold);
const goldT = new THREE.Object3D(); scene.add(goldT); gold.target = goldT;


const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 90);

// nekonečná bílá podlaha (posouvá se s kamerou)
// podlaha z bílých lesklých hladkých dílků 2×1 (bez výstupků), kladených na vazbu jako dlažba
const TILE_P = 1.2; // perioda textury v metrech: 4 dílky 2×1 na šířku, 8 řad (dílek 30 × 15 cm)
const floorTex = (() => {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const bump = document.createElement('canvas'); bump.width = bump.height = S;
  const b = bump.getContext('2d');
  g.fillStyle = '#cfcac3'; g.fillRect(0, 0, S, S);
  b.fillStyle = '#000'; b.fillRect(0, 0, S, S);
  const tw = S / 4, th = S / 8, gap = 3, rad = 4;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  for (let row = 0; row < 8; row++) {
    const off = row % 2 ? tw / 2 : 0;
    for (let i = -1; i < 5; i++) {
      const x = i * tw + off + gap / 2, y = row * th + gap / 2, w = tw - gap, h = th - gap;
      const grd = g.createLinearGradient(x, y, x, y + h);
      grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#fbfbfa'); grd.addColorStop(1, '#f0efed');
      g.fillStyle = grd; rr(g, x, y, w, h, rad); g.fill();
      g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 1.5; rr(g, x + 1.5, y + 1.5, w - 3, h - 3, rad - 1); g.stroke();
      b.fillStyle = '#fff'; rr(b, x, y, w, h, rad); b.fill();
    }
  }
  const t = new THREE.CanvasTexture(c), tb = new THREE.CanvasTexture(bump);
  for (const tx of [t, tb]) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(240 / TILE_P, 240 / TILE_P); tx.anisotropy = 16; tx.rotation = Math.PI / 2; }
  t.colorSpace = THREE.SRGBColorSpace;
  return { t, tb };
})();
const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: floorTex.t, bumpMap: floorTex.tb, bumpScale: 0.8, roughness: 0.04, metalness: 0.05, envMapIntensity: 1.9 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);

// lesklá podlaha: skutečný odraz – scéna se vykreslí zrcadlově do textury (v poloviční velikosti) a vmíchá se do dlaždic
const refl = { rt: new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false }), cam: new THREE.PerspectiveCamera(), mat: new THREE.Matrix4(), k: 0.16 };
floor.material.onBeforeCompile = (sh) => {
  sh.uniforms.tRefl = { value: refl.rt.texture }; sh.uniforms.uTexMat = { value: refl.mat }; sh.uniforms.uReflK = { value: refl.k };
  sh.vertexShader = 'uniform mat4 uTexMat;\nvarying vec4 vReflUv;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvReflUv = uTexMat * vec4( transformed, 1.0 );');
  sh.fragmentShader = 'uniform sampler2D tRefl;\nuniform float uReflK;\nvarying vec4 vReflUv;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, texture2DProj( tRefl, vReflUv ).rgb, uReflK );');
};
const _rp = { v: V(), look: V(), tgt: V(), n: V(0, 1, 0), rot: new THREE.Matrix4(), cp: V() };
function renderReflection() {
  const { cam } = refl, P = _rp;
  camera.updateMatrixWorld(); P.cp.setFromMatrixPosition(camera.matrixWorld);
  P.v.set(P.cp.x, -P.cp.y, P.cp.z);
  P.rot.extractRotation(camera.matrixWorld);
  P.look.set(0, 0, -1).applyMatrix4(P.rot).add(P.cp); P.tgt.set(P.look.x, -P.look.y, P.look.z);
  cam.position.copy(P.v); cam.up.set(0, 1, 0).applyMatrix4(P.rot).reflect(P.n); cam.lookAt(P.tgt);
  cam.far = camera.far; cam.updateMatrixWorld(); cam.projectionMatrix.copy(camera.projectionMatrix);
  refl.mat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse).multiply(floor.matrixWorld);
  floor.visible = false; figLayer.visible = false;
  for (const ex of exhibits) if (ex.sh) ex.sh.visible = false;
  renderer.setRenderTarget(refl.rt); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(null);
  floor.visible = true; figLayer.visible = true;
  for (const ex of exhibits) if (ex.sh) ex.sh.visible = true;
}

const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,.42)'); grd.addColorStop(0.55, 'rgba(0,0,0,.16)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const shadowGeo = new THREE.PlaneGeometry(1, 1);
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, fog: false });
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

// ------------------------------------------------------------ exponáty
await Promise.all([ready(), loadFigureKit()]);
const selected = {};
const exhibits = ORDER.map((id) => {
  const p = byId(id);
  selected[id] = 0;
  const m = createModel(p.model, { drop: 30 });
  const box = m.box, size = box.getSize(V()), c = box.getCenter(V());
  m.group.position.set(-c.x, -box.min.y, -c.z);
  const car = p.tags.includes('auta');
  const sc = car ? SIZE[id] / size.x : SIZE[id] / size.y;
  const inner = new THREE.Group(); inner.add(m.group); inner.scale.setScalar(sc);
  const spin = new THREE.Group(); spin.add(inner);
  const base = new THREE.Group(); base.add(spin);
  const root = new THREE.Group(); root.add(base);
  const W = size.x * sc, D = size.z * sc, H = size.y * sc;
  // stín: až po dopadu, protažený k divákovi (světlo je na konci chodby)
  const shMat = shadowMat.clone(); shMat.opacity = 0;
  const sh = new THREE.Mesh(shadowGeo, shMat);
  const sw = car ? D * 1.25 + 0.3 : Math.max(W, D) * 1.05 + 0.3, sl = car ? W * 1.3 + 0.6 : Math.max(W, D) * 1.9 + 0.6;
  sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.004, sl * 0.32); sh.scale.set(sw, sl, 1);
  root.add(sh);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), hitMat); hit.position.y = H / 2; spin.add(hit);
  scene.add(root);
  const ex = { id, p, m, root, base, spin, hit, car, sh, shMat, shown: false, t0: 0, H, r: Math.hypot(W, D) / 2, W, D, slot: null, side: 1, user: 0, vel: 0 };
  hit.userData.ex = ex;
  m.setVariant(p.variant.key, p.variant.options[0][1]);
  return ex;
});

function place(ex, k) {
  ex.slot = k;
  const side = sideOf(k);
  ex.side = side;
  ex.root.position.set(side * (sideX() + (ex.car ? ex.D / 2 : Math.min(ex.r, 1.6) * 0.55)), 0, -slotS(k));
  if (ex.car) { // auto podél chodby, předkem k příchozímu a lehce do středu
    const dx = -side * 0.42, dz = 1;
    ex.base.rotation.y = Math.atan2(-dz, dx);
  } else {     // květina natočená do chodby
    ex.base.rotation.y = Math.atan2(-side * 0.9, 0.8);
  }
  if (ex === focusEx) return;
  ex.user = 0;
  ex.spin.rotation.y = 0;
  ex.shown = false;
  ex.m.setProgress(0);
}

// panáčci vykukují z okraje obrazovky (jsou přichycení ke kameře): nohy stojí dole, tělo se nakloní do obrazu,
// vnější rukou se drží jako z okna vlaku. U každé dvojice květin vykoukne holka (srdíčka) a kluk (hvězdičky, mrknutí).
scene.add(camera);
const figLayer = new THREE.Group(); camera.add(figLayer);
const figs = [false, true].map((girl) => {
  const f = new Figure({ girl });
  f.state.show = true; f.anim.show = 1;
  const lean = new THREE.Group(); lean.add(f.root);
  const holder = new THREE.Group(); holder.add(lean); figLayer.add(holder);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 7, 2), hitMat); hit.position.y = 3.5; lean.add(hit);
  hit.userData.fig = f;
  return { f, girl, lean, holder, hit, k: 0, side: girl ? 1 : -1, mood: '', since: 0 };
});
const FIG_D = 2.4;
function placeFig(F, dt, t) {
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * FIG_D, halfW = halfH * camera.aspect;
  const sc = (halfH * 2 * (portrait() ? 0.5 : 0.62)) / 6.4;
  F.holder.scale.setScalar(sc);
  F.k += ((F.target ? 1 : 0) - F.k) * (1 - Math.exp(-dt * (F.target ? 4.5 : 6)));
  const k = ease(clamp(F.k)), side = F.side;
  // pivot u nohou těsně za okrajem obrazovky; schovaný = nakloněný ven, vykouknutí = náklon dovnitř
  const P = portrait();
  F.holder.position.set(side * (halfW + (P ? 0.7 : 0.2) * sc), -halfH - (P ? 1.0 : 0.8) * sc, -FIG_D); // níž a víc do obrazu
  F.lean.rotation.z = side * (-0.4 + k * (P ? 0.82 : 0.95));
  F.holder.visible = F.k > 0.01;
  F.f.update(dt, t);
  F.f.body.rotation.y = -side * 0.35 * k;
  F.f.head.rotation.z = side * 0.28 * k; F.f.head.rotation.y = -side * 0.25 * k + Math.sin(t * 1.3) * 0.05;
  // vnější ruka se drží nahoře, vnitřní mává / ukazuje
  const [L, R] = F.f.arms, outer = side > 0 ? L : R, inner = side > 0 ? R : L;
  outer.shoulder.rotation.x = -2.7 * k;
  inner.shoulder.rotation.x = -k * (0.6 + Math.sin(t * 3) * 0.15);
}

// ------------------------------------------------------------ pohyb
const state = { autoPitch: 0, s: -3, v: 0, target: null, walk: 0, hold: 0, yaw: 0, yawT: 0, pitchT: 0, phase: 0, entered: false };
let mode = 'walk'; // walk | focus
let focusEx = null, tween = null;

function goTo(dir) {
  const stop = stopBefore();
  const s = state.target ?? state.s;
  let best = null;
  for (let k = 0; k < 10000; k++) {
    const t = slotS(k) - stop;
    if (dir > 0 && t > s + 0.6) { best = t; break; }
    if (dir < 0) { if (t < s - 0.6) best = t; else break; }
  }
  if (dir < 0 && best == null) best = 0;
  if (best != null) state.target = Math.max(0, best);
}

function walkPose(out) {
  const bob = Math.sin(state.phase) * 0.022 * clamp(Math.abs(state.v) / 2.5);
  out.pos.set(Math.sin(state.phase * 0.5) * 0.015 * clamp(Math.abs(state.v) / 2.5), EYE + bob, -state.s);
  out.tgt.set(out.pos.x + Math.sin(state.yaw) * 10, EYE - 0.1 + state.pitchT + state.autoPitch, -state.s - Math.cos(state.yaw) * 10);
  return out;
}

function focusPose(ex, out) {
  const P = portrait();
  const c = ex.root.position.clone(); c.y = ex.H * 0.5;
  const tn = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), asp = camera.aspect;
  const availH = P ? 0.44 : 0.8, availW = P ? 0.92 : 0.5;
  const dv = (ex.H * 0.56) / (tn * availH);
  const dh = ((ex.car ? ex.W * 0.55 : ex.r) * 1.1) / (tn * asp * availW);
  const d = Math.max(dv, dh) + ex.r * 0.3;
  const dir = V(-ex.side, ex.car ? 0.34 : 0.12, ex.car ? 0.62 : 0.5).normalize();
  out.pos.copy(c).addScaledVector(dir, d);
  out.pos.y = Math.max(0.8, out.pos.y);
  out.tgt.copy(c);
  const fwd = out.tgt.clone().sub(out.pos), dist = fwd.length(); fwd.normalize();
  const right = fwd.clone().cross(V(0, 1, 0)).normalize();
  if (P) out.tgt.y -= dist * tn * 0.44;
  else out.tgt.addScaledVector(right, dist * tn * asp * 0.42);
  return out;
}

const pose = { pos: V(0, EYE, 3), tgt: V(0, EYE, -10) };
const tmpA = { pos: V(), tgt: V() };

// ------------------------------------------------------------ panel
const panel = $('#ex-panel'), panelBody = $('.ex-scroll', panel);
function details(p) {
  const v = p.variant;
  return `
    <h2 id="ex-title">${p.name}</h2>
    <p class="pcard-line">${p.pieces} dílků · ${p.size}</p>
    <p class="pcard-desc">${p.desc}</p>
    ${v.options.length < 2 ? '' : `<div class="variants" role="group" aria-label="${v.label}"><span>${v.label}:</span>${v.options.map(([n, c], k) => `<button class="swatch" style="--c:${c}" aria-label="${n}" aria-pressed="${k === selected[p.id]}" data-variant="${k}"></button>`).join('')}<em data-vname>${v.options[selected[p.id]][0]}</em></div>`}
    <p class="ex-note">Doprava zdarma od 1 500 Kč · vrácení do 14 dnů</p>`;
}
function openPanel(ex) {
  const p = ex.p;
  panel.dataset.product = p.id;
  panelBody.innerHTML = details(p);
  panelBody.scrollTop = 0;
  $('[data-price]', panel).innerHTML = `${p.old ? `<s>${fmt(p.old)}</s>` : ''}<strong>${fmt(p.price)}</strong>`;
  $('[data-add]', panel).dataset.add = p.id;
  panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-focus');
  studify(panel);
  setTimeout(() => $('[data-unfocus]', panel).focus({ preventScroll: true }), 400);
}
function closePanel() {
  panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-focus');
}

function focus(ex) {
  if (!state.entered) enter();
  if (mode === 'focus' && focusEx === ex) return;
  state.target = null; state.v = 0;
  const from = { pos: pose.pos.clone(), tgt: pose.tgt.clone() };
  focusEx = ex; mode = 'focus';
  tween = { from, t: 0, dur: reduceMotion ? 0.01 : 1.15 };
  ex.m.setProgress(1);
  openPanel(ex);
}
function unfocus() {
  if (mode !== 'focus') return;
  const from = { pos: pose.pos.clone(), tgt: pose.tgt.clone() };
  mode = 'walk';
  // vrátíme se na místo u exponátu, ať je vidět
  state.s = Math.max(0, slotS(focusEx.slot) - stopBefore());
  focusEx.user = 0;
  tween = { from, t: 0, dur: reduceMotion ? 0.01 : 1.0 };
  focusEx = null;
  closePanel();
}
function neighbour(d) {
  if (!focusEx) return;
  const k = Math.max(0, focusEx.slot + d);
  state.s = Math.max(0, slotS(k) - stopBefore());
  updateWindow();
  const ex = exhibits.find((e) => e.slot === k);
  if (ex) { focusEx.user = 0; mode = 'walk'; focus(ex); }
}

// ------------------------------------------------------------ okno exponátů (nekonečná smyčka)
function updateWindow() {
  const k0 = Math.max(0, Math.floor((state.s - 12) / SPACING) * 2);
  const used = new Set();
  for (let k = k0; k < k0 + WINDOW; k++) {
    const ex = exhibits[k % N];
    if (ex.slot !== k) place(ex, k);
    used.add(ex);
  }
  for (const ex of exhibits) {
    ex.inWindow = used.has(ex);
    if (!ex.inWindow) ex.root.visible = false;
  }
}

// ------------------------------------------------------------ vstup
// Po načtení exponáty napadají z nebe a poskládají se, pak sjede tlačítko na drátku.
const introStart = performance.now() + 350;
let introDone = false, shake = 0;
function enter() { /* vstup je hned – ponecháno kvůli kompatibilitě */ }
state.entered = true; state.s = 0;
document.body.classList.add('is-in');

// ---------- teleport o krok vpřed s rozmazáním
function teleport(dir) {
  if (mode !== 'walk' || state.warp) return;
  document.body.classList.add('is-moved');
  goTo(dir);
  const to = state.target; state.target = null;
  if (to == null || Math.abs(to - state.s) < 0.05) return;
  state.warp = { from: state.s, to, t: 0, dur: reduceMotion ? 0.01 : 0.8 };
  state.v = 0;
  document.body.classList.add('is-warp');
  setTimeout(() => document.body.classList.remove('is-warp'), reduceMotion ? 0 : 820);
  hang.classList.add('is-pulled');
  setTimeout(() => hang.classList.remove('is-pulled'), 600);
}

// ------------------------------------------------------------ ovládání
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = exhibits.filter((e) => e.root.visible).map((e) => e.hit).concat(figs.filter((F) => F.holder.visible && F.k > 0.5).map((F) => F.hit));
  const h = ray.intersectObjects(objs, false)[0];
  return h ? h.object.userData : null;
}

addEventListener('wheel', (e) => {
  if (e.target.closest('#ex-panel, .drawer, .modal, .cookie, .mobile-menu')) return;
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  if (mode === 'focus') { panelBody.scrollTop += dy; return; }
  state.target = null; document.body.classList.add('is-moved');
  state.v = clamp(state.v + dy * 0.006, -7, 7);
}, { passive: false });

let pd = null;
canvas.addEventListener('pointerdown', (e) => {
  pd = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), id: e.pointerId, moved: false, lt: performance.now() };
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
});
canvas.addEventListener('pointermove', (e) => {
  if (!pd) { // hover
    if (e.pointerType === 'mouse' && mode === 'walk') {
      state.yawT = -((e.clientX / innerWidth) - 0.5) * 0.22;
      state.pitchT = -((e.clientY / innerHeight) - 0.5) * 0.25;
      const hit = pick(e.clientX, e.clientY);
      canvas.style.cursor = hit ? 'pointer' : '';
    }
    return;
  }
  const dx = e.clientX - pd.lx, dy = e.clientY - pd.ly, now = performance.now();
  if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 8) pd.moved = true;
  if (mode === 'focus' && focusEx) { // otáčení exponátu
    focusEx.user += dx * 0.01; focusEx.vel = (dx * 0.01) / Math.max(8, now - pd.lt) * 16;
  } else if (state.entered && (e.pointerType !== 'mouse' || e.buttons)) { // chůze tažením
    state.target = null;
    const ds = dy * (e.pointerType === 'mouse' ? 0.02 : 0.024);
    state.s = Math.max(0, state.s - ds);
    state.v = clamp(-ds / Math.max(0.008, (now - pd.lt) / 1000), -7, 7);
  }
  pd.lx = e.clientX; pd.ly = e.clientY; pd.lt = now;
});
const pointerEnd = (e) => {
  if (!pd) return;
  if (!pd.moved && performance.now() - pd.t < 500) {
    const hit = pick(e.clientX, e.clientY);
    if (hit?.ex && !(mode === 'focus' && hit.ex === focusEx)) focus(hit.ex);
    else if (hit?.fig) { hit.fig.anim.jump = 1; }
  }
  if (performance.now() - pd.lt > 80) state.v *= 0.3;
  pd = null;
};
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', () => { pd = null; });

// tlačítko vpřed: klepnutí = k dalšímu exponátu, podržení = chůze
const fwd = $('[data-fwd]'), back = $('[data-back]'), hang = $('.hang');
function holdable(btn, dir) {
  let timer = null, held = false;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); held = false;
    timer = setTimeout(() => { held = true; state.hold = dir; state.target = null; }, 280);
  });
  const up = () => { clearTimeout(timer); if (!held && timer) teleport(dir); timer = null; held = false; state.hold = 0; };
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', () => { if (held) up(); });
  btn.addEventListener('pointercancel', () => { clearTimeout(timer); timer = null; held = false; state.hold = 0; });
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); teleport(dir); } });
}
holdable(fwd, 1); holdable(back, -1);

const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape' && mode === 'focus') { unfocus(); return; }
  if (mode === 'focus') { if (e.key === 'ArrowRight') neighbour(1); if (e.key === 'ArrowLeft') neighbour(-1); return; }
  if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) { if (!state.entered) enter(); keys.add(e.key.toLowerCase()); state.target = null; e.preventDefault(); }
  if (e.key === 'Enter' && !state.entered) enter();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-unfocus]')) unfocus();
  if (e.target.closest('[data-next-ex]')) neighbour(1);
  if (e.target.closest('[data-prev-ex]')) neighbour(-1);
  const sw = e.target.closest('#ex-panel .swatch');
  if (sw) {
    const id = panel.dataset.product, p = byId(id), k = Number(sw.dataset.variant);
    selected[id] = k;
    exhibits.find((x) => x.id === id)?.m.setVariant(p.variant.key, p.variant.options[k][1]);
    $$('.swatch', panel).forEach((s, j) => s.setAttribute('aria-pressed', String(j === k)));
    $('[data-vname]', panel).textContent = p.variant.options[k][0];
  }
  const add = e.target.closest('[data-add]');
  if (add) {
    const p = byId(add.dataset.add), [vn, vc] = p.variant.options[selected[p.id]];
    cart.add(p.id, vn, vc); flyBrick(add, vc); toast(`${p.name} je v košíku ♥`);
    try { navigator.vibrate?.(12); } catch (_) {}
  }
});

// ------------------------------------------------------------ smyčka
let last = performance.now(), frames = [];
const perf = { n: 0, sum: 0, max: 0, reset() { this.n = 0; this.sum = 0; this.max = 0; }, get avg() { return this.n ? this.sum / this.n : 0; } };
window.__lb = { perf, stats: {}, visible: () => exhibits.filter((e) => e.root.visible).map((e) => e.id), get s() { return state.s; }, focusId: () => focusEx?.id || null, goTo, enter, _focus: (id) => focus(exhibits.find((e) => e.id === id)), _ex: () => exhibits.map((e) => [e.id, e.slot, e.inWindow, e.shown, e.dropped, e.root.visible, +e.m.progress.toFixed(2), +(slotS(e.slot) - state.s).toFixed(1)]) };

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  { const k = 0.6 * dpr; refl.rt.setSize(Math.max(4, Math.round(innerWidth * k)), Math.max(4, Math.round(innerHeight * k))); }
  canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  camera.aspect = innerWidth / innerHeight;
  camera.fov = portrait() ? 72 : 55;
  camera.updateProjectionMatrix();
  for (const ex of exhibits) if (ex.slot != null) place(ex, ex.slot);
}
addEventListener('resize', resize);
resize();
updateWindow();
// předkompilace shaderů, ať první krok nezasekne
exhibits.forEach((ex) => { ex.root.visible = true; ex.m.setProgress(1); });
renderer.compile(scene, camera);
exhibits.forEach((ex) => { ex.m.setProgress(0); ex.root.visible = ex.inWindow; });

function frame(now) {
  const t0 = performance.now();
  const rawDt = Math.min(0.1, (now - last) / 1000); last = now;
  const dt = Math.min(0.05, rawDt);
  const t = now / 1000;

  // pohyb
  if (mode === 'walk' && state.warp) {
    const W = state.warp; W.t += rawDt;
    const k = ease(clamp(W.t / W.dur));
    state.s = W.from + (W.to - W.from) * k; state.v = 0;
    if (k >= 1) state.warp = null;
  } else if (mode === 'walk') {
    const kf = keys.has('arrowup') || keys.has('w') ? 1 : keys.has('arrowdown') || keys.has('s') ? -1 : 0;
    const want = state.hold || kf;
    if (want) { state.v += (want * 3.4 - state.v) * (1 - Math.exp(-rawDt * 5)); }
    else if (state.target != null) {
      const diff = state.target - state.s;
      const vt = clamp(diff * 2.4, -6, 6);
      state.v += (vt - state.v) * (1 - Math.exp(-rawDt * 6));
      if (Math.abs(diff) < 0.02) { state.target = null; state.v = 0; }
    } else if (!pd) state.v *= Math.exp(-rawDt * 2.6);
    if (!pd || pd.moved === false) state.s += state.v * rawDt;
    if (state.s < -3) state.s = -3;
    if (state.entered && state.s < 0 && state.target == null) { state.s = 0; state.v = Math.max(0, state.v); }
    state.phase += Math.abs(state.v) * rawDt * 2.3;
  }
  // pohled se při přibližování sám stáčí k nejbližšímu exponátu
  let autoYaw = 0, autoPitch = 0;
  if (mode === 'walk') {
    let bestD = 1e9, hMax = 0;
    for (const ex of exhibits) {
      if (!ex.inWindow) continue;
      const d = slotS(ex.slot) - state.s;
      if (d > 0.5 && d < 16 && d <= bestD + 0.01) { if (d < bestD - 0.01) hMax = 0; bestD = d; hMax = Math.max(hMax, ex.H); }
    }
    if (bestD < 16) { const w = clamp((16 - bestD) / 7) * clamp((bestD - 0.5) / 2.5); autoPitch = clamp(((hMax * 0.55 - EYE) / Math.max(bestD, 3)) * 10 * 0.5, -1, 2.5) * w; }
  }
  state.yaw += (state.yawT + autoYaw - state.yaw) * (1 - Math.exp(-rawDt * 2.2));
  state.autoPitch += (autoPitch - state.autoPitch) * (1 - Math.exp(-rawDt * 2.2));
  updateWindow();

  // postupné objevování: vidět je jen to, co je blízko. Když k exponátu dojdeš, spadne z nebe
  // a poskládá se (dvojice kousek po sobě); co je daleko nebo za tebou, zmizí a příště se složí znovu.
  for (const ex of exhibits) {
    if (!ex.inWindow) continue;
    const d = slotS(ex.slot) - state.s;
    // při teleportu se cílová dvojice začne skládat hned po kliknutí (ne až po doletu)
    const dT = state.warp ? slotS(ex.slot) - state.warp.to : d;
    // první dvojice (orchideje) spadne z nebe při vstupu; ostatní už stojí a jen se vynoří z bílé dálky (mlha)
    if (ex.slot < 2 && !ex.dropped) {
      if (!ex.shown) { ex.shown = true; ex.m.m.appear = false; ex.t0 = introStart + ex.slot * 180; ex.m.setProgress(0); }
      if (!ex.landed && now >= ex.t0 + 760 * 0.72) { ex.landed = true; if (!reduceMotion) shake = Math.max(shake, 1); }
      if (now >= ex.t0 + 760) { ex.dropped = true; ex.m.setProgress(1); }
    } else if (!ex.dropped || !ex.shown) { ex.shown = true; ex.dropped = true; ex.t0 = 0; ex.m.setProgress(1); }
    ex.root.visible = ex.shown && now >= ex.t0 && (ex === focusEx || (d > -8 && d < 26));
    if (!ex.root.visible) continue;
    if (ex !== focusEx && !ex.dropped) ex.m.setProgress(reduceMotion ? 1 : clamp((now - ex.t0) / 760));
    ex.shMat.opacity = ex.shMat.opacity + (clamp((ex.m.progress - 0.97) / 0.03) - ex.shMat.opacity) * (1 - Math.exp(-rawDt * 4));
    // otáčení zaostřeného exponátu
    if (ex === focusEx && !pd) { ex.user += ex.vel; ex.vel *= Math.pow(0.9, rawDt * 60); }
    const swing = ex === focusEx ? Math.sin(t * 0.35) * 0.3 : 0;
    ex.spin.rotation.y += ((ex.user + swing) - ex.spin.rotation.y) * (1 - Math.exp(-rawDt * 6));
  }
  if (!introDone && now - introStart > 2800) { introDone = true; document.body.classList.add('is-ready'); }
  // panáčci: u zastávky (dvojice je složená) vykouknou ke květinám
  {
    let pair = [];
    if (mode === 'walk' && !state.warp && state.target == null && Math.abs(state.v) < 0.4) {
      let best = 1e9;
      for (const ex of exhibits) { if (!ex.inWindow || !ex.root.visible) continue; const d = slotS(ex.slot) - state.s; if (d > 1.5 && d < stopBefore() + 4.5 && d < best - 0.01) best = d; }
      pair = exhibits.filter((ex) => ex.inWindow && ex.root.visible && Math.abs(slotS(ex.slot) - state.s - best) < 0.01 && ex.m.progress >= 0.99);
    }
    // dvojice květin: holka vykoukne u jedné (srdíčka v očích), kluk u druhé (hvězdičky, občas mrkne)
    const sorted = pair.slice().sort((a, b) => a.side - b.side);
    for (const F of figs) {
      const ex = F.girl ? sorted[0] : sorted[1];
      const want = ex ? (F.girl ? 'hearts' : 'stars') : '';
      if (ex && (!F.target || F.side !== ex.side)) {
        if (F.k < 0.05) { F.side = ex.side; F.target = 1; F.since = now; F.f.anim.jump = 1; }
        else F.target = 0; // nejdřív se schová a pak vykoukne na druhé straně
      } else if (!ex) F.target = 0;
      // kluk po chvíli mrkne
      const face = F.target ? (!F.girl && (now - F.since) % 4200 > 3000 && (now - F.since) % 4200 < 3350 ? 'wink' : want) : '';
      F.f.setFace(face);
      placeFig(F, dt, t);
    }
  }

  // kamera
  if (mode === 'focus' && focusEx) focusPose(focusEx, tmpA); else walkPose(tmpA);
  if (tween) {
    tween.t += rawDt;
    const k = ease(clamp(tween.t / tween.dur));
    pose.pos.lerpVectors(tween.from.pos, tmpA.pos, k);
    pose.tgt.lerpVectors(tween.from.tgt, tmpA.tgt, k);
    if (k >= 1) tween = null;
  } else { pose.pos.copy(tmpA.pos); pose.tgt.copy(tmpA.tgt); }
  camera.position.copy(pose.pos);
  camera.lookAt(pose.tgt);
  if (shake > 0.002) { camera.position.y += Math.sin(now * 0.09) * 0.035 * shake; camera.rotation.z += Math.sin(now * 0.07) * 0.004 * shake; shake *= Math.exp(-rawDt * 9); } // otřes při dopadu orchidejí
  floor.position.set(0, 0, Math.round((pose.pos.z - 60) / TILE_P) * TILE_P);
  sun.position.set(pose.pos.x + 4, 10, pose.pos.z + 6); sunT.position.set(pose.pos.x, 0, pose.pos.z - 6);
  gold.position.set(pose.pos.x - 2, 6, pose.pos.z - 30); goldT.position.set(pose.pos.x, 0, pose.pos.z);

  renderReflection();
  renderer.render(scene, camera);

  // adaptivní rozlišení
  frames.push(rawDt);
  if (frames.length >= 90) {
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length; frames = [];
    window.__lb.stats = { fps: Math.round(1 / avg), dpr, calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    if (introDone && avg > 0.034 && dpr > MIN_DPR) { dpr = Math.max(MIN_DPR, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
  }
  const d = performance.now() - t0; perf.n++; perf.sum += d; if (d > perf.max) perf.max = d;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
