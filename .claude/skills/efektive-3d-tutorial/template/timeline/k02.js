// K02 · Outro (poslední kapitola): shrnutí → odjezd na celou mapu (všechny štítky svítí) → obří závěrečná karta.
// V poslední kapitole drž cue "zoomout" a "end" – bed.py na ně dává závěrečný swell a boom.
(() => {
  const { T, AT, cam, node } = ENGINE;
  const { A, CH, flyTo, OV } = L;
  const id = 'k02', o = A[id], X = v => o.x + v, Y = v => o.y + v, C = n => id + '.' + n;

  W.card({ x: X(-1000), y: Y(-1700), w: 1900, in: CH(id) + 1.0, kicker: 'Shrnutí', title: 'Pořád stejná <span class="gr">kostra.</span>' });
  ['scénář', 'hlas', 'timeline', 'render'].forEach((w, i) =>
    W.callout({ x: X(-1000 + (i % 2) * 2000), y: Y(-450 + Math.floor(i / 2) * 700), z: 40, w: 1900, in: AT(C('recap'), w), c: i === 3 ? 'g' : '', lab: `0${i + 1}`, txt: w }));

  // závěrečná karta: obří, aby byla čitelná i z přehledu celé mapy
  node({ id: 'endcard', x: OV.x, y: OV.y, z: 9000, w: 52000, h: 15600, in: T(C('end')) - .4, anim: 'fade', dur: 1.2, dof: false,
    html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1500px">
      <div style="font:700 6200px var(--sans);letter-spacing:-.06em;line-height:.9;color:var(--ink)">Díky<span style="color:var(--blue)">.</span></div>
      <div style="background:#fff;border:50px solid var(--line);border-radius:5000px;padding:850px 2600px;font:700 2900px var(--sans);letter-spacing:-.04em;color:var(--blue);box-shadow:0 600px 1200px rgba(10,13,20,.12)">${(window.CFG || {}).brand || 'efektive.cz'}</div></div>` });

  flyTo(id, { x: X(-1000), y: Y(-1650), d: 2600 });
  cam({ t: T(C('recap')) - .3, dur: 1.4, x: X(0), y: Y(-250), d: 3500, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  cam({ t: T(C('zoomout')) - .2, dur: 5.5, x: OV.x, y: OV.y, d: OV.d * 1.08, ease: 'smooth', rx: 12, ry: -3, push: .02 });
})();
