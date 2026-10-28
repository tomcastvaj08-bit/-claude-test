// K01 · Cíl a postup: originál s časy (2 s přijde, rameno, 8 s odchází), co je úkol, dva kroky (Nano Banana 2.1 → Genjutsu).
(() => {
  const { T, AT, cam, link } = ENGINE;
  const { A, CH, flyTo, player, logo } = L;
  const o = A.k01, X = v => o.x + v, Y = v => o.y + v, C = n => 'k01.' + n;

  W.card({ x: X(-200), y: Y(-2300), w: 1900, in: CH('k01') + 1.0, kicker: 'Cíl', kc: 'b', title: 'Vyměnit <span class="gr">jen jednoho</span>' });
  player('original', { x: X(-1500), y: Y(0), z: 20, w: 900, a: 0, b: 9.8, loop: true, seqStart: T(C('goal')), in: T(C('goal')) - .2, anim: 'flip', dof: false });
  [['druhý', '~2 s', 'přijde zprava · červená mikina na zip'], ['rameno', '~4 s', 'poklepe na rameno, něco řekne'], ['osmý', '~8 s', 'odchází do kamery']].forEach(([w, tc, txt], i) =>
    W.callout({ x: X(250), y: Y(-650 + i * 300), z: 40, w: 1500, in: AT(C('goal'), w), c: 'r', lab: tc, txt: `<b>${txt}</b>` }));

  W.html({ x: X(250), y: Y(450), z: 60, w: 1500, h: 420, in: T(C('task')), anim: 'tilt',
    fx: [{ t: AT(C('task'), 'Šedofialový'), sel: '.of' }],
    html: `<div class="card" style="height:100%;padding:36px 44px"><span class="kick g"><span class="d"></span>úkol · nahradit jen jeho</span>
      <div style="font:650 54px var(--sans);letter-spacing:-.03em;margin-top:20px">plešatý chlap z referenčních fotek</div>
      <div class="of" style="font:500 34px var(--sans);color:var(--ink2);margin-top:16px;opacity:calc(.25 + var(--hl,0)*.75)">šedofialové tričko <b>adidas</b> · tmavomodré kraťasy · šedé nazouváky</div></div>` });

  const steps = [['Zaprvé', '01', 'nanobanana', 'Nano Banana 2.1', 'character sheet · obrázek'], ['zadruhé', '02', 'genjutsu', 'Higgsfield Genjutsu', 'výměna postavy ve videu']];
  steps.forEach(([w, n, key, name, sub], i) => W.html({ x: X(-900 + i * 2200), y: Y(1500), z: 40, w: 2000, h: 320, in: AT(C('steps'), w), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:34px 40px;display:flex;align-items:center;gap:30px"><span style="font:600 80px var(--mono);color:var(--blue)">${n}</span>${logo(key, 100)}
      <div><div style="font:650 54px var(--sans);letter-spacing:-.04em">${name}</div><div style="font:500 30px var(--mono);color:var(--muted);margin-top:6px">${sub}</div></div></div>` }));
  link({ a: { x: X(100), y: Y(1500) }, b: { x: X(300), y: Y(1500) }, in: AT(C('steps'), 'zadruhé'), dur: .5, w: 8, bend: 0 });

  flyTo('k01', { x: X(-200), y: Y(-2200), d: 2400 });
  cam({ t: T(C('goal')) - .3, dur: 1.4, x: X(-600), y: Y(0), d: 3500, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: T(C('task')) - .3, dur: 1.1, x: X(-500), y: Y(100), d: 3500, ease: 'whip', rx: 2, ry: -4, push: .05 });
  cam({ t: T(C('steps')) - .3, dur: 1.3, x: X(200), y: Y(1500), d: 3500, ease: 'whip', rx: 3, ry: 3, push: .05 });
})();
