// ================= MÓD „3D MIX“ (kostka s otazníkem) =================
// Samostatný styl titulků jako v ukázce: slova přilétají z hloubky (z kamery), skládají se pod sebe,
// střídají písma (tučné bílé / kurzíva / oranžové zvýraznění) a starší řádky ujíždějí do dálky.
// Nic dalšího v appce nemění – zapíná se v záložce s kostkou.
(function(){
"use strict";
const E=window.E;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const hash=n=>{ const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const eOut=q=>1-Math.pow(1-clamp(q),3), eExpo=q=>q>=1?1:1-Math.pow(2,-9*clamp(q));
const FONTS={
  sans:{fam:'"Inter Tight", Arial, sans-serif', wt:800, it:false},
  serif:{fam:'"Libre Baskerville", Georgia, serif', wt:700, it:true},
};
const STOP=new Set(('a i k o s u v z ve ze na do od po pro při za je jsou to ten ta že se si mě mi tě ti jak co by aby ale nebo když tak už jen and the a an of to in it is it\'s you i').split(' '));
let cacheKey='', plan=null;

// rozdělení slov na řádky (1–2 slova) a scény (nová scéna po větě / pauze / 4 řádcích)
function build(){
  const W=E.words, seed=E.G.mixSeed||1, key=W.length+'|'+(W[0]?W[0].id:0)+'|'+(W.length?W[W.length-1].e:0)+'|'+seed+'|'+W.map(w=>w.t).join(' ').length+'|'+(E.zones||[]).length;
  if (key===cacheKey && plan) return plan; cacheKey=key;
  const lines=[]; let cur=null;
  for (let i=0;i<W.length;i++){
    const w=W[i], prev=W[i-1];
    if (E.inZone && E.inZone(w)){ cur=null; continue; }
    const long=(w.t||'').length>=6;
    const gap=prev? w.s-prev.e : 9;
    const endPrev=prev && /[.!?…]$/.test(prev.raw||'');
    if (!cur || cur.ids.length>=2 || long || (cur.long) || gap>0.45 || endPrev){ cur={ids:[i],long}; lines.push(cur); }
    else cur.ids.push(i);
  }
  // scény
  const scenes=[]; let sc=null;
  lines.forEach((L,k)=>{
    const f=W[L.ids[0]], prevL=lines[k-1], pw=prevL?W[prevL.ids[prevL.ids.length-1]]:null;
    const brk=!sc || sc.lines.length>=5 || (pw && (f.s-pw.e>0.7 || /[.!?…]$/.test(pw.raw||'')));
    if (brk){ sc={lines:[]}; scenes.push(sc); }
    sc.lines.push(L); L.sc=sc;
  });
  scenes.forEach((s,si)=>{
    const first=W[s.lines[0].ids[0]], lastL=s.lines[s.lines.length-1], last=W[lastL.ids[lastL.ids.length-1]];
    s.s=first.s-0.05; s.e=last.e+0.55; s.k=si;
    s.lines.forEach((L,j)=>{
      L.s=W[L.ids[0]].s-0.05; L.j=j;
      const r=hash(seed*31+si*7+j);
      // styl: nejdelší / výrazné slovo oranžově, jinak střídání tučné bílé a kurzívy
      const word=L.ids.map(i=>W[i].t).join(' ');
      const strong=L.ids.some(i=>(W[i].t||'').length>=6 && !STOP.has((W[i].t||'').toLowerCase())) || W[L.ids[0]].em;
      L.strong=strong; L.kind = (j%2===(si%2) ? 'sans' : 'serif');
      if (L.kind==='serif' && word.length>12) L.kind='sans';
      L.size = L.kind==='hi' ? 1.25+0.3*hash(seed+si*13+j*3) : L.kind==='serif' ? 0.95+0.25*hash(seed+si*5+j) : 0.85+0.3*hash(seed*7+si+j*11);
      L.side = (hash(seed*3+si*17+j*5)-0.5);      // posun do strany
    });
    // v každé scéně právě jedno oranžové zvýraznění: výrazné slovo (nejdelší), jinak nejdelší řádek
    const cand=s.lines.filter(L=>L.strong); const pool=cand.length?cand:s.lines;
    const H=pool.reduce((a,b)=>(b.ids.map(i=>W[i].t).join('').length>a.ids.map(i=>W[i].t).join('').length?b:a));
    H.kind='hi'; H.size=1.3+0.25*hash(seed+si*13);
    s.lines.forEach(L=>{ if (L!==H && L.kind==='serif' && L.ids.map(i=>W[i].t).join(' ').length>12) L.kind='sans'; if (L!==H) L.size = L.kind==='serif' ? 0.95+0.2*hash(seed+si*5+L.j) : 0.85+0.25*hash(seed*7+si+L.j*11); });
    // konec scény před začátkem další
    if (scenes[si-1]) scenes[si-1].e=Math.min(scenes[si-1].e, s.s+0.02);
  });
  plan={lines,scenes};
  return plan;
}

function txt(i){ const w=E.words[i]; return E.G.punct?(w.raw||w.t):w.t; }

// obrázek slova – v mezipaměti: písmo s přechodem (bílá → světle šedá), atmosférický stín,
// u zvýraznění 3D hloubka ve stejné barvě, jemný odlesk a lehce zaoblené hrany
const SPR=new Map();
const LS={sans:-0.045, serif:-0.02, hi:-0.045};
function sprite(word,kind,px){
  const G=E.G, key=word+'|'+kind+'|'+Math.round(px)+'|'+(G.mixA||'')+(G.mixB||'');
  let o=SPR.get(key); if (o) return o;
  const st=kind==='hi'?FONTS.sans:FONTS[kind], c=document.createElement('canvas'), x=c.getContext('2d');
  const font=`${st.it?'italic ':''}${st.wt} ${px}px ${st.fam}`, ls=LS[kind]*px+'px';
  x.font=font; try{ x.letterSpacing=ls; }catch(e){}
  const tw=Math.ceil(x.measureText(word).width), ex=kind==='hi'?px*0.09:0;
  const pad=Math.ceil(px*0.55+ex), w=tw+pad*2, h=Math.ceil(px*1.3)+pad*2, cy=h/2-ex*0.3;
  c.width=w; c.height=h;
  const set=(cx)=>{ cx.font=font; try{ cx.letterSpacing=ls; }catch(e){} cx.textBaseline='middle'; cx.textAlign='left'; cx.lineJoin='round'; };
  set(x);
  const grad=(cx,dark)=>{ const g=cx.createLinearGradient(0,cy-px*0.45,0,cy+px*0.45);
    if (kind==='hi'){ g.addColorStop(0,dark?shade(G.mixA||'#ffb12a',0.62):(G.mixA||'#ffb12a')); g.addColorStop(1,dark?shade(G.mixB||'#ff7a00',0.55):(G.mixB||'#ff7a00')); }
    else { g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#cfd3da'); } return g; };
  // 1) atmosférický stín (měkký, tmavý, kolem celého slova i hloubky)
  // tmavé písmo se stínem přesně pod zadní vrstvou – překryje ho hloubka / čelo, zůstane jen měkký stín kolem
  x.save(); x.shadowColor='rgba(0,0,0,0.5)'; x.shadowBlur=px*0.34; x.shadowOffsetY=px*0.05; x.fillStyle='#000'; x.fillText(word,pad+ex*0.6,cy+ex); x.restore();
  // 2) 3D hloubka (jen zvýraznění): kopie šikmo vpravo dolů, tmavší stejná barva
  if (ex>0){ const n=Math.max(4,Math.round(ex)); x.fillStyle=grad(x,true); x.strokeStyle=x.fillStyle; x.lineWidth=px*0.035;
    for (let i=n;i>=1;i--){ const q=i/n; x.fillText(word,pad+ex*q*0.6,cy+ex*q); x.strokeText(word,pad+ex*q*0.6,cy+ex*q); } }
  // 3) čelo písmen: přechod + lehce zaoblené hrany (tenký obrys stejnou barvou se zaoblenými rohy)
  x.fillStyle=grad(x,false); x.strokeStyle=x.fillStyle; x.lineWidth=px*0.035;
  x.fillText(word,pad,cy); x.strokeText(word,pad,cy);
  // 4) jemný hladký odlesk v horní části písmen
  const t=document.createElement('canvas'); t.width=w; t.height=h; const tc=t.getContext('2d'); set(tc);
  tc.fillStyle='#fff'; tc.lineWidth=px*0.035; tc.strokeStyle='#fff'; tc.fillText(word,pad,cy); tc.strokeText(word,pad,cy);
  tc.globalCompositeOperation='source-in';
  const gl=tc.createLinearGradient(0,cy-px*0.5,0,cy+px*0.1); gl.addColorStop(0,'rgba(255,255,255,'+(kind==='hi'?0.5:0.35)+')'); gl.addColorStop(0.45,'rgba(255,255,255,0.08)'); gl.addColorStop(1,'rgba(255,255,255,0)');
  tc.fillStyle=gl; tc.fillRect(0,0,w,h); x.drawImage(t,0,0);
  o={c,w,h,pad,tw,cy}; SPR.set(key,o); if (SPR.size>160) SPR.delete(SPR.keys().next().value);
  return o;
}
function shade(hex,f){ const n=parseInt(String(hex).slice(1),16); const r=Math.round((n>>16&255)*f), g=Math.round((n>>8&255)*f), b=Math.round((n&255)*f); return `rgb(${r},${g},${b})`; }
// rozmazání bez filtru (funguje i v Safari): zmenšit a zase zvětšit
let bc=null, bx=null;
function drawBlur(c,o,dx,dy,dw,dh,blur){
  if (blur<0.6){ c.drawImage(o.c,dx,dy,dw,dh); return; }
  const k=1+blur*0.5, w=Math.max(2,Math.round(o.w/k)), h=Math.max(2,Math.round(o.h/k));
  if (!bc){ bc=document.createElement('canvas'); bx=bc.getContext('2d'); }
  if (bc.width<w||bc.height<h){ bc.width=Math.max(bc.width,w); bc.height=Math.max(bc.height,h); }
  bx.clearRect(0,0,w,h); bx.imageSmoothingEnabled=true; bx.imageSmoothingQuality='low'; bx.drawImage(o.c,0,0,w,h);
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high'; c.drawImage(bc,0,0,w,h,dx,dy,dw,dh);
}

E.drawMix=(c,t)=>{
  const {scenes}=build(); if (!scenes.length) return;
  // scéna dobíhá ještě chvíli po svém konci (plynule odletí dozadu), zatímco další už přilétá
  const OUT=0.6, list=scenes.filter(s=>t>=s.s && t<s.e+OUT);
  for (const sc of list) drawScene(c,sc,t,OUT);
};
function drawScene(c,sc,t,OUT){
  const W=c.canvas.width, H=c.canvas.height, m=Math.min(W,H), G=E.G;
  const base=m*0.145*(G.mixSize||100)/100, cx=W*(G.posX??50)/100, focusY=H*((G.mixY??46)/100);
  const vis=sc.lines.filter(L=>t>=L.s); if (!vis.length) return;
  const lh=L=>base*L.size*(L.kind==='serif'?0.95:0.86);
  const n=vis.length, op=(G.opacity??100)/100;
  // konec scény: všechno odletí dozadu (zmenší se, rozmaže a zmizí)
  // odchod scény začne až po doletu posledního řádku (a trvá max 0,6 s)
  const lastL=sc.lines[sc.lines.length-1], oS=Math.max(sc.e-0.15, lastL.s+0.5);
  const outQ=clamp((t-oS)/OUT), outE=outQ*outQ*(3-2*outQ);
  // „kamera“: každý nový řádek posune starší nahoru a do dálky + stálý pomalý drift dozadu
  const settle=q=>{ const z=clamp((t-vis[q].s)/0.9); return 1-Math.pow(1-z,4); };
  const drift=(t-sc.s)*0.045;
  c.save();
  for (let idx=0; idx<n; idx++){
    const L=vis[idx];
    let d=drift*0.6, y=focusY;
    for (let q=idx+1;q<n;q++){ const k=settle(q); y-=(lh(vis[q])*0.5+lh(vis[q-1])*0.5)*0.78*k; d+=k*0.85; }
    d+=outE*2.2;
    const scD=Math.pow(0.86,d), aD=clamp(1.3-0.32*d)*(1-outE), blurD=Math.max(0,d-0.5)*1.8+outE*6;
    if (aD<=0.01) continue;
    const yy=focusY+(y-focusY)*Math.pow(0.95,d)-drift*base*0.35;
    const px=base*L.size, words=L.ids.map(txt);
    const sp=words.map(w=>sprite(w,L.kind,px));
    const gap=px*0.17; let tw=sp.reduce((a,o)=>a+o.tw,0)+gap*(sp.length-1);
    let fit=1; if (tw*scD>W*0.9) fit=W*0.9/(tw*scD);
    const lineS=scD*fit, half=tw*lineS/2;
    const lx=clamp(cx+L.side*W*0.26, W*0.05+half, Math.max(W*0.05+half, W*0.95-half));
    let xx=lx-half;
    sp.forEach((o,wi)=>{
      const wt=E.words[L.ids[wi]], age=t-(wt.s-0.06);
      const ww=o.tw*lineS, wcx=xx+ww/2; xx+=ww+gap*lineS;
      if (age<0) return;
      // příjezd slova: zespodu, velké, rozmazané (u kamery) → zmenší se, zaostří a usadí
      const z=clamp(age/0.75), q=1-Math.pow(1-z,4), qa=eOut(age/0.3);   // pomalý měkký dojezd
      const sIn=1+(1-q)*1.4, yIn=(1-q)*base*1.5, bIn=(1-q)*8;
      const S=lineS*sIn, A=aD*qa*op; if (A<=0.01) return;
      const dw=o.w*S, dh=o.h*S, dx=wcx-(o.pad+o.tw/2)*S, dy=yy+yIn-o.cy*S;
      c.globalAlpha=A; c.shadowColor='transparent';
      drawBlur(c,o,dx,dy,dw,dh,bIn+blurD);
    });
  }
  c.restore();
};
E.mixInvalidate=()=>{ cacheKey=''; };
})();
