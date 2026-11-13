// Lopatkovec 11504 – stavba z dílků podle oficiálního návodu (6618822) a inventáře Rebrickable.
// Souřadnice LDraw: Y dolů, divák na -z. Rozměry a rozmístění podle závěrečného obrázku návodu (str. 57).
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm, frameZ } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const K = 0, LN = 78, BG = 10, GR = 2, W = 15, LY = 226, DT = 28, RB = 70, LB = 71, DK = 72;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const A = new Asm();
const dirM = (d, up = [0, 0, -1]) => { const y = scl(norm(d), -1), x = norm(cross(up, y)), z = cross(x, y); return basis(x, y, z); }; // místní -Y → d

// ===== kroky 1–29: válcový květináč – jádro z technic nosníků, kolem 32 sloupců ze světle nugátových dílů =====
const H = 184, R = 104;                                   // výška a poloměr sloupců (2x 6192b + desky = 3 patra)
const pot = new Asm();
pot.part('74611', K, [0, 0, 0]); pot.part('74611', LB, [0, -H + 8, 0]);
const N = 16;
for (let k = 0; k < N; k++) {
  const a = (k + 0.5) / N * Math.PI * 2, n = [Math.sin(a), 0, Math.cos(a)];
  // sloupec: deska 2x4 nastojato + oblý díl 2x4 (zaoblením ven), 3 nad sebou; nahoře oblé 1x1
  const M = mul(ry(a), rx(-Math.PI / 2), rz(Math.PI / 2));     // délka 2x4 svisle, zaoblení k +n
  for (const y of [-40, -120]) pot.part('6192b', LN, add(scl(n, R + 22), [0, y, 0]), mul(ry(a), [0,0,-1,1,0,0,0,-1,0]));
  pot.part('7126', LN, add(scl(n, R - 6), [0, -H, 0]), ry(a + Math.PI));
}
pot.part('15535', RB, [0, -H + 4, 0]);
for (let k = 0; k < 6; k++) { const a = k * 1.05; pot.part('2476a', DT, [Math.sin(a) * 50, -H + 2, Math.cos(a) * 50]); }
A.add(pot, { M: I, p: [0, 0, 0] });
const TOP = -H;

// ===== listy (kroky 30–46): velký zakřivený díl 45705 na destičce s čepy, 3 patra kolem středu =====
// list roste od středu ven a je zahnutý dolů; špička = místní -Z, úchyt u z ≈ +20
function leaf(az, elev, len, y, r0, roll = 0) {
  const w = [Math.sin(az), 0, -Math.cos(az)];
  const out = norm(add(scl(w, Math.cos(elev)), [0, -Math.sin(elev), 0]));        // směr listu (ven a nahoru)
  const zz = scl(out, -1), up = norm(cross(zz, cross([0, -1, 0], zz)));
  const yy = scl(up, -1), xx = cross(yy, zz);
  const M = mul(basis(xx, yy, zz), rz(roll), [len, 0, 0, 0, 1, 0, 0, 0, len]);
  const L = new Asm();
  L.part('45705', GR, [0, 0, 0]);
  L.part('26599', K, [0, 6, 6]);
  A.add(L, { M, p: add(scl(w, r0), [0, y, 0]) });
}
// dolní patro: 4 velké listy do kříže (krok 33–35), střední 3 (krok 36–38), horní 2 (krok 42–43)
for (let k = 0; k < 4; k++) leaf(Math.PI / 4 + k * Math.PI / 2 + 0.1, E('E1', 0.28), 1.5, TOP - 20, 36);
for (let k = 0; k < 3; k++) leaf(k * 2 * Math.PI / 3 + 0.3, E('E2', 0.42), 1.45, TOP - 90, 26, 0.1);
for (let k = 0; k < 2; k++) leaf(k * Math.PI + 1.2, E('E3', 0.85), 1.35, TOP - 170, 18, -0.1);

// ===== stonky a toulce (kroky 39–56): zelené svícny nad sebou, nahoře žlutá palice a bílý toulec =====
function spathe(x, z, top, lean = [0, 0], face = 0) {
  const base = [x, TOP - 30, z], tip = [x + lean[0], top, z + lean[1]], d = norm(sub(tip, base)), L = Math.hypot(...sub(tip, base));
  for (let s = 0; s < L - 30; s += 40) A.part('37762', BG, add(base, scl(d, s + 32)), dirM(d));
  const M = dirM(d);
  // palice: žluté kytičky a kopečky zmrzliny nad sebou
  for (let k = 0; k < 4; k++) A.part('24866', LY, add(tip, scl(d, 6 + k * 8)), M);
  A.part('6254', LY, add(tip, scl(d, 36)), M);
  // bílý toulec za palicí, lícem k divákovi, špička nahoru
  const f = [Math.sin(face), 0, -Math.cos(face)], back = scl(f, -1);
  const zz = scl(d, -1), xx = norm(cross(back, zz)), yy = cross(zz, xx);
  A.part('7096', W, add(add(tip, scl(back, 8)), scl(d, -10)), mul(basis(xx, yy, zz), rx(0.15)));
}
spathe(0, -6, TOP - 470, [0, -4], 0.9);
spathe(14, -20, TOP - 380, [6, -10], 0.6);
spathe(-30, -26, TOP - 300, [-14, -22], -1.0);
spathe(40, -30, TOP - 270, [18, -24], 1.1);
// mladé zavinuté toulce (krok 47): bílé rohy na krátkých stoncích
for (const [x, z, h, a] of [[22, 6, 250, 0.3], [-16, 10, 230, -0.4]]) {
  const base = [x, TOP - 30, z], tip = [x, TOP - h, z];
  for (let s = 32; s < h - 30; s += 40) A.part('37762', BG, [x, TOP - 30 - s, z]);
  A.part('13564', W, tip, mul(rz(Math.PI / 2), ry(a)));
}

const b = new Build('peacelily11504'); A.emit(b); b.save('peacelily11504.ldr'); console.log('peacelily11504 parts', b.n);
