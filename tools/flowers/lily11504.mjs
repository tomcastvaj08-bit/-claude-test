// Lopatkovec 11504 – nová stavba podle oficiálního návodu (6618822), kroky 1–56, a inventáře Rebrickable.
// Souřadnice LDraw: Y dolů (podlaha y = 0), divák na -z.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const K = 0, LN = 78, BG = 10, GR = 2, W = 15, LY = 226, DT = 28, RB = 70, LB = 71;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const A = new Asm();
const dirM = (d) => { const y = scl(norm(d), -1), x = norm(cross(y, [0, 0, 1])), z = cross(x, y); return basis(x, y, z); }; // místní -Y → d

// ===== kroky 1–29: válcový květináč – 16 sloupků ve 2 patrech (oblý díl 2x4 nastojato, oblinou ven) =====
const R = E('POTR', 70), ROW = 80, H = 2 * ROW + 16;
const pot = new Asm();
pot.part('74611', K, [0, 0, 0]); pot.part('74611', K, [0, -H + 8, 0]);
for (let k = 0; k < 16; k++) {
  const a = (k + 0.5) / 16 * Math.PI * 2, n = [Math.sin(a), 0, Math.cos(a)];
  for (const r of [0, 1]) pot.part('6192b', LN, add(scl(n, R + 22), [0, -8 - r * ROW - 40, 0]), mul(ry(a), [0, 0, -1, 1, 0, 0, 0, -1, 0]));
}
pot.part('15535', RB, [0, -H + 4, 0]);
for (let k = 0; k < 7; k++) { const a = k * 0.9, r = 30 + (k % 3) * 18; pot.part('2476a', RB, [Math.sin(a) * r, -H + 2, Math.cos(a) * r]); }
A.add(pot, { M: I, p: [0, 0, 0] });
const TOP = -H;

// ===== kroky 30–45: jádro a 9 listů z dílu 45705 (skutečná velikost) =====
// list 45705: úchyt u z = +20 nahoře, špička u z = -180, prohnutá dolů (y +48)
const CHORD = Math.atan2(48, 200);
function leaf(az, elev, y, r0, roll = 0) {
  // díl 45705: široký úchyt nahoře u z ≈ 0, úzká špička dole u z = -180, y ≈ +40 → tětiva klesá o 12,5°
  const w = [Math.sin(az), 0, -Math.cos(az)], t = elev + Math.atan2(40, 180);
  const dir = norm(add(scl(w, Math.cos(t)), [0, -Math.sin(t), 0]));                 // místní -z (ven a nahoru)
  const upv = norm(add(scl(w, -Math.sin(t)), [0, -Math.cos(t), 0]));                // místní -y, kolmo k dir
  const ez = scl(dir, -1), ey = scl(upv, -1), ex = cross(ey, ez);
  const M = mul(basis(ex, ey, ez), rz(roll));
  const L = new Asm();
  L.part('45705', GR, [0, 0, 0]);
  L.part('26599', K, [0, -4, 0]);
  A.add(L, { M, p: add(scl(w, r0), [0, y, 0]) });
}
if (process.env.ONE) { leaf(0, 20 * Math.PI / 180, 0, 0); leaf(Math.PI / 2, 20 * Math.PI / 180, 0, 0); A.part('3003', 4, [0, 0, 0]); const bb = new Build('sub'); const X = new Asm(); X.items = A.items.slice(-5); X.emit(bb); bb.save('sub.ldr'); process.exit(0); }
for (const y of [TOP - 20, TOP - 60, TOP - 100, TOP - 140]) { A.part('59443', GR, [0, y, 0], rx(Math.PI / 2)); A.part('7329', BG, [0, y - 20, 0]); }
const D = Math.PI / 180;
for (const [a, e] of [[62, E('T1', 4)], [128, E('T1', 4) - 3], [232, E('T1', 4)], [298, E('T1', 4) - 3]]) leaf(a * D, e * D, TOP - E('Y1', 36), 34);            // patro 1 (krok 33)
for (const [a, e] of [[-25, E('T2', 16)], [92, E('T2', 16) + 4], [268, E('T2', 16) + 2]]) leaf(a * D, e * D, TOP - E('Y2', 76), 26, 0);       // patro 2 (kroky 36–38)
leaf(160 * D, E('T3', 42) * D, TOP - E('Y3', 116), 18, 0); leaf(215 * D, (E('T3', 42) - 8) * D, TOP - E('Y3', 116), 18, 0);                         // patro 3 (kroky 40–43)

// ===== kroky 46–56: 4 květy + 3 mladé zavinuté toulce =====
function stem(x, z, h, lean = [0, 0]) {
  const base = [x, TOP - 30, z], tip = [x + lean[0], TOP - h, z + lean[1]], d = norm(sub(tip, base)), L = Math.hypot(...sub(tip, base));
  for (let s = 32; s <= L; s += 40) A.part('37762', BG, add(base, scl(d, s)), dirM(d));
  return { tip, d };
}
function flower(x, z, h, lean, face, big) {
  const { tip, d } = stem(x, z, h, lean), M = dirM(d);
  if (big) { for (let k = 0; k < 4; k++) A.part('24866', LY, add(tip, scl(d, 4 + k * 8)), M); A.part('6254', LY, add(tip, scl(d, 34)), M); }
  else A.part('33172', LY, add(tip, scl(d, 2)), mul(M, rx(Math.PI)));
  const f = norm([Math.sin(face), 0, -Math.cos(face)]), back = scl(f, -1);
  const zz = scl(d, -1), xx = norm(cross(back, zz)), yy = cross(zz, xx);
  if (big) A.part('7096', W, add(add(tip, scl(back, 10)), scl(d, -14)), mul(basis(xx, yy, zz), rx(0.2)));
  else A.part('3565', W, add(add(tip, scl(back, 8)), scl(d, -10)), mul(basis(xx, yy, zz), rx(0.15)));
}
flower(0, 4, 470, [-4, 6], 0.1, true);
flower(18, -6, 380, [10, -6], 0.4, true);
flower(-20, -10, 300, [-22, -18], -0.5, false);
flower(30, -14, 280, [36, -26], 0.7, false);
for (const [x, z, h, a] of [[8, -16, 330, -0.3], [-10, 2, 300, 0.4], [24, 10, 270, 0.9]]) {
  const { tip } = stem(x, z, h, [0, 0]);
  A.part('13564', W, add(tip, [0, -4, 0]), mul(ry(a), rz(Math.PI / 2)));
}

const b = new Build('peacelily11504'); A.emit(b); b.save('peacelily11504.ldr'); console.log('peacelily11504 parts', b.n);
