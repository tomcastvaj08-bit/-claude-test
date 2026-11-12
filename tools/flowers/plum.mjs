import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf, band, pot8 } from './lib.mjs';
// Kvetoucí slivoň: vysoká šedomodrá váza se zlatými proužky na stojánku, kroucená tmavá větev s rudými květy a purpurovými poupaty
const b = new Build('plum'); setSeed(21);
const VASE = 379, GOLD = 297, DARK = 272, STAND = 70, WOOD = 308, RED = 4, BUD = 26;
// stojánek a váza
for (let q = 0; q < 4; q++) b.part('5651', STAND, [0, 224, 0], ry(q * Math.PI / 2 + Math.PI));
pot8(b, VASE, 3, 120); b.part('60474', DARK, [0, 192, 0]);
for (let q = 0; q < 4; q++) b.part('5651', VASE, [0, 96, 0], ry(q * Math.PI / 2));
band(b, GOLD, 82, 144, 14); band(b, GOLD, 82, 176, 14);
b.part('87081', VASE, [0, 72, 0]); b.part('60474', GOLD, [0, 64, 0]);
for (let l = 0; l < 3; l++) b.part('3941', VASE, [0, -8 + l * 24, 0]);
b.part('4032a', GOLD, [0, -16, 0]); b.part('3941', VASE, [0, -40, 0]);
// větev
const main = b.stem(bezier([0, -40, 0], [-30, -220, 0], [70, -380, -10], [-20, -560, 0]), WOOD, { part: '30374', L: 80 });
const branches = [
  bezier(main[2], add(main[2], [80, -40, -10]), add(main[2], [140, -60, 0]), add(main[2], [190, -40, 10])),
  bezier(main[4], add(main[4], [-70, -30, 0]), add(main[4], [-130, -80, -10]), add(main[4], [-180, -70, 0])),
  bezier(main[5], add(main[5], [60, -40, 10]), add(main[5], [100, -100, 0]), add(main[5], [150, -130, -10]))
];
const all = [main];
for (const br of branches) all.push(b.stem(br, WOOD));
// květy a poupata podél větví (hustě, po dvou až třech)
for (const pts of all) for (let i = 1; i < pts.length; i++) for (let j = 0; j < 3; j++) {
  const p = pts[i], out = norm([rnd() - 0.5, -0.3 - rnd() * 0.4, -0.6 - rnd() * 0.6]), side = norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]);
  const q = add(p, scl(side, 10 + rnd() * 10));
  if (j < 2 || rnd() < 0.5) { b.part('98262', j % 2 ? RED : 320, add(q, scl(out, 14)), face(out, rnd() * 6)); b.part('6141', 14, add(q, scl(out, 30)), mul(face(out), [0.5, 0, 0, 0, 1, 0, 0, 0, 0.5])); }
  else b.part('6141', BUD, add(q, scl(out, 12)), face(out));
}
b.save('plum.ldr'); console.log('plum', b.n);
