// K00 · Úvod: výsledná videa nejsou → telefon 9:16 se střídajícími se fotkami v1 + obří 3D „AI TIP #01“, štítky na slova, v1 / v2 → hub → mapa.
(() => {
  const { T, AT, cam, clamp, ease } = ENGINE;
  const { has, OV } = L;
  const { IMG, pill, extrude } = U;
  const r = W.rng(11), C = n => 'k00.' + n, H = C('hook');

  // 1) telefon 9:16, fotky v1 se střídají (crossfade + pomalý zoom), vše jen z času t
  const PX = -1750, PY = -2600, PW = 700, PHh = 1244, t0 = .2, per = 1.7;
  W.html({ id: 'phone', x: PX, y: PY, z: 30, w: PW + 44, h: PHh + 44, in: .1, dur: 1.2, anim: 'deep', ry: 8,
    html: `<div style="height:100%;border-radius:84px;background:#0A0D14;padding:22px;box-shadow:0 60px 120px rgba(10,13,20,.35)">
      <div style="position:relative;height:100%;border-radius:64px;overflow:hidden;background:#000">
      ${[0, 1, 2, 3, 4].map(i => `<img class="ph${i}" src="${IMG(i)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0">`).join('')}
      <div style="position:absolute;left:50%;top:22px;width:180px;height:44px;margin-left:-90px;border-radius:30px;background:#0A0D14"></div>
      <div style="position:absolute;left:0;right:0;bottom:46px;display:flex;justify-content:center"><span class="mpill" style="font-size:30px;padding:10px 24px;background:rgba(10,13,20,.72);color:#fff;border:0">v1 · AI fotky</span></div></div></div>`,
    update: (n, t) => {
      const k = Math.max(0, t - t0), i = Math.floor(k / per), f = k / per - i;
      for (let j = 0; j < 5; j++) {
        const el = n.el.querySelector('.ph' + j); if (!el) continue;
        let a = 0;
        if (j === i % 5) a = 1; else if (j === (i + 1) % 5 && f > .78) a = ease('smooth', (f - .78) / .22);
        if (j === i % 5 && f > .78) a = 1;
        el.style.opacity = a;
        el.style.transform = `scale(${1.04 + .08 * (j === i % 5 ? f : 0)})`;
      }
    } });

  // 2) obří 3D „AI TIP #01“ – dopadne na slovo „tip“
  const tTip = AT(H, 'tip');
  extrude({ x: 650, y: -2930, z: 40, w: 2900, h: 560, fs: 470, text: 'AI TIP #01', in: tTip - .15, layers: 16, step: 8, anim: 'fly' });
  W.html({ x: 650, y: -3330, z: 60, w: 1600, h: 110, in: tTip + .3, anim: 'rise', html: pill('denní video · free Patreon', 'b', 40) });

  // 3) štítky na slova
  [['deseti', '10–15 s', -250, -2250, ''], ['každej', 'každý den', 600, -2250, ''], ['zdarma', 'zdarma · Patreon', 1600, -2250, 'g'],
   ['Claude', 'Claude Code', 150, -2020, 'b'], ['odpoledne', '1 odpoledne', 1150, -2020, '']].forEach(([w, t, x, y, c]) =>
    W.html({ x, y, z: 90, w: 1000, h: 190, in: AT(H, w), anim: 'pop', float: 5, html: pill(t, c, 64) }));

  // 4) dvě verze
  const tV = AT(H, 'dvou');
  [['První', 'v1', 'AI fotky + 2D grafika', -700, 2], ['druhá', 'v2', 'čistá 3D motion grafika', 1250, -1]].forEach(([w, v, txt, x, img]) =>
    W.html({ x, y: -1420, z: 70, w: 1750, h: 400, in: AT(H, w), anim: 'flip',
      html: `<div class="card" style="height:100%;padding:36px 44px;display:flex;align-items:center;gap:40px">
        ${img >= 0 ? `<div class="pic" style="width:170px;height:300px;flex:none;border-radius:22px"><img src="${IMG(img)}" style="width:100%;height:100%;object-fit:cover"></div>`
          : `<div style="width:170px;height:300px;flex:none;border-radius:22px;background:var(--night);display:grid;place-items:center;perspective:400px"><div style="width:96px;height:96px;background:var(--grad);border-radius:18px;transform:rotateX(28deg) rotateY(-32deg);box-shadow:20px 26px 0 rgba(31,77,255,.35)"></div></div>`}
        <div><div style="font:800 120px/1 var(--sans);letter-spacing:-.05em;${v === 'v2' ? 'background:var(--grad);-webkit-background-clip:text;color:transparent' : ''}">${v}</div>
        <div style="font:600 46px var(--sans);letter-spacing:-.03em;margin-top:14px">${txt}</div></div></div>` }));

  // 5) hub
  W.card({ id: 'hub', x: 0, y: 0, z: 60, w: 2000, in: T(C('map')) - .4, kicker: 'Patreon · celý postup', kc: 'b',
    title: 'AI TIP <span class="gr">#01</span>', lead: 'Denní 3D video v <b>Claude Code</b> · scénář, hlas, zvuky, engine a <b>všechny chyby</b>.' });

  // 6) galaxie fotek + koule
  for (let i = 0; i < 30; i++) {
    const ang = r() * Math.PI * 2, rad = 3600 + r() * 7800, gx = Math.cos(ang) * rad * 1.25, gy = Math.sin(ang) * rad * .8;
    if (gy < -800 && Math.abs(gx) < 4500) continue;   // nad úvodem nic
    W.img({ x: gx, y: gy, z: -400 - r() * 5200, w: 270, h: 480, src: IMG(i % 5),
      in: 1 + r() * 6, anim: 'deep', rz: (r() - .5) * 10, float: 20, alpha: .95 });
  }
  for (let i = 0; i < 26; i++) { const w = 300 + r() * 700; W.sphere({ x: (r() - .5) * 30000, y: (r() - .5) * 18000, z: -3000 - r() * 9000, w, h: w, color: r() > .55 ? 'green' : 'blue', in: r() * 3 }); }

  // ---------- kamera ----------
  cam({ t: 0, x: PX, y: PY, d: 2500, ry: 6 });
  cam({ t: .2, dur: tTip - .6, x: PX + 80, y: PY, d: 2250, ease: 'linear', push: 0 });
  cam({ t: tTip - .45, dur: 1.3, x: -250, y: -2620, d: 3900, ease: 'whip', rx: 4, ry: -6, push: .05 });
  cam({ t: AT(H, 'deseti') - .3, dur: 1.2, x: 650, y: -2500, d: 3300, ease: 'whip', rx: 6, ry: 4, push: .05 });
  cam({ t: AT(H, 'Claude') - .3, dur: 1.2, x: 650, y: -2350, d: 3000, ease: 'smooth', rx: 3, ry: -3, push: .04 });
  cam({ t: tV - .3, dur: 1.3, x: 275, y: -1600, d: 3400, ease: 'whip', rx: 8, ry: 3, push: .05 });
  if (has(C('map'))) {
    cam({ t: T(C('map')) - .6, dur: 1.4, x: 0, y: 150, d: 2700, ease: 'whip', rx: 4, ry: -4, push: .06 });
    cam({ t: T(C('map')) + 2.5, dur: 4.6, x: OV.x, y: OV.y, d: OV.d, ease: 'smooth', rx: 14, ry: -4, push: .02 });
  }
  if (has(C('go'))) cam({ t: T(C('go')) - .6, dur: 1.6, x: 0, y: 100, d: 5200, ease: 'smooth', rx: 5, ry: 2, push: .03 });
})();
