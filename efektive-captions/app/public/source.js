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
  if (!info || !info.videoTracks || !info.videoTracks.length) return null;
  const tr = info.videoTracks[0];

  // popis kodeku (avcC / hvcC / vpcC / av1C) pro VideoDecoder
  let description;
  try {
    const trak = mp4.getTrackById(tr.id);
    for (const en of trak.mdia.minf.stbl.stsd.entries) {
      const box = en.avcC || en.hvcC || en.vpcC || en.av1C;
      if (box) { const s = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN); box.write(s); description = new Uint8Array(s.buffer, 8); break; }
    }
  } catch (e) { return null; }
  const codec = tr.codec.startsWith('vp08') ? 'vp8' : tr.codec;
  const config = { codec, codedWidth: tr.video.width, codedHeight: tr.video.height, description };
  try { if (!(await VideoDecoder.isConfigSupported(config)).supported) return null; } catch (e) { return null; }

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
  if (!samples.length) return null;
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
