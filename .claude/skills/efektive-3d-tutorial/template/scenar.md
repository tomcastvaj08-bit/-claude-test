# Scénář: Ukázka šablony (smaž a napiš vlastní)

- **Cílová délka:** podle zadání (orientačně 14–15 znaků scénáře = 1 s hlasu po zrychlení 1,1×)
- **Hlas:** klon autora z ElevenLabs, 1. osoba (mluví autor, Claude je „on“)
- **Obraz:** 1920×1080, 30 fps

**Legenda (build.py to tak čte):**
- Kapitola = nadpis `## K03 · Krok 2: Název (~2:00)`. Id je `k03`, název je za `·`, `(~čas)` se ignoruje. „Krok N:“ v názvu = číslo kroku v HUD.
- Každý řádek textu = jeden odstavec hlasu. Prázdné řádky odstavce oddělují.
- `{#cue}` = bod, na který se váže animace (`T('k03.cue')`). Konkrétní slovo po cue: `AT('k03.cue', 'slovo')`.
- Řádky `> VIZ:` popisují obraz a nečtou se. Stejně tak `---` a `#`.
- Anglické termíny se pro hlas přepíšou foneticky (tools/pron.py). Prompty se na plátně ukazují v angličtině, hlas je vysvětluje česky.

---

## K00 · Úvod (~0:30)

> VIZ: Výsledek hraje uprostřed BEZ ZVUKU (project.json "intro"), hlas přes něj představuje téma. Pak hub, štítky na slova, velký odjezd na celou mapu kapitol.

{#hook} Tohle je ukázka šablony. Jedno obří plátno, kamera, která mezi věcma létá, a grafika, která naskakuje přesně na slova.

{#map} Celý video je myšlenková mapa. Každá kapitola má svoje místo na spirále a na konci uvidíš celou mapu najednou.

{#go} Jdeme na to.

---

## K01 · Krok 1: Scénář s cue značkami (~0:40)

> VIZ: Karta kroku, pod ní tři callouty na slova, vpravo prompt v angličtině s postupným zvýrazněním řádků.

{#what} Všechno začíná scénářem. Každej odstavec je jeden kus hlasu a značky v textu říkají, kde má co naskočit.

{#prompt} Prompty ukazuju v originále anglicky. Zvýrazní se vždycky ten řádek, o kterým zrovna mluvím: nejdřív styl, pak kamera, nakonec zvuk.

{#rule} A pravidlo číslo jedna: žádná statická scéna. Kamera se pořád hýbe.

---

## K02 · Shrnutí (~0:30)

> VIZ: Tři callouty shrnutí, pak odjezd na celou mapu a závěrečná karta.

{#recap} Takže: scénář, hlas, timeline, render. Pořád stejná kostra, jen jiný téma.

{#zoomout} A tohle je celá mapa. {#end} Díky, že jsi tady.
