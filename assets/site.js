document.documentElement.classList.add("js");
(() => {
  const CONTACT_EMAIL = "info@efektive.cz";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const BLUE = [80, 120, 255];
  const GREEN = [40, 220, 150];
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => t * t * (3 - 2 * t);

  // Header border once scrolled.
  const bar = document.getElementById("top-bar");
  const eyebrow = document.querySelector(".hero .eyebrow");
  if (bar && eyebrow) new IntersectionObserver(([e]) => bar.classList.toggle("scrolled", !e.isIntersecting)).observe(eyebrow);
  // Once you scroll, the logo slides away and the site switch glides to the middle of the strip.
  const sw = bar && bar.querySelector(".switch");
  if (sw) {
    let away = null;
    const center = () => {
      const was = bar.classList.contains("away");
      bar.classList.remove("away");
      sw.style.transition = "none";
      const r = sw.getBoundingClientRect();
      bar.style.setProperty("--sx", (window.innerWidth / 2 - (r.left + r.width / 2)).toFixed(1) + "px");
      bar.classList.toggle("away", was);
      void sw.offsetWidth;
      sw.style.transition = "";
    };
    const onScroll = () => {
      const a = window.scrollY > 24;
      if (a !== away) { away = a; bar.classList.toggle("away", a); }
    };
    center();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", center, { passive: true });
    if (document.fonts) document.fonts.ready.then(center);
  }

  // Hero headline: letters arrive one by one.
  let c = 0;
  document.querySelectorAll(".hero h1 .line").forEach((line) => {
    const grad = line.classList.contains("grad-line");
    const words = line.textContent.split(" ");
    line.textContent = "";
    words.forEach((word, wi) => {
      const w = document.createElement("span");
      w.className = "word";
      for (const chr of word) {
        const sp = document.createElement("span");
        sp.className = "ch" + (grad ? " hl" : "");
        sp.style.setProperty("--c", c++);
        sp.textContent = chr;
        w.appendChild(sp);
      }
      line.appendChild(w);
      if (wi < words.length - 1) { line.appendChild(document.createTextNode(" ")); c++; }
    });
  });

  // Reveal on scroll.
  const rio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".rv").forEach((el) => rio.observe(el));

  // Copy Patreon link (every link row on the page).
  const OK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  document.querySelectorAll(".url-row").forEach((row) => {
    const btn = row.querySelector(".copy"), urlEl = row.querySelector(".url"), status = row.querySelector(".copy-status");
    const ICON = btn.innerHTML;
    btn.addEventListener("click", () => {
      const done = () => {
        btn.innerHTML = OK_ICON; btn.classList.add("done"); status.textContent = "Odkaz zkopírován";
        setTimeout(() => { btn.innerHTML = ICON; btn.classList.remove("done"); status.textContent = ""; }, 1800);
      };
      const select = () => {
        const r = document.createRange(); r.selectNodeContents(urlEl);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        status.textContent = "Odkaz označen, zkopírujte ho";
      };
      try { navigator.clipboard.writeText(urlEl.textContent).then(done, select); } catch (e) { select(); }
    });
  });

  // Magnetic buttons on desktop.
  if (fine && !reduce) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const b = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${(e.clientX - b.left - b.width / 2) * 0.16}px`);
        el.style.setProperty("--my", `${(e.clientY - b.top - b.height / 2) * 0.28}px`);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
    });
  }

  // Links that preselect a topic in the form.
  document.querySelectorAll("[data-topic]").forEach((a) => a.addEventListener("click", () => {
    const box = document.querySelector(`#lead input[value="${a.dataset.topic}"]`);
    if (box) box.checked = true;
  }));

  // Contact form: validate, then open a prefilled e-mail.
  const form = document.getElementById("lead");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim(), contact = form.phone.value.trim();
    document.getElementById("f-name").classList.toggle("bad", !name);
    document.getElementById("f-phone").classList.toggle("bad", !contact);
    if (!name) { form.name.focus(); return; }
    if (!contact) { form.phone.focus(); return; }
    const topics = [...form.querySelectorAll('input[name="topic"]:checked')].map((i) => i.value).join(", ") || "neuvedeno";
    const body = `Jméno: ${name}\nKontakt: ${contact}\nS čím: ${topics}\n\n${form.msg.value.trim()}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Poptávka z webu: " + topics)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    document.getElementById("form-status").textContent = "Otevřeli jsme vám e-mail. Pokud se nic nestalo, napište nám na " + CONTACT_EMAIL + ".";
  });

  // Caption demo: highlighted word steps through the line, like our app's "negativ" style.
  const capWords = [...document.querySelectorAll("#cap-line span")];
  if (capWords.length) {
    let i = 0;
    capWords[0].classList.add("on");
    if (!reduce) setInterval(() => {
      capWords[i].classList.remove("on");
      i = (i + 1) % capWords.length;
      capWords[i].classList.add("on");
    }, 650);
  }

  // ---------- Canvas helpers ----------
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function fit(cv) {
    const r = cv.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * DPR)), h = Math.max(1, Math.round(r.height * DPR));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return [w, h];
  }
  const rgba = (col, a) => `rgba(${col[0]},${col[1]},${col[2]},${a})`;
  const grain = document.createElement("canvas");
  grain.width = grain.height = 160;
  (() => {
    const g = grain.getContext("2d"), img = g.createImageData(160, 160), r = rng(7);
    for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 40; }
    g.putImageData(img, 0, 0);
    document.documentElement.style.setProperty("--grain", `url(${grain.toDataURL()})`);
  })();
  function base(ctx, w, h, glows) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0d1322"); bg.addColorStop(1, "#05070c");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    for (const [x, y, col, a] of glows) {
      const R = Math.max(w, h) * 0.7, g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, R);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(0.4, rgba(col, a * 0.25)); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  }
  function city(ctx, w, h, r) {
    const u = Math.max(w, h * 0.56) / 360; let x = -6 * u;
    while (x < w) {
      const bw = (14 + r() * 40) * u, bh = h * (0.1 + r() * 0.28);
      ctx.fillStyle = "rgba(3,5,9,0.95)"; ctx.fillRect(x, h - bh, bw, bh);
      const step = 7 * u;
      for (let k = 0; k < Math.floor(bw / step); k++)
        for (let y = h - bh + 6 * u; y < h - 4 * u; y += 9 * u)
          if (r() < 0.15) { ctx.fillStyle = r() < 0.55 ? rgba(BLUE, 0.35 + r() * 0.5) : rgba(GREEN, 0.3 + r() * 0.45); ctx.fillRect(x + 3 * u + k * step, y, 2 * u, 3 * u); }
      x += bw + r() * 4 * u;
    }
  }
  function cracks(ctx, w, h, r, cx, cy, alpha) {
    ctx.lineCap = "round";
    const arms = 10 + Math.floor(r() * 5);
    for (let a = 0; a < arms; a++) {
      let ang = (a / arms) * Math.PI * 2 + r() * 0.4, x = cx, y = cy;
      const len = Math.max(w, h) * (0.25 + r() * 0.45);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < 12; s++) { ang += (r() - 0.5) * 0.5; x += Math.cos(ang) * (len / 12); y += Math.sin(ang) * (len / 12); ctx.lineTo(x, y); }
      ctx.strokeStyle = `rgba(230,240,255,${(0.14 + r() * 0.22) * alpha})`; ctx.lineWidth = (0.6 + r() * 0.9) * DPR; ctx.stroke();
    }
  }
  function makeParticles(r, n) {
    return Array.from({ length: n }, () => ({ x: r(), y: r(), z: 0.3 + r() * 0.7, s: 0.5 + r() * 1.7, p: r() * Math.PI * 2, v: 0.004 + r() * 0.012, g: r() < 0.5 }));
  }
  function particles(ctx, w, h, list, t, alpha = 1) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const q of list) {
      const y = ((q.y - t * q.v * 0.02) % 1 + 1) % 1, x = q.x + Math.sin(t * 0.0006 + q.p) * 0.01 * q.z;
      const px = x * w, py = y * h, rad = q.s * q.z * DPR * 2.2, tw = 0.55 + 0.45 * Math.sin(t * 0.002 + q.p * 3);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad * 3);
      g.addColorStop(0, rgba(q.g ? GREEN : BLUE, 0.6 * tw * q.z * alpha)); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(px - rad * 3, py - rad * 3, rad * 6, rad * 6);
    }
    ctx.restore();
  }
  function grainOver(ctx, w, h, t, alpha = 0.7) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(-Math.floor((t * 0.07) % 160), -Math.floor((t * 0.05) % 160));
    ctx.fillStyle = ctx.createPattern(grain, "repeat"); ctx.fillRect(0, 0, w + 160, h + 160);
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, rad) {
    ctx.beginPath(); ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath();
  }
  function timeline(ctx, w, h, r) {
    const top = h * 0.5, rowH = h * 0.07, gap = h * 0.035;
    for (let i = 0; i < 3; i++) {
      let x = w * 0.06; const y = top + i * (rowH + gap);
      while (x < w * 0.94) {
        const cw = w * (0.06 + r() * 0.2);
        ctx.fillStyle = rgba(i % 2 ? BLUE : [140, 170, 255], 0.28 + r() * 0.35);
        roundRect(ctx, x, y, Math.min(cw, w * 0.94 - x), rowH, rowH * 0.25); ctx.fill();
        x += cw + w * 0.012;
      }
    }
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillRect(w * 0.58, top - h * 0.04, 2 * DPR, 3 * (rowH + gap) + h * 0.04);
  }
  function bars(ctx, w, h, r) {
    const bw = w * 0.07;
    for (let i = 0; i < 7; i++) {
      const bh = h * (0.12 + i * 0.075 + r() * 0.05);
      ctx.fillStyle = rgba(GREEN, 0.3 + i * 0.08);
      roundRect(ctx, w * 0.14 + i * bw * 1.45, h * 0.86 - bh, bw, bh, bw * 0.25); ctx.fill();
    }
  }

  // Animated night scene, only drawn while on screen.
  function scene(canvas, seed, opts = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d"), pts = makeParticles(rng(seed + 1), opts.count || 60);
    let raf = 0, visible = true;
    function frame(t) {
      const [w, h] = fit(canvas), r = rng(seed);
      base(ctx, w, h, opts.glows || [[0.25, 0.3, BLUE, 0.45], [0.8, 0.55, GREEN, 0.35]]);
      city(ctx, w, h, r);
      cracks(ctx, w, h, r, w * (opts.cx || 0.5), h * (opts.cy || 0.32), 0.9);
      particles(ctx, w, h, pts, t);
      grainOver(ctx, w, h, reduce ? 0 : t);
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(frame); }).observe(canvas);
    frame(0);
    window.addEventListener("resize", () => { if (reduce || !visible) frame(0); }, { passive: true });
  }
  scene(document.getElementById("reel-l"), 3, { count: 70 });
  scene(document.getElementById("reel-r"), 3, { count: 70 });
  scene(document.getElementById("t-patreon"), 3, { count: 50, cx: 0.5, cy: 0.3 });
  scene(document.getElementById("t-ai"), 27, { count: 40, cx: 0.7, cy: 0.25, glows: [[0.7, 0.2, BLUE, 0.5], [0.1, 0.7, GREEN, 0.3]] });
  scene(document.getElementById("contact-art"), 19, { count: 40, cx: 0.78, cy: 0.2, glows: [[0.75, 0.15, BLUE, 0.5], [0.2, 0.05, GREEN, 0.3]] });

  // Layer plates for the Patreon section.
  function plate(canvas) {
    const ctx = canvas.getContext("2d"), [w, h] = fit(canvas), r = rng(91), kind = canvas.dataset.layer;
    ctx.clearRect(0, 0, w, h);
    if (kind === "video") { base(ctx, w, h, [[0.3, 0.3, BLUE, 0.45], [0.8, 0.6, GREEN, 0.35]]); city(ctx, w, h, r); grainOver(ctx, w, h, 0); }
    if (kind === "teecee") {
      ctx.fillStyle = "rgba(31,77,255,0.08)"; ctx.fillRect(0, 0, w, h);
      cracks(ctx, w, h, r, w * 0.62, h * 0.28, 1.3);
      particles(ctx, w, h, makeParticles(rng(5), 26), 0, 1.3);
      timeline(ctx, w, h, rng(12));
    }
    if (kind === "maty") { ctx.fillStyle = "rgba(19,185,122,0.08)"; ctx.fillRect(0, 0, w, h); bars(ctx, w, h, rng(33)); }
  }
  const drawPlates = () => document.querySelectorAll("canvas[data-layer]").forEach(plate);
  drawPlates();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawPlates, 150); }, { passive: true });

  // Smoothed scroll progress for a section: follows the finger softly, so jerky touch scroll never shakes.
  function smoothProgress(el, onUpdate, { start = 0, pin = false } = {}) {
    let p = 0, target = 0, raf = 0, active = false;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (pin) {
        const total = r.height - window.innerHeight;
        target = total > 0 ? clamp(-r.top / total) : 0;
      } else {
        const vh = window.innerHeight;
        target = clamp((vh * (1 - start) - r.top) / (r.height + vh * 0.2));
      }
    };
    const loop = () => {
      read();
      p += (target - p) * 0.12;
      if (Math.abs(target - p) < 0.0005) p = target;
      onUpdate(p);
      raf = active ? requestAnimationFrame(loop) : 0;
    };
    new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active && !raf) raf = requestAnimationFrame(loop); }).observe(el);
    read(); p = target; onUpdate(p);
  }

  // Chain: line fills and links light up as you scroll.
  const chain = document.getElementById("chain");
  const chainItems = chain ? [...chain.querySelectorAll(".link-item")] : [];
  if (!chain) { /* not on this page */ }
  else if (reduce) { chain.style.setProperty("--p", 1); chainItems.forEach((li) => li.classList.add("on")); }
  else smoothProgress(chain, (p) => {
    const v = clamp(p * 1.25);
    chain.style.setProperty("--p", v.toFixed(4));
    chainItems.forEach((li, i) => li.classList.toggle("on", v >= (i + 0.2) / chainItems.length));
  }, { start: 0.2 });

  // Patreon layers: pinned, open on scroll, sparks fly out and back.
  (() => {
    const sec = document.querySelector(".layers");
    if (!sec || reduce) return;
    sec.classList.add("js-pin");
    const sceneEl = sec.querySelector(".scene");
    const plates = [...sec.querySelectorAll(".plate")];
    const items = [...sec.querySelectorAll(".legend li")];
    const ranges = [[0.34, 0.5], [0.12, 0.28]];
    const cv = document.createElement("canvas");
    cv.className = "sparks";
    cv.setAttribute("aria-hidden", "true");
    sec.querySelector(".stack").appendChild(cv);
    const sctx = cv.getContext("2d");
    const R = rng(77);
    const sparks = Array.from({ length: 70 }, () => ({ a: R() * Math.PI * 2, d: 0.3 + R() * 0.7, s: 0.8 + R() * 2.4, k: R() * 0.45, ph: R() * Math.PI * 2, g: R() < 0.5, star: R() < 0.3, lift: 0.1 + R() * 0.25 }));
    const drawSparks = (spread, now) => {
      const [w, h] = fit(cv);
      sctx.clearRect(0, 0, w, h);
      if (spread <= 0.001) return;
      const cx = w / 2, cy = h * 0.52, rad = Math.min(w, h) * 0.5;
      for (const q of sparks) {
        const local = ease(clamp((spread - q.k * 0.6) / (1 - q.k * 0.6)));
        if (local <= 0) continue;
        const drift = Math.sin(now * 0.0007 + q.ph) * 0.03;
        const x = cx + Math.cos(q.a + drift) * rad * q.d * local;
        const y = cy + Math.sin(q.a + drift) * rad * q.d * 0.75 * local - h * q.lift * local;
        const tw = 0.55 + 0.45 * Math.sin(now * 0.004 + q.ph * 3);
        const alpha = local * tw;
        const size = q.s * DPR * (0.6 + 0.4 * local);
        const glow = sctx.createRadialGradient(x, y, 0, x, y, size * 5);
        glow.addColorStop(0, rgba(q.g ? GREEN : BLUE, 0.55 * alpha));
        glow.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = glow;
        sctx.fillRect(x - size * 5, y - size * 5, size * 10, size * 10);
        sctx.fillStyle = `rgba(255,255,255,${(0.9 * alpha).toFixed(3)})`;
        if (q.star) {
          const L = size * 3.2;
          sctx.beginPath();
          sctx.moveTo(x, y - L); sctx.lineTo(x + size * 0.5, y); sctx.lineTo(x, y + L); sctx.lineTo(x - size * 0.5, y); sctx.closePath();
          sctx.moveTo(x - L, y); sctx.lineTo(x, y + size * 0.5); sctx.lineTo(x + L, y); sctx.lineTo(x, y - size * 0.5); sctx.closePath();
          sctx.fill();
        } else { sctx.beginPath(); sctx.arc(x, y, size * 0.7, 0, Math.PI * 2); sctx.fill(); }
      }
    };
    const step = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--step")) || 52;
    smoothProgress(sec, (p) => {
      const spread = ease(clamp(p / 0.5));
      const st = step();
      plates.forEach((pl) => { const n = +pl.style.getPropertyValue("--n") || 0; pl.style.transform = `translate3d(0,0,${(n * st * spread).toFixed(2)}px)`; });
      sceneEl.style.transform = `rotateX(54deg) rotateZ(-36deg) scale(${(0.72 + 0.1 * Math.sin(Math.PI * p)).toFixed(4)})`;
      drawSparks(spread, performance.now());
      items.forEach((li, i) => {
        const [a, b] = ranges[i] || [0, 0.1];
        const k = ease(clamp((p - a) / (b - a)));
        li.style.opacity = (0.2 + 0.8 * k).toFixed(3);
        li.style.transform = `translate3d(${(-10 * (1 - k)).toFixed(2)}px,0,0)`;
      });
    }, { pin: true });
  })();


  // ---------- Clients: floating, draggable bubbles with video previews ----------
  (() => {
    const arena = document.getElementById("arena");
    if (!arena) return;
    const W = "https://a620bd5331.clvaw-cdnwnd.com/eb03baedff6daa10d78f98e571732383/";
    const CLIENTS = [
      { name: "Tary", meta: "YouTube · 1,71 mil. odběratelů", av: W + "200000643-b91c8b91ca/450/IMG_4132-8.webp?ph=a620bd5331", yt: "tfkOIZw8mFs", fmt: "long" },
      { name: "Braeden", meta: "Creator · 1,3 mil. sledujících", av: W + "200000645-6313563136/450/IMG_4137-8.webp?ph=a620bd5331", yt: "5skSP2-p3mE", fmt: "short" },
      { name: "Harv Connell", meta: "Creator · anglický obsah", av: W + "200000651-0ee870ee89/450/IMG_4139-1.webp?ph=a620bd5331", yt: "Wi_21EqgjBM", fmt: "long" },
      { name: "Tripaři na stopu", meta: "YouTube · 14,8 tis. odběratelů", av: W + "200000784-e4e7de4e7f/channels4_profile.webp?ph=a620bd5331", yt: "-xpR4gBzmLI", fmt: "long" },
      { name: "The Long Investor", meta: "YouTube · investice", av: "https://yt3.googleusercontent.com/AzeaUnZxKelgqc_E8GENApn1FQpy8rN-SFha45X0uyKM5KyuNk0Bq3huG39A-5qLS-mb_2WC=s160-c-k-c0x00ffffff-no-rj", yt: "pbCkKZnR2Jc", start: 392, fmt: "long" },
      { name: "Martin Cuper", meta: "YouTube · 14 tis. odběratelů", av: "https://yt3.ggpht.com/86qQEg0uDj2fgggL7u_ETSF7qt7uO0BWpM7M5Mv4vFw-FDSoSau4fMY7SYVkE9Qb-1MfBDyj3A=s176-c-k-c0x00ffffff-no-rj-mo", yt: "5dnivJD0Oyk", fmt: "long" },
      { name: "Resono", meta: "Vizuály na projekci pro akci", mono: "RESONO", monoBg: "#14102a", file: "assets/clients/resono.mp4", preview: "assets/clients/resono-preview.mp4", poster: "assets/clients/resono.jpg", fmt: "long", label: "Vizuály" },
      { name: "Best Account", meta: "Účetní kancelář", av: "assets/clients/bestaccount-logo.webp", file: "assets/clients/bestaccount.mp4", poster: "assets/clients/bestaccount.jpg", fmt: "short" },
      { name: "BU1", meta: "@goalkeepingforever", link: "https://www.instagram.com/goalkeepingforever/", av: "assets/clients/bu1-logo.webp", file: "assets/clients/bu1.mp4", preview: "assets/clients/bu1-preview.mp4", poster: "assets/clients/bu1.jpg", fmt: "short" },
    ];
    const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

    // Build the cards.
    const bodies = CLIENTS.map((c) => {
      const el = document.createElement("div");
      el.className = "bub " + c.fmt;
      const thumb = c.poster ? c.poster : c.drive ? `https://drive.google.com/thumbnail?id=${c.drive}&sz=w600` : c.fmt === "short" ? `https://i.ytimg.com/vi/${c.yt}/hqdefault.jpg` : `https://i.ytimg.com/vi/${c.yt}/mqdefault.jpg`;
      const avatar = c.mono ? `<span class="mono" style="--mono-bg:${c.monoBg};${c.mono.length > 4 ? "font-size:0.62rem" : ""}">${c.mono}</span>` : `<img src="${c.av}" alt="${c.name}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
      const meta = c.link ? `<a class="bub-meta" href="${c.link}" target="_blank" rel="noopener">${c.meta}</a>` : `<span class="bub-meta">${c.meta}</span>`;
      el.innerHTML = `
        ${c.sticker ? `<img class="stk big" src="assets/braeden-collage.webp" alt="Braeden: 62 mil. zhlédnutí, 21,3 mil. u jednoho videa, retence 60 %" width="520" height="959" loading="lazy" decoding="async">` : ""}
        <button type="button" class="bub-av" aria-label="Chytit ${c.name}">${avatar}</button>
        <span class="bub-name">${c.name}</span>
        ${meta}
        <button type="button" class="bub-vid" aria-label="Pustit video: ${c.name}"><img src="${thumb}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')"><span class="fmt">${c.label || (c.fmt === "short" ? "Short" : "Long form")}</span><span class="play">${PLAY}</span></button>`;
      arena.appendChild(el);
      el.querySelector(".bub-vid").addEventListener("click", () => c.drive ? window.open(`https://drive.google.com/file/d/${c.drive}/view`, "_blank", "noopener") : openVideo({ title: c.name, yt: c.yt, start: c.start, drive: c.drive, file: c.file, poster: c.poster, fmt: c.fmt }));
      return { c, el, x: 0, y: 0, vx: 0, vy: 0, wind: 0, ph: Math.random() * Math.PI * 2, w: 0, h: 0, r: 0, drag: null, s: 1 };
    });

    if (reduce) { arena.classList.add("static"); return; }

    // Live previews. A muted clip plays in every card that is on screen or about to drift in.
    // Players are created ahead of time (cards travel left to right, so the ones just off the left edge
    // are warmed up first) and removed once a card is well out of view, so only a few exist at once.
    // The thumbnail stays on top until the player reports that it is actually playing, then cross-fades.
    // Skipped for reduced motion (above) and Data Saver.
    const preview = (() => {
      const conn = navigator.connection;
      if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""))) return null;
      const live = new Set();
      let near = false, seq = 0;
      const ytSrc = (c, id) => {
        const start = c.start || (c.fmt === "long" ? 30 : 0);
        const q = new URLSearchParams({ autoplay: "1", mute: "1", controls: "0", loop: "1", playlist: c.yt, playsinline: "1", modestbranding: "1", rel: "0", iv_load_policy: "3", disablekb: "1", fs: "0", enablejsapi: "1", origin: location.origin, widget_referrer: location.href });
        if (start) q.set("start", String(start));
        return `https://www.youtube-nocookie.com/embed/${c.yt}?${q}`;
      };
      const show = (b, m) => { if (b.live === m) b.el.querySelector(".bub-vid").classList.add("is-live"); };
      // YouTube tells us when playback really starts (playerState 1); fade in only then.
      window.addEventListener("message", (e) => {
        if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
        let d = e.data;
        try { if (typeof d === "string") d = JSON.parse(d); } catch (err) { return; }
        if (!d || !d.info || d.info.playerState !== 1) return;
        for (const b of live) if (b.live && b.live.contentWindow === e.source && !b.live.dataset.playing) {
          const m = b.live;
          m.dataset.playing = "1";
          setTimeout(() => show(b, m), 5200);
        }
      });
      const mount = (b) => {
        if (b.live) return;
        const c = b.c, box = b.el.querySelector(".bub-vid");
        let m;
        if (c.file) {
          m = document.createElement("video");
          Object.assign(m, { src: c.preview || c.file, muted: true, loop: true, playsInline: true, autoplay: true, preload: "auto" });
          m.setAttribute("muted", "");
          m.setAttribute("playsinline", "");
          m.addEventListener("playing", () => show(b, m), { once: true });
        } else if (c.yt) {
          const id = "yt" + ++seq;
          m = document.createElement("iframe");
          m.id = id;
          m.src = ytSrc(c, id);
          m.allow = "autoplay; encrypted-media; picture-in-picture";
          m.referrerPolicy = "strict-origin-when-cross-origin";
          m.addEventListener("load", () => {
            // Subscribe to state events; keep a fallback in case the API message never arrives.
            try { m.contentWindow.postMessage(JSON.stringify({ event: "listening", id, channel: "widget" }), "*"); } catch (err) {}
            // No timed fallback: a player that never reports "playing" simply keeps its thumbnail.
          }, { once: true });
        } else return;
        m.className = "bub-live";
        m.tabIndex = -1;
        m.setAttribute("aria-hidden", "true");
        box.insertBefore(m, box.querySelector(".fmt"));
        if (c.file) m.play().catch(() => {});
        b.live = m;
        live.add(b);
      };
      const unmount = (b) => {
        if (!b.live) return;
        b.el.querySelector(".bub-vid").classList.remove("is-live");
        const m = b.live;
        b.live = null;
        live.delete(b);
        setTimeout(() => m.remove(), 450);
      };
      // Players are created once, one at a time while the browser is idle, and then kept running.
      // Creating a YouTube player is the expensive part (it is what made the cards stutter at the left edge),
      // so it never happens again while the cards are moving. Everything is torn down only after the
      // section has been far off screen for a while, or the tab is hidden.
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
      let queue = [], pumping = false, farTimer = 0;
      const pump = () => {
        if (!near || document.hidden || !queue.length) { pumping = false; return; }
        pumping = true;
        idle(() => { const b = queue.shift(); if (b) mount(b); setTimeout(pump, 700); }, { timeout: 1500 });
      };
      const start = () => {
        clearTimeout(farTimer);
        // Cards on screen first, then the ones about to drift in from the left, then the rest.
        const rank = (b) => {
          const l = b.x - b.w / 2, r = b.x + b.w / 2;
          if (r > 0 && l < AW) return 0;
          if (r <= 0) return 1 - r / AW;
          return 10;
        };
        queue = bodies.filter((b) => !b.live && (b.c.yt || b.c.file)).sort((a, z) => rank(a) - rank(z));
        if (!pumping) pump();
      };
      const stop = () => { queue = []; [...live].forEach(unmount); };
      new IntersectionObserver(([e]) => {
        near = e.isIntersecting;
        if (near) start();
        else { clearTimeout(farTimer); farTimer = setTimeout(stop, 5000); }
      }, { rootMargin: "900px 0px" }).observe(arena);
      document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (near) start(); });
      return { start, stop };
    })();

    let AW = 0, AH = 0;
    const measure = () => {
      AW = arena.clientWidth; AH = arena.clientHeight;
      if (bodies[0].home !== undefined) requestAnimationFrame(() => bodies.forEach((b) => (b.home = laneY(b.lane))));
      const small = AW < 600;
      bodies.forEach((b) => {
        b.w = b.el.offsetWidth; b.h = b.el.offsetHeight;
        const big = b.el.querySelector(".stk.big");
        b.extra = big ? Math.max(0, big.offsetHeight - 30) : 0;
        b.r = (b.w + b.h) / 4;
        b.wind = (small ? 16 : 26) + Math.random() * (small ? 14 : 22);
      });
    };
    measure();
    // Each card floats in its own lane, so they spread over the whole area.
    const n = bodies.length;
    let lanes = 2;
    const laneY = (k) => {
      const maxH = Math.max(...bodies.map((b) => b.h)) + 40;
      lanes = Math.max(1, Math.min(3, Math.floor((AH - 40) / (maxH * 0.78))));
      return 40 + (AH - 40) * ((k % lanes) + 0.5) / lanes;
    };
    const order = bodies.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((idx, i) => {
      const b = bodies[idx];
      b.lane = i;
      b.home = laneY(i);
      b.x = -AW * 0.45 + (i + 0.2 + Math.random() * 0.5) * (AW * 1.4 / n);
      b.y = b.home;
      b.vx = b.wind; b.vy = 0;
    });

    const place = (b) => {
      b.el.style.transform = `translate3d(${(b.x - b.w / 2).toFixed(1)}px, ${(b.y - b.h / 2).toFixed(1)}px, 0) scale(${b.s.toFixed(3)})`;
    };
    let zTop = 10;

    // Dragging by the profile picture.
    bodies.forEach((b) => {
      const handle = b.el.querySelector(".bub-av");
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        const r = arena.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        b.drag = { id: e.pointerId, ox: b.x - px, oy: b.y - py, hist: [{ x: b.x, y: b.y, t: performance.now() }] };
        b.el.classList.add("grab");
        b.el.style.zIndex = ++zTop;
        arena.classList.add("touched");
      });
      handle.addEventListener("pointermove", (e) => {
        if (!b.drag || b.drag.id !== e.pointerId) return;
        const r = arena.getBoundingClientRect();
        b.x = e.clientX - r.left + b.drag.ox;
        b.y = Math.min(AH - b.h / 2 + 30, Math.max(b.h / 2 - 30, e.clientY - r.top + b.drag.oy));
        const now = performance.now();
        b.drag.hist.push({ x: b.x, y: b.y, t: now });
        while (b.drag.hist.length > 2 && now - b.drag.hist[0].t > 90) b.drag.hist.shift();
      });
      const end = (e) => {
        if (!b.drag || b.drag.id !== e.pointerId) return;
        const h = b.drag.hist, a = h[0], z = h[h.length - 1], dt = Math.max(16, z.t - a.t) / 1000;
        b.vx = Math.max(-1600, Math.min(1600, (z.x - a.x) / dt));
        b.vy = Math.max(-1600, Math.min(1600, (z.y - a.y) / dt));
        b.drag = null;
        b.el.classList.remove("grab");
      };
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });

    let raf = 0, last = 0, visible = false;
    const step = (now) => {
      const dt = Math.min(0.033, (now - (last || now)) / 1000);
      last = now;
      const t = now / 1000;
      for (const b of bodies) {
        b.s += ((b.drag ? 1.06 : 1) - b.s) * 0.2;
        if (b.drag) { b.vx = 0; b.vy = 0; continue; }
        // Ease back toward the gentle left-to-right drift.
        const tx = b.wind, ty = (b.home - b.y) * 0.35 + Math.sin(t * 0.7 + b.ph) * 14;
        const k = Math.min(1, dt * 0.9);
        b.vx += (tx - b.vx) * k;
        b.vy += (ty - b.vy) * k;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        const top = b.h / 2 + 40, bottom = Math.max(top, AH - b.h / 2 - 8 - b.extra * 0.8);
        if (b.y < top) { b.y = top; b.vy = Math.abs(b.vy) * 0.7; }
        if (b.y > bottom) { b.y = bottom; b.vy = -Math.abs(b.vy) * 0.7; }
        // Leave on the right, come back on the left at a random height.
        if (b.x - b.w / 2 > AW + 40) {
          b.x = -b.w / 2 - 40 - Math.random() * AW * 0.5;
          b.home = laneY(b.lane);
          b.y = Math.min(bottom, Math.max(top, b.home));
          b.vx = b.wind; b.vy = 0;
        }
        if (b.x + b.w / 2 < -AW * 0.9) { b.x = -b.w / 2 - 20; b.vx = b.wind; }
      }
      // Cards bump into each other like boxes; a dragged card shoves everything out of the way.
      const GAP = 8;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const A = bodies[i], B = bodies[j];
        const dx = B.x - A.x, dy = B.y - A.y;
        const ox = (A.w + B.w) / 2 + GAP - Math.abs(dx);
        const oy = (A.h + B.h + 64) / 2 + GAP - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        let nx = 0, ny = 0, over;
        if (ox < oy) { nx = Math.sign(dx) || 1; over = ox; } else { ny = Math.sign(dy) || 1; over = oy; }
        const ia = A.drag ? 0 : 1, ib = B.drag ? 0 : 1, sum = ia + ib || 1;
        A.x -= nx * over * (ia / sum); A.y -= ny * over * (ia / sum);
        B.x += nx * over * (ib / sum); B.y += ny * over * (ib / sum);
        const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
        if (rv < 0) {
          const imp = -1.7 * rv / sum;
          A.vx -= imp * nx * ia; A.vy -= imp * ny * ia;
          B.vx += imp * nx * ib; B.vy += imp * ny * ib;
        }
        if (A.drag && !B.drag) { B.vx += nx * 80; B.vy += ny * 80; }
        if (B.drag && !A.drag) { A.vx -= nx * 80; A.vy -= ny * 80; }
      }
      bodies.forEach(place);
      raf = visible ? requestAnimationFrame(step) : 0;
    };
    bodies.forEach(place);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(step); }
    }).observe(arena);
    let rz;
    window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(measure, 150); }, { passive: true });
  })();

  // ---------- Video modal: YouTube (clients) and Instagram (portfolio) ----------
  const vmodal = document.getElementById("vmodal");
  const vframe = document.getElementById("vm-frame");
  const vbox = vmodal.querySelector(".vm-box");
  const vext = document.getElementById("vm-ext");
  let lastFocus = null;
  function openVideo(v) {
    lastFocus = document.activeElement;
    vbox.classList.toggle("short", v.fmt === "short");
    vbox.classList.toggle("ig", !!v.ig);
    vbox.classList.toggle("drive", !!(v.drive || v.file) && v.fmt === "short");
    document.getElementById("vm-title").textContent = v.title;
    const src = v.ig
      ? `https://www.instagram.com/reel/${v.ig}/embed/`
      : v.drive ? `https://drive.google.com/file/d/${v.drive}/preview`
      : `https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&playsinline=1&rel=0&modestbranding=1${v.start ? "&start=" + v.start : ""}`;
    vframe.innerHTML = v.file ? `<video src="${v.file}" poster="${v.poster || ""}" controls autoplay playsinline></video>` : `<iframe src="${src}" title="Video: ${v.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write" allowfullscreen></iframe>`;
    vext.hidden = !v.ig;
    if (v.ig) vext.href = `https://www.instagram.com/reel/${v.ig}/`;
    vmodal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    vmodal.querySelector(".vm-close").focus();
  }
  function closeVideo() {
    if (vmodal.hidden) return;
    vmodal.hidden = true;
    vframe.innerHTML = "";
    document.documentElement.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  vmodal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeVideo));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVideo(); });
  // Instagram's embed reports its real height; size the frame to it so there is no empty space.
  window.addEventListener("message", (e) => {
    if (!/^https:\/\/([a-z0-9-]+\.)*instagram\.com$/.test(e.origin)) return;
    let d = e.data;
    try { if (typeof d === "string") d = JSON.parse(d); } catch (err) { return; }
    const f = vframe.querySelector("iframe");
    if (f && d && d.type === "MEASURE" && d.details && d.details.height > 200) f.style.height = d.details.height + "px";
  });

  // Portfolio: each thumbnail plays its reel.
  document.querySelectorAll(".work-vid").forEach((b) => b.addEventListener("click", () => openVideo({ title: b.dataset.title, ig: b.dataset.ig })));

  // Mobile dock: after the hero button scrolls away, hidden again at the contact form.
  const dock = document.getElementById("dock");
  let heroGone = false, contactIn = false;
  const sync = () => {
    const show = heroGone && !contactIn;
    dock.classList.toggle("show", show);
    dock.setAttribute("aria-hidden", show ? "false" : "true");
    dock.querySelector("a").tabIndex = show ? 0 : -1;
  };
  const heroCta = document.getElementById("hero-cta"), contactSec = document.getElementById("kontakt");
  if (dock && heroCta) new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting && e.boundingClientRect.top < 0; sync(); }).observe(heroCta);
  if (dock && contactSec) new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; sync(); }, { rootMargin: "0px 0px -30% 0px" }).observe(contactSec);
})();
