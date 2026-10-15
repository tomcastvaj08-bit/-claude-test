// Cold opens v2 – short character pre-scenes BEFORE the board hook.
//
// A FLAT 2D drawing (character sheet in assets/coldopen) lives inside the user's REAL photographed rooms
// (assets/coldopen/env → 4K plates in v2/<scene>/plate.jpg). Nothing in the room is drawn: he sits on the
// real chair, lies on the real bed, leans on the real bricks. Each drawing was composed into the photo by
// gpt_image_2_5 (so scale, perspective and contact are right), cut out, and registered back onto the clean
// plate (scripts/coldopen-register.py) – so every pose lands on the same furniture.
//
// Animation = limited 2D animation that is "redrawn again and again":
//   • every held pose exists 3× (master + 2 hand-redrawn variants, coldopen-redraw-reg.py), cycled at 8 fps
//     in a never-repeating order → real line boil, not a filter;
//   • on top a light SVG displacement boil (12 fps) and short RGB glitch jolts;
//   • he is paper-thin: cast shadow on the room, paper flip on the leap.
// Camera = 2.5D: the plate and the drawing move as one (he never slides off the chair); out-of-focus
// foreground leaves and dust in the sun beams parallax in front of them. Shot at 30 fps / 1/40 s.
//
// Cutting (≥ 5 shots per scene): wide → medium / insert (what he is doing) → "Počkej…" freeze + record
// scratch + crash zoom → close-up face (lip-sync) "co je dneska za datum?!" → wide leap → whip pan → hook.
import { clamp, lerp, prog, ease, brandInOut, snapOut } from "./ease.js";

const A = "../assets/coldopen/";
const V = A + "v2/";
const MONTHS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const DAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];
const DAYS_CAP = DAYS.map((d) => d[0].toUpperCase() + d.slice(1));

// ---------------------------------------------------------------- scenes
// Times: T.v(x) = x seconds into the voice line (voice/timing.json); the voice starts at vOff.
// shots[]: { at, kind: wide|med|insert|cu|leap, pose | poses:[[t,pose]…], cam: [z0, f0, z1, f1] }
//   z = zoom (1 = whole plate), f = focus "body" | "head" | [x, y] (plate-normalised) | {of, dx, dy}
// leaves[]: out-of-focus foreground leaves in SCREEN px; k = parallax vs. the camera.
// shadow: where his paper-thin cast shadow falls (px at zoom 1), from the room's key light.
export const COLD_OPENS = {
  newspaper: {
    vOff: 0.55, room: "room_bedroom", window: true, shadow: [30, -4], leak: "left",
    leaves: [{ x: 120, y: 860, s: 700, b: 60, k: 1.9, c: "#3f6b2a" }, { x: 1810, y: 120, s: 380, b: 42, k: 1.5, c: "#5a8a34" }],
    shots: (T) => [
      { at: 0, kind: "wide", pose: "k1", cam: [1.04, "body", 1.12, "body"] },
      { at: T.v(1.0), kind: "med", pose: "k2", cam: [1.95, { of: "head", dy: 0.1 }, 2.08, { of: "head", dy: 0.1 }] },
      { at: T.wait, kind: "freeze", pose: "k3", cam: [1.6, { of: "head", dy: 0.16 }, 2.15, { of: "head", dy: 0.06 }] },
      { at: T.v(3.02), kind: "insert", insert: "news" },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", pose: "k4", cam: [1.12, "body", 1.16, "body"], jump: "up" },
    ],
    foley: (T) => [
      { name: "newspaper_rustle", at: 0.05, gain: -13, dur: 1.4, fo: 0.4 },
      { name: "villager_hmm", at: 0.45, gain: -15, dur: 0.9, fo: 0.25 },
      { name: "page_turn", at: T.v(1.02), gain: -5 },
      { name: "newspaper_rustle", at: T.v(1.1), gain: -16, dur: 1.0, fo: 0.3 },
      { name: "villager_hmm", at: T.v(1.6), gain: -14, dur: 0.75, fo: 0.2 },
      { name: "gulp", at: T.wait + 0.42, gain: -11 },
      { name: "transition_swish", at: T.v(3.3), gain: -14 },
      { name: "newspaper_rustle", at: T.v(3.0), gain: -18, dur: 0.6, fo: 0.2 },
      { name: "paper_flurry", at: T.leap, gain: -6 },
      { name: "chair_clatter", at: T.leap + 0.2, gain: -8 },
    ],
  },
  laptop: {
    vOff: 0.6, room: "room_office", window: false, shadow: [26, -2], leak: "left",
    leaves: [{ x: 140, y: 420, s: 820, b: 66, k: 2.0, c: "#3d6a2a" }, { x: 330, y: 980, s: 520, b: 52, k: 1.7, c: "#4f7f30" }],
    shots: (T) => [
      { at: 0, kind: "wide", pose: "k1", cam: [1.05, "body", 1.13, "body"] },
      { at: T.v(0.75), kind: "insert", insert: "screen" },
      { at: T.v(2.12), kind: "med", pose: "k2", cam: [1.9, { of: "head", dy: 0.12 }, 2.0, { of: "head", dy: 0.12 }] },
      { at: T.wait, kind: "freeze", pose: "k3", cam: [1.35, { of: "head", dy: 0.2 }, 2.0, { of: "head", dy: 0.08 }] },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", pose: "k4", cam: [1.12, "body", 1.16, "body"], jump: "up" },
    ],
    foley: (T) => [
      { name: "laptop_fan", at: 0, gain: -24, dur: T.leap + 0.3, fi: 0.3, fo: 0.3, hp: 120 },
      { name: "keyboard_typing", at: 0.05, gain: -10, dur: T.v(0.75) - 0.05, fo: 0.08 },
      { name: "trackpad_click", at: T.v(0.95), gain: -9, dur: 1.9, fo: 0.2 },
      { name: "keyboard_typing", at: T.v(1.45), gain: -15, dur: 0.6, fo: 0.15 },
      { name: "villager_hmm", at: T.v(2.2), gain: -15, dur: 0.6, fo: 0.2 },
      { name: "trackpad_click", at: T.v(2.3), gain: -10, dur: 0.5, fo: 0.1 },
      { name: "gulp", at: T.wait + 0.4, gain: -11 },
      { name: "chair_creak", at: T.leap, gain: -6 },
    ],
  },
  nap: {
    vOff: 2.45, room: "room_bedroom", window: false, shadow: [22, -6], leak: "left",
    leaves: [{ x: 90, y: 600, s: 860, b: 70, k: 2.1, c: "#3a6526" }, { x: 1840, y: 980, s: 460, b: 48, k: 1.6, c: "#557f2e" }],
    head: { k1: [0.822, 0.462], k2: [0.822, 0.462] }, // the Zzz above him would bias the auto head point
    shots: (T) => [
      { at: 0, kind: "wide", pose: "k1", cam: [1.03, "body", 1.1, "body"] },
      { at: 1.05, kind: "med", poses: [[0, "k1"], [0.62, "k2"]], cam: [2.2, { of: "head", dx: -0.05, dy: 0.06 }, 2.32, { of: "head", dx: -0.05, dy: 0.06 }] },
      { at: 1.88, kind: "insert", insert: "lockscreen" },
      { at: T.v(0.3), kind: "freeze", pose: "k3", cam: [1.4, { of: "head", dy: 0.16 }, 1.9, { of: "head", dy: 0.08 }], crashAt: T.wait },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", pose: "k4", cam: [1.06, "body", 1.1, "body"], jump: "dive" },
    ],
    foley: (T) => [
      { name: "snore", at: 0.0, gain: -7, dur: T.v(0.3), fo: 0.12 },
      { name: "phone_buzz", at: 1.62, gain: -4 },
      { name: "phone_buzz", at: 2.2, gain: -6, hp: 200 },
      { name: "sheet_rustle", at: T.v(0.28), gain: -5 },
      { name: "gulp", at: T.v(1.12), gain: -13 },
      { name: "sheet_rustle", at: T.leap - 0.04, gain: -4 },
    ],
  },
  phone: {
    vOff: 0.5, room: "room_office", window: false, shadow: [-30, -4], leak: "right",
    leaves: [{ x: 110, y: 700, s: 900, b: 70, k: 2.1, c: "#3a6a28" }, { x: 1790, y: 860, s: 560, b: 56, k: 1.8, c: "#5b3a22" }],
    shots: (T) => [
      { at: 0, kind: "wide", pose: "k1", cam: [1.04, "body", 1.11, "body"] },
      { at: T.v(0.7), kind: "insert", insert: "feed" },
      { at: T.v(1.85), kind: "med", pose: "k2", cam: [1.85, { of: "head", dy: 0.12 }, 1.96, { of: "head", dy: 0.12 }] },
      { at: T.wait - 0.04, kind: "freeze", pose: "k3", cam: [1.4, { of: "head", dy: 0.2 }, 2.05, { of: "head", dy: 0.08 }] },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", pose: "k4", cam: [1.08, "body", 1.08, "body"], jump: "run" },
    ],
    foley: (T) => [
      { name: "phone_scroll", at: 0.1, gain: -9, dur: T.v(1.85) - 0.1, fo: 0.2 },
      { name: "villager_hmm", at: T.v(1.25), gain: -16, dur: 0.55, fo: 0.2 },
      { name: "yawn", at: T.v(2.0), gain: -9, dur: 0.95, fo: 0.25 },
      { name: "gulp", at: T.wait + 0.45, gain: -11 },
      { name: "run_away", at: T.leap + 0.02, gain: -4 },
    ],
  },
  notebook: {
    vOff: 0.5, room: "room_office", window: true, shadow: [-28, -2], leak: "right",
    leaves: [{ x: 1760, y: 760, s: 860, b: 68, k: 2.0, c: "#3f6e29" }, { x: 160, y: 140, s: 420, b: 46, k: 1.5, c: "#4c7a2c" }],
    shots: (T) => [
      { at: 0, kind: "wide", pose: "k1", cam: [1.05, "body", 1.12, "body"] },
      { at: T.v(0.9), kind: "insert", insert: "notebook" },
      { at: T.v(2.55), kind: "med", pose: "k2", cam: [2.0, { of: "head", dy: 0.1 }, 2.12, { of: "head", dy: 0.1 }] },
      { at: T.wait, kind: "freeze", pose: "k3", cam: [1.55, { of: "head", dy: 0.14 }, 2.15, { of: "head", dy: 0.06 }] },
      { at: T.date - 0.04, kind: "cu" },
      { at: T.leap, kind: "leap", pose: "k4", cam: [1.1, "body", 1.14, "body"], jump: "up" },
    ],
    foley: (T) => [
      { name: "pencil_write", at: 0.05, gain: -9, dur: T.v(2.55) - 0.05, fo: 0.12 },
      { name: "villager_hmm", at: T.v(2.6), gain: -12, dur: 1.4, fo: 0.3 },
      { name: "pen_drop", at: T.wait + 0.05, gain: -8 },
      { name: "gulp", at: T.v(4.62), gain: -13 },
      { name: "chair_creak", at: T.leap, gain: -6 },
      { name: "paper_flurry", at: T.leap + 0.04, gain: -12, dur: 1.2, fo: 0.4 },
    ],
  },
};

const BOIL = [0, 1, 2, 0, 2, 1]; // never shows the same drawing twice in a row
const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; };

export function buildColdOpen(root, id, tim, ep, manifest) {
  const W = window.__W ?? 1920, H = window.__H ?? 1080;
  const D = COLD_OPENS[id];
  if (!D) throw new Error(`unknown cold open ${id}`);
  const M = manifest[id];
  const Hw = W * M.plate[1] / M.plate[0]; // world height at zoom 1 (plate aspect)
  const T = { vOff: D.vOff, v: (x) => D.vOff + x };
  T.wait = T.v(tim.wait); T.date = T.v(tim.date); T.vEnd = T.v(tim.dur);
  T.leap = T.vEnd + 0.06; T.whip = T.leap + 0.42; T.end = T.whip + 0.34;
  const talk = tim.talk.map(([a, b]) => [T.v(a), T.v(b)]);
  const shots = D.shots(T).map((s, i, all) => ({ ...s, to: i + 1 < all.length ? all[i + 1].at : T.end }));
  const pose = (name) => M.poses[name];
  const variants = (k) => [k, `${k}_r1`, `${k}_r2`].filter((n) => M.poses[n]);
  const usedPoses = [...new Set(shots.flatMap((s) => (s.poses ? s.poses.map((p) => p[1]) : s.pose ? [s.pose] : [])))];
  const drawings = usedPoses.flatMap(variants);
  const today = ep?.today ? new Date(ep.today) : new Date();

  // ---------------------------------------------------------------- DOM
  const layer = document.createElement("div");
  layer.className = "cold c2";
  layer.innerHTML = `
    <svg width="0" height="0" style="position:absolute">
      <filter id="c2-boil" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G"/></filter>
      <filter id="c2-boil-hi" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="1" seed="3"/><feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="G" yChannelSelector="R"/></filter>
    </svg>
    <div class="c2-shot c2-world-shot"><div class="c2-world" style="height:${Hw}px">
      <img class="c2-plate" src="${V}${id}/plate.jpg">
      <div class="c2-char">${drawings.map((n) => `<img class="c2-d" data-n="${n}" src="${V}${id}/${n}.webp">`).join("")}
        <div class="c2-lm" style="background-image:url(${V}${id}/plate_blur.jpg)"></div><div class="c2-lc" style="background-image:url(${V}${id}/plate_blur.jpg)"></div></div>
    </div>
      <div class="c2-dust"></div><div class="c2-leaves"></div></div>
    <div class="c2-shot c2-ins"><div class="c2-insbg" style="background-image:url(${V}${id}/plate_blur.jpg)"></div><div class="c2-ins-in"></div></div>
    <div class="c2-shot c2-cu"><div class="c2-insbg c2-cubg" style="background-image:url(${V}${id}/plate_blur.jpg)"></div>
      <div class="c2-face">${["open", "half", "closed"].flatMap((m) => ["", "_r1", "_r2"].map((r) => `<img class="c2-f" data-n="${m}${r}" src="${V}face/${m}${r}.webp">`)).join("")}
        <div class="c2-lc c2-flc" style="background-image:url(${V}${id}/plate_blur.jpg)"></div></div></div>
    <div class="bh-haze"></div><div class="bh-leak c2-leak ${D.leak === "right" ? "c2-leak-r" : ""}"></div><div class="bh-vig"></div>
    <div class="c2-flash"></div>`;
  root.appendChild(layer);
  const $ = (s, el = layer) => el.querySelector(s);
  const wshot = $(".c2-world-shot"), world = $(".c2-world"), charEl = $(".c2-char"), lm = $(".c2-lm"), lc = $(".c2-lc");
  const ins = $(".c2-ins"), insIn = $(".c2-ins-in"), insBg = $(".c2-ins .c2-insbg"), cu = $(".c2-cu"), cuBg = $(".c2-cubg"), faceEl = $(".c2-face"), flc = $(".c2-flc");
  const flash = $(".c2-flash"), leak = $(".c2-leak");
  const turb = [...layer.querySelectorAll("feTurbulence")];
  const dImgs = Object.fromEntries([...layer.querySelectorAll(".c2-d")].map((e) => [e.dataset.n, e]));
  const fImgs = Object.fromEntries([...layer.querySelectorAll(".c2-f")].map((e) => [e.dataset.n, e]));
  let curD = null, curF = null;
  const showD = (n) => {
    if (n === curD) return;
    if (curD) dImgs[curD].style.visibility = "hidden";
    dImgs[n].style.visibility = "visible"; curD = n;
    const m = `url(${V}${id}/${n}.webp)`;
    lm.style.maskImage = lc.style.maskImage = lm.style.webkitMaskImage = lc.style.webkitMaskImage = m;
  };
  const showF = (n) => {
    if (n === curF) return;
    if (curF) fImgs[curF].style.visibility = "hidden";
    fImgs[n].style.visibility = "visible"; curF = n;
    flc.style.maskImage = flc.style.webkitMaskImage = `url(${V}face/${n}.webp)`;
  };

  // foreground leaves (pre-blurred once) + dust motes in the sun
  const leavesEl = $(".c2-leaves"), dustEl = $(".c2-dust");
  const leafEls = D.leaves.map((L, i) => { const c = leafSprite(L, i); leavesEl.appendChild(c); return c; });
  const DUST = Array.from({ length: 46 }, (_, i) => ({ x: hash(i * 3 + 1) * W, y: hash(i * 7 + 2) * H, r: 2 + hash(i * 11 + 5) * 7, sp: 6 + hash(i * 13) * 16, ph: hash(i * 17) * 6.28, k: 0.25 + hash(i * 19) * 0.5 }));
  dustEl.innerHTML = DUST.map((d) => `<i style="width:${d.r * 2}px;height:${d.r * 2}px;filter:blur(${(d.r * 0.45).toFixed(1)}px)"></i>`).join("");
  const dustEls = [...dustEl.children];

  // ---------------------------------------------------------------- inserts
  const insUpdate = buildInsert(insIn, D, id, shots.find((s) => s.kind === "insert"), today);

  // ---------------------------------------------------------------- camera
  const focusOf = (f, p) => {
    const P = pose(p) ?? pose("k1");
    const head = D.head?.[p] ?? P.head;
    if (Array.isArray(f)) return f;
    if (f === "body") return [(P.bbox[0] + P.bbox[2]) / 2, (P.bbox[1] + P.bbox[3]) / 2];
    if (f === "head") return head;
    const b = f.of === "head" ? head : [(P.bbox[0] + P.bbox[2]) / 2, (P.bbox[1] + P.bbox[3]) / 2];
    return [b[0] + (f.dx ?? 0), b[1] + (f.dy ?? 0)];
  };
  const place = (z, f) => {
    const Ww = W * z, Wh = Hw * z;
    return { s: z, ox: clamp(W / 2 - f[0] * Ww, W - Ww, 0), oy: clamp(H / 2 - f[1] * Wh, H - Wh, 0) };
  };
  const shake = (t, a) => ({ x: a * (Math.sin(t * 1.31) * 4 + Math.sin(t * 2.97 + 1.3) * 2 + Math.sin(t * 6.1 + 0.4) * 0.7), y: a * (Math.cos(t * 1.13) * 3 + Math.sin(t * 2.41 + 0.6) * 1.6 + Math.cos(t * 5.3) * 0.6) });
  const isTalking = (t) => talk.some(([a, b]) => t >= a && t <= b);

  function update(t) {
    const on = t < T.end;
    layer.style.display = on ? "block" : "none";
    if (!on) return;
    const sh = shots.find((s) => t >= s.at && t < s.to) ?? shots[shots.length - 1];
    const lt = t - sh.at, len = sh.to - sh.at;
    const boilTick = Math.floor(t * 8);
    const tick12 = Math.floor(t * 12);
    turb.forEach((f, i) => f.setAttribute("seed", String(((tick12 * (i + 3)) % 23) + 1)));
    const jolt = t > 0.6 && Math.floor(t / 1.9) !== Math.floor((t - 0.067) / 1.9);
    const worldKinds = ["wide", "med", "freeze", "leap"];
    wshot.style.display = worldKinds.includes(sh.kind) ? "block" : "none";
    ins.style.display = sh.kind === "insert" ? "block" : "none";
    cu.style.display = sh.kind === "cu" ? "block" : "none";
    let flashA = 0;

    if (worldKinds.includes(sh.kind)) {
      // ---- which drawing: pose of the shot, boiling through its redraws
      let p = sh.pose;
      if (sh.poses) for (const [a, n] of sh.poses) if (lt >= a) p = n;
      const vs = variants(p);
      showD(vs[BOIL[boilTick % BOIL.length] % vs.length]);
      // ---- camera
      const [z0, f0, z1, f1] = sh.cam;
      const a = place(z0, focusOf(f0, p)), b = place(z1, focusOf(f1, p));
      let s, ox, oy;
      if (sh.kind === "freeze") {
        // hold a beat on the freeze, then CRASH zoom into his face
        const crashAt = (sh.crashAt ?? sh.at) - sh.at + 0.05;
        const z = snapOut(prog(lt, crashAt, 0.17));
        s = lerp(a.s, b.s, z); ox = lerp(a.ox, b.ox, z); oy = lerp(a.oy, b.oy, z);
        flashA = lt >= crashAt && lt < crashAt + 0.067 ? 0.5 : 0;
      } else {
        const k = ease.inOutSine(clamp(lt / Math.max(len, 0.01)));
        s = lerp(a.s, b.s, k); ox = lerp(a.ox, b.ox, k); oy = lerp(a.oy, b.oy, k);
      }
      const hand = shake(t, sh.kind === "wide" ? 0.55 : 1.0);
      ox += hand.x; oy += hand.y;
      // ---- the drawing itself: breathing, leap
      let cx = 0, cy = 0, flip = 0, sc = 1 + Math.sin(t * 2.2) * 0.004;
      if (sh.kind === "leap") {
        const l = lt;
        if (sh.jump === "run") cx = ease.inQuad(prog(l, 0.06, 0.4)) * 1900;
        else if (sh.jump === "dive") { cx = -ease.inQuad(prog(l, 0.05, 0.42)) * 1700; cy = -snapOut(prog(l, 0, 0.12)) * 30; }
        else { cy = (1 - snapOut(prog(l, 0, 0.14))) * 70 - Math.sin(clamp(l / 0.5) * Math.PI) * 18; sc *= lerp(0.96, 1, snapOut(prog(l, 0, 0.14))); }
        flip = Math.sin(Math.PI * clamp(l / 0.18)) * 72; // edge-on like a sheet of paper
        oy += Math.sin(l * 55) * 9 * (1 - clamp(l / 0.3));
        ox += Math.sin(l * 47) * 6 * (1 - clamp(l / 0.3));
      }
      const w = ease.inExpo(prog(t, T.whip, T.end - T.whip));
      ox -= w * 2800;
      world.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.toFixed(5)})`;
      const P = pose(p) ?? pose("k1");
      charEl.style.transformOrigin = `${(((P.bbox[0] + P.bbox[2]) / 2) * 100).toFixed(2)}% ${(P.bbox[3] * 100).toFixed(2)}%`;
      charEl.style.transform = `translate(${cx}px, ${cy}px) perspective(1800px) rotateY(${flip.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      const [sx, sy] = D.shadow;
      const shadowF = sh.kind === "leap" ? "" : ` drop-shadow(${sx}px ${sy}px 9px rgba(28,14,4,.42))`;
      charEl.style.filter = (jolt ? "url(#c2-boil-hi) drop-shadow(6px 0 0 rgba(255,40,90,.42)) drop-shadow(-6px 0 0 rgba(30,160,255,.42))" : "url(#c2-boil)") + shadowF;
      // ---- depth: leaves + dust parallax against the camera move inside the shot
      const ref = place(z0, focusOf(f0, p));
      const dx = ox - ref.ox, dy = oy - ref.oy;
      leafEls.forEach((e, i) => {
        const L = D.leaves[i];
        // tighter lens → the leaves sit further out at the frame edge, never over his face
        const tight = sh.kind === "wide" || sh.kind === "leap" ? 0 : 1;
        const push = tight * (L.x < W / 2 ? -1 : 1) * 300, pushY = tight * (L.y < H / 2 ? -1 : 1) * 120;
        const x = L.x + push + dx * L.k * 0.35 + Math.sin(t * 0.9 + i) * 14 - w * 2800 * L.k * 0.4;
        const y = L.y + pushY + dy * L.k * 0.35 + Math.cos(t * 0.7 + i * 2) * 10;
        e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(i * 57 + Math.sin(t * 0.6 + i) * 4).toFixed(1)}deg) scale(${tight ? 1.3 : 1})`;
        e.style.opacity = tight ? "0.7" : "0.9";
      });
      dustEls.forEach((e, i) => {
        const d = DUST[i];
        const x = ((d.x + Math.sin(t * 0.4 + d.ph) * 40 + t * d.sp + dx * d.k) % (W + 40) + W + 40) % (W + 40) - 20;
        const y = ((d.y - t * d.sp * 0.6 + Math.cos(t * 0.5 + d.ph) * 30 + dy * d.k) % (H + 40) + H + 40) % (H + 40) - 20;
        e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        e.style.opacity = String(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.ph)));
      });
    }

    if (sh.kind === "insert") insUpdate(t, lt, len);
    if (sh.kind === "cu") {
      // mouth from the voice (3 drawings × 3 redraws), boiling at 8 fps
      let m = "closed";
      if (isTalking(t)) m = ["open", "half", "open", "closed", "half", "open"][(Math.floor(t * 12) * 5 + 1) % 6];
      const r = ["", "_r1", "_r2"][BOIL[boilTick % BOIL.length]];
      showF(`${m}${r}`);
      const P = pose(shots.find((s) => s.kind === "freeze")?.pose ?? "k1");
      const hd = D.head?.k3 ?? P.head;
      cuBg.style.backgroundPosition = `${(hd[0] * 100).toFixed(1)}% ${(hd[1] * 100).toFixed(1)}%`;
      const punch = snapOut(prog(lt, 0, 0.16)) * 0.05 + snapOut(prog(t, talk[talk.length - 1][0] + 0.45, 0.12)) * 0.05;
      const s = 1.0 + lt * 0.025 + punch;
      const hs = shake(t * 1.6, 1.2);
      faceEl.style.transform = `translate(${hs.x}px, ${hs.y}px) scale(${s.toFixed(4)})`;
      cuBg.style.transform = `scale(${(1.08 + lt * 0.02).toFixed(4)}) translate(${(-hs.x * 0.4).toFixed(1)}px, 0)`;
      faceEl.style.filter = jolt ? "url(#c2-boil-hi) drop-shadow(8px 0 0 rgba(255,40,90,.42)) drop-shadow(-8px 0 0 rgba(30,160,255,.42))" : "url(#c2-boil)";
      if (lt < 0.067) flashA = 0.35;
    }
    flash.style.opacity = String(flashA + ease.inExpo(prog(t, T.whip, T.end - T.whip)) * 0.22);
    leak.style.opacity = String(0.42 + Math.sin(t * 1.7) * 0.1);
  }

  // ---------------------------------------------------------------- sound (relative to the cold open start)
  const sfx = [
    { name: "../../coldopen/voice/" + id, at: T.vOff, gain: 0, dur: tim.dur + 0.25, fo: 0.08 },
    { name: D.room, at: 0, gain: -14, dur: T.end + 0.3, fi: 0.25, fo: 0.35, hp: 90 },
    { name: "amb_city", at: 0, gain: -27, dur: T.end + 0.3, fi: 0.4, fo: 0.4, hp: 160, lp: 4200, pan: D.leak === "right" ? 0.35 : -0.35 },
    ...(D.window ? [{ name: "wind_bed", at: 0, gain: -22, dur: T.end + 0.3, fi: 0.4, fo: 0.4, hp: 180, lp: 6000, pan: D.leak === "right" ? 0.3 : -0.3 }] : []),
    { name: "record_scratch", at: T.wait - 0.06, gain: -8, dur: 0.85, fo: 0.25 },
    { name: "hook_impact", at: T.date - 0.04, gain: -15, lp: 220 },
    { name: "cartoon_zip", at: T.leap - 0.04, gain: -6 },
    { name: "camera_whip", at: T.whip - 0.1, gain: -5, hp: 60 },
    ...D.foley(T),
  ];
  const images = [`${V}${id}/plate.jpg`, `${V}${id}/plate_blur.jpg`, ...drawings.map((n) => `${V}${id}/${n}.webp`),
    ...["open", "half", "closed"].flatMap((m) => ["", "_r1", "_r2"].map((r) => `${V}face/${m}${r}.webp`)), ...(id === "notebook" ? [`${A}insert_notebook.webp`] : [])];
  async function prepare() {
    await Promise.all(images.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    await Promise.all(['900 120px "Inter"', '700 60px "Caveat"'].map((f) => document.fonts.load(f, "DENNÍ ZPRÁVY AI MĚNÍ SVĚT " + DAYS.join(" ") + MONTHS_GEN.join(" ") + " 0123456789")));
  }
  return { update, prepare, duration: T.end, sfx, T, fps: 30, shutter: 0.75 };
}

// ---------------------------------------------------------------- inserts (what he is looking at)
function buildInsert(el, D, id, shot, today) {
  if (!shot) return () => {};
  const kind = shot.insert;
  const bg = el.parentElement.querySelector(".c2-insbg");
  if (kind === "news") {
    // his newspaper, 8 days old. A FAST zoom onto the date; everything but the date drops out of focus.
    const old = new Date(+today - 8 * 86400000);
    const dateTxt = `${DAYS_CAP[old.getUTCDay()]} ${old.getUTCDate()}. ${MONTHS_GEN[old.getUTCMonth()]} ${old.getUTCFullYear()}`;
    const page = (cls) => `<div class="c2-paper ${cls}">
      <div class="c2-mast">DENNÍ ZPRÁVY</div>
      <div class="c2-dline"><span class="c2-dl">Ročník XII · č. 236</span><span class="c2-date">${dateTxt}</span><span class="c2-dl">Cena 25 Kč</span></div>
      <div class="c2-head">AI MĚNÍ SVĚT</div><div class="c2-sub">Umělá inteligence píše, kreslí i programuje. Co nás čeká příští týden?</div>
      <div class="c2-body"><div class="c2-photo"></div><div class="c2-cols">${"<p></p>".repeat(44)}</div></div></div>`;
    el.innerHTML = `<div class="c2-news">${page("c2-p-soft")}${page("c2-p-sharp")}</div><div class="c2-focusvig"></div>`;
    bg.style.backgroundPosition = "78% 40%";
    const news = el.querySelector(".c2-news"), soft = el.querySelector(".c2-p-soft"), sharp = el.querySelector(".c2-p-sharp"), vig = el.querySelector(".c2-focusvig");
    let dx = 1010, dy = 228, measured = false;
    return (t, lt) => {
      if (!measured) {
        // where the date line really sits inside the 1600×1000 page (fonts are loaded by now)
        const d = sharp.querySelector(".c2-date");
        dx = d.offsetLeft + d.offsetWidth / 2; dy = d.offsetTop + d.offsetHeight / 2; measured = true;
        const m = `radial-gradient(ellipse ${Math.round(d.offsetWidth * 0.62)}px 62px at ${dx}px ${dy}px, #000 60%, transparent 100%)`;
        sharp.style.maskImage = sharp.style.webkitMaskImage = m;
      }
      // 0–0.42 s the whole front page (he reads), then a 0.2 s crash zoom onto the date line
      const z = snapOut(prog(lt, 0.42, 0.2));
      const s = lerp(0.92, 3.0, z);
      const fx = lerp(800, dx, z), fy = lerp(500, dy, z);
      const drift = Math.sin(t * 1.4) * 4;
      news.style.transform = `translate(${960 - fx * s + drift}px, ${540 - fy * s + Math.cos(t * 1.1) * 3}px) scale(${s.toFixed(4)}) rotate(${lerp(-2.5, -0.6, z).toFixed(3)}deg)`;
      // rack focus: the page goes soft, a sharp copy masked to the date line stays readable
      soft.style.filter = `blur(${(z * 7).toFixed(2)}px)`;
      sharp.style.opacity = String(z);
      vig.style.opacity = String(z * 0.85);
      bg.style.filter = `blur(${(10 + z * 8).toFixed(1)}px) brightness(.7)`;
    };
  }
  if (kind === "notebook") {
    const r = mulberry(42), strokes = [];
    for (let k = 0; k < 26; k++) {
      const y = 610 + r() * 230, x0 = 1150 + r() * 160, x1 = 1720 + r() * 140, bow = (r() - 0.5) * 40;
      strokes.push({ d: `M${x0} ${y} Q${(x0 + x1) / 2} ${y + bow} ${x1} ${y + (r() - 0.5) * 30}`, w: 8 + r() * 10, at: 0.1 + k * 0.06 });
    }
    el.innerHTML = `<div class="c2-nb"><img src="../assets/coldopen/insert_notebook.webp"><svg viewBox="0 0 2688 1520">${strokes.map((s) => `<path d="${s.d}" stroke-width="${s.w.toFixed(1)}" pathLength="1"/>`).join("")}</svg></div>`;
    bg.style.backgroundPosition = "45% 62%";
    const paths = [...el.querySelectorAll("path")], box = el.querySelector(".c2-nb");
    return (t, lt) => {
      paths.forEach((p, k) => (p.style.strokeDashoffset = String(1 - clamp((lt - strokes[k].at) / 0.07))));
      const k = Math.floor(lt / 0.06);
      box.style.transform = `translate(${Math.sin(k * 2.3) * 4}px, ${Math.cos(k * 1.7) * 3}px) rotate(${(-3 + Math.sin(t * 0.8) * 0.6).toFixed(2)}deg) scale(${(1.04 + lt * 0.025).toFixed(4)})`;
    };
  }
  if (kind === "screen") {
    const pages = [
      ["novinky-ai.cz", "ChatGPT umí zase něco nového?", "Před 3 týdny · 4 min čtení"],
      ["techweb.cz", "10 AI nástrojů, které musíte znát", "Před měsícem · 7 min čtení"],
      ["x.com", "Je tohle konec designérů?", "Před 2 týdny · 1,2 tis. komentářů"],
      ["youtube.com", "AI vs. člověk – kdo vyhraje?", "Před 5 týdny · 230 tis. zhlédnutí"],
    ];
    const PH = ["nap", "notebook", "phone", "newspaper"].map((n) => `${V}${n}/plate_blur.jpg`);
    el.innerHTML = `<div class="co-scr c2-scr"><div class="co-scr-in"><div class="co-scr-bar"><i></i><i></i><i></i><span class="co-url"></span></div>
      <div class="co-pages">${pages.map((p, k) => `<div class="co-page"><div class="co-ph" style="background:url(${PH[k]}) ${["50% 40%", "30% 50%", "60% 45%", "40% 60%"][k]} / cover"></div><h3>${p[1]}</h3><p class="co-meta">${p[2]}</p><p class="co-l"></p><p class="co-l"></p><p class="co-l s"></p></div>`).join("")}</div>
      <div class="co-cursor"></div></div></div>`;
    bg.style.backgroundPosition = "40% 55%";
    const pg = [...el.querySelectorAll(".co-page")], url = el.querySelector(".co-url"), cursor = el.querySelector(".co-cursor"), scr = el.querySelector(".c2-scr");
    return (t, lt, len) => {
      const per = len / pages.length, k = Math.min(pages.length - 1, Math.floor(lt / per));
      pg.forEach((p, i) => { p.style.display = i === k ? "block" : "none"; p.style.transform = `translateY(${(-(lt - k * per) * 260).toFixed(1)}px)`; });
      url.textContent = pages[k][0];
      cursor.style.transform = `translate(${(760 + Math.sin(lt * 2.1) * 220).toFixed(1)}px, ${(380 + Math.cos(lt * 1.6) * 140).toFixed(1)}px)`;
      scr.style.transform = `scale(${(1.0 + lt * 0.02).toFixed(4)}) rotate(${(-1 + Math.sin(lt) * 0.3).toFixed(3)}deg)`;
    };
  }
  if (kind === "feed") {
    const posts = ["Před 3 týdny", "Před měsícem", "Před 2 týdny", "Před 5 týdny", "Před 4 týdny", "Před 6 týdny", "Před 3 týdny", "Před 2 měsíci"];
    const C1 = ["#2f6bed", "#4ea51f", "#c8352a", "#e2a23a"];
    const PH = ["laptop", "nap", "notebook", "newspaper"].map((n) => `${V}${n}/plate_blur.jpg`);
    el.innerHTML = `<div class="co-ph-wrap c2-phw"><div class="co-phone"><div class="co-feed">${posts.map((p, k) => `<div class="co-post"><div class="co-av" style="background:${C1[k % 4]}"></div><b>@ai_novinky</b><span>${p}</span><div class="co-img" style="background:url(${PH[k % 4]}) ${(k * 23) % 100}% 50% / cover"></div></div>`).join("")}</div><div class="co-island"></div></div></div>`;
    bg.style.backgroundPosition = "55% 45%";
    const feed = el.querySelector(".co-feed"), wrap = el.querySelector(".c2-phw");
    return (t, lt) => {
      const flick = lt * 180 + Math.floor(lt / 0.55) * 300 + snapOut(clamp((lt % 0.55) / 0.4)) * 300;
      feed.style.transform = `translateY(${(-flick).toFixed(1)}px)`;
      wrap.style.transform = `rotate(${(-4 + Math.sin(lt * 1.3)).toFixed(2)}deg) scale(${(1 + lt * 0.02).toFixed(4)})`;
    };
  }
  if (kind === "lockscreen") {
    // the phone next to him on the blanket lights up: today's date + "nová aktualita"
    const hh = "16", mm = "42";
    el.innerHTML = `<div class="co-ph-wrap c2-lock"><div class="co-phone"><div class="c2-ls">
      <div class="c2-ls-date">${DAYS_CAP[today.getUTCDay()]} ${today.getUTCDate()}. ${MONTHS_GEN[today.getUTCMonth()]}</div><div class="c2-ls-time">${hh}:${mm}</div>
      <div class="c2-ls-note"><b>EFEKTIVE AKTUALITY</b><span>Nová AI aktualita je venku! 🔥</span><em>teď</em></div></div><div class="co-island"></div></div></div>`;
    bg.style.backgroundPosition = "62% 60%";
    const wrap = el.querySelector(".c2-lock"), ls = el.querySelector(".c2-ls"), note = el.querySelector(".c2-ls-note");
    return (t, lt) => {
      const on = snapOut(prog(lt, 0.12, 0.14));
      ls.style.opacity = String(on);
      note.style.transform = `translateY(${((1 - snapOut(prog(lt, 0.2, 0.2))) * -60).toFixed(1)}px)`;
      note.style.opacity = String(snapOut(prog(lt, 0.2, 0.15)));
      const buzz = (lt > 0.12 && lt < 0.55) || (lt > 0.7 && lt < 0.95) ? 1 : 0;
      wrap.style.transform = `translate(${(buzz * Math.sin(lt * 190) * 7).toFixed(1)}px, ${(buzz * Math.cos(lt * 170) * 4).toFixed(1)}px) rotate(${(-9 + buzz * Math.sin(lt * 150) * 1.2).toFixed(2)}deg) scale(${(0.86 + lt * 0.03).toFixed(4)})`;
    };
  }
  return () => {};
}

function mulberry(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// big, out-of-focus foreground leaf (pre-blurred once on a canvas)
function leafSprite(L, i) {
  const pad = L.b * 2.2, c = document.createElement("canvas");
  c.width = c.height = Math.ceil(L.s + pad * 2);
  const x = c.getContext("2d"), r = mulberry(91 + i * 13);
  x.filter = `blur(${L.b}px)`;
  x.translate(c.width / 2, c.height / 2);
  const s = L.s / 2;
  x.beginPath();
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const rr = s * (0.55 + 0.45 * Math.abs(Math.cos(a / 2))) * (1 + (k % 2 ? 0.05 : -0.03) * (0.6 + r()));
    const px = Math.sin(a) * rr * 0.7, py = -Math.cos(a) * rr;
    k ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
  const g = x.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, "#c7d77a"); g.addColorStop(0.45, L.c); g.addColorStop(1, "#14240c");
  x.fillStyle = g; x.fill();
  c.style.width = c.style.height = `${c.width}px`;
  c.style.margin = `${-c.width / 2}px 0 0 ${-c.width / 2}px`;
  return c;
}
