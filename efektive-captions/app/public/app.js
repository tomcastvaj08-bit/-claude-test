// EFEKTIVE Captions – appka (UI, přepis, editace, export snímek po snímku)
"use strict";
const E = window.CaptionEngine;
const $ = id => document.getElementById(id);
const vid = $('vid'), cv = $('cv'), ctx = cv.getContext('2d');
const renderer = E.Renderer();

// ================= STAV =================
let words = [];            // {t, raw, s, e, em}
let pages = [];            // {a, b, s, e, kin, own}
let G = Object.assign({}, E.V8);
let scope = 'all', curPage = 0;
let videoFile = null, fullW = 0, fullH = 0, duration = 0, audioBuf = null;
let exporting = false, dirty = true, lastInfo = null, projKey = null;

const GLOBAL_ONLY = new Set(['wpp', 'punct', 'sfx', 'sfxVol']);
G.sfx = 'none'; G.sfxVol = 60;
function styleOf(k) { const p = pages[k]; return p && p.own ? Object.assign({}, G, p.own) : G; }
const state = { get words() { return words; }, get pages() { return pages; }, styleOf };
function cur() { return Object.assign({}, styleOf(curPage)); }

function setVal(key, val) {
  if (scope === 'one' && pages[curPage] && !GLOBAL_ONLY.has(key)) {
    const p = pages[curPage]; p.own = p.own || {}; p.own[key] = val;
  } else {
    G[key] = val;
  }
  touch();
}
function setMany(obj) { for (const [k, v] of Object.entries(obj)) setVal(k, v); }
function touch() { dirty = true; scheduleSave(); markList(); }

// ================= PÍSMA =================
const FONTS = [
  [E.SF, 900, 'SF Pro Black'], [E.SF, 500, 'SF Pro Medium'], [E.SF, 700, 'SF Pro Bold'], [E.SF, 400, 'SF Pro Regular'],
  ['Inter Tight', 900, 'Inter Tight Black'], ['Inter Tight', 500, 'Inter Tight'], ['Inter Tight', 300, 'Inter Tight Light'],
  ['Inter', 900, 'Inter Black'], ['Inter', 400, 'Inter'],
  ['Montserrat', 900, 'Montserrat Black'], ['Montserrat', 400, 'Montserrat'],
  ['Poppins', 900, 'Poppins Black'], ['Poppins', 600, 'Poppins Semi'], ['Poppins', 300, 'Poppins Light'],
  ['Playfair Display', 900, 'Playfair Black'], ['Playfair Display', 700, 'Playfair'],
  ['Bodoni Moda', 900, 'Didot Black'], ['Bodoni Moda', 700, 'Didot'],
  ['Libre Baskerville', 700, 'Baskerville'], ['Roboto', 900, 'Roboto Black'], ['Rubik', 900, 'Rubik Black'],
  ['Anton', 400, 'Anton'], ['Bebas Neue', 400, 'Bebas'], ['Oswald', 700, 'Oswald'], ['Nunito', 900, 'Nunito Black'],
  ['Courier Prime', 700, 'Courier'], ['Caveat', 700, 'Rukopis'], ['Dancing Script', 700, 'Kaligrafie'],
];
const SAMPLE = 'AaŽluťoučký kůň úpěl ďábelské ódy ĚŠČŘŽÝÁÍÉŮÚ 0123456789';
const fontsLoaded = new Set();
function ensureFonts() {
  const need = new Set();
  const add = S => { need.add(E.fontStr(S.fontMain, S.wMain, false, 40)); need.add(E.fontStr(S.fontEm, S.wEm, S.emItalic, 40)); };
  add(G); pages.forEach(p => p.own && add(Object.assign({}, G, p.own)));
  const todo = [...need].filter(f => !fontsLoaded.has(f));
  if (!todo.length) return Promise.resolve();
  return Promise.all(todo.map(f => document.fonts.load(f, SAMPLE).then(() => fontsLoaded.add(f)).catch(() => {})))
    .then(() => { dirty = true; });
}

// ================= VIDEO =================
function setStatus(msg, pct, n = '', err = false) {
  const st = $('status' + n); st.textContent = msg; st.classList.toggle('err', !!err);
  const b = $('bar' + n);
  if (pct == null) b.hidden = true; else { b.hidden = false; b.firstElementChild.style.width = (clamp01(pct) * 100) + '%'; }
}
const clamp01 = x => Math.max(0, Math.min(1, x));
const fmt = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); };

function outSize(res) {
  const sc = res === 'orig' ? 1 : Math.min(1, (+res) / Math.min(fullW, fullH));
  return [Math.round(fullW * sc / 2) * 2, Math.round(fullH * sc / 2) * 2];
}
function sizeCanvas() { const [w, h] = outSize($('res').value); cv.width = w; cv.height = h; dirty = true; }

function openFile(f) {
  if (!f) return;
  if (vid.src) URL.revokeObjectURL(vid.src);
  videoFile = f; words = []; pages = []; audioBuf = null; curPage = 0; scope = 'all';
  projKey = 'efc:' + f.name + ':' + f.size + ':' + f.lastModified;
  vid.src = URL.createObjectURL(f); vid.load();
}
$('file').addEventListener('change', e => openFile(e.target.files[0]));
const drop = $('pick');
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => openFile(e.dataTransfer.files[0]));
$('newBtn').onclick = () => $('file').click();

vid.addEventListener('loadedmetadata', () => {
  fullW = vid.videoWidth; fullH = vid.videoHeight; duration = vid.duration;
  sizeCanvas();
  $('pick').hidden = true; $('how').hidden = true; $('stage').hidden = false; $('player').hidden = false; $('step2').hidden = false; $('newBtn').hidden = false;
  $('durInfo').textContent = fmt(duration) + (fullW > fullH ? ' · vodorovné video' : '');
  setStatus(fullW > fullH ? 'Video je vodorovné – titulky fungují, ale šablona je laděná na 9:16.' : '', null);
  if (!restore()) { G = Object.assign({}, E.V8, { sfx: 'none', sfxVol: 60 }); syncUI(); }
  vid.currentTime = 0.01;
  ensureFonts();
});
vid.addEventListener('error', () => setStatus('Tohle video prohlížeč neumí otevřít. Zkus ho převést na MP4 (H.264).', null, '', true));
vid.addEventListener('seeked', () => dirty = true);
vid.addEventListener('play', () => { $('icPlay').hidden = true; $('icPause').hidden = false; });
vid.addEventListener('pause', () => { $('icPlay').hidden = false; $('icPause').hidden = true; dirty = true; });
$('playBtn').onclick = togglePlay;
function togglePlay() { if (!duration || exporting) return; if (vid.paused) { audioCtx(); vid.play(); } else vid.pause(); }
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') gotoPage(curPage + 1);
  if (e.code === 'ArrowLeft') gotoPage(curPage - 1);
});

// ================= SMYČKA NÁHLEDU =================
let lastK = -1;
function draw() {
  if (!fullW) return;
  const t = vid.currentTime;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.drawImage(vid, 0, 0, cv.width, cv.height);
  lastInfo = renderer.render(ctx, cv.width, cv.height, t, state);
  if (vid.paused && !exporting) drawBox();
}
function loop() {
  if (!exporting && (dirty || !vid.paused)) {
    dirty = false; draw();
    const t = vid.currentTime, k = E.pageAt(pages, t);
    if (k >= 0 && k !== lastK) {
      if (!vid.paused && G.sfx !== 'none' && t - pages[k].s < 0.15) { const ac = audioCtx(); sfxAt(ac, ac.destination, ac.currentTime, G.sfx, G.sfxVol / 100); }
      curPage = k; markList(); updateNav();
    }
    lastK = k;
    updateScrub(t);
  }
  requestAnimationFrame(loop);
}

// ================= PŘEHRÁVACÍ LIŠTA =================
function updateScrub(t) {
  if (!duration) return;
  const p = clamp01(t / duration) * 100;
  $('scrubFill').style.width = p + '%'; $('scrubKnob').style.left = p + '%';
  $('tm').textContent = fmt(t);
}
function renderMarks() {
  const box = $('marks'); box.innerHTML = '';
  pages.forEach((p, k) => {
    const i = document.createElement('i');
    i.style.left = (p.s / duration * 100) + '%'; i.style.width = Math.max(0.4, (p.e - p.s) / duration * 100 - 0.3) + '%';
    i.dataset.k = k; box.appendChild(i);
  });
  markList();
}
(function scrubber() {
  const el = $('scrub'); let on = false;
  const seek = e => { const r = el.getBoundingClientRect(); vid.currentTime = clamp01((e.clientX - r.left) / r.width) * duration; updateScrub(vid.currentTime); };
  el.addEventListener('pointerdown', e => { if (!duration) return; on = true; el.setPointerCapture(e.pointerId); seek(e); });
  el.addEventListener('pointermove', e => on && seek(e));
  el.addEventListener('pointerup', () => on = false); el.addEventListener('pointercancel', () => on = false);
})();
function fullyVisibleTime(p) {
  const last = words[p.b];
  return Math.max(p.s + 0.6, Math.min(last.s + 0.4, p.e - 0.32));
}
function gotoPage(k) {
  if (!pages.length) return;
  k = Math.max(0, Math.min(pages.length - 1, k));
  curPage = k; vid.pause(); vid.currentTime = Math.min(fullyVisibleTime(pages[k]), pages[k].e - 0.05);
  markList(); updateNav(); if (scope === 'one') syncUI();
}
$('prevCap').onclick = () => gotoPage(curPage - 1);
$('nextCap').onclick = () => gotoPage(curPage + 1);
function updateNav() {
  const p = pages[curPage]; if (!p) return;
  $('capLabel').innerHTML = `Titulek <b>${curPage + 1}</b> z ${pages.length} · ` + escapeHTML(words.slice(p.a, p.b + 1).map(w => w.t).join(' '));
  if (scope === 'one') $('curName').innerHTML = `Měníš jen titulek <b>${curPage + 1}</b>`;
}
const escapeHTML = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ================= RÁMEČEK, PŘESUN A ZVĚTŠENÍ PRSTEM =================
let drag = null, ptrs = new Map(), handle = null;
function drawBox() {
  handle = null;
  if (!lastInfo) return;
  const q = lastInfo.quad, W = cv.width;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pad = W * 0.018;
  const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
  const P = q.map(([x, y]) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1; return [x + dx / d * pad, y + dy / d * pad]; });
  ctx.lineWidth = Math.max(2, W * 0.0026); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.setLineDash([W * 0.012, W * 0.008]);
  ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  const hr = W * 0.026, h = [Math.min(W - hr * 1.2, P[2][0]), Math.min(cv.height - hr * 1.2, P[2][1])];
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = hr * 0.6;
  ctx.beginPath(); ctx.arc(h[0], h[1], hr, 0, Math.PI * 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#000'; ctx.lineWidth = hr * 0.16; ctx.lineCap = 'round';
  const a = hr * 0.42; ctx.beginPath(); ctx.moveTo(h[0] - a, h[1] + a); ctx.lineTo(h[0] + a, h[1] - a);
  ctx.moveTo(h[0] + a * 0.1, h[1] - a); ctx.lineTo(h[0] + a, h[1] - a); ctx.lineTo(h[0] + a, h[1] - a * 0.1);
  ctx.moveTo(h[0] - a, h[1] + a * 0.1); ctx.lineTo(h[0] - a, h[1] + a); ctx.lineTo(h[0] - a * 0.1, h[1] + a); ctx.stroke();
  handle = { x: h[0], y: h[1], r: hr, cx, cy };
  if (drag && drag.mode === 'move') { // bezpečná zóna IG/TikTok + střed
    const H = cv.height; ctx.strokeStyle = 'rgba(255,69,58,.9)'; ctx.lineWidth = Math.max(1.5, W * 0.002); ctx.setLineDash([W * 0.015, W * 0.01]);
    ctx.strokeRect(W * 0.06, H * 0.12, W * 0.88, H * 0.68); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  }
  ctx.restore();
}
function toCanvas(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; }
cv.addEventListener('pointerdown', e => {
  if (exporting || !duration) return;
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  const S = cur();
  if (ptrs.size === 2) { const a = [...ptrs.values()]; drag = { mode: 'pinch', d0: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), size0: S.size }; return; }
  const [x, y] = toCanvas(e);
  if (handle && vid.paused && Math.hypot(x - handle.x, y - handle.y) < handle.r * 2) { drag = { mode: 'resize', size0: S.size, d0: Math.hypot(x - handle.cx, y - handle.cy) }; return; }
  drag = { mode: 'tap', x: e.clientX, y: e.clientY, px: S.posX, py: S.posY };
});
cv.addEventListener('pointermove', e => {
  if (!drag) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  const r = cv.getBoundingClientRect();
  if (drag.mode === 'tap' && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.mode = 'move'; vid.pause(); }
  if (drag.mode === 'move') {
    let px = drag.px + (e.clientX - drag.x) / r.width * 100, py = drag.py + (e.clientY - drag.y) / r.height * 100;
    if (Math.abs(px - 50) < 1.5) px = 50; // přichytí na střed
    setVal('posX', Math.round(Math.max(10, Math.min(90, px)) * 10) / 10); setVal('posY', Math.round(Math.max(12, Math.min(88, py)) * 10) / 10);
  } else if (drag.mode === 'resize') {
    const [x, y] = toCanvas(e); setVal('size', Math.round(Math.max(40, Math.min(160, drag.size0 * Math.hypot(x - handle.cx, y - handle.cy) / Math.max(1, drag.d0)))));
  } else if (drag.mode === 'pinch' && ptrs.size === 2) {
    const a = [...ptrs.values()]; setVal('size', Math.round(Math.max(40, Math.min(160, drag.size0 * Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) / drag.d0))));
  }
  syncValues();
});
function endPtr(e) {
  ptrs.delete(e.pointerId);
  if (ptrs.size === 0) { if (drag && drag.mode === 'tap') togglePlay(); drag = null; dirty = true; }
}
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);

// ================= PŘEPIS =================
async function decodeAudio() {
  if (audioBuf) return audioBuf;
  const ab = await videoFile.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext, tmp = new AC();
  try { audioBuf = await new Promise((res, rej) => { const p = tmp.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); }); }
  finally { tmp.close && tmp.close(); }
  return audioBuf;
}
async function mono16k(buf) {
  const RATE = 16000, off = new OfflineAudioContext(1, Math.ceil(buf.duration * RATE), RATE);
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0);
}
function wavFrom(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Blob([buf], { type: 'audio/wav' });
}
// dělení dlouhého zvuku na kusy ~45 s – řez v nejtišším místě, ať se nepřetne slovo
function cutPoints(d, rate) {
  const cuts = [0], SEG = 45 * rate, WIN = Math.round(0.05 * rate);
  let pos = 0;
  while (d.length - pos > SEG * 1.15) {
    let best = pos + SEG, bestE = Infinity;
    for (let c = pos + 38 * rate; c < Math.min(d.length - WIN, pos + 50 * rate); c += WIN) {
      let e = 0; for (let i = c; i < c + WIN; i++) e += d[i] * d[i];
      if (e < bestE) { bestE = e; best = c + (WIN >> 1); }
    }
    cuts.push(best); pos = best;
  }
  cuts.push(d.length); return cuts;
}
const stripPunct = s => s.replace(/[.,!?;:…"“”„»«)]+$/u, '').replace(/^[„"“«(]+/u, '');
$('aiBtn').onclick = async () => {
  if (!videoFile) return; $('aiBtn').disabled = true;
  try {
    setStatus('Vytahuju zvuk z videa…', 0.04);
    const buf = await decodeAudio(), data = await mono16k(buf), rate = 16000;
    const cuts = cutPoints(data, rate), all = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      setStatus(cuts.length > 2 ? `AI poslouchá a píše text… (${i + 1}/${cuts.length - 1})` : 'AI poslouchá a píše text…', 0.1 + 0.85 * i / (cuts.length - 1));
      const r = await fetch('/api/transcribe?' + new URLSearchParams({ lang: $('lang').value }), { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wavFrom(data.subarray(cuts[i], cuts[i + 1]), rate) });
      const j = await r.json().catch(() => ({ error: 'Server neodpověděl (' + r.status + ')' }));
      if (!r.ok || j.error) throw new Error(j.error || ('Chyba ' + r.status));
      const off = cuts[i] / rate;
      j.words.forEach(w => { const raw = String(w.word).trim(); const t = stripPunct(raw); if (t) all.push({ raw, t, s: w.start + off, e: w.end + off, em: false }); });
    }
    if (!all.length) throw new Error('Ve videu jsem neslyšel žádnou řeč.');
    words = all; afterWords();
    setStatus(`Hotovo · ${words.length} slov, ${pages.length} titulků. Zkontroluj názvy a jména v kroku 3.`, null);
  } catch (err) {
    console.error(err);
    const msg = /decode/i.test(err.message) ? 'Ve videu jsem nenašel zvukovou stopu.' : err.message;
    setStatus('Nepovedlo se: ' + msg, null, '', true);
  } finally { $('aiBtn').disabled = false; }
};
$('manualBtn').onclick = () => {
  const list = $('manualText').value.trim().split(/\s+/).filter(Boolean);
  if (!list.length || !duration) return;
  words = spread(list, 0.2, duration - 0.2); afterWords();
  setStatus('Text je rozložený rovnoměrně po videu – časy uprav opravou textu u titulků.', null);
};
function spread(list, s, e) {
  const tot = list.reduce((a, w) => a + w.length + 2, 0); let t = s; const out = [];
  for (const w of list) { const d = (e - s) * (w.length + 2) / tot; out.push({ raw: w, t: stripPunct(w) || w, s: t, e: t + d * 0.92, em: false }); t += d; }
  return out;
}
function rebuild() {
  // vlastní styl titulku přejde na nový titulek, který začíná slovem ze starého titulku
  const ownOf = []; pages.forEach(p => { if (p.own) for (let i = p.a; i <= p.b; i++) ownOf[i] = p.own; });
  pages = E.buildPages(words, G.wpp, duration);
  const used = new Set();
  pages.forEach(p => { const o = ownOf[p.a]; p.own = o && !used.has(o) ? (used.add(o), o) : (o ? Object.assign({}, o) : null); });
  if (curPage >= pages.length) curPage = Math.max(0, pages.length - 1);
  renderMarks(); renderPages(); checkCrops(); dirty = true; scheduleSave();
}
function afterWords() {
  pages.forEach(p => p.own = null); pages = [];
  rebuild(); revealEditor();
  gotoPage(0);
}
function revealEditor() {
  ['step3', 'step4', 'step5', 'capNav'].forEach(id => $(id).hidden = false);
  $('appLayout').classList.add('ready'); syncUI(); ensureFonts();
}

// ================= SEZNAM TITULKŮ =================
function renderPages() {
  const box = $('pages'); box.innerHTML = '';
  pages.forEach((p, k) => {
    const row = document.createElement('div'); row.className = 'pg'; row.dataset.k = k;
    row.onclick = e => { if (e.target.closest('.w,.ed,input')) return; gotoPage(k); };
    const tm = document.createElement('div'); tm.className = 'tm'; tm.textContent = fmt(p.s);
    const ws = document.createElement('div'); ws.className = 'ws';
    const S = styleOf(k), mainIds = new Set();
    E.groupsOf(p, S, words).forEach(g => g.em && g.ids.forEach(i => mainIds.add(i)));
    for (let i = p.a; i <= p.b; i++) {
      const c = document.createElement('span'); c.className = 'w' + (words[i].em ? ' em' : mainIds.has(i) ? ' main' : ''); c.textContent = words[i].t;
      c.title = 'Ťukni = udělat z tohoto slova hlavní řádek';
      c.onclick = () => { words[i].em = !words[i].em; curPage = k; renderPages(); checkCrops(); touch(); gotoPage(k); };
      ws.appendChild(c);
    }
    const ed = document.createElement('button'); ed.className = 'ed'; ed.setAttribute('aria-label', 'Opravit text');
    ed.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>';
    ed.onclick = () => editPage(k, row, ws);
    row.append(tm, ws, ed); box.appendChild(row);
  });
  markList();
}
function editPage(k, row, ws) {
  const p = pages[k], old = words.slice(p.a, p.b + 1).map(w => w.raw || w.t).join(' ');
  const inp = document.createElement('input'); inp.className = 'edit'; inp.value = old; inp.enterKeyHint = 'done';
  ws.replaceWith(inp); inp.focus(); inp.select();
  let done = false;
  const commit = () => {
    if (done) return; done = true;
    const nw = inp.value.trim();
    if (nw && nw !== old) {
      const list = nw.split(/\s+/).filter(Boolean), prev = words.slice(p.a, p.b + 1);
      // stejný počet slov → zachovat přesné časy, jinak rozložit v rámci titulku
      const repl = list.length === prev.length ? list.map((w, i) => Object.assign({}, prev[i], { raw: w, t: stripPunct(w) || w })) : spread(list, words[p.a].s, words[p.b].e);
      words.splice(p.a, p.b - p.a + 1, ...repl);
      rebuild();
    } else renderPages();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { done = true; renderPages(); } });
  inp.addEventListener('blur', commit);
}
function markList() {
  document.querySelectorAll('.pg').forEach(el => {
    const k = +el.dataset.k, p = pages[k];
    el.classList.toggle('cur', k === curPage); el.classList.toggle('own', !!(p && p.own)); el.classList.toggle('warn', !!(p && p._crop));
  });
  document.querySelectorAll('#marks i').forEach(el => { const k = +el.dataset.k; el.classList.toggle('cur', k === curPage); el.classList.toggle('warn', !!(pages[k] && pages[k]._crop)); });
  const p = pages[curPage];
  $('resetOne').hidden = !(scope === 'one' && p && p.own);
  $('cropBadge').hidden = !(p && p._crop && vid.paused);
}
// kontrola ořezu všech titulků (v plně viditelném okamžiku)
const probe = document.createElement('canvas'), probeCtx = probe.getContext('2d');
let cropTimer = 0;
function checkCrops() {
  clearTimeout(cropTimer);
  cropTimer = setTimeout(() => {
    if (!cv.width) return;
    probe.width = cv.width; probe.height = cv.height;
    const r = E.Renderer();
    pages.forEach((p, k) => { const info = r.render(probeCtx, cv.width, cv.height, fullyVisibleTime(p), state); p._crop = !!(info && (info.cropped || info.fit < 0.999)); });
    markList();
  }, 250);
}

// ================= OVLÁDÁNÍ =================
$('scope').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  scope = b.dataset.v; $('scope').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  document.body.classList.toggle('scope-on', scope === 'one');
  $('curName').innerHTML = scope === 'one' ? `Měníš jen titulek <b>${curPage + 1}</b>` : 'Měníš všechny titulky';
  if (scope === 'one') vid.pause();
  markList(); syncUI();
});
$('resetOne').onclick = () => { if (pages[curPage]) pages[curPage].own = null; touch(); syncUI(); checkCrops(); };
$('resetV8').onclick = () => {
  const keep = { sfx: G.sfx, sfxVol: G.sfxVol, wpp: G.wpp, punct: G.punct };
  G = Object.assign({}, E.V8, keep); pages.forEach(p => p.own = null); touch(); syncUI(); checkCrops(); ensureFonts();
};
$('tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('tabs').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === b.dataset.t));
});

const RANGES = { size: '%', glow: '', shadowA: '%', posY: '%', tilt: '°', tiltX: '°', persp: '', kinetic: '', emScale: '%', track: '', gap: '%', wordGap: '%', sfxVol: '%', wpp: '' };
function paintRange(el) { const p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%'); }
for (const [id, suf] of Object.entries(RANGES)) {
  $(id).addEventListener('input', () => {
    const v = +$(id).value; setVal(id, v); $(id + 'V').textContent = v + suf; paintRange($(id));
    if (id === 'wpp') rebuild();
    if (id === 'tilt') $('tiltWarn').style.color = Math.abs(v) > 24 ? '#ff9f0a' : '';
  });
  $(id).addEventListener('change', checkCrops);
}
['cEm', 'gA', 'gB', 'cText'].forEach(id => $(id).addEventListener('input', e => {
  setVal(id, e.target.value); if (id === 'cEm') setVal('grad', false); if (id === 'gA' || id === 'gB') setVal('grad', true); syncUI();
}));
const SWITCHES = ['grad', 'tiltAlt', 'emItalic', 'wordByWord', 'fadeOut', 'fxShine', 'punct'];
SWITCHES.forEach(id => $(id).addEventListener('change', e => {
  setVal(id, e.target.checked);
  if (id === 'punct') { rebuild(); } if (id === 'emItalic') ensureFonts(); checkCrops();
}));
function chips(id, key, cb) {
  $(id).addEventListener('click', e => {
    const c = e.target.closest('button'); if (!c) return;
    $(id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === c));
    setVal(key, c.dataset.v); cb && cb(c.dataset.v); checkCrops();
  });
}
chips('layout', 'layout'); chips('case', 'case', () => renderPages()); chips('anim', 'anim');
chips('sfx', 'sfx', v => { if (v !== 'none') { const ac = audioCtx(); sfxAt(ac, ac.destination, ac.currentTime + 0.01, v, G.sfxVol / 100); } });

// předvolby barev podle tématu
let autoColor = null;
function renderColorPresets() {
  const box = $('colorPresets'); box.innerHTML = ''; const S = cur();
  const items = E.COLOR_PRESETS.map(p => ({ ...p }));
  items.push({ id: 'auto', name: 'Podle videa', hint: autoColor ? 'dominantní barva ze scény' : 'najde barvu ze scény', set: autoColor ? { grad: false, cEm: autoColor } : null });
  for (const pr of items) {
    const b = document.createElement('button'); b.className = 'preset';
    const on = pr.set && (pr.set.grad ? S.grad && S.gA === pr.set.gA && S.gB === pr.set.gB : !S.grad && S.cEm.toLowerCase() === pr.set.cEm.toLowerCase());
    b.classList.toggle('on', !!on);
    const style = pr.set ? (pr.set.grad ? `background:linear-gradient(${pr.set.gA},${pr.set.gB});-webkit-background-clip:text;background-clip:text;color:transparent` : `color:${pr.set.cEm}`) : 'background:conic-gradient(#ff453a,#ffd60a,#30d158,#0a84ff,#bf5af2,#ff453a);-webkit-background-clip:text;background-clip:text;color:transparent';
    b.innerHTML = `<span class="pv" style="${style}">Aa</span><b>${pr.name}</b><small>${pr.hint}</small>`;
    b.onclick = async () => {
      if (pr.id === 'auto') { b.querySelector('small').textContent = 'hledám barvu…'; autoColor = await suggestColor(); setMany({ grad: false, cEm: autoColor }); }
      else setMany(pr.set);
      syncUI();
    };
    box.appendChild(b);
  }
}
// náklon podle prostoru ve scéně (hodnoty z návodu)
const TILT_PRESETS = [
  { name: 'Střídat (v8)', hint: '18° doprava / doleva', set: { tilt: 18, tiltX: 4, tiltAlt: true }, r: 'rotateY(-24deg)' },
  { name: 'Rovně', hint: 'bez náklonu', set: { tilt: 0, tiltX: 0, tiltAlt: false }, r: 'none' },
  { name: 'Polička', hint: 'regál, levá strana blíž', set: { tilt: -20, tiltX: 6, tiltAlt: false }, r: 'rotateY(26deg) rotateX(8deg)' },
  { name: 'Polička zprava', hint: 'pravá strana blíž', set: { tilt: 20, tiltX: 6, tiltAlt: false }, r: 'rotateY(-26deg) rotateX(8deg)' },
  { name: 'Na stůl / sud', hint: 'položený na desku', set: { tilt: 16, tiltX: 8, tiltAlt: true }, r: 'rotateY(-20deg) rotateX(12deg)' },
];
function renderTiltPresets() {
  const box = $('tiltPresets'); box.innerHTML = ''; const S = cur();
  for (const pr of TILT_PRESETS) {
    const b = document.createElement('button'); b.className = 'preset';
    b.classList.toggle('on', S.tilt === pr.set.tilt && S.tiltX === pr.set.tiltX && !!S.tiltAlt === pr.set.tiltAlt);
    b.innerHTML = `<span class="tiltpv"><span style="transform:${pr.r}"></span></span><b>${pr.name}</b><small>${pr.hint}</small>`;
    b.onclick = () => { setMany(pr.set); syncUI(); checkCrops(); };
    box.appendChild(b);
  }
}
let fontTarget = 'em';
$('fontTarget').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; fontTarget = b.dataset.v;
  $('fontTarget').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); syncFonts();
});
function buildFontGrid() {
  const box = $('fontgrid'); box.innerHTML = '';
  FONTS.forEach(([fam, w, label]) => {
    const b = document.createElement('button'); b.dataset.f = fam; b.dataset.w = w;
    b.style.fontFamily = fam.includes(',') ? fam : `"${fam}"`; b.style.fontWeight = w;
    b.innerHTML = `Aa<small>${label}</small>`;
    b.onclick = () => { if (fontTarget === 'em') setMany({ fontEm: fam, wEm: w }); else setMany({ fontMain: fam, wMain: w }); syncFonts(); ensureFonts().then(checkCrops); };
    box.appendChild(b);
  });
}
function syncFonts() {
  const S = cur(), f = fontTarget === 'em' ? S.fontEm : S.fontMain, w = fontTarget === 'em' ? S.wEm : S.wMain;
  $('fontgrid').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === f && +b.dataset.w === +w));
}
function syncValues() {
  const S = cur();
  for (const [id, suf] of Object.entries(RANGES)) { const el = $(id); el.value = S[id]; $(id + 'V').textContent = S[id] + suf; paintRange(el); }
}
function syncUI() {
  const S = cur();
  syncValues();
  ['cEm', 'gA', 'gB', 'cText'].forEach(id => $(id).value = S[id]);
  SWITCHES.forEach(id => $(id).checked = !!S[id]);
  [['layout', 'layout'], ['case', 'case'], ['anim', 'anim'], ['sfx', 'sfx']].forEach(([id, k]) => $(id).querySelectorAll('button').forEach(c => c.classList.toggle('on', c.dataset.v === String(S[k]))));
  syncFonts(); renderColorPresets(); renderTiltPresets(); markList(); updateNav();
  dirty = true;
}

// ================= BARVA PODLE VIDEA =================
// najde výraznou barvu ve scéně, která se ale liší od pozadí pod titulkem (aby byla čitelná)
async function suggestColor() {
  const v = helperVideo(), c = document.createElement('canvas'), W = 72, H = Math.round(72 * fullH / fullW);
  c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
  const all = new Float32Array(36), zone = new Float32Array(36); let zoneL = 0, zn = 0;
  for (const f of [0.12, 0.3, 0.5, 0.7, 0.88]) {
    await seekTo(v, duration * f); x.drawImage(v, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0;
      const y = Math.floor(i / 4 / W) / H, inZone = y > 0.6 && y < 0.85;
      if (inZone) { zoneL += 0.2126 * r + 0.7152 * g + 0.0722 * b; zn++; }
      if (s < 0.35 || mx < 0.25) continue;
      let h = mx === r ? (g - b) / (mx - mn) : mx === g ? 2 + (b - r) / (mx - mn) : 4 + (r - g) / (mx - mn); h = (h * 60 + 360) % 360;
      const bin = Math.floor(h / 10) % 36, wgt = s * s * mx;
      all[bin] += wgt; if (inZone) zone[bin] += wgt;
    }
  }
  v.remove();
  // velké plochy (nebe, tráva, zeď) jsou pozadí → preferujeme výrazné akcenty (produkt, značka)
  const zoneHue = zone.indexOf(Math.max(...zone)) * 10 + 5, total = all.reduce((a, b) => a + b, 0) || 1;
  const near = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 360 - d); };
  let best = -1, bestW = 0;
  for (let i = 0; i < 36; i++) {
    if (!all[i]) continue;
    const h = i * 10 + 5, share = (all[(i + 35) % 36] + all[i] + all[(i + 1) % 36]) / total;
    let w = Math.sqrt(all[i]);
    if (share > 0.3) w *= 0.25;                                   // dominantní plocha = pozadí
    if (Math.max(...zone) > 0 && near(h, zoneHue) < 40) w *= 0.1; // splývalo by s pozadím pod titulkem
    if (w > bestW) { bestW = w; best = h; }
  }
  if (best < 0) return '#e4202c';
  const bright = zn ? zoneLsafe(zoneL / zn) : 0.4;
  return hsl(best, 0.88, bright > 0.6 ? 0.42 : 0.52);
}
const zoneLsafe = x => isFinite(x) ? x : 0.4;
function hsl(h, s, l) {
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
function helperVideo() {
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = vid.src;
  v.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px'; document.body.appendChild(v); return v;
}
function seekTo(v, t) {
  return new Promise(res => {
    const go = () => {
      if (Math.abs(v.currentTime - t) < 1e-4 && v.readyState >= 2) return res();
      const to = setTimeout(res, 4000);
      v.addEventListener('seeked', () => { clearTimeout(to); res(); }, { once: true });
      v.currentTime = t;
    };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true });
  });
}

// ================= MOZAIKA – kontrola všech titulků =================
$('mosaicBtn').onclick = async () => {
  if (!pages.length) return; vid.pause();
  $('mosaic').hidden = false; const box = $('mgrid'); box.innerHTML = '';
  const v = helperVideo(), big = document.createElement('canvas'), bc = big.getContext('2d'), r = E.Renderer();
  big.width = cv.width; big.height = cv.height;
  let warn = 0;
  for (let k = 0; k < pages.length; k++) {
    if ($('mosaic').hidden) break;
    const t = fullyVisibleTime(pages[k]); await seekTo(v, t);
    bc.drawImage(v, 0, 0, big.width, big.height); const info = r.render(bc, big.width, big.height, t, state);
    const fig = document.createElement('figure'), c = document.createElement('canvas');
    c.width = 300; c.height = Math.round(300 * big.height / big.width); c.getContext('2d').drawImage(big, 0, 0, c.width, c.height);
    const crop = info && (info.cropped || info.fit < 0.999); if (crop) { fig.className = 'warn'; warn++; }
    fig.innerHTML = `<figcaption>${k + 1}${crop ? ' · zmenšeno' : ''}</figcaption>`; fig.prepend(c);
    fig.onclick = () => { $('mosaic').hidden = true; gotoPage(k); };
    box.appendChild(fig);
    $('mosaicInfo').textContent = `${k + 1}/${pages.length} · okamžik, kdy jsou vidět všechna slova`;
  }
  v.remove();
  $('mosaicInfo').textContent = `${pages.length} titulků` + (warn ? ` · ${warn}× zmenšeno, aby se vešlo – zvaž menší písmo nebo méně slov` : ' · nic není uříznuté');
};
$('mosaicClose').onclick = () => $('mosaic').hidden = true;

// ================= ZVUKY =================
let actx = null;
function audioCtx() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; }
function sfxAt(ac, dest, t0, kind, vol) {
  const g = ac.createGain(); g.gain.value = vol; g.connect(dest);
  const osc = (type, f0, f1, dur, v) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur); const gg = ac.createGain(); gg.gain.setValueAtTime(0.0001, t0); gg.gain.exponentialRampToValueAtTime(v, t0 + 0.004); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + dur + 0.02); };
  const noise = (dur, v, f, q = 0.8) => { const n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2); const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; const gg = ac.createGain(); gg.gain.value = v; s.connect(fl); fl.connect(gg); gg.connect(g); s.start(t0); };
  if (kind === 'soft') { noise(0.025, 0.6, 3500, 1.2); osc('sine', 1800, 900, 0.03, 0.12); }
  else if (kind === 'tick') osc('sine', 3200, 2600, 0.02, 0.3);
  else if (kind === 'pop') osc('sine', 700, 240, 0.09, 0.45);
  else if (kind === 'whoosh') { const n = Math.ceil(ac.sampleRate * 0.35), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n); const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = 1.4; fl.frequency.setValueAtTime(400, t0); fl.frequency.exponentialRampToValueAtTime(2400, t0 + 0.35); const gg = ac.createGain(); gg.gain.value = 0.5; s.connect(fl); fl.connect(gg); gg.connect(g); s.start(t0); }
}

// ================= EXPORT (snímek po snímku, 60 fps, WebCodecs) =================
let cancelExport = false;
$('cancelExport').onclick = () => cancelExport = true;
$('res').addEventListener('change', () => { sizeCanvas(); checkCrops(); });
async function pickVideoCodec(w, h, fps) {
  if (!window.VideoEncoder) return null;
  const bitrate = Math.round(w * h * fps * 0.13); // ~16 Mb/s u 1080×1920@60 ≈ kvalita CRF 16
  for (const codec of ['avc1.64002a', 'avc1.640028', 'avc1.4d002a', 'avc1.42002a']) {
    const cfg = { codec, width: w, height: h, bitrate, framerate: fps, avc: { format: 'avc' }, latencyMode: 'quality' };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return { cfg, kind: 'avc' }; } catch (e) {}
  }
  const vp9 = { codec: 'vp09.00.40.08', width: w, height: h, bitrate, framerate: fps, latencyMode: 'quality' };
  try { if ((await VideoEncoder.isConfigSupported(vp9)).supported) return { cfg: vp9, kind: 'vp9' }; } catch (e) {}
  return null;
}
async function pickAudioCodec(rate, ch) {
  if (!window.AudioEncoder) return null;
  for (const [codec, kind] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
    const cfg = { codec, sampleRate: rate, numberOfChannels: ch, bitrate: 192000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { cfg, kind }; } catch (e) {}
  }
  return null;
}
// původní zvuk + zvukové efekty smíchané offline (přesně na snímek)
async function mixAudio(rate) {
  let buf = null; try { buf = await decodeAudio(); } catch (e) { return null; }
  const len = Math.ceil(duration * rate), off = new OfflineAudioContext(2, len, rate);
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start(0);
  if (G.sfx !== 'none') pages.forEach(p => sfxAt(off, off.destination, p.s, G.sfx, G.sfxVol / 100));
  return off.startRendering();
}
$('exportBtn').onclick = async () => {
  if (exporting || !pages.length && !confirm('Video zatím nemá titulky. Uložit i tak?')) return;
  exporting = true; cancelExport = false; vid.pause();
  $('exportBtn').disabled = true; $('cancelExport').hidden = false;
  const fps = +$('fps').value, [W, H] = outSize($('res').value);
  try {
    const vc = await pickVideoCodec(W, H, fps);
    if (!vc) { await exportRealtime(fps); return; }
    setStatus('Připravuju zvuk…', 0, '2');
    const rate = 48000, mixed = await mixAudio(rate);
    const ac = mixed ? await pickAudioCodec(rate, 2) : null;
    const useMp4 = vc.kind === 'avc' && (!ac || ac.kind === 'aac' || ac.kind === 'opus');
    let muxer, target;
    if (useMp4) {
      target = new Mp4Muxer.ArrayBufferTarget();
      muxer = new Mp4Muxer.Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: fps }, audio: ac ? { codec: ac.kind, numberOfChannels: 2, sampleRate: rate } : undefined, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
    } else {
      target = new WebMMuxer.ArrayBufferTarget();
      muxer = new WebMMuxer.Muxer({ target, video: { codec: 'V_VP9', width: W, height: H, frameRate: fps }, audio: ac ? { codec: 'A_OPUS', numberOfChannels: 2, sampleRate: rate } : undefined, firstTimestampBehavior: 'offset' });
    }
    let encErr = null;
    const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => encErr = e });
    venc.configure(vc.cfg);
    let aenc = null;
    if (ac) { aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => encErr = e }); aenc.configure(ac.cfg); }
    const L = mixed && mixed.getChannelData(0), R = mixed && mixed.getChannelData(1), CH = 4800;
    let aPos = 0;
    const feedAudio = upto => {
      if (!aenc) return;
      const end = Math.min(L.length, Math.ceil(upto * rate));
      while (aPos < end) {
        const n = Math.min(CH, L.length - aPos), data = new Float32Array(n * 2);
        data.set(L.subarray(aPos, aPos + n), 0); data.set(R.subarray(aPos, aPos + n), n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: rate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(aPos / rate * 1e6), data });
        aenc.encode(ad); ad.close(); aPos += n;
      }
    };
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    const octx = oc.getContext('2d'), r = E.Renderer();
    setStatus('Připravuju video…', 0, '2');
    let src = null; try { src = await openFrameSource(videoFile, fullW, fullH); } catch (e) { console.warn(e); }
    const v = src ? null : helperVideo();
    const N = Math.floor(duration * fps + 1e-6), t0 = performance.now();
    if (v) await seekTo(v, 0);
    for (let i = 0; i < N; i++) {
      if (cancelExport) throw new Error('zrušeno');
      if (encErr) throw encErr;
      const t = i / fps;
      octx.setTransform(1, 0, 0, 1, 0, 0); octx.globalAlpha = 1;
      if (src) { const f = await src.frameAt(t); if (f) src.draw(octx, f, W, H); }
      else { await seekTo(v, Math.min(t, duration - 0.001)); octx.drawImage(v, 0, 0, W, H); }
      r.render(octx, W, H, t, state);
      const fr = new VideoFrame(oc, { timestamp: Math.round(t * 1e6), duration: Math.round(1e6 / fps) });
      venc.encode(fr, { keyFrame: i % (fps * 2) === 0 }); fr.close();
      feedAudio(t + 1 / fps);
      while (venc.encodeQueueSize > 4) await new Promise(res => setTimeout(res, 4));
      if (i % 6 === 0) {
        const el = (performance.now() - t0) / 1000, left = el / (i + 1) * (N - i - 1);
        setStatus(`${src ? '' : 'Pomalý režim · '}Renderuju snímek ${i + 1} z ${N} · zbývá asi ${left < 60 ? Math.ceil(left) + ' s' : Math.ceil(left / 60) + ' min'}`, (i + 1) / N, '2');
        // náhled průběhu do hlavního plátna
        if (cv.width === W) { ctx.drawImage(oc, 0, 0); }
      }
    }
    if (src) src.close(); if (v) v.remove();
    feedAudio(duration + 1);
    setStatus('Dokončuju soubor…', 1, '2');
    await venc.flush(); if (aenc) await aenc.flush();
    muxer.finalize();
    const mime = useMp4 ? 'video/mp4' : 'video/webm';
    await deliver(new Blob([target.buffer], { type: mime }), useMp4 ? 'mp4' : 'webm',
      ac && ac.kind === 'opus' && useMp4 ? ' (zvuk je v Opus – Instagram i telefon ho přehrají, starší QuickTime ne)' : '');
  } catch (err) {
    console.error(err);
    setStatus(err.message === 'zrušeno' ? 'Export zrušený.' : 'Export se nepovedl: ' + err.message, null, '2', err.message !== 'zrušeno');
  } finally {
    exporting = false; $('exportBtn').disabled = false; $('cancelExport').hidden = true; dirty = true;
  }
};
async function deliver(blob, ext, note = '') {
  const base = (videoFile.name.replace(/\.[^.]+$/, '') || 'video') + '-titulky.' + ext;
  const file = new File([blob], base, { type: blob.type });
  const mb = (blob.size / 1048576).toFixed(1);
  setStatus(`Hotovo · ${base} (${mb} MB)${note}`, null, '2');
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = base; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
// záloha pro prohlížeče bez WebCodecs: nahrávání v reálném čase
async function exportRealtime(fps) {
  if (!window.MediaRecorder || !cv.captureStream) throw new Error('tenhle prohlížeč neumí export – použij aktuální Safari nebo Chrome');
  setStatus('Tenhle prohlížeč neumí render po snímcích, nahrávám v reálném čase…', 0, '2');
  const ac = audioCtx(), dest = ac.createMediaStreamDestination();
  if (!vid._src) { vid._src = ac.createMediaElementSource(vid); vid._src.connect(ac.destination); }
  vid._src.connect(dest);
  const stream = new MediaStream([...cv.captureStream(fps).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mime = ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 16e6 } : {});
  const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  vid.currentTime = 0; await new Promise(r => vid.addEventListener('seeked', r, { once: true }));
  exporting = false; rec.start(500);
  const tick = setInterval(() => setStatus(`Nahrávám… ${Math.round(vid.currentTime / duration * 100)} %`, vid.currentTime / duration, '2'), 250);
  const sfxHook = G.sfx !== 'none' ? pages.map(p => p.s) : [];
  const onT = () => { while (sfxHook.length && vid.currentTime >= sfxHook[0]) { sfxHook.shift(); sfxAt(ac, dest, ac.currentTime, G.sfx, G.sfxVol / 100); } };
  vid.addEventListener('timeupdate', onT);
  await vid.play(); await new Promise(r => vid.addEventListener('ended', r, { once: true }));
  await new Promise(r => setTimeout(r, 300)); rec.stop(); await done; clearInterval(tick);
  vid.removeEventListener('timeupdate', onT); vid._src.disconnect(dest);
  const type = (mime || 'video/webm').split(';')[0];
  await deliver(new Blob(chunks, { type }), type.includes('mp4') ? 'mp4' : 'webm');
}

// ================= UKLÁDÁNÍ PROJEKTU =================
let saveTimer = 0;
function scheduleSave() {
  if (!projKey || !words.length) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(projKey, JSON.stringify({ v: 2, words, G, own: pages.map(p => [p.a, p.own]).filter(x => x[1]) }));
      $('saveState').hidden = false;
    } catch (e) {}
  }, 600);
}
function restore() {
  let d = null; try { d = JSON.parse(localStorage.getItem(projKey) || 'null'); } catch (e) {}
  if (!d || d.v !== 2 || !d.words || !d.words.length) return false;
  words = d.words; G = Object.assign({}, E.V8, { sfx: 'none', sfxVol: 60 }, d.G);
  pages = E.buildPages(words, G.wpp, duration);
  const own = new Map(d.own || []); pages.forEach(p => p.own = own.get(p.a) || null);
  renderMarks(); renderPages(); revealEditor(); checkCrops(); gotoPage(0);
  setStatus(`Načetl jsem uložené titulky k tomuhle videu (${words.length} slov). Nový přepis přepíše úpravy.`, null);
  return true;
}

// ================= START =================
buildFontGrid(); syncUI(); ensureFonts();
requestAnimationFrame(loop);

// API pro render v cloudu (render_captions.py) a testy
window.__app = {
  E, get G() { return G; }, get words() { return words; }, get pages() { return pages; },
  load(ws, style, own) {
    words = ws.map(w => { const raw = String(w.word ?? w.raw ?? w.t).trim(); return { raw, t: stripPunct(raw) || raw, s: w.start ?? w.s, e: w.end ?? w.e, em: !!w.em }; }).filter(w => w.t);
    G = Object.assign({}, E.V8, { sfx: 'none', sfxVol: 60 }, style || {});
    pages = E.buildPages(words, G.wpp, duration);
    pages.forEach((p, k) => p.own = own && own[k] ? Object.assign({}, own[k]) : null);
    renderMarks(); renderPages(); revealEditor();
    return pages.map((p, i) => i + ': ' + words.slice(p.a, p.b + 1).map(w => w.t).join(' '));
  },
  fonts: () => ensureFonts(),
  renderAt(t) { exporting = true; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(vid, 0, 0, cv.width, cv.height); return renderer.render(ctx, cv.width, cv.height, t, state); },
  setScope(v) { scope = v; }, setCur(k) { curPage = k; }, setVal, syncUI, gotoPage,
};
