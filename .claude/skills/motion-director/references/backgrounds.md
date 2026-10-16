# Worlds, backgrounds & palettes

Hex values sampled from the reference frames. Every world has: base, accent(s), text
colour, texture, light. Use the world as a whole — don't mix parts of two worlds.

## Palettes

| Palette | Colours | Used in |
|---|---|---|
| **Ember** | bg centre `#D24F0D` → edge `#6B1E04` (radial), text white / cream `#FDF1D9`, accent pink-red `#E8466E` | hook stacks, particle character |
| **Blood** | bg `#94161A` → `#3A0608` vignette, text cream `#FDF1D9`, accent red `#FC453C` | "WRONG QUESTION." statements |
| **Night Room** | near-black `#0B0606`, warm wood `#8A4A22`, lamp `#FFB347`, accent red `#E0242A`, cyan `#6AE5CE` stripes | home 3D room |
| **Void Grid** | `#020001` black, grid cyan `#2FA8A0` @25 %, digits orange `#F26A15`, hero red `#FC453C`, white | data / numbers |
| **Poster Black** | `#09060C`, cream type `#F5E2C9`, rule/accents orange `#F53107` | editorial posters |
| **Poster Orange** | `#F53107` bg, black type `#09060C` | editorial posters |
| **Poster Cream** | `#F5E2C9` bg (paper texture), black type | editorial posters |
| **Poster Blue** | `#081DF5` bg, cream/white type, red dots `#F53107` | f(t) / tech poster |
| **Studio Green** | wall `#202B20`, floor `#1D281A`, desk wood `#9A5A2E`, text white + peach serif `#E38B69` | documentary 3D studio (closing act) |
| **Ember Spot** | radial spotlight `#A8300C` centre → `#140302` edges, text grey `#B8AFA8` | arched words |
| **Dusk Cosmos** | deep navy `#0A1022`, nebula blue/white, small white text | "but first" interludes |
| **Soft Meadow** | painterly anime landscape (sky, river, flowers), white serif/sans text with shadow | friendly tutorial chapter |
| **Board** | olive cork `#4E5A2E`, wood frame `#6E4022`, window-blind shadow stripes | polaroid boards |

## World recipes (how to build without 3D software)

### Ember / Blood flat (hook statements)
- Radial gradient (centre at 45 % x, 45 % y; radius 0.8 W), plus vignette (corners −60 %),
  plus film grain (monochrome noise σ 6/255, re-seeded each frame), plus 4–8 floating
  ember particles (2–3 px, warm, drifting up 0.5–1 px/f, twinkle).

### Night Room (home base)
- Plate: dark room, warm practical light from a lamp (additive radial glow `#FFB347`,
  40 % opacity, radius 0.35 W), one emissive monitor (screen content mapped in), shelf
  with emissive dots, wall LED stripes (red/cyan horizontal bars, 6 px, 50 %).
- Depth of field: background layers blurred 4–8 px; foreground desk sharp.

### Void Grid
- Black; perspective grid floor (vanishing point centre, horizon 62 %); faint radial
  cyan glow at the horizon; floating dotted arcs (pixel dots, 4 px, cyan/green).

### Editorial posters (2:52–3:06 sequence — the "motion poster" chapter)
- Strict layout grid: margin 5 % sides, headline baseline at 55–62 % height, 2 px rule
  under headline across the full content width, mono label row 2 % under the rule
  (left: spec text; right: `02 / 04` page counter), thin progress line at very
  bottom (2 px, 40 % opacity, fills over the poster's duration).
- Backgrounds cycle black → cream → black → orange → blue → black. Each poster is on
  screen 0.6–1.2 s. Change = T3 glitch slice or T13 black breath.
- Paper/cream posters get subtle paper grain + slight vignette; black posters get a
  faint dot/halftone circle (20 % opacity) behind the headline.
- Variants: op-art concentric rings (orange/black/cream) with serif italic overlaid;
  topographic contour lines (thin cream/orange lines on black, one filled orange
  region, small crosshair marker with coordinates in mono); blue tech poster with a
  dotted wire sphere morphing (dots ~2 px, red highlights).

### Studio Green (closing act)
- Dark green studio box (walls + floor same hue), long wooden desk, monitor, characters
  small in frame (wide shots), very soft top light, strong vignette. Captions are C6
  bottom-centre documentary style. Calm pace: one beat per 2–3 s.

### Soft Meadow (tutorial interlude)
- Painterly landscape plate; UI windows/browser frames float on it with rounded corners
  (radius 18 px @1080), 1 px light border, soft shadow (blur 40, 35 %). Caption text white
  with soft shadow, top-centre, small kicker in tracked caps above ("HOW DO YOU MAKE").

## Texture & finish (apply to every frame of every world)
1. Film grain: σ 4–7/255, monochrome, new seed per frame.
2. Vignette: −35 % to −60 % at corners (radial, power 2).
3. Slight chromatic aberration on high-energy frames only (transitions, slams): 2–6 px.
4. Never pure flat RGB on large areas except posters (and posters still get grain).
5. Glow on emissive things (screens, lamp, pixel digits): blurred copy, screen blend, 30 %.
