/* EFEKTIVE Captions – AI OBJEKT BEZ BODŮ (sledování přesného tvaru)
   Uživatel klepne na objekt (člověk, míč, auto, gauč…) → AI ho vybere. Pak se v KAŽDÉM snímku objekt vybere znovu:
   • pohyb objektu se odhadne (sledování rámečku), body klepnutí se posunou s ním,
   • ve výřezu kolem objektu AI znovu vybere objekt pod těmito body → přesný obrys v daném snímku (kulatý míč je kulatý),
   • kontrola: nový výběr musí sedět s předpovědí (jinak se použije předpověď – žádné skoky na jiný objekt),
   • nakonec se okraje vyhladí přes sousední snímky (neblikají).
   Výsledek: o.trk = {kind:'seg', t:[], b:[[x0,y0,side]…] (výřez, normalizovaně), m:[maska výřezu RLE], R} */
"use strict";
(function (g) {
const SEG = g.SEG = {};
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';
const IN = 384, R = 256, LS = 4;   // vstup AI (výřez), uložená maska výřezu, zmenšení pro předpověď
let segP = null;
SEG.load = () => segP || (segP = (async () => {
  const V = await import(MP + '/vision_bundle.mjs');
  const fs = await V.FilesetResolver.forVisionTasks(MP + '/wasm');
  const mk = d => V.InteractiveSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate: d }, outputCategoryMask: false, outputConfidenceMasks: true });
  try { return await mk('GPU'); } catch (e) { return await mk('CPU'); }
})().catch(e => { segP = null; throw e; }));

const cropC = document.createElement('canvas'); cropC.width = cropC.height = IN; const cropX = cropC.getContext('2d');
// AI výběr ve výřezu (x0, y0, strana v px snímku) pod body pts (px snímku) → pravděpodobnost objektu IN×IN
function segCrop(seg, pts) {
  const sc = pts.map(([x, y]) => ({ x: Math.min(0.995, Math.max(0.005, x)), y: Math.min(0.995, Math.max(0.005, y)) }));
  let out = null;
  seg.segment(cropC, sc.length > 1 ? { scribble: sc } : { keypoint: sc[0] }, r => {
    const cm = r.confidenceMasks; if (!cm || !cm.length) return; const m = cm[cm.length - 1];
    const a = m.getAsFloat32Array(), w = m.width, h = m.height, o = new Float32Array(IN * IN);
    for (let j = 0; j < IN; j++) { const sj = Math.min(h - 1, Math.floor((j + 0.5) / IN * h)); for (let i = 0; i < IN; i++) o[j * IN + i] = a[sj * w + Math.min(w - 1, Math.floor((i + 0.5) / IN * w))]; }
    out = o;
  });
  return out;
}
// malá mapa (celý snímek / LS): hloubka uvnitř (kolik kroků zúžení vydrží) → nejhlubší body
function deepPts(map, w, h, n) {
  let cur = map.slice(), depth = new Uint8Array(w * h);
  for (let it = 1; it < 40; it++) { let any = 0; const nx = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const k = y * w + x; if (cur[k] && cur[k - 1] && cur[k + 1] && cur[k - w] && cur[k + w]) { nx[k] = 1; depth[k] = it; any = 1; } }
    if (!any) break; cur = nx; }
  const cand = []; for (let k = 0; k < depth.length; k++) if (depth[k]) cand.push([depth[k], k % w, (k / w) | 0]);
  if (!cand.length) { for (let k = 0; k < map.length; k++) if (map[k]) return [[k % w, (k / w) | 0]]; return []; }
  cand.sort((a, b) => b[0] - a[0]); const out = [], md = Math.max(2, cand[0][0] * 1.5);
  for (const [d, x, y] of cand) { if (out.length >= n) break; if (out.every(p => Math.hypot(p[0] - x, p[1] - y) > md)) out.push([x, y]); }
  return out;
}
const bboxOf = (map, w, h) => { let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (map[y * w + x]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return n ? { x0, y0, x1: x1 + 1, y1: y1 + 1, n } : null; };
// posun + zvětšení mapy kolem bodu (cx, cy): bod p → c' + k·(p − c)
function warp(map, w, h, cx, cy, ncx, ncy, k) { const o = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = Math.round(cx + (x - ncx) / k), sy = Math.round(cy + (y - ncy) / k); if (sx >= 0 && sy >= 0 && sx < w && sy < h && map[sy * w + sx]) o[y * w + x] = 1; } return o; }

// o: {video, file, t0, mask: {w,h,d} (výběr ve výchozím snímku), seeds: [{x,y,neg}] (normalizovaně), back, onP, onFrame, cancel}
SEG.run = async (o) => {
  const { video, file, t0, mask, seeds, onP, cancel } = o;
  const seg = await SEG.load();
  const vw = video.videoWidth || 1080, vh = video.videoHeight || 1920, ar = vw / vh, dur = video.duration || 0;
  const long = Math.min(960, Math.max(vw, vh)), W = Math.round(ar >= 1 ? long : long * ar) & ~1, H = Math.round(ar >= 1 ? long / ar : long) & ~1;
  const lw = Math.ceil(W / LS), lh = Math.ceil(H / LS), fps = 30, back = Math.min(t0, o.back != null ? o.back : 20), tEnd = Math.min(dur, o.t1 != null ? o.t1 : dur), total = (tEnd - (t0 - back)) || 1;
  // výchozí mapa objektu (z výběru uživatele) v malém rozlišení
  const map0 = new Uint8Array(lw * lh); for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const mx = Math.min(mask.w - 1, Math.floor((x + 0.5) / lw * mask.w)), my = Math.min(mask.h - 1, Math.floor((y + 0.5) / lh * mask.h)); map0[y * lw + x] = mask.d[my * mask.w + mx] ? 1 : 0; }
  const bb0 = bboxOf(map0, lw, lh); if (!bb0) { SEG.why = 'nic není vybrané'; return null; }
  const pos = seeds.filter(s => !s.neg), neg = seeds.filter(s => s.neg);
  if (!pos.length) { const d = deepPts(map0, lw, lh, 1)[0]; pos.push({ x: (d[0] + 0.5) / lw, y: (d[1] + 0.5) / lh }); }
  SEG.why = '';
  let lastYield = performance.now(); const breathe = async () => { if (performance.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); } };
  const out = [];   // {t, x0, y0, side, m: Uint8Array R×R (0/1)}
  // jeden průchod: frames = asynchronní řada {t, data (šedá), src (obraz)}
  const pass = async (frames, first, dst) => {
    let map = map0.slice(), st = null, prevP = null, lastG = null, coast = 0;
    let S = pos.map(s => [s.x * lw, s.y * lh]), N = neg.map(s => [s.x * lw, s.y * lh]);   // body klepnutí v malé mapě
    for await (const fr of frames) {
      if (cancel && cancel()) break;
      if (lastG && TRK.isCut(lastG, fr.data)) { SEG.why = 'střih ' + fr.t.toFixed(2); break; }
      lastG = fr.data;
      const Q = TRK.pyramid(fr.data, W, H), bb = bboxOf(map, lw, lh); if (!bb) break;
      const box = { cx: (bb.x0 + bb.x1) / 2 * LS, cy: (bb.y0 + bb.y1) / 2 * LS, w: Math.max(16, (bb.x1 - bb.x0) * LS), h: Math.max(16, (bb.y1 - bb.y0) * LS) };
      let pred = map;
      if (st && prevP) {
        // 1) předpověď pohybu (sledování rámečku objektu)
        let n = TRK.step(st, prevP, Q); if (!n) n = TRK.recover(st, Q);
        if (n) { const k = Math.max(0.85, Math.min(1.18, n.w / st.w)), cx = st.cx / LS, cy = st.cy / LS, ncx = n.cx / LS, ncy = n.cy / LS;
          pred = warp(map, lw, lh, cx, cy, ncx, ncy, k); const mv = p => [ncx + (p[0] - cx) * k, ncy + (p[1] - cy) * k]; S = S.map(mv); N = N.map(mv); Object.assign(st, n); TRK.adapt(st, Q); }
      }
      const pb = bboxOf(pred, lw, lh); if (!pb) break;
      // 2) výřez kolem objektu (s okrajem) a AI výběr v něm
      const bw = (pb.x1 - pb.x0) * LS, bh = (pb.y1 - pb.y0) * LS, side = Math.max(64, Math.max(bw, bh) * 1.45), x0 = (pb.x0 + pb.x1) / 2 * LS - side / 2, y0 = (pb.y0 + pb.y1) / 2 * LS - side / 2;
      cropX.fillStyle = '#000'; cropX.fillRect(0, 0, IN, IN); cropX.drawImage(fr.src, x0, y0, side, side, 0, 0, IN, IN);
      const toC = ([x, y]) => [(x * LS - x0) / side, (y * LS - y0) / side];
      // body uvnitř předpovědi: bod klepnutí (když je pořád na objektu) + nejhlubší místa objektu
      const deep = deepPts(pred, lw, lh, 3);
      const inside = p => { const x = Math.round(p[0]), y = Math.round(p[1]); return x >= 0 && y >= 0 && x < lw && y < lh && pred[y * lw + x]; };
      const pts = S.filter(inside).concat(deep.map(([x, y]) => [x + 0.5, y + 0.5])).slice(0, 5).map(toC);
      let prob = null; try { prob = pts.length ? segCrop(seg, pts) : null; } catch (e) { console.warn('AI výběr', e); }
      if (prob && N.length) for (const p of N) { const q = segCrop(seg, [toC(p)]); if (q) for (let k = 0; k < prob.length; k++) if (q[k] > 0.5) prob[k] = Math.min(prob[k], 1 - q[k]); }
      // 3) kontrola s předpovědí (v malé mapě) – jen části, které na předpověď navazují
      let next = null;
      if (prob) {
        const cand = new Uint8Array(lw * lh);
        for (let y = Math.max(0, Math.floor(y0 / LS)); y < Math.min(lh, Math.ceil((y0 + side) / LS)); y++) for (let x = Math.max(0, Math.floor(x0 / LS)); x < Math.min(lw, Math.ceil((x0 + side) / LS)); x++) {
          const cx = Math.floor(((x + 0.5) * LS - x0) / side * IN), cy = Math.floor(((y + 0.5) * LS - y0) / side * IN);
          if (cx >= 0 && cy >= 0 && cx < IN && cy < IN && prob[cy * IN + cx] > 0.5) cand[y * lw + x] = 1; }
        // souvislé části, které s předpovědí sdílí aspoň kus
        const lab = new Int32Array(lw * lh), keep = new Uint8Array(lw * lh); let id = 0;
        for (let k = 0; k < cand.length; k++) { if (!cand[k] || lab[k]) continue; id++; const stck = [k], comp = []; lab[k] = id; let ov = 0;
          while (stck.length) { const q = stck.pop(); comp.push(q); if (pred[q]) ov++; const x = q % lw; for (const nb of [q - 1, q + 1, q - lw, q + lw]) { if (nb < 0 || nb >= cand.length || lab[nb] || !cand[nb]) continue; if ((nb === q - 1 && x === 0) || (nb === q + 1 && x === lw - 1)) continue; lab[nb] = id; stck.push(nb); } }
          if (ov >= Math.max(2, comp.length * 0.15)) for (const q of comp) keep[q] = 1; }
        let inter = 0, uni = 0; for (let k = 0; k < keep.length; k++) { if (keep[k] && pred[k]) inter++; if (keep[k] || pred[k]) uni++; }
        if (uni && inter / uni > 0.4) next = keep;
      }
      if (next) { coast = 0; map = next; } else { if (++coast > 8) { SEG.why = 'objekt ztracen ' + fr.t.toFixed(2); break; } map = pred; }
      const nb = bboxOf(map, lw, lh); if (!nb || nb.n < bb0.n * 0.08) { SEG.why = 'objekt zmizel ' + fr.t.toFixed(2); break; }
      // rámeček pro předpověď příště = skutečný objekt
      const nbox = { cx: (nb.x0 + nb.x1) / 2 * LS, cy: (nb.y0 + nb.y1) / 2 * LS, w: Math.max(16, (nb.x1 - nb.x0) * LS), h: Math.max(16, (nb.y1 - nb.y0) * LS) };
      if (!st) st = TRK.init(nbox, Q); else Object.assign(st, nbox);
      // 4) uložit masku výřezu (ostrá z AI, omezená na navazující části)
      const m = new Uint8Array(R * R);
      if (prob && next) for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const px = x0 + (i + 0.5) / R * side, py = y0 + (j + 0.5) / R * side, mx = Math.floor(px / LS), my = Math.floor(py / LS);
        if (mx < 0 || my < 0 || mx >= lw || my >= lh) continue; let near = 0; for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = mx + dx, yy = my + dy; if (xx >= 0 && yy >= 0 && xx < lw && yy < lh && next[yy * lw + xx]) { near = 1; break; } }
        if (near && prob[Math.min(IN - 1, Math.floor((j + 0.5) / R * IN)) * IN + Math.min(IN - 1, Math.floor((i + 0.5) / R * IN))] > 0.5) m[j * R + i] = 1; }
      else for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const mx = Math.floor((x0 + (i + 0.5) / R * side) / LS), my = Math.floor((y0 + (j + 0.5) / R * side) / LS); if (mx >= 0 && my >= 0 && mx < lw && my < lh && map[my * lw + mx]) m[j * R + i] = 1; }
      dst.push({ t: fr.t, x0, y0, side, m });
      if (o.onFrame && fr.canvas && dst.length % 2 === 0) o.onFrame(fr.canvas, { cx: nbox.cx / W, cy: nbox.cy / H, w: nbox.w / W, h: nbox.h / H });
      prevP = Q; await breathe();
    }
  };
  // dopředu
  const fwd = [];
  await pass((async function* () { for await (const fr of TRK.frames({ file, video, t0, t1: tEnd, fps, W, H })) { onP && onP(back / total + (fr.t - t0) / total); yield { t: fr.t, data: fr.data, src: fr.canvas, canvas: fr.canvas }; } })(), true, fwd);
  // dozadu po kouscích (snímky kousku se uloží, pak se projdou pozpátku)
  const bk = [];
  if (back > 0.02 && fwd.length && !(cancel && cancel())) {
    const CH = 0.5; let hi = t0, stopped = false;
    await pass((async function* () {
      while (!stopped && hi > t0 - back + 1e-3) {
        const lo = Math.max(t0 - back, hi - CH), buf = [];
        for await (const fr of TRK.frames({ file, video, t0: lo, t1: hi - 0.5 / fps, fps, W, H })) buf.push({ t: fr.t, data: fr.data, src: await createImageBitmap(fr.canvas) });
        if (!buf.length) break;
        for (let i = buf.length - 1; i >= 0; i--) { onP && onP((t0 - buf[i].t) / total); yield buf[i]; try { buf[i].src.close(); } catch (e) {} buf[i].src = null; }
        hi = lo;
      }
    })(), false, bk);
    stopped = true;
  }
  const all = bk.reverse().concat(fwd);
  if (all.length < 2) { if (!SEG.why) SEG.why = 'objekt se nepodařilo sledovat'; return null; }
  // klidné okraje: každá maska se zprůměruje se sousedními snímky (přepočtenými do jejího výřezu)
  const sample = (f, px, py) => { const i = Math.floor((px - f.x0) / f.side * R), j = Math.floor((py - f.y0) / f.side * R); return i >= 0 && j >= 0 && i < R && j < R ? f.m[j * R + i] : 0; };
  const sm = all.map((f, k) => { const a = all[k - 1], b = all[k + 1]; if (!a || !b || Math.abs(a.t - f.t) > 0.05 || Math.abs(b.t - f.t) > 0.05) return f.m;
    const r = new Uint8Array(R * R); for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const px = f.x0 + (i + 0.5) / R * f.side, py = f.y0 + (j + 0.5) / R * f.side; r[j * R + i] = (2 * f.m[j * R + i] + sample(a, px, py) + sample(b, px, py)) >= 2 ? 1 : 0; } return r; });
  return { kind: 'seg', R, t: all.map(f => Math.round(f.t * 1e4) / 1e4), b: all.map(f => [f.x0 / W, f.y0 / H, f.side / W].map(v => Math.round(v * 1e5) / 1e5)), m: sm.map(m => OBJ.rle({ w: R, h: R, d: m })), ar: W / H };
};
})(window);
