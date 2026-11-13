// Sdílené UI pro všechny stránky Love Bricks: hlavička, patička, výstupky,
// cookies, košík (úložiště + šuplík), toast.
import { byId, fmt, FREE_SHIP } from './products.js';

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BASE = document.documentElement.dataset.base || '';
// na stránce s přehledem stačí kotvy (#…), aby se stránka nenačítala znovu
const PAGE = document.body.dataset.page || '';
const LIST = PAGE === 'list' ? '' : BASE + 'prehled.html';
const GAL = BASE + 'index.html';

// ---------- pixelové ikonky (mozaika z 1×1 placek) ----------
const PAL = { r: '#D01012', p: '#FC97AC', P: '#E4569A', y: '#F5C518', g: '#00852B', G: '#A5CA18', b: '#0055BF', w: '#FFFFFF', k: '#1B1D22', o: '#FE8A18', t: '#E4CD9E', s: '#8E9AB8' };
export function pix(rows, label = '') {
  const h = rows.length, w = rows[0].length;
  let out = `<svg class="pix" viewBox="0 0 ${w * 10} ${h * 10}" role="img" aria-label="${label}">`;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const c = PAL[ch]; if (!c) return;
    out += `<rect x="${x * 10 + 0.4}" y="${y * 10 + 0.4}" width="9.2" height="9.2" rx="1.2" fill="${c}"/><circle cx="${x * 10 + 5}" cy="${y * 10 + 5}" r="3" fill="#fff" fill-opacity=".22"/><circle cx="${x * 10 + 5.5}" cy="${y * 10 + 5.6}" r="3" fill="none" stroke="#000" stroke-opacity=".12" stroke-width=".8"/>`;
  }));
  return out + '</svg>';
}
export const ICONS = {
  heart: ['.rr...rr.', 'rpwr.rrrr', 'rprrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'],
  flower: ['...ppp...', '..ppypp..', '...ppp...', '....g....', '.gg.g.gg.', '..ggggg..', '....g....', '..sssss..', '...sss...'],
  house: ['....r....', '...rrr...', '..rrrrr..', '.rrrrrrr.', '..wwwww..', '..wbwyw..', '..wbwww..', '..wbwww..'],
  car: ['.........', '...yyy...', '..ybbby..', 'yyyyyyyyy', 'yyyyyyyyy', '.kk...kk.', '.kk...kk.'],
  gift: ['..r...r..', '...r.r...', 'yyyyryyyy', 'yyyyryyyy', '.yyyryyy.', '.yyyryyy.', '.yyyryyy.'],
  truck: ['bbbbb....', 'bbbbbrr..', 'bbbbbrww.', 'bbbbbrrrr', 'bbbbbrrrr', '.kk...kk.'],
  cal: ['.k.....k.', 'rrrrrrrrr', 'wwwwwwwww', 'wkwwkwwkw', 'wwwwwwwww', 'wkwwkwwrw', 'wwwwwwwww'],
  mail: ['wwwwwwwww', 'wrwwwwwrw', 'wwrwwwrww', 'wwwrprwww', 'wwwwrwwww', 'wwwwwwwww']
};
const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 2.9 4 6.9 4c2.2 0 3.7 1.2 5.1 3 1.4-1.8 2.9-3 5.1-3 4 0 6.1 4.2 4.5 7.8C19.5 16.4 12 21 12 21z"/></svg>';
const BAG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16l-1.3 12H5.3z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/></svg>';
export { HEART_SVG };

// ---------- hlavička / patička / overlaye ----------
function injectChrome() {
  const h = $('#lb-header');
  if (h) h.outerHTML = `
  <header class="site-header" id="header">
    <a class="logo" href="${GAL}" aria-label="Love Bricks – 3D galerie">
      <span class="logo-brick brick" data-studs>${HEART_SVG}</span>
      <span class="logo-text">Love<b>Bricks</b></span>
    </a>
    <nav class="nav" aria-label="Hlavní menu">
      <a href="${GAL}">3D galerie</a>
      <a href="${LIST}#showcase">Květiny</a>
      <a href="${LIST}#auta">Auta</a>
      <a href="${LIST}#kolekce">Kolekce</a>
    </nav>
    <button class="brick-btn cart-btn" data-studs data-open-cart aria-label="Košík">${BAG_SVG}<span class="cart-count" data-cart-count>0</span></button>
    <button class="brick-btn menu-btn" data-studs aria-label="Menu" aria-expanded="false" aria-controls="mmenu"><span class="burger"></span></button>
  </header>
  <nav class="mobile-menu" id="mmenu" aria-label="Mobilní menu">
    <a class="brick-btn" data-studs href="${GAL}">3D galerie</a>
    <a class="brick-btn" data-studs href="${LIST}#showcase">Květiny</a>
    <a class="brick-btn" data-studs href="${LIST}#auta">Auta z kostek</a>
    <a class="brick-btn" data-studs href="${LIST}#kolekce">Celá kolekce</a>
    <a class="brick-btn" data-studs href="${BASE}obchodni-podminky.html">Obchodní podmínky</a>
  </nav>`;
  const f = $('#lb-footer');
  if (f) f.outerHTML = `
  <footer class="footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${GAL}"><span class="logo-brick brick" data-studs>${HEART_SVG}</span><span class="logo-text">Love<b>Bricks</b></span></a>
        <p>Dárky z kostek pro ty, které máš rád. Květiny, které nezvadnou, a auta, která nezestárnou.</p>
      </div>
      <div><h4>Nákup</h4><ul>
        <li><a href="${BASE}obchodni-podminky.html#doprava">Doprava a platba</a></li>
        <li><a href="${BASE}obchodni-podminky.html#odstoupeni">Vrácení do 14 dnů</a></li>
        <li><a href="${BASE}obchodni-podminky.html#reklamace">Reklamace</a></li>
        <li><a href="${BASE}obchodni-podminky.html">Obchodní podmínky</a></li>
      </ul></div>
      <div><h4>Informace</h4><ul>
        <li><a href="${BASE}ochrana-osobnich-udaju.html">Ochrana osobních údajů</a></li>
        <li><a href="${BASE}cookies.html">Zásady cookies</a></li>
        <li><button class="link" type="button" data-cookie-settings>Nastavení cookies</button></li>
      </ul></div>
      <div><h4>Kontakt</h4><ul>
        <li><a href="mailto:ahoj@lovebricks.cz">ahoj@lovebricks.cz</a></li>
        <li>Po–Pá 9:00–17:00</li>
        <li>[Adresa – doplnit]</li>
      </ul></div>
    </div>
    <div class="legal-note">
      <p>Love Bricks je nezávislý prodejce stavebnic. Názvy Lamborghini, Ferrari, Bugatti, McLaren a Mercedes-AMG jsou ochranné známky svých vlastníků a slouží pouze k označení prodávaných modelů.</p>
      <p>3D modely: LDraw.org Official Model Repository – Jens Brühl (Lamborghini), Philippe Hurbain (Porsche GT3 RS), Magnus Forsberg (Porsche 911 Turbo), Orion Pobursky (Bonsaj, Kytice květin); knihovna dílků LDraw.org. Licence CC BY 2.0, barvy upraveny.</p>
      <p>© 2026 Love Bricks · ukázková verze webu – zatím nic neprodáváme, ceny a parametry jsou orientační.</p>
    </div>
  </footer>`;

  document.body.insertAdjacentHTML('beforeend', `
  <div class="overlay" data-overlay></div>
  <aside class="drawer" id="cart" aria-label="Košík" aria-hidden="true">
    <div class="drawer-head"><h2>Košík</h2><button class="brick-btn sm white" data-studs data-close aria-label="Zavřít košík">Zavřít</button></div>
    <div class="drawer-body" data-cart-list></div>
    <div class="drawer-foot">
      <div class="ship" data-ship></div>
      <div class="total"><span>Celkem</span><span data-cart-total>0 Kč</span></div>
      <button class="brick-btn green" data-studs data-checkout>Pokračovat k objednávce</button>
    </div>
  </aside>
  <div class="modal brick-card" id="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title" data-studs>
    <h2 id="demo-title">Tohle je ukázka ♥</h2>
    <p>Love Bricks zatím objednávky nepřijímá – jde o návrh webu. Až spustíme prodej, tady bude pokladna s dopravou a platbou.</p>
    <div class="modal-actions"><button class="brick-btn" data-studs data-close>Rozumím</button></div>
  </div>
  <section class="cookie brick-card" id="cookie" aria-label="Souhlas s cookies" data-studs>
    <h2>${pix(['.k.k.', 'ttttt', 'tktkt', 'ttttt', '.ttt.'], 'sušenka').replace('class="pix"', 'class="pix" style="width:28px;height:28px"')} Cookies z kostek</h2>
    <p>Používáme nezbytné cookies, aby web fungoval (košík, tvoje volby). Analytické a marketingové spustíme jen s tvým souhlasem. <a href="${BASE}cookies.html">Více o cookies</a></p>
    <div class="modal-actions">
      <button class="brick-btn green" data-studs data-consent="all">Přijmout vše</button>
      <button class="brick-btn white" data-studs data-consent="necessary">Jen nezbytné</button>
      <button class="brick-btn white" data-studs data-cookie-settings>Nastavení</button>
    </div>
  </section>
  <div class="modal brick-card" id="cookie-modal" role="dialog" aria-modal="true" aria-labelledby="ck-title" data-studs>
    <h2 id="ck-title">Nastavení cookies</h2>
    <p>Vyber, které kategorie povolíš. Volbu můžeš kdykoli změnit v patičce webu.</p>
    <div class="toggle-row"><div><b>Nezbytné</b><small>Košík, přihlášení, uložení tvé volby. Bez nich web nefunguje.</small></div><button class="toggle" role="switch" aria-checked="true" disabled aria-label="Nezbytné cookies"><i></i></button></div>
    <div class="toggle-row"><div><b>Analytické</b><small>Anonymní statistiky návštěvnosti, abychom web zlepšovali.</small></div><button class="toggle" role="switch" aria-checked="false" data-cat="analytics" aria-label="Analytické cookies"><i></i></button></div>
    <div class="toggle-row"><div><b>Marketingové</b><small>Personalizovaná reklama a měření kampaní.</small></div><button class="toggle" role="switch" aria-checked="false" data-cat="marketing" aria-label="Marketingové cookies"><i></i></button></div>
    <div class="modal-actions"><button class="brick-btn green" data-studs data-consent="save">Uložit volbu</button><button class="brick-btn white" data-studs data-consent="all">Povolit vše</button></div>
  </div>
  <div class="toast brick" role="status" aria-live="polite" id="toast"></div>`);
}

// ---------- výstupky ----------
const studRO = new ResizeObserver((ents) => {
  for (const e of ents) {
    const el = e.target;
    const pitch = parseFloat(getComputedStyle(el).getPropertyValue('--stud-pitch')) || 26;
    const n = Math.max(1, Math.round(el.offsetWidth / pitch));
    if (el.__n !== n) { el.__n = n; el.__studs.innerHTML = '<i></i>'.repeat(n); }
  }
});
export function studify(root = document) {
  $$('[data-studs]', root).forEach((el) => {
    if (el.__studs) return;
    const s = document.createElement('span');
    s.className = 'studs'; s.setAttribute('aria-hidden', 'true');
    el.prepend(s); el.__studs = s;
    studRO.observe(el);
  });
}

// ---------- toast ----------
let toastT;
export function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2200);
}

// ---------- kostka letí do košíku ----------
export function flyBrick(from, color) {
  const header = $('#header'); header?.classList.remove('is-hidden');
  const target = $('.cart-btn');
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'fly-brick brick'; el.dataset.studs = '';
  el.style.setProperty('--c', color);
  el.style.left = a.left + a.width / 2 - 17 + 'px'; el.style.top = a.top + a.height / 2 - 11 + 'px';
  document.body.appendChild(el); studify(document.body);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const done = () => { el.remove(); target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); };
  if (reduceMotion || !el.animate) return done();
  el.animate([
    { transform: 'translate(0,0) rotate(0) scale(1)' },
    { transform: `translate(${dx * 0.45}px, ${Math.min(dy * 0.5, 0) - 160}px) rotate(200deg) scale(1.3)`, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) rotate(360deg) scale(.55)` }
  ], { duration: 780, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = done;
}

// ---------- overlay/modaly ----------
let openEl = null, lastFocus = null;
export function open(el) {
  if (openEl && openEl !== el) close();
  openEl = el; lastFocus = document.activeElement;
  el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
  $('[data-overlay]').classList.add('is-open');
  setTimeout(() => (el.querySelector('[data-close], button, a, input') || el).focus({ preventScroll: true }), 50);
}
export function close() {
  if (!openEl) return;
  openEl.classList.remove('is-open'); openEl.setAttribute('aria-hidden', 'true');
  $('[data-overlay]').classList.remove('is-open');
  openEl = null; lastFocus?.focus?.({ preventScroll: true });
}

// ---------- košík ----------
export const cart = {
  items: store.get('lb-cart', []),
  save() { store.set('lb-cart', this.items); renderCart(); },
  add(id, variant, color) {
    const key = id + '|' + (variant || '');
    const it = this.items.find(i => i.key === key);
    if (it) it.qty++; else this.items.push({ key, id, variant, color, qty: 1 });
    this.save();
  },
  setQty(key, q) {
    const it = this.items.find(i => i.key === key); if (!it) return;
    it.qty = q; if (q <= 0) this.items = this.items.filter(i => i !== it);
    this.save();
  },
  count() { return this.items.reduce((a, i) => a + i.qty, 0); },
  total() { return this.items.reduce((a, i) => a + (byId(i.id)?.price || 0) * i.qty, 0); }
};
export function renderCart() {
  $$('[data-cart-count]').forEach(e => { e.textContent = cart.count(); });
  const list = $('[data-cart-list]'); if (!list) return;
  if (!cart.items.length) {
    list.innerHTML = `<div class="empty"><div class="brick" data-studs></div><p><b>Košík je zatím prázdný.</b><br>Postav si v něm něco hezkého.</p></div>`;
  } else {
    list.innerHTML = cart.items.map(i => {
      const p = byId(i.id); if (!p) return '';
      return `<div class="citem brick-card" data-studs>
        <div class="citem-chip brick" data-studs style="--c:${i.color || '#D01012'}"></div>
        <div><h4>${p.name}</h4><p>${i.variant ? i.variant + ' · ' : ''}${fmt(p.price)}</p></div>
        <div class="qty"><button class="brick-btn" data-q="-1" data-key="${i.key}" aria-label="Ubrat">−</button><span>${i.qty}</span><button class="brick-btn" data-q="1" data-key="${i.key}" aria-label="Přidat">+</button></div>
      </div>`;
    }).join('');
  }
  const total = cart.total();
  $('[data-cart-total]').textContent = fmt(total);
  const left = FREE_SHIP - total;
  const on = Math.min(10, Math.floor((total / FREE_SHIP) * 10));
  $('[data-ship]').innerHTML = (left > 0 ? `Do dopravy zdarma zbývá <b>${fmt(left)}</b>` : '<b>Doprava zdarma!</b> ♥') +
    `<div class="ship-bar">${Array.from({ length: 10 }, (_, k) => `<i class="${k < on ? 'on' : ''}"></i>`).join('')}</div>`;
  $('[data-checkout]').disabled = !cart.items.length;
  studify(list);
}

// ---------- cookies ----------
function consentUI() {
  const banner = $('#cookie'), modal = $('#cookie-modal');
  const c = store.get('lb-consent', null);
  if (!c) setTimeout(() => banner.classList.add('is-open'), 900);
  const sync = (v) => $$('.toggle[data-cat]', modal).forEach(t => t.setAttribute('aria-checked', String(!!v?.[t.dataset.cat])));
  sync(c);
  const saveC = (v) => { store.set('lb-consent', { necessary: true, ...v, ts: new Date().toISOString() }); banner.classList.remove('is-open'); close(); toast('Volba uložena ♥'); };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (b) {
      const k = b.dataset.consent;
      if (k === 'all') { saveC({ analytics: true, marketing: true }); sync({ analytics: true, marketing: true }); }
      else if (k === 'necessary') saveC({ analytics: false, marketing: false });
      else saveC(Object.fromEntries($$('.toggle[data-cat]', modal).map(t => [t.dataset.cat, t.getAttribute('aria-checked') === 'true'])));
    }
    if (e.target.closest('[data-cookie-settings]')) { sync(store.get('lb-consent', null)); banner.classList.remove('is-open'); open(modal); }
    const t = e.target.closest('.toggle[data-cat]');
    if (t) t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true'));
  });
}

export function initCommon() {
  injectChrome();
  studify();
  renderCart();
  consentUI();
  const header = $('#header'), menu = $('#mmenu'), mbtn = $('.menu-btn');
  mbtn?.addEventListener('click', () => {
    const o = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', o); mbtn.setAttribute('aria-expanded', String(o));
    document.body.style.overflow = o ? 'hidden' : '';
  });
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) { menu.classList.remove('is-open'); mbtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; } });
  // schovávání hlavičky při scrollu dolů
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!menu?.classList.contains('is-open')) header.classList.toggle('is-hidden', y > lastY + 4 && y > 300);
    if (y < lastY - 4 || y < 300) header.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) open($('#cart'));
    if (e.target.closest('[data-close]') || e.target.matches('[data-overlay]')) close();
    if (e.target.closest('[data-checkout]')) open($('#demo-modal'));
    const q = e.target.closest('[data-q]');
    if (q) { const it = cart.items.find(i => i.key === q.dataset.key); if (it) cart.setQty(it.key, it.qty + Number(q.dataset.q)); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  // stisk tlačítek na dotyk
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest('.brick-btn'); if (b) { b.classList.add('is-pressed'); const up = () => { b.classList.remove('is-pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); }; addEventListener('pointerup', up); addEventListener('pointercancel', up); } });
}
