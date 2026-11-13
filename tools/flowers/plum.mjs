import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, pot8, band, apply, stalk } from './lib.mjs';
// Kvetoucí slivoň 10369: nízká baňatá šedomodrá váza s úzkým hrdlem a zlatým páskem dole na hnědém stojánku,
// silná hnědá lomená větev, velké rudé květy se žlutými tyčinkami, purpurová poupátka na tenkých větvičkách. Líc = LDraw -z.
const b = new Build('plum'); setSeed(21);
const VASE = 379, GOLD = 297, STAND = 70, WOOD = 70, RED = 4, BUD = 26, YEL = 14;
// stojánek: široký hnědý prstenec s nožkami
for (let q = 0; q < 4; q++) b.part('2577', STAND, [0, 112, 0], ry(q * Math.PI / 2));
b.part('60474', STAND, [0, 108, 0]);
for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.part('3062b', STAND, [Math.sin(a) * 60, 140, Math.cos(a) * 60]); }
// váza: nízké baňaté tělo (zaoblené rameno, věnec, zaoblené dno), zlatý pásek dole, vysoké úzké hrdlo
for (let q = 0; q < 4; q++) b.part('5651', VASE, [0, 48, 0], ry(q * Math.PI / 2));
pot8(b, VASE, 1, 72); band(b, GOLD, 82, 92, 16);
for (let q = 0; q < 4; q++) b.part('5651', VASE, [0, 104, 0], mul(ry(q * Math.PI / 2), rx(Math.PI)));
b.part('87081', VASE, [0, 24, 0]); b.part('87081', VASE, [0, 0, 0]); b.part('87081', VASE, [0, -24, 0]); b.part('60474', 308, [0, -32, 0]);
// květ: dvě vrstvy zaoblených lístků, žlutý střed s tyčinkami
function blossom(p, out, tw) {
  b.part('35473', RED, p, face(out, tw));
  b.part('35473', RED, add(p, scl(out, -4)), face(out, tw + 45 * D));
  b.part('98262', RED, add(p, scl(out, 6)), face(out, tw));
  b.part('24866', YEL, add(p, scl(out, 14)), face(out, tw));
}
// hlavní větev: silná, lomená, šikmo doprava nahoru
const main = stalk(b, WOOD, [[0, -30, 0], [-30, -160, 0], [10, -300, 0], [-20, -420, -4], [40, -560, -6], [110, -680, -8]]);
// postranní větve
const br1 = stalk(b, WOOD, [main[8], add(main[8], [-80, -40, 0]), add(main[8], [-150, -60, -4])]);
const br2 = stalk(b, WOOD, [main[15], add(main[15], [90, -30, 0]), add(main[15], [170, -10, -4])]);
// květy na hlavní větvi a větvích (střídavě, k divákovi)
const spots = [[main, 6, -1], [main, 10, 1], [main, 13, -1], [main, 18, 1], [main, 21, -1], [br1, 4, -1], [br2, 5, 1], [main, 24, 1]];
spots.forEach(([pts, i, side], k) => {
  const p = pts[Math.min(pts.length - 1, i)], out = norm([side * 0.35, -0.1, -1]);
  blossom(add(p, add(scl(out, 30), [side * 26, 0, 0])), out, k * 0.7);
});
// tenké větvičky s purpurovými poupaty
function twig(from, to) {
  const pts = b.stem([from, lerp3(from, to, 0.5), to], WOOD);
  for (let i = 1; i < pts.length; i++) if (rnd() < 0.8) { const o = norm([rnd() - 0.5, rnd() - 0.7, -0.6]); b.part(rnd() < 0.5 ? '6141' : '3062b', BUD, add(pts[i], scl(o, 10)), face(o)); }
  const end = pts[pts.length - 1]; b.part('3062b', BUD, end); b.part('6141', 5, add(end, [0, -8, 0]));
}
const lerp3 = (a, c, t) => add(a, scl(sub(c, a), t));
const tip = main[main.length - 1];
twig(tip, add(tip, [60, -90, -10])); twig(tip, add(tip, [-40, -110, 0]));
twig(br1[br1.length - 1], add(br1[br1.length - 1], [-70, -70, 0])); twig(br1[br1.length - 1], add(br1[br1.length - 1], [-80, 30, 0]));
twig(br2[br2.length - 1], add(br2[br2.length - 1], [70, -60, 0])); twig(main[4], add(main[4], [80, -50, -10]));
twig(main[12], add(main[12], [-90, -60, -6])); twig(main[19], add(main[19], [-100, -40, -6])); twig(main[22], add(main[22], [90, 20, -6])); twig(main[2], add(main[2], [-80, -30, -6]));
b.save('plum.ldr'); console.log('plum', b.n);
