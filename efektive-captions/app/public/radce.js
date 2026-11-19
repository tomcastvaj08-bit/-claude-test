// ================= RÁDCE (nápověda bez AI) =================
// Nic se neposílá ven, nic nestojí, funguje offline. Návody jsou pevně sepsané níže (česky + anglicky).
// Každý návod: c = kategorie, g = kam „Ukázat mi“ vede, cs / en = [název, kroky oddělené |, hledací slova].
// g: p = nabídka dole (data-p), s = záložka v nabídce {jméno:hodnota}, q = CSS výběr prvku, t = český popisek prvku,
//    tool = prvek mimo nabídku (lišta pod timeline, horní lišta…), home = prvek na úvodní obrazovce.
// NOVÁ FUNKCE V APPCE = přidat sem návod (oba jazyky), ať o ní rádce ví.
(function(){
const KB=[
// ---------- ZAČÁTEK ----------
{id:'new',c:'start',g:{home:'#home label.btn.primary'},
 cs:['Jak udělat titulky k videu','Na úvodní obrazovce klepni na „Nové video“ a vyber video.|Vyber jazyk, kterým se ve videu mluví.|Klepni na „Vytvořit titulky“ a AI je napíše sama.','nové video nahrát vytvořit titulky začít přepis automaticky první start'],
 en:['How to make captions for a video','On the start screen tap “New video” and pick a video.|Choose the language spoken in the video.|Tap “Create captions” and the AI writes them for you.','new video upload create captions start transcribe automatic first']},
{id:'manual',c:'start',g:{home:'#home label.btn.primary'},
 cs:['Vlastní text místo přepisu','Klepni na „Nové video“ a vyber video.|V nastavení sjeď dolů k poli pro vlastní text.|Vlož text a klepni na „Rozložit text po videu“.','vlastní text vložit scénář ručně bez ai napsat sám'],
 en:['Use my own text instead of transcription','Tap “New video” and pick a video.|Scroll down in the setup to the custom text box.|Paste your text and tap “Spread text over video”.','own text paste script manual without ai type myself']},
{id:'projects',c:'start',g:{home:'#projects'},
 cs:['Kde najdu rozdělaný projekt','Projekt se ukládá sám při každé změně.|Křížek vlevo nahoře v editoru projekt uloží a zavře.|Na úvodní obrazovce dole je seznam projektů – klepni a pokračuješ.','uložit uložení projekt rozdělaný otevřít znovu historie nedávné pokračovat'],
 en:['Where do I find my unfinished project','The project saves itself after every change.|The cross at the top left of the editor saves and closes it.|On the start screen there is a list of projects at the bottom – tap one to continue.','save saving project unfinished open again history recent continue']},
{id:'lang',c:'start',g:{home:'#uiLangBtn'},
 cs:['Změnit jazyk aplikace','Na úvodní obrazovce vpravo nahoře klepni na zeměkouli.|Vyber jazyk. Appka si ho zapamatuje.','jazyk aplikace angličtina čeština přeložit language zeměkoule vlajka'],
 en:['Change the app language','On the start screen tap the globe at the top right.|Pick a language. The app remembers it.','app language english czech translate globe flag']},
{id:'pro',c:'start',g:{home:'#proBtn'},
 cs:['Předplatné PRO a vodoznak','Bez PRO má stažené video uprostřed poloprůhledné logo.|Na úvodní obrazovce klepni na „Získat PRO“.|S PRO je každé video bez vodoznaku.','pro předplatné zaplatit cena vodoznak logo loga bez vodoznaku zbavit koupit platba'],
 en:['PRO subscription and watermark','Without PRO the saved video has a semi-transparent logo in the middle.|On the start screen tap “Get PRO”.|With PRO every video is without the watermark.','pro subscription pay price watermark logo remove buy payment']},
{id:'procode',c:'start',g:{home:'#proBtn'},
 cs:['PRO na dalším zařízení','Klepni na „Získat PRO“.|Otevři „Už mám PRO (jiné zařízení)“.|Vlož PRO kód, který ti appka ukázala po zaplacení.','pro kód jiné zařízení druhý telefon přenést aktivovat obnovit'],
 en:['PRO on another device','Tap “Get PRO”.|Open “I already have PRO (another device)”.|Paste the PRO code the app showed you after payment.','pro code another device second phone transfer activate restore']},
// ---------- TITULKY ----------
{id:'edit',c:'cap',g:{p:'captions',q:'#editTxt'},
 cs:['Opravit slovo v titulku','Otevři nabídku Titulky.|Klepni na tužku u titulku, nebo titulek vyber a dej „Upravit text“.|Oprav text a klepni na „Hotovo“.','opravit upravit přepsat slovo text chyba překlep změnit text'],
 en:['Fix a word in a caption','Open the Captions menu.|Tap the pencil next to a caption, or select it and tap “Edit text”.|Fix the text and tap “Done”.','fix edit rewrite word text mistake typo change text']},
{id:'batch',c:'cap',g:{p:'captions',q:'#batchBtn'},
 cs:['Hromadná úprava a Najít / Nahradit','Titulky → „Hromadná úprava“.|Každý řádek je jeden titulek, časy zůstanou.|Nahoře je Najít a Nahradit pro celé video.','hromadná úprava najít nahradit všechny najednou nahradit slovo všude'],
 en:['Bulk edit and Find / Replace','Captions → “Bulk edit”.|Each line is one caption; timings stay.|At the top there is Find and Replace for the whole video.','bulk edit find replace all at once replace word everywhere']},
{id:'dict',c:'cap',g:{p:'captions',q:'#dictBtn'},
 cs:['Slovník oprav (AI píše slovo špatně)','Titulky → „Slovník oprav“.|Napiš, jak to AI píše špatně, a jak to má být správně.|Použije se při každém dalším přepisu.','slovník oprav ai píše špatně jméno značka název opravovat automaticky'],
 en:['Correction dictionary (AI spells a word wrong)','Captions → “Correction dictionary”.|Write how the AI spells it wrong and how it should be.|It is used in every following transcription.','dictionary corrections ai wrong spelling name brand fix automatically']},
{id:'delcap',c:'cap',g:{p:'captions',q:'#capDel'},
 cs:['Smazat titulek','Klepni na titulek na timeline.|Klepni na koš nad timeline, nebo Titulky → „Smazat vybraný titulek“.|Omyl vrátíš šipkou Zpět.','smazat odstranit titulek vymazat text pryč koš'],
 en:['Delete a caption','Tap the caption on the timeline.|Tap the trash can above the timeline, or Captions → “Delete selected caption”.|Undo with the back arrow if it was a mistake.','delete remove caption erase text away trash']},
{id:'em',c:'cap',g:{p:'captions',q:'#pglist .w'},
 cs:['Zvýraznit slovo (hlavní slovo)','Otevři Titulky.|V seznamu titulků klepni na slovo – stane se hlavním (větší, barevné).|Který řádek je hlavní, nastavíš v „Hlavní řádek“.','zvýraznit hlavní slovo důležité větší barevné vyzdvihnout highlight'],
 en:['Highlight a word (main word)','Open Captions.|In the caption list tap a word – it becomes the main word (bigger, coloured).|Choose which line is the main one in “Main line”.','highlight main word important bigger coloured emphasise']},
{id:'lines',c:'cap',g:{p:'captions',t:'Max řádků na titulek'},
 cs:['Kolik slov a řádků má titulek','Otevři Titulky.|Posuvníky „Max řádků na titulek“, „Max znaků na řádek“ a „Slov na titulek“.|Titulky se hned přeskládají.','počet slov řádků kratší titulky delší titulky méně slov rozložení řádků'],
 en:['How many words and lines a caption has','Open Captions.|Sliders “Max lines per caption”, “Max characters per line” and “Words per caption”.|Captions rearrange instantly.','number of words lines shorter captions longer fewer words line layout']},
{id:'splitcap',c:'cap',g:{tool:'#splitBtn'},
 cs:['Rozdělit titulek na dva','Dej přehrávací hlavu doprostřed titulku.|Pod timeline klepni na „Rozdělit titulek“.|Věta se rozdělí podle toho, kdy se slova vyslovují.','rozdělit titulek rozpůlit dva titulky rozseknout'],
 en:['Split a caption in two','Put the playhead in the middle of the caption.|Below the timeline tap “Split caption”.|The sentence splits by when the words are spoken.','split caption halve two captions cut caption']},
{id:'movecap',c:'cap',g:{tool:'#trC'},
 cs:['Posunout titulek v čase nebo ho zkrátit','Na timeline titulek chvilku podrž (asi 0,4 s), chytí se.|Táhni ho doleva nebo doprava.|Vybraný titulek zkrátíš nebo prodloužíš tažením za jeho okraj.','posunout čas dřív později zkrátit prodloužit délka titulku timeline přesunout'],
 en:['Move a caption in time or shorten it','On the timeline hold the caption for a moment (about 0.4 s) to grab it.|Drag it left or right.|Shorten or lengthen a selected caption by dragging its edge.','move time earlier later shorten lengthen caption duration timeline']},
{id:'poscap',c:'cap',g:{tool:'#stage'},
 cs:['Posunout titulek na videu nebo ho zvětšit','Na videu titulek chyť prstem a posuň, kam chceš.|Dvěma prsty ho zvětšíš nebo zmenšíš.|Přesně to jde i ve Styl → 3D a tvar → Pozice a Velikost.','posunout titulek na videu výš níž pozice místo zvětšit zmenšit velikost prsty'],
 en:['Move a caption on the video or resize it','Grab the caption on the video with your finger and move it.|Pinch with two fingers to make it bigger or smaller.|For exact values use Style → 3D & shape → Position and Size.','move caption on video higher lower position place bigger smaller size fingers']},
{id:'layer',c:'cap',g:{p:'captions',q:'#layerBtn'},
 cs:['Dva titulky naráz (vrstva pod)','Vyber titulek.|Titulky → „Vybraný titulek do vrstvy pod“, nebo ho na timeline podrž a stáhni dolů.|Titulek ve vrstvě pod se může překrývat s ostatními.','vrstva pod dva titulky naráz současně překrývat druhá stopa'],
 en:['Two captions at once (lower layer)','Select a caption.|Captions → “Selected caption to lower layer”, or hold it on the timeline and drag it down.|A caption in the lower layer can overlap the others.','lower layer two captions at once overlap second track']},
{id:'retr',c:'cap',g:{p:'captions',q:'#reTrClip'},
 cs:['Znovu přepsat titulky','Titulky → „Znovu přepsat klip“ přepíše jen klip pod přehrávací hlavou.|„Znovu přepsat vše“ vytvoří titulky celého videa znovu.|Styl, střihy a přechody zůstanou.','znovu přepsat přepis chybí titulky ai vynechala nový přepis klipu'],
 en:['Transcribe captions again','Captions → “Re-transcribe clip” redoes only the clip under the playhead.|“Re-transcribe all” recreates the captions of the whole video.|Style, cuts and transitions stay.','transcribe again missing captions ai skipped new transcription clip']},
{id:'one',c:'cap',g:{p:'style',q:'#scopeSw'},
 cs:['Změnit styl jen u jednoho titulku','Vyber titulek na timeline.|Nahoře v nabídce Styl nebo Šablony přepni na „Jen tento titulek“.|„Zrušit vlastní styl“ v Titulkách ho vrátí ke společnému stylu.','jen jeden titulek jiný styl jiná barva jednotlivě samostatně vlastní styl'],
 en:['Change the style of one caption only','Select the caption on the timeline.|At the top of Style or Templates switch to “Only this caption”.|“Reset own style” in Captions brings it back to the shared style.','one caption only different style different colour individually own style']},
{id:'zone',c:'cap',g:{tool:'#zoneAdd'},
 cs:['Úsek videa bez titulků','Dej přehrávací hlavu na místo, kde titulky nechceš.|Pod timeline klepni na „Bez titulků“ (přidá 2 s).|Délku upravíš tažením za okraje.','bez titulků skrýt úsek žádné titulky vypnout titulky část videa'],
 en:['Part of the video without captions','Put the playhead where you don’t want captions.|Below the timeline tap “No captions” (adds 2 s).|Adjust the length by dragging the edges.','no captions hide part section turn off captions part of video']},
{id:'hide',c:'cap',g:{tool:'#eyeBtn'},
 cs:['Skrýt titulky v náhledu','Klepni na oko vlevo nahoře vedle křížku.|Titulky zmizí jen z náhledu, export je obsahuje.','skrýt titulky oko náhled bez titulků podívat se na video'],
 en:['Hide captions in the preview','Tap the eye at the top left next to the cross.|Captions disappear only from the preview; the export keeps them.','hide captions eye preview watch video without captions']},
{id:'logoend',c:'cap',g:{p:'ai',q:'#zEnd'},
 cs:['Konec videa bez titulků (logo)','Dej přehrávací hlavu tam, kde začíná logo.|Nabídka AI → „Odsud do konce (logo)“.','konec logo outro závěr bez titulků poslední část'],
 en:['End of the video without captions (logo)','Put the playhead where the logo starts.|AI menu → “From here to the end (logo)”.','end logo outro ending no captions last part']},
{id:'face',c:'cap',g:{p:'ai',q:'#aiFace'},
 cs:['Titulky pod obličej','Nabídka AI → „Umístit titulky pod obličej“.|Appka najde obličej a titulky dá pod něj, aby ho nezakrývaly.','obličej pod obličej nezakrývat tvář umístit titulky automaticky'],
 en:['Captions below the face','AI menu → “Place captions under the face”.|The app finds the face and puts captions below it so they don’t cover it.','face under face don’t cover place captions automatically']},
// ---------- STYL ----------
{id:'tpl',c:'style',g:{p:'templates',s:{templates:'trending'},q:'#panel .tpl'},
 cs:['Vybrat šablonu (styl titulků)','Otevři Šablony → Styly.|Klepni na Styl 1, Styl 2, Styl 3…|Nahoře zvolíš, jestli na všechny titulky, nebo jen na tento.','šablona styl titulku vzhled titulků template předloha hotový styl změnit styl'],
 en:['Pick a template (caption style)','Open Templates → Styles.|Tap Style 1, Style 2, Style 3…|At the top choose all captions or only this one.','template style caption look preset ready style change style']},
{id:'default',c:'style',g:{p:'templates',q:'#setDefault'},
 cs:['Uložit vzhled jako výchozí','Nastav si titulky, jak chceš.|Šablony → „Tento vzhled jako výchozí“.|Každé nové video ho dostane automaticky.','výchozí vzhled uložit styl pokaždé základ default zapamatovat'],
 en:['Save the look as default','Set up the captions the way you like.|Templates → “Use this look as default”.|Every new video gets it automatically.','default look save style every time base remember']},
{id:'d3',c:'style',g:{p:'templates',s:{templates:'d3'}},
 cs:['3D texty','Otevři Šablony → záložka „3D texty“.|Klepni na styl, který se ti líbí.','3d texty trojrozměrné písmo prostorové styly'],
 en:['3D texts','Open Templates → “3D texts” tab.|Tap a style you like.','3d texts three dimensional font styles']},
{id:'gloss',c:'style',g:{p:'templates',q:'[data-k="gloss"]'},
 cs:['3D lesk (look z After Effects)','Šablony → rychlý efekt „3D lesk“ – převede aktuální styl.|Nebo Styl → Stín → 3D lesk „Zapnuto“, s výběrem hlavní / vedlejší řádek.','3d lesk after effects odlesk vypouklé lesklé písmo gloss glossy'],
 en:['3D gloss (After Effects look)','Templates → quick effect “3D gloss” – converts the current style.|Or Style → Shadow → 3D gloss “On”, choosing main or secondary line.','3d gloss after effects shiny glossy embossed font']},
{id:'tilt',c:'style',g:{p:'templates',q:'[data-k="tilt3d"]'},
 cs:['3D náklon','Šablony → rychlý efekt „3D náklon“.|Přesně: Styl → 3D a tvar → „3D náklon do strany“ a „dopředu / dozadu“.','3d náklon naklonit perspektiva šikmo otočit do strany'],
 en:['3D tilt','Templates → quick effect “3D tilt”.|Exactly: Style → 3D & shape → “3D tilt sideways” and “forward / back”.','3d tilt lean perspective angle rotate sideways']},
{id:'extrude',c:'style',g:{p:'templates',q:'[data-k="extrude3d"]'},
 cs:['3D hloubka písma (extrude)','Šablony → rychlý efekt „3D hloubka“.|Sílu nastavíš ve Styl → Stín → „3D hloubka písma“.','3d hloubka extrude extrusion tloušťka písma do hloubky vysunuté'],
 en:['3D text depth (extrude)','Templates → quick effect “3D depth”.|Set the strength in Style → Shadow → “3D font depth”.','3d depth extrude extrusion thickness deep']},
{id:'color',c:'style',g:{p:'style',s:{style:'color'}},
 cs:['Změnit barvu titulků','Otevři Styl → Barva.|Vyber barvy hlavního a ostatních řádků.|Směr přechodu: Svisle, Vodorovně nebo Šikmo.','barva barvy titulků změnit barvu přechod gradient odstín'],
 en:['Change the caption colour','Open Style → Colour.|Pick colours for the main and other lines.|Gradient direction: Vertical, Horizontal or Diagonal.','colour color caption change colour gradient shade']},
{id:'suggest',c:'style',g:{p:'style',s:{style:'color'},q:'#suggestCol'},
 cs:['Barva podle videa','Styl → Barva → „Navrhnout barvu podle videa“.|Appka vybere barvy, které se k videu hodí.','barva podle videa navrhnout barvu automaticky ladí sladit'],
 en:['Colour matching the video','Style → Colour → “Suggest colour from video”.|The app picks colours that fit the video.','colour from video suggest colour automatic match']},
{id:'glow',c:'style',g:{p:'style',s:{style:'color'},t:'Záře okolo hlavního slova'},
 cs:['Záře okolo hlavního slova','Styl → Barva → „Záře okolo hlavního slova“.|Vybereš, jestli svítí pořád, nebo jen při nástupu.','záře svítí okolo glow neon světlo hlavní slovo'],
 en:['Glow around the main word','Style → Colour → “Glow around main word”.|Choose always or only when it appears.','glow shine around neon light main word']},
{id:'font',c:'style',g:{p:'style',s:{style:'font'}},
 cs:['Změnit písmo (font)','Otevři Styl → Font.|Klepni na písmo. Hlavní a ostatní řádky mohou mít jiné.','písmo font změnit písmo typ písma jiné písmo'],
 en:['Change the font','Open Style → Font.|Tap a font. The main and other lines can differ.','font typeface change font different font']},
{id:'size',c:'style',g:{p:'style',s:{style:'text'},t:'Velikost hlavního řádku (%)'},
 cs:['Velikost písma','Styl → Text → „Velikost hlavního řádku“.|Celý titulek zvětšíš dvěma prsty na videu nebo ve Styl → 3D a tvar → Velikost.','velikost písma větší menší zvětšit zmenšit písmo velké'],
 en:['Font size','Style → Text → “Main line size”.|Resize the whole caption by pinching on the video or in Style → 3D & shape → Size.','font size bigger smaller enlarge shrink big']},
{id:'case',c:'style',g:{p:'style',s:{style:'text'},t:'Každé Slovo Velké'},
 cs:['VELKÁ nebo malá písmena','Styl → Text.|Vyber Žádná / Každé Slovo Velké / VELKÁ / malá.','velká písmena malá písmena kapitálky caps verzálky'],
 en:['UPPER or lower case','Style → Text.|Choose None / Each Word Capital / UPPER / lower.','upper case lower case capitals caps']},
{id:'weight',c:'style',g:{p:'style',s:{style:'text'},t:'Tloušťka písma'},
 cs:['Tloušťka písma','Styl → Text → „Tloušťka písma“.','tloušťka písma tučné tenké bold silné'],
 en:['Font weight','Style → Text → “Font weight”.','font weight bold thin thick']},
{id:'opac',c:'style',g:{p:'style',s:{style:'text'},t:'Průhlednost textu'},
 cs:['Průhlednost textu','Styl → Text → „Průhlednost textu“ (10–100 %).','průhlednost průhledný text poloprůhledný opacity'],
 en:['Text transparency','Style → Text → “Text opacity” (10–100 %).','transparency transparent text opacity see through']},
{id:'spacing',c:'style',g:{p:'style',s:{style:'transform'},t:'Mezery mezi písmeny'},
 cs:['Mezery mezi písmeny a řádkování','Styl → 3D a tvar.|„Mezery mezi písmeny“ a „Řádkování“ (vzdálenost řádků).','mezery mezi písmeny řádkování rozestup řádky blíž dál tracking'],
 en:['Letter spacing and line spacing','Style → 3D & shape.|“Letter spacing” and “Line spacing”.','letter spacing line spacing distance lines closer further tracking']},
{id:'wordgap',c:'style',g:{p:'style',s:{style:'text'},t:'Mezera mezi slovy (%)'},
 cs:['Mezera mezi slovy','Styl → Text → „Mezera mezi slovy“.','mezera mezi slovy rozestup slov'],
 en:['Space between words','Style → Text → “Word spacing”.','space between words word spacing gap']},
{id:'shadow',c:'style',g:{p:'style',s:{style:'shadow'}},
 cs:['Stín textu','Styl → Stín.|Malý / Střední / Velký, rozmazání, průhlednost a vzdálenost stínu.','stín textu shadow tmavý okraj čitelnost'],
 en:['Text shadow','Style → Shadow.|Small / Medium / Large, blur, opacity and distance.','text shadow dark edge readability']},
{id:'rows',c:'style',g:{p:'style',s:{style:'transform'},t:'1. řádek (horní)'},
 cs:['Posunout jednotlivé řádky','Styl → 3D a tvar.|U 1., 2. a 3. řádku posuvníky Nahoru / dolů a Doleva / doprava.|„Vrátit řádky na původní místo“ vše srovná.','posunout řádek horní spodní hlavní řádek jednotlivě odsadit'],
 en:['Move individual lines','Style → 3D & shape.|For lines 1, 2 and 3 sliders Up / down and Left / right.|“Reset lines” puts them back.','move line top bottom main line individually offset']},
{id:'kinetic',c:'style',g:{p:'style',s:{style:'transform'},t:'Kinetické rozložení'},
 cs:['Kinetické rozložení (řádky do stran)','Styl → 3D a tvar → posuvník „Kinetické rozložení“.|Horní řádek jede doleva, spodní doprava nebo doleva.','kinetické rozložení řádky do stran posun řádků kinetic'],
 en:['Kinetic layout (lines sideways)','Style → 3D & shape → slider “Kinetic layout”.|Top line moves left, bottom line right or left.','kinetic layout lines sideways shift lines']},
{id:'align',c:'style',g:{p:'style',s:{style:'transform'},t:'Kaskáda'},
 cs:['Zarovnání (střed, vlevo, kaskáda…)','Styl → 3D a tvar.|Vyber Šikmo / Kaskáda / Na střed / Vlevo / Vpravo.','zarovnání střed vlevo vpravo kaskáda šikmo rozložení'],
 en:['Alignment (centre, left, cascade…)','Style → 3D & shape.|Choose Diagonal / Cascade / Centre / Left / Right.','alignment centre center left right cascade diagonal layout']},
{id:'rotate',c:'style',g:{p:'style',s:{style:'transform'},t:'Rotace'},
 cs:['Rotace a síla perspektivy','Styl → 3D a tvar → „Rotace“ a „Síla perspektivy“.','rotace otočit natočit perspektiva'],
 en:['Rotation and perspective strength','Style → 3D & shape → “Rotation” and “Perspective strength”.','rotation rotate turn perspective']},
{id:'pos',c:'style',g:{p:'style',s:{style:'transform'},t:'Pozice svisle'},
 cs:['Výška titulků na videu','Styl → 3D a tvar → „Pozice svisle“ a „Pozice vodorovně“.|Nebo titulek posuň prstem na videu.','pozice výška výš níž nahoru dolů umístění titulků'],
 en:['Caption height on the video','Style → 3D & shape → “Vertical position” and “Horizontal position”.|Or move the caption with your finger on the video.','position height higher lower up down placement']},
// ---------- POHYB ----------
{id:'enter',c:'motion',g:{p:'motion',s:{motion:'in'}},
 cs:['Animace příjezdu slov','Pohyb → Příjezd.|Po jednom slově, celý řádek nebo celý titulek.|Odkud přijíždí, dojezd, délka a vzdálenost.','animace příjezd nástup slova přijíždí zdola po slově pohyb'],
 en:['Word entrance animation','Motion → Entrance.|Word by word, whole line or whole caption.|Direction, easing, duration and distance.','animation entrance appear words fly in from below word by word motion']},
{id:'anim',c:'motion',g:{p:'motion',s:{motion:'in'},t:'Animace nástupu'},
 cs:['Animace nástupu (Pop, Squish, Rozostření…)','Pohyb → Příjezd → „Animace nástupu“.|Prolnutí slov, Plynulý blok, Squish, Pop, Rozostření, Jemně, Prolnutí.','pop squish rozostření blur animace nástupu efekt objevení'],
 en:['Appear animation (Pop, Squish, Blur…)','Motion → Entrance → “Appear animation”.|Word fade, Smooth block, Squish, Pop, Blur, Soft, Fade.','pop squish blur appear animation effect']},
{id:'exit',c:'motion',g:{p:'motion',s:{motion:'out'}},
 cs:['Animace odchodu','Pohyb → Odchod.|Rychlé zmenšení, Jemné zhasnutí nebo Flicker.','odchod zmizení konec titulku animace odchodu mizí'],
 en:['Exit animation','Motion → Exit.|Fast shrink, Soft fade or Flicker.','exit disappear end of caption exit animation vanish']},
{id:'shine',c:'motion',g:{p:'motion',s:{motion:'fx'},t:'Shine – světlo přejede přes hlavní slovo'},
 cs:['Shine (světlo přejede přes slovo)','Pohyb → Efekty → zapni „Shine“.|Vyber, u kterých slov, a rychlost lesku.|Jde dát jen na vybraný titulek („Jen tento titulek“).','shine lesk světlo přejede odlesk záblesk na slově'],
 en:['Shine (light sweeps over the word)','Motion → Effects → turn on “Shine”.|Choose which words and the shine speed.|Can be set for one caption only (“Only this caption”).','shine gloss light sweep flash on word']},
{id:'fx',c:'motion',g:{p:'motion',s:{motion:'fx'},t:'Flicker – problikne při nástupu'},
 cs:['Flicker, Shake a Wiggle titulků','Pohyb → Efekty.|Flicker = problikne, Shake = zatřese, Wiggle = jemné vlnění.|Sílu nastavíš posuvníkem.','flicker shake wiggle problikne zatřese vlnění efekty titulků'],
 en:['Caption flicker, shake and wiggle','Motion → Effects.|Flicker = blinks, Shake = shakes, Wiggle = gentle wave.|Set the strength with the slider.','flicker shake wiggle blink wave caption effects']},
// ---------- VIDEO ----------
{id:'cut',c:'video',g:{tool:'#cutBtn'},
 cs:['Rozstřihnout video','Dej přehrávací hlavu na místo střihu.|Pod timeline klepni na „Střih videa“.|Kus, který nechceš, vyber a smaž košem.','střih rozstřihnout video stříhat nůžky cut rozdělit video'],
 en:['Cut the video','Put the playhead where you want to cut.|Below the timeline tap “Cut video”.|Select the part you don’t want and delete it with the trash can.','cut split video scissors trim']},
{id:'trim',c:'video',g:{tool:'#trV'},
 cs:['Zkrátit začátek nebo konec videa','Klepni na úsek videa na timeline.|Táhni za jeho levý nebo pravý okraj.','zkrátit začátek konec oříznout video délka videa trim'],
 en:['Trim the start or end of the video','Tap the video segment on the timeline.|Drag its left or right edge.','trim start end shorten video length']},
{id:'delclip',c:'video',g:{tool:'#delBtn'},
 cs:['Smazat kus videa','Rozstřihni video na začátku a na konci kusu.|Klepni na ten úsek na timeline.|Klepni na koš nad timeline.','smazat kus videa vystřihnout odstranit úsek klip pryč'],
 en:['Delete part of the video','Cut the video at the start and end of the part.|Tap that segment on the timeline.|Tap the trash can above the timeline.','delete part of video remove segment clip']},
{id:'silence',c:'video',g:{tool:'#trV',q:'.dz'},
 cs:['Vystřihnout tichá místa','Fialový pruh u stopy videa = tady se nemluví.|Klepni na něj a pak na koš – místo se vystřihne.','ticho tichá místa pauzy mezery vystřihnout nemluví fialový pruh'],
 en:['Cut out silent parts','A purple bar on the video track = nobody speaks here.|Tap it, then the trash can – the part is cut out.','silence silent parts pauses gaps cut nobody speaks purple bar']},
{id:'addclip',c:'video',g:{tool:'#clipAdd'},
 cs:['Vložit další klip','Dej přehrávací hlavu, kam má klip přijít (konec = za video).|Klepni na „+“ vlevo na timeline a vyber video.','vložit klip přidat video další video spojit videa plus'],
 en:['Insert another clip','Put the playhead where the clip should go (end = after the video).|Tap “+” on the left of the timeline and pick a video.','insert clip add video another video join videos plus']},
{id:'trans',c:'video',g:{tool:'#trV',q:'.vtr'},
 cs:['Přechod mezi klipy','Rozstřihni video nebo vlož další klip.|Klepni na značku přechodu na střihu (na stopě videa).|Vyber přechod, délku a směr. „Tenhle přechod na všechny střihy“ ho dá všude.','přechod přidat přechod transition warp tunel propad plátna zahoupání blesk záblesk mezi klipy'],
 en:['Transition between clips','Cut the video or insert another clip.|Tap the transition mark on the cut (on the video track).|Pick a transition, duration and direction. “This transition on all cuts” applies it everywhere.','transition add transition warp tunnel push swing flash between clips']},
{id:'trsnd',c:'video',g:{tool:'#trV',q:'.vtr'},
 cs:['Zvuk přechodu','Klepni na značku přechodu.|„Zvuk přechodu“ zapne/vypne zvuk, posuvníky mění hlasitost.|„Nahrát zvuk přechodu“ dá tvůj vlastní zvuk.','zvuk přechodu swoosh hlasitost přechodu vlastní zvuk nahrát'],
 en:['Transition sound','Tap the transition mark.|“Transition sound” turns it on/off; sliders change the volume.|“Upload transition sound” uses your own sound.','transition sound swoosh volume own sound upload']},
{id:'speed',c:'video',g:{tool:'#trV',q:'#trV .vb'},
 cs:['Zpomalit nebo zrychlit klip (slow motion)','Klepni na úsek videa na timeline.|Vyber rychlost 0,25× až 2×.|Pro plynulé zpomalení zvol „Prolínání snímků“ nebo „Optical flow“.','zpomalit zrychlit slow motion rychlost klipu zpomalení'],
 en:['Slow down or speed up a clip (slow motion)','Tap the video segment on the timeline.|Choose a speed from 0.25× to 2×.|For smooth slow motion pick “Frame blending” or “Optical flow”.','slow down speed up slow motion clip speed']},
{id:'clipvol',c:'video',g:{tool:'#trV',q:'#trV .vb'},
 cs:['Hlasitost klipu','Klepni na úsek videa.|Posuvník „Hlasitost klipu“.','hlasitost klipu zesílit ztišit hlasitější tišší'],
 en:['Clip volume','Tap the video segment.|Slider “Clip volume”.','clip volume louder quieter']},
{id:'zoomv',c:'video',g:{tool:'#kfTop'},
 cs:['Přiblížit nebo posunout video (klíčové body)','Nad timeline klepni na tlačítko klíčového bodu.|Na videu dvěma prsty přibliž a posuň.|Další bod jinde ve videu = plynulý pohyb kamery mezi body.','přiblížit zoom posunout video klíčový bod kamera pohyb keyframe'],
 en:['Zoom or move the video (keyframes)','Above the timeline tap the keyframe button.|On the video pinch and drag with two fingers.|Another keyframe elsewhere = smooth camera move between them.','zoom move video keyframe camera movement']},
{id:'grade',c:'video',g:{tool:'#colorBtn'},
 cs:['Barvy videa (filtry, looky)','Pod timeline klepni na „Barvy“.|Vyber look a nastav sílu filtru.','barvy videa filtr look sytější teplé kino barevné korekce'],
 en:['Video colours (filters, looks)','Below the timeline tap “Colours”.|Pick a look and set the filter strength.','video colours filter look saturated warm cinema colour grading']},
{id:'shake',c:'video',g:{tool:'#fxShake'},
 cs:['Houpavý shake videa','Dej přehrávací hlavu na místo.|Pod timeline klepni na „Shake“.|Nastav sílu, délku a zvuk.','shake otřes zatřesení houpnutí video efekt'],
 en:['Swinging video shake','Put the playhead in place.|Below the timeline tap “Shake”.|Set strength, duration and sound.','shake swing video effect']},
{id:'fs',c:'video',g:{tool:'#fsBtn'},
 cs:['Velký náhled','Klepni na tlačítko velkého náhledu vpravo nad timeline.|Zpět „Zavřít velký náhled“.','velký náhled celá obrazovka fullscreen zvětšit náhled'],
 en:['Large preview','Tap the large preview button on the right above the timeline.|Back with “Close large preview”.','large preview full screen fullscreen bigger preview']},
{id:'undo',c:'video',g:{tool:'#undoBtn'},
 cs:['Vrátit krok zpět','Šipka Zpět nad timeline vrátí poslední změnu.|Šipka vedle ji vrátí znovu.','zpět vrátit undo omyl krok zpět znovu'],
 en:['Undo a step','The back arrow above the timeline undoes the last change.|The arrow next to it redoes it.','undo back mistake step redo']},
{id:'layers',c:'video',g:{tool:'#layersBtn'},
 cs:['Pořadí vrstev','Nad timeline klepni na „Vrstvy“.|Přetáhni vrstvy prstem do pořadí.','vrstvy pořadí vrstev nahoře dole překrytí vepředu vzadu'],
 en:['Layer order','Above the timeline tap “Layers”.|Drag the layers into order.','layers order top bottom overlap front back']},
{id:'tlzoom',c:'video',g:{tool:'#tlZoom'},
 cs:['Přiblížit timeline','Roztáhni dvěma prsty na timeline.|Nebo posuvník s lupou pod timeline.','přiblížit timeline zoom timeline podrobněji jemně'],
 en:['Zoom the timeline','Pinch with two fingers on the timeline.|Or the magnifier slider below the timeline.','zoom timeline closer detail']},
{id:'tlsize',c:'video',g:{tool:'#grab'},
 cs:['Zvětšit timeline nebo nabídku','Táhni malou lištou nad nabídkou nahoru nebo dolů.|Nebo na ni klepni.','zvětšit timeline zvětšit nabídku víc místa lišta úchyt'],
 en:['Make the timeline or menu bigger','Drag the small handle above the menu up or down.|Or tap it.','bigger timeline bigger menu more space handle']},
// ---------- ZVUK ----------
{id:'music',c:'sound',g:{tool:'#audAdd'},
 cs:['Přidat hudbu nebo zvuk ze zařízení','Pod timeline klepni na „Zvuk“ a vyber soubor.|Nastav hlasitost a „Začít v místě hlavy“.','hudba muzika přidat zvuk písnička mp3 podkres ze zařízení'],
 en:['Add music or sound from your device','Below the timeline tap “Sound” and pick a file.|Set the volume and “Start at playhead”.','music add sound song mp3 background from device']},
{id:'mute',c:'sound',g:{tool:'#muteBtn'},
 cs:['Vypnout zvuk videa','Pod timeline klepni na „Zvuk videa“.|Červené tlačítko = zvuk je vypnutý.','vypnout zvuk ztlumit mute bez zvuku zvuk videa'],
 en:['Turn off the video sound','Below the timeline tap “Video sound”.|Red button = sound is off.','turn off sound mute no sound video sound']},
{id:'sfx',c:'sound',g:{p:'sfx'},
 cs:['Zvukové efekty u slov (SFX)','Otevři nabídku SFX.|Vyber zvuk, který zazní u slov (Swoosh, Pop, Tik…).|Nastav hlasitost.','zvukové efekty sfx zvuk u slov swoosh pop klik'],
 en:['Sound effects on words (SFX)','Open the SFX menu.|Pick a sound that plays with words (Swoosh, Pop, Tick…).|Set the volume.','sound effects sfx sound on words swoosh pop click']},
{id:'sfxvol',c:'sound',g:{p:'sfx',t:'Hlasitost přechodů'},
 cs:['Ztišit zvukové efekty','Nabídka SFX.|Posuvníky hlasitosti: shine, swooshe ve 3D mixu, přechody.','ztišit efekty hlasitost efektů moc nahlas zeslabit'],
 en:['Make sound effects quieter','SFX menu.|Volume sliders: shine, 3D mix swooshes, transitions.','quieter effects effect volume too loud lower']},
// ---------- EFEKTY ----------
{id:'maskai',c:'fx',g:{p:'obj',q:'#objNew'},
 cs:['Maska: vybrat objekt (AI)','Otevři nabídku Maska → „AI objekt“.|Klepni na člověka, auto, míč… AI vybere přesný tvar.|AI ho najde v každém snímku. Pak zvolíš shine, ztmavení okolí nebo výplň.','maska objekt vybrat označit ai výběr zvýraznit objekt shine na objekt'],
 en:['Mask: select an object (AI)','Open the Mask menu → “AI object”.|Tap a person, car, ball… the AI selects its exact shape.|The AI finds it in every frame. Then choose shine, dim surroundings or fill.','mask object select mark ai selection highlight object shine on object']},
{id:'maskplot',c:'fx',g:{p:'obj',q:'#objPlot'},
 cs:['Maska pozemku (body ručně)','Maska → „Pozemek“.|Ve zvětšeném snímku naklikej body, dvěma prsty přibližuješ.|Body se spojí a sledují se v čase.','pozemek parcela body ručně obrys nakreslit čáry hranice'],
 en:['Plot mask (manual points)','Mask → “Plot”.|Tap points in the enlarged frame; pinch to zoom.|Points connect and are tracked over time.','plot land points manual outline draw lines border']},
{id:'masktime',c:'fx',g:{tool:'#trX'},
 cs:['Kdy se maska objeví a zmizí','Maska je na timeline jako vrstva.|Zkrať ji tažením za okraje. Objevení a zmizení je plynulé.','maska objeví zmizí délka masky vrstva masky čas'],
 en:['When the mask appears and disappears','The mask is a layer on the timeline.|Shorten it by dragging the edges. It fades in and out smoothly.','mask appear disappear mask duration mask layer time']},
{id:'track',c:'fx',g:{p:'captions',q:'#trkStart'},
 cs:['Titulek sleduje obličej nebo objekt (tracking)','Vyber titulek.|Titulky → „Sledovat objekt (tracking)“, nebo Tracking v dolní liště.|Klepni na to, co se má sledovat, a dej „Sledovat“.','tracking sledovat obličej objekt titulek jede s hlavou přilepit'],
 en:['Caption follows a face or object (tracking)','Select a caption.|Captions → “Track object”, or Tracking in the bottom bar.|Tap what should be followed and tap “Track”.','tracking follow face object caption moves with head stick']},
{id:'stab',c:'fx',g:{p:'re',q:'#reOn'},
 cs:['Stabilizace na obličej (obličej uprostřed)','Otevři Stabilizace → „Zapnout stabilizaci“.|Zamčeno = obličej přesně uprostřed, Plynule = kamera jemně dohání.|Nastav přiblížení a výšku obličeje.','stabilizace obličej uprostřed klepe se třese roztřesené video zamknout'],
 en:['Face stabilisation (face in the centre)','Open Stabilisation → “Turn on stabilisation”.|Locked = face exactly centred, Smooth = camera gently follows.|Set the zoom and face height.','stabilisation stabilization face centre shaky video lock']},
{id:'behind',c:'fx',g:{p:'ai',t:'Za celou postavou'},
 cs:['Text za postavou','Nabídka AI → „Za celou postavou“.|Appka najde postavu v každém snímku a titulky dá za ni.','text za postavou za člověkem za tělem celá postava behind'],
 en:['Text behind the person','AI menu → “Behind the whole person”.|The app finds the person in every frame and puts captions behind.','text behind person behind head behind body']},
{id:'reality',c:'fx',g:{p:'reality',q:'#rlOn'},
 cs:['Reality mód (titulky za hlavou a na hrudi)','Otevři Reality → „Zapnout Reality“.|Počkej, než appka projde video (okno s procenty).|Barvy a rozmístění pak mícháš ve stejné nabídce.','reality real estate realitní mód text za hlavu za hlavou hlava na hrudi styl reality'],
 en:['Reality mode (captions behind the head and on the chest)','Open Reality → “Turn on Reality”.|Wait while the app analyses the video (window with percent).|Mix colours and layout in the same menu.','reality real estate mode behind head on chest']},
{id:'mix',c:'fx',g:{p:'mix',q:'#mixOn'},
 cs:['3D mix titulky','Otevři 3D mix → „Zapnout 3D mix“.|„Zamíchat znovu“ dá jiné rozložení a písma.','3d mix titulky mix písma náhodné rozložení zamíchat'],
 en:['3D mix captions','Open 3D mix → “Turn on 3D mix”.|“Shuffle again” gives another layout and fonts.','3d mix captions mixed fonts random layout shuffle']},
{id:'overlay',c:'fx',g:{p:'overlay',q:'#ovImg'},
 cs:['Přidat obrázek nebo video přes video (overlay)','Overlay → „Přidat obrázek / video“.|Prstem posuň a zvětši.|Nastav animaci, wiggle, zvuk a rychlost.','overlay obrázek přes video vložit fotku logo nálepka video přes video'],
 en:['Add an image or video over the video (overlay)','Overlay → “Add image / video”.|Move and resize with your finger.|Set animation, wiggle, sound and speed.','overlay image over video insert photo logo sticker picture in picture']},
{id:'ovtrack',c:'fx',g:{p:'overlay'},
 cs:['Overlay sleduje objekt','Vyber overlay na timeline.|Klepni na Tracking a vyber, co má sledovat.','overlay sleduje tracking obrázek jede s objektem'],
 en:['Overlay follows an object','Select the overlay on the timeline.|Tap Tracking and choose what it should follow.','overlay follows tracking image moves with object']},
{id:'ovfull',c:'fx',g:{p:'overlay',q:'#ovFull'},
 cs:['Překrýt video novou verzí','Dej přehrávací hlavu na místo.|Overlay → „Překrýt video novou verzí“.','překrýt video nová verze nahradit záběr jiný záběr'],
 en:['Cover the video with a new version','Put the playhead in place.|Overlay → “Cover video with new version”.','cover video new version replace shot other shot']},
{id:'tiltm',c:'fx',g:{p:'ai',q:'#aiTilt'},
 cs:['Sladit náklon titulků se scénou','Nabídka AI → „Sladit náklon všech titulků se scénou“.','sladit náklon scéna perspektiva automaticky naklonit podle videa'],
 en:['Match caption tilt to the scene','AI menu → “Match tilt of all captions to scene”.','match tilt scene perspective automatic']},
// ---------- EXPORT ----------
{id:'export',c:'export',g:{tool:'#exportBtn'},
 cs:['Uložit video (export)','Vpravo nahoře klepni na „Export“.|Klepni na „Exportovat“ a počkej.|Klepni na „Uložit video“.','export uložit video stáhnout hotové video render vyexportovat galerie'],
 en:['Save the video (export)','Tap “Export” at the top right.|Tap “Export” and wait.|Tap “Save video”.','export save video download finished video render gallery']},
{id:'fps',c:'export',g:{tool:'#exportBtn'},
 cs:['Plynulost exportu (60 fps)','Export → Nastavení exportu → Snímková frekvence.|Doporučeno: „60 fps – plynulé titulky, video 30“.','fps plynulost 60 fps 30 fps snímky trhané zasekané export plynulý'],
 en:['Export smoothness (60 fps)','Export → Export settings → Frame rate.|Recommended: “60 fps – smooth captions, video 30”.','fps smoothness 60 fps 30 fps frames choppy stutter smooth export']},
{id:'quality',c:'export',g:{tool:'#quality'},
 cs:['Kvalita a rozlišení exportu','Vlevo od Exportu vyber 1080p, Původní kvalitu nebo 720p.|V okně Exportu je i kvalita souboru.','kvalita rozlišení 1080p 4k ostré velikost souboru export'],
 en:['Export quality and resolution','Left of Export choose 1080p, Original quality or 720p.|The Export window also has file quality.','quality resolution 1080p 4k sharp file size export']},
{id:'transp',c:'export',g:{tool:'#exportBtn'},
 cs:['Jen titulky (průhledné pozadí)','Export → „Jen titulky (průhledné)“.|Hodí se pro další střih v jiném programu.','jen titulky průhledné pozadí bez videa alfa kanál'],
 en:['Captions only (transparent background)','Export → “Captions only (transparent)”.|Useful for editing in another program.','captions only transparent background without video alpha']},
];

const CAT={ start:['Začátek','Getting started'], cap:['Titulky','Captions'], style:['Vzhled','Look'], motion:['Pohyb','Motion'], video:['Video a střih','Video & editing'], sound:['Zvuk','Sound'], fx:['Maska, tracking, Reality','Mask, tracking, Reality'], export:['Export a PRO','Export & PRO'] };
const TOP=['new','edit','tpl','trans','cut','music','export','reality','maskai','track'];
const L=(window.I18N && I18N.lang==='cs') ? 'cs' : 'en', LI=L==='cs'?0:1;
const T={ title:['Rádce','Helper'], ph:['Napiš, co chceš udělat…','Type what you want to do…'], top:['Nejčastější otázky','Most asked'], here:['Tipy k této nabídce','Tips for this menu'],
  none:['Tohle jsem nenašel. Zkus to napsat jinými slovy, nebo projdi témata níž.','I couldn’t find that. Try other words, or browse the topics below.'],
  show:['Ukázat mi','Show me'], cats:['Témata','Topics'], back:['Zpět','Back'], close:['Zavřít','Close'],
  openVid:['Nejdřív otevři video: klepni na „Nové video“, nebo na projekt dole.','First open a video: tap “New video” or a project below.'],
  closeEd:['Tohle je na úvodní obrazovce. Klepni na křížek vlevo nahoře – projekt se uloží.','This is on the start screen. Tap the cross at the top left – the project is saved.'],
  noSel:['Tohle se objeví, až to bude na timeline. Nejdřív udělej první krok.','This appears once it is on the timeline. Do the first step first.'] };
const $=id=>document.getElementById(id);

// ---------- hledání (bez diakritiky, s tvary slov a synonymy) ----------
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const STOP=new Set(norm('jak jako se si na do v ve z ze a i k ke o u to ten ta tu mi me mě chci chtěl potřebuju můžu muzu jde dá dát dat udělat udelat kde je jsou co aby pro po při od s the how to a an do i can where is my of in on for with make it this that want need please').split(' '));
// skupiny slov se stejným významem (kmeny bez diakritiky)
const SYN=[['smaz','odstran','vymaz','delet','remov','kos','trash','pryc','zbav'],['titul','caption','subtit','napis','popis'],['barv','color','colour','odstin'],['pism','font','typeface'],['prechod','transit'],['zvuk','sound','audio','hudb','music','muzik','sfx','pisnick','song'],['zvets','priblíz','pribliz','zoom','vets','bigger','enlarg'],['posun','presun','move','drag'],['stin','shadow'],['lesk','shine','glos','zar','glow','svit','odlesk'],['zpomal','slow','rychl','speed','zrychl'],['export','uloz','stahn','save','download','render'],['jazyk','languag','anglic','englis','cestin','czech'],['vodoznak','watermark','logo'],['predplat','pro','zaplat','subscri','pay','cena','price','koup','buy'],['mask','objekt','object','vyber','select','oznac'],['sled','track','follow'],['stabil','klep','tres','shak'],['oblic','face','tvar','hlav','head'],['postav','person','clovek','behind'],['3d','trojrozm'],['animac','pohyb','motion','animat','prijezd','nastup','entranc','appear'],['odchod','exit','zmiz','disappear'],['vrstv','layer'],['rozdel','rozstrih','split','cut','strih','nuzk'],['vrat','zpet','undo'],['klip','clip','usek','segment','video'],['vloz','prid','add','insert','nahr','upload'],['tich','silenc','pauz','nemluv'],['velik','size','mensi','smaller'],['zvyrazn','highlight','hlavni','main','emph'],['oprav','uprav','edit','fix','zmen','chang','preps'],['skryt','hide','schov'],['projekt','project','rozdelan']];
const stem=w=>w.length>6?w.slice(0,Math.max(5,w.length-3)):w;
function expand(tok){ const out=new Set([tok,stem(tok)]); for (const g of SYN) if (g.some(s=>tok.startsWith(s)||(s.length>=4&&s.startsWith(tok)&&tok.length>=4))) g.forEach(s=>out.add(s)); return [...out]; }
function lev1(a,b){ if (Math.abs(a.length-b.length)>1) return false; let i=0,j=0,e=0; while(i<a.length&&j<b.length){ if (a[i]===b[j]){i++;j++;continue;} if (++e>1) return false; if (a.length>b.length) i++; else if (b.length>a.length) j++; else {i++;j++;} } return e+(a.length-i)+(b.length-j)<=1; }
const IDX=KB.map(k=>{ const f=(arr,w)=>norm(arr.join(' ')).split(' ').filter(Boolean).map(x=>[x,w]);
  return { k, words:[...f([k.cs[0],k.en[0]],3),...f([k.cs[2],k.en[2]],2),...f([k.cs[1],k.en[1]],1)] }; });
function search(q){
  const toks=norm(q).split(' ').filter(t=>t && !STOP.has(t)); if (!toks.length) return [];
  const res=[];
  for (const it of IDX){ let sc=0, hit=0;
    for (const t of toks){ const st=stem(t), ex=expand(t).filter(x=>x!==t&&x!==st); let best=0;
      for (const [w,wt] of it.words){
        let m=0;
        if (w===t) m=1.5;                                                        // přesně to slovo
        else if (t.length>=3 && (w.startsWith(st)||(w.length>=4&&t.startsWith(w)&&t.length-w.length<=3))) m=1;   // jiný tvar slova
        else if (ex.some(x=>x.length<=3 ? w===x : (w.startsWith(x)||(w.length>=4&&x.startsWith(w)&&x.length-w.length<=3)))) m=0.75;   // synonymum
        else if (t.length>=4 && w.length>=4 && lev1(t,w)) m=0.5;                 // překlep
        if (m*wt>best) best=m*wt; }
      if (best){ sc+=best; hit++; } }
    if (hit) res.push([sc*(hit===toks.length?1.6:1)+hit, it.k]); }
  return res.sort((a,b)=>b[0]-a[0]).filter((r,i,a)=>r[0]>=a[0][0]*0.5).slice(0,8).map(r=>r[1]);
}

// ---------- vzhled ----------
const css=`
.rd-btn{position:relative;width:38px;height:38px;border-radius:50%;padding:0;border:1px solid var(--line);background:var(--card);flex:none;display:grid;place-items:center;overflow:visible;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .08s}
.rd-btn:active{transform:scale(.9)}
.etop .qsel{min-width:0;width:0;text-overflow:ellipsis}
.rd-btn{border-radius:50% !important;width:34px !important;height:34px !important}
.rd-btn img{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:50% 20%;pointer-events:none}
.rd-btn i{position:absolute;right:-3px;top:-3px;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#10b981);color:#fff;font:800 11px/16px system-ui;font-style:normal;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.mascot.rd-m{pointer-events:auto;cursor:pointer}
.rd-hero{position:absolute;right:12px;top:6px;z-index:2;display:flex;align-items:center;gap:5px;border:0;border-radius:999px;padding:5px 10px 5px 5px;background:linear-gradient(135deg,#2563eb,#10b981);color:#fff;font:700 13px/1 system-ui,-apple-system,sans-serif;box-shadow:0 4px 12px rgba(37,99,235,.35);cursor:pointer;touch-action:manipulation;transition:transform .08s}
.rd-hero:active{transform:scale(.92)}
.rd-hero i{width:20px;height:20px;border-radius:50%;background:#fff;color:#2563eb;font-style:normal;font-weight:800;display:grid;place-items:center}
.rd-hero[hidden]{display:none}
#sheetHelp .sh{gap:10px;min-height:62vh}
.rd-h{display:flex;align-items:center;gap:10px}
.rd-h img{width:44px;height:44px;object-fit:contain}
.rd-h b{font-size:18px;flex:1}
.rd-q{width:100%;font-size:16px;padding:12px 14px;border-radius:14px}
.rd-l{display:flex;flex-direction:column;gap:8px}
.rd-sec{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.55;margin-top:4px}
.rd-it{border:1px solid var(--line);border-radius:14px;padding:11px 13px;background:var(--bg);cursor:pointer;touch-action:manipulation;transition:transform .08s,background .08s}
.rd-it:active{transform:scale(.985)}
.rd-it>b{display:block;font-size:15px}
.rd-it ol{margin:8px 0 2px;padding-left:20px;font-size:14px;line-height:1.45;display:none}
.rd-it.open ol{display:block}
.rd-it .btn{display:none;margin-top:8px;width:100%}
.rd-it.open .btn{display:flex;justify-content:center}
.rd-cats{display:flex;flex-wrap:wrap;gap:6px}
.rd-cats .chip{cursor:pointer}
.rd-none{font-size:14px;opacity:.75;padding:4px 2px}
.rd-hl{position:relative;animation:rdPulse 1.1s ease-in-out 4;outline:3px solid #10b981 !important;outline-offset:2px;border-radius:10px;z-index:5}
@keyframes rdPulse{0%,100%{outline-color:#10b981;box-shadow:0 0 0 0 rgba(16,185,129,.55)}50%{outline-color:#2563eb;box-shadow:0 0 0 10px rgba(37,99,235,0)}}
.rd-bub{position:fixed;left:10px;right:10px;top:calc(56px + env(safe-area-inset-top));z-index:70;display:flex;gap:10px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:600px;margin:0 auto;animation:rdIn .16s ease-out}
.rd-bub img{width:34px;height:34px;object-fit:contain;flex:none}
.rd-bt{flex:1;min-width:0}
.rd-bub ol{margin:0;padding-left:18px;font-size:13.5px;line-height:1.4;flex:1}
.rd-bub p{margin:0 0 4px;font-weight:600;font-size:13.5px;line-height:1.4;flex:1}
.rd-bub button{border:0;background:none;font-size:20px;line-height:1;padding:2px 4px;color:inherit;opacity:.6;cursor:pointer}
@keyframes rdIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.rd-hl{animation:none}.rd-bub{animation:none}}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mkBtn=()=>{ const b=document.createElement('button'); b.className='rd-btn'; b.type='button'; b.setAttribute('data-notr',''); b.setAttribute('aria-label',T.title[LI]); b.title=T.title[LI]; b.innerHTML='<img src="maskot-head.png" alt=""><i>?</i>'; b.addEventListener('click',open); return b; };

// okno rádce
const sh=document.createElement('div'); sh.className='sheet'; sh.id='sheetHelp'; sh.setAttribute('data-notr','');
sh.innerHTML=`<div class="sh"><div class="rd-h"><img src="maskot.png" alt=""><b>${T.title[LI]}</b><button class="ico" data-close aria-label="${T.close[LI]}"><svg class="ic"><use href="#i-x"/></svg></button></div>
<input class="inp rd-q" id="rdQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(T.ph[LI])}"><div class="rd-l" id="rdL"></div></div>`;
document.body.appendChild(sh);
sh.addEventListener('click',e=>{ if (e.target===sh||e.target.closest('[data-close]')) sh.classList.remove('on'); });

function item(k,open){ const d=k[L]; return `<div class="rd-it${open?' open':''}" data-id="${k.id}"><b>${esc(d[0])}</b><ol>${d[1].split('|').map(s=>`<li>${esc(s)}</li>`).join('')}</ol><button class="btn primary small" data-show="${k.id}">${T.show[LI]}</button></div>`; }
const byId=id=>KB.find(k=>k.id===id);
let catSel=null;
function render(){
  const q=$('rdQ').value, L2=$('rdL'); let h='';
  if (q.trim()){ const r=search(q); h = r.length ? r.map((k,i)=>item(k,i===0)).join('') : `<div class="rd-none">${T.none[LI]}</div>`+cats(); }
  else if (catSel){ h=`<div class="rd-sec">${CAT[catSel][LI]}</div>`+KB.filter(k=>k.c===catSel).map(k=>item(k)).join('')+`<button class="btn small" id="rdBack">← ${T.back[LI]}</button>`; }
  else { const pn=window.__app&&__app.panel?__app.panel():null, here=pn?KB.filter(k=>k.g.p===pn):[];
    if (here.length) h+=`<div class="rd-sec">${T.here[LI]}</div>`+here.slice(0,5).map(k=>item(k)).join('');
    h+=`<div class="rd-sec">${T.top[LI]}</div>`+TOP.filter(id=>!here.some(k=>k.id===id)).map(id=>item(byId(id))).join('')+cats(); }
  L2.innerHTML=h;
}
function cats(){ return `<div class="rd-sec">${T.cats[LI]}</div><div class="rd-cats">${Object.keys(CAT).map(c=>`<div class="chip" data-cat="${c}">${CAT[c][LI]}</div>`).join('')}</div>`; }
$('rdL').addEventListener('click',e=>{
  const s=e.target.closest('[data-show]'); if (s){ e.stopPropagation(); go(byId(s.dataset.show)); return; }
  const c=e.target.closest('[data-cat]'); if (c){ catSel=c.dataset.cat; $('rdQ').value=''; render(); $('rdL').scrollTop=0; return; }
  if (e.target.closest('#rdBack')){ catSel=null; render(); return; }
  const it=e.target.closest('.rd-it'); if (it){ const was=it.classList.contains('open'); $('rdL').querySelectorAll('.rd-it.open').forEach(x=>x.classList.remove('open')); if (!was) it.classList.add('open'); }
});
let qT=0; $('rdQ').addEventListener('input',()=>{ catSel=null; clearTimeout(qT); qT=setTimeout(render,60); });
$('rdQ').addEventListener('keydown',e=>{ if (e.key==='Enter'){ const f=$('rdL').querySelector('[data-show]'); if (f) f.click(); } });
function open(){ if (bub){ bub.remove(); bub=null; } clearHl(); catSel=null; $('rdQ').value=''; render(); sh.classList.add('on'); }

// ---------- „Ukázat mi“: přenese na místo a rozbliká, na co klepnout ----------
let bub=null, hlEl=null, hlT=0;
function clearHl(){ if (hlEl){ hlEl.classList.remove('rd-hl'); hlEl=null; } clearTimeout(hlT); }
function bubble(html){ if (bub) bub.remove(); bub=document.createElement('div'); bub.className='rd-bub'; bub.setAttribute('data-notr','');
  bub.innerHTML=`<img src="maskot-head.png" alt=""><div class="rd-bt">${html}</div><button aria-label="${T.close[LI]}">×</button>`; bub.querySelector('button').onclick=()=>{ bub.remove(); bub=null; clearHl(); }; document.body.appendChild(bub);
  clearTimeout(bubble._t); bubble._t=setTimeout(()=>{ if (bub){ bub.remove(); bub=null; } },14000); }
// posune jen nabídku / lištu, ve které prvek je (ne celou stránku – horní lišta musí zůstat vidět)
function reveal(el){ const r=el.getBoundingClientRect();
  for (let p=el.parentElement; p && p!==document.body; p=p.parentElement){ const cs=getComputedStyle(p), pr=p.getBoundingClientRect();
    if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight>p.clientHeight+2 && (r.top<pr.top || r.bottom>pr.bottom)) p.scrollTo({top:p.scrollTop+(r.top+r.height/2)-(pr.top+pr.height/2),behavior:'smooth'});
    if (/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth>p.clientWidth+2 && (r.left<pr.left || r.right>pr.right)) p.scrollTo({left:p.scrollLeft+(r.left+r.width/2)-(pr.left+pr.width/2),behavior:'smooth'}); } }
function pulse(el){ clearHl(); if (!el) return; hlEl=el; el.classList.remove('rd-hl'); void el.offsetWidth; el.classList.add('rd-hl');
  reveal(el);
  const off=()=>{ clearHl(); document.removeEventListener('pointerdown',off,true); }; setTimeout(()=>document.addEventListener('pointerdown',off,true),50); hlT=setTimeout(clearHl,9000); }
const vis=el=>el && el.getClientRects().length>0;
function byText(cz,root){ const want=norm(window.I18N?I18N.tr(cz):cz); if (!want) return null;
  const c=[...(root||document).querySelectorAll('#panel .row>span:first-child, #panel .clabel, #panel .lb>span:first-child, #panel b, #panel .chip, #panel button, #panel .sub>div')];
  const el=c.find(e=>norm(e.innerText).startsWith(want)) || c.find(e=>norm(e.innerText).includes(want)); if (!el) return null;
  if (el.matches('.lb>span')) return el.closest('label.ctl')||el;
  if (el.matches('.row>span')) return el.parentElement;
  if (el.matches('.clabel')) return el.nextElementSibling||el;
  return el; }
const steps=k=>`<ol>${k[L][1].split('|').map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`;
function go(k){
  sh.classList.remove('on'); const g=k.g, ed=$('editor')&&$('editor').classList.contains('on');
  if (g.home){ if (ed){ bubble(`<p>${esc(T.closeEd[LI])}</p>`); pulse($('closeBtn')); return; }
    const el=document.querySelector(g.home); bubble(steps(k)); pulse(vis(el)?el:null); return; }
  if (!ed){ bubble(`<p>${esc(T.openVid[LI])}</p>`); pulse(document.querySelector('#home label.btn.primary')); return; }
  if (g.p){ const b=document.querySelector(`#bnav button[data-p="${g.p}"]`); if (b && !b.classList.contains('on')) b.click(); else if (b && window.__app && __app.panel && __app.panel()!==g.p) b.click(); }
  if (g.s) for (const [n,v] of Object.entries(g.s)){ const d=document.querySelector(`#panel .sub[data-sub="${n}"] [data-v="${v}"]`); if (d && !d.classList.contains('on')) d.click(); }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    let el=null, note='';
    if (g.q){ el=document.querySelector(g.q); if (!vis(el)) el=null; }
    if (!el && g.t) el=byText(g.t);
    if (!el && g.tool){ el=document.querySelector(g.tool); if (!vis(el)) el=null; if (el && g.q) note=T.noSel[LI]; }
    if (!el && g.s){ const [n,v]=Object.entries(g.s)[0]; el=document.querySelector(`#panel .sub[data-sub="${n}"] [data-v="${v}"]`); }
    if (!el && g.p) el=document.querySelector(`#bnav button[data-p="${g.p}"]`);
    bubble((note?`<p>${esc(note)}</p>`:'')+steps(k));
    pulse(el);
  }));
}

// tlačítka rádce: v editoru vpravo nahoře (před výběrem kvality) a na úvodní obrazovce vedle jazyka
function mount(){
  const et=document.querySelector('#editor .etop'), q=$('quality'); if (et && !et.querySelector('.rd-btn')) et.insertBefore(mkBtn(), q||et.lastChild);
  // úvodní obrazovka: otazník u velkého panáčka (a panáček sám je klikací)
  const m=$('mascot'), hero=m&&m.parentElement;
  if (hero && !hero.querySelector('.rd-hero')){ const b=document.createElement('button'); b.type='button'; b.className='rd-hero'; b.setAttribute('data-notr',''); b.setAttribute('aria-label',T.title[LI]); b.innerHTML='<i>?</i><span>'+T.title[LI]+'</span>'; b.addEventListener('click',open); hero.appendChild(b);
    m.classList.add('rd-m'); m.addEventListener('click',open);
    const sync=()=>{ b.hidden=m.hidden; }; sync(); new MutationObserver(sync).observe(m,{attributes:true,attributeFilter:['hidden']}); }
}
if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
window.RADCE={ open, search, go:id=>go(byId(id)), KB };
})();
