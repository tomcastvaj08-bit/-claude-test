// K13 · Krok 12: risery na dopad, kamera jako adjustment layer (easing křivky živě), max zoom 11 %, Apple zvuky.
(() => {
  const { T, AT, cam, link, node, clamp, ease, lerp, EASE } = ENGINE;
  const { A, CH, reel, flyTo } = L;
  const o = A.k13, X = v => o.x + v, Y = v => o.y + v;
  const C = n => 'k13.' + n;

  W.card({ x: X(-2300), y: Y(-2700), w: 1900, in: CH('k13') + 1.0, kicker: 'Krok 12', title: 'Risery, kamera, <span class="gr">Apple zvuky</span>' });
  W.quote({ x: X(-2300), y: Y(-1500), z: 40, w: 2100, in: T(C('q12a')), q: '„Navrstvi 2–3 risery: začne potichu kousek před zakopnutím, zesiluje přes kafe, obličej, a <em>skončí, když to spadne na sedmičku</em>.“' });
  W.quote({ x: X(-2300), y: Y(-350), z: 60, w: 2100, in: T(C('q12b')), q: '„Chybí mi kamera movement jako <em>adjustment layer</em> v After Effects. Push in, push out, quadratic, ease in, ease out… aby se pořád něco dělo.“' });
  W.quote({ x: X(-2300), y: Y(620), z: 80, w: 1400, in: T(C('q12c')), q: '„A čistý <em>Apple zvuky</em>.“' });

  // risery: tři křivky, všechny vrcholí na dopadu kafe
  const GW = 2400, GH = 520, tx = s => s / 6 * GW, IMP = 4.6, ST = 1.4;
  const curve = (pow, amp) => { let d = `M${tx(ST)} ${GH - 20}`; for (let s = ST; s <= IMP; s += .05) d += ` L${tx(s)} ${GH - 20 - Math.pow((s - ST) / (IMP - ST), pow) * amp}`; return d + ` L${tx(IMP + .05)} ${GH - 20}`; };
  W.html({ x: X(1500), y: Y(-2000), z: 30, w: 2700, h: 860, in: T(C('risers')), anim: 'tilt',
    fx: [['šumovej', 0], ['tónovej', 1], ['jemnej', 2], ['švihy', 3]].map(([w, i]) => ({ t: AT(C('risers'), w), sel: '.r' + i })),
    html: `<div class="card" style="height:100%;padding:40px 46px"><span class="kick o"><span class="d"></span>3 risery · všechny vrcholí na dopadu</span>
      <svg viewBox="0 0 ${GW} ${GH}" style="width:100%;height:${GH}px;margin-top:20px;overflow:visible">
        <line x1="${tx(IMP)}" y1="0" x2="${tx(IMP)}" y2="${GH}" stroke="#D42A1E" stroke-width="6" stroke-dasharray="14 10"/>
        <text x="${tx(IMP) + 16}" y="40" font-family="GeistMono" font-size="34" fill="#D42A1E">dopad na 7</text>
        <text x="${tx(ST)}" y="${GH + 10}" font-family="GeistMono" font-size="28" fill="#687182">před zakopnutím</text>
        ${[[2.2, 420, '#F07A1A', 'šum'], [1.4, 360, '#1F4DFF', 'tón'], [3, 280, '#13B97A', 'jemný']].map(([p, a, c], i) => `<path class="r${i}" d="${curve(p, a)}" fill="${c}" fill-opacity="0.14" stroke="${c}" stroke-width="6" style="opacity:calc(.15 + var(--hl,0)*.85)"/>`).join('')}
        <g class="r3" style="opacity:var(--hl,0)">${[2.4, 2.9].map(s => `<rect x="${tx(s)}" y="${GH - 120}" width="90" height="70" rx="14" fill="#7C3AED"/>`).join('')}<text x="${tx(2.4)}" y="${GH - 140}" font-family="GeistMono" font-size="28" fill="#7C3AED">2 švihy na pád</text></g>
      </svg></div>` });

  // kamera jako adjustment layer: vrstvy ve 3D
  const tAdj = T(C('adj'));
  W.layers({ x: X(1500), y: Y(-200), z: -200, w: 1700, h: 950, gap: 300, in: tAdj, rx: 50, rz: -28, layers: [
    { cls: 'dark', html: `<div style="padding:60px;font:600 60px var(--sans);color:#fff;opacity:.85">hotový obraz</div>` },
    { cls: 'ghost-b', html: `<div style="padding:60px;font:600 60px var(--sans);color:var(--blue)">kamera · adjustment layer</div>` },
  ] });

  // easing křivky: graf + kulička + ukázka zoomu se stejnou křivkou
  const curves = [['linear', 'linear'], ['quad', 'quad'], ['cubic', 'cubic'], ['quart', 'quart'], ['expo', 'expo'], ['sine', 'sine']];
  const cpos = i => ({ x: X(-2000 + (i % 3) * 1650), y: Y(1900 + Math.floor(i / 3) * 1050) });
  curves.forEach(([w, e], i) => {
    const fn = EASE[e]; let d = 'M20 380'; for (let k = 0; k <= 100; k++) d += ` L${20 + k * 5.2} ${380 - fn(k / 100) * 340}`;
    const p = cpos(i), tin = AT(C('curves'), w);
    W.html({ x: p.x, y: p.y, z: 30, w: 1550, h: 920, in: T(C('curves')) - .2 + i * .1, anim: 'flip',
      html: `<div class="card" style="height:100%;padding:34px 40px"><div style="display:flex;justify-content:space-between"><span style="font:650 56px var(--mono);color:var(--blue)">${w}</span></div>
        <div style="display:flex;gap:30px;margin-top:20px;align-items:center"><svg viewBox="0 0 560 400" style="width:560px;height:400px"><path d="${d}" fill="none" stroke="#1F4DFF" stroke-width="7"/><circle class="bl" r="18" fill="#0A0D14"/></svg>
        <div class="pic" style="width:560px;height:315px"><img class="zm" src="${reel(19.5)}"></div></div></div>`,
      update: (n, t) => {
        n.el.style.opacity *= t < tin - .1 ? .4 : 1;
        const q = ((t - T(C('curves'))) / 1.6) % 1, k = clamp(q * 1.25), v = fn(k);
        const b = n.el.querySelector('.bl'); b.setAttribute('cx', 20 + k * 520); b.setAttribute('cy', 380 - v * 340);
        n.el.querySelector('.zm').style.transform = `scale(${1 + v * .11})`;
      } });
  });
  W.callout({ x: X(-400), y: Y(4050), z: 60, w: 3600, in: T(C('curvesx')), lab: 'Jak je číst',
    txt: '<b>linear</b> roboticky stejná rychlost · <b>quad → cubic → quart</b> čím dál silnější rozjezd a brzda · <b>expo</b> skoro švih · <b>sine</b> nejjemnější, jako nádech' });

  // max zoom 11 %, aby nezmizela hlavička
  const tM = T(C('max11'));
  W.html({ x: X(4000), y: Y(1900), z: 40, w: 2000, h: 1300, in: T(C('zooms')), anim: 'tilt',
    fx: [{ t: AT(C('zooms'), 'nula'), sel: '.jp' }],
    html: `<div class="card" style="height:100%;padding:40px 46px"><span class="kick b"><span class="d"></span>rychlé zoomy + přeskoky <span class="jp" style="color:var(--blue);opacity:calc(.3 + var(--hl,0)*.7)">&nbsp;0,14 s</span></span>
      <div style="position:relative;margin-top:30px;height:900px;border-radius:20px;overflow:hidden"><img src="${reel(29.6)}" style="width:100%;height:100%;object-fit:cover">
        <div class="bx" style="position:absolute;border:8px solid var(--red);border-radius:12px"></div>
        <div class="lbl" style="position:absolute;right:20px;bottom:20px;background:#fff;border-radius:14px;padding:10px 18px;font:600 40px var(--mono);color:var(--red)"></div></div></div>`,
    update: (n, t) => {
      const z = 1 + .11 * ease('smooth', clamp((t - tM) / 1.4)), W2 = 1908 / z, H2 = 900 / z;
      const bx = n.el.querySelector('.bx'); Object.assign(bx.style, { left: (1908 - W2) / 2 + 'px', top: (900 - H2) / 2 + 'px', width: W2 + 'px', height: H2 + 'px' });
      n.el.querySelector('.lbl').textContent = `zoom ${Math.round((z - 1) * 100)} % · hlavička zůstane`;
    } });
  W.html({ x: X(4000), y: Y(3000), z: 80, w: 2000, h: 300, in: T(C('nore')), anim: 'pop',
    html: `<div class="card" style="height:100%;padding:34px 46px;display:flex;align-items:center;gap:30px"><span class="bignum" style="font-size:150px;color:var(--green)">3,5</span>
      <div><div style="font:650 48px var(--sans)">minuty</div><div style="font:500 28px var(--mono);color:var(--muted)">bez nového renderu</div></div></div>` });

  // Apple zvuková vrstva
  const ap = [['švih', 'jemný švih + ťuknutí na změnu scény'], ['tick', 'tiché tick na klíčová slova'], ['pop', 'měkký pop'], ['cinknutí', 'dvoutónové cinknutí na „Tak to zkus“']];
  W.html({ x: X(4000), y: Y(-1800), z: 40, w: 2000, h: 800, autoH: true, in: T(C('apple')), anim: 'tilt',
    fx: ap.map(([w], i) => ({ t: AT(C('apple'), w), sel: '.a' + i })),
    html: `<div class="card" style="padding:40px 46px"><div style="display:flex;align-items:center;gap:20px">${L.logo('apple', 70)}<span style="font:650 60px var(--sans)">Apple vrstva</span></div>
      <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px">${ap.map(([, t2], i) => `<div class="a${i}" style="font:500 36px var(--sans);opacity:calc(.3 + var(--hl,0)*.7);display:flex;gap:16px"><span style="color:var(--green)">♪</span>${t2}</div>`).join('')}</div></div>` });
  W.callout({ x: X(-2300), y: Y(1500), z: 120, w: 2100, in: T(C('meta12')), c: 'g', lab: 'Mimochodem', txt: 'I kamera v tomhle videu používá <b>stejné křivky a pomalý push in</b>. Proto se obraz pořád jemně hýbe.' });

  // ---------- kamera ----------
  flyTo('k13', { x: X(-2300), y: Y(-2550), d: 2300 });
  cam({ t: T(C('q12a')) - .3, dur: 1.2, x: X(-2300), y: Y(-1500), d: 2600, ease: 'smooth', rx: 3, ry: 6, push: .05 });
  cam({ t: T(C('q12b')) - .3, dur: 1.0, x: X(-2300), y: Y(-400), d: 2600, ease: 'smooth', rx: 2, ry: 5, push: .05 });
  cam({ t: T(C('q12c')) - .3, dur: .9, x: X(-2300), y: Y(450), d: 2300, ease: 'smooth', rx: 1, ry: 4 });
  cam({ t: T(C('risers')) - .3, dur: 1.5, x: X(1500), y: Y(-2000), d: 2900, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: tAdj - .3, dur: 1.5, x: X(1500), y: Y(-150), d: 3300, ease: 'smooth', rx: 18, ry: -10, push: .05 });
  cam({ t: T(C('curves')) - .3, dur: 1.6, x: X(-350), y: Y(2400), d: 5600, ease: 'smooth', rx: 6, ry: 0, push: .03 });
  curves.forEach(([w], i) => { const p = cpos(i); cam({ t: AT(C('curves'), w) - .3, dur: .8, x: p.x, y: p.y, d: 2300, ease: 'whip', rx: 2, ry: (i % 3 - 1) * 4, push: .04 }); });
  cam({ t: T(C('curvesx')) - .3, dur: 1.4, x: X(-350), y: Y(3300), d: 5200, ease: 'smooth', rx: 6, ry: 0, push: .03 });
  cam({ t: T(C('zooms')) - .3, dur: 1.4, x: X(4000), y: Y(1900), d: 2800, ease: 'whip', rx: 2, ry: -6, push: .05 });
  cam({ t: T(C('nore')) - .3, dur: 1.0, x: X(4000), y: Y(2700), d: 2700, ease: 'smooth', rx: 0, ry: -4 });
  cam({ t: T(C('apple')) - .3, dur: 1.6, x: X(4000), y: Y(-1800), d: 2600, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: T(C('meta12')) - .3, dur: 1.8, x: X(-2300), y: Y(1500), d: 2600, ease: 'smooth', rx: 4, ry: 8, push: .03 });
})();
