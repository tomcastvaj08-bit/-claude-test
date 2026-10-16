# Typography — fonts, hierarchy, caption patterns

All values measured from the references. Sizes given for **16:9 1920×1080** (source film
was 1080×608 — multiply by 1.78) and **9:16 1080×1920** (reel). "f" = frame @30 fps.

## 1. Font stack (files in `assets/fonts/`)

| Role | Reference look | Use this font | Weight / setting | Case |
|---|---|---|---|---|
| **Base caption** (setup words) | geometric sans, round "a", wide | **Poppins** | SemiBold 600 (Medium for 2nd line) | lowercase / sentence |
| **Hero round** ("asking", "skill,", "kilobytes", "same") | chunky geometric, tight | **Poppins ExtraBold** | 800, tracking −2 % | lowercase |
| **Hero condensed** ("WRONG", "SLOP.", "MOTION", "MIFTAHUL", "IS") | condensed grotesk caps, sometimes rough | **Anton** (or Bebas Neue for thinner) | Regular | UPPERCASE |
| **Hero expanded** (posters: "CAMERA.", "NO", "KEYFRAMES.", "ONE PROMPT.", "100%") | ultra-wide black grotesk | **Archivo** variable | wght 900, wdth 125 | UPPERCASE + full stop |
| **Hero serif italic** ("skill.", "visual?", "price.", "nothing here was filmed.", "every pixel is a function of time.") | high-contrast italic serif | **Instrument Serif Italic** | Regular | lowercase |
| **Pixel / data** ("50", "0110", "101", "00111", level bars) | bitmap/LCD digits | **Silkscreen** (Bold) or **VT323** | — | digits, binary |
| **Mono labels** ("0 CAMERAS / 0 LIGHTS / 0 CREW", "02 / 04", "SHOT NO: 097436") | small mono, tracked | **JetBrains Mono** | wght 500, tracking +12 % | UPPERCASE |
| **UI** (chat UIs, buttons) | Inter / system | **Inter** | 400–600 | sentence |

| **Editorial sans** (Mode Q: spread words, giant words, label boxes) | Helvetica Neue / Neue Haas Regular, very tight | **Inter Display** | Regular (Medium for giant words), tracking −2 % small / −5 % giant | lowercase |

Never mix more than **3** of these in one frame (base + one hero + optional mono label).
Mode Q uses **only** Inter Display (+ Instrument Serif Italic in the hook) — see
`editorial-quote-edit.md`.

## 2. Sizes & hierarchy

| Element | 16:9 (px @1920) | 9:16 (px @1080 wide) | Notes |
|---|---|---|---|
| Base caption | 40–48 | 50–58 | white `#FFFFFF` 100 %, soft shadow (blur 10, 55 % black, y+4) |
| Small lead word ("the", "to", "a", "this") | 30–36 | 38–44 | sits tucked into hero's top-left, overlapping its cap height by ~15 % |
| Hero word | 120–190 | 140–220 | 3–4.5× base size. Always the brightest/most saturated thing on screen |
| Poster headline (expanded) | 230–330 | 200–260 | fills 80–92 % of frame width, left aligned at 6 % margin |
| Serif italic sub-line | 60–80 | 70–90 | under poster headline or as caption hero |
| Mono label | 16–20 | 20–24 | 40–60 % opacity white (on dark) / 70 % black (on cream) |
| Pixel digits | 110–160 | 140–200 | orange `#F26A15` or cyan `#6AE5CE`, with 1-px darker drop "LCD ghost" optional |

**Stack layout** (most used): 2–4 lines, *left-aligned ragged*, each line a different size:
```
  everyone's          ← base, 34 px
  asking              ← hero round, 64 px (white)
  the                 ← base small, 30 px, indented under "asking"
  SAME                ← hero condensed, 120 px, colour (cream/red)
  thing               ← serif italic or base, 40 px, peach/red
```
Lines overlap vertically by 10–20 % of the smaller line's height — tight, never
double-spaced. The stack is placed in empty space next to the subject (rule of thirds),
never over a face, and may be **rotated −4° to −8°** (Kinetic stack C1).

## 3. Colour of words

- Base words: white. On cream posters: near-black `#09060C`.
- Hero words: one of red `#FC453C`, orange `#F26A15`, peach `#E38B69`, cyan `#6AE5CE`,
  cream `#FDF1D9`, yellow `#F3EC78`. Pick the accent of the current world's palette.
- Two-tone hero: first letters white, last letters/second word in accent ("**Because**
  ~~Cl~~**aude**" red highlight block behind letters; "Every **animation.**" peach).
- Highlight block: solid red `#E0242A` rectangle behind 1 word, reveals left→right with
  the letters (pattern C5).

## 4. Caption patterns (the system — rotate them)

Timing notation: f0 = word's voice onset.

### C1 — Kinetic stack with skew-slide (orange world, "everyone's asking the SAME thing")
- Words appear one by one into a left-aligned stack, whole stack rotated −6°.
- Small words: **pop** (A1): opacity 0→1 in 1 f, scale 1.15→1.0 in 2 f.
- Hero words: **skew-slide** (A4): enters from +120 px right, skewX −20°→0°, with
  a 3-copy motion trail (opacity 0.5/0.25/0.1, 18 px apart) and colour shift: letters
  are first tinted multi-colour (pink/blue/yellow at 60 %) then settle to white/cream in
  **5 f**. Letters stagger 1 f each.
- While the stack builds, the character next to it can disintegrate into particles and
  reassemble (T7) on the hero word.

### C2 — Hero condensed slam ("WRONG / QUESTION.", "MOTION", "IS")
- Base line already on screen. Hero word: scale 1.6→0.96→1.0 (f0, f1, f3), opacity 0→1
  in 1 f, 8 px motion blur on f0, slight rotation −3°→0.
- Optional grunge texture (noise mask 15 %) on the letters.
- Second hero ("QUESTION.") half size under it, lands 4 f later.

### C3 — Letter cascade, rainbow settle ("the prompt")
- Each letter falls from −80 px above with 1-f stagger, overshoot (ease_out_back),
  and starts **multi-coloured** (random from cyan/pink/yellow/green pastel) then
  settles to white over 6 f. Duration of whole word ≈ 10 f.
- Ghost copies of the letters (20 % opacity) trail above for 3 f.

### C4 — Binary decode ("0101" → "MOTION", "11/00" → "IS")
- f0: pixel-font binary string (Silkscreen, cyan `#6AE5CE`) same width as target word.
- f1–f3: glitch: random 4–12 px horizontal slice offsets, characters swap randomly
  between binary/target, RGB split 4 px.
- f4: target word solid (Anton red `#FC453C` or white), with 3–5 cyan pixel squares
  scattering away from it for 6 f (particle sparks, size 4–8 px, fade).

### C5 — Typewriter with block cursor ("Because Claude didn't make th")
- Characters appear 1 per 1–2 f. A solid block cursor (red `#E0242A`, height = cap
  height, width = 0.6 em) sits after the last char and **pixel-flickers**: 2–3 small
  squares break off above it each frame.
- The newest 2 characters are blurred (6 px) and red; they sharpen and turn white 2 f later.
- Accent word ("Claude") gets the red highlight block that grows with the letters.
- Variant (posters): mono underscore cursor `_` after "ONE P", 1 char / 2 f, expanded
  font, last char rendered mid-scale (0.6→1 over 2 f).

### C6 — Serif italic accent ("Made with this *skill.*", "Need a custom *visual?*")
- Line in Poppins SemiBold white + last word Instrument Serif Italic in peach
  `#E38B69`/`#D18A6B`, ~1.15× size of the sans.
- Entrance: whole line **blur-in-place** (A2): blur 12→0 px, opacity 0→1, 4 f; the
  serif word lags 3 f behind and enters with letter-spacing +15 %→0.
- Placed bottom-centre at 88 % height (16:9), the calm "documentary" caption. Use for
  quiet/emotional beats.

### C7 — Arched word behind subject ("miftahul's", "cheapest", "won't stay", "the price")
- Big Poppins ExtraBold lowercase, 55–65 % grey-white (`#B8AFA8`, reads as lit by
  scene), **set on an arc** centred above the subject's head (arc radius ≈ 1.2× word
  width, 25–35° total bend), each letter rotated tangent to the arc.
- Subject **occludes** the middle letters (text is behind the character).
- Under it, a small Poppins Medium word in light grey to the right on a gentle tilt
  ("price?", "it will be.", "goes up", "soon.") — can be on a *downward* arc.
- Entrance: letters blur-in left→right with 1 f stagger (6 f total), slight rise 20 px.
- Exit: whole arc blurs 0→16 px and fades in 3 f; next arc word enters 2 f later at a
  different tilt (alternate ±8°).
- Background: radial red-orange spotlight (`backgrounds.md` → *Ember Spot*).

### C8 — Counter / data ("40 → 50 kilobytes", "38% → 75%", "500+")
- Pixel digits count up with ease-out over 10–14 f (values per frame: 15, 22, 28, 33, 37,
  40, 43, 45, 47, 48, 49, 49, 50, 50 for 0→50).
- Unit word ("kilobytes") arrives with **3D swing** (A7): starts rotated 70° on Y,
  huge (2×) and RGB-split, swings to 0° in 5 f.
- Dotted arc trail (cyan/green pixels) draws behind the number.

### C9 — Poster headline (editorial scenes)
- Headline: Archivo 900/125 caps with full stop. Enters by **glitch slice** (T3) or
  **letter build** ("CAMER" → "CAMERA." 1 letter / 1 f with 2-f slice offset).
- Thin rule (2 px) under the headline, full width minus margins.
- Mono label row under the rule: left "0 CAMERAS / 0 LIGHTS / 0 CREW", right "02 / 04".
- Serif italic sub-line where needed ("rendered, not filmed.", "every pixel is a
  function of time.").

### C10 — Word-by-word lower third (tutorial / UI sections)
- Poppins SemiBold 40 px white with the key word in Instrument Serif Italic peach or
  red Poppins: "**Paste** it in.", "**Pick** a voice.", "**Download** the file.",
  "Back to **Claude**." Centred, 92 % height. Blur-in 3 f. Changes on every voice phrase.

## 5. Rules of thumb

- Hero word ≤ 12 characters. If longer, split.
- Max 7 words on screen at once (excluding mono labels).
- Line breaks follow speech, not width.
- Punctuation is part of the design: "SLOP.", "CAMERA.", "price?" — keep the full stop
  on hero words; it signals finality.
- Captions never touch the frame edge: min margin 6 % (16:9) / 7 % (9:16).
- Keep the IG handle / watermark area (top-right ~12 % × 15 %) free if the user posts there.
