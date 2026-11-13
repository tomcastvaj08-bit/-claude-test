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
X.buildAudio = async (file, duration, mute) => {
  const RATE=48000;
  let decoded=null;
  if (!mute){ try{ const ac=new (window.AudioContext||window.webkitAudioContext)(); decoded=await ac.decodeAudioData(await file.arrayBuffer()); ac.close&&ac.close(); }catch(e){ console.warn('Video nemá zvuk',e); } }
  const ch=decoded?Math.min(2,decoded.numberOfChannels):2;
  const off=new OfflineAudioContext(ch,Math.ceil(duration*RATE),RATE);
  if (decoded){ const s=off.createBufferSource(); s.buffer=decoded; s.connect(off.destination); s.start(0); }
  const vol=E.G.sfxVol/100;
  for (const ev of E.sfxEvents()) if (ev.t<duration) E.sfxInto(off, off.destination, Math.max(0,ev.t), ev.type, vol);
  return await off.startRendering();
};

async function pickVideoCodec(w,h,fps){
  const bitrate=Math.round(w*h*fps*0.22); // vysoká kvalita (~ CRF 16)
  const cands=[
    {codec:'avc1.640034', mux:'avc'},{codec:'avc1.640033', mux:'avc'},{codec:'avc1.64002A', mux:'avc'},{codec:'avc1.4d0034', mux:'avc'},
    {codec:'hvc1.1.6.L153.B0', mux:'hevc'},
    {codec:'vp09.00.51.08', mux:'vp9'},{codec:'vp09.00.41.08', mux:'vp9'},{codec:'av01.0.12M.08', mux:'av1'}
  ];
  for (const c of cands){
    const cfg={codec:c.codec,width:w,height:h,bitrate,framerate:fps,latencyMode:'quality'};
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
  await new Promise((r,j)=>{ v.onloadeddata=r; v.onerror=()=>j(new Error('Video nejde načíst')); });
  const dur=v.duration, N=Math.floor(dur*fps);
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
      zip.add('JAK_POUZIT.txt', new TextEncoder().encode(`EFEKTIVE Captions – jen titulky (průhledné pozadí)\n\nSnímků: ${N}\nSnímková frekvence: ${fps} fps\nRozlišení: ${w}×${h}\n\nCapCut / Premiere / DaVinci / Final Cut: importuj jako sekvenci obrázků (image sequence) s ${fps} fps a polož ji na stopu nad video. Začíná v čase 0:00.\n`));
      return {blob:zip.blob(), name:'efektive-titulky-pruhledne.zip'};
    }
    // ---------- celé video ----------
    const vc=await pickVideoCodec(w,h,fps); if (!vc) throw new Error('Tento prohlížeč neumí kódovat video');
    onP(0,'Připravuju zvuk…');
    const audio=await X.buildAudio(opts.file, dur, opts.mute);
    const ac=window.AudioEncoder?await pickAudioCodec(audio.numberOfChannels,audio.sampleRate):null;
    const target=new Mp4Muxer.ArrayBufferTarget();
    const muxer=new Mp4Muxer.Muxer({ target, fastStart:'in-memory', firstTimestampBehavior:'offset',
      video:{codec:vc.mux,width:w,height:h,frameRate:fps},
      audio: ac?{codec:ac.mux,numberOfChannels:audio.numberOfChannels,sampleRate:audio.sampleRate}:undefined });
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
    const ctxBehind = opts.behind && window.AI;
    // rychlá cesta: snímky se dekódují postupně (MP4/MOV), bez přetáčení; text za postavou potřebuje <video> → přetáčení
    let src=null;
    if (!ctxBehind && window.openFrameSource){ try{ src=await openFrameSource(opts.file, v.videoWidth, v.videoHeight); }catch(e){ console.warn('Rychlé čtení snímků nejde, použiji přetáčení',e); } }
    const t0=performance.now();
    try{
    for (let i=0;i<N;i++){
      if (opts.cancel&&opts.cancel.v) throw new Error('Zrušeno');
      if (err) throw err;
      const t=i/fps;
      if (src){
        const fr=await src.frameAt(t);
        E.render(t, fr ? {frameDraw:(c,W,H)=>src.draw(c,fr,W,H)} : {});
      } else {
        await seek(v,t); await frameReady(v);
        if (ctxBehind){ try{ const m=await AI.segment(v,Math.round(w/3),Math.round(h/3)); E.personMask=()=>m; }catch(e){} }
        E.render(t);
      }
      const f=new VideoFrame(cv,{timestamp:Math.round(t*1e6),duration:Math.round(1e6/fps)});
      venc.encode(f,{keyFrame:i%(fps*2)===0}); f.close();
      while (venc.encodeQueueSize>8) await new Promise(r=>setTimeout(r,5));
      if (i%3===0){ const el=(performance.now()-t0)/1000, left=el/(i+1)*(N-i-1); onP(i/N, `Snímek ${i+1} / ${N}`+(i>10?` · zbývá ${left<60?Math.ceil(left)+' s':Math.ceil(left/60)+' min'}`:'')); }
    }
    } finally { if (src) src.close(); }
    await venc.flush(); venc.close();
    muxer.finalize();
    return {blob:new Blob([target.buffer],{type:'video/mp4'}), name:'efektive-titulky.mp4', codec:vc.mux+(ac?'+'+ac.mux:'')};
  } finally {
    E.flags.transparent=false; E.flags.exporting=false; E.personMask=prevMask;
    if (prev) E.attach(prev[0],prev[1]);
    v.removeAttribute('src'); v.load();
  }
};

// ---------- záloha: nahrávání v reálném čase ----------
X.recordRealtime = async (opts) => {
  const {w,h,onP}=opts; const fps=opts.fps||30;
  const v=document.createElement('video'); v.src=opts.src; v.playsInline=true; v.preload='auto'; v.muted=false;
  await new Promise(r=>{ v.onloadeddata=r; });
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const prev=E._attached; E.attach(cv,v);
  const ac=new (window.AudioContext||window.webkitAudioContext)(), dest=ac.createMediaStreamDestination();
  const src=ac.createMediaElementSource(v); const g=ac.createGain(); g.gain.value=opts.mute?0:1; src.connect(g); g.connect(dest);
  const stream=cv.captureStream(fps); dest.stream.getAudioTracks().forEach(tr=>stream.addTrack(tr));
  const mime=['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.round(w*h*fps*0.2)}); const chunks=[];
  rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  const events=E.sfxEvents().sort((a,b)=>a.t-b.t); let ei=0;
  await new Promise(res=>{
    rec.onstop=res; rec.start(500); v.currentTime=0; v.play();
    const tick=()=>{ const t=v.currentTime; E.render(t); while(ei<events.length&&events[ei].t<=t){ E.sfxInto(ac,dest,ac.currentTime,events[ei].type,E.G.sfxVol/100); ei++; } onP(t/v.duration,'Nahrávám…'); if (!v.ended) requestAnimationFrame(tick); else rec.stop(); };
    requestAnimationFrame(tick);
  });
  if (prev) E.attach(prev[0],prev[1]);
  ac.close();
  return {blob:new Blob(chunks,{type:mime||'video/webm'}), name:'efektive-titulky.'+(mime.includes('mp4')?'mp4':'webm')};
};
})();
