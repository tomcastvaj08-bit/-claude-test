import { Build, D, rx, ry, rz, mul, alignY, add, sub, scl, norm, rnd, setSeed, ring } from './lib.mjs';
// Kvetoucí kaktus 11509: světle modrý květináč ve tvaru zaobleného čtverce, vysoký žebrovaný kaktus s béžovými
// bodlinami a velkým růžovým lotosovým květem, menší zakulacený kaktus s růžičkami. Líc = LDraw -z.
const b = new Build('cactus'); setSeed(9);
const POT = 212, SOIL = 70, CAC = 378, RIB = 288, SPIKE = 19, PINK = 29, DPINK = 5, YEL = 14, LIME = 27;
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
// květináč: 4 zaoblené rohy + rovné stěny mezi nimi, 3 vrstvy
for (let l = 0; l < 4; l++) {
  const y = 24 * l;
  [[60, 60, -Math.PI / 2], [60, -60, 0], [-60, -60, Math.PI / 2], [-60, 60, Math.PI]].forEach(([x, z, a]) => b.part('2577', POT, [x, y, z], ry(a)));
  b.part('3009', POT, [0, y, 130]); b.part('3009', POT, [0, y, -130]);
  b.part('3009', POT, [130, y, 0], ry(Math.PI / 2)); b.part('3009', POT, [-130, y, 0], ry(Math.PI / 2));
}
// hlína a oblázky
for (const [x, z] of [[-60, -60], [60, -60], [-60, 60], [60, 60], [0, 0], [0, -60], [0, 60], [-60, 0], [60, 0]]) b.part('60474', SOIL, [x, -4, z]);
for (let k = 0; k < 22; k++) b.part(k % 3 ? '98138' : '6141', k % 2 ? SOIL : 28, [(rnd() - 0.5) * 220, -12, (rnd() - 0.5) * 220]);
// žebrovaný kaktus: jádro z kulatých kostek 4x4, po obvodu žebra z kulatých 1x1 a bodliny mezi nimi
function cactus(cx, cz, levels, R = 46, ribs = 9) {
  for (let l = 0; l < levels; l++) b.part('87081', CAC, [cx, -24 - l * 24, cz]);
  for (let k = 0; k < ribs; k++) {
    const a = (k / ribs) * Math.PI * 2;
    for (let l = 0; l < levels; l++) {
      const taper = l >= levels - 2 ? (l - levels + 3) * 6 : 0;
      b.part('3062b', k % 2 ? RIB : CAC, [cx + Math.sin(a) * (R - taper), -24 - l * 24, cz + Math.cos(a) * (R - taper)]);
      if (l % 2 === 1 && l < levels - 1) { const a2 = a + Math.PI / ribs; b.part('87747', SPIKE, [cx + Math.sin(a2) * (R + 2), -36 - l * 24, cz + Math.cos(a2) * (R + 2)], mul(ry(a2), rx(-35 * D))); }
    }
  }
  b.part('60474', CAC, [cx, -24 - levels * 24 + 16, cz]); b.part('4032a', CAC, [cx, -24 - levels * 24 + 8, cz]);
  return [cx, -24 - levels * 24, cz];
}
const t1 = cactus(55, 10, 9);
// velký lotosový květ na vrcholu
const fc = add(t1, [0, 14, 0]);
for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.part('61678', PINK, add(fc, [Math.sin(a) * 40, -6, Math.cos(a) * 40]), mul(ry(a), rz(Math.PI), rx(-28 * D))); }
for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + 0.3; b.part('61678', DPINK, add(fc, [Math.sin(a) * 26, -14, Math.cos(a) * 26]), mul(ry(a), rz(Math.PI), rx(-50 * D))); }
b.part('87081', YEL, add(fc, [0, -24, 0])); b.part('3941', YEL, add(fc, [0, -48, 0])); b.part('6141', LIME, add(fc, [0, -52, 0]));
// malý zakulacený kaktus s růžičkami
const t2 = cactus(-60, -20, 5, 46, 9);
[[0, 0], [22, 10], [-20, 12], [8, -22], [-12, -18]].forEach(([dx, dz], k) => b.part('95829', k % 2 ? DPINK : PINK, add(t2, [dx, 8 - (k ? 0 : 10), dz])));
b.save('cactus.ldr'); console.log('cactus', b.n);
