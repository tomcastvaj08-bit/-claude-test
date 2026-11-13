import { Build, D, rx, ry, rz, mul, alignY, add, sub, scl, norm, rnd, setSeed, basis, cross } from './lib.mjs';
// rovné žebro (dlaždice 1x6): dlouhá osa svisle, hladká strana ven
const ribM = (a) => { const o = [Math.sin(a), 0, Math.cos(a)], ex = [0, 1, 0], ey = scl(o, -1); return basis(ex, ey, cross(ex, ey)); };
// Kvetoucí kaktus 11509: světle modrý zaoblený květináč s hladkým okrajem, dva kaktusy s hladkými zaoblenými žebry
// (světle šalvějová + tmavě zelená), béžové bodliny ve shlucích, nahoře lotos s ostrými růžovými lístky a žlutým středem,
// malý soudkovitý kaktus s růžovými růžičkami v zelených kalíšcích. Líc = LDraw -z.
const b = new Build('cactus'); setSeed(9);
const POT = 212, SOIL = 70, CAC = 378, RIB = 288, SPIKE = 19, PINK = 29, DPINK = 5, MAG = 26, YEL = 14, LIME = 27;
// květináč: zaoblené rohy 4x4 + rovné stěny, 3 vrstvy; nahoře hladký okraj z dlaždic
for (let l = 0; l < 3; l++) {
  const y = 24 * l;
  [[70, 40, -Math.PI / 2], [70, -40, 0], [-70, -40, Math.PI / 2], [-70, 40, Math.PI]].forEach(([x, z, a]) => b.part('2577', POT, [x, y, z], ry(a)));
  b.part('3009', POT, [10, y, 110]); b.part('3009', POT, [10, y, -110]); b.part('3005', POT, [-60, y, 110]); b.part('3005', POT, [-60, y, -110]);
  b.part('3010', POT, [140, y, 0], ry(Math.PI / 2)); b.part('3010', POT, [-140, y, 0], ry(Math.PI / 2));
}
// hladký okraj: dlaždice po obvodu
for (let x = -60; x <= 60; x += 40) { b.part('3069b', POT, [x, -8, 110]); b.part('3069b', POT, [x, -8, -110]); }
for (let z = -20; z <= 20; z += 40) { b.part('3069b', POT, [140, -8, z], ry(Math.PI / 2)); b.part('3069b', POT, [-140, -8, z], ry(Math.PI / 2)); }
// hlína s oblázky
for (const [x, z] of [[-70, -40], [70, -40], [-70, 40], [70, 40], [0, 0], [0, -50], [0, 50]]) b.part('60474', SOIL, [x, -4, z]);
for (let k = 0; k < 26; k++) b.part(k % 3 ? '98138' : '6141', k % 2 ? SOIL : 28, [(rnd() - 0.5) * 240, -12, (rnd() - 0.5) * 170]);
// kaktus s hladkými žebry: prstenec svislých oblých dílů 4x1 (oblá strana ven), řady nad sebou
// kaktus: hladká oblá žebra – dole oblý díl rozšiřující se nahoru, uprostřed rovné dlaždice 1x6, nahoře oblý díl zužující se (soudek)
function cactus(cx, cz, mid, R, n) {
  const yb = -40;                                  // spodní oblý díl (střed), délka 80
  const ring = (y, M) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.part('61678', CAC, [cx + Math.sin(a) * R, y, cz + Math.cos(a) * R], M(a)); } };
  ring(yb, (a) => mul(ry(a), rz(Math.PI), rx(-90 * D)));
  for (let m = 0; m < mid; m++) for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; b.part('6636', CAC, [cx + Math.sin(a) * (R + 4), yb - 100 - m * 120, cz + Math.cos(a) * (R + 4)], ribM(a)); }
  const yt = yb - 80 - mid * 120;
  ring(yt, (a) => mul(ry(a), rx(-90 * D)));
  for (let y = 0; y > yt - 40; y -= 24) b.part('3941', RIB, [cx, y - 24, cz]);
  return [cx, yt - 40, cz];
}
// bodliny: béžové shluky zahnutých drápků na žebrech
// bodliny: krátké béžové háčky ve žlábcích mezi žebry
function spikes(cx, cz, top, R, n, phase = 0) {
  for (let y = -30, r = 0; y > top + 30; y -= 48, r++) for (let k = 0; k < n; k++) {
    if ((k + r) % 2) continue;
    const a = ((k + 0.5) / n) * Math.PI * 2 + phase;
    b.part('87747', SPIKE, [cx + Math.sin(a) * (R - 2), y, cz + Math.cos(a) * (R - 2)], mul(ry(a), rx(-80 * D)));
  }
}
const tc = cactus(50, 10, 1, 40, 11);
spikes(50, 10, tc[1], 40, 11);
// lotos: vnější věnec ostrých lístků (klíny 2x4 hladkou stranou nahoru), vnitřní tmavší, žlutý kulatý střed
const fc = add(tc, [0, 4, 0]);
for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; const M = mul(ry(a + Math.PI), rx(-50 * D)); b.part('41769a', PINK, add(fc, [Math.sin(a) * 34, -30, Math.cos(a) * 34]), M); }
for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + 0.4; const M = mul(ry(a + Math.PI), rx(-66 * D)); b.part('24307', MAG, add(fc, [Math.sin(a) * 20, -26, Math.cos(a) * 20]), M); }
b.part('30367a', YEL, add(fc, [0, -30, 0])); b.part('6141', LIME, add(fc, [0, -58, 0]));
// malý soudkovitý kaktus s růžičkami v zelených kalíšcích
const t2 = cactus(-66, -14, 0, 40, 11);
spikes(-66, -14, t2[1], 40, 11, 0.3);
[[0, 0, 0], [24, 8, 14], [-22, 6, 16], [10, 4, -24], [-14, 4, -22]].forEach(([dx, dz, dy], k) => {
  const p = add(t2, [dx, dy + 34, dz]);
  for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2; b.part('11477', CAC, add(p, [Math.sin(a) * 9, 4, Math.cos(a) * 9]), mul(ry(a), rz(Math.PI), rx(-60 * D))); }
  b.part('95829', k % 2 ? DPINK : MAG, add(p, [0, -6, 0]));
});
b.save('cactus.ldr'); console.log('cactus', b.n);
