// K13 · Cena a poučení – velká čísla (ElevenLabs ~870, Higgsfield 1,25, čas 1 h + 1,5 h), co zbývá na další díl, 8 pravidel.
(() => {
  const { T, AT, cam, clamp, ease } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { pill, big } = U;
  const o = A.k13, X = v => o.x + v, Y = v => o.y + v, C = n => 'k13.' + n;

  W.card({ x: X(-1200), y: Y(-2650), w: 1900, in: CH('k13') + 1.0, kicker: 'Cena a poučení', kc: 'g', title: 'Kolik to <span class="gr">stálo?</span>' });

  const c = C('cost');
  W.html({ x: X(-2200), y: Y(-1650), z: 40, w: 1700, h: 560, in: AT(c, 'ElevenLabs') - .1, anim: 'pop',
    update: (n, t) => { const p = ease('out', clamp((t - AT(c, 'osm')) / 1.3)); n.el.querySelector('.cn').textContent = '~' + Math.round(870 * p); },
    html: `<div class="card" style="height:100%;padding:40px 50px;text-align:center"><div style="display:flex;justify-content:center;align-items:center;gap:20px">${logo('elevenlabs', 70)}<span style="font:650 50px var(--sans)">ElevenLabs</span></div>
      <div class="cn bignum" style="font-size:220px;margin-top:20px;color:var(--blue)">~870</div><div style="font:600 38px var(--mono);color:var(--muted)">kreditů</div></div>` });
  W.html({ x: X(-300), y: Y(-1650), z: 40, w: 1700, h: 560, in: AT(c, 'Higgsfield'), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:40px 50px;text-align:center"><div style="display:flex;justify-content:center;align-items:center;gap:20px">${logo('higgsfield', 70)}<span style="font:650 50px var(--sans)">Higgsfield</span></div>
      <div class="bignum" style="font-size:220px;margin-top:20px;color:var(--green)">1,25</div><div style="font:600 38px var(--mono);color:var(--muted)">kreditu</div></div>` });
  [['první', 'v1', '1 h', ''], ['druhá', 'v2', '1,5 h', 'engine od nuly']].forEach(([w, v, h, sub], i) =>
    W.html({ x: X(1600), y: Y(-1900 + i * 520), z: 40, w: 1700, h: 460, in: AT(c, w), anim: 'flip',
      html: `<div class="card" style="height:100%;padding:36px 50px;display:flex;align-items:center;gap:40px"><span style="font:700 70px var(--mono);color:var(--blue)">${v}</span>
        <span class="bignum" style="font-size:170px">${h}</span>${sub ? `<span style="font:500 32px var(--mono);color:var(--muted)">${sub}</span>` : ''}</div>` }));
  // další díl ze šablony
  const NX = [['scénář', 'scénář'], ['hlas', 'hlas'], ['úprava', 'úprava stanic'], ['čtyři', '4 min renderu']];
  W.html({ x: X(-1250), y: Y(-850), z: 60, w: 1600, h: 150, in: AT(c, 'Další'), anim: 'rise', html: pill('další díl ze šablony', 'g', 56) });
  NX.forEach(([w, t], i) => W.html({ x: X(-2650 + i * 950), y: Y(-600), z: 80, w: 920, h: 170, in: AT(c, w), anim: 'pop', html: pill(t, '', 50) }));

  // 8 pravidel
  const r = C('rules');
  const RL = [['nečte', 'AI = „ájí“, ne „á í“'], ['Žádný', 'bez „ulož si to“ · značka na konci · CTA v popisku', 1], ['Žádný', 'žádné AI fotky · 3D motion · kamera v pohybu', 2],
    ['Prvních', 'prvních ~1,5 s přepálených'], ['Vždycky', 'kontaktní list před renderem'], ['Nic', 'nic za kameru'], ['Beat', 'beat syntetizovat'], ['každej', 'jedna animace max ve 2 videích']];
  RL.forEach(([w, t, nth], i) => W.callout({ x: X(-1300 + (i % 2) * 1900), y: Y(250 + Math.floor(i / 2) * 330), z: 40, w: 1800, in: AT(r, w, nth || 1), c: i % 3 === 2 ? 'g' : '', lab: '0' + (i + 1), txt: `<b>${t}</b>` }));
  W.html({ x: X(-350), y: Y(-50), z: 60, w: 1600, h: 150, in: T(r) + .2, anim: 'rise', html: pill('pravidla pro další díly', 'b', 46) });

  flyTo('k13', { x: X(-1200), y: Y(-2500), d: 2400 });
  cam({ t: AT(c, 'ElevenLabs') - .5, dur: 1.3, x: X(-1250), y: Y(-1650), d: 3300, ease: 'whip', rx: 3, ry: 4, push: .04 });
  cam({ t: AT(c, 'první') - .4, dur: 1.2, x: X(1600), y: Y(-1650), d: 2700, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: AT(c, 'Další') - .4, dur: 1.3, x: X(-1000), y: Y(-750), d: 3300, ease: 'smooth', rx: 3, ry: 3, push: .04 });
  cam({ t: T(r) - .3, dur: 1.3, x: X(-350), y: Y(400), d: 3700, ease: 'whip', rx: 4, ry: -4, push: .04 });
  cam({ t: AT(r, 'Vždycky') - .4, dur: 1.4, x: X(-350), y: Y(750), d: 3700, ease: 'smooth', rx: 3, ry: 4, push: .03 });
})();
