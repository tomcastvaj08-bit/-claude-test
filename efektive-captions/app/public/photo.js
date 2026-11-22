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
// odšumění: barevný šum (tečky) pryč úplně, jasový jen ve stínech (tam ho vytažení stínů zesílí)
PH.denoise = (im, strength) => {
  const {W,H,f}=im, n=W*H, st=strength==null?1:strength, Y=new Float32Array(n), cr=new Float32Array(n), cg=new Float32Array(n), cb=new Float32Array(n);
  for (let i=0;i<n;i++){ const r=Math.max(0,f[i*3]), g=Math.max(0,f[i*3+1]), b=Math.max(0,f[i*3+2]), y=0.2126*r+0.7152*g+0.0722*b; Y[i]=y; cr[i]=r-y; cg[i]=g-y; cb[i]=b-y; }
  const rc=Math.max(2,Math.round(Math.max(W,H)/350)), Cr=guided2(cr,Y,W,H,rc), Cg=guided2(cg,Y,W,H,rc), Cb=guided2(cb,Y,W,H,rc);
  const Yg=guided(Y,W,H,Math.max(2,Math.round(Math.max(W,H)/700)),0.0008*st), Ym=blurBox(Y,W,H,6), o=new Float32Array(f.length);
  for (let i=0;i<n;i++){ const w=clamp((0.3-Ym[i])/0.25,0,1)*0.85*st, y=Y[i]*(1-w)+Yg[i]*w;
    o[i*3]=y+Cr[i]; o[i*3+1]=y+Cg[i]; o[i*3+2]=y+Cb[i]; }
  return {...im,f:o};
};
// barevný kanál vyhlazený podle jasu (hrany barev drží na hranách předmětů)
function guided2(p,I,W,H,r){ const eps=0.0025, n=p.length, mI=blurBox(I,W,H,r), mp=blurBox(p,W,H,r), Ip=new Float32Array(n), II=new Float32Array(n);
  for (let i=0;i<n;i++){ Ip[i]=I[i]*p[i]; II[i]=I[i]*I[i]; }
  const mIp=blurBox(Ip,W,H,r), mII=blurBox(II,W,H,r), a=new Float32Array(n), b=new Float32Array(n);
  for (let i=0;i<n;i++){ const v=mII[i]-mI[i]*mI[i]; a[i]=(mIp[i]-mI[i]*mp[i])/(v+eps); b[i]=mp[i]-a[i]*mI[i]; }
  const ma=blurBox(a,W,H,r), mb=blurBox(b,W,H,r), o=new Float32Array(n); for (let i=0;i<n;i++) o[i]=ma[i]*I[i]+mb[i]; return o; }
// mapování tónů (Durand): velké světelné rozdíly (okno vs. stín) se stlačí, drobné detaily zůstanou → stíny se otevřou, okna se stáhnou
PH.toneMap = (im, stops) => {
  const {W,H}=im, n=W*H, f=im.f, lg=new Float32Array(n);
  for (let i=0;i<f.length;i++) if (!(f[i]>0)) f[i]=0;   // spojení může dát drobné záporné hodnoty
  for (let i=0;i<n;i++) lg[i]=Math.log2(0.2126*f[i*3]+0.7152*f[i*3+1]+0.0722*f[i*3+2]+1e-3);
  const r=Math.max(4,Math.round(Math.max(W,H)/50)), base=guided(lg,W,H,r,0.25);
  const smp=[]; for (let i=0;i<n;i+=13) smp.push(base[i]); smp.sort((a,b)=>a-b);
  const lo=smp[Math.floor(smp.length*0.01)], hi=smp[Math.floor(smp.length*0.995)], R=stops||3.2, k=Math.min(1,R/Math.max(0.1,hi-lo));
  const o=new Float32Array(f.length);
  for (let i=0;i<n;i++){ const nl=(base[i]-hi)*k + (lg[i]-base[i])*1.05 - 0.05, sc=Math.pow(2,nl-lg[i]);
    o[i*3]=f[i*3]*sc; o[i*3+1]=f[i*3+1]*sc; o[i*3+2]=f[i*3+2]*sc; }
  return {W,H,f:o,k};
};
PH.finish = (im, style) => {
  const st=style||'bright';
  // zrnitost ve stínech (šum) → méně vytahovat stíny a víc odšumit, ať nevznikají barevné fleky
  let nz=0; { const k=Math.max(1,Math.round(Math.max(im.W,im.H)/800)), Wn=Math.floor(im.W/k), Hn=Math.floor(im.H/k), sm=[]; for (let y=1;y<Hn-1;y++) for (let x=1;x<Wn-1;x++){ const q=(y*k*im.W+x*k)*3, l=0.2126*im.f[q]+0.7152*im.f[q+1]+0.0722*im.f[q+2]; if (l>0.15||l<0.004) continue; const q2=q+k*3, q3=q+k*im.W*3; const r=Math.abs(im.f[q]-im.f[q2])+Math.abs(im.f[q+2]-im.f[q3+2])+Math.abs(im.f[q+1]-im.f[q2+1]); sm.push(r/Math.max(0.02,l)); } sm.sort((a,b)=>a-b); nz=sm.length>200?sm[sm.length>>1]:0; }
  const noisy=clamp((nz-0.35)/0.6,0,1);   // 0 = čistá fotka, 1 = hodně zrnitá
  im=PH.toneMap(PH.denoise(im, (im._single?1:0.6)*(1+noisy*1.2)), (im._single?2.6:3.4)+noisy*2.2);
  im._noisy=noisy;
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
    t = t + (L[i]-det[i])*gain*0.35*clamp(l*3,0,1);                  // jemné ostření (ve stínech skoro žádné – nezesilovat šum)
    t = t*t*(3-2*t)*0.25 + t*0.75;                                     // jemná S-křivka
    const k = l>1e-4 ? clamp(t,0,1.02)/l : 1;
    let r=f[i*3]*gain*k, g=f[i*3+1]*gain*k, b=f[i*3+2]*gain*k;
    const m=(r+g+b)/3, satK = (st==='sunrise'?1.12:1.06)*(1-0.25*(im._noisy||0));                 // sytost (barvy čisté, ne křiklavé)
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
  // prázdné / černé / úplně bílé snímky pryč (vadný záběr ze série)
  if (imgs.length>1){ const ok=imgs.filter(im=>{ const m=meanLum(im); return m>0.004 && m<0.995; }); if (ok.length) imgs=ok; }
  // seřadit od nejtmavší po nejsvětlejší; referencí je prostřední
  imgs=imgs.map(im=>({im,m:meanLum(im)})).sort((a,b)=>a.m-b.m).map(x=>x.im);
  const ref=imgs[Math.floor((imgs.length-1)/2)];
  onP(0.08,'Zarovnávám záběry…');
  const shifts=[]; for (let k=0;k<imgs.length;k++){ if (imgs[k]===ref){ shifts.push([0,0]); continue; } const s=PH.alignShift(ref,imgs[k]); shifts.push(s); imgs[k]=shiftImg(imgs[k],s[0],s[1]); await tick(); }   // alignShift vrací posun, který záběr srovná s referencí
  imgs.forEach(im=>{ im._fused=false; });
  let fused = imgs.length>1 ? await PH.fuse(imgs,(p)=>onP(0.1+p*0.75,'Spojuji expozice…')) : {...imgs[0], _single:true};
  let before=ref; imgs=null;   // uvolnit paměť záběrů
  const sharp=PH.sharpness(before), blurry=sharp<1.2e-3;
  // srovnání padajících svislic (stejně i „před“, ať porovnání sedí)
  let up=null; if (opt.upright!==false){ onP(0.87,'Srovnávám svislice…'); await tick(); up=PH.uprightParams(fused); if (up){ fused=PH.upright(fused,up); before=PH.upright(before,up); } }
  onP(0.9,'Dotahuji světlo a barvy…'); await tick();
  const out = PH.finish(fused, opt.style);
  onP(1,'Hotovo');
  return {out, before, shifts, count:blobs.length, used:shifts.length, blurry, sharp, upright:up};
};

// ---------- kamera: expoziční řada (kde to prohlížeč dovolí) ----------
PH.EVS = [-6,-4,-2,0,2];
// žebříček expozic podle počtu snímků, které zařízení zvládne (stejné konstanty jako ProMyPhoto)
PH.LADDER = {5:[-6,-4,-2,0,2], 4:[-6,-2,0,2], 3:[-3,0,2], 2:[-3,0], 1:[0]};
PH.ladder = n => PH.LADDER[Math.max(1,Math.min(5,n|0))];
// když je v náhledu hodně přepálených míst, posune se celá série dolů (clip > 2 % → max −1 EV)
PH.highlightBias = video => { try{ const w=160, h=Math.max(1,Math.round(w*video.videoHeight/video.videoWidth)), c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(video,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; let clip=0; for (let i=0;i<d.length;i+=4) if (d[i]>=250||d[i+1]>=250||d[i+2]>=250) clip++; const fr=clip/(w*h); return fr>0.02 ? Math.max(-1,-fr*10) : 0; }catch(e){ return 0; } };
PH.camera = {
  stream:null, track:null, caps:{}, video:null,
  async open(video){
    const want={facingMode:{ideal:'environment'}, width:{ideal:2560}, height:{ideal:1920}, frameRate:{ideal:30}};
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
  async bracket(onShot, opt){
    const t=this.track, c=this.caps, mode=this.mode(), shots=[];
    const settle=()=>new Promise(r=>setTimeout(r,450));
    if (mode==='none'){ shots.push(await this.still()); onShot&&onShot(1,1); return {shots,mode}; }
    const s0=t.getSettings?t.getSettings():{}, bias=opt&&opt.bias||0;
    // zámek vyvážení bílé a zaostření, ať snímky sedí na sebe a liší se jen expozicí
    try{ const lk={}; if ((c.whiteBalanceMode||[]).includes('manual')) lk.whiteBalanceMode='manual'; if ((c.focusMode||[]).includes('manual')) lk.focusMode='manual'; if (Object.keys(lk).length) await t.applyConstraints({advanced:[lk]}); }catch(e){}
    if (mode==='time'){
      const t0=s0.exposureTime||((c.exposureTime.min+c.exposureTime.max)/40), iso0=s0.iso||(c.iso?c.iso.min*2:100);
      const tMaxHand=Math.min(c.exposureTime.max, 333);   // max ~1/30 s z ruky (jednotky 100 µs)
      const evs=PH.ladder(5).map(e=>e+bias);
      for (let k=0;k<evs.length;k++){ const E=t0*iso0*Math.pow(2,evs[k]);
        let tt=clamp(t0*Math.pow(2,evs[k]), c.exposureTime.min, tMaxHand), iso=c.iso?clamp(E/tt,c.iso.min,c.iso.max):undefined;
        const adv={exposureMode:'manual', exposureTime:tt}; if (iso) adv.iso=iso;
        try{ await t.applyConstraints({advanced:[adv]}); }catch(e){}
        await settle(); shots.push(await this.frame()); onShot&&onShot(k+1,evs.length); }
      try{ await t.applyConstraints({advanced:[{exposureMode:'continuous'}]}); }catch(e){}
    } else {
      // korekce expozice má malý rozsah → žebříček, který se do něj vejde (bez opakování stejných hodnot)
      const ec=c.exposureCompensation; let vals=[]; for (const n of [5,4,3,2]){ vals=[...new Set(PH.ladder(n).map(v=>clamp(v+bias,ec.min,ec.max)))]; if (vals.length===n) break; }
      for (let k=0;k<vals.length;k++){ try{ await t.applyConstraints({advanced:[{exposureCompensation:vals[k]}]}); }catch(e){} await settle(); shots.push(await this.frame()); onShot&&onShot(k+1,vals.length); }
      try{ await t.applyConstraints({advanced:[{exposureCompensation:0}]}); }catch(e){}
    }
    return {shots,mode};
  }
};

// ---------- spojení AI výsledku s originálem: světlo/barvy/změny z AI, jemné detaily z originálu (bez „AI textury“) ----------
function resize(im, W2, H2){ const {W,H,f}=im, o=new Float32Array(W2*H2*3), sx=W/W2, sy=H/H2;
  for (let y=0;y<H2;y++){ const fy=Math.min(H-1,Math.max(0,(y+0.5)*sy-0.5)), y0=Math.floor(fy), y1=Math.min(H-1,y0+1), wy=fy-y0;
    for (let x=0;x<W2;x++){ const fx=Math.min(W-1,Math.max(0,(x+0.5)*sx-0.5)), x0=Math.floor(fx), x1=Math.min(W-1,x0+1), wx=fx-x0, j=(y*W2+x)*3;
      for (let c=0;c<3;c++) o[j+c]=(f[(y0*W+x0)*3+c]*(1-wx)+f[(y0*W+x1)*3+c]*wx)*(1-wy)+(f[(y1*W+x0)*3+c]*(1-wx)+f[(y1*W+x1)*3+c]*wx)*wy; } }
  return {W:W2,H:H2,f:o}; }
function chan(im,c){ const n=im.W*im.H, o=new Float32Array(n); for (let i=0;i<n;i++) o[i]=im.f[i*3+c]; return o; }
PH.aiBlend = (base, ai, opt={}) => {
  const {W,H}=base; if (Math.abs(ai.W/ai.H - W/H) > 0.03) return {out:resize(ai,W,H), blended:false, why:'jiný poměr stran'};
  let up=resize(ai,W,H);
  // posun mezi AI a originálem (AI občas obraz o kousek posune) – když je velký, detaily nemíchat
  const s=PH.alignShift(base,up); if (Math.abs(s[0])>W*0.01 || Math.abs(s[1])>H*0.01) return {out:up, blended:false, why:'AI posunula obraz'};
  if (s[0]||s[1]) up=shiftImg(up,s[0],s[1]);
  const r=Math.max(2,Math.round(Math.max(W,H)/(opt.detailDiv||260))), n=W*H, out=new Float32Array(n*3);
  const Lb=lumOf(base), La=lumOf(up), lb=blurGray(Lb,W,H,r*3), la=blurGray(La,W,H,r*3);
  const m=new Float32Array(n); for (let i=0;i<n;i++){ const d=Math.abs(Math.log2((la[i]+0.02)/(lb[i]+0.02))); m[i]=clamp((d-0.35)/0.5,0,1); }   // jas se změnil o víc než ~⅓ EV → obsah se změnil
  const mm=blurGray(m,W,H,r*2);
  const dB=blurGray(Lb,W,H,r);   // jen jasová kresba originálu (žádné barevné tečky), omezená
  { const d1=blurGray(Lb,W,H,1), smp=[]; for (let i=0;i<n;i+=17) smp.push(Math.abs(Lb[i]-d1[i])); smp.sort((a,b)=>a-b);
    const noise=smp[smp.length>>1]; if (noise>(opt.noiseMax||0.006)) return {out:up, blended:false, why:'fotka je zrnitá – čistý AI výsledek', noise}; }
  for (let c=0;c<3;c++){ const A=chan(up,c), bA=blurGray(A,W,H,r);
    for (let i=0;i<n;i++){ const k=clamp(mm[i]*1.6,0,1), det=clamp(Lb[i]-dB[i],-0.06,0.06)*0.9, mixed=bA[i]+det; out[i*3+c]=clamp(k*A[i]+(1-k)*mixed,0,1); } }
  return {out:{W,H,f:out}, blended:true, shift:s};
};
// ---------- obloha (zdarma, v telefonu): přepálená okna a bledá obloha → čistá modrá s jemnými mraky ----------
function hsv(r,g,b){ const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn; let h=0; if (d>1e-6){ if (mx===r) h=((g-b)/d)%6; else if (mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if (h<0) h+=360; } return [h, mx>0?d/mx:0, mx]; }
PH.skyMask = im => { const {W,H,f}=im, n=W*H, m=new Float32Array(n);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){ const i=y*W+x, r=f[i*3],g=f[i*3+1],b=f[i*3+2], [h,sa,v]=hsv(r,g,b);
    const blown = v>0.93 && sa<0.12, pale = v>0.62 && h>185 && h<250 && sa>0.08 && sa<0.55;   // přepálené okno / bledě modrá obloha
    m[i] = (blown||pale) ? (y<H*0.85?1:0.4) : 0; }
  // jen souvislé větší plochy (ne odlesky na stole)
  const sm=blurGray(m,W,H,Math.max(3,Math.round(Math.max(W,H)/150))); for (let i=0;i<n;i++) m[i]=clamp((sm[i]-0.45)/0.3,0,1);
  return m; };
PH.skyWith = (im, m) => { const r=PH.sky(im, m); return r.out; };
PH.sky = (im, mIn) => { const {W,H,f}=im, n=W*H, m=mIn||PH.skyMask(im), out=new Float32Array(f);
  let area=0; for (let i=0;i<n;i+=5) area+=m[i]; if (area*5 < n*0.004) return {out:im, changed:false};
  // obloha: shora sytá modrá, k obzoru světlejší; jemné mraky (hodnotový šum)
  const rnd=(x,y)=>{ const s=Math.sin(x*127.1+y*311.7)*43758.5453; return s-Math.floor(s); };
  const noise=(x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf); return (rnd(xi,yi)*(1-u)+rnd(xi+1,yi)*u)*(1-v)+(rnd(xi,yi+1)*(1-u)+rnd(xi+1,yi+1)*u)*v; };
  const sc=6/Math.max(W,H);
  for (let y=0;y<H;y++){ const t=y/H, top=[0.30,0.55,0.86], hor=[0.74,0.85,0.95];
    for (let x=0;x<W;x++){ const i=y*W+x, a=m[i]; if (a<=0.001) continue;
      const k=Math.min(1,t*1.4), cl=clamp((noise(x*sc*3,y*sc*7)*0.65+noise(x*sc*9,y*sc*18)*0.35-0.55)*2.4,0,0.75);
      for (let c=0;c<3;c++){ const sky=top[c]*(1-k)+hor[c]*k, v=sky*(1-cl)+0.97*cl; out[i*3+c]=f[i*3+c]*(1-a)+v*a; } } }
  return {out:{W,H,f:out}, changed:true}; };
// ---------- trávník (zdarma): zelenější, rovnoměrný, svěží ----------
PH.lawn = im => { const {W,H,f}=im, n=W*H, out=new Float32Array(f); let cnt=0;
  for (let i=0;i<n;i++){ const r=f[i*3],g=f[i*3+1],b=f[i*3+2], [h,sa,v]=hsv(r,g,b);
    if (h<45||h>165||sa<0.12||v<0.08||v>0.95) continue;   // žlutozelená až zelená
    const w=clamp((sa-0.12)/0.15,0,1)*clamp((Math.min(h-45,165-h))/15,0,1); if (w<=0) continue; cnt++;
    const nh=h+(105-h)*0.55, ns=Math.min(1,sa*1.35+0.05), nv=Math.min(1,v*1.06);   // posun k sytě zelené
    const C=nv*ns, X=C*(1-Math.abs((nh/60)%2-1)), mm=nv-C; let rr,gg,bb; const hh=nh/60;
    if (hh<1){rr=C;gg=X;bb=0;} else if (hh<2){rr=X;gg=C;bb=0;} else if (hh<3){rr=0;gg=C;bb=X;} else {rr=0;gg=X;bb=C;}
    out[i*3]=r*(1-w)+(rr+mm)*w; out[i*3+1]=g*(1-w)+(gg+mm)*w; out[i*3+2]=b*(1-w)+(bb+mm)*w; }
  return {out:{W,H,f:out}, changed:cnt>n*0.01}; };
// ---------- srovnání padajících svislic (jako VerticalLeanDetector) ----------
// najde téměř svislé hrany, změří jejich náklon v závislosti na poloze (sbíhání = kamera nakloněná nahoru/dolů) a obraz srovná
PH.uprightParams = im => { const k=Math.min(1,600/Math.max(im.W,im.H)), W=Math.round(im.W*k), H=Math.round(im.H*k), L=lumOf(resize(im,W,H)), cy=H/2;
  // Houghova transformace jen pro téměř svislé přímky x = x0 + t·(y−cy), |t| ≤ 0,36 (±20°); bereme jen DLOUHÉ čáry (rámy oken, rohy zdí)
  const TN=73, T0=-0.36, TS=0.01, acc=new Float32Array(TN*W);
  for (let y=1;y<H-1;y++) for (let x=1;x<W-1;x++){ const i=y*W+x;
    const gx=(L[i-W+1]+2*L[i+1]+L[i+W+1])-(L[i-W-1]+2*L[i-1]+L[i+W-1]), gy=(L[i+W-1]+2*L[i+W]+L[i+W+1])-(L[i-W-1]+2*L[i-W]+L[i-W+1]);
    if (Math.hypot(gx,gy)<0.2 || Math.abs(gx)<2.7*Math.abs(gy)) continue;
    const tg=-gy/gx;   // sklon hrany dx/dy podle gradientu
    for (let ti=0;ti<TN;ti++){ const t=T0+ti*TS; if (Math.abs(t-tg)>0.06) continue; const x0=Math.round(x-t*(y-cy)); if (x0>=0&&x0<W) acc[ti*W+x0]+=1; } }
  const minLen=H*0.28, lines=[];
  for (let n=0;n<24;n++){ let best=0,bi=-1; for (let q=0;q<acc.length;q++) if (acc[q]>best){ best=acc[q]; bi=q; } if (best<minLen) break;
    const ti=Math.floor(bi/W), x0=bi%W; lines.push({t:T0+ti*TS, u:(x0-W/2)/W, v:best});
    for (let a=Math.max(0,ti-4);a<=Math.min(TN-1,ti+4);a++) for (let b=Math.max(0,x0-8);b<=Math.min(W-1,x0+8);b++) acc[a*W+b]=0; }
  if (lines.length<2) return null;
  // náklon nahoru = −t ; regrese lean = r + k·u (k jen když jsou čáry na obou stranách)
  const ln=lines.map(l=>({u:l.u, lean:-l.t, w:l.v})), left=ln.some(l=>l.u<-0.12), right=ln.some(l=>l.u>0.12);
  let r=0, kk=0;
  if (left&&right&&ln.length>=3){ let sw=0,su=0,sl=0,suu=0,sul=0; for (const l of ln){ sw+=l.w; su+=l.w*l.u; sl+=l.w*l.lean; suu+=l.w*l.u*l.u; sul+=l.w*l.u*l.lean; } const den=sw*suu-su*su; if (den>1e-9){ kk=(sw*sul-su*sl)/den; r=(sl-kk*su)/sw; } }
  else { const s=ln.map(l=>l.lean).sort((a,b)=>a-b); r=s[s.length>>1]; }
  // kontrola: zbytky po regresi malé (jinak to nejsou opravdové svislice)
  let res=0; for (const l of ln) res+=Math.abs(l.lean-(r+kk*l.u)); res/=ln.length; if (res>0.03) return null;
  const MAX=0.14; r=clamp(r,-MAX,MAX); kk=clamp(kk,-2*MAX,2*MAX);
  if (Math.abs(r)<0.004 && Math.abs(kk)<0.012) return null;
  return {r, k:kk, n:ln.length}; };
PH.upright = (im, p) => { if (!p) return im; const {W,H,f}=im, cx=W/2, cy=H/2, o=new Float32Array(f.length);
  // okraje, kde by po srovnání chyběl obraz → oříznout (+ ~2 %)
  const mx=(Math.abs(p.r)+Math.abs(p.k)*0.5)*H/2 + W*0.02, my=Math.abs(p.r)*W/2 + H*0.02, sx=(W-2*mx)/W, sy=(H-2*my)/H;
  for (let y=0;y<H;y++){ const yo=cy+(y-cy)*sy; for (let x=0;x<W;x++){ const xo=cx+(x-cx)*sx;
    const lean=p.r+p.k*(xo-cx)/W, xs=xo+lean*(cy-yo), ys=yo+p.r*(xo-cx);
    const ix=Math.floor(xs), iy=Math.floor(ys), ax=xs-ix, ay=ys-iy, x0=clamp(ix,0,W-1), x1=clamp(ix+1,0,W-1), y0=clamp(iy,0,H-1), y1=clamp(iy+1,0,H-1), j=(y*W+x)*3;
    for (let c=0;c<3;c++) o[j+c]=(f[(y0*W+x0)*3+c]*(1-ax)+f[(y0*W+x1)*3+c]*ax)*(1-ay)+(f[(y1*W+x0)*3+c]*(1-ax)+f[(y1*W+x1)*3+c]*ax)*ay; } }
  return {W,H,f:o}; };
// ---------- rozmazání (rozptyl Laplaciánu) ----------
PH.sharpness = im => { const k=Math.min(1,800/Math.max(im.W,im.H)), W=Math.round(im.W*k), H=Math.round(im.H*k), L=lumOf(resize(im,W,H)); let s=0,s2=0,n=0;
  for (let y=1;y<H-1;y++) for (let x=1;x<W-1;x++){ const i=y*W+x, v=4*L[i]-L[i-1]-L[i+1]-L[i-W]-L[i+W]; s+=v; s2+=v*v; n++; } const m=s/n; return s2/n-m*m; };
// ---------- AI úklid v telefonu (zdarma): MI-GAN – vymaže označené místo a dopočítá ho z okolí ----------
let ortSess=null;
async function migan(){ if (ortSess) return ortSess;
  if (!global.ort){ await new Promise((ok,ko)=>{ const s=document.createElement('script'); s.src='vendor/ort/ort.wasm.min.js'; s.onload=ok; s.onerror=()=>ko(new Error('AI knihovna se nenačetla')); document.head.appendChild(s); }); }
  ort.env.wasm.wasmPaths=new URL('vendor/ort/',location.href).href; ort.env.wasm.numThreads=1;
  ortSess=await ort.InferenceSession.create(new URL('models/migan.onnx',location.href).href,{executionProviders:['wasm']}); return ortSess; }
PH.inpaintReady=()=>!!ortSess;
// mask: Uint8Array W*H (1 = vymazat). Vrací nový obrázek.
PH.inpaint = async (im, mask, onP) => {
  const {W,H}=im; let x0=W,y0=H,x1=-1,y1=-1;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (mask[y*W+x]){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  if (x1<0) return im;
  onP&&onP(0.1,'Načítám AI model…'); const s=await migan(); onP&&onP(0.5,'AI maže a dopočítává…');
  // čtvercový výřez kolem masky (s okolím, aby model věděl, čím díru vyplnit)
  const bw=x1-x0+1, bh=y1-y0+1, side=Math.min(Math.max(W,H), Math.max(Math.round(Math.max(bw,bh)*2.2), 256));
  let cx0=Math.round((x0+x1)/2-side/2), cy0=Math.round((y0+y1)/2-side/2); cx0=clamp(cx0,0,Math.max(0,W-side)); cy0=clamp(cy0,0,Math.max(0,H-side));
  const sw=Math.min(side,W), sh=Math.min(side,H), S=512, N=S*S, t=new Float32Array(4*N), f=im.f;
  // dilatace masky o pár px (okraje objektu, stíny)
  const dil=new Uint8Array(W*H), R=Math.max(2,Math.round(Math.max(bw,bh)*0.04));
  for (let y=Math.max(0,y0-R);y<=Math.min(H-1,y1+R);y++) for (let x=Math.max(0,x0-R);x<=Math.min(W-1,x1+R);x++){ let on=0; for (let dy=-R;dy<=R&&!on;dy+=Math.max(1,R>>1)) for (let dx=-R;dx<=R&&!on;dx+=Math.max(1,R>>1)){ const yy=y+dy, xx=x+dx; if (yy>=0&&yy<H&&xx>=0&&xx<W&&mask[yy*W+xx]) on=1; } dil[y*W+x]=on; }
  for (let j=0;j<S;j++) for (let i=0;i<S;i++){ const sx=Math.min(W-1,cx0+Math.floor((i+0.5)*sw/S)), sy=Math.min(H-1,cy0+Math.floor((j+0.5)*sh/S)), k=j*S+i, q=sy*W+sx, m=dil[q]?0:1;
    t[k]=m-0.5; for (let c=0;c<3;c++) t[(1+c)*N+k]=(clamp(f[q*3+c],0,1)*2-1)*m; }
  const o=(await s.run({input:new ort.Tensor('float32',t,[1,4,S,S])})).output.data;
  onP&&onP(0.9,'Skládám…');
  // zpět do fotky: jen v (rozšířené) masce, s měkkým okrajem a srovnáním jasu/barvy na okraji
  const soft=blurGray(Float32Array.from(dil),W,H,Math.max(2,R)), out=new Float32Array(f);
  const sample=(c,x,y)=>{ const u=clamp((x-cx0)*S/sw-0.5,0,S-1), v=clamp((y-cy0)*S/sh-0.5,0,S-1), ix=Math.floor(u), iy=Math.floor(v), ax=u-ix, ay=v-iy, i1=Math.min(S-1,ix+1), j1=Math.min(S-1,iy+1), P=c*N;
    return ((o[P+iy*S+ix]*(1-ax)+o[P+iy*S+i1]*ax)*(1-ay)+(o[P+j1*S+ix]*(1-ax)+o[P+j1*S+i1]*ax)*ay+1)/2; };
  // barevný posun na okraji (model občas lehce ztmaví)
  let dr=[0,0,0], dn=0; for (let y=Math.max(cy0,y0-2*R);y<=Math.min(cy0+sh-1,y1+2*R);y+=2) for (let x=Math.max(cx0,x0-2*R);x<=Math.min(cx0+sw-1,x1+2*R);x+=2){ const q=y*W+x; if (soft[q]>0.02 && soft[q]<0.5 && !dil[q]){ for (let c=0;c<3;c++) dr[c]+=f[q*3+c]-sample(c,x,y); dn++; } }
  if (dn) dr=dr.map(v=>v/dn);
  for (let y=Math.max(0,cy0);y<Math.min(H,cy0+sh);y++) for (let x=Math.max(0,cx0);x<Math.min(W,cx0+sw);x++){ const q=y*W+x, a=Math.min(1,soft[q]*1.6); if (a<=0.001) continue;
    for (let c=0;c<3;c++) out[q*3+c]=f[q*3+c]*(1-a)+clamp(sample(c,x,y)+dr[c],0,1)*a; }
  onP&&onP(1,'Hotovo'); return {W,H,f:out};
};
global.PH = PH;
})(window);
