// K00 · Úvod: přehrání výsledku (pokus 2, původní zvuk) → hub → originál vs. výsledek → odjezd na celou mapu.
(() => {
  const { T, AT, cam } = ENGINE;
  const { INS, has, player, thumbs, OV } = L;
  const r = W.rng(17);

  const ins = INS('k00.hook');
  player('pokus2', { id: 'srcplayer', x: 0, y: -2600, w: 900, a: ins.a, b: ins.b, loop: false, seqStart: ins.t, in: .25, dur: 1.4, anim: 'deep', dof: false });
  W.html({ x: 330, y: -3330, z: 40, w: 260, h: 110, in: .9, anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill" style="font-size:44px;padding:12px 28px;background:var(--ink);color:#fff">AI</span></div>` });

  W.card({ id: 'hub', x: 0, y: -250, z: 60, w: 2000, in: T('k00.hook') + .2, kicker: 'Higgsfield · Nano Banana 2.1 + Genjutsu', kc: 'b',
    title: 'Výměna <span class="gr">postavy</span> ve videu', lead: '10 s z obchodu · <b>jeden člověk vyměněný</b> · všechno ostatní stejné' });

  const tPair = T('k00.pair');
  player('original', { x: -560, y: 1700, z: 20, w: 900, a: 0, b: 9.8, loop: true, seqStart: tPair, in: tPair - .3, anim: 'flip', dof: false });
  player('pokus2', { x: 560, y: 1700, z: 20, w: 900, a: 0, b: 9.8, loop: true, seqStart: tPair, in: tPair - .1, anim: 'flip', dof: false });
  [[-560, 'originál', ''], [560, 'výsledek · AI', 'g']].forEach(([x, t, c], i) => W.html({ x, y: 2620, z: 60, w: 900, h: 110, in: tPair + .2 * i, anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="kick ${c}" style="font-size:38px"><span class="d"></span>${t}</span></div>` }));
  ['já', 'obchod', 'kamera', 'pohyb'].forEach((w, i) =>
    W.html({ x: -1500 + i * 1000, y: 2900, z: 140, w: 900, h: 150, in: AT('k00.pair', w), anim: 'pop', float: 6,
      html: `<div style="display:flex;justify-content:center"><span class="mpill g" style="font-size:52px;padding:16px 36px 16px 26px;gap:16px"><span class="d" style="width:16px;height:16px"></span>${w} ✓</span></div>` }));

  thumbs.slice(0, 36).forEach((src) => {
    const ang = r() * Math.PI * 2, rad = 3600 + r() * 7800;
    W.img({ x: Math.cos(ang) * rad * 1.25, y: Math.sin(ang) * rad * .8, z: -400 - r() * 5200, w: 270, h: 480, src,
      in: T('k00.hook') + .4 + r() * 6, anim: 'deep', rz: (r() - .5) * 10, float: 20, alpha: .95 });
  });
  for (let i = 0; i < 26; i++) { const w = 300 + r() * 700; W.sphere({ x: (r() - .5) * 30000, y: (r() - .5) * 18000, z: -3000 - r() * 9000, w, h: w, color: r() > .55 ? 'green' : 'blue', in: T('k00.hook') + r() * 3 }); }

  cam({ t: 0, x: 0, y: -2570, d: 3400 });
  cam({ t: .2, dur: 2.0, x: 0, y: -2600, d: 3250, ease: 'out', push: 0 });
  cam({ t: ins.t, dur: ins.dur, x: 0, y: -2600, d: 3000, ease: 'linear', push: 0 });
  cam({ t: T('k00.hook') - .4, dur: 1.6, x: 0, y: -150, d: 2600, ease: 'whip', rx: 4, ry: -4, push: .06 });
  cam({ t: tPair - .4, dur: 1.4, x: 0, y: 2050, d: 3700, ease: 'whip', rx: 3, ry: 4, push: .05 });
  cam({ t: T('k00.map') - .2, dur: 4.6, x: OV.x, y: OV.y, d: OV.d, ease: 'smooth', rx: 14, ry: -4, push: .02 });
  if (has('k00.go')) cam({ t: T('k00.go') - .6, dur: 1.6, x: 0, y: 100, d: 5200, ease: 'smooth', rx: 5, ry: 2, push: .03 });
})();
