/* EFEKTIVE Captions – sledování objektu (tracking)
   Uživatel označí bod / rámeček (obličej, hrudník…) a appka ho sleduje snímek po snímku.
   • pyramidový Lucas–Kanade na mřížce bodů v rámečku + kontrola tam a zpět (jen spolehlivé body),
   • posun = medián, změna velikosti = medián poměrů vzdáleností bodů (objekt se blíží / vzdaluje),
   • proti „ujíždění“ jemná korekce podle vzhledu objektu (šablona z prvního snímku + průběžná),
   • když se objekt ztratí, hledá ho v okolí; když ho nenajde, sledování tam skončí,
   • nakonec vyhlazení bez zpoždění (lokální kvadratická regrese tam i zpět) → úplně plynulý pohyb. */
"use strict";
(function (g) {
const TRK = g.TRK = {};
const LEVELS = 4, R = 7, NG = 10;           // úrovně pyramidy, poloměr okna LK, mřížka NG×NG bodů

// ---------- obraz: pyramida + gradienty ----------
function level(w, h) { return { w, h, I: new Float32Array(w * h), gx: new Float32Array(w * h), gy: new Float32Array(w * h) }; }
function grads(L) {
  const { w, h, I, gx, gy } = L;
  for (let y = 0; y < h; y++) {
    const r = y * w, ru = (y > 0 ? y - 1 : 0) * w, rd = (y < h - 1 ? y + 1 : h - 1) * w;
    for (let x = 0; x < w; x++) {
      const xl = x > 0 ? x - 1 : 0, xr = x < w - 1 ? x + 1 : w - 1;
      gx[r + x] = (I[r + xr] - I[r + xl]) * 0.5;
      gy[r + x] = (I[rd + x] - I[ru + x]) * 0.5;
    }
  }
}
// rozmazání [1 4 6 4 1]/16 a zmenšení na polovinu
function down(A) {
  const w = A.w, h = A.h, w2 = Math.max(1, w >> 1), h2 = Math.max(1, h >> 1);
  const tmp = new Float32Array(w2 * h), B = level(w2, h2), S = A.I;
  for (let y = 0; y < h; y++) {
    const r = y * w;
    for (let x = 0; x < w2; x++) {
      const c = 2 * x, a0 = c > 1 ? c - 2 : 0, a1 = c > 0 ? c - 1 : 0, a3 = c + 1 < w ? c + 1 : w - 1, a4 = c + 2 < w ? c + 2 : w - 1;
      tmp[y * w2 + x] = (S[r + a0] + 4 * S[r + a1] + 6 * S[r + c] + 4 * S[r + a3] + S[r + a4]) / 16;
    }
  }
  for (let y = 0; y < h2; y++) {
    const c = 2 * y, b0 = (c > 1 ? c - 2 : 0) * w2, b1 = (c > 0 ? c - 1 : 0) * w2, b2 = c * w2, b3 = (c + 1 < h ? c + 1 : h - 1) * w2, b4 = (c + 2 < h ? c + 2 : h - 1) * w2;
    for (let x = 0; x < w2; x++) B.I[y * w2 + x] = (tmp[b0 + x] + 4 * tmp[b1 + x] + 6 * tmp[b2 + x] + 4 * tmp[b3 + x] + tmp[b4 + x]) / 16;
  }
  grads(B); return B;
}
// šedý snímek (Uint8 RGBA) → pyramida; úroveň 0 lehce rozmazaná (méně šumu z komprese)
TRK.gray = (rgba) => { const n = rgba.length >> 2, o = new Uint8Array(n); for (let i = 0, j = 0; i < n; i++, j += 4) o[i] = (77 * rgba[j] + 150 * rgba[j + 1] + 29 * rgba[j + 2]) >> 8; return o; };
TRK.pyramid = (gray, w, h) => {
  const L0 = level(w, h), raw = gray;
  // 3×3 gauss [1 2 1]
  const I = L0.I;
  for (let y = 0; y < h; y++) {
    const ru = (y > 0 ? y - 1 : 0) * w, r = y * w, rd = (y < h - 1 ? y + 1 : h - 1) * w;
    for (let x = 0; x < w; x++) {
      const xl = x > 0 ? x - 1 : 0, xr = x < w - 1 ? x + 1 : w - 1;
      I[r + x] = (raw[ru + xl] + 2 * raw[ru + x] + raw[ru + xr] + 2 * raw[r + xl] + 4 * raw[r + x] + 2 * raw[r + xr] + raw[rd + xl] + 2 * raw[rd + x] + raw[rd + xr]) / 16;
    }
  }
  grads(L0);
  const P = [L0]; for (let l = 1; l < LEVELS; l++) P.push(down(P[l - 1]));
  return P;
};

// bilineární vzorek
function bil(A, w, h, x, y) {
  if (x < 0) x = 0; else if (x > w - 1.001) x = w - 1.001;
  if (y < 0) y = 0; else if (y > h - 1.001) y = h - 1.001;
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return (A[i] * (1 - fx) + A[i + 1] * fx) * (1 - fy) + (A[i + w] * (1 - fx) + A[i + w + 1] * fx) * fy;
}

// ---------- pyramidový Lucas–Kanade pro jeden bod ----------
const WN = (2 * R + 1) * (2 * R + 1);
const tI = new Float32Array(WN), tX = new Float32Array(WN), tY = new Float32Array(WN);
function lk(P, Q, px, py, out) {
  let vx = 0, vy = 0;
  for (let l = LEVELS - 1; l >= 0; l--) {
    const A = P[l], B = Q[l], s = 1 / (1 << l), x = px * s, y = py * s, w = A.w, h = A.h;
    if (x < 1 || y < 1 || x > w - 2 || y > h - 2) { vx *= 2; vy *= 2; if (l === 0) return false; continue; }
    let gxx = 0, gxy = 0, gyy = 0, k = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) {
      const a = bil(A.I, w, h, x + i, y + j), dx = bil(A.gx, w, h, x + i, y + j), dy = bil(A.gy, w, h, x + i, y + j);
      tI[k] = a; tX[k] = dx; tY[k] = dy; gxx += dx * dx; gxy += dx * dy; gyy += dy * dy;
    }
    const det = gxx * gyy - gxy * gxy;
    if (det < 1e-3 * WN * WN) { if (l === 0) return false; vx *= 2; vy *= 2; continue; }   // plocha bez textury
    for (let it = 0; it < 20; it++) {
      let bx = 0, by = 0; k = 0;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) {
        const d = tI[k] - bil(B.I, w, h, x + i + vx, y + j + vy);
        bx += d * tX[k]; by += d * tY[k];
      }
      const ex = (gyy * bx - gxy * by) / det, ey = (gxx * by - gxy * bx) / det;
      vx += ex; vy += ey;
      if (ex * ex + ey * ey < 1e-4) break;
    }
    if (l > 0) { vx *= 2; vy *= 2; }
  }
  if (!isFinite(vx) || !isFinite(vy)) return false;
  out[0] = px + vx; out[1] = py + vy; return true;
}
// podobnost malých výřezů (NCC) kolem bodu v obou snímcích
function nccPt(A, B, ax, ay, bx, by) {
  const r = 4; let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const a = bil(A.I, A.w, A.h, ax + i, ay + j), b = bil(B.I, B.w, B.h, bx + i, by + j);
    sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
  }
  const va = saa - sa * sa / n, vb = sbb - sb * sb / n;
  return va > 1e-6 && vb > 1e-6 ? (sab - sa * sb / n) / Math.sqrt(va * vb) : 0;
}
const med = a => { if (!a.length) return 0; const b = Float64Array.from(a).sort(); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

// ---------- šablona vzhledu (proti ujíždění) ----------
const TS = 24;
function patch(L, cx, cy, w, h, out) {
  const o = out || new Float32Array(TS * TS); let s = 0, ss = 0;
  for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) {
    const v = bil(L.I, L.w, L.h, cx + ((i + 0.5) / TS - 0.5) * w, cy + ((j + 0.5) / TS - 0.5) * h);
    o[j * TS + i] = v; s += v; ss += v * v;
  }
  const n = TS * TS, m = s / n, sd = Math.sqrt(Math.max(1e-6, ss / n - m * m));
  for (let k = 0; k < n; k++) o[k] = (o[k] - m) / sd;
  return o;
}
const tmpP = new Float32Array(TS * TS);
function nccT(T, L, cx, cy, w, h) { const p = patch(L, cx, cy, w, h, tmpP); let s = 0; for (let k = 0; k < p.length; k++) s += p[k] * T[k]; return s / p.length; }

// ---------- jeden krok sledování (předchozí → další snímek) ----------
// stav: {cx, cy, w, h} v pixelech pracovního rozlišení; T0 = šablona z prvního snímku, Ta = průběžná
TRK.step = (st, P, Q) => {
  const L0 = P[0];
  const pts = [], m = 0.08;
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++)
    pts.push([st.cx + ((i + 0.5) / NG - 0.5) * st.w * (1 - m), st.cy + ((j + 0.5) / NG - 0.5) * st.h * (1 - m)]);
  const f = [0, 0], b = [0, 0], good = [];
  for (const p of pts) {
    if (!lk(P, Q, p[0], p[1], f)) continue;
    if (!lk(Q, P, f[0], f[1], b)) continue;
    const fb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    good.push({ p, q: [f[0], f[1]], fb, ncc: nccPt(P[0], Q[0], p[0], p[1], f[0], f[1]) });
  }
  if (good.length < 6) return null;
  const mfb = med(good.map(x => x.fb)), mn = med(good.map(x => x.ncc));
  let G = good.filter(x => x.fb <= mfb && x.ncc >= mn);
  if (G.length < 4) G = good.filter(x => x.fb <= mfb);
  if (G.length < 4 || mfb > Math.max(3, st.w * 0.12)) return null;
  const dx = med(G.map(x => x.q[0] - x.p[0])), dy = med(G.map(x => x.q[1] - x.p[1]));
  // změna velikosti z poměrů vzdáleností dvojic bodů
  const rs = [];
  for (let a = 0; a < G.length; a++) for (let c = a + 1; c < G.length; c += 1 + (G.length > 30 ? 2 : 0)) {
    const d0 = Math.hypot(G[a].p[0] - G[c].p[0], G[a].p[1] - G[c].p[1]);
    if (d0 > st.w * 0.15) rs.push(Math.hypot(G[a].q[0] - G[c].q[0], G[a].q[1] - G[c].q[1]) / d0);
  }
  let sc = rs.length ? med(rs) : 1; sc = Math.min(1.12, Math.max(0.89, sc));
  const n = { cx: st.cx + dx, cy: st.cy + dy, w: st.w * sc, h: st.h * sc, conf: Math.max(0, Math.min(1, 1 - mfb / 4)) * Math.min(1, G.length / 25) };
  // jemná korekce podle vzhledu (jen když šablona sedí lépe než odhad z pohybu)
  const Lq = Q[0], step = Math.max(0.5, n.w / TS * 0.5);
  const ncc0 = Math.max(nccT(st.T0, Lq, n.cx, n.cy, n.w, n.h), nccT(st.Ta, Lq, n.cx, n.cy, n.w, n.h));
  let best = ncc0, bx = n.cx, by = n.cy;
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
    if (!i && !j) continue;
    const x = n.cx + i * step, y = n.cy + j * step;
    const v = Math.max(nccT(st.T0, Lq, x, y, n.w, n.h), nccT(st.Ta, Lq, x, y, n.w, n.h));
    if (v > best) { best = v; bx = x; by = y; }
  }
  if (best > 0.7 && best > ncc0 + 0.03) { n.cx += (bx - n.cx) * 0.35; n.cy += (by - n.cy) * 0.35; }
  // velikost: ověřit podle vzhledu (median flow má sklon velikost pomalu „nafukovat“)
  let bs = 1, bv = best;
  for (const k of [0.95, 1.05]) { const v = Math.max(nccT(st.T0, Lq, n.cx, n.cy, n.w * k, n.h * k), nccT(st.Ta, Lq, n.cx, n.cy, n.w * k, n.h * k)); if (v > bv + 0.01) { bv = v; bs = k; } }
  if (bs !== 1 && bv > 0.6) { const k = 1 + (bs - 1) * 0.35; n.w *= k; n.h *= k; }
  n.ncc = best;
  return n;
};
// objekt ztracený → hledat ho v širším okolí podle šablon
TRK.recover = (st, Q) => {
  const L = Q[0]; let best = -1, B = null;
  for (const sc of [0.92, 1, 1.08]) {
    const w = st.w * sc, h = st.h * sc, span = Math.max(w, h) * 0.6, stp = Math.max(1, w / 12);
    for (let y = st.cy - span; y <= st.cy + span; y += stp) for (let x = st.cx - span; x <= st.cx + span; x += stp) {
      const v = Math.max(nccT(st.T0, L, x, y, w, h), nccT(st.Ta, L, x, y, w, h));
      if (v > best) { best = v; B = { cx: x, cy: y, w, h }; }
    }
  }
  return best > 0.8 ? { ...B, conf: 0.4, ncc: best } : null;
};
TRK.init = (box, P) => ({ ...box, T0: patch(P[0], box.cx, box.cy, box.w, box.h), Ta: patch(P[0], box.cx, box.cy, box.w, box.h) });
TRK.adapt = (st, Q) => { if ((st.ncc || 0) < 0.6) return; const p = patch(Q[0], st.cx, st.cy, st.w, st.h, tmpP); for (let k = 0; k < p.length; k++) st.Ta[k] = st.Ta[k] * 0.92 + p[k] * 0.08; };

// ---------- čtení snímků videa ----------
// zdroj: rychlé sekvenční dekódování (MP4/MOV), jinak přetáčení <video>
TRK.frames = async function* (o) {
  const { file, video, t0, t1, fps, W, H } = o;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  let src = null; TRK.mode = 'decode';
  if (g.openFrameSource && file) { try { src = await g.openFrameSource(file, video.videoWidth, video.videoHeight); } catch (e) { src = null; } }
  let tStart = t0;
  try {
    if (src && src.times && src.times.length) {
      const T = src.times, min = 1 / fps - 0.004; let last = -1e9, n = 0;
      try {
        for (let i = 0; i < T.length; i++) {
          const t = T[i]; if (t < t0 - 1e-3) continue; if (t > t1 + 1e-3) break;
          if (t - last < min) continue; last = t;
          const fr = await src.frameAt(t + 0.0005); if (!fr) continue;
          src.draw(x, fr, W, H);
          const data = TRK.gray(x.getImageData(0, 0, W, H).data);
          // první snímek prázdný (dekodér nedal obraz) → raději přetáčení videa
          if (!n) { let mn = 255, mx = 0; for (let k = 0; k < data.length; k += 97) { if (data[k] < mn) mn = data[k]; if (data[k] > mx) mx = data[k]; } if (mx - mn < 8) throw new Error('prázdný snímek'); }
          n++; tStart = t + 1 / fps;
          yield { t, data, canvas: c };
        }
      } catch (e) { if (n) throw e; console.warn('Rychlé čtení snímků nejde, použiji přetáčení', e); src.close(); src = null; }
    }
    if (!src) {
      const v = video;
      TRK.mode = 'seek';
      // iPhone: video, které se nikdy nespustilo, nedává při přetáčení obraz → krátce spustit a zastavit
      try { v.muted = true; await v.play(); v.pause(); } catch (e) {}
      for (let t = tStart; t <= t1 + 1e-4; t += 1 / fps) {
        await new Promise(r => { const d = () => { v.removeEventListener('seeked', d); r(); }; v.addEventListener('seeked', d); v.currentTime = Math.min(t, (v.duration || t) - 0.01); setTimeout(d, 3000); });
        x.drawImage(v, 0, 0, W, H);
        yield { t, data: TRK.gray(x.getImageData(0, 0, W, H).data), canvas: c };
      }
    }
  } finally { if (src) try { src.close(); } catch (e) {} }
};

// ---------- střih ve videu (úplně jiný obraz) ----------
TRK.isCut = (a, b) => { let s = 0, n = 0; for (let i = 0; i < a.length; i += 7) { s += Math.abs(a[i] - b[i]); n++; } return s / n > 30; };
// ---------- celé sledování ----------
// box = rámeček v normalizovaných souřadnicích snímku {cx, cy, w, h} (0..1) v čase t0
// vrací {t:[...], x:[...], y:[...], s:[...]} (normalizované, s = velikost vůči začátku)
TRK.run = async (o) => {
  const { video, file, t0, box, onP, cancel } = o;
  const dur = video.duration || 0, ar = (video.videoWidth || 9) / (video.videoHeight || 16);
  const long = 640, W = Math.round(ar >= 1 ? long : long * ar) & ~1, H = Math.round(ar >= 1 ? long / ar : long) & ~1;
  const fps = 30, back = Math.min(t0, o.back != null ? o.back : 8), tEnd = Math.min(dur, o.t1 != null ? o.t1 : dur);
  const toPx = b => ({ cx: b.cx * W, cy: b.cy * H, w: Math.max(12, b.w * W), h: Math.max(12, b.h * H) });
  const res = []; TRK.why = '';
  const total = (tEnd - (t0 - back)) || 1;
  let lastYield = performance.now();
  const breathe = async () => { if (performance.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); } };
  // 1) snímky před bodem (pro sledování zpátky) se uloží, od bodu dál se sleduje rovnou
  const stored = []; let st = null, prev = null, w0 = 0, lost = 0, lastG = null, firstG = null;
  for await (const fr of TRK.frames({ file, video, t0: t0 - back, t1: tEnd, fps, W, H })) {
    if (cancel && cancel()) break;
    onP && onP((fr.t - (t0 - back)) / total);
    if (fr.t < t0 - 0.02) { stored.push(fr); continue; }
    if (st && lastG && TRK.isCut(lastG, fr.data)) { TRK.why = 'střih ' + fr.t.toFixed(2); break; }   // střih → dál už je jiný záběr
    lastG = fr.data;
    const Q = TRK.pyramid(fr.data, W, H);
    if (!st) {
      // prázdný (černý / jednobarevný) snímek = video se nepodařilo přečíst
      let mn = 255, mx = 0; for (let i = 0; i < fr.data.length; i += 97) { const v = fr.data[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
      if (mx - mn < 8) { TRK.why = 'prázdný obraz'; return null; }
      firstG = fr.data; st = TRK.init(toPx(box), Q); w0 = st.w; res.push({ t: fr.t, cx: st.cx, cy: st.cy, w: st.w, c: 1 }); prev = Q; st.Pfirst = Q; continue; }
    let n = TRK.step(st, prev, Q);
    if (!n) n = TRK.recover(st, Q);
    if (!n) { if (++lost > 8) { TRK.why = 'ztraceno ' + fr.t.toFixed(2); break; } prev = Q; continue; }   // ztraceno → pár snímků zkusit znovu, pak konec
    lost = 0; Object.assign(st, n); TRK.adapt(st, Q);
    res.push({ t: fr.t, cx: st.cx, cy: st.cy, w: st.w, c: n.conf });
    // živý náhled: aktuální snímek + kde je objekt
    if (o.onFrame && fr.canvas && res.length % 2 === 0) o.onFrame(fr.canvas, { cx: st.cx / W, cy: st.cy / H, w: st.w / W, h: st.h / H });
    prev = Q; await breathe();
  }
  // 2) zpátky od bodu (snímky před ním)
  if (st && stored.length && !(cancel && cancel())) {
    const P0 = st.Pfirst; let s2 = TRK.init(toPx(box), P0), pv = P0; lost = 0;
    const bk = [];
    for (let i = stored.length - 1; i >= 0; i--) {
      if (cancel && cancel()) break;
      if (TRK.isCut(i + 1 < stored.length ? stored[i + 1].data : firstG, stored[i].data)) break;
      const Q = TRK.pyramid(stored[i].data, W, H); if (i + 2 < stored.length) stored[i + 2].data = null;
      let n = TRK.step(s2, pv, Q); if (!n) n = TRK.recover(s2, Q);
      if (!n) { if (++lost > 8) break; pv = Q; continue; }
      lost = 0; Object.assign(s2, n); TRK.adapt(s2, Q);
      bk.push({ t: stored[i].t, cx: s2.cx, cy: s2.cy, w: s2.w, c: n.conf });
      pv = Q; await breathe();
    }
    res.unshift(...bk.reverse());
  }
  stored.length = 0;
  if (!st || res.length < 2) return null;
  return { t: res.map(r => r.t), x: res.map(r => r.cx / W), y: res.map(r => r.cy / H), s: res.map(r => r.w / w0), c: res.map(r => r.c), t0 };
};

// ---------- vyhlazení (bez zpoždění) ----------
// 1) odlehlé hodnoty pryč (Hampel), 2) lokální kvadratická regrese s gaussovskou váhou, vyhodnocená na rovnoměrné mřížce
function hampel(t, v) {
  const out = v.slice(), k = 5;
  for (let i = 0; i < v.length; i++) {
    const a = Math.max(0, i - k), b = Math.min(v.length, i + k + 1), win = v.slice(a, b), m = med(win), mad = med(win.map(x => Math.abs(x - m))) * 1.4826;
    if (Math.abs(v[i] - m) > Math.max(3 * mad, 0.004)) out[i] = m;
  }
  return out;
}
function loess(t, v, w, tt, sig) {
  const out = new Float32Array(tt.length); let lo = 0;
  for (let q = 0; q < tt.length; q++) {
    const T = tt[q];
    while (lo < t.length && t[lo] < T - 3 * sig) lo++;
    let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, y0 = 0, y1 = 0, y2 = 0;
    for (let i = lo; i < t.length && t[i] <= T + 3 * sig; i++) {
      const d = t[i] - T, u = d / sig, ww = Math.exp(-0.5 * u * u) * (w ? 0.25 + 0.75 * w[i] : 1);
      const d2 = d * d; s0 += ww; s1 += ww * d; s2 += ww * d2; s3 += ww * d2 * d; s4 += ww * d2 * d2;
      y0 += ww * v[i]; y1 += ww * v[i] * d; y2 += ww * v[i] * d2;
    }
    // řešení 3×3 (a + b·d + c·d²), hodnota = a
    const M = [[s0, s1, s2], [s1, s2, s3], [s2, s3, s4]], Y = [y0, y1, y2];
    const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    if (Math.abs(det) < 1e-12) { out[q] = s0 > 0 ? y0 / s0 : (q ? out[q - 1] : v[0]); continue; }
    out[q] = (Y[0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (Y[1] * M[2][2] - M[1][2] * Y[2]) + M[0][2] * (Y[1] * M[2][1] - M[1][1] * Y[2])) / det;
  }
  return out;
}
// smooth 0..100 → šířka vyhlazení 0,03–0,45 s
TRK.sigma = sm => 0.03 + Math.pow((sm == null ? 55 : sm) / 100, 1.5) * 0.42;
TRK.smooth = (tr, sm) => {
  const sig = TRK.sigma(sm), dt = 1 / 60, ta = tr.t[0], tb = tr.t[tr.t.length - 1];
  const n = Math.max(2, Math.round((tb - ta) / dt) + 1), tt = new Float32Array(n); for (let i = 0; i < n; i++) tt[i] = ta + i * dt;
  const x = hampel(tr.t, tr.x), y = hampel(tr.t, tr.y), ls = hampel(tr.t, tr.s.map(Math.log));
  const sx = loess(tr.t, x, tr.c, tt, sig), sy = loess(tr.t, y, tr.c, tt, sig), ss = loess(tr.t, ls, tr.c, tt, sig * 1.6);
  for (let i = 0; i < n; i++) ss[i] = Math.exp(ss[i]);
  return { ta, dt, n, x: sx, y: sy, s: ss };
};
// poloha v čase (Catmull–Rom mezi vzorky, mimo rozsah drží krajní hodnotu)
TRK.at = (S, t) => {
  if (!S || !S.n) return null;
  let f = (t - S.ta) / S.dt; if (f <= 0) return { x: S.x[0], y: S.y[0], s: S.s[0] }; if (f >= S.n - 1) { const k = S.n - 1; return { x: S.x[k], y: S.y[k], s: S.s[k] }; }
  const i = Math.floor(f), u = f - i, i0 = Math.max(0, i - 1), i2 = Math.min(S.n - 1, i + 1), i3 = Math.min(S.n - 1, i + 2);
  const cr = A => { const p0 = A[i0], p1 = A[i], p2 = A[i2], p3 = A[i3]; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u); };
  return { x: cr(S.x), y: cr(S.y), s: cr(S.s) };
};

// ================= SLEDOVÁNÍ TVARU (afinní: posun, natočení, zvětšení, zkosení) =================
// pro zvýrazněné objekty – např. pozemek při průletu dronem. Body uvnitř objektu se sledují snímek po snímku,
// z jejich polohy vůči výchozímu snímku se robustně (RANSAC) spočítá afinní transformace; ztracené body se doplňují.
function goodFeatures(L, inside, maxN, minD) {
  const { w, h, gx, gy } = L, cand = [];
  for (let y = 3; y < h - 3; y += 2) for (let x = 3; x < w - 3; x += 2) {
    if (!inside(x, y)) continue;
    let a = 0, b = 0, c = 0;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const k = (y + j) * w + x + i, X = gx[k], Y = gy[k]; a += X * X; b += X * Y; c += Y * Y; }
    const tr = a + c, det = a * c - b * b, ev = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
    if (ev > 30) cand.push([ev, x, y]);
  }
  cand.sort((p, q) => q[0] - p[0]);
  const out = [], md2 = minD * minD;
  for (const [, x, y] of cand) { if (out.length >= maxN) break; if (out.every(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 >= md2)) out.push([x, y]); }
  return out;
}
function fitAffine(P, Q) {   // nejmenší čtverce: Q ≈ A·P   (A = [a,b,c,d,e,f] ve tvaru DOMMatrix: x'=a·x+c·y+e, y'=b·x+d·y+f)
  let sxx = 0, sxy = 0, syy = 0, sx = 0, sy = 0, n = P.length, ux = [0, 0, 0], uy = [0, 0, 0];
  for (let i = 0; i < n; i++) { const [x, y] = P[i], [X, Y] = Q[i]; sxx += x * x; sxy += x * y; syy += y * y; sx += x; sy += y; ux[0] += x * X; ux[1] += y * X; ux[2] += X; uy[0] += x * Y; uy[1] += y * Y; uy[2] += Y; }
  const M = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]];
  const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  if (Math.abs(det) < 1e-9) return null;
  const sol = Y => { const r = []; for (let k = 0; k < 3; k++) { const C = M.map(r2 => r2.slice()); for (let j = 0; j < 3; j++) C[j][k] = Y[j];
    r.push((C[0][0] * (C[1][1] * C[2][2] - C[1][2] * C[2][1]) - C[0][1] * (C[1][0] * C[2][2] - C[1][2] * C[2][0]) + C[0][2] * (C[1][0] * C[2][1] - C[1][1] * C[2][0])) / det); } return r; };
  const [a, c, e] = sol(ux), [b, d, f] = sol(uy);
  return [a, b, c, d, e, f];
}
const apply = (A, x, y) => [A[0] * x + A[2] * y + A[4], A[1] * x + A[3] * y + A[5]];
const invA = A => { const det = A[0] * A[3] - A[1] * A[2]; if (Math.abs(det) < 1e-9) return null; const a = A[3] / det, b = -A[1] / det, c = -A[2] / det, d = A[0] / det; return [a, b, c, d, -(a * A[4] + c * A[5]), -(b * A[4] + d * A[5])]; };
function ransac(P, Q) {
  const n = P.length; if (n < 4) return null;
  let best = null, bestIn = null;
  for (let it = 0; it < 120; it++) {
    const i = (Math.random() * n) | 0, j = (Math.random() * n) | 0, k = (Math.random() * n) | 0; if (i === j || j === k || i === k) continue;
    const A = fitAffine([P[i], P[j], P[k]], [Q[i], Q[j], Q[k]]); if (!A) continue;
    const ins = []; for (let m = 0; m < n; m++) { const r = apply(A, P[m][0], P[m][1]); if ((r[0] - Q[m][0]) ** 2 + (r[1] - Q[m][1]) ** 2 < 4) ins.push(m); }
    if (!bestIn || ins.length > bestIn.length) { bestIn = ins; best = A; if (ins.length > n * 0.9) break; }
  }
  if (!bestIn || bestIn.length < Math.max(4, n * 0.3)) return null;
  const A = fitAffine(bestIn.map(m => P[m]), bestIn.map(m => Q[m])) || best;
  return { A, inl: new Set(bestIn) };
}
// mask = {w,h,d} (výběr ve výchozím snímku), vrací {t:[], A:[[6]...], c:[]} – A v normalizovaných souřadnicích
TRK.runAffine = async (o) => {
  const { video, file, t0, mask, onP, cancel } = o;
  const dur = video.duration || 0, ar = (video.videoWidth || 9) / (video.videoHeight || 16);
  const long = 640, W = Math.round(ar >= 1 ? long : long * ar) & ~1, H = Math.round(ar >= 1 ? long / ar : long) & ~1;
  const fps = 30, back = Math.min(t0, o.back != null ? o.back : 6), tEnd = Math.min(dur, o.t1 != null ? o.t1 : dur);
  // je bod (pracovní px, výchozí snímek) uvnitř objektu? (s malou rezervou kolem okraje – hrany jsou nejlepší body)
  const R = 3, inMask = (x, y) => { for (let j = -R; j <= R; j += R) for (let i = -R; i <= R; i += R) { const mx = Math.round((x + i) / W * mask.w), my = Math.round((y + j) / H * mask.h); if (mx >= 0 && my >= 0 && mx < mask.w && my < mask.h && mask.d[my * mask.w + mx]) return true; } return false; };
  const toN = A => [A[0], A[1] * W / H, A[2] * H / W, A[3], A[4] / W, A[5] / H];
  const total = (tEnd - (t0 - back)) || 1; TRK.why = '';
  let lastYield = performance.now();
  const breathe = async () => { if (performance.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); } };
  const track = (P0, frames, out) => {   // P0 = pyramida výchozího snímku, frames = iterátor {t, Q}
    return (async () => {
      let pts = goodFeatures(P0[0], inMask, 160, 7).map(p => ({ a: p, c: p })), n0 = Math.max(8, pts.length), prev = P0, A = [1, 0, 0, 1, 0, 0], lost = 0, lastG = null;
      if (pts.length < 6) { TRK.why = 'málo kresby v objektu'; return false; }
      const f = [0, 0], b = [0, 0];
      for await (const fr of frames) {
        if (cancel && cancel()) break;
        if (fr.cut) break;
        const Q = fr.Q; const keep = [];
        for (const p of pts) { if (!lk(prev, Q, p.c[0], p.c[1], f) || !lk(Q, prev, f[0], f[1], b)) continue; if (Math.hypot(b[0] - p.c[0], b[1] - p.c[1]) > 1.0) continue; keep.push({ a: p.a, c: [f[0], f[1]] }); }
        const r = ransac(keep.map(p => p.a), keep.map(p => p.c));
        if (!r) { if (++lost > 6) { TRK.why = 'ztraceno ' + fr.t.toFixed(2); break; } prev = Q; continue; }
        lost = 0; A = r.A; pts = keep.filter((_, i) => r.inl.has(i));
        // doplnit body, když jich ubylo (nové body se přepočítají zpět do výchozího snímku)
        if (pts.length < n0 * 0.55) {
          const iA = invA(A);
          if (iA) { const nw = goodFeatures(Q[0], (x, y) => { const q = apply(iA, x, y); return inMask(q[0], q[1]); }, 160, 7);
            for (const p of nw) { if (pts.length >= 160) break; if (pts.some(s => (s.c[0] - p[0]) ** 2 + (s.c[1] - p[1]) ** 2 < 36)) continue; pts.push({ a: apply(iA, p[0], p[1]), c: p }); } }
        }
        out.push({ t: fr.t, A: toN(A), c: Math.min(1, pts.length / n0) });
        prev = Q; await breathe();
      }
      return true;
    })();
  };
  // 1) dopředu (snímky před bodem se uloží pro zpětný průchod)
  const stored = []; let P0 = null, lastG = null, firstG = null; const fwd = [];
  const gen = TRK.frames({ file, video, t0: t0 - back, t1: tEnd, fps, W, H });
  const fwdFrames = (async function* () {
    for await (const fr of gen) {
      onP && onP((fr.t - (t0 - back)) / total);
      if (fr.t < t0 - 0.02) { stored.push({ t: fr.t, data: fr.data }); continue; }
      if (!P0) { P0 = TRK.pyramid(fr.data, W, H); firstG = lastG = fr.data; fwd.push({ t: fr.t, A: [1, 0, 0, 1, 0, 0], c: 1 }); continue; }
      const cut = TRK.isCut(lastG, fr.data); lastG = fr.data;
      if (o.onFrame && fr.canvas) o.onFrame(fr.canvas, fwd.length ? fwd[fwd.length - 1].A : null);
      yield { t: fr.t, Q: TRK.pyramid(fr.data, W, H), cut };
    }
  })();
  // první snímek je potřeba mít před spuštěním sledování
  const first = await fwdFrames.next();
  if (!P0) return null;
  const rest = (async function* () { if (!first.done) yield first.value; for await (const v of fwdFrames) yield v; })();
  await track(P0, rest, fwd);
  // 2) zpátky
  const bk = [];
  if (stored.length && !(cancel && cancel())) {
    const bFrames = (async function* () { let lg = firstG; for (let i = stored.length - 1; i >= 0; i--) { const d = stored[i].data; const cut = TRK.isCut(lg, d); lg = d; yield { t: stored[i].t, Q: TRK.pyramid(d, W, H), cut }; stored[i].data = null; } })();
    await track(P0, bFrames, bk);
  }
  const all = bk.reverse().concat(fwd);
  if (all.length < 2) return null;
  return { t: all.map(r => r.t), A: all.map(r => r.A), c: all.map(r => r.c), t0 };
};
// ================= PERSPEKTIVNÍ (PLANÁRNÍ) SLEDOVÁNÍ – jako planar tracker v After Effects / Mocha =================
// Pro domy, pozemky, okna, místnosti: body v objektu a kolem jeho hran se sledují snímek po snímku (všechny snímky videa),
// každý bod se navíc zpřesní přímo proti „klíčovému“ snímku (žádné postupné ujíždění), z bodů se robustně spočítá
// perspektivní transformace (homografie, 8 stupňů volnosti) a rohy objektu se ještě dorovnají podle bodů v jejich okolí
// (u 3D objektů, kde rohy neleží v jedné rovině) a podle vlastního sledování rohu.
function lkG(P, Q, px, py, gx, gy, out, lmax) {   // LK s počátečním odhadem polohy (jen jemné úrovně pyramidy)
  const L1 = Math.min(LEVELS - 1, lmax == null ? 1 : lmax);
  let vx = (gx - px) / (1 << L1), vy = (gy - py) / (1 << L1);
  for (let l = L1; l >= 0; l--) {
    const A = P[l], B = Q[l], s = 1 / (1 << l), x = px * s, y = py * s, w = A.w, h = A.h;
    if (x < 1 || y < 1 || x > w - 2 || y > h - 2) return false;
    let gxx = 0, gxy = 0, gyy = 0, k = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) {
      const a = bil(A.I, w, h, x + i, y + j), dx = bil(A.gx, w, h, x + i, y + j), dy = bil(A.gy, w, h, x + i, y + j);
      tI[k] = a; tX[k] = dx; tY[k] = dy; gxx += dx * dx; gxy += dx * dy; gyy += dy * dy;
    }
    const det = gxx * gyy - gxy * gxy;
    if (det < 1e-3 * WN * WN) return false;
    for (let it = 0; it < 25; it++) {
      let bx = 0, by = 0; k = 0;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) { const d = tI[k] - bil(B.I, w, h, x + i + vx, y + j + vy); bx += d * tX[k]; by += d * tY[k]; }
      const ex = (gyy * bx - gxy * by) / det, ey = (gxx * by - gxy * bx) / det; vx += ex; vy += ey;
      if (ex * ex + ey * ey < 1e-5) break;
    }
    if (l > 0) { vx *= 2; vy *= 2; }
  }
  if (!isFinite(vx) || !isFinite(vy)) return false;
  out[0] = px + vx; out[1] = py + vy; return true;
}
// ---- homografie (3×3, řádkově, h[8] = 1) ----
const hApply = (H, x, y) => { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; };
const hMul = (A, B) => { const C = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return C; };
const hInv = H => { const [a, b, c, d, e, f, g, h, i] = H; const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C; if (Math.abs(det) < 1e-12) return null;
  const r = [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(v => v / det); return r.map(v => v / r[8]); };
const hNorm = H => H.map(v => v / H[8]);
function solveN(M, y, n) {   // Gauss s výběrem pivotu
  const A = M.map((r, i) => r.concat([y[i]]));
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < 1e-12) return null; [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; } }
  return A.map((r, i) => r[n] / r[i]);
}
function normT(P) { let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length; let d = 0; for (const p of P) d += Math.hypot(p[0] - cx, p[1] - cy); d = d / P.length || 1; const s = Math.SQRT2 / d; return [s, 0, -s * cx, 0, s, -s * cy, 0, 0, 1]; }
function fitH(P, Q, W) {   // DLT (normalizovaný, nejmenší čtverce, volitelné váhy)
  const n = P.length; if (n < 4) return null;
  const T1 = normT(P), T2 = normT(Q), M = Array.from({ length: 8 }, () => new Array(8).fill(0)), y = new Array(8).fill(0);
  for (let k = 0; k < n; k++) {
    const [x, yy] = hApply(T1, P[k][0], P[k][1]), [X, Y] = hApply(T2, Q[k][0], Q[k][1]), w = W ? W[k] : 1;
    const r1 = [x, yy, 1, 0, 0, 0, -X * x, -X * yy], r2 = [0, 0, 0, x, yy, 1, -Y * x, -Y * yy];
    for (let i = 0; i < 8; i++) { y[i] += w * (r1[i] * X + r2[i] * Y); for (let j = 0; j < 8; j++) M[i][j] += w * (r1[i] * r1[j] + r2[i] * r2[j]); }
  }
  const h = solveN(M, y, 8); if (!h) return null;
  const Hn = [...h, 1], iT2 = hInv(T2); if (!iT2) return null;
  return hNorm(hMul(iT2, hMul(Hn, T1)));
}
function ransacH(P, Q, th) {
  const n = P.length; if (n < 6) return null;
  const th2 = th * th; let best = null, bestIn = null, iters = 400;
  for (let it = 0; it < iters; it++) {
    const id = []; while (id.length < 4) { const r = (Math.random() * n) | 0; if (!id.includes(r)) id.push(r); }
    const S = id.map(i => P[i]);
    // degenerované čtveřice (skoro na přímce) přeskočit
    const ar = Math.abs((S[1][0] - S[0][0]) * (S[2][1] - S[0][1]) - (S[2][0] - S[0][0]) * (S[1][1] - S[0][1])) + Math.abs((S[3][0] - S[0][0]) * (S[2][1] - S[0][1]) - (S[2][0] - S[0][0]) * (S[3][1] - S[0][1]));
    if (ar < 4) continue;
    const H = fitH(S, id.map(i => Q[i])); if (!H) continue;
    const ins = []; for (let m = 0; m < n; m++) { const r = hApply(H, P[m][0], P[m][1]); if ((r[0] - Q[m][0]) ** 2 + (r[1] - Q[m][1]) ** 2 < th2) ins.push(m); }
    if (!bestIn || ins.length > bestIn.length) { bestIn = ins; best = H; const ratio = ins.length / n; if (ratio > 0.95) break; iters = Math.min(iters, Math.ceil(Math.log(0.002) / Math.log(1 - Math.pow(Math.max(0.05, ratio), 4))) + 10); }
  }
  if (!bestIn || bestIn.length < Math.max(6, n * 0.25)) return null;
  // zpřesnění: nejmenší čtverce na inlierech, 2× s užším prahem (Huberovy váhy)
  let H = fitH(bestIn.map(m => P[m]), bestIn.map(m => Q[m])) || best, inl = bestIn;
  for (let k = 0; k < 2; k++) {
    const ins = [], wts = []; for (let m = 0; m < n; m++) { const r = hApply(H, P[m][0], P[m][1]), e = Math.hypot(r[0] - Q[m][0], r[1] - Q[m][1]); if (e < th) { ins.push(m); wts.push(e < th * 0.4 ? 1 : th * 0.4 / e); } }
    if (ins.length < 6) break; const H2 = fitH(ins.map(m => P[m]), ins.map(m => Q[m]), wts); if (!H2) break; H = H2; inl = ins;
  }
  return { H, inl: new Set(inl) };
}
function irlsH(P, Q, H0, k, iters) {   // vážené zpřesnění od výchozího odhadu (Huber): všechny body, odlehlé slabě, velmi vzdálené vůbec
  let H = H0; for (let it = 0; it < (iters || 5); it++) {
    const ia = [], wts = []; for (let m = 0; m < P.length; m++) { const r = hApply(H, P[m][0], P[m][1]), e = Math.hypot(r[0] - Q[m][0], r[1] - Q[m][1]); if (e > k * 5) continue; ia.push(m); wts.push(e < k ? 1 : k / e); }
    if (ia.length < 8) return null; const H2 = fitH(ia.map(m => P[m]), ia.map(m => Q[m]), wts); if (!H2) return null; H = H2; }
  const inl = new Set(); for (let m = 0; m < P.length; m++) { const r = hApply(H, P[m][0], P[m][1]); if (Math.hypot(r[0] - Q[m][0], r[1] - Q[m][1]) < k * 2) inl.add(m); }
  return inl.size >= Math.max(8, P.length * 0.3) ? { H, inl } : null;
}
TRK.hApply = hApply; TRK.hInv = hInv; TRK.hMul = hMul; TRK.fitH = fitH;
// bod v mnohoúhelníku
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if (((a[1] > y) !== (b[1] > y)) && (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1] + 1e-12) + a[0])) c = !c; } return c; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy); };
const polyDist = (P, x, y) => { let d = 1e9; for (let i = 0; i < P.length; i++) d = Math.min(d, segDist([x, y], P[i], P[(i + 1) % P.length])); return d; };
// rohy z obrysu: zjednodušení na pár vrcholů + přichycení na skutečné rohy v obraze (Harrisova odezva)
TRK.cornersFrom = (gray, W, H, contour0, maxN) => {
  const P = TRK.pyramid(gray, W, H)[0], N = contour0.length; if (N < 4) return contour0.slice();
  // zubatý obrys (schodky z masky v nízkém rozlišení) vyhladit – rohy se pak počítají z průsečíků přímek, takže se nezaoblí
  const SW = 3, contour = contour0.map((_, i) => { let x = 0, y = 0; for (let k = -SW; k <= SW; k++) { const q = contour0[(i + k + N) % N]; x += q[0]; y += q[1]; } return [x / (2 * SW + 1), y / (2 * SW + 1)]; });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of contour) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const D = Math.hypot(x1 - x0, y1 - y0) || 1;
  // 1) málo vrcholů: tolerance roste, dokud jich není nejvýš maxN
  let eps = 0.02 * D, idx = rdpIdx(contour, eps);
  for (let k = 0; k < 14 && idx.length > (maxN || 10); k++) { eps *= 1.3; idx = rdpIdx(contour, eps); }
  // 2) každou hranu proložit přímkou (z bodů obrysu mezi vrcholy), roh = průsečík sousedních hran → ostrý přesný roh
  const n = idx.length, lines = [];
  for (let k = 0; k < n; k++) { const a = idx[k], b = idx[(k + 1) % n], seg = []; for (let i = a; ; i = (i + 1) % N) { seg.push(contour[i]); if (i === b || seg.length > N) break; }
    const core = seg.length > 6 ? seg.slice(Math.round(seg.length * 0.15), Math.round(seg.length * 0.85) + 1) : seg;   // konce hrany jsou zakulacené – nepoužít
    let mx = 0, my = 0; for (const p of core) { mx += p[0]; my += p[1]; } mx /= core.length; my /= core.length;
    let sxx = 0, sxy = 0, syy = 0; for (const p of core) { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), dx = Math.cos(ang), dy = Math.sin(ang);
    // rovná hrana? (odchylka bodů od přímky malá vůči délce) – okraj stromu / křoví rovný není
    let e2 = 0; for (const p of seg) { const q = (p[0] - mx) * -dy + (p[1] - my) * dx; e2 += q * q; } const rms = Math.sqrt(e2 / seg.length), len = Math.hypot(contour[b][0] - contour[a][0], contour[b][1] - contour[a][1]);
    lines.push({ mx, my, dx, dy, straight: rms < Math.max(0.9, len * 0.025) && len > D * 0.04, len }); }
  const out = [];
  let sl = 0, tl = 0; for (const L of lines) { tl += L.len; if (L.straight) sl += L.len; }
  // rohy z dlouhých rovných hran: krátké / křivé úseky mezi nimi se přeskočí; malá mezera = průsečík hran (ostrý roh),
  // velká křivá mezera (strom před domem) = konce hran (dům tam končí)
  const proj = (L, p) => { const t = (p[0] - L.mx) * L.dx + (p[1] - L.my) * L.dy; return [L.mx + L.dx * t, L.my + L.dy * t]; };
  const S = []; for (let k = 0; k < n; k++) if (lines[k].straight) S.push(k);
  if (S.length >= 2) {
    for (let a = 0; a < S.length; a++) {
      const i = S[a], j = S[(a + 1) % S.length], A = lines[i], B = lines[j];
      let gap = 0; for (let k = (i + 1) % n; k !== j; k = (k + 1) % n) gap += lines[k].len;
      const endA = proj(A, contour[idx[(i + 1) % n]]), startB = proj(B, contour[idx[j]]);
      const det = A.dx * B.dy - A.dy * B.dx;
      if (gap < D * 0.3 && Math.abs(det) > Math.sin(15 * Math.PI / 180)) {
        // průsečík hran: hrana přerušená výstupkem (schody) nebo zakulacený roh → jeden ostrý roh
        const t = ((B.mx - A.mx) * B.dy - (B.my - A.my) * B.dx) / det, q = [A.mx + A.dx * t, A.my + A.dy * t];
        const dA = Math.hypot(q[0] - endA[0], q[1] - endA[1]), dB = Math.hypot(q[0] - startB[0], q[1] - startB[1]);
        if ((gap < D * 0.12 && dA < D * 0.12) || Math.min(dA, dB) < D * 0.06) { out.push(q); continue; }
      }
      const off = Math.abs((startB[0] - A.mx) * -A.dy + (startB[1] - A.my) * A.dx);   // jak daleko je další hrana od přímky této hrany
      if (Math.abs(det) <= Math.sin(15 * Math.PI / 180) && gap < D * 0.35 && off < D * 0.03) continue;   // jedna hrana přerušená výstupkem (schody, okap) – bez rohu
      out.push(endA); out.push(startB);
    }
  }
  if (out.length < 3) { const r = idx.map(i => contour[i]); r.straight = 0; return r; }
  // 3) jemné přichycení na skutečný roh v obraze (jen blízko a jen výrazný roh)
  const R0 = Math.max(2, Math.hypot(W, H) * 0.006);
  const res = out.map(([x0, y0]) => { let best = -1, bx = x0, by = y0;
    for (let y = Math.max(3, Math.round(y0 - R0)); y <= Math.min(H - 4, Math.round(y0 + R0)); y++) for (let x = Math.max(3, Math.round(x0 - R0)); x <= Math.min(W - 4, Math.round(x0 + R0)); x++) {
      let a = 0, b = 0, c = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const q = (y + j) * W + x + i, X = P.gx[q], Y = P.gy[q]; a += X * X; b += X * Y; c += Y * Y; }
      const tr = a + c, ev = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - (a * c - b * b))), sc = ev * (1 - 0.7 * Math.hypot(x - x0, y - y0) / R0);
      if (sc > best) { best = sc; bx = x; by = y; } }
    return best > 400 ? [bx, by] : [x0, y0]; });
  res.straight = tl ? sl / tl : 0;   // podíl rovných hran (dům, okno, pozemek ≈ 1; gauč, strom ≈ 0)
  return res;
};
// DOLADĚNÍ HRAN: každá hrana mnohoúhelníku se přitáhne na skutečnou VNĚJŠÍ hranu objektu v obraze (plné rozlišení):
// podél hrany se v kolmém směru hledá nejvzdálenější výrazný přechod jasu (obrys domu proti trávě / nebi), přímka se
// robustně proloží a rohy se spočítají jako průsečíky upravených hran. Výběr, který kus objektu nechal venku
// (pruh boční stěny, okraj střechy) nebo je zubatý, tak sedne přesně na hranu.
TRK.refineEdges = (rgba, W, H, poly, band) => {
  const n = poly.length; if (n < 3) return poly;
  const Ch = [0, 1, 2].map(c => { const A = new Float32Array(W * H); for (let i = 0; i < W * H; i++) A[i] = rgba[i * 4 + c]; return A; });
  const cd = (x1, y1, x2, y2) => { let s = 0; for (const A of Ch) { const d = bil(A, W, H, x1, y1) - bil(A, W, H, x2, y2); s += d * d; } return Math.sqrt(s); };
  let area = 0; for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sg = area > 0 ? 1 : -1, L = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    const tx = dx / len, ty = dy / len, nx = ty * sg, ny = -tx * sg;   // normála ven z objektu
    const pts = [], K = Math.max(8, Math.min(60, Math.round(len / 4)));
    for (let k = 1; k < K; k++) { const u = 0.12 + 0.76 * k / K, px = a[0] + dx * u, py = a[1] + dy * u;
      const R = []; let mx = 0;
      for (let s = -band; s <= band; s += 0.5) { const g = cd(px + (s + 1) * nx, py + (s + 1) * ny, px + (s - 1) * nx, py + (s - 1) * ny); R.push([s, g]); if (g > mx) mx = g; }
      if (mx < 12) continue;
      // nejvzdálenější výrazný přechod ven (lokální maximum ≥ 55 % nejsilnějšího)
      let best = null; for (let j = 1; j < R.length - 1; j++) { const [s, g] = R[j]; if (g >= mx * 0.55 && g >= R[j - 1][1] && g >= R[j + 1][1]) best = s; }
      if (best != null) pts.push([px + best * nx, py + best * ny]); }
    if (pts.length < 4) { L.push(null); continue; }
    // robustní přímka: 2× proložit a vyhodit body daleko od přímky
    let use = pts, line = null;
    for (let it = 0; it < 3; it++) { let mx = 0, my = 0; for (const p of use) { mx += p[0]; my += p[1]; } mx /= use.length; my /= use.length;
      let sxx = 0, sxy = 0, syy = 0; for (const p of use) { const ex = p[0] - mx, ey = p[1] - my; sxx += ex * ex; sxy += ex * ey; syy += ey * ey; }
      const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy); line = { mx, my, dx: Math.cos(ang), dy: Math.sin(ang) };
      const d = use.map(p => Math.abs((p[0] - mx) * -line.dy + (p[1] - my) * line.dx)), md = d.slice().sort((x, y) => x - y)[d.length >> 1];
      const nu = use.filter((p, k) => d[k] <= Math.max(0.8, md * 2.5)); if (nu.length < 5 || nu.length === use.length) break; use = nu; }
    // nová přímka musí být skoro rovnoběžná s původní hranou
    // posun hrany ven/dovnitř = medián nalezených posunů; sklon z přímky jen když je spolehlivý (dost bodů, skoro rovnoběžná), jinak původní
    const offs = use.map(p => (p[0] - a[0]) * nx + (p[1] - a[1]) * ny).sort((x, y) => x - y), off = offs[offs.length >> 1];
    if (!(use.length >= 10 && Math.abs(line.dx * tx + line.dy * ty) > Math.cos(4 * Math.PI / 180))) line = { mx: a[0] + nx * off + dx / 2, my: a[1] + ny * off + dy / 2, dx: tx, dy: ty };
    L.push(line);
  }
  return poly.map((v, i) => { const A = L[(i - 1 + n) % n], B = L[i]; if (!A || !B) return v;
    const det = A.dx * B.dy - A.dy * B.dx; if (Math.abs(det) < Math.sin(12 * Math.PI / 180)) return v;
    const t = ((B.mx - A.mx) * B.dy - (B.my - A.my) * B.dx) / det, q = [A.mx + A.dx * t, A.my + A.dy * t];
    return Math.hypot(q[0] - v[0], q[1] - v[1]) < band * 2.2 ? q : v; });
};
function rdpIdx(P, eps) {   // uzavřený obrys → indexy vrcholů
  const N = P.length; let i1 = 0, md = -1; for (let i = 0; i < N; i++) { const d = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (d > md) { md = d; i1 = i; } }
  const rec = (a, b, out) => { const pa = P[a], pb = P[b % N]; let mi = -1, mdd = 0; for (let i = a + 1; i < b; i++) { const d = segDist(P[i % N], pa, pb); if (d > mdd) { mdd = d; mi = i; } } if (mi >= 0 && mdd > eps) { rec(a, mi, out); out.push(mi % N); rec(mi, b, out); } };
  const out = [0]; rec(0, i1, out); out.push(i1); rec(i1, N, out); return out;
}
function rdpC(P, eps) {   // uzavřený obrys → vrcholy
  if (P.length < 4) return P.slice();
  let i0 = 0, i1 = 0, md = -1; for (let i = 0; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]); if (d > md) { md = d; i1 = i; } }
  const half = (a, b) => { const S = a <= b ? P.slice(a, b + 1) : P.slice(a).concat(P.slice(0, b + 1)); return rdpO(S, eps); };
  const A = half(i0, i1), B = half(i1, i0); return A.slice(0, -1).concat(B.slice(0, -1));
}
function rdpO(P, eps) { if (P.length < 3) return P; const a = P[0], b = P[P.length - 1]; let mi = 0, md = 0; for (let i = 1; i < P.length - 1; i++) { const d = segDist(P[i], a, b); if (d > md) { md = d; mi = i; } }
  if (md > eps) { const l = rdpO(P.slice(0, mi + 1), eps), r = rdpO(P.slice(mi), eps); return l.slice(0, -1).concat(r); } return [a, b]; }

// zpřesnění bodu přímo proti VÝCHOZÍMU snímku: okolí bodu z výchozího snímku se přepočítá do aktuální perspektivy (iH),
// pak se v aktuálním snímku najde jeho přesná poloha (LK s kompenzací jasu). Tím se chyby nesčítají – žádné ujíždění.
const wT = new Float32Array(WN);
function warpLK(P0, Q, iH, cx, cy, out, minNcc) {
  let x = cx, y = cy;
  for (let l = 1; l >= 0; l--) {
    const A = P0[l], B = Q[l], s = 1 / (1 << l), w = B.w, h = B.h;
    let px = x * s, py = y * s; if (px < R + 1 || py < R + 1 || px > w - R - 2 || py > h - R - 2) return false;
    // šablona: pixel u kolem bodu v aktuálním snímku ↔ iH(u) ve výchozím snímku
    let k = 0, mT = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) { const z = hApply(iH, (px + i) / s, (py + j) / s); const v = bil(A.I, A.w, A.h, z[0] * s, z[1] * s); wT[k] = v; mT += v; }
    mT /= WN; for (k = 0; k < WN; k++) wT[k] -= mT;
    let vx = 0, vy = 0;
    for (let it = 0; it < 15; it++) {
      let gxx = 0, gxy = 0, gyy = 0, bx = 0, by = 0, mB = 0; k = 0;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) mB += bil(B.I, w, h, px + i + vx, py + j + vy);
      mB /= WN; k = 0;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) {
        const X = px + i + vx, Y = py + j + vy, dx = bil(B.gx, w, h, X, Y), dy = bil(B.gy, w, h, X, Y), d = wT[k] - (bil(B.I, w, h, X, Y) - mB);
        gxx += dx * dx; gxy += dx * dy; gyy += dy * dy; bx += d * dx; by += d * dy;
      }
      const det = gxx * gyy - gxy * gxy; if (det < 1e-3 * WN * WN) return false;
      const ex = (gyy * bx - gxy * by) / det, ey = (gxx * by - gxy * bx) / det; vx += ex; vy += ey;
      if (Math.abs(vx) > 6 || Math.abs(vy) > 6) return false;
      if (ex * ex + ey * ey < 1e-5) break;
    }
    x = (px + vx) / s; y = (py + vy) / s;
  }
  // kontrola shody (NCC šablony a nalezeného místa)
  const B = Q[0]; let k = 0, sb = 0, sbb = 0, sab = 0, saa = 0; const vals = tI;
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++, k++) { const v = bil(B.I, B.w, B.h, x + i, y + j); vals[k] = v; sb += v; }
  const mb = sb / WN; k = 0;
  // šablona na úrovni 0 (wT je z poslední iterace = úroveň 0)
  for (k = 0; k < WN; k++) { const bv = vals[k] - mb; sab += wT[k] * bv; saa += wT[k] * wT[k]; sbb += bv * bv; }
  const ncc = saa > 1e-6 && sbb > 1e-6 ? sab / Math.sqrt(saa * sbb) : 0;
  if (ncc < (minNcc || 0.8)) return false;
  out[0] = x; out[1] = y; return true;
}
// body rovnoměrně po celém objektu (mřížka) – i na málo výrazných plochách, ať je perspektiva dobře určená všude
function featuresGrid(L, inside, maxN, minD, G) {
  const { w, h, gx, gy } = L, cand = []; let mx = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 3; y < h - 3; y += 2) for (let x = 3; x < w - 3; x += 2) {
    if (!inside(x, y)) continue;
    let a = 0, b = 0, c = 0;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const k = (y + j) * w + x + i, X = gx[k], Y = gy[k]; a += X * X; b += X * Y; c += Y * Y; }
    const tr = a + c, ev = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - (a * c - b * b)));
    if (ev > 2) { cand.push([ev, x, y]); if (ev > mx) mx = ev; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const thr = Math.max(2.5, mx * 0.004), C = cand.filter(c => c[0] >= thr).sort((p, q) => q[0] - p[0]);
  const cw = (x1 - x0 + 1) / G, chh = (y1 - y0 + 1) / G, per = Math.max(2, Math.ceil(maxN / (G * G) * 0.7)), cnt = new Int16Array(G * G);
  const out = [], md2 = minD * minD, ok = (x, y) => out.every(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 >= md2);
  for (const [, x, y] of C) { const ci = Math.min(G - 1, ((x - x0) / cw) | 0) + Math.min(G - 1, ((y - y0) / chh) | 0) * G; if (cnt[ci] >= per) continue; if (!ok(x, y)) continue; out.push([x, y]); cnt[ci]++; if (out.length >= maxN) return out; }
  for (const [, x, y] of C) { if (out.length >= maxN) break; if (ok(x, y)) out.push([x, y]); }
  return out;
}
// o = {video, file, t0, poly (rohy, normalizované 0..1 ve výchozím snímku), mask (volitelně {w,h,d}), back, t1, onP, onFrame, cancel}
// vrací {t:[], H:[[9]], C:[[x0,y0,x1,y1,…]], c:[]} – vše v normalizovaných souřadnicích (výchozí snímek → snímek v čase t)
TRK.runPlanar = async (o) => {
  const { video, file, t0, poly, mask, onP, cancel } = o;
  const dur = video.duration || 0, ar = (video.videoWidth || 9) / (video.videoHeight || 16);
  const long = o.long || 960, W = Math.round(ar >= 1 ? long : long * ar) & ~1, H = Math.round(ar >= 1 ? long / ar : long) & ~1;
  const fps = o.fps || 30, back = Math.min(t0, o.back != null ? o.back : 20), tEnd = Math.min(dur, o.t1 != null ? o.t1 : dur);
  const PX = poly.map(([x, y]) => [x * W, y * H]);   // rohy v pracovních px (výchozí snímek)
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (const [x, y] of PX) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
  const diag = Math.hypot(bx1 - bx0, by1 - by0) || 1, ring = Math.max(6, diag * 0.07);
  // oblast pro body: objekt + pás kolem jeho hran (hrany a rohy jsou nejlepší body), z masky nebo mnohoúhelníku
  const inMask = mask ? (x, y) => { const mx = Math.round(x / W * mask.w), my = Math.round(y / H * mask.h); return mx >= 0 && my >= 0 && mx < mask.w && my < mask.h && mask.d[my * mask.w + mx]; } : null;
  // maska z AI (3D objekt na pozadí): body jen v objektu a těsně u jeho okraje – pozadí se při průletu hýbe jinak (paralaxa)
  const dm = Math.max(2, diag * 0.015), inMaskD = inMask ? (x, y) => inMask(x, y) || inMask(x + dm, y) || inMask(x - dm, y) || inMask(x, y + dm) || inMask(x, y - dm) : null;
  const inRegion = inMask ? inMaskD : (x, y) => inPoly(PX, x, y) || polyDist(PX, x, y) < ring;
  const NMAX = 400, MIND = Math.max(5, Math.min(11, diag / 30));
  const toN = Hp => hNorm([Hp[0], Hp[1] * H / W, Hp[2] / W, Hp[3] * W / H, Hp[4], Hp[5] / H, Hp[6] * W, Hp[7] * H, Hp[8]]);   // px → normalizované
  let lastYield = performance.now(); const breathe = async () => { if (performance.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); } };
  const f = [0, 0], b = [0, 0], q = [0, 0];
  const track = async (P0, frames, out) => {
    let pts = featuresGrid(P0[0], inRegion, NMAX, MIND, 8).map(p => ({ a: p, k: p, c: p }));
    if (pts.length < 8) { TRK.why = 'málo kresby v objektu'; return false; }
    const n0 = pts.length; let prev = P0, K = P0, HK = [1, 0, 0, 0, 1, 0, 0, 0, 1], Hc = HK.slice(), lost = 0, sinceK = 0, prevH = HK.slice(), lastMove = 0, blurQ = 0, typ0 = null, hard = 0, prev2H = null, coast = 0; const movHist = [], devHist = [];
    let vk = PX.map(p => p.slice());   // rohy v klíčovém snímku
    for await (const fr of frames) {
      if (cancel && cancel()) break; if (fr.cut) break;
      const Q = fr.Q, keep = [];
      for (const p of pts) {
        if (!lk(prev, Q, p.c[0], p.c[1], f) || !lk(Q, prev, f[0], f[1], b)) continue;
        if (Math.hypot(b[0] - p.c[0], b[1] - p.c[1]) > 0.8) continue;
        let c = [f[0], f[1]];
        // zpřesnění proti klíčovému snímku (bez ujíždění)
        if (p.k && lkG(K, Q, p.k[0], p.k[1], c[0], c[1], q, 1) && Math.hypot(q[0] - c[0], q[1] - c[1]) < 2.5 && lkG(Q, K, q[0], q[1], p.k[0], p.k[1], b, 1) && Math.hypot(b[0] - p.k[0], b[1] - p.k[1]) < 0.6) c = [q[0], q[1]];
        keep.push({ a: p.a, k: p.k, c });
      }
      const KA = keep.map(p => p.a), KC = keep.map(p => p.c);
      const r = (prevH && irlsH(KA, KC, prevH, 1.5, 5)) || ransacH(KA, KC, 1.6);
      // přechod / rozmazání / prudká změna (konec záběru): pohyb bodů najednou skočí → konec sledování
      const surv = keep.length / Math.max(1, pts.length);
      if (r && prevH) { let mm = 0; for (const p of [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]]) { const a = hApply(prevH, p[0], p[1]), b2 = hApply(r.H, p[0], p[1]); mm = Math.max(mm, Math.hypot(a[0] - b2[0], a[1] - b2[1])); }
        const acc = Math.abs(mm - lastMove); lastMove = mm; movHist.push(mm); if (movHist.length > 12) movHist.shift();
        const typ = movHist.slice().sort((x, y) => x - y)[movHist.length >> 1] || 0;
        if ((surv < 0.55 && mm > Math.max(4, typ * 2.5)) || (movHist.length > 6 && acc > Math.max(5, typ * 3))) { TRK.why = 'konec záběru ' + fr.t.toFixed(2); break; }
        // rychlý pohyb / rozmazání (přechod, švih kamery): kvalita klesá → maska tam plynule zeslábne; když je to moc, konec
        const ratio = mm / Math.max(0.8, typ0 || typ); blurQ = Math.max(0, Math.min(1, (ratio - 2.5) / 3)); if (typ0 == null && movHist.length >= 8) typ0 = typ;
        if (ratio > 7) { if (++hard > 1) { TRK.why = 'konec záběru (přechod) ' + fr.t.toFixed(2); break; } } else hard = 0; }
      if (!r) { if (++lost > 5) { TRK.why = 'ztraceno ' + fr.t.toFixed(2); break; } prev = Q; await breathe(); continue; }
      lost = 0; Hc = r.H; pts = keep.filter((_, i) => r.inl.has(i));
      // přesnost bez ujíždění: všechny body ještě jednou proti výchozímu snímku (v aktuální perspektivě)
      { const iH = hInv(Hc); if (iH) { const A2 = [], C2 = [], idx = [];
          for (let i = 0; i < pts.length; i++) { const p = pts[i], pr = hApply(Hc, p.a[0], p.a[1]); if (p.a[0] < R + 2 || p.a[1] < R + 2 || p.a[0] > W - R - 3 || p.a[1] > H - R - 3) continue;
            if (warpLK(P0, Q, iH, pr[0], pr[1], q, 0.82) && Math.hypot(q[0] - p.c[0], q[1] - p.c[1]) < 4) { A2.push(p.a); C2.push([q[0], q[1]]); idx.push(i); } }
          if (A2.length >= Math.max(12, pts.length * 0.35)) { const r2 = irlsH(A2, C2, Hc, 1.0, 4) || ransacH(A2, C2, 1.0); if (r2 && r2.inl.size >= A2.length * 0.5) { Hc = r2.H; for (let m = 0; m < idx.length; m++) if (r2.inl.has(m)) pts[idx[m]].c = C2[m]; } } } }
      // ochrana proti skoku: odhad se utrhl od plynulé dráhy (odlesk, zakrytí, rozmazání) → snímek se dopočítá z pohybu předtím
      if (prev2H) { const Hp = hMul(prevH, hMul(hInv(prev2H) || prevH, prevH)); let dev = 0;
        for (const p of [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]]) { const a = hApply(Hp, p[0], p[1]), b2 = hApply(Hc, p[0], p[1]); dev = Math.max(dev, Math.hypot(a[0] - b2[0], a[1] - b2[1])); }
        const tdev = devHist.length ? devHist.slice().sort((x, y) => x - y)[devHist.length >> 1] : 1;
        if (devHist.length >= 4 && dev > Math.max(3, tdev * 5)) { coast++; Hc = Hp; blurQ = Math.max(blurQ, coast > 4 ? 0.7 : 0.3); for (const p of pts) p.c = hApply(Hc, p.a[0], p.a[1]); if (coast > 10) { TRK.why = 'ztraceno ' + fr.t.toFixed(2); break; } }
        else { coast = 0; devHist.push(dev); if (devHist.length > 15) devHist.shift(); } }
      prev2H = prevH; prevH = Hc;
      // rohy: model + body v okolí rohu (3D objekty) + vlastní sledování rohu
      const C = [];
      for (let vi = 0; vi < PX.length; vi++) {
        const va = PX[vi]; let vc = hApply(Hc, va[0], va[1]);
        // 3D objekt (roh mimo hlavní rovinu): body v okolí rohu mají soustavnou odchylku od modelu → roh se o ni posune
        const near = pts.filter(p => Math.hypot(p.a[0] - va[0], p.a[1] - va[1]) < diag * 0.2 && (!inMask || inMask(p.a[0], p.a[1])));
        if (near.length >= 10) {
          let sx = 0, sy = 0, sw = 0; const rs = [];
          for (const p of near) { const pr = hApply(Hc, p.a[0], p.a[1]), d = Math.hypot(p.a[0] - va[0], p.a[1] - va[1]) / (diag * 0.2), w = (1 - d * d) ** 2 + 0.05; const ex = p.c[0] - pr[0], ey = p.c[1] - pr[1]; rs.push([ex, ey, w]); sx += w * ex; sy += w * ey; sw += w; }
          const mx = sx / sw, my = sy / sw; let vv = 0; for (const [ex, ey, w] of rs) vv += w * ((ex - mx) ** 2 + (ey - my) ** 2); const sd = Math.sqrt(vv / sw), m = Math.hypot(mx, my);
          const k = Math.min(1, near.length / 18) * (m * m / (m * m + (sd * sd) / near.length + 0.25)); vc = [vc[0] + mx * k, vc[1] + my * k];
        }
        C.push(vc);
      }
      // nový klíčový snímek, když se pohled hodně změnil (nebo po 2 s)
      sinceK++;
      const HKc = hMul(Hc, hInv(HK) || HK);
      let def = 0; for (const p of [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]]) { const pk = hApply(HK, p[0], p[1]), pc = hApply(HKc, pk[0], pk[1]); def = Math.max(def, Math.hypot(pc[0] - pk[0], pc[1] - pk[1]) / diag); }
      if (def > 0.12 || sinceK > fps * 2) { K = Q; HK = Hc.slice(); sinceK = 0; for (const p of pts) p.k = p.c.slice(); vk = C.map(p => p.slice()); }
      // doplnit body, když ubyly (výchozí souřadnice zpětnou transformací)
      if (pts.length < n0 * 0.6) {
        const iH = hInv(Hc);
        if (iH) { const nw = featuresGrid(Q[0], (x, y) => { const z = hApply(iH, x, y); return inRegion(z[0], z[1]); }, NMAX, MIND, 8);
          for (const p of nw) { if (pts.length >= NMAX) break; if (pts.some(s => (s.c[0] - p[0]) ** 2 + (s.c[1] - p[1]) ** 2 < MIND * MIND)) continue; pts.push({ a: hApply(iH, p[0], p[1]), k: K === Q ? p : null, c: p }); } }
      }
      out.push({ t: fr.t, H: toN(Hc), C: C.flatMap(([x, y]) => [x / W, y / H]), c: Math.min(1, pts.length / n0) * (1 - 0.8 * blurQ), q: 1 - blurQ });
      if (o.onFrame && fr.canvas) o.onFrame(fr.canvas, out[out.length - 1]);
      prev = Q; await breathe();
    }
    return true;
  };
  const total = (tEnd - (t0 - back)) || 1; TRK.why = '';
  // výchozí snímek
  let P0 = null; const first = { t: t0, H: [1, 0, 0, 0, 1, 0, 0, 0, 1], C: poly.flat(), c: 1 };
  // 1) dopředu
  const fwd = [first];
  { const gen = TRK.frames({ file, video, t0, t1: tEnd, fps, W, H });
    const it = (async function* () { let lastG = null;
      for await (const fr of gen) { onP && onP(back / total + (fr.t - t0) / total);
        if (!P0) { P0 = TRK.pyramid(fr.data, W, H); lastG = fr.data; continue; }
        const cut = TRK.isCut(lastG, fr.data); lastG = fr.data; yield { t: fr.t, Q: TRK.pyramid(fr.data, W, H), cut, canvas: fr.canvas }; } })();
    const one = await it.next(); if (!P0) return null;
    const rest = (async function* () { if (!one.done) yield one.value; for await (const v of it) yield v; })();
    await track(P0, rest, fwd); }
  // 2) dozadu po kouscích (malá paměť): kus snímků se načte, pak se projde pozpátku
  const bk = [];
  if (back > 0.02 && P0 && !(cancel && cancel())) {
    const CH = 1.5; let hi = t0, stopped = false, firstG = null;
    const bFrames = (async function* () {
      while (!stopped && hi > t0 - back + 1e-3) {
        const lo = Math.max(t0 - back, hi - CH), buf = [];
        for await (const fr of TRK.frames({ file, video, t0: lo, t1: hi - 0.5 / fps, fps, W, H })) buf.push({ t: fr.t, data: fr.data });
        if (!buf.length) break;
        for (let i = buf.length - 1; i >= 0; i--) { const d = buf[i].data; const cut = firstG ? TRK.isCut(firstG, d) : false; firstG = d; onP && onP((t0 - buf[i].t) / total); yield { t: buf[i].t, Q: TRK.pyramid(d, W, H), cut }; buf[i].data = null; }
        hi = lo;
      }
    })();
    await track(P0, bFrames, bk); stopped = true;
  }
  const all = bk.reverse().concat(fwd);
  if (all.length < 2) return null;
  return { t: all.map(r => r.t), H: all.map(r => r.H), C: all.map(r => r.C), c: all.map(r => r.c), q: all.map(r => r.q ?? 1), t0, W, Hh: H };
};
function fitAffineW(P, Q, Wt) {   // vážené nejmenší čtverce (afinní)
  let M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], ux = [0, 0, 0], uy = [0, 0, 0];
  for (let i = 0; i < P.length; i++) { const [x, y] = P[i], [X, Y] = Q[i], w = Wt[i], v = [x, y, 1]; for (let a = 0; a < 3; a++) { for (let c = 0; c < 3; c++) M[a][c] += w * v[a] * v[c]; ux[a] += w * v[a] * X; uy[a] += w * v[a] * Y; } }
  const sx = solveN(M, ux, 3), sy = solveN(M, uy, 3); if (!sx || !sy) return null;
  return [sx[0], sy[0], sx[1], sy[1], sx[2], sy[2]];
}
// poloha rohů a homografie v čase (vyhlazení bez zpoždění, mezi snímky plynule)
TRK.planarAt = (tr, ts, sm) => {
  if (!tr._S || tr._Sk !== sm || tr._Sn !== tr.t.length) {
    const sig = 0.012 + Math.pow((sm == null ? 6 : sm) / 100, 1.5) * 0.42, dt = 1 / 120, ta = tr.t[0], tb = tr.t[tr.t.length - 1];
    const n = Math.max(2, Math.round((tb - ta) / dt) + 1), tt = new Float32Array(n); for (let i = 0; i < n; i++) tt[i] = ta + i * dt;
    const nc = tr.C[0].length, Cs = []; for (let k = 0; k < nc; k++) Cs.push(loess(tr.t, tr.C.map(a => a[k]), tr.c, tt, sig));
    const Hs = []; for (let k = 0; k < 8; k++) Hs.push(loess(tr.t, tr.H.map(a => a[k] / a[8]), tr.c, tt, sig));
    tr._S = { ta, dt, n, Cs, Hs }; tr._Sk = sm; tr._Sn = tr.t.length;
  }
  const S = tr._S; let fq = (ts - S.ta) / S.dt; fq = Math.max(0, Math.min(S.n - 1, fq));
  const i = Math.min(S.n - 2, Math.floor(fq)), u = fq - i, i0 = Math.max(0, i - 1), i2 = Math.min(S.n - 1, i + 1), i3 = Math.min(S.n - 1, i + 2);
  const cr = A => { const p0 = A[i0], p1 = A[i], p2 = A[i2], p3 = A[i3]; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u); };
  return { C: S.Cs.map(cr), H: [...S.Hs.map(cr), 1] };
};

// ================= OPTICKÝ TOK (pro plynulé zpomalení) =================
// grayA, grayB = šedé snímky (w×h); vrací pohyb A→B na mřížce po „step“ px: {gw, gh, step, fx, fy}
TRK.denseFlow = (grayA, grayB, w, h, step) => {
  const P = TRK.pyramid(grayA, w, h), Q = TRK.pyramid(grayB, w, h);
  const gw = Math.ceil(w / step) + 1, gh = Math.ceil(h / step) + 1, fx = new Float32Array(gw * gh), fy = new Float32Array(gw * gh), ok = new Uint8Array(gw * gh);
  const f = [0, 0], b = [0, 0];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = Math.min(w - 2, i * step), y = Math.min(h - 2, j * step), k = j * gw + i;
    if (!lk(P, Q, x, y, f)) continue;
    if (lk(Q, P, f[0], f[1], b) && Math.hypot(b[0] - x, b[1] - y) < 1.5) { fx[k] = f[0] - x; fy[k] = f[1] - y; ok[k] = 1; }
  }
  // díry (plochy bez kresby, zakryté části) doplnit z okolí, pak vyhladit mediánem 3×3
  for (let pass = 0; pass < 6; pass++) for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const k = j * gw + i; if (ok[k]) continue; let sx = 0, sy = 0, n = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= gw || jj >= gh) continue; const q = jj * gw + ii; if (ok[q]) { sx += fx[q]; sy += fy[q]; n++; } }
    if (n) { fx[k] = sx / n; fy[k] = sy / n; ok[k] = 2; } }
  const mfx = new Float32Array(fx), mfy = new Float32Array(fy);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const ax = [], ay = []; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = Math.min(gw - 1, Math.max(0, i + di)), jj = Math.min(gh - 1, Math.max(0, j + dj)); ax.push(fx[jj * gw + ii]); ay.push(fy[jj * gw + ii]); } mfx[j * gw + i] = med(ax); mfy[j * gw + i] = med(ay); }
  return { gw, gh, step, w, h, fx: mfx, fy: mfy };
};
// vyhlazená afinní transformace v čase ts (zdrojový čas)
TRK.affAt = (tr, ts, sm) => {
  if (!tr._S || tr._Sk !== sm || tr._Sn !== tr.t.length) {
    const sig = TRK.sigma(sm), dt = 1 / 60, ta = tr.t[0], tb = tr.t[tr.t.length - 1];
    const n = Math.max(2, Math.round((tb - ta) / dt) + 1), tt = new Float32Array(n); for (let i = 0; i < n; i++) tt[i] = ta + i * dt;
    const P = []; for (let k = 0; k < 6; k++) P.push(loess(tr.t, tr.A.map(a => a[k]), tr.c, tt, sig));
    tr._S = { ta, dt, n, P }; tr._Sk = sm; tr._Sn = tr.t.length;
  }
  const S = tr._S; let f = (ts - S.ta) / S.dt; f = Math.max(0, Math.min(S.n - 1, f));
  const i = Math.min(S.n - 2, Math.floor(f)), u = f - i, i0 = Math.max(0, i - 1), i2 = Math.min(S.n - 1, i + 1), i3 = Math.min(S.n - 1, i + 2);
  return S.P.map(A => { const p0 = A[i0], p1 = A[i], p2 = A[i2], p3 = A[i3]; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u); });
};
})(window);
