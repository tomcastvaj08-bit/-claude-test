// AI dokončení realitní fotky (uklidit, zařídit, soumrak, trávník, obloha, celkové dotažení).
// Klíč jen na serveru: GEMINI_API_KEY (Google AI Studio). Model: GEMINI_IMAGE_MODEL (výchozí gemini-2.5-flash-image).
// Neplatící: FREE_AI_PER_DAY úprav denně (výchozí 3), PRO bez omezení.
const Q = require('./_quota');

function readBody(req, max) {
  return new Promise((resolve, reject) => { const ch = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > max) { reject(new Error('Fotka je moc velká')); req.destroy(); } else ch.push(c); });
    req.on('end', () => resolve(Buffer.concat(ch))); req.on('error', reject); });
}
function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
const APP_ORIGINS = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost', 'ionic://localhost']);
function cors(req, res) { const o = req.headers && req.headers.origin;
  if (o && APP_ORIGINS.has(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AiQuota, X-Pro'); res.setHeader('Access-Control-Max-Age', '86400'); }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; } return false; }

// zadání pro model – vždy: zachovat přesně geometrii, perspektivu, materiály a objekty; fotorealismus, žádné umělé textury
const KEEP = 'Keep the exact same camera position, framing, perspective, room geometry, walls, windows, doors, floor, ceiling and every permanent fixture. Photorealistic real-estate photography, natural clean textures, no painterly or plastic look, no noise, no blotches, no added text or watermark. Return the full image at the same aspect ratio.';
const TASKS = {
  finish:   'Professionally finish this real estate photo: bright, airy, clean daylight look, neutral white walls and ceiling, true colours, balanced exposure with detail in shadows and windows, a clear natural view outside the windows with a soft blue sky. Remove any people. ' + KEEP,
  declutter:'Remove clutter, loose personal items, cables, bags, papers, trash and any people from this real estate photo, filling the areas naturally with what would be behind them. Keep furniture that belongs to the room. ' + KEEP,
  stage:    'Virtually stage this empty or sparse room with tasteful modern furniture and decor that fits the room type and its scale, realistic shadows and lighting. ' + KEEP,
  twilight: 'Turn this exterior real estate photo into a dusk / twilight shot: deep blue to warm orange sky, warm glowing interior lights in all windows, exterior lights on, realistic. ' + KEEP,
  lawn:     'Make all grass and lawn areas lush, healthy, evenly green and freshly mowed; keep everything else unchanged. ' + KEEP,
  sky:      'Replace the sky (and the view through windows if overexposed) with a clear natural blue sky with a few soft white clouds, matching the lighting direction. ' + KEEP,
};

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Použij POST' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(res, 503, { error: 'AI úpravy zatím nejsou zapnuté (na serveru chybí klíč GEMINI_API_KEY).', noKey: true });
  try {
    const url = new URL(req.url, 'http://x');
    const task = url.searchParams.get('task') || 'finish';
    const extra = (url.searchParams.get('note') || '').slice(0, 300);
    if (!TASKS[task]) return send(res, 400, { error: 'Neznámá úprava' });
    const img = await readBody(req, 4_200_000);
    if (img.length < 1000) return send(res, 400, { error: 'Chybí fotka' });
    const q = await Q.check(req, 1, { ns: 'ai', header: 'x-aiquota', limit: Math.max(0, parseInt(process.env.FREE_AI_PER_DAY || '3', 10) || 0) });
    if (!q.ok) return send(res, 429, { error: `Dnešní AI úpravy zdarma (${q.limit} denně) jsou vyčerpané. Zítra se obnoví – nebo si vezmi PRO a upravuj bez omezení.`, quotaExceeded: true });
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    const mime = (req.headers['content-type'] || 'image/jpeg').split(';')[0];
    const body = { contents: [{ role: 'user', parts: [ { text: TASKS[task] + (extra ? ' Extra instructions: ' + extra : '') }, { inline_data: { mime_type: mime, data: img.toString('base64') } } ] }],
      generationConfig: { responseModalities: ['IMAGE'] } };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, r.status === 429 ? 503 : 502, { error: 'AI služba: ' + (j?.error?.message || ('chyba ' + r.status)) });
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const out = parts.find(p => p.inline_data || p.inlineData);
    if (!out) return send(res, 502, { error: 'AI nevrátila obrázek' + (j?.candidates?.[0]?.finishReason ? ' (' + j.candidates[0].finishReason + ')' : '') });
    const d = out.inline_data || out.inlineData;
    const c = Q.commit(q, 1);
    return send(res, 200, { image: d.data, mime: d.mime_type || d.mimeType || 'image/png', task, model, quota: c.quota, left: c.left, pro: !!q.pro });
  } catch (e) { return send(res, 500, { error: e.message }); }
};
