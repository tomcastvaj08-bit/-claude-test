---
name: efektive-3d-tutorial
description: Výroba vysvětlovacích tutoriálů ve stylu EFEKTIVE („Aktualita #1 – celý postup“, „Domča“, „Výměna postavy“) – jedno obří 3D plátno (myšlenková mapa, kapitoly na spirále), kamera jako v After Effects, motion grafika naskakující přesně na slova, hlas z ElevenLabs (klon Maty), hudba a zvuky, render 1920×1080/30 fps přes HTML/CSS engine + Playwright, plus thumbnail 16:9, Instagram cover 9:16, storky (např. oznámení Patreon za 129 Kč) a generická pozadí bez textu ve stejném stylu. Použij vždy, když Teecee/EFEKTIVE chce tutoriál, Patreon video, vysvětlovačku „jak jsem udělal X“, video postupu z podkladů (PODKLADY.html, videa, prompty), náhledovku/thumbnail k tutoriálu, Instagram storku nebo pozadí v EFEKTIVE stylu nebo „stejný tutoriál jako minule“ – i když neřekne slovo skill, plátno ani motion grafika.
---

# EFEKTIVE 3D tutoriál (plátno + kamera + hlas)

Nejsou to slidy. Je to **jedno obří plátno**, po kterém letí kamera, a všechno, co hlas řekne, se na plátně objeví přesně ve chvíli, kdy to zazní.
Hotové vzory: Aktualita #1 (34,5 min, 19 kapitol), „Jak jsem se proměnil v Domču“ (6:05, 9 kapitol), „Výměna postavy ve videu“ (7:40, 9 kapitol, videa na výšku).

## Nový chat: skill přišel jako soubor `.skill` (drag & drop)

Soubor `efektive-3d-tutorial.skill` je obyčejný ZIP s celým balíkem: tento návod, `references/`, `scripts/new_project.py` a `template/` (engine, nástroje, šablony covers). Když ho uživatel přetáhne do chatu:

1. Rozbal: `mkdir -p ~/skills && cd ~/skills && unzip -o <cesta>/efektive-3d-tutorial.skill` → `~/skills/efektive-3d-tutorial/` (= `<skill>` níže). Pokud běžíš v repu, můžeš ho dát do `.claude/skills/`, ať se načte i příště.
2. Přečti tento SKILL.md celý, pak podle úkolu `references/pipeline.md` (cloud setup: `pip install playwright==<verze předinstalovaného chromia>`, ffmpeg, faster-whisper) a `references/covers.md`.
3. Nový projekt: `python <skill>/scripts/new_project.py "<cesta>" --slug Nazev --empty` a jeď podle **Postupu**. Vzorové hotové tutoriály jsou v `references/examples/` (Aktualita #1, Domča – hlas ze tří částí, Výměna postavy – videa na výšku).
4. Potřebné konektory: **ElevenLabs** (hlas Maty), volitelně **Higgsfield** (upscale fotek, fiktivní postava). Bez ElevenLabs hlas nevyrobíš – řekni to jednou a pokračuj vším ostatním.

## Jak uživatel pracuje (čti první)

- **Chce hotovou věc, ne otázky.** Pošle podklady (často `PODKLADY.html` s vloženými fotkami/videi a prompty doslova, nebo diktovaný popis + videa) a řekne „udělej to“. Ptej se **jednou, hromadně a jen na to, co blokuje** (chybějící prompt, video). Jakmile řekne „dělej / už se neptej / jdu spát, ráno ať je to ready“, jeď až do konce včetně hlasu (TTS) a renderu.
- **Kredity:** odhad TTS řekni jednou v přehledu (~1 kredit/znak; 6 min ≈ 4 800 kreditů). Výslovné „udělej to / Maty je v pohodě“ = souhlas.
- **Píše hovorově, často z telefonu, s diktovanými překlepy.** „Genjitsu“ = Higgsfield **Genjutsu**, „11 Labs“ = ElevenLabs, „Seedens“ = Seedance.
- **Výsledek do telefonu:** soubor nad ~100 MB z chatu neuloží → vždy kompaktní 1080p (~10 MB/min) + odkaz ke stažení (viz Předání).
- **Hudba ho nezajímá** („ser na hudbu“) – stačí tichý podkres, hlavní je obraz a hlas.

## Co se nemění (kostra)

- **Plátno:** uprostřed hub (`k00`), kapitoly na eliptické spirále ven, obří štítky roadmapy, tečkovaná cesta, rozostřená galerie náhledů a koule do hloubky. Řeší `timeline/k-layout.js` – needituj per projekt.
- **Úvod:** výsledek hraje na plátně **bez zvuku** a hlas přes něj rovnou představuje, o čem dnešek je („Zdarec bojs, dneska tu máme…“) → hub → štítky na slova → odjezd na celou mapu → „Jdeme na to“. **Žádné úvodní přehrání videa jen s hudbou/původním zvukem.** Nastavení `project.json` → `"intro": {"src": "final", "a": 0, "b": 10}`.
- **Kapitola:** přelet kamery (whip) → karta kroku → obsah navázaný na slova (callouty, prompty, čísla, přehrávače, porovnání originál vs. výsledek) → kamera na každou novou věc.
- **Outro:** shrnutí → odjezd na celou mapu → obří karta „Díky. efektive.cz“. Konec hlasu typicky „Zatím čus“.
- **HUD:** štítek kapitoly vlevo nahoře, „krok 03 / 08“ vpravo, `efektive.cz` vlevo dole, progress. **Nic vpravo dole** (`"foot": ""`; „patreon · teecee“ tam nechce – oprava = přerender celého videa).
- **Design:** Geist + Geist Mono, papír #F4F6F9 s modrou mřížkou, ink #0A0D14, modrá #1F4DFF, zelená #13B97A, gradient modrá→zelená (`references/design.md`).
- **Hlas:** 1. osoba (mluví Teecee), v klidu, hovorově česky (-ej, -ý), bez přehajpované energie; zrychlený 1,1×. Default klon **Maty `CAA06AyScaqhkbiFnTQ9`** (autorův vlastní klon v účtu konektoru není). Anglické termíny foneticky (`tools/pron.py`), prompty na plátně anglicky doslova.
- **Zvuk:** podkres po kapitolách (ducking pod hlasem), whoosh/swish/klik/swell+boom. Master −14 LUFS / −1 dBTP.
- **Výstup:** `<slug>_MASTER.mp4` (crf 15), `<slug>_WEB.mp4` (crf 20), `<slug>_1080p.mp4` (crf 26, do telefonu).

## Zásady kvality (od uživatele, porušení = „lagy a chybky“)

- **Nic nevymýšlej.** Každý prompt, číslo, cena, nastavení a chyba z podkladů. Co tam není (např. cena Genjutsu), vynech, nedoplňuj odhadem. Prompty na plátně doslova.
- **Žádné prázdné ani statické úseky.** Kamera přijíždí na slovo, kdy obsah naskočí (`AT(cue, 'slovo')`), ne na začátek dlouhého odstavce s prázdnem. Nikdy víc než ~4 s bez změny.
- **Žádné překryvy.** Přehrávače a obrázky od sebe; u videí na výšku (9:16) je přehrávač `w 900` vysoký 1600. Porovnání originál vs. výsledek vedle sebe, další prvek až pod ně s odstupem.
- **Videa plynule:** snímky z videí v 30 fps (`media.py` default) jako render.
- **Kontroluj, než renderuješ:** `python tools/qa.py --every 3` (cue + každé 3 s) a projdi všechny archy.
- **Skutečná osoba ve videu** (face/voice swap): výsledek označ štítkem „AI“; o souhlasu té osoby se zmiň jednou, nemoralizuj, nevkládej do videa urážky.

## Postup

Příkazy z kořene projektu (kromě `build.py` – ten z `tools/`). Podrobnosti, cloud setup a ElevenLabs volání: `references/pipeline.md`.

1. **Podklady.** `PODKLADY.html` má média jako base64 – vytáhni je skriptem (`references/pipeline.md` → „Podklady z HTML“) a urči podle okolního textu, co je originál / pokus 1 / pokus 2 / reference. Videa i fotky si prohlédni (kontaktní archy přes ffmpeg).
2. **Projekt:** `python <skill>/scripts/new_project.py "<cesta>" --slug Nazev --empty` (nebo s ukázkovými k00–k02). Velká média, `build/`, `out/`, fotky skutečných lidí a `podklady/*.html` patří do `.gitignore`.
3. **Média:** `python tools/media.py <jméno> <video>` (30 fps, `--width 720` u videí na výšku). Výsledek nastav jako `"intro"`. Vložka s původním zvukem jen uprostřed, když je zvuk podstatný (`"inserts": {"k07.exp": {"after": true, "src": "final", "a": 4.6, "b": 8.4, "pad": 0.5}}`). Fotky do `assets/img/`.
4. **Scénář** `scenar.md`: `## K03 · Krok 2: Název`, odstavec = řádek, `{#cue}` před větou, `> VIZ:` poznámky. Osvědčená struktura postupu: úvod → cíl a postup → kroky v pořadí, jak to reálně šlo (prompt → výsledek → co je špatně → proč) → pravidla (6–10 bodů) → konec. Tempo ~14,6 znaku/s. Názvy nástrojů ve scénáři správně (Genjutsu, ElevenLabs), fonetiku řeší `pron.py`.
5. **Odhad délky:** `cd tools && python build.py`. 6–8 min je pro jeden postup akorát.
6. **Timeline** `timeline/kNN.js` (API `references/engine-api.md`, vzory `references/examples/`). Dlouhé prompty: zalom na ~66 znaků, zvýrazňuj po odstavcích (`fx` s `until`), kamera sjíždí po blocích. `python tools/events.py` (žádné `AT miss`) + `python tools/qa.py kNN --every 3`.
7. **Hlas:** `python tools/blocks.py` (fonetika + velká písmena na začátku vět) → zkontroluj `build/blocks/*.txt` → `creative_create_flow` + `creative_generate_speech` pro každý blok (`eleven_v4`, voice Maty, `generations_count: 1`, všechny naráz – při limitu se samy zařadí) → `creative_get_flow_run_status` → URL do `build/dl.txt` → `python tools/fetch_vo.py build/dl.txt`. URL platí 2 h.
8. **Časy slov:** `python tools/align.py` (v cloudu `--device cpu`, large-v3 ~10–12 min na 6–8 min hlasu) → build → events → QA.
9. **Zbytek jedním příkazem na pozadí:** `bash tools/run_all.sh 3` (render → mix → bed → master → kompaktní 1080p). Render v cloudu ~2 fps/proces, 3 procesy → 8 min videa ≈ 60 min. Po restartu kontejneru stačí spustit znovu.
10. **Kontrola výsledku:** vzorky snímků (`ffmpeg select … tile`), hlasitost (`loudnorm` summary), poslední snímek (závěrečná karta). Vadný úsek: přejmenuj `out/chunks/c00N.mp4`, `build.py` (až nic neběží), znovu `run_all.sh`.
11. **Předání:** `<slug>_1080p.mp4` přes SendUserFile **a** odkaz ke stažení: soubor (< 100 MB) commitni na samostatnou větev `tutorial-video` (jen videa, ne hlavní větev) a pošli `https://github.com/<owner>/<repo>/raw/tutorial-video/<soubor>`. Projekt (scénář, timeline, tools) commitni a pushni na pracovní větev.
12. **Náhledovky a Instagram** (na požádání): `references/covers.md` – thumbnail 16:9 (YouTube/Patreon), IG cover 9:16, storky (`--slides 1,2,3 --story`) a pozadí bez textu ze šablon v `covers/`. „Storka“ = jen 9:16, ne post.

## Když něco nejde

`references/gotchas.md` – rozmazaný text, bílé díry, uzly mimo střed, zaseklý render, paměť, AT miss, Whisper, paralelní Chromium, **přerostlé přehrávače videí na výšku**, prázdné záběry, cloud omezení. Než něco „opravíš“ v enginu, přečti ji.

## Soubory

- `template/` – kostra projektu (engine, tools vč. `run_all.sh`, `synth_lib.py`, `cover.py`, k-layout, k00 s němým intrem, covers/ (thumb, cover, story, pozadí), scénář, project.json). Kopíruje ji `scripts/new_project.py`.
- `references/engine-api.md` – uzly, widgety, kamera, `T`/`AT`, `L` helpery, recepty.
- `references/pipeline.md` – příkazy, cloud setup, podklady z HTML, ElevenLabs, časy a ceny.
- `references/design.md` – design tokeny, CSS třídy, hustota a tempo.
- `references/covers.md` – thumbnail 16:9, IG cover 9:16, storky, pozadí, pasti (useknutý gradientový text, bezpečná zóna).
- `references/gotchas.md` – chyby a jejich řešení.
- `references/examples/` – reálné kapitoly a scénáře: Aktualita #1, Domča (k06 hlas ze tří částí), Výměna postavy (k00–k08, videa na výšku).
