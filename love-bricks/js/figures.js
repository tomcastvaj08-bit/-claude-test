// Love Bricks – panáček složený z originálních dílků figurky (LDraw):
// boky, nohy, trup, ruce, dlaně, hlava a vlasy. Potisk košile a obličeje je namalovaný
// podle předlohy (policista ve světle modré košili s vysílačkou a odznakem).
import * as THREE from 'three';

const PI = Math.PI;
const COL = { shirt: '#9FC3E9', legs: '#1E2C4A', skin: '#F2CD37', hair: '#6B3018' };
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.22, side: THREE.DoubleSide, ...extra });

// ---------- sada dílků ----------
let KIT = null;
export async function loadFigureKit(url = new URL('../models/figure.json', import.meta.url).href) {
  if (KIT) return KIT;
  const raw = await (await fetch(url)).json();
  const dec = (s, T) => { const b = Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); return new T(b.buffer); };
  const G = (p) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(dec(p.pos, Float32Array), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(dec(p.nrm, Float32Array), 3));
    g.setIndex(new THREE.BufferAttribute(dec(p.idx, Uint32Array), 1));
    g.computeBoundingBox();
    return g;
  };
  const geos = {}; for (const [k, v] of Object.entries(raw.parts)) geos[k] = G(v);
  geos.hair = G(Object.values(raw.hairs)[0]);
  const S = new THREE.Matrix4().makeScale(1 / 20, -1 / 20, -1 / 20); // LDU → výstupky, Y nahoru
  const asm = {};
  for (const [k, a] of Object.entries(raw.assembly)) {
    asm[k] = S.clone().multiply(new THREE.Matrix4().set(a[3], a[4], a[5], a[0], a[6], a[7], a[8], a[1], a[9], a[10], a[11], a[2], 0, 0, 0, 1));
  }
  // přední stěna trupu 973: rovina z = −10, nahoře x ±14 (y = 0), dole x ±19 (y = 32)
  geos.torsoPrint = (() => {
    const pos = [-14, 0, -10.06, 14, 0, -10.06, 19, 32, -10.06, -19, 32, -10.06];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([5 / 38, 1, 33 / 38, 1, 1, 0, 0, 0], 2));
    g.setIndex([0, 2, 1, 0, 3, 2]);
    return g;
  })();
  geos.facePrint = printGeo(geos.head, 'cyl');
  KIT = { geos, asm, textures: { torso: torsoTex(), face: faceTex(false), faceHappy: faceTex(true) } };
  return KIT;
}

// z geometrie dílku vybere přední plochy a dopočítá UV pro potisk
function printGeo(src, mode) {
  const p = src.attributes.position, n = src.attributes.normal, idx = src.index.array;
  let bb = src.boundingBox;
  if (mode === 'planar') { // hranice jen z přední stěny
    const b = new THREE.Box3();
    for (let t = 0; t < idx.length; t += 3) { let nz = 0; for (let k = 0; k < 3; k++) nz += n.getZ(idx[t + k]); if (nz / 3 <= -0.75) for (let k = 0; k < 3; k++) b.expandByPoint(new THREE.Vector3(p.getX(idx[t + k]), p.getY(idx[t + k]), p.getZ(idx[t + k]))); }
    bb = b;
  }
  let ys = Infinity, ye = -Infinity;
  if (mode === 'cyl') for (let i = 0; i < p.count; i++) if (Math.abs(n.getY(i)) < 0.2) { ys = Math.min(ys, p.getY(i)); ye = Math.max(ye, p.getY(i)); }
  const pos = [], nrm = [], uv = [];
  for (let t = 0; t < idx.length; t += 3) {
    let nz = 0, ny = 0;
    for (let k = 0; k < 3; k++) { nz += n.getZ(idx[t + k]); ny += n.getY(idx[t + k]); }
    nz /= 3; ny /= 3;
    if (mode === 'planar' && nz > -0.75) continue;                       // přední stěna trupu (v LDraw míří do −z)
    if (mode === 'cyl' && (nz > -0.05 || Math.abs(ny) > 0.3)) continue;  // přední polovina válce hlavy
    for (let k = 0; k < 3; k++) {
      const i = idx[t + k], x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const f = mode === 'planar' ? 0.06 : 0.04; // lehce před povrch
      pos.push(x + n.getX(i) * f, y + n.getY(i) * f, z + n.getZ(i) * f);
      nrm.push(n.getX(i), n.getY(i), n.getZ(i));
      if (mode === 'planar') uv.push((x - bb.min.x) / (bb.max.x - bb.min.x), 1 - (y - bb.min.y) / (bb.max.y - bb.min.y));
      else uv.push(0.5 + Math.atan2(x, -z) / PI, 1 - (y - ys) / (ye - ys));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ---------- potisk košile (celá přední stěna trupu; nahoře je trup užší) ----------
function torsoTex() {
  // přední stěna trupu: nahoře cca 60 % šířky spodku, prvky držíme uvnitř lichoběžníku
  return canvasTex(800, 640, (g, W) => {
    const ink = '#1d2a44', shade = 'rgba(40,70,120,.35)';
    g.fillStyle = COL.shirt; g.fillRect(0, 0, W, 640);
    // zelené tričko a límeček
    g.fillStyle = '#B8D25A'; g.beginPath(); g.moveTo(320, 0); g.lineTo(480, 0); g.lineTo(400, 150); g.closePath(); g.fill();
    g.fillStyle = '#B5D4F2'; g.strokeStyle = ink; g.lineWidth = 8;
    g.beginPath(); g.moveTo(240, 0); g.lineTo(325, 0); g.lineTo(400, 150); g.lineTo(285, 112); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(560, 0); g.lineTo(475, 0); g.lineTo(400, 150); g.lineTo(515, 112); g.closePath(); g.fill(); g.stroke();
    // léga s knoflíky
    g.strokeStyle = shade; g.lineWidth = 6; g.beginPath(); g.moveTo(400, 150); g.lineTo(400, 530); g.stroke();
    g.fillStyle = ink; for (const y of [260, 360, 460]) { g.beginPath(); g.arc(414, y, 8, 0, 7); g.fill(); }
    // náprsní kapsa vlevo
    g.strokeStyle = ink; g.lineWidth = 8;
    g.strokeRect(200, 200, 150, 150);
    g.beginPath(); g.moveTo(192, 200); g.lineTo(358, 200); g.lineTo(358, 246); g.lineTo(275, 270); g.lineTo(192, 246); g.closePath(); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(275, 252, 9, 0, 7); g.fill();
    // vysílačka s mřížkou a kroucenou šňůrou
    g.fillStyle = '#4f5359'; g.beginPath(); g.ellipse(455, 265, 74, 70, -0.3, 0, 7); g.fill();
    g.fillStyle = '#a3a9b1'; g.beginPath(); g.ellipse(455, 265, 60, 56, -0.3, 0, 7); g.fill();
    g.strokeStyle = '#3c4046'; g.lineWidth = 6;
    for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(455 + k * 15 - 32, 265 - 42 + Math.abs(k) * 4); g.lineTo(455 + k * 15 + 22, 265 + 42 - Math.abs(k) * 4); g.stroke(); }
    g.strokeStyle = '#4d5157'; g.lineWidth = 8;
    g.beginPath(); for (let k = 0; k <= 30; k++) { const t = k / 30; const x = 400 - t * 230 + Math.sin(k * 1.6) * 11, y = 320 + t * 215; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    // zlatý odznak s hvězdou
    g.fillStyle = '#C9A14A'; g.strokeStyle = '#7a5a1c'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(518, 170); g.lineTo(600, 180); g.lineTo(606, 268); g.quadraticCurveTo(562, 322, 520, 274); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#EED07A';
    g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + (k * PI) / 5, r = k % 2 ? 16 : 36; const x = 562 + Math.cos(a) * r, y = 232 + Math.sin(a) * r; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill();
    // stíny po stranách dole
    g.fillStyle = 'rgba(15,25,45,.85)';
    g.beginPath(); g.moveTo(30, 552); g.lineTo(150, 450); g.lineTo(175, 500); g.lineTo(110, 552); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(770, 552); g.lineTo(650, 450); g.lineTo(625, 500); g.lineTo(690, 552); g.closePath(); g.fill();
    // hnědý opasek s přezkou a pouzdrem
    g.fillStyle = '#8A5A2B'; g.fillRect(0, 545, W, 70);
    g.strokeStyle = '#5a3818'; g.lineWidth = 6; g.strokeRect(0, 545, W, 70);
    g.fillStyle = '#C9CCD0'; g.strokeStyle = '#6b6f75'; g.lineWidth = 7;
    g.fillRect(335, 536, 130, 88); g.strokeRect(335, 536, 130, 88);
    g.fillStyle = '#8A5A2B'; g.fillRect(366, 560, 68, 40);
    g.fillStyle = '#7a4c22'; g.strokeStyle = '#5a3818'; g.fillRect(505, 530, 92, 96); g.strokeRect(505, 530, 92, 96);
    g.fillStyle = '#C9CCD0'; g.beginPath(); g.arc(551, 556, 9, 0, 7); g.fill();
    g.fillStyle = COL.legs; g.fillRect(0, 615, W, 25);
  });
}

// ---------- potisk obličeje ----------
function faceTex(happy) {
  return canvasTex(512, 384, (g) => {
    const ink = '#141414';
    g.translate(0, 34);
    // rezavé obočí (pravé výš)
    g.strokeStyle = '#8A3A16'; g.lineWidth = 18;
    g.beginPath(); g.moveTo(158, 112); g.quadraticCurveTo(194, 94, 232, 106); g.stroke();
    g.beginPath(); g.moveTo(282, 98); g.quadraticCurveTo(318, 80, 354, 96); g.stroke();
    // oči s odleskem
    for (const x of [196, 316]) {
      g.fillStyle = ink; g.beginPath(); g.ellipse(x, 160, 25, 32, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 8, 147, 8.5, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(140,90,20,.6)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(150, 152); g.lineTo(138, 164); g.stroke(); g.beginPath(); g.moveTo(362, 152); g.lineTo(374, 164); g.stroke();
    // úšklebek do strany
    g.strokeStyle = ink; g.lineWidth = 13;
    g.beginPath(); g.moveTo(196, 238); g.quadraticCurveTo(268, happy ? 300 : 282, 336, 222); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(336, 222); g.lineTo(350, 212); g.stroke();
    g.strokeStyle = 'rgba(140,90,20,.6)'; g.lineWidth = 5;
    g.beginPath(); g.arc(362, 234, 16, -0.4, 1.2); g.stroke();
    g.beginPath(); g.moveTo(248, 300); g.quadraticCurveTo(264, 307, 280, 300); g.stroke();
  });
}

export class Figure {
  constructor() {
    if (!KIT) throw new Error('Nejdřív zavolej loadFigureKit()');
    const { geos, asm, textures } = KIT;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    const mShirt = std(COL.shirt), mLegs = std(COL.legs), mSkin = std(COL.skin), mHair = std(COL.hair, { roughness: 0.35 });
    const mPrint = new THREE.MeshStandardMaterial({ map: textures.torso, roughness: 0.22, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
    this.faceMat = new THREE.MeshStandardMaterial({ map: textures.face, transparent: true, roughness: 0.22, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
    this.faces = textures;
    const part = (geo, mat, M, parent, pivot) => {
      const mesh = new THREE.Mesh(geo, mat); mesh.matrixAutoUpdate = false;
      const m = M.clone(); if (pivot) m.premultiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
      mesh.matrix.copy(m); parent.add(mesh); return mesh;
    };
    const posOf = (M) => new THREE.Vector3().setFromMatrixPosition(M);
    // nohy (otáčí se v kyčli)
    this.legs = [];
    for (const k of ['legR', 'legL']) {
      const pv = posOf(asm[k]); const g = new THREE.Group(); g.position.copy(pv); this.body.add(g);
      part(geos[k], mLegs, asm[k], g, pv); this.legs.push(g);
    }
    part(geos.hips, mLegs, asm.hips, this.body);
    part(geos.torso, mShirt, asm.torso, this.body);
    part(geos.torsoPrint, mPrint, asm.torso, this.body);
    // hlava s obličejem a vlasy
    const hp = posOf(asm.head);
    this.head = new THREE.Group(); this.head.position.copy(hp); this.body.add(this.head);
    part(geos.head, mSkin, asm.head, this.head, hp);
    part(geos.facePrint, this.faceMat, asm.head, this.head, hp);
    part(geos.hair, mHair, asm.hair, this.head, hp);
    // ruce: rameno (otáčí se) → paže → dlaň (otáčí se v zápěstí)
    this.arms = [];
    for (const [arm, hand] of [['armL', 'handL'], ['armR', 'handR']]) {
      const sp = posOf(asm[arm]);
      const shoulder = new THREE.Group(); shoulder.position.copy(sp); this.body.add(shoulder);
      part(geos[arm], mShirt, asm[arm], shoulder, sp);
      const wp = posOf(asm[hand]);
      const wrist = new THREE.Group(); wrist.position.copy(wp).sub(sp); shoulder.add(wrist);
      part(geos.hand, mSkin, asm[hand], wrist, wp);
      this.arms.push({ shoulder, wrist, elbow: new THREE.Object3D() });
    }
    // chodidla na zem
    this.body.updateMatrixWorld(true);
    this.base = -new THREE.Box3().setFromObject(this.body).min.y;
    this.hearts = [];
    this.state = { show: false, point: false, love: false, side: 1, wave: 0 };
    this.anim = { show: 0, point: 0, love: 0, jump: 0 };
    this.root.scale.setScalar(0.0001);
  }

  set(k, v) {
    if (this.state[k] === v) return;
    this.state[k] = v;
    if (k === 'love') { this.faceMat.map = v ? this.faces.faceHappy : this.faces.face; this.faceMat.needsUpdate = true; if (v) this.anim.jump = 1; }
  }
  wave() { this.state.wave = 1.8; this.anim.jump = 1; }

  update(dt, t) {
    const A = this.anim, S = this.state;
    const ap = (c, tg, sp) => c + (tg - c) * (1 - Math.exp(-sp * dt));
    A.show = ap(A.show, S.show ? 1 : 0, 7);
    A.point = ap(A.point, S.point ? 1 : 0, 6);
    A.love = ap(A.love, S.love ? 1 : 0, 5);
    const sh = A.show;
    this.root.scale.setScalar(sh < 0.001 ? 0.0001 : sh * (1 + Math.sin(sh * PI) * 0.15));
    this.root.visible = sh > 0.002;
    if (A.jump > 0) A.jump = Math.max(0, A.jump - dt * 1.8);
    const jump = A.jump > 0 ? Math.sin((1 - A.jump) * PI) * 0.5 : 0;
    this.body.position.y = this.base + jump + Math.sin(t * 2.1) * 0.02;
    const side = S.side;
    this.body.rotation.y = side * (0.12 + A.point * 0.4);
    this.head.rotation.y = side * A.point * 0.25 + Math.sin(t * 0.9) * 0.1;
    // [0] = levá ruka (+x), [1] = pravá ruka (−x)
    const [L, Rt] = this.arms;
    const pointArm = side > 0 ? L : Rt, other = side > 0 ? Rt : L;
    pointArm.shoulder.rotation.x = -A.point * 1.45;
    other.shoulder.rotation.x = Math.sin(t * 1.4) * 0.05;
    if (S.wave > 0) {
      S.wave = Math.max(0, S.wave - dt);
      const w = Math.min(1, S.wave * 2);
      Rt.shoulder.rotation.x = -w * 2.9;
      Rt.wrist.rotation.z = Math.sin(t * 12) * 0.5 * w;
    }
  }
}
