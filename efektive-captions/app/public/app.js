/* EFEKTIVE Captions – aplikace (obrazovky, editor, časová osa, panely) */
"use strict";
const I=(n,c='')=>`<svg class="ic${c?' '+c:''}"><use href="#i-${n}"/></svg>`;
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
let curPage=0, scope='all', panel='captions', sub={style:'color',templates:'trending',motion:'in'}, fontTarget='em', textTarget='em';
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
// Projekty: úpravy v 'projects' (malé, ukládají se často), video zvlášť v 'files' (uloží se jen jednou)
const DB=new Promise((res,rej)=>{ const r=indexedDB.open('efektive-captions',2); r.onupgradeneeded=()=>{ const db=r.result; if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects',{keyPath:'id'}); if (!db.objectStoreNames.contains('files')) db.createObjectStore('files',{keyPath:'id'}); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
async function dbDo(mode,fn,store='projects'){ const db=await DB; return new Promise((res,rej)=>{ const tx=db.transaction(store,mode), st=tx.objectStore(store); const r=fn(st); tx.oncomplete=()=>res(r&&r.result); tx.onerror=()=>rej(tx.error); }); }
async function renderProjects(){
  let list=[]; try{ list=await dbDo('readonly',st=>st.getAll()); }catch(e){}
  list.sort((a,b)=>b.updated-a.updated);
  $('projects').innerHTML = list.length ? list.map(p=>`<div class="proj" data-id="${p.id}"><img src="${p.thumb||'icon.png'}" alt=""><div class="pn">${esc(p.name)}<small>${new Date(p.updated).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}</small></div><button class="del" data-del="${p.id}">${I('x')}</button></div>`).join('') : '<div class="muted">Zatím žádné projekty.</div>';
}
$('projects').onclick=async e=>{
  const d=e.target.closest('[data-del]');
  if (d){ e.stopPropagation(); if (confirm('Smazat projekt?')){ await dbDo('readwrite',st=>st.delete(d.dataset.del)); try{ await dbDo('readwrite',st=>st.delete(d.dataset.del),'files'); }catch(e){} renderProjects(); } return; }
  const p=e.target.closest('.proj'); if (p && !opening) openProject(p.dataset.id);
};
function snapshot(){
  return JSON.stringify({G:E.G, words:E.words, meta:E.meta, zones:E.zones, overlays:E.overlays.map(o=>({...o,src:undefined,_card:undefined})), mute:E.flags.mute, clips:E.clips, kf:E.kf, kfVer:3, tracks:Object.values(E.tracks).map(trkSave), stab:E.stab, capZ:E.capZ, objs:E.objs.map(objSave), face:E.face?E.face.map(f=>f?f.map(v=>Math.round(v*1000)/1000):null):null});   // poloha obličeje se ukládá s projektem
}
// pojistka: zdvojená slova (stejný text i čas) nikdy nenechat – zůstane jedno, s víc úpravami
function dedupeWords(){
  const seen=new Map(), keep=[]; const nOwn=m=>m&&m.own?Object.keys(m.own).filter(x=>!['posX','posY','_manualPos'].includes(x)).length:-1;
  for (const w of E.words){ const k=w.t+'|'+(+w.s).toFixed(3)+'|'+(+w.e).toFixed(3); const o=seen.get(k);
    if (o){ if (E.meta[w.id] && nOwn(E.meta[w.id])>=nOwn(E.meta[o.id])) E.meta[o.id]=E.meta[w.id]; if (w.em) o.em=true; delete E.meta[w.id]; continue; }
    seen.set(k,w); keep.push(w); }
  if (keep.length!==E.words.length){ console.warn('Odstraněna zdvojená slova:',E.words.length-keep.length); E.words=keep; if (E.pages.length) E.buildPages(); return true; }
  return false;
}
function restore(json){
  const s=JSON.parse(json);
  // chybějící (novější) volby ze starého projektu doplnit neutrálně – ne z naposledy otevřeného projektu
  E.clips=Array.isArray(s.clips)&&s.clips.length?s.clips.map(c=>({...c})):null;
  E.kf=Array.isArray(s.kf)?s.kf.map(k=>({...k, ease:'tok2'})):[];   // zatím jediný průběh: Tok 2
  E.G=Object.assign({},E.G0,E.COMMON,s.G); mixDefaults(s.G); if (s.G && !('enterBy' in s.G)) E.G.enterBy = s.G.wordByWord===false?'page':'word'; E.words=s.words; E.meta=s.meta||{}; E.zones=s.zones||[]; E.flags.mute=!!s.mute; vid.muted=E.flags.mute;
  dedupeWords();
  E.setWid(Math.max(0,...E.words.map(w=>w.id))+1);
  E.face=Array.isArray(s.face)?s.face:null;
  E.tracks={}; for (const T of s.tracks||[]) if (T && T.id && Array.isArray(T.t)) E.tracks[T.id]={...T};
  E.stab=s.stab && s.stab.trk && E.tracks[s.stab.trk] ? {...s.stab} : null;
  E.objs=(s.objs||[]).map(o=>({...o, _mk:Math.random()}));
  E.capZ=+s.capZ||0;
  E.overlays=(s.overlays||[]).map(o=>({...o, src: o.asset&&ovAssets[o.asset]?ovAssets[o.asset].el:null}));
  E.buildPages(); curPage=clamp(curPage,0,Math.max(0,E.pages.length-1));
}
let saveT=null;
function scheduleSave(){ clearTimeout(saveT); saveT=setTimeout(saveProject,1500); }
let saving=null;
async function saveProject(){
  if (saving) { await saving; }
  saving=saveProject0(); try{ await saving; } finally { saving=null; }
}
async function saveProject0(){
  if (!project || !videoFile) return;
  dedupeWords();
  try{
    const th=document.createElement('canvas'); const sc=240/Math.max(cv.width,cv.height); th.width=Math.round(cv.width*sc); th.height=Math.round(cv.height*sc); th.getContext('2d').drawImage(cv,0,0,th.width,th.height);
    const assets=Object.entries(ovAssets).map(([id,a])=>({id,blob:a.blob,type:a.type}));
    // video jen jednou (je velké); pak se ukládají jen úpravy
    if (!project.fileSaved){ await dbDo('readwrite',st=>st.put({id:project.id,file:videoFile,fileName:videoFile.name}),'files'); project.fileSaved=true; }
    const rec={id:project.id,name:project.name,created:project.created,updated:Date.now(),thumb:th.toDataURL('image/jpeg',0.7),fileName:videoFile.name,state:snapshot(),assets,analysed};
    await dbDo('readwrite',st=>st.put(rec));
  }catch(e){ console.warn('Uložení projektu selhalo',e); }
}
let opening=false;
async function openProject(id){
  opening=true; show('busy'); busy('Otevírám projekt…','Chvilku strpení',0.2);
  try{
  const rec=await dbDo('readonly',st=>st.get(id)); if (!rec){ show('home'); return; }
  let fileRec=null; try{ fileRec=await dbDo('readonly',st=>st.get(id),'files'); }catch(e){}
  const raw=(fileRec&&fileRec.file)||rec.file; if (!raw){ show('home'); homeMsg('Video k projektu se nenašlo.'); return; }
  project={id:rec.id,name:rec.name,created:rec.created,fileSaved:!!fileRec};   // starý projekt (video v záznamu) se při uložení převede
  for (const a of rec.assets||[]) await loadAsset(a.id,a.blob);
  busy('Otevírám projekt…','Načítám video',0.5);
  await loadVideo(raw instanceof File?raw:new File([raw],rec.fileName||'video.mp4',{type:raw.type}));
  restore(rec.state); analysed={...(rec.analysed||analysed)}; analysed.face=!!E.face;
  hist=[snapshot()]; hi=0;
  openEditor();
  if (E.G.mix3d && !E.face) mixFaces();   // starší projekt bez uložené polohy obličeje → AI ji najde znovu
  }catch(e){ console.error(e); show('home'); homeMsg('Projekt se nepodařilo otevřít: '+e.message); }
  finally{ opening=false; }
}

// ================= NAČTENÍ VIDEA =================
function loadVideo(file){
  return new Promise((res,rej)=>{
    videoFile=file; if (videoURL) URL.revokeObjectURL(videoURL); videoURL=URL.createObjectURL(file);
    let done=false; const ok=()=>{ if(done) return; done=true; clearTimeout(to); res(); }, bad=m=>{ if(done) return; done=true; clearTimeout(to); rej(new Error(m)); };
    // iPhone video nenačte, dokud se nespustí → stačí znát rozměry (loadedmetadata), obraz se dočte potom
    vid.onloadedmetadata=()=>{ fullW=vid.videoWidth; fullH=vid.videoHeight; E.srcDur=vid.duration||0; sizeCanvas(); if (fullW&&fullH){ try{ vid.currentTime=0.01; }catch(e){} ok(); } };
    vid.onloadeddata=()=>{ if (!fullW){ fullW=vid.videoWidth; fullH=vid.videoHeight; sizeCanvas(); } ok(); };
    vid.onerror=()=>bad('Tohle video se nedá otevřít. Zkus jiné video, nebo ho ulož jako MP4 (ve Fotkách: Sdílet → Uložit video).');
    const to=setTimeout(()=>bad('Video se nenačetlo do 40 sekund. Zkus to znovu, případně kratší video.'),40000);
    vid.preload='auto'; vid.src=videoURL; vid.muted=E.flags.mute; vid.load();
  });
}
// rozlišení náhledu podle skutečné velikosti na displeji (i Retina / velký náhled) → ostré titulky; max 1920 a ne víc než video
function sizeCanvas(){
  if (!fullW||!fullH) return;
  const st=$('stage'), dpr=Math.min(3,window.devicePixelRatio||1);
  const box=st&&st.clientWidth? Math.min(st.clientWidth/fullW, st.clientHeight/fullH) : 0;
  const need=Math.max(fullW,fullH)*box*dpr;                  // kolik pixelů je potřeba na displeji
  const longSide=Math.min(1920, Math.max(1280, need||0));   // titulky ostré i u videa v nízkém rozlišení
  const sc=longSide/Math.max(fullW,fullH);
  const w=Math.round(fullW*sc/2)*2, h=Math.round(fullH*sc/2)*2;
  if (cv.width!==w || cv.height!==h){ cv.width=w; cv.height=h; }
}
$('fileIn').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; if (!f) return; homeMsg('');
  genRun++; $('genBtn').disabled=false;   // případný běžící přepis jiného videa se zahodí
  // nový projekt se zvolenou šablonou
  E.clips=null; E.kf=[]; E.tracks={}; E.stab=null; E.objs=[]; E.capZ=0; E.words=[]; E.pages=[]; E.meta={}; E.zones=[]; E.overlays=[]; E.face=null; E.personMask=null; AI.masks=[]; analysed={face:false,person:false}; E.flags.mute=false;
  for (const k in ovAssets) delete ovAssets[k];
  const t=E.TEMPLATES[homeTpl]||customTemplates()[homeTpl]; Object.assign(E.G, t?t.set:E.TEMPLATES.base.set);
  const dflt=lsGet('efk_default',null); if (dflt && homeTpl==='base'){ Object.assign(E.G, dflt); mixDefaults(dflt); }
  if (E.G.fontMain===E.SF) E.G.wMain=500;   // vedlejší řádky vždy začínají SF Pro Medium
  project={id:'p'+Date.now(), name:f.name.replace(/\.[^.]+$/,'').slice(0,40), created:Date.now()};
  // hned dát najevo, že se něco děje
  show('busy'); busy('Načítám video…','Chvilku strpení, video se nahrává do appky. U delšího videa to může trvat i pár desítek sekund.',0);
  const t0=Date.now(), tick=setInterval(()=>{ const s=(Date.now()-t0)/1000; busy('Načítám video…','Chvilku strpení, video se nahrává do appky. U delšího videa to může trvat i pár desítek sekund.',Math.min(0.95,1-Math.exp(-s/6))); },200);
  try{ await loadVideo(f); }catch(err){ clearInterval(tick); show('home'); homeMsg(err.message); return; }
  clearInterval(tick); busy('Načítám video…','Hotovo',1);
  $('setupPrev').src=videoURL+'#t=0.5'; $('setupPrev').muted=true; $('setupPrev').setAttribute('playsinline',''); $('setupPrev').preload='metadata';
  $('sPunct').checked=!!E.G.punct; setStep('sLines',E.G.maxLines||3); setStep('sChars',E.G.maxChars||0); setStep('sWpp',E.G.wpp||4); $('sMain').value=String(E.G.mainLine||'mid');
  renderLangs(); $('setupStatus').textContent=''; $('setupStatus').classList.remove('err');
  // video v nízké kvalitě (typicky „Pořídit video“ přímo z výběru souboru – iPhone ho tam ukládá zmenšené)
  if (Math.min(fullW,fullH)<1080) $('setupStatus').textContent=`Pozor: video má jen ${fullW}×${fullH}. Pro ostré video natoč v aplikaci Fotoaparát (4K) a sem ho vyber z Fotek nebo ze Souborů – „Pořídit video“ v nabídce iPhone ukládá ve snížené kvalitě.`;
  show('setup');
};
$('setupBack').onclick=()=>{ genRun++; $('genBtn').disabled=false; show('home'); };

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
  window.__wordsAt=Date.now();
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
  PV.currentTime=Math.max(0.01,(E.words[0]?E.words[0].s:0)+0.3);
  saveProject();
}
let genRun=0;
$('genBtn').onclick=async()=>{
  if ($('genBtn').disabled) return;
  const run=++genRun, proj=project; $('genBtn').disabled=true;
  readSetup(); show('busy');
  try{
    busy('Analyzuji video…','Vytahuju zvuk z videa',0.02);
    const {data,rate}=await extractAudio(videoFile);
    const SEG=45, CH=rate*SEG, n=Math.ceil(data.length/CH), all=[];
    for (let i=0;i<n;i++){
      busy('Analyzuji video…',`AI poslouchá a píše text (${i+1}/${n})`,0.05+0.9*i/n);
      const blob=wavFrom(data.subarray(i*CH,Math.min(data.length,(i+1)*CH)),rate);
      const q=new URLSearchParams({lang,quality:segVal('sQuality')});
      const r=await fetch(NATIVE.api('/api/transcribe?'+q),{method:'POST',headers:{'Content-Type':'audio/wav'},body:blob});
      const j=await r.json().catch(()=>({error:'Server neodpověděl'}));
      if (!r.ok||j.error) throw new Error(j.error||('Chyba '+r.status));
      const off=i*SEG; j.words.forEach(w=>{ const raw=String(w.word).trim(); if (raw) all.push(E.mkWord(raw,w.start+off,w.end+off)); });
    }
    // uživatel mezitím odešel / otevřel jiný projekt → výsledek zahodit, nic nepřepisovat
    if (run!==genRun || project!==proj || !$('busy').classList.contains('on')) return;
    E.words=all.filter(w=>w.t); if (!E.words.length) throw new Error('Ve videu jsem neslyšel žádnou řeč.');
    await afterWords();
  }catch(err){ console.error(err); if (run!==genRun || project!==proj) return; show('setup');
    const noServer=/Failed to fetch|NetworkError|Load failed|Chyba 404|Chyba 405|Server neodpověděl|chybí klíč/i.test(err.message);
    const st=$('setupStatus'); st.textContent = noServer ? 'AI přepis tady nejede (appka neběží na serveru s klíčem). Vlož text ručně níž a dej Použít.' : 'Přepis se nepovedl: '+err.message;
    st.classList.add('err'); try{ st.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
  finally{ if (run===genRun) $('genBtn').disabled=false; }
};
$('manualBtn').onclick=async()=>{
  const list=$('manualText').value.trim().split(/\s+/).filter(Boolean); if(!list.length) return;
  readSetup(); show('busy'); E.words=E.spread(list,0.2,PV.duration-0.2); await afterWords();
};
// slovník
$('dictOpen').onclick=()=>openSheet('sheetDict');
function openSheet(id){ if (id==='sheetDict') $('dictText').value=dict; $(id).classList.add('on'); }
document.querySelectorAll('.sheet').forEach(s=>{ s.onclick=e=>{ if (e.target===s||e.target.closest('[data-close]')) s.classList.remove('on'); }; });
$('dictSave').onclick=()=>{ dict=$('dictText').value; lsSet('efk_dict',dict); $('sheetDict').classList.remove('on'); toast('Slovník uložený'); };
$('dictApply').onclick=()=>{ dict=$('dictText').value; lsSet('efk_dict',dict); const n=E.applyCorrections(parseDict(dict)); E.buildPages(); changed(); $('sheetDict').classList.remove('on'); toast(n?`Opraveno ${n}×`:'Nic k opravě'); };

// ================= EDITOR =================
function openEditor(){ if (E.clips && E.clips.length>1) setTimeout(pbDecode,500); freeVideo($('setupPrev')); show('editor'); sizeCanvas(); renderTimeline(); thumbs(); renderPanel(); updateMute(); syncTop(); }
$('closeBtn').onclick=async()=>{ vid.pause(); clearTimeout(saveT); show('home'); await saveProject(); renderProjects(); };

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
function syncTop(){ $('undoBtn').disabled=hi<=0; $('redoBtn').disabled=hi>=hist.length-1; $('eyeBtn').classList.toggle('on',E.flags.hidden); $('eyeBtn').innerHTML=I(E.flags.hidden?'eye-off':'eye'); }

// --- přehrávání ---
function togglePlay(){
  if (PB.on){ pbStop(); return; }
  if (swap){ endSwap(false); return; }
  if (E.clips && E.clips.length>1 && PB.bufFor===videoURL && PB.buf && PB.buf!=='none'){ pbStart(); return; }
  if (E.clips && E.clips.length>1) pbDecode();
  if (vid.paused){ ensureAC(); const pr=vid.play(); if (pr && pr.catch) pr.catch(e=>{ console.warn('play',e); $('playBtn').innerHTML=I('play'); $('fsPlay').innerHTML=I('play'); }); }
  else vid.pause();
}
// iPhone: když se video při přehrávání dočítá, ukázat to (jinak to vypadá, že se zaseklo)
const setWait=on=>$('stage').classList.toggle('waiting',on);
vid.addEventListener('waiting',()=>{ if (!vid.paused && !swapQuiet) setWait(true); });
['playing','pause','seeked','canplay'].forEach(ev=>vid.addEventListener(ev,()=>setWait(false)));
$('playBtn').onclick=togglePlay;
vid.onplay=()=>{ if (swapQuiet) return; $('playBtn').innerHTML=I('pause'); $('fsPlay').innerHTML=I('pause'); lastT=PV.currentTime; };
vid.onpause=()=>{ if (swapQuiet) return; $('playBtn').innerHTML=I('play'); $('fsPlay').innerHTML=I('play'); };
$('eyeBtn').onclick=()=>{ E.flags.hidden=!E.flags.hidden; syncTop(); };
// velký náhled: přes celou obrazovku aplikace (ne systémový fullscreen – z toho se na iPhonu nedalo dostat zpět)
function setFs(on){ $('stage').classList.toggle('fs',on); requestAnimationFrame(()=>sizeCanvas()); document.body.classList.toggle('fsmode',on); $('fsBtn').innerHTML=I(on?'minimize':'maximize'); }
$('fsBtn').onclick=()=>setFs(!$('stage').classList.contains('fs'));
$('fsExit').onclick=e=>{ e.stopPropagation(); setFs(false); };
$('fsPlay').onclick=e=>{ e.stopPropagation(); togglePlay(); };
document.addEventListener('keydown',e=>{ if (e.key==='Escape' && $('stage').classList.contains('fs')) setFs(false); });
function updateMute(){ if (PB.on){ if (PB.gain) PB.gain.gain.value=E.flags.mute?0:1; } else vid.muted=E.flags.mute; $('muteBtn').classList.toggle('on',E.flags.mute); $('muteBtn').innerHTML=E.flags.mute?I('volume-x')+' Zvuk videa vypnutý':I('volume')+' Zvuk videa'; }
$('muteBtn').onclick=()=>{ E.flags.mute=!E.flags.mute; updateMute(); changed(); };

// --- živé zvuky ---
let AC=null, lastT=0;
function ensureAC(){ if (!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); } if (AC.state==='suspended') AC.resume(); }
function playSfx(type){ ensureAC(); E.sfxInto(AC,AC.destination,AC.currentTime,type,E.G.sfxVol/100); }

// --- smyčka ---
let dragging=null, guides=false, inlineOpen=false;
// Plynulý čas pro náhled: iPhone posouvá currentTime po skocích (podle snímků videa, nepravidelně).
// Čas proto běží rovnoměrně podle hodin zařízení, NIKDY necouvá a k videu se dorovnává pomalu a neznatelně
// (přesný čas snímku bere z requestVideoFrameCallback, kde to jde).
const clk={run:false,base:0,at:0,last:0,ref:null};
function clkReset(){ clk.base=vid.currentTime; clk.at=performance.now(); clk.last=clk.base; clk.ref=null; }
function videoNow(now){ // nejlepší odhad skutečného času videa
  if (clk.ref) return clk.ref.media+(now-clk.ref.at)/1000*(vid.playbackRate||1);
  return vid.currentTime;
}
if (vid.requestVideoFrameCallback){ const cb=(n,md)=>{ clk.ref={media:md.mediaTime, at:(md.expectedDisplayTime||n)}; vid._mt=md.mediaTime; vid.requestVideoFrameCallback(cb); }; vid.requestVideoFrameCallback(cb); }
vid.addEventListener('playing',()=>{ if (swapQuiet) return; clkReset(); clk.run=true; });
['pause','waiting','emptied'].forEach(ev=>vid.addEventListener(ev,()=>{ if (swapQuiet) return; clk.run=false; clkReset(); }));
vid.addEventListener('seeked',()=>{ if (swapQuiet) return; clkReset(); clk.run=!vid.paused; });
vid.addEventListener('durationchange',()=>{ if (vid.duration && isFinite(vid.duration)) E.srcDur=vid.duration; });
function smoothTime(){
  if (!clk.run || vid.paused || vid.seeking) return vid.currentTime;
  const now=performance.now(), rate=vid.playbackRate||1, ct=vid.currentTime;
  if (ct!==clk.lastCt){ clk.lastCt=ct; clk.ctAt=now; }
  if (now-(clk.ctAt||now)>350){ clk.base=Math.max(ct,clk.last); clk.at=now; clk.ref=null; return clk.last; }   // video stojí (dočítá se) → titulky taky stojí
  let t=clk.base+(now-clk.at)/1000*rate;
  const err=videoNow(now)-t;
  if (err>0.4 || err<-1){ clkReset(); clk.last=Math.max(clk.last,clk.base); return clk.last; }   // skok → srovnat bez couvání
  clk.base+=err*0.03;                                          // pomalé neznatelné dorovnání
  t=clk.base+(now-clk.at)/1000*rate;
  if (t<clk.last) t=clk.last;                                  // nikdy necouvat = žádné cukání
  clk.last=t;
  return Math.min(t, vid.duration||t);
}
// čas na timeline = výsledný čas (po střihu); video samo běží ve zdrojovém čase
const PV={ get currentTime(){ return E.src2out(vid.currentTime); }, set currentTime(t){ vid.currentTime=E.out2src(t); }, get duration(){ return vid.duration?E.outDur():NaN; } };
// přehrávání přes střihy bez zastavení: druhý (neviditelný) přehrávač má další úsek připravený dopředu.
// Ve střihu se obraz i zvuk přepnou na něj, hlavní přehrávač se mezitím v klidu přetočí a pak se zase převezme.
let swapQuiet=false, swap=null;
const vidB=document.createElement('video'); vidB.muted=true; vidB.playsInline=true; vidB.setAttribute('playsinline',''); vidB.preload='auto'; vidB.className='srcvid'; document.body.appendChild(vidB);
if (vidB.requestVideoFrameCallback){ const cb=(n,md)=>{ vidB._mt=md.mediaTime; vidB.requestVideoFrameCallback(cb); }; vidB.requestVideoFrameCallback(cb); }   // přesný čas snímku (stabilizace)
function prepB(next){
  if (!videoURL) return;
  if (vidB.dataset.src!==videoURL){ vidB.dataset.src=videoURL; vidB.src=videoURL; vidB.load(); vidB.prepFor=null; }
  if (vidB.prepFor!==next.s){ vidB.prepFor=next.s; try{ vidB.pause(); vidB.currentTime=next.s+0.001; }catch(e){} }
}
function endSwap(keepPlaying){
  if (!swap) return; const t=vidB.currentTime;
  vidB.pause(); vidB.muted=true; E.attach(cv,vid); swap=null;
  if (!keepPlaying){ vid.currentTime=t; swapQuiet=false; vid.muted=E.flags.mute; vid.pause(); $('playBtn').innerHTML=I('play'); $('fsPlay').innerHTML=I('play'); clkReset(); }
}
function clipGuard(){
  if (!E.clips || !E.clips.length) return;
  const L=E.clips;
  if (swap){
    // hlavní přehrávač se dorovná a převezme obraz i zvuk
    const bt=vidB.currentTime;
    if (!vid.paused && vid.currentTime>=bt-0.03){ vid.muted=E.flags.mute; endSwap(true); swapQuiet=false; clkReset(); clk.run=true; return; }   // hlavní dohnal → převzít
    if (bt>=swap.tgt-0.12 && vid.paused && !vid.seeking && vid.readyState>=3) vid.play().catch(()=>{});   // rozjet s předstihem (iPhone se chvíli rozbíhá)
    if (bt>swap.tgt+0.5 && vid.paused){ swap.tgt=Math.min(bt+0.6, swap.end); vid.currentTime=swap.tgt; }   // nestihl to → zkusit kus dál
    return;
  }
  if (vid.seeking) return;
  const ts=vid.currentTime, k=L.findIndex(c=>ts>=c.s-0.01 && ts<c.e-0.03), next=L[k>=0?k+1:L.findIndex(c=>c.s>ts-0.01)];
  if (k>=0){
    if (next && L[k].e-ts<1.5) prepB(next);
    return;
  }
  if (next){
    const ready=vidB.prepFor===next.s && vidB.readyState>=2 && Math.abs(vidB.currentTime-next.s)<0.08 && !vidB.seeking;
    if (ready){
      // přepnutí bez zastavení
      vidB.muted=E.flags.mute; vidB.play().catch(()=>{});
      swapQuiet=true; vid.muted=true; vid.pause();
      const tgt=Math.min(next.s+0.7, next.e-0.05);
      swap={tgt,end:next.e-0.05}; vid.currentTime=tgt; E.attach(cv,vidB);
    } else vid.currentTime=next.s+0.001;
  } else if (!vid.paused){ vid.pause(); vid.currentTime=L[L.length-1].e-0.03; }
}

// ================= PŘEHRÁVÁNÍ SE STŘIHEM (jako ve střižně) =================
// Zvuk běží samostatně přes Web Audio – úseky navazují bez mezery a určují čas.
// Obraz dávají dva tiché přehrávače: jeden hraje aktuální úsek, druhý má další úsek rozjetý dopředu
// a ve střihu se jen přepne, který se kreslí. Nic se nepřetáčí → žádný zásek.
const PB={on:false, buf:null, bufFor:null, decoding:null, nodes:[], gain:null, t0:0, a0:0, act:null, other:null, k:-1};
async function pbDecode(){
  if (PB.bufFor===videoURL && (PB.buf||PB.decoding)) return PB.decoding;
  PB.bufFor=videoURL; PB.buf=null;
  const url=videoURL, file=videoFile;
  PB.decoding=(async()=>{ try{ const b=await decodeVideoAudio(file); if (PB.bufFor===url) PB.buf=b; }catch(e){ console.warn('Zvuk pro přehrávání se střihem',e); PB.buf='none'; } PB.decoding=null; })();
  return PB.decoding;
}
const pbNow=()=>PB.t0+Math.max(0,AC.currentTime-PB.a0);
function pbStart(){
  ensureAC();
  const L=E.clipList(), st=E.clipStarts(), T=clamp(PV.currentTime,0,Math.max(0,E.outDur()-0.05));
  PB.gain=AC.createGain(); PB.gain.gain.value=E.flags.mute?0:1; PB.gain.connect(AC.destination);
  PB.a0=AC.currentTime+0.06; PB.t0=T; PB.nodes=[];
  if (PB.buf && PB.buf!=='none'){
    L.forEach((c,k)=>{ const o=st[k], d=c.e-c.s; if (o+d<=T) return;
      const n=AC.createBufferSource(); n.buffer=PB.buf; n.connect(PB.gain);
      const skip=Math.max(0,T-o); n.start(PB.a0+Math.max(0,o-T), c.s+skip, d-skip); PB.nodes.push(n); });
  }
  // obraz: hlavní přehrávač na aktuální úsek, druhý připravit na další
  PB.on=true; swapQuiet=true; vid.muted=true; vidB.muted=true;
  if (vidB.dataset.src!==videoURL){ vidB.dataset.src=videoURL; vidB.src=videoURL; vidB.load(); }
  PB.act=vid; PB.other=vidB; PB.k=-1; PB.prep=null;
  vid.currentTime=E.out2src(T); vid.play().catch(()=>{});
  E.attach(cv,vid);
  $('playBtn').innerHTML=I('pause'); $('fsPlay').innerHTML=I('pause'); lastT=T;
}
function pbStop(){
  if (!PB.on) return;
  const T=Math.min(pbNow(), E.outDur()-0.03);
  PB.nodes.forEach(n=>{ try{ n.stop(); }catch(e){} }); PB.nodes=[]; try{ PB.gain.disconnect(); }catch(e){}
  PB.on=false; vidB.pause(); vid.pause();
  E.attach(cv,vid); vid.muted=E.flags.mute;
  vid.currentTime=E.out2src(T);
  setTimeout(()=>{ swapQuiet=false; },50);
  $('playBtn').innerHTML=I('play'); $('fsPlay').innerHTML=I('play'); clkReset();
}
function pbTick(){
  const T=pbNow(), L=E.clipList(), st=E.clipStarts();
  if (T>=E.outDur()-0.02){ pbStop(); return E.outDur()-0.03; }
  let k=0; for (let i=0;i<L.length;i++) if (T>=st[i]) k=i;
  const c=L[k], ts=c.s+(T-st[k]);
  if (k!==PB.k){
    // střih: přepnout na druhý přehrávač, pokud má tenhle úsek připravený a rozjetý
    if (PB.k>=0 && PB.prep===k && PB.other.readyState>=2){ const a=PB.act; PB.act=PB.other; PB.other=a; a.pause(); E.attach(cv,PB.act); }
    else if (Math.abs(PB.act.currentTime-ts)>0.12) PB.act.currentTime=ts;
    if (PB.act.paused) PB.act.play().catch(()=>{});
    PB.k=k; PB.prep=null;
  } else if (Math.abs(PB.act.currentTime-ts)>0.25 && !PB.act.seeking){ PB.act.currentTime=ts; }   // dorovnat jen při velkém rozdílu
  // příprava dalšího úseku: 0,3 s před střihem rozjet druhý přehrávač z místa o 0,3 s dřív
  const nk=k+1;
  if (nk<L.length){
    const left=st[nk]-T, lead=0.3;
    if (PB.prep!==nk && left<1.5){ PB.prep=nk; PB.prepStart=false; try{ PB.other.pause(); PB.other.currentTime=Math.max(0,L[nk].s-lead); }catch(e){} }
    if (PB.prep===nk && !PB.prepStart && left<=lead+0.02 && !PB.other.seeking){ PB.prepStart=true; PB.other.play().catch(()=>{}); }
  }
  return T;
}
let lastFrame=0;
function loop(now){
  if (now && now-lastFrame<14){ requestAnimationFrame(loop); return; }
  lastFrame=now||performance.now();
  const t= PB.on ? pbTick() : (( (!vid.paused || swap) && clipGuard()), E.src2out(swap? vidB.currentTime : smoothTime()));
  if (videoURL && $('editor').classList.contains('on')){
    if (!vid.paused || swap || PB.on){
      const k=E.pageAt(t); if (k>=0 && k!==curPage){ curPage=k; markCur(); }
      if (t>lastT && t-lastT<0.5) for (const ev of E.sfxEvents()) if (ev.t>lastT && ev.t<=t) playSfx(ev.type);
      followTimeline(t);
    }
    lastT=t;
    syncOverlays(t, !vid.paused || PB.on);
    E.render(t,{});
    syncVmode();
    if (objEdit){ drawObjEdit(); E.lastBox=null; }
    else if (trkPick){ drawTrkPick(); E.lastBox=null; }
    else if (vid.paused && !inlineOpen && !E.flags.hidden && E.lastLines && !videoMode()){ const p=E.pages[E.pageAt(t)]; if (p) E.drawBox(E.lastLines,E.styleAt(p,t),guides); }
    else E.lastBox=null;
    if (selOv && vid.paused) drawOvSel();
    drawVGuide();
    if (!trkPick && vid.paused) drawTrkMark(t);
    $('tm').textContent=fmt(t)+' / '+fmt(PV.duration);
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
  // rozdělení slov do řádků se mění jen u nastavení dělení (šířka řádku, počet slov…);
  // velikost, mezery, zúžení a písmo už řádky NEpřehazují – titulek se jen plynule zvětší / zmenší a vejde se
  if (REBUILD.has(key)) E.buildPages();
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
// ruční výběr barev hlavního řádku → vypnout střídání barvy (jinak by každý N-tý titulek zůstal modrý)
function stopAlt(){ if (!E.G.altOn) return; E.G.altOn=false; for (const k in E.meta){ const o=E.meta[k].own; if (o) delete o.altOn; } toast('Střídání barvy vypnuté – platí tvoje barvy'); }
function bindControls(){
  for (const [type,id,key,a,b] of C){
    const el=$(id); if (!el) continue;
    if (type==='range'){ el.oninput=()=>{ $(id+'v').textContent=el.value+el.dataset.unit; setVal(key,+el.value,true); }; el.onchange=()=>changed(); }
    else if (type==='tog') el.onchange=()=>setVal(key,el.checked?a:b);
    else if (type==='color'){ el.oninput=()=>{ if (key==='gA'||key==='gB') stopAlt(); setVal(key,el.value,true); }; el.onchange=()=>changed(); }
    else if (type==='chips') el.onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; el.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c)); const v=c.dataset.v; setVal(key, v==='true'?true:v==='false'?false:(v!==''&&!isNaN(+v)&&!/^0\d/.test(v)?+v:v)); if (key==='mainLine'||key==='layout') renderPanel(); };
  }
  C.length=0;
}

// ================= PANELY =================
// sáhnu na timeline / video / panel → přehrávání se zastaví (ať se dá v klidu posouvat a upravovat)
['tl','stage','panel'].forEach(id=>{ const el=$(id); const stop=e=>{ if (e.target && e.target.closest && e.target.closest('.fsbar')) return; if (PB.on) pbStop(); else if (swap) endSwap(false); else if (!vid.paused) vid.pause(); };
  el.addEventListener('touchstart',stop,{passive:true}); el.addEventListener('pointerdown',stop,{passive:true}); el.addEventListener('wheel',stop,{passive:true}); });
let edState='normal';
window.addEventListener('resize',()=>{ if ($('editor').classList.contains('on')) sizeCanvas(); });
function setEd(st){ if (st===edState) return; edState=st; const ed=$('editor'); ed.classList.toggle('ed-exp',st==='exp'); ed.classList.toggle('ed-col',st==='col'); setTimeout(sizeCanvas,350); }
(function(){
  const pn=$('panel'), gr=$('grab'); let y0=null, top0=0, done=false;
  const start=(e,fromGrab)=>{ y0=e.touches[0].clientY; top0=fromGrab?0:pn.scrollTop; done=false; };
  const move=e=>{ if (y0==null||done) return; const dy=e.touches[0].clientY-y0;
    if (dy<-28){ if (edState==='col') setEd('normal'); else if (edState==='normal') setEd('exp'); done=true; }            // prst nahoru
    else if (dy>28 && top0<=0 && pn.scrollTop<=0){ if (edState==='exp') setEd('normal'); else if (edState==='normal') setEd('col'); done=true; } }; // prst dolů na začátku obsahu
  pn.addEventListener('touchstart',e=>start(e,false),{passive:true}); pn.addEventListener('touchmove',move,{passive:true});
  gr.addEventListener('touchstart',e=>start(e,true),{passive:true}); gr.addEventListener('touchmove',move,{passive:true});
  gr.addEventListener('click',()=>setEd(edState==='col'?'normal':edState==='normal'?'exp':'normal'));
  pn.addEventListener('touchend',()=>{ y0=null; }); gr.addEventListener('touchend',()=>{ y0=null; });
  // počítač: kolečko myši nad lištou
  pn.addEventListener('wheel',e=>{ if (e.deltaY>30 && edState!=='exp' && pn.scrollHeight>pn.clientHeight) setEd(edState==='col'?'normal':'exp'); else if (e.deltaY<-30 && pn.scrollTop<=0) setEd(edState==='exp'?'normal':'col'); },{passive:true});
})();
$('bnav').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; if (selClip>=0){ selClip=-1; renderVideoTrack(); } if (edState==='col') setEd('normal'); panel=b.dataset.p; $('bnav').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); if (panel!=='overlay') selOv=null; renderPanel(); };
function subHTML(name,opts,extra=''){ return `<div class="sub" data-sub="${name}">${opts.map(([v,l])=>`<div data-v="${v}" class="${sub[name]===v?'on':''}">${l}</div>`).join('')}${extra}</div>`; }
function bindSub(){ document.querySelectorAll('#panel .sub[data-sub]').forEach(s=>{ s.onclick=e=>{ const d=e.target.closest('[data-v]'); if (d){ sub[s.dataset.sub]=d.dataset.v; renderPanel(); } }; }); }
function renderPanel(){
  const P=$('panel'); C.length=0;
  let h='';
  if (!E.pages.length && panel!=='overlay' && panel!=='clip' && panel!=='kf' && panel!=='obj'){ P.innerHTML='<div class="muted">Žádné titulky. Vytvoř je přes AI přepis nebo vlož text ručně.</div>'; return; }
  switch(panel){
    case 'captions': h=pCaptions(); break;
    case 'templates': h=pTemplates(); break;
    case 'style': h=pStyle(); break;
    case 'motion': h=pMotion(); break;
    case 'sfx': h=pSfx(); break;
    case 'overlay': h=pOverlay(); break;
    case 'ai': h=pAI(); break;
    case 'mix': h=pMix(); break;
    case 'clip': h=pClip(); break;
    case 'kf': h=pKf(); break;
    case 'obj': h=pObj(); break;
  }
  P.innerHTML=h; bindControls(); bindScope(); bindSub();
  const fn=binders[panel]; fn&&fn();
}
const binders={};
// ---------- KLÍČOVÉ SNÍMKY (zoom / posun / průhlednost videa) ----------
function openKfPanel(){ if (selClip<0) selClip=Math.max(0,E.clipList().findIndex((c,i)=>{ const st=E.clipStarts(); return PV.currentTime>=st[i] && PV.currentTime<st[i]+(c.e-c.s); })); panel='clip'; $('bnav').querySelectorAll('button').forEach(x=>x.classList.remove('on')); renderPanel(); renderVideoTrack(); }
function kfHere(){ const t=PV.currentTime; return E.kf.findIndex(k=>Math.abs(k.t-t)<0.05); }
function kfVals(){ const k=E.kfAt(PV.currentTime); return k?{z:k.z,x:k.x,y:k.y,op:k.op}:{z:100,x:0,y:0,op:100}; }
function kfEnsure(){ let i=kfHere(); if (i<0){ const v=kfVals(); E.kf.push({t:PV.currentTime,...v,ease:'tok2'}); E.kf.sort((a,b)=>a.t-b.t); i=kfHere(); } selKf=i; return E.kf[i]; }
function pKf(noHead){
  const i=kfHere(); if (i>=0) selKf=i; const k=i>=0?E.kf[i]:null, v=k||kfVals();
  const rng=(lb,key,min,max,st,unit)=>`<label class="ctl"><div class="lb"><span>${lb}</span><span id="kf_${key}v">${Math.round(v[key]*10)/10}${unit}</span></div><input type="range" id="kf_${key}" min="${min}" max="${max}" step="${st}" value="${v[key]}"></label>`;
  return `${noHead?'<div class="clabel kfh">'+I('kf','grad')+' Klíčové body (zoom, posun, průhlednost)</div><div class="note">':'<div class="mixhead"><svg class="ic grad"><use href="#i-kf"/></svg><div><b>Klíčové body videa</b><small>'}${k?'Upravuješ klíčový bod v '+fmt(k.t)+'.':'Posuň posuvník nebo video na náhledu (dvěma prsty zoom, jedním posun) – klíčový bod se vytvoří sám.'} Mezi dvěma klíčovými body se video plynule přiblíží / posune.${noHead?'</div>':'</small></div></div>'}
  <div class="btnrow"><button class="btn" id="kfAdd">${I('plus','grad')} Klíčový bod tady</button>${k?`<button class="btn" id="kfDel">${I('trash')} Smazat</button>`:''}</div>
  ${rng('Zoom','z',100,400,1,' %')}
  ${rng('Posun doleva / doprava','x',-50,50,0.5,' %')}
  ${rng('Posun nahoru / dolů','y',-50,50,0.5,' %')}
  ${rng('Průhlednost videa','op',0,100,1,' %')}
  ${k && i>0?`<div class="clabel">Průběh do tohoto snímku (speed rampa)</div><div class="eases" id="kfEase">${E.EASES.map(([e,l])=>`<div class="ease ${k.ease===e?'on':''} ${e==='tok2'?'gold':''}" data-v="${e}"><svg viewBox="0 0 60 40"><path d="${easePath(e)}"/></svg><span>${l}</span></div>`).join('')}</div>`:(k?'<div class="note">Průběh se nastavuje u druhého (a dalšího) klíčového bodu.</div>':'')}
  ${E.kf.length?`<button class="btn small" id="kfClear">Smazat všechny klíčové body</button>`:''}`;
}
function easePath(e){ const f=E.EASE[e]||E.EASE.lin; let d=''; for(let i=0;i<=20;i++){ const q=i/20; d+=(i?'L':'M')+(4+q*52).toFixed(1)+' '+(36-f(q)*32).toFixed(1); } return d; }
binders.kf=()=>{
  for (const key of ['z','x','y','op']){ const el=$('kf_'+key); if (!el) continue;
    el.oninput=()=>{ const k=kfEnsure(); k[key]=+el.value; if (key!=='op'){ const f=vFit(k); k.z=f.z; k.x=f.x; k.y=f.y; vGuide=null; } $('kf_'+key+'v').textContent=(Math.round(+el.value*10)/10)+(key==='x'||key==='y'||key==='z'||key==='op'?' %':''); renderVideoTrack(); };
    el.onchange=()=>{ changed(); renderPanel(); }; }
  $('kfAdd').onclick=()=>{ kfEnsure(); changed(); renderPanel(); renderVideoTrack(); toast('Klíčový bod přidaný'); };
  if ($('kfDel')) $('kfDel').onclick=()=>{ const i=kfHere(); if (i>=0) E.kf.splice(i,1); selKf=-1; changed(); renderPanel(); renderVideoTrack(); };
  if ($('kfClear')) $('kfClear').onclick=()=>{ if (!confirm('Smazat všechny klíčové body?')) return; E.kf=[]; selKf=-1; changed(); renderPanel(); renderVideoTrack(); };
  const ez=$('kfEase'); if (ez) ez.onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; const i=kfHere(); if (i>=0){ E.kf[i].ease=d.dataset.v; changed(); renderPanel(); renderVideoTrack(); } };
};

// ---------- STŘIH: panel vybraného úseku videa ----------
function openClipPanel(){ panel='clip'; $('bnav').querySelectorAll('button').forEach(x=>x.classList.remove('on')); renderPanel(); renderVideoTrack(); }
function pClip(){
  const L=E.clipList(), k=clamp(selClip,0,L.length-1), c=L[k], st=E.clipStarts();
  return `<div class="mixhead"><svg class="ic grad"><use href="#i-scissors"/></svg><div><b>Úsek videa ${k+1} / ${L.length}</b><small>${fmt(st[k])} – ${fmt(st[k]+(c.e-c.s))} · délka ${(c.e-c.s).toFixed(1)} s. Konce úseku zkrátíš tažením za okraje na stopě videa.</small></div></div>
  <div class="btnrow"><button class="btn" id="clCut">${I('scissors','grad')} Rozstřihnout v místě hlavy</button></div>
  <div class="btnrow"><button class="btn" id="clDel" ${L.length<2?'disabled':''}>${I('trash')} Smazat tento úsek</button></div>
  ${k>0?`<div class="clabel">Přechod na začátku úseku</div><div class="chips" id="clTr">${E.TRANSITIONS.map(([v,l])=>`<div class="chip ${(c.tr||'none')===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>`:'<div class="note">Na začátku videa přechod není. Přechod se dává mezi dva úseky.</div>'}
  ${k>0 && c.tr && c.tr!=='none'?`<label class="ctl"><div class="lb"><span>Délka přechodu (rychlost)</span><span id="clTrDv">${(c.trDur||E.TRDEF[c.tr]||0.12).toFixed(2)} s</span></div><input type="range" id="clTrD" min="0.04" max="1.5" step="0.01" value="${c.trDur||E.TRDEF[c.tr]||0.12}"></label><div class="note">Vlevo = rychlejší, vpravo = pomalejší.</div>
  ${E.TRDIR.has(c.tr)?`<div class="clabel">Směr</div><div class="chips" id="clTrDir">${[['r','Doprava'],['l','Doleva']].map(([v,l])=>`<div class="chip ${(c.trDir||'r')===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>`:''}`:''}
  ${L.length>1?`<button class="btn small" id="clTrAll">Tenhle přechod na všechny střihy</button>`:''}
  <div class="note">Vcucnutí, zahoupání a švihnutí mají skutečný motion blur a zkreslení čočky. Zvuky k přechodům brzy přibudou.</div>
  ${stabSection()}
  ${pKf(true)}`;
}
// stabilizace na objekt: obličej (nebo cokoli) stojí na obrazovce pořád na jednom místě
function stabSection(){
  const st=E.stab, T=st&&E.tracks[st.trk];
  if (!T) return `<div class="clabel">Stabilizace na objekt</div><button class="btn" id="stabStart">${I('target','grad')} Stabilizovat na obličej / objekt</button>
    <div class="note">Video se bude posouvat tak, aby vybraný obličej nebo objekt stál pořád na jednom místě – i když člověk jde a kýve se. Nejdřív zastav video tam, kde je objekt dobře vidět.</div>`;
  const inf=E.stabInfo(), a=E.src2out(T.t[0]), b=E.src2out(T.t[T.t.length-1]);
  return `<div class="clabel">Stabilizace na objekt · ${fmt(a)}–${fmt(b)}</div>
    <div class="note">Video je kvůli stabilizaci přiblížené na ${Math.round((inf?inf.zoom:1)*100)} % (aby nebyly vidět okraje).</div>
    <div class="row"><span>I stejná velikost objektu</span><input type="checkbox" class="sw" id="stabSc" ${st.scale?'checked':''}></div>
    <label class="ctl"><div class="lb"><span>Vyhlazení (0 = úplně pevně)</span><span>${st.smooth??5}</span></div><input type="range" id="stabSm" min="0" max="60" value="${st.smooth??5}"></label>
    <div class="btnrow"><button class="btn" id="stabStart">${I('target')} Nastavit znovu</button><button class="btn" id="stabOff">${I('x')} Vypnout</button></div>`;
}
function stabBind(){
  if (!$('stabStart')) return;
  $('stabStart').onclick=()=>trkBegin('stab',id=>{ E.stab=id?{trk:id,smooth:(E.stab&&E.stab.smooth)??5,scale:!!(E.stab&&E.stab.scale)}:null; });
  if (!E.stab) return;
  $('stabSc').onchange=e=>{ E.stab.scale=e.target.checked; changed(); renderPanel(); };
  $('stabSm').oninput=e=>{ E.stab.smooth=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=E.stab.smooth; }; $('stabSm').onchange=()=>{ changed(); renderPanel(); };
  $('stabOff').onclick=()=>{ E.stab=null; trkGC(); changed(); renderPanel(); };
}
binders.clip=()=>{
  binders.kf(); stabBind();
  $('clCut').onclick=()=>cutAt(PV.currentTime);
  $('clDel').onclick=()=>{ if (confirm('Smazat tento úsek videa? Titulky v něm zmizí a další se posunou.')) deleteClip(clamp(selClip,0,E.clipList().length-1)); };
  const tr=$('clTr'); if (tr) tr.onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; ensureClips(); E.clips[selClip].tr=d.dataset.v; E.clips[selClip].trDur=E.TRDEF[d.dataset.v]||0.12; changed(); renderPanel(); renderVideoTrack(); PV.currentTime=Math.max(0,E.clipStarts()[selClip]-0.4); };
  const all=$('clTrAll'); if (all) all.onclick=()=>{ ensureClips(); const src=E.clips[Math.max(1,selClip)]; E.clips.forEach((c,i)=>{ if (i){ c.tr=src.tr||'none'; c.trDur=src.trDur||E.TRDEF[src.tr]||0.12; c.trDir=src.trDir; } }); changed(); renderVideoTrack(); toast('Přechod nastavený na všechny střihy'); };
  const dr=$('clTrDir'); if (dr) dr.onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; ensureClips(); E.clips[selClip].trDir=d.dataset.v; changed(); renderPanel(); PV.currentTime=Math.max(0,E.clipStarts()[selClip]-0.6); };
  const rd=$('clTrD'); if (rd){ rd.oninput=()=>{ ensureClips(); E.clips[selClip].trDur=+rd.value; $('clTrDv').textContent=(+rd.value).toFixed(2)+' s'; }; rd.onchange=()=>{ changed(); PV.currentTime=Math.max(0,E.clipStarts()[selClip]-0.5); }; }
};

// ---------- 3D MIX (kostka) – samostatný mód ----------
// starší nastavení (před verzí, kdy byl shine + 3D hloubka v základu zapnutý) → zapnout na zvýrazněných slovech
function mixDefaults(src){ if (src && !('mixFx' in src)){ E.G.mixShine='hi'; E.G.mixExtrude='hi'; E.G.mixFx=2; } }
// AI najde obličej, ať titulky 3D mixu nejedou přes něj (běží na pozadí, jednou za projekt)
let mixFacing=false;
async function mixFaces(){
  if (mixFacing || E.face) return; mixFacing=true;
  try{ toast('AI hledá obličej, ať titulky nejedou přes něj…'); const v=await auxVideo(); await AI.analyzeFaces(v,()=>{}); freeVideo(v); analysed.face=true; E.mixInvalidate&&E.mixInvalidate(); changed(); toast('Hotovo – titulky se vyhnou obličeji'); }
  catch(e){ console.warn(e); toast('Obličej se nepodařilo najít'); }
  finally{ mixFacing=false; }
}
function pMix(){
  const S=E.G, on=!!S.mix3d;
  return `<div class="mixhead"><svg class="ic grad"><use href="#i-dice"/></svg><div><b>3D mix titulky</b><small>Slova přilétají z hloubky, skládají se pod sebe a mixují písma. Úplně samostatný styl – ostatní nastavení zůstane, jak je.</small></div></div>
  <button class="btn ${on?'':'primary'} big" id="mixOn">${on?'Vypnout 3D mix':'Zapnout 3D mix'}</button>
  ${on?`<button class="btn" id="mixShuffle">${I('refresh','grad')} Zamíchat znovu (jiné rozložení a písma)</button>
  ${slider('Velikost písma','mixSize',50,180,1,'%')}
  ${slider('Výška na videu','mixY',20,80,1,'%')}
  ${slider('Do stran (vlevo ← → vpravo)','mixX',0,100,1,'%')}
  ${slider('Rychlost letu','mixSpeed',40,200,1,'%')}
  <div class="clabel">Barva zvýrazněných slov</div><div class="colors">${color('Nahoře','mixA')}${color('Dole','mixB')}</div>
  ${chips('Shine (lesk přejede přes slovo)','mixShine',[['off','Vypnuto'],['hi','Jen zvýrazněná slova'],['all','Všechna slova']])}
  ${chips('3D hloubka (extrusion)','mixExtrude',[['off','Vypnuto'],['hi','Jen zvýrazněná slova'],['all','Všechna slova']])}`:''}`;
}
binders.mix=()=>{
  $('mixOn').onclick=async()=>{ E.G.mix3d=!E.G.mix3d; E.mixInvalidate&&E.mixInvalidate(); changed(); renderPanel(); toast(E.G.mix3d?'3D mix zapnutý':'3D mix vypnutý – zpátky běžné titulky');
    // AI najde obličej, ať titulky nejedou přes něj
    if (E.G.mix3d && E.G.mixFx!==2){ E.G.mixShine='hi'; E.G.mixExtrude='hi'; E.G.mixFx=2; E.mixInvalidate&&E.mixInvalidate(); renderPanel(); }   // v základu shine + 3D hloubka na zvýrazněných slovech
    if (E.G.mix3d && !E.face) mixFaces();
  };
  if ($('mixShuffle')) $('mixShuffle').onclick=()=>{ E.G.mixSeed=Math.floor(Math.random()*9999)+2; E.mixInvalidate&&E.mixInvalidate(); changed(); };
};

// ---------- TITULKY ----------
function pCaptions(){
  const pg=E.pages.map((p,k)=>{ const ws=[]; for(let i=p.a;i<=p.b;i++){ const w=E.words[i]; ws.push(`<span class="w ${w.em?'em':''}" data-i="${i}">${esc(w.t)}</span>`); }
    const m=E.meta[E.keyOf(p)]; return `<div class="pg ${k===curPage?'cur':''}" data-k="${k}"><div class="t">${fmt(p.s)}</div><div class="ws">${ws.join('')}</div><button class="ed" data-ed="${k}">${I('pencil')}</button></div>`; }).join('');
  return `${trkSection(E.pages[curPage]?(E.meta[E.keyOf(E.pages[curPage])]||{}).trk:null,'page')}
  <div class="btnrow"><button class="btn" id="editTxt">${I('pencil')} Upravit text</button><button class="btn" id="batchBtn">${I('list')} Hromadná úprava</button></div>
  <div class="note">Klepni na slovo = zvýraznit ho jako hlavní (libovolné slovo). Tužka u titulku = upravit text.</div>
  ${chips('Hlavní řádek','mainLine',[['mid','Auto (střed)'],['1','1.'],['2','2.'],['3','3.'],['4','4.'],['word','Nejdelší slovo'],['none','Žádný']])}
  ${toggle('Plnit řádky podle šířky (3 / 2 / 2 slova)','split','fill','words')}
  ${E.G.split==='fill'?slider('Šířka řádku (kolik se vejde)','rowMax',35,85,1,'%'):''}
  ${slider('Max řádků na titulek','maxLines',1,4)}
  ${slider('Max znaků na řádek (0 = auto)','maxChars',0,40)}
  ${slider('Slov na titulek (auto)','wpp',1,8)}
  ${toggle('Interpunkce','punct')}
  ${toggle('Velké písmeno v hlavním řádku (slova od 3 písmen)','capMain3')}
  <div class="btnrow"><button class="btn" id="dictBtn">${I('book')} Slovník oprav</button><button class="btn" id="resetOne">${I('reset')} Zrušit vlastní styl</button></div>
  <div class="btnrow"><button class="btn" id="layerBtn">${E.pages[curPage]&&E.pages[curPage].layer?I('arrow-up')+' Vybraný titulek do hlavní vrstvy':I('arrow-down')+' Vybraný titulek do vrstvy pod'}</button></div>
  <div class="note">Na timeline můžeš titulek i chytit a stáhnout dolů do 2. vrstvy (nebo zpátky nahoru).</div>
  <div class="pglist" id="pglist">${pg}</div>`;
}
binders.captions=()=>{
  $('editTxt').onclick=()=>openInline(curPage);
  $('batchBtn').onclick=openBatch;
  $('dictBtn').onclick=()=>openSheet('sheetDict');
  $('resetOne').onclick=()=>{ const p=E.pages[curPage]; if (p){ const m=pageMeta(p); delete m.own; changed(); renderPanel(); toast('Titulek má zase společný styl'); } };
  $('layerBtn').onclick=()=>{ const p=E.pages[curPage]; if (p) setLayer(curPage, p.layer?0:1); };
  trkBind(()=>{ const p=E.pages[curPage]; return p&&(E.meta[E.keyOf(p)]||{}).trk; }, id=>{ const p=E.pages[curPage]; if (p){ const m=pageMeta(p); if (id) m.trk=id; else delete m.trk; } }, 'page');
  $('pglist').onclick=e=>{
    const ed=e.target.closest('[data-ed]'); if (ed){ selectPage(+ed.dataset.ed); openInline(+ed.dataset.ed); return; }
    const w=e.target.closest('.w'); if (w){ const W=E.words[+w.dataset.i]; W.em=!W.em; w.classList.toggle('em',W.em); changed(); }
    const pg=e.target.closest('.pg'); if (pg) selectPage(+pg.dataset.k);
  };
};
function selectPage(k,seek=true){ curPage=k; const p=E.pages[k]; if (p && seek){ vid.pause(); PV.currentTime=Math.min(p.e-0.02,p.s+0.45); } markCur(); if (panel!=='captions' && panel!=='templates') renderPanel(); }
function markCur(){
  document.querySelectorAll('#pglist .pg').forEach(el=>el.classList.toggle('cur',+el.dataset.k===curPage));
  document.querySelectorAll('#trC .cb').forEach(el=>el.classList.toggle('cur',+el.dataset.k===curPage));
  const c=document.querySelector('#pglist .pg.cur'); if (c && panel==='captions') c.scrollIntoView({block:'nearest'});
}
// --- úprava textu titulku ---
function pageText(p){ const a=[]; for(let i=p.a;i<=p.b;i++) a.push(E.G.punct?E.words[i].raw:E.words[i].t); return a.join(' '); }
// text titulku po řádcích tak, jak je teď vidět v náhledu (každý řádek = nový řádek v bublině)
function pageLines(p){ const wt=i=>E.G.punct?(E.words[i].raw||E.words[i].t):E.words[i].t;
  let g=null; try{ g=E.groupsOf(p,E.styleOf(p)); }catch(e){}
  if (!g || !g.length) return pageText(p);
  return g.map(x=>x.ids.map(wt).join(' ')).join('\n'); }
function setPageText(k,text){
  const p=E.pages[k]; if (!p) return;
  // řádky z bubliny: Enter = nový řádek v titulku
  const rows=text.split(/\n/).map(r=>r.trim().split(/\s+/).filter(Boolean)).filter(r=>r.length);
  const list=rows.flat(), starts=new Set(); { let n=0; rows.forEach((r,j)=>{ if (j) starts.add(n); n+=r.length; }); }
  const old=E.words.slice(p.a,p.b+1);
  if (!list.length){ E.words.splice(p.a,p.b-p.a+1); return; }
  const key=old[0].id, meta=E.meta[key];
  let neu;
  if (list.length===old.length) neu=old.map((w,i)=>({...w,raw:list[i],t:E.stripPunct(list[i])||list[i]}));
  else { neu=E.spread(list,old[0].s,old[old.length-1].e); neu[0].id=key; }   // stejné id → titulek si nechá svůj styl a časy
  neu.forEach((w,i)=>{ w.nl=starts.has(i); });
  neu[0].br=true;
  E.words.splice(p.a,p.b-p.a+1,...neu);
  const nx=E.words[p.a+neu.length]; if (nx) nx.br=true;          // hranice titulku zůstanou, jak jsou
  E.meta[key]={...(meta||{}), ml:true};
}
let inlineK=-1;
function openInline(k){
  const p=E.pages[k]; if(!p) return; vid.pause(); inlineK=k; inlineOpen=true;
  PV.currentTime=Math.min(p.e-0.02,p.s+0.45);
  const ta=$('inlineEdit'); ta.value=pageLines(p); ta.rows=Math.max(2,Math.min(5,ta.value.split('\n').length+1)); ta.classList.remove('hidden'); $('inlineBar').classList.remove('hidden'); ta.focus(); ta.select();
}
function closeInline(save){
  if (save && inlineK>=0){ setPageText(inlineK,$('inlineEdit').value); changed(true); renderPanel(); }
  $('inlineEdit').classList.add('hidden'); $('inlineBar').classList.add('hidden'); inlineOpen=false; inlineK=-1;
}
$('inlineOk').onclick=()=>closeInline(true); $('inlineCancel').onclick=()=>closeInline(false);
// Enter = nový řádek (rozdělí titulek na řádky); uložit = Hotovo (na počítači i Ctrl/Cmd + Enter)
$('inlineEdit').onkeydown=e=>{ if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); closeInline(true); } if (e.key==='Escape') closeInline(false); };
$('inlineEdit').oninput=e=>{ const ta=e.target; ta.rows=Math.max(2,Math.min(5,ta.value.split('\n').length+1)); };
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
  return `${scopeHTML()}${subHTML('templates',[['trending','Styly'],['custom',I('heart')+' Vlastní']])}
  <div class="tplgrid" id="tplgrid">${list.map(([k,t])=>tplCard(k,t,S.style===k?' on':'').replace('</div>',(cat==='custom'?`<span class="x" data-del="${k}">${I('x')}</span>`:'')+'</div>')).join('')||'<div class="muted">Zatím nemáš vlastní šablony. V záložce Styl ulož srdíčkem.</div>'}</div>
  <div class="btnrow"><button class="btn" id="setDefault">${I('star','grad')} Tento vzhled jako výchozí</button>${lsGet('efk_default',null)?'<button class="btn" id="clrDefault">'+I('reset')+' Zpět na Styl 1</button>':''}</div>
  ${lsGet('efk_default',null)?'<div class="btnrow"><button class="btn small" id="copyDefault">'+I('copy')+' Zkopírovat nastavení vzhledu</button></div>':''}
  <div class="note">Výchozí vzhled se použije u každého nového videa.</div>
  <div class="clabel">Rychlé efekty</div>
  <div class="chips" id="quickFx">
    <div class="chip ${S.fxFlicker?'on':''}" data-k="fxFlicker">Flicker</div>
    <div class="chip ${S.anim==='squish'?'on':''}" data-k="squish">Squish</div>
    <div class="chip ${S.fxShine?'on':''}" data-k="fxShine">Shine</div>
    <div class="chip ${S.fxShake?'on':''}" data-k="fxShake">Shake</div>
    <div class="chip ${S.fxWiggle?'on':''}" data-k="fxWiggle">Wiggle</div>
  </div>`;
}
function styleSet(){ const S=cur(), set={}; for (const k of Object.keys(E.G)) if (!E.GLOBAL_ONLY.has(k) && !['posX','posY','style','behind'].includes(k)) set[k]=S[k]; return set; }
binders.templates=()=>{
  $('setDefault').onclick=()=>{ lsSet('efk_default',styleSet()); renderPanel(); toast('Hotovo – nová videa budou vypadat takhle'); };
  if ($('clrDefault')) $('clrDefault').onclick=()=>{ lsSet('efk_default',null); renderPanel(); toast('Nová videa budou zase ve Stylu 1'); };
  if ($('copyDefault')) $('copyDefault').onclick=async()=>{ const t='EFEKTIVE-STYL '+JSON.stringify(lsGet('efk_default',{})); try{ await navigator.clipboard.writeText(t); toast('Nastavení zkopírované'); }catch(e){ prompt('Zkopíruj si nastavení:',t); } };
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
  let h=`${scopeHTML()}${subHTML('style',[['color','Barva'],['font','Font'],['text','Text'],['shadow','Stín'],['transform','3D a tvar']],'<div class="sp"></div><div class="hrt" id="saveTpl" title="Uložit jako vlastní šablonu">'+I('heart','grad')+'</div>')}`;
  if (st==='color'){
    h+=`<div class="colors">${color('Text','cText')}${color('Zvýraznění 1','c1')}${color('2.','c2')}${color('3.','c3')}${color('4.','c4')}</div>
    <div class="note">Zvýraznění 1–4 se střídá po titulcích (1. titulek = 1. barva…), když je přechod vypnutý.</div>
    ${toggle('Vedlejší řádky s jemným přelivem do šeda','textGrad')}
    ${S.textGrad?`<div class="colors">${color('Vedlejší nahoře','cText')}${color('Vedlejší dole','cText2')}</div>`:''}
    ${toggle('Dvoubarevný přechod na hlavním řádku','grad')}
    ${S.grad?`<div class="colors">${color('Barva A','gA')}${color('Barva B','gB')}</div>${chips('Směr přechodu','gradDir',[['v',I('arrows-v')+' Svisle'],['h',I('arrows-h')+' Vodorovně'],['d',I('arrow-diag')+' Šikmo']])}`:''}
    ${toggle('Každý N-tý titulek jinou barvou','altOn')}
    ${S.altOn?`<div class="colors">${color('Barva A','altA')}${color('Barva B','altB')}</div>${slider('Každý … titulek','altEvery',2,6)}`:''}
    ${toggle('Negativ (inverzní písmo)','negativ')}
    ${slider('Záře okolo hlavního slova','glow',0,100)}
    ${chips('Záře svítí','glowMode',[['always','Pořád'],['entrance','Jen při nástupu (problikne)']])}
    <div class="clabel">Barva z videa</div><button class="btn small" id="suggestCol">${I('wand','grad')} Navrhnout barvu podle videa</button><div class="sugg" id="suggBox"></div>`;
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
    ${slider('Mezera mezi slovy (%)','wordGap',40,260,5,'%')}
    ${slider('Průhlednost textu','opacity',10,100,1,'%')}`;
  } else if (st==='shadow'){
    const cs=S.shadowSize===0?'none':S.cShadow;
    h+=`<div class="clabel">Barva stínu</div><div class="swatches" id="shSw">${SHADOWS.map(([v,c])=>`<div class="swatch ${v==='none'?'none':''} ${cs===v?'on':''}" data-v="${v}" style="${c?'background:'+c:''}"></div>`).join('')}<div class="swatch rainbow ${!SHADOWS.some(s=>s[0]===cs)?'on':''}"><input type="color" id="shCustom" value="${S.cShadow}"></div></div>
    <div class="chips" id="shSize"><div class="chip ${S.shadowSize<=18&&S.shadowSize>0?'on':''}" data-v="15">Malý</div><div class="chip ${S.shadowSize>18&&S.shadowSize<=35?'on':''}" data-v="25">Střední</div><div class="chip ${S.shadowSize>35?'on':''}" data-v="50">Velký</div></div>
    ${slider('Velikost (rozmazání)','shadowSize',0,100)}
    ${slider('Průhlednost','shadowA',0,100,1,'%')}
    ${slider('Vzdálenost stínu','shadowDist',0,40)}
    ${slider('3D hloubka písma (extrude)','extrude',0,100)}
    ${chips('Styl 3D hloubky','extrudeStyle',[['light','Světlá'],['dark','Tmavá']])}`;
  } else if (st==='transform'){
    h+=`${slider('Mezery mezi písmeny','track',-20,12,0.5)}
    ${S.trackEm!=null?slider('Mezery mezi písmeny – hlavní řádek','trackEm',-24,12,0.5):''}
    ${slider('Zúžení písma','cond',60,100,1,'%')}
    ${slider('Řádkování','gap',30,140,1,'%')}
    <div class="clabel">Řádky zvlášť</div>
    <div class="note">Každý řádek posuneš samostatně – ostatní zůstanou na místě.</div>
    <div class="rowsep"><b>1. řádek (horní)</b>${slider('Nahoru / dolů','rowDy1',-100,100,1,'')}${slider('Doleva / doprava','rowDx1',-30,30,0.5,'')}</div>
    <div class="rowsep"><b>2. řádek (hlavní)</b>${slider('Nahoru / dolů','rowDy2',-100,100,1,'')}${slider('Doleva / doprava','rowDx2',-30,30,0.5,'')}</div>
    <div class="rowsep"><b>3. řádek (spodní)</b>${slider('Nahoru / dolů','rowDy3',-100,100,1,'')}${slider('Doleva / doprava','rowDx3',-30,30,0.5,'')}</div>
    <button class="btn small" id="rowReset">${I('reset')} Vrátit řádky na původní místo</button>
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
  if ($('rowReset')) $('rowReset').onclick=()=>{ setMany({rowDy1:0,rowDy2:0,rowDy3:0,rowDx1:0,rowDx2:0,rowDx3:0}); renderPanel(); };
  $('saveTpl').onclick=()=>{
    const name=prompt('Název vlastní šablony:','Moje šablona '+(Object.keys(customTemplates()).length+1)); if(!name) return;
    const S=cur(), set={}; for (const k of Object.keys(E.G)) if (!E.GLOBAL_ONLY.has(k) && !['posX','posY','style','behind'].includes(k)) set[k]=S[k];
    const c=customTemplates(); const key='c'+Date.now(); c[key]={name,cat:'custom',set,pv:`<span style="font-family:${esc(S.fontMain)};font-weight:${S.wMain}">Tvůj</span><br><b style="font-family:${esc(S.fontEm)};font-weight:${S.wEm};${S.grad?`background:linear-gradient(${S.gA},${S.gB});-webkit-background-clip:text;color:transparent`:`color:${S.c1}`}">Styl</b>`};
    lsSet('efk_custom',c); renderHomeTpl(); toast('Uloženo do Vlastních šablon');
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
  const v=await auxVideo();
  const r=await AI.suggestColors(v); freeVideo(v);
  box.innerHTML=r.list.map((c,i)=>`<div data-i="${i}"><span style="background:linear-gradient(${c.gA},${c.gB});-webkit-background-clip:text;background-clip:text;color:transparent">${esc(c.name)}</span></div>`).join('');
  box.onclick=e=>{ const d=e.target.closest('[data-i]'); if(!d) return; const c=r.list[+d.dataset.i]; setMany({grad:true,gA:c.gA,gB:c.gB}); renderPanel(); toast('Barva použitá'); };
}

// ---------- POHYB A EFEKTY ----------
function pMotion(){
  const S=cur();
  const by=S.enterBy||(S.wordByWord?'word':'page');
  const st=['in','out','fx'].includes(sub.motion)?sub.motion:'in'; sub.motion=st;
  let h=`${scopeHTML()}${subHTML('motion',[['in','Příjezd'],['out','Odchod'],['fx','Efekty (shine, flicker…)']])}`;
  if (st==='in'){
    h+=`<div class="clabel">Co přijíždí</div>
    <div class="chips" id="enterBy">
      <div class="chip ${by==='word'?'on':''}" data-v="word">Po jednom slově</div>
      <div class="chip ${by==='line'?'on':''}" data-v="line">Celý řádek</div>
      <div class="chip ${by==='page'?'on':''}" data-v="page">Celý titulek</div>
    </div>
    <div class="note">${by==='word'?'Každé slovo přijede, až ho řekneš.':by==='line'?'Celý řádek přijede najednou – nic nedojíždí pozdě.':'Všechny řádky přijedou společně.'}</div>
    ${chips('Odkud přijíždí','enter',[['none','Bez letu'],['bottom',I('arrow-up')+' Zdola'],['top',I('arrow-down')+' Shora'],['left',I('arrow-right')+' Zleva'],['right',I('arrow-left')+' Zprava']])}
    ${S.enter!=='none'?chips('Dojezd','ease',[['silk','Hedvábně'],['smooth','Plynule'],['swing','Houpnutí'],['shake','Zatřesení'],['bounce','Odraz'],['elastic','Pružina']])+slider('Délka příjezdu','enterDur',10,120,1,'')+slider('Vzdálenost příjezdu','enterDist',3,60,1,'%'):''}
    ${chips('Animace nástupu','anim',[['base','Prolnutí slov'],['block','Plynulý blok'],['squish','Squish'],['pop','Pop'],['blur','Rozostření'],['smooth','Jemně'],['fade','Prolnutí'],['none','Žádná']])}`;
  } else if (st==='out'){
    h+=`${toggle('Plynulý odchod','fadeOut')}
    ${S.fadeOut?`<div class="clabel">Jak titulek zmizí</div><div class="chips" id="exitSt"><div class="chip ${S.exitScale!=null?'on':''}" data-v="fast">Rychlé zmenšení</div><div class="chip ${S.exitScale==null?'on':''}" data-v="soft">Jemné zhasnutí</div></div>`:'<div class="note">Titulek zmizí okamžitě.</div>'}`;
  } else {
    h+=`${toggle('Shine – světlo přejede přes hlavní slovo','fxShine')}
    ${S.fxShine?chips('Lesk u','shineEvery',[['1','Každého'],['2','Každého 2.'],['3','Každého 3.'],['4','Každého 4.'],['rand','Náhodně']])+slider('Rychlost lesku','shineSpeed',0,100):''}
    ${toggle('Flicker – problikne při nástupu','fxFlicker')}
    ${toggle('Shake – zatřese při nástupu','fxShake')}
    ${toggle('Wiggle – jemné vlnění','fxWiggle')}
    ${S.fxWiggle||S.fxShake?slider('Síla wiggle / shake','wiggle',0,100):''}`;
  }
  return h;
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
binders.motion=(function(prev){ return ()=>{ prev&&prev(); const eb=$('enterBy'); if (eb) eb.onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; setVal('enterBy',d.dataset.v); renderPanel(); }; const x=$('exitSt'); if (x) x.onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; if (c.dataset.v==='fast') setMany({exitScale:0.6,exitDur:0.1}); else setMany({exitScale:null,exitDur:0.3}); renderPanel(); }; }; })(binders.motion);
binders.sfx=()=>{ $('sfxList').onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; playSfx(c.dataset.v); setVal('sfx',c.dataset.v); $('sfxList').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c)); }; };

// ---------- OVERLAY ----------
const OVANIM=[['standard','Standard'],['3d','3D'],['carousel3d','3D Carousel'],['circle','Circle Carousel'],['cards','Cards'],['pop','Pop In'],['slideR','Slide doprava'],['slideL','Slide doleva'],['slideU','Slide nahoru'],['slideD','Slide dolů']];
function pOverlay(){
  const o=E.overlays.find(x=>x.id===selOv);
  let h=`<div class="btnrow"><button class="btn" id="ovImg">${I('image')} Přidat obrázek / video</button></div>
  <div class="btnrow"><button class="btn" id="ovFull">${I('layers','grad')} Překrýt video novou verzí</button></div>
  <div class="note">Když klient chce něco ve videu změnit: nahraj upravenou verzi záběru a ona se položí přes původní video od místa hlavy – titulky zůstanou, jak jsou.</div>
  <div class="row"><span>Wiggle na všechny overlaye</span><input type="checkbox" class="sw" id="ovWigAll" ${E.overlays.length&&E.overlays.every(x=>x.wiggle)?'checked':''}></div>`;
  if (o && o.full){
    h+=`<div class="clabel">Překrytí videa · ${fmt(o.s)}–${fmt(o.e)}</div>
    <div class="note">Nová verze záběru přes celý obraz, pod titulky, bez animace i bez wiggle. Začátek a konec posuneš na časové ose.</div>
    <div class="btnrow"><button class="btn" id="ovFullHere">${I('pin')} Začít v místě hlavy</button><button class="btn" id="ovDel">${I('trash')} Smazat</button></div>`;
  } else if (o){
    h+=`<div class="clabel">Vybraný overlay – animace</div><div class="chips" id="ovAnim">${OVANIM.map(([v,l])=>`<div class="chip ${o.anim===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>
    <div class="row"><span>Wiggle</span><input type="checkbox" class="sw" id="ovWig" ${o.wiggle?'checked':''}></div>
    ${o.wiggle?`<label class="ctl"><div class="lb"><span>Síla wiggle</span><span>${o.wigAmt??50}</span></div><input type="range" id="ovWA" min="0" max="200" value="${o.wigAmt??50}"></label>
    <label class="ctl"><div class="lb"><span>Rychlost wiggle</span><span>${o.wigSpd??50}</span></div><input type="range" id="ovWS" min="5" max="200" value="${o.wigSpd??50}"></label>`:''}
    <div class="clabel">Vrstva</div>
    <div class="chips" id="ovLayer"><div class="chip ${!E.ovAbove(o)?'on':''}" data-v="0">Pod titulky</div><div class="chip ${E.ovAbove(o)?'on':''}" data-v="1">Nad titulky</div></div>
    <button class="btn small" id="ovLayersOpen">${I('layers')} Všechny vrstvy (přetáhni prstem)</button>
    <label class="ctl"><div class="lb"><span>Velikost</span><span>${o.w}%</span></div><input type="range" id="ovW" min="5" max="100" value="${o.w}"></label>
    <label class="ctl"><div class="lb"><span>Rotace</span><span>${o.rot||0}°</span></div><input type="range" id="ovR" min="-180" max="180" value="${o.rot||0}"></label>
    <div class="clabel">Vzhled</div>
    ${oslider('Zaoblení rohů','ovRad',0,100,o.rad||0,' %')}
    ${oslider('Rámeček – tloušťka','ovStW',0,100,o.stW||0)}
    ${(o.stW||0)>0?colorRow('Barva rámečku','stC',o):''}
    ${oslider('Stín – síla','ovShA',0,100,o.shA||0)}
    ${(o.shA||0)>0?oslider('Stín – vzdálenost','ovShD',0,100,o.shD??30):''}
    <div class="clabel">3D náklon</div>
    ${oslider('Náklon do strany','ovTY',-70,70,o.tiltY||0,'°')}
    ${oslider('Náklon nahoru / dolů','ovTX',-70,70,o.tiltX||0,'°')}
    ${(o.tiltX||o.tiltY)?oslider('Perspektiva','ovPs',0,100,o.persp??55):''}
    ${trkSection(o.trk,'ov')}
    <div class="btnrow"><button class="btn" id="ovDel">${I('trash')} Smazat overlay</button></div>
    <div class="note">Na videu ho chytni a posuň. Na časové ose posuneš začátek a konec.</div>`;
  } else h+=`<div class="note">Vyber overlay klepnutím na fialový blok v časové ose nebo na videu.</div>`;
  return h;
}
binders.overlay=()=>{
  $('ovImg').onclick=()=>$('ovIn').click();
  $('ovWigAll').onchange=e=>{ E.overlays.forEach(o=>{ if (!o.full) o.wiggle=e.target.checked; }); changed(); renderPanel(); };
  $('ovFull').onclick=()=>$('ovFullIn').click();
  const o=E.overlays.find(x=>x.id===selOv); if (!o) return;
  if (o.full){
    $('ovFullHere').onclick=()=>{ const d=o.e-o.s; o.s=PV.currentTime; o.e=Math.min(PV.duration,o.s+d); changed(); renderPanel(); renderTimeline(); };
    $('ovDel').onclick=()=>{ E.overlays=E.overlays.filter(x=>x!==o); selOv=null; changed(); renderPanel(); renderTimeline(); };
    return;
  }
  $('ovAnim').onclick=e=>{ const c=e.target.closest('.chip'); if(!c) return; o.anim=c.dataset.v; changed(); renderPanel(); PV.currentTime=o.s; };
  $('ovWig').onchange=e=>{ o.wiggle=e.target.checked; changed(); renderPanel(); };
  for (const [id,key] of [['ovWA','wigAmt'],['ovWS','wigSpd']]){ const el=$(id); if (!el) continue; el.oninput=e=>{ o[key]=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=o[key]; }; el.onchange=()=>changed(); }
  $('ovLayer').onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; const up=d.dataset.v==='1', zs=E.overlays.filter(x=>x!==o&&!x.full).map(E.ovZ);
    o.z = up ? Math.max(E.capZ, ...zs.filter(z=>z>E.capZ))+1 : Math.min(E.capZ, ...zs.filter(z=>z<E.capZ))-1; o.above=up; changed(); renderPanel(); toast(up?'Overlay je nad titulky':'Titulky jsou nad overlayem'); };
  $('ovLayersOpen').onclick=()=>openLayers();
  $('ovW').oninput=e=>{ o.w=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=o.w+'%'; }; $('ovW').onchange=()=>changed();
  $('ovR').oninput=e=>{ o.rot=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=o.rot+'°'; }; $('ovR').onchange=()=>changed();
  // vzhled overlaye: rohy, rámeček, stín, 3D náklon (posuvníky, které mění i obsah panelu, ho po puštění překreslí)
  for (const [id,key,unit,re] of [['ovRad','rad',' %'],['ovStW','stW','',1],['ovShA','shA','',1],['ovShD','shD',''],['ovTY','tiltY','°',1],['ovTX','tiltX','°',1],['ovPs','persp','']]){
    const el=$(id); if (!el) continue; const was=o[key];
    el.oninput=e=>{ o[key]=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=o[key]+unit; };
    el.onchange=()=>{ changed(); if (re && (!was)!==(!o[key])) renderPanel(); };
  }
  document.querySelectorAll('#panel .objcols').forEach(row=>{ row.onclick=e=>{ const d=e.target.closest('[data-c]'); if(!d) return; o[row.dataset.k]=d.dataset.c; changed(); renderPanel(); }; const inp=row.querySelector('input[type=color]'); if (inp){ inp.oninput=e=>{ o[inp.dataset.k]=e.target.value; inp.parentElement.style.background=e.target.value; }; inp.onchange=()=>{ changed(); renderPanel(); }; } });
  $('ovDel').onclick=()=>{ E.overlays=E.overlays.filter(x=>x!==o); selOv=null; changed(); renderPanel(); };
  trkBind(()=>o.trk, id=>{ if (id) o.trk=id; else delete o.trk; }, 'ov');
};
async function loadAsset(id,blob){
  const url=URL.createObjectURL(blob); let el;
  if (blob.type.startsWith('video')){ el=document.createElement('video'); el.src=url; el.muted=true; el.loop=true; el.playsInline=true; el.preload='auto'; await new Promise(r=>{ el.onloadeddata=r; el.onerror=r; }); el.play().catch(()=>{}); }
  else { el=new Image(); el.src=url; await new Promise(r=>{ el.onload=r; el.onerror=r; }); }
  ovAssets[id]={blob,el,type:blob.type}; return el;
}
// překrytí videa novou verzí (náhrada úseku): video přes celý obraz, synchronizované s časem
$('ovFullIn').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; vid.pause();
  const id='a'+Date.now(); const el=await loadAsset(id,f); el.loop=false; el.pause();
  const t=PV.currentTime, d=el.duration||5;
  addOverlay({asset:id,src:el,full:true,sync:true,s:t,e:Math.min(PV.duration,t+d),x:50,y:50,w:100,anim:'none',wiggle:false,above:false});
  toast('Nová verze záběru položená přes video od místa hlavy'); };
// synchronizace překrytí videa s časem (přehrávání i posouvání)
function syncOverlays(t,playing){
  for (const o of E.overlays){ const el=o.src; if (!o.sync || !el || el.tagName!=='VIDEO') continue;
    if (t<o.s || t>o.e){ if (!el.paused) el.pause(); continue; }
    const want=t-o.s;
    if (playing){ if (el.paused) el.play().catch(()=>{}); if (Math.abs(el.currentTime-want)>0.15) el.currentTime=want; }
    else { if (!el.paused) el.pause(); if (Math.abs(el.currentTime-want)>0.03 && !el.seeking) el.currentTime=want; }
  } }
$('ovIn').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; const id='a'+Date.now(); const el=await loadAsset(id,f); addOverlay({asset:id,src:el}); };
function addOverlay(o){
  const t=PV.currentTime; const ov={id:Date.now()%1e9, s:t, e:Math.min(PV.duration,t+2), x:50, y:35, w:o.emoji?22:40, rot:0, anim:'pop', wiggle:false, above:false, ...o};
  E.overlays.push(ov); selOv=ov.id; changed(); renderPanel(); toast('Overlay přidaný – posuň ho prstem');
}
function drawOvSel(){
  const o=E.overlays.find(x=>x.id===selOv); if (!o) return; const t=PV.currentTime; if (t<o.s||t>o.e) return;
  const b=E.overlayBox(o), c=cv.getContext('2d'); c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle='#a78bfa'; c.lineWidth=Math.max(2,cv.width*0.003); c.setLineDash([8,6]);
  c.strokeRect(b.cx-b.w/2,b.cy-b.h/2,b.w,b.h); c.restore();
}

// ---------- AI ----------
function pAI(){
  const S=cur();
  return `${scopeHTML()}
  <div class="clabel">${I('pin','grad')} Pozice pod obličej</div>
  <div class="note">Najde obličej v každém titulku a dá titulek těsně pod bradu – nikdy přes tvář.</div>
  <div class="row"><span>Uhnout do strany, když je obličej mimo střed</span><input type="checkbox" class="sw" id="faceDodge" ${E.G.faceDodgeX?'checked':''}></div>
  <button class="btn" id="aiFace">${analysed.face?I('refresh')+' Znovu umístit pod obličej':'Umístit titulky pod obličej'}</button>
  <div class="clabel">${I('user','grad')} Text za postavou</div>
  <div class="note">Titulek bude za člověkem (postava zakryje písmo), jako v SA Captions.</div>
  ${toggle('Text za postavou','behind','on','off')}
  <div class="clabel">${I('palette','grad')} Barva z videa</div>
  <button class="btn" id="aiColor">Navrhnout barvy podle videa</button><div class="sugg" id="suggBox" style="margin-top:8px"></div>
  <div class="clabel">${I('ruler','grad')} Náklon podle scény</div>
  <div class="note">Najde linie v záběru (regál, stůl, okno) a nakloní titulek ve 3D stejně jako prostor.</div>
  <button class="btn" id="aiTilt">${scope==='all'?'Sladit náklon všech titulků se scénou':'Sladit náklon tohoto titulku'}</button>
  <div class="clabel">${I('ban','grad')} Úseky bez titulků</div>
  <div class="note">Kde je grafika nebo logo na konci, titulky se nezobrazí a slova se tam vynechají.</div>
  <div class="btnrow"><button class="btn" id="zHere">＋ 2 s od přehrávací hlavy</button><button class="btn" id="zEnd">＋ Odsud do konce (logo)</button></div>
  <div class="clabel">${I('shield','grad')} Ochrana proti uříznutí</div>
  <div class="note">Je zapnutá vždy: dlouhý titulek se sám zmenší, aby byl celý vidět i při 3D náklonu.</div>`;
}
binders.ai=()=>{
  $('faceDodge').onchange=e=>{ E.G.faceDodgeX=e.target.checked; if (analysed.face){ E.applyFacePositions(); } changed(); };
  $('aiFace').onclick=async()=>{
    const b=$('aiFace'); b.disabled=true; const v=await auxVideo();
    try{ await AI.analyzeFaces(v,p=>{ b.textContent='Hledám obličej… '+Math.round(p*100)+' %'; }); for (const k in E.meta) if (E.meta[k].own) delete E.meta[k].own._manualPos; const n=E.applyFacePositions(); analysed.face=true; changed(); toast(`Hotovo – ${n} titulků pod obličejem`); }
    catch(e){ toast('Nepovedlo se: '+e.message); }
    freeVideo(v); renderPanel();
  };
  // při zapnutí „text za postavou“ nejdřív oddělit postavu
  document.querySelectorAll('#panel .sw').forEach(el=>{ if (el.id!=='faceDodge') el.onchange=async()=>{
    if (el.checked && !AI.masks.length){ el.disabled=true; toast('Odstraňuji pozadí…'); const v=await auxVideo();
      try{ await AI.analyzePerson(v,p=>{ toast('Odstraňuji pozadí… '+Math.round(p*100)+' %'); }); analysed.person=true; }catch(e){ toast('Nepovedlo se: '+e.message); el.checked=false; el.disabled=false; freeVideo(v); return; } freeVideo(v); el.disabled=false; }
    else AI.useMasks();
    setVal('behind',el.checked?'on':'off'); }; });
  $('aiColor').onclick=suggestColors;
  $('aiTilt').onclick=async()=>{
    const b=$('aiTilt'); b.disabled=true; const v=await auxVideo();
    const list = scope==='all' ? E.pages.map((p,k)=>k) : [curPage];
    for (const k of list){ const p=E.pages[k], S=E.styleOf(p); b.textContent=`Měřím linie… ${k+1}/${E.pages.length}`;
      const r=await AI.suggestTilt(v,(p.s+p.e)/2,S.posY); const m=pageMeta(p); m.own=m.own||{}; m.own.tilt=r.tilt*r.sign*(S.tilt<0?-1:1)||S.tilt; m.own.tiltAlt=false; m.own.rot=r.rot; }
    freeVideo(v); changed(); renderPanel(); toast('Náklon sladěný se scénou');
  };
  $('zHere').onclick=()=>addZone(PV.currentTime,Math.min(PV.duration,PV.currentTime+2));
  $('zEnd').onclick=()=>addZone(PV.currentTime,PV.duration);
};
function addZone(s,e){ E.zones.push({s,e,label:'Bez titulků'}); changed(true); toast('Úsek bez titulků přidaný'); }
$('zoneAdd').onclick=()=>addZone(PV.currentTime,Math.min(PV.duration,PV.currentTime+2));

// ================= ČASOVÁ OSA =================
let pps=70, tlSync=false, tlTouches=0;
document.addEventListener('touchstart',e=>{ tlTouches=e.touches.length; },{passive:true,capture:true}); document.addEventListener('touchend',e=>{ tlTouches=e.touches.length; },{passive:true,capture:true});
const tlPad=()=>$('tlScroll').clientWidth/2;
function renderTimeline(){
  if (!PV.duration) return;
  const pad=tlPad(), W=PV.duration*pps;
  $('tlIn').style.width=(W+pad*2)+'px';
  const X=t=>pad+t*pps;
  const cbHtml=L=>E.pages.map((p,k)=>{ if ((p.layer|0)!==L) return ''; const m=E.meta[E.keyOf(p)]; const txt=[]; for(let i=p.a;i<=p.b;i++) txt.push(E.words[i].t);
    return `<div class="cb ${k===curPage?'cur':''} ${m&&m.own&&Object.keys(m.own).some(x=>x!=='posY'&&x!=='posX'&&x!=='_manualPos')?'own':''}" data-k="${k}" style="left:${X(p.s)}px;width:${Math.max(6,(p.e-p.s)*pps-2)}px"><span class="hl"></span>${esc(txt.join(' '))}<span class="hr"></span></div>`; }).join('');
  $('trC').innerHTML=cbHtml(0); $('trC2').innerHTML=cbHtml(1);
  $('trZ').innerHTML=E.zones.map((z,i)=>`<div class="zb" data-z="${i}" style="left:${X(z.s)}px;width:${Math.max(6,(z.e-z.s)*pps)}px"><span class="hl"></span>${I('ban')} ${esc(z.label||'Bez titulků')}<span class="zx" data-zx="${i}">${I('x')}</span><span class="hr"></span></div>`).join('');
  $('trO').innerHTML=E.overlays.map(o=>`<div class="ob ${o.id===selOv?'cur':''}" data-o="${o.id}" style="left:${X(o.s)}px;width:${Math.max(6,(o.e-o.s)*pps)}px"><span class="hl"></span>${I('image')} ${OVANIM.find(a=>a[0]===o.anim)?.[1]||''}<span class="hr"></span></div>`).join('');
  renderVideoTrack();
  if (panel==='captions'){ /* seznam se obnoví při renderPanel */ }
  followTimeline(PV.currentTime,true);
}
let thumbsFor=null;
// pomocná videa (náhledy, AI): iPhone zvládne jen pár přehrávačů naráz → po použití je vždy uvolnit
function auxVideo(){ return new Promise(res=>{ const v=document.createElement('video'); v.muted=true; v.playsInline=true; v.setAttribute('playsinline',''); v.preload='auto';
  let ok=false; const done=()=>{ if(!ok){ ok=true; res(v); } }; v.onloadedmetadata=done; v.onloadeddata=done; v.onerror=done; setTimeout(done,8000); v.src=videoURL; v.load(); }); }
function freeVideo(v){ try{ v.pause(); v.removeAttribute('src'); v.load(); }catch(e){} }
let thumbImg=[];
async function thumbs(){
  if (thumbsFor===videoURL) return; thumbsFor=videoURL; thumbImg=[]; renderVideoTrack();
  const url=videoURL; let i=0, n=null;
  while (thumbsFor===url){
    // přehrává se → pomocné video vůbec nedržet (iPhone pak hlavní video nestíhá dekódovat)
    while (!vid.paused && thumbsFor===url) await new Promise(r=>setTimeout(r,500));
    if (thumbsFor!==url) return;
    const v=await auxVideo();
    try{
      if (n==null) n=Math.max(1,Math.ceil(v.duration||0));
      for (; i<n; i++){
        if (thumbsFor!==url || !vid.paused) break;
        await AI.seek(v,i+0.01); if (!vid.paused) break;
        thumbImg[i]=AI.grab(v,90).toDataURL('image/jpeg',0.6); if (i%3===2) renderVideoTrack();
      }
    } finally { freeVideo(v); renderVideoTrack(); }
    if (n!=null && i>=n) return;
  }
}
// stopa videa: úseky (po střihu) s náhledy + značky přechodů mezi nimi
let selClip=-1, selKf=-1;
function renderVideoTrack(){
  const tr=$('trV'); if (!tr) return; const pad=tlPad(), L=E.clipList(), st=E.clipStarts();
  tr.style.paddingLeft='0';
  tr.innerHTML=L.map((c,k)=>{ const x=pad+st[k]*pps, w=Math.max(4,(c.e-c.s)*pps-2); let im='';
    for (let sec=Math.floor(c.s); sec<Math.ceil(c.e); sec++){ if (thumbImg[sec]) im+=`<img src="${thumbImg[sec]}" style="left:${(sec-c.s)*pps}px;width:${pps}px">`; }
    return `<div class="vb ${k===selClip?'cur':''}" data-v="${k}" style="left:${x}px;width:${w}px">${im}${k===selClip?'<span class="hl"></span><span class="hr"></span>':''}</div>`; }).join('')
    + (E.kf||[]).map((k,i)=>`<div class="vkf ${i===selKf?'cur':''} ${k.ease==='tok2'?'gold':''}" data-kf="${i}" style="left:${pad+k.t*pps}px"></div>`).join('')
    + L.map((c,k)=>k? `<div class="vtr ${c.tr&&c.tr!=='none'?'on':''}" data-tr="${k}" style="left:${pad+st[k]*pps}px" title="Přechod">${I(c.tr&&c.tr!=='none'?'sparkles':'plus')}</div>`:'').join('');
}
// --- úpravy výsledného času (titulky, zóny, overlaye) při střihu ---
function removeOut(a,b){
  const len=b-a; if (len<=0) return;
  const keep=[]; for (const w of E.words){ const mid=(w.s+w.e)/2; if (mid>=a&&mid<b){ delete E.meta[w.id]; continue; }
    if (mid>=b){ w.s=Math.max(a,w.s-len); w.e=Math.max(w.s+0.05,w.e-len); } else if (w.e>a){ w.e=Math.max(w.s+0.05,a); } keep.push(w); }
  E.words=keep;
  const sh=v=> v>=b? v-len : v>a? a : v;
  for (const k in E.meta){ const m=E.meta[k]; if (m.so!=null) m.so=sh(m.so); if (m.eo!=null) m.eo=sh(m.eo); }
  E.zones=E.zones.map(z=>({...z,s:sh(z.s),e:sh(z.e)})).filter(z=>z.e-z.s>0.05);
  E.overlays=E.overlays.filter(o=>{ o.s=sh(o.s); o.e=sh(o.e); return o.e-o.s>0.05; });
  E.kf=E.kf.filter(k=>!(k.t>a+0.01&&k.t<b-0.01)).map(k=>({...k,t:sh(k.t)}));
}
function insertOut(at,len){
  if (len<=0) return;
  for (const w of E.words) if (w.s>=at){ w.s+=len; w.e+=len; }
  for (const k in E.meta){ const m=E.meta[k]; if (m.so!=null&&m.so>=at) m.so+=len; if (m.eo!=null&&m.eo>=at) m.eo+=len; }
  for (const z of E.zones) if (z.s>=at){ z.s+=len; z.e+=len; }
  for (const o of E.overlays) if (o.s>=at){ o.s+=len; o.e+=len; }
  for (const k of E.kf) if (k.t>=at) k.t+=len;
}
function ensureClips(){ if (!E.clips||!E.clips.length) E.clips=[{s:0,e:E.srcDur||vid.duration||0,tr:'none'}]; }
function cutAt(T){
  ensureClips(); const st=E.clipStarts(); const k=E.clips.findIndex((c,i)=>T>st[i]+0.08 && T<st[i]+(c.e-c.s)-0.08);
  if (k<0) return toast('Tady stříhat nejde (moc blízko střihu nebo konce)');
  const c=E.clips[k], ts=c.s+(T-st[k]);
  E.clips.splice(k,1,{s:c.s,e:ts,tr:c.tr||'none',trDur:c.trDur},{s:ts,e:c.e,tr:'none',trDur:0.12});
  selClip=k+1; changed(true); renderVideoTrack(); pbDecode(); toast('Video rozstřižené – přechod přidáš klepnutím na značku ve střihu');
}
function deleteClip(k){
  ensureClips(); if (E.clips.length<2) return toast('Poslední úsek videa smazat nejde');
  const st=E.clipStarts(), c=E.clips[k]; removeOut(st[k], st[k]+(c.e-c.s));
  E.clips.splice(k,1); if (E.clips[0]) E.clips[0].tr='none';
  selClip=-1; vid.pause(); PV.currentTime=Math.min(st[k], E.outDur()-0.05);
  changed(true); renderVideoTrack(); renderPanel(); toast('Úsek smazaný – titulky se posunuly');
}
function trimClip(k,side,dt){
  ensureClips(); const c=E.clips[k], st=E.clipStarts(), prev=E.clips[k-1], next=E.clips[k+1];
  if (side==='l'){ const ns=clamp(c.s+dt, prev?prev.e:0, c.e-0.2), d=ns-c.s; if (Math.abs(d)<0.01) return;
    if (d>0) removeOut(st[k], st[k]+d); else insertOut(st[k], -d); c.s=ns; }
  else { const ne=clamp(c.e+dt, c.s+0.2, next?next.s:(E.srcDur||vid.duration)), d=ne-c.e; if (Math.abs(d)<0.01) return;
    const endO=st[k]+(c.e-c.s); if (d<0) removeOut(endO+d, endO); else insertOut(endO, d); c.e=ne; }
  changed(true); renderVideoTrack();
}
let tlSyncT=0;
function followTimeline(t,force){ const sc=$('tlScroll'); const x=t*pps; if (force||Math.abs(sc.scrollLeft-x)>1){ tlSync=true; tlSyncT=performance.now(); sc.scrollLeft=x; requestAnimationFrame(()=>{ tlSync=false; }); } }
let kfRefT=null;
$('tlScroll').addEventListener('scroll',()=>{ if (panel==='kf'){ clearTimeout(kfRefT); kfRefT=setTimeout(()=>renderPanel(),120); } if (tlSync||tlDrag) return; if (!vid.paused) return; if (performance.now()-tlSyncT<350) return; PV.currentTime=clamp($('tlScroll').scrollLeft/pps,0,PV.duration-0.01); const k=E.pageAt(PV.currentTime); if (k>=0&&k!==curPage){ curPage=k; markCur(); } });
function setZoom(v){ pps=clamp(Math.round(v),12,400); $('tlZoom').value=pps; renderTimeline(); }
$('tlZoom').oninput=e=>setZoom(+e.target.value);
// přiblížení / oddálení timeline dvěma prsty (roztažení = přiblížit, stažení = oddálit); pozice v čase zůstane
(function(){
  const el=$('tl'); let pin=null;
  const dist=t=>Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
  el.addEventListener('touchstart',e=>{ if (e.touches.length===2){ pin={d:dist(e.touches),p:pps}; if (tlDrag){ tlDrag=null; renderTimeline(); } } },{passive:true});
  el.addEventListener('touchmove',e=>{ if (!pin || e.touches.length!==2) return; e.preventDefault(); const f=dist(e.touches)/pin.d; if (Math.abs(f-1)>0.02) setZoom(pin.p*f); },{passive:false});
  el.addEventListener('touchend',e=>{ if (e.touches.length<2) pin=null; },{passive:true});
  // počítač: Ctrl + kolečko / pinch na touchpadu
  el.addEventListener('wheel',e=>{ if (!e.ctrlKey) return; e.preventDefault(); setZoom(pps*Math.exp(-e.deltaY*0.01)); },{passive:false});
})();
// tažení bloků (posun, zkrácení, prodloužení)
let tlDrag=null;
$('tlIn').addEventListener('pointerdown',e=>{
  if (e.pointerType==='touch' && tlTouches>1) return;
  const zx=e.target.closest('[data-zx]'); if (zx){ E.zones.splice(+zx.dataset.zx,1); changed(true); return; }
  const kfm=e.target.closest('.vkf'); if (kfm){ vid.pause(); selKf=+kfm.dataset.kf; PV.currentTime=E.kf[selKf].t; openKfPanel(); return; }
  const trm=e.target.closest('.vtr'); if (trm){ vid.pause(); selClip=+trm.dataset.tr; openClipPanel(); return; }
  const blk=e.target.closest('.cb,.zb,.ob,.vb'); if (!blk) return;
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
  if (b.classList.contains('vb') && tlDrag.mode==='m') return;   // úsek videa se nepřesouvá, jen zkracuje za okraje
  if (tlDrag.mode==='m') b.style.left=(tlDrag.left0+d)+'px';
  else if (tlDrag.mode==='l'){ b.style.left=(tlDrag.left0+d)+'px'; b.style.width=Math.max(6,tlDrag.w0-d)+'px'; }
  else b.style.width=Math.max(6,tlDrag.w0+d)+'px';
});
$('tlIn').addEventListener('pointerup',e=>{
  if (!tlDrag) return; const {blk,mode,moved}=tlDrag, newLayer=tlDrag.layer; const dt=(e.clientX-tlDrag.x0)/pps; tlDrag=null;
  if (blk.dataset.k!==undefined){
    const k=+blk.dataset.k;
    if (!moved){ if (selClip>=0){ selClip=-1; renderVideoTrack(); if (panel==='clip'){ panel='captions'; $('bnav').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.p==='captions')); } } selectPage(k); renderPanel(); return; }
    const p=E.pages[k], m=pageMeta(p);
    if (newLayer!=null){ E.words[p.a].br=true; if (p.b+1<E.words.length) E.words[p.b+1].br=true; if (newLayer) m.layer=1; else delete m.layer; p.layer=newLayer; }
    // sousedi jen ve stejné vrstvě (jiná vrstva se může překrývat)
    const L=p.layer|0; let prev=null, next=null;
    for (let q=k-1;q>=0;q--) if ((E.pages[q].layer|0)===L){ prev=E.pages[q]; break; }
    for (let q=k+1;q<E.pages.length;q++) if ((E.pages[q].layer|0)===L){ next=E.pages[q]; break; }
    if (mode==='m'){ E.words[p.a].br=true; if (p.b+1<E.words.length) E.words[p.b+1].br=true; }
    if (mode==='m'){
      const lo=(prev?prev.s+0.05:0)-p.s, hi=(next?next.e-0.05:PV.duration)-p.e; const d=clamp(dt,lo,hi);
      for (let i=p.a;i<=p.b;i++){ E.words[i].s+=d; E.words[i].e+=d; }
      if (m.so!=null) m.so+=d; if (m.eo!=null) m.eo+=d; else m.eo=p.e+d;
      if (next && p.e+d>next.s){ const nm=pageMeta(next); nm.so=p.e+d; }
    } else if (mode==='l'){ m.so=clamp(p.s+dt, prev?prev.s+0.05:0, p.e-0.1); if (prev && m.so<prev.e){ pageMeta(prev).eo=m.so; } }
    else { m.eo=clamp(p.e+dt, p.s+0.1, next?next.e-0.05:PV.duration); if (next && m.eo>next.s){ pageMeta(next).so=m.eo; } }
    curPage=k; changed(true); if (panel==='captions') renderPanel();
  } else if (blk.dataset.v!==undefined){
    const k=+blk.dataset.v;
    if (!moved || mode==='m'){ selClip=k; openClipPanel(); return; }
    trimClip(k,mode,dt); renderPanel();
  } else if (blk.dataset.z!==undefined){
    const z=E.zones[+blk.dataset.z]; if (!moved) return;
    if (mode==='m'){ z.s=clamp(z.s+dt,0,PV.duration); z.e=clamp(z.e+dt,0,PV.duration); } else if (mode==='l') z.s=clamp(z.s+dt,0,z.e-0.1); else z.e=clamp(z.e+dt,z.s+0.1,PV.duration);
    changed(true);
  } else if (blk.dataset.o!==undefined){
    const o=E.overlays.find(x=>x.id===+blk.dataset.o); if (!o) return;
    selOv=o.id;
    if (moved){ if (mode==='m'){ o.s=clamp(o.s+dt,0,PV.duration); o.e=clamp(o.e+dt,0,PV.duration); } else if (mode==='l') o.s=clamp(o.s+dt,0,o.e-0.1); else o.e=clamp(o.e+dt,o.s+0.1,PV.duration); }
    else PV.currentTime=o.s+0.3;
    if (panel!=='overlay'){ panel='overlay'; $('bnav').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.p==='overlay')); }
    changed(); renderPanel();
  }
});
// rozdělit titulek v místě přehrávací hlavy
$('kfTop').onclick=()=>{ vid.pause(); const i=kfHere();
  if (i>=0){ E.kf.splice(i,1); toast('Klíčový bod smazaný'); } else { kfEnsure(); toast('Klíčový bod přidaný – teď můžeš video na náhledu zvětšit / posunout'); }
  openKfPanel(); changed(); renderVideoTrack(); };
// Tracking z lišty: overlay (když je vybraný v panelu Overlay), jinak titulek v místě hlavy
$('trkBtn').onclick=()=>{
  vid.pause();
  if (panel==='overlay' && selOv!=null){ const o=E.overlays.find(x=>x.id===selOv); if (o){ trkBegin('ov',id=>{ if (id) o.trk=id; else delete o.trk; }); return; } }
  if (panel==='clip'){ trkBegin('stab',id=>{ E.stab=id?{trk:id,smooth:(E.stab&&E.stab.smooth)??5,scale:!!(E.stab&&E.stab.scale)}:null; }); return; }   // vybrané video = stabilizace
  let k=E.pageAt(PV.currentTime); if (k<0) k=curPage; if (!E.pages[k]){ toast('Nejdřív vytvoř titulky'); return; }
  curPage=k; if (panel!=='captions'){ panel='captions'; $('bnav').querySelectorAll('button').forEach(z=>z.classList.toggle('on',z.dataset.p==='captions')); }
  renderPanel(); markCur();
  trkBegin('page',id=>{ const p=E.pages[k]; if (p){ const m=pageMeta(p); if (id) m.trk=id; else delete m.trk; } });
};
$('cutBtn').onclick=()=>{ vid.pause(); cutAt(PV.currentTime); openClipPanel(); };
$('splitBtn').onclick=()=>{
  const t=PV.currentTime, k=E.pageAt(t); if (k<0) return toast('Postav přehrávací hlavu na titulek');
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
// když je na timeline vybrané video (ne titulek), gesta na náhledu hýbou videem: 2 prsty = zoom, 1 prst = posun
const videoMode=()=>panel==='clip' && selClip>=0;
// video vždy vyplní celý formát (žádné černé okraje); u hran a u 100 % jemný magnet + vodítka
let vGuide=null;
function vFit(v){
  let z=v.z; const g={};
  if (z<101.2){ z=100; g.fit=true; }
  const lim=(z/100-1)*50;                       // max posun v % (aby okraj videa nevjel dovnitř)
  let x=clamp(v.x,-lim,lim), y=clamp(v.y,-lim,lim);
  const mag=1;
  if (Math.abs(x)<mag){ x=0; g.cx=true; } if (Math.abs(y)<mag){ y=0; g.cy=true; }
  if (lim>0){ if (lim-x<mag){ x=lim; g.l=true; } if (lim+x<mag){ x=-lim; g.r=true; } if (lim-y<mag){ y=lim; g.t=true; } if (lim+y<mag){ y=-lim; g.b=true; } }
  vGuide=g; return {z:Math.round(z*10)/10, x:Math.round(x*10)/10, y:Math.round(y*10)/10};
}
function aspectLabel(){ const r=fullW/fullH; const L=[[9/16,'9:16'],[16/9,'16:9'],[1,'1:1'],[4/5,'4:5'],[3/4,'3:4'],[4/3,'4:3']]; let b=L[0]; for (const l of L) if (Math.abs(l[0]-r)<Math.abs(b[0]-r)) b=l; return b[1]; }
function drawVGuide(){
  if (!vGuide || !gest || (gest.type!=='vpan'&&gest.type!=='vpinch')) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height, lw=Math.max(2,W*0.004), col='#ffd400';
  c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle=col; c.lineWidth=lw; c.setLineDash([W*0.02,W*0.012]);
  const ln=(x1,y1,x2,y2)=>{ c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); };
  if (vGuide.cx) ln(W/2,0,W/2,H); if (vGuide.cy) ln(0,H/2,W,H/2);
  c.setLineDash([]); c.lineWidth=lw*2.5;
  if (vGuide.fit||vGuide.l) ln(lw,0,lw,H); if (vGuide.fit||vGuide.r) ln(W-lw,0,W-lw,H); if (vGuide.fit||vGuide.t) ln(0,lw,W,lw); if (vGuide.fit||vGuide.b) ln(0,H-lw,W,H-lw);
  const z=kfVals().z, txt=vGuide.fit?('Přesně '+aspectLabel()+' · 100 %'):Math.round(z)+' %';
  c.font=`800 ${Math.round(W*0.04)}px "Schibsted Grotesk",Arial`; const tw=c.measureText(txt).width;
  c.fillStyle='rgba(10,13,20,.75)'; c.fillRect(W/2-tw/2-W*0.025,H*0.04,tw+W*0.05,W*0.07); c.fillStyle=vGuide.fit?col:'#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,W/2,H*0.04+W*0.035);
  c.restore();
}
let kfTrackT=0;
function kfSet(vals){ const cur0=kfVals(); if (kfHere()<0 && ['z','x','y','op'].every(k=>vals[k]==null||Math.abs(vals[k]-cur0[k])<0.05)) return; const n=E.kf.length; const k=kfEnsure(); Object.assign(k,vals); if (E.kf.length!==n) renderVideoTrack(); }   // během gesta nepřekreslovat timeline (plynulost)
function syncVmode(){ $('stage').classList.toggle('vmode',videoMode()); const i=E.kf.findIndex(k=>Math.abs(k.t-PV.currentTime)<0.05); $('kfTop').classList.toggle('on',i>=0); }
const ptrs=new Map(); let gest=null;
function cvPt(e){ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*cv.width,(e.clientY-r.top)/r.height*cv.height]; }
const stg=$('stage');
const stgOK=e=>e.target===cv||e.target===stg;
stg.addEventListener('gesturestart',e=>e.preventDefault()); stg.addEventListener('gesturechange',e=>e.preventDefault());
const pinchFrom=v=>{ const [a,b]=[...ptrs.values()]; return {type:'vpinch',d0:Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1])),m0:[(a[0]+b[0])/2,(a[1]+b[1])/2],v0:v,moved:true}; };
stg.addEventListener('pointerdown',e=>{
  if (inlineOpen || !stgOK(e)) return;
  try{ stg.setPointerCapture(e.pointerId); }catch(err){} ptrs.set(e.pointerId,cvPt(e));
  if (objEdit){ objDown(...cvPt(e)); return; }
  if (trkPick){ trkDown(...cvPt(e)); return; }
  const [x,y]=cvPt(e), hr=Math.min(cv.width,cv.height)*0.05;
  if (videoMode()){ vid.pause(); const v=kfVals();
    if (ptrs.size>=2) gest=pinchFrom(v);
    else gest={type:'vpan',x0:x,y0:y,v0:v,moved:false};
    return; }
  // druhý prst mimo titulky = zoom videa i bez vybraného klipu
  if (ptrs.size>=2 && gest && (gest.type==='tap'||gest.type==='vpan')){ vid.pause(); gest=pinchFrom(kfVals()); return; }
  if (ptrs.size===2 && gest && gest.type==='move'){ const [a,b]=[...ptrs.values()]; gest={type:'pinch',d0:Math.hypot(a[0]-b[0],a[1]-b[1]),size0:cur().size}; return; }
  // overlay?
  const t=PV.currentTime;
  // titulek nad overlayem má při klepnutí přednost před overlayem pod ním
  const inCap=(()=>{ const B=E.lastBox; if (!B||!B.P) return false; const xs=B.P.map(p=>p[0]), ys=B.P.map(p=>p[1]); return x>Math.min(...xs)-hr && x<Math.max(...xs)+hr && y>Math.min(...ys)-hr && y<Math.max(...ys)+hr; })();
  for (const o of [...E.overlays].reverse()){ if (t<o.s||t>o.e||o.full) continue; if (!o.above && inCap) continue; const b=E.overlayBox(o); if (Math.abs(x-b.cx)<b.w/2 && Math.abs(y-b.cy)<b.h/2){ selOv=o.id; gest={type:'ov',o,x0:x,y0:y,ox:o.x,oy:o.y,moved:false}; vid.pause(); if (panel!=='overlay'){ panel='overlay'; $('bnav').querySelectorAll('button').forEach(z=>z.classList.toggle('on',z.dataset.p==='overlay')); } renderPanel(); renderTimeline(); return; } }
  const B=E.lastBox;
  if (B){
    const k=E.pageAt(t); if (k>=0) curPage=k;
    if (Math.hypot(x-B.pe[0],y-B.pe[1])<hr*1.4){ openInline(curPage); ptrs.clear(); return; }
    if (Math.hypot(x-B.h[0],y-B.h[1])<hr*1.4){ gest={type:'resize',cx:B.cx,cy:B.cy,d0:Math.hypot(x-B.cx,y-B.cy),size0:cur().size}; guides=true; return; }
    const P=B.P, inside=x>Math.min(...P.map(p=>p[0]))-hr&&x<Math.max(...P.map(p=>p[0]))+hr&&y>Math.min(...P.map(p=>p[1]))-hr&&y<Math.max(...P.map(p=>p[1]))+hr;
    if (inside){ const S=cur(); gest={type:'move',x0:x,y0:y,px:S.posX,py:S.posY,moved:false}; return; }
  }
  gest={type:'tap',x0:x,y0:y,v0:kfVals()};
});
stg.addEventListener('pointermove',e=>{
  if (!ptrs.has(e.pointerId)||!gest) return; ptrs.set(e.pointerId,cvPt(e)); const [x,y]=cvPt(e);
  if (objEdit){ objMove(x,y); return; }
  if (trkPick){ trkMove(x,y); return; }
  if (gest.type==='vpan'){
    if (ptrs.size>=2){ gest=pinchFrom(kfVals()); return; }
    if (Math.hypot(x-gest.x0,y-gest.y0)<4 && !gest.moved) return; gest.moved=true;
    kfSet(vFit({z:gest.v0.z, x:gest.v0.x+(x-gest.x0)/cv.width*100, y:gest.v0.y+(y-gest.y0)/cv.height*100})); return; }
  if (gest.type==='vpinch'){ if (ptrs.size<2) return; const [a,b]=[...ptrs.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]), m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    gest.moved=true; const W=cv.width, H=cv.height, s0=gest.v0.z/100, s1=clamp(s0*d/gest.d0,0.9,6);
    // bod videa pod středem prstů zůstává pod prsty (zoom kolem prstů + posun dvěma prsty)
    const T0x=gest.v0.x/100*W, T0y=gest.v0.y/100*H, px=(gest.m0[0]-W/2-T0x)/s0, py=(gest.m0[1]-H/2-T0y)/s0;
    const Tx=m[0]-W/2-px*s1, Ty=m[1]-H/2-py*s1;
    kfSet(vFit({z:s1*100, x:Tx/W*100, y:Ty/H*100})); return; }
  if (gest.type==='tap' && Math.hypot(x-gest.x0,y-gest.y0)>8){ gest={type:'vpan',x0:gest.x0,y0:gest.y0,v0:gest.v0,moved:true}; }   // tah mimo titulky = posun videa
  if (gest.type==='vpan' && !videoMode()){ kfSet(vFit({z:gest.v0.z, x:gest.v0.x+(x-gest.x0)/cv.width*100, y:gest.v0.y+(y-gest.y0)/cv.height*100})); return; }
  if (gest.type==='ov'){ gest.moved=true; gest.o.x=clamp(gest.ox+(x-gest.x0)/cv.width*100,0,100); gest.o.y=clamp(gest.oy+(y-gest.y0)/cv.height*100,0,100); }
  else if (gest.type==='move'){ if (Math.hypot(x-gest.x0,y-gest.y0)>6){ gest.moved=true; guides=true; } if (!gest.moved) return;
    let nx=gest.px+(x-gest.x0)/cv.width*100, ny=gest.py+(y-gest.y0)/cv.height*100; if (Math.abs(nx-50)<1.5) nx=50; setVal('posX',+nx.toFixed(1),true); setVal('posY',+clamp(ny,3,97).toFixed(1),true); }
  else if (gest.type==='resize'){ const d=Math.hypot(x-gest.cx,y-gest.cy); setVal('size',Math.round(clamp(gest.size0*d/gest.d0,30,220)),true); }
  else if (gest.type==='pinch' && ptrs.size>=2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); setVal('size',Math.round(clamp(gest.size0*d/gest.d0,30,220)),true); }
});
function endPtr(e){
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (objEdit){ if (!ptrs.size){ objUp(); gest=null; } return; }
  if (trkPick){ if (!ptrs.size){ trkUp(); gest=null; } return; }
  if (ptrs.size===1 && gest && gest.type==='vpinch'){ const [x,y]=[...ptrs.values()][0]; gest={type:'vpan',x0:x,y0:y,v0:kfVals(),moved:true}; return; }
  if (ptrs.size) return;
  if (gest && (gest.type==='vpan'||gest.type==='vpinch')){ if (gest.moved){ changed(); renderPanel(); } else togglePlay(); gest=null; vGuide=null; return; }
  if (gest){ if (gest.type==='tap'){ selOv=null; togglePlay(); } else if (gest.type!=='move'||gest.moved) { changed(); if (panel==='style'||panel==='overlay') renderPanel(); } else if (gest.type==='move' && !gest.moved){ markCur(); if (panel==='captions') renderPanel(); } }
  gest=null; guides=false;
}
stg.addEventListener('pointerup',endPtr); stg.addEventListener('pointercancel',endPtr);

// ================= SLEDOVÁNÍ OBJEKTU (tracking) =================
// 1) klepnout na objekt (obličej, hrudník…) → rámeček, 2) „Sledovat“ → appka projde video snímek po snímku,
// 3) titulek / overlay pak plynule jede za objektem. Výpočet: tracker.js
let trkPick=null;
const r5=(a,d)=>a.map(v=>Math.round(v*d)/d);
function trkSave(T){ return {id:T.id,t0:T.t0,smooth:T.smooth,scale:!!T.scale,t:r5(T.t,1000),x:r5(T.x,1e5),y:r5(T.y,1e5),s:r5(T.s,1e4),c:r5(T.c,100)}; }
function trkSection(id,kind){
  const T=id&&E.tracks[id];
  if (!T) return `<div class="clabel">Sledování objektu</div><button class="btn" id="trkStart">${I('target','grad')} Sledovat objekt (tracking)</button>
    <div class="note">${kind==='ov'?'Overlay':'Titulek'} pojede plynule za obličejem, hrudníkem nebo čímkoli ve videu. Nejdřív zastav video tam, kde je objekt dobře vidět.</div>`;
  const a=E.src2out(T.t[0]), b=E.src2out(T.t[T.t.length-1]);
  return `<div class="clabel">Sledování objektu · ${fmt(a)}–${fmt(b)}</div>
    <label class="ctl"><div class="lb"><span>Plynulost pohybu</span><span>${T.smooth}</span></div><input type="range" id="trkSm" min="0" max="100" value="${T.smooth}"></label>
    <div class="row"><span>Měnit velikost s objektem</span><input type="checkbox" class="sw" id="trkSc" ${T.scale?'checked':''}></div>
    <div class="btnrow">${kind==='page'?`<button class="btn" id="trkAll">${I('copy')} Na všechny titulky</button>`:''}<button class="btn" id="trkStart">${I('target')} Nastavit znovu</button></div>
    <div class="btnrow"><button class="btn" id="trkOff">${I('x')} Zrušit sledování</button></div>`;
}
function trkBind(getId,setId,kind){
  if (!$('trkStart')) return;
  $('trkStart').onclick=()=>trkBegin(kind,setId);
  const T=E.tracks[getId()]; if (!T) return;
  $('trkSm').oninput=e=>{ T.smooth=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=T.smooth; }; $('trkSm').onchange=()=>changed();
  $('trkSc').onchange=e=>{ T.scale=e.target.checked; changed(); };
  if ($('trkAll')) $('trkAll').onclick=()=>{
    const a=E.src2out(T.t[0]), b=E.src2out(T.t[T.t.length-1]); let n=0;
    for (const p of E.pages) if (p.e>a && p.s<b){ pageMeta(p).trk=T.id; n++; }
    changed(); renderPanel(); toast(`Objekt sleduje ${n} titulků`);
  };
  $('trkOff').onclick=()=>{ setId(null); trkGC(); changed(); renderPanel(); };
}
function trkGC(){ const used=new Set(); for (const k in E.meta) if (E.meta[k] && E.meta[k].trk) used.add(E.meta[k].trk); for (const o of E.overlays) if (o.trk) used.add(o.trk); if (E.stab && E.stab.trk) used.add(E.stab.trk); for (const id in E.tracks) if (!used.has(id)) delete E.tracks[id]; }
function trkBegin(kind,setId){
  if (!window.TRK){ toast('Sledování se nenačetlo – obnov stránku'); return; }
  vid.pause();
  // objekt musí být v daném okamžiku vidět: video na začátek titulku / overlaye, pokud je mimo
  const t=PV.currentTime;
  if (kind==='page'){ const p=E.pages[curPage]; if (!p) return; if (t<p.s||t>p.e) PV.currentTime=Math.min(p.e-0.02,p.s+0.3); }
  else if (kind==='ov'){ const o=E.overlays.find(x=>x.id===selOv); if (!o) return; if (t<o.s||t>o.e) PV.currentTime=Math.min(o.e-0.02,o.s+0.1); }
  const W=cv.width, H=cv.height, sz=Math.min(W,H)*0.16;
  trkPick={box:{cx:W/2,cy:H*0.38,w:sz,h:sz}, kind, setId, running:false, cancel:false, prog:0};
  $('trkBar').classList.remove('hidden'); trkBarUpd();
}
function trkBarUpd(){
  const P=trkPick; if (!P) return;
  $('trkHint').textContent = P.running ? `Sleduji objekt… ${Math.round(P.prog*100)} %` : 'Klepni na to, co se má sledovat (obličej, hrudník…). Rámeček zvětšíš tažením rohu nebo dvěma prsty.';
  $('trkGo').classList.toggle('hidden',P.running); $('trkCancel').textContent=P.running?'Zastavit':'Zrušit';
}
function trkEnd(){ trkPick=null; gest=null; $('trkBar').classList.add('hidden'); }
function trkClampBox(B){ const W=cv.width,H=cv.height; B.w=clamp(B.w,Math.min(W,H)*0.04,W*0.9); B.h=clamp(B.h,Math.min(W,H)*0.04,H*0.9); B.cx=clamp(B.cx,B.w/2,W-B.w/2); B.cy=clamp(B.cy,B.h/2,H-B.h/2); }
function trkDown(x,y){
  const P=trkPick; if (P.running) return; const B=P.box, hr=Math.min(cv.width,cv.height)*0.05;
  if (ptrs.size>=2){ const [a,b]=[...ptrs.values()]; gest={type:'tpinch',d0:Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1])),w0:B.w,h0:B.h}; return; }
  if (Math.hypot(x-(B.cx+B.w/2),y-(B.cy+B.h/2))<hr*1.5){ gest={type:'tsize'}; return; }
  gest={type:'tmove',x0:x,y0:y,cx0:B.cx,cy0:B.cy,moved:false};
}
function trkMove(x,y){
  const P=trkPick; if (!P||P.running||!gest) return; const B=P.box;
  if (gest.type==='tpinch'){ if (ptrs.size<2) return; const [a,b]=[...ptrs.values()]; const f=Math.hypot(a[0]-b[0],a[1]-b[1])/gest.d0; B.w=gest.w0*f; B.h=gest.h0*f; }
  else if (gest.type==='tsize'){ B.w=Math.abs(x-B.cx)*2; B.h=Math.abs(y-B.cy)*2; }
  else if (gest.type==='tmove'){ if (!gest.moved && Math.hypot(x-gest.x0,y-gest.y0)<6) return; gest.moved=true; B.cx=gest.cx0+(x-gest.x0); B.cy=gest.cy0+(y-gest.y0); }
  trkClampBox(B);
}
function trkUp(){ const P=trkPick; if (!P||P.running||!gest) return; if (gest.type==='tmove' && !gest.moved){ P.box.cx=gest.x0; P.box.cy=gest.y0; trkClampBox(P.box); } }
function drawTrkPick(){
  const P=trkPick, B=P.box, c=cv.getContext('2d'), W=cv.width, H=cv.height, lw=Math.max(2,W*0.004);
  c.save(); c.setTransform(1,0,0,1,0,0); c.globalAlpha=1; c.shadowColor='transparent';
  if (P.obj){   // sledování tvaru objektu: jen živý náhled + průběh
    if (P.live) { c.drawImage(P.live.img,0,0,W,H); objLiveOutline(c,P.obj,P.live.A,W,H); }
    const bw=W*0.6, bh=Math.max(4,H*0.008); c.fillStyle='rgba(255,255,255,.3)'; c.fillRect((W-bw)/2,H*0.06,bw,bh); c.fillStyle='#27e1c1'; c.fillRect((W-bw)/2,H*0.06,bw*P.prog,bh);
    c.restore(); return;
  }
  const x0=B.cx-B.w/2, y0=B.cy-B.h/2;
  c.fillStyle='rgba(0,0,0,.38)'; c.beginPath(); c.rect(0,0,W,H); c.rect(x0,y0,B.w,B.h); c.fill('evenodd');
  c.strokeStyle='#fff'; c.lineWidth=lw; c.strokeRect(x0,y0,B.w,B.h);
  // rohy
  const k=Math.min(B.w,B.h)*0.22; c.strokeStyle='#27e1c1'; c.lineWidth=lw*2.2; c.beginPath();
  for (const [sx,sy] of [[0,0],[1,0],[0,1],[1,1]]){ const X=x0+sx*B.w, Y=y0+sy*B.h, dx=sx?-k:k, dy=sy?-k:k; c.moveTo(X+dx,Y); c.lineTo(X,Y); c.lineTo(X,Y+dy); }
  c.stroke();
  // střed (sledovaný bod)
  const r=Math.min(B.w,B.h)*0.12; c.strokeStyle='#fff'; c.lineWidth=lw; c.beginPath(); c.moveTo(B.cx-r,B.cy); c.lineTo(B.cx+r,B.cy); c.moveTo(B.cx,B.cy-r); c.lineTo(B.cx,B.cy+r); c.stroke();
  if (!P.running){ const hr=Math.min(W,H)*0.028; c.fillStyle='#fff'; c.beginPath(); c.arc(B.cx+B.w/2,B.cy+B.h/2,hr,0,Math.PI*2); c.fill(); c.strokeStyle='#111'; c.lineWidth=hr*0.18; c.beginPath(); c.moveTo(B.cx+B.w/2-hr*0.45,B.cy+B.h/2+hr*0.45); c.lineTo(B.cx+B.w/2+hr*0.45,B.cy+B.h/2-hr*0.45); c.stroke(); }
  else { const bw=W*0.6, bh=Math.max(4,H*0.008);
    // živý náhled: snímek, který se právě sleduje, a kde na něm objekt je
    if (P.live && P.live.A && P.obj){ c.drawImage(P.live.img,0,0,W,H); objLiveOutline(c,P.obj,P.live.A,W,H); }
    else if (P.live && P.live.box){ const L=P.live.box; c.drawImage(P.live.img,0,0,W,H); const lx=L.cx*W, ly=L.cy*H, lw2=L.w*W, lh2=L.h*H;
      c.strokeStyle='#27e1c1'; c.lineWidth=lw*2; c.strokeRect(lx-lw2/2,ly-lh2/2,lw2,lh2); c.beginPath(); c.moveTo(lx-lw2*0.15,ly); c.lineTo(lx+lw2*0.15,ly); c.moveTo(lx,ly-lh2*0.15); c.lineTo(lx,ly+lh2*0.15); c.stroke(); }
    c.fillStyle='rgba(255,255,255,.3)'; c.fillRect((W-bw)/2,H*0.06,bw,bh); c.fillStyle='#27e1c1'; c.fillRect((W-bw)/2,H*0.06,bw*P.prog,bh); }
  c.restore();
}
// značka sledovaného bodu u vybraného titulku / overlaye (při pauze)
function drawTrkMark(t){
  let id=null;
  if (panel==='captions'){ const p=E.pages[curPage]; if (p && t>=p.s && t<=p.e) id=(E.meta[E.keyOf(p)]||{}).trk; }
  else if (panel==='overlay'){ const o=E.overlays.find(x=>x.id===selOv); if (o && t>=o.s && t<=o.e) id=o.trk; }
  if (!id || !E.tracks[id]) return; const o=E.trkOffset(id,t); if (!o) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height, x=o.x/100*W, y=o.y/100*H, r=Math.min(W,H)*0.025, lw=Math.max(2,W*0.003);
  c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle='#27e1c1'; c.lineWidth=lw; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.moveTo(x-r*1.6,y); c.lineTo(x-r*0.5,y); c.moveTo(x+r*0.5,y); c.lineTo(x+r*1.6,y); c.moveTo(x,y-r*1.6); c.lineTo(x,y-r*0.5); c.moveTo(x,y+r*0.5); c.lineTo(x,y+r*1.6); c.stroke(); c.restore();
}
async function trkRun(){
  const P=trkPick; if (!P || P.running) return;
  P.running=true; P.prog=0; trkBarUpd();
  const W=cv.width, H=cv.height, k=E.vxfAt(PV.currentTime)||{z:100,x:0,y:0}, z=k.z/100;
  // rámeček z obrazovky → do souřadnic původního videa (bez zoomu z klíčových bodů)
  const inv=(X,Y)=>[(X-(W/2+k.x/100*W))/z+W/2, (Y-(H/2+k.y/100*H))/z+H/2];
  const [cx,cy]=inv(P.box.cx,P.box.cy);
  const box={cx:cx/W, cy:cy/H, w:P.box.w/z/W, h:P.box.h/z/H};
  const t0=vid.currentTime;
  let v=null, tr=null;
  try{
    v=await auxVideo();
    let last=0;
    tr=await TRK.run({video:v, file:videoFile, t0, box, back:8, onP:p=>{ P.prog=p; const n=performance.now(); if (n-last>150){ last=n; trkBarUpd(); } }, onFrame:(img,b)=>{ P.live={img,box:b}; }, cancel:()=>P.cancel});
  }catch(e){ console.warn(e); TRK.why='chyba: '+(e&&e.message||e); }
  if (v) freeVideo(v);
  trkEnd();
  if (!tr){ trkMsg(TRK.why==='prázdný obraz'?'Video se nepodařilo přečíst (prázdný obraz). Zkus video uložit znovu z Fotek a nahrát.':'Objekt se nepodařilo sledovat – zkus větší rámeček nebo výraznější místo'+(TRK.why?' ('+TRK.why+')':'')); return; }
  const id='k'+Date.now().toString(36);
  E.tracks[id]={id, t0, smooth:55, scale:false, t:tr.t, x:tr.x, y:tr.y, s:tr.s, c:tr.c};
  P.setId(id);
  // titulky: objekt sledují všechny titulky v úseku, kde se objekt sledoval
  let n=1;
  if (P.kind==='page'){ const a=E.src2out(tr.t[0]), b=E.src2out(tr.t[tr.t.length-1]); n=0; for (const p of E.pages) if (p.e>a && p.s<b){ pageMeta(p).trk=id; n++; } }
  trkGC(); changed(); renderPanel();
  PV.currentTime=Math.max(0,E.src2out(tr.t[0])+0.05);
  const len=tr.t[tr.t.length-1]-tr.t[0], L=len.toFixed(1).replace('.',',');
  // pohyb objektu na obrazovce (ať je vidět, jestli se vůbec hýbe)
  const mx=Math.max(...tr.x)-Math.min(...tr.x), my=Math.max(...tr.y)-Math.min(...tr.y), mv=Math.round(Math.max(mx,my)*100);
  if (P.kind==='stab' && len>=1){ const inf=E.stabInfo(); trkMsg(`Stabilizace hotová (${L} s) – objekt stojí na místě, video je přiblížené na ${Math.round((inf?inf.zoom:1)*100)} %. Pusť video a uvidíš.`); return; }
  trkMsg(len<1 ? `Objekt se ztratil po ${L} s – zkus větší rámeček nebo výraznější místo${TRK.why?' ('+TRK.why+')':''}.`
    : `Hotovo – objekt sledován ${L} s${P.kind==='page'?`, jede za ním ${n} ${n===1?'titulek':n<5?'titulky':'titulků'}`:''}. Objekt se na obrazovce posunul až o ${mv} %. Pusť video a uvidíš.`);
}
// delší zpráva (déle vidět než běžný toast)
function trkMsg(m){ const t=$('toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),6000); }
$('trkGo').onclick=()=>trkRun();
$('trkCancel').onclick=()=>{ if (!trkPick) return; if (trkPick.running) trkPick.cancel=true; else trkEnd(); };

// ================= ZVÝRAZNĚNÍ OBJEKTU (shine, obrys, výplň, sledování tvaru) =================
// výběr: AI klepnutím / kouzelná hůlka / štětec + / guma; vykreslení a sledování: objs.js + tracker.js
let objEdit=null, selObj=null;
const OBJ_COLORS=['#ffffff','#ffd27a','#ff9c00','#9fdcff','#27e1c1','#ff9ad5'];
function objSave(o){ const r={}; for (const k in o) if (k[0]!=='_') r[k]=o[k]; return r; }
function objInvalidate(o){ o._m=null; o._mk=Math.random(); o._bb=null; o._ct=null; if (o.trk) o.trk._S=null; }
const curObj=()=>E.objs.find(o=>o.id===selObj);
function openObjPanel(){ panel='obj'; $('bnav').querySelectorAll('button').forEach(x=>x.classList.remove('on')); if (selClip>=0){ selClip=-1; renderVideoTrack(); } renderPanel(); }
$('objBtn').onclick=()=>{ vid.pause(); openObjPanel(); if (!E.objs.length) objBegin(null); };
// obraz výchozího snímku v rozlišení masky (bez zoomu z klíčových bodů)
function objFrame(m){ const c=document.createElement('canvas'); c.width=m.w; c.height=m.h; const x=c.getContext('2d',{willReadFrequently:true}); try{ x.drawImage(vid,0,0,m.w,m.h); }catch(e){} return {c, img:x.getImageData(0,0,m.w,m.h)}; }
function objBegin(o){
  vid.pause(); if (trkPick) return;
  if (o){ PV.currentTime=E.src2out(o.t0); }
  setTimeout(()=>{   // počkat na snímek po přetočení
    const m=o? (()=>{ const a=OBJ.unrle(o.mask); return {w:a.w,h:a.h,d:a.d.slice()}; })() : OBJ.newMask(fullW/fullH);
    const f=objFrame(m);
    objEdit={m, c:f.c, img:f.img, tool:'ai', size:14, tol:26, obj:o, t0:o?o.t0:vid.currentTime, dirty:true, busy:false};
    renderPanel(); trkMsgShort('Klepni na objekt – AI ho vybere. Štětcem přidáš, gumou ubereš.');
  }, o?350:0);
}
function trkMsgShort(m){ toast(m); }
// plátno → maskové pixely (zpětně přes zoom / stabilizaci videa)
function objPt(x,y){ const W=cv.width,H=cv.height,k=E.vxfAt(PV.currentTime)||{z:100,x:0,y:0},z=k.z/100, m=objEdit.m;
  const nx=((x-(W/2+k.x/100*W))/z+W/2)/W, ny=((y-(H/2+k.y/100*H))/z+H/2)/H; return [nx*m.w, ny*m.h]; }
async function objDown(x,y){
  const E2=objEdit; if (!E2 || E2.busy) return; const [mx,my]=objPt(x,y);
  if (E2.tool==='ai'){
    E2.busy=true; toast('AI vybírá objekt…');
    try{ const n=await OBJ.aiSelect(E2.c,E2.m,mx,my,true); E2.dirty=true; toast(n?'Vybráno – klepni na další část, nebo uprav štětcem':'Tady AI nic nenašla – zkus jiné místo nebo kouzelnou hůlku'); }
    catch(e){ console.warn(e); toast('AI výběr se nenačetl (je potřeba internet) – použij kouzelnou hůlku'); E2.tool='wand'; renderPanel(); }
    E2.busy=false; return;
  }
  if (E2.tool==='wand'){ OBJ.wand(E2.img,E2.m,mx,my,E2.tol,true); E2.dirty=true; return; }
  gest={type:'obrush'}; OBJ.brush(E2.m,mx,my,E2.size,E2.tool==='add'?1:0); E2.dirty=true; E2.cur=[x,y];
}
function objMove(x,y){ const E2=objEdit; if (!E2) return; E2.cur=[x,y]; if (!gest || gest.type!=='obrush') return; const [mx,my]=objPt(x,y); OBJ.brush(E2.m,mx,my,E2.size,E2.tool==='add'?1:0); E2.dirty=true; }
function objUp(){ }
let objTint=null;
function drawObjEdit(){
  const E2=objEdit, m=E2.m, W=cv.width, H=cv.height, c=cv.getContext('2d');
  if (!objTint || objTint.width!==m.w || objTint.height!==m.h){ objTint=document.createElement('canvas'); objTint.width=m.w; objTint.height=m.h; E2.dirty=true; }
  if (E2.dirty){ const x=objTint.getContext('2d'), id=x.createImageData(m.w,m.h); for (let i=0;i<m.d.length;i++) if (m.d[i]){ id.data[i*4]=39; id.data[i*4+1]=225; id.data[i*4+2]=193; id.data[i*4+3]=130; } x.putImageData(id,0,0); E2.dirty=false; }
  const k=E.vxfAt(PV.currentTime)||{z:100,x:0,y:0}, z=k.z/100;
  c.save(); c.setTransform(1,0,0,1,0,0); c.translate(W/2+k.x/100*W,H/2+k.y/100*H); c.scale(z,z); c.translate(-W/2,-H/2); c.imageSmoothingEnabled=true; c.drawImage(objTint,0,0,W,H); c.restore();
  if (E2.cur && (E2.tool==='add'||E2.tool==='erase')){ const r=E2.size/m.w*W*z; c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle=E2.tool==='add'?'#27e1c1':'#ff5a5a'; c.lineWidth=Math.max(2,W*0.003); c.beginPath(); c.arc(E2.cur[0],E2.cur[1],r,0,Math.PI*2); c.stroke(); c.restore(); }
}
function objLiveOutline(c,o,A,W,H){
  if (!o._m) o._m=OBJ.unrle(o.mask); if (!o._ct) o._ct=OBJ.contours(o._m); const m=o._m;
  c.save(); c.setTransform(1,0,0,1,0,0); c.strokeStyle='#27e1c1'; c.lineWidth=Math.max(2,W*0.004);
  for (const P of o._ct){ c.beginPath(); P.forEach(([x,y],i)=>{ const nx=x/m.w, ny=y/m.h, X=(A[0]*nx+A[2]*ny+A[4])*W, Y=(A[1]*nx+A[3]*ny+A[5])*H; i?c.lineTo(X,Y):c.moveTo(X,Y); }); c.closePath(); c.stroke(); }
  c.restore();
}
function objFinish(save){
  const E2=objEdit; objEdit=null; if (!save){ renderPanel(); return; }
  if (OBJ.area(E2.m)<30){ toast('Nic není vybrané'); renderPanel(); return; }
  OBJ.tidy(E2.m);
  if (E2.obj){ E2.obj.mask=OBJ.rle(E2.m); objInvalidate(E2.obj); selObj=E2.obj.id; }
  else {
    const s=E.src2out(E2.t0), o={id:'o'+Date.now().toString(36), t0:E2.t0, s, e:Math.min(PV.duration||s+4, s+4), mask:OBJ.rle(E2.m), _mk:1,
      shine:true, shineC:'#ffffff', shineSpd:50, shineEvery:2.6, shineW:50, shineI:80, line:'off', lineC:'#ffffff', lineW:50, fillA:0, fillC:'#27e1c1', trk:null};
    E.objs.push(o); selObj=o.id;
  }
  changed(); renderPanel(); renderTimeline();
  // hned sledovat pohyb kamery (zastaví se samo u střihu) – u reality se kamera skoro vždy hýbe
  const o=curObj(); if (o && !E2.obj) objTrack(o); else toast('Výběr upravený');
}
function colorRow(lb,key,o){ const v=o[key]||'#ffffff'; return `<div class="clabel">${lb}</div><div class="objcols" data-k="${key}">${OBJ_COLORS.map(c=>`<i class="${v.toLowerCase()===c?'on':''}" data-c="${c}" style="background:${c}"></i>`).join('')}<label class="cpick" style="background:${v}"><input type="color" value="${v}" data-k="${key}"></label></div>`; }
function oslider(lb,id,min,max,val,unit=''){ return `<label class="ctl"><div class="lb"><span>${lb}</span><span>${val}${unit}</span></div><input type="range" id="${id}" min="${min}" max="${max}" step="${(max-min)>20?1:0.1}" value="${val}"></label>`; }
function pObj(){
  const E2=objEdit;
  if (E2){
    const T=[['ai','AI výběr (klepni)'],['wand','Kouzelná hůlka'],['add','Štětec +'],['erase','Guma']];
    return `<div class="mixhead"><svg class="ic grad"><use href="#i-sparkles"/></svg><div><b>${E2.obj?'Úprava výběru':'Vyber objekt'}</b><small>Klepni na objekt (stůl, gauč, okno, pozemek…). Štětcem přidáš, gumou ubereš. Video stojí na snímku, ze kterého se výběr dělá.</small></div></div>
    <div class="chips" id="objTool">${T.map(([v,l])=>`<div class="chip ${E2.tool===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>
    ${E2.tool==='add'||E2.tool==='erase'?oslider('Velikost štětce','objSize',2,60,E2.size):''}
    ${E2.tool==='wand'?oslider('Tolerance barvy','objTol',4,80,E2.tol):''}
    <div class="btnrow"><button class="btn" id="objClear">${I('reset')} Vymazat výběr</button></div>
    <div class="btnrow"><button class="btn" id="objCancel">Zrušit</button><button class="btn primary" id="objDone">${I('check')} Hotovo</button></div>`;
  }
  const o=curObj();
  let h=`<div class="mixhead"><svg class="ic grad"><use href="#i-sparkles"/></svg><div><b>Zvýraznění objektu</b><small>Vyber objekt ve videu – přes něj projede shine, může mít obrys (plný / přerušovaný) a výplň. Se sledováním drží tvar i při pohybu kamery (např. pozemek z dronu).</small></div></div>
  <button class="btn ${o?'':'primary'}" id="objNew">${I('plus')} Vybrat objekt</button>
  ${E.objs.length?`<div class="chips" id="objList">${E.objs.map((x,i)=>`<div class="chip ${x.id===selObj?'on':''}" data-v="${x.id}">Objekt ${i+1}</div>`).join('')}</div>`:''}`;
  if (!o) return h;
  const tr=o.trk;
  h+=`<div class="clabel">Čas · ${fmt(o.s)}–${fmt(o.e)}</div>
  <div class="btnrow"><button class="btn small" id="objHere">${I('pin')} Začít v místě hlavy</button></div>
  ${oslider('Délka zobrazení','objDur',0.5,30,+(o.e-o.s).toFixed(1),' s')}
  <div class="row"><span>Shine přes objekt</span><input type="checkbox" class="sw" id="objShine" ${o.shine?'checked':''}></div>
  ${o.shine?`${colorRow('Barva shine','shineC',o)}${oslider('Rychlost průjezdu','objSS',0,100,o.shineSpd??50)}${oslider('Opakovat každých','objSE',1,8,o.shineEvery??2.6,' s')}${oslider('Šířka pruhu','objSW',0,100,o.shineW??50)}${oslider('Síla','objSI',10,150,o.shineI??80)}`:''}
  <div class="clabel">Obrys</div><div class="chips" id="objLine">${[['off','Žádný'],['solid','Plná čára'],['dash','Přerušovaná']].map(([v,l])=>`<div class="chip ${(o.line||'off')===v?'on':''}" data-v="${v}">${l}</div>`).join('')}</div>
  ${o.line&&o.line!=='off'?`${colorRow('Barva čáry','lineC',o)}${oslider('Tloušťka čáry','objLW',10,200,o.lineW??50)}`:''}
  ${oslider('Výplň (barevný nádech)','objFA',0,70,o.fillA||0,' %')}
  ${(o.fillA||0)>0?colorRow('Barva výplně','fillC',o):''}
  <div class="clabel">Pohyb kamery</div>
  <button class="btn" id="objTrk">${I('target','grad')} ${tr?'Sledovat znovu':'Sledovat pohyb objektu'}</button>
  ${tr?`<div class="note">Sledováno ${fmt(E.src2out(tr.t[0]))}–${fmt(E.src2out(tr.t[tr.t.length-1]))}. Tvar drží posun, natočení, zvětšení i zkosení.</div>${oslider('Plynulost sledování','objTS',0,60,tr.smooth??8)}<button class="btn small" id="objTrkOff">Zrušit sledování</button>`:'<div class="note">Bez sledování zůstane zvýraznění na místě (statický záběr). Při pohybu kamery dej „Sledovat“.</div>'}
  <div class="btnrow"><button class="btn" id="objEditBtn">${I('pencil')} Upravit výběr</button><button class="btn" id="objDel">${I('trash')} Smazat</button></div>`;
  return h;
}
binders.obj=()=>{
  const E2=objEdit;
  if (E2){
    $('objTool').onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; E2.tool=d.dataset.v; renderPanel(); };
    if ($('objSize')) $('objSize').oninput=e=>{ E2.size=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=E2.size; };
    if ($('objTol')) $('objTol').oninput=e=>{ E2.tol=+e.target.value; e.target.previousElementSibling.lastElementChild.textContent=E2.tol; };
    $('objClear').onclick=()=>{ E2.m.d.fill(0); E2.dirty=true; };
    $('objCancel').onclick=()=>objFinish(false); $('objDone').onclick=()=>objFinish(true);
    // AI model načíst hned na pozadí, ať je první klepnutí rychlé
    OBJ.aiLoad().catch(()=>{});
    return;
  }
  $('objNew').onclick=()=>objBegin(null);
  if ($('objList')) $('objList').onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; selObj=d.dataset.v; const o=curObj(); if (o && (PV.currentTime<o.s||PV.currentTime>o.e)) PV.currentTime=o.s+0.05; renderPanel(); };
  const o=curObj(); if (!o) return;
  const num=(id,fn)=>{ const el=$(id); if (!el) return; el.oninput=e=>{ fn(+e.target.value); e.target.previousElementSibling.lastElementChild.textContent=e.target.value+(e.target.previousElementSibling.lastElementChild.textContent.replace(/^[\d.,-]+/,'')); }; el.onchange=()=>changed(); };
  $('objHere').onclick=()=>{ const d=o.e-o.s; o.s=PV.currentTime; o.e=Math.min(PV.duration,o.s+d); changed(); renderPanel(); renderTimeline(); };
  num('objDur',v=>{ o.e=Math.min(PV.duration,o.s+v); });
  $('objShine').onchange=e=>{ o.shine=e.target.checked; changed(); renderPanel(); };
  num('objSS',v=>o.shineSpd=v); num('objSE',v=>o.shineEvery=v); num('objSW',v=>o.shineW=v); num('objSI',v=>o.shineI=v); num('objLW',v=>o.lineW=v);
  num('objFA',v=>o.fillA=v); if ($('objFA')) $('objFA').onchange=()=>{ changed(); renderPanel(); };
  num('objTS',v=>{ if (o.trk){ o.trk.smooth=v; o.trk._S=null; } });
  $('objLine').onclick=e=>{ const d=e.target.closest('[data-v]'); if(!d) return; o.line=d.dataset.v; changed(); renderPanel(); };
  document.querySelectorAll('#panel .objcols').forEach(row=>{ row.onclick=e=>{ const d=e.target.closest('[data-c]'); if(!d) return; o[row.dataset.k]=d.dataset.c; changed(); renderPanel(); }; const inp=row.querySelector('input[type=color]'); if (inp){ inp.oninput=e=>{ o[inp.dataset.k]=e.target.value; inp.parentElement.style.background=e.target.value; }; inp.onchange=()=>{ changed(); renderPanel(); }; } });
  $('objTrk').onclick=()=>objTrack(o);
  if ($('objTrkOff')) $('objTrkOff').onclick=()=>{ o.trk=null; changed(); renderPanel(); };
  $('objEditBtn').onclick=()=>objBegin(o);
  $('objDel').onclick=()=>{ E.objs=E.objs.filter(x=>x!==o); selObj=null; changed(); renderPanel(); renderTimeline(); };
};
// sledování tvaru objektu (afinní) – s živým náhledem obrysu
async function objTrack(o){
  if (trkPick || !window.TRK) return; vid.pause();
  if (!o._m) o._m=OBJ.unrle(o.mask);
  const W=cv.width,H=cv.height;
  trkPick={box:{cx:W/2,cy:H/2,w:W,h:H}, kind:'obj', obj:o, running:true, cancel:false, prog:0};
  $('trkBar').classList.remove('hidden'); trkBarUpd(); $('trkHint').textContent='Sleduji objekt… 0 %';
  const P=trkPick; let v=null, tr=null, last=0;
  try{ v=await auxVideo(); tr=await TRK.runAffine({video:v, file:videoFile, t0:o.t0, mask:o._m, back:6, onP:p=>{ P.prog=p; const n=performance.now(); if (n-last>150){ last=n; $('trkHint').textContent=`Sleduji objekt… ${Math.round(p*100)} %`; } }, onFrame:(img,A)=>{ if (A) P.live={img,A}; }, cancel:()=>P.cancel}); }
  catch(e){ console.warn(e); TRK.why='chyba: '+(e&&e.message||e); }
  if (v) freeVideo(v); trkEnd();
  if (!tr){ trkMsg('Objekt se nepodařilo sledovat'+(TRK.why?' ('+TRK.why+')':'')+'. Zkus výběr s výraznější kresbou.'); return; }
  o.trk={t:tr.t, A:tr.A.map(a=>a.map(v=>Math.round(v*1e5)/1e5)), c:tr.c.map(v=>Math.round(v*100)/100), smooth:8};
  o.s=E.src2out(tr.t[0]); o.e=E.src2out(tr.t[tr.t.length-1]);
  changed(); renderPanel(); renderTimeline(); PV.currentTime=o.s+0.05;
  trkMsg(`Hotovo – objekt sledován ${(tr.t[tr.t.length-1]-tr.t[0]).toFixed(1).replace('.',',')} s. Pusť video a uvidíš.`);
}

// ================= VRSTVY (co je právě na obrazovce, pořadí přetažením) =================
function layerItems(){
  const t=PV.currentTime, L=[];
  for (const o of E.ovOrder()) if (t>=o.s && t<=o.e){ const n=E.overlays.filter(x=>!x.full).indexOf(o)+1; L.push({id:'o:'+o.id, z:E.ovZ(o), name:`Overlay ${n}`, sub:(o.src&&o.src.tagName==='VIDEO')?'video':'obrázek', icon:'image', o}); }
  if (!E.flags.hidden && E.pagesAt(t).length) L.push({id:'cap', z:E.capZ, name:'Titulky', sub:'všechny titulky', icon:'type'});
  L.sort((a,b)=>b.z-a.z);   // nahoře = vpředu
  const fixed=[];
  if ((E.objs||[]).some(o=>t>=o.s&&t<=o.e)) fixed.push({name:'Zvýraznění objektu', sub:'drží se videa', icon:'sparkles'});
  if (E.overlays.some(o=>o.full&&t>=o.s&&t<=o.e)) fixed.push({name:'Nová verze záběru', sub:'překrytí videa', icon:'layers'});
  fixed.push({name:'Video', sub:'základ – vždy vzadu', icon:'play'});
  return {L, fixed};
}
function renderLayers(){
  const {L,fixed}=layerItems();
  $('layList').innerHTML = (L.length? L.map(x=>`<div class="lay" data-id="${x.id}"><span class="lay-i">${I(x.icon,'grad')}</span><span class="lay-t"><b>${x.name}</b><small>${x.sub}</small></span><span class="lay-h" title="Přetáhni">${I('arrows-v')}</span></div>`).join('')
    : '<div class="muted">V tomhle místě není nic, co by šlo přeskládat. Posuň hlavu na timeline tam, kde je overlay.</div>')
    + fixed.map(x=>`<div class="lay fixed"><span class="lay-i">${I(x.icon)}</span><span class="lay-t"><b>${x.name}</b><small>${x.sub}</small></span><span class="lay-h lock">${I('pin')}</span></div>`).join('');
}
function openLayers(){ vid.pause(); renderLayers(); openSheet('sheetLayers'); }
// nové pořadí (shora dolů) → z hodnoty: stávající z těch vrstev se jen přerozdělí, ostatní vrstvy zůstanou
function applyLayerOrder(ids){
  const {L}=layerItems(); const byId=Object.fromEntries(L.map(x=>[x.id,x]));
  let zs=L.map(x=>x.z).sort((a,b)=>b-a);
  for (let i=1;i<zs.length;i++) if (zs[i]>=zs[i-1]) zs[i]=zs[i-1]-0.01;   // bez shodných hodnot
  ids.forEach((id,i)=>{ const it=byId[id]; if (!it) return; if (id==='cap') E.capZ=zs[i]; else { it.o.z=zs[i]; } });
  for (const o of E.overlays) if (!o.full) o.above=E.ovAbove(o);
  changed(); if (panel==='overlay') renderPanel();
}
(function(){
  const list=$('layList'); let drag=null;
  list.addEventListener('pointerdown',e=>{ const row=e.target.closest('.lay'); if (!row || row.classList.contains('fixed')) return;
    e.preventDefault(); try{ list.setPointerCapture(e.pointerId); }catch(err){}
    drag={row, y0:e.clientY, id:e.pointerId}; row.classList.add('drag'); });
  list.addEventListener('pointermove',e=>{ if (!drag || e.pointerId!==drag.id) return;
    const dy=e.clientY-drag.y0; drag.row.style.transform=`translateY(${dy}px)`;
    const rows=[...list.querySelectorAll('.lay:not(.fixed)')], r=drag.row.getBoundingClientRect(), mid=r.top+r.height/2;
    const i=rows.indexOf(drag.row);
    const prev=rows[i-1], next=rows[i+1];
    if (prev){ const pr=prev.getBoundingClientRect(); if (mid<pr.top+pr.height/2){ list.insertBefore(drag.row,prev); drag.y0-=pr.height+8; drag.row.style.transform=`translateY(${e.clientY-drag.y0}px)`; } }
    if (next){ const nr=next.getBoundingClientRect(); if (mid>nr.top+nr.height/2){ list.insertBefore(next,drag.row); drag.y0+=nr.height+8; drag.row.style.transform=`translateY(${e.clientY-drag.y0}px)`; } }
  });
  const end=e=>{ if (!drag) return; drag.row.style.transform=''; drag.row.classList.remove('drag');
    const ids=[...list.querySelectorAll('.lay:not(.fixed)')].map(r=>r.dataset.id); drag=null; applyLayerOrder(ids); renderLayers(); };
  list.addEventListener('pointerup',end); list.addEventListener('pointercancel',end);
})();
$('layersBtn').onclick=openLayers;

// ================= EXPORT =================
$('exportBtn').onclick=()=>{
  vid.pause();
  const opts=[['orig',`Původní (${fullW}×${fullH})`]]; const short=Math.min(fullW,fullH);
  for (const s of [2160,1440,1080,720]) if (s<short || (s===1080 && short<1080)){ const sc=s/short; opts.push([String(s),`${s}p (${Math.round(fullW*sc/2)*2}×${Math.round(fullH*sc/2)*2})${s>short?' – doporučeno, ostré titulky':''}`]); }
  $('exRes').innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  const q=$('quality').value; if ([...$('exRes').options].some(o=>o.value===q)) $('exRes').value=q;
  if (short<1080) $('exRes').value='1080';   // video v nízké kvalitě → výsledek 1080p, ať titulky nejsou rozmazané
  $('exDl').classList.add('hidden'); $('exStatus').textContent=EXP.canPrecise()?'':'Tento prohlížeč neumí přesný export – použije se nahrávání v reálném čase.';
  $('exGo').classList.remove('hidden'); $('exGo').textContent='Exportovat'; $('exBarW').classList.add('hidden'); $('exMore').open=true;
  openSheet('sheetExport');
};
let exCancel=null;
$('exCancel').onclick=()=>{ if (exCancel) exCancel.v=true; };
$('exGo').onclick=()=>runExport();
async function runExport(){
  if (exCancel) return;
  $('exMore').open=false;
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
      // mobilní aplikace: rovnou do galerie
      if (NATIVE.isNative){ ev.preventDefault(); try{ $('exStatus').textContent='Ukládám do galerie…'; const r=await NATIVE.saveVideo(res.blob,a.download,p=>{ $('exStatus').textContent=`Ukládám do galerie… ${Math.round(p*100)} %`; }); $('exStatus').textContent = r==='saved' ? 'Video je uložené v galerii' : r==='shared' ? 'Hotovo' : 'Uložení se nepovedlo'; if (r==='saved') toast('Video je ve Fotkách / Galerii'); }catch(e){ $('exStatus').textContent='Uložení se nepovedlo: '+(e.message||e); } return; }
      // uvnitř Claude (artifact): uložení přes potvrzení „Stáhnout“
      if (window.claude && window.claude.use){ ev.preventDefault(); try{ const d=await window.claude.use('downloads'); if (d){ await d.save({filename:a.download, data:res.blob}); return; } }catch(e){ if (e&&e.code==='declined') return; console.warn(e); } }
      // na iPhonu nabídnout sdílení (uložit do Fotek)
      if (navigator.canShare){ const f=new File([res.blob],a.download,{type:res.blob.type}); if (navigator.canShare({files:[f]})){ ev.preventDefault(); try{ await navigator.share({files:[f]}); }catch(e){} } } };
    window.__lastExport=res;
  }catch(e){ console.error(e); $('exStatus').textContent='Export se nepovedl: '+e.message; }
  finally{ $('exCancel').classList.add('hidden'); $('exGo').classList.remove('hidden'); $('exGo').textContent='Exportovat znovu'; exCancel=null; }
}
$('quality').onchange=()=>toast('Kvalita exportu: '+$('quality').selectedOptions[0].textContent);


// ================= PRO (předplatné 300 Kč / měsíc, bez něj vodoznak) =================
const PRO={
  get(){ return lsGet('efk_pro',null); },
  set(v){ lsSet('efk_pro',v); PRO.apply(); },
  active(){ const p=PRO.get(); return !!(p && p.token && p.pro && (!p.until || Date.now() < p.until + 3*86400e3)); },
  apply(){
    const on=PRO.active(); E.flags.pro=on;
    const b=$('proBtn'); b.innerHTML=on?'PRO '+I('check'):'Získat PRO'; b.classList.toggle('on',on);
    $('wmNote').hidden=on;
    const p=PRO.get();
    $('proBuy').hidden=on; $('proHave').hidden=!on;
    const nat=NATIVE.isNative; document.querySelectorAll('.web-only').forEach(x=>x.hidden=nat); document.querySelectorAll('.app-only').forEach(x=>x.hidden=!nat);
    if (on){ $('proCodeOut').value=p.token; $('proUntil').textContent=p.status==='owner'?'Kód majitele – bez omezení':p.until?((p.cancelAtEnd?'Platí do ':'Další platba ')+new Date(p.until).toLocaleDateString('cs-CZ')):''; }
  },
  async api(a,q='',body){
    const r=await fetch(NATIVE.api('/api/pro?a='+a+q),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
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
// vodoznak jde vypnout jen s PRO – ve free verzi přepínač zůstane zapnutý a nabídne PRO
$('wmToggle').onchange=e=>{ if (!PRO.active()){ e.target.checked=true; $('sheetExport').classList.remove('on'); PRO.open(); PRO.msg('Vodoznak jde vypnout s předplatným PRO.'); } };
$('proGo').onclick=async()=>{
  const b=$('proGo'); b.disabled=true;
  // v mobilní aplikaci se platí přes App Store / Google Play (vyžadují to pravidla obchodů)
  if (NATIVE.isNative){
    PRO.msg('Otevírám platbu…');
    try{ const r=await NATIVE.storeBuy(); if (r && r.pro){ PRO.set({token:'store',store:true,...r,checked:Date.now()}); PRO.msg(''); toast('Díky! PRO je aktivní – videa jsou bez vodoznaku'); } else PRO.msg(''); }
    catch(e){ PRO.msg(e.message||String(e),true); }
    b.disabled=false; return;
  }
  PRO.msg('Otevírám platbu…');
  try{ const j=await PRO.api('checkout'); location.href=j.url; }
  catch(e){ PRO.msg(e.message,true); b.disabled=false; }
};
$('proRestore').onclick=async()=>{
  PRO.msg('Obnovuji nákupy…');
  try{ const r=await NATIVE.storeRestore(); if (r && r.pro){ PRO.set({token:'store',store:true,...r,checked:Date.now()}); PRO.msg(''); toast('PRO je obnovené'); } else PRO.msg('Na tomhle účtu jsem nenašel aktivní předplatné.',true); }
  catch(e){ PRO.msg(e.message||String(e),true); }
};
$('proCodeOk').onclick=async()=>{
  const t=$('proCodeIn').value.replace(/\s+/g,''); if (!t) return PRO.msg('Vlož PRO kód.',true);
  PRO.msg('Ověřuji…');
  try{ const j=await PRO.check(t); if (j.pro){ PRO.msg(''); toast('PRO je aktivní – videa jsou bez vodoznaku'); } else PRO.msg('Předplatné k tomuto kódu už neplatí ('+j.status+').',true); }
  catch(e){ PRO.msg(e.message,true); }
};
$('proCopy').onclick=async()=>{ const t=$('proCodeOut').value; try{ await navigator.clipboard.writeText(t); toast('Kód zkopírovaný'); }catch(e){ $('proCodeOut').select(); document.execCommand('copy'); toast('Kód zkopírovaný'); } };
$('proManage').onclick=async()=>{ if (NATIVE.isNative && PRO.get()?.store) return NATIVE.storeManage(); PRO.msg('Otevírám správu předplatného…'); try{ const j=await PRO.api('portal','',{token:PRO.get().token}); location.href=j.url; }catch(e){ PRO.msg(e.message,true); } };
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
  if (NATIVE.isNative){
    // aplikace: stav předplatného z App Store / Google Play
    if (await NATIVE.storeInit()){
      const st=await NATIVE.storeStatus(); if (st) PRO.set({token:'store',store:true,...st,checked:Date.now()});
      const pr=await NATIVE.storePrice(); if (pr){ $('proPrice').textContent=pr; $('proGo').textContent=`Předplatit za ${pr} / měsíc`; }
    }
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
if (document.fonts && document.fonts.load) for (const w of [400,500,600,700,800,900]) document.fonts.load(`${w} 60px "Inter Tight"`,'AaŽžŠšČčŘřĚěŮůÝýÁáÍíÉéÚúŇňŤťĎď').catch(()=>{});

// ---------- automatická aktualizace: telefon drží starou verzi stránky v paměti ----------
const BUILD='dev';
async function checkUpdate(){
  if (BUILD==='dev' || NATIVE.isNative) return;
  try{
    const v=(await (await fetch('version.txt?'+Date.now(),{cache:'no-store'})).text()).trim();
    if (!v || v===BUILD) return;
    if ($('home').classList.contains('on')) { location.reload(); return; }   // na úvodu rovnou načíst
    if (!$('updBar')){ const d=document.createElement('button'); d.id='updBar'; d.className='updbar'; d.innerHTML=I('refresh')+' Je tu nová verze aplikace – klepni pro načtení (projekt zůstane uložený)'; d.onclick=async()=>{ d.textContent='Načítám novou verzi…'; try{ if (project) await Promise.race([saveProject(), new Promise(r=>setTimeout(r,1200))]); }catch(e){} location.reload(); }; document.body.appendChild(d); }
  }catch(e){}
}
document.addEventListener('visibilitychange',()=>{ if (document.visibilityState==='visible') checkUpdate(); });
setInterval(checkUpdate, 5*60*1000);

// nový výchozí Styl 1 (verze 2) – starý uložený „výchozí vzhled“ by ho přebil, proto ho jednou zahodit
try{ if (localStorage.getItem('efk_default_v')!=='2'){ localStorage.removeItem('efk_default'); localStorage.setItem('efk_default_v','2'); } }catch(e){}

// ================= START =================
renderHomeTpl(); renderProjects(); renderLangs();
window.__app={E,AI,EXP,setVal,setMany,selectPage,openEditor,loadVideo,afterWords,snapshot,restore,get curPage(){return curPage;}};

// Base měří šířku slov – když se písmo dočte později, titulky se přepočítají
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', ()=>{ if (E.G.split==='fill' && E.words.length && Date.now()-(window.__wordsAt||0)<10000){ E.buildPages(); curPage=clamp(curPage,0,Math.max(0,E.pages.length-1)); try{ renderTimeline(); }catch(e){} } });

// maskot na úvodní obrazovce (ukáže se, jen když je soubor maskot.png u appky)
(()=>{ const m=document.getElementById('mascot'); if (!m) return; m.onload=()=>{ m.hidden=false; }; m.onerror=()=>{ m.remove(); }; m.src='maskot.png'; })();
