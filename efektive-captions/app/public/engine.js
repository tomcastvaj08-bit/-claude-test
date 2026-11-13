// EFEKTIVE Captions – kreslicí engine titulků (schválený vzhled v8, viz NAVOD_TITULKY.md)
// Jeden engine pro náhled v appce, export videa i render v cloudu (render_captions.py).
(function (global) {
"use strict";

const SF = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter Tight"';

// ===== Schválená šablona v8 =====
const V8 = Object.freeze({
  size: 88, wpp: 4, posX: 50, posY: 72,
  fontMain: SF, wMain: 500, fontEm: SF, wEm: 900, emItalic: false,
  track: -4, gap: 66, emScale: 160, wordGap: 160,
  tilt: 18, tiltX: 4, persp: 60, tiltAlt: true, kinetic: 45, layout: 'cascade', layerOrder: 'natural',
  cText: '#ffffff', cEm: '#e4202c', grad: false, gA: '#ffe04a', gB: '#ff8a00', gradDir: 'v',
  glow: 30, shadowSize: 25, shadowA: 45, shadowDist: 10, cShadow: '#000000',
  anim: 'block', wordByWord: true, fadeOut: true, fxShine: false, shineEvery: 3,
  mainLine: 'mid', case: 'none', punct: false,
});

// Barvy hlavního řádku podle tématu (schválené v návodu)
const COLOR_PRESETS = [
  { id: 'vino',  name: 'Víno',          hint: 'vinotéka, víno, maso', set: { grad: false, cEm: '#e4202c' } },
  { id: 'zlato', name: 'Zlatý přeliv',  hint: 'jídlo, energie, „Dnes“', set: { grad: true, gA: '#ffe04a', gB: '#ff8a00', gradDir: 'v' } },
  { id: 'luxus', name: 'Luxus',         hint: 'luxus, barber, šperky', set: { grad: false, cEm: '#b8925a' } },
];

// ===== Pomocné =====
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const EXPO_N = 1 - Math.pow(2, -10);
const expoOut = q => (1 - Math.pow(2, -10 * clamp(q))) / EXPO_N;
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const letters = s => s.replace(/[^\p{L}\p{N}]/gu, '').length;
function hexRGB(hex) { const n = parseInt(String(hex).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function hexA(hex, a) { const [r, g, b] = hexRGB(hex); return `rgba(${r},${g},${b},${a})`; }
function mixHex(a, b) { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round((v + B[i]) / 2).toString(16).padStart(2, '0')).join(''); }
const HAS_LS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;

function fontStr(fam, weight, italic, px) {
  return `${italic ? 'italic ' : ''}${weight} ${px.toFixed(2)}px ${fam.includes(',') ? fam : '"' + fam + '"'}`;
}
// Šířka textu se staženým písmem (track v % velikosti písma) – stejná v každém prohlížeči
function measure(c, s, px, track) {
  if (HAS_LS) c.letterSpacing = '0px';
  return c.measureText(s).width + (track / 100) * px * Math.max(0, [...s].length - 1);
}
// Kreslení se staženým písmem; bez nativního letterSpacing (starší Safari) po znacích se zachovaným kerningem
function fillTracked(c, s, x, y, px, track) {
  const tr = (track / 100) * px;
  if (HAS_LS || !tr) { if (HAS_LS) c.letterSpacing = tr.toFixed(2) + 'px'; c.fillText(s, x, y); return; }
  const ch = [...s]; let pre = '';
  for (let i = 0; i < ch.length; i++) { c.fillText(ch[i], x + c.measureText(pre).width + tr * i, y); pre += ch[i]; }
}

function txt(w, S) {
  let s = S.punct ? (w.raw || w.t) : w.t;
  if (S.case === 'upper') s = s.toLocaleUpperCase('cs');
  else if (S.case === 'lower') s = s.toLocaleLowerCase('cs');
  else if (S.case === 'title') s = s.charAt(0).toLocaleUpperCase('cs') + s.slice(1);
  return s;
}

// ===== Titulky (trojice) =====
// nový titulek: max wpp slov, pauza > 0,6 s, nebo po . ! ? …; svítí do min(konec + 1,2 s, další titulek)
function buildPages(words, wpp, dur) {
  const pages = []; let c = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i], prev = words[i - 1];
    const br = !c || (i - c.a) >= wpp || (prev && w.s - prev.e > 0.6) || (prev && /[.!?…]["“”»)]*$/u.test(prev.raw || prev.t));
    if (br) { if (c) pages.push(c); c = { a: i, b: i }; } else c.b = i;
  }
  if (c) pages.push(c);
  pages.forEach(p => { p.s = words[p.a].s; });
  pages.forEach((p, k) => {
    const nxt = pages[k + 1], end = words[p.b].e + 1.2;
    p.e = nxt ? Math.min(end, nxt.s) : (dur ? Math.min(end, dur) : end);
    if (p.e <= p.s) p.e = p.s + 0.05;
    p.kin = [0, 1, 2, 3].map(j => ({ dx: hash(k * 4 + j) * 2 - 1, dy: hash(k * 4 + j + 100) * 2 - 1 }));
  });
  return pages;
}
function pageAt(pages, t) { for (let k = 0; k < pages.length; k++) if (t >= pages[k].s && t < pages[k].e) return k; return -1; }

// Rozdělení na řádky: hlavní = VŽDY prostřední. 1 slovo = jen hlavní, 2 slova = malé nahoře + velké dole.
// Krátké slůvko (≤ 2 písmena) nesmí být samo hlavním řádkem → přilepí se nahoru a hlavní je další řádek.
function groupsOf(p, S, words) {
  const manual = []; for (let i = p.a; i <= p.b; i++) if (words[i].em) manual.push(i);
  if (manual.length) {
    const e0 = Math.min(...manual), e1 = Math.max(...manual);
    return [{ ids: range(p.a, e0 - 1), em: false }, { ids: range(e0, e1), em: true }, { ids: range(e1 + 1, p.b), em: false }].filter(g => g.ids.length);
  }
  const n = p.b - p.a + 1, ids = range(p.a, p.b);
  if (S.mainLine === 'none') return [{ ids, em: false }];
  if (S.mainLine === 'word') {
    let best = p.a, len = -1; for (let i = p.a; i <= p.b; i++) { const L = letters(words[i].t); if (L > len) { len = L; best = i; } }
    return [{ ids: range(p.a, best - 1), em: false }, { ids: [best], em: true }, { ids: range(best + 1, p.b), em: false }].filter(g => g.ids.length);
  }
  let lines;
  if (n === 1) lines = [ids];
  else if (n === 2) lines = [[ids[0]], [ids[1]]];
  else {
    const main = Math.ceil(n / 3), rest = n - main, top = Math.ceil(rest / 2);
    lines = [ids.slice(0, top), ids.slice(top, top + main), ids.slice(top + main)];
    const lt = l => l.reduce((a, i) => a + letters(words[i].t), 0);
    if (lt(lines[1]) <= 2 && lines[2].length) lines = [lines[0].concat(lines[1]), lines[2]];
  }
  const mi = Math.min(1, lines.length - 1);
  return lines.map((l, i) => ({ ids: l, em: i === mi }));
}

// ===== Rozvržení jedné trojice (v rovině, před 3D) =====
function layoutPage(mc, p, k, S, words, W, H) {
  const base = Math.min(W, H) * 0.105 * (S.size / 100);
  const maxW = W * 0.88;
  const lines = groupsOf(p, S, words).map(g => {
    const em = g.em, fam = em ? S.fontEm : S.fontMain, wt = em ? S.wEm : S.wMain, it = em && S.emItalic;
    let px = base * (em ? S.emScale / 100 : 1);
    const texts = g.ids.map(i => txt(words[i], S));
    mc.font = fontStr(fam, wt, it, px);
    let sp = measure(mc, ' ', px, 0) * (S.wordGap / 100);
    let ws = texts.map(s => measure(mc, s, px, S.track));
    let total = ws.reduce((a, b) => a + b, 0) + sp * (texts.length - 1);
    if (total > maxW) { const f = maxW / total; px *= f; ws = ws.map(x => x * f); sp *= f; total = maxW; }
    return { ids: g.ids, texts, fam, wt, it, px, em, ws, sp, total };
  });
  let y = 0; const ys = [];
  lines.forEach((L, i) => { if (i > 0) y += (lines[i - 1].px * 0.5 + L.px * 0.5) * (S.gap / 100); ys.push(y); });
  const kin = S.kinetic / 100, step = Math.min(W, H) * 0.06 * kin;
  const cx = W * S.posX / 100, cy = H * S.posY / 100 - y / 2;
  lines.forEach((L, i) => {
    const q = p.kin[i % 4];
    L.y = cy + ys[i] + q.dy * step * 0.35;
    if (S.layout === 'center') L.x0 = cx - L.total / 2 + q.dx * step * 0.8;
    else if (S.layout === 'left') L.x0 = cx - W * 0.3 + i * step * 0.6;
    else if (S.layout === 'right') L.x0 = cx + W * 0.3 - L.total - i * step * 0.6;
    else L.x0 = cx - L.total / 2 + (i % 2 ? 1 : -1) * step * 1.6 + q.dx * step * 0.4;
    L.x0 = clamp(L.x0, W * 0.02, Math.max(W * 0.02, W - L.total - W * 0.02));
    L._i = i;
  });
  const box = {
    x0: Math.min(...lines.map(L => L.x0)), x1: Math.max(...lines.map(L => L.x0 + L.total)),
    y0: Math.min(...lines.map(L => L.y - L.px * 0.62)), y1: Math.max(...lines.map(L => L.y + L.px * 0.62)),
  };
  // vrstvy: každý další řádek leží PŘED předchozím (spodní před hlavním, hlavní před horním)
  let order = lines;
  if (S.layerOrder === 'bottomfirst') order = lines.slice().reverse();
  else if (S.layerOrder === 'mainfront') order = lines.slice().sort((a, b) => (a.em ? 1 : 0) - (b.em ? 1 : 0));
  return { lines, order, base, box, maxPx: Math.max(...lines.map(L => L.px)) };
}

// ===== 3D projekce (skutečná perspektiva – cedule otočená kolem svislé a vodorovné osy) =====
function tiltOf(S, k) { return (S.tiltAlt && (k % 2)) ? -S.tilt : S.tilt; }
function makeProj(S, k, W, H) {
  const ay = tiltOf(S, k) * Math.PI / 180, ax = S.tiltX * Math.PI / 180;
  const f = Math.min(W, H) * (1.7 - S.persp / 100);
  const bx = W * S.posX / 100, by = H * S.posY / 100;
  const ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax);
  // vrací [x, y, w] – w je homogenní dělitel (pro perspektivně správné mapování textury)
  return (x, y) => {
    const X = x - bx, Y = y - by;
    const X2 = X * ca, Z1 = -X * sa, Y2 = Y * cb - Z1 * sb, Z2 = Y * sb + Z1 * cb;
    const w = Math.max(0.05, (f + Z2) / f);
    return [bx + X2 / w, by + Y2 / w, w];
  };
}

// ===== WebGL: promítnutí vrstvy na čtyřúhelník (bez proužků, bez mřížky) =====
function GLProjector() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 2;
  let gl = null;
  try { gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true, depth: false, stencil: false }); } catch (e) {}
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec4 p;attribute vec2 uv;varying vec2 v;void main(){v=uv;gl_Position=p;}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 v;uniform sampler2D t;void main(){gl_FragColor=texture2D(t,v);}'));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer(), tex = gl.createTexture();
  const lp = gl.getAttribLocation(pr, 'p'), luv = gl.getAttribLocation(pr, 'uv');
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 4, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(luv); gl.vertexAttribPointer(luv, 2, gl.FLOAT, false, 24, 16);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.disable(gl.BLEND);
  let lost = false;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
  return {
    get ok() { return !lost; },
    // src = plochá vrstva; quad = 4 rohy [x,y,w] (TL,TR,BR,BL) v souřadnicích výstupu; reg = oblast výstupu
    project(src, quad, reg) {
      if (cv.width < reg.w || cv.height < reg.h) { cv.width = Math.max(cv.width, reg.w); cv.height = Math.max(cv.height, reg.h); }
      gl.viewport(0, 0, reg.w, reg.h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      const uv = [[0, 0], [1, 0], [1, 1], [0, 1]], d = [];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const [x, y, w] = quad[i];
        d.push(((x - reg.x) / reg.w * 2 - 1) * w, (1 - (y - reg.y) / reg.h * 2) * w, 0, w, uv[i][0], uv[i][1]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(d), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return { cv, sx: 0, sy: cv.height - reg.h };
    },
  };
}

// ===== Renderer =====
function Renderer() {
  const layer = document.createElement('canvas'), lc = layer.getContext('2d');
  const gmask = document.createElement('canvas'), gc = gmask.getContext('2d');
  const mc = document.createElement('canvas').getContext('2d');
  let glp = null, glTried = false;
  const getGL = () => { if (!glTried) { glTried = true; glp = GLProjector(); } return glp && glp.ok ? glp : null; };

  function wordAlpha(t, w, p, S) {
    if (!S.wordByWord) return smooth((t - p.s) / 0.28);
    return smooth((t - w.s + 0.08) / 0.28); // slovo se plynule rozsvítí 0,08 s před vyslovením, za 0,28 s
  }

  function drawWord(c, s, L, x, y, a, S, withShadow, color) {
    c.save();
    c.globalAlpha = a;
    c.font = fontStr(L.fam, L.wt, L.it, L.px);
    c.textBaseline = 'middle'; c.textAlign = 'left';
    let fill = color || (L.em ? S.cEm : S.cText);
    if (!color && L.em && S.grad) {
      const w = measure(c, s, L.px, S.track), dir = S.gradDir;
      const g = dir === 'h' ? c.createLinearGradient(x, 0, x + w, 0)
        : dir === 'd' ? c.createLinearGradient(x, y - L.px * 0.45, x + w, y + L.px * 0.45)
        : c.createLinearGradient(0, y - L.px * 0.42, 0, y + L.px * 0.42);
      g.addColorStop(0, S.gA); g.addColorStop(1, S.gB); fill = g;
    }
    if (withShadow && S.shadowA > 0 && S.shadowSize > 0) {
      // jemný, měkký, oddálený stín: rozostření 25 %, průhlednost 45 %, posun dolů 10 % a doprava 4 % výšky písma
      c.shadowColor = hexA(S.cShadow, S.shadowA / 100);
      c.shadowBlur = L.px * S.shadowSize / 100;
      c.shadowOffsetX = L.px * S.shadowDist / 100 * 0.4;
      c.shadowOffsetY = L.px * S.shadowDist / 100;
    }
    c.fillStyle = fill;
    fillTracked(c, s, x, y, L.px, S.track);
    c.restore();
  }

  // měkký oblak světla zleva doprava (~0,6 s), svítí i okolo slova – nikdy ostrý pruh
  function drawShine(c, s, L, x, y, a, S, since) {
    const ph = (since - 0.15) / 0.6; if (ph <= 0 || ph >= 1) return;
    const env = Math.sin(ph * Math.PI);
    c.save();
    c.font = fontStr(L.fam, L.wt, L.it, L.px); c.textBaseline = 'middle'; c.textAlign = 'left';
    const w = measure(c, s, L.px, S.track);
    const cx = x - w * 0.4 + ph * w * 1.8, bw = Math.max(w * 0.9, L.px * 1.6);
    const g = c.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.globalAlpha = a * env * 0.6; c.shadowColor = 'rgba(255,255,255,0.9)'; c.shadowBlur = L.px * 0.9; fillTracked(c, s, x, y, L.px, S.track);
    c.shadowColor = 'transparent'; c.globalAlpha = a * env * 0.85; fillTracked(c, s, x, y, L.px, S.track);
    c.restore();
  }

  // Vykreslí titulek v čase t do výstupního contextu out (W×H). Vrací info pro UI (rámeček, ořez).
  function render(out, W, H, t, state) {
    const { words, pages } = state;
    if (!pages || !pages.length) return null;
    const k = pageAt(pages, t); if (k < 0) return null;
    const p = pages[k], S = state.styleOf(k);
    const lay = layoutPage(mc, p, k, S, words, W, H);
    const { box } = lay;
    const pad = Math.ceil(lay.maxPx * 0.75);
    const ox = Math.floor(box.x0 - pad), oy = Math.floor(box.y0 - pad);
    const lw = Math.ceil(box.x1 + pad) - ox, lh = Math.ceil(box.y1 + pad) - oy;
    for (const [cv, c] of [[layer, lc], [gmask, gc]]) {
      if (cv.width !== lw || cv.height !== lh) { cv.width = lw; cv.height = lh; } else c.clearRect(0, 0, lw, lh);
    }
    // --- plochá vrstva: slova se stínem + maska záře z hlavních slov ---
    const glow = S.glow / 100, glowCol = S.grad ? mixHex(S.gA, S.gB) : S.cEm;
    let anyEm = false;
    const shineOn = S.fxShine && (k % Math.max(1, +S.shineEvery || 1) === 0);
    for (const L of lay.order) {
      let x = L.x0;
      L.ids.forEach((i, j) => {
        const w = words[i], a = wordAlpha(t, w, p, S), s = L.texts[j];
        if (a > 0.002) {
          drawWord(lc, s, L, x - ox, L.y - oy, a, S, true);
          if (L.em && glow > 0) { anyEm = true; drawWord(gc, s, L, x - ox, L.y - oy, a, S, false, glowCol); }
          if (L.em && shineOn) drawShine(lc, s, L, x - ox, L.y - oy, a, S, t - Math.max(p.s, w.s));
        }
        x += L.ws[j] + L.sp;
      });
    }

    // --- 3D + vycentrování + pojistka proti ořezu ---
    const P = makeProj(S, k, W, H);
    const tc = [[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]].map(([x, y]) => P(x, y));
    const pxs = tc.map(q => q[0]), pys = tc.map(q => q[1]);
    const want = (box.x0 + box.x1) / 2, got = (Math.min(...pxs) + Math.max(...pxs)) / 2;
    const pw = Math.max(...pxs) - Math.min(...pxs);
    let fit = pw > W * 0.9 ? (W * 0.9) / pw : 1;
    const ccy = (Math.min(...pys) + Math.max(...pys)) / 2;
    // --- animace celého bloku: expo ease-out 0,55 s, 82 % → 100 %, posun zespodu 0,35 výšky písma ---
    let sc = 1, dy = 0, alpha = 1;
    const tp = t - p.s;
    if (S.anim === 'block') { const e = expoOut(tp / 0.55); sc = 0.82 + 0.18 * e; dy = (1 - e) * 0.35 * lay.base; }
    if (S.fadeOut) { const ex = smooth((p.e - t) / 0.3); alpha = ex; sc *= 0.94 + 0.06 * ex; }
    else alpha = clamp((p.e - t) / 0.06);
    const s2 = fit * sc, shift = want - got;
    const fin = ([x, y, w]) => [want + (x + shift - want) * s2, ccy + (y - ccy) * s2 + dy, w];
    const corner = [[ox, oy], [ox + lw, oy], [ox + lw, oy + lh], [ox, oy + lh]].map(([x, y]) => fin(P(x, y)));
    const quad = tc.map(fin);
    const xs = corner.map(q => q[0]), ys = corner.map(q => q[1]);
    const rx = Math.max(0, Math.floor(Math.min(...xs))), ry = Math.max(0, Math.floor(Math.min(...ys)));
    const rr = Math.min(W, Math.ceil(Math.max(...xs))), rb = Math.min(H, Math.ceil(Math.max(...ys)));
    const reg = { x: rx, y: ry, w: Math.max(1, rr - rx), h: Math.max(1, rb - ry) };
    // kontrola ořezu u plně viditelného titulku (bez animace)
    const qx = tc.map(q => want + (q[0] + shift - want) * fit), qy = tc.map(q => ccy + (q[1] - ccy) * fit);
    const cropped = Math.min(...qx) < W * 0.01 || Math.max(...qx) > W * 0.99 || Math.min(...qy) < 0 || Math.max(...qy) > H;

    if (alpha > 0.002) {
      const glr = getGL();
      // vykreslí plochou vrstvu promítnutou do out (s volitelným stínem = trik na rozostřenou záři)
      const paint = (src, a, fx) => {
        out.save(); out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = a;
        let OFF = 0;
        if (fx) { OFF = W + reg.w + 100; out.shadowColor = fx.color; out.shadowBlur = fx.blur; out.shadowOffsetX = OFF; }
        if (glr) { const g = glr.project(src, corner, reg); out.drawImage(g.cv, g.sx, g.sy, reg.w, reg.h, reg.x - OFF, reg.y, reg.w, reg.h); }
        else { // bez WebGL: bez perspektivy, jen vycentrování a měřítko
          out.translate(-OFF, 0); out.translate(want, ccy + dy); out.scale(s2, s2); out.translate(-want + shift, -ccy);
          out.drawImage(src, ox, oy);
        }
        out.restore();
      };
      // záře: promítnutá maska hlavních slov → jeden rozostřený tvar → pod ostrý text
      if (anyEm && glow > 0) {
        const emPx = Math.max(...lay.lines.filter(L => L.em).map(L => L.px)) * s2;
        paint(gmask, alpha, { color: hexA(glowCol, Math.min(1, 0.4 + 0.8 * glow)), blur: emPx * (0.08 + 0.2 * glow) });
      }
      paint(layer, alpha, null);
    }
    return { k, quad, alpha, cropped, fit };
  }
  return { render };
}

global.CaptionEngine = { V8, SF, COLOR_PRESETS, buildPages, pageAt, groupsOf, layoutPage, Renderer, txt, clamp, smooth, hexA, fontStr };
})(window);
