// Scene template library – EFEKTIVE brand system (paper / ink / blue / green, Geist).
// A template = (el, props, ctx) => update(local, dur)
//   el    – 1080x1920 container for this scene
//   props – scene props from episode.json
//   ctx   – { at(ref, fallback) -> local seconds, words, lib }
// Every update() must be a pure function of `local` (seconds since scene start).
//
// Motion language (keep it consistent – this is what makes it look "After Effects", not "AI"):
//   • one ease family: brandOut (expo-out) for entrances, brandInOut for moves, nothing linear, no bounce
//   • type arrives letter by letter: thin + blurred + rotated  ->  heavy + sharp  (variable font weight)
//   • lines draw on (trim paths), cards rise 60–120 px with a soft shadow growing under them
//   • 3D: things settle from a slight perspective tilt to flat; never spin
//   • overlap everything: the next element starts before the previous one finished (stagger 40–80 ms)
//   • max 2 accent colours on screen: blue = primary/new, green = positive/done
import { clamp, lerp, prog, ease, brandOut, brandInOut } from "./ease.js";

const h = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------------------------------------------------------------------------
// Letter-reveal typography. "**word**" = blue accent, "__word__" = green accent, "~~word~~" = outline.
export function letters(text = "", cls = "") {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ s: text.slice(last, m.index), c: "" });
    parts.push({ s: m[2] ?? m[3] ?? m[4], c: m[2] ? "b" : m[3] ? "g" : "o" });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ s: text.slice(last), c: "" });
  let html = "";
  for (const p of parts) {
    for (const word of p.s.split(/(\s+)/)) {
      if (!word) continue;
      if (/^\s+$/.test(word)) { html += " "; continue; }
      html += `<span class="w ${p.c}">${[...word].map((ch) => `<span class="ch">${esc(ch)}</span>`).join("")}</span>`;
    }
  }
  return `<div class="type ${cls}">${html}</div>`;
}
export function revealLetters(root, t, start = 0, { stagger = 0.028, dur = 0.9, from = 250, to = 800 } = {}) {
  root.querySelectorAll(".ch").forEach((c, i) => {
    const p = brandOut(prog(t, start + i * stagger, dur));
    const q = 1 - p;
    c.style.opacity = clamp(p * 2.2);
    c.style.transform = `translateY(${q * 0.45}em) rotate(${q * 4}deg)`;
    c.style.filter = q > 0.01 ? `blur(${q * 8}px)` : "none";
    c.style.fontVariationSettings = `"wght" ${Math.round(lerp(from, to, p))}`;
  });
}
const lettersDone = (root, start, stagger = 0.028, dur = 0.9) => start + root.querySelectorAll(".ch").length * stagger + dur * 0.6;

// Rise-in for blocks (cards, rows, pills).
function rise(el, t, at, { y = 90, dur = 0.8, scale = 0.96, tilt = 0 } = {}) {
  const p = brandOut(prog(t, at, dur));
  const q = 1 - p;
  el.style.opacity = clamp(p * 1.8);
  el.style.transform = `translateY(${q * y}px) scale(${lerp(scale, 1, p)}) rotateX(${q * tilt}deg)`;
  return p;
}
// Trim-path draw for an SVG path/line with pathLength="1".
const draw = (path, p) => {
  path.style.strokeDasharray = "1 1";
  path.style.strokeDashoffset = String(1 - p);
};
// Count-up number.
const count = (from, to, p, dec = 0) => lerp(from, to, p).toFixed(dec).replace(".", ",");

const ICONS = {
  photo: `<rect x="7" y="10" width="34" height="28" rx="6"/><circle cx="18" cy="21" r="3.5"/><path d="M9 34 L20 25 L28 31 L33 27 L40 33"/>`,
  video: `<rect x="6" y="12" width="26" height="24" rx="6"/><path d="M32 21 L42 15 V33 L32 27 Z"/>`,
  play: `<path d="M17 11 L37 24 L17 37 Z"/>`,
  text: `<path d="M11 12 H37 M24 12 V38"/>`,
  sound: `<path d="M9 19 H16 L25 11 V37 L16 29 H9 Z"/><path d="M31 18 Q36 24 31 30 M35 13 Q43 24 35 35"/>`,
  clock: `<circle cx="24" cy="24" r="16"/><path d="M24 15 V24 L30 28"/>`,
  sparkle: `<path d="M24 7 L27.5 20.5 L41 24 L27.5 27.5 L24 41 L20.5 27.5 L7 24 L20.5 20.5 Z"/>`,
  check: `<path d="M12 25 L20 33 L36 15"/>`,
  sticker: `<path d="M9 9 H39 V28 L28 39 H9 Z"/><path d="M28 39 V28 H39"/>`,
  font: `<path d="M8 38 L19 10 L30 38 M12 29 H26"/><path d="M33 25 H43 M38 25 V38"/>`,
  chart: `<path d="M8 40 H42"/><path d="M14 34 V24 M24 34 V16 M34 34 V9"/>`,
  ai: `<path d="M20 7 L23 17 L33 20 L23 23 L20 33 L17 23 L7 20 L17 17 Z"/><path d="M36 29 L37.5 34 L42 35.5 L37.5 37 L36 42 L34.5 37 L30 35.5 L34.5 34 Z"/>`,
  apple: `<path d="M31 9 C29 11 27 12 25 12 C25 9 27 7 31 6 Z M24 15 C27 15 29 13 32 13 C35 13 38 15 39 18 C35 20 34 26 39 29 C37 35 34 41 30 41 C27 41 27 39 24 39 C21 39 20 41 17 41 C13 41 8 33 8 25 C8 18 13 14 17 14 C20 14 21 15 24 15 Z"/>`,
  android: `<path d="M11 31 A13 13 0 0 1 37 31 Z"/><path d="M16 19 L12 13 M32 19 L36 13"/>`,
  layers: `<path d="M24 8 L42 17 L24 26 L6 17 Z"/><path d="M6 24 L24 33 L42 24"/><path d="M6 31 L24 40 L42 31"/>`,
  arrow: `<path d="M8 24 H38 M28 14 L39 24 L28 34"/>`,
  hook: `<path d="M30 8 V28 A9 9 0 1 1 12 28 V24"/>`,
  flag: `<path d="M12 42 V7 M12 9 H36 L31 17 L36 25 H12"/>`,
};
export const icon = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 48 48">${ICONS[name] ?? ICONS.sparkle}</svg>`;

// Kicker label (brand: green, uppercase, wide tracking) – e.g. "KLING · EDIT MÓD"
const tag = (txt, color = "green") => `<div class="tag ${color}">${esc(txt)}</div>`;

// ---------------------------------------------------------------------------
export const templates = {
  // Editorial headline. props: { kicker, lines: ["Instagram", "**Edits**"], sub, subAt }
  title(el, p, ctx) {
    el.appendChild(h(`<div class="sc sc-title">
      ${p.kicker ? tag(p.kicker) : ""}
      <div class="stack">${(p.lines ?? [p.text]).map((l) => letters(l, "xl")).join("")}</div>
      ${p.sub ? `<div class="sub">${letters(p.sub, "s")}</div>` : ""}
      <svg class="rule" viewBox="0 0 900 4"><line pathLength="1" x1="0" y1="2" x2="900" y2="2"/></svg>
    </div>`));
    const k = el.querySelector(".tag"), stack = el.querySelector(".stack"), sub = el.querySelector(".sub"), rule = el.querySelector(".rule line");
    const subAt = ctx.at(p.subAt, 0.9);
    return (t) => {
      if (k) rise(k, t, 0, { y: 30 });
      revealLetters(stack, t, 0.05, { stagger: 0.03 });
      draw(rule, brandInOut(prog(t, 0.35, 0.9)));
      if (sub) revealLetters(sub, t, subAt, { stagger: 0.012, from: 300, to: 500 });
    };
  },

  // Product reveal: 3D app tile settles, name types in. props: { name, glyph, gradient:[c1,c2], tag, caption }
  app(el, p, ctx) {
    const [c1, c2] = p.gradient ?? ["#1f4dff", "#13b97a"];
    el.appendChild(h(`<div class="sc sc-app">
      <div class="tile-wrap">
        <div class="tile-shadow"></div>
        <div class="tile" style="background:linear-gradient(140deg, ${c1}, ${c2})"><span>${esc(p.glyph ?? p.name?.[0] ?? "A")}</span><b class="shine"></b></div>
      </div>
      ${p.tag ? tag(p.tag) : ""}
      ${letters(p.name ?? "", "lg")}
      ${p.caption ? letters(p.caption, "md muted") : ""}
      ${p.button ? `<div class="app-get"><b>${esc(p.button)}</b><b class="done">${esc(p.buttonDone ?? p.button)}</b></div>` : ""}
    </div>`));
    const tile = el.querySelector(".tile"), sh = el.querySelector(".tile-shadow"), shine = el.querySelector(".shine");
    // App Store "Get" pill: pops in on its word, then gets tapped (press + label swap), like downloading the app
    const get = el.querySelector(".app-get"), tGet = ctx.at(p.buttonAt, 1.4), tTap = tGet + 0.55;
    if (get) { ctx.sfx("ui_softpop", tGet, -6); ctx.sfx("ui_tap", tTap, -3); ctx.sfx("ui_chime", tTap + 0.12, -12); }
    const k = el.querySelector(".tag"), [name, cap] = el.querySelectorAll(".type");
    ctx.sfx("ui_pop", 0.05);
    ctx.sfx("reveal_shimmer", 0.6, -6);
    return (t) => {
      const e = brandOut(prog(t, 0, 1.2));
      const q = 1 - e;
      tile.style.transform = `perspective(1400px) translateY(${q * 260}px) rotateX(${q * 38}deg) rotateY(${q * -22}deg) rotateZ(${q * -6}deg) scale(${lerp(0.7, 1, e)})`;
      tile.style.opacity = clamp(e * 2);
      sh.style.opacity = e * 0.9;
      sh.style.transform = `translateX(-50%) scale(${lerp(0.5, 1, e)})`;
      shine.style.transform = `translateX(${lerp(-140, 140, brandInOut(prog(t, 0.55, 0.9)))}%) rotate(20deg)`;
      if (k) rise(k, t, 0.35, { y: 30 });
      revealLetters(name, t, 0.3);
      if (cap) revealLetters(cap, t, ctx.at(p.captionAt, lettersDone(name, 0.3)), { from: 300, to: 550, stagger: 0.02 });
      if (get) {
        const a = prog(t, tGet, 0.5), press = Math.sin(Math.PI * prog(t, tTap, 0.22));
        get.style.opacity = clamp(a * 3);
        get.style.transform = `scale(${(a > 0 ? ease.outBack(a, 1.6) : 0) * (1 - 0.1 * press)})`;
        get.classList.toggle("on", t >= tTap + 0.11);
      }
    };
  },

  // Phone with a carousel being built. props: { app, title, items: [{label, kind, color, at}] }
  phone(el, p, ctx) {
    const items = p.items ?? [];
    const pal = ["#2f6bed", "#7fd858", "#252a35", "#e6eaf0"];
    el.appendChild(h(`<div class="sc sc-phone">
      ${p.title ? letters(p.title, "md") : ""}
      <div class="ph3d"><div class="phone">
        <div class="island"></div>
        <div class="ph-head"><span>${esc(p.app ?? "")}</span><i></i></div>
        <div class="ph-track">${items.map((it, i) => {
          const bg = it.color ?? pal[i % pal.length];
          const dark = bg !== "#e6eaf0";
          return `<div class="ph-card ${dark ? "dark" : ""}" style="background:${bg}">${icon(it.kind ?? "photo")}<div class="ph-meta"><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(it.label ?? "")}</b></div></div>`;
        }).join("")}</div>
        <div class="ph-dots">${items.map(() => "<i></i>").join("")}</div>
      </div></div>
      <div class="ph-legend">${items.map((it, i) => `<div class="pl"><span>${String(i + 1).padStart(2, "0")}</span>${esc(it.label ?? "")}</div>`).join("")}</div>
    </div>`));
    const ph = el.querySelector(".phone"), track = el.querySelector(".ph-track"), title = el.querySelector(".type");
    const cards = [...el.querySelectorAll(".ph-card")], dots = [...el.querySelectorAll(".ph-dots i")], leg = [...el.querySelectorAll(".pl")];
    const times = items.map((it, i) => ctx.at(it.at, 0.4 + i * 0.7));
    const STEP = 452 + 36;
    ctx.sfx("ui_pop", 0.1, -4);
    times.forEach((tt, i) => i > 0 && ctx.sfx("card_swipe", tt - 0.22, -2));
    return (t) => {
      if (title) revealLetters(title, t, 0);
      const e = brandOut(prog(t, 0, 1.1)), q = 1 - e;
      ph.style.transform = `translateY(${q * 700}px) rotateY(${lerp(-28, -10, e) + 4 * brandInOut(prog(t, 1, 4))}deg) rotateX(${q * 14 + 6}deg) rotateZ(${q * 8}deg)`;
      let x = 0, idx = 0;
      times.forEach((tt, i) => {
        if (i > 0) x += brandInOut(prog(t, tt - 0.2, 0.55));
        if (t >= tt - 0.1) idx = i;
      });
      track.style.transform = `translateX(${-x * STEP}px)`;
      cards.forEach((c, i) => {
        const a = brandOut(prog(t, times[i] - 0.45, 0.7));
        c.style.transform = `translateY(${(1 - a) * 120}px) scale(${lerp(0.85, 1, a)})`;
        c.style.opacity = clamp(a * 2);
      });
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      leg.forEach((l, i) => {
        const a = brandOut(prog(t, times[i] - 0.2, 0.6));
        l.style.opacity = clamp(a * 1.5) * (i === idx ? 1 : 0.35);
        l.style.transform = `translateX(${(1 - a) * -40}px)`;
        l.classList.toggle("on", i === idx);
      });
    };
  },

  // A -> B. props: { from:{label,kind}, to:{label,kind}, toAt, caption }
  transform(el, p, ctx) {
    el.appendChild(h(`<div class="sc sc-transform">
      <div class="card tf a">${icon(p.from?.kind ?? "photo")}<div class="tf-meta"><span>Vstup</span><b>${esc(p.from?.label ?? "")}</b></div></div>
      <svg class="tf-link" viewBox="0 0 60 200"><path pathLength="1" d="M30 0 V150"/><path class="head" d="M8 140 L30 196 L52 140 Z"/></svg>
      <div class="tf-chip">${icon("ai")}<span>AI</span></div>
      <div class="card tf b hl-blue">${icon(p.to?.kind ?? "video")}<div class="tf-meta"><span>Výstup</span><b>${esc(p.to?.label ?? "")}</b></div><div class="tf-bar"><i></i></div></div>
      ${p.caption ? letters(p.caption, "md muted") : ""}
    </div>`));
    const a = el.querySelector(".tf.a"), b = el.querySelector(".tf.b"), link = el.querySelector(".tf-link path"), head = el.querySelector(".tf-link .head"), chip = el.querySelector(".tf-chip");
    const bar = el.querySelector(".tf-bar i"), cap = el.querySelector(".type");
    const tB = ctx.at(p.toAt, 1.1);
    ctx.sfx("ui_pop", 0.05, -4);
    ctx.sfx("bar_rise", tB - 0.3, -4);
    ctx.sfx("ui_pop", tB, -2);
    return (t, dur) => {
      rise(a, t, 0, { y: 120, tilt: 30 });
      draw(link, brandInOut(prog(t, tB - 0.6, 0.5)));
      head.style.opacity = brandOut(prog(t, tB - 0.15, 0.3));
      rise(chip, t, tB - 0.4, { y: 20, scale: 0.6 });
      rise(b, t, tB, { y: 140, tilt: 30 });
      bar.style.transform = `scaleX(${brandInOut(prog(t, tB + 0.3, Math.max(0.6, dur - tB - 0.5)))})`;
      if (cap) revealLetters(cap, t, tB + 0.3, { from: 300, to: 550, stagger: 0.018 });
    };
  },

  // One input -> variants. props: { title, source:{label,kind}, variants:[{label, icon, at}], caption }
  multiply(el, p, ctx) {
    const vars = p.variants ?? [];
    el.appendChild(h(`<div class="sc sc-multiply">
      ${p.title ? letters(p.title, "md") : ""}
      <div class="mu">
        <svg class="mu-lines" viewBox="0 0 940 760">${vars.map((_, i) => {
          const x = 235 + (i % 2) * 470, y = 420 + Math.floor(i / 2) * 230;
          return `<path pathLength="1" d="M470 170 C470 300 ${x} ${y - 200} ${x} ${y - 70}"/>`;
        }).join("")}</svg>
        <div class="card mu-src">${icon(p.source?.kind ?? "photo")}<b>${esc(p.source?.label ?? "1 kreativa")}</b></div>
        ${vars.map((v, i) => `<div class="card mu-v ${i % 2 ? "g" : "b"}" style="left:${(i % 2) * 470 + 20}px;top:${350 + Math.floor(i / 2) * 230}px">${icon(v.icon ?? "sparkle")}<div><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(v.label)}</b></div></div>`).join("")}
      </div>
      ${p.caption ? letters(p.caption, "md muted") : ""}
    </div>`));
    const title = el.querySelector(".sc-multiply > .type"), src = el.querySelector(".mu-src");
    const vEls = [...el.querySelectorAll(".mu-v")], paths = [...el.querySelectorAll(".mu-lines path")];
    const cap = el.querySelectorAll(".sc-multiply > .type")[p.title ? 1 : 0];
    const times = vars.map((v, i) => ctx.at(v.at, 0.8 + i * 0.3));
    ctx.sfx("ui_pop", 0.1, -4);
    times.forEach((tt) => ctx.sfx("ui_pop", tt, -6));
    return (t) => {
      if (title) revealLetters(title, t, 0);
      rise(src, t, 0.1, { y: 80, tilt: 25 });
      vEls.forEach((v, i) => {
        draw(paths[i], brandInOut(prog(t, times[i] - 0.45, 0.5)));
        rise(v, t, times[i] - 0.05, { y: 60, scale: 0.9 });
      });
      if (cap && cap !== title) revealLetters(cap, t, (times.at(-1) ?? 1) + 0.3, { from: 300, to: 550, stagger: 0.018 });
    };
  },

  // Feature list. props: { title, items: [{ text, icon, state: "yes"|"soon", at }] }
  checklist(el, p, ctx) {
    const items = p.items ?? [];
    el.appendChild(h(`<div class="sc sc-check">
      ${p.title ? letters(p.title, "lg") : ""}
      <div class="rows">${items.map((it, i) => `
        <div class="row ${it.state === "soon" ? "soon" : ""}">
          <span class="idx">${String(i + 1).padStart(2, "0")}</span>
          ${icon(it.icon ?? "check", "lead")}
          ${letters(it.text, "row-t")}
          <div class="state">${it.state === "soon" ? `<span>Brzy</span>` : `<svg viewBox="0 0 48 48"><circle pathLength="1" cx="24" cy="24" r="20"/><path pathLength="1" d="M14 25 L21 32 L34 17"/></svg>`}</div>
        </div>`).join("")}</div>
    </div>`));
    const title = el.querySelector(".sc-check > .type");
    const rows = [...el.querySelectorAll(".row")];
    const times = items.map((it, i) => ctx.at(it.at, 0.5 + i * 0.45));
    items.forEach((it, i) => ctx.sfx(it.state === "soon" ? "ui_pop" : "check_tick", times[i] - 0.25 + (it.state === "soon" ? 0.4 : 0.72), -3));
    return (t) => {
      if (title) revealLetters(title, t, 0);
      rows.forEach((r, i) => {
        const at = times[i] - 0.25;
        rise(r, t, at, { y: 70 });
        revealLetters(r.querySelector(".type"), t, at + 0.08, { stagger: 0.018, from: 300, to: 600 });
        const st = r.querySelector(".state");
        const svg = st.querySelectorAll("circle, path");
        if (svg.length) {
          draw(svg[0], brandInOut(prog(t, at + 0.35, 0.5)));
          draw(svg[1], brandOut(prog(t, at + 0.6, 0.4)));
          st.classList.toggle("done", t > at + 0.75);
        } else rise(st, t, at + 0.4, { y: 20, scale: 0.7 });
      });
    };
  },

  // Before / after. props: { title, left:{label,icon,value,amount}, right:{label,icon,value,amount,at}, winner }
  versus(el, p, ctx) {
    const L = p.left ?? {}, R = p.right ?? {};
    const col = (s, cls) => `<div class="vs-col ${cls}">
      <div class="vs-bar"><i></i><b class="vs-val">${esc(s.value ?? "")}</b></div>
      <div class="vs-lab">${icon(s.icon ?? "clock")}<span>${esc(s.label ?? "")}</span></div></div>`;
    el.appendChild(h(`<div class="sc sc-versus">
      ${p.title ? letters(p.title, "lg") : ""}
      <div class="vs">
        <svg class="vs-base" viewBox="0 0 900 4"><line pathLength="1" x1="0" y1="2" x2="900" y2="2"/></svg>
        ${col(L, "l")}${col(R, "r")}
      </div>
    </div>`));
    const title = el.querySelector(".type");
    const base = el.querySelector(".vs-base line");
    const [cl, cr] = el.querySelectorAll(".vs-col");
    const winR = p.winner !== "left";
    const tR = ctx.at(R.at, 0.9);
    ctx.sfx("bar_rise", 0.35, -5);
    ctx.sfx("bar_rise", tR, -2);
    const hL = L.amount ?? (winR ? 0.82 : 0.45), hR = R.amount ?? (winR ? 0.38 : 0.82);
    return (t) => {
      if (title) revealLetters(title, t, 0);
      draw(base, brandInOut(prog(t, 0.1, 0.8)));
      [[cl, 0.35, hL], [cr, tR, hR]].forEach(([c, at, hh]) => {
        const g = brandOut(prog(t, at, 1.0));
        c.querySelector(".vs-bar i").style.transform = `scaleY(${g * hh})`;
        const v = c.querySelector(".vs-val");
        v.style.transform = `translateY(${-g * hh * 520}px)`;
        v.style.opacity = clamp(g * 3);
        rise(c.querySelector(".vs-lab"), t, at, { y: 30 });
      });
      (winR ? cr : cl).classList.toggle("win", t > tR + 0.6);
    };
  },

  // Big number. props: { value, from, suffix, label, decimals }
  stat(el, p, ctx) {
    el.appendChild(h(`<div class="sc sc-stat"><div class="num"><span class="v"></span><span class="sfx">${esc(p.suffix ?? "")}</span></div>${letters(p.label ?? "", "md")}</div>`));
    const v = el.querySelector(".v"), num = el.querySelector(".num"), lab = el.querySelector(".type");
    ctx.sfx("bar_rise", 0.05, -3);
    const to = Number(p.value ?? 0), from = Number(p.from ?? 0), dec = p.decimals ?? (Number.isInteger(to) ? 0 : 1);
    return (t) => {
      const e = brandOut(prog(t, 0.05, 1.4));
      v.textContent = count(from, to, e, dec);
      num.style.fontVariationSettings = `"wght" ${Math.round(lerp(200, 700, e))}`;
      num.style.filter = e < 0.99 ? `blur(${(1 - e) * 10}px)` : "none";
      num.style.opacity = clamp(e * 2);
      revealLetters(lab, t, 0.4);
    };
  },

  // "Vyzkoušej". props: { kicker, text, steps:[…], stepsAt:[…] }
  cta(el, p, ctx) {
    const steps = p.steps ?? [];
    el.appendChild(h(`<div class="sc sc-cta">
      <div class="cta-k">${letters(p.kicker ?? "Vyzkoušej", "xl")}</div>
      ${p.text ? letters(p.text, "md muted") : ""}
      <div class="steps">${steps.map((s, i) => `<div class="step"><span class="n">${String(i + 1).padStart(2, "0")}</span>${letters(s, "step-t")}</div>`).join("")}</div>
    </div>`));
    const k = el.querySelector(".cta-k .type"), stEls = [...el.querySelectorAll(".step")];
    const txt = el.querySelector(".sc-cta > .type");
    const times = steps.map((s, i) => ctx.at(p.stepsAt?.[i], 0.6 + i * 0.5));
    ctx.sfx("reveal_shimmer", 0.05, -6);
    times.forEach((tt) => ctx.sfx("ui_pop", tt - 0.2, -4));
    return (t) => {
      revealLetters(k, t, 0, { stagger: 0.04 });
      if (txt) revealLetters(txt, t, 0.4, { from: 300, to: 550, stagger: 0.015 });
      stEls.forEach((s, i) => {
        rise(s, t, times[i] - 0.2, { y: 50 });
        revealLetters(s.querySelector(".type"), t, times[i] - 0.12, { stagger: 0.016, from: 300, to: 600 });
        s.classList.toggle("on", t > times[i]);
      });
    };
  },

  // Fully custom scene. props: { html, css, update: "function body (t, dur, el, lib, ctx)" }
  // lib = { clamp, lerp, prog, ease, brandOut, brandInOut, letters, revealLetters, icon }
  custom(el, p, ctx) {
    if (p.css) el.appendChild(h(`<style>${p.css}</style>`));
    el.insertAdjacentHTML("beforeend", p.html ?? "");
    const fn = p.update ? new Function("t", "dur", "el", "lib", "ctx", p.update) : () => {};
    return (t, dur) => fn(t, dur, el, ctx.lib, ctx);
  },
};

// Outro end card – the only place the brand appears: efektive.cz pill + the two brand spheres.
export function buildOutro(stage, cfg) {
  const el = h(`<div class="outro">
    <div class="sphere blue o-s1"></div><div class="sphere green o-s2"></div>
    <div class="o-kicker">${esc(cfg.series.outroKicker ?? "Další aktuality každý týden")}</div>
    <div class="o-pill"><span class="b">efektive</span><span class="g">.cz</span></div>
  </div>`);
  stage.appendChild(el);
  const pill = el.querySelector(".o-pill"), kick = el.querySelector(".o-kicker"), s1 = el.querySelector(".o-s1"), s2 = el.querySelector(".o-s2");
  return (t) => {
    const p = brandOut(prog(t, 0.05, 1.0));
    pill.style.transform = `translateY(${(1 - p) * 80}px) scale(${lerp(0.9, 1, p)})`;
    pill.style.opacity = clamp(p * 2);
    pill.style.filter = p < 0.99 ? `blur(${(1 - p) * 10}px)` : "none";
    const k = brandOut(prog(t, 0.35, 0.8));
    kick.style.opacity = k;
    kick.style.transform = `translateY(${(1 - k) * 24}px)`;
    const a = brandOut(prog(t, 0, 1.4)), b = brandOut(prog(t, 0.15, 1.4));
    s1.style.transform = `translate(${(1 - a) * 500}px, ${(1 - a) * -300 + Math.sin(t * 1.4) * 14}px) scale(${lerp(0.4, 1, a)})`;
    s2.style.transform = `translate(${(1 - b) * -500}px, ${(1 - b) * 300 + Math.cos(t * 1.2) * 14}px) scale(${lerp(0.4, 1, b)})`;
  };
}
