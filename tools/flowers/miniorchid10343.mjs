// Mini orchidej 10343 – stavba z dílků podle oficiálního návodu (díly a barvy z inventáře Rebrickable).
// Pozice podle závěrečného obrázku návodu (str. 40). Líc = LDraw -z, Y dolů, zem y = 0.
import { Build, D, rx, ry, rz, mul, apply, add, sub, scl, norm, cross } from './lib.mjs';
import { Asm, frameZ, along } from './asm.mjs';
const K = 0, RB = 70, NG = 92, LN = 78, MG = 82, PG = 297, DG = 288, GR = 2, BG = 10, LM = 27, BP = 29, DP = 5, RO = 402, DT = 28, TN = 19, W = 15, YE = 14, LB = 71, DK = 72, RD = 4;
const b = new Build('miniorchid10343'), A = new Asm();
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const P = (px, py, z = 0) => [(px - 280) * 0.91, -(720 - py) * 0.91, z];
const quarter = (id, col, y, q, flip = false, c = [-10, 0, 10]) => { const M = flip ? mul(ry(q * Math.PI / 2), rx(Math.PI)) : ry(q * Math.PI / 2); A.part(id, col, add(scl(apply(M, c), -1), [0, y, 0]), M); };

// ===== podstavec: nožky z kočičích ocásků, černá kulatá deska, hnědý prstenec =====
for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4; A.part('15429', RB, [Math.sin(a) * 82, -32, Math.cos(a) * 82], ry(a + Math.PI)); A.part('3021', RB, [Math.sin(a) * 66, -38, Math.cos(a) * 66], ry(a)); A.part('4304', RB, [Math.sin(a) * 74, -54, Math.cos(a) * 74], ry(a)); }
A.part('74611', K, [0, -46, 0]);
for (let q = 0; q < 4; q++) quarter('7033', RB, -74, q);
// ===== květináč: spodní mísa ze 4 čtvrtkupolí, zlatý pás, horní prstenec =====
for (let q = 0; q < 4; q++) quarter('76776', NG, -78, q, true);
// zlatý pás: oblé díly 3x1 bočně na výstupcích (oblou stranou ven), uvnitř žluté desky a bílé kostky s boky
import { basis } from './lib.mjs';
for (let k = 0; k < 12; k++) {
  const a = ((k + 0.5) / 12) * Math.PI * 2, n = [Math.sin(a), 0, Math.cos(a)], t = [Math.cos(a), 0, -Math.sin(a)];
  A.part(k % 3 === 2 ? '28192' : '50950', MG, add(scl(n, 110), [0, -182, 0]), basis([0, 1, 0], scl(n, -1), t));
}
for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; A.part('3460', YE, [Math.sin(a) * 10, -176, Math.cos(a) * 10], ry(a + Math.PI / 2)); A.part('52107', W, [Math.sin(a) * 70, -184, Math.cos(a) * 70], ry(a + Math.PI / 2)); }
for (let q = 0; q < 4; q++) quarter('7033', NG, -206, q);
// hlína
A.part('11213', DT, [0, -196, 0]);
for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; A.part(i % 2 ? '6141' : '1745', RB, [Math.sin(a) * 34, -200, Math.cos(a) * 34], ry(a)); }
A.part('39789', RB, [0, -190, 0]);
// ===== hnědá opora ze svícnů =====
const SX = P(268, 0)[0];
for (let i = 0; i < 8; i++) A.part('37762', RB, [SX, -214 - i * 40, 8]);
// ===== listy =====
function longLeaf(base, tip, roll) { // pravý + levý zaoblený díl 10x2x2 vedle sebe, zaoblený konec ve špičce
  const d = sub(tip, base), M = mul(frameZ(scl(d, -1), norm([0, 0.15, -1])), rz(roll));
  const L = new Asm();
  L.part('77180', DG, [-10, 0, -10]); L.part('77182', DG, [10, 0, -10]);
  L.part('15068', DG, [0, -10, 0], ry(Math.PI)); L.part('44567b', LB, [0, 14, 6]);
  A.add(L, { M, p: base });
  A.part('57360', RB, add(base, [0, 6, 0]));
}
longLeaf(P(262, 470, 10), P(125, 270, 10), 0.15);
longLeaf(P(298, 468, 0), P(432, 283, 0), -0.15);
function flatLeaf(c, a) { // ovál: deska 2x4, čtyři čtvrtkruhy a oblý díl 2x2
  const L = new Asm();
  L.part('3020', GR, [0, 8, 0], ry(Math.PI / 2));
  for (const [x, z, q] of [[-20, -40, 0], [20, -40, 1], [20, 40, 2], [-20, 40, 3]]) L.part('5852', DG, [x * 0.5, 0, z * 0.75], ry(-q * Math.PI / 2));
  L.part('15068', DG, [0, 0, 0]); L.part('15068', DG, [0, 0, 20]);
  A.add(L, { M: mul(ry(a), rx(-0.12)), p: c });
}
flatLeaf(P(232, 462, -40), Math.PI / 2 + 0.25);
flatLeaf(P(356, 476, -50), Math.PI / 2 - 0.2);
// ===== zelený stonek s obloukem =====
const stemPts = [P(282, 475, -10), P(281, 400, -10), P(282, 330, -14), P(300, 285, -20), P(330, 225, -24), P(370, 170, -28), P(430, 122, -30), P(490, 98, -32), P(560, 86, -32), P(630, 84, -32)];
const C = along(stemPts, 20);
let s = 0, i = 0;
const seq = ['J', 'J', 'J', 'H', 'A', 'H', 'A', 'H', 'A', 'H', 'A', 'H', 'J', 'J'];
for (const it of seq) {
  const len = it === 'J' ? 40 : it === 'A' ? 58 : 20;
  if (s + len > C.total) break;
  const m = C.at(s + len / 2), M = frameZ(m.d, [0, -1, 0]);
  if (it === 'J') A.part('59443', DG, m.p, mul(M, rx(Math.PI / 2)));
  else if (it === 'A') A.part('32016', DG, m.p, M);
  else A.part('27940', LB, m.p, mul(M, ry(Math.PI / 2)));
  s += len;
}
// poupata na konci
const e = C.at(C.total), Me = frameZ(e.d, [0, -1, 0]);
A.part('65487', GR, e.p, Me);
A.part('24946', BG, add(e.p, apply(Me, [0, 10, -14])), mul(Me, rx(Math.PI / 2)));
A.part('24946', BG, add(e.p, apply(Me, [0, -12, -10])), mul(Me, rx(-Math.PI / 2)));
A.part('66909', BG, add(e.p, apply(Me, [0, 0, -30])), mul(Me, rx(-Math.PI / 2)));
for (const [dx, dz] of [[0, -62], [10, -50], [-10, -48]]) A.part('5903', LM, add(e.p, apply(Me, [dx, 0, dz])), mul(Me, rx(-Math.PI / 2), rz(dx * 0.05)));
A.part('68211', BG, add(e.p, apply(Me, [0, 0, -58])), mul(Me, rx(-Math.PI / 2)));
// ===== květy (5x): tři trojúhelníkové štíty + dva zuby jako okvětní lístky, zlatý kroužek, růžový střed, oranžový pysk =====
function flower() { // líc = -z
  const F = new Asm();
  F.part('3917', PG, [0, 26, 8]);                                         // zlatý kroužek za květem
  F.part('3846', LN, [0, -30, 4], rz(Math.PI));                           // horní lístek (špička nahoru)
  F.part('3846', LN, [-26, 22, 4], rz(Math.PI - 2.4)); F.part('3846', LN, [26, 22, 4], rz(Math.PI + 2.4)); // spodní lístky
  F.part('49668', LN, [-14, -4, 2], mul(rz(Math.PI / 2 - 0.25), rx(Math.PI / 2)));   // boční lístky (zuby) do stran
  F.part('49668', LN, [14, -4, 2], mul(rz(-Math.PI / 2 + 0.25), rx(Math.PI / 2)));
  F.part('5264', PG, [-12, 0, 8], rx(Math.PI / 2)); F.part('5264', PG, [12, 0, 8], rx(Math.PI / 2));
  F.part('32607', BP, [-4, 2, -6], rx(-Math.PI / 2)); F.part('85861', DP, [0, 0, -10], rx(-Math.PI / 2));
  F.part('32607', RO, [-6, 22, -6], mul(rx(-Math.PI / 2 - 0.5), ry(2.2)));
  F.part('4697b', W, [0, 8, -12], rx(Math.PI / 2)); F.part('20482', TN, [0, 4, -14], rx(-Math.PI / 2));
  F.part('3484', PG, [0, 0, 20], rx(Math.PI / 2));
  return F;
}
function nearest(c) { let best = null, bd = 1e9; for (const p of C.pts) { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; best = p; } } return best; }
for (const [px, py, r] of [[215, 268, 0.15], [338, 252, -0.1], [318, 140, 0.05], [455, 142, -0.1], [540, 85, -0.2]]) {
  const t = P(px, py), n = nearest(t), c = [t[0], t[1], n[2] - 32];
  A.part('15712', TN, add(n, [0, 0, -12]), rx(Math.PI / 2));     // úchyt na stonku
  A.add(flower(), { M: ry(r), p: c });
}
A.emit(b); b.save('miniorchid10343.ldr'); console.log('miniorchid10343 parts', b.n);
