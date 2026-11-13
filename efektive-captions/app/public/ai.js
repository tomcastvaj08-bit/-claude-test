/* EFEKTIVE Captions – chytré funkce (AI)
   - obličej: titulek automaticky pod obličej
   - postava: maska pro „text za postavou“
   - barva z videa, náklon podle linií ve scéně */
"use strict";
(function(){
const AI = window.AI = {};
const E = window.E;
const clamp=E.clamp;
let fd=null, ss=null, fdRes=null, ssRes=null;
AI.masks=[];      // [{t, c:canvas}] pro náhled
AI.maskStep=1/10;

function seek(v,t){ return new Promise(r=>{ const done=()=>{ v.removeEventListener('seeked',done); r(); }; v.addEventListener('seeked',done); v.currentTime=Math.min(Math.max(0,t),(v.duration||t)-0.01); setTimeout(done,3000); }); }
AI.seek=seek;
function grab(v, maxSide){
  const sc=Math.min(1,maxSide/Math.max(v.videoWidth,v.videoHeight));
  const c=document.createElement('canvas'); c.width=Math.round(v.videoWidth*sc); c.height=Math.round(v.videoHeight*sc);
  c.getContext('2d').drawImage(v,0,0,c.width,c.height); return c;
}
AI.grab=grab;

// ---------- OBLIČEJ ----------
async function faceModel(){
  if (fd) return fd;
  if (!window.FaceDetection) throw new Error('Model obličeje se nenačetl');
  fd=new FaceDetection({locateFile:f=>'vendor/face/'+f});
  fd.setOptions({model:'short',minDetectionConfidence:0.5});
  fd.onResults(r=>{ fdRes=r; });
  await fd.initialize();
  return fd;
}
AI.detectFace = async (img) => {
  const m=await faceModel(); fdRes=null; await m.send({image:img});
  const d=(fdRes&&fdRes.detections)||[]; if (!d.length) return null;
  // největší obličej
  let best=null, area=0;
  for (const x of d){ const b=x.boundingBox; const a=b.width*b.height; if (a>area){ area=a; best=b; } }
  return [best.xCenter-best.width/2, best.yCenter-best.height/2, best.xCenter+best.width/2, best.yCenter+best.height/2];
};
// projde video po 0,2 s a uloží polohu obličeje (E.face[index po 0,1 s])
AI.analyzeFaces = async (v, onP) => {
  const dur=v.duration, step=0.2, out=new Array(Math.ceil(dur*10)+2).fill(null);
  for (let t=0; t<dur; t+=step){
    await seek(v,t); let f=null;
    try{ f=await AI.detectFace(grab(v,480)); }catch(e){ console.warn(e); }
    for (let k=0;k<2;k++){ const i=Math.round(t*10)+k; if (i<out.length) out[i]=f; }
    onP&&onP(t/dur);
  }
  E.face=out; return out;
};

// ---------- POSTAVA (odstranění pozadí) ----------
async function segModel(){
  if (ss) return ss;
  if (!window.SelfieSegmentation) throw new Error('Model postavy se nenačetl');
  ss=new SelfieSegmentation({locateFile:f=>'vendor/selfie/'+f});
  ss.setOptions({modelSelection:0, selfieMode:false});
  ss.onResults(r=>{ ssRes=r; });
  await ss.initialize();
  return ss;
}
// vrátí canvas s maskou postavy (bílá = postava)
AI.segment = async (img, w, h) => {
  const m=await segModel(); ssRes=null; await m.send({image:img});
  if (!ssRes || !ssRes.segmentationMask) return null;
  const c=document.createElement('canvas'); c.width=w||ssRes.segmentationMask.width; c.height=h||ssRes.segmentationMask.height;
  const x=c.getContext('2d');
  // zostření okraje masky (měkký práh)
  x.filter='contrast(2.2)'; x.drawImage(ssRes.segmentationMask,0,0,c.width,c.height); x.filter='none';
  return c;
};
AI.analyzePerson = async (v, onP) => {
  const dur=v.duration, out=[]; const step=AI.maskStep;
  for (let t=0;t<dur;t+=step){
    await seek(v,t);
    try{ const img=grab(v,512); const m=await AI.segment(img,Math.round(img.width/2),Math.round(img.height/2)); out.push({t,c:m}); }catch(e){ console.warn(e); out.push({t,c:null}); }
    onP&&onP(t/dur);
  }
  AI.masks=out; AI.useMasks(); return out;
};
AI.useMasks = () => { E.personMask = t => { if (!AI.masks.length) return null; const i=clamp(Math.round(t/AI.maskStep),0,AI.masks.length-1); return AI.masks[i].c; }; };

// ---------- BARVA Z VIDEA ----------
function rgb2hsl(r,g,b){ r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b); let h=0,s=0; const l=(mx+mn)/2; if(mx!==mn){ const d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn); h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; } return [h,s,l]; }
function hsl2hex(h,s,l){ h=((h%360)+360)%360; const a=s*Math.min(l,1-l); const f=n=>{ const k=(n+h/30)%12; const c=l-a*Math.max(-1,Math.min(k-3,9-k,1)); return Math.round(c*255).toString(16).padStart(2,'0'); }; return '#'+f(0)+f(8)+f(4); }
AI.hsl2hex=hsl2hex;
// vybere převládající výraznou barvu ve videu a navrhne 4 kombinace (ladící, kontrastní, zlatá, ledová)
AI.suggestColors = async (v) => {
  const dur=v.duration, hist=new Array(36).fill(0); let lum=0, n=0;
  for (let i=1;i<=6;i++){
    await seek(v,dur*i/7); const c=grab(v,96), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    for (let p=0;p<d.length;p+=4){ const [h,s,l]=rgb2hsl(d[p],d[p+1],d[p+2]); lum+=l; n++; if (s>0.28 && l>0.18 && l<0.85) hist[Math.floor(h/10)%36]+=s; }
  }
  let bi=0; for (let i=1;i<36;i++) if (hist[i]>hist[bi]) bi=i;
  const hue=bi*10+5, hasColor=hist[bi]>n*0.02;
  const H = hasColor ? hue : 35;
  const list=[
    {name:'Ladí s videem', gA:hsl2hex(H-12,1,0.62), gB:hsl2hex(H+12,1,0.5)},
    {name:'Kontrast', gA:hsl2hex(H+180-15,1,0.62), gB:hsl2hex(H+180+15,1,0.5)},
    {name:'Zlatá', gA:'#ff9300', gB:'#fff200'},
    {name:'Ledová', gA:'#8fe0ff', gB:'#0a62e6'},
  ];
  return {hue:H, dark:lum/n<0.45, list};
};

// ---------- NÁKLON PODLE SCÉNY ----------
// hledá převládající šikmé linie (regály, stůl, okna) v oblasti titulku a vrátí doporučený 3D náklon a rotaci
AI.suggestTilt = async (v, t, posY) => {
  await seek(v,t); const c=grab(v,320), W=c.width, H=c.height, d=c.getContext('2d').getImageData(0,0,W,H).data;
  const g=new Float32Array(W*H); for (let i=0;i<W*H;i++) g[i]=(d[i*4]*0.3+d[i*4+1]*0.59+d[i*4+2]*0.11);
  const y0=Math.floor(H*clamp(posY/100-0.25,0,1)), y1=Math.floor(H*clamp(posY/100+0.2,0,1));
  const sides=[[1,Math.floor(W/2)],[Math.floor(W/2),W-1]], res=[];
  for (const [x0,x1] of sides){
    const bins=new Float32Array(61); // -30..30°
    for (let y=Math.max(1,y0);y<Math.min(H-1,y1);y++) for (let x=Math.max(1,x0);x<Math.min(W-1,x1);x++){
      const i=y*W+x;
      const gx=g[i+1-W]+2*g[i+1]+g[i+1+W]-g[i-1-W]-2*g[i-1]-g[i-1+W];
      const gy=g[i+W-1]+2*g[i+W]+g[i+W+1]-g[i-W-1]-2*g[i-W]-g[i-W+1];
      const m=Math.hypot(gx,gy); if (m<60) continue;
      // směr hrany je kolmý na gradient
      let a=Math.atan2(gy,gx)*180/Math.PI-90; while(a<-90)a+=180; while(a>90)a-=180;
      if (Math.abs(a)<=30) bins[Math.round(a)+30]+=m;
    }
    let bi=30, sum=0; for (let i=0;i<61;i++){ sum+=bins[i]; if (bins[i]>bins[bi]) bi=i; }
    res.push({a:bi-30, w:sum});
  }
  const [L,R]=res;
  // linie se sbíhají (vlevo stoupá, vpravo klesá apod.) → perspektiva do strany
  const diff=R.a-L.a, avg=(L.a*L.w+R.a*R.w)/Math.max(1,L.w+R.w);
  const tilt=clamp(Math.round(-diff*0.9),-30,30) || (avg>3?12:avg<-3?-12:0);
  return {tilt:Math.abs(tilt), sign:Math.sign(tilt)||1, rot:clamp(Math.round(avg*0.5),-8,8), lines:[L.a,R.a]};
};
})();
