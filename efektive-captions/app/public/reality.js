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
RE.COLORS = { 'Citrón': ['#fff200', '#ffd400'], 'Červená': ['#ff3b30', '#c00000'], 'Limetková': ['#e8ff4a', '#a8d900'], 'Bílá': ['#ffffff', '#d9dde6'],
  'Žlutá': ['#ff9a00', '#e8f200'], 'Modrá': ['#14d6ff', '#0040ff'], 'Růžová': ['#ff2d9a', '#a845ff'], 'Zelená': ['#7dff6a', '#00b84a'], 'Zlatá': ['#fff1b8', '#c98a00'] };
RE.DEFAULT_MIX = ['Citrón', 'Červená', 'Limetková', 'Bílá'];
RE.mix = () => { const m = E.G.reMix; const L = (Array.isArray(m) && m.length ? m : RE.DEFAULT_MIX).filter(n => RE.COLORS[n]); return L.length ? L : RE.DEFAULT_MIX; };
// vzhled, který Real estate styl zapne (a co při vypnutí vrátí ze Stylu 1)
RE.LOOK = { layout: 'center', noSlots: true, emEach: true, kinetic: 0, rowDy1: 0, rowDy3: 0, gap: 80, altOn: false, anim: 'whip', enter: 'none', enterBy: 'word', emScale: 175, wMain: 500, wEm: 800, track: -2, trackEm: -3, gloss: 'off', behind: 'head' };
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
    cur.t.push(d.t[i]); cur.x.push(cx); cur.y.push(cy); cur.f.push(fw); cur.top.push(tp != null ? tp * H : cy - 0.95 * fw);
  }
  if (cur) out.push(cur);
  segCache = out.filter(s => s.t.length >= 4); segKey = key; return segCache;
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
  return { top, topMed: tops[tops.length >> 1], brow, chin, fw, cx: cx / n };
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
  return [W, H, E.pages.length, E.pages.map(p => p.a + ':' + p.b + ':' + p.s.toFixed(2) + ':' + p.e.toFixed(2) + ':' + (p.layer | 0)).join(','), d ? d.t.length : 0, G.size, G.emScale, G.rePlace, G.reSeed, (G.reMix || []).join(), G.fontMain, G.fontEm, G.gap].join('|');
}
RE.invalidate = () => { plan = null; segCache = null; };
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
        if (hd) c = Math.min(hd.topMed + 0.12 * M.lbPx * k2, hd.brow - 0.4 * M.lbPx * k2);
        else c = H * 0.05 - M.tb * k2 + M.lbOff * k2;
        const yy = c - M.lbOff * k2;
        if (yy + M.tb * k2 >= H * 0.012) { y = yy; kk = k2; break; }
      }
      if (y == null) role = 'chest'; else lastTop = { e: p.e, bot: y + M.bb * kk };
    }
    if (role === 'chest') {
      let yTop = hd ? hd.chin + 0.5 * hd.fw : H * 0.58;
      if (lastTop && p.s < lastTop.e) yTop = Math.max(yTop, lastTop.bot + H * 0.012);   // nikdy přes horní titulek
      for (const k2 of ks) { const yy = yTop - M.tb * k2; if (yy + M.bb * k2 <= H * 0.97) { y = yy; kk = k2; break; } }
      if (y == null) { kk = 0.5; y = H * 0.97 - M.bb * kk; }
    }
    // vodorovně na hlavu (dvojice se střídavě lehce posunou do stran), celý titulek vždy v obraze
    const pair = Math.floor(k / 2), jig = [0, -4, 3, -2, 5, -3][(pair + seed) % 6] / 100 * W, half = M.w * kk / 2;
    const x = Math.max(half + W * 0.03, Math.min(W * 0.97 - half, (hd ? hd.cx : W / 2) + jig));
    const col = RE.COLORS[mix[(k + seed) % mix.length]];
    out.set(p, { x: x / W * 100, y: y / H * 100, k: kk, col });
  });
  return out;
}
// styl titulku v Real estate stylu (volá E.styleAt)
RE.apply = (p, S) => {
  if (!RE.on() || !p) return S;
  const W = E._cvW(), H = E._cvH(), k0 = key(W, H);
  if (!plan || planKey !== k0) { plan = build(W, H); planKey = k0; }
  const o = plan.get(p); if (!o) return S;
  const m = E.meta[E.keyOf(p)];
  if (!(m && m.own && m.own.reMoved)) { S.posX = o.x; S.posY = o.y; }   // titulek posunutý prstem zůstane, kde je
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
