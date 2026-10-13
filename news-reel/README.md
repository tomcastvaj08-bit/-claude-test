# EFEKTIVE AKTUALITY – generátor Reelsů

Text aktuality (z ChatGPT) → český voiceover (ElevenLabs eleven_v4, hlas Karel) → motion grafika v brandu EFEKTIVE synchronizovaná na slova → vrstvené SFX z ElevenLabs → MP4 1080×1920 s motion blurem.

Každý Reel začíná stejným hookem: Apple kalendář (tmavý), pomalý push-in na dnešní datum v červeném kolečku, odjezd kamery, kolečko „odjede v čase“ zpět na datum novinky (ticky + riser), dopad, ponoření do data → clona do světlé grafiky ve stylu značky. Značka EFEKTIVE je jen v outru.

Návod pro Clauda: [`.claude/skills/efektive-aktuality/SKILL.md`](../.claude/skills/efektive-aktuality/SKILL.md).

```bash
npm install
node scripts/build.mjs episodes/2026-10-13-instagram-edits          # tts + render
node scripts/build.mjs episodes/2026-10-13-instagram-edits --mock   # bez ElevenLabs (tichý náhled)
```

Klíč: `ELEVENLABS_API_KEY` v env nebo v `news-reel/.env`.
