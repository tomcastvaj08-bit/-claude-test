// K18 · Co jsem dělal já + finální odjezd na celou mapu a závěrečná karta.
(() => {
  const { T, AT, cam, node, clamp, ease } = ENGINE;
  const { A, CH, flyTo, OV } = L;
  const o = A.k18, X = v => o.x + v, Y = v => o.y + v;
  const C = n => 'k18.' + n;

  W.card({ x: X(-1500), y: Y(-1700), w: 1900, in: CH('k18') + 1.0, kicker: 'Shrnutí', title: 'Co jsem <span class="gr">dělal já</span>' });
  const me = [['me1', 'Psal a diktoval zpětnou vazbu', '„dej do toho 110 %“ · „takhle ne, vrať to“'], ['me2', 'Rozhodoval', 'kafe · schvalování verzí · ne ASMR · hlas Aura'],
    ['me3', 'Kredity, cover, zveřejnění', 'dobil Higgsfield, nahrál cover, publikoval'], ['me4', 'Všechno ostatní', 'prompty, generování, střih, zvuk, render, popisek, cover = AI']];
  me.forEach(([cue, h, s], i) => W.callout({ x: X(-1500 + (i % 2) * 2000), y: Y(-450 + Math.floor(i / 2) * 700), z: 40, w: 1900, in: T(C(cue)), c: i === 3 ? 'g' : '', lab: h, txt: s }));

  // závěrečná karta: obří, aby byla čitelná i z přehledu celé mapy
  const tEnd = T(C('end'));
  node({ id: 'endcard', x: OV.x, y: OV.y, z: 9000, w: 52000, h: 15600, in: tEnd - .4, anim: 'fade', dur: 1.2, dof: false,
    html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1500px">
      <div style="font:700 6200px var(--sans);letter-spacing:-.06em;line-height:.9;color:var(--ink)">Díky<span style="color:var(--blue)">.</span></div>
      <div style="background:#fff;border:50px solid var(--line);border-radius:5000px;padding:850px 2600px;font:700 2900px var(--sans);letter-spacing:-.04em;color:var(--blue);box-shadow:0 600px 1200px rgba(10,13,20,.12)">efektive<span style="color:var(--green)">.cz</span></div></div>` });

  flyTo('k18', { x: X(-1500), y: Y(-1650), d: 2600 });
  cam({ t: T(C('me')) - .3, dur: 1.4, x: X(-500), y: Y(-750), d: 5200, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  me.forEach(([cue], i) => cam({ t: T(C(cue)) - .3, dur: .9, x: X(-1500 + (i % 2) * 2000), y: Y(-450 + Math.floor(i / 2) * 700), d: 1900, ease: 'whip', rx: 2, ry: (i % 2 ? -4 : 4), push: .05 }));
  // celá mapa: všechny štítky už svítí
  cam({ t: T(C('zoomout')) - .2, dur: 5.5, x: OV.x, y: OV.y, d: OV.d * 1.08, ease: 'smooth', rx: 12, ry: -3, push: .02 });
})();
