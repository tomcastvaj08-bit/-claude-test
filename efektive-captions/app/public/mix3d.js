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

E.drawMix=(c,t)=>{
  const {scenes}=build(); if (!scenes.length) return;
  const sc=scenes.find(s=>t>=s.s && t<s.e); if (!sc) return;
  const W=c.canvas.width, H=c.canvas.height, m=Math.min(W,H), G=E.G;
  const base=m*0.145*(G.mixSize||100)/100, cx=W*(G.posX??50)/100, focusY=H*((G.mixY??46)/100);
  const vis=sc.lines.filter(L=>t>=L.s);
  if (!vis.length) return;
  const lh=L=>base*L.size*(L.kind==='serif'?0.95:0.85);
  const n=vis.length;
  const out=clamp((sc.e-t)/0.28), outE=out*out*(3-2*out);
  // plynulé „ujetí“ kamery: každý nový řádek posune starší nahoru (o svou výšku) a o kousek do dálky
  const settle=q=>eExpo((t-vis[q].s)/0.45);
  const ys=new Array(n).fill(focusY), dep=new Array(n).fill(0);
  for (let idx=0; idx<n; idx++){ for (let q=idx+1;q<n;q++){ const k=settle(q); ys[idx]-=(lh(vis[q])*0.5+lh(vis[q-1])*0.5)*0.9*k; dep[idx]+=k; } }
  // celý blok vycentrovat kolem ohniska (ať neuteče nahoru)
  const top=ys[0]-lh(vis[0])*0.5, bot=focusY+lh(vis[n-1])*0.5, shift=Math.max(0,(bot-top)/2-lh(vis[n-1])*0.5)*0.5;
  c.save();
  for (let idx=0; idx<n; idx++){
    const L=vis[idx], age=t-L.s, d=dep[idx];
    const scD=Math.pow(0.93,d), aD=Math.max(0.35,1-0.16*d);
    const qa=eExpo(age/0.5), qf=eOut(age/0.22);
    const sIn=1+(1-qa)*1.1, yIn=(1-qa)*base*0.9;
    const S=scD*sIn*(0.7+0.3*outE), A=aD*qf*outE;
    if (A<=0.01) continue;
    const st=L.kind==='hi'?FONTS.sans:FONTS[L.kind]; let px=base*L.size;
    const words=L.ids.map(txt);
    c.font=`${st.it?'italic ':''}${st.wt} ${px}px ${st.fam}`; try{ c.letterSpacing=(L.kind==='serif'?-0.01:-0.035)*px+'px'; }catch(e){}
    let sp=px*0.24, ws=words.map(w=>c.measureText(w).width), tw=ws.reduce((a,b)=>a+b,0)+sp*(words.length-1);
    // vejít se na šířku videa
    const maxW=W*0.9/Math.max(S,0.01); if (tw>maxW){ const f=maxW/tw; px*=f; sp*=f; ws=ws.map(v=>v*f); tw=maxW; c.font=`${st.it?'italic ':''}${st.wt} ${px}px ${st.fam}`; try{ c.letterSpacing=(L.kind==='serif'?-0.01:-0.035)*px+'px'; }catch(e){} }
    const ccx=cx + L.side*W*0.28, yy=ys[idx]+shift+yIn;
    // střed řádku hlídat u okrajů
    const half=tw*S/2, lx=clamp(ccx, W*0.05+half, Math.max(W*0.05+half, W*0.95-half));
    c.save();
    c.translate(lx,yy); c.scale(S,S);
    c.textBaseline='middle'; c.textAlign='left';
    c.shadowColor='rgba(0,0,0,0.55)'; c.shadowBlur=px*0.28; c.shadowOffsetX=0; c.shadowOffsetY=px*0.04;
    let xx=-tw/2;
    words.forEach((w,wi)=>{
      const wt=E.words[L.ids[wi]], wa=wi===0?1:eOut((t-wt.s+0.05)/0.2);
      if (wa>0.01){
        c.globalAlpha=A*wa*((G.opacity??100)/100);
        if (L.kind==='hi'){ const g=c.createLinearGradient(0,-px*0.45,0,px*0.45); g.addColorStop(0,G.mixA||'#ffb12a'); g.addColorStop(1,G.mixB||'#ff7a00'); c.fillStyle=g; }
        else c.fillStyle='#ffffff';
        c.fillText(w,xx,0);
      }
      xx+=ws[wi]+sp;
    });
    c.restore();
  }
  c.restore();
};
E.mixInvalidate=()=>{ cacheKey=''; };
})();
