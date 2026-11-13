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
  H.part('49308', 326, [0, -36, 0], rx(Math.PI));            // spodek poupěte: kopule obloukem dolů
  H.part('1744', 326, [0, -140, 0]);                          // protáhlá špička nahoru
  return H;
}
// ===== listy =====
// dlouhý list (krok 8): deska 2x8, dvě zahnuté klínové kostky 5382 špičkami od sebe, podložka a úchyt na stonek
export function longLeaf() {
  // dvě klínové kostky 5382 širokými konci k sobě = dlouhý list špičatý na obou koncích (krok 8), deska 2x8 pod nimi
  const L = new Asm();
  L.part('5382', 10, [0, -24, -40]); L.part('5382', 10, [0, -24, 40], ry(Math.PI));
  L.part('3034', 10, [0, 0, 0], ry(Math.PI / 2)); L.part('3022', 19, [0, 0, 60]);
  L.part('90397', 10, [0, 8, -150]);                      // zelené surfové prkno vyčnívá za klín = špička listu
  L.part('10247', 0, [0, 8, 130]);
  return L; // místní -z = špička listu (z = -230), úchyt u z ≈ +140
}
// krátký zahnutý list (krok 10): pružná špička 61406, dva oblouky 5845, sklon 85984 a úchyt
export function shortLeaf() {
  // krok 10: dva obloučky 5845 vedle sebe, na jejich vodorovném konci kulatá destička 2654 a dlouhý špičatý list 61406,
  // spoj zahlazený dvěma šikmými destičkami 85984; na druhém konci oblouku destička 35480 s klipem 3484 na stonek.
  // Místní souřadnice: +z = směr visícího listu (dolů), +y = ke stonku. Úchyt (klip) je v CLIP.
  const L = new Asm();
  L.part('5845', 10, [-10, 0, 0]); L.part('5845', 10, [10, 0, 0]);
  L.part('2654', 2, [0, 8, 10]);
  L.part('61406p0a', 10, [0, 0, 20], ry(Math.PI));
  L.part('85984', 10, [0, 0, 0]); L.part('85984', 10, [0, 0, 20], ry(Math.PI)); // hřbet bez zářezu
  L.part('35480', 10, [0, 88, -80]);
  L.part('3484', 2, [0, 96, -80], rz(Math.PI / 2));
  return L;
}
export const CLIP = [0, 110, -80];

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
  // rozložení hlav bez kolizí: hlavy (koule) se nesmí prolínat, stonky musí projít hrdlem vázy (r < 98 LDU ve výšce okraje)
  const kind = stems.map(([mk]) => { const src = mk.toString(); return { curved: /tulipStem/.test(src), r: /orangeHead/.test(src) ? 92 : /budHead/.test(src) ? 40 : /col: 14/.test(src) ? 70 : 64 }; });
  const P = stems.map(([, az, tl, dn]) => ({ az, tl: tl * 0.9, dn }));
  const pose = (q, k) => { const a = q.az * Math.PI / 180, t = q.tl * Math.PI / 180, M = mul(ry(a), rz(-t)); const bottom = [0, -12 - (70 - q.dn) * 0.8, 0]; const p = sub(bottom, apply(M, [0, LEN, 0])); return { M, p, a, c: add(p, apply(M, kind[k].curved ? [94, -127, 0] : [0, -100, 0])), bottom }; };
  const cost = (Q) => { const ps = Q.map(pose); let c = 0;
    for (let a = 0; a < ps.length; a++) { for (let b = a + 1; b < ps.length; b++) { const d = Math.hypot(...sub(ps[a].c, ps[b].c)), m = kind[a].r + kind[b].r; if (d < m) c += (m - d) ** 2; }
      const rimR = Math.tan(Q[a].tl * Math.PI / 180) * (320 + ps[a].bottom[1]); if (rimR > 92) c += 50 * (rimR - 92) ** 2;
      if (Q[a].tl < 0) c += 1e4; c += 0.02 * (ps[a].c[1] + 760) ** 2 * 0.01; }
    return c; };
  let best = P.map((q) => ({ ...q })), bc = cost(best); let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let it = 0; it < 6000; it++) {
    const Q = best.map((q) => ({ ...q })), k = Math.floor(rnd() * Q.length), T = 1 - it / 6000;
    Q[k].az += (rnd() - 0.5) * 60 * T; Q[k].tl = Math.min(19, Math.max(0, Q[k].tl + (rnd() - 0.5) * 8 * T)); Q[k].dn = Math.min(70, Math.max(-60, Q[k].dn + (rnd() - 0.5) * 60 * T));
    const c = cost(Q); if (c < bc) { bc = c; best = Q; }
  }
  if (process.env.DBG) console.log('kolize hlav (zbytek):', bc.toFixed(1));
  const placed = [];
  for (let k = 0; k < stems.length; k++) {
    const { M, p, a } = pose(best[k], k);
    B.add(stems[k][0](), { M, p }); placed.push({ M, p, a });
  }
  // dlouhé listy (návod str. 19): připnuté klipem na stonek, list stoupá podél stonku nad květ, lícem ven
  // listy na krajní stonky (dva nejvíc vlevo, dva nejvíc vpravo při pohledu zepředu), list odbíhá ven
  const byX = placed.map((st, k) => ({ k, x: apply(st.M, [0, -1, 0])[0] * 700 + st.p[0] })).sort((u, v) => u.x - v.x);
  const leafSpots = [[byX[0].k, 110, -0.25], [byX[2].k, 130, -0.15], [byX[byX.length - 1].k, 110, 0.25], [byX[byX.length - 3].k, 130, 0.15]];
  for (const [si, yl, tw] of leafSpots) {
    const st = placed[si], at = add(st.p, apply(st.M, [0, yl, 0]));
    const up = norm(apply(st.M, [0, -1, 0])), back = [Math.cos(st.a), 0, -Math.sin(st.a)];
    const out = norm([-tw, 0, -1]);                                        // líc listu k divákovi (+z), lehce do strany
    const ez = scl(up, -1), ey = scl(norm(sub(out, scl(up, dot(out, up)))), -1), ex = cross(ey, ez);
    const Ml = mul(basis(ex, ey, ez), ry(Math.sign(tw) * 0.1)); // list odbíhá od stonku šikmo ven, špička nad květem (návod str. 19)
    B.add(longLeaf(), { M: Ml, p: sub(add(add(at, scl(back, 20)), [0, 0, -45]), apply(Ml, [0, 0, 140])) }); // za stonkem
  }
  // krátké listy u okraje (fotka sady): klip na stonku nad okrajem, oblouk se přehne ven přes okraj, list visí dolů vně
  const RIM = +(process.env.RIM || -215);
  for (const az of [22, 68, 112, 158]) { // přední strana (k divákovi = -z), rozložené zleva doprava jako na fotce
    const a = az * Math.PI / 180, out = [Math.cos(a), 0, -Math.sin(a)];
    const yc = RIM - 95;
    let best = null, bp = -1e9;
    for (const st of placed) { const d = norm(apply(st.M, [0, -1, 0])), t = (yc - st.p[1]) / d[1], q = add(st.p, scl(d, t)); const pr = dot(q, out); if (pr > bp) { bp = pr; best = q; } }
    const ez = [0, 1, 0], ey = scl(out, -1), ex = cross(ey, ez);
    const Ml = mul(basis(ex, ey, ez), rx(-0.12));
    B.add(shortLeaf(), { M: Ml, p: sub(best, apply(Ml, CLIP)) });
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
  if (process.env.SUB === 'one') { // jeden červený tulipán s dlouhým listem jako na str. 19 (list namontovaný stejně jako v kytici)
    const M = [1, 0, 0, 0, 1, 0, 0, 0, 1], p = [0, -640, 0];
    A.add(straightStem(tulipHead({ col: 4, open: -0.1 })), { M, p });
    const at = add(p, [0, +(process.env.YL || 150), 0]), up = [0, -1, 0], out = norm([E('TW', 0.3), 0, 1]), back = [1, 0, 0];
    const ez = scl(up, -1), ey = scl(norm(sub(out, scl(up, dot(out, up)))), -1), ex = cross(ey, ez);
    const VR = { a: ry(E('IP', 0.3)), b: ry(Math.PI), c: rz(Math.PI / 2), d: rz(-Math.PI / 2), e: mul(rz(Math.PI / 2), ry(Math.PI)), f: mul(rz(-Math.PI / 2), ry(Math.PI)) }[process.env.VR || 'a'];
    const Ml = mul(basis(ex, ey, ez), VR);
    A.add(longLeaf(), { M: Ml, p: sub(add(at, [0, 0, 18]), apply(Ml, [0, 0, 140])) });
  }
  if (process.env.SUB === 'long') { A.add(longLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); A.part('30374', 4, [0, -40, -300], [1, 0, 0, 0, 0, -1, 0, 1, 0]); }
  if (process.env.SUB === 'short') { A.add(shortLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); }
  if (process.env.SUB === 'leaves') { A.add(longLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); A.add(shortLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [150, 0, 0] }); }
  if (process.env.SUB === 'bouquet') A.add(bouquet(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'petal') A.add(outerPetal(4), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  A.emit(b); b.save('sub.ldr');
}
