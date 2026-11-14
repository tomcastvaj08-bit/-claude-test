# Best Account – bannery (1254 × 1254)

Šablona drží styl původních bannerů: barvy, font, velikosti, řádkování, logo, dělicí čáru, hexagony a šipku.

## Jak udělat nový banner
1. Fotku se lvem (bez textu) dej do `pozadi/` (čtverec, lev na jedné straně, druhá strana volná).
2. Přidej záznam do `bannery.json`.
3. `node render.js` (nebo `node render.js <id>`). Hotové PNG jsou ve `vystup/`.

## Pole v bannery.json
| pole | význam |
|---|---|
| `theme` | `light` (bílé) / `dark` (navy) |
| `side` | `left` = text vlevo, `right` = text vpravo |
| `x` | začátek textu u pravé varianty (obvykle 690–745) |
| `headline` | nadpis, `\n` = nový řádek, `*slovo*` = modře |
| `body` | odstavce textu (`**tučně**` funguje) |
| `checks` | odrážky s fajfkou (text, nebo `{ "title", "text" }`) |
| `phone` | telefon s ikonou |
| `top` | výška vrcholu nadpisu v px (výchozí 296, kratší nadpis klidně 330–360) |
| `bSize` | velikost textu (výchozí 48 px; delší text 40–44) |
| `hSize` | velikost nadpisu (výchozí 114 px – neměnit, pokud to jde) |
| `arrow` | `false` = bez šipky (poslední slide) |

## Tokeny (změřené z originálů)
- Modrá: `#0068FF` (na tmavém `#1673FF`), nadpis `#0B0B0B`, tmavé pozadí `#08163A`
- Font: Urbanist (nejbližší volná náhrada Gilroy) – nadpis 800 / 114 px / rozteč 109 px / tracking −0,01 em, text 500 / 48 px / rozteč 59 px
- Levý okraj textu 77 px, logo vlevo nahoře (62, 80), šipka vpravo dole (1093, 1138)
- Dělicí čára 56 px pod účařím nadpisu: světlá = tečka + linka 412 px, tmavá = linka 128 px + tečka

## Pravidla (schváleno)
- Barvy jen podle bannerů: bílé pozadí, černý nadpis, modrý akcent `#0068FF`, modré hexagony vlevo dole. Žádné jiné gradienty, záře ani částice.
- Fotky lidí nevyřezávat – nechat jejich originální pozadí a jen ho plynule prolnout do banneru (`bgBox` + `bgFeather`, bílý přechod zleva).
- Na fotku člověka nikdy nedávat barevný závoj ani tónování – přechod do banneru jen na okraji fotky, mimo postavu.
- Text vpravo = zarovnat úplně doprava (nadpis, linka, text, kontakt i počet klientů).
- Tmavá verze: tmavé studiové fotky, pozadí `#08163A`, bílý nadpis, modrý akcent `#1673FF`.
- Pozadí fotky nechat, jak je; přechod do barvy banneru dělat za okrajem fotky (`bgExtend` = barva pozadí fotky u okraje), ne přes postavu. Text může částečně ležet i na fotce.
