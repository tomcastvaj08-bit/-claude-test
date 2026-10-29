// K09 · Krok 7: Druhá verze ve 3D – nový hlas (bez „Ulož si to“, „ájí“), CSS 3D kamera jako v AE, vytažený text z vrstev, krabice/stíny/koule/podlaha.
(() => {
  const { T, AT, cam, clamp, ease } = ENGINE;
  const { A, CH, flyTo } = L;
  const { pill, big, extrude } = U;
  const o = A.k09, X = v => o.x + v, Y = v => o.y + v, C = n => 'k09.' + n;

  W.card({ x: X(-1300), y: Y(-2600), w: 1900, in: CH('k09') + 1.0, kicker: 'Krok 07', kc: 'b', title: 'Druhá verze <span class="gr">ve 3D</span>' });

  // nový hlas
  const v = C('v2voice');
  W.html({ x: X(-1300), y: Y(-1650), z: 40, w: 1900, h: 560, in: AT(v, 'druhá') - .1, anim: 'tilt',
    fx: [{ t: AT(v, 'bez'), sel: '.x1' }, { t: AT(v, 'ájí'), sel: '.x2' }],
    html: `<div class="card" style="height:100%;padding:40px 50px"><span class="kick b"><span class="d"></span>scénář v2 · nový hlas</span>
      <div class="x1" style="font:650 60px var(--sans);margin-top:40px;color:var(--muted);text-decoration:line-through;text-decoration-color:rgba(212,42,30,var(--hl,0));text-decoration-thickness:8px">„Ulož si to.“</div>
      <div class="x2" style="font:650 60px var(--sans);margin-top:24px;opacity:calc(.2 + var(--hl,0)*.8)">AI → <span style="color:var(--blue)">„ájí“</span></div></div>` });
  [['kratší', '10,2 s', 'kratší verze'], ['Zrychlení', '×1,08', 'zrychlení'], ['video', '11 s', 'celé video']].forEach(([w, n, lab], i) =>
    W.html({ x: X(-2100 + i * 800), y: Y(-850), z: 60, w: 760, h: 380, in: AT(v, w), anim: 'pop', html: big(n, lab, 130, i === 2 ? '' : 'var(--ink)') }));

  // CSS 3D kamera
  const c = C('css');
  W.html({ x: X(1600), y: Y(-2400), z: 40, w: 2000, h: 200, in: T(c) + .1, anim: 'rise',
    html: `<div style="height:100%;display:flex;align-items:center;justify-content:center;gap:30px"><span class="mpill b" style="font-size:54px;padding:18px 36px">CSS 3D</span>
      <span class="wg" style="font:650 54px var(--mono);color:var(--muted);text-decoration:line-through;text-decoration-color:var(--red);text-decoration-thickness:6px;opacity:var(--hl,0)">WebGL</span></div>`,
    fx: [{ t: AT(c, 'WebGL'), sel: '.wg' }] });
  const parts = [['cíl', '.p0'], ['vzdálenost', '.p1'], ['natočení', '.p2'], ['ohnisko', '.p3']];
  W.html({ x: X(1600), y: Y(-1500), z: 30, w: 2200, h: 1000, in: T(c) + .3, anim: 'tilt',
    fx: parts.map(([w, s]) => ({ t: AT(c, w), sel: s })).concat([{ t: AT(c, 'Klíčový'), sel: '.kf' }]),
    update: (n, t) => { const s = t > AT(c, 'chvění') ? Math.sin(t * 23) * 6 + Math.sin(t * 37) * 4 : 0, b = t > AT(c, 'otřesy') ? Math.max(0, 1 - ((t - AT(c, 'otřesy')) % 1.2) * 3) * 18 * Math.sin(t * 60) : 0; n.el.querySelector('.cam').style.transform = `translate(${s + b}px,${s * .6}px)`; },
    html: `<div class="card" style="height:100%;padding:40px 50px;position:relative"><span class="kick b"><span class="d"></span>kamera jako v After Effects</span>
      <svg viewBox="0 0 2100 760" style="position:absolute;left:50px;top:130px;width:2100px;height:760px">
        <g class="p0" style="opacity:var(--hl,0)"><circle cx="1700" cy="380" r="34" fill="none" stroke="#13B97A" stroke-width="8"/><circle cx="1700" cy="380" r="8" fill="#13B97A"/><text x="1700" y="470" text-anchor="middle" font-family="Geist Mono" font-size="40" fill="#0A0D14">cíl</text></g>
        <g class="p1" style="opacity:var(--hl,0)"><line x1="420" y1="380" x2="1660" y2="380" stroke="#1F4DFF" stroke-width="6" stroke-dasharray="20 14"/><text x="1040" y="350" text-anchor="middle" font-family="Geist Mono" font-size="40" fill="#1F4DFF">vzdálenost</text></g>
        <g class="p2" style="opacity:var(--hl,0)"><path d="M240 230 A170 170 0 0 1 420 300" fill="none" stroke="#F07A1A" stroke-width="7"/><text x="200" y="200" font-family="Geist Mono" font-size="36" fill="#F07A1A">yaw · pitch · roll</text></g>
        <g class="p3" style="opacity:var(--hl,0)"><path d="M420 380 L1300 210 M420 380 L1300 550" stroke="#5B82FF" stroke-width="4" fill="none"/><text x="1300" y="620" font-family="Geist Mono" font-size="36" fill="#5B82FF">ohnisko</text></g>
        <g class="kf" style="opacity:var(--hl,0)"><path d="M60 720 C 500 720, 600 590, 1000 590 S 1500 680, 2040 600" stroke="#0A0D14" stroke-width="5" fill="none"/>${[60, 1000, 2040].map((x, i) => `<rect x="${x - 14}" y="${[720, 590, 600][i] - 14}" width="28" height="28" transform="rotate(45 ${x} ${[720, 590, 600][i]})" fill="#1F4DFF"/>`).join('')}<text x="1060" y="560" font-family="Geist Mono" font-size="32" fill="#687182">klíčové snímky s křivkami</text></g>
      </svg>
      <div class="cam" style="position:absolute;left:330px;top:440px;width:200px;height:140px;border-radius:24px;background:var(--ink);display:grid;place-items:center"><div style="width:70px;height:70px;border-radius:50%;border:10px solid #5B82FF"></div></div></div>` });
  [['chvění', 'chvění z ruky'], ['otřesy', 'otřesy při dopadech']].forEach(([w, t], i) =>
    W.html({ x: X(1050 + i * 1100), y: Y(-850), z: 80, w: 1000, h: 150, in: AT(c, w), anim: 'pop', html: pill(t, 'o', 44) }));

  // vytažený 3D text
  const e = C('extrude'), tE = AT(e, 'šestnáct');
  extrude({ x: X(-1300), y: Y(150), z: 0, w: 2200, h: 420, fs: 300, text: 'PŘESTAŇ', in: tE, layers: 17, step: 9, anim: 'fly', rx: 10, ry: -18 });
  W.html({ x: X(-1300), y: Y(-280), z: 200, w: 1600, h: 150, in: tE + .4, anim: 'rise', html: pill('16–18 vrstev za sebou', 'b', 46) });
  [['boky', 'boky tmavší'], ['čelo', 'čelo s gradientem']].forEach(([w, t], i) =>
    W.html({ x: X(-1850 + i * 1100), y: Y(560), z: 200, w: 1000, h: 150, in: AT(e, w), anim: 'pop', html: pill(t, i ? 'g' : '', 44) }));
  W.html({ x: X(-1300), y: Y(800), z: 200, w: 2000, h: 150, in: AT(e, 'dvakrát'), anim: 'pop', html: pill('kreslí se 2× větší → zmenší na ½ · ostrý', '', 44) });

  // svět: krabice, stíny, koule, podlaha, 2D vrstva
  const wd = C('world');
  W.html({ x: X(1600), y: Y(500), z: -40, w: 2400, h: 900, in: AT(wd, 'podlaha'), anim: 'deep', rx: 62,
    html: `<div style="height:100%;border-radius:40px;background:#0B1230;background-image:linear-gradient(rgba(91,130,255,.55) 3px,transparent 3px),linear-gradient(90deg,rgba(91,130,255,.55) 3px,transparent 3px);background-size:120px 120px"></div>` });
  W.html({ x: X(1100), y: Y(150), z: 60, w: 520, h: 520, in: AT(wd, 'krabice'), anim: 'pop', rx: -14, ry: 26,
    html: `<div style="height:100%;position:relative"><div style="position:absolute;inset:0;border-radius:30px;background:var(--grad);box-shadow:46px 46px 0 #13328F, 46px 46px 60px rgba(0,0,0,.35)"></div></div>` });
  W.html({ x: X(1100), y: Y(520), z: 10, w: 560, h: 120, in: AT(wd, 'kontaktní'), anim: 'fade',
    html: `<div style="height:100%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent)"></div>` });
  W.sphere({ x: X(2200), y: Y(180), z: 120, w: 420, h: 420, color: 'green', in: AT(wd, 'koule'), float: 10 });
  W.sphere({ x: X(2700), y: Y(380), z: -120, w: 240, h: 240, color: 'blue', in: AT(wd, 'koule') + .2, float: 10 });
  W.html({ x: X(1600), y: Y(1150), z: 220, w: 2400, h: 170, in: AT(wd, 'Masky'), anim: 'rise', html: pill('masky · flash · strobe = 2D vrstva nad 3D', 'o', 46) });

  flyTo('k09', { x: X(-1300), y: Y(-2450), d: 2400 });
  cam({ t: AT(v, 'druhá') - .4, dur: 1.3, x: X(-1300), y: Y(-1400), d: 2900, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: T(c) - .3, dur: 1.3, x: X(1600), y: Y(-1700), d: 3000, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: AT(c, 'chvění') - .4, dur: 1.2, x: X(1600), y: Y(-1300), d: 3100, ease: 'smooth', rx: 2, ry: 3, push: .03 });
  cam({ t: T(e) - .3, dur: 1.4, x: X(-1300), y: Y(250), d: 2900, ease: 'whip', rx: 8, ry: 10, push: .05 });
  cam({ t: T(wd) - .3, dur: 1.4, x: X(1600), y: Y(500), d: 3100, ease: 'whip', rx: 12, ry: -6, push: .05 });
})();
