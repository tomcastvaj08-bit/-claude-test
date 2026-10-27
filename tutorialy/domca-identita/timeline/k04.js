// K04 · Krok 3: Genjutsu – reference a detail rtů, prompt po blocích (identita, pusa, zvuk, záběr, první snímek), výsledek vs. originál, export 720p bez SFX, třetina práce.
(() => {
  const { T, AT, cam, link, clamp, ease } = ENGINE;
  const { A, CH, flyTo, player, logo } = L;
  const o = A.k04, X = v => o.x + v, Y = v => o.y + v, C = n => 'k04.' + n;
  const REF = '../assets/img/reference1.png';

  W.card({ x: X(-2900), y: Y(-2700), w: 1900, in: CH('k04') + 1.0, kicker: 'Krok 03 · hlavní trik', kc: 'g', title: 'Higgsfield <span class="gr">Genjutsu</span>', lead: 'detaily, podle kterých ji poznáš, <b>natvrdo do promptu</b>' });

  // reference + detail rtů
  W.html({ x: X(-3400), y: Y(-200), z: 30, w: 1000, h: 1860, in: T(C('lips')) - .2, anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:24px"><div class="pic" style="height:1700px"><img src="${REF}" style="width:100%;height:100%;object-fit:cover;object-position:50% 40%"></div>
      <div style="font:500 26px var(--mono);color:var(--muted);margin-top:14px">reference · 1 fotka</div></div>` });
  W.html({ x: X(-2050), y: Y(-650), z: 120, w: 1050, h: 600, in: AT(C('lips'), 'napíchanou'), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:20px"><div class="pic" style="height:100%;background:url(${REF}) no-repeat;background-size:320%;background-position:47% 48%"></div></div>` });
  [['tvar', 'tvar rtů', -170], ['objem', 'objem / plnost', 60], ['typický', 'co je typické', 290]].forEach(([w, txt, dy], i) =>
    W.html({ x: X(-2050), y: Y(dy), z: 140, w: 1050, h: 150, in: i < 2 ? AT(C('lips'), 'napíchanou') + .4 + i * .3 : AT(C('lips'), w), anim: 'rise',
      html: `<div style="display:flex;justify-content:center"><span class="mpill ${i === 2 ? 'g' : 'b'}" style="font-size:44px;padding:14px 32px"><span class="d"></span>${txt}</span></div>` }));
  W.callout({ x: X(-2400), y: Y(1150), z: 60, w: 1700, in: AT(C('lips'), 'natvrdo'), c: 'g', lab: 'Pravidlo', txt: 'Nestačí „vyměň obličej“. <b>Napiš, co je na ní typické.</b>' });

  // ---------- prompt po blocích ----------
  const BL = [
    ['ref', 'Replace the male speaker in the source video with the exact woman shown in the two reference images.'],
    ['ident', 'STRICT IDENTITY PRESERVATION:\nThe reference images define her identity. Preserve her exact facial features, facial proportions, eyes, eyebrows, nose, cheekbones, jawline, chin, natural lip shape and volume, skin tone, makeup, hairline and long straight dark hair.\nShe must remain clearly recognizable as the same woman in every frame. Do not redesign, beautify, stylize, slim, reshape or reinterpret her appearance. Do not blend her face with the original male speaker. Preserve her own facial anatomy throughout all expressions and mouth movements.'],
    ['mouth', 'CRITICAL — MOUTH MOVEMENT:\nTransfer the original speaker’s speech articulation and timing precisely, frame by frame. Preserve every mouth opening, lip closure, rounded vowel, jaw movement, syllable and pause, naturally adapted to her own lips and facial anatomy.\nHer lips must retain their characteristic shape and fullness while moving naturally. Transfer the performance without making her mouth or face resemble the man. Allow normal facial movement during speech while keeping her identity consistent. Maintain realistic teeth and mouth interior. No exaggerated articulation, frozen lips, flickering or delayed mouth movements.'],
    ['audio', 'ORIGINAL AUDIO:\nPreserve the original Czech soundtrack exactly, including the original voice, words, pacing, pauses and intonation. No dubbing, translation, voice replacement or speed changes.'],
    ['shotp', 'PRESERVE THE SHOT:\nKeep the original walking rhythm, head movements, gaze, expressions, gestures, handheld camera motion, framing and duration. Preserve the outdoor street, traffic and background activity.\nRemove the man’s cap and facial hair. Use the woman’s hair and black top from the references. Match the existing outdoor lighting naturally. Do not import the reference backgrounds, microphone, captions or phone interface.'],
    ['first', 'The woman must appear fully established from the first frame, with stable identity throughout and no visible transformation.'],
  ];
  const wrap = (s, n = 70) => s.split('\n').flatMap(p => { const out = []; let line = ''; p.split(' ').forEach(w => { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); out.push(line); return out; });
  const lines = [], rng = [];
  BL.forEach(([cue, txt], i) => { if (i) lines.push(''); const a = lines.length; lines.push(...wrap(txt)); rng.push([cue, a, lines.length - 1]); });
  const fx = [];
  rng.forEach(([cue, a, b], i) => { const t1 = i + 1 < rng.length ? T(C(rng[i + 1][0])) : T(C('wow')); for (let l = a; l <= b; l++) fx.push({ t: T(C(cue)), until: t1, sel: '.l' + l }); });
  const FS = 30, LH = FS * 1.6, PX = X(800), PH = 120 + lines.length * LH, PYc = Y(-200);
  const ly = l => PYc - PH / 2 + 110 + l * LH;
  W.prompt({ id: 'pg', x: PX, y: PYc, z: 20, w: 2700, h: PH, autoH: false, in: T(C('ref')), fs: FS, head: 'Prompt · Higgsfield Genjutsu', meta: 'EN · 1 reference', text: lines.join('\n'), fx });

  // štítky bloků vedle promptu
  [['ident', 'identita', ''], ['mouth', 'pohyb pusy · CRITICAL', 'r'], ['audio', 'původní zvuk', ''], ['shotp', 'zachovej záběr', ''], ['first', 'hotová od 1. snímku', 'g']].forEach(([cue, txt, c]) => {
    const r = rng.find(x => x[0] === cue);
    W.html({ x: PX - 1350 - 560, y: ly((r[1] + r[2]) / 2), z: 80, w: 1000, h: 130, in: T(C(cue)), anim: 'pop',
      html: `<div style="display:flex;justify-content:flex-end"><span class="mpill ${c}" style="font-size:40px;padding:14px 30px${c === 'r' ? ';color:var(--red)' : ''}"><span class="d"></span>${txt}</span></div>` });
  });

  // ---------- výsledek ----------
  const tW = T(C('wow'));
  player('original', { x: X(4900), y: Y(-1200), z: 20, w: 1700, a: 0, b: 6, loop: true, seqStart: tW, in: T(C('shotp')), anim: 'flip', dof: false });
  player('genjutsu', { x: X(4900), y: Y(-200 + 50), z: 20, w: 1700, a: 0, b: 6, loop: true, seqStart: tW, in: tW - .3, anim: 'flip', dof: false });
  W.html({ x: X(4900), y: Y(450), z: 80, w: 1700, h: 140, in: AT(C('wow'), 'Lip'), anim: 'pop',
    html: `<div style="display:flex;justify-content:center;gap:20px"><span class="mpill g" style="font-size:40px;padding:14px 30px"><span class="d"></span>lip sync ✓</span><span class="mpill g" style="font-size:40px;padding:14px 30px"><span class="d"></span>pořád ona ✓</span></div>` });

  // export
  W.html({ x: X(4900), y: Y(1250), z: 40, w: 1700, h: 640, in: T(C('export')), anim: 'tilt',
    fx: [{ t: AT(C('export'), 'bez'), sel: '.sw' }, { t: AT(C('export'), 'vyplivlo'), sel: '.au' }],
    html: `<div class="card" style="height:100%;padding:40px 46px"><div style="display:flex;align-items:center;gap:20px">${logo('genjutsu', 70)}<span style="font:650 50px var(--sans)">Export</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:34px;font:600 42px var(--sans)"><span>rozlišení</span><span class="mpill b" style="font-size:40px;padding:10px 26px">720p</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:26px;font:600 42px var(--sans)"><span>sound effect</span>
        <span class="sw" style="width:150px;height:76px;border-radius:38px;background:color-mix(in srgb,var(--green) calc((1 - var(--hl,0))*100%),#C6D0E4);position:relative;display:inline-block">
        <span style="position:absolute;top:8px;left:calc(82px - var(--hl,0)*74px);width:60px;height:60px;border-radius:50%;background:#fff;box-shadow:0 4px 10px rgba(0,0,0,.15)"></span></span></div>
      <div class="au" style="margin-top:30px;font:550 36px var(--sans);color:var(--ink2);opacity:var(--hl,0)">→ video s <b>mým původním zvukem</b></div></div>` });

  // třetina práce
  const tThird = T(C('third'));
  W.html({ x: X(4900), y: Y(2250), z: 60, w: 1700, h: 300, in: tThird, anim: 'rise',
    update: (n, t) => { n.el.querySelector('.f').style.width = (33 * ease('out', clamp((t - tThird - .3) / 1.2))) + '%'; },
    html: `<div class="card" style="height:100%;padding:34px 44px"><div style="display:flex;justify-content:space-between;font:600 40px var(--sans)"><span>hotovo</span><span style="font-family:var(--mono);color:var(--blue)">~⅓</span></div>
      <div style="height:56px;border-radius:28px;background:#EEF2FA;margin-top:24px;overflow:hidden"><div class="f" style="height:100%;background:var(--blue);border-radius:28px"></div></div></div>` });
  link({ a: { x: PX + 1350, y: PYc }, b: { x: X(4050), y: Y(-150) }, in: tW - .3, dur: .8, w: 8, bend: .15, z: -10 });

  // ---------- kamera ----------
  flyTo('k04', { x: X(-2900), y: Y(-2600), d: 2400 });
  cam({ t: T(C('lips')) - .3, dur: 1.4, x: X(-2750), y: Y(-200), d: 3700, ease: 'whip', rx: 3, ry: 6, push: .05 });
  cam({ t: AT(C('lips'), 'natvrdo') - .4, dur: 1.0, x: X(-2500), y: Y(700), d: 3000, ease: 'smooth', rx: 2, ry: 4 });
  cam({ t: T(C('ref')) - .3, dur: 1.5, x: PX, y: PYc, d: 4300, ease: 'whip', rx: 4, ry: -4, push: .03 });
  rng.slice(1).forEach(([cue, a, b], i) => cam({ t: T(C(cue)) - .25, dur: 1.0, x: PX - 350, y: ly((a + b) / 2), d: b - a > 4 ? 2700 : 2300, ease: 'smooth', rx: 2, ry: i % 2 ? 3 : -3, push: .04 }));
  cam({ t: tW - .3, dur: 1.4, x: X(4900), y: Y(-550), d: 3400, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(C('export')) - .3, dur: 1.2, x: X(4900), y: Y(1250), d: 2500, ease: 'whip', rx: 2, ry: 4, push: .05 });
  cam({ t: tThird - .3, dur: 1.1, x: X(4900), y: Y(1900), d: 2600, ease: 'smooth', rx: 2, ry: -3, push: .05 });
})();
