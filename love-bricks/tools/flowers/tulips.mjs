import { Build, D, rx, ry, rz, mul, face, alignY, bezier, add, sub, scl, norm, rnd, setSeed, leaf, pot8, cup, tulip } from './lib.mjs';
// Kytice tulipánů: 12 tulipánů v barvách jara ve skleněné váze
const b = new Build('tulips'); setSeed(11);
const COLS = [29, 26, 4, 14, 25, 85, 5, 191, 324, 29, 14, 4];
pot8(b, 47, 6, 0); b.part('60474', 47, [0, 144, 0]); b.part('60474', 47, [0, 152, 0]);
// tulipány: stonky z dna vázy do vějíře
const heads = [];
for (let i = 0; i < 12; i++) {
  const ring = i < 4 ? 0 : 1, a = (i < 4 ? i / 4 : (i - 4) / 8) * Math.PI * 2 + (ring ? 0.3 : 0);
  const R = ring ? 95 + rnd() * 25 : 35 + rnd() * 15, H = ring ? 250 + rnd() * 50 : 320 + rnd() * 30;
  const top = [Math.sin(a) * R, -H, Math.cos(a) * R];
  const pts = b.stem(bezier([Math.sin(a) * 10, 130, Math.cos(a) * 10], [Math.sin(a) * 14, -60, Math.cos(a) * 14], scl(top, 0.6), top), 10);
  const up = norm(sub(pts[pts.length - 1], pts[pts.length - 2]));
  const base = pts[pts.length - 1];
  const col = COLS[i];
  tulip(b, col, add(base, scl(up, 24)), up, rnd() * 6);
  if (i % 3 === 0) { const lp = pts[Math.floor(pts.length * 0.45)]; const out = norm([Math.sin(a), 0, Math.cos(a)]); leaf(b, 2, add(lp, scl(out, 30)), mul(ry(a), rx(70 * D), rz(0.3)), { size: 6 }); }
}
b.save('tulips.ldr'); console.log('tulips', b.n);
