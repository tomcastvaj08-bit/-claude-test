// Cold opens – short character pre-scenes BEFORE the board hook. A hand-drawn 2D character (character
// sheet in assets/coldopen) lives in a real photographed room with the same sun, haze and grade as the
// hook. Everything he touches (desk, chair, laptop, notebook, newspaper) is drawn too – a toon in the
// real world.
//
// Animation = classic limited 2D animation: key drawings (Higgsfield, edited from one master so the set
// stays put) swapped "on twos", constant LINE BOIL (SVG displacement re-seeded 12×/s), a ghost line pass
// that keeps "re-scribbling" his outlines, short glitch jolts, the room's light stripes multiplied over
// him, his flat shadow on the brick wall, and a paper flip (he is thin as a sheet) when he leaps.
//
// Every scene: busy muttering → (insert shot) → "Počkej…" freeze + record scratch + crash zoom →
// close-up "Co je dneska za datum?!" (lip-sync) → leap out of the chair → whip pan → hook.
import { clamp, lerp, prog, ease, brandOut, brandInOut, snapOut } from "./ease.js";

const A = "../assets/coldopen/";
const MONTHS_GEN = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const DAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

// per scene: busy drawings (+ swap rate), freeze, leap, the face spot for the crash zoom (frame px),
// an insert shot, and its own foley
export const COLD_OPENS = {
  notebook: { busy: ["notebook_k1", "notebook_k2"], fps: 6, freeze: "notebook_k3", leap: "notebook_k4", face: [840, 170], insert: { kind: "notebook", from: 2.3, to: 5.5 } },
  laptop: { busy: ["laptop_k1", "laptop_k2"], fps: 0.8, freeze: "laptop_k3", leap: "laptop_k4", face: [930, 140], insert: { kind: "screen", from: 1.9, to: 5.9 } },
  nap: { busy: ["nap_k1", "nap_k2"], fps: 1.1, freeze: "nap_k3", leap: "nap_k4", face: [840, 170], insert: null, buzz: 1.45 },
  phone: { busy: ["phone_k1", "phone_k2"], fps: 0.9, freeze: "phone_k3", leap: "phone_k4", run: true, face: [880, 140], insert: { kind: "phone", from: 2.0, to: 5.4 } },
  newspaper: { busy: ["newspaper_k1", "newspaper_k2"], fps: 0.55, freeze: "newspaper_k3", leap: "newspaper_k4", face: [600, 150], insert: { kind: "news", from: 6.95, to: 9.15 } },
};

const rnd = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

export function buildColdOpen(root, id, tim, ep) {
  const W = window.__W ?? 1920, H = window.__H ?? 1080;
  const D = COLD_OPENS[id];
  if (!D) throw new Error(`unknown cold open ${id}`);
  const T = { wait: tim.wait, date: tim.date, vEnd: tim.dur };
  T.leap = T.vEnd + 0.06;
  T.whip = T.leap + 0.42;
  T.end = T.whip + 0.34;
  const talk = tim.talk;
  const frames = [...D.busy, D.freeze, D.leap];

  const layer = document.createElement("div");
  layer.className = "cold";
  layer.innerHTML = `
    <svg width="0" height="0" style="position:absolute">
      <filter id="co-boil" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
      <filter id="co-boil2" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="G" yChannelSelector="R"/></filter>
      <filter id="co-ink"><feTurbulence type="fractalNoise" baseFrequency=".04 .7" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
    </svg>
    <div class="co-shot co-wide"><div class="co-world">
      <img class="co-plate" src="${A}room.jpg"><img class="co-plate co-glow" src="${A}room.jpg">
      <img class="co-shadow" src="${A}${D.busy[0]}.webp">
      <div class="co-ink"><img class="co-char" src="${A}${D.busy[0]}.webp"><img class="co-ghost" src="${A}${D.busy[0]}.webp"><div class="co-lm"></div><div class="co-lc"></div></div>
    </div></div>
    <div class="co-shot co-insert"></div>
    <div class="co-shot co-cu"><div class="co-world">
      <img class="co-plate co-cubg" src="${A}room.jpg">
      <div class="co-ink"><img class="co-char" src="${A}face_closed.webp"><img class="co-ghost" src="${A}face_closed.webp"><div class="co-lm"></div><div class="co-lc"></div></div>
    </div></div>
    <div class="bh-haze"></div><div class="bh-leak co-leak"></div><div class="bh-vig"></div>
    <div class="co-flash"></div>`;
  root.appendChild(layer);
  const $ = (s, el = layer) => el.querySelector(s);
  const wide = $(".co-wide"), wworld = $(".co-world", wide), ins = $(".co-insert"), cu = $(".co-cu"), cworld = $(".co-world", cu);
  const turb = [...layer.querySelectorAll("feTurbulence")];
  const flash = $(".co-flash"), leak = $(".co-leak");
  const rig = (shot) => ({ ink: $(".co-ink", shot), char: $(".co-char", shot), ghost: $(".co-ghost", shot), lm: $(".co-lm", shot), lc: $(".co-lc", shot), shadow: $(".co-shadow", shot), cur: null });
  const R = rig(wide), RC = rig(cu);
  const setFrame = (r, name) => {
    if (r.cur === name) return;
    r.cur = name;
    const src = `${A}${name}.webp`;
    r.char.src = src; r.ghost.src = src;
    if (r.shadow) r.shadow.src = src;
    r.lm.style.maskImage = r.lc.style.maskImage = r.lm.style.webkitMaskImage = r.lc.style.webkitMaskImage = `url(${src})`;
  };

  // ------------------------------------------------------------ insert shots
  const r = rnd(42);
  let insUpdate = () => {};
  if (D.insert?.kind === "notebook") {
    // the drawn notebook close-up; new frantic underline strokes keep landing under "AI"
    const strokes = [];
    for (let k = 0; k < 34; k++) {
      const y = 610 + r() * 230, x0 = 1150 + r() * 160, x1 = 1720 + r() * 140, bow = (r() - 0.5) * 40;
      strokes.push({ d: `M${x0} ${y} Q${(x0 + x1) / 2} ${y + bow} ${x1} ${y + (r() - 0.5) * 30}`, w: 8 + r() * 10, at: D.insert.from + 0.15 + k * 0.09 });
    }
    ins.innerHTML = `<img class="co-ins-bg" src="${A}room.jpg"><div class="co-ink co-ins-ink">
      <img class="co-ins-img" src="${A}insert_notebook.webp">
      <svg class="co-ins-svg" viewBox="0 0 2688 1520">${strokes.map((s) => `<path d="${s.d}" stroke-width="${s.w.toFixed(1)}" pathLength="1"/>`).join("")}</svg></div>`;
    const paths = [...ins.querySelectorAll("path")], box = $(".co-ins-ink", ins);
    insUpdate = (t) => {
      paths.forEach((p, k) => (p.style.strokeDashoffset = String(1 - clamp((t - strokes[k].at) / 0.08))));
      const k = Math.floor((t - D.insert.from) / 0.09);
      box.style.transform = `translate(${Math.sin(k * 2.3) * 5}px, ${Math.cos(k * 1.7) * 4}px) rotate(${-3 + Math.sin(t * 0.8) * 0.6}deg) scale(${1.04 + (t - D.insert.from) * 0.02})`;
    };
  } else if (D.insert?.kind === "screen") {
    // laptop screen: he surfs – pages flick by, all "old news"
    const pages = [
      ["novinky-ai.cz", "ChatGPT umí zase něco nového?", "Před 3 týdny · 4 min čtení"],
      ["techweb.cz", "10 AI nástrojů, které musíte znát", "Před měsícem · 7 min čtení"],
      ["x.com", "Je tohle konec designérů?", "Před 2 týdny · 1,2 tis. komentářů"],
      ["youtube.com", "AI vs. člověk – kdo vyhraje?", "Před 5 týdny · 230 tis. zhlédnutí"],
      ["blog.digital", "Co je nového v AI tento týden", "Před 3 týdny · 6 min čtení"],
      ["reddit.com", "Vyzkoušel jsem to a…", "Před 4 týdny · 860 hlasů"],
    ];
    ins.innerHTML = `<img class="co-ins-bg" src="${A}room.jpg"><div class="co-ink co-scr">
      <div class="co-scr-in"><div class="co-scr-bar"><i></i><i></i><i></i><span class="co-url"></span></div>
      <div class="co-pages">${pages.map((p, k) => `<div class="co-page"><div class="co-ph" style="background:linear-gradient(135deg, ${["#2f6bed", "#4ea51f", "#252a35", "#c8352a", "#7a5cf0", "#e2a23a"][k]}, ${["#8fb6ff", "#bdf09a", "#5b6272", "#ff9f94", "#c4b5ff", "#ffe09a"][k]})"></div><h3>${p[1]}</h3><p class="co-meta">${p[2]}</p><p class="co-l"></p><p class="co-l"></p><p class="co-l s"></p><p class="co-l"></p></div>`).join("")}</div>
      <div class="co-cursor"></div></div></div>`;
    const pg = [...ins.querySelectorAll(".co-page")], url = $(".co-url", ins), cursor = $(".co-cursor", ins), scr = $(".co-scr", ins);
    insUpdate = (t) => {
      const lt = t - D.insert.from, k = Math.min(pages.length - 1, Math.floor(lt / 0.62));
      pg.forEach((p, i) => { p.style.display = i === k ? "block" : "none"; p.style.transform = `translateY(${-(lt - k * 0.62) * 220}px)`; });
      url.textContent = pages[k][0];
      cursor.style.transform = `translate(${760 + Math.sin(lt * 2.1) * 220}px, ${380 + Math.cos(lt * 1.6) * 140}px)`;
      scr.style.transform = `scale(${1.02 + lt * 0.012}) rotate(${-1 + Math.sin(lt) * 0.3}deg)`;
    };
  } else if (D.insert?.kind === "phone") {
    const posts = ["Před 3 týdny", "Před měsícem", "Před 2 týdny", "Před 5 týdny", "Před 4 týdny", "Před 6 týdny", "Před 3 týdny", "Před 2 měsíci"];
    ins.innerHTML = `<img class="co-ins-bg" src="${A}room.jpg"><div class="co-ink co-ph-wrap"><div class="co-phone"><div class="co-feed">${posts
      .map((p, k) => `<div class="co-post"><div class="co-av" style="background:${["#2f6bed", "#4ea51f", "#c8352a", "#e2a23a"][k % 4]}"></div><b>@ai_novinky</b><span>${p}</span><div class="co-img" style="background:linear-gradient(135deg, ${["#2f6bed", "#4ea51f", "#c8352a", "#e2a23a"][k % 4]}, ${["#9cc0ff", "#b7ec8f", "#ffb3a8", "#ffe2a0"][k % 4]})"></div></div>`)
      .join("")}</div><div class="co-island"></div></div></div>`;
    const feed = $(".co-feed", ins), wrap = $(".co-ph-wrap", ins);
    insUpdate = (t) => {
      const lt = t - D.insert.from;
      // flick-scroll: bursts of momentum
      const flick = lt * 160 + Math.floor(lt / 0.7) * 260 + snapOut(clamp((lt % 0.7) / 0.5)) * 260;
      feed.style.transform = `translateY(${-flick}px)`;
      wrap.style.transform = `rotate(${-4 + Math.sin(lt * 1.3)}deg) scale(${1 + lt * 0.015})`;
    };
  } else if (D.insert?.kind === "news") {
    const today = ep?.today ? new Date(ep.today) : new Date();
    const old = new Date(+today - 8 * 86400000);
    ins.innerHTML = `<img class="co-ins-bg" src="${A}room.jpg"><div class="co-ink co-news"><div class="co-paper">
      <div class="co-mast">DENNÍ ZPRÁVY</div><div class="co-date">${DAYS[old.getUTCDay()]} ${old.getUTCDate()}. ${MONTHS_GEN[old.getUTCMonth()]} ${old.getUTCFullYear()}</div>
      <div class="co-head">AI MĚNÍ SVĚT</div><div class="co-cols">${"<p></p>".repeat(36)}</div>
      <svg class="co-circ" viewBox="0 0 600 160"><path pathLength="1" d="M520 40 C600 70 560 140 300 140 C60 140 10 100 40 60 C80 10 330 10 560 50"/></svg></div></div>`;
    const news = $(".co-news", ins), circ = $(".co-circ path", ins);
    insUpdate = (t) => {
      const lt = t - D.insert.from, z = brandInOut(prog(lt, 0.25, 0.7));
      news.style.transform = `translate(${lerp(0, 260, z)}px, ${lerp(60, 330, z)}px) scale(${lerp(1, 1.9, z)}) rotate(${lerp(-3, -1, z)}deg)`;
      circ.style.strokeDashoffset = String(1 - brandInOut(prog(lt, 1.0, 0.45)));
    };
  }

  // ------------------------------------------------------------ timeline
  const isTalking = (t) => talk.some(([a, b]) => t >= a && t <= b);
  const mouth = (t) => {
    if (!isTalking(t)) return "face_closed";
    const k = Math.floor(t * 11);
    return ["face_open", "face_half", "face_open", "face_closed", "face_half"][(k * 7 + 3) % 5];
  };
  function update(t) {
    const on = t < T.end;
    layer.style.display = on ? "block" : "none";
    if (!on) return;
    // boil: re-seed the displacement 12×/s (hand-drawn line boil), stronger right after the twist
    const tick = Math.floor(t * 12);
    turb.forEach((f, i) => f.setAttribute("seed", String(((tick * (i + 3)) % 17) + 1)));
    const jolt = Math.floor(t / 1.7) !== Math.floor((t - 0.09) / 1.7) && t > 0.5 ? 1 : 0; // 2-frame glitch every 1.7 s
    const ghostXY = `translate(${((tick * 37) % 7) - 3}px, ${((tick * 53) % 7) - 3}px)`;

    const inInsert = D.insert && t >= D.insert.from && t < D.insert.to;
    const inCU = t >= T.date && t < T.leap;
    wide.style.display = !inInsert && !inCU ? "block" : "none";
    ins.style.display = inInsert ? "block" : "none";
    cu.style.display = inCU ? "block" : "none";

    if (!inInsert && !inCU) {
      // drawing to show
      let f;
      if (t >= T.leap) f = D.leap;
      else if (t >= T.wait) f = D.freeze;
      else if (D.buzz != null && t >= D.buzz + 0.5) f = D.freeze;
      else f = D.busy[Math.floor(t * D.fps) % D.busy.length];
      setFrame(R, f);
      // camera: slow push in, crash zoom on the freeze, shake on the leap, whip pan out
      let s = 1 + Math.min(t, T.wait) * 0.008, cx = W / 2, cy = H / 2;
      const z = snapOut(prog(t, T.wait + 0.02, 0.2)) * (t < T.leap ? 1 : 0);
      s = lerp(s, 2.05, z); cx = lerp(cx, D.face[0], z); cy = lerp(cy, D.face[1] + 120, z);
      const hx = Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.4 + (z > 0.5 ? Math.sin(t * 40) * 2 : 0);
      const hy = Math.cos(t * 1.1) * 2.5 + Math.sin(t * 2.7) * 1.2;
      let ox = W / 2 - cx * s + hx, oy = H / 2 - cy * s + hy;
      // leap: character pops up (or sprints off), paper flip, camera jolts
      let cTx = 0, cTy = 0, flip = 0;
      if (t >= T.leap) {
        const l = t - T.leap;
        if (D.run) cTx = ease.inQuad(prog(l, 0.05, 0.35)) * 1500;
        else cTy = -snapOut(prog(l, 0, 0.25)) * 70 + ease.inQuad(prog(l, 0.25, 0.3)) * 20;
        flip = Math.sin(Math.PI * clamp(l / 0.16)) * 78; // turns edge-on like a sheet of paper
        oy += Math.sin(l * 60) * 10 * (1 - clamp(l / 0.3));
      }
      const w = ease.inExpo(prog(t, T.whip, T.end - T.whip));
      ox -= w * 2600;
      wworld.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
      R.ink.style.transform = `translate(${cTx}px, ${cTy}px) perspective(1600px) rotateY(${flip}deg)`;
      if (R.shadow) R.shadow.style.transform = `translate(${46 + cTx}px, ${-8 + cTy * 0.6}px)`;
      R.ink.style.filter = jolt ? "url(#co-boil) drop-shadow(7px 0 0 rgba(255,40,90,.45)) drop-shadow(-7px 0 0 rgba(30,160,255,.45))" : "url(#co-boil)";
      R.ghost.style.transform = ghostXY;
      R.char.style.transform = jolt ? `translate(${((tick * 13) % 3) * 6 - 6}px, 0)` : "none";
      flash.style.opacity = String((t >= T.wait && t < T.wait + 0.05 ? 0.55 : 0) + w * 0.25);
    }
    if (inInsert) insUpdate(t);
    if (inCU) {
      setFrame(RC, mouth(t));
      const l = t - T.date;
      const s = 1.02 + l * 0.03 + snapOut(prog(l, 0, 0.25)) * 0.05;
      cworld.style.transform = `translate(${W / 2 - (W / 2) * s + Math.sin(t * 31) * 3}px, ${H / 2 - (H / 2) * s + Math.cos(t * 27) * 3}px) scale(${s})`;
      RC.ghost.style.transform = ghostXY;
      RC.ink.style.filter = jolt ? "url(#co-boil) drop-shadow(8px 0 0 rgba(255,40,90,.45)) drop-shadow(-8px 0 0 rgba(30,160,255,.45))" : "url(#co-boil)";
    }
    leak.style.opacity = String(0.45 + Math.sin(t * 1.7) * 0.1);
  }

  // ------------------------------------------------------------ sound (relative to the cold open start)
  const sfx = [
    { name: "../../coldopen/voice/" + id, at: 0, gain: 0, dur: T.vEnd + 0.25, fo: 0.08 },
    { name: "amb_city", at: 0, gain: -22, dur: T.end + 0.2, fi: 0.4, fo: 0.4, hp: 160, lp: 5200, pan: -0.3 },
    { name: "wind_bed", at: 0, gain: -12, dur: T.end + 0.2, fi: 0.4, fo: 0.4, hp: 150, pan: -0.2 },
    { name: "clock_tick", at: 0.3, gain: -26, dur: T.wait - 0.2, fi: 0.3, fo: 0.2, hp: 500, lp: 7000, pan: 0.4 },
    { name: "record_scratch", at: T.wait - 0.06, gain: -7, dur: 0.9, fo: 0.25 },
    { name: "hook_impact", at: T.date - 0.02, gain: -14, lp: 200 },
    { name: "cartoon_zip", at: T.leap - 0.05, gain: -4 },
    ...(D.run ? [] : [{ name: "chair_clatter", at: T.leap + 0.18, gain: -4 }]),
    { name: "camera_whip", at: T.whip - 0.12, gain: -5, hp: 60 },
  ];
  if (id === "notebook") sfx.push({ name: "pen_scribble", at: 0.15, gain: -8, dur: T.wait - 0.3, fi: 0.05, fo: 0.15 });
  if (id === "laptop") [0.4, 2.0, 3.4, 4.7, 6.1].forEach((a) => sfx.push({ name: "laptop_clicks", at: a, gain: -11, dur: 1.4, fo: 0.3 }));
  if (id === "nap") sfx.push({ name: "phone_buzz", at: D.buzz, gain: -3 });
  if (id === "phone") [0.9, 2.1, 2.8, 3.5, 4.2, 5.0].forEach((a) => sfx.push({ name: "card_swipe", at: a, gain: -15 }));
  if (id === "newspaper") {
    [0.05, 3.4, 6.0].forEach((a) => sfx.push({ name: "newspaper_rustle", at: a, gain: -7 }));
    sfx.push({ name: "marker_scratch", at: D.insert.from + 1.0, gain: -6 });
  }
  const images = [...frames.map((f) => `${A}${f}.webp`), `${A}face_open.webp`, `${A}face_half.webp`, `${A}face_closed.webp`, `${A}room.jpg`, ...(D.insert?.kind === "notebook" ? [`${A}insert_notebook.webp`] : [])];
  async function prepare() {
    await Promise.all(images.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
  }
  return { update, prepare, duration: T.end, sfx, T };
}
