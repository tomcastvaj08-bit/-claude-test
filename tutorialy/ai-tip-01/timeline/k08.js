// K08 · Moje zpětná vazba – tmavá karta s feedbackem po bodech, pak co si z toho Claude vzal + techniky z After Effects jako dlaždice.
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { pill, tile } = U;
  const o = A.k08, X = v => o.x + v, Y = v => o.y + v, C = n => 'k08.' + n;

  W.card({ x: X(-1200), y: Y(-2650), w: 1900, in: CH('k08') + 1.0, kicker: 'Zpětná vazba', kc: 'o', title: 'Laťka <span class="gr">After Effects</span>' });

  // feedback (zkráceně, po bodech)
  const f = C('fb');
  const FB = [['Žádný', '✕ AI fotky → chci <em>motion grafiku</em>'], ['Místo', 'AI se čte slangově: <em>„ájí“</em>, ne „á í“'], ['Dynamika', '✓ dynamika i grain dobré'],
    ['chybí', 'chybí <em>pohyb</em>'], ['Kamera', 'kamera · zoom · panely ve 3D · 3D slovo · něco spadne'], ['Ulož', '„Ulož si to“ na konci <em>pryč</em>'],
    ['Víc', 'víc masek a <em>přepálené intro</em>'], ['laťka', 'laťka jako z <em>After Effects</em>']];
  W.html({ x: X(-1200), y: Y(-950), z: 40, w: 2300, h: 1500, autoH: true, in: T(f) + .1, anim: 'tilt',
    fx: FB.map(([w], i) => ({ t: AT(f, w), sel: '.b' + i })),
    html: `<div class="quote" style="padding:48px 56px"><div class="who"><span class="av"></span>Teecee · zpětná vazba (zkráceně)</div>
      <div style="margin-top:26px;display:flex;flex-direction:column;gap:16px">${FB.map(([, t], i) => `<div class="b${i}" style="font:550 48px/1.3 var(--sans);opacity:calc(.2 + var(--hl,0)*.8);display:flex;gap:20px"><span style="color:#8FB0FF;font-family:var(--mono)">0${i + 1}</span><span>${t}</span></div>`).join('')}</div></div>`.replace(/<em>/g, '<em style="font-style:normal;color:#8FB0FF">') });

  // co si Claude vzal
  const l = C('learn');
  const LR = [['Pryč', 'jen 3D prostor, žádné fotky'], ['Do', 'do textu pro hlas „ájí“'], ['Kamera', 'kamera se pořád hýbe']];
  W.html({ x: X(1800), y: Y(-2350), z: 40, w: 1800, h: 200, in: T(l), anim: 'rise', html: pill(`${logo('claude', 56)} Claude si vzal`, 'b', 56) });
  LR.forEach(([w, t], i) => W.callout({ x: X(1800), y: Y(-1950 + i * 300), z: 60, w: 1800, in: AT(l, w), c: 'g', lab: '✓', txt: `<b>${t}</b>` }));
  const AE = [['kamera', '◎', '3D kamera', 2], ['hloubka', '◐', 'hloubka ostrosti'], ['vytaženej', '▤', '3D text'], ['kinetická', 'Aa', 'kinetická typo'],
    ['roztříštění', '✶', 'roztříštění'], ['kreslení', '〜', 'kreslení čar'], ['kruhový', '◯', 'kruhové masky']];
  AE.forEach(([w, sym, name, nth], i) => W.html({ x: X(1800 + ((i % 4) - 1.5) * 560 + (i > 3 ? 280 : 0)), y: Y(-750 + Math.floor(i / 4) * 560), z: 40, w: 520, h: 500,
    in: AT(l, w, nth || 1), anim: 'pop', html: tile(sym, name, '') }));
  W.html({ x: X(1800), y: Y(-1100), z: 60, w: 1500, h: 150, in: AT(l, 'nastudoval'), anim: 'rise', html: pill('techniky z After Effects', 'o', 46) });

  flyTo('k08', { x: X(-1200), y: Y(-2500), d: 2400 });
  // feedback je dlouhý: kamera sjíždí po bodech
  cam({ t: T(f) - .1, dur: 1.3, x: X(-1200), y: Y(-1350), d: 2600, ease: 'smooth', rx: 3, ry: 4, push: .03 });
  cam({ t: AT(f, 'chybí') - .4, dur: 1.4, x: X(-1200), y: Y(-950), d: 2700, ease: 'smooth', rx: 2, ry: -3, push: .03 });
  cam({ t: AT(f, 'Ulož') - .4, dur: 1.4, x: X(-1200), y: Y(-600), d: 2600, ease: 'smooth', rx: 3, ry: 3, push: .03 });
  cam({ t: T(l) - .3, dur: 1.3, x: X(1800), y: Y(-1800), d: 2600, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: AT(l, 'nastudoval') - .3, dur: 1.3, x: X(1800), y: Y(-650), d: 3000, ease: 'whip', rx: 4, ry: 4, push: .05 });
})();
