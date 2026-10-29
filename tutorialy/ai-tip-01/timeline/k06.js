// K06 · Krok 5: Engine první verze – HTML → Chrome → ffmpeg, tři principy, motion blur (3 mezisnímky), šest scén + přechody.
(() => {
  const { T, AT, cam, link, clamp, ease } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { IMG, pill, big } = U;
  const o = A.k06, X = v => o.x + v, Y = v => o.y + v, C = n => 'k06.' + n;

  W.card({ x: X(0), y: Y(-2550), w: 1900, in: CH('k06') + 1.0, kicker: 'Krok 05', kc: 'b', title: 'Engine <span class="gr">první verze</span>' });

  // schéma HTML → Chrome → ffmpeg
  const e = C('engine');
  [['HTML', 'HTML', 'stránka', 'b', -1900], ['Chrome', 'Chrome', 'vyfotí snímek po snímku', 'chrome', 0], ['ffmpeg', 'ffmpeg', 'složí video', 'ffmpeg', 1900]].forEach(([w, name, sub, lg, x], i) => {
    W.html({ x: X(x), y: Y(-1550), z: 40, w: 1500, h: 420, in: AT(e, w), anim: 'flip',
      html: `<div class="card" style="height:100%;padding:40px 46px;display:flex;align-items:center;gap:30px">${lg === 'b' ? `<span style="width:120px;height:120px;border-radius:34px;background:var(--blue);color:#fff;display:inline-grid;place-items:center;font:700 44px var(--mono);flex:none">&lt;/&gt;</span>` : logo(lg, 120)}
        <div><div style="font:650 70px var(--sans);letter-spacing:-.04em">${name}</div><div style="font:500 34px var(--mono);color:var(--muted);margin-top:8px">${sub}</div></div></div>` });
    if (i) link({ a: { x: X(x - 1900 + 760), y: Y(-1550) }, b: { x: X(x - 760), y: Y(-1550) }, in: AT(e, w) - .2, dur: .6, z: 20, bend: 0 });
  });

  // tři principy
  const r = C('rules');
  const R = [['deterministický', '01', 'deterministické', 'snímek = f(čas)'], ['slova', '02', 'prvky dopadají na slova', 'scéna začíná na slově „napiš“'], ['registruje', '03', 'prvek registruje svůj zvuk', '']];
  R.forEach(([w, n, t, sub], i) => W.html({ x: X(-1900 + i * 1900), y: Y(-700), z: 40, w: 1700, h: 520, in: AT(r, w), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:40px 46px"><div style="font:700 80px var(--mono);color:var(--blue)">${n}</div>
      <div style="font:650 54px/1.15 var(--sans);letter-spacing:-.03em;margin-top:16px">${t}</div>${sub ? `<div style="font:500 34px var(--mono);color:var(--muted);margin-top:16px">${sub}</div>` : ''}</div>` }));
  W.html({ x: X(1900), y: Y(-230), z: 90, w: 1500, h: 300, in: AT(r, 'osmdesát'), anim: 'pop', html: big('82', 'zvuků ve v1', 170) });
  W.html({ x: X(0), y: Y(-330), z: 90, w: 1400, h: 140, in: AT(r, 'napiš'), anim: 'pop', html: pill('▶ napiš', 'b', 48) });

  // motion blur: 3 mezisnímky → 1
  const b = C('blur'), tb = AT(b, 'tři');
  W.html({ x: X(-1000), y: Y(450), z: 40, w: 2600, h: 600, in: AT(b, 'motion'), anim: 'tilt',
    update: (n, t) => { const k = ease('smooth', clamp((t - tb - .6) / 1.4)); n.el.querySelectorAll('.g').forEach((g, i) => { g.style.transform = `translateX(${(i - 1) * 260 * (1 - k)}px)`; g.style.opacity = k > .99 ? (i === 1 ? 1 : 0) : .45 + (i === 1 ? .55 : 0); }); },
    html: `<div class="card" style="height:100%;padding:40px 50px;position:relative"><span class="kick b"><span class="d"></span>motion blur · 3 mezisnímky → 1 snímek</span>
      <div style="position:absolute;left:0;right:0;top:170px;bottom:40px;display:grid;place-items:center">${[0, 1, 2].map(i => `<div class="g" style="position:absolute;width:300px;height:300px;border-radius:40px;background:var(--grad);${i === 1 ? '' : 'filter:blur(4px)'}"></div>`).join('')}</div></div>` });
  W.html({ x: X(1500), y: Y(450), z: 60, w: 1300, h: 460, in: AT(b, 'třicet'), anim: 'pop', html: big('30', 'snímků za sekundu', 220) });

  // šest scén v řadě + přechody
  const s = C('scenes');
  const SC = [['Hook', 'hook', '<b style="font:800 64px var(--sans)">PŘESTAŇ</b>'], ['křeslo', 'křeslo + ?', 1], ['karta', 'karta s promptem', '<span style="font:500 30px var(--mono)">napiš: …</span>'],
    ['regál', 'regál', 2], ['odhalení', 'na míru', 3], ['outro', 'outro · záložka', 4]];
  SC.forEach(([w, lab, c], i) => W.html({ x: X(-2750 + i * 1100), y: Y(1550), z: 40, w: 900, h: 760, in: AT(s, w), anim: 'flip',
    html: `<div class="card" style="height:100%;padding:24px;display:flex;flex-direction:column;gap:16px"><div style="flex:1;border-radius:20px;overflow:hidden;background:var(--night);display:grid;place-items:center;color:#fff">
      ${typeof c === 'number' ? `<img src="${IMG(c)}" style="width:100%;height:100%;object-fit:cover">` : c}</div>
      <div style="font:600 36px var(--mono);text-align:center"><span style="color:var(--blue)">0${i + 1}</span> ${lab}</div></div>` }));
  [['flashe', 'flash'], ['whip', 'whip'], ['strobe', 'strobe'], ['zoom', 'zoom']].forEach(([w, t], i) =>
    W.html({ x: X(-2200 + i * 1100 + (i > 1 ? 1100 : 0)), y: Y(2050), z: 120, w: 520, h: 140, in: AT(s, w), anim: 'pop', html: pill(t, 'b', 40) }));

  flyTo('k06', { x: X(0), y: Y(-2350), d: 2500 });
  cam({ t: AT(e, 'HTML') - .5, dur: 1.4, x: X(0), y: Y(-1650), d: 4300, ease: 'smooth', rx: 4, ry: 3, push: .04 });
  cam({ t: T(r) - .3, dur: 1.3, x: X(0), y: Y(-650), d: 4300, ease: 'whip', rx: 3, ry: -4, push: .05 });
  cam({ t: AT(r, 'registruje') - .3, dur: 1.1, x: X(1900), y: Y(-550), d: 2900, ease: 'smooth', rx: 2, ry: 4, push: .04 });
  cam({ t: T(b) - .3, dur: 1.3, x: X(-300), y: Y(450), d: 3900, ease: 'whip', rx: 3, ry: 5, push: .05 });
  cam({ t: T(s) - .3, dur: 1.3, x: X(-1650), y: Y(1650), d: 3400, ease: 'whip', rx: 4, ry: -4, push: .05 });
  cam({ t: AT(s, 'regál') - .4, dur: 2.2, x: X(1100), y: Y(1650), d: 3400, ease: 'smooth', rx: 3, ry: 4, push: .03 });
})();
