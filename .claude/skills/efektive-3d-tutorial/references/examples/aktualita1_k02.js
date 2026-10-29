// K02 · Tým: Claude Code jako šéf, engine (HTML → Playwright → ffmpeg), navázání na slova, skill, ostatní nástroje.
(() => {
  const { T, AT, cam, link, node, clamp, ease, lerp } = ENGINE;
  const { A, CH, reel, thumb, flyTo, logo } = L;
  const o = A.k02, X = v => o.x + v, Y = v => o.y + v;
  const C = n => 'k02.' + n;

  // titulek kapitoly (zmizí, než přijde ukázka navázání na slova)
  W.card({ x: X(0), y: Y(-1150), w: 1700, in: CH('k02') + 1.0, out: T(C('sync')) - .6, kicker: 'Tým nástrojů',
    title: 'Šest nástrojů. <span class="gr">Jeden šéf.</span>' });

  // ---------- Claude Code ----------
  const roles = [['psal', 'kód'], ['stříhal', 'střih'], ['míchal', 'zvuk'], ['renderoval', 'render'], ['konektory', 'konektory']];
  W.html({ id: 'claude', x: X(0), y: Y(0), z: 40, w: 1700, h: 640, in: T(C('claude')), anim: 'pop',
    fx: roles.map(([w], i) => ({ t: AT(C('claude'), w), sel: '.r' + i })),
    html: `<div class="quote" style="padding:56px 64px;height:100%">
      <div class="who">${logo('claude', 44)}šéf · „režisér a střihač“</div>
      <div style="font-size:132px;font-weight:650;letter-spacing:-.055em;line-height:1;margin-top:22px">Claude Code</div>
      <div style="font:500 30px var(--mono);color:#9AA6BC;margin-top:18px">cloudová session · GitHub repozitář</div>
      <div style="display:flex;gap:16px;margin-top:40px">${roles.map(([, r], i) => `<span class="r${i}" style="font:500 30px var(--mono);padding:12px 22px;border-radius:999px;
        background:rgba(31,77,255,calc(.12 + var(--hl,0)*.88));color:rgba(255,255,255,calc(.45 + var(--hl,0)*.55))">${r}</span>`).join('')}</div></div>` });
  // cloud vs můj počítač
  W.html({ x: X(-430), y: Y(520), z: 90, w: 820, h: 110, in: AT(C('claude'), 'počítači'), anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill" style="font-size:34px;padding:14px 28px;color:var(--red)"><span class="d" style="background:var(--red);box-shadow:0 0 0 5px rgba(212,42,30,.14)"></span>ne můj počítač</span></div>` });
  W.html({ x: X(430), y: Y(520), z: 90, w: 820, h: 110, in: AT(C('claude'), 'cloudu'), anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill" style="font-size:34px;padding:14px 28px"><span class="d"></span>cloud → ${logo('github', 34)} repo</span></div>` });

  // ---------- engine: HTML → Playwright → ffmpeg ----------
  const PY = -2650;
  W.html({ x: X(0), y: Y(PY - 590), z: 30, w: 1800, h: 150, in: T(C('engine')), anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="kick b" style="font-size:46px;padding:16px 34px 16px 26px"><span class="d"></span>vlastní news-reel engine</span></div>` });
  const tpl = [['app', 7.6], ['bigtype', 10.4], ['phone', 13.2], ['fan', 18.6], ['stack', 21.6], ['iphone', 26.6], ['words', 29.6], ['particles', 31.0], ['cta', 38.5]];
  W.html({ id: 'html', x: X(-1650), y: Y(PY), z: 0, w: 1450, h: 820, in: T(C('engine')) + .5, anim: 'flip',
    html: `<div class="card" style="height:100%;padding:40px 46px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="kick b"><span class="d"></span>1 · HTML + CSS</span><span style="font:500 26px var(--mono);color:var(--muted)">scéna = šablona</span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px">${tpl.map(([n, tt], i) => `<div class="tp tp${i}" style="opacity:calc(.12 + var(--hl,0)*.88);transform:scale(calc(.9 + var(--hl,0)*.1))">
        <div class="pic" style="height:170px;border-radius:16px"><img src="${thumb(tt)}"></div><div style="font:600 28px var(--mono);margin-top:8px;text-align:center">${n}</div></div>`).join('')}</div></div>`,
    fx: tpl.map(([n], i) => ({ t: AT(C('html'), n), sel: '.tp' + i, dur: .35 })) });
  // Playwright: okno prohlížeče, které jede snímek po snímku
  W.html({ id: 'pw', x: X(0), y: Y(PY), z: 60, w: 1450, h: 820, in: T(C('engine')) + .75, anim: 'flip',
    html: `<div class="card" style="height:100%;padding:34px 40px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="kick b"><span class="d"></span>2 · Playwright</span><span class="cnt" style="font:600 34px var(--mono);color:var(--blue)"></span></div>
      <div style="margin-top:24px;border-radius:20px;overflow:hidden;border:2px solid var(--line)">
        <div style="height:46px;background:#EEF1F6;display:flex;align-items:center;gap:10px;padding:0 18px"><i style="width:14px;height:14px;border-radius:50%;background:#F26B5B"></i><i style="width:14px;height:14px;border-radius:50%;background:#F6C34A"></i><i style="width:14px;height:14px;border-radius:50%;background:#4CC46B"></i><span style="font:500 22px var(--mono);color:var(--muted);margin-left:16px">file:///news-reel/scene.html</span></div>
        <div style="position:relative;height:500px"><img class="fr" style="width:100%;height:100%;object-fit:cover"><div class="fl" style="position:absolute;inset:0;background:#fff;opacity:0"></div></div></div></div>`,
    update: (n, t) => {
      // posun o snímek + „fotka“ (blesk) – 6× za sekundu, ať je vidět krokování
      n.el.style.opacity *= t < T(C('playwright')) ? .45 : 1;
      const k = Math.max(0, Math.floor((t - T(C('playwright'))) * 6)), f = 300 + k;
      const img = n.el.querySelector('.fr'), src = reel(f / 24);
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      n.el.querySelector('.cnt').textContent = `snímek ${String(f).padStart(4, '0')}`;
      const ph = (t - T(C('playwright'))) * 6 % 1;
      n.el.querySelector('.fl').style.opacity = t > AT(C('playwright'), 'vyfotí') ? Math.max(0, .55 - ph * 2.2) : 0;
    } });
  // ffmpeg: snímky -> MP4 + zvuk
  W.html({ id: 'ff', x: X(1650), y: Y(PY), z: 0, w: 1450, h: 820, in: T(C('engine')) + 1.0, anim: 'flip',
    html: `<div class="card" style="height:100%;padding:40px 46px">
      <span class="kick b"><span class="d"></span>3 · ffmpeg</span>
      <div style="display:flex;align-items:center;gap:40px;margin-top:60px">
        <div style="position:relative;width:520px;height:300px">${[0, 1, 2].map(i => `<div class="pic" style="position:absolute;left:${i * 40}px;top:${i * 34}px;width:420px;height:236px"><img src="${thumb(14 + i * 6)}"></div>`).join('')}</div>
        <div style="font:600 80px var(--sans);color:var(--blue)">→</div>
        <div style="width:300px;height:380px;border-radius:26px;background:var(--night);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:30px">
          <div style="font:600 60px var(--mono)">MP4</div><div class="au" style="font:500 26px var(--mono);color:#8FB0FF;margin-top:8px;opacity:calc(var(--hl,0))">+ zvuk ♪</div></div></div></div>`,
    fx: [{ t: AT(C('ffmpeg'), 'zvuk'), sel: '.au' }] });
  // letící snímky z Playwrightu do ffmpegu
  for (let i = 0; i < 6; i++) node({ x: X(0), y: Y(PY), z: 200, w: 300, h: 169, in: T(C('ffmpeg')), anim: 'none', dof: false,
    html: `<div class="pic" style="width:100%;height:100%;border-radius:14px"><img src="${thumb(10 + i * 4)}"></div>`,
    update: (n, t) => {
      const p = ((t - T(C('ffmpeg'))) * .55 + i / 6) % 1, e = ease('smooth', p);
      n.el.style.transform = `translate3d(${X(lerp(250, 1400, e)) * 2}px,${(Y(PY - 60) - Math.sin(e * Math.PI) * 420) * 2}px,${(200 + Math.sin(e * Math.PI) * 300) * 2}px) scale(${lerp(1, .55, e) * 2 / n.Z}) translate(-50%,-50%)`;
      n.el.style.opacity = (t < T(C('sync')) ? 1 : 0) * Math.min(1, p * 6, (1 - p) * 6);
    } });
  link({ a: { x: X(-920), y: Y(PY) }, b: { x: X(-730), y: Y(PY) }, in: T(C('playwright')), dur: .5, w: 10, bend: 0, z: 20 });
  link({ a: { x: X(730), y: Y(PY) }, b: { x: X(920), y: Y(PY) }, in: T(C('ffmpeg')), dur: .5, w: 10, bend: 0, z: 20 });

  // ---------- navázání na slova ----------
  const words = ['dáš', 'fotky,', 'videa,', 'texty', 'i', 'efekty'];
  const tF = AT(C('sync'), 'fotky'), tS = T(C('sync'));
  W.html({ id: 'sync', x: X(0), y: Y(-1300), z: 40, w: 3000, h: 640, in: tS, anim: 'rise',
    html: `<div class="card" style="height:100%;padding:36px 46px;position:relative">
      <div style="display:flex;justify-content:space-between"><span class="kick b"><span class="d"></span>Animace navázané na slova hlasu</span><span style="font:500 26px var(--mono);color:var(--muted)">přepis Scribe → časy slov</span></div>
      <div style="position:relative;height:140px;margin-top:44px">${words.map((w, i) => `<div class="w w${i}" style="position:absolute;left:${60 + i * 440}px;top:0;width:${410}px;height:130px;border-radius:22px;
        background:${w.startsWith('fotky') ? 'var(--blue)' : '#EEF2FA'};color:${w.startsWith('fotky') ? '#fff' : 'var(--ink2)'};display:grid;place-items:center;font:600 62px var(--sans)">${w.replace(',', '')}</div>`).join('')}
        <div class="ph" style="position:absolute;top:-24px;height:178px;width:8px;border-radius:4px;background:var(--red)"></div></div>
      <div class="pop" style="position:absolute;left:${60 + 1 * 440 - 80}px;top:270px;display:flex;align-items:center;gap:24px;opacity:0">
        <div class="pic" style="width:420px;height:236px"><img src="${thumb(18.2)}"></div>
        <div style="font:600 56px var(--sans);color:var(--blue)">karta Fotky naskočí<br><span style="font:500 34px var(--mono);color:var(--muted)">přesně na slovo, ne na sekundu</span></div></div></div>`,
    update: (n, t) => {
      // playhead projede slovy; po změně hlasu se bloky roztáhnou a karta jede s nimi
      const stretch = t > AT(C('sync'), 'změní') ? ease('smooth', (t - AT(C('sync'), 'změní')) / 1.2) : 0;
      words.forEach((_, i) => {
        const el = n.el.querySelector('.w' + i); const L0 = 60 + i * 440 * (1 + stretch * .08);
        el.style.left = L0 + 'px'; el.style.width = 410 * (1 + stretch * .08) + 'px';
      });
      const span = 440 * words.length * (1 + stretch * .08);
      const ph = t < tF ? clamp((t - (tF - 1.2)) / 1.2) * (1.5 / words.length) : clamp(1.5 / words.length + (t - tF) / 3.5 * (1 - 1.5 / words.length));
      n.el.querySelector('.ph').style.left = 60 + ph * span + 'px';
      const pp = clamp((t - tF) / .5); const pop = n.el.querySelector('.pop');
      pop.style.opacity = pp; pop.style.transform = `translateY(${(1 - ease('out', pp)) * 40}px)`;
      pop.style.left = 60 + 1 * 440 * (1 + stretch * .08) - 80 + 'px';
    } });

  // ---------- skill ----------
  const rules = ['formát a délka', 'styl a brand', 'postup výroby'];
  W.html({ id: 'skill', x: X(-2750), y: Y(780), z: 30, w: 1300, h: 760, in: T(C('skill')), anim: 'tilt',
    fx: [0, 1, 2].map(i => ({ t: AT(C('skill'), 'zapíšou') + .3 + i * .45, sel: '.nr' + i })),
    html: `<div class="card" style="height:100%;padding:44px 50px">
      <span class="kick"><span class="d"></span>3 · skill</span>
      <div style="font:600 52px var(--mono);letter-spacing:-.02em;margin-top:24px">efektive-aktuality</div>
      <div style="font:500 28px var(--sans);color:var(--muted);margin-top:8px">návod pro Clauda, jak vyrobit díl</div>
      <div style="margin-top:26px;font:500 30px/1.7 var(--mono);color:var(--ink2)">${rules.map(r => `<div>· ${r}</div>`).join('')}
        ${[0, 1, 2].map(i => `<div class="nr${i}" style="color:var(--green-ink);opacity:var(--hl,0);transform:translateX(calc((1 - var(--hl,0)) * 30px))">+ nové pravidlo z mé zpětné vazby</div>`).join('')}</div></div>` });

  // ---------- Higgsfield, ElevenLabs, Canva, ChatGPT ----------
  const tool = (id, key, x, y, title, sub, rows, cue) => W.html({ id, x: X(x), y: Y(y), z: 30, w: 1300, h: 200 + rows.length * 100, autoH: true, in: T(C(cue)), anim: 'tilt',
    fx: rows.map((r, i) => ({ t: r[2] ? AT(C(cue), r[2]) : T(C(cue)) + .3 + i * .2, sel: '.tr' + i })),
    html: `<div class="card" style="padding:40px 46px">
      <div style="display:flex;align-items:center;gap:22px">${logo(key, 64)}<div><div style="font-size:60px;font-weight:650;letter-spacing:-.04em;line-height:1">${title}</div>
      <div style="font:500 24px var(--mono);color:var(--muted);margin-top:6px">${sub}</div></div></div>
      <div style="margin-top:26px;display:flex;flex-direction:column;gap:14px">${rows.map((r, i) => `<div class="tr${i}" style="display:flex;justify-content:space-between;align-items:center;padding:16px 22px;border-radius:16px;
        background:rgba(31,77,255,calc(var(--hl,0)*.08));border:1px solid rgba(31,77,255,calc(.15 + var(--hl,0)*.5));opacity:calc(.5 + var(--hl,0)*.5)">
        <span style="font:600 30px var(--sans)">${r[0]}</span><span style="font:500 24px var(--mono);color:var(--muted)">${r[1]}</span></div>`).join('')}</div></div>` });
  tool('higgs', 'higgsfield', 2750, -380, 'Higgsfield', 'obrázky a video', [['Obrázky', 'gpt_image_2_5', 'obrázky'], ['Video · multishot', 'Seedance 2.5', 'seedance'], ['Testy', 'Kling 3.0', 'kling']], 'higgs');
  tool('eleven', 'elevenlabs', 2750, 900, 'ElevenLabs', 'hlas a zvuk', [['Návrh hlasu', 'Voice Design · ttv_v3', 'voice'], ['Namluvení', 'eleven_v4', 'namluvení'], ['Zvuky + hudba', 'text_to_sound_v2', 'zvukový'], ['Přepis s časy slov', 'Scribe', 'scribe']], 'eleven');
  tool('canva', 'canva', 0, 1500, 'Canva', 'cover Reelu', [['Thumbnail', '9:16 · 3 vrstvy', null]], 'canva');
  tool('chatgpt', 'openai', -2750, -420, 'ChatGPT', 'vstup: text novinky', [['Novinka ze …', '', 'novinka'], ['Co se změnilo', '', 'změnilo'], ['Pro klienty', '', 'klienty'], ['Vyzkoušet', '', 'vyzkoušet']], 'chatgpt');
  [['higgs', 2750, -380], ['eleven', 2750, 900], ['canva', 0, 1500], ['chatgpt', -2750, -420], ['skill', -2750, 780]].forEach(([cue, x, y]) =>
    link({ a: { x: X(0), y: Y(0) }, b: { x: X(x), y: Y(y) }, in: T(C(cue)) - .2, dur: .8, soft: true, w: 6, bend: .12, z: -10 }));
  link({ a: { x: X(0), y: Y(-330) }, b: { x: X(0), y: Y(PY + 420) }, in: T(C('engine')) - .2, dur: .9, soft: true, w: 6, bend: 0, z: -10 });

  // ---------- kamera ----------
  flyTo('k02', { x: X(0), y: Y(-900), d: 2700 });
  cam({ t: T(C('claude')) - .3, dur: 1.3, x: X(0), y: Y(120), d: 2450, ease: 'smooth', rx: -3, ry: 5, push: .05 });
  cam({ t: T(C('engine')) - .3, dur: 1.6, x: X(0), y: Y(PY - 120), d: 4300, ease: 'whip', rx: 6, ry: 0, push: .04 });
  cam({ t: T(C('html')) - .2, dur: 1.2, x: X(-1650), y: Y(PY), d: 2300, ease: 'smooth', rx: 2, ry: 7 });
  cam({ t: T(C('playwright')) - .2, dur: 1.2, x: X(0), y: Y(PY), d: 2250, ease: 'whip', rx: 2, ry: 0 });
  cam({ t: T(C('ffmpeg')) - .2, dur: 1.2, x: X(1450), y: Y(PY), d: 2500, ease: 'whip', rx: 2, ry: -7 });
  cam({ t: T(C('sync')) - .3, dur: 1.4, x: X(0), y: Y(-1250), d: 3100, ease: 'smooth', rx: -4, ry: 0, push: .05 });
  cam({ t: T(C('skill')) - .3, dur: 1.4, x: X(-2750), y: Y(780), d: 2350, ease: 'whip', rx: 3, ry: 8 });
  cam({ t: T(C('higgs')) - .3, dur: 1.4, x: X(2750), y: Y(-380), d: 2350, ease: 'whip', rx: 3, ry: -8 });
  cam({ t: T(C('eleven')) - .3, dur: 1.1, x: X(2750), y: Y(900), d: 2450, ease: 'smooth', rx: -3, ry: -8 });
  cam({ t: T(C('canva')) - .3, dur: 1.2, x: X(0), y: Y(1500), d: 2300, ease: 'smooth', rx: -4, ry: 0 });
  cam({ t: T(C('chatgpt')) - .3, dur: 1.5, x: X(-2750), y: Y(-420), d: 2400, ease: 'whip', rx: 3, ry: 8 });
  cam({ t: T(C('teamsum')) - .3, dur: 2.6, x: X(0), y: Y(-500), d: 8200, ease: 'smooth', rx: 8, ry: 0, push: .04 });
})();
