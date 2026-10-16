# Cold opens – postavička před hookem (v5)

Krátké scénky (4,5–6,5 s) před hookem „tabule“. Plochá 2D kresba ze `character_sheet.png` (tenká jako papír) žije ve skutečných fotkách místností od uživatele (`env/*.jpg`). Z prostředí není nakreslené nic: sedí na skutečné židli, leží na skutečné posteli, opírá se o skutečné cihly.

Postavička je plochý papír ve 3D: natočená od kamery a lehce přehnutá. Skutečné předměty před ní ji zakrývají (occludery: víko MacBooku, hrana a nohy stolu).

Každá scénka:
- tempo sociálních sítí (jsme v hooku): záběry 0,5–1,4 s, střih jen při změně velikosti/úhlu. Celek → insert (co dělá) → polocelek → „Počkej…“ jako samostatný ostrý střih s crash zoomem (pár snímků) → detail obličeje s lip-syncem („co je dneska za datum?!“) → rychlý švih kamery doprava do hooku. Žádné leknutí, výskok ani útěk;
- pauzy v replikách jsou vystřižené (`scripts/coldopen-tighten.py` → `voice/<id>_t.wav`, v `timing.json` je `map` z původních časů na nové; v enginu `T.v(x)` = čas v PŮVODNÍ replice);
- nikdy nestojí: dýchá, přenáší váhu, drbe se. Mezifáze pózy se střídají po dvou snímcích (12 kreseb/s);
- lip-sync jen když mluví: z obálky hlasitosti hlasu (`env` v `timing.json`) podle slabik (poměr k lokálnímu maximu), mezi slovy je pusa zavřená;
- 24 fps se závěrkou 1/24 s (`renderFps`/`shutter` v meta, render.mjs je převezme);
- foley ke každé akci + room tone místnosti. Hlas je masterovaný na úroveň vypravěče (−16,3 LUFS).

| id | prostředí | děj | insert |
|---|---|---|---|
| `newspaper` | dřevěná židle u cihlové zdi | čte noviny, drbe se → listuje („hmm“) → „Počkej… tyhle noviny jsou starý!“ | rychlý zoom na datum v novinách (dnes − 8 dní), vše ostatní rozmazané |
| `nap` | postel | spí a chrápe, mobil vedle něj zabzučí → „Hm?! Co?!“ | z jeho pohledu: vlastní ruka na peřině, vedle leží mobil (dnešní datum + notifikace), po zabzučení se po něm ruka natáhne |
| `laptop` | stůl s MacBookem (sedí ZA ním, víko a stůl ho zakrývají) | píše, nudí se, kliká („tohle znám… nuda…“), „Počkej“ = drží se za víko | obrazovka se starými články |
| `phone` | prázdný roh u cihel | opřený o zeď scrolluje, drbe se na krku, zívá → „Moment!“ | z jeho pohledu: mobil drží jeho kreslená ruka, palec scrolluje (feed sedí do vyklíčovaného displeje, `scripts/coldopen-povphone.py`) | feed samých starých postů |
| `notebook` | stůl u okna s lampou | čmárá „AI“ do notýsku, přemýšlí („hmm“) | notýsek: stránka + ruka zvlášť, hrot tužky jede po tazích podtržení |

## Jak vznikají kresby (Higgsfield `gpt_image_2_5`, 2k high)

1. **Kompozit**: fotka místnosti + character sheet → postavička nakreslená přímo do fotky (správné měřítko, perspektiva, dotyk se židlí; skutečný nábytek před ním ho zakrývá).
2. **Výřez**: ten kompozit s `background: transparent` → jen postavička na průhledném pozadí.
3. **Registrace**: `scripts/coldopen-register.py PLATE COMP CUT OUT` (SIFT + RANSAC). Spáruje místnost v kompozitu s čistou fotkou a výřez se kresbou v kompozitu, takže každá póza sedí na stejný nábytek. Model při editaci často posune nebo zvětší záběr, proto je to nutné.
4. **Žádné střídání celých překreseb** (v2 je měla, blikalo to). Silueta je pevná. Mezifáze (`k1a`, `k1b`, `k2a`) vznikají přes `scripts/coldopen-inbetween.py MASTER EDIT OUT`: z editace pózy („stejná kresba, jen ruka jinde“) se vezme jen oblast, která se opravdu změnila, a zbytek zůstane pixel po pixelu z mastera. Engine „překresluje“ jen čáry propisky: `kN_ink.webp` (nejtmavší tahy) se každý 3. snímek jinak posune a barvy se nepatrně chvějí, obojí oříznuté do siluety. Ručně překreslené varianty z Higgsfieldu zůstávají jen v `src/` a v `higgsfield-jobs.json`.
5. **Balení**: `scripts/coldopen-pack.py` → `v2/<scene>/`
   - `plate.jpg` (3200 px) a `plate4k.jpg` (inserty a detaily ořezávají přímo 4K fotku, takže je pod nimi vidět skutečná textura);
   - `k1…k4.webp` a `k1…k4_ink.webp`. Alfa je vyčištěná: pryč bílý papírový okraj (i tečkovaný) a šedé „glow“ mraky;
   - `v2/face/` (open/half/closed + ink pro lip-sync);
   - `v2/manifest.json` (bbox a hlava každé pózy, souřadnice 0..1 fotky).

Póza `k1`/`k2` = činnost (+ mezifáze `k1a`/`k1b`/`k2a`), `k3` = zamrznutí. `k4` (výskok) se od v4 nepoužívá. Všechna ID jobů jsou v `v2/higgsfield-jobs.json`. Zdrojové PNG (kompozity, výřezy, 4K fotky) leží v `src/` a jsou v `.gitignore`.

## Zvuk (v5): tři vrstvy jako ve filmu

1. **Dialog**: zkrácená replika, masterovaná na úroveň vypravěče (−16,3 LUFS), high-pass 75 Hz.
2. **Atmosféra stříhaná s obrazem**: každý záběr má vlastní perspektivu (celek plný pokoj, insert blíž a tmavší, detail subjektivní a tlumený). Atmosféra dalšího záběru začíná 3 snímky před střihem (J-cut, ucho vede oko). Záběr před „Počkej“ ztichne 0,1 s předem: krátké vakuum, aby úder dopadl.
3. **Designovaná vrstva** (`scripts/sfx-design.py` → `assets/sfx/designed/`, syntéza, žádná AI):
   - švihy ze tří vrstev (sub + střed + vzduch), filtr jede s pohybem, vrchol přesně na střihu;
   - „Počkej“ = švih + klik + tělo + sub drop (s harmonickými, aby váha byla slyšet i z mobilu);
   - nízký tension drone pod uvědoměním;
   - reverse swell do detailu a do hooku, putující švih L→P na závěrečném panu;
   - vibrace mobilu v matraci.

## Hlas a zvuk

Hlas postavy: ElevenLabs eleven_v4, „Pavel“ (`2im21EYjqLQN0QCvr398`), flow `Az4yGJDxLsr4625FyJFB`. Repliky jsou v2, tedy o 2–4 s kratší. Časy slov ze Scribe jsou ve `voice/timing.json` (`wait` = „Počkej/Moment“, `date` = „co je dneska…“, `talk` = úseky řeči pro lip-sync).

Foley (ElevenLabs SFX, flow `PLDyeTpdQaz9fhURQ66G`, `assets/sfx/el/`):
- `villager_hmm` (přemýšlivé „hmm“ jako vesničan z Minecraftu)
- `page_turn`, `newspaper_rustle`, `paper_flurry`
- `pencil_write`, `pen_drop`
- `keyboard_typing`, `trackpad_click`, `laptop_fan`
- `phone_scroll`, `phone_buzz`
- `snore`, `sheet_rustle`, `yawn`, `gulp`
- `chair_creak`, `chair_clatter`, `run_away`
- room tone `room_bedroom` / `room_office` (+ `amb_city`, `wind_bed` u oken)

## Render

Render jen scénky (končí panem z detailu doprava, hook se nerenderuje), 24 fps / 1/24 s:

    node scripts/render.mjs episodes/<id> --cold newspaper --cold-only

Celé video se scénkou: `"coldOpen": "newspaper"` v episode.json (nebo `--cold newspaper`). Rychlé ukázkové framy bez renderu videa: `--stills t1,t2,…`.
