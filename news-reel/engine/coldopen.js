// Cold opens v3 – short character pre-scenes BEFORE the board hook.
//
// A FLAT 2D drawing (character sheet in assets/coldopen) lives inside the user's REAL photographed rooms
// (assets/coldopen/env → 4K plates in v2/<scene>/). Nothing in the room is drawn: he sits on the real chair,
// lies on the real bed, leans on the real bricks; real furniture in front of him hides him (occluders).
// Each pose was composed into the photo by gpt_image_2_5, cut out and registered back onto the clean plate
// (scripts/coldopen-register.py), so every pose lands on the same furniture.
//
// Look (user feedback v2 → v3):
//   • no paper cut-out: no white rim, the silhouette NEVER changes (no swapping of redrawn variants);
//   • "redrawn again and again": only the ballpoint lines are re-traced – an ink layer (darkest strokes)
//     wobbles on its own every 3rd frame, the colours shimmer a little, both clipped to the fixed silhouette;
//   • he is a sheet of paper standing in 3D space: turned a little away from the lens and slightly folded,
//     so you can see he is flat;
//   • inserts and close-ups sit on the real room texture (4K plate), never on a smeared colour;
//   • leaves only drift through now and then, small and far; dust in the light;
//   • calm leaps; the scene ends on a plain camera pan to the right (the hook follows in the film).
// Cutting: no cut between two similar framings – pose changes and the "Počkej" freeze happen INSIDE a shot.
import { clamp, lerp, prog, ease, snapOut } from "./ease.js";

const A = "../assets/coldopen/";
const V = A + "v2/";
const MONTHS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const DAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
const DAYS_CAP = DAYS.map((d) => d[0].toUpperCase() + d.slice(1));

// ---------------------------------------------------------------- scenes
// T.v(x) = x s into the voice line (voice/timing.json); the line starts at vOff.
// shots[]: { at, kind: room|insert|cu|leap, poses: [[tRel, pose]…], keys: [[tRel, zoom, focus]…], crash }
//   focus = "body" | "head" | [x, y] (plate 0..1) | { of, dx, dy };  crash = { at, z, f } snap zoom
// paper: { yaw, fold } – how the sheet stands in the room (deg).  shadow: cast shadow offset (px).
// occ: plate polygons (0..1) of real objects IN FRONT of him.  leaves: drift-throughs { t, dur, y0, y1, s, dir }.
export const COLD_OPENS = {
  newspaper: {
    vOff: 0.45, room: "room_bedroom", window: true, shadow: [26, -2], leak: "left", paper: { yaw: -17, fold: 9 },
    leaves: [{ t: 0.3, dur: 2.2, y0: 0.18, y1: 0.42, s: 120, dir: 1 }, { t: 2.0, dur: 2.0, y0: 0.62, y1: 0.8, s: 90, dir: 1 }],
    shots: (T) => [
      { at: 0, kind: "room", poses: [[0, "k1"], [0.85, "k1b"], [1.35, "k1"], [1.75, "k1a"], [2.35, "k1"], [T.v(1.05), "k2"], [T.v(1.05) + 0.5, "k2a"], [T.wait, "k3"]],
        keys: [[0, 1.04, "body"], [T.v(1.05), 1.32, { of: "head", dy: 0.24 }], [T.wait, 1.62, { of: "head", dy: 0.16 }]],
        crash: { at: T.wait + 0.05, z: 2.05, f: { of: "head", dy: 0.07 } } },
      { at: T.v(3.0), kind: "insert", insert: "news" },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", poses: [[0, "k4"]], keys: [[0, 1.22, [0.6, 0.45]]], jump: "up" },
    ],
    foley: (T) => [
      { name: "newspaper_rustle", at: 0.05, rel: -11, dur: 1.4, fo: 0.4 },
      { name: "villager_hmm", at: 0.4, rel: -7, dur: 0.9, fo: 0.25 },
      { name: "page_turn", at: T.v(1.02), rel: -6 },
      { name: "newspaper_rustle", at: T.v(1.1), rel: -14, dur: 1.0, fo: 0.3 },
      { name: "villager_hmm", at: T.v(1.6), rel: -7, dur: 0.75, fo: 0.2 },
      { name: "gulp", at: T.wait + 0.42, rel: -9 },
      { name: "newspaper_rustle", at: T.v(3.0), rel: -16, dur: 0.6, fo: 0.2 },
      { name: "transition_swish", at: T.v(3.0) + 0.38, rel: -13 },
      { name: "paper_flurry", at: T.leap, rel: -8 },
      { name: "chair_clatter", at: T.leap + 0.2, rel: -9 },
    ],
  },
  laptop: {
    vOff: 0.55, room: "room_office", window: false, shadow: [16, -2], leak: "left", paper: { yaw: -8, fold: 6 },
    // he works on the MacBook from the far side of the desk: the real lid and desk are in front of him
    occ: [
      [[0.352, 0.452], [0.474, 0.449], [0.479, 0.462], [0.491, 0.592], [0.539, 0.592], [0.536, 0.603], [0.366, 0.603]],
      [[0.30, 0.583], [0.75, 0.597], [0.749, 0.648], [0.30, 0.647]],
      [[0.596, 0.64], [0.614, 0.64], [0.614, 1.0], [0.596, 1.0]],
      [[0.722, 0.64], [0.746, 0.64], [0.746, 1.0], [0.722, 1.0]],
    ],
    leaves: [{ t: 0.2, dur: 2.3, y0: 0.25, y1: 0.4, s: 110, dir: 1 }],
    shots: (T) => [
      { at: 0, kind: "room", poses: [{ cycle: ["k1", "k1", "k1a", "k1"], from: 0, to: 99, hold: 0.25 }], keys: [[0, 1.08, [0.45, 0.42]], [T.v(0.5), 1.18, [0.44, 0.4]]] },
      { at: T.v(0.5), kind: "insert", insert: "screen" },
      { at: T.v(2.22), kind: "room", poses: [[0, "k2"], [T.wait - T.v(2.22), "k3"]],
        keys: [[0, 1.85, { of: "head", dy: 0.1 }], [T.wait - T.v(2.22), 1.92, { of: "head", dy: 0.1 }]],
        crash: { at: T.wait - T.v(2.22) + 0.05, z: 2.3, f: { of: "head", dy: 0.05 } } },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", poses: [[0, "k4"]], keys: [[0, 1.22, [0.48, 0.38]]], jump: "up" },
    ],
    foley: (T) => [
      { name: "laptop_fan", at: 0, rel: -19, dur: T.leap + 0.3, fi: 0.3, fo: 0.3, hp: 120 },
      { name: "keyboard_typing", at: 0.05, rel: -9, dur: T.v(0.5) - 0.05, fo: 0.08 },
      { name: "trackpad_click", at: T.v(0.9), rel: -10, dur: 1.2, fo: 0.2 },
      { name: "keyboard_typing", at: T.v(1.4), rel: -14, dur: 0.6, fo: 0.15 },
      { name: "villager_hmm", at: T.v(2.25), rel: -7, dur: 0.5, fo: 0.2 },
      { name: "gulp", at: T.wait + 0.4, rel: -9 },
      { name: "chair_creak", at: T.leap, rel: -9 },
    ],
  },
  nap: {
    vOff: 2.3, room: "room_bedroom", window: false, shadow: [18, -4], leak: "left", paper: { yaw: 14, fold: 6 },
    head: { k1: [0.822, 0.462], k2: [0.822, 0.462] }, // the Zzz above him would bias the auto head point
    leaves: [{ t: 0.15, dur: 2.4, y0: 0.2, y1: 0.36, s: 100, dir: 1 }],
    shots: (T) => [
      { at: 0, kind: "room", poses: [{ cycle: ["k1", "k1", "k1a", "k1a"], from: 0, to: 1.18, hold: 0.3 }, [1.18, "k2"]],
        keys: [[0, 1.03, "body"], [0.5, 1.03, "body"], [1.7, 1.75, { of: "head", dx: -0.06, dy: 0.08 }]] },
      { at: 1.72, kind: "insert", insert: "lockscreen" },
      { at: T.v(0.28), kind: "room", poses: [[0, "k3"]],
        keys: [[0, 1.42, { of: "head", dy: 0.17 }]], crash: { at: T.wait - T.v(0.28) + 0.04, z: 1.85, f: { of: "head", dy: 0.09 } } },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", poses: [[0, "k4"]], keys: [[0, 1.2, [0.45, 0.42]]], jump: "dive" },
    ],
    foley: (T) => [
      { name: "snore", at: 0.0, rel: -4, dur: T.v(0.28), fo: 0.12 },
      { name: "phone_buzz", at: 1.5, rel: -6 },
      { name: "phone_buzz", at: 2.05, rel: -9, hp: 200 },
      { name: "sheet_rustle", at: T.v(0.26), rel: -8 },
      { name: "gulp", at: T.v(1.12), rel: -9 },
      { name: "sheet_rustle", at: T.leap - 0.04, rel: -8 },
    ],
  },
  phone: {
    vOff: 0.45, room: "room_office", window: false, shadow: [-26, -2], leak: "right", paper: { yaw: 16, fold: 7 },
    leaves: [{ t: 0.25, dur: 2.2, y0: 0.2, y1: 0.34, s: 110, dir: -1 }],
    shots: (T) => [
      { at: 0, kind: "room", poses: [[0, "k1"], { cycle: ["k1", "k1a"], from: 0.3, to: 0.95, hold: 0.17 }, [0.95, "k1b"], [1.45, "k1"]], keys: [[0, 1.04, "body"], [T.v(0.7), 1.12, "body"]] },
      { at: T.v(0.7), kind: "insert", insert: "feed" },
      { at: T.v(1.9), kind: "room", poses: [[0, "k2"], [T.wait - 0.04 - T.v(1.9), "k3"]],
        keys: [[0, 1.55, { of: "head", dy: 0.2 }], [T.wait - T.v(1.9), 1.62, { of: "head", dy: 0.2 }]],
        crash: { at: T.wait - T.v(1.9) + 0.02, z: 1.95, f: { of: "head", dy: 0.1 } } },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", poses: [[0, "k4"]], keys: [[0, 1.18, [0.5, 0.5]]], jump: "run" },
    ],
    foley: (T) => [
      { name: "phone_scroll", at: 0.1, rel: -9, dur: T.v(1.9) - 0.1, fo: 0.2 },
      { name: "villager_hmm", at: T.v(1.25), rel: -7, dur: 0.55, fo: 0.2 },
      { name: "yawn", at: T.v(2.0), rel: -6, dur: 0.95, fo: 0.25 },
      { name: "gulp", at: T.wait + 0.45, rel: -9 },
      { name: "run_away", at: T.leap + 0.04, rel: -8 },
    ],
  },
  notebook: {
    vOff: 0.45, room: "room_office", window: true, shadow: [-24, -2], leak: "right", paper: { yaw: 12, fold: 7 },
    leaves: [{ t: 0.2, dur: 2.4, y0: 0.15, y1: 0.3, s: 110, dir: -1 }, { t: 3.4, dur: 2.0, y0: 0.55, y1: 0.7, s: 85, dir: -1 }],
    shots: (T) => [
      { at: 0, kind: "room", poses: [{ cycle: ["k1", "k1a", "k1", "k1b"], from: 0, to: 99, hold: 0.125 }], keys: [[0, 1.05, "body"], [T.v(1.0), 1.13, "body"]] },
      { at: T.v(1.0), kind: "insert", insert: "notebook" },
      { at: T.v(2.6), kind: "room", poses: [[0, "k2"], [T.wait - T.v(2.6), "k3"]],
        keys: [[0, 1.62, { of: "head", dy: 0.16 }], [T.wait - T.v(2.6), 1.7, { of: "head", dy: 0.15 }]],
        crash: { at: T.wait - T.v(2.6) + 0.05, z: 2.05, f: { of: "head", dy: 0.07 } } },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", poses: [[0, "k4"]], keys: [[0, 1.22, [0.45, 0.35]]], jump: "up" },
    ],
    foley: (T) => [
      { name: "pencil_write", at: 0.05, rel: -10, dur: T.v(2.6) - 0.05, fo: 0.12 },
      { name: "villager_hmm", at: T.v(2.65), rel: -7, dur: 1.4, fo: 0.3 },
      { name: "pen_drop", at: T.wait + 0.05, rel: -8 },
      { name: "gulp", at: T.v(4.62), rel: -9 },
      { name: "chair_creak", at: T.leap, rel: -9 },
      { name: "paper_flurry", at: T.leap + 0.04, rel: -12, dur: 1.2, fo: 0.4 },
    ],
  },
};

export function buildColdOpen(root, id, tim, ep, manifest) {
  const W = window.__W ?? 1920, H = window.__H ?? 1080;
  const D = COLD_OPENS[id];
  if (!D) throw new Error(`unknown cold open ${id}`);
  const M = manifest[id];
  const Hw = W * M.plate[1] / M.plate[0]; // world height at zoom 1 (plate aspect)
  const T = { vOff: D.vOff, v: (x) => D.vOff + x };
  T.wait = T.v(tim.wait); T.date = T.v(tim.date); T.vEnd = T.v(tim.dur);
  T.leap = T.vEnd + 0.06; T.pan = T.leap + 0.55; T.end = T.pan + 0.5;
  const talk = tim.talk.map(([a, b]) => [T.v(a), T.v(b)]);
  const env = tim.env ?? [];
  const shots = D.shots(T).map((s, i, all) => ({ ...s, to: i + 1 < all.length ? all[i + 1].at : T.end }));
  const pose = (name) => M.poses[name];
  const today = ep?.today ? new Date(ep.today) : new Date();
  const poly = (pts) => `polygon(${pts.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(", ")})`;

  // ---------------------------------------------------------------- DOM
  const layer = document.createElement("div");
  layer.className = "cold c2";
  layer.innerHTML = `
    <svg width="0" height="0" style="position:absolute">
      <filter id="c2-wob" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="1" seed="1"/><feDisplacementMap in="SourceGraphic" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/><feComposite in="d" in2="SourceAlpha" operator="in"/></filter>
      <filter id="c2-pen" x="-1%" y="-1%" width="102%" height="102%"><feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="3.4" xChannelSelector="G" yChannelSelector="R"/></filter>
    </svg>
    <div class="c2-shot c2-room"><div class="c2-world" style="height:${Hw}px">
      <img class="c2-plate" src="${V}${id}/plate.jpg">
      <img class="c2-shadow">
      <div class="c2-paper">${["l", "r"].map((h) => `<div class="c2-half c2-${h}"><img class="c2-fill"><img class="c2-ink"></div>`).join("")}</div>
      ${(D.occ ?? []).map((p) => `<div class="c2-occ" style="background-image:url(${V}${id}/plate.jpg);clip-path:${poly(p)};-webkit-clip-path:${poly(p)}"></div>`).join("")}
    </div><div class="c2-dust"></div><div class="c2-leaves"></div></div>
    <div class="c2-shot c2-ins"><div class="c2-bg"></div><div class="c2-ins-in"></div></div>
    <div class="c2-shot c2-cu"><div class="c2-bg"></div>
      <div class="c2-face"><div class="c2-paper c2-fpaper">${["l", "r"].map((h) => `<div class="c2-half c2-${h}"><img class="c2-fill"><img class="c2-ink"></div>`).join("")}</div></div></div>
    <div class="bh-haze"></div><div class="bh-leak c2-leak ${D.leak === "right" ? "c2-leak-r" : ""}"></div><div class="bh-vig"></div>
    <div class="c2-flash"></div>`;
  root.appendChild(layer);
  const $ = (s, el = layer) => el.querySelector(s);
  const room = $(".c2-room"), world = $(".c2-world"), paper = $(".c2-room .c2-paper"), shadowEl = $(".c2-shadow");
  const ins = $(".c2-ins"), insIn = $(".c2-ins-in"), insBg = $(".c2-ins .c2-bg"), cu = $(".c2-cu"), cuBg = $(".c2-cu .c2-bg"), face = $(".c2-face"), fpaper = $(".c2-fpaper");
  const flash = $(".c2-flash"), leak = $(".c2-leak");
  const turb = [...layer.querySelectorAll("feTurbulence")];
  const rig = (el) => ({ halves: [...el.querySelectorAll(".c2-half")], fills: [...el.querySelectorAll(".c2-fill")], inks: [...el.querySelectorAll(".c2-ink")], cur: null });
  const R = rig(paper), F = rig(fpaper);
  // one drawing on a folded sheet: left / right half hinge on the vertical fold through the figure
  const setSheet = (r, base, foldX, footY) => {
    if (r.cur === base) return;
    r.cur = base;
    r.fills.forEach((e) => (e.src = `${base}.webp`));
    r.inks.forEach((e) => (e.src = `${base}_ink.webp`));
    const fx = (foldX * 100).toFixed(2);
    r.halves[0].style.clipPath = r.halves[0].style.webkitClipPath = `inset(0 ${(100 - foldX * 100).toFixed(2)}% 0 0)`;
    r.halves[1].style.clipPath = r.halves[1].style.webkitClipPath = `inset(0 0 0 ${fx}%)`;
    r.halves.forEach((h) => (h.style.transformOrigin = `${fx}% ${(footY * 100).toFixed(2)}%`));
  };
  // each half carries its own full perspective transform around the SAME hinge (no shared 3D context –
  // Chromium drops one half of a preserve-3d pair); yaw ± fold → a sheet turned away and bent on the fold
  const bend = (r, el, yaw, fold) => {
    r.halves[0].style.transform = `perspective(2400px) rotateY(${(yaw + fold).toFixed(2)}deg)`;
    r.halves[1].style.transform = `perspective(2400px) rotateY(${(yaw - fold).toFixed(2)}deg)`;
  };

  // drifting leaves (pre-blurred once, small, far) + dust motes in the sun
  const leavesEl = $(".c2-leaves"), dustEl = $(".c2-dust");
  const leafEls = (D.leaves ?? []).map((L, i) => { const c = leafSprite(L, i); leavesEl.appendChild(c); return c; });
  const DUST = Array.from({ length: 40 }, (_, i) => ({ x: hash(i * 3 + 1) * W, y: hash(i * 7 + 2) * H, r: 1.5 + hash(i * 11 + 5) * 4.5, sp: 5 + hash(i * 13) * 12, ph: hash(i * 17) * 6.28, k: 0.2 + hash(i * 19) * 0.4 }));
  dustEl.innerHTML = DUST.map((d) => `<i style="width:${(d.r * 2).toFixed(1)}px;height:${(d.r * 2).toFixed(1)}px;filter:blur(${(d.r * 0.4).toFixed(1)}px)"></i>`).join("");
  const dustEls = [...dustEl.children];

  // ---------------------------------------------------------------- inserts + close-up background (real room texture)
  const roomBg = (el, f, z, blur, bright = 0.9) => {
    // the 4K plate cropped around f at zoom z – the room stays recognisable (bricks, light stripes, objects)
    el.style.backgroundImage = `url(${V}${id}/plate4k.jpg)`;
    el.style.backgroundSize = `${(W * z).toFixed(0)}px auto`;
    const bx = clamp(W / 2 - f[0] * W * z, W - W * z, 0), by = clamp(H / 2 - f[1] * Hw * z, H - Hw * z, 0);
    el.style.backgroundPosition = `${bx.toFixed(0)}px ${by.toFixed(0)}px`;
    el.style.filter = `blur(${blur}px) brightness(${bright})`;
  };
  const insShot = shots.find((s) => s.kind === "insert");
  const insUpdate = buildInsert(insIn, insBg, roomBg, D, insShot, today, W, H);

  // ---------------------------------------------------------------- camera
  const focusOf = (f, p) => {
    const P = pose(p) ?? pose("k1");
    const head = D.head?.[p] ?? P.head;
    const body = [(P.bbox[0] + P.bbox[2]) / 2, (P.bbox[1] + P.bbox[3]) / 2];
    if (Array.isArray(f)) return f;
    if (f === "body") return body;
    if (f === "head") return head;
    const b = f.of === "head" ? head : body;
    return [b[0] + (f.dx ?? 0), b[1] + (f.dy ?? 0)];
  };
  const place = (z, f) => {
    const Ww = W * z, Wh = Hw * z;
    return { s: z, ox: clamp(W / 2 - f[0] * Ww, W - Ww, 0), oy: clamp(H / 2 - f[1] * Wh, H - Wh, 0) };
  };
  // poses: [t, name] keys, or { cycle: [names], from, to, hold } – an in-between loop drawn on twos/fours
  const has = (n) => !!M.poses[n];
  const poseAt = (sh, lt) => {
    let p = Array.isArray(sh.poses[0]) ? sh.poses[0][1] : sh.poses[0].cycle[0];
    for (const k of sh.poses) {
      if (Array.isArray(k)) { if (lt >= k[0]) p = k[1]; }
      else if (lt >= k.from && lt < k.to) p = k.cycle[Math.floor((lt - k.from) / k.hold) % k.cycle.length];
    }
    return has(p) ? p : p.replace(/[ab]$/, "");
  };
  const camAt = (sh, lt, p) => {
    const ks = sh.keys;
    let a = ks[0], b = ks[0];
    for (let i = 0; i < ks.length; i++) { if (lt >= ks[i][0]) { a = ks[i]; b = ks[i + 1] ?? ks[i]; } }
    const k = b === a ? 0 : ease.inOutSine(clamp((lt - a[0]) / Math.max(0.01, b[0] - a[0])));
    const pa = place(a[1], focusOf(a[2], p)), pb = place(b[1], focusOf(b[2], p));
    let c = { s: lerp(pa.s, pb.s, k), ox: lerp(pa.ox, pb.ox, k), oy: lerp(pa.oy, pb.oy, k) };
    if (sh.crash && lt >= sh.crash.at) {
      const z = snapOut(prog(lt, sh.crash.at, 0.17)), q = place(sh.crash.z, focusOf(sh.crash.f, p));
      c = { s: lerp(c.s, q.s, z), ox: lerp(c.ox, q.ox, z), oy: lerp(c.oy, q.oy, z) };
    }
    return c;
  };
  const shake = (t, a) => ({ x: a * (Math.sin(t * 1.31) * 3.4 + Math.sin(t * 2.97 + 1.3) * 1.6 + Math.sin(t * 6.1 + 0.4) * 0.5), y: a * (Math.cos(t * 1.13) * 2.6 + Math.sin(t * 2.41 + 0.6) * 1.3 + Math.cos(t * 5.3) * 0.5) });
  const isTalking = (t) => talk.some(([a, b]) => t >= a && t <= b);

  function update(t) {
    const on = t < T.end + 0.001;
    layer.style.display = on ? "block" : "none";
    if (!on) return;
    const sh = shots.find((s) => t >= s.at && t < s.to) ?? shots[shots.length - 1];
    const lt = t - sh.at;
    // the pen re-traces on threes (every 3rd frame at 30 fps); colours shimmer with it
    const tick = Math.floor(t * 10);
    turb.forEach((f, i) => f.setAttribute("seed", String(((tick * (i * 2 + 3)) % 29) + 1)));
    const isRoom = sh.kind === "room" || sh.kind === "leap";
    room.style.display = isRoom ? "block" : "none";
    ins.style.display = sh.kind === "insert" ? "block" : "none";
    cu.style.display = sh.kind === "cu" ? "block" : "none";
    let flashA = 0;

    if (isRoom) {
      const p = poseAt(sh, lt);
      const P = pose(p);
      const foldX = (P.bbox[0] + P.bbox[2]) / 2, footY = P.bbox[3];
      setSheet(R, `${V}${id}/${p}`, foldX, footY);
      shadowEl.src = `${V}${id}/${p}.webp`;
      let { s, ox, oy } = camAt(sh, lt, p);
      if (sh.crash && lt >= sh.crash.at && lt < sh.crash.at + 0.067) flashA = 0.35;
      const hand = shake(t, s > 1.3 ? 1.0 : 0.55);
      ox += hand.x; oy += hand.y;
      // the sheet in the room: turned away from the lens and folded – he is visibly flat
      let yaw = D.paper.yaw + Math.sin(t * 0.9) * 1.2, fold = D.paper.fold + Math.sin(t * 1.4 + 1) * 0.8;
      let cx = 0, cy = 0;
      if (sh.kind === "leap") {
        // calm: a small hop (or a few steps out), the sheet flutters a little
        if (sh.jump === "run") cx = ease.inQuad(prog(lt, 0.08, 0.75)) * 620;
        else if (sh.jump === "dive") { cx = -ease.inQuad(prog(lt, 0.06, 0.7)) * 420; cy = -Math.sin(clamp(lt / 0.7) * Math.PI) * 26; }
        else cy = -snapOut(prog(lt, 0, 0.16)) * 34 + ease.inOutSine(prog(lt, 0.16, 0.5)) * 10;
        yaw += Math.sin(clamp(lt / 0.3) * Math.PI) * 22;
        // the scene ends on a plain camera pan to the right (the hook follows in the film)
        const pz = ease.inQuad(prog(t, T.pan, T.end - T.pan));
        ox = Math.max(W - W * s, ox - pz * 420);
      }
      world.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.toFixed(5)})`;
      // never static: breathing and a little weight shift, stepped on twos (12 fps) like drawn animation
      const tq = Math.floor(t * 12) / 12;
      const breath = 1 + Math.sin(tq * 2 * Math.PI * 0.28) * 0.007;
      const sway = Math.sin(tq * 1.3 + 0.7) * 0.35 + Math.sin(tq * 0.47) * 0.25;
      const shiftX = Math.sin(tq * 0.61 + 2) * 3;
      paper.style.transformOrigin = `${(foldX * 100).toFixed(2)}% ${(footY * 100).toFixed(2)}%`;
      paper.style.translate = `${(cx + shiftX).toFixed(1)}px ${cy.toFixed(1)}px`;
      paper.style.rotate = `${sway.toFixed(3)}deg`;
      paper.style.scale = `1 ${breath.toFixed(4)}`;
      bend(R, paper, yaw, fold);
      const [sx, sy] = D.shadow;
      shadowEl.style.transform = `translate(${(sx + cx * 0.9).toFixed(1)}px, ${(sy + cy * 0.4).toFixed(1)}px)`;
      shadowEl.style.opacity = sh.kind === "leap" ? "0.12" : "0.26";
      // depth: a leaf now and then drifts through, dust floats in the light
      const camDx = ox, camDy = oy;
      leafEls.forEach((e, i) => {
        const L = D.leaves[i], u = (t - L.t) / L.dur;
        if (u < 0 || u > 1) { e.style.opacity = "0"; return; }
        const x = L.dir > 0 ? lerp(-160, W + 160, u) : lerp(W + 160, -160, u);
        const y = lerp(L.y0, L.y1, u) * H + Math.sin(u * 9 + i) * 26 + camDy * 0.04;
        e.style.opacity = String(Math.min(1, u * 8, (1 - u) * 8) * 0.85);
        e.style.transform = `translate(${(x + camDx * 0.05).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(u * 300 * L.dir + i * 40).toFixed(1)}deg) scaleX(${Math.cos(u * 11 + i).toFixed(3)})`;
      });
      dustEls.forEach((e, i) => {
        const d = DUST[i];
        const x = ((d.x + Math.sin(t * 0.4 + d.ph) * 40 + t * d.sp + ox * d.k * 0.1) % (W + 40) + W + 40) % (W + 40) - 20;
        const y = ((d.y - t * d.sp * 0.5 + Math.cos(t * 0.5 + d.ph) * 30 + oy * d.k * 0.1) % (H + 40) + H + 40) % (H + 40) - 20;
        e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        e.style.opacity = String(0.18 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.ph)));
      });
    }

    if (sh.kind === "insert") insUpdate(t, lt, sh.to - sh.at);
    if (sh.kind === "cu") {
      // close-up: his face over the real room behind him (the 4K plate, lightly defocused); lips from the voice
      // lips follow the real voice: amplitude envelope of the line (24 values/s), held on twos
      const fi = Math.floor(Math.floor((t - T.vOff) * 12) * 2);
      const e = fi >= 0 && fi < env.length ? Math.max(env[fi], env[fi + 1] ?? 0) : 0;
      const m = e > 0.5 ? "open" : e > 0.16 ? "half" : "closed";
      setSheet(F, `${V}face/${m}`, 0.62, 0.98);
      const fp = shots.find((s) => s.kind === "room" && s.crash) ?? shots[0];
      const hp = focusOf("head", fp.poses[fp.poses.length - 1][1]);
      roomBg(cuBg, [hp[0] - 0.02, hp[1] + 0.03], 2.3, 7, 0.82);
      const punch = snapOut(prog(lt, 0, 0.16)) * 0.04 + snapOut(prog(t, talk[talk.length - 1][0] + 0.45, 0.12)) * 0.04;
      const hs = shake(t * 1.6, 1.1);
      face.style.transform = `translate(${hs.x.toFixed(1)}px, ${hs.y.toFixed(1)}px) scale(${(1 + lt * 0.022 + punch).toFixed(4)})`;
      cuBg.style.transform = `scale(${(1.04 + lt * 0.015).toFixed(4)}) translate(${(-hs.x * 0.35).toFixed(1)}px, 0)`;
      bend(F, fpaper, 8 + Math.sin(t * 1.1) * 1.2, 5);
      if (lt < 0.067) flashA = 0.25;
    }
    flash.style.opacity = String(flashA);
    leak.style.opacity = String(0.4 + Math.sin(t * 1.7) * 0.08);
  }

  // ---------------------------------------------------------------- sound (relative to the cold open start)
  const voiceName = "../../coldopen/voice/" + id;
  const sfx = [
    { name: voiceName, at: T.vOff, gain: 0, dur: tim.dur + 0.25, fo: 0.08 },
    { name: D.room, at: 0, rel: -17, dur: T.end + 0.3, fi: 0.25, fo: 0.35, hp: 90 },
    { name: "amb_city", at: 0, rel: -24, dur: T.end + 0.3, fi: 0.4, fo: 0.4, hp: 160, lp: 4200, pan: D.leak === "right" ? 0.35 : -0.35 },
    ...(D.window ? [{ name: "wind_bed", at: 0, rel: -21, dur: T.end + 0.3, fi: 0.4, fo: 0.4, hp: 180, lp: 6000, pan: D.leak === "right" ? 0.3 : -0.3 }] : []),
    { name: "record_scratch", at: T.wait - 0.06, rel: -6, dur: 0.85, fo: 0.25 },
    { name: "hook_impact", at: T.date - 0.04, rel: -11, lp: 220 },
    { name: "camera_glide", at: T.pan - 0.15, rel: -10, dur: 0.9, fo: 0.3 },
    ...D.foley(T),
  ];
  const poses = Object.keys(M.poses);
  const images = [`${V}${id}/plate.jpg`, `${V}${id}/plate4k.jpg`, ...poses.flatMap((n) => [`${V}${id}/${n}.webp`, `${V}${id}/${n}_ink.webp`]),
    ...["open", "half", "closed"].flatMap((m) => [`${V}face/${m}.webp`, `${V}face/${m}_ink.webp`]), ...(id === "notebook" ? [`${V}insert/notebook_page.webp`, `${V}insert/notebook_hand.webp`] : [])];
  async function prepare() {
    await Promise.all(images.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    await Promise.all(['900 120px "Inter"', '700 60px "Caveat"'].map((f) => document.fonts.load(f, "DENNÍ ZPRÁVY AI MĚNÍ SVĚT " + DAYS.join(" ") + MONTHS_GEN.join(" ") + " 0123456789")));
  }
  return { update, prepare, duration: T.end, sfx, T, fps: 24, shutter: 1.0, masterRef: { name: voiceName } };
}

// ---------------------------------------------------------------- inserts (what he is looking at) – on real room texture
function buildInsert(el, bg, roomBg, D, shot, today, W, H) {
  if (!shot) return () => {};
  const kind = shot.insert;
  if (kind === "news") {
    // his newspaper, 8 days old, held up in front of the brick wall. A FAST zoom onto the date; the page
    // racks out of focus around it so the date reads.
    const old = new Date(+today - 8 * 86400000);
    const dateTxt = `${DAYS_CAP[old.getUTCDay()]} ${old.getUTCDate()}. ${MONTHS_GEN[old.getUTCMonth()]} ${old.getUTCFullYear()}`;
    const page = (cls) => `<div class="c2-npaper ${cls}">
      <div class="c2-mast">DENNÍ ZPRÁVY</div>
      <div class="c2-dline"><span class="c2-dl">Ročník XII · č. 236</span><span class="c2-date">${dateTxt}</span><span class="c2-dl">Cena 25 Kč</span></div>
      <div class="c2-head">AI MĚNÍ SVĚT</div><div class="c2-sub">Umělá inteligence píše, kreslí i programuje. Co nás čeká příští týden?</div>
      <div class="c2-body"><div class="c2-photo"></div><div class="c2-cols">${"<p></p>".repeat(44)}</div></div></div>`;
    el.innerHTML = `<div class="c2-news">${page("c2-p-soft")}${page("c2-p-sharp")}</div><div class="c2-focusvig"></div>`;
    roomBg(bg, [0.74, 0.36], 1.9, 3.5, 0.86);
    const news = el.querySelector(".c2-news"), soft = el.querySelector(".c2-p-soft"), sharp = el.querySelector(".c2-p-sharp"), vig = el.querySelector(".c2-focusvig");
    let dx = 1010, dy = 228, measured = false;
    return (t, lt) => {
      if (!measured) {
        const d = sharp.querySelector(".c2-date");
        dx = d.offsetLeft + d.offsetWidth / 2; dy = d.offsetTop + d.offsetHeight / 2; measured = true;
        const m = `radial-gradient(ellipse ${Math.round(d.offsetWidth * 0.62)}px 62px at ${dx}px ${dy}px, #000 60%, transparent 100%)`;
        sharp.style.maskImage = sharp.style.webkitMaskImage = m;
      }
      const z = snapOut(prog(lt, 0.42, 0.2));
      const s = lerp(0.74, 2.9, z);
      const fx = lerp(800, dx, z), fy = lerp(500, dy, z);
      news.style.transform = `translate(${(960 - fx * s + Math.sin(t * 1.4) * 4).toFixed(1)}px, ${(560 - fy * s + Math.cos(t * 1.1) * 3).toFixed(1)}px) scale(${s.toFixed(4)}) perspective(1600px) rotateY(${lerp(-9, -3, z).toFixed(2)}deg) rotateX(${lerp(5, 2, z).toFixed(2)}deg) rotate(${lerp(-2.5, -0.6, z).toFixed(3)}deg)`;
      soft.style.filter = `blur(${(z * 6).toFixed(2)}px)`;
      sharp.style.opacity = String(z);
      vig.style.opacity = String(z * 0.6);
      bg.style.filter = `blur(${(3.5 + z * 6).toFixed(1)}px) brightness(.86)`;
    };
  }
  if (kind === "notebook") {
    // the drawn notebook on the real desk: his hand with the pencil REALLY scribbles – every new line is
    // drawn exactly under the pencil tip (page and hand are separate layers, image space 2688×1520)
    const TIP = [1750, 756], strokes = [];
    let tt = 0.12;
    for (let k = 0; k < 11; k++) {
      const y = 690 + k * 17 + (k % 2 ? 8 : 0), left = k % 2 === 0;
      strokes.push({ x0: left ? 1835 : 1585, y0: y, x1: left ? 1585 : 1835, y1: y + (left ? 12 : -8), t0: tt, t1: tt + 0.13, w: 9 + (k % 3) * 2 });
      tt += 0.13 + 0.025;
    }
    el.innerHTML = `<div class="c2-nb"><img src="${V}insert/notebook_page.webp"><svg viewBox="0 0 2688 1520">${strokes.map((s) => `<path d="M${s.x0} ${s.y0} Q${(s.x0 + s.x1) / 2} ${(s.y0 + s.y1) / 2 + 9} ${s.x1} ${s.y1}" stroke-width="${s.w}" pathLength="1"/>`).join("")}</svg><img class="c2-nbhand" src="${V}insert/notebook_hand.webp"></div>`;
    roomBg(bg, [0.48, 0.6], 2.8, 1.6, 0.9);
    const paths = [...el.querySelectorAll("path")], box = el.querySelector(".c2-nb"), hand = el.querySelector(".c2-nbhand");
    hand.style.transformOrigin = `${((TIP[0] / 2688) * 100).toFixed(2)}% ${((TIP[1] / 1520) * 100).toFixed(2)}%`;
    const tipAt = (lt) => {
      for (let k = 0; k < strokes.length; k++) {
        const s = strokes[k];
        if (lt < s.t0) {
          const p = strokes[k - 1]; if (!p) return [s.x0, s.y0, 0];
          const u = (lt - p.t1) / (s.t0 - p.t1);           // pen lifted between strokes
          return [lerp(p.x1, s.x0, u), lerp(p.y1, s.y0, u) - Math.sin(u * Math.PI) * 14, 1];
        }
        if (lt <= s.t1) { const u = ease.inOutSine((lt - s.t0) / (s.t1 - s.t0)); return [lerp(s.x0, s.x1, u), lerp(s.y0, s.y1, u) + Math.sin(u * Math.PI) * 9, 0]; }
      }
      const l = strokes[strokes.length - 1]; return [l.x1, l.y1, 1];
    };
    return (t, lt) => {
      paths.forEach((p, k) => (p.style.strokeDashoffset = String(1 - clamp((lt - strokes[k].t0) / (strokes[k].t1 - strokes[k].t0)))));
      const [x, y, up] = tipAt(lt);
      const wob = Math.sin(lt * 31) * 1.6 + up * -2.5;
      hand.style.transform = `translate(${((x - TIP[0]) * (1920 / 2688)).toFixed(1)}px, ${((y - TIP[1]) * (1920 / 2688) - up * 6).toFixed(1)}px) rotate(${wob.toFixed(2)}deg)`;
      box.style.transform = `scale(${(1.14 + lt * 0.015).toFixed(4)}) rotate(${(-2 + Math.sin(t * 0.8) * 0.4).toFixed(2)}deg)`;
    };
  }
  if (kind === "screen") {
    // the MacBook screen (whole display + bezel visible), the room behind it; two old articles, readable
    const pages = [
      ["novinky-ai.cz", "ChatGPT umí zase něco nového?", "Před 3 týdny · 4 min čtení", "nap"],
      ["techweb.cz", "10 AI nástrojů, které musíte znát", "Před měsícem · 7 min čtení", "notebook"],
    ];
    el.innerHTML = `<div class="c2-mac"><div class="co-scr c2-scr"><div class="co-scr-in"><div class="co-scr-bar"><i></i><i></i><i></i><span class="co-url"></span></div>
      <div class="co-pages">${pages.map((p) => `<div class="co-page"><div class="co-ph" style="background:url(${V}${p[3]}/plate.jpg) 50% 45% / cover"></div><h3>${p[1]}</h3><p class="co-meta">${p[2]}</p><p class="co-l"></p><p class="co-l"></p><p class="co-l s"></p></div>`).join("")}</div>
      <div class="co-cursor"></div></div></div><div class="c2-hinge"></div></div>`;
    roomBg(bg, [0.45, 0.4], 2.0, 5, 0.8);
    const pg = [...el.querySelectorAll(".co-page")], url = el.querySelector(".co-url"), cursor = el.querySelector(".co-cursor"), mac = el.querySelector(".c2-mac");
    return (t, lt, len) => {
      const per = len / pages.length, k = Math.min(pages.length - 1, Math.floor(lt / per));
      pg.forEach((p, i) => { p.style.display = i === k ? "block" : "none"; p.style.transform = `translateY(${(-(lt - k * per) * 120).toFixed(1)}px)`; });
      url.textContent = pages[k][0];
      cursor.style.transform = `translate(${(760 + Math.sin(lt * 1.6) * 200).toFixed(1)}px, ${(380 + Math.cos(lt * 1.2) * 120).toFixed(1)}px)`;
      mac.style.transform = `scale(${(0.8 + lt * 0.012).toFixed(4)}) perspective(2000px) rotateY(${(-10 + lt * 1.2).toFixed(2)}deg)`;
    };
  }
  if (kind === "feed") {
    // the whole phone (frame, island, rounded body) in his hand's place, the brick wall behind
    const posts = ["Před 3 týdny", "Před měsícem", "Před 2 týdny", "Před 5 týdny", "Před 4 týdny", "Před 6 týdny", "Před 3 týdny", "Před 2 měsíci"];
    const C1 = ["#2f6bed", "#4ea51f", "#c8352a", "#e2a23a"];
    const PH = ["laptop", "nap", "notebook", "newspaper"];
    el.innerHTML = `<div class="c2-phw"><div class="co-phone c2-phone"><div class="co-feed">${posts.map((p, k) => `<div class="co-post"><div class="co-av" style="background:${C1[k % 4]}"></div><b>@ai_novinky</b><span>${p}</span><div class="co-img" style="background:url(${V}${PH[k % 4]}/plate.jpg) ${(k * 23) % 100}% 50% / cover"></div></div>`).join("")}</div><div class="co-island"></div></div></div>`;
    roomBg(bg, [0.57, 0.42], 2.0, 4, 0.84);
    const feed = el.querySelector(".co-feed"), wrap = el.querySelector(".c2-phw");
    return (t, lt) => {
      const flick = lt * 150 + Math.floor(lt / 0.6) * 260 + snapOut(clamp((lt % 0.6) / 0.42)) * 260;
      feed.style.transform = `translateY(${(-flick).toFixed(1)}px)`;
      wrap.style.transform = `translate(${(Math.sin(t * 1.2) * 6).toFixed(1)}px, ${(Math.cos(t * 0.9) * 5).toFixed(1)}px) scale(${(0.84 + lt * 0.015).toFixed(4)}) perspective(1600px) rotateY(${(-12 + Math.sin(lt * 1.3) * 2).toFixed(2)}deg) rotateX(6deg) rotate(-4deg)`;
    };
  }
  if (kind === "lockscreen") {
    // the phone lying on the real blanket next to him lights up: today's date + "nová aktualita"
    el.innerHTML = `<div class="c2-lock"><div class="co-phone c2-phone"><div class="c2-ls">
      <div class="c2-ls-date">${DAYS_CAP[today.getUTCDay()]} ${today.getUTCDate()}. ${MONTHS_GEN[today.getUTCMonth()]}</div><div class="c2-ls-time">16:42</div>
      <div class="c2-ls-note"><b>EFEKTIVE AKTUALITY</b><span>Nová AI aktualita je venku! 🔥</span><em>teď</em></div></div><div class="co-island"></div></div></div>`;
    roomBg(bg, [0.55, 0.72], 2.6, 1.4, 0.82);
    const wrap = el.querySelector(".c2-lock"), ls = el.querySelector(".c2-ls"), note = el.querySelector(".c2-ls-note");
    return (t, lt) => {
      ls.style.opacity = String(snapOut(prog(lt, 0.12, 0.14)));
      note.style.transform = `translateY(${((1 - snapOut(prog(lt, 0.2, 0.2))) * -60).toFixed(1)}px)`;
      note.style.opacity = String(snapOut(prog(lt, 0.2, 0.15)));
      const buzz = (lt > 0.12 && lt < 0.5) || (lt > 0.62 && lt < 0.85) ? 1 : 0;
      wrap.style.transform = `translate(${(buzz * Math.sin(lt * 190) * 6).toFixed(1)}px, ${(buzz * Math.cos(lt * 170) * 3).toFixed(1)}px) perspective(1700px) rotateX(38deg) rotateZ(${(-14 + buzz * Math.sin(lt * 150) * 1).toFixed(2)}deg) scale(${(0.78 + lt * 0.03).toFixed(4)})`;
      bg.style.filter = `blur(1.4px) brightness(${(0.8 + snapOut(prog(lt, 0.12, 0.14)) * 0.08).toFixed(3)})`;
    };
  }
  return () => {};
}

function mulberry(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }

// a small leaf drifting through, a little out of focus (pre-blurred once on a canvas)
function leafSprite(L, i) {
  const blur = Math.round(L.s * 0.07), pad = blur * 2.5, c = document.createElement("canvas");
  c.width = c.height = Math.ceil(L.s + pad * 2);
  const x = c.getContext("2d"), r = mulberry(91 + i * 13);
  x.filter = `blur(${blur}px)`;
  x.translate(c.width / 2, c.height / 2);
  const s = L.s / 2;
  x.beginPath();
  for (let k = 0; k <= 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    const rr = s * (0.55 + 0.45 * Math.abs(Math.cos(a / 2))) * (1 + (k % 2 ? 0.05 : -0.03) * (0.6 + r()));
    const px = Math.sin(a) * rr * 0.6, py = -Math.cos(a) * rr;
    k ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
  const g = x.createLinearGradient(-s, -s, s, s);
  const col = ["#d9772b", "#c99a3a", "#b9521e"][i % 3];
  g.addColorStop(0, "#f2c46a"); g.addColorStop(0.5, col); g.addColorStop(1, "#5a2a10");
  x.fillStyle = g; x.fill();
  c.style.width = c.style.height = `${c.width}px`;
  c.style.margin = `${-c.width / 2}px 0 0 ${-c.width / 2}px`;
  c.style.opacity = "0";
  return c;
}
