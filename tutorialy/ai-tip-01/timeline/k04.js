// K04 · Krok 3: Hlas a zvuky – ElevenLabs (eleven_v4, Aura, 2 verze, tagy), Scribe časy slov, 5 SFX, beat ✕ → syntéza v JS.
(() => {
  const { T, AT, cam, clamp, ease } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { pill, tile } = U;
  const o = A.k04, X = v => o.x + v, Y = v => o.y + v, C = n => 'k04.' + n;

  W.card({ x: X(-1300), y: Y(-2500), w: 1900, in: CH('k04') + 1.0, kicker: 'Krok 03', kc: 'b', title: 'Hlas <span class="gr">a zvuky</span>' });

  // ElevenLabs karta
  const v = C('voice');
  const rows = [['model', 'model', 'eleven_v4'], ['Aura', 'hlas', 'Aura'], ['dvě', 'verze', '2']];
  W.html({ x: X(-1300), y: Y(-1500), z: 30, w: 1900, h: 760, in: AT(v, 'ElevenLabs'), anim: 'tilt',
    fx: rows.map(([w], i) => ({ t: AT(v, w), sel: '.r' + i })).concat([{ t: AT(v, 'tagy'), sel: '.tg' }]),
    html: `<div class="card" style="height:100%;padding:40px 50px"><div style="display:flex;align-items:center;gap:24px">${logo('elevenlabs', 90)}<span style="font:650 62px var(--sans);letter-spacing:-.04em">ElevenLabs · hlas</span></div>
      <div style="margin-top:30px;display:flex;flex-direction:column;gap:14px">${rows.map(([, k, val], i) => `<div class="r${i}" style="display:flex;justify-content:space-between;font:500 44px var(--mono);padding:10px 0;border-bottom:2px solid var(--line);opacity:calc(.2 + var(--hl,0)*.8)"><span style="color:var(--muted)">${k}</span><b>${val}</b></div>`).join('')}</div>
      <div class="tg" style="margin-top:28px;font:500 40px var(--mono);color:var(--blue);opacity:var(--hl,0)">[confident] [relaxed] [brisk pace]</div></div>` });
  // dvě verze
  [['10,9 s', 10.9, 'g'], ['11 s', 11.0, '']].forEach(([lab, s, c], i) =>
    W.html({ x: X(-1300), y: Y(-850 + i * 190), z: 60, w: 1900, h: 160, in: AT(v, 'Verze') + i * .3, anim: 'rise',
      html: `<div style="height:100%;display:flex;align-items:center;gap:24px"><span style="font:600 40px var(--mono);width:90px">v${i + 1}</span>
        <div style="height:70px;width:${s / 11 * 1300}px;border-radius:35px;background:${i ? '#C9D3E6' : 'var(--grad)'}"></div><span style="font:700 46px var(--mono)">${lab}</span>
        ${i ? '' : `<span class="ok" style="font:700 46px var(--sans);color:var(--green);opacity:var(--hl,0)">✓ kratší</span>`}</div>`,
      fx: [{ t: AT(v, 'kratší'), sel: '.ok' }] }));

  // Scribe: waveform se slovy, slova dostávají začátek a konec
  const sc = C('scribe'), r = W.rng(5);
  const bars = Array.from({ length: 90 }, (_, i) => 18 + Math.abs(Math.sin(i * .37) * 70 + (r() - .5) * 60));
  const words = ['Přestaň', 'se', 'AI', 'ptát', 'nech', 'ji', 'ať', 'se', 'ptá'];
  W.html({ x: X(1700), y: Y(-2150), z: 30, w: 2400, h: 820, in: AT(sc, 'Scribe'), anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:40px 50px;position:relative"><span class="kick b"><span class="d"></span>ElevenLabs Scribe · časy slov</span>
      <div style="display:flex;align-items:center;gap:6px;height:220px;margin-top:30px">${bars.map(b => `<i style="flex:1;height:${b * 2}px;border-radius:5px;background:#C9D3E6"></i>`).join('')}</div>
      <div style="display:flex;gap:12px;margin-top:24px">${words.map((w, i) => `<div class="w w${i}" style="flex:${w.length + 2};opacity:var(--hl,0);border:3px solid var(--blue);border-radius:14px;background:var(--blue-soft);padding:10px 8px;text-align:center"><div style="font:650 34px var(--sans)">${w}</div><div style="font:500 18px var(--mono);color:var(--muted)">start → konec</div></div>`).join('')}</div>
      <div class="ph" style="position:absolute;top:150px;bottom:40px;width:5px;background:var(--blue);border-radius:3px;left:50px"></div></div>`,
    fx: words.map((w, i) => ({ t: AT(sc, 'přepíše') + i * .22, sel: '.w' + i, dur: .3 })),
    update: (n, t) => { const p = clamp((t - AT(sc, 'přepíše')) / 3.5); n.el.querySelector('.ph').style.left = (50 + p * 2300) + 'px'; } });
  W.callout({ x: X(1700), y: Y(-1500), z: 80, w: 1800, in: AT(sc, 'základ'), c: 'g', lab: 'základ', txt: '<b>Na tyhle časy dopadá všechna grafika</b>' });

  // SFX
  const sf = C('sfx');
  [['Boom', '💥', 'Boom'], ['whoosh', '〰', 'Whoosh'], ['flash', '✦', 'Flash'], ['psaní', '⌨', 'Psaní'], ['glitch', '▚', 'Glitch']].forEach(([w, sym, name], i) =>
    W.html({ x: X(1700 + (i - 2) * 620), y: Y(-450), z: 40, w: 580, h: 500, in: AT(sf, w), anim: 'pop', html: tile(sym, name, 'ElevenLabs SFX') }));
  W.html({ x: X(1700), y: Y(-860), z: 80, w: 1300, h: 150, in: T(sf), anim: 'rise', html: pill('zvukové efekty · ElevenLabs', 'b', 48) });
  W.html({ x: X(1700), y: Y(-20), z: 80, w: 1300, h: 150, in: AT(sf, 'šestnáct'), anim: 'rise', html: pill('~16 kreditů za efekt', 'b', 48) });

  // beat
  const b = C('beat');
  W.html({ x: X(-2300), y: Y(250), z: 60, w: 900, h: 260, in: T(b), anim: 'pop', html: `<div style="height:100%;display:grid;place-items:center;font:800 170px var(--sans);letter-spacing:-.05em">beat?</div>` });
  W.callout({ x: X(-850), y: Y(180), z: 60, w: 1300, in: AT(b, 'vrátil'), c: 'r', lab: '✕', txt: '<b>vrátil jen 1 sekundu</b>' });
  W.callout({ x: X(-850), y: Y(420), z: 60, w: 1300, in: AT(b, 'omezenej'), c: 'o', lab: 'proč', txt: '<b>omezený konektor</b> hudbu neumí' });
  W.html({ x: X(-1300), y: Y(880), z: 40, w: 1900, h: 560, in: AT(b, 'syntetizoval'), anim: 'tilt',
    html: `<div class="quote" style="height:100%;padding:40px 50px;font:500 36px/1.55 var(--mono)"><div style="color:#7F8AA3">// beat.js · syntéza</div>
      <div><span style="color:#8FB0FF">const</span> bpm = <span style="color:#13B97A">140</span>  <span style="color:#7F8AA3">// trap</span></div>
      <div>kick() · clap() · hihat() · bass()</div><div style="color:#7F8AA3">→ WAV bez konektoru</div></div>` });
  [['Trap', 'trap'], ['sto', '140 BPM'], ['kick', 'kick'], ['clap', 'clap'], ['basa', 'basa']].forEach(([w, t], i) =>
    W.html({ x: X(-2350 + i * 520), y: Y(1330), z: 90, w: 500, h: 140, in: AT(b, w), anim: 'pop', html: pill(t, 'g', 40) }));
  W.html({ x: X(-2350 + 5 * 520), y: Y(1330), z: 90, w: 500, h: 140, in: AT(b, 'clap') + .5, anim: 'pop', html: pill('hi-haty', 'g', 40) });

  flyTo('k04', { x: X(-1300), y: Y(-2350), d: 2400 });
  cam({ t: AT(v, 'ElevenLabs') - .2, dur: 1.2, x: X(-1300), y: Y(-1450), d: 2700, ease: 'smooth', rx: 3, ry: 4, push: .05 });
  cam({ t: AT(v, 'Verze') - .4, dur: 1.2, x: X(-1300), y: Y(-1150), d: 2900, ease: 'smooth', rx: 2, ry: -3, push: .04 });
  cam({ t: T(sc) - .3, dur: 1.3, x: X(1700), y: Y(-1950), d: 2800, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: T(sf) - .3, dur: 1.3, x: X(1700), y: Y(-350), d: 2900, ease: 'whip', rx: 4, ry: 5, push: .05 });
  cam({ t: T(b) - .3, dur: 1.4, x: X(-1300), y: Y(750), d: 3100, ease: 'whip', rx: 3, ry: -5, push: .05 });
})();
