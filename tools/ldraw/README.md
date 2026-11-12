# Auta z originálních dílků (LDraw → Blender → .glb)

Auta na webu nejsou modelovaná ručně – jsou to skutečné digitální stavby sad dílek po dílku
z LDraw.org Official Model Repository (OMR). Dílky se v Blenderu zjednoduší a výsledek se
zkomprimuje do `.glb` – plná verze pro počítač a odlehčená `-lite.glb` pro mobil.

## Postup pro další auto

1. Stáhni knihovnu dílků: `https://library.ldraw.org/library/updates/complete.zip` (rozbal, cesta = `LDRAW`).
2. Stáhni model sady z OMR (`https://library.ldraw.org/omr/sets/…` → soubor `.mpd`).
3. Převod (vyžaduje `three` a `meshoptimizer` z npm):
   ```bash
   LDRAW=/cesta/ldraw node convert.mjs model.mpd auto.lbm   # první převod (pro zjištění viditelných dílků)
   node cull.cjs auto      # (server v kořeni love-bricks na :8765) – zjistí dílky viditelné zvenku
      ```
4. Export pro Blender: `LDRAW=/cesta/ldraw node togltf.mjs model.mpd auto.gltf auto.keep.json`
   (každá kombinace dílek+barva je jeden mesh, materiál `ld_<kód barvy>`, umístění jako uzly).
5. Zjednodušení v Blenderu (stačí Python balíček `bpy`, např. `pip install bpy`):
   ```bash
   python blender_opt.py auto.gltf auto.raw.glb 0.6         # plná verze (60 % ploch)
   python blender_opt.py auto.gltf auto-lite.raw.glb 0.25   # mobil (25 % ploch)
   ```
   Skript na každý dílek s víc než 120 trojúhelníky použije modifikátor Decimate (Collapse)
   a exportuje s GPU instancováním (stejný dílek = jedna geometrie).
6. Komprese (`@gltf-transform/*` a `meshoptimizer` z npm):
   `node compress.mjs auto.raw.glb ../../models/auto.glb` (a totéž pro `-lite`).
7. Zaregistruj auto v `js/builders.js` (`LD_CARS`: `glb`, kódy barev laku pro varianty) a v `js/products.js`.
   Web si sám vybere `-lite.glb` na dotykových zařízeních a malých obrazovkách.

Převaděč vynechá vnitřní plochy dílků (díry, trubičky pod kostkami, ozubení), dílky, které
nejsou zvenku vidět, a volné kousky mimo auto (klíček, štítek). Geometrie dílků se mírně
zjednoduší (meshoptimizer), tvar zůstává.

## Autoři modelů (licence CC BY 2.0, LDraw.org)

* Porsche 911 (10295) – Ulrich Röder
* Lamborghini Sián FKP 37 (42115) – Jens Brühl (na webu přebarveno na růžovou)
* Bugatti Chiron (42083) – Philippe Hurbain (na webu přebarveno na oranžovo-černou)
* Bonsaj (10281) – Orion Pobursky (varianta Sakura = přebarvené listy)
* Knihovna dílků – LDraw.org Parts Library

## Velikosti (plná / mobilní verze)

| Auto | Dílků | Trojúhelníky | Soubor |
| --- | --- | --- | --- |
| Porsche 911 | 1 128 | 189 tis. / 101 tis. | 1,04 MB / 0,74 MB |
| Lamborghini Sián | 2 728 | 490 tis. / 246 tis. | 1,51 MB / 1,21 MB |
| Bugatti Chiron | 2 370 | 410 tis. / 213 tis. | 1,37 MB / 1,08 MB |
| Bonsaj | 610 | 97 tis. / 61 tis. | 0,41 MB / 0,33 MB |
