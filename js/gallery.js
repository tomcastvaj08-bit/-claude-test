// Love Bricks – 3D galerie v pohledu první osoby.
// Nekonečná bílá chodba, exponáty střídavě vpravo a vlevo. Pohyb scrollem,
// swipem, šipkou nebo klávesami. Klik na exponát → kamera se k němu otočí
// a vyjede panel s popisem a košíkem.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { initCommon, studify, cart, toast, reduceMotion, flyBrick } from './common.js';
import { byId, fmt, OCCASIONS } from './products.js';
import { createModel } from './builders.js';
import { Figure } from './figures.js';

initCommon();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1.3 12H5.3z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/></svg>';

// pořadí v chodbě: květina, auto, květina, auto…
const ORDER = ['orchid', 'huracan', 'tulips', 'sian', 'bonsai', 'daytona', 'miniorchid', 'mclaren', 'chrysanthemum', 'chiron', 'peacelily', 'mercedes', 'plum', 'visiongt', 'cactus', 'tinyplants'];
// velikost v metrech: květiny ~ výška člověka, auta v životní velikosti (délka)
const SIZE = { orchid: 1.95, miniorchid: 1.6, tulips: 1.75, tinyplants: 1.25, cactus: 1.6, chrysanthemum: 1.85, peacelily: 1.75, plum: 2.1, bonsai: 1.45,
  chiron: 4.54, huracan: 4.55, sian: 4.98, daytona: 4.69, mclaren: 4.59, mercedes: 4.95, visiongt: 4.6 };
const N = ORDER.length;
const SPACING = 7.5, START = 9, EYE = 1.62, WINDOW = 8;
const BG = '#F6F4F1';

const portrait = () => innerWidth / innerHeight < 0.9;
const sideX = () => (portrait() ? 2.0 : 3.3);
const stopBefore = () => (portrait() ? 4.6 : 4.2);
const slotS = (k) => START + k * SPACING;

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
const MAX_DPR = Math.min(devicePixelRatio || 1, isTouch ? 1.75 : 2);
let dpr = MAX_DPR;
renderer.setPixelRatio(dpr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 14, 46);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.7;
pm.dispose();
scene.add(new THREE.HemisphereLight(0xffffff, 0xdcd6cc, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(4, 10, 6); scene.add(sun);
const sunT = new THREE.Object3D(); scene.add(sunT); sun.target = sunT;

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 90);

// nekonečná bílá podlaha (posouvá se s kamerou)
const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.92, metalness: 0 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);

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
const selected = {};
const labelsEl = $('#labels');
const exhibits = ORDER.map((id) => {
  const p = byId(id);
  selected[id] = 0;
  const m = createModel(p.model);
  const box = m.box, size = box.getSize(V()), c = box.getCenter(V());
  m.group.position.set(-c.x, -box.min.y, -c.z);
  const car = p.tags.includes('auta');
  const sc = car ? SIZE[id] / size.x : SIZE[id] / size.y;
  const inner = new THREE.Group(); inner.add(m.group); inner.scale.setScalar(sc);
  const spin = new THREE.Group(); spin.add(inner);
  const base = new THREE.Group(); base.add(spin);
  const root = new THREE.Group(); root.add(base);
  const W = size.x * sc, D = size.z * sc, H = size.y * sc;
  const sh = new THREE.Mesh(shadowGeo, shadowMat);
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.004; sh.scale.set(W * 1.35 + 0.4, D * 1.35 + 0.4, 1);
  spin.add(sh);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), hitMat); hit.position.y = H / 2; spin.add(hit);
  scene.add(root);
  const label = document.createElement('button');
  label.className = 'ex-label tile-print';
  label.type = 'button';
  label.innerHTML = `<b>${p.name}</b><span>${fmt(p.price)}</span>`;
  label.setAttribute('aria-label', `${p.name} – zobrazit detail`);
  labelsEl.appendChild(label);
  const ex = { id, p, m, root, base, spin, hit, label, car, H, r: Math.hypot(W, D) / 2, W, D, slot: null, side: 1, user: 0, vel: 0 };
  hit.userData.ex = ex;
  label.addEventListener('click', () => focus(ex));
  m.setVariant(p.variant.key, p.variant.options[0][1]);
  return ex;
});

function place(ex, k) {
  ex.slot = k;
  const side = k % 2 === 0 ? 1 : -1;
  ex.side = side;
  ex.root.position.set(side * (sideX() + (ex.car ? ex.D / 2 - 0.2 : 0.35)), 0, -slotS(k));
  if (ex.car) { // auto podél chodby, předkem k příchozímu a lehce do středu
    const dx = -side * 0.42, dz = 1;
    ex.base.rotation.y = Math.atan2(-dz, dx);
  } else {     // květina natočená do chodby
    ex.base.rotation.y = Math.atan2(-side * 0.9, 0.8);
  }
  if (ex === focusEx) return;
  ex.user = 0;
  ex.spin.rotation.y = 0;
  ex.m.setProgress(0);
}

// panáčci u vchodu (v životní velikosti)
const figs = [false, true].map((girl) => {
  const f = new Figure({ girl });
  const g = new THREE.Group(); g.add(f.root);
  g.position.set(girl ? 3.1 : -3.1, 0, -5.4);
  g.rotation.y = girl ? -0.35 : 0.35;
  f.state.side = girl ? -1 : 1;
  scene.add(g);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.2, 1.8), hitMat); hit.position.y = 2.1; g.add(hit);
  hit.userData.fig = f;
  return { f, g, hit };
});
// Figure.update řídí měřítko rootu (pop-in); měřítko 0.5 držíme na rodičovské skupině
figs.forEach(({ g }) => { g.scale.setScalar(0.64); });

// ------------------------------------------------------------ pohyb
const state = { s: -3, v: 0, target: null, walk: 0, hold: 0, yaw: 0, yawT: 0, pitchT: 0, phase: 0, entered: false };
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
  out.tgt.set(out.pos.x + Math.sin(state.yaw) * 10, EYE - 0.25 + state.pitchT, -state.s - Math.cos(state.yaw) * 10);
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
  const car = p.tags.includes('auta');
  const why = car
    ? ['Vystavíš ho na poličku jako skutečný sběratelský model', 'Stavění na pár večerů – ideální „odpočinkový projekt“', 'Detaily karoserie, kola i spoiler z originálních dílků']
    : ['Nikdy nezvadne a nepotřebuje zalévat', 'Společné skládání = společně strávený čas', 'Vydrží roky jako ozdoba bytu nebo kanceláře'];
  const box = car ? 'Stavebnice, návod v tištěné podobě, nálepky a dárková krabice Love Bricks.' : 'Stavebnice, tištěný návod, kartička s věnováním a dárková krabice Love Bricks.';
  const v = p.variant;
  return `
    <div class="pcard-tags">${p.tags.map((t) => `<span class="chip">${OCCASIONS[t]}</span>`).join('')}</div>
    <h2 id="ex-title">${p.name}</h2>
    <p class="pcard-line">${p.line} · ${p.pieces} dílků · ${p.size} · ${p.age}</p>
    <p class="pcard-desc">${p.desc}</p>
    <div class="variants" role="group" aria-label="${v.label}"><span>${v.label}:</span>${v.options.map(([n, c], k) => `<button class="swatch" style="--c:${c}" aria-label="${n}" aria-pressed="${k === selected[p.id]}" data-variant="${k}"></button>`).join('')}<em data-vname>${v.options[selected[p.id]][0]}</em></div>
    <h3>Proč to potěší</h3>
    <ul class="ex-why">${why.map((w) => `<li>${w}</li>`).join('')}</ul>
    <h3>Parametry</h3>
    <dl class="ex-spec"><dt>Počet dílků</dt><dd>${p.pieces}</dd><dt>Velikost hotového modelu</dt><dd>${p.size}</dd><dt>Doporučený věk</dt><dd>${p.age}</dd><dt>Kolekce</dt><dd>${p.line}</dd></dl>
    <h3>Co je v balení</h3>
    <p>${box}</p>
    <h3>Doručení a vrácení</h3>
    <p>Skladem, odesíláme do 24 hodin. Doprava zdarma od 1 500 Kč, vrácení do 14 dnů bez udání důvodu. Dárkové balení a ručně psané přání zdarma.</p>
    <p class="ex-note">Model v galerii je zvětšený pro efekt – skutečná stavebnice měří ${p.size}.</p>`;
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
  const k0 = Math.max(0, Math.floor((state.s - 9) / SPACING));
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
const intro = $('#intro');
function enter() {
  if (state.entered) return;
  state.entered = true;
  intro.classList.add('is-gone');
  document.body.classList.add('is-in');
  state.target = 0;
  setTimeout(() => { intro.hidden = true; }, 900);
  try { sessionStorage.setItem('lb-entered', '1'); } catch (_) {}
}
$('[data-enter]').addEventListener('click', enter);
try { if (sessionStorage.getItem('lb-entered')) { state.s = 0; enter(); } } catch (_) {}

// ------------------------------------------------------------ ovládání
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = exhibits.filter((e) => e.root.visible).map((e) => e.hit).concat(figs.map((f) => f.hit));
  const h = ray.intersectObjects(objs, false)[0];
  return h ? h.object.userData : null;
}

addEventListener('wheel', (e) => {
  if (e.target.closest('#ex-panel, .drawer, .modal, .cookie, .mobile-menu')) return;
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  if (mode === 'focus') { panelBody.scrollTop += dy; return; }
  if (!state.entered) { if (dy > 0) enter(); return; }
  state.target = null;
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
      exhibits.forEach((x) => x.label.classList.toggle('is-hover', !!hit && hit.ex === x));
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
    else if (hit?.fig) { hit.fig.girl ? hit.fig.set('love', !hit.fig.state.love) : hit.fig.wave(); }
    else if (!state.entered) enter();
  }
  if (performance.now() - pd.lt > 80) state.v *= 0.3;
  pd = null;
};
canvas.addEventListener('pointerup', pointerEnd);
canvas.addEventListener('pointercancel', () => { pd = null; });

// tlačítko vpřed: klepnutí = k dalšímu exponátu, podržení = chůze
const fwd = $('[data-fwd]'), back = $('[data-back]');
function holdable(btn, dir) {
  let timer = null, held = false;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); held = false;
    timer = setTimeout(() => { held = true; state.hold = dir; state.target = null; }, 280);
  });
  const up = () => { clearTimeout(timer); if (!held && timer) { if (!state.entered) enter(); else goTo(dir); } timer = null; held = false; state.hold = 0; };
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', () => { if (held) up(); });
  btn.addEventListener('pointercancel', () => { clearTimeout(timer); timer = null; held = false; state.hold = 0; });
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(dir); } });
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

// ------------------------------------------------------------ HUD
const hudName = $('[data-next-name]'), hudMeta = $('[data-next-meta]');
let hudId = null;
function updateHud() {
  let best = null, bd = 1e9;
  for (const ex of exhibits) {
    if (!ex.inWindow) continue;
    const d = slotS(ex.slot) - state.s;
    if (d > 0.8 && d < bd) { bd = d; best = ex; }
  }
  if (best && best.id !== hudId) {
    hudId = best.id;
    hudName.textContent = best.p.name;
    hudMeta.textContent = `${best.side > 0 ? 'vpravo' : 'vlevo'} · ${fmt(best.p.price)}`;
  }
}

// ------------------------------------------------------------ smyčka
const proj = V();
let last = performance.now(), frames = [];
const perf = { n: 0, sum: 0, max: 0, reset() { this.n = 0; this.sum = 0; this.max = 0; }, get avg() { return this.n ? this.sum / this.n : 0; } };
window.__lb = { perf, stats: {}, get s() { return state.s; }, focusId: () => focusEx?.id || null, goTo, enter };

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
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
  if (mode === 'walk') {
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
  let autoYaw = 0;
  if (mode === 'walk') {
    for (const ex of exhibits) {
      if (!ex.inWindow) continue;
      const d = slotS(ex.slot) - state.s;
      if (d > 0.5 && d < 13) { const w = clamp((13 - d) / 6) * clamp((d - 0.5) / 2.5); autoYaw = Math.atan2(ex.root.position.x, d) * 0.62 * w; break; }
    }
  }
  state.yaw += (state.yawT + autoYaw - state.yaw) * (1 - Math.exp(-rawDt * 2.2));
  updateWindow();

  // skládání podle vzdálenosti
  for (const ex of exhibits) {
    if (!ex.inWindow) continue;
    const d = slotS(ex.slot) - state.s;
    ex.root.visible = d > -14 && d < 44;
    if (!ex.root.visible) continue;
    if (ex !== focusEx) ex.m.setProgress(reduceMotion ? 1 : clamp((30 - d) / 13));
    // otáčení zaostřeného exponátu
    if (ex === focusEx && !pd) { ex.user += ex.vel; ex.vel *= Math.pow(0.9, rawDt * 60); }
    const swing = ex === focusEx ? Math.sin(t * 0.35) * 0.3 : 0;
    ex.spin.rotation.y += ((ex.user + swing) - ex.spin.rotation.y) * (1 - Math.exp(-rawDt * 6));
  }
  // panáčci
  const figVis = state.s < 24;
  figs.forEach(({ f, g }, i) => {
    g.visible = figVis;
    if (!figVis) return;
    f.set('show', state.entered || state.s > -2.5);
    if (i === 0) f.set('point', state.entered);
    if (i === 1 && state.entered && !f.__loved) { f.__loved = true; setTimeout(() => f.set('love', true), 900); }
    f.update(dt, t);
  });

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
  floor.position.set(pose.pos.x, 0, pose.pos.z - 60);
  sun.position.set(pose.pos.x + 4, 10, pose.pos.z + 6); sunT.position.set(pose.pos.x, 0, pose.pos.z - 6);

  // štítky u exponátů
  const showLabels = mode === 'walk' && !tween && state.entered;
  for (const ex of exhibits) {
    const L = ex.label;
    const d = ex.inWindow ? slotS(ex.slot) - state.s : 99;
    const op = showLabels ? clamp((26 - d) / 8) * clamp((d + 1.5) / 2.5) : 0;
    if (op < 0.02) { if (L.style.opacity !== '0') { L.style.opacity = '0'; L.style.pointerEvents = 'none'; } continue; }
    proj.copy(ex.root.position); proj.y = ex.H + 0.32; proj.project(camera);
    if (proj.z > 1) { L.style.opacity = '0'; continue; }
    const x = (proj.x * 0.5 + 0.5) * innerWidth, y = (-proj.y * 0.5 + 0.5) * innerHeight;
    if (x < -80 || x > innerWidth + 80 || y < 0 || y > innerHeight + 40) { L.style.opacity = '0'; L.style.pointerEvents = 'none'; continue; }
    L.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%) scale(${clamp(1.25 - d / 30, 0.7, 1.15).toFixed(3)})`;
    L.style.opacity = op.toFixed(3);
    L.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
  }
  updateHud();

  renderer.render(scene, camera);

  // adaptivní rozlišení
  frames.push(rawDt);
  if (frames.length >= 90) {
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length; frames = [];
    window.__lb.stats = { fps: Math.round(1 / avg), dpr, calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    if (avg > 0.026 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
  }
  const d = performance.now() - t0; perf.n++; perf.sum += d; if (d > perf.max) perf.max = d;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
