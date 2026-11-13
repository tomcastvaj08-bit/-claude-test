// Přepis řeči na text se slovy a časy (OpenAI Whisper).
// Klíč je jen na serveru (proměnná OPENAI_API_KEY), do telefonu se nedostane.

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Použij POST' });
  const key = process.env.OPENAI_API_KEY;
  const elKey = process.env.ELEVENLABS_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!key && !elKey && !groqKey) return send(res, 500, { error: 'Na serveru chybí klíč pro přepis (ELEVENLABS_API_KEY, GROQ_API_KEY nebo OPENAI_API_KEY)' });

  try {
    const audio = await readBody(req);
    if (!audio.length) return send(res, 400, { error: 'Prázdný zvuk' });

    const url = new URL(req.url, 'http://x');
    const lang = (url.searchParams.get('lang') || '').slice(0, 5);
    const quality = url.searchParams.get('quality') || 'max';

    // Max přesnost + ElevenLabs klíč → ElevenLabs Scribe (nejpřesnější na češtinu/slovenštinu); jinak OpenAI Whisper
    let elError = null;
    if (elKey && (quality === 'max' || (!key && !groqKey) || !groqKey)) {
      const f = new FormData();
      f.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
      f.append('model_id', 'scribe_v1');
      f.append('timestamps_granularity', 'word');
      f.append('tag_audio_events', 'false');
      if (lang) f.append('language_code', lang);
      const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': elKey }, body: f });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const words = (j.words || []).filter(w => w.type === 'word').map(w => ({ word: w.text, start: w.start, end: w.end }));
        return send(res, 200, { words, text: j.text || '', engine: 'elevenlabs-scribe' });
      }
      const code = j?.detail?.code || j?.detail?.status || '';
      elError = code === 'quota_exceeded' ? 'Na účtu ElevenLabs došly kredity. Dobij kredity na elevenlabs.io (nebo počkej na měsíční obnovení), případně nastav záložní přepis.'
        : (code === 'missing_permissions' || r.status === 401) && code !== 'quota_exceeded' ? 'Klíč ElevenLabs nemá povolený přepis řeči (Speech to Text) nebo je neplatný.'
        : (j?.detail?.message || j?.detail || 'Chyba ElevenLabs');
      if (!groqKey && !key) return send(res, 402, { error: elError });
    }

    // Groq (zdarma): Whisper large v3 se slovy a časy
    if (groqKey) {
      const g = new FormData();
      g.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
      g.append('model', 'whisper-large-v3');
      g.append('temperature', '0');
      g.append('response_format', 'verbose_json');
      g.append('timestamp_granularities[]', 'word');
      if (lang) g.append('language', lang);
      const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${groqKey}` }, body: g });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const words = (j.words || []).map(w => ({ word: w.word, start: w.start, end: w.end }));
        return send(res, 200, { words, text: j.text || '', engine: 'groq-whisper' });
      }
      if (!key) return send(res, r.status || 502, { error: (elError ? elError + ' ' : '') + 'Záložní přepis (Groq): ' + (j?.error?.message || 'chyba') });
    }

    const form = new FormData();
    form.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
    // whisper-1 umí časy slov ve všech jazycích; "fast" = nižší teplota, bez promptu
    form.append('model', 'whisper-1');
    if (quality === 'max') form.append('temperature', '0');
    form.append('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    if (lang) form.append('language', lang);

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    const j = await r.json();
    if (!r.ok) return send(res, r.status, { error: j?.error?.message || 'Chyba OpenAI' });

    const words = (j.words || []).map(w => ({ word: w.word, start: w.start, end: w.end }));
    return send(res, 200, { words, text: j.text || '' });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
};
