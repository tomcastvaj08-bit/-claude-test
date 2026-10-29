// K11 · Krok 9: Chyby ve 3D – pět schémat: malé → blíž, skok kamery, prvek za kamerou, podlaha jako disk, kontaktní list 4 kola.
(() => {
  const { T, AT, cam, clamp, ease, lerp } = ENGINE;
  const { A, CH, flyTo } = L;
  const { pill, big } = U;
  const o = A.k11, X = v => o.x + v, Y = v => o.y + v, C = n => 'k11.' + n;

  W.card({ x: X(-1200), y: Y(-2700), w: 1900, in: CH('k11') + 1.0, kicker: 'Krok 09', kc: 'r', title: 'Chyby <span class="gr">ve 3D</span>' });
  const box = (n, title, inner) => `<div class="card" style="height:100%;padding:36px 44px;display:flex;flex-direction:column;gap:22px;position:relative"><div style="display:flex;align-items:center;gap:20px">
    <span style="width:74px;height:74px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center;font:700 36px var(--mono)">${n}</span><span style="font:650 52px var(--sans);letter-spacing:-.04em">${title}</span></div>
    <div style="flex:1;position:relative">${inner}</div></div>`;
  const BW = 1900, BH = 1050;

  // 1 · moc malé → kamera blíž
  const s = C('small');
  W.html({ x: X(-2100), y: Y(-1450), z: 30, w: BW, h: BH, in: T(s), anim: 'tilt',
    update: (n, t) => { const p = ease('smooth', clamp((t - AT(s, 'blíž')) / 1.2)); n.el.querySelector('.ph2 .tx').style.transform = `scale(${lerp(.55, 1, p)})`; },
    html: box(1, 'na mobilu nečitelné', `<div style="display:flex;justify-content:space-around;align-items:center;height:100%">
      ${[0, 1].map(k => `<div class="ph${k + 1}" style="width:300px;height:560px;border-radius:44px;background:var(--night);border:10px solid #0A0D14;display:grid;place-items:center;overflow:hidden">
        <div class="tx" style="font:800 ${k ? 62 : 34}px var(--sans);color:#fff;letter-spacing:-.04em">PŘESTAŇ</div></div>`).join('<div style="font:700 80px var(--sans);color:var(--blue)">→</div>')}</div>`) });
  W.html({ x: X(-2100), y: Y(-800), z: 80, w: 1600, h: 150, in: AT(s, 'třicet'), anim: 'pop', html: pill('kamera o 30–40 % blíž', 'g', 48) });

  // 2 · skok kamery: poslední klíč stanice ležel v další
  const j = C('jump');
  W.html({ x: X(100), y: Y(-1450), z: 30, w: BW, h: BH, in: T(j), anim: 'tilt',
    fx: [{ t: AT(j, 'klíč'), sel: '.bad' }, { t: AT(j, 'smažou'), sel: '.fix' }],
    html: box(2, 'kamera skočila zpátky', `<div style="position:absolute;left:0;right:0;top:80px;height:170px;display:flex;gap:10px">
      <div style="flex:1;border-radius:20px;background:var(--blue-soft);font:600 46px var(--mono);display:grid;place-items:center">stanice A</div>
      <div style="flex:1;border-radius:20px;background:var(--green-soft);font:600 46px var(--mono);display:grid;place-items:center">stanice B</div></div>
      <div class="bad" style="position:absolute;left:62%;top:52px;width:56px;height:56px;background:var(--red);transform:rotate(45deg);opacity:var(--hl,0)"></div>
      <div class="bad" style="position:absolute;left:0;right:0;top:340px;font:550 52px var(--sans);color:var(--red);opacity:var(--hl,0)">✕ poslední klíč stanice A ležel až v B</div>
      <div class="fix" style="position:absolute;left:0;right:0;top:470px;font:650 56px var(--sans);color:var(--green-ink);opacity:var(--hl,0)">✓ při přechodu se smažou</div>`) });

  // 3 · prvek za kamerou (near-clip)
  const b = C('behind');
  W.html({ x: X(2300), y: Y(-1450), z: 30, w: BW, h: BH, in: T(b), anim: 'tilt',
    update: (n, t) => { const tb = t > AT(b, 'zprůhlední') ? AT(b, 'zprůhlední') : AT(b, 'proletí'), p = clamp((t - tb) / 2.2), xx = lerp(1300, 80, p), d = n.el.querySelector('.dot');
      const fixd = t > AT(b, 'zprůhlední'); d.style.transform = `translate(${xx}px,0)`; d.style.background = fixd ? 'var(--green)' : 'var(--red)'; d.style.opacity = fixd ? clamp((xx - 380) / 500) : 1; },
    html: box(3, 'černé artefakty', `<svg viewBox="0 0 1800 560" style="position:absolute;inset:0;width:100%;height:100%"><path d="M420 280 L1700 60 L1700 500 Z" fill="rgba(31,77,255,.08)" stroke="#1F4DFF" stroke-width="4"/>
      <rect x="300" y="230" width="120" height="100" rx="18" fill="#0A0D14"/><line x1="380" y1="20" x2="380" y2="540" stroke="#D42A1E" stroke-width="4" stroke-dasharray="14 12"/><text x="300" y="560" font-family="Geist Mono" font-size="30" fill="#D42A1E">rovina kamery</text></svg>
      <div class="dot" style="position:absolute;left:0;top:250px;width:70px;height:70px;border-radius:50%"></div>
      <div style="position:absolute;right:0;bottom:-10px;font:600 34px var(--mono);color:var(--green-ink)">✓ blízko kamery průhlednost → schovat</div>`) });

  // 4 · podlaha přes kameru → disk před kamerou
  const fl = C('floor');
  W.html({ x: X(-2100), y: Y(-150), z: 30, w: BW, h: BH, in: T(fl), anim: 'tilt',
    fx: [{ t: AT(fl, 'disk'), sel: '.dk' }],
    html: box(4, 'úplně prázdné snímky', `<svg viewBox="0 0 1800 600" style="position:absolute;inset:0;width:100%;height:100%"><rect x="60" y="300" width="1680" height="220" fill="rgba(212,42,30,.12)" stroke="#D42A1E" stroke-width="4"/>
      <text x="80" y="580" font-family="Geist Mono" font-size="32" fill="#D42A1E">podlaha 10 000 px · zasahuje za kameru</text><rect x="240" y="180" width="120" height="100" rx="18" fill="#0A0D14"/>
      <g class="dk" style="opacity:var(--hl,0)"><ellipse cx="1050" cy="300" rx="560" ry="110" fill="rgba(19,185,122,.25)" stroke="#13B97A" stroke-width="6"/><text x="1050" y="160" text-anchor="middle" font-family="Geist Mono" font-size="36" fill="#0A7A4F">✓ disk před kamerou</text></g></svg>`) });

  // 5 · ořezy, prosakující šedá, obdélník na obloze → kontaktní list 4 kola
  const cr = C('crop');
  W.html({ x: X(100), y: Y(-150), z: 30, w: BW, h: BH, in: T(cr), anim: 'tilt',
    fx: [0, 1, 2, 3].map(k => ({ t: AT(cr, 'čtyři') + k * .3, sel: '.k' + k })),
    html: box(5, 'ořezy a prosakování', `<div style="display:flex;gap:20px;margin-top:10px">${['ořezy', 'šedá prosakuje', 'obdélník na obloze'].map(t => `<span style="font:550 40px var(--sans);color:var(--red)">✕ ${t}</span>`).join('')}</div>
      <div style="display:flex;gap:24px;margin-top:40px">${[0, 1, 2, 3].map(k => `<div class="k${k}" style="flex:1;opacity:calc(.15 + var(--hl,0)*.85)"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${Array.from({ length: 12 }, () => `<i style="height:100px;border-radius:8px;background:${k === 3 ? '#13B97A' : '#C9D3E6'}"></i>`).join('')}</div>
      <div style="font:650 44px var(--mono);margin-top:16px;text-align:center">kolo ${k + 1}</div></div>`).join('')}</div>`) });
  W.html({ x: X(2300), y: Y(-150), z: 60, w: 1500, h: 520, in: AT(cr, 'trval'), anim: 'pop', html: big('4 min', 'plný render v2', 240) });

  flyTo('k11', { x: X(-1200), y: Y(-2550), d: 2400 });
  cam({ t: T(s) - .1, dur: 1.3, x: X(-2100), y: Y(-1300), d: 2600, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: T(j) - .3, dur: 1.2, x: X(100), y: Y(-1400), d: 2500, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(b) - .3, dur: 1.2, x: X(2300), y: Y(-1400), d: 2500, ease: 'whip', rx: 3, ry: 5, push: .05 });
  cam({ t: T(fl) - .3, dur: 1.3, x: X(-2100), y: Y(-150), d: 2500, ease: 'whip', rx: 4, ry: -4, push: .05 });
  cam({ t: T(cr) - .3, dur: 1.3, x: X(100), y: Y(-150), d: 2500, ease: 'whip', rx: 3, ry: 4, push: .05 });
  cam({ t: AT(cr, 'trval') - .4, dur: 1.3, x: X(1200), y: Y(-150), d: 3600, ease: 'smooth', rx: 4, ry: -3, push: .04 });
})();
