// Přepis řeči na text se slovy a časy.
// 1) ElevenLabs Scribe (ELEVENLABS_API_KEY) – nejlepší čeština, preferovaný
// 2) OpenAI Whisper (OPENAI_API_KEY) – záloha
// Klíče jsou jen na serveru, do telefonu se nedostanou.

function readBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new Error('Zvuk je moc velký')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

async function scribe(audio, lang, key) {
  const form = new FormData();
  form.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
  form.append('model_id', process.env.ELEVENLABS_STT_MODEL || 'scribe_v1');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  if (lang) form.append('language_code', lang);
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: form });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j?.detail?.message || j?.detail || 'Chyba ElevenLabs'), { status: r.status });
  const words = (j.words || []).filter(w => w.type === 'word').map(w => ({ word: w.text, start: w.start, end: w.end }));
  return { words, text: j.text || '', engine: 'scribe' };
}

async function whisper(audio, lang, key) {
  const form = new FormData();
  form.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
  form.append('model', 'whisper-1');
  form.append('temperature', '0');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  if (lang) form.append('language', lang);
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j?.error?.message || 'Chyba OpenAI'), { status: r.status });
  const words = (j.words || []).map(w => ({ word: w.word, start: w.start, end: w.end }));
  return { words, text: j.text || '', engine: 'whisper' };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Použij POST' });
  const el = process.env.ELEVENLABS_API_KEY, oa = process.env.OPENAI_API_KEY;
  if (!el && !oa) return send(res, 500, { error: 'Na serveru chybí klíč (ELEVENLABS_API_KEY nebo OPENAI_API_KEY)' });
  try {
    const audio = await readBody(req);
    if (!audio.length) return send(res, 400, { error: 'Prázdný zvuk' });
    const url = new URL(req.url, 'http://x');
    const lang = (url.searchParams.get('lang') || '').replace(/[^a-z]/gi, '').slice(0, 3);
    let out;
    if (el) {
      try { out = await scribe(audio, lang, el); }
      catch (e) { if (!oa) throw e; out = await whisper(audio, lang, oa); }
    } else out = await whisper(audio, lang, oa);
    return send(res, 200, out);
  } catch (e) {
    const msg = /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(e.message) ? 'Nepodařilo se spojit s přepisovou službou – zkus to znovu' : e.message;
    return send(res, e.status || 502, { error: msg });
  }
};
