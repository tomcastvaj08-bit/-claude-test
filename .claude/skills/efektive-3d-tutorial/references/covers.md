# Thumbnail 16:9, Instagram cover, storky a pozadí

Šablony v `covers/` (zkopíruje je `new_project.py`), render `python tools/cover.py <html> [--size 1080x1920]`. Styl stejný jako video: papír s modrou mřížkou, Geist, gradient modrá→zelená, koule, bílé karty s fotkami, mono štítky, `efektive.cz` pilulka. **Žádné „Patreon“ ani „teecee“** v náhledu (uživatel to nechce).

## Thumbnail 16:9 (`covers/thumb_16x9.html`, 1920×1080)

- Vlevo: mono pilulka („celý postup · krok za krokem“), obří nadpis v gradientu (`.t1`, 1 řádek – `white-space: nowrap`, zmenši font, když se nevejde; `cover.py` varuje), pod ním černé „tutoriál“ (`.t2`), podtitul „X → <b>Y</b>“ + nástroje.
- Vpravo: dvě karty s fotkou – „já“ (originál) vzadu, „AI“ výsledek vepředu, šipka mezi nimi.
- Fotky: snímky ze zdrojových videí (`ffmpeg -ss T -i video -frames:v 1`), u 4K videí z plného rozlišení, ořez přes `object-position`.

## Instagram cover 9:16 (`covers/cover_9x16.html`, 1080×1920)

- **Všechno podstatné ve středu 3:4 (y 240–1680)** – Instagram v mřížce profilu ořízne horní a spodní pruh.
- Nahoře „tutoriál“ + téma v gradientu, uprostřed dvě karty vedle sebe se štítky, dole `efektive.cz`.

## Instagram storky (`covers/story_9x16.html`, 1080×1920, víc snímků přes `?s=N`)

- Vzor: oznámení „kup si jen ten jeden tutoriál za **129 Kč** na Patreonu, kupuj **přes prohlížeč** (v appce na iPhonu bere Apple poplatek)“ – 3 snímky: (1) novinka + thumbnail + cena, (2) prohlížeč vs. appka (✕/✓ karty), (3) 3 kroky (odkaz → ••• → Otevřít v prohlížeči → přihlas a kup) + `efektive.cz` a volné místo dole na link sticker.
- Texty a ceny jen od uživatele, nic nedomýšlej. Thumbnail tutoriálu ulož jako `covers/thumb.png`.
- Render + kontrola: `python tools/cover.py covers/story_9x16.html --size 1080x1920 --slides 1,2,3 --story` → `story_9x16_1..3.png`; `--story` vypíše text mimo zónu y 260–1600 / x 90–990 a překryvy karet. Pokud něco vypíše, oprav a renderuj znovu.
- K předání přidej popisek: pořadí snímků a kam dát link sticker (na 3. snímek pod `efektive.cz`).

## Generické pozadí (`covers/pozadi_9x16.html`, 1080×1920)

- Bez textu: papír s mřížkou, barevné záře, koule (ostré i rozostřené), dlaždice s ikonami (play, AI jiskry, mikrofon, kamera), karta s waveformem, karta s „promptem“ (jen pruhy), tečkované cesty. **Střed y ~620–1300 volný** na text, který si uživatel dopíše v Instagramu/CapCutu.
- Na šířku: zkopíruj, nastav `width:1920px;height:1080px` a rozmísti prvky do okrajů.

## Fotky

- **Malá fotka (< 500 px):** zvětši přes Higgsfield `upscale_image` (media_upload → curl PUT → media_confirm → upscale 2k → stáhnout). Stojí pár kreditů.
- **Fiktivní postava místo skutečné** (když uživatel nechce konkrétního člověka): `generate_image` s `gpt_image_2_5`, 3:4, „original fictional person, not resembling any real celebrity“, realistické selfie.
- Fotky skutečných lidí necommituj (`.gitignore` na `covers/*.jpg|png`).

## Pasti

- **Useknutá písmena u gradientového textu** (poslední „9“ v ceně, „y“): `background-clip: text` + záporný `letter-spacing` ořízne kraj posledního znaku. Gradientovému textu dej `display: inline-block; padding-right: .08–.1em; margin-right: -.08–.1em`.
- **Instagram story 9:16:** obsah drž v zóně y 260–1600 a x 90–990 (nahoře profil a progress, dole odpověď a link sticker). Před uložením projdi bounding boxy prvků (`getBoundingClientRect`) a zkontroluj, že nic nepřesahuje a nic se nepřekrývá.
- **Engine `style.css` zamyká stránku na 1920×1080** – v jiném formátu přepiš `html, body { width: …px !important; height: …px !important; }`.
- **Story vs. post:** když uživatel řekne „storka“, dělej jen 9:16 (víc snímků po sobě), žádný carousel 4:5.
