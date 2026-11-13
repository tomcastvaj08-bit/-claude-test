// Kytice květin 10280 (přesná stavba z LDraw OMR, autor Orion Pobursky): stonky v originálu leží vedle sebe,
// tady je sesadíme k sobě a vějířovitě nakloníme do vázy. Dílky ani květy se nemění.
import fs from 'fs';
const [src, dst] = process.argv.slice(2);
const text = fs.readFileSync(src, 'utf8').split(/\r?\n/);
let inMain = false, mainDone = false;
const out = [];
const mulM = (A, B) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return r; };
function rodrigues(k, t) { const [x, y, z] = k, c = Math.cos(t), s = Math.sin(t), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
for (const line of text) {
  if (/^0\s+FILE\s/.test(line)) { if (inMain) mainDone = true; inMain = !mainDone; }
  const t = line.trim().split(/\s+/);
  if (inMain && t[0] === '1') {
    const x = +t[2], y = +t[3], z = +t[4], M = t.slice(5, 14).map(Number);
    const d = Math.hypot(x, z), o = d > 1e-6 ? [x / d, 0, z / d] : [0, 0, 1];
    // osa náklonu: nahoru (-Y) × ven; úhel podle vzdálenosti od středu
    const up = [0, -1, 0], k = [up[1] * o[2] - up[2] * o[1], up[2] * o[0] - up[0] * o[2], up[0] * o[1] - up[1] * o[0]];
    const kl = Math.hypot(...k) || 1, ang = Math.min(0.3, d / 900);
    const R = rodrigues(k.map((v) => v / kl), ang);
    const M2 = mulM(R, M), f = (v) => +v.toFixed(4);
    out.push(['1', t[1], f(x * 0.08), f(y), f(z * 0.08), ...M2.map(f), ...t.slice(14)].join(' '));
  } else out.push(line);
}
fs.writeFileSync(dst, out.join('\n'));
console.log('ok');
