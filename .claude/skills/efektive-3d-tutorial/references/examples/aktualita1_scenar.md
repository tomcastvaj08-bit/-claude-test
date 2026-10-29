# Scénář: Aktualita #1, celý postup (Patreon tutoriál)

- **Cílová délka:** ~50 min (zbytek času vyplní přehrávání reelu, hooku a cold-openů na plátně)
- **Hlas:** tvůj hlas z ElevenLabs, 1. osoba (mluvíš ty, Claude je „on“)
- **Obraz:** 1920×1080, 30 fps

**Legenda:**
- `{#cue}` je bod, na který se váže animace. Po namluvení se z přepisu (Scribe) vezme přesný čas slova.
- `> VIZ` popisuje, co se děje na plátně. Nečte se.
- Anglické termíny se pro hlas automaticky přepíšou foneticky (např. Claude → Klód, Higgsfield → Higsfíld). Pravidlo č. 5 z tvého skillu.
- Prompty se na plátně ukazují v originále anglicky. Hlas je česky vysvětluje.

---

## K00 · Úvod (~2:00)

> VIZ: Plátno je ve tmě. Uprostřed se rozsvítí karta s hotovým Reelem a přehraje se celý (42 s, s původním zvukem). Kamera při tom pomalu najíždí. Po dohrání kamera vyletí strašně daleko: kolem jsou stovky malých obrázků ve 3D (snímky z reelu, cold-openy, prompty, ikony nástrojů) a uprostřed prázdná myšlenková mapa.

{#reel} Tohle je čtyřicet dva sekund. Instagram Reel, první díl mojí týdenní Aktuality. Kreslená postavička, kafe, který ve slow motion letí přesně na sedmičku v kalendáři, 3D přechod jako z After Effects, motion grafika, hudba, zvuky, hlas.

{#ai} A teď to hlavní. Celý tohle video udělala AI. Scénář, obrázky, video, hlas, zvuky, střih, render. Já jsem jen psal a diktoval, co chci. Česky, hodně neformálně, často hlasem.

{#map} V tomhle tutoriálu ti ukážu úplně celej postup. Krok za krokem, tak jak to opravdu probíhalo. Všechny prompty, všechna čísla, kolik co stálo kreditů, a hlavně všechny chyby, na který jsme narazili, a jak jsme je opravili. Nic není přikrášlený.

{#meta} A ještě jedna věc. I tohle video, na který se právě díváš, je postavený stejnou technikou, jakou ti tu budu vysvětlovat. Takže až uvidíš, jak se tu kamera prolétává mezi obrázkama, tak to není After Effects. To je kód.

{#go} Jdeme na to.

---

## K01 · Výsledek: kam míříme (~2:00)

> VIZ: Kamera přiletí k prvnímu uzlu mapy „VÝSLEDEK“. Kolem se rozloží čtyři karty (Hook, 3D přechod, Motion grafika, Outro), u každé snímky z reelu ve 3D.

{#fmt} Nejdřív si řekneme, co přesně je ten výsledek, ať víš, kam míříme.

Formát: Reel v šestnácti ku devíti, tedy devatenáct set dvacet krát deset osmdesát, dvacet čtyři snímků za sekundu. Délka čtyřicet dva sekund. {#lufs} A hlasitost minus čtrnáct LUFS. To je standard pro sociální sítě. LUFS je jednotka vnímaný hlasitosti. Když máš video moc potichu, lidi ho přeskočí. Když moc nahlas, platforma ti ho stejně ztlumí. Minus čtrnáct je zlatá střední cesta.

{#topic} Téma: týdenní Aktualita pro podnikatele. Díl číslo jedna: Instagram Edits nově umí karusely. Novinka ze sedmýho října.

{#parts} A video má čtyři části.

{#p1} Zaprvé hook, zhruba šest sekund. Dvourozměrná kreslená postavička ve stylu Spider-Man: Into the Spider-Verse, ale v reálný, fotorealistický místnosti s tabulí. Jde s kafem, zakopne o kabel, kafe letí ve slow motion a cákne přesně na sedmičku v nástěnným kalendáři. A postavička řekne: Sedmýho… října?

{#p2} Zadruhé 3D přechod. Kalendář a grafika jsou dvě stěny jedný kostky a kamera se otočí doprava. Přesně jako v After Effects.

{#p3} Zatřetí motion grafika v brandu Efektive. Font Inter, chladně bílá, grafit, modrá a listová zelená, a lesklý koule. Všechno je synchronizovaný na slova hlasu, má to kamerový pohyby, sound design a hudbu.

{#p4} A začtvrté outro s logem.

{#mapback} Na tuhle mapu se budem pořád vracet. Každá větev je jeden krok a pokaždý, když nějakej dokončíme, mapa vyroste.

---

## K02 · Tým: šest nástrojů a jeden šéf (~4:00)

> VIZ: Uzel „NÁSTROJE“. Uprostřed velká karta Claude Code, kolem na oběžné dráze ikony Higgsfield, ElevenLabs, Canva, ChatGPT, GitHub. Čáry se kreslí od Clauda ke každému nástroji ve chvíli, kdy ho jmenuju. U enginu se rozloží animované schéma HTML → Playwright (snímek po snímku) → ffmpeg → MP4.

{#team} Než začnem, musíš znát tým. Protože tohle není jedna appka, kam napíšeš prompt a vypadne video. Je to šest nástrojů a jeden z nich řídí všechny ostatní.

{#claude} Ten šéf je Claude Code. Konkrétně cloudová session napojená na GitHub repozitář. Tím myslím, že Claude neběžel u mě na počítači, ale v cloudu, a všechno, co vyrobil, ukládal do repozitáře. Říkám mu režisér a střihač. Psal kód, stříhal, míchal zvuk, renderoval a přes konektory ovládal ostatní nástroje. Já jsem mu jen říkal, co chci.

{#engine} Druhá věc je vlastní news-reel engine. Tohle je podle mě to nejzajímavější z celýho videa, tak si to vysvětlíme pořádně.

{#html} Motion grafika v Reelu není z After Effects. Claude ji naprogramoval jako webovou stránku. HTML a CSS, tedy to samý, z čeho je postavenej každej web. Každá scéna je šablona: app, bigtype, phone, fan, stack, iphone, words, particles a cta. Na šablony se podíváme, až budem rozebírat motion grafiku.

{#playwright} Pak přijde Playwright. To je nástroj, kterej ovládá prohlížeč místo člověka. Otevře tu stránku, posune animaci o jeden snímek a vyfotí ji. Pak zase o snímek dál a znova fotka. Snímek po snímku.

{#ffmpeg} A nakonec ffmpeg. Program, kterej z těch fotek složí video a přidá k němu zvuk.

{#sync} A ten nejdůležitější trik. Animace nejsou na pevnejch časech, ale jsou navázaný na časy slov v hlase. Když hlas řekne slovo fotky, v tu chvíli naskočí karta Fotky. Když se hlas změní, grafika se posune s ním.

{#skill} Třetí věc je skill. Jmenuje se efektive-aktuality. Skill je návod pro Clauda, jak takovej díl vyrobit. A tady je ten fígl: po každý mojí zpětný vazbě se do něj zapíšou nový pravidla. Takže další díl už Claude dělá chytřejc. Ta pravidla ti na konci ukážu všechny.

{#higgs} Čtvrtej je Higgsfield. Tam se generujou obrázky a videa. Obrázky přes model gpt image dva bod pět, video přes Seedance dva bod pět, hlavně jeho režim multishot. A na testy Kling tři bod nula.

{#eleven} Pátej je ElevenLabs. Tam jsou čtyři věci. Voice Design, kde si navrhneš úplně novej hlas jen popisem. Namluvení textu, model eleven v4. Zvukový efekty a hudební podklad. A Scribe, kterej udělá přepis řeči i s časem každýho slova. Ten budeme potřebovat hodně.

{#canva} Šestej je Canva, na thumbnail, tedy cover Reelu.

{#chatgpt} A ChatGPT na úplnej začátek. Z něj přišel text novinky v pevným formátu: Novinka ze… Co se změnilo. Pro klienty. Vyzkoušet.

{#teamsum} Takže ještě jednou. ChatGPT dodá informace. Claude Code je mozek a ruce. Higgsfield kreslí a natáčí. ElevenLabs mluví a dělá zvuky. Engine animuje. A Canva udělá cover.

---

## K03 · Krok 1: Vstup a první verze (~2:00)

> VIZ: Uzel „KROK 01“. Karta s textem novinky z ChatGPT (4 sekce). Pak scénář s cue značkou `[[boom]]`, která na plátně „bouchne“. Pak náčrt hooku: cihlová zeď → tabule → fixa zakroužkuje datum.

{#s1} Krok jedna. Vstup a první verze.

{#paste} Začalo to úplně obyčejně. Vložil jsem Claudovi text novinky z ChatGPT. Instagram Edits nově podporuje karusely. Novinka ze sedmýho října. Co se změnilo: fotky, videa, texty, efekty, uložený fonty, styly, samolepky. Zatím iOS, Android následuje. Pro klienty: rychlejší produkce. A Vyzkoušet.

{#script} Claude podle skillu udělal tři věci. Zaprvé scénář voiceoveru s takzvanejma cue značkama. {#cue} To jsou body střihu přímo v textu, třeba dvojitý hranatý závorky a slovo boom. Na tom místě má v obraze něco bouchnout. Takže už ve scénáři je napsaný, kde se bude stříhat.

{#scenes} Zadruhé scény motion grafiky. {#tabule} A zatřetí první hook: tabule. Kamera jede podél cihlový zdi až ke školní tabuli s kalendářem a fixa zakroužkuje datum.

{#s1note} Tenhle hook ve finále není. Ale bez první verze by nebylo od čeho se odrazit. První verze je od toho, abys viděl, co nechceš.

---

## K04 · Krok 2: Cold open s postavičkou (~3:30)

> VIZ: Uzel „KROK 02“. Character sheet uprostřed. Kolem pět karet, ve kterých se přehrávají skutečné cold-openy (noviny, spánek, notebook, mobil, sešit). Prompt „Edit the FIRST image…“ s postupným zvýrazněním. Čtyři callouty zpětné vazby. U sound designu vrstvy zvuku jako stopy v timeline.

{#s2} Krok dva. Úvodní scénky s postavičkou, takzvanej cold open.

{#char} Postavička je dvourozměrnej kluk z character sheetu. Character sheet je jeden obrázek, kde je postava z víc stran, aby ji AI pokaždý nakreslila stejně. Velký hranatý brejle, zrzavo-hnědý rozcuchaný vlasy, růžová kůže, zelená kostkovaná košile a džíny.

{#rooms} A teď ten trik. Postavička žije v reálnejch fotkách mejch místností. Nejsou to vygenerovaný pokoje. Jsou to skutečný fotky a kreslenej kluk je do nich vloženej.

{#variants} Udělali jsme pět variant. Noviny. Spánek. Notebook. Mobil. A sešit.

{#editprompt} Obrázky vznikly v gpt image dva bod pět tak, že se upravila skutečná fotka a vložila se do ní postavička. Prompt začínal takhle: uprav první obrázek, je to skutečná fotka místnosti. Nech fotku pixel po pixelu stejnou. Vlož do ní kreslenou postavičku z druhýho obrázku, z character sheetu, a posaď ji na skutečnou dřevěnou židli.

{#editwhy} Všimni si tý struktury. První obrázek je fotka, která se nesmí změnit. Druhej obrázek je jen reference postavy. A pak přesně, kam ji dát. Čím přesnějc řekneš, co se nesmí změnit, tím líp to model dodrží.

{#fb2} A teď moje zpětná vazba. Tady začíná ta reálná práce.

{#fb2a} Zaprvé: mobil nesmí levitovat. Musí bejt z pohledu první osoby v jeho kreslený ruce.

{#fb2b} Zadruhé: pryč s útěkem a leknutím na konci. Konec má bejt jen: počkej, jakej je datum? A hned přechod.

{#fb2c} Zatřetí: víc dynamiky a rychlejší tempo pro sociální sítě. Záběry od půl sekundy do jedný celý čtyř desetin sekundy.

{#fb2d} A začtvrté: sound design jako ve filmu, ne jen AI efekty. {#sd} Claude si na to udělal vlastní designovaný zvuky. Vrstvený švihy. Klik plus tělo plus sub. Riser. Tension drone. A atmosféru, která se stříhá s obrazem.

{#sdexplain} Co to znamená. Jeden dobrej zvuk ve filmu skoro nikdy není jeden zvuk. Klik je ten ostrej začátek, tělo je to, co má váhu, a sub je hluboká basa, kterou spíš cítíš, než slyšíš. Riser je zvuk, kterej stoupá a buduje napětí. A drone je dlouhej podkladovej tón, kterej drží atmosféru.

---

## K05 · Krok 3: Kalendář a 3D kostka (~2:30)

> VIZ: Uzel „KROK 03“. Moje citace jako velká karta. Pak se na plátně postaví skutečná 3D kostka: na jedné stěně kalendář z reelu, na sousední grafika z reelu. Kamera kostku otočí doprava přesně jako v reelu. Při „chybě“ se levá stěna rozsvítí červeně a zmizí.

{#s3} Krok tři. Krátkej hook s kalendářem a 3D kostka.

{#q3} Tady je moje zadání doslova: Žádnej whip pan ze zdi, rovnou střih na kalendář, sedmička uprostřed, pryč papír novinka ze sedmýho října, a z tý zakroužkovaný sedmičky to 3D otočit doprava jako v After Effects rovnou do karuselů.

{#cal} Claude udělal tvrdej střih na detail kalendáře se sedmičkou přesně uprostřed. Najetí kamerou. A zakroužkování fixou.

{#cube} A pak ten 3D přechod. Představ si kostku. Na jedný stěně je kalendář, na sousední stěně je grafika. {#cuberot} Kamera se otočí na pravou stěnu a ty najednou koukáš do grafiky. Obraz se neprolne, on se fyzicky otočí v prostoru.

{#cubebug} A hned chyba. Mezi první a druhou sekundou zůstávala vidět levá stěna kostky. Claude ji nechal zmizet a bylo to.

{#vo3} A ještě jedna věc. Claude k tomu napsal scénář voiceoveru s časovejma kódama, abych si ho mohl namluvit sám. Tohle se hodí, když chceš vlastní hlas. Přesně víš, kdy co říct.

---

## K06 · Krok 4: Spider-Verse nehoda (~3:30)

> VIZ: Uzel „KROK 04“. Kalendář s „7“ a „19“ a šipkou, proč to nesedí. Pět nehod jako pět karet s komiksovými citoslovci (KAP! ŠPLÍCH! ŤUK! PLESK! FFFT!). Kafe se zvětší a ostatní odletí. Sedm Spider-Verse znaků: každý má malou živou ukázku (on twos = sekaný pohyb 12 fps, Ben-Day tečky, CMYK posun…). Slepá ulička = karta Chrome, která se přeškrtne. Style framy z reelu.

{#s4} Krok čtyři. Novej koncept: Spider-Verse nehoda místo úvodních scének.

{#why4} Devatenáctýho října mi došlo, že to nedává smysl. Novinka je ze sedmýho, ale video vychází devatenáctýho. Tak jsem chtěl jednu lokaci, tu tabuli. Postavičku jako 2D animaci ve stylu Spider-Verse a reálný prostředí. Má se stát nehoda, která skončí na sedmičce, a postavička řekne: počkej, sedmýho. Pak hlas a grafika.

{#five} Claude navrhl pět nehod a pět replik. {#n1} Barva, KAP! Kapka červený barvy z pětky. {#n2} Kafe, ŠPLÍCH! Kafe udělá kroužek kolem sedmičky. {#n3} Šipka, ŤUK! Mine terč a zapíchne se do sedmičky. {#n4} Žvejkačka, PLESK! Bublina praskne a kus přistane na sedmičce. {#n5} A vlaštovka, FFFT! Papírová vlaštovka se zapíchne do sedmičky.

{#coffee} Vybrali jsme kafe.

{#svtraits} A teď styl. Tohle jsou Spider-Verse znaky, který se dávají do úplně všech promptů. Rozeberem si je, protože každej něco dělá.

{#t1} Animace on twos. To znamená dvanáct kreseb za sekundu místo dvaceti čtyř. Každá kresba vydrží dva snímky. Pohyb je trošku sekanej a právě proto vypadá jako ručně kreslenej.

{#t2} Tlustý obrysy. Jako komiks kreslenej tuší.

{#t3} Ben-Day rastrový tečky. To jsou ty puntíky ze starejch tištěnejch komiksů, kterejma se dělaly odstíny.

{#t4} Šrafování stínů. Stín není rozmazanej, je nakreslenej čárama.

{#t5} Posunutý CMYK barvy místo motion bluru. Když se něco rychle hejbe, není to rozmazaný, ale barvy se rozjedou vedle sebe. Jako když se netrefí tisk.

{#t6} Smear frames. Snímek, kde je tělo natažený a rozmazaný do tvaru pohybu.

{#t7} A komiksový impact snímky. Moment nárazu, kde se všechno na chvilku zastaví a bouchne.

{#dead} A teď slepá ulička. Chtěl jsem, ať Claude generuje obrázky přes ChatGPT v Chromu. Jenže z cloudový session to nejde, protože nemá přístup k mýmu počítači. {#higgsswitch} Takže jsme přešli na Higgsfield a já si dobil kredity.

{#styleframes} Pak style framy. gpt image dva bod pět se dvěma referencema: fotka tabule s kalendářem a character sheet. Všechny prompty jsou uložený v repozitáři v souboru spiderverse-prompty. Dobrej zvyk. Prompty si ukládej, budeš je potřebovat znova.

---

## K07 · Krok 5: FPV dron, verze 1 (~2:00)

> VIZ: Uzel „KROK 05“. Schéma start frame → ? → end frame, kde end frame je přímo snímek z enginu (šipka „pixel po pixelu stejný“). Časová osa klipu 0–1 s, úsek 0,38–0,72 s svítí červeně s ikonou dronu. Pak nůžky střihnou na 0,80 s.

{#s5} Krok pět. Kafe gag verze jedna, FPV dron, a proč nestačil.

{#omni} Seedance dva bod pět v režimu omni reference se start framem a end framem. Start frame je první snímek videa, end frame je poslední. Model vymyslí, co se stane mezi nima.

{#endframe} A tady je chytrá věc. End frame je snímek kalendáře přímo z enginu. Takže poslední snímek AI videa je stejnej jako první snímek grafiky. Proto to na sebe navazuje bez švu.

{#kling} Testy šly přes Kling tři bod nula.

{#fpvprompt} Prompt začínal takhle: filmovej FPV záběr z dronu, rychlej a dynamickej. Ten 2D komiksovej kluk ve stylu Spider-Verse se v klidu napije kafe. FPV kamera se k němu střemhlav spustí a obletí ho. Kafe vyletí a dopadne jako kroužek kolem sedmičky.

{#dronebug} A chyba. V klipu byl na chvilku vidět samotnej dron. Od nula celá třicet osm do nula celá sedmdesát dva sekundy. Moje reakce: dron nesmí bejt vidět, má to bejt footage z dronu. {#dronefix} Řešení: klip začíná až od nula celá osmdesát sekundy.

{#lesson5} Zapamatuj si to. Když napíšeš do promptu drone shot, model ti tam může nakreslit i ten dron. Proto je v dalším promptu dron natvrdo zakázanej. A pak jsem stejně chtěl úplně jinej střih.

---

## K08 · Krok 6: Hook v jednom kuse, multishot (~5:30)

> VIZ: Uzel „KROK 06“ je největší cluster mapy. Moje zadání jako seznam. Sedm keyframů ve 3D vějíři. Cena 42 kr. jako velké číslo (ukazatel limitu 70–100). Pak celý prompt jako obří karta: kamera po něm jede shot po shotu a vedle každého shotu se ukáže odpovídající snímek z reelu. Časová osa 0–6 s / 144 snímků s osmi barevnými segmenty. Na konci se hook přehraje velký s původním zvukem.

{#s6} Krok šest. Hook v jednom kuse přes Seedance dva bod pět multishot. Tohle je hlavní trik celýho videa.

{#brief6} Moje zadání, zkráceně. Normální rychlost sto třicet procent. Minimálně tři střihy. Nejdřív si vykračuje v širokým záběru, detail kafe a pískání, bum, zakopne, detail boty. Pak rychlý střihy ve slow motion: pád, kafe se vylejvá, obličej, kapka letí ke kalendáři. Kalendář normální rychlostí, cákanec na sedmičku.

{#tech6} V jednom kuse, multishot Seedance dva bod pět, sedm set dvacet p, šest sekund, šestnáct ku devíti, maximálně sedmdesát až sto kreditů. Rozepsat přesnej timing v sekundách i ve framech a měnit typy kamer: širokoúhlá, rozmazaná kytka v popředí a tak dál. {#110} A na konec: hook je vo všem, dej do toho sto deset procent.

{#multiexplain} Co je multishot. Normálně ti video model vygeneruje jeden záběr. Multishot vygeneruje víc záběrů s tvrdejma střihama mezi sebou, v jednom videu. Dostaneš rovnou sestříhanou sekvenci.

{#keyframes} Příprava: Claude nejdřív vygeneroval sedm keyframů v gpt image dva bod pět. FPV pohled. Širokej záběr. Bota. Hrnek. Obličej. Kapka. Cákanec. {#refs} Pak je dal do Seedance jako image references, k tomu start frame a end frame z enginu.

{#cost6} Výsledná cena: čtyřicet dva kreditů. Sedm set dvacet p, šest sekund. Hluboko pod limitem.

{#prompt6} A teď prompt. Celej. Projdeme ho kus po kusu.

{#look} První odstavec je look. Multishot, šest sekund při dvaceti čtyřech snímcích, tvrdý střihy, extrémně dynamickej střih pro sociální sítě. Pak popis kluka do posledního detailu: velký hranatý brejle, rozcuchaný zrzavo-hnědý vlasy, růžová kůže, zelená kostkovaná košile, modrý džíny, hnědý boty, bílej hrnek. {#lookstyle} Pak všech sedm Spider-Verse znaků, co jsme si vysvětlili. {#room} A pak místnost, která zůstává fotorealistická. Cihlová zeď, zelená tabule, papírovej kalendář Říjen dva tisíce dvacet šest, teplý pruhy slunce přes žaluzie, dřevěná podlaha a černej kabel na zemi.

{#neg} A na konci: žádnej viditelnej dron, žádnej text, žádný titulky, žádný bubliny. To je přesně ta lekce z minulýho kroku.

{#shots} A teď osm záběrů. Každej má čas v sekundách i čísla snímků.

{#sh1} Záběr jedna, nula až jedna celá dvacet sekundy, snímky jedna až dvacet devět. Ultra wide fisheye z horního rohu místnosti, přesně jako start frame. Vykračuje si, pije kafe a píská.

{#sh2} Záběr dva, do jedný celý devadesáti. Nízkej sledovací detail z boku ve výšce kolen, v popředí rozmazaný zelený listy kytky. Houpající se hrnek, ze kterýho se kouří, a kráčející nohy.

{#sh3} Záběr tři, do dvou celých třiceti. Extrémní detail u země. Hnědá bota se zasekne o kabel. Smear frame, impact frame.

{#sh4} Záběr čtyři, do dvou celých osmdesáti. Slow motion čtyřikrát, širokej záběr s nakloněnou kamerou. Padá dopředu, mává rukama, brejle mu sjíždějí, hrnek mu vyletí z ruky.

{#sh5} Záběr pět, do tří celých třiceti. Slow motion makro. Hrnek se ve vzduchu naklání, vylejvá se lesklej oblouk kafe, kapky zamrzlý ve slunci.

{#sh6} Záběr šest, do tří celých osmdesáti. Slow motion extrémní detail obličeje. Vyděšenej, obrovský oči za brejlema, pusa otevřená, nééé, kolem letí kapky.

{#sh7} Záběr sedm, do čtyř celých šedesáti. Slow motion přes rameno. Jedna velká kapka kafe letí k papírovýmu kalendáři na tabuli.

{#sh8} A záběr osm, do šesti sekund. Zpátky normální rychlost, rychlej snap zoom. Kafe cákne na kalendář přesně na sedmičku, pár kapek steče dolů a kamera se zastaví na detailu kalendáře, přesně jako end frame.

{#frames} Proč i čísla snímků? Šest sekund krát dvacet čtyři je sto čtyřicet čtyři snímků. Bylo to přímo v mým zadání: rozepsat timing v sekundách i ve framech. Model i střih pak má přesnej plán.

{#watch6} Podívej se, jak to dopadlo.

> VIZ: Přehraje se hook z reelu (0–6 s) velký uprostřed s původním zvukem.

---

## K09 · Krok 7 a 8: Střih hooku, sound design, dostřih (~3:30)

> VIZ: Uzel „KROK 07“. Klip rozdělený na segmenty jako v střihovém programu, normální záběry se „smrsknou“ na 1,3×, slow-mo zůstanou. Vadný záběr se vyjme a odletí. Sound design jako 7 barevných stop pod obrazem, které se vrství jedna po druhé. Krok 8: vlna zvuku, nůžky, 80ms crossfade jako dva překrývající se trojúhelníky.

{#s7} Krok sedm. Střih hooku. A pozor, bez dalšího generování.

{#cut7} Claude ten klip rozstříhal na segmenty. Normální záběry zrychlil na jedna celá tři krát, slow motion nechal. {#bad} Vyhodil vadnej záběr, kde už byla skvrna na kalendáři dřív, než kafe dopadlo. A k tomu komiksovej nápis ŠPLÍCH. A zbytek zvětšil na ten devatenáct set dvacet krát deset osmdesát.

{#order} Pořadí záběrů: širokej příchod, nízkej záběr přes rozmazanou kytku, detail boty a zakopnutí, slow motion hrnek, slow motion obličej, kapka přes rameno, a kalendář normální rychlostí s cákancem.

{#twos} A jeden detail, kterej skoro nikdo neřeší. Animace je on twos a po každým střihu začíná znova, aby se snímky nemíchaly přes střih.

{#sd7} Sound design hooku. Každá vrstva má přesnej čas. {#l1} Pískání a kroky. {#l2} Švihy na střihy. {#l3} Zadrhnutí o kabel a úder. {#l4} Hudba rozdělená na tři části, a ve slow motion je ztlumená přes low-pass filtr. Low-pass pustí jen hloubky, takže to zní, jako bys byl pod vodou. Hned to působí zpomaleně. {#l5} Slow-mo atmosféra a lití kafe. {#l6} Švih vzduchu. {#l7} A na dopad: riser, šplouchnutí, úder, sub a impact.

{#approve7} A důležitý pravidlo. Render jen hooku na schválení, ne celýho videa. Celý video se renderuje přes hodinu, samotnej hook kolem dvaceti minut. Takže schvaluješ po částech.

{#s8} Krok osm. Dostřih podle mě.

{#q8} Moje zadání: vystřihni Ne, na sedmičku ne, nech tam jen tu otázku Sedmýho… října? Zkrať úsek s kalendářem, ať tam není cut v audiu. {#q8b} A pak ještě: o půl sekundy zkrátit.

{#fix8} Claude vystřihl úsek z hotovýho videa, obraz i zvuk, a zvuk prolnul přes osmdesát milisekund, aby nebyl slyšet střih. {#swish8} Na střih přidal tichej švih a sub, aby ten skok v obraze působil záměrně. {#half} A pro tu další půl sekundu zkrátil držení kalendáře a repliku zrychlil. Bez změny výšky hlasu. Když zrychlíš zvuk normálně, hlas začne pištět. Tohle zrychlí tempo a výška zůstane.

---

## K10 · Motion grafika: šablony a navázání na slova (~3:30)

> VIZ: Uzel „MOTION GRAFIKA“. Devět šablon jako devět „obrazovek“ rozestavěných do oblouku ve 3D. V každé se přehrává přesně ten úsek reelu. Kamera jede od jedné ke druhé. U navázání na slova: řádek slov z přepisu jako bloky na časové ose, od slova „fotky“ vede čára ke kartě Fotky. Pak se hlas „přegeneruje“ (bloky se roztáhnou) a karta se posune s ním.

{#mg} A teď se na chvilku zastavíme u motion grafiky, protože na tu se mě ptá nejvíc lidí.

{#mgrecap} Pamatuješ: HTML a CSS, Playwright, ffmpeg. Každá scéna je šablona a animace jsou navázaný na slova. Teď si projdeme šablony, tak jak je vidíš v Reelu.

{#tapp} App. Ikona appky, štítek App Store zdarma, název Instagram Edits a pod tím Appka přímo od Instagramu. A tlačítko Získat, který se na slovo zadarmo ťukne a změní na Zdarma s fajfkou.

{#tbig} Bigtype. Obří nápis KARUSELY přes celou obrazovku na modrým pozadí.

{#tphone} Phone. Telefon s příspěvkem, kde se karty přejedou přesně na slova swipneš. Tohle je karusel. Swipni. Další fotka. Jasný? A vedle se rozsvěcuje text.

{#tfan} Fan. Vějíř karet: Fotky, Videa, Texty, Efekty. Do jednoho příspěvku dáš.

{#tstack} Stack. Položky naskládaný pod sebe: uložený fonty, styly.

{#tiphone} iPhone. Zatím jen na iPhonu, Android je na cestě.

{#twords} Words. Kinetická typografie, slova naskakujou jedno po druhým. Upřímně? Android maj stejně jen divný lidi.

{#tpart} Particles. Tisíce čárek se slijou do kruhu a na basovej úder vybuchnou ven. {#tcta} A cta, tedy výzva k akci: Vyzkoušej. Otevři Edits. Poskládej jeden karusel. Změř čas versus dosud.

{#wordsync} A teď ten princip navázání na slova. Je geniální v tom, jak je jednoduchej. Hlas se pošle do Scribe a ten vrátí každý slovo s časem začátku a konce. Engine pak neříká: v sekundě dvacet tři ukaž kartu. Říká: na slově fotky ukaž kartu. {#wordsync2} Takže když přegeneruješ hlas a mluví rychlejc nebo pomalejc, grafika se posune sama. Nic nemusíš přepočítávat.

{#brand} A brand: Inter, chladně bílá, grafit, modrá a listová zelená, lesklý koule. Nahoře vlevo štítek Aktualita nula jedna, sedmýho října, s modrou linkou, a vpravo číslo scény. Přesně tenhle styl vidíš i teď kolem sebe.

---

## K11 · Krok 9 a 10: Hlas Efík, ASMR a výměna hlasu bez renderu (~3:00)

> VIZ: Uzel „HLASY“. Voice Design prompt Efíka v originále. Tři návrhy jako tři vlny, jedna se rozsvítí, ukazatel výšky „~290 Hz“. ASMR: karta s tagem a efektovým řetězcem (basy → presence → de-esser → kompresor → L/R). Výměna hlasu: dvě řady slovních bloků nad sebou, spodní se natáhnou a smrsknou přesně pod horní. Velké „0 min renderu“.

{#s9} Krok devět. Vlastní hlas číslo jedna. Efík. Podle Alza panáčka.

{#q9} Moje zadání: vytvoř si vlastní hlas v ElevenLabs v4. Rozlož si, jak funguje hlas Alza panáčka. Pištivej, s přízvukem, otravnej, ale zůstane v hlavě. Podívej se na charakter a udělej k němu hlas.

{#vd9} Voice Design prompt v překladu: mladej českej hlas kreslenýho maskota, něco přes dvacet, nerdovskej a drzej. Vysoko posazenej, trochu pištivej a nosovej, jasná bzučivá barva, s hravým přízvukem a zpěvavou intonací nahoru na koncích vět. Rychlej, hyperenergickej projev s úsměvem a čistou dikcí. Lehce otravnej, ale roztomile, okamžitě zapamatovatelnej. Profesionální studiová nahrávka, mikrofon zblízka.

{#pick9} Ze tří návrhů Claude vybral ten nejpištivější a nejvíc zpívající. Změřil výšku hlasu, medián zhruba dvě stě devadesát hertzů. Uložil ho jako Efík, Aktuality maskot. A stejnym hlasem namluvil i repliku postavičky.

{#s10} Krok deset. Pokus o ASMR šepot, kterej jsem zamítnul, a trik: výměna hlasu bez renderu.

{#q10} Zadání: ať mi šeptá do ouška, vtipně, hodně zesílený, ASMR.

{#asmr} Claude namluvil šepot ve v4 s tagem pro šeptání do ucha. A zvukem dodělal mikrofon u pusy: víc basů, presence, de-esser, kompresor a víc v levým uchu.

{#swap} A teď ten trik, kterej je podle mě nejcennější věc z celýho tutoriálu. Každý slovo novýho hlasu natáhl nebo zkrátil přesně na čas původního slova, podle přepisu ze Scribe. {#swap2} Takže grafika dál seděla a video se nemuselo znovu renderovat. Jen se přemíchal zvuk, za pár minut. Místo celýho renderu.

{#no10} A moje reakce? Tuhle verzi ne, zpátky na původní. I to je výsledek. Vyzkoušelo se to za pár minut, ne za hodinu.

---

## K12 · Krok 11: Výslovnost a zvuky na slova (~2:00)

> VIZ: Uzel „KROK 11“. „carousel“ se přepíše na „karusel“, „apps“ na „apek“. Chyba: vlna slova „Insta…“ s uříznutým začátkem, přepisová značka [tag] „sežere“ kus času. Pak seznam zvuků jako ikony, z nichž každá visí na konkrétním slově (foťák → Fotky, projektor → videa…).

{#s11} Krok jedenáct. Výslovnost a další zvuky.

{#q11} Zadání: musíš opravit výslovnost, apek ať říká česky, karusel říká úplně špatně.

{#phon} Řešení: anglický slova se v textu pro hlas píšou foneticky česky. Karusely, karusel, apek. Tak, jak je má hlas vyslovit, ne tak, jak se píšou.

{#bug11} Chyba a oprava. Při napojení novýho hlasu na časy se uřízl začátek Insta. Přepis špatně určil začátek prvního slova, protože tag na začátku textu sežral jeho čas. {#fix11} Claude pak začátek prvního slova bral podle skutečnýho zvuku, ne podle přepisu.

{#sfxfolder} Pak jsem chtěl zvuky ze svý složky AI SFX na ploše. Je tam deset tisíc zvuků. Jenže z cloudový session to nejde a na Google Disku složka nebyla. {#gen11} Takže Claude vygeneroval nový zvuky v ElevenLabs.

{#sfxlist} Hudební podklad pod grafikou, protože do tý doby tam žádná hudba nebyla. Foťák na slovo Fotky. Projektor na videa. Klávesnice na texty. Třpyt na efekty. Samolepka. Notifikace na iPhonu. Glitch na Android. Stopky na kolik času ušetříš. A basový údery a švihy.

{#bound} Každej zvuk je navázanej na konkrétní slovo v hlase, ne na pevnej čas. Když se změní hlas, zvuky se posunou samy. Stejnej princip jako u grafiky.

---

## K13 · Krok 12: Risery, kamera jako adjustment layer, Apple zvuky (~3:00)

> VIZ: Uzel „KROK 12“. Tři risery jako tři stoupající křivky hlasitosti, všechny vrcholí na jedné svislé čáře „dopad kafe“. Kamera: graf šesti easing křivek (linear, quad, cubic, quart, expo, sine), po každé jede kulička, vedle živá ukázka zoomu se stejnou křivkou. Rámeček „max 11 %“ s hlavičkou nahoře. Apple vrstva jako malé značky na časové ose.

{#s12} Krok dvanáct. Risery, kamera jako adjustment layer a Apple zvuky.

{#q12a} Zadání jedna: navrstvi dva až tři risery. Začne potichu už kousek před zakopnutím, zesiluje přes kafe, obličej, a skončí, když to spadne na sedmičku.

{#q12b} Zadání dvě: chybí mi kamera movement jako adjustment layer v After Effects. Push in, push out, quadratic, ease in, ease out. Aby se pořád něco dělo, clean křivky. U všechno v jednom příspěvku je dlouho statická scéna.

{#q12c} A zadání tři: čistý Apple zvuky.

{#risers} Risery: tři. Šumovej, tónovej a jemnej. Všechny vrcholí přesně v okamžiku dopadu kafe. Plus dva švihy na pád.

{#adj} Kamera. Adjustment layer v After Effects je vrstva nad celou kompozicí, která ovlivní všechno pod ní. Claude to udělal stejně: kamerový pohyby jako dodatečná vrstva nad hotovým obrazem.

{#curves} Klíčový snímky zoomu s křivkama. Linear, quad, cubic, quart, expo a sine. {#curvesx} Linear je pořád stejná rychlost a vypadá roboticky. Quad, cubic a quart postupně silnějc zrychlujou na začátku a brzdí na konci. Expo je nejprudší, skoro švih. A sine je nejjemnější, jako nádech.

{#zooms} Rychlý zoomy s motion blurem a na změnách scén krátký přeskoky dlouhý nula celá čtrnáct sekundy. {#max11} Zoom je maximálně zhruba jedenáct procent, aby nahoře nezmizela hlavička.

{#nore} A celý to bylo bez novýho renderu. Tři a půl minuty. Protože kamera se aplikuje na už hotový video.

{#apple} A Apple vrstva. Jemnej švih a ťuknutí na každou změnu scény. Tichý tick na klíčový slova. Měkkej pop. A dvoutónový cinknutí na Tak to zkus.

{#meta12} A mimochodem, přesně takovýhle křivky a pomalej push in používá i kamera v tomhle videu. Proto se obraz pořád jemně hejbe, i když zrovna nic nevysvětluju.

---

## K14 · Krok 13 a 14: Hlas Aura, vložky a vtip (~3:30)

> VIZ: Uzel „HLASY“ dostane druhou větev „Aura“. Voice Design prompt v originále, tři návrhy kolem 80 Hz (porovnání s Efíkem 290 Hz na stupnici). Tag a „1,15×“. Pak finální text voiceoveru jako velká karta. Přehraje se reel od 6 s do konce s původním zvukem a slova v kartě se zvýrazňují. Mechanika vtipu jako diagram: hudba STOP → vtip → risery ↑ → BUM → hudba.

{#s13} Krok třináct. Vlastní hlas číslo dvě. Aura, finální vypravěč.

{#q13} Zadání: Efík je moc provokativní, chci zastřenej hlas, gigachad, aura týpek s testákem, klidnější, vysvětlující, ale s energií.

{#vd13} Voice Design prompt v překladu: hlubokej, zastřenej českej mužskej hlas, kolem třiceti. Hodně nízko posazenej se silnou hrudní rezonancí, lehce chraplavej, trochu dýchavej. Klidnej, sebejistej, charismatickej, uvolněnej, ale vtahující. Vysvětluje věci jasně jako cool mentor a nikdy nekřičí. Profesionální studiová nahrávka zblízka, čistá a teplá.

{#pick13} Ze tří návrhů, všechny kolem osmdesáti hertzů, Claude vybral ten nejchraplavější s největším rozsahem intonace, aby nebyl monotónní. {#tag13} Na začátek namluvení dal tag: sebejistě, uvolněně, svižným tempem. A ve videu je hlas zrychlenej na jedna celá patnáct krát.

{#s14} Krok čtrnáct. Vložky vysvětli jako dítěti a vtip.

{#ins1} Vložka jedna: pro ty pomalejší, co nevědí, co jsou karusely. Vizuálně příspěvek na Instagramu, swipneš, swipneš, už to chápeš.

{#ins2} Vložka dvě: zatím na iPhonu. Android je teprve za opicem. Jenom divný lidi maj Android, jdem dál. A k tomu: zasekne se DJ disk, joke, riser přes joke, a pak zase bomby.

{#ins3} A mezitím jsem ještě doplnil: ukaž na začátku, že je to appka od Instagramu, kterou si stáhneš z App Storu, zdarma. To lidi rádi slyšej.

{#final} Tady je finální text voiceoveru. Poslechni si, jak to do sebe zapadá.

> VIZ: Přehraje se reel od 6 s do konce s původním zvukem (hlas Aura), slova se v kartě zvýrazňují.

{#joke} A mechanika vtipu. Hudba se zastaví, zvuk DJ brake, zaseknutá deska. Kamera skočí blíž a stojí. Na obrazovce: Upřímně? Android maj stejně jen divný lidi. Pod tím rostou risery. A na Takže jedem dál přijde basovej úder a hudba naskočí zpátky.

{#render14} Celej render: padesát jedna minut. Výsledek čtyřicet dva sekund a minus čtrnáct celá čtyři LUFS.

---

## K15 · Krok 15 a 16: Popisek a cover (~2:30)

> VIZ: Uzel „PUBLIKACE“. Mockup telefonu s Reelem, pod ním popisek, který je oříznutý za prvním řádkem („…více“), první řádek svítí. Pak cover: tři vrstvy (pozadí #0C0F14, bílá karta, samolepka) se ve 3D rozloží od sebe jako v Canvě. Ořez 9:16 → 3:4 jako dva rámečky. Varianta „nahraješ rovnou 3:4“ se ořízne podruhé a okraje zčervenají.

{#s15} Krok patnáct. Popisek na Instagram.

{#q15} Zadání: jako kdyby to bylo ode mě, půl na půl bez diakritiky, dvě chyby, první slova co nejúdernější, pár hashtagů.

{#rule15} Pravidlo: na Reelsech je před „více“ vidět jen první řádek, zhruba čtyřicet až padesát znaků. Hook musí bejt tam.

{#cap15} Finální popisek začíná: AKTUALITA číslo jedna, celou ji udělal Claude. A pak: Jo, fakt. Scénář, hlas, animace, zvuky, střih, všechno jsem dělal s AI a já jen říkal, co chci. Pak o čem to je, pro koho, výzva k followu a pět hashtagů.

{#why15} Proč bez diakritiky a se dvěma chybama? Protože to má vypadat, že to píšu já.

{#s16} Krok šestnáct. Thumbnail, tedy cover v Canvě.

{#q16} Zadání: aby to fitlo do gridu, ne fullscreen, pozadí stejnou barvou jako tady, tmavá, bílej obdélník se zaoblenejma rohama s tématem karuselů, a postavička jako sticker, co přesahuje i do pozadí, politá kafem.

{#sticker} Samolepka vznikla v gpt image dva bod pět. Reference: character sheet a Spider-Verse style frame s kafem. Prompt: vyřezávaná vinylová samolepka toho kluka ve stylu Spider-Verse. Celá postava, uprostřed zakopnutí, v šoku, drží bílej hrnek, ze kterýho cáká kafe. Celá samolepka je politá kafem. Tlustej bílej okraj kolem siluety. Na šedým pozadí, bez textu.

{#cardc} Karta: Aktualita, sedmýho října, s cákancem kafe přímo na sedmičce, jako odkaz na hook. Štítek číslo jedna. Karusely v Edits. Appka od Instagramu, zdarma. Vějíř karet Fotky, Videa, Texty, Efekty. Tečky jako u karuselu a Swipni. Stejnej font a barvy jako video. {#layers} V Canvě jsou to tři vrstvy: pozadí, karta a samolepka.

{#burn} A tady jsme se spálili. Cover Reelu se nahrává jako devět ku šestnácti, tedy deset osmdesát krát devatenáct set dvacet. {#crop} Instagram si z něj pro mřížku profilu vyřízne střed tři ku čtyřem, deset osmdesát krát čtrnáct set čtyřicet. {#double} Když nahraješ rovnou tři ku čtyřem, ořízne se to dvakrát a zmizí okraje. {#safe} Takže všechno důležitý patří do středový oblasti tři ku čtyřem. A bílou kartu jsme nakonec ještě zmenšili o čtrnáct procent, aby kolem ní bylo vidět tmavý pozadí.

---

## K16 · Ceny a čas (~1:30)

> VIZ: Uzel „CENY“. Čísla naskakují jako počítadla. ElevenLabs položky jako vodorovný sloupcový graf. Časy renderů jako čtyři pruhy (51 min vs. 3,5 min).

{#cost} Kolik to stálo.

{#ch} Higgsfield: Seedance multishot, sedm set dvacet p, šest sekund, čtyřicet dva kreditů. Dřívější testy Seedance a Kling zhruba sedm a půl kreditu za klip. Plus obrázky: style framy, sedm keyframů a dvě samolepky.

{#ce} ElevenLabs v kreditech. Efík, čtyři verze voiceoveru: tisíc čtyři sta dvacet. Replika postavičky: sto osmdesát. ASMR šepot: tisíc osm set osmdesát osm. Oprava výslovnosti: tisíc čtyři sta čtyři. Test hlubokýho hlasu: sedm set čtyřicet osm. Finální voiceover Aura, dvě verze: tisíc tři sta dvacet čtyři. A zvuky plus hudba zhruba čtyři sta třicet.

{#ct} A čas renderů. Celý video čtyřicet pět až padesát jedna minut. Jen hook zhruba dvacet minut. Výměna hlasu nebo zvuku bez renderu pár minut. Kamerová vrstva tři a půl minuty.

---

## K17 · Deset pravidel (~2:00)

> VIZ: Uzel „PRAVIDLA“. Deset karet se skládá do mřížky 5×2 (jako „12 pravidel“ ve Ščerbovi), každá naskočí na své číslo. Na konci se mřížka „zapíše“ do ikony skillu.

{#rules} A teď to nejcennější. Deset pravidel, který z toho vyplynuly a zapsaly se do skillu. Tohle si klidně vyfoť.

{#r1} Jedna. Vysvětluj jako dítěti. Každej pojem jednou dvěma větama a ukaž ho v grafice.

{#r2} Dva. Řekni prakticky, co to je, odkud a za kolik. Appka od Instagramu, zdarma v App Storu.

{#r3} Tři. Jeden vtip na díl se zvukovou mechanikou. Hudba stop, vtip, risery, bum, hudba zpátky.

{#r4} Čtyři. Cíl zhruba čtyřicet sekund, maximum šedesát. Čím rychlejší, tím lepší. Hlas zrychlenej na jedna celá patnáct.

{#r5} Pět. Anglický slova piš foneticky česky.

{#r6} Šest. Žádná statická scéna. Kamerový pohyby s čistejma křivkama a zvuk na každý změně.

{#r7} Sedm. Hook je všechno. Multishot v jednom kuse, střídat typy kamer, slow motion, dopad přesně na datum novinky.

{#r8} Osm. Nikdy neukazovat dron a nenechávat chybný záběry. Radši je vystřihnout.

{#r9} Devět. Schvalovat po částech. Jen hook, pak celý video. Měnit zvuk a hlas bez novýho renderu, kde to jde.

{#r10} A deset. Cover vždycky devět ku šestnácti s obsahem ve středu tři ku čtyřem.

---

## K18 · Co jsem reálně dělal já + outro (~1:30)

> VIZ: Uzel „JÁ“: malý, se čtyřmi body. Pak finální odjezd kamery: celá mapa (všech 16 kroků, stovky obrázků) z dálky, čáry mezi uzly se rozsvítí v pořadí. Uprostřed logo efektive.cz, koule.

{#me} A co jsem teda reálně dělal já?

{#me1} Psal a diktoval jsem zpětnou vazbu. Česky, neformálně. Dej do toho sto deset procent. Čím rychlejší, tím lepší. Takhle ne, vrať to.

{#me2} Rozhodoval jsem. Vybral jsem nehodu s kafem, schvaloval verze, odmítl ASMR a vybral hlas Aura.

{#me3} Dobil jsem kredity na Higgsfieldu, nahrál cover na Instagram a zveřejnil.

{#me4} Všechno ostatní, prompty, generování, střih, zvuk, render, popisek i cover, udělala AI.

{#zoomout} A tohle je celá mapa. {#end} Šestnáct kroků, šest nástrojů, deset pravidel. Až budeš dělat svoje video, vrať se sem a jdi krok po kroku. Díky, že jsi tady na Patreonu. A další díl bude zase o kus lepší, protože skill se pořád učí.
