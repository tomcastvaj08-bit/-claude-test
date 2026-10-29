// K05 · Krok 4: Fotky z Higgsfieldu – Pinterest ✕ (autorská práva) → GPT Image 9:16, pět skutečných generací p0–p4, upscale, 1,25 kreditu.
(() => {
  const { T, AT, cam, clamp, ease } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { IMG, pill, big } = U;
  const o = A.k05, X = v => o.x + v, Y = v => o.y + v, C = n => 'k05.' + n;

  W.card({ x: X(-1200), y: Y(-2450), w: 1900, in: CH('k05') + 1.0, kicker: 'Krok 04', kc: 'b', title: 'Fotky <span class="gr">z Higgsfieldu</span>' });

  const p = C('pin');
  W.html({ x: X(-2100), y: Y(-1450), z: 40, w: 1100, h: 420, in: AT(p, 'Pinterest'), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;position:relative">
      <div style="font:800 110px var(--sans);letter-spacing:-.05em;color:#E60023">Pinterest</div><div style="font:500 36px var(--mono);color:var(--muted)">autorská práva</div>
      <div class="x" style="position:absolute;inset:0;display:grid;place-items:center;opacity:var(--hl,0)"><div style="font:800 300px/1 var(--sans);color:var(--red)">✕</div></div></div>`,
    fx: [{ t: AT(p, 'autorským'), sel: '.x' }] });
  W.html({ x: X(-300), y: Y(-1450), z: 40, w: 1900, h: 420, in: AT(p, 'Higgsfieldu'), anim: 'flip',
    html: `<div class="card" style="height:100%;padding:44px 50px;display:flex;align-items:center;gap:34px">${logo('higgsfield', 130)}
      <div><div style="font:650 66px var(--sans);letter-spacing:-.04em">Higgsfield</div><div style="font:500 38px var(--mono);color:var(--muted);margin-top:10px">gpt_image_2_5 · 9:16 · niche Pinterest styl</div></div></div>` });

  // pět fotek se zkráceným promptem
  const ph = C('photos');
  const P = [['Ruka', 'hand holding a smartphone in a dark room at night'], ['Prázdný', 'empty vintage leather armchair under one hard spotlight'],
    ['Nekonečný', 'endless rows of identical grey suits on chrome racks'], ['Ruce', "tailor's hands marking navy wool with white chalk"], ['otevřená', 'open vintage book, thin blue satin ribbon bookmark']];
  const PXs = i => X(-2600 + i * 1300);
  P.forEach(([w, pr], i) => {
    W.img({ x: PXs(i), y: Y(250), z: 30, w: 620, h: 1108, src: IMG(i), in: AT(ph, w), anim: 'flip', dof: false, float: 6 });
    W.html({ x: PXs(i), y: Y(1000), z: 60, w: 1180, h: 240, in: AT(ph, w) + .25, anim: 'rise',
      html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;gap:10px"><span class="mpill b" style="font-size:36px;padding:10px 22px">p${i}</span>
        <div style="font:500 30px/1.35 var(--mono);color:var(--ink2);text-align:center">„${pr}…“</div></div>` });
  });

  // upscale + cena
  const u = C('upscale');
  W.html({ x: X(1850), y: Y(-1450), z: 60, w: 2100, h: 420, in: AT(u, 'malým'), anim: 'tilt',
    update: (n, t) => { const k = ease('out', clamp((t - AT(u, 'zvětšil')) / 1.2)); n.el.querySelector('.b2').style.transform = `scale(${.7 + .3 * k})`; n.el.querySelector('.b2').style.opacity = .2 + .8 * k; },
    html: `<div class="card" style="height:100%;padding:40px 50px;display:flex;align-items:center;justify-content:space-around">
      <div style="text-align:center"><div style="width:113px;height:202px;margin:0 auto;border:4px solid var(--muted);border-radius:12px"></div><div style="font:600 40px var(--mono);margin-top:14px">752×1344</div></div>
      <div style="font:700 80px var(--sans);color:var(--blue)">→</div>
      <div class="b2" style="text-align:center"><div style="width:162px;height:288px;margin:0 auto;border:5px solid var(--green);border-radius:14px;background:var(--green-soft)"></div><div style="font:700 40px var(--mono);margin-top:14px;color:var(--green-ink)">1080×1920 · ffmpeg</div></div></div>` });
  W.html({ x: X(1850), y: Y(-2400), z: 80, w: 1400, h: 520, in: AT(u, 'stálo'), anim: 'pop', html: big('1,25', 'kreditu · Higgsfield celkem', 260) });

  flyTo('k05', { x: X(-1200), y: Y(-2300), d: 2400 });
  cam({ t: T(p) + .3, dur: 1.3, x: X(-1150), y: Y(-1500), d: 3200, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  [0, 1, 2, 3, 4].forEach(i => cam({ t: AT(ph, P[i][0]) - .35, dur: i ? 1.0 : 1.3, x: PXs(i) + (i === 4 ? -300 : 300), y: Y(450), d: 3000, ease: i ? 'smooth' : 'whip', rx: 3, ry: i % 2 ? 4 : -4, push: .04 }));
  cam({ t: T(u) - .3, dur: 1.3, x: X(1850), y: Y(-1900), d: 3200, ease: 'whip', rx: 4, ry: -5, push: .05 });
})();
