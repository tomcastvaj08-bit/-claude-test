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
RE.COLORS = { 'Citrón': ['#fff200', '#e8cc00'], 'Červená': ['#ff5040', '#e01c1c'], 'Limetková': ['#e2fb3a', '#a3c800'], 'Šedobílá': ['#eeeeee', '#b9b9b9'], 'Bílá': ['#ffffff', '#e2e2e2'],
  'Žlutá': ['#ffe14a', '#ffb000'], 'Modrá': ['#5cc4ff', '#2a62ff'], 'Růžová': ['#f27ee2', '#b84ee6'], 'Zelená': ['#7dff6a', '#00b84a'], 'Zlatá': ['#fff1b8', '#c98a00'] };
RE.DEFAULT_MIX = ['Růžová', 'Červená', 'Žlutá', 'Modrá'];   // jako v předloze: barvy se střídají, velká slova „prosvítají“ (screen)
RE.mix = () => { const m = E.G.reMix; const L = (Array.isArray(m) && m.length ? m : RE.DEFAULT_MIX).filter(n => RE.COLORS[n]); return L.length ? L : RE.DEFAULT_MIX; };
// vzhled, který Real estate styl zapne (a co při vypnutí vrátí ze Stylu 1)
// jako v předloze: geometrické písmo (Poppins) – malá slova tenká bílá, velká tlustá barevná (~2× větší), těsně přes sebe,
// jemný tmavý stín, slova po jednom (prolnutí + zvětšení / přílet z boku s rozmazáním), odchod švihnutím do strany
RE.LOOK = { fontMain: '"Poppins", sans-serif', fontEm: '"Poppins", sans-serif', wMain: 400, wEm: 700, mainItalic: false, emItalic: false, size: 104, emScale: 160, track: -3, trackEm: -5, gap: 70, wordGap: 115,
  layout: 'center', noSlots: true, emEach: true, kinetic: 0, rowDy1: 0, rowDy3: 0, altOn: false, anim: 'reel', enter: 'none', enterBy: 'word', exitScale: null, fadeOut: false,
  shadowSize: 30, shadowA: 55, shadowDist: 8, cShadow: '#000000', cText: '#ffffff', gloss: 'off', glossOn: 'main', glossAmt: 70, emBlend: 'screen', extrude: 0, tilt: 0, tiltX: 0, negativ: false, fxShine: false, caseMain: 'none', caseSec: 'none', behind: 'on', reStab: false };   // 3D lesk na velkých slovech; horní titulek za postavou (maska celé postavy), dolní na hrudi před ní
RE.on = () => !!(E.G.reMode);
// stabilizace na obličej: samostatně (E.G.faceStab) nebo jako součást starého Reality módu
RE.stabOn = () => !!(E.G.faceStab || (E.G.reMode && E.G.reStab !== false));

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
  // pro režim „Pevně na bod“: skoro surová poloha nosu (jen bez chvění bodů) – obličej se drží přesně
  for (const sg of out) { sg.xr = smoothArr(sg.t, sg.x, 0.035); sg.yr = smoothArr(sg.t, sg.y, 0.035); }
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
  return { sg, rx: mx(hp[0]), ry: my(hp[1]), rTop: my(hp[1] + relTop[relTop.length >> 1]), rBrow: my(hp[1] + relBrow), rChin: my(hp[1] + relChin), rFw: fw * kz, rf: hp[2] * kz, rt: sg.t[ri] };
}
// ---------- STABILIZACE NA OBLIČEJ (nos uprostřed obrazovky) ----------
const STAB_SIG = 0.12;   // jak klidně jede kamera (s), stejné pro titulky – titulky na obrazovce pak stojí úplně klidně
// video se v každém snímku posune (a jednou provždy přiblíží), aby nos byl uprostřed; vyhlazeno, bez skoků (střihy zvlášť)
function headSmooth(sg, ts, sig) {
  const T = sg.t, tc = Math.max(T[0], Math.min(T[T.length - 1], ts)); let sx = 0, sy = 0, sw = 0;
  for (let j = 0; j < T.length; j++) { const d = (T[j] - tc) / sig; if (d < -3) continue; if (d > 3) break; const w = Math.exp(-0.5 * d * d); sx += w * sg.x[j]; sy += w * sg.y[j]; sw += w; }
  return sw ? [sx / sw, sy / sw] : [sg.x[0], sg.y[0]];
}
// poloha nosu v čase ts pro režim „Pevně na bod“ (lineárně mezi snímky)
function pinAt(sg, ts) {
  const T = sg.t, n = T.length; if (ts <= T[0]) return [sg.xr[0], sg.yr[0]]; if (ts >= T[n - 1]) return [sg.xr[n - 1], sg.yr[n - 1]];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= ts) lo = m; else hi = m; }
  const u = (ts - T[lo]) / Math.max(1e-6, T[hi] - T[lo]); return [sg.xr[lo] + (sg.xr[hi] - sg.xr[lo]) * u, sg.yr[lo] + (sg.yr[hi] - sg.yr[lo]) * u];
}
// jak moc přiblížit záběr, aby nos mohl být v KAŽDÉM snímku přesně na bodu a obraz přitom vyplnil celé plátno (ořízne se)
function pinZoom(sg, W, H, NY, Zmin) {
  const key = W + 'x' + H + ':' + NY; if (sg._pz && sg._pz.key === key) return Math.max(Zmin, sg._pz.z);
  let z = 1; for (let j = 0; j < sg.t.length; j++) { const xn = Math.min(0.999, Math.max(0.001, sg.xr[j] / W)), yn = Math.min(0.999, Math.max(0.001, sg.yr[j] / H));
    z = Math.max(z, 0.5 / xn, 0.5 / (1 - xn), NY / yn, (1 - NY) / (1 - yn)); }
  sg._pz = { key, z: Math.min(3, z * 1.01) }; return Math.max(Zmin, sg._pz.z);
}
RE.pinOn = () => RE.stabOn() && E.G.stabMode === 'pin';
RE.stab = t => {
  if (!RE.stabOn() || !(g.HEAD && HEAD.data)) return null;
  const W = E._cvW(), H = E._cvH(), segs = segments(W, H); if (!segs.length) return null;
  const ts = E._fT != null ? E._fT : E.out2src(t), Z = Math.max(1, Math.min(2, (E.G.reZoom || 130) / 100));
  let sg = segs.find(q => ts >= q.t[0] - 0.02 && ts <= q.t[q.t.length - 1] + 0.02), w = 1;
  if (!sg) { let bd = 0.8; for (const q of segs) { const d = Math.max(0, q.t[0] - ts, ts - q.t[q.t.length - 1]); if (d < bd) { bd = d; sg = q; } } if (!sg) return { z: Z, x: 0, y: 0 }; w = 1 - bd / 0.8; w = w * w * (3 - 2 * w); }
  // režim „Pevně na bod“: nos přesně na bodu v každém snímku; přiblížení se dopočítá samo (obraz se ořízne, nikdy černé okraje)
  if (E.G.stabMode === 'pin') {
    const NYp = (E.G.reNoseY || 39) / 100, Zp = pinZoom(sg, W, H, NYp, Z), q = pinAt(sg, ts), lp = (Zp - 1) / 2;
    const tx = Math.max(-lp, Math.min(lp, -Zp * (q[0] / W - 0.5))), ty = Math.max(-lp, Math.min(lp, (NYp - 0.5) - Zp * (q[1] / H - 0.5)));
    return { z: Zp, x: tx * w * 100, y: ty * w * 100 };   // přiblížení zůstává i mimo obličej (bez skoků)
  }
  // režim „Plynule“ (jako předloha): kamera obličej jen měkce dohání (vyhlazení ~0,7 s) a pomalu se přibližuje během záběru
  const soft = E.G.stabMode === 'smooth';
  const p = headSmooth(sg, ts, soft ? 0.7 : STAB_SIG);
  let Zt = Z; if (soft) { const a = sg.t[0], b = sg.t[sg.t.length - 1], u = Math.max(0, Math.min(1, (ts - a) / Math.max(0.5, b - a))); Zt = Z * (1 + 0.05 * (0.5 - 0.5 * Math.cos(Math.PI * u))); }
  const lim = (Zt - 1) / 2;
  const NY = (E.G.reNoseY || 39) / 100;   // nos jako v předloze: uprostřed na šířku, ve 39 % výšky
  const tx = Math.max(-lim, Math.min(lim, -Zt * (p[0] / W - 0.5))) * w, ty = Math.max(-lim, Math.min(lim, (NY - 0.5) - Zt * (p[1] / H - 0.5))) * w;
  return { z: Zt, x: tx * 100, y: ty * 100 };
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
  return { tb: Math.min(...L.map(x => x.y - x.px * 0.55)) - y0, bb: Math.max(...L.map(x => x.y + x.px * 0.55)) - y0, lbOff: lb.y - y0, lbPx: lb.px, lbEm: !!lb.em, lbW: lb.total, w: Math.max(...L.map(x => x.total)) };
}

// ---------- rozmístění všech titulků (paměť; přepočítá se, když se cokoli změní) ----------
let plan = null, planKey = '';
function key(W, H) {
  const d = g.HEAD && HEAD.data, G = E.G;
  return [W, H, E.pages.length, E.pages.map(p => p.a + ':' + p.b + ':' + p.s.toFixed(2) + ':' + p.e.toFixed(2) + ':' + (p.layer | 0)).join(','), d ? d.t.length : 0, G.size, G.emScale, G.rePlace, G.reSeed, (G.reMix || []).join(), G.fontMain, G.fontEm, G.gap, G.reStab === false ? 0 : 1, G.reZoom, G.stabMode, G.faceStab ? 1 : 0, G.reNoseY, (E.kf || []).length].join('|');
}
RE.invalidate = () => { plan = null; segCache = null; };
RE._plan = () => plan;
function build(W, H) {
  const out = new Map(), pl = E.G.rePlace || 'alt', mix = RE.mix(), seed = E.G.reSeed || 0;
  let lastTop = null, ti = -1;
  E.pages.forEach((p, k0) => {
    if (!(p.layer | 0)) ti++; const k = Math.max(0, ti) * 2 + (p.layer | 0);   // titulky na hrudi patří k hornímu titulku (stejné místo, barva, zarovnání)
    const S0 = E.styleOf(p); let emK = 1;
    // hlavní (barevné) slovo musí být čitelné i za hlavou: krátké slovo se zvětší, až bude zhruba na půl šířky obrazu
    { const L0 = E.layoutPage(p, { ...S0, posX: 50, posY: 50 }), ew = Math.max(0, ...L0.filter(l => l.em).map(l => l.total)); if (ew > 0) emK = Math.max(1, Math.min(1.9, W * 0.5 / ew)); }
    const S = emK > 1 ? { ...S0, emScale: S0.emScale * emK } : S0, M = measure(p, S); if (!M) return;
    let role = (p.layer | 0) ? 'chest' : 'top';   // vždy střídání: za hlavou / na hrudi
    const hd = headFor(p, W, H);
    const kW = Math.min(1, W * 0.92 / Math.max(1, M.w));   // široký titulek se zmenší na šířku
    const ks = []; for (let k2 = kW; k2 >= 0.5 - 1e-6; k2 -= 0.05) ks.push(k2);
    let y = null, kk = kW;
    const pair = Math.floor(k / 2), jig = (p.layer | 0) ? [0, -4, 3, -2, 5, -3][(pair + seed) % 6] / 100 * W : [-7, 6, -5, 8, -8, 5][(pair + seed) % 6] / 100 * W;   // horní titulek vždy trochu vedle hlavy (ne přesně za ní)
    const align = (p.layer | 0) ? 'center' : ['center', 'left', 'center', 'right', 'center', 'left'][(k + seed) % 6];
    // chytře: kolik ze spodního řádku zakryje postava (maska v referenčním okamžiku) – nikdy víc než ~40 % (slovo zůstane čitelné)
    const xf0 = hd && g.PERSON && PERSON.data ? (() => { const f0 = E._fT; E._fT = hd.rt; const v = E.vxfAt(E.src2out(hd.rt)); E._fT = f0; return v || { z: 100, x: 0, y: 0 }; })() : null;
    const coverAt = (c, k2) => { if (!xf0) return 0; const half = M.w * k2 / 2, cx = Math.max(half + W * 0.03, Math.min(W * 0.97 - half, hd.rx + jig)), lw = M.lbW * k2;
      const x0 = align === 'left' ? cx - half : align === 'right' ? cx + half - lw : cx - lw / 2, hh = M.lbPx * k2 * 0.36;
      return PERSON.cover(hd.rt, W, H, xf0, x0, c - hh, x0 + lw, c + hh); };
    if (role === 'top') {
      for (const k2 of ks) {
        let c;   // střed spodního řádku: spodní část písmen za hlavou (postava je před textem), nikdy přes oči
        if (hd) { c = Math.min(hd.rTop + (M.lbEm ? 0.5 : 0.28) * M.lbPx * k2, hd.rBrow + 0.1 * hd.rFw); for (let n = 0; n < 14 && coverAt(c, k2) > 0.4; n++) c -= 0.05 * M.lbPx * k2; }
        else c = H * 0.07 - M.tb * k2 + M.lbOff * k2;
        const yy = c - M.lbOff * k2;
        if (yy + M.tb * k2 >= H * 0.025) { y = yy; kk = k2; break; }
      }
      // nad hlavou není místo (detail, velké přiblížení): titulek zůstane nahoře u okraje a hlava ho překryje víc – nepadá na hruď
      if (y == null && hd) { let best = null;
        for (let k2 = Math.min(kW, 0.85); k2 >= 0.5 - 1e-6; k2 -= 0.05) { const yy = H * 0.025 - M.tb * k2, cv = coverAt(yy + M.lbOff * k2, k2);   // menší písmo = spodní řádek výš = méně zakrytý
          if (!best || cv < best.cv - 0.02) best = { k2, yy, cv }; if (cv <= 0.4) break; }
        kk = best.k2; y = best.yy; }
      if (y == null) role = 'chest'; else lastTop = { e: p.e, bot: y + M.bb * kk };
    }
    if (role === 'chest') {
      let yTop = hd ? hd.rChin + 0.5 * hd.rFw : H * 0.58;
      if (lastTop && p.s < lastTop.e) yTop = Math.max(yTop, lastTop.bot + H * 0.012);   // nikdy přes horní titulek
      for (const k2 of ks) { const yy = yTop - M.tb * k2; if (yy + M.bb * k2 <= H * 0.97) { y = yy; kk = k2; break; } }
      if (y == null) { kk = 0.5; y = H * 0.97 - M.bb * kk; }
    }
    // vodorovně na hlavu (dvojice se střídavě lehce posunou do stran), celý titulek vždy v obraze
    const half = M.w * kk / 2;
    const x = Math.max(half + W * 0.03, Math.min(W * 0.97 - half, (hd ? hd.rx : W / 2) + jig));
    const col = RE.COLORS[mix[(k + seed) % mix.length]];
    out.set(E.keyOf(p) + '|' + (p.layer | 0), { x: x / W * 100, y: y / H * 100, k: kk, emK, col, hd, tb: M.tb * kk, bb: M.bb * kk, half, align, role });
  });
  return out;
}
// styl titulku v Real estate stylu (volá E.styleAt)
RE.apply = (p, S, t) => {
  if (!RE.on() || !p) return S;
  const W = E._cvW(), H = E._cvH(), k0 = key(W, H);
  if (!plan || planKey !== k0) { plan = build(W, H); planKey = k0; }
  const o = plan.get(E.keyOf(p) + '|' + (p.layer | 0)); if (!o) return S;   // podle slova (stránky se při úpravách vytváří znovu)
  const m = E.meta[E.keyOf(p)], own = m && m.own;
  const legacyMoved = own && own.reMoved && own.reDx == null;   // starší projekty: posunutý titulek stál na místě
  const ownTrk = m && m.trk && E.tracks && E.tracks[m.trk];       // vlastní tracking objektu má přednost před hlavou
  if (!legacyMoved) {
    let x = o.x / 100 * W, y = o.y / 100 * H;
    // zamčeno na video: titulek jede s hlavou (velikost se nemění), vždy celý v obraze
    let sc = 1;
    // zamčeno na video: titulek jede s hlavou a zvětšuje se s ní (člověk jde blíž = větší text), vždy celý v obraze
    const follow = Math.max(0, Math.min(1, (E.G.reFollow != null ? E.G.reFollow : 100) / 100));   // jak moc titulek jede s hlavou
    if (o.hd && t != null && !ownTrk) {
      // po střihu (jiný záběr) se titulek přichytí na hlavu v novém záběru
      const ts = E._fT != null ? E._fT : E.out2src(t), sg0 = o.hd.sg; let sg = sg0;   // stejný čas snímku jako stabilizace (bez cukání)
      if (ts < sg0.t[0] - 0.05 || ts > sg0.t[sg0.t.length - 1] + 0.05) { const L = segments(W, H); const s2 = L.find(q => ts >= q.t[0] - 0.05 && ts <= q.t[q.t.length - 1] + 0.05); if (s2) sg = s2; }
      const hp = headAt(sg, ts), k = E.vxfAt(t) || { z: 100, x: 0, y: 0 }, kz = k.z / 100;
      // plynulý pohyb: se stabilizací stejné vyhlazení jako kamera (na obrazovce stojí), bez ní silné vyhlazení (~0,35 s) – slova se netřesou
      const sig = RE.stabOn() ? (E.G.stabMode === 'smooth' ? 0.7 : STAB_SIG) : 0.35, q = RE.pinOn() ? pinAt(sg, ts) : headSmooth(sg, ts, sig); hp[0] = q[0]; hp[1] = q[1];
      { const T = sg.t, tc = Math.max(T[0], Math.min(T[T.length - 1], ts)); let sf = 0, sw = 0; for (let j = 0; j < T.length; j++) { const d = (T[j] - tc) / 0.5; if (d < -3) continue; if (d > 3) break; const w = Math.exp(-0.5 * d * d); sf += w * sg.f[j]; sw += w; } if (sw) hp[2] = sf / sw; }   // velikost hlavy ještě klidněji
      const hx = W / 2 + k.x / 100 * W + kz * (hp[0] - W / 2), hy = H / 2 + k.y / 100 * H + kz * (hp[1] - H / 2);
      sc = Math.max(0.85, Math.min(1.2, hp[2] * kz / o.hd.rf));   // limit: text se zvětší / zmenší nanejvýš trochu
      // limit pohybu: titulek jede s hlavou, ale nejvýš o 12 % šířky / 8 % výšky od výchozího místa
      if (sg === sg0) {
        const dxh = follow * Math.max(-0.12 * W, Math.min(0.12 * W, hx - o.hd.rx)), dyh = follow * Math.max(-0.08 * H, Math.min(0.08 * H, hy - o.hd.ry));
        x = o.hd.rx + dxh + (x - o.hd.rx) * sc; y = o.hd.ry + dyh + (y - o.hd.ry) * sc;
      } else {
        // jiný záběr po střihu: titulek se usadí vůči hlavě v NOVÉM záběru (stejné místo vůči hlavě – za hlavou zůstane za hlavou),
        // v rámci záběru pak platí stejné limity pohybu jako jinde
        const t1 = Math.max(sg.t[0], E.out2src(p.s)), r = headSmooth(sg, t1, sig), rx = W / 2 + k.x / 100 * W + kz * (r[0] - W / 2), ry = H / 2 + k.y / 100 * H + kz * (r[1] - H / 2);
        // horní titulek drží vůči vršku vlasů (spodní řádek zůstane za hlavou), titulek na hrudi vůči bradě
        let ri = 0, bd = 1e9; sg.t.forEach((tt, j) => { const d = Math.abs(tt - t1); if (d < bd) { bd = d; ri = j; } });
        const fr = sg.f[ri], anchorNew = o.role === 'top' ? sg.top[ri] : r[1] + 0.8 * fr, anchorOld = o.role === 'top' ? o.hd.rTop : o.hd.rChin;
        const aY = H / 2 + k.y / 100 * H + kz * (anchorNew - H / 2);
        const dxh = follow * Math.max(-0.12 * W, Math.min(0.12 * W, hx - rx)), dyh = follow * Math.max(-0.08 * H, Math.min(0.08 * H, hy - ry));
        x = x + (rx - o.hd.rx) + dxh; y = y + (aY - anchorOld) + dyh;
      }
    }
    // posunutý prstem: odsazení od automatického místa – titulek dál jede s hlavou
    if (own && own.reDx != null) { x += own.reDx / 100 * W; y += (own.reDy || 0) / 100 * H; }
    if (!(own && own.reDx != null)) { x = Math.max(o.half * sc + W * 0.02, Math.min(W * 0.98 - o.half * sc, x)); y = Math.max(H * 0.025 - o.tb * sc, Math.min(H * 0.99 - o.bb * sc, y)); }
    S.posX = x / W * 100; S.posY = y / H * 100; S.size *= sc; }
  S.blockAlign = o.align;
  // horní titulky za postavou (hlava, ramena je překrývají), spodní (na hrudi) před ní – obojí jde v panelu Reality přepnout
  const behind = o.role === 'top' ? E.G.reBehindTop !== false : E.G.reBehindChest === true;
  S.behind = behind && g.PERSON && PERSON.data ? 'on' : 'off';
  S.size *= o.k; if (o.emK > 1) S.emScale *= o.emK;
  if (o.col) { S.grad = true; S.gA = o.col[0]; S.gB = o.col[1]; S.gradDir = 'v'; S.c1 = S.c2 = S.c3 = S.c4 = o.col[0]; }
  return S;
};
// dvojice titulků (volá E.buildPages): druhý jde do spodní vrstvy, oba zmizí spolu, když začne další dvojice
// Reality rozvržení (volá E.buildPages): věta se rozdělí na „jednotky“ (slovo + krátká slovíčka ve/že/v/a… k němu),
// HORNÍ titulek = 3 jednotky pod sebou (jedna na řádek) za hlavou, ZBYTEK věty jde na hruď po jednom (objeví se a zmizí).
const letters = w => (w.t || '').replace(/[^\p{L}\p{N}]/gu, '').length;
RE.pair = (pages) => {
  if (!RE.on()) return;
  const W = E.words;
  // slova, která mají titulky (pořadí), rozdělená na věty
  const ids = []; for (const p of pages) for (let i = p.a; i <= p.b; i++) ids.push(i);
  if (!ids.length) return;
  const sents = []; let cur = [];
  ids.forEach((i, n) => { const j = ids[n + 1]; cur.push(i);
    const end = j == null || j !== i + 1 || W[j].s - W[i].e > 0.6 || /[.!?…]["“”»)]*$/u.test(W[i].raw || W[i].t);
    if (end) { sents.push(cur); cur = []; } });
  const kin0 = [0, 1, 2, 3].map(() => ({ dx: 0, dy: 0, rot: 0 }));
  const mkPage = (u, layer) => ({ a: u[0], b: u[u.length - 1], s: W[u[0]].s, e: W[u[u.length - 1]].e + 0.35, lines: null, fill: false, manual: false, layer, kin: kin0, reLines: null, reEm: -1 });
  const out = [];
  for (const sn of sents) {
    // jednotky: krátká slovíčka (≤ 2 písmena) se přilepí k dalšímu slovu (na konci věty k předchozímu)
    const units = []; let pend = [];
    for (const i of sn) { if (pend.length >= 2) { units.push(pend); pend = []; } pend.push(i); if (letters(W[i]) > 2) { units.push(pend); pend = []; } }   // nejvýš 2 slova na řádek
    if (pend.length) { if (units.length) units[units.length - 1].push(...pend); else units.push(pend); }
    for (let u = 0; u < units.length;) {
      const top = units.slice(u, u + 3); u += top.length;
      const chest = []; while (u < units.length && chest.length < 4) chest.push(units[u++]);
      if (u === units.length - 1 && chest.length === 4) chest.push(units[u++]);   // osamělé poslední slovo nenechat na další horní titulek
      const T = mkPage(top.flat(), 0); T.reLines = top;
      let em = top.findIndex(l => l.some(i => W[i].em));
      if (em < 0) em = top.length - 1;   // velké barevné slovo = to za hlavou (spodní řádek horního titulku), krátké se zvětší
      T.reEm = em; out.push(T);
      const C = chest.map(l => { const P = mkPage(l, 1); P.reLines = [l]; P.reEm = l.some(i => W[i].em) ? 0 : -1; return P; });
      C.forEach((P, k) => { if (C[k + 1]) P.e = Math.max(P.s + 0.25, Math.min(P.e, C[k + 1].s)); out.push(P); });   // na hrudi vždy jen jedno slovo
      T.e = C.length ? C[C.length - 1].e : T.e;
    }
  }
  // horní titulek nejpozději do začátku dalšího horního
  const tops = out.filter(p => !(p.layer | 0)); tops.forEach((p, k) => { if (tops[k + 1]) p.e = Math.max(p.s + 0.3, Math.min(p.e, tops[k + 1].s)); });
  out.sort((x, y) => x.s - y.s);
  pages.length = 0; pages.push(...out);
};
})(window);
