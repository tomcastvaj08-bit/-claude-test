# Pipeline: od podkladů k MP4

Obsah: závislosti · struktura projektu · 1 média · 2 scénář a odhad · 3 hlas (ElevenLabs) · 4 zarovnání · 5 QA · 6 render · 7 zvuk · 8 předání · časy a ceny

## Závislosti (na Tomášově PC už jsou)

Python 3.12 + `playwright` (Chromium), `numpy`, `Pillow`, `faster-whisper` (+ pip `nvidia-cublas-cu12`, `nvidia-cudnn-cu12` pro GPU), ffmpeg/ffprobe v PATH. Whisper model `Systran/faster-whisper-large-v3` v `~/.cache/huggingface/hub` (stažení jinak = souhlas uživatele). GPU RTX 3060.

## Struktura projektu

```
projekt/
  project.json        nastavení (slug, značka, hlas, tempo, vložky, HUD, hudba)
  scenar.md           scénář s {#cue}
  engine/             core.js, widgets.js, style.css, index.html, render.py, fonts/  (neměnit per projekt)
  timeline/           k-layout.js (kostra mapy) + kNN.js (kapitoly)
  tools/              build, pron, blocks, align, mix, bed, media, events, qa, render_chunks, master, fetch_vo, sheet, stills, probe
  assets/             seq/<name>/f_0001.jpg, thumbs/<name>_001.jpg, audio/<name>.wav, media.json, logos/*.svg
  build/              plan.json, tl.js, blocks/, vo_in/ (mp3 z ElevenLabs), vo/ (odstavce wav+json), mix/music/sfx/final wav, events.json
  out/                qa/<kap>/sheet.jpg, chunks/, video.mp4, <slug>_MASTER.mp4, <slug>_WEB.mp4
```

## 1) Média

`python tools/media.py reel "D:/…/reel.mp4"` – 24 fps snímky (šířka 1280), náhledy 1 fps, zvuk. Víc videí = víc jmen. Logo navíc → SVG do `assets/logos/` a klíč do `LOGOS` v k-layout (nebo monogram přes `project.json` `"mono": {"klic": ["M", "#barva"]}`).
Náhled snímku v čase: `L.frame('reel', 7.6)`. Video na plátně: `L.player('reel', {x, y, w: 1600, a: 0, b: 6, seqStart: T('k08.hook'), in: T('k08.hook'), loop: true})`.

## 2) Scénář a odhad

- `cd tools && python build.py` – bez hlasu odhad 14,6 znaku/s (sedí na zrychlený hlas 1,1×). Vypíše délku a začátky kapitol.
- Chceš-li vidět průběh bez hlasu: `engine/index.html?t=120&subs=1` (titulky = text hlasu) přes `python tools/qa.py`.
- Struktura z Aktuality (osvědčená): K00 úvod (přehrání výsledku, hub, mapa) · K01 výsledek (formát, části) · K02 tým nástrojů · K03…Kn kroky v pořadí, jak to reálně šlo (prompt → výsledek → chyba → oprava) · ceny a čas · pravidla (10 bodů) · co jsem dělal já + outro.

## 3) Hlas (ElevenLabs konektor) – jen po souhlasu

1. `python tools/blocks.py` → `build/blocks/<blok>.txt` (fonetický text, odstavce oddělené prázdným řádkem) + `build/blocks.json`. Blok = kapitola; kapitola s vložkou `after` uprostřed se rozdělí (`k14`, `k14b`). Vypíše znaky → odhad kreditů (~1 kredit/znak u eleven_v4).
2. `creative_create_flow` jednou, pak pro každý blok `creative_generate_speech` s `flow_id`, `voice_id` z project.json, `model_id: "eleven_v4"`, text = obsah bloku, `generations_count: 1`. Spouštěj víc najednou.
3. `creative_get_flow_run_status(flow_id, session_ids)` → `generations[].content_url` (podepsané, **platí 2 h**). Zapiš do `build/dl.txt` řádky `k03 https://…` a `python tools/fetch_vo.py build/dl.txt`.
4. Přepis přes `creative_transcribe_audio` nepotřebuješ – časy dělá lokální Whisper zdarma.

Když autorův klon v připojeném účtu není (`creative_list_voices`), nezkoušej web ani jiný účet bez pokynu – zeptej se, kterým hlasem.

## 4) Zarovnání (časy slov)

`python tools/align.py` (všechny bloky; `--only k03,k04`; `--device cpu` když GPU nejde) – atempo 1,1 → `build/vo_blk/`, Whisper large-v3 cs s word timestamps, zarovnání slov bloku na přepis (difflib), řez mezi odstavci → `build/vo/<pid>.wav/.json`. Shoda 75–90 % je normální (čísla, angličtina) – zbytek se interpoluje. Zkontroluj odstavce s podezřelou rychlostí (<11 nebo >21 znaků/s).
Pak `cd tools && python build.py` (už „odhad 0“) a `python tools/events.py` (AT miss).

## 5) QA

`python tools/qa.py [kNN …] [--off 2.0]` – snímek 2 s po každé cue s titulky → `out/qa/<kap>/sheet.jpg`. Hledej: prázdný záběr (kamera dorazila dřív než obsah – posuň `in` nebo kameru), useknuté/malé karty (centruj, sniž `d`), překryvy, nečitelný text (d > ~3000 u malého textu), dlouhé statické úseky. Opravuj a pouštěj jen dotčené kapitoly. Jednotlivý snímek: `cd engine && python render.py --still 812.5 --subs --out ../out/s.png`.

## 6) Render

`python tools/render_chunks.py --jobs 2` (na pozadí). Úseky po 260 s, každý vlastní proces, rozestup startů, opakování pádu, přeskočení hotových, na konci `out/video.mp4`. ~6 fps/proces s motion blurem → 35 min videa ≈ 1,5–2,5 h při 2–3 procesech. **Před renderem zavřít DaVinci Resolve** (drží desítky GB rezervované paměti → x264 „malloc failed“, Chromium „Unable to capture screenshot“).
Kontrola hotových úseků: `ffmpeg -ss 130 -i out/chunks/c001.mp4 -frames:v 1 x.png` na pár místech + `tools/sheet.py`.

## 7) Zvuk a master

```
python tools/mix.py        # hlas + vložky -> build/mix.wav
python tools/events.py     # kdy co naskočí -> build/events.json
python tools/bed.py        # hudba po kapitolách + SFX -> build/music.wav, build/sfx.wav
python tools/master.py     # amix + 2× loudnorm -14 LUFS/-1 dBTP -> MASTER (copy) + WEB (crf 20)
```
`master.py --audio-only` jen zvuk; `--no-bed` bez hudby a efektů. Hudba: stopy Liborio Conti z `~/Desktop/SFX AI final/_downloads/music_liborio_conti` (vybrané s LRA ≤ 6, tedy bez velkých gradací). Pod hlasem ~15–17 dB pod hlasem; hlasitěji = `music_duck_db` např. −16. Uprav jen zvuk bez renderu: bed + master znovu (video se kopíruje).

## 8) Předání

SendUserFile WEB verze (status normal). Soubor > 500 MB se na telefon nedoručí – řekni, že je jen v desktop aplikaci, a pošli krátkou ukázku (`ffmpeg -ss X -t 45 -i WEB.mp4 -c copy UKAZKA.mp4`). Do popisu na Patreonu: „Music: Liborio Conti“. Ulož stav do paměti.

## Časy a ceny (Aktualita #1, 34,5 min)

- Scénář 28 800 znaků · TTS ~28 000 kreditů (20 bloků) · Whisper ~3 min na GPU.
- QA všech kapitol ~1–2 min (3 procesy) · plný render ~45 min na úsek 520 s se 4 procesy (pak OOM) → 2 procesy bezpečně.
- Master + WEB enkód ~20 min.

## Cloud (claude.ai/code) – co je jinak

- **Playwright pro Python:** `pip install playwright==<verze Node playwrightu> numpy pillow` (verzi zjistíš `node -e "console.log(require('playwright/package.json').version)"`), prohlížeč je předinstalovaný → `export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. Nikdy `playwright install`.
- **Whisper:** `pip install faster-whisper`, model large-v3 (~3 GB) se stáhne při prvním `align.py`; GPU není → `python tools/align.py --device cpu` (~10–12 min na 6–8 min hlasu).
- **Hudba a zvuky:** knihovna `~/Desktop/SFX AI final` v cloudu není → `python tools/synth_lib.py` (syntetické whooshe, kliky, boom, pad) a v project.json `"sfx_lib": "<absolutní cesta k projektu>/build/sfxlib"`, `"music": ["pad"]`. Kredit „Music: Liborio Conti“ pak do popisu nepatří.
- **Render:** 4 CPU → `--jobs 3`, ~2 fps/proces → 8 min videa ≈ 60 min. Celý zbytek po zarovnání: `bash tools/run_all.sh 3` na pozadí.
- **Restart kontejneru** zastaví úlohy na pozadí; soubory zůstávají. Hotové úseky (`out/chunks/c00N.mp4`) se přeskočí → stačí spustit znovu.
- **Mazání globem** (`rm out/chunks/*`) blokuje bezpečnostní kontrola → vadné soubory přejmenuj (`mv c000.mp4 c000_v1.mp4`).
- **Force-push** blokuje auto-mode → na větev s videem přidávej normální commity.

## Podklady z HTML (PODKLADY.html)

Uživatel posílá stránku, kde jsou fotky a videa vložené jako `data:…;base64`. Vytažení i s kontextem (text před každým médiem říká, co to je):

```python
import re, base64, html
s = open('PODKLADY.html', encoding='utf-8').read()
for i, m in enumerate(re.finditer(r'<(img|video)\b([^>]*)>', s), 1):
    mime, b = re.search(r'src="data:([^;]+);base64,([^"]+)"', m.group(2)).groups()
    ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'video/mp4': 'mp4'}.get(mime, 'bin')
    open(f'media/{i:02d}_{m.group(1)}.{ext}', 'wb').write(base64.b64decode(b))
    alt = re.search(r'alt="([^"]*)"', m.group(2))
    ctx = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', re.sub(r'data:[^"\']+', '', s[max(0, m.start() - 1500):m.start()]))))[-160:]
    print(i, mime, alt.group(1) if alt else '', '|', ctx)
```

Videa bývají ve stránce 2× (galerie + sekce) – stejná velikost = stejné video. Pouštěj Python s `-I` a ve vlastní složce (cizí data).

## Předání do telefonu

- `<slug>_1080p.mp4`: `-crf 26 -maxrate 2500k -bufsize 5000k -movflags +faststart` (~10 MB/min, stejné rozlišení).
- SendUserFile + odkaz ke stažení: větev `tutorial-video` jen s videi (`git worktree add <scratch> tutorial-video`, commit, push). Odkaz `https://github.com/<owner>/<repo>/raw/tutorial-video/<soubor>` funguje v prohlížeči, kde je uživatel přihlášený na GitHub. Limit GitHubu 100 MB na soubor. Google Drive přes konektor velký soubor nenahraje.

## Časy a ceny (cloud, říjen 2026)

- **Domča (6:05):** scénář ~4 800 znaků → TTS ~4 650 kreditů (9 bloků), Whisper CPU 11 min, render 50 min (3 procesy).
- **Výměna postavy (7:40):** ~6 300 znaků → ~6 100 kreditů, Whisper 11 min, render ~60 min, přerender jednoho úseku ~20 min.
- **Higgsfield:** upscale fotky (2k) a jeden obrázek gpt_image_2_5 – jednotky kreditů.
