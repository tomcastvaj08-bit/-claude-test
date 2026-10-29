// K03 · Krok 2: character sheet pokus 1 (Nano Banana 2.1) – prompt, kreslený výsledek, proč.
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const o = A.k03, X = v => o.x + v, Y = v => o.y + v, C = n => 'k03.' + n;

  W.card({ x: X(-1300), y: Y(-2500), w: 1900, in: CH('k03') + 1.0, kicker: 'Krok 02 · pokus 1', kc: 'o', title: 'Character sheet <span class="gr">č. 1</span>' });
  W.html({ x: X(-1300), y: Y(-1650), z: 40, w: 1900, h: 150, in: T(C('s2')) + .5, anim: 'rise',
    html: `<div style="display:flex;gap:16px;justify-content:center;align-items:center">${logo('nanobanana', 80)}<span class="mpill b" style="font-size:36px;padding:12px 26px">Nano Banana 2.1</span><span class="mpill" style="font-size:36px;padding:12px 26px">16:9</span><span class="mpill" style="font-size:36px;padding:12px 26px">nejvyšší rozlišení</span><span class="mpill g" style="font-size:36px;padding:12px 26px">3 kredity</span></div>` });

  const P = [
    'Create a professional character reference sheet of the man shown in @image1, @image2, @image3 (the bald man in the middle), @image4 and @image5. Keep his identity 100% consistent with the reference photos: same face shape, same facial proportions, same eyes, nose, mouth and ears, same skin tone, same shaved/bald head, same light stubble and thin mustache, same body type and height proportions. Do not beautify, slim down, age up or change his face in any way.',
    'Layout on one clean sheet, plain light grey studio background, soft even lighting, no shadows on the background: Top row: full body turnaround in a neutral standing pose, arms relaxed at his sides: front view, 3/4 front view, side profile view, back view. All four the same scale, feet on the same ground line. Bottom row: close-up head shots: front face neutral expression, 3/4 face, side profile, front face with a slight natural smile.',
    'Outfit, identical in every view: plain light grey t-shirt with a dark "adidas" text logo on the chest, navy blue drawstring shorts, light grey slip-on sneakers.',
    'Style: photorealistic, real photo look, natural skin texture, sharp focus, 50mm lens look, high detail, consistent lighting across all views. No text labels, no watermarks, no extra people, no props.'];
  const wrap = (s, n = 66) => { const out = []; let line = ''; s.split(' ').forEach(w => { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); out.push(line); return out; };
  const lines = [], rng = [];
  P.forEach((p, i) => { if (i) lines.push(''); const a = lines.length; lines.push(...wrap(p)); rng.push([a, lines.length - 1]); });
  const cues = [AT(C('p1'), 'udělej'), AT(C('p1'), 'Nahoře'), AT(C('p1'), 'Outfit'), AT(C('p1'), 'konci')];
  const fx = []; rng.forEach(([a, b], i) => { for (let l = a; l <= b; l++) fx.push({ t: cues[i], until: i < 3 ? cues[i + 1] : T(C('fail1')), sel: '.l' + l }); });
  const FS = 30, LH = FS * 1.6, PH = 120 + lines.length * LH, PX = X(-1300), PY = Y(-1450 + 250 + PH / 2);
  W.prompt({ x: PX, y: PY, z: 20, w: 2400, h: PH, autoH: false, in: T(C('p1')), fs: FS, head: 'Prompt · pokus 1', meta: 'EN · 5 referencí', text: lines.join('\n'), fx });

  // výsledek + chyby
  W.img({ x: X(1500), y: Y(-200), z: 30, w: 760, h: 1650, src: '../assets/img/08_img.jpg', cap: 'výsledek · pokus 1', in: T(C('fail1')), anim: 'flip', dof: false, float: 4 });
  [['Kreslená', 'kreslená ilustrace, ne fotka'], ['není', 'obličej není on'], ['bez', 'tričko bez nápisu adidas'], ['vodicí', 'vodicí čáry jako u turnaroundu'], ['místo', '3 postavy + 2 hlavy místo 4 + 4']].forEach(([w, txt], i) =>
    W.callout({ x: X(3050), y: Y(-900 + i * 300), z: 80, w: 1300, in: AT(C('fail1'), w), c: 'r', lab: '✕', txt: `<b>${txt}</b>` }));
  [['character', '„character sheet“ + „turnaround“ → svět ilustrací'], ['fotorealistický', '„photorealistic“ na konci to nepřebije'], ['rozmazaný', 'malé rozmazané reference · obecné tričko']].forEach(([w, txt], i) =>
    W.callout({ x: X(2300), y: Y(1100 + i * 330), z: 80, w: 2000, in: AT(C('why1'), w), c: 'o', lab: 'proč', txt: `<b>${txt}</b>` }));

  flyTo('k03', { x: X(-1300), y: Y(-2400), d: 2400 });
  cam({ t: T(C('s2')) - .1, dur: 1.2, x: X(-1300), y: Y(-1900), d: 2700, ease: 'smooth', rx: 2, ry: 3, push: .04 });
  rng.forEach(([a, b], i) => cam({ t: cues[i] - .3, dur: 1.0, x: PX, y: PY - PH / 2 + 110 + ((a + b) / 2) * LH, d: 2500, ease: 'smooth', rx: 2, ry: i % 2 ? 3 : -3, push: .04 }));
  cam({ t: T(C('fail1')) - .3, dur: 1.4, x: X(2200), y: Y(-250), d: 3900, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(C('why1')) - .3, dur: 1.2, x: X(2300), y: Y(1400), d: 3000, ease: 'whip', rx: 2, ry: 4, push: .05 });
})();
