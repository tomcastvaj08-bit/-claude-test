// Love Bricks – detail produktu (produkt.html?id=…): 3D model k otáčení, popis, parametry, košík.
import * as THREE from 'three';
import { initCommon, studify, cart, toast, flyBrick } from './common.js?v=20261115a';
import { ALL, OCCASIONS, byId, fmt } from './products.js?v=20261115a';
import { Stage3D } from './stage3d.js?v=20261115a';
import { createModel, ready } from './builders.js?v=20261115a';

const $ = (s, r = document) => r.querySelector(s);
const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1.3 12H5.3z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/></svg>';
const id = new URLSearchParams(location.search).get('id');
const p = byId(id) || ALL[0];

document.title = `${p.name} – Love Bricks`;
const root = $('#pd');
root.style.cssText = `--bg:${p.bg};--ink:${p.ink};--accent:${p.accent};--accent-ink:${p.accentInk || '#fff'}`;
const others = ALL.filter((o) => o.id !== p.id);
root.innerHTML = `
  <div class="pd-wrap">
    <a class="brick-btn sm white pd-back" data-studs href="prehled.html#kolekce">‹ Zpět na přehled</a>
    <div class="pd-grid">
      <div class="pd-stage baseplate">
        <span class="pd-word" aria-hidden="true">${p.word}</span>
        <div class="pd-model" role="img" aria-label="3D model: ${p.name}. Táhni do strany pro otočení."></div>
        <span class="tile-print pd-hint">↔ Táhni pro otočení</span>
      </div>
      <article class="pd-info brick-card" data-studs>
        <span class="tile-print pd-kicker">${p.kicker}</span>
        <h1>${p.name}</h1>
        <div class="pcard-tags">${p.tags.map((t) => `<span class="chip">${OCCASIONS[t]}</span>`).join('')}</div>
        <p class="pd-desc">${p.desc}</p>
        <dl class="pd-specs">
          <div><dt>Kolekce</dt><dd>${p.line}</dd></div>
          <div><dt>Počet dílků</dt><dd>${p.pieces}</dd></div>
          <div><dt>Výška</dt><dd>${p.size}</dd></div>
          <div><dt>Věk</dt><dd>${p.age}</dd></div>
        </dl>
        <p class="pd-more">Stavebnice z kostiček Love Bricks s ilustrovaným návodem krok za krokem. Hotová květina nepotřebuje zalévat a vydrží navždy – stačí ji občas oprášit.</p>
        <div class="buy"><div class="price brick" data-studs>${p.old ? `<s>${fmt(p.old)}</s>` : ''}<strong>${fmt(p.price)}</strong></div><button class="brick-btn" data-studs data-add="${p.id}">${BAG} Do košíku</button></div>
        <ul class="perks"><li>Skladem</li><li>Odesíláme do 24 h</li><li>14 dní na vrácení</li></ul>
      </article>
    </div>
    <section class="pd-others" aria-label="Další květiny">
      <h2>Mohlo by se ti líbit</h2>
      <div class="pd-row">${others.map((o) => `<a class="pd-mini brick-card" data-studs href="produkt.html?id=${o.id}"><img src="img/p/${o.id}.webp" alt="" width="200" height="200" loading="lazy"><b>${o.name}</b><span>${fmt(o.price)}</span></a>`).join('')}</div>
    </section>
  </div>`;

initCommon();
studify(root);

document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]'); if (!add) return;
  const [vn, vc] = p.variant.options[0];
  cart.add(p.id, vn, vc); flyBrick(add, vc); toast(`${p.name} je v košíku ♥`);
  try { navigator.vibrate?.(12); } catch (_) {}
});

// 3D model
let stage = null;
try { stage = new Stage3D($('#gl')); } catch (e) { document.documentElement.classList.add('no-webgl'); }
if (stage) {
  await ready([p.model]);
  stage.add($('.pd-model'), () => {
    const m = createModel(p.model);
    const box = m.box, size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    m.group.position.set(-c.x, -box.min.y, -c.z);
    m.setProgress(1);
    const obj = new THREE.Group(); obj.add(m.group);
    return { object: obj, fit: { center: new THREE.Vector3(0, size.y / 2, 0), height: size.y, radius: Math.hypot(size.x, size.z) / 2, floor: 0 } };
  }, { drag: true, swing: 0.45, elevation: 0.16, margin: 1.06 });
  const loop = (now) => { stage.measure(); stage.render(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
