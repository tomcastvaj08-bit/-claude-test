// K14 · Konec: shrnutí (prompt + 2 skilly → šablona) → odjezd na celou mapu → závěrečná karta „Díky. efektive.cz“.
(() => {
  const { T, AT, cam, node, link } = ENGINE;
  const { A, CH, flyTo, OV } = L;
  const { pill } = U;
  const o = A.k14, X = v => o.x + v, Y = v => o.y + v, C = n => 'k14.' + n;

  W.card({ x: X(0), y: Y(-1700), w: 1900, in: CH('k14') + 1.0, kicker: 'Konec', kc: 'g', title: 'Z jednoho promptu <span class="gr">šablona</span>' });
  const R = C('recap');
  [['promptu', '1 prompt', -1500], ['dvou', '2 skilly', 0], ['šablona', 'šablona na denní AI tipy', 1500]].forEach(([w, t, x], i) => {
    W.html({ x: X(x), y: Y(-600), z: 40, w: 1350, h: 200, in: AT(R, w), anim: 'pop', html: pill(t, i === 2 ? 'g' : 'b', 56) });
    if (i) link({ a: { x: X(x - 1500 + 500), y: Y(-600) }, b: { x: X(x - 520), y: Y(-600) }, in: AT(R, w) - .2, dur: .5, z: 10, bend: 0 });
  });
  W.html({ x: X(0), y: Y(-250), z: 60, w: 2200, h: 170, in: AT(C('zoomout'), 'scénáři'), anim: 'rise', html: pill('další díl = scénář + hlas', '', 50) });

  node({ id: 'endcard', x: OV.x, y: OV.y, z: 9000, w: 52000, h: 15600, in: T(C('end')) - .4, anim: 'fade', dur: 1.2, dof: false,
    html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1500px">
      <div style="font:700 6200px var(--sans);letter-spacing:-.06em;line-height:.9;color:var(--ink)">Díky<span style="color:var(--blue)">.</span></div>
      <div style="background:#fff;border:50px solid var(--line);border-radius:5000px;padding:850px 2600px;font:700 2900px var(--sans);letter-spacing:-.04em;color:var(--blue);box-shadow:0 600px 1200px rgba(10,13,20,.12)">efektive<span style="color:var(--green)">.cz</span></div></div>` });

  flyTo('k14', { x: X(0), y: Y(-1500), d: 2600 });
  cam({ t: T(R) - .3, dur: 1.4, x: X(0), y: Y(-750), d: 3100, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  cam({ t: T(C('zoomout')) + .6, dur: 3.8, x: OV.x, y: OV.y, d: OV.d * 1.08, ease: 'smooth', rx: 12, ry: -3, push: .02 });
})();
