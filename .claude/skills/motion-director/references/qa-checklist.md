# QA checklist — run on every render before delivering

Make strips: `scripts/contact_sheet.sh out.mp4 <start_s> <dur_s>` for every transition
and the first 1 s. Look at them. Then tick:

**Type**
- [ ] No default/system fonts. Only the stack in typography.md.
- [ ] Hero word visibly different (font + size + colour) from base words.
- [ ] Hero ≥ 3× base size; base ≤ 58 px (9:16) / 48 px (16:9).
- [ ] No caption over a face; margins ≥ 6 %.
- [ ] ≤ 7 words on screen; ≤ 3 fonts in frame.

**Motion**
- [ ] Every entrance 2–5 f (except counters/cards/typewriter as specified).
- [ ] No linear easing on entrances/exits.
- [ ] No element sits perfectly static > 3 s without drift/idle (E6/E7/E8).
- [ ] Words land on voice onsets (±1 f).

**Transitions**
- [ ] Inside world: hard cut/scale pop. Between worlds: catalogue transition.
- [ ] No crossfade > 4 f, no soft wipes.
- [ ] Transition frame counts match the spec table (check strip).

**Depth & look**
- [ ] ≥ 1 depth trick per 3 beats (D1–D8).
- [ ] Grain + vignette on every frame.
- [ ] Palette per scene from backgrounds.md; ≤ 3 colours + neutrals.
- [ ] Emissive elements glow.

**Delivery**
- [ ] 30 fps, correct resolution, yuv420p, faststart, AAC 48 kHz if audio.
- [ ] Contact sheet of the final shown to the user alongside the video.
