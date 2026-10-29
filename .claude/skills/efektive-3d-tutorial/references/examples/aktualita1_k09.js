// K09 · Krok 7 a 8: střih hooku (segmenty, 1,3×, vadný záběr, pořadí, on twos), sound design 7 vrstev, schvalování po částech, dostřih.
(() => {
  const { T, AT, cam, link, node, clamp, ease, lerp } = ENGINE;
  const { A, CH, reel, flyTo } = L;
  const o = A.k09, X = v => o.x + v, Y = v => o.y + v;
  const C = n => 'k09.' + n;

  W.card({ x: X(-2200), y: Y(-2650), w: 1900, in: CH('k09') + 1.0, kicker: 'Krok 07 + 08', title: 'Střih hooku <span class="gr">bez generování</span>' });

  // střihová osa: normální záběry se smrsknou na 1/1,3, slow motion zůstane
  const segs = [['široký', 1.2, 0], ['kytka', .7, 0], ['bota', .4, 0], ['pád', .5, 1], ['hrnek', .5, 1], ['obličej', .5, 1], ['kapka', .8, 1], ['kalendář', 1.4, 0]];
  const tSpeed = AT(C('cut7'), 'zrychlil'), PXS = 470;
  W.html({ id: 'nle', x: X(950), y: Y(-2500), z: 30, w: 3500, h: 640, in: T(C('cut7')), anim: 'tilt',
    html: `<div class="card" style="height:100%;padding:40px 48px"><div style="display:flex;justify-content:space-between"><span class="kick b"><span class="d"></span>klip 6 s → segmenty</span><span class="lg" style="font:500 28px var(--mono);color:var(--muted)">normální záběry 1,3× · slow motion beze změny</span></div>
      <div class="row" style="position:relative;height:200px;margin-top:70px">${segs.map(([n, d, slow], i) => `<div class="sg sg${i}" style="position:absolute;top:0;height:200px;border-radius:18px;background:${slow ? 'var(--green)' : 'var(--blue)'};
        color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;font:600 30px var(--sans);overflow:hidden;white-space:nowrap"><span>${n}</span><span class="sp" style="font:500 22px var(--mono);opacity:.85">${slow ? 'slow-mo' : '1,0×'}</span></div>`).join('')}</div></div>`,
    update: (n, t) => {
      const p = ease('smooth', clamp((t - tSpeed) / 1.2));
      let x = 0;
      segs.forEach(([, d, slow], i) => {
        const w = d * PXS * (slow ? 1 : lerp(1, 1 / 1.3, p)), el = n.el.querySelector('.sg' + i);
        el.style.left = x + 'px'; el.style.width = (w - 8) + 'px'; x += w;
        if (!slow) el.querySelector('.sp').textContent = p > .5 ? '1,3×' : '1,0×';
      });
    } });

  // vadný záběr + komiksový nápis pryč, zbytek na 1080p
  W.html({ x: X(950), y: Y(-1450), z: 60, w: 2400, h: 420, in: T(C('bad')), anim: 'rise',
    fx: [{ t: AT(C('bad'), 'šplích'), sel: '.sp2' }, { t: AT(C('bad'), 'zvětšil'), sel: '.up' }],
    html: `<div class="card" style="height:100%;padding:36px 44px;display:flex;gap:30px;align-items:center">
      <div style="flex:1.2"><span class="kick r"><span class="d"></span>vyhozeno</span><div style="font:600 38px/1.3 var(--sans);margin-top:16px">záběr se skvrnou na kalendáři <b style="color:var(--red)">dřív, než kafe dopadlo</b></div></div>
      <div class="sp2" style="flex:.8;opacity:calc(.2 + var(--hl,0)*.8);position:relative;text-align:center"><div style="font:800 italic 90px var(--sans);color:#7A4A2A;text-shadow:4px 4px 0 #0A0D14">ŠPLÍCH</div>
        <div style="position:absolute;left:0;right:0;top:50%;height:10px;background:var(--red);transform:rotate(-8deg) scaleX(var(--hl,0))"></div></div>
      <div class="up" style="flex:.8;opacity:calc(.2 + var(--hl,0)*.8)"><span class="mpill b" style="font-size:34px;padding:12px 24px"><span class="d"></span>→ 1920 × 1080</span></div></div>` });

  // finální pořadí záběrů
  const ord = [['širokej', 'široký příchod', .4], ['nízkej', 'nízký přes kytku', 1.3], ['detail', 'bota + zakopnutí', 1.75], ['hrnek', 'slow-mo hrnek', 2.3], ['obličej', 'slow-mo obličej', 2.9], ['kapka', 'kapka přes rameno', 3.5], ['kalendář', 'kalendář + cákanec', 4.9]];
  ord.forEach(([w, lab, tt], i) => W.img({ x: X(-2700 + i * 900), y: Y(-250), z: 40, w: 840, h: 473, src: reel(tt), cap: `${i + 1} · ${lab}`, in: AT(C('order'), w, w === 'detail' ? 1 : 1), anim: 'pop', dof: false, float: 6 }));

  // on twos po každém střihu znovu
  const cellsOk = ['A', 'A', 'B', 'B', 'C', 'C', '|', 'D', 'D', 'E', 'E'], cellsBad = ['A', 'A', 'B', 'B', 'C', '|', 'C', 'D', 'D', 'E', 'E'];
  const cells = (arr, col) => arr.map(c => c === '|' ? `<div style="width:8px;height:110px;background:var(--red);border-radius:4px;margin:0 8px"></div>` : `<div style="width:96px;height:110px;border-radius:14px;background:${col};color:#fff;display:grid;place-items:center;font:600 40px var(--mono)">${c}</div>`).join('');
  W.html({ x: X(-1550), y: Y(1000), z: 30, w: 2500, h: 620, in: T(C('twos')), anim: 'tilt',
    fx: [{ t: AT(C('twos'), 'znova'), sel: '.ok' }],
    html: `<div class="card" style="height:100%;padding:40px 46px"><span class="kick b"><span class="d"></span>on twos · každá kresba 2 snímky</span>
      <div style="display:flex;gap:8px;margin-top:34px;align-items:center;opacity:.55">${cells(cellsBad, '#9AA6BC')}<span style="font:500 28px var(--mono);color:var(--red);margin-left:20px">kresba přes střih</span></div>
      <div class="ok" style="display:flex;gap:8px;margin-top:24px;align-items:center;opacity:calc(.3 + var(--hl,0)*.7)">${cells(cellsOk, 'var(--blue)')}<span style="font:500 28px var(--mono);color:var(--green-ink);margin-left:20px">po střihu znovu</span></div></div>` });

  // sound design hooku: skutečný zvuk reelu 0–6 s + 7 vrstev
  const lay = [['l1', 'pískání + kroky', 0, 1.9, '#5B82FF'], ['l2', 'švihy na střihy', 0, 6, '#1F4DFF'], ['l3', 'zadrhnutí + úder', 1.5, 2.0, '#0A0D14'],
    ['l4', 'hudba ve 3 částech · low-pass ve slow-mo', 0, 6, '#13B97A'], ['l5', 'slow-mo atmosféra + lití kafe', 1.96, 3.9, '#7C3AED'], ['l6', 'švih vzduchu', 3.2, 3.9, '#F07A1A'], ['l7', 'dopad: riser · šplouchnutí · úder · sub · impact', 3.6, 5.2, '#D42A1E']];
  const cuts = [1.17, 1.5, 1.96, 2.63, 3.25, 3.875], DW = 2900, sx = s => s / 6 * DW;
  W.html({ id: 'daw7', x: X(800), y: Y(2650), z: 30, w: 4300, h: 1100, autoH: true, in: T(C('sd7')), anim: 'tilt',
    fx: lay.map(([cue], i) => ({ t: T(C(cue)), sel: '.ly' + i })),
    html: `<div class="card" style="padding:40px 48px"><div style="display:flex;justify-content:space-between"><span class="kick g"><span class="d"></span>sound design hooku · každá vrstva má přesný čas</span><span style="font:500 26px var(--mono);color:var(--muted)">nahoře skutečný zvuk hooku</span></div>
      <div style="display:flex;margin-top:26px"><div style="width:1050px"></div><div style="position:relative;width:${DW}px;height:150px;border-radius:14px;background:#F3F5FA;overflow:hidden">
        <img src="../assets/wave/hook.png" style="width:100%;height:100%;opacity:.9">
        <div style="position:absolute;left:${sx(1.96)}px;width:${sx(3.875) - sx(1.96)}px;top:0;bottom:0;background:rgba(19,185,122,.12);border-left:3px dashed var(--green);border-right:3px dashed var(--green)"></div>
        ${cuts.map(c => `<div style="position:absolute;left:${sx(c)}px;top:0;bottom:0;width:3px;background:rgba(10,13,20,.35)"></div>`).join('')}</div></div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">${lay.map(([, n, a, b, col], i) => `<div class="ly${i}" style="display:flex;align-items:center;opacity:calc(.15 + var(--hl,0)*.85)">
        <div style="width:1050px;font:600 30px var(--sans);color:${col};padding-right:20px">${n}</div>
        <div style="position:relative;width:${DW}px;height:70px">${i === 1 ? cuts.map(c => `<div style="position:absolute;left:${sx(c) - 50}px;width:100px;top:8px;height:54px;border-radius:12px;background:${col}"></div>`).join('')
          : `<div style="position:absolute;left:${sx(a)}px;width:${sx(b) - sx(a)}px;top:8px;height:54px;border-radius:12px;background:${col}"></div>`}</div></div>`).join('')}</div></div>` });
  // low-pass: pustí jen hloubky
  const tLP = AT(C('l4'), 'low');
  W.html({ x: X(-2600), y: Y(4000), z: 80, w: 1500, h: 560, in: tLP - .2, anim: 'pop',
    html: `<div class="card" style="height:100%;padding:34px 40px"><span class="kick g"><span class="d"></span>low-pass filtr</span>
      <svg viewBox="0 0 600 220" style="width:100%;height:280px;margin-top:20px"><path class="lp" fill="rgba(19,185,122,.2)" stroke="#13B97A" stroke-width="5"/>
        <text x="10" y="215" font-family="GeistMono" font-size="20" fill="#687182">hloubky</text><text x="500" y="215" font-family="GeistMono" font-size="20" fill="#687182">výšky</text></svg>
      <div style="font:500 30px var(--sans);color:var(--ink2)">zní to jako pod vodou → <b>působí zpomaleně</b></div></div>`,
    update: (n, t) => {
      const cut = lerp(560, 180, ease('smooth', clamp((t - tLP) / 1.5)));
      let d = 'M0 190 L0 60';
      for (let x = 0; x <= 600; x += 10) d += ` L${x} ${60 + Math.max(0, (x - cut)) * .55}`;
      n.el.querySelector('.lp').setAttribute('d', d + ' L600 190 Z');
    } });

  // schvalovat po částech
  W.html({ x: X(2700), y: Y(1000), z: 30, w: 2100, h: 620, in: T(C('approve7')), anim: 'tilt',
    update: (n, t) => { const p = ease('out', clamp((t - T(C('approve7'))) / 1.5)); n.el.querySelector('.f1').style.width = p * 100 + '%'; n.el.querySelector('.f2').style.width = p * 20 / 65 * 100 + '%'; },
    html: `<div class="card" style="height:100%;padding:40px 46px"><span class="kick o"><span class="d"></span>render · schvaluj po částech</span>
      ${[['celé video', 'přes hodinu', 'f1', 'var(--red)'], ['jen hook', '~20 min', 'f2', 'var(--green)']].map(([a, b, c, col]) => `<div style="margin-top:34px"><div style="display:flex;justify-content:space-between;font:600 34px var(--sans)"><span>${a}</span><span style="font-family:var(--mono);color:${col}">${b}</span></div>
        <div style="height:40px;border-radius:20px;background:#EEF2FA;margin-top:12px;overflow:hidden"><div class="${c}" style="height:100%;border-radius:20px;background:${col}"></div></div></div>`).join('')}</div>` });

  // ---------- krok 8: dostřih ----------
  W.quote({ x: X(-1900), y: Y(5300), z: 40, w: 2100, in: T(C('q8')), q: '„Vystřihni <em>Ne, na sedmičku ne</em>, nech tam jen tu otázku <em>Sedmýho… října?</em> Zkrať úsek s kalendářem, ať tam není cut v audiu.“' });
  W.quote({ x: X(-1900), y: Y(6250), z: 60, w: 1500, in: T(C('q8b')), q: '„Ještě o <em>půl sekundy</em> zkrátit.“' });
  // crossfade 80 ms na skutečné vlně
  const tX = AT(C('fix8'), 'osmdesát');
  W.html({ x: X(1500), y: Y(5300), z: 30, w: 2700, h: 760, in: T(C('fix8')), anim: 'tilt',
    fx: [{ t: tX, sel: '.xf' }, { t: T(C('swish8')), sel: '.sw' }],
    html: `<div class="card" style="height:100%;padding:40px 46px"><span class="kick b"><span class="d"></span>střih v hotovém videu · obraz i zvuk</span>
      <div style="position:relative;height:260px;margin-top:40px;border-radius:16px;overflow:hidden;background:#F3F5FA"><img src="../assets/wave/line.png" style="width:100%;height:100%">
        <div style="position:absolute;left:38%;width:16%;top:0;bottom:0;background:repeating-linear-gradient(-45deg,rgba(212,42,30,.35) 0 14px,rgba(212,42,30,.12) 14px 28px);border-left:4px solid var(--red);border-right:4px solid var(--red)"></div></div>
      <div class="xf" style="display:flex;align-items:center;gap:26px;margin-top:30px;opacity:calc(.2 + var(--hl,0)*.8)">
        <svg viewBox="0 0 200 80" style="width:200px;height:80px"><path d="M0 10 L200 70" stroke="#1F4DFF" stroke-width="6"/><path d="M0 70 L200 10" stroke="#13B97A" stroke-width="6"/></svg>
        <div style="font:600 40px var(--sans)">prolnutí zvuku <span style="font-family:var(--mono);color:var(--blue)">80 ms</span></div></div>
      <div class="sw" style="font:500 32px var(--sans);color:var(--ink2);margin-top:18px;opacity:var(--hl,0)">+ tichý švih a sub na střih → skok působí <b>záměrně</b></div></div>` });
  // zrychlení bez změny výšky hlasu
  W.html({ x: X(1500), y: Y(6450), z: 60, w: 2700, h: 560, in: T(C('half')), anim: 'rise',
    fx: [{ t: AT(C('half'), 'pištět'), sel: '.bd' }, { t: AT(C('half'), 'výška'), sel: '.gd' }],
    html: `<div class="card" style="height:100%;padding:40px 46px;display:flex;flex-direction:column;gap:26px;justify-content:center">
      <div class="bd" style="display:flex;justify-content:space-between;align-items:center;opacity:calc(.25 + var(--hl,0)*.75)"><span style="font:600 40px var(--sans)">obyčejné zrychlení</span><span style="font:600 34px var(--mono);color:var(--red)">tempo ↑ · výška ↑ · piští</span></div>
      <div class="gd" style="display:flex;justify-content:space-between;align-items:center;opacity:calc(.25 + var(--hl,0)*.75)"><span style="font:600 40px var(--sans)">zrychlení bez změny výšky</span><span style="font:600 34px var(--mono);color:var(--green-ink)">tempo ↑ · výška = · OK</span></div>
      <div style="font:500 30px var(--sans);color:var(--ink2)">kratší držení kalendáře + replika zrychlená</div></div>` });

  // ---------- kamera ----------
  flyTo('k09', { x: X(-2200), y: Y(-2500), d: 2300 });
  cam({ t: T(C('cut7')) - .3, dur: 1.4, x: X(950), y: Y(-2450), d: 3700, ease: 'whip', rx: 3, ry: -4, push: .05 });
  cam({ t: T(C('bad')) - .3, dur: 1.2, x: X(950), y: Y(-1600), d: 2900, ease: 'smooth', rx: -2, ry: -3 });
  cam({ t: T(C('order')) - .3, dur: 1.5, x: X(0), y: Y(-250), d: 5600, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  cam({ t: T(C('twos')) - .3, dur: 1.3, x: X(-1550), y: Y(1000), d: 2700, ease: 'whip', rx: 2, ry: 5, push: .05 });
  cam({ t: T(C('sd7')) - .3, dur: 1.6, x: X(800), y: Y(2650), d: 4800, ease: 'smooth', rx: 5, ry: 0, push: .04 });
  cam({ t: tLP - .3, dur: 1.2, x: X(-1500), y: Y(3500), d: 3600, ease: 'smooth', rx: 3, ry: 4 });
  cam({ t: T(C('l5')) - .3, dur: 1.3, x: X(800), y: Y(2800), d: 4700, ease: 'smooth', rx: 4, ry: 0, push: .04 });
  cam({ t: T(C('approve7')) - .3, dur: 1.4, x: X(2700), y: Y(1000), d: 2600, ease: 'whip', rx: 3, ry: -5, push: .05 });
  cam({ t: T(C('s8')) - .3, dur: 1.8, x: X(-400), y: Y(5700), d: 5200, ease: 'whip', rx: 3, ry: 5, push: .05 });
  cam({ t: T(C('q8b')) - .3, dur: 1.0, x: X(-1900), y: Y(5800), d: 3000, ease: 'smooth', rx: 2, ry: 4 });
  cam({ t: T(C('fix8')) - .3, dur: 1.4, x: X(1500), y: Y(5300), d: 3100, ease: 'whip', rx: 2, ry: -4, push: .05 });
  cam({ t: T(C('half')) - .3, dur: 1.2, x: X(1500), y: Y(6400), d: 2900, ease: 'smooth', rx: -2, ry: -3, push: .05 });
})();
