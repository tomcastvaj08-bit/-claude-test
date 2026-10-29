# Engine API (timeline/kNN.js)

Obsah: 1) souřadnice · 2) kapitola – kostra · 3) node · 4) widgety W · 5) helpery L · 6) čas T/AT · 7) kamera · 8) dynamika (update, fx) · 9) recepty

## 1) Souřadnice a měřítko

- Svět: jednotky ≈ px při kameře `d = 1600` (PERSP). `d` = vzdálenost kamery; větší = dál. Čitelná karta w 1500–2000 při `d` 2000–2600. Přehled kapitoly ~ `d` 4000–6000, celá mapa `L.OV.d`.
- **`x, y` uzlu = jeho STŘED** (transform `translate(-50%,-50%)`). Kamera `x, y` = střed záběru. Chceš-li kartu ve středu obrazu, dej kameře stejné x, y jako kartě (u `autoH` karet posuň y o ~+100 k středu výšky).
- `z` = výška nad plátnem (kladné = blíž ke kameře). Obsah 0–300, galerie −1600 a hlouběji, závěrečná karta 9000.
- Kotva kapitoly `L.A.kNN` = {x, y}; v kapitole piš `const o = A.k05, X = v => o.x + v, Y = v => o.y + v;` a pozice relativně (`X(-1500)`). Rozumný obsah kapitoly se vejde do ±3500 × ±3000 kolem kotvy.

## 2) Kostra kapitoly

```js
// K05 · Krok 3: Název – co se tu děje (1 řádek)
(() => {
  const { T, AT, cam, link, node, clamp, ease, lerp } = ENGINE;
  const { A, CH, CHEND, flyTo, player, frame, logo } = L;
  const o = A.k05, X = v => o.x + v, Y = v => o.y + v;

  W.card({ x: X(0), y: Y(-1300), w: 1900, in: CH('k05') + 1.2, kicker: 'Krok 03', kc: 'b', title: 'Název <span class="gr">kroku</span>', lead: '...' });
  // ... obsah, vše s in: T('k05.cue') nebo AT('k05.cue', 'slovo')

  // kamera až na konci, chronologicky
  flyTo('k05', { x: X(0), y: Y(-1250), d: 2300 });
  cam({ t: T('k05.prompt') - .3, dur: 1.2, x: X(0), y: Y(1100), d: 2700, ease: 'whip', rx: 3, ry: -6, push: .05 });
})();
```

Soubory se načítají abecedně (`k-layout.js` první). Kapitola `kNN` musí mít nadpis `## KNN · …` ve scénáři.

## 3) node(o) – základní uzel

| klíč | default | význam |
|---|---|---|
| x, y, z | 0 | střed uzlu ve světě |
| w, h | 400, 300 | rozměr v jednotkách světa; `autoH: true` = výška podle obsahu |
| rx, ry, rz | 0 | natočení (stupně) |
| s | 1 | měřítko |
| in | 0 | čas příchodu (s) |
| dur | .9 | délka animace příchodu |
| anim | 'pop' | `pop` (zvětšení s přestřelem), `rise` (zespodu), `fly` (z kamery s blurem), `deep` (z hloubky), `flip` (otočka Y), `tilt` (sklopení X), `fade`, `none` |
| out, outDur | null, .6 | čas odchodu (zmizí dozadu) |
| float | 0 | jemné vznášení (amplituda) |
| dof | true | hloubka ostrosti (blur podle vzdálenosti od roviny ostrosti). **UI karty `dof: false`** |
| html | '' | obsah (HTML string, styly z style.css) |
| type | – | `'img'` (+`src`, `cap`) nebo `'seq'` (sekvence snímků) |
| alpha | 1 | průhlednost |
| update(n, t, a, cam) | – | volá se každý snímek, `n.el` = DOM. Musí být čistá funkce času (viz 8) |
| fx | [] | zvýraznění: `[{t, until?, dur?, sel: '.l3', var?: '--hl'}]` nastaví CSS proměnnou 0→1 |
| lodBoost | 1 | vyšší = ostřejší rasterizace (velké nadpisy zblízka) |
| id | – | volitelné pojmenování |

`link({a: {x,y}, b: {x,y}, in, dur: 1.2, soft: false, bend: .25, dot: true, ease: 'smooth', w: 6, z: -2, minPx})` – zakřivená čára (kreslí se postupně, tečka jede po ní). `soft` = tečkovaná šedá.

## 4) Widgety W (engine/widgets.js) – všechny vrací uzel, berou i všechny klíče node

- `W.card({kicker, kc: ''|'b'|'g'|'o'|'r', title, lead, size, extra})` – hlavní karta kroku (`<span class="gr">` = gradient v nadpisu). w 1500.
- `W.callout({lab, txt, c: ''|'g'|'o'|'r'})` – štítek + text s barevnou linkou vlevo. w 820.
- `W.quote({who, q})` – tmavá karta citace zadání (`who` default `CFG.who`).
- `W.chip({text, icon?, dot?})` – pilulka s ikonou/tečkou.
- `W.html({...})` – libovolný HTML uzel (pop, dof false).
- `W.img({src, cap})` – obrázek (default anim deep, float).
- `W.seq({pattern: '.../f_%04d.jpg', first, frames, fps, loop, seqStart})` – video ze snímků. Používej přes `L.player`.
- `W.prompt({text, head, meta, fs, fx})` – mono prompt, řádky mají třídy `.l0, .l1…`; zvýraznění `fx: [{t: AT(...), until: AT(...), sel: '.l2'}]`.
- `W.sphere({color: 'blue'|'green'})` – lesklá koule (dekor).
- `W.layers({x, y, layers: [{html, cls, style}], gap, stagger, rx: 52, rz: -32})` – izometrický stoh vrstev.
- `W.kick(text, c)` – mono pilulka se zelenou tečkou jako HTML string. `W.esc()`, `W.rng(seed)` (deterministický random).

## 5) Helpery L (timeline/k-layout.js)

`A` kotvy, `CH(id)` začátek kapitoly, `CHEND(id)` konec, `INS(cue)` vložka z plánu, `has(cue)`, `flyTo(id, {x, y, d, ...})` přelet na začátku kapitoly, `OV` přehled celé mapy `{x, y, d}`, `player(name, {a, b, speed, loop, seqStart, w, ...})` (výška se dopočítá z **předané** šířky a poměru videa; video na výšku `w: 900` → `h: 1600`), `frame(name, t)` URL snímku, `thumb(name, t)`, `thumbs` všechny náhledy, `logo(key, px)` HTML loga (claude, openai, github, canva, instagram, ffmpeg, elevenlabs, apple, appstore, android; jinak monogram, rozšíříš `CFG.mono`), `short(title)` název bez „Krok N:“, `ids` kapitoly kromě k00.

## 6) Čas: T a AT

- `T('k05.prompt')` = čas prvního slova po značce `{#prompt}` v kapitole K05. `T('k05')` = začátek kapitoly (2 s před hlasem – přelet).
- `AT('k05.prompt', 'kamera', nth = 1)` = čas n-tého slova začínajícího na „kamera“ po té značce (bez diakritiky, prefix). Hledá se v **zobrazovaném textu scénáře**, ne ve fonetice – piš slovo tak, jak je ve scénáři („130“ ve scénáři jako „sto třicet“ → `AT(..., 'sto')`).
- `T('k08.watch6.ins')` = začátek vložky `after`.
- Všechny časy se po namluvení přepočítají samy (build.py). Nic nepiš v absolutních sekundách.

## 7) Kamera

`cam({t, dur, x, y, d, rx, ry, rz, ease, push})` – v čase `t` se kamera za `dur` přesune na cíl; po dosednutí pomalý push (zmenší d o `push`, náběh 8 s). Klíče, které vynecháš, zůstanou z minula. `d` se interpoluje logaritmicky (rovnoměrný dolly).

Gramatika (drž, dělá to „AE look“):
- **Přelet kapitoly:** `flyTo` (whip 2,3 s, rx 4, ry −6).
- **Na nový prvek:** `ease: 'whip'`, dur 0,9–1,4, start 0,3 s před slovem (`T(...) - .3`), `push .05`.
- **Klidný přechod/oddálení:** `ease: 'smooth'`, dur 1,2–1,6.
- **Velký odjezd na mapu:** smooth 4,5–5,5 s na `OV`, rx 12–14.
- Lehké náklony rx ±2–16, ry ±3–12 střídej stranu, ať to dýchá. rz jen výjimečně.
- Vyhni se záběrům, kde se 2+ s nic neděje a nic nepřibývá: přidej prvek na slovo nebo posun.
- Easingy: linear, ease, smooth, whip, out, in, sine, quad, cubic, quart, expo, backOut, elastic (`ENGINE.ease(name, p)`).

## 8) Dynamika: update a fx

- `update: (n, t) => {...}` – ručička, počítadlo, playhead, vyplňování. **Musí záviset jen na `t`** (render jde po snímcích paralelně a skáče v čase): žádné `n.x += ...`, žádný stav mezi snímky kromě cache (`if (n._st !== st)`). Interpolace přes klíčové body: `lerp(a, b, ease('smooth', (t - t0) / dur))`.
- `fx` na uzlu nastaví CSS proměnnou `--hl` 0→1 na prvcích `sel` (prompt řádky: `.prompt .l` mají zvýraznění přes `--hl`).
- Vlastní CSS proměnné: `fx: [{t, sel, var: '--p'}]` a v HTML `style="opacity:var(--p)"`.

## 9) Recepty (viz references/examples/)

- **Čísla/ceny:** velké číslo `font: 800 220px var(--sans)` + mono popisek, naskočí na slovo čísla (`aktualita1_k08.js` „110 %“, „42 kreditů“).
- **Prompt vysvětlený po částech:** `W.prompt` + `fx` po blocích, kamera whip na každý blok (`aktualita1_k08.js`).
- **Přehrávač s monitorem záběrů:** `player()` + callout s časem úseku, smyčka `a..b` (`aktualita1_k01.js`).
- **Schéma/diagram:** uzly `W.html` + `link` mezi nimi, naskakují postupně (`aktualita1_k02.js` pipeline enginu).
- **Zvuková stopa/waveform:** obrázek waveformu + vrstvy jako `W.html` s barevnými pruhy (`aktualita1_k09.js`).
- **Easing křivky:** SVG křivka v `W.html`, tečka jede přes `update` (`aktualita1_k13.js`).
- **Shrnutí + konec:** `aktualita1_k18.js` / šablona `k02.js`.

## 10) Úvod s němým výsledkem (šablona k00.js)

`project.json` → `"intro": {"src": "final", "a": 0, "b": 10}`. Přehrávač hraje ve smyčce od 0,2 s, kamera na něm drží celý první odstavec (`{#hook}`) se slow pushem a sama spočítá vzdálenost tak, aby bylo vidět celé video (i 9:16). Na `{#map}` přelet na hub a odjezd na mapu. Zvuk videa se nepouští – mluví hlas.

## 11) Videa na výšku (9:16)

Přehrávač `w: 760–900` (h 1350–1600), kamera na něj `d ≈ 3000–3700`, dva vedle sebe s rozestupem `w + 100`, popisky pod ně (`y + h/2 + 100`). Náhledy v galerii 270×480. Obrázky se snímky po sekundách (široké) dávej pod porovnání aspoň o `h/2 + 800` níž.
