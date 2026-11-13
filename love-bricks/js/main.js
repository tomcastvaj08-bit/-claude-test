// Love Bricks – hlavní stránka: 3D scény, scroll choreografie, katalog, košík.
import * as THREE from 'three';
import { initCommon, studify, cart, toast, pix, ICONS, reduceMotion, flyBrick } from './common.js';
import { PRODUCTS, ALL, OCCASIONS, byId, fmt } from './products.js';
import { Stage3D } from './stage3d.js';
import { createModel, ready } from './builders.js?v=20261113s';
await Promise.all([ready(), loadFigureKit()]);
import { Figure, loadFigureKit } from './figures.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1.3 12H5.3z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/></svg>';

initCommon();

// ---------------------------------------------------------------- DOM
const selected = {}; // vybraná varianta (index) pro produkt
ALL.forEach(p => { selected[p.id] = 0; });

function stageHTML(p, i) {
  const from = i % 2 === 0 ? 1 : -1;
  const v = p.variant;
  return `<section class="stage ${p.dark ? 'dark' : ''}" id="p-${p.id}" data-id="${p.id}" data-from="${from}"
    style="--bg:${p.bg};--ink:${p.ink};--accent:${p.accent};--accent-ink:${p.accentInk || '#fff'};--from:${from}" aria-label="${p.name}">
    <div class="stage-back baseplate">
      <div class="stage-word" aria-hidden="true">${p.word}</div>
      <div class="stage-model" data-model="${p.model}" role="img" aria-label="3D model: ${p.name}. Táhni do strany pro otočení.">
        <div class="fig boy" title="Ahoj!"></div><div class="fig girl" title="♥"></div>
      </div>
      <div class="stage-build" aria-hidden="true"><div class="bar"><i></i></div><span data-count>Skládám…</span></div>
    </div>
    <div class="stage-front">
      <div class="stage-meta"><span class="tile-print stage-num">${String(i + 1).padStart(2, '0')} / ${String(PRODUCTS.length).padStart(2, '0')}</span><span class="tile-print">${p.kicker}</span></div>
      <article class="pcard brick-card" data-studs data-product="${p.id}">
        <div class="pcard-tags">${p.tags.map(t => `<span class="chip">${OCCASIONS[t]}</span>`).join('')}</div>
        <h3>${p.name}</h3>
        <p class="pcard-line">${p.line} · ${p.pieces} dílků · ${p.size} · ${p.age}</p>
        <p class="pcard-desc">${p.desc}</p>
        ${v.options.length < 2 ? '' : `<div class="variants" role="group" aria-label="${v.label}"><span>${v.label}:</span>${v.options.map(([n, c], k) => `<button class="swatch" style="--c:${c}" aria-label="${n}" aria-pressed="${k === 0}" data-variant="${k}"></button>`).join('')}<em data-vname>${v.options[0][0]}</em></div>`}
        <div class="buy"><div class="price brick" data-studs>${p.old ? `<s>${fmt(p.old)}</s>` : ''}<strong>${fmt(p.price)}</strong></div><button class="brick-btn" data-studs data-add="${p.id}">${BAG} Do košíku</button></div>
        <ul class="perks"><li>Skladem</li><li>Odesíláme do 24 h</li><li>Dárkové balení zdarma</li></ul>
      </article>
    </div>
  </section>`;
}
$('#showcase').innerHTML = PRODUCTS.map(stageHTML).join('');

const TINT = Object.fromEntries(ALL.map(p => [p.id, p.dark ? '#E9ECEF' : p.bg]));
$('#grid').innerHTML = ALL.map((p) => `
  <article class="gcard brick-card" data-studs data-tags="${p.tags.join(' ')}" data-product="${p.id}">
    <div class="gcard-slot" data-gmodel="${p.model}" style="--tint:${TINT[p.id] || '#F3EEE6'}" role="img" aria-label="3D model: ${p.name}"></div>
    <div class="gcard-body">
      <div><span class="chip">${p.line}</span></div>
      <h3>${p.name}</h3>
      <p class="gcard-meta">${p.pieces} dílků · ${p.size} · ${p.age}</p>
      <div class="gcard-foot"><strong>${fmt(p.price)}</strong><button class="brick-btn sm" data-studs data-add="${p.id}">Do košíku</button></div>
    </div>
  </article>`).join('');

$$('[data-pix]').forEach(el => { el.outerHTML = pix(ICONS[el.dataset.pix], el.dataset.label || ''); });
studify();

// ---------------------------------------------------------------- 3D
let stage = null;
try { stage = new Stage3D($('#gl')); }
catch (e) { console.warn('WebGL není k dispozici', e); document.documentElement.classList.add('no-webgl'); }
window.__lb = { get stats() { return stage?.stats; } };

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function modelSlot(el, modelId, opts = {}, onReady) {
  if (!stage) return;
  stage.add(el, () => {
    const m = createModel(modelId);
    const box = m.box, size = box.getSize(V()), c = box.getCenter(V());
    m.group.position.set(-c.x, -box.min.y, -c.z);
    const obj = new THREE.Group(); obj.add(m.group);
    const ctl = { model: m, auto: null, el };
    el.__ctl = ctl;
    m.setProgress(opts.startProgress ?? 1);
    const sel = selected[el.dataset.pid];
    if (sel != null) applyVariant(el.dataset.pid, sel, false);
    onReady?.(ctl);
    return {
      object: obj,
      fit: { center: V(0, size.y / 2, 0), height: size.y, radius: (Math.hypot(size.x, size.z) / 2) * (opts.radiusK ?? 1), floor: 0 },
      update(dt, t, s, rawDt) {
        const a = ctl.auto;
        if (a) {
          a.t += rawDt;
          const k = clamp(a.t / a.dur);
          m.setProgress(a.from + (a.to - a.from) * easeInOut(k));
          if (k >= 1) { ctl.auto = a.next || null; a.done?.(); }
        }
        ctl.onUpdate?.(dt, t, s);
      }
    };
  }, { drag: true, ...opts });
}

function figSlot(el, girl, side, opts = {}) {
  if (!stage) return;
  stage.add(el, () => {
    const f = new Figure({ girl });
    f.state.side = side;
    el.__fig = f;
    return { object: f.root, fit: { center: V(0, 3.1, 0), height: 6.6, radius: 2.4, floor: 0 }, update(dt, t) { f.update(dt, t); } };
  }, { swing: 0.12, elevation: 0.12, ...opts });
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const f = el.__fig; if (!f) return;
    if (girl) { f.set('love', true); f.anim.jump = 1; } else f.wave();
  });
}

// --- hero ---
const hero = { heart: $('#hero-heart'), boy: $('#hero-boy'), girl: $('#hero-girl'), doneAt: 0 };
modelSlot(hero.heart, 'heart', { swing: 0.5, startProgress: 0, margin: 1.05, elevation: 0.22 }, (ctl) => {
  ctl.auto = { from: 0, to: 1, dur: reduceMotion ? 0.01 : 2.6, t: -0.4, done() { hero.doneAt = performance.now(); } };
});
figSlot(hero.boy, false, 1, { phase: 1 });
figSlot(hero.girl, true, -1, { phase: 2 });
hero.heart.addEventListener('click', () => {
  const ctl = hero.heart.__ctl; if (!ctl || ctl.auto) return;
  hero.doneAt = 0;
  ctl.auto = { from: 1, to: 0, dur: 0.7, t: 0, next: { from: 0, to: 1, dur: 2.0, t: 0, done() { hero.doneAt = performance.now(); } } };
});
function updateHero() {
  const ctl = hero.heart.__ctl; if (!ctl) return;
  const p = ctl.model.progress, boy = hero.boy.__fig, girl = hero.girl.__fig;
  const since = hero.doneAt ? (performance.now() - hero.doneAt) / 1000 : -1;
  if (boy) { boy.set('show', p > 0.25 || since >= 0); boy.set('point', since > 0.2); }
  if (girl) { girl.set('show', p > 0.45 || since >= 0); if (since < 0) girl.set('love', false); else if (since > 0.9) girl.set('love', true); }
}

// --- scény produktů ---
const stages = $$('.stage').map((el, i) => {
  const p = byId(el.dataset.id);
  const modelEl = $('.stage-model', el);
  modelEl.dataset.pid = p.id;
  const st = { el, p, modelEl, boyEl: $('.fig.boy', el), girlEl: $('.fig.girl', el), count: $('[data-count]', el), b: -1, c: -1 };
  const car = byId(p.id).tags.includes('auta');
  modelSlot(modelEl, p.model, { startProgress: 0, swing: car ? 0.6 : 0.42, rotY: car ? -0.55 : 0, phase: i, radiusK: car ? 0.92 : 1, elevation: car ? 0.32 : 0.16 });
  figSlot(st.boyEl, false, 1, { phase: i + 1 });
  figSlot(st.girlEl, true, -1, { phase: i + 2 });
  return st;
});
// Scéna se složí sama a rychle, jakmile se objeví (nečeká se na další scroll):
// b = postup skládání, c = vyjetí karty a panáčků.
function updateStages(now) {
  const vh = innerHeight;
  for (const st of stages) {
    const r = st.el.getBoundingClientRect();
    if (r.bottom < -60 || r.top > vh + 60) continue;
    if (!st.t0 && r.top < vh * 0.65) st.t0 = now;
    const k = st.t0 ? (now - st.t0) / 1000 : 0;
    const b = reduceMotion ? (st.t0 ? 1 : 0) : clamp(k / 0.9);
    const c = reduceMotion ? b : clamp((k - 0.55) / 0.6);
    if (Math.abs(b - st.b) > 1e-4) {
      st.b = b; st.el.style.setProperty('--sb', b.toFixed(4));
      st.count.textContent = b >= 1 ? `Hotovo · ${st.p.pieces} dílků ♥` : `Skládám… ${Math.round(b * st.p.pieces)} / ${st.p.pieces}`;
    }
    if (Math.abs(c - st.c) > 1e-4) { st.c = c; st.el.style.setProperty('--sc', c.toFixed(4)); }
    const ctl = st.modelEl.__ctl;
    if (ctl && !ctl.auto) ctl.model.setProgress(easeInOut(b));
    const boy = st.boyEl.__fig, girl = st.girlEl.__fig;
    if (boy) { boy.set('show', c > 0.1); boy.set('point', c > 0.55); }
    if (girl) { girl.set('show', c > 0.22); girl.set('love', c > 0.85); }
  }
}

// --- katalog ---
$$('.gcard').forEach((card, i) => {
  const slot = $('.gcard-slot', card);
  slot.dataset.pid = card.dataset.product;
  const car = byId(card.dataset.product).tags.includes('auta');
  modelSlot(slot, slot.dataset.gmodel, { startProgress: 0, swing: 0.5, rotY: car ? -0.6 : 0, phase: i * 0.7, margin: 1.12, elevation: car ? 0.35 : 0.2, radiusK: car ? 0.9 : 1, shadow: true }, (ctl) => {
    ctl.onUpdate = () => { if (!ctl.started) { ctl.started = true; ctl.auto = { from: 0, to: 1, dur: reduceMotion ? 0.01 : 0.9, t: 0 }; } };
  });
  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    const ctl = slot.__ctl; if (!ctl || ctl.auto || reduceMotion) return;
    ctl.auto = { from: 1, to: 0.25, dur: 0.35, t: 0, next: { from: 0.25, to: 1, dur: 1.0, t: 0 } };
  });
});

// ---------------------------------------------------------------- varianty a košík
function applyVariant(id, k, ui = true) {
  const p = byId(id); if (!p) return;
  selected[id] = k;
  const [name, color] = p.variant.options[k];
  $$(`[data-pid="${id}"]`).forEach(el => el.__ctl?.model.setVariant(p.variant.key, color));
  if (ui) {
    const card = $(`.pcard[data-product="${id}"]`);
    if (card) {
      $$('.swatch', card).forEach((s, j) => s.setAttribute('aria-pressed', String(j === k)));
      $('[data-vname]', card).textContent = name;
    }
  }
}
document.addEventListener('click', (e) => {
  const sw = e.target.closest('.swatch');
  if (sw) { const id = sw.closest('[data-product]').dataset.product; applyVariant(id, Number(sw.dataset.variant)); }
  const add = e.target.closest('[data-add]');
  if (add) {
    const p = byId(add.dataset.add), [vn, vc] = p.variant.options[selected[p.id]];
    cart.add(p.id, vn, vc);
    flyBrick(add, vc);
    toast(`${p.name} je v košíku ♥`);
    try { navigator.vibrate?.(12); } catch (_) {}
  }
  const occ = e.target.closest('[data-occ]');
  if (occ) { setFilter(occ.dataset.occ); $('#kolekce').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
  const f = e.target.closest('[data-filter]');
  if (f) setFilter(f.dataset.filter);
  const hl = e.target.closest('.hl');
  if (hl) { hl.style.animation = 'none'; void hl.offsetWidth; hl.style.animation = 'hop .45s var(--ease-snap)'; }
});

function setFilter(tag) {
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === tag)));
  $$('.gcard').forEach(c => c.classList.toggle('is-hidden', tag !== 'all' && !c.dataset.tags.split(' ').includes(tag)));
}

$('#news-form')?.addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('Díky! (ukázka – nic se neodesílá) ♥'); });

// postupné "padání" kostek do sekcí
const rio = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } }), { threshold: 0.2 });
$$('[data-reveal]').forEach(el => rio.observe(el));

// ---------------------------------------------------------------- smyčka
const perf = { n: 0, sum: 0, max: 0, reset() { this.n = 0; this.sum = 0; this.max = 0; }, get avg() { return this.n ? this.sum / this.n : 0; } };
window.__lb.perf = perf;
function loop(now) {
  const t0 = performance.now();
  if (stage) stage.measure();
  updateStages(now);
  if (stage) { updateHero(); stage.render(now); }
  const d = performance.now() - t0;
  perf.n++; perf.sum += d; if (d > perf.max) perf.max = d;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
if (stage) addEventListener('load', () => setTimeout(() => stage.warmup(), 1200));
