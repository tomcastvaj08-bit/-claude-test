# Hlas série: Efík (ElevenLabs, navržený hlas)

- voice_id: `81wovuU8h1mgIHLBNeBy` (knihovna ElevenLabs: „Efík – Aktuality maskot“), model `eleven_v4`
- Postava: kreslený kluk z hooku (velké hranaté brýle, rozcuchané zrzavo-hnědé vlasy, zelená kostkovaná košile)
- Vzor: maskot Alzy (Alzák): pištivý, s přízvukem, trochu otravný, ale zůstane v hlavě

Specifikace (zadání pro voice design, eleven_ttv_v3, guidance 8):
> Young Czech male cartoon mascot voice, early twenties, nerdy and cheeky. High-pitched, slightly squeaky and nasal, bright buzzy timbre, a bit cartoonish like an animated brand mascot, with a playful quirky accent and sing-song upward inflections at the ends of phrases. Fast, punchy, hyper-energetic delivery with a grin, crisp clear diction. Slightly annoying in a lovable way, instantly recognizable and catchy. Professional studio recording, close mic, clean, dry, broadcast quality.

Ze tří návrhů vybrán nejvyšší a nejvíc „zpívající“ (medián F0 ≈ 290 Hz, rozsah 195–370 Hz). Ukázka: `efik_ukazka.mp3`.
Stejným hlasem mluví vypravěč i postavička v hooku.

## Vypravěč od 20. 10. večer: Aura (Efík zůstává hlasem postavičky)

Uživatel: Efík byl na vypravěče moc provokativní. Chce hluboký, zastřený, sebevědomý hlas („gigachad, aura týpek“), klidnější a vysvětlující, ale s energií.

- voice_id: `pq4dsKDG1xJYWPJUNn8d` (knihovna ElevenLabs: „Aura – Aktuality vypravěč“), model `eleven_v4`, prompt začíná `[confident, relaxed, brisk pace]`
- Zadání (eleven_ttv_v3, guidance 8):
> Deep husky Czech male voice, around thirty, very low pitch with strong chest resonance, slightly raspy gravelly texture, a little breathy. Calm, confident, charismatic alpha energy, relaxed but engaging, explains things clearly like a cool mentor, never shouting. Professional close-mic studio recording, clean, warm, broadcast quality.
- Ze tří návrhů (`gigachad/`, všechny F0 ≈ 80 Hz) vybrán g1: nejchraplavější (nejnižší harmonicita) a s největším rozsahem intonace.
- Výslovnost: v promptu foneticky „karusel/karusely“, „apek“ (místo carousel/appek).
