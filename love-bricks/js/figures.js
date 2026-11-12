// Love Bricks – kostičkoví panáčci: blondýnka v růžových šatech a kluk s tetováním kotvy.
// Proporce podle klasické figurky (výška ~4 jednotky, 1 j. ≈ 1 cm figurky).
import * as THREE from 'three';
import { getGeo } from './models.js';

const SKIN = '#F2C531';
const PI = Math.PI;
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.28, ...extra });

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function heartPath(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + 9 * s);
  g.bezierCurveTo(x - 4 * s, y + 5 * s, x - 12 * s, y + 1 * s, x - 12 * s, y - 5 * s);
  g.bezierCurveTo(x - 12 * s, y - 11 * s, x - 4 * s, y - 13 * s, x, y - 7 * s);
  g.bezierCurveTo(x + 4 * s, y - 13 * s, x + 12 * s, y - 11 * s, x + 12 * s, y - 5 * s);
  g.bezierCurveTo(x + 12 * s, y + 1 * s, x + 4 * s, y + 5 * s, x, y + 9 * s); g.fill();
}

// ---------- obličej (potisk) ----------
function faceTex({ girl, love }) {
  return canvasTex(512, 320, (g) => {
    const ink = '#1d1a1a';
    const eye = (x, flip) => {
      if (love) { g.fillStyle = '#E0182D'; heartPath(g, x, 150, 2.6); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x - 10, 136, 6, 0, 7); g.fill(); return; }
      g.fillStyle = ink; g.beginPath(); g.ellipse(x, 152, 25, 31, 0, 0, 7); g.fill();
      g.fillStyle = girl ? '#5a3a8a' : '#3b4f8f'; g.beginPath(); g.ellipse(x, 160, 18, 20, 0, 0, 7); g.fill();
      g.fillStyle = ink; g.beginPath(); g.ellipse(x, 158, 12, 14, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 9, 138, 10, 0, 7); g.fill();
      g.beginPath(); g.arc(x - 8, 166, 4.5, 0, 7); g.fill();
      if (girl) { // řasy
        g.strokeStyle = ink; g.lineWidth = 6;
        for (const [dx, dy] of [[-20, -10], [-10, -18], [2, -21]]) { g.beginPath(); g.moveTo(x + flip * dx * 0.9, 126 + dy * 0.15); g.lineTo(x + flip * (dx - 12), 122 + dy); g.stroke(); }
      }
    };
    eye(196, -1); eye(316, 1);
    g.strokeStyle = girl ? '#7a4a12' : '#3a2512'; g.lineWidth = girl ? 7 : 10;
    g.lineWidth = girl ? 5 : 7;
    g.beginPath(); g.moveTo(172, 96); g.quadraticCurveTo(196, 82, 220, 92); g.stroke();
    g.beginPath(); g.moveTo(292, 92); g.quadraticCurveTo(316, 82, 340, 96); g.stroke();
    // tváře
    g.fillStyle = girl || love ? 'rgba(255,105,140,.45)' : 'rgba(230,120,60,.18)';
    g.fillStyle = 'rgba(255,105,140,.5)';
    g.beginPath(); g.ellipse(146, 214, 34, 19, 0, 0, 7); g.ellipse(366, 214, 34, 19, 0, 0, 7); g.fill();
    if (!girl) { // pihy
      g.fillStyle = 'rgba(150,80,20,.55)';
      for (const [x, y] of [[140, 198], [156, 206], [146, 216], [356, 198], [372, 206], [362, 216]]) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
    }
    // pusa
    if (love) {
      g.fillStyle = ink; g.beginPath(); g.moveTo(206, 222); g.quadraticCurveTo(256, 300, 306, 222); g.closePath(); g.fill();
      g.fillStyle = '#ff7c93'; g.beginPath(); g.ellipse(256, 262, 26, 13, 0, 0, 7); g.fill();
    } else if (girl) {
      g.fillStyle = '#e0406a'; g.beginPath(); g.moveTo(230, 230); g.quadraticCurveTo(256, 262, 282, 230); g.quadraticCurveTo(256, 240, 230, 230); g.fill();
    } else {
      g.fillStyle = ink; g.beginPath(); g.moveTo(222, 226); g.quadraticCurveTo(256, 276, 290, 226); g.closePath(); g.fill();
      g.fillStyle = '#ff8fa3'; g.beginPath(); g.ellipse(256, 250, 15, 8, 0, 0, 7); g.fill();
    }
  });
}

// ---------- potisk trupu ----------
function torsoTex(girl) {
  return canvasTex(256, 256, (g, w, h) => {
    if (girl) {
      g.fillStyle = '#F06EAA'; g.fillRect(0, 0, w, h);
      // výstřih a ramínka
      g.fillStyle = SKIN; g.beginPath(); g.moveTo(70, 0); g.quadraticCurveTo(128, 90, 186, 0); g.fill();
      g.strokeStyle = '#d14b8c'; g.lineWidth = 6; g.beginPath(); g.moveTo(70, 0); g.quadraticCurveTo(128, 90, 186, 0); g.stroke();
      // náhrdelník se srdíčkem
      g.strokeStyle = '#f7e2a0'; g.lineWidth = 4; g.beginPath(); g.moveTo(84, 4); g.quadraticCurveTo(128, 70, 172, 4); g.stroke();
      g.fillStyle = '#E0182D'; heartPath(g, 128, 72, 0.9);
      // pas s mašlí
      g.fillStyle = '#fff'; g.fillRect(0, 196, w, 22);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(128, 207); g.lineTo(100, 190); g.lineTo(100, 226); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(128, 207); g.lineTo(156, 190); g.lineTo(156, 226); g.closePath(); g.fill();
      g.fillStyle = '#ffd4e7'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(30 + (i % 3) * 90 + (i > 2 ? 40 : 0), 110 + Math.floor(i / 3) * 30, 4, 0, 7); g.fill(); }
    } else {
      g.fillStyle = '#1F3A5F'; g.fillRect(0, 0, w, h);
      g.fillStyle = SKIN; g.beginPath(); g.moveTo(92, 0); g.lineTo(128, 52); g.lineTo(164, 0); g.fill();
      g.strokeStyle = '#2d5180'; g.lineWidth = 7; g.beginPath(); g.moveTo(92, 0); g.lineTo(128, 52); g.lineTo(164, 0); g.stroke();
      // srdce na hrudi
      g.fillStyle = '#E0182D'; heartPath(g, 170, 120, 1.4);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.beginPath(); g.moveTo(128, 60); g.lineTo(128, 256); g.stroke();
    }
  });
}
function tattooTex() {
  return canvasTex(128, 128, (g) => {
    g.strokeStyle = '#1d3a6b'; g.fillStyle = '#1d3a6b'; g.lineWidth = 7;
    g.beginPath(); g.arc(64, 22, 10, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(64, 32); g.lineTo(64, 108); g.stroke();
    g.beginPath(); g.moveTo(40, 50); g.lineTo(88, 50); g.stroke();
    g.beginPath(); g.arc(64, 72, 36, 0.15 * PI, 0.85 * PI); g.stroke();
    g.beginPath(); g.moveTo(26, 82); g.lineTo(36, 94); g.lineTo(24, 98); g.fill();
    g.beginPath(); g.moveTo(102, 82); g.lineTo(92, 94); g.lineTo(104, 98); g.fill();
    g.fillStyle = '#c4202f'; heartPath(g, 64, 70, 0.5);
  });
}

// ---------- geometrie dílů ----------
const G = (() => {
  // trup – lichoběžník s mírným zúžením do hloubky
  const torso = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.78, 0); s.lineTo(0.78, 0); s.lineTo(0.6, 1.28); s.lineTo(-0.6, 1.28); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.74, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    g.translate(0, 0, -0.37); return g;
  })();
  const torsoFront = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.78, 0); s.lineTo(0.78, 0); s.lineTo(0.6, 1.28); s.lineTo(-0.6, 1.28); s.closePath();
    const g = new THREE.ShapeGeometry(s);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.78) / 1.56, p.getY(i) / 1.28);
    return g;
  })();
  const head = new THREE.LatheGeometry([[0, 0], [0.36, 0], [0.46, 0.08], [0.48, 0.18], [0.48, 0.74], [0.46, 0.84], [0.36, 0.92], [0, 0.92]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
  const face = new THREE.CylinderGeometry(0.483, 0.483, 0.8, 24, 1, true, -1.1, 2.2);
  const leg = (() => { // noha s chodidlem
    const s = new THREE.Shape();
    s.moveTo(-0.4, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.34); s.lineTo(0.4, 0.4); s.lineTo(0.4, 1.12); s.lineTo(-0.4, 1.12); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.74, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
    g.rotateY(-PI / 2); g.translate(0.37, 0, 0); return g;
  })();
  const hand = new THREE.TorusGeometry(0.17, 0.075, 10, 20, PI * 1.55);
  const upperArm = new THREE.CylinderGeometry(0.17, 0.2, 0.62, 14);
  const foreArm = new THREE.CylinderGeometry(0.15, 0.17, 0.5, 14);
  const armDecal = new THREE.CylinderGeometry(0.205, 0.175, 0.42, 12, 1, true, -0.9, 1.8);
  return { torso, torsoFront, head, face, leg, hand, upperArm, foreArm, armDecal };
})();

export class Figure {
  constructor({ girl = false } = {}) {
    this.girl = girl;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    const skin = std(SKIN);
    const shirt = std(girl ? '#F06EAA' : '#1F3A5F');
    const legsM = std(girl ? '#F06EAA' : '#2F5C8F');
    const hairM = std(girl ? '#FBE3A0' : '#4A2E17', { roughness: 0.45 });

    // ---- nohy / sukně
    this.legs = [];
    if (girl) {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.98, 1.42, 4, 1).rotateY(PI / 4).scale(1.3, 1, 0.85), legsM);
      skirt.position.y = 0.71; this.body.add(skirt);
      const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.985, 1.0, 0.14, 4, 1).rotateY(PI / 4).scale(1.3, 1, 0.85), std('#ffffff'));
      hem.position.y = 0.12; this.body.add(hem);
    } else {
      for (const s of [-1, 1]) {
        const pivot = new THREE.Group(); pivot.position.set(s * 0.4, 1.12, 0);
        const l = new THREE.Mesh(G.leg, legsM); l.position.set(-0.37 + 0.37 - 0.0, -1.12, 0); l.position.x = -0.37 + 0.37; pivot.add(l);
        l.position.set(0, -1.12, 0);
        const shoe = new THREE.Mesh(getGeo('tile:0.76:1.0:0.24'), std('#2b2d31')); shoe.position.set(0, -1.0, 0.06); pivot.add(shoe);
        this.body.add(pivot); this.legs.push(pivot);
      }
      const hips = new THREE.Mesh(getGeo('tile:1.56:0.78:0.3'), legsM); hips.position.y = 1.27; this.body.add(hips);
    }
    // ---- trup s potiskem
    const torsoY = 1.42;
    const torso = new THREE.Mesh(G.torso, shirt); torso.position.y = torsoY; this.body.add(torso);
    const front = new THREE.Mesh(G.torsoFront, new THREE.MeshStandardMaterial({ map: torsoTex(girl), roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }));
    front.position.set(0, torsoY, 0.414); front.rotation.x = -0.0; this.body.add(front);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.12, 16), skin); neck.position.y = torsoY + 1.33; this.body.add(neck);

    // ---- hlava
    this.head = new THREE.Group(); this.head.position.y = torsoY + 1.36; this.head.scale.setScalar(1.3); this.body.add(this.head);
    this.head.add(new THREE.Mesh(G.head, skin));
    this.faceN = faceTex({ girl }); this.faceL = faceTex({ girl, love: true });
    this.faceMat = new THREE.MeshStandardMaterial({ map: this.faceN, transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });
    const face = new THREE.Mesh(G.face, this.faceMat); face.position.y = 0.46; this.head.add(face);
    this.buildHair(hairM);

    // ---- ruce (otáčejí se dopředu kolem ramene jako u figurky)
    this.arms = [];
    for (const s of [-1, 1]) {
      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.72, torsoY + 1.05, 0);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), girl ? skin : shirt); shoulder.add(cap);
      const up = new THREE.Mesh(G.upperArm, girl ? skin : skin); up.position.set(s * 0.1, -0.32, 0); up.rotation.z = s * 0.18; shoulder.add(up);
      if (!girl) { // rukáv trička
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.23, 0.28, 14), shirt); sleeve.position.set(s * 0.05, -0.12, 0); sleeve.rotation.z = s * 0.18; shoulder.add(sleeve);
      }
      const elbow = new THREE.Group(); elbow.position.set(s * 0.17, -0.62, 0); elbow.rotation.x = -0.75; shoulder.add(elbow);
      const fore = new THREE.Mesh(G.foreArm, skin); fore.position.y = -0.22; elbow.add(fore);
      if (!girl && s > 0) { // tetování kotvy
        const tat = new THREE.Mesh(G.armDecal, new THREE.MeshStandardMaterial({ map: tattooTex(), transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 }));
        tat.position.copy(up.position); tat.rotation.set(0, s * 0.75, up.rotation.z); tat.scale.setScalar(1.05); shoulder.add(tat);
      }
      if (girl) { // náramek
        const br = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 16), std('#F7E2A0', { metalness: 0.8 })); br.rotation.x = PI / 2; br.position.y = -0.42; elbow.add(br);
      }
      const wrist = new THREE.Group(); wrist.position.y = -0.52; elbow.add(wrist);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 10), skin); w.position.y = -0.04; wrist.add(w);
      const hand = new THREE.Mesh(G.hand, skin); hand.position.set(0, -0.24, 0.02); hand.rotation.set(0, PI / 2, PI * 0.72); wrist.add(hand);
      if (girl && s > 0) { const hh = new THREE.Mesh(getGeo('heart'), std('#FF4F7B')); hh.scale.setScalar(0.34); hh.position.set(0, -0.3, 0.42); wrist.add(hh); }
      if (!girl && s < 0) { // kluk drží růži
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), std('#237841')); st.position.set(0, -0.24, 0.05); st.rotation.x = PI / 2.3; wrist.add(st);
        const rose = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), std('#D01012')); rose.position.set(0, -0.06, 0.48); wrist.add(rose);
      }
      this.body.add(shoulder);
      this.arms.push({ shoulder, elbow, wrist });
    }

    // ---- srdíčka okolo
    this.hearts = [];
    const hmats = [std('#E0182D'), std('#FC97AC'), std('#ff5a6e')];
    for (let i = 0; i < 7; i++) {
      const h = new THREE.Mesh(getGeo('heart'), hmats[i % 3]);
      h.userData = { a: (i / 7) * PI * 2, r: 1.7 + (i % 3) * 0.3, y: 1.6 + (i % 4) * 0.6, s: 0.2 + (i % 3) * 0.06, sp: 0.5 + (i % 2) * 0.25 };
      this.root.add(h); this.hearts.push(h);
    }
    this.state = { show: false, point: false, love: false, side: 1, wave: 0 };
    this.anim = { show: 0, point: 0, love: 0, jump: 0 };
    this.root.scale.setScalar(0.0001);
  }

  buildHair(m) {
    const H = this.head;
    if (this.girl) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 14, 0, PI * 2, 0, PI * 0.56), m); cap.scale.set(1, 0.9, 1.05); cap.position.y = 0.66; H.add(cap);
      // dlouhé vlasy vzadu a po stranách až na ramena
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.74, 1.5, 24, 1, false, PI * 0.55, PI * 0.9), m); back.position.set(0, 0.12, -0.05); H.add(back);
      for (const s of [-1, 1]) {
        const lock = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.0, 4, 10), m); lock.position.set(s * 0.53, 0.05, 0.16); lock.rotation.z = s * 0.12; H.add(lock);
        const curl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), m); curl.position.set(s * 0.58, -0.55, 0.2); H.add(curl);
      }
      const fringe = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 4, 10), m); fringe.rotation.z = PI / 2 + 0.25; fringe.position.set(-0.08, 0.88, 0.42); H.add(fringe);
      const bow = std('#E0182D');
      for (const s of [-1, 1]) { const b = new THREE.Mesh(getGeo('cone'), bow); b.scale.set(0.17, 0.3, 0.12); b.rotation.z = s * PI / 2; b.position.set(0.3 + s * 0.2, 1.06, 0.2); H.add(b); }
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), bow); knot.position.set(0.3, 1.06, 0.22); H.add(knot);
    } else {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 12, 0, PI * 2, 0, PI * 0.5), m); cap.scale.set(1, 0.72, 1.04); cap.position.y = 0.72; H.add(cap);
      const quiff = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 10), m); quiff.rotation.set(0.4, 0, PI / 2 + 0.2); quiff.position.set(0.05, 1.1, 0.28); H.add(quiff);
      for (const s of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.5), m); side.position.set(s * 0.5, 0.66, -0.08); H.add(side); }
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.52, 0.5, 20, 1, false, PI * 0.6, PI * 0.8), m); back.position.set(0, 0.6, -0.02); H.add(back);
    }
  }

  set(k, v) {
    if (this.state[k] === v) return;
    this.state[k] = v;
    if (k === 'love') { this.faceMat.map = v ? this.faceL : this.faceN; this.faceMat.needsUpdate = true; if (v) this.anim.jump = 1; }
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
    this.body.position.y = jump + Math.sin(t * 2.1 + (this.girl ? 1 : 0)) * 0.02;
    const side = S.side;
    this.body.rotation.y = side * (0.12 + A.point * 0.4);
    this.head.rotation.y = side * A.point * 0.25 + Math.sin(t * 0.9) * 0.1;
    this.head.rotation.z = Math.sin(t * 1.3 + 2) * 0.07;
    this.body.rotation.z = Math.sin(t * 1.1 + (this.girl ? 0.5 : 0)) * 0.035;
    // ruce: rameno se otáčí dopředu (osa x), ruka v zápěstí
    const [Lf, Rt] = this.arms;
    const pointArm = side > 0 ? Rt : Lf, other = side > 0 ? Lf : Rt;
    pointArm.shoulder.rotation.x = -A.point * 1.45;
    pointArm.shoulder.rotation.z = side * A.point * 0.35;
    pointArm.elbow.rotation.x = -0.75 + A.point * 0.6;
    other.shoulder.rotation.x = Math.sin(t * 1.4) * 0.05; other.shoulder.rotation.z = 0;
    if (this.girl) {
      for (const [a, s] of [[Lf, -1], [Rt, 1]]) {
        a.shoulder.rotation.x = -A.love * 2.6 + Math.sin(t * 6) * 0.15 * A.love;
        a.shoulder.rotation.z = s * A.love * 0.3;
        a.elbow.rotation.x = -0.75 + A.love * 0.3;
      }
    }
    if (S.wave > 0) {
      S.wave = Math.max(0, S.wave - dt);
      const w = Math.min(1, S.wave * 2);
      Rt.shoulder.rotation.x = -w * 2.9;
      Rt.shoulder.rotation.z = w * (0.3 + Math.sin(t * 12) * 0.25);
      Rt.wrist.rotation.z = Math.sin(t * 12) * 0.4 * w;
    }
    for (const l of this.legs) l.rotation.x = 0;
    const burst = 1 + A.love * 0.5;
    for (const h of this.hearts) {
      const u = h.userData, a = u.a + t * u.sp;
      h.position.set(Math.cos(a) * u.r * burst, u.y + Math.sin(t * 1.6 + u.a * 3) * 0.25 + A.love * 0.4, Math.sin(a) * u.r * 0.6 * burst);
      h.rotation.y = Math.sin(t + u.a) * 0.6;
      h.scale.setScalar(u.s * (1 + A.love * 0.5 + Math.sin(t * 4 + u.a) * 0.06 * (1 + A.love * 2)));
    }
  }
}
