---
name: efektive-aktuality
description: Technický engine série EFEKTIVE AKTUALITY – video 16:9 (1920×1080, 24 fps): hook „glide“ (plynulý najezd na kalendář, šťouchací hláška, 3D slova s depth blurem) → 3D kostka → motion grafika v brandu EFEKTIVE (Inter, chladně bílá, grafit, modrá + zelená) synchronizovaná na slova, hlas vypravěče Aura (ElevenLabs eleven_v4), hlas postavičky Efík, sound design navázaný na slova, kamerové pohyby jako post-pass, postCut, cover. Použij při ruční výrobě nebo úpravě dílu („udělej reel / aktualitu“, vložený brief „Novinka ze … / Co se změnilo / Pro klienty / Vyzkoušet“); plně automatický díl od researche řídí skill efektive-aktuality-auto.
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


## Zpětná vazba k dílu #4 (3. 11. 2026, platí od #5, POVINNÉ)
Hook glide (layout textu, animace nástupu, kamera) je validní, nech ho. Všechno ostatní níže.

**1. Žádné šablony, pokaždé nová animace (nejdůležitější).**
- V #4 byl „bigtype“ (modré pozadí, jeden velký text „1 klik“, za ním stejný layout) a „webslides“ (web → slajdy) jen přepsaný text minulé grafiky. To už NIKDY.
- Ukládej si **strukturu** (pořadí beatů: logo/značka → velké slovo → vysvětlení pojmu → vtip → pro klienty → zkus), **ne vzhled**. Každý díl strukturu autenticky přetvoř: jiné barvy pozadí, prohozené strany, jiný layout, jiný typ pohybu, nově vymyšlené logo/značka, nová vysvětlovací animace.
- Před stavbou grafiky otevři `news-reel/docs/motion-evolution.md` a stills minulého dílu a vypiš si, co tam bylo. Nic z toho neopakuj ve stejné podobě (stejné pozadí + stejný layout + jiný text = chyba).
- Co se líbilo a může zůstat jako princip: točící se/poskakující logo s čipy na slova, dynamika, motion grafika obecně.

**2. Glow na oranžových slovech v hooku.** Teď vypadá spíš jako drop shadow. Chce víc svítit: **víc gainu (jas jádra a blízké záře), méně spreadu (menší, ne tak široký měkký halo)**, nic tmavého pod písmem. Hodnoty v `engine/hook-board.js` (glow drop-shadows) uprav a ověř na stills.

**3. Bug ve webslides (#4, ~19,5–21 s):** karty/bannery se překrývají a při přepnutí aktivní karty skáče pořadí vrstev, text karty prosvítá a ořezává se. Při každé nové kartové grafice zkontroluj snímky po 0,1 s kolem každého přepnutí (z-index, překryv, ořez).

**4. Vtip je dlouhý** → zkrať (max ~1 věta + pointa) a minimálně zrychli.

**5. Hlas (nejvíc vadí):**
- Zní moc AI a je pomalý. **Tempo nahoru všude**: hook výrazně rychleji, vysvětlování taky, nikde se nevleče („chceme fakt bomby“). Vyřezávej pauzy > ~0,08 s v celém voiceoveru, nejen v hooku; cíl tempa vypravěče ≥ 1,25–1,3 (měř slova/s, cíl ≥ 3,3 slova/s).
- **Vyber lepší, kvalitnější, ČESKÝ hlas** (rodilý čeština, přirozený, ne syntetický). Aura (navržený hlas) se nahrazuje. Postup: `creative_list_voices` (hledej czech / čeština / cs, native), vyber 2–3 kandidáty, namluv stejnou testovací větu včetně „AI“ a „Chrome“, poslechni přes Scribe a porovnej přirozenost; vyber nejlepší a zapiš ID sem. Když knihovna nic dobrého nemá, navrhni nový hlas (`creative_design_voice`, popis: rodilý český mluvčí, přirozený, energický moderátor, rychlé tempo).
- **Výslovnost cizích názvů tak, jak to říkají Češi**, ne po písmenech / ne foneticky divně. V #4 hlas četl „AI“ jako dvě písmena a „Chrome“ s „K“ na začátku – obojí špatně. Přesná podoba viz `news-reel/docs/vyslovnost.md` (aktualizuj po potvrzení uživatelem) a vždy ověř poslechem/Scribe před renderem.

**6. Sound design nesmí být pořád stejný.**
- V #4 byly SFX skoro stejné jako od začátku série. Každý díl **jiné zvuky**: cykluj knihovnu na Drivu „SFX AI final“ (`1_ov-XY7iJkn3LAjMd5ohhzJZuouVsdKn`, ~10 000 zvuků), každý díl stáhni nové whooshe/impacty/UI/foley a ty minulé nepoužívej znovu na stejná místa (veď si seznam použitých v `motion-evolution.md`).
- **Zvuk jen tam, kde se v obraze něco děje.** Žádný riser, když nic negraduje. Nejdřív video „navnímej“ (contact sheet / stills), pochop, co se kde děje, a teprve pak stackuj SFX na správné snímky (dopad, klik, otočka, flash, nástup textu). Struktura zvukového designu zůstává, konkrétní zvuky a jejich umístění se mění.

**7. Maskot (Efík, kluk z `news-reel/assets/coldopen/character_sheet.png`) patří do KAŽDÉ aktuality – do motion grafiky, ne do hooku.**
- Negeneruj ho přes Higgsfield. Udělej z něj **2D cut-out loutku**: rozsekej ho (Canva / PIL) na ~15 dílů (hlava, oči/brýle, pusa – víc tvarů, vlasy, trup, horní a dolní ruce, dlaně, nohy, boty, hrnek…) jako průhledná PNG s pivoty v kloubech, ulož do `news-reel/assets/mascot/` a animuj je v enginu (rotace kolem kloubů, squash & stretch, mrkání, změny pusy na slova, sekundární pohyb).
- Ve 2–3 scénách motion grafiky reaguje na obsah (ukazuje, diví se, ťuká na tlačítko, směje se u vtipu). Styl ostatní grafiky zůstává (3D / klasická motion grafika), jen maskot je 2D.
- Hotovou loutku znovu používej, ale pózy a akce vymýšlej každý díl nové.

**8. Thumbnail VŽDY s maskotem** (v #4 chyběl). Samolepka maskota (Efík z `character_sheet.png`) je na každém thumbnailu a je zasazená do tématu dne: svátek → v jeho stylu (Halloween = dýně/kostým), jinak podle novinky (téma slajdy → maskot vykukuje ze slajdu / drží slajd apod.). Bez maskota thumbnail neodevzdávat.


**Schváleno uživatelem: #5 v2 (4. 11. 2026) = nová laťka.** „Takhle je to OK, ale každou další aktualitu měň ty různé věci.“
Co zůstává (styl): bílé EFEKTIVE pozadí s kolečky, 2D maskot v grafice i na thumbnailu, hlas Karel s tempem ~1,28 (hook ~1,15), krátká šťouchací hook hláška, glow jako plynulý gradient, outro 1 s, struktura scénáře.
Co se MĚNÍ v každém dílu (kontrolní seznam před renderem, zapiš do `motion-evolution.md`):
1. Všechny scény motion grafiky = nové animace a layouty (žádná šablona z minula s jiným textem).
2. Hook: jiná předvolba `ep.hookLayout` než minule (nebo nová) a jinak poskládaný text (klíčová slova, pořadí velikostí).
3. Barvy/akcenty podle tématu (pozadí zůstává bílé).
4. Pózy a akce maskota (jiné výrazy, rekvizity, co dělá).
5. Sound design: jiné zvuky z Drivu, jen tam, kde se v obraze něco děje.
6. Thumbnail: jiná kompozice karty a maskot v tématu dne.
7. Typ přechodů mezi scénami.

**Zpětná vazba k #5 (4. 11. 2026, platí od teď, POVINNÉ):**
- **Design EFEKTIVE vždy:** bílé pozadí s našimi kolečky/blobami (engine `.bg`) v KAŽDÉ scéně grafiky. Měnit se mají animace a layouty, ne pozadí – žádné černé, tmavé ani celobarevné pozadí scén.
- **Nové animace a 2D maskot se líbí** (tablet, trinity, equation, puppetdraw, cutout, receipt, postgrid, todo) – tenhle směr držet, ale každý díl zase jiné.
- **Hook hláška kratší** (max ~12–14 slov), aby se nemusela tolik zrychlovat: hook jen `atempo ≈ 1.15`, ne 1.35 (bylo moc rychlé).
- **Vypravěč ve vysvětlování nesmí ztrácet tempo:** voiceover `voice-tighten` s tempem ~1.28 a pauzy ≤ 0,05 s.
- **Glow na slovech v hooku = plynulý gradient:** text svítí a záře se postupně úplně ztratí do okolí (několik vrstev s rostoucím rozmazáním a klesající sytostí). ŽÁDNÝ ostrý obrys/outline kolem písmen (malý blur s vysokou opacitou = outline, to nechce).
- **Layout textu v hooku se mění každý díl** (nejen barva): jiné umístění odstavců na zdi a jiné uspořádání (zarovnání, pořadí velikostí, kde je klíčové slovo, náklon). Engine má předvolby `ep.hookLayout` – nikdy nepoužít stejnou jako minulý díl (zapiš do `motion-evolution.md`).
- **SFX v hooku:** „DJ scratch/rewind“ (marker_scratch) byl moc nahlas → tlumeně a jen kde to dává smysl.
- **Outro efektive.cz jen ~1 s.** Text: „Další aktuality každý třetí den“.
- **Kreslení maskota:** tužka hrotem k tabletu, ruka u tabletu (ne nad ním).
- **Frekvence: aktuality každý TŘETÍ den** (od 4. 11. 2026: 4. 11., 7. 11., 10. 11. …). Popisek: „Každej treti den ti sem hazim…“.

**Zavedeno v #5 (4. 11. 2026):**
- **Hlas vypravěče = Karel** (`wNYzYiprejHCPi4voSeA`, „Karel – Czech Broadcast Reporter“, rodilý český, rychlý, energický), eleven_v4, tagy `[energetic, fast, confident]`. Aura jen záloha. Výslovnost cizích slov foneticky česky jako mluví Češi: Kanva, Afiniti, ajpad, Fotošop, Ilustrátor, InDizajn, Ep Stór, Adobi. „AI“ a „Chrome“ zatím ve skriptu NEPOUŽÍVAT (čeká na potvrzení výslovnosti uživatelem) – opsat („umělá inteligence“, „prohlížeč“).
- **Tempo:** po TTS vždy `python3 news-reel/scripts/voice-tighten.py take.mp3 scribe.words.json out.mp3 out.words.json 1.2 0.06` (voiceover) a `… 1.35 0.04` (hook). Pak `ingest-voice.mjs` s `"tempo": 1.0`. Cíl ≥ 3,3 slova/s.
- **2D maskot:** `engine/mascot.js` (`mascot()` → `.pose({x,y,s,lean,bob,sq,armL,armR,head,expr,legs})`, `.prop("L"|"R", html)` = věc v ruce), díly v `assets/mascot/` (hlava ×4 výrazy: head, head_grin, head_shock, head_wow; trup, ruce, nohy, ukazovací ruka) řeže `scripts/mascot-parts.py` z character sheetu. Ve scénách #5: `puppetdraw` (kreslí na tablet), `cutout` (je na fotce), `receipt` (směje se), `todo` (ukazuje). Pózy a akce každý díl nové.
- **Thumbnail se samolepkou maskota:** `episodes/<id>/thumbnail/sticker.py` poskládá loutku do pózy + bílý die-cut okraj; karta v `card.html`; do Canvy 3 vrstvy (tmavý obdélník, karta, samolepka).
- **Hook:** odstavce se drží na volné zdi (1.–2. vpravo od kalendáře, 3. pod ním), takže funguje i den v horních řádcích; glow = barva akcentu tématu, vysoký gain, malý spread.

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
**Styl od 20. 10. (zpětná vazba uživatele, platí přednostně):**
- **Vysvětluj jako dítěti.** Každý pojem, který divák nemusí znát, hned vysvětli 1–2 větami a ukaž ho v grafice. Příklad: „Pro ty pomalejší: karusel je jeden příspěvek, ve kterým máš víc fotek za sebou. Swipneš, další fotka. Swipneš znova, další. Jasný?“ a k tomu telefon s příspěvkem, který se na slova „swipneš“ posouvá (šablona `phone`).
- **Uveď produkt prakticky.** Co to je, odkud a za kolik, např. „appka přímo od Instagramu, v App Storu úplně zadarmo“. Lidi rádi slyší „zadarmo“. Grafika: ikona appky + tlačítko „Získat“, které se ťukne (šablona `app`, props `button`, `buttonDone`, `buttonAt`).
- **Jeden vtip na díl.** Drzý, ale ne zlý (např. „Android je na cestě… ale upřímně? Android maj stejně jen divný lidi. Takže jedem dál!“). Zvukově: hudba se na vtip zastaví (`dj_brake`, hudební podklad přes `until`), pod vtipem rostou risery, na „jedem dál“ přijde basový úder a hudba naskočí. Kamera při vtipu skočí blíž a stojí.
- **Délka:** cíl ~40 s celkem (max 60 s), čím rychlejší, tím lepší. Tempo hlasu 1,15 (`"tempo"` v episode.json).
- **Všechno česky:** AI = „á í“ (nikdy „ej aj“), zkratky česky po písmenech, anglická slova foneticky česky. Slovník: `news-reel/docs/vyslovnost.md`, projdi ho před každým TTS.
- **Statická scéna nesmí stát.** Na každé scéně je kamerový pohyb (`camera`, viz níže) a na každé změně zvuk (ui_swipe + ui_tap), na klíčových slovech tichý tik (`ui_tick`).

- Česky, tykání, rychle a úderně, 45–70 slov (≈ 18–24 s). Žádné pozdravy, žádné datum (to je v hooku), **nezmiňuj značku EFEKTIVE** – ta je jen v outru.
- Struktura: co je nového (1 věta s názvem produktu) → co to umí → dostupnost → co z toho mají klienti → „Tak to zkus: …“ (konkrétní akce).
- Před každý úsek se změnou obrazu dej cue `[[nazev]]`. 5–7 cue = 5–7 scén po 2,5–4,5 s.
- eleven_v4 bere audio tagy: `[excited]` na začátek, `…` pro pauzu, — pro krátký beat, VERZÁLKY pro důraz (střídmě). Čísla piš normálně („3×“, „20 %“).

### 3. Voiceover přes ElevenLabs konektor (MCP)
1. `creative_create_flow` (název „Aktuality #N – téma“).
2. `creative_generate_speech`: `model_id: "eleven_v4"`, `voice_id: "vHP4Az3ehXL47emKpHTK"` (**Aura – hluboký zastřený sebevědomý vypravěč, stálý hlas série od 20. 10.**, prompt začni `[confident, relaxed, brisk pace]`; postavička v hooku mluví hlasem Efík `LeAUiEe2DARUVrjI6jCU`; viz `news-reel/assets/voice-design/README.md`. Dřív Karel `wNYzYiprejHCPi4voSeA`). Anglická slova piš foneticky česky (karusel, apek), `prompt` = skript BEZ `[[cue]]` značek, `flow_id`. Poll `creative_get_flow_run_status`.
3. Vyber take (první, pokud uživatel neřekne jinak), stáhni `content_url` (curl) do `build/takes/takeN.mp3`.
4. `creative_add_flow_asset_node` (generation_id vybraného take) → `creative_transcribe_audio` (`eleven_scribe_v1`, `connect_from` = ten node) → stáhni `words_download_url` do `build/takes/takeN.words.json`.
5. `node scripts/ingest-voice.mjs episodes/<id> build/takes/takeN.mp3 build/takes/takeN.words.json` → zrychlí (config `tempo` 1.1), spočítá časy cue a slov.
(Alternativa s API klíčem: `node scripts/tts.mjs episodes/<id>`.)
**Kamera a zvuky navíc bez nového renderu:** `"camera"` v episode.json = klíčové snímky zoomu `{t, z, ease}` (časy celého filmu před `postCut`; křivky linear/inQuad/outQuad/inOutQuad/inCubic/outCubic/inOutCubic/outQuart/inOutQuart/outExpo/inOutSine). Aplikují se jako adjustment layer na hotový obraz (`scripts/camera-post.py`, kotva zoomu ve 30 % výšky, aby zůstala hlavička; rychlé zoomy mají závěrku) při každém muxu, takže stačí `--mux-only`. Na změnách scén jsou krátké (0,14 s) přeskoky. Zoom drž ≤ 1,11. `"sfxExtra"` = další zvukové vrstvy navázané na slovo (`word`, `nth`), cue nebo absolutní čas.
**Výměna hlasu bez nového renderu:** nový take + Scribe → `python3 news-reel/scripts/voice-conform.py episodes/<id> take.mp3 take.words.json --out …` (každé slovo natáhne na čas ve `build/words.json`) → případná úprava zvuku → přepsat `build/voice.mp3` → `render.mjs <ep> --mux-only`. ASMR šepot (20. 10.): `[whispering close into your ear, ASMR, playful]`; úprava zvuku: blízkost (+5 dB @140 Hz), presence (+3 dB @5,5 kHz), de-esser, kompresor 4:1, hlasitější o ~2,5 dB, víc v levém uchu (L 1,0 / P 0,6).

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
| `iphone` | (`side: "left"` = telefon vlevo, zrcadlené natočení) 3D iPhone (Apple styl) přiletí po oblouku, pomalu se otáčí, na displeji se v Poznámkách PÍŠE nadpis + checklist (klávesy se mačkají) – 1× za video, kde dává smysl telefon / appka / platforma | `kicker, title, sub, app, heading, date, items:[{text, at, done}]` |
| `desktop` | AI ovládá počítač (computer use): okno appky ve 3D, modrý sken obrazovky s detekčními rámečky, kurzor „AI“ jede po obloukových křivkách se stopou, klik (ripple), píše do polí; úkol se napíše do prompt baru, kurzor sám dovyplní a odešle (zelené tlačítko + toast) | `title, app, heading, fields:[{label, value}], button, task, toast, steps:[{label, at}], lookAt, moveAt, clickAt, typeAt, taskAt, doneAt` |
| `tower` | výčet 3–5 věcí jako 3D izometrické vrstvy (desky s ikonou a popiskem), každá spadne na svoje slovo na hromadu, odskočí a dostane fajfku; věž se pomalu otáčí, nadpis vlevo | `kicker, title, items:[{label, icon, tone, at}]` (ikony: grid, table, photo, mail, …) |
| `globe` | 3D tečková koule přiletí z hloubky (rozmazaná → ostrá, lehký překmit), točí se; kolem rovníku obíhá text (zadní strana bledne), vedle dopadne nadpis | `kicker, ring, text, repeat` |
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

**Přechody** (`"transition"` na scéně = jak scéna přijde; předchozí podle toho odejde): `push` (výchozí – zvednutí + rozmazání), `whip` (prudký horizontální odjezd s rozmazáním – změna tématu), `zoom` (průlet dovnitř – max 1× za video), `blur` (měkké prolnutí), `strobe` (3 jednosnímkové barevné záblesky + tvrdý střih – typicky před `bigtype`), `streak` (světelná linka přes střed se rozevře do modré plochy, ta odjede nahoru), `invert` (1 bílý záblesk + ~4 snímky negativ celého obrazu + úderný zvuk, nová scéna s punch-in – **přesně 1× zhruba v půlce videa** na udržení pozornosti), `flash` (expozice se vytáhne nahoru, 2 snímky čistě bílá, bloom/glow, který exponenciálně dohasíná, nová scéna se vynoří ze světla s punch-out a rozostřením; zvuk swell + synthetic impact + shimmer ze složky SFX AI final na Drivu – **aspoň 2× za video**).
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
**Hook:** výchozí je `board` (engine/hook-board.js) – JEDEN fotografický podklad `assets/plates/wide.jpg` (cihly, tabule, slunce přes žaluzie, haze) a JEDNA souvislá kamera, takže papír má zblízka stejnou texturu i světlo jako zdálky (žádné přepínání na jinou fotku). Papíry se kreslí do canvasu: fotka papíru (vlákna) → tisk/fixa vynásobené do papíru → nízkofrekvenční světelná mapa z podkladu (jen pruhy slunce a stín, nikdy škrábance křídy) → zrno. Každý list je rozřezaný na proužky řetězené ve 3D, vítr ho tedy OHÝBÁ (spodek se zvedá a vlní). Na tabuli: nástěnný kalendář měsíce novinky (wire-o vazba, magnet, české svátky, čísla týdnů, minikalendáře), žlutý lístek, poznámka na žvýkačce, prázdný papír na dvou magnetech. Kamera: plynulý pojezd zleva doprava (čistá translace, bez náklonu) → zrychlující najetí → střih blíž (název měsíce + den v záběru) → zakroužkování dne červenou fixou → křídová šipka → přejezd na prázdný papír, kde se modrou fixou napíše „novinka ze X“ → ponoření do papíru → motion grafika (má jemnou texturu stejného papíru). V popředí rozostřené podzimní listí (f/1.8) s paralaxou. Listy se NEODTRHÁVAJÍ (vypadalo to AI-kově). Rozbor v docs/motion-reference.md §6. **Nikdy nestav prostředí/textury v CSS – vždy fotografický podklad** (když je potřeba nový, vygeneruj ho přes Higgsfield `gpt_image_2_5`, 4K, quality high, prompt ve stylu „cinematic 35mm film still … Kodak Portra 400, haze, volumetric light“). Alternativa `"hook": "calendar"` v episode.json (iOS kalendář). Data se doplní sama z `newsDate`; na hook soubory mezi epizodami nesahej.

### 6. Zvuk
SFX se skládají automaticky: hook (swell, rewind, ticky, riser, impact, dive, shimmer), každý střih (swish), prvky scén (pop, swipe, tick, bar_rise) a outro (logo sting) → **jedna stopa** `build/sfx_stem.wav` (plán v `build/sfx_plan.json`). Po prohlédnutí contact sheetu zvaž extra vrstvy specifické pro epizodu: vygeneruj je přes `creative_generate_in_flow` (`node_type: "sfx"`, `model_id: "eleven_text_to_sound_v2"`, `generations_count: 1`, prompt = jeden konkrétní zvuk), ulož do `assets/sfx/el/<jmeno>.mp3`, zapiš do `library.json` a zavolej je přes `ctx.sfx` (v `custom` scéně) – nebo je přidej do knihovny pro další epizody.

### 7. Finální render
```bash
node scripts/render.mjs episodes/<id>             # motion blur 4× (config.video.motionBlur), ~4–6 min
node scripts/render.mjs episodes/<id> --mux-only  # jen přemíchat zvuk
```
Titulky dole jsou ve výchozím stavu VYPNUTÉ (sdělení nesou texty ve scénách; zapnout jde `"captions": true`). Pošli `build/reel_web.mp4` (kopie pod 30 MB; master `reel.mp4` se zrnem má stovky MB) přes `SendUserFile` + text voiceoveru, délku a seznam scén. Commitni `episode.json` (+ nové šablony/zvuky); `build/` se necommituje.

### Zvukový design (filmový mix)
Hook má vlastní zvukovou skupinu (`busGain`) ve čtyřech vrstvách. Podrobně je to v `news-reel/docs/sfx-design.md`:
- **atmosféry:** město za oknem, vítr, drone;
- **efekty k obrazu:** žaluzie, listí a průlety listů časované na rozostřené listy, papír, fixa, kamera;
- **motiv času:** hodiny v detailu kalendáře;
- **předávka do grafiky:** reverzní swell, sub úder a třpyt.

Každá zvuková událost umí `{ dur, fi, fo, hp, lp, pan }`. Vzdálenost řeš ekvalizérem, polohu panoramou podle obrazu. Mastering je jeden statický zisk na −14 LUFS plus limiter −2 dBFS, ne dynamický loudnorm, aby hook zůstal o ~3 LU tišší než hlas. Kontrola: `ffmpeg -ss 0 -t 4.4 -i reel.mp4 -af ebur128` (hook ≈ −17,5 LUFS, tělo ≈ −14,5). Nové atmosféry generuj s `duration_seconds` a normalizuj na špičku −1 dBFS.

### Cold open – postavička před hookem (volitelné)
### Hook „glide“ (VÝCHOZÍ od dílu #5, `"hookBoard": "glide"`)
Jeden plynulý záběr bez střihu: truck zleva doprava podél zdi → plynulý push-in → dosedne na den novinky (mírně nad středem). Kamera `camAt` větev `GLIDE`: x/y po křivce `bezier(.22,.42,.18,1)` (hýbe se od 1. snímku), zoom `bezier(.5,0,.18,1)` (zpožděný = najezd), start `s 1.32`, konec `s 2.05`, délka `glideEnd = 2.15 s`, pak creep. Kroužek fixou při dosednutí, pak samolepky tématu (`THEMES`: halloween dýně/netopýři/pavučina, xmas, newyear, valentine; svátky v `SPECIAL`, override `ep.hookTheme`).
- **Slova na stěně:** `ep.hookText = [{text, w:[i,j], accent}]` + `ep.hookVoice = {file, at, dur, gain, words}`. Řádky žijí v souřadnicích podkladu (`.bh-lock` uvnitř `.bh-plate`, oblast `LOCK` vpravo od kalendáře), takže se hýbou se stěnou. `layoutLock()` měří inkoustový obrys každého glyfu (canvas `actualBoundingBox*`) a skládá řádky co nejtěsněji: pro každý řádek zkouší posun dx a bere ten s nejnižší účtaří, která se nedotkne žádného řádku nad ním (+ malá penalizace za odsazení). Mezera mezi slovy 0,17 em. Řádek má odstup od zdi `pz` (paralaxa `−pz·(cam − konec)`, vržený `drop-shadow`), pop písmen na první slovo, depth blur 0,3 s po posledním. Odstavce `PARAS` (cik-cak kolem dne), kamera `KEYS` (1. = den + odstavec v čase `glideEnd` 1,3 s, další = skutečný obrys textu, příjezd 0,3 s po prvním slově odstavce) → `camPath()`: body záběrů + „linger“ body (14 % směrem k dalšímu, zoom ×1,07), monotónní kubický spline (Fritsch–Carlson) v x, y, log(s), start tečna 2,6× (x/y), konec pokračuje lineárně → kamera nikdy nestojí; animace textu `pop/up/left/down` (slide: 1−e^(−0,576·frame), opacita 0→1 za 2 framy); když řádek nezíská zacvaknutím ≥ 6 % výšky, jde za předchozí řádek; prázdný papír se v glide skrývá, vítr ×0,3.
- Bez `hookText` engine sám složí „Víš, co se stalo“ + „tenhle pátek? / na Halloween?“ (`hookQuestion`).
- Hláška = šťouchnutí do diváka (viz auto skill §4), Aura eleven_v4, pauzy vyříznout + `atempo 1.2`, ≤ 6 s.
- Starší varianty níže (`hookGag` se Seedance, „cut“, „full“) zůstávají v enginu jako archiv.

### Hook „nehoda u tabule“ (gag, od 20. 10.): nahrazuje úvodní scénky
Jedna lokace, tabule z hooku. Postavička je kreslená ve stylu Spider-Verse (tlusté obrysy, rastrové tečky, posunuté barvy) a animovaná po dvou snímcích, prostředí zůstává fotoreálné. Kamera = **záběr z FPV dronu** (průlet kolem něj, šílené úhly). Dron samotný NIKDY nesmí být v záběru. Nehoda (max 5 s) vždy skončí na dni novinky v kalendáři. Pak řekne repliku („Ne! Na sedmičku ne!… Sedmýho… října…“), během ní kamera najíždí na den a během konce repliky se otočí kostka do motion grafiky.
Postup (`"hookGag": "<id>"` v episode.json, data ve `v2/hook/index.json`):
1. style frame nehody (gpt_image: záběr tabule + character sheet), startovní snímek (vteřinu před nehodou);
2. koncový snímek = still z enginu (`--stills 0` s `hookGag` a 0 snímky klipu): detail kalendáře se značkou (`v2/hook/<id>/mark.png`);
3. video Seedance 2.5 `omni_reference` se start_image + end_image, 5 s, bez zvuku. Vystřihni úseky, kde je vidět dron;
4. `scripts/hook-gag-frames.py <id> clip.mp4 --start … --end … --twos` (render.mjs si snímky upeče sám, když chybí);
   **Multishot (doporučeno, od 20. 10.):** jeden Seedance 2.5 klip 720p, 16:9, 6 s (42 kreditů) se 7 keyframy v `image_references` a s časováním záběrů v promptu (wide příchod → detail hrnku s pískáním → detail boty, zakopnutí → slow-mo pád / káva / obličej / kapka → kalendář normální rychlostí, cákanec u dne). Pak střih v ffmpeg do `edited.mp4`: normální rychlost ×1,3, slow-mo nechat, vadné úseky vyhodit, upscale na 1080p. Časy střihů dej do `cuts` v indexu: závěrka pak nemíchá snímky přes střih a „po dvou“ začíná znovu na každém střihu. Náhled jen hooku: `render.mjs <ep> --hook-only` (výstup `build/hook/`);
   **Dostřih bez renderu:** `voiceSs` v indexu přeskočí začátek repliky (u kafe zůstane jen „Sedmýho… října…“). `postCut: [od, do]` vystřihne úsek z hotového filmu (obraz i smíchaný zvuk, 80 ms prolnutí). Platí i pro celé video. Změna zvuku = jen `--mux-only`;
5. zvuk: hudba (ElevenLabs SFX „cinematic trailer cue“) s vrcholem na dopadu + 8–10 vrstev foley/designed na hlavní akci (např. kafe: dron, srknutí, leknutí, ťuknutí hrnku, šplouchnutí, švih, nasávání, dopad na papír, klik + tělo + sub) + replika (hlas Pavel).

### Hook „tabule“ – krátká verze (výchozí od 17. 10.)
Žádný pojezd podél zdi a žádný papír s „novinka ze X“. Hook začíná tvrdým střihem rovnou na detail kalendáře se dnem novinky **přesně uprostřed obrazu**. Kamera na něj najíždí (rychlý start, dlouhé dojetí) a fix ho zakroužkuje. Pak přijde 3D přechod doprava jako v After Effects: kalendář a motion grafika jsou dvě sousední stěny jedné kostky, kamera se otočí na pravou stěnu a lehce při tom couvne. Grafika (Instagram Edits…) naskočí rovnou. Celý hook má asi 1,6 s. Dlouhou verzi zapne `"hookBoard": "full"` v episode.json.

Před hook lze předřadit krátkou scénku (4,5–6,5 s). Plochá 2D postavička ze character sheetu žije ve **skutečných fotkách místností** uživatele (`engine/coldopen.js`, assety a celý postup v `news-reel/assets/coldopen/README.md`). Varianty: `newspaper`, `nap`, `laptop`, `phone`, `notebook`. Každá končí pointou „Počkej… co je dneska za datum?!“ v detailu obličeje a panem kamery doprava do hooku.
- **Zapnutí:** `"coldOpen": "<id>"` v episode.json, nebo `--cold <id>` při renderu.
- **Jen scénka na schválení:** `--cold <id> --cold-only`; výstup v `build/cold-<id>/`. Render je automaticky 24 fps se závěrkou 1/24 s (1.0). Na schválení stačí framy: `--stills t1,t2,…`, celé video renderuj až po „jo“.
- **Rotace:** varianty střídej po týdnech, ať se neokoukají.

Pravidla (zpětná vazba uživatele, v5):
- **Prostředí se nekreslí.** Vždy reálná fotka. Kreslená je jen postavička a to, co drží. Skutečný nábytek před ním ho zakrývá (occludery z fotky: víko MacBooku, hrana stolu, nohy stolu).
- **Žádný vystřižený obrázek.** Bez bílého okraje a bez blikání. Silueta se nemění střídáním celých překreseb; mezifáze (`coldopen-inbetween.py`) mění jen tu část, která se hýbe (ruka, hlava, noviny). „Překreslování“ = jen černé čáry propisky se lehce přetahují (ink vrstva, posun každý 3. snímek), barvy se nepatrně chvějí; obojí je oříznuté do pevné siluety.
- **Placatý papír ve 3D.** Postavička stojí v prostoru natočená (yaw ~12–17°) a lehce přehnutá na svislém ohybu, takže je vidět, že je plochá. Nikdy není rovnoběžně s kamerou.
- **Tempo hooku na sociálních sítích:** záběry 0,5–1,4 s, leknutí jen na pár snímků (samostatný ostrý střih + crash zoom), pauzy v replikách vystřižené (`coldopen-tighten.py`). Rychlý švih do hooku.
- **Mobil vždy v ruce:** inserty s mobilem jsou z jeho pohledu a mobil drží jeho kreslená ruka (nikdy nelevituje). Na posteli leží mobil vedle jeho ruky.
- **Sound design jako ve filmu, ne jen AI efekty:** atmosféra stříhaná s obrazem (perspektiva podle záběru, J-cut o 3 snímky dřív, vakuum 0,1 s před úderem), designovaná vrstva ze `scripts/sfx-design.py` (vrstvené švihy na snímek, klik + tělo + sub s harmonickými, tension drone, reverse swell), dialog nahoře.
- **Střih jen tam, kde se mění záběr.** Pózy a „Počkej“ freeze se mění uvnitř záběru (najetí + crash zoom), nikdy střih na stejný pohled. Typicky celek → insert → polocelek → detail obličeje → pan doprava.
- **Inserty a detaily na reálné textuře** (4K fotka s mírným rozostřením). Nikdy rozmazaná jednolitá barva. Mobil celý i s rámečkem, MacBook s rámečkem a pantem, mobil na skutečné dece.
- **Čitelnost:** na obrazovce max. 2 články. U novin rychlý zoom na datum a zbytek rozostřený, žádné kroužkování.
- **Nikdy nestojí:** dýchá, přenáší váhu, drbe se, ruka kreslí (mezifáze po dvou snímcích). Čmárání = ruka s tužkou fakt jede po tazích.
- **Lip-sync jen na mluvené slovo** (obálka hlasu podle slabik), mezi slovy zavřená pusa.
- **Žádné leknutí, výskok ani útěk na konci.** Řekne „co je dneska za datum?!“ a kamera v detailu odjede doprava, bez šedých snímků. Flash při crash zoomu může zůstat.
- **Mobil u postele z jeho pohledu** (first person): vlastní ruka na peřině, mobil leží vedle ní, po zabzučení se ruka natáhne.
- **MacBook:** postava sedí ZA notebookem (víko a stůl ji zakrývají), nikdy z boku s rukama přes něj. Render `--cold-only` končí panem (hook se znovu nerenderuje).
- **Listí** jen občas proletí, menší a dál. Prach ve světle. Žádné statické rozmazané fleky.
- **Zvuk:** foley ke všemu, co dělá, a „hmm“ jako vesničan z Minecraftu. Hlas postavy je masterovaný na úroveň vypravěče z motion grafiky (`config.audio.dialogueLufs` −16,3 LUFS, `meta.masterRef`).

Nová varianta / nové prostředí (Higgsfield `gpt_image_2_5`, 2k high):
1. kompozit fotky a sheetu;
2. průhledný výřez (`background: transparent`);
3. `scripts/coldopen-register.py`;
4. `scripts/coldopen-pack.py` (ořízne bílý okraj, vytáhne ink vrstvu, uloží 4K plate pro inserty);
5. occludery (polygony skutečných předmětů před ním) zapiš do scény;
6. pózy, záběry, `paper` (yaw/fold) nadefinuj v `COLD_OPENS`;
7. hlas „Pavel“ (eleven_v4) + časy ze Scribe zapiš do `voice/timing.json`.
