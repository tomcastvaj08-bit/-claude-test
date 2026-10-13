// Scene template library for the explainer part of the reel.
// A template = (el, props, ctx) => update(local, dur)
//   el    – absolutely positioned 1080x1920 container for this scene
//   props – scene props from episode.json
//   ctx   – { at(ref, fallback) -> local seconds, words: [...local word timings], accent, lib }
// Every update() must be a pure function of `local` (seconds since scene start).
import { clamp, lerp, prog, ease, spring, appleEase, inOut } from "./ease.js";

const h = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// **word** -> accent highlight
const rich = (s = "") => esc(s).replace(/\*\*(.+?)\*\*/g, '<em class="hl">$1</em>');

// Split a line into masked words that rise in with a stagger.
function kinetic(text, cls = "") {
  const words = rich(text).split(/(<em class="hl">.*?<\/em>|\s+)/).filter((w) => w && !/^\s+$/.test(w));
  return `<div class="kin ${cls}">${words.map((w) => `<span class="kw"><span>${w}</span></span>`).join(" ")}</div>`;
}
function animateKinetic(root, local, start = 0, stagger = 0.06) {
  root.querySelectorAll(".kw > span").forEach((s, i) => {
    const p = appleEase(prog(local, start + i * stagger, 0.55));
    s.style.transform = `translateY(${lerp(110, 0, p)}%) rotate(${lerp(6, 0, p)}deg)`;
    s.style.opacity = p > 0 ? 1 : 0;
  });
}
const popIn = (local, at, opts) => clamp(spring(local - at, opts ?? { stiffness: 210, damping: 15 }), 0, 1.2);

const ICONS = {
  photo: `<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="28" rx="5" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="17" cy="20" r="4" fill="currentColor"/><path d="M8 35 L20 25 L28 31 L34 26 L41 33" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/></svg>`,
  video: `<svg viewBox="0 0 48 48"><rect x="5" y="11" width="28" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M33 21 L43 15 V33 L33 27 Z" fill="currentColor"/></svg>`,
  play: `<svg viewBox="0 0 48 48"><path d="M16 10 L38 24 L16 38 Z" fill="currentColor"/></svg>`,
  text: `<svg viewBox="0 0 48 48"><path d="M10 12 H38 M24 12 V38" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
  sound: `<svg viewBox="0 0 48 48"><path d="M8 19 H16 L26 10 V38 L16 29 H8 Z" fill="currentColor"/><path d="M32 17 Q37 24 32 31 M36 12 Q45 24 36 36" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  clock: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M24 14 V24 L31 29" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  flag: `<svg viewBox="0 0 48 48"><path d="M12 42 V7 M12 9 H36 L31 17 L36 25 H12" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  hook: `<svg viewBox="0 0 48 48"><path d="M30 8 V28 A9 9 0 1 1 12 28 V24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M8 28 L12 22 L16 28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sparkle: `<svg viewBox="0 0 48 48"><path d="M24 4 L28 20 L44 24 L28 28 L24 44 L20 28 L4 24 L20 20 Z" fill="currentColor"/></svg>`,
  check: `<svg viewBox="0 0 48 48"><path d="M11 25 L20 34 L37 14" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sticker: `<svg viewBox="0 0 48 48"><path d="M8 8 H40 V28 L28 40 H8 Z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/><path d="M28 40 V28 H40" fill="none" stroke="currentColor" stroke-width="3.5"/></svg>`,
  font: `<svg viewBox="0 0 48 48"><path d="M8 40 L20 8 L32 40 M12 30 H28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 26 H44 M39 26 V40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  chart: `<svg viewBox="0 0 48 48"><path d="M8 40 H42" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><rect x="11" y="24" width="7" height="12" rx="2" fill="currentColor"/><rect x="22" y="16" width="7" height="20" rx="2" fill="currentColor"/><rect x="33" y="8" width="7" height="28" rx="2" fill="currentColor"/></svg>`,
  ai: `<svg viewBox="0 0 48 48"><path d="M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z" fill="currentColor"/><path d="M36 28 L38 34 L44 36 L38 38 L36 44 L34 38 L28 36 L34 34 Z" fill="currentColor"/></svg>`,
  apple: `<svg viewBox="0 0 48 48"><path d="M31 9 C29 11 27 12 25 12 C25 9 27 7 31 6 Z M24 15 C27 15 29 13 32 13 C35 13 38 15 39 18 C35 20 34 26 39 29 C37 35 34 41 30 41 C27 41 27 39 24 39 C21 39 20 41 17 41 C13 41 8 33 8 25 C8 18 13 14 17 14 C20 14 21 15 24 15 Z" fill="currentColor"/></svg>`,
  android: `<svg viewBox="0 0 48 48"><path d="M10 30 A14 14 0 0 1 38 30 Z" fill="currentColor"/><path d="M15 17 L11 11 M33 17 L37 11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="18" cy="24" r="2" fill="#000"/><circle cx="30" cy="24" r="2" fill="#000"/></svg>`,
};
export const icon = (name) => ICONS[name] ?? ICONS.sparkle;

// ---------------------------------------------------------------------------
export const templates = {
  // Big kinetic headline. props: { kicker, lines: ["…", "**zvýrazni**"], sub }
  title(el, p, ctx) {
    el.appendChild(
      h(`<div class="sc-title">
        ${p.kicker ? `<div class="pill">${esc(p.kicker)}</div>` : ""}
        ${(p.lines ?? [p.text]).map((l) => kinetic(l, "xl")).join("")}
        ${p.sub ? `<div class="sub">${rich(p.sub)}</div>` : ""}
      </div>`)
    );
    const pill = el.querySelector(".pill"), sub = el.querySelector(".sub");
    return (t, dur) => {
      animateKinetic(el, t, 0.08, 0.07);
      if (pill) pill.style.transform = `scale(${popIn(t, 0)})`;
      if (sub) {
        const q = appleEase(prog(t, ctx.at(p.subAt, 0.55), 0.5));
        sub.style.opacity = q;
        sub.style.transform = `translateY(${lerp(40, 0, q)}px)`;
      }
    };
  },

  // App tile reveal. props: { name, glyph, gradient: [c1, c2], tag, caption }
  app(el, p, ctx) {
    const [c1, c2] = p.gradient ?? ["#833AB4", "#FD1D1D"];
    el.appendChild(
      h(`<div class="sc-app">
        <div class="app-glow" style="background:radial-gradient(circle, ${c2}88, transparent 65%)"></div>
        <div class="app-tile" style="background:linear-gradient(135deg, ${c1}, ${c2})"><span>${esc(p.glyph ?? p.name?.[0] ?? "A")}</span></div>
        ${p.tag ? `<div class="pill accent">${esc(p.tag)}</div>` : ""}
        ${kinetic(p.name ?? "", "lg")}
        ${p.caption ? `<div class="sub">${rich(p.caption)}</div>` : ""}
      </div>`)
    );
    const tile = el.querySelector(".app-tile"), glow = el.querySelector(".app-glow");
    const tag = el.querySelector(".pill"), sub = el.querySelector(".sub");
    return (t) => {
      const s = popIn(t, 0.0, { stiffness: 180, damping: 12 });
      tile.style.transform = `scale(${s}) rotate(${lerp(-14, 0, clamp(s))}deg)`;
      glow.style.opacity = clamp(s) * (0.75 + 0.25 * Math.sin(t * 3));
      glow.style.transform = `translate(-50%,-50%) scale(${1 + 0.06 * Math.sin(t * 2)})`;
      animateKinetic(el, t, 0.25);
      if (tag) tag.style.transform = `scale(${popIn(t, 0.45)})`;
      if (sub) sub.style.opacity = appleEase(prog(t, 0.7, 0.5));
    };
  },

  // iPhone with an app screen. props: { mode: "carousel"|"editor"|"feed", items: [{label, kind, color}], title }
  phone(el, p, ctx) {
    const items = p.items ?? [{ kind: "photo" }, { kind: "video" }, { kind: "text" }];
    const palette = ["#FF3B30", "#FF9500", "#5E5CE6", "#30D158", "#64D2FF"];
    const cards = items
      .map((it, i) => `<div class="ph-card" style="background:${it.color ?? palette[i % palette.length]}">
        <div class="ph-ic">${icon(it.kind)}</div><div class="ph-lb">${esc(it.label ?? it.kind ?? "")}</div></div>`)
      .join("");
    el.appendChild(
      h(`<div class="sc-phone">
        ${p.title ? kinetic(p.title, "md") : ""}
        <div class="phone"><div class="notch"></div>
          <div class="ph-head">${esc(p.app ?? "")}</div>
          <div class="ph-track">${cards}</div>
          <div class="ph-dots">${items.map(() => "<i></i>").join("")}</div>
          ${p.mode === "editor" ? `<div class="ph-tl">${items.map((it, i) => `<div style="flex:${1 + (i % 2)};background:${it.color ?? palette[i % palette.length]}"></div>`).join("")}<b class="ph-head-x"></b></div>` : ""}
        </div>
      </div>`)
    );
    const phone = el.querySelector(".phone"), track = el.querySelector(".ph-track");
    const cardEls = [...el.querySelectorAll(".ph-card")], dots = [...el.querySelectorAll(".ph-dots i")];
    const head = el.querySelector(".ph-head-x");
    const times = items.map((it, i) => ctx.at(it.at, 0.5 + i * 0.75));
    return (t, dur) => {
      animateKinetic(el, t, 0.0);
      const e = appleEase(prog(t, 0, 0.7));
      phone.style.transform = `translateY(${lerp(500, 0, e)}px) rotate(${lerp(8, -3 + 3 * e, e)}deg)`;
      // cards appear (build) then the carousel swipes through them
      let idx = 0;
      times.forEach((tt, i) => (t >= tt ? (idx = i) : 0));
      let x = 0;
      times.forEach((tt, i) => { if (i > 0) x += ease.inOutCubic(prog(t, tt - 0.15, 0.45)); });
      track.style.transform = `translateX(${-x * 512}px)`;
      cardEls.forEach((c, i) => {
        const s = popIn(t, times[i] - 0.35);
        c.style.transform = `scale(${0.6 + 0.4 * clamp(s)})`;
        c.style.opacity = clamp(s * 1.5);
      });
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      if (head) head.style.left = `${clamp(t / dur) * 100}%`;
    };
  },

  // A -> B transformation (e.g. static banner -> AI video). props: { from: {label, kind}, to: {label, kind}, toAt, caption }
  transform(el, p, ctx) {
    el.appendChild(
      h(`<div class="sc-transform">
        <div class="tf-card tf-a"><div class="tf-ic">${icon(p.from?.kind ?? "photo")}</div><div class="tf-lb">${esc(p.from?.label ?? "")}</div></div>
        <div class="tf-arrow"><svg viewBox="0 0 120 40"><path d="M4 20 H104 M90 6 L108 20 L90 34" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="tf-ai">${icon("ai")}</span></div>
        <div class="tf-card tf-b"><div class="tf-ic">${icon(p.to?.kind ?? "video")}</div><div class="tf-lb">${esc(p.to?.label ?? "")}</div><div class="tf-bar"><i></i></div></div>
        ${p.caption ? `<div class="sub">${rich(p.caption)}</div>` : ""}
      </div>`)
    );
    const a = el.querySelector(".tf-a"), b = el.querySelector(".tf-b"), arrow = el.querySelector(".tf-arrow");
    const bar = el.querySelector(".tf-bar i"), sub = el.querySelector(".sub"), ai = el.querySelector(".tf-ai");
    const tB = ctx.at(p.toAt, 1.0);
    return (t, dur) => {
      a.style.transform = `translateY(${lerp(-80, 0, appleEase(prog(t, 0, 0.6)))}px) scale(${popIn(t, 0)})`;
      const ar = ease.outCubic(prog(t, tB - 0.45, 0.45));
      arrow.style.clipPath = `inset(0 0 ${100 - ar * 100}% 0)`;
      ai.style.transform = `rotate(${t * 90}deg) scale(${0.8 + 0.2 * Math.sin(t * 8)})`;
      b.style.transform = `scale(${popIn(t, tB, { stiffness: 200, damping: 11 })})`;
      bar.style.width = `${clamp((t - tB) / Math.max(0.5, dur - tB)) * 100}%`;
      if (sub) sub.style.opacity = appleEase(prog(t, tB + 0.3, 0.5));
    };
  },

  // One source spawns variants. props: { source: {label, kind}, variants: [{label, icon, at}], caption }
  multiply(el, p, ctx) {
    const vars = p.variants ?? [];
    el.appendChild(
      h(`<div class="sc-multiply">
        ${p.title ? kinetic(p.title, "md") : ""}
        <div class="mu-stage">
          <div class="mu-src"><div class="tf-ic">${icon(p.source?.kind ?? "photo")}</div><div class="tf-lb">${esc(p.source?.label ?? "1 kreativa")}</div></div>
          ${vars.map((v) => `<div class="mu-var"><div class="mu-ic">${icon(v.icon ?? "sparkle")}</div><div class="mu-lb">${esc(v.label)}</div></div>`).join("")}
          <svg class="mu-lines" viewBox="0 0 1080 1100">${vars.map(() => `<path pathLength="1" d="" />`).join("")}</svg>
        </div>
        ${p.caption ? `<div class="sub">${rich(p.caption)}</div>` : ""}
      </div>`)
    );
    const src = el.querySelector(".mu-src"), varEls = [...el.querySelectorAll(".mu-var")];
    const lines = [...el.querySelectorAll(".mu-lines path")], sub = el.querySelector(".sub");
    const n = vars.length;
    const pos = vars.map((_, i) => {
      const cols = 2, r = Math.floor(i / cols), c = i % cols;
      return { x: 270 + c * 540, y: 640 + r * 300 };
    });
    const times = vars.map((v, i) => ctx.at(v.at, 0.7 + i * 0.32));
    return (t) => {
      animateKinetic(el, t, 0);
      const split = appleEase(prog(t, times[0] - 0.4, 0.5));
      src.style.transform = `translate(-50%, ${lerp(0, -170, split)}px) scale(${popIn(t, 0) * lerp(1, 0.78, split)})`;
      varEls.forEach((v, i) => {
        const s = popIn(t, times[i], { stiffness: 230, damping: 13 });
        const e = clamp(s);
        v.style.transform = `translate(${lerp(540, pos[i].x, e) - 220}px, ${lerp(300, pos[i].y, e) - 120}px) scale(${s})`;
        v.style.opacity = e;
        lines[i].setAttribute("d", `M540 330 C540 ${470} ${pos[i].x} ${pos[i].y - 280} ${pos[i].x} ${pos[i].y - 120}`);
        lines[i].style.strokeDashoffset = 1 - ease.outCubic(prog(t, times[i] - 0.3, 0.4));
      });
      if (sub) sub.style.opacity = appleEase(prog(t, times[n - 1] + 0.3, 0.5));
    };
  },

  // Feature checklist. props: { title, items: [{ text, icon, state: "yes"|"soon", at }] }
  checklist(el, p, ctx) {
    const items = p.items ?? [];
    el.appendChild(
      h(`<div class="sc-check">
        ${p.title ? kinetic(p.title, "md") : ""}
        <div class="ck-list">${items
          .map((it) => `<div class="ck-row ${it.state === "soon" ? "soon" : ""}"><div class="ck-ic">${icon(it.icon ?? "check")}</div><div class="ck-tx">${rich(it.text)}</div><div class="ck-st">${it.state === "soon" ? "BRZY" : icon("check")}</div></div>`)
          .join("")}</div>
      </div>`)
    );
    const rows = [...el.querySelectorAll(".ck-row")];
    const times = items.map((it, i) => ctx.at(it.at, 0.45 + i * 0.4));
    return (t) => {
      animateKinetic(el, t, 0);
      rows.forEach((r, i) => {
        const e = appleEase(prog(t, times[i] - 0.1, 0.5));
        r.style.opacity = e;
        r.style.transform = `translateX(${lerp(-160, 0, e)}px)`;
        r.querySelector(".ck-st").style.transform = `scale(${popIn(t, times[i] + 0.2)})`;
      });
    };
  },

  // Head-to-head comparison. props: { title, left: {label, value, icon}, right: {label, value, icon}, winner: "left"|"right" }
  versus(el, p, ctx) {
    const side = (s, cls) => `<div class="vs-side ${cls}"><div class="vs-ic">${icon(s?.icon ?? "photo")}</div><div class="vs-lb">${esc(s?.label ?? "")}</div><div class="vs-bar"><i></i></div><div class="vs-val">${esc(s?.value ?? "")}</div></div>`;
    el.appendChild(
      h(`<div class="sc-versus">
        ${p.title ? kinetic(p.title, "md") : ""}
        <div class="vs-row">${side(p.left, "l")}<div class="vs-x">VS</div>${side(p.right, "r")}</div>
      </div>`)
    );
    const l = el.querySelector(".vs-side.l"), r = el.querySelector(".vs-side.r"), x = el.querySelector(".vs-x");
    const bars = el.querySelectorAll(".vs-bar i");
    const winR = p.winner !== "left";
    const tR = ctx.at(p.right?.at, 0.8);
    return (t) => {
      animateKinetic(el, t, 0);
      l.style.transform = `translateX(${lerp(-600, 0, appleEase(prog(t, 0.1, 0.6)))}px)`;
      r.style.transform = `translateX(${lerp(600, 0, appleEase(prog(t, tR - 0.3, 0.6)))}px)`;
      x.style.transform = `scale(${popIn(t, tR)}) rotate(${lerp(-90, 0, clamp(popIn(t, tR)))}deg)`;
      const g = ease.outCubic(prog(t, tR + 0.4, 1.0));
      bars[0].style.height = `${g * (winR ? 45 : 90)}%`;
      bars[1].style.height = `${g * (winR ? 90 : 45)}%`;
      (winR ? r : l).classList.toggle("win", g > 0.95);
    };
  },

  // Big number / stat. props: { value: 3, suffix: "×", label, from: 0 }
  stat(el, p, ctx) {
    el.appendChild(
      h(`<div class="sc-stat"><div class="st-num"><span class="st-v"></span><span class="st-s">${esc(p.suffix ?? "")}</span></div>${kinetic(p.label ?? "", "md")}</div>`)
    );
    const v = el.querySelector(".st-v"), num = el.querySelector(".st-num");
    const to = Number(p.value ?? 0), from = Number(p.from ?? 0), dec = p.decimals ?? (Number.isInteger(to) ? 0 : 1);
    return (t) => {
      const e = ease.outExpo(prog(t, 0.1, 1.1));
      v.textContent = lerp(from, to, e).toFixed(dec).replace(".", ",");
      num.style.transform = `scale(${popIn(t, 0, { stiffness: 160, damping: 12 })})`;
      animateKinetic(el, t, 0.35);
    };
  },

  // Call to action "Vyzkoušej". props: { kicker, text, steps: ["…"], handle }
  cta(el, p, ctx) {
    const steps = p.steps ?? [];
    el.appendChild(
      h(`<div class="sc-cta">
        <div class="cta-k">${esc(p.kicker ?? "VYZKOUŠEJ")}</div>
        ${p.text ? kinetic(p.text, "md") : ""}
        <div class="cta-steps">${steps.map((s, i) => `<div class="cta-step"><b>${i + 1}</b><span>${rich(s)}</span></div>`).join("")}</div>
        <div class="cta-handle">${esc(p.handle ?? ctx.handle)}</div>
      </div>`)
    );
    const k = el.querySelector(".cta-k"), st = [...el.querySelectorAll(".cta-step")], hd = el.querySelector(".cta-handle");
    const times = steps.map((s, i) => ctx.at(p.stepsAt?.[i], 0.6 + i * 0.5));
    return (t, dur) => {
      const s = popIn(t, 0, { stiffness: 200, damping: 10 });
      k.style.transform = `scale(${s}) rotate(${lerp(-8, -3, clamp(s))}deg)`;
      animateKinetic(el, t, 0.25);
      st.forEach((e, i) => {
        const q = appleEase(prog(t, times[i], 0.5));
        e.style.opacity = q;
        e.style.transform = `translateY(${lerp(60, 0, q)}px)`;
      });
      hd.style.opacity = appleEase(prog(t, Math.max(0.8, dur - 1.6), 0.5));
    };
  },

  // Fully custom Claude-authored scene.
  // props: { html, css, update: "function body using (t, dur, el, lib)" }
  custom(el, p, ctx) {
    if (p.css) el.appendChild(h(`<style>${p.css}</style>`));
    el.insertAdjacentHTML("beforeend", p.html ?? "");
    const fn = p.update ? new Function("t", "dur", "el", "lib", "ctx", p.update) : () => {};
    return (t, dur) => fn(t, dur, el, ctx.lib, ctx);
  },
};
