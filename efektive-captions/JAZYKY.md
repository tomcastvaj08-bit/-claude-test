# Jazyk aplikace (i18n)

- **Bez AI, bez kreditů:** překlady jsou pevné slovníky v `app/public/i18n/<kód>.js` (`window.I18N_DICT.<kód> = { "český text": "překlad" }`). Zdrojový jazyk appky je čeština.
- **Jak to funguje:** `app/public/i18n.js` přeloží po načtení všechny texty rozhraní a pak hlídá všechno, co appka dokreslí (panely, toasty, okna potvrzení). Čísla v textech se nahrazují `#` (např. `"Klip # z #": "Clip # of #"`). Nepřekládá se uživatelský obsah (slova titulků, názvy projektů, textová pole) – prvky s `data-notr` se taky přeskočí.
- **Volba jazyka:** zeměkoule na úvodní obrazovce. Uloží se do zařízení (`localStorage efk_ui`) a platí při každém spuštění. První spuštění: čeština/slovenština v telefonu → čeština, jinak angličtina.
- **Hotové:** čeština (zdroj), angličtina (`en.js`), slovenština (`sk.js`), polština (`pl.js`), němčina (`de.js`) – každý cca 1150 textů. Ostatní jazyky jsou v nabídce jako „Brzy“ (`UI_LANGS` v `i18n.js`).
- **Načítání:** `index.html` načte jen slovník zvoleného jazyka (malý skript před `i18n.js`, stejné pravidlo výběru jako `i18n.js`). První spuštění: jazyk telefonu, pokud je hotový, jinak angličtina.
- **Přidání jazyka:** zkopírovat `en.js` → `<kód>.js`, přeložit hodnoty (klíče = čeština), přeložit rádce do `i18n/radce-<kód>.js` (`window.RADCE_DICT.<kód> = {kb:{id:[název,kroky,slova]}, cat:{…}, t:{…}}`), v `i18n.js` u jazyka dát `true` a v `index.html` přidat kód do pole `R` v načítacím skriptu.
- **Nový text v appce:** po přidání nového textu ho doplnit do `en.js` (kontrola: crawl všech panelů v angličtině a hledání zbylých českých znaků).

## Rádce (nápověda s panáčkem)
Návody rádce jsou v `app/public/radce.js` (pole `KB`), každý česky i anglicky. Rádce se nepřekládá přes slovník
`i18n/en.js` – texty má v sobě. **Když do appky přibude nová funkce, přidej k ní návod do `radce.js`** (název,
kroky oddělené `|`, hledací slova a kam má „Ukázat mi“ vést).
