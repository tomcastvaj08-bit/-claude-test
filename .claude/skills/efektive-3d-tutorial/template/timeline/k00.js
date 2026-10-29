// K00 · Úvod: výsledek hraje BEZ ZVUKU a hlas přes něj rovnou představuje, o čem dnešek je → hub → štítky na slova → odjezd na celou mapu.
// Žádná vložka s původním zvukem na začátku (uživatel: „ne že tam hraje jen hudba a video“). Výsledek: project.json "intro": {"src": "final", "a": 0, "b": 10}.
(() => {
  const { T, AT, cam } = ENGINE;
  const { has, player, thumbs, OV } = L;
  const CFG = window.CFG || {}, M = window.MEDIA || {};
  const r = W.rng(11);

  // 1) výsledek uprostřed, němý, smyčka po celou dobu prvního odstavce (hlas mluví přes něj)
  const it = CFG.intro, med = it && M[it.src];
  const vert = med && med.h > med.w;                       // video na výšku (9:16) -> užší přehrávač, kamera dál
  const PW = vert ? 900 : 1600, PH = med ? Math.round(PW * med.h / med.w) : 900;
  if (med) {
    player(it.src, { id: 'intro', x: 0, y: -2600, w: PW, a: it.a || 0, b: it.b ?? med.dur, loop: true, seqStart: .2, in: .2, dur: 1.2, anim: 'deep', dof: false });
    W.html({ x: PW / 2 - 120, y: -2600 - PH / 2 - 60, z: 40, w: 240, h: 110, in: .8, anim: 'pop',
      html: `<div style="display:flex;justify-content:center"><span class="mpill" style="font-size:44px;padding:12px 28px;background:var(--ink);color:#fff">AI</span></div>` });
  }

  // 2) hub: karta tutoriálu (přepiš název a lead per projekt)
  W.card({ id: 'hub', x: 0, y: 0, z: 60, w: 2000, in: T('k00.map') - .4, kicker: 'Patreon · tutoriál', kc: 'b',
    title: 'Jedno plátno.<br><span class="gr">Žádné slidy.</span>', lead: 'Kamera létá mezi věcmi, grafika naskakuje <b>přesně na slova</b>.' });

  // 3) galaxie náhledů + koule
  thumbs.slice(0, 60).forEach((src) => {
    const ang = r() * Math.PI * 2, rad = 3600 + r() * 7800;
    W.img({ x: Math.cos(ang) * rad * 1.25, y: Math.sin(ang) * rad * .8, z: -400 - r() * 5200, w: vert ? 270 : 480, h: vert ? 480 : 270, src,
      in: 1 + r() * 6, anim: 'deep', rz: (r() - .5) * 10, float: 20, alpha: .95 });
  });
  for (let i = 0; i < 26; i++) { const w = 300 + r() * 700; W.sphere({ x: (r() - .5) * 30000, y: (r() - .5) * 18000, z: -3000 - r() * 9000, w, h: w, color: r() > .55 ? 'green' : 'blue', in: r() * 3 }); }

  // ---------- kamera: na výsledku celý první odstavec (slow push), pak hub, mapa ----------
  const dV = Math.max(PW / 1920, PH / 1080) * 1600 * 1.15;  // celé video v záběru i s rezervou
  cam({ t: 0, x: 0, y: -2600, d: dV * 1.15 });
  cam({ t: .2, dur: (has('k00.map') ? T('k00.map') : 8) - .8, x: 0, y: -2600, d: dV * .95, ease: 'linear', push: 0 });
  if (has('k00.map')) {
    cam({ t: T('k00.map') - .6, dur: 1.4, x: 0, y: 150, d: 2700, ease: 'whip', rx: 4, ry: -4, push: .06 });
    cam({ t: T('k00.map') + 2.5, dur: 4.6, x: OV.x, y: OV.y, d: OV.d, ease: 'smooth', rx: 14, ry: -4, push: .02 });
  }
  if (has('k00.go')) cam({ t: T('k00.go') - .6, dur: 1.6, x: 0, y: 100, d: 5200, ease: 'smooth', rx: 5, ry: 2, push: .03 });
})();
