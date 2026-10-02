# 01 — „ChatGPT přemýšlí“ animace (prompt pro Claude Design)

Zkopíruj celý blok níže do Claude Designu. Je to základní komponenta, na kterou
pak navážou všechny další karty (zprávy od ChatGPT a zprávy od nás).

---

```
Create a single, reusable motion-graphics overlay for a YouTube vlog (16:9, 1920×1080 canvas).
It must look like premium Apple keynote UI — calm, precise, expensive. No gimmicks.

CONCEPT
A floating chat card appears over live footage, on the RIGHT half of the frame.
In this first piece the card only shows the "AI is thinking" state (three dots).
Later we'll reuse the same card for typed messages, so build it as a component.

CANVAS & BACKGROUND
- Canvas 1920×1080, background FULLY TRANSPARENT (no color, no checkerboard baked in).
- Also provide a toggle for a pure chroma-green background (#00FF00) as a fallback,
  but transparent is the default.

CARD
- Aspect ratio 3:4, size 600×800 px, positioned in the right half:
  right edge 120 px from frame edge, vertically centered.
- Surface: frosted glass — white at 82% opacity, backdrop blur look,
  1 px inner border rgba(255,255,255,0.6), corner radius 36 px,
  soft layered shadow (0 30px 80px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.12)).
- Header row (top, 28 px padding): small round AI avatar (neutral black circle with a
  simple white abstract mark — NOT the OpenAI logo), label "ChatGPT" in SF Pro Display
  Semibold 22 px, #1D1D1F, and a muted status "přemýšlí…" in #86868B, 18 px.
- Body: empty, the three dots sit inside an assistant bubble at the top-left of the body.

THINKING DOTS
- Three dots, 14 px diameter, 10 px gap, color #1D1D1F, inside a pill bubble
  (background #F2F2F7, radius 24 px, padding 18×22 px).
- Loop: each dot scales 0.6 → 1.0 → 0.6 and opacity 0.35 → 1 → 0.35,
  1.2 s cycle, stagger 0.15 s between dots, ease-in-out (cubic-bezier(.45,0,.55,1)).
- Very subtle shimmer on the status text "přemýšlí…" (gradient sweep, 2 s loop).

TIMELINE (total 6 s, then loopable middle)
0.00–0.55 s  Card enters: scale 0.92 → 1.0, translateY 40 px → 0, opacity 0 → 1,
             blur 12 px → 0. Spring feel (stiffness ~180, damping ~22), no bounce overshoot >2%.
0.35–0.70 s  Header fades/slides in (8 px up).
0.60–0.90 s  Dots bubble pops in (scale 0.8 → 1).
0.90–5.00 s  Dots loop (this section must be seamlessly loopable so I can stretch it in edit).
5.00–5.40 s  Dots bubble collapses (scale → 0.85, opacity → 0) — this is the hand-off
             point where the typed message will appear in the next component.
5.40–6.00 s  Card stays (no exit) — exit animation is a separate 0.4 s clip:
             scale 1 → 0.96, opacity 1 → 0, translateY 0 → 20 px.

DELIVERABLES
- Exposed controls: play/pause, scrub timeline, toggle transparent / green background,
  toggle light / dark card theme (dark = #1C1C1E at 80%, text #F5F5F7).
- Keep all timings in one config object at the top of the code so they're easy to tweak.
- Render at 60 fps, crisp at 4K (use vector shapes, no raster).

STYLE RULES
- Typography: SF Pro Display / -apple-system, fallback Inter.
- Only neutral colors + one accent (#0A84FF) reserved for later highlights.
- Motion: smooth, physical, short. Nothing flashy, no glow, no neon, no emojis.
```

---

## Proč průhledné pozadí a ne green screen

Karta má měkký stín a rozmazání — na zeleném pozadí se to při keyingu rozpadne
(zelené okraje, stín zmizí). Průhledné video (ProRes 4444 s alfou nebo WebM VP9
s alfou) vložíš do střihu přímo jako vrstvu. Green screen nech jen jako záložní.

Claude Design vyexportuje HTML animaci. Pokud z ní nepůjde vytáhnout video s alfou,
pošli mi exportované HTML a vyrenderuju ho tady (Chromium + ffmpeg) do
`.mov` ProRes 4444 s alfa kanálem v 60 fps.
