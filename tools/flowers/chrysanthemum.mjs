import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, pot8, band, apply, stalk } from './lib.mjs';
// Chryzantéma 10368: šalvějová baňatá váza se zlatým pásem a krátkým hrdlem na hnědém stojánku, tmavé článkované
// stonky, kapradinové zubaté listy, dvě velké pavoučí hlavy ze zahnutých lístků, oranžová poupata. Líc = LDraw -z.
const b = new Build('chrysanthemum'); setSeed(13);
const VASE = 378, GOLD = 297, STAND = 70, ORA = 25, LORA = 191, RED = 4, DORA = 484, STEM = 288, LEAF = 288;
// stojánek
for (let q = 0; q < 4; q++) b.part('2577', STAND, [0, 152, 0], ry(q * Math.PI / 2));
b.part('60474', STAND, [0, 148, 0]);
for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.part('3062b', STAND, [Math.sin(a) * 58, 180, Math.cos(a) * 58]); }
// váza: zaoblené dno, baňaté tělo, zaoblené rameno se zlatým pásem, krátké hrdlo
for (let q = 0; q < 4; q++) b.part('5651', VASE, [0, 144, 0], mul(ry(q * Math.PI / 2), rx(Math.PI)));
pot8(b, VASE, 2, 72);
band(b, GOLD, 82, 66, 16);
for (let q = 0; q < 4; q++) b.part('5651', VASE, [0, 48, 0], ry(q * Math.PI / 2));
b.part('87081', VASE, [0, 24, 0]); b.part('87081', VASE, [0, 0, 0]); b.part('60474', 308, [0, -8, 0]);
// silný stonek z kulatých kostek, každý třetí článek světlejší kroužek (kolénko)
function stem(pts0) {
  const pts = stalk(b, STEM, pts0);
  for (let i = 3; i < pts.length; i += 3) b.part('6141', 2, pts[i], alignY(sub(pts[i - 1], pts[i])));
  return pts;
}
// kulovitá pavoučí hlava: vnitřní kalich z oblých dílů, kolem věnce zahnutých lístků stočených vzhůru a dovnitř
function head(c, up) {
  const U = alignY(scl(up, -1));
  const ring = (n, r, h, tilt, col, ph) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + ph; b.part('87747', col, add(c, apply(U, [Math.sin(a) * r, -h, Math.cos(a) * r])), mul(U, ry(a), rx(tilt * D))); } };
  b.part('30367a', RED, add(c, apply(U, [0, -14, 0])), U);
  ring(16, 34, 4, -72, ORA, 0);
  ring(16, 30, 16, -44, ORA, 0.2);
  ring(15, 26, 30, -14, LORA, 0.1);
  ring(13, 22, 44, 18, ORA, 0.3);
  ring(11, 16, 56, 46, ORA, 0.5);
  ring(8, 9, 64, 70, RED, 0.2);
  b.part('3062b', STEM, add(c, apply(U, [0, 20, 0])), U);
}
const s1 = stem(bezier([0, -8, 0], [4, -200, 0], [10, -320, -6], [16, -420, -10]));
head(s1[s1.length - 1], norm([0.15, -1, -0.25]));
const s2 = stem(bezier([-6, -8, 4], [-14, -130, 0], [-60, -210, -6], [-100, -260, -10]));
head(s2[s2.length - 1], norm([-0.35, -1, -0.3]));
// poupata
[[110, -320, -30], [130, -200, -20]].forEach((t) => {
  const p = stem([[0, -8, 0], [t[0] * 0.4, t[1] * 0.6, t[2] * 0.4], t]);
  const tip = p[p.length - 1];
  b.part('3062b', STEM, tip); b.part('30367a', ORA, add(tip, [0, -26, 0])); b.part('6141', LORA, add(tip, [0, -32, 0]));
});
// velké kapradinové zubaté listy (dvojice) natočené k divákovi
[[s1, 6, 135, 58], [s1, 9, 235, 62], [s2, 4, 215, 50], [s1, 4, 120, 44]].forEach(([pts, i, deg, t]) => {
  const a = deg * D, p = pts[Math.min(pts.length - 1, i)];
  const M = mul(ry(a + Math.PI), rx(t * D));
  b.part('2417', LEAF, add(p, [Math.sin(a) * 14, 0, Math.cos(a) * 14]), M);
  b.part('2417', LEAF, add(add(p, [Math.sin(a) * 14, 0, Math.cos(a) * 14]), apply(M, [0, -2, -70])), mul(M, rx(-14 * D)));
});
b.save('chrysanthemum.ldr'); console.log('chrysanthemum', b.n);
