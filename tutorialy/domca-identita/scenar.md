# Scénář: Jak jsem se proměnil v Domču – celý postup (Patreon tutoriál)

- **Cílová délka:** ~7 min
- **Hlas:** klon „Maty“ z ElevenLabs, 1. osoba (mluví Teecee)
- **Obraz:** 1920×1080, 30 fps

**Legenda:** `{#cue}` = bod, na který se váže obraz · `> VIZ:` = co je na plátně (nečte se).

---

## K00 · Úvod (~0:50)

> VIZ: Plátno ve tmě. Uprostřed karta s hotovým videem a přehraje se celé s původním zvukem (vložka „final“, 11,1 s: 0–6 s Domča na ulici, v 6 s střih na mě na nádraží). Pak vedle sebe dvě karty synchronně: originál („original“) a výstup z Genjutsu („genjutsu“), štítek „AI“. Lusknutí = bílý záblesk, kamera odletí na hub.

{#hook} Tohle nejsem já. Teda jsem, ale vypadám jako Domča a mluvím jejím hlasem.

{#how} Natočil jsem úplně obyčejný talking head video a vyměnil v něm svoji identitu za její. Obličej, vlasy, pusu, hlas. A pohyby, mimika a načasování zůstaly moje.

{#map} V tomhle tutoriálu ti ukážu celej postup. Co nefungovalo, co mě překvapilo a hlavně proč je hlas mnohem víc práce, než si myslíš. Obraz byla zhruba třetina práce. Zbytek byl hlas.

{#go} Jdeme na to.

---

## K01 · Výsledek a nástroje (~0:45)

> VIZ: Uzel „NÁSTROJE“. Uprostřed karta „talking head“, kolem ikony: Seedance, Higgsfield Genjutsu, ElevenLabs (klon, Voice Changer, generátor), CapCut na telefonu. Čáry se kreslí na slova. Seedance dostane šedý přeškrtnutý štítek.

{#tools} Nástroje jsou čtyři.

{#t1} Seedance, kterej jsem zkoušel jako první a nevyšel.

{#t2} Higgsfield Genjutsu, kterej udělal výměnu obličeje a překvapil mě.

{#t3} ElevenLabs na hlas. Klon jejího hlasu a pak tři různý modely, protože jeden na to nestačil.

{#t4} A CapCut. Všechno jsem dal dohromady normálně na telefonu.

---

## K02 · Krok 1: Natoč talking head (~0:40)

> VIZ: Uzel „KROK 01“. Originál („original“, 6,2 s, 4K 30 fps, selfie z ruky na ulici) v kartě, vedle callouty: „6 sekund“, „z ruky, za chůze“, „venku, denní světlo“, „kšiltovka + vousy → pryč“.

{#s1} Krok jedna. Natoč obyčejný talking head.

{#shot} Žádná věda. Šest sekund, telefon v ruce, jdu po ulici a mluvím do kamery. Venku, normální denní světlo.

{#why1} Tohle video je kostra všeho. Pohyb hlavy, mimika, pohyb pusy i načasování řeči, všechno se bere odsud. Takže co natočíš tady, to uvidíš ve výsledku.

---

## K03 · Krok 2: Seedance na tohle není (~0:30)

> VIZ: Uzel „KROK 02“. Karta Seedance · edit mode. Dva štítky: „vzhled ✓“ zeleně, „lip sync ✕“ červeně. Karta se zešedí a odsune stranou.

{#s2} Krok dva. Jako první jsem zkusil Seedance v edit módu.

{#fail2} Její vzhled to dodrželo, ale lip sync nebyl dobrej. Pusa neseděla na slova. Seedance je skvělej na spoustu věcí, ale na tohle to zrovna není. Takže dál.

---

## K04 · Krok 3: Genjutsu a detaily v promptu (~2:00)

> VIZ: Uzel „KROK 03“. Vlevo reference (assets/img/reference1.png). Detail rtů s callouty „tvar“, „objem“. Uprostřed prompt (podklady/prompt_genjutsu.txt) jako dlouhá karta, kamera po ní sjíždí a zvýrazňuje bloky: STRICT IDENTITY PRESERVATION → CRITICAL — MOUTH MOVEMENT → ORIGINAL AUDIO → PRESERVE THE SHOT → poslední věta. Vpravo originál vs. Genjutsu synchronně. Pak export: 720p, „sound effect“ vypnutý.

{#s3} Krok tři. Higgsfield Genjutsu. A tady se vyplatí soustředit na detaily.

{#lips} Domča má takovou jako napíchanou pusu. Takže nestačí říct, vyměň obličej. Model musí vědět, co je na tom obličeji typický, a to musíš napsat natvrdo.

{#ref} Reference je jedna fotka. A prompt má pět bloků, každej hlídá něco jinýho. Na začátku jedna věta: nahraď muže ve videu přesně tou ženou z reference.

{#ident} První blok je identita. Zachovej její rysy, proporce, oči, obočí, nos, lícní kosti, bradu, tvar a objem rtů, pleť, make-up a dlouhý rovný tmavý vlasy. A hlavně co nedělat: nevylepšuj, nestylizuj, nezeštíhluj a nemíchej její obličej s tím chlapem.

{#mouth} Druhej blok je nejdůležitější a je nadepsanej critical. Pohyb pusy. Přenes moji artikulaci a timing snímek po snímku, každý otevření pusy, každou samohlásku, každou pauzu. Ale přizpůsob to jejím rtům. Rty si maj nechat svůj tvar a plnost. A k tomu realistický zuby a žádný zamrzlý nebo zpožděný rty.

{#audio} Třetí blok: zachovej původní českej zvuk přesně. Žádnej dabing, žádnej překlad, žádná změna rychlosti.

{#shotp} Čtvrtej: zachovej záběr. Chůzi, pohyby hlavy, pohled, gesta, kameru z ruky i ulici s auty za mnou. Sundej kšiltovku a vousy, dej jí její vlasy a černej top. A nepřetahuj z reference pozadí, mikrofon, titulky ani rozhraní telefonu.

{#first} A poslední věta, na kterou se zapomíná: musí bejt hotová od prvního snímku. Žádná viditelná proměna.

{#wow} A tohle mě upřímně překvapilo. Lip sync sedí a pořád je to ona.

{#export} Exportoval jsem v sedm set dvacet p a bez zvukovýho efektu. Takže to vyplivlo video s mým originálním zvukem, s mým hlasem.

{#third} A tady jsem byl zhruba ve třetině. Protože s hlasem je mnohem víc práce, než si člověk představí.

---

## K05 · Krok 4: Klon hlasu a Voice Changer (~1:00)

> VIZ: Uzel „KROK 04“. Karta ElevenLabs: klon hlasu. Šipka: můj hlas → Voice Changer → její hlas. Tři štítky (intonace, barva hlasu, plynulost češtiny) – zaškrtnou se jen dva, nikdy všechny tři. Velký červený nápis „v češtině zatím ne“.

{#s4} Krok čtyři. Hlas.

{#clone} V ElevenLabs si vytvoříš klona podle něčího hlasu. A pak teoreticky stačí zapnout Voice Changer. Ten vezme tvoji nahrávku a přemluví ji tím klonem.

{#vcfail} Jenže počítej s tím, že multijazykovej model ještě není tak vypracovanej, aby v češtině zvládl najednou dodržet intonaci, barvu hlasu a plynulost. Dvě věci ti dá, třetí ne.

{#vcno} Takže tudy ne.

---

## K06 · Krok 5: Hlas ze tří částí (~1:30)

> VIZ: Uzel „KROK 05“. Timeline: nahoře můj originální voiceover jako vlna, pod ní tři barevné bloky, které se postupně skládají pod sebe: 1 = v4 · Robust · Similarity 75 %, 2 = v3 · stejné nastavení · o kousek rychlejší, 3 = 2.5 Turbo · rychlost nahoru. U druhé věty se mezi slova vklinují „pauzy“ a blok přeteče přes originál.

{#s5} Krok pět. Takže jsem šel na klasickej generátor, text na řeč. A rozdělil jsem to na tři části.

{#p1} První část: ten nejnovější model, v4. Nastavení Robust a similarity zhruba sedmdesát pět procent, aby to drželo její řeč. Ta seděla na můj voiceover skoro hned.

{#pause} Jenže pak to začne ujíždět. Já jsem moc velký pauzy nedělal, ale model si je dělá sám od sebe. A nejde ho popohnat.

{#p2} Druhá část: stejný nastavení, jen na modelu v3. Ten to řekl trošku rychlejc, a to bylo přesně to, co jsem potřeboval.

{#p3} A třetí část jsem řekl úplně rychle. Na to jsem šel do dva bod pět turbo, kde si nastavíš i rychlost, a dal jsem ji nahoru.

{#hear} Když se zaposloucháš, poznáš malej rozdíl. Ale je nepatrnej a běžnej divák si ho ani nevšimne.

{#parts} A právě proto, že je hlas ze tří kousků, jsem ho pak mohl v postprodukci napasovat.

---

## K07 · Krok 6: CapCut na telefonu (~1:00)

> VIZ: Uzel „KROK 06“. Mockup telefonu s CapCutem: dvě video stopy (originál dole, Genjutsu nahoře jako překrytí), pod nimi tři audio kousky, které se posunou na vlnu originálu. Pak ikona lusknutí + vlna SFX, přehrání záběru z nádraží („nadrazi“, lusknutí na začátku) a střih ve „final“ v 6 s. Export.

{#s6} Krok šest. Postprodukce. Celý jsem to dělal v CapCutu normálně na telefonu.

{#overlay} Vyexportovaný video z Genjutsu jsem dal jako překrytí na svůj originál.

{#match} Pak jsem napasoval hlas. Tři kousky, každej zvlášť, aby seděly na pohyb pusy.

{#sfx} A přidal jsem zvukovej efekt lusknutí. SFX je u takovýhle videa fakt důležitý, dodá to atmosféru a ten moment proměny.

{#exp} A export.

---

## K08 · Výsledek a outro (~1:00)

> VIZ: Uzel „VÝSLEDEK“. Počítadlo komentářů 0 → 100. Pak se kolem rozprsknou desítky bublin DM („pošli tutoriál“, „???“, „kde je link“). Nápis „1. FOLLOW → 2. KOMENTÁŘ → 3. TUTORIÁL“ se poskládá velkým písmem. Pak odjezd na celou mapu a karta „Díky. efektive.cz“.

{#res} Video nasbíralo zhruba sto komentářů za první den.

{#dm} A taky tolik naštvanejch zpráv do DMs, že by z nich byl další tutoriál. Protože aby ti tutoriál přišel, musíš nejdřív dát follow. Stojí to tam napsaný. Velkým písmem.

{#order} Takže ještě jednou, pomalu. Follow. Komentář. Tutoriál. V tomhle pořadí. Věřím ti.

{#zoomout} A tohle je celá mapa. {#end} Talking head, detaily v promptu, Genjutsu, hlas ze tří kousků a CapCut. Díky, že jsi tady na Patreonu.
