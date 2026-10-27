// K08 · Výsledek a outro: 100 komentářů za první den, DM lavina, FOLLOW → KOMENTÁŘ → TUTORIÁL, odjezd na mapu, závěrečná karta.
(() => {
  const { T, AT, cam, node, clamp, ease } = ENGINE;
  const { A, CH, flyTo, OV } = L;
  const o = A.k08, X = v => o.x + v, Y = v => o.y + v, C = n => 'k08.' + n;
  const r = W.rng(808);

  W.card({ x: X(-1200), y: Y(-2100), w: 1900, in: CH('k08') + 1.0, kicker: 'Výsledek', kc: 'g', title: 'Den <span class="gr">první</span>' });

  const tRes = AT(C('res'), 'sto');
  W.html({ x: X(-1200), y: Y(-700), z: 60, w: 2000, h: 560, in: T(C('res')), anim: 'tilt',
    update: (n, t) => { n.el.querySelector('.cn').textContent = Math.round(100 * ease('out', clamp((t - tRes) / 1.6))); },
    html: `<div class="card" style="height:100%;padding:40px 50px;display:flex;align-items:center;gap:36px"><span style="font:700 70px var(--sans);color:var(--muted)">~</span><span class="cn bignum" style="font-size:280px;color:var(--green)">0</span>
      <div><div style="font:650 64px var(--sans)">komentářů</div><div style="font:500 32px var(--mono);color:var(--muted);margin-top:8px">za první den</div></div></div>` });

  // DM lavina
  const msgs = ['pošli tutoriál', 'TUTORIÁL???', 'kde je link', 'pošli to', 'nepřišlo mi nic', 'haloooo', 'tutorial pls', '???', 'proč mi to neposíláš', 'pošli mi to taky'];
  const tDm = T(C('dm'));
  for (let i = 0; i < 22; i++) {
    const ang = r() * Math.PI * 2, rad = 900 + r() * 1300;
    W.html({ x: X(1700 + Math.cos(ang) * rad * 1.3), y: Y(-900 + Math.sin(ang) * rad * .8), z: 40 + r() * 200, w: 1200, h: 170, in: tDm + .15 + i * .12, anim: 'pop', rz: (r() - .5) * 10, float: 10,
      html: `<div style="display:flex;justify-content:center"><span style="background:${i % 3 ? '#fff' : 'var(--blue)'};color:${i % 3 ? 'var(--ink)' : '#fff'};border:2px solid var(--line);border-radius:40px 40px 40px 8px;padding:22px 36px;font:550 58px var(--sans);box-shadow:0 14px 30px rgba(10,13,20,.10);white-space:nowrap">${msgs[i % msgs.length]}</span></div>` });
  }
  W.callout({ x: X(1700), y: Y(600), z: 260, w: 2100, in: AT(C('dm'), 'follow'), c: 'r', lab: 'Podmínka', txt: 'aby tutoriál přišel, <b>nejdřív follow</b> · stojí to tam velkým písmem' });

  // pořadí
  const steps = [['Follow', 'FOLLOW'], ['Komentář', 'KOMENTÁŘ'], ['Tutoriál', 'TUTORIÁL']];
  steps.forEach(([w, txt], i) => W.html({ x: X(-1900 + i * 2100), y: Y(1700), z: 120, w: 2000, h: 420, in: AT(C('order'), w), anim: 'pop',
    html: `<div class="card" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;${i === 2 ? 'background:var(--blue);color:#fff' : ''}">
      <span style="font:600 50px var(--mono);opacity:.6">${i + 1}.</span><span style="font:800 120px var(--sans);letter-spacing:-.05em">${txt}</span></div>` }));
  W.html({ x: X(200), y: Y(2250), z: 140, w: 1600, h: 120, in: AT(C('order'), 'Věřím'), anim: 'rise',
    html: `<div style="text-align:center;font:600 60px var(--sans)">Věřím ti. 🙂</div>` });

  // závěrečná karta
  node({ id: 'endcard', x: OV.x, y: OV.y, z: 9000, w: 52000, h: 15600, in: T(C('end')) - .4, anim: 'fade', dur: 1.2, dof: false,
    html: `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1500px">
      <div style="font:700 6200px var(--sans);letter-spacing:-.06em;line-height:.9;color:var(--ink)">Díky<span style="color:var(--blue)">.</span></div>
      <div style="background:#fff;border:50px solid var(--line);border-radius:5000px;padding:850px 2600px;font:700 2900px var(--sans);letter-spacing:-.04em;color:var(--blue);box-shadow:0 600px 1200px rgba(10,13,20,.12)">efektive<span style="color:var(--green)">.cz</span></div></div>` });

  flyTo('k08', { x: X(-1200), y: Y(-2000), d: 2400 });
  cam({ t: T(C('res')) - .3, dur: 1.2, x: X(-1200), y: Y(-750), d: 2600, ease: 'whip', rx: 2, ry: 4, push: .05 });
  cam({ t: tDm - .3, dur: 1.4, x: X(1600), y: Y(-750), d: 4600, ease: 'whip', rx: 4, ry: -5, push: .05 });
  cam({ t: AT(C('dm'), 'follow') - .4, dur: 1.0, x: X(1700), y: Y(400), d: 3200, ease: 'smooth', rx: 2, ry: -3, push: .05 });
  steps.forEach(([w], i) => cam({ t: AT(C('order'), w) - .3, dur: .8, x: X(-1900 + i * 2100), y: Y(1750), d: 2500, ease: 'whip', rx: 2, ry: i % 2 ? -4 : 4, push: .05 }));
  cam({ t: AT(C('order'), 'Věřím') - .3, dur: 1.2, x: X(200), y: Y(1900), d: 5400, ease: 'smooth', rx: 3, ry: 0, push: .04 });
  cam({ t: T(C('zoomout')) - .2, dur: 5.5, x: OV.x, y: OV.y, d: OV.d * 1.08, ease: 'smooth', rx: 12, ry: -3, push: .02 });
})();
