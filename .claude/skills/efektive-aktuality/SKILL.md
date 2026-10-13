---
name: efektive-aktuality
description: Vyrobí vertikální Reel (1080x1920 MP4) série EFEKTIVE AKTUALITY z textu aktualit od ChatGPT – stálý hook s Apple kalendářem (dnešní datum → odjede zpět na datum novinky), český voiceover přes ElevenLabs s timestampy a motion grafiku synchronizovanou na slova. Použij, když uživatel vloží týdenní aktuality ve formátu „Novinka ze … / Co se změnilo / Pro klienty / Vyzkoušet“ nebo řekne „udělej reel / aktualitu / zapni skill aktuality“.
---

# EFEKTIVE AKTUALITY – automatická výroba Reelsu

Celý projekt je v `news-reel/` (v kořeni repa). Vše se renderuje lokálně: HTML/JS motion grafika → headless Chromium (každý snímek) → ffmpeg → `episodes/<id>/build/reel.mp4`.

```
news-reel/
  config.json            # série: hlas (voiceId!), model, tempo, barvy, hlasitosti
  engine/                # hook.js (kalendář – NEMĚNIT mezi epizodami), scenes.js (knihovna scén), engine.js, style.css
  scripts/tts.mjs        # ElevenLabs /with-timestamps -> build/voice.mp3 + build/words.json
  scripts/render.mjs     # render + mix (voice, riser, ticky, impact, whoosh, volitelně assets/music/bed.mp3)
  scripts/build.mjs      # tts (pokud chybí) + render
  scripts/sfx.mjs        # vygeneruje podpisové SFX série do assets/sfx (jednou)
  episodes/<id>/episode.json
```

## Vstup

Uživatel vloží text z ChatGPT, typicky několik aktualit tohoto tvaru:

```
🎬 1. Instagram Edits nově podporuje carousely
Novinka ze 7. října
Co se změnilo: …
Pro klienty: …
Vyzkoušet: …
```

**Jedna aktualita = jeden Reel.** Když je jich víc, udělej Reel pro každou (nebo pro tu, kterou uživatel vybere). Pořadové číslo epizody (`number`, zobrazí se jako `#N` v hooku) = pořadí aktuality v týdenní sérii (1, 2, 3 …), pokud uživatel neřekne jinak.

## Postup

### 0. Příprava (jen jednou za session)
```bash
cd news-reel && npm install --silent   # playwright (prohlížeč je předinstalovaný)
node scripts/sfx.mjs                   # jen když assets/sfx/*.wav chybí
```
ElevenLabs klíč: env `ELEVENLABS_API_KEY` nebo soubor `news-reel/.env` (`ELEVENLABS_API_KEY=...`, je v .gitignore). Když klíč chybí, NEPOUŽÍVEJ jiný hlas potichu – řekni to uživateli. Pro náhled bez klíče jde `--mock` (tichá stopa s odhadnutým časováním).

### 1. Založ epizodu
`episodes/<YYYY-MM-DD>-<slug>/episode.json` (vzor: `episodes/2026-10-13-instagram-edits/episode.json`):

| pole | význam |
|---|---|
| `today` | dnešní datum `YYYY-MM-DD` (den publikace – na něm začne kalendář, červeně) |
| `newsDate` | datum novinky z „Novinka ze …“ (rok doplň podle `today`; když by vyšel v budoucnu, je to loňský rok) |
| `number` | číslo aktuality v sérii (#1, #2 …) |
| `title`, `source` | nadpis a původní text z ChatGPT (pro dohledání) |
| `script` | text voiceoveru s cue značkami `[[jmeno]]` |
| `scenes` | seznam scén, každá začíná na své `cue` |
| `tempo` | volitelně přepíše `config.voice.tempo` (zrychlení audia, výchozí 1.15) |

### 2. Napiš voiceover (nejdůležitější krok)
Pravidla – hlas je **mladý, rychlý, dynamický, česky, tykání**:
- 45–75 slov → po zrychlení ~18–28 s. Krátké věty. Žádné „Dobrý den“, žádné uvádění data (to dělá hook).
- Struktura: **co je nového** (1 úderná věta s názvem produktu) → **co to umí** (konkrétní výčet) → **dostupnost/omezení** (pokud v textu) → **co z toho mají klienti** → **vyzkoušej** (konkrétní akce, končí výzvou).
- Piš foneticky tak, aby to český hlas přečetl dobře: „Meta“, „Advantage plus“ místo „Advantage+“, „iOS“ → „iPhonu“, čísla slovy když jsou krátká, žádné emoji, zkratky rozepiš (AI → „AI“ je OK, vyslovuje se [ej-aj]).
- Nevymýšlej fakta, která v zadání nejsou. Neříkej „zítra/včera“.
- Před každý úsek, kde se má změnit obraz, dej cue `[[nazev]]` (bez mezery za `]]` nevadí). První cue je na začátku. Typicky 5–7 cue = 5–7 scén, scéna 2.5–5 s.
- Pro `eleven_v3` můžeš střídmě použít audio tagy v hranatých závorkách, např. `[excited]` na začátek – do titulků se nedostanou.

### 3. Vygeneruj voiceover
```bash
node scripts/tts.mjs episodes/<id>
```
Výstup: `build/voice.mp3` (zrychlený o `tempo`, oříznutý začátek) a `build/words.json` (`words[]` s `start/end` v sekundách, `cues{}` časy cue značek). **Přečti si `words.json`** – podle délky slov a mezer ladíš scény. Když je výsledek moc dlouhý (> 30 s), zkrať skript a vygeneruj znovu.

Fallback bez ElevenLabs API: Higgsfield MCP `generate_audio` s `model: "text2speech_v2"`, `variant: "elevenlabs"` (stáhni mp3 do `build/voice_raw.mp3`) → `node scripts/tts.mjs episodes/<id> --from-file episodes/<id>/build/voice_raw.mp3` (časování se odhadne). Před placenou generací se zeptej.

### 4. Navrhni motion grafiku (scény)
Každá scéna: `{ "cue": "<jmeno>", "template": "<sablona>", "props": {…} }`. Scéna trvá od své cue do další. Časování prvků uvnitř scény přes `at`: číslo (sekundy od začátku scény), název cue, nebo **slovo ze skriptu** (první slovo ve scéně, které tím začíná, bez diakritiky/velikosti) – tak se prvky trefují přesně do řeči. `**slovo**` v textech = zvýraznění akcentní červenou.

| šablona | kdy | props |
|---|---|---|
| `app` | představení produktu/appky | `name, glyph, gradient:[c1,c2], tag, caption` |
| `title` | silné tvrzení, kinetická typografie | `kicker, lines:[…], sub, subAt` |
| `phone` | ukázka v aplikaci, carousel, feed | `app, mode:"carousel"\|"editor", title, items:[{label, kind, color, at}]` |
| `transform` | A → B (obrázek → video, brief → reklama) | `from:{label,kind}, to:{label,kind}, toAt, caption` |
| `multiply` | 1 vstup → více variant | `title, source:{label,kind}, variants:[{label, icon, at}], caption` |
| `checklist` | výčet funkcí / dostupnost | `title, items:[{text, icon, state:"yes"\|"soon", at}]` |
| `versus` | srovnání dřív/teď, statická/video | `title, left:{label,icon,value}, right:{label,icon,value,at}, winner` |
| `stat` | velké číslo | `value, from, suffix, label, decimals` |
| `cta` | „Vyzkoušej“ – vždy poslední scéna | `kicker, text, steps:[…], stepsAt:[…], handle` |
| `custom` | cokoliv, co knihovna neumí | `html, css, update` (tělo funkce `(t, dur, el, lib, ctx)`; `lib` má `ease, spring, lerp, prog, clamp, appleEase, icon`) |

Ikony (`kind`/`icon`): `photo video play text sound clock flag hook sparkle check sticker font chart ai apple android`.

Zásady designu: jedna myšlenka na scénu, max ~6 slov velkého textu, vizuál ukazuje to, co hlas právě říká (ne opakuje titulky doslova). Obsah drž v pásmu y 300–1260 px (nahoře je odznak série, dole od 1330 titulky, pod 1500 UI Instagramu). Střídej šablony – dvě stejné za sebou jen když jde o pokračování. Pro nové typy obsahu napiš `custom` scénu; když se osvědčí, přesuň ji jako novou šablonu do `engine/scenes.js`.

**Hook (`engine/hook.js`) a zvukový podpis neměň** – je to poznávací znamení série. Mění se jen data (`today`, `newsDate`) a `number`.

### 5. Kontrola před renderem
```bash
node scripts/render.mjs episodes/<id> --contact      # build/contact.png – snímek každou sekundu
node scripts/render.mjs episodes/<id> --stills 5.2,9.8   # konkrétní časy
```
Prohlédni `contact.png` (Read). Hledej: přetékající/oříznutý text, překryv s titulky, prázdné scény, prvky, co se objeví až po odeznění slova. Oprav `episode.json` a zopakuj.

### 6. Finální render
```bash
node scripts/render.mjs episodes/<id>                # ~1 min na 25 s videa
node scripts/render.mjs episodes/<id> --mux-only     # jen přemíchat zvuk (nový voiceover se stejnou délkou / jiné hlasitosti)
```
Výstup `episodes/<id>/build/reel.mp4` (H.264, AAC, 30 fps). Pošli ho uživateli přes `SendUserFile` a připiš: text voiceoveru, délku, seznam scén. `build/` se necommituje; commitni `episode.json` (+ případné nové šablony).

## Jednorázové nastavení série (dělá se s uživatelem)
- **Hlas:** `node scripts/tts.mjs --voices` vypíše hlasy z účtu. Uživatel vybere JEDEN hlas → zapiš `voiceId` + `voiceName` do `config.json`. Pak se už nemění.
- **Hookový slogan:** `node scripts/tts.mjs --hook` vygeneruje `assets/voice/hook.mp3` („Efektive aktuality!“, text v `config.voice.hookLine`) – přimíchá se do každého intra. Commitni ho.
- **Hudba:** vlastní podkres jako `assets/music/bed.mp3` (automaticky se ztlumí pod hlasem).
- **Rychlost:** `config.voice.tempo` (1.15 = +15 %).
- **Vlastní SFX:** nahraď `assets/sfx/{riser,tick,impact,whoosh}.wav`.
