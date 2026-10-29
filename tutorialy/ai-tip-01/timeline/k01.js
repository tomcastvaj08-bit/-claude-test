// K01 · Zadání: cíl (free Patreon ~60 členů → placený), dva skilly, první diktovaný prompt (zkráceně), konektory.
(() => {
  const { T, AT, cam, link } = ENGINE;
  const { A, CH, flyTo, logo } = L;
  const { pill, big } = U;
  const o = A.k01, X = v => o.x + v, Y = v => o.y + v, C = n => 'k01.' + n;

  W.card({ x: X(-1300), y: Y(-2500), w: 1900, in: CH('k01') + 1.0, kicker: 'Zadání', kc: 'b', title: 'Denní video <span class="gr">zdarma</span>', lead: 'AI TIP · každý den na <b>free Patreonu</b>' });

  // cíl: ~60 členů, fun facty, free → placený
  const g = C('goal');
  W.html({ x: X(-2350), y: Y(-1850), z: 60, w: 1000, h: 170, in: AT(g, 'denní'), anim: 'pop', html: pill('denní video', 'b', 56) });
  W.html({ x: X(-1250), y: Y(-1850), z: 60, w: 1000, h: 170, in: AT(g, 'free'), anim: 'pop', html: pill('free Patreon', 'g', 56) });
  W.html({ x: X(-2350), y: Y(-1400), z: 40, w: 1100, h: 520, in: AT(g, 'šedesát'), anim: 'pop', html: big('~60', 'členů · free Patreon', 280) });
  W.html({ x: X(-700), y: Y(-1600), z: 60, w: 1000, h: 170, in: AT(g, 'Fun'), anim: 'pop', html: pill('fun facty', 'b', 56) });
  W.html({ x: X(-700), y: Y(-1380), z: 60, w: 1300, h: 170, in: AT(g, 'nápady'), anim: 'pop', html: pill('nápady, co s AI udělat', '', 56) });
  W.html({ x: X(-1300), y: Y(-850), z: 50, w: 2400, h: 330, in: AT(g, 'převádět'), anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:40px 56px;display:flex;align-items:center;justify-content:space-between;gap:30px">
      <div style="font:700 70px var(--sans);letter-spacing:-.04em">free <span style="font:500 34px var(--mono);color:var(--muted)">AI TIP</span></div>
      <div style="flex:1;height:10px;border-radius:5px;background:var(--grad);position:relative"><div style="position:absolute;right:-16px;top:-15px;border-left:34px solid var(--green);border-top:20px solid transparent;border-bottom:20px solid transparent"></div></div>
      <div class="ptier" style="font:700 70px var(--sans);letter-spacing:-.04em;color:var(--green-ink);opacity:calc(.25 + var(--hl,0)*.75)">placený <span style="font:500 34px var(--mono);color:var(--muted)">celé tutoriály</span></div></div>`,
    fx: [{ t: AT(g, 'placenýho'), sel: '.ptier' }] });

  // dva skilly jako soubory
  const s = C('skills');
  const skill = (name, chips, ws) => `<div class="card" style="height:100%;padding:40px 48px">
    <div style="display:flex;align-items:center;gap:26px"><div style="width:110px;height:136px;border-radius:14px;background:var(--blue-soft);border:3px solid var(--blue);display:grid;place-items:center;font:700 30px var(--mono);color:var(--blue)">.skill</div>
    <div style="font:650 54px var(--sans);letter-spacing:-.03em">${name}</div></div>
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:34px">${chips.map((c, i) => `<span class="c${i}" style="font:500 34px var(--mono);padding:12px 24px;border-radius:999px;background:rgba(31,77,255,calc(.08 + var(--hl,0)*.9));color:rgba(10,13,20,calc(.35 + var(--hl,0)*.65))">${c}</span>`).join('')}</div></div>`;
  const ch1 = [['engine', 'engine'], ['brand', 'brand'], ['hlas', 'hlas Aura'], ['pohybu', 'pohyb'], ['přechody', 'přechody'], ['sound', 'sound design']];
  W.html({ x: X(1500), y: Y(-2350), z: 30, w: 1900, h: 560, in: T(s) - .1, anim: 'flip', html: skill('efektive-aktuality', ch1.map(c => c[1])),
    fx: ch1.map(([w], i) => ({ t: AT(s, w), sel: '.c' + i })) });
  const ch2 = [['fonty', 'fonty'], ['kamery', 'principy kamery']];
  W.html({ x: X(1500), y: Y(-1650), z: 30, w: 1900, h: 460, in: AT(s, 'tutoriály'), anim: 'flip', html: skill('efektive-3d-tutorial', ch2.map(c => c[1])),
    fx: ch2.map(([w], i) => ({ t: AT(s, w), sel: '.c' + i })) });

  // první prompt (diktovaný, zkráceně)
  const p = C('prompt');
  const bl = [['insane', 'insane motion grafika jako naučné TikToky'], ['prvních', 'prvních <em>5 sekund</em> úplně bomby'], ['flashů', 'hodně flashů, transitions, masek a zvukových efektů'],
    ['Efektive', 'Efektive nenutit → až <em>na konec</em>'], ['CTA', 'CTA spíš jen <em>do popisku</em>']];
  W.html({ x: X(1500), y: Y(-200), z: 40, w: 2200, h: 900, autoH: true, in: T(p), anim: 'tilt',
    fx: bl.map(([w], i) => ({ t: AT(p, w), sel: '.b' + i })),
    html: `<div class="quote" style="padding:48px 56px"><div class="who"><span class="av"></span>Teecee · první prompt (diktovaný, zkráceně)</div>
      <div style="margin-top:26px;display:flex;flex-direction:column;gap:18px">${bl.map(([, t], i) => `<div class="b${i}" style="font:550 46px/1.3 var(--sans);opacity:calc(.25 + var(--hl,0)*.75);display:flex;gap:20px"><span style="color:#8FB0FF;font-family:var(--mono)">0${i + 1}</span><span>${t}</span></div>`).join('')}</div></div>`.replace(/<em>/g, '<em style="font-style:normal;color:#8FB0FF">') });

  // konektory
  const m = C('mcp');
  [['ElevenLabs', 'elevenlabs', 'hlas · zvuky · přepis', -2550], ['Higgsfield', 'higgsfield', 'obrázky', -550]].forEach(([w, k, sub, x], i) =>
    W.html({ x: X(x), y: Y(350), z: 60, w: 1800, h: 330, in: AT(m, w), anim: 'pop',
      html: `<div class="card" style="height:100%;padding:40px 48px;display:flex;align-items:center;gap:34px">${logo(k, 120)}
        <div><div style="font:650 66px var(--sans);letter-spacing:-.04em">${w}</div><div style="font:500 34px var(--mono);color:var(--muted);margin-top:8px">konektor · ${sub}</div></div></div>` }));
  link({ a: { x: X(-2550), y: Y(530) }, b: { x: X(-1550), y: Y(930) }, in: AT(m, 'ElevenLabs') + .3, soft: true, z: -10 });
  link({ a: { x: X(-550), y: Y(530) }, b: { x: X(-1550), y: Y(930) }, in: AT(m, 'Higgsfield') + .3, soft: true, z: -10 });
  W.html({ x: X(-1550), y: Y(1000), z: 80, w: 1200, h: 170, in: AT(m, 'Higgsfield') + .5, anim: 'pop', html: pill(`${logo('claude', 56)} Claude Code`, 'b', 54) });

  flyTo('k01', { x: X(-1300), y: Y(-2350), d: 2500 });
  cam({ t: AT(g, 'denní') - .4, dur: 1.3, x: X(-1500), y: Y(-1550), d: 3100, ease: 'whip', rx: 3, ry: 5, push: .05 });
  cam({ t: AT(g, 'převádět') - .4, dur: 1.2, x: X(-1300), y: Y(-1000), d: 2900, ease: 'smooth', rx: 4, ry: -3, push: .04 });
  cam({ t: T(s) - .3, dur: 1.3, x: X(1500), y: Y(-2350), d: 2500, ease: 'whip', rx: 3, ry: -6, push: .05 });
  cam({ t: AT(s, 'tutoriály') - .4, dur: 1.1, x: X(1500), y: Y(-1850), d: 2700, ease: 'smooth', rx: 2, ry: 4, push: .04 });
  cam({ t: T(p) - .3, dur: 1.3, x: X(1500), y: Y(-150), d: 2700, ease: 'whip', rx: 3, ry: 5, push: .05 });
  cam({ t: AT(m, 'ElevenLabs') - .6, dur: 1.4, x: X(-1550), y: Y(600), d: 3400, ease: 'whip', rx: 5, ry: -4, push: .05 });
})();
