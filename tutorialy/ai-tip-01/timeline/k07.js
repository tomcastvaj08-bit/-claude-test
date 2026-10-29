// K07 · Krok 6: Chyby první verze – 4 chyby (červené) → oprava (zelená), LUFS měřák −27 → −14, NaN, render 1,5 min.
(() => {
  const { T, AT, cam, clamp, ease, lerp } = ENGINE;
  const { A, CH, flyTo } = L;
  const { pill, big } = U;
  const o = A.k07, X = v => o.x + v, Y = v => o.y + v, C = n => 'k07.' + n;

  W.card({ x: X(-1300), y: Y(-2600), w: 1900, in: CH('k07') + 1.0, kicker: 'Krok 06', kc: 'r', title: 'Chyby <span class="gr">první verze</span>' });

  // chyba = červená karta s čísly, oprava = zelené callouty pod ní
  const errCard = (n, title, items) => `<div class="card" style="height:100%;padding:40px 46px;border:4px solid rgba(212,42,30,.35)">
    <div style="display:flex;align-items:center;gap:22px"><span style="width:80px;height:80px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center;font:700 40px var(--mono)">${n}</span>
    <span style="font:650 58px var(--sans);letter-spacing:-.04em">${title}</span></div>
    <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px">${items.map((t, i) => `<div class="e${i}" style="font:500 40px/1.3 var(--sans);opacity:calc(.15 + var(--hl,0)*.85)"><span style="color:var(--red)">✕</span> ${t}</div>`).join('')}</div></div>`;

  // 1 · přetečení zásobníku
  const b1 = C('bug1');
  W.html({ x: X(-1300), y: Y(-1600), z: 30, w: 1900, h: 520, in: T(b1) + .1, anim: 'tilt', html: errCard(1, 'přetečení zásobníku', ['seek() volá sama sebe', 'seek() → seek() → seek() …']),
    fx: [{ t: AT(b1, 'funkce'), sel: '.e0' }, { t: AT(b1, 'sebe'), sel: '.e1' }] });
  W.callout({ x: X(-1300), y: Y(-1110), z: 80, w: 1600, in: AT(b1, 'přejmenovat'), c: 'g', lab: 'oprava', txt: '<b>funkce přejmenovaná</b>' });

  // 2 · kontaktní list
  const b2 = C('bug2');
  W.html({ x: X(1300), y: Y(-1600), z: 30, w: 1900, h: 520, in: T(b2) + .1, anim: 'tilt', html: errCard(2, 'kontaktní list', ['spodní půlka prázdná', 'cenovka přes text', 'konec nečitelný']),
    fx: [{ t: AT(b2, 'Spodní'), sel: '.e0' }, { t: AT(b2, 'cenovka'), sel: '.e1' }, { t: AT(b2, 'konec'), sel: '.e2' }] });
  W.callout({ x: X(1300), y: Y(-1080), z: 80, w: 1600, in: AT(b2, 'Posunuly'), c: 'g', lab: 'oprava', txt: '<b>nové pozice + tmavá pilulka</b> pod koncovým textem' });

  // 3 · zvuk: LUFS měřák, NaN
  const b3 = C('bug3'), tBad = AT(b3, 'dvacet'), tFix = AT(b3, 'dorovnala');
  W.html({ x: X(-1300), y: Y(-50), z: 30, w: 1900, h: 760, in: T(b3) + .1, anim: 'tilt',
    update: (n, t) => {
      const v = t < tFix ? lerp(-14, -27, ease('out', clamp((t - tBad) / 1.0))) : lerp(-27, -14, ease('out', clamp((t - tFix) / 1.2)));
      n.el.querySelector('.lv').textContent = (v <= -13.95 && t < tBad ? '−14' : '−' + Math.abs(v).toFixed(0));
      n.el.querySelector('.lv').style.color = v < -15 ? 'var(--red)' : 'var(--green)';
      n.el.querySelector('.bar').style.width = ((v + 40) / 40 * 100) + '%';
      n.el.querySelector('.bar').style.background = v < -15 ? 'var(--red)' : 'var(--green)';
    },
    html: `<div class="card" style="height:100%;padding:40px 50px"><div style="display:flex;align-items:center;gap:22px"><span style="width:80px;height:80px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center;font:700 40px var(--mono)">3</span><span style="font:650 58px var(--sans);letter-spacing:-.04em">zvuk</span></div>
      <div style="display:flex;align-items:baseline;gap:24px;margin-top:30px"><span class="lv bignum" style="font-size:220px">−14</span><span style="font:600 56px var(--mono)">LUFS</span></div>
      <div style="position:relative;height:56px;border-radius:28px;background:#EEF2FA;margin-top:20px"><div class="bar" style="position:absolute;left:0;top:0;bottom:0;border-radius:28px"></div>
        <div style="position:absolute;left:65%;top:-14px;bottom:-14px;width:6px;background:var(--ink)"></div></div>
      <div style="font:500 30px var(--mono);color:var(--muted);margin-top:14px;text-align:right">cíl −14</div></div>` });
  W.html({ x: X(1300), y: Y(-250), z: 60, w: 1700, h: 420, in: AT(b3, 'NaN'), anim: 'pop', html: big('NaN', 'hudba = neplatná čísla', 230, 'var(--red)') });
  W.callout({ x: X(1300), y: Y(150), z: 80, w: 1700, in: AT(b3, 'Filtr'), c: 'r', lab: 'příčina', txt: '<b>filtr nad 1/6 vzorkovací frekvence</b> exploduje' });
  W.callout({ x: X(1300), y: Y(470), z: 80, w: 1700, in: AT(b3, 'omezila'), c: 'g', lab: 'oprava', txt: '<b>omezená frekvence + pojistka</b>, hlasitost dorovnaná' });

  // 4 · dvě drobnosti
  const b4 = C('bug4');
  W.html({ x: X(-1300), y: Y(1250), z: 30, w: 1900, h: 460, in: T(b4) + .1, anim: 'tilt', html: errCard(4, 'dvě drobnosti', ['zoom: černý okraj', 'konec ~3 s na místě']),
    fx: [{ t: AT(b4, 'Zoom'), sel: '.e0' }, { t: AT(b4, 'konec'), sel: '.e1' }] });
  W.callout({ x: X(1300), y: Y(1150), z: 80, w: 1700, in: AT(b4, 'přilétá'), c: 'g', lab: 'oprava', txt: '<b>nová scéna přilétá zvětšená</b>' });
  W.callout({ x: X(1300), y: Y(1440), z: 80, w: 1700, in: AT(b4, 'záložka'), c: 'g', lab: 'oprava', txt: '<b>konec zkrácený</b> a záložka dýchá' });

  // render v1
  const d = C('v1done');
  W.html({ x: X(0), y: Y(2250), z: 60, w: 2200, h: 520, in: AT(d, 'minutu'), anim: 'pop', html: big('1,5 min', 'render první verze', 240) });

  flyTo('k07', { x: X(-1300), y: Y(-2450), d: 2400 });
  cam({ t: T(b1) - .1, dur: 1.3, x: X(-1300), y: Y(-1450), d: 2500, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: T(b2) - .3, dur: 1.2, x: X(1300), y: Y(-1450), d: 2500, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(b3) - .3, dur: 1.3, x: X(-1300), y: Y(-50), d: 2600, ease: 'whip', rx: 3, ry: 4, push: .05 });
  cam({ t: AT(b3, 'NaN') - .4, dur: 1.2, x: X(1300), y: Y(80), d: 2700, ease: 'whip', rx: 2, ry: -4, push: .04 });
  cam({ t: tFix - .6, dur: 1.2, x: X(0), y: Y(100), d: 4300, ease: 'smooth', rx: 4, ry: 2, push: .03 });
  cam({ t: T(b4) - .3, dur: 1.3, x: X(0), y: Y(1300), d: 4000, ease: 'whip', rx: 3, ry: -4, push: .05 });
  cam({ t: T(d) - .3, dur: 1.3, x: X(0), y: Y(2200), d: 2700, ease: 'whip', rx: 4, ry: 4, push: .05 });
})();
