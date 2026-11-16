/* EFEKTIVE Captions – kreslicí jádro (engine)
   Schválený vzhled v8 / Best Account zůstává 1:1, přidané funkce jsou volitelné.
   Vše je dostupné přes window.E */
"use strict";
(function(){
const E = window.E = {};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
E.clamp=clamp;
const SF='"Inter Tight", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif';
E.SF=SF;
const HAS_LS = typeof CanvasRenderingContext2D!=='undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
// šířka textu se staženým písmem (track v % velikosti písma) – stejná v každém prohlížeči
// písmena i s diakritikou jako jeden celek (u + kroužek = ů) – jinak by se háčky kreslily zvlášť
const GRAPH=/\P{M}\p{M}*/gu;
const chars=s=>String(s).normalize('NFC').match(GRAPH)||[];
function measureT(c,s,px,track){ if (HAS_LS) c.letterSpacing='0px'; s=String(s).normalize('NFC'); return c.measureText(s).width + (track/100)*px*Math.max(0,chars(s).length-1); }
E.measureT=measureT;
// kreslení se staženým písmem: nativně, nebo po znacích se zachovaným kerningem
function fillT(c,s,x,y,px,track){
  const tr=(track/100)*px; s=String(s).normalize('NFC');
  if (HAS_LS || !tr){ c.fillText(s,x,y); return; }
  const al=c.textAlign, tot=measureT(c,s,px,track); let x0 = al==='center' ? x-tot/2 : al==='right' ? x-tot : x;
  c.textAlign='left'; const ch=chars(s); let pre='';
  for (let i=0;i<ch.length;i++){ c.fillText(ch[i], x0 + c.measureText(pre).width + tr*i, y); pre+=ch[i]; }
  c.textAlign=al;
}
// začátek věty malým jen u běžných slov (jména zůstávají)
const COMMON_START = new Set(('a ale aby ani asi až by bych byl byla bylo bude budeme budete co což dnes do i já jak jaký jako je jen jenom jestli jo jsem jsme jste jsou již k kam kde kdo kdy když kolik má mám máme máte mají mě mi mít mně mu my na nebo ne není nic no o od on ona oni ono pak po pod pokud potom pro proč proto protože prostě přece při s se si stačí strašně sem tady tak taky také takže tam teď ten tento to toho tohle tom toto tu ty tyhle u už v vám vás ve vy z za že ahoj dobrý dneska hele heleďte podívejte víte vidíte uvidíte začněte sledujte pojďte přijďte zkuste chcete můžete nezapomeňte').split(' '));
const ROW_WORDS=[3,2,2]; // Base: horní max 3 slova, hlavní 2, spodní 2

// ================= STAV =================
E.words=[];      // {id, raw, t, s, e, em}
E.pages=[];      // {a,b,s,e,kin,lines?,own,key}
E.meta={};       // pageMeta podle id prvního slova: {own, so, eo}
E.zones=[];      // úseky bez titulků [{s,e,label}]
E.overlays=[];   // nálepky / obrázky přes video
E.face=null;     // stopa obličeje [{t, box:[x0,y0,x1,y1]}|null] po 0.1 s
E.flags={hidden:false, transparent:false, exporting:false, mute:false, pro:false};
// vodoznak pro verzi bez předplatného
const WM=new Image(); WM.src='logo-wm.png';
// závěrečný obrázek s logem EFEKTIVE na konci exportu (verze zdarma; s PRO se nepřidává)
E.OUTRO_SEC=1.6;
E.wantOutro=()=>false;   // závěr s logem už není – místo něj vodoznak přes celé video
E.drawOutro=(c,W,H,t)=>{
  const m=Math.min(W,H), ease=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
  c.save(); c.setTransform(1,0,0,1,0,0); c.globalAlpha=1; c.globalCompositeOperation='source-over'; c.shadowColor='transparent'; c.filter='none';
  c.fillStyle='#0a0d14'; c.fillRect(0,0,W,H);
  // značkové kuličky (modrá + zelená) v pozadí
  const orb=(x,y,r,col)=>{ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(10,13,20,0)'); c.fillStyle=g; c.fillRect(0,0,W,H); };
  orb(W*0.18,H*0.28,m*0.75,'rgba(31,77,255,.42)'); orb(W*0.85,H*0.78,m*0.7,'rgba(19,185,122,.35)');
  const a1=ease(t/0.45), a2=ease((t-0.18)/0.45);
  const lw=m*0.34*(0.86+0.14*a1), lh=WM.naturalWidth?lw*WM.naturalHeight/WM.naturalWidth:lw*0.736;
  const fs=Math.round(m*0.105), cy=H*0.46;
  c.globalAlpha=a1; if (WM.complete && WM.naturalWidth) c.drawImage(WM,(W-lw)/2,cy-lh-m*0.03,lw,lh);
  c.globalAlpha=a2; c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='top';
  c.font=`800 ${fs}px "Inter Tight","Schibsted Grotesk",Arial,sans-serif`; try{ c.letterSpacing=Math.round(fs*0.02)+'px'; }catch(e){}
  c.fillText('EFEKTIVE',W/2,cy+m*0.02);
  c.globalAlpha=a2*0.7; c.font=`600 ${Math.round(fs*0.32)}px "Inter Tight",Arial,sans-serif`; try{ c.letterSpacing=Math.round(fs*0.06)+'px'; }catch(e){}
  c.fillText('TITULKY · EFEKTIVE CAPTIONS',W/2,cy+m*0.02+fs*1.15);
  c.restore();
};
E.drawWatermark=(c,W,H)=>{
  // logo EFEKTIVE uprostřed přes celé video – jen ve výsledném videu (v editoru ne), s PRO vůbec
  if (E.flags.pro || !E.flags.exporting || !(WM.complete && WM.naturalWidth)) return;
  const m=Math.min(W,H), lw=m*0.55, lh=lw*WM.naturalHeight/WM.naturalWidth;
  c.save(); c.setTransform(1,0,0,1,0,0); c.globalCompositeOperation='source-over'; c.filter='none';
  c.globalAlpha=0.5; c.shadowColor='rgba(0,0,0,.35)'; c.shadowBlur=m*0.02; c.shadowOffsetY=m*0.004;
  c.drawImage(WM,(W-lw)/2,(H-lh)/2,lw,lh);
  c.restore();
};
let wid=1; E.newId=()=>wid++;
E.setWid=v=>{wid=Math.max(wid,v);};

// společný styl G
E.G = {
  size:88, wpp:4, maxLines:3, maxChars:0, posX:50, posY:66,
  cText:'#ffffff', cShadow:'#000000', c1:'#e4202c', c2:'#e4202c', c3:'#e4202c', c4:'#e4202c',
  grad:true, gA:'#ff9300', gB:'#fff200', gradDir:'v', altEvery:4, altA:'#8fe0ff', altB:'#0a62e6', altOn:false,
  negativ:false, shadowSize:25, shadowA:45, shadowDist:10, extrude:0, glow:30, glowMode:'always',
  fontMain:SF, wMain:500, mainItalic:false, fontEm:SF, wEm:900, emItalic:false,
  track:-4, gap:66, emScale:160, wordGap:160,
  tilt:18, tiltX:4, persp:60, tiltAlt:true, kinetic:45, kinDir:'opposite', opacity:100, rot:0, layout:'cascade', layerOrder:'natural',
  anim:'block', enter:'none', ease:'smooth', enterDur:35, fadeOut:true, wordByWord:true,
  fxShine:true, shineEvery:'3', shineSpeed:50, fxFlicker:false, fxShake:false, fxWiggle:false, wiggle:0,
  caseMain:'none', caseSec:'none', capMain3:true, punct:false, mainLine:'mid',
  behind:'off', faceAuto:true, faceDodgeX:false,
  sfx:'none', sfxVol:70, sfxWord:false, style:'base',
  // rozšíření (šablona Base): plnění řádků podle šířky, zúžení písma, přeliv vedlejších řádků, odchod celého bloku
  split:'words', rowMax:61, cond:100, trackEm:null, textGrad:false, cText2:'#d4d4d4', gradSpan:0.5, singleSec:false,
  exitScale:null, exitDur:0.3, wordLead:0.08, wordFade:0.28
};E.G0 = Object.assign({}, E.G);   // neutrální výchozí nastavení (pro starší projekty bez nových voleb)

// klíče, které jsou vždy společné pro celé video
E.GLOBAL_ONLY = new Set(['mixFx','mixShine','mixExtrude','mixSpeed','mix3d','mixSeed','mixSize','mixY','mixA','mixB','wpp','maxLines','maxChars','punct','sfxVol','sfxWord','wordByWord','faceAuto','altEvery','altOn','capMain3']);

// ================= FONTY (kompletní seznam jako v SA Captions) =================
// [rodina (CSS stack: Apple systémový font → webová náhrada), tloušťka, popisek, kurzíva]
const ST=(apple,web)=>`"${apple}", ${web}`;
E.FONTS = [
  [SF,400,'SF Pro Regular'],[SF,500,'SF Pro Medium'],[SF,600,'SF Pro Semibold'],[SF,700,'SF Pro Bold'],[SF,800,'SF Pro Heavy'],
  [ST('Helvetica Neue','Helvetica, Arial, "Inter"'),400,'Helvetica Regular'],[ST('Helvetica Neue','Helvetica, Arial, "Inter"'),700,'Helvetica Bold'],
  ['"Inter Tight"',900,'Inter Tight Black'],['"Inter Tight"',900,'Inter Tight Black Italic',true],
  ['"Inter Tight"',700,'Inter Tight Bold'],['"Inter Tight"',700,'Inter Tight Bold Italic',true],
  ['"Inter Tight"',300,'Inter Tight Light'],['"Inter Tight"',300,'Inter Tight Light Italic',true],['"Inter Tight"',500,'Inter Tight Medium'],
  ['"Inter"',900,'Inter Black'],['"Inter"',700,'Inter Bold'],['"Inter"',300,'Inter Light'],['"Inter"',400,'Inter Regular'],
  ['"Montserrat"',900,'Montserrat Black'],['"Montserrat"',900,'Montserrat Black Italic',true],['"Montserrat"',400,'Montserrat Regular'],
  ['"Poppins"',900,'Poppins Black'],['"Poppins"',700,'Poppins Bold'],['"Poppins"',900,'Poppins Black Italic',true],['"Poppins"',600,'Poppins SemiBold'],['"Poppins"',300,'Poppins Light'],
  ['"Roboto"',900,'Roboto Black'],['"Rubik"',900,'Rubik Black'],
  [ST('Avenir Next','"Nunito", "Inter"'),700,'Avenir Next Bold'],[ST('Avenir Next','"Nunito", "Inter"'),900,'Avenir Next Heavy'],[ST('Avenir Next','"Nunito", "Inter"'),500,'Avenir Next Medium'],[ST('Avenir Next','"Nunito", "Inter"'),400,'Avenir Next Regular'],
  [ST('Optima','Candara, "Inter"'),400,'Optima Regular'],[ST('Optima','Candara, "Inter"'),900,'Optima ExtraBlack'],
  [ST('Palatino','"Palatino Linotype", "Playfair Display"'),700,'Palatino Bold'],[ST('Palatino','"Palatino Linotype", "Playfair Display"'),400,'Palatino Regular'],
  [ST('Georgia','"Libre Baskerville", serif'),700,'Georgia Bold'],[ST('Georgia','"Libre Baskerville", serif'),400,'Georgia Regular'],
  [ST('Courier New','"Courier Prime", monospace'),700,'Courier New Bold'],[ST('Courier New','"Courier Prime", monospace'),400,'Courier New Regular'],
  [ST('Baskerville','"Libre Baskerville", serif'),700,'Baskerville Bold'],[ST('Baskerville','"Libre Baskerville", serif'),400,'Baskerville Regular'],
  [ST('Didot','"Bodoni Moda", serif'),700,'Didot Bold'],[ST('Didot','"Bodoni Moda", serif'),400,'Didot Regular'],
  [ST('Bradley Hand','"Caveat", cursive'),700,'Bradley Hand'],
  [ST('Chalkboard SE','"Comic Sans MS", "Caveat"'),700,'Chalkboard Bold'],[ST('Chalkboard SE','"Comic Sans MS", "Caveat"'),400,'Chalkboard Regular'],
  [ST('Gill Sans','"Gill Sans MT", "Inter"'),700,'Gill Sans Bold'],[ST('Gill Sans','"Gill Sans MT", "Inter"'),400,'Gill Sans Regular'],
  [ST('Noteworthy','"Caveat", cursive'),700,'Noteworthy Bold'],[ST('Noteworthy','"Caveat", cursive'),300,'Noteworthy Light'],
  [ST('Snell Roundhand','"Dancing Script", cursive'),700,'Snell Roundhand'],
  ['"Playfair Display"',700,'Playfair'],['"Playfair Display"',900,'Playfair Black'],['"Playfair Display"',900,'Playfair Black Italic',true],
  ['"Anton"',400,'Anton'],['"Bebas Neue"',400,'Bebas Neue'],['"Oswald"',700,'Oswald'],['"Nunito"',900,'Nunito Black'],
];

// ================= ŠABLONY =================
// každý spodní řádek leží VŽDY před řádkem nad ním (natural) – diakritika spodního řádku se nezakryje
const common = {mix3d:false,mixShine:'hi',mixExtrude:'hi',mixFx:2,mixSpeed:100,mixSeed:1,mixSize:100,mixY:60,mixA:'#ffa21e',mixB:'#f38b00',rowDy1:0,rowDy2:0,rowDy3:0,rowDx1:0,rowDx2:0,rowDx3:0,opacity:100,enterDist:35,enterBy:'word',kinDir:'opposite',tiltX:0,enter:'none',ease:'smooth',fontMain:SF,fontEm:SF,mainItalic:false,negativ:false,glowMode:'always',altOn:false,extrude:0,shadowDist:10,wordGap:100,capMain3:false,caseMain:'none',caseSec:'none',layerOrder:'natural',fxShake:false,anim:'squish',fadeOut:true,
  wpp:4, maxLines:3, split:'words', rowMax:61, cond:100, trackEm:null, textGrad:false, cText2:'#d4d4d4', gradSpan:0.5, singleSec:false, exitScale:null, exitDur:0.3, wordLead:0.08, wordFade:0.28};
E.COMMON = common;
E.TEMPLATES = {
  // BASE – výchozí, změřeno ze vzorového videa VID_43543582 (viz NAVOD_BASE.md)
  base:{ name:'Styl 1', cat:'trending', set:{...common, fontMain:SF,wMain:500,fontEm:SF,wEm:800,emItalic:false,mainItalic:false,mainLine:'mid',size:118,posX:50,posY:72.5,track:-3,trackEm:-3.5,cond:100,gap:60,rowDy1:8,rowDy3:-2,emScale:158,wordGap:80,tilt:0,tiltX:0,persp:60,tiltAlt:false,kinetic:0,kinDir:'opposite',rot:0,layout:'diagonal',layerOrder:'natural',cText:'#ffffff',cText2:'#e0e0e0',textGrad:true,grad:true,gA:'#ff9a00',gB:'#e8f200',gradDir:'v',gradSpan:0.36,c1:'#ff9c00',c2:'#ff9c00',c3:'#ff9c00',c4:'#ff9c00',altOn:false,glow:0,glowMode:'always',shadowSize:42,shadowA:80,shadowDist:2,cShadow:'#000000',extrude:0,fxShine:false,fxFlicker:false,fxShake:false,fxWiggle:false,wiggle:0,enter:'bottom',ease:'silk',enterDur:90,enterDist:30,anim:'block',wordLead:0.05,wordFade:0.2,fadeOut:true,exitScale:0.6,exitDur:0.1,caseMain:'title',caseSec:'lowerStart',capMain3:false,split:'fill',rowMax:61,wpp:7,maxLines:3,singleSec:true},
    pv:'<span style="font-weight:600;letter-spacing:-.06em">začněte mě</span><br><b style="background:linear-gradient(#ff9a00,#e8f200);-webkit-background-clip:text;color:transparent;font-weight:800;letter-spacing:-.07em">Sledovat</b>' },
  bestaccount:{ name:'Styl 2', cat:'trending', set:{...common, fontMain:SF,wMain:500,fontEm:SF,wEm:900,emItalic:false,mainLine:'mid',size:88,posX:50,posY:66,track:-4,gap:66,emScale:160,wordGap:160,tilt:18,tiltX:4,persp:60,tiltAlt:true,kinetic:45,layout:'cascade',layerOrder:'natural',cText:'#ffffff',grad:true,gA:'#ff9300',gB:'#fff200',gradDir:'v',altOn:true,altEvery:4,altA:'#8fe0ff',altB:'#0a62e6',glow:30,glowMode:'always',shadowSize:25,shadowA:45,shadowDist:10,cShadow:'#000000',fxShine:true,shineEvery:'3',shineSpeed:50,fxFlicker:false,fxWiggle:false,wiggle:0,anim:'block',fadeOut:true,capMain3:true},
    pv:'<span style="font-weight:700">Vyrostla</span><br><b style="background:linear-gradient(#ff9300,#fff200);-webkit-background-clip:text;color:transparent;font-weight:900">Vám Firma</b>' },
  vinoteka:{ name:'Styl 3', cat:'trending', set:{...common, wMain:500,wEm:900,emItalic:false,mainLine:'mid',size:88,posX:50,posY:72,track:-4,gap:66,emScale:160,wordGap:160,tilt:18,tiltX:4,persp:60,tiltAlt:true,kinetic:45,layout:'cascade',layerOrder:'natural',cText:'#ffffff',c1:'#e4202c',c2:'#e4202c',c3:'#e4202c',c4:'#e4202c',grad:false,glow:30,shadowSize:25,shadowA:45,shadowDist:10,cShadow:'#000000',fxShine:false,fxFlicker:false,fxWiggle:false,wiggle:0,anim:'block',fadeOut:true},
    pv:'<span style="font-weight:500">a</span><br><b style="color:#e4202c;font-weight:900">zlatá</b>' },
  negativ:{ name:'Styl 4', cat:'trending', set:{...common, wMain:500,wEm:900,emItalic:true,negativ:true,grad:false,c1:'#ffffff',c2:'#ffffff',c3:'#ffffff',c4:'#ffffff',cText:'#ffffff',track:-7,gap:66,emScale:120,tilt:25,kinetic:55,layout:'cascade',anim:'squish',shadowSize:25,shadowA:40,fxShine:false,fxFlicker:false,fxWiggle:true,wiggle:40,glow:0},
    pv:'<span style="font-weight:500">natáčení</span><br><i style="font-weight:900;background:#fff;color:#111;padding:0 3px">které</i>' },
  luxus:{ name:'Styl 5', cat:'trending', set:{...common, enter:'bottom',ease:'swing',wMain:500,wEm:900,emItalic:false,grad:false,c1:'#b8925a',c2:'#c9a66b',c3:'#ffffff',c4:'#f5f06a',cText:'#ffffff',track:-5,gap:72,emScale:150,tilt:18,kinetic:35,layout:'center',anim:'squish',shadowSize:25,shadowA:50,caseMain:'title',caseSec:'title',fxShine:true,fxFlicker:false,fxWiggle:true,wiggle:25,glow:0},
    pv:'<span style="font-weight:300">Dámy a</span><br><b style="color:#b8925a;font-weight:900">Pánové</b>' },
  zlato:{ name:'Styl 6', cat:'trending', set:{...common, gA:'#fff176',gB:'#ff9f00',gradDir:'v',wMain:500,wEm:900,emItalic:false,grad:true,c1:'#ffe14a',c2:'#ffb000',c3:'#fff44f',c4:'#ffd21f',cText:'#ffffff',track:-6,gap:74,emScale:190,tilt:12,kinetic:20,layout:'center',anim:'blur',shadowSize:50,shadowA:60,caseMain:'title',caseSec:'title',cShadow:'#000000',fxShine:true,fxFlicker:false,fxWiggle:true,wiggle:30,glow:0},
    pv:'<span>Vyděláváte</span><br><b style="color:#ffd21f;font-weight:900">Dnes</b>' },
  efektive:{ name:'Styl 7', cat:'trending', set:{...common, gA:'#2f7bff',gB:'#21d07a',gradDir:'h',wMain:500,wEm:900,emItalic:false,grad:true,c1:'#2f7bff',c2:'#21d07a',c3:'#7dffb8',c4:'#2f7bff',cText:'#ffffff',track:-5,gap:72,emScale:170,tilt:20,kinetic:45,layout:'cascade',anim:'squish',shadowSize:50,shadowA:60,cShadow:'#21d07a',fxShine:true,fxFlicker:false,fxWiggle:true,wiggle:45,glow:0},
    pv:'<span>Pamatuješ</span><br><b style="background:linear-gradient(90deg,#2f7bff,#21d07a);-webkit-background-clip:text;color:transparent;font-weight:900">si na</b>' },
  neon:{ name:'Styl 8', cat:'trending', set:{...common, tiltX:-10,enter:'left',ease:'elastic',fontMain:'"Montserrat"',wMain:400,fontEm:'"Montserrat"',wEm:900,emItalic:true,grad:false,c1:'#ff3ad7',c2:'#9b5cff',c3:'#ff3ad7',c4:'#4df0ff',cText:'#ffffff',track:-4,gap:70,emScale:160,tilt:25,kinetic:60,layout:'cascade',anim:'squish',shadowSize:90,shadowA:80,caseMain:'lower',caseSec:'lower',cShadow:'#ff3ad7',fxShine:false,fxFlicker:true,fxWiggle:true,wiggle:50,glow:0},
    pv:'<span>if you\'re</span><br><i style="color:#ff3ad7;font-weight:900">looking</i>' },
  bold:{ name:'Styl 9', cat:'trending', set:{...common, enter:'bottom',ease:'bounce',fontMain:'"Rubik"',wMain:900,fontEm:'"Rubik"',wEm:900,emItalic:false,grad:false,c1:'#7dff6a',c2:'#ffd21f',c3:'#ff5aa0',c4:'#4df0ff',cText:'#ffffff',track:-2,gap:90,emScale:115,tilt:0,kinetic:0,layout:'center',anim:'pop',shadowSize:25,shadowA:90,caseMain:'lower',caseSec:'lower',cShadow:'#000000',fxShine:false,fxFlicker:false,fxWiggle:true,wiggle:15,glow:0},
    pv:'<b style="font-family:Rubik;font-weight:900">this is your</b><br><b style="font-family:Rubik;font-weight:900;color:#7dff6a">text style</b>' },
  klasik:{ name:'Styl 10', cat:'trending', set:{...common, mainLine:'word',fontMain:'"Anton"',wMain:400,fontEm:'"Anton"',wEm:400,emItalic:false,grad:false,c1:'#ffe600',c2:'#ffe600',c3:'#ffe600',c4:'#ffe600',cText:'#ffffff',track:1,gap:100,emScale:100,tilt:0,kinetic:0,layout:'center',anim:'none',shadowSize:25,shadowA:100,caseMain:'upper',caseSec:'upper',cShadow:'#000000',fxShine:false,fxFlicker:false,fxWiggle:false,wiggle:0,glow:0},
    pv:'<b style="font-family:Anton;font-weight:400">TEXT <span style="color:#ffe600">TADY</span></b>' },
};
Object.assign(E.G, E.TEMPLATES.base.set);

// ================= STYL TITULKU =================
E.keyOf = p => p ? E.words[p.a].id : 0;
E.styleOf = p => { const own = p && E.meta[E.keyOf(p)] && E.meta[E.keyOf(p)].own; const S = Object.assign({}, E.G, own||{}); S._k = p ? E.pages.indexOf(p) : 0; return S; };
E.tiltOf = S => (S.tiltAlt && (S._k%2)) ? -S.tilt : S.tilt;

// ================= SLOVA, ZÓNY, OPRAVY =================
const stripPunct=s=>s.replace(/[.,!?;:…"“”„]+$/u,'').replace(/^[„"“]+/u,'');
E.stripPunct=stripPunct;
E.mkWord=(raw,s,e)=>{ raw=String(raw).normalize('NFC'); return {id:E.newId(), raw, t:stripPunct(raw), s, e, em:false}; };
// slovo v zóně bez titulků (grafika, logo)? – střed slova padne do (s−0,2 ; e+0,4)
E.inZone = w => { const m=(w.s+w.e)/2; return E.zones.some(z=>m>z.s-0.2 && m<z.e+0.4); };
// konec věty? „21.“ (číslo s tečkou, např. století) se za konec věty nepočítá
const endsSentence = w => { const r=w.raw||w.t; if (/^\d+\.$/.test(r)) return false; return /[.!?…]$/.test(r); };
// slovník oprav přepisu (chyba → oprava), platí pro celé slovo nebo frázi
E.applyCorrections = (pairs) => {
  let n=0;
  for (const [bad,good] of pairs){
    if (!bad) continue;
    const bw=bad.trim().split(/\s+/), gw=good.trim().split(/\s+/).filter(Boolean);
    for (let i=0;i<=E.words.length-bw.length;i++){
      let ok=true; for (let j=0;j<bw.length;j++){ if (E.words[i+j].t.toLocaleLowerCase()!==stripPunct(bw[j]).toLocaleLowerCase()){ ok=false; break; } }
      if (!ok) continue;
      const seg=E.words.slice(i,i+bw.length), s=seg[0].s, e=seg[seg.length-1].e, tail=(seg[seg.length-1].raw.match(/[.,!?;:…]+$/)||[''])[0];
      // zachovat velké první písmeno, pokud ho měl originál
      const cap = /^\p{Lu}/u.test(seg[0].t) && !/^\p{Lu}/u.test(gw[0]||'');
      const repl = gw.map((g,k)=>{ const raw=(k===0&&cap? g.charAt(0).toLocaleUpperCase()+g.slice(1):g)+(k===gw.length-1?tail:''); const d=(e-s)/gw.length; const w=E.mkWord(raw,s+k*d,s+(k+1)*d*0.98); return w; });
      if (repl.length===seg.length) repl.forEach((w,k)=>{ w.id=seg[k].id; w.em=seg[k].em; w.s=seg[k].s; w.e=seg[k].e; });
      E.words.splice(i,bw.length,...repl); n++; i+=repl.length-1;
    }
  }
  return n;
};
// rovnoměrné rozložení textu do času (ruční vložení / oprava titulku)
E.spread=(list,s,e)=>{ const tot=list.reduce((a,w)=>a+w.length+2,0); let t=s; const out=[]; for (const w of list){ const d=(e-s)*(w.length+2)/tot; out.push(E.mkWord(w,t,t+d*0.92)); t+=d; } return out; };

// ================= STRÁNKY (titulky) =================
function hash(n){ const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); }
E.hash=hash;
const letters=w=>w.t.replace(/[^\p{L}\p{N}]/gu,'').length;
let _mc=null;
E.buildPages = () => {
  const G=E.G, W=E.words; const pages=[]; let c=null;
  W.forEach((w,i)=>{ w._i=i; });
  // Base: řádky se plní podle šířky (horní → hlavní větším písmem → spodní), když se nevejde, nový titulek
  const fill = G.split==='fill' && !(G.maxChars>0);
  let rowW=null;
  if (fill){
    if (!_mc) _mc=document.createElement('canvas').getContext('2d');
    const Wd=cv?cv.width:1080, Hd=cv?cv.height:1920, basePx=Math.min(Wd,Hd)*0.105*G.size/100, k=(G.cond||100)/100;
    const wW=(i,r)=>{ const em=r===1, px=basePx*(em?G.emScale/100:1); setFont(_mc,em?G.fontEm:G.fontMain,em?G.wEm:G.wMain,em?G.emItalic:G.mainItalic,px,0);
      const tr=em?(G.trackEm??G.track):G.track; return [measureT(_mc,E.txt(W[i],G,em),px,tr)*k, measureT(_mc,' ',px,0)*G.wordGap/100*k]; };
    rowW=(ids,r)=>ids.reduce((a,i,j)=>{ const [w,sp]=wW(i,r); return a+w+(j?sp:0); },0);
    rowW.max=[Wd*G.rowMax/100, Wd*Math.min(88,G.rowMax*1.14)/100, Wd*G.rowMax/100];
  }
  const maxRows=Math.max(1,Math.min(3,G.maxLines||3));
  for (let i=0;i<W.length;i++){
    const w=W[i], prev=W[i-1];
    if (E.inZone(w)){ if (c){ pages.push(c); c=null; } continue; }
    // titulek s řádky napsanými ručně v bublině (Enter = nový řádek): drží slova i řádky přesně tak, jak jsou napsané
    if (c && c.manual && !w.br){ if (w.nl) c.lines.push([i]); else c.lines[c.lines.length-1].push(i); c.b=i; continue; }
    let br = !c || w.br || (prev && w.s-prev.e > 0.6) || (prev && endsSentence(prev)) || (prev && E.inZone(prev));
    if (!br && c){
      if (fill){
        if ((i-c.a) >= G.wpp) br=true;
        else {
          const r=c.lines.length-1, row=c.lines[r];
          if (row.length<ROW_WORDS[r] && rowW(row.concat(i),r)<=rowW.max[r]){ row.push(i); c.b=i; continue; }
          if (r<maxRows-1){ c.lines.push([i]); c.b=i; continue; }
          br=true;
        }
      } else if (G.maxChars>0){
        // znaky: slovo se vejde na aktuální řádek? jinak nový řádek; když je řádků víc než max → nový titulek
        const L=c.lines[c.lines.length-1], len=L.reduce((a,j)=>a+W[j].t.length+1,0)+w.t.length;
        if (len>G.maxChars){ if (c.lines.length>=G.maxLines) br=true; else { c.lines.push([i]); c.b=i; continue; } }
        else { L.push(i); c.b=i; continue; }
      } else if ((i-c.a) >= G.wpp) br=true;
    }
    if (br){ if(c) pages.push(c); const man=!!(E.meta[w.id] && E.meta[w.id].ml); c={a:i,b:i,lines:(man||G.maxChars>0||fill)?[[i]]:null,fill:fill&&!man,manual:man}; if (man) continue; } else { c.b=i; }
  }
  if (c) pages.push(c);
  pages.forEach(p=>{ const m=E.meta[W[p.a].id]; p.s=(m && m.so!=null)?m.so:W[p.a].s; });
  pages.forEach(p=>{ const m=E.meta[W[p.a].id]; p.layer=(m && m.layer)|0; });
  pages.forEach((p,k)=>{
    const m=E.meta[W[p.a].id];
    let nxt=null; for (let q=k+1;q<pages.length;q++) if (pages[q].layer===p.layer){ nxt=pages[q]; break; }
    const end=W[p.b].e+1.2;
    p.e = nxt ? Math.min(end,nxt.s) : W[p.b].e+0.5;
    // konec titulku utnout před začátkem další zóny bez titulků (grafika / logo)
    const z=E.zones.filter(z=>z.s>=W[p.b].e-0.05).sort((a,b)=>a.s-b.s)[0]; if (z) p.e=Math.min(p.e, z.s);
    if (m && m.eo!=null) p.e = nxt ? Math.min(m.eo, nxt.s) : m.eo;
    p.kin=[0,1,2,3].map(j=>({dx:hash(k*4+j)*2-1, dy:hash(k*4+j+100)*2-1, rot:hash(k*4+j+200)*2-1}));
  });
  E.pages=pages;
};
E.layerOf = p => { const m=E.meta[E.words[p.a]?.id]; return (m && m.layer)|0; };
// hlavní titulek v čase t (přednost má hlavní vrstva 0)
E.pageAt = t => { const ks=E.pagesAt(t); if (!ks.length) return -1; const m=ks.find(k=>!(E.pages[k].layer|0)); return m!=null?m:ks[0]; };
// všechny titulky v čase t, seřazené pro kreslení (spodní vrstva první)
// v každé vrstvě jen jeden titulek naráz; když se dva kryjí, vyhraje ten upravený (má vlastní styl), jinak ten pozdější
const edited = p => { const m=E.meta[E.keyOf(p)]; return !!(m && m.own && Object.keys(m.own).some(x=>!['posX','posY','_manualPos'].includes(x))); };
E.pagesAt = t => { const by={}; for (let k=0;k<E.pages.length;k++){ const p=E.pages[k]; if (t>=p.s && t<p.e){ const L=p.layer|0, c=by[L];
    if (c==null) { by[L]=k; continue; } const q=E.pages[c], ep=edited(p), eq=edited(q);
    if (ep!==eq ? ep : p.s>=q.s) by[L]=k; } }
  return Object.values(by).sort((a,b)=>(E.pages[b].layer|0)-(E.pages[a].layer|0)); };
const range=(a,b)=>{ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; };
// rozdělení titulku na řádky + který řádek je hlavní
E.groupsOf = (p,S) => {
  const W=E.words;
  const manual=[]; for(let i=p.a;i<=p.b;i++) if(W[i].em) manual.push(i);
  if (manual.length && !p.manual){ const e0=Math.min(...manual), e1=Math.max(...manual);
    return [{ids:range(p.a,e0-1),em:false},{ids:range(e0,e1),em:true},{ids:range(e1+1,p.b),em:false}].filter(g=>g.ids.length); }
  const n=p.b-p.a+1, ids=range(p.a,p.b), ml=String(S.mainLine);
  if (ml==='word' && !p.manual){ let best=p.a,len=0; for(let i=p.a;i<=p.b;i++){ const L=letters(W[i]); if(L>len){len=L;best=i;} }
    return [{ids:range(p.a,best-1),em:false},{ids:[best],em:true},{ids:range(best+1,p.b),em:false}].filter(g=>g.ids.length); }
  if (ml==='none' && !p.manual) return [{ids,em:false}];
  let lines;
  if (p.lines){ lines=p.lines.map(l=>l.slice());
    // osamocené krátké slůvko („a“, „v“) na posledním řádku se připojí k předchozímu řádku
    const L=lines[lines.length-1]; if (!p.fill && !p.manual && lines.length>1 && L.length===1 && letters(W[L[0]])<=2) lines[lines.length-2].push(...lines.pop()); }
  else {
    const maxL=Math.max(1,Math.min(4,S.maxLines||3));
    if (n===1 || maxL===1) lines=[ids];
    else if (n===2 || maxL===2) { const h=Math.ceil(n/2); lines = n===2?[[ids[0]],[ids[1]]]:[ids.slice(0,h),ids.slice(h)]; }
    else if (maxL>=4 && n>=4) { const per=Math.ceil(n/4); lines=[]; for(let i=0;i<n;i+=per) lines.push(ids.slice(i,i+per)); }
    else {
      const main=Math.ceil(n/3), rest=n-main, top=Math.ceil(rest/2); lines=[ids.slice(0,top),ids.slice(top,top+main),ids.slice(top+main)];
      // hlavní řádek nesmí být jen krátké slůvko („a“, „se“, „je“) – přilepí se nahoru a hlavní bude další řádek
      const lt=l=>l.reduce((a,i)=>a+letters(W[i]),0);
      if (lt(lines[1])<=2 && lines[2].length){ lines=[lines[0].concat(lines[1]),lines[2]]; }
    }
  }
  lines=lines.filter(l=>l.length);
  let mains;
  const emL=p.manual?lines.map((l,i)=>l.some(j=>W[j].em)?i:-1).filter(i=>i>=0):[];
  if (emL.length) mains=emL;                      // ručně zvýrazněné slovo → jeho řádek je hlavní
  else if (p.manual && ml==='none') mains=[];
  else if (ml==='mid' || (p.manual && ml==='word')){
    if (lines.length===1) mains=S.singleSec?[]:[0];
    else if (lines.length===4) mains=[1,3];       // 4 řádky: 2. a 4. řádek jsou hlavní (střídání)
    else mains=[Math.min(1,lines.length-1)];
  } else mains=[clamp(+ml-1,0,lines.length-1)];
  return lines.map((l,i)=>({ids:l,em:mains.includes(i),slot:(p.fill&&!manual.length)||p.manual?Math.min(i,2):undefined}));
};
function applyCase(s,mode){ if (mode==='upper') return s.toLocaleUpperCase(); if (mode==='lower') return s.toLocaleLowerCase(); if (mode==='title') return s.charAt(0).toLocaleUpperCase()+s.slice(1); return s; }
E.txt = (w,S,isEm) => {
  let s = S.punct ? (w.raw||w.t) : w.t;
  s = applyCase(s, isEm ? (S.caseMain||S.case||'none') : (S.caseSec||S.case||'none'));
  // velké první písmeno v hlavním řádku – jen slova od 3 písmen („to na“ zůstane malé)
  if (isEm && S.capMain3 && (S.caseMain||'none')==='none' && letters(w)>=3) s=s.charAt(0).toLocaleUpperCase()+s.slice(1);
  if (!isEm && S.caseSec==='lowerStart'){
    const i=w._i??E.words.indexOf(w), prev=E.words[i-1], start=!prev || (/[.!?…]["“”»)]*$/u.test(prev.raw||prev.t) && !/^\d+\.$/.test(prev.raw||''));
    const low=s.toLocaleLowerCase();
    if (start && /^\p{Lu}\p{Ll}*$/u.test(s) && s.length>1 && (i===0 || COMMON_START.has(low))) s=low;
  }
  return s;
};

// ================= KRESLENÍ =================
const easeBack = x => 1 + 2.7*Math.pow(x-1,3) + 1.7*Math.pow(x-1,2);
const easeBounce = x => { const n=7.5625,d=2.75; if(x<1/d) return n*x*x; if(x<2/d) return n*(x-=1.5/d)*x+.75; if(x<2.5/d) return n*(x-=2.25/d)*x+.9375; return n*(x-=2.625/d)*x+.984375; };
const easeElastic = x => x===0?0:x===1?1:Math.pow(2,-10*x)*Math.sin((x*10-0.75)*(2*Math.PI/3))+1;
E.ease={easeBack,easeBounce,easeElastic};
function setFont(c, fam, weight, italic, px, track){
  if (fam===SF && weight>800) weight=800;   // SF: nejtlustší je Heavy (800) – nic tlustšího
  c.font = `${italic?'italic ':''}${weight} ${px}px ${fam.includes(',')||fam.startsWith('"')?fam:'"'+fam+'"'}`;
  if ('letterSpacing' in c) c.letterSpacing=(track/100*px).toFixed(2)+'px';
}
function hexA(hex,a){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
E.hexA=hexA;
let cv=null, ctx=null, vid=null;
E.attach=(canvas, video)=>{ cv=canvas; ctx=canvas.getContext('2d'); vid=video; E._attached=[canvas,video]; };

function layoutRaw(p,S,scaleMul){
  const W=cv.width, H=cv.height;
  const base = Math.min(W,H)*0.105*(S.size/100)*scaleMul;
  const groups = E.groupsOf(p,S);
  const maxW=W*0.88, lines=[];
  const mk=(ids,isEm)=>{
    const fam=isEm?S.fontEm:S.fontMain, wt=isEm?S.wEm:S.wMain, it=isEm?S.emItalic:S.mainItalic;
    let px=base*(isEm?S.emScale/100:1);
    const track=isEm?(S.trackEm??S.track):S.track, cond=(S.cond||100)/100;
    setFont(ctx,fam,wt,it,px,0);
    let sp=measureT(ctx,' ',px,0)*(S.wordGap/100)*cond, ws=ids.map(i=>measureT(ctx,E.txt(E.words[i],S,isEm),px,track)*cond);
    let total=ws.reduce((a,b)=>a+b,0)+sp*(ids.length-1);
    return {ids,fam,wt,it,px,em:isEm,ws,sp,total,track,cond};
  };
  for (const g of groups){ const L=mk(g.ids,g.em); L.slot=g.slot; lines.push(L); }
  let y=0; const ys=[];
  if (lines.length && lines.every(L=>L.slot!=null)){
    // Base: pevné sloty (horní / hlavní / spodní) – horní řádek je na stejném místě i u kratšího titulku
    const st=(base+base*S.emScale/100)*0.5*(S.gap/100), slotY=[0,st,st*2]; y=st*2;
    lines.forEach(L=>ys.push(slotY[L.slot]));
  } else lines.forEach((L,i)=>{ if(i>0) y+=(lines[i-1].px*0.5+L.px*0.5)*(S.gap/100); ys.push(y); });
  const blockH=y, kin=S.kinetic/100;
  const cx=W*S.posX/100, cy=H*S.posY/100-blockH/2;
  // kinetické rozložení: řádky se jen posunou do stran po své lince (žádný jiný pohyb)
  // horní řádek doleva, prostřední (hlavní) stojí, spodní doprava (nebo doleva – S.kinDir='same')
  const emI=lines.findIndex(L=>L.em), midI=emI>=0?emI:(lines.length>2?1:-1);
  const side=i=>{ const pos=lines[i].slot!=null?lines[i].slot-1:(midI>=0?Math.sign(i-midI):(i===0?-1:1)); return pos<0?-1:pos>0?(S.kinDir==='same'?-1:1):0; };
  const shift=Math.min(W,H)*0.22*kin;
  lines.forEach((L,i)=>{
    const ri=Math.min(L.slot??i,2)+1;   // 1., 2., 3. řádek – každý jde posunout zvlášť
    L.y=cy+ys[i]+base*(S['rowDy'+ri]||0)/100;
    const kx=side(i)*shift;
    if (S.layout==='diagonal') L.x0=cx-L.total/2+[-0.02,0.025,0.09][Math.min(L.slot??i,2)]*W+kx;
    else if (S.layout==='left') L.x0=cx-W*0.3+kx;
    else if (S.layout==='right') L.x0=cx+W*0.3-L.total+kx;
    else L.x0=cx-L.total/2+kx;
    L.x0+=W*(S['rowDx'+ri]||0)/100;
    L.rot=0;
  });
  lines.forEach((L,i)=>L._i=i);
  return lines;
}
// automatické zmenšení dlouhého titulku: blok max 78 % šířky a ≥ ~8 % od okrajů → nikdy se neuřízne
E.layoutPage = (p,S) => {
  // bez limitů: velikost ani pozice se automaticky nemění – co uživatel nastaví, to platí (i mimo okraj videa)
  const lines=layoutRaw(p,S,1);
  if (S.layerOrder==='natural') return lines;
  if (S.layerOrder==='bottomfirst') return lines.slice().reverse();
  return lines.slice().sort((a,b)=>(a.em?1:0)-(b.em?1:0));
};

function mainColor(S,k){
  if (S.grad){ if (S.altOn && S.altEvery>0 && k % S.altEvery === Math.min(2,S.altEvery-1)) return [S.altA,S.altB]; return [S.gA,S.gB]; }
  const c=[S.c1,S.c2,S.c3,S.c4][k%4]; return [c,c];
}
E.mainColor=mainColor;


// ---------- „vypálené“ slovo: písmo + stín (+ hloubka) v jednom obrázku, s mezipamětí ----------
const SPR=new Map();
function wordSprite(kind,s,L,tk,fd,fill,S,glowCol){
  const key=[kind,s,L.fam,L.wt,L.it?1:0,L.px.toFixed(2),tk,fd,S.shadowSize,S.shadowA,S.shadowDist,S.cShadow,S.extrude||0,S.extrudeStyle||'light',kind==='glow'?S.glow+'|'+glowCol:''].join('~');
  let sp=SPR.get(key); if (sp){ SPR.delete(key); SPR.set(key,sp); return sp; }
  const px=L.px, cvs=document.createElement('canvas'), m=cvs.getContext('2d');
  setFont(m,L.fam,L.wt,L.it,px,tk); m.textBaseline='middle'; m.textAlign='center';
  const mt=m.measureText(s), asc=Math.max(mt.actualBoundingBoxAscent||0,px*0.75), desc=Math.max(mt.actualBoundingBoxDescent||0,px*0.45);
  const half=Math.max(measureT(m,s,px,tk)/2, mt.actualBoundingBoxLeft||0, mt.actualBoundingBoxRight||0)+px*0.08;
  const sb=S.shadowSize>0?px*S.shadowSize/100*1.15:0, sx=px*S.shadowDist/100*0.12, sy=px*S.shadowDist/100*0.9;
  const ex=(S.extrude>0)?px*(S.extrudeStyle==='dark'?0.16:0.12)*S.extrude/100:0, gb=kind==='glow'?px*(0.3+S.glow/100*0.9):0;
  const pad=Math.ceil(Math.max(sb*1.6+Math.max(Math.abs(sx),Math.abs(sy))+ex*1.05, gb*1.6, ex*1.2)+px*0.12);
  const W=Math.ceil(half*2+pad*2), H=Math.ceil(asc+desc+pad*2), cx=W/2, cy=pad+asc;
  cvs.width=W; cvs.height=H;
  setFont(m,L.fam,L.wt,L.it,px,tk); m.textBaseline='middle'; m.textAlign='center'; m.translate(cx,cy);
  if (kind==='glow'){
    m.shadowColor=hexA(glowCol,0.9); m.shadowBlur=gb; m.fillStyle=glowCol; fillT(m,s,0,0,px,tk);
  } else {
    // stejná výplň jako dřív (přechod v souřadnicích slova)
    let f=fill;
    if (typeof fill!=='string'){
      const p=fd.split('|');
      if (p[0]==='t'){ f=m.createLinearGradient(0,-px*0.36,0,px*0.36); f.addColorStop(0,p[1]); f.addColorStop(1,p[2]); }
      else if (p[0]==='g'){ const dir=p[1], gsp=+p[2], ww=+p[5]||half*2; f=dir==='h'?m.createLinearGradient(-ww/2,0,ww/2,0):dir==='d'?m.createLinearGradient(-ww/2,-px*gsp,ww/2,px*gsp):m.createLinearGradient(0,-px*gsp,0,px*gsp); f.addColorStop(0,p[3]); f.addColorStop(1,p[4]); }
    }
    if (ex>0){
      // 3D hloubka: písmo „nakopírované za sebe“ ve stejných barvách (kopie se kreslí jen jednou – obrázek je v mezipaměti)
      const t=document.createElement('canvas'); t.width=W; t.height=H; const tc=t.getContext('2d');
      setFont(tc,L.fam,L.wt,L.it,px,tk); tc.textBaseline='middle'; tc.textAlign='center'; tc.translate(cx,cy);
      let tf=f; if (typeof f!=='string'){ const p=fd.split('|'); if (p[0]==='t'){ tf=tc.createLinearGradient(0,-px*0.36,0,px*0.36); tf.addColorStop(0,p[1]); tf.addColorStop(1,p[2]); } else if (p[0]==='g'){ const dir=p[1], gsp=+p[2], ww=+p[5]||half*2; tf=dir==='h'?tc.createLinearGradient(-ww/2,0,ww/2,0):dir==='d'?tc.createLinearGradient(-ww/2,-px*gsp,ww/2,px*gsp):tc.createLinearGradient(0,-px*gsp,0,px*gsp); tf.addColorStop(0,p[3]); tf.addColorStop(1,p[4]); } }
      tc.fillStyle=tf;
      const dark = S.extrudeStyle==='dark';
      // světlá: jemné kopie s menším posunem do strany; tmavá (jako v Photoshopu): plné kopie po 1 px šikmo vpravo dolů, výrazně tmavší
      const dx=dark?0.75:0.55, dy=1, n=dark?Math.min(48,Math.max(4,Math.round(ex))):Math.min(28,Math.max(3,Math.round(ex/1.1)));
      for (let i=n;i>=1;i--){ const q=i/n; fillT(tc,s,ex*q*dx,ex*q*dy,px,tk); }
      tc.save(); tc.setTransform(1,0,0,1,0,0); tc.globalCompositeOperation='source-atop'; tc.fillStyle=dark?'rgba(0,0,0,0.42)':'rgba(0,0,0,0.15)'; tc.fillRect(0,0,W,H); tc.restore();
      fillT(tc,s,0,0,px,tk);   // čelo písmen v čisté barvě
      m.setTransform(1,0,0,1,0,0);
      if (dark){
        // stín jen pod POSLEDNÍ (nejzadnější) vrstvou: zadní kopie se stínem, hloubka ji pak přesně překryje
        if (sb>0){
          const bk=document.createElement('canvas'); bk.width=W; bk.height=H; const bc=bk.getContext('2d');
          setFont(bc,L.fam,L.wt,L.it,px,tk); bc.textBaseline='middle'; bc.textAlign='center'; bc.fillStyle='#000'; fillT(bc,s,cx+ex*dx,cy+ex*dy,px,tk);
          m.shadowColor=hexA(S.cShadow,S.shadowA/100*0.8); m.shadowBlur=sb; m.shadowOffsetX=sx; m.shadowOffsetY=sy;
          m.drawImage(bk,0,0); m.shadowColor='transparent';
        }
        m.drawImage(t,0,0);
      } else {
        // stín vrhá až zadní část hloubky (ne přední písmo)
        if (sb>0){ m.shadowColor=hexA(S.cShadow,S.shadowA/100*0.8); m.shadowBlur=sb; m.shadowOffsetX=sx+ex*0.3; m.shadowOffsetY=sy+ex*0.5; }
        m.drawImage(t,0,0);
      }
      m.translate(cx,cy);
      m.shadowColor='transparent';
    } else {
    if (sb>0){ m.shadowColor=hexA(S.cShadow,S.shadowA/100*0.8); m.shadowBlur=sb; m.shadowOffsetX=sx; m.shadowOffsetY=sy; }
    m.fillStyle=f; fillT(m,s,0,0,px,tk);
    }
    // jemný „kontaktní“ stín těsně pod písmem – rozmazání roste plynule s velikostí stínu (žádný skok, žádný ostrý obrys)
    if (S.shadowSize>0 && !(ex>0)){ const k=Math.min(1,S.shadowSize/100); m.shadowColor=hexA(S.cShadow,Math.min(0.45,S.shadowA/100*0.7)*(0.6+0.4*k)); m.shadowBlur=px*(0.05+0.15*k); m.shadowOffsetX=0; m.shadowOffsetY=px*(0.015+0.02*k); fillT(m,s,0,0,px,tk); }
  }
  sp={cv:cvs,x:-cx,y:-cy};
  SPR.set(key,sp); if (SPR.size>64){ SPR.delete(SPR.keys().next().value); }
  return sp;
}
function drawWord(c, w, L, x, wWidth, t, p, S, k, j){
  // dvouprůchodové kreslení negativu s 3D náklonem: v každém průchodu jen „jeho“ slova
  if (E._negPass){ const neg=!!(L.em && S.negativ); if ((E._negPass==='skip' && neg) || (E._negPass==='only' && !neg)) return; }
  const exitDur = S.exitScale!=null ? (S.exitDur||0.1) : (S.fadeOut?0.3:0.1);
  // jak titulky přijíždějí: po jednom slově (když ho řekne) / celý řádek najednou / celý titulek najednou
  const by = S.enterBy || (S.wordByWord ? 'word' : 'page');
  const st0 = by==='line' ? E.words[L.ids[0]].s : by==='page' ? p.s : w.s;
  const age=t-st0, exit=clamp((p.e-t)/exitDur); const exitE = S.fadeOut ? (exit*exit*(3-2*exit)) : exit;
  const since=age;
  if (since<0 && S.anim!=='block' && S.anim!=='base') return;
  let a=clamp(since/0.07)*exit, sc=1, sy=1, dx=0, dy=0, blur=0, er=0;
  const kk=clamp(since/0.25);
  if (S.anim==='squish'){ const e=easeBack(kk); sc=0.6+0.4*e; sy=kk<0.5?0.5+kk:1+0.25*(1-e); }
  else if (S.anim==='pop'){ sc=L.em?1+0.5*(1-easeBack(kk)):0.5+0.5*easeBack(kk); }
  else if (S.anim==='blur'){ blur=(1-kk)*L.px*0.25; sc=0.9+0.1*kk; }
  else if (S.anim==='smooth'){ const q=clamp(since/0.5), e=1-Math.pow(1-q,3); a=e*exit; sc=0.94+0.06*e; }
  else if (S.anim==='fade'){ const q=clamp(since/0.35); a=(q*q*(3-2*q))*exit; }
  else if (S.anim==='base'){
    // Base: titulek stojí, slova se jen prolnou (0,2 s, začne 0,05 s před vyslovením); odchod řeší celý blok v E.render
    const qa=clamp((since+(S.wordLead??0.05))/(S.wordFade??0.2)); a=(qa*qa*(3-2*qa))*exitE;
    if (a<=0) return;
  }
  else if (S.anim==='block'){
    // celý titulek přijede jako jeden kus: pomalé dobrzdění (expo), z mírného zmenšení, slova se jen lehce postupně rozsvítí
    const tp=t-p.s, q=clamp(tp/0.55), e=1-Math.pow(2,-10*q);
    sc=0.82+0.18*e; dy+= (1-e)*L.px*0.35;
    const qa=clamp((t-st0+0.08)/0.28); a=(qa*qa*(3-2*qa))*exit;
    if (S.fadeOut) sc*=(0.94+0.06*exitE);
    if (a<=0) return;
  }
  if (S.enter!=='none'){
    const dur=S.enterDur/100, q=clamp(since/dur);
    let prog;
    switch(S.ease){
      case 'bounce': prog=easeBounce(q); break;
      case 'swing': prog=1-Math.cos(q*Math.PI/2); er=(1-q)*Math.sin(q*Math.PI*2.5)*0.35; break;
      case 'shake': prog=easeBack(q); if(q<1){ const s=(1-q)*L.px*0.12; dx+=Math.sin(since*150)*s; dy+=Math.cos(since*190)*s*0.5; } break;
      case 'elastic': prog=easeElastic(q); break;
      case 'silk': prog = q>=1 ? 1 : (1-Math.pow(2,-10*q))/(1-Math.pow(2,-10)); break;   // expo-out: rychlý start, dlouhé jemné dobrzdění
      default: prog=1-Math.pow(1-q,3);
    }
    // „hedvábný“ příjezd: slovo se zároveň plynule rozsvítí (nepřiletí ostře zdaleka)
    if (S.ease==='silk') a*=Math.min(1,0.15+prog*1.1);
    const dist=Math.min(cv.width,cv.height)*(S.enterDist??35)/100, off=(1-prog)*dist;
    if (S.enter==='bottom') dy+=off; else if (S.enter==='top') dy-=off; else if (S.enter==='left') dx-=off; else if (S.enter==='right') dx+=off;
    if (S.ease==='swing'){ const dir=(S.enter==='left'||S.enter==='right')?1:-1; er+=dir*(1-prog)*0.3; }
  }
  if (S.fxFlicker && since<0.2 && Math.floor(since*45)%2) a*=0.15;
  const wig=S.wiggle/100, live=t>=w.s&&t<=w.e+0.15;
  let wx=0,wy=0,wr=0;
  if (S.fxWiggle){ wx=Math.sin(t*23+j*2.1)*L.px*0.015*wig*(live?2:0.6); wy=Math.cos(t*19+j*1.3)*L.px*0.015*wig*(live?2:0.6); wr=Math.sin(t*11+j)*0.04*wig*(live?1.5:0.5); }
  if (S.fxShake && since<0.35){ const sh=(1-since/0.35)*L.px*0.08*(0.5+wig); wx+=Math.sin(since*140+j)*sh; wy+=Math.cos(since*170+j)*sh*0.6; }

  if (c!==ctx && E._band){
    const rr=Math.abs(Math.sin(wr+L.rot+er+S.rot*Math.PI/180)), k2=Math.max(sc,sc*sy);
    const ext=L.px*k2*0.8 + rr*wWidth*k2/2 + L.px*((S.shadowSize||0)/100*1.3+(S.shadowDist||0)/100) + L.px*0.2*(S.extrude||0)/100 + (S.fxShine&&L.em?L.px*1.8:0);
    const yy=L.y+dy+wy; if (yy-ext<E._band[0]) E._band[0]=yy-ext; if (yy+ext>E._band[1]) E._band[1]=yy+ext;
  }
  c.save();
  c.globalAlpha=a*((S.opacity??100)/100);
  c.translate(x+wWidth/2+dx+wx, L.y+dy+wy);
  c.rotate(wr+L.rot+er+S.rot*Math.PI/180);
  c.scale(sc*(L.cond||1),sc*sy);
  const tk=L.track??S.track;
  setFont(c,L.fam,L.wt,L.it,L.px,tk);
  c.textBaseline='middle'; c.textAlign='center';
  if (blur>0.5) c.filter=`blur(${blur}px)`;
  const s=E.txt(w,S,L.em);
  const [mA,mB]=mainColor(S,k);
  let fill=L.em?mA:S.cText;
  const gs=S.gradSpan||0.5, ww=wWidth/(L.cond||1);
  if (!L.em && S.textGrad && S.cText2 && S.cText2!==S.cText){ const g=c.createLinearGradient(0,-L.px*0.36,0,L.px*0.36); g.addColorStop(0,S.cText); g.addColorStop(1,S.cText2); fill=g; }
  if (L.em && S.grad){ const dir=S.gradDir, g=dir==='h'?c.createLinearGradient(-ww/2,0,ww/2,0):dir==='d'?c.createLinearGradient(-ww/2,-L.px*gs,ww/2,L.px*gs):c.createLinearGradient(0,-L.px*gs,0,L.px*gs); g.addColorStop(0,mA); g.addColorStop(1,mB); fill=g; }
  let gMul=1; if (S.glowMode==='entrance') gMul = clamp(1-(since-0.15)/0.6);
  const burn = !(L.em&&S.negativ) && blur<=0.5;
  if (burn){
    // Text i se stínem jako jeden „vypálený“ obrázek: stín se natáčí, zmenšuje a mizí přesně s písmem
    const fd = L.em ? (S.grad ? `g|${S.gradDir}|${gs}|${mA}|${mB}|${S.gradDir==='v'?0:Math.round(ww)}` : `c|${mA}`) : (S.textGrad && S.cText2 && S.cText2!==S.cText ? `t|${S.cText}|${S.cText2}` : `c|${S.cText}`);
    if (L.em && S.glow>0 && gMul>0){
      E._glowColor=mA;
      if (c===ctx){
        const g=wordSprite('glow',s,L,tk,fd,fill,S,mA);
        c.save(); c.shadowColor='transparent'; c.globalAlpha*=gMul*(0.35+S.glow/100*0.5); c.drawImage(g.cv,g.x,g.y); c.restore();
      } else {
        const m=glowMaskCtx(); m.save(); m.setTransform(c.getTransform()); m.globalAlpha=a*gMul; m.font=c.font; if('letterSpacing' in m) m.letterSpacing=c.letterSpacing; m.textBaseline='middle'; m.textAlign='center'; m.fillStyle=mA; fillT(m,s,0,0,L.px,tk); m.restore();
        E._glowUsed=true;
      }
    }
    const sp=wordSprite('main',s,L,tk,fd,fill,S,mA);
    c.shadowColor='transparent'; c.drawImage(sp.cv,sp.x,sp.y);
  } else {
  if (L.em && S.negativ){ if (E._negPass!=='only') c.globalCompositeOperation='difference'; fill='#ffffff'; }   // ve 3D průchodu bílé písmo, negativ se udělá až při vložení do videa
  else if (S.shadowSize>0){ c.shadowColor=hexA(S.cShadow,S.shadowA/100*0.8); c.shadowBlur=L.px*S.shadowSize/100*1.15; c.shadowOffsetX=L.px*S.shadowDist/100*0.12; c.shadowOffsetY=L.px*S.shadowDist/100*0.9; }
  c.fillStyle=fill; fillT(c,s,0,0,L.px,tk);
  }
  // SHINE: přes hlavní slovo plynule přejede měkké světlo – písmo se v tom místě rozzáří (přičtením světla, ne bílou barvou)
  // a kolem písmen vznikne jemná záře. Záře se dělá rozmazáním zmenšením (žádný stín) na plátně s velkou rezervou → nic se neořízne.
  const shineOk = S.shineEvery==='rand' ? hash(k*7+3)<0.45 : (k % (+S.shineEvery||1) === 0);
  if (S.fxShine && shineOk && L.em && !S.negativ){
    const dur = 2.4 - S.shineSpeed/100*1.3, st = -0.3, q = (since-st)/dur;   // lesk vyjede hned s příletem slova
    if (q>0 && q<1){
      const ph = q*q*(3-2*q), env=Math.sin(Math.PI*q);
      const m = shineCtx();
      setFont(m, L.fam, L.wt, L.it, L.px, tk); m.textBaseline='middle';
      const mt = m.measureText(s), asc=Math.max(mt.actualBoundingBoxAscent||0, L.px*0.75), desc=Math.max(mt.actualBoundingBoxDescent||0, L.px*0.45);
      const tw = measureT(m,s,L.px,tk), half=Math.max(tw/2, mt.actualBoundingBoxLeft||0, mt.actualBoundingBoxRight||0)+L.px*0.1;
      const pad=Math.ceil(L.px*1.3), padX=Math.ceil(L.px*1.7), Wc=Math.ceil(half*2+padX*2), Hc=Math.ceil(asc+desc+pad*2), cy=pad+asc;
      if (shine.width!==Wc||shine.height!==Hc){ shine.width=Wc; shine.height=Hc; } else { m.setTransform(1,0,0,1,0,0); m.clearRect(0,0,Wc,Hc); }
      m.setTransform(1,0,0,1,0,0); m.globalCompositeOperation='source-over'; m.globalAlpha=1;
      // 1) tvar písmen
      setFont(m, L.fam, L.wt, L.it, L.px, tk); m.textAlign='center'; m.textBaseline='middle'; m.fillStyle='#fff';
      fillT(m, s, Wc/2, cy, L.px, tk);
      // 2) měkké šikmé světlo jen do písmen
      m.globalCompositeOperation='source-in';
      const bw=Math.max(L.px*0.9, tw*0.26), sk=Hc*0.3, x=-bw-sk + ph*(Wc+2*bw+2*sk);
      const g=m.createLinearGradient(x-bw/2,0,x+bw/2,0);
      g.addColorStop(0,'rgba(255,248,225,0)'); g.addColorStop(0.3,'rgba(255,248,225,.35)'); g.addColorStop(0.5,'rgba(255,255,255,1)'); g.addColorStop(0.7,'rgba(255,248,225,.35)'); g.addColorStop(1,'rgba(255,248,225,0)');
      m.setTransform(1,0,-sk/Hc,1,sk/2,0); m.fillStyle=g; m.fillRect(-sk,0,Wc+sk*2,Hc);
      m.setTransform(1,0,0,1,0,0); m.globalCompositeOperation='source-over';
      // 2b) zdroj pro záři KOLEM slova: písmena „ztlustlá“ obrysem + širší proužek → záře přesahuje mimo písmo
      const hc=haloCtx(Wc,Hc);
      setFont(hc, L.fam, L.wt, L.it, L.px, tk); hc.textAlign='center'; hc.textBaseline='middle'; hc.fillStyle='#fff'; hc.strokeStyle='#fff';
      hc.lineJoin='round'; hc.lineWidth=L.px*0.42; fillT(hc, s, Wc/2, cy, L.px, tk);
      try{ hc.strokeText(s, Wc/2, cy); }catch(e){}
      hc.globalCompositeOperation='source-in';
      const hb=bw*1.6, hx=-hb-sk + ph*(Wc+2*hb+2*sk), hg=hc.createLinearGradient(hx-hb/2,0,hx+hb/2,0);
      hg.addColorStop(0,'rgba(255,250,235,0)'); hg.addColorStop(0.5,'rgba(255,255,255,1)'); hg.addColorStop(1,'rgba(255,250,235,0)');
      hc.setTransform(1,0,-sk/Hc,1,sk/2,0); hc.fillStyle=hg; hc.fillRect(-sk,0,Wc+sk*2,Hc);
      hc.setTransform(1,0,0,1,0,0); hc.globalCompositeOperation='source-over';
      // 3) záře kolem: hladké rozmazání po krocích (zmenšit/zvětšit vždy jen 2×) → žádné rovné hrany ani bloky
      const lv=Math.max(2,Math.min(6,Math.round(Math.log2(L.px*0.3))));
      // rozmazání po krocích, vodorovně víc než svisle (lx > ly) → záře se rozlije do stran bez tvaru písmen
      const blurAt=(lx,ly,tag)=>{ let src=halo, w=Wc, h=Hc; const dn=[]; const n=Math.max(lx,ly);
        for (let i=1;i<=n;i++){ const nw=i<=lx?Math.max(1,Math.ceil(w/2)):w, nh=i<=ly?Math.max(1,Math.ceil(h/2)):h; const o=shineBlur(tag+'d'+i,nw,nh); o.c.drawImage(src,0,0,w,h,0,0,nw,nh); dn.push(o); src=o.cv; w=nw; h=nh; }
        for (let i=n-1;i>=1;i--){ const t=dn[i-1]; const o=shineBlur(tag+'u'+i,t.w,t.h); o.c.drawImage(src,0,0,w,h,0,0,t.w,t.h); src=o.cv; w=t.w; h=t.h; }
        return {cv:src,w,h}; };
      // záře hlavně do výšky (svisle víc než vodorovně) → svítí jen kolem proužku, ne celé slovo
      const wide=blurAt(lv+1,lv,'w'), near=blurAt(Math.max(1,lv-1),Math.max(1,lv-1),'n');   // do stran i do výšky, víc do stran
      c.save(); c.shadowColor='transparent'; c.globalCompositeOperation='lighter'; c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
      const A=a*((S.opacity??100)/100)*env;
      c.globalAlpha=Math.min(1,A*0.75); c.drawImage(wide.cv,0,0,wide.w,wide.h,-Wc/2,-cy,Wc,Hc);   // jemná záře kolem slova
      c.globalAlpha=A*0.45; c.drawImage(near.cv,0,0,near.w,near.h,-Wc/2,-cy,Wc,Hc);              // bližší záře
      c.globalAlpha=A*0.55; c.drawImage(shine,0,0,Wc,Hc,-Wc/2,-cy,Wc,Hc);       // světlo v písmenech
      c.restore();
    }
  }
  c.restore();
}

// ---------- 3D perspektiva (cedule otočená v prostoru) ----------
let vframe=null, vfc=null, vfOk=false, vfFor=null, vfN=0;
let gblur=null, gbc=null, gblur2=null, gbc2=null;
const SB={}; function shineBlur(i,w,h){ let o=SB[i]; if(!o){ const cv2=document.createElement('canvas'); o=SB[i]={cv:cv2,c:cv2.getContext('2d')}; } if (o.cv.width!==w||o.cv.height!==h){ o.cv.width=w; o.cv.height=h; } else o.c.clearRect(0,0,w,h); o.w=w; o.h=h; o.c.imageSmoothingEnabled=true; o.c.imageSmoothingQuality='high'; return o; }
let halo=null, haloC=null; function haloCtx(w,h){ if(!halo){ halo=document.createElement('canvas'); haloC=halo.getContext('2d'); } if (halo.width!==w||halo.height!==h){ halo.width=w; halo.height=h; } else { haloC.setTransform(1,0,0,1,0,0); haloC.clearRect(0,0,w,h); } haloC.setTransform(1,0,0,1,0,0); haloC.globalCompositeOperation='source-over'; return haloC; }
let shine=null, shineC=null; function shineCtx(){ if(!shine){ shine=document.createElement('canvas'); shine.width=64; shine.height=64; shineC=shine.getContext('2d'); } return shineC; }
let layer=null, lctx=null, layer2=null, l2ctx=null, gmask=null, gmctx=null, pm=null, pmc=null, t3=null, t3c=null;
E.lastLines=null; E.lastBox=null;
// 3D vrstva má po stranách rezervu (PAD) – řádky posunuté kinetikou za okraj videa se tak neuříznou dřív, než se nakloní
const padX=()=>E._gl()?Math.round(cv.width*0.6):0;
function glowMaskCtx(){ const W2=cv.width+2*padX(); if(!gmask||gmask.width!==W2||gmask.height!==cv.height){ gmask=document.createElement('canvas'); gmask.width=W2; gmask.height=cv.height; gmctx=gmask.getContext('2d'); } return gmctx; }
function aux(){ if(!pm||pm.width!==cv.width||pm.height!==cv.height){ pm=document.createElement('canvas'); pm.width=cv.width; pm.height=cv.height; pmc=pm.getContext('2d'); t3=document.createElement('canvas'); t3.width=cv.width; t3.height=cv.height; t3c=t3.getContext('2d'); } }
function layerCtx(){
  const W2=cv.width+2*padX();
  if (!layer || layer.width!==W2 || layer.height!==cv.height){
    layer=document.createElement('canvas'); layer.width=W2; layer.height=cv.height; lctx=layer.getContext('2d');
    layer2=document.createElement('canvas'); layer2.width=cv.width; layer2.height=cv.height; l2ctx=layer2.getContext('2d');
  }
  return lctx;
}
let band=null;
// 1–2 px proužky s překryvem = žádná viditelná mřížka
function projectAxis(src, dst, bx, by, ang, f, vertical){
  const N = vertical ? cv.width : cv.height;
  const cs=Math.cos(ang), sn=Math.sin(ang);
  const proj = (v, c) => { const V=v-c, Z=-V*sn, s=f/(f+Z); return [c+V*cs*s, s]; };
  dst.imageSmoothingEnabled=true; dst.imageSmoothingQuality='high';
  if (vertical){
    const y0b = band?band[0]:0, hb = band?(band[1]-band[0]):cv.height;
    for (let x0=0;x0<N;x0+=2){
      const [d0,s0]=proj(x0,bx), [d1,s1]=proj(x0+2,bx); if (s0<=0.05||s1<=0.05) continue;
      const s=(s0+s1)/2, L=Math.min(d0,d1), R=Math.max(d0,d1);
      dst.drawImage(src, x0,y0b,2,hb, L, by+(y0b-by)*s, Math.max(R-L,1)+1.0, hb*s);
    }
  } else {
    for (let y0=0;y0<N;y0+=2){
      const [d0,s0]=proj(y0,by), [d1,s1]=proj(y0+2,by); if (s0<=0.05||s1<=0.05) continue;
      const s=(s0+s1)/2, T=Math.min(d0,d1), B=Math.max(d0,d1);
      dst.drawImage(src, 0,y0,cv.width,2, bx-bx*s, T, cv.width*s, Math.max(B-T,1)+1.0);
    }
  }
}
// cedule otočená kolem svislé (tilt) a vodorovné osy (tiltX); vrací [x, y, w] (w = homogenní dělitel)
function proj3(x,y,bx,by,S){
  const f=Math.min(cv.width,cv.height)*(1.7-S.persp/100);
  const ay=E.tiltOf(S)*Math.PI/180, ax=S.tiltX*Math.PI/180, ca=Math.cos(ay), sa=Math.sin(ay), cb=Math.cos(ax), sb=Math.sin(ax);
  const X=x-bx, Y=y-by, X2=X*ca, Z1=-X*sa, Y2=Y*cb-Z1*sb, Z2=Y*sb+Z1*cb, w=Math.max(0.05,(f+Z2)/f);
  return [bx+X2/w, by+Y2/w, w];
}
function projPoint(x,y,bx,by,S){ if (!E._gl()) return projPointStrip(x,y,bx,by,S); const r=proj3(x,y,bx,by,S); return [r[0],r[1]]; }
function projPointStrip(x,y,bx,by,S){
  const f=Math.min(cv.width,cv.height)*(1.7-S.persp/100);
  const ay=E.tiltOf(S)*Math.PI/180, ax=-S.tiltX*Math.PI/180;
  let V=x-bx, Z=-V*Math.sin(ay), s=f/(f+Z); x=bx+V*Math.cos(ay)*s; y=by+(y-by)*s;
  V=y-by; Z=-V*Math.sin(ax); s=f/(f+Z); y=by+V*Math.cos(ax)*s; x=bx+(x-bx)*s;
  return [x,y];
}
// ---------- WebGL: promítnutí vrstvy jako jeden perspektivní čtyřúhelník (přesné, bez proužků a mřížky) ----------
let GL=null, glTried=false;
function glInit(){
  const c=document.createElement('canvas'); c.width=c.height=2; let gl=null;
  try{ gl=c.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false,preserveDrawingBuffer:true,depth:false,stencil:false}); }catch(e){}
  if (!gl) return null;
  const sh=(t,src)=>{ const o=gl.createShader(t); gl.shaderSource(o,src); gl.compileShader(o); return o; };
  const pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec4 p;attribute vec2 uv;varying vec2 v;void main(){v=uv;gl_Position=p;}'));
  gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 v;uniform sampler2D t;void main(){gl_FragColor=texture2D(t,v);}'));
  gl.linkProgram(pr); if (!gl.getProgramParameter(pr,gl.LINK_STATUS)) return null; gl.useProgram(pr);
  const buf=gl.createBuffer(), tex=gl.createTexture(), lp=gl.getAttribLocation(pr,'p'), lu=gl.getAttribLocation(pr,'uv');
  gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,4,gl.FLOAT,false,24,0); gl.enableVertexAttribArray(lu); gl.vertexAttribPointer(lu,2,gl.FLOAT,false,24,16);
  gl.bindTexture(gl.TEXTURE_2D,tex);
  for (const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true); gl.disable(gl.BLEND);
  let lost=false; c.addEventListener('webglcontextlost',e=>{ e.preventDefault(); lost=true; });
  return { get ok(){ return !lost; }, c, gl };
}
E._gl=()=>{ if (!glTried){ glTried=true; GL=glInit(); } return GL&&GL.ok&&!E.forceStrips?GL:null; };
let bandCv=null, bandC=null;
// src (celé plátno) → jen pás s textem → promítnout do dst (dst může mít vlastní transformaci = vycentrování / pojistka)
function glProject(src, dst, bx, by, S){
  const g=E._gl(), gl=g.gl, Wd=cv.width, Hd=cv.height;
  const y0=Math.max(0,Math.floor(band?band[0]:0)), y1=Math.min(Hd,Math.ceil(band?band[1]:Hd)), hb=Math.max(1,y1-y0);
  if (!bandCv){ bandCv=document.createElement('canvas'); bandC=bandCv.getContext('2d'); }
  const Ws=src.width, P=(Ws-Wd)/2;
  if (bandCv.width!==Ws || bandCv.height!==hb){ bandCv.width=Ws; bandCv.height=hb; } else bandC.clearRect(0,0,Ws,hb);
  bandC.drawImage(src,0,y0,Ws,hb,0,0,Ws,hb);
  const q=[[-P,y0],[Wd+P,y0],[Wd+P,y1],[-P,y1]].map(([x,y])=>proj3(x,y,bx,by,S));
  const xs=q.map(a=>a[0]), ys=q.map(a=>a[1]);
  // jen viditelná část (plátno videa) – co je za okrajem, stejně vidět není
  const mx=Wd*0.5, my=Hd*0.25;   // rezerva pro vycentrování v project3D
  const rx=Math.max(-mx,Math.floor(Math.min(...xs))), ry=Math.max(-my,Math.floor(Math.min(...ys)));
  const rx2=Math.min(Wd+mx,Math.ceil(Math.max(...xs))), ry2=Math.min(Hd+my,Math.ceil(Math.max(...ys)));
  const rw=Math.max(1,rx2-rx), rh=Math.max(1,ry2-ry);
  if (g.c.width<rw || g.c.height<rh){ g.c.width=Math.max(g.c.width,rw); g.c.height=Math.max(g.c.height,rh); }
  gl.viewport(0,0,rw,rh); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bandCv);
  const uv=[[0,0],[1,0],[1,1],[0,1]], d=[];
  for (const i of [0,1,2,0,2,3]){ const [x,y,w]=q[i]; d.push(((x-rx)/rw*2-1)*w,(1-(y-ry)/rh*2)*w,0,w,uv[i][0],uv[i][1]); }
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STREAM_DRAW); gl.drawArrays(gl.TRIANGLES,0,6);
  dst.drawImage(g.c,0,g.c.height-rh,rw,rh,rx,ry,rw,rh);
}
E.projPoint=projPoint;
function projectLayer(src, dst, bx, by, S){
  if (E._gl()) return glProject(src,dst,bx,by,S);
  const f = Math.min(cv.width,cv.height) * (1.7 - S.persp/100);
  const ay=E.tiltOf(S)*Math.PI/180, ax=S.tiltX*Math.PI/180;
  if (ay && ax){ t3c.setTransform(1,0,0,1,0,0); t3c.clearRect(0,0,cv.width,cv.height); projectAxis(src,t3c,bx,by,ay,f,true); projectAxis(t3,dst,bx,by,-ax,f,false); }
  else if (ay) projectAxis(src,dst,bx,by,ay,f,true); else projectAxis(src,dst,bx,by,-ax,f,false);
}
function project3D(src, bx, by, S, target){
  const L=E.lastLines;
  if (L && L.length){
    let y0=Math.min(...L.map(l=>l.y-l.px*1.6)), y1=Math.max(...L.map(l=>l.y+l.px*1.6));
    // slova při příletu / rotaci / se stínem můžou být mimo řádky → pásmo rozšířit, ať se nic neořízne
    if (E._band && E._band[1]>E._band[0]){ y0=Math.min(y0,E._band[0]); y1=Math.max(y1,E._band[1]); }
    band=[Math.max(0,y0),Math.min(cv.height,y1)];
  } else band=null;
  aux();
  target.save(); target.setTransform(1,0,0,1,0,0);
  if (L && L.length){
    const x0=Math.min(...L.map(l=>l.x0)), x1=Math.max(...L.map(l=>l.x0+l.total));
    const ly0=Math.min(...L.map(l=>l.y-l.px*0.5)), ly1=Math.max(...L.map(l=>l.y+l.px*0.5));
    const cxs=[[x0,ly0],[x1,ly0],[x1,ly1],[x0,ly1]].map(([x,y])=>projPoint(x,y,bx,by,S)[0]);
    const px0=Math.min(...cxs), px1=Math.max(...cxs);
    const want=(x0+x1)/2, got=(px0+px1)/2; target.translate(want-got,0);
    const pw=Math.abs(px1-px0), maxW=cv.width*0.9;
    E.lastBoxX={l:Math.min(px0,px1)+(want-got), r:Math.max(px0,px1)+(want-got), w:pw};
  }
  // záře: promítnout masku hlavních slov, rozostřit a podložit
  if (E._glowUsed){
    pmc.setTransform(1,0,0,1,0,0); pmc.clearRect(0,0,cv.width,cv.height); projectLayer(gmask,pmc,bx,by,S);
    // rozostřená záře přes stín (funguje i v Safari bez ctx.filter): obrázek mimo plátno, jeho stín na místě
    // rozmazání zmenšením a zvětšením (bez triku se stínem – Safari ho na iPhonu kreslil posunutě jako ostrou kopii)
    const blur=Math.max(3,cv.width*0.012*(0.4+S.glow/100)*2), k=Math.max(3,Math.round(blur/2));
    if (!gblur){ gblur=document.createElement('canvas'); gbc=gblur.getContext('2d'); gblur2=document.createElement('canvas'); gbc2=gblur2.getContext('2d'); }
    const w1=Math.max(1,Math.ceil(cv.width/k)), h1=Math.max(1,Math.ceil(cv.height/k)), w2=w1*2, h2=h1*2;
    if (gblur.width!==w1||gblur.height!==h1){ gblur.width=w1; gblur.height=h1; } else gbc.clearRect(0,0,w1,h1);
    if (gblur2.width!==w2||gblur2.height!==h2){ gblur2.width=w2; gblur2.height=h2; } else gbc2.clearRect(0,0,w2,h2);
    gbc.imageSmoothingEnabled=true; gbc.imageSmoothingQuality='high'; gbc.drawImage(pm,0,0,w1,h1);
    gbc2.imageSmoothingEnabled=true; gbc2.imageSmoothingQuality='high'; gbc2.drawImage(gblur,0,0,w2,h2);
    target.save(); target.imageSmoothingEnabled=true; target.imageSmoothingQuality='high';
    target.globalAlpha=Math.min(1,0.45+S.glow/100*0.5); target.drawImage(gblur2,0,0,cv.width,cv.height);
    target.globalAlpha*=0.6; target.drawImage(gblur,0,0,cv.width,cv.height);
    target.restore();
  }
  projectLayer(src,target,bx,by,S);
  target.restore();
}

// ---------- OVERLAY (nálepky / obrázky přes video) ----------
// o = {id, src:Image|Video|null, emoji?, s, e, x, y (střed v %), w (% šířky), rot, anim, wiggle, above}
E.drawOverlay = (c, o, t) => {
  if (o.emoji) return;   // emoji nálepky už aplikace nemá (ani ze starých projektů)
  if (t<o.s || t>o.e) return;
  const W=cv.width, H=cv.height, since=t-o.s, left=o.e-t;
  // překrytí celého videa (náhrada úseku): přes celý obraz, bez animace a bez wiggle, pod titulky
  if (o.full){
    const s=o.src; if (!s) return; const iw=s.naturalWidth||s.videoWidth, ih=s.naturalHeight||s.videoHeight; if (!iw||!ih) return;
    const sc=Math.max(W/iw,H/ih), dw=iw*sc, dh=ih*sc;
    c.save(); c.setTransform(1,0,0,1,0,0); c.globalAlpha=1; try{ c.drawImage(s,(W-dw)/2,(H-dh)/2,dw,dh); }catch(e){} c.restore(); return;
  }
  const q=clamp(since/0.5), eo=1-Math.pow(2,-10*q), fadeOut=clamp(left/0.25);
  let a=fadeOut, sx=1, sy=1, dx=0, dy=0, r=(o.rot||0)*Math.PI/180;
  let wpx=W*o.w/100;
  const tro=o.trk?E.trkOffset(o.trk,t):null; if (tro && E.tracks[o.trk].scale) wpx*=tro.k;
  let h = wpx; if (o.src && (o.src.naturalWidth||o.src.videoWidth)) { const iw=o.src.naturalWidth||o.src.videoWidth, ih=o.src.naturalHeight||o.src.videoHeight; h=wpx*ih/iw; }
  switch(o.anim){
    case 'standard': a*=eo; sx=sy=0.9+0.1*eo; break;
    case '3d': { const ang=(1-eo)*Math.PI/2; sx=Math.cos(ang); a*=clamp(q*3); dy=-(1-eo)*h*0.05; break; }
    case 'carousel3d': { const ang=since*1.6; sx=Math.cos(ang); a*=clamp(q*3)*(0.55+0.45*Math.abs(Math.cos(ang))); break; }
    case 'circle': { const ang=since*2.2, rr=Math.min(W,H)*0.06; dx=Math.cos(ang)*rr; dy=Math.sin(ang)*rr; a*=clamp(q*3); break; }
    case 'cards': { const e=easeBack(q); dy=(1-e)*H*0.25; r+=(1-e)*0.5; a*=clamp(q*3); break; }
    case 'pop': { const e=easeBack(q); sx=sy=Math.max(0.001,e); a*=clamp(q*4); break; }
    case 'slideR': dx=-(1-eo)*W*0.7; a*=clamp(q*3); break;
    case 'slideL': dx=(1-eo)*W*0.7; a*=clamp(q*3); break;
    case 'slideU': dy=(1-eo)*H*0.5; a*=clamp(q*3); break;
    case 'slideD': dy=-(1-eo)*H*0.5; a*=clamp(q*3); break;
    default: a*=eo;
  }
  if (o.wiggle){
    // síla (wigAmt) a rychlost (wigSpd) třesení, 50 = původní wiggle
    const A=(o.wigAmt??50)/50, F=(o.wigSpd??50)/50;
    r+=Math.sin(t*6*F+o.id)*0.06*A; dx+=Math.sin(t*9*F+o.id)*W*0.004*A; dy+=Math.cos(t*7*F+o.id)*W*0.004*A;
  }
  if (a<=0.001) return;
  const cx=W*(o.x+(tro?tro.dx:0))/100+dx, cy=H*(o.y+(tro?tro.dy:0))/100+dy;
  // karta: zaoblené rohy, rámeček, stín – vykreslí se zvlášť a pak (případně) nakloní do 3D
  const card = o.src && ((o.rad||0)>0 || (o.stW||0)>0 || (o.shA||0)>0 || o.tiltX || o.tiltY);
  if (card){
    const C=ovCard(o,wpx,h), tl=(o.tiltX||o.tiltY) && E._gl();
    if (tl){
      // rohy karty → otočení / zvětšení animace → 3D náklon kolem středu overlaye → WebGL čtyřúhelník
      const S3={tilt:o.tiltY||0, tiltX:o.tiltX||0, persp:o.persp??55}, cs=Math.cos(r), sn=Math.sin(r);
      const q=[[-C.w/2,-C.h/2],[C.w/2,-C.h/2],[C.w/2,C.h/2],[-C.w/2,C.h/2]].map(([x,y])=>{ x*=sx; y*=sy; return proj3(cx+x*cs-y*sn, cy+x*sn+y*cs, cx, cy, S3); });
      c.save(); c.setTransform(1,0,0,1,0,0); c.globalAlpha=a; glQuad(C.cv,c,q); c.restore();
    } else {
      c.save(); c.globalAlpha=a; c.translate(cx,cy); c.rotate(r); c.scale(sx,sy); c.drawImage(C.cv,-C.w/2,-C.h/2,C.w,C.h); c.restore();
    }
    return;
  }
  c.save(); c.globalAlpha=a; c.translate(cx,cy); c.rotate(r); c.scale(sx,sy);
  if (o.emoji){ c.font=`${wpx}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign='center'; c.textBaseline='middle'; c.fillText(o.emoji,0,0); }
  else if (o.src){ try{ c.drawImage(o.src,-wpx/2,-h/2,wpx,h); }catch(e){} }
  c.restore();
};
// overlay jako „karta“: obrázek / video se zaoblenými rohy, rámečkem a stínem (v rezervě kolem, ať se stín neořízne)
function ovCard(o,w,h){
  const m=Math.min(w,h), rad=Math.min(m/2, m*(o.rad||0)/100), sw=(o.stW||0)/100*m*0.12, shA=(o.shA||0)/100, shD=(o.shD??30)/100;
  const blur=shA>0? m*(0.04+0.12*shA) : 0, off=shA>0? m*0.12*shD : 0, pad=Math.ceil(blur*1.6+off+sw+2);
  const CW=Math.ceil(w+2*pad), CH=Math.ceil(h+2*pad);
  const cvx=o._card||(o._card=document.createElement('canvas')); if (cvx.width!==CW||cvx.height!==CH){ cvx.width=CW; cvx.height=CH; }
  const x=cvx.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,CW,CH);
  const path=()=>{ x.beginPath(); if (x.roundRect) x.roundRect(pad,pad,w,h,rad); else { const R=rad; x.moveTo(pad+R,pad); x.arcTo(pad+w,pad,pad+w,pad+h,R); x.arcTo(pad+w,pad+h,pad,pad+h,R); x.arcTo(pad,pad+h,pad,pad,R); x.arcTo(pad,pad,pad+w,pad,R); x.closePath(); } };
  if (shA>0){ x.save(); x.shadowColor=`rgba(0,0,0,${Math.min(0.95,0.35+0.6*shA)})`; x.shadowBlur=blur; x.shadowOffsetY=off; x.fillStyle='#000'; path(); x.fill(); x.restore(); }
  x.save(); path(); x.clip(); try{ x.drawImage(o.src,pad,pad,w,h); }catch(e){} x.restore();
  if (sw>0){ x.save(); x.lineWidth=sw; x.strokeStyle=o.stC||'#ffffff'; path(); x.stroke(); x.restore(); }
  return {cv:cvx, w:CW, h:CH};
}
// obecný perspektivní čtyřúhelník přes WebGL: src (celý obrázek) na 4 body q=[[x,y,w]...] (LH, PH, PD, LD)
function glQuad(src,dst,q){
  const g=E._gl(); if (!g) return false; const gl=g.gl;
  const xs=q.map(p=>p[0]), ys=q.map(p=>p[1]);
  const rx=Math.floor(Math.min(...xs)), ry=Math.floor(Math.min(...ys)), rw=Math.max(1,Math.ceil(Math.max(...xs))-rx), rh=Math.max(1,Math.ceil(Math.max(...ys))-ry);
  if (rw>cv.width*3||rh>cv.height*3) return false;
  if (g.c.width<rw || g.c.height<rh){ g.c.width=Math.max(g.c.width,rw); g.c.height=Math.max(g.c.height,rh); }
  gl.viewport(0,0,rw,rh); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  const uv=[[0,0],[1,0],[1,1],[0,1]], d=[];
  for (const i of [0,1,2,0,2,3]){ const [x,y,w]=q[i]; d.push(((x-rx)/rw*2-1)*w,(1-(y-ry)/rh*2)*w,0,w,uv[i][0],uv[i][1]); }
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STREAM_DRAW); gl.drawArrays(gl.TRIANGLES,0,6);
  dst.drawImage(g.c,0,g.c.height-rh,rw,rh,rx,ry,rw,rh);
  return true;
}
// pořadí vrstev: overlaye mají z (vyšší = víc vpředu), titulky jsou jeden blok se z = E.capZ
E.capZ=0;
E.ovZ=o=>o.z!=null? o.z : (o.above?1:-1)+E.overlays.indexOf(o)*0.001;
E.ovAbove=o=>E.ovZ(o)>(E.capZ||0);
E.ovOrder=()=>E.overlays.filter(o=>!o.full).sort((a,b)=>E.ovZ(a)-E.ovZ(b));
E.overlayBox = (o) => { const W=cv.width,H=cv.height, tro=o.trk&&E._t!=null?E.trkOffset(o.trk,E._t):null; let wpx=W*o.w/100; if (tro && E.tracks[o.trk].scale) wpx*=tro.k; let h=wpx; if (o.src&&(o.src.naturalWidth||o.src.videoWidth)){ const iw=o.src.naturalWidth||o.src.videoWidth, ih=o.src.naturalHeight||o.src.videoHeight; h=wpx*ih/iw; } return {cx:W*(o.x+(tro?tro.dx:0))/100, cy:H*(o.y+(tro?tro.dy:0))/100, w:wpx, h}; };

// ---------- TEXT ZA POSTAVOU ----------
// E.personMask(t) vrací canvas s maskou postavy (bílá = postava) nebo null; vyplňuje ai.js
E.personMask = null;
let pcv=null, pcc=null;
function drawPersonOver(c, mask){
  if (!pcv||pcv.width!==cv.width||pcv.height!==cv.height){ pcv=document.createElement('canvas'); pcv.width=cv.width; pcv.height=cv.height; pcc=pcv.getContext('2d'); }
  pcc.globalCompositeOperation='source-over'; pcc.clearRect(0,0,cv.width,cv.height);
  pcc.filter=`blur(${Math.max(1,Math.round(cv.width*0.002))}px)`; pcc.drawImage(mask,0,0,cv.width,cv.height); pcc.filter='none';
  pcc.globalCompositeOperation='source-in'; pcc.drawImage(vid,0,0,cv.width,cv.height);
  c.drawImage(pcv,0,0);
}


// ================= STŘIH VIDEA (úseky) =================
// E.clips = úseky zdrojového videa v pořadí [{s,e,tr}] (zdrojový čas). null = celé video.
// Titulky, zóny i overlaye žijí ve VÝSLEDNÉM čase (po střihu). tr = přechod na začátku úseku ('flash2' | 'none').
E.clips=null; E.srcDur=0;
E.clipList=()=> (E.clips&&E.clips.length)? E.clips : [{s:0,e:E.srcDur||0,tr:'none'}];
E.outDur=()=>E.clipList().reduce((a,c)=>a+(c.e-c.s),0);
E.out2src=t=>{ const L=E.clipList(); let o=0; for (const c of L){ const d=c.e-c.s; if (t<o+d || c===L[L.length-1]) return Math.min(c.e, c.s+Math.max(0,t-o)); o+=d; } return 0; };
E.src2out=ts=>{ const L=E.clipList(); let o=0; for (const c of L){ if (ts<c.s) return o; if (ts<c.e) return o+(ts-c.s); o+=c.e-c.s; } return o; };
E.clipStarts=()=>{ const L=E.clipList(); const r=[]; let o=0; for (const c of L){ r.push(o); o+=c.e-c.s; } return r; };
// přechody: 2× negativní záblesk kolem střihu
E.TRANSITIONS=[['none','Žádný'],['push','Vcucnutí (zoom + čočka)'],['swing','Zahoupání'],['whip','Švihnutí do strany'],['flashw','Bílý záblesk'],['flash2','2× negativní záblesk']];
E.TRDEF={push:0.5,swing:0.6,whip:0.45,flashw:0.4,flash2:0.12};   // výchozí délka přechodu (s)
E.TRDIR=new Set(['push','swing','whip']);                          // přechody se směrem (doprava / doleva)
E.drawTransition=(c,W,H,t)=>{
  const L=E.clipList(); if (L.length<2) return;
  const st=E.clipStarts();
  for (let k=1;k<L.length;k++){
    const tr=L[k].tr||'none', T=st[k], d=t-T, D=L[k].trDur||E.TRDEF[tr]||0.12; if (tr==='none' || d<-Math.max(0.5,D) || d>Math.max(0.5,D)) continue;
    // AE přechody (WebGL): pohyb kamery s motion blurem kolem střihu
    if (window.FX && FX.has(tr)){ FX.apply(c,W,H,tr,d,D,{dir:L[k].trDir||'r'}); continue; }
    if (tr==='flash2'){
      // délka přechodu D (s): dva krátké negativy – jeden před střihem, druhý hned po něm
      const f=D/4;
      const on=(d>=-D/2&&d<-D/2+f)||(d>=0&&d<f);
      if (on){ c.save(); c.setTransform(1,0,0,1,0,0); c.globalAlpha=1; c.shadowColor='transparent'; c.globalCompositeOperation='difference'; c.fillStyle='#fff'; c.fillRect(0,0,W,H); c.restore(); }
    }
  }
};


// ================= KLÍČOVÉ SNÍMKY VIDEA (zoom, posun, průhlednost) =================
// E.kf=[{t, z(zoom %), x, y (posun v % šířky/výšky), op (%), ease}] – ease = průběh z předchozího klíčového snímku do tohoto
E.kf=[];
E.EASES=[['tok2','Tok 2']];   // zatím jen jeden průběh (ten, který se osvědčil)
const tok2=q=>q<0.5?8*q*q*q*q:1-8*Math.pow(1-q,4);   // plynulý rozjezd → rychlý střed → měkký dojezd
const EASE={ tok2, tok1:tok2, quad:tok2, lin:tok2 };
E.EASE=EASE;
E.kfAt=t=>{
  const K=E.kf; if (!K||!K.length) return null;
  if (t<=K[0].t) return K[0]; if (t>=K[K.length-1].t) return K[K.length-1];
  for (let i=1;i<K.length;i++){ const b=K[i]; if (t<=b.t){ const a=K[i-1], q=(t-a.t)/Math.max(1e-6,b.t-a.t), e=EASE.tok2(Math.max(0,Math.min(1,q)));
    return {z:a.z+(b.z-a.z)*e, x:a.x+(b.x-a.x)*e, y:a.y+(b.y-a.y)*e, op:a.op+(b.op-a.op)*e}; } }
  return K[K.length-1];
};
// ================= SLEDOVÁNÍ OBJEKTU (tracking) =================
// E.tracks[id] = {id, t0, t[], x[], y[], s[], c[] (syrová dráha, čas = čas zdrojového videa), smooth 0–100, scale (měnit velikost s objektem)}
// titulek / overlay s trk:id se posouvá o to, o kolik se objekt na obrazovce posunul od okamžiku t0 (i se zoomem videa)
E.tracks={};
E.objs=[];   // zvýrazněné objekty – viz objs.js
const KF0={z:100,x:0,y:0};
E.trackSm=T=>{ if (!T._sm || T._smK!==T.smooth || T._smN!==T.t.length){ T._sm=window.TRK?TRK.smooth(T,T.smooth):null; T._smK=T.smooth; T._smN=T.t.length; } return T._sm; };
E.trkOffset=(id,t)=>{
  const T=E.tracks[id]; if (!T || !window.TRK || !T.t || T.t.length<2) return null;
  const S=E.trackSm(T); if (!S) return null;
  const ts=E.out2src?E.out2src(t):t, a=TRK.at(S,ts), b=TRK.at(S,T.t0);
  const k=E.vxfAt(t)||KF0, k0=E.vxfAt(E.src2out?E.src2out(T.t0):T.t0)||KF0;
  const X=(p,k)=>50+k.x+(p.x*100-50)*k.z/100, Y=(p,k)=>50+k.y+(p.y*100-50)*k.z/100;
  return {dx:X(a,k)-X(b,k0), dy:Y(a,k)-Y(b,k0), k:(a.s/b.s)*(k.z/k0.z), x:X(a,k), y:Y(a,k)};
};
// styl titulku v čase t (se sledováním objektu)
E.styleAt=(p,t)=>{ const S=E.styleOf(p); const m=p&&E.meta[E.keyOf(p)];
  if (m && m.trk && E.tracks[m.trk]){ const o=E.trkOffset(m.trk,t); if (o){ S.posX+=o.dx; S.posY+=o.dy; if (E.tracks[m.trk].scale) S.size*=o.k; } }
  return S; };
// ================= STABILIZACE NA OBJEKT =================
// E.stab = {trk:id, smooth 0–100, scale:false}: video se v každém snímku posune (a jednou provždy přiblíží),
// aby sledovaný objekt (obličej…) stál na obrazovce pořád na stejném místě; s „scale“ i ve stejné velikosti.
E.stab=null;
const stabSm=(T,st)=>{ const key=(st.smooth??5)+'|'+T.t.length+'|'+(st.scale?1:0); if (T._ssK!==key){ T._ss=TRK.smooth(T,st.smooth??5); T._ssK=key; T._sz=null; } return T._ss; };
function stabZoom(T,st,S){
  if (T._sz) return T._sz;
  const p0=TRK.at(S,T.t0); let zs=1;
  for (let i=0;i<S.n;i++){
    const f=st.scale? p0.s/S.s[i] : 1;
    for (const [a,b] of [[p0.x-0.5,S.x[i]-0.5],[p0.y-0.5,S.y[i]-0.5]]){
      const den=f/2-Math.abs(a-f*b); zs=Math.max(zs, den>0.05? 0.5/den : 10);
    }
  }
  T._sz=Math.min(3,zs*1.005); return T._sz;
}
E.stabInfo=()=>{ const st=E.stab, T=st&&E.tracks[st.trk]; if (!T||!window.TRK) return null; const S=stabSm(T,st); return {zoom:stabZoom(T,st,S)}; };
E.stabAt=t=>{
  const st=E.stab; if (!st || !st.trk || !window.TRK) return null; const T=E.tracks[st.trk]; if (!T || !T.t || T.t.length<2) return null;
  const S=stabSm(T,st), zs=stabZoom(T,st,S), ts=E._fT!=null ? E._fT : (E.out2src?E.out2src(t):t);
  const ta=T.t[0], tb=T.t[T.t.length-1], out=ts<ta?ta-ts:ts>tb?ts-tb:0;
  const w=out<=0?1:Math.max(0,1-out/0.35), ww=w*w*(3-2*w); if (ww<=0) return null;   // za koncem sledování plynule zpět
  const p=TRK.at(S,ts), p0=TRK.at(S,T.t0), f=st.scale? p0.s/p.s : 1, Z=zs*f;
  // bod p se má zobrazit tam, kde byl v čase t0 (po přiblížení zs)
  const Tx=zs*(p0.x-0.5)-Z*(p.x-0.5), Ty=zs*(p0.y-0.5)-Z*(p.y-0.5);
  return {z:1+(Z-1)*ww, x:Tx*100*ww, y:Ty*100*ww};
};
// výsledná transformace videa v čase t = klíčové body (zoom/posun/průhlednost) + stabilizace
E.vxfAt=t=>{
  const k=E.kfAt(t), s=E.stabAt(t); if (!s) return k;
  const b=k||{z:100,x:0,y:0,op:100};
  return {z:b.z*s.z, x:b.x+b.z/100*s.x, y:b.y+b.z/100*s.y, op:b.op??100};
};
function drawVideoXf(t, draw){
  const k=E.vxfAt(t);
  if (!k || (k.z===100 && !k.x && !k.y && k.op>=100)){ draw(); return; }
  const W=cv.width, H=cv.height;
  ctx.save(); ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=Math.max(0,Math.min(1,k.op/100));
  ctx.translate(W/2+k.x/100*W, H/2+k.y/100*H); ctx.scale(k.z/100,k.z/100); ctx.translate(-W/2,-H/2);
  draw(); ctx.restore();
}

// ================= HLAVNÍ RENDER =================
E.render = (t, opts={}) => {
  if (!vid || !vid.videoWidth) return;
  E._t=t;
  // přesný čas snímku, který se kreslí (pro stabilizaci): export ho předá, při přehrávání ho hlásí requestVideoFrameCallback
  E._fT = opts.frameT!=null ? opts.frameT : (!opts.frameDraw && !vid.paused && vid._mt!=null && Math.abs(vid._mt-vid.currentTime)<0.25 ? vid._mt : null);
  const F=E.flags;
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.shadowColor='transparent'; ctx.filter='none';
  if (F.transparent) ctx.clearRect(0,0,cv.width,cv.height);
  else if (opts.frameDraw) drawVideoXf(t,()=>opts.frameDraw(ctx,cv.width,cv.height));
  else {
    // čistý podklad + poslední dobrý snímek videa: když iPhone snímek zrovna nedá, nezůstane na plátně starý obraz se starými titulky
    if (!vframe||vframe.width!==cv.width||vframe.height!==cv.height){ vframe=document.createElement('canvas'); vframe.width=cv.width; vframe.height=cv.height; vfc=vframe.getContext('2d'); vfOk=false; }
    if (vfFor!==vid){ vfFor=vid; vfOk=false; }
    const k=E.vxfAt(t), zoomed=!!(k && (k.z!==100 || k.x || k.y || k.op<100));
    // záložní kopie snímku: při zoomu jen občas (jinak by se každý snímek kopíroval dvakrát → sekání na iPhonu)
    vfN=(vfN+1)%8;
    if (vid.readyState>=2 && (!zoomed || !vfOk || vfN===0)){ try{ vfc.drawImage(vid,0,0,cv.width,cv.height); vfOk=true; }catch(e){} }
    ctx.fillStyle='#000'; ctx.fillRect(0,0,cv.width,cv.height);
    if (zoomed){
      // zoom: výřez přímo z plného rozlišení videa (ostré, plynulé), ne zvětšený malý snímek
      const W=cv.width, H=cv.height, sc=Math.max(1,k.z/100), Tx=k.x/100*W, Ty=k.y/100*H;
      const qx0=W/2+(-W/2-Tx)/sc, qy0=H/2+(-H/2-Ty)/sc, qw=W/sc, qh=H/sc;
      ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,k.op/100)); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      const src=vid.readyState>=2?vid:(vfOk?vframe:null);
      if (src){ const sw=src===vid?vid.videoWidth:W, sh=src===vid?vid.videoHeight:H, fx=sw/W, fy=sh/H;
        try{ ctx.drawImage(src, qx0*fx, qy0*fy, qw*fx, qh*fy, 0,0,W,H); }catch(e){ if (vfOk) ctx.drawImage(vframe, qx0, qy0, qw, qh, 0,0,W,H); } }
      ctx.restore();
    } else if (vfOk) ctx.drawImage(vframe,0,0);
  }
  for (const o of E.overlays) if (o.full) E.drawOverlay(ctx,o,t);   // překrytí celého videa = nový základ (pod přechody i titulky)
  if (!F.transparent) E.drawTransition(ctx,cv.width,cv.height,t);
  if (window.OBJ && E.objs && E.objs.length && !F.transparent) OBJ.draw(ctx,cv.width,cv.height,t);   // zvýrazněné objekty (shine, obrys, výplň)
  // overlaye pod titulky
  for (const o of E.ovOrder()) if (!E.ovAbove(o)) E.drawOverlay(ctx,o,t);
  // titulky ve vrstvách: vrstva 1 („pod“) se kreslí první, hlavní vrstva 0 přes ni
  // samostatný mód 3D mix (kostka): vlastní vykreslení titulků
  if (E.G.mix3d && !F.hidden && E.drawMix){ E.lastBox=null; E.lastLines=null; E.drawMix(ctx,t); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.shadowColor='transparent'; for (const o of E.ovOrder()) if (E.ovAbove(o)) E.drawOverlay(ctx,o,t); E.drawWatermark(ctx,cv.width,cv.height); return; }
  const ks=F.hidden?[]:E.pagesAt(t);
  const k=E.pageAt(t);
  if (!ks.length){ E.lastBox=null; E.lastLines=null; for (const o of E.ovOrder()) if (E.ovAbove(o)) E.drawOverlay(ctx,o,t); E.drawWatermark(ctx,cv.width,cv.height); return; }
  let mainLines=null, mainS=null, behind=false;
  for (const kk of ks){
    const r=drawPage(kk,t);
    if (kk===k){ mainLines=r.lines; mainS=r.S; }
    if (r.S.behind!=='off') behind=true;
  }
  E.lastLines=mainLines;
  // text za postavou: přes titulky se znovu nakreslí jen postava z videa
  if (behind && !F.transparent && E.personMask){ const m=E.personMask(t); if (m) drawPersonOver(ctx,m); }
  for (const o of E.ovOrder()) if (E.ovAbove(o)) E.drawOverlay(ctx,o,t);
  E.drawWatermark(ctx,cv.width,cv.height);
  if (opts.box && mainLines) E.drawBox(mainLines,mainS);
};
function drawPage(k,t){
  const p=E.pages[k], S=E.styleAt(p,t);
  const lines=E.layoutPage(p,S); E.lastLines=lines;
  const bx=cv.width*S.posX/100, by=cv.height*S.posY/100;
  const noTilt = !S.tilt && !S.tiltX;
  const direct = noTilt;
  // negativ + 3D náklon: dva průchody – běžná slova se promítnou normálně, negativní hlavní slova se promítnou
  // zvlášť a do videa se vloží „rozdílem“ (negativ) – takže se naklánějí stejně jako ostatní text
  const twoPass = !direct && S.negativ;
  // odchod celého bloku: rychlé zmenšení kolem středu titulku (Base: na 60 % za 0,1 s)
  let bs=1;
  if (S.exitScale!=null && S.fadeOut){ const ex=clamp((p.e-t)/(S.exitDur||0.1)), exs=ex*ex*(3-2*ex); bs=S.exitScale+(1-S.exitScale)*exs; }
  const pass=(mode)=>{
    E._negPass=mode;
    const c = direct ? ctx : layerCtx();
    E._glowUsed=false; E._band=direct?null:[Infinity,-Infinity];
    if (!direct){ const P=padX(); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,c.canvas.width,c.canvas.height); const m=glowMaskCtx(); m.setTransform(1,0,0,1,0,0); m.clearRect(0,0,m.canvas.width,m.canvas.height); c.setTransform(1,0,0,1,P,0); }
    if (bs<0.999){
      const x0=Math.min(...lines.map(L=>L.x0)), x1=Math.max(...lines.map(L=>L.x0+L.total)), y0=Math.min(...lines.map(L=>L.y-L.px*0.5)), y1=Math.max(...lines.map(L=>L.y+L.px*0.5));
      const ccx=(x0+x1)/2, ccy=(y0+y1)/2; c.save(); c.translate(ccx,ccy); c.scale(bs,bs); c.translate(-ccx,-ccy);
    }
    let j=0;
    for (const L of lines){ let x=L.x0; L.ids.forEach((i,jj)=>{ drawWord(c,E.words[i],L,x,L.ws[jj],t,p,S,k,j++); x+=L.ws[jj]+L.sp; }); }
    if (bs<0.999) c.restore();
    if (!direct){
      if (mode==='only'){ ctx.save(); ctx.globalCompositeOperation='difference'; project3D(layer, bx, by, S, ctx); ctx.restore(); }
      else project3D(layer, bx, by, S, ctx);
    }
  };
  if (twoPass){ pass('skip'); pass('only'); } else pass(null);
  E._negPass=null;
  ctx.setTransform(1,0,0,1,0,0);
  return {lines,S};
}

// rámeček kolem vybraného titulku + úchyt (zvětšení) + tužka (úprava textu) + safe zóny
E.drawBox = (lines,S,guides) => {
  if (!lines || !lines.length) { E.lastBox=null; return; }
  const pad=lines[0].px*0.25;
  const x0=Math.min(...lines.map(L=>L.x0))-pad, x1=Math.max(...lines.map(L=>L.x0+L.total))+pad;
  const y0=Math.min(...lines.map(L=>L.y-L.px*0.55))-pad, y1=Math.max(...lines.map(L=>L.y+L.px*0.55))+pad;
  const bx=cv.width*S.posX/100, by=cv.height*S.posY/100;
  let P=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>(S.tilt||S.tiltX)?projPoint(x,y,bx,by,S):[x,y]);
  if (S.tilt||S.tiltX){ const want=(x0+x1)/2, got=(Math.min(...P.map(q=>q[0]))+Math.max(...P.map(q=>q[0])))/2; P=P.map(([x,y])=>[x+want-got,y]); }
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.shadowColor='transparent';
  ctx.lineWidth=Math.max(2,cv.width*0.003); ctx.strokeStyle='rgba(255,255,255,0.9)';
  ctx.beginPath(); P.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.stroke();
  const hr=Math.min(cv.width,cv.height)*0.028;
  const h=[clamp(P[2][0],hr*1.2,cv.width-hr*1.2), clamp(P[2][1],hr*1.2,cv.height-hr*1.2)];
  const pe=[clamp(P[1][0],hr*1.2,cv.width-hr*1.2), clamp(P[1][1],hr*1.2,cv.height-hr*1.2)];
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(h[0],h[1],hr,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#111'; ctx.lineWidth=hr*0.18; ctx.beginPath(); ctx.moveTo(h[0]-hr*0.45,h[1]+hr*0.45); ctx.lineTo(h[0]+hr*0.45,h[1]-hr*0.45); ctx.moveTo(h[0]-hr*0.45,h[1]-hr*0.05); ctx.lineTo(h[0]-hr*0.45,h[1]+hr*0.45); ctx.lineTo(h[0]+hr*0.05,h[1]+hr*0.45); ctx.moveTo(h[0]+hr*0.45,h[1]+hr*0.05); ctx.lineTo(h[0]+hr*0.45,h[1]-hr*0.45); ctx.lineTo(h[0]-hr*0.05,h[1]-hr*0.45); ctx.stroke();
  // tužka = upravit text
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(pe[0],pe[1],hr,0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(pe[0],pe[1]); ctx.rotate(-Math.PI/4); ctx.fillStyle='#111'; ctx.fillRect(-hr*0.5,-hr*0.13,hr*0.85,hr*0.26); ctx.beginPath(); ctx.moveTo(-hr*0.5,-hr*0.13); ctx.lineTo(-hr*0.72,0); ctx.lineTo(-hr*0.5,hr*0.13); ctx.fill(); ctx.restore();
  E.lastBox={h,pe,cx:(P[0][0]+P[2][0])/2,cy:(P[0][1]+P[2][1])/2,P};
  if (guides){
    const W=cv.width,H=cv.height; ctx.strokeStyle='rgba(255,60,60,0.9)'; ctx.setLineDash([W*0.015,W*0.01]); ctx.lineWidth=Math.max(1.5,W*0.002);
    ctx.strokeRect(W*0.06,H*0.12,W*0.88,H*0.68);
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle='rgba(255,60,60,0.9)'; ctx.font=`700 ${W*0.04}px "Inter Tight"`; ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText('TOP SAFE ZONE',W/2,H*0.12-W*0.01); ctx.textBaseline='top'; ctx.fillText('BOTTOM SAFE ZONE',W/2,H*0.80+W*0.01);
  }
  ctx.restore();
};

// ================= POZICE PODLE OBLIČEJE =================
// pro každý titulek: nejnižší spodní hrana obličeje během titulku → posY = clamp(fb·100+12, 60, 74); bez obličeje 64
E.applyFacePositions = () => {
  if (!E.face) return 0; let n=0;
  E.pages.forEach(p=>{
    const key=E.keyOf(p); const m=E.meta[key]=E.meta[key]||{}; m.own=m.own||{};
    if (m.own._manualPos) return;
    let fb=null, fx=null;
    for (let t=p.s; t<=p.e; t+=0.1){ const f=E.face[Math.round(t*10)]; if (f){ fb=Math.max(fb??0,f[3]); fx=(f[0]+f[2])/2; } }
    m.own.posY = fb==null ? 64 : clamp(fb*100+12,60,74);
    if (E.G.faceDodgeX && fx!=null){ m.own.posX = fx<0.38 ? 60 : fx>0.62 ? 40 : 50; } else m.own.posX = 50;
    n++;
  });
  return n;
};

// ================= ZVUKY (SFX) =================
// vygeneruje zvuk do libovolného AudioContextu (živě i do offline exportu)
E.sfxInto = (ac, dest, t0, type, vol) => {
  if (!type || type==='none') return;
  const g=ac.createGain(); g.connect(dest);
  const osc=(tp,f0,f1,dur,v)=>{ const o=ac.createOscillator(); o.type=tp; o.frequency.setValueAtTime(f0,t0); o.frequency.exponentialRampToValueAtTime(f1,t0+dur); const gg=ac.createGain(); gg.gain.setValueAtTime(v*vol,t0); gg.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0+dur+0.02); };
  const noise=(dur,v,hp)=>{ const b=ac.createBuffer(1,Math.ceil(ac.sampleRate*dur),ac.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length); const n=ac.createBufferSource(); n.buffer=b; const f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; const gg=ac.createGain(); gg.gain.value=v*vol; n.connect(f); f.connect(gg); gg.connect(g); n.start(t0); };
  switch(type){
    case 'light': noise(0.03,0.5,3000); osc('square',2200,1200,0.03,0.15); break;
    case 'heavy': noise(0.06,0.8,800); osc('square',500,150,0.06,0.4); break;
    case 'mouse': osc('square',1800,900,0.02,0.3); noise(0.02,0.4,2500); break;
    case 'tick': osc('sine',3000,2500,0.02,0.4); break;
    case 'type': noise(0.04,0.7,1500); osc('triangle',900,400,0.04,0.2); break;
    case 'pop': osc('sine',900,220,0.08,0.5); break;
    case 'whoosh': noise(0.25,0.5,400); break;
    case 'shutter': noise(0.02,0.9,2000); osc('square',1200,600,0.02,0.2); (()=>{ const t1=t0+0.07; const b=ac.createBuffer(1,Math.ceil(ac.sampleRate*0.04),ac.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length); const n=ac.createBufferSource(); n.buffer=b; const gg=ac.createGain(); gg.gain.value=0.7*vol; n.connect(gg); gg.connect(g); n.start(t1); })(); break;
    case 'glitch': for (let i=0;i<5;i++){ const tt=t0+i*0.025; const o=ac.createOscillator(); o.type='square'; o.frequency.setValueAtTime(200+Math.random()*1800,tt); const gg=ac.createGain(); gg.gain.setValueAtTime(0.15*vol,tt); gg.gain.exponentialRampToValueAtTime(0.0001,tt+0.02); o.connect(gg); gg.connect(g); o.start(tt); o.stop(tt+0.025); } break;
    case 'ding': osc('sine',1760,1740,0.5,0.25); osc('sine',2640,2600,0.35,0.1); break;
    case 'swoosh': { const b=ac.createBuffer(1,Math.ceil(ac.sampleRate*0.35),ac.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++){ const x=i/d.length; d[i]=(Math.random()*2-1)*Math.sin(Math.PI*x); } const n=ac.createBufferSource(); n.buffer=b; const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.setValueAtTime(400,t0); f.frequency.exponentialRampToValueAtTime(4000,t0+0.35); const gg=ac.createGain(); gg.gain.value=0.6*vol; n.connect(f); f.connect(gg); gg.connect(g); n.start(t0); break; }
  }
};
// seznam okamžiků, kdy má zaznít zvuk (podle titulků / slov)
E.sfxEvents = () => {
  const ev=[];
  E.pages.forEach(p=>{ const S=E.styleOf(p); if (!S.sfx||S.sfx==='none') return;
    if (E.G.sfxWord){ for (let i=p.a;i<=p.b;i++) ev.push({t:E.words[i].s, type:S.sfx}); } else ev.push({t:p.s, type:S.sfx}); });
  return ev;
};
})();
