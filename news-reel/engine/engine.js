// Reel engine: hook (calendar) + explainer scenes + captions + outro on one timeline.
// The renderer calls window.__setTime(t) for every (sub)frame and screenshots the page.
import { clamp, lerp, prog, ease, spring, brandOut, brandInOut, bezier, snapOut as snapOutE } from "./ease.js";
import { buildHook, parseDate } from "./hook.js";
import { buildBoardHook } from "./hook-board.js";
import { templates as baseTemplates, icon, letters, revealLetters, buildOutro } from "./scenes.js";
import { proTemplates, kineticWords, animateWords, snapOut } from "./scenes-pro.js";
const templates = { ...baseTemplates, ...proTemplates };

const lib = { clamp, lerp, prog, ease, spring, brandOut, brandInOut, bezier, icon, letters, revealLetters, kineticWords, animateWords, snapOut };
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");
const OUTRO = 2.3; // seconds of brand end card after the voice

async function loadJSON(url, fallback) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

async function main() {
  const q = new URLSearchParams(location.search);
  const epDir = q.get("ep");
  const cfg = await loadJSON("../config.json");
  const ep = await loadJSON(`${epDir}/episode.json`);
  const voice = (await loadJSON(`${epDir}/build/words.json`, null)) ?? estimateVoice(ep);
  const stage = document.getElementById("stage");
  // frame size from config (16:9 landscape by default, 9:16 still supported)
  const W = cfg.video.width, H = cfg.video.height;
  window.__W = W; window.__H = H;
  document.documentElement.style.setProperty("--W", `${W}px`);
  document.documentElement.style.setProperty("--H", `${H}px`);
  if (W > H) stage.classList.add("land");

  // ---------- background: paper, fine grid, grain
  const bg = document.createElement("div");
  bg.className = "bg";
  // 3D environment: a perspective floor grid that always moves + glossy spheres and frosted glass panels
  // placed at different depths (blurred by depth). A world camera travels to a new spot at every cut.
  const WOBJ = [
    { k: "sphere blue", x: 380, y: -620, z: -300, s: 190 }, { k: "sphere green", x: -420, y: 560, z: -150, s: 130 },
    { k: "sphere blue", x: -760, y: -200, z: -900, s: 240 }, { k: "sphere green", x: 820, y: 380, z: -1100, s: 300 },
    { k: "sphere blue", x: 200, y: 900, z: -1600, s: 260 }, { k: "glass", x: -520, y: -760, z: -700, s: 340 },
    { k: "glass", x: 640, y: 120, z: -1300, s: 420 }, { k: "glass", x: -300, y: 260, z: -2000, s: 520 },
    { k: "sphere green", x: 1200, y: -500, z: -1800, s: 220 }, { k: "glass", x: 1300, y: 700, z: -600, s: 300 },
  ];
  bg.innerHTML = `<div class="blob bb"></div><div class="blob bg2"></div>
    <div class="world"><div class="floor"></div></div>
    <div class="objs">${WOBJ.map((o) => `<div class="wobj ${o.k}" style="width:${o.s}px;height:${o.s}px;margin:${-o.s / 2}px 0 0 ${-o.s / 2}px"></div>`).join("")}</div>
    <div class="cross"><i></i><i></i></div>`;
  stage.appendChild(bg);
  const glows = [...bg.querySelectorAll(".blob")];
  const world = bg.querySelector(".world"), floor = bg.querySelector(".floor");
  const objEls = [...bg.querySelectorAll(".wobj")];
  const spheres = [];
  const cross = bg.querySelector(".cross");
  // per-scene camera spots in the world (x, y, rotateY, rotateX)
  const SPOTS = [[0, 0, 0, 0], [520, -160, -12, 4], [-380, 140, 10, -3], [700, 60, -8, 6], [-200, -220, 14, -4], [-640, 80, -10, 3], [300, 200, 8, -5], [0, -60, 0, 2]];
  // per-scene content camera moves
  const SHOTS = ["orbitL", "push", "crane", "orbitR", "pull", "tilt"];
  const shotXf = (name, l, dur) => {
    const a = snapOut(prog(l, 0, 0.9)), d = brandInOut(prog(l, 0, Math.max(0.5, dur)));
    switch (name) {
      case "orbitL": return `translateZ(${lerp(-160, 20, a)}px) rotateY(${lerp(18, 3, a) - d * 5}deg) rotateX(${lerp(4, 0, a)}deg)`;
      case "orbitR": return `translateZ(${lerp(-160, 20, a)}px) rotateY(${lerp(-18, -3, a) + d * 5}deg) rotateX(${lerp(4, 0, a)}deg)`;
      case "push": return `translateZ(${lerp(-60, 30, a) + d * 110}px) rotateX(${lerp(6, 0, a)}deg)`;
      case "pull": return `translateZ(${lerp(260, 40, a) - d * 40}px) rotateY(${lerp(-6, 0, a)}deg)`;
      case "crane": return `translateY(${lerp(120, 0, a)}px) translateZ(${lerp(-120, 0, a)}px) rotateX(${lerp(20, 0, a) - d * 4}deg)`;
      case "tilt": return `translateZ(${lerp(-80, 10, a)}px) rotateZ(${lerp(-4, 0, a) + d * 1.5}deg) rotateY(${lerp(8, 0, a)}deg)`;
      default: return "";
    }
  };

  // ---------- hook
  const hookRoot = document.createElement("div");
  stage.appendChild(hookRoot);
  // hook style: "board" (chalkboard + tear-off calendar) or "calendar" (iOS month view)
  const hookKind = ep.hook ?? cfg.series.hook ?? "board";
  const hook = hookKind === "calendar" ? buildHook(hookRoot, ep, cfg) : buildBoardHook(hookRoot, ep, cfg);
  const B = hook.duration;
  const voiceStart = B + (cfg.audio.voiceStartOffset ?? 0);
  const voiceEnd = voiceStart + voice.duration;
  const outroStart = voiceEnd + 0.25;
  const total = outroStart + OUTRO;
  const abs = (sec) => voiceStart + sec;

  // ---------- camera layer (everything in the body sits on it; slow drift = "virtual camera")
  const cam = document.createElement("div");
  cam.className = "cam";
  // finishing layers: animated film grain + vignette (keeps flat colours from looking "digital")
  const finish = document.createElement("div");
  finish.className = "finish";
  finish.innerHTML = `<div class="grain"></div><div class="vig"></div>`;
  const grain = finish.querySelector(".grain");
  stage.appendChild(cam);

  // ---------- HUD: index label + date + progress rule
  const news = parseDate(ep.newsDate);
  const hud = document.createElement("div");
  hud.className = "hud";
  const MG = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
  hud.innerHTML = `<div class="hud-l">Aktualita ${String(ep.number ?? 1).padStart(2, "0")} · ${news.getUTCDate()}. ${MG[news.getUTCMonth()]}</div>
    <div class="hud-r"><span class="hud-n">01</span> · ${String((ep.scenes ?? []).length).padStart(2, "0")}</div>
    <div class="hud-bar"><b></b></div>`;
  stage.appendChild(hud);
  const hudBar = hud.querySelector(".hud-bar b"), hudN = hud.querySelector(".hud-n");

  // ---------- scenes
  const words = voice.words.filter((w) => !/^\[.*\]$/.test(w.text) && /[\p{L}\p{N}]/u.test(w.text));
  const cueTime = (name) => (voice.cues?.[name] != null ? abs(voice.cues[name]) : null);
  const defs = ep.scenes ?? [];
  const starts = defs.map((s, i) => {
    if (i === 0) return B;
    const c = typeof s.cue === "number" ? abs(s.cue) : cueTime(s.cue);
    if (c == null) console.warn(`missing cue ${s.cue}`);
    return c ?? B + (i * (voiceEnd - B)) / defs.length;
  });
  // SFX events (absolute seconds) – scenes register theirs through ctx.sfx(name, localTime, gainDb)
  const sfx = [];
  const addSfx = (name, at, gain = 0) => sfx.push({ name, at: +at.toFixed(3), gain });
  const scenes = defs.map((def, i) => {
    const el = document.createElement("div");
    el.className = `scene scene-${def.template}`;
    cam.appendChild(el);
    const start = starts[i];
    const end = i + 1 < defs.length ? starts[i + 1] : outroStart;
    const local = words.filter((w) => abs(w.start) >= start - 0.05 && abs(w.start) < end).map((w) => ({ ...w, t: abs(w.start) - start }));
    const ctx = {
      lib, words: local, cues: voice.cues, handle: cfg.series.handle,
      sfx: (name, localT, gain = 0) => addSfx(name, start + localT, gain),
      at(ref, fallback = 0) {
        if (ref == null) return fallback;
        if (typeof ref === "number") return ref;
        const c = cueTime(ref);
        if (c != null) return c - start;
        const n = norm(ref);
        const w = local.find((w) => norm(w.text).startsWith(n));
        return w ? w.t : fallback;
      },
    };
    const tpl = templates[def.template];
    if (!tpl) throw new Error(`unknown template ${def.template}`);
    return { el, start, end, update: tpl(el, def.props ?? {}, ctx), def };
  });

  // series sound signature (hook) + cuts + outro
  const hc = hook.cues;
  if (hook.sfx) hook.sfx.forEach((e) => addSfx(e.name, e.at, e.gain));
  else {
    addSfx("hook_swell", 0, -4);
    addSfx("synth_riser", Math.max(0, hc.impact - 2.4 + 0.04), -8);
    addSfx("hook_riser", Math.max(0, hc.impact - 1.04), -3);
    addSfx("hook_rewind", hc.ticks[0] ?? hc.riser[0], -6);
    hc.ticks.forEach((t) => addSfx("tick", t, -14));
    addSfx("hook_impact", hc.impact, 0);
    addSfx("hook_dive", hc.whoosh - 0.1, -3);
    addSfx("reveal_shimmer", B - 0.25, -8);
  }
  scenes.slice(1).forEach((s) => addSfx("transition_swish", s.start - 0.14, -7));
  addSfx("transition_swish", outroStart - 0.35, -4);
  addSfx("logo_sting", outroStart + 0.35, -2);

  // transition overlays (strobe = 1-frame colour flashes, streak = light line that opens into a panel)
  const fx = document.createElement("div");
  fx.className = "fx";
  fx.innerHTML = `<div class="fx-strobe"></div><div class="fx-streak"><i></i></div>`;
  stage.appendChild(fx);
  const strobe = fx.querySelector(".fx-strobe"), streak = fx.querySelector(".fx-streak"), streakLine = streak.firstChild;
  scenes.forEach((s) => {
    if (s.def.transition === "strobe") addSfx("transition_swish", s.start - 0.12, -3), addSfx("hook_impact", s.start, -10);
    if (s.def.transition === "streak") addSfx("hook_dive", s.start - 0.35, -6);
  });

  const outroUpdate = buildOutro(stage, cfg);
  const outroEl = stage.querySelector(".outro");

  // ---------- captions (sentence case, word-by-word weight + colour)
  const capEl = document.createElement("div");
  capEl.className = "captions";
  stage.appendChild(capEl);
  stage.appendChild(finish);
  const chunks = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const chars = cur.reduce((n, x) => n + x.text.length + 1, 0);
    const next = words[i + 1];
    const gap = next ? next.start - w.end : 1;
    if (cur.length >= 4 || chars > 22 || /[.,!?;:…—]$/.test(w.text) || gap > 0.3 || !next) {
      chunks.push(cur);
      cur = [];
    }
  });
  const chunkEls = chunks.map((c) => {
    const d = document.createElement("div");
    d.className = "cap";
    d.innerHTML = c.map((w) => `<span>${w.text.replace(/[,;:…—]+$/, "")}</span>`).join(" ");
    capEl.appendChild(d);
    return { el: d, words: c, spans: [...d.children], start: abs(c[0].start), end: abs(c[c.length - 1].end) };
  });
  chunkEls.forEach((c, i) => (c.until = i + 1 < chunkEls.length ? Math.min(chunkEls[i + 1].start - 0.04, c.end + 0.7) : c.end + 0.5));
  // subtitles are off by default (the on-screen motion text explains); enable with "captions": true
  const showCaptions = ep.captions ?? cfg.video.captions ?? false;

  // ---------- frame update
  window.__setTime = (t) => {
    const inBody = t > B - 0.6;
    bg.style.display = inBody ? "block" : "none";
    glows.forEach((g, i) => {
      const a = t * (0.18 + i * 0.05) + i * 2.4;
      g.style.transform = `translate(${Math.cos(a) * 120}px, ${Math.sin(a * 1.2) * 160}px)`;
    });
    // world camera: swing to the spot of the current scene (fast attack, long settle) + constant dolly drift
    {
      let ci = 0;
      scenes.forEach((s, i) => (t >= s.start - 0.12 ? (ci = i) : 0));
      const prevSpot = SPOTS[Math.max(0, ci - 1) % SPOTS.length], spot = SPOTS[ci % SPOTS.length];
      const sw = ci === 0 ? 1 : snapOut(prog(t, (scenes[ci]?.start ?? 0) - 0.12, 0.75));
      const [x, y, ry, rx] = prevSpot.map((v, k) => lerp(v, spot[k], sw));
      const dz = (t - B) * 70;
      world.style.transform = `translateZ(${dz}px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${-x}px, ${-y}px, 0)`;
      // objects: projected in JS (pinhole camera) so they always stay BEHIND the content layers
      const F = 1400, cyR = (ry * Math.PI) / 180, cxR = (rx * Math.PI) / 180;
      WOBJ.forEach((o, k) => {
        let X = o.x - x, Y = o.y - y, Z = o.z + dz;
        const X1 = X * Math.cos(cyR) + Z * Math.sin(cyR), Z1 = -X * Math.sin(cyR) + Z * Math.cos(cyR);
        const Y1 = Y * Math.cos(cxR) - Z1 * Math.sin(cxR), Z2 = Y * Math.sin(cxR) + Z1 * Math.cos(cxR);
        const e = objEls[k];
        if (Z2 > F * 0.7) { e.style.display = "none"; return; }
        const sc = F / (F - Z2);
        e.style.display = "block";
        e.style.transform = `translate(${W / 2 + X1 * sc}px, ${H * 0.45 + Y1 * sc}px) scale(${sc})`;
        // keep the reading column clean: objects drifting behind text fade + defocus
        const sx = W / 2 + X1 * sc, sy = H * 0.45 + Y1 * sc, rad = (o.s * sc) / 2;
        const inCol = clamp(1 - (Math.abs(sx - W / 2) - W * 0.3 - rad * 0.3) / 160) * clamp(1 - (Math.abs(sy - H * 0.45) - H * 0.4) / 200);
        e.style.opacity = String(1 - inCol * 0.85);
        e.style.filter = `blur(${Math.min(26, Math.abs(Z2 + 200) / 110 + inCol * 14)}px)`;
        e.style.zIndex = String(Math.round(2000 + Z2));
      });
      floor.style.backgroundPosition = `0 ${((t - B) * 260) % 160}px`;
    }
    grain.style.backgroundPosition = `${(Math.sin(t * 91.7) * 1000) | 0}px ${(Math.cos(t * 57.3) * 1000) | 0}px`;
    // brand spheres: fly in after the iris, then float with parallax against the camera
    spheres.forEach((sp, i) => {
      const e = brandOut(prog(t, B + 0.1 + i * 0.15, 1.6));
      const fx = Math.sin(t * (0.6 + i * 0.2) + i) * 18, fy = Math.cos(t * (0.5 + i * 0.25) + i * 2) * 22;
      sp.style.transform = `translate(${(1 - e) * (i ? -420 : 420) + fx}px, ${(1 - e) * (i ? 300 : -300) + fy}px) scale(${lerp(0.3, 1, e)})`;
    });
    const ce = brandInOut(prog(t, B + 0.4, 1.2));
    cross.style.opacity = ce;
    cross.style.transform = `scale(${lerp(0.6, 1, ce)}) rotate(${(1 - ce) * -45}deg)`;

    hook.update(t);

    // virtual camera: tiny continuous push-in + drift, with a settle after each cut
    const bodyT = t - B;
    cam.style.display = inBody ? "block" : "none";
    const camIn = brandOut(prog(t, B - 0.1, 1.2));
    cam.style.transform = `translateY(${(1 - camIn) * 140}px) scale(${lerp(1.08, 1, camIn) + bodyT * 0.0025})`;

    const hudIn = brandOut(prog(t, B + 0.2, 0.9));
    const hudOut = brandInOut(prog(t, outroStart - 0.2, 0.5));
    hud.style.opacity = hudIn * (1 - hudOut);
    hud.style.transform = `translateY(${(1 - hudIn) * -30}px)`;
    hudBar.style.transform = `scaleX(${clamp((t - B) / (outroStart - B))})`;
    let cur = 0;
    scenes.forEach((s, i) => (t >= s.start - 0.1 ? (cur = i) : 0));
    hudN.textContent = String(cur + 1).padStart(2, "0");

    scenes.forEach((s, si) => {
      const local = t - s.start, dur = s.end - s.start;
      const hardOut = ["strobe", "streak"].includes(scenes[si + 1]?.def.transition);
      const OUT = hardOut ? 0 : 0.24;
      const vis = local >= -0.02 && local < dur + OUT;
      s.el.style.display = vis ? "block" : "none";
      if (!vis) return;
      // transitions (see docs/motion-reference.md): the NEXT scene's type decides how this one leaves,
      // this scene's own type decides how it arrives. push = lift+blur, whip = horizontal blur slide,
      // zoom = dive through (scale up + blur), blur = soft focus crossfade.
      const outType = scenes[si + 1]?.def.transition ?? "push";
      const inType = si > 0 ? s.def.transition ?? "push" : "none";
      // exits start a beat BEFORE the cut so the incoming scene always lands on a clean stage
      const o = (outType === "whip" ? ease.inCubic : brandInOut)(prog(local, dur - (outType === "whip" ? 0.16 : 0.12), outType === "whip" ? 0.22 : OUT));
      const i = snapOut(prog(local, inType === "whip" ? 0.02 : -0.02, inType === "whip" ? 0.45 : 0.6));
      let tx = 0, ty = 0, sc = 1, bl = 0, op = 1;
      // outgoing text must be gone before the incoming text writes into the same spot (no overlapping words)
      if (outType === "push") { ty -= o * 180; sc *= 1 - o * 0.04; bl += o * 18; op *= 1 - Math.sqrt(o); }
      if (outType === "whip") { tx -= o * 760; bl += o * 34; op *= 1 - Math.sqrt(o); }
      if (outType === "zoom") { sc *= 1 + o * 1.4; bl += o * 26; op *= 1 - Math.sqrt(o); }
      if (outType === "blur") { bl += o * 30; op *= 1 - Math.sqrt(o); }
      if (inType === "whip") { tx += (1 - i) * 620; bl += (1 - i) * 30; op *= clamp(i * 3); }
      if (inType === "zoom") { sc *= lerp(0.72, 1, i); bl += (1 - i) * 22; op *= clamp(i * 2); }
      if (inType === "blur") { bl += (1 - i) * 26; op *= clamp(i * 1.5); }
      s.el.style.opacity = op;
      s.el.style.transform = `translate(${tx}px, ${ty}px) scale(${sc}) ${shotXf(s.def.camera ?? SHOTS[si % SHOTS.length], local, dur)}`;
      // chromatic fringe while a transition is moving (lens feel), plus motion blur from the transition
      const ca = Math.max(si > 0 && inType !== "none" ? Math.sin(Math.PI * clamp(i)) : 0, Math.sin(Math.PI * clamp(o)));
      const fringe = ca > 0.05 ? ` drop-shadow(${ca * 7}px 0 0 rgba(255,60,90,.35)) drop-shadow(${-ca * 7}px 0 0 rgba(40,140,255,.35))` : "";
      s.el.style.filter = (bl > 0.2 ? `blur(${bl}px)` : "") + fringe || "none";
      s.update(Math.min(local, dur + OUT), dur);
      if (!s.fitted) {
        // auto-fit: if the content (measured once, at rest) is taller/wider than the scene box, scale it down
        s.fitted = true;
        const sc = s.el.querySelector(".sc");
        if (sc) {
          s.update(Math.max(0.1, dur - 0.25), dur); // measure the scene at rest (everything landed)
          const box = sc.getBoundingClientRect();
          let top = Infinity, bot = -Infinity, left = Infinity, right = -Infinity;
          [...sc.children].forEach((c) => { const r = c.getBoundingClientRect(); top = Math.min(top, r.top); bot = Math.max(bot, r.bottom); left = Math.min(left, r.left); right = Math.max(right, r.right); });
          const k = Math.min(1, (box.height * 0.98) / Math.max(1, bot - top), (box.width * 1.02) / Math.max(1, right - left));
          if (k < 0.995) { sc.style.transform = `scale(${k})`; sc.style.transformOrigin = "50% 50%"; }
          s.update(Math.min(local, dur + OUT), dur);
        }
      }
    });

    // ---- transition overlays
    strobe.style.display = "none";
    streak.style.display = "none";
    for (const s of scenes) {
      const d = t - s.start;
      if (s.def.transition === "strobe" && d >= -0.1 && d < 0.0) {
        const k = Math.floor((d + 0.1) / 0.0334);
        strobe.style.display = "block";
        strobe.style.background = ["var(--blue)", "var(--lime)", "var(--ink)"][Math.min(2, k)];
      }
      if (s.def.transition === "streak" && d >= -0.4 && d < 0.3) {
        streak.style.display = "block";
        const a = ease.inExpo(prog(d, -0.4, 0.18)); // line shoots across
        const o = snapOut(prog(d, -0.22, 0.22)); // opens into a panel
        const w = brandInOut(prog(d, 0.0, 0.3)); // panel wipes up and away
        streakLine.style.transform = `scaleX(${a})`;
        streak.style.clipPath = `inset(${lerp(H / 2 - 1, 0, o)}px 0 ${lerp(H / 2 - 1, 0, o) + w * H}px 0)`;
        streak.style.background = o > 0.02 ? "var(--blue)" : "transparent";
      }
    }
    const curScene = scenes.reduce((c, s) => (t >= s.start - 0.05 ? s : c), scenes[0]);
    const darkScene = curScene && ["bigtype"].includes(curScene.def.template) && !["paper", "lime"].includes(curScene.def.props?.bg ?? "blue");
    capEl.classList.toggle("on-dark", !!darkScene && t < outroStart);
    hud.classList.toggle("on-dark", !!darkScene);

    outroEl.style.display = t >= outroStart - 0.3 ? "flex" : "none";
    if (t >= outroStart - 0.3) {
      const oi = brandInOut(prog(t, outroStart - 0.3, 0.6));
      outroEl.style.clipPath = `inset(${(1 - oi) * 100}% 0 0 0)`;
      outroUpdate(t - outroStart);
    }

    capEl.style.display = showCaptions && t > B + 0.15 && t < outroStart ? "block" : "none";
    for (const c of chunkEls) {
      const on = t >= c.start - 0.03 && t < c.until; // never two caption lines at once
      c.el.style.display = on ? "flex" : "none";
      if (!on) continue;
      const pIn = brandOut(prog(t, c.start - 0.03, 0.45));
      c.el.style.opacity = clamp(pIn * 2);
      c.el.style.transform = `translate(-50%, ${(1 - pIn) * 24}px)`;
      c.spans.forEach((sp, k) => {
        const w = c.words[k];
        const p = brandOut(prog(t, abs(w.start) - 0.04, 0.3));
        sp.style.fontVariationSettings = `"wght" ${Math.round(lerp(380, 640, p))}`;
        sp.style.color = p > 0.5 ? "var(--ink)" : "var(--cap-dim)";
        sp.classList.toggle("active", t >= abs(w.start) - 0.04 && t < abs(w.end) + 0.08);
      });
    }
  };

  window.__meta = {
    duration: total,
    fps: cfg.video.fps,
    hook: hook.cues,
    hookDuration: B,
    voiceStart,
    voiceEnd,
    outroStart,
    sceneStarts: scenes.map((s) => ({ template: s.def.template, cue: s.def.cue, start: +s.start.toFixed(3), end: +s.end.toFixed(3) })),
    estimated: !!voice.estimated,
    sfx: sfx.sort((a, b) => a.at - b.at),
  };
  await document.fonts.load('800 100px "Inter"');
  await document.fonts.load('400 40px "Inter"');
  await document.fonts.load('800 40px "Inter"', "ěščřžýáíéůú");
  await document.fonts.load('700 60px "Caveat"', "co je nového? týden úterý");
  await document.fonts.ready;
  // CSS background textures (paper) are not <img>: preload them explicitly
  await Promise.all(["../assets/plates/paper.jpg"].map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
  // photographic plates must be decoded before the first frame
  await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
  window.__setTime(0);
  document.body.dataset.ready = "1";
}

// Rough timing guess (≈14 chars/s) used only before the real voiceover exists.
function estimateVoice(ep) {
  const words = [], cues = {};
  let t = 0;
  for (const tok of (ep.script ?? "").split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^\[\[(.+?)\]\](.*)$/);
    if (m) cues[m[1]] = t;
    const text = m ? m[2] : tok;
    if (!text || /^\[.*\]$/.test(text)) continue;
    const d = Math.max(0.18, text.length / 14);
    words.push({ text, start: t, end: t + d * 0.9 });
    t += d + (/[.!?]$/.test(text) ? 0.25 : 0);
  }
  return { words, cues, duration: t, estimated: true };
}

main().catch((e) => {
  document.body.dataset.error = String(e.stack ?? e);
  console.error(e);
});
