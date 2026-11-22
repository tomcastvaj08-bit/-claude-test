// ================= REALITNÍ FOTKY =================
// Focení expoziční řady (až 5 záběrů −6…+2 EV), zarovnání, spojení do HDR (exposure fusion – Mertens)
// a dotažení stylu „Světlý a bílý“. Všechno běží v telefonu, nic se nikam neposílá.
(function(global){
'use strict';
const PH = {};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const tick=()=>new Promise(r=>setTimeout(r,0));

// ---------- načtení obrázku do pole (RGB 0–1, Float32) ----------
// maxSide: delší strana pracovního obrázku (paměť telefonu – 2400 px ≈ 4,3 Mpx u 16:9)
PH.toImg = async (src, maxSide) => {
  let bmp = src;
  if (src instanceof Blob) bmp = await createImageBitmap(src, {imageOrientation:'from-image'});
  const sw = bmp.width||bmp.videoWidth, sh = bmp.height||bmp.videoHeight, k = Math.min(1, (maxSide||2400)/Math.max(sw,sh));
  const W = Math.max(8, Math.round(sw*k)), H = Math.max(8, Math.round(sh*k));
  const c = document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d',{willReadFrequently:true});
  x.imageSmoothingQuality='high'; x.drawImage(bmp,0,0,W,H);
  const d = x.getImageData(0,0,W,H).data, n=W*H, f=new Float32Array(n*3);
  for (let i=0,j=0;i<n;i++,j+=4){ f[i*3]=d[j]/255; f[i*3+1]=d[j+1]/255; f[i*3+2]=d[j+2]/255; }
  return {W,H,f};
};
PH.toCanvas = (im, canvas) => {
  const c = canvas || document.createElement('canvas'); c.width=im.W; c.height=im.H;
  const x=c.getContext('2d'), id=x.createImageData(im.W,im.H), d=id.data, f=im.f, n=im.W*im.H;
  for (let i=0,j=0;i<n;i++,j+=4){ d[j]=clamp(f[i*3]*255+0.5,0,255); d[j+1]=clamp(f[i*3+1]*255+0.5,0,255); d[j+2]=clamp(f[i*3+2]*255+0.5,0,255); d[j+3]=255; }
  x.putImageData(id,0,0); return c;
};
const lumOf = im => { const n=im.W*im.H, L=new Float32Array(n), f=im.f; for (let i=0;i<n;i++) L[i]=0.2126*f[i*3]+0.7152*f[i*3+1]+0.0722*f[i*3+2]; return L; };
const meanLum = im => { const L=lumOf(im); let s=0; for (let i=0;i<L.length;i+=7) s+=L[i]; return s/Math.ceil(L.length/7); };

// ---------- zarovnání (fotky z ruky se mezi záběry o kousek posunou) ----------
// Median Threshold Bitmap (Ward 2003): bitmapa „světlejší než medián“ nezávisí na expozici → posun hledáme pyramidou
function lumSmall(im, s){ const W=Math.max(1,im.W>>s), H=Math.max(1,im.H>>s), o=new Float32Array(W*H), L=lumOf(im), k=1<<s;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){ let a=0,c=0; for (let yy=0;yy<k;yy++){ const sy=y*k+yy; if (sy>=im.H) break; for (let xx=0;xx<k;xx++){ const sx=x*k+xx; if (sx>=im.W) break; a+=L[sy*im.W+sx]; c++; } } o[y*W+x]=a/c; }
  return {W,H,L:o}; }
function mtb(g){ const s=Array.from(g.L).sort((a,b)=>a-b), med=s[s.length>>1], n=g.L.length, b=new Uint8Array(n), e=new Uint8Array(n);
  for (let i=0;i<n;i++){ const v=g.L[i]; b[i]=v>med?1:0; e[i]=Math.abs(v-med)>0.016?1:0; } return {b,e}; }
function shiftErr(A,B,W,H,dx,dy){ let err=0, cnt=0; const x0=Math.max(0,dx), x1=Math.min(W,W+dx), y0=Math.max(0,dy), y1=Math.min(H,H+dy);
  for (let y=y0;y<y1;y++){ const ra=y*W, rb=(y-dy)*W; for (let x=x0;x<x1;x++){ const ia=ra+x, ib=rb+x-dx; if (A.e[ia]&B.e[ib]){ err+=A.b[ia]^B.b[ib]; cnt++; } } }
  return cnt>20 ? err/cnt : 1; }   // podíl chyb (ne součet) – jinak by vyhrával velký posun s malým překryvem
PH.alignShift = (ref, im) => {   // posun im vůči ref v pixelech [dx, dy]
  const levels = Math.max(1, Math.min(6, Math.floor(Math.log2(Math.min(ref.W,ref.H)/48))));
  let dx=0, dy=0;
  for (let s=levels; s>=0; s--){
    const a=lumSmall(ref,s), b=lumSmall(im,s), A=mtb(a), B=mtb(b); dx*=2; dy*=2;
    let best=1e18, bx=dx, by=dy;
    for (let oy=-1;oy<=1;oy++) for (let ox=-1;ox<=1;ox++){ const e=shiftErr(A,B,a.W,a.H,dx+ox,dy+oy); if (e<best){ best=e; bx=dx+ox; by=dy+oy; } }
    dx=bx; dy=by;
  }
  return [dx,dy];
};
function shiftImg(im, dx, dy){ if (!dx && !dy) return im; const {W,H,f}=im, o=new Float32Array(f.length);
  for (let y=0;y<H;y++){ const sy=clamp(y-dy,0,H-1); for (let x=0;x<W;x++){ const sx=clamp(x-dx,0,W-1), i=(y*W+x)*3, j=(sy*W+sx)*3; o[i]=f[j]; o[i+1]=f[j+1]; o[i+2]=f[j+2]; } }
  return {W,H,f:o}; }

// ---------- pyramidy (5bodový filtr 1-4-6-4-1) ----------
function down(a,W,H,ch){ const W2=(W+1)>>1, H2=(H+1)>>1, t=new Float32Array(W2*H*ch), o=new Float32Array(W2*H2*ch);
  for (let y=0;y<H;y++) for (let x=0;x<W2;x++){ const cx=x*2; for (let c=0;c<ch;c++){ const g=k=>a[(y*W+clamp(cx+k,0,W-1))*ch+c]; t[(y*W2+x)*ch+c]=(g(-2)+4*g(-1)+6*g(0)+4*g(1)+g(2))/16; } }
  for (let y=0;y<H2;y++){ const cy=y*2; for (let x=0;x<W2;x++) for (let c=0;c<ch;c++){ const g=k=>t[(clamp(cy+k,0,H-1)*W2+x)*ch+c]; o[(y*W2+x)*ch+c]=(g(-2)+4*g(-1)+6*g(0)+4*g(1)+g(2))/16; } }
  return {a:o,W:W2,H:H2}; }
function up(a,W,H,W2,H2,ch){   // zvětšení na W2×H2 (bilineárně – plynulé, bez mřížky)
  const o=new Float32Array(W2*H2*ch);
  for (let y=0;y<H2;y++){ const fy=Math.min(H-1,Math.max(0,(y-0.5)/2)), y0=Math.floor(fy), y1=Math.min(H-1,y0+1), wy=fy-y0;
    for (let x=0;x<W2;x++){ const fx=Math.min(W-1,Math.max(0,(x-0.5)/2)), x0=Math.floor(fx), x1=Math.min(W-1,x0+1), wx=fx-x0;
      for (let c=0;c<ch;c++){ const p=(yy,xx)=>a[(yy*W+xx)*ch+c]; o[(y*W2+x)*ch+c]=(p(y0,x0)*(1-wx)+p(y0,x1)*wx)*(1-wy)+(p(y1,x0)*(1-wx)+p(y1,x1)*wx)*wy; } } }
  return o; }

// ---------- spojení expozic (Mertens: kontrast × sytost × dobrá expozice) ----------
PH.fuse = async (imgs, onP) => {
  const {W,H}=imgs[0], n=W*H, N=imgs.length;
  const levels = Math.max(2, Math.min(9, Math.floor(Math.log2(Math.min(W,H)))-3));
  // váhy
  const ws=[], sum=new Float32Array(n).fill(1e-12);
  for (let k=0;k<N;k++){ const f=imgs[k].f, L=lumOf(imgs[k]), w=new Float32Array(n);
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){ const i=y*W+x;
      const lap=Math.abs(4*L[i]-L[y*W+Math.max(0,x-1)]-L[y*W+Math.min(W-1,x+1)]-L[Math.max(0,y-1)*W+x]-L[Math.min(H-1,y+1)*W+x]);
      const r=f[i*3], g=f[i*3+1], b=f[i*3+2], m=(r+g+b)/3, sat=Math.sqrt(((r-m)**2+(g-m)**2+(b-m)**2)/3);
      const we=Math.exp(-((r-0.5)**2)/0.08)*Math.exp(-((g-0.5)**2)/0.08)*Math.exp(-((b-0.5)**2)/0.08);
      w[i]=(lap+0.002)*(sat+0.02)*(we+1e-6); sum[i]+=w[i]; }
    ws.push(w); onP&&onP(0.1+0.2*(k+1)/N); await tick(); }
  for (let k=0;k<N;k++){ const w=ws[k]; for (let i=0;i<n;i++) w[i]/=sum[i]; }
  // výsledná laplaceova pyramida = Σ (gauss. pyramida vah × laplace. pyramida obrázku)
  let acc=null;
  for (let k=0;k<N;k++){
    const gp=[{a:imgs[k].f,W,H}], wp=[{a:ws[k],W,H}];
    for (let l=1;l<levels;l++){ gp.push(down(gp[l-1].a,gp[l-1].W,gp[l-1].H,3)); wp.push(down(wp[l-1].a,wp[l-1].W,wp[l-1].H,1)); }
    if (!acc) acc=gp.map(g=>({a:new Float32Array(g.a.length),W:g.W,H:g.H}));
    for (let l=0;l<levels;l++){
      const g=gp[l], w=wp[l].a, A=acc[l].a, cnt=g.W*g.H;
      let lp=g.a; if (l<levels-1){ const u=up(gp[l+1].a,gp[l+1].W,gp[l+1].H,g.W,g.H,3); lp=new Float32Array(g.a.length); for (let i=0;i<lp.length;i++) lp[i]=g.a[i]-u[i]; }
      for (let i=0;i<cnt;i++){ const wi=w[i]; A[i*3]+=wi*lp[i*3]; A[i*3+1]+=wi*lp[i*3+1]; A[i*3+2]+=wi*lp[i*3+2]; }
    }
    ws[k]=null; onP&&onP(0.3+0.6*(k+1)/N); await tick();
  }
  // složení pyramidy
  let cur=acc[levels-1].a;
  for (let l=levels-2;l>=0;l--){ const u=up(cur,acc[l+1].W,acc[l+1].H,acc[l].W,acc[l].H,3), A=acc[l].a; for (let i=0;i<A.length;i++) u[i]+=A[i]; cur=u; }
  return {W,H,f:cur};
};

// ---------- dotažení: „Světlý a bílý“ (bílé stěny, čisté denní barvy, světlé stíny) ----------
function blurGray(L,W,H,r){ // rychlé rozmazání (2× klouzavý průměr)
  const pass=(src)=>{ const t=new Float32Array(src.length), o=new Float32Array(src.length);
    for (let y=0;y<H;y++){ let s=0; const row=y*W; for (let x=-r;x<=r;x++) s+=src[row+clamp(x,0,W-1)]; for (let x=0;x<W;x++){ t[row+x]=s/(2*r+1); s+=src[row+clamp(x+r+1,0,W-1)]-src[row+clamp(x-r,0,W-1)]; } }
    for (let x=0;x<W;x++){ let s=0; for (let y=-r;y<=r;y++) s+=t[clamp(y,0,H-1)*W+x]; for (let y=0;y<H;y++){ o[y*W+x]=s/(2*r+1); s+=t[clamp(y+r+1,0,H-1)*W+x]-t[clamp(y-r,0,H-1)*W+x]; } }
    return o; };
  return pass(pass(L)); }
function guided(I,W,H,r,eps){ // samonaváděný filtr (He 2010): hladí plochy, drží hrany → bez halo kolem oken
  const n=I.length, II=new Float32Array(n); for (let i=0;i<n;i++) II[i]=I[i]*I[i];
  const mI=blurBox(I,W,H,r), mII=blurBox(II,W,H,r), a=new Float32Array(n), b=new Float32Array(n);
  for (let i=0;i<n;i++){ const v=mII[i]-mI[i]*mI[i]; a[i]=v/(v+eps); b[i]=mI[i]-a[i]*mI[i]; }
  const ma=blurBox(a,W,H,r), mb=blurBox(b,W,H,r), o=new Float32Array(n); for (let i=0;i<n;i++) o[i]=ma[i]*I[i]+mb[i]; return o; }
function blurBox(src,W,H,r){ const t=new Float32Array(src.length), o=new Float32Array(src.length), d=2*r+1;
  for (let y=0;y<H;y++){ let s=0; const row=y*W; for (let x=-r;x<=r;x++) s+=src[row+clamp(x,0,W-1)]; for (let x=0;x<W;x++){ t[row+x]=s/d; s+=src[row+clamp(x+r+1,0,W-1)]-src[row+clamp(x-r,0,W-1)]; } }
  for (let x=0;x<W;x++){ let s=0; for (let y=-r;y<=r;y++) s+=t[clamp(y,0,H-1)*W+x]; for (let y=0;y<H;y++){ o[y*W+x]=s/d; s+=t[clamp(y+r+1,0,H-1)*W+x]-t[clamp(y-r,0,H-1)*W+x]; } }
  return o; }
// mapování tónů (Durand): velké světelné rozdíly (okno vs. stín) se stlačí, drobné detaily zůstanou → stíny se otevřou, okna se stáhnou
PH.toneMap = (im, stops) => {
  const {W,H}=im, n=W*H, f=im.f, lg=new Float32Array(n);
  for (let i=0;i<f.length;i++) if (!(f[i]>0)) f[i]=0;   // spojení může dát drobné záporné hodnoty
  for (let i=0;i<n;i++) lg[i]=Math.log2(0.2126*f[i*3]+0.7152*f[i*3+1]+0.0722*f[i*3+2]+1e-3);
  const r=Math.max(4,Math.round(Math.max(W,H)/50)), base=guided(lg,W,H,r,0.25);
  const smp=[]; for (let i=0;i<n;i+=13) smp.push(base[i]); smp.sort((a,b)=>a-b);
  const lo=smp[Math.floor(smp.length*0.01)], hi=smp[Math.floor(smp.length*0.995)], R=stops||3.2, k=Math.min(1,R/Math.max(0.1,hi-lo));
  const o=new Float32Array(f.length);
  for (let i=0;i<n;i++){ const nl=(base[i]-hi)*k + (lg[i]-base[i])*1.12 - 0.05, sc=Math.pow(2,nl-lg[i]);
    o[i*3]=f[i*3]*sc; o[i*3+1]=f[i*3+1]*sc; o[i*3+2]=f[i*3+2]*sc; }
  return {W,H,f:o,k};
};
PH.finish = (im, style) => {
  const st=style||'bright'; im=PH.toneMap(im, im._single?2.6:3.4);
  const {W,H}=im, n=W*H, f=new Float32Array(im.f);
  // 1) vyvážení bílé: šedý svět z neutrálních světlých ploch (stěny, strop)
  // bílý bod = medián poměrů barev u nejsvětlejších málo barevných ploch (stěny, strop) – robustní, bez přestřelení do modra
  const cand=[]; for (let i=0;i<n;i+=3){ const r=f[i*3],g=f[i*3+1],b=f[i*3+2], m=(r+g+b)/3, mx=Math.max(r,g,b), mn=Math.min(r,g,b); if (m>0.12 && mx<0.985 && (mx-mn)<0.45*mx) cand.push([m,r,g,b]); }
  cand.sort((a,b)=>b[0]-a[0]); const top=cand.slice(0,Math.max(50,Math.floor(cand.length*0.3)));
  const med=a=>{ a.sort((x,y)=>x-y); return a.length?a[a.length>>1]:1; };
  let gr=1,gg=1,gb=1;
  if (top.length>=50){ const rg=med(top.map(t=>t[1]/Math.max(1e-4,t[2]))), bg=med(top.map(t=>t[3]/Math.max(1e-4,t[2])));
    const ex=st==='sunrise'?0.6:1.0; gr=clamp(Math.pow(1/rg,ex),0.65,1.5); gb=clamp(Math.pow(1/bg,ex),0.65,1.6); const nm=(gr+gg+gb)/3; gr/=nm; gg/=nm; gb/=nm; }
  const warm = st==='sunrise' ? [1.07,1.0,0.88] : [0.99,1.0,1.02];
  for (let i=0;i<n;i++){ f[i*3]*=gr*warm[0]; f[i*3+1]*=gg*warm[1]; f[i*3+2]*=gb*warm[2]; }
  // 2) expozice: 99,5. percentil jasu → 0,97 (nic se nepřepálí, celé je světlé)
  const L=new Float32Array(n); for (let i=0;i<n;i++) L[i]=0.2126*f[i*3]+0.7152*f[i*3+1]+0.0722*f[i*3+2];
  const smp=[]; for (let i=0;i<n;i+=11) smp.push(L[i]); smp.sort((a,b)=>a-b);
  const p995=smp[Math.floor(smp.length*0.995)]||1, p50=smp[smp.length>>1]||0.5, p005=smp[Math.floor(smp.length*0.005)]||0, gain=clamp(0.97/p995,0.6,3), blk=p005*gain*0.85;   // černý bod: tmavé věci zůstanou syté
  // 3) světlé stíny + jemná křivka: střední tóny k 0,55 (Světlý a bílý), k 0,47 (Východ slunce)
  const midT = st==='sunrise'?0.42:0.47, mid=clamp(p50*gain,0.05,0.9), gam=clamp(Math.log(midT)/Math.log(mid),0.45,1.4);
  // 4) lokální kontrast (velký poloměr) – plastičnost bez „HDR“ vzhledu
  const big=blurGray(L,W,H,Math.max(4,Math.round(Math.max(W,H)/90)));
  const det=blurGray(L,W,H,1);
  for (let i=0;i<n;i++){
    const l=L[i]*gain; let t=Math.pow(clamp((l-blk)/(1-blk),0,1),gam);
    t = t + (l - big[i]*gain)*0.18;                                   // lokální kontrast
    t = t + (L[i]-det[i])*gain*0.9;                                   // ostření detailů
    t = t*t*(3-2*t)*0.25 + t*0.75;                                     // jemná S-křivka
    const k = l>1e-4 ? clamp(t,0,1.02)/l : 1;
    let r=f[i*3]*gain*k, g=f[i*3+1]*gain*k, b=f[i*3+2]*gain*k;
    const m=(r+g+b)/3, satK = st==='sunrise'?1.12:1.06;                 // sytost (barvy čisté, ne křiklavé)
    r=m+(r-m)*satK; g=m+(g-m)*satK; b=m+(b-m)*satK;
    // světlé neutrální plochy dočistit do bílé (stěny/strop bez nádechu)
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
    if (st!=='sunrise' && m>0.62 && (mx-mn)<0.12){ const q=clamp((m-0.62)/0.25,0,1)*0.6; r+= (m-r)*q; g+=(m-g)*q; b+=(m-b)*q; }
    f[i*3]=clamp(r,0,1); f[i*3+1]=clamp(g,0,1); f[i*3+2]=clamp(b,0,1);
  }
  return {W,H,f};
};

// ---------- celý postup: expozice → zarovnat → spojit → dotáhnout ----------
PH.process = async (blobs, opt={}) => {
  const onP=opt.onP||(()=>{}), maxSide=opt.maxSide||2400;
  onP(0.02,'Načítám záběry…');
  let imgs=[]; for (const b of blobs){ imgs.push(await PH.toImg(b,maxSide)); await tick(); }
  // stejný rozměr (kdyby se lišil)
  const {W,H}=imgs[0]; imgs=imgs.filter(im=>im.W===W && im.H===H);
  // seřadit od nejtmavší po nejsvětlejší; referencí je prostřední
  imgs=imgs.map(im=>({im,m:meanLum(im)})).sort((a,b)=>a.m-b.m).map(x=>x.im);
  const ref=imgs[Math.floor((imgs.length-1)/2)];
  onP(0.08,'Zarovnávám záběry…');
  const shifts=[]; for (let k=0;k<imgs.length;k++){ if (imgs[k]===ref){ shifts.push([0,0]); continue; } const s=PH.alignShift(ref,imgs[k]); shifts.push(s); imgs[k]=shiftImg(imgs[k],s[0],s[1]); await tick(); }   // alignShift vrací posun, který záběr srovná s referencí
  let fused = imgs.length>1 ? await PH.fuse(imgs,(p)=>onP(0.1+p*0.75,'Spojuji expozice…')) : {...imgs[0], _single:true};
  onP(0.9,'Dotahuji světlo a barvy…'); await tick();
  const out = PH.finish(fused, opt.style);
  onP(1,'Hotovo');
  return {out, before:ref, shifts, count:imgs.length};
};

// ---------- kamera: expoziční řada (kde to prohlížeč dovolí) ----------
PH.EVS = [-6,-4,-2,0,2];
PH.camera = {
  stream:null, track:null, caps:{}, video:null,
  async open(video){
    const want={facingMode:{ideal:'environment'}, width:{ideal:4032}, height:{ideal:3024}, frameRate:{ideal:30}};
    let s=null;
    try{ // širokoúhlý objektiv (0,5×), když ho telefon v prohlížeči nabídne
      const devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
      const uw=devs.find(d=>/ultra|wide|0[.,]5|širok/i.test(d.label||'') && !/front|přední|user/i.test(d.label||''));
      if (uw) s=await navigator.mediaDevices.getUserMedia({video:{...want, deviceId:{exact:uw.deviceId}}, audio:false});
    }catch(e){}
    if (!s) s=await navigator.mediaDevices.getUserMedia({video:want, audio:false});
    this.stream=s; this.track=s.getVideoTracks()[0]; this.video=video;
    video.srcObject=s; video.muted=true; video.playsInline=true; await video.play().catch(()=>{});
    try{ this.caps=this.track.getCapabilities?this.track.getCapabilities():{}; }catch(e){ this.caps={}; }
    return this.mode();
  },
  // 'time' = ruční čas závěrky (skutečných −6…+2 EV), 'comp' = korekce expozice (obvykle ±2 EV), 'none' = jen jeden záběr
  mode(){ const c=this.caps||{}; if (c.exposureTime && c.exposureTime.max>c.exposureTime.min && (c.exposureMode||[]).includes('manual')) return 'time'; if (c.exposureCompensation && c.exposureCompensation.max>c.exposureCompensation.min) return 'comp'; return 'none'; },
  close(){ try{ this.stream&&this.stream.getTracks().forEach(t=>t.stop()); }catch(e){} this.stream=null; this.track=null; },
  async frame(){ const v=this.video; const c=document.createElement('canvas'); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext('2d').drawImage(v,0,0); return await new Promise(r=>c.toBlob(r,'image/jpeg',0.95)); },
  async still(){ // plné rozlišení přes ImageCapture, jinak snímek z videa
    try{ if (global.ImageCapture){ const ic=new ImageCapture(this.track); const b=await ic.takePhoto(); if (b && b.size) return b; } }catch(e){}
    return this.frame(); },
  async bracket(onShot){
    const t=this.track, c=this.caps, mode=this.mode(), shots=[];
    const settle=()=>new Promise(r=>setTimeout(r,450));
    if (mode==='none'){ shots.push(await this.still()); onShot&&onShot(1,1); return {shots,mode}; }
    const s0=t.getSettings?t.getSettings():{};
    if (mode==='time'){
      const t0=s0.exposureTime||((c.exposureTime.min+c.exposureTime.max)/40), iso0=s0.iso||(c.iso?c.iso.min*2:100);
      const tMaxHand=Math.min(c.exposureTime.max, 333);   // max ~1/30 s z ruky (jednotky 100 µs)
      for (let k=0;k<PH.EVS.length;k++){ const E=t0*iso0*Math.pow(2,PH.EVS[k]);
        let tt=clamp(t0*Math.pow(2,PH.EVS[k]), c.exposureTime.min, tMaxHand), iso=c.iso?clamp(E/tt,c.iso.min,c.iso.max):undefined;
        const adv={exposureMode:'manual', exposureTime:tt}; if (iso) adv.iso=iso;
        try{ await t.applyConstraints({advanced:[adv]}); }catch(e){}
        await settle(); shots.push(await this.frame()); onShot&&onShot(k+1,PH.EVS.length); }
      try{ await t.applyConstraints({advanced:[{exposureMode:'continuous'}]}); }catch(e){}
    } else {
      const ec=c.exposureCompensation, vals=[-2,-1,0,1,2].map(v=>clamp(v,ec.min,ec.max));
      for (let k=0;k<vals.length;k++){ try{ await t.applyConstraints({advanced:[{exposureCompensation:vals[k]}]}); }catch(e){} await settle(); shots.push(await this.frame()); onShot&&onShot(k+1,vals.length); }
      try{ await t.applyConstraints({advanced:[{exposureCompensation:0}]}); }catch(e){}
    }
    return {shots,mode};
  }
};

global.PH = PH;
})(window);
