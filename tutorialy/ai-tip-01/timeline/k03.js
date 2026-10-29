// K03 · Krok 2: Téma a scénář – hledání (moc obecné), téma „nech AI, ať se ptá ona tebe“, metafora regál vs. na míru, scénář v1.
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo } = L;
  const { IMG, pill, big } = U;
  const o = A.k03, X = v => o.x + v, Y = v => o.y + v, C = n => 'k03.' + n;

  W.card({ x: X(-1300), y: Y(-2450), w: 1900, in: CH('k03') + 1.0, kicker: 'Krok 02', kc: 'b', title: 'Téma <span class="gr">a scénář</span>' });

  // hledání
  const s = C('search');
  W.html({ x: X(-1300), y: Y(-1500), z: 30, w: 2100, h: 520, in: T(s) + .1, anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:40px 48px">
      <div style="display:flex;align-items:center;gap:22px;border:3px solid var(--line);border-radius:999px;padding:20px 34px"><span style="font:700 46px var(--sans);color:var(--blue)">⌕</span>
        <span style="font:500 40px var(--mono)">trend vysvětlování přes obrázky · AI fun facty</span></div>
      <div class="res" style="margin-top:34px;display:flex;flex-direction:column;gap:18px;opacity:var(--hl,0)">${[86, 70, 78].map(w => `<div style="height:34px;width:${w}%;border-radius:17px;background:#E3E8F0"></div>`).join('')}</div></div>`,
    fx: [{ t: AT(s, 'výsledky'), sel: '.res' }] });
  W.callout({ x: X(-700), y: Y(-1060), z: 90, w: 1100, in: AT(s, 'obecný'), c: 'r', lab: '✕', txt: '<b>moc obecné</b> výsledky' });

  // téma
  const t = C('topic');
  W.html({ x: X(1700), y: Y(-2350), z: 50, w: 2300, h: 330, in: AT(t, 'Přestaň'), anim: 'fly', lodBoost: 2,
    html: `<div style="height:100%;display:flex;align-items:center;justify-content:center;font:800 170px/1 var(--sans);letter-spacing:-.055em;white-space:nowrap">Přestaň se <span class="gr" style="padding:0 .05em">AI ptát.</span></div>` });
  W.html({ x: X(1700), y: Y(-2020), z: 50, w: 2300, h: 160, in: AT(t, 'Nech'), anim: 'rise',
    html: `<div style="height:100%;display:flex;align-items:center;justify-content:center;font:600 84px var(--sans);letter-spacing:-.04em;color:var(--ink2)">Nech ji, ať se ptá ona tebe.</div>` });
  W.html({ x: X(1700), y: Y(-2720), z: 90, w: 700, h: 150, in: T(t), anim: 'pop', html: pill('téma', 'b', 48) });
  W.html({ x: X(850), y: Y(-2720), z: 90, w: 900, h: 150, in: AT(t, 'nezastará'), anim: 'pop', html: pill('nezastará', 'g', 48) });
  W.html({ x: X(2550), y: Y(-2720), z: 90, w: 1000, h: 150, in: AT(t, 'vyzkoušet'), anim: 'pop', html: pill('hned vyzkoušet', 'g', 48) });
  W.html({ x: X(1700), y: Y(-1500), z: 70, w: 2200, h: 400, in: AT(t, 'zeptej'), anim: 'tilt',
    html: `<div class="prompt" style="font-size:52px;height:100%"><div class="ph"><span>Prompt</span><span>technika</span></div><span class="l" style="--hl:1">Zeptej se mě na 10 otázek,</span><span class="l" style="--hl:1">než začneš.</span></div>` });

  // metafora
  const m = C('metaphor');
  [['konfekce', 2, 'konfekce z regálu', 'r', 900], ['obleku', 3, 'oblek šitý na míru', 'g', 2500]].forEach(([w, i, cap, c, x]) => {
    W.img({ x: X(x), y: Y(-50), z: 40, w: 700, h: 1250, src: IMG(i), in: AT(m, w), anim: 'flip', dof: false, float: 6 });
    W.html({ x: X(x), y: Y(700), z: 80, w: 1100, h: 150, in: AT(m, w) + .2, anim: 'rise', html: pill(cap, c === 'g' ? 'g' : '', 48) });
  });
  W.html({ x: X(1700), y: Y(-820), z: 90, w: 1000, h: 150, in: T(m), anim: 'rise', html: pill('metafora', 'o', 48) });
  W.html({ x: X(1700), y: Y(-50), z: 120, w: 300, h: 300, in: AT(m, 'proti'), anim: 'pop',
    html: `<div style="height:100%;display:grid;place-items:center"><div style="width:220px;height:220px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font:800 90px var(--sans)">vs</div></div>` });

  // scénář v1
  const sc = C('script');
  W.html({ x: X(-1300), y: Y(-50), z: 40, w: 1800, h: 900, in: T(sc), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:44px 50px"><span class="kick b"><span class="d"></span>scénář · verze 1</span>
      <div style="display:flex;justify-content:space-around;align-items:center;margin-top:60px">${big('33', 'slov', 300)}${big('~11 s', 'délka', 220, 'var(--ink)')}</div></div>` });

  flyTo('k03', { x: X(-1300), y: Y(-2300), d: 2400 });
  cam({ t: T(s) - .2, dur: 1.2, x: X(-1300), y: Y(-1450), d: 2600, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: T(t) - .3, dur: 1.3, x: X(1700), y: Y(-2400), d: 2600, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: AT(t, 'zeptej') - .5, dur: 1.2, x: X(1700), y: Y(-1750), d: 2800, ease: 'smooth', rx: 2, ry: 3, push: .04 });
  cam({ t: T(m) - .3, dur: 1.3, x: X(1700), y: Y(50), d: 3200, ease: 'whip', rx: 3, ry: 5, push: .05 });
  cam({ t: T(sc) - .3, dur: 1.3, x: X(-1300), y: Y(-50), d: 2700, ease: 'whip', rx: 3, ry: -4, push: .05 });
})();
