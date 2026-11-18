/* EFEKTIVE Captions – TEXT ZA HLAVOU (chytře)
   1) Rozbor videa: v každém snímku se najde obličej (AI body obličeje, sledování bez ujíždění) a ve výřezu kolem hlavy
      AI rozdělí obraz na vlasy / obličej / tělo / oblečení / pozadí. Hlava = vlasy + obličej (+ brýle, čepice).
      Díky sledování se maska počítá zblízka (ostré okraje) a drží přesně na hlavě.
   2) Vykreslení: přes titulky se znovu nakreslí jen hlava → text je za hlavou, ale před tělem.
   3) Chytře: když by hlava zakryla moc velkou část slova, to slovo se dá dopředu (nikdy nezmizí celé slovo). */
"use strict";
(function (g) {
const HEAD = g.HEAD = { data: null };
const MS0 = 160;
// horní okraj hlavy (vlasy) ve snímku i: 0..1 výšky snímku, nebo null
HEAD.topAt = i => { const d = HEAD.data, m = d && d.m[i]; if (!m) return null; for (let r = 0; r < MS0; r++) { let c = 0; for (let x = 0; x < MS0; x++) if (m[r * MS0 + x] > 140) c++; if (c >= 3) { const side = d.side[i] * d.W; return (d.y[i] * d.H - side / 2 + (r + 0.5) / MS0 * side) / d.H; } } return null; };
const MPV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const SEG = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
const MS = 160;            // rozlišení uložené masky hlavy (výřez kolem hlavy)
let segP = null;
HEAD.segLoad = () => segP || (segP = (async () => {
  const V = await import(MPV + '/vision_bundle.mjs');
  const fs = await V.FilesetResolver.forVisionTasks(MPV + '/wasm');
  const mk = d => V.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: SEG, delegate: d }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true });
  try { return await mk('GPU'); } catch (e) { return await mk('CPU'); }
})().catch(e => { segP = null; throw e; }));

// ---------- 1) ROZBOR VIDEA ----------
const segC = document.createElement('canvas'); segC.width = segC.height = 256; const segX = segC.getContext('2d', { willReadFrequently: true });
// největší obličej v celém snímku (celý snímek + dlaždice, ať se najde i malý obličej v dálce)
function scanAll(fl, src, W, H) {
  let best = null;
  const take = list => { for (const P of list) { const h = TRK.headPose(P); if (!best || h.fw > best.fw) best = h; } };
  const S = Math.max(W, H); take(TRK._facesIn(fl, src, (W - S) / 2, (H - S) / 2, S));
  if (!best) { const side = Math.min(W, H) * 0.6, st = side * 0.5;
    for (let y = 0; y <= H - side * 0.5; y += st) for (let x = 0; x <= W - side * 0.5; x += st) take(TRK._facesIn(fl, src, x, y, side)); }
  return best;
}
HEAD.analyze = async ({ video, file, onP, cancel }) => {
  const fl = await TRK.faceLoad(), seg = await HEAD.segLoad();
  const vw = video.videoWidth || 1080, vh = video.videoHeight || 1920, ar = vw / vh, dur = video.duration || 0;
  const long = Math.min(1280, Math.max(vw, vh)), W = Math.round(ar >= 1 ? long : long * ar) & ~1, H = Math.round(ar >= 1 ? long / ar : long) & ~1;
  const out = { t: [], x: [], y: [], side: [], m: [], W, H };
  let cur = null, miss = 0, lastScan = -1e9, lastG = null, lastYield = performance.now(), segN = 0, lastM = null;
  for await (const fr of TRK.frames({ file, video, t0: 0, t1: dur, fps: 30, W, H })) {
    if (cancel && cancel()) break;
    onP && onP(fr.t / Math.max(0.01, dur));
    if (lastG && TRK.isCut(lastG, fr.data)) { cur = null; lastScan = -1e9; }   // střih → obličej hledat znovu
    lastG = fr.data;
    let h = null;
    if (cur) for (const k of [2.8, 5]) {
      const side = Math.max(120, cur.fw * k); let bd = 1e9;
      for (const P of TRK._facesIn(fl, fr.canvas, cur.cx - side / 2, cur.cy - side / 2, side)) { const q = TRK.headPose(P), d = Math.hypot(q.cx - cur.cx, q.cy - cur.cy); if (d < Math.max(cur.fw, q.fw) * 0.8 && d < bd) { bd = d; h = q; } }
      if (h) break;
    }
    if (!h && fr.t - lastScan > 0.3) { lastScan = fr.t; h = scanAll(fl, fr.canvas, W, H); }
    out.t.push(fr.t);
    if (!h) { lastM = null; if (++miss > 3) cur = null; out.x.push(0); out.y.push(0); out.side.push(0); out.m.push(null); continue; }
    cur = h; miss = 0;
    // výřez kolem hlavy (s vlasy nad čelem), AI rozdělení na části postavy
    const side = h.fw * 2.7, cx = h.cx, cy = h.cy - h.fw * 0.2;
    segX.fillStyle = '#000'; segX.fillRect(0, 0, 256, 256);
    segX.drawImage(fr.canvas, cx - side / 2, cy - side / 2, side, side, 0, 0, 256, 256);
    let m = null;
    // maska stačí každý druhý snímek (je ve výřezu kolem hlavy, posun hlavy dorovná poloha obličeje z tohoto snímku)
    if ((segN++ & 1) && lastM) m = lastM;
    else try {
      const r = seg.segment(segC), cm = r.confidenceMasks;
      if (cm && cm.length >= 4) {
        const hair = cm[1].getAsFloat32Array(), face = cm[3].getAsFloat32Array(), acc = cm[5] ? cm[5].getAsFloat32Array() : null, mw = cm[1].width, mh = cm[1].height;
        m = new Uint8Array(MS * MS);
        for (let j = 0; j < MS; j++) { const sj = Math.min(mh - 1, Math.floor((j + 0.5) / MS * mh)); for (let i = 0; i < MS; i++) { const si = Math.min(mw - 1, Math.floor((i + 0.5) / MS * mw)), k = sj * mw + si;
          m[j * MS + i] = Math.min(255, Math.round((hair[k] + face[k] + (acc ? acc[k] : 0)) * 255)); } }
      }
      r.close && r.close();
    } catch (e) { console.warn('maska hlavy', e); }
    lastM = m;
    out.x.push(cx / W); out.y.push(cy / H); out.side.push(side / W); out.m.push(m);
    if (performance.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); }
  }
  // klidné okraje: maska se zprůměruje se sousedními snímky (ve výřezu kolem hlavy, takže bez zpoždění za pohybem)
  const sm = out.m.map((m, i) => {
    if (!m) return m; const a = out.m[i - 1], b = out.m[i + 1];
    const ok = j => out.m[j] && Math.abs(out.side[j] / out.side[i] - 1) < 0.08 && Math.hypot(out.x[j] - out.x[i], (out.y[j] - out.y[i]) * H / W) < out.side[i] * 0.06;
    if (!(a && ok(i - 1)) || !(b && ok(i + 1))) return m;
    const r = new Uint8Array(m.length); for (let k = 0; k < m.length; k++) r[k] = (a[k] + 2 * m[k] + b[k] + 2) >> 2; return r;
  });
  out.m = sm;
  HEAD.data = out; HEAD._mc = null;
  return out;
};
// uložení do projektu (komprese: maska se uloží jako řetězec)
HEAD.save = () => { const d = HEAD.data; if (!d) return null;
  // úsporně: maska hlavy jako běhy 0/1 (pár set bajtů na snímek) – uloží se k projektu
  const enc = m => { if (!m) return null; const r = []; let v = 0, n = 0; for (let i = 0; i < m.length; i++) { const b = m[i] > 127 ? 1 : 0; if (b === v) n++; else { r.push(n); v = b; n = 1; } } r.push(n); return r.join(','); };
  return { v: 2, W: d.W, H: d.H, t: d.t, x: d.x, y: d.y, side: d.side, m: d.m.map(enc) }; };
HEAD.load = o => { if (!o || !o.t) { HEAD.data = null; return; }
  const dec = s => { if (!s) return null; const m = new Uint8Array(MS0 * MS0); let i = 0, v = 0; for (const n of s.split(',').map(Number)) { if (v) m.fill(255, i, i + n); i += n; v ^= 1; } return m; };
  const dec1 = s => { if (!s) return null; const b = atob(s), m = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) m[i] = b.charCodeAt(i); return m; };
  HEAD.data = { ...o, m: o.m.map(o.v === 2 ? dec : dec1) }; HEAD._mc = null; };

// ---------- 2) VYKRESLENÍ ----------
// snímek (zdrojový čas) → nejbližší snímek rozboru
function at(ts) {
  const d = HEAD.data; if (!d || !d.t.length) return -1;
  let lo = 0, hi = d.t.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d.t[m] < ts) lo = m; else hi = m; }
  const i = Math.abs(d.t[lo] - ts) <= Math.abs(d.t[hi] - ts) ? lo : hi;
  return Math.abs(d.t[i] - ts) < 0.06 && d.m[i] ? i : -1;
}
HEAD.has = ts => at(ts) >= 0;
let mc = null, mcx = null, mcI = -1;
function maskCanvas(i) {
  if (!mc) { mc = document.createElement('canvas'); mc.width = mc.height = MS; mcx = mc.getContext('2d'); }
  if (mcI !== i) { const m = HEAD.data.m[i], img = mcx.createImageData(MS, MS); for (let k = 0; k < m.length; k++) { const j = k * 4; img.data[j] = img.data[j + 1] = img.data[j + 2] = 255; img.data[j + 3] = m[k]; } mcx.putImageData(img, 0, 0); mcI = i; }
  return mc;
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let tmp = null, tmx = null, fm = null, fmx = null, sA = null, sAx = null, sB = null, sBx = null, sM = null, sMx = null; const wmem = new Map();
// ctx = hotový snímek s titulky (capC = jeho kopie), baseC = snímek bez titulků; t = výsledný čas, xf = zoom videa
HEAD.compose = (ctx, W, H, t, baseC, capC, xf, opt) => {
  const ts = E.out2src ? E.out2src(t) : t, i = at(ts); if (i < 0) return false;
  const d = HEAD.data, z = xf ? xf.z / 100 : 1, kx = xf ? xf.x / 100 * W : 0, ky = xf ? xf.y / 100 * H : 0;
  const s = d.side[i] * W * z, X = W / 2 + kx + (d.x[i] * W - W / 2) * z, Y = H / 2 + ky + (d.y[i] * H - H / 2) * z;
  if (!tmp || tmp.width !== W || tmp.height !== H) { tmp = mk(W, H); tmx = tmp.getContext('2d'); fm = mk(W, H); fmx = fm.getContext('2d'); }
  // hlava ze snímku bez titulků přes maskou
  tmx.globalCompositeOperation = 'source-over'; tmx.clearRect(0, 0, W, H); tmx.imageSmoothingEnabled = true; tmx.imageSmoothingQuality = 'high';
  tmx.drawImage(maskCanvas(i), X - s / 2, Y - s / 2, s, s);
  tmx.globalCompositeOperation = 'source-in'; tmx.drawImage(baseC, 0, 0); tmx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowColor = 'transparent';
  ctx.drawImage(tmp, 0, 0);
  if (opt && opt.smart === false) { ctx.restore(); return true; }
  // žádné slovo nezasahuje do hlavy → není co řešit (žádné čtení pixelů – přehrávání zůstane plynulé)
  const hx0 = X - s / 2, hy0 = Y - s / 2, hx1 = X + s / 2, hy1 = Y + s / 2;
  if (!((opt && opt.words) || []).some(wd => wd.x1 > hx0 && wd.x0 < hx1 && wd.y1 > hy0 && wd.y0 < hy1)) { ctx.restore(); return true; }
  // 3) chytře: slova (shluky písma) – kolik z nich hlava zakrývá
  const SC = Math.max(1, Math.min(W, H) / 270);   // rozbor slov v malém rozlišení (kratší strana ~270 px)
  const w = Math.max(8, Math.round(W / SC)), h = Math.max(8, Math.round(H / SC));
  if (!sA || sA.width !== w || sA.height !== h) { sA = mk(w, h); sAx = sA.getContext('2d', { willReadFrequently: true }); sB = mk(w, h); sBx = sB.getContext('2d', { willReadFrequently: true }); sM = mk(w, h); sMx = sM.getContext('2d', { willReadFrequently: true }); }
  sAx.drawImage(capC, 0, 0, w, h); sBx.drawImage(baseC, 0, 0, w, h); sMx.clearRect(0, 0, w, h); sMx.drawImage(maskCanvas(i), (X - s / 2) / SC, (Y - s / 2) / SC, s / SC, s / SC);
  const A = sAx.getImageData(0, 0, w, h).data, B = sBx.getImageData(0, 0, w, h).data, M = sMx.getImageData(0, 0, w, h).data;
  const txt = new Uint8Array(w * h);
  for (let k = 0, j = 0; k < txt.length; k++, j += 4) txt[k] = (Math.abs(A[j] - B[j]) + Math.abs(A[j + 1] - B[j + 1]) + Math.abs(A[j + 2] - B[j + 2])) > 60 ? 1 : 0;
  // slova z rozložení titulku: kolik písma slova hlava zakrývá; rozhodnutí s pamětí (slovo nepřeskakuje dopředu / dozadu)
  const front = [], words = (opt && opt.words) || [];
  for (const wd of words) {
    const x0 = Math.max(0, Math.floor(wd.x0 / SC)), x1 = Math.min(w - 1, Math.ceil(wd.x1 / SC)), y0 = Math.max(0, Math.floor(wd.y0 / SC)), y1 = Math.min(h - 1, Math.ceil(wd.y1 / SC));
    // po písmenech (svislé pruhy): hlava nesmí schovat celé písmeno, jinak se slovo špatně čte („elém“ místo „celém“)
    const nl = Math.max(1, Math.min(20, wd.n || 3)), seg = new Float64Array(nl * 2);
    let n = 0, o = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const q = y * w + x; if (!txt[q]) continue; const li = Math.min(nl - 1, Math.floor((x - x0) / Math.max(1, x1 - x0 + 1) * nl)); n++; seg[li * 2]++; if (M[q * 4 + 3] > 128) { o++; seg[li * 2 + 1]++; } }
    if (n < 4) continue;
    let worst = 0; for (let i = 0; i < nl; i++) if (seg[i * 2] >= 3) worst = Math.max(worst, seg[i * 2 + 1] / seg[i * 2]);
    // dopředu jen když by hlava schovala víc než půlku slova nebo celé písmeno (jinak zůstane za hlavou – to je ten efekt)
    let isF = (wmem.get(wd.id) ? (o / n > 0.42 || worst > 0.78) : (o / n > 0.55 || worst > 0.9));
    // přes obličej (spodní ~60 % hlavy) se slovo dopředu nedá – obličej musí být vždy vidět
    if (isF && wd.y1 > Y - s * 0.12 && wd.x1 > X - s * 0.25 && wd.x0 < X + s * 0.25) isF = false;
    wmem.set(wd.id, isF); if (isF) front.push(wd);
  }
  if (wmem.size > 400) wmem.clear();
  HEAD._last = front.length;
  if (front.length) {
    // slova vpředu: v jejich obdélníku (s okrajem na stín) se vrátí snímek s titulkem → slovo je přes hlavu
    fmx.globalCompositeOperation = 'source-over'; fmx.clearRect(0, 0, W, H); fmx.fillStyle = '#fff';
    for (const wd of front) { const m = (wd.y1 - wd.y0) * 0.18; fmx.fillRect(wd.x0 - m, wd.y0 - m, wd.x1 - wd.x0 + 2 * m, wd.y1 - wd.y0 + 2 * m); }
    fmx.globalCompositeOperation = 'source-in'; fmx.drawImage(capC, 0, 0); fmx.globalCompositeOperation = 'source-over';
    ctx.drawImage(fm, 0, 0);
  }
  ctx.restore();
  return true;
};
})(window);
