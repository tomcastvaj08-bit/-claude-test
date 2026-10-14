# Rozbor referenčních reelů → pohybový slovník enginu

Tři reference od uživatele (snímky v `docs/ref/`; `*-sheet` = 2 sn./s celé video, ostatní = 10 sn./s detail s časovým kódem):

| # | video | délka | styl |
|---|---|---|---|
| v1 | „Imagine building anything… Widgets“ (dnyxstudios) | 16 s | Apple keynote: bílá/černá, malé písmo, widgety |
| v2 | „sleeko / HowDo“ promo | 48 s | UI v rámečku s fialovým gradientem, záložky kapitol |
| v3 | „These days… Everywhere… Work. Organised.“ (Notion) | 24 s | světle šedé pozadí, 3D ikony, modrá spojnice, pastelové karty |

## 1. Co mají společné (to, co dělá „After Effects“ dojem)

1. **Rytmus střihů 0,8–1,5 s.** Každý obraz = jedna myšlenka. Nic nevisí; jakmile je sdělení přečtené, už se to hýbe dál.
2. **Útok rychle, dojezd dlouze.** Příchody trvají 0,25–0,4 s do ~90 % a pak se 0,3–0,6 s jemně „dopékají“. Odměřeno: „These days“ (v3 0,1→0,5 s) z rozmazání do ostrosti, karty ve v3 (1,2→1,6 s) z −100 % na místo, 80 % dráhy za první třetinu času. Odpovídá křivce **`cubic-bezier(0.05, 0.7, 0.1, 1)`** → v enginu `snapOut`. Pro klidnější pohyby `brandOut = (0.16, 1, 0.3, 1)`.
3. **Odchody jsou krátké a „whip“.** 0,12–0,25 s se zrychlením (ease-in-expo), s velkým směrovým rozmazáním. Nikdy dlouhý fade-out.
4. **Rozmazání = pohyb i hloubka.** Všechno rychlé má motion blur (v1 widgety létající na černé, v3 telefon při rotaci). Statické věci v pozadí mají hloubkovou neostrost. → engine: sub-frame motion blur (4×) + `filter: blur()` podle rychlosti a hloubky.
5. **Text je malý a čistý.** Ve v1/v2 zabírá text jen ~3–4 % výšky, regular/medium řez, hodně vzduchu kolem. Velký text (v3 „Everywhere“, „progress slows“) jen jako úder, a hned odjede. Žádné verzálky v hlavním textu.
6. **Slova přicházejí po jednom, na hlas.** Každé slovo: rozmazané → ostré, posun 20–40 px ve směru čtení, nové slovo je chvíli **tónované akcentem** (světle modrá / fialová) a během ~0,3 s „ztmavne“ do inkoustu (v1 „it's *there*“, v2 „Every day, *there's*“). Řádek se **průběžně centruje**, jak slova přibývají (v1 „Imagine building anything“).
7. **Match cut / morph.** Konec jednoho obrazu = začátek dalšího na stejném místě: text se rozmaže a na jeho místě se z rozmazání vynoří objekt (v3 0,6–0,8 s „These days“ → ikona Find My), objekt se přiblíží a kamera jím **proletí** do další scény (Find My → mapa). To samé dělá náš kalendářový hook.
8. **Kamera se pořád hýbe.** Pomalé dojíždění, drift, sledování spojnice (v3), orbit (v2). Nikdy úplně statický záběr.
9. **Barva drží jednotu.** v3: světle šedé pozadí + jedna modrá spojnice + pastelové tóny karet. v2: bílá „obrazovka“ + fialové mlhy. Max 2 akcenty.
10. **Zvuk**: každý pohyb má svůj whoosh/pop/click, dopady sedí na snímek.

## 2. Katalog technik (a kde jsou v enginu)

| technika | reference | jak funguje | engine |
|---|---|---|---|
| Kinetická věta | v1 0–1 s, 7–9 s; v2 6–9 s | slova po jednom, blur 14→0 px, x +40→0, scale 1,06→1, barva akcent→inkoust, šířka slova 0→plná ⇒ řádek se centruje | šablona `words`, helpery `kineticWords/animateWords` |
| Inline UI v textu | v1 1–2,5 s | „Imagine [pole s promptem] anything“ – pilulka se roztáhne mezi slovy a sama se do ní píše, kurzor bliká, tlačítko odeslat pulzne | šablona `prompt` |
| Stoh karet | v3 13,7–15,3 s | pastelové karty (červená/modrá/zelená výplň + ikona v barvě) vjíždějí zleva s velkým motion blurem po ~0,25–0,4 s, stoh se drží opticky na středu; nakonec se celé zmenší a nad ním dopadne nadpis („Work together“) | šablona `stack` |
| Spojnice ikon | v3 3–9 s | modrá linka (6–7 px, kulaté konce, jemný stín) se kreslí od ikony k ikoně, na čele kolečko; kamera jede za čelem linky; ikony vyskočí s malým překmitem (~3 %) když k nim linka dojede | šablona `connect` |
| Prolétnutí přes objekt | v3 1,0–1,4 s; náš hook | přiblížení do objektu, jeho obsah se stane další scénou; volitelně 1 snímek glitch/chroma | `transition: "zoom"`, hook |
| Flicker → vějíř | v1 9,4–10,2 s | jedna karta na místě rychle přepíná varianty (0,1 s/variantu, s lehkým rozmazáním), pak se všechny rozevřou do překrývající se řady | šablona `fan` |
| Orbit / koláž | v2 11–13 s | karty a ikony na elipse kolem textu, pomalu rotují; vzadu menší + rozmazané, vpředu větší + ostré; přilétají z dálky | šablona `orbit` |
| Rozptýlené ikony kolem slova | v2 6–9 s | drobné ikony kolem slova se přeskupují a vyměňují | `custom` (orbit s malými ikonami) |
| Konstrukční čáry | v2 22 s („S im pl e“) | písmena rozestoupená, kolem vodicí linky a kotevní body, pak se slijí do loga | `custom` – návrh v sekci 4 |
| Odhalení loga maskou | v2 24–25 s; v1 konec | značka (kolečko) se objeví, písmena vyjedou zpoza ní | outro |
| Velký úderný text + whip | v3 16–18 s | text se zvětšuje (push-in), pak odjede doleva s horizontálním blur | `transition: "whip"` |
| 3D telefon | v3 18–21 s, v1 13–15 s | telefon s lehkým natočením, rotace kolem Y, aplikace kolem | šablona `phone` (3D náklon) |
| Kapitoly | v2 celé | spodní záložky Intro / Problem / Use Case / CTA, aktivní se plní | HUD: počítadlo `01 · 06` + progress linka |

## 3. Typografie a materiály (přeloženo do brandu EFEKTIVE)
- Reference: SF Pro / Inter regular–medium pro větu, bold/heavy jen pro úderná slova. U nás: **Inter** (věta 700, úder 800), akcent modrá `#2f6bed`, tónování nových slov světlou modrou `#5b8cf5`.
- Karty: velký radius (40–48 px na 1080 šířku), pastelová výplň **nebo** bílá s jemnou linkou, stín široký a měkký (`0 30px 60px -30px`), žádné tvrdé obrysy.
- Pozadí: světlé, s velmi jemnými barevnými mlhami a vinětou, nikdy čistě bílá plocha bez života.
- Ikony: jednoduché linkové (stroke 2,6–3 px) nebo „app tile“ s bílým čtvercem a barevnou ikonou.

## 4. Pravidla pro skládání epizody
1. Střídej typy: `words` → vizuál (`stack`/`connect`/`fan`/`phone`) → `words` → … Dvě textové scény za sebou jen když je druhá úderná (`size: "xl"`).
2. Přechody: default `push`; `whip` při změně tématu nebo zrychlení; `zoom` když scéna „vstupuje dovnitř“ věci; `blur` pro klidné navázání. Max 1× `zoom` na video.
3. Každý prvek, který vyjede, musí mít v řeči slovo, na které vyjede (`at`).
4. Na konci každé scény ještě ~0,2 s klidu, pak odchod (engine to dělá sám).
5. Konstrukční čáry / rozptýlené ikony / glitch řeš přes `custom` scénu a když se osvědčí, přesuň ji do `scenes-pro.js`.

## 5. Reference v4 – „Claude motion reel“ (udělaný přes Claude Code)
Snímky: `docs/ref/v4-*.jpg`. 14 s, natočeno z obrazovky notebooku. Je to sled krátkých „showreel“ obrazů, každý 0,8–1,5 s, mezi nimi tvrdé střihy a barevné záblesky.

| čas | co se děje | proč to funguje | engine |
|---|---|---|---|
| 0,0–1,4 | tmavý rastr teček, jiskra proletí a natáhne se do světelné linky | „probuzení“ obrazu jedním světelným bodem | `transition: "streak"` |
| 1,4–3,0 | bílý záblesk → plná oranžová, obří zúžený nápis CLAUDE. + drobné popisky (SHOWREEL — 2026) | kontrast měřítek: obří slovo × mikro text | šablona `bigtype` |
| 3,2–4,8 | 3D vlna z kostiček v gradientu, skleněná koule obíhá | procedurální 3D pole = „wow“ bez obsahu | (mimo brand – nepoužito) |
| 5,0–5,4 | EVERY na bílé → SINGLE opakované v řádcích (obrysový vzor) | typografie jako tapeta | `bigtype` (vzor řádků na pozadí) |
| 5,5–6,0 | barevný stroboskop: modrá → fialová → oranžová → bílá, 1 snímek každá | rytmický střih bez pohybu | `transition: "strobe"` |
| 6,0–7,6 | +312 % – číslice se točí jako tachometr (s rozmazáním), roste graf, kroužek | čísla „žijí“ | šablona `metric` (jen se skutečnými čísly!) |
| 8,0–10,0 | tisíce čárek proudí, slijí se do prstence teček, prstenec exploduje paprsky | částice = energie, přechod do další scény | šablona `particles` |
| 10,0–11,0 | UI karta „Render queue“ na modré | produkt v kontextu | `stack` / `phone` |
| 11,0–12,6 | obrys kruhu s tečkami se morfuje do hvězdy/kytky | organický morf | (custom) |
| 13,0–14,0 | tmavé logo s jiskrou | podpis | outro |

**Poučení:** (1) každý obraz má jednu silnou kompoziční myšlenku (obří slovo, číslo, prstenec), (2) střídání barevných ploch je samo o sobě rytmus, (3) mikro popisky v rozích (mono/verzálky) dávají „editorial“ rám, (4) žádné dva texty přes sebe – nový text přijde až na čistou plochu.

## 6. Reference v5 – „tabule“ (InVideo MCP reel) → nový hook `board`
Snímky: `docs/ref/v5-hook.jpg` (8 sn./s), `docs/ref/v5-frames.jpg` (plné rozlišení).

**Proč první 3 sekundy fungují:**
- **Skutečné prostředí místo grafiky:** zelená školní tabule (křídový prach, rozmazané stopy po houbě), vlevo dřevěná stěna, tabule v tmavém dřevěném rámu. Na tabuli polaroidy s červenými špendlíky a ohnutým rohem, ručně psané popisky.
- **Světlo:** teplé slunce přes žaluzie = šikmé zlaté pruhy přes celou scénu, teplé ladění (soft-light oranžová), silná viněta, zrno, plovoucí prach ve světle, světelný „leak“.
- **Kamera:** 0–0,9 s rychlý švih po stěně na tabuli (počáteční natočení ~30°, rozjezd prudký, dojezd měkký), **směrové rozmazání pohybu** jen ve směru jízdy (dlouhá závěrka ~180–360°). Pak zrychlující najetí, **střih uprostřed nájezdu** na bližší záběr a krátké dojetí. Celou dobu jemné „z ruky“ chvění.
- **Typo:** čisté bílé písmo + jedno ručně psané křídové slovo, drobné křídové poznámky po tabuli.

**Náš hook `board` (engine/hook-board.js):** švih ze dřeva na tabuli → malý odtrhávací kalendář připíchnutý na tabuli → zrychlující najetí → střih blíž + dojezd → dnešní datum přeškrtne červená fixa (dva tahy) → zavane vítr a listy se přetočí (ohnou se ke kameře přes vazbu a odletí) až na datum novinky → zakroužkování fixou + křídou „novinka!“ se šipkou → průlet do čísla → teplý záblesk → čistá motion grafika.
Zvuky: `camera_whip`, `wind_gust`, `marker_scratch`, `page_flutter` (+ swish, impact, dive, shimmer).
Volba hooku: `"hook": "board"` (výchozí) nebo `"hook": "calendar"` (iOS kalendář) v `episode.json`, globálně `config.series.hook`.

### 6b. Poučení z prvního pokusu (CSS tabule = „AI-kové, laciné“)
- Prostředí z CSS gradientů a šumu nikdy nevypadá skutečně → **fotografické podklady** (Higgsfield 4K) a my jen kompozitujeme objekty, které musí být přesné (kalendář s daty).
- Kompozit musí převzít světlo scény: přes papír se násobí (multiply) jas podkladu + soft-light barva podkladu → pruhy světla a stín z fotky leží i na kalendáři.
- Formát 16:9, **24 fps a 180° závěrka** (6 dílčích snímků) – rozmazání pohybu je pak filmové, ne digitální.
- Opar/halace: rozmazaná kopie podkladu přes sebe v režimu screen + zvednuté černé + světelný leak + těžká viněta + zrno.
- Pohyb „jako kameraman“: švih s ~2 % přejetím a dorovnáním, zrychlující dolly, střih uprostřed nájezdu, ruka = několik nesouměřitelných nízkých frekvencí (ne čistý sinus).

### 6c. Hook v3 (zpětná vazba k v8)
- Kamera na začátku: plynulý **pojezd** podél zdi (translace + lehký push, křivka bezier(.38,0,.12,1)), žádné natáčení rotateY – to působilo „nakřivo“.
- Zblízka musí mít kalendář stejnou texturu jako zdálky → jedna fotka, jedna kamera, papír z fotky papíru + světlo z podkladu, rozlišení canvasu 2,2× (ostré i při zoomu 2×).
- Odtrhávané listy působily nerealisticky → skutečný měsíční kalendář, jen zakroužkování data.
- Vítr: listy papíru se ohýbají (řetěz 3D proužků), lehčí papír víc, kalendář nejmíň; náraz větru putuje od okna.
- Rozostřené listí v popředí (předrozmazané sprity, paralaxa 1,8–2,3× kamery) = hloubka ostrosti f/1.8.
- Přechod do grafiky přes papír: ponoření do papíru → bílá → grafika „roste“ dál (scale 0.86→1) na jemné textuře papíru.
- V grafice 1× 3D iPhone (Apple styl, psaní na displeji) a 1× `invert` záblesk v půlce videa.
