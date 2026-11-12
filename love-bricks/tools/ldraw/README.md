# Auta z originálních dílků (LDraw → .lbm)

Auta na webu nejsou modelovaná ručně – jsou to skutečné digitální stavby sad dílek po dílku
z LDraw.org Official Model Repository (OMR), převedené do kompaktního formátu `.lbm`.

## Postup pro další auto

1. Stáhni knihovnu dílků: `https://library.ldraw.org/library/updates/complete.zip` (rozbal, cesta = `LDRAW`).
2. Stáhni model sady z OMR (`https://library.ldraw.org/omr/sets/…` → soubor `.mpd`).
3. Převod (vyžaduje `three` a `meshoptimizer` z npm):
   ```bash
   LDRAW=/cesta/ldraw node convert.mjs model.mpd ../../models/auto.lbm            # první převod
   node cull.cjs auto      # (server v kořeni love-bricks na :8765) – zjistí dílky viditelné zvenku
   LDRAW=/cesta/ldraw SIMPLIFY=0.3 SERR=0.015 node convert.mjs model.mpd ../../models/auto.lbm auto.keep.json
   ```
4. Zaregistruj auto v `js/builders.js` (`LD_CARS`: soubor, kódy barev laku pro varianty) a v `js/products.js`.

Převaděč vynechá vnitřní plochy dílků (díry, trubičky pod kostkami, ozubení), dílky, které
nejsou zvenku vidět, a volné kousky mimo auto (klíček, štítek). Geometrie dílků se mírně
zjednoduší (meshoptimizer), tvar zůstává.

## Autoři modelů (licence CC BY 2.0, LDraw.org)

* Porsche 911 (10295) – Ulrich Röder
* Lamborghini Sián FKP 37 (42115) – Jens Brühl (na webu přebarveno na růžovou)
* Bugatti Chiron (42083) – Philippe Hurbain (na webu přebarveno na oranžovo-černou)
* Knihovna dílků – LDraw.org Parts Library
