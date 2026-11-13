// Chryzantéma 10368 – stavba z dílků podle oficiálního návodu (6533546) a inventáře Rebrickable.
// Souřadnice LDraw: Y dolů, divák na -z. Nula: horní plocha černé kulaté desky 8x8 (krok 1).
// Rozmístění stonků, listů a květů podle závěrečného obrázku návodu (str. 37): P(px, py) = pixel → LDU.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm, frameZ, along } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const K = 0, RB = 70, SG = 378, MG = 82, DG = 288, OR = 25, LO = 191, RO = 402, RD = 4, YE = 14, LY = 226, LM = 27, W = 15, LB = 71, DK = 72, DT = 28;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
const quarter = (S, id, col, y, q, flip = false) => { const M = flip ? mul(ry(q * Math.PI / 2), rx(Math.PI)) : ry(q * Math.PI / 2); S.part(id, col, add(scl(apply(M, [-10, 0, 10]), -1), [0, y, 0]), M); };
const A = new Asm();

// ===== kroky 1–6: podstavec (černá kulatá deska, 4 nožky z kočičích ocásků, hnědý prstenec) =====
const base = new Asm();
base.part('74611', K, [0, 0, 0]);
base.part('41740', W, [0, -8, -10]); base.part('41740', W, [0, -8, 10]);
base.part('3068b', DT, [0, -16, 0]);
for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2; base.part('60897', DK, [Math.sin(a) * 30, -16, Math.cos(a) * 30], ry(a)); base.part('20482', DT, [Math.sin(a) * 30, -32, Math.cos(a) * 30]); }
const arm = new Asm();
arm.part('3021', RB, [70, 8, 0]);
arm.part('4304', RB, [90, 16, 0], ry(-Math.PI / 2));
arm.part('15429', RB, [100, 22, 10], rx(Math.PI));
arm.part('1745', RB, [50, -8, 10]); arm.part('85861', RB, [70, -16, 20]);
for (let q = 0; q < 4; q++) base.add(arm, { M: ry(q * Math.PI / 2), p: [0, 0, 0] });
for (let q = 0; q < 4; q++) quarter(base, '7033', RB, -24, q);
A.add(base, { M: ry(Math.PI / 4), p: [0, 0, 0] });

// ===== kroky 7–14: baňatá šalvějová váza, zlatý pás, horní prstenec, makaróny, hrdlo z kola =====
const T = -88;
const pot = new Asm();
for (let q = 0; q < 4; q++) quarter(pot, '76776', SG, T + 80, q, true);
pot.part('39789', RB, [0, T, 0]); pot.part('3010', YE, [0, T - 24, -30]); pot.part('3010', YE, [0, T - 24, 30]);
pot.part('60474', OR, [0, T - 24, 0]);
for (const s of [-1, 1]) {
  for (const z of [-20, 20]) pot.part('52107', K, [62 * s, T - 24, z], ry(Math.PI / 2));
}
const BC = T - 10, RIN = 76;
const band = (id, col, n, t, mid, zc = 0) => { const My = scl(n, -1), Mz = t, Mx = cross(My, Mz); const o = add(add(mid, scl(n, 24)), scl(t, -zc)); pot.part(id, col, [o[0], BC, o[2]], basis(Mx, My, Mz)); };
for (const s of [-1, 1]) {
  for (const x of [-30, 30]) band('50950', MG, [0, 0, s], [-Math.sign(x), 0, 0], [x, 0, RIN * s]);
  for (const z of [-20, 20]) band('28192', MG, [s, 0, 0], [0, 0, -Math.sign(z)], [(RIN - 4) * s, 0, z], -10);
}
for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
  const p0 = [60 * sx, 0, (RIN + 12) * sz], p1 = [(RIN + 12) * sx, 0, 40 * sz], t = norm(sub(p1, p0));
  let n = norm([t[2], 0, -t[0]]); if (dot(n, [sx, 0, sz]) < 0) n = scl(n, -1);
  band('50950', MG, n, t, sub(scl(add(p0, p1), 0.5), scl(n, 18)));
}
for (let q = 0; q < 4; q++) pot.part('24599', SG, [0, T - 44, 0], ry(q * Math.PI / 2));          // zaoblené rameno (krok 10–11)
for (let q = 0; q < 4; q++) pot.part('79393', SG, [0, T - 52, 0], ry(q * Math.PI / 2));          // makaróny kolem hrdla
const NECK = T - 52;
pot.part('68327', SG, [0, NECK - 30, 0], rx(Math.PI / 2));                                         // hrdlo: kolo 41x15 nastojato (krok 13)
pot.part('11213', LB, [0, NECK - 4, 0]);
for (let i = 0; i < 5; i++) { const a = i * 1.25; pot.part('4032a', OR, [Math.sin(a) * 22, NECK - 36, Math.cos(a) * 22]); }
pot.part('60474', LB, [0, NECK - 28, 0]);
A.add(pot, { M: I, p: [0, 0, 0] });
const TOPN = NECK - 40;

// ===== rozmístění podle obrázku str. 37 =====
const PX0 = 160, PY0 = TOPN, PYP = 510, KK = E('KK', 1.0);
const P = (px, py, z = 0) => [(px - PX0) * KK, PY0 - (PYP - py) * KK, z];

// ===== kroky 15–25: svazek stonku – 3 tmavě zelené sloupce ze spojek os, 2 černé pásky =====
const stem = new Asm();
const cols = [[-11, 0, -6], [11, 0, -6], [0, 0, 12]];
const TOPS = [P(0, 160)[1], P(0, 300)[1], P(0, 380)[1]];        // horní konce sloupců (1 vede k velké hlavě)
cols.forEach((c, i) => {
  const yTop = TOPS[i];
  for (let y = TOPN; y > yTop + 30; y -= 60) stem.part('42195', DG, [PX0 * 0 + c[0], y - 30, c[2]], rx(Math.PI / 2));
});
for (const yb of [P(0, 450)[1], P(0, 345)[1]]) for (let k = 0; k < 3; k++) stem.part('6632', K, [0, yb, 0], mul(ry(k * 2.1), rx(Math.PI / 2), [1, 0, 0, 0, 1, 0, 0, 0, 1]));
A.add(stem, { M: I, p: [0, 0, 0] });

// ===== listy (krok 26): palmový list 6148 na úchytu, levý dolů, pravý nahoru =====
function leaf(at, dir, roll) { // dir = směr listu, líc k divákovi
  const L = new Asm(); L.part('6148', DG, [0, 0, 0]);
  const ex = norm(dir), f = [0, 0, -1], ey = norm(sub(f, scl(ex, dot(f, ex)))), ez = cross(ex, ey);
  A.add(L, { M: mul(basis(ex, ey, ez), rx(roll)), p: at });
  A.part('32828', DG, at, frameZ(dir));
}
leaf(P(100, 370, -12), norm([-0.25, 1, 0]), 0.25);
leaf(P(212, 335, -12), norm([0.3, 1, 0]), -0.25);
// ===== zahnuté stonky s poupaty (krok 27–28): hadovitý díl 40379, na konci kalich a oranžové poupě =====
function bud(at, d) {
  const B = new Asm();
  B.part('15469', DG, [0, 0, 0]); B.part('18674', OR, [0, -6, 0]); B.part('79743', OR, [0, -10, 0]); B.part('68212', OR, [0, -14, 0]);
  A.add(B, { M: basis(cross(scl(d, -1), [0, 0, 1]), scl(d, -1), [0, 0, 1]), p: at });
}
// zahnutý stonek poupěte (krok 27): hadovitý díl 40379 – oblouk z kolmého směru do vodorovného
function curvedStem(at, side, z = -8) {
  const M = side > 0 ? ry(Math.PI / 2) : ry(-Math.PI / 2);
  A.part('40379', DG, at, M);
  const tip = add(at, apply(M, [0, -40, 70])), d = norm(apply(M, [0, 0.15, 1]));
  bud(add(tip, scl(d, 6)), d);
}
curvedStem(P(178, 330, -6), 1);
curvedStem(P(182, 500, -6), 1);
// ===== hlava (kroky 38–48): střed, věnce zahnutých lístků (banán 33085 / dráp 16770) =====
// lístek: báze u středu, tětiva míří ven a nahoru pod úhlem elev, prohnutí ven → špička se stáčí zpět ke středu (incurved)
const PET = { '33085': { d0: norm([32, 0, 42]), q0: norm([-42, 0, 32]), base: [-32, 0, -42] }, '16770': { d0: [0, 0, -1], q0: [0, E('CQ', -1), 0], base: [0, 0, 0] } };
function petalM(id, a, elev, curl = 1) {
  const w = [Math.cos(a), 0, Math.sin(a)], up = [0, -1, 0];
  const c = norm(add(scl(w, Math.cos(elev)), scl(up, Math.sin(elev))));
  let b = norm(add(scl(w, -Math.sin(elev)), scl(up, Math.cos(elev)))); if (curl < 0) b = scl(b, -1); // prohnutí: nahoru/ven
  if (E('FLIP', 1)) b = scl(b, -1);
  const { d0, q0 } = PET[id];
  const n0 = cross(d0, q0), n = cross(c, b);
  const Bl = basis(d0, n0, q0), Bw = basis(c, n, b);
  const BlT = [Bl[0], Bl[3], Bl[6], Bl[1], Bl[4], Bl[7], Bl[2], Bl[5], Bl[8]];
  return mul(Bw, BlT);
}
function head({ s = 1, rings, core = 'big' }) {
  const H = new Asm();
  if (core === 'big') { H.part('75937', RO, [0, 0, 0]); H.part('3941', OR, [0, -8, 0]); H.part('4733', LM, [0, -32, 0]); H.part('67811', YE, [0, -20, 0]); H.part('79743', OR, [0, -56, 0]); }
  else { H.part('18674', OR, [0, 0, 0]); H.part('4733', LM, [0, -24, 0]); H.part('79743', OR, [0, -48, 0]); }
  for (const [id, n, r, y, elev, col, ph, curl, clip] of rings) for (let k = 0; k < n; k++) {
    const a = ph + k * 2 * Math.PI / n, w = [Math.cos(a), 0, Math.sin(a)];
    const Mp = mul(petalM(id, a, elev, curl), S(s));
    H.part(id, col, sub(scl(add(scl(w, r), [0, y, 0]), s), apply(Mp, PET[id].base)), Mp);
    if (clip) H.part('11090', clip, scl(add(scl(w, r - 4), [0, y + 2, 0]), s), mul(basis(cross([0, 1, 0], w), [0, 1, 0], scl(w, -1)), rx(-Math.PI / 2), S(s)));
  }
  return H;
}
const S = (k) => [k, 0, 0, 0, k, 0, 0, 0, k];
const BIG = [
  // [díl, počet, poloměr, výška, elevace, barva, fáze, prohnutí, klip]
  ['33085', 8, 10, -46, E('E1', 1.45), LO, 0, 1, 0],          // krok 44: vnitřní světle oranžové, téměř svisle
  ['33085', 10, 26, -26, E('E2', 1.22), OR, 0.3, 1, RD],      // krok 45–46: oranžové
  ['33085', 10, 36, -10, E('E3', 1.0), OR, 0.0, 1, RD],
  ['33085', 8, 38, 2, E('E4', -0.45), RO, 0.4, -1, RD],       // krok 48: dolní červenooranžové, převislé
];
const SMALL = [['16770', 8, 12, -30, 1.3, OR, 0, 1, 0], ['16770', 8, 22, -12, 0.9, OR, 0.4, 1, 0]];
const headAt = (H, at, up) => A.add(H, { M: basis(cross(scl(up, -1), [0, 0, 1]), scl(up, -1), [0, 0, 1]), p: at });
headAt(head({ s: E('HS', 1.35), rings: BIG }), P(175, 175, -10), norm([0.05, -1, -0.2]));
headAt(head({ s: 1.15, rings: SMALL, core: 'small' }), P(105, 305, -25), norm([-0.35, -1, -0.35]));
A.part('32016', DG, P(140, 360, -10), rz(0.7)); A.part('42195', DG, P(122, 335, -15), mul(rz(0.8), rx(Math.PI / 2)));
A.part('42195', DG, P(150, 330, 0), rx(Math.PI / 2)); A.part('32016', DG, P(130, 345, -5));     // krátká větev k malé hlavě

if (process.env.SUB) { const b = new Build('sub'), X = new Asm(); X.add(process.env.SUB === 'small' ? head({ s: 1, rings: SMALL, core: 'small' }) : head({ s: 1, rings: BIG }), { M: I, p: [0, 0, 0] }); X.emit(b); b.save('sub.ldr'); }
else { const b = new Build('chrysanthemum10368'); A.emit(b); b.save('chrysanthemum10368.ldr'); console.log('chrysanthemum10368 parts', b.n); }
