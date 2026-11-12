import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf, ring } from './lib.mjs';
// Lopatkovec: květináč z broskvových válečků, velké sytě zelené listy, bílé toulce se žlutou paličkou
const b = new Build('peacelily'); setSeed(17);
const POT = 78, SOIL = 308, LEAF = 2, LEAF2 = 10, WHITE = 15;
for (let l = 0; l < 5; l++) ring(b, '3062b', POT, 72, 22, 24 * l, { phase: (l % 2) * 0.14 });
b.part('87081', SOIL, [0, 96, 0]);
for (let q = 0; q < 4; q++) { b.part('2577', SOIL, [0, 0, 0], ry(q * Math.PI / 2)); }
b.part('60474', SOIL, [0, -6, 0]);
// listy: stonek + list ze dvou klínů, natočené ven a nahoru
for (let k = 0; k < 9; k++) {
  const a = k * 40 * D + rnd() * 0.3, t = (35 + rnd() * 25) * D, H = 120 + rnd() * 100;
  const top = [Math.sin(a) * H * 0.35, -H, Math.cos(a) * H * 0.35];
  b.stem([[0, -6, 0], top], LEAF);
  leaf(b, k % 3 ? LEAF : LEAF2, add(top, [Math.sin(a) * 80 * Math.cos(t), -80 * Math.sin(t), Math.cos(a) * 80 * Math.cos(t)]), mul(ry(a), rx(t)), { size: 8 });
}
// květy: dlouhý stonek, bílý toulec (klíny 3x6) a žlutá palička
[[-30, -360, -40, 0.3], [40, -320, -10, -0.4], [0, -400, 30, 3.0]].forEach(([x, y, z, a]) => {
  b.stem([[0, -6, 0], [x * 0.5, y * 0.6, z * 0.5], [x, y, z]], LEAF);
  leaf(b, WHITE, [x, y - 58, z], mul(ry(a), rx(-78 * D)), { size: 6 });
  b.part('87994', 14, [x + Math.sin(a) * 10, y - 6, z + Math.cos(a) * -10 + Math.cos(a) * 14], alignY([0, -1, 0]));
  b.part('3062b', 14, [x + Math.sin(a) * 10, y - 70, z + Math.cos(a) * 4]);
});
b.save('peacelily.ldr'); console.log('peacelily', b.n);
