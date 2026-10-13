// "Pro" motion vocabulary distilled from the reference reels (see docs/motion-reference.md):
//   words   – Apple-style kinetic sentence: words land one by one on the voice, line re-centres smoothly
//   stack   – pastel task cards whip in from the left and stack, title lands above
//   orbit   – ring of tiles/cards orbiting a centre line of text with depth (scale + blur by z)
//   connect – app-icon tiles linked by a drawn blue line, camera pans along it
//   fan     – rapid flicker through variants, then they fan out into an overlapping row
//   prompt  – sentence with an inline UI prompt pill that types itself
// All updates are pure functions of local time.
import { clamp, lerp, prog, ease, brandOut, brandInOut, bezier } from "./ease.js";
import { icon, letters, revealLetters } from "./scenes.js";

const h = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%]/g, "");
// Reference curves: very fast attack, long silky settle (stronger than brandOut).
export const snapOut = bezier(0.05, 0.7, 0.1, 1);
const overshoot = (p, s = 1.25) => ease.outBack(p, s);

// ---- kinetic words -------------------------------------------------------
// Each word: blur 14→0, x +40→0, scale 1.06→1, tinted (light blue) → ink; width grows 0→natural so the line re-centres.
function wordSpans(text) {
  const out = [];
  const re = /(\*\*(.+?)\*\*|__(.+?)__|(\S+))/g;
  let m;
  while ((m = re.exec(text))) {
    const w = m[2] ?? m[3] ?? m[4];
    // punctuation glued to the previous word (never its own animated word)
    if (/^[.,!?;:…]+$/.test(w) && out.length) out[out.length - 1].w += w;
    else out.push({ w, cls: m[2] ? "b" : m[3] ? "g" : "" });
  }
  return out;
}
export function kineticWords(text, cls = "") {
  return `<div class="kw-line ${cls}">${wordSpans(text).map((w) => `<span class="kw ${w.cls}"><span class="kw-i">${esc(w.w)}</span></span>`).join("")}</div>`;
}
function measureWords(root) {
  root.querySelectorAll(".kw").forEach((k) => (k.dataset.w = k.querySelector(".kw-i").getBoundingClientRect().width || k.querySelector(".kw-i").offsetWidth));
}
function timesForWords(root, ctx, fallbackStart = 0.05, stagger = 0.12) {
  const ws = [...root.querySelectorAll(".kw")];
  let from = 0, prev = null;
  return ws.map((k, i) => {
    const n = norm(k.textContent);
    // short words (i, a, v…) must match exactly, longer ones by stem (Czech endings vary)
    const stem = n.length <= 3 ? n : n.slice(0, Math.max(3, n.length - 2));
    const idx = ctx.words.findIndex((w, j) => j >= from && j < from + 6 && (n.length <= 3 ? norm(w.text) === stem : norm(w.text).startsWith(stem)));
    let tt;
    if (idx >= 0) {
      from = idx + 1;
      tt = Math.max(0, ctx.words[idx].t - 0.06);
    } else tt = prev != null ? prev + stagger : fallbackStart + i * stagger; // not spoken: ride on the previous word
    if (prev != null && tt < prev) tt = prev + 0.04;
    prev = tt;
    return tt;
  });
}
export function animateWords(root, t, times, { gap = 0.24 } = {}) {
  root.querySelectorAll(".kw").forEach((k, i) => {
    const p = snapOut(prog(t, times[i], 0.55));
    const c = brandOut(prog(t, times[i] + 0.08, 0.45));
    const inner = k.firstChild;
    const em = parseFloat(getComputedStyle(k).fontSize) || 60;
    k.style.width = `${(+k.dataset.w + gap * em) * p}px`;
    // opacity trails the width so a growing word never sits on top of its neighbour
    inner.style.opacity = clamp((p - 0.3) / 0.55);
    inner.style.filter = p < 0.995 ? `blur(${(1 - p) * 14}px)` : "none";
    inner.style.transform = `translateX(${(1 - p) * 24}px) scale(${lerp(1.06, 1, p)})`;
    if (!k.classList.contains("b") && !k.classList.contains("g")) inner.style.color = c < 1 ? `color-mix(in srgb, var(--blue-2) ${(1 - c) * 100}%, var(--ink))` : "";
  });
}

export const proTemplates = {
  // props: { text: "Tohle **mění** všechno", size: "md"|"lg"|"xl", kicker, sub }
  words(el, p, ctx) {
    el.appendChild(h(`<div class="sc sc-words">
      ${p.kicker ? `<div class="tag">${esc(p.kicker)}</div>` : ""}
      ${kineticWords(p.text ?? "", p.size ?? "lg")}
      ${p.sub ? kineticWords(p.sub, "s muted") : ""}
    </div>`));
    const [line, sub] = el.querySelectorAll(".kw-line");
    const k = el.querySelector(".tag");
    let times, subTimes;
    return (t) => {
      if (!times) {
        measureWords(el);
        times = timesForWords(line, ctx);
        if (sub) subTimes = timesForWords(sub, ctx, (times.at(-1) ?? 0) + 0.3, 0.06);
      }
      animateWords(line, t, times);
      if (sub) animateWords(sub, t, subTimes);
      if (k) {
        const q = brandOut(prog(t, 0, 0.6));
        k.style.opacity = q;
        k.style.letterSpacing = `${lerp(0.5, 0.22, q)}em`;
      }
    };
  },

  // props: { title, items: [{ title, sub, icon, tone: "blue"|"green"|"red"|"neutral", at }] }
  stack(el, p, ctx) {
    const items = p.items ?? [];
    el.appendChild(h(`<div class="sc sc-stack">
      ${p.title ? kineticWords(p.title, "md") : ""}
      <div class="st-wrap" style="height:${items.length * 196 - 24}px">${items.map((it) => `
        <div class="st-card ${it.tone ?? "blue"}"><div class="st-txt"><b>${esc(it.title)}</b>${it.sub ? `<span>${esc(it.sub)}</span>` : ""}</div><div class="st-ic">${icon(it.icon ?? "check")}</div></div>`).join("")}</div>
    </div>`));
    const cards = [...el.querySelectorAll(".st-card")], title = el.querySelector(".kw-line"), wrap = el.querySelector(".st-wrap");
    const times = items.map((it, i) => ctx.at(it.at, 0.15 + i * 0.4));
    times.forEach((tt) => ctx.sfx("card_swipe", tt - 0.05, -3));
    const H = 196;
    let tt0;
    return (t, dur) => {
      if (title && !tt0) { measureWords(el); tt0 = timesForWords(title, ctx, (times.at(-1) ?? 0) + 0.45, 0.1); }
      const n = cards.length;
      // number of cards "in" (fractional) drives the vertical centring of the stack
      let shown = 0;
      cards.forEach((c, i) => {
        const e = snapOut(prog(t, times[i], 0.6));
        shown += e;
        c.style.transform = `translate(${(1 - e) * -1100}px, ${i * H}px) skewX(${(1 - e) * -8}deg)`;
        c.style.opacity = clamp(e * 3);
        c.style.filter = e < 0.97 ? `blur(${(1 - e) * 16}px)` : "none";
      });
      const settle = brandInOut(prog(t, (times.at(-1) ?? 0) + 0.35, 0.7));
      // keep the growing stack optically centred; once complete it settles and the title lands above
      wrap.style.transform = `translateY(${(n - Math.max(1, shown)) * H / 2}px) scale(${lerp(1, 0.94, settle)})`;
      if (title) title.style.transform = `translateY(${(1 - settle) * 40}px)`;
      if (title) animateWords(title, t, tt0);
    };
  },

  // props: { text, items: [{ icon, label, tone }], radius }
  orbit(el, p, ctx) {
    const items = p.items ?? [];
    el.appendChild(h(`<div class="sc sc-orbit">
      <div class="ob-ring">${items.map((it, i) => `<div class="ob-item ${it.tone ?? (i % 2 ? "green" : "blue")}">${icon(it.icon ?? "sparkle")}${it.label ? `<span>${esc(it.label)}</span>` : ""}</div>`).join("")}</div>
      ${kineticWords(p.text ?? "", "md ob-text")}
    </div>`));
    const els = [...el.querySelectorAll(".ob-item")], line = el.querySelector(".kw-line");
    const R = p.radius ?? 380, n = els.length;
    let tw;
    ctx.sfx("reveal_shimmer", 0.1, -6);
    return (t) => {
      if (!tw) { measureWords(el); tw = timesForWords(line, ctx, 0.25, 0.1); }
      els.forEach((e, i) => {
        const at = 0.05 + i * 0.06;
        const q = snapOut(prog(t, at, 0.9));
        const a = (i / n) * Math.PI * 2 + t * 0.32 - (1 - q) * 1.2;
        const r = R * lerp(2.1, 1, q);
        const z = Math.sin(a); // -1 back .. 1 front
        const x = Math.cos(a) * r, y = z * r * 0.52;
        const s = lerp(0.72, 1.12, (z + 1) / 2);
        e.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
        e.style.zIndex = String(Math.round((z + 1) * 50));
        e.style.filter = `blur(${Math.max(0, -z) * 5 + (1 - q) * 14}px)`;
        e.style.opacity = clamp(q * 2) * lerp(0.55, 1, (z + 1) / 2);
      });
      animateWords(line, t, tw);
    };
  },

  // props: { items: [{ icon, label, tone, at }] } – tiles on a zig-zag path, blue line draws between them, camera follows
  connect(el, p, ctx) {
    const items = p.items ?? [];
    const pts = items.map((_, i) => ({ x: 450 + (i % 2 ? 230 : -230), y: 260 + i * 360 }));
    const d = pts.map((pt, i) => {
      if (!i) return `M ${pt.x - 520} ${pt.y - 260} C ${pt.x - 300} ${pt.y - 300} ${pt.x - 200} ${pt.y} ${pt.x} ${pt.y}`;
      const a = pts[i - 1];
      return `C ${a.x} ${a.y + 260} ${pt.x} ${pt.y - 260} ${pt.x} ${pt.y}`;
    }).join(" ");
    el.appendChild(h(`<div class="sc sc-connect"><div class="cn-world">
      <svg class="cn-line" viewBox="0 0 900 ${pts.at(-1).y + 400}" style="height:${pts.at(-1).y + 400}px"><path pathLength="1" d="${d}"/><circle r="12" class="cn-dot"/></svg>
      ${items.map((it, i) => `<div class="cn-tile ${it.tone ?? (i % 2 ? "green" : "blue")}" style="left:${pts[i].x - 130}px;top:${pts[i].y - 130}px">${icon(it.icon ?? "sparkle")}${it.label ? `<span>${esc(it.label)}</span>` : ""}</div>`).join("")}
    </div></div>`));
    const world = el.querySelector(".cn-world"), path = el.querySelector(".cn-line path"), dot = el.querySelector(".cn-dot");
    const tiles = [...el.querySelectorAll(".cn-tile")];
    const times = items.map((it, i) => ctx.at(it.at, 0.4 + i * 0.8));
    times.forEach((tt) => ctx.sfx("ui_pop", tt, -3));
    return (t) => {
      // progress along the path reaches tile i at times[i]
      let seg = 0;
      for (let i = 0; i < times.length; i++) if (t >= times[i] - 0.45) seg = i;
      const segStart = seg === 0 ? -0.1 : times[seg - 1], segEnd = times[seg];
      const local = brandInOut(prog(t, segStart, Math.max(0.2, segEnd - segStart)));
      const pp = (seg + local) / items.length;
      path.style.strokeDasharray = "1 1";
      path.style.strokeDashoffset = String(1 - pp);
      const total = path.getTotalLength();
      const pt = path.getPointAtLength(total * clamp(pp));
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
      // camera rides the head of the line
      world.style.transform = `translate(${(450 - pt.x) * 0.3}px, ${490 - Math.max(pts[0].y, pt.y)}px)`;
      tiles.forEach((tile, i) => {
        const q = prog(t, times[i] - 0.05, 0.5);
        tile.style.transform = `scale(${q > 0 ? overshoot(q, 1.4) : 0})`;
        tile.style.opacity = clamp(q * 3);
        tile.style.filter = q < 0.6 ? `blur(${(0.6 - q) * 16}px)` : "none";
      });
    };
  },

  // props: { title, items: [{ title, value, tone }], flick: 0.11 }
  fan(el, p, ctx) {
    const items = p.items ?? [];
    el.appendChild(h(`<div class="sc sc-fan">
      ${p.title ? kineticWords(p.title, "md") : ""}
      <div class="fan-wrap">${items.map((it, i) => `<div class="fan-card ${it.tone ?? ["blue", "green", "ink", "paper"][i % 4]}"><span>${esc(it.title ?? "")}</span><b>${esc(it.value ?? "")}</b></div>`).join("")}</div>
    </div>`));
    const cards = [...el.querySelectorAll(".fan-card")], title = el.querySelector(".kw-line");
    const n = cards.length, flick = p.flick ?? 0.11, mid = (n - 1) / 2;
    const tFan = 0.15 + n * flick;
    ctx.sfx("ui_pop", 0.1, -6);
    ctx.sfx("transition_swish", tFan, -4);
    let tw;
    return (t) => {
      if (title && !tw) { measureWords(el); tw = timesForWords(title, ctx, tFan + 0.3, 0.08); }
      const cur = Math.min(n - 1, Math.floor(Math.max(0, t - 0.15) / flick));
      const f = snapOut(prog(t, tFan, 0.8));
      cards.forEach((c, i) => {
        const flickVis = t < tFan ? (i === cur ? 1 : 0) : 1;
        const x = (i - mid) * 205 * f, r = (i - mid) * 3 * f, s = lerp(1.15, 1 - Math.abs(i - mid) * 0.06, f);
        c.style.opacity = clamp(Math.max(flickVis, f * 1.5)) * clamp((t - 0.1) * 8);
        c.style.transform = `translateX(${x}px) rotate(${r}deg) scale(${s})`;
        c.style.zIndex = String(100 - Math.round(Math.abs(i - mid) * 10));
        c.style.filter = t < tFan && i === cur ? `blur(${(1 - prog(t, 0.15 + i * flick, flick * 0.8)) * 6}px)` : "none";
      });
      if (title) animateWords(title, t, tw);
    };
  },

  // props: { before: "Napiš", typed: "s jedním promptem…", after: "a hotovo", typeAt, typeSpeed }
  prompt(el, p, ctx) {
    el.appendChild(h(`<div class="sc sc-prompt"><div class="pr-line">
      ${kineticWords(p.before ?? "", "md")}
      <div class="pr-pill"><span class="pr-txt"></span><i class="pr-caret"></i><b class="pr-send">${icon("arrow")}</b></div>
      ${kineticWords(p.after ?? "", "md")}
    </div></div>`));
    const [b, a] = el.querySelectorAll(".kw-line"), pill = el.querySelector(".pr-pill"), txt = el.querySelector(".pr-txt"), caret = el.querySelector(".pr-caret"), send = el.querySelector(".pr-send");
    const typed = p.typed ?? "", tType = ctx.at(p.typeAt, 0.5), cps = p.typeSpeed ?? 26;
    const tDone = tType + typed.length / cps;
    ctx.sfx("ui_pop", tType - 0.25, -5);
    ctx.sfx("check_tick", tDone + 0.1, -6);
    let tb, ta;
    return (t) => {
      if (!tb) { measureWords(el); tb = timesForWords(b, ctx, 0, 0.1); ta = timesForWords(a, ctx, tDone + 0.2, 0.1); }
      animateWords(b, t, tb);
      animateWords(a, t, ta);
      const w = snapOut(prog(t, tType - 0.35, 0.6));
      pill.style.width = `${lerp(80, 560, w)}px`;
      pill.style.opacity = clamp(w * 3);
      const nChars = Math.max(0, Math.min(typed.length, Math.floor((t - tType) * cps)));
      txt.textContent = typed.slice(0, nChars);
      caret.style.opacity = t < tDone + 0.3 ? (Math.floor(t * 2.6) % 2 ? 0.2 : 1) : 0;
      const sp = prog(t, tDone + 0.05, 0.35);
      send.style.transform = `scale(${1 + Math.sin(sp * Math.PI) * 0.25})`;
      send.classList.toggle("on", t > tDone);
    };
  },
};

// ===================== vocabulary from the "Claude motion reel" reference =====================
// bigtype   – full-bleed colour panel, one massive word that fills the width, outline word wallpaper
//             scrolling behind, tiny editorial meta labels in the corners
// metric    – odometer counter (digits roll with blur) + bar chart growing + donut ring
// particles – streak particles flow in, condense into a ring of dots, then burst outward; text lands
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

Object.assign(proTemplates, {
  // props: { word, bg: "blue"|"lime"|"ink"|"paper", meta: ["…", "…"], sub, pattern: true }
  bigtype(el, p, ctx) {
    const word = String(p.word ?? "").toUpperCase();
    const rows = Array.from({ length: 9 }, (_, i) => `<div class="bt-row" style="top:${i * 13}%">${(word + " ").repeat(8)}</div>`).join("");
    el.classList.add("full");
    el.appendChild(h(`<div class="bt bt-${p.bg ?? "blue"}">
      ${p.pattern === false ? "" : `<div class="bt-pattern">${rows}</div>`}
      <div class="bt-meta tl">${esc(p.meta?.[0] ?? "")}</div><div class="bt-meta tr">${esc(p.meta?.[1] ?? "")}</div>
      <div class="bt-word">${[...word].map((c) => `<span class="bt-ch"><i>${esc(c)}</i></span>`).join("")}</div>
      ${p.sub ? `<div class="bt-sub">${esc(p.sub)}</div>` : ""}
    </div>`));
    const wEl = el.querySelector(".bt-word"), chs = [...el.querySelectorAll(".bt-ch i")], pat = el.querySelectorAll(".bt-row"), sub = el.querySelector(".bt-sub"), metas = el.querySelectorAll(".bt-meta");
    ctx.sfx("hook_impact", 0.02, -9);
    let fitted = false;
    return (t, dur) => {
      if (!fitted) {
        // fit the word to the frame width
        const w = wEl.scrollWidth || 1;
        wEl.style.fontSize = `${Math.min(520, (parseFloat(getComputedStyle(wEl).fontSize) * 960) / w)}px`;
        fitted = true;
      }
      chs.forEach((c, i) => {
        const q = snapOut(prog(t, 0.04 + i * 0.035, 0.6));
        c.style.transform = `translateY(${(1 - q) * 105}%)`;
      });
      const drift = t * 60;
      pat.forEach((r, i) => (r.style.transform = `translateX(${(i % 2 ? -1 : 1) * drift - 400}px)`));
      metas.forEach((m) => (m.style.opacity = brandOut(prog(t, 0.2, 0.5))));
      wEl.style.transform = `scale(${1 + t * 0.02})`;
      if (sub) {
        const q = snapOut(prog(t, 0.45, 0.6));
        sub.style.opacity = q;
        sub.style.transform = `translateY(${(1 - q) * 30}px)`;
      }
    };
  },

  // props: { value: 312, prefix: "+", suffix: "%", label, bars: [..], donut: 0.7, donutLabel }
  metric(el, p, ctx) {
    const val = Math.round(Number(p.value ?? 0));
    const digits = String(val).split("");
    const bars = p.bars ?? [2, 3, 3, 4, 5, 5, 6, 8, 9, 12];
    const maxB = Math.max(...bars);
    el.appendChild(h(`<div class="sc sc-metric">
      ${p.label ? `<div class="tag">${esc(p.label)}</div>` : ""}
      <div class="mt-num">${p.prefix ? `<span class="mt-fix">${esc(p.prefix)}</span>` : ""}${digits.map(() => `<span class="mt-d"><span class="mt-col">${"0123456789".split("").map((d) => `<i>${d}</i>`).join("")}</span></span>`).join("")}<span class="mt-fix b">${esc(p.suffix ?? "")}</span></div>
      <div class="mt-row">
        ${p.donut != null ? `<div class="mt-donut"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" class="bgc"/><circle pathLength="1" cx="60" cy="60" r="50" class="fg"/></svg><b>${Math.round(p.donut * 100)}%</b>${p.donutLabel ? `<span>${esc(p.donutLabel)}</span>` : ""}</div>` : ""}
        <div class="mt-bars">${bars.map((b, i) => `<i style="height:${(b / maxB) * 100}%" class="${i === bars.length - 1 ? "hi" : ""}"></i>`).join("")}</div>
      </div>
    </div>`));
    const cols = [...el.querySelectorAll(".mt-col")], barEls = [...el.querySelectorAll(".mt-bars i")], ring = el.querySelector(".mt-donut .fg");
    const k = el.querySelector(".tag");
    ctx.sfx("bar_rise", 0.1, -3);
    ctx.sfx("check_tick", 1.25, -6);
    return (t) => {
      if (k) { const q = brandOut(prog(t, 0, 0.5)); k.style.opacity = q; }
      // odometer: each digit rolls through 0-9 (more turns for lower digits) and lands at its value with blur
      cols.forEach((c, i) => {
        const target = +digits[i];
        const turns = (digits.length - i) * 1 + 1;
        const q = snapOut(prog(t, 0.1 + i * 0.06, 1.15));
        const pos = (turns * 10 + target) * q;
        const speed = (1 - q);
        c.style.transform = `translateY(${-(pos % 10) * 10}%)`;
        c.style.filter = speed > 0.05 ? `blur(${speed * 8}px)` : "none";
      });
      barEls.forEach((b, i) => (b.style.transform = `scaleY(${snapOut(prog(t, 0.3 + i * 0.05, 0.7))})`));
      if (ring) { ring.style.strokeDasharray = "1 1"; ring.style.strokeDashoffset = String(1 - (p.donut ?? 0) * brandInOut(prog(t, 0.4, 1.0))); }
    };
  },

  // props: { text, count: 900 }
  particles(el, p, ctx) {
    el.classList.add("full");
    el.appendChild(h(`<div class="pt"><canvas width="1080" height="1920"></canvas>${p.text ? kineticWords(p.text, "lg pt-text") : ""}</div>`));
    const cv = el.querySelector("canvas"), g = cv.getContext("2d"), line = el.querySelector(".kw-line");
    const rnd = seeded(7), N = p.count ?? 900;
    const parts = Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2, r0: 1200 + rnd() * 900, a0: rnd() * Math.PI * 2, ring: 330 + (i % 3) * 26, sw: rnd(), hue: rnd() < 0.18 ? 1 : rnd() < 0.3 ? 2 : 0 }));
    const T1 = 1.0, T2 = 1.55; // condense, burst
    ctx.sfx("hook_riser", T1 - 0.6, -6);
    ctx.sfx("hook_impact", T2, -4);
    let tw;
    const pos = (q, tt) => {
      const c = snapOut(prog(tt, 0, T1)), b = ease.inExpo(prog(tt, T2, 0.5));
      const ang = lerp(q.a0 + tt * 0.6, q.a + tt * 0.25, c);
      const r = lerp(q.r0, q.ring, c) + b * (900 + q.sw * 1200);
      return [540 + Math.cos(ang) * r, 860 + Math.sin(ang) * r * (1 - 0.0 * c)];
    };
    return (t) => {
      if (line && !tw) { measureWords(el); tw = timesForWords(line, ctx, T2 + 0.15, 0.09); }
      g.clearRect(0, 0, 1080, 1920);
      g.lineCap = "round";
      for (const q of parts) {
        const [x, y] = pos(q, t), [x0, y0] = pos(q, Math.max(0, t - 0.06));
        g.strokeStyle = q.hue === 1 ? "rgba(47,107,237,.95)" : q.hue === 2 ? "rgba(127,216,88,.95)" : "rgba(37,42,53,.8)";
        g.lineWidth = 2.2 + q.sw * 1.8;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x + 0.01, y); g.stroke();
      }
      if (line) animateWords(line, t, tw);
    };
  },
});
