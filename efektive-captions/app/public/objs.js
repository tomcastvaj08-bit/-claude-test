/* EFEKTIVE Captions – zvýraznění objektu ve videu (stůl, gauč, okno, pozemek…)
   • výběr: AI klepnutím (MediaPipe Interactive Segmenter), kouzelná hůlka, štětec (+), guma (−)
   • přes objekt projede shine (jen po objektu, okolí zůstává), obrys plnou / přerušovanou čarou, jemná výplň
   • barvy shine, čar i výplně volitelné
   • objekt může sledovat pohyb kamery (afinní tracking – posun, natočení, zvětšení, zkosení), např. dron kolem pozemku */
"use strict";
(function (g) {
const OBJ = g.OBJ = {};
const E = g.E;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
OBJ.MASK_LONG = 640;

// ---------- maska ----------
OBJ.newMask = (ar) => { const w = Math.round(ar >= 1 ? OBJ.MASK_LONG : OBJ.MASK_LONG * ar), h = Math.round(ar >= 1 ? OBJ.MASK_LONG / ar : OBJ.MASK_LONG); return { w, h, d: new Uint8Array(w * h) }; };
// uložení do projektu: RLE (střídavě délky 0 a 1), zakódované base36
OBJ.rle = m => { const out = []; let v = 0, n = 0; for (let i = 0; i < m.d.length; i++) { const b = m.d[i] ? 1 : 0; if (b === v) n++; else { out.push(n); v = b; n = 1; } } out.push(n); return m.w + 'x' + m.h + ':' + out.map(x => x.toString(36)).join(','); };
OBJ.unrle = s => { const [wh, r] = s.split(':'); const [w, h] = wh.split('x').map(Number); const d = new Uint8Array(w * h); let i = 0, v = 0; for (const x of r.split(',')) { const n = parseInt(x, 36); if (v) d.fill(1, i, i + n); i += n; v ^= 1; } return { w, h, d }; };
OBJ.brush = (m, x, y, r, val) => { const r2 = r * r; for (let j = Math.max(0, Math.floor(y - r)); j <= Math.min(m.h - 1, Math.ceil(y + r)); j++) for (let i = Math.max(0, Math.floor(x - r)); i <= Math.min(m.w - 1, Math.ceil(x + r)); i++) if ((i - x) * (i - x) + (j - y) * (j - y) <= r2) m.d[j * m.w + i] = val; };
OBJ.area = m => { let n = 0; for (let i = 0; i < m.d.length; i++) n += m.d[i]; return n; };

// kouzelná hůlka: oblast podobné barvy od klepnutí (s ohledem na hrany)
OBJ.wand = (img, m, x, y, tol, add = true) => {
  const { w, h } = m, px = img.data, sx = Math.round(x), sy = Math.round(y); if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 0;
  const k0 = (sy * w + sx) * 4, r0 = px[k0], g0 = px[k0 + 1], b0 = px[k0 + 2], T = tol * tol * 3;
  const seen = new Uint8Array(w * h), st = [sy * w + sx]; seen[st[0]] = 1; let n = 0;
  while (st.length) {
    const p = st.pop(), k = p * 4, dr = px[k] - r0, dg = px[k + 1] - g0, db = px[k + 2] - b0;
    if (dr * dr + dg * dg + db * db > T) continue;
    m.d[p] = add ? 1 : 0; n++;
    const xx = p % w, yy = (p / w) | 0;
    if (xx > 0 && !seen[p - 1]) { seen[p - 1] = 1; st.push(p - 1); }
    if (xx < w - 1 && !seen[p + 1]) { seen[p + 1] = 1; st.push(p + 1); }
    if (yy > 0 && !seen[p - w]) { seen[p - w] = 1; st.push(p - w); }
    if (yy < h - 1 && !seen[p + w]) { seen[p + w] = 1; st.push(p + w); }
  }
  return n;
};
// vyhlazení masky (zavřít dírky, uhladit okraj): rozmazání + práh
OBJ.tidy = m => {
  const { w, h } = m, a = new Float32Array(w * h), b = new Float32Array(w * h), R = 2;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -R; x < w + R; x++) { const xa = x + R, xr = x - R - 1; if (xa < w && xa >= 0) s += m.d[y * w + xa]; if (xr >= 0 && xr < w) s -= m.d[y * w + xr]; if (x >= 0 && x < w) a[y * w + x] = s; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -R; y < h + R; y++) { const ya = y + R, yr = y - R - 1; if (ya < h && ya >= 0) s += a[ya * w + x]; if (yr >= 0 && yr < h) s -= a[yr * w + x]; if (y >= 0 && y < h) b[y * w + x] = s; } }
  const N = (2 * R + 1) * (2 * R + 1); for (let i = 0; i < m.d.length; i++) m.d[i] = b[i] / N > 0.5 ? 1 : 0;
};

// ---------- AI výběr (MediaPipe Interactive Segmenter, načte se až při prvním použití) ----------
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';
let segP = null;
OBJ.aiLoad = () => segP || (segP = (async () => {
  const V = await import(MP + '/vision_bundle.mjs');
  const fs = await V.FilesetResolver.forVisionTasks(MP + '/wasm');
  const mk = d => V.InteractiveSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate: d }, outputCategoryMask: true, outputConfidenceMasks: false });
  try { return await mk('GPU'); } catch (e) { return await mk('CPU'); }
})().catch(e => { segP = null; throw e; }));
// klepnutí na (x,y) v maskových pixelech → přidá / ubere objekt z masky
OBJ.aiSelect = async (canvas, m, x, y, add = true) => {
  const seg = await OBJ.aiLoad();
  return new Promise((res, rej) => {
    try {
      seg.segment(canvas, { keypoint: { x: x / m.w, y: y / m.h } }, r => {
        const cm = r.categoryMask; if (!cm) { res(0); return; }
        const a = cm.getAsUint8Array(), mw = cm.width, mh = cm.height; let n = 0;
        // kategorie objektu = ta, která je pod klepnutím
        const want = a[Math.min(mh - 1, Math.round(y / m.h * mh)) * mw + Math.min(mw - 1, Math.round(x / m.w * mw))];
        for (let j = 0; j < m.h; j++) { const sj = Math.min(mh - 1, Math.floor(j / m.h * mh)); for (let i = 0; i < m.w; i++) { const si = Math.min(mw - 1, Math.floor(i / m.w * mw)); if (a[sj * mw + si] === want) { m.d[j * m.w + i] = add ? 1 : 0; n++; } } }
        cm.close && cm.close(); res(n);
      });
    } catch (e) { rej(e); }
  });
};

// ---------- obrys (hranice největších oblastí) ----------
OBJ.contours = m => {
  const { w, h, d } = m, lab = new Int32Array(w * h), comps = [];
  let L = 0;
  for (let p = 0; p < w * h; p++) {
    if (!d[p] || lab[p]) continue; L++;
    const st = [p]; lab[p] = L; let n = 0;
    while (st.length) { const q = st.pop(); n++; const x = q % w, y = (q / w) | 0;
      if (x > 0 && d[q - 1] && !lab[q - 1]) { lab[q - 1] = L; st.push(q - 1); }
      if (x < w - 1 && d[q + 1] && !lab[q + 1]) { lab[q + 1] = L; st.push(q + 1); }
      if (y > 0 && d[q - w] && !lab[q - w]) { lab[q - w] = L; st.push(q - w); }
      if (y < h - 1 && d[q + w] && !lab[q + w]) { lab[q + w] = L; st.push(q + w); } }
    comps.push({ L, start: p, n });
  }
  const big = comps.filter(c => c.n > w * h * 0.002).sort((a, b) => b.n - a.n).slice(0, 6);
  const inC = (x, y, L) => x >= 0 && y >= 0 && x < w && y < h && lab[y * w + x] === L;
  const D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const out = [];
  for (const c of big) {
    // Moore – obchod po hranici
    const sx = c.start % w, sy = (c.start / w) | 0; const pts = [[sx, sy]];
    let x = sx, y = sy, dir = 6, guard = 0;
    do {
      let found = false;
      for (let k = 0; k < 8; k++) { const nd = (dir + 6 + k) % 8, nx = x + D8[nd][0], ny = y + D8[nd][1]; if (inC(nx, ny, c.L)) { x = nx; y = ny; dir = nd; found = true; break; } }
      if (!found) break; pts.push([x, y]);
    } while ((x !== sx || y !== sy) && ++guard < w * h);
    out.push(simplify(chaikin(rdp(pts, 1.2)), 0.6));
  }
  return out;
};
function rdp(P, eps) { if (P.length < 3) return P; const a = P[0], b = P[P.length - 1]; let mi = 0, md = 0; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < P.length - 1; i++) { const d = Math.abs(dy * P[i][0] - dx * P[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (d > md) { md = d; mi = i; } }
  if (md > eps) { const l = rdp(P.slice(0, mi + 1), eps), r = rdp(P.slice(mi), eps); return l.slice(0, -1).concat(r); } return [a, b]; }
function chaikin(P) { if (P.length < 4) return P; const o = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } return o; }
function simplify(P, eps) { return P.length > 400 ? rdp(P, eps * 2) : P; }

// ---------- vykreslení ----------
// pomocná plátna pro masku objektu (v rozlišení masky, s měkkým okrajem)
function maskCanvas(o) {
  if (o._mc && o._mcK === o._mk) return o._mc;
  const m = o._m || (o._m = OBJ.unrle(o.mask));
  const c = o._mc || document.createElement('canvas'); c.width = m.w; c.height = m.h;
  const x = c.getContext('2d'), id = x.createImageData(m.w, m.h), a = feather(m);
  for (let i = 0; i < m.d.length; i++) { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = a[i]; }
  x.putImageData(id, 0, 0); o._mc = c; o._mcK = o._mk; o._ct = null;
  return c;
}
// měkký okraj masky: rozmazání + posun prahu ven → shine plynule přejede i lehce přes hranu objektu (nic se neořízne natvrdo)
function feather(m) {
  const { w, h, d } = m; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[j * w + i]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
  const R = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) * 0.025));
  let A = new Float32Array(w * h); for (let i = 0; i < A.length; i++) A[i] = d[i];
  const box = (src, horiz) => { const out = new Float32Array(w * h), n = 2 * R + 1;
    if (horiz) for (let y = 0; y < h; y++) { let s = 0; const r = y * w; for (let x = -R; x <= R; x++) s += src[r + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { out[r + x] = s / n; s += src[r + Math.min(w - 1, x + R + 1)] - src[r + Math.max(0, x - R)]; } }
    else for (let x = 0; x < w; x++) { let s = 0; for (let y = -R; y <= R; y++) s += src[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += src[Math.min(h - 1, y + R + 1) * w + x] - src[Math.max(0, y - R) * w + x]; } }
    return out; };
  for (let k = 0; k < 2; k++) A = box(box(A, true), false);   // 2× rámeček ≈ gauss
  const out = new Uint8ClampedArray(w * h);
  for (let i = 0; i < A.length; i++) { const t = Math.min(1, Math.max(0, (A[i] - 0.12) / 0.6)); out[i] = Math.round(255 * t * t * (3 - 2 * t)); }
  return out;
}
let oc = null, ox = null, hc = null, hx = null;
const hexA = (h, a) => { const n = parseInt((h || '#ffffff').slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
// afinní transformace objektu v čase t (anchor → aktuální snímek), normalizované souřadnice
OBJ.affAt = (o, t) => {
  if (!o.trk || !o.trk.t || o.trk.t.length < 2 || !g.TRK) return [1, 0, 0, 1, 0, 0];
  const ts = E.out2src ? E.out2src(t) : t; return TRK.affAt(o.trk, ts, o.trk.smooth ?? 8);
};
// matice z normalizovaných souřadnic masky na plátno (včetně zoomu / stabilizace videa)
function matrixFor(o, t, W, H) {
  const A = OBJ.affAt(o, t), k = E.vxfAt ? (E.vxfAt(t) || { z: 100, x: 0, y: 0 }) : { z: 100, x: 0, y: 0 }, z = k.z / 100;
  // plátno: P = C + T + z·(A·n·[W,H] − C)
  const m = new DOMMatrix();
  m.translateSelf(W / 2 + k.x / 100 * W, H / 2 + k.y / 100 * H); m.scaleSelf(z, z); m.translateSelf(-W / 2, -H / 2);
  m.scaleSelf(W, H); m.multiplySelf(new DOMMatrix([A[0], A[1], A[2], A[3], A[4], A[5]]));
  return m;
}
OBJ.matrixFor = matrixFor;
OBJ.draw = (c, W, H, t) => {
  const L = E.objs; if (!L || !L.length) return;
  for (const o of L) {
    if (t < o.s || t > o.e || !o.mask) continue;
    const fin = clamp((t - o.s) / 0.35), fout = clamp((o.e - t) / 0.3), A = Math.min(fin, fout); if (A <= 0) continue;
    const mc = maskCanvas(o), m = o._m, M = matrixFor(o, t, W, H);
    const sm = new DOMMatrix().scaleSelf(1 / m.w, 1 / m.h);   // maskové px → normalizované
    const MM = M.multiply(sm);
    // výplň (jemný barevný nádech)
    if ((o.fillA || 0) > 0) {
      if (!oc || oc.width !== W || oc.height !== H) { oc = document.createElement('canvas'); oc.width = W; oc.height = H; ox = oc.getContext('2d'); }
      ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'source-over'; ox.clearRect(0, 0, W, H);
      ox.setTransform(MM); ox.imageSmoothingEnabled = true; ox.drawImage(mc, 0, 0);
      ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = o.fillC || '#27e1c1'; ox.fillRect(0, 0, W, H);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = A * o.fillA / 100; c.drawImage(oc, 0, 0); c.restore();
    }
    // shine – světlý pruh přejede jen po objektu + jemná záře kolem
    if (o.shine) drawShine(c, o, t, W, H, MM, mc, A);
    // obrys
    if (o.line && o.line !== 'off') drawLine(c, o, t, W, H, MM, A);
  }
};
// okno shine (blok na timeline); u starších objektů se doplní – jeden průjezd hned po začátku
OBJ.shineWin = o => { if (o.shS == null || o.shE == null || o.shE <= o.shS) { o.shS = o.s + 0.1; o.shE = Math.min(o.e, o.shS + 1.1); if (o.shE - o.shS < 0.3) o.shE = o.shS + 0.3; } };
function screenBox(MM, m) { const P = [[0, 0], [m.w, 0], [m.w, m.h], [0, m.h]].map(([x, y]) => { const p = MM.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; }); return P; }
function objBox(o, MM) {
  // skutečný rozsah objektu (ne celé masky)
  if (!o._bb) { const m = o._m; let x0 = m.w, y0 = m.h, x1 = 0, y1 = 0; for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) if (m.d[j * m.w + i]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; } o._bb = [x0, y0, x1 + 1, y1 + 1]; }
  const [x0, y0, x1, y1] = o._bb; const P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => { const p = MM.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; });
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]); return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function drawShine(c, o, t, W, H, MM, mc, A) {
  OBJ.shineWin(o);
  if (t < o.shS || t > o.shE) return;
  let ph;
  if (!o.shRep) ph = (t - o.shS) / Math.max(0.1, o.shE - o.shS);   // jeden průjezd přes celý blok na timeline
  else { const dur = 1.6 - 1.1 * clamp((o.shineSpd ?? 50) / 100), every = Math.max(dur + 0.2, o.shineEvery ?? 2.6); ph = ((t - o.shS) % every) / dur; if (ph > 1) return; }
  const e = ph < 0.5 ? 2 * ph * ph : 1 - 2 * (1 - ph) * (1 - ph);   // plynulý průjezd
  const bb = objBox(o, MM), bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0; if (bw < 2 || bh < 2) return;
  if (!oc || oc.width !== W || oc.height !== H) { oc = document.createElement('canvas'); oc.width = W; oc.height = H; ox = oc.getContext('2d'); }
  ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'source-over'; ox.clearRect(0, 0, W, H);
  ox.setTransform(MM); ox.imageSmoothingEnabled = true; ox.drawImage(mc, 0, 0);
  ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'source-in';
  // šikmý pruh (25°) jede zleva doprava přes celý objekt
  const ang = -25 * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const span = bw + bh * Math.abs(Math.tan(ang)), band = Math.max(bw, bh) * (0.22 + 0.25 * clamp((o.shineW ?? 50) / 100));
  const cx = bb.x0 - band - bh * Math.abs(Math.tan(ang)) / 2 + (span + band * 2) * e, cy = (bb.y0 + bb.y1) / 2;
  const gx0 = cx - band * ca, gy0 = cy - band * sa, gx1 = cx + band * ca, gy1 = cy + band * sa;
  const gr = ox.createLinearGradient(gx0, gy0, gx1, gy1), col = o.shineC || '#ffffff';
  gr.addColorStop(0, hexA(col, 0)); gr.addColorStop(0.35, hexA(col, 0.35)); gr.addColorStop(0.5, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.65, hexA(col, 0.35)); gr.addColorStop(1, hexA(col, 0));
  ox.fillStyle = gr; ox.fillRect(0, 0, W, H);
  const I = A * clamp((o.shineI ?? 80) / 100, 0, 1.5);
  // záře kolem okrajů: světlo z pruhu se rozlije i do okolí objektu (blízká + široká měkká záře).
  // Rozmazání postupným zmenšováním a zvětšováním (hladké jako gauss, funguje i v Safari bez ctx.filter).
  const G = clamp((o.shGlow ?? 80) / 100, 0, 1.5), L = glowLevels(oc, W, H);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  if (G > 0) { c.globalAlpha = Math.min(1, I * G * 0.55); c.drawImage(L[0], 0, 0, W, H); c.globalAlpha = Math.min(1, I * G * 0.75); c.drawImage(L[1], 0, 0, W, H); c.globalAlpha = Math.min(1, I * G * 0.7); c.drawImage(L[2], 0, 0, W, H); }
  c.globalAlpha = I; c.drawImage(oc, 0, 0);
  c.restore();
}
// tři úrovně rozmazání (malé / střední / široké), vrácené ve velikosti, ze které se hladce zvětší přes celé plátno
const GL = [];
function glowLevels(src, W, H) {
  const sizes = [6, 16, 40], out = [];
  let prev = src, pw = W, ph = H;
  for (let k = 0; k < sizes.length; k++) {
    const w = Math.max(1, Math.round(W / sizes[k])), h = Math.max(1, Math.round(H / sizes[k]));
    if (!GL[k] || GL[k].c.width !== w || GL[k].c.height !== h) { const c = document.createElement('canvas'); c.width = w; c.height = h; GL[k] = { c, x: c.getContext('2d') }; }
    const g = GL[k]; g.x.clearRect(0, 0, w, h); g.x.imageSmoothingEnabled = true; g.x.imageSmoothingQuality = 'high'; g.x.drawImage(prev, 0, 0, pw, ph, 0, 0, w, h);
    prev = g.c; pw = w; ph = h;
  }
  // nejširší úroveň zvětšit přes střední velikost (hladší, bez „kosočtverců“)
  const k = 3; const w2 = GL[1].c.width, h2 = GL[1].c.height;
  if (!GL[k] || GL[k].c.width !== w2 || GL[k].c.height !== h2) { const c = document.createElement('canvas'); c.width = w2; c.height = h2; GL[k] = { c, x: c.getContext('2d') }; }
  GL[k].x.clearRect(0, 0, w2, h2); GL[k].x.imageSmoothingEnabled = true; GL[k].x.imageSmoothingQuality = 'high'; GL[k].x.drawImage(GL[2].c, 0, 0, w2, h2);
  return [GL[0].c, GL[1].c, GL[k].c];
}
function drawLine(c, o, t, W, H, MM, A) {
  if (!o._ct) o._ct = OBJ.contours(o._m);
  const lw = Math.max(1.5, Math.min(W, H) * 0.004 * (o.lineW ?? 50) / 50), col = o.lineC || '#ffffff';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = A; c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = hexA(col, 0.6); c.shadowBlur = lw * 2.5;
  const since = t - o.s, draw = clamp(since / 0.7);   // čára se „nakreslí“ během 0,7 s
  for (const P of o._ct) {
    if (P.length < 3) continue;
    const S = P.map(([x, y]) => { const p = MM.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; });
    let len = 0; for (let i = 0; i < S.length; i++) { const a = S[i], b = S[(i + 1) % S.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    c.beginPath(); S.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    if (o.line === 'dash') { const dl = lw * 3.2; c.setLineDash([dl, dl * 0.9]); c.lineDashOffset = -since * lw * 10; c.globalAlpha = A * draw; }
    else { c.setLineDash([len * draw, len]); }
    c.stroke();
  }
  c.restore();
}
})(window);
