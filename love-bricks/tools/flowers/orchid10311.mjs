// Orchidej 10311 – stavba z dílků podle oficiálního návodu (díly a barvy z inventáře Rebrickable).
// Pozice jsou odvozené z kroků návodu a z fotky hotového modelu. Líc = LDraw -z, Y dolů, zem y = 0.
import { Build, D, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm, T, ID, compose, frameZ, along } from './asm.mjs';
const SB = 379, DG = 288, K = 0, W = 15, DP = 5, BP = 29, MG = 26, DT = 28, OL = 330, RB = 70, DB = 308, TN = 19, LB = 71, DK = 72, RD = 4;
const b = new Build('orchid10311'), A = new Asm();
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
// fotka z krabice → LDraw (px na stránce 768 široké, květináč uprostřed dole)
const P = (px, py, z = 0) => [(px - 390) * 1.5, -(935 - py) * 1.5 * 0.8, z]; // 1,5 LDU/px (šířka květináče), výška stažená perspektivou fotky
const UP = frameZ([0, -1, 0]); // místní z nahoru

// ================= KVĚTINÁČ =================
const POT_TOP = -200;
// jádro (uvnitř): kulaté desky 8x8, otočné desky, kulaté kostky, technic kostky
for (const y of [0, -50, -100, -150]) A.part('74611', TN, [0, y, 0]);
for (const y of [-8, -58, -108]) A.part('61485', LB, [0, y, 0]);
A.part('68325', RD, [0, -16, 0]); A.part('68325', RD, [0, -116, 0]); A.part('87081', W, [0, -66, 0]);
// 16 sloupků (technic nosníky 1x7) dokola a na nich 32 modulů: deska 2x4 + dvojitý svah 2x4 + trojitý svah 1x2
const beamCols = [3, 25, 71, 14];
for (let k = 0; k < 16; k++) {
  const a = (k / 16) * Math.PI * 2, n = [Math.sin(a), 0, Math.cos(a)];
  const ex = [0, 1, 0], ey = scl(n, -1), ez = cross(ex, ey), M = basis(ex, ey, ez);   // místní x dolů, studs ven, z tečně
  A.part('32524', beamCols[k % 4], add(scl(n, 70), [0, -100, 0]), mul(ry(a), frameZ([0, -1, 0])));
  for (const [yc, cap] of [[-60, 1], [-140, -1]]) {
    const R = 86;
    A.part('3020', SB, add(scl(n, R), [0, yc, 0]), M);
    A.part('3041', SB, add(scl(n, R + 24), [0, yc, 0]), M);
    // trojitý svah jako hrot modulu (dole u spodní řady, nahoře u horní)
    const yCap = yc + cap * 50;
    A.part('15571', SB, add(scl(n, R + 24), [0, yCap, 0]), mul(M, cap > 0 ? ry(-Math.PI / 2) : ry(Math.PI / 2))); // hrot: nahoře pyramidka trojúhelníkem dolů, dole špička (jako skutečná sada)
  }
}
// horní okraj: černý „makaróny“ prstenec, mulč z kamínků a kulatých dlaždic
for (let q = 0; q < 4; q++) A.part('27507', K, [0, POT_TOP, 0], ry(q * Math.PI / 2));
const mulch = [[-30, -20], [25, -35], [40, 20], [-15, 40], [0, 0], [-45, 15], [50, -5]];
mulch.forEach(([x, z], i) => { A.part('27261', i % 2 ? RB : DB, [x, POT_TOP - 4, z], ry(i * 1.1)); A.part('27261', i % 2 ? DB : RB, [z * 0.9, POT_TOP - 6, -x * 0.9], ry(i * 2.3)); });
for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; A.part('14769', RB, [Math.sin(a) * 52, POT_TOP - 10, Math.cos(a) * 52]); }
for (let i = 0; i < 6; i++) { const a = i * 1.05; A.part('3941', RB, [Math.sin(a) * 38, POT_TOP + 14, Math.cos(a) * 38]); }

// ================= OPORA (2 černé osy 32 se spojkami a kužely) =================
const rodX = P(382, 0)[0];
for (const z of [-62, -42]) {
  A.part('50450', K, [rodX, -470, z], rz(Math.PI / 2));
  A.part('59900', K, [rodX, -796, z]);
}
for (const y of [-560, -620]) A.part('32056', K, [rodX - 10, y, -10], I);

// ================= HLAVNÍ STONKY (spojky 3L + osy 2 uvnitř) =================
function stem(x, z, y0, n) {
  for (let i = 0; i < n; i++) A.part('42195', DG, [x, y0 - 30 - i * 60, z], UP);
  return [x, y0 - n * 60, z];
}
const s1 = stem(P(358, 0)[0], 6, POT_TOP + 20, 8), s2 = stem(P(418, 0)[0], -4, POT_TOP + 20, 7);
A.part('4519', 14, add(s1, [0, -20, 0]), mul(UP, ry(Math.PI / 2)));
A.part('60483', K, [s1[0], -560, 6]); A.part('60483', K, [s2[0], -500, -4]);

// ================= VĚTVE (úhlové spojky 157,5° + spojky 3L, na konci zakroucený výhonek) =================
function branch(pts, opts = {}) {
  const c = along(pts, 20);
  // díly navazují bez mezer: střídavě úhlová spojka a spojka 3L, dokud nedojdou k výhonku na konci
  let s = 0, i = opts.startA === false ? 1 : 0;
  while (s + 60 < c.total - 20) {
    const it = i % 2 === 0 ? 'A' : 'J', len = 58;
    const m = c.at(s + len / 2), M = frameZ(m.d, [0, -1, 0]);
    A.part(it === 'J' ? '42195' : '32016', DG, m.p, M);
    s += len; i++;
    const j = c.at(s); A.part('32062', DG, j.p, mul(frameZ(j.d), rx(Math.PI / 2)));
  }
  c.total = s;
  // zakroucený konec (stéblo trávy) a tyčka
  const e = c.at(c.total), M = frameZ(e.d, [0, -1, 0]);
  A.part('15279', DG, add(e.p, apply(M, [0, 0, 10])), mul(M, rx(-Math.PI / 2)));
  A.part('85861', DG, e.p, M);
  return c;
}
const B1 = branch([s1, P(330, 310, 10), P(260, 250, 20), P(170, 210, 30), P(125, 205, 30)], { seq: ['J', 'A', 'J', 'A', 'J', 'A', 'J', 'B'] });
const B2 = branch([add(s1, [0, 70, 0]), P(300, 400, -20), P(220, 360, -30), P(120, 330, -30), P(55, 325, -30)], { seq: ['A', 'J', 'A', 'J', 'A', 'J', 'A', 'B'] });
const B3 = branch([s2, P(420, 260, 0), P(400, 170, 10), P(385, 95, 10)], { seq: ['A', 'J', 'A', 'J', 'J', 'B'] });
const B4 = branch([add(s2, [0, 80, 0]), P(470, 380, -20), P(540, 320, -30), P(610, 290, -30)], { seq: ['A', 'J', 'A', 'J', 'B'] });
const B5 = branch([P(425, 660, -10), P(470, 560, -20), P(530, 460, -30), P(580, 385, -30)], { seq: ['A', 'J', 'A', 'J', 'A', 'B'] });
// růžová poupata
for (const [c, s] of [[B1, 0.8], [B4, 0.7], [B5, 0.9], [B3, 0.92]]) { const m = c.at(c.total * s), M = frameZ(m.d); A.part('15470', BP, add(m.p, apply(M, [0, -10, -6])), M); }

// ================= LISTY =================
// list roste od báze (z = 0) do -z: u báze špičky klínů 10x3, na konci široké zakřivené čelní sklo (zaoblená špička listu)
function leafA() { // krok 82
  const L = new Asm();
  L.part('50955', DG, [-10, -6, -190], ry(Math.PI)); L.part('50956', DG, [10, -6, -190], ry(Math.PI));
  L.part('3020', DG, [0, 18, -180], ry(Math.PI / 2));
  L.part('41751', DG, [0, 0, -190]);
  L.part('3068b', DG, [0, -12, -250]); L.part('50340', K, [0, 14, -10]);
  return L;
}
function leafB() { // krok 83: dvě zakřivená čelní skla za sebou
  const L = new Asm();
  L.part('41751', DG, [0, 0, -140], ry(Math.PI)); L.part('41751', DG, [0, 0, -160]);
  L.part('3068b', DG, [0, -12, -200]); L.part('53923', K, [0, 14, -10]);
  return L;
}
function leafC() { // krok 84: dva kryty kabiny 4x4x4⅔ – zahnutý list visící přes okraj
  const L = new Asm();
  L.part('11289', DG, [0, 0, 0]); L.part('11289', DG, [0, -8, -14]);
  L.part('60470b', K, [0, -8, 10]); L.part('2817', K, [0, -14, 10]);
  return L;
}
// listy sedí na černých úhlových spojkách 135° v horní části květináče (krok 13 + 20), list začíná přímo na spojce
function mountLeaf(L, m, tip, roll = 0) {
  const d = norm(sub(tip, m));
  const Mc = frameZ(d, [0, -1, 0]);
  A.part('32192', K, m, Mc);                                 // černý kloub zasunutý v květináči
  A.part('11214', DK, add(m, scl(d, 18)), Mc);               // šedý čep
  const base = add(m, scl(d, 34));
  A.add(L, { M: mul(frameZ(scl(d, -1), norm([0, -0.55, -1])), rz(roll)), p: base });
}
const RIM = POT_TOP - 14;
mountLeaf(leafA(), [-58, RIM, 18], P(190, 505, -60), 0.25);
mountLeaf(leafA(), [-52, RIM, -22], P(70, 595, 50), -0.15);
mountLeaf(leafB(), [58, RIM, 8], P(660, 545, 30), 0.2);
{ const m = [44, RIM, -50]; A.part('32192', K, m, frameZ([0.3, 0.2, -1])); A.add(leafC(), { M: mul(ry(Math.PI + 0.3), rx(0.15)), p: add(m, [6, 4, -26]) }); }

// ================= KOŘENY (ocasy dinosaura, olivové) =================
A.part('32013', DB, P(335, 740, -30)); A.part('32013', DB, P(440, 740, -20));
A.part('40379', OL, P(320, 745, -60), mul(ry(0.6), rx(-0.4)));
A.part('40379', OL, P(450, 745, -40), mul(ry(-2.4), rx(-0.3)));

// ================= KVĚTY =================
function blossom() { // kroky 86–93; líc květu = -z, stonek za ním (+z)
  const F = new Asm();
  F.part('6587', DT, [0, 0, 34], ry(Math.PI / 2));                    // osa ke stonku
  F.part('75937', W, [0, 0, 18], rx(Math.PI / 2));                     // osmiúhelníkový rám
  F.part('21560', W, [-40, 6, 8], rz(0.3));                            // dva velké okvětní lístky (nárameníky)
  F.part('21560', W, [40, 6, 8], rz(-0.3));
  for (const [a, r] of [[0, 60], [2.55, 56], [-2.55, 56]]) {          // tři kališní lístky (štíty) – nahoře a dole šikmo
    const p = [Math.sin(a) * r, -Math.cos(a) * r, 14];
    F.part('2586', W, p, rz(a));
    F.part('11090', W, scl(p, 0.45), rz(a + Math.PI / 2));
  }
  for (const a of [0.8, -0.8, Math.PI]) F.part('79741', W, [Math.sin(a) * 22, -Math.cos(a) * 22, -8], rz(a));
  F.part('32072', DP, [0, 0, -4]);                                      // růžový střed
  F.part('4697b', K, [0, 10, -10], rx(Math.PI / 2));
  F.part('48267', BP, [-7, 30, -18], mul(rx(-Math.PI / 2 - 0.25), rz(0.12)));  // pysk ze dvou zubů
  F.part('48267', BP, [7, 30, -18], mul(rx(-Math.PI / 2 - 0.25), rz(-0.12)));
  F.part('33320', MG, [0, 8, -22], rx(-0.6));                          // žabka uprostřed
  return F;
}
const BR = [B1, B2, B3, B4, B5];
function nearestOnBranch(c) { let best = null, bd = 1e9; for (const br of BR) for (const p of br.pts) { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; best = p; } } return best; }
function placeFlower(c, rot = 0) {
  const n = nearestOnBranch(c), ctr = [n[0], n[1] + 18, n[2] - 44];    // květ visí na větvi, osa 6587 vede do větve
  A.part('32123b', W, add(n, [0, 4, -12]));                             // pouzdro na větvi
  A.add(blossom(), { M: mul(ry(rot), I), p: ctr });
}
[[P(380, 180, -40), 0.1], [P(185, 275, -30), 0.35], [P(295, 318, -50), 0.15], [P(465, 320, -50), -0.2], [P(375, 410, -60), 0], [P(470, 505, -60), -0.25]].forEach(([c, r]) => placeFlower(c, r));
// malé květy (2x): v originále hlava Demogorgona s potiskem (není v knihovně) – náhrada: bílá hlavička + kvítek
for (const c0 of [P(265, 192, -20), P(545, 262, -30)]) { const n = nearestOnBranch(c0), c = [n[0], n[1] - 6, n[2] - 18]; A.part('3626c', W, c, rx(Math.PI / 2)); A.part('24866', W, add(c, [0, 0, -14]), rx(-Math.PI / 2)); A.part('6141', BP, add(c, [0, 0, -18]), rx(-Math.PI / 2)); }

A.emit(b); b.save('orchid10311.ldr'); console.log('orchid10311 parts', b.n);
