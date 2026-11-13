// Mini orchidej 10343 – stavba z dílků krok po kroku podle oficiálního návodu (díly a barvy z inventáře Rebrickable).
// Souřadnice LDraw: Y dolů, líc = -z. Nula: horní plocha černé kulaté desky 8x8 (krok 1).
// Stonek: přesně podle výkresu 1:1 (str. 31) – úhlové spojky 157,5° a černé náboje, ohyby po 22,5°.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm, frameZ } from './asm.mjs';
const K = 0, RB = 70, NG = 92, LN = 78, MG = 82, PG = 297, DG = 288, GR = 2, BG = 10, LM = 27, BP = 29, DP = 5, RO = 402, DT = 28, TN = 19, W = 15, YE = 14, LB = 71, DK = 72, RD = 4, PK = 13;
const b = new Build('miniorchid10343'), A = new Asm();
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
// čtvrtkruhový díl 5x5: střed oblouku (lokálně [-10,0,10]) na osu
const quarter = (S, id, col, y, q, flip = false) => { const M = flip ? mul(ry(q * Math.PI / 2), rx(Math.PI)) : ry(q * Math.PI / 2); S.part(id, col, add(scl(apply(M, [-10, 0, 10]), -1), [0, y, 0]), M); };

// ===== krok 1–6: podstavec =====
const base = new Asm();
base.part('74611', K, [0, 0, 0]);
base.part('41740', DT, [0, -8, -10]); base.part('41740', DT, [0, -8, 10]);
base.part('3068b', DK, [0, -16, 0]);
for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2; base.part('60897', K, [Math.sin(a) * 30, -16, Math.cos(a) * 30], ry(a)); base.part('20482', TN, [Math.sin(a) * 30, -32, Math.cos(a) * 30]); } // nosič mísy (krok 4)
const arm = new Asm();
arm.part('3021', RB, [70, 8, 0]);                                   // 2x3 pod deskou, přesah o řadu
arm.part('4304', RB, [90, 16, 0], ry(-Math.PI / 2));                // 2x2 s výstupky do strany ven
arm.part('15429', RB, [100, 24, 10], [0, -1, 0, 0, 0, 1, -1, 0, 0]); // kočičí ocásek = stočená nožka
arm.part('3021', RB, [50, -8, 10]); arm.part('6141', RB, [70, -16, 20]); // horní kříž (krok 3)
for (let q = 0; q < 4; q++) base.add(arm, { M: ry(q * Math.PI / 2), p: [0, 0, 0] });
for (let q = 0; q < 4; q++) quarter(base, '7033', RB, -24, q);      // hnědý prstenec (krok 5)
A.add(base, { M: ry(Math.PI / 4), p: [0, 0, 0] });                   // nožky šikmo k divákovi jako na obrázku

// ===== krok 7–15: květináč =====
const T = -88;                                                       // plochá strana mísy (horní)
const pot = new Asm();
for (let q = 0; q < 4; q++) quarter(pot, '76776', NG, T + 80, q, true); // mísa ze 4 čtvrtkupolí kupolí dolů
pot.part('39789', RB, [0, T, 0]); pot.part('39789', RB, [0, T, -40]); pot.part('39789', RB, [0, T, 40]);
pot.part('3010', TN, [0, T - 24, -30]); pot.part('3010', TN, [0, T - 24, 30]);
// vnitřní nosiče pásu: růžové (±x) a žluté (±z) sestavy s bílými kostkami s boky
for (const s of [-1, 1]) {
  
  for (const z of [-20, 20]) pot.part('52107', W, [62 * s, T - 24, z], ry(Math.PI / 2));
  
  for (const x of [-30, 30]) pot.part('52107', W, [x, T - 24, 62 * s]);
}
// zlatý pás = osmiúhelník: 2x oblý 3x1 na žlutých stranách, 2x 45° 2x1 na růžových, oblé 3x1 v rozích
const BC = T - 10, RIN = 76;
const band = (id, col, n, t, mid, len, zc = 0) => { // n ven, t tečna, mid = střed úseku na vnitřní ploše
  const My = scl(n, -1), Mz = t, Mx = cross(My, Mz);
  const M = basis(Mx, My, Mz), o = add(add(mid, scl(n, 24)), scl(t, -zc));
  pot.part(id, col, [o[0], BC, o[2]], M);
};
for (const s of [-1, 1]) {
  for (const x of [-30, 30]) band('50950', MG, [0, 0, s], [-Math.sign(x), 0, 0], [x, 0, RIN * s]);
  for (const z of [-20, 20]) band('28192', MG, [s, 0, 0], [0, 0, -Math.sign(z)], [(RIN - 4) * s, 0, z], 40, -10);
}
for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
  const p0 = [60 * sx, 0, (RIN + 12) * sz], p1 = [(RIN + 12) * sx, 0, 40 * sz], t = norm(sub(p1, p0));
  let n = norm([t[2], 0, -t[0]]); if (dot(n, [sx, 0, sz]) < 0) n = scl(n, -1);
  band('50950', MG, n, t, sub(scl(add(p0, p1), 0.5), scl(n, 18)));
}
for (let q = 0; q < 4; q++) quarter(pot, '7033', NG, T - 44, q);   // horní nugátový prstenec (krok 15)
// hlína (krok 14): tmavě béžová kulatá deska 6x6, hnědé úchyty, kulaté dílky
const TOP = T - 20;
pot.part('11213', DT, [0, TOP, 0]);
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const R = (x, z) => [x * Math.cos(a) + z * Math.sin(a), TOP - 8, -x * Math.sin(a) + z * Math.cos(a)];
  pot.part('88072', RB, R(20, 30), ry(a)); pot.part('6141', RB, R(40, 10)); pot.part('6141', RB, R(40, 10).map((v, k) => k === 1 ? v - 8 : v)); pot.part('1745', RB, R(-10, 50), ry(a)); }
A.add(pot, { M: ry(0.2), p: [0, 0, 0] });

// ===== krok 16–22: stonek =====
// sloupek: 59443 / 2x tenký nosník / 59443 / 59443 / 32016, pak řetěz z výkresu 1:1
const stem = new Asm();
const axC = (p, d) => stem.part('59443', DG, p, frameZ(d, [0, 0, -1]));          // spojka os (místní z podél d)
const perpZ = (d) => norm(sub([0, 0, 1], scl(d, d[2])));
const hub = (p, d) => stem.part('27940', K, p, basis(d, cross(d, perpZ(d)), scl(perpZ(d), -1))); // boky s křížem k divákovi // náboj: osa podél d, otvor pro kolík k divákovi
const bend = (v, din, dout) => { // úhlová spojka 157,5°: ramena podél -din a dout
  const ez = norm(add(din, dout)), ey = scl(norm(sub(dout, din)), +1), ex = cross(ey, ez);
  stem.part('32016', DG, v, basis(ex, ey, ez));
};
const up = [0, -1, 0];
let p = [0, TOP - 4, 0];
const dirA = (deg) => [Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180), 0];
const go = (d, l) => { p = add(p, scl(d, l)); return p; };
axC(add(p, scl(up, 20)), up); go(up, 40);
stem.part('41677', K, add(p, [0, -5, 0]), ry(-Math.PI / 4)); stem.part('41677', K, add(p, [0, -15, 0]), ry(-Math.PI / 4)); go(up, 20); // 2x tenký nosník naplocho, druhý otvor pro hnědou oporu
const beamTop = [...p];
axC(add(p, scl(up, 20)), up); go(up, 40); axC(add(p, scl(up, 20)), up); go(up, 40);
go(up, 30); const C0 = [...p];
const hubs = [];
const turn = (d, toward, deg) => { const t = norm(sub(toward, scl(d, dot(d, toward)))), r = deg * Math.PI / 180; return norm(add(scl(d, Math.cos(r)), scl(t, Math.sin(r)))); };
let d0 = [0, -1, 0], d1 = turn(d0, [1, 0, 0], 22.5);
bend(C0, d0, d1);
// řetěz: rameno 30 + náboj 20 + 59443 40 + náboj 20 + rameno 30 → ohyb
p = C0; go(d1, 30); hubs.push(add(p, scl(d1, 10))); hub(add(p, scl(d1, 10)), d1); go(d1, 20); axC(add(p, scl(d1, 20)), d1); go(d1, 40); hubs.push(add(p, scl(d1, 10))); hub(add(p, scl(d1, 10)), d1); go(d1, 20); go(d1, 30);
let dc = d1;
for (let i = 0; i < 3; i++) {
  const din = dc, dout = turn(dc, [1, 0, 0], 22.5); bend([...p], din, dout); dc = dout;
  go(dout, 30); hubs.push(add(p, scl(dout, 10))); hub(add(p, scl(dout, 10)), dout); go(dout, 20);
  if (i < 2) go(dout, 30);
}
const END = [...p], dEnd = dc;
// ===== krok 23: poupata na konci (zelený náboj, kužel, 2x výhonek s vajíčkem, tyčka, trojzubec, 3 limetková poupata) =====
const bud = new Asm(); // místní: osa -y = směr stonku
bud.part('65487', GR, [0, -10, 0], rz(-Math.PI / 2));                 // zelený náboj na konci osy
bud.part('59900', GR, [0, -44, 0]);                                    // kužel širší stranou dolů
bud.part('20482', DG, [0, -52, 0]);                                    // tmavě zelený kroužek
bud.part('1566', GR, [0, -52, 0]); bud.part('24946', BG, [20, -80, 0]);           // výhonek s vajíčkem (jedna strana)
bud.part('1566', GR, [0, -74, 0], ry(Math.PI)); bud.part('24946', BG, [-20, -102, 0]); // druhý na opačnou stranu
bud.part('66909', GR, [0, -126, 0]);                                   // tyčka s výstupky
bud.part('68211', BG, [0, -130, 0]);                                   // trojzubec
bud.part('5903', LM, [0, -155, 0]); bud.part('5903', LM, [-4, -150, 10], rx(0.6)); bud.part('5903', LM, [-4, -150, -10], rx(-0.6));
stem.add(bud, { M: basis(cross(scl(dEnd, -1), perpZ(dEnd)), scl(dEnd, -1), perpZ(dEnd)), p: END });
// opora: hnědé svícny (9x) nad nosníkem vedle stonku, vlevo vzadu
const PO = [-14, 0, 14];
for (let i = 0; i < 9; i++) stem.part('37762', RB, add(add(beamTop, PO), [0, i === 0 ? 52 : -(i - 1) * 32, 0])); // první zespodu do nosníku, dalších 8 nad ním
A.add(stem, { M: ry(-0.12), p: [0, 0, 0] });
const SM = ry(-0.12), hubW = hubs.map((h) => apply(SM, h));
if (process.env.DBG) console.log(hubW.map((h) => [Math.round(h[0] / 0.91 + 282), Math.round(720 - (53 - h[1]) / 0.91), Math.round(h[2])].join(",")).join("  "));

// ===== krok 17: dlouhé listy (levý + pravý oblý díl 10x2x2 vedle sebe = list 4 široký) =====
function longLeafAsm() {
  const L = new Asm();
  L.part('77180', DG, [10, 0, 0]); L.part('77182', DG, [-10, 0, 0]);
  L.part('15068', DG, [0, 16, 20], ry(Math.PI)); L.part('44567b', LB, [0, 24, 20]); L.part('2654', GR, [0, 24, -20]); return L; }
function longLeaf(base, tip, roll, face) {
  const L = longLeafAsm();
  const d = sub(tip, base), M = mul(frameZ(scl(d, -1), face), rz(roll));
  A.add(L, { M, p: base });
  A.part('57360', RB, add(base, [0, 8, 0]), ry(Math.PI / 2));
}
const P = (px, py, z = 0) => [(px - 282) * 0.91, 53 - (720 - py) * 0.91, z];
longLeaf(P(264, 500, 6), P(100, 280, -30), 0, norm([0.45, -1, 0.3]));   // levý list vidět spíš z boku – prohnutý oblouk
longLeaf(P(298, 498, 14), P(453, 312, 0), 0, norm([-0.7, -0.6, -0.4]));
// ===== krok 18: ploché oválné listy 4x6 (4 čtvrtkruhy + 2 oblé 2x2 na světle zelené desce 2x4) =====
function flatLeafAsm() {
  const L = new Asm();
  L.part('3020', GR, [0, 0, 0], ry(Math.PI / 2)); L.part('32803', GR, [0, 24, 30], ry(Math.PI));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const a = sx > 0 ? (sz < 0 ? 0 : -Math.PI / 2) : (sz < 0 ? Math.PI / 2 : Math.PI);
    L.part('5852', DG, [20 * sx, 0, 40 * sz], ry(a));
  }
  L.part('15068', DG, [-20, 0, 0], ry(Math.PI / 2)); L.part('15068', DG, [20, 0, 0], ry(-Math.PI / 2));
  L.part('44567b', LB, [0, 8, 50]); L.part('57360', RB, [0, 12, 62], ry(Math.PI / 2)); return L; }
function flatLeaf(c, yaw, tilt) {
  const L = flatLeafAsm();
  A.add(L, { M: mul(ry(yaw), rx(tilt)), p: c });
}
flatLeaf(P(226, 470, -46), Math.PI / 2 + 0.35, -0.08);
flatLeaf(P(352, 470, -40), -Math.PI / 2 - 0.3, -0.08);

// ===== krok 26–32: květ (5x). Místní: líc = -z, nahoru = -y, střed = růžový střed =====
function flower() {
  const F = new Asm();
  const petal = (th, d0, lean) => { // trojúhelníkový štít špičkou ven
    const u = [Math.sin(th), -Math.cos(th), 0], M = mul(rz(Math.PI + th), rx(-lean));
    F.part('3846', LN, add(scl(u, d0 + 14), [0, 0, 8]), M);
  };
  petal(0.12, 22, 0.28); petal(-1.38, 22, 0.28); petal(1.32, 22, 0.28);
  const sepal = (th) => { // spodní lístek: deska se zubem + dlaždice se svorkou + zlaté kolečko
    const u = [Math.sin(th), -Math.cos(th), 0], M = mul(rz(Math.PI + th), rx(Math.PI / 2));
    F.part('49668', LN, add(scl(u, 20), [0, 0, 2]), M);
    F.part('15712', TN, add(scl(u, 20), [0, 0, 10]), M);
    F.part('5264', PG, add(scl(u, 20), [0, 0, 18]), M);
  };
  sepal(Math.PI + 0.5); sepal(Math.PI - 0.5);
  F.part('3386', GR, [0, 0, 10], rx(Math.PI / 2));                           // zelený nosič za středem
  F.part('32607', BP, [0, 0, 0], mul(rx(Math.PI / 2), ry(5 * Math.PI / 4)));  // růžové lístky nahoru
  F.part('85861', DP, [0, 0, -8], rx(Math.PI / 2));                          // tmavě růžový kroužek
  F.part('4697b', W, [0, 2, -18], ry(0.5));                                            // bílý sloupek k divákovi
  F.part('32607', RO, [0, 9, -18], mul(rx(0.35), ry(Math.PI / 4)));          // oranžový pysk
  F.part('3917', PG, [0, 30, 20]);                                            // zlatý kroužek vzadu
  F.part('3484', PG, [0, 0, 28], rx(Math.PI / 2));                            // svorka na tyčku
  return F;
}
// květy: [střed na obrázku px, py, hloubka z, natočení kolem y, sklon]
// květy: [index náboje, posun v obraze dx, dy (px), natočení kolem y, sklon] – posuny odměřené z obrázku návodu str. 40
const FL = [[0, -52, -36, 0.3, 0.05], [1, 47, -3, -0.2, 0.0], [2, -21, -48, 0.05, 0.0], [3, 34, 10, -0.2, 0.05], [4, 52, -7, -0.35, 0.1]]; // posuny podle fotky hotové stavebnice
for (const [hi, dx, dy, yaw, tilt] of FL) {
  const h = hubW[hi], c = add(h, [dx * 0.91, dy * 0.91, -46]);
  const FM = mul(ry(yaw), rx(tilt)), clip = add(c, apply(FM, [0, 0, 28]));
  const v = sub(clip, h), L = Math.hypot(...v), d = norm(v), Md = frameZ(d);
  A.part('89678', DK, add(h, scl(d, 6)), Md);                                   // půlkolík v náboji
  A.part('85861', GR, add(h, scl(d, 14)), mul(Md, rx(Math.PI / 2)));           // zelené kolečko
  if (L > 64) A.part('65487', GR, add(h, scl(d, 30)), mul(Md, ry(Math.PI / 2)));  // delší stopka: zelený spojovník
  A.part('78258', K, add(clip, scl(d, -16)), mul(Md, rx(Math.PI / 2)));         // černá tyčka do svorky květu
  A.add(flower(), { M: FM, p: c });
}
A.emit(b); b.save('miniorchid10343.ldr'); console.log('miniorchid10343 parts', b.n);
