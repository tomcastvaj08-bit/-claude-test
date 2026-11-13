import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, pot8, leaf6, stalk, slatPot } from './lib.mjs';
// Orchidej 10311: kuželový šedomodrý květináč z lamel, hladké klenuté tmavé listy, silné lomené stonky,
// bílé květy s růžovým středem, vzdušné kořínky. Líc = LDraw -z.
const C = { pot: 379, soil: 308, bark: 28, leaf: 288, stem: 288, petal: 15, lip: 26, lip2: 29, bud: 15, root: 19 };
const b = new Build('orchid'); setSeed(7);
// květináč: jádro + 26 lamel, nahoře širší
pot8(b, C.pot, 5, 0);
slatPot(b, C.pot, 92, 26, { y0: -2 });
for (let q = 0; q < 4; q++) b.part('5651', C.soil, [0, -4, 0], ry(q * Math.PI / 2));
for (let k = 0; k < 18; k++) { const a = rnd() * 6.28, r = 14 + rnd() * 56; b.part(k % 3 ? '3069b' : '98138', C.bark, [Math.sin(a) * r, -10 - rnd() * 8, Math.cos(a) * r], mul(ry(rnd() * 6), rx((rnd() - 0.5) * 0.7))); }
// listy: dlouhé hladké, první díl se zvedá, druhý se sklání přes okraj
import { apply } from './lib.mjs';
[[205, 16, 0.12], [255, 10, -0.15], [150, 14, 0.2], [95, 22, -0.1], [310, 18, 0.15], [30, 12, 0]].forEach(([deg, t, roll], k) => {
  const a = deg * D, base = [Math.sin(a) * 26, -30 - k * 5, Math.cos(a) * 26];
  leaf6(b, C.leaf, base, a, t * D, roll);
  const L = 110, end = add(base, [Math.sin(a) * L * Math.cos(t * D), -L * Math.sin(t * D) + 14, Math.cos(a) * L * Math.cos(t * D)]);
  leaf6(b, C.leaf, end, a, -16 * D, roll);
});
// vzdušné kořínky
for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.6; b.stem(bezier([Math.sin(a) * 30, -20, Math.cos(a) * 30], [Math.sin(a) * 80, -60, Math.cos(a) * 80], [Math.sin(a) * 110, -30, Math.cos(a) * 110], [Math.sin(a) * 118, 30, Math.cos(a) * 118]), C.root); }
// květ: bílé lístky (zaoblené 4x4 + špičaté 2x2 vzadu), růžový pysk a středy
function flower(pos, out, tw) {
  b.part('35473', C.petal, add(pos, scl(out, -5)), face(out, tw + 45 * D));
  b.part('35473', C.petal, pos, face(out, tw));
  b.part('6141', C.lip2, add(pos, add(scl(out, 8), [0, 10, 0])), face(out));
  b.part('24866', C.lip, add(pos, scl(out, 10)), face(out, tw));
}
// stonek: silný z kulatých kostek, květy podél horní části
function spike(path, flowerIdx, side) {
  const pts = stalk(b, C.stem, path);
  for (const [fi, dx] of flowerIdx) {
    const p = pts[Math.min(pts.length - 1, fi)];
    const out = norm([dx * 0.35 + side * 0.15, 0.08, -1]);
    flower(add(p, add(scl(out, 26), [dx * 30, 24, 0])), out, (fi * 37) * D);
  }
  const tip = pts[pts.length - 1];
  b.part('3062b', C.bud, add(tip, [0, -24, 0])); b.part('6141', 326, add(tip, [0, -28, 0]));
  return pts;
}
// hlavní stonek skoro svisle, horní polovina plná květů (střídavě vlevo a vpravo)
spike([[0, -20, 0], [-6, -260, 0], [-14, -420, 0], [-24, -560, 6]], [[22, -1], [20, 1], [18, -1], [16, 1], [14, -1], [12, 1], [10, -1]], 0);
// pravá větev oblouk doprava
spike(bezier([8, -200, 0], [40, -330, 0], [130, -420, -10], [230, -410, -20]), [[13, 0.4], [11, -0.4], [9, 0.4], [7, -0.4]], 1);
// levá větev
spike(bezier([-4, -140, 0], [-40, -240, 0], [-120, -300, -10], [-190, -300, -10]), [[10, 0.4], [8, -0.4], [6, 0.4]], -1);
b.save('orchid.ldr'); console.log('orchid parts', b.n);
