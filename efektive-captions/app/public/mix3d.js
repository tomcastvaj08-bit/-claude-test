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
  const pad=Math.ceil(px*0.75), w=tw+pad*2, h=Math.ceil(asc+desc)+pad*2, base=pad+asc;
  c.width=w; c.height=h; set();
  const g=x.createLinearGradient(0,base-asc,0,base+desc*0.3);
  if (kind==='hi'){ g.addColorStop(0,G.mixA||'#ffa21e'); g.addColorStop(1,G.mixB||'#f38b00'); }
  else { g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#d6d8dc'); }
  // měkký atmosférický stín (tmavé písmo pod přední vrstvou, z něj zůstane jen stín)
  x.save(); x.fillStyle='#000';
  x.shadowColor='rgba(0,0,0,0.6)'; x.shadowBlur=px*0.5; x.shadowOffsetY=px*0.09; x.fillText(word,pad,base);
  x.shadowColor='rgba(0,0,0,0.45)'; x.shadowBlur=px*0.18; x.shadowOffsetY=px*0.05; x.fillText(word,pad,base); x.restore();
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

// ---- skutečný let do hloubky: každý řádek se objeví u kamery a pořád jedním směrem letí do dálky
// (k úběžníku nahoře), zmenšuje se, rozmazává a ztrácí. Žádné zastavení, žádné „posouvání nahoru“ zvlášť.
let flowKey='', flow=null;
// odkud slova vylétají: ústa (spodní část obličeje z AI), jinak střed obrazu nad titulky
function mouthAt(t,W,H){ const f=faceAt(t); if (f) return {x:(f[0]+f[2])/2*W, y:(f[1]+(f[3]-f[1])*0.78)*H}; return {x:W*0.5, y:H*0.36}; }
function faceAt(t){ if (!E.face) return null; const ts=E.out2src?E.out2src(t):t; const i=Math.round(ts*10); return E.face[i]||E.face[i-1]||E.face[i+1]||null; }
const Z0=-0.62;                                   // po příletu je slovo chvilku blíž ke kameře, pak ustupuje do dálky
const zOf=(vz,a)=>Z0 + vz*a*(1+0.5*a);           // hloubka roste plynule a lehce zrychluje → pohyb nikdy nestojí
const sOf=z=>1/(1+Math.max(-0.6,z));
function layoutFlow(W,H){
  const {lines}=build(), G=E.G;
  const key=cacheKey+'|'+W+'|'+H+'|'+(G.mixSize||100)+'|'+(G.mixY??60)+'|'+(E.face?E.face.length:0)+'|'+(G.mixSpeed||100);
  if (key===flowKey && flow) return flow; flowKey=key;
  const base=W*0.165*(G.mixSize||100)/100, lh=L=>base*L.size*0.8;
  // úběžník jen kousek nad místem dosednutí → řádky letí skoro jen do dálky, jen lehce stoupají
  const land=H*((G.mixY??60)/100), vpY=land-H*0.13;
  const gaps=[]; for (let i=1;i<lines.length;i++){ const g=lines[i].s-lines[i-1].s; if (g>0.05&&g<2) gaps.push(g); }
  gaps.sort((a,b)=>a-b); const g=gaps.length? gaps[Math.floor(gaps.length*0.5)] : 0.4;
  // rychlost do hloubky: za běžný rozestup řádků se předchozí řádek zmenší asi na 60 % (je „za“ novým)
  const aSet=0.3; let lo=0.1, hi=8; for (let i=0;i<30;i++){ const m=(lo+hi)/2; if (sOf(zOf(m,aSet+g))<=0.67) hi=m; else lo=m; }
  const vz=hi*(G.mixSpeed||100)/100;
  for (const L of lines){
    L.land=land; L.faceB=null;
    const f=faceAt(L.s+0.3);
    if (f){ const fb=f[3]*H; L.faceB=fb; if (land-lh(L)*0.6<fb) L.land=Math.min(H*0.9, fb+lh(L)*0.75); }
  }
  flow={vz,base,vpY,lh}; lines.forEach(L=>{ L.vpY=L.land-H*0.13; }); return flow;
}
E.drawMix=(c,t)=>{
  const {lines}=build(); if (!lines.length) return;
  const W=c.canvas.width, H=c.canvas.height, G=E.G, op=(G.opacity??100)/100;
  const {vz,base,vpY}=layoutFlow(W,H), cxp=W*0.5;
  c.save();
  // nejdřív vzdálené (staré), pak blízké (nové) – nové leží přes staré
  for (const L of lines){
    const age=t-L.s; if (age<0 || age>6) continue;
    const z=zOf(vz,age), S=sOf(z);
    if (S<0.34) continue;
    const y=L.vpY+(L.land-L.vpY)*S;
    // průhlednost: rychle naběhne, v dálce plynule mizí; u obličeje zmizí dřív, než do něj vjede
    let A=smooth(age/0.22) * smooth((S-0.34)/0.4) * (0.35+0.65*smooth((S-0.45)/0.5));
    if (L.faceB!=null && age>0.5) A*=clamp((y-L.faceB)/(base*0.5)+0.3);
    A*=op; if (A<=0.01) continue;
    const blur=Math.max(0,(S-1.0))*9 + Math.max(0,(0.92-S))*16;   // u kamery i v dálce rozmazané
    const px=base*L.size, words=L.ids.map(txt), sp=words.map(w=>sprite(w,L.kind,px));
    const gap=px*(L.kind==='serif'?0.22:0.2), tw=sp.reduce((a,o)=>a+o.tw,0)+gap*(sp.length-1);
    let fit=1; if (tw>W*0.88) fit=W*0.88/tw;
    let x0=W*L.indent; if (x0+tw*fit>W*0.95) x0=Math.max(W*0.04, W*0.95-tw*fit);
    // perspektiva: řádek se stahuje k úběžníku uprostřed
    const lcx=x0+tw*fit/2, SS=S*fit;   // žádný posun do strany – jen let do dálky
    let xx=lcx-tw*SS/2;
    sp.forEach((o,wi)=>{
      const wt=E.words[L.ids[wi]], wa=t-(wt.s-0.08);
      const ww=o.tw*SS, wx=xx; xx+=ww+gap*SS;
      if (wa<0) return;
      // slovo přilétá od diváka (obří a rozmazané) a jedním plynulým pohybem letí do obrazovky
      const qa=smooth(wa/0.2);
      const dw=o.w*SS, dh=o.h*SS, dx=wx+ww/2-(o.pad+o.tw/2)*SS, dy=y-o.base*SS+o.asc*SS*0.35;
      c.globalAlpha=A*qa;
      drawBlur(c,o,dx,dy,dw,dh,blur);
    });
  }
  c.restore();
};
E.mixInvalidate=()=>{ cacheKey=''; };
})();
