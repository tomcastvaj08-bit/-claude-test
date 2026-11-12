import { Build, D, rx, ry, rz, mul, face, alignY, bezier, ring, add, sub, scl, norm, rnd, setSeed, leaf } from './lib.mjs';
// Orchidej 10311: šedomodrý žebrovaný květináč 8x8, kůra, široké tmavé listy, dvě klenuté stonky s bílými květy
// (líc modelu = LDraw -z)
const C = { pot: 379, soil: 308, bark: 28, leaf: 288, stem: 288, petal: 15, lip: 26, bud: 15, center: 14, root: 19 };
const b = new Build('orchid'); setSeed(7);
const POT_H = 5;
for (let lv = 0; lv < POT_H; lv++) for (let q = 0; q < 4; q++) b.part('2577', C.pot, [0, 24 * lv, 0], ry(q * 90 * D));
// svislá žebra po obvodu
for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; for (let s = 0; s < 2; s++) b.part('87994', C.pot, [Math.sin(a) * 82, -2 + s * 56, Math.cos(a) * 82], I()); }
function I() { return [1, 0, 0, 0, 1, 0, 0, 0, 1]; }
// hlína a kůra
for (let q = 0; q < 4; q++) b.part('5651', C.soil, [0, 0, 0], ry(q * 90 * D));
for (let k = 0; k < 26; k++) { const a = rnd() * 6.28, r = 10 + rnd() * 52; b.part(k % 3 ? '3069b' : '98138', C.bark, [Math.sin(a) * r, -6 - rnd() * 6, Math.cos(a) * r], mul(ry(rnd() * 6), rx((rnd() - 0.5) * 0.6))); }
// listy: velké listy do stran přes okraj květináče
const leaves = [[170, 14], [240, 6], [300, 16], [10, 4], [70, 10], [120, 18]];
leaves.forEach(([deg, tilt], k) => {
  const a = deg * D, R0 = 22, y0 = -18 - k * 4, t = tilt * D;
  // list začíná u středu a zvedá se šikmo ven přes okraj květináče
  leaf(b, C.leaf, [Math.sin(a) * (R0 + 80 * Math.cos(t)), y0 - 80 * Math.sin(t), Math.cos(a) * (R0 + 80 * Math.cos(t))], mul(ry(a), rx(t), rz((k % 2 ? 1 : -1) * 8 * D)));
});
// vzdušné kořínky
for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.3; b.stem(bezier([Math.sin(a) * 30, -14, Math.cos(a) * 30], [Math.sin(a) * 70, -50, Math.cos(a) * 70], [Math.sin(a) * 96, -30, Math.cos(a) * 96], [Math.sin(a) * 100, 30, Math.cos(a) * 100]), C.root); }
// stonky s květy
const dirOf = (pts, i) => norm(sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]));
function spike(pts0, nFlowers, side) {
  const pts = b.stem(pts0, C.stem); const n = pts.length;
  for (let i = 0; i < nFlowers; i++) {
    const idx = n - 3 - i;
    const p = pts[idx];
    const out = norm([side * 0.25 + (rnd() - 0.5) * 0.3, 0.1, -1]);
    const pos = add(p, add(scl(out, 14), [0, 34, 0]));
    b.part('87994', C.stem, sub(pos, scl(norm(sub(pos, p)), 60)), alignY(sub(pos, p))); // stopka květu
    const tw = (i * 23 + rnd() * 20) * D;
    b.part('4727', C.petal, add(pos, scl(out, -5)), face(out, tw + 45 * D));
    b.part('35473', C.petal, pos, face(out, tw));
    b.part('24866', C.lip, add(pos, scl(out, 8)), face(out, tw));
    b.part('6141', C.center, add(pos, scl(out, 11)), mul(face(out), [0.45, 0, 0, 0, 1, 0, 0, 0, 0.45]));
  }
  for (let j = 0; j < 3; j++) b.part('3062b', j < 2 ? C.bud : 326, add(pts[n - 1 - j], [0, 6, 0]), alignY(dirOf(pts, n - 1 - j)));
}
spike(bezier([-8, -12, 6], [-20, -300, 10], [-60, -500, 0], [-190, -470, -20]), 7, -1);
spike(bezier([8, -12, -6], [20, -230, 0], [60, -410, 0], [170, -380, -30]), 5, 1);
b.save('orchid.ldr'); console.log('orchid parts', b.n);
