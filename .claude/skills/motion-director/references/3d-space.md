# Text and objects in 3D space

The single biggest difference between the references and "AI slop": **text and UI live in
the scene**. Use at least one of these per 3 beats.

## D1 Arched text behind the subject (film 5:41–5:52)
- Word laid on a circular arc above the subject's head. Arc centre below the word at
  distance R = 1.2 × word width; bend 25–35°; letters rotated to the tangent.
- Fill: warm grey-white `#B8AFA8` → slightly darker toward the ends (sides recede):
  multiply letter brightness by `0.75 + 0.25·cos(angle)`. Letters at the ends also
  scale 0.92 (perspective). Soft shadow none — it's lit by the spotlight.
- Draw order: background → arched word → **subject (masked)** → small secondary word.
  The subject covers 1–3 middle letters. If the subject has no mask, fake it: put the
  arch higher so the head overlaps only the lower half of 1–2 letters.
- Secondary word: Poppins Medium, 45 % size, light grey, on a *downward* arc or a tilt of
  +6–10°, to the right of the subject at waist height.
- Implementation: `mdlib.arc_text(...)` renders each glyph separately and places it.

## D2 Perspective / skewed text plane (film 0:03 "asking the SAME", 0:14 "SLOP.", 1:06 "kilobytes")
- Text rendered flat then warped with a homography: vanishing to the right/up, 10–25°
  of yaw. Typical corners (normalised): TL (0,0.06) TR (1,0) BR (1,0.94) BL (0,1).
- Combine with skew-slide entrance. "SLOP." variant: letters alternate solid red and
  outlined/ghost (every 2nd letter 30 % opacity with a hairline) → "unfinished" look.

## D3 Text on a wall / object surface (reel 08, 17; film whiteboard/board scenes)
- Place text as a texture on a plane that exists in the scene (wall, board, screen,
  floor). Match the plane's perspective (4 corners), multiply it by the scene lighting
  (sample a blurred luminance of the wall: `text * (0.6 + 0.4·L)`), add 1–2 px blur.
- Glass variant (reel 17 "DESIGN"): extruded letters, refraction = background displaced
  by the letter normal map 8–12 px, white rim highlight top-left, 35 % opacity body.

## D4 Occlusion with a masked subject (reel orbit, couch wall, cover story)
- Get subject mask (MediaPipe selfie-multiclass, see Masks). Composite
  `bg → text → subject`. Feather mask 1.5 px; temporally smooth masks (EMA 0.5).
- For orbiting thumbnails (reel 01): items on an ellipse around the subject; the back
  half of the path is drawn before the subject, the front half after.

## D5 Voxel / pixel 3D rooms (film's home world)
- The reference uses pre-rendered voxel rooms (Blender-like): wooden desk, CRT/monitor
  with live UI on its screen, lamp with warm cone light, bookshelf with emissive book
  spines, a red round rug, plants, striped red/cyan light panels on the wall.
- Characters: a pixel-art detective (trench coat, deerstalker) and a cube robot (orange
  `#F26A15` body, black hat, dot eyes). They are 2D sprites billboarded in the 3D room,
  with a contact shadow ellipse (black 40 %, blur 12).
- If you can't render 3D: build 2.5D — background plate image + parallax layers
  (foreground plant/desk edge moves 1.6× faster than background in camera moves) +
  screen content mapped by homography + light glow (additive radial gradients).

## D6 Cards and screens floating in space (film 0:14 slop strip, 1:29 cards, 4:24 polaroids)
- Card strip: 5–8 thumbnails as a ribbon, bent in perspective (yaw 35°, roll −15°),
  sliding diagonally across frame at constant speed, motion-blurred at the leading edge.
- Polaroids: white frame (8 % padding, 22 % bottom), tilt ±2–5°, drop shadow 12 px, a
  small red pin top-centre, pinned on an olive board `#4E5A2E` with a wooden frame and
  hard diagonal window-blind shadows (alternating 0/45 % dark stripes at −35°).
- Each card arrives with A13 card fly-in, 4–8 f apart.

## D7 Camera moves (3D or 2.5D)
- Push-in to screen (T5), slow dolly (E6 drift), orbit 10–15° around the desk over 2–3 s
  (ease_in_out), crane-up reveal to a crowd (film 5:27: low angle → high wide shot of
  500 characters in rows).
- Rule: one camera move per shot, never combine pan + zoom + rotate.

## D8 Grid floor world (film 1:04–1:09)
- Pure black background, floor = cyan `#2FA8A0` perspective grid at 25 % opacity, lines
  fade with distance, horizon at 62 % height. Characters stand on it with contact
  shadow. Pixel digits and hero words float in the black above.

## Masks
```python
# pip install mediapipe ; model: selfie_multiclass_256x256.tflite
# https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
# person = 1 - confidence_masks[0]  (class 0 = background); needs libegl1 + libgles2 on Linux
```
Smooth over time (EMA 0.5), sharpen edge `clip((m-0.5)*6+0.5)`, feather 1.5 px. Keep the
largest connected component to drop false positives.
