# Šablona BASE – výchozí titulky appky

Základ je **vzorové video `VID_43543582.mov`** (barbershop, „začněte mě sledovat…“), dodané Teeceem
jako výchozí vzhled. Všechna čísla níže jsou **změřená z toho videa** (1440×2560, 60 fps) a přepočtená
na 1080×1920. V appce je to šablona **Base** a je navolená od začátku. Lidi si ji pak můžou upravit
(fonty, barvy, velikost…). Druhá šablona je **v8** (vinotéka, viz `NAVOD_TITULKY.md`).

## Vzhled
- **3 řádky**: horní (vedlejší) → **hlavní** (prostřední, větší, barevný) → spodní (vedlejší).
- **Hlavní řádek**: SF Pro **Heavy (800)**, ~1,58× větší než vedlejší, **Každé Slovo Velké** („Sledovat“, „Chystá V“, „S Názvem“).
  Přeliv **shora dolů: oranžová `#ff9a00` → zelenožlutá `#e8f200`** (oranžová na horní hraně velkých písmen, žlutá na účaří).
- **Vedlejší řádky**: SF Pro **Semibold (600)**, bílá `#ffffff` → světle šedá `#d4d4d4` dole (jemný přeliv).
  Začátek věty malým („začněte“), jména a slova jako „AdriBarber13“ zůstávají.
- Písmo je **velké, zúžené a hodně stažené**: velikost 118 % (vedlejší ~134 px, hlavní ~211 px při 1080 šířce),
  zúžení na 87 %, proklad −12 % (vedlejší) / −16 % (hlavní), mezery mezi slovy 80 %.
- **Bez 3D náklonu, bez záře.** Jemný tmavý stín (rozostření 22 %, 50 %, posun 8 %).
- **Vrstvy**: hlavní řádek leží **před** horním i spodním.
- **Rozložení šikmo**: každý další řádek je posunutý doprava (horní −2 %, hlavní +2,5 %, spodní +9 % šířky od středu).
- **Pozice**: střed bloku na 72,5 % výšky. Řádky mají pevné sloty, takže horní řádek je na stejném místě i u kratšího titulku.

## Dělení textu
- Řádky se **plní podle šířky**: horní (max 3 slova), pak hlavní (max 2), pak spodní (max 2), tedy **max 7 slov** na titulek.
- Šířka řádku max **61 % šířky videa** (hlavní 1,14× víc, protože má větší písmo). Když se slovo nevejde, jde do dalšího řádku.
  Když je plný i spodní řádek, začíná nový titulek.
- Nový titulek i po pauze v řeči > 0,6 s nebo po tečce/otazníku/vykřičníku.
- Titulek s 1 řádkem je jen bílý (bez hlavního), u 2 řádků je hlavní ten druhý.
- Ve vzoru občas rozhodla o konci řádku pauza v řeči (např. „protože | uvidíte“), takže dělení nemusí sedět na slovo přesně.

## Animace (změřeno po snímcích v 60 fps)
- **Nástup**: celý titulek stojí na místě, **slova se jen prolnou** (průhlednost 0 → 1 za 0,2 s, start 0,05 s před vyslovením).
  Žádný posun ani zvětšení.
- **Odchod**: celý blok se **rychle zmenší na 60 % a zhasne za 0,1 s**. Hned potom začíná další titulek.

## Co jde v appce změnit (a zůstane to u šablony)
Šablona (Base / v8), barva hlavního řádku (předvolby i vlastní), přeliv vedlejších řádků, fonty pro hlavní
a vedlejší řádky zvlášť, velikost, zvětšení hlavního řádku, zúžení písma, proklad, řádkování, mezery mezi slovy,
šířka řádku, max slov, velká písmena v hlavním řádku, nástup a odchod, 3D náklon, pozice tažením.
Tlačítko **Obnovit šablonu** vrátí výchozí hodnoty.

## Poznámka k fontu
Na iPhonu/Macu se kreslí přímo **SF Pro**. Jinde (Android, Windows, cloud) je náhrada **Inter Tight**
(řezy 600/800 jsou přibalené). Čísla výše jsou kalibrovaná tak, aby i s náhradním fontem velikost
a šířka slov seděly na vzor.
