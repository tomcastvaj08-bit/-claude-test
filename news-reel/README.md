# EFEKTIVE AKTUALITY – generátor Reelsů

Text aktuality (z ChatGPT) → český voiceover (ElevenLabs, s timestampy) → motion grafika v HTML synchronizovaná na slova → MP4 1080×1920.

Každý Reel začíná stejným hookem: Apple kalendář (tmavý), pomalý push-in na dnešní datum v červeném kolečku, odjezd kamery, kolečko „odjede v čase“ zpět na datum novinky (ticky + riser), dopad, ponoření do data → červený přechod do vysvětlující grafiky.

Návod pro Clauda: [`.claude/skills/efektive-aktuality/SKILL.md`](../.claude/skills/efektive-aktuality/SKILL.md).

```bash
npm install
node scripts/build.mjs episodes/2026-10-13-instagram-edits          # tts + render
node scripts/build.mjs episodes/2026-10-13-instagram-edits --mock   # bez ElevenLabs (tichý náhled)
```

Klíč: `ELEVENLABS_API_KEY` v env nebo v `news-reel/.env`.
