# Přechody – schválené verze (17. 11. 2026)

Tyto přechody klient schválil. **Neměnit** jejich průběh – nový nápad přidat jen jako další variantu v nabídce.

| V nabídce | Typ | Délka | Pohyb | Rozmazání (závěrka) |
|---|---|---|---|---|
| Warp tunel (vcucnutí + vyplivnutí) | `warp` | 0,8 s | pružné plátno + zrychlený zoom, monotónní křivky | 0,045 s |
| Tunel (dlouhé vcucnutí) | `tunnel` | 0,8 s | PODLE PŘEDLOHY 18. 11.: 0,4 s zrychlující zoom, náklon do 10°, širokoúhlé zakřivení, natažení plátna; nový záběr jako přes rybí oko (u = 0,42), narovná se za ~7 snímků | 0,035 s (po střihu 0,06 s dopředu) |
| Průlet + dohoupání | `flysway` | 2,4 s | PODLE PŘEDLOHY 18. 11. (průlet do místnosti): zrychlující najetí 0,2 s (ln zoom 0 → 0,65), nový záběr stlačený (střed 57 %) se rozvine za 0,3 s, pak houpání celého obrazu shora dolů – proložené po snímcích: A = 0,097, ζ = 0,15, T = 1,34 s (1. vrchol 7,8 % výšky za 0,30 s); naše měření: ζ 0,17, T 1,33, 7,7 % za 0,31 s | 0,035 s |
| Propad plátna 1 | `push1` | 0,5 s | PŘESNĚ verze ze 16. 11. (RUB_PRE/RUB_POST, původní výpočet plátna, závěrka 0,06 s dopředu i přes střih) – ověřeno pixel po pixelu proti snímkům ze 16. 11. | 0,06 s |
| Propad plátna 3 (s dohoupáním) | `pushsway` | 2,4 s | Propad plátna 2 + po puštění houpání z předlohy (stejné jako u Průletu + dohoupání) | žádné |
| Propad plátna (= v nabídce „Propad plátna 2“) | `push` | 0,8 s | elastické plátno: natažení dozadu U0 = 0,45 (0,45 s), pružina ζ = 0,4, T = 0,222 s | žádné |
| Propad plátna + motion blur | `pushb` | 0,8 s | stejné jako `push` | 0,035 s |
| Propad plátna – rychlý (bez pružení) | `pushr` | 0,4 s | PODLE PŘEDLOHY 18. 11. (kuchyň): 0,2 s zrychlený propad dozadu (střed na 64 %), nový záběr začne na 81 % a za ~5 snímků se bez pružení narovná | 0,035 s |
| Zahoupání + motion blur | `swing` | 1,25 s | PODLE PŘEDLOHY 18. 11. (tam do strany, tady shora dolů): před střihem couvání (plátno dozadu, 0,2 s), nový záběr začne na 140 % a dojíždí na 100 %, 0,1 s po střihu kopanec dolů, krajní poloha 5 % výšky za 0,13 s, tlumené houpání ζ = 0,3, T = 0,64 s; obraz se posouvá vcelku | 0,03 s |
| Zahoupání bez bluru | `swingn` | 1,25 s | stejné jako `swing` | žádné |
| Blesk (bílý záblesk) | `flashw` | 0,5 s | 2 výboje, bílý výboj ve střihu, doblik, dozvuk; otřes, studený nádech, záře | 0,015 s |

Zrušené (ve starých projektech se převedou): `fly` → `warp`, `whip` → žádný.

## Varianty poslané k výběru (zatím NEJSOU v appce)
- Propad plátna hlubší: U0 = 0,6 (jinak jako `push`)
- Propad plátna se dvěma zhoupnutími: ζ = 0,22, T = 0,24 s
- Zahoupání silnější a pomalejší: W0 = 0,48, ζ = 0,28, T = 0,3 s, s rozmazáním
- Zahoupání jemné: W0 = 0,3, ζ = 0,45, T = 0,22 s, bez rozmazání

## Kontroly před každou změnou přechodů
- numerika: klid na okrajích okna, žádné NaN, žádné skoky (`tq/curves.js` ve scratchpadu – logika: vzorkovat FX.state po 1 ms)
- pixely: FX.debug = true obarví vzorky mimo obraz fialově → 0 % na výšku i na šířku, 30/60 fps, délky 0,2 / výchozí / 1,5 s
- appka: nabídka, staré projekty, náhled, export

## Zvuky přechodů (18. 11. 2026)

**STAV 18. 11.: generované zvuky klient zamítl („katastrofa“) → vypnuté (`E.G.trSfxGen` není nastavené). Hraje jen VLASTNÍ zvuk nahraný k typu přechodu** (panel přechodu → Nahrát zvuk přechodu; uloží se do IndexedDB `files` pod `trsfx|<typ>`, platí pro všechny projekty, nejsilnější místo zvuku se zarovná na střih).

Původní generované zvuky (zůstávají v kódu, vypnuté):
Vlastní generované zvuky (Web Audio, žádné cizí nahrávky – zvuky z předloh jsou smíchané s hudbou a hlasem a patří autorům videí).
Hraje se v náhledu i v exportu, časované na pohyb přechodu (posuny se škálují s délkou přechodu). Vypínač u každého střihu, společná hlasitost `trSfxVol` (výchozí 80 %).

| Přechod | Zvuky |
|---|---|
| Warp tunel | nádech 250 → 7000 Hz do střihu, rána 85 → 38 Hz, výlet 5200 → 280 Hz |
| Tunel | nádech do střihu, výlet, rána |
| Propad plátna (+ blur) | gumové natahování 70 → 150 Hz s chvěním, puštění (svist 3600 → 240 Hz), dopad +0,1 s |
| Propad plátna – rychlý | natahování 0,2 s, puštění |
| Zahoupání | svist nahoru při couvání, svist dolů při kopanci (+0,1 s), slabší svist při zpětném houpnutí (+0,42 s) |
| Blesk | praskání při obou výbojích, výboj + hrom ve střihu, praskání při dobliku |
| 2× negativní záblesk | glitch |

Špičky při 80 %: 0,34–0,66 (bez přebuzení).

## Zvuková sada (18. 11. 2026 – ze SFX videa od klienta, čisté zvuky bez hudby)
Soubory `app/public/sfx/*.m4a` (špička −1 dB, AAC 128k). Nejsilnější místo každého zvuku se zarovná na okamžik efektu.
- **shine** = zvuk č. 2 z videa (na přání klienta) – hraje při lesku: běžné titulky (příjezd hlavního slova + 0,06 s, jen titulky se shine), 3D mix (první slovo zvýrazněného řádku + 0,02 s), objekty (začátek shine bloku). Výchozí hlasitost 50 %.
- **tick** (č. 15) a **swoosh** (č. 8) = mini zvuky na slova („Tik klávesy (mini)“, „Swoosh (mini)“), interní zeslabení 0,22 / 0,25.
- přechody: warp č. 35, tunel č. 20, propad plátna (+blur) č. 30, rychlý propad č. 13, zahoupání č. 23, blesk č. 29, 2× negativ č. 31. Výchozí hlasitost 45 % („ne moc nahlas“). Vlastní nahraný zvuk má přednost.
- vypínače: hlavní (`sfxAll`), skupiny (`sfxShineOn`, `sfxTrOn`, `sfxWordsOn`), jednotlivě: přechod (`clip.trSfx`), objekt (`o.shSfx`), titulek (zvuk „Jen tento titulek“).
- export: limiter na 0,89 (zvuky navrch hlasitého videa nepřebudí).

## Efekty v místě (bez střihu) – 18. 11. 2026
`E.fxMarks = [{id, t, type:'shake', dur, amt, sfx}]` – tlačítko **Shake** na liště dá efekt na místo hlavy, značka na stopě videa.
- **Houpavý shake** (`shake`, 1,2 s) PODLE PŘEDLOHY 18. 11. – proloženo: kopanec šikmo dolů-doleva (A = 0,212, ζ = 0,48, T = 1,02 s, vodorovně 0,46 × svisle; 1. vrchol ~9,5 % výšky za 0,18 s). Zoom roste s obálkou houpání → nikdy okraje. Síla 30–160 %, délka 0,5–2,5 s, zvuk = zvuk zahoupání.

## Úpravy zvuků 18. 11. odpoledne
- Všechny zvuky sady srovnané na stejnou vnímanou hlasitost (aktivní RMS −20 dBFS, špička max −1 dB); nové: `camera` (č. 29, spoušť foťáku), `snap` (č. 22, lusknutí), `glitch` (č. 17, mini glitch), `glitch2` (č. 26).
- Výchozí hlasitosti: přechody 30 %, shine 20 %, posuny 3D mixu 30 % (staré uložené 80/45 → 30, shine 50 → 20). Špičky přechodů ~10 dB pod hlasem.
- 3D mix: shine zvuk při KAŽDÉM slově (0,06 s před časem slova), mini swoosh při každém posunu (nový řádek / nová scéna).
- Blesk = spoušť foťáku, 2× negativ = mini glitch (výchozí); u každého přechodu výběr zvuku (`clip.trSnd`) a vlastní hlasitost (`clip.trVol`).
- Zvuky se plánují 0,2 s dopředu na přesný čas a odečítá se zpoždění zvukového výstupu (žádné opoždění); přehrávání se střihem srovnává obraz se slyšeným zvukem.
- Fialová mrtvá místa mají vlastní řádek pod stopou videa (nepřekážejí okrajům klipů).

## Oprava 18. 11. večer (klient: „cinkavé zvuky pryč, jen swooshe“)
- Č. 29 („spoušť foťáku“ / „záblesk“) a č. 31 („cink“) zní jako POKLADNA → vyřazené z nabídky i výchozích. Č. 22 („lusknutí“) taky vyřazené (neověřené).
- V SFX videu klienta NENÍ zvuk foťáku ani lusknutí → čekáme na zvuk od klienta. Do té doby blesk = mini swoosh.
- 3D mix: na každé slovo jen jemný mini swoosh, shine ve 3D mixu bez zvuku.

## 18. 11. – výchozí zvuky přechodů podle předloh (klient: „podívej se, jaké zvuky používají ve videích“)
Rozbor zvuků přechodů v předlohách (spektrogram, délka, směr výšky): záblesky = krátký cvak, propad = krátký nádech / klesavý svist, tunel = klesavý svist, průlet = svist. Výchozí nastavení:
| přechod | výchozí zvuk |
|---|---|
| Blesk (flashw) | Cvak (nový `click.m4a`, 0,19 s) |
| Negativ (flash2) | Mini glitch |
| Propad plátna 1/2/2+blur/3, rychlý | Krátký nádech (`pushr`) |
| Tunel | Klesavý svist (`push`) |
| Průlet + dohoupání, Zahoupání | Svist (`swing`) |
| Warp | Mini swoosh |
Vše jde u každého přechodu přepnout v nabídce zvuků. Pokladní/cinkavé zvuky v nabídce nejsou.

## 18. 11. – oprava: čistý WOOSH (klient: „proč tam je random sound, WOOSH tam má být“)
Zjištěno: `swoosh.m4a` (#8) a `pushr.m4a` (#13) ze sady nejsou swooshe, ale řada cvaknutí. Nahrazeno vlastními čistými woosh zvuky (šum s pásmovým filtrem, plynulý náběh a dozvuk, výška podle předloh):
`woosh` 0,5 s (propad plátna 1/2/3, zahoupání, shake), `wooshk` 0,32 s (rychlý propad), `wooshh` 0,75 s hluboký (tunel, warp, průlet), `wooshm` 0,2 s velmi tichý (slova ve 3D mixu, „Swoosh (mini)“).
Blesk = cvak, negativ = mini glitch. Staré volby „Mini swoosh“ a „Krátký nádech“ z nabídky pryč (uložené projekty se přepnou na výchozí).

## 18. 11. – brand Lerdee (Lukáš Lederer Kosmetika)
Šablona **Lerdee** (první v Šablonách): hlavní řádek Neulis Sans Bold, vedlejší Neulis Sans Light VELKÝMI s prostrkáním, barvy Begie #E9E0D6 a Brown #363029 (stín). Fonty: „Neulis Sans Bold/Light“ (placený font – když je v zařízení, použije se; jinak vizuálně skoro stejný Outfit, OFL) a „Open Sans Light“. V Barvách řádek „Barvy značky Lerdee“ (Begie text / Brown text), barvy přidané i do stínu a objektů.

## 18. 11. – KRITICKÁ OPRAVA: projekty po otevření bez titulků
Příčina: v commitu 0d4c62a se při vkládání řádku do `restore()` (app.js) dostal kód `mixDefaults(...); E.words=s.words; E.meta=...; E.zones=...` za `//` komentář → při otevření projektu se nenačetly titulky, úpravy titulků ani zóny; při zavření/úpravě se prázdný stav uložil přes projekt.
Opraveno + pojistky: (1) ukládá se jen projekt, který se otevřel celý (`project.restoredOk`); (2) když by uložení smazalo ≥ polovinu titulků (min. 5), předchozí stav se uloží do `backup`; (3) při otevření projektu bez titulků se zálohou se titulky obnoví automaticky. Test: `tq/roundtrip.js` (uložit → znovu načíst stránku → otevřít 2× → porovnat; záloha).

## 18. 11. – přepis jednoho klipu, koš v horní liště
Panel klipu: „Nový přepis titulků tohoto klipu“ – AI přepíše jen zvuk vybraného úseku (i vloženého klipu), titulky v jeho čase se nahradí, ostatní zůstanou (časy přepočítané i při zrychlení). Horní lišta: místo oka koš = smaže vybrané (úsek, overlay, zvuk, shake, objekt, klíčový bod, jinak vybraný titulek; zpět jde šipkou). Oko (skrýt titulky) je malé vlevo nahoře vedle křížku. V panelu Titulky tlačítko „Smazat vybraný titulek“.

## 18. 11. – Lerdee jen fonty; shine po titulcích
Šablona Lerdee, řádek „Barvy značky Lerdee“ a brand barvy ve stínech/objektech ODSTRANĚNY (klient chtěl jen fonty) – zůstávají fonty Neulis Sans Bold/Light (Outfit) a Open Sans Light.
Shine (a vše ve Šablonách/Stylu/Pohybu/3D mixu/AI) ukazuje nastavení titulku pod hlavou: při posunu hlavy (i tažením timeline) nebo klepnutí na titulek se panel překreslí. Shine zapnutý „jen u tohoto titulku“ svítí vždy (nezávisle na „každý N-tý“).

## 18. 11. – odchod titulku: Flicker
Pohyb → Odchod → „Flicker (zabliká a zmizí)“ (`exitFlick`): posledních 0,33 s titulek bliká po krocích 1/30 s (1, 0.12, 1, 0.9, 0.06, 0.75, 0, 0.5, 0, 0.22, 0) a zhasne. Platí pro všechny animace nástupu, náhled i export; jde nastavit i jen pro jeden titulek.

## 18. 11. – hotové šablony na základu Styl 1 (Base)
Rozložení přesně jako Styl 1, mění se barvy / písmo / 3D (engine.js, blok „HOTOVÉ VARIANTY ZÁKLADU“), v nabídce hned za Stylem 1; původní šablony zůstávají:
Metalická (Neulis Bold + Light, barvy Lerdee Begie #E9E0D6 → Brown #363029, hnědý stín) · Modrá 3D (#14d6ff → #0040ff, náklon −37°, střídá L/P) · Červená 3D (#ff3b30 → #c00000, −37°, střídá) · Negativ 3D (negativ hlavního řádku, −37° stále na jednu stranu) · Styl 1 + 3D hloubka (extrude 22) · Růžová Snell (hlavní řádek Snell Roundhand, růžová #ff7cc8 → fialová #b98cff).

## 18. 11. – čeština ve všech písmech
Systémové písmo z iPhonu, které nemá všechna česká písmena (např. Snell Roundhand), se automaticky nahradí celé náhradním písmem ze stacku (`E.czFam`, test šířek znaků) – nikdy se nemíchají dvě písma v jednom slově. Všechna přibalená písma mají všechna česká písmena (ověřeno fontTools). Část písma s háčky se načte hned (`document.fonts.load` s českými znaky), předkreslená slova se po dočtení písma překreslí, export počká na písma.
Růžová Snell: hlavní řádek písmem Pinyon Script (jako Snell, se všemi znaky), sytější #ff2d9a → #a845ff, jemná záře. Pinyon Script je i v nabídce písem.
Odstíny změřené z klientových předloh (bestaccount, vinotéka, kadeřnictví) a o ~20 % syceji; žlutý Styl 1 předloze už odpovídá (#ff9a00 → #e8f200), beze změny.

Lerdee (dřív Metalická): podle brand manuálu – vedlejší řádky NEULIS SANS LIGHT velkými s prostrkáním (track 6, větší mezery mezi slovy), hlavní Neulis Sans Bold, Begie #E9E0D6 bez přechodu, stín Brown #363029; rozložení jako Styl 1.

## Názvy šablon (bez jmen klientů)
V nabídce se šablony jmenují jen „Styl N“ podle pořadí: Styl 1 (Base, žlutý) · Styl 2 (Neulis, Begie/Brown) · Styl 3 (modrá 3D) · Styl 4 (červená 3D) · Styl 5 (negativ 3D) · Styl 6 (Styl 1 + 3D hloubka) · Styl 7 (růžová script) · Styl 8–16 (původní Styl 2–10).

3D náklon −37° se střídáním stran mají Styl 2, 3, 4, 6, 7 (Styl 5 negativ: −37° stále na jednu stranu). Styl 10 (původní negativ s kurzívou): wiggle vypnutý.
