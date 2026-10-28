// K07 · Pravidla: osm karet v mřížce 4×2, každá naskočí na své číslo.
(() => {
  const { T, cam } = ENGINE;
  const { A, CH, flyTo } = L;
  const o = A.k07, X = v => o.x + v, Y = v => o.y + v, C = n => 'k07.' + n;

  W.card({ x: X(0), y: Y(-1900), w: 1900, in: CH('k07') + 1.0, kicker: 'Shrnutí', kc: 'b', title: 'Osm <span class="gr">pravidel</span>' });
  const R = [['Ne „character sheet“', 'piš <b>RAW photo, studio photoshoot</b>, zákazy NOT… na začátek'], ['Méně, ostřejších referencí', 'u každé napiš, co z ní vzít (@image1…)'],
    ['Outfit detailně', 'barva, nápis, střih, opotřebení'], ['Špatný styl → nová generace', 'ne Edit, ten drží chybný styl'],
    ['Reference = jen hlava', 'ne celá postava s oblečením'], ['„EDIT, NOT A NEW VIDEO“', 'vyjmenuj VELKÝMI, co se nesmí změnit'],
    ['Postava i časem', 'od kolikáté do kolikáté sekundy'], ['Záloha: motion control', 'v Klingu, mění jen jednu postavu']];
  R.forEach(([h, t], i) => {
    const x = X(-2550 + (i % 4) * 1700), y = Y(-500 + Math.floor(i / 4) * 900), cue = C('r' + (i + 1));
    W.html({ x, y, z: 40, w: 1580, h: 780, in: T(cue), anim: 'pop',
      html: `<div class="card" style="height:100%;padding:40px 44px"><div style="font:700 120px var(--mono);color:${i === 7 ? 'var(--green)' : 'var(--blue)'};line-height:1">${String(i + 1).padStart(2, '0')}</div>
        <div style="font:700 56px/1.08 var(--sans);letter-spacing:-.04em;margin-top:26px">${h}</div><div style="font:500 34px/1.3 var(--sans);color:var(--ink2);margin-top:18px">${t}</div></div>` });
  });

  flyTo('k07', { x: X(0), y: Y(-1800), d: 2400 });
  cam({ t: T(C('rules')) - .2, dur: 1.4, x: X(0), y: Y(-100), d: 6200, ease: 'smooth', rx: 4, ry: 0, push: .03 });
  R.forEach((_, i) => cam({ t: T(C('r' + (i + 1))) - .3, dur: .8, x: X(-2550 + (i % 4) * 1700), y: Y(-500 + Math.floor(i / 4) * 900), d: 2300, ease: 'whip', rx: 2, ry: i % 2 ? -4 : 4, push: .05 }));
})();
