// Kvetoucí slivoň 10369 – stavba z dílků podle oficiálního návodu (6533548) a inventáře Rebrickable.
// Souřadnice LDraw: Y dolů, divák na -z. Rozmístění větví a květů podle závěrečného obrázku návodu (str. 53).
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm, frameZ, along } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const K = 0, RB = 70, SB = 379, MG = 82, DB = 308, RD = 4, DP = 5, MA = 26, LY = 226, DR = 320, TN = 19, W = 15, DK = 72, LB = 71, BL = 1, RO = 402;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
const A = new Asm();
const quarter = (S, id, col, y, q, flip = false, off = [-10, 0, 10]) => { const M = flip ? mul(ry(q * Math.PI / 2), rx(Math.PI)) : ry(q * Math.PI / 2); S.part(id, col, add(scl(apply(M, off), -1), [0, y, 0]), M); };

// ===== kroky 1–7: podstavec =====
const base = new Asm();
base.part('74611', K, [0, 0, 0]);
base.part('41740', W, [0, -8, -10]); base.part('41740', W, [0, -8, 10]);
const arm = new Asm();
arm.part('3021', RB, [70, 8, 0]); arm.part('4304', RB, [90, 16, 0], ry(-Math.PI / 2)); arm.part('15429', RB, [100, 22, 10], rx(Math.PI));
arm.part('1745', RB, [50, -8, 10]); arm.part('85861', RB, [70, -16, 20]);
for (let q = 0; q < 4; q++) base.add(arm, { M: ry(q * Math.PI / 2), p: [0, 0, 0] });
for (let q = 0; q < 4; q++) quarter(base, '7033', RB, -24, q);
A.add(base, { M: ry(Math.PI / 4), p: [0, 0, 0] });

// ===== kroky 8–19: nízká široká pískově modrá váza se zlatým pásem, schodek a vysoké hrdlo ze dvou kol =====
const pot = new Asm();
for (let q = 0; q < 4; q++) pot.part('24599', SB, [0, -24, 0], mul(ry(q * Math.PI / 2), rx(Math.PI)));   // spodní zaoblení
pot.part('87081', K, [0, -48, 0]); pot.part('11213', LB, [0, -52, 0]);
for (const s of [-1, 1]) { for (const z of [-20, 20]) pot.part('52107', K, [62 * s, -48, z], ry(Math.PI / 2)); }
const BC = -48 - 20, RIN = 76;
const band = (id, n, t, mid, zc = 0) => { const My = scl(n, -1), Mz = t, Mx = cross(My, Mz); const o = add(add(mid, scl(n, 24)), scl(t, -zc)); pot.part(id, MG, [o[0], -58, o[2]], basis(Mx, My, Mz)); };
for (const s of [-1, 1]) {
  for (const x of [-30, 30]) band('50950', [0, 0, s], [-Math.sign(x), 0, 0], [x, 0, RIN * s]);
  for (const z of [-20, 20]) band('28192', [s, 0, 0], [0, 0, -Math.sign(z)], [(RIN - 4) * s, 0, z], -10);
}
for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
  const p0 = [60 * sx, 0, (RIN + 12) * sz], p1 = [(RIN + 12) * sx, 0, 40 * sz], t = norm(sub(p1, p0));
  let n = norm([t[2], 0, -t[0]]); if (dot(n, [sx, 0, sz]) < 0) n = scl(n, -1);
  band('50950', n, t, sub(scl(add(p0, p1), 0.5), scl(n, 18)));
}
for (let q = 0; q < 4; q++) pot.part('24599', SB, [0, -92, 0], ry(q * Math.PI / 2));                        // horní zaoblení
for (let q = 0; q < 4; q++) pot.part('65617', SB, [0, -116, 0], ry(q * Math.PI / 2));                       // schodek 3x3
for (let q = 0; q < 4; q++) pot.part('65617', SB, [0, -116, 0], ry(q * Math.PI / 2 + Math.PI / 4));        // druhá vrstva schodku (překrytá)
pot.part('68327', SB, [0, -146, 0], rx(Math.PI / 2)); pot.part('68327', SB, [0, -186, 0], rx(Math.PI / 2)); // hrdlo
pot.part('60474', DB, [0, -202, 0]); pot.part('11213', 308, [0, -190, 0]);
A.add(pot, { M: I, p: [0, 0, 0] });

// ===== rozmístění podle obrázku str. 53 =====
const KK = E('KK', 1.2);
const P = (px, py, z = 0) => [(px - 222) * KK, -216 + (py - 510) * KK, z];
// větev: tmavě hnědé úhlové spojky po celé délce, v uzlech kloub (kulatá destička)
function branch(pts, z0 = 0) {
  const Q = pts.map(([x, y, z]) => P(x, y, (z ?? 0) + z0));
  const C = along(Q, 12);
  for (let s = 0; s < C.total; s += 26) { const m = C.at(s); A.part('32016', DB, m.p, mul(frameZ(m.d, [0, 0, -1]), rz(((s / 26) % 2) * Math.PI))); }
  for (const q of Q.slice(1, -1)) A.part('85861', RB, q, rx(Math.PI / 2));
  for (const pt of C.pts) BR.push(pt);
  return Q;
}
// větvička na konci: trojzubec (mrkvová nať / stonek se 6 výhonky) a fialová poupátka
// větvička (kroky 30–34): stonek se 6 výhonky zasunutý tyčkou přímo do větve, na koncích výhonků purpurové kvítky
const SPR = [[[-5, -7.5, 0], [-18.5, -30.8, 0]], [[3.8, -4.4, 0], [29.1, -13.6, 0]], [[2.5, -7.5, 4.3], [9.3, -30.8, 16]],
             [[-1.9, -4.4, -3.3], [-14.6, -13.6, -25.2]], [[2.5, -7.5, -4.3], [9.3, -30.8, -16]], [[-1.9, -4.4, 3.3], [-14.6, -13.6, 25.2]]];
const BR = [];                                                    // body všech větví (pro přichycení větviček)
function twig(px, py, dir, z = 0, roll = 0) {
  const t = P(px, py, z);
  let q = BR[0]; for (const b of BR) if (Math.hypot(b[0] - t[0], b[1] - t[1]) < Math.hypot(q[0] - t[0], q[1] - t[1])) q = b;   // nejbližší bod větve
  const d = norm(dir), y = scl(d, -1), x = norm(cross(y, [0, 0, 1])), M = mul(basis(x, y, cross(x, y)), ry(roll));
  const T = new Asm();
  T.part('19119', DB, [0, -6, 0]);                                // tyčka (y 0..+10) zasunutá ve větvi
  for (const [b, tip] of SPR) { const dd = norm(sub(tip, b)), yy = scl(dd, -1), xx = norm(cross(yy, [0, 0, 1])); T.part('24866', MA, add(add(tip, [0, -6, 0]), scl(dd, 1)), basis(xx, yy, cross(xx, yy))); }
  A.add(T, { M, p: q });
}
// zvlněný konec větve (tentakl 80497) s poupátkem
function curl(px, py, dir, flip = 1, z = 0) { // tentakl roste podél dir, ohyb nahoru
  const p = P(px, py, z), d = norm(dir), u = norm(sub([0, -1, 0], scl(d, dot([0, -1, 0], d))));
  const ez = scl(u, flip), ex = cross(d, ez);
  A.part('80497', DB, p, basis(ex, d, ez));
}
// velký červený květ: 5 kulatých okvětních lístků do misky, tmavě růžový střed, žluté tyčinky (koruna)
function flower(px, py, z, tilt = 0.25, yaw = 0) {
  const F = new Asm();
  for (let k = 0; k < 5; k++) {
    const a = yaw + k * 2 * Math.PI / 5, w = [Math.cos(a), Math.sin(a), 0];
    const n = norm(add([0, 0, -1], scl(w, -Math.sin(E('PC', 0.3)))));      // hladká oblá strana k divákovi              // vypouklá strana misky k divákovi, lístky do misky
    const ex = norm(cross(w, n)), Mp = basis(ex, n, cross(ex, n));
    F.part('2654a', RD, add(scl(w, E('PR', 30)), [0, 0, 6]), Mp);
  }
  F.part('39262', MA, [0, 0, -2], rx(Math.PI / 2));                                // tmavý střed (miska)
  F.part('25516', LY, [0, 0, -4], rx(Math.PI / 2));                                // žluté tyčinky
  const c = P(px, py, z); let q = BR[0]; for (const t of BR) if (Math.hypot(t[0] - c[0], t[1] - c[1]) < Math.hypot(q[0] - c[0], q[1] - c[1])) q = t;
  const cc = [c[0], c[1], q[2] - 22];                                               // květ těsně před větví
  A.part('59900', DB, add(q, [0, 0, -6]), rx(-Math.PI / 2));                         // kuželová stopka z větve ke květu
  A.add(F, { M: mul(rx(tilt), ry(yaw * 0.2)), p: cc });
}
const pinkBud = (px, py, z = -10) => { const t = P(px, py, z); let q = BR[0]; for (const c of BR) if (Math.hypot(c[0] - t[0], c[1] - t[1]) < Math.hypot(q[0] - t[0], q[1] - t[1])) q = c; const p = add(q, [0, -14, -6]); A.part('65578', DR, add(q, [0, -4, -6]), rx(Math.PI)); A.part('39262', MA, p); A.part('5234', DP, add(p, [0, 6, 0])); }; // růžové poupě na krátké stopce přímo na větvi
// kmen (1:1 výkres str. 25) a větve
branch([[215, 515], [205, 470], [218, 430], [228, 395], [248, 355], [245, 300], [235, 255], [205, 200], [165, 165], [135, 130], [105, 90], [75, 45]], 6);
branch([[214, 448], [175, 452], [150, 445]], 8); curl(150, 445, [-1, -0.2, 0], 1, 8);
branch([[222, 452], [270, 470], [320, 462]], 8); curl(320, 462, [1, -0.3, 0], -1, 8);
branch([[245, 360], [200, 340], [160, 318], [150, 295]], 4); curl(150, 295, [-0.6, -1, 0], 1, 4);
branch([[240, 262], [275, 222], [300, 200]], 4); twig(300, 200, [0.4, -1, 0], 4);
twig(72, 42, [-0.4, -1, 0], 6); twig(110, 125, [-1, -0.4, 0], 6); twig(150, 150, [0.6, -1, 0], 6);
twig(118, 412, [-1, -0.6, 0], 8); twig(385, 432, [1, -0.3, 0], 8); twig(345, 480, [1, 0.4, 0], 8);
twig(122, 272, [-1, -0.5, 0], 4); twig(355, 312, [1, -0.2, 0], 4);
// květy (5) a růžová poupata (4)
flower(240, 232, -40, 0.15, 0.2);
flower(203, 345, -45, 0.2, 0.6);
flower(298, 318, -40, 0.1, 0.1);
flower(283, 418, -45, 0.2, 0.9);
flower(195, 487, -45, 0.15, 0.4);
pinkBud(146, 186); pinkBud(186, 206); pinkBud(240, 292); pinkBud(287, 487);

const b = new Build('plum10369'); A.emit(b); b.save('plum10369.ldr'); console.log('plum10369 parts', b.n);
