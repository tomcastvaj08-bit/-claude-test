---
name: podcast-caption-reel
description: Recreate the premium "podcast talking-head with kinetic captions" reel (9:16, 19.1 s, 30 fps, 574 frames). A man speaks at a microphone. Elegant serif and script captions are synced to his words, some sitting behind his head (IF you ARE, DREAM DREAM DREAM, FROM THE VISION) and some on his chest. Stylised backgrounds include warm orange bleachers, a dark studio with a white grid, grey bleachers, and a concrete wall with a pinned poster, torn colour strips and lip stickers. The reel also has an abstract "THEY'RE DISTRACTIONS" interlude with font cycling, glitch, flare and whip transitions, and ends on a brand card. The person and the original audio come from the source. Captions, backgrounds, graphics and the watermark are rebuilt in code. Use it when the user wants this reel remade, wants the same caption style on another podcast clip, or says "podcast titulky", "Jebrix styl" or "napodob toto" with a talking-head video like this.
---

# Podcast caption reel

The output is 1080×1920, 30 fps, 574 frames. **The person cutout and the original audio track come from the source.** Everything else is generated: backgrounds, every caption, the frame lines and grid, the poster scene, the b-roll interlude, the transitions, and the brand watermark and end card. The default brand is `EFEKTIVE` with the script word `present`.

## Pipeline

```
source.mp4 ─► full/fNNN.png (368×656 native)
           ─► mattes: scripts/fastseg.py (u2net_human_seg + guided filter, ~1 s/frame)
                      or spotlight-kinetic-reel/scripts/segment_character.py (BiRefNet, ~25 s/frame, cleaner)
           ─► scripts/clean_plates.py: erase baked-in captions/watermark on the body (top-hat mask + Telea),
              upscale to 1080×1920 RGBA cutouts  (work/cut/cNNN.png)
template/composition.html  (canvas engine; fonts in assets/fonts) ─► scripts/render_frames.mjs
ffmpeg: frames + ORIGINAL audio (-map 1:a) ─► mp4
```

Run it:
```bash
SK=.claude/skills/podcast-caption-reel; W=/path/work
ffmpeg -i SRC.mp4 $W/full/f%03d.png
python3 -I $SK/scripts/fastseg.py $W/full $W/matte 1-86 125-271 318-538
python3 -I $SK/scripts/clean_plates.py $W/full $W/matte $W/work/cut
mkdir -p $W/work/fonts && cp $SK/assets/fonts/* $W/work/fonts/ && cp $SK/template/composition.html $W/work/
node $SK/scripts/render_frames.mjs $W/work $W/render 262 262 1 && cp $W/render/r262.png $W/work/poster.png   # poster for shot S5
node $SK/scripts/render_frames.mjs $W/work $W/render 1 574 1          # about 4–5 min at 4 motion-blur samples
ffmpeg -framerate 30 -i $W/render/r%03d.png -i SRC.mp4 -map 0:v -map 1:a -vf "noise=alls=2:allf=t,format=yuv420p" \
  -c:v libx264 -crf 21 -c:a aac -shortest OUT.mp4
```

The brand can be swapped with `window.CFG = { brand: 'NAME', brandSub: 'present' }`.

## Shots (source frame F, F1 = 0.00 s)

| shot | F | background | person | captions / graphics |
|---|---|---|---|---|
| S1 | 1–61 | warm orange bleachers, desk | yes; punch-in zoom 3×→1 over F1–9 | "IF" (thin neon peach serif) + "you" (script) + "ARE" (orange) behind the head, top-left. "NOT / where / YOU" on the right. "WANT / that" label (orange over black, dashed border) over the eyes F45–61. Glitch out F58–61 |
| S2 | 62–86 | warm, close-up blur | close-up face, right | "CUT" (white neon outline) "THE" "WOMAN" on the left. Thin orange frame lines (y 308, x 170) |
| S3 | 87–124 | abstract monochrome water and spray streaks (no third-party footage) | none | "THEY'RE" (orange, small) + "DISTRACTIONS". The font cycles every 2 frames (Bebas, Montserrat Alt, Great Vibes, Anton, Special Elite, Rock Salt, Playfair italic) with an RGB split. Peach flash into S4 (F122–127) |
| S4 | 125–271 | warm bleachers | yes; zoom 1.15→1 | Chest "IF YOU / REALY figured out" (embossed serif + orange script), glitch out at F206. "DREAM ×3" gold wall behind the head (F163–220). "NOT THE / Dream that YOU WOULD / SITTLE FOR" plus an orange hand-drawn loop. "like a DREAM girl" behind the head (F244+). Blur out F268–272 |
| S5 | 272–317 | grey concrete wall | no; a poster of the S4 frame (r262) | Pinned poster with tape and curled corner, orange and blue torn strips, yellow and blue lip stickers. "you PROBRBLY CANT her" (3D extruded serif + orange script, tilted), "RIGHT / NOW". White flash + flare into S6 |
| S6 | 318–439 | dark warm studio | yes, right side | Thin white grid (x 38/146/262, y 150/236) drawing in. Left column: "so whats the point IN" → "GOING OUT THERE on dates" → "on tinder" → "getting drunk" (+ orange sun behind the head) → "ALL OF THIS" → "BULL SHET" |
| S7 | 440–511 | grey (desaturated) bleachers, desk | yes | "TO SITTLE FOR / FOR A woman" (gold neon script), glitch out. "THAT IS / subpar". "FROM THE / VISION" (white neon + gold) behind the head F494+. White flash + flare F506–514 |
| S8 | 512–538 | grey blur, close-up | face left half | "WHO YOU / WANA / BE" (big gold). Peach glow-out F534–538 |
| S9 | 539–574 | white → grey → black | none | Brand end card: serif brand + orange script + a thin line |

A live mini-subtitle in small caps runs on the shirt (y 333) throughout the person shots, following the spoken word groups (`MINI` table).

## Style tokens

- **Serif:** Cinzel 400/700 (all caps). The source uses a narrower Didone, so Cinzel sizes are about 5% smaller.
- **Body serif:** Cormorant Garamond 700.
- **Scripts:** Great Vibes (white/orange), Yellowtail ("woman", "subpar" as gold neon outline).
- **Colours:** orange `#f07a2c`; gold gradient `#ffe08a → #f2a51a` with a glow `rgba(255,170,30)`; neon peach outline `#ffe3d6` with glow `#ff9e7a`; cream white `#fbf7f0` with a soft drop shadow and bottom bevel.
- **Caption animators** (`cap()`): `fade` (blur + scale 1.08→1), `pop` (scale 1.45→1, back-ease), `drop`, `rise`, `slideL`, `write` (left→right clip reveal), `flicker` (neon flicker-in). Outs are `fade`, `glitch` (random drop-out + jitter), `rise` and `cut`. Text is rendered once into high-res sprites (no pixel-snap shimmer), and each frame averages 4 motion-blur samples.

## Gotchas

- Captions burned into the source sit **on the body**, so they end up in the cutout. `clean_plates.py` erases them inside per-shot boxes (white/black top-hat + orange saturation → Telea inpaint, then a soft blend). The new captions are placed at the **same position and size** so they cover the healed area. Check them with zoomed crops against the source (`NOT THE…` x≈62–280, `TO SITTLE FOR` x≈20–260, `woman` x≈108–277).
- A stronger or wider inpaint mask (normalised convolution, big dilation) leaves grey blobs. Keep the mask tight.
- BiRefNet is cleaner but takes about 3 hours for 454 frames on 4 CPUs. `fastseg.py` takes about 8 minutes and is good enough on these warm backgrounds.
- The S5 poster texture is a frame of our own render (r262). Render it before the full pass.
- The b-roll interlude (S3) in the source is third-party footage of a woman running through water. It is replaced by an abstract procedural streak scene.
