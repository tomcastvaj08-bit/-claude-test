// Slunečnice a kopretiny – Sluban M38-B1121A (329 dílků), stavba podle oficiálního návodu (kroky 1–47).
// Souřadnice LDraw: Y dolů, divák na -Z, dno kytice y = 0.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const YE = 14, DO = 484, GR = 2, DGR = 10, DG = 288, W = 15, TC = 47, LO = 25;
const D = Math.PI / 180, UP = [0, -1, 0];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// rotace z lokálních os: ey a ez jsou obrazy lokálních os +Y a +Z
const frame = (ey, ez) => { ey = norm(ey); ez = norm(sub(ez, scl(ey, dot(ez, ey)))); return basis(cross(ey, ez), ey, ez); };
const perp = (d) => { const p = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, -1, 0]; return norm(sub(p, scl(d, dot(p, d)))); };
const A = new Asm();

// ---------- stonek: díly podél osy s (t = vzdálenost od spodu) ----------
function Stem(base, s, side) {
  const at = (t) => add(base, scl(s, t));
  const F = frame(scl(s, -1), side);                         // místní -Y = nahoru po stonku, +Z = k listům
  return {
    at, F,
    block: (id, t, col = GR, roll = 0) => A.part(id, col, at(t), mul(F, ry(roll))),
    axle: (id, t, col = GR) => A.part(id, col, at(t), mul(F, rz(Math.PI / 2))),
  };
}
// list (kroky 9, 16): čep s tyčkou do otvoru spojky, destička s klipem, zubatý list
function leaf(h, d) {
  d = norm(d); let n = cross(d, UP); n = Math.hypot(...n) < 1e-3 ? [0, 0, 1] : norm(n); if (n[2] < 0) n = scl(n, -1); // plocha listu čelem k divákovi
  A.part('61184', 72, add(h, scl(d, 4)), frame(n, cross(scl(d, -1), n)));               // místní -X → d
  A.part('63868', DG, add(h, scl(d, 64)), frame(n, cross(scl(d, -1), n)));              // klip ke stonku
  A.part('lbfern', DG, add(add(h, scl(d, 74)), scl(n, -8)), frame(n, cross(d, n)));     // list ven, výstupky k divákovi
}
// ---------- hlava slunečnice č. 1 (kroky 1–4): 2 osmiúhelníky s tyčkami, 8 + 8 okvětních lístků, terč ----------
function sunHead1() {
  const H = new Asm();
  H.part('75937', DO, [0, 0, 0]); H.part('14769', DO, [0, -8, 0]); H.part('75937', DO, [0, -16, 0]);
  for (let k = 0; k < 16; k++) {
    const inner = k % 2 === 0, th = (k * 22.5 + (inner ? 0 : 0)) * D, al = (inner ? E('AI', 12) : E('AO', 4)) * D;
    const u = [Math.cos(th), 0, Math.sin(th)], t = [-Math.sin(th), 0, Math.cos(th)];
    const U = norm(add(scl(u, Math.cos(al)), scl(UP, Math.sin(al)))), Dn = cross(t, U);      // ven (s náklonem k divákovi), dolů
    const o = [0, inner ? -16 : 0, 0], P = (r, y = 0, z = 0) => add(add(add(o, scl(U, r)), scl(Dn, y)), scl(t, z));
    H.part('30377', YE, P(30, inner ? 6 : 10, 0), frame(U, scl(Dn, -1)));        // schované pod lístkem                                 // rameno s klipy z tyčky osmiúhelníku
    if (inner) {  // krok 2: destička s držadlem, destička 1x2, zakřivený klínek, dlaždička 1x1
      H.part('60478', YE, P(84), frame(Dn, scl(t, -1)));
      H.part('3023b', YE, P(84, 8), frame(Dn, t));
      H.part('29120', YE, P(88, 0), frame(Dn, U));
      H.part('3070b', YE, P(68, 0), frame(Dn, U));
    } else {      // krok 3: kostka s výstupky do stran, čepička, destička, sklon, zakřivený díl, 2 zoubky
      H.part('11090', YE, P(62), frame(U, Dn));
      H.part('47905', YE, P(98), frame(Dn, U));
      H.part('54200', YE, P(116, 0), frame(scl(U, -1), Dn));
      H.part('3024', YE, P(98, -8), frame(Dn, U));
      H.part('29120', YE, P(102, -8), frame(Dn, U));
      for (const z of [-10, 10]) H.part('49668', YE, P(124, -8, z), frame(Dn, scl(U, -1)));
    }
  }
  // krok 4: terč – 2 kulaté destičky, velká mísa, kulatá destička 4x4, kulatá dlaždička, průhledný středový knoflík
  H.part('4032a', DO, [0, -24, 0]); H.part('4032a', DO, [0, -32, 0]);
  H.part('44375a', DO, [0, -28, 0], rx(Math.PI));
  H.part('60474', DO, [0, -40, 0]); H.part('15535', DO, [0, -48, 0]); H.part('6141', TC, [0, -56, 0]);
  return H;
}
// ---------- hlava slunečnice č. 2 (kroky 11–12): osmiúhelník, 8 lístků na klipech, mísa ----------
function sunHead2() {
  const H = new Asm();
  H.part('75937', DO, [0, 0, 0]); H.part('15535', YE, [0, -8, 0]); H.part('6141', YE, [0, -16, 0]); H.part('3960', DO, [0, -24, 0]);
  for (let k = 0; k < 8; k++) {
    const th = k * 45 * D, al = E('A2', 18) * D, u = [Math.cos(th), 0, Math.sin(th)], t = [-Math.sin(th), 0, Math.cos(th)];
    const U = norm(add(scl(u, Math.cos(al)), scl(UP, Math.sin(al)))), Dn = cross(t, U), P = (r, y = 0) => add(scl(U, r), scl(Dn, y));
    H.part('4081b', YE, P(62, -2), frame(Dn, U));                                             // klip na tyčku osmiúhelníku
    H.part('3665', YE, P(72, 22), frame(Dn, U));                                              // obrácený sklon pod ním
    H.part('11477', YE, P(70, -6), frame(Dn, U));                                             // zakřivený díl navrchu
  }
  return H;
}
// hlava na stonku: úhlová spojka (#5), osa do hlavy, hlava čelem ve směru e
function headOn(st, t, f0, H, conn = '32015', axleCol = LO) {
  const s = norm(sub(st.at(1), st.at(0))), top = st.at(t);
  const e = norm(add(scl(s, Math.cos(67.5 * D)), scl(f0, Math.sin(67.5 * D))));
  A.part(conn, GR, top, frame(scl(s, 1), scl(f0, -1)));
  A.part('4519', axleCol, add(top, scl(e, 36)), frame(perp(e), e));
  const ex = norm(cross(UP, scl(e, -1))), M = basis(norm(cross(scl(e, -1), perp(e))), scl(e, -1), perp(e));
  A.add(H, { M: frame(scl(e, -1), perp(e)), p: add(top, scl(e, 70)) });
}
const lean = (deg, dz = 0) => norm([Math.sin(deg * D), -Math.cos(deg * D), dz]);

// ===== slunečnice č. 1 (kroky 1–10) =====
{
  const s = lean(E('L1', -7.5), 0.02), side = norm(cross(s, [0, 0, 1])), st = Stem([-6, 0, 2], s, [0, 0, -1]);
  st.block('42003', 30); st.axle('3704', 60); st.block('42003', 90);              // krok 5
  st.axle('3708', 220); st.block('42003', 350);                                    // krok 6
  st.axle('3708', 480); st.block('6536', 520, GR, Math.PI / 2); st.block('6536', 560, GR, Math.PI / 2); st.block('42003', 610); // krok 7
  st.axle('3706', 680); st.block('42003', 750); st.axle('3704', 790);              // krok 8
  leaf(st.at(560), [-1, -0.55, -0.1]);                             // krok 9
  leaf(st.at(520), [-1, 0.3, 0.05]);
  headOn(st, 810, norm([-0.1, 0, -1]), sunHead1());                                  // krok 10
}
// ===== slunečnice č. 2 (kroky 11–17) =====
{
  const s = lean(E('L2', 15), -0.04), st = Stem([8, 0, -4], s, [0, 0, -1]);
  st.axle('3704', 20); st.block('42003', 50); st.axle('3708', 180); st.block('42003', 310);   // krok 13
  st.axle('3708', 440); st.block('6536', 520, GR, -Math.PI / 2);                              // krok 14
  st.block('6538a', 570); st.axle('3704', 590);                                                // krok 15
  leaf(st.at(520), [1, -0.3, -0.1]);                                          // krok 16
  headOn(st, 605, norm([0.45, 0, -1]), sunHead2(), '32015', 19);                               // krok 17
}
// ===== 4 kopretiny (kroky 18–45): stonek z článků, vidlička se 3 stonky, 8 dvojic bílých lístků, žlutý střed =====
function daisy(base, s, n, fd) {
  const st = Stem(base, s, [0, 0, -1]);
  for (let k = 0; k < n; k++) st.block('64567a', 36 + 32 * k, DGR);
  const tt = 32 * n + 4;
  st.block('48729a', tt + 31, DGR); st.block('11090', tt + 68, DGR); st.block('3741a', tt + 80, DGR);
  const c = st.at(tt + 112), M = frame(scl(fd, -1), perp(fd)), Hd = new Asm();
  for (let k = 0; k < 8; k++) {
    const th = (k * 45 + (k % 2 ? 22.5 : 0)) * D, r = [Math.cos(th), 0, Math.sin(th)], y = k % 2 ? 3 : 0;
    Hd.part('30127', W, add(scl(r, 5), [0, y, 0]), frame([0, 1, 0], r));
  }
  Hd.part('4740', YE, [0, -6, 0], rx(Math.PI));
  A.add(Hd, { M, p: c });
}
const dfront = (x) => norm([x, -1, -0.9]);
daisy([4, 0, -6], lean(E('LC', 4), -0.03), 26, dfront(0.15));     // kroky 18–24
daisy([6, E('BD', 0), 0], lean(E('LD', 7.5), 0.02), 24, dfront(0.3));   // kroky 25–31
daisy([-8, E('BA', 150), -2], lean(E('LA', -13), -0.05), 23, dfront(-0.35)); // kroky 32–38
daisy([0, E('BB', 120), 4], lean(E('LB', 0), -0.08), 20, dfront(0));     // kroky 39–45

const b = new Build('sun1121a'); A.emit(b); b.save('sun1121a.ldr'); console.log('sun1121a parts', b.n);
