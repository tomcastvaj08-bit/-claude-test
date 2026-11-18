/* EFEKTIVE Captions – export
   1) Celé video: přesně snímek po snímku (WebCodecs → MP4, H.264/AAC, jinak VP9/Opus) – žádné sekání
   2) Jen titulky: průhledné PNG snímky v ZIPu (vložíš nad video v CapCutu / Premiere / DaVinci / Final Cut)
   3) Záloha pro staré prohlížeče: nahrávání v reálném čase (MediaRecorder) */
"use strict";
(function(){
const X = window.EXP = {};
const E = window.E;

// ---------- ZIP (bez komprese, PNG už je komprimované) ----------
const CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for (let i=0;i<u8.length;i++) c=CRC[(c^u8[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
X.Zip = class {
  constructor(){ this.parts=[]; this.cd=[]; this.off=0; }
  add(name, u8){
    const nb=new TextEncoder().encode(name), crc=crc32(u8);
    const h=new DataView(new ArrayBuffer(30)); h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(8,0,true); h.setUint32(14,crc,true); h.setUint32(18,u8.length,true); h.setUint32(22,u8.length,true); h.setUint16(26,nb.length,true);
    this.parts.push(h.buffer,nb,u8);
    const c=new DataView(new ArrayBuffer(46)); c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint32(16,crc,true); c.setUint32(20,u8.length,true); c.setUint32(24,u8.length,true); c.setUint16(28,nb.length,true); c.setUint32(42,this.off,true);
    this.cd.push(c.buffer,nb); this.off+=30+nb.length+u8.length; this.n=(this.n||0)+1;
  }
  blob(){
    const size=this.cd.reduce((a,b)=>a+(b.byteLength||b.length),0);
    const e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true); e.setUint16(8,this.n,true); e.setUint16(10,this.n,true); e.setUint32(12,size,true); e.setUint32(16,this.off,true);
    return new Blob([...this.parts,...this.cd,e.buffer],{type:'application/zip'});
  }
};

// ---------- ZVUK: originál (nebo ticho) + zvukové efekty ----------
X.buildAudio = async (file, duration, mute, ovAudio, blobs) => {
  const RATE=48000;
  let decoded=null;
  if (!mute){ try{ decoded=await decodeVideoAudio(file); }catch(e){ console.warn('Video nemá zvuk',e); } }
  const ch=decoded?Math.min(2,decoded.numberOfChannels):2;
  const off=new OfflineAudioContext(ch,Math.ceil(duration*RATE),RATE);
  if (decoded){
    // zpomalené / zrychlené úseky jsou bez zvuku (jen se posune čas)
    if (E.clips && E.clips.length){ let o=0; for (const c of E.clips){ if (!c.a && E.clipSp(c)===1){ const s=off.createBufferSource(); s.buffer=decoded; s.connect(off.destination); s.start(o, c.s, c.e-c.s); } o+=E.clipDur(c); } }
    else { const s=off.createBufferSource(); s.buffer=decoded; s.connect(off.destination); s.start(0); }
  }
  // zvuk video overlayů (opakuje se dokola jako obraz overlaye)
  for (const a of (ovAudio||[])){ try{ const b=await off.decodeAudioData(await a.blob.arrayBuffer()); const s=off.createBufferSource(); s.buffer=b; s.loop=true; s.connect(off.destination); s.start(Math.max(0,a.s)); s.stop(Math.min(duration,a.e)); }catch(e){ console.warn('Zvuk overlaye nejde přidat',e); } }
  // vložené klipy (vlastní zvuk) a zvukové stopy (hudba ze zařízení)
  const dec={}; const get=async id=>{ if (dec[id]!==undefined) return dec[id]; dec[id]=null; const b=blobs&&blobs[id]; if (b){ try{ dec[id]=await decodeVideoAudio(b); }catch(e){ console.warn('Zvuk souboru nejde přidat',id,e); } } return dec[id]; };
  if (!mute && E.clips){ let o=0; for (const c of E.clips){ const d=E.clipDur(c); if (c.a && E.clipSp(c)===1){ const b=await get(c.a); if (b){ const g=off.createGain(); g.gain.value=(c.vol??100)/100; g.connect(off.destination); const s=off.createBufferSource(); s.buffer=b; s.connect(g); s.start(o, c.s, Math.min(d, Math.max(0.01,b.duration-c.s))); } } o+=d; } }
  for (const a of E.audios||[]){ if (a.s>=duration) continue; const b=await get(a.asset); if (!b) continue;
    const g=off.createGain(), v=(a.vol??100)/100, len=Math.min(a.e,duration)-a.s, fi=Math.min(a.fi||0,len/2), fo=Math.min(a.fo||0,len/2);
    g.gain.setValueAtTime(fi>0?0:v,a.s); if (fi>0) g.gain.linearRampToValueAtTime(v,a.s+fi); if (fo>0){ g.gain.setValueAtTime(v,a.s+len-fo); g.gain.linearRampToValueAtTime(0,a.s+len); }
    g.connect(off.destination); const s=off.createBufferSource(); s.buffer=b; s.connect(g); s.start(a.s, a.off||0, len); }
  const vol=E.G.sfxVol/100;
  for (const ev of E.sfxEvents()) if (ev.t<duration) E.sfxInto(off, off.destination, ev.type==='custom'?ev.t:Math.max(0,ev.t), ev.type, ev.vol??vol, ev.dur, ev.buf);   // ev.vol: zvuky přechodů mají vlastní hlasitost
  const out=await off.startRendering();
  // limiter: zvuky navrch hlasitého videa nesmí přebudit (zesílení se hned stáhne a pomalu vrátí, ~60 ms)
  const CH=out.numberOfChannels, n=out.length, lim=0.89, rel=Math.exp(-1/(0.06*RATE)); let g=1;
  const data=[...Array(CH)].map((_,c)=>out.getChannelData(c));
  for (let i=0;i<n;i++){ let pk=0; for (let c=0;c<CH;c++){ const v=Math.abs(data[c][i]); if (v>pk) pk=v; }
    const need = pk>lim ? lim/pk : 1; g = need<g ? need : 1-(1-g)*rel; if (g<1) for (let c=0;c<CH;c++) data[c][i]*=g; }
  return out;
};

async function pickVideoCodec(w,h,fps,br){
  const bitrate=Math.round(w*h*Math.min(fps,30)*(br||0.12)); // ~7,5 Mb/s u 1080p30 – kvalita pro sociální sítě, menší soubor
  const cands=[
    {codec:'avc1.640034', mux:'avc'},{codec:'avc1.640033', mux:'avc'},{codec:'avc1.64002A', mux:'avc'},{codec:'avc1.4d0034', mux:'avc'},
    {codec:'hvc1.1.6.L153.B0', mux:'hevc'},
    {codec:'vp09.00.51.08', mux:'vp9'},{codec:'vp09.00.41.08', mux:'vp9'},{codec:'av01.0.12M.08', mux:'av1'}
  ];
  // nejdřív hardwarový kodér (výrazně rychlejší, hlavně na iPhonu), pak jakýkoli
  for (const hw of ['prefer-hardware', null]) for (const c of cands){
    const cfg={codec:c.codec,width:w,height:h,bitrate,framerate:fps,latencyMode:'quality'};
    if (hw) cfg.hardwareAcceleration=hw;
    if (c.mux==='avc') cfg.avc={format:'avc'};
    try{ const s=await VideoEncoder.isConfigSupported(cfg); if (s.supported) return {cfg,mux:c.mux}; }catch(e){}
  }
  return null;
}
async function pickAudioCodec(ch,rate){
  for (const c of [{codec:'mp4a.40.2',mux:'aac'},{codec:'opus',mux:'opus'}]){
    const cfg={codec:c.codec,numberOfChannels:ch,sampleRate:rate,bitrate:256000};
    try{ const s=await AudioEncoder.isConfigSupported(cfg); if (s.supported) return {cfg,mux:c.mux}; }catch(e){}
  }
  return null;
}
X.canPrecise = () => !!(window.VideoEncoder && window.VideoFrame && window.Mp4Muxer);

function seek(v,t){ return new Promise(r=>{ let ok=false; const done=()=>{ if(ok) return; ok=true; v.removeEventListener('seeked',done); r(); }; v.addEventListener('seeked',done); v.currentTime=t; setTimeout(done,4000); }); }
// počká, až prohlížeč opravdu vykreslí snímek (Safari/Chrome)
function frameReady(v){ return new Promise(r=>{ if (v.requestVideoFrameCallback){ let ok=false; v.requestVideoFrameCallback(()=>{ ok=true; r(); }); setTimeout(()=>{ if(!ok) r(); },120); } else r(); }); }

/* opts: {file, src(url), w, h, fps, mode:'full'|'captions', mute, behind(bool), onP(pct,msg), cancel:{v:false}} */
X.exportVideo = async (opts) => {
  const {w,h,fps,onP}=opts;
  const v=document.createElement('video'); v.src=opts.src; v.muted=true; v.playsInline=true; v.preload='auto';
  // iPhone u nespuštěného videa nevyvolá loadeddata → stačí metadata (snímky se pak čtou přetáčením / dekodérem)
  await new Promise((r,j)=>{ let ok=false; const done=()=>{ if(!ok){ ok=true; r(); } }; v.onloadedmetadata=done; v.onloadeddata=done; v.onerror=()=>j(new Error('Video nejde načíst')); v.load(); setTimeout(()=>{ if(!ok) j(new Error('Video se nenačetlo')); },40000); });
  if (!E.srcDur) E.srcDur=v.duration;
  const cut=!!(E.clips&&E.clips.length), dur=cut?E.outDur():v.duration, N=Math.floor(dur*fps);
  const o2s=t=>cut?E.out2src(t):t;
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const prev=E._attached; E.attach(cv,v);
  const transparent = opts.mode==='captions';
  E.flags.transparent=transparent; E.flags.exporting=true;
  const prevMask=E.personMask;
  try{
    if (transparent){
      // ---------- jen titulky: PNG sekvence ----------
      const zip=new X.Zip();
      for (let i=0;i<N;i++){
        if (opts.cancel&&opts.cancel.v) throw new Error('Zrušeno');
        const t=i/fps;
        E.render(t);
        const b=await new Promise(r=>cv.toBlob(r,'image/png'));
        zip.add(`titulky_${String(i).padStart(5,'0')}.png`, new Uint8Array(await b.arrayBuffer()));
        if (i%5===0) onP(i/N, `Snímek ${i+1} / ${N}`);
      }
      if (E.wantOutro()){ const M=Math.round(E.OUTRO_SEC*fps), c2=cv.getContext('2d'); for (let j=0;j<M;j++){ E.drawOutro(c2,w,h,j/fps); const b=await new Promise(r=>cv.toBlob(r,'image/png')); zip.add(`titulky_${String(N+j).padStart(5,'0')}.png`, new Uint8Array(await b.arrayBuffer())); } }
      zip.add('JAK_POUZIT.txt', new TextEncoder().encode(`EFEKTIVE Captions – jen titulky (průhledné pozadí)\n\nSnímků: ${N}\nSnímková frekvence: ${fps} fps\nRozlišení: ${w}×${h}\n\nCapCut / Premiere / DaVinci / Final Cut: importuj jako sekvenci obrázků (image sequence) s ${fps} fps a polož ji na stopu nad video. Začíná v čase 0:00.\n`));
      return {blob:zip.blob(), name:'efektive-titulky-pruhledne.zip'};
    }
    // ---------- celé video ----------
    const vc=await pickVideoCodec(w,h,fps,opts.br); if (!vc) throw new Error('Tento prohlížeč neumí kódovat video');
    onP(0,'Připravuju zvuk…');
    // Zvuk: bez zvukových efektů (nebo když prohlížeč neumí kódovat zvuk – iPhone) se vloží původní stopa
    // bez překódování → vždy se zvukem, rychle a v původní kvalitě. Se SFX se zvuk smíchá a zakóduje.
    const music=!!(E.audios&&E.audios.some(a=>a.s<dur && (a.vol??100)>0)), ext=!!(E.clips&&E.clips.some(c=>c.a));
    const sfxOn=E.sfxEvents().some(ev=>ev.t<dur) || (opts.ovAudio&&opts.ovAudio.length>0) || music || (ext && !opts.mute);
    let raw=null, audio=null, ac=null, audioNote='';
    if (!opts.mute && (!sfxOn || !window.AudioEncoder)){ try{ raw=window.rawAudioTrack?await rawAudioTrack(opts.file):null; }catch(e){ console.warn('Původní zvuk nejde převzít',e); } }
    const fxOnly=E.sfxEvents().some(ev=>ev.t<dur);   // zvukové efekty i u ztlumeného videa
    if (!raw && window.AudioEncoder && (!opts.mute || music || fxOnly)){
      audio=await X.buildAudio(opts.file, dur, opts.mute, opts.ovAudio, opts.blobs);
      ac=await pickAudioCodec(audio.numberOfChannels,audio.sampleRate);
    }
    if (raw && sfxOn) audioNote='zvukové efekty, hudbu a zvuk vložených klipů tento prohlížeč neumí přimíchat';
    else if (!raw && !ac && music && !window.AudioEncoder) audioNote='hudbu tento prohlížeč neumí přidat';
    if (!raw && !ac && !opts.mute) audioNote='zvuk se nepodařilo přidat';
    const target=new Mp4Muxer.ArrayBufferTarget();
    const muxer=new Mp4Muxer.Muxer({ target, fastStart:'in-memory', firstTimestampBehavior:'offset',
      video:{codec:vc.mux,width:w,height:h,frameRate:fps},
      audio: raw?{codec:'aac',numberOfChannels:raw.ch,sampleRate:raw.rate}:ac?{codec:ac.mux,numberOfChannels:audio.numberOfChannels,sampleRate:audio.sampleRate}:undefined });
    if (raw){
      const meta={decoderConfig:{codec:raw.codec,sampleRate:raw.rate,numberOfChannels:raw.ch,description:raw.dsi}};
      let first=true;
      let lastOut=-1;
      const put=(smp,ts)=>{ if (ts<=lastOut) ts=lastOut+smp.dur; if (ts < -smp.dur/2 || ts >= dur) return; muxer.addAudioChunkRaw(smp.data,'key',Math.max(0,Math.round(ts*1e6)),Math.round(smp.dur*1e6),first?meta:undefined); first=false; lastOut=ts; };
      if (cut){
        // po úsecích: stejný kus zvuku se může použít víckrát (prodloužený úsek překrývá další)
        let o=0; for (const c of E.clips){ const d=E.clipDur(c); if (!c.a && E.clipSp(c)===1){ for (const smp of raw.samples){ const ts0=smp.ts-raw.skip, mid=ts0+smp.dur/2; if (mid<c.s) continue; if (mid>=c.e) break; put(smp, o+(ts0-c.s)); } } o+=d; }
      } else for (const smp of raw.samples) put(smp, smp.ts-raw.skip);
      raw.samples=null;
    }
    let err=null;
    const venc=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m), error:e=>{ err=e; }});
    venc.configure(vc.cfg);
    if (ac){
      const aenc=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m), error:e=>{ err=e; }});
      aenc.configure(ac.cfg);
      const CH=audio.numberOfChannels, R=audio.sampleRate, block=R; // 1 s bloky
      for (let s=0;s<audio.length;s+=block){
        const n=Math.min(block,audio.length-s), data=new Float32Array(n*CH);
        for (let c=0;c<CH;c++) data.set(audio.getChannelData(c).subarray(s,s+n), c*n);
        const ad=new AudioData({format:'f32-planar',sampleRate:R,numberOfFrames:n,numberOfChannels:CH,timestamp:Math.round(s/R*1e6),data});
        aenc.encode(ad); ad.close();
      }
      await aenc.flush(); aenc.close();
    }
    const ctxBehind = opts.behind && window.AI && !(window.PERSON && PERSON.data);   // nová maska postavy je předpočítaná → rychlá cesta
    // rychlá cesta: snímky se dekódují postupně (MP4/MOV), bez přetáčení; text za postavou potřebuje <video> → přetáčení
    let src=null;
    if (!ctxBehind && window.openFrameSource){ try{ src=await openFrameSource(opts.file, v.videoWidth, v.videoHeight); }catch(e){ console.warn('Rychlé čtení snímků nejde, použiji přetáčení',e); } }
    // VIDEO OVERLAYE: snímky se čtou postupně (WebCodecs) jako u hlavního videa – přetáčení <video> na každý snímek je na iPhonu velmi pomalé
    const OVS=[];
    if (window.openFrameSource) for (const o of E.overlays){
      if (!o.src || o.src.tagName!=='VIDEO') continue; const blob=opts.ovBlobs&&opts.ovBlobs[o.asset]; if (!blob) continue;
      try{ const s=await openFrameSource(blob,o.src.videoWidth,o.src.videoHeight); if (s && s.times && s.times.length){ const vw=o.src.videoWidth, vh=o.src.videoHeight, k=Math.min(1,1280/Math.max(vw,vh)), c=document.createElement('canvas'); c.width=Math.round(vw*k); c.height=Math.round(vh*k); OVS.push({o,s,c,blob,last:-1}); } }catch(e){ console.warn('Overlay – rychlé čtení nejde, použiji přetáčení',e); }
    }
    // VLOŽENÉ KLIPY (jiná videa): postupné čtení snímků; když nejde, přetáčení jejich přehrávače
    const XS={};
    for (const c of (E.clips||[])){ if (!c.a || XS[c.a]) continue; const el=E.assetEl&&E.assetEl(c.a), blob=opts.blobs&&opts.blobs[c.a]; const q={el,blob,s:null,c:null,last:-1}; XS[c.a]=q;
      if (window.openFrameSource && blob && el){ try{ const fs=await openFrameSource(blob,el.videoWidth,el.videoHeight); if (fs && fs.times && fs.times.length){ const k=Math.min(1,1920/Math.max(el.videoWidth,el.videoHeight)); q.c=document.createElement('canvas'); q.c.width=Math.round(el.videoWidth*k); q.c.height=Math.round(el.videoHeight*k); q.s=fs; } }catch(e){ console.warn('Vložený klip – rychlé čtení nejde',e); } } }
    const extFrame=async t=>{ const x=E.extClipAt(t); if (!x) return null; const q=XS[x.c.a]; if (!q) return ()=>{};
      if (q.s){ if (x.ts<q.last-0.001){ try{ q.s.close(); q.s=await openFrameSource(q.blob,q.el.videoWidth,q.el.videoHeight); }catch(e){} }
        if (Math.abs(x.ts-q.last)>1e-6){ q.last=x.ts; const fr=q.s&&await q.s.frameAt(x.ts); if (fr){ const g=q.c.getContext('2d'); q.s.draw(g,fr,q.c.width,q.c.height); } }
        return (c,W,H)=>{ c.fillStyle='#000'; c.fillRect(0,0,W,H); E.drawCover(c,q.c,q.c.width,q.c.height,W,H); }; }
      const el=q.el; if (!el) return ()=>{}; el.pause(); if (Math.abs(el.currentTime-x.ts)>0.001){ await seek(el,x.ts); await frameReady(el); }
      return (c,W,H)=>{ c.fillStyle='#000'; c.fillRect(0,0,W,H); E.drawCover(c,el,el.videoWidth,el.videoHeight,W,H); }; };
    const ovFrames=async t=>{ for (const q of OVS){ const o=q.o; if (t<o.s||t>o.e){ o._frame=null; continue; }
      const want=E.ovTime(o,t);
      if (Math.abs(want-q.last)<1e-6 && o._frame) continue;   // stejný snímek jako minule (60 fps titulky) → nic nepřekreslovat
      if (want<q.last-0.001){ try{ q.s.close(); q.s=await openFrameSource(q.blob,o.src.videoWidth,o.src.videoHeight); }catch(e){} }   // overlay se opakuje dokola → číst znovu od začátku
      q.last=want; const fr=q.s&&await q.s.frameAt(want); if (fr){ const x=q.c.getContext('2d'); x.clearRect(0,0,q.c.width,q.c.height); q.s.draw(x,fr,q.c.width,q.c.height); o._frame=q.c; } } };
    // hlavní video se čte postupně; když další úsek začíná ve zdroji dřív (prodloužený úsek), otevřít čtení znovu
    let srcLast=-1;
    const srcAt=async ts=>{ if (ts<srcLast-0.001){ try{ src.close(); const s2=await openFrameSource(opts.file, v.videoWidth, v.videoHeight); if (s2) src=s2; }catch(e){} IP.cache.clear(); } srcLast=ts; return src.frameAt(ts); };
    const t0=performance.now();
    const PF={ov:0,dec:0,ren:0,enc:0};   // měření: kde export tráví čas
    // ZPOMALENÍ: mezisnímky z dvojice sousedních zdrojových snímků – prolnutí nebo optický tok (tok se počítá jednou na dvojici)
    const IP={cache:new Map(), flows:new Map(), fw:0, fh:0, g1:null, g2:null};
    const ipFrame=async i=>{ if (IP.cache.has(i)) return IP.cache.get(i); const T=src.times; const fr=await srcAt(T[i]+0.0005); const c=document.createElement('canvas'); c.width=w; c.height=h; if (fr) src.draw(c.getContext('2d'),fr,w,h); IP.cache.set(i,c); for (const k of [...IP.cache.keys()]) if (k<i-1) IP.cache.delete(k); return c; };
    const ipGray=c=>{ const fw=320, fh=Math.round(320*h/w)&~1; IP.fw=fw; IP.fh=fh; const t=document.createElement('canvas'); t.width=fw; t.height=fh; const x=t.getContext('2d',{willReadFrequently:true}); x.drawImage(c,0,0,fw,fh); return TRK.gray(x.getImageData(0,0,fw,fh).data); };
    const slowFrame=async (t,ts,mode)=>{
      const T=src.times; let lo=0, hi=T.length-1; while (hi-lo>1){ const m=(lo+hi)>>1; if (T[m]<=ts) lo=m; else hi=m; }
      const i=Math.min(lo,T.length-2), wgt=Math.max(0,Math.min(1,(ts-T[i])/Math.max(1e-4,T[i+1]-T[i])));
      const A=await ipFrame(i), B=await ipFrame(i+1);
      if (wgt<0.03) return c=>c.drawImage(A,0,0,w,h); if (wgt>0.97) return c=>c.drawImage(B,0,0,w,h);
      if (mode==='flow' && window.TRK && window.FX){
        let fl=IP.flows.get(i); if (!fl){ fl=TRK.denseFlow(ipGray(A),ipGray(B),IP.fw,IP.fh,8); IP.flows.clear(); IP.flows.set(i,fl); }
        const out=FX.interp(A,B,fl,wgt); if (out) return c=>c.drawImage(out,0,0,w,h);
      }
      return c=>{ c.drawImage(A,0,0,w,h); c.save(); c.globalAlpha=wgt; c.drawImage(B,0,0,w,h); c.restore(); };
    };
    try{
    for (let i=0;i<N;i++){
      if (opts.cancel&&opts.cancel.v) throw new Error('Zrušeno');
      if (err) throw err;
      const t=i/fps, pf0=performance.now();
      // „plynulé titulky“: titulky v každém snímku (60 fps), video a overlaye se čtou jen 30× za sekundu
      const tv=opts.videoFps? Math.floor(t*opts.videoFps+1e-6)/opts.videoFps : t;
      // překrytí videa novou verzí: přesný snímek v čase t
      await ovFrames(tv); const pf1=performance.now(); PF.ov+=pf1-pf0;
      for (const o of E.overlays){ if (!o.src || o.src.tagName!=='VIDEO' || t<o.s || t>o.e || OVS.some(q=>q.o===o)) continue; o.src.pause(); const want=Math.min(E.ovTime(o,tv),(o.src.duration||1e9)-0.01); if (Math.abs(o.src.currentTime-want)>0.001){ await seek(o.src,want); await frameReady(o.src); } }
      const ck=cut?E.clipList()[E.clipAt(t)]:null, xd=ck&&ck.a?await extFrame(tv):null, slow=!xd && ck && E.clipSp(ck)<1 && (ck.blend||'flow')!=='none' && src && src.times && src.times.length>1;
      if (xd){
        const a=performance.now(); PF.dec+=a-pf1; E.render(t,{frameDraw:xd, frameT:null}); PF.ren+=performance.now()-a;
      } else if (slow){
        const ts=o2s(tv), draw=await slowFrame(t,ts,ck.blend||'flow'); const a=performance.now(); PF.dec+=a-pf1;
        E.render(t,{frameDraw:(c,W,H)=>draw(c), frameT:ts}); PF.ren+=performance.now()-a;
      } else if (src){
        const fr=await srcAt(o2s(tv)); const a=performance.now(); PF.dec+=a-pf1;
        E.render(t, fr ? {frameDraw:(c,W,H)=>src.draw(c,fr,W,H), frameT:fr.timestamp/1e6-(src.first||0)} : {});   // frameT = přesný čas snímku (stabilizace)
        PF.ren+=performance.now()-a;
      } else {
        await seek(v,o2s(tv)); await frameReady(v);
        if (ctxBehind){ try{ const m=await AI.segment(v,Math.round(w/3),Math.round(h/3)); E.personMask=()=>m; }catch(e){} }
        const a=performance.now(); PF.dec+=a-pf1;
        E.render(t); PF.ren+=performance.now()-a;
      }
      const pf2=performance.now();
      const f=new VideoFrame(cv,{timestamp:Math.round(t*1e6),duration:Math.round(1e6/fps)});
      venc.encode(f,{keyFrame:i%(fps*2)===0}); f.close();
      while (venc.encodeQueueSize>8) await new Promise(r=>setTimeout(r,5));
      PF.enc+=performance.now()-pf2;
      if (i%3===0){ const el=(performance.now()-t0)/1000, left=el/(i+1)*(N-i-1); onP(i/N, `Snímek ${i+1} / ${N}`+(i>10?` · zbývá ${left<60?Math.ceil(left)+' s':Math.ceil(left/60)+' min'}`:'')); }
    }
    } finally { if (src) src.close(); for (const q of Object.values(XS)){ try{ q.s&&q.s.close(); }catch(e){} } for (const q of OVS){ try{ q.s&&q.s.close(); }catch(e){} q.o._frame=null; } }
    // závěr s logem EFEKTIVE (zdarma)
    if (E.wantOutro()){
      const M=Math.round(E.OUTRO_SEC*fps), c2=cv.getContext('2d');
      for (let j=0;j<M;j++){
        if (opts.cancel&&opts.cancel.v) throw new Error('Zrušeno');
        E.drawOutro(c2,w,h,j/fps);
        const f=new VideoFrame(cv,{timestamp:Math.round((N+j)/fps*1e6),duration:Math.round(1e6/fps)});
        venc.encode(f,{keyFrame:j===0}); f.close();
        while (venc.encodeQueueSize>8) await new Promise(r=>setTimeout(r,5));
      }
    }
    await venc.flush(); venc.close();
    muxer.finalize();
    return {blob:new Blob([target.buffer],{type:'video/mp4'}), name:'efektive-titulky.mp4', codec:vc.mux+(raw?'+aac':ac?'+'+ac.mux:''), audioNote, method:src?'decode':'seek', prof:PF, codecIn:src?src.codec:'—'};
  } finally {
    E.flags.transparent=false; E.flags.exporting=false; E.personMask=prevMask;
    if (prev) E.attach(prev[0],prev[1]);
    v.removeAttribute('src'); v.load();
  }
};

// ---------- záloha: nahrávání v reálném čase ----------
X.recordRealtime = async (opts) => {
  if (E.clips && E.clips.length>1) throw new Error('Tento prohlížeč neumí export se střihem. Zkus Safari nebo Chrome v novější verzi.');
  const {w,h,onP}=opts; const fps=opts.fps||30;
  const v=document.createElement('video'); v.src=opts.src; v.playsInline=true; v.preload='auto'; v.muted=false;
  await new Promise(r=>{ v.onloadedmetadata=r; v.onloadeddata=r; v.load(); });
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const prev=E._attached; E.attach(cv,v);
  E.flags.exporting=true;
  const ac=new (window.AudioContext||window.webkitAudioContext)(), dest=ac.createMediaStreamDestination();
  const src=ac.createMediaElementSource(v); const g=ac.createGain(); g.gain.value=opts.mute?0:1; src.connect(g); g.connect(dest);
  const stream=cv.captureStream(fps); dest.stream.getAudioTracks().forEach(tr=>stream.addTrack(tr));
  const mime=['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.round(w*h*fps*0.2)}); const chunks=[];
  rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  const events=E.sfxEvents().sort((a,b)=>a.t-b.t); let ei=0;
  await new Promise(res=>{
    rec.onstop=res; rec.start(500); v.currentTime=0; v.play();
    const tick=()=>{ const t=v.currentTime; E.render(t); while(ei<events.length&&events[ei].t<=t){ E.sfxInto(ac,dest,ac.currentTime,events[ei].type,events[ei].vol??E.G.sfxVol/100,events[ei].dur,events[ei].buf); ei++; } onP(t/v.duration,'Nahrávám…'); if (!v.ended) requestAnimationFrame(tick); else if (E.wantOutro()){ const t0=performance.now(), c2=cv.getContext('2d'); const ot=()=>{ const tt=(performance.now()-t0)/1000; E.drawOutro(c2,w,h,tt); if (tt<E.OUTRO_SEC) requestAnimationFrame(ot); else rec.stop(); }; ot(); } else rec.stop(); };
    requestAnimationFrame(tick);
  });
  E.flags.exporting=false;
  if (prev) E.attach(prev[0],prev[1]);
  ac.close();
  return {blob:new Blob(chunks,{type:mime||'video/webm'}), name:'efektive-titulky.'+(mime.includes('mp4')?'mp4':'webm')};
};
})();
