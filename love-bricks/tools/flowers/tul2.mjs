// Tulipány 11501 – nová stavba hlav podle produktových fotek: hladké okvětní lístky (lbtul / lbtulo, petals.py),
// dole u stonku zavřené, nahoře lehce rozevřené; vnitřek, stonky, listy a poupata z dílků podle návodu.
import { Build, rx, ry, rz, mul, apply, add, sub, scl, norm, cross, basis } from './lib.mjs';
import { Asm } from './asm.mjs';
import { tulipStem, straightStem, budStem, longLeaf, shortLeaf, CLIP } from './tul11501.mjs';
const E = (k, d) => +(process.env[k] ?? d);
const Y = [0, 1, 0], I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
const S = (k) => [k, 0, 0, 0, k, 0, 0, 0, k];
const BASE = -50;                                   // dno vajíčka nad koncem stonku

function neck(H) { // krk pod hlavou podle návodu: černá osa 2, zelená spojka os
  H.part('32062', 0, [0, 0, 0], rz(Math.PI / 2));
  H.part('42195', 2, [0, -30, 0], rx(Math.PI / 2));
}
// zavřený tulipán: 3 vnější lístky (vrstvené), 3 vnitřní pootočené o 60°, uprostřed tyčinky
// open = rozevření vršku [rad] (dole zůstává zavřeno), ajar = navíc pro jednotlivé lístky, s = velikost
export function closedHead({ col, s = E('HS', 1.25), open = 0.05, ajar = [0, 0, 0], yaw = 0, inner = null, stamen = true }) {
  const H = new Asm(); neck(H);
  const ic = inner ?? col;
  for (let k = 0; k < 3; k++) {                                         // vnitřní lístky
    const a = yaw + Math.PI / 3 + k * 2 * Math.PI / 3;
    H.part('lbtul', ic, [0, BASE - 2, 0], mul(ry(a), rx(open * 0.6), S(s * 0.86)));
  }
  if (stamen) { H.part('11610', 0, [0, BASE - 20 * s, 0]); H.part('68211', 19, [0, BASE - 22 * s, 0]); H.part('68211', 19, [0, BASE - 96 * s, 0], ry(1)); H.part('11610', 0, [0, BASE - 70 * s, 0]); }
  const lay = [1, 0.972, 0.944];
  for (let k = 0; k < 3; k++) {                                         // vnější lístky
    const a = yaw + k * 2 * Math.PI / 3;
    H.part('lbtul', col, [0, BASE, 0], mul(ry(a), rx(open + ajar[k]), S(s * lay[k])));
  }
  return H;
}
// oranžový tulipán: 6 dlouhých špičatých lístků do hvězdy (3 vnitřní strmější, 3 vnější rozevřené), střed s tyčinkami
export function starHead({ s = E('HS', 1.25), lean1 = E('L1', 0.5), lean2 = E('L2', 1.0), col = 25 } = {}) {
  const H = new Asm(); neck(H);
  const c = BASE + 8;
  H.part('15469', 191, [0, c - 4, 0]); H.part('18674', 191, [0, c - 8, 0]); H.part('3262', 191, [0, c + 16, 0]); // oranžový střed
  H.part('68211', 19, [0, c - 14, 0]); H.part('24855', 15, [0, c - 16, 0]);
  const petal = (a, lean, r0, y0) => {
    const w = [Math.cos(a), 0, Math.sin(a)];
    const up = norm(add(scl(w, Math.sin(lean)), [0, -Math.cos(lean), 0]));
    const zz = norm(add(scl(w, Math.cos(lean)), [0, Math.sin(lean), 0]));
    const M = mul(basis(cross(scl(up, -1), zz), scl(up, -1), zz), S(s));
    H.part('lbtulo', col, add(scl(w, r0 * s), [0, y0, 0]), M);
  };
  for (let k = 0; k < 3; k++) petal(k * 2 * Math.PI / 3, lean1, 12, c + 14);
  for (let k = 0; k < 3; k++) petal(k * 2 * Math.PI / 3 + Math.PI / 3, lean2, 16, c + 18);
  return H;
}
const O = E('OPEN', 0.25);   // rozevření vršku – jako na obalu: dole zavřené, nahoře vidět dovnitř na tyčinky
const HEADS = {
  red: () => closedHead({ col: 4, open: O }),
  redAjar: () => closedHead({ col: 4, open: O + 0.04, ajar: [0.45, 0, 0], yaw: 0.6 }),
  yellow: () => closedHead({ col: 14, open: O + 0.02, ajar: [0, 0.25, 0] }),
  yellowOpen: () => closedHead({ col: 14, open: 0.5, ajar: [0.15, 0, 0.15], yaw: 0.5 }),
  purple: () => closedHead({ col: 85, open: O }),
  pink: () => closedHead({ col: 29, s: E('HS', 1.25) * 1.08, open: O - 0.04, yaw: 0.3 }),
  orange: () => starHead(),
};
export { HEADS };

// ===== kytice: rozmístění podle produktové fotky; všechny stonky se kříží v jednom bodě v nádobě =====
export function bouquet() {
  const X = E('SX', 1.2);
  const heads = [
    // [hlava, cíl x, y, z, ohyb, náklon k divákovi]  (divák na -z, y dolů) – podle produktové fotky
    ['pink', -120, -820, 95, null, 0], ['pink', -10, -835, 115, null, 0], ['yellow', 90, -805, 100, null, 0], ['pink', 185, -815, 80, null, 0],
    ['orange', -175, -745, 25, null, 0.25], ['purple', 40, -770, 0, null, 0.1], ['red', 140, -755, 0, null, 0.1], ['yellow', 225, -715, -35, null, 0.15],
    ['redAjar', -225, -690, -100, -1, 0.2], ['yellowOpen', -100, -665, -140, null, 0.35], ['orange', 10, -655, -165, null, 0.55], ['purple', 125, -690, -120, 1, 0.2],
    ['bud', -55, -760, 135, 'bud', 0], ['bud', 55, -745, 145, 'bud', 0],
  ].map(([k, x, y, z, b, t]) => [k, x * X, y > -790 ? (y > -740 ? y : y + 18) : y + 45, z, b, t]);
  const B = new Asm(), LEN = 640, placed = [];
  const PK = [0, E('PY', -70), 0];                                       // společný bod, kde se stonky kříží
  for (const [kind, hx, hy, hz, bend, tilt] of heads) {
    const target = [hx, hy, hz], curved = bend === -1 || bend === 1;
    const frame = (dir) => { const up = scl(dir, -1), w = curved ? [bend, 0, -0.3] : [1, 0, 0];
      const side = norm(sub(w, scl(up, dot(w, up)))); return basis(side, up, norm(cross(side, up))); };
    let dir = norm(sub(target, PK)), M = frame(dir), p = target;
    if (curved) for (let it = 0; it < 5; it++) { p = sub(target, apply(M, [23, -57, 0])); dir = norm(sub(p, PK)); M = frame(dir); }
    const head = () => { if (!tilt) return HEADS[kind](); const T = new Asm(); const v = norm(apply(M.map((x, i) => x), [0, 0, 0])); // náklon hlavy k divákovi
      const toV = [-M[2], -M[5], -M[8]]; const ax = norm(cross([0, -1, 0], [0, 0, 0].map((_, i) => 0))); T.add(HEADS[kind](), { M: rx(tilt * (dot(toV, [0, 0, -1]) >= 0 ? 1 : -1)), p: [0, 0, 0] }); return T; };
    const stem = kind === 'bud' ? budStem({ side: hx < 0 ? 0.5 : 2.6 }) : curved ? tulipStem(head(), { len: LEN }) : straightStem(head(), { len: LEN });
    B.add(stem, { M, p }); placed.push({ kind, full: kind !== 'bud', M, p });
  }
  // dlouhé listy: klip nízko na krajním stonku, list stoupá za hlavami, špička vykukuje do strany
  for (const [si, yl, tw, lean] of [[4, 250, -0.6, -0.5], [0, 280, -0.35, -0.25], [3, 280, 0.35, 0.3], [7, 250, 0.6, 0.55]]) {
    const st = placed[si], at = add(st.p, apply(st.M, [0, yl, 0]));
    const up = norm([Math.sin(lean), -Math.cos(lean), 0]), out = norm([-tw, 0, -1]);
    const ez = scl(up, -1), ey = scl(norm(sub(out, scl(up, dot(out, up)))), -1), ex = cross(ey, ez);
    const Ml = basis(ex, ey, ez);
    B.add(longLeaf(), { M: Ml, p: sub(add(at, [0, 0, 70]), apply(Ml, [0, 0, 140])) }); // za stonky
  }
  // krátké listy: klip na krajním předním stonku, oblouk přes okraj květináče, list visí podél stěny
  const RIM = E('RIM', -300), POTR = E('POTR', 160);
  const atY = (st, y) => { const d = norm(apply(st.M, [0, -1, 0])), t = (y - st.p[1]) / d[1]; return add(st.p, scl(d, t)); };
  const used = new Set();
  for (const az of [20, 65, 115, 160]) {
    const a = az * Math.PI / 180, out = [Math.cos(a), 0, -Math.sin(a)];
    let bi = -1, bp = -1e9;
    placed.forEach((st, k) => { if (used.has(k) || !st.full) return; const q = atY(st, RIM - 120); const pr = dot(q, out); if (pr > bp) { bp = pr; bi = k; } });
    used.add(bi);
    const ez = [0, 1, 0], ey = scl(out, -1), ex = cross(ey, ez);
    let best = null, Ml;
    search: for (const tilt of [-0.15, -0.3, -0.45, -0.6]) for (let h = 40; h <= 320; h += 10) {
      Ml = mul(basis(ex, ey, ez), rx(tilt));
      const q = atY(placed[bi], RIM - h), p0 = sub(q, apply(Ml, CLIP));
      const j = p0, tip = add(p0, apply(Ml, [0, 0, 170]));
      const t = (RIM - j[1]) / (tip[1] - j[1]); const at = add(j, scl(sub(tip, j), Math.max(0, Math.min(1, t))));
      if (j[1] < RIM - 10 && Math.hypot(j[0], j[2]) > POTR + 18 && Math.hypot(at[0], at[2]) > POTR + 18) { best = p0; break search; }
    }
    if (best) B.add(shortLeaf(), { M: Ml, p: best });
  }
  return B;
}

const sub_ = process.env.SUB;
const b = new Build(sub_ ? 'sub' : 'tulips11501'), A = new Asm();
if (!sub_) A.add(bouquet(), { M: I, p: [0, 0, 0] });
else if (HEADS[sub_]) A.add(HEADS[sub_](), { M: I, p: [0, 0, 0] });
else if (sub_ === 'petal1') A.part('lbtul', 4, [0, 0, 0]);
else if (sub_ === 'petal2') A.part('lbtulo', 25, [0, 0, 0]);
A.emit(b); b.save(sub_ ? 'sub.ldr' : 'tulips11501.ldr'); console.log(sub_ || 'tulips11501', 'parts', b.n);
