// K08 · Krok 6: hook v jednom kuse – zadání, multishot, 7 keyframů, cena, celý prompt shot po shotu s ukázkou, 144 snímků, přehrání hooku.
(() => {
  const { T, AT, cam, link, node, clamp, ease, lerp } = ENGINE;
  const { A, CH, INS, reel, player, flyTo, logo } = L;
  const o = A.k08, X = v => o.x + v, Y = v => o.y + v;
  const C = n => 'k08.' + n;

  W.card({ x: X(-2600), y: Y(-3300), w: 2000, in: CH('k08') + 1.0, kicker: 'Krok 06 · hlavní trik', title: 'Hook <span class="gr">v jednom kuse</span>' });

  // zadání jako odrážky v tmavé kartě
  const brief = [['sto', 'normální rychlost <em>130 %</em>'], ['střihy', 'minimálně <em>3 střihy</em>'], ['vykračuje', 'široký záběr → detail kafe a pískání → bum, zakopne → <em>detail boty</em>'],
    ['slow', '<em>slow motion</em>: pád, kafe, obličej, kapka ke kalendáři'], ['kalendář', 'kalendář normální rychlostí, <em>cákanec na 7</em>']];
  W.html({ x: X(-2600), y: Y(-1850), z: 40, w: 2200, h: 900, autoH: true, in: T(C('brief6')), anim: 'tilt',
    fx: brief.map(([w], i) => ({ t: AT(C('brief6'), w), sel: '.b' + i })),
    html: `<div class="quote" style="padding:48px 56px"><div class="who"><span class="av"></span>Teecee · zadání (zkráceně)</div>
      <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px">${brief.map(([, txt], i) => `<div class="b${i}" style="font:550 40px/1.3 var(--sans);opacity:calc(.3 + var(--hl,0)*.7);display:flex;gap:18px"><span style="color:#8FB0FF;font-family:var(--mono)">0${i + 1}</span><span>${txt}</span></div>`).join('')}</div></div>`.replace(/<em>/g, '<em style="font-style:normal;color:#8FB0FF">') });

  // technické zadání jako pilulky
  const tech = [['multishot', 'multishot'], ['seedance', 'Seedance 2.5'], ['sedm', '720p'], ['šest', '6 s'], ['šestnáct', '16 : 9'], ['maximálně', 'max 70–100 kr.'], ['framech', 'timing v s i ve framech'], ['kamer', 'střídat typy kamer']];
  tech.forEach(([w, txt], i) => W.html({ x: X(-3350 + (i % 3) * 760 + (i > 5 ? 380 : 0)), y: Y(-480 + Math.floor(i / 3) * 170), z: 80, w: 740, h: 120,
    in: AT(C('tech6'), w), anim: 'pop', html: `<div style="display:flex;justify-content:center"><span class="mpill b" style="font-size:36px;padding:14px 28px"><span class="d"></span>${txt}</span></div>` }));
  W.html({ x: X(-2600), y: Y(900), z: 120, w: 1800, h: 520, in: T(C('110')), anim: 'pop',
    html: `<div style="text-align:center"><div class="bignum gr" style="background:var(--grad);-webkit-background-clip:text;color:transparent;font-size:360px">110 %</div>
      <div style="font:600 48px var(--sans);margin-top:10px">„Hook je vo všem.“</div></div>` });

  // multishot vs. jeden záběr
  const segs = [29, 17, 9, 12, 12, 12, 19, 34], cols = ['#1F4DFF', '#13B97A', '#F07A1A', '#7C3AED', '#E1306C', '#0A0D14', '#5B82FF', '#0A7A4F'];
  W.html({ x: X(1300), y: Y(-3000), z: 30, w: 2600, h: 700, in: T(C('multiexplain')), anim: 'tilt',
    fx: [{ t: AT(C('multiexplain'), 'multishot'), sel: '.ms' }],
    html: `<div class="card" style="height:100%;padding:40px 48px">
      <div style="font:600 30px var(--mono);color:var(--muted)">normální generování</div>
      <div style="height:110px;border-radius:20px;background:#C9D3E6;margin-top:14px;display:grid;place-items:center;font:600 36px var(--sans);color:var(--ink2)">1 záběr</div>
      <div class="ms" style="opacity:calc(.25 + var(--hl,0)*.75)"><div style="font:600 30px var(--mono);color:var(--blue);margin-top:40px">multishot · jedno video</div>
      <div style="display:flex;gap:8px;margin-top:14px">${segs.map((f, i) => `<div style="flex:${f};height:110px;border-radius:14px;background:${cols[i]};display:grid;place-items:center;font:600 30px var(--mono);color:#fff">${i + 1}</div>`).join('')}</div>
      <div style="font:500 28px var(--sans);color:var(--ink2);margin-top:16px">tvrdé střihy uvnitř jednoho generování</div></div></div>` });

  // 7 keyframů (náhledy = snímky z výsledku) → Seedance jako image references
  const kf = [['FPV', 'FPV pohled', .3], ['širok', 'Široký záběr', 1.0], ['bota', 'Bota', 1.75], ['hrnek', 'Hrnek', 2.2], ['obličej', 'Obličej', 2.85], ['kapka', 'Kapka', 3.55], ['cákanec', 'Cákanec', 4.9]];
  kf.forEach(([w, lab, tt], i) => {
    const k = i - 3;
    W.img({ x: X(1300 + k * 760), y: Y(-1250 + Math.abs(k) * 60), z: -Math.abs(k) * 120, ry: -k * 6, w: 700, h: 394, src: reel(tt), cap: lab, in: AT(C('keyframes'), w), anim: 'pop', dof: false, float: 8 });
    link({ a: { x: X(1300 + k * 760), y: Y(-1030) }, b: { x: X(1300), y: Y(-80) }, in: T(C('refs')) + i * .06, dur: .8, soft: true, w: 6, bend: k * .03, z: -20, dot: true });
  });
  W.html({ x: X(1300), y: Y(-1700), z: 40, w: 1500, h: 100, in: T(C('keyframes')), anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="mpill" style="font-size:30px;padding:10px 24px"><span class="d"></span>7 keyframů · gpt_image_2_5 · náhledy ze hotového videa</span></div>` });
  W.html({ x: X(1300), y: Y(80), z: 60, w: 2000, h: 300, in: T(C('refs')), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:34px 44px;display:flex;align-items:center;gap:30px">${logo('higgsfield', 90)}
      <div><div style="font:650 60px var(--sans);letter-spacing:-.04em">Seedance 2.5 · multishot</div><div style="font:500 28px var(--mono);color:var(--muted);margin-top:6px">image_references ×7 + start frame + end frame z enginu</div></div></div>` });

  // cena
  W.html({ x: X(1300), y: Y(1150), z: 60, w: 2000, h: 560, in: T(C('cost6')), anim: 'tilt',
    update: (n, t) => { const p = ease('out', clamp((t - T(C('cost6')) - .2) / 1.4)); n.el.querySelector('.cn').textContent = Math.round(42 * p); n.el.querySelector('.fill').style.width = (42 / 100 * p * 100) + '%'; },
    html: `<div class="card" style="height:100%;padding:40px 50px"><div style="display:flex;align-items:baseline;gap:20px"><span class="cn bignum" style="font-size:200px;color:var(--green)">0</span><span style="font:650 60px var(--sans)">kreditů</span>
      <span style="font:500 28px var(--mono);color:var(--muted);margin-left:auto">720p · 6 s</span></div>
      <div style="position:relative;height:60px;border-radius:30px;background:#EEF2FA;margin-top:20px">
        <div class="fill" style="position:absolute;left:0;top:0;bottom:0;border-radius:30px;background:var(--green)"></div>
        <div style="position:absolute;left:70%;right:0;top:0;bottom:0;border-radius:0 30px 30px 0;background:repeating-linear-gradient(-45deg,rgba(212,42,30,.18) 0 12px,transparent 12px 24px);border-left:4px solid var(--red)"></div></div>
      <div style="display:flex;justify-content:space-between;font:500 26px var(--mono);color:var(--muted);margin-top:10px"><span>0</span><span style="color:var(--red)">limit 70–100</span></div></div>` });

  // ---------- celý prompt ----------
  const PROMPT = `MULTI-SHOT cinematic sequence, 6 seconds at 24 fps, HARD CUTS between shots,
extremely dynamic editing for a social-media hook. LOOK: the boy (big square
glasses, messy red-brown hair, pink skin, green plaid shirt, blue jeans, brown
shoes, white coffee mug) is a 2D character in the exact 'Spider-Man: Into the
Spider-Verse' style: animated ON TWOS (stepped, choppy, 12 drawings per second),
bold ink outlines, Ben-Day halftone dots, ink hatching for shadows, CMYK print
misregistration instead of motion blur, smear frames on fast moves, comic impact
frames. The room stays photoreal: brick wall, green chalkboard, the paper wall
calendar 'Rijen 2026', warm sun stripes through blinds, wooden floor, a black
power cable on the floor. No drone visible, no text, no captions, no speech bubbles.
SHOT 1 (0.00-1.20 s, frames 1-29) ULTRA-WIDE fisheye from the far upper corner of
the room (exactly the start frame): he strolls in with a confident carefree
swagger, sipping coffee and whistling, the camera drifts slowly.
SHOT 2 (1.20-1.90 s, frames 30-46) LOW TRACKING CLOSE-UP from the side at knee
height, out-of-focus green potted-plant leaves blurred in the extreme foreground,
his swinging steaming mug and walking feet, still carefree.
SHOT 3 (1.90-2.30 s, frames 47-55) EXTREME CLOSE-UP at floor level: his brown shoe
snags hard on the black cable, SNAP, smear frame, impact frame.
SHOT 4 (2.30-2.80 s, frames 56-67) SLOW MOTION 4x, wide dutch angle: he tumbles
forward through the air, arms flailing, glasses slipping, the mug flying out of his hand.
SHOT 5 (2.80-3.30 s, frames 68-79) SLOW MOTION macro close-up: the mug tilts in
mid-air, a glossy arc of coffee pours out, droplets frozen in the sunlight.
SHOT 6 (3.30-3.80 s, frames 80-91) SLOW MOTION extreme close-up of his face:
horrified, eyes huge behind the glasses, mouth wide open 'nooo', droplets floating past.
SHOT 7 (3.80-4.60 s, frames 92-110) SLOW MOTION over-the-shoulder: one big coffee
drop flies toward the paper calendar on the chalkboard.
SHOT 8 (4.60-6.00 s, frames 111-144) back to NORMAL SPEED, fast snap zoom: the coffee
splats onto the calendar right on the number 7, a few drips run down, then the
camera settles perfectly still on the calendar close-up exactly like the end frame.`;
  // bloky řádků navázané na cue (zvýraznění trvá do další cue)
  const blocks = [['look', [0, 1, 2, 3]], ['lookstyle', [4, 5, 6, 7]], ['room', [7, 8, 9]], ['neg', [9]],
    ['sh1', [10, 11, 12]], ['sh2', [13, 14, 15]], ['sh3', [16, 17]], ['sh4', [18, 19]], ['sh5', [20, 21]], ['sh6', [22, 23]], ['sh7', [24, 25]], ['sh8', [26, 27, 28]]];
  const fx = [];
  blocks.forEach(([cue, lines], i) => { const t0 = T(C(cue)), t1 = i + 1 < blocks.length ? T(C(blocks[i + 1][0])) : T(C('frames')); lines.forEach(l => fx.push({ t: t0, until: t1, sel: '.l' + l })); });
  const PX = X(5900), PYc = Y(-1600), LH = 51.2, PH = 1760, ly = l => PYc - PH / 2 + 113 + l * LH + 25;
  W.prompt({ id: 'p6', x: PX, y: PYc, z: 20, w: 2750, h: PH, autoH: false, in: T(C('prompt6')), fs: 32, head: 'Prompt · Seedance 2.5 multishot · celý', meta: '6 s · 24 fps · 144 snímků', text: PROMPT, fx });

  // monitor vedle promptu: k aktuálnímu shotu hraje odpovídající úsek hotového hooku
  const SEG = { sh1: [0, 1.17], sh2: [1.17, 1.55], sh3: [1.55, 1.96], sh4: null, sh5: [1.96, 2.63], sh6: [2.63, 3.25], sh7: [3.25, 3.875], sh8: [3.875, 5.9] };
  const shots = Object.keys(SEG);
  const shotY = sh => { const bl = blocks.find(b => b[0] === sh)[1]; return clamp(ly((bl[0] + bl[bl.length - 1]) / 2), PYc - PH / 2 + 480, PYc + PH / 2 - 480); };
  node({ id: 'mon', x: X(7250), y: shotY('sh1'), z: 300, w: 1300, h: 830, in: T(C('sh1')) - .2, anim: 'flip', dof: false,
    html: `<div class="card" style="height:100%;padding:30px 34px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="kick b"><span class="d"></span><span class="sn">SHOT 1</span></span><span class="tc" style="font:600 30px var(--mono);color:var(--muted)"></span></div>
      <div class="pic" style="height:640px;margin-top:20px;position:relative"><img class="mi"><div class="na" style="position:absolute;inset:0;display:none;place-items:center;background:#0A0D14;color:#fff;font:600 48px var(--sans);text-align:center">SHOT 4<br><span style="font:500 30px var(--mono);color:#9AA6BC">ve finálním střihu není</span></div></div></div>`,
    update: (n, t, an) => {
      let cur = 'sh1', prev = 'sh1'; shots.forEach(s => { if (t >= T(C(s))) { prev = cur; cur = s; } });
      // monitor sjede k aktivnímu bloku (deterministicky podle času)
      const yy = lerp(shotY(prev), shotY(cur), ease('smooth', (t - T(C(cur))) / .9));
      n.el.style.transform = `translate3d(${n.x * 2}px,${(yy + an.dy) * 2}px,${(n.z + an.dz) * 2}px) rotateY(${an.ry}deg) scale(${an.s * 2 / n.Z}) translate(-50%,-50%)`;
      const seg = SEG[cur], i = shots.indexOf(cur);
      n.el.querySelector('.sn').textContent = 'SHOT ' + (i + 1);
      n.el.querySelector('.na').style.display = seg ? 'none' : 'grid';
      if (seg) {
        const len = seg[1] - seg[0], local = ((t - T(C(cur))) * .5) % len;           // půlrychlost, ať je vidět
        const src = reel(seg[0] + local), img = n.el.querySelector('.mi');
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        n.el.querySelector('.tc').textContent = `${seg[0].toFixed(2)}–${seg[1].toFixed(2)} s ve výsledku`;
      } else n.el.querySelector('.tc').textContent = '';
    } });

  // 144 snímků
  const fr = [[1, 29], [30, 46], [47, 55], [56, 67], [68, 79], [80, 91], [92, 110], [111, 144]];
  W.html({ x: X(5900), y: Y(700), z: 40, w: 3300, h: 640, in: T(C('frames')), anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:40px 50px"><div style="display:flex;align-items:baseline;gap:24px"><span style="font:700 110px var(--sans);letter-spacing:-.05em">6 s × 24 = <span style="color:var(--blue)">144</span></span><span style="font:500 32px var(--mono);color:var(--muted)">snímků</span></div>
      <div style="display:flex;gap:6px;margin-top:40px">${fr.map(([a, b], i) => `<div style="flex:${b - a + 1};height:150px;border-radius:14px;background:${cols[i]};color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;font:600 26px var(--mono)"><span>S${i + 1}</span><span style="font-size:20px;opacity:.85">${a}–${b}</span></div>`).join('')}</div></div>` });

  // přehrání hooku (vložka s původním zvukem)
  const ins = INS('k08.watch6');
  player({ id: 'hookplay', x: X(5900), y: Y(2700), z: 80, w: 2400, h: 1350, a: 0, b: 6.0, loop: false, seqStart: ins.t, in: T(C('watch6')), anim: 'pop', dof: false });

  // ---------- kamera ----------
  flyTo('k08', { x: X(-2600), y: Y(-3150), d: 2300 });
  cam({ t: T(C('brief6')) - .3, dur: 1.4, x: X(-2600), y: Y(-1850), d: 2900, ease: 'smooth', rx: 3, ry: 6, push: .06 });
  cam({ t: T(C('tech6')) - .3, dur: 1.2, x: X(-2600), y: Y(-350), d: 2700, ease: 'smooth', rx: 2, ry: 4 });
  cam({ t: T(C('110')) - .3, dur: 1.0, x: X(-2600), y: Y(850), d: 2300, ease: 'whip', rx: 0, ry: 2, push: .08 });
  cam({ t: T(C('multiexplain')) - .3, dur: 1.6, x: X(1300), y: Y(-3000), d: 3100, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(C('keyframes')) - .3, dur: 1.4, x: X(1300), y: Y(-1300), d: 4200, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  cam({ t: T(C('refs')) - .3, dur: 1.2, x: X(1300), y: Y(-650), d: 4400, ease: 'smooth', rx: 8, ry: 0 });
  cam({ t: T(C('cost6')) - .3, dur: 1.2, x: X(1300), y: Y(1150), d: 2600, ease: 'whip', rx: 2, ry: -3, push: .06 });
  cam({ t: T(C('prompt6')) - .3, dur: 1.8, x: PX, y: PYc, d: 3200, ease: 'smooth', rx: 4, ry: -4, push: .03 });
  blocks.forEach(([cue, lines]) => {
    const yy = ly((lines[0] + lines[lines.length - 1]) / 2), isShot = cue.startsWith('sh');
    cam({ t: T(C(cue)) - .25, dur: .9, x: isShot ? X(6240) : PX - 450, y: isShot ? shotY(cue) : yy, d: isShot ? 3100 : 2000, ease: 'smooth', rx: 2, ry: isShot ? -2 : 3, push: .04 });
  });
  cam({ t: T(C('frames')) - .3, dur: 1.4, x: X(5900), y: Y(700), d: 3100, ease: 'whip', rx: 3, ry: 0, push: .05 });
  cam({ t: T(C('watch6')) - .2, dur: 1.6, x: X(5900), y: Y(2700), d: 1950, ease: 'smooth', rx: 0, ry: 0, push: .02 });
})();
