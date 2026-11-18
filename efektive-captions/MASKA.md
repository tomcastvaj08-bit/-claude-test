# Maska + tracking (perspektivní, jako planar tracker v AE / Mocha)

## Pro uživatele
Spodní lišta → **Maska** → klepni na objekt (AI výběr) nebo **Body do rohů** (klepni do rohů domu / pozemku / okna) → **Hotovo**.
Appka sama najde rohy (z AI výběru), sleduje objekt **každý snímek** dopředu i dozadu až ke střihu a maska se objeví na timeline jako vrstva „Maska N“ přes celý záběr.
Začátek / konec vrstvy se zkrátí za okraje – objeví / zmizí plynule (i u střihu a mimo sledovaný záběr). Při pauze jdou body v rozích chytit a posunout → ruční oprava se plynule propíše do okolních snímků.
Vzhled: obrys (plný / přerušovaný, kreslí se), výplň, trackovací body v rozích, shine.

## Technika (tracker.js – TRK.runPlanar, objs.js – drawH)
- Pracovní rozlišení 960 px (delší strana), všechny snímky (30 fps), dopředu + dozadu po 1,5 s kouscích (malá paměť), konec u střihu.
- Body: mřížka 8×8 přes objekt + pás kolem hran (rovnoměrné pokrytí i na hladkých plochách), pyramidový LK s kontrolou tam a zpět.
- Homografie (8 DOF) z RANSAC + vážené nejmenší čtverce; **každý bod se zpřesní přímo proti výchozímu snímku** přepočítanému do aktuální perspektivy (warpLK s kompenzací jasu, NCC > 0,82) → žádné ujíždění; klíčové snímky jako záloha.
- Rohy: model + soustavná odchylka bodů v okolí rohu (3D objekty mimo hlavní rovinu).
- Automatické rohy: hustý obrys masky → RDP → proložení hran přímkami → průsečíky (ostré rohy) → jemné přichycení na roh v obraze.
- Vykreslení: homografie + dorovnání rohů (IDW) + ruční opravy (`o.fix`), vyhlazení bez zpoždění (`TRK.planarAt`).

## Naměřená přesnost (1080×1920, syntetická videa se známou perspektivou, 6 s)
- Dům (dron, rotace ±14°, přiblížení 35 %, perspektiva): průměr **0,17 px**, 95 % do 0,49 px, max 0,88 px.
- Místnost (hladká bílá stěna, rozmazaná textura): průměr 0,74 px, max 3,9 px.
- V appce (body naklikané rukou): medián 0,35 px, max 1,1 px. Automatické rohy z masky: 0,7–5 px od skutečných rohů.
- Skutečný záběr z dronu (realitní video): obrys drží dům až do přechodu.
Testy: scratchpad `ptk/` (gen.py = generátor videí se známým pohybem, run.js = měření, app_flow*.js = celý postup v appce vč. exportu).

Maska z AI výběru (3D objekt, např. dům): obrys = tvar z AI, body se automaticky dají do všech rohů obrysu (až 16), sledovací body jen v objektu a těsně u okraje (ne pozadí – jiná paralaxa), oprava rohů jen z bodů objektu. Pozemek: ruční body.
