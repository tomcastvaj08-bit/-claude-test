// Sekvenční zdroj snímků pro export: MP4/MOV → mp4box (demux) → VideoDecoder.
// Snímky se dekódují jeden po druhém bez přetáčení – řádově rychlejší než seek na každý snímek.
// Když formát/kodek nejde (např. WebM, HEVC v Chrome), vrací null a export použije přetáčení.
(function (global) {
"use strict";

async function openFrameSource(file, dispW, dispH) {
  if (!global.VideoDecoder || !global.MP4Box || !global.EncodedVideoChunk) return null;
  const buf = await file.arrayBuffer();
  buf.fileStart = 0;
  const mp4 = MP4Box.createFile();
  const info = await new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    mp4.onReady = fin; mp4.onError = () => fin(null);
    try { mp4.appendBuffer(buf); mp4.flush(); } catch (e) { fin(null); }
    setTimeout(() => fin(null), 50);
  });
  if (!info || !info.videoTracks || !info.videoTracks.length) { console.warn('openFrameSource: soubor není MP4/MOV'); return null; }
  const tr = info.videoTracks[0];

  // popis kodeku (avcC / hvcC / vpcC / av1C) pro VideoDecoder
  let description;
  try {
    const trak = mp4.getTrackById(tr.id);
    for (const en of trak.mdia.minf.stbl.stsd.entries) {
      const box = en.avcC || en.hvcC || en.vpcC || en.av1C;
      if (box) { const DS = MP4Box.DataStream || global.DataStream; const s = new DS(undefined, 0, DS.BIG_ENDIAN); box.write(s); description = new Uint8Array(s.buffer, 8); break; }
    }
  } catch (e) { console.warn('openFrameSource: popis kodeku', e); return null; }
  const codec = tr.codec.startsWith('vp08') ? 'vp8' : tr.codec;
  const config = { codec, codedWidth: tr.video.width, codedHeight: tr.video.height, description };
  try { if (!(await VideoDecoder.isConfigSupported(config)).supported) { console.warn('openFrameSource: kodek nepodporovaný', codec); return null; } } catch (e) { console.warn('openFrameSource: kodek', e); return null; }

  // otočení z matice stopy (iPhone ukládá svislá videa naležato + rotace)
  let rot = 0;
  if (tr.matrix) { rot = Math.round(Math.atan2(tr.matrix[1] / 65536, tr.matrix[0] / 65536) * 180 / Math.PI); rot = ((rot % 360) + 360) % 360; }
  const swapped = tr.video.width !== dispW && tr.video.width === dispH;
  if ((rot === 90 || rot === 270) !== swapped) rot = swapped ? 90 : 0;

  // všechny vzorky
  let samples = [];
  mp4.onSamples = (id, user, s) => { for (const x of s) samples.push(x); };
  mp4.setExtractionOptions(tr.id, null, { nbSamples: 1e9 });
  mp4.start(); mp4.flush();
  if (!samples.length) { console.warn('openFrameSource: žádné vzorky'); return null; }
  const first = Math.min(...samples.map(s => s.cts / s.timescale)) * 1e6;

  const queue = []; let err = null, wake = null, si = 0, flushed = false, flushDone = false;
  const dec = new VideoDecoder({
    output: f => { queue.push(f); if (wake) { wake(); wake = null; } },
    error: e => { err = e; if (wake) { wake(); wake = null; } },
  });
  dec.configure(config);
  const feed = () => {
    while (si < samples.length && dec.decodeQueueSize < 6 && queue.length < 4) {
      const s = samples[si++];
      dec.decode(new EncodedVideoChunk({ type: s.is_sync ? 'key' : 'delta', timestamp: Math.round(s.cts / s.timescale * 1e6), duration: Math.round(s.duration / s.timescale * 1e6), data: s.data }));
      s.data = null;
    }
    if (si >= samples.length && !flushed) { flushed = true; dec.flush().then(() => { flushDone = true; if (wake) { wake(); wake = null; } }, e => { err = e; }); }
  };
  let cur = null;
  return {
    rot, codec,
    // vrátí snímek, který má být vidět v čase t (s); t musí růst
    async frameAt(t) {
      const us = t * 1e6 + first + 500;
      for (;;) {
        if (err) throw err;
        while (queue.length && queue[0].timestamp <= us) { if (cur) cur.close(); cur = queue.shift(); }
        if (queue.length || flushDone) return cur || queue[0] || null;
        feed();
        if (!queue.length && !flushDone) await new Promise(r => { wake = r; setTimeout(r, 200); });
      }
    },
    draw(c, frame, W, H) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (rot === 90) { c.translate(W, 0); c.rotate(Math.PI / 2); c.drawImage(frame, 0, 0, H, W); }
      else if (rot === 270) { c.translate(0, H); c.rotate(-Math.PI / 2); c.drawImage(frame, 0, 0, H, W); }
      else if (rot === 180) { c.translate(W, H); c.rotate(Math.PI); c.drawImage(frame, 0, 0, W, H); }
      else c.drawImage(frame, 0, 0, W, H);
      c.restore();
    },
    close() { try { if (cur) cur.close(); queue.forEach(f => f.close()); if (dec.state !== 'closed') dec.close(); } catch (e) {} samples = []; },
  };
}
global.openFrameSource = openFrameSource;
})(window);

// ---------- Zvuk z videa (i z iPhonu) ----------
// Safari často odmítne dekódovat zvuk přímo z .mov/.mp4 s obrazem („Decoding failed“).
// Proto: zkusit napřímo, a když to nejde, vytáhnout jen zvukovou stopu (AAC) do .m4a bez obrazu a dekódovat tu.
(function (global) {
"use strict";
// Původní zvuková stopa (AAC) jako surové vzorky – bez dekódování. Použije se i pro export bez překódování.
async function rawAudioTrack(file) {
  if (!global.MP4Box) return null;
  const buf = await file.arrayBuffer(); buf.fileStart = 0;
  const mp4 = MP4Box.createFile(); let info = null;
  mp4.onReady = i => { info = i; }; mp4.onError = () => {};
  try { mp4.appendBuffer(buf); mp4.flush(); } catch (e) { return null; }
  if (!info || !info.audioTracks || !info.audioTracks.length) return null;
  const tr = info.audioTracks[0];
  if (!/^mp4a/.test(tr.codec)) return null;
  const rate = tr.audio.sample_rate, ch = tr.audio.channel_count;
  let dsi = null;
  try { const en = mp4.getTrackById(tr.id).mdia.minf.stbl.stsd.entries[0]; dsi = en.esds.esd.descs[0].descs[0].data; } catch (e) {}
  if (!dsi) dsi = esdsFromMoov(new Uint8Array(buf));   // .mov z iPhonu: esds je schovaný v boxu „wave“
  if (!dsi) dsi = aacLcConfig(rate, ch);               // nouzově: standardní AAC-LC (iPhone nahrává AAC-LC)
  if (!dsi) return null;
  const samples = [];
  mp4.onSamples = (id, u, s) => { for (const x of s) samples.push({ data: new Uint8Array(x.data), ts: x.cts / x.timescale, dur: x.duration / x.timescale }); };
  mp4.setExtractionOptions(tr.id, null, { nbSamples: 1e9 }); mp4.start(); mp4.flush();
  if (!samples.length) return null;
  // úvodní „priming“ AAC: originál ho schovává přes edit list
  let skip = 0;
  try { const t = mp4.getTrackById(tr.id), e = t.edts && t.edts.elst && t.edts.elst.entries && t.edts.elst.entries[0]; if (e && e.media_time > 0) skip = e.media_time / t.mdia.mdhd.timescale; } catch (e) {}
  const codec = /^mp4a\.40\.\d+$/.test(tr.codec) ? tr.codec : 'mp4a.40.' + ((dsi[0] >> 3) || 2);
  return { codec, rate, ch, dsi, samples, skip: Math.min(0.5, skip) };
}
async function audioOnlyM4A(file) {
  if (!global.Mp4Muxer) return null;
  const a = await rawAudioTrack(file);
  if (!a) return null;
  const target = new Mp4Muxer.ArrayBufferTarget();
  const mux = new Mp4Muxer.Muxer({ target, audio: { codec: 'aac', numberOfChannels: a.ch, sampleRate: a.rate }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
  const meta = { decoderConfig: { codec: a.codec, sampleRate: a.rate, numberOfChannels: a.ch, description: a.dsi } };
  a.samples.forEach((s, i) => mux.addAudioChunkRaw(s.data, 'key', Math.round(s.ts * 1e6), Math.round(s.dur * 1e6), i === 0 ? meta : undefined));
  mux.finalize();
  const out = target.buffer; out.skip = a.skip;
  return out;
}
// AudioSpecificConfig z boxu esds uvnitř moov (najde ho i v QuickTime .mov)
function esdsFromMoov(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let pos = 0, moov = null;
  while (pos + 8 <= u8.length) {
    let size = dv.getUint32(pos); const type = String.fromCharCode(u8[pos + 4], u8[pos + 5], u8[pos + 6], u8[pos + 7]);
    if (size === 1) size = Number(dv.getBigUint64(pos + 8)); else if (size === 0) size = u8.length - pos;
    if (type === 'moov') { moov = [pos, pos + size]; break; }
    if (size < 8) break; pos += size;
  }
  if (!moov) return null;
  for (let i = moov[0]; i < moov[1] - 8; i++) {
    if (u8[i] !== 0x65 || u8[i + 1] !== 0x73 || u8[i + 2] !== 0x64 || u8[i + 3] !== 0x73) continue; // 'esds'
    let p = i + 8; // za typem + verze/flags
    const len = () => { let n = 0, b; do { b = u8[p++]; n = (n << 7) | (b & 0x7f); } while (b & 0x80); return n; };
    if (u8[p++] !== 0x03) continue; len(); p += 2; const fl = u8[p++];
    if (fl & 0x80) p += 2; if (fl & 0x40) p += 1 + u8[p]; if (fl & 0x20) p += 2;
    if (u8[p++] !== 0x04) continue; len(); p += 13;
    if (u8[p++] !== 0x05) continue; const n = len();
    if (n > 0 && n < 64) return u8.slice(p, p + n);
  }
  return null;
}
function aacLcConfig(rate, ch) {
  const idx = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350].indexOf(rate);
  if (idx < 0 || !ch) return null;
  return new Uint8Array([(2 << 3) | (idx >> 1), ((idx & 1) << 7) | (Math.min(ch, 7) << 3)]);
}
async function decodeVideoAudio(file) {
  const AC = global.AudioContext || global.webkitAudioContext;
  const dec = async ab => { const ac = new AC(); try { return await new Promise((res, rej) => { const p = ac.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }); } finally { try { ac.close && ac.close(); } catch (e) {} } };
  try { return await dec(await file.arrayBuffer()); } catch (e) { console.warn('Přímé dekódování zvuku nejde, zkouším zvukovou stopu zvlášť', e); }
  const m4a = await audioOnlyM4A(file);
  if (!m4a) throw new Error('Ve videu jsem nenašel zvuk, který umím přečíst.');
  try {
    const skip = m4a.skip || 0, ab = await dec(m4a);
    if (!(skip > 0)) return ab;
    const from = Math.round(skip * ab.sampleRate), len = Math.max(1, ab.length - from);
    const ctx = new (global.OfflineAudioContext || global.webkitOfflineAudioContext)(ab.numberOfChannels, len, ab.sampleRate);
    const out = ctx.createBuffer(ab.numberOfChannels, len, ab.sampleRate);
    for (let c = 0; c < ab.numberOfChannels; c++) out.copyToChannel(ab.getChannelData(c).subarray(from, from + len), c);
    return out;
  } catch (e) { throw new Error('Zvuk z videa se nepodařilo přečíst. Zkus video uložit znovu (ve Fotkách Sdílet → Uložit video) a nahrát ho znovu.'); }
}
global.audioOnlyM4A = audioOnlyM4A;
global.rawAudioTrack = rawAudioTrack;
global.decodeVideoAudio = decodeVideoAudio;
})(window);
