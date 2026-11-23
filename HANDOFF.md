# EFEKTIVE – předávací dokument k aplikaci

Stav k 23. 11. 2026. Aplikace na automatické titulky do videí (+ realitní fotky) pod značkou EFEKTIVE.

- **Živě:** https://captions.efektive.cz (záložně https://efektive-titulky.vercel.app)
- **Kód:** `efektive-captions/` v tomto repu, pracovní větev `claude/lucid-maxwell-4k9eaj`. Větev `main` se zatím nepoužívá ani nemění.
- **Další dokumenty:**
  - `efektive-captions/JAK_FUNGUJE_PREPIS.md` – přepis řeči, ceny, denní limit
  - `efektive-captions/NAVOD_*.md`, `MASKA.md`, `PRECHODY.md` – jednotlivé funkce

---

## 1. Co aplikace umí (stav)

**Titulky (hlavní část)**
- AI přepis řeči a automatické titulky:
  - po slovech, CZ/SK/EN;
  - časování řádků;
  - poslední titulek končí přesně s koncem videa.
- 25 stylů (Styl 1–25), 3D texty, lesk, záře, negativ, shine, flicker a další animace.
- **Styl 25 (zelený glow):**
  - písmo Russo One;
  - rozměry, mezery, stín, záře, barvy a animace změřené snímek po snímku z předlohy;
  - záře jde zapnout i u jiných stylů: v Barvách přepínač „Záře i na vedlejších řádcích“.
- **Reality mód** (realitní reels):
  - titulek je za hlavou díky masce postavy a stabilizaci na obličej;
  - velké slovo je barevný negativ jednou barvou (růžová / žlutá / modrá / červená);
  - řádky se náhodně střídají v kurzívě a tučném;
  - hook efekty: 1. věta shine, 2. flicker při příchodu, 3. nic, 4. flicker při odchodu, 5.–6. nic, pak jen občas;
  - krátká slova za hlavou se zvětší na čitelnou velikost.
- Editor:
  - timeline jako v CapCutu;
  - overlaye, maska objektu s trackingem;
  - přechody, filtry, knihovna zvuků (73 MP3, kategorie Efekty a Memes, žádné výchozí zvuky);
  - rádce s návody (CZ/EN).
- Export MP4 až 60 fps se zvukem, přímo v zařízení. Neplatící mají vodoznak EFEKTIVE.

**Realitní fotky**
- Focení 5 expozic (bracketing, nativní Android plugin) a HDR spojení.
- Úklid zdarma (MI-GAN), obloha, trávník, narovnání, upozornění na rozmazání.
- Online AI úprava přes `/api/enhance` (Gemini) – **vypnutá, chybí klíč** (viz kap. 4).

**Co běží kde**
- Všechno kromě přepisu běží v telefonu nebo prohlížeči uživatele, takže to nic nestojí.
- Přepis jde přes server (Vercel) a službu Groq (Whisper). Denní limit zdarma je 5 min zvuku na zařízení, PRO je bez limitu.

## 2. Struktura kódu

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
      podminky.html, soukromi.html   podmínky a zásady ochrany soukromí
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
  efektive-android.yml   APK vždy, podepsaný AAB jen když jsou klíče
  efektive-ios.yml       TestFlight jen když jsou klíče Apple
```

## 3. Nasazení

**Web (Vercel)**
- Projekt: `efektive-titulky`, tým `efektive`.
- Domény: `captions.efektive.cz`, `efektive-titulky.vercel.app`.
- DNS je na Webnode: CNAME `captions` → Vercel, plus TXT ověření.

Postup nasazení:
1. Zkopíruj `efektive-captions/app/public` a `efektive-captions/app/api` do složky propojené s projektem (`vercel link` → efektive / efektive-titulky).
2. V kopii `public/app.js` nastav `const BUILD='<datum a čas>'` a stejný řetězec zapiš do `public/version.txt`. Telefony podle toho poznají novou verzi a samy se aktualizují.
3. Spusť `vercel deploy --prod --scope efektive` (s přihlášením nebo `VERCEL_TOKEN`).
4. Ověř stav posledního nasazení: `GET https://api.vercel.com/v6/deployments?limit=1&target=production` → `READY`.

**Mobilní appky (GitHub Actions)**
- Spouští se samy při pushi do `claude/lucid-maxwell-4k9eaj`, pokud se změní `app/public`, `mobile` nebo workflow. Ručně jde spustit přes „Run workflow“.
- **Android:** APK k vyzkoušení se sestaví vždy (artefakt `efektive-captions-apk`). Podepsaný AAB pro Google Play jen s klíči z kap. 4.
- **iOS:** sestavení a TestFlight jen s klíči Apple z kap. 4. Bez nich se Mac vůbec nespouští.

**Lokálně:** `cd efektive-captions/app && node server.js` → http://localhost:3000.

## 4. Klíče a tajné hodnoty

> Žádný klíč nepatří do repa ani do souborů. Serverové klíče jsou jen ve Vercelu (Settings → Environment Variables), klíče pro sestavení appek jen v GitHub Secrets. Po změně ve Vercelu je potřeba Redeploy.

**Vercel – stav k dnešku (jen názvy):**

| Proměnná | Stav | K čemu |
|---|---|---|
| `GROQ_API_KEY` | ✅ nastaveno | AI přepis řeči (hlavní) |
| `ELEVENLABS_API_KEY` | ✅ nastaveno | záloha přepisu |
| `PRO_MASTER_CODE` | ✅ nastaveno | hlavní PRO kód majitele (bez limitu, bez vodoznaku) |
| `PRO_SECRET` | ✅ nastaveno | podpis PRO kódů a lístků denního limitu |
| `STRIPE_SECRET_KEY` | ❌ chybí | předplatné PRO na webu (300 Kč/měsíc) |
| `STRIPE_PRICE_ID` | ❌ chybí | cena předplatného ve Stripe |
| `GEMINI_API_KEY` | ❌ chybí | online AI úprava realitních fotek |
| `GEMINI_IMAGE_MODEL` | volitelné | jiný model pro úpravu fotek |
| `OPENAI_API_KEY` | volitelné | další záloha přepisu |
| `FREE_SECONDS_PER_DAY` | volitelné | denní limit zdarma, výchozí 300 s; `0` = bez limitu |
| `FREE_AI_PER_DAY` | volitelné | denní limit AI úprav fotek zdarma |
| `PRO_PRICE_CZK` | volitelné | cena PRO, výchozí 300 |

**GitHub Secrets – zatím nic nenastaveno:**

| Secret | K čemu |
|---|---|
| `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | podpis AAB pro Google Play (upload key) |
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_B64`, `APPLE_TEAM_ID` | iOS sestavení a TestFlight |

**V kódu (veřejné, nejsou tajné):**
- `RC_KEYS` v `app/public/native.js` – veřejné klíče RevenueCat pro předplatné v obchodech.
- Teď jsou prázdné. Doplní se po založení účtu RevenueCat a produktů v App Store / Google Play.

## 5. Další kroky

**Musí udělat majitel (účty, platby, rozhodnutí):**
1. **Google Play** (účet organizace ověřený, D-U-N-S 984009521):
   - Play Console → Vytvořit aplikaci (EFEKTIVE, čeština, aplikace, zdarma).
   - Vyplnit „Nastavení aplikace“. Zásady soukromí: https://captions.efektive.cz/soukromi.html. Reklamy: ne. Cílová skupina: 18+.
   - Dát pokyn k vygenerování podpisového klíče a vložit 4 Android secrets do GitHubu.
2. **Apple Developer** (pro iOS): účet, pak API klíč App Store Connect a 4 iOS secrets.
3. **Předplatné:**
   - web: Stripe účet → `STRIPE_SECRET_KEY` a `STRIPE_PRICE_ID` do Vercelu;
   - appky: RevenueCat a produkty v obchodech → `RC_KEYS`.
4. **Gemini klíč** do Vercelu, pokud chce online AI úpravy fotek.
5. **Vercel tarif:** Hobby je oficiálně jen nekomerční. Před spuštěním prodeje PRO přejít na Pro (20 $/měs.).
6. **Font Tactic Sans** pro Styl 25 jen se zakoupenou licencí Web + App (MyFonts/Fontspring). Bez licence zůstává Russo One. Stažené kopie z webů s „free fonty“ se do appky dávat nesmí.
7. **Doména a e-mail:**
   - efektive.cz běží přes Webnode;
   - pošta je přeposílaná přes ImprovMX do Gmailu (odesílání přes Gmail „poslat jako“);
   - případný převod domény jinam je na později.

**Zvládne vývoj (Claude / vývojář) po dodání výše uvedeného:**
- vygenerovat upload keystore, nastavit sestavení AAB a první release na Google Play;
- dopojit RevenueCat, Stripe a Gemini, jakmile budou klíče;
- iOS build a TestFlight po založení Apple účtu;
- další úpravy stylů a Reality podle předloh (postup: změřit předlohu snímek po snímku, porovnat obrázkem, teprve pak nasadit).

## 6. Jak se testuje

- Engine se testuje v Playwrightu proti lokálnímu serveru (`node server.js`): vykreslení titulků v daných časech, porovnání s předlohou (rozměry, barvy, stín, animace), export MP4, regrese všech 25 stylů a tok zapnutí/vypnutí Reality.
- Reality potřebuje rozbor obličeje a postavy (MediaPipe). V prohlížeči bez grafiky trvá několik minut, proto je dobré výsledek rozboru uložit a v dalších testech jen načíst (`HEAD.load`, `PERSON.load`).
- Testovací skripty a videa nejsou v repu, byly jen v dočasném pracovním prostředí.

## 7. Známá omezení

- Přepis závisí na bezplatném limitu Groq (zhruba 8 h zvuku denně pro všechny uživatele dohromady). Při růstu zapnout placený Groq.
- Denní limit zdarma je bez databáze. Kdo hodně chce, obejde ho smazáním dat a změnou sítě. Pro přísný limit by byla potřeba malá databáze (např. Upstash).
- Starší projekty se zapnutou Realitou si drží původní vzhled. Nové nastavení platí po vypnutí a zapnutí Reality.
