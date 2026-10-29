# Pasti a jejich řešení (všechny jsme reálně potkali)

## Obraz / engine

- **Rozmazaný text zblízka** – Chrome rasterizuje 3D vrstvy podle layoutu, ne perspektivy. Řešení už v enginu: supersampling `U = 2` + LOD (`zoom` vnitřku podle vzdálenosti). Pro obří nadpisy zblízka `lodBoost: 2`.
- **Bílé díry / chybějící dlaždice** – flag `--run-all-compositor-stages-before-draw` + po změně (nový obrázek, LOD, blur) dvojitý rAF (`seekAsync` s `dirty`). Neodstraňovat.
- **Karty posunuté mimo střed** – uzel se centruje přes `translate(-50%,-50%)` a `.node{transform-origin:0 0}`. **x, y = střed**. Kamera míří na střed (kdo dá kameře „levý horní roh“ karty, uvidí kartu posunutou).
- **Render zamrzne / „Unable to capture screenshot“ v přehledu mapy** – SVG čar rasterizované podle scale transformace (1,8 s/snímek). Čáry jsou proto zabalené v div uzlu s LOD. Nepiš vlastní SVG s obřím scale; dlouhé čáry přes `link`.
- **Nedeterministické animace** (playhead, monitor skákal mezi úseky renderu) – `update` smí záviset jen na `t`. Žádné `lerp` ze stavu minulého snímku.
- **Prázdné/obří karty** – `autoH: true` u textových karet; pevné `h` jen u grafiky.
- **Roadmapa překrývá obsah** – štítky jsou radiálně venku (r + 9500), čáry jen mezi štítky. Obsah kapitoly drž do ~±3500 od kotvy.
- **Závěrečná karta nečitelná z přehledu** – musí být obří (w 52000) a z 9000.

## Čas / hlas

- **AT miss** (`[page] AT miss k08.brief6 130`) – slovo se hledá v zobrazovaném textu scénáře, prefix bez diakritiky. Číslo napsané slovy („sto třicet“) → `AT(…, 'sto')`; tvar slova („širokej“ vs „široký“) → prefix `'širok'`. Kontroluj `python tools/events.py` po každé změně.
- **Fonetika** – `tools/pron.py` (regex, case-insensitive, pořadí: delší fráze dřív). Pozor při úpravách přes bash heredoc: `\b` se může zapsat jako znak backspace (chr 8). Edituj přes Edit/Python soubor.
- **Hlas „teecee“ nebyl v připojeném účtu** – `creative_list_voices` ukazuje jen účet konektoru. Nezkoušet donekonečna přes web; zeptat se uživatele (minule: „udělej to přes Matyho voice“).
- **ElevenLabs URL vyprší za 2 h** – stáhni hned; jinak znovu `creative_get_flow_run_status`.
- **Scribe přepis má obří výstup** do kontextu – nepoužívej, časy dělá `align.py` lokálně.
- **faster-whisper: `cublas64_12.dll not found`** – DLL jsou v `site-packages/nvidia/*/bin`; `align.py` je přidává přes `os.add_dll_directory`. **PyAV `metadata_errors`** – audio se dekóduje ffmpegem do numpy, ne přes knihovnu.

## Render / systém

- **4 procesy renderu = MemoryError / malloc failed** – max 2–3 procesy (16 GB RAM). **DaVinci Resolve zavřít** – drží ~22 GB rezervované paměti (commit), pak padá x264 i Chromium.
- **Paralelní start Chromia: „Connection closed while reading from the driver“** – procesy spouštět s `stdin=DEVNULL` a s rozestupem; qa.py a render_chunks.py to dělají (+ opakování).
- **Úsek renderu spadl uprostřed** – mp4 je čitelné do posledního snímku; `render_chunks.py` ho přerenderuje celý. Ručně: spočítej snímky (`ffprobe -count_frames`) a dorenderuj od toho času.
- **Session skončila během renderu** (background úloha zmizela) – zkontroluj `out/chunks/*.log`, hotové úseky zůstávají, spusť znovu.
- **ffmpeg `afade d=.05` parse error** – čísla s nulou (`0.05`).
- **Soubor > 500 MB** – SendUserFile ho na telefon nedoručí; řekni to a pošli krátkou ukázku.

## Obsah

- Nic si nevymýšlej (ceny, prompty, časy, pořadí) – jen z podkladů. Chybí-li údaj, zeptej se nebo ho vynech.
- Drony/chybné záběry, které autor vystřihl, neukazuj jako výsledek (leda jako ukázku chyby, pokud to říká scénář).

## Zpětná vazba z tutoriálů „Domča“ a „Výměna postavy“ (říjen 2026)

- **„Lagy a chybky“ = prázdné/statické záběry.** Kamera dorazila na cue, ale obsah naskakuje až na pozdější slova → 5–10 s skoro prázdného plátna (ve „Výměně postavy“ kolem 4:50–5:20). Kameru dávej na `AT(cue, slovo)` toho, co se má ukázat, a QA pouštěj s `--every 3`.
- **Překryvy médií – hlavní příčina:** `L.player` počítal výšku vždy ze šířky 1600, i když dostal `w: 900` → video na výšku bylo ~2× vyšší, než mělo, a lezlo přes vedlejší prvky (a v úvodu ho kamera ořízla). Opraveno v `timeline/k-layout.js` (výška z předané šířky).
- **Překryvy médií.** Přehrávač s porovnáním (originál vs. výsledek) a pod ním obrázek se snímky po sekundách se překrývaly. U videí na výšku je přehrávač `w 900` vysoký 1600 – další prvek dej až o ~1000 níž nebo vedle.
- **Úvod nesmí být jen video s hudbou/původním zvukem.** Výsledek hraje němý (`"intro"` v project.json) a hlas rovnou představuje téma („Zdarec bojs, dneska tu máme…“).
- **Podpis vpravo dole pryč** (`"foot": ""`). Když se zapomene, znamená to přerenderovat celé video.
- **Videa na výšku (9:16):** kamera na přehrávač potřebuje `d ≈ 3000` (jinak ořízne nohy/spodek); náhledy galerie 270×480.
- **24 fps sekvence v 30 fps renderu se trhá** → `media.py` teď defaultně 30 fps.
- **Přerender jen části:** `render_chunks.py` přeskočí hotové úseky – vadný úsek přejmenuj (`mv c000.mp4 c000_v1.mp4`, mazání globem v cloudu blokuje bezpečnostní kontrola), přerenderuj, pak `master.py`. Před tím ale `build.py` jen když už žádný render neběží (procesy čtou `build/tl.js`).
- **Velká videa do telefonu:** soubor > ~100 MB z chatu nejde uložit. Pošli kompaktní 1080p (`crf 26`, `-maxrate 2500k`, `+faststart`, ~10 MB/min) a k tomu odkaz ke stažení (GitHub větev s jediným souborem, < 100 MB).
