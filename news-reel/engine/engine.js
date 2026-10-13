// Reel engine: hook (calendar) + explainer scenes + kinetic captions on one timeline.
// The renderer calls window.__setTime(t) for every frame and screenshots the page.
import { clamp, lerp, prog, ease, spring, appleEase, inOut, bezier } from "./ease.js";
import { buildHook, MONTHS_GEN, parseDate } from "./hook.js";
import { templates, icon } from "./scenes.js";

const W = 1080, H = 1920;
const lib = { clamp, lerp, prog, ease, spring, appleEase, inOut, bezier, icon };
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");

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
  const epDir = q.get("ep"); // e.g. ../episodes/2026-10-13-01
  const cfg = await loadJSON("../config.json");
  const ep = await loadJSON(`${epDir}/episode.json`);
  // words.json is produced by scripts/tts.mjs; before TTS exists use a rough estimate so layout can be previewed
  const voice = await loadJSON(`${epDir}/build/words.json`, null) ?? estimateVoice(ep);

  document.documentElement.style.setProperty("--accent", cfg.series.accent);
  const stage = document.getElementById("stage");

  // ---------- background (continuous)
  const bg = document.createElement("div");
  bg.className = "bg";
  bg.innerHTML = `<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="dots"></div><div class="vignette"></div>`;
  stage.appendChild(bg);
  const blobs = [...bg.querySelectorAll(".blob")];

  // ---------- hook
  const hookRoot = document.createElement("div");
  stage.appendChild(hookRoot);
  const hook = buildHook(hookRoot, ep, cfg);
  const B = hook.duration;
  const voiceStart = B + (cfg.audio.voiceStartOffset ?? 0);
  const total = voiceStart + voice.duration + (cfg.video.tailSeconds ?? 0.5);
  const abs = (sec) => voiceStart + sec;

  // ---------- persistent series badge (body)
  const news = parseDate(ep.newsDate);
  const badge = document.createElement("div");
  badge.className = "series-badge";
  badge.innerHTML = `<span class="sb-dot"></span><b>${cfg.series.brand} ${cfg.series.title}</b><span class="sb-sep"></span><span>${news.getUTCDate()}. ${MONTHS_GEN[news.getUTCMonth()]}</span>`;
  stage.appendChild(badge);

  // ---------- scenes
  const words = voice.words.filter((w) => !/^\[.*\]$/.test(w.text));
  const cueTime = (name) => (voice.cues?.[name] != null ? abs(voice.cues[name]) : null);
  const sceneDefs = ep.scenes ?? [];
  const starts = sceneDefs.map((s, i) => {
    if (i === 0) return B;
    const c = typeof s.cue === "number" ? abs(s.cue) : cueTime(s.cue);
    if (c == null) console.warn(`missing cue ${s.cue}`);
    return c ?? B + (i * (total - B)) / sceneDefs.length;
  });
  const scenes = sceneDefs.map((def, i) => {
    const el = document.createElement("div");
    el.className = `scene scene-${def.template}`;
    stage.appendChild(el);
    const start = starts[i];
    const end = i + 1 < sceneDefs.length ? starts[i + 1] : total;
    const local = words.filter((w) => abs(w.start) >= start - 0.05 && abs(w.start) < end).map((w) => ({ ...w, t: abs(w.start) - start }));
    const ctx = {
      lib, accent: cfg.series.accent, handle: cfg.series.handle, words: local, cues: voice.cues,
      // resolve a timing reference to local scene seconds
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
    const update = tpl(el, def.props ?? {}, ctx);
    return { el, start, end, update, def };
  });

  // body intro wipe (red -> dark)
  const wipe = document.createElement("div");
  wipe.className = "wipe";
  stage.appendChild(wipe);

  // ---------- captions
  const capEl = document.createElement("div");
  capEl.className = "captions";
  stage.appendChild(capEl);
  const chunks = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const chars = cur.reduce((n, x) => n + x.text.length, 0);
    const next = words[i + 1];
    const gap = next ? next.start - w.end : 1;
    if (cur.length >= 3 || chars > 16 || /[.,!?;:–]$/.test(w.text) || gap > 0.35 || !next) {
      chunks.push(cur);
      cur = [];
    }
  });
  const chunkEls = chunks.map((c) => {
    const d = document.createElement("div");
    d.className = "cap";
    d.innerHTML = c.map((w) => `<span>${w.text.replace(/[.,;:]$/, "")}</span>`).join(" ");
    capEl.appendChild(d);
    return { el: d, words: c, spans: [...d.children], start: abs(c[0].start), end: abs(c[c.length - 1].end) };
  });
  chunkEls.forEach((c, i) => (c.until = i + 1 < chunkEls.length ? Math.min(chunkEls[i + 1].start - 0.05, c.end + 0.6) : c.end + 0.4));
  const showCaptions = ep.captions !== false;

  // ---------- frame update
  window.__setTime = (t) => {
    // background drift
    blobs.forEach((b, i) => {
      const a = t * (0.25 + i * 0.07) + i * 2.1;
      b.style.transform = `translate(${Math.cos(a) * 140}px, ${Math.sin(a * 1.3) * 180}px) scale(${1 + 0.15 * Math.sin(a * 0.7)})`;
    });
    bg.style.opacity = t < B - 0.3 ? 0 : 1;

    hook.update(t);

    const wp = bezier(0.7, 0, 0.2, 1)(prog(t, B - 0.02, 0.6));
    wipe.style.display = t >= B - 0.02 && wp < 1 ? "block" : "none";
    wipe.style.transform = `translateY(${-wp * 100}%)`;

    const bIn = appleEase(prog(t, B + 0.3, 0.5));
    badge.style.opacity = bIn;
    badge.style.transform = `translate(-50%, ${lerp(-30, 0, bIn)}px)`;

    for (const s of scenes) {
      const local = t - s.start, dur = s.end - s.start;
      const OUT = 0.28;
      const vis = local >= 0 && local < dur + OUT;
      s.el.style.display = vis ? "block" : "none";
      if (!vis) continue;
      const i = appleEase(prog(local, 0, 0.35));
      const o = ease.inCubic(prog(local, dur, OUT));
      s.el.style.opacity = Math.min(i, 1 - o);
      s.el.style.transform = `scale(${lerp(0.94, 1, i) * lerp(1, 1.06, o)})`;
      s.el.style.filter = o > 0 ? `blur(${o * 14}px)` : i < 1 ? `blur(${(1 - i) * 10}px)` : "none";
      s.update(Math.min(local, dur), dur);
    }

    // captions only once the red wipe has cleared
    capEl.style.display = showCaptions && t > B + 0.2 ? "block" : "none";
    capEl.style.opacity = appleEase(prog(t, B + 0.2, 0.25));
    for (const c of chunkEls) {
      const on = t >= c.start - 0.05 && t < c.until;
      c.el.style.display = on ? "flex" : "none";
      if (!on) continue;
      const pIn = spring(t - c.start + 0.05, { stiffness: 320, damping: 20 });
      c.el.style.transform = `translate(-50%, 0) scale(${lerp(0.85, 1, clamp(pIn))})`;
      c.spans.forEach((sp, k) => {
        const w = c.words[k];
        const said = t >= abs(w.start) - 0.02;
        const active = said && t < abs(w.end) + 0.05;
        sp.classList.toggle("said", said);
        sp.classList.toggle("active", active);
      });
    }
  };

  // metadata for the renderer (SFX placement, duration)
  window.__meta = {
    duration: total,
    fps: cfg.video.fps,
    hook: hook.cues,
    hookDuration: B,
    voiceStart,
    sceneStarts: scenes.map((s) => ({ template: s.def.template, cue: s.def.cue, start: s.start })),
    estimated: !!voice.estimated,
  };
  await document.fonts.ready;
  window.__setTime(0);
  document.body.dataset.ready = "1";
}

// Rough timing guess (≈14 chars/s) used only before the real voiceover exists.
function estimateVoice(ep) {
  const raw = ep.script ?? "";
  const words = [];
  const cues = {};
  let t = 0;
  for (const tok of raw.split(/\s+/).filter(Boolean)) {
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
