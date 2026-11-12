// Love Bricks – auta z panelů (jednotka = 1 dm, auto ~ 45 dm dlouhé).
// Karoserie vzniká "loftem" příčných řezů podél délky auta a dělí se na
// panely, které se při skládání postupně usadí na místo.
import * as THREE from 'three';
import { Build, registerGeo, registerMat } from './models.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// hladká funkce z klíčových bodů [[u, hodnota], …]
function fn(keys) {
  if (typeof keys === 'number') return () => keys;
  return (u) => {
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [u0, v0] = keys[i], [u1, v1] = keys[i + 1];
      if (u <= u1) { const t = (u - u0) / (u1 - u0); const s = t * t * (3 - 2 * t); return v0 + (v1 - v0) * s; }
    }
    return keys[keys.length - 1][1];
  };
}
const spow = (x, p) => Math.sign(x) * Math.pow(Math.abs(x), p);

// ------------------------------------------------------------ karoserie
function bodyModel(spec) {
  const L = spec.L;
  const top = fn(spec.top), hw = fn(spec.hw), beltK = fn(spec.belt ?? 0.42), fender = fn(spec.fender ?? 0);
  const clear = spec.clear ?? 1.3;
  const nTop = spec.nTop ?? 2.6, nBot = spec.nBot ?? 5;
  const wheels = spec.wheels.map(w => ({ x: (w.u - 0.5) * L, r: w.r ?? spec.wheelR }));
  const yBot = (u) => {
    const x = (u - 0.5) * L;
    let y = clear;
    for (const w of wheels) {
      const R = w.r * 1.1, dx = Math.abs(x - w.x);
      if (dx < R) y = Math.max(y, w.r + Math.sqrt(R * R - dx * dx) * 0.98);
    }
    return y;
  };
  const M = 26; // body na obvodu
  const ring = (u) => {
    const yt = top(u), yb = Math.min(yBot(u), yt - 2.0);
    const yBelt = Math.max(yb + 0.6, clear + (yt - clear) * beltK(u));
    const w = hw(u), f = fender(u);
    const pts = [];
    for (let j = 0; j <= M; j++) {
      // θ od -π/2 (spodek, pravá strana) přes horní střed až po 3π/2 (spodek, levá)
      const th = -PI / 2 + (j / M) * 2 * PI;
      const s = Math.sin(th), c = Math.cos(th);
      let y, z;
      if (s >= 0) { y = yBelt + (yt - yBelt) * spow(s, 2 / nTop); z = w * spow(c, 2 / nTop); y += f * Math.pow(Math.abs(Math.sin(2 * th)), 3); }
      else { y = yBelt + (yBelt - yb) * spow(s, 2 / nBot); z = w * spow(c, 2 / nBot); }
      pts.push([y, z]);
    }
    return pts;
  };
  return { L, top, hw, yBot, ring, M, wheels, clear };
}

// sestaví BufferGeometry z části mřížky
function gridGeo(P, i0, i1, j0, j1, flip = false) {
  const pos = [], idx = [];
  const cols = j1 - j0 + 1;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) pos.push(...P[i][j]);
  for (let i = 0; i < i1 - i0; i++) for (let j = 0; j < j1 - j0; j++) {
    const a = i * cols + j, b = a + cols;
    if (flip) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// zjistí, jestli je potřeba otočit plošky: normála uprostřed horní části musí mířit nahoru
function needFlip(P, i, j) {
  const g = gridGeo(P, i, i + 1, j - 1, j + 1, false);
  const n = g.attributes.normal;
  let y = 0; for (let k = 0; k < n.count; k++) y += n.getY(k);
  return y < 0;
}
function shrink(g, k) { // malá mezera mezi panely
  g.computeBoundingBox();
  const c = g.boundingBox.getCenter(V());
  g.translate(-c.x, -c.y, -c.z); g.scale(k, k, k); g.translate(c.x, c.y, c.z);
  return g;
}
function capGeo(pts, x, flip) {
  const pos = [], idx = [];
  const cy = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  pos.push(x, cy, 0);
  pts.forEach(([y, z]) => pos.push(x, y, z));
  for (let j = 1; j < pts.length; j++) idx.push(0, j, j + 1, 0, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx.slice(0, (pts.length - 1) * 6));
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------ kolo
function wheelGeos(style) {
  const key = 'rim:' + style;
  registerGeo(key, () => {
    const parts = [];
    const ring = new THREE.CylinderGeometry(0.72, 0.72, 0.3, 32, 1, true); ring.rotateX(PI / 2); ring.translate(0, 0, 0.32); parts.push(ring);
    const lip = new THREE.TorusGeometry(0.72, 0.035, 6, 32); lip.translate(0, 0, 0.46); parts.push(lip);
    const hub = new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16); hub.rotateX(PI / 2); hub.translate(0, 0, 0.4); parts.push(hub);
    const n = style === 'mesh' ? 10 : style === 'y' ? 5 : style === 'five' ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * PI;
      const addSpoke = (ang, w, len) => { const s = new THREE.BoxGeometry(w, len, 0.08); s.translate(0, 0.16 + len / 2, 0.38); s.rotateZ(ang); parts.push(s); };
      if (style === 'y') { addSpoke(a + 0.13, 0.08, 0.56); addSpoke(a - 0.13, 0.08, 0.56); }
      else if (style === 'five') addSpoke(a, 0.2, 0.58);
      else if (style === 'mesh') { addSpoke(a, 0.06, 0.58); addSpoke(a + 0.31, 0.04, 0.58); }
      else addSpoke(a, 0.11, 0.58);
    }
    const g = new THREE.BufferGeometry();
    const merged = parts.map(p => p.index ? p.toNonIndexed() : p);
    let total = 0; merged.forEach(m => { total += m.attributes.position.count; });
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
    let o = 0; merged.forEach(m => { pos.set(m.attributes.position.array, o * 3); nor.set(m.attributes.normal.array, o * 3); o += m.attributes.position.count; });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return g;
  });
  registerGeo('tireR', () => {
    const pts = [[0.74, -0.42], [0.92, -0.44], [0.99, -0.36], [1.0, 0], [0.99, 0.36], [0.92, 0.44], [0.74, 0.42]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 32); g.rotateX(PI / 2); return g;
  });
  return key;
}

// ------------------------------------------------------------ hlavní stavitel auta
export function car(spec) {
  const b = new Build();
  const S = bodyModel(spec);
  const { L, M } = S;
  const NS = 44;
  // mřížka spodní karoserie
  const P = [];
  for (let i = 0; i <= NS; i++) {
    const u = i / NS, x = (u - 0.5) * L;
    P.push(S.ring(u).map(([y, z]) => [x, y, z]));
  }
  const cutsU = spec.cuts ?? [0, 0.16, 0.34, 0.52, 0.7, 0.86, 1];
  const flipB = needFlip(P, NS / 2, M / 2);
  // pásy po obvodu: spodek P, bok P, horní P, horní L, bok L, spodek L
  const bands = [[0, 5, 'under'], [5, 10, 'sideR'], [10, 13, 'topR'], [13, 16, 'topL'], [16, 21, 'sideL'], [21, 26, 'under']];
  const paint = spec.paint ?? (() => 'var:body');
  for (let k = 0; k < cutsU.length - 1; k++) {
    const i0 = Math.round(cutsU[k] * NS), i1 = Math.round(cutsU[k + 1] * NS);
    const um = (cutsU[k] + cutsU[k + 1]) / 2;
    for (const [j0, j1, band] of bands) {
      if (band === 'under') continue;
      const mat = band === 'under' ? '#1d1f22' : paint(um, band);
      const g = shrink(gridGeo(P, i0, i1, j0, j1, flipB), 0.997);
      b.put(g, mat, new THREE.Matrix4(), 1 + (band === 'under' ? 0 : band.startsWith('side') ? 1 : 2) + k * 0.05);
    }
  }
  // spodek jako dva velké díly (není vidět, ušetří vykreslování)
  b.put(gridGeo(P, 0, NS, 0, 5, flipB), '#1d1f22', new THREE.Matrix4(), 0.9);
  b.put(gridGeo(P, 0, NS, 21, 26, flipB), '#1d1f22', new THREE.Matrix4(), 0.9);
  b.put(capGeo(S.ring(0), -L / 2, true), spec.rearCap ?? 'var:body', new THREE.Matrix4(), 2.4);
  b.put(capGeo(S.ring(1), L / 2, false), spec.frontCap ?? 'var:body', new THREE.Matrix4(), 2.4);

  // kabina (skleník) + střecha
  if (spec.cabin) {
    const c = spec.cabin, roof = fn(c.roof), cw = fn(c.hw), n = c.n ?? 2.3;
    const NC = 24, MC = 18;
    const Q = [], R2 = [];
    for (let i = 0; i <= NC; i++) {
      const u = c.u0 + (c.u1 - c.u0) * (i / NC), x = (u - 0.5) * L;
      const yb = S.top(u) - 0.4, yr = Math.max(yb + 0.05, roof(u)), w = cw(u);
      const row = [], row2 = [];
      for (let j = 0; j <= MC; j++) {
        const th = (j / MC) * PI;
        const y = yb + (yr - yb) * Math.pow(Math.sin(th), 2 / n), z = w * spow(Math.cos(th), 2 / n);
        row.push([x, y, z]);
        row2.push([x, yb + (yr - yb + 0.06) * Math.pow(Math.sin(th), 2 / n), z * 1.02]);
      }
      Q.push(row); R2.push(row2);
    }
    const flipC = needFlip(Q, NC / 2, MC / 2);
    if (!c.open) b.put(gridGeo(Q, 0, NC, 0, MC, flipC), 'glass', new THREE.Matrix4(), 6);
    else { // otevřené auto – jen čelní sklo
      const iw = Math.round(NC * (c.windshield ?? 0.3));
      b.put(gridGeo(Q, NC - iw, NC, 0, MC, flipC), 'glass', new THREE.Matrix4(), 6);
    }
    if (c.roofPaint && !c.open) {
      const a0 = Math.round(NC * (c.roofFrom ?? 0.18)), a1 = Math.round(NC * (c.roofTo ?? 0.7));
      b.put(gridGeo(R2, a0, a1, 4, MC - 4, flipC), c.roofPaint, new THREE.Matrix4(), 6.5);
      // sloupky
      b.put(gridGeo(R2, a1, Math.min(NC, a1 + 2), 0, 4, flipC), c.roofPaint, new THREE.Matrix4(), 6.4);
      b.put(gridGeo(R2, a1, Math.min(NC, a1 + 2), MC - 4, MC, flipC), c.roofPaint, new THREE.Matrix4(), 6.4);
    }
  }
  // kola
  const rimKey = wheelGeos(spec.rimStyle ?? 'y');
  for (const w of S.wheels) for (const side of [-1, 1]) {
    const z = side * (S.hw(0.5 + w.x / L) - (spec.tireIn ?? 1.15));
    const m = new THREE.Matrix4().makeScale(w.r, w.r, spec.tireW ?? 2.4);
    if (side < 0) m.premultiply(new THREE.Matrix4().makeRotationY(PI));
    m.setPosition(w.x, w.r, z);
    b.put('tireR', 'rubber', m, 0.2);
    const mr = new THREE.Matrix4().makeScale(w.r, w.r, (spec.tireW ?? 2.4) * 0.92);
    if (side < 0) mr.premultiply(new THREE.Matrix4().makeRotationY(PI));
    mr.setPosition(w.x, w.r, z);
    b.put(rimKey, 'var:rim', mr, 0.3);
    if (spec.caliper) b.at('tile:0.9:0.5:1.2', spec.caliper, w.x + 0.9 * w.r * 0.35, w.r + 0.25 * w.r, z + side * 0.1 * w.r, { rz: 0.5, o: 0.25 });
  }
  // povrchový bod pro detaily: u (0 záď → 1 příď), j index po obvodu (0..M)
  const surf = (u, j) => { const r = S.ring(u)[Math.round(j)]; return V((u - 0.5) * L, r[0], r[1]); };
  const decor = { surf, S, L };
  spec.details?.(b, decor);
  return b;
}

// ------------------------------------------------------------ společné detaily
function wing(b, x, y, w, chord, h, mat = '#1d1f22', o = 20, struts = 2) {
  b.tile(chord, w, 0.25, mat, x, y + h, 0, { o: o + 0.2, rz: 0.05 });
  for (const s of [-1, 1]) b.tile(chord * 1.1, 0.15, 1.1, mat, x, y + h - 0.35, s * w / 2, { o: o + 0.3 });
  const zs = struts === 2 ? [-w * 0.25, w * 0.25] : [0];
  for (const z of zs) b.tile(0.7, 0.25, h, mat, x + chord * 0.1, y, z, { o });
}
function lightStrip(b, p, len, ang, mat = 'light', o = 15, t = 0.18) {
  b.at(`tile:${len}:${t}:${t}`, mat, p.x, p.y, p.z, { ry: ang, o });
}
function exhaust(b, x, y, z, r = 0.38, o = 15) {
  b.at('cyl:16', 'chrome', x, y, z, { rz: PI / 2, sx: r, sy: 0.6, sz: r, o });
  b.at('cyl:16', '#0c0c0c', x - 0.05, y, z, { rz: PI / 2, sx: r * 0.7, sy: 0.62, sz: r * 0.7, o: o + 0.01 });
}
function decal(text, bg, fg, w = 256, h = 128, font = 'bold 84px Arial') {
  const key = 'decal:' + text + bg;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  registerMat(key, new THREE.MeshStandardMaterial({ map: t, transparent: !bg, roughness: 0.35, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }));
  registerGeo('plane', () => new THREE.PlaneGeometry(1, 1));
  return key;
}
function horseshoe(b, x, y, h, o = 16) {
  registerGeo('horseshoe', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0.45); s.lineTo(0.5, 0.45); s.bezierCurveTo(0.6, -0.1, 0.35, -0.55, 0, -0.55); s.bezierCurveTo(-0.35, -0.55, -0.6, -0.1, -0.5, 0.45);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 2 });
    g.rotateY(PI / 2); return g;
  });
  b.at('horseshoe', 'chrome', x, y, 0, { sx: 1, sy: h, sz: h * 1.05, o });
  b.at('horseshoe', '#111', x + 0.06, y, 0, { sx: 1, sy: h * 0.82, sz: h * 0.86, o: o + 0.01 });
}

// ============================================================ MODELY
// 1) Bugatti Chiron – oranžová/černá
export function buildChiron() {
  const b = car({
    L: 45.4, clear: 1.1, wheelR: 3.4, tireW: 2.6,
    top: [[0, 8.0], [0.05, 9.0], [0.18, 9.5], [0.3, 9.3], [0.62, 8.6], [0.8, 8.0], [0.93, 6.6], [1, 4.4]],
    hw: [[0, 9.0], [0.08, 9.9], [0.22, 10.2], [0.45, 9.7], [0.75, 10.0], [0.92, 9.5], [1, 8.0]],
    fender: [[0, 0], [0.2, 0.6], [0.5, 0.1], [0.8, 0.7], [1, 0.2]],
    wheels: [{ u: 0.2 }, { u: 0.8 }],
    cabin: { u0: 0.3, u1: 0.66, roof: [[0.3, 9.3], [0.38, 11.4], [0.48, 12.1], [0.56, 11.6], [0.66, 8.55]], hw: [[0.3, 6.8], [0.5, 7.6], [0.66, 8.0]], roofPaint: '#16181b', roofFrom: 0.15, roofTo: 0.72 },
    rimStyle: 'mesh', caliper: '#1E5AA8',
    paint: (u, band) => (band.startsWith('side') && u > 0.28 && u < 0.5 ? '#16181b' : 'var:body'),
    rearCap: '#16181b',
    details(b, { surf, L }) {
      horseshoe(b, L / 2 + 0.05, 4.4, 2.6);
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const p = surf(0.965, s > 0 ? 9 : 17); b.at('tile:0.5:0.6:0.5', 'light', p.x - 0.2, p.y + 0.2 - k * 0.0, p.z * 0.92 - s * k * 0.75, { o: 16 }); }
      // C-linka – chromovaný oblouk na boku
      for (const s of [-1, 1]) for (let k = 0; k <= 10; k++) {
        const a = -PI / 2 + (k / 10) * PI;
        const u = 0.42 + Math.cos(a) * 0.06 * -1, y = 4.6 + Math.sin(a) * 2.6;
        const p = surf(u, s > 0 ? 7 : 19);
        b.at('ball', 'chrome', p.x, y, p.z + s * 0.25, { sx: 0.35, sy: 0.35, sz: 0.2, o: 17 });
      }
      lightStrip(b, V(-L / 2 - 0.1, 7.2, 0), 0.25, 0, 'tail', 16);
      b.at('tile:0.3:15:0.4', 'tail', -L / 2 - 0.05, 7.0, 0, { o: 16 });
      for (const z of [-1.2, -0.4, 0.4, 1.2]) exhaust(b, -L / 2 - 0.2, 3.0, z, 0.32);
      wing(b, -L / 2 + 3.2, 9.4, 16, 3.4, 1.4, '#16181b');
      for (const s of [-1, 1]) { const p = surf(0.66, s > 0 ? 12 : 14); b.at('tile:1.2:0.4:0.6', '#16181b', p.x, p.y + 0.5, s * 8.6, { o: 18 }); }
    }
  });
  return { pieces: b.pieces, variants: { body: { rough: 0.42, color: '#F57C1F' }, rim: { color: '#1b1c1f', metal: true } } };
}

// 2) Lamborghini Huracán Tecnica – zelená
export function buildHuracan() {
  const b = car({
    L: 45.5, clear: 1.2, wheelR: 3.3,
    top: [[0, 8.0], [0.08, 8.6], [0.24, 8.8], [0.34, 8.8], [0.62, 7.9], [0.8, 7.4], [0.95, 5.6], [1, 3.8]],
    hw: [[0, 9.0], [0.15, 9.65], [0.4, 9.2], [0.72, 9.5], [1, 7.8]], nTop: 3.2,
    fender: [[0, 0], [0.18, 0.4], [0.5, 0], [0.8, 0.35], [1, 0]],
    wheels: [{ u: 0.19 }, { u: 0.8 }],
    cabin: { u0: 0.3, u1: 0.64, roof: [[0.3, 8.8], [0.36, 10.8], [0.46, 11.7], [0.55, 10.6], [0.64, 7.85]], hw: [[0.3, 6.6], [0.5, 7.2], [0.64, 7.6]], roofPaint: 'var:body', roofFrom: 0.2, roofTo: 0.7 },
    rimStyle: 'y',
    paint: (u, band) => (band.startsWith('side') && u > 0.3 && u < 0.46 ? '#16181b' : 'var:body'),
    rearCap: '#16181b',
    details(b, { surf, L }) {
      for (const s of [-1, 1]) { // Y světla
        const p = surf(0.94, s > 0 ? 10 : 16);
        b.at('tile:2.2:0.25:0.22', 'light', p.x - 0.4, p.y + 0.1, p.z * 0.9, { ry: s * 0.5, rz: 0.12, o: 16 });
        b.at('tile:1.2:0.25:0.22', 'light', p.x - 1.0, p.y - 0.35, p.z * 0.85, { ry: s * 0.5, rz: -0.6, o: 16 });
        b.at('tile:1.6:2.2:0.2', '#16181b', L / 2 - 0.4, 2.4, s * 5.6, { ry: s * 0.4, o: 15 });
        b.at('tile:0.4:3:0.7', 'tail', -L / 2 - 0.05, 7.0, s * 5.8, { o: 16 });
      }
      exhaust(b, -L / 2 - 0.3, 6.2, -0.8, 0.45); exhaust(b, -L / 2 - 0.3, 6.2, 0.8, 0.45);
      wing(b, -L / 2 + 2.6, 8.6, 15, 2.6, 0.9, '#16181b');
      b.at('tile:0.3:12:1.2', '#16181b', -L / 2 - 0.02, 3.2, 0, { o: 15 });
    }
  });
  return { pieces: b.pieces, variants: { body: { rough: 0.42, color: '#9BCB1B' }, rim: { color: '#1b1c1f', metal: true } } };
}

// 3) Lamborghini Sián – růžové
export function buildSian() {
  const b = car({
    L: 49.8, clear: 1.1, wheelR: 3.4,
    top: [[0, 8.2], [0.1, 8.6], [0.28, 8.7], [0.6, 7.6], [0.8, 7.1], [0.92, 5.5], [1, 3.5]],
    hw: [[0, 9.6], [0.15, 10.4], [0.42, 9.8], [0.75, 10.0], [1, 8.0]], nTop: 3.4,
    fender: [[0, 0], [0.18, 0.5], [0.5, 0], [0.8, 0.4], [1, 0]],
    wheels: [{ u: 0.19 }, { u: 0.8 }],
    cabin: { u0: 0.3, u1: 0.62, roof: [[0.3, 8.7], [0.37, 10.6], [0.47, 11.3], [0.55, 10.2], [0.62, 7.55]], hw: [[0.3, 6.8], [0.5, 7.4], [0.62, 7.8]], roofPaint: 'var:body', roofFrom: 0.22, roofTo: 0.7 },
    rimStyle: 'y', caliper: '#1b1c1f',
    paint: (u, band) => (band.startsWith('side') && u > 0.32 && u < 0.44 ? '#2a2a2e' : 'var:body'),
    rearCap: '#1d1f22',
    details(b, { surf, L }) {
      for (const s of [-1, 1]) {
        const p = surf(0.95, s > 0 ? 10 : 16);
        b.at('tile:2.4:0.25:0.22', 'light', p.x - 0.4, p.y + 0.15, p.z * 0.9, { ry: s * 0.55, rz: 0.15, o: 16 });
        b.at('tile:1.3:0.25:0.22', 'light', p.x - 1.1, p.y - 0.4, p.z * 0.85, { ry: s * 0.55, rz: -0.7, o: 16 });
        for (let k = 0; k < 3; k++) b.at('tile:0.4:0.9:0.9', 'tail', -L / 2 - 0.05, 7.0, s * (3.2 + k * 1.3), { rx: PI / 4, o: 16 });
      }
      for (let k = 0; k < 6; k++) exhaust(b, -L / 2 - 0.3, 3.0, -2.5 + k, 0.33);
      wing(b, -L / 2 + 3, 8.6, 17, 3.0, 2.6, '#1d1f22');
      const d = decal('SIÁN', '#16181b', '#ffffff', 256, 64, 'bold 46px Arial');
      b.at('plane', d, L / 2 + 0.06, 3.2, 0, { ry: PI / 2, sx: 4, sy: 1, o: 17 });
    }
  });
  return { pieces: b.pieces, variants: { body: { rough: 0.42, color: '#F7A8C8' }, rim: { color: '#D3359D', metal: true } } };
}

// 4) Ferrari Daytona SP3 – červené
export function buildDaytona() {
  const b = car({
    L: 46.9, clear: 1.0, wheelR: 3.35, nTop: 2.4,
    top: [[0, 8.4], [0.08, 8.9], [0.25, 8.9], [0.55, 7.8], [0.8, 7.4], [0.95, 5.5], [1, 3.7]],
    hw: [[0, 9.4], [0.18, 10.25], [0.45, 9.5], [0.78, 10.1], [1, 8.4]],
    fender: [[0, 0.1], [0.2, 1.3], [0.45, 0.2], [0.8, 1.4], [1, 0.3]],
    wheels: [{ u: 0.2 }, { u: 0.8 }],
    cabin: { u0: 0.3, u1: 0.62, roof: [[0.3, 8.8], [0.38, 10.6], [0.47, 11.4], [0.55, 10.4], [0.62, 7.75]], hw: [[0.3, 6.6], [0.5, 7.6], [0.62, 7.9]], roofPaint: '#141517', roofFrom: 0.18, roofTo: 0.72 },
    rimStyle: 'five', caliper: '#F5C518',
    paint: () => 'var:body',
    rearCap: '#141517',
    details(b, { surf, L }) {
      for (let k = 0; k < 7; k++) b.at('tile:0.5:13:0.25', '#141517', -L / 2 + 2 + k * 1.1, 9.0 - k * 0.02, 0, { o: 18 + k * 0.05 }); // žaluzie
      b.at('tile:0.3:16:0.35', 'tail', -L / 2 - 0.05, 7.6, 0, { o: 16 });
      for (const s of [-1, 1]) {
        const p = surf(0.965, s > 0 ? 9 : 17);
        b.at('tile:2.6:0.28:0.25', 'light', p.x - 0.5, p.y + 0.6, p.z * 0.86, { ry: s * 0.35, o: 16 });
        b.at('ball', '#141517', -L / 2 + 13.5, 5.0, s * 9.6, { sx: 2.4, sy: 1.2, sz: 0.4, o: 16 }); // boční nasávání
      }
      exhaust(b, -L / 2 - 0.3, 3.2, -1.2, 0.42); exhaust(b, -L / 2 - 0.3, 3.2, 1.2, 0.42);
      b.at('tile:2:12:0.3', '#141517', L / 2 - 1, 1.8, 0, { o: 15 });
    }
  });
  return { pieces: b.pieces, variants: { body: { rough: 0.42, color: '#D01012' }, rim: { color: '#C9CCD0', metal: true } } };
}

// 5) McLaren P1 – žluto-oranžová s černou
export function buildMcLaren() {
  const b = car({
    L: 45.9, clear: 1.0, wheelR: 3.3, nTop: 2.6,
    top: [[0, 8.6], [0.1, 9.0], [0.26, 8.8], [0.56, 7.8], [0.8, 7.3], [0.95, 5.4], [1, 3.7]],
    hw: [[0, 9.0], [0.18, 9.75], [0.45, 9.0], [0.78, 9.6], [1, 7.8]],
    fender: [[0, 0], [0.2, 0.9], [0.45, 0], [0.8, 1.0], [1, 0.2]],
    wheels: [{ u: 0.2 }, { u: 0.8 }],
    cabin: { u0: 0.28, u1: 0.66, roof: [[0.28, 8.8], [0.36, 11.0], [0.46, 11.9], [0.56, 11.2], [0.66, 7.65]], hw: [[0.28, 5.6], [0.46, 6.6], [0.66, 7.4]], roofPaint: '#16181b', roofFrom: 0.1, roofTo: 0.7 },
    rimStyle: 'mesh', caliper: '#F5C518',
    paint: (u, band) => (band.startsWith('side') && u > 0.28 && u < 0.46 ? '#16181b' : 'var:body'),
    rearCap: '#16181b',
    details(b, { surf, L }) {
      for (const s of [-1, 1]) { // „bumerangová“ světla
        const p = surf(0.95, s > 0 ? 10 : 16);
        b.at('tile:2.0:0.28:0.25', 'light', p.x - 0.6, p.y + 0.2, p.z * 0.88, { ry: s * 0.6, rz: 0.4, o: 16 });
        b.at('tile:1.4:0.28:0.25', 'light', p.x - 0.4, p.y - 0.4, p.z * 0.9, { ry: s * 0.6, rz: -0.5, o: 16 });
        b.at('tile:0.25:0.3:3.2', 'tail', -L / 2 - 0.05, 7.0, s * 8.0, { rx: 0.8 * s, o: 16 });
      }
      b.at('tile:0.25:16:0.25', 'tail', -L / 2 - 0.05, 8.4, 0, { o: 16 });
      exhaust(b, -L / 2 - 0.3, 6.8, 0, 0.75);
      wing(b, -L / 2 + 2.4, 8.9, 15.5, 3.2, 1.7, '#16181b');
      b.at('tile:2:13:0.3', '#16181b', L / 2 - 1, 1.6, 0, { o: 15 });
    }
  });
  return { pieces: b.pieces, variants: { body: { rough: 0.42, color: '#F6A81C' }, rim: { color: '#2b2d31', metal: true } } };
}

// 6) Mercedes-AMG G 63 + SL 63 – dvojbalení
function buildG63() {
  return car({
    L: 48.7, clear: 2.4, wheelR: 4.0, tireW: 2.8, nTop: 12, nBot: 10,
    top: [[0, 11.2], [0.04, 11.6], [0.68, 11.6], [0.72, 11.0], [0.97, 10.8], [1, 9.8]],
    hw: [[0, 9.4], [0.05, 9.9], [0.95, 9.9], [1, 9.4]], belt: 0.55,
    wheels: [{ u: 0.18 }, { u: 0.82 }],
    cuts: [0, 0.12, 0.3, 0.5, 0.71, 0.86, 1],
    cabin: { u0: 0.02, u1: 0.71, n: 9, roof: [[0.02, 19.0], [0.05, 19.7], [0.64, 19.7], [0.71, 11.4]], hw: [[0.02, 9.0], [0.71, 8.8]], roofPaint: 'var:g', roofFrom: 0.03, roofTo: 0.88 },
    rimStyle: 'five', tireIn: 1.0, paint: () => 'var:g', rearCap: 'var:g', frontCap: '#141517',
    details(b, { L }) {
      for (const s of [-1, 1]) {
        b.at('cyl:20', 'light', L / 2 + 0.05, 9.0, s * 7.4, { rz: PI / 2, sx: 1.1, sy: 0.3, sz: 1.1, o: 16 });
        b.at('tile:0.6:1.4:3', 'tail', -L / 2 - 0.05, 9.6, s * 8.6, { o: 16 });
        exhaust(b, 0.2 * L, 2.6, s * 9.9, 0.4);
        b.at('tile:3.6:1.2:0.6', '#2b2d31', L * 0.33, 6.0, s * 10.1, { o: 15 }); // lemy blatníků
        b.at('tile:3.6:1.2:0.6', '#2b2d31', -L * 0.33, 6.0, s * 10.1, { o: 15 });
      }
      for (let k = 0; k < 9; k++) b.at('tile:0.25:0.35:3.2', 'chrome', L / 2 + 0.05, 8.6, -3.2 + k * 0.8, { o: 17 });
      b.at('cyl:24', 'rubber', -L / 2 - 1.3, 9.5, 0, { rz: PI / 2, sx: 3.6, sy: 2.4, sz: 3.6, o: 17 }); // rezerva
      b.at('cyl:24', '#141517', -L / 2 - 2.6, 9.5, 0, { rz: PI / 2, sx: 3.0, sy: 0.2, sz: 3.0, o: 17.1 });
    }
  });
}
function buildSL63() {
  return car({
    L: 47.0, clear: 1.2, wheelR: 3.3,
    top: [[0, 8.8], [0.12, 9.3], [0.3, 9.2], [0.55, 8.6], [0.8, 7.6], [0.95, 6.8], [1, 5.6]],
    hw: [[0, 9.0], [0.2, 9.6], [0.5, 9.3], [0.8, 9.55], [1, 8.0]],
    fender: [[0, 0], [0.2, 0.6], [0.5, 0], [0.8, 0.5], [1, 0]],
    wheels: [{ u: 0.19 }, { u: 0.8 }],
    cabin: { u0: 0.3, u1: 0.56, open: true, windshield: 0.32, roof: [[0.3, 9.4], [0.4, 12.6], [0.48, 13.2], [0.56, 8.6]], hw: [[0.3, 7.4], [0.56, 8.2]] },
    rimStyle: 'y', paint: () => 'var:body', rearCap: 'var:body',
    details(b, { L }) {
      b.tile(9, 15, 0.3, '#141517', -L * 0.05, 9.0, 0, { o: 14 });
      for (const s of [-1, 1]) {
        b.tile(2.4, 4.4, 2.8, '#141517', -L * 0.03, 9.2, s * 3.2, { o: 15 }); // sedadla
        b.tile(0.8, 4.2, 3.4, '#141517', -L * 0.09, 9.2, s * 3.2, { rz: -0.25, o: 15.1 });
        b.at('tile:2.2:0.3:0.3', 'light', L / 2 - 0.5, 6.0, s * 6.3, { ry: s * 0.35, o: 16 });
        b.at('tile:0.3:3:0.5', 'tail', -L / 2 - 0.05, 7.6, s * 5.8, { o: 16 });
        exhaust(b, -L / 2 - 0.3, 3.0, s * 4.2, 0.4);
      }
      for (let k = 0; k < 11; k++) b.at('tile:0.25:0.3:2.6', 'chrome', L / 2 + 0.05, 4.6, -3.0 + k * 0.6, { o: 17 });
    }
  });
}
export function buildMercedes() {
  const g = buildG63(), s = buildSL63();
  const pieces = [];
  g.pieces.forEach(p => { p.m.premultiply(new THREE.Matrix4().makeTranslation(-1.2, 0, -11.5)); pieces.push(p); });
  s.pieces.forEach(p => { p.m.premultiply(new THREE.Matrix4().makeTranslation(1.2, 0, 11.5)); p.order += 0.3; pieces.push(p); });
  return { pieces, variants: { body: { rough: 0.42, color: '#F5C518' }, g: { color: '#1a1b1e' }, rim: { color: '#3a3d42', metal: true } } };
}

// 7) Bugatti Vision Gran Turismo – modrá
export function buildVisionGT() {
  const b = car({
    L: 46, clear: 0.9, wheelR: 3.3, nTop: 2.4,
    top: [[0, 7.8], [0.1, 8.4], [0.3, 8.6], [0.58, 7.4], [0.8, 7.0], [0.92, 5.2], [1, 3.4]],
    hw: [[0, 9.8], [0.2, 10.5], [0.45, 9.6], [0.78, 10.4], [1, 8.4]],
    fender: [[0, 0.2], [0.2, 1.2], [0.45, 0.1], [0.8, 1.2], [1, 0.2]],
    wheels: [{ u: 0.2 }, { u: 0.8 }],
    cabin: { u0: 0.32, u1: 0.62, roof: [[0.32, 8.6], [0.4, 10.0], [0.48, 10.5], [0.56, 9.6], [0.62, 7.35]], hw: [[0.32, 5.8], [0.5, 6.4], [0.62, 6.8]], roofPaint: 'var:dark', roofFrom: 0.18, roofTo: 0.75 },
    rimStyle: 'mesh', caliper: '#C91A09',
    paint: (u, band) => (band.startsWith('side') ? (u < 0.5 ? 'var:dark' : 'var:body') : u < 0.3 ? 'var:dark' : 'var:body'),
    rearCap: 'var:dark',
    details(b, { surf, L }) {
      horseshoe(b, L / 2 + 0.05, 3.4, 2.4);
      for (const s of [-1, 1]) {
        for (let k = 0; k < 4; k++) { const p = surf(0.95, s > 0 ? 9 : 17); b.at('tile:0.4:0.5:0.4', 'light', p.x - 0.3, p.y + 0.3, p.z * 0.9 - s * k * 0.6, { o: 16 }); }
        const d = decal('16', '#ffffff', '#16181b', 128, 128, 'bold 90px Arial');
        b.at('plane', d, -2, 4.6, s * 10.05, { ry: s > 0 ? 0 : PI, sx: 3.2, sy: 3.2, o: 18 });
      }
      b.at('tile:0.3:17:0.35', 'tail', -L / 2 - 0.05, 6.6, 0, { o: 16 });
      for (const z of [-0.8, 0.8]) exhaust(b, -L / 2 - 0.3, 2.6, z, 0.45);
      wing(b, -L / 2 + 2.4, 8.2, 19, 3.6, 3.0, 'var:dark');
      b.at('tile:2.6:16:0.3', 'var:dark', L / 2 - 1.2, 1.4, 0, { o: 15 });
    }
  });
  return { pieces: b.pieces, variants: { body: { rough: 0.42, color: '#3F9BE8' }, dark: { color: '#0E2A55' }, rim: { color: '#2b2d31', metal: true } } };
}
