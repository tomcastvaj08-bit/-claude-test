import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf } from './lib.mjs';
// Kvetoucí kaktus: světle modrý oválný květináč, dva žebrované kaktusy s bodlinkami, velký růžový květ a poupata
const b = new Build('cactus'); setSeed(9);
const POT = 212, SOIL = 70, CAC = 378, SPIKE = 19, PINK = 29, MAG = 26;
// oválný květináč: rohy 4x4 rozdělené rovnými stěnami 1x4
for (let l = 0; l < 4; l++) {
  b.part('2577', POT, [40, 24 * l, 0], ry(0)); b.part('2577', POT, [40, 24 * l, 0], ry(-Math.PI / 2));
  b.part('2577', POT, [-40, 24 * l, 0], ry(Math.PI)); b.part('2577', POT, [-40, 24 * l, 0], ry(Math.PI / 2));
  b.part('3010', POT, [0, 24 * l, 70]); b.part('3010', POT, [0, 24 * l, -70]);
}
for (const x of [-40, 40]) b.part('60474', SOIL, [x, -2, 0]);
b.part('3020', SOIL, [0, -2, 0], ry(Math.PI / 2));
for (let k = 0; k < 10; k++) b.part('6141', 28, [(rnd() - 0.5) * 140, -6, (rnd() - 0.5) * 70]);
// kaktus: kulaté kostky 4x4 + bodlinky (kulaté destičky 1x1 po obvodu)
function cactus(x, z, levels, top) {
  for (let l = 0; l < levels; l++) {
    b.part(l === levels - 1 ? '30367a' : '87081', CAC, [x, -24 - l * 24, z].map((v, i) => (i === 1 ? v : v)), I());
    if (l < levels - 1) for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + (l % 2) * 0.45; b.part('4589', 15, [x + Math.sin(a) * 30, -30 - l * 24, z + Math.cos(a) * 30], alignY([Math.sin(a), 0.5, Math.cos(a)])); }
  }
  return [x, -24 - (levels - 1) * 24 - 4, z];
}
function I() { return [1, 0, 0, 0, 1, 0, 0, 0, 1]; }
// válec 4x4 + horní kopule 2x2 jako zakulacení
const t1 = cactus(40, 0, 9), t2 = cactus(-44, 6, 5);
// velký květ: dvě vrstvy lístků + střed
const fc = add(t1, [0, -2, 0]);
for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; b.part('11477', k % 2 ? MAG : PINK, add(fc, [Math.sin(a) * 22, -6, Math.cos(a) * 22]), mul(ry(a), rx((-90 - 58) * D))); }
for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; b.part('11477', PINK, add(fc, [Math.sin(a) * 12, -16, Math.cos(a) * 12]), mul(ry(a), rx((-90 - 30) * D))); }
b.part('98262', 14, add(fc, [0, -18, 0]));
// poupata na malém kaktusu
[[0, 0], [16, 10], [-14, 8]].forEach(([dx, dz], k) => { b.part('3062b', k ? MAG : PINK, add(t2, [dx, 8 - k * 6, dz])); b.part('24866', PINK, add(t2, [dx, -16 - k * 6 + 8, dz])); });
b.save('cactus.ldr'); console.log('cactus', b.n);
