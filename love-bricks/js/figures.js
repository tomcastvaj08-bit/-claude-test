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

// ---------- obličej (potisk) – klasický: dvě tečky a úsměv ----------
function faceTex() {
  return canvasTex(512, 320, (g) => {
    g.fillStyle = '#141414';
    g.beginPath(); g.ellipse(214, 150, 15, 18, 0, 0, 7); g.ellipse(298, 150, 15, 18, 0, 0, 7); g.fill();
    g.strokeStyle = '#141414'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.arc(256, 168, 64, 0.22 * PI, 0.78 * PI); g.stroke();
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
  constructor() {
    this.root = new THREE.Group();
    this.body = new THREE.Group(); this.root.add(this.body);
    const skin = std(SKIN), red = std('#C91A09'), blue = std('#0055BF'), hair = std('#5C2A14', { roughness: 0.4 });

    // nohy a boky (modré)
    this.legs = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.4, 1.12, 0);
      const l = new THREE.Mesh(G.leg, blue); l.position.set(0, -1.12, 0); pivot.add(l);
      this.body.add(pivot); this.legs.push(pivot);
    }
    const hips = new THREE.Mesh(getGeo('tile:1.56:0.78:0.3'), blue); hips.position.y = 1.27; this.body.add(hips);
    // trup (červený)
    const torsoY = 1.42;
    const torso = new THREE.Mesh(G.torso, red); torso.position.y = torsoY; this.body.add(torso);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.12, 16), skin); neck.position.y = torsoY + 1.33; this.body.add(neck);
    // hlava se žlutým výstupkem
    this.head = new THREE.Group(); this.head.position.y = torsoY + 1.36; this.body.add(this.head);
    this.head.add(new THREE.Mesh(G.head, skin));
    this.faceMat = new THREE.MeshStandardMaterial({ map: faceTex(), transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });
    const face = new THREE.Mesh(G.face, this.faceMat); face.position.y = 0.46; this.head.add(face);
    this.buildHair(hair);
    // ruce: červené rukávy, žluté ruce
    this.arms = [];
    for (const s of [-1, 1]) {
      const shoulder = new THREE.Group(); shoulder.position.set(s * 0.72, torsoY + 1.05, 0);
      shoulder.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10), red));
      const up = new THREE.Mesh(G.upperArm, red); up.position.set(s * 0.1, -0.32, 0); up.rotation.z = s * 0.18; shoulder.add(up);
      const elbow = new THREE.Group(); elbow.position.set(s * 0.17, -0.62, 0); elbow.rotation.x = -0.75; shoulder.add(elbow);
      const fore = new THREE.Mesh(G.foreArm, red); fore.position.y = -0.22; elbow.add(fore);
      const wrist = new THREE.Group(); wrist.position.y = -0.52; elbow.add(wrist);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 10), skin); w.position.y = -0.04; wrist.add(w);
      const hand = new THREE.Mesh(G.hand, skin); hand.position.set(0, -0.24, 0.02); hand.rotation.set(0, PI / 2, PI * 0.72); wrist.add(hand);
      this.body.add(shoulder);
      this.arms.push({ shoulder, elbow, wrist });
    }
    this.hearts = [];
    this.state = { show: false, point: false, love: false, side: 1, wave: 0 };
    this.anim = { show: 0, point: 0, love: 0, jump: 0 };
    this.root.scale.setScalar(0.0001);
  }

  // vlasy jako u figurky v oranžovém: hnědé, ofina sčesaná na stranu, vzadu cípek
  buildHair(m) {
    const H = this.head;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 16, 0, PI * 2, 0, PI * 0.52), m); cap.scale.set(1.04, 0.78, 1.06); cap.position.y = 0.74; H.add(cap);
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.54, 0.6, 28, 1, true, PI * 0.62, PI * 0.76), m); side.position.y = 0.57; H.add(side); // jen vzadu, žádné kotlety
    side.material = m; side.geometry.computeVertexNormals();
    const fringe = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 6, 12), m); fringe.rotation.set(0.2, 0.15, PI / 2 - 0.22); fringe.position.set(0.04, 0.9, 0.42); H.add(fringe);
    const sweep = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 6, 12), m); sweep.rotation.set(0.1, 0, PI / 2 + 0.35); sweep.position.set(-0.3, 0.98, 0.32); H.add(sweep);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 10), m); tuft.rotation.set(-1.9, 0, 0.5); tuft.position.set(0.28, 1.0, -0.42); H.add(tuft);
    const tuft2 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 10), m); tuft2.rotation.set(-1.7, 0, -0.3); tuft2.position.set(0.05, 1.06, -0.48); H.add(tuft2);
  }

  set(k, v) {
    if (this.state[k] === v) return;
    this.state[k] = v;
    if (k === 'love' && v) this.anim.jump = 1;
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
      h.scale.setScalar(u.s * (0.45 + A.love * 0.9 + Math.sin(t * 4 + u.a) * 0.05 * (1 + A.love * 2)));
    }
  }
}
