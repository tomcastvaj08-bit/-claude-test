// Denní limit AI přepisu pro neplatící uživatele – bez databáze.
// Telefon dostane podepsaný „lístek“ {den, použité sekundy, id zařízení}; server ho při každém přepisu
// ověří podpisem (nejde ručně upravit), přičte délku zvuku a vrátí nový. PRO uživatelé limit nemají.
// Pojistka navíc: hrubý limit podle IP adresy v paměti serveru (proti mazání lístku).
// Proměnné: FREE_SECONDS_PER_DAY (výchozí 300 = 5 minut zvuku denně), PRO_SECRET, PRO_MASTER_CODE, STRIPE_SECRET_KEY.
const crypto = require('crypto');

const FREE = () => Math.max(0, parseInt(process.env.FREE_SECONDS_PER_DAY || '300', 10) || 0);
const IP_FACTOR = 3;   // jedna IP adresa (např. domácí wifi) smí za den max 3× limit zařízení
const b64u = b => Buffer.from(b).toString('base64url');
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });   // „2026-11-21“ podle českého času

// stejný klíč jako u PRO kódů (api/pro.js), aby šlo PRO kód ověřit i tady
const proSecret = () => process.env.PRO_SECRET || crypto.createHash('sha256').update('efektive-pro:' + (process.env.STRIPE_SECRET_KEY || '')).digest('hex');
const qSecret = () => crypto.createHash('sha256').update('efektive-quota:' + proSecret() + ':' + (process.env.GROQ_API_KEY || '')).digest('hex');

function hmacOk(p, sig, key) {
  const want = crypto.createHmac('sha256', key).update(p).digest('base64url');
  return sig && want.length === sig.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}
function readSigned(token, key) {
  const [p, sig] = String(token || '').trim().split('.');
  if (!p || !hmacOk(p, sig, key)) return null;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()); } catch { return null; }
}
function writeSigned(obj, key) {
  const p = b64u(JSON.stringify(obj));
  return p + '.' + crypto.createHmac('sha256', key).update(p).digest('base64url');
}

// PRO: hlavní kód majitele nebo podepsaný PRO kód s aktivním předplatným (stav se ověří u Stripe, max 1× za 10 min na kód)
const proCache = new Map();
async function isPro(token) {
  const t = String(token || '').trim(); if (!t) return false;
  const m = process.env.PRO_MASTER_CODE;
  if (m && m.length >= 12 && t.length === m.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(m))) return true;
  const d = readSigned(t, proSecret()); if (!d || !d.s) return false;
  const c = proCache.get(t); if (c && Date.now() - c.at < 600e3) return c.pro;
  let pro = false;
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      const r = await fetch('https://api.stripe.com/v1/subscriptions/' + encodeURIComponent(d.s), { headers: { Authorization: 'Bearer ' + key } });
      const j = await r.json().catch(() => ({}));
      pro = r.ok && ['active', 'trialing', 'past_due'].includes(j.status);
    }
  } catch { pro = c ? c.pro : false; }   // Stripe nedostupný → ponechat poslední známý stav
  proCache.set(t, { pro, at: Date.now() });
  return pro;
}

const ipUse = new Map();   // IP → {d, u}
function clientIp(req) {
  const h = req.headers || {};
  return String(h['x-real-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || '').trim();
}

// délka WAV (16 kHz, mono, 16 bit – tak ho posílá appka) v sekundách
const wavSeconds = buf => Math.max(1, Math.ceil(Math.max(0, buf.length - 44) / 32000));

// před přepisem: smí? → {ok, pro, ticket, used, limit, need}
async function check(req, seconds) {
  const h = req.headers || {};
  const limit = FREE();
  if (await isPro(h['x-pro'])) return { ok: true, pro: true };
  if (!limit) return { ok: true, pro: false, unlimited: true };
  const d = today();
  let t = readSigned(h['x-quota'], qSecret());
  if (!t || t.d !== d) t = { d, u: 0, id: (t && t.id) || crypto.randomBytes(9).toString('base64url') };
  const ip = clientIp(req), iu = ipUse.get(ip);
  const ipUsed = iu && iu.d === d ? iu.u : 0;
  const ok = t.u + seconds <= limit && ipUsed + seconds <= limit * IP_FACTOR;
  return { ok, pro: false, ticket: t, ip, used: t.u, limit, need: seconds };
}
// po úspěšném přepisu: přičíst a vrátit nový lístek + kolik zbývá
function commit(q, seconds) {
  if (!q || q.pro || q.unlimited) return { quota: null, left: null };
  const d = q.ticket.d;
  q.ticket.u += seconds;
  const iu = ipUse.get(q.ip); ipUse.set(q.ip, { d, u: (iu && iu.d === d ? iu.u : 0) + seconds });
  if (ipUse.size > 5000) ipUse.clear();
  return { quota: writeSigned(q.ticket, qSecret()), left: Math.max(0, q.limit - q.ticket.u) };
}

module.exports = { check, commit, wavSeconds, FREE, today };
