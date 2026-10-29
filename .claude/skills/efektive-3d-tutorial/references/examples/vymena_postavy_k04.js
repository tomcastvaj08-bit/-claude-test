// K04 · Krok 3: character sheet pokus 2 – nová generace, ne Edit; RAW photo + NOT…, role referencí, tričko detailně, studio photoshoot → realistický sheet.
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo } = L;
  const o = A.k04, X = v => o.x + v, Y = v => o.y + v, C = n => 'k04.' + n;

  W.card({ x: X(-1300), y: Y(-2500), w: 1900, in: CH('k04') + 1.0, kicker: 'Krok 03 · pokus 2', kc: 'g', title: 'Character sheet <span class="gr">č. 2</span>' });
  W.html({ x: X(-1300), y: Y(-1650), z: 60, w: 1900, h: 150, in: AT(C('s3'), 'novou'), anim: 'pop',
    html: `<div style="display:flex;gap:16px;justify-content:center"><span class="mpill g" style="font-size:40px;padding:14px 30px"><span class="d"></span>nová generace</span><span class="mpill r" style="font-size:40px;padding:14px 30px;color:var(--red)">✕ ne Edit</span></div>` });

  const P = [
    'RAW photo, real photograph taken with a full-frame camera, 85mm lens. NOT an illustration, NOT a drawing, NOT digital art, NOT a 3D render, NOT cartoon, NOT painted.',
    'The man is exactly the real person from @image1, @image2 and @image3. Copy his real face 1:1 from @image1 and @image3: same face shape, same eyes and eyelids, same nose, same mouth and lips, same ears, same pale skin with red cheeks, same fully shaved bald head, same thin light stubble mustache. Copy his real body from @image2: same height proportions, same belly, same arms and legs. Do not make him more handsome, do not change his age, do not change his weight.',
    'Outfit copied exactly from @image1 and @image2: the same light lavender-grey cotton t-shirt with the big black "adidas" wordmark printed across the chest, slightly worn and faded, loose fit. Navy blue drawstring shorts with white drawstrings. Light grey slip-on shoes.',
    'Studio photoshoot on a plain light grey seamless backdrop, soft even studio light. One image with 2 rows of real photos: Top row, 4 full body shots same scale: front, 3/4 front, side profile, back. Bottom row, 4 headshots: front neutral, 3/4, side profile, front with a slight smile.',
    'Photorealistic, natural skin texture with visible pores and imperfections, sharp focus, true-to-life colors. No text, no labels, no lines, no grid, no watermark.'];
  const wrap = (s, n = 66) => { const out = []; let line = ''; s.split(' ').forEach(w => { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); out.push(line); return out; };
  const lines = [], rng = [];
  P.forEach((p, i) => { if (i) lines.push(''); const a = lines.length; lines.push(...wrap(p)); rng.push([a, lines.length - 1]); });
  const cues = [T(C('raw')), T(C('roles')), T(C('shirt')), T(C('studio')), AT(C('studio'), 'dole')];
  const fx = []; rng.forEach(([a, b], i) => { for (let l = a; l <= b; l++) fx.push({ t: cues[i], until: i < 4 ? cues[i + 1] : T(C('ok2')), sel: '.l' + l }); });
  const FS = 30, LH = FS * 1.6, PH = 120 + lines.length * LH, PX = X(-1300), PY = Y(-1450 + 250 + PH / 2);
  W.prompt({ x: PX, y: PY, z: 20, w: 2400, h: PH, autoH: false, in: T(C('raw')) - .2, fs: FS, head: 'Prompt · pokus 2', meta: 'EN · 3 reference', text: lines.join('\n'), fx });
  [['raw', 'RAW photo + NOT… hned na začátku', 'b'], ['roles', 'každá reference má roli', 'b'], ['shirt', 'tričko popsané detailně', 'b'], ['studio', '„studio photoshoot“ místo „character sheet“', 'g']].forEach(([cue, txt, c], i) => {
    const [a, b] = rng[i]; W.html({ x: PX - 1200 - 520, y: PY - PH / 2 + 110 + ((a + b) / 2) * LH, z: 80, w: 1000, h: 200, in: T(C(cue)), anim: 'pop',
      html: `<div style="display:flex;justify-content:flex-end"><span class="mpill ${c}" style="font-size:36px;padding:12px 26px;white-space:normal;text-align:right;max-width:980px"><span class="d"></span>${txt}</span></div>` });
  });

  W.img({ x: X(1600), y: Y(-300), z: 30, w: 900, h: 1612, src: '../assets/img/09_img.jpg', cap: 'výsledek · pokus 2', in: T(C('ok2')) - .2, anim: 'flip', dof: false, float: 4 });
  [['fotorealistický', 'fotorealistické, jako ze studia', 'g'], ['plešatá', 'plešatá hlava, červené tváře, knírek, bříško', 'g'], ['Tričko', 'tričko přesně to z videa', 'g'], ['Drobnosti', 'obličej pořád trochu „učesanější“', 'o']].forEach(([w, txt, c], i) =>
    W.callout({ x: X(3200), y: Y(-900 + i * 330), z: 80, w: 1300, in: AT(C('ok2'), w), c, lab: c === 'g' ? '✓' : 'pozor', txt: `<b>${txt}</b>` }));

  flyTo('k04', { x: X(-1300), y: Y(-2400), d: 2400 });
  cam({ t: AT(C('s3'), 'novou') - .3, dur: 1.0, x: X(-1300), y: Y(-1900), d: 2600, ease: 'smooth', rx: 2, ry: 3, push: .04 });
  rng.slice(0, 4).forEach(([a, b], i) => cam({ t: cues[i] - .3, dur: 1.0, x: PX - 500, y: PY - PH / 2 + 110 + ((a + b) / 2) * LH, d: 2700, ease: 'smooth', rx: 2, ry: i % 2 ? 3 : -3, push: .04 }));
  cam({ t: T(C('ok2')) - .3, dur: 1.4, x: X(2300), y: Y(-300), d: 3900, ease: 'whip', rx: 3, ry: -5, push: .05 });
})();
