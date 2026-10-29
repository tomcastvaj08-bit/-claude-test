// Pomocné HTML stavebnice pro AI TIP #01 (načte se před k-layout.js; volá se až z kapitol).
(() => {
  const IMG = i => `../assets/img/p${i}.png`;
  // mono pilulka uprostřed uzlu
  const pill = (t, c = '', fs = 36) => `<div style="display:flex;justify-content:center;align-items:center;height:100%"><span class="mpill ${c}" style="font-size:${fs}px;padding:${Math.round(fs * .36)}px ${Math.round(fs * .72)}px;gap:${Math.round(fs * .4)}px;white-space:nowrap"><span class="d"></span>${t}</span></div>`;
  // velké číslo (gradient nebo barva) + mono popisek
  const big = (n, lab, fs = 260, col = '') => `<div style="text-align:center;padding:0 30px"><div class="bignum" style="font-size:${fs}px;line-height:1.05;padding:0 .08em;${col ? `color:${col}` : 'background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent'}">${n}</div>${lab ? `<div style="font:600 ${Math.round(fs * .17)}px var(--mono);color:var(--muted);margin-top:6px">${lab}</div>` : ''}</div>`;
  // tmavý terminál, řádky .t0, .t1 … naskakují přes fx (--hl)
  const term = (head, lines, fs = 34) => `<div class="quote" style="height:100%;padding:36px 46px">
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:22px"><i style="width:16px;height:16px;border-radius:50%;background:#F26B5B"></i><i style="width:16px;height:16px;border-radius:50%;background:#F6C34A"></i><i style="width:16px;height:16px;border-radius:50%;background:#4CC46B"></i><span style="font:500 24px var(--mono);color:#7F8AA3;margin-left:14px">${head}</span></div>
    ${lines.map((l, i) => `<div class="t${i}" style="font:500 ${fs}px/1.55 var(--mono);opacity:calc(.22 + var(--hl,0)*.78);transform:translateX(calc((1 - var(--hl,0)) * -20px));white-space:pre">${l}</div>`).join('')}</div>`;
  // barevný štítek ✕ / ✓
  const bad = t => `<span style="color:var(--red)">✕</span> ${t}`, ok = t => `<span style="color:var(--green)">✓</span> ${t}`;
  // dlaždice: velká ikona/symbol + název + popisek
  const tile = (sym, name, sub = '', c = 'var(--blue)') => `<div class="card" style="height:100%;padding:34px 30px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px">
    <div style="font:800 96px/1 var(--sans);color:${c};letter-spacing:-.04em">${sym}</div><div style="font:650 46px var(--sans);letter-spacing:-.03em">${name}</div>${sub ? `<div style="font:500 26px var(--mono);color:var(--muted)">${sub}</div>` : ''}</div>`;
  // vytažený 3D text: vrstvy za sebou (boky tmavší, čelo gradient) – stejný princip jako v enginu v2
  const extrude = o => {
    const n = o.layers || 16, step = o.step || 7, out = [];
    for (let i = 0; i < n; i++) {
      const front = i === n - 1, k = i / (n - 1);
      const col = front ? 'background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent' : `color:rgb(${Math.round(10 + 20 * k)},${Math.round(20 + 50 * k)},${Math.round(80 + 120 * k)})`;
      out.push(W.html({ x: o.x, y: o.y, z: (o.z || 0) + i * step, w: o.w, h: o.h, in: o.in, dur: o.dur || 1.1, anim: o.anim || 'pop', lodBoost: 2, rx: o.rx || 0, ry: o.ry || 0, out: o.out,
        html: `<div style="height:100%;display:flex;align-items:center;justify-content:center"><div style="font:800 ${o.fs}px/1 var(--sans);letter-spacing:-.05em;white-space:nowrap;padding:0 .06em;${col}">${o.text}</div></div>` }));
    }
    return out;
  };
  window.U = { IMG, pill, big, term, bad, ok, tile, extrude };
})();
