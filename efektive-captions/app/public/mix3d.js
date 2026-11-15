// ================= MÓD „3D MIX“ (kostka s otazníkem) =================
// Věrně podle předlohy: každé slovo přiletí zespodu z „kamery“ (velké, rozmazané → ostré),
// řádky se skládají těsně pod sebe, starší řádky plynule odjíždějí nahoru do dálky, rozmazávají se a mizí.
// Písma: tučné bezpatkové (bílé), tenká patková kurzíva pro spojovací slova, jedno oranžové klíčové slovo.
(function(){
"use strict";
const E=window.E;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const hash=n=>{ const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const ease3=q=>1-Math.pow(1-clamp(q),3), ease4=q=>1-Math.pow(1-clamp(q),4), smooth=q=>{ q=clamp(q); return q*q*(3-2*q); };
const FONTS={
  sans:{fam:'"Inter Tight", Arial, sans-serif', wt:700, it:false, ls:-0.03},
  hi:{fam:'"Inter Tight", Arial, sans-serif', wt:700, it:false, ls:-0.03},
  serif:{fam:'"Playfair Display", Georgia, serif', wt:400, it:true, ls:-0.005},
};
const STOP=new Set(('a i k o s u v z ve ze na do od po pro při za je jsou byl být to ten ta ty ti že se si mě mi tě ti mu jí jak co by aby ale nebo když tak už jen ještě taky také tady tam teď tohle toto tom této toho jsem jsme jste jsi máš mám má mít můžeš může můžu chci chceš jako i mě tě jeho její jejich náš váš svůj svoje and the a an of to in it is it\'s you i how this than').split(' '));
const isFn=t=>{ const w=(t||'').toLowerCase().replace(/[.,!?…"“”]/g,''); return STOP.has(w); };
let cacheKey='', plan=null;

// řádky (1–2 slova) a scény (max 4 řádky, nová po větě / pauze)
function build(){
  const W=E.words, seed=E.G.mixSeed||1;
  const key=W.length+'|'+(W[0]?W[0].id:0)+'|'+(W.length?W[W.length-1].e:0)+'|'+seed+'|'+W.map(w=>w.t).join(' ')+'|'+(E.zones||[]).length;
  if (key===cacheKey && plan) return plan; cacheKey=key;
  const lines=[]; let cur=null;
  for (let i=0;i<W.length;i++){
    const w=W[i], prev=W[i-1];
    if (E.inZone && E.inZone(w)){ cur=null; continue; }
    const gap=prev? w.s-prev.e : 9, endPrev=prev && /[.!?…,]$/.test(prev.raw||'');
    const fn=isFn(w.t), long=(w.t||'').length>=7;
    // spojovací slova se drží spolu („how you“), plnovýznamová slova spíš samostatně nebo po dvou krátkých
    const a=cur?W[cur.ids[0]]:null, la=a?(a.t||'').length:0, lb=(w.t||'').length;
    // spojit: dvě spojovací slova („how you“), nebo dvě krátká, kde první je plnovýznamové („can do“, „3D text“)
    const join = cur && cur.ids.length===1 && !long && !cur.long && gap<0.35 && !endPrev &&
      ((cur.fn && fn) || (!cur.fn && la+lb<=7));
    if (!join){ cur={ids:[i],fn,long}; lines.push(cur); } else { cur.ids.push(i); cur.fn=cur.fn&&fn; }
  }
  // hlavní slova z běžných titulků (stejná logika jako hlavní řádek ve Stylu 1)
  const emSet=new Set(); try{ for (const p of E.pages){ for (const g of E.groupsOf(p,E.styleOf(p))) if (g.em) g.ids.forEach(i=>emSet.add(i)); } }catch(e){}
  const scenes=[]; let sc=null;
  lines.forEach((L,k)=>{
    const f=W[L.ids[0]], prevL=lines[k-1], pw=prevL?W[prevL.ids[prevL.ids.length-1]]:null;
    const brk=!sc || sc.lines.length>=40 || (pw && (f.s-pw.e>0.6 || /[.!?…]$/.test(pw.raw||'')));
    if (brk){ sc={lines:[]}; scenes.push(sc); }
    sc.lines.push(L);
  });
  scenes.forEach((s,si)=>{
    const first=W[s.lines[0].ids[0]], lastL=s.lines[s.lines.length-1], last=W[lastL.ids[lastL.ids.length-1]];
    s.s=first.s-0.06; s.e=last.e+0.7;
    if (scenes[si-1]) scenes[si-1].e=Math.min(scenes[si-1].e, s.s+0.25);
    // jedno oranžové klíčové slovo: nejdelší plnovýznamový řádek
    const txtOf=L=>L.ids.map(i=>W[i].t).join(' ');
    // oranžově: jedno slovo na každou čtveřici řádků – zvýrazněné uživatelem, jinak nejvýraznější plnovýznamový řádek (ne první v čtveřici)
    const HS=new Set();
    for (let g0=0; g0<s.lines.length; g0+=5){
      const grp=s.lines.slice(g0,g0+5);
      let cand=grp.filter((L,j)=>!L.fn && (g0+j>0||grp.length===1)); if (!cand.length) cand=grp.filter(L=>!L.fn); if (!cand.length) cand=grp;
      let H=grp.find(L=>L.ids.some(i=>W[i].em));
      if (!H){ H=cand[0]; const sc2=L=>txtOf(L).replace(/\s/g,'').length + (/\d/.test(txtOf(L))?3:0) + (L.ids.some(i=>emSet.has(i))?1:0); for (const L of cand) if (sc2(L)>sc2(H)) H=L; }
      HS.add(H);
    }
    s.lines.forEach((L,j)=>{
      L.j=j; L.s=W[L.ids[0]].s-0.06;
      L.kind = HS.has(L) ? 'hi' : L.fn ? 'serif' : 'sans';
      const r=hash(seed*31+si*7+j);
      L.size = L.kind==='serif' ? 1.0+0.25*r : L.kind==='hi' ? 0.95+0.2*r : 1.05+0.35*r;
      if (txtOf(L).length<=4) L.size*=1.25;              // krátká slova („do“, „this“) větší
      // odsazení zleva – střídavě, jako v předloze
      L.indent = [0.06,0.22,0.10,0.30,0.14][(j+si+Math.floor(seed))%5] + (r-0.5)*0.06;
    });
  });
  plan={lines,scenes}; return plan;
}
function txt(i){ const w=E.words[i]; return E.G.punct?(w.raw||w.t):w.t; }

// obrázek slova v mezipaměti: jemný přechod bílá → světle šedá (oranžová), měkký tmavý stín kolem
const SPR=new Map();
function sprite(word,kind,px){
  const G=E.G, key=word+'|'+kind+'|'+Math.round(px)+'|'+(G.mixA||'')+(G.mixB||'');
  let o=SPR.get(key); if (o) return o;
  const st=FONTS[kind], c=document.createElement('canvas'), x=c.getContext('2d');
  const font=`${st.it?'italic ':''}${st.wt} ${px}px ${st.fam}`, ls=(st.ls*px).toFixed(2)+'px';
  const set=()=>{ x.font=font; try{ x.letterSpacing=ls; }catch(e){} x.textBaseline='alphabetic'; x.textAlign='left'; };
  set();
  const m=x.measureText(word), asc=Math.max(m.actualBoundingBoxAscent||0,px*0.75), desc=Math.max(m.actualBoundingBoxDescent||0,px*0.25);
  const tw=Math.ceil(Math.max(m.width, (m.actualBoundingBoxRight||0)+(m.actualBoundingBoxLeft||0)));
  const pad=Math.ceil(px*0.45), w=tw+pad*2, h=Math.ceil(asc+desc)+pad*2, base=pad+asc;
  c.width=w; c.height=h; set();
  const g=x.createLinearGradient(0,base-asc,0,base+desc*0.3);
  if (kind==='hi'){ g.addColorStop(0,G.mixA||'#ffa21e'); g.addColorStop(1,G.mixB||'#f38b00'); }
  else { g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#d6d8dc'); }
  // měkký atmosférický stín (tmavé písmo pod přední vrstvou, z něj zůstane jen stín)
  x.save(); x.shadowColor='rgba(0,0,0,0.38)'; x.shadowBlur=px*0.32; x.shadowOffsetY=px*0.03; x.fillStyle='#000'; x.fillText(word,pad,base); x.restore();
  x.fillStyle=g; x.fillText(word,pad,base);
  o={c,w,h,pad,tw,base,asc}; SPR.set(key,o); if (SPR.size>200) SPR.delete(SPR.keys().next().value);
  return o;
}
// rozmazání bez filtru (i Safari): zmenšit a zase zvětšit
let bc=null, bx=null;
function drawBlur(c,o,dx,dy,dw,dh,blur){
  if (blur<0.5){ c.drawImage(o.c,dx,dy,dw,dh); return; }
  const k=1+blur*0.45, w=Math.max(2,Math.round(o.w/k)), h=Math.max(2,Math.round(o.h/k));
  if (!bc){ bc=document.createElement('canvas'); bx=bc.getContext('2d'); }
  if (bc.width<w||bc.height<h){ bc.width=Math.max(bc.width,w); bc.height=Math.max(bc.height,h); }
  bx.clearRect(0,0,w,h); bx.imageSmoothingEnabled=true; bx.imageSmoothingQuality='medium'; bx.drawImage(o.c,0,0,w,h);
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high'; c.drawImage(bc,0,0,w,h,dx,dy,dw,dh);
}

// ---- plynulý let stejnou rychlostí: každý řádek se objeví a pak pořád stejnou rychlostí odjíždí nahoru do dálky ----
let flowKey='', flow=null;
function faceAt(t){ if (!E.face) return null; const ts=E.out2src?E.out2src(t):t; return E.face[Math.round(ts*10)]||E.face[Math.round(ts*10)-1]||E.face[Math.round(ts*10)+1]||null; }
function layoutFlow(W,H){
  const {lines}=build(), G=E.G;
  const key=cacheKey+'|'+W+'|'+H+'|'+(G.mixSize||100)+'|'+(G.mixY??60)+'|'+(E.face?E.face.length:0)+'|'+(G.mixSpeed||100);
  if (key===flowKey && flow) return flow; flowKey=key;
  const base=W*0.165*(G.mixSize||100)/100, lh=L=>base*L.size*0.74;
  // jedna stálá rychlost pro celé video: průměrná výška řádku / průměrný rozestup řádků
  let gaps=[]; for (let i=1;i<lines.length;i++){ const g=lines[i].s-lines[i-1].s; if (g>0.05&&g<1.5) gaps.push(g); }
  const avgGap=gaps.length? gaps.reduce((a,b)=>a+b,0)/gaps.length : 0.45;
  const avgLh=lines.length? lines.reduce((a,L)=>a+lh(L),0)/lines.length : base*0.8;
  const v=clamp(avgLh/avgGap, H*0.07, H*0.32)*(G.mixSpeed||100)/100;
  let prev=null;
  for (const L of lines){
    let land=H*((G.mixY??60)/100);
    // obličej: řádek dosedá pod obličej (AI), a než k obličeji doletí, zmizí
    const f=faceAt(L.s); L.faceTop=null;
    if (f){ const fb=f[3]*H, ft=f[1]*H; if (land-lh(L)<fb+base*0.2){ land=Math.min(H*0.9, fb+lh(L)*0.75+base*0.2); } L.faceTop=fb+base*0.1; }
    let ys=land;
    if (prev){ const py=prev.ys-v*(L.s-prev.s); ys=Math.max(land, py+(lh(prev)*0.5+lh(L)*0.5)); }
    L.ys=Math.min(ys, H*0.95); prev=L;
  }
  flow={v,base,lh}; return flow;
}
E.drawMix=(c,t)=>{
  const {lines}=build(); if (!lines.length) return;
  const W=c.canvas.width, H=c.canvas.height, G=E.G, op=(G.opacity??100)/100;
  const {v,base}=layoutFlow(W,H);
  const LIFE=3.2;
  c.save();
  for (const L of lines){
    const age=t-L.s; if (age<0 || age>LIFE) continue;
    // stálý let: poloha, zmenšení (vzdálenost), rozmazání a zeslábnutí rostou plynule s věkem řádku
    let y=L.ys - v*age;
    const dist=age*0.55, scD=Math.exp(-0.16*dist*1.8);
    const blurD=Math.max(0,age-0.9)*2.2;
    let aD=1-smooth((age-1.3)/(LIFE-1.3));
    if (L.faceTop!=null){ aD*=clamp((y-L.faceTop)/(base*0.6)); }   // nevjede do obličeje
    if (y<H*0.06) aD*=clamp((y-H*0.0)/(H*0.06));
    if (aD<=0.01) continue;
    const px=base*L.size, words=L.ids.map(txt), sp=words.map(w=>sprite(w,L.kind,px));
    const gap=px*(L.kind==='serif'?0.22:0.2), tw=sp.reduce((a,o)=>a+o.tw,0)+gap*(sp.length-1);
    let fit=1; if (tw*scD>W*0.9) fit=W*0.9/(tw*scD);
    const S0=scD*fit;
    let x0=W*L.indent; if (x0+tw*S0>W*0.95) x0=Math.max(W*0.04, W*0.95-tw*S0);
    const cxp=W*0.5; x0=cxp+(x0-cxp)*Math.exp(-0.1*age);   // perspektiva: v dálce ke středu
    let xx=x0;
    sp.forEach((o,wi)=>{
      const wt=E.words[L.ids[wi]], wa=t-(wt.s-0.08);
      const ww=o.tw*S0; const wx=xx; xx+=ww+gap*S0;
      if (wa<0) return;
      // dynamické objevení: z mírně většího a rozmazaného → ostré (bez zastavení, řádek pořád letí)
      const q=smooth(wa/0.55), qa=smooth(wa/0.3);
      const sIn=1+(1-q)*0.45, yIn=(1-q)*base*0.35, bIn=(1-q)*6;
      const S=S0*sIn, A=aD*qa*op; if (A<=0.01) return;
      const dw=o.w*S, dh=o.h*S;
      const dx=wx+ww/2-(o.pad+o.tw/2)*S, dy=y+yIn-o.base*S+o.asc*S*0.35;
      c.globalAlpha=A;
      drawBlur(c,o,dx,dy,dw,dh,bIn+blurD);
    });
  }
  c.restore();
};
E.mixInvalidate=()=>{ cacheKey=''; };
})();
