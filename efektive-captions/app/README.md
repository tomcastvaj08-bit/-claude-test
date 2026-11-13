# EFEKTIVE Captions

Webová appka na prémiové titulky do reels. Výchozí je šablona **Base** podle vzorového videa
(viz `../NAVOD_BASE.md`), druhá je **v8** (vinotéka, `../NAVOD_TITULKY.md`).
Běží v mobilu i na počítači, dá se přidat na plochu (Safari → Sdílet → Přidat na plochu).

## Jak to funguje
1. **Nahraješ video**. Zůstává v zařízení, na přepis se posílá jen zvuk (16 kHz mono, dělený v tichých místech).
2. **AI přepíše řeč** slovo po slovu s časy: ElevenLabs Scribe (nejlepší čeština), záloha OpenAI Whisper.
3. **Titulky Base**: 3 řádky plněné podle šířky (až 7 slov), hlavní prostřední v SF Pro Heavy s přelivem
   oranžová → žlutá a Každým Slovem Velkým, vedlejší bílé → šedé; slova se prolnou, na konci rychlé zmenšení.
   Šablona **v8**: 3D náklon, záře, nástup celého bloku zespodu (expo 0,55 s).
4. **Uložíš video v 60 fps**, renderované snímek po snímku (WebCodecs → MP4 H.264), takže nic nezasekne.

## Co umí
- **Šablony** Base (výchozí) a v8, tlačítko „Obnovit šablonu“.
- **Barva hlavního řádku podle tématu**: Oranžovo-žlutá (Base), Víno `#e4202c`, Zlatý přeliv `#ffe04a → #ff8a00`, Luxus `#b8925a`,
  **Podle videa** (najde výraznou barvu značky/produktu ve scéně, která nesplývá s pozadím pod titulkem) nebo vlastní.
- **Náklon podle prostoru**: Střídat (v8), Rovně, Polička, Polička zprava, Na stůl / sud, plus jemné doladění.
- **Všechny titulky / Jen tenhle titulek**: libovolné nastavení jen pro jeden titulek (modrá tečka v seznamu).
- Přetažení titulku prstem (přichytí na střed, ukáže safe zónu IG), zvětšení úchytem nebo dvěma prsty.
- Oprava textu přímo v seznamu (při stejném počtu slov zůstanou přesné časy), ťuknutím na slovo z něj uděláš hlavní řádek.
- **Kontrola všech**: mozaika všech titulků v okamžiku, kdy jsou vidět všechna slova, a hlídání ořezu.
- Projekt se průběžně ukládá v prohlížeči. Po znovuotevření stejného videa se titulky i úpravy obnoví.
- Volitelně jemný zvuk při nástupu titulku (smíchaný do exportu přesně na snímek).
- Záměrně **nejsou** efekty, které v8 zakazuje (wiggle, squish, pop, pružina, shake, tvrdý 3D stín, ostrý lesk).

## Technika
- `public/engine.js`: kreslicí engine (rozdělení na trojice, layout, stín, záře, animace). 3D perspektiva
  se kreslí přes **WebGL** jako skutečně promítnutý čtyřúhelník (bez proužků a mřížky). Záře je jeden
  rozostřený tvar z promítnuté masky hlavních slov pod ostrým textem.
- `public/source.js`: rychlé čtení snímků pro export (MP4/MOV → mp4box → VideoDecoder, správně otočená
  svislá videa z iPhonu). Jiné formáty jedou přes přetáčení (pomalejší, ale stejný výsledek).
- `public/app.js`: UI, přepis, editace, export (H.264 + AAC, kde AAC není, tak Opus; bez H.264 WebM VP9).
  Prohlížeče bez WebCodecs: záložní nahrávání v reálném čase.
- `public/vendor/`: mp4-muxer, webm-muxer, mp4box (MIT/BSD, licence vedle).

## Spuštění u sebe
1. Node.js 18+
2. `cp .env.example .env` a vlož `ELEVENLABS_API_KEY` (nebo `OPENAI_API_KEY`)
3. `node server.js` → http://localhost:3000 (z mobilu na stejné wifi `http://<IP-počítače>:3000`)

## Nasazení (Vercel)
Nahraj složku `app` jako projekt, v Environment Variables přidej klíč, Deploy.

## Cena provozu
Přepis: podle ceníku ElevenLabs (Scribe), případně Whisper $0.006 / min. Render a export běží v zařízení zdarma.
