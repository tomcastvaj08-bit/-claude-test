// K07 · Krok 6: CapCut na telefonu – překrytí Genjutsu přes originál, tři kousky hlasu napasované, SFX lusknutí, export (hotové video 5–8 s).
(() => {
  const { T, AT, cam, clamp, ease } = ENGINE;
  const { A, CH, flyTo, player, logo } = L;
  const o = A.k07, X = v => o.x + v, Y = v => o.y + v, C = n => 'k07.' + n;

  W.card({ x: X(-1700), y: Y(-2200), w: 1900, in: CH('k07') + 1.0, kicker: 'Krok 06', kc: 'b', title: 'CapCut <span class="gr">na telefonu</span>' });

  // telefon s náhledem
  W.html({ x: X(-2600), y: Y(400), z: 10, w: 1250, h: 2500, in: T(C('s6')) + .2, anim: 'rise',
    html: `<div style="height:100%;border-radius:150px;background:var(--night);padding:46px;box-shadow:0 60px 120px rgba(10,13,20,.25)"><div style="height:100%;border-radius:110px;background:#1A1F2B;display:flex;flex-direction:column;align-items:center;padding-top:60px">
      <div style="display:flex;align-items:center;gap:20px">${logo('capcut', 70)}<span style="color:#fff;font:600 44px var(--sans)">CapCut</span></div></div></div>` });
  player('genjutsu', { x: X(-2600), y: Y(-300), z: 30, w: 1100, a: 0, b: 6, loop: true, seqStart: T(C('overlay')), in: T(C('overlay')), anim: 'fade', dof: false });

  // stopy
  const DW = 2700, tracks = [['overlay', 'video 2 · Genjutsu (překrytí)', '#13B97A'], ['overlay', 'video 1 · originál', '#1F4DFF']];
  const tMatch = T(C('match'));
  W.html({ x: X(1100), y: Y(300), z: 30, w: 3600, h: 1300, in: T(C('overlay')) - .2, anim: 'tilt',
    fx: [{ t: AT(C('overlay'), 'překrytí'), sel: '.v2' }, { t: T(C('sfx')), sel: '.sfx' }],
    html: `<div class="card" style="height:100%;padding:40px 46px"><span class="kick b"><span class="d"></span>timeline</span>
      <div style="margin-top:30px;display:flex;flex-direction:column;gap:18px">
        <div class="v2" style="display:flex;align-items:center;opacity:calc(.15 + var(--hl,0)*.85)"><div style="width:700px;font:600 30px var(--sans);color:#13B97A">${tracks[0][1]}</div><div style="width:${DW}px;height:110px;border-radius:14px;background:#13B97A"></div></div>
        <div style="display:flex;align-items:center"><div style="width:700px;font:600 30px var(--sans);color:#1F4DFF">${tracks[1][1]}</div><div style="width:${DW}px;height:110px;border-radius:14px;background:#1F4DFF;opacity:.5"></div></div>
        <div style="display:flex;align-items:center"><div style="width:700px;font:600 30px var(--sans);color:var(--ink2)">hlas · 3 kousky</div><div class="vo" style="position:relative;width:${DW}px;height:110px">
          ${['#1F4DFF', '#13B97A', '#F07A1A'].map((c, i) => `<div class="k${i}" style="position:absolute;top:0;height:110px;border-radius:14px;background:${c};opacity:.9"></div>`).join('')}</div></div>
        <div class="sfx" style="display:flex;align-items:center;opacity:calc(.1 + var(--hl,0)*.9)"><div style="width:700px;font:600 30px var(--sans);color:var(--red)">SFX · lusknutí</div><div style="position:relative;width:${DW}px;height:110px">
          <div style="position:absolute;left:${DW * .64}px;width:120px;height:110px;border-radius:14px;background:var(--red)"></div></div></div></div></div>`,
    update: (n, t) => {
      const p = ease('smooth', clamp((t - tMatch - .6) / 1.6)), B = [[0, .34], [.34, .63], [.63, .97]], off = [0, 160, 340];
      B.forEach(([a, b], i) => { const el = n.el.querySelector('.k' + i); el.style.left = (a * DW + (1 - p) * off[i]) + 'px'; el.style.width = ((b - a) * DW - 8) + 'px'; el.style.opacity = clamp((t - tMatch - i * .25) / .3) * .9; });
    } });

  W.html({ x: X(1100), y: Y(1350), z: 90, w: 2600, h: 160, in: AT(C('match'), 'pusy'), anim: 'pop',
    html: `<div style="text-align:center;font:650 56px var(--sans);letter-spacing:-.04em">každý kousek zvlášť → <span class="gr">sedí na pohyb pusy</span></div>` });
  W.html({ x: X(2200), y: Y(-850), z: 120, w: 1300, h: 260, in: T(C('sfx')), anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill r" style="font-size:64px;padding:22px 48px;color:var(--red)"><span class="d"></span>SFX = atmosféra</span></div>` });

  // export: přechod v hotovém videu (Domča → já), lusknutí
  player('final', { x: X(1100), y: Y(2550), z: 40, w: 2200, a: 4.6, b: 8.4, loop: false, seqStart: T(C('exp.ins')), in: T(C('exp')) - .3, anim: 'pop', dof: false });
  W.html({ x: X(1100), y: Y(3330), z: 60, w: 1400, h: 120, in: T(C('exp')) + .3, anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="btn" style="font-size:40px">Export <span class="ar">↓</span></span></div>` });

  flyTo('k07', { x: X(-1700), y: Y(-2100), d: 2400 });
  cam({ t: T(C('overlay')) - .3, dur: 1.4, x: X(0), y: Y(150), d: 5200, ease: 'smooth', rx: 4, ry: 4, push: .05 });
  cam({ t: tMatch - .3, dur: 1.2, x: X(1100), y: Y(500), d: 3600, ease: 'whip', rx: 3, ry: -4, push: .05 });
  cam({ t: T(C('sfx')) - .3, dur: 1.1, x: X(1300), y: Y(100), d: 3900, ease: 'whip', rx: 2, ry: 5, push: .05 });
  cam({ t: T(C('exp')) - .4, dur: 1.2, x: X(1100), y: Y(2700), d: 2700, ease: 'whip', rx: 0, ry: -3, push: .04 });
  cam({ t: T(C('exp.ins')), dur: 3.8, x: X(1100), y: Y(2550), d: 2050, ease: 'linear', rx: 0, ry: 0, push: 0 });
})();
