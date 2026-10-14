// "Board" hook – inspired by the chalkboard reel: warm sun through blinds on a green chalkboard,
// whip-pan from the wooden wall onto the board, small tear-off calendar pinned on it, push-in with a
// jump cut, settle; today's date gets crossed out with a marker, a gust of wind flips the pages back
// to the news date, it gets circled, camera dives in → clean brand motion graphics.
import { clamp, lerp, prog, ease, brandOut, brandInOut, snapOut } from "./ease.js";

const W = 1080, H = 1920;
const MONTHS_NOM = ["LEDEN", "ÚNOR", "BŘEZEN", "DUBEN", "KVĚTEN", "ČERVEN", "ČERVENEC", "SRPEN", "ZÁŘÍ", "ŘÍJEN", "LISTOPAD", "PROSINEC"];
const DAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
const dayMs = 86400000;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };

// world layout (px in board space)
const C = { x: 2060, y: 1020 }; // calendar centre
const PAD_W = 400, PAD_H = 500;

export function buildBoardHook(root, ep, cfg) {
  const today = parse(ep.today), news = parse(ep.newsDate);
  const back = Math.max(0, Math.round((today - news) / dayMs));
  // pages from today down to the news date (long gaps are shortened to max 7 flips)
  let days = [];
  for (let k = 0; k <= back; k++) days.push(new Date(+today - k * dayMs));
  if (days.length > 8) days = [...days.slice(0, 4), ...days.slice(-4)];
  const nFlip = days.length - 1;

  // ---------------- timeline
  const T = { rush: [0, 0.9], push: [0.88, 0.36], cut: 1.24, cross: [1.55, 0.46], gust: 2.2, flip: 0.1, flipDur: 0.42 };
  T.land = T.gust + Math.max(0, nFlip - 1) * T.flip + T.flipDur;
  T.circle = [T.land + 0.02, 0.36];
  T.dive = [T.land + 0.42, 0.42];
  T.end = T.dive[0] + T.dive[1];

  const page = (d, i) => `<div class="pg" style="z-index:${100 - i}">
      <div class="pg-face front"><div class="pg-top"><span>${MONTHS_NOM[d.getUTCMonth()]}</span><span>${d.getUTCFullYear()}</span></div>
        <div class="pg-num">${d.getUTCDate()}</div><div class="pg-day">${DAYS[d.getUTCDay()]}</div>
        ${i === 0 ? `<svg class="pg-x" viewBox="0 0 400 500"><path pathLength="1" d="M88 150 C150 210 250 300 318 372"/><path pathLength="1" d="M322 158 C262 220 168 300 92 378"/></svg>` : ""}
        ${i === nFlip ? `<svg class="pg-o" viewBox="0 0 400 500"><path pathLength="1" d="M200 118 C318 116 352 210 344 270 C334 352 262 398 196 396 C112 394 58 340 60 262 C62 186 120 128 214 124"/></svg>` : ""}
      </div>
      <div class="pg-face backf"></div><div class="pg-shade"></div>
    </div>`;

  const layer = document.createElement("div");
  layer.className = "bhook";
  layer.innerHTML = `
    <svg width="0" height="0" style="position:absolute">
      <filter id="bh-mblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur id="bh-mblur-g" stdDeviation="0 0"/></filter>
      <filter id="bh-chalk"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 1.6"/><feComposite in="SourceGraphic" operator="in"/><feGaussianBlur stdDeviation=".4"/></filter>
      <filter id="bh-marker"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
    </svg>
    <div class="bh-cam"><div class="bh-world">
      <div class="bh-wood"></div>
      <div class="bh-board">
        <div class="bh-surface"></div>
        <div class="bh-smudge s1"></div><div class="bh-smudge s2"></div><div class="bh-smudge s3"></div>
        <div class="chalk" style="left:330px;top:820px;transform:rotate(-4deg);font-size:120px">co je nového?</div>
        <div class="chalk" style="left:1540px;top:1420px;transform:rotate(3deg);font-size:76px">týden ${isoWeek(today)}</div>
        <div class="chalk" style="left:300px;top:1280px;transform:rotate(-2deg);font-size:64px">AI · sítě · reklama</div>
        <svg class="chalk-svg" style="left:820px;top:980px" width="560" height="220" viewBox="0 0 560 220"><path d="M10 170 C160 60 330 40 520 110 M470 70 L522 112 L462 140" /></svg>
        <div class="chalk bh-note" style="left:2330px;top:860px;transform:rotate(-6deg);font-size:110px">novinka!</div>
        <svg class="chalk-svg bh-arrow" style="left:2250px;top:960px" width="240" height="200" viewBox="0 0 240 200"><path pathLength="1" d="M220 20 C170 40 110 90 40 160 M40 160 L58 104 M40 160 L96 146"/></svg>
      </div>
      <div class="polar" style="left:860px;top:300px;transform:rotate(-5deg)"><i class="pin"></i><div class="polar-img pi1"><b class="sph b"></b><b class="sph g"></b></div><span>trendy</span></div>
      <div class="polar" style="left:2560px;top:260px;transform:rotate(4deg)"><i class="pin"></i><div class="polar-img pi2">AI</div><span>nástroje</span></div>
      <div class="sticky" style="left:1240px;top:1500px;transform:rotate(4deg)"><i class="pin"></i>Aktualita<br>#${String(ep.number ?? 1).padStart(2, "0")}</div>
      <div class="pad" style="left:${C.x - PAD_W / 2}px;top:${C.y - PAD_H / 2}px">
        <div class="pad-edge e3"></div><div class="pad-edge e2"></div><div class="pad-edge e1"></div>
        ${days.map((d, i) => page(d, i)).join("")}
        <div class="pad-bind"></div><i class="pin big"></i>
      </div>
      <div class="bh-light"></div>
    </div></div>
    <div class="bh-dust">${Array.from({ length: 34 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
    <div class="bh-grade"></div><div class="bh-leak"></div><div class="bh-vig"></div><div class="bh-flash"></div>`;
  root.appendChild(layer);

  const camEl = layer.querySelector(".bh-cam"), worldEl = layer.querySelector(".bh-world"), mblur = layer.querySelector("#bh-mblur-g");
  const pages = [...layer.querySelectorAll(".pg")];
  const xs = [...layer.querySelectorAll(".pg-x path")], os = [...layer.querySelectorAll(".pg-o path")];
  const note = layer.querySelector(".bh-note"), arrow = layer.querySelector(".bh-arrow path");
  const dust = [...layer.querySelectorAll(".bh-dust i")], leak = layer.querySelector(".bh-leak"), flash = layer.querySelector(".bh-flash");
  const sevenPos = { x: C.x, y: C.y + 10 };

  // ---------------- camera
  function camAt(t) {
    let x, y, s, ry = 0, rz = 0;
    if (t < T.cut) {
      // whip from the wooden wall onto the board (fast attack, long settle)…
      const a = snapOut(prog(t, ...T.rush));
      x = lerp(380, 1900, a); y = lerp(1180, 1060, a); s = lerp(0.95, 0.58, a); ry = lerp(30, 0, a); rz = lerp(-3, 0, a);
      // …then an accelerating push towards the small calendar
      const p = ease.inQuad(prog(t, ...T.push));
      x = lerp(x, C.x, p); y = lerp(y, C.y, p); s = lerp(s, 1.15, p);
    } else {
      // JUMP CUT closer, then a short settle-in
      const a = snapOut(prog(t, T.cut, 0.75));
      x = lerp(C.x + 60, C.x, a); y = lerp(C.y + 50, C.y + 20, a); s = lerp(2.05, 2.3, a) + (t - T.cut) * 0.03; rz = lerp(-1.6, 0, a);
      // gust: camera gets nudged
      const g = prog(t, T.gust - 0.1, 0.9);
      x += Math.sin(g * Math.PI) * 18; rz += Math.sin(g * Math.PI * 2) * 0.5;
      // dive into the news date
      const d = ease.inExpo(prog(t, ...T.dive));
      x = lerp(x, sevenPos.x, brandOut(prog(t, ...T.dive))); y = lerp(y, sevenPos.y, brandOut(prog(t, ...T.dive))); s *= lerp(1, 7, d);
    }
    // handheld
    x += Math.sin(t * 1.9) * 7 + Math.sin(t * 4.3) * 3; y += Math.cos(t * 1.6) * 6 + Math.sin(t * 3.7) * 2.5; rz += Math.sin(t * 1.25) * 0.25;
    return { x, y, s, ry, rz };
  }

  function update(t) {
    const on = t < T.end + 0.05;
    layer.style.display = on ? "block" : "none";
    if (!on) return;
    const c = camAt(t), c0 = camAt(Math.max(0, t - 1 / 30));
    worldEl.style.transform = `translate(${W / 2 - c.x * c.s}px, ${H / 2 - c.y * c.s}px) scale(${c.s})`;
    camEl.style.transform = `perspective(1300px) rotateY(${c.ry}deg) rotateZ(${c.rz}deg)`;
    // directional motion blur from screen-space velocity (long shutter look)
    const vx = (c.x * c.s - c0.x * c0.s), vy = (c.y * c.s - c0.y * c0.s), vs = Math.abs(c.s - c0.s) * 600;
    const bx = Math.min(40, Math.abs(vx) * 0.35 + vs * 0.6), by = Math.min(30, Math.abs(vy) * 0.35 + vs * 0.6);
    mblur.setAttribute("stdDeviation", `${bx.toFixed(1)} ${by.toFixed(1)}`);
    camEl.style.filter = bx + by > 0.6 ? "url(#bh-mblur)" : "none";

    // marker cross-out on today
    xs.forEach((p, i) => { p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = String(1 - brandInOut(prog(t, T.cross[0] + i * 0.22, 0.2))); });
    // breeze: top page corner trembles before the gust
    pages.forEach((pg, i) => {
      if (i === nFlip) { pg.style.transform = ""; return; }
      const start = T.gust + i * T.flip;
      const f = prog(t, start, T.flipDur);
      const tremble = i === 0 ? Math.sin(t * 38) * 4 * prog(t, T.gust - 0.45, 0.4) * (1 - f) : 0;
      const ang = ease.inOutCubic(f) * 172 + tremble;
      const lift = Math.sin(f * Math.PI) * 60;
      const fly = ease.inQuad(prog(t, start + T.flipDur * 0.7, 0.35));
      pg.style.transform = `translateY(${-fly * 900}px) translateZ(${lift}px) rotateX(${-ang}deg) rotateZ(${Math.sin(f * 5 + i) * 6 * f}deg)`;
      // no opacity/filter on the 3D page (they would flatten it and show the mirrored front) – shade via overlay
      pg.style.visibility = fly > 0.98 ? "hidden" : "visible";
      // explicit face culling (browser backface-visibility is unreliable inside filtered/scaled parents)
      const showBack = ang > 90;
      pg.querySelector(".pg-face.front").style.visibility = showBack ? "hidden" : "visible";
      pg.querySelector(".pg-face.backf").style.visibility = showBack ? "visible" : "hidden";
      const sh = pg.querySelector(".pg-shade");
      if (sh) sh.style.opacity = String(Math.sin(clamp(f) * Math.PI) * 0.35);
    });
    // circle the news date + chalk note
    os.forEach((p) => { p.style.strokeDasharray = "1 1"; p.style.strokeDashoffset = String(1 - brandInOut(prog(t, ...T.circle))); });
    const n = brandOut(prog(t, T.circle[0] + 0.1, 0.4));
    note.style.clipPath = `inset(0 ${100 - n * 100}% 0 0)`;
    arrow.style.strokeDasharray = "1 1"; arrow.style.strokeDashoffset = String(1 - brandInOut(prog(t, T.circle[0] + 0.05, 0.3)));

    // light: dust motes drifting in the sun, warm leak breathing
    dust.forEach((d, i) => {
      const r = Math.sin(i * 12.9898) * 43758.5453, fr = r - Math.floor(r);
      const x = ((fr * 1080 + t * (30 + fr * 50) + Math.sin(t + i) * 30) % 1180) - 50;
      const y = (((i * 137) % 1920) + Math.sin(t * 0.8 + i) * 40 - t * 25 + 1920) % 1920;
      d.style.transform = `translate(${x}px, ${y}px) scale(${0.5 + fr})`;
      d.style.opacity = String(0.25 + 0.55 * fr);
    });
    leak.style.opacity = String(0.55 + Math.sin(t * 2.2) * 0.15 + snapOut(prog(t, 0, 0.5)) * 0.2 - 0.2);
    leak.style.transform = `translate(${Math.sin(t * 0.9) * 60 - c.ry * 8}px, ${Math.cos(t * 0.7) * 40}px)`;
    // flash out into the clean brand world
    const fl = ease.inQuad(prog(t, T.end - 0.2, 0.2));
    flash.style.opacity = String(fl);
  }

  const sfx = [
    { name: "camera_whip", at: 0.0, gain: -1 }, { name: "wind_gust", at: 0.0, gain: -10 },
    { name: "transition_swish", at: T.push[0] - 0.05, gain: -5 }, { name: "hook_impact", at: T.cut, gain: -12 },
    { name: "marker_scratch", at: T.cross[0] - 0.02, gain: -2 },
    { name: "wind_gust", at: T.gust - 0.35, gain: -4 }, { name: "page_flutter", at: T.gust - 0.05, gain: -1 },
    { name: "marker_scratch", at: T.circle[0], gain: -6 }, { name: "ui_pop", at: T.land, gain: -6 },
    { name: "hook_dive", at: T.dive[0] - 0.1, gain: -4 }, { name: "reveal_shimmer", at: T.end - 0.25, gain: -7 },
  ];
  return { update, duration: T.end, cues: { impact: T.land, whoosh: T.dive[0], ticks: [], riser: [0, T.land] }, sfx };
}

function isoWeek(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / dayMs + 1) / 7);
}
