// K10 · Krok 8: Šest stanic ve 3D prostoru – kamera letí od jedné k druhé, každá stanice má malou živou ukázku navázanou na slova.
(() => {
  const { T, AT, cam, link, clamp, ease, lerp } = ENGINE;
  const { A, CH, flyTo } = L;
  const o = A.k10, X = v => o.x + v, Y = v => o.y + v, C = n => 'k10.' + n;

  W.card({ x: X(0), y: Y(-2750), w: 1900, in: CH('k10') + 1.0, kicker: 'Krok 08', kc: 'b', title: 'Šest <span class="gr">stanic</span>', lead: 'kostra druhé verze · kamera letí od jedné k druhé' });

  const POS = [[-2100, -1450], [0, -1450], [2100, -1450], [-2100, 150], [0, 150], [2100, 150]];
  const SW = 1900, SH = 1400;
  const station = (i, name, stage, extra = {}) => W.html(Object.assign({ x: X(POS[i][0]), y: Y(POS[i][1]), z: 30, w: SW, h: SH, in: T(C('st1')) + .1 + i * .18, anim: 'flip',
    html: `<div class="card" style="height:100%;padding:34px 40px;display:flex;flex-direction:column;gap:22px"><div style="display:flex;align-items:center;gap:20px">
      <span style="font:700 60px var(--mono);color:var(--blue)">0${i + 1}</span><span style="font:650 58px var(--sans);letter-spacing:-.04em">${name}</span></div>
      <div class="stg" style="flex:1;position:relative;border-radius:30px;overflow:hidden;background:var(--night)">${stage}</div></div>` }, extra));
  for (let i = 1; i < 6; i++) link({ a: { x: X(POS[i - 1][0]), y: Y(POS[i - 1][1]) }, b: { x: X(POS[i][0]), y: Y(POS[i][1]) }, in: T(C('st1')) + .3 + i * .18, soft: true, z: -30, bend: i === 3 ? .1 : .2 });

  // 1 · hook: 4 kruhové masky, písmena padají, bublina na 18 střepů
  const s1 = C('st1'), LET = 'PŘESTAŇ'.split(''), r = W.rng(3);
  const shards = Array.from({ length: 18 }, (_, k) => [r() * Math.PI * 2, 300 + r() * 500, (r() - .5) * 720]);
  station(0, 'hook', `${[0, 1, 2, 3].map(k => `<div class="ring r${k}" style="position:absolute;left:50%;top:50%;border:10px solid ${k % 2 ? '#13B97A' : '#5B82FF'};border-radius:50%"></div>`).join('')}
    <div style="position:absolute;left:0;right:0;top:330px;display:flex;justify-content:center;gap:8px">${LET.map((c, k) => `<span class="lt lt${k}" style="font:800 170px/1 var(--sans);color:#fff;display:inline-block">${c}</span>`).join('')}</div>
    <div class="bub" style="position:absolute;left:50%;top:150px;width:360px;height:150px;margin-left:-180px;border-radius:75px;background:#fff;color:#0A0D14;display:grid;place-items:center;font:600 48px var(--sans)">?</div>
    ${shards.map((_, k) => `<i class="sh sh${k}" style="position:absolute;left:50%;top:225px;width:60px;height:40px;background:#fff;clip-path:polygon(0 0,100% 30%,40% 100%);opacity:0"></i>`).join('')}`,
    { update: (n, t) => {
      const tm = AT(s1, 'masky');
      n.el.querySelectorAll('.ring').forEach((e, k) => { const p = clamp((t - tm - k * .25) / 1.2), s = 1400 * ease('out', p); e.style.width = e.style.height = s + 'px'; e.style.margin = `${-s / 2}px 0 0 ${-s / 2}px`; e.style.opacity = p > 0 ? 1 - p * .7 : 0; });
      const tp = AT(s1, 'písmena');
      LET.forEach((_, k) => { const p = clamp((t - tp - k * .14) / .5), e = n.el.querySelector('.lt' + k); e.style.transform = `translateY(${(1 - ease('backOut', p)) * -700}px)`; e.style.opacity = p > 0 ? 1 : 0; });
      const tb = AT(s1, 'roztříští'), pb = clamp((t - tb) / 1.1);
      n.el.querySelector('.bub').style.opacity = t < tb ? 1 : 0;
      shards.forEach(([a, d, rot], k) => { const e = n.el.querySelector('.sh' + k); e.style.opacity = t < tb ? 0 : 1 - pb * .6; e.style.transform = `translate(${Math.cos(a) * d * ease('out', pb)}px,${Math.sin(a) * d * ease('out', pb)}px) rotate(${rot * pb}deg) scale(${1 + pb * 1.6})`; });
    } });

  // 2 · žetony TY a AI, otazník přeskočí
  const s2 = C('st2');
  station(1, 'ty a AI', ['TY', 'AI'].map((t, k) => `<div class="tk tk${k}" style="position:absolute;top:470px;left:${k ? 1150 : 320}px;width:320px;height:320px;border-radius:50%;background:${k ? 'var(--grad)' : '#fff'};color:${k ? '#fff' : '#0A0D14'};display:grid;place-items:center;font:800 120px var(--sans)">${t}</div>`).join('') +
    `<div class="q" style="position:absolute;top:0;left:0;font:800 160px var(--sans);color:#F6C34A">?</div>`,
    { update: (n, t) => {
      const tz = AT(s2, 'žetony');
      [0, 1].forEach(k => { const p = clamp((t - tz - k * .2) / .6), e = n.el.querySelector('.tk' + k); e.style.transform = `translateY(${(1 - ease('backOut', p)) * 500}px)`; e.style.opacity = p > 0 ? 1 : 0; });
      const p = ease('smooth', clamp((t - AT(s2, 'otazník') - .3) / 1.0)), x = lerp(430, 1260, p), y = 260 - Math.sin(p * Math.PI) * 220;
      const q = n.el.querySelector('.q'); q.style.transform = `translate(${x}px,${y}px) rotate(${p * 360}deg)`; q.style.opacity = t > AT(s2, 'otazník') ? 1 : 0;
    } });

  // 3 · panel s promptem, 10 → spirála deseti karet
  const s3 = C('st3'), PR = 'zeptej se mě na 10 otázek…';
  station(2, 'prompt a 10 otázek', `<div style="position:absolute;left:90px;right:90px;top:70px;height:190px;border-radius:26px;background:#fff;padding:40px 44px;font:500 54px var(--mono);color:#0A0D14"><span class="ty"></span><span class="cur" style="color:var(--blue)">▍</span></div>
    <div class="ten" style="position:absolute;left:0;right:0;top:300px;text-align:center;font:800 330px/1 var(--sans);background:var(--grad);-webkit-background-clip:text;color:transparent;opacity:0">10</div>
    ${Array.from({ length: 10 }, (_, k) => `<div class="cd cd${k}" style="position:absolute;left:50%;top:640px;width:220px;height:110px;margin-left:-110px;border-radius:18px;background:#fff;display:grid;place-items:center;font:600 34px var(--mono);color:#1F4DFF;opacity:0">otázka ${k + 1}</div>`).join('')}`,
    { update: (n, t) => {
      const tn = AT(s3, 'napiš'), k = Math.floor(clamp((t - tn) / 2.4) * PR.length);
      n.el.querySelector('.ty').textContent = PR.slice(0, k);
      const t10 = AT(s3, 'Desítka'), p10 = clamp((t - t10) / .6), ten = n.el.querySelector('.ten');
      ten.style.opacity = p10; ten.style.transform = `scale(${.4 + .6 * ease('backOut', p10)}) translateZ(0)`;
      const tsp = AT(s3, 'spirála');
      for (let j = 0; j < 10; j++) { const p = ease('out', clamp((t - tsp - j * .07) / 1.0)), a = j / 10 * Math.PI * 2 + p * 1.5, rr = 120 + p * (260 + j * 22), e = n.el.querySelector('.cd' + j);
        e.style.opacity = t > tsp ? 1 : 0; e.style.transform = `translate(${Math.cos(a) * rr * 1.5}px,${Math.sin(a) * rr * .55 - 120 * p}px) rotate(${(a * 57) % 30 - 15}deg)`; }
      if (t > tsp) ten.style.opacity = Math.max(0, 1 - (t - tsp) * 1.5);
    } });

  // 4 · ulička 80 šedých karet, jedna vyjede s cenovkou „průměr“
  const s4 = C('st4');
  station(3, 'regál · 80 karet', `<div class="grid" style="position:absolute;inset:40px;display:grid;grid-template-columns:repeat(10,1fr);gap:16px">${Array.from({ length: 80 }, (_, k) => `<i class="gc${k}" style="border-radius:10px;background:#8A93A6;opacity:.9"></i>`).join('')}</div>
    <div class="pick" style="position:absolute;left:50%;top:50%;width:380px;height:260px;margin:-130px 0 0 -190px;border-radius:24px;background:#B4BCCB;display:grid;place-items:center;opacity:0">
      <span style="font:700 52px var(--mono);background:#F6C34A;color:#0A0D14;padding:12px 26px;border-radius:12px;transform:rotate(-6deg)">průměr</span></div>`,
    { update: (n, t) => {
      const tu = AT(s4, 'uličkou');
      const g = n.el.querySelector('.grid'); g.style.transform = `perspective(900px) rotateX(${lerp(0, 34, ease('smooth', clamp((t - tu) / 2)))}deg) scale(${1 + .25 * ease('smooth', clamp((t - tu) / 3))})`;
      g.style.filter = `grayscale(1) brightness(${lerp(1, .7, clamp((t - AT(s4, 'zešedne')) / 1))})`;
      const p = ease('backOut', clamp((t - AT(s4, 'vyjede')) / .8)), pk = n.el.querySelector('.pick'); pk.style.opacity = p > 0 ? 1 : 0; pk.style.transform = `translateZ(0) scale(${.5 + .7 * p})`;
    } });

  // 5 · drop: flash, metr, steh, přebarvení na „tvoje odpověď“
  const s5 = C('st5');
  station(4, 'drop', `<div class="crd" style="position:absolute;left:50%;top:50%;width:640px;height:400px;margin:-200px 0 0 -320px;border-radius:30px;background:#B4BCCB;display:grid;place-items:center;font:700 70px var(--sans);color:#fff">průměr</div>
    <div class="tape" style="position:absolute;left:0;top:50%;height:70px;margin-top:-35px;background:repeating-linear-gradient(90deg,#F6C34A 0 30px,#E0A800 30px 34px);transform-origin:0 50%;transform:rotate(-14deg) scaleX(0);width:100%"></div>
    <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 1820 1100"><path class="st" d="M560 760 L1260 760" stroke="#fff" stroke-width="10" stroke-dasharray="40 26" fill="none"/></svg>
    <div class="fl" style="position:absolute;inset:0;background:#fff;opacity:0"></div>`,
    { update: (n, t) => {
      const tf = AT(s5, 'Flash'); n.el.querySelector('.fl').style.opacity = t < tf ? 0 : Math.max(0, 1 - (t - tf) * 2.2);
      n.el.querySelector('.tape').style.transform = `rotate(-14deg) scaleX(${ease('out', clamp((t - AT(s5, 'metr')) / .9))})`;
      const ps = clamp((t - AT(s5, 'steh')) / .8), st = n.el.querySelector('.st'); st.style.clipPath = `inset(0 ${(1 - ps) * 100}% 0 0)`; st.style.opacity = ps > 0 ? 1 : 0;
      const pc = clamp((t - AT(s5, 'přebarví')) / .5), cr = n.el.querySelector('.crd');
      cr.style.background = pc > .5 ? 'linear-gradient(120deg,#1F4DFF,#13B97A)' : '#B4BCCB'; cr.textContent = pc > .5 ? 'tvoje odpověď' : 'průměr'; cr.style.transform = `scale(${1 + Math.sin(pc * Math.PI) * .12})`;
    } });

  // 6 · outro: 3D logo efektive dopadne s odskokem
  const s6 = C('st6');
  station(5, 'outro', `<div class="lg" style="position:absolute;left:0;right:0;top:330px;text-align:center;font:800 190px/1 var(--sans);letter-spacing:-.05em;color:#fff;text-shadow:0 8px 0 #1F4DFF,0 16px 0 #13328F,0 24px 40px rgba(0,0,0,.5)">efektive</div>
    <div class="shd" style="position:absolute;left:50%;top:640px;width:700px;height:60px;margin-left:-350px;border-radius:50%;background:radial-gradient(closest-side,rgba(91,130,255,.6),transparent)"></div>`,
    { update: (n, t) => {
      const tl = AT(s6, 'logo'), p = clamp((t - tl) / 1.1), y = t < tl ? -900 : -900 * (1 - ease('elastic', p));
      n.el.querySelector('.lg').style.transform = `translateY(${y}px)`; n.el.querySelector('.shd').style.opacity = t < tl ? 0 : .3 + .7 * p;
    } });

  flyTo('k10', { x: X(0), y: Y(-2600), d: 2500 });
  cam({ t: T(C('st1')) - .3, dur: 1.6, x: X(0), y: Y(-650), d: 6300, ease: 'smooth', rx: 6, ry: -3, push: .03 });
  POS.forEach(([x, y], i) => cam({ t: (i ? T(C('st' + (i + 1))) : AT(C('st1'), 'hook')) - .3, dur: i ? 1.3 : 1.5, x: X(x), y: Y(y + 20), d: 2600, ease: 'whip', rx: 3 + (i % 3), ry: i % 2 ? 6 : -6, push: .05 }));
})();
