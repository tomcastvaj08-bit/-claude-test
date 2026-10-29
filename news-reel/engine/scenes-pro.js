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
        wEl.style.fontSize = `${Math.min((window.__H ?? 1920) * 0.3, 520, (parseFloat(getComputedStyle(wEl).fontSize) * (window.__W ?? 1080) * 0.8) / w)}px`;
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
  // 3D iPhone (Apple style): the phone flies in on a 3D arc, settles at a slight angle and slowly turns;
  // on its screen an Apple Notes page is TYPED (heading + checklist), keys pop on the keyboard.
  // props: { kicker, title, sub, app, heading, items:[{text, at, done}] }
  iphone(el, p, ctx) {
    const items = p.items ?? [];
    const KB = ["qwertzuiop", "asdfghjkl", "yxcvbnm"];
    el.appendChild(h(`<div class="sc sc-iphone ${p.side === "left" ? "left" : ""}">
      <div class="ip-copy">
        ${p.kicker ? `<div class="tag">${esc(p.kicker)}</div>` : ""}
        ${p.title ? kineticWords(p.title, "md") : ""}
        ${p.sub ? kineticWords(p.sub, "s muted") : ""}
      </div>
      <div class="ip-stage"><div class="ip-shadow"></div><div class="ip">
        ${Array.from({ length: 12 }, (_, k) => `<i class="ip-edge" style="transform:translateZ(${-k * 2.3}px)"></i>`).join("")}
        <i class="ip-btn b1"></i><i class="ip-btn b2"></i><i class="ip-btn b3"></i>
        <div class="ip-front"><div class="ip-screen">
          <div class="ip-status"><b>9:41</b><span class="ip-icons"><i class="sig"></i><i class="wifi"></i><i class="bat"></i></span></div>
          <div class="ip-island"></div>
          <div class="ip-nav"><span>‹ ${esc(p.app ?? "Poznámky")}</span><span>Hotovo</span></div>
          <div class="ip-note">
            <div class="ip-h"><span class="ty"></span></div>
            <div class="ip-date">${esc(p.date ?? "dnes 9:41")}</div>
            ${items.map(() => `<div class="ip-li"><i class="ip-cb"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></i><span class="ty"></span></div>`).join("")}
          </div>
          <div class="ip-kb">${KB.map((r, ri) => `<div class="ip-row r${ri}">${ri === 2 ? '<i class="k wide">⇧</i>' : ""}${[...r].map((c) => `<i class="k" data-k="${c}">${c}</i>`).join("")}${ri === 2 ? '<i class="k wide">⌫</i>' : ""}</div>`).join("")}
            <div class="ip-row r3"><i class="k wide">123</i><i class="k space" data-k=" ">mezera</i><i class="k wide ret">↵</i></div></div>
          <div class="ip-home"></div>
        </div><div class="ip-glare"></div></div>
      </div></div>
    </div>`));
    const phone = el.querySelector(".ip"), shadow = el.querySelector(".ip-shadow"), glare = el.querySelector(".ip-glare");
    const typers = [...el.querySelectorAll(".ty")], lis = [...el.querySelectorAll(".ip-li")], cbs = [...el.querySelectorAll(".ip-cb")];
    const keys = [...el.querySelectorAll(".k[data-k]")];
    const copy = el.querySelector(".ip-copy"), tag = copy.querySelector(".tag"), [line, sub] = copy.querySelectorAll(".kw-line");
    const strip = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    // typing schedule: heading right after the phone lands, each item on its spoken word
    const CPS = 26;
    const texts = [p.heading ?? "", ...items.map((it) => it.text)];
    const starts = [0.55, ...items.map((it, i) => Math.max(0.55 + texts[0].length / CPS + 0.1 + i * 0.15, ctx.at(it.at, 1.2 + i * 0.6) - 0.1))];
    ctx.sfx("phone_slide", -0.15, -3);
    ctx.sfx("phone_typing", 0.5, -10);
    items.forEach((it, i) => it.done && ctx.sfx("check_tick", starts[i + 1] + it.text.length / CPS + 0.05, -6));
    let tLine, tSub;
    return (t, dur) => {
      if (!tLine && line) { measureWords(el); tLine = timesForWords(line, ctx, 0.15, 0.1); if (sub) tSub = timesForWords(sub, ctx, (tLine.at(-1) ?? 0) + 0.3, 0.06); }
      if (line) animateWords(line, t, tLine);
      if (sub) animateWords(sub, t, tSub);
      if (tag) { const q = brandOut(prog(t, 0, 0.6)); tag.style.opacity = q; tag.style.letterSpacing = `${lerp(0.5, 0.22, q)}em`; }
      // phone: 3D arc in, then a slow turntable drift + float
      const e = snapOut(prog(t, -0.1, 1.0)), d = brandInOut(prog(t, 0.6, Math.max(1, dur)));
      const side = p.side === "left" ? -1 : 1; // phone on the left faces right (mirrored turn)
      const ry = (lerp(-62, -20, e) + d * 14) * side, rx = lerp(38, 7, e) - d * 2, rz = lerp(14, 2.5, e) * side;
      const ty = (1 - e) * 900 + Math.sin(t * 1.4) * 8;
      phone.style.transform = `translateY(${ty}px) translateZ(${(1 - e) * -400}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
      shadow.style.opacity = String(0.55 * e);
      shadow.style.transform = `translateX(${-ry * 1.6}px) scale(${lerp(0.6, 1, e)}, 1)`;
      glare.style.backgroundPosition = `${lerp(-40, 140, (ry * side + 62) / 76)}% 0`;
      // typing
      let active = null;
      typers.forEach((ty, i) => {
        const txt = texts[i] ?? "", n = Math.max(0, Math.min(txt.length, Math.floor((t - starts[i]) * CPS)));
        ty.textContent = txt.slice(0, n);
        const typing = t >= starts[i] && n < txt.length;
        ty.classList.toggle("caret", typing || (n === txt.length && i === typers.length - 1 && t < starts[i] + txt.length / CPS + 0.8 && Math.floor(t * 2.2) % 2 === 0));
        if (typing) active = strip(txt[n] ?? "");
        if (i > 0) {
          const li = lis[i - 1], q = brandOut(prog(t, starts[i] - 0.15, 0.35));
          li.style.opacity = String(q); li.style.transform = `translateY(${(1 - q) * 14}px)`;
          const done = items[i - 1].done && t >= starts[i] + txt.length / CPS + 0.05;
          cbs[i - 1].classList.toggle("on", !!done);
          cbs[i - 1].style.transform = `scale(${done ? 1 + 0.25 * Math.sin(Math.PI * clamp((t - starts[i] - txt.length / CPS - 0.05) / 0.25)) : 1})`;
        }
      });
      keys.forEach((k) => k.classList.toggle("down", active != null && k.dataset.k === active));
    };
  },

  particles(el, p, ctx) {
    el.classList.add("full");
    el.appendChild(h(`<div class="pt"><canvas width="${window.__W ?? 1080}" height="${window.__H ?? 1920}"></canvas>${p.text ? kineticWords(p.text, "lg pt-text") : ""}</div>`));
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
      const FW = window.__W ?? 1080, FH = window.__H ?? 1920, k = (Math.min(FW, FH) / 1080) * (FW > FH ? 0.82 : 1);
      return [FW / 2 + Math.cos(ang) * r * k, FH * (FW > FH ? 0.5 : 0.45) + Math.sin(ang) * r * k];
    };
    return (t) => {
      if (line && !tw) { measureWords(el); tw = timesForWords(line, ctx, T2 + 0.15, 0.09); }
      g.clearRect(0, 0, window.__W ?? 1080, window.__H ?? 1920);
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

// ===================== computer use: the AI drives a desktop app =====================
// desktop – an app window in 3D; a vision scan finds the UI (detection boxes), then an AI cursor
//           glides on curved paths, clicks (ripple), types into fields, the user's task types into
//           a prompt bar and the cursor finishes the form on its own (green button + toast).
// props: { title, app, heading, fields: [{label, value}], button, task, toast,
//          steps: [{label, at}], lookAt, moveAt, clickAt, typeAt, taskAt, doneAt }
Object.assign(proTemplates, {
  desktop(el, p, ctx) {
    const fields = p.fields ?? [];
    const steps = p.steps ?? [];
    // window-local layout (px) – fixed so the cursor path can target it without measuring
    const FX = 250, FW = 470, FH = 64, FY = (i) => 178 + i * 100, BY = 178 + fields.length * 100 + 4;
    el.appendChild(h(`<div class="sc sc-desk">
      <div class="dk3d"><div class="dk">
        <div class="dk-bar"><i></i><i></i><i></i><span>${esc(p.app ?? "")}</span></div>
        <div class="dk-side">${["", "", "", ""].map((_, i) => `<b class="${i === 1 ? "on" : ""}"></b>`).join("")}</div>
        <div class="dk-h" style="left:${FX}px;top:84px">${esc(p.heading ?? "")}</div>
        ${fields.map((f, i) => `<div class="dk-lab" style="left:${FX}px;top:${FY(i) - 34}px">${esc(f.label)}</div>
          <div class="dk-in" style="left:${FX}px;top:${FY(i)}px;width:${FW}px;height:${FH}px"><span class="ty"></span></div>`).join("")}
        <div class="dk-btn" style="left:${FX}px;top:${BY}px"><span>${esc(p.button ?? "Odeslat")}</span><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></div>
        <div class="dk-prompt"><svg class="ic" viewBox="0 0 48 48">${'<path d="M20 7 L23 17 L33 20 L23 23 L20 33 L17 23 L7 20 L17 17 Z"/>'}</svg><span class="ty"></span><b>${icon("arrow")}</b></div>
        <div class="dk-toast">${icon("check")}<span>${esc(p.toast ?? "Hotovo")}</span></div>
        <div class="dk-scan"></div>
        ${[["dk-h", 240, 72, 300, 50, "TEXT"], ...fields.map((_, i) => ["", FX - 8, FY(i) - 8, FW + 16, FH + 16, "POLE"]), ["", FX - 8, BY - 8, 236, 82, "TLAČÍTKO"]]
          .map(([, x, y, w, hh, l]) => `<div class="dk-box" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px"><em>${l}</em></div>`).join("")}
        <div class="dk-ring"></div>
        ${[3, 2, 1, 0].map((k) => `<div class="dk-cur ${k ? "ghost" : ""}" data-k="${k}"><svg viewBox="0 0 28 36"><path d="M3 2 L3 29 L10 22.5 L14.5 33 L19 31 L14.7 20.8 L24 20.8 Z"/></svg>${k ? "" : '<i class="dk-ai">AI</i>'}</div>`).join("")}
      </div></div>
      <div class="dk-copy">
        ${p.title ? kineticWords(p.title, "md") : ""}
        <div class="ph-legend">${steps.map((s, i) => `<div class="pl"><span>${String(i + 1).padStart(2, "0")}</span>${esc(s.label)}</div>`).join("")}</div>
      </div>
    </div>`));
    const win = el.querySelector(".dk"), scan = el.querySelector(".dk-scan"), boxes = [...el.querySelectorAll(".dk-box")];
    const ins = [...el.querySelectorAll(".dk-in")], tys = [...el.querySelectorAll(".dk-in .ty")];
    const btn = el.querySelector(".dk-btn"), prompt = el.querySelector(".dk-prompt"), ptxt = prompt.querySelector(".ty"), toast = el.querySelector(".dk-toast");
    const ring = el.querySelector(".dk-ring"), curs = [...el.querySelectorAll(".dk-cur")];
    const leg = [...el.querySelectorAll(".pl")], title = el.querySelector(".kw-line");
    const tLook = ctx.at(p.lookAt, 1.0), tMove = ctx.at(p.moveAt, tLook + 1.2), tClick = ctx.at(p.clickAt, tMove + 0.8);
    const tType = Math.max(tClick + 0.25, ctx.at(p.typeAt, tClick + 0.6)), tTask = ctx.at(p.taskAt, tType + 0.8);
    const task = p.task ?? "", TCPS = 40, tTaskDone = tTask + task.length / TCPS;
    const tDone = Math.max(ctx.at(p.doneAt, tTaskDone + 1.4), tTaskDone + 0.1 + Math.max(0, fields.length - 1) * 0.38 + 0.3);
    const stepT = steps.map((s, i) => ctx.at(s.at, 0.8 + i * 0.9));
    // cursor keyframes: arrive at {x,y} at t after a curved glide of d seconds; click on arrival
    const fx = (i) => [FX + 54, FY(i) + FH / 2];
    const K = [{ t: tMove - 0.6, x: 1010, y: 700, d: 0 }, { t: tClick, x: fx(0)[0], y: fx(0)[1], d: Math.max(0.5, tClick - tMove + 0.15), click: true }];
    let tf = tTaskDone + 0.1;
    const typeAt = [tType];
    for (let i = 1; i < fields.length; i++) { K.push({ t: tf + 0.36, x: fx(i)[0], y: fx(i)[1], d: 0.36, click: true }); typeAt.push(tf + 0.42); tf += 0.38; }
    K.push({ t: tDone, x: FX + 120, y: BY + 33, d: Math.max(0.3, Math.min(0.55, tDone - tf)), click: true });
    const bend = [0, -0.22, 0.18, -0.16, 0.2, -0.18];
    const at = (t) => {
      let k = 0;
      while (k + 1 < K.length && t >= K[k + 1].t - K[k + 1].d) k++;
      const a = K[k], b = K[k + 1];
      if (!b || t <= b.t - b.d) return [a.x, a.y];
      const s = brandInOut(prog(t, b.t - b.d, b.d)), dx = b.x - a.x, dy = b.y - a.y, bn = bend[(k + 1) % bend.length];
      const c1 = [a.x + dx * 0.3 - dy * bn, a.y + dy * 0.3 + dx * bn], c2 = [a.x + dx * 0.75 - dy * bn * 0.5, a.y + dy * 0.75 + dx * bn * 0.5];
      const u = 1 - s, B = (p0, p1, p2, p3) => u * u * u * p0 + 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s * p3;
      return [B(a.x, c1[0], c2[0], b.x), B(a.y, c1[1], c2[1], b.y)];
    };
    const clicks = K.filter((k) => k.click).map((k) => k.t);
    const vals = fields.map((f) => f.value ?? "");
    ctx.sfx("phone_slide", -0.1, -6);
    ctx.sfx("reveal_shimmer", tLook - 0.05, -10);
    clicks.forEach((c, i) => ctx.sfx("trackpad_click", c - 0.02, i === clicks.length - 1 ? -2 : -5));
    typeAt.forEach((ta, i) => ctx.sfx("keyboard_typing", ta, -12));
    ctx.sfx("ui_pop", tTask - 0.2, -7);
    ctx.sfx("ui_chime", tDone + 0.12, -9);
    let tw;
    return (t, dur) => {
      if (title && !tw) { measureWords(el); tw = timesForWords(title, ctx, 0.2, 0.1); }
      if (title) animateWords(title, t, tw);
      // window: 3D settle, then a slow drift
      const e = snapOut(prog(t, -0.05, 1.0)), d = brandInOut(prog(t, 0.8, Math.max(1, dur)));
      win.style.transform = `translateY(${(1 - e) * 760}px) rotateY(${lerp(-30, -9, e) + d * 5}deg) rotateX(${lerp(22, 5, e)}deg) rotateZ(${(1 - e) * -6}deg)`;
      // vision scan + detection boxes
      const sc = brandInOut(prog(t, tLook - 0.1, 0.9));
      scan.style.transform = `translateY(${lerp(-40, 640, sc)}px)`;
      scan.style.opacity = String(sc > 0 && sc < 1 ? 1 : 0);
      const fadeBoxes = 1 - 0.7 * brandOut(prog(t, tMove + 0.2, 0.6)) - 0.3 * brandOut(prog(t, tDone, 0.4));
      boxes.forEach((b, i) => {
        const y = parseFloat(b.style.top), q = snapOut(prog(t, tLook - 0.1 + 0.9 * clamp(y / 640) - 0.05, 0.45));
        b.style.opacity = String(clamp(q * 1.6) * fadeBoxes);
        b.style.transform = `scale(${lerp(1.12, 1, q)})`;
      });
      // cursor + motion trail (ghosts sample the path slightly in the past)
      const vis = clamp((t - (tMove - 0.6)) * 4);
      let press = 0;
      clicks.forEach((c) => (press = Math.max(press, Math.sin(Math.PI * clamp((t - c + 0.06) / 0.2)))));
      curs.forEach((c) => {
        const k = +c.dataset.k, [x, y] = at(t - k * 0.022), [x0, y0] = at(t - k * 0.022 - 0.02);
        const v = Math.hypot(x - x0, y - y0);
        c.style.opacity = String(k ? vis * clamp(v / 10) * (0.26 - k * 0.06) : vis);
        c.style.transform = `translate(${x}px, ${y}px) scale(${k ? 1 : 1 - 0.16 * press})`;
      });
      // click ripple at the most recent click
      const lc = [...clicks].reverse().find((c) => t >= c - 0.03);
      if (lc != null) {
        const r = prog(t, lc - 0.03, 0.55), [x, y] = at(lc);
        ring.style.opacity = String((1 - r) * 0.9);
        ring.style.transform = `translate(${x}px, ${y}px) scale(${lerp(0.2, 2.2, brandOut(r))})`;
      } else ring.style.opacity = "0";
      // fields: focus on click, type the value
      ins.forEach((inp, i) => {
        const tc = i === 0 ? tClick : K[i + 1]?.t ?? 1e9, next = i + 1 < ins.length ? (K[i + 2]?.t ?? 1e9) : tDone;
        inp.classList.toggle("focus", t >= tc - 0.02 && t < next - 0.05);
        const n = Math.max(0, Math.min(vals[i].length, Math.floor((t - typeAt[i]) * (i === 0 ? 20 : 44))));
        tys[i].textContent = vals[i].slice(0, n);
        tys[i].classList.toggle("caret", t >= tc && t < next - 0.05 && Math.floor(t * 2.6) % 2 === 0);
      });
      // the user's task in the prompt bar
      const pq = snapOut(prog(t, tTask - 0.3, 0.5));
      prompt.style.opacity = String(clamp(pq * 2) * (1 - 0.75 * brandOut(prog(t, tTaskDone + 0.4, 0.4))));
      prompt.style.transform = `translateY(${(1 - pq) * 40}px) scale(${lerp(0.94, 1, pq)})`;
      ptxt.textContent = task.slice(0, Math.max(0, Math.min(task.length, Math.floor((t - tTask) * TCPS))));
      prompt.classList.toggle("sent", t > tTaskDone + 0.05);
      // button + toast
      btn.classList.toggle("on", t >= tDone + 0.05);
      btn.style.transform = `scale(${1 - 0.06 * Math.sin(Math.PI * clamp((t - tDone + 0.04) / 0.22))})`;
      const tq = snapOut(prog(t, tDone + 0.1, 0.55));
      toast.style.opacity = String(clamp(tq * 2));
      toast.style.transform = `translateY(${(1 - tq) * -60}px)`;
      // legend
      let idx = -1;
      stepT.forEach((s, i) => t >= s - 0.08 && (idx = i));
      leg.forEach((l, i) => {
        const a = brandOut(prog(t, stepT[i] - 0.2, 0.6));
        l.style.opacity = String(clamp(a * 1.5) * (i === idx ? 1 : 0.35));
        l.style.transform = `translateX(${(1 - a) * -40}px)`;
        l.classList.toggle("on", i === idx);
      });
    };
  },
});


// ===================== 3D vocabulary added with episode #2 =====================
// tower – isometric 3D layers: each item is a thick glass slab that drops from above onto the stack on its
//         spoken word (squash on landing, shadow tightens), the tower slowly turns; title on the left.
// globe – dotted 3D sphere flies in from deep background and spins; a text ring orbits its equator
//         (letters facing the camera are sharp, the back side fades), headline lands under it.
Object.assign(proTemplates, {
  tower(el, p, ctx) {
    const items = p.items ?? [];
    const tones = ["blue", "green", "ink", "paper"];
    el.appendChild(h(`<div class="sc sc-tower">
      <div class="tw-copy">${p.kicker ? `<div class="tag">${esc(p.kicker)}</div>` : ""}${p.title ? kineticWords(p.title, "md") : ""}</div>
      <div class="tw-stage"><div class="tw-iso">
        <i class="tw-floor"></i>
        ${items.map((it, i) => `<div class="tw-slab ${it.tone ?? tones[i % 4]}" style="--i:${i}">
          <b class="tw-side"></b><b class="tw-front"></b>
          <div class="tw-top"><span class="tw-ic">${icon(it.icon ?? "sparkle")}</span><em>${esc(it.label ?? "")}</em><i class="tw-ok">${icon("check")}</i></div>
        </div>`).join("")}
      </div></div>
    </div>`));
    const iso = el.querySelector(".tw-iso"), slabs = [...el.querySelectorAll(".tw-slab")], oks = [...el.querySelectorAll(".tw-ok")];
    const floor = el.querySelector(".tw-floor"), title = el.querySelector(".kw-line"), tagEl = el.querySelector(".tw-copy .tag");
    const T = items.map((it, i) => ctx.at(it.at, 0.35 + i * 0.6));
    const GAP = 70; // slab thickness + spacing in px
    T.forEach((tt, i) => { ctx.sfx("whip_air", tt - 0.22, -16); ctx.sfx("ui_tap", tt, -6); ctx.sfx("check_tick", tt + 0.32, -10); });
    let tw;
    return (t, dur) => {
      if (title && !tw) { measureWords(el); tw = timesForWords(title, ctx, 0.1, 0.1); }
      if (title) animateWords(title, t, tw);
      if (tagEl) { const q = brandOut(prog(t, 0, 0.6)); tagEl.style.opacity = q; tagEl.style.letterSpacing = `${lerp(0.5, 0.22, q)}em`; }
      const e = snapOut(prog(t, -0.05, 0.9)), spin = brandInOut(prog(t, 0, Math.max(1, dur)));
      iso.style.transform = `translateY(${(1 - e) * 260}px) rotateX(${lerp(68, 54, e)}deg) rotateZ(${lerp(-58, -34, e) + spin * 10}deg)`;
      floor.style.opacity = String(e * 0.9);
      let landed = 0;
      slabs.forEach((sl, i) => {
        const a = prog(t, T[i] - 0.3, 0.3), land = ease.inCubic(a);
        const squash = Math.sin(Math.PI * clamp((t - T[i]) / 0.24)) * (t > T[i] ? 1 : 0);
        const z = i * GAP + (1 - land) * 900;
        sl.style.opacity = String(clamp(a * 4));
        sl.style.transform = `translateZ(${z - squash * 10}px) scale(${1 + squash * 0.035})`;
        sl.style.filter = a > 0 && a < 1 ? `blur(${(1 - land) * 6}px)` : "none";
        if (t >= T[i]) landed = i + 1;
        const ok = brandOut(prog(t, T[i] + 0.3, 0.4));
        oks[i].style.transform = `scale(${ok > 0 ? ease.outBack(ok, 2) : 0})`;
      });
      floor.style.transform = `translateZ(-2px) scale(${1 + landed * 0.06})`;
    };
  },

  globe(el, p, ctx) {
    const ring = ((p.ring ?? "VÍC ČASU NA BYZNYS") + " • ").repeat(p.repeat ?? 2);
    const chars = [...ring];
    const R = 430, RT = 370; // sphere radius (canvas px, 1000 canvas shown at 700) and text ring radius (css px)
    el.appendChild(h(`<div class="sc sc-globe">
      <div class="gl-stage"><canvas class="gl-dots" width="1000" height="1000"></canvas>
        <div class="gl-ring">${chars.map((c) => `<span>${c === " " ? "&nbsp;" : esc(c)}</span>`).join("")}</div></div>
      <div class="gl-copy">${p.kicker ? `<div class="tag">${esc(p.kicker)}</div>` : ""}${p.text ? kineticWords(p.text, "lg") : ""}</div>
    </div>`));
    const stage = el.querySelector(".gl-stage"), cv = el.querySelector(".gl-dots"), g = cv.getContext("2d");
    const spans = [...el.querySelectorAll(".gl-ring span")], title = el.querySelector(".kw-line"), tagEl = el.querySelector(".gl-copy .tag");
    // fibonacci sphere
    const N = 900, P = [];
    for (let k = 0; k < N; k++) { const y = 1 - (2 * (k + 0.5)) / N, r = Math.sqrt(1 - y * y), th = k * 2.39996323; P.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
    const tLand = 0.55;
    ctx.sfx("hook_dive", -0.2, -12);
    ctx.sfx("hook_impact", tLand - 0.05, -16);
    ctx.sfx("reveal_shimmer", tLand, -13);
    let tw;
    return (t) => {
      if (title && !tw) { measureWords(el); tw = timesForWords(title, ctx, 0.5, 0.1); }
      if (title) animateWords(title, t, tw);
      if (tagEl) { const q = brandOut(prog(t, 0.2, 0.6)); tagEl.style.opacity = q; tagEl.style.letterSpacing = `${lerp(0.5, 0.22, q)}em`; }
      // fly-in from deep background: far + small + blurred -> overshoots slightly toward camera -> settles
      const f = snapOut(prog(t, -0.1, tLand + 0.1));
      const z = lerp(-2600, 0, f) + Math.sin(Math.PI * clamp((t - tLand + 0.1) / 0.5)) * 60;
      stage.style.transform = `translateZ(${z}px) rotateZ(${lerp(-18, -12, f)}deg)`;
      stage.style.filter = f < 0.98 ? `blur(${(1 - f) * 14}px)` : "none";
      stage.style.opacity = String(clamp(f * 2));
      const spin = t * 0.9 + (1 - f) * 3; // fast spin while flying in, then steady
      const tilt = 0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
      g.clearRect(0, 0, 1000, 1000);
      for (const [x0, y0, z0] of P) {
        const x = x0 * Math.cos(spin) + z0 * Math.sin(spin), zz = -x0 * Math.sin(spin) + z0 * Math.cos(spin);
        const y = y0 * ct - zz * st, z2 = y0 * st + zz * ct;
        const d = (z2 + 1) / 2; // 0 back .. 1 front
        g.globalAlpha = 0.12 + d * 0.8;
        g.fillStyle = d > 0.55 ? "#2f6bed" : "#9db8f5";
        g.beginPath(); g.arc(500 + x * R, 500 + y * R, 1.6 + d * 2.6, 0, 6.2832); g.fill();
      }
      g.globalAlpha = 1;
      // text ring: each letter at an angle on the equator, rotating opposite to the dots
      const n = spans.length, rs = -t * 0.55 - (1 - f) * 2;
      spans.forEach((sp, k) => {
        const a = (k / n) * Math.PI * 2 + rs, cz = Math.cos(a);
        const front = (cz + 1) / 2;
        sp.style.transform = `rotateX(${-tilt * 57.3}deg) rotateY(${a * 57.3}deg) translateZ(${RT}px)`;
        sp.style.opacity = String(0.15 + front * 0.85);
        sp.style.color = front > 0.5 ? "var(--ink)" : "var(--blue-2)";
      });
    };
  },
});
