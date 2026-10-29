# Scénář: AI TIP #01 – jak vzniklo denní 3D video v Claude Code

- **Podklad:** TUTORIAL_AI_TIP_01_postup.md (29. 10. 2026)
- **Cílová délka:** ~7 min
- **Hlas:** klon „Maty“, 1. osoba (mluví Teecee), v klidu, hovorově. Úvod „Zdarec bojs…“, konec „Zatím čus“.
- **Obraz:** 1920×1080, 30 fps. Výsledná videa AI_TIP_01 nejsou k dispozici → úvod z fotek v1 (Higgsfield) a 3D grafiky.

---

## K00 · Úvod

> VIZ: Telefon 9:16 s fotkami v1 (střídají se), obří „AI TIP #01“, štítky v1 / v2. Hub, odjezd na mapu.

{#hook} Zdarec bojs, dneska tu máme AI tip. Krátký deseti až patnáctisekundový video o AI, který bude každej den vycházet zdarma na Patreonu. Celý jsem ho udělal v Claude Code za jedno odpoledne, ve dvou verzích. První s AI fotkama a 2D grafikou, druhá je čistá 3D motion grafika.

{#map} Ukážu ti celej postup. Co jsem Claudovi dal, jak vznikl scénář, hlas, zvuky a engine, všechny chyby, co se cestou objevily, a jak se opravily.

{#go} Jdeme na to.

---

## K01 · Zadání

> VIZ: Cíl (free Patreon, ~60 členů → placený). Dva skilly jako soubory. Citace promptu (zkrácená). Konektory ElevenLabs + Higgsfield.

{#goal} Cíl je denní video pro free Patreon, kde máme zhruba šedesát členů. Fun facty a nápady, co s AI udělat, který by tě normálně nenapadly. A celý to má lidi převádět z free kanálu do placenýho, kde jsou celý tutoriály.

{#skills} Na začátek jsem Claudovi přetáhl dva skilly. Kompletní skill Aktualit: engine, brand, hlas vypravěče Aura, pravidla pohybu, přechody a sound design. A skill na tyhle dlouhý 3D tutoriály, ze kterýho si vzal fonty a principy kamery.

{#prompt} Pak přišel můj první prompt, diktovanej. V kostce: insane motion grafika jako naučný TikToky, prvních pět sekund úplně bomby, hodně flashů, transitions, masek a zvukovejch efektů. Efektive nenutit, dát ho až na konec. A CTA spíš jen do popisku.

{#mcp} A k tomu připojený konektory: ElevenLabs na hlas, zvuky a přepis, a Higgsfield na obrázky.

---

## K02 · Krok 1: Příprava na Macu

> VIZ: Terminál: chybí ffmpeg, Playwright; je Node 22 + Chrome. Příkaz npm. Fonty Inter + Geist Mono.

{#mac} Krok jedna, příprava. A hned první zádrhel: na Macu nebyl ffmpeg ani Playwright pro Python. Jen Node a Google Chrome.

{#npm} Claude to vyřešil po svým. Novej projekt na ploše a přes npm dva balíčky. Puppeteer core, který ovládá nainstalovanej Chrome, a ffmpeg static, což je hotová binárka ffmpegu.

{#fonts} A ze skillu 3D tutoriálu si zkopíroval fonty. Inter s češtinou a Geist Mono.

---

## K03 · Krok 2: Téma a scénář

> VIZ: Hledání (obecné výsledky). Téma obří. Prompt „Zeptej se mě na 10 otázek…“. Metafora regál vs. na míru. Scénář v1.

{#search} Krok dva, téma. Claude zkusil vyhledat trend vysvětlování přes obrázky a AI fun facty, jenže výsledky byly moc obecný.

{#topic} Tak vybral téma, který nezastará a dá se hned vyzkoušet. Přestaň se AI ptát. Nech ji, ať se ptá ona tebe. Technika je jednoduchá, napíšeš: zeptej se mě na deset otázek, než začneš.

{#metaphor} A metafora do obrázků: konfekce z regálu proti obleku šitýmu na míru.

{#script} Scénář první verze má třicet tři slov, zhruba jedenáct sekund.

---

## K04 · Krok 3: Hlas a zvuky

> VIZ: ElevenLabs karta (eleven_v4, Aura, 2 verze, tagy). Waveform se slovy (Scribe). 5 SFX dlaždic. Beat ✕ 1 s → syntéza v JS.

{#voice} Krok tři, hlas v ElevenLabs. Model eleven v4, hlas Aura a dvě verze. Na začátek textu tagy: confident, relaxed, brisk pace. Verze měly deset celých devět a jedenáct sekund, vzala se ta kratší.

{#scribe} Časy slov dělá ElevenLabs Scribe. Vybraná verze se přepíše a každý slovo dostane začátek a konec. To je základ, protože přesně na tyhle časy pak dopadá všechna grafika.

{#sfx} Zvukový efekty taky z ElevenLabs, každej asi za šestnáct kreditů. Boom, whoosh, flash, psaní na klávesnici a glitch.

{#beat} A beat? Ten vrátil jen jednu sekundu, protože omezenej konektor hudbu neumí. Tak ho Claude syntetizoval sám v JavaScriptu. Trap, sto čtyřicet BPM, kick, clap, hi-haty a basa.

---

## K05 · Krok 4: Fotky z Higgsfieldu

> VIZ: Pět fotek p0–p4 (skutečné generace z Higgsfieldu), u každé zkrácený prompt. Čísla: 752×1344 → 1080×1920, 1,25 kreditu.

{#pin} Krok čtyři, obrázky. Pinterest použít nejde, kvůli autorským právům. Takže Claude vygeneroval vlastní fotky ve stylu niche Pinterestu, v Higgsfieldu modelem GPT Image, na výšku.

{#photos} Pět fotek. Ruka s mobilem ve tmě. Prázdný kožený křeslo pod reflektorem. Nekonečný řady stejnejch šedejch obleků. Ruce krejčího, který křídou značí látku. A otevřená kniha se záložkou.

{#upscale} Přišly v malým rozlišení, tak je ffmpeg zvětšil na plnou výšku telefonu. Celkem to stálo jeden a čtvrt kreditu.

---

## K06 · Krok 5: Engine první verze

> VIZ: Schéma HTML → Chrome → ffmpeg. Tři principy. Motion blur (3 mezisnímky). Šest scén v řadě + přechody.

{#engine} Krok pět, engine první verze. Stránka v HTML, Chrome ji vyfotí snímek po snímku a ffmpeg z toho složí video.

{#rules} Má tři principy. Všechno je deterministický, každej snímek závisí jen na čase. Prvky dopadají na slova, scéna začíná přesně na slově napiš. A každej prvek si sám registruje svůj zvuk, v první verzi jich bylo osmdesát dva.

{#blur} K tomu motion blur: tři mezisnímky se smíchaj do jednoho, třicet snímků za sekundu.

{#scenes} Kostra má šest scén. Hook s obřím přestaň, křeslo s otazníkem, karta s promptem, regál, odhalení na míru a outro se záložkou. A mezi nima flashe, whip, strobe a zoom.

---

## K07 · Krok 6: Chyby první verze

> VIZ: Čtyři karty chyb (červené) → oprava (zelená). LUFS měřák −27 → −14. NaN.

{#bug1} A chyby. Zaprvé přetečení zásobníku: funkce seek volala sama sebe. Stačilo ji přejmenovat.

{#bug2} Zadruhé kontaktní list. Spodní půlka obrazu prázdná, cenovka přes text a konec nečitelnej. Posunuly se pozice a pod koncovej text přišla tmavá pilulka.

{#bug3} Zatřetí zvuk. Místo mínus čtrnácti mělo video mínus dvacet sedm LUFS. A hlavní příčina? Hudba byla celá NaN, tedy neplatný čísla. Filtr nad šestinou vzorkovací frekvence exploduje. Frekvence se omezila, přibyla pojistka a hlasitost se dorovnala.

{#bug4} A dvě drobnosti. Zoom přechod ukázal černej okraj, tak nová scéna teď přilétá zvětšená. A konec stál skoro tři sekundy na místě, tak se zkrátil a záložka dýchá.

{#v1done} Render první verze trval minutu a půl.

---

## K08 · Moje zpětná vazba

> VIZ: Citace feedbacku po bodech (tmavá karta). Pak co si Claude vzal + techniky z After Effects jako dlaždice.

{#fb} No a pak moje zpětná vazba. Žádný AI fotky, chci motion grafiku. Místo á í se má AI vyslovovat slangově, ájí. Dynamika dobrá, grain taky, ale chybí tam pohyb. Kamera, zoom, panely ve 3D, text vystoupí jako 3D slovo, něco spadne. Ulož si to na konci pryč. Víc masek a přepálený intro. A laťka jako z After Effects.

{#learn} Claude si z toho vzal jasný body. Pryč s fotkama, jen 3D prostor. Do textu pro hlas píše ájí, plynule. Kamera se pořád hýbe. A nastudoval techniky z After Effects: 3D kamera, hloubka ostrosti, vytaženej 3D text, kinetická typografie, roztříštění, kreslení čar a kruhový masky.

---

## K09 · Krok 7: Druhá verze ve 3D

> VIZ: Scénář v2 (bez „Ulož si to“). Schéma kamery (cíl, vzdálenost, yaw/pitch/roll, ohnisko). 3D vytažený text z vrstev. Krabice, stíny, koule, podlaha.

{#v2voice} Krok sedm, druhá verze. Novej hlas, bez ulož si to a s ájí. Zase dvě verze, kratší má deset celých dva sekundy. Zrychlení jedna celá nula osm a celý video má jedenáct sekund.

{#css} A novej engine. Celej 3D svět je v CSS, žádnej WebGL. Kamera jako v After Effects: cíl, vzdálenost, natočení a ohnisko. Klíčový snímky s křivkama, k tomu chvění z ruky a otřesy při dopadech.

{#extrude} 3D text je šestnáct až osmnáct vrstev za sebou, boky tmavší a čelo s gradientem. Kreslí se dvakrát větší a zmenší se na půlku, aby nebyl rozmazanej.

{#world} K tomu krabice s tloušťkou, kontaktní stíny, lesklý koule s hloubkou ostrosti a podlaha s modrou mřížkou. Masky, flash a strobe jsou ve 2D vrstvě nad tím.

---

## K10 · Krok 8: Šest stanic

> VIZ: Šest stanic ve 3D prostoru, kamera letí od jedné k druhé, u každé zkrácený popis + slova.

{#st1} Kostra druhý verze je šest stanic ve 3D prostoru. První je hook. Čtyři kruhový masky, písmena přestaň padají jedno po druhým a bublina se roztříští na osmnáct střepů do kamery.

{#st2} Druhá: žetony ty a AI vyskočí z podlahy a otazník přeskočí od tebe k AI.

{#st3} Třetí: na slovo napiš přiletí 3D panel a prompt se píše do rytmu hlasu. Desítka vystoupí jako 3D číslo a vybuchne spirála deseti karet s otázkama.

{#st4} Čtvrtá: kamera proletí uličkou osmdesáti šedejch karet, obraz zešedne a jedna karta vyjede s cenovkou průměr.

{#st5} Pátá je drop. Flash, naskočí hudba, krejčovskej metr se namotá kolem karty, steh se nakreslí a karta se přebarví na tvoje odpověď.

{#st6} A šestá, outro. 3D logo efektive dopadne s odskokem.

---

## K11 · Krok 9: Chyby ve 3D

> VIZ: Pět chyb jako schémata: malé → blíž, skok kamery, prvek za kamerou (near-clip), podlaha jako disk, kontaktní list 4 kola.

{#small} I tady byly chyby. Všechno bylo moc malý, na mobilu nečitelný. Kamera šla o třicet až čtyřicet procent blíž.

{#jump} Kamera mezi stanicema skočila zpátky, protože poslední klíč předchozí stanice ležel až v další. Teď se při přechodu smažou.

{#behind} Černý artefakty a obří deformace. Co proletí za kameru, vykreslí CSS 3D špatně. Řešení: prvek se blízko kamery zprůhlední a schová.

{#floor} Úplně prázdný snímky. Podlaha velká deset tisíc pixelů zasahovala za kameru. Teď je to disk posunutej před kameru.

{#crop} A pak ořezy, šedá z regálu prosakující do další stanice a obdélník na obloze. Kontrola kontaktním listem, čtyři kola, a až pak plnej render. Ten trval čtyři minuty.

---

## K12 · Krok 10: Zvuk

> VIZ: Řetězec hlasu (atempo, EQ, kompresor). Křivka beatu: dolní propust přes regál, zastavení pásky, drop. Ducking. 112 událostí, −14 LUFS.

{#chain} Krok deset, zvuk. Hlas je zrychlenej, ořezaný basy, trochu zvednutý středy a výšky a kompresor.

{#drop} Beat přes regál ztlumí výšky, třetinu sekundy před dropem se zastaví jako páska a na flash zase naskočí. Pod hlasem se hudba stáhne až o padesát pět procent.

{#master} Sto dvanáct zvukovejch událostí, každej přechod má svoje zvuky. A master na mínus čtrnáct LUFS.

---

## K13 · Cena a poučení

> VIZ: Velká čísla: ElevenLabs ~870 kreditů, Higgsfield 1,25, čas 1 h + 1,5 h. Pak 8 pravidel.

{#cost} Kolik to stálo? ElevenLabs zhruba osm set sedmdesát kreditů, Higgsfield jeden a čtvrt. Čas: první verze hodinu, druhá hodinu a půl, protože engine vznikal od nuly. Další díl ze šablony už je jen scénář, hlas, úprava stanic a čtyři minuty renderu.

{#rules} A poučení pro další díly. AI se nečte á í, ale ájí. Žádný ulož si to, značka jen na konci a CTA jen v popisku. Žádný AI fotky, čistá 3D motion grafika a kamera se pořád hýbe. Prvních zhruba jeden a půl sekundy přepálenejch. Vždycky kontaktní list před renderem. Nic nesmí za kameru. Beat syntetizovat. A každej díl jiný animace, jedna animace maximálně ve dvou videích.

---

## K14 · Konec

> VIZ: Shrnutí → odjezd na mapu → „Díky. efektive.cz“.

{#end} Takže tak. Z jednoho promptu a dvou skillů je šablona na denní AI tipy a další díl už je jen o scénáři a hlasu. Zatím čus.
