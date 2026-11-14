// Šťastný bambus 10344 – stavba z dílků podle oficiálního návodu (6555770) a inventáře Rebrickable (325 dílků).
// Souřadnice LDraw: Y dolů, horní plocha kulaté desky podstavce v y = 0.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm } from './asm.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const K = 0, RB = 70, DT = 28, TN = 19, BG = 10, GN = 2, DG = 288, LBG = 71, DBG = 72, W = 15, GOLD = 82, TC = 47, LIME = 27, SG = 378, RD = 4;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const A = new Asm();
const dir = (a) => [Math.sin(a), 0, Math.cos(a)];
// kulatý roh 7033: střed oblouku v místním (-10, ·, 10); flip = převrácený (zaoblením dolů)
const ring = (col, y, flip) => { for (let q = 0; q < 4; q++) { const M = flip ? mul(ry(q * Math.PI / 2), rx(Math.PI)) : ry(q * Math.PI / 2); A.part('7033', col, add(scl(apply(M, [-10, 0, 10]), -1), [0, y, 0]), M); } };

// ===== sáček 1, kroky 1–6: podstavec – kulatá deska, ramena do mlýnku, hnědý prstenec, nožičky z ocásků =====
A.part('74611', K, [0, 0, 0]);
for (let q = 0; q < 4; q++) {
  const a = q * Math.PI / 2, o = dir(a), R = ry(a);
  A.part('4304', RB, add(scl(o, 62), [0, 8, 0]), R);                                   // pod deskou, boční výstupky ven
  A.part('1745', RB, add(scl(o, 84), [0, 18, 0]), mul(R, rx(-Math.PI / 2)));            // půlkruh na bočních výstupcích
  A.part('15429', RB, add(scl(o, E('FO', 72)), [0, E('FY', 22), 0]), mul(R, [rx(0), rx(Math.PI / 2), rx(-Math.PI / 2), rz(Math.PI / 2), mul(ry(Math.PI / 2), rx(-Math.PI / 2))][E('FM', 2)]));    // nožička (stočený ocásek)
  A.part('3020', RB, apply(R, [40, -8, -20]), R);                                       // ramena do mlýnku
  A.part('4073', RB, apply(R, [60, -8, 60]));                                           // kulaté destičky v mezerách
}
A.part('3001', K, [0, -32, -20]); A.part('3001', K, [0, -32, 20]);
ring(RB, -32, false);                                                                   // hnědý prstenec (y -32 … -8)

// ===== kroky 7–20: tělo květináče (stavěné obráceně) – zemitý prstenec dole, zlatý pás, zemitý prstenec nahoře =====
const Y0 = -32;                       // spodní hrana těla
ring(DT, Y0, true);                   // spodní zemitý prstenec, zaoblením dolů (y -56 … -32)
const BY = Y0 - 24 - 10;              // střed zlatého pásu (výška 20)
for (let q = 0; q < 4; q++) {
  const a0 = q * Math.PI / 2;
  for (const s of [-1, 1]) {          // dva zlaté oblouky na stranu, mírně do V podle prstence
    const a = a0 + s * E('BA', 18) * Math.PI / 180, o = dir(a), t = [Math.cos(a), 0, -Math.sin(a)];
    A.part('50950', GOLD, add(scl(o, E('BR', 95)), [0, BY, 0]), basis([0, 1, 0], scl(o, -1), scl(t, -1)));
  }
  // roh: hnědá kostka s výstupky na 4 stranách, zlatá dlaždička navrchu, zemité svahy po stranách
  const ac = a0 + Math.PI / 4, oc = dir(ac), Rc = ry(ac);
  A.part('4733', RB, add(scl(oc, E('CR', 93)), [0, BY - 12, 0]), Rc);
  A.part('3070b', GOLD, add(scl(oc, E('CR', 93)), [0, BY - 12, 0]), Rc);
  for (const s of [-1, 1]) A.part('35464', TN, add(add(scl(oc, E('CR', 93) - 4), scl([Math.cos(ac), 0, -Math.sin(ac)], s * 20)), [0, BY + 12, 0]), mul(Rc, ry(s * Math.PI / 2)));
  // vnitřní stěny (bílé kostky s výstupky do stran na šedé desce) – z velké části skryté
  const o0 = dir(a0), R0 = ry(a0);
  A.part('3666', DBG, add(scl(o0, 50), [0, BY + 12, 0]), R0);
  for (const k of [-40, 0, 40]) A.part('52107', W, add(add(scl(o0, 50), scl([Math.cos(a0), 0, -Math.sin(a0)], k * 0.75)), [0, BY - 12, 0]), mul(R0, ry(Math.PI / 2)));
}
const YT = BY - 10 - 24;              // horní zemitý prstenec (y YT … YT+24)
ring(DT, YT, false);
// uvnitř: šedé jádro, průhledná „voda“, zlatá mince, šedé kuličky (oblázky)
A.part('3031', LBG, [0, YT + 16, 0]);
for (const [x, z, r] of [[-20, -50, 0], [20, -50, 0], [-20, 50, 0], [20, 50, 0], [-50, 0, 1], [50, 0, 1]]) A.part('2431', TC, [x, YT + 8, z], r ? ry(Math.PI / 2) : I);
A.part('14769p86', 297, [-20, YT + 8, 20]);
for (let q = 0; q < 4; q++) { const p = apply(ry(q * Math.PI / 2 + Math.PI / 4), [0, 0, 62]); A.part('4073', TC, [p[0], YT + 8, p[2]]); A.part('32474', LBG, [p[0], YT - 4, p[2]]); }

// ===== kroky 22–28: držák stonků (tmavě šedý blok s otvory pro osy) =====
const HY = YT + 6;
A.part('52501', DBG, [0, HY - 24, 0], ry(Math.PI / 2));
A.part('93273', DBG, [0, HY - 24, 0], ry(Math.PI / 2));

// ===== kroky 29–31: tři stonky – kulaté kostky 2x2 na ose, po dvou s béžovým kolínkem (kolečko) a zelenou dlaždicí =====
// stonek se staví shora dolů: béžový řez, horní článek s pískově zeleným úchytem, pak články [kolínko, kostka, kostka, dlaždice]
const STEMS = [
  { p: [E('S1X', 0), 0, E('S1Z', -24)], units: 4, extra: true, axle: '50451', axL: 320, branch: E('B1', 200) },   // nejvyšší (osa 16)
  { p: [E('S2X', 36), 0, E('S2Z', 14)], units: 3, extra: false, axle: '3708', axL: 240, branch: E('B2', 80) },   // prostřední (osa 12)
  { p: [E('S3X', -36), 0, E('S3Z', 14)], units: 1, extra: false, tail: true, axle: '3707', axL: 160, branch: E('B3', 280) } // nejnižší (osa 8)
];
const tops = [];
for (const S of STEMS) {
  // výška stonku
  let h = 8 + 24 + (S.extra ? 16 : 0) + S.units * (10 + 48 + 8) + (S.tail ? 10 + 24 + 8 : 0);
  const bottom = HY - 24, top = bottom - h, [x, , z] = S.p;
  let y = top;
  A.part('14769p85', TN, [x, y, z]); y += 8;                                            // béžový řez navrchu
  A.part('3941', BG, [x, y, z]);                                                         // horní článek
  const bd = S.branch * Math.PI / 180, bo = dir(bd);
  A.part('73230', SG, add([x, y, z], scl(bo, 30)), ry(bd + Math.PI / 2));               // úchyt větvičky (otvor pro osu do strany)
  A.part('68013', BG, [x, y, z], ry(bd + Math.PI));                                      // půlválec na protější straně
  y += 24;
  if (S.extra) { A.part('4032a', BG, [x, y, z]); y += 8; A.part('4032a', BG, [x, y, z]); y += 8; }
  const unit = () => { A.part('80441p02', TN, [x, y + 5, z], rx(Math.PI / 2)); y += 10; A.part('3941', BG, [x, y, z]); y += 24; A.part('3941', BG, [x, y, z]); y += 24; A.part('15535', GN, [x, y, z]); y += 8; };
  for (let u = 0; u < S.units; u++) unit();
  if (S.tail) { A.part('80441p02', TN, [x, y + 5, z], rx(Math.PI / 2)); y += 10; A.part('3941', BG, [x, y, z]); y += 24; A.part('15535', GN, [x, y, z]); y += 8; }
  A.part(S.axle, S.axle === '3708' ? RD : K, [x, top + 8 + S.axL / 2, z], rz(Math.PI / 2));
  tops.push({ x, z, top, bd, bo, joint: [x, top + 8 + 12, z] });
}

// ===== krok 32: tři větvičky – červená osa z úchytu, zelené koleno, tyčka nahoru s pochvou, kulaté kostičky s klipy =====
const leafSpots = [];
for (const T of tops) {
  const j = T.joint, o = T.bo, L = E('BL', 1);
  const e0 = add(j, scl(o, 40));                                                          // osa vystupuje z úchytu
  A.part('32062', RD, add(j, scl(o, 30)), ry(T.bd - Math.PI / 2));
  // koleno 25214 (konce: místní (-30,0,0) směr -x a (0,0,30) směr +z): jeden konec ke stonku, druhý nahoru
  A.part('25214', BG, add(e0, scl(o, 30)), basis(o, [-o[2], 0, o[0]], [0, -1, 0]));
  const up = add(e0, add(scl(o, 30), [0, -30, 0]));                                       // horní konec kolena
  A.part('85861', GN, add(up, [0, -8, 0]));
  A.part('63965a', BG, add(up, [0, -8, 0]));
  A.part('39262', DT, add(up, [0, -16, 0]));
  const barTop = add(up, [0, -8 - 104 * L, 0]);
  for (const dy of [0, 54]) { A.part('30068', BG, add(barTop, [0, dy + 30, 0])); A.part('11090', BG, add(barTop, [0, dy, 0])); }
  leafSpots.push({ p: add(barTop, [0, -2, 0]), a: T.bd - E('LA', 1.0), lift: E('L1', 0.7) }, { p: add(barTop, [0, -2, 0]), a: T.bd + E('LA', 1.0), lift: E('L1', 0.7) - 0.1 }, { p: add(barTop, [0, 52, 0]), a: T.bd + Math.PI + 0.3, lift: E('L2', 0.55) });
}

// ===== krok 33: 9 trsů listů – dva dlouhé tmavě zelené listy, zelená podložka s ouškem, tmavě zelený oblouček =====
for (const s of leafSpots) {
  const o = dir(s.a), pitch = s.lift;                                                      // trs míří ven a mírně vzhůru, listy se samy prohnou
  const fwd = norm(add(scl(o, Math.cos(pitch)), [0, -Math.sin(pitch), 0]));
  const ez = fwd, ex = norm(cross([0, -1, 0], ez)), ey = cross(ez, ex);                  // místní +z = ven (listy), -z = ouško ke klipu
  const M = basis(ex, ey, ez);
  const base = add(s.p, scl(fwd, 22));
  A.part('26047', GN, base, M);
  A.part('24201', GN, add(base, apply(M, [0, -8, 0])), mul(M, ry(Math.PI)));
  for (const sg of [-1, 1]) A.part('3565', DG, add(base, apply(M, [sg * 4, -24 + (sg > 0 ? -4 : 0), 10])), mul(M, ry(Math.PI + sg * E('LS', 0.28))));
  A.part('11477', DG, add(base, apply(M, [0, -32, 0])), M);
}

// ===== krok 34: oblázky – šedé misky s kulatou dlaždicí =====
for (let k = 0; k < 8; k++) {
  const a = (k / 8) * Math.PI * 2 + 0.3, r = 50 + (k % 2) * 8, p = [Math.sin(a) * r, YT + 4, Math.cos(a) * r];
  if (STEMS.some((S) => Math.hypot(p[0] - S.p[0], p[2] - S.p[2]) < 34)) continue;
  A.part('2654a', LBG, p); A.part('14769', LBG, add(p, [0, -8, 0]));
}

const b = new Build('lucky10344'); A.emit(b); b.save('lucky10344.ldr'); console.log('lucky10344 parts', b.n);
