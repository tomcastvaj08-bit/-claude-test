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
