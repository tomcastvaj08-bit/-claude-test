# EFEKTIVE – předávací dokument k aplikaci

Stav k 23. 11. 2026. EFEKTIVE je aplikace na automatické titulky do videí (reels) a na realitní fotky. Běží jako webová appka a připravuje se jako mobilní appka pro Android a iOS.

- **Kód:** složka `efektive-captions/` v tomto repu. **Pracovní větev od 23. 11. večer: `claude/efektive-app`** (vychází z `claude/lucid-maxwell-4k9eaj`, commit 56e796e; ta stará větev se už nemění). Větev `main` se zatím nepoužívá ani nemění.
- **Další dokumenty v repu:**
  - `efektive-captions/JAK_FUNGUJE_PREPIS.md` – přepis řeči, ceny, denní limit
  - `efektive-captions/NAVOD_BASE.md`, `NAVOD_TITULKY.md` – styl Base a titulky
  - `efektive-captions/MASKA.md`, `PRECHODY.md`, `JAZYKY.md` – maska objektu, schválené přechody, jazyky
  - `efektive-captions/app/README.md` – starší technický popis

---

> **Pravidla spolupráce s majitelem** (screenshoty předem, krátce v bodech, vše jde vrátit zpět) jsou v `CLAUDE.md` v kořeni repa.

## 1. Kde aplikace běží

| Co | Kde | Stav |
|---|---|---|
| Webová appka (produkce) | https://captions.efektive.cz | ✅ běží |
| Záložní adresa | https://efektive-titulky.vercel.app | ✅ běží |
| Hosting a serverové funkce | Vercel, tým `efektive`, projekt `efektive-titulky` | ✅ |
| Doména efektive.cz, DNS | Webnode (CNAME `captions` → Vercel + TXT ověření) | ✅ |
| E-mail na doméně | přeposílání přes ImprovMX do Gmailu, odesílání přes Gmail „poslat jako“ | ✅ |
| Podmínky / soukromí | https://captions.efektive.cz/podminky.html, https://captions.efektive.cz/soukromi.html | ✅ |
| Google Play Console | účet organizace ověřený (D-U-N-S 984009521) | ⏳ aplikace ještě není založená ani nahraná |
| Apple App Store | — | ❌ účet Apple Developer zatím není |
| Android build | GitHub Actions `efektive-android.yml` | ✅ APK; AAB čeká na podpisový klíč |
| iOS build | GitHub Actions `efektive-ios.yml` | ⏳ čeká na klíče Apple (bez nich se nespouští) |

ID mobilní aplikace (Android i iOS): `cz.efektive.captions`.

## 2. Historie projektu

**13.–14. 11. – základ**
- Webová appka na titulky převzatá z verze v9, výchozí šablona Base podle vzorového videa.
- Šablony Styl 1–10 a vzhled EFEKTIVE (logo, maskot, ikony).
- AI přepis (ElevenLabs, záložně Groq), zvuk z videí z iPhonu (.mov), export na 1 klik se zvukem i na iPhonu.
- Předplatné PRO (Stripe, 300 Kč/měsíc) a vodoznak pro neplatící.
- Mobilní appka přes Capacitor: ukládání do galerie, předplatné přes obchody (RevenueCat), sestavení v GitHub Actions.
- Podmínky a zásady ochrany soukromí s údaji provozovatele.

**15. 11. – editor a vzhled**
- SVG ikony místo emoji, plynulé přehrávání na iPhonu, export 60 fps.
- Shine, 3D hloubka písma, vypálený stín, posun jednotlivých řádků.
- Ochrana proti zdvojeným titulkům, ukládání projektů, střih videa (rozstřihnout, smazat, zkrátit).
- Nový mód **3D mix**: slova přilétají z hloubky.

**16. 11. – pokročilé úpravy**
- Klíčové snímky videa (zoom, posun, speedrampa) a pinch zoom.
- Tracking: titulek nebo overlay jede za obličejem či objektem, stabilizace na objekt.
- AE přechody ve WebGL, video overlaye (rámeček, stín, 3D náklon), vrstvy.
- Barevné filtry a zpomalení / zrychlení úseků.
- Maska objektu se shinem.
- Přepis přes Groq (Whisper large v3) jako hlavní.
- PRO kód majitele ověřovaný na serveru.

**17.–18. 11. – přechody, zvuky, šablony, Reality**
- Schválené přechody podle předloh (Propad plátna, Zahoupání, Průlet + dohoupání, Warp…) a mrtvá místa (pauzy v řeči).
- Angličtina v rozhraní, nové šablony (3D lesk, negativ, metalická) a pravidlo, že šablony nesou jen názvy Styl N.
- Maska v2 (AI objekt / Pozemek), přesné sledování obličeje.
- **Real estate (Reality) mód**: titulky za hlavou podle masky postavy, stabilizace na obličej.

**19.–20. 11. – Reality a export**
- Reality: 3 řádky za hlavou, zbytek na hrudi, usazení po střihu, posouvání prstem.
- Maska postavy s přesnými vlasy.
- Odolný export zvuku (AAC) na iPhonu.
- Rádce s panáčkem: 85 návodů CZ+EN, bez AI.
- Šablony Styl 21–24 (Neulis béžová/hnědá, limetková se 3D leskem).
- Otitulkované reely MyceLove (Styl 24).

**21. 11. – provoz**
- Časování řádků; poslední titulek nepřesahuje konec videa.
- Denní limit AI přepisu zdarma (5 min/den, PRO bez limitu, bez databáze).
- Vlastní doména captions.efektive.cz.
- Knihovna zvuků.

**22. 11. – realitní fotky a zvuky**
- Úvodní volba Titulky / Realitní fotky.
- Realitní fotky: focení 5 expozic s HDR spojením (Android nativně přes Camera2), mapování tónů, úklid zdarma (MI-GAN).
- Zvuky: 73 MP3 nastříhaných z videí uživatele (Efekty + Memes), žádné výchozí zvuky.
- Styl 25 (zelený glow) podle předlohy.

**23. 11. – doladění**
- **Styl 25:** písmo Russo One (hranaté tvary s oblými rohy), rozměry, stín a záře změřené z předlohy. Tactic Sans je placený, proto se nepoužívá.
- **Reality podle druhé předlohy:**
  - bez 3D lesku;
  - velké slovo jako barevný negativ jednou barvou (růžová / žlutá / modrá / červená);
  - řádky náhodně kurzívou nebo tučněji;
  - hook efekty (shine, flicker) jen na některých větách;
  - větší hlavní slova.
- Zásady ochrany soukromí doplněné o realitní fotky a denní limit pro Google Play.
- Tento předávací dokument.

Podrobná historie je v `git log` větve `claude/lucid-maxwell-4k9eaj` (přes 270 commitů s českými popisy).

## 3. Co je hotové

**Titulky**
- AI přepis po slovech (CZ/SK/EN) a automatické rozdělení do řádků a titulků.
- 25 stylů, 3D texty a lesk, negativ, záře, shine, flicker, wiggle, různé příjezdy a odchody.
- Styl 25: záře jde zapnout i u jiných stylů (Barvy → „Záře i na vedlejších řádcích“).
- Reality mód:
  - stabilizace na obličej a text za hlavou;
  - barevný negativ, střídání kurzívy a tučného písma;
  - hook efekty: 1. věta shine, 2. flicker při příchodu, 3. nic, 4. flicker při odchodu, 5.–6. nic, pak jen občas.
- 3D mix, maska objektu s trackingem, overlaye, přechody, filtry, zpomalení, klíčové snímky.
- Knihovna zvuků, rádce s návody, čeština a angličtina.
- Export MP4 až 60 fps se zvukem, přímo v zařízení. Neplatící mají vodoznak EFEKTIVE.

**Realitní fotky**
- Bracketing a HDR, úklid, obloha, trávník, narovnání, upozornění na rozmazání.
- Online AI úprava přes `/api/enhance` (Gemini) je připravená, ale **vypnutá: chybí klíč**.

**Provoz**
- Všechno kromě přepisu (a volitelné AI úpravy fotek) běží v zařízení uživatele.
- Přepis jde přes Vercel do služby Groq.
- Denní limit zdarma je bez databáze.

## 4. Struktura kódu

```
efektive-captions/
  app/                 webová appka + serverové funkce (Vercel)
    public/            celá appka (statické soubory)
      engine.js        kreslení titulků, šablony (E.TEMPLATES), animace, efekty
      app.js           editor, panely, timeline, projekty (const BUILD = verze)
      reality.js       Reality mód (rozmístění za hlavu, barvy, hook efekty)
      export.js        export MP4 snímek po snímku
      head.js, person.js   rozbor obličeje a maska postavy (MediaPipe, offline)
      photo.js, photoui.js realitní fotky
      native.js        most do mobilní appky (Capacitor, RevenueCat)
      fonts/, fonts.css    písma (jen licence zdarma pro komerční použití – OFL)
      sfx/             knihovna zvuků
      podminky.html, soukromi.html
    api/
      transcribe.js    přepis (Groq, záložně ElevenLabs/OpenAI) + denní limit
      _quota.js        denní limit bez databáze (podepsaný lístek + limit na IP)
      pro.js           předplatné PRO přes Stripe (web)
      enhance.js       AI úprava fotek (Gemini)
    server.js          lokální server (node server.js → http://localhost:3000)
  mobile/              Capacitor appka (iOS + Android), appId cz.efektive.captions
    scripts/sync-web.js  zkopíruje app/public do mobile/www
    android/…/BracketPlugin.java   focení expozic přes Camera2
.github/workflows/
  efektive-android.yml   APK vždy, podepsaný AAB jen s klíči
  efektive-ios.yml       TestFlight jen s klíči Apple
```

## 5. Jak se nasazuje

**Web (Vercel)**
1. Zkopíruj `efektive-captions/app/public` a `efektive-captions/app/api` do složky propojené s projektem (`vercel link` → tým `efektive`, projekt `efektive-titulky`).
2. V kopii `public/app.js` nastav `const BUILD='<datum a čas>'` a stejný řetězec zapiš do `public/version.txt`. Telefony podle toho poznají novou verzi a samy se aktualizují.
3. Spusť `vercel deploy --prod --scope efektive` (s přihlášením nebo `VERCEL_TOKEN`).
4. Ověř stav: `GET https://api.vercel.com/v6/deployments?limit=1&target=production` → `READY`.

Změny proměnných ve Vercelu se projeví až po novém nasazení (Redeploy).

**Mobilní appky (GitHub Actions)**
- Spouští se samy při pushi do `claude/efektive-app` (a staré `claude/lucid-maxwell-4k9eaj`), pokud se změní `app/public`, `mobile` nebo workflow. Ručně jde spustit přes „Run workflow“.
- **Android:** APK k vyzkoušení se sestaví vždy (artefakt `efektive-captions-apk`). Podepsaný AAB pro Google Play (artefakt `efektive-captions-aab`) jen s klíči z kap. 6. Číslo verze = číslo běhu workflow.
- **iOS:** sestavení a TestFlight jen s klíči Apple. Bez nich se Mac vůbec nespouští.

**Lokálně:** `cd efektive-captions/app && node server.js` → http://localhost:3000.

## 6. Klíče a secrets (jen názvy, žádné hodnoty)

> Žádný klíč nepatří do repa ani do souborů. Serverové klíče jsou jen ve Vercelu (Settings → Environment Variables), klíče pro sestavení appek jen v GitHub Secrets.

**Vercel (ověřeno 23. 11.):**

| Proměnná | Stav | K čemu |
|---|---|---|
| `GROQ_API_KEY` | ✅ nastaveno | AI přepis řeči (hlavní) |
| `ELEVENLABS_API_KEY` | ✅ nastaveno | záloha přepisu |
| `PRO_MASTER_CODE` | ✅ nastaveno | PRO kód majitele (bez limitu, bez vodoznaku) |
| `PRO_SECRET` | ✅ nastaveno | podpis PRO kódů a lístků denního limitu |
| `STRIPE_SECRET_KEY` | ❌ chybí | předplatné PRO na webu |
| `STRIPE_PRICE_ID` | ❌ chybí | cena předplatného ve Stripe |
| `GEMINI_API_KEY` | ❌ chybí | online AI úprava realitních fotek |
| `GEMINI_IMAGE_MODEL` | volitelné | jiný model pro úpravu fotek |
| `OPENAI_API_KEY` | volitelné | další záloha přepisu |
| `FREE_SECONDS_PER_DAY` | volitelné | denní limit zdarma, výchozí 300 s; `0` = bez limitu |
| `FREE_AI_PER_DAY` | volitelné | denní limit AI úprav fotek zdarma |
| `PRO_PRICE_CZK` | volitelné | cena PRO, výchozí 300 |

**GitHub Secrets (repo) – zatím nic nenastaveno:**

| Secret | K čemu |
|---|---|
| `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | podpis AAB pro Google Play (upload key) |
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_B64`, `APPLE_TEAM_ID` | iOS sestavení a TestFlight |

**V kódu (veřejné, nejsou tajné):**
- `RC_KEYS` v `app/public/native.js` – veřejné klíče RevenueCat pro předplatné v obchodech.
- Teď jsou prázdné. Doplní se po založení účtu RevenueCat.

**Prostředí vývoje (cloud Claude):**
- Token pro Vercel je vložený bezpečně do prostředí (síťový secret), nikdy ne do repa.
- Dočasné Google tokeny se nepoužívají: majitel je nechce. Velké soubory na Disk ukládá Claude na jeho PC do synchronizované složky Google Drive.

## 7. Otevřené úkoly a další kroky

**Musí udělat majitel (účty, platby, rozhodnutí):**
1. **Google Play:**
   - Play Console → Vytvořit aplikaci (EFEKTIVE, čeština, aplikace, zdarma).
   - Vyplnit „Nastavení aplikace“. Zásady soukromí: https://captions.efektive.cz/soukromi.html. Reklamy: ne. Cílová skupina: 18+. Hodnocení obsahu a Zabezpečení dat pomůže vyplnit Claude.
   - Dát pokyn k vygenerování podpisového klíče a vložit 4 Android secrets do GitHubu.
2. **Apple:** založit účet Apple Developer, pak API klíč App Store Connect a 4 iOS secrets.
3. **Předplatné:**
   - web: účet Stripe → `STRIPE_SECRET_KEY` a `STRIPE_PRICE_ID` do Vercelu;
   - appky: RevenueCat a produkty v obchodech → `RC_KEYS`.
4. **Gemini klíč** do Vercelu, pokud mají běžet online AI úpravy fotek.
5. **Vercel tarif:** Hobby je oficiálně jen nekomerční. Před spuštěním prodeje PRO přejít na Pro (20 $/měs.).
6. **Font Tactic Sans** pro Styl 25 jen se zakoupenou licencí Web + App (MyFonts/Fontspring). Bez ní zůstává Russo One. Stažené kopie z webů s „free fonty“ se do appky dávat nesmí.
7. **Doména:** případný převod efektive.cz z Webnode jinam je na později.

**Zvládne vývoj (Claude / vývojář) po dodání výše uvedeného:**
- vygenerovat upload keystore, sestavit podepsaný AAB a připravit první release na Google Play;
- dopojit RevenueCat, Stripe a Gemini;
- iOS build a TestFlight po založení Apple účtu;
- další úpravy stylů a Reality podle předloh. Postup: změřit předlohu snímek po snímku, ukázat srovnání obrázkem, teprve pak nasadit.

**Rozpracované – jazyky rozhraní (viz `efektive-captions/JAZYKY.md`):**
- Hotová je čeština (zdroj) a angličtina (`app/public/i18n/en.js`, asi 820 textů).
- Dalších 20 jazyků je v nabídce jako „Brzy“ (`UI_LANGS` v `app/public/i18n.js`): sk, pl, de, fr, es, it, pt, nl, hu, ro, uk, ru, tr, ar, hi, zh, ja, ko, id, vi.
- Postup u každého jazyka:
  1. přeložit slovník `i18n/<kód>.js` (pevné texty, bez AI za běhu);
  2. přeložit 85 návodů rádce v `radce.js` (dnes jen CZ+EN);
  3. zapnout jazyk v `i18n.js` a načíst ho v `index.html`.
- Arabština potřebuje rozvržení zprava doleva.

**Technické dluhy / nápady:**
- Denní limit bez databáze jde obejít (smazání dat + změna sítě). Pro přísný limit přidat malou databázi (např. Upstash).
- Přepis závisí na bezplatném limitu Groq (zhruba 8 h zvuku denně pro všechny uživatele dohromady). Při růstu zapnout placený Groq.
- Starší projekty se zapnutou Realitou si drží původní vzhled. Nový vzhled platí po vypnutí a zapnutí Reality.
- Testovací skripty (Playwright) a testovací videa nejsou v repu. Stojí za to je přidat jako sadu regresních testů.

## 8. Jak se testuje

- Playwright proti lokálnímu serveru (`node server.js`):
  - vykreslení titulků v daných časech;
  - porovnání s předlohou (rozměry, barvy, stín, animace snímek po snímku);
  - export MP4;
  - regrese všech 25 stylů;
  - tok zapnutí a vypnutí Reality.
- Reality potřebuje rozbor obličeje a postavy (MediaPipe). V prohlížeči bez grafiky trvá několik minut, proto je dobré výsledek uložit a v dalších testech jen načíst (`HEAD.load`, `PERSON.load`).

## 9. Deník převzetí

**23. 11. 2026 večer – převzetí do nového chatu (větev `claude/efektive-app`)**
- Starý chat „Video titulky“ je zamčený jen pro důvěryhodná zařízení, práce pokračuje tady.
- Ověřeno:
  - produkce na Vercelu `READY` (nasazeno 23. 11. 19:47 UTC), verze `20261123194732`;
  - nasazené soubory (app.js, engine.js, reality.js, export.js, native.js, photo.js) jsou shodné s kódem v repu;
  - domény captions.efektive.cz a efektive-titulky.vercel.app ověřené ve Vercelu, záložní adresa vrací 200;
  - GitHub Actions pro commit 56e796e: Android i iOS úspěšně;
  - syntaxe všech JS souborů v pořádku, lokální server startuje.
- Pozor: cloudové prostředí Clauda nemá v síťových pravidlech povolené `captions.efektive.cz`, takže se odsud kontroluje přes `efektive-titulky.vercel.app` (stejné nasazení).
- Workflow pro Android a iOS se nově spouštějí i z větve `claude/efektive-app`.
