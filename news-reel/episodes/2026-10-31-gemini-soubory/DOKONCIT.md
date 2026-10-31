# Aktualita #3: co chybí a jak dokončit

**Stav 31. 10. 2026:**
- Hotové: hook (žvýkačka na 29.), Efíkova replika, 4 nové grafiky (logo, chatfiles, docedit, timer), cover (Canva), popisek a brief na Drivu.
- Chybí: **voiceover Aura.** ElevenLabs workspace 4d079bb3 má 23 kreditů, voiceover potřebuje 609 (2 verze ~1 220).

**Po dobití ElevenLabs:**
1. `creative_generate_speech`:
   - model `eleven_v4`;
   - voice `pq4dsKDG1xJYWPJUNn8d` (Aura);
   - flow `ppQESZTD9CtIRlpfzsY2`;
   - prompt = `script` z `episode.json` bez `[[cue]]` značek.
2. Vyber kratší verzi bez přeřeknutí, ulož ji jako `voice/take_a.mp3` a přepiš ji přes Scribe do `voice/take_a.words.json`.
3. `node scripts/ingest-voice.mjs episodes/2026-10-31-gemini-soubory episodes/2026-10-31-gemini-soubory/voice/take_a.mp3 episodes/2026-10-31-gemini-soubory/voice/take_a.words.json`
4. Zkontroluj `--stills` scén a doladit `at` u SFX.
5. `setsid nohup node scripts/render.mjs episodes/2026-10-31-gemini-soubory &` (~40 min).
6. Pošli `reel_web.mp4` + `thumbnail/thumbnail_9x16.png`. Drive složka: „Aktualita #3 – Gemini dělá soubory (31. 10. 2026)“.
