// Rozložení obřího plátna: uprostřed hub (k00 = úvod), kapitoly po spirále ven. Sdílené helpery pro všechny kapitoly.
// Načítá se jako první (build.py řadí timeline/k*.js abecedně a "k-" je před "k0").
(() => {
  const { S, T, AT, cam, link, node, clamp, ease, CUES } = ENGINE;
  const P = S.plan, CFG = window.CFG || {}, MEDIA = window.MEDIA || {};

  // ---------- média (tools/media.py -> assets/media.json) ----------
  // frame(name, t): snímek zdrojového videa v čase t (s); thumb(name, t): malý náhled (1 fps)
  const M = name => { const m = MEDIA[name]; if (!m) throw new Error('chybí médium ' + name + ' (tools/media.py)'); return m; };
  const frame = (name, t) => { const m = M(name); return `../assets/seq/${name}/f_${String(clamp(Math.floor(t * m.fps) + 1, 1, m.frames)).padStart(4, '0')}.jpg`; };
  const thumb = (name, t) => { const m = M(name); return `../assets/thumbs/${name}_${String(clamp(Math.floor(t) + 1, 1, m.thumbs)).padStart(3, '0')}.jpg`; };
  // přehrávač: sekvence snímků úseku a..b (s), seqStart = kdy začne hrát, speed = zpomalení/zrychlení
  const player = (name, o = {}) => {
    const m = M(name), a = o.a || 0, b = o.b ?? m.dur;
    return W.seq(Object.assign({ pattern: `../assets/seq/${name}/f_%04d.jpg`, first: Math.floor(a * m.fps) + 1,
      frames: Math.max(1, Math.min(m.frames - Math.floor(a * m.fps), Math.round((b - a) * m.fps))), fps: m.fps * (o.speed || 1), loop: o.loop ?? true,
      w: o.w || 1600, h: o.h || Math.round((o.w || 1600) * m.h / m.w) }, o));   // výška z předané šířky
  };
  const thumbs = Object.entries(MEDIA).flatMap(([name, m]) => Array.from({ length: m.thumbs }, (_, i) => `../assets/thumbs/${name}_${String(i + 1).padStart(3, '0')}.jpg`));

  // ---------- kotvy kapitol na eliptické spirále (16:9, ať se celá mapa vejde do přehledového záběru) ----------
  const A = { k00: { x: 0, y: 0 } };
  const ids = P.chapters.map(c => c.id).filter(id => id !== 'k00');
  const step = Math.max(.66, 5.5 / Math.max(1, ids.length));      // úhel mezi kapitolami (méně kapitol = víc rozprostřít)
  ids.forEach((id, i) => {
    const th = -Math.PI / 2 + .3 + i * step, r = 12000 + i * 2200;
    A[id] = { x: Math.round(Math.cos(th) * r), y: Math.round(Math.sin(th) * r * .75), i: i + 1,
      // štítek roadmapy leží radiálně venku od clusteru, ať čáry mapy neprotínají obsah kapitoly
      rx: Math.round(Math.cos(th) * (r + 9500)), ry: Math.round(Math.sin(th) * (r + 9500) * .75), th, side: Math.cos(th) >= 0 ? 1 : -1 };
  });

  const CH = id => T(id);                               // začátek kapitoly
  const CHEND = id => { const i = P.chapters.findIndex(c => c.id === id); return i + 1 < P.chapters.length ? P.chapters[i + 1].t : P.duration; };
  const INS = cue => P.inserts.find(i => i.cue === cue);
  const has = cue => cue in CUES;
  const short = title => title.replace(/^Krok [\d a]+: /, '');
  const stepOf = c => { const m = c.title.match(/^Krok (\d+)/); return m ? +m[1] : null; };

  // loga nástrojů: SVG ze Simple Icons (CC0) v bílé dlaždici, jinak monogram v barvě značky
  const LOGOS = Object.fromEntries(['claude', 'openai', 'github', 'canva', 'instagram', 'ffmpeg', 'elevenlabs', 'apple', 'appstore', 'android'].map(k => [k, k + '.svg']));
  const MONO = { claude: ['C', '#D97757'], higgsfield: ['H', '#0A0D14'], elevenlabs: ['11', '#0A0D14'], canva: ['C', '#7D2AE8'],
    openai: ['G', '#0A0D14'], googledrive: ['G', '#1FA463'], kling: ['K', '#0A0D14'], github: ['', '#0A0D14'], playwright: ['P', '#2EAD33'], ffmpeg: ['ff', '#5CB85C'], instagram: ['IG', '#E1306C'],
    ...(CFG.mono || {}) };
  const logo = (key, s = 48) => LOGOS[key]
    ? `<span style="width:${s}px;height:${s}px;border-radius:${s * .28}px;background:#fff;border:1px solid var(--line);display:inline-grid;place-items:center;flex:none"><img src="../assets/logos/${LOGOS[key]}" style="width:${s * .62}px;height:${s * .62}px;object-fit:contain"></span>`
    : `<span style="width:${s}px;height:${s}px;border-radius:${s * .28}px;background:${(MONO[key] || ['?', '#1F4DFF'])[1]};color:#fff;display:inline-grid;place-items:center;font:700 ${s * .42}px var(--sans);letter-spacing:-.04em;flex:none">${(MONO[key] || ['?'])[0]}</span>`;

  // ---------- HUD kapitol ----------
  // štítek: CFG.hud[id], jinak "Krok 03 · název" pro kapitoly "Krok 3: …", jinak název kapitoly
  const before = P.inserts.find(i => i.cue.startsWith('k00.') && i.t < 1);
  W.hud([{ t: 0, hide: true }].concat(P.chapters.map(c => ({
    t: c.id === 'k00' ? (before ? before.t + before.dur + .6 : 1.2) : c.t + 1.2,
    label: (CFG.hud || {})[c.id] || (stepOf(c) ? `Krok ${String(stepOf(c)).padStart(2, '0')} · ${short(c.title)}` : c.title),
    n: stepOf(c),
  }))), { brand: CFG.brand, foot: CFG.foot, steps: CFG.steps });

  // ---------- roadmapa: obří štítek (kolečko s číslem + název) pro každou kapitolu, po dokončení se vyplní ----------
  const mapIn = (has('k00.map') ? T('k00.map') : (ids.length ? T(ids[0]) - 6 : 0)) + 1.2;
  ids.forEach((id, i) => {
    const c = P.chapters.find(c => c.id === id), a = A[id];
    // kolečko sedí na kotvě, text míří ven od mapy (vpravo na pravé půlce, vlevo na levé)
    node({ id: 'ring-' + id, x: a.rx + a.side * 3250, y: a.ry, z: -10, w: 7600, h: 1300, in: mapIn + i * .08, anim: 'pop', dof: false,
      html: `<div style="display:flex;flex-direction:${a.side > 0 ? 'row' : 'row-reverse'};align-items:center;gap:100px;height:100%">
        <div class="rg" style="width:1100px;height:1100px;border-radius:50%;border:64px solid #C6D0E4;display:grid;place-items:center;font:600 470px var(--mono);letter-spacing:-.06em;color:var(--blue);background:#fff;flex:none;box-shadow:0 120px 240px rgba(10,13,20,.10)">${String(i + 1).padStart(2, '0')}</div>
        <div style="font-size:440px;font-weight:650;letter-spacing:-.05em;line-height:1;color:var(--ink);white-space:nowrap">${short(c.title)}</div></div>`,
      update: (n, t) => {
        const done = t >= CHEND(id) - 1.5, cur = t >= c.t && !done;
        const st = done ? 'done' : cur ? 'cur' : 'todo';
        if (n._st !== st) {
          n._st = st; const rg = n.el.querySelector('.rg');
          rg.style.background = done ? 'var(--blue)' : '#fff';
          rg.style.color = done ? '#fff' : 'var(--blue)';
          rg.style.borderColor = done ? 'var(--blue)' : cur ? 'var(--green)' : '#C6D0E4';
        }
      } });
    const prev = i ? A[ids[i - 1]] : null;
    if (!prev) return;                        // mapa začíná štítkem 01 (čára z hubu by protínala první kapitolu)
    const pa = { x: prev.rx, y: prev.ry };
    link({ a: pa, b: { x: a.rx, y: a.ry }, in: mapIn + i * .08, dur: .7, soft: true, dot: false, w: 40, bend: .1, z: -60, minPx: 2.4 });   // tečkovaná cesta
    link({ a: pa, b: { x: a.rx, y: a.ry }, in: c.t - .2, dur: 2.2, w: 60, bend: .1, z: -50, ease: 'whip', minPx: 4.5 });                // plná, když kapitola začne
  });

  // ---------- ambientní galerie za každou kapitolou: rozostřené náhledy a koule hluboko za plátnem ----------
  ids.forEach((id, ci) => {
    const a = A[id], c = P.chapters.find(c => c.id === id), r = W.rng(101 + ci * 7);
    if (thumbs.length) for (let k = 0; k < 18; k++) {
      const ang = r() * Math.PI * 2, rad = 2500 + r() * 5500;
      W.img({ x: a.x + Math.cos(ang) * rad * 1.3, y: a.y + Math.sin(ang) * rad * .8, z: -1600 - r() * 3800, w: 520, h: 293,
        src: thumbs[Math.floor(r() * thumbs.length)], in: c.t - 1.5 + r() * 2, anim: 'deep', rz: (r() - .5) * 12, float: 18 });
    }
    for (let k = 0; k < 4; k++) { const w = 260 + r() * 520; W.sphere({ x: a.x + (r() - .5) * 13000, y: a.y + (r() - .5) * 8000, z: -2500 - r() * 5000, w, h: w, color: r() > .5 ? 'green' : 'blue', in: c.t - 1 }); }
  });

  // přehled celé mapy (bounding box všech štítků)
  const xs = ids.map(id => A[id].rx).concat([0]), ys = ids.map(id => A[id].ry).concat([0]);
  const OV = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2,
    d: Math.max((Math.max(...xs) - Math.min(...xs) + 16000) / 1920, (Math.max(...ys) - Math.min(...ys) + 9000) / 1080) * 1600 };

  // přelet na kapitolu: whip s lehkou rotací (x, y = střed záběru)
  const flyTo = (id, o = {}) => cam(Object.assign({ t: CH(id) - .1, dur: 2.3, x: A[id].x, y: A[id].y, d: 2600, ease: 'whip', rx: 4, ry: -6, push: .05 }, o));

  window.L = { A, CH, CHEND, INS, has, frame, thumb, thumbs, player, flyTo, ids, OV, logo, short };
})();
