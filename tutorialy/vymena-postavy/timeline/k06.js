// K06 · Krok 5: Genjutsu pokus 2 – jen výřez hlavy jako reference, prompt „EDIT, NOT A NEW VIDEO“ po blocích, výsledek (originál vs. pokus 2, snímky, detail obličeje).
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo, player } = L;
  const o = A.k06, X = v => o.x + v, Y = v => o.y + v, C = n => 'k06.' + n;

  W.card({ x: X(-1400), y: Y(-2700), w: 1900, in: CH('k06') + 1.0, kicker: 'Krok 05 · pokus 2', kc: 'g', title: 'Genjutsu <span class="gr">č. 2</span>' });

  // reference: sheet → jen hlava
  W.img({ x: X(-3500), y: Y(-1300), z: 30, w: 500, h: 896, src: '../assets/img/09_img.jpg', cap: 'celý sheet', in: T(C('head')) - .2, anim: 'pop', dof: false,
    fx: [{ t: AT(C('head'), 'Ne'), sel: 'img', var: '--hl' }] });
  W.html({ x: X(-3500), y: Y(-1300), z: 120, w: 500, h: 896, in: AT(C('head'), 'Ne'), anim: 'fade',
    html: `<div style="height:100%;border-radius:30px;background:rgba(244,246,249,.7);display:grid;place-items:center"><span style="font:700 140px var(--sans);color:var(--red)">✕</span></div>` });
  W.html({ x: X(-3500), y: Y(-50), z: 60, w: 620, h: 720, in: AT(C('head'), 'výřez'), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:18px"><div class="pic" style="height:600px;background:url(../assets/img/09_img.jpg) no-repeat;background-size:230%;background-position:12% 58%"></div>
      <div style="margin-top:14px;display:flex;justify-content:center"><span class="mpill g" style="font-size:32px;padding:8px 20px"><span class="d"></span>reference: jen hlava</span></div></div>` });

  const P = [
    'STRICT SINGLE-PERSON REPLACEMENT. THIS IS AN EDIT OF THE ORIGINAL VIDEO, NOT A NEW VIDEO.',
    'CHANGE ONLY ONE THING: the man in the red zip-up jacket with curly brown hair and black pants. He walks in from the right around second 2, taps the other man on the shoulder, talks to him, and walks out toward the camera around second 8. Replace ONLY HIM with the bald man from @image1: same real face, fully shaved bald head, pale skin with red cheeks, thin light stubble mustache, slightly heavier body with a belly. Dress ONLY HIM in a light grey t-shirt with a black "adidas" logo and navy blue shorts.',
    'EVERYTHING ELSE MUST STAY 100% IDENTICAL TO THE ORIGINAL VIDEO. DO NOT REGENERATE THE SCENE. KEEP EVERY OTHER PIXEL EXACTLY AS IT IS.',
    'DO NOT TOUCH THE MAN IN THE BLACK HOODIE. Keep his exact original face, his original blond curly hair, his black hoodie, his LIGHT GREY SWEATPANTS and his BLACK SNEAKERS. He must NOT wear shorts. He must NOT get new shoes. He must NOT change at all.',
    'DO NOT TOUCH THE SHOP. Exactly the same products on the shelves, same colors, same ceiling lights, same floor tiles, same lighting, same camera angle, same camera movement, same framing.',
    'DO NOT ADD ANY PEOPLE. DO NOT REMOVE ANY PEOPLE. The background stays exactly as in the original.',
    'The bald man copies the original man\'s movement 1:1: same path, same timing, same shoulder tap, same hand gestures, same head movement, same lip movement. No trace of the red jacket or curly brown hair anywhere in the whole video, including the end.',
    'Photorealistic, real phone footage, identical look to the original.'];
  const wrap = (s, n = 66) => { const out = []; let line = ''; s.split(' ').forEach(w => { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); out.push(line); return out; };
  const lines = [], rng = [];
  P.forEach((p, i) => { if (i) lines.push(''); const a = lines.length; lines.push(...wrap(p)); rng.push([a, lines.length - 1]); });
  const cues = [AT(C('edit'), 'první'), AT(C('edit'), 'změň'), AT(C('keep'), 'Všechno'), AT(C('keep'), 'Nesahej'), AT(C('keep'), 'Nesahej', 2), AT(C('keep'), 'Nepřidávej'), AT(C('keep'), 'nakonec'), AT(C('keep'), 'nakonec') + .01];
  const fx = []; rng.forEach(([a, b], i) => { for (let l = a; l <= b; l++) fx.push({ t: cues[i], until: i < 6 ? cues[i + 1] : T(C('ok5')), sel: '.l' + l }); });
  const FS = 28, LH = FS * 1.6, PH = 120 + lines.length * LH, PX = X(-900), PY = Y(-1650 + 250 + PH / 2);
  W.prompt({ x: PX, y: PY, z: 20, w: 2300, h: PH, autoH: false, in: T(C('edit')) - .2, fs: FS, head: 'Prompt · Genjutsu pokus 2', meta: 'EN · ref = jen hlava', text: lines.join('\n'), fx });
  const ly = i => PY - PH / 2 + 105 + ((rng[i][0] + rng[i][1]) / 2) * LH;
  [[0, 'EDIT, ne nové video', 'b'], [1, 'změň jen jednu věc + časy 2 s / 8 s', 'b'], [3, 'černá mikina · šedé tepláky · černé tenisky', 'r'], [4, 'obchod beze změny', 'r'], [5, 'nepřidávat ani neubírat lidi', 'r'], [6, 'ani stopa po červené mikině', 'r']].forEach(([i, txt, c]) =>
    W.html({ x: PX + 1150 + 560, y: ly(i), z: 80, w: 1050, h: 150, in: cues[i], anim: 'pop',
      html: `<div style="display:flex"><span class="mpill ${c}" style="font-size:34px;padding:12px 24px;white-space:normal;max-width:1040px${c === 'r' ? ';color:var(--red)' : ''}"><span class="d"></span>${txt}</span></div>` }));

  // výsledek
  const tO = T(C('ok5')), RX = X(3700);
  player('original', { x: RX - 450, y: Y(-1100), z: 20, w: 820, a: 0, b: 9.8, loop: true, seqStart: tO, in: tO - .3, anim: 'flip', dof: false });
  player('pokus2', { x: RX + 450, y: Y(-1100), z: 20, w: 820, a: 0, b: 9.8, loop: true, seqStart: tO, in: tO - .1, anim: 'flip', dof: false });
  [[-450, 'originál', ''], [450, 'pokus 2', 'g']].forEach(([dx, t, c]) => W.html({ x: RX + dx, y: Y(-300), z: 60, w: 800, h: 100, in: tO, anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="kick ${c}" style="font-size:34px"><span class="d"></span>${t}</span></div>` }));
  [['Obchod', 'obchod stejný: zboží, světla, podlaha, kamera'], ['nedotčenej', 'já nedotčený'], ['nahrazenej', 'červená mikina úplně pryč'], ['sedí', 'pohyb, rameno i odchod 1:1']].forEach(([w, txt], i) =>
    W.callout({ x: RX, y: Y(-50 + i * 290), z: 80, w: 1700, in: AT(C('ok5'), w), c: 'g', lab: '✓', txt: `<b>${txt}</b>` }));
  W.img({ x: RX, y: Y(1950), z: 30, w: 1900, h: 1352, src: '../assets/img/16_img.jpg', cap: 'pokus 2 po sekundách', in: AT(C('ok5'), 'nahrazenej'), anim: 'tilt', dof: false });
  W.img({ x: X(-900), y: Y(PH - 1650 + 250 + 650), z: 40, w: 1900, h: 1075, src: '../assets/img/17_img.jpg', cap: 'detail v 7. s · vlevo pokus 2, vpravo pokus 1', in: T(C('minor')) - .2, anim: 'pop', dof: false });
  W.callout({ x: X(-900), y: Y(PH - 1650 + 250 + 1350), z: 80, w: 1900, in: AT(C('minor'), 'spodek'), c: 'o', lab: 'drobnosti', txt: '<b>zblízka měkčí a „hezčí“ obličej</b> · slabší knírek · tmavší spodek obrazu' });

  flyTo('k06', { x: X(-1400), y: Y(-2600), d: 2400 });
  cam({ t: T(C('head')) - .3, dur: 1.3, x: X(-3500), y: Y(-700), d: 3400, ease: 'whip', rx: 3, ry: 5, push: .05 });
  rng.slice(0, 7).forEach(([a, b], i) => cam({ t: cues[i] - .3, dur: .9, x: PX + 300, y: ly(i), d: 2600, ease: 'smooth', rx: 2, ry: i % 2 ? 3 : -3, push: .04 }));
  cam({ t: tO - .3, dur: 1.4, x: RX, y: Y(-600), d: 3900, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: AT(C('ok5'), 'nahrazenej') - .3, dur: 1.3, x: RX, y: Y(1300), d: 4300, ease: 'smooth', rx: 4, ry: -2, push: .04 });
  cam({ t: T(C('minor')) - .3, dur: 1.4, x: X(-900), y: Y(PH - 1650 + 250 + 850), d: 3300, ease: 'whip', rx: 2, ry: 4, push: .05 });
})();
