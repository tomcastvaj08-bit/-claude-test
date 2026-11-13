import { Build, D, rx, ry, rz, mul, add, sub, scl, norm, cross, basis, tubeP } from './lib.mjs';
// Malé růžové Lambo (replika, 21 cm): stavba z dílků podle fotek. Předek = LDraw -z, Y dolů, zem y = 0.
const P = 29, K = 0, BL = 1;
const b = new Build('pinklambo');
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1], RY = ry(Math.PI / 2), RY2 = ry(Math.PI);
const FZ = -165, RZ = 170, WX = 84, AY = -54;
// díl se sklonem: nízký (přední) konec v bodě f, vysoký v bodě k; reverse = díl obrácený (vysoký vpředu)
function slope(id, col, f, k, reverse = false) {
  let ez = norm(sub(k, f)); if (reverse) ez = scl(ez, -1);
  const ex = reverse ? [-1, 0, 0] : [1, 0, 0], ey = norm(cross(ez, ex));
  b.part(id, col, scl(add(f, k), 0.5), basis(ex, ey, ez));
}
// ---- kola
for (const z of [FZ, RZ]) for (const s of [-1, 1]) { b.part('44309', K, [s * WX, AY, z], RY); b.part('56145', 70, [s * (WX + 4), AY, z], RY); }
// ---- podvozek a přední spoiler (černé)
for (const x of [-40, 0, 40]) for (const z of [-100, 100]) b.part('3832', K, [x, -38, z], RY);
for (const x of [-40, 40]) { b.part('3020', K, [x, -38, -222]); b.part('3020', K, [x, -38, 222]); }
b.part('50305', K, [30, -30, -192]); b.part('50304', K, [-30, -30, -192]);
b.part('41770a', K, [56, -30, -222]); b.part('41769a', K, [-56, -30, -222]);
// ---- boky
for (const s of [-1, 1]) {
  b.part('40490', P, [s * 82, -52, 0]);
  for (const z of [-60, 40, 60, 80]) b.part('43093', BL, [s * 92, -52, z]);
  b.part('3009', P, [s * 80, -84, -40], RY); b.part('3010', P, [s * 80, -84, 60], RY);
  b.part('6636', P, [s * 80, -92, -40], RY); b.part('2431', P, [s * 80, -92, 60], RY);
  b.part('6636', K, [s * 91, -76, 10], mul(rz(s * Math.PI / 2), RY, rz(0.2)));          // černý pruh
  for (const z of [100, 120]) b.part('3700', P, [s * 82, -84, z], RY);                    // boční nasávání
  b.part('32524', P, [s * 90, -100, 10]);                                                    // nosník s otvory u dveří
  slope(s > 0 ? '41769a' : '41770a', P, [s * 96, -96, 70], [s * 96, -96, 150]);              // boční ploutev
  // blatníky (hladké oblé díly)
  b.part('93606', P, [s * 86, -128, RZ - 10], RY2);
  // růžové oblouky nad podběhy
  for (const zc of [FZ, RZ]) { const A = []; for (let a = 15; a <= 165; a += 15) { const t = a * Math.PI / 180; A.push([s * 106, AY - 66 * Math.sin(t), zc + 66 * Math.cos(t)]); } tubeP(b, A, P, 7); }
}
// ---- kapota mezi blatníky: hladké dlaždice 2x2 se sklonem k nosu, nos do špičky
for (const [z0, z1, y0, y1, xs] of [[-262, -230, -58, -66, [-20, 20]], [-230, -190, -66, -76, [-40, 0, 40]], [-190, -150, -76, -86, [-40, 0, 40]], [-150, -110, -86, -96, [-40, 0, 40]]])
  for (const x of xs) slope('3068b', P, [x, y0 - 8, z0], [x, y1 - 8, z1]);
for (const s of [-1, 1]) {
  // přední blatník nad kolem (hladký, klesá k nosu), pod ním černá hrana se světlem
  slope('93606', P, [s * 82, -96, -255], [s * 82, -128, -175]);
  slope('93606', P, [s * 82, -128, -175], [s * 82, -132, -95]);
  slope(s > 0 ? '41770a' : '41769a', K, [s * 72, -64, -258], [s * 72, -80, -178]);
}
for (const x of [-40, 40]) b.part('87079', P, [x, -106, -84]);              // zadní hrana kapoty
for (const s of [-1, 1]) b.part('3700', P, [s * 32, -130, -70], RY);         // technic kostky s otvory
for (const x of [-40, 40]) slope('87079', K, [x, -112, -58], [x, -128, -24]); // černý panel pod oknem
// ---- interiér
for (const s of [-1, 1]) { b.part('30602', K, [s * 32, -38, 30]); b.part('3005', K, [s * 32, -62, 50]); }
b.part('3829c01', K, [-32, -38, -30]);
// ---- střecha: příčné hladké dlaždice na technic rámu
for (const s of [-1, 1]) b.part('32524', P, [s * 64, -158, 20]);
for (let z = -30; z <= 70; z += 20) b.part('6636', P, [0, -170, z]);
for (const s of [-1, 1]) for (const Y of [-62, -86, -110, -134]) b.part('3010', P, [s * 70, Y, 100], RY);   // zadní sloupky
// ---- kryt motoru: příčné dlaždice, uprostřed dva černé průduchy, záď
for (let z = 95; z <= 215; z += 20) { const y = -162 + (z - 95) * 0.15; b.part('6636', P, [0, y, z]); for (const s of [-1, 1]) b.part('3069b', P, [s * 80, y + 6, z]); }
for (const [x, z] of [[-24, 125], [24, 125], [-24, 175], [24, 175]]) b.part('3068b', K, [x, -166 + (z - 95) * 0.15, z]);
for (const s of [-1, 1]) for (const Y of [-62, -86, -110, -134]) b.part('3010', P, [s * 80, Y, 210], RY);
for (const Y of [-62, -86, -110]) b.part('3009', K, [0, Y, 252]);
for (const x of [-60, 60]) b.part('3069b', 4, [x, -100, 263], rx(-Math.PI / 2));
// ---- spoiler (černý)
for (const x of [-55, 55]) b.part('32523', K, [x, -158, 238], rx(Math.PI / 2));
b.part('3832', K, [0, -192, 245]); b.part('6636', K, [0, -200, 255]);
for (const x of [-100, 100]) b.part('32523', K, [x, -192, 245]);
// ---- růžové trubky: od předního rohu přes podběh a A-sloupek nad střechou dozadu; dvě přes kryt motoru ke spoileru
for (const s of [-1, 1]) {
  tubeP(b, [[s * 96, -66, -245], [s * 100, -104, -200], [s * 92, -132, -120], [s * 80, -158, -50], [s * 72, -178, 10], [s * 72, -178, 80], [s * 82, -160, 170], [s * 98, -128, 250]], P, 7);
  tubeP(b, [[s * 40, -176, 80], [s * 44, -172, 160], [s * 55, -160, 232]], P, 6);
}
b.save('pinklambo.ldr'); console.log('pinklambo parts', b.n);
