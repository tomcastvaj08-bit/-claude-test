import { Build, D, rx, ry, rz, mul, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf6, apply } from './lib.mjs';
// Kytice tulipánů 11501: 14 velkých tulipánů (zakulacené dno + 6 oblých lístků), oranžové liliovité, zelená poupata,
// hladké listy přes okraj. Stonky vedou do realistické skleněné vázy, kterou kreslí web (LD_CARS.tulips.vase). Líc = LDraw -z.
const b = new Build('tulips'); setSeed(11);
function tulip(top, up, col, { open = -88, r = 24, n = 6 } = {}) {
  const U = alignY(scl(up, -1));
  b.part('30367a', col, add(top, apply(U, [0, 34, 0])), mul(U, rx(Math.PI)));
  b.part('6141', 2, add(top, apply(U, [0, 64, 0])), mul(U, rx(Math.PI)));
  b.part('6141', 0, add(top, apply(U, [0, 8, 0])), U);
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.part('61678', col, add(top, apply(U, [Math.sin(a) * r, 0, Math.cos(a) * r])), mul(U, ry(a), rz(Math.PI), rx(open * D))); }
}
const COLS = [29, 4, 14, 30, 29, 25, 30, 14, 4, 25, 29, 30, 14, 4];
// hlavy hustě do kopule: nahoře 4, kolem 10 nakloněných ven
const heads = [];
for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28 + 0.4; heads.push([[Math.sin(a) * 34, -300 - rnd() * 15, Math.cos(a) * 34 - 6], 0.3]); }
for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + 0.2; heads.push([[Math.sin(a) * 78, -235 - rnd() * 25, Math.cos(a) * 74 - 10], 0.85]); }
heads.forEach(([h, lean], i) => {
  const base = [h[0] * 0.2, 160, h[2] * 0.2];
  b.stem(bezier(base, [h[0] * 0.25, -20, h[2] * 0.25], [h[0] * 0.6, h[1] * 0.75, h[2] * 0.6], h), 10);
  const out = norm([h[0], 0, h[2]]), up = norm(add([0, -1, 0], scl(out, lean)));
  const col = COLS[i];
  tulip(add(h, scl(up, 30)), up, col, col === 25 ? { open: -74, r: 26 } : {});
});
// zelená poupata
[[40, -340, 40], [-60, -330, -30]].forEach((h) => { b.stem([[h[0] * 0.2, 160, h[2] * 0.2], [h[0] * 0.4, -100, h[2] * 0.4], h], 10); tulip(add(h, [0, -30, 0]), [0, -1, 0], 326, { open: -98, r: 16, n: 4 }); });
// hladké listy: z hrdla vázy přes okraj a dolů
[[20, 0.2], [90, -0.2], [150, 0.15], [210, -0.15], [270, 0.2], [330, -0.1]].forEach(([deg, roll]) => {
  const a = deg * D; leaf6(b, 2, [Math.sin(a) * 92, -110, Math.cos(a) * 92], a, -48 * D, roll);
});
b.save('tulips.ldr'); console.log('tulips', b.n);
