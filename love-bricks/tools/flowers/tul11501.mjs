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
  P.part('5852', col, [20, E('QD', 8), 10], ry(-Math.PI / 2));   // čtvrtkruhy na dvou výstupcích jazýčku – zaoblený konec lístku
  P.part('5852', col, [-20, E('QD', 8), 10], ry(Math.PI)); } // čtvrtkruhy zapuštěné, horní plocha navazuje na zakřivený díl
  P.part('3176', v === 0 ? 0 : col, [0, 8 + E('QD', 8), 0]);                          // destička 3x2 pod jazýčkem, zaoblený konec do lístku
  P.part('5264', 297, [0, 16 + E('QD', 8), -30]);
                       // zlatý klip zespodu v otvoru destičky
  return P;
}

const Y = [0, 1, 0];
const rot = (a) => ry(a);
const dirs3 = (a0) => [0, 1, 2].map((k) => { const a = a0 + k * 2 * Math.PI / 3; return [Math.cos(a), 0, -Math.sin(a)]; });
// vnější lístek: špička nahoru, vypouklá strana ven, zaoblené čtvrtkruhy tvoří kulaté dno hlavy (jako na fotce sady)
function petalM(b, open) {
  const ey = scl(b, -1), up = E('PUP', 1) > 0 ? Y : scl(Y, -1);
  return mul(basis(cross(ey, up), ey, up), rx(E('PT', -0.45) - open));
}
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
  [[-1, 0, 0], [0.5, 0, 0.866], [0.5, 0, -0.866]].forEach((b, i) => {
    const Mt = petalM(b, Array.isArray(open) ? open[i] : open), bar = add(scl(b, 14.4), [0, yb, 0]);
    H.add(outerPetal(col), { M: Mt, p: sub(bar, apply(Mt, [0, 26 + E('PIN', -8), -30])) });
  });
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
    H.part('2586', col, add(scl(uu, 22), [0, -132, 0]), basis(cross(Y, uu), Y, scl(uu, -1)));
  }
  for (const b of [[-1, 0, 0], [0.5, 0, 0.866], [0.5, 0, -0.866]]) {
    const M = petalM(b, open), bar = add(scl(b, 14.4), [0, yb, 0]);
    H.add(outerPetal(col, 0), { M, p: sub(bar, apply(M, [0, 26 + E('PIN', -8), -30])) });
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
    H.part('90397', col, add(scl(u, E('SR', 4)), [0, E('SY', -104), 0]), Mi); // špička prkna dolů do středu
  }
  for (const b of [[-1, 0, 0], [0.5, 0, 0.866], [0.5, 0, -0.866]]) {
    const M = petalM(b, open), bar = add(scl(b, 14.4), [0, yb, 0]);
    H.add(outerPetal(col), { M, p: sub(bar, apply(M, [0, 26 + E('PIN', -8), -30])) });
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
  for (let k = 0; k < 3; k++) petal(k * 2 * Math.PI / 3, -40, E('OL1', 1.0));                 // vnitřní řada
  for (let k = 0; k < 3; k++) petal(k * 2 * Math.PI / 3 + Math.PI / 3, -18, E('OL2', 1.45));    // vnější, víc rozevřené
  return H;
}
// poupě (návod 2, kroky 1–4): protáhlá limetková kopule 1744 na kopuli 49308, zelený kužel a miska
export function budHead() {
  // návod 2, kroky 1–4: spodní díl = kopule 49308 + miska 4740 + kulatá destička 85861 + kužel 59900 (postaveno kopulí nahoru),
  // pak otočený a nasazený pod protáhlou kopuli 1744 s kulatou destičkou 6141 na špičce → hladké vajíčko, pod ním zelený kalich.
  // Počátek = horní konec stonku (spodní hrot kužele), osa poupěte = -Y.
  const H = new Asm(), E = -76;                 // rovník vajíčka (styk obou kopulí)
  const F = rx(Math.PI);
  H.part('1744', 326, [0, E - 72, 0]);          // horní polovina: protáhlá kopule špičkou nahoru
  H.part('6141', 326, [0, E - 72 - 8, 0]);      // malá kulatá destička na špičce
  H.part('49308', 326, [0, E + 32, 0], F);      // dolní polovina: kopule obloukem dolů
  H.part('4740', 2, [0, E + 40, 0], F);         // zelená miska pod vajíčkem
  H.part('85861', 2, [0, E + 48, 0], F);
  H.part('59900', 2, [0, E + 72, 0], F);        // zelený kužel zužující se ke stonku
  return H;
}
// lístek poupěte (návod 2, krok 7): špičatý list 61406 na kulaté destičce 2654, destička s klipy 60470b, šikmá destička 85984;
// klipy na tyčce stonku pod poupětem, list stoupá podél poupěte
export function budLeaf() {
  const L = new Asm();
  L.part('61406p0a', 10, [0, 0, 0]);               // špičatý list, základna 1x2 v počátku, špička k -z
  L.part('85984', 10, [0, 0, 0]);                  // šikmá destička zahladí výstupky základny
  L.part('2654', 2, [0, 8, 0]);                    // kulatá destička pod základnou
  L.part('60470b', 2, [0, 16, 4], ry(Math.PI));     // destička s klipy, klipy ke stonku
  return L;
}
// poupě na stonku s lístkem: spojka 99021 na ose pod poupětem, na její boční tyčce klipem lístek, který stoupá podél poupěte
export function budStem({ len = 640, side = 0 } = {}) {
  const T = straightStem(budHead(), { len });
  const out = [Math.cos(side), 0, -Math.sin(side)];
  T.part('99021', 2, [0, 22, 0], ry(side));                          // spojka na ose těsně pod kalichem
  const ez = [0, 1, 0], ey = scl(out, -1), ex = cross(ey, ez);
  const Ml = mul(basis(ex, ey, ez), rx(E('BT', -0.45)), rz(0.6));            // špička nahoru a šikmo od poupěte
  T.add(budLeaf(), { M: Ml, p: add(scl(out, 36), [0, 6, 0]) });
  return T;
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
  // Rozmístění hlav podle produktové fotky sady (pohled zepředu = divák na -z, x doprava, y nahoru záporně).
  // [druh, cíl hlavy x, y, z, ohyb] – ohyb: zahnutá trubička 7324 natočená do strany (jako krajní tulipány na fotce)
  const R = (o) => tulipHead({ col: 4, open: o }), Yl = (o) => tulipHead({ col: 14, disc: 28, open: o });
  const heads = [
    // zadní řada (nahoře)
    [() => pinkHead({ open: -0.05 }), -125, -800, 90, null],
    [() => pinkHead({ open: -0.05 }), -15, -815, 110, null],
    [() => Yl([-0.15, -0.15, -0.55]), 85, -790, 100, null],
    [() => pinkHead({ open: -0.05 }), 180, -795, 80, null],
    // prostřední řada
    [() => orangeHead(), -175, -735, 20, null],
    [() => purpleHead({ open: -0.05 }), 35, -755, -10, null],
    [() => R(-0.05), 140, -740, -10, null],
    [() => Yl([-0.15, -0.6, -0.15]), 215, -700, -40, null],
    // přední řada (níž, k divákovi)
    [() => R([-0.15, -0.15, -0.55]), -215, -680, -110, -1],
    [() => Yl([-0.45, -0.45, -0.45]), -105, -660, -150, null],
    [() => orangeHead(), 0, -650, -170, null],
    [() => purpleHead({ open: -0.1 }), 115, -690, -130, 1],
    // poupata vzadu mezi hlavami
    [() => budStem({ side: 0.5 }), -60, -735, 125, 'bud'],
    [() => budStem({ side: 2.6 }), 55, -720, 135, 'bud'],
  ];
  const B = new Asm(), LEN = 640, placed = [];
  const PINCH = [0, E('PY', -130), 0];                                    // stonky se kříží ve společném bodě v nádobě
  for (const [mk, hx, hy, hz, bend] of heads) {
    const target = [hx * E('SPR', 0.84), -700 + (hy + 700) * 0.85, hz * E('SPR', 0.84)];
    const curved = bend === -1 || bend === 1;
    const frame = (dir) => { const up = scl(dir, -1), w = curved ? [bend, 0, -0.3] : [1, 0, 0];
      const side = norm(sub(w, scl(up, dot(w, up)))); return basis(side, up, norm(cross(side, up))); };
    const PK = [target[0] * E('PS', 0.5), PINCH[1], target[2] * E('PS', 0.5)];   // stonky v květináči rozprostřené k okraji
    let dir = norm(sub(target, PK)), M = frame(dir), p = target;
    if (curved) for (let it = 0; it < 4; it++) { p = sub(target, apply(M, [23, -57, 0])); dir = norm(sub(p, PK)); M = frame(dir); }
    const stem = bend === 'bud' ? mk() : curved ? tulipStem(mk(), { len: LEN }) : straightStem(mk(), { len: LEN });
    B.add(stem, { M, p }); placed.push({ full: bend !== 'bud', M, p, a: Math.atan2(-hz, hx), x: hx, z: hz, y: hy, bottom: add(p, apply(M, [0, LEN, 0])) });
  }
  if (process.env.DBG) console.log('konce stonků', placed.map((q) => q.bottom.map(Math.round).join(',')).join('  '));
  // dlouhé listy (str. 19): úchyt nízko na stonku, list stoupá podél stonku za hlavami, špička vykukuje mezi hlavami
  for (const [si, yl, tw, lean] of [[4, E('LY', 200), -0.6, -0.55], [0, E('LY', 200) + 20, -0.35, -0.3], [3, E('LY', 200) + 20, 0.35, 0.35], [7, E('LY', 200), 0.6, 0.6]]) {
    const st = placed[si], at = add(st.p, apply(st.M, [0, yl, 0]));
    const up = norm([Math.sin(lean), -Math.cos(lean), 0]);
    const out = norm([-tw, 0, -1]);
    const ez = scl(up, -1), ey = scl(norm(sub(out, scl(up, dot(out, up)))), -1), ex = cross(ey, ez);
    const Ml = basis(ex, ey, ez);
    B.add(longLeaf(), { M: Ml, p: sub(add(at, [0, 0, 45]), apply(Ml, [0, 0, 140])) }); // za stonkem, špička vykukuje do strany
  }
  // krátké listy u okraje (fotka sady): klip na stonku těsně nad okrajem, oblouk se přehne přes okraj, list visí dolů vně
  const RIM = +(process.env.RIM || -300), POTR = +(process.env.POTR || 160);
  const atY = (st, y) => { const d = norm(apply(st.M, [0, -1, 0])), t = (y - st.p[1]) / d[1]; return add(st.p, scl(d, t)); };
  const used = new Set();
  for (const az of [20, 65, 115, 160]) { // přední strana (divák na -z), zleva doprava jako na fotce
    const a = az * Math.PI / 180, out = [Math.cos(a), 0, -Math.sin(a)];
    let best = null, bi = -1, bp = -1e9;
    placed.forEach((st, k) => { if (used.has(k) || !st.full) return; const q = atY(st, RIM - 120); const pr = dot(q, out) - 0.3 * Math.hypot(q[0], q[2]); if (pr > bp) { bp = pr; bi = k; } });
    used.add(bi);
    const ez = [0, 1, 0], ey = scl(out, -1), ex = cross(ey, ez);
    let Ml;
    // nejnižší úchyt na stonku (a co nejmenší vyklonění), při kterém visící list mine okraj květináče
    search: for (const tilt of [-0.15, -0.3, -0.45, -0.6]) for (let h = 40; h <= 300; h += 10) {
      Ml = mul(basis(ex, ey, ez), rx(tilt));
      const q = atY(placed[bi], RIM - h), p0 = sub(q, apply(Ml, CLIP));
      const j = add(p0, apply(Ml, [0, 0, 0])), tip = add(p0, apply(Ml, [0, 0, 170]));
      const t = (RIM - j[1]) / (tip[1] - j[1]); const at = add(j, scl(sub(tip, j), Math.max(0, Math.min(1, t))));
      if (j[1] < RIM - 10 && Math.hypot(j[0], j[2]) > POTR + 18 && Math.hypot(at[0], at[2]) > POTR + 18) { best = p0; if (process.env.DBG) console.log('list', az, 'stonek', bi, 'h', h, 'naklon', tilt); break search; }
    }
    if (best) B.add(shortLeaf(), { M: Ml, p: best });
  }
  return B;
}
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
if (!process.env.SUB) { const b = new Build('tulips11501'), A = new Asm(); A.add(bouquet(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); A.emit(b); b.save('tulips11501.ldr'); console.log('tulips11501 parts', b.n); }
if (process.env.SUB) {
  const b = new Build('sub'), A = new Asm();
  if (process.env.SUB === 'red') A.add(tulipStem(tulipHead({ col: 4, open: -0.1 })), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'redhead') A.add(tulipHead({ col: 4, open: E('OPEN', 0) }), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  const hs = { purple: () => purpleHead({ open: -0.1 }), pink: () => pinkHead({ open: -0.15 }), orange: orangeHead, bud: budHead, yellow: () => tulipHead({ col: 14, disc: 28, open: [-0.15, -0.15, -0.55] }) };
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
  if (process.env.SUB === 'budhead') { A.add(budStem(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, -640, 0] }); }
  if (process.env.SUB === 'yopen') A.add(tulipHead({ col: 14, disc: 28, open: -0.45 }), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'ropen') A.add(tulipHead({ col: 4, open: [-0.15, -0.15, -0.55] }), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'budone') {
    A.add(budStem(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, -640, 0] });
  }
  if (process.env.SUB === 'short') { A.add(shortLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); }
  if (process.env.SUB === 'leaves') { A.add(longLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] }); A.add(shortLeaf(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [150, 0, 0] }); }
  if (process.env.SUB === 'bouquet') A.add(bouquet(), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  if (process.env.SUB === 'petal') A.add(outerPetal(4), { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] });
  A.emit(b); b.save('sub.ldr');
}
