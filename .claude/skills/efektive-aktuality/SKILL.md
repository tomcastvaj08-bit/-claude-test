---
name: efektive-aktuality
description: Vyrobí vertikální Reel (1080x1920 MP4) série AKTUALITY ze vstupu od ChatGPT – stálý hook „tabule“ (švih kamery na školní tabuli ve slunci, odtrhávací kalendář, přeškrtnutí dnešního data fixou, vítr přetočí listy na datum novinky; alternativně iOS kalendář), český voiceover přes ElevenLabs eleven_v4 (hlas Karel), motion grafika v brandu EFEKTIVE podle firemní prezentace (Inter, chladně bílá, grafit, modrá + listová zelená, lesklé koule) synchronizovaná na slova, vrstvené zvukové efekty z ElevenLabs a motion blur. Použij, když uživatel vloží týdenní aktuality ve formátu „Novinka ze … / Co se změnilo / Pro klienty / Vyzkoušet“ nebo řekne „udělej reel / aktualitu / zapni skill aktuality“.
---

# AKTUALITY – automatická výroba Reelsu

Projekt: `news-reel/`. Render je lokální: HTML/JS animace → headless Chromium (každý sub-snímek) → ffmpeg (motion blur + mix) → `episodes/<id>/build/reel.mp4`.

```
news-reel/
  config.json              hlas, tempo, fps, motionBlur, hlasitosti
  engine/hook.js           kalendářový hook – NEMĚNIT (poznávací znamení série)
  engine/scenes.js         knihovna scén + typografie (letters/revealLetters) + outro
  engine/engine.js         časová osa, kamera, HUD, titulky, SFX události
  engine/style.css         brand tokeny a vzhled
  assets/sfx/el/*.mp3      zvuková knihovna z ElevenLabs (library.json = prompty)
  assets/sfx/*.wav         syntetické vrstvy (riser, tick) – scripts/sfx.mjs
  scripts/ingest-voice.mjs voiceover z ElevenLabs konektoru -> build/voice.mp3 + words.json
  scripts/render.mjs       render (--contact, --stills, --mb, --mux-only)
  episodes/<id>/episode.json
```

## Vstup
Text od ChatGPT, obvykle několik aktualit (`🎬 1. Titulek / Novinka ze 7. října / Co se změnilo / Pro klienty / Vyzkoušet`). **Jedna aktualita = jeden Reel.** `number` = pořadí aktuality v týdnu (zobrazí se jako „Aktualita 01“).

## Postup

### 0. Jednou za session
```bash
cd news-reel && npm install --silent && node scripts/sfx.mjs
```

### 1. Epizoda – `episodes/<YYYY-MM-DD>-<slug>/episode.json`
Vzor: `episodes/2026-10-13-instagram-edits/episode.json`. Pole: `today` (den publikace, YYYY-MM-DD), `newsDate` (z „Novinka ze …“), `number`, `title`, `source` (původní text), `script`, `scenes`, `voice` (id generace pro dohledání).

### 2. Voiceover text
- Česky, tykání, rychle a úderně, 45–70 slov (≈ 18–24 s). Žádné pozdravy, žádné datum (to je v hooku), **nezmiňuj značku EFEKTIVE** – ta je jen v outru.
- Struktura: co je nového (1 věta s názvem produktu) → co to umí → dostupnost → co z toho mají klienti → „Tak to zkus: …“ (konkrétní akce).
- Před každý úsek se změnou obrazu dej cue `[[nazev]]`. 5–7 cue = 5–7 scén po 2,5–4,5 s.
- eleven_v4 bere audio tagy: `[excited]` na začátek, `…` pro pauzu, — pro krátký beat, VERZÁLKY pro důraz (střídmě). Čísla piš normálně („3×“, „20 %“).

### 3. Voiceover přes ElevenLabs konektor (MCP)
1. `creative_create_flow` (název „Aktuality #N – téma“).
2. `creative_generate_speech`: `model_id: "eleven_v4"`, `voice_id: "wNYzYiprejHCPi4voSeA"` (**Karel – Czech Broadcast Reporter, stálý hlas série**), `prompt` = skript BEZ `[[cue]]` značek, `flow_id`. Poll `creative_get_flow_run_status`.
3. Vyber take (první, pokud uživatel neřekne jinak), stáhni `content_url` (curl) do `build/takes/takeN.mp3`.
4. `creative_add_flow_asset_node` (generation_id vybraného take) → `creative_transcribe_audio` (`eleven_scribe_v1`, `connect_from` = ten node) → stáhni `words_download_url` do `build/takes/takeN.words.json`.
5. `node scripts/ingest-voice.mjs episodes/<id> build/takes/takeN.mp3 build/takes/takeN.words.json` → zrychlí (config `tempo` 1.1), spočítá časy cue a slov.
(Alternativa s API klíčem: `node scripts/tts.mjs episodes/<id>`.)

### 4. Scény (motion design)
Scéna: `{ "cue", "template", "props" }`, trvá do další cue. Časování prvků přes `at` = číslo (s od začátku scény) | název cue | **slovo ze skriptu** (první slovo ve scéně, které tak začíná). V textech: `**slovo**` = modrá, `__slovo__` = zelená, `~~slovo~~` = obrysové písmo.

**Nejdřív si přečti `news-reel/docs/motion-reference.md`** – rozbor referenčních reelů (křivky, rytmus, techniky). Na to navazuje tato knihovna:

| šablona | kdy (reference) | props |
|---|---|---|
| `words` | hlavní nosič sdělení – kinetická věta, slova dopadají na hlas (v1/v2) | `text, size:"md"\|"lg"\|"xl", kicker, sub` |
| `prompt` | „napíšeš X a …“ – věta s inline polem, které se samo píše (v1) | `before, typed, after, typeAt, typeSpeed` |
| `stack` | seznam úkolů / funkcí jako pastelové karty, co vjíždějí zleva (v3) | `title, items:[{title, sub, icon, tone:"blue"\|"green"\|"red"\|"neutral", at}]` |
| `connect` | propojení / workflow / integrace – ikony spojené kreslenou modrou linkou, kamera jede za ní (v3) | `items:[{icon, label, tone, at}]` (2–4) |
| `fan` | varianty / verze / formáty – rychlé problikání a pak vějíř (v1) | `title, items:[{title, value, tone}]` (3–5) |
| `orbit` | „všechno kolem X“ – koláž ikon kolem textu v 3D kruhu (v2) | `text, items:[{icon, label, tone}], radius` |
| `bigtype` | úder: jedno obří slovo přes celou plochu (modrá/limetková/grafit), obrysová tapeta, mikro popisky (v4) – ideálně na klíčové slovo, krátce (0,8–1,5 s) | `word, bg:"blue"\|"lime"\|"ink"\|"paper", meta:["…","…"], sub` |
| `metric` | skutečné číslo/statistika: tachometrové číslice + graf + kroužek (v4) – **nikdy nevymýšlej čísla** | `value, prefix, suffix, label, bars:[…], donut:0–1, donutLabel` |
| `particles` | energie / zrychlení: částice se slijí do prstence a vybuchnou, uprostřed text (v4) | `text, count` |
| `app` | představení produktu (3D dlaždice) | `name, glyph, gradient:[c1,c2], tag, caption` |
| `phone` | ukázka v aplikaci / karusel | `app, title, items:[{label, kind, color, at}]` |
| `transform` | A → B | `from:{label,kind}, to:{label,kind}, toAt, caption` |
| `multiply` | 1 vstup → varianty (strom) | `title, source:{label,kind}, variants:[{label, icon, at}], caption` |
| `checklist` | funkce / dostupnost | `title, items:[{text, icon, state:"yes"\|"soon", at}]` |
| `versus` | dřív vs. teď | `title, left:{label,icon,value,amount}, right:{…, at}, winner` |
| `stat` | velké číslo | `value, from, suffix, label, decimals` |
| `title` | editoriální nadpis po písmenech | `kicker, lines:[…], sub, subAt` |
| `cta` | „Vyzkoušej“ – vždy poslední | `kicker, text, steps:[…], stepsAt:[…]` |
| `custom` | cokoliv dalšího | `html, css, update` – tělo funkce `(t, dur, el, lib, ctx)`; `lib` má `snapOut, brandOut, brandInOut, prog, lerp, clamp, kineticWords, animateWords, letters, revealLetters, icon`; zvuk `ctx.sfx(name, t, gainDb)` |

**Přechody** (`"transition"` na scéně = jak scéna přijde; předchozí podle toho odejde): `push` (výchozí – zvednutí + rozmazání), `whip` (prudký horizontální odjezd s rozmazáním – změna tématu), `zoom` (průlet dovnitř – max 1× za video), `blur` (měkké prolnutí), `strobe` (3 jednosnímkové barevné záblesky + tvrdý střih – typicky před `bigtype`), `streak` (světelná linka přes střed se rozevře do modré plochy, ta odjede nahoru).
**Body střihu navíc:** cue `[[jmeno]]` můžeš vložit i doprostřed věty (např. `umí nově [[boom]]carousely!`) – po změně cue stačí znovu `ingest-voice.mjs`, nový voiceover není potřeba.
**Kamera a prostředí (automaticky, ale můžeš řídit):**
- Pozadí je 3D svět: perspektivní podlaha s rastrem (pořád se pohybuje), lesklé koule a skleněné panely v různé hloubce s hloubkovou neostrostí. Při každém střihu kamera přeletí na jiné místo světa (rychlý nástup, dlouhý dojezd), celou dobu pomalu najíždí. Objekty, které se dostanou za text, samy zprůhlední.
- Každá scéna má vlastní pohyb kamery – `"camera": "orbitL" | "orbitR" | "push" | "pull" | "crane" | "tilt"` (bez zadání se střídají v tomto pořadí). Sousední scény nikdy stejný pohyb.
- Při přechodech je jemný barevný lom (chromatická aberace) + motion blur; přes vše jde animované filmové zrno a viněta.
- Hook trvá ~2,4 s: rychlý nájezd na dnešek → 3D náklon měsíce → kolečko vystřelí na datum novinky → dopad → clona. Hlas začíná hned po něm.
- Méně textu na snímek: ideálně 1–4 slova velkým písmem, zbytek nese hlas a titulky.
**Skladba:** střídej text (`words`) a vizuál, scéna 2–4 s, ke každému prvku slovo v řeči (`at`), 1–2× `whip`, 1× `zoom`.

Ikony: `photo video play text sound clock sparkle check sticker font chart ai apple android layers arrow hook flag`.

**Brand (podle firemní prezentace EFEKTIVE – zdroj pravdy):**
- Písmo **Inter** (variabilní, opsz). Nadpisy 800, prostrkání −0.045em, těsné řádkování. Tělo textu 400–500 šedé `#5b6272`.
- Nadpisky (kicker): zelená `#4ea51f`, VERZÁLKY, tučně, prostrkání +0.2em, formát „TÉMA · PODTÉMA“ (např. „KLING · EDIT MÓD“). Alternativně modrá.
- Barvy: pozadí `#f6f7fb`, karty bílé s 2px linkou `#e4e7ee` a radiusem ~40px, grafit `#252a35` (ne černá), modrá `#2f6bed` (→ `#5b8cf5` gradient), limetková `#7fd858`, světle modrá výplň `#eef3fe`, světle zelená výplň `#f0f9e8`.
- Zvýrazněná karta = modrý (nebo zelený) 3px rámeček + světlá výplň (`.card.hl-blue` / `.hl-green`). Šipky světle modré `#9bb8f8`.
- Dekor: lesklé 3D koule (modrá, zelená) s měkkou září, rozmazané barevné skvrny, vlasové linky rastru, modrý zaměřovací kříž s gradientem. Max 2 akcenty na obrazovce.
- **Značka „efektive.cz“** (modrá + zelená „.cz“ v pilulce) se ukazuje JEN v outru. Ve voiceoveru ani ve scénách ji nezmiňuj.

**Pohybová pravidla (aby to vypadalo jako z After Effects, ne „AI slop“):**
- Křivky: `snapOut` = cubic-bezier(0.05, 0.7, 0.1, 1) pro příchody (rychlý útok, dlouhý dojezd – jako v referencích), `brandOut` pro klidnější, `brandInOut` pro přesuny, `inExpo` pro odchody (0,12–0,25 s). Nic lineárního. Překmit max ~3 % (jen ikony).
- Nové slovo je chvíli tónované světle modře a do ~0,4 s ztmavne do inkoustu; řádek se průběžně centruje.
- Text vždy po písmenech: tenký + rozmazaný + pootočený → tučný + ostrý (`revealLetters`).
- Linky se kreslí (trim path), karty vyjíždějí 60–140 px a dosedají z mírného 3D náklonu.
- Všechno se překrývá (stagger 30–80 ms), další prvek startuje dřív, než předchozí doběhne.
- Jedna myšlenka na scénu, max ~6 slov velkým písmem. Obraz ukazuje, ne opakuje titulky.
- Obsah v pásmu y 300–1280 px (nahoře HUD, od 1340 titulky, pod 1550 UI Instagramu).

### 5. Kontrola
```bash
node scripts/render.mjs episodes/<id> --contact          # build/contact.png – snímek každou sekundu
node scripts/render.mjs episodes/<id> --cuts             # build/cuts.png – okolí KAŽDÉHO střihu
node scripts/render.mjs episodes/<id> --stills 6.2,9.8
```
Prohlédni (Read) oba listy. **Tvrdé pravidlo: nikdy dva texty přes sebe** (odcházející nadpis × přicházející, popisky × HUD, dva řádky titulků). Dále: přetečení textu, kolize s titulky, prázdná místa, prvky co přijdou po slově. Oprav a opakuj.
**Hook:** výchozí je `board` (engine/hook-board.js – tabule, odtrhávací kalendář, přeškrtnutí, listy ve větru; rozbor v docs/motion-reference.md §6). Alternativa `"hook": "calendar"` v episode.json (iOS kalendář, zůstává na aktuálním měsíci). Data se doplní sama z `today`/`newsDate`; na hook soubory mezi epizodami nesahej.

### 6. Zvuk
SFX se skládají automaticky: hook (swell, rewind, ticky, riser, impact, dive, shimmer), každý střih (swish), prvky scén (pop, swipe, tick, bar_rise) a outro (logo sting) → **jedna stopa** `build/sfx_stem.wav` (plán v `build/sfx_plan.json`). Po prohlédnutí contact sheetu zvaž extra vrstvy specifické pro epizodu: vygeneruj je přes `creative_generate_in_flow` (`node_type: "sfx"`, `model_id: "eleven_text_to_sound_v2"`, `generations_count: 1`, prompt = jeden konkrétní zvuk), ulož do `assets/sfx/el/<jmeno>.mp3`, zapiš do `library.json` a zavolej je přes `ctx.sfx` (v `custom` scéně) – nebo je přidej do knihovny pro další epizody.

### 7. Finální render
```bash
node scripts/render.mjs episodes/<id>             # motion blur 4× (config.video.motionBlur), ~4–6 min
node scripts/render.mjs episodes/<id> --mux-only  # jen přemíchat zvuk
```
Pošli `build/reel.mp4` přes `SendUserFile` + text voiceoveru, délku a seznam scén. Commitni `episode.json` (+ nové šablony/zvuky); `build/` se necommituje.
