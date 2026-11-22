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
    const res = await PH.process(blobs,{style, upright:$('phUpright')?$('phUpright').checked:true, maxSide: blobs.length>1 ? (lowMem()?1500:2000) : (lowMem()?1900:2400), onP:(p,m)=>busyOn('Realitní fotka',m||'',p)});
    res.orig=res.out; lastRes=res; showResult(res);
  }catch(e){ console.error(e); showPhoto(); toastP('Fotku se nepodařilo zpracovat: '+(e.message||e)); }
  finally{ phBusy=false; }
}
function toastP(m){ try{ toast(m); }catch(e){ alert(m); } }
function showResult(res){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='photo'));
  $('phStart').hidden=true; $('phRes').hidden=false;
  PH.toCanvas(res.out,$('phAfter')); PH.toCanvas(res.before,$('phBefore'));
  $('phInfo').textContent = res.count>1 ? `Spojeno ${res.count} expozic · ${res.out.W}×${res.out.H} px · styl ${style==='sunrise'?'Východ slunce':'Světlý a bílý'}` : `Jedna fotka – vyladěné světlo a barvy · ${res.out.W}×${res.out.H} px`;
  const notes=[]; if (res.blurry) notes.push('⚠ Fotka je rozmazaná – vyfoť ji znovu a drž telefon v klidu'); if (res.upright) notes.push('Svislice srovnané');
  $('phWarn').textContent=notes.join(' · '); $('phWarn').classList.toggle('bad',!!res.blurry); $('phWarn').hidden=!notes.length;
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
let still=0, lastAcc=null, levelOK=false, motionOn=false, grav=[0,0,0], rot=99, lin=99, sensors=false, gateOK=true;
function onMotion(e){ sensors=true; const rr=e.rotationRate; if (rr) rot=rot*0.7+Math.hypot(rr.alpha||0,rr.beta||0,rr.gamma||0)*0.3; const la=e.acceleration; if (la && la.x!=null) lin=lin*0.7+Math.hypot(la.x||0,la.y||0,la.z||0)*0.3;
  const a=e.accelerationIncludingGravity||e.acceleration; if (!a) return; const v=[a.x||0,a.y||0,a.z||0]; if (e.accelerationIncludingGravity) grav=grav.map((g,i)=>g*0.8+v[i]*0.2);
  if (lastAcc){ const d=Math.hypot(v[0]-lastAcc[0],v[1]-lastAcc[1],v[2]-lastAcc[2]); still = still*0.85 + d*0.15; } lastAcc=v; updPill(); }
function onOrient(e){ // na šířku: náklon kolem osy pohledu = beta (nebo gamma podle natočení)
  const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  let roll = Math.abs(ang)===90 ? (e.beta||0)*(ang===90?1:-1) : (e.gamma||0);
  const lv=$('phLevel'); lv.style.setProperty('--roll',(-roll)+'deg'); levelOK=Math.abs(roll)<1.5; lv.classList.toggle('ok',levelOK); updPill(); }
// brána před spouští (jako ProMyPhoto): rovně (< 1,5°) a v klidu (otáčení < 3 °/s, pohyb < 0,3 m/s²)
function updPill(){ const calm = (rot<3 || rot===99) && (lin<0.3 || lin===99) && still<0.35; const ok = levelOK && calm; gateOK = !sensors || ok;
  const sh=$('phShutter'); if (sh) sh.classList.toggle('locked', !gateOK); const p=$('phPill'); p.classList.toggle('ok',ok); p.querySelector('span').textContent = ok?'Rovně a v klidu – vyfoť teď':(!levelOK?'Narovnej telefon (zelená čára)':'Drž telefon v klidu'); }
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
  if ($('phShutter').disabled) return;
  if (!gateOK){ try{ navigator.vibrate && navigator.vibrate(40); }catch(e){} toastP(levelOK?'Drž telefon chvilku v klidu':'Narovnej telefon – spoušť se odemkne, až bude rovně a v klidu'); return; }
  $('phShutter').disabled=true; $('phCam').classList.add('shooting');
  try{ const dir=holdDir(), bias=PH.highlightBias($('phVideo')); const nb=window.NATIVE&&NATIVE.plugin&&NATIVE.plugin('Bracket');
    if (nb){ // mobilní aplikace: skutečná expoziční řada v plném rozlišení (Camera2)
      PH.camera.close(); dots(0,5); const r=await nb.capture({evs:PH.ladder(5).map(e=>e+bias), wide:true}); closeCam();
      const shots=[]; for (const p of r.paths){ const u=window.Capacitor.convertFileSrc(p); shots.push(await (await fetch(u)).blob()); }
      run(shots); return; }
    const r=await PH.camera.bracket((k,n)=>dots(k,n),{bias}); closeCam(); let shots=r.shots; if (dir){ shots=[]; for (const b of r.shots) shots.push(await rotBlob(b,dir)); } run(shots); }
  catch(e){ console.warn(e); toastP('Focení se nepovedlo: '+(e.message||e)); }
  finally{ $('phShutter').disabled=false; $('phCam').classList.remove('shooting'); }
};
// ---------- AI úklid zdarma v telefonu: Uklidit (štětec), Obloha (štětec), Trávník ----------
let brush=null;   // {task, mask:Uint8Array, W,H}
function brushStart(task){ if (!lastRes) return; const {W,H}=lastRes.out; brush={task, mask:new Uint8Array(W*H), W, H, size:Math.round(Math.max(W,H)*0.035)};
  const c=$('phBrush'); c.width=W; c.height=H; c.getContext('2d').clearRect(0,0,W,H); $('phCmp').classList.add('brushing'); setSplit(1);
  $('phBrushBar').hidden=false; $('phBrushT').textContent = task==='declutter' ? 'Přetři prstem, co má zmizet (lidi, věci, kabely…)' : 'Přetři okna a oblohu, kde má být modrá obloha'; }
function brushEnd(){ try{ const c=$('phBrush'); c.getContext('2d').clearRect(0,0,c.width,c.height); }catch(e){} brush=null; $('phCmp').classList.remove('brushing'); $('phBrushBar').hidden=true; setSplit(0.5); }
(()=>{ const c=$('phBrush'); let down=false, last=null;
  const pt=e=>{ const r=c.getBoundingClientRect(); return [(e.clientX-r.left)*c.width/r.width, (e.clientY-r.top)*c.height/r.height]; };
  const dab=(x,y)=>{ const b=brush, R=b.size, x0=Math.max(0,Math.floor(x-R)), x1=Math.min(b.W-1,Math.ceil(x+R)), y0=Math.max(0,Math.floor(y-R)), y1=Math.min(b.H-1,Math.ceil(y+R));
    for (let yy=y0;yy<=y1;yy++) for (let xx=x0;xx<=x1;xx++) if ((xx-x)*(xx-x)+(yy-y)*(yy-y)<=R*R) b.mask[yy*b.W+xx]=1;
    const g=c.getContext('2d'); g.fillStyle=b.task==='declutter'?'rgba(255,60,60,.45)':'rgba(60,140,255,.45)'; g.beginPath(); g.arc(x,y,R,0,Math.PI*2); g.fill(); };
  const line=(a,b2)=>{ const d=Math.hypot(b2[0]-a[0],b2[1]-a[1]), st=Math.max(1,brush.size/3); for (let t=0;t<=d;t+=st) dab(a[0]+(b2[0]-a[0])*t/d, a[1]+(b2[1]-a[1])*t/d); dab(b2[0],b2[1]); };
  c.addEventListener('pointerdown',e=>{ if (!brush) return; e.preventDefault(); e.stopPropagation(); down=true; c.setPointerCapture(e.pointerId); last=pt(e); dab(...last); });
  c.addEventListener('pointermove',e=>{ if (!brush||!down) return; e.preventDefault(); e.stopPropagation(); const p=pt(e); line(last,p); last=p; });
  const up=()=>{ down=false; }; c.addEventListener('pointerup',up); c.addEventListener('pointercancel',up); })();
$('phBrushCancel').onclick=brushEnd;
$('phBrushUndo').onclick=()=>{ if (!brush) return; brush.mask.fill(0); $('phBrush').getContext('2d').clearRect(0,0,brush.W,brush.H); };
$('phBrushOk').onclick=async()=>{ if (!brush || aiBusy) return; const b=brush; let any=0; for (let i=0;i<b.mask.length;i+=7) if (b.mask[i]){ any=1; break; } if (!any){ toastP('Nejdřív přetři místo prstem'); return; }
  aiBusy=true; $('phBrushOk').disabled=true; $('phAiNote').textContent = b.task==='declutter' ? 'AI maže a dopočítává (v telefonu, zdarma)…' : 'Měním oblohu…';
  try{
    let out;
    if (b.task==='declutter') out=await PH.inpaint(lastRes.out, b.mask, (p,m)=>{ $('phAiNote').textContent=m; });
    else { const sm=PH.skyMask(lastRes.out); for (let i=0;i<sm.length;i++) if (!b.mask[i]) sm[i]=0; out=PH.skyWith(lastRes.out, sm); }
    lastRes={...lastRes, out}; brushEnd(); showResult(lastRes); $('phAiNote').textContent = b.task==='declutter' ? 'Hotovo: uklizeno · můžeš přetřít další místo' : 'Hotovo: nová obloha';
  }catch(err){ console.warn(err); $('phAiNote').textContent='Úprava se nepovedla: '+(err.message||err); }
  finally{ aiBusy=false; $('phBrushOk').disabled=false; }
};
$('phLocal').onclick=e=>{ const b=e.target.closest('[data-t]'); if (!b || aiBusy || !lastRes) return; const t=b.dataset.t;
  if (t==='declutter'||t==='sky') return brushStart(t);
  if (t==='lawn'){ const r=PH.lawn(lastRes.out); if (!r.changed){ $('phAiNote').textContent='Na fotce jsem nenašel trávník'; return; } lastRes={...lastRes, out:r.out}; showResult(lastRes); $('phAiNote').textContent='Hotovo: zelenější trávník'; }
  if (t==='undo' && lastRes.orig){ lastRes={...lastRes, out:lastRes.orig}; showResult(lastRes); $('phAiNote').textContent='Vráceno na původní výsledek'; } };
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
