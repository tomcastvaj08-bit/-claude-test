// K05 · Krok 4: Genjutsu pokus 1 – celý sheet jako reference, prompt, výsledek přegeneroval scénu (originál vs. pokus 1, snímky po sekundách), proč.
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo, player, logo } = L;
  const o = A.k05, X = v => o.x + v, Y = v => o.y + v, C = n => 'k05.' + n;

  W.card({ x: X(-1400), y: Y(-2500), w: 1900, in: CH('k05') + 1.0, kicker: 'Krok 04 · pokus 1', kc: 'o', title: 'Genjutsu <span class="gr">č. 1</span>' });
  W.html({ x: X(-1400), y: Y(-1650), z: 40, w: 2000, h: 150, in: T(C('s4')) + .5, anim: 'rise',
    html: `<div style="display:flex;gap:16px;justify-content:center;align-items:center">${logo('genjutsu', 80)}<span class="mpill b" style="font-size:36px;padding:12px 26px">Higgsfield Genjutsu</span><span class="mpill" style="font-size:36px;padding:12px 26px">9:16</span><span class="mpill" style="font-size:36px;padding:12px 26px">~10 s</span><span class="mpill" style="font-size:36px;padding:12px 26px">nejvyšší kvalita</span></div>` });

  // reference = celý sheet
  W.img({ x: X(-3300), y: Y(-400), z: 40, w: 560, h: 1003, src: '../assets/img/09_img.jpg', cap: 'reference: celý sheet', in: T(C('p4')), anim: 'pop', dof: false });

  const P = [
    'Replace only the man in the red zip-up jacket with curly brown hair and black pants (he walks in from the right, taps the man in the black hoodie on the shoulder, talks to him and walks out toward the camera) with the bald man from @image1.',
    'Keep his identity exactly as in @image1: same real face, same fully shaved bald head, same pale skin with red cheeks, same thin light stubble mustache, same body shape with belly. Outfit exactly as in @image1: light lavender-grey t-shirt with the big black "adidas" wordmark on the chest, navy blue drawstring shorts with white drawstrings, light grey slip-on shoes.',
    'He must do exactly the same movement and timing as the original man: walks in from the right, taps the shoulder, talks with the same gestures and head movement, then walks out past the camera. Same position, same scale, same lip movement as the original.',
    'Do not change the man in the black hoodie and grey sweatpants. Do not change the shop, shelves, lighting, camera movement or the people in the background. Photorealistic, real phone video look, natural skin texture, same lighting as the shop. No cartoon, no illustration.'];
  const wrap = (s, n = 64) => { const out = []; let line = ''; s.split(' ').forEach(w => { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); out.push(line); return out; };
  const lines = [], rng = [];
  P.forEach((p, i) => { if (i) lines.push(''); const a = lines.length; lines.push(...wrap(p)); rng.push([a, lines.length - 1]); });
  const cues = [AT(C('p4'), 'nahraď'), AT(C('p4'), 'reference'), AT(C('p4'), 'stejnej'), AT(C('p4'), 'konci')];
  const fx = []; rng.forEach(([a, b], i) => { for (let l = a; l <= b; l++) fx.push({ t: cues[i], until: i < 3 ? cues[i + 1] : T(C('fail4')), sel: '.l' + l }); });
  const FS = 30, LH = FS * 1.6, PH = 120 + lines.length * LH, PX = X(-1100), PY = Y(-1450 + 250 + PH / 2);
  W.prompt({ x: PX, y: PY, z: 20, w: 2300, h: PH, autoH: false, in: T(C('p4')) + .2, fs: FS, head: 'Prompt · Genjutsu pokus 1', meta: 'EN · ref = celý sheet', text: lines.join('\n'), fx });
  W.html({ x: PX, y: PY + PH / 2 - 120, z: 60, w: 2100, h: 120, in: AT(C('p4'), 'konci'), anim: 'pop',
    html: `<div style="display:flex;justify-content:center"><span class="mpill r" style="font-size:36px;padding:12px 26px;color:var(--red)">„do not change…“ až na konci = moc slabé</span></div>` });

  // výsledek
  const tF = T(C('fail4'));
  player('original', { x: X(1450), y: Y(-450), z: 20, w: 760, a: 0, b: 9.8, loop: true, seqStart: tF, in: tF - .3, anim: 'flip', dof: false });
  player('pokus1', { x: X(2350), y: Y(-450), z: 20, w: 760, a: 0, b: 9.8, loop: true, seqStart: tF, in: tF - .1, anim: 'flip', dof: false });
  [[1450, 'originál', ''], [2350, 'pokus 1', 'r']].forEach(([x, t, c]) => W.html({ x: X(x), y: Y(330), z: 60, w: 800, h: 100, in: tF, anim: 'rise',
    html: `<div style="display:flex;justify-content:center"><span class="kick ${c}" style="font-size:34px"><span class="d"></span>${t}</span></div>` }));
  [['oblečení', 'já mám jeho kraťasy a boty, jiný obličej'], ['jinej', 'jiný obchod, zboží i strop'], ['lidi', 'přidal lidi do pozadí'], ['Vzadu', 'červená mikina pořád vzadu'], ['přepálenej', 'přepálený obličej']].forEach(([w, txt], i) =>
    W.callout({ x: X(3700), y: Y(-1000 + i * 290), z: 80, w: 1250, in: AT(C('fail4'), w), c: 'r', lab: '✕', txt: `<b>${txt}</b>` }));
  W.img({ x: X(1900), y: Y(1350), z: 30, w: 2000, h: 1423, src: '../assets/img/14_img.jpg', cap: 'pokus 1 po sekundách', in: AT(C('fail4'), 'Obchod') - .2, anim: 'tilt', dof: false });
  [['rozlil', 'celý sheet s outfitem → rozlil oblečení i na mě'], ['slabá', '„do not change“ na konci = slabé → nová scéna místo úpravy']].forEach(([w, txt], i) =>
    W.callout({ x: X(-1100), y: Y(PH / 2 - 1450 + 250 + PH / 2 + 300 + i * 330), z: 80, w: 2300, in: AT(C('why4'), w), c: 'o', lab: 'proč', txt: `<b>${txt}</b>` }));

  flyTo('k05', { x: X(-1400), y: Y(-2400), d: 2400 });
  cam({ t: T(C('s4')) - .1, dur: 1.2, x: X(-1400), y: Y(-1900), d: 2700, ease: 'smooth', rx: 2, ry: 3, push: .04 });
  cam({ t: T(C('p4')) - .3, dur: 1.3, x: X(-2000), y: Y(-400), d: 4300, ease: 'whip', rx: 3, ry: 4, push: .04 });
  rng.forEach(([a, b], i) => cam({ t: cues[i] - .3, dur: 1.0, x: PX, y: PY - PH / 2 + 110 + ((a + b) / 2) * LH, d: 2500, ease: 'smooth', rx: 2, ry: i % 2 ? 3 : -3, push: .04 }));
  cam({ t: tF - .3, dur: 1.4, x: X(2500), y: Y(-450), d: 3300, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: AT(C('fail4'), 'Obchod') - .3, dur: 1.2, x: X(2300), y: Y(700), d: 4200, ease: 'smooth', rx: 4, ry: -2, push: .04 });
  cam({ t: T(C('why4')) - .3, dur: 1.3, x: X(-1100), y: Y(PH / 2 - 1450 + 250 + PH / 2 + 450), d: 3200, ease: 'whip', rx: 2, ry: 4, push: .05 });
})();
