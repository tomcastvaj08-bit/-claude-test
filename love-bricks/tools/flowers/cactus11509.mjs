// Kaktus 11509 – stavba z dílků podle oficiálního návodu (6618824) a inventáře Rebrickable.
// Souřadnice LDraw: Y dolů (podlaha y = 0), divák na -z. Podle závěrečného obrázku návodu (str. 58) a obálky.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const LBL = 212, SG = 378, DG = 288, TN = 19, DT = 28, RB = 70, MA = 26, DP = 5, YE = 14, LM = 27, BK = 0, W = 15, LAV = 31;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const S = (k) => [k, 0, 0, 0, k, 0, 0, 0, k];
const A = new Asm();

// ===== kroky 1–24: zaoblený čtvercový květináč 12x12 (zkosené dno, 2 vrstvy stěn, přesahující okraj) =====
const pot = new Asm();
for (let q = 0; q < 4; q++) {
  const R = ry(q * Math.PI / 2), c = (y) => apply(R, [40, y, -40]);
  pot.part('5649', LBL, c(-24), mul(R, ry(E('CR', 0))));                         // zkosený roh dna
  pot.part('48092', LBL, c(-48), mul(R, ry(E('CR', 0))));                        // zaoblené rohy stěn
  pot.part('48092', LBL, c(-72), mul(R, ry(E('CR', 0))));
  pot.part('80015', LBL, c(-80), mul(R, ry(E('CR', 0))));                        // okraj s přesahem
  const s = (y) => apply(R, [E('SX', 110), y, 0]);
  pot.part('5540', LBL, add(s(-24), apply(R, [-20, 0, 0])), mul(R, ry(E('SR', -Math.PI / 2))));             // zkosená strana dna
  pot.part('3004', LBL, add(s(-48), apply(R, [0, 0, -20])), mul(R, ry(Math.PI / 2))); pot.part('3004', LBL, add(s(-48), apply(R, [0, 0, 20])), mul(R, ry(Math.PI / 2)));
  pot.part('3004', LBL, add(s(-72), apply(R, [0, 0, -20])), mul(R, ry(Math.PI / 2))); pot.part('3004', LBL, add(s(-72), apply(R, [0, 0, 20])), mul(R, ry(Math.PI / 2)));
  pot.part('3710', LBL, add(s(-80), [0, 0, 0]), mul(R, ry(Math.PI / 2)));
}
// hlína: tmavě hnědé desky, kulaté dlaždice a kamínky
const SOIL = -64;
pot.part('3034', RB, [0, SOIL, -20]); pot.part('3034', RB, [0, SOIL, 20]); pot.part('3034', RB, [0, SOIL, 60]); pot.part('3034', RB, [0, SOIL, -60]);
for (const [x, z] of [[-60, -20], [60, 60], [-70, 70], [70, -60], [10, -70]]) pot.part('14769', RB, [x, SOIL - 8, z]);
for (let k = 0; k < 14; k++) { const a = k * 2.3, r = 40 + (k * 13) % 50; pot.part('85861', DT, [Math.cos(a) * r, SOIL - 8, Math.sin(a) * r]); }
A.add(pot, { M: I, p: [0, 0, 0] });
const TOPS = SOIL - 8;

// ===== žebro kaktusu (krok 54): deska 1xN, oblé destičky, oblé konce, trny =====
function rib(len, base, spines) {
  const R = new Asm(), h = len * 10;
  R.part(len === 10 ? '4477' : '3666', len === 10 ? SG : DG, [0, 0, 0]);
  R.part('11477', SG, [h - 20, 0, 0], ry(E('ER', -Math.PI / 2))); R.part('11477', SG, [-h + 20, 0, 0], ry(-E('ER', -Math.PI / 2)));
  for (let x = -h + 60; x <= h - 60; x += 40) R.part('35480', SG, [x, -8, 0]);
  spines.forEach((t) => { const x = -h + 30 + t * (2 * h - 60); R.part('85861', DT, [x, -16, 0]); R.part('68211', TN, [x, -20, 0], ry(t * 3)); });
  return R;
}
function column(cx, cz, ribs, len, r, spineSets, yaw = 0) {
  for (let k = 0; k < ribs; k++) {
    const a = yaw + k * 2 * Math.PI / ribs, n = [Math.sin(a), 0, -Math.cos(a)];
    const ex = [0, 1, 0], ey = scl(n, -1), ez = cross(ex, ey);
    A.add(rib(len, 0, spineSets[k % spineSets.length]), { M: basis(ex, ey, ez), p: add([cx, TOPS - len * 10, cz], scl(n, r)) });
  }
}
// velký kaktus (8 žeber 1x10) vzadu vpravo, malý (6 žeber 1x6) vpředu vlevo
const BX = E('BX', 26), BZ = E('BZ', 22), SX = E('SXC', -48), SZ = E('SZ', -30);
column(BX, BZ, 8, 10, 30, [[0.1, 0.5, 0.9], [0.3, 0.7]], 0.2);
A.part('67811', DG, [BX, TOPS - 206, BZ]);                                        // tmavě zelený vršek
column(SX, SZ, 6, 6, 24, [[0.2, 0.8], [0.5]], 0.5);
A.part('4032a', SG, [SX, TOPS - 126, SZ]);

// ===== květ na velkém kaktusu (kroky 91–96): žlutý střed, 8 tmavě růžových štítů, 4 purpurové trojúhelníky =====
function bloom(c) {
  const F = new Asm();
  F.part('18674', YE, [0, -10, 0]); F.part('69762', YE, [0, -22, 0], rx(Math.PI / 2)); F.part('85861', LM, [0, -32, 0]);
  const petal = (id, col, a, r, y, tilt) => {
    const w = [Math.cos(a), 0, Math.sin(a)], up = norm(add(scl(w, Math.sin(tilt)), [0, -Math.cos(tilt), 0]));
    const zz = norm(cross(w, [0, 1, 0])), yy = cross(zz, up);
    F.part(id, col, add(scl(w, r), [0, y, 0]), basis(cross(yy, zz), yy, zz).map((v) => v) && mul(basis(zz, up, cross(zz, up)), rz(0)));
  };
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, w = [Math.cos(a), 0, Math.sin(a)];
    const out = norm(add(scl(w, 0.9), [0, -0.8, 0])), side = norm(cross([0, 1, 0], w)), nrm = cross(side, out);
    F.part('65676a', MA, add(scl(w, 30), [0, -4, 0]), mul(basis(side, scl(out, E('TF', -1)), scl(nrm, E('TF', -1))), S(1.45))); }
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, w = [Math.cos(a), 0, Math.sin(a)];
    const out = norm(add(scl(w, E('SW', 1.3)), [0, -0.55, 0])), side = norm(cross([0, 1, 0], w)), nrm = cross(side, out);
    F.part('3846', DP, add(scl(w, 20), [0, -10, 0]), mul(basis(side, out, scl(nrm, -1)), S(1.3))); }
  A.add(F, { M: I, p: c });
}
bloom([BX, TOPS - 214, BZ]);
// poupata na malém kaktusu (kroky 99–103): pivoňkové kvítky a purpurové kvítky
for (const [dx, dz, id, col] of [[-16, -8, '5904', DP], [14, -12, '5904', DP], [-6, 16, '5904', DP], [18, 14, '24866', MA], [-20, 12, '24866', MA], [0, -20, '5904', DP]])
  A.part(id, col, [SX + dx, TOPS - 128, SZ + dz]);

const b = new Build('cactus11509'); A.emit(b); b.save('cactus11509.ldr'); console.log('cactus11509 parts', b.n);
