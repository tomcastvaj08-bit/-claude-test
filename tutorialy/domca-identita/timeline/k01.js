// K01 · Nástroje: talking head uprostřed, kolem Seedance (přeškrtnutý), Genjutsu, ElevenLabs, CapCut – čáry na slova.
(() => {
  const { T, AT, cam, link } = ENGINE;
  const { A, CH, flyTo, frame, logo } = L;
  const o = A.k01, X = v => o.x + v, Y = v => o.y + v, C = n => 'k01.' + n;

  W.card({ x: X(0), y: Y(-1900), w: 1800, in: CH('k01') + 1.0, kicker: 'Tým', kc: 'b', title: 'Čtyři <span class="gr">nástroje</span>' });
  W.img({ x: X(0), y: Y(0), z: 60, w: 1100, h: 619, src: frame('original', 2.5), cap: 'talking head · 6 s', in: T(C('tools')), anim: 'pop', dof: false, float: 6 });

  const tools = [
    ['t1', 'seedance', 'Seedance', 'edit mode · první pokus', -2100, -900, 'r'],
    ['t2', 'genjutsu', 'Higgsfield Genjutsu', 'výměna obličeje', 2100, -900, 'g'],
    ['t3', 'elevenlabs', 'ElevenLabs', 'klon hlasu · 3 modely', -2100, 1000, 'b'],
    ['t4', 'capcut', 'CapCut', 'střih na telefonu', 2100, 1000, 'b'],
  ];
  tools.forEach(([cue, key, name, sub, dx, dy, c]) => {
    const t0 = T(C(cue));
    W.html({ x: X(dx), y: Y(dy), z: 40, w: 1500, h: 300, in: t0, anim: 'pop', float: 5,
      fx: c === 'r' ? [{ t: AT(C(cue), 'nevyšel'), sel: '.x' }] : [],
      html: `<div class="card" style="height:100%;padding:34px 40px;display:flex;align-items:center;gap:30px;position:relative">${logo(key, 110)}
        <div><div style="font:650 56px var(--sans);letter-spacing:-.04em">${name}</div><div style="font:500 30px var(--mono);color:var(--muted);margin-top:6px">${sub}</div></div>
        ${c === 'r' ? `<div class="x" style="position:absolute;inset:0;border-radius:inherit;background:rgba(244,246,249,calc(var(--hl,0)*.55))"></div>
        <div class="x" style="position:absolute;left:30px;right:30px;top:50%;height:12px;background:var(--red);border-radius:6px;transform:rotate(-6deg) scaleX(var(--hl,0))"></div>` : ''}</div>` });
    link({ a: { x: X(0), y: Y(0) }, b: { x: X(dx * .62), y: Y(dy * .62) }, in: t0 - .1, dur: .8, soft: c === 'r', w: 8, bend: .18, z: -10 });
  });

  flyTo('k01', { x: X(0), y: Y(-1800), d: 2400 });
  cam({ t: T(C('tools')) - .3, dur: 1.4, x: X(0), y: Y(0), d: 4300, ease: 'smooth', rx: 4, ry: 2, push: .05 });
  tools.forEach(([cue, , , , dx, dy], i) => cam({ t: T(C(cue)) - .3, dur: 1.0, x: X(dx * .9), y: Y(dy * .9), d: 2300, ease: 'whip', rx: 3, ry: i % 2 ? -5 : 5, push: .05 }));
})();
