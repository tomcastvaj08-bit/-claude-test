// Engine: obří 3D plátno + AE-like kamera. Vše je čistá funkce času -> deterministický render po snímcích.
(() => {
  const FPS = 30, VW = 1920, VH = 1080, PERSP = 1600;
  // U = supersampling: svět je v layoutu U× větší, aby text zůstal ostrý i při přiblížení (Chrome rasterizuje 3D vrstvy 1:1)
  const U = 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const D2R = Math.PI / 180;

  // ---------- easing (stejné křivky jako v AE / v reelu) ----------
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || !d) break; t -= e / d; }
      return sy(clamp(t));
    };
  }
  const EASE = {
    linear: t => t,
    ease: bezier(.33, 0, .67, 1),          // AE Easy Ease
    smooth: bezier(.65, 0, .35, 1),        // silnější ease in/out
    whip: bezier(.86, 0, .12, 1),          // rychlý přesun s měkkým dosednutím
    out: bezier(.16, 1, .3, 1),            // expo out
    in: bezier(.7, 0, .84, 0),
    sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    quad: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    cubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    quart: t => t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2,
    expo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    backOut: t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
    elastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
  };
  const ease = (name, t) => (EASE[name] || EASE.ease)(clamp(t));

  // ---------- scéna ----------
  const S = { nodes: [], links: [], shots: [], hud: [], cues: {}, duration: 10, audio: null };
  const CUES = {};
  const cue = (name, t) => (CUES[name] = t);
  const T = name => { if (!(name in CUES)) throw new Error('missing cue ' + name); return CUES[name]; };

  function node(o) {
    const n = Object.assign({ x: 0, y: 0, z: 0, w: 400, h: 300, rx: 0, ry: 0, rz: 0, s: 1, in: 0, dur: .9, anim: 'pop',
      out: null, outDur: .6, float: 0, dof: true, cls: '', html: '', fx: [] }, o);
    S.nodes.push(n); return n;
  }
  function link(o) { const l = Object.assign({ in: 0, dur: 1.2, soft: false, bend: .25, dot: true, ease: 'smooth', w: 6 }, o); S.links.push(l); return l; }
  // kamera: shot = přesun na cíl za `dur` s `ease`, po dosednutí pomalý push (zmenšení vzdálenosti o `push` až do dalšího shotu)
  function cam(o) { S.shots.push(Object.assign({ dur: 0, ease: 'smooth', push: .035, rx: 0, ry: 0, rz: 0 }, o)); }

  // ---------- kamera ----------
  let camCache = null;
  const KEYS = ['x', 'y', 'd', 'rx', 'ry', 'rz'];
  function evalSeg(seg, t) {
    const { from, to } = seg;
    if (t < seg.t1) {
      // zoom (d) interpolujeme logaritmicky, aby dolly působil rovnoměrně jako v AE
      const p = ease(seg.ease, (t - seg.t0) / Math.max(.001, seg.t1 - seg.t0));
      const st = {};
      for (const k of KEYS) st[k] = k === 'd' ? Math.exp(lerp(Math.log(from.d), Math.log(to.d), p)) : lerp(from[k], to[k], p);
      return st;
    }
    // slow push (dolly in) – nikdy statický záběr; náběh přes 8 s, pak drží
    const h = Math.min(1, (t - seg.t1) / 8);
    return { ...to, d: to.d * (1 - seg.push * EASE.sine(h)) };
  }
  function buildCam() {
    const sh = S.shots.slice().sort((a, b) => a.t - b.t);
    const segs = [];
    for (let i = 0; i < sh.length; i++) {
      const s = sh[i];
      const from = i === 0 ? { x: s.x, y: s.y, d: s.d, rx: s.rx, ry: s.ry, rz: s.rz } : evalSeg(segs[i - 1], s.t);
      const to = {};
      for (const k of KEYS) to[k] = s[k] ?? from[k];
      segs.push({ t0: s.t, t1: s.t + s.dur, from, to, ease: s.ease, push: s.push });
    }
    camCache = segs;
  }
  function camAt(t) {
    if (!camCache) buildCam();
    let seg = camCache[0];
    for (const s of camCache) if (s.t0 <= t) seg = s; else break;
    const st = evalSeg(seg, t);
    // jemný handheld drift (deterministický šum)
    const n = (f, a) => Math.sin(t * f) * a + Math.sin(t * f * 2.37 + 1.3) * a * .45;
    st.x += n(.31, 6) * st.d / 1600; st.y += n(.27, 5) * st.d / 1600;
    st.rx += n(.23, .35); st.ry += n(.19, .45); st.rz += n(.17, .12);
    return st;
  }

  // projekce bodu světa do kamery (musí odpovídat CSS transform pořadí)
  function project(c, x, y, z) {
    let px = x - c.x, py = y - c.y, pz = z;
    let a = c.rz * D2R, X = px * Math.cos(a) - py * Math.sin(a), Y = px * Math.sin(a) + py * Math.cos(a); px = X; py = Y;
    a = c.ry * D2R; X = px * Math.cos(a) + pz * Math.sin(a); let Z = -px * Math.sin(a) + pz * Math.cos(a); px = X; pz = Z;
    a = c.rx * D2R; Y = py * Math.cos(a) - pz * Math.sin(a); Z = py * Math.sin(a) + pz * Math.cos(a); py = Y; pz = Z;
    const depth = (c.d - pz) * U, k = PERSP / Math.max(1, depth);
    return { sx: px * U * k, sy: py * U * k, depth, k, zc: pz * U };
  }

  // ---------- DOM ----------
  let world, gridc, gctx, glowEl, built = false;
  const imgs = [];
  const ZL = [2, 1, .5, .25, .125, .0625, .03125, .015625];   // LOD úrovně rasterizace (layout px na jednotku světa)
  function setZ(n, Z) {
    n.Z = Z;
    n.el.style.width = n.w * Z + 'px'; n.el.style.height = n.autoH ? 'auto' : n.h * Z + 'px';
    n.inner.style.zoom = Z;
  }
  function pickZ(cur, r) {
    let want = ZL[0];
    for (const z of ZL) if (z >= r * 1.15) want = z;
    if (want > cur) return want;                  // zostření hned
    if (r * 1.15 < cur * .45) return want;        // zhrubnutí s hysterezí
    return cur;
  }
  function build() {
    world = document.getElementById('world'); gridc = document.getElementById('gridc'); glowEl = document.getElementById('glow');
    gridc.width = VW; gridc.height = VH; gctx = gridc.getContext('2d');
    glowEl.innerHTML = '<i style="width:1100px;height:900px;background:rgba(31,77,255,.16)"></i><i style="width:900px;height:800px;background:rgba(19,185,122,.12)"></i><i style="width:700px;height:700px;background:rgba(91,130,255,.10)"></i>';
    for (const n of S.nodes) {
      const el = document.createElement('div');
      el.className = 'node ' + (n.cls || '');
      el.innerHTML = n.type === 'img' ? `<div class="pic in"><img src="${n.src}">${n.cap ? `<div class="cap">${n.cap}</div>` : ''}</div>`
        : n.type === 'seq' ? `<div class="pic in"><img>${n.cap ? `<div class="cap">${n.cap}</div>` : ''}</div>`
        : `<div class="in">${n.html}</div>`;
      world.appendChild(el); n.el = el; n.inner = el.firstElementChild;
      Object.assign(n.inner.style, { width: n.w + 'px', height: n.autoH ? 'auto' : n.h + 'px' });
      setZ(n, U);
      if (n.type === 'seq') n.img = el.querySelector('img');
      el.querySelectorAll('img').forEach(i => imgs.push(i));
      if (n.init) n.init(n, el);
    }
    for (const l of S.links) {
      const ns = 'http://www.w3.org/2000/svg';
      // SVG je zabalené v div uzlu: Chromium pak rasterizuje podle layoutu (LOD), ne podle scale() v transformaci
      const wrap = document.createElement('div'); wrap.className = 'node';
      const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'link'); wrap.appendChild(svg);
      const a = l.a, b = l.b; // {x,y}
      const pad = 60, minx = Math.min(a.x, b.x) - pad, miny = Math.min(a.y, b.y) - pad, w = Math.abs(a.x - b.x) + pad * 2, h = Math.abs(a.y - b.y) + pad * 2;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const ax = a.x - minx, ay = a.y - miny, bx = b.x - minx, by = b.y - miny;
      const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay;
      const cx = mx - dy * l.bend, cy = my + dx * l.bend;
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', `M${ax},${ay} Q${cx},${cy} ${bx},${by}`);
      if (l.soft) p.classList.add('soft');
      p.style.strokeWidth = l.w;
      svg.appendChild(p);
      if (l.dot) { const c = document.createElementNS(ns, 'circle'); c.setAttribute('r', l.w * 2); svg.appendChild(c); l.dotEl = c; }
      world.appendChild(wrap);
      l.el = wrap; l.svg = svg; l.path = p; l.len = p.getTotalLength(); l.box = { minx, miny, w, h }; l.z = l.z ?? -2;
      p.style.strokeDasharray = l.len; l.cxy = { ax, ay, cx, cy, bx, by }; l.Z = 0; l.sw = l.w;
      l.mx = (a.x + b.x) / 2; l.my = (a.y + b.y) / 2;
    }
    built = true;
  }

  // animace příchodu uzlu
  function enter(n, t) {
    const p = clamp((t - n.in) / n.dur);
    let o = 1, s = 1, dy = 0, dz = 0, blur = 0, ry = 0, rx = 0;
    if (p < 1) {
      const e = ease('out', p), b = ease('backOut', p);
      switch (n.anim) {
        case 'pop': s = lerp(.55, 1, b); o = clamp(p * 2.2); dz = lerp(-260, 0, e); break;
        case 'rise': dy = lerp(70, 0, e); o = clamp(p * 1.8); break;
        case 'fly': dz = lerp(900, 0, e); o = clamp(p * 2); blur = (1 - e) * 14; break;
        case 'deep': dz = lerp(-1400, 0, e); o = clamp(p * 1.6); break;
        case 'flip': ry = lerp(-75, 0, e); o = clamp(p * 2); dz = lerp(-200, 0, e); break;
        case 'tilt': rx = lerp(55, 0, e); o = clamp(p * 2); dy = lerp(120, 0, e); break;
        case 'fade': o = e; break;
        case 'none': break;
      }
    }
    if (n.out != null && t > n.out) {
      const q = clamp((t - n.out) / n.outDur), e = ease('in', q);
      o *= 1 - e; s *= lerp(1, .85, e); dz += lerp(0, -300, e);
    }
    return { p, o, s, dy, dz, blur, ry, rx };
  }

  // mřížka plátna = skutečná rovina z=0, promítnutá stejnou maticí jako CSS (perspektiva sedí s uzly)
  function drawGrid(c, t) {
    const g = gctx; g.clearRect(0, 0, VW, VH);
    if (S.gridAlpha === 0) return;
    const mag = PERSP / c.d;                       // px obrazovky na jednotku světa v rovině ostrosti
    const half = 960 / mag * 1.9, halfY = 540 / mag * 2.4;
    for (const [step, base] of [[52, .085], [520, .11], [5200, .13]]) {
      const ss = step * mag;
      const a = base * clamp((ss - 9) / 26) * (1 - clamp((ss - 900) / 1500)) * (S.gridAlpha ?? 1);
      if (a < .004) continue;
      g.strokeStyle = `rgba(31,77,255,${a.toFixed(3)})`; g.lineWidth = 1.15; g.beginPath();
      const x0 = Math.floor((c.x - half) / step) * step, x1 = c.x + half, y0 = Math.floor((c.y - halfY) / step) * step, y1 = c.y + halfY;
      const line = (ax, ay, bx, by) => {
        const p = project(c, ax, ay, 0), q = project(c, bx, by, 0);
        if (p.depth < 80 || q.depth < 80) return;
        g.moveTo(960 + p.sx, 540 + p.sy); g.lineTo(960 + q.sx, 540 + q.sy);
      };
      for (let x = x0; x <= x1; x += step) line(x, c.y - halfY, x, c.y + halfY);
      for (let y = y0; y <= y1; y += step) line(c.x - half, y, c.x + half, y);
      g.stroke();
    }
  }

  const pending = [];
  let dirty = false;
  function seek(t) {
    if (!built) build();
    const c = camAt(t);
    world.style.transform = `translateZ(${PERSP - c.d * U}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) translate3d(${-c.x * U}px,${-c.y * U}px,0)`;
    drawGrid(c, t);
    const mag = PERSP / c.d;
    const gl = glowEl.children;
    gl[0].style.transform = `translate(${1250 - c.x * mag * .05 + Math.sin(t * .11) * 60}px, ${-120 - c.y * mag * .05 + Math.cos(t * .09) * 50}px)`;
    gl[1].style.transform = `translate(${-80 - c.x * mag * .03 + Math.cos(t * .07) * 70}px, ${720 - c.y * mag * .03 + Math.sin(t * .1) * 40}px)`;
    gl[2].style.transform = `translate(${900 - c.x * mag * .08 + Math.sin(t * .05 + 2) * 120}px, ${380 - c.y * mag * .08}px)`;
    pending.length = 0;

    for (const n of S.nodes) {
      const vis = t >= n.in - .001 && (n.out == null || t < n.out + n.outDur);
      if (!vis) { if (n._shown !== false) { n.el.style.display = 'none'; n._shown = false; } continue; }
      const fl = n.float ? Math.sin(t * .6 + n.x * .013) * n.float : 0;
      const z = n.z + fl * .8;
      const pr = project(c, n.x, n.y, z);
      const rad = Math.max(n.w, n.h) * n.s * .75 * pr.k * U;
      const off = pr.depth < 60 || Math.abs(pr.sx) - rad > VW * .62 || Math.abs(pr.sy) - rad > VH * .62;
      if (off) { if (n._shown !== false) { n.el.style.display = 'none'; n._shown = false; } continue; }
      if (n._shown !== true) { n.el.style.display = ''; n._shown = true; dirty = true; }
      const a = enter(n, t);
      const Z = pickZ(n.Z, pr.k * U * n.s * Math.max(a.s, 1) * (n.lodBoost || 1));
      if (Z !== n.Z) { setZ(n, Z); dirty = true; }
      const rot = `rotateX(${n.rx + a.rx}deg) rotateY(${n.ry + a.ry + (n.float ? Math.sin(t * .4 + n.y * .01) * n.float * .02 : 0)}deg) rotateZ(${n.rz}deg)`;
      n.el.style.transform = `translate3d(${n.x * U}px,${(n.y + a.dy + fl) * U}px,${(z + a.dz) * U}px) ${rot} scale(${n.s * a.s * U / n.Z}) translate(-50%,-50%)`;
      n.el.style.opacity = a.o * (n.alpha ?? 1);
      // hloubka ostrosti: blur v lokálních px (zoom * scale se vykrátí na U)
      let blur = a.blur;
      if (n.dof) blur += clamp(Math.abs(pr.zc + a.dz * U) / pr.depth * 18 - .5, 0, 14);
      const lb = Math.min(24, blur / (U * pr.k * n.s));
      const bf = blur > .35 ? `blur(${lb.toFixed(2)}px)` : 'none';
      if (n._bf !== bf) { n.inner.style.filter = bf; n._bf = bf; if (bf === 'none' || !n._bfOn) dirty = true; n._bfOn = bf !== 'none'; }
      if (n.type === 'seq') {
        const raw = Math.floor((t - (n.seqStart ?? n.in)) * (n.fps || 24));
        const fi = n.loop ? ((raw % n.frames) + n.frames) % n.frames : clamp(raw, 0, n.frames - 1);
        const src = n.pattern.replace('%04d', String(fi + (n.first ?? 1)).padStart(4, '0'));
        if (n.img.getAttribute('src') !== src) { n.img.setAttribute('src', src); pending.push(n.img); }
      }
      for (const f of n.fx) {
        const q = clamp((t - f.t) / (f.dur || .4)), r = f.until != null ? 1 - clamp((t - f.until) / (f.dur || .4)) : 1;
        const v = ease('smooth', q) * r;
        const targets = f.sel ? n.el.querySelectorAll(f.sel) : [n.el];
        targets.forEach(e => e.style.setProperty(f.var || '--hl', v.toFixed(3)));
      }
      if (n.update) n.update(n, t, a, c);
    }

    for (const l of S.links) {
      const p = ease(l.ease, (t - l.in) / l.dur);
      if (p <= 0 || (l.out != null && t > l.out + .6)) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      const pr = project(c, l.mx, l.my, l.z);
      const Z = pickZ(l.Z || U, pr.k * U);
      if (Z !== l.Z) { l.Z = Z; l.svg.setAttribute('width', l.box.w * Z); l.svg.setAttribute('height', l.box.h * Z); l.el.style.width = l.box.w * Z + 'px'; l.el.style.height = l.box.h * Z + 'px'; }
      // tloušťka čáry: v dálce drží minimum v px obrazovky, ať je mapa čitelná i z obří dálky
      const want = Math.max(l.w, (l.minPx ?? (l.soft ? 1.4 : 2.6)) / (pr.k * U));
      const sw = Math.abs(want - l.sw) / l.sw > .08 ? want : l.sw;
      if (sw !== l.sw) { l.sw = sw; l.path.style.strokeWidth = sw; if (l.dotEl) l.dotEl.setAttribute('r', sw * 2); }
      l.el.style.transform = `translate3d(${l.box.minx * U}px,${l.box.miny * U}px,${l.z * U}px) scale(${U / l.Z})`;
      l.el.style.transformOrigin = '0 0';
      l.el.style.opacity = l.out != null && t > l.out ? 1 - clamp((t - l.out) / .6) : 1;
      l.path.style.strokeDashoffset = l.len * (1 - p);
      if (l.dotEl) {
        const q = l.cxy, u = p, iu = 1 - u;
        const x = iu * iu * q.ax + 2 * iu * u * q.cx + u * u * q.bx, y = iu * iu * q.ay + 2 * iu * u * q.cy + u * u * q.by;
        l.dotEl.setAttribute('cx', x); l.dotEl.setAttribute('cy', y);
        l.dotEl.style.opacity = p >= 1 ? 0 : 1;
      }
    }
    for (const h of S.hud) h(t, c);
    if (window.SUBS) ENGINE.subs(t);
    return c;
  }

  // rychlost kamery v px/snímek (pro motion blur v rendereru)
  function camSpeed(t) {
    const a = camAt(t), b = camAt(t + 1 / FPS);
    const pa = project(a, b.x, b.y, 0);
    const zoom = Math.abs(Math.log(a.d / b.d)) * 900;  // přibližná rychlost zoomu v px na okraji
    return Math.hypot(pa.sx, pa.sy) + zoom + Math.abs(a.ry - b.ry) * 40 + Math.abs(a.rx - b.rx) * 40;
  }

  async function ready() {
    if (!built) build();
    await document.fonts.ready;
    await Promise.all(imgs.filter(i => i.getAttribute('src')).map(i => i.decode().catch(() => {})));
    return { duration: S.duration, fps: FPS };
  }
  let settle = false;
  const setSettle = v => (settle = v);
  async function seekAsync(t) {
    seek(t);
    // pojistka: nic nesmí čekat déle než 1,5 s (dekódování / rAF v headless režimu)
    const guard = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => { window.__stalls = (window.__stalls || 0) + 1; r(); }, ms))]);
    if (pending.length) await guard(Promise.all(pending.map(i => i.decode().catch(() => {}))), 1500);
    // nový obrázek / nová vrstva / změna LOD = nové textury: počkat dva snímky, ať jsou dorasterizované
    if (pending.length || dirty || settle) await guard(new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), 400);
    dirty = false;
    return camSpeed(t);
  }

  // ---------- plán (časy z hlasu) ----------
  let PLAN = null;
  const normW = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  function loadPlan(p) { PLAN = p; Object.assign(CUES, p.cues); S.duration = p.duration; S.plan = p; }
  // čas slova `word` (n-tý výskyt) po cue značce – grafika navázaná na slova jako v reelu
  function AT(cueName, word, nth = 1) {
    const i0 = PLAN.cueIdx[cueName] ?? 0, w = normW(word); let n = 0;
    for (let i = i0; i < PLAN.words.length; i++) if (PLAN.words[i][1].startsWith(w) && ++n === nth) return PLAN.words[i][0];
    console.warn('AT miss', cueName, word); return T(cueName);
  }
  function subs(t) {
    const el = document.getElementById('subs'); if (!el || !PLAN) return;
    const p = PLAN.paras.find(p => t >= p.t && t < p.t + p.dur + .3);
    const ins = PLAN.inserts.find(i => t >= i.t && t < i.t + i.dur);
    el.textContent = p ? p.text : ins ? `▶ ${ins.src} ${ins.a.toFixed(1)}–${ins.b.toFixed(1)} s (původní zvuk)` : '';
    el.style.opacity = el.textContent ? 1 : 0;
  }

  window.ENGINE = { U, PERSP, project, S, node, link, cam, cue, T, CUES, seek, seekAsync, ready, camAt, loadPlan, AT, subs, normW, setSettle, camSpeed, EASE, ease, clamp, lerp, FPS };
})();
