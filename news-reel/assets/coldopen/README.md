# Cold opens – postavička před hookem

Krátké scénky (8–12 s) před hookem „tabule“. Ručně kreslená 2D postavička ze `character_sheet.png` žije ve skutečné fotografované místnosti se stejným sluncem, haze a barvami jako hook. Nakreslené je i všechno, na co sáhne: stůl, židle, MacBook, notýsek, noviny a telefon. Každá scénka končí pointou „Počkej… co je dneska za datum?!“, výskokem ze židle a whip panem do hooku.

| id | děj | kresby |
|---|---|---|
| `notebook` | čmárá do notýsku a pořád podtrhává „AI“, mumlá si; insert notýsku s přibývajícími čarami | notebook_k1/k2 (pero vlevo/vpravo), k3 zamrznutí, k4 výskok |
| `laptop` | surfuje na MacBooku, stránky ubíhají („tohle znám… nuda…“); insert obrazovky | laptop_k1/k2, k3, k4 |
| `nap` | spí na stole (bublina, chrápání), zabzučí telefon → „Hm?! Co?! Jakej je dneska den?!“ | nap_k1/k2, k3 probuzení, k4 |
| `phone` | opřený u zdi doomscrolluje („nuda… starý…“); insert telefonu se samými starými posty → „Moment!“ a sprint pryč | phone_k1/k2, k3, k4 sprint |
| `newspaper` | čte noviny „AI MĚNÍ SVĚT“ → „Počkej… tyhle noviny jsou z minulýho týdne!“; insert: datum v novinách (dnes − 8 dní) se zakroužkuje | newspaper_k1/k2, k3, k4 |

Společné: `face_open/half/closed` = detail obličeje pro lip-sync pointy, `room.jpg` = prázdná místnost (Higgsfield 1f968601…), `insert_notebook`.

Generováno přes Higgsfield `gpt_image_2_5` (2k, medium, `background: transparent`, 16:9). Reference:
- první kresba scény = místnost + character sheet;
- varianty = editace té první, takže nábytek drží na místě.

Zdrojová PNG jsou v `.gitignore`. Engine používá WebP.

Hlas postavy: ElevenLabs eleven_v4, „Pavel“ (`2im21EYjqLQN0QCvr398`), flow `Az4yGJDxLsr4625FyJFB`. Časy slov ze Scribe jsou ve `voice/timing.json`:
- `wait` = „Počkej/Moment“;
- `date` = začátek „co je dneska za datum“;
- `talk` = úseky řeči pro lip-sync.

Render jen scénky (+1 s hooku):

    node scripts/render.mjs episodes/<id> --cold notebook --cold-only

Celé video se scénkou: `"coldOpen": "notebook"` v episode.json (nebo `--cold notebook`).
