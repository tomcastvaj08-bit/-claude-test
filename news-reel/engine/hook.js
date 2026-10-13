// The series hook: identical every episode, only the dates change.
// Apple Calendar (dark) month view -> slow push-in on TODAY (red) -> zoom out ->
// red circle travels back day by day to the NEWS date -> lands -> camera dives into it.
import { clamp, lerp, prog, ease, spring, appleEase, brandInOut, snapOut } from "./ease.js";

// Fast and punchy: it's the hook. Punch-in on today, snap out to the month in 3D, the dot shoots back
// to the news date, impact, iris. ~2.5 s total.
export const HOOK = {
  pushIn: [0.0, 0.5],    // punch-in on today
  zoomOut: [0.42, 0.5],  // snap out to the whole month (tilted plane)
  travel: [0.82, 0.7],   // dot shoots back in time
  land: 1.55,            // impact
  dive: [1.8, 0.55],     // push towards the dot + iris
  duration: 2.4,         // body starts here
};

const MONTHS = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
export const MONTHS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const DOW = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

const W = 1080, H = 1920;
const COL = W / 7;
const ROW = 176;
const GRID_TOP = 560; // y of first week row inside the calendar layer

export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const dayMs = 86400000;
const mondayIdx = (date) => (date.getUTCDay() + 6) % 7;

export function buildHook(root, ep, cfg) {
  const today = parseDate(ep.today);
  const news = parseDate(ep.newsDate);
  const daysBack = Math.max(0, Math.round((today - news) / dayMs));

  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const last = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  let start = news < first ? news : first;
  start = new Date(start - mondayIdx(start) * dayMs);
  const end = new Date(+last + (6 - mondayIdx(last)) * dayMs);
  const nDays = Math.round((end - start) / dayMs) + 1;

  const layer = document.createElement("div");
  layer.className = "hook";
  layer.innerHTML = `
    <div class="cal3d"><div class="cal">
      <div class="cal-top"><span class="cal-back">‹ ${today.getUTCFullYear()}</span>
        <span class="cal-icons"><i></i><i></i><b>+</b></span></div>
      <div class="cal-month">${MONTHS[today.getUTCMonth()]}</div>
      <div class="cal-dow">${DOW.map((d, i) => `<span class="${i > 4 ? "we" : ""}">${d}</span>`).join("")}</div>
      <div class="cal-grid"></div>
      <div class="cal-today-ring"></div>
      <div class="cal-dot"></div>
      <div class="cal-dot-num"></div>
    </div></div>
    <div class="hook-badge"><span class="hb-dot"></span><span class="hb-title">Aktualita</span><span class="hb-no">${String(ep.number ?? 1).padStart(2, "0")}</span></div>
    <div class="hook-label"><span class="hl-small">NOVINKA ZE DNE</span><span class="hl-big">${news.getUTCDate()}. ${MONTHS_GEN[news.getUTCMonth()]}</span></div>
    <div class="hook-fill"></div>`;
  root.appendChild(layer);

  const grid = layer.querySelector(".cal-grid");
  const cells = new Map();
  for (let i = 0; i < nDays; i++) {
    const d = new Date(+start + i * dayMs);
    const col = i % 7, row = Math.floor(i / 7);
    const inMonth = d.getUTCMonth() === today.getUTCMonth();
    const showOut = news.getUTCMonth() !== today.getUTCMonth(); // iOS month view shows only its own days
    const x = col * COL + COL / 2, y = GRID_TOP + row * ROW + 62;
    const el = document.createElement("div");
    el.className = `cal-cell${col > 4 ? " we" : ""}${inMonth ? "" : " out"}`;
    el.style.left = `${col * COL}px`;
    el.style.top = `${GRID_TOP + row * ROW}px`;
    el.innerHTML = `<span>${inMonth || (showOut && d >= news) ? d.getUTCDate() : ""}</span>${col === 0 ? '<div class="cal-line"></div>' : ""}`;
    grid.appendChild(el);
    cells.set(+d, { el, x, y, row, col, date: d });
  }
  const cellOf = (d) => cells.get(+d);
  const todayCell = cellOf(today);
  const newsCell = cellOf(news);
  const path = [];
  for (let k = 0; k <= daysBack; k++) path.push(cellOf(new Date(+today - k * dayMs)));

  const cal = layer.querySelector(".cal"), cal3d = layer.querySelector(".cal3d");
  const dot = layer.querySelector(".cal-dot");
  const dotNum = layer.querySelector(".cal-dot-num");
  const ring = layer.querySelector(".cal-today-ring");
  const badge = layer.querySelector(".hook-badge");
  const label = layer.querySelector(".hook-label");
  const fill = layer.querySelector(".hook-fill");
  ring.style.transform = `translate(${todayCell.x - 56}px, ${todayCell.y - 56}px)`;

  const gridCenterY = GRID_TOP + (Math.ceil(nDays / 7) * ROW) / 2 - 120;
  const T = HOOK;

  // Times (relative to hook start) of each day crossing — used to place tick SFX.
  const travelFn = ease.inOutQuart;
  const tickTimes = [];
  for (let k = 1; k <= daysBack; k++) {
    // invert travelFn numerically: find u with travelFn(u) = k/daysBack
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      travelFn(mid) < (k - 0.5) / daysBack ? (lo = mid) : (hi = mid);
    }
    tickTimes.push(T.travel[0] + lo * T.travel[1]);
  }

  function update(t) {
    layer.style.display = t > T.duration + 0.05 ? "none" : "block";
    if (t > T.duration + 0.05) return;

    // --- dot position along the day path
    const pTravel = travelFn(prog(t, ...T.travel));
    const f = pTravel * daysBack;
    const k = Math.min(Math.floor(f), Math.max(0, daysBack - 1));
    const frac = daysBack === 0 ? 0 : f - k;
    const a = path[k] ?? todayCell, b = path[k + 1] ?? a;
    let dx, dy, dScale = 1;
    if (a.row === b.row) {
      dx = lerp(a.x, b.x, frac);
      dy = lerp(a.y, b.y, frac);
    } else {
      // week boundary: shrink out of Monday, grow into the previous Sunday
      const s = frac < 0.5 ? 1 - ease.inCubic(frac * 2) : ease.outCubic((frac - 0.5) * 2);
      dx = frac < 0.5 ? a.x : b.x;
      dy = frac < 0.5 ? a.y : b.y;
      dScale = Math.max(0.001, s);
    }
    const landT = t - T.land;
    // impact "thump": quick damped overshoot when the dot lands
    const pop = landT > 0 ? 1 + 0.32 * Math.exp(-landT * 6) * Math.sin(landT * 16) : 1;
    const dotSize = 112;
    dot.style.transform = `translate(${dx - dotSize / 2}px, ${dy - dotSize / 2}px) scale(${dScale * pop})`;
    const near = frac < 0.5 ? a : b;
    dotNum.textContent = near.date.getUTCDate();
    dotNum.style.transform = `translate(${dx - 60}px, ${dy - 40}px) scale(${dScale * pop})`;
    for (const c of cells.values()) c.el.classList.toggle("hidden-num", c === near);
    ring.style.opacity = t > T.travel[0] + 0.05 ? clamp((t - T.travel[0]) / 0.3) : 0;

    // --- camera
    let s, fx, fy;
    const pPush = ease.inOutSine(prog(t, ...T.pushIn));
    const pOut = ease.inOutCubic(prog(t, ...T.zoomOut));
        const s0 = lerp(1.5, 2.7, snapOut(prog(t, ...T.pushIn)));
    s = lerp(s0, 1, pOut);
    fx = lerp(todayCell.x, W / 2, pOut);
    fy = lerp(todayCell.y, gridCenterY, pOut);
    // the month stays put (no follow, no pan to another "slide"): only a gentle push towards the dot at the end
    const pPushEnd = brandInOut(prog(t, T.land - 0.1, T.dive[0] + T.dive[1] - T.land + 0.1));
    const fx0 = fx, fy0 = fy;
    s = s * lerp(1, 1.18, pPushEnd);
    fx = lerp(fx0, newsCell.x, pPushEnd * 0.35);
    fy = lerp(fy0, newsCell.y, pPushEnd * 0.35);
    const tx = W / 2 - fx * s, ty = H / 2 - fy * s;
    cal.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    // 3D camera: arrive tilted, lay the month down as a plane, orbit slightly while the dot travels, flatten on impact
    const tIn = snapOut(prog(t, 0, 0.6));
    const tilt = lerp(0, 1, brandInOut(prog(t, T.zoomOut[0], 0.45))) * (1 - brandInOut(prog(t, T.land - 0.15, 0.45)));
    const rx = (1 - tIn) * 28 + tilt * 22;
    const ry = (1 - tIn) * -24 + tilt * lerp(10, -8, brandInOut(prog(t, T.travel[0], T.travel[1])));
    const rz = (1 - tIn) * 6 + tilt * -3;
    cal3d.style.transform = `perspective(1500px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${1 + tilt * 0.08})`;

    // --- overlays
    const bIn = appleEase(prog(t, 0.15, 0.6));
    const bOut = ease.inCubic(prog(t, T.dive[0], 0.25));
    badge.style.opacity = bIn * (1 - bOut);
    badge.style.transform = `translate(-50%, ${lerp(-40, 0, bIn)}px)`;
    const lIn = spring(t - T.land, { stiffness: 220, damping: 16 });
    const lOut = ease.inCubic(prog(t, T.dive[0] + 0.05, 0.25));
    label.style.opacity = clamp(lIn) * (1 - lOut);
    label.style.transform = `translate(-50%, ${lerp(80, 0, lIn)}px) scale(${lerp(0.9, 1, lIn)})`;
    // iris: brand paper opens from the centre of the date we dive into
    const iris = ease.inOutExpo(prog(t, T.dive[0] + T.dive[1] * 0.2, T.dive[1] * 0.8 + 0.05));
    // iris opens from the red dot's position on screen – we never leave the October view
    const sx = tx + dx * s, sy = ty + dy * s;
    fill.style.clipPath = `circle(${iris * 2300}px at ${sx}px ${sy}px)`;
    fill.style.opacity = iris > 0 ? 1 : 0;
  }

  return {
    update,
    duration: T.duration,
    cues: {
      riser: [T.zoomOut[0], T.land],
      ticks: tickTimes,
      impact: T.land,
      whoosh: T.dive[0],
      daysBack,
    },
  };
}
