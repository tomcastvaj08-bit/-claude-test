# Love Bricks – návrh e-shopu

E-shop s dárky z kostek, kde všechno vypadá jako kostky: tlačítka, karty, pozadí (podložka s výstupky), písmo i ikonky (mozaika z 1×1 placek). Je to zatím jen ukázka, nic se neprodává.

Hlavní stránka je **3D galerie v pohledu první osoby**: nekonečná bílá chodba, ve které stojí střídavě vpravo a vlevo obří květiny (zhruba výška člověka) a auta v životní velikosti. Exponáty se skládají z kostek, jak k nim přicházíš. Pohyb: scroll, swipe nahoru/dolů, šipky ▲/▼ (klepnutí = k dalšímu exponátu, podržení = chůze) nebo klávesy ↑/↓/W/S. Klepnutí na exponát (nebo jeho štítek) otočí kameru k němu a vyjede panel s popisem, barvami a košíkem; ←/→ přepíná exponáty, Esc zavře.

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
| `js/flowers.js` | květiny: orchidej, mini orchidej, kytice tulipánů, malé rostlinky, kvetoucí kaktus, chryzantéma, lopatkovec, kvetoucí slivoň, bonsaj |
| `js/cars.js` | auta z panelů: Bugatti Chiron, Lamborghini Huracán Tecnica, Lamborghini Sián (růžové), Ferrari Daytona SP3, McLaren P1, Mercedes-AMG G 63 & SL 63, Bugatti Vision GT |
| `js/builders.js` | registr všech modelů |
| `js/figures.js` | panáčci: blondýnka v růžových šatech (srdíčka místo očí) a kluk s tetováním kotvy, který ukazuje do galerie |
| `js/stage3d.js` | (přehled) jeden WebGL canvas, který kreslí 3D jen do „slotů“ v HTML |
| `js/common.js` | hlavička, patička, košík (localStorage), cookie lišta a nastavení, toast |
| `js/products.js` | ukázková data produktů (ceny, počty dílků, varianty) |
| `vendor/three/` | three.js r170 (MIT) – lokálně, bez CDN |
| `fonts/` | Bungee + Rubik (SIL OFL) – lokálně |

## Jak funguje 3D

* Žádné fotky ani předrenderovaná videa: každý model je seznam kostek, které se ve skutečném čase skládají v prohlížeči.
* Kostky stejného tvaru a barvy se kreslí jedním `InstancedMesh`, takže model se stovkami dílků stojí jen 10–30 draw callů.
* Celá stránka má **jediný WebGL kontext**. 3D se kreslí do obdélníků HTML prvků (scissor rendering), takže sedí přesně v layoutu a funguje i na mobilu.
* Po načtení se všechny scény v nečinnosti předpřipraví (shadery a GPU buffery), aby při scrollu nevznikaly záseky.
* Pokud zařízení nestíhá, renderer si sám sníží rozlišení. Respektuje se i `prefers-reduced-motion`.

### Výměna za modely z Blenderu

Modely se dají později nahradit exportem z Blenderu (`.glb`). Ve `stage3d.js` stačí ve funkci `create` slotu vrátit načtenou scénu (`GLTFLoader`) místo `createModel(...)`. Animace skládání pak potřebuje, aby každá kostka byla samostatný objekt.

## Ověřeno (headless Chromium, 390×844 a 1440×900)

Galerie:
* vstup, chůze šipkou, kolečkem i swipem, klik na štítek i exponát → detail, změna barvy se projeví na 3D modelu, přidání do košíku, další/předchozí exponát, návrat do chodby – bez chyb v konzoli
* při chůzi: JS ~2,6 ms na snímek (~11 ms při 4× zpomaleném CPU); ~230 draw callů a ~180 tis. trojúhelníků v záběru
* exponáty jsou obří (květiny 2,3–4 m, auta ~1,4× skutečné velikosti) a stojí těsně u cesty

Přehled kolekce:

* žádné chyby v konzoli; košík, varianty barev, filtry, cookie lišta i nastavení, mobilní menu a právní stránky fungují
* žádné horizontální přetečení na mobilu
* JS smyčka při scrollu přes celou stránku: v průměru ~1,8 ms na snímek, při 4× zpomaleném CPU ~8 ms; žádné dlouhé úlohy (po zahřátí)
* bez 3D běží scroll v testovacím prostředí na 60 fps; skutečná fps s 3D je potřeba změřit na telefonu (testovací kontejner nemá GPU)

## Před spuštěním prodeje

* doplnit firemní údaje do právních stránek a nechat je zkontrolovat právníkem
* napojit skutečný košík/pokladnu, platby a dopravce
* ověřit u právníka používání názvů automobilek u prodávaných modelů
