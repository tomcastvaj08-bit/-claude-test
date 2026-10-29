# Slovník výslovnosti pro hlas (eleven_v4)

Pravidlo uživatele: **všechno se říká česky.** Zkratky se čtou česky po písmenech, anglická slova česky foneticky. Hlas čte, co je napsané, takže do `prompt` pro TTS se píše přepis, NIKDY anglický originál ani velká zkratka.

| na obrazovce | do scénáře (TTS) | poznámka |
|---|---|---|
| AI | **á í** | NIKDY „ej aj“ (chyba v #1 i #2) |
| ChatGPT | čet gé pé té | GPT česky po písmenech |
| GPT-6.1 | gé pé té šest celá jedna | |
| OpenAI | oupn á í | AI i tady česky |
| API | á pé í | |
| Claude | klód | |
| Gemini | džemini | |
| Google | gúgl | |
| iPhone | ajfoun | |
| Android | android | |
| Instagram | instagram | |
| Edits | edits | |
| app / appka | apka | |
| carousel | karusel | |
| Work (režim) | vork | |
| Codex | kodex | |
| Plus / Pro | plus / pro | |
| e-mail / mail | mejl | |
| update | apdejt | |
| prompt | prompt | |
| agent | agent | |
| computer use | ovládání počítače | radši česky přeložit |
| feature | funkce | přeložit |

**Postup před každým TTS:**
1. Projdi skript a najdi každé slovo psané latinkou, které není česky, a každou zkratku z VELKÝCH písmen (regex `\b[A-Z]{2,}\b` a anglická slova).
2. Nahraď je podle tabulky. Co v tabulce chybí, přepiš česky (zkratky po písmenech česky: á, bé, cé, dé, é, ef, gé, há, í, jé, ká, el, em, en, ó, pé, kvé, er, es, té, ú, vé, iks, ypsilon, zet) a doplň do tabulky.
3. Po vygenerování zkontroluj v přepisu ze Scribe, že tam není „ej aj“, „ej pí aj“ apod.
