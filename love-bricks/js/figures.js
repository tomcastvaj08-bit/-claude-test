// Kostičkoví panáčci Love Bricks – kluk a holka se srdíčky kolem.
import * as THREE from 'three';
import { getGeo } from './models.js';

const SKIN = '#F6C342';
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.32, ...extra });

function faceTexture({ girl = false, love = false }) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 168;
  const g = c.getContext('2d');
  g.lineCap = 'round';
  const heart = (x, y, s, col) => {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
    g.beginPath(); g.moveTo(0, 9);
    g.bezierCurveTo(-4, 5, -12, 1, -12, -5); g.bezierCurveTo(-12, -11, -4, -13, 0, -7);
    g.bezierCurveTo(4, -13, 12, -11, 12, -5); g.bezierCurveTo(12, 1, 4, 5, 0, 9);
    g.fill(); g.restore();
  };
  if (love) {
    heart(96, 66, 1.65, '#E0182D'); heart(160, 66, 1.65, '#E0182D');
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(90, 58, 4, 0, 7); g.arc(154, 58, 4, 0, 7); g.fill();
  } else {
    g.fillStyle = '#16161a';
    g.beginPath(); g.ellipse(98, 68, 9, 12, 0, 0, 7); g.ellipse(158, 68, 9, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(101, 63, 3.4, 0, 7); g.arc(161, 63, 3.4, 0, 7); g.fill();
  }
  g.strokeStyle = '#16161a'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(84, 44); g.quadraticCurveTo(97, 36, 110, 42); g.stroke();
  g.beginPath(); g.moveTo(146, 42); g.quadraticCurveTo(159, 36, 172, 44); g.stroke();
  if (girl && !love) {
    g.lineWidth = 3.5;
    for (const [x, d] of [[88, -1], [168, 1]]) { g.beginPath(); g.moveTo(x, 62); g.lineTo(x + d * 8, 56); g.stroke(); }
  }
  if (girl || love) {
    g.fillStyle = 'rgba(255,110,140,.45)';
    g.beginPath(); g.ellipse(72, 100, 14, 8, 0, 0, 7); g.ellipse(184, 100, 14, 8, 0, 0, 7); g.fill();
  }
  if (love) {
    g.fillStyle = '#16161a'; g.beginPath(); g.moveTo(98, 104); g.quadraticCurveTo(128, 150, 158, 104); g.closePath(); g.fill();
    g.fillStyle = '#ff6f87'; g.beginPath(); g.ellipse(128, 126, 14, 7, 0, 0, 7); g.fill();
  } else {
    g.strokeStyle = girl ? '#c2183a' : '#16161a'; g.lineWidth = 6;
    g.beginPath(); g.arc(128, 92, 32, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const torsoGeo = (() => {
  const g = new THREE.CylinderGeometry(0.72, 0.9, 1.25, 4, 1);
  g.rotateY(Math.PI / 4);
  g.scale(1, 1, 0.62);
  g.computeVertexNormals();
  return g;
})();
const headGeo = (() => {
  const pts = [[0, 0], [0.36, 0], [0.42, 0.06], [0.42, 0.56], [0.36, 0.62], [0.2, 0.62], [0.2, 0.74], [0, 0.74]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 22);
})();
const faceGeo = new THREE.CylinderGeometry(0.424, 0.424, 0.5, 18, 1, true, -0.95, 1.9);

export class Figure {
  constructor({ girl = false } = {}) {
    this.girl = girl;
    this.root = new THREE.Group();     // pop-in měřítko
    this.body = new THREE.Group();     // natočení těla
    this.root.add(this.body);
    const torsoC = girl ? '#E4569A' : '#1E5AA8';
    const legC = girl ? '#F2F3F2' : '#0A3463';
    const hairC = girl ? '#7A3B1D' : '#3B2416';
    const skin = std(SKIN), torso = std(torsoC), legs = std(legC), hair = std(hairC);

    // nohy a boky
    const legG = getGeo('tile:0.56:0.72:1.15');
    for (const x of [-0.3, 0.3]) { const m = new THREE.Mesh(legG, legs); m.position.set(x, 0.575, 0); this.body.add(m); }
    const hip = new THREE.Mesh(getGeo('tile:1.2:0.72:0.26'), legs); hip.position.y = 1.28; this.body.add(hip);
    if (girl) { // sukýnka
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.85, 0.55, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.7), std('#C870A0'));
      sk.position.y = 1.05; this.body.add(sk);
    }
    // trup + potisk srdce
    const t = new THREE.Mesh(torsoGeo, torso); t.position.y = 2.03; this.body.add(t);
    const hm = new THREE.Mesh(getGeo('heart'), std(girl ? '#ffffff' : '#E0182D'));
    hm.scale.set(0.2, 0.2, 0.12); hm.position.set(0, 2.12, 0.355); hm.rotation.x = -0.08; this.body.add(hm);
    const neck = new THREE.Mesh(getGeo('bar'), skin); neck.scale.set(0.2, 0.12, 0.2); neck.position.y = 2.71; this.body.add(neck);

    // hlava
    this.head = new THREE.Group(); this.head.position.y = 2.74; this.body.add(this.head);
    this.head.add(new THREE.Mesh(headGeo, skin));
    this.faceN = faceTexture({ girl });
    this.faceL = faceTexture({ girl, love: true });
    this.faceMat = new THREE.MeshStandardMaterial({ map: this.faceN, transparent: true, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2 });
    const face = new THREE.Mesh(faceGeo, this.faceMat); face.position.y = 0.3; this.head.add(face);
    // vlasy
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    cap.scale.set(1, 0.8, 1.02); cap.position.y = 0.5; this.head.add(cap);
    if (girl) {
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 1.05, 18, 1, false, Math.PI * 0.62, Math.PI * 0.76), hair);
      back.position.set(0, 0.2, -0.02); this.head.add(back);
      for (const s of [-1, 1]) {
        const lock = new THREE.Mesh(getGeo('tile:0.2:0.4:0.9'), hair); lock.position.set(s * 0.44, 0.2, 0.08); this.head.add(lock);
        const bow = new THREE.Mesh(getGeo('cone'), std('#E0182D')); bow.scale.set(0.16, 0.26, 0.12); bow.rotation.z = s * Math.PI / 2; bow.position.set(0.32 + s * 0.17, 0.78, 0.18); this.head.add(bow);
      }
    } else {
      const fr = new THREE.Mesh(getGeo('tile:0.8:0.25:0.22'), hair); fr.position.set(0.05, 0.58, 0.36); fr.rotation.set(-0.35, 0, -0.18); this.head.add(fr);
    }

    // ruce
    this.arms = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.66, 2.45, 0);
      const arm = new THREE.Mesh(getGeo('bar'), torso); arm.scale.set(0.17, 0.8, 0.17); arm.position.set(s * 0.07, -0.38, 0.02); arm.rotation.z = s * 0.15; pivot.add(arm);
      const hand = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.06, 8, 14, Math.PI * 1.5), skin); hand.position.set(s * 0.14, -0.86, 0.08); hand.rotation.set(Math.PI / 2, 0, 0); pivot.add(hand);
      this.body.add(pivot); this.arms.push(pivot);
    }
    // podložka
    const plate = new THREE.Mesh(getGeo('brick:4:4:0.4'), std(girl ? '#FC97AC' : '#4B9F4A'));
    plate.position.y = -0.2; plate.scale.set(0.8, 1, 0.8); this.root.add(plate);

    // srdíčka okolo
    this.hearts = [];
    const hg = getGeo('heart');
    const hmats = [std('#E0182D'), std('#FC97AC'), std('#ff5a6e')];
    for (let i = 0; i < 7; i++) {
      const h = new THREE.Mesh(hg, hmats[i % 3]);
      h.userData = { a: (i / 7) * Math.PI * 2, r: 1.55 + (i % 3) * 0.25, y: 1.4 + (i % 4) * 0.55, s: 0.2 + (i % 3) * 0.06, sp: 0.5 + (i % 2) * 0.25 };
      this.root.add(h); this.hearts.push(h);
    }

    this.state = { show: false, point: false, love: false, side: 1, wave: 0 };
    this.anim = { show: 0, point: 0, love: 0, jump: 0 };
    this.root.scale.setScalar(0.0001);
  }

  set(k, v) {
    if (this.state[k] === v) return;
    this.state[k] = v;
    if (k === 'love') { this.faceMat.map = v ? this.faceL : this.faceN; this.faceMat.needsUpdate = true; if (v) this.anim.jump = 1; }
  }
  wave() { this.state.wave = 1.6; this.anim.jump = 1; }

  update(dt, t) {
    const A = this.anim, S = this.state;
    const approach = (cur, target, speed) => cur + (target - cur) * (1 - Math.exp(-speed * dt));
    A.show = approach(A.show, S.show ? 1 : 0, 7);
    A.point = approach(A.point, S.point ? 1 : 0, 6);
    A.love = approach(A.love, S.love ? 1 : 0, 5);
    // pop-in s mírným přestřelem
    const sh = A.show;
    const pop = sh < 0.001 ? 0.0001 : sh * (1 + Math.sin(sh * Math.PI) * 0.18);
    this.root.scale.setScalar(pop);
    this.root.visible = sh > 0.002;
    // skok
    if (A.jump > 0) A.jump = Math.max(0, A.jump - dt * 1.8);
    const jump = Math.sin((1 - A.jump) * Math.PI) * (A.jump > 0 ? 0.55 : 0);
    this.body.position.y = jump + Math.sin(t * 2.2 + (this.girl ? 1 : 0)) * 0.03;
    // natočení
    const side = S.side;
    this.body.rotation.y = side * (0.12 + A.point * 0.35);
    this.head.rotation.y = side * A.point * 0.3 + Math.sin(t * 0.9) * 0.08;
    this.head.rotation.z = Math.sin(t * 1.3 + 2) * 0.05;
    // ruce
    const [L, R] = this.arms;
    const pointArm = side > 0 ? R : L, other = side > 0 ? L : R;
    pointArm.rotation.z = side * (0.05 + A.point * 1.35);
    pointArm.rotation.x = -A.point * 0.55;
    other.rotation.z = -side * 0.05;
    other.rotation.x = 0;
    if (this.girl) { // radost: ručičky nahoru
      L.rotation.z = -0.05 - A.love * 0.6; L.rotation.x = -A.love * 1.9;
      R.rotation.z = 0.05 + A.love * 0.6; R.rotation.x = -A.love * 1.9;
    }
    if (S.wave > 0) {
      S.wave = Math.max(0, S.wave - dt);
      const w = Math.min(1, S.wave * 2);
      R.rotation.z = 0.05 + w * 2.6 + Math.sin(t * 14) * 0.3 * w;
    }
    // srdíčka
    const burst = 1 + A.love * 0.6;
    for (const h of this.hearts) {
      const u = h.userData;
      const a = u.a + t * u.sp;
      h.position.set(Math.cos(a) * u.r * burst, u.y + Math.sin(t * 1.6 + u.a * 3) * 0.25 + A.love * 0.4, Math.sin(a) * u.r * 0.6 * burst);
      h.rotation.y = Math.sin(t + u.a) * 0.6;
      h.scale.setScalar(u.s * (1 + A.love * 0.5 + Math.sin(t * 4 + u.a) * 0.06 * (1 + A.love * 2)));
    }
  }
}
