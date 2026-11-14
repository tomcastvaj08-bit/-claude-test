// Kytice v kulaté lesklé váze (podle produktových fotek): ROSES = sedm červených růží v černé váze,
// SUN = slunečnice a kopretina ve zlaté váze. Spuštění: KIND=roses|sun node vasebq.mjs
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const KIND = process.env.KIND || 'roses';
const RD = 4, GN = 2, DG = 288, W = 15, YE = 14, BLO = 191, RB = 70, LIME = 27, TAN = 19, BLK = 0;
const A = new Asm();
const TOP = -203, NECK = 40;                                  // hrdlo vázy (viz slparts.py)
A.part('lbvase', KIND === 'roses' ? 64 : 334, [0, 0, 0]);
A.part('3960', BLK, [0, TOP + 14, 0], rx(Math.PI));            // tmavá „pěna“ uvnitř hrdla – zakryje stonky
// rámec, kde místní -Y míří ve směru d (k divákovi / ven), místní X co nejvíc vodorovně
const face = (d, roll = 0) => { const y = scl(norm(d), -1); let x = cross([0, 1, 0], y); if (Math.hypot(...x) < 1e-3) x = [1, 0, 0]; x = norm(x); const z = cross(x, y); return mul(basis(x, y, z), ry(roll)); };
const stem = (from, to) => { const d = sub(to, from), L = Math.hypot(...d), n = Math.max(1, Math.round(L / 60)); for (let i = 0; i < n; i++) A.part('87994', GN, add(from, scl(d, (i + 0.5) / n)), face(scl(d, -1))); };
const CEN = [0, TOP + 30, 0];                                  // kam se sbíhají stonky (uvnitř hrdla)

if (KIND === 'roses') {
  // [x, y, z, druh] – rozmístění podle fotky: kupole sedmi růží, poupata mezi nimi
  const heads = [
    [0, -338, -6, 'b'], [-56, -312, -30, 'o'], [60, -314, -34, 'o'], [-92, -268, 16, 'o'], [94, -270, 12, 'o'],
    [4, -292, 54, 'b'], [-14, -238, 82, 'o'], [-46, -284, -74, 'b'], [56, -250, 66, 'b'], [-60, -246, 64, 'b']
  ];
  const C0 = [0, -200, 0], SC = E('RS', 1.25);
  for (const [x, y, z, k] of heads) {
    const p = [x * E('SX', 1.12), y + E('DY', 48), z * 1.05], dir = norm(add(sub(p, C0), [0, -40, 0]));
    A.part(k === 'o' ? 'lbrose' : 'lbroseb', RD, p, mul(face(dir, (x * 7 + z) * 0.03), [SC, 0, 0, 0, SC, 0, 0, 0, SC]));
    stem(add(p, scl(dir, 4)), CEN);
  }
  // listy kolem hrdla, špičkou ven a nahoru podél vázy
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + 0.2, o = [Math.sin(a), 0, Math.cos(a)], tilt = E('LT', 0.72) + (i % 3) * 0.12;
    const up = norm(add(scl(o, Math.sin(tilt)), [0, -Math.cos(tilt), 0]));
    const ez = scl(o, -1), ey = scl(up, -1), ex = norm(cross(ey, ez)), ez2 = cross(ex, ey);
    A.part('lbleaf', DG, add([0, TOP + 6, 0], scl(o, NECK - 6)), basis(ex, ey, scl(ez2, 1)));
  }
  // drobné bílé kvítky (gypsophila) v mezerách
  const gaps = [[0, -262, 92], [-30, -230, 100], [34, -236, 96], [-28, -300, 34], [32, -298, 30], [-66, -252, 58], [76, -246, 40], [26, -256, 88], [-88, -228, 46], [10, -322, -56], [-96, -300, -22], [100, -300, -22]];
  for (const [x, y, z] of gaps) for (let k = 0; k < 4; k++) {
    const p = add([x * 1.12, y + E('DY', 48), z], [Math.sin(k * 2.1) * 9, -Math.abs(Math.cos(k * 1.7)) * 8, Math.cos(k * 2.1) * 9]);
    A.part('24866', W, p, face(norm(sub(p, C0)))); A.part('33291', W, add(p, scl(norm(sub(p, C0)), 2)), face(norm(sub(p, C0))));
  }
} else {
  // slunečnice: tmavě hnědý terč (miska 4x4) + 2 věnce okvětních lístků; kopretina menší, bílá s žlutým středem
  const C0 = [0, -200, 0], SC = E('SS', 0.95);
  const flower = (p0, big, white) => {
    const p = [p0[0] * E('SX', 1.15), p0[1] + E('DY', 40), p0[2]];
    const dir = norm(add(norm(sub(p, C0)), [0, -0.2, E('FB', 1.3)])), M = mul(face(dir), [SC, 0, 0, 0, SC, 0, 0, 0, SC]), F = new Asm();
    const n = big ? 13 : 12, R = big ? 26 : 16, col1 = white ? W : YE, col2 = white ? W : BLO;
    for (let ring = 0; ring < 2; ring++) for (let k = 0; k < n; k++) {
      const a = (k + ring * 0.5) / n * Math.PI * 2, o = [Math.sin(a), 0, Math.cos(a)];
      const tilt = ring ? -0.18 : 0.05;                                         // vnitřní věnec mírně do misky
      F.part('lbsunp', ring ? col2 : col1, add(scl(o, R - 4), [0, ring ? 3 : 0, 0]), mul(ry(a + Math.PI), rx(tilt)));
    }
    if (white) { F.part('4032a', YE, [0, -4, 0]); for (let k = 0; k < 5; k++) F.part('4073', YE, [Math.sin(k * 1.26) * 9, -10, Math.cos(k * 1.26) * 9]); }
    else { F.part('4032a', 308, [0, -2, 0]); F.part('14769', RB, [0, -10, 0]); for (let k = 0; k < 10; k++) F.part('4073', 308, [Math.sin(k * 0.628) * 24, -4, Math.cos(k * 0.628) * 24]); }
    A.add(F, { M, p }); stem(add(p, scl(dir, 6)), CEN);
  };
  flower([0, -340, -26], true, false);
  flower([-74, -276, 14], true, false);
  flower([78, -280, 6], true, false);
  flower([4, -232, 74], true, false);
  flower([4, -300, 44], false, true);
  flower([-36, -250, 66], false, true);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2 + 0.3, o = [Math.sin(a), 0, Math.cos(a)], tilt = 0.72 + (i % 3) * 0.12;
    const up = norm(add(scl(o, Math.sin(tilt)), [0, -Math.cos(tilt), 0]));
    const ez = scl(o, -1), ey = scl(up, -1), ex = norm(cross(ey, ez));
    A.part('lbleaf', DG, add([0, TOP + 6, 0], scl(o, NECK - 6)), basis(ex, ey, cross(ex, ey)));
  }
}
const name = KIND === 'roses' ? 'vaseroses' : 'vasesun';
const b = new Build(name); A.emit(b); b.save(name + '.ldr'); console.log(name, 'parts', b.n);
