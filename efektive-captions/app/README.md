# EFEKTIVE Captions (beta v9 + Base)

Webová appka na automatické titulky do videí ve stylu SA Captions pod značkou EFEKTIVE.
Výchozí šablona je **Base** podle vzorového videa (`../NAVOD_BASE.md`). Každý spodní řádek leží vždy
před řádkem nad ním, aby se nezakrývala diakritika.
Funguje v mobilu i na počítači v prohlížeči, dá se přidat na plochu jako ikona (Safari → Sdílet → Přidat na plochu).

## Spuštění u sebe (2 minuty)
1. Nainstaluj Node.js 18+ (https://nodejs.org)
2. Zkopíruj `.env.example` na `.env` a vlož klíč:
   - `OPENAI_API_KEY` – přepis přes Whisper (https://platform.openai.com/api-keys)
   - volitelně `ELEVENLABS_API_KEY` – při volbě „Max přesnost“ se použije ElevenLabs Scribe (nejpřesnější na češtinu a slovenštinu)
3. Ve složce spusť `node server.js` a otevři http://localhost:3000
4. Z mobilu na stejné wifi: `http://<IP-počítače>:3000`

## Nasazení na internet (Vercel)
1. Nahraj složku na GitHub → https://vercel.com → New project → vyber repo
2. Settings → Environment Variables: `OPENAI_API_KEY` (a případně `ELEVENLABS_API_KEY`)
3. Deploy → odkaz typu `efektive-captions.vercel.app` (dá se nasměrovat na `captions.efektive.cz`)

## Struktura
- `public/index.html`, `public/app.css` – obrazovky (Domů, AI přepis, Analýza, Editor, listy)
- `public/engine.js` – kreslení titulků (3D perspektiva, záře, lesk, animace, šablony, fonty, zvuky)
- `public/app.js` – editor, časová osa, panely, zpět/znovu, projekty
- `public/ai.js` – obličej, oddělení postavy (text za postavou), barva z videa, náklon podle scény
- `public/export.js` – přesný export snímek po snímku (MP4), průhledné titulky (PNG v ZIPu)
- `public/source.js` – rychlé čtení snímků pro export (MP4/MOV → mp4box → VideoDecoder, bez přetáčení,
  správně otočená svislá videa z iPhonu); „text za postavou“ a jiné formáty jedou přes přetáčení
- 3D náklon se kreslí přes WebGL jako přesný perspektivní čtyřúhelník (bez proužků); bez WebGL záloha proužky
- `public/vendor/` – MediaPipe (obličej, postava), mp4-muxer a mp4box, vše offline
- `public/fonts.css` – písma s `unicode-range` (čeština se kreslí správným řezem), Inter Tight 300–900 jako náhrada SF Pro
- `api/transcribe.js` – přepis řeči (OpenAI Whisper / ElevenLabs Scribe), klíč zůstává na serveru

## Cena provozu
Whisper ≈ 0,15 Kč za minutu zvuku. Analýza obličeje, postavy i export běží v zařízení zdarma.
