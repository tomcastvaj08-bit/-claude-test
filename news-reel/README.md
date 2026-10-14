# EFEKTIVE AKTUALITY – generátor Reelsů

Text aktuality (z ChatGPT) → český voiceover (ElevenLabs eleven_v4, hlas Karel) → motion grafika v brandu EFEKTIVE synchronizovaná na slova → vrstvené SFX z ElevenLabs → MP4 1920×1080 (24 fps) s motion blurem.

Každé video začíná stejným hookem „tabule“: fotografický záběr (cihly, školní tabule, slunce přes žaluzie, haze), plynulý pojezd kamery na tabuli, kde visí tištěný kalendář měsíce novinky a papíry na magnetech, které čeří vítr; rozostřené listí v popředí; den novinky se zakroužkuje fixou, kamera přejede na prázdný papír, kde se napíše „novinka ze X“, a ponoří se do něj → čistá grafika ve stylu značky. 16:9, 24 fps, filmová závěrka, zrno. Značka EFEKTIVE je jen v outru.

Návod pro Clauda: [`.claude/skills/efektive-aktuality/SKILL.md`](../.claude/skills/efektive-aktuality/SKILL.md).

```bash
npm install
node scripts/build.mjs episodes/2026-10-13-instagram-edits          # tts + render
node scripts/build.mjs episodes/2026-10-13-instagram-edits --mock   # bez ElevenLabs (tichý náhled)
```

Klíč: `ELEVENLABS_API_KEY` v env nebo v `news-reel/.env`.
