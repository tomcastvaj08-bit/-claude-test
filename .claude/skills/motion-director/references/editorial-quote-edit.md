# Mode Q — Editorial quote edit ("Lumitris" reference)

Source: IG reel by **Lumitris** (DeUmXBotjIH), 1728×720 (2.4:1 scope inside a 9:16
post), 30 fps, 35 s. A Steve Jobs voice quote ("Everything around you that you call life
was made up by people that were no smarter than you…") cut over archival and film
footage. Frame-measured. Use this mode for **voiceover quotes, manifestos, founder/brand
stories, motivational edits, documentary teasers** — anything driven by one spoken text.

The look: *Swiss/editorial minimalism over fast archival montage.* One typeface, white,
regular weight, spread across the frame like a layout, giant single words that the
footage and people live inside, white label boxes, video mosaics. No colour accents
except one red label and 2-frame RGB glitch blocks.

---

## Q1 Format & frame
- Canvas **1728×720** (2.4:1). For 9:16 delivery, keep the 2.4:1 film band centred
  and fill above/below with black — or render 1080×1920 directly using the same rules
  on a 1080-wide grid (sizes ×0.625).
- Watermark/brand: small logo + "PRODUCED BY / LUMITRIS" two-line caps (Inter Display
  Bold, 11 px / 15 px) top-right at 4 % margin, 100 % white, on every frame.
- Ending: 2.5 s black end card, logo centred, same lock-up ×2.

## Q2 Typography (one family only)
| Role | Font | Size @720 h | Tracking | Colour |
|---|---|---|---|---|
| Spread words (default caption) | **Inter Display Regular** (Helvetica Neue look) | 26–30 px | −2 % | white, soft shadow 35 % |
| Giant word | **Inter Display Regular/Medium** | cap height 55–80 % of frame (the "life" glyphs span y 80→649 of 720; "understand" 1440 px wide ≈ 83 % W) | **−5 %** (letters almost touch) | white `#FFFFFF`, or grey `#858286` on black |
| Label box text | Inter Display Regular | 30–36 px | −4 % | black `#09060C` on white box `#FAF7FB` |
| Red label | Inter Display Regular | 22–26 px | −3 % | white on red `#FD0002` |
| Serif accent (intro only) | **Instrument Serif Italic** | 34–40 px | 0 | white 90 % |

Never bold, never caps (except brand lock-up), never coloured text. Lowercase as spoken.

## Q3 Caption layouts (rotate; each shot uses exactly one)

**L1 Spread row** — the signature. Words of one phrase sit on a single horizontal
baseline but are **distributed across the full width** with big irregular gaps
("push    in    and  something   will   pop"). Baseline at 47–50 % height (centre) or
10 % from top (upper row). Words appear one at a time on the voice onset, no motion
(hard on); within a word the letters may type on 1 per frame ("ca" → "cal" → "call").
Phrase stays until the cut. Gap pattern: x positions roughly at 6, 18, 27, 37, 49,
57, 72 % of width — uneven on purpose. Next phrase on the next shot.

**L2 Flanking pair** — one word left and one word right of a centred subject/object
("one simple ⟷ fact", "much ⟷ broader"), both on the same baseline at the subject's
mid-height, ~15 % in from the subject's edges. Serif italic in the intro; sans later
("you ⟷ call" top-left / bottom-right diagonal variant around a giant word).

**L3 Giant word** — one key word of the sentence is set huge and fills the frame
(cap height ≥ 55 % H). Variants (all measured):
- *Letter build* ("life", "smarter"): letters appear one at a time every **4–6 f**;
  each new letter enters at 1.15× scale with 40 % opacity/blur 4 px and settles in 2 f.
  A soft grey gradient bar (the "cursor", 0.5 em wide, cap-height tall, 60 % → 0 %
  opacity vertical gradient) sits where the next letter will appear.
- *Hard slam* ("out", "and"): word appears complete in 1 f, holds 6–10 f, hard cut.
- *Fade-up across a cut* ("understand"): first 2 f split by solid red `#FF2020` / cyan
  `#20E0E0` rectangles over half the word (RGB block glitch), then grey 50 % → white
  100 % over 6 f. The word **persists over the next cut** while footage changes
  underneath; small spread words (L1) gather above its left half on the same frame.
- *Word window* ("people"): the footage is cropped to the word's bounding box (black
  outside), the word sits on top; box then dissolves to black over 4 f and the word
  gains a soft white glow (blur 18 px, 40 %). Ends with a 2-f RGB block glitch on the
  last letters before the cut.
- *Zoom-shrink* ("important"): giant word for 2 f, then on the cut it becomes small
  (L1 size) centred on the next shot's subject — scale 1 → 0.2 in **one** frame.
- *Occlusion*: the subject stands **in front of** one letter (tiny figure between
  "i" and "f" of "life"). Use a person mask (3d-space.md §Masks).

**L4 Label box** — white rectangle hugging the text (padding 0.22 em x, 0.08 em y, no
radius), text black. Typing: 1 char/f; the 2 chars ahead of the cursor are already
drawn in 35 % grey (ghost) and the box grows with them. Placed off-centre on top of
a collage or mosaic, never on a face. Red variant for 1–2 words ("you", "the other")
sits on the speaker's body.

**L5 Tiny caption on contact** — on fast close shots, a single small word
(L1 size) lands on the action point (hands on keyboard, a pointing finger).

## Q4 Footage compositions
**F1 Collage of tilted cards** (4.7–6.0 s): 4–6 B/W or desaturated stills, each a
rectangle rotated ±2–8°, overlapping, covering the whole frame, drop shadow 20 px 35 %.
Intro: on the first 3 f solid geometric blocks (cyan `#18C8C8` rectangle 40 % W, red
`#E01818` sliver at an angle) cover parts of the frame, then the cards slam in
(each 1–2 f apart, scale 1.06 → 1.0). A L4 label box types over it. Cards drift
slowly (1–2 px/f) in different directions.

**F2 Mosaic grid** (17.6–19.3 s): grey background `#6C686C`; a grid of video tiles
(tile ≈ 15 % W × 16:9, 1–2 px gutters, columns not aligned row-to-row — offset each row
by ¼–½ tile). Tiles **pop in one per frame** at random positions (hard on), starting
sparse (6 tiles) and filling to 100 % over ~1.2 s. Tiles are moving clips, not stills.
A L4 label box sits centred and types the line. Exit: 3 tiles flash red/cyan duotone
for 2 f → cut.

**F3 Picture-in-picture over black** ("smarter", "Change"): black background, giant
grey `#858286` word, and small video boxes (8–20 % W, 16:9, no border) pop in one at a
time every **3–4 f** at scattered positions, some overlapping the letters, some on top
of each other. Last box grows to full-frame → it becomes the next shot (scale 0.3 → 1
in 2 f).

**F4 Window-into-shot**: the next shot first appears inside a rectangle the size of a
word/label (or a white box that slides in), then the rectangle expands to full frame
in 2–3 f (seen at 9.5 s and 30.43 s).

**F5 Intro plate** (0–4.7 s, the only long shot): a centred object (old Mac on a
desk) in a painted meadow, out-of-focus tree in the foreground on one side, falling
leaves (6–10 dark-green leaf sprites, blurred, drifting down-right, rotating), slow
push-in (1.00 → 1.06 over the shot). L2 serif words flank the object.

## Q5 Pace (the reason it feels good)
- Shot lengths (s): 4.67, 0.93, 0.40, 1.07, 0.70, 0.77, 0.57, 0.40, 0.53, 0.67, 2.07,
  0.97, 1.23, 0.53, 0.47, 0.57, 1.10, 1.67, 0.80, 1.07, 0.53, 1.20, 0.77, 0.50, 0.57,
  1.00, 0.83, 0.67, 1.00, 1.17, 1.00, 0.63, 0.40, 0.43, 0.80.
- → **One long calm hook shot (4–5 s), then median 0.77 s per shot**, 2/3 of shots
  under 1 s, never longer than ~2 s after the hook. Shortest 0.40 s (12 f).
- **Cut on the word**: every cut lands on a word onset. A shot usually carries 1–4
  words. Giant-word shots are the shortest (0.4–0.6 s), spread-row shots the longest
  (1–1.7 s, they need reading time).
- Speech rate ≈ 2.5–3 words/s; text never runs ahead of the voice.
- Rhythm pattern that repeats: *spread row (1 s) → giant word (0.5 s) → montage
  composition (1–1.5 s) → spread row …* The big compositions (collage, mosaic, PiP)
  appear every 5–7 s.
- Final word ("think.") gets two shots with the same tiny word in the same position
  (0.4 s + 0.8 s), then black end card.

## Q6 Transitions in this mode
- 85 % hard cuts on the word.
- **RGB block glitch** (2 f): half-screen solid red and cyan rectangles (hard edges,
  axis-aligned) over the outgoing frame, sometimes with the image showing through as
  a duotone (red = luminance × red). Used ~4× in 35 s.
- Giant word persists across a cut (Q3 fade-up variant).
- Window expand (F4), PiP grow (F3).
- Never: whips, zooms, flashes to white, dissolves.

## Q7 Grade & finish
- Footage left mostly natural (archival is soft — fine). Unify with: slight contrast
  +5 %, saturation −10 %, black lift to 3 %. No film grain, no vignette in this mode
  (overrides backgrounds.md §Texture). Text has only a faint shadow.

## Q8 Checklist for this mode
- [ ] Only Inter Display (+ Instrument Serif Italic in the hook).
- [ ] Hook shot 3–5 s, then median shot ≈ 0.8 s, all cuts on word onsets.
- [ ] ≥ 3 giant-word moments, ≥ 1 collage, ≥ 1 mosaic, ≥ 1 PiP-over-black per 30 s.
- [ ] Spread rows use uneven gaps across the full width, one baseline.
- [ ] Label boxes type with ghost chars; red label used ≤ 2 times.
- [ ] Brand lock-up top-right every frame; black end card.
