# Jak funguje AI přepis v EFEKTIVE Captions

## Cesta jednoho videa

1. **Telefon** vytáhne z videa jen zvuk a zmenší ho (16 kHz, mono). Video samo nikam neodchází.
2. Zvuk jde po kouscích dlouhých max. 45 s na **náš server**: Vercel, adresa `efektive-titulky.vercel.app/api/transcribe`.
3. Server přidá **tajný klíč Groq** a pošle zvuk do **Groq** (AI model Whisper large v3).
   - Klíč je jen v nastavení Vercelu. Do telefonu ani do kódu se nedostane.
4. Groq vrátí **slova s časy** a telefon z nich poskládá titulky.
5. **Všechno ostatní běží v telefonu uživatele**, nic to nestojí:
   - titulky, styly, 3D,
   - obličej, maska,
   - export, zvuk.

## Čerpá to Clauda?

**Ne.** Claude (já) se používá jen ke stavění a úpravám appky. Hotová appka se mnou vůbec nekomunikuje. Ať ji používá 1 nebo 10 000 lidí, Claude to nečerpá.

## Co to čerpá

| Služba | K čemu | Cena teď |
|---|---|---|
| **Groq** | AI přepis řeči | **Zdarma** do limitu: podle dostupných zdrojů zhruba **8 hodin zvuku denně** a 2 000 přepisů denně, pro všechny uživatele dohromady. Přesné limity: console.groq.com → Settings → Limits. |
| **Vercel** | náš server + web appky | **Zdarma** (tarif Hobby). Ten je ale oficiálně jen pro nekomerční použití. Jakmile se bude prodávat PRO, je potřeba tarif **Pro za 20 $ měsíčně**. |
| **ElevenLabs** | jen záloha | Nepoužívá se. Zapnul by se jen tehdy, kdyby ve Vercelu nebyl klíč Groq. |
| **OpenAI** | jen záloha | Nepoužívá se, pokud ve Vercelu není klíč OpenAI. |

**Když se appka rozjede** a 8 hodin denně nebude stačit, přepis začne hlásit chybu. Pak stačí zapnout placený Groq. Je levný, odhadem jednotky korun za hodinu zvuku; před zapnutím ověř aktuální ceník na groq.com.

## Denní limit pro neplatící (nově)

- **Zdarma:** 5 minut zvuku denně na zařízení, to je zhruba 5–10 reelů.
- **PRO:** bez omezení.
- **Po vyčerpání** appka napíše, že se limit zítra obnoví nebo že si uživatel může vzít PRO.
- **Obnova:** limit se obnoví každý den o půlnoci českého času.

**Jak to hlídá (bez databáze):**
- Telefon dostává od serveru podepsaný „lístek“ s tím, kolik dnes přepsal. Ručně se upravit nedá.
- Pojistka: jedna internetová adresa (třeba jedna wifi) zvládne za den max. 3× limit. Platí jen přibližně, server si ji pamatuje jen v paměti.
- Kdo se hodně snaží, limit obejde smazáním dat appky a změnou sítě. Pro úplně přísný limit by byla potřeba malá databáze (dá se zdarma, třeba Upstash).

**Změna limitu:**
1. Ve Vercelu otevři Settings → Environment Variables.
2. Nastav `FREE_SECONDS_PER_DAY` na počet sekund. Například `600` = 10 minut, `0` = bez limitu pro všechny.
3. Pak dej Redeploy.

## Kde co sledovat

- **Spotřeba přepisu:** console.groq.com (Usage).
- **Server a návštěvnost:** vercel.com → projekt efektive-titulky.
