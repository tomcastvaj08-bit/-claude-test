import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, ring, leaf6, stalk, apply } from './lib.mjs';
// Lopatkovec: květináč z broskvových válečků, velké hladké sytě zelené listy na stoncích,
// hladké bílé toulce se žlutou paličkou na dlouhých stoncích. Líc = LDraw -z.
const b = new Build('peacelily'); setSeed(17);
const POT = 78, SOIL = 308, LEAF = 2, LEAF2 = 288, WHITE = 15, STEM = 2;
for (let l = 0; l < 5; l++) ring(b, '3941', POT, 78, 12, 24 * l);
b.part('87081', SOIL, [0, 96, 0]);
for (let q = 0; q < 4; q++) b.part('2577', SOIL, [0, 0, 0], ry(q * Math.PI / 2));
b.part('60474', SOIL, [0, -6, 0]);
// listy: stonek do strany a nahoru, na konci velký hladký list (dva díly za sebou)
for (let k = 0; k < 9; k++) {
  const a = k * 40 * D + rnd() * 0.3, c = Math.cos(a), H = 100 + rnd() * 80, t = (c > 0.3 ? 14 + rnd() * 10 : c < -0.3 ? 8 + rnd() * 8 : 30 + rnd() * 20) * D;
  const top = [Math.sin(a) * (30 + H * 0.3), -H, Math.cos(a) * (30 + H * 0.3)];
  b.stem([[0, -6, 0], scl(top, 0.6), top], STEM);
  const col = k % 3 ? LEAF : LEAF2;
  leaf6(b, col, top, a, t, (k % 2 ? 1 : -1) * 0.15);
  const end = add(top, [Math.sin(a) * 100 * Math.cos(t), -100 * Math.sin(t), Math.cos(a) * 100 * Math.cos(t)]);
  leaf6(b, col, end, a, t - 25 * D, (k % 2 ? 1 : -1) * 0.15);
}
// květy: vysoký stonek nad listy, bílý toulec jako kapka (dva oblé díly lícem dopředu), žlutá palička před ním
[[-50, -400, -20], [45, -360, -10], [0, -450, 20]].forEach(([x, y, z]) => {
  b.stem([[0, -6, 0], [x * 0.5, y * 0.6, z * 0.5], [x, y, z]], STEM);
  for (const s of [-1, 1]) b.part('61678', WHITE, [x + s * 10, y + 6, z + 4], mul(ry(Math.PI + s * 0.35), rz(Math.PI), rx(-92 * D)));
  b.part('3062b', 14, [x, y + 10, z - 12]); b.part('3062b', 14, [x, y - 14, z - 12]); b.part('6141', 14, [x, y - 18, z - 12]);
});
b.save('peacelily.ldr'); console.log('peacelily', b.n);
