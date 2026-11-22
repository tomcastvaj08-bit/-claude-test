// ================= REALITNÍ FOTKY – obrazovka, kamera, výsledek =================
(function(){
'use strict';
const $=id=>document.getElementById(id);
let style='bright', lastBlobs=null, lastRes=null, phBusy=false;

function showPhoto(){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='photo')); $('phStart').hidden=false; $('phRes').hidden=true; window.scrollTo(0,0); }
$('modePhoto').onclick=showPhoto;
$('phBack').onclick=()=>{ if (!$('phRes').hidden){ $('phRes').hidden=true; $('phStart').hidden=false; return; } document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='home')); };
$('phStyle').onclick=e=>{ const c=e.target.closest('[data-v]'); if (!c) return; style=c.dataset.v; $('phStyle').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c)); };

// otočení fotky (telefon držený na šířku, když prohlížeč zůstane na výšku)
async function rotBlob(b, dir){ const bmp=await createImageBitmap(b,{imageOrientation:'from-image'}); if (bmp.width>=bmp.height) return b;   // snímek už je na šířku → nechat const c=document.createElement('canvas'); c.width=bmp.height; c.height=bmp.width; const x=c.getContext('2d');
  x.translate(c.width/2,c.height/2); x.rotate(dir*Math.PI/2); x.drawImage(bmp,-bmp.width/2,-bmp.height/2); return await new Promise(r=>c.toBlob(r,'image/jpeg',0.95)); }
function holdDir(){ // +1 = otočit po směru hodin, −1 = proti, 0 = držený na výšku
  const [gx,gy]=grav; if (Math.abs(gx)<4 || Math.abs(gx)<Math.abs(gy)*1.3) return 0;
  const portraitScreen=!(screen.orientation&&/landscape/.test(screen.orientation.type)) && Math.abs(window.orientation||0)!==90; if (!portraitScreen) return 0;
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent); return ((ios?-1:1)*gx>0) ? 1 : -1; }
function rotImg(im){ const {W,H,f}=im, o=new Float32Array(f.length); for (let y=0;y<H;y++) for (let x=0;x<W;x++){ const nx=H-1-y, ny=x, i=(y*W+x)*3, j=(ny*H+nx)*3; o[j]=f[i]; o[j+1]=f[i+1]; o[j+2]=f[i+2]; } return {W:H,H:W,f:o}; }
// telefony (hlavně iPhone v Safari) mají na stránku málo paměti → menší pracovní rozlišení, ať appka nespadne
const lowMem=()=>/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.deviceMemory && navigator.deviceMemory<=4);
// ---------- zpracování ----------
async function run(blobs){
  if (phBusy || !blobs || !blobs.length) return; phBusy=true; lastBlobs=blobs;
  const busyOn=(t,s,p)=>{ try{ busy(t,s,p); }catch(e){} };
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='busy'));
  try{
    const big = Math.max(screen.width,screen.height)*(window.devicePixelRatio||1);
    const res = await PH.process(blobs,{style, maxSide: blobs.length>1 ? (lowMem()?1500:2000) : (lowMem()?1900:2400), onP:(p,m)=>busyOn('Realitní fotka',m||'',p)});
    lastRes=res; showResult(res);
  }catch(e){ console.error(e); showPhoto(); toastP('Fotku se nepodařilo zpracovat: '+(e.message||e)); }
  finally{ phBusy=false; }
}
function toastP(m){ try{ toast(m); }catch(e){ alert(m); } }
function showResult(res){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='photo'));
  $('phStart').hidden=true; $('phRes').hidden=false;
  PH.toCanvas(res.out,$('phAfter')); PH.toCanvas(res.before,$('phBefore'));
  $('phInfo').textContent = res.count>1 ? `Spojeno ${res.count} expozic · ${res.out.W}×${res.out.H} px · styl ${style==='sunrise'?'Východ slunce':'Světlý a bílý'}` : `Jedna fotka – vyladěné světlo a barvy · ${res.out.W}×${res.out.H} px`;
  setSplit(0.5); window.scrollTo(0,0);
}
// porovnání před / po (tažení prstem)
function setSplit(k){ k=Math.max(0,Math.min(1,k)); $('phBeforeWrap').style.clipPath=`inset(0 ${(1-k)*100}% 0 0)`; $('phHandle').style.left=(k*100)+'%'; }
(()=>{ const box=$('phCmp'); let on=false; const mv=e=>{ const r=box.getBoundingClientRect(), x=(e.touches?e.touches[0].clientX:e.clientX); setSplit((x-r.left)/r.width); };
  box.addEventListener('pointerdown',e=>{ on=true; box.setPointerCapture(e.pointerId); mv(e); }); box.addEventListener('pointermove',e=>{ if (on) mv(e); }); box.addEventListener('pointerup',()=>on=false); box.addEventListener('pointercancel',()=>on=false); })();

$('phUp').onchange=e=>{ const fs=[...e.target.files].slice(0,7); e.target.value=''; if (fs.length) run(fs); };
$('phRot').onclick=()=>{ if (!lastRes) return; lastRes.out=rotImg(lastRes.out); lastRes.before=rotImg(lastRes.before); showResult(lastRes); };
$('phAgain').onclick=()=>{ $('phRes').hidden=true; $('phStart').hidden=false; openCam(); };
$('phRestyle').onclick=()=>{ style=style==='bright'?'sunrise':'bright'; $('phStyle').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x.dataset.v===style)); if (lastBlobs) run(lastBlobs); };
$('phSave').onclick=async()=>{
  const c=$('phAfter'); const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.95)); const name='efektive-reality-'+Date.now()+'.jpg';
  try{ if (window.NATIVE && NATIVE.isNative && NATIVE.saveVideo){ const r=await NATIVE.saveVideo(blob,name); if (r==='saved'){ toastP('Fotka je ve Fotkách'); return; } } }catch(e){}
  try{ const f=new File([blob],name,{type:'image/jpeg'}); if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); return; } }catch(e){ if (e && e.name==='AbortError') return; }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },4000);
};

// ---------- kamera ----------
let still=0, lastAcc=null, levelOK=false, motionOn=false, grav=[0,0,0];
function onMotion(e){ const a=e.accelerationIncludingGravity||e.acceleration; if (!a) return; const v=[a.x||0,a.y||0,a.z||0]; if (e.accelerationIncludingGravity) grav=grav.map((g,i)=>g*0.8+v[i]*0.2);
  if (lastAcc){ const d=Math.hypot(v[0]-lastAcc[0],v[1]-lastAcc[1],v[2]-lastAcc[2]); still = still*0.85 + d*0.15; } lastAcc=v; updPill(); }
function onOrient(e){ // na šířku: náklon kolem osy pohledu = beta (nebo gamma podle natočení)
  const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  let roll = Math.abs(ang)===90 ? (e.beta||0)*(ang===90?1:-1) : (e.gamma||0);
  const lv=$('phLevel'); lv.style.setProperty('--roll',(-roll)+'deg'); levelOK=Math.abs(roll)<1.5; lv.classList.toggle('ok',levelOK); updPill(); }
function updPill(){ const ok = levelOK && still<0.35; const p=$('phPill'); p.classList.toggle('ok',ok); p.querySelector('span').textContent = ok?'Rovně a v klidu – vyfoť teď':(!levelOK?'Narovnej telefon (zelená čára)':'Drž telefon v klidu'); }
async function openCam(){
  $('phCam').hidden=false; document.body.classList.add('ph-camon');
  try{
    if (typeof DeviceMotionEvent!=='undefined' && DeviceMotionEvent.requestPermission){ try{ await DeviceMotionEvent.requestPermission(); }catch(e){} }
    if (typeof DeviceOrientationEvent!=='undefined' && DeviceOrientationEvent.requestPermission){ try{ await DeviceOrientationEvent.requestPermission(); }catch(e){} }
    if (!motionOn){ window.addEventListener('devicemotion',onMotion); window.addEventListener('deviceorientation',onOrient); motionOn=true; }
    try{ if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); }catch(e){}
    const mode=await PH.camera.open($('phVideo'));
    if (window.NATIVE&&NATIVE.plugin&&NATIVE.plugin('Bracket')){ $('phMode').textContent='5 expozic · −6 až +2 EV · plné rozlišení'; dots(0,5); return; }
    $('phMode').textContent = mode==='time' ? '5 expozic · −6 až +2 EV' : mode==='comp' ? '5 expozic · −2 až +2 EV' : 'Tento prohlížeč neumí měnit expozici – vyfotím 1 záběr (5 expozic umí mobilní aplikace)';
    dots(0, mode==='none'?1:5);
  }catch(e){ console.warn(e); closeCam(); toastP('Kamera nejde spustit – povol přístup ke kameře, nebo nahraj fotky z galerie'); }
}
function closeCam(){ PH.camera.close(); $('phCam').hidden=true; document.body.classList.remove('ph-camon'); try{ screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); }catch(e){} }
function dots(k,n){ $('phDots').innerHTML = `<b>${k}/${n}</b>`+Array.from({length:n},(_,i)=>`<i class="${i<k?'on':''}"></i>`).join(''); }
$('phShoot').onclick=openCam;
$('phCamClose').onclick=closeCam;
$('phShutter').onclick=async()=>{
  if ($('phShutter').disabled) return; $('phShutter').disabled=true; $('phCam').classList.add('shooting');
  try{ const dir=holdDir(); const nb=window.NATIVE&&NATIVE.plugin&&NATIVE.plugin('Bracket');
    if (nb){ // mobilní aplikace: skutečná expoziční řada v plném rozlišení (Camera2)
      PH.camera.close(); dots(0,5); const r=await nb.capture({evs:PH.EVS, wide:true}); closeCam();
      const shots=[]; for (const p of r.paths){ const u=window.Capacitor.convertFileSrc(p); shots.push(await (await fetch(u)).blob()); }
      run(shots); return; }
    const r=await PH.camera.bracket((k,n)=>dots(k,n)); closeCam(); let shots=r.shots; if (dir){ shots=[]; for (const b of r.shots) shots.push(await rotBlob(b,dir)); } run(shots); }
  catch(e){ console.warn(e); toastP('Focení se nepovedlo: '+(e.message||e)); }
  finally{ $('phShutter').disabled=false; $('phCam').classList.remove('shooting'); }
};
// ---------- AI dokončení ----------
let aiBusy=false;
$('phAi').onclick=async e=>{ const b=e.target.closest('[data-t]'); if (!b || aiBusy || !lastRes) return; aiBusy=true;
  const task=b.dataset.t, label=b.textContent; document.querySelectorAll('#phAi button').forEach(x=>x.disabled=true); b.classList.add('busy');
  $('phAiNote').textContent='AI pracuje na úpravě „'+label+'“… (10–30 s)';
  try{
    const base=lastRes.out, k=Math.min(1,2048/Math.max(base.W,base.H)), c=document.createElement('canvas'); c.width=Math.round(base.W*k); c.height=Math.round(base.H*k);
    c.getContext('2d').drawImage($('phAfter'),0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.9));
    const hd={'Content-Type':'image/jpeg'}; try{ const q=localStorage.getItem('efk_aiquota'); if (q) hd['X-AiQuota']=JSON.parse(q); }catch(e){} try{ const pp=PRO.get(); if (pp&&pp.token) hd['X-Pro']=pp.token; }catch(e){}
    const api=(window.NATIVE&&NATIVE.api)?NATIVE.api('/api/enhance?task='+task):'/api/enhance?task='+task;
    const r=await fetch(api,{method:'POST',headers:hd,body:blob}); const j=await r.json().catch(()=>({error:'Server neodpověděl'}));
    if (j.quota) try{ localStorage.setItem('efk_aiquota',JSON.stringify(j.quota)); }catch(e){}
    if (!r.ok || !j.image) throw new Error(j.error||('Chyba '+r.status));
    const bin=atob(j.image), u=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
    const ai=await PH.toImg(new Blob([u],{type:j.mime||'image/png'}), 4096);
    const bl=PH.aiBlend(base, ai);
    lastRes={...lastRes, out:bl.out}; showResult(lastRes);
    $('phAiNote').textContent=`Hotovo: ${label}`+(bl.blended?' · detaily z tvé fotky':' · '+bl.why)+(j.left!=null?` · zbývá dnes zdarma: ${j.left}`:'');
  }catch(err){ console.warn(err); $('phAiNote').textContent='AI úprava se nepovedla: '+(err.message||err); }
  finally{ aiBusy=false; document.querySelectorAll('#phAi button').forEach(x=>{ x.disabled=false; x.classList.remove('busy'); }); }
};
window.__ph={run, showPhoto, openCam};
})();
