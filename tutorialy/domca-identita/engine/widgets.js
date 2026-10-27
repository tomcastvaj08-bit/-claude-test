// Stavební bloky plátna. Každý widget = jeden nebo víc uzlů v ENGINE.S.
(() => {
  const { node, link, S, ease, clamp, lerp } = ENGINE;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kick = (txt, c = '') => `<span class="kick ${c}"><span class="d"></span>${txt}</span>`;

  const W = { esc, kick };

  // hlavní karta kroku: mono štítek + velký titulek + perex
  W.card = o => node(Object.assign({ w: 1500, h: 560, anim: 'pop', autoH: true, dof: false,
    html: `<div class="card">
      ${o.kicker ? kick(o.kicker, o.kc || '') : ''}
      <div class="title" style="${o.size ? `font-size:${o.size}px` : ''}">${o.title}</div>
      ${o.lead ? `<div class="lead">${o.lead}</div>` : ''}${o.extra || ''}</div>` }, o));

  W.callout = o => node(Object.assign({ w: 820, h: 220, anim: 'rise', autoH: true, dof: false,
    html: `<div class="callout ${o.c || ''}"><div class="lab">${o.lab}</div><div class="txt">${o.txt}</div></div>` }, o));

  // citace zadání (tmavá karta, mluvím já)
  W.quote = o => node(Object.assign({ w: 1400, h: 400, anim: 'tilt', autoH: true, dof: false,
    html: `<div class="quote"><div class="who"><span class="av"></span>${o.who || (window.CFG && CFG.who) || 'zadání'}</div><div class="q">${o.q}</div></div>` }, o));

  W.chip = o => node(Object.assign({ w: 560, h: 80, anim: 'pop', dof: false,
    html: `<div style="display:flex;justify-content:center;align-items:center;height:100%"><div class="chip">${o.icon ? `<span class="ic"><img src="${o.icon}"></span>` : `<span class="ic" style="background:${o.dot || 'var(--blue-soft)'}"></span>`}${o.text}</div></div>` }, o));

  W.html = o => node(Object.assign({ anim: 'pop', dof: false }, o));

  W.img = o => node(Object.assign({ type: 'img', w: 640, h: 360, anim: 'deep', float: 14 }, o));
  // sekvence snímků (přehrávání videa): pattern s %04d, frames, fps, seqStart
  W.seq = o => node(Object.assign({ type: 'seq', w: 640, h: 360, anim: 'pop', fps: 24, dof: false }, o));

  // prompt: řádky lze postupně zvýraznit přes fx [{t, sel:'.l3'}]
  W.prompt = o => {
    const lines = o.text.split('\n').map((l, i) => `<span class="l l${i}">${esc(l) || ' '}</span>`).join('');
    return node(Object.assign({ w: 1500, h: 900, anim: 'rise', autoH: true, dof: false,
      html: `<div class="prompt" style="font-size:${o.fs || 25}px"><div class="ph"><span>${o.head || 'Prompt'}</span><span>${o.meta || ''}</span></div>${lines}</div>` }, o));
  };

  W.sphere = o => node(Object.assign({ w: 260, h: 260, anim: 'fade', dur: 1.5, float: 40,
    html: `<div class="sphere ${o.color || 'blue'}" style="width:100%;height:100%"></div>` }, o));

  // izometrický stoh vrstev (styl „Jedno video. Dva pohledy.“)
  W.layers = o => {
    const out = [];
    (o.layers || []).forEach((L, i) => out.push(node(Object.assign({ x: o.x, y: o.y + (L.dy || 0), z: (o.z || 0) + i * (o.gap || 160), w: o.w || 1400, h: o.h || 900,
      rx: o.rx ?? 52, rz: o.rz ?? -32, in: (o.in || 0) + i * (o.stagger ?? .18), anim: 'deep', dof: false,
      html: `<div class="layer ${L.cls || ''}" style="${L.style || ''}">${L.html || ''}</div>` }, L.node || {}))));
    return out;
  };

  // HUD: mono štítek kapitoly vlevo, číslo kroku vpravo, značka vlevo dole, podpis vpravo dole, progress bar kapitoly
  W.hud = (chapters, o = {}) => {
    const el = document.getElementById('hud');
    const brand = (o.brand || 'efektive.cz').replace(/(\.[a-z]+)$/, '<b>$1</b>');
    el.innerHTML = `<div class="hud-tl"><span class="mpill"><span class="d"></span><span id="hk"></span></span></div>
      <div class="hud-tr" id="hn"></div><div class="hud-bl">${brand}</div><div class="hud-br">${o.foot || ''}</div><div class="hud-prog" id="hp"></div>`;
    const steps = o.steps ?? Math.max(0, ...chapters.map(c => c.n ?? 0));
    const hk = el.querySelector('#hk'), hn = el.querySelector('#hn'), hp = el.querySelector('#hp'), tl = el.querySelector('.hud-tl');
    S.hud.push(t => {
      let cur = null, idx = -1;
      chapters.forEach((c, i) => { if (t >= c.t) { cur = c; idx = i; } });
      const total = chapters.filter(c => c.n != null).length;
      if (!cur || cur.hide) { el.style.opacity = 0; return; }
      el.style.opacity = 1;
      const p = clamp((t - cur.t) / .7);
      if (hk.textContent !== cur.label) hk.textContent = cur.label;
      tl.style.opacity = ease('out', p); tl.style.transform = `translateY(${(1 - ease('out', p)) * -14}px)`;
      hn.innerHTML = cur.n != null ? `krok <b>${String(cur.n).padStart(2, '0')}</b> / ${String(steps).padStart(2, '0')}` : '';
      const next = chapters[idx + 1];
      hp.style.transform = `scaleX(${next ? clamp((t - cur.t) / (next.t - cur.t)) : 1})`;
      void total;
    });
  };

  // deterministický náhodný generátor
  W.rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  window.W = W;
})();
