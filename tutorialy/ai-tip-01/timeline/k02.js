// K02 · Krok 1: Příprava na Macu – chybí ffmpeg a Playwright, je Node + Chrome → npm (puppeteer-core, ffmpeg-static) → fonty.
(() => {
  const { T, AT, cam, link } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { pill, term, bad, ok } = U;
  const o = A.k02, X = v => o.x + v, Y = v => o.y + v, C = n => 'k02.' + n;

  W.card({ x: X(-1200), y: Y(-2400), w: 1900, in: CH('k02') + 1.0, kicker: 'Krok 01', kc: 'b', title: 'Příprava <span class="gr">na Macu</span>', lead: 'Co na počítači je a co chybí' });

  // stav Macu
  const m = C('mac');
  const st = [['ffmpeg', bad('ffmpeg'), 'nenalezen'], ['Playwright', bad('Playwright pro Python'), 'nenalezen'], ['Node', ok('Node 22'), 'je'], ['Chrome', ok('Google Chrome'), 'je']];
  W.html({ x: X(-1350), y: Y(-1250), z: 30, w: 1800, h: 760, in: T(m) + .2, anim: 'tilt',
    html: term('mac · terminál', st.map(([, l, s]) => `${l}<span style="color:#7F8AA3">  · ${s}</span>`), 46),
    fx: st.map(([w], i) => ({ t: AT(m, w), sel: '.t' + i })) });
  W.callout({ x: X(-1350), y: Y(-570), z: 80, w: 1500, in: AT(m, 'zádrhel'), c: 'r', lab: 'zádrhel', txt: '<b>Žádný ffmpeg ani Playwright</b> – jen Node a Chrome' });

  // npm
  const n = C('npm');
  W.html({ x: X(1500), y: Y(-2250), z: 30, w: 2100, h: 330, in: AT(n, 'Novej') - .2, anim: 'tilt',
    html: term('nový projekt · terminál', ['<span style="color:#13B97A">$</span> npm install puppeteer-core ffmpeg-static'], 42),
    fx: [{ t: AT(n, 'npm') + .3, sel: '.t0' }] });
  W.html({ x: X(1500), y: Y(-2620), z: 60, w: 1400, h: 150, in: AT(n, 'Novej'), anim: 'rise', html: pill('nový projekt na ploše', '', 46) });
  [['Puppeteer', 'puppeteer-core', 'ovládá nainstalovaný Chrome', 'chrome', 700], ['ffmpeg', 'ffmpeg-static', 'hotová binárka ffmpegu', 'ffmpeg', 2700]].forEach(([w, name, sub, lg, x]) => {
    W.html({ x: X(x), y: Y(-1350), z: 50, w: 1900, h: 380, in: AT(n, w), anim: 'flip',
      html: `<div class="card" style="height:100%;padding:44px 50px;display:flex;align-items:center;gap:34px">${logo(lg, 130)}
        <div><div style="font:650 64px var(--mono);letter-spacing:-.03em">${name}</div><div style="font:500 38px var(--sans);color:var(--ink2);margin-top:10px">${sub}</div></div></div>` });
    link({ a: { x: X(1500), y: Y(-2080) }, b: { x: X(x), y: Y(-1540) }, in: AT(n, w) + .1, soft: true, z: -10 });
  });

  // fonty ze skillu
  const f = C('fonts');
  W.html({ x: X(700), y: Y(-200), z: 40, w: 1900, h: 560, in: AT(f, 'fonty'), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:44px 50px"><span class="kick b"><span class="d"></span>Inter · s češtinou</span>
      <div style="font:800 150px/1.05 Inter, var(--sans);letter-spacing:-.04em;margin-top:30px">Ťuk Ěš Ůř</div>
      <div style="font:500 38px var(--sans);color:var(--muted);margin-top:14px">příliš žluťoučký kůň</div></div>` });
  W.html({ x: X(2700), y: Y(-200), z: 40, w: 1900, h: 560, in: AT(f, 'Geist'), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:44px 50px"><span class="kick g"><span class="d"></span>Geist Mono</span>
      <div style="font:600 120px/1.1 var(--mono);letter-spacing:-.02em;margin-top:34px">0123 →</div>
      <div style="font:500 38px var(--mono);color:var(--muted);margin-top:14px">štítky · čísla · prompty</div></div>` });
  W.html({ x: X(1700), y: Y(260), z: 80, w: 1600, h: 150, in: T(f) + .1, anim: 'rise', html: pill('zkopírováno ze skillu 3D tutoriálu', 'b', 44) });

  flyTo('k02', { x: X(-1200), y: Y(-2250), d: 2400 });
  cam({ t: T(m) + .4, dur: 1.4, x: X(-1350), y: Y(-1100), d: 2800, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: AT(n, 'Novej') - .5, dur: 1.3, x: X(1500), y: Y(-2300), d: 2500, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: AT(n, 'Puppeteer') - .4, dur: 1.2, x: X(1700), y: Y(-1650), d: 3700, ease: 'smooth', rx: 4, ry: 3, push: .04 });
  cam({ t: T(f) - .3, dur: 1.3, x: X(1700), y: Y(-100), d: 3600, ease: 'whip', rx: 3, ry: -4, push: .05 });
})();
