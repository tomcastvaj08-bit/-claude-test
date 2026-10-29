// K01 · Ukázková kapitola: karta kroku, callouty na slova, prompt se zvýrazněním řádků, čára mezi uzly.
// Vzor pro každou další kapitolu: o = kotva kapitoly, X/Y = posun od kotvy, všechno navázané na T()/AT(), kamera na konci.
(() => {
  const { T, AT, cam, link } = ENGINE;
  const { A, CH, flyTo } = L;
  const o = A.k01, X = v => o.x + v, Y = v => o.y + v;   // x, y uzlu = jeho STŘED

  W.card({ x: X(0), y: Y(-1300), w: 1900, in: CH('k01') + 1.2, kicker: 'Krok 01', kc: 'b',
    title: 'Scénář s <span class="gr">cue značkami</span>', lead: 'odstavec = kus hlasu · <b>{#cue}</b> = kdy co naskočí' });

  // tři callouty, každý na své slovo v hlase
  [['odstavec', 'Odstavec', 'jeden kus hlasu, pauza mezi odstavci 0,35 s', ''], ['značky', 'Cue značka', '<b>{#prompt}</b> → T(\'k01.prompt\')', 'g'],
    ['naskočit', 'Slovo', 'AT(\'k01.what\', \'naskočit\') → přesný čas slova', 'o']].forEach(([w, lab, txt, c], i) =>
    W.callout({ x: X(-2000 + i * 2000), y: Y(-250), z: 40, w: 1800, in: AT('k01.what', w), c, lab, txt }));

  // prompt v angličtině: řádky se zvýrazní na slova "styl", "kamera", "zvuk"
  const text = 'STYLE: Spider-Verse comic look, bold ink outlines, halftone dots.\nCAMERA: ultra-wide fisheye, slow push in, then whip pan.\nSOUND: real foley only, no music.';
  W.prompt({ id: 'prompt', x: X(0), y: Y(1100), z: 20, w: 2600, fs: 40, in: T('k01.prompt'), head: 'Prompt · ukázka', meta: 'EN',
    text, fx: [['styl', 0], ['kamera', 1], ['zvuk', 2]].map(([w, l]) => ({ t: AT('k01.prompt', w), until: l < 2 ? AT('k01.prompt', ['kamera', 'zvuk'][l]) : null, sel: '.l' + l })) });
  link({ a: { x: X(0), y: Y(-50) }, b: { x: X(0), y: Y(700) }, in: T('k01.prompt') - .2, dur: .8, soft: true, w: 6, bend: .15 });

  W.callout({ x: X(0), y: Y(2300), z: 60, w: 2000, in: T('k01.rule'), c: 'r', lab: 'Pravidlo 1', txt: '<b>Žádná statická scéna.</b> Kamera se pořád hýbe (slow push po dosednutí).' });

  // ---------- kamera: na každou cue jeden záběr, x/y = střed toho, na co se díváme ----------
  flyTo('k01', { x: X(0), y: Y(-1250), d: 2300 });
  cam({ t: AT('k01.what', 'odstavec') - .5, dur: 1.3, x: X(0), y: Y(-450), d: 4600, ease: 'smooth', rx: 4, ry: 3 });
  cam({ t: T('k01.prompt') - .3, dur: 1.2, x: X(0), y: Y(1100), d: 2700, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: T('k01.rule') - .3, dur: 1.1, x: X(0), y: Y(2300), d: 2100, ease: 'whip', rx: 2, ry: 5, push: .05 });
})();
