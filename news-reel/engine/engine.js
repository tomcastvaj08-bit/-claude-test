// Reel engine: hook (calendar) + explainer scenes + captions + outro on one timeline.
// The renderer calls window.__setTime(t) for every (sub)frame and screenshots the page.
import { clamp, lerp, prog, ease, spring, brandOut, brandInOut, bezier } from "./ease.js";
import { buildHook, parseDate } from "./hook.js";
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

  // ---------- background: paper, fine grid, grain
  const bg = document.createElement("div");
  bg.className = "bg";
  bg.innerHTML = `<div class="hair hv"></div><div class="hair hh"></div><div class="hair hh2"></div>
    <div class="blob bb"></div><div class="blob bg2"></div>
    <div class="cross"><i></i><i></i></div>
    <div class="sphere blue s1"></div><div class="sphere green s2"></div>`;
  stage.appendChild(bg);
  const glows = [...bg.querySelectorAll(".blob")];
  const spheres = [...bg.querySelectorAll(".sphere")];
  const cross = bg.querySelector(".cross");

  // ---------- hook
  const hookRoot = document.createElement("div");
  stage.appendChild(hookRoot);
  const hook = buildHook(hookRoot, ep, cfg);
  const B = hook.duration;
  const voiceStart = B + (cfg.audio.voiceStartOffset ?? 0);
  const voiceEnd = voiceStart + voice.duration;
  const outroStart = voiceEnd + 0.25;
  const total = outroStart + OUTRO;
  const abs = (sec) => voiceStart + sec;

  // ---------- camera layer (everything in the body sits on it; slow drift = "virtual camera")
  const cam = document.createElement("div");
  cam.className = "cam";
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
  addSfx("hook_swell", 0, -4);
  addSfx("synth_riser", hc.impact - 2.4 + 0.04, -8);
  addSfx("hook_riser", hc.impact - 1.04, -3);
  addSfx("hook_rewind", hc.ticks[0] ?? hc.riser[0], -6);
  hc.ticks.forEach((t) => addSfx("tick", t, -14));
  addSfx("hook_impact", hc.impact, 0);
  addSfx("hook_dive", hc.whoosh - 0.1, -3);
  addSfx("reveal_shimmer", B - 0.25, -8);
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
  const showCaptions = ep.captions !== false;

  // ---------- frame update
  window.__setTime = (t) => {
    const inBody = t > B - 0.6;
    bg.style.display = inBody ? "block" : "none";
    glows.forEach((g, i) => {
      const a = t * (0.18 + i * 0.05) + i * 2.4;
      g.style.transform = `translate(${Math.cos(a) * 120}px, ${Math.sin(a * 1.2) * 160}px)`;
    });
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
      s.el.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
      s.el.style.filter = bl > 0.2 ? `blur(${bl}px)` : "none";
      s.update(Math.min(local, dur + OUT), dur);
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
        streak.style.clipPath = `inset(${lerp(959, 0, o)}px 0 ${lerp(959, 0, o) + w * 1920}px 0)`;
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
  await document.fonts.ready;
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
