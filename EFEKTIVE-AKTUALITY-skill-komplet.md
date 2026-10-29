---
name: efektive-aktuality-komplet
description: Plně automatická výroba dílu EFEKTIVE AKTUALITY obden (čt, so, po, st…, výroba od 4:40, doručení v 8:00 Praha), od researche AI novinek přes brief, nový Spider-Verse hook s maskotem (Seedance multishot), motion grafiku, hlas Aura, sound design, kameru a render až po popisek, thumbnail (Canva) a doručení na Google Drive. Použij, když se spustí plánovaná úloha „Aktuality obden“ nebo uživatel řekne „udělej další aktualitu sám“, „automatická aktualita“ nebo „jeď pipeline od researche“.
---

# EFEKTIVE AKTUALITY: kompletní skill v jednom souboru

Tento soubor spojuje všechno do jednoho:
- **Část A:** automatika obden (dirigent, co a v jakém pořadí);
- **Část B:** technický engine (šablony, přechody, hlas, kamera, zvuk);
- **Přílohy:** vývoj motion grafiky po dílech, slovník výslovnosti, rozbor referencí.

Kód enginu je v repu `tomcastvaj08-bit/-claude-test`, složka `news-reel/`, větev `claude/weekly-news-reel-automation-stdjyc`.

---

# ČÁST A: Automatika (efektive-aktuality-auto)

# AKTUALITY: automat od researche po doručení

Vzor dílu je **Aktualita #1** (`news-reel/episodes/2026-10-13-instagram-edits/`). Celý postup a všechny skutečné prompty jsou v `news-reel/docs/tutorial-aktualita-1-postup.md`. **Přečti si ho celý, než začneš.** Technické detaily enginu jsou ve skillu `efektive-aktuality` (`.claude/skills/efektive-aktuality/SKILL.md`). Tenhle skill je dirigent: říká, CO a V JAKÉM POŘADÍ, a nastavuje laťku kvality.

**Laťka:** každý díl musí být aspoň tak propracovaný jako #1, ideálně lepší. Lepší křivky, víc vizuálního vysvětlování, žádná statická scéna, čistší zvuk. Na nic se neptej. Uživatel tuhle automatiku schválil včetně útraty kreditů (Higgsfield, ElevenLabs) v rozpočtu níže.

## Harmonogram
- **Obden:** čt 29. 10. 2026, so 31. 10., po 2. 11., st 4. 11., … (každých 48 h od 29. 10. 2026).
- Plánovaná úloha se spouští **denně ve 4:40 (Europe/Prague)** v hlavní session (ta má konektory Higgsfield, ElevenLabs, Canva, Google Drive). Nejdřív spočítej `(dnešní datum − 2026-10-29) v dnech`. Je-li číslo **liché**, napiš jen „Dnes se aktualita nedělá (obden).“ a skonči.
- **Doručení přesně v 8:00 Praha.** Když je hotovo dřív, naplánuj si `send_later` na 08:00 a doruč až na ni. Rezerva na výrobu je přes 3 h (generování ~30 min, render ~50 min).

## Rozpočet na díl (strop)
- **Higgsfield ≤ 120 kreditů.**
  - **Hook (Seedance 2.5 multishot) generuj vždy v 480p**: pokyn uživatele po dílu #2; 6 s stojí 18 kr. (720p 42 kr.).
  - Bez keyframů, jen s referencemi (character sheet, board, style frame) a end framem z enginu.
  - Pak klip zvětši na 1080p Lanczosem s jemným doostřením (`unsharp`). Díl #2 takhle vyšel dobře.
  - Obrázky gpt_image (samolepka) stojí 0,25 kr.
  - Jedno přegenerování videa je OK, dvě ne.
  - Před generováním zkontroluj `balance` a `get_cost`. V závěrečné zprávě napiš, kolik kreditů zbývá.
- **ElevenLabs ≤ 3 000 kreditů:**
  - voiceover: 2 verze;
  - replika postavičky: 2 verze;
  - SFX: generuj jen nové zvuky, které v `news-reel/assets/sfx/el/` ještě nejsou. Ostatní používej znovu.

## Krok za krokem

### 1. Research (15 min)
- Projdi novinky z AI za **posledních 48 h** (WebSearch, oficiální blogy: OpenAI, Anthropic, Google, Meta, Apple, Instagram/Meta, Canva, ElevenLabs, Higgsfield, CapCut, Adobe…).
- Vyber **jednu** nejzajímavější pro podnikatele, kteří dělají obsah a marketing sami: praktická, „tohle si zkusíš dnes“, ideálně zdarma nebo levně, ověřená aspoň ze 2 zdrojů.
- Neopakuj téma posledních dílů. Seznam je v `news-reel/episodes/*/episode.json` → `title`.

### 2. Brief (formát, který dřív dělal ChatGPT)
Zapiš do `episode.json` → `source`:
```
<emoji> <Titulek> — Novinka ze <D. měsíce>.
Co se změnilo: …
Pro klienty: …
Vyzkoušet: …
Zdroje: <url>, <url>
```

### 3. Scénář voiceoveru (pravidla #1)
- **Úvod:** co to je, od koho, kde se to stáhne nebo otevře a za kolik („zdarma“ vždy zmínit, pokud platí).
- **„Pro ty pomalejší“ vložka:** vysvětli hlavní pojem jako dítěti ve 2 větách a hned ho ukaž v grafice.
- **Jeden vtip:** drzý, ne zlý, ideálně o konkurenci nebo o zbytečné práci. Za ním „Takže jedem dál!“.
- **Konec:** „Pro klienty to znamená…“ a „Tak to zkus: …“.
- **Délka:** 80–95 slov (≈ 34 s hlasu při tempu 1,15). Celé video 38–45 s.
- **Výslovnost: všechno česky** (pravidlo uživatele, chyba se opakovala v #1 i #2). **AI = „á í“, NIKDY „ej aj“.** Zkratky čti česky po písmenech (GPT = gé pé té, API = á pé í), anglická slova piš foneticky česky (karusel, apka, mejl, vork). Před každým TTS projdi skript podle slovníku `news-reel/docs/vyslovnost.md` (hledej `\b[A-Z]{2,}\b` a anglická slova), co chybí, doplň. Tagy eleven_v4: `[confident, relaxed, brisk pace]` na začátek, `[deadpan]` před vtip, `[upbeat]` po něm.
- **Cue značky:** `[[intro]] [[boom]] [[explain]] [[mix]] [[style]] [[platform]] [[joke]] [[clients]] [[clients2]] [[try]]`. Názvy a počet uprav podle tématu.

### 4. Hook s maskotem (NOVÝ gag každý díl, stejně propracovaný jako kafe v #1)
- **Lokace** je vždy tabule s kalendářem (fotoreál). Maskot je kluk z `news-reel/assets/coldopen/character_sheet.png` ve stylu **Spider-Verse**:
  - on twos;
  - tlusté obrysy;
  - Ben-Day tečky;
  - šrafování;
  - CMYK posun místo motion bluru;
  - smear frames;
  - impact frames.
- **Gag:** vymysli nehodu, která skončí přesně na **dni novinky** v kalendáři. Opakované nehody nepoužívej. Seznam použitých: kafe (#1). Další nápady: barva z pětky, šipka mimo terč, žvýkačka, papírová vlaštovka, kečup z hranolky, propiska co vystřelí, slepičí pírko…
- **Postup:**
  1. **End frame:** still z enginu, detail kalendáře se značkou gagu. Značku vyrob jako `v2/hook/<id>/mark.png`, průhledné PNG přes gpt_image.
  2. **Keyframy:** 6–8 kusů přes gpt_image_2_5. Reference: character sheet + fotka tabule (media `fab790a9-…`, viz `assets/coldopen/v2/higgsfield-jobs.json`) + style frame kafe (`133d6bca-…`).
  3. **Video:** Seedance 2.5 `omni_reference`, **multishot, 720p, 6 s, 16:9**. Prompt pišu podle šablony multishotu z tutoriálu (přesné časy v sekundách i framech, střídat typy kamer: ultra-wide, rozostřené popředí, makro, dutch angle, přes rameno; slow motion uprostřed, dopad normální rychlostí). Do promptu vždy napiš „No drone visible, no text, no captions, no speech bubbles“.
  4. **Střih:** normální záběry na 1,3×, slow motion nechat, vadné záběry vyhodit (předčasná skvrna, nápisy, dron). Upscale na 1080p. Zapiš do `assets/coldopen/v2/hook/index.json` (`cuts`, `sfx`, `lineAt`, `hold`, `postCut`). Pečení snímků: `scripts/hook-gag-frames.py --twos`.
  5. **Replika postavičky:** jen otázka s datem („<Dneška>… <měsíce>?“) hlasem **Efík** `LeAUiEe2DARUVrjI6jCU` (eleven_v4, `[confused, thinking out loud]`). Pauzu zkrať a celé zrychli tak, aby nepřekryla vypravěče.
  6. **Zvuk hooku:**
     - pískání a kroky;
     - švihy na střihy;
     - náraz nehody;
     - hudba ve 3 částech (slow motion přes low-pass);
     - **3 risery** (šum, tón, jemný), všechny vrcholí přesně na dopadu;
     - dopad: šplouchnutí/úder + sub + impact.
- **Schválení:** vyrenderuj nejdřív `--hook-only` a zkontroluj snímky kolem střihů (žádné duchy, žádný dron, značka sedí na dni).

### 5. Hlas vypravěče
- **Aura** `vHP4Az3ehXL47emKpHTK` (hluboký, zastřený, sebevědomý), eleven_v4, 2 verze. Vyber tu, ve které se nic nepřeřekne a je kratší.
- Scribe přepis → `node scripts/ingest-voice.mjs`. `"tempo": 1.15` v episode.json.

### 6. Motion grafika (laťka = lepší než #1)
- **Scény:**
  - `app` s tlačítkem Získat/Otevřít a „zdarma“;
  - `bigtype` pro hlavní slovo;
  - vysvětlovací scéna k pojmu: `phone` se swipem, nebo NOVÁ šablona, když se téma vysvětlí líp jinak (diagram, před/po, krok 1-2-3);
  - `fan`/`stack`/`iphone`/`words`/`particles`/`cta` podle obsahu;
  - vtip ve `words` s kickerem.
- **Kvalita:**
  - každá scéna má pohyb od začátku do konce;
  - každý text dopadá na slovo hlasu;
  - na šířku (16:9) nic není malé ani nalepené na okraji;
  - zkontroluj `--stills` všech scén a oprav, co vypadá levně, ještě před renderem.
- **Kamera:** `"camera"` v episode.json, klíče navázané na `cue`/`word`, `snap` na změny scén, zoom max 1,11, různé křivky (outExpo na dorazy, inOutSine na drift, outCubic na oddálení). Při vtipu skok blíž a klid.
- **Zvuk:** `"sfxExtra"` navázané na slova:
  - hudební podklad od otočky kostky;
  - **zastavení hudby na vtip** (`dj_brake`, `until`), risery přes vtip, `bass_drop` a hudba zpět na „jedem dál“;
  - Apple vrstva: `ui_swipe` + `ui_tap` na každou scénu, `ui_tick` na klíčová slova, `ui_softpop`, `ui_chime` na výzvu;
  - tematické foley ke slovům (foťák, klávesnice, notifikace…).

### 7. Render a kontrola
- `node scripts/render.mjs episodes/<id>` (na pozadí, ~50 min).
- Pak:
  - délka 38–45 s;
  - hlasitost −14 ±1 LUFS;
  - 12 kontrolních snímků přes celé video;
  - špičky hlasitosti kolem hooku a vtipu.
- Když něco nesedí ve zvuku nebo hlasu, oprav to bez nového renderu (`--mux-only`, `scripts/voice-conform.py`).

### 8. Popisek (hlasem uživatele)
- **První řádek ≤ 45 znaků**, nejúdernější: „AKTUALITA #N 🤖 …“.
- Text zhruba z 80 % bez diakritiky a **přesně 2 překlepy**. Tón kámoše podnikatele.
- **Struktura:** co to je → proč to podnikatele zajímá → „každej druhej den novinky z AI“ → výzva ke sdílení kamošovi.
- **5 hashtagů:** #claudeai #ai #instagramtips #podnikani + 1 tematický.

### 9. Thumbnail (cover)
- **Formát:** 9:16 1080×1920, všechno důležité ve středu 3:4 (y 240–1680). Pozadí `#0C0F14`.
- **Bílá karta** se zaoblenými rohy (874×1049 px, střed v 540×940): tag „AKTUALITA · <datum>“ se značkou gagu na čísle dne, „#N“, nadpis tématu (2 řádky, druhý modře), podtitul (od koho, zdarma), vizuál tématu, CTA.
- **Samolepka maskota** v dnešním gagu (gpt_image, prompt jako v tutoriálu, jen jiná nehoda). Bílý die-cut okraj, přesahuje pravý dolní roh karty do pozadí.
- **Postup:**
  1. HTML karta (`news-reel/assets/thumbnail/card.html` jako vzor);
  2. render Playwrightem;
  3. složit v Pythonu;
  4. nahrát do Canvy jako 3 vrstvy (`create-upload-url` → POST → `create-design` → `read-design open_transaction` → `edit-design`) a **commit**.
- Uživatel tuhle automatiku schválil, takže koncept v Canvě rovnou ulož.

### 10. Doručení (v 8:00)
- **Google Drive (pravidlo uživatele):** každý díl dostane vlastní složku v nadřazené složce **„EFEKTIVE Aktuality“** (id `1mg8yWVGh3Qp2lNcASiqcYfGXuNvrYw7V`).
  - Pojmenuj ji podle aktuality: **„Aktualita #N – <téma> (<D. M. RRRR>)“**. Příklad: „Aktualita #2 – ChatGPT ovládá PC (29. 10. 2026)“, id `15xaVGt9NrvfgaAjNEEcCE4VE9dlGCcmQ`.
  - Do složky VŽDY patří: **video (`reel_web.mp4`), thumbnail (`thumbnail_9x16.png`) a `popisek.txt`**, k tomu `brief.txt`.
  - **Texty** nahraj přes `create_file` (`textContent`, `disableConversionToGoogleType: true`).
  - **Video a thumbnail přes Drive konektor nejdou:** binární obsah by se musel poslat jako base64 přímo v parametru volání, a reel má ~36 MB.
  - **Cesta 1 (plně automatická):** zavolej `list_computer_folders`. Když tam je složka z Google Drive pro desktop (synchronizovaná složka „EFEKTIVE Aktuality“, musí to být kořen git repozitáře), připoj ji přes `request_computer_folder`. Pak tam zkopíruj podsložku dílu s videem, thumbnailem a popiskem; Drive ji sám nasynchronizuje.
  - **Cesta 2 (když cesta 1 není nastavená):** pošli video a thumbnail přes `SendUserFile` a v závěrečné zprávě napiš přesný název složky, kam je uživatel přetáhne.
- Commitni a pushni epizodu (bez `build/`).
- **Závěrečná zpráva** (česky, krátce):
  - téma a proč;
  - odkaz na složku na Drive;
  - odkaz na Canva cover;
  - popisek k vložení;
  - délka, LUFS, kredity.
- Když něco selže (kredity, fronta, render), pošli aspoň to, co je hotové, a napiš přesně, co chybí.

## Zpětná vazba k dílu #2 (platí od #3)
- **Začátek po hooku nesmí mít prodlevu.** V #2 visela intro scéna s ikonou appky přes celou větu „Čet GPT má nový model…“ (~5 s) a skoro nic se nehýbalo. Hned po kostce musí být „úplný mrdy“: každých 0,6–1,2 s nový pohyb nebo nový prvek, žádný prvek nestojí déle než ~1 s bez animace.
  - Intro rozděl na 2–3 beaty, každý na klíčové slovo: logo nebo ikona se postaví, číslo verze se protočí, tlačítko se ťukne, punch-in kamery, flash.
  - Na každý beat dej zvuk.
- **Prstenec částic (`particles`) v #3 NEPOUŽÍVEJ.** Uživatel si ho přál v #2, pro #3 chce místo něj novou motion grafiku. Obecně: co jednou zazářilo, v dalším dílu vyměň.
- **Celkově víc dynamiky:** kratší scény, víc střihů a punch-inů, flash přechody.
- **SFX napasuj přesněji.** Každý zvuk patří na snímek, kde se v obraze opravdu něco děje (dopad prvku, klik, flash), ne jen na slovo v hlase. Ověř to na stills nebo contact sheetu kolem každého zvuku a uprav `at`.

## Motion grafika se musí každým dílem zlepšovat (pravidlo uživatele)
- **Nikdy jen nevyměňuj texty v minulém dílu.** Vezmi předchozí díl jako základ a **změň aspoň 2 grafiky**: úplně nová šablona (3D objekt, scéna na míru tématu), nebo výrazně jiný layout (vějíř → věž nad sebou; telefon vpravo → vlevo / uprostřed). Změny se sčítají, takže #3 má změny z #2 a k tomu další 2 nové.
- **Struktura scénáře zůstává** (je vymazlená), mění se jen to, JAK se věci ukazují.
- **Myšlenkový proces u každého dílu:**
  1. Přečti `news-reel/docs/motion-evolution.md` (co bylo minule).
  2. Přečti si reference v `news-reel/docs/motion-reference.md` + `docs/ref/`.
  3. Vymysli k tématu aspoň 2 nové / přestavěné grafiky.
  4. Postav je jako šablony v `engine/scenes-pro.js` (ověř na stills).
  5. Připiš řádek do `motion-evolution.md`.
- **3D objekty jsou vítané**, např. `globe` (text obíhá kolem tečkové koule, která přiletí z hloubky). Uživateli se líbí prstenec částic (`particles`), takže dělej jeho varianty.
- **Flash přechody:** `transition: "flash"` aspoň 2× za video. Expozice nahoru, 2 snímky bílá, bloom/glow a nová scéna se vynoří ze světla. Zvuk: swell + impact z Drivu.
- **SFX knihovna na Drivu:** složka **„SFX AI final“** (`1_ov-XY7iJkn3LAjMd5ohhzJZuouVsdKn`, ~10 000 zvuků v kategoriích: whoosh, riser, impact, beep, transition, …).
  1. Hledej `search_files` (`title contains 'riser'` apod., `owner = 'me'`, `mimeType contains 'audio'`).
  2. Stáhni `download_file_content`. Výsledek se uloží do souboru v tool-results jako JSON s base64 `content`.
  3. Dekóduj ho Pythonem do `news-reel/assets/sfx/drive/<název>.wav`. Engine ho najde podle jména.
  4. Každý díl přidej aspoň pár nových zvuků z Drivu.

## Co se naučilo (nepřekračovat)
- **Render pouštěj odpojeně** (`setsid nohup … &`) a průběžně commituj. Restart workeru zabije proces na pozadí a render pak musí začít znovu. Celé video (~1000 snímků) trvá ~40 min.
- **ElevenLabs workspace se 28. 10. 2026 změnil** (konektor teď míří na jiný workspace). Staré ID hlasů nefungují, platné jsou Aura `vHP4Az3ehXL47emKpHTK` a Efík `LeAUiEe2DARUVrjI6jCU` (znovu navržené se stejným popisem).
- **Barva gagu nesmí připomínat krev.** Červená barva s kapkami na kalendáři vypadá jako krev, proto dej barvu v brandu (modrá #2f6bed).
- **Scénu na míru tématu postav jako novou šablonu**, když se hodí lépe než existující. Příklad je `desktop` z dílu #2: computer use, sken obrazovky, kurzor po křivkách, klik, psaní a odeslání.
- Dron nikdy v záběru.
- Postavička nikdy nelevituje s mobilem.
- Žádný papír „novinka ze X“.
- Hook skončí přesně na dni novinky, „Ne! Na …ku ne!“ se nedává, jen otázka s datem.
- Šepot/ASMR vypravěč ne. Provokativní pištivý vypravěč (Efík) ne. Efík je jen hlas postavičky.
- Cover nikdy nahrávat jako 3:4. Vždy 9:16 s obsahem ve středu 3:4.
- Uživatelovu složku se zvuky v počítači cloud nevidí. Zvuky ber z `assets/sfx/` nebo je vygeneruj v ElevenLabs.

---

# ČÁST B: Engine (efektive-aktuality)

> Technický engine série EFEKTIVE AKTUALITY – video 16:9 (1920×1080, 24 fps): hook s maskotem ve stylu Spider-Verse (gag na tabuli s kalendářem, Seedance multishot) → 3D kostka → motion grafika v brandu EFEKTIVE (Inter, chladně bílá, grafit, modrá + zelená) synchronizovaná na slova, hlas vypravěče Aura (ElevenLabs eleven_v4), hlas postavičky Efík, sound design navázaný na slova, kamerové pohyby jako post-pass, postCut, cover. Použij při ruční výrobě nebo úpravě dílu („udělej reel / aktualitu“, vložený brief „Novinka ze … / Co se změnilo / Pro klienty / Vyzkoušet“); plně automatický díl od researche řídí skill efektive-aktuality-auto.

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

---

# Příloha 1: Vývoj motion grafiky po dílech

_(soubor `news-reel/docs/motion-evolution.md`)_


Pravidlo: každý díl vezme předchozí díl jako základ a **změní aspoň 2 grafiky**:
- buď úplně novou šablonou (nový 3D objekt, nová scéna na míru tématu),
- nebo výrazně jiným layoutem té samé myšlenky (např. vějíř → věž nad sebou, telefon vpravo → vlevo / uprostřed).

Změny se sčítají, takže každý díl vypadá jinak než ten předchozí. Struktura scénáře zůstává (intro s appkou, úder, „pro ty pomalejší“, výčet, kde to najdeš, vtip, pro klienty, vyzkoušej). Mění se jen to, JAK se to ukazuje. Po každém dílu sem připiš řádek.

| díl | téma | intro | úder | vysvětlení | výčet | kde to najdeš | vtip | pro klienty | CTA | přechody | nové ve skillu |
|---|---|---|---|---|---|---|---|---|---|---|---|
| #1 | Instagram Edits karusely | `app` + App Store tlačítko | `bigtype` | `phone` (karusel swipe, telefon vlevo) | `fan` (vějíř 4 karet) + `stack` | `iphone` vpravo | `words` + DJ brake | `particles` (prstenec teček, „to se líbí“) + `words` | `cta` | strobe, whip, blur, streak, invert | — |
| #2 | GPT-6.1 Terra (computer use) | `app` + tlačítko Spustit | `bigtype` | **`desktop`** NOVÉ: okno appky, sken obrazovky, AI kurzor po křivkách, klik, psaní, odeslání | **`tower`** NOVÉ: 3D izometrické vrstvy padají na sebe | `iphone` **vlevo** (zrcadlené natočení) | `words` ×2 (callback na kafe) | `particles` + **`globe`** NOVÉ: 3D tečková koule přiletí z hloubky, kolem ní obíhá text | `cta` | **`flash`** NOVÉ (expozice nahoru, bílá, bloom) ×3 | `desktop`, `tower`, `globe`, `flash`, SFX z Drivu |

### Zásobník nápadů na další díly (vyber aspoň 2 a/nebo vymysli vlastní k tématu)
- `particles` (prstenec): **v #3 nepoužívat** (pokyn uživatele), nahradit novou grafikou. Později případně jen výrazná varianta.
- Text po obvodu 3D objektu (koule hotová). Dál válec, prstenec, kostka s textem na stěnách.
- Telefon / okno: střídat pozici (vlevo / vpravo / uprostřed zepředu / ze shora na stole), nikdy dvakrát stejně za sebou.
- Výčet: věž (hotová), mřížka dlaždic, které se otočí (flip), karusel na kruhu (coverflow), seznam s checkboxy, odpočet.
- Úder: `bigtype` střídat s kinetickým slovem přes celou obrazovku, masked reveal přes obrázek, slovo složené z částic.
- Přechody: `flash` aspoň 2× za video (s Drive SFX), mezi tím whip/strobe/streak/invert.

### Zpětná vazba k #2
- Intro po hooku moc dlouhé a statické (~5 s jedna ikona). Od #3 rozdělit na 2–3 rychlé beaty se zvukem.
- V #3 vyměnit `particles` za novou grafiku; celkově víc dynamiky a přesnější SFX.
- Výslovnost: „AI“ se četlo „ej aj“. Musí být „á í“ (viz `vyslovnost.md`).

---

# Příloha 2: Slovník výslovnosti

_(soubor `news-reel/docs/vyslovnost.md`)_


Pravidlo uživatele: **všechno se říká česky.** Zkratky se čtou česky po písmenech, anglická slova česky foneticky. Hlas čte, co je napsané, takže do `prompt` pro TTS se píše přepis, NIKDY anglický originál ani velká zkratka.

| na obrazovce | do scénáře (TTS) | poznámka |
|---|---|---|
| AI | **á í** | NIKDY „ej aj“ (chyba v #1 i #2) |
| ChatGPT | čet gé pé té | GPT česky po písmenech |
| GPT-6.1 | gé pé té šest celá jedna | |
| OpenAI | oupn á í | AI i tady česky |
| API | á pé í | |
| Claude | klód | |
| Gemini | džemini | |
| Google | gúgl | |
| iPhone | ajfoun | |
| Android | android | |
| Instagram | instagram | |
| Edits | edits | |
| app / appka | apka | |
| carousel | karusel | |
| Work (režim) | vork | |
| Codex | kodex | |
| Plus / Pro | plus / pro | |
| e-mail / mail | mejl | |
| update | apdejt | |
| prompt | prompt | |
| agent | agent | |
| computer use | ovládání počítače | radši česky přeložit |
| feature | funkce | přeložit |

**Postup před každým TTS:**
1. Projdi skript a najdi každé slovo psané latinkou, které není česky, a každou zkratku z VELKÝCH písmen (regex `\b[A-Z]{2,}\b` a anglická slova).
2. Nahraď je podle tabulky. Co v tabulce chybí, přepiš česky (zkratky po písmenech česky: á, bé, cé, dé, é, ef, gé, há, í, jé, ká, el, em, en, ó, pé, kvé, er, es, té, ú, vé, iks, ypsilon, zet) a doplň do tabulky.
3. Po vygenerování zkontroluj v přepisu ze Scribe, že tam není „ej aj“, „ej pí aj“ apod.

---

# Příloha 3: Rozbor referenčních reelů

_(soubor `news-reel/docs/motion-reference.md`)_


Tři reference od uživatele (snímky v `docs/ref/`; `*-sheet` = 2 sn./s celé video, ostatní = 10 sn./s detail s časovým kódem):

| # | video | délka | styl |
|---|---|---|---|
| v1 | „Imagine building anything… Widgets“ (dnyxstudios) | 16 s | Apple keynote: bílá/černá, malé písmo, widgety |
| v2 | „sleeko / HowDo“ promo | 48 s | UI v rámečku s fialovým gradientem, záložky kapitol |
| v3 | „These days… Everywhere… Work. Organised.“ (Notion) | 24 s | světle šedé pozadí, 3D ikony, modrá spojnice, pastelové karty |

### 1. Co mají společné (to, co dělá „After Effects“ dojem)

1. **Rytmus střihů 0,8–1,5 s.** Každý obraz = jedna myšlenka. Nic nevisí; jakmile je sdělení přečtené, už se to hýbe dál.
2. **Útok rychle, dojezd dlouze.** Příchody trvají 0,25–0,4 s do ~90 % a pak se 0,3–0,6 s jemně „dopékají“. Odměřeno: „These days“ (v3 0,1→0,5 s) z rozmazání do ostrosti, karty ve v3 (1,2→1,6 s) z −100 % na místo, 80 % dráhy za první třetinu času. Odpovídá křivce **`cubic-bezier(0.05, 0.7, 0.1, 1)`** → v enginu `snapOut`. Pro klidnější pohyby `brandOut = (0.16, 1, 0.3, 1)`.
3. **Odchody jsou krátké a „whip“.** 0,12–0,25 s se zrychlením (ease-in-expo), s velkým směrovým rozmazáním. Nikdy dlouhý fade-out.
4. **Rozmazání = pohyb i hloubka.** Všechno rychlé má motion blur (v1 widgety létající na černé, v3 telefon při rotaci). Statické věci v pozadí mají hloubkovou neostrost. → engine: sub-frame motion blur (4×) + `filter: blur()` podle rychlosti a hloubky.
5. **Text je malý a čistý.** Ve v1/v2 zabírá text jen ~3–4 % výšky, regular/medium řez, hodně vzduchu kolem. Velký text (v3 „Everywhere“, „progress slows“) jen jako úder, a hned odjede. Žádné verzálky v hlavním textu.
6. **Slova přicházejí po jednom, na hlas.** Každé slovo: rozmazané → ostré, posun 20–40 px ve směru čtení, nové slovo je chvíli **tónované akcentem** (světle modrá / fialová) a během ~0,3 s „ztmavne“ do inkoustu (v1 „it's *there*“, v2 „Every day, *there's*“). Řádek se **průběžně centruje**, jak slova přibývají (v1 „Imagine building anything“).
7. **Match cut / morph.** Konec jednoho obrazu = začátek dalšího na stejném místě: text se rozmaže a na jeho místě se z rozmazání vynoří objekt (v3 0,6–0,8 s „These days“ → ikona Find My), objekt se přiblíží a kamera jím **proletí** do další scény (Find My → mapa). To samé dělá náš kalendářový hook.
8. **Kamera se pořád hýbe.** Pomalé dojíždění, drift, sledování spojnice (v3), orbit (v2). Nikdy úplně statický záběr.
9. **Barva drží jednotu.** v3: světle šedé pozadí + jedna modrá spojnice + pastelové tóny karet. v2: bílá „obrazovka“ + fialové mlhy. Max 2 akcenty.
10. **Zvuk**: každý pohyb má svůj whoosh/pop/click, dopady sedí na snímek.

### 2. Katalog technik (a kde jsou v enginu)

| technika | reference | jak funguje | engine |
|---|---|---|---|
| Kinetická věta | v1 0–1 s, 7–9 s; v2 6–9 s | slova po jednom, blur 14→0 px, x +40→0, scale 1,06→1, barva akcent→inkoust, šířka slova 0→plná ⇒ řádek se centruje | šablona `words`, helpery `kineticWords/animateWords` |
| Inline UI v textu | v1 1–2,5 s | „Imagine [pole s promptem] anything“ – pilulka se roztáhne mezi slovy a sama se do ní píše, kurzor bliká, tlačítko odeslat pulzne | šablona `prompt` |
| Stoh karet | v3 13,7–15,3 s | pastelové karty (červená/modrá/zelená výplň + ikona v barvě) vjíždějí zleva s velkým motion blurem po ~0,25–0,4 s, stoh se drží opticky na středu; nakonec se celé zmenší a nad ním dopadne nadpis („Work together“) | šablona `stack` |
| Spojnice ikon | v3 3–9 s | modrá linka (6–7 px, kulaté konce, jemný stín) se kreslí od ikony k ikoně, na čele kolečko; kamera jede za čelem linky; ikony vyskočí s malým překmitem (~3 %) když k nim linka dojede | šablona `connect` |
| Prolétnutí přes objekt | v3 1,0–1,4 s; náš hook | přiblížení do objektu, jeho obsah se stane další scénou; volitelně 1 snímek glitch/chroma | `transition: "zoom"`, hook |
| Flicker → vějíř | v1 9,4–10,2 s | jedna karta na místě rychle přepíná varianty (0,1 s/variantu, s lehkým rozmazáním), pak se všechny rozevřou do překrývající se řady | šablona `fan` |
| Orbit / koláž | v2 11–13 s | karty a ikony na elipse kolem textu, pomalu rotují; vzadu menší + rozmazané, vpředu větší + ostré; přilétají z dálky | šablona `orbit` |
| Rozptýlené ikony kolem slova | v2 6–9 s | drobné ikony kolem slova se přeskupují a vyměňují | `custom` (orbit s malými ikonami) |
| Konstrukční čáry | v2 22 s („S im pl e“) | písmena rozestoupená, kolem vodicí linky a kotevní body, pak se slijí do loga | `custom` – návrh v sekci 4 |
| Odhalení loga maskou | v2 24–25 s; v1 konec | značka (kolečko) se objeví, písmena vyjedou zpoza ní | outro |
| Velký úderný text + whip | v3 16–18 s | text se zvětšuje (push-in), pak odjede doleva s horizontálním blur | `transition: "whip"` |
| 3D telefon | v3 18–21 s, v1 13–15 s | telefon s lehkým natočením, rotace kolem Y, aplikace kolem | šablona `phone` (3D náklon) |
| Kapitoly | v2 celé | spodní záložky Intro / Problem / Use Case / CTA, aktivní se plní | HUD: počítadlo `01 · 06` + progress linka |

### 3. Typografie a materiály (přeloženo do brandu EFEKTIVE)
- Reference: SF Pro / Inter regular–medium pro větu, bold/heavy jen pro úderná slova. U nás: **Inter** (věta 700, úder 800), akcent modrá `#2f6bed`, tónování nových slov světlou modrou `#5b8cf5`.
- Karty: velký radius (40–48 px na 1080 šířku), pastelová výplň **nebo** bílá s jemnou linkou, stín široký a měkký (`0 30px 60px -30px`), žádné tvrdé obrysy.
- Pozadí: světlé, s velmi jemnými barevnými mlhami a vinětou, nikdy čistě bílá plocha bez života.
- Ikony: jednoduché linkové (stroke 2,6–3 px) nebo „app tile“ s bílým čtvercem a barevnou ikonou.

### 4. Pravidla pro skládání epizody
1. Střídej typy: `words` → vizuál (`stack`/`connect`/`fan`/`phone`) → `words` → … Dvě textové scény za sebou jen když je druhá úderná (`size: "xl"`).
2. Přechody: default `push`; `whip` při změně tématu nebo zrychlení; `zoom` když scéna „vstupuje dovnitř“ věci; `blur` pro klidné navázání. Max 1× `zoom` na video.
3. Každý prvek, který vyjede, musí mít v řeči slovo, na které vyjede (`at`).
4. Na konci každé scény ještě ~0,2 s klidu, pak odchod (engine to dělá sám).
5. Konstrukční čáry / rozptýlené ikony / glitch řeš přes `custom` scénu a když se osvědčí, přesuň ji do `scenes-pro.js`.

### 5. Reference v4 – „Claude motion reel“ (udělaný přes Claude Code)
Snímky: `docs/ref/v4-*.jpg`. 14 s, natočeno z obrazovky notebooku. Je to sled krátkých „showreel“ obrazů, každý 0,8–1,5 s, mezi nimi tvrdé střihy a barevné záblesky.

| čas | co se děje | proč to funguje | engine |
|---|---|---|---|
| 0,0–1,4 | tmavý rastr teček, jiskra proletí a natáhne se do světelné linky | „probuzení“ obrazu jedním světelným bodem | `transition: "streak"` |
| 1,4–3,0 | bílý záblesk → plná oranžová, obří zúžený nápis CLAUDE. + drobné popisky (SHOWREEL — 2026) | kontrast měřítek: obří slovo × mikro text | šablona `bigtype` |
| 3,2–4,8 | 3D vlna z kostiček v gradientu, skleněná koule obíhá | procedurální 3D pole = „wow“ bez obsahu | (mimo brand – nepoužito) |
| 5,0–5,4 | EVERY na bílé → SINGLE opakované v řádcích (obrysový vzor) | typografie jako tapeta | `bigtype` (vzor řádků na pozadí) |
| 5,5–6,0 | barevný stroboskop: modrá → fialová → oranžová → bílá, 1 snímek každá | rytmický střih bez pohybu | `transition: "strobe"` |
| 6,0–7,6 | +312 % – číslice se točí jako tachometr (s rozmazáním), roste graf, kroužek | čísla „žijí“ | šablona `metric` (jen se skutečnými čísly!) |
| 8,0–10,0 | tisíce čárek proudí, slijí se do prstence teček, prstenec exploduje paprsky | částice = energie, přechod do další scény | šablona `particles` |
| 10,0–11,0 | UI karta „Render queue“ na modré | produkt v kontextu | `stack` / `phone` |
| 11,0–12,6 | obrys kruhu s tečkami se morfuje do hvězdy/kytky | organický morf | (custom) |
| 13,0–14,0 | tmavé logo s jiskrou | podpis | outro |

**Poučení:** (1) každý obraz má jednu silnou kompoziční myšlenku (obří slovo, číslo, prstenec), (2) střídání barevných ploch je samo o sobě rytmus, (3) mikro popisky v rozích (mono/verzálky) dávají „editorial“ rám, (4) žádné dva texty přes sebe – nový text přijde až na čistou plochu.

### 6. Reference v5 – „tabule“ (InVideo MCP reel) → nový hook `board`
Snímky: `docs/ref/v5-hook.jpg` (8 sn./s), `docs/ref/v5-frames.jpg` (plné rozlišení).

**Proč první 3 sekundy fungují:**
- **Skutečné prostředí místo grafiky:** zelená školní tabule (křídový prach, rozmazané stopy po houbě), vlevo dřevěná stěna, tabule v tmavém dřevěném rámu. Na tabuli polaroidy s červenými špendlíky a ohnutým rohem, ručně psané popisky.
- **Světlo:** teplé slunce přes žaluzie = šikmé zlaté pruhy přes celou scénu, teplé ladění (soft-light oranžová), silná viněta, zrno, plovoucí prach ve světle, světelný „leak“.
- **Kamera:** 0–0,9 s rychlý švih po stěně na tabuli (počáteční natočení ~30°, rozjezd prudký, dojezd měkký), **směrové rozmazání pohybu** jen ve směru jízdy (dlouhá závěrka ~180–360°). Pak zrychlující najetí, **střih uprostřed nájezdu** na bližší záběr a krátké dojetí. Celou dobu jemné „z ruky“ chvění.
- **Typo:** čisté bílé písmo + jedno ručně psané křídové slovo, drobné křídové poznámky po tabuli.

**Náš hook `board` (engine/hook-board.js):** švih ze dřeva na tabuli → malý odtrhávací kalendář připíchnutý na tabuli → zrychlující najetí → střih blíž + dojezd → dnešní datum přeškrtne červená fixa (dva tahy) → zavane vítr a listy se přetočí (ohnou se ke kameře přes vazbu a odletí) až na datum novinky → zakroužkování fixou + křídou „novinka!“ se šipkou → průlet do čísla → teplý záblesk → čistá motion grafika.
Zvuky: `camera_whip`, `wind_gust`, `marker_scratch`, `page_flutter` (+ swish, impact, dive, shimmer).
Volba hooku: `"hook": "board"` (výchozí) nebo `"hook": "calendar"` (iOS kalendář) v `episode.json`, globálně `config.series.hook`.

#### 6b. Poučení z prvního pokusu (CSS tabule = „AI-kové, laciné“)
- Prostředí z CSS gradientů a šumu nikdy nevypadá skutečně → **fotografické podklady** (Higgsfield 4K) a my jen kompozitujeme objekty, které musí být přesné (kalendář s daty).
- Kompozit musí převzít světlo scény: přes papír se násobí (multiply) jas podkladu + soft-light barva podkladu → pruhy světla a stín z fotky leží i na kalendáři.
- Formát 16:9, **24 fps a 180° závěrka** (6 dílčích snímků) – rozmazání pohybu je pak filmové, ne digitální.
- Opar/halace: rozmazaná kopie podkladu přes sebe v režimu screen + zvednuté černé + světelný leak + těžká viněta + zrno.
- Pohyb „jako kameraman“: švih s ~2 % přejetím a dorovnáním, zrychlující dolly, střih uprostřed nájezdu, ruka = několik nesouměřitelných nízkých frekvencí (ne čistý sinus).

#### 6c. Hook v3 (zpětná vazba k v8)
- Kamera na začátku: plynulý **pojezd** podél zdi (translace + lehký push, křivka bezier(.38,0,.12,1)), žádné natáčení rotateY – to působilo „nakřivo“.
- Zblízka musí mít kalendář stejnou texturu jako zdálky → jedna fotka, jedna kamera, papír z fotky papíru + světlo z podkladu, rozlišení canvasu 2,2× (ostré i při zoomu 2×).
- Odtrhávané listy působily nerealisticky → skutečný měsíční kalendář, jen zakroužkování data.
- Vítr: listy papíru se ohýbají (řetěz 3D proužků), lehčí papír víc, kalendář nejmíň; náraz větru putuje od okna.
- Rozostřené listí v popředí (předrozmazané sprity, paralaxa 1,8–2,3× kamery) = hloubka ostrosti f/1.8.
- Přechod do grafiky přes papír: ponoření do papíru → bílá → grafika „roste“ dál (scale 0.86→1) na jemné textuře papíru.
- V grafice 1× 3D iPhone (Apple styl, psaní na displeji) a 1× `invert` záblesk v půlce videa.
