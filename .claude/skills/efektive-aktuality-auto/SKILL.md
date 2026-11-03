---
name: efektive-aktuality-auto
description: Plně automatická výroba dílu EFEKTIVE AKTUALITY obden (čt, so, po, st…, výroba od 4:40, doručení v 8:00 Praha), od researche AI novinek přes brief, hook „glide“ (najezd na kalendář + šťouchací hláška a 3D slova v prostoru), motion grafiku, hlas Aura, sound design, kameru a render až po popisek, thumbnail (Canva) a doručení na Google Drive. Použij, když se spustí plánovaná úloha „Aktuality obden“ nebo uživatel řekne „udělej další aktualitu sám“, „automatická aktualita“ nebo „jeď pipeline od researche“.
---

# AKTUALITY: automat od researche po doručení

Vzor dílu je **Aktualita #1** (`news-reel/episodes/2026-10-13-instagram-edits/`). Celý postup a všechny skutečné prompty jsou v `news-reel/docs/tutorial-aktualita-1-postup.md`. **Přečti si ho celý, než začneš.** Technické detaily enginu jsou ve skillu `efektive-aktuality` (`.claude/skills/efektive-aktuality/SKILL.md`). Tenhle skill je dirigent: říká, CO a V JAKÉM POŘADÍ, a nastavuje laťku kvality.

**Laťka:** každý díl musí být aspoň tak propracovaný jako #1, ideálně lepší. Lepší křivky, víc vizuálního vysvětlování, žádná statická scéna, čistší zvuk. Na nic se neptej. Uživatel tuhle automatiku schválil včetně útraty kreditů (Higgsfield, ElevenLabs) v rozpočtu níže.

## Harmonogram
- **Obden:** čt 29. 10. 2026, so 31. 10., po 2. 11., st 4. 11., … (každých 48 h od 29. 10. 2026).
- Plánovaná úloha se spouští **denně ve 4:40 (Europe/Prague)** v hlavní session (ta má konektory Higgsfield, ElevenLabs, Canva, Google Drive). Nejdřív spočítej `(dnešní datum − 2026-10-29) v dnech`. Je-li číslo **liché**, napiš jen „Dnes se aktualita nedělá (obden).“ a skonči.
- **Doručení přesně v 8:00 Praha.** Když je hotovo dřív, naplánuj si `send_later` na 08:00 a doruč až na ni. Rezerva na výrobu je přes 3 h (generování ~30 min, render ~50 min).

## Rozpočet na díl (strop)
- **Higgsfield: od #5 se na hook nepoužívá** (hook „glide“ je v enginu). Kredity jen výjimečně na obrázek/samolepku (gpt_image 0,25 kr.), když to díl opravdu potřebuje.
- **ElevenLabs ≤ 3 000 kreditů:**
  - voiceover: 2 verze;
  - hláška hooku (Aura): 2 verze;
  - SFX: generuj jen nové zvuky, které v `news-reel/assets/sfx/el/` ještě nejsou. Ostatní používej znovu.

## Krok za krokem

### 1. Research (15 min)
- Projdi novinky z AI za **posledních 48 h** (WebSearch, oficiální blogy: OpenAI, Anthropic, Google, Meta, Apple, Instagram/Meta, Canva, ElevenLabs, Higgsfield, CapCut, Adobe…).
- Vyber **jednu** nejzajímavější pro podnikatele, kteří dělají obsah a marketing sami: praktická, „tohle si zkusíš dnes“, ideálně zdarma nebo levně, ověřená aspoň ze 2 zdrojů.
- Neopakuj téma posledních dílů. Seznam je v `news-reel/episodes/*/episode.json` → `title`.

### 2. Brief (formát, který dřív dělal ChatGPT)
Zapiš do `episode.json` → `source`:
```
<emoji> <Titulek> — Novinka ze <D. měsíce>.
Co se změnilo: …
Pro klienty: …
Vyzkoušet: …
Zdroje: <url>, <url>
```

### 3. Scénář voiceoveru (pravidla #1)
- **Úvod:** co to je, od koho, kde se to stáhne nebo otevře a za kolik („zdarma“ vždy zmínit, pokud platí).
- **„Pro ty pomalejší“ vložka:** vysvětli hlavní pojem jako dítěti ve 2 větách a hned ho ukaž v grafice.
- **Jeden vtip:** drzý, ne zlý, ideálně o konkurenci nebo o zbytečné práci. Za ním „Takže jedem dál!“.
- **Konec:** „Pro klienty to znamená…“ a „Tak to zkus: …“.
- **Délka:** 80–95 slov (≈ 34 s hlasu při tempu 1,15). Celé video 38–45 s.
- **Výslovnost: všechno česky** (pravidlo uživatele, chyba se opakovala v #1 i #2). **AI = „á í“, NIKDY „ej aj“.** Zkratky čti česky po písmenech (GPT = gé pé té, API = á pé í), anglická slova piš foneticky česky (karusel, apka, mejl, vork). Před každým TTS projdi skript podle slovníku `news-reel/docs/vyslovnost.md` (hledej `\b[A-Z]{2,}\b` a anglická slova), co chybí, doplň. Tagy eleven_v4: `[confident, relaxed, brisk pace]` na začátek, `[deadpan]` před vtip, `[upbeat]` po něm.
- **Cue značky:** `[[intro]] [[boom]] [[explain]] [[mix]] [[style]] [[platform]] [[joke]] [[clients]] [[clients2]] [[try]]`. Názvy a počet uprav podle tématu.

### 4. Hook „glide“ (OD DÍLU #5, nahrazuje maskota ze Seedance)
Pokyn uživatele 2. 11. 2026: **retence v reelsech šla dolů → hooky přes Higgsfield/Seedance už nedělat.** Nový hook je v enginu (`hookBoard: "glide"`, `engine/hook-board.js`), stojí jen pár desítek kreditů ElevenLabs a nic z Higgsfieldu.
- **Kamera:** jeden plynulý záběr BEZ střihu. Truck zleva doprava podél zdi, který se plynule změní v push-in a dosedne přímo na den novinky (den mírně nad středem, ať je místo na text). Pohyb od prvního snímku (žádný pomalý rozjezd), délka ~2,15 s, pak jen jemný creep. Pak klasický 3D přechod do grafiky (`handoff`).
- **Hláška vypravěče = šťouchnutí do diváka** (pravidlo uživatele, vždycky):
  - divákovi trochu rýpni, ať se probere: zatímco on dělal něco jiného (kalil, spal, scrolloval, byl na víkendu…), v á í se zase všechno změnilo a on se ztrácí / je pozadu;
  - vazba na den novinky: významný den jmenuj („o Halloweenu“, „na Silvestra“, „o Vánocích“), jinak relativně k datu postu („tenhle pátek“, „tuhle středu“, „minulé pondělí“, „včera“);
  - vzor (#4): „Zatímco jsi o helouvínu kalil na párty… v á í se zase všechno změnilo. A ty se ztrácíš… dál a dál.“ Další nápady: „Zatímco sis v pátek dával pivko, v á í ti zase ujel vlak.“ / „Ty jsi v neděli spal do oběda… a á í mezitím zase posunulo hranice.“;
  - hlas **Aura**, eleven_v4, tagy `[teasing, playful, brisk]` (+ `[mock pity]` na pointu), výslovnost podle `docs/vyslovnost.md`;
  - po TTS: Scribe časy slov → vyřízni pauzy delší než ~0,1 s a zrychli `atempo=1.2`, časy slov přepočítej (cíl ≤ 6 s). Soubor `assets/coldopen/voice/hook_q_<id>.mp3` + `.words.json`.
- **Slova na stěně (tracking, ne overlay)** – pokyn uživatele: text je zasazený do prostoru, v rovině zdi jako papíry na ní, „trackovaný“ na stěnu: vůči stěně stojí, vůči kameře se hýbe (jede s ní při najezdu). Každý řádek je pár cm od zdi → jemná paralaxa + vržený stín na zeď, a **depth blur**: řádek naskočí ostrý přesně, když zazní, ~0,3 s po dořečení se rozostří (poslední zůstane ostrý).
  - `ep.hookText = [{ text, w: [od, do], accent }]` (jeden kousek = jeden řádek, indexy slov hlášky), `ep.hookVoice = { file, at: 0.45, dur, gain: -3, words }`.
  - **Layout = těsný typografický lockup** vpravo od kalendáře: malé mezery mezi slovy, řádky natlačené na sebe a do sebe **zacvaknuté** (nožička j/p/g zapadne nad nízká písmena dalšího řádku, d/l se přicvakne vedle; engine měří obrys každého písmene a pro každý řádek najde vodorovný posun s nejmenším řádkováním bez dotyku). Klíčová slova `accent` (barva tématu, větší).
  - **2–3 odstavce** (`p: 0|1|2` u kousků, dělit podle smyslu) rozmístěné cik-cak / na úhlopříčku po stěně (1. vpravo nad dnem, 2. vpravo níž, 3. pod kalendářem). Kamera přistane na den + 1. odstavec a s každým dalším odstavcem plynule přejede fokus na něj (kalendář má pořád kus v záběru). Řádek se rozostří ~1 s po dořečení nebo hned, jak kamera odjede k dalšímu odstavci.
  - **Kamera nikdy nestojí** (pokyn uživatele): jedna spojitá křivka (monotónní kubický spline přes záběry, ease in/out), start na plnou rychlost (strmá tečna) → na 1. text za ~1,3 s, u každého odstavce jen zpomalí a dál jemně driftuje + zoomuje k dalšímu. Zastavení = ztráta pozornosti.
  - **Animace nástupu textu (střídat):** `pop` (původní: písmena z většího měřítka), `up` (zdola), `down` (shora), `left` (zleva). Slide křivka: nejrychlejší na 0. framu, opacita 0 → 100 % do 2. framu, ~90 % dráhy za 4 framy, pak ~15 framů skoro neviditelné dojíždění (exponenciální ease-out, „půl duhy / L“). Cílové pozice = layout, takže se slova na konci nepřekrývají víc než trochu. Typ jde přepsat `anim` u kousku.
  - **Typo:** kombinace SF Pro Display + Helvetica. Kvůli licenci/Linuxu: klíčová a oranžová slova v Inter (display optická velikost, 800, −0,035 em) = náhrada SF Pro Display, ostatní v TeX Gyre Heros Bold (`assets/fonts/`) = náhrada Helveticy. Když uživatel dodá originály, vyměnit v `style.css` + `setFont`.
  - **V každém odstavci jedno klíčové slovo velké** (`key: true`, vlastní kousek, ~175 px na stěně, max šířka odstavce), ostatní menší kolem něj (nad / pod / vedle). Vzor #4: „Halloweenu“, „všechno“, „dál“.
  - **Oranžová slova = glow jako v DaVinci** (Fusion Soft Glow + Reactor XGlow): horké jádro, oranžový halo, široká měkká záře, při dopadu záblesk, který doznívá ~0,2 s.
  - **Zoom puchy:** na každé klíčové slovo krátký zoom in (+7 %, 0,1 s nájezd, ~0,2 s dozvuk), při přeskoku na další odstavec krátký zoom out (−5 %). Kamera přitom pořád jede po spline.
  - **Když se slova nedají zacvaknout** (nahoře hodně nožiček, dole hodně vysokých písmen / háčků / čárek), nenutit je pod sebe: dej kousek **za** předchozí řádek (dál doprava), pokud se vejde.
- **Tematický kalendář:** na významné dny výzdoba kolem data a barva kroužku (`THEMES` v enginu): Halloween = dýně, netopýři, pavučina, oranžová; Vánoce/Silvestr = hvězdy; Valentýn = srdce. Nový svátek přidej do `SPECIAL` + `THEMES`. Nápady do zásoby: pátek 13. černá kočka, Black Friday cenovka „−90 %“, 1. dubna kalendář vzhůru nohama.
- **Zvuk:** room beds od 0 s, camera glide + `whoosh_slow_swell` přes najezd, švih/pop na každý kousek textu, fix na kroužek, popy samolepek, tikání hodin, pak riser + whoosh do grafiky (vše v enginu).
- **Schválení:** `--stills` po ~0,7 s přes celý hook (nic mimo záběr, text čitelný, nekryje datum), pak `--hook-only`.
- Starý maskot/Seedance postup je jen archiv (`docs/tutorial-aktualita-1-postup.md`); nepoužívat, dokud ho uživatel nevrátí.

### 5. Hlas vypravěče
- **Aura** `NKB9YCjftHpPbrUaMPkr` (aktuální účet od 31. 10. 2026, workspace `8cdb7f4a…`; hluboký, zastřený, sebevědomý), eleven_v4, 2 verze. Vyber tu, ve které se nic nepřeřekne a je kratší.
- Scribe přepis → `node scripts/ingest-voice.mjs`. `"tempo": 1.15` v episode.json.

### 6. Motion grafika (laťka = lepší než #1)
- **Scény:**
  - `app` s tlačítkem Získat/Otevřít a „zdarma“;
  - `bigtype` pro hlavní slovo;
  - vysvětlovací scéna k pojmu: `phone` se swipem, nebo NOVÁ šablona, když se téma vysvětlí líp jinak (diagram, před/po, krok 1-2-3);
  - `fan`/`stack`/`iphone`/`words`/`particles`/`cta` podle obsahu;
  - vtip ve `words` s kickerem.
- **Kvalita:**
  - každá scéna má pohyb od začátku do konce;
  - každý text dopadá na slovo hlasu;
  - na šířku (16:9) nic není malé ani nalepené na okraji;
  - zkontroluj `--stills` všech scén a oprav, co vypadá levně, ještě před renderem.
- **Kamera:** `"camera"` v episode.json, klíče navázané na `cue`/`word`, `snap` na změny scén, zoom max 1,11, různé křivky (outExpo na dorazy, inOutSine na drift, outCubic na oddálení). Při vtipu skok blíž a klid.
- **Zvuk:** `"sfxExtra"` navázané na slova:
  - hudební podklad od otočky kostky;
  - **zastavení hudby na vtip** (`dj_brake`, `until`), risery přes vtip, `bass_drop` a hudba zpět na „jedem dál“;
  - Apple vrstva: `ui_swipe` + `ui_tap` na každou scénu, `ui_tick` na klíčová slova, `ui_softpop`, `ui_chime` na výzvu;
  - tematické foley ke slovům (foťák, klávesnice, notifikace…).

### 7. Render a kontrola
- `node scripts/render.mjs episodes/<id>` (na pozadí, ~50 min).
- Pak:
  - délka 38–45 s;
  - hlasitost −14 ±1 LUFS;
  - 12 kontrolních snímků přes celé video;
  - špičky hlasitosti kolem hooku a vtipu.
- Když něco nesedí ve zvuku nebo hlasu, oprav to bez nového renderu (`--mux-only`, `scripts/voice-conform.py`).

### 8. Popisek (hlasem uživatele)
- **První řádek ≤ 45 znaků**, nejúdernější: „AKTUALITA #N 🤖 …“.
- Text zhruba z 80 % bez diakritiky a **přesně 2 překlepy**. Tón kámoše podnikatele.
- **Struktura:** co to je → proč to podnikatele zajímá → „každej druhej den novinky z AI“ → výzva ke sdílení kamošovi.
- **5 hashtagů:** #claudeai #ai #instagramtips #podnikani + 1 tematický.

### 9. Thumbnail (cover)
- **Formát:** 9:16 1080×1920, všechno důležité ve středu 3:4 (y 240–1680). Pozadí `#0C0F14`.
- **Bílá karta** se zaoblenými rohy (874×1049 px, střed v 540×940): tag „AKTUALITA · <datum>“ se značkou gagu na čísle dne, „#N“, nadpis tématu (2 řádky, druhý modře), podtitul (od koho, zdarma), vizuál tématu, CTA.
- **Samolepka maskota** v dnešním gagu (gpt_image, prompt jako v tutoriálu, jen jiná nehoda). Bílý die-cut okraj, přesahuje pravý dolní roh karty do pozadí.
- **Postup:**
  1. HTML karta (`news-reel/assets/thumbnail/card.html` jako vzor);
  2. render Playwrightem;
  3. složit v Pythonu;
  4. nahrát do Canvy jako 3 vrstvy (`create-upload-url` → POST → `create-design` → `read-design open_transaction` → `edit-design`) a **commit**.
- Uživatel tuhle automatiku schválil, takže koncept v Canvě rovnou ulož.

### 10. Doručení (v 8:00)
- **Google Drive (pravidlo uživatele):** každý díl dostane vlastní složku v nadřazené složce **„EFEKTIVE Aktuality“** (id `1mg8yWVGh3Qp2lNcASiqcYfGXuNvrYw7V`).
  - Pojmenuj ji podle aktuality: **„Aktualita #N – <téma> (<D. M. RRRR>)“**. Příklad: „Aktualita #2 – ChatGPT ovládá PC (29. 10. 2026)“, id `15xaVGt9NrvfgaAjNEEcCE4VE9dlGCcmQ`.
  - Do složky VŽDY patří: **video (`reel_web.mp4`), thumbnail (`thumbnail_9x16.png`) a `popisek.txt`**, k tomu `brief.txt`.
  - **Texty** nahraj přes `create_file` (`textContent`, `disableConversionToGoogleType: true`).
  - **Video a thumbnail přes Drive konektor nejdou:** binární obsah by se musel poslat jako base64 přímo v parametru volání, a reel má ~36 MB.
  - **Cesta 1 (plně automatická):** zavolej `list_computer_folders`. Když tam je složka z Google Drive pro desktop (synchronizovaná složka „EFEKTIVE Aktuality“, musí to být kořen git repozitáře), připoj ji přes `request_computer_folder`. Pak tam zkopíruj podsložku dílu s videem, thumbnailem a popiskem; Drive ji sám nasynchronizuje.
  - **Cesta 2 (když cesta 1 není nastavená):** pošli video a thumbnail přes `SendUserFile` a v závěrečné zprávě napiš přesný název složky, kam je uživatel přetáhne.
- Commitni a pushni epizodu (bez `build/`).
- **Závěrečná zpráva** (česky, krátce):
  - téma a proč;
  - odkaz na složku na Drive;
  - odkaz na Canva cover;
  - popisek k vložení;
  - délka, LUFS, kredity.
- Když něco selže (kredity, fronta, render), pošli aspoň to, co je hotové, a napiš přesně, co chybí.

## Zpětná vazba k dílu #2 (platí od #3)
- **Začátek po hooku nesmí mít prodlevu.** V #2 visela intro scéna s ikonou appky přes celou větu „Čet GPT má nový model…“ (~5 s) a skoro nic se nehýbalo. Hned po kostce musí být „úplný mrdy“: každých 0,6–1,2 s nový pohyb nebo nový prvek, žádný prvek nestojí déle než ~1 s bez animace.
  - Intro rozděl na 2–3 beaty, každý na klíčové slovo: logo nebo ikona se postaví, číslo verze se protočí, tlačítko se ťukne, punch-in kamery, flash.
  - Na každý beat dej zvuk.
- **Prstenec částic (`particles`) v #3 NEPOUŽÍVEJ.** Uživatel si ho přál v #2, pro #3 chce místo něj novou motion grafiku. Obecně: co jednou zazářilo, v dalším dílu vyměň.
- **Celkově víc dynamiky:** kratší scény, víc střihů a punch-inů, flash přechody.
- **SFX napasuj přesněji.** Každý zvuk patří na snímek, kde se v obraze opravdu něco děje (dopad prvku, klik, flash), ne jen na slovo v hlase. Ověř to na stills nebo contact sheetu kolem každého zvuku a uprav `at`.

## Motion grafika se musí každým dílem zlepšovat (pravidlo uživatele)
- **Nikdy jen nevyměňuj texty v minulém dílu.** Vezmi předchozí díl jako základ a **změň aspoň 2 grafiky**: úplně nová šablona (3D objekt, scéna na míru tématu), nebo výrazně jiný layout (vějíř → věž nad sebou; telefon vpravo → vlevo / uprostřed). Změny se sčítají, takže #3 má změny z #2 a k tomu další 2 nové.
- **Struktura scénáře zůstává** (je vymazlená), mění se jen to, JAK se věci ukazují.
- **Myšlenkový proces u každého dílu:**
  1. Přečti `news-reel/docs/motion-evolution.md` (co bylo minule).
  2. Přečti si reference v `news-reel/docs/motion-reference.md` + `docs/ref/`.
  3. Vymysli k tématu aspoň 2 nové / přestavěné grafiky.
  4. Postav je jako šablony v `engine/scenes-pro.js` (ověř na stills).
  5. Připiš řádek do `motion-evolution.md`.
- **3D objekty jsou vítané**, např. `globe` (text obíhá kolem tečkové koule, která přiletí z hloubky). Uživateli se líbí prstenec částic (`particles`), takže dělej jeho varianty.
- **Flash přechody:** `transition: "flash"` aspoň 2× za video. Expozice nahoru, 2 snímky bílá, bloom/glow a nová scéna se vynoří ze světla. Zvuk: swell + impact z Drivu.
- **SFX knihovna na Drivu:** složka **„SFX AI final“** (`1_ov-XY7iJkn3LAjMd5ohhzJZuouVsdKn`, ~10 000 zvuků v kategoriích: whoosh, riser, impact, beep, transition, …).
  1. Hledej `search_files` (`title contains 'riser'` apod., `owner = 'me'`, `mimeType contains 'audio'`).
  2. Stáhni `download_file_content`. Výsledek se uloží do souboru v tool-results jako JSON s base64 `content`.
  3. Dekóduj ho Pythonem do `news-reel/assets/sfx/drive/<název>.wav`. Engine ho najde podle jména.
  4. Každý díl přidej aspoň pár nových zvuků z Drivu.

## Co se naučilo (nepřekračovat)
- **Záložní hook bez Higgsfieldu (díl #4).** Když na Seedance nejsou kredity a uživatel je nedobije do ~6:45:
  1. Nakresli značku gagu sám (PIL, průhledné PNG, např. zvýrazňovač nebo fixa).
  2. Do `hook/index.json` dej `frames: 0` a `"drawMark": [start, délka]`. Engine pak udělá rychlý push-in na kalendář a značku dokreslí zleva doprava.
  3. Přidej SFX: whoosh, `marker_scratch`, hit.
  4. Ve zprávě uživateli napiš, že hook je bez maskota kvůli kreditům.
- **ElevenLabs od 31. 10. 2026: nový účet uživatele (workspace `8cdb7f4a…`, placený).**
  - Aura je tu znovu navržená: `NKB9YCjftHpPbrUaMPkr`.
  - **Efík tu zatím NENÍ.** Návrh „young nerdy … boy“ ElevenLabs zablokoval bezpečnostním filtrem (dětský hlas). Při dalším dílu zkus popis dospělého komického hlasu (např. „adult male cartoon sidekick voice, high nasal, squeaky, comedic“). Když to neprojde, použij pro repliku hotové nahrávky nebo hlas Aura s `[confused]`.
  - Na začátku vždy `creative_list_voices` (search „Aktuality“) a podle toho vyber ID.
- **Kredity zkontroluj hned na začátku (pokyn z dílu #3).**
  - ElevenLabs: `creative_generate_speech` s `estimate_only` a chybová hláška ukáže zůstatek.
  - Higgsfield: `balance`.
  - Když něco nestačí, pošli hned `PushNotification`, ať to uživatel stihne dobít do 8:00. Pak připrav všechno ostatní (hook, grafika s dočasným časováním, cover, popisek).
- **ElevenLabs konektor 31. 10. 2026 zase míří na původní workspace** (4d079bb3). Fungují v něm původní hlasy Aura `pq4dsKDG1xJYWPJUNn8d` a Efík `81wovuU8h1mgIHLBNeBy`, ID `vHP4Az3e…`/`LeAUiEe2…` jen ve druhém workspace. Hlas vždycky ověř přes `creative_list_voices` (search „Aktuality“).
- **Levná záloha pro krátké repliky:** `eleven_flash_v2_5` (Efíkova replika stojí 26 kr. místo 56).
- **Dočasné časování bez hlasu:** tichá stopa s tónem + odhad slov (`voice/dev.words.json`), `ingest-voice.mjs` → stills. Po dodání hlasu stačí Scribe → ingest → render.
- **Render pouštěj odpojeně** (`setsid nohup … &`) a průběžně commituj. Restart workeru zabije proces na pozadí a render pak musí začít znovu. Celé video (~1000 snímků) trvá ~40 min.
- **ElevenLabs workspace se 28. 10. 2026 změnil** (konektor teď míří na jiný workspace). Staré ID hlasů nefungují, platné jsou Aura `vHP4Az3ehXL47emKpHTK` a Efík `LeAUiEe2DARUVrjI6jCU` (znovu navržené se stejným popisem).
- **Barva gagu nesmí připomínat krev.** Červená barva s kapkami na kalendáři vypadá jako krev, proto dej barvu v brandu (modrá #2f6bed).
- **Scénu na míru tématu postav jako novou šablonu**, když se hodí lépe než existující. Příklad je `desktop` z dílu #2: computer use, sken obrazovky, kurzor po křivkách, klik, psaní a odeslání.
- Dron nikdy v záběru.
- Postavička nikdy nelevituje s mobilem.
- Žádný papír „novinka ze X“.
- Hook skončí přesně na dni novinky, „Ne! Na …ku ne!“ se nedává, jen otázka s datem.
- Šepot/ASMR vypravěč ne. Provokativní pištivý vypravěč (Efík) ne. Efík je jen hlas postavičky.
- Cover nikdy nahrávat jako 3:4. Vždy 9:16 s obsahem ve středu 3:4.
- Uživatelovu složku se zvuky v počítači cloud nevidí. Zvuky ber z `assets/sfx/` nebo je vygeneruj v ElevenLabs.
