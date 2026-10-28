// K08 · Konec: shrnutí čtyř bodů → odjezd na celou mapu → závěrečná karta „Díky. efektive.cz“.
(() => {
  const { T, AT, cam, node } = ENGINE;
  const { A, CH, flyTo, OV } = L;
  const o = A.k08, X = v => o.x + v, Y = v => o.y + v, C = n => 'k08.' + n;

  W.card({ x: X(0), y: Y(-1700), w: 1900, in: CH('k08') + 1.0, kicker: 'Konec', kc: 'g', title: 'Celý postup <span class="gr">v kostce</span>' });
  [['ostrý', 'ostré reference'], ['realistickej', 'realistický sheet'], ['hlava', 'jen hlava jako reference'], ['úprava', 'prompt: je to úprava']].forEach(([w, t], i) =>
    W.callout({ x: X(-1000 + (i % 2) * 2000), y: Y(-450 + Math.floor(i / 2) * 650), z: 40, w: 1900, in: AT(C('recap'), w), c: i === 3 ? 'g' : '', lab: '0' + (i + 1), txt: `<b>${t}</b>` }));

  node({ id: 'endcard', x: OV.x, y: OV.y, z: 9000, w: 52000, h: 15600, in: T(C('end')) - .4, anim: 'fade', dur: 1.2, dof: false,
    html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1500px">
      <div style="font:700 6200px var(--sans);letter-spacing:-.06em;line-height:.9;color:var(--ink)">Díky<span style="color:var(--blue)">.</span></div>
      <div style="background:#fff;border:50px solid var(--line);border-radius:5000px;padding:850px 2600px;font:700 2900px var(--sans);letter-spacing:-.04em;color:var(--blue);box-shadow:0 600px 1200px rgba(10,13,20,.12)">efektive<span style="color:var(--green)">.cz</span></div></div>` });

  flyTo('k08', { x: X(0), y: Y(-1600), d: 2600 });
  cam({ t: T(C('recap')) - .3, dur: 1.4, x: X(0), y: Y(-250), d: 3600, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  cam({ t: T(C('zoomout')) - .2, dur: 5.0, x: OV.x, y: OV.y, d: OV.d * 1.08, ease: 'smooth', rx: 12, ry: -3, push: .02 });
})();
