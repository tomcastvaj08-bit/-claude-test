# Design a tempo

## Tokeny (engine/style.css, z patreon.efektive.cz)

- Papír `--paper #F4F6F9` s modrou mřížkou (3 úrovně, kreslí canvas v enginu), karty `--card #fff`, `--line #DBE1E9`.
- Ink `--ink #0A0D14`, `--ink2 #3A4250`, `--muted #687182`.
- Modrá `--blue #1F4DFF`, `--blue2 #5B82FF`, `--blue-soft #E3E9FF`. Zelená `--green #13B97A`, `--green-ink #0A7A4F`, `--green-soft #DAF5E9`. Červená `--red #D42A1E` (chyby), oranžová `--orange #F07A1A` (varování), `--night #070A11`.
- Gradient `--grad` modrá→zelená: v nadpisech `<span class="gr">slovo</span>`.
- Písmo `--sans` Geist (nadpisy 650–800, letter-spacing −.04 až −.06em), `--mono` Geist Mono (štítky, prompty, čísla). Inter jen pro repliky obsahu ze zdrojových videí, která jsou v Inter.

## Třídy

`.card` (bílá karta, radius, stín) · `.kick` + `.d` (mono pilulka se zelenou tečkou; `.b` modrá, `.g`, `.o`, `.r`) · `.title` · `.lead` · `.callout(.g/.o/.r)` s `.lab` a `.txt` · `.quote` (tmavá, `.who`, `.av`, `.q`) · `.btn` (černá pilulka s modrým kolečkem `.ar`) · `.chip` (`.ic`) · `.mpill(.b)` (mono pilulka) · `.pic` (obrázek s rámečkem, `.cap`) · `.prompt` (`.ph` hlavička, `.l` řádky se zvýrazněním `--hl`) · `.sphere(.blue/.green)` · `.layer` · `.bignum` · `.mono`.

## Hustota a tempo (co fungovalo)

- Na každou cue (cca každých 5–15 s) nový záběr kamery; mezi tím 2–4 prvky na slova. Nikdy víc než ~4 s bez změny.
- Karta kroku hned po přeletu (CH + 1.2), pak obsah. Velké nadpisy 64–110 px v kartě w 1500–2000, popisky ≥ 26 px.
- Callouty: max ~2 řádky textu, tučně klíčové slovo.
- Prompty: v originále anglicky, fs 25–40, zvýrazňuj jen právě vysvětlovanou část.
- Čísla jako velký typ (gradient nebo ink), jednotka mono.
- Chyby: červený callout `c: 'r'` + přeškrtnutí/razítko, oprava zeleně `c: 'g'` – vzor „problém → oprava“ je jádro tutoriálu.
- Galerie a koule v pozadí nech na k-layout (rozostřené, hluboko) – v kapitole přidávej obsah, ne dekor.
- Čáry `link` pro vztahy (co z čeho vzniklo), `soft: true` pro vedlejší.
- Barevná sémantika: modrá = nástroj/akce, zelená = výsledek/správně, oranžová = pozor, červená = chyba, ink = citace autora.

## Kamera (viz engine-api.md §7)

Whip na nový prvek, smooth na oddálení, slow push po dosednutí, střídat strany náklonu. Celá mapa 2×: na konci úvodu a v outru.
