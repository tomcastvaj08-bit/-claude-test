# EFEKTIVE titulky – kompletní předávka

Tohle je všechno, co jsme s Teeceem vyladili na titulcích pro reelska (vinotéka Volařík, verze v8 = schválený základ).
Cíl: **prémiové, čisté titulky v Apple stylu, animace jako vymazlený After Effects / DaVinci preset.**
Vzor, ze kterého to vychází: appka **SA Captions** (styl „kinetic 3 řádky, prostřední velký barevný“).

Komunikace s Teeceem: česky, hovorově, jednoduše („jak prvňákovi“), neptat se a rovnou dělat, ale informovat co a proč.

---

## 1. Jak titulek vypadá (statický vzhled)

**Struktura – vždy 3 řádky přes sebe (jedna „trojice“):**
- horní řádek = vedlejší, **bílý, tenký** (SF Pro Display Medium 500)
- **prostřední řádek = hlavní**, velký, **tučný** (SF Pro Display Black 900), **barevný**, zvětšený na ~160 %
- spodní řádek = vedlejší, bílý, tenký
- Příklad: `Volařík` / **`z Mikulova`** / `konečně`, `Kus` / **`Pálavy ve`** / `flašce`, `a` / **`zlatá`** / `medaile`
- Hlavní je VŽDY prostřední (ne nejdelší slovo, ne ručně vybírané). Krátké slůvko (≤ 2 písmena: „a“, „i“, „v“, „se“) nesmí být samo hlavním řádkem → přilepí se nahoru a hlavní je další řádek.
- 1 slovo = jen hlavní. 2 slova = malé nahoře + velké dole.

**Rozdělení textu na trojice:**
- max **4 slova** na jeden titulek
- nový titulek i při pauze v řeči > 0,6 s nebo po tečce/otazníku/vykřičníku
- dělení 4 slov: horní = ceil(zbytek/2), hlavní = ceil(n/3), spodní = zbytek
- titulek svítí do min(konec posledního slova + 1,2 s, začátek dalšího titulku)
- interpunkce se NEzobrazuje

**Typografie (čísla, co fungovala):**
- font: SF Pro Display (na iPhonu nativně; v Linux renderu fallback Inter Tight – je to skoro stejné)
- základní velikost písma = 0,105 × kratší strana videa × 0,88 (u 1080×1920 ≈ 100 px), hlavní řádek × 1,6
- letter spacing −4 % velikosti písma (stažené písmo jako v předloze)
- řádkování 66 % (řádky se lehce překrývají – tak to má SA Captions)
- mezery mezi slovy 160 % běžné mezery (předloha má široké mezery)
- pozice: střed vodorovně, svisle 72 % výšky (pod obličejem, v safe zóně IG)
- kinetic layout: řádky se střídavě posouvají doleva/doprava (síla 45 z 100)
- **vrstvy:** každý další řádek leží PŘED předchozím (spodní před hlavním, hlavní před horním) – ne hlavní řádek úplně navrchu

**Barvy podle tématu:**
- vedlejší řádky vždy bílé `#ffffff`
- hlavní řádek jedna barva podle tématu videa. Použité a schválené:
  - červená `#e4202c` (vinotéka, víno) – finální v8
  - oranžovo-žlutý přeliv shora dolů `#ffe04a → #ff8a00` (vypadalo dobře, „jako Dnes v předloze“)
  - zlatohnědá `#b8925a` (luxus, barber)
- výběr: ladit s dominantní barvou značky/produktu ve videu, musí být čitelná na pozadí

**Stín a záře:**
- stín: černý, **velmi jemný, měkký, oddálený** – rozostření 25 % výšky písma, průhlednost 45 %, posun dolů 10 % a doprava 4 % výšky písma. Žádné tvrdé „3D vysunuté“ kopie.
- záře (glow): **stálá měkká záře v barvě hlavního písma** okolo hlavního řádku (síla 30/100). Kreslit až PO 3D projekci jako jeden rozostřený tvar (viz bod 3), jinak vzniká mřížka.
- shine (bílý lesk přejíždějící přes slovo): **ve finále VYPNUTÝ.** Pokud ho někdy chce, tak jen u některých titulků (každý 3.), jako měkký široký oblak světla zleva doprava ~0,6 s, svítí i okolo slova – nikdy ostrý pruh.

---

## 2. Animace (to nejdůležitější – „smooth jak DaVinci preset“)

**Nástup = „Celý blok“:**
- celý titulek (všechny 3 řádky) přijede JAKO JEDEN KUS, ne slovo po slovu
- délka 0,55 s, křivka **expo ease-out**: `e = 1 − 2^(−10·q)`, kde q = čas_od_začátku_titulku / 0,55
- měřítko z 82 % → 100 % (`sc = 0.82 + 0.18·e`)
- posun zespodu: `dy = (1 − e) · 0,35 · výška_písma`
- jednotlivá slova se jen **plynule rozsvítí** (průhlednost 0 → 1 za 0,28 s se smoothstep, startuje 0,08 s před vyslovením slova) – nic dalšího se s nimi neděje

**Odchod:**
- celý blok plynule zhasne (0,3 s, smoothstep) a zároveň se mírně zmenší na 94 %

**ZAKÁZÁNO (všechno tohle Teecee označil za hnusné / trhané):**
- wiggle / vlnění / třepání písmen
- squish, pop, pružina, odraz, shake při nástupu
- slova přijíždějící jednotlivě z různých stran
- ostrý bílý lesk (shine pruh), stálý silný glow přes celé písmo
- tvrdý 3D stín za písmem
- cokoliv, co se hýbe, když titulek stojí

**Plynulost renderu:**
- výstup **60 fps** (30 fps vypadalo trhaně)
- render **snímek po snímku**, ne „nahrávání naživo“ z prohlížeče (to v cloudu zahazovalo snímky → zasekané)
- snímky ukládat jako **PNG** (JPEG dělal v červené a záři artefakty)

---

## 3. 3D náklon (do prostoru, ne zkosení)

- Je to skutečná perspektiva: text jako cedule otočená kolem svislé osy (tilt) a vodorovné osy (tiltX), bližší strana větší.
- Výchozí: tilt 18°, tiltX 4°, perspektiva 60. **Střídat směr**: titulek 1 doprava, titulek 2 doleva, atd.
- Kde to jde, **náklon podle prostoru ve scéně** (Teecee to chce): regál/polička → text natočený jako polička (vinotéka: tilt −20°, tiltX 6°), sud/stůl → „položený“ na desku (tilt ±16°, tiltX 8°).
- Nepřehánět: 24–30° deformovalo písmo a bylo to ošklivé. 15–20° je sweet spot.

**Technika projekce (důležité kvůli kvalitě):**
- text se kreslí do průhledné vrstvy, pak se promítá po **1–2px proužcích s 1px překryvem** (dřív 64–256 proužků → viditelná mřížka/švy)
- hloubka každého proužku Z = −V·sin(úhel), měřítko s = f/(f+Z), f = kratší strana × (1,7 − persp/100)
- **po projekci vycentrovat**: spočítat promítnuté krajní body bloku a posunout zpět na střed (jinak perspektiva táhne text doprava)
- **pojistka proti ořezu**: když je promítnutý blok širší než 90 % šířky videa, zmenšit ho kolem středu
- záře (glow) se dělá z promítnuté masky hlavních slov → rozostřit → podložit pod ostrý text

---

## 4. Pipeline (jak to vyrobit)

1. **Přepis s časy slov:** ElevenLabs Scribe (`eleven_scribe_v1`) nebo OpenAI Whisper (`whisper-1`, `timestamp_granularities=word`). Čeština funguje výborně. Formát: `{"words":[{"word":" Tohle","start":0.36,"end":0.6},...]}`. Zkontrolovat názvy (např. „U Sudu“ – jednotné číslo).
2. **Zdroj pro Chromium:** převést video na WebM VP9 1080×1920 (Chromium v sandboxu neumí H.264/HEVC).
3. **Spustit appku:** `cd app && node server.js` (localhost:3000).
4. **Náhled pár snímků** (`--frames`) → podívat se → upravit OWN (náklon per scéna, menší velikost u dlouhých titulků).
5. **Render všech snímků** (`render_captions.py`), 60 fps PNG. ~1350 snímků na 22 s; v cloudu trvá ~0,6 s/snímek → dělit na dávky po ~300–500 snímků a pouštět paralelně.
6. **Kontrola snímek po snímku:** skript hlásí `POZOR OŘEZ`. Navíc udělat mozaiku všech titulků v momentě, kdy jsou všechna slova vidět (čas konce titulku), a projít očima, že nic není uříznuté.
7. **Složit:** ffmpeg, PNG sekvence + **původní zvuk z originálu**, H.264 CRF 16, 60 fps, `+faststart`.
8. Poslat video + mozaiku titulků + sekvenci nástupu (pár snímků vedle sebe), ať Teecee vidí kontrolu.

---

## 5. Známé pasti

- Poslední snímek může být za koncem videa (1351/60 > délka) – přeskočit, není to chyba.
- „Uříznuté slovo“ často není ořez, ale slovo uprostřed nástupu (ještě průhledné) – kontrolovat v čase konce titulku.
- `pkill -f node`/`pkill -f frames` v cloudu zabil i vlastní shell – zabíjet procesy opatrně (podle PID).
- Google Drive se ze sandboxu stáhnout nedá (blokované) a Drive konektor vrací soubor jako text → velká videa musí Teecee poslat jako přílohu do chatu (velký .mov ideálně převést na mp4 1080p).
- Na telefonu v náhledu chatu se 60fps video může přehrávat trhaně – pro posouzení plynulosti stáhnout do Fotek.

---

## 6. Co udělat „ještě líp“ (nápady, co jsme nestihli)

- **Automatický náklon podle prostoru:** detekce dominantních linií ve scéně (polička, stůl, hrana) přes Hough transform / vanishing point a natočit titulek podle nich.
- **Text za postavou** (jako „Analyzing video“ v SA Captions): segmentace osoby (např. MediaPipe/SAM) a hlavní řádek kreslit za ni.
- **Motion blur** při nástupu bloku (rozostření ve směru pohybu prvních ~5 snímků) – ještě víc „After Effects“.
- **Jemná paralaxa řádků při nástupu** (horní řádek o 2–3 snímky dřív než spodní) – víc prémiové, ale bez pružení.
- **Sjednocení barvy s gradingem videa** (vzít dominantní barvu z frame a z ní odvodit hlavní barvu).
- Teecee dostal i ruční verzi ze SA Captions (VID_90154266.mov) – je to přesný vzor nástupu (čisté prolnutí) a stálé červené záře okolo hlavního slova.

---

## 7. Obsah balíku

- `NAVOD_TITULKY.md` – tento návod
- `render_captions.py` – render snímek po snímku přes appku (výchozí = schválená šablona v8)
- `app/` – celá appka EFEKTIVE Captions (web, `node server.js`), v `public/index.html` je kompletní kreslicí engine (layout, animace, 3D projekce, glow, stín)
- `example_words_vinoteka.json` – příklad přepisu s časy
- `reference/` – předlohy ze SA Captions (nástup 60 fps, glow, shine, stín) a výsledky v8 (všechny titulky, nástup bloku, detail glow)
