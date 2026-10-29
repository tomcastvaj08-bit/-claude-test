// K01 · Výsledek: formát, LUFS, téma a čtyři části videa na filmovém pásu.
(() => {
  const { T, AT, cam, link, node, clamp, ease, lerp } = ENGINE;
  const { A, CH, CHEND, reel, thumb, player, flyTo } = L;
  const o = A.k01, X = v => o.x + v, Y = v => o.y + v;

  W.card({ x: X(-1350), y: Y(-1450), w: 1800, in: CH('k01') + 1.2, kicker: 'Výsledek', kc: '',
    title: 'Kam <span class="gr">míříme.</span>', lead: 'Aktualita #1 · <b>Karusely v Instagram Edits</b>' });

  // specifikace jako mono pilulky, každá na své slovo
  const spec = [['šestnácti', '16 : 9'], ['devatenáct', '1920 × 1080'], ['snímků', '24 fps'], ['délka', '42 s'], ['hlasitost', '−14 LUFS']];
  spec.forEach(([w, txt], i) => W.html({ x: X(-2050 + (i % 3) * 700), y: Y(-560 + Math.floor(i / 3) * 170), z: 80, w: 640, h: 120,
    in: i < 4 ? AT('k01.fmt', w) : AT('k01.lufs', w), anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill ${i === 4 ? '' : 'b'}" style="font-size:40px;padding:18px 34px 18px 24px"><span class="d"></span>${txt}</span></div>` }));

  // LUFS metr: ručička jede na „potichu“ → „nahlas“ → −14
  const tQuiet = AT('k01.lufs', 'potichu'), tLoud = AT('k01.lufs', 'nahlas'), tGold = AT('k01.lufs', 'minus', 2);
  const val = t => {
    const k = [[T('k01.lufs'), -30], [tQuiet, -26], [tLoud - .3, -26], [tLoud + .2, -7], [tGold - .3, -7], [tGold + .4, -14]];
    let v = -30;
    for (let i = 0; i < k.length - 1; i++) if (t >= k[i][0]) v = lerp(k[i][1], k[i + 1][1], ease('smooth', (t - k[i][0]) / Math.max(.3, k[i + 1][0] - k[i][0])));
    return t >= k[k.length - 1][0] ? -14 : v;
  };
  const tick = v => (v + 32) / 28 * 100;                       // −32 … −4 LUFS → 0…100 %
  W.html({ x: X(1500), y: Y(-1050), w: 1900, h: 640, in: T('k01.lufs'), anim: 'tilt',
    html: `<div class="card" style="padding:44px 56px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="kick b"><span class="d"></span>Hlasitost · LUFS</span><span class="nv" style="font:600 64px var(--mono);letter-spacing:-.03em;color:var(--ink)"></span></div>
      <div style="position:relative;height:150px;margin-top:60px;border-radius:24px;background:linear-gradient(90deg,#E8ECF3 0%,#E8ECF3 40%,#DAF5E9 52%,#DAF5E9 66%,#FBE3E1 82%,#FBE3E1 100%)">
        <div style="position:absolute;left:${tick(-14)}%;top:-26px;bottom:-26px;width:4px;background:var(--green);border-radius:4px"></div>
        <div class="ndl" style="position:absolute;top:-40px;bottom:-40px;width:10px;margin-left:-5px;background:var(--ink);border-radius:6px;box-shadow:0 6px 16px rgba(10,13,20,.25)"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:46px;font:500 30px var(--mono);color:var(--muted)">
        <span class="zq">moc potichu → přeskočí</span><span class="zg" style="color:var(--green-ink)">−14 zlatá střed</span><span class="zl">moc nahlas → ztlumí</span></div></div>`,
    update: (n, t) => {
      const v = val(t), p = tick(v) + '%';
      n.el.querySelector('.ndl').style.left = p;
      const nv = n.el.querySelector('.nv'); nv.textContent = `${v.toFixed(1).replace('.', ',')} LUFS`;
      n.el.querySelector('.zq').style.color = t > tQuiet && t < tLoud ? 'var(--ink)' : 'var(--muted)';
      n.el.querySelector('.zl').style.color = t > tLoud && t < tGold ? 'var(--red)' : 'var(--muted)';
    } });

  // téma dílu
  W.html({ x: X(1500), y: Y(-50), z: 60, w: 1900, h: 600, in: T('k01.topic'), anim: 'rise',
    html: `<div class="card" style="display:flex;gap:44px;align-items:center;padding:40px 48px">
      <div class="pic" style="width:620px;height:349px;flex:none"><img src="${reel(7.6)}"></div>
      <div><div style="font:800 24px Inter;letter-spacing:.16em;color:#4E9A27">AKTUALITA 01 · 7. ŘÍJNA</div>
      <div style="font-size:64px;font-weight:650;letter-spacing:-.045em;line-height:1.02;margin-top:16px">Instagram Edits nově umí <span class="gr" style="background:var(--grad);-webkit-background-clip:text;color:transparent">karusely</span></div>
      <div style="font:500 26px var(--mono);color:var(--muted);margin-top:18px">týdenní aktualita pro podnikatele</div></div></div>` });

  // časová osa reelu 42 s se čtyřmi barevnými částmi
  const TW = 150, SX = X(-21 * TW), SY = Y(820);
  const segs = [['Hook', 0, 5.6, 'var(--blue)', 'p1'], ['3D', 5.6, 7.0, 'var(--green)', 'p2'], ['Motion grafika', 7.0, 40.0, '#5B82FF', 'p3'], ['Outro', 40.0, 42.3, 'var(--ink)', 'p4']];
  let bar = '';
  for (let s2 = 0; s2 <= 42; s2 += 6) bar += `<div style="position:absolute;left:${s2 * TW}px;top:250px;font:500 40px var(--mono);color:var(--muted);transform:translateX(-50%)">${s2} s</div>`;
  segs.forEach(([lab, a2, b2, col], i) => bar += `<div class="sg sg${i}" style="position:absolute;left:${a2 * TW}px;width:${(b2 - a2) * TW - 10}px;top:110px;height:120px;border-radius:24px;background:${col};
     display:flex;align-items:center;justify-content:center;font:650 ${i === 1 ? 44 : 58}px var(--sans);letter-spacing:-.03em;color:#fff;white-space:nowrap;overflow:hidden">${lab}</div>`);
  W.html({ id: 'strip', x: SX + 21 * TW, y: SY, z: 0, w: 42 * TW, h: 320, in: T('k01.parts'), anim: 'rise',
    html: `<div style="position:relative;width:100%;height:100%">${bar}<div class="ph" style="position:absolute;top:70px;width:10px;height:200px;margin-left:-5px;background:var(--red);border-radius:6px"></div></div>`,
    update: (n, t) => {
      // playhead jede na právě vysvětlovanou část
      let prev = 0, cur = 0, tc = -1e9;
      segs.forEach(([, a2, b2, , cue]) => { if (t >= T('k01.' + cue)) { prev = cur; cur = (a2 + b2) / 2; tc = T('k01.' + cue); } });
      const px = lerp(prev, cur, ease('smooth', (t - tc) / .8));
      n.el.querySelector('.ph').style.left = px * TW + 'px';
      segs.forEach(([, , , , cue], i) => n.el.querySelector('.sg' + i).style.opacity = t >= T('k01.' + cue) || t < T('k01.p1') ? 1 : .3);
    } });

  // detailní karty částí s přehrávačem
  const det = [
    ['p1', 'Hook · ~6 s', 'Spider-Verse postavička v reálné místnosti. Zakopne, kafe letí ve slow motion přesně na <b>7</b>.', 0, 5.6, 1],
    ['p2', '3D přechod', 'Kalendář a grafika = <b>dvě stěny jedné kostky</b>. Kamera se otočí doprava.', 4.6, 7.6, .5],
    ['p3', 'Motion grafika', 'Brand Efektive: <b>Inter</b>, bílá, grafit, modrá, zelená, lesklé koule. Navázané na slova.', 7.0, 40.0, 1.6],
    ['p4', 'Outro', 'Logo <b>efektive.cz</b> a „další aktuality každý týden“.', 39.6, 42.29, 1],
  ];
  det.forEach(([cue, lab, txt, a, b, sp], i) => {
    const cx = X(-2550 + i * 1700), cy = Y(1900);
    player({ x: cx, y: cy, z: 30, w: 1500, h: 844, a, b, speed: sp, seqStart: T('k01.' + cue), in: T('k01.' + cue), anim: 'pop', dof: true });
    W.callout({ x: cx, y: cy + 640, z: 60, w: 1500, in: T('k01.' + cue) + .35, c: ['', 'g', '', 'o'][i], lab, txt });
    link({ a: { x: SX + ((segs[i][1] + segs[i][2]) / 2) * TW, y: SY + 70 }, b: { x: cx, y: cy - 440 }, in: T('k01.' + cue) - .2, dur: .8, soft: true, dot: true, w: 5, bend: .1, z: 10 });
  });

  // brand vzorník u motion grafiky
  [['#386EEE', 'modrá'], ['#86D24C', 'zelená'], ['#272A33', 'grafit'], ['#F6F7FC', 'bílá']].forEach(([c, nm], i) =>
    W.html({ x: X(-1700 + 1700 + (i - 1.5) * 380), y: Y(3080), z: 120, w: 340, h: 120, in: AT('k01.p3', nm === 'bílá' ? 'bílá' : nm), anim: 'pop',
      html: `<div style="display:flex;justify-content:center"><span class="chip"><span class="ic" style="background:${c};border:1px solid #ccd"></span>${nm}</span></div>` }));
  W.sphere({ x: X(560), y: Y(2950), z: 300, w: 240, h: 240, color: 'blue', in: AT('k01.p3', 'koule'), anim: 'pop' });
  W.sphere({ x: X(860), y: Y(3120), z: 360, w: 160, h: 160, color: 'green', in: AT('k01.p3', 'koule') + .15, anim: 'pop' });

  // ---------- kamera ----------
  flyTo('k01', { x: X(-1350), y: Y(-1350), d: 2050 });
  cam({ t: AT('k01.fmt', 'formát') - .5, dur: 1.2, x: X(-1350), y: Y(-1000), d: 2350, ease: 'smooth', rx: 2, ry: 6 });
  cam({ t: T('k01.lufs') - .3, dur: 1.4, x: X(1500), y: Y(-1050), d: 2300, ease: 'whip', rx: 3, ry: -8, push: .06 });
  cam({ t: T('k01.topic') - .4, dur: 1.2, x: X(1500), y: Y(-60), d: 2350, ease: 'smooth', rx: -3, ry: -5 });
  cam({ t: T('k01.parts') - .3, dur: 1.6, x: X(0), y: Y(1500), d: 6200, ease: 'smooth', rx: 16, ry: 0, push: .03 });
  det.forEach(([cue], i) => cam({ t: T('k01.' + cue) - .35, dur: 1.3, x: X(-2550 + i * 1700), y: Y(1900 + (i === 2 ? 480 : 170)), d: i === 2 ? 2950 : 2450, ease: 'whip', rx: 5, ry: (i - 1.5) * 4, push: .05 }));
  cam({ t: T('k01.mapback') - .2, dur: 3.2, x: o.x * .6, y: o.y * .6, d: 15000, ease: 'smooth', rx: 10, ry: 0, push: .03 });
})();
