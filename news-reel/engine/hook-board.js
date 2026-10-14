// "Board" hook v2 – photographic. Two real plates (assets/plates: wide room + board close-up, generated
// once with Higgsfield) carry all texture, light and haze. We only composite the tear-off calendar
// (paper texture + the plate's own light/shadow multiplied over it) and drive a camera like an
// operator would: whip pan with a small overshoot, accelerating push, jump cut, settle, handheld.
// 24 fps + 180° shutter motion blur come from the renderer (sub-frame accumulation).
import { clamp, lerp, prog, ease, brandOut, brandInOut, snapOut } from "./ease.js";

const MONTHS_NOM = ["LEDEN", "ÚNOR", "BŘEZEN", "DUBEN", "KVĚTEN", "ČERVEN", "ČERVENEC", "SRPEN", "ZÁŘÍ", "ŘÍJEN", "LISTOPAD", "PROSINEC"];
const MONTHS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const DAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
const dayMs = 86400000;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };

// plate geometry (px of the 3840×2160 plates)
const PAD_W = 1000, PAD_H = 1250; // calendar pad in close-plate px
const WIDE_CAL = { x: 2760, y: 800, k: 0.24 }; // where the pad hangs in the wide plate (+ its scale)
const CLOSE_CAL = { x: 2330, y: 1090 };

export function buildBoardHook(root, ep, cfg) {
  const W = window.__W ?? 1920, H = window.__H ?? 1080;
  const today = parse(ep.today), news = parse(ep.newsDate);
  const back = Math.max(0, Math.round((today - news) / dayMs));
  let days = [];
  for (let k = 0; k <= back; k++) days.push(new Date(+today - k * dayMs));
  if (days.length > 8) days = [...days.slice(0, 4), ...days.slice(-4)];
  const nFlip = days.length - 1;

  const T = { whip: [0, 1.05], push: [1.0, 0.45], cut: 1.45, cross: [1.95, 0.5], gust: 2.62, flip: 0.105, flipDur: 0.46 };
  T.land = T.gust + Math.max(0, nFlip - 1) * T.flip + T.flipDur;
  T.circle = [T.land + 0.02, 0.38];
  T.text = T.land + 0.12;
  T.dive = [T.land + 0.6, 0.45];
  T.end = T.dive[0] + T.dive[1];

  const page = (d, i, withMarks) => `<div class="pg" style="z-index:${100 - i}">
      <div class="pg-face front">
        <div class="pg-top"><span>${MONTHS_NOM[d.getUTCMonth()]}</span><span>${d.getUTCFullYear()}</span></div>
        <div class="pg-num">${d.getUTCDate()}</div><div class="pg-day">${DAYS[d.getUTCDay()]}</div>
        ${withMarks && i === 0 ? `<svg class="pg-x" viewBox="0 0 1000 1250"><path pathLength="1" d="M190 420 C330 560 560 760 820 960"/><path pathLength="1" d="M830 430 C680 560 470 760 200 980"/></svg>` : ""}
        ${withMarks && i === nFlip ? `<svg class="pg-o" viewBox="0 0 1000 1250"><path pathLength="1" d="M520 300 C790 300 880 520 860 680 C840 880 660 990 490 985 C280 980 150 840 155 650 C160 460 300 320 560 312"/></svg>` : ""}
        <div class="pg-shade"></div>
      </div>
      <div class="pg-face backf"></div>
    </div>`;
  const pad = (withMarks, cls) => `<div class="cpad ${cls}">
      <div class="pad-shadow"></div><div class="pad-edge e3"></div><div class="pad-edge e2"></div><div class="pad-edge e1"></div>
      ${(withMarks ? days : [days[0]]).map((d, i) => page(d, i, withMarks)).join("")}
      <div class="pad-bind"></div><i class="pin2"></i>
    </div>`;
  // light map: the plate itself, aligned under the pad, multiplied over the paper → real stripes & shade on it
  const lightmap = (plate, cx, cy, k) => {
    const w = PAD_W * k, h = (PAD_H + 60) * k, x = cx - w / 2, y = cy - (PAD_H / 2) * k - 30 * k;
    const st = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background-image:url(../assets/plates/${plate}.jpg);background-position:${-x}px ${-y}px`;
    return `<div class="lmap" style="${st}"></div><div class="lcol" style="${st}"></div>`;
  };

  const layer = document.createElement("div");
  layer.className = "bhook";
  layer.innerHTML = `
    <svg width="0" height="0" style="position:absolute">
      <filter id="bh-marker"><feTurbulence type="fractalNoise" baseFrequency=".05 .9" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>
      <filter id="bh-chalk"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.7"/><feComposite in="SourceGraphic" operator="in"/></filter>
    </svg>
    <div class="bh-shot wide"><div class="bh-plate">
      <img src="../assets/plates/wide.jpg" class="plate-img"><img src="../assets/plates/wide.jpg" class="plate-glow">
      <div class="calhold" style="left:${WIDE_CAL.x}px;top:${WIDE_CAL.y}px;transform:translate(-50%,-50%) scale(${WIDE_CAL.k})">${pad(false, "wide")}</div>
      ${lightmap("wide", WIDE_CAL.x, WIDE_CAL.y, WIDE_CAL.k)}
    </div></div>
    <div class="bh-shot close"><div class="bh-plate">
      <img src="../assets/plates/close.jpg" class="plate-img"><img src="../assets/plates/close.jpg" class="plate-glow">
      <div class="calhold" style="left:${CLOSE_CAL.x}px;top:${CLOSE_CAL.y}px;transform:translate(-50%,-50%)">${pad(true, "close")}</div>
      ${lightmap("close", CLOSE_CAL.x, CLOSE_CAL.y, 1)}
      <div class="chalk2 bh-note" style="left:${CLOSE_CAL.x + 620}px;top:${CLOSE_CAL.y - 120}px">novinka!</div>
      <svg class="chalk2-svg bh-arrow" style="left:${CLOSE_CAL.x + 520}px;top:${CLOSE_CAL.y + 40}px" width="420" height="360" viewBox="0 0 420 360"><path pathLength="1" d="M390 30 C300 70 190 170 70 300 M70 300 L100 200 M70 300 L170 280"/></svg>
    </div></div>
    <div class="bh-haze"></div><div class="bh-leak"></div><div class="bh-vig"></div>
    <div class="bh-title"><span class="bt1">novinka ze</span><span class="bt2">${news.getUTCDate()}. ${MONTHS_GEN[news.getUTCMonth()]}</span></div>
    <div class="bh-flash"></div>`;
  root.appendChild(layer);

  const wideShot = layer.querySelector(".bh-shot.wide"), closeShot = layer.querySelector(".bh-shot.close");
  const widePlate = wideShot.firstElementChild, closePlate = closeShot.firstElementChild;
  const pages = [...closeShot.querySelectorAll(".pg")];
  const xs = [...closeShot.querySelectorAll(".pg-x path")], os = [...closeShot.querySelectorAll(".pg-o path")];
  const note = closeShot.querySelector(".bh-note"), arrow = closeShot.querySelector(".bh-arrow path");
  const leak = layer.querySelector(".bh-leak"), flash = layer.querySelector(".bh-flash");
  const title = layer.querySelector(".bh-title"), bt1 = title.children[0], bt2 = title.children[1];

  // operator-style handheld: a few incommensurate low frequencies, never a clean sine
  const shake = (t, a = 1) => ({
    x: a * (Math.sin(t * 1.31) * 5 + Math.sin(t * 2.97 + 1.3) * 2.6 + Math.sin(t * 6.1 + 0.4) * 0.9),
    y: a * (Math.sin(t * 1.07 + 2.1) * 4 + Math.sin(t * 3.41 + 0.7) * 2.1 + Math.sin(t * 5.3) * 0.8),
    r: a * (Math.sin(t * 0.83 + 0.5) * 0.18 + Math.sin(t * 2.3) * 0.06),
  });
  const place = (plate, cx, cy, s, rot = 0, ry = 0) => {
    // never show past the edge of the photo (extra 4 % margin covers rotation/handheld)
    const m = 1.04;
    s = Math.max(s, (m * W) / 3840, (m * H) / 2160);
    const hw = W / (2 * s) * m, hh = H / (2 * s) * m;
    cx = clamp(cx, hw, 3840 - hw); cy = clamp(cy, hh, 2160 - hh);
    plate.style.transform = `translate(${W / 2 - cx * s}px, ${H / 2 - cy * s}px) scale(${s})`;
    plate.parentElement.style.transform = `perspective(2200px) rotateY(${ry}deg) rotate(${rot}deg)`;
  };

  function update(t) {
    const on = t < T.end + 0.05;
    layer.style.display = on ? "block" : "none";
    if (!on) return;
    const sh = shake(t, t < T.cut ? 1.4 : 1);
    if (t < T.cut) {
      wideShot.style.display = "block"; closeShot.style.display = "none";
      // whip: fast attack, long settle, a 2 % overshoot the operator corrects
      const u = prog(t, ...T.whip);
      const p = snapOut(u) + 0.022 * Math.sin(Math.PI * clamp((u - 0.5) / 0.5));
      let cx = lerp(820, 2560, p), cy = lerp(1180, 1010, p), s = lerp(0.8, 0.53, p);
      const ry = lerp(16, 0, snapOut(u));
      // accelerating dolly push towards the small calendar
      const q = ease.inQuad(prog(t, ...T.push));
      cx = lerp(cx, WIDE_CAL.x, q); cy = lerp(cy, WIDE_CAL.y, q); s = lerp(s, 1.45, q);
      place(widePlate, cx + sh.x / s, cy + sh.y / s, s, sh.r, ry);
    } else {
      wideShot.style.display = "none"; closeShot.style.display = "block";
      // jump cut: a step closer, then a short settle and a slow creep in
      const a = brandOut(prog(t, T.cut, 0.85));
      let cx = lerp(CLOSE_CAL.x + 90, CLOSE_CAL.x + 10, a), cy = lerp(CLOSE_CAL.y + 70, CLOSE_CAL.y + 20, a);
      let s = lerp(0.5, 0.58, a) + (t - T.cut) * 0.012, rot = lerp(-1.2, 0, a);
      // the gust nudges the camera a little
      const g = prog(t, T.gust - 0.15, 0.9);
      cx += Math.sin(g * Math.PI) * 26; rot += Math.sin(g * Math.PI * 2) * 0.35;
      // dive into the circled date
      const d = ease.inExpo(prog(t, ...T.dive)), dd = brandOut(prog(t, ...T.dive));
      cx = lerp(cx, CLOSE_CAL.x, dd); cy = lerp(cy, CLOSE_CAL.y + 40, dd); s *= lerp(1, 6, d);
      place(closePlate, cx + sh.x / s, cy + sh.y / s, s, rot + sh.r);
    }

    // marker cross-out
    xs.forEach((p, i) => { p.style.strokeDashoffset = String(1 - brandInOut(prog(t, T.cross[0] + i * 0.24, 0.21))); });
    // pages: tremble in the breeze, then the gust flips them towards camera, over the binding and away
    pages.forEach((pg, i) => {
      if (i === nFlip) return;
      const start = T.gust + i * T.flip;
      const f = prog(t, start, T.flipDur);
      const tremble = i === 0 ? Math.sin(t * 31) * 3.5 * prog(t, T.gust - 0.5, 0.45) * (1 - f) : 0;
      const ang = ease.inOutCubic(f) * 172 + tremble;
      const fly = ease.inQuad(prog(t, start + T.flipDur * 0.65, 0.4));
      pg.style.transform = `translateY(${-fly * 1600}px) translateZ(${Math.sin(f * Math.PI) * 140}px) rotateX(${-ang}deg) rotateZ(${Math.sin(f * 5 + i) * 7 * f}deg)`;
      pg.style.visibility = fly > 0.98 ? "hidden" : "visible";
      const back = ang > 90;
      pg.querySelector(".front").style.visibility = back ? "hidden" : "visible";
      pg.querySelector(".backf").style.visibility = back ? "visible" : "hidden";
      pg.querySelector(".pg-shade").style.opacity = String(Math.sin(clamp(f) * Math.PI) * 0.45);
    });
    os.forEach((p) => { p.style.strokeDashoffset = String(1 - brandInOut(prog(t, ...T.circle))); });
    const n = brandOut(prog(t, T.circle[0] + 0.12, 0.45));
    note.style.clipPath = `inset(-20% ${100 - n * 100}% -20% -5%)`;
    arrow.style.strokeDashoffset = String(1 - brandInOut(prog(t, T.circle[0] + 0.05, 0.35)));

    // clean title over the plate (like the reference: neutral sans + one handwritten word)
    const a1 = snapOut(prog(t, T.text, 0.6)), a2 = snapOut(prog(t, T.text + 0.12, 0.6));
    const out = ease.inQuad(prog(t, T.dive[0], 0.2));
    bt1.style.opacity = String(a1 * (1 - out)); bt1.style.filter = `blur(${(1 - a1) * 12}px)`; bt1.style.transform = `translateY(${(1 - a1) * 30}px)`;
    bt2.style.opacity = String(a2 * (1 - out)); bt2.style.filter = `blur(${(1 - a2) * 14}px)`; bt2.style.transform = `translateY(${(1 - a2) * 40}px) rotate(-3deg)`;

    leak.style.opacity = String(0.5 + Math.sin(t * 1.7) * 0.12);
    flash.style.opacity = String(ease.inQuad(prog(t, T.end - 0.2, 0.2)));
  }

  const sfx = [
    { name: "camera_whip", at: 0.0, gain: 0 }, { name: "wind_gust", at: 0.05, gain: -12 },
    { name: "transition_swish", at: T.push[0] + 0.05, gain: -6 }, { name: "hook_impact", at: T.cut, gain: -13 },
    { name: "marker_scratch", at: T.cross[0] - 0.02, gain: -2 },
    { name: "wind_gust", at: T.gust - 0.4, gain: -3 }, { name: "page_flutter", at: T.gust - 0.04, gain: 0 },
    { name: "marker_scratch", at: T.circle[0], gain: -7 }, { name: "ui_pop", at: T.text, gain: -8 },
    { name: "hook_dive", at: T.dive[0] - 0.1, gain: -4 }, { name: "reveal_shimmer", at: T.end - 0.25, gain: -7 },
  ];
  return { update, duration: T.end, cues: { impact: T.land, whoosh: T.dive[0], ticks: [], riser: [0, T.land] }, sfx };
}
