// Tulipány 11501 – stavba z dílků podle obou oficiálních návodů (6618819 a 6618820).
// Souřadnice LDraw: Y dolů. Hlava: osa květu = -Y.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm, frameZ } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
// ===== vnější lístek (krok 6): zakřivený díl 7613 + 2 čtvrtkruhy na výstupcích + destička 3176 s klipem 5264 =====
export function outerPetal(col, v = -1) {
  const P = new Asm();
  P.part('7613', col, [0, 0, 0]);
  if (v === 1) P.part('93273', col, [0, 0, 10], ry(Math.PI / 2)); else {
  P.part('5852', col, [20, 0, 10], ry(-Math.PI / 2));   // čtvrtkruhy na dvou výstupcích jazýčku – zaoblený konec lístku
  P.part('5852', col, [-20, 0, 10], ry(Math.PI)); }
  P.part('3176', v === 0 ? 0 : col, [0, 8, 0]);                          // destička 3x2 pod jazýčkem, zaoblený konec do lístku
  P.part('5264', 297, [0, 16, -30]);
                       // zlatý klip zespodu v otvoru destičky
  return P;
}

const Y = [0, 1, 0];
const rot = (a) => ry(a);
const dirs3 = (a0) => [0, 1, 2].map((k) => { const a = a0 + k * 2 * Math.PI / 3; return [Math.cos(a), 0, -Math.sin(a)]; });
// ===== hlava typu „červený tulipán“ (kroky 1–6). Počátek = horní konec zahnuté trubičky 7324, osa hlavy = -Y =====
// col = barva lístků, inner = barva vnitřních lístků, disc = barva kroužků 85861
export function tulipHead({ col, disc = 320, open = 0 }) {
  const H = new Asm();
  H.part('32062', 0, [0, 0, 0], rz(Math.PI / 2));          // černá osa 2 (spoj s trubičkou)
  H.part('42195', 2, [0, -30, 0], rx(Math.PI / 2));        // zelená spojka os 3L
  H.part('4519', 71, [0, -60, 0], rz(Math.PI / 2));        // šedá osa 3
  H.part('18654', col, [0, -70, 0]);                        // spojka 1L
  H.part('3262', col, [0, -104, 0]);                        // kopule 2x2
  H.part('1941', 191, [0, -112, 0]);                        // kroužek se 3 tyčkami a 3 trubičkami
  H.part('11610', 0, [0, -131, 0]);                         // černý kužel
  H.part('68211', 19, [0, -133, 0]);                        // béžové tyčinky
  const yb = -110;
  // vnitřní lístky (krok 5): tyčka 78258 v trubičce kroužku, na ní lístek 7905 nahoru, na konci kroužek 85861
  for (const u of [[1, 0, 0], [-0.5, 0, -0.866], [-0.5, 0, 0.866]]) {
    const ex = cross(u, Y);
    H.part('78258', col, add(scl(u, 26), [0, yb, 0]), basis(Y, u, cross(Y, u)));
    H.part('7905', col, add(scl(u, 34), [0, yb, 0]), basis(ex, u, Y));
    H.part('85861', disc, add(scl(u, 45), [0, yb, 0]), basis(cross(u, scl(Y, -1)), u, scl(Y, -1)));
  }
  // vnější lístky (krok 6): klip 5264 na tyčce kroužku 1941 (tečná tyčka v r = 14,4)
  for (const b of [[-1, 0, 0], [0.5, 0, 0.866], [0.5, 0, -0.866]]) {
    const ey = scl(b, -1), NY = scl(Y, -1), M = basis(cross(ey, NY), ey, NY), bar = add(scl(b, 14.4), [0, yb, 0]);
    const tilt = rx(-open);                                  // rozevření lístku kolem klipu
    const Mt = mul(M, tilt), clip = [0, 26, -30];
    H.add(outerPetal(col), { M: Mt, p: sub(bar, apply(Mt, clip)) });
  }
  return H;
}
// ===== stonek: osa 32 + zahnutá trubička 7324; hlava na konci trubičky =====
export function tulipStem(head, { len = 640 } = {}) {
  const T = new Asm();
  T.part('50450', 2, [0, len / 2, 0], rz(Math.PI / 2));   // zelená osa 32 dolů od trubičky
  T.part('7324', 10, [0, 0, 0]);
  const d = [Math.SQRT1_2, -Math.SQRT1_2, 0], top = [23.432, -56.568, 0];
  const Md = basis(cross(scl(d, -1), [0, 0, 1]), scl(d, -1), [0, 0, 1]); // místní -Y → d
  T.add(head, { M: Md, p: top });
  return T;
}

// ===== varianty hlav =====
// fialová (návod 2, kroky 4–7): vnitřní lístky = 3 oválné štíty 2586 na tyčkách černého 6331, černé destičky 3176
export function purpleHead({ open = 0 } = {}) {
  const H = new Asm(), col = 85;
  H.part('32062', 0, [0, 0, 0], rz(Math.PI / 2)); H.part('42195', 2, [0, -30, 0], rx(Math.PI / 2)); H.part('4519', 71, [0, -60, 0], rz(Math.PI / 2));
  H.part('98100', 0, [0, -104, 0]);                          // černý komolý kužel 2x2
  H.part('1941', 70, [0, -112, 0]);
  H.part('6331', 0, [0, -136, 0]);                           // černý válec se 3 šikmými tyčkami
  H.part('68211', 19, [0, -140, 0]);
  const yb = -110;
  for (let k = 0; k < 3; k++) { // štít: zavěšený na šikmé tyčce, nahoru, lícem ven
    const a = k * 2 * Math.PI / 3, u = [Math.sin(-a) * -1, 0, -Math.cos(a)].map((v, j) => j === 0 ? -Math.sin(a) : v);
    const uu = norm([-Math.sin(a), 0, -Math.cos(a)]);
    H.part('2586', col, add(scl(uu, 22), [0, -150, 0]), basis(cross(Y, uu), Y, scl(uu, -1)));
  }
  for (const b of [[-1, 0, 0], [0.5, 0, 0.866], [0.5, 0, -0.866]]) {
    const ey = scl(b, -1), NY = scl(Y, -1), M = mul(basis(cross(ey, NY), ey, NY), rx(-open)), bar = add(scl(b, 14.4), [0, yb, 0]);
    H.add(outerPetal(col, 0), { M, p: sub(bar, apply(M, [0, 26, -30])) });
  }
  return H;
}
// růžová (návod 2, kroky 4–7): vnitřní lístky = růžová surfová prkna, vnější lístky s oblými díly 93273
export function pinkHead({ open = 0 } = {}) {
  const H = new Asm(), col = 29;
  H.part('32062', 0, [0, 0, 0], rz(Math.PI / 2)); H.part('42195', 2, [0, -30, 0], rx(Math.PI / 2)); H.part('4519', 71, [0, -60, 0], rz(Math.PI / 2));
  H.part('18654', 0, [0, -70, 0]); H.part('4740', 15, [0, -88, 0]); H.part('4032a', 15, [0, -96, 0]);
  H.part('3262', 15, [0, -104, 0], ry(0)); H.part('1941', 70, [0, -112, 0]);
  H.part('11610', 0, [0, -131, 0]); H.part('68211', 19, [0, -133, 0]);
  const yb = -110;
  for (const u of [[1, 0, 0], [-0.5, 0, -0.866], [-0.5, 0, 0.866]]) { // prkno nastojato, lícem ven
    const Mi = basis(cross(u, Y), u, Y); // prkno nastojato, líc ven, delší konec nahoru
    H.part('90397', col, add(scl(u, E('SR', 10)), [0, E('SY', -122), 0]), mul(Mi, ry(Math.PI))); // špička prkna dolů do středu
  }
  for (const b of [[-1, 0, 0], [0.5, 0, 0.866], [0.5, 0, -0.866]]) {
    const ey = scl(b, -1), NY = scl(Y, -1), M = mul(basis(cross(ey, NY), ey, NY), rx(-open)), bar = add(scl(b, 14.4), [0, yb, 0]);
    H.add(outerPetal(col), { M, p: sub(bar, apply(M, [0, 26, -30])) });
  }
  return H;
}
// oranžová (návod 1, kroky 2–8): dva válce 6331 se šikmými tyčkami, na nich 6 špičatých lístků 7096 s klipy 15712
export function orangeHead() {
  const H = new Asm();
  H.part('85861', 320, [0, 0, 0]);
  H.part('6331', 288, [0, -4, 0]);
  H.part('87994', 10, [0, -24, 0]);
  H.part('6331', 288, [0, -28, 0]);
  H.part('15469', 191, [0, -52, 0]); H.part('18674', 191, [0, -56, 0]);
  H.part('68211', 19, [0, -64, 0]); H.part('24855', 15, [0, -66, 0]);
  const petal = (a, yBar, lean) => { // lístek zavěšený klipem na šikmé tyčce, špička nahoru a ven
    const u = [Math.sin(a), 0, Math.cos(a)], t = cross(Y, u);
    const up = norm(add(scl(Y, -Math.cos(lean)), scl(u, Math.sin(lean))));        // směr špičky
    const out = norm(cross(up, t));                                                     // líc lístku (ven)
    const M = basis(t, scl(out, -1), scl(up, -1));                                      // místní -z = špička, -y = líc
    const P = new Asm(); P.part('7096', 25, [0, 0, 0]); P.part('98138', 191, [0, -8, 10]); P.part('15712', 191, [0, 8, 10], rx(Math.PI));
    H.add(P, { M, p: add(scl(u, 20), [0, yBar, 0]) });
  };
  for (let k = 0; k < 3; k++) petal(k * 2 * Math.PI / 3, -40, 0.55);                 // vnitřní řada
  for (let k = 0; k < 3; k++) petal(k * 2 * Math.PI / 3 + Math.PI / 3, -18, 1.0);    // vnější, víc rozevřené
  return H;
}
// poupě (návod 2, kroky 1–4): protáhlá limetková kopule 1744 na kopuli 49308, zelený kužel a miska
export function budHead() {
  const H = new Asm();
  H.part('59900', 2, [0, 0, 0], rx(Math.PI));
  H.part('4740', 2, [0, -28, 0], rx(Math.PI));
  H.part('49308', 326, [0, -36, 0], rx(Math.PI));
  H.part('1744', 326, [0, -36, 0]);
  return H;
}
// ===== listy =====
// dlouhý list (krok 8): deska 2x8, dvě zahnuté klínové kostky 5382 špičkami od sebe, podložka a úchyt na stonek
export function longLeaf() {
  const L = new Asm();
  L.part('3034', 10, [0, 0, 0], ry(Math.PI / 2)); L.part('3022', 19, [0, -8, 60]);
  L.part('5382', 10, [0, -24, -40]); L.part('5382', 10, [0, -24, 40], ry(Math.PI));
  L.part('90397', 10, [0, 8, -60], ry(Math.PI));
  L.part('10247', 0, [0, 8, 90]); L.part('85984', 288, [0, -8, 100]);
  return L; // místní -z = špička listu, úchyt u z = +100
}
// krátký zahnutý list (krok 10): pružná špička 61406, dva oblouky 5845, sklon 85984 a úchyt
export function shortLeaf() {
  const L = new Asm();
  L.part('5845', 10, [-10, 0, 0]); L.part('5845', 10, [10, 0, 0]);
  L.part('61406p0a', 10, [0, 88, -90], rx(Math.PI / 2 + 0.25));
  L.part('2654', 2, [0, 88, -78]);
  L.part('85984', 10, [0, -8, 0]); L.part('35480', 10, [0, 8, 0]); L.part('3484', 2, [0, 16, 8]);
  return L; // úchyt nahoře (y ≈ 0), list se zahýbá dolů
}

// rovný stonek (růžové, žluté, poupata): hlava přímo na ose
export function straightStem(head, { len = 640 } = {}) {
  const T = new Asm();
  T.part('50450', 2, [0, len / 2, 0], rz(Math.PI / 2));
  T.add(head, { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  return T;
}
// ===== kytice: 14 stonků (2 červené, 3 žluté, 2 oranžové, 2 fialové, 3 růžové, 2 poupata), 4 dlouhé + 4 krátké listy =====
// Konce stonků se sbíhají u dna vázy (y = 0), hlavy se rozestupují nahoru a ven.
export function bouquet() {
  const B = new Asm();
  const stems = [
    // [stonek, azimut°, sklon°, posun dolů (LDU), stočení hlavy°]
    [() => tulipStem(tulipHead({ col: 4, open: -0.1 })), 20, 9, 0, 0],
    [() => tulipStem(tulipHead({ col: 4, open: -0.05 })), 200, 11, 40, 0],
    [() => straightStem(tulipHead({ col: 14, disc: 28, open: -0.35 })), 95, 7, -10, 0],
    [() => straightStem(tulipHead({ col: 14, disc: 28, open: -0.15 })), 300, 10, 30, 0],
    [() => straightStem(tulipHead({ col: 14, disc: 28, open: -0.25 })), 165, 13, 70, 0],
    [() => tulipStem(orangeHead()), 60, 14, 50, 0],
    [() => straightStem(orangeHead()), 250, 12, 60, 0],
    [() => tulipStem(purpleHead({ open: -0.1 })), 130, 12, 20, 0],
    [() => tulipStem(purpleHead({ open: -0.05 })), 330, 13, 55, 0],
    [() => straightStem(pinkHead({ open: -0.1 })), 0, 3, -40, 0],
    [() => straightStem(pinkHead({ open: -0.1 })), 225, 7, -20, 0],
    [() => straightStem(pinkHead({ open: -0.1 })), 150, 6, 10, 0],
    [() => straightStem(budHead()), 280, 5, -60, 0],
    [() => straightStem(budHead()), 40, 6, -50, 0],
  ];
  const LEN = 640;
  for (const [mk, az, tl, dn] of stems) {
    const a = az * Math.PI / 180, t = tl * 1.45 * Math.PI / 180;
    const M = mul(ry(a), rz(-t)); // sklon ven ve směru azimutu (hlava přes ry natočená ven: zahnutá trubička míří do +x)
    const bottom = [0, -12 - (70 - dn), 0]; // konce stonků na dně vázy nebo opřené výš
    B.add(mk(), { M, p: sub(bottom, apply(M, [0, LEN, 0])) });
  }
  // dlouhé listy: z vázy podél stonků nahoru, lícem ven
  for (const [az, tl, h] of [[70, 21, 0], [190, 19, 30], [280, 22, -20], [10, 18, 40]]) {
    const a = az * Math.PI / 180, t = tl * Math.PI / 180;
    const up = norm([Math.sin(t) * Math.cos(a), -Math.cos(t), -Math.sin(t) * Math.sin(a)]);
    const out = norm([Math.cos(a), 0, -Math.sin(a)]);
    const ez = scl(up, -1), ey = scl(norm(sub(out, scl(up, dot(out, up)))), -1), ex = cross(ey, ez);
    B.add(longLeaf(), { M: basis(ex, ey, ez), p: add(scl(up, 575 + h), [0, 0, 0]) });
  }
  // krátké zahnuté listy: u okraje vázy přepadají ven
  for (const az of [130, 330, 230, 40]) {
    const a = az * Math.PI / 180, out = [Math.cos(a), 0, -Math.sin(a)];
    const M = basis(cross(Y, out).map((v) => -v), Y, out).map((v) => v);
    B.add(shortLeaf(), { M: basis(scl(cross(out, Y), 1), Y, scl(out, -1)), p: add(scl(out, 118), [0, -455, 0]) });
  }
  return B;
}
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
if (!process.env.SUB) { const b = new Build('tulips11501'), A = new Asm(); A.add(bouquet(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); A.emit(b); b.save('tulips11501.ldr'); console.log('tulips11501 parts', b.n); }
if (process.env.SUB) {
  const b = new Build('sub'), A = new Asm();
  if (process.env.SUB === 'red') A.add(tulipStem(tulipHead({ col: 4, open: -0.1 })), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'redhead') A.add(tulipHead({ col: 4, open: E('OPEN', 0) }), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  const hs = { purple: () => purpleHead({ open: -0.1 }), pink: () => pinkHead({ open: -0.15 }), orange: orangeHead, bud: budHead, yellow: () => tulipHead({ col: 14, disc: 28, open: -0.35 }) };
  if (hs[process.env.SUB]) A.add(hs[process.env.SUB](), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'leaves') { A.add(longLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); A.add(shortLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [150, 0, 0] }); }
  if (process.env.SUB === 'bouquet') A.add(bouquet(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'petal') A.add(outerPetal(4), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  A.emit(b); b.save('sub.ldr');
}
