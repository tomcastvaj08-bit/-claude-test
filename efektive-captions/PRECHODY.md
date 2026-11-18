# Přechody – schválené verze (17. 11. 2026)

Tyto přechody klient schválil. **Neměnit** jejich průběh – nový nápad přidat jen jako další variantu v nabídce.

| V nabídce | Typ | Délka | Pohyb | Rozmazání (závěrka) |
|---|---|---|---|---|
| Warp tunel (vcucnutí + vyplivnutí) | `warp` | 0,8 s | pružné plátno + zrychlený zoom, monotónní křivky | 0,045 s |
| Tunel (dlouhé vcucnutí) | `tunnel` | 0,8 s | PODLE PŘEDLOHY 18. 11.: 0,4 s zrychlující zoom, náklon do 10°, širokoúhlé zakřivení, natažení plátna; nový záběr jako přes rybí oko (u = 0,42), narovná se za ~7 snímků | 0,035 s (po střihu 0,06 s dopředu) |
| Propad plátna | `push` | 0,8 s | elastické plátno: natažení dozadu U0 = 0,45 (0,45 s), pružina ζ = 0,4, T = 0,222 s | žádné |
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
