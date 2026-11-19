/* EFEKTIVE Captions – TEXT ZA POSTAVOU (v2)
   1) Rozbor: v KAŽDÉM snímku AI oddělí postavu od pozadí (MediaPipe selfie multiclass, v zařízení, zdarma).
      Počítá se ve výřezu kolem postavy (ostřejší okraj), okraj se pak „přichytí“ na skutečné hrany v obraze
      (guided filter – vlasy, ramena) a vyhladí se přes sousední snímky (přepočtené do stejného výřezu) → nebliká.
   2) Vykreslení: po titulcích se přes ně znovu nakreslí postava z podkladu bez titulků (měkký okraj),
      funguje i se stabilizací / přiblížením videa.
   Data: PERSON.data = {W, H, t[], r[] ([x0,y0,side] výřezu normalizovaně), a[] (alfa R×R, RLE)} */
"use strict";
(function (g) {
const PERSON = g.PERSON = { data: null };
const R = 288;           // rozlišení uložené masky výřezu
const IN = 256;          // vstup AI

// ---------- pomocné ----------
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function boxBlur(src, w, h, r) {   // průměr ve čtverci (2r+1)², rychle (integrální obraz)
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += src[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s; } }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1); for (let x = 0; x < w; x++) { const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
    out[y * w + x] = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / ((y1 - y0) * (x1 - x0)); } }
  return out;
}
// guided filter (He et al.): okraj masky p se přizpůsobí hranám v obraze I (0..1)
function guided(I, p, w, h, r, eps) {
  const n = w * h, Ip = new Float32Array(n), II = new Float32Array(n);
  for (let k = 0; k < n; k++) { Ip[k] = I[k] * p[k]; II[k] = I[k] * I[k]; }
  const mI = boxBlur(I, w, h, r), mp = boxBlur(p, w, h, r), mIp = boxBlur(Ip, w, h, r), mII = boxBlur(II, w, h, r);
  const a = new Float32Array(n), b = new Float32Array(n);
  for (let k = 0; k < n; k++) { const cov = mIp[k] - mI[k] * mp[k], v = mII[k] - mI[k] * mI[k]; a[k] = cov / (v + eps); b[k] = mp[k] - a[k] * mI[k]; }
  const ma = boxBlur(a, w, h, r), mb = boxBlur(b, w, h, r), q = new Float32Array(n);
  for (let k = 0; k < n; k++) q[k] = ma[k] * I[k] + mb[k];
  return q;
}
const enc = m => { const out = []; let v = m[0], n = 0; for (let i = 0; i < m.length; i++) { if (m[i] === v && n < 65535) n++; else { out.push(v, n); v = m[i]; n = 1; } } out.push(v, n); return out; };
const dec = (r, len) => { const m = new Uint8Array(len); let i = 0; for (let k = 0; k < r.length; k += 2) { m.fill(r[k], i, i + r[k + 1]); i += r[k + 1]; } return m; };

// ---------- 1) ROZBOR ----------
PERSON.analyze = async ({ video, file, onP, cancel }) => {
  const seg = await HEAD.segLoad();
  const vw = video.videoWidth || 1080, vh = video.videoHeight || 1920, ar = vw / vh, dur = video.duration || 0;
  const long = Math.min(1280, Math.max(vw, vh)), W = Math.round(ar >= 1 ? long : long * ar) & ~1, H = Math.round(ar >= 1 ? long / ar : long) & ~1;
  const inC = mk(IN, IN), inX = inC.getContext('2d', { willReadFrequently: true });
  const gC = mk(R, R), gX = gC.getContext('2d', { willReadFrequently: true });
  const out = { W, H, R, t: [], r: [], a: [] };
  const buf = [];   // posledních 5 snímků: {t, x0, y0, s, conf (R×R 0..1), gray (R×R 0..1)}
  let box = null, lastG = null, lastYield = performance.now();
  const runAI = (x0, y0, s, src) => {
    inX.fillStyle = '#000'; inX.fillRect(0, 0, IN, IN); inX.drawImage(src, x0, y0, s, s, 0, 0, IN, IN);
    let conf = null;
    const r = seg.segment(inC), cm = r.confidenceMasks;
    if (cm && cm.length) { const bg = cm[0].getAsFloat32Array(), mw = cm[0].width, mh = cm[0].height;
      conf = new Float32Array(R * R);   // osoba = 1 − pozadí, převzorkováno na R (bilineárně)
      for (let j = 0; j < R; j++) { const fy = (j + 0.5) / R * mh - 0.5, y0i = Math.max(0, Math.floor(fy)), y1i = Math.min(mh - 1, y0i + 1), wy = Math.min(1, Math.max(0, fy - y0i));
        for (let i = 0; i < R; i++) { const fx = (i + 0.5) / R * mw - 0.5, x0i = Math.max(0, Math.floor(fx)), x1i = Math.min(mw - 1, x0i + 1), wx = Math.min(1, Math.max(0, fx - x0i));
          const v = (bg[y0i * mw + x0i] * (1 - wx) + bg[y0i * mw + x1i] * wx) * (1 - wy) + (bg[y1i * mw + x0i] * (1 - wx) + bg[y1i * mw + x1i] * wx) * wy;
          conf[j * R + i] = 1 - v; } } }
    r.close && r.close();
    return conf;
  };
  const bboxOf = (conf, x0, y0, s) => { let a = R, b = R, c = -1, d = -1; for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) if (conf[j * R + i] > 0.5) { if (i < a) a = i; if (i > c) c = i; if (j < b) b = j; if (j > d) d = j; }
    return c < 0 ? null : { x0: x0 + a / R * s, y0: y0 + b / R * s, x1: x0 + (c + 1) / R * s, y1: y0 + (d + 1) / R * s }; };
  // dokončit snímek i (z bufferu): časové vyhlazení se zarovnáním výřezů + přichycení okraje na hrany obrazu
  const finish = k => {
    const f = buf[k]; if (!f || f.done) return; f.done = true;
    let p = f.conf;
    if (p) {
      const acc = new Float32Array(R * R); let wsum = 0;
      for (let q = 0; q < buf.length; q++) { const o = buf[q]; if (!o || !o.conf || Math.abs(o.t - f.t) > 0.1) continue; const w = q === k ? 3 : (Math.abs(q - k) === 1 ? 2 : 1); wsum += w;
        if (o === f) { for (let n = 0; n < acc.length; n++) acc[n] += w * o.conf[n]; continue; }
        for (let j = 0; j < R; j++) { const wy = f.y0 + (j + 0.5) / R * f.s, v = Math.floor((wy - o.y0) / o.s * R); for (let i = 0; i < R; i++) { const wx = f.x0 + (i + 0.5) / R * f.s, u = Math.floor((wx - o.x0) / o.s * R);
          acc[j * R + i] += w * (u >= 0 && v >= 0 && u < R && v < R ? o.conf[v * R + u] : 0); } } }
      for (let n = 0; n < acc.length; n++) acc[n] /= wsum;
      const q = guided(f.gray, acc, R, R, 4, 0.004);
      const m = new Uint8Array(R * R);
      for (let n = 0; n < m.length; n++) { const v = (q[n] - 0.5) * 3.2 + 0.5; m[n] = v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v * 15) * 17; }   // ostřejší přechod, 16 úrovní (dobře se komprimuje)
      out.t.push(f.t); out.r.push([f.x0 / W, f.y0 / H, f.s / W].map(v => Math.round(v * 1e5) / 1e5)); out.a.push(enc(m));
    } else { out.t.push(f.t); out.r.push(null); out.a.push(null); }
  };
  for await (const fr of TRK.frames({ file, video, t0: 0, t1: dur, fps: 30, W, H })) {
    if (cancel && cancel()) break;
    onP && onP(fr.t / Math.max(0.01, dur));
    const cut = lastG && TRK.isCut(lastG, fr.data); lastG = fr.data;
    if (cut) { for (let k = 0; k < buf.length; k++) finish(k); buf.length = 0; box = null; }
    // výřez: čtverec kolem postavy z minulého snímku (s rezervou), jinak celý snímek
    let x0, y0, s;
    if (box) { const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2; s = Math.max(box.x1 - box.x0, box.y1 - box.y0) * 1.25 + 24; s = Math.min(s, Math.max(W, H)); x0 = cx - s / 2; y0 = cy - s / 2; }
    else { s = Math.max(W, H); x0 = (W - s) / 2; y0 = (H - s) / 2; }
    let conf = null; try { conf = runAI(x0, y0, s, fr.canvas); } catch (e) { console.warn('maska postavy', e); }
    // postava utekla z výřezu (okraj masky na kraji výřezu) → znovu z celého snímku
    let bb = conf && bboxOf(conf, x0, y0, s);
    if (box && conf && (!bb || (bb.x1 - bb.x0) * (bb.y1 - bb.y0) < 0.04 * s * s)) { s = Math.max(W, H); x0 = (W - s) / 2; y0 = (H - s) / 2; conf = runAI(x0, y0, s, fr.canvas); bb = conf && bboxOf(conf, x0, y0, s); }
    box = bb && (bb.x1 - bb.x0) * (bb.y1 - bb.y0) > 400 ? bb : null;
    // obraz výřezu (šedý 0..1) pro přichycení okraje
    gX.fillStyle = '#000'; gX.fillRect(0, 0, R, R); gX.drawImage(fr.canvas, x0, y0, s, s, 0, 0, R, R);
    const px = gX.getImageData(0, 0, R, R).data, gray = new Float32Array(R * R);
    for (let n = 0, j = 0; n < gray.length; n++, j += 4) gray[n] = (0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2]) / 255;
    buf.push({ t: fr.t, x0, y0, s, conf: bb ? conf : null, gray });
    if (buf.length === 5) { finish(2); buf.shift(); }
    if (performance.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); }
  }
  // zbytek bufferu
  for (let k = 0; k < buf.length; k++) finish(k);
  // časy musí jít po sobě (konec bufferu se dokončí bez řazení)
  const ord = out.t.map((t, i) => i).sort((a, b) => out.t[a] - out.t[b]);
  PERSON.data = { W, H, R, t: ord.map(i => out.t[i]), r: ord.map(i => out.r[i]), a: ord.map(i => out.a[i]) }; cache.clear(); rawCache.clear();
  return PERSON.data;
};
PERSON.save = () => PERSON.data;
// jakou část obdélníku (px plátna, v okamžiku ts zdrojového videa) zakrývá postava – 0..1 (pro chytré umístění textu)
const rawCache = new Map();
PERSON.cover = (ts, W, H, xf, rx0, ry0, rx1, ry1) => {
  const i = idxAt(ts); if (i < 0) return 0; const d = PERSON.data, Rr = d.R || R;
  let m = rawCache.get(i); if (!m) { m = dec(d.a[i], Rr * Rr); rawCache.set(i, m); if (rawCache.size > 30) rawCache.delete(rawCache.keys().next().value); }
  const r = d.r[i], z = xf ? xf.z / 100 : 1, kx = xf ? xf.x / 100 * W : 0, ky = xf ? xf.y / 100 * H : 0, s = r[2] * W * z, X = W / 2 + kx + (r[0] * W - W / 2) * z, Y = H / 2 + ky + (r[1] * H - H / 2) * z;
  let n = 0, c = 0;
  for (let a = 0; a < 6; a++) for (let b = 0; b < 16; b++) { const px = rx0 + (b + 0.5) / 16 * (rx1 - rx0), py = ry0 + (a + 0.5) / 6 * (ry1 - ry0), u = Math.floor((px - X) / s * Rr), v = Math.floor((py - Y) / s * Rr); n++; if (u >= 0 && v >= 0 && u < Rr && v < Rr && m[v * Rr + u] > 128) c++; }
  return c / n;
};
PERSON.load = o => { PERSON.data = o && o.t ? o : null; cache.clear(); rawCache.clear(); };

// ---------- 2) VYKRESLENÍ ----------
const cache = new Map();
function idxAt(ts) { const d = PERSON.data; if (!d || !d.t.length) return -1; let lo = 0, hi = d.t.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d.t[m] < ts) lo = m; else hi = m; } const i = Math.abs(d.t[lo] - ts) <= Math.abs(d.t[hi] - ts) ? lo : hi; return Math.abs(d.t[i] - ts) < 0.06 && d.a[i] ? i : -1; }
PERSON.has = ts => idxAt(ts) >= 0;
// měkký okraj masky (feather): 0 = ostrý, 100 = hodně měkký; výchozí 50 – vlasy a okraje neblikají
const featherR = () => { const f = g.E && E.G && E.G.maskFeather != null ? E.G.maskFeather : 50; return Math.max(0, Math.min(6, Math.round(f / 17))); };
function maskCanvas(i) {
  const fr = featherR(), key = i + '|' + fr; let c = cache.get(key); if (c) return c;
  const d = PERSON.data, Rr = d.R || R, m = dec(d.a[i], Rr * Rr); c = mk(Rr, Rr); const x = c.getContext('2d'), id = x.createImageData(Rr, Rr);
  let A = m;
  // měkký přechod jen VEN od postavy: rozmazání ×2,4 → na původním okraji (a uvnitř) je postava úplně neprůhledná,
  // měkce mizí až za okrajem hlavy / vlasů – text nikdy neprosvítá „v hlavě“
  if (fr > 0) { let f = new Float32Array(m.length); for (let k = 0; k < m.length; k++) f[k] = m[k]; f = boxBlur(boxBlur(f, Rr, Rr, fr), Rr, Rr, fr); A = f.map(v => Math.min(255, v * 2.4)); }
  for (let k = 0; k < m.length; k++) { const j = k * 4; id.data[j] = id.data[j + 1] = id.data[j + 2] = 255; id.data[j + 3] = A[k]; }
  x.putImageData(id, 0, 0); cache.set(key, c); if (cache.size > 60) cache.delete(cache.keys().next().value);
  return c;
}
// obdélník postavy na plátně v čase t (px), s ohledem na přiblížení / stabilizaci
PERSON.rect = (t, W, H, xf) => { const ts = E._fT != null ? E._fT : (E.out2src ? E.out2src(t) : t), i = idxAt(ts); if (i < 0) return null; const r = PERSON.data.r[i], z = xf ? xf.z / 100 : 1, kx = xf ? xf.x / 100 * W : 0, ky = xf ? xf.y / 100 * H : 0;
  const s = r[2] * W * z, X = W / 2 + kx + (r[0] * W - W / 2) * z, Y = H / 2 + ky + (r[1] * H - H / 2) * z;
  const x0 = Math.max(0, Math.floor(X) - 2), y0 = Math.max(0, Math.floor(Y) - 2), x1 = Math.min(W, Math.ceil(X + s) + 2), y1 = Math.min(H, Math.ceil(Y + s) + 2);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0, X, Y, s, i } : null; };
let tmp = null, tmx = null;
// rámeček masky snímku i na plátně (px)
const rectOf = (i, W, H, xf) => { const r = PERSON.data.r[i]; if (!r) return null; const z = xf ? xf.z / 100 : 1, kx = xf ? xf.x / 100 * W : 0, ky = xf ? xf.y / 100 * H : 0;
  return { X: W / 2 + kx + (r[0] * W - W / 2) * z, Y: H / 2 + ky + (r[1] * H - H / 2) * z, s: r[2] * W * z }; };
PERSON.compose = (ctx, W, H, t, baseC, xf) => {
  const R2 = PERSON.rect(t, W, H, xf); if (!R2) return false;
  if (!tmp || tmp.width !== W || tmp.height !== H) { tmp = mk(W, H); tmx = tmp.getContext('2d'); }
  // oblast = sjednocení rámečků sousedních snímků (měkké časové prolnutí)
  const d = PERSON.data, i = R2.i, soft = featherR() > 0, nb = [];
  if (soft) for (const j of [i - 1, i + 1]) if (j >= 0 && j < d.t.length && d.a[j] && Math.abs(d.t[j] - d.t[i]) < 0.06) nb.push(j);
  let x0 = R2.x, y0 = R2.y, x1 = R2.x + R2.w, y1 = R2.y + R2.h;
  for (const j of nb) { const q = rectOf(j, W, H, xf); x0 = Math.min(x0, Math.floor(q.X) - 2); y0 = Math.min(y0, Math.floor(q.Y) - 2); x1 = Math.max(x1, Math.ceil(q.X + q.s) + 2); y1 = Math.max(y1, Math.ceil(q.Y + q.s) + 2); }
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1); const w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return false;
  tmx.globalCompositeOperation = 'source-over'; tmx.globalAlpha = 1; tmx.clearRect(x0, y0, w, h); tmx.imageSmoothingEnabled = true; tmx.imageSmoothingQuality = 'high';
  tmx.drawImage(maskCanvas(i), R2.X, R2.Y, R2.s, R2.s);   // tento snímek naplno (hlava vždy celá)
  if (nb.length) {   // sousední snímky jen přidají měkký okraj kolem (vlasy se nemění skokem), dovnitř nic neprosvítá
    tmx.globalCompositeOperation = 'lighter';
    nb.forEach(j => { const q = rectOf(j, W, H, xf); tmx.globalAlpha = 0.35; tmx.drawImage(maskCanvas(j), q.X, q.Y, q.s, q.s); });
    tmx.globalAlpha = 1;
  }
  tmx.globalCompositeOperation = 'source-in'; tmx.drawImage(baseC, x0, y0, w, h, x0, y0, w, h); tmx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowColor = 'transparent';
  ctx.drawImage(tmp, x0, y0, w, h, x0, y0, w, h); ctx.restore();
  return true;
};
})(window);
