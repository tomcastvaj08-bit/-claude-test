import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, band, pot8, leaf6, stalk, apply } from './lib.mjs';
// Mini orchidej 10343: měděná mísa se zlatým okrajem na tmavém stojánku se 4 nožkami, hladké široké listy,
// stonek obloukem doprava s hnědou opěrnou tyčkou, broskvové hvězdicové květy, zelená poupata. Líc = LDraw -z.
const C = { pot: 92, gold: 297, stand: 70, soil: 308, leaf: 288, stem: 288, petal: 78, lip: 353, lip2: 29, bud: 326, stick: 70 };
const b = new Build('miniorchid'); setSeed(3);
// mísa: věnec 8x8 (3 vrstvy), pod ním zaoblené dno, zlatý pásek u horního okraje
pot8(b, C.pot, 3, 0);
for (let q = 0; q < 4; q++) b.part('5651', C.pot, [0, 96, 0], mul(ry(q * Math.PI / 2), rx(Math.PI)));
band(b, C.gold, 82, 18, 16);
for (let q = 0; q < 4; q++) b.part('5651', C.soil, [0, 0, 0], ry(q * Math.PI / 2));
// stojánek: široký prstenec, deska a 4 nožky
for (let q = 0; q < 4; q++) b.part('2577', C.stand, [0, 104, 0], ry(q * Math.PI / 2));
b.part('60474', C.stand, [0, 100, 0]);
for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.part('3062b', C.stand, [Math.sin(a) * 58, 132, Math.cos(a) * 58]); }
// listy: tři široké šikmo vzhůru do stran + jeden krátký dopředu
[[255, 58, 0.2], [100, 50, -0.2], [145, 20, 0.1], [210, 12, -0.1]].forEach(([deg, t, roll], k) => {
  const a = deg * D, base = [Math.sin(a) * 16, -24 - k * 4, Math.cos(a) * 16];
  leaf6(b, C.leaf, base, a, t * D, roll);
  if (k < 2) { const L = 110, end = add(base, [Math.sin(a) * L * Math.cos(t * D), -L * Math.sin(t * D) + 6, Math.cos(a) * L * Math.cos(t * D)]); leaf6(b, C.leaf, end, a, (t - 22) * D, roll); }
});
// opěrná tyčka
b.stem([[-14, -10, 6], [-14, -360, 6]], C.stick, { part: '30374', L: 80 });
// stonek: nahoru a pak obloukem doprava
const pts = stalk(b, C.stem, bezier([0, -10, 0], [-10, -300, 0], [40, -440, -10], [250, -420, -20]));
const n = pts.length;
function flower(pos, out, tw) {
  b.part('4727', C.petal, add(pos, scl(out, -5)), face(out, tw + 45 * D));
  b.part('35473', C.petal, pos, face(out, tw));
  b.part('24866', C.lip2, add(pos, scl(out, 8)), face(out, tw));
  b.part('6141', C.lip, add(pos, add(scl(out, 10), [0, -6, 0])), face(out));
}
[[n - 3, -0.2], [n - 6, 0.2], [n - 9, -0.1], [n - 12, 0.2], [n - 15, -0.1]].forEach(([i, dx], k) => {
  const p = pts[i], out = norm([dx, 0.05, -1]);
  flower(add(p, add(scl(out, 24), [0, 26, 0])), out, (k * 41) * D);
});
// zelená poupata na konci
const tip = pts[n - 1];
[[0, 0], [18, 6], [30, 2], [40, 10]].forEach(([dx, dy], k) => b.part(k % 2 ? '3062b' : '6141', C.bud, add(tip, [dx, dy, 0]), rz(Math.PI / 2)));
b.save('miniorchid.ldr'); console.log('miniorchid', b.n);
