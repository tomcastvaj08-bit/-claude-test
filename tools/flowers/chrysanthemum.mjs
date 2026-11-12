import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf, pot8, band } from './lib.mjs';
// Chryzantéma: šalvějově zelená baňatá váza se zlatým páskem na vyřezávaném stojánku, dva velké oranžové květy, poupata, zubaté listy
const b = new Build('chrysanthemum'); setSeed(13);
const VASE = 378, GOLD = 297, STAND = 70, ORA = 25, DORA = 484, LEAF = 2;
// stojánek
for (let q = 0; q < 4; q++) b.part('5651', STAND, [0, 168, 0], ry(q * Math.PI / 2 + Math.PI)); // obrácený zaoblený
b.part('60474', STAND, [0, 160, 0]);
// váza: baňatá (8x8 válec 3 úrovně), nahoře zaoblená, hrdlo 4x4 a zlatý proužek
pot8(b, VASE, 3, 88);
for (let q = 0; q < 4; q++) b.part('5651', VASE, [0, 64, 0], ry(q * Math.PI / 2));
band(b, GOLD, 82, 112, 14);
b.part('87081', VASE, [0, 40, 0]); b.part('60474', GOLD, [0, 32, 0]); b.part('87081', VASE, [0, 8, 0]);
// stonky
function flower(top, n) {
  const pts = b.stem(bezier([0, 0, 0], [top[0] * 0.2, -150, top[2] * 0.2], [top[0] * 0.8, top[1] * 0.7, top[2]], top), LEAF);
  const up = norm(sub(pts[pts.length - 1], pts[pts.length - 2])), c = pts[pts.length - 1];
  // hlava: vrstvy lístků 2x2 nakloněné ven do koule
  const U = alignY(scl(up, -1));
  // velká huňatá hlava: vnější věnec z trsů lístků 4x3, uvnitř lístky 2x2
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; b.part('2423', k % 2 ? ORA : DORA, add(c, apply(U, [Math.sin(a) * 18, 4, Math.cos(a) * 18])), mul(U, ry(a + Math.PI), rx(14 * D))); }
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + 0.2; b.part('2423', ORA, add(c, apply(U, [Math.sin(a) * 16, -4, Math.cos(a) * 16])), mul(U, ry(a + Math.PI), rx(-14 * D))); }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.3; b.part('2423', ORA, add(c, apply(U, [Math.sin(a) * 10, -16, Math.cos(a) * 10])), mul(U, ry(a + Math.PI), rx(-42 * D))); }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; b.part('2423', DORA, add(c, apply(U, [Math.sin(a) * 6, -26, Math.cos(a) * 6])), mul(U, ry(a + Math.PI), rx(-70 * D))); }
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; b.part('4727', ORA, add(c, apply(U, [Math.sin(a) * 6, -34, Math.cos(a) * 6])), mul(U, ry(a), rx(-20 * D))); }
  b.part('98262', DORA, add(c, apply(U, [0, -44, 0])), U);
  return pts;
}
import { apply } from './lib.mjs';
const p1 = flower([-70, -360, -30], 0), p2 = flower([100, -290, 10], 1);
// poupata
[[-120, -210, 10], [50, -190, -60], [140, -200, 30]].forEach((t) => { const pts = b.stem([[0, 0, 0], scl(t, 0.5), t], LEAF); b.part('3062b', ORA, add(t, [0, -6, 0])); b.part('6141', ORA, add(t, [0, -12, 0])); });
// zubaté listy podél stonků
[p1, p2].forEach((pts, j) => { for (let k = 0; k < 3; k++) { const p = pts[Math.min(pts.length - 2, 1 + k * 2)]; const a = (j * 2 + k) * 1.9; b.part('2682a', LEAF, p, mul(ry(a), rx(-20 * D))); b.part('2682a', LEAF, p, mul(ry(a + Math.PI), rx(-30 * D))); } });
b.save('chrysanthemum.ldr'); console.log('chrysanthemum', b.n);
