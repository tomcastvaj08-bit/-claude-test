# Cold opens – postavička před hookem (v2)

Krátké scénky (7–9 s) před hookem „tabule“. Plochá 2D kresba ze `character_sheet.png` (tenká jako papír) žije ve skutečných fotkách místností od uživatele (`env/*.jpg`). Z prostředí není nakreslené nic: sedí na skutečné židli, leží na skutečné posteli, opírá se o skutečné cihly.

Každá scénka:
- ≥ 5 střihů: celek → polocelek / insert (co dělá) → „Počkej…“ (freeze, record scratch, crash zoom) → detail obličeje s lip-syncem („co je dneska za datum?!“) → celek s výskokem → whip pan do hooku;
- 30 fps se závěrkou 1/40 s (`renderFps`/`shutter` v meta, render.mjs je převezme);
- foley ke každé akci + room tone místnosti.

| id | prostředí | děj | insert |
|---|---|---|---|
| `newspaper` | dřevěná židle u cihlové zdi | čte noviny → listuje („hmm“) → „Počkej… tyhle noviny jsou starý!“ | rychlý zoom na datum v novinách (dnes − 8 dní), vše ostatní rozmazané |
| `nap` | postel | spí a chrápe, mobil vedle něj zabzučí → „Hm?! Co?!“ | zamčená obrazovka s dnešním datem a notifikací |
| `laptop` | stůl s MacBookem + kožená židle | píše, nudí se, kliká („tohle znám… nuda…“) | obrazovka se starými články |
| `phone` | prázdný roh u cihel | opřený o zeď scrolluje, zívá → „Moment!“ → sprint pryč | feed samých starých postů |
| `notebook` | stůl u okna s lampou | čmárá „AI“ do notýsku, přemýšlí („hmm“) | notýsek, „AI“ se podtrhává pořád dokola |

## Jak vznikají kresby (Higgsfield `gpt_image_2_5`, 2k high)

1. **Kompozit**: fotka místnosti + character sheet → postavička nakreslená přímo do fotky (správné měřítko, perspektiva, dotyk se židlí; skutečný nábytek před ním ho zakrývá).
2. **Výřez**: ten kompozit s `background: transparent` → jen postavička na průhledném pozadí.
3. **Registrace**: `scripts/coldopen-register.py PLATE COMP CUT OUT` (SIFT + RANSAC). Spáruje místnost v kompozitu s čistou fotkou a výřez se kresbou v kompozitu, takže každá póza sedí na stejný nábytek. Model při editaci často posune nebo zvětší záběr, proto je to nutné.
4. **Překreslení (line boil)**: každá držená póza (k1–k3) má 2 ručně překreslené varianty (edit výřezu: „redraw this exact drawing again by hand…“). `scripts/coldopen-redraw-reg.py MASTER REDRAW OUT` je přilícuje na master. Engine je cykluje 8×/s a nikdy neukáže stejnou kresbu dvakrát po sobě.
5. **Balení**: `scripts/coldopen-pack.py` → `v2/<scene>/`
   - `plate.jpg` (z 4K upscale, 3200 px) a `plate_blur.jpg`;
   - `k1…k4[_r1|_r2].webp` s vyčištěnou alfou (pryč šedé „glow“ mraky, papírový okraj zůstává);
   - `v2/face/` (open/half/closed × 3 kresby pro lip-sync);
   - `v2/manifest.json` (bbox a hlava každé pózy, souřadnice 0..1 fotky).

Póza `k1`/`k2` = činnost, `k3` = zamrznutí, `k4` = výskok / sprint / skok z postele. Všechna ID jobů jsou v `v2/higgsfield-jobs.json`. Zdrojové PNG (kompozity, výřezy, 4K fotky) leží v `src/` a jsou v `.gitignore`.

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

Render jen scénky (+1 s hooku), 30 fps / 1/40 s:

    node scripts/render.mjs episodes/<id> --cold newspaper --cold-only

Celé video se scénkou: `"coldOpen": "newspaper"` v episode.json (nebo `--cold newspaper`). Celé video běží ve fps epizody (24p); 30 fps se vynutí přes `--fps 30 --shutter 0.75`.
