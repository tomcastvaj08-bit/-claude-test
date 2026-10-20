// "Board" hook v3 – ONE photographic plate (assets/plates/wide.jpg: brick wall, chalkboard, sun through
// blinds, haze) and ONE continuous camera, so every element keeps the same texture and light from the
// wide shot to the close-up. On the board hang real-looking paper things: a printed wall calendar of the
// news month (wire-o binding, magnet hanger), a sticky note, a note stuck on with chewing gum and a blank
// sheet on two magnets – the sheet the motion graphics start on.
//
// Paper is drawn into canvases: real paper photo (fibres) → print multiplied into it → marker → the
// plate's own light (sun stripes, shade) multiplied over → fine grain. Each sheet is cut into horizontal
// strips chained in 3D, so the breeze BENDS the paper (lower part lifts and ripples) instead of rotating
// a flat card. Foreground autumn leaves are out of focus (f/1.8, focus on the board) and parallax with
// the camera. 24 fps + 180° shutter motion blur come from the renderer.
//
// Timeline: smooth truck left→right from the window onto the board → accelerating push → jump cut
// closer → settle → the news day gets circled with a red marker → chalk arrow → pan to the blank
// sheet → push into it until it fills the frame → hand-off to the clean motion graphics.
import { clamp, lerp, prog, ease, brandOut, brandInOut, snapOut, bezier } from "./ease.js";

const MONTHS_NOM = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
const MONTHS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const WD = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const dayMs = 86400000;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const truck = bezier(0.38, 0, 0.12, 1); // smooth dolly: gentle start, long settle

// ---- plate layout (px of the 3840×2160 plate; the board's inner area is ≈ x 1440–3820, y 175–1800)
const PLATE = { w: 3840, h: 2160 };
const CAL = { x: 2250, y: 1000, w: 620, h: 800, rot: -0.6, n: 14, res: 2.2, amp: 6, pow: 1.9, f: 1.1, seed: 0.4 };
const PAPER = { x: 3070, y: 1420, w: 760, h: 540, rot: 1.3, n: 10, res: 2.2, amp: 10, pow: 1.6, f: 1.35, seed: 2.1 };
const STICKY = { x: 1720, y: 700, w: 250, h: 250, rot: -6, n: 6, res: 2, amp: 13, pow: 1.3, f: 2.4, seed: 4.2, glue: 0.18 };
const NOTE = { x: 2830, y: 720, w: 200, h: 280, rot: 5, n: 7, res: 2, amp: 15, pow: 1.4, f: 1.9, seed: 1.3 };

// Czech public holidays (red in the grid, label in the cell)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(Date.UTC(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1));
}
function holidays(y) {
  const H = { "1-1": "Nový rok", "5-1": "Svátek práce", "5-8": "Den vítězství", "7-5": "Cyril a Metoděj", "7-6": "Mistr Jan Hus", "9-28": "Den české státnosti",
    "10-28": "Den vzniku ČSR", "11-17": "Den boje za svobodu", "12-24": "Štědrý den", "12-25": "1. svátek vánoční", "12-26": "2. svátek vánoční" };
  const e = easter(y), gf = new Date(+e - 2 * dayMs), em = new Date(+e + dayMs);
  H[`${gf.getUTCMonth() + 1}-${gf.getUTCDate()}`] = "Velký pátek";
  H[`${em.getUTCMonth() + 1}-${em.getUTCDate()}`] = "Velikonoční pondělí";
  return H;
}
const isoWeek = (d) => { const t = new Date(+d); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t - y0) / dayMs - 3 + ((y0.getUTCDay() + 6) % 7)) / 7); };
const monthCells = (y, m) => { const first = new Date(Date.UTC(y, m, 1)); const off = (first.getUTCDay() + 6) % 7; return Array.from({ length: 42 }, (_, k) => new Date(+first + (k - off) * dayMs)); };

// deterministic noise
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const bump = (t, c, w) => { const u = (t - c) / (w / 2); return Math.abs(u) >= 1 ? 0 : 0.5 * (1 + Math.cos(Math.PI * u)); };

import GAGS from "../assets/coldopen/v2/hook/index.json" with { type: "json" };

export function buildBoardHook(root, ep, cfg) {
  const W = window.__W ?? 1920, H = window.__H ?? 1080;
  const news = parse(ep.newsDate);
  const ny = news.getUTCFullYear(), nm = news.getUTCMonth();
  const HOL = holidays(ny);

  // ---- calendar grid layout (sheet units)
  const G = { x0: 66, x1: 592, y0: 286, y1: 770 };
  G.cw = (G.x1 - G.x0) / 7; G.rh = (G.y1 - G.y0) / 6;
  const cells = monthCells(ny, nm);
  const ni = cells.findIndex((d) => +d === +news);
  const dateCell = { x: G.x0 + ((ni % 7) + 0.5) * G.cw, y: G.y0 + (Math.floor(ni / 7) + 0.5) * G.rh };
  // sheet point → plate point (sheets are slightly rotated)
  const toPlate = (S, px, py) => {
    const a = (S.rot * Math.PI) / 180, dx = px - S.w / 2, dy = py - S.h / 2;
    return { x: S.x + dx * Math.cos(a) - dy * Math.sin(a), y: S.y + dx * Math.sin(a) + dy * Math.cos(a) };
  };
  const DATE = toPlate(CAL, dateCell.x, dateCell.y);

  // chalk arrow: from beside the circled day over to the blank sheet, head pointing down onto it
  const arrowPath = () => {
    const x0 = CAL.x + CAL.w / 2 + 50, y0 = DATE.y + 10, x1 = PAPER.x - PAPER.w / 2 + 170, y1 = PAPER.y - PAPER.h / 2 - 45;
    return `M${x0} ${y0} C${x0 + 120} ${y0 - 70} ${x1 - 40} ${y1 - 150} ${x1} ${y1} M${x1} ${y1} l-58 -26 M${x1} ${y1} l6 -62`;
  };
  // mode "cut" (default since v4): no truck along the wall, no paper. Hard cut straight onto the calendar,
  // the news day dead centre, a push-in while the marker circles it, then a 3D camera move to the right
  // that carries the motion graphics in (engine: hook.handoff). Mode "full" = the original long take.
  const SHORT = (ep.hookBoard ?? cfg.series.hookBoard ?? "cut") !== "full";
  // gag (ep.hookGag): an animated accident clip lands on the news day (the mark replaces the marker circle),
  // the engine holds the close-up while he says his line, then the 3D move
  const GAG = SHORT && ep.hookGag ? { id: ep.hookGag, ...GAGS[ep.hookGag] } : null;
  const clipEnd = GAG ? GAG.frames / GAG.fps : 0;
  const T = GAG
    ? { truck: [-9, 0.1], push: [-9, 0.1], cut: 0, circle: [99, 1], pan: [99, 1], write: [99, 1], dive: [99, 1], clip: clipEnd, out: [clipEnd + GAG.hold, 0.62] }
    : SHORT
    ? { truck: [-9, 0.1], push: [-9, 0.1], cut: 0, circle: [0.3, 0.42], pan: [99, 1], write: [99, 1], dive: [99, 1], out: [1.0, 0.62] }
    : { truck: [0, 1.45], push: [1.3, 0.5], cut: 1.8, circle: [2.12, 0.5], pan: [3.0, 0.72], write: [3.38, 0.62], dive: [3.92, 0.62] };
  T.arrow = SHORT ? [99, 1] : [T.circle[0] + 0.55, 0.36];
  T.end = SHORT ? T.out[0] + T.out[1] : T.dive[0] + T.dive[1];

  // ---- DOM
  const strips = (S) => { let inner = ""; const sh = S.h / S.n; for (let i = S.n - 1; i >= 0; i--) inner = `<div class="strip" style="top:${i ? sh : 0}px;height:${sh + 1}px"><canvas></canvas><i class="strip-sh"></i>${inner}</div>`; return inner; };
  const sheet = (S, cls, extras = "", under = "") => `<div class="sh ${cls}" style="left:${S.x - S.w / 2}px;top:${S.y - S.h / 2}px;width:${S.w}px;height:${S.h}px;transform:rotate(${S.rot}deg)">
      <div class="sh-shadow"></div>${under}<div class="sh-3d">${strips(S)}</div>${extras}</div>`;
  const wires = Array.from({ length: 23 }, (_, k) => `<i class="wire" style="left:${40 + k * ((CAL.w - 80) / 22) - 4}px"></i>`).join("");
  const calExtras = `${wires}<svg class="hanger" viewBox="0 0 200 120" style="left:${CAL.w / 2 - 100}px;top:-112px"><path d="M30 118 L100 20 L170 118"/></svg><i class="mag blue" style="left:${CAL.w / 2 - 34}px;top:-140px;width:68px;height:68px"></i>`;
  const calUnder = `<div class="sh-under u3"></div><div class="sh-under u2"></div><div class="sh-under u1"></div>`;
  const paperExtras = `<i class="mag blue" style="left:26px;top:-22px;width:52px;height:52px"></i><i class="mag green" style="left:${PAPER.w - 78}px;top:-20px;width:52px;height:52px"></i>`;
  const noteExtras = `<i class="gum" style="left:${NOTE.w / 2 - 26}px;top:-14px"></i>`;

  const layer = document.createElement("div");
  layer.className = "bhook";
  layer.innerHTML = `
    <svg width="0" height="0" style="position:absolute">
      <filter id="bh-chalk"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.4 1.7"/><feComposite in="SourceGraphic" operator="in"/></filter>
    </svg>
    <div class="bh-shot"><div class="bh-plate">
      <img src="../assets/plates/wide.jpg" class="plate-img"><img src="../assets/plates/wide.jpg" class="plate-glow">
      ${sheet(STICKY, "sticky")}
      ${sheet(NOTE, "note", noteExtras)}
      ${sheet(CAL, "cal", calExtras, calUnder)}
      ${sheet(PAPER, "paper", paperExtras)}
      ${GAG ? (() => { const [mx, my, ms, mr] = GAG.markRect ?? [-74, -70, 124, -8]; return `<img class="bh-mark" src="../assets/coldopen/v2/hook/${GAG.id}/mark.png" style="left:${DATE.x + mx}px;top:${DATE.y + my}px;width:${ms}px;height:${ms}px;transform:rotate(${CAL.rot + mr}deg)">`; })() : ""}
      <svg class="chalk2-svg bh-arrow" style="left:0;top:0" width="${PLATE.w}" height="${PLATE.h}" viewBox="0 0 ${PLATE.w} ${PLATE.h}">
        <path pathLength="1" d="${arrowPath()}"/>
      </svg>
    </div></div>
    <div class="bh-leaves"></div>
    <div class="bh-haze"></div><div class="bh-leak"></div><div class="bh-vig"></div>
    <div class="bh-white"></div>${GAG ? '<img class="bh-clip">' : ""}`;
  root.appendChild(layer);

  const shot = layer.querySelector(".bh-shot"), plate = shot.firstElementChild;
  const plateImg = layer.querySelector(".plate-img");
  const arrow = layer.querySelector(".bh-arrow path");
  const leak = layer.querySelector(".bh-leak"), vig = layer.querySelector(".bh-vig"), haze = layer.querySelector(".bh-haze"), white = layer.querySelector(".bh-white");
  const leavesEl = layer.querySelector(".bh-leaves");
  const SHEETS = [
    { S: STICKY, el: layer.querySelector(".sh.sticky") }, { S: NOTE, el: layer.querySelector(".sh.note") },
    { S: CAL, el: layer.querySelector(".sh.cal") }, { S: PAPER, el: layer.querySelector(".sh.paper") },
  ];
  SHEETS.forEach((o) => {
    o.strips = [...o.el.querySelectorAll(".strip")];
    o.shades = o.strips.map((s) => s.querySelector(".strip-sh"));
    o.canvases = o.strips.map((s) => s.querySelector("canvas"));
    o.shadow = o.el.querySelector(".sh-shadow");
  });
  const calSheet = SHEETS[2];
  const clipEl = layer.querySelector(".bh-clip");
  const clipSrc = (i) => `../assets/coldopen/v2/hook/${GAG.id}/clip/f${String(i + 1).padStart(4, "0")}.jpg`;

  // ------------------------------------------------------------ paper drawing (after fonts + images)
  const paperImg = new Image(); paperImg.src = "../assets/plates/paper.jpg";
  let noise = null, calBase = null, circleP = -1, paperBaseC = null, writeP = -1;

  function makeNoise() {
    const c = document.createElement("canvas"); c.width = c.height = 384;
    const x = c.getContext("2d"), d = x.createImageData(384, 384), r = rng(77);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    return c;
  }
  function canvasFor(S) { const c = document.createElement("canvas"); c.width = Math.round(S.w * S.res); c.height = Math.round(S.h * S.res); return c; }
  // real paper photo at a constant fibre scale, a different crop per sheet
  function paperBase(x, S, { filter = "saturate(.35) brightness(1.1)", tint = null, k = 1.9, seed = 1 } = {}) {
    const r = rng(seed * 97 + 5);
    const sw = Math.min(paperImg.width * 0.8, S.w * k), sh = Math.min(paperImg.height * 0.8, S.h * k);
    const sx = paperImg.width * 0.1 + r() * (paperImg.width * 0.8 - sw), sy = paperImg.height * 0.1 + r() * (paperImg.height * 0.8 - sh);
    x.save(); x.filter = filter; x.drawImage(paperImg, sx, sy, sw, sh, 0, 0, S.w, S.h); x.restore();
    if (tint) { x.save(); x.globalCompositeOperation = "multiply"; x.fillStyle = tint; x.fillRect(0, 0, S.w, S.h); x.restore(); }
  }
  // finish: fine grain, edge falloff, then the plate's light (sun stripes / shade) multiplied over the sheet
  // light map = only the LOW frequencies of the plate (sun stripes, shade – never the chalk smudges),
  // levelled against the whole board so a lit stripe is equally bright on every sheet
  let lmStats = null;
  function lowres(sx, sy, sw, sh, k) {
    const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(sw / k)); c.height = Math.max(2, Math.round(sh / k));
    const x = c.getContext("2d"); x.filter = "blur(1.2px)"; x.drawImage(plateImg, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c;
  }
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  function boardStats() {
    const c = lowres(1460, 200, 2340, 1580, 16), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, v = [];
    for (let i = 0; i < d.length; i += 4) v.push(lum(d, i));
    v.sort((a, b) => a - b);
    return { lo: v[Math.floor(v.length * 0.04)], hi: v[Math.floor(v.length * 0.97)] };
  }
  function lightMap(S) {
    const lx = S.x - S.w / 2, ly = S.y - S.h / 2, K = 10;
    const c = lowres(lx - 40, ly - 40, S.w + 80, S.h + 80, K), x = c.getContext("2d");
    const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
    const col = document.createElement("canvas"); col.width = c.width; col.height = c.height;
    col.getContext("2d").drawImage(c, 0, 0);
    for (let i = 0; i < d.length; i += 4) {
      let u = clamp((lum(d, i) - lmStats.lo) / (lmStats.hi - lmStats.lo)); u = u * u * (3 - 2 * u);
      const v = 255 * (0.5 + 0.5 * u);
      d[i] = Math.min(255, v * 1.04); d[i + 1] = v; d[i + 2] = v * 0.9; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return { mul: c, col, pad: 40 / K };
  }
  function finish(x, S, lmStrength = 1) {
    x.save();
    x.globalCompositeOperation = "overlay"; x.globalAlpha = 0.16;
    x.fillStyle = x.createPattern(noise, "repeat"); x.fillRect(0, 0, S.w, S.h);
    x.globalCompositeOperation = "multiply"; x.globalAlpha = 1;
    const g = x.createRadialGradient(S.w / 2, S.h / 2, Math.min(S.w, S.h) * 0.35, S.w / 2, S.h / 2, Math.max(S.w, S.h) * 0.75);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(214,206,192,1)");
    x.fillStyle = g; x.fillRect(0, 0, S.w, S.h);
    if (!S.lm) S.lm = lightMap(S);
    const { mul, col, pad } = S.lm;
    x.imageSmoothingQuality = "high";
    x.globalAlpha = lmStrength;
    x.drawImage(mul, pad, pad, mul.width - 2 * pad, mul.height - 2 * pad, 0, 0, S.w, S.h);
    x.globalCompositeOperation = "soft-light"; x.globalAlpha = 0.55; x.filter = "saturate(1.4)";
    x.drawImage(col, pad, pad, col.width - 2 * pad, col.height - 2 * pad, 0, 0, S.w, S.h);
    x.restore();
  }
  // printed ink: multiplied into the paper, slightly soft
  function ink(x, fn) { x.save(); x.globalCompositeOperation = "multiply"; x.filter = "blur(.35px)"; fn(x); x.restore(); }

  function drawCalendarBase() {
    const S = CAL, c = canvasFor(S), x = c.getContext("2d");
    x.scale(S.res, S.res);
    paperBase(x, S, { filter: "saturate(.25) brightness(1.13) contrast(1.05)", seed: 3 });
    ink(x, (x) => {
      // punched holes for the wire-o binding
      x.fillStyle = "#2a2622";
      for (let k = 0; k < 23; k++) { const hx = 40 + k * ((S.w - 80) / 22); x.beginPath(); x.roundRect(hx - 4, 12, 8, 13, 3); x.fill(); }
      x.textBaseline = "alphabetic";
      x.fillStyle = "#1f2024";
      x.font = '800 96px "Inter"'; x.letterSpacing = "-3px";
      x.fillText(MONTHS_NOM[nm], 34, 168);
      x.font = '600 34px "Inter"'; x.letterSpacing = "1px"; x.fillStyle = "#2f6bed";
      x.fillText(String(ny), 38, 214);
      // mini calendars of the previous / next month
      [[nm - 1, 382], [nm + 1, 492]].forEach(([mm, mx]) => {
        const d0 = new Date(Date.UTC(ny, mm, 1)), cy = d0.getUTCFullYear(), cmn = d0.getUTCMonth();
        x.fillStyle = "#1f2024"; x.font = '700 12px "Inter"'; x.letterSpacing = "0px";
        x.fillText(MONTHS_NOM[cmn].toUpperCase(), mx, 104);
        x.font = '500 9px "Inter"'; x.textAlign = "right";
        monthCells(cy, cmn).forEach((d, k) => {
          if (d.getUTCMonth() !== cmn) return;
          x.fillStyle = k % 7 === 6 ? "#c8352a" : "#3a3b40";
          x.fillText(String(d.getUTCDate()), mx + 13 + (k % 7) * 14, 122 + Math.floor(k / 7) * 13);
        });
        x.textAlign = "left";
      });
      // rule + weekday header
      x.fillStyle = "#1f2024"; x.fillRect(34, 236, S.w - 68, 2.4);
      x.font = '700 15px "Inter"'; x.letterSpacing = "2px";
      WD.forEach((w, k) => { x.fillStyle = k >= 5 ? "#c8352a" : "#3a3b40"; x.fillText(w.toUpperCase(), G.x0 + k * G.cw + 9, 272); });
      // grid
      x.strokeStyle = "rgba(40,40,46,.38)"; x.lineWidth = 1.1;
      for (let r = 0; r <= 6; r++) { x.beginPath(); x.moveTo(G.x0, G.y0 + r * G.rh); x.lineTo(G.x1, G.y0 + r * G.rh); x.stroke(); }
      for (let k = 0; k <= 7; k++) { x.beginPath(); x.moveTo(G.x0 + k * G.cw, G.y0); x.lineTo(G.x0 + k * G.cw, G.y1); x.stroke(); }
      cells.forEach((d, k) => {
        const cx = G.x0 + (k % 7) * G.cw, cy = G.y0 + Math.floor(k / 7) * G.rh, inM = d.getUTCMonth() === nm;
        const hol = inM ? HOL[`${nm + 1}-${d.getUTCDate()}`] : null;
        x.letterSpacing = "-0.5px"; x.font = '700 30px "Inter"';
        x.fillStyle = !inM ? "rgba(60,60,66,.22)" : k % 7 === 6 || hol ? "#c8352a" : "#1f2024";
        x.fillText(String(d.getUTCDate()), cx + 8, cy + 33);
        if (hol) {
          x.font = '500 9.5px "Inter"'; x.letterSpacing = "0px"; x.fillStyle = "#c8352a";
          const lines = []; let line = "";
          hol.split(" ").forEach((w) => { if ((line + " " + w).trim().length > 13) { lines.push(line.trim()); line = w; } else line += " " + w; });
          lines.push(line.trim());
          lines.slice(-2).forEach((l, j, a) => x.fillText(l, cx + 8, cy + G.rh - 8 + (j - (a.length - 1)) * 11));
        }
        if (k % 7 === 0) { x.font = '500 10px "Inter"'; x.letterSpacing = "0px"; x.fillStyle = "rgba(60,60,66,.55)"; x.fillText(String(isoWeek(d)), 40, cy + 20); }
      });
    });
    return c;
  }
  // hand-drawn marker loop around the news day (wobbly, ~1.1 turns, a little overshoot)
  const loop = (() => {
    const r = rng(11), pts = [], N = 140, a0 = -2.25;
    const rx = G.cw * 0.6, ry = G.rh * 0.47;
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = a0 + u * Math.PI * 2 * 1.12;
      const wob = 1 + Math.sin(u * 9 + 1.2) * 0.03 + (r() - 0.5) * 0.012 + u * 0.06;
      pts.push([dateCell.x + Math.cos(a) * rx * wob, dateCell.y + 2 + Math.sin(a) * ry * wob]);
    }
    return pts;
  })();
  function drawCalendar(p) {
    const S = CAL, x = calSheet.master.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none";
    x.drawImage(calBase, 0, 0);
    x.scale(S.res, S.res);
    if (p > 0) {
      const n = Math.max(2, Math.round(p * (loop.length - 1)) + 1);
      x.save(); x.globalCompositeOperation = "multiply"; x.lineCap = "round"; x.lineJoin = "round";
      [[6.2, "rgba(206,32,24,.88)", 0], [3, "rgba(150,12,10,.35)", 0.8]].forEach(([lw, col, off]) => {
        x.beginPath(); x.lineWidth = lw; x.strokeStyle = col;
        loop.slice(0, n).forEach(([px, py], i) => (i ? x.lineTo(px + off, py + off) : x.moveTo(px + off, py + off)));
        x.stroke();
      });
      x.restore();
    }
    finish(x, S);
    x.setTransform(1, 0, 0, 1, 0, 0);
    blit(calSheet);
  }
  // the blank sheet: the news date gets hand-written on it (blue marker, revealed left → right) as we arrive
  function drawPaper(p) {
    const S = PAPER, o = SHEETS[3];
    if (!paperBaseC) {
      paperBaseC = canvasFor(S);
      const x = paperBaseC.getContext("2d"); x.scale(S.res, S.res);
      paperBase(x, S, { filter: "saturate(.2) brightness(1.15)", seed: 7, k: 1.7 });
      o.master = canvasFor(S);
    }
    const x = o.master.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.filter = "none";
    x.drawImage(paperBaseC, 0, 0);
    x.scale(S.res, S.res);
    const lines = [
      { txt: `aktualita #${String(ep.number ?? 1).padStart(2, "0")}`, font: '700 40px "Caveat"', x: 52, y: 86, col: "rgba(60,62,72,.8)", a: 0, b: 0.25 },
      { txt: `novinka ze ${news.getUTCDate()}. ${MONTHS_GEN[nm]}`, font: '700 92px "Caveat"', x: 46, y: 196, col: "rgba(36,84,206,.92)", a: 0.22, b: 0.85 },
    ];
    ink(x, (x) => {
      lines.forEach((l) => {
        const u = clamp((p - l.a) / (l.b - l.a));
        if (u <= 0) return;
        x.font = l.font; const w = x.measureText(l.txt).width;
        x.save(); x.translate(l.x, l.y); x.rotate(-0.025);
        x.beginPath(); x.rect(-10, -110, (w + 20) * u, 160); x.clip();
        x.fillStyle = l.col; x.fillText(l.txt, 0, 0);
        x.restore();
      });
      const u = clamp((p - 0.82) / 0.18);
      if (u > 0) {
        x.strokeStyle = "rgba(36,84,206,.75)"; x.lineWidth = 4; x.lineCap = "round";
        x.beginPath(); x.moveTo(50, 222); x.bezierCurveTo(200, 214, 380, 220, 50 + 560 * u, 210); x.stroke();
      }
    });
    finish(x, S);
    x.setTransform(1, 0, 0, 1, 0, 0);
    blit(o);
  }
  function drawSticky() {
    const S = STICKY, c = canvasFor(S), x = c.getContext("2d");
    x.scale(S.res, S.res);
    paperBase(x, S, { filter: "saturate(0) brightness(1.2)", tint: "#f6dc63", seed: 2, k: 1.2 });
    ink(x, (x) => {
      x.fillStyle = "rgba(30,30,36,.85)"; x.font = '700 40px "Caveat"';
      x.save(); x.translate(26, 92); x.rotate(-0.05); x.fillText("každé pondělí", 0, 0); x.fillText("→ novinky", 12, 50); x.restore();
      x.strokeStyle = "rgba(30,30,36,.8)"; x.lineWidth = 3.4; x.lineCap = "round"; x.lineJoin = "round";
      x.beginPath(); x.moveTo(176, 168); x.lineTo(190, 186); x.lineTo(222, 142); x.stroke();
    });
    finish(x, S);
    return c;
  }
  function drawNote() {
    const S = NOTE, c = canvasFor(S), x = c.getContext("2d");
    x.scale(S.res, S.res);
    paperBase(x, S, { filter: "saturate(.15) brightness(1.12)", seed: 5, k: 1.4 });
    ink(x, (x) => {
      x.strokeStyle = "rgba(90,140,210,.45)"; x.lineWidth = 1;
      for (let y = 58; y < S.h; y += 26) { x.beginPath(); x.moveTo(0, y); x.lineTo(S.w, y); x.stroke(); }
      x.strokeStyle = "rgba(210,70,70,.5)"; x.beginPath(); x.moveTo(30, 0); x.lineTo(30, S.h); x.stroke();
      x.fillStyle = "rgba(30,30,40,.82)"; x.font = '700 30px "Caveat"';
      ["nápady:", "– carousel", "– reels", "– AI"].forEach((l, i) => x.fillText(l, 38, 52 + i * 26));
    });
    finish(x, S);
    return c;
  }
  // master → strip canvases
  function blit(o) {
    const S = o.S, sh = S.h / S.n;
    o.canvases.forEach((cv, i) => {
      const x = cv.getContext("2d");
      x.clearRect(0, 0, cv.width, cv.height);
      x.drawImage(o.master, 0, Math.round(i * sh * S.res), cv.width, cv.height, 0, 0, cv.width, cv.height);
    });
  }

  // ---- out-of-focus foreground leaves (sprites pre-blurred once) + parallax against the camera
  const LEAVES = [
    { tc: 0.45, xc: 760, yc: 330, size: 640, blur: 59, k: 2.3, vx: 360, vy: 120, col: "#d9772b", rot: 40 },
    { tc: 0.95, xc: 1560, yc: 860, size: 448, blur: 43, k: 1.9, vx: 300, vy: 80, col: "#e2a23a", rot: -70 },
    { tc: 1.6, xc: 300, yc: 180, size: 416, blur: 40, k: 1.8, vx: 260, vy: 140, col: "#b9521e", rot: 90 },
    { tc: 2.35, xc: 1730, yc: 210, size: 512, blur: 51, k: 2.0, vx: 210, vy: 90, col: "#de8a2e", rot: -50 },
    { tc: 2.85, xc: 200, yc: 900, size: 416, blur: 40, k: 1.8, vx: 230, vy: 60, col: "#e2a23a", rot: 70 },
    { tc: 3.45, xc: 1250, yc: 150, size: 576, blur: 54, k: 2.3, vx: 300, vy: 130, col: "#d06a26", rot: 60 },
    { tc: 4.0, xc: 520, yc: 920, size: 448, blur: 45, k: 2.0, vx: 280, vy: 80, col: "#e09a35", rot: -80 },
  ];
  function leafSprite(L, i) {
    const pad = L.blur * 2.2, c = document.createElement("canvas");
    c.width = c.height = Math.ceil(L.size + pad * 2);
    const x = c.getContext("2d"), r = rng(31 + i * 7);
    x.filter = `blur(${L.blur}px)`;
    x.translate(c.width / 2, c.height / 2);
    const s = L.size / 2;
    // ovate leaf with a jagged edge and a midrib (only its silhouette survives the defocus)
    x.beginPath();
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 2;
      const rr = s * (0.55 + 0.45 * Math.abs(Math.cos(a / 2))) * (1 + (k % 2 ? 0.06 : -0.03) * (0.6 + r()));
      const px = Math.sin(a) * rr * 0.62, py = -Math.cos(a) * rr;
      k ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath();
    const g = x.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, "#f6c46a"); g.addColorStop(0.5, L.col); g.addColorStop(1, "#7a3412");
    x.fillStyle = g; x.fill();
    x.strokeStyle = "rgba(90,40,10,.6)"; x.lineWidth = s * 0.05; x.beginPath(); x.moveTo(0, -s * 0.95); x.lineTo(0, s * 1.15); x.stroke();
    c.style.width = c.style.height = `${c.width}px`;
    c.style.margin = `${-c.width / 2}px 0 0 ${-c.width / 2}px`;
    return c;
  }
  let leafEls = [];

  async function prepare() {
    await Promise.all([paperImg.decode().catch(() => {}), plateImg.decode().catch(() => {})]);
    // the gag clip plays frame by frame from JPEGs: decode them all up front (deterministic render)
    if (GAG) await Promise.all(Array.from({ length: GAG.frames }, (_, i) => { const im = new Image(); im.src = clipSrc(i); return im.decode().catch(() => {}); }));
    await Promise.all(['800 96px "Inter"', '600 34px "Inter"', '700 30px "Inter"', '500 10px "Inter"', '700 40px "Caveat"'].map((f) => document.fonts.load(f, "aktualita #0123456789 každé pondělí → novinky nápady – ČSR " + MONTHS_NOM.join(" ") + MONTHS_GEN.join(" ") + Object.values(HOL).join(" "))));
    noise = makeNoise();
    lmStats = boardStats();
    SHEETS.forEach((o) => o.canvases.forEach((cv) => { cv.width = Math.round(o.S.w * o.S.res); cv.height = Math.round((o.S.h / o.S.n + 1) * o.S.res); }));
    calBase = drawCalendarBase();
    calSheet.master = canvasFor(CAL);
    drawCalendar(0); circleP = 0;
    SHEETS[0].master = drawSticky(); SHEETS[1].master = drawNote(); drawPaper(0); writeP = 0;
    [SHEETS[0], SHEETS[1]].forEach(blit);
    // short hook: the date must read – only the leaf that crosses the left edge during the 3D move stays
    leafEls = LEAVES.map((L, i) => { if (GAG || (SHORT && i !== 2)) return null; const c = leafSprite(L, i); leavesEl.appendChild(c); return c; });
  }

  // ------------------------------------------------------------ camera
  const shake = (t, a = 1) => ({
    x: a * (Math.sin(t * 1.31) * 4 + Math.sin(t * 2.97 + 1.3) * 2 + Math.sin(t * 6.1 + 0.4) * 0.6),
    y: a * (Math.sin(t * 1.07 + 2.1) * 3.2 + Math.sin(t * 3.41 + 0.7) * 1.6 + Math.sin(t * 5.3) * 0.6),
    r: a * (Math.sin(t * 0.83 + 0.5) * 0.12 + Math.sin(t * 2.3) * 0.04),
  });
  const clampCam = (cx, cy, s) => {
    const m = 1.03;
    s = Math.max(s, (m * W) / PLATE.w, (m * H) / PLATE.h);
    const hw = (W / (2 * s)) * m, hh = (H / (2 * s)) * m;
    return { cx: clamp(cx, hw, PLATE.w - hw), cy: clamp(cy, hh, PLATE.h - hh), s };
  };
  // close-up framing: month name + the news day both in shot
  const closeC = (() => { const sy = Math.max((150 + dateCell.y) / 2, dateCell.y - 190); const p = toPlate(CAL, lerp(CAL.w / 2, dateCell.x, 0.4), sy); return { x: p.x, y: p.y }; })();
  function camAt(t) {
    if (GAG) {
      // hold on the marked day (the clip's last frame is rendered from exactly this framing), slow creep
      const z = clamp((t - clipEnd) / (GAG.hold + 0.62));
      return { cx: DATE.x, cy: DATE.y, s: lerp(2.25, 2.85, ease.inOutSine(z)), rot: 0 };
    }
    if (SHORT) {
      // push-in on the circled day, kept exactly in the middle of the frame (AE-style camera push: fast
      // start, long ease-out), still creeping while the 3D move takes us right
      const z = brandOut(prog(t, 0, 1.5));
      return { cx: DATE.x, cy: DATE.y, s: lerp(1.6, 2.35, z) + t * 0.03, rot: lerp(-0.5, 0, z) };
    }
    // 1) truck left → right along the wall (pure translation = a real dolly past a flat wall), slight push
    const a = truck(prog(t, ...T.truck));
    let cx = lerp(1150, 2380, a), cy = lerp(1190, 1050, a), s = lerp(0.9, 1.0, a), rot = 0;
    // 2) accelerating push towards the calendar
    const q = ease.inQuad(prog(t, ...T.push));
    cx = lerp(cx, CAL.x + 20, q); cy = lerp(cy, CAL.y - 10, q); s = lerp(s, 1.32, q);
    if (t >= T.cut) {
      // 3) jump cut a step closer, settle, slow creep
      const b = brandOut(prog(t, T.cut, 0.9));
      cx = lerp(closeC.x + 70, closeC.x, b); cy = lerp(closeC.y + 50, closeC.y, b);
      s = lerp(1.98, 1.84, b) + (t - T.cut) * 0.02; rot = lerp(-0.8, 0, b);
      // 4) pan to the blank sheet (slight pull-out mid-pan, like an operator) + push into it until it fills the frame
      const p = brandInOut(prog(t, ...T.pan));
      cx = lerp(cx, PAPER.x - 30, p); cy = lerp(cy, PAPER.y + 25, p);
      s = lerp(s, 1.5, Math.sin(Math.PI * Math.min(1, p * 1.1)) * 0.6 + p * 0.4);
      const d = ease.inCubic(prog(t, ...T.dive)), dd = brandOut(prog(t, ...T.dive));
      s = lerp(s, (W / PAPER.w) * 2.1, d); cx = lerp(cx, PAPER.x + 20, dd); cy = lerp(cy, PAPER.y + 50, dd);
    }
    return { cx, cy, s, rot };
  }
  const screenOff = (t) => { const c = camAt(t), k = clampCam(c.cx, c.cy, c.s); return { x: W / 2 - k.cx * k.s, y: H / 2 - k.cy * k.s }; };
  const leafRef = LEAVES.map((L) => screenOff(L.tc));

  // ------------------------------------------------------------ wind
  const wind = (t) => 0.3 + 0.7 * bump(t, 2.05, 1.6) + 0.6 * bump(t, 3.35, 1.2) + 0.25 * bump(t, 0.6, 1.2);
  function flutter(o, t) {
    const S = o.S, tl = t - (S.x / PLATE.w) * 0.35; // the gust travels from the window side
    const A = S.amp * wind(tl) * (0.75 + 0.25 * Math.sin(tl * 2.1 + S.seed));
    let prev = 0;
    o.strips.forEach((st, i) => {
      const u = (i + 1) / S.n;
      let th = A * Math.pow(u, S.pow) * (1 + 0.38 * Math.sin(2 * Math.PI * (1.25 * u - S.f * tl) + S.seed));
      th += A * 0.12 * u * Math.sin(tl * S.f * 9.3 + i * 0.8 + S.seed);
      if (S.glue && u <= S.glue + 1e-6) th = 0;
      th = Math.max(0, th);
      st.style.transform = `rotateX(${(th - prev).toFixed(3)}deg)`;
      o.shades[i].style.opacity = String(clamp(th * 0.008));
      prev = th;
    });
    o.shadow.style.transform = `translate(${12 + prev * 0.9}px, ${18 + prev * 1.4}px)`;
    o.shadow.style.opacity = String(0.55 - prev * 0.006);
  }

  function update(t) {
    const on = t < T.end + 0.05;
    layer.style.display = on ? "block" : "none";
    if (!on) return;
    if (clipEl) {
      const inClip = t < clipEnd;
      clipEl.style.display = inClip ? "block" : "none";
      if (inClip) { const src = clipSrc(Math.min(GAG.frames - 1, Math.floor(t * GAG.fps))); if (clipEl.dataset.src !== src) { clipEl.src = src; clipEl.dataset.src = src; } }
      // the clip's splash settles into the engine's mark: last 0.25 s cross-fade onto the real calendar
      clipEl.style.opacity = String(1 - ease.inOutSine(prog(t, clipEnd - 0.25, 0.25)));
    }
    const c = camAt(t);
    const sh = shake(t, GAG ? 0.5 : t < T.cut ? 0.3 : 0.75);
    const k = clampCam(c.cx + sh.x / c.s, c.cy + sh.y / c.s, c.s);
    plate.style.transform = `translate(${W / 2 - k.cx * k.s}px, ${H / 2 - k.cy * k.s}px) scale(${k.s})`;
    shot.style.transform = `rotate(${c.rot + sh.r}deg)`;

    SHEETS.forEach((o) => flutter(o, t));
    const p = brandInOut(prog(t, ...T.circle));
    if (calBase && Math.abs(p - circleP) > 1e-4) { drawCalendar(p); circleP = p; }
    const wp = prog(t, ...T.write);
    if (paperBaseC && Math.abs(wp - writeP) > 1e-4) { drawPaper(wp); writeP = wp; }
    arrow.style.strokeDashoffset = String(1 - brandInOut(prog(t, ...T.arrow)));

    // leaves: own drift + tumble, parallax with the camera (closer to the lens = faster)
    const off = { x: W / 2 - k.cx * k.s, y: H / 2 - k.cy * k.s };
    LEAVES.forEach((L, i) => {
      const e = leafEls[i];
      if (!e) return;
      const dt = t - L.tc;
      const x = L.xc + L.vx * dt + Math.sin(t * 1.7 + i) * 30 + (off.x - leafRef[i].x) * L.k;
      const y = L.yc + L.vy * dt + Math.sin(t * 2.3 + i * 2) * 26 + (off.y - leafRef[i].y) * L.k;
      const m = L.size * 1.5, vis = x > -m && x < W + m && y > -m && y < H + m;
      e.style.display = vis ? "block" : "none";
      if (!vis) return;
      const flip = Math.cos(t * 2.6 + i * 1.9);
      e.style.transform = `translate(${x}px, ${y}px) rotate(${L.rot + t * 55 * (i % 2 ? 1 : -1)}deg) scale(${0.35 + 0.65 * Math.abs(flip)}, 1)`;
    });

    // grade: as we dive into the sheet the room falls away – haze/vignette ease off, frame goes paper-white
    const into = brandInOut(prog(t, T.dive[0] + 0.15, T.dive[1] - 0.1));
    leak.style.opacity = String((0.5 + Math.sin(t * 1.7) * 0.12) * (1 - into * 0.8));
    vig.style.opacity = String(1 - into * 0.85);
    haze.style.opacity = String(1 - into * 0.6);
    if (SHORT) { white.style.opacity = "0"; layer.style.opacity = "1"; return; }
    white.style.opacity = String(ease.inQuad(prog(t, T.end - 0.3, 0.3)) * 0.75);
    layer.style.opacity = String(1 - ease.inQuad(prog(t, T.end - 0.16, 0.2)));
  }

  // Sound design (layered like a film mix – see docs/sfx-design.md):
  //  BEDS   = the room: far city + wind through the open window, a low drone that glues it (felt, not heard)
  //  SPOTS  = what we SEE moving: blinds by the window, leaves (rustle + close fly-bys synced to the bokeh
  //           leaves), paper in the gusts, marker, camera moves
  //  MOTIF  = a wall clock ticks once we are close on the calendar (time / date)
  //  HANDOFF= reverse swell sucks into the sheet, sub hit + shimmer as the graphics land; beds fade with it
  // EQ = distance (far things lose lows+highs), pan = where it is in frame (window on the left).
  const B = T.end, leafAt = (k) => LEAVES[k].tc - 0.4; // fly-by sample peaks 0.4 s in
  const sfx = [
    // beds
    { name: "amb_city", at: 0, gain: -17.2, dur: B + 0.35, fi: 0.3, fo: 0.8, hp: 160, lp: 5200, pan: -0.25 },
    { name: "wind_bed", at: 0, gain: -5.1, dur: B + 0.3, fi: 0.25, fo: 0.7, hp: 120, pan: -0.15 },
    { name: "cine_drone", at: 0, gain: -20.7, dur: B + 0.5, fi: 0.8, fo: 0.9, lp: 1800 },
    // window side – the shot starts at the window
    { name: "blinds_rattle", at: 0.05, gain: -14.7, dur: 1.9, fi: 0.08, fo: 0.8, hp: 400, pan: -0.6 },
    { name: "blinds_rattle", at: T.cut + 0.15, gain: -21, dur: 1.4, fi: 0.2, fo: 0.6, hp: 600, lp: 4000, pan: -0.75 },
    // leaves: rustle on the gusts + close fly-bys of the big out-of-focus leaves
    { name: "leaves_rustle", at: 0.1, gain: -13.8, dur: 2.2, fi: 0.3, fo: 0.8, hp: 250, pan: -0.2 },
    { name: "leaves_rustle", at: 1.85, gain: -6.4, dur: 1.6, fi: 0.3, fo: 0.6, hp: 300, pan: 0.25 },
    { name: "leaf_passby", at: leafAt(0), gain: -12.3, dur: 1.2, fo: 0.4, pan: -0.25, hp: 120 },
    { name: "leaf_passby", at: leafAt(3), gain: -15.3, dur: 1.2, fo: 0.4, pan: 0.7, hp: 120 },
    { name: "leaf_passby", at: leafAt(5), gain: -13.3, dur: 1.2, fo: 0.4, pan: 0.25, hp: 120 },
    // camera + paper + marker
    { name: "camera_glide", at: 0.0, gain: -10, hp: 45 },
    { name: "wind_gust", at: 1.75, gain: 9.7, pan: -0.2, hp: 100 }, { name: "wind_gust", at: 3.05, gain: 7.7, pan: -0.1, hp: 100 },
    { name: "transition_swish", at: T.push[0] + 0.05, gain: -12.6, hp: 80 }, { name: "hook_impact", at: T.cut, gain: -14.7 },
    { name: "paper_breeze", at: 1.85, gain: 13.7, hp: 150 },
    { name: "marker_scratch", at: T.circle[0] - 0.02, gain: 2.8 },
    { name: "camera_whip", at: T.pan[0] - 0.05, gain: -13.9, hp: 60 }, { name: "paper_breeze", at: T.pan[0] + 0.1, gain: 11.7, pan: 0.3, hp: 150 },
    { name: "marker_scratch", at: T.write[0] + 0.1, gain: 0.8, pan: 0.15 },
    // time motif
    { name: "clock_tick", at: T.cut, gain: -12.2, dur: T.dive[0] - T.cut + 0.3, fi: 0.1, fo: 0.35, hp: 500, lp: 7000, pan: 0.35 },
    // hand-off into the graphics
    { name: "dive_swell", at: B - 1.72, gain: -10.6, dur: 1.85, fo: 0.08 },
    { name: "hook_dive", at: T.dive[0] + 0.05, gain: -10.3 },
    { name: "hook_impact", at: B - 0.02, gain: -9.7, lp: 180 },
    { name: "reveal_shimmer", at: B - 0.25, gain: -11.6 },
  ];
  if (GAG) {
    const O = T.out[0], L = T.out[1];
    const sfxG = [
      ...GAG.sfx.map((e) => ({ ...e })),
      // voiceSs skips the start of the take (e.g. only the question part of the line), keeping the rest in place
      ...(GAG.voice ? [{ name: GAG.voice, at: (GAG.lineAt ?? clipEnd - 0.55) + (GAG.voiceSs ?? 0), ss: GAG.voiceSs ?? 0, gain: GAG.voiceGain ?? -3, dur: GAG.line + 0.3 - (GAG.voiceSs ?? 0), fi: GAG.voiceSs ? 0.03 : 0, fo: 0.1 }] : []),
      { name: "amb_city", at: clipEnd - 0.1, gain: -19, dur: O + L - clipEnd + 0.3, fi: 0.1, fo: 0.4, hp: 160, lp: 5200, pan: -0.25 },
      { name: "clock_tick", at: clipEnd + 0.05, gain: -14, dur: GAG.hold, fi: 0.05, fo: 0.2, hp: 500, lp: 7000, pan: 0.35 },
      { name: "d_tension", at: clipEnd, gain: -16, dur: GAG.hold + L, fi: 0.3, fo: 0.2, hp: 40 },
      { name: "d_riser", at: O - 0.55, gain: -9, dur: 0.75, ss: 0.15, fi: 0.05, fo: 0.05 },
      { name: "d_whoosh_pan", at: O + L * 0.5 - 0.52, gain: -5, dur: 0.8, fo: 0.2 },
      { name: "hook_impact", at: O + L - 0.04, gain: -11, lp: 180 },
      { name: "reveal_shimmer", at: O + L - 0.2, gain: -13 },
    ];
    return { update, prepare, busGain: 1.5, duration: O + 0.3, end: T.end, handoff: T.out, cuts: GAG.cuts ?? [], postCut: GAG.postCut ?? null,
      cues: { impact: clipEnd, whoosh: O, ticks: [], riser: [0, clipEnd] }, sfx: sfxG };
  }
  if (SHORT) {
    // short hook: room + marker on the push-in, then the 3D move right (designed whoosh peaking mid-move,
    // a reverse swell into it, a soft sub as the graphics land) – the cold open already set up the room
    const O = T.out[0], L = T.out[1];
    const sfxS = [
      { name: "amb_city", at: 0, gain: -17.2, dur: O + L + 0.3, fi: 0.05, fo: 0.4, hp: 160, lp: 5200, pan: -0.25 },
      { name: "wind_bed", at: 0, gain: -6, dur: O + L + 0.2, fi: 0.05, fo: 0.4, hp: 120, pan: -0.15 },
      { name: "hook_impact", at: 0, gain: -13, lp: 260 },
      { name: "clock_tick", at: 0.02, gain: -13, dur: O + 0.2, fi: 0.02, fo: 0.2, hp: 500, lp: 7000, pan: 0.35 },
      { name: "paper_breeze", at: 0.05, gain: 9, hp: 150 },
      { name: "marker_scratch", at: T.circle[0] - 0.02, gain: 2.8 },
      { name: "d_riser", at: O - 0.55, gain: -9, dur: 0.75, ss: 0.15, fi: 0.05, fo: 0.05 },
      { name: "d_whoosh_pan", at: O + L * 0.5 - 0.52, gain: -5, dur: 0.8, fo: 0.2 },
      { name: "hook_impact", at: O + L - 0.04, gain: -11, lp: 180 },
      { name: "reveal_shimmer", at: O + L - 0.2, gain: -13 },
    ];
    // engine: graphics start (voice, first scene) a beat into the move; the move itself is drawn by the engine
    return { update, prepare, busGain: 1.5, duration: O + 0.3, end: T.end, handoff: T.out,
      cues: { impact: T.circle[0], whoosh: O, ticks: [], riser: [0, T.circle[0]] }, sfx: sfxS };
  }
  return { update, prepare, busGain: 1.5, duration: T.end, cues: { impact: T.circle[0], whoosh: T.dive[0], ticks: [], riser: [0, T.circle[0]] }, sfx };
}
