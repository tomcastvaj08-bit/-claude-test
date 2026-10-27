// K05 · Krok 4: klon hlasu a Voice Changer – můj hlas → Voice Changer → klon; intonace / barva / plynulost: nikdy všechny tři.
(() => {
  const { T, AT, cam, link, clamp } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const o = A.k05, X = v => o.x + v, Y = v => o.y + v, C = n => 'k05.' + n;

  W.card({ x: X(0), y: Y(-1900), w: 1900, in: CH('k05') + 1.0, kicker: 'Krok 04', kc: 'b', title: 'Klon hlasu <span class="gr">+ Voice Changer</span>' });

  const box = (x, t, head, body, c = '') => W.html({ x: X(x), y: Y(-350), z: 30, w: 1250, h: 560, in: t, anim: 'pop',
    html: `<div class="card" style="height:100%;padding:36px 40px"><span class="kick ${c}"><span class="d"></span>${head}</span>${body}</div>` });
  box(-1900, AT(C('clone'), 'klona'), 'vstup', `<div style="font:650 54px var(--sans);margin-top:22px">můj hlas</div><div class="pic" style="height:220px;margin-top:22px;background:#F3F5FA"><img src="../assets/wave/original.png" style="width:100%;height:100%"></div>`, 'b');
  box(0, AT(C('clone'), 'Voice'), 'ElevenLabs', `<div style="display:flex;align-items:center;gap:24px;margin-top:22px">${logo('elevenlabs', 90)}<div style="font:650 56px var(--sans);letter-spacing:-.04em">Voice Changer</div></div>
    <div style="font:500 30px var(--mono);color:var(--muted);margin-top:24px">multilingual model</div>`, 'b');
  box(1900, AT(C('clone'), 'přemluví'), 'výstup', `<div style="font:650 54px var(--sans);margin-top:22px">hlas klonu</div><div class="pic" style="height:220px;margin-top:22px;background:#F3F5FA"><img src="../assets/wave/domca.png" style="width:100%;height:100%"></div>`, 'g');
  link({ a: { x: X(-1270), y: Y(-350) }, b: { x: X(-630), y: Y(-350) }, in: AT(C('clone'), 'Voice'), dur: .6, w: 8, bend: 0 });
  link({ a: { x: X(630), y: Y(-350) }, b: { x: X(1270), y: Y(-350) }, in: AT(C('clone'), 'přemluví'), dur: .6, w: 8, bend: 0 });

  // tři vlastnosti: dvě se zaškrtnou, třetí vždycky padne
  const props = [['intonaci', 'intonace'], ['barvu', 'barva hlasu'], ['plynulost', 'plynulost češtiny']];
  const tTwo = AT(C('vcfail'), 'Dvě'), tThird = AT(C('vcfail'), 'třetí');
  props.forEach(([w, txt], i) => {
    const t0 = AT(C('vcfail'), w);
    W.html({ x: X(-1700 + i * 1700), y: Y(800), z: 50, w: 1550, h: 260, in: t0, anim: 'pop',
      update: (n, t) => {
        // po „Dvě věci ti dá“ se střídá, která ze tří vypadne (deterministicky podle času)
        const k = t < tTwo ? -1 : Math.floor((t - tTwo) / .8) % 3, bad = k === i || (t >= tThird && i === 2 && k === -1);
        const st = k < 0 ? 'q' : bad ? 'x' : 'ok';
        if (n._st === st) return; n._st = st;
        const m = n.el.querySelector('.m'); m.textContent = st === 'q' ? '?' : st === 'x' ? '✕' : '✓';
        m.style.background = st === 'q' ? '#C6D0E4' : st === 'x' ? 'var(--red)' : 'var(--green)';
      },
      html: `<div class="card" style="height:100%;padding:30px 40px;display:flex;align-items:center;gap:30px"><span class="m" style="width:110px;height:110px;border-radius:50%;display:grid;place-items:center;color:#fff;font:700 64px var(--sans);flex:none">?</span>
        <span style="font:650 50px var(--sans);letter-spacing:-.03em">${txt}</span></div>` });
  });
  W.html({ x: X(0), y: Y(1500), z: 120, w: 3600, h: 220, in: T(C('vcno')) - .1, anim: 'pop',
    html: `<div style="text-align:center;font:750 120px var(--sans);letter-spacing:-.05em;color:var(--red);transform:rotate(-2deg)">v češtině zatím ne.</div>` });

  flyTo('k05', { x: X(0), y: Y(-1800), d: 2400 });
  cam({ t: T(C('clone')) - .3, dur: 1.4, x: X(0), y: Y(-450), d: 4300, ease: 'smooth', rx: 3, ry: 3, push: .05 });
  cam({ t: T(C('vcfail')) - .3, dur: 1.3, x: X(0), y: Y(800), d: 4500, ease: 'whip', rx: 4, ry: -4, push: .05 });
  cam({ t: tTwo - .3, dur: 1.1, x: X(0), y: Y(1100), d: 4400, ease: 'smooth', rx: 2, ry: 2, push: .05 });
})();
