// Love Bricks – panáček složený z originálních dílků figurky (LDraw):
// boky, nohy, trup, ruce, dlaně, hlava a vlasy. Potisk košile a obličeje je namalovaný
// podle předlohy (policista ve světle modré košili s vysílačkou a odznakem).
import * as THREE from 'three';

const PI = Math.PI;
const COL = { shirt: '#F4F4F2', legs: '#1E2C4A', skin: '#F2CD37', hair: '#6B3018' };
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
  // obličej: hladký válec těsně nad povrchem hlavy (bez švů) – v LDraw míří obličej do −z, osa Y dolů
  geos.facePrint = (() => {
    const p = geos.head.attributes.position, n = geos.head.attributes.normal;
    let ys = Infinity, ye = -Infinity, r = 0;
    for (let i = 0; i < p.count; i++) if (Math.abs(n.getY(i)) < 0.2) { ys = Math.min(ys, p.getY(i)); ye = Math.max(ye, p.getY(i)); r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i))); }
    const g = new THREE.CylinderGeometry(r + 0.1, r + 0.1, ye - ys, 64, 1, true, PI / 2, PI);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 1 - uv.getX(i), 1 - uv.getY(i));
    g.translate(0, (ys + ye) / 2, 0);
    return g;
  })();
  KIT = { geos, asm, textures: { torso: torsoTex(), face: faceTex(false), faceHappy: faceTex(true) } };
  return KIT;
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
  // obyčejné bílé tričko s kulatým výstřihem
  return canvasTex(800, 640, (g, W) => {
    g.fillStyle = COL.shirt; g.fillRect(0, 0, W, 640);
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 10;
    g.beginPath(); g.ellipse(400, 0, 92, 58, 0, 0, PI); g.stroke();
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
    // úšklebek do strany
    g.strokeStyle = ink; g.lineWidth = 13;
    g.beginPath(); g.moveTo(196, 238); g.quadraticCurveTo(268, happy ? 300 : 282, 336, 222); g.stroke();

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
