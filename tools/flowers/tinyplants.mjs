import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf } from './lib.mjs';
// Malé rostlinky 10329: devět terakotových květináčků s kaktusy, sukulenty a kvítky
const b = new Build('tinyplants'); setSeed(5);
const POT = 484, SOIL = 308;
function pot(x, z, h = 2) {
  for (let l = 0; l < h; l++) b.part('3941', POT, [x, 24 * l, z]);
  b.part('4740', POT, [x, -8, z], rx(Math.PI)); b.part('4032a', SOIL, [x, -8, z]);
  return [x, -16, z];
}
const spots = [[-100, -60], [0, -80], [100, -60], [-110, 40], [0, 20], [110, 40], [-60, 130], [60, 130], [0, -180]];
const plants = [
  (p) => { for (let k = 0; k < 5; k++) b.part('3062b', 378, add(p, [0, -24 * (k + 1) + 4, 0])); b.part('24866', 29, add(p, [0, -104, 0])); b.part('3062b', 378, add(p, [16, -30, 0])); }, // sloupový kaktus s kvítkem
  (p) => { for (let k = 0; k < 4; k++) b.part('32607', k % 2 ? 378 : 2, add(p, [0, -4 - k * 3, 0]), ry(k * 90 * D)); b.part('6141', 29, add(p, [0, -16, 0])); }, // sukulent
  (p) => { const s = b.stem([add(p, [0, -4, 0]), add(p, [6, -120, 0])], 2); b.part('98262', 4, add(s[s.length - 1], [0, -8, 0])); b.part('32607', 2, add(p, [0, -8, 0])); b.part('32607', 2, add(p, [0, -50, 0]), ry(2)); }, // červený kvítek
  (p) => { b.part('3941', 2, add(p, [0, -20, 0])); b.part('30367a', 2, add(p, [0, -44, 0])); b.part('24866', 191, add(p, [0, -70, 0])); }, // kulatý kaktus
  (p) => { b.part('6255', 2, add(p, [0, -4, 0])); b.part('5904', 85, add(p, [0, -34, 0])); }, // fialový kvítek s listy
  (p) => { for (let k = 0; k < 3; k++) b.part('3062b', 27, add(p, [-10 + k * 10, -24, -6 + (k % 2) * 12])); b.part('3062b', 27, add(p, [-10, -48, -6])); b.part('6141', 4, add(p, [-10, -52, -6])); b.part('6141', 4, add(p, [0, -28, 6])); }, // láčkovka
  (p) => { b.part('6901', 323, add(p, [0, -6, 0])); b.part('6901', 323, add(p, [0, -14, 0]), ry(0.4)); b.part('6141', 323, add(p, [0, -18, 0])); }, // modrozelený sukulent
  (p) => { for (let k = 0; k < 3; k++) b.part('15279', 10, add(p, [(k - 1) * 8, -4, 0]), ry(k * 2)); }, // aloe
  (p) => { b.part('6255', 288, add(p, [0, -4, 0]), ry(1)); const s = b.stem([add(p, [0, -4, 0]), add(p, [-4, -100, 0])], 288); b.part('96483', 26, add(s[s.length - 1], [0, -6, 0])); } // tmavá rostlinka s purpurovým kvítkem
];
spots.forEach(([x, z], i) => plants[i](pot(x, z, i % 3 === 0 ? 2 : 1)));
b.save('tinyplants.ldr'); console.log('tinyplants', b.n);
