// K06 · Krok 5: hlas ze tří částí – nastavení každé části (v4 Robust 75 %, v3 stejně, 2.5 Turbo rychlost ↑), pauzy navíc, napasování pod originál.
(() => {
  const { T, AT, cam, clamp, ease, lerp } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const o = A.k06, X = v => o.x + v, Y = v => o.y + v, C = n => 'k06.' + n;

  W.card({ x: X(-1200), y: Y(-2500), w: 1900, in: CH('k06') + 1.0, kicker: 'Krok 05', kc: 'b', title: 'Hlas ze <span class="gr">tří částí</span>', lead: 'text na řeč · klon · každá část jiný model' });

  // nastavení tří částí
  const parts = [['p1', 'část 1', 'v4 · nejnovější', ['Robust', 'similarity 75 %'], '#1F4DFF'],
    ['p2', 'část 2', 'v3', ['stejné nastavení', 'o kousek rychlejší'], '#13B97A'],
    ['p3', 'část 3', '2.5 Turbo', ['rychlost ↑'], '#F07A1A']];
  parts.forEach(([cue, lab, model, chips, col], i) => W.html({ x: X(-2400 + i * 2400), y: Y(-1000), z: 40, w: 2200, h: 560, in: T(C(cue)), anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:38px 44px;border-top:16px solid ${col}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kick"><span class="d" style="background:${col}"></span>${lab}</span>${logo('elevenlabs', 70)}</div>
      <div style="font:700 80px var(--sans);letter-spacing:-.05em;margin-top:22px">${model}</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:22px">${chips.map(c => `<span class="mpill" style="font-size:34px;padding:10px 22px">${c}</span>`).join('')}</div></div>` }));

  // timeline: originál nahoře, pod ním tři bloky, které se napasují
  const DW = 4400, sx = s => s / 6.2 * DW;
  const B = [[0, 2.1, '#1F4DFF'], [2.1, 3.9, '#13B97A'], [3.9, 6.0, '#F07A1A']];
  const tPause = T(C('pause')), tFit = T(C('parts'));
  W.html({ id: 'tl6', x: X(0), y: Y(650), z: 30, w: 5000, h: 1150, in: T(C('s5')) + .5, anim: 'tilt',
    fx: [{ t: AT(C('pause'), 'pauzy'), sel: '.gap' }],
    html: `<div class="card" style="height:100%;padding:40px 300px 40px 300px;position:relative">
      <div style="position:absolute;left:44px;top:70px;font:600 30px var(--mono);color:var(--muted)">originál</div>
      <div style="height:220px;border-radius:14px;background:#F3F5FA;overflow:hidden"><img src="../assets/wave/original.png" style="width:100%;height:100%"></div>
      ${B.map((b, i) => `<div style="position:absolute;left:44px;top:${370 + i * 190}px;font:600 30px var(--mono);color:${b[2]}">část ${i + 1}</div>
        <div class="b${i}" style="position:absolute;top:${340 + i * 190}px;height:130px;border-radius:16px;background:${b[2]};opacity:0;overflow:hidden;display:flex;align-items:center;gap:0">
          ${i === 0 ? '<div class="gap" style="margin-left:55%;width:calc(var(--hl,0)*18%);height:100%;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.55) 0 12px,transparent 12px 24px)"></div>' : ''}</div>`).join('')}
      <div style="position:absolute;right:44px;bottom:30px;font:500 26px var(--mono);color:var(--muted)">schéma</div></div>`,
    update: (n, t) => {
      const fit = ease('smooth', clamp((t - tFit) / 1.4)), stretch = ease('smooth', clamp((t - tPause) / 1.0)) * (1 - fit);
      B.forEach(([a, b], i) => {
        const el = n.el.querySelector('.b' + i), tin = T(C(parts[i][0]));
        const vis = clamp((t - tin) / .4), off = (1 - fit) * (i === 0 ? 0 : 260 + i * 120);
        const w = sx(b - a) * (i === 0 ? 1 + .35 * stretch : 1);
        el.style.opacity = vis; el.style.left = (300 + sx(a) + off) + 'px'; el.style.width = (w - 8) + 'px';
      });
    } });

  W.callout({ x: X(-1400), y: Y(1900), z: 60, w: 2400, in: AT(C('pause'), 'pauzy'), c: 'o', lab: 'Problém', txt: 'model si dělá <b>vlastní pauzy</b> a nejde popohnat' });
  W.callout({ x: X(1500), y: Y(1900), z: 60, w: 2200, in: T(C('hear')), c: 'g', lab: 'Rozdíl mezi modely', txt: '<b>nepatrný</b> · běžný divák si nevšimne' });

  flyTo('k06', { x: X(-1200), y: Y(-2400), d: 2400 });
  parts.forEach(([cue], i) => cam({ t: T(C(cue)) - .3, dur: 1.1, x: X(-2400 + i * 2400), y: Y(-850), d: 2700, ease: 'whip', rx: 3, ry: i % 2 ? -4 : 4, push: .05 }));
  cam({ t: tPause - .3, dur: 1.4, x: X(0), y: Y(900), d: 4900, ease: 'smooth', rx: 4, ry: -2, push: .04 });
  cam({ t: T(C('p2')) + 3, dur: 1.4, x: X(0), y: Y(300), d: 5600, ease: 'smooth', rx: 4, ry: 2 });
  cam({ t: T(C('hear')) - .3, dur: 1.2, x: X(1500), y: Y(1700), d: 3000, ease: 'whip', rx: 2, ry: -4, push: .05 });
  cam({ t: tFit - .3, dur: 1.5, x: X(0), y: Y(800), d: 4900, ease: 'smooth', rx: 4, ry: 2, push: .04 });
})();
