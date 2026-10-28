# Scénář: Výměna postavy ve videu – celý postup (Higgsfield: Nano Banana 2.1 + Genjutsu)

- **Cílová délka:** ~6–7 min
- **Hlas:** klon „Maty“, 1. osoba (mluví Teecee), v klidu, hovorově. Úvod „Zdarec bojs…“, konec „Zatím čus“.
- **Obraz:** 1920×1080, 30 fps

---

## K00 · Úvod (~0:50)

> VIZ: Přehraje se hotové video (pokus2, s původním zvukem). Pak vedle sebe originál a výsledek, synchronně. Štítek „AI“. Odjezd na celou mapu.

{#hook} Zdarec bojs, dneska tu máme výměnu postavy ve videu. Natočil jsem obyčejný desetisekundový video v obchodě a jednoho týpka v něm vyměnil za úplně jinýho člověka. Ten člověk tam nikdy nebyl.

{#pair} Vlevo je originál, vpravo výsledek. Týpek v červený mikině zmizel a místo něj přijde plešatej chlap v tričku adidas. A všechno ostatní zůstalo stejný: já, obchod, kamera i pohyb.

{#map} Ukážu ti celej postup ve dvou krocích, všechny prompty a hlavně oba pokusy, který nevyšly, a proč.

{#go} Jdeme na to.

---

## K01 · Cíl a postup (~0:50)

> VIZ: Uzel „CÍL“. Originál (original) v kartě, callouty na časy: „~2 s přijde zprava“, „poklepe na rameno“, „~8 s odchází do kamery“. Pak dva kroky jako karty: Nano Banana 2.1 → character sheet, Genjutsu → výměna ve videu.

{#goal} Cíl je jasnej. Ve videu stojím u regálu, kolem druhý sekundy přijde zprava týpek v červený mikině na zip, s kudrnatejma hnědejma vlasama. Poklepe mě na rameno, něco řekne a kolem osmý sekundy odejde do kamery.

{#task} A úkol: vyměnit jenom jeho. Za plešatýho chlapa z referenčních fotek, v jeho typickým outfitu. Šedofialový tričko s velkým nápisem adidas, tmavomodrý kraťasy a šedý nazouváky.

{#steps} Postup má dva kroky. Zaprvé character sheet, tedy jeden čistej referenční obrázek toho chlapa z víc stran. To dělám v Higgsfieldu modelem Nano Banana dva bod jedna. A zadruhé samotná výměna ve videu přes Higgsfield Genjutsu.

---

## K02 · Krok 1: Reference (~0:50)

> VIZ: Uzel „KROK 01“. Pět referenčních fotek vějířem (ref1–ref5), u každé štítek. Pak tři zvýrazněné (ref1, ref2, ref5) s rolemi: obličej + tričko, postava + outfit, obličej. Červený callout: „malé screenshoty, nízké rozlišení“.

{#s1} Krok jedna. Reference.

{#refs} Mám pět fotek. Detail z TikToku s obličejem a tričkem, celou postavu u auta, skupinovou fotku a dvě malý selfíčka.

{#lowres} A tady je první problém. Všechno jsou to malý screenshoty v nízkým rozlišení. Model z nich obličej pořádně nepřečte.

{#best} Takže pravidlo: míň a ostřejších je víc. Nakonec jsem použil jen tři nejlepší. Detail z TikToku na obličej a tričko, celou postavu na tělo a outfit, a selfie u žlutý zdi zase na obličej.

---

## K03 · Krok 2: Character sheet, pokus 1 (~1:10)

> VIZ: Uzel „KROK 02“. Prompt pokusu 1 (EN) s zvýrazněním „character reference sheet“, „turnaround“ a „photorealistic“ na konci. Vedle výsledek sheet1 (kreslené) s červenými callouty: kreslené, obličej není on, tričko bez adidas, vodicí čáry, 3+2 místo 4+4. Cena: 3 kredity.

{#s2} Krok dva. Character sheet v Nano Banana dva bod jedna. Šestnáct ku devíti, nejvyšší rozlišení, generování za tři kredity.

{#p1} První prompt: udělej profesionální character reference sheet toho chlapa, zachovej jeho identitu na sto procent. Nahoře celá postava ze čtyř stran, dole čtyři detaily hlavy. Outfit všude stejnej. A na konci: fotorealistický.

{#fail1} A výsledek? Kreslená ilustrace. Obličej není on, je to nějakej generickej chlap. Tričko je obyčejný šedý bez nápisu adidas. Jsou tam vodicí čáry jako u kreslířskýho turnaroundu. A místo čtyř postav a čtyř hlav vyšly tři a dvě.

{#why1} Proč? Slova character sheet a turnaround tlačí model do světa ilustrací. Přesně takhle vypadaj podklady pro animaci a hry. A jedno slovo fotorealistický na konci to nepřebije. K tomu malý rozmazaný reference a tričko popsaný moc obecně.

---

## K04 · Krok 3: Character sheet, pokus 2 (~1:10)

> VIZ: Uzel „KROK 03“. Prompt pokusu 2 (EN), zvýraznění po blocích: RAW photo + NOT…, obličej z @image1/@image3, tělo z @image2, tričko detailně, studio photoshoot. Vedle sheet2 (realistický), zelené callouty. Štítek „nová generace, ne Edit“.

{#s3} Krok tři. Druhej pokus. A pozor, jako novou generaci, ne přes Edit. Edit by držel ten kreslenej styl.

{#raw} Prompt teď začíná slovama RAW photo, skutečná fotka z full frame foťáku. A hned za tím velkejma písmenama zákazy: není to ilustrace, není to kresba, není to digital art, není to 3D render, není to kreslený. Model to bere jako první a nejsilnější informaci.

{#roles} Každá reference má jasně řečeno, k čemu je. Obličej jedna k jedné z prvního a třetího obrázku. Tělo z druhýho obrázku. A zákaz: nedělej ho hezčího, neměň mu věk ani váhu.

{#shirt} Tričko je popsaný detailně: světle levandulově šedý bavlněný tričko, velkej černej nápis adidas přes hruď, mírně sepraný, volnej střih. Plus kraťasy s bílejma šňůrkama a šedý nazouváky.

{#studio} A místo character sheetu tam je studio photoshoot. Šedý studiový pozadí, nahoře čtyři fotky celý postavy, dole čtyři portréty.

{#ok2} Výsledek: fotorealistický, jako ze studia. Obličej sedí výrazně líp, plešatá hlava, červený tváře, slabej knírek, bříško. Tričko je přesně to z videa. Drobnosti: obličej je pořád trošku učesanější než originál.

---

## K05 · Krok 4: Genjutsu, pokus 1 (~1:00)

> VIZ: Uzel „KROK 04“. Reference = celý sheet. Prompt pokusu 1 (EN). Pak pokus1 a originál vedle sebe (player) + snímky po sekundách (14_img). Červené callouty: Teecee v kraťasech, jiný obchod, lidi navíc, červená mikina v pozadí, přepálený obličej.

{#s4} Krok čtyři. Výměna ve videu v Higgsfield Genjutsu. Devět ku šestnácti, celejch deset sekund, nejvyšší kvalita.

{#p4} První pokus: jako referenci jsem dal celej character sheet. Prompt: nahraď jenom týpka v červený mikině plešatým chlapem z reference, stejnej pohyb, stejnej timing, stejný pohyby pusy. A na konci: neměň toho druhýho, neměň obchod.

{#fail4} Plešatej chlap tam je a pohyb zhruba sedí. Ale já jsem dostal jeho oblečení, kraťasy a šedý boty, a změnil se mi i obličej. Obchod je úplně jinej, jiný zboží, na stropě místo světel větrací mřížky. Do pozadí přidal lidi, který tam nebyli. Vzadu se objevuje týpek v červený mikině. A obličej je přepálenej.

{#why4} Proč? Celej sheet s výrazným outfitem model rozlil i na druhou postavu. A věta neměň nic dalšího byla až na konci a moc slabá. Model to vzal jako novou generaci scény, ne jako úpravu jedný postavy.

---

## K06 · Krok 5: Genjutsu, pokus 2 (~1:20)

> VIZ: Uzel „KROK 05“. Reference = jen výřez hlavy. Prompt pokusu 2 (EN, velkými písmeny) se zvýrazněním po blocích. Pak originál vs. pokus2 vedle sebe (player) + snímky po sekundách (16_img) + detail obličeje (17_img). Zelené callouty.

{#s5} Krok pět. Druhej pokus, zase nová generace. A dvě velký změny.

{#head} Zaprvé: jako referenci jsem dal jenom výřez hlavy zepředu ze sheetu. Ne celej sheet. Model pak nemá oblečení, který by rozlil na ostatní.

{#edit} Zadruhé prompt. Hned první věta: tohle je úprava původního videa, ne nový video. A pak: změň jenom jednu věc. Postava popsaná přesně, oblečení, vlasy a hlavně časy. Kolem druhý sekundy přijde, kolem osmý odejde.

{#keep} Pak velkejma písmenama všechno, co se nesmí změnit. Všechno ostatní musí zůstat na sto procent stejný. Nesahej na toho v černý mikině, nechej mu šedý tepláky a černý tenisky, nesmí mít kraťasy. Nesahej na obchod. Nepřidávej a neodebírej lidi. A nakonec: po červený mikině nesmí zůstat ani stopa, ani na konci.

{#ok5} A výsledek? Obchod zůstal stejnej, zboží, světla, podlaha i úhel kamery. Já jsem nedotčenej. Týpek v červený mikině je úplně nahrazenej a pohyb, poklepání na rameno i odchod do kamery sedí jedna k jedný.

{#minor} Drobnosti: když jde do kamery, obličej je měkčí a hezčí než originál, knírek a červený tváře jsou slabší. A spodek obrazu je trošku tmavší. Ale tohle je výsledek, kterej jsi viděl na začátku.

---

## K07 · Pravidla (~1:00)

> VIZ: Uzel „PRAVIDLA“. Osm karet v mřížce 4×2, každá naskočí na své číslo.

{#rules} A teď to nejdůležitější. Osm pravidel, který si z toho vezmi.

{#r1} Jedna. Pro realistickej character sheet nikdy nepiš character sheet ani turnaround. Napiš RAW photo a studio photoshoot a zákazy dej na začátek.

{#r2} Dva. Míň a ostřejších referencí je víc. A u každý napiš, co z ní má model vzít.

{#r3} Tři. Outfit popisuj detailně. Barva, nápis, střih, opotřebení.

{#r4} Čtyři. Když to ujede do špatnýho stylu, dej novou generaci, ne Edit.

{#r5} Pět. Při výměně postavy ve videu dávej jako referenci jen hlavu.

{#r6} Šest. Napiš modelu, že je to úprava, ne nový video, a vyjmenuj velkejma písmenama všechno, co se nesmí změnit. I konkrétní oblečení druhý postavy.

{#r7} Sedm. Popiš měněnou postavu i časem, od kolikátý do kolikátý sekundy.

{#r8} A osm. Když i tak model přepisuje celou scénu, záložní cesta je motion control v Klingu, kterej mění jen jednu postavu.

---

## K08 · Konec (~0:30)

> VIZ: Shrnutí dvou kroků, odjezd na celou mapu, závěrečná karta.

{#recap} Takže: ostrý reference, realistickej sheet, jen hlava jako reference a prompt, kterej řekne, že je to úprava.

{#zoomout} A tohle je celá mapa. {#end} Dva kroky, čtyři pokusy, osm pravidel. Zatím čus.
