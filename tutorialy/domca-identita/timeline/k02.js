// K02 · Krok 1: originál talking head – 6 s, z ruky, venku; co se z něj bere (hlava, mimika, pusa, načasování).
(() => {
  const { T, AT, cam, link } = ENGINE;
  const { A, CH, flyTo, player } = L;
  const o = A.k02, X = v => o.x + v, Y = v => o.y + v, C = n => 'k02.' + n;

  W.card({ x: X(0), y: Y(-1900), w: 1900, in: CH('k02') + 1.0, kicker: 'Krok 01', kc: 'b', title: 'Obyčejný <span class="gr">talking head</span>' });
  player('original', { x: X(-700), y: Y(0), z: 20, w: 2000, a: 0, b: 6, loop: true, seqStart: T(C('s1')), in: T(C('s1')) - .2, anim: 'flip', dof: false });

  [['Šest', '6 sekund', 'b'], ['ruce', 'z ruky, za chůze', 'b'], ['ulici', 'venku na ulici', 'b'], ['světlo', 'denní světlo', 'g']].forEach(([w, txt, c], i) =>
    W.html({ x: X(1250), y: Y(-420 + i * 260), z: 60, w: 1100, h: 200, in: AT(C('shot'), w), anim: 'rise',
      html: `<div style="display:flex"><span class="mpill ${c}" style="font-size:44px;padding:16px 34px"><span class="d"></span>${txt}</span></div>` }));

  const keep = [['Pohyb', 'pohyb hlavy'], ['mimika', 'mimika'], ['pusy', 'pohyb pusy'], ['načasování', 'načasování řeči']];
  keep.forEach(([w, txt], i) => {
    const t0 = AT(C('why1'), w), xx = X(-2100 + i * 1000);
    W.callout({ x: xx, y: Y(1350), z: 40, w: 920, in: t0, c: i === 3 ? 'g' : '', lab: '0' + (i + 1), txt: `<b>${txt}</b>` });
    link({ a: { x: X(-700), y: Y(560) }, b: { x: xx, y: Y(1230) }, in: t0 - .1, dur: .6, soft: true, w: 6, bend: .1, z: -10 });
  });
  W.html({ x: X(-700), y: Y(1900), z: 80, w: 2600, h: 130, in: AT(C('why1'), 'natočíš'), anim: 'pop',
    html: `<div style="text-align:center;font:650 60px var(--sans);letter-spacing:-.04em">co natočíš tady, <span class="gr">uvidíš ve výsledku</span></div>` });

  flyTo('k02', { x: X(0), y: Y(-1800), d: 2400 });
  cam({ t: T(C('shot')) - .3, dur: 1.3, x: X(250), y: Y(0), d: 3500, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(C('why1')) - .3, dur: 1.4, x: X(-650), y: Y(1150), d: 3600, ease: 'smooth', rx: 5, ry: 3, push: .05 });
})();
