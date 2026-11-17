# Přechody – schválené verze (17. 11. 2026)

Tyto přechody klient schválil. **Neměnit** jejich průběh – nový nápad přidat jen jako další variantu v nabídce.

| V nabídce | Typ | Délka | Pohyb | Rozmazání (závěrka) |
|---|---|---|---|---|
| Warp tunel (vcucnutí + vyplivnutí) | `warp` | 0,8 s | pružné plátno + zrychlený zoom, monotónní křivky | 0,045 s |
| Tunel (dlouhé vcucnutí) | `tunnel` | 0,8 s | PODLE PŘEDLOHY 18. 11.: 0,4 s zrychlující zoom, náklon do 10°, širokoúhlé zakřivení, natažení plátna; nový záběr jako přes rybí oko (u = 0,42), narovná se za ~7 snímků | 0,035 s (po střihu 0,06 s dopředu) |
| Propad plátna | `push` | 0,8 s | elastické plátno: natažení dozadu U0 = 0,45 (0,45 s), pružina ζ = 0,4, T = 0,222 s | žádné |
| Propad plátna + motion blur | `pushb` | 0,8 s | stejné jako `push` | 0,035 s |
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
