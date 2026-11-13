import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, pot8, leaf6, apply } from './lib.mjs';
// Kytice tulipánů 11501: 12 velkých pootevřených tulipánů (zakulacené dno + 6 oblých lístků), oranžové liliovité,
// zelená poupata, hladké listy; hlavy hustě do kopule nad nízkou skleněnou vázou. Líc = LDraw -z.
const b = new Build('tulips'); setSeed(11);
pot8(b, 47, 4, 0);
function tulip(top, up, col, { open = -88, r = 24, n = 6 } = {}) {
  const U = alignY(scl(up, -1));
  b.part('30367a', col, add(top, apply(U, [0, 34, 0])), mul(U, rx(Math.PI))); // zakulacené dno
  b.part('6141', 2, add(top, apply(U, [0, 64, 0])), mul(U, rx(Math.PI)));
  b.part('6141', 0, add(top, apply(U, [0, 8, 0])), U);
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.part('61678', col, add(top, apply(U, [Math.sin(a) * r, 0, Math.cos(a) * r])), mul(U, ry(a), rz(Math.PI), rx(open * D))); }
}
const COLS = [29, 4, 14, 30, 29, 25, 30, 14, 4, 25, 29, 30];
// kopule hlav: nahoře 3, kolem 9 nakloněných ven
const heads = [];
for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.28 + 0.4; heads.push([[Math.sin(a) * 40, -330 - rnd() * 15, Math.cos(a) * 40 - 10], 0.25]); }
for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28 + 0.2; heads.push([[Math.sin(a) * 100, -255 - rnd() * 25, Math.cos(a) * 95 - 15], 0.75]); }
heads.forEach(([h, lean], i) => {
  const base = [h[0] * 0.08, 40, h[2] * 0.08];
  b.stem(bezier(base, [h[0] * 0.15, -60, h[2] * 0.15], [h[0] * 0.6, h[1] * 0.7, h[2] * 0.6], h), 10);
  const out = norm([h[0], 0, h[2]]), up = norm(add([0, -1, 0], scl(out, lean)));
  const col = COLS[i];
  tulip(add(h, scl(up, 30)), up, col, col === 25 ? { open: -76, r: 26 } : {});
});
// zelená poupata
[[60, -360, 50], [-80, -350, -40]].forEach((h) => { b.stem([[0, 40, 0], scl(h, 0.5), h], 10); tulip(add(h, [0, -30, 0]), [0, -1, 0], 326, { open: -98, r: 16, n: 4 }); });
// hladké listy do stran a dozadu
[[100, 50], [40, 56], [320, 54], [260, 50]].forEach(([deg, t], k) => {
  const a = deg * D; leaf6(b, 2, [Math.sin(a) * 50, -110 - k * 8, Math.cos(a) * 50], a, t * D, (k % 2 ? 1 : -1) * 0.2);
});
b.save('tulips.ldr'); console.log('tulips', b.n);
