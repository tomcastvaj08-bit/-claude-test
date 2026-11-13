/* EFEKTIVE Captions – aplikace (obrazovky, editor, časová osa, panely) */
"use strict";
const $=id=>document.getElementById(id);
const clamp=E.clamp;
const vid=$('vid'), cv=$('cv');
E.attach(cv,vid);

// ================= POMOCNÉ =================
// hláška na úvodní obrazovce (systémové okno alert() se uvnitř Claude neukáže)
function homeMsg(m){ let el=document.getElementById('homeMsg'); if (!el){ el=document.createElement('div'); el.id='homeMsg'; el.className='homemsg'; const h=document.querySelector('#home .hero'); (h||document.getElementById('home')).appendChild(el); } el.textContent=m; el.hidden=!m; }
function toast(m){ const t=$('toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),2200); }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id)); }
function fmt(t){ t=Math.max(0,t||0); const m=Math.floor(t/60), s=Math.floor(t%60); return m+':'+String(s).padStart(2,'0'); }
function busy(title,sub,p){ $('busyT').textContent=title; $('busyS').textContent=sub||''; $('busyBar').style.width=(p*100)+'%'; $('busyP').textContent=Math.round(p*100)+' %'; }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function lsGet(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

// ================= STAV APLIKACE =================
let videoFile=null, videoURL=null, project=null, fullW=1080, fullH=1920;
let curPage=0, scope='all', panel='captions', sub={style:'color',templates:'trending',motion:'anim'}, fontTarget='em', textTarget='em';
let selOv=null; const ovAssets={}; // id → {blob, el}
let analysed={face:false, person:false};
const DEFAULT_DICT=`Lidáte → Hledáte
biznisem → byznysem
biznis → byznys
úspěšný → úspěšným
Team → tým
Řidíte → Řídíte
franchisovou → franšízovou
franchisu → franšízu
učetního → účetního
učetnictví → účetnictví
učetní → účetní
strategické data → strategická data
reálnym → reálném
z maximální → s maximální
péči → péčí
daňový poradci → daňoví poradci
vzkušení → zkušení
Získaváte → Získáváte
Přenestte → Přeneste
tváři → tváří
account → Account`;
let dict=lsGet('efk_dict',DEFAULT_DICT);
const parseDict=txt=>txt.split('\n').map(l=>l.split(/\s*(?:→|->|=>|=)\s*/)).filter(a=>a.length===2&&a[0].trim()).map(a=>[a[0].trim(),a[1].trim()]);

// ================= JAZYKY =================
const LANGS=[['','Automaticky rozpoznat'],['cs','Čeština'],['sk','Slovenština'],['en','Angličtina'],['de','Němčina'],['pl','Polština'],['hu','Maďarština'],['es','Španělština'],['fr','Francouzština'],['it','Italština'],['pt','Portugalština'],['nl','Nizozemština'],['sv','Švédština'],['no','Norština'],['da','Dánština'],['fi','Finština'],['ro','Rumunština'],['bg','Bulharština'],['hr','Chorvatština'],['sr','Srbština'],['sl','Slovinština'],['uk','Ukrajinština'],['ru','Ruština'],['lt','Litevština'],['lv','Lotyština'],['et','Estonština'],['el','Řečtina'],['tr','Turečtina'],['ar','Arabština'],['he','Hebrejština'],['hi','Hindština'],['ur','Urdština'],['ta','Tamilština'],['bn','Bengálština'],['th','Thajština'],['vi','Vietnamština'],['id','Indonéština'],['ms','Malajština'],['tl','Filipínština'],['zh','Čínština'],['ja','Japonština'],['ko','Korejština'],['fa','Perština'],['af','Afrikánština'],['sw','Svahilština'],['ca','Katalánština'],['eu','Baskičtina'],['gl','Galicijština'],['is','Islandština'],['ga','Irština'],['cy','Velština'],['la','Latina'],['mk','Makedonština'],['bs','Bosenština'],['be','Běloruština'],['kk','Kazaština'],['az','Ázerbájdžánština'],['hy','Arménština'],['ka','Gruzínština'],['ne','Nepálština'],['mr','Maráthština'],['kn','Kannadština'],['te','Telugština'],['ml','Malajálamština'],['pa','Paňdžábština']];
const BETA=new Set(['sv','it','id','hi','fi','vi','he','uk','el','ms','cs','ro','da','hu','ta','no','th','ur','hr','bg','lt','la']);
let lang=lsGet('efk_lang','cs');
function renderLangs(){
  const q=$('langSearch').value.trim().toLowerCase();
  $('langList').innerHTML=LANGS.filter(([c,n])=>!q||n.toLowerCase().includes(q)||c.includes(q)).map(([c,n])=>`<div data-c="${c}" class="${c===lang?'on':''}">${n}${BETA.has(c)?' <small>(Beta)</small>':''}<small>${c||'auto'}</small></div>`).join('');
}
$('langSearch').oninput=renderLangs;
$('langList').onclick=e=>{ const d=e.target.closest('div[data-c]'); if(!d) return; lang=d.dataset.c; lsSet('efk_lang',lang); renderLangs(); };
document.querySelectorAll('.step').forEach(st=>{
  const b=st.querySelector('b'), [m,p]=st.querySelectorAll('button'), mn=+st.dataset.min, mx=+st.dataset.max;
  m.onclick=()=>{ b.textContent=Math.max(mn,+b.textContent-1); }; p.onclick=()=>{ b.textContent=Math.min(mx,+b.textContent+1); };
});
const stepVal=id=>+document.querySelector(`.step[data-id="${id}"] b`).textContent;
const setStep=(id,v)=>{ document.querySelector(`.step[data-id="${id}"] b`).textContent=v; };
function segBind(id,cb){ $(id).onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; $(id).querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x===d)); cb&&cb(d.dataset.v); }; }
const segVal=id=>$(id).querySelector('.on').dataset.v;
segBind('sQuality'); segBind('exMode',v=>{ $('exInfo').textContent = v==='captions' ? 'Průhledné PNG snímky v ZIPu – vložíš je nad video v CapCutu, Premiere, DaVinci nebo Final Cut.' : 'Přesný export snímek po snímku – titulky jsou plynulé i na 60 fps.'; });

// ================= DOMŮ: šablony a projekty =================
let homeTpl='base';
function tplCard(key,t,extra=''){ return `<div class="tpl${extra}" data-k="${key}"><div class="pv">${t.pv||'<b>Aa</b>'}</div><small>${esc(t.name)}</small></div>`; }
function renderHomeTpl(){
  const all={...E.TEMPLATES, ...customTemplates()};
  $('homeTpl').innerHTML=Object.entries(all).map(([k,t])=>tplCard(k,t,k===homeTpl?' on':'')).join('');
}
$('homeTpl').onclick=e=>{ const c=e.target.closest('.tpl'); if(!c) return; homeTpl=c.dataset.k; renderHomeTpl(); toast('Šablona „'+(E.TEMPLATES[homeTpl]||customTemplates()[homeTpl]).name+'“ – teď nahraj video'); };

// --- projekty v IndexedDB ---
const DB=new Promise((res,rej)=>{ const r=indexedDB.open('efektive-captions',1); r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'}); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
async function dbDo(mode,fn){ const db=await DB; return new Promise((res,rej)=>{ const tx=db.transaction('projects',mode), st=tx.objectStore('projects'); const r=fn(st); tx.oncomplete=()=>res(r&&r.result); tx.onerror=()=>rej(tx.error); }); }
async function renderProjects(){
  let list=[]; try{ list=await dbDo('readonly',st=>st.getAll()); }catch(e){}
  list.sort((a,b)=>b.updated-a.updated);
  $('projects').innerHTML = list.length ? list.map(p=>`<div class="proj" data-id="${p.id}"><img src="${p.thumb||'icon.png'}" alt=""><div class="pn">${esc(p.name)}<small>${new Date(p.updated).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}</small></div><button class="del" data-del="${p.id}">✕</button></div>`).join('') : '<div class="muted">Zatím žádné projekty.</div>';
}
$('projects').onclick=async e=>{
  const d=e.target.closest('[data-del]');
  if (d){ e.stopPropagation(); if (confirm('Smazat projekt?')){ await dbDo('readwrite',st=>st.delete(d.dataset.del)); renderProjects(); } return; }
  const p=e.target.closest('.proj'); if (p) openProject(p.dataset.id);
};
function snapshot(){
  return JSON.stringify({G:E.G, words:E.words, meta:E.meta, zones:E.zones, overlays:E.overlays.map(o=>({...o,src:undefined})), mute:E.flags.mute});
}
function restore(json){
  const s=JSON.parse(json);
  E.G=Object.assign({},E.G,s.G); E.words=s.words; E.meta=s.meta||{}; E.zones=s.zones||[]; E.flags.mute=!!s.mute; vid.muted=E.flags.mute;
  E.setWid(Math.max(0,...E.words.map(w=>w.id))+1);
  E.overlays=(s.overlays||[]).map(o=>({...o, src: o.asset&&ovAssets[o.asset]?ovAssets[o.asset].el:null}));
  E.buildPages(); curPage=clamp(curPage,0,Math.max(0,E.pages.length-1));
}
let saveT=null;
function scheduleSave(){ clearTimeout(saveT); saveT=setTimeout(saveProject,1500); }
async function saveProject(){
  if (!project || !videoFile) return;
  try{
    const th=document.createElement('canvas'); const sc=240/Math.max(cv.width,cv.height); th.width=Math.round(cv.width*sc); th.height=Math.round(cv.height*sc); th.getContext('2d').drawImage(cv,0,0,th.width,th.height);
    const assets=Object.entries(ovAssets).map(([id,a])=>({id,blob:a.blob,type:a.type}));
    const rec={id:project.id,name:project.name,created:project.created,updated:Date.now(),thumb:th.toDataURL('image/jpeg',0.7),file:videoFile,fileName:videoFile.name,state:snapshot(),assets,analysed};
    await dbDo('readwrite',st=>st.put(rec));
  }catch(e){ console.warn('Uložení projektu selhalo',e); }
}
async function openProject(id){
  const rec=await dbDo('readonly',st=>st.get(id)); if (!rec) return;
  project={id:rec.id,name:rec.name,created:rec.created};
  for (const a of rec.assets||[]) await loadAsset(a.id,a.blob);
  await loadVideo(rec.file instanceof File?rec.file:new File([rec.file],rec.fileName||'video.mp4',{type:rec.file.type}));
  restore(rec.state); analysed=rec.analysed||analysed;
  hist=[snapshot()]; hi=0;
  if (analysed.face) toast('Poloha obličeje: při otevření znovu přepočítej v panelu AI, pokud chceš.');
  openEditor();
}

// ================= NAČTENÍ VIDEA =================
function loadVideo(file){
  return new Promise((res,rej)=>{
    videoFile=file; if (videoURL) URL.revokeObjectURL(videoURL); videoURL=URL.createObjectURL(file);
    let done=false; const ok=()=>{ if(done) return; done=true; clearTimeout(to); res(); }, bad=m=>{ if(done) return; done=true; clearTimeout(to); rej(new Error(m)); };
    // iPhone video nenačte, dokud se nespustí → stačí znát rozměry (loadedmetadata), obraz se dočte potom
    vid.onloadedmetadata=()=>{ fullW=vid.videoWidth; fullH=vid.videoHeight; sizeCanvas(); if (fullW&&fullH){ try{ vid.currentTime=0.01; }catch(e){} ok(); } };
    vid.onloadeddata=()=>{ if (!fullW){ fullW=vid.videoWidth; fullH=vid.videoHeight; sizeCanvas(); } ok(); };
    vid.onerror=()=>bad('Tohle video se nedá otevřít. Zkus jiné video, nebo ho ulož jako MP4 (ve Fotkách: Sdílet → Uložit video).');
    const to=setTimeout(()=>bad('Video se nenačetlo do 40 sekund. Zkus to znovu, případně kratší video.'),40000);
    vid.preload='auto'; vid.src=videoURL; vid.muted=E.flags.mute; vid.load();
  });
}
function sizeCanvas(){ const sc=Math.min(1,1280/Math.max(fullW,fullH)); cv.width=Math.round(fullW*sc/2)*2; cv.height=Math.round(fullH*sc/2)*2; }
$('fileIn').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; if (!f) return; homeMsg('');
  // nový projekt se zvolenou šablonou
  E.words=[]; E.pages=[]; E.meta={}; E.zones=[]; E.overlays=[]; E.face=null; E.personMask=null; AI.masks=[]; analysed={face:false,person:false}; E.flags.mute=false;
  for (const k in ovAssets) delete ovAssets[k];
  const t=E.TEMPLATES[homeTpl]||customTemplates()[homeTpl]; Object.assign(E.G, t?t.set:E.TEMPLATES.base.set);
  project={id:'p'+Date.now(), name:f.name.replace(/\.[^.]+$/,'').slice(0,40), created:Date.now()};
  // hned dát najevo, že se něco děje
  show('busy'); busy('Načítám video…','Chvilku strpení, video se nahrává do appky. U delšího videa to může trvat i pár desítek sekund.',0);
  const t0=Date.now(), tick=setInterval(()=>{ const s=(Date.now()-t0)/1000; busy('Načítám video…','Chvilku strpení, video se nahrává do appky. U delšího videa to může trvat i pár desítek sekund.',Math.min(0.95,1-Math.exp(-s/6))); },200);
  try{ await loadVideo(f); }catch(err){ clearInterval(tick); show('home'); homeMsg(err.message); return; }
  clearInterval(tick); busy('Načítám video…','Hotovo',1);
  $('setupPrev').src=videoURL+'#t=0.5'; $('setupPrev').muted=true; $('setupPrev').setAttribute('playsinline',''); $('setupPrev').preload='metadata';
  $('sPunct').checked=!!E.G.punct; setStep('sLines',E.G.maxLines||3); setStep('sChars',E.G.maxChars||0); setStep('sWpp',E.G.wpp||4); $('sMain').value=String(E.G.mainLine||'mid');
  renderLangs(); $('setupStatus').textContent=''; $('setupStatus').classList.remove('err'); show('setup');
};
$('setupBack').onclick=()=>{ show('home'); };

// ================= AI PŘEPIS =================
function wavFrom(samples,rate){
  const buf=new ArrayBuffer(44+samples.length*2), v=new DataView(buf);
  const w=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  w(0,'RIFF'); v.setUint32(4,36+samples.length*2,true); w(8,'WAVE'); w(12,'fmt ');
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,rate,true); v.setUint32(28,rate*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  w(36,'data'); v.setUint32(40,samples.length*2,true);
  for (let i=0;i<samples.length;i++){ const s=Math.max(-1,Math.min(1,samples[i])); v.setInt16(44+i*2,s<0?s*0x8000:s*0x7fff,true); }
  return new Blob([buf],{type:'audio/wav'});
}
async function extractAudio(file){
  const decoded=await decodeVideoAudio(file);
  const RATE=16000, off=new OfflineAudioContext(1,Math.ceil(decoded.duration*RATE),RATE);
  const src=off.createBufferSource(); src.buffer=decoded; src.connect(off.destination); src.start();
  const out=await off.startRendering(); return {data:out.getChannelData(0),rate:RATE};
}
function readSetup(){
  E.G.punct=$('sPunct').checked; E.G.maxLines=stepVal('sLines'); E.G.maxChars=stepVal('sChars'); E.G.wpp=stepVal('sWpp');
  const ml=$('sMain').value; E.G.mainLine = ml;
  if (E.G.maxLines>3 && ml==='mid') E.G.mainLine='mid';
}
async function afterWords(){
  if ($('sDict').checked){ const n=E.applyCorrections(parseDict(dict)); if (n) toast(`Opraveno ${n}× podle slovníku`); }
  E.buildPages();
  const doFace=$('sFace').checked, doBehind=$('sBehind').checked;
  if (doFace){
    busy('Analyzuji video…','Hledám obličej, ať titulky nezakrývají tvář',0);
    try{ await AI.analyzeFaces(vid,p=>busy('Analyzuji video…','Hledám obličej, ať titulky nezakrývají tvář',p)); E.applyFacePositions(); analysed.face=true; }catch(e){ console.warn(e); toast('Obličej se nepodařilo najít – titulky zůstaly na pozici šablony'); }
  }
  if (doBehind){
    busy('Analyzuji video…','Odstraňuji pozadí, aby text mohl být za postavou',0);
    try{ await AI.analyzePerson(vid,p=>busy('Analyzuji video…','Odstraňuji pozadí, aby text mohl být za postavou',p)); E.G.behind='on'; analysed.person=true; }catch(e){ console.warn(e); toast('Postavu se nepodařilo oddělit'); }
  }
  hist=[snapshot()]; hi=0; curPage=0;
  openEditor();
  vid.currentTime=Math.max(0.01,(E.words[0]?E.words[0].s:0)+0.3);
  saveProject();
}
$('genBtn').onclick=async()=>{
  readSetup(); show('busy');
  try{
    busy('Analyzuji video…','Vytahuju zvuk z videa',0.02);
    const {data,rate}=await extractAudio(videoFile);
    const SEG=45, CH=rate*SEG, n=Math.ceil(data.length/CH), all=[];
    for (let i=0;i<n;i++){
      busy('Analyzuji video…',`AI poslouchá a píše text (${i+1}/${n})`,0.05+0.9*i/n);
      const blob=wavFrom(data.subarray(i*CH,Math.min(data.length,(i+1)*CH)),rate);
      const q=new URLSearchParams({lang,quality:segVal('sQuality')});
      const r=await fetch('/api/transcribe?'+q,{method:'POST',headers:{'Content-Type':'audio/wav'},body:blob});
      const j=await r.json().catch(()=>({error:'Server neodpověděl'}));
      if (!r.ok||j.error) throw new Error(j.error||('Chyba '+r.status));
      const off=i*SEG; j.words.forEach(w=>{ const raw=String(w.word).trim(); if (raw) all.push(E.mkWord(raw,w.start+off,w.end+off)); });
    }
    E.words=all.filter(w=>w.t); if (!E.words.length) throw new Error('Ve videu jsem neslyšel žádnou řeč.');
    await afterWords();
  }catch(err){ console.error(err); show('setup');
    const noServer=/Failed to fetch|NetworkError|Load failed|Chyba 404|Chyba 405|Server neodpověděl|chybí klíč/i.test(err.message);
    const st=$('setupStatus'); st.textContent = noServer ? 'AI přepis tady nejede (appka neběží na serveru s klíčem). Vlož text ručně níž a dej Použít.' : 'Přepis se nepovedl: '+err.message;
    st.classList.add('err'); try{ st.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
};
$('manualBtn').onclick=async()=>{
  const list=$('manualText').value.trim().split(/\s+/).filter(Boolean); if(!list.length) return;
  readSetup(); show('busy'); E.words=E.spread(list,0.2,vid.duration-0.2); await afterWords();
};
// slovník
$('dictOpen').onclick=()=>openSheet('sheetDict');
function openSheet(id){ if (id==='sheetDict') $('dictText').value=dict; $(id).classList.add('on'); }
document.querySelectorAll('.sheet').forEach(s=>{ s.onclick=e=>{ if (e.target===s||e.target.closest('[data-close]')) s.classList.remove('on'); }; });
$('dictSave').onclick=()=>{ dict=$('dictText').value; lsSet('efk_dict',dict); $('sheetDict').classList.remove('on'); toast('Slovník uložený'); };
$('dictApply').onclick=()=>{ dict=$('dictText').value; lsSet('efk_dict',dict); const n=E.applyCorrections(parseDict(dict)); E.buildPages(); changed(); $('sheetDict').classList.remove('on'); toast(n?`Opraveno ${n}×`:'Nic k opravě'); };

// ================= EDITOR =================
function openEditor(){ show('editor'); sizeCanvas(); renderTimeline(); thumbs(); renderPanel(); updateMute(); syncTop(); }
$('closeBtn').onclick=async()=>{ vid.pause(); await saveProject(); renderProjects(); show('home'); };

// --- historie (zpět / znovu) ---
let hist=[], hi=-1, histT=null;
function changed(rebuild){ if (rebuild) E.buildPages(); curPage=clamp(curPage,0,Math.max(0,E.pages.length-1)); renderTimeline(); clearTimeout(histT); histT=setTimeout(pushHist,250); scheduleSave(); }
function pushHist(){ const s=snapshot(); if (hist[hi]===s) return; hist=hist.slice(0,hi+1); hist.push(s); if (hist.length>100) hist.shift(); hi=hist.length-1; syncTop(); }
function undo(){ clearTimeout(histT); pushHist(); if (hi<=0) return; hi--; restore(hist[hi]); renderTimeline(); renderPanel(); syncTop(); scheduleSave(); }
function redo(){ if (hi>=hist.length-1) return; hi++; restore(hist[hi]); renderTimeline(); renderPanel(); syncTop(); scheduleSave(); }
$('undoBtn').onclick=undo; $('redoBtn').onclick=redo;
document.addEventListener('keydown',e=>{ if (!$('editor').classList.contains('on')||/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); }
  else if (e.key===' '){ e.preventDefault(); togglePlay(); } });
function syncTop(){ $('undoBtn').disabled=hi<=0; $('redoBtn').disabled=hi>=hist.length-1; $('eyeBtn').classList.toggle('on',E.flags.hidden); $('eyeBtn').textContent=E.flags.hidden?'🙈':'👁'; }

// --- přehrávání ---
function togglePlay(){ if (vid.paused){ ensureAC(); vid.play(); } else vid.pause(); }
$('playBtn').onclick=togglePlay;
vid.onplay=()=>{ $('playBtn').textContent='❚❚'; $('fsPlay').textContent='❚❚'; lastT=vid.currentTime; };
vid.onpause=()=>{ $('playBtn').textContent='▶'; $('fsPlay').textContent='▶'; };
$('eyeBtn').onclick=()=>{ E.flags.hidden=!E.flags.hidden; syncTop(); };
// velký náhled: přes celou obrazovku aplikace (ne systémový fullscreen – z toho se na iPhonu nedalo dostat zpět)
function setFs(on){ $('stage').classList.toggle('fs',on); document.body.classList.toggle('fsmode',on); $('fsBtn').textContent=on?'🗗':'⛶'; }
$('fsBtn').onclick=()=>setFs(!$('stage').classList.contains('fs'));
$('fsExit').onclick=e=>{ e.stopPropagation(); setFs(false); };
$('fsPlay').onclick=e=>{ e.stopPropagation(); togglePlay(); };
document.addEventListener('keydown',e=>{ if (e.key==='Escape' && $('stage').classList.contains('fs')) setFs(false); });
function updateMute(){ vid.muted=E.flags.mute; $('muteBtn').classList.toggle('on',E.flags.mute); $('muteBtn').textContent=E.flags.mute?'🔇 Zvuk videa vypnutý':'🔊 Zvuk videa'; }
$('muteBtn').onclick=()=>{ E.flags.mute=!E.flags.mute; updateMute(); changed(); };

// --- živé zvuky ---
let AC=null, lastT=0;
function ensureAC(){ if (!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); } if (AC.state==='suspended') AC.resume(); }
function playSfx(type){ ensureAC(); E.sfxInto(AC,AC.destination,AC.currentTime,type,E.G.sfxVol/100); }

// --- smyčka ---
let dragging=null, guides=false, inlineOpen=false;
function loop(){
  const t=vid.currentTime;
  if (videoURL && $('editor').classList.contains('on')){
    if (!vid.paused){
      const k=E.pageAt(t); if (k>=0 && k!==curPage){ curPage=k; markCur(); }
      if (t>lastT && t-lastT<0.5) for (const ev of E.sfxEvents()) if (ev.t>lastT && ev.t<=t) playSfx(ev.type);
      followTimeline(t);
    }
    lastT=t;
    E.render(t,{});
    if (vid.paused && !inlineOpen && !E.flags.hidden && E.lastLines){ const p=E.pages[E.pageAt(t)]; if (p) E.drawBox(E.lastLines,E.styleOf(p),guides); }
    else E.lastBox=null;
    if (selOv && vid.paused) drawOvSel();
    $('tm').textContent=fmt(t)+' / '+fmt(vid.duration);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ================= STYL: rozsah a zápis =================
const cur=()=>E.styleOf(E.pages[curPage]);
function pageMeta(p){ const k=E.keyOf(p); return E.meta[k]=E.meta[k]||{}; }
const REBUILD=new Set(['wpp','maxLines','maxChars','split','rowMax']);
// Base dělí řádky podle šířky slov → po změně písma / velikosti se titulky přepočítají
const REFLOW=new Set(['size','emScale','track','trackEm','cond','wordGap','fontMain','wMain','fontEm','wEm','emItalic','mainItalic','caseMain','caseSec','punct']);
function setVal(key,val,noHist){
  const p=E.pages[curPage];
  if (scope==='all' || E.GLOBAL_ONLY.has(key) || !p){
    E.G[key]=val; for (const k in E.meta){ const o=E.meta[k].own; if (o && key in o) delete o[key]; }
  } else { const m=pageMeta(p); m.own=m.own||{}; m.own[key]=val; if (key==='posX'||key==='posY') m.own._manualPos=true; }
  if (REBUILD.has(key) || (E.G.split==='fill' && REFLOW.has(key) && (scope==='all' || E.GLOBAL_ONLY.has(key)))) E.buildPages();
  if (!noHist) changed(); else { scheduleSave(); }
}
function setMany(obj){ for (const [k,v] of Object.entries(obj)) setVal(k,v,true); changed(); }
function scopeHTML(){ return `<div class="scope" id="scopeSw"><div data-v="all" class="${scope==='all'?'on':''}">Použít na všechny titulky</div><div data-v="one" class="${scope==='one'?'on':''}">Jen tento titulek</div></div>`; }
function bindScope(){ const s=$('scopeSw'); if (!s) return; s.onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; scope=d.dataset.v; renderPanel(); }; }

// ---------- generátory ovládacích prvků ----------
const C=[]; // registrace handlerů
function slider(lb,key,min,max,step=1,unit=''){ const id='c'+C.length; C.push(['range',id,key]); const v=cur()[key]; return `<label class="ctl"><div class="lb"><span>${lb}</span><span id="${id}v">${v}${unit}</span></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}" data-unit="${unit}"></label>`; }
function toggle(lb,key,onv=true,offv=false){ const id='c'+C.length; C.push(['tog',id,key,onv,offv]); return `<div class="row"><span>${lb}</span><input type="checkbox" class="sw" id="${id}" ${cur()[key]===onv?'checked':''}></div>`; }
function chips(lb,key,opts){ const id='c'+C.length; C.push(['chips',id,key]); const v=String(cur()[key]); return `${lb?`<div class="clabel">${lb}</div>`:''}<div class="chips" id="${id}">${opts.map(([val,l])=>`<div class="chip ${String(val)===v?'on':''}" data-v="${val}">${l}</div>`).join('')}</div>`; }
function color(lb,key){ const id='c'+C.length; C.push(['color',id,key]); return `<label><input type="color" id="${id}" value="${cur()[key]}">${lb}</label>`; }
function bindControls(){
  for (const [type,id,key,a,b] of C){
    const el=$(id); if (!el) continue;
    if (type==='range'){ el.oninput=()=>{ $(id+'v').textContent=el.value+el.dataset.unit; setVal(key,+el.value,true); }; el.onchange=()=>changed(); }
    else if (type==='tog') el.onchange=()=>setVal(key,el.checked?a:b);
    else if (type==='color'){ el.oninput=()=>setVal(key,el.value,true); el.onchange=()=>changed(); }
    else if (type==='chips') el.onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; el.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c)); const v=c.dataset.v; setVal(key, v==='true'?true:v==='false'?false:(v!==''&&!isNaN(+v)&&!/^0\d/.test(v)?+v:v)); if (key==='mainLine'||key==='layout') renderPanel(); };
  }
  C.length=0;
}

// ================= PANELY =================
$('bnav').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; panel=b.dataset.p; $('bnav').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); if (panel!=='overlay') selOv=null; renderPanel(); };
function subHTML(name,opts,extra=''){ return `<div class="sub" data-sub="${name}">${opts.map(([v,l])=>`<div data-v="${v}" class="${sub[name]===v?'on':''}">${l}</div>`).join('')}${extra}</div>`; }
function bindSub(){ document.querySelectorAll('#panel .sub[data-sub]').forEach(s=>{ s.onclick=e=>{ const d=e.target.closest('[data-v]'); if (d){ sub[s.dataset.sub]=d.dataset.v; renderPanel(); } }; }); }
function renderPanel(){
  const P=$('panel'); C.length=0;
  let h='';
  if (!E.pages.length && panel!=='overlay'){ P.innerHTML='<div class="muted">Žádné titulky. Vytvoř je přes AI přepis nebo vlož text ručně.</div>'; return; }
  switch(panel){
    case 'captions': h=pCaptions(); break;
    case 'templates': h=pTemplates(); break;
    case 'style': h=pStyle(); break;
    case 'motion': h=pMotion(); break;
    case 'sfx': h=pSfx(); break;
    case 'overlay': h=pOverlay(); break;
    case 'ai': h=pAI(); break;
  }
  P.innerHTML=h; bindControls(); bindScope(); bindSub();
  const fn=binders[panel]; fn&&fn();
}
const binders={};

// ---------- TITULKY ----------
function pCaptions(){
  const pg=E.pages.map((p,k)=>{ const ws=[]; for(let i=p.a;i<=p.b;i++){ const w=E.words[i]; ws.push(`<span class="w ${w.em?'em':''}" data-i="${i}">${esc(w.t)}</span>`); }
    const m=E.meta[E.keyOf(p)]; return `<div class="pg ${k===curPage?'cur':''}" data-k="${k}"><div class="t">${fmt(p.s)}</div><div class="ws">${ws.join('')}</div><button class="ed" data-ed="${k}">✎</button></div>`; }).join('');
  return `<div class="btnrow"><button class="btn" id="editTxt">✎ Upravit text</button><button class="btn" id="batchBtn">☰ Hromadná úprava</button></div>
  <div class="note">Klepni na slovo = zvýraznit ho jako hlavní (libovolné slovo). Tužka u titulku = upravit text.</div>
  ${chips('Hlavní řádek','mainLine',[['mid','Auto (střed)'],['1','1.'],['2','2.'],['3','3.'],['4','4.'],['word','Nejdelší slovo'],['none','Žádný']])}
  ${toggle('Plnit řádky podle šířky (3 / 2 / 2 slova)','split','fill','words')}
  ${E.G.split==='fill'?slider('Šířka řádku (kolik se vejde)','rowMax',35,85,1,'%'):''}
  ${slider('Max řádků na titulek','maxLines',1,4)}
  ${slider('Max znaků na řádek (0 = auto)','maxChars',0,40)}
  ${slider('Slov na titulek (auto)','wpp',1,8)}
  ${toggle('Interpunkce','punct')}
  ${toggle('Velké písmeno v hlavním řádku (slova od 3 písmen)','capMain3')}
  <div class="btnrow"><button class="btn" id="dictBtn">📖 Slovník oprav</button><button class="btn" id="resetOne">↺ Zrušit vlastní styl</button></div>
  <div class="btnrow"><button class="btn" id="layerBtn">${E.pages[curPage]&&E.pages[curPage].layer?'⇧ Vybraný titulek do hlavní vrstvy':'⇩ Vybraný titulek do vrstvy pod'}</button></div>
  <div class="note">Na timeline můžeš titulek i chytit a stáhnout dolů do 2. vrstvy (nebo zpátky nahoru).</div>
  <div class="pglist" id="pglist">${pg}</div>`;
}
binders.captions=()=>{
  $('editTxt').onclick=()=>openInline(curPage);
  $('batchBtn').onclick=openBatch;
  $('dictBtn').onclick=()=>openSheet('sheetDict');
  $('resetOne').onclick=()=>{ const p=E.pages[curPage]; if (p){ const m=pageMeta(p); delete m.own; changed(); renderPanel(); toast('Titulek má zase společný styl'); } };
  $('layerBtn').onclick=()=>{ const p=E.pages[curPage]; if (p) setLayer(curPage, p.layer?0:1); };
  $('pglist').onclick=e=>{
    const ed=e.target.closest('[data-ed]'); if (ed){ selectPage(+ed.dataset.ed); openInline(+ed.dataset.ed); return; }
    const w=e.target.closest('.w'); if (w){ const W=E.words[+w.dataset.i]; W.em=!W.em; w.classList.toggle('em',W.em); changed(); }
    const pg=e.target.closest('.pg'); if (pg) selectPage(+pg.dataset.k);
  };
};
function selectPage(k,seek=true){ curPage=k; const p=E.pages[k]; if (p && seek){ vid.pause(); vid.currentTime=Math.min(p.e-0.02,p.s+0.45); } markCur(); if (panel!=='captions' && panel!=='templates') renderPanel(); }
function markCur(){
  document.querySelectorAll('#pglist .pg').forEach(el=>el.classList.toggle('cur',+el.dataset.k===curPage));
  document.querySelectorAll('#trC .cb').forEach(el=>el.classList.toggle('cur',+el.dataset.k===curPage));
  const c=document.querySelector('#pglist .pg.cur'); if (c && panel==='captions') c.scrollIntoView({block:'nearest'});
}
// --- úprava textu titulku ---
function pageText(p){ const a=[]; for(let i=p.a;i<=p.b;i++) a.push(E.G.punct?E.words[i].raw:E.words[i].t); return a.join(' '); }
function setPageText(k,text){
  const p=E.pages[k]; if (!p) return;
  const list=text.trim().split(/\s+/).filter(Boolean);
  const old=E.words.slice(p.a,p.b+1);
  if (!list.length){ E.words.splice(p.a,p.b-p.a+1); return; }
  let neu;
  if (list.length===old.length) neu=old.map((w,i)=>({...w,raw:list[i],t:E.stripPunct(list[i])||list[i]}));
  else { neu=E.spread(list,old[0].s,old[old.length-1].e); }
  E.words.splice(p.a,p.b-p.a+1,...neu);
}
let inlineK=-1;
function openInline(k){
  const p=E.pages[k]; if(!p) return; vid.pause(); inlineK=k; inlineOpen=true;
  vid.currentTime=Math.min(p.e-0.02,p.s+0.45);
  const ta=$('inlineEdit'); ta.value=pageText(p); ta.classList.remove('hidden'); $('inlineBar').classList.remove('hidden'); ta.focus(); ta.select();
}
function closeInline(save){
  if (save && inlineK>=0){ setPageText(inlineK,$('inlineEdit').value); changed(true); renderPanel(); }
  $('inlineEdit').classList.add('hidden'); $('inlineBar').classList.add('hidden'); inlineOpen=false; inlineK=-1;
}
$('inlineOk').onclick=()=>closeInline(true); $('inlineCancel').onclick=()=>closeInline(false);
$('inlineEdit').onkeydown=e=>{ if (e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); closeInline(true); } if (e.key==='Escape') closeInline(false); };
// --- hromadná úprava ---
function openBatch(){ $('batchText').value=E.pages.map(pageText).join('\n'); openSheet('sheetBatch'); }
$('replBtn').onclick=()=>{ const f=$('findIn').value; if(!f) return; const ta=$('batchText'); const n=ta.value.split(f).length-1; ta.value=ta.value.split(f).join($('replIn').value); toast(`Nahrazeno ${n}×`); };
$('batchOk').onclick=()=>{
  const lines=$('batchText').value.split('\n');
  // od konce, aby indexy slov seděly
  for (let k=E.pages.length-1;k>=0;k--){ if (lines[k]===undefined) continue; if (lines[k].trim()!==pageText(E.pages[k])) setPageText(k,lines[k]); }
  changed(true); $('sheetBatch').classList.remove('on'); renderPanel(); toast('Titulky upravené');
};

// ---------- ŠABLONY ----------
function customTemplates(){ return lsGet('efk_custom',{}); }
function pTemplates(){
  const cat=sub.templates; let list;
  if (cat==='custom') list=Object.entries(customTemplates());
  else list=Object.entries(E.TEMPLATES).filter(([k,t])=>cat==='all'||t.cat==='trending');
  const S=cur();
  return `${scopeHTML()}${subHTML('templates',[['trending','Styly'],['custom','♥ Vlastní']])}
  <div class="tplgrid" id="tplgrid">${list.map(([k,t])=>tplCard(k,t,S.style===k?' on':'').replace('</div>',(cat==='custom'?`<span class="x" data-del="${k}">✕</span>`:'')+'</div>')).join('')||'<div class="muted">Zatím nemáš vlastní šablony. V záložce Styl ulož srdíčkem ♥.</div>'}</div>
  <div class="clabel">Rychlé efekty</div>
  <div class="chips" id="quickFx">
    <div class="chip ${S.fxFlicker?'on':''}" data-k="fxFlicker">Flicker</div>
    <div class="chip ${S.anim==='squish'?'on':''}" data-k="squish">Squish</div>
    <div class="chip ${S.fxShine?'on':''}" data-k="fxShine">Shine</div>
    <div class="chip ${S.fxShake?'on':''}" data-k="fxShake">Shake</div>
    <div class="chip ${S.fxWiggle?'on':''}" data-k="fxWiggle">Wiggle</div>
  </div>`;
}
binders.templates=()=>{
  $('tplgrid').onclick=e=>{
    const d=e.target.closest('[data-del]'); if (d){ e.stopPropagation(); const c=customTemplates(); delete c[d.dataset.del]; lsSet('efk_custom',c); renderPanel(); return; }
    const c=e.target.closest('.tpl'); if(!c) return; const t=E.TEMPLATES[c.dataset.k]||customTemplates()[c.dataset.k]; if(!t) return;
    const set={...t.set}; delete set.posY; delete set.posX; // pozici (pod obličej) šablona nepřepisuje
    setMany({...set, style:c.dataset.k}); renderPanel(); toast('Šablona „'+t.name+'“ '+(scope==='all'?'na všechny titulky':'na tento titulek'));
  };
  $('quickFx').onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; const k=c.dataset.k, S=cur();
    if (k==='squish') setVal('anim',S.anim==='squish'?'block':'squish'); else setVal(k,!S[k]); renderPanel(); };
};

// ---------- STYL ----------
const SHADOWS=[['none',null],['#000000','#000'],['#2f7bff','#2f7bff'],['#ffc531','#ffc531'],['#4df0ff','#4df0ff'],['#21d07a','#21d07a'],['#ff3ad7','#ff3ad7']];
function pStyle(){
  const S=cur(), st=sub.style;
  let h=`${scopeHTML()}${subHTML('style',[['color','Barva'],['font','Font'],['text','Text'],['shadow','Stín'],['transform','3D a tvar']],'<div class="sp"></div><div class="hrt" id="saveTpl" title="Uložit jako vlastní šablonu">♥</div>')}`;
  if (st==='color'){
    h+=`<div class="colors">${color('Text','cText')}${color('Zvýraznění 1','c1')}${color('2.','c2')}${color('3.','c3')}${color('4.','c4')}</div>
    <div class="note">Zvýraznění 1–4 se střídá po titulcích (1. titulek = 1. barva…), když je přechod vypnutý.</div>
    ${toggle('Vedlejší řádky s jemným přelivem do šeda','textGrad')}
    ${S.textGrad?`<div class="colors">${color('Vedlejší nahoře','cText')}${color('Vedlejší dole','cText2')}</div>`:''}
    ${toggle('Dvoubarevný přechod na hlavním řádku','grad')}
    ${S.grad?`<div class="colors">${color('Barva A','gA')}${color('Barva B','gB')}</div>${chips('Směr přechodu','gradDir',[['v','↕ Svisle'],['h','↔ Vodorovně'],['d','↘ Šikmo']])}`:''}
    ${toggle('Každý N-tý titulek jinou barvou','altOn')}
    ${S.altOn?`<div class="colors">${color('Barva A','altA')}${color('Barva B','altB')}</div>${slider('Každý … titulek','altEvery',2,6)}`:''}
    ${toggle('Negativ (inverzní písmo)','negativ')}
    ${slider('Záře okolo hlavního slova','glow',0,100)}
    ${chips('Záře svítí','glowMode',[['always','Pořád'],['entrance','Jen při nástupu (problikne)']])}
    <div class="clabel">Barva z videa</div><button class="btn small" id="suggestCol">✧ Navrhnout barvu podle videa</button><div class="sugg" id="suggBox"></div>`;
  } else if (st==='font'){
    const fam=fontTarget==='em'?S.fontEm:S.fontMain, w=fontTarget==='em'?S.wEm:S.wMain, it=fontTarget==='em'?S.emItalic:S.mainItalic;
    h+=`<div class="seg" id="fontT"><div data-v="em" class="${fontTarget==='em'?'on':''}">Hlavní řádek</div><div data-v="main" class="${fontTarget==='main'?'on':''}">Vedlejší řádky</div></div>
    <div class="fontlist" id="fontlist">${E.FONTS.map(([f,wt,l,i],n)=>`<div class="chip ${f===fam&&wt===w&&!!i===!!it?'on':''}" data-n="${n}" style="font-family:${esc(f)};font-weight:${wt};${i?'font-style:italic':''}">${esc(l)}</div>`).join('')}</div>`;
  } else if (st==='text'){
    const em=textTarget==='em';
    h+=`<div class="seg" id="textT"><div data-v="em" class="${em?'on':''}">Hlavní řádek</div><div data-v="main" class="${!em?'on':''}">Vedlejší řádky</div></div>
    ${em?chips('Velikost písmen','caseMain',[['none','Žádná'],['title','Každé Slovo Velké'],['upper','VELKÁ'],['lower','malá']]):chips('Velikost písmen','caseSec',[['none','Žádná'],['lowerStart','Začátek věty malým'],['upper','VELKÁ'],['lower','malá'],['title','Každé Slovo Velké']])}
    ${em?slider('Velikost hlavního řádku (%)','emScale',60,260,1,'%'):slider('Velikost písma','size',30,200)}
    ${toggle('Kurzíva',em?'emItalic':'mainItalic')}
    ${slider('Tloušťka písma',em?'wEm':'wMain',100,900,100)}
    ${slider('Mezera mezi slovy (%)','wordGap',40,260,5,'%')}`;
  } else if (st==='shadow'){
    const cs=S.shadowSize===0?'none':S.cShadow;
    h+=`<div class="clabel">Barva stínu</div><div class="swatches" id="shSw">${SHADOWS.map(([v,c])=>`<div class="swatch ${v==='none'?'none':''} ${cs===v?'on':''}" data-v="${v}" style="${c?'background:'+c:''}"></div>`).join('')}<div class="swatch rainbow ${!SHADOWS.some(s=>s[0]===cs)?'on':''}"><input type="color" id="shCustom" value="${S.cShadow}"></div></div>
    <div class="chips" id="shSize"><div class="chip ${S.shadowSize<=18&&S.shadowSize>0?'on':''}" data-v="15">Malý</div><div class="chip ${S.shadowSize>18&&S.shadowSize<=35?'on':''}" data-v="25">Střední</div><div class="chip ${S.shadowSize>35?'on':''}" data-v="50">Velký</div></div>
    ${slider('Velikost (rozmazání)','shadowSize',0,100)}
    ${slider('Průhlednost','shadowA',0,100,1,'%')}
    ${slider('Vzdálenost stínu','shadowDist',0,40)}
    ${slider('3D hloubka písma (extrude)','extrude',0,100)}`;
  } else if (st==='transform'){
    h+=`${slider('Mezery mezi písmeny','track',-20,12,0.5)}
    ${S.trackEm!=null?slider('Mezery mezi písmeny – hlavní řádek','trackEm',-24,12,0.5):''}
    ${slider('Zúžení písma','cond',60,100,1,'%')}
    ${slider('Řádkování','gap',30,140,1,'%')}
    ${slider('Kinetické rozložení (horní a spodní řádek do stran)','kinetic',0,100)}
    ${chips('Spodní řádek jede','kinDir',[['opposite','Doprava'],['same','Doleva']])}
    ${chips('Rozložení','layout',[['diagonal','Šikmo'],['cascade','Kaskáda'],['center','Na střed'],['left','Vlevo'],['right','Vpravo']])}
    ${slider('3D náklon do strany','tilt',-45,45,1,'°')}
    ${toggle('Střídat náklon vlevo / vpravo','tiltAlt')}
    ${slider('3D náklon dopředu / dozadu','tiltX',-35,35,1,'°')}
    ${slider('Síla perspektivy','persp',0,100)}
    ${slider('Rotace','rot',-30,30,1,'°')}
    ${chips('Pořadí vrstev','layerOrder',[['natural','Spodní řádek vpředu (doporučeno)'],['mainfront','Hlavní vpředu'],['bottomfirst','Horní vpředu']])}
    <div class="note">Spodní řádek vpředu = háčky a čárky spodního řádku nikdy nezakryje řádek nad ním.</div>
    ${slider('Velikost','size',30,200)}
    ${slider('Pozice vodorovně','posX',5,95,1,'%')}
    ${slider('Pozice svisle','posY',5,95,1,'%')}`;
  }
  return h;
}
binders.style=()=>{
  $('saveTpl').onclick=()=>{
    const name=prompt('Název vlastní šablony:','Moje šablona '+(Object.keys(customTemplates()).length+1)); if(!name) return;
    const S=cur(), set={}; for (const k of Object.keys(E.G)) if (!E.GLOBAL_ONLY.has(k) && !['posX','posY','style','behind'].includes(k)) set[k]=S[k];
    const c=customTemplates(); const key='c'+Date.now(); c[key]={name,cat:'custom',set,pv:`<span style="font-family:${esc(S.fontMain)};font-weight:${S.wMain}">Tvůj</span><br><b style="font-family:${esc(S.fontEm)};font-weight:${S.wEm};${S.grad?`background:linear-gradient(${S.gA},${S.gB});-webkit-background-clip:text;color:transparent`:`color:${S.c1}`}">Styl</b>`};
    lsSet('efk_custom',c); renderHomeTpl(); toast('♥ Uloženo do Vlastních šablon');
  };
  const ft=$('fontT'); if (ft) ft.onclick=e=>{ const d=e.target.closest('[data-v]'); if(d){ fontTarget=d.dataset.v; renderPanel(); } };
  const tt=$('textT'); if (tt) tt.onclick=e=>{ const d=e.target.closest('[data-v]'); if(d){ textTarget=d.dataset.v; renderPanel(); } };
  const fl=$('fontlist'); if (fl) fl.onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; const [f,w,,i]=E.FONTS[+c.dataset.n];
    if (fontTarget==='em') setMany({fontEm:f,wEm:w,emItalic:!!i}); else setMany({fontMain:f,wMain:w,mainItalic:!!i});
    fl.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c)); document.fonts&&document.fonts.load(`${i?'italic ':''}${w} 40px ${f}`); };
  const sw=$('shSw'); if (sw) sw.onclick=e=>{ const d=e.target.closest('.swatch[data-v]'); if(!d) return; if (d.dataset.v==='none') setVal('shadowSize',0); else setMany({cShadow:d.dataset.v, shadowSize:cur().shadowSize||25}); renderPanel(); };
  const sc=$('shCustom'); if (sc){ sc.oninput=()=>setVal('cShadow',sc.value,true); sc.onchange=()=>{ if(!cur().shadowSize) setVal('shadowSize',25); changed(); renderPanel(); }; }
  const ss=$('shSize'); if (ss) ss.onclick=e=>{ const d=e.target.closest('.chip'); if(!d) return; setVal('shadowSize',+d.dataset.v); renderPanel(); };
  const sg=$('suggestCol'); if (sg) sg.onclick=suggestColors;
};
async function suggestColors(){
  const box=$('suggBox'); box.innerHTML='<div class="muted">Analyzuju barvy ve videu…</div>';
  const v=document.createElement('video'); v.src=videoURL; v.muted=true; await new Promise(r=>{ v.onloadeddata=r; });
  const r=await AI.suggestColors(v);
  box.innerHTML=r.list.map((c,i)=>`<div data-i="${i}"><span style="background:linear-gradient(${c.gA},${c.gB});-webkit-background-clip:text;background-clip:text;color:transparent">${esc(c.name)}</span></div>`).join('');
  box.onclick=e=>{ const d=e.target.closest('[data-i]'); if(!d) return; const c=r.list[+d.dataset.i]; setMany({grad:true,gA:c.gA,gB:c.gB}); renderPanel(); toast('Barva použitá'); };
}

// ---------- POHYB A EFEKTY ----------
function pMotion(){
  const S=cur();
  return `${scopeHTML()}
  ${chips('Animace nástupu','anim',[['base','Prolnutí slov'],['block','Plynulý blok'],['squish','Squish'],['pop','Pop'],['blur','Rozostření'],['smooth','Jemně'],['fade','Prolnutí'],['none','Žádná']])}
  ${chips('Slova přilétají z','enter',[['none','Bez letu'],['bottom','↑ Zdola'],['top','↓ Shora'],['left','→ Zleva'],['right','← Zprava']])}
  ${S.enter!=='none'?chips('Dojezd','ease',[['smooth','Plynule'],['swing','Houpnutí'],['shake','Zatřesení'],['bounce','Odraz'],['elastic','Pružina']])+slider('Délka příletu','enterDur',10,120,1,''):''}
  ${toggle('Slovo po slově (podle řeči)','wordByWord')}
  ${toggle('Plynulý odchod','fadeOut')}
  ${S.fadeOut?`<div class="clabel">Odchod</div><div class="chips" id="exitSt"><div class="chip ${S.exitScale!=null?'on':''}" data-v="fast">Rychlé zmenšení</div><div class="chip ${S.exitScale==null?'on':''}" data-v="soft">Jemné zhasnutí</div></div>`:''}
  <div class="clabel">Efekty</div>
  ${toggle('Shine – lesk přejede přes hlavní slovo','fxShine')}
  ${S.fxShine?chips('Lesk u','shineEvery',[['1','Každého'],['2','Každého 2.'],['3','Každého 3.'],['4','Každého 4.'],['rand','Náhodně']])+slider('Rychlost lesku','shineSpeed',0,100):''}
  ${toggle('Flicker – problikne při nástupu','fxFlicker')}
  ${toggle('Shake – zatřese při nástupu','fxShake')}
  ${toggle('Wiggle – jemné vlnění','fxWiggle')}
  ${S.fxWiggle||S.fxShake?slider('Síla wiggle / shake','wiggle',0,100):''}`;
}

// ---------- SFX ----------
const SFX=[['none','Žádný'],['light','Lehké kliknutí'],['heavy','Těžké kliknutí'],['mouse','Klik myši'],['tick','Tick'],['type','Psaní na klávesnici'],['pop','Pop'],['whoosh','Whoosh'],['swoosh','Swoosh'],['shutter','Spoušť foťáku'],['glitch','Glitch'],['ding','Ding']];
function pSfx(){
  const S=cur();
  return `${scopeHTML()}${slider('Hlasitost','sfxVol',0,100,1,'%')}
  ${toggle('Zvuk na každé slovo (jinak na každý titulek)','sfxWord')}
  <div class="clabel">Zvuk</div><div class="sfxlist chips" id="sfxList">${SFX.map(([v,l])=>`<div class="chip ${S.sfx===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>
  <div class="note">Klepnutí zvuk přehraje a nastaví. „Jen tento titulek“ = každý titulek může mít jiný zvuk.</div>`;
}
binders.motion=(function(prev){ return ()=>{ prev&&prev(); const x=$('exitSt'); if (x) x.onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; if (c.dataset.v==='fast') setMany({exitScale:0.6,exitDur:0.1}); else setMany({exitScale:null,exitDur:0.3}); renderPanel(); }; }; })(binders.motion);
binders.sfx=()=>{ $('sfxList').onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; playSfx(c.dataset.v); setVal('sfx',c.dataset.v); $('sfxList').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c)); }; };

// ---------- OVERLAY ----------
const STICKERS=['💸','💰','⚡','🔥','✅','❌','⭐','👉','👇','➡️','🚀','💯','❤️','😂','🤯','👀','📈','🎯'];
const OVANIM=[['standard','Standard'],['3d','3D'],['carousel3d','3D Carousel'],['circle','Circle Carousel'],['cards','Cards'],['pop','Pop In'],['slideR','Slide →'],['slideL','Slide ←'],['slideU','Slide ↑'],['slideD','Slide ↓']];
function pOverlay(){
  const o=E.overlays.find(x=>x.id===selOv);
  let h=`<div class="btnrow"><button class="btn" id="ovImg">🖼 Přidat obrázek / video</button></div>
  <div class="clabel">Nálepky</div><div class="stickers" id="stk">${STICKERS.map(s=>`<div>${s}</div>`).join('')}</div>
  <div class="row"><span>Wiggle na všechny overlaye</span><input type="checkbox" class="sw" id="ovWigAll" ${E.overlays.length&&E.overlays.every(x=>x.wiggle)?'checked':''}></div>`;
  if (o){
    h+=`<div class="clabel">Vybraný overlay – animace</div><div class="chips" id="ovAnim">${OVANIM.map(([v,l])=>`<div class="chip ${o.anim===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>
    <div class="row"><span>Wiggle</span><input type="checkbox" class="sw" id="ovWig" ${o.wiggle?'checked':''}></div>
    <div class="row"><span>Před titulky (jinak za nimi)</span><input type="checkbox" class="sw" id="ovAbove" ${o.above?'checked':''}></div>
    <label class="ctl"><div class="lb"><span>Velikost</span><span>${o.w}%</span></div><input type="range" id="ovW" min="5" max="100" value="${o.w}"></label>
    <label class="ctl"><div class="lb"><span>Rotace</span><span>${o.rot||0}°</span></div><input type="range" id="ovR" min="-180" max="180" value="${o.rot||0}"></label>
    <div class="btnrow"><button class="btn" id="ovDel">🗑 Smazat overlay</button></div>
    <div class="note">Na videu ho chytni a posuň. Na časové ose posuneš začátek a konec.</div>`;
  } else h+=`<div class="note">Vyber overlay klepnutím na fialový blok v časové ose nebo na videu.</div>`;
  return h;
}
binders.overlay=()=>{
  $('ovImg').onclick=()=>$('ovIn').click();
  $('stk').onclick=e=>{ const d=e.target.closest('div'); if(!d||d.id==='stk') return; addOverlay({emoji:d.textContent}); };
  $('ovWigAll').onchange=e=>{ E.overlays.forEach(o=>o.wiggle=e.target.checked); changed(); renderPanel(); };
  const o=E.overlays.find(x=>x.id===selOv); if (!o) return;
  $('ovAnim').onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; o.anim=c.dataset.v; changed(); renderPanel(); vid.currentTime=o.s; };
  $('ovWig').onchange=e=>{ o.wiggle=e.target.checked; changed(); };
  $('ovAbove').onchange=e=>{ o.above=e.target.checked; changed(); };
  $('ovW').oninput=e=>{ o.w=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=o.w+'%'; }; $('ovW').onchange=()=>changed();
  $('ovR').oninput=e=>{ o.rot=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=o.rot+'°'; }; $('ovR').onchange=()=>changed();
  $('ovDel').onclick=()=>{ E.overlays=E.overlays.filter(x=>x!==o); selOv=null; changed(); renderPanel(); };
};
async function loadAsset(id,blob){
  const url=URL.createObjectURL(blob); let el;
  if (blob.type.startsWith('video')){ el=document.createElement('video'); el.src=url; el.muted=true; el.loop=true; el.playsInline=true; await new Promise(r=>{ el.onloadeddata=r; el.onerror=r; }); el.play().catch(()=>{}); }
  else { el=new Image(); el.src=url; await new Promise(r=>{ el.onload=r; el.onerror=r; }); }
  ovAssets[id]={blob,el,type:blob.type}; return el;
}
$('ovIn').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const id='a'+Date.now(); const el=await loadAsset(id,f); addOverlay({asset:id,src:el}); };
function addOverlay(o){
  const t=vid.currentTime; const ov={id:Date.now()%1e9, s:t, e:Math.min(vid.duration,t+2), x:50, y:35, w:o.emoji?22:40, rot:0, anim:'pop', wiggle:false, above:true, ...o};
  E.overlays.push(ov); selOv=ov.id; changed(); renderPanel(); toast('Overlay přidaný – posuň ho prstem');
}
function drawOvSel(){
  const o=E.overlays.find(x=>x.id===selOv); if (!o) return; const t=vid.currentTime; if (t<o.s||t>o.e) return;
  const b=E.overlayBox(o), c=cv.getContext('2d'); c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle='#a78bfa'; c.lineWidth=Math.max(2,cv.width*0.003); c.setLineDash([8,6]);
  c.strokeRect(b.cx-b.w/2,b.cy-b.h/2,b.w,b.h); c.restore();
}

// ---------- AI ----------
function pAI(){
  const S=cur();
  return `${scopeHTML()}
  <div class="clabel">📍 Pozice pod obličej</div>
  <div class="note">Najde obličej v každém titulku a dá titulek těsně pod bradu – nikdy přes tvář.</div>
  <div class="row"><span>Uhnout do strany, když je obličej mimo střed</span><input type="checkbox" class="sw" id="faceDodge" ${E.G.faceDodgeX?'checked':''}></div>
  <button class="btn" id="aiFace">${analysed.face?'↻ Znovu umístit pod obličej':'Umístit titulky pod obličej'}</button>
  <div class="clabel">🧍 Text za postavou</div>
  <div class="note">Titulek bude za člověkem (postava zakryje písmo), jako v SA Captions.</div>
  ${toggle('Text za postavou','behind','on','off')}
  <div class="clabel">🎨 Barva z videa</div>
  <button class="btn" id="aiColor">Navrhnout barvy podle videa</button><div class="sugg" id="suggBox" style="margin-top:8px"></div>
  <div class="clabel">📐 Náklon podle scény</div>
  <div class="note">Najde linie v záběru (regál, stůl, okno) a nakloní titulek ve 3D stejně jako prostor.</div>
  <button class="btn" id="aiTilt">${scope==='all'?'Sladit náklon všech titulků se scénou':'Sladit náklon tohoto titulku'}</button>
  <div class="clabel">⛔ Úseky bez titulků</div>
  <div class="note">Kde je grafika nebo logo na konci, titulky se nezobrazí a slova se tam vynechají.</div>
  <div class="btnrow"><button class="btn" id="zHere">＋ 2 s od přehrávací hlavy</button><button class="btn" id="zEnd">＋ Odsud do konce (logo)</button></div>
  <div class="clabel">📏 Ochrana proti uříznutí</div>
  <div class="note">Je zapnutá vždy: dlouhý titulek se sám zmenší, aby byl celý vidět i při 3D náklonu.</div>`;
}
binders.ai=()=>{
  $('faceDodge').onchange=e=>{ E.G.faceDodgeX=e.target.checked; if (analysed.face){ E.applyFacePositions(); } changed(); };
  $('aiFace').onclick=async()=>{
    const b=$('aiFace'); b.disabled=true; const v=document.createElement('video'); v.src=videoURL; v.muted=true; await new Promise(r=>{ v.onloadeddata=r; });
    try{ await AI.analyzeFaces(v,p=>{ b.textContent='Hledám obličej… '+Math.round(p*100)+' %'; }); for (const k in E.meta) if (E.meta[k].own) delete E.meta[k].own._manualPos; const n=E.applyFacePositions(); analysed.face=true; changed(); toast(`Hotovo – ${n} titulků pod obličejem`); }
    catch(e){ toast('Nepovedlo se: '+e.message); }
    renderPanel();
  };
  // při zapnutí „text za postavou“ nejdřív oddělit postavu
  document.querySelectorAll('#panel .sw').forEach(el=>{ if (el.id!=='faceDodge') el.onchange=async()=>{
    if (el.checked && !AI.masks.length){ el.disabled=true; toast('Odstraňuji pozadí…'); const v=document.createElement('video'); v.src=videoURL; v.muted=true; await new Promise(r=>{ v.onloadeddata=r; });
      try{ await AI.analyzePerson(v,p=>{ toast('Odstraňuji pozadí… '+Math.round(p*100)+' %'); }); analysed.person=true; }catch(e){ toast('Nepovedlo se: '+e.message); el.checked=false; el.disabled=false; return; } el.disabled=false; }
    else AI.useMasks();
    setVal('behind',el.checked?'on':'off'); }; });
  $('aiColor').onclick=suggestColors;
  $('aiTilt').onclick=async()=>{
    const b=$('aiTilt'); b.disabled=true; const v=document.createElement('video'); v.src=videoURL; v.muted=true; await new Promise(r=>{ v.onloadeddata=r; });
    const list = scope==='all' ? E.pages.map((p,k)=>k) : [curPage];
    for (const k of list){ const p=E.pages[k], S=E.styleOf(p); b.textContent=`Měřím linie… ${k+1}/${E.pages.length}`;
      const r=await AI.suggestTilt(v,(p.s+p.e)/2,S.posY); const m=pageMeta(p); m.own=m.own||{}; m.own.tilt=r.tilt*r.sign*(S.tilt<0?-1:1)||S.tilt; m.own.tiltAlt=false; m.own.rot=r.rot; }
    changed(); renderPanel(); toast('Náklon sladěný se scénou');
  };
  $('zHere').onclick=()=>addZone(vid.currentTime,Math.min(vid.duration,vid.currentTime+2));
  $('zEnd').onclick=()=>addZone(vid.currentTime,vid.duration);
};
function addZone(s,e){ E.zones.push({s,e,label:'Bez titulků'}); changed(true); toast('Úsek bez titulků přidaný'); }
$('zoneAdd').onclick=()=>addZone(vid.currentTime,Math.min(vid.duration,vid.currentTime+2));

// ================= ČASOVÁ OSA =================
let pps=70, tlSync=false;
const tlPad=()=>$('tlScroll').clientWidth/2;
function renderTimeline(){
  if (!vid.duration) return;
  const pad=tlPad(), W=vid.duration*pps;
  $('tlIn').style.width=(W+pad*2)+'px';
  const X=t=>pad+t*pps;
  const cbHtml=L=>E.pages.map((p,k)=>{ if ((p.layer|0)!==L) return ''; const m=E.meta[E.keyOf(p)]; const txt=[]; for(let i=p.a;i<=p.b;i++) txt.push(E.words[i].t);
    return `<div class="cb ${k===curPage?'cur':''} ${m&&m.own&&Object.keys(m.own).some(x=>x!=='posY'&&x!=='posX'&&x!=='_manualPos')?'own':''}" data-k="${k}" style="left:${X(p.s)}px;width:${Math.max(6,(p.e-p.s)*pps-2)}px"><span class="hl"></span>${esc(txt.join(' '))}<span class="hr"></span></div>`; }).join('');
  $('trC').innerHTML=cbHtml(0); $('trC2').innerHTML=cbHtml(1);
  $('trZ').innerHTML=E.zones.map((z,i)=>`<div class="zb" data-z="${i}" style="left:${X(z.s)}px;width:${Math.max(6,(z.e-z.s)*pps)}px"><span class="hl"></span>⛔ ${esc(z.label||'Bez titulků')}<span class="zx" data-zx="${i}">✕</span><span class="hr"></span></div>`).join('');
  $('trO').innerHTML=E.overlays.map(o=>`<div class="ob ${o.id===selOv?'cur':''}" data-o="${o.id}" style="left:${X(o.s)}px;width:${Math.max(6,(o.e-o.s)*pps)}px"><span class="hl"></span>${o.emoji?o.emoji:'🖼'} ${OVANIM.find(a=>a[0]===o.anim)?.[1]||''}<span class="hr"></span></div>`).join('');
  $('trV').style.paddingLeft=pad+'px';
  if (panel==='captions'){ /* seznam se obnoví při renderPanel */ }
  followTimeline(vid.currentTime,true);
}
let thumbsFor=null;
async function thumbs(){
  if (thumbsFor===videoURL) return; thumbsFor=videoURL; const tr=$('trV'); tr.innerHTML='';
  const v=document.createElement('video'); v.src=videoURL; v.muted=true; await new Promise(r=>{ v.onloadeddata=r; v.onerror=r; });
  const n=Math.max(1,Math.ceil(v.duration)), w=Math.round(30*v.videoWidth/v.videoHeight);
  for (let i=0;i<n;i++){ if (thumbsFor!==videoURL) return; await AI.seek(v,i+0.01); const c=AI.grab(v,90); const img=new Image(); img.src=c.toDataURL('image/jpeg',0.6); img.style.width=(pps)+'px'; tr.appendChild(img); }
}
function followTimeline(t,force){ const sc=$('tlScroll'); const x=t*pps; if (force||Math.abs(sc.scrollLeft-x)>1){ tlSync=true; sc.scrollLeft=x; requestAnimationFrame(()=>{ tlSync=false; }); } }
$('tlScroll').addEventListener('scroll',()=>{ if (tlSync||tlDrag) return; if (!vid.paused) return; vid.currentTime=clamp($('tlScroll').scrollLeft/pps,0,vid.duration-0.01); const k=E.pageAt(vid.currentTime); if (k>=0&&k!==curPage){ curPage=k; markCur(); } });
$('tlZoom').oninput=e=>{ pps=+e.target.value; $('trV').querySelectorAll('img').forEach(i=>i.style.width=pps+'px'); renderTimeline(); };
// tažení bloků (posun, zkrácení, prodloužení)
let tlDrag=null;
$('tlIn').addEventListener('pointerdown',e=>{
  const zx=e.target.closest('[data-zx]'); if (zx){ E.zones.splice(+zx.dataset.zx,1); changed(true); return; }
  const blk=e.target.closest('.cb,.zb,.ob'); if (!blk) return;
  e.preventDefault(); blk.setPointerCapture(e.pointerId); vid.pause();
  const mode=e.target.classList.contains('hl')?'l':e.target.classList.contains('hr')?'r':'m';
  tlDrag={blk,mode,x0:e.clientX,y0:e.clientY,moved:false,left0:parseFloat(blk.style.left),w0:parseFloat(blk.style.width),layer0:blk.parentElement&&blk.parentElement.id==='trC2'?1:0,layer:null};
});
$('tlIn').addEventListener('pointermove',e=>{
  if (!tlDrag) return; const d=e.clientX-tlDrag.x0, dy=e.clientY-tlDrag.y0; if (Math.abs(d)>4||Math.abs(dy)>8) tlDrag.moved=true; if (!tlDrag.moved) return;
  const b=tlDrag.blk;
  if (tlDrag.mode==='m' && b.classList.contains('cb')){
    // tažení nahoru/dolů = přesun mezi vrstvami (hlavní ↔ pod)
    const want = tlDrag.layer0===0 ? (dy>18?1:0) : (dy<-18?0:1);
    tlDrag.layer = want!==tlDrag.layer0 ? want : null;
    b.style.transform = tlDrag.layer!=null ? `translateY(${tlDrag.layer?28:-28}px)` : '';
    b.classList.toggle('lyr', tlDrag.layer!=null);
  }
  if (tlDrag.mode==='m') b.style.left=(tlDrag.left0+d)+'px';
  else if (tlDrag.mode==='l'){ b.style.left=(tlDrag.left0+d)+'px'; b.style.width=Math.max(6,tlDrag.w0-d)+'px'; }
  else b.style.width=Math.max(6,tlDrag.w0+d)+'px';
});
$('tlIn').addEventListener('pointerup',e=>{
  if (!tlDrag) return; const {blk,mode,moved}=tlDrag, newLayer=tlDrag.layer; const dt=(e.clientX-tlDrag.x0)/pps; tlDrag=null;
  if (blk.dataset.k!==undefined){
    const k=+blk.dataset.k;
    if (!moved){ selectPage(k); return; }
    const p=E.pages[k], m=pageMeta(p);
    if (newLayer!=null){ E.words[p.a].br=true; if (p.b+1<E.words.length) E.words[p.b+1].br=true; if (newLayer) m.layer=1; else delete m.layer; p.layer=newLayer; }
    // sousedi jen ve stejné vrstvě (jiná vrstva se může překrývat)
    const L=p.layer|0; let prev=null, next=null;
    for (let q=k-1;q>=0;q--) if ((E.pages[q].layer|0)===L){ prev=E.pages[q]; break; }
    for (let q=k+1;q<E.pages.length;q++) if ((E.pages[q].layer|0)===L){ next=E.pages[q]; break; }
    if (mode==='m'){ E.words[p.a].br=true; if (p.b+1<E.words.length) E.words[p.b+1].br=true; }
    if (mode==='m'){
      const lo=(prev?prev.s+0.05:0)-p.s, hi=(next?next.e-0.05:vid.duration)-p.e; const d=clamp(dt,lo,hi);
      for (let i=p.a;i<=p.b;i++){ E.words[i].s+=d; E.words[i].e+=d; }
      if (m.so!=null) m.so+=d; if (m.eo!=null) m.eo+=d; else m.eo=p.e+d;
      if (next && p.e+d>next.s){ const nm=pageMeta(next); nm.so=p.e+d; }
    } else if (mode==='l'){ m.so=clamp(p.s+dt, prev?prev.s+0.05:0, p.e-0.1); if (prev && m.so<prev.e){ pageMeta(prev).eo=m.so; } }
    else { m.eo=clamp(p.e+dt, p.s+0.1, next?next.e-0.05:vid.duration); if (next && m.eo>next.s){ pageMeta(next).so=m.eo; } }
    curPage=k; changed(true); if (panel==='captions') renderPanel();
  } else if (blk.dataset.z!==undefined){
    const z=E.zones[+blk.dataset.z]; if (!moved) return;
    if (mode==='m'){ z.s=clamp(z.s+dt,0,vid.duration); z.e=clamp(z.e+dt,0,vid.duration); } else if (mode==='l') z.s=clamp(z.s+dt,0,z.e-0.1); else z.e=clamp(z.e+dt,z.s+0.1,vid.duration);
    changed(true);
  } else if (blk.dataset.o!==undefined){
    const o=E.overlays.find(x=>x.id===+blk.dataset.o); if (!o) return;
    selOv=o.id;
    if (moved){ if (mode==='m'){ o.s=clamp(o.s+dt,0,vid.duration); o.e=clamp(o.e+dt,0,vid.duration); } else if (mode==='l') o.s=clamp(o.s+dt,0,o.e-0.1); else o.e=clamp(o.e+dt,o.s+0.1,vid.duration); }
    else vid.currentTime=o.s+0.3;
    if (panel!=='overlay'){ panel='overlay'; $('bnav').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.p==='overlay')); }
    changed(); renderPanel();
  }
});
// rozdělit titulek v místě přehrávací hlavy
$('splitBtn').onclick=()=>{
  const t=vid.currentTime, k=E.pageAt(t); if (k<0) return toast('Postav přehrávací hlavu na titulek');
  const p=E.pages[k]; let i=p.a; while (i<p.b && E.words[i+1].s<=t) i++;
  if (i>=p.b) i=p.b-1; if (i<p.a) return toast('Titulek má jen jedno slovo');
  // jako v CapCutu: slova před hlavou zůstanou v 1. části, slova za ní jdou do 2. části; střih je přesně v místě hlavy
  const m=pageMeta(p), oldEo=m.eo, layer=m.layer|0, cut=clamp(t, E.words[i].s+0.05, E.words[i+1].s);
  E.words[i+1].br=true; if (p.b+1<E.words.length) E.words[p.b+1].br=true;
  m.eo=cut;
  const k2=E.words[i+1].id, m2=E.meta[k2]=E.meta[k2]||{};
  m2.so=cut; if (oldEo!=null) m2.eo=oldEo; else delete m2.eo; if (layer) m2.layer=layer; if (m.own) m2.own=JSON.parse(JSON.stringify(m.own));
  changed(true); toast('Titulek rozdělený v místě přehrávací hlavy');
};
// přesun titulku do jiné vrstvy (vrstva „pod“ se může časově překrývat s hlavní)
function setLayer(k,layer){
  const p=E.pages[k]; if (!p) return;
  E.words[p.a].br=true; if (p.b+1<E.words.length) E.words[p.b+1].br=true;
  const m=pageMeta(p); if (layer) m.layer=1; else delete m.layer;
  changed(true); renderPanel(); toast(layer?'Titulek je ve vrstvě pod – může se překrývat s ostatními':'Titulek je zpátky v hlavní vrstvě');
}

// ================= GESTA NA VIDEU =================
const ptrs=new Map(); let gest=null;
function cvPt(e){ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height]; }
cv.addEventListener('pointerdown',e=>{
  if (inlineOpen) return;
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,cvPt(e));
  const [x,y]=cvPt(e), hr=Math.min(cv.width,cv.height)*0.05;
  if (ptrs.size===2 && gest && gest.type==='move'){ const [a,b]=[...ptrs.values()]; gest={type:'pinch',d0:Math.hypot(a[0]-b[0],a[1]-b[1]),size0:cur().size}; return; }
  // overlay?
  const t=vid.currentTime;
  for (const o of [...E.overlays].reverse()){ if (t<o.s||t>o.e) continue; const b=E.overlayBox(o); if (Math.abs(x-b.cx)<b.w/2 && Math.abs(y-b.cy)<b.h/2){ selOv=o.id; gest={type:'ov',o,x0:x,y0:y,ox:o.x,oy:o.y,moved:false}; vid.pause(); if (panel!=='overlay'){ panel='overlay'; $('bnav').querySelectorAll('button').forEach(z=>z.classList.toggle('on',z.dataset.p==='overlay')); } renderPanel(); renderTimeline(); return; } }
  const B=E.lastBox;
  if (B){
    const k=E.pageAt(t); if (k>=0) curPage=k;
    if (Math.hypot(x-B.pe[0],y-B.pe[1])<hr*1.4){ openInline(curPage); ptrs.clear(); return; }
    if (Math.hypot(x-B.h[0],y-B.h[1])<hr*1.4){ gest={type:'resize',cx:B.cx,cy:B.cy,d0:Math.hypot(x-B.cx,y-B.cy),size0:cur().size}; guides=true; return; }
    const P=B.P, inside=x>Math.min(...P.map(p=>p[0]))-hr&&x<Math.max(...P.map(p=>p[0]))+hr&&y>Math.min(...P.map(p=>p[1]))-hr&&y<Math.max(...P.map(p=>p[1]))+hr;
    if (inside){ const S=cur(); gest={type:'move',x0:x,y0:y,px:S.posX,py:S.posY,moved:false}; return; }
  }
  gest={type:'tap',x0:x,y0:y};
});
cv.addEventListener('pointermove',e=>{
  if (!ptrs.has(e.pointerId)||!gest) return; ptrs.set(e.pointerId,cvPt(e)); const [x,y]=cvPt(e);
  if (gest.type==='ov'){ gest.moved=true; gest.o.x=clamp(gest.ox+(x-gest.x0)/cv.width*100,0,100); gest.o.y=clamp(gest.oy+(y-gest.y0)/cv.height*100,0,100); }
  else if (gest.type==='move'){ if (Math.hypot(x-gest.x0,y-gest.y0)>6){ gest.moved=true; guides=true; } if (!gest.moved) return;
    let nx=gest.px+(x-gest.x0)/cv.width*100, ny=gest.py+(y-gest.y0)/cv.height*100; if (Math.abs(nx-50)<1.5) nx=50; setVal('posX',+nx.toFixed(1),true); setVal('posY',+clamp(ny,3,97).toFixed(1),true); }
  else if (gest.type==='resize'){ const d=Math.hypot(x-gest.cx,y-gest.cy); setVal('size',Math.round(clamp(gest.size0*d/gest.d0,30,220)),true); }
  else if (gest.type==='pinch' && ptrs.size>=2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); setVal('size',Math.round(clamp(gest.size0*d/gest.d0,30,220)),true); }
});
function endPtr(e){
  ptrs.delete(e.pointerId); if (ptrs.size) return;
  if (gest){ if (gest.type==='tap'){ selOv=null; togglePlay(); } else if (gest.type!=='move'||gest.moved) { changed(); if (panel==='style'||panel==='overlay') renderPanel(); } else if (gest.type==='move' && !gest.moved){ markCur(); if (panel==='captions') renderPanel(); } }
  gest=null; guides=false;
}
cv.addEventListener('pointerup',endPtr); cv.addEventListener('pointercancel',endPtr);

// ================= EXPORT =================
$('exportBtn').onclick=()=>{
  vid.pause();
  const opts=[['orig',`Původní (${fullW}×${fullH})`]]; const short=Math.min(fullW,fullH);
  for (const s of [2160,1440,1080,720]) if (s<short){ const sc=s/short; opts.push([String(s),`${s}p (${Math.round(fullW*sc/2)*2}×${Math.round(fullH*sc/2)*2})`]); }
  $('exRes').innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  const q=$('quality').value; if ([...$('exRes').options].some(o=>o.value===q)) $('exRes').value=q;
  $('exDl').classList.add('hidden'); $('exStatus').textContent=EXP.canPrecise()?'':'Tento prohlížeč neumí přesný export – použije se nahrávání v reálném čase.';
  $('exGo').classList.remove('hidden'); $('exBarW').classList.add('hidden'); $('exMore').open=false;
  openSheet('sheetExport');
  runExport();   // export hned po kliknutí – nastavení jsou schovaná v „Další možnosti“
};
let exCancel=null;
$('exCancel').onclick=()=>{ if (exCancel) exCancel.v=true; };
$('exGo').onclick=()=>runExport();
async function runExport(){
  if (exCancel) return;
  const r=$('exRes').value, short=Math.min(fullW,fullH), sc=r==='orig'?1:(+r)/short;
  const w=Math.round(fullW*sc/2)*2, h=Math.round(fullH*sc/2)*2, fps=+$('exFps').value, mode=segVal('exMode');
  $('exGo').classList.add('hidden'); $('exCancel').classList.remove('hidden'); $('exBarW').classList.remove('hidden'); $('exDl').classList.add('hidden');
  exCancel={v:false};
  const onP=(p,m)=>{ $('exBar').style.width=(p*100)+'%'; $('exStatus').textContent=`${Math.round(p*100)} % · ${m}`; };
  const t0=performance.now();
  try{
    let res;
    const o={file:videoFile,src:videoURL,w,h,fps,mode,mute:E.flags.mute,behind:E.pages.some(p=>E.styleOf(p).behind==='on'),onP,cancel:exCancel};
    if (EXP.canPrecise() || mode==='captions') res=await EXP.exportVideo(o); else res=await EXP.recordRealtime(o);
    const url=URL.createObjectURL(res.blob); const a=$('exDl'); a.href=url; a.download=(project?project.name:'video')+'-'+res.name;
    a.classList.remove('hidden'); onP(1,`Hotovo za ${Math.round((performance.now()-t0)/1000)} s · ${(res.blob.size/1048576).toFixed(1)} MB`+(res.audioNote?` · pozor: ${res.audioNote}`:''));
    // na iPhonu nabídnout sdílení (uložit do Fotek)
    a.onclick=async ev=>{
      // uvnitř Claude (artifact): uložení přes potvrzení „Stáhnout“
      if (window.claude && window.claude.use){ ev.preventDefault(); try{ const d=await window.claude.use('downloads'); if (d){ await d.save({filename:a.download, data:res.blob}); return; } }catch(e){ if (e&&e.code==='declined') return; console.warn(e); } }
      // na iPhonu nabídnout sdílení (uložit do Fotek)
      if (navigator.canShare){ const f=new File([res.blob],a.download,{type:res.blob.type}); if (navigator.canShare({files:[f]})){ ev.preventDefault(); try{ await navigator.share({files:[f]}); }catch(e){} } } };
    window.__lastExport=res;
  }catch(e){ console.error(e); $('exStatus').textContent='Export se nepovedl: '+e.message; }
  finally{ $('exCancel').classList.add('hidden'); $('exGo').classList.remove('hidden'); exCancel=null; }
}
$('quality').onchange=()=>toast('Kvalita exportu: '+$('quality').selectedOptions[0].textContent);


// ================= PRO (předplatné 300 Kč / měsíc, bez něj vodoznak) =================
const PRO={
  get(){ return lsGet('efk_pro',null); },
  set(v){ lsSet('efk_pro',v); PRO.apply(); },
  active(){ const p=PRO.get(); return !!(p && p.token && p.pro && (!p.until || Date.now() < p.until + 3*86400e3)); },
  apply(){
    const on=PRO.active(); E.flags.pro=on;
    const b=$('proBtn'); b.textContent=on?'PRO ✓':'Získat PRO'; b.classList.toggle('on',on);
    $('wmNote').hidden=on;
    const p=PRO.get();
    $('proBuy').hidden=on; $('proHave').hidden=!on;
    if (on){ $('proCodeOut').value=p.token; $('proUntil').textContent=p.until?((p.cancelAtEnd?'Platí do ':'Další platba ')+new Date(p.until).toLocaleDateString('cs-CZ')):''; }
  },
  async api(a,q='',body){
    const r=await fetch('/api/pro?a='+a+q,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
    const j=await r.json().catch(()=>({error:'Server neodpověděl ('+r.status+')'}));
    if (!r.ok) { const e=new Error(j.error||'Chyba'); e.status=r.status; throw e; }
    return j;
  },
  msg(m,err){ const s=$('proStatus'); s.textContent=m||''; s.classList.toggle('err',!!err); },
  open(){ PRO.msg(''); PRO.apply(); openSheet('sheetPro'); },
  async check(token){
    const j=await PRO.api('check','',{token});
    PRO.set({token,...j,checked:Date.now()});
    return j;
  },
};
$('proBtn').onclick=()=>PRO.open();
$('wmRemove').onclick=()=>{ $('sheetExport').classList.remove('on'); PRO.open(); };
$('proGo').onclick=async()=>{
  const b=$('proGo'); b.disabled=true; PRO.msg('Otevírám platbu…');
  try{ const j=await PRO.api('checkout'); location.href=j.url; }
  catch(e){ PRO.msg(e.message,true); b.disabled=false; }
};
$('proCodeOk').onclick=async()=>{
  const t=$('proCodeIn').value.replace(/\s+/g,''); if (!t) return PRO.msg('Vlož PRO kód.',true);
  PRO.msg('Ověřuji…');
  try{ const j=await PRO.check(t); if (j.pro){ PRO.msg(''); toast('PRO je aktivní – videa jsou bez vodoznaku'); } else PRO.msg('Předplatné k tomuto kódu už neplatí ('+j.status+').',true); }
  catch(e){ PRO.msg(e.message,true); }
};
$('proCopy').onclick=async()=>{ const t=$('proCodeOut').value; try{ await navigator.clipboard.writeText(t); toast('Kód zkopírovaný'); }catch(e){ $('proCodeOut').select(); document.execCommand('copy'); toast('Kód zkopírovaný'); } };
$('proManage').onclick=async()=>{ PRO.msg('Otevírám správu předplatného…'); try{ const j=await PRO.api('portal','',{token:PRO.get().token}); location.href=j.url; }catch(e){ PRO.msg(e.message,true); } };
$('proLogout').onclick=()=>{ if (!confirm('Odhlásit PRO z tohoto zařízení? Kód si nejdřív zkopíruj.')) return; lsSet('efk_pro',null); PRO.apply(); PRO.msg(''); };
(async()=>{
  PRO.apply();
  const qs=new URLSearchParams(location.search);
  const sid=qs.get('pro_session');
  if (sid || qs.has('pro_cancel')) history.replaceState(null,'',location.pathname);
  if (sid){
    PRO.open(); PRO.msg('Ověřuji platbu…');
    try{ const j=await PRO.api('activate','&session_id='+encodeURIComponent(sid)); PRO.set({...j,checked:Date.now()}); PRO.msg('Díky! PRO je aktivní. Ulož si PRO kód níže, ať ho můžeš použít i na dalším zařízení.'); }
    catch(e){ PRO.msg('Platbu se nepodařilo ověřit: '+e.message,true); }
    return;
  }
  // ověřit předplatné u Stripe (max jednou za 6 h); když server nejde, platí uložený stav
  const p=PRO.get();
  if (p && p.token && (!p.checked || Date.now()-p.checked > 6*3600e3)){
    try{ await PRO.check(p.token); }catch(e){ if (e.status===400) PRO.set({...p,pro:false}); }
  }
  try{ const st=await PRO.api('status'); if (st.price) { $('proPrice').textContent=st.price+' Kč'; $('proGo').textContent=`Předplatit za ${st.price} Kč / měsíc`; } }catch(e){}
})();

// přibalené písmo titulků (stejné na iPhonu i v počítači) – načíst hned
if (document.fonts && document.fonts.load) for (const w of [400,500,600,700,800,900]) document.fonts.load(`${w} 60px "Inter Tight"`).catch(()=>{});

// ================= START =================
renderHomeTpl(); renderProjects(); renderLangs();
window.__app={E,AI,EXP,setVal,setMany,selectPage,openEditor,loadVideo,afterWords,snapshot,restore,get curPage(){return curPage;}};

// Base měří šířku slov – když se písmo dočte později, titulky se přepočítají
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', ()=>{ if (E.G.split==='fill' && E.words.length){ E.buildPages(); curPage=clamp(curPage,0,Math.max(0,E.pages.length-1)); try{ renderTimeline(); }catch(e){} } });

// maskot na úvodní obrazovce (ukáže se, jen když je soubor maskot.png u appky)
(()=>{ const m=document.getElementById('mascot'); if (!m) return; m.onload=()=>{ m.hidden=false; }; m.onerror=()=>{ m.remove(); }; m.src='maskot.png'; })();
