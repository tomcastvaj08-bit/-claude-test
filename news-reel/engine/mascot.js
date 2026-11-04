// 2D cut-out puppet of the series mascot (parts cut from assets/coldopen/character_sheet.png by
// scripts/mascot-parts.py). No video generation: every pose is driven here, frame by frame.
//   const m = mascot();  el.appendChild(m.el);  m.pose({ x, y, s, lean, bob, armL, armR, head, expr, legs, prop })
// angles in degrees; armL/armR 0 = hanging, positive armL / negative armR = raised outwards.
import PARTS from "../assets/mascot/parts.json" with { type: "json" };

const SRC = "../assets/mascot/";
const EXPR = ["head", "head_grin", "head_shock", "head_wow"];
const box = (p) => `left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const s = document.createElement("style");
  s.textContent = `
  .ms { position:absolute; width:520px; height:1540px; transform-origin:50% 100%; pointer-events:none; }
  .ms img { position:absolute; display:block; }
  .ms .ms-up { position:absolute; inset:0; transform-origin:255px 640px; }
  .ms .ms-arm, .ms .ms-leg, .ms .ms-head { position:absolute; }
  .ms .ms-head img { transition:none; }
  .ms .ms-prop { position:absolute; left:50%; bottom:-30px; transform-origin:50% 0; }
  .ms-shadow { position:absolute; left:60px; right:60px; bottom:-26px; height:52px; border-radius:50%; background:radial-gradient(closest-side, rgba(0,0,0,.28), rgba(0,0,0,0)); }`;
  document.head.appendChild(s);
}

export function mascot({ prop = "" } = {}) {
  style();
  const P = PARTS;
  const hd = P.head;
  // expression heads (from the head sheet) include a longer neck + collar: bottom-align them a bit lower
  const heads = EXPR.map((n, i) => {
    if (i === 0) return `<img data-e="${n}" src="${SRC}${n}.png" style="left:0;top:0;width:${hd.w}px;height:${hd.h}px">`;
    const q = P[n];
    return `<img data-e="${n}" src="${SRC}${n}.png" style="left:${(hd.w - q.w) / 2}px;top:${hd.h + 46 - q.h}px;width:${q.w}px;height:${q.h}px;opacity:0">`;
  }).join("");
  const arm = (n) => {
    const a = P[n];
    return `<div class="ms-arm ${n}" style="${box(a)};transform-origin:${a.w / 2}px 16px"><img src="${SRC}${n}.png" style="left:0;top:0;width:${a.w}px;height:${a.h}px"><div class="ms-prop"></div></div>`;
  };
  const leg = (n) => `<div class="ms-leg ${n}" style="${box(P[n])};transform-origin:${P[n].w / 2}px 10px"><img src="${SRC}${n}.png" style="left:0;top:0;width:${P[n].w}px;height:${P[n].h}px"></div>`;
  const wrap = document.createElement("div");
  wrap.className = "ms";
  wrap.innerHTML = `<div class="ms-shadow"></div>${leg("legL")}${leg("legR")}
    <div class="ms-up">
      <img class="ms-torso" src="${SRC}torso.png" style="${box(P.torso)}">
      <div class="ms-head" style="${box(hd)};transform-origin:${hd.w / 2}px ${hd.h - 14}px">${heads}</div>
      ${arm("armL")}${arm("armR")}
    </div>`;
  const up = wrap.querySelector(".ms-up"), head = wrap.querySelector(".ms-head");
  const aL = wrap.querySelector(".armL"), aR = wrap.querySelector(".armR");
  const lL = wrap.querySelector(".legL"), lR = wrap.querySelector(".legR");
  const imgs = [...head.querySelectorAll("img")];
  const propEl = (side) => (side === "L" ? aL : aR).querySelector(".ms-prop");
  if (prop) propEl(prop.side ?? "R").innerHTML = prop.html ?? prop;
  return {
    el: wrap,
    prop: (side, html) => (propEl(side).innerHTML = html),
    pose({ x = 0, y = 0, s = 0.42, lean = 0, bob = 0, sq = 0, armL = 4, armR = -4, head: hr = 0, expr = "head", legs = 0, flip = false, opacity = 1 } = {}) {
      // squash & stretch around the feet, lean from the hips, legs swing for a walk cycle
      wrap.style.transform = `translate(${x - 260}px, ${y - 1540 + bob}px) scale(${s * (flip ? -1 : 1) * (1 + sq * 0.5)}, ${s * (1 - sq)})`;
      wrap.style.opacity = String(opacity);
      up.style.transform = `rotate(${lean}deg)`;
      head.style.transform = `rotate(${hr}deg)`;
      aL.style.transform = `rotate(${armL}deg)`;
      aR.style.transform = `rotate(${armR}deg)`;
      lL.style.transform = `rotate(${legs}deg)`;
      lR.style.transform = `rotate(${-legs}deg)`;
      imgs.forEach((im) => (im.style.opacity = im.dataset.e === expr ? "1" : "0"));
    },
  };
}
