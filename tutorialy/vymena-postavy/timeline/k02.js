// K02 · Krok 1: pět referencí (malé screenshoty) → jen tři nejlepší s rolemi (obličej / tělo / outfit).
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo } = L;
  const o = A.k02, X = v => o.x + v, Y = v => o.y + v, C = n => 'k02.' + n;
  const IMG = n => `../assets/img/${n}_img.jpg`;

  W.card({ x: X(0), y: Y(-2300), w: 1900, in: CH('k02') + 1.0, kicker: 'Krok 01', kc: 'b', title: 'Reference: <span class="gr">míň je víc</span>' });

  // [soubor, popis, slovo, w, h, role (pro vybrané)]
  const refs = [['03', 'ref1 · TikTok detail', 'Detail', 520, 1130, 'obličej + tričko · @image1'], ['04', 'ref2 · celá postava', 'postavu', 520, 1130, 'tělo + outfit · @image2'],
    ['05', 'ref3 · skupinová', 'skupinovou', 520, 1130, null], ['06', 'ref4 · selfie', 'selfíčka', 300, 535, null], ['07', 'ref5 · žlutá zeď', 'selfíčka', 400, 534, 'obličej · @image3']];
  refs.forEach(([f, cap, w, ww, hh, role], i) => {
    const x = X(-2200 + i * 1100), y = Y(-100);
    W.img({ x, y, z: 20 - Math.abs(i - 2) * 30, w: ww, h: hh, src: IMG(f), cap, in: AT(C('refs'), w) + (i === 4 ? .3 : 0), anim: 'pop', dof: false, float: 6, rz: (i - 2) * 2,
      fx: role ? [] : [{ t: T(C('best')) + 1.2, sel: '.pic', var: '--hl' }] });
    if (role) W.html({ x, y: Y(720), z: 120, w: 1100, h: 130, in: AT(C('best'), w === 'Detail' ? 'Detail' : w === 'postavu' ? 'postavu' : 'selfie', w === 'Detail' ? 1 : 1) , anim: 'pop',
      html: `<div style="display:flex;justify-content:center"><span class="mpill g" style="font-size:36px;padding:12px 26px"><span class="d"></span>${role}</span></div>` });
    else W.html({ x, y: Y(-100), z: 200, w: ww, h: hh, in: T(C('best')) + 1.0, anim: 'fade',
      html: `<div style="height:100%;border-radius:30px;background:rgba(244,246,249,.72);display:grid;place-items:center"><span style="font:700 120px var(--sans);color:var(--red)">✕</span></div>` });
  });
  W.callout({ x: X(0), y: Y(1250), z: 80, w: 2400, in: AT(C('lowres'), 'malý'), c: 'r', lab: 'Problém', txt: '<b>malé screenshoty v nízkém rozlišení</b> · model z nich obličej pořádně nepřečte' });
  W.html({ x: X(0), y: Y(1700), z: 100, w: 2400, h: 160, in: AT(C('best'), 'míň'), anim: 'pop',
    html: `<div style="text-align:center;font:700 80px var(--sans);letter-spacing:-.04em">míň a ostřejších <span class="gr">= víc</span></div>` });

  flyTo('k02', { x: X(0), y: Y(-2200), d: 2400 });
  cam({ t: T(C('refs')) - .3, dur: 1.4, x: X(0), y: Y(50), d: 4700, ease: 'smooth', rx: 4, ry: 2, push: .04 });
  cam({ t: T(C('lowres')) - .3, dur: 1.2, x: X(0), y: Y(600), d: 4200, ease: 'whip', rx: 2, ry: -4, push: .05 });
  cam({ t: T(C('best')) - .3, dur: 1.4, x: X(0), y: Y(500), d: 4700, ease: 'smooth', rx: 4, ry: 3, push: .04 });
})();
