# Animation library — frame-exact (30 fps)

Each entry: ID, what it is, frame table, ease, where used in the references. All
implemented in `scripts/mdlib.py` (function name in brackets).

## Entrances

| ID | Name | Frames | Spec |
|---|---|---|---|
| A1 | **Pop** [`anim_pop`] | 2 | f0: opacity 1, scale 1.15; f1: 1.04; f2: 1.0. For small/base words. |
| A2 | **Blur-in** [`anim_blur_in`] | 3 (reel) / 4 (film) | blur 14→0 px, opacity 0.15→1, scale 1.12→1.0, ease-out cubic. Default for hero words in the reel and calm captions. |
| A3 | **Slam** [`anim_slam`] | 3 | scale 1.6 → 0.96 → 1.0; opacity 0→1 on f0; motion blur 8 px on f0; rotation −3°→0. |
| A4 | **Skew-slide with trail** [`anim_skew_slide`] | 5 | x +120 px → 0, skewX −20° → 0, ease-out expo; 3 trailing copies (50/25/10 % opacity, 18 px apart); tint multicolour→final over 5 f; per-letter stagger 1 f. |
| A5 | **Letter drop** [`anim_letter_drop`] | 1 f stagger + 6 | each letter y −80 → 0, ease_out_back (s=2.2); starts pastel colour, settles to white by f6. |
| A6 | **Typewriter** [`anim_typewriter`] | 1–2 f / char | newest 2 chars: blur 6 px + accent colour, settle 2 f later. Block or underscore cursor. |
| A7 | **3D swing** [`anim_swing3d`] | 5 | rotateY 70° → 0 (perspective d = 3× text width), scale 2.0 → 1.0, RGB split 10 → 0 px, ease-out cubic. |
| A8 | **Binary decode** [`anim_binary_decode`] | 4 | see typography C4. |
| A9 | **Glitch build** [`anim_glitch_build`] | 1 f / letter + 2 | letters appear with horizontal slice offsets ±(8–30) px decaying over 2 f; full stop last. |
| A10 | **Stamp** [`anim_stamp`] | 3 | 1.35×/−12° + big shadow → 1.08×/−3° → 1.0. (reel paper-cut). |
| A11 | **Draw-on stroke** [`anim_draw_on`] | 2–3 | polyline revealed by arc-length; used for doodles, ellipses, rules under headlines (rule draws L→R in 6 f). |
| A12 | **Rise-blur** [`anim_rise_blur`] | 4 | y +24 → 0, blur 10 → 0, opacity 0 → 1. Lower thirds, UI cards. |
| A13 | **Card fly-in** [`anim_card_fly`] | 8–10 | card/polaroid enters from off-screen along an arc, rotation ±12° → own tilt (±3°), scale 0.85 → 1, slight bounce at end (ease_out_back s=1.3), soft shadow grows. |
| A14 | **Pin drop** | 6 | polaroid on board: scale 1.08 → 1.0, shadow offset 16 → 6 px, red pin appears f4. |
| A15 | **Counter** [`anim_counter`] | 10–14 | ease-out values (see C8); digit glyph swaps on every frame. |

## Exits

| ID | Name | Frames | Spec |
|---|---|---|---|
| X1 | **Blur-out** [`anim_blur_out`] | 2 | blur 0 → 14, opacity 1 → 0. Default exit. |
| X2 | **Arc blur-dissolve** | 3 | blur 0 → 16, opacity → 0, scale 1 → 1.04. Arched words. |
| X3 | **Disintegrate** [`fx_disintegrate`] | 6 | element breaks into 3–6 px particles that drift +x/−y with noise and fade. |
| X4 | **Slice out** | 2 | 5–8 horizontal slices shoot sideways ±60 px, opacity → 0. |
| X5 | **Hard off** | 0 | just cut. Used on beat with a new hero word landing same frame. |

## Emphasis / idle

| ID | Name | Spec |
|---|---|---|
| E1 | **Scale pop** | 1.04 → 1.02 → 1.0 on the frame a new item appears (reel item switches). |
| E2 | **Shake** | 3 f, ±6 px x, ±3 px y, decaying. On "WRONG", hits. |
| E3 | **Spark ticks** | 3 short yellow strokes radiating from a word/element corner, boil on 3s. |
| E4 | **Pixel spark scatter** | 3–8 cyan squares fly out of a word for 6 f. |
| E5 | **Boil** | redraw hand-drawn outlines with new jitter every 3 f. |
| E6 | **Drift** | slow camera push 1.00 → 1.04 over the whole shot (≥2 s), linear. Only on still 3D rooms/posters to keep them alive. |
| E7 | **Character bob** | pixel character idle: 2-frame bob up/down 4 px every 8 f. |
| E8 | **LCD flicker** | pixel digits: random 1-f dropout of 1 segment every ~20 f. |

## Easing set (only these)

- `ease_out_cubic` — default entrance.
- `ease_out_expo` — skew-slide, whip settle.
- `ease_out_back(s)` — drops, card landings (s 1.3–2.2).
- `ease_in_cubic` — exits, zoom-into-cut.
- `ease_in_out_cubic` — scale-into-window (frame break), camera moves between positions.
- `linear` — typewriter, counters (stepped), drift.

## Stagger rules

- Letters: 1 f. Words in a line: on the voice (not fixed); if no audio, 4–6 f per word.
- Cards/icons in a row: 3 f apart (reel UI icons; "Claude Code / Codex / Cursor" grid
  tiles pop 6–8 f apart).
- Never stagger more than 6 elements; group the rest.
