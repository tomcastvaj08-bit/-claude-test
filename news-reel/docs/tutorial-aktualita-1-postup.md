# Podklad pro tutoriál: Jak jsme s AI udělali celý Reel „Aktualita #1 – Karusely v Instagram Edits“

> **Pro chat, který dělal Ščerba tutoriál:** Níže je kompletní a chronologický záznam, jak vznikl tenhle Reel, krok po kroku. Ber ho jako surový materiál. Udělej z něj tutoriál ve stejném stylu, struktuře a tónu jako Ščerba tutoriál. Nic si nevymýšlej navíc. Všechny prompty, čísla, ceny a chyby jsou skutečné. Kde je napsáno „Uživatel“, myslím sebe (autora videa). Kde je „Claude“, je to AI, která to celé stavěla v Claude Code.

---

## 0. O co jde (výsledek)

- **Formát:** Instagram Reel 16:9 (1920×1080, 24 fps), délka **42 s**, hlasitost −14 LUFS (standard pro sítě).
- **Téma:** týdenní „AKTUALITA“ pro podnikatele. Díl #1: *Instagram Edits nově umí karusely* (novinka ze 7. října).
- **Stavba videa:**
  1. **Hook (cca 6 s):** 2D kreslená postavička ve stylu *Spider-Man: Into the Spider-Verse* v reálné (fotorealistické) místnosti s tabulí. Jde s kafem, zakopne o kabel, ve slow motion letí kafe a cákne přesně na „7“ v nástěnném kalendáři. Postavička: „Sedmýho… října?“
  2. **3D přechod** jako v After Effects: kalendář a grafika jsou dvě stěny kostky, kamera se otočí doprava.
  3. **Motion grafika** v brandu EFEKTIVE (Inter, chladně bílá, grafit, modrá + listová zelená, lesklé koule). Je synchronizovaná na slova hlasu, má kamerové pohyby, sound design a hudbu.
  4. **Outro** s logem.
- **Celé to postavila AI.** Uživatel jen psal (diktoval) zpětnou vazbu česky, většinou hlasem a hodně neformálně.

## 1. Nástroje, které se použily

| Nástroj | K čemu |
|---|---|
| **Claude Code** (cloudová session napojená na GitHub repozitář) | „Režisér a střihač“. Psal kód, stříhal, míchal zvuk, renderoval, ovládal ostatní nástroje přes konektory. |
| **Vlastní „news-reel engine“** (HTML/CSS animace → Playwright → ffmpeg) | Motion grafika, kterou Claude naprogramoval. Každá scéna je šablona (app, bigtype, phone, fan, stack, iphone, words, particles, cta), animace jsou navázané na časy slov v hlasu. |
| **Skill „efektive-aktuality“** | Návod pro Claude, jak díl vyrobit. Po každé zpětné vazbě se do něj zapisují nová pravidla. |
| **Higgsfield** | Obrázky: model **gpt_image_2_5**. Video: **Seedance 2.5** (multishot), pro testy **Kling 3.0**. |
| **ElevenLabs** | Návrh vlastního hlasu (**Voice Design, eleven_ttv_v3**), namluvení (**eleven_v4**), zvukové efekty a hudební podklad (**eleven_text_to_sound_v2**), přepis na slova s časy (**Scribe**). |
| **Canva** | Thumbnail / cover Reelu. |
| **ChatGPT** | Vstup: text novinky ve formátu „Novinka ze … / Co se změnilo / Pro klienty / Vyzkoušet“. |

---

## 2. Postup krok za krokem (tak, jak to opravdu probíhalo)

### Krok 1: Vstup a první verze
- Uživatel vložil text novinky z ChatGPT: *„Instagram Edits nově podporuje carousely — Novinka ze 7. října. Co se změnilo: … fotky, videa, texty, efekty, uložené fonty, styly, samolepky. Zatím iOS, Android následuje. Pro klienty: rychlejší produkce… Vyzkoušet: …“*
- Claude ze skillu udělal scénář voiceoveru s „cue“ značkami (body střihu, např. `[[boom]]`), scény motion grafiky a první hook „tabule“: pojezd kamery podél cihlové zdi na školní tabuli s kalendářem a zakroužkování data fixou.

### Krok 2: Úvodní scénky s postavičkou (cold open) a jejich ladění
- Postavička: 2D kluk z character sheetu (velké hranaté brýle, zrzavo-hnědé rozcuchané vlasy, růžová kůže, zelená kostkovaná košile, džíny). Žije v **reálných fotkách místností** uživatele.
- Varianty: noviny, spánek, notebook, mobil, sešit. Obrázky vznikly v gpt_image_2_5 tak, že se upravila skutečná fotka a vložila do ní postavička. Prompt začínal: *„Edit the FIRST image (a real photograph of a room…). Keep the photograph pixel-identical… Insert the cartoon character from the SECOND image (the character sheet…) SITTING on the real wooden chair…“*
- **Zpětná vazba uživatele a co se změnilo:**
  - Mobil nesmí levitovat. Musí být z pohledu první osoby v jeho kreslené ruce.
  - Pryč s útěkem a leknutím na konci. Konec má být „počkej, jaký je datum?“ a hned přechod.
  - Víc dynamiky a rychlejší tempo pro sociální sítě: záběry 0,5–1,4 s.
  - Sound design jako ve filmu, ne jen AI efekty. Claude si udělal vlastní „designované“ zvuky (vrstvené švihy, klik + tělo + sub, riser, tension drone) a atmosféru stříhanou s obrazem.

### Krok 3: Krátký hook s kalendářem a 3D kostka
- Uživatel: *„žádnej whip pan ze zdi, rovnou střih na kalendář, sedmička uprostřed, pryč papír ‚novinka ze 7. října‘, a z té zakroužkované sedmičky to 3D otočit doprava jako v After Effects rovnou do karuselů.“*
- Claude: tvrdý střih na detail kalendáře s „7“ přesně uprostřed, najetí kamerou, zakroužkování fixou. Pak **3D přechod**: kalendář a grafika jsou dvě sousední stěny jedné kostky a kamera se otočí na pravou stěnu.
- Oprava: levá stěna kostky zůstávala vidět mezi 1. a 2. sekundou, tak ji Claude nechal zmizet.
- Claude k tomu napsal i **scénář voiceoveru s časovými kódy**, aby si ho uživatel mohl namluvit sám.

### Krok 4: Nový koncept: Spider-Verse nehoda místo úvodních scének
- Uživatel (19. 10.): Nedává smysl, aby novinka ze 7. vycházela 19. Chce **jednu lokaci (tabuli)**, postavičku jako **2D animaci ve stylu Spider-Verse** a reálné prostředí. Má se stát nehoda, která skončí na „7“, a postavička řekne „počkej, sedmýho…“. Pak hlas a grafika.
- Claude navrhl **5 nehod** a **5 replik**:
  - **Barva (KAP!):** kapka červené barvy z pětky.
  - **Kafe (ŠPLÍCH!):** kafe udělá kroužek kolem 7.
  - **Šipka (ŤUK!):** mine terč a zapíchne se do 7.
  - **Žvýkačka (PLESK!):** bublina praskne a kus přistane na 7.
  - **Vlaštovka (FFFT!):** papírová vlaštovka se zapíchne do 7.
- Vybrali jsme **kafe**.
- **Spider-Verse znaky**, které se dávají do všech promptů:
  - animace „on twos“ (12 kreseb za sekundu);
  - tlusté obrysy;
  - Ben-Day rastrové tečky;
  - šrafování stínů;
  - posunuté CMYK barvy místo motion bluru;
  - smear frames;
  - komiksové „impact“ snímky.
- **Slepá ulička:** uživatel chtěl, ať Claude generuje obrázky přes ChatGPT v Chrome. Z cloudové session to nejde, protože nemá přístup k počítači uživatele. Přešli jsme na **Higgsfield** a uživatel si dobil kredity.
- **Style framy:** gpt_image_2_5 se dvěma referencemi: fotka tabule s kalendářem a character sheet. Prompty jsou uložené v repozitáři (`spiderverse-prompty.md`).

### Krok 5: Kafe gag v1 (FPV dron) a proč nestačil
- Seedance 2.5 `omni_reference` se start framem a end framem (end frame je snímek kalendáře přímo z enginu, aby navazoval na grafiku). Testy přes Kling 3.0. Prompt začínal: *„Cinematic FPV drone shot, fast and dynamic. The 2D comic boy (Spider-Man: Into the Spider-Verse animation style…) sips coffee relaxed… The FPV drone camera dives in and whips around him… the coffee flies… lands as a stain ring around the number 7…“*
- **Chyba:** v klipu byl na chvíli (0,38–0,72 s) vidět samotný dron. Uživatel: *„dron nesmí být vidět, má to být footage z dronu.“* Řešení: klip začíná až od 0,80 s.
- Uživatel pak chtěl úplně jiný střih (viz další krok).

### Krok 6: Hook „v jednom kuse“: Seedance 2.5 multishot (hlavní trik)
- **Zadání uživatele (zkráceně):**
  - normální rychlost 130 %;
  - minimálně 3 střihy;
  - nejdřív si vykračuje (široký záběr), detail kafe a pískání, bum, zakopne (detail boty);
  - pak rychlé střihy ve slow motion: pád, kafe se vylévá, obličej, kapka letí ke kalendáři;
  - kalendář normální rychlostí, cákanec na 7;
  - **v jednom kuse, multishot Seedance 2.5, 720p, 6 s, 16:9, max 70–100 kreditů**;
  - rozepsat přesný timing v sekundách i ve framech a měnit typy kamer (širokoúhlá, rozmazaná kytka v popředí…);
  - *„Hook je vo všem, dej do toho 110 %.“*
- **Příprava:** Claude nejdřív vygeneroval **7 keyframů** (gpt_image_2_5): FPV pohled, široký záběr, bota, hrnek, obličej, kapka, cákanec. Pak je dal do Seedance jako `image_references`, k tomu start frame a end frame z enginu.
- **Výsledná cena: 42 kreditů** (720p, 6 s).
- **Přesný prompt (Seedance 2.5 multishot):**

```
MULTI-SHOT cinematic sequence, 6 seconds at 24 fps, HARD CUTS between shots, extremely dynamic editing for a social-media hook. LOOK: the boy (big square glasses, messy red-brown hair, pink skin, green plaid shirt, blue jeans, brown shoes, white coffee mug) is a 2D character in the exact 'Spider-Man: Into the Spider-Verse' style: animated ON TWOS (stepped, choppy, 12 drawings per second), bold ink outlines, Ben-Day halftone dots, ink hatching for shadows, CMYK print misregistration instead of motion blur, smear frames on fast moves, comic impact frames. The room stays photoreal: brick wall, green chalkboard, the paper wall calendar 'Rijen 2026', warm sun stripes through blinds, wooden floor, a black power cable on the floor. No drone visible, no text, no captions, no speech bubbles.
SHOT 1 (0.00-1.20 s, frames 1-29) ULTRA-WIDE fisheye from the far upper corner of the room (exactly the start frame): he strolls in with a confident carefree swagger, sipping coffee and whistling, the camera drifts slowly.
SHOT 2 (1.20-1.90 s, frames 30-46) LOW TRACKING CLOSE-UP from the side at knee height, out-of-focus green potted-plant leaves blurred in the extreme foreground, his swinging steaming mug and walking feet, still carefree.
SHOT 3 (1.90-2.30 s, frames 47-55) EXTREME CLOSE-UP at floor level: his brown shoe snags hard on the black cable, SNAP, smear frame, impact frame.
SHOT 4 (2.30-2.80 s, frames 56-67) SLOW MOTION 4x, wide dutch angle: he tumbles forward through the air, arms flailing, glasses slipping, the mug flying out of his hand.
SHOT 5 (2.80-3.30 s, frames 68-79) SLOW MOTION macro close-up: the mug tilts in mid-air, a glossy arc of coffee pours out, droplets frozen in the sunlight.
SHOT 6 (3.30-3.80 s, frames 80-91) SLOW MOTION extreme close-up of his face: horrified, eyes huge behind the glasses, mouth wide open 'nooo', droplets floating past.
SHOT 7 (3.80-4.60 s, frames 92-110) SLOW MOTION over-the-shoulder: one big coffee drop flies toward the paper calendar on the chalkboard.
SHOT 8 (4.60-6.00 s, frames 111-144) back to NORMAL SPEED, fast snap zoom: the coffee splats onto the calendar right on the number 7, a few drips run down, then the camera settles perfectly still on the calendar close-up exactly like the end frame.
```

### Krok 7: Střih hooku (bez dalšího generování)
- Claude klip rozstříhal na segmenty:
  - normální záběry **zrychlil na 1,3×**, slow motion nechal;
  - **vyhodil vadný záběr**, kde už byla skvrna na kalendáři dřív, než kafe dopadlo, a k tomu komiksový nápis „ŠPLÍCH“;
  - zbytek zvětšil na 1080p.
- **Pořadí záběrů:** široký příchod → nízký záběr přes rozmazanou kytku → detail boty a zakopnutí → slow motion hrnek → slow motion obličej → kapka přes rameno → kalendář normální rychlostí a cákanec.
- Animace je „on twos“ a po každém střihu začíná znovu, aby se snímky nemíchaly přes střih.
- **Sound design hooku** (každá vrstva má přesný čas):
  - pískání a kroky;
  - švihy na střihy;
  - zadrhnutí o kabel + úder;
  - hudba rozdělená na 3 části (v slow motion ztlumená přes low-pass filtr);
  - slow-mo atmosféra a „lití“ kafe;
  - švih vzduchu;
  - na dopad: riser, šplouchnutí, úder, sub, impact.
- **Render jen hooku na schválení**, ne celého videa, aby se šetřil čas. Celé video se renderuje přes hodinu.

### Krok 8: Dostřih podle uživatele
- Uživatel:
  - *„vystřihni ‚Ne, na sedmičku ne‘, nech tam jen tu otázku ‚Sedmýho… října?‘, zkrať úsek s kalendářem, ať tam není cut v audiu“*;
  - pak: *„ještě o půl sekundy zkrátit.“*
- Claude:
  - vystřihl úsek z hotového videa (obraz i zvuk) s **80ms prolnutím zvuku**, aby nebyl slyšet střih;
  - na střih přidal tichý švih a sub, aby skok v obraze působil záměrně;
  - pro další půl sekundy zkrátil držení kalendáře a repliku zrychlil (bez změny výšky hlasu).

### Krok 9: Vlastní hlas č. 1, „Efík“ (podle Alza panáčka)
- Uživatel: *„vytvoř si vlastní hlas v ElevenLabs v4… rozlož si, jak funguje hlas Alza panáčka, pištivej, s přízvukem, otravnej, ale zůstane v hlavě… podívej se na charakter a udělej k němu hlas.“*
- **Voice Design prompt:**

```
Young Czech male cartoon mascot voice, early twenties, nerdy and cheeky. High-pitched, slightly squeaky and nasal, bright buzzy timbre, a bit cartoonish like an animated brand mascot, with a playful quirky accent and sing-song upward inflections at the ends of phrases. Fast, punchy, hyper-energetic delivery with a grin, crisp clear diction. Slightly annoying in a lovable way, instantly recognizable and catchy. Professional studio recording, close mic, clean, dry, broadcast quality.
```

- Ze 3 návrhů Claude vybral ten **nejpištivější a nejvíc „zpívající“**. Změřil výšku hlasu, medián ~290 Hz. Uložil ho jako „Efík – Aktuality maskot“. Stejným hlasem namluvil i repliku postavičky.

### Krok 10: Pokus o ASMR šepot (zamítnuto) a trik „výměna hlasu bez renderu“
- Uživatel: *„ať mi šeptá do ouška, vtipně, hodně zesílený, ASMR.“*
- Claude:
  - namluvil šepot v4 s tagem `[whispering close into your ear, ASMR, playful]`;
  - zvukem dodělal „mikrofon u pusy“: víc basů, presence, de-esser, kompresor, víc v levém uchu;
  - **každé slovo nového hlasu natáhl/zkrátil přesně na čas původního slova** (podle přepisu Scribe), takže grafika dál seděla a **video se nemuselo znovu renderovat**. Jen se přemíchal zvuk, za pár minut.
- Uživatel: *„tuhle verzi ne, zpátky na původní.“*

### Krok 11: Výslovnost a další zvuky
- Uživatel: *„musíš opravit výslovnost, ‚apek‘ ať říká česky, ‚karusel‘ říká úplně špatně.“*
- **Řešení:** anglická slova se v textu pro hlas píšou **foneticky česky**: „karusely“, „karusel“, „apek“.
- **Chyba a oprava:** při napojení nového hlasu na časy se uřízl začátek „Insta…“. Přepis špatně určil začátek prvního slova, protože tag na začátku textu „sežral“ jeho čas. Claude pak začátek prvního slova bral podle skutečného zvuku.
- Uživatel chtěl zvuky ze své složky „AI SFX“ na ploše (10 000 zvuků). **Z cloudové session to nejde.** Na Google Disku složka nebyla. Claude proto vygeneroval nové zvuky v ElevenLabs:
  - hudební podklad pod grafikou (dosud tam žádná hudba nebyla);
  - foťák na „Fotky“, projektor na „videa“, klávesnice na „texty“, třpyt na „efekty“;
  - samolepka, notifikace na „iPhonu“, glitch na „Android“;
  - stopky na „kolik času ušetříš“;
  - basové údery, švihy.
- **Každý zvuk je navázaný na konkrétní slovo** v hlase, ne na pevný čas. Když se změní hlas, zvuky se posunou samy.

### Krok 12: Risery, Apple zvuky, kamera jako adjustment layer
- Uživatel:
  - *„navrstvi 2–3 risery: začne potichu už kousek před zakopnutím, zesiluje přes kafe, obličej, a skončí, když to spadne na sedmičku“*;
  - *„chybí mi kamera movement jako adjustment layer v After Effects, push in, push out, quadratic, ease in, ease out… aby se pořád něco dělo, clean křivky… u ‚vše v jednom příspěvku‘ je dlouho statická scéna“*;
  - *„a čistý Apple zvuky.“*
- Claude:
  - **3 risery** (šumový, tónový, jemný), všechny vrcholí přesně v okamžiku dopadu kafe, plus 2 švihy na pád;
  - **kamerové pohyby jako dodatečná vrstva nad hotovým obrazem**: klíčové snímky zoomu s křivkami linear, quad, cubic, quart, expo, sine, rychlé zoomy s motion blurem, na změnách scén krátké 0,14s přeskoky. Zoom je max ~11 %, aby nahoře nezmizela hlavička. **Bez nového renderu, 3,5 minuty.**
  - **Apple-style vrstva:** jemný švih + ťuknutí na každou změnu scény, tiché „tick“ na klíčová slova, měkký pop, dvoutónové cinknutí na „Tak to zkus“.

### Krok 13: Vlastní hlas č. 2, „Aura“ (finální vypravěč)
- Uživatel: *„Efík je moc provokativní, chci zastřenej hlas, gigachad, aura týpek s testákem, klidnější, vysvětlující, ale s energií.“*
- **Voice Design prompt:**

```
Deep husky Czech male voice, around thirty, very low pitch with strong chest resonance, slightly raspy gravelly texture, a little breathy. Calm, confident, charismatic alpha energy, relaxed but engaging, explains things clearly like a cool mentor, never shouting. Professional close-mic studio recording, clean, warm, broadcast quality.
```

- Ze 3 návrhů (všechny kolem 80 Hz) Claude vybral **nejchraplavější s největším rozsahem intonace**, aby nebyl monotónní. Tag na začátek namluvení: `[confident, relaxed, brisk pace]`. Ve videu je zrychlený na **1,15×**.

### Krok 14: Vložky „vysvětli jako dítěti“ a vtip
- Uživatel chtěl dvě vložky:
  1. *„pro ty pomalejší, co neví, co jsou karusely… vizuálně příspěvek na Instagramu, swipneš, swipneš, už to chápeš“*;
  2. *„zatím na iPhonu… Android je teprve za opicem… jenom divní lidi mají Android, jdem dál.“* A k tomu: *„zasekne se DJ disk, joke, riser přes joke, a pak zase bomby“*.
- Mezitím ještě doplnil: *„ukaž na začátku, že je to appka od Instagramu, kterou si stáhneš z App Storu, zdarma, to lidi rádi slyšej.“*
- **Finální text voiceoveru:**

```
Instagram Edits, appka přímo od Instagramu, v App Storu úplně zadarmo, umí nově karusely! Pro ty pomalejší: karusel je jeden příspěvek, ve kterým máš víc fotek za sebou. Swipneš, další fotka. Swipneš znova, další. Jasný? A teď do něj dáš fotky, videa, texty i efekty — všechno v jednom příspěvku. Plus tvoje uložené fonty, styly i vlastní samolepky. Zatím jen na iPhonu. Android je na cestě… [deadpan] ale upřímně? Android maj stejně jen divný lidi. [upbeat] Takže jedem dál! Pro klienty to znamená rychlejší karusely a grafiku s videem bez přepínání apek. Tak to zkus: jeden karusel přímo v Edits… a změř si, kolik času ušetříš.
```

- **Nové scény:**
  - **Úvod:** ikona appky, štítek „App Store · zdarma“ a tlačítko **„Získat“**, které se na slovo „zadarmo“ ťukne a změní na „Zdarma ✓“.
  - **Co je karusel:** vlevo telefon s příspěvkem, kde se karty přejedou přesně na slova „swipneš“. Vpravo se rozsvěcuje „Tohle je karusel → Swipni → Další fotka → Jasný?“.
  - **Vtip:** hudba se zastaví (zvuk „DJ brake“, zaseknutá deska), kamera skočí blíž a stojí, na obrazovce „Upřímně? Android maj stejně jen divný lidi.“ Pod tím rostou risery. Na „Takže jedem dál!“ přijde basový úder a hudba naskočí zpátky.
- **Celý render: 51 minut.** Výsledek 42 s, −14,4 LUFS.

### Krok 15: Popisek na Instagram
- Zadání: *„jako kdyby to bylo ode mě, půl na půl bez diakritiky, dvě chyby, první slova co nejúdernější, pár hashtagů.“*
- **Pravidlo:** na Reelsech je před „…více“ vidět jen první řádek, cca 40–50 znaků. Hook musí být tam.
- **Finální popisek:**

```
AKTUALITA #1 🤖 celou ji udelal Claude

Jo, fakt. Scenar, hlas, animce, zvuky, strih… vsechno jsem delal s AI a já jen rikal co chci 😅

A o cem to je? Instagram Edits ted umí karusely. Fotky, videa, texty i efekty – vsechno v jednom prispevku, v jedny appce a uplne zdarma.

Pro podnikatele co si delaj obsah sami = min prepinani mezi appkama, rychlejsi postovani a víc času na byznys 💸

Tohle je prvni dil. Kazdej tyden ti sem hodim novinky z AI, Instagramu a podnikani, vysvetlený tak aby to pochopil uplne kazdej 👊

Dej follow at nic nepropasis a pošli to kamosovi co furt prepina mezi 5 appkama 😂

#claudeai #ai #instagramtips #podnikani #karusel
```

### Krok 16: Thumbnail / cover (Canva)
- Zadání: *„aby to fitlo do gridu, ne fullscreen, pozadí stejnou barvou jako tady (tmavá #0C0F14), bílý obdélník se zaoblenými rohy s tématem karuselů, a postavička jako sticker, co přesahuje i do pozadí, politá kafem.“*
- **Samolepka** (gpt_image_2_5, reference: character sheet + Spider-Verse style frame s kafem). Prompt:

```
Die-cut vinyl STICKER of the boy character from the reference images (big square black glasses, messy red-brown hair, pink skin, green plaid shirt, blue jeans), drawn in the 'Spider-Man: Into the Spider-Verse' comic style: bold ink outlines, Ben-Day halftone dot shading, slight cyan/magenta misregistration. Full body, dynamic pose: he is mid-stumble, leaning back in shock, eyes wide behind his glasses, mouth open, holding a white coffee mug that is spilling. The whole sticker is splashed with coffee: brown coffee splash arcs, drips and a few coffee stains running over him and over the sticker's white border. Thick clean white die-cut sticker border around the whole silhouette, subtle drop shadow. Isolated on a plain flat light grey background, nothing else, no text.
```

- **Karta:**
  - „AKTUALITA · 7. ŘÍJNA“ (s cákancem kafe přímo na sedmičce, odkaz na hook);
  - štítek „#1“;
  - „Karusely v Edits“;
  - „Appka od Instagramu, zdarma“;
  - vějíř karet Fotky / Videa / Texty / Efekty;
  - tečky jako u karuselu a „Swipni →“.
  - Je ve stejném fontu a barvách jako video.
- V Canvě to jsou **3 vrstvy**: pozadí, karta a samolepka.
- **Poučení, kde jsme se spálili:** cover Reelu se nahrává jako **9:16 (1080×1920)**. Instagram si z něj pro mřížku profilu vyřízne **střed 3:4 (1080×1440)**. Když nahraješ rovnou 3:4, ořízne se to dvakrát a zmizí okraje. Všechno důležité tedy patří do středové oblasti 3:4. Bílou kartu jsme nakonec ještě zmenšili o 14 %, aby kolem ní bylo vidět tmavé pozadí.

---

## 3. Ceny a čas (orientačně)

- **Higgsfield:**
  - Seedance 2.5 multishot 720p 6 s = **42 kreditů**;
  - dřívější testy (Seedance/Kling 3.0 ≈ 7,5 kr. za klip);
  - obrázky gpt_image (style framy, 7 keyframů, 2 samolepky).
- **ElevenLabs (kredity):**

  | Položka | Kredity |
  |---|---|
  | Efík: 4 verze voiceoveru | 1 420 |
  | Replika postavičky | 180 |
  | ASMR šepot | 1 888 |
  | Oprava výslovnosti | 1 404 |
  | Test hlubokého hlasu | 748 |
  | Finální voiceover Aura (2 verze) | 1 324 |
  | Zvuky + hudba | ≈ 430 |

- **Rendery:**
  - celé video 45–51 min;
  - jen hook ~20 min;
  - výměna hlasu nebo zvuku bez renderu pár minut;
  - kamerová vrstva 3,5 min.

## 4. Pravidla, která z toho vyplynula (zapsaná do skillu)

1. **Vysvětluj jako dítěti.** Každý pojem vysvětli 1–2 větami a ukaž ho v grafice.
2. **Řekni prakticky, co to je, odkud a za kolik** („appka od Instagramu, zdarma v App Storu“).
3. **Jeden vtip na díl** se zvukovou mechanikou: hudba stop → vtip → risery → bum → hudba zpátky.
4. **Cíl ~40 s, max 60 s.** Čím rychlejší, tím lepší. Hlas zrychlený na 1,15×.
5. **Anglická slova piš foneticky česky.**
6. **Žádná statická scéna:** kamerové pohyby s čistými křivkami a zvuk na každé změně.
7. **Hook je všechno:** multishot v jednom kuse, střídat typy kamer, slow motion, dopad přesně na datum novinky.
8. **Nikdy neukazovat dron** a nenechávat chybné záběry. Radši je vystřihnout.
9. **Schvalovat po částech** (jen hook, pak celé video). Měnit zvuk a hlas bez nového renderu, kde to jde.
10. **Cover vždy 9:16** s obsahem ve středu 3:4.

## 5. Co uživatel reálně dělal (pro tutoriál důležité)
- Jen psal nebo diktoval zpětnou vazbu česky, neformálně, třeba *„dej do toho 110 %“*, *„čím rychlejší, tím lepší“*, *„takhle ne, vrať to“*.
- Rozhodoval: vybral nehodu (kafe), schvaloval verze, odmítl ASMR, vybral hlas Aura.
- Sám dobil kredity na Higgsfieldu, nahrál cover do Instagramu a zveřejnil.
- Všechno ostatní (prompty, generování, střih, zvuk, render, popisek, cover) udělala AI.
