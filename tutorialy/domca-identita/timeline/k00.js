// K00 · Úvod: přehrání hotového videu → hub „Tohle nejsem já“ → originál vs. Genjutsu vedle sebe → štítky na slova → odjezd na celou mapu.
(() => {
  const { T, AT, cam } = ENGINE;
  const { INS, has, player, thumbs, OV } = L;
  const r = W.rng(11);

  // 1) hotové video s původním zvukem (vložka "k00.hook" before)
  const ins = INS('k00.hook');
  player('final', { id: 'srcplayer', x: 0, y: -2600, w: 1600, a: ins.a, b: ins.b, loop: false, seqStart: ins.t, in: .25, dur: 1.4, anim: 'deep', dof: false });
  W.html({ x: 640, y: -3130, z: 40, w: 300, h: 110, in: .9, anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill" style="font-size:44px;padding:12px 28px;background:var(--ink);color:#fff">AI</span></div>` });

  // 2) hub
  W.card({ id: 'hub', x: 0, y: -200, z: 60, w: 2000, in: T('k00.hook') + .2, kicker: 'Patreon · tutoriál', kc: 'b',
    title: 'Tohle <span class="gr">nejsem já.</span>', lead: 'Talking head → <b>jiná identita</b>: obličej, vlasy, pusa i hlas.' });

  // 3) originál vs. výsledek synchronně
  const tPair = T('k00.how');
  player('original', { x: -950, y: 1350, z: 20, w: 1800, a: 0, b: 6, loop: true, seqStart: tPair, in: tPair - .3, anim: 'flip', dof: false });
  player('genjutsu', { x: 950, y: 1350, z: 20, w: 1800, a: 0, b: 6, loop: true, seqStart: tPair, in: tPair - .1, anim: 'flip', dof: false });
  [['-950', 'originál · já', ''], ['950', 'výsledek · AI', 'g']].forEach(([x, t, c], i) => W.html({ x: +x, y: 2000, z: 60, w: 900, h: 110, in: tPair + .2 * i, anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="kick ${c}" style="font-size:36px"><span class="d"></span>${t}</span></div>` }));
  ['Obličej', 'vlasy', 'pusu', 'hlas'].forEach((w, i) =>
    W.html({ x: -1350 + i * 900, y: 2330, z: 140, w: 820, h: 150, in: AT('k00.how', w), anim: 'pop', float: 6,
      html: `<div style="display:flex;justify-content:center"><span class="mpill b" style="font-size:56px;padding:18px 40px 18px 28px;gap:18px"><span class="d" style="width:18px;height:18px"></span>${w.toLowerCase()}</span></div>` }));
  W.html({ x: 0, y: 2650, z: 120, w: 2600, h: 120, in: AT('k00.how', 'pohyby'), anim: 'rise',
    html: `<div style="text-align:center;font:600 54px var(--sans);letter-spacing:-.03em">pohyby, mimika a načasování <span style="color:var(--blue)">zůstaly moje</span></div>` });

  // 4) obraz vs. hlas: třetina práce
  W.html({ x: 0, y: -1250, z: 100, w: 2000, h: 300, in: AT('k00.map', 'Obraz'), anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:36px 46px"><div style="display:flex;justify-content:space-between;font:600 40px var(--sans)"><span>obraz <span style="color:var(--blue)">⅓</span></span><span>hlas <span style="color:var(--green)">⅔</span></span></div>
      <div style="display:flex;height:60px;border-radius:30px;overflow:hidden;margin-top:24px"><div style="flex:1;background:var(--blue)"></div><div style="flex:2;background:var(--green)"></div></div></div>` });

  // 5) galaxie náhledů + koule
  thumbs.slice(0, 40).forEach((src) => {
    const ang = r() * Math.PI * 2, rad = 3600 + r() * 7800;
    W.img({ x: Math.cos(ang) * rad * 1.25, y: Math.sin(ang) * rad * .8, z: -400 - r() * 5200, w: 480, h: 270, src,
      in: T('k00.hook') + .4 + r() * 6, anim: 'deep', rz: (r() - .5) * 10, float: 20, alpha: .95 });
  });
  for (let i = 0; i < 26; i++) { const w = 300 + r() * 700; W.sphere({ x: (r() - .5) * 30000, y: (r() - .5) * 18000, z: -3000 - r() * 9000, w, h: w, color: r() > .55 ? 'green' : 'blue', in: T('k00.hook') + r() * 3 }); }

  // ---------- kamera ----------
  cam({ t: 0, x: 0, y: -2570, d: 1700 });
  cam({ t: .2, dur: 2.0, x: 0, y: -2600, d: 1560, ease: 'out', push: 0 });
  cam({ t: ins.t, dur: ins.dur, x: 0, y: -2600, d: 1370, ease: 'linear', push: 0 });
  cam({ t: T('k00.hook') - .4, dur: 1.6, x: 0, y: -100, d: 2600, ease: 'whip', rx: 4, ry: -4, push: .06 });
  cam({ t: tPair - .4, dur: 1.4, x: 0, y: 1650, d: 3500, ease: 'whip', rx: 3, ry: 4, push: .05 });
  cam({ t: AT('k00.map', 'Obraz') - .4, dur: 1.2, x: 0, y: -1150, d: 2500, ease: 'whip', rx: -2, ry: -3, push: .05 });
  cam({ t: AT('k00.map', 'Zbytek') + .4, dur: 4.6, x: OV.x, y: OV.y, d: OV.d, ease: 'smooth', rx: 14, ry: -4, push: .02 });
  if (has('k00.go')) cam({ t: T('k00.go') - .6, dur: 1.6, x: 0, y: 100, d: 5200, ease: 'smooth', rx: 5, ry: 2, push: .03 });
})();
