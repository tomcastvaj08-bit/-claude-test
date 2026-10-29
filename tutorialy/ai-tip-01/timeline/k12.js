// K12 · Krok 10: Zvuk – řetězec hlasu, křivka beatu (dolní propust přes regál, zastavení pásky, drop), ducking −55 %, 112 událostí, −14 LUFS.
(() => {
  const { T, AT, cam, link, clamp } = ENGINE;
  const { A, CH, flyTo } = L;
  const { pill, big } = U;
  const o = A.k12, X = v => o.x + v, Y = v => o.y + v, C = n => 'k12.' + n;

  W.card({ x: X(-1200), y: Y(-2500), w: 1900, in: CH('k12') + 1.0, kicker: 'Krok 10', kc: 'b', title: 'Zvuk' });

  // řetězec hlasu
  const c = C('chain');
  const CH4 = [['zrychlenej', 'atempo', 'zrychlení'], ['ořezaný', 'low-cut', 'ořezané basy'], ['středy', 'EQ', 'středy + výšky ↑'], ['kompresor', 'kompresor', '']];
  CH4.forEach(([w, n, sub], i) => {
    W.html({ x: X(-2700 + i * 1150), y: Y(-1450), z: 40, w: 1000, h: 380, in: AT(c, w), anim: 'flip',
      html: `<div class="card" style="height:100%;padding:34px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;text-align:center">
        <div style="font:700 34px var(--mono);color:var(--blue)">0${i + 1}</div><div style="font:650 56px var(--sans);letter-spacing:-.04em">${n}</div>${sub ? `<div style="font:500 30px var(--mono);color:var(--muted)">${sub}</div>` : ''}</div>` });
    if (i) link({ a: { x: X(-2700 + (i - 1) * 1150 + 500), y: Y(-1450) }, b: { x: X(-2700 + i * 1150 - 500), y: Y(-1450) }, in: AT(c, w) - .2, dur: .5, z: 20, bend: 0 });
  });
  W.html({ x: X(-3550), y: Y(-1950), z: 60, w: 700, h: 140, in: T(c), anim: 'rise', html: pill('hlas', 'b', 44) });

  // křivka beatu
  const d = C('drop');
  W.html({ x: X(-1000), y: Y(-200), z: 30, w: 3400, h: 1000, in: AT(d, 'Beat'), anim: 'tilt',
    fx: [{ t: AT(d, 'regál'), sel: '.z1' }, { t: AT(d, 'třetinu'), sel: '.z2' }, { t: AT(d, 'flash'), sel: '.z3' }, { t: AT(d, 'hlasem'), sel: '.z4' }],
    update: (n, t) => { const p = clamp((t - AT(d, 'Beat')) / 7.5); n.el.querySelector('.ph').setAttribute('x', 80 + p * 3100); },
    html: `<div class="card" style="height:100%;padding:36px 46px;position:relative"><span class="kick b"><span class="d"></span>beat · výšky / hlasitost v čase</span>
      <svg viewBox="0 0 3300 760" style="position:absolute;left:46px;top:120px;width:3300px;height:760px">
        <g class="z1" style="opacity:calc(.15 + var(--hl,0)*.85)"><rect x="900" y="40" width="1100" height="600" fill="rgba(31,77,255,.07)"/><text x="1450" y="100" text-anchor="middle" font-family="Geist Mono" font-size="40" fill="#1F4DFF">regál · dolní propust</text></g>
        <g class="z2" style="opacity:calc(.15 + var(--hl,0)*.85)"><rect x="2000" y="40" width="260" height="600" fill="rgba(240,122,26,.12)"/><text x="2130" y="100" text-anchor="middle" font-family="Geist Mono" font-size="34" fill="#F07A1A">páska ⅓ s</text></g>
        <g class="z3" style="opacity:calc(.15 + var(--hl,0)*.85)"><rect x="2260" y="40" width="20" height="600" fill="#F6C34A"/><text x="2400" y="100" font-family="Geist Mono" font-size="40" fill="#0A7A4F">drop · flash</text></g>
        <path d="M80 260 L900 260 C 960 260, 960 480, 1050 480 L2000 480 C 2120 480, 2200 640, 2260 640 L2280 200 L3200 200" stroke="#0A0D14" stroke-width="8" fill="none"/>
        <g class="z4" style="opacity:var(--hl,0)"><path d="M80 700 L500 700 L540 740 L860 740 L900 700 L3200 700" stroke="#13B97A" stroke-width="6" fill="none"/><text x="560" y="690" font-family="Geist Mono" font-size="34" fill="#0A7A4F">pod hlasem až −55 %</text></g>
        <rect class="ph" x="80" y="40" width="6" height="700" fill="#1F4DFF"/></svg></div>` });

  // master
  const m = C('master');
  W.html({ x: X(2300), y: Y(-1500), z: 60, w: 1500, h: 500, in: AT(m, 'Sto'), anim: 'pop', html: big('112', 'zvukových událostí', 260) });
  W.html({ x: X(2300), y: Y(1050), z: 60, w: 1500, h: 500, in: AT(m, 'master'), anim: 'pop', html: big('−14', 'LUFS · master', 260, 'var(--ink)') });
  W.html({ x: X(2300), y: Y(-1100), z: 90, w: 1500, h: 140, in: AT(m, 'přechod'), anim: 'rise', html: pill('každý přechod = vlastní zvuky', 'g', 42) });

  flyTo('k12', { x: X(-1200), y: Y(-2350), d: 2400 });
  cam({ t: T(c) - .2, dur: 1.4, x: X(-1500), y: Y(-1550), d: 3500, ease: 'smooth', rx: 3, ry: 4, push: .04 });
  cam({ t: T(d) - .3, dur: 1.4, x: X(-1000), y: Y(-200), d: 4000, ease: 'whip', rx: 4, ry: -4, push: .04 });
  cam({ t: AT(d, 'hlasem') - .5, dur: 1.2, x: X(-1600), y: Y(0), d: 3200, ease: 'smooth', rx: 2, ry: 3, push: .03 });
  cam({ t: T(m) - .3, dur: 1.3, x: X(2300), y: Y(-1350), d: 2600, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: AT(m, 'master') - .4, dur: 1.3, x: X(2300), y: Y(1000), d: 2600, ease: 'whip', rx: 3, ry: 5, push: .05 });
})();
