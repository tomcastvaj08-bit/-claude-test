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
  sans:{fam:'"Inter Tight", Arial, sans-serif', wt:900, it:false},
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
    const brk=!sc || sc.lines.length>=4 || (pw && (f.s-pw.e>0.7 || /[.!?…]$/.test(pw.raw||'')));
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

// obrázek slova (písmo s přechodem bílá → světle šedá / oranžová) – v mezipaměti
const SPR=new Map();
function sprite(word,kind,px){
  const G=E.G, key=word+'|'+kind+'|'+Math.round(px)+'|'+(G.mixA||'')+(G.mixB||'');
  let o=SPR.get(key); if (o) return o;
  const st=kind==='hi'?FONTS.sans:FONTS[kind], c=document.createElement('canvas'), x=c.getContext('2d');
  const font=`${st.it?'italic ':''}${st.wt} ${px}px ${st.fam}`; x.font=font; try{ x.letterSpacing=(kind==='serif'?-0.01:-0.035)*px+'px'; }catch(e){}
  const pad=Math.ceil(px*0.25), w=Math.ceil(x.measureText(word).width)+pad*2, h=Math.ceil(px*1.45)+pad*2;
  c.width=w; c.height=h; x.font=font; try{ x.letterSpacing=(kind==='serif'?-0.01:-0.035)*px+'px'; }catch(e){}
  x.textBaseline='middle'; x.textAlign='left';
  const g=x.createLinearGradient(0,h/2-px*0.45,0,h/2+px*0.45);
  if (kind==='hi'){ g.addColorStop(0,G.mixA||'#ffb12a'); g.addColorStop(1,G.mixB||'#ff7a00'); }
  else { g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#d4d7de'); }
  x.fillStyle=g; x.fillText(word,pad,h/2);
  o={c,w,h,pad,tw:w-pad*2}; SPR.set(key,o); if (SPR.size>160) SPR.delete(SPR.keys().next().value);
  return o;
}
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
  const sc=scenes.find(s=>t>=s.s && t<s.e); if (!sc) return;
  const W=c.canvas.width, H=c.canvas.height, m=Math.min(W,H), G=E.G;
  const base=m*0.145*(G.mixSize||100)/100, cx=W*(G.posX??50)/100, focusY=H*((G.mixY??46)/100);
  const vis=sc.lines.filter(L=>t>=L.s); if (!vis.length) return;
  const lh=L=>base*L.size*(L.kind==='serif'?0.95:0.86);
  const n=vis.length, op=(G.opacity??100)/100;
  // konec scény: všechno odletí dozadu (zmenší se, rozmaže a zmizí)
  const outQ=clamp((t-(sc.e-0.32))/0.32), outE=outQ*outQ;
  // „kamera“: každý nový řádek posune starší nahoru a do dálky + stálý pomalý drift dozadu
  const settle=q=>eExpo((t-vis[q].s)/0.5);
  const drift=(t-sc.s)*0.06;
  c.save();
  for (let idx=0; idx<n; idx++){
    const L=vis[idx];
    let d=drift*0.6, y=focusY;
    for (let q=idx+1;q<n;q++){ const k=settle(q); y-=(lh(vis[q])*0.5+lh(vis[q-1])*0.5)*0.88*k; d+=k; }
    d+=outE*2.2;
    const scD=Math.pow(0.84,d), aD=clamp(1.25-0.42*d)*(1-outE*0.9), blurD=Math.max(0,d-0.6)*2.2+outE*5;
    if (aD<=0.01) continue;
    const yy=focusY+(y-focusY)*Math.pow(0.95,d)-drift*base*0.35;
    const px=base*L.size, words=L.ids.map(txt);
    const sp=words.map(w=>sprite(w,L.kind,px));
    const gap=px*0.24; let tw=sp.reduce((a,o)=>a+o.tw,0)+gap*(sp.length-1);
    let fit=1; if (tw*scD>W*0.9) fit=W*0.9/(tw*scD);
    const lineS=scD*fit, half=tw*lineS/2;
    const lx=clamp(cx+L.side*W*0.26, W*0.05+half, Math.max(W*0.05+half, W*0.95-half));
    let xx=lx-half;
    sp.forEach((o,wi)=>{
      const wt=E.words[L.ids[wi]], age=t-(wt.s-0.06);
      const ww=o.tw*lineS, wcx=xx+ww/2; xx+=ww+gap*lineS;
      if (age<0) return;
      // příjezd slova: zespodu, velké, rozmazané (u kamery) → zmenší se, zaostří a usadí
      const q=eExpo(age/0.42), qa=eOut(age/0.18);
      const sIn=1+(1-q)*1.5, yIn=(1-q)*base*1.6, bIn=(1-q)*9;
      const S=lineS*sIn, A=aD*qa*op; if (A<=0.01) return;
      const dw=o.w*S, dh=o.h*S, dx=wcx-dw/2, dy=yy+yIn-dh/2;
      c.globalAlpha=A;
      const blur=bIn+blurD;
      // jemný stín jen u ostrého písma
      if (blur<1.5){ c.shadowColor='rgba(0,0,0,0.28)'; c.shadowBlur=px*S*0.18; c.shadowOffsetY=px*S*0.03; }
      else c.shadowColor='transparent';
      drawBlur(c,o,dx,dy,dw,dh,blur);
      c.shadowColor='transparent';
    });
  }
  c.restore();
};
E.mixInvalidate=()=>{ cacheKey=''; };
})();
