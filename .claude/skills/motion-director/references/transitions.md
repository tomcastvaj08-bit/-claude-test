# Transitions — measured catalogue (30 fps)

Frame 0 = last clean frame of outgoing shot A unless stated. B = incoming shot.
Implemented in `scripts/mdlib.py` (function in brackets).

**Usage hierarchy**
- Inside a world (same background): **T10 hard cut + scale pop** or no cut at all
  (just new caption).
- Between worlds within a section: T2, T5, T6, T9, T13.
- Section change / big statement: T1, T3, T4, T7.
- Never: crossfade/dissolve longer than 4 f, wipes with soft edges, star/heart wipes,
  page curls, spinning cubes, "zoom out + fade".

---

## T1 Whip-flash smear [`tr_whip_flash`] — 9 f (film 0:07.83)
| f | Frame content |
|---|---|
| 0–3 | A holds (hero text on screen). |
| 4 | A with horizontal motion blur 40 px + scale 1.04, slight darken. |
| 5 | **Colour-flash**: A smeared 200 px horizontally, tinted cyan `#6AE5CE`/white, lifted to 80 % brightness. |
| 6 | A smeared, tinted red `#E0242A`, letterboxed (bars top/bottom 15 %). |
| 7 | White frame with a horizontal cyan band (smear of A) across middle third. |
| 8 | Black frame with **vertical** red streak band (B pre-smear, rotated 90°) in centre 40 %. |
| 9 | White frame with vertical cyan streak band. |
| 10–11 | Pure black. |
| 12+ | B starts from black (B's first element animates in — usually C5 typewriter). |
Sound: whoosh on f4, impact/click on f10.

## T2 Pixel-block storm [`tr_pixel_blocks`] — 7 f (film 0:28.7, 0:52, 1:10, 1:20)
- Grid of square blocks, size = frame width / 18 (60 px @1080w, 107 px @1920w).
- Colours: weighted random from {accent red `#E0242A` 40 %, dark red `#7A0E12` 20 %,
  white `#F2F2F2` 20 %, black 10 %, peach/skin of B 10 %}.
- f0: A, plus the A scene's light source flares white (monitor/lamp to white) — 1 f.
- f1: 15 % of cells filled (clustered near edges and the flare).
- f2: 45 %; B is already underneath (cells not filled show **B**, not A).
- f3: 60 % — peak; some cells are double-size (2×2) for variety.
- f4: 35 %; f5: 15 %; f6: 5 % scattered on outer edge; f7: clean B.
- Variant **Red curtain** (film 1:05.9): blocks only red/dark red, reach 100 % at f5,
  hold full red 4 f (f5–f8), then clear with a ragged vertical edge moving left→right
  over 6 f, small squares (¼ cell) trailing at the edge. Total 15 f. Use when B is a
  new "chapter" (count-up, data).

## T3 Glitch slice cut [`tr_glitch_slice`] — 3–4 f (film posters 2:52–3:06)
- f0: A with 6–10 horizontal slices (heights random 2–12 % H) displaced ±(20–120) px,
  RGB split 6 px, 30 % of slices already show B.
- f1: mostly B, slices displaced ±(10–60) px, a ghost of A's headline (30 % opacity)
  offset 40 px.
- f2: B, 2–3 slices still displaced ±10 px.
- f3: clean B. B's headline then continues its own entrance (A9 glitch build).
- Background colour flip between posters (black ↔ orange ↔ cream ↔ blue) happens on f1.

## T4 Chromatic grade flicker (hook opener) [`tr_grade_flicker`] — 12–18 f (film 0:00)
- The same shot is shown under rapidly switching colour treatments, **2–3 f each**:
  normal → duotone red/purple (hue rotate + saturate) → black & white high-contrast
  (crushed blacks) → overexposed white (screen blend) → flat solid red with the main
  object as white silhouette → flat cyan with object as black silhouette → normal.
- The hook words build on top unaffected (white Poppins ExtraBold + accent word in
  hot pink `#E8466E`/red), each new word on a grade switch.
- Use ONLY as the first 0.5–1 s of a video.

## T5 Push-through screen [`tr_screen_push`] — 8–10 f
- Camera dolly into a screen/monitor/card in the scene (scale about the screen centre
  1.0 → screen-fills-frame, ease_in_cubic, zoom blur growing), then hard switch to the
  screen's content full-frame on f(n−2), which settles with 1.04 → 1.0.
- Reverse (pull-back reveal, reel 11 & film 1:22): B starts as full-frame UI, scales
  down into a monitor in a 3D room over 10–12 f (ease_in_out), room is blurred 12 px
  until the last 4 f.

## T6 Particle disintegrate [`fx_disintegrate`] — 6 f out + 4 f in (film 0:03.7–0:04.6)
- The character/object (masked) dissolves into 3–6 px particles (sample its own
  pixels), particles drift outward with noise (max 60 px) and some fall; 6 f.
- Reassembly: inverse, particles converge into a *new pose* in 4 f. Use on a hero word.

## T7 Plane swap / screen-as-card [`tr_plane_swap`] — 10–14 f (film 4:23.4–4:24.6)
- A becomes a card: shrinks to 0.92 with rounded corners + drop shadow (3 f), rotates
  around Y by 15–25° in perspective and slides out to the left (6–8 f, ease_in_cubic),
  revealing B (already playing) behind it, B lit with hard window-shadow stripes.
- The caption of B blur-ins (A2) on the last 3 f.

## T8 Blur melt [`tr_blur_melt`] — 4–6 f (film 5:25.8)
- Cross-dissolve with both shots blurred 0 → 18 → 0 px and B scaled 1.08 → 1.0; peak
  frame looks like a smeared double exposure. Only between two 3D rooms with similar
  palette.

## T9 Zoom-through cut [`tr_zoom_through`] — 13 f (reel effect 09)
- A: 7 f accelerating zoom into the subject's chest (scale 1.05, 1.15, 1.35, 1.70,
  2.30, 3.20, 4.50) with radial blur ∝ per-frame scale change ×0.9. Cut.
- B: 6 f decelerating (3.00, 2.00, 1.45, 1.18, 1.06, 1.00) with radial blur.
- Captions baked into A zoom with it; B's caption appears after settle (2-f fade).

## T10 Hard cut + scale pop — 2 f
- B's f0 at 1.04, f1 1.02, f2 1.0. The default.

## T11 Frame break into window (reel 04) — 14 f
- f0–3 full-frame; f4–13 scale 1 → 0.667 (0.97, 0.95, 0.92, 0.88, 0.78, 0.72, 0.69,
  0.675, 0.668, 0.667) into a rounded window; outside = same footage blurred 36 px,
  darkened to 28 %; subject's head/hands break out over the window edge (mask on top);
  UI fades in staggered 1 f from f12.

## T12 Glass exit (reel end of list) — 6 f
- Card/element: gaussian blur 0 → 20, opacity → 0, scale 1 → 1.06, with a frosted
  look (blur the background through it); simultaneously the next caption blur-ins.

## T13 Black breath — 4–6 f
- A cuts to black with vignette for 2–3 f, B's first element animates in from black
  (A2/A9). Used between posters in the editorial section ("NO" → "CAMERA.").

## T14 Ring/tunnel reveal (film 2:57) — 4 f
- B is a concentric-ring (op-art) poster: enters with T3 glitch slices, then rings
  scale outward continuously (1.0 → 1.08 / s, rings spawn in centre) — endless tunnel.

## T15 Logo outro (film 6:14) — CapCut-like
- Black. Logo + handle (Poppins Bold caps tracked, 26 px) scale 0.9 → 1.0 with blur-in
  6 f, gradient (pink→purple) brand icon. Hold 2 s. Not required.
