// Scenes built for episode #5 (Affinity na iPad). Rule since #5: no re-skinned templates – every
// episode gets new looks; these are new layouts/motions, kept generic (props) so ideas can evolve.
//   tablet    – dark stage, 3D iPad swings in, brand chip / letter-slam wordmark / price stamp on words
//   trinity   – three tool tiles slam in from 3 sides, merge into one app icon, "subscription" struck out
//   equation  – result tile first, then old apps drop in with "+", all suck into the result
//   puppetdraw– 2D cut-out mascot walks in, draws on a tablet, step cards tick on words
//   cutout    – photo card: scan-line background removal, generative fill, PRO lock drops
//   receipt   – endless subscription receipt prints, a tear drops, mascot laughs from the corner
//   postgrid  – placeholder grid of social posts flips into finished designs, "0 Kč" stamp
//   todo      – blue stage, checklist card ticks on words, mascot points at it
import { clamp, lerp, prog, ease, brandOut } from "./ease.js";
import { snapOut, kineticWords, animateWords } from "./scenes-pro.js";
import { mascot } from "./mascot.js";

const h = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ob = (p, s = 1.6) => ease.outBack(clamp(p), s);
const pulse = (t, t0, d = 0.3) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));
const bounce = (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
const shake = (t, t0, amp = 10, d = 0.28) => (t < t0 || t > t0 + d ? 0 : amp * (1 - (t - t0) / d) * Math.sin((t - t0) * 70));

let styled = false;
function css() {
  if (styled) return;
  styled = true;
  const s = document.createElement("style");
  s.textContent = `
  .v5 { position:absolute; inset:0; overflow:hidden; font-family:var(--sans); }
  .v5 .abs { position:absolute; }
  .v5 .kick { font-weight:700; font-size:26px; letter-spacing:.24em; text-transform:uppercase; }
  .v5-dark { color:var(--ink); }
  .v5-orb { position:absolute; border-radius:50%; filter:blur(60px); opacity:.55; }
  .ipad { position:absolute; width:880px; height:620px; border-radius:54px; background:#0d0d12; box-shadow:0 60px 120px -30px rgba(0,0,0,.7), inset 0 0 0 3px #2b2b36; transform-style:preserve-3d; }
  .ipad .scr { position:absolute; inset:20px; border-radius:36px; overflow:hidden; background:#1c1c24; }
  .ipad .tb { position:absolute; left:0; top:0; right:0; height:46px; background:#26262f; }
  .ipad .tools { position:absolute; left:14px; top:64px; width:46px; display:flex; flex-direction:column; gap:12px; }
  .ipad .tools i { display:block; width:46px; height:46px; border-radius:12px; background:#33333f; }
  .ipad .tools i.on { background:linear-gradient(135deg,#7b5cff,#c04cf0); }
  .ipad .art { position:absolute; left:84px; top:64px; right:24px; bottom:22px; border-radius:14px; background:#f7f3ea; overflow:hidden; }
  .chip5 { display:inline-flex; align-items:center; gap:14px; padding:14px 26px; border-radius:999px; font-weight:800; font-size:34px; }
  .wm { font-weight:800; font-size:150px; letter-spacing:-.05em; line-height:1; white-space:nowrap; }
  .wm span { display:inline-block; }
  .stamp { border:9px solid currentColor; border-radius:22px; padding:10px 34px; font-weight:900; font-size:96px; letter-spacing:.02em; }
  .tile5 { position:absolute; width:300px; height:300px; border-radius:72px; display:flex; align-items:center; justify-content:center; box-shadow:0 40px 70px -30px rgba(40,20,90,.55), inset 0 2px 0 rgba(255,255,255,.35); }
  .tile5 svg { width:150px; height:150px; }
  .lab5 { position:absolute; width:300px; text-align:center; font-weight:800; font-size:46px; letter-spacing:-.03em; color:#221c3a; }
  .eqt { position:absolute; width:250px; height:250px; border-radius:56px; background:#23232b; color:#f2f2f6; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; font-weight:800; font-size:34px; box-shadow:0 30px 60px -30px rgba(0,0,0,.6); }
  .eqt b { font-size:96px; letter-spacing:-.04em; line-height:1; color:#9aa0b2; }
  .eqs { position:absolute; font-weight:300; font-size:120px; color:#8b8fa3; }
  .step5 { position:absolute; display:flex; align-items:center; gap:22px; padding:22px 30px; width:520px; border-radius:28px; background:#fff; box-shadow:0 26px 50px -28px rgba(30,60,20,.45); font-weight:800; font-size:44px; color:#1f2a1a; }
  .step5 em { font-style:normal; display:flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:20px; background:#e9f6df; color:#3d8f17; font-size:36px; }
  .step5.done em { background:#4ea51f; color:#fff; }
  .card5 { position:absolute; border-radius:30px; overflow:hidden; box-shadow:0 50px 90px -40px rgba(0,0,0,.8); }
  .checker { background-color:#fff; background-image:linear-gradient(45deg,#d9dbe3 25%,transparent 25%,transparent 75%,#d9dbe3 75%),linear-gradient(45deg,#d9dbe3 25%,transparent 25%,transparent 75%,#d9dbe3 75%); background-size:40px 40px; background-position:0 0,20px 20px; }
  .rc { position:absolute; width:540px; background:#fbfaf6; color:#2a2a2a; font-family:"Courier New",monospace; font-weight:700; font-size:30px; padding:34px 40px; box-shadow:0 40px 80px -30px rgba(0,0,0,.7); overflow:hidden; }
  .rc div { display:flex; justify-content:space-between; padding:6px 0; border-bottom:2px dashed #ddd; }
  .post5 { position:absolute; width:230px; height:230px; border-radius:26px; backface-visibility:hidden; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:52px; letter-spacing:-.03em; }
  .post5.ph { border:4px dashed #b9c3dd; background:rgba(255,255,255,.5); }
  .todo5 { position:absolute; background:#fff; border-radius:40px; padding:56px 64px; width:900px; box-shadow:0 60px 110px -40px rgba(10,30,90,.6); color:var(--ink); }
  .todo5 .row { display:flex; align-items:center; gap:30px; font-weight:800; font-size:58px; letter-spacing:-.03em; margin-top:34px; }
  .todo5 .bx { width:76px; height:76px; border-radius:22px; border:6px solid #c9d3ea; display:flex; align-items:center; justify-content:center; flex:none; }
  .todo5 .bx svg { width:52px; height:52px; }
  `;
  document.head.appendChild(s);
}
const ICON = {
  photo: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>`,
  pen: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/></svg>`,
  layout: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M4 5h16M4 9h10M4 13h16M4 17h12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="#3a2a00" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="#3a2a00" stroke="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
};
// EFEKTIVE design rule (#5 feedback): every scene keeps the brand stage – white paper bg with the soft
// spheres/blobs (engine .bg) – only the animations/layouts change, never a dark or full-colour background.
// one app icon = three colour wedges meeting (abstract, not any real logo)
const APP_ICON = (size = 300) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><defs><linearGradient id="ai5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1b5c"/><stop offset="1" stop-color="#0f0b24"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(#ai5)"/><path d="M50 18 L80 72 L50 60 Z" fill="#ffb000"/><path d="M50 18 L50 60 L20 72 Z" fill="#a259ff"/><path d="M20 72 L50 60 L80 72 Z" fill="#00c2d1"/></svg>`;
const PENCIL = `<svg width="60" height="190" viewBox="0 0 60 190" style="position:absolute;left:-30px;top:-40px;transform:rotate(-12deg);transform-origin:30px 30px"><rect x="18" y="20" width="24" height="130" rx="4" fill="#ffcf3a" stroke="#222" stroke-width="3"/><path d="M18 150 L30 182 L42 150 Z" fill="#f2d2a0" stroke="#222" stroke-width="3"/><path d="M26 170 L30 182 L34 170 Z" fill="#222"/><rect x="18" y="8" width="24" height="16" rx="4" fill="#ff7a9a" stroke="#222" stroke-width="3"/></svg>`;

export const v5Templates = {
  // props: { brand, name, sub, price, at: { brand, name, sub, price } }
  tablet(el, p, ctx) {
    css();
    const A = p.at ?? {};
    const tB = ctx.at(A.brand, 0.0), tN = ctx.at(A.name, 0.8), tS = ctx.at(A.sub, 1.4), tP = ctx.at(A.price, 2.1);
    const name = p.name ?? "Affinity";
    el.appendChild(h(`<div class="v5 v5-dark">
            <div class="abs t5-l" style="left:150px;top:250px;width:760px">
        <div class="chip5 t5-chip" style="background:linear-gradient(90deg,#00c4cc,#7d2ae8);color:#fff">${esc(p.brand ?? "Canva")}</div>
        <div class="wm t5-wm" style="margin-top:34px">${[...name].map((c) => `<span>${esc(c)}</span>`).join("")}</div>
        <div class="t5-sub" style="margin-top:22px;font-weight:700;font-size:54px;color:var(--blue);letter-spacing:-.02em">${esc(p.sub ?? "na iPad")}</div>
      </div>
      <div class="abs t5-pv" style="left:930px;top:200px;width:880px;height:620px;perspective:2000px">
        <div class="ipad"><div class="scr"><div class="tb"></div>
          <div class="tools">${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${i === 2 ? "on" : ""}"></i>`).join("")}</div>
          <div class="art">
            <i class="abs t5-sun" style="left:300px;top:70px;width:230px;height:230px;border-radius:50%;background:#ff7a2f"></i>
            <i class="abs t5-band" style="left:-20px;top:300px;width:800px;height:120px;background:#2b2a7a;transform-origin:0 50%"></i>
            <i class="abs t5-tri" style="left:60px;top:150px;width:0;height:0;border-left:120px solid transparent;border-right:120px solid transparent;border-bottom:200px solid #00b3c7"></i>
            <div class="abs t5-txt" style="left:40px;top:40px;font-weight:900;font-size:70px;color:#2b2a7a;letter-spacing:-.04em">NOVÁ<br>KOLEKCE</div>
            <svg class="abs t5-path" style="left:0;top:0" width="760" height="470"><path d="M60 420 C 200 330, 330 460, 470 360 S 700 300, 740 240" fill="none" stroke="#c04cf0" stroke-width="10" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
          </div>
          <i class="abs t5-flash" style="inset:0;background:#fff;opacity:0"></i>
        </div></div>
      </div>
      <div class="abs t5-stamp" style="left:1290px;top:640px;color:#5fe03a;transform:rotate(-11deg)"><div class="stamp">${esc(p.price ?? "ZDARMA")}</div></div>
    </div>`));
    const q = (s) => el.querySelector(s);
    const chip = q(".t5-chip"), wm = [...el.querySelectorAll(".t5-wm span")], sub = q(".t5-sub"), pv = q(".t5-pv"), pad = q(".ipad");
    const sun = q(".t5-sun"), band = q(".t5-band"), tri = q(".t5-tri"), txt = q(".t5-txt"), path = q(".t5-path path"), flash = q(".t5-flash"), stamp = q(".t5-stamp"), root = q(".v5");
    ctx.sfx("ui_swipe", 0.0, -6);
    ctx.sfx("ui_softpop", tB, -6);
    wm.forEach((_, i) => i % 2 === 0 && ctx.sfx("ui_tick", tN + i * 0.03, -14));
    ctx.sfx("impact_synthetic_hit_01", tN + 0.05, -16);
    ctx.sfx("swoosh_air", tS - 0.15, -9);
    ctx.sfx("hook_impact", tP, -8);
    ctx.sfx("cash_register", tP + 0.04, -15);
    return (t) => {
      const c = ob(prog(t, tB, 0.35), 2.2);
      chip.style.transform = `scale(${c}) translateY(${(1 - c) * 30}px)`;
      chip.style.opacity = String(clamp(c * 2));
      wm.forEach((s, i) => {
        const k = snapOut(prog(t, tN + i * 0.035, 0.32));
        s.style.transform = `translateY(${(1 - k) * -170}px) rotate(${(1 - k) * (i % 2 ? 14 : -14)}deg)`;
        s.style.opacity = String(clamp(k * 3));
      });
      const sb = snapOut(prog(t, tS, 0.4));
      sub.style.opacity = String(sb);
      sub.style.transform = `translateX(${(1 - sb) * -60}px)`;
      // iPad: flies in from the right at full speed, squares up to camera on "iPad", punch on the price
      const fi = snapOut(prog(t, 0, 0.7)), sq = brandOut(prog(t, tS - 0.1, 0.5));
      const punch = 0.06 * pulse(t, tS, 0.35) + 0.05 * pulse(t, tP, 0.3);
      pad.style.transform = `translateX(${(1 - fi) * 1100}px) rotateY(${lerp(lerp(-62, -24, fi), -4, sq)}deg) rotateZ(${(1 - fi) * 8}deg) scale(${1 + punch})`;
      // the artwork draws itself on the screen
      sun.style.transform = `scale(${ob(prog(t, 0.35, 0.4))})`;
      band.style.transform = `scaleX(${snapOut(prog(t, 0.55, 0.5))})`;
      tri.style.transform = `translateY(${(1 - snapOut(prog(t, 0.75, 0.45))) * 300}px)`;
      txt.style.opacity = String(prog(t, 1.0, 0.3));
      path.style.strokeDashoffset = String(1 - ease.inOutCubic(prog(t, 1.2, 1.2)));
      flash.style.opacity = String(0.85 * Math.max(0, 1 - Math.abs(t - tP - 0.03) / 0.12));
      const st = prog(t, tP, 0.3);
      stamp.style.opacity = String(st > 0 ? 1 : 0);
      stamp.style.transform = `rotate(-11deg) scale(${lerp(2.6, 1, ease.outCubic(st)) + 0.05 * pulse(t, tP + 0.3, 0.2)})`;
      root.style.transform = `translate(${shake(t, tP + 0.12, 12)}px, ${shake(t, tP + 0.14, 8)}px)`;
    };
  },

  // props: { tiles:[{label, icon, at}], mergeAt, app, subAt, sub }
  trinity(el, p, ctx) {
    css();
    const T = p.tiles ?? [];
    const cols = [["#b06bff", "#6a3df0"], ["#ffbe2e", "#ff6a00"], ["#19d3e0", "#0a76f0"]];
    const from = [[-1100, 60, -30], [0, -900, 20], [1100, 60, 30]];
    el.appendChild(h(`<div class="v5">
      ${T.map((x, i) => `<div class="tile5 tr-t" style="left:${370 + i * 440}px;top:250px;background:linear-gradient(140deg,${cols[i][0]},${cols[i][1]})">${ICON[x.icon] ?? ""}</div><div class="lab5 tr-l" style="left:${370 + i * 440}px;top:580px">${esc(x.label)}</div>`).join("")}
      <div class="abs tr-app" style="left:810px;top:220px;width:300px;height:300px">${APP_ICON(300)}</div>
      <div class="abs tr-name" style="left:560px;top:560px;width:800px;text-align:center;font-weight:800;font-size:64px;letter-spacing:-.04em;color:#221c3a">${esc(p.app ?? "1 apka")}</div>
      <div class="abs tr-sub" style="left:610px;top:680px;width:700px;text-align:center"><span style="position:relative;display:inline-block;font-weight:700;font-size:54px;color:#6b6585">${esc(p.sub ?? "Předplatné")}<i class="tr-x" style="position:absolute;left:-14px;right:-14px;top:52%;height:9px;border-radius:9px;background:#ff3b30;transform-origin:0 50%"></i></span> <b class="tr-zero" style="display:inline-block;margin-left:24px;font-weight:900;font-size:64px;color:#3d9a17">0 Kč</b></div>
    </div>`));
    const tiles = [...el.querySelectorAll(".tr-t")], labs = [...el.querySelectorAll(".tr-l")];
    const app = el.querySelector(".tr-app"), nm = el.querySelector(".tr-name"), sub = el.querySelector(".tr-sub"), x = el.querySelector(".tr-x"), zero = el.querySelector(".tr-zero");
    const tt = T.map((x, i) => ctx.at(x.at, 0.05 + i * 0.35));
    const tM = ctx.at(p.mergeAt, 1.4), tSub = ctx.at(p.subAt, 2.2);
    tt.forEach((a, i) => { ctx.sfx(["whoosh_fast", "swoosh_air", "whoosh_fast"][i] ?? "swoosh_air", a - 0.12, -10); ctx.sfx("ui_tap", a + 0.02, -7); });
    ctx.sfx("reveal_shimmer", tM + 0.1, -10);
    ctx.sfx("ui_chime", tM + 0.32, -14);
    ctx.sfx("marker_scratch", tSub + 0.25, -10);
    return (t) => {
      const m = ease.inOutCubic(prog(t, tM, 0.42));
      tiles.forEach((el2, i) => {
        const k = snapOut(prog(t, tt[i], 0.34));
        const [fx, fy, fr] = from[i];
        const cx = (1 - k) * fx + m * (810 - (370 + i * 440)), cy = (1 - k) * fy;
        el2.style.transform = `translate(${cx}px, ${cy}px) rotate(${(1 - k) * fr + m * (i - 1) * 40}deg) scale(${(1 - m * 0.6) * (1 + 0.08 * pulse(t, tt[i] + 0.3, 0.2))})`;
        el2.style.opacity = String(clamp(k * 4) * (1 - prog(t, tM + 0.25, 0.15)));
        labs[i].style.opacity = String(clamp(k * 2) * (1 - m));
        labs[i].style.transform = `translateY(${(1 - k) * 30}px)`;
      });
      const a = ob(prog(t, tM + 0.28, 0.4), 2.4);
      app.style.opacity = String(clamp(a * 3));
      app.style.transform = `scale(${a}) rotate(${(1 - a) * -30}deg)`;
      nm.style.opacity = String(prog(t, tM + 0.4, 0.3));
      nm.style.transform = `translateY(${(1 - snapOut(prog(t, tM + 0.4, 0.4))) * 30}px)`;
      const s = snapOut(prog(t, tSub, 0.35));
      sub.style.opacity = String(s);
      sub.style.transform = `translateY(${(1 - s) * 40}px)`;
      x.style.transform = `scaleX(${ease.outCubic(prog(t, tSub + 0.25, 0.25))})`;
      zero.style.transform = `scale(${ob(prog(t, tSub + 0.45, 0.35), 2.6)})`;
    };
  },

  // props: { kicker, result:{label}, resultAt, eqAt, items:[{abbr,label,at}], mergeAt }
  equation(el, p, ctx) {
    css();
    const I = p.items ?? [];
    el.appendChild(h(`<div class="v5">
      <div class="abs kick eq-k" style="left:0;right:0;top:150px;text-align:center;color:#7fd858">${esc(p.kicker ?? "Pro ty pomalejší")}</div>
      ${I.map((x, i) => `<div class="eqt eq-i" style="left:${150 + i * 360}px;top:360px"><b>${esc(x.abbr)}</b><span>${esc(x.label)}</span></div>${i < I.length - 1 ? `<div class="eqs eq-p" style="left:${420 + i * 360}px;top:395px">+</div>` : ""}`).join("")}
      <div class="eqs eq-eq" style="left:1235px;top:385px">=</div>
      <div class="abs eq-r" style="left:1390px;top:330px;width:320px;height:320px">${APP_ICON(320)}</div>
      <div class="abs eq-rl" style="left:1340px;top:670px;width:420px;text-align:center;font-weight:800;font-size:56px;letter-spacing:-.04em">${esc(p.result ?? "Affinity")}</div>
    </div>`));
    const items = [...el.querySelectorAll(".eq-i")], plus = [...el.querySelectorAll(".eq-p")];
    const k = el.querySelector(".eq-k"), eq = el.querySelector(".eq-eq"), r = el.querySelector(".eq-r"), rl = el.querySelector(".eq-rl");
    const tR = ctx.at(p.resultAt, 0.9), tE = ctx.at(p.eqAt, 1.3), tM = ctx.at(p.mergeAt, 3.4);
    const ti = I.map((x, i) => ctx.at(x.at, 1.7 + i * 0.5));
    ctx.sfx("ui_softpop", tR, -6);
    ti.forEach((a) => { ctx.sfx("ui_tap", a, -6); });
    ctx.sfx("swoosh_air", tM - 0.05, -8);
    ctx.sfx("impact_synthetic_hit_01", tM + 0.34, -12);
    return (t) => {
      const kk = brandOut(prog(t, 0, 0.5));
      k.style.opacity = String(kk);
      k.style.letterSpacing = `${lerp(0.6, 0.24, kk)}em`;
      const rr = ob(prog(t, tR, 0.4), 2);
      const absorb = 0.12 * pulse(t, tM + 0.34, 0.3);
      r.style.transform = `scale(${rr * (1 + absorb)}) rotate(${(1 - rr) * 25 + Math.sin(t * 2.2) * 3}deg)`;
      r.style.opacity = String(clamp(rr * 3));
      rl.style.opacity = String(prog(t, tR + 0.15, 0.3));
      const e = snapOut(prog(t, tE, 0.3));
      eq.style.opacity = String(e);
      eq.style.transform = `scale(${lerp(1.8, 1, e)})`;
      const m = ease.inCubic(prog(t, tM, 0.36));
      items.forEach((it, i) => {
        const q = snapOut(prog(t, ti[i], 0.32));
        const dx = m * (1390 - (150 + i * 360) + 35);
        it.style.transform = `translate(${dx}px, ${(1 - q) * -260}px) rotate(${(1 - q) * (i - 1) * 12}deg) scale(${(1 - m * 0.85) * (1 + 0.06 * pulse(t, ti[i] + 0.25, 0.2))})`;
        it.style.opacity = String(clamp(q * 3) * (1 - m * m));
      });
      plus.forEach((pl, i) => {
        const q = snapOut(prog(t, ti[i + 1] - 0.08, 0.3));
        pl.style.opacity = String(q * (1 - m));
        pl.style.transform = `scale(${lerp(0.3, 1, q)}) rotate(${(1 - q) * 90}deg)`;
      });
    };
  },

  // props: { kicker, steps:[{text, at}], drawAt, wowAt }
  puppetdraw(el, p, ctx) {
    css();
    const S = p.steps ?? [];
    el.appendChild(h(`<div class="v5">
      <div class="abs kick" style="left:1250px;top:170px;color:#3d8f17">${esc(p.kicker ?? "Jak na to")}</div>
      <div class="abs pd-tab" style="left:560px;top:250px;width:620px;height:460px;border-radius:44px;background:#151519;box-shadow:0 50px 80px -40px rgba(20,50,10,.6);transform:rotate(-4deg)">
        <div class="abs" style="inset:18px;border-radius:28px;background:#fffdf7;overflow:hidden">
          <svg class="abs" width="584" height="424" style="left:0;top:0"><path class="pd-line" d="M60 330 C 110 180, 190 120, 250 200 S 340 330, 400 200 S 500 80, 540 140" fill="none" stroke="#7b3cff" stroke-width="16" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><circle class="pd-dot" cx="150" cy="110" r="44" fill="#ffb000" opacity="0"/></svg>
        </div>
      </div>
      ${S.map((x, i) => `<div class="step5 pd-s" style="left:1250px;top:${240 + i * 150}px"><em>${i + 1}</em><span>${esc(x.text)}</span></div>`).join("")}
    </div>`));
    const root = el.querySelector(".v5");
    const m = mascot();
    root.insertBefore(m.el, el.querySelector(".pd-tab").nextSibling);
    m.prop("R", PENCIL);
    const pencil = m.el.querySelector(".armR .ms-prop");
    const steps = [...el.querySelectorAll(".pd-s")], line = el.querySelector(".pd-line"), dot = el.querySelector(".pd-dot"), tab = el.querySelector(".pd-tab");
    const ts = S.map((x, i) => ctx.at(x.at, 0.1 + i * 0.9));
    const tD = ctx.at(p.drawAt, 1.9), tW = ctx.at(p.wowAt, 0.1);
    ctx.sfx("steps_wood", 0.0, -14);
    ts.forEach((a) => { ctx.sfx("ui_swipe", a - 0.08, -9); ctx.sfx("check_tick", a + 0.3, -9); });
    ctx.sfx("marker_scratch", tD + 0.1, -9);
    return (t, dur) => {
      // walk in from the left, stop next to the tablet
      const w = snapOut(prog(t, 0, 0.75));
      const walking = 1 - prog(t, 0.55, 0.25);
      const draw = brandOut(prog(t, tD - 0.15, 0.35));
      m.pose({
        x: lerp(-260, 400, w), y: 960, s: 0.5,
        bob: -Math.abs(Math.sin(t * 13)) * 16 * walking + Math.sin(t * 3) * 3,
        legs: Math.sin(t * 13) * 12 * walking,
        lean: lerp(4, 0, w) - draw * 4,
        head: Math.sin(t * 2.4) * 3 + draw * 6,
        armL: 8 + Math.sin(t * 13) * 14 * walking,
        armR: lerp(-6 - Math.sin(t * 13) * 14 * walking, -78 + Math.sin(t * 9) * 8 * prog(t, tD, 0.2), draw),
        expr: t > tD ? "head_grin" : t > tW ? "head_wow" : "head",
        sq: 0.04 * pulse(t, tD - 0.1, 0.25),
      });
      pencil.style.opacity = String(draw);
      line.style.strokeDashoffset = String(1 - ease.inOutSine(prog(t, tD + 0.1, Math.max(0.8, dur - tD - 0.3))));
      dot.setAttribute("opacity", String(prog(t, tD + 0.7, 0.2)));
      tab.style.transform = `rotate(-4deg) scale(${1 + 0.03 * pulse(t, tD, 0.3)})`;
      steps.forEach((s, i) => {
        const q = snapOut(prog(t, ts[i], 0.34));
        s.style.opacity = String(clamp(q * 3));
        s.style.transform = `translateX(${(1 - q) * 260}px) rotate(${(1 - q) * 6}deg)`;
        s.classList.toggle("done", t > ts[i] + 0.3);
      });
    };
  },

  // props: { chips:[{text, at}], removeAt, fillAt, lockAt, lock }
  cutout(el, p, ctx) {
    css();
    const C = p.chips ?? [];
    el.appendChild(h(`<div class="v5">
      ${C.map((x, i) => `<div class="chip5 co-c" style="position:absolute;left:120px;top:${330 + i * 120}px;background:#22283a;color:#e8ecff;border:2px solid #39415c">✦ ${esc(x.text)}</div>`).join("")}
      <div class="card5 co-card" style="left:700px;top:200px;width:820px;height:560px">
        <div class="abs checker" style="inset:0"></div>
        <div class="abs co-gen" style="inset:0;background:linear-gradient(180deg,#ff9a6b 0%,#ffcf6b 45%,#ffe9b8 70%);opacity:0">
          <i class="abs" style="left:520px;top:120px;width:170px;height:170px;border-radius:50%;background:#fff3d1"></i>
          <i class="abs" style="left:-40px;bottom:-80px;width:600px;height:260px;border-radius:50%;background:#7fb069"></i>
          <i class="abs" style="left:380px;bottom:-120px;width:640px;height:280px;border-radius:50%;background:#5c9a54"></i>
        </div>
        <div class="abs co-bg" style="inset:0;background:url(../assets/plates/wide.jpg) 46% 40% / 260% auto"></div>
        <i class="abs co-scan" style="top:-10px;bottom:-10px;width:8px;background:#9cf;box-shadow:0 0 40px 12px rgba(120,190,255,.8);opacity:0"></i>
        <div class="abs co-who" style="left:0;top:0;width:820px;height:560px"></div>
      </div>
      <div class="abs co-lock" style="left:1430px;top:150px;display:flex;align-items:center;gap:14px;padding:14px 28px;border-radius:999px;background:linear-gradient(90deg,#ffd75e,#ffb000);color:#3a2a00;font-weight:900;font-size:40px;box-shadow:0 20px 40px -10px rgba(255,180,0,.5)"><span style="width:44px;height:44px;display:inline-block">${ICON.lock}</span>${esc(p.lock ?? "Canva Pro")}</div>
    </div>`));
    const m = mascot();
    el.querySelector(".co-who").appendChild(m.el);
    const chips = [...el.querySelectorAll(".co-c")], card = el.querySelector(".co-card"), bg = el.querySelector(".co-bg"), scan = el.querySelector(".co-scan"), gen = el.querySelector(".co-gen"), lock = el.querySelector(".co-lock");
    const tc = C.map((x, i) => ctx.at(x.at, 0.5 + i));
    const tR = ctx.at(p.removeAt, 1.0), tF = ctx.at(p.fillAt, 2.0), tL = ctx.at(p.lockAt, 3.4);
    tc.forEach((a) => ctx.sfx("ui_softpop", a, -8));
    ctx.sfx("scan_beep", tR + 0.05, -14);
    ctx.sfx("d_riser", tF - 0.1, -16);
    ctx.sfx("sparkle", tF + 0.4, -12);
    ctx.sfx("lock_click", tL + 0.18, -6);
    return (t) => {
      const ci = snapOut(prog(t, 0, 0.5));
      // the frame grows on "generate": the photo gets wider than the original shot
      const g = ease.inOutCubic(prog(t, tF, 0.7));
      const W = lerp(820, 1060, g), H = lerp(560, 640, g);
      card.style.left = `${lerp(700, 640, g)}px`; card.style.top = `${lerp(200, 170, g)}px`;
      card.style.width = `${W}px`; card.style.height = `${H}px`;
      card.style.transform = `translateY(${(1 - ci) * 500}px) rotate(${(1 - ci) * 8 - 1.5 * (1 - g)}deg) scale(${1 + 0.04 * pulse(t, tL + 0.18, 0.25)})`;
      const sx = ease.inOutSine(prog(t, tR, 0.6));
      bg.style.clipPath = `inset(0 0 0 ${sx * 100}%)`;
      scan.style.left = `${sx * W}px`;
      scan.style.opacity = String(sx > 0 && sx < 1 ? 1 : 0);
      gen.style.opacity = String(g);
      gen.style.filter = `blur(${(1 - prog(t, tF + 0.1, 0.8)) * 26}px) saturate(${1 + (1 - g) * 0.8})`;
      m.pose({ x: W / 2, y: H + 420, s: 0.62, bob: Math.sin(t * 3.1) * 4, head: Math.sin(t * 2) * 4, armL: 10, armR: -10 - 60 * ease.outBack(prog(t, tL - 0.1, 0.3)) * (1 - prog(t, tL + 0.9, 0.3)), expr: t > tL ? "head_shock" : t > tF ? "head_grin" : "head" });
      chips.forEach((c, i) => { const q = snapOut(prog(t, tc[i], 0.35)); c.style.opacity = String(q); c.style.transform = `translateX(${(1 - q) * -200}px)`; });
      const l = prog(t, tL, 0.3);
      lock.style.opacity = String(l > 0 ? 1 : 0);
      lock.style.transform = `translateY(${(1 - bounce(l)) * -260}px) rotate(${(1 - l) * -12 + 4}deg)`;
    };
  },

  // props: { rows:[[a,b]], total, cryAt }
  receipt(el, p, ctx) {
    css();
    const R = p.rows ?? [];
    el.appendChild(h(`<div class="v5">
      <div class="abs" style="left:620px;top:96px;width:680px;height:46px;border-radius:23px;background:#2a2a2e;box-shadow:inset 0 -8px 0 #111"></div>
      <div class="rc rc-p" style="left:690px;top:120px">
        <div style="justify-content:center;border:0;font-size:34px">PŘEDPLATNÉ</div>
        ${R.map(([a, b]) => `<div><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join("")}
        <div style="border:0;margin-top:10px;font-size:40px"><span>CELKEM</span><span>${esc(p.total ?? "")}</span></div>
        <i class="abs rc-blot" style="left:300px;top:250px;width:140px;height:100px;border-radius:50%;background:radial-gradient(closest-side,rgba(90,140,220,.35),rgba(90,140,220,0));opacity:0"></i>
      </div>
      <i class="abs rc-drop" style="left:950px;top:-80px;width:46px;height:64px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:linear-gradient(180deg,#bfe3ff,#5aa8ff);opacity:0"></i>
      <div class="abs rc-who" style="left:0;top:0"></div>
    </div>`));
    const m = mascot();
    el.querySelector(".rc-who").appendChild(m.el);
    const paper = el.querySelector(".rc-p"), drop = el.querySelector(".rc-drop"), blot = el.querySelector(".rc-blot");
    const tC = ctx.at(p.cryAt, 0.7);
    ctx.sfx("receipt_print", 0.02, -10);
    ctx.sfx("water_drip", tC + 0.32, -6);
    ctx.sfx("kid_laugh", tC + 0.45, -14);
    let fullH = 0;
    return (t, dur) => {
      if (!fullH) fullH = paper.scrollHeight || 700;
      const pr = ease.outCubic(prog(t, 0, 1.1));
      paper.style.height = `${Math.max(1, pr * fullH)}px`;
      paper.style.transform = `translateY(${Math.sin(t * 40) * 1.5 * (1 - prog(t, 0.9, 0.2))}px)`;
      const d = prog(t, tC, 0.35);
      drop.style.opacity = String(d > 0 && d < 1 ? 1 : 0);
      drop.style.top = `${lerp(-80, 420, ease.inQuad(d))}px`;
      blot.style.opacity = String(prog(t, tC + 0.35, 0.4));
      const up = snapOut(prog(t, 0.15, 0.5));
      const laugh = prog(t, tC + 0.3, 0.2);
      m.pose({ x: 1560, y: lerp(1500, 1420, up) + Math.abs(Math.sin(t * 16)) * -14 * laugh, s: 0.66, lean: -8 + Math.sin(t * 16) * 3 * laugh, head: Math.sin(t * 16) * 7 * laugh - 6, armL: 30 + 40 * laugh + Math.sin(t * 16) * 10 * laugh, armR: -20, expr: laugh > 0 ? "head_grin" : "head" });
    };
  },

  // props: { kicker, title, posts:[{text,bg,fg}], flipAt, stamp, stampAt }
  postgrid(el, p, ctx) {
    css();
    const P = p.posts ?? [];
    el.appendChild(h(`<div class="v5">
      <div class="abs pg-head" style="left:150px;top:300px;width:780px;text-align:left">
        <div class="tag" style="font-size:28px">${esc(p.kicker ?? "Pro klienty")}</div>
        <div style="margin-top:26px">${kineticWords(p.title ?? "", p.size ?? "md")}</div>
      </div>
      <div class="abs pg-grid" style="left:1010px;top:250px;width:760px;height:500px;perspective:1600px">
        ${P.map((x, i) => `<div class="abs" style="left:${(i % 3) * 254}px;top:${Math.floor(i / 3) * 254}px;width:230px;height:230px;transform-style:preserve-3d"><div class="post5 ph pg-ph"></div><div class="post5 pg-po" style="background:${x.bg};color:${x.fg ?? "#fff"}">${esc(x.text)}</div></div>`).join("")}
      </div>
      <div class="abs pg-stamp" style="left:1180px;top:430px;color:#3d9a17;transform:rotate(-9deg)"><div class="stamp" style="background:rgba(255,255,255,.85);font-size:84px">${esc(p.stamp ?? "0 Kč navíc")}</div></div>
    </div>`));
    const head = el.querySelector(".pg-head .kw-line"), tag = el.querySelector(".pg-head .tag");
    const ph = [...el.querySelectorAll(".pg-ph")], po = [...el.querySelectorAll(".pg-po")], stamp = el.querySelector(".pg-stamp");
    const tF = ctx.at(p.flipAt, 2.0), tS = ctx.at(p.stampAt, 3.8);
    ph.forEach((_, i) => ctx.sfx("ui_tick", 0.15 + i * 0.09, -16));
    po.forEach((_, i) => i % 2 === 0 && ctx.sfx("card_flip", tF + i * 0.11, -9));
    ctx.sfx("hook_impact", tS, -9);
    ctx.sfx("cash_register", tS + 0.05, -14);
    let tw;
    return (t) => {
      if (!tw) {
        el.querySelectorAll(".kw").forEach((k) => (k.dataset.w = k.querySelector(".kw-i").getBoundingClientRect().width));
        const ws = [...el.querySelectorAll(".kw")];
        tw = ws.map((_, i) => Math.min(tF - 0.2, 0.1 + i * 0.32));
        (p.titleAt ?? []).forEach((w, i) => { if (i < tw.length) tw[i] = ctx.at(w, tw[i]) - 0.04; });
      }
      animateWords(head, t, tw);
      tag.style.opacity = String(brandOut(prog(t, 0, 0.5)));
      ph.forEach((x, i) => {
        const q = ob(prog(t, 0.15 + i * 0.09, 0.3), 2);
        x.style.transform = `scale(${q})`;
        const f = ease.inOutCubic(prog(t, tF + i * 0.11, 0.38));
        x.style.opacity = String(f < 0.5 ? 1 : 0);
        po[i].style.opacity = String(f >= 0.5 ? 1 : 0);
        x.style.transform += ` rotateY(${f * 180}deg)`;
        po[i].style.transform = `rotateY(${(f - 1) * 180}deg) scale(${1 + 0.06 * pulse(t, tF + i * 0.11 + 0.38, 0.2)})`;
      });
      const s = prog(t, tS, 0.28);
      stamp.style.opacity = String(s > 0 ? 1 : 0);
      stamp.style.transform = `rotate(-9deg) scale(${lerp(2.4, 1, ease.outCubic(s))})`;
      el.querySelector(".pg-grid").style.transform = `translate(${shake(t, tS + 0.1, 9)}px, 0)`;
    };
  },

  // props: { kicker, items:[{text, at}] }
  todo(el, p, ctx) {
    css();
    const I = p.items ?? [];
    el.appendChild(h(`<div class="v5">
      <div class="todo5 td-c" style="left:170px;top:260px">
        <div class="kick" style="color:#2f6bed">${esc(p.kicker ?? "Tak to zkus")}</div>
        ${I.map((x) => `<div class="row td-r"><div class="bx"><span class="td-ck" style="display:flex;width:64px;height:64px;border-radius:16px;background:#4ea51f;align-items:center;justify-content:center;opacity:0">${ICON.check}</span></div><span class="td-t" style="position:relative">${esc(x.text)}<i class="td-u" style="position:absolute;left:0;right:0;bottom:-6px;height:10px;border-radius:6px;background:#7fd858;transform-origin:0 50%;transform:scaleX(0)"></i></span></div>`).join("")}
      </div>
      <div class="abs td-who" style="left:0;top:0"></div>
    </div>`));
    const m = mascot();
    el.querySelector(".td-who").appendChild(m.el);
    m.prop("L", `<img src="../assets/mascot/hand_point.png" style="position:absolute;left:-60px;top:-40px;width:130px;transform:rotate(170deg)">`);
    const card = el.querySelector(".td-c"), rows = [...el.querySelectorAll(".td-r")], cks = [...el.querySelectorAll(".td-ck")], us = [...el.querySelectorAll(".td-u")];
    const ti = I.map((x, i) => ctx.at(x.at, 0.6 + i * 1.6));
    ti.forEach((a) => { ctx.sfx("pencil_write", a + 0.05, -6); ctx.sfx("ui_chime", a + 0.08, -16); });
    ctx.sfx("swoosh_air", 0.0, -8);
    return (t) => {
      const c = snapOut(prog(t, 0, 0.5));
      card.style.transform = `translateX(${(1 - c) * -900}px) rotate(${(1 - c) * -6}deg)`;
      rows.forEach((r, i) => { const q = snapOut(prog(t, 0.2 + i * 0.15, 0.4)); r.style.opacity = String(q); r.style.transform = `translateY(${(1 - q) * 40}px)`; });
      cks.forEach((k, i) => { const q = ob(prog(t, ti[i], 0.3), 2.6); k.style.opacity = String(clamp(q * 3)); k.style.transform = `scale(${q})`; });
      us.forEach((u, i) => (u.style.transform = `scaleX(${ease.outCubic(prog(t, ti[i] + 0.1, 0.35))})`));
      const up = snapOut(prog(t, 0.1, 0.55));
      const point = brandOut(prog(t, 0.45, 0.35));
      const which = t > (ti[1] ?? 99) - 0.2 ? 1 : 0;
      m.pose({ x: lerp(2200, 1520, up), y: 1010, s: 0.5, bob: Math.sin(t * 5) * 5, lean: -point * 4, head: -6 * point + Math.sin(t * 3) * 3, armL: lerp(6, 72 + which * 10, point) + Math.sin(t * 7) * 3, armR: -6, expr: t > ti[0] ? "head_grin" : "head" });
    };
  },
};
