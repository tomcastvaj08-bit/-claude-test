/* EFEKTIVE Captions – REAL ESTATE STYL (v2, od nuly)
   Styl jako v realitních reels: slova vystřelí po jednom ze stran, malá bílá + velká barevná, těsně pod sebou.
   Titulky jdou po dvojicích: HORNÍ (za hlavou – spodek posledního řádku schovaný za vlasy, zbytek nad hlavou)
   a DOLNÍ (na hrudi, vždy pod horním). Obličej se nikdy nepřekryje.

   Na rozdíl od první verze se nic neukládá do titulků: poloha, velikost a barva se počítají až při vykreslení
   (a pamatují se), takže stačí zapnout – po úpravě textu, času nebo po rozboru hlavy se všechno samo přepočítá.
   Vstupy: E.G.reMode, E.G.rePlace ('alt' | 'top' | 'chest'), E.G.reMix (barvy), E.G.reSeed (zamíchání), HEAD.data. */
"use strict";
(function (g) {
const RE = g.RE = {};
// barvy (velké slovo) – jako v předloze; názvy odpovídají nabídce v appce
RE.COLORS = { 'Citrón': ['#fff200', '#e8cc00'], 'Červená': ['#ff2a1f', '#d40000'], 'Limetková': ['#e2fb3a', '#a3c800'], 'Šedobílá': ['#eeeeee', '#b9b9b9'], 'Bílá': ['#ffffff', '#e2e2e2'],
  'Žlutá': ['#ff9a00', '#e8f200'], 'Modrá': ['#14d6ff', '#0040ff'], 'Růžová': ['#ff2d9a', '#a845ff'], 'Zelená': ['#7dff6a', '#00b84a'], 'Zlatá': ['#fff1b8', '#c98a00'] };
RE.DEFAULT_MIX = ['Citrón', 'Šedobílá', 'Červená', 'Limetková'];
RE.mix = () => { const m = E.G.reMix; const L = (Array.isArray(m) && m.length ? m : RE.DEFAULT_MIX).filter(n => RE.COLORS[n]); return L.length ? L : RE.DEFAULT_MIX; };
// vzhled, který Real estate styl zapne (a co při vypnutí vrátí ze Stylu 1)
// jako v předloze: geometrické písmo (Poppins) – malá slova tenká bílá, velká tlustá barevná (~2× větší), těsně přes sebe,
// jemný tmavý stín, slova po jednom (prolnutí + zvětšení / přílet z boku s rozmazáním), odchod švihnutím do strany
RE.LOOK = { fontMain: '"Poppins", sans-serif', fontEm: '"Poppins", sans-serif', wMain: 400, wEm: 700, mainItalic: false, emItalic: false, size: 104, emScale: 160, track: -3, trackEm: -5, gap: 70, wordGap: 115,
  layout: 'center', noSlots: true, emEach: true, kinetic: 0, rowDy1: 0, rowDy3: 0, altOn: false, anim: 'reel', enter: 'none', enterBy: 'word', exitScale: null, fadeOut: false,
  shadowSize: 30, shadowA: 55, shadowDist: 8, cShadow: '#000000', cText: '#ffffff', gloss: 'off', extrude: 0, tilt: 0, tiltX: 0, negativ: false, fxShine: false, caseMain: 'none', caseSec: 'none', behind: 'head', reStab: true, reZoom: 130 };
RE.on = () => !!(E.G.reMode);

// ---------- hlava během titulku (z rozboru HEAD) ----------
// vrací {top, topMed, brow, chin, fw, cx} v px plátna, nebo null (v tomhle úseku videa obličej není)
let segCache = null, segKey = '';
function segments(W, H) {
  const d = g.HEAD && HEAD.data; if (!d) return [];
  const key = d.t.length + '|' + W + 'x' + H; if (segCache && segKey === key) return segCache;
  const out = []; let cur = null;
  for (let i = 0; i < d.t.length; i++) {
    if (!d.m[i]) continue;
    const fw = d.side[i] * W / 2.7, cx = d.x[i] * W, cy = d.y[i] * H + 0.2 * fw, tp = HEAD.topAt(i);
    if (cur) { const j = cur.t.length - 1; if (d.t[i] - cur.t[j] > 0.35 || Math.hypot(cx - cur.x[j], cy - cur.y[j]) > 0.6 * fw || fw / cur.f[j] > 1.4 || cur.f[j] / fw > 1.4) { out.push(cur); cur = null; } }
    if (!cur) cur = { t: [], x: [], y: [], f: [], top: [] };
    // nos přímo z bodů obličeje (přesnější, neskáče), u starších rozborů dopočet z výřezu
    const nX = d.nx && d.nx[i] ? d.nx[i] * W : cx, nY = d.ny && d.ny[i] ? d.ny[i] * H : cy;
    cur.t.push(d.t[i]); cur.x.push(nX); cur.y.push(nY); cur.f.push(fw); cur.top.push(tp != null ? tp * H : cy - 0.95 * fw);
  }
  if (cur) out.push(cur);
  // vyhlazení každého úseku (střihy zvlášť): odlehlé hodnoty pryč, pak gauss ~0,1 s → plynulý pohyb bez cukání
  for (const sg of out) for (const k of ['x', 'y', 'f', 'top']) sg[k] = smoothArr(sg.t, sg[k], k === 'top' ? 0.12 : 0.09);
  segCache = out.filter(s => s.t.length >= 4); segKey = key; return segCache;
}
function smoothArr(T, A, sig) {
  const n = A.length, med = new Array(n);
  for (let i = 0; i < n; i++) { const w = A.slice(Math.max(0, i - 3), Math.min(n, i + 4)).sort((a, b) => a - b); med[i] = w[w.length >> 1]; }
  const B = A.map((v, i) => { const dev = Math.abs(v - med[i]); return dev > 3 * (Math.abs(med[i]) * 0.02 + 2) ? med[i] : v; });
  const out = new Array(n);
  for (let i = 0; i < n; i++) { let s = 0, w = 0; for (let j = Math.max(0, i - 12); j < Math.min(n, i + 13); j++) { const d = (T[j] - T[i]) / sig; const ww = Math.exp(-0.5 * d * d); s += ww * B[j]; w += ww; } out[i] = s / w; }
  return out;
}
function headFor(p, W, H) {
  const segs = segments(W, H); if (!segs.length) return null;
  const t1 = E.out2src(p.s + 0.05), t2 = E.out2src(p.e);
  let sg = null, best = 0.12; for (const s of segs) { const ov = Math.min(t2, s.t[s.t.length - 1]) - Math.max(t1, s.t[0]); if (ov > best) { best = ov; sg = s; } }
  if (!sg) { let bd = 0.6; for (const s of segs) { const d = Math.max(0, s.t[0] - t2, t1 - s.t[s.t.length - 1]); if (d < bd) { bd = d; sg = s; } } }
  if (!sg) return null;
  let top = 1e9, brow = 1e9, chin = -1e9, cx = 0, n = 0, fw = 0; const tops = [];
  const use = j => { top = Math.min(top, sg.top[j]); tops.push(sg.top[j]); brow = Math.min(brow, sg.y[j] - 0.42 * sg.f[j]); chin = Math.max(chin, sg.y[j] + 0.8 * sg.f[j]); cx += sg.x[j]; n++; fw = Math.max(fw, sg.f[j]); };
  for (let j = 0; j < sg.t.length; j++) if (sg.t[j] >= t1 - 0.04 && sg.t[j] <= t2 + 0.04) use(j);
  if (!n) { let i = 0, bd = 1e9; sg.t.forEach((t, j) => { const d = Math.abs(t - t1); if (d < bd) { bd = d; i = j; } }); use(i); }
  tops.sort((a, b) => a - b);
  // referenční snímek = hlava ve středu titulku; titulek se pak drží vůči hlavě (jede s ní)
  const tm = (Math.max(t1, sg.t[0]) + Math.min(t2, sg.t[sg.t.length - 1])) / 2; let ri = 0, bd = 1e9; sg.t.forEach((t, j) => { const d = Math.abs(t - tm); if (d < bd) { bd = d; ri = j; } });
  const hp = headAt(sg, sg.t[ri]);
  // vůči středu hlavy po celou dobu titulku (hlava se může zvětšit – člověk jde blíž): nejvyšší obočí, nejnižší brada, vršek vlasů (medián)
  let relBrow = 1e9, relChin = -1e9; const relTop = [];
  for (let j = 0; j < sg.t.length; j++) if (sg.t[j] >= t1 - 0.04 && sg.t[j] <= t2 + 0.04) { relBrow = Math.min(relBrow, -0.42 * sg.f[j]); relChin = Math.max(relChin, 0.8 * sg.f[j]); relTop.push(sg.top[j] - sg.y[j]); }
  if (!relTop.length) { relBrow = -0.42 * sg.f[ri]; relChin = 0.8 * sg.f[ri]; relTop.push(sg.top[ri] - sg.y[ri]); }
  relTop.sort((a, b) => a - b);
  // všechno v souřadnicích OBRAZOVKY (po stabilizaci / přiblížení videa v referenčním okamžiku)
  const fT0 = E._fT; E._fT = sg.t[ri]; const k = E.vxfAt(E.src2out(sg.t[ri])) || { z: 100, x: 0, y: 0 }; E._fT = fT0; const kz = k.z / 100, mx = v => W / 2 + k.x / 100 * W + kz * (v - W / 2), my = v => H / 2 + k.y / 100 * H + kz * (v - H / 2);
  return { sg, rx: mx(hp[0]), ry: my(hp[1]), rTop: my(hp[1] + relTop[relTop.length >> 1]), rBrow: my(hp[1] + relBrow), rChin: my(hp[1] + relChin), rFw: fw * kz, rf: hp[2] * kz };
}
// ---------- STABILIZACE NA OBLIČEJ (nos uprostřed obrazovky) ----------
const STAB_SIG = 0.12;   // jak klidně jede kamera (s), stejné pro titulky – titulky na obrazovce pak stojí úplně klidně
// video se v každém snímku posune (a jednou provždy přiblíží), aby nos byl uprostřed; vyhlazeno, bez skoků (střihy zvlášť)
function headSmooth(sg, ts, sig) {
  const T = sg.t, tc = Math.max(T[0], Math.min(T[T.length - 1], ts)); let sx = 0, sy = 0, sw = 0;
  for (let j = 0; j < T.length; j++) { const d = (T[j] - tc) / sig; if (d < -3) continue; if (d > 3) break; const w = Math.exp(-0.5 * d * d); sx += w * sg.x[j]; sy += w * sg.y[j]; sw += w; }
  return sw ? [sx / sw, sy / sw] : [sg.x[0], sg.y[0]];
}
RE.stab = t => {
  if (!RE.on() || E.G.reStab === false || !(g.HEAD && HEAD.data)) return null;
  const W = E._cvW(), H = E._cvH(), segs = segments(W, H); if (!segs.length) return null;
  const ts = E._fT != null ? E._fT : E.out2src(t), Z = Math.max(1, Math.min(2, (E.G.reZoom || 130) / 100));
  let sg = segs.find(q => ts >= q.t[0] - 0.02 && ts <= q.t[q.t.length - 1] + 0.02), w = 1;
  if (!sg) { let bd = 0.8; for (const q of segs) { const d = Math.max(0, q.t[0] - ts, ts - q.t[q.t.length - 1]); if (d < bd) { bd = d; sg = q; } } if (!sg) return { z: Z, x: 0, y: 0 }; w = 1 - bd / 0.8; w = w * w * (3 - 2 * w); }
  const p = headSmooth(sg, ts, STAB_SIG), lim = (Z - 1) / 2;
  const NY = (E.G.reNoseY || 39) / 100;   // nos jako v předloze: uprostřed na šířku, ve 39 % výšky
  const tx = Math.max(-lim, Math.min(lim, -Z * (p[0] / W - 0.5))) * w, ty = Math.max(-lim, Math.min(lim, (NY - 0.5) - Z * (p[1] / H - 0.5))) * w;
  return { z: Z, x: tx * 100, y: ty * 100 };
};
// poloha hlavy v čase ts (vyhlazená přes ~0,2 s – plynule, bez chvění), mimo úsek drží krajní polohu
function headAt(sg, ts) {
  const T = sg.t; let sx = 0, sy = 0, sw = 0;
  const tc = Math.max(T[0], Math.min(T[T.length - 1], ts));
  let sf = 0;
  for (let j = 0; j < T.length; j++) { const d = (T[j] - tc) / 0.025; if (d < -3) continue; if (d > 3) break; const w = Math.exp(-0.5 * d * d); sx += w * sg.x[j]; sy += w * sg.y[j]; sf += w * sg.f[j]; sw += w; }
  return sw ? [sx / sw, sy / sw, sf / sw] : [sg.x[0], sg.y[0], sg.f[0]];
}

// ---------- rozměry titulku při velikosti 1 ----------
// offsety řádků od středu titulku (posY) – se zmenšením velikosti se zmenší úměrně
function measure(p, S0) {
  const S = { ...S0, posX: 50, posY: 50 }, H = E._cvH(), L = E.layoutPage(p, S); if (!L.length) return null;
  const y0 = H * 0.5, lb = L.reduce((a, x) => x.y > a.y ? x : a, L[0]);
  return { tb: Math.min(...L.map(x => x.y - x.px * 0.55)) - y0, bb: Math.max(...L.map(x => x.y + x.px * 0.55)) - y0, lbOff: lb.y - y0, lbPx: lb.px, lbEm: !!lb.em, w: Math.max(...L.map(x => x.total)) };
}

// ---------- rozmístění všech titulků (paměť; přepočítá se, když se cokoli změní) ----------
let plan = null, planKey = '';
function key(W, H) {
  const d = g.HEAD && HEAD.data, G = E.G;
  return [W, H, E.pages.length, E.pages.map(p => p.a + ':' + p.b + ':' + p.s.toFixed(2) + ':' + p.e.toFixed(2) + ':' + (p.layer | 0)).join(','), d ? d.t.length : 0, G.size, G.emScale, G.rePlace, G.reSeed, (G.reMix || []).join(), G.fontMain, G.fontEm, G.gap, G.reStab === false ? 0 : 1, G.reZoom, (E.kf || []).length].join('|');
}
RE.invalidate = () => { plan = null; segCache = null; };
RE._plan = () => plan;
function build(W, H) {
  const out = new Map(), pl = E.G.rePlace || 'alt', mix = RE.mix(), seed = E.G.reSeed || 0;
  let lastTop = null;
  E.pages.forEach((p, k) => {
    const S = E.styleOf(p), M = measure(p, S); if (!M) return;
    let role = pl === 'alt' ? ((p.layer | 0) ? 'chest' : 'top') : pl;
    const hd = headFor(p, W, H);
    const kW = Math.min(1, W * 0.92 / Math.max(1, M.w));   // široký titulek se zmenší na šířku
    const ks = []; for (let k2 = kW; k2 >= 0.5 - 1e-6; k2 -= 0.05) ks.push(k2);
    let y = null, kk = kW;
    if (role === 'top') {
      for (const k2 of ks) {
        let c;   // střed spodního řádku: spodek písmen za vlasy, nikdy pod obočí
        if (hd) c = M.lbEm ? Math.min(hd.rTop + 0.22 * M.lbPx * k2, hd.rBrow - 0.05 * M.lbPx * k2) : hd.rTop + 0.08 * M.lbPx * k2;
        else c = H * 0.07 - M.tb * k2 + M.lbOff * k2;
        const yy = c - M.lbOff * k2;
        if (yy + M.tb * k2 >= H * 0.012) { y = yy; kk = k2; break; }
      }
      if (y == null) role = 'chest'; else lastTop = { e: p.e, bot: y + M.bb * kk };
    }
    if (role === 'chest') {
      let yTop = hd ? hd.rChin + 0.5 * hd.rFw : H * 0.58;
      if (lastTop && p.s < lastTop.e) yTop = Math.max(yTop, lastTop.bot + H * 0.012);   // nikdy přes horní titulek
      for (const k2 of ks) { const yy = yTop - M.tb * k2; if (yy + M.bb * k2 <= H * 0.97) { y = yy; kk = k2; break; } }
      if (y == null) { kk = 0.5; y = H * 0.97 - M.bb * kk; }
    }
    // vodorovně na hlavu (dvojice se střídavě lehce posunou do stran), celý titulek vždy v obraze
    const pair = Math.floor(k / 2), jig = [0, -4, 3, -2, 5, -3][(pair + seed) % 6] / 100 * W, half = M.w * kk / 2;
    const x = Math.max(half + W * 0.03, Math.min(W * 0.97 - half, (hd ? hd.rx : W / 2) + jig));
    const col = RE.COLORS[mix[(k + seed) % mix.length]];
    const align = ['center', 'left', 'center', 'right', 'center', 'left'][(k + seed) % 6];
    out.set(E.keyOf(p) + '|' + (p.layer | 0), { x: x / W * 100, y: y / H * 100, k: kk, col, hd, tb: M.tb * kk, bb: M.bb * kk, half, align });
  });
  return out;
}
// styl titulku v Real estate stylu (volá E.styleAt)
RE.apply = (p, S, t) => {
  if (!RE.on() || !p) return S;
  const W = E._cvW(), H = E._cvH(), k0 = key(W, H);
  if (!plan || planKey !== k0) { plan = build(W, H); planKey = k0; }
  const o = plan.get(E.keyOf(p) + '|' + (p.layer | 0)); if (!o) return S;   // podle slova (stránky se při úpravách vytváří znovu)
  const m = E.meta[E.keyOf(p)];
  if (!(m && m.own && m.own.reMoved)) {   // titulek posunutý prstem zůstane, kde je
    let x = o.x / 100 * W, y = o.y / 100 * H;
    // zamčeno na video: titulek jede s hlavou (velikost se nemění), vždy celý v obraze
    let sc = 1;
    // zamčeno na video: titulek jede s hlavou a zvětšuje se s ní (člověk jde blíž = větší text), vždy celý v obraze
    if (o.hd && t != null) {
      // po střihu (jiný záběr) se titulek přichytí na hlavu v novém záběru
      const ts = E._fT != null ? E._fT : E.out2src(t), sg0 = o.hd.sg; let sg = sg0;   // stejný čas snímku jako stabilizace (bez cukání)
      if (ts < sg0.t[0] - 0.05 || ts > sg0.t[sg0.t.length - 1] + 0.05) { const L = segments(W, H); const s2 = L.find(q => ts >= q.t[0] - 0.05 && ts <= q.t[q.t.length - 1] + 0.05); if (s2) sg = s2; }
      const hp = headAt(sg, ts), k = E.vxfAt(t) || { z: 100, x: 0, y: 0 }, kz = k.z / 100;
      if (E.G.reStab !== false) { const q = headSmooth(sg, ts, STAB_SIG); hp[0] = q[0]; hp[1] = q[1]; }   // titulky přesně se stabilizací (žádné cukání vůči videu)
      const hx = W / 2 + k.x / 100 * W + kz * (hp[0] - W / 2), hy = H / 2 + k.y / 100 * H + kz * (hp[1] - H / 2);
      sc = Math.max(0.6, Math.min(1.8, hp[2] * kz / o.hd.rf));
      x = hx + (x - o.hd.rx) * sc; y = hy + (y - o.hd.ry) * sc;
      x = Math.max(o.half * sc + W * 0.02, Math.min(W * 0.98 - o.half * sc, x)); y = Math.max(H * 0.01 - o.tb * sc, Math.min(H * 0.99 - o.bb * sc, y)); }
    S.posX = x / W * 100; S.posY = y / H * 100; S.size *= sc; }
  S.blockAlign = o.align;
  S.size *= o.k;
  if (o.col) { S.grad = true; S.gA = o.col[0]; S.gB = o.col[1]; S.gradDir = 'v'; S.c1 = S.c2 = S.c3 = S.c4 = o.col[0]; }
  return S;
};
// dvojice titulků (volá E.buildPages): druhý jde do spodní vrstvy, oba zmizí spolu, když začne další dvojice
RE.pair = (pages) => {
  if (!RE.on() || (E.G.rePlace || 'alt') !== 'alt') return;
  for (let k = 0; k < pages.length; k += 2) {
    const A = pages[k], B = pages[k + 1], C = pages[k + 2]; if (!B) break;
    if (B.s - A.s > 4) { k--; continue; }   // daleko od sebe → nová dvojice od B
    B.layer = 1; const end = C ? Math.max(B.s + 0.3, C.s) : Math.max(A.e, B.e); A.e = Math.max(A.e, end); B.e = end; if (C && A.e > C.s) A.e = C.s;
  }
};
})(window);
