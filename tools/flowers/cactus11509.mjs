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
  // kroky 48–51: horní hladký lem – zkosené rohy a zkosené strany bez výstupků, otočené zkosením nahoru
  pot.part('5649', LBL, c(-80), mul(R, ry(Math.PI / 2), rx(Math.PI)));
  pot.part('5540', LBL, add(s(-80), apply(R, [-20, 0, 0])), mul(R, ry(E('SR2', Math.PI / 2)), rx(Math.PI)));
}
// hlína: tmavě hnědé desky, kulaté dlaždice a kamínky
const SOIL = -72;
pot.part('3034', RB, [0, SOIL, -20]); pot.part('3034', RB, [0, SOIL, 20]); pot.part('3034', RB, [0, SOIL, 60]); pot.part('3034', RB, [0, SOIL, -60]);
for (const [x, z] of [[-60, -20], [60, 60], [-70, 70], [70, -60], [10, -70]]) pot.part('14769', RB, [x, SOIL - 8, z]);
for (let k = 0; k < 14; k++) { const a = k * 2.3, r = 40 + (k * 13) % 50; pot.part('85861', DT, [Math.cos(a) * r, SOIL - 8, Math.sin(a) * r]); }
A.add(pot, { M: I, p: [0, 0, 0] });
const TOPS = SOIL - 8;

// ===== žebro kaktusu (krok 54): deska 1xN, oblé destičky, oblé konce, trny =====
// žebro (krok 55): deska 1xN, oblé destičky 1x2 s otevřenými výstupky, zelené kulaté destičky, dvojité svahy 1x1 jako hřbet,
// na koncích oblé díly 2x1 svažující se ke koncům (zaoblený vršek a spodek), trny = béžové kulaté destičky + trojzubce
function rib(len, base, spines) {
  const R = new Asm(), h = len * 10, col = len === 10 ? SG : DG;
  R.part(len === 10 ? '4477' : '3666', col, [0, 0, 0]);
  R.part('11477', SG, [h - 20, 0, 0], ry(-Math.PI / 2)); R.part('11477', SG, [-h + 20, 0, 0], ry(Math.PI / 2));
  const inner = [];
  for (let x = -h + 40; x <= h - 40; x += 20) inner.push(x);
  inner.forEach((x, i) => {
    if (i % 2 === 0) { R.part('35480', SG, [x + 10, -8, 0]); }
  });
  for (let x = -h + 50; x <= h - 50; x += 40) R.part('35464', SG, [x, 0, 0], ry(Math.PI / 2));
  spines.forEach((t) => { const x = Math.round((-h + 50 + t * (2 * h - 100)) / 20) * 20 + 10; R.part('85861', DT, [x, -12, 0]); R.part('68211', TN, [x, -16, 0], ry(t * 3)); });
  return R;
}
function column(cx, cz, ribs, len, r, spineSets, yaw = 0) {
  for (let k = 0; k < ribs; k++) {
    const a = yaw + k * 2 * Math.PI / ribs, n = [Math.sin(a), 0, -Math.cos(a)];
    const ex = [0, 1, 0], ey = scl(n, -1), ez = cross(ex, ey);
    A.add(rib(len, 0, spineSets[k % spineSets.length]), { M: basis(ex, ey, ez), p: add([cx, TOPS - len * 10, cz], scl(n, r)) });
  }
}
// velký kaktus (8 žeber 1x10, krok 54–69) vzadu vpravo, malý (8 žeber 1x6, krok 78–89) vpředu vlevo – baňaté, žebra s mezerami
const BX = E('BX', 30), BZ = E('BZ', 24), SX = E('SXC', -60), SZ = E('SZ', -56);
const RB_ = E('RBIG', 50), RS_ = E('RSM', 28);
column(BX, BZ, 12, 10, RB_, [[0.1, 0.5, 0.9], [0.3, 0.7]], Math.PI / 12);
for (const y of [TOPS - 40, TOPS - 100, TOPS - 160]) A.part('68888', RB, [BX, y, BZ]);
for (let y = TOPS - 24; y >= TOPS - 196; y -= 24) { A.part('87081', DG, [BX, y, BZ]); for (let q = 0; q < 8; q++) A.part('3941', DG, [BX + Math.cos(q * Math.PI / 4) * 34, y, BZ + Math.sin(q * Math.PI / 4) * 34]); }                  // tmavě zelené jádro – vyplní mezery mezi žebry          // jádro: náboje se 4 tyčkami
const TOPB = TOPS - 208;
A.part('67811', DG, [BX, TOPB, BZ]);                                                              // tmavě zelený volant na vršku (krok 65)
column(SX, SZ, 8, 6, RS_, [[0.2, 0.8], [0.5]], 0);
for (const y of [TOPS - 40, TOPS - 90]) A.part('68888', RB, [SX, y, SZ]);
for (let y = TOPS - 24; y >= TOPS - 120; y -= 24) { A.part('3941', DG, [SX, y, SZ]); for (let q = 0; q < 8; q++) A.part('3062b', DG, add([SX, y, SZ], [Math.cos(q * Math.PI / 4 + 0.39) * 17, 0, Math.sin(q * Math.PI / 4 + 0.39) * 17])); }
const TOPSM = TOPS - 128;
for (let q = 0; q < 4; q++) A.part('27925', SG, [SX, TOPSM, SZ], ry(q * Math.PI / 2));          // zaoblený vršek malého kaktusu

// ===== květ na velkém kaktusu (kroky 91–96) =====
// 91: žlutá destička se středovým výstupkem; 92: 8 purpurových ramen 59230 sepnutých na obruči volantu, na konci každého
// tmavě růžový štít 3846 (širokým koncem ven, špičkou ke středu); 93: purpurový rám 7068 se 4 trojúhelníky 65676a;
// 94: limetkový střed a žluté ozubené kolo (tyčinky); 95–96: ramena i trojúhelníky zvednuté vzhůru → otevřený květ
function bloom(c) {
  // podle obalu: ramena vycházejí blízko středu, štít (lístek) leží na rameni z vnější strany – špičkou ven a nahoru,
  // lícem ven, úchyt na vnitřní straně sepnutý klipem ramene; 4 trojúhelníky stojí u středu špičkou nahoru;
  // uprostřed velké žluté ozubené kolo (tyčinky) s limetkovým vrškem
  const F = new Asm(), up = [0, -1, 0];
  F.part('18674', YE, [0, -8, 0]);
  F.part('7068', MA, [0, -16, 0]);
  const AE = E('AE', 1.0), R0 = E('R0', 20);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + Math.PI / 8, w = [Math.cos(a), 0, Math.sin(a)];
    const d = norm(add(scl(w, Math.cos(AE)), scl(up, Math.sin(AE))));                 // rameno ven a vzhůru
    const u = norm(add(scl(w, -Math.sin(AE)), scl(up, Math.cos(AE))));                // kolmo k ramenu, k ose květu
    const r0 = add(scl(w, R0), [0, -14, 0]);
    const yA = scl(d, -1), zA = norm(cross(w, up)), xA = cross(yA, zA);
    F.part('59230', MA, add(r0, scl(d, 45)), basis(xA, yA, zA));                      // rameno: klip u středu, konec ven
    const at = add(r0, scl(d, E('AT', 20)));                                           // místo, kde klip drží úchyt štítu
    const yS = d, zS = u, xS = cross(yS, zS);                                          // štít: špička (+y) ven, líc (−z) ven, úchyt (+z) k rameni
    const MS = mul(basis(xS, yS, zS), S(E('PS', 1.15)));
    F.part('3846', DP, sub(sub(at, scl(u, 6)), apply(MS, [0, 9, 14])), MS);
  }
  const TE = E('TE', 1.25);
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, w = [Math.cos(a), 0, Math.sin(a)];
    const d = norm(add(scl(w, Math.cos(TE)), scl(up, Math.sin(TE)))), u = norm(add(scl(w, -Math.sin(TE)), scl(up, Math.cos(TE))));
    const yT = scl(d, -1), zT = u, xT = cross(yT, zT);                                 // trojúhelník: špička (−y) nahoru, líc ven
    const MT = mul(basis(xT, yT, zT), S(E('TS', 1.0)));
    F.part('65676a', MA, sub(add(scl(w, 24), [0, -22, 0]), apply(MT, [0, 8, 2])), MT);
  }
  F.part('85861', LM, [0, -24, 0]);
  F.part('69762', YE, [0, -46, 0], rx(-Math.PI / 2));
  F.part('85861', LM, [0, -56, 0]); F.part('3062b', 2, [0, -60, 0]);
  A.add(F, { M: I, p: c });
}
if (process.env.SUB !== 'bloom') bloom([BX, TOPB, BZ]);

// ===== poupata na malém kaktusu (kroky 97–103): zelená hlavička + zelený kalich (korunka) + tmavě růžová pivoňka =====
function bud(p, az, tilt, small = false) {
  // poupě vyrůstá z horního okraje malého kaktusu šikmo ven (směr az, náklon tilt od svislice)
  const w = [Math.cos(az), 0, Math.sin(az)], d = norm(add(scl(w, Math.sin(tilt)), [0, -Math.cos(tilt), 0]));
  const y = scl(d, -1), x = norm(cross(y, [0, 0, 1].map((v, i) => (Math.abs(d[2]) > 0.9 ? [1, 0, 0][i] : v)))), z = cross(x, y);
  const B = new Asm();
  B.part('85861', DP, [0, 0, 0]);
  if (!small) B.part('28621', SG, [0, -24, 0]);                                    // zelené tělo poupěte (sedí na destičce)                                       // zelené tělo poupěte
  B.part('39262', SG, [0, small ? -6 : -26, 0]);                                     // kalich – zuby nahoru
  B.part('5904', DP, [0, small ? -14 : -32, 0]);                                     // tmavě růžový květ
  A.add(B, { M: basis(x, y, z), p });
}
const T0 = [SX, TOPSM + 2, SZ], D2 = Math.PI / 180;
for (const [az, r, tilt, sm] of [[200, 12, 0.5, false], [250, 14, 0.7, false], [150, 13, 0.6, false], [300, 10, 0.4, false], [90, 4, 0.15, false]])
  bud(add(T0, [Math.cos(az * D2) * r, 0, Math.sin(az * D2) * r]), az * D2, tilt, sm);
for (const az of [20, 330, 120]) A.part('24866', MA, add(T0, [Math.cos(az * D2) * 16, -2, Math.sin(az * D2) * 16]));

if (process.env.SUB === 'bloom') { A.items = []; bloom([0, 0, 0]); const b = new Build('sub'); A.emit(b); b.save('sub.ldr'); process.exit(0); }
if (process.env.SUB === 'rib') { const b = new Build('sub'), X = new Asm(); X.add(rib(10, 0, [0.1, 0.5, 0.9]), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); X.emit(b); b.save('sub.ldr'); process.exit(0); }
const b = new Build('cactus11509'); A.emit(b); b.save('cactus11509.ldr'); console.log('cactus11509 parts', b.n);
