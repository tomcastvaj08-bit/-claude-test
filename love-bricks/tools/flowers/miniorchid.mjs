import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf, band } from './lib.mjs';
// Mini orchidej 10343: broskvové květy s korálovým středem, kulatý květináč se zlatým proužkem na dřevěném stojánku
const C = { pot: 84, gold: 297, stand: 70, soil: 308, leaf: 288, stem: 288, petal: 78, lip: 353, bud: 326 };
const b = new Build('miniorchid'); setSeed(3);
// stojánek
b.part('60474', C.stand, [0, 96, 0]); for (let k = 0; k < 4; k++) b.part('3062b', C.stand, [Math.sin(k * 1.571 + 0.785) * 28, 104, Math.cos(k * 1.571 + 0.785) * 28]);
// květináč: 4x4 kulaté kostky + zlatý proužek
b.part('87081', C.pot, [0, 72, 0]); b.part('87081', C.pot, [0, 48, 0]); b.part('60474', C.gold, [0, 40, 0]); b.part('87081', C.pot, [0, 16, 0]);
b.part('60474', C.soil, [0, 8, 0]);
for (let k = 0; k < 8; k++) { const a = rnd() * 6.28, r = rnd() * 26; b.part('98138', 28, [Math.sin(a) * r, 0, Math.cos(a) * r]); }
// listy
[[160, 16], [230, 8], [300, 18], [20, 10], [95, 14]].forEach(([deg, t], k) => { const a = deg * D, tt = t * D; leaf(b, C.leaf, [Math.sin(a) * (14 + 60 * Math.cos(tt)), -4 - 60 * Math.sin(tt) - k * 2, Math.cos(a) * (14 + 60 * Math.cos(tt))], mul(ry(a), rx(tt)), { size: 6 }); });
// stonek s květy
const pts = b.stem(bezier([4, -2, 0], [10, -200, 0], [40, -330, 0], [150, -320, -10]), C.stem);
const n = pts.length;
for (let i = 0; i < 5; i++) {
  const p = pts[n - 2 - i], out = norm([0.15 * (i % 2 ? 1 : -1), 0.15, -1]);
  const pos = add(p, add(scl(out, 10), [0, 22, 0]));
  const tw = (i * 31) * D;
  b.part('35473', C.petal, pos, face(out, tw));
  b.part('4727', C.petal, add(pos, scl(out, -4)), face(out, tw + 45 * D));
  b.part('24866', C.lip, add(pos, scl(out, 8)), face(out, tw));
}
b.part('3062b', C.bud, add(pts[n - 1], [0, 6, 0]), alignY(sub(pts[n - 1], pts[n - 2])));
b.save('miniorchid.ldr'); console.log('miniorchid', b.n);
