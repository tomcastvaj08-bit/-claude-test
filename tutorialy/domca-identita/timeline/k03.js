// K03 · Krok 2: Seedance v edit módu – vzhled ano, lip sync ne → „na tohle to zrovna není“.
(() => {
  const { T, AT, cam } = ENGINE;
  const { A, CH, flyTo, logo, frame } = L;
  const o = A.k03, X = v => o.x + v, Y = v => o.y + v, C = n => 'k03.' + n;

  W.card({ x: X(0), y: Y(-1500), w: 1900, in: CH('k03') + 1.0, kicker: 'Krok 02 · slepá ulička', kc: 'o', title: 'Seedance <span class="gr">edit mode</span>' });
  W.html({ x: X(-900), y: Y(150), z: 30, w: 1700, h: 1100, in: T(C('s2')) + .3, anim: 'tilt',
    fx: [{ t: AT(C('fail2'), 'zrovna'), sel: '.dim' }],
    html: `<div class="card" style="height:100%;padding:36px 40px;position:relative">
      <div style="display:flex;align-items:center;gap:24px">${logo('seedance', 90)}<div style="font:650 54px var(--sans);letter-spacing:-.04em">Seedance · edit</div></div>
      <div class="pic" style="height:760px;margin-top:28px;position:relative"><img src="${frame('original', 3.2)}" style="width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;left:41%;top:52%;width:180px;height:110px;border:8px solid var(--red);border-radius:50%"></div></div>
      <div class="dim" style="position:absolute;inset:0;border-radius:inherit;background:rgba(244,246,249,calc(var(--hl,0)*.6))"></div></div>` });

  W.html({ x: X(1150), y: Y(-250), z: 80, w: 1300, h: 200, in: AT(C('fail2'), 'vzhled'), anim: 'pop',
    html: `<div style="display:flex"><span class="mpill g" style="font-size:54px;padding:20px 40px"><span class="d"></span>vzhled ✓</span></div>` });
  W.html({ x: X(1150), y: Y(50), z: 80, w: 1300, h: 200, in: AT(C('fail2'), 'lip'), anim: 'pop',
    html: `<div style="display:flex"><span class="mpill r" style="font-size:54px;padding:20px 40px;color:var(--red)"><span class="d"></span>lip sync ✕</span></div>` });
  W.callout({ x: X(1250), y: Y(450), z: 60, w: 1400, in: AT(C('fail2'), 'Pusa'), c: 'r', lab: 'Problém', txt: '<b>pusa nesedí na slova</b> – u talking head to divák pozná první' });
  W.html({ x: X(1100), y: Y(1050), z: 120, w: 1700, h: 260, in: AT(C('fail2'), 'zrovna'), anim: 'pop',
    html: `<div style="font:750 96px/1.05 var(--sans);letter-spacing:-.05em;color:var(--red);transform:rotate(-3deg)">na tohle to<br>zrovna není.</div>` });
  W.html({ x: X(1100), y: Y(1500), z: 80, w: 900, h: 120, in: AT(C('fail2'), 'dál'), anim: 'rise',
    html: `<div style="display:flex"><span class="btn" style="font-size:40px">Dál <span class="ar">→</span></span></div>` });

  flyTo('k03', { x: X(0), y: Y(-1400), d: 2400 });
  cam({ t: T(C('s2')) - .1, dur: 1.5, x: X(-700), y: Y(150), d: 3000, ease: 'smooth', rx: 3, ry: 5, push: .05 });
  cam({ t: T(C('fail2')) - .3, dur: 1.2, x: X(800), y: Y(150), d: 3000, ease: 'whip', rx: 2, ry: -5, push: .05 });
  cam({ t: AT(C('fail2'), 'zrovna') - .4, dur: 1.0, x: X(1000), y: Y(1150), d: 2300, ease: 'whip', rx: 0, ry: -2, push: .06 });
})();
