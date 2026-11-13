# Love Bricks – návrh e-shopu

E-shop s dárky z kostek, kde všechno vypadá jako kostky: tlačítka, karty, pozadí (podložka s výstupky), písmo i ikonky (mozaika z 1×1 placek). Je to zatím jen ukázka, nic se neprodává.

Hlavní stránka je **3D galerie v pohledu první osoby**: nekonečná chodba s podlahou z bílých lesklých hladkých dílků 2×1. Exponáty – květiny – stojí vždy ve **dvojicích naproti sobě**. Vidět je jen to, co je blízko: dvojice se objeví, spadne z nebe a poskládá se, až k ní dojdeš (dál je chodba prázdná). Shora sjede na tenkém drátku blikající tlačítko **Dál** – klik tě s rozmazáním „teleportuje“ k další dvojici. Chodit jde i scrollem, swipem nebo klávesami ↑/↓/W/S. Klepnutí na exponát otočí kameru k němu a vyjede panel s popisem, barvami a košíkem; ←/→ přepíná exponáty, Esc zavře.

Klasická scrollovací verze s katalogem a filtry zůstala jako **Přehled kolekce** (`prehled.html`).

## Spuštění

Jde o statický web bez build kroku. Stačí ho servírovat přes libovolný HTTP server (ES moduly přes `file://` nefungují):

```bash
cd love-bricks
python3 -m http.server 8765
# → http://localhost:8765/
```

## Struktura

| Soubor | Co dělá |
| --- | --- |
| `index.html` + `js/gallery.js` + `css/gallery.css` | 3D galerie (pohled první osoby, nekonečná chodba, detail exponátu) |
| `prehled.html` + `js/main.js` | přehled kolekce: scrollovací scény produktů, pro koho, katalog s filtry, newsletter |
| `obchodni-podminky.html`, `ochrana-osobnich-udaju.html`, `cookies.html` | právní stránky (vzorové texty, údaje v `[závorkách]` doplnit) |
| `css/style.css` | celý vizuální systém kostek (`.brick`, `.brick-btn`, `.brick-card`, `.tile-print`, výstupky) |
| `js/models.js` | jádro 3D stavebnice: dílky, materiály, animace skládání |
| `js/builders.js` | registr všech modelů (bonsaj, kytice i květiny ze souborů `.glb`, procedurálně jen srdce) |
| `js/solid.js` | načte `.glb` z Blenderu a jednou ho slije do jednoho modelu (pár draw callů, za běhu se nic nepřepočítává) |
| `js/ldmodel.js`, `js/ldbake.worker.js` | starší načítání po dílcích – používá ho jen nástroj `tools/ldraw/cull.html` |
| `models/*.glb` | bonsaj a kytice z LDraw (Bonsaj 10281, Kytice květin 10280) a květiny složené z dílků (`tools/flowers`), vše přes Blender; `*-lite.glb` = odlehčená verze pro mobil |
| `js/figures.js` + `models/figure.json` | figurky z originálních dílků: kluk v bílém tričku a modrých kalhotách, holka s culíky (vlasy 35701), krátkýma nohama (41879a) a v růžové mikině; potisk trupu a obličeje je namalovaný |
| `js/stage3d.js` | (přehled) jeden skrytý WebGL kontext; každý 3D slot má vlastní plátno, do kterého se scéna zkopíruje – při scrollu nic nezaostává |
| `js/common.js` | hlavička, patička, košík (localStorage), cookie lišta a nastavení, toast |
| `js/products.js` | ukázková data produktů (ceny, počty dílků, varianty) |
| `vendor/three/` | three.js r170 (MIT) – lokálně, bez CDN |
| `fonts/` | Bungee + Rubik (SIL OFL) – lokálně |

## Jak funguje 3D

* Žádné fotky ani předrenderovaná videa: všechno jsou 3D modely z dílků, vykreslované v prohlížeči.
* Na přehledu se každá scéna složí sama za necelou vteřinu, jakmile se objeví – není potřeba „doscrollovat“ skládání.
* Kostky stejného tvaru a barvy se kreslí jedním `InstancedMesh`, takže model se stovkami dílků stojí jen 10–30 draw callů.
* Celá stránka má **jediný WebGL kontext**. Každý 3D prvek má vlastní 2D plátno přímo v obsahu stránky, do kterého se scéna po vykreslení zkopíruje – při scrollu proto jede přesně s textem a nikdy se neopožďuje.
* Po načtení se všechny scény v nečinnosti předpřipraví (shadery a GPU buffery), aby při scrollu nevznikaly záseky.
* Pokud zařízení nestíhá, renderer si sám sníží rozlišení. Respektuje se i `prefers-reduced-motion`.

### Modely z Blenderu

Bonsaj, kytice a květiny se převádějí z LDraw přes Blender do komprimovaných `.glb` (meshopt); telefony načítají odlehčené `-lite.glb`. Postup je v `tools/ldraw/README.md` a `tools/flowers/README.md`.

## Ověřeno (headless Chromium, 390×844 a 1440×900)

Galerie:
* vstup, chůze šipkou, kolečkem i swipem, klik na štítek i exponát → detail, změna barvy se projeví na 3D modelu, přidání do košíku, další/předchozí exponát, návrat do chodby – bez chyb v konzoli
* při chůzi: JS ~3,4 ms na snímek; až ~320 draw callů a ~250 tis. trojúhelníků v záběru
* exponáty jsou obří (květiny 2,3–4 m) a stojí těsně u cesty

Přehled kolekce:

* žádné chyby v konzoli; košík, varianty barev, filtry, cookie lišta i nastavení, mobilní menu a právní stránky fungují
* žádné horizontální přetečení na mobilu
* JS smyčka při scrollu přes celou stránku: v průměru ~1,8 ms na snímek, při 4× zpomaleném CPU ~8 ms; žádné dlouhé úlohy (po zahřátí)
* bez 3D běží scroll v testovacím prostředí na 60 fps; skutečná fps s 3D je potřeba změřit na telefonu (testovací kontejner nemá GPU)

## Před spuštěním prodeje

* doplnit firemní údaje do právních stránek a nechat je zkontrolovat právníkem
* napojit skutečný košík/pokladnu, platby a dopravce
