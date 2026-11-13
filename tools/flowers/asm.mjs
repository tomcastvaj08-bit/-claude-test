// Pomůcky pro skládání podsestav: Asm = seznam dílků v místních souřadnicích, emit s globální transformací.
import { mul, apply, add, sub, scl, norm, cross, basis, alignY } from './lib.mjs';
export const T = (M, p) => ({ M, p });
export const compose = (A, B) => ({ M: mul(A.M, B.M), p: add(A.p, apply(A.M, B.p)) }); // A ∘ B
export const ID = { M: [1, 0, 0, 0, 1, 0, 0, 0, 1], p: [0, 0, 0] };
export class Asm {
  constructor() { this.items = []; }
  part(id, col, p = [0, 0, 0], M = [1, 0, 0, 0, 1, 0, 0, 0, 1]) { this.items.push({ id, col, p, M }); return this; }
  add(sub, tr) { for (const it of sub.items) { const c = compose(tr, { M: it.M, p: it.p }); this.items.push({ id: it.id, col: it.col, p: c.p, M: c.M }); } return this; }
  emit(b) { for (const it of this.items) b.part(it.id, it.col, it.p, it.M); }
}
// rámec: místní osa z podél směru d, „nahoru“ (místní -y) co nejblíž k u
export function frameZ(d, u = [0, -1, 0]) {
  const ez = norm(d); if (Math.abs(ez[0] * u[0] + ez[1] * u[1] + ez[2] * u[2]) > 0.98) u = [0, 0, -1];
  let ey = scl(u, -1); ey = norm(sub(ey, scl(ez, ey[0] * ez[0] + ey[1] * ez[1] + ey[2] * ez[2])));
  const ex = cross(ey, ez); return basis(ex, ey, ez);
}
// body podél Catmull-Rom křivky s krokem po délce
export function along(P, n = 16) {
  const out = [];
  for (let i = 0; i + 1 < P.length; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
  out.push(P[P.length - 1]);
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(...sub(out[i], out[i - 1])));
  return { pts: out, L, total: L[L.length - 1], at(s) { s = Math.max(0, Math.min(this.total, s)); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return { p: add(out[i - 1], scl(sub(out[i], out[i - 1]), t)), d: norm(sub(out[i], out[i - 1])) }; } };
}
