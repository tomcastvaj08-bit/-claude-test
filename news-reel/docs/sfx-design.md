# Zvukový design hooku (film mix)

Hook nesmí znít jako „whoosh + ding“. Skládá se ze čtyř vrstev jako filmový mix. Každá vrstva má svou roli, délku, fade, EQ a pozici v panoramě. Mixer v `scripts/render.mjs` bere u každé události `{ name, at, gain, dur, fi, fo, hp, lp, pan }`.

| vrstva | co | proč | zpracování |
|---|---|---|---|
| **BED – prostor** | `amb_city` (vzdálené město za oknem), `wind_bed` (vítr oknem), `cine_drone` (hluboký podklad) | Místnost musí „dýchat“, i když se nic neděje. Divák pak ví, kde je, ještě než to přečte. Drone dává filmovou váhu a sjednocuje střihy. | Město: hp 160 / lp 5,2 k (daleko = bez basů i výšek), pan doleva (okno je vlevo). Drone: lp 1,8 k, −19 dB (spíš cítit než slyšet). Všechny bedy začínají fade-inem a končí s ponořením do papíru. |
| **SPOTY – co vidíme** | `blinds_rattle`, `leaves_rustle`, `leaf_passby`, `paper_breeze`, `wind_gust`, `marker_scratch`, `camera_glide`, `camera_whip` | Každý pohyb v obraze má zvuk („see a dog, hear a dog“). | Žaluzie: na začátku blízko vlevo, po střihu tišší a vzdálenější (hp 600 / lp 4 k). Průlety listů jsou časované na rozostřené listy (`LEAVES[k].tc` − 0,4 s, tam má vzorek vrchol) a mají pan podle strany obrazu. |
| **MOTIV** | `clock_tick` | V detailu kalendáře tikají hodiny, tedy čas a datum. Je to tichý, intimní kontrast k větru. | hp 500, −21 dB, pan mírně doprava, od střihu do ponoření. |
| **PŘEDÁVKA** | `dive_swell` → `hook_dive` → `hook_impact` (lp 180 = jen sub) + `reveal_shimmer` | Reverzní nádech „vtáhne“ diváka do papíru. Sub úder a třpyt označí začátek grafiky a nástup hlasu. | Swell má vrchol v 1,7 s, takže `at = konec − 1,72`. Bedy do té doby vyfadují: zvuk místnosti zmizí spolu s obrazem. |

Pravidla:
- Vzdálenost = EQ, ne jen hlasitost (daleko: ořezat basy i výšky).
- Pan podle obrazu (okno vlevo, list letí zprava).
- Bedy nikdy natvrdo: fade-in 0,25–0,8 s a fade-out s přechodem.
- Pod hlasem žádné bedy (hook končí přesně tam, kde začíná voiceover).
- Nové atmosféry generuj s `duration_seconds` (jinak vyjdou ~1 s), normalizuj na špičku −1 dBFS a zapiš do `assets/sfx/el/library.json`.

# Zvukový design cold openů (v2)

Pravidlo: **každá akce postavičky má svůj reálný zvuk** a každá místnost svůj room tone. Hlas vždy navrchu, foley o 5–15 dB níž. Master pak srovná ebur128 na −14 LUFS.

| vrstva | zvuk | úroveň | poznámka |
|---|---|---|---|
| room tone | `room_bedroom` (noviny, postel) / `room_office` (notebook, mobil, notýsek) | −14 dB, hp 90 | celá scéna, fade 0,25 / 0,35 s |
| dálka | `amb_city` | −27 dB, hp 160 / lp 4,2 k | pan na stranu okna |
| okno | `wind_bed` | −22 dB | jen místnosti s otevřeným oknem (noviny, notýsek) |
| přemýšlení | `villager_hmm` | −12 až −16 dB | krátké „hmm“ ve stylu vesničanů z Minecraftu, střižené na 0,5–1,4 s |
| noviny | `newspaper_rustle`, `page_turn` (na střih do polocelku) | −5 až −16 dB | |
| notebook | `laptop_fan` (celá scéna −24 dB), `keyboard_typing`, `trackpad_click` | | větrák zní pod celou scénou |
| mobil | `phone_scroll` (celý scroll), `yawn` | | |
| postel | `snore` (do probuzení), `phone_buzz` ×2, `sheet_rustle` (probuzení) | | |
| notýsek | `pencil_write`, `pen_drop` na „Počkej“ | | |
| pointa | `record_scratch` (freeze), `gulp`, `hook_impact` lp 220 (střih na detail), `camera_glide` (pan z detailu doprava; od v4 bez výskoku a útěku) | | |
