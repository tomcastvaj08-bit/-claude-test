// K00 · Úvod: celý Reel → co je na něm → „udělala to AI“ → odjezd na celou mapu → meta: tohle je kód.
(() => {
  const { T, AT, cam, link, node } = ENGINE;
  const { A, INS, thumb, player } = L;
  const ins = INS('k00.reel'), end = ins.t + ins.dur;
  const r = W.rng(11);

  // 1) přehrávač reelu uprostřed plátna
  player({ id: 'reelplayer', x: 0, y: 0, z: 0, w: 1600, h: 900, a: 0, b: 42.29, loop: false, seqStart: ins.t, in: .25, dur: 1.4, anim: 'deep', dof: false });
  W.html({ x: 0, y: -520, z: 20, w: 900, h: 70, in: .8, anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="mpill"><span class="d"></span>Aktualita #1 · Instagram Reel · 42 s</span></div>` });

  // 2) z čeho je složený (chips s náhledy kolem přehrávače)
  const parts = [
    ['postavička', 'Kreslená postavička', 1.5, -1700, -330], ['kafe', 'Kafe ve slow motion', 3.0, -1760, 60],
    ['přechod', '3D přechod', 6.1, -1650, 450], ['motion', 'Motion grafika', 14, 1700, -420],
    ['hudba', 'Hudba', 20, 1640, -90], ['zvuky', 'Zvuky', 29, 1740, 240], ['hlas', 'Hlas', 35, 1650, 570],
  ];
  parts.forEach(([w, label, tt, x, y], i) => W.chip({ x, y, z: 120 + (i % 3) * 90, w: 640, h: 90, s: 1.9, text: label, icon: thumb(tt), in: AT('k00.reel', w, w === 'motion' ? 2 : 1), float: 10 }));

  // 3) „Celý tohle video udělala AI“ – hub
  W.card({ id: 'hub', x: 0, y: 1550, z: 60, w: 2000, in: T('k00.ai'), kicker: 'Patreon · tutoriál · Teecee', kc: 'b',
    title: 'Celý Reel udělala <span class="gr">AI.</span><br>Já jen mluvil.', lead: 'Scénář, obrázky, video, hlas, zvuky, střih i render. <b>16 kroků</b>, každý prompt, každá chyba.' });
  ['scénář', 'obrázky', 'video', 'hlas', 'zvuky', 'střih', 'render'].forEach((w, i) =>
    W.html({ x: (i < 4 ? -1230 + i * 820 : -820 + (i - 4) * 820), y: i < 4 ? 2260 : 2470, z: 140, w: 780, h: 150, in: AT('k00.ai', w, w === 'video' ? 2 : 1), anim: 'pop', float: 6,
      html: `<div style="display:flex;justify-content:center"><span class="mpill b" style="font-size:60px;padding:20px 44px 20px 30px;gap:20px"><span class="d" style="width:18px;height:18px"></span>${w}</span></div>` }));
  // moje reálné hlasové poznámky
  [['„dej do toho 110 %“', -1380, 3050, 'psal'], ['„čím rychlejší, tím lepší“', 0, 3260, 'diktoval'], ['„takhle ne, vrať to“', 1380, 3050, 'hlasem']].forEach(([q, x, y, w]) =>
    W.html({ x, y, z: 200, w: 1350, h: 260, in: AT('k00.ai', w), anim: 'tilt', float: 12,
      html: `<div class="quote" style="padding:40px 50px;border-radius:32px"><div class="who" style="font-size:24px"><span class="av" style="width:38px;height:38px"></span>Teecee · hlasová poznámka</div><div class="q" style="font-size:56px;margin-top:12px">${q}</div></div>` }));

  // 4) galaxie náhledů kolem hubu (paralaxa do hloubky)
  const pool = [];
  for (let i = 1; i <= 84; i += 1) pool.push(`../assets/thumbs/t_${String(i).padStart(3, '0')}.jpg`);
  ['laptop', 'nap', 'newspaper', 'notebook', 'phone'].forEach(n => [1, 2, 3].forEach(k => pool.push(`../assets/thumbs/c_${n}_${k}.jpg`)));
  pool.forEach((src, i) => {
    const ang = r() * Math.PI * 2, rad = 3600 + r() * 7800;
    W.img({ x: Math.cos(ang) * rad * 1.25, y: Math.sin(ang) * rad * .8, z: -400 - r() * 5200, w: 480, h: 270, src,
      in: T('k00.ai') + .4 + r() * 6, anim: 'deep', rz: (r() - .5) * 10, float: 20, alpha: .95 });
  });
  for (let i = 0; i < 26; i++) { const w = 300 + r() * 700; W.sphere({ x: (r() - .5) * 30000, y: (r() - .5) * 18000, z: -3000 - r() * 9000, w, h: w, color: r() > .55 ? 'green' : 'blue', in: T('k00.ai') + r() * 3 }); }

  // 5) co všechno uvidíš (kolem hubu po návratu z přehledu)
  [['prompty', 'Všechny prompty', -780, -2200], ['čísla', 'Všechna čísla', 780, -2200], ['kreditů', 'Kolik co stálo', -780, -1480], ['chyby', 'Všechny chyby', 780, -1480]].forEach(([w, txt, x, y], i) =>
    W.card({ x, y, z: 260, w: 1440, in: AT('k00.map', w), anim: 'fly', kicker: ['prompty', 'čísla', 'kredity', 'chyby'][i], kc: i === 3 ? 'r' : 'b', title: txt, size: 96 }));

  // 6) meta: „tohle je kód“ – skutečný kus timeline tohohle videa
  const code = [
    `<span style="color:#8A93A6">// přelet kamery na další kapitolu</span>`,
    `<span style="color:#13B97A">cam</span>({ t: <span style="color:#1F4DFF">T</span>(<span style="color:#C2410C">'k00.go'</span>), dur: <span style="color:#7C3AED">2.3</span>,`,
    `      x: A.k01.x, y: A.k01.y, d: <span style="color:#7C3AED">2600</span>,`,
    `      ease: <span style="color:#C2410C">'whip'</span>, rx: <span style="color:#7C3AED">4</span>, ry: <span style="color:#7C3AED">-6</span> });`,
    ``,
    `<span style="color:#8A93A6">// karta naskočí přesně na slovo v hlase</span>`,
    `W.<span style="color:#13B97A">card</span>({ in: <span style="color:#1F4DFF">AT</span>(<span style="color:#C2410C">'k00.ai'</span>, <span style="color:#C2410C">'AI'</span>), title: <span style="color:#C2410C">'Celý Reel…'</span> });`,
  ];
  W.html({ id: 'code', x: 4400, y: 300, z: 0, w: 1900, h: 700, ry: -14, in: T('k00.meta') - .3, anim: 'flip',
    fx: code.map((_, i) => ({ t: AT('k00.meta', 'kód', 1) + i * .12, sel: '.cl' + i })),
    html: `<div class="prompt" style="font-size:34px;line-height:1.6"><div class="ph"><span>timeline/k00.js</span><span>tohle video</span></div>${code.map((c, i) => `<span class="l cl${i}">${c || ' '}</span>`).join('')}</div>` });
  W.html({ x: 4400, y: -380, z: 120, w: 1200, h: 130, ry: -14, in: AT('k00.meta', 'kód'), anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="btn">Není to After Effects. Je to kód. <span class="ar">→</span></span></div>` });

  // ---------- kamera ----------
  const { OV } = L;
  cam({ t: 0, x: 0, y: 30, d: 1700, rx: 0, ry: 0 });
  cam({ t: .2, dur: 2.0, x: 0, y: 0, d: 1560, ease: 'out', push: 0 });
  cam({ t: ins.t, dur: ins.dur, x: 0, y: 0, d: 1370, ease: 'linear', push: 0 });   // pomalý push přes celý reel
  cam({ t: end + .2, dur: 2.0, x: 0, y: 60, d: 4300, ease: 'smooth', rx: 4, ry: 5, push: .06 });
  cam({ t: T('k00.ai') - .3, dur: 1.5, x: 0, y: 1750, d: 2350, ease: 'whip', rx: -4, ry: -4, push: .06 });
  cam({ t: AT('k00.ai', 'scénář') - .4, dur: 1.2, x: 0, y: 2050, d: 2900, ease: 'smooth', rx: 3, ry: 2 });
  cam({ t: AT('k00.ai', 'psal') - .5, dur: 1.4, x: 0, y: 2900, d: 3900, ease: 'smooth', rx: 7, ry: 3 });
  // velký odjezd: celá mapa
  cam({ t: T('k00.map') - .2, dur: 4.6, x: OV.x, y: OV.y, d: OV.d, ease: 'smooth', rx: 14, ry: -4, push: .02 });
  cam({ t: AT('k00.map', 'prompty') - 1.9, dur: 2.6, x: 0, y: -1840, d: 3500, ease: 'smooth', rx: 3, ry: -3, push: .04 });
  cam({ t: T('k00.meta') - .4, dur: 2.0, x: 4650, y: 120, d: 2500, ease: 'whip', rx: 2, ry: 12, push: .05 });
  cam({ t: AT('k00.meta', 'kód') - .2, dur: 1.2, x: 4600, y: 200, d: 2250, ease: 'smooth', ry: 10, push: .03 });
})();
