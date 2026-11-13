// Předplatné EFEKTIVE Captions PRO (Stripe, 300 Kč / měsíc) – bez databáze.
// Zákazník dostane podepsaný PRO kód (customer + subscription + HMAC). Při každém
// ověření se stav předplatného zeptá přímo Stripe, takže zrušené předplatné přestane platit.
// Proměnné na serveru: STRIPE_SECRET_KEY (povinné), PRO_SECRET (podpis kódů), PRO_PRICE_CZK (volitelně, výchozí 300).
const crypto = require('crypto');

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function readJSON(req) {
  return new Promise(resolve => {
    const ch = []; req.on('data', c => ch.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(ch).toString() || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
// Stripe API přes fetch (form-encoded), bez knihovny
async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { const e = new Error('Platby zatím nejsou zapnuté (na serveru chybí STRIPE_SECRET_KEY).'); e.status = 503; throw e; }
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const url = 'https://api.stripe.com/v1/' + path + (method === 'GET' && body ? '?' + body : '');
  const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' }, body: method === 'GET' ? undefined : body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j?.error?.message || 'Chyba Stripe'); e.status = r.status === 401 ? 503 : 502; throw e; }
  return j;
}
const secret = () => process.env.PRO_SECRET || crypto.createHash('sha256').update('efektive-pro:' + (process.env.STRIPE_SECRET_KEY || '')).digest('hex');
const b64u = b => Buffer.from(b).toString('base64url');
function sign(customer, subscription) {
  const p = b64u(JSON.stringify({ c: customer, s: subscription }));
  return p + '.' + crypto.createHmac('sha256', secret()).update(p).digest('base64url');
}
function unsign(token) {
  const [p, sig] = String(token || '').trim().split('.');
  if (!p || !sig) return null;
  const want = crypto.createHmac('sha256', secret()).update(p).digest('base64url');
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()); } catch { return null; }
}
const ACTIVE = new Set(['active', 'trialing', 'past_due']);
function state(sub) {
  const end = sub.current_period_end || sub.items?.data?.[0]?.current_period_end || 0;
  return { pro: ACTIVE.has(sub.status), status: sub.status, until: end * 1000, cancelAtEnd: !!sub.cancel_at_period_end };
}
function origin(req) {
  const h = req.headers || {};
  const host = h['x-forwarded-host'] || h.host || 'localhost:3000';
  const proto = h['x-forwarded-proto'] || (/^localhost|^127\./.test(host) ? 'http' : 'https');
  return proto + '://' + host;
}

// mobilní aplikace (Capacitor) běží z capacitor://localhost (iOS) a https://localhost (Android)
const APP_ORIGINS = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost', 'ionic://localhost']);
function cors(req, res) {
  const o = req.headers && req.headers.origin;
  if (o && APP_ORIGINS.has(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return true; }
  return false;
}

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const url = new URL(req.url, 'http://x');
  const action = url.searchParams.get('a') || '';
  try {
    // 1) Nákup: Stripe Checkout (předplatné 300 Kč měsíčně)
    if (action === 'checkout') {
      const price = Math.max(1, parseInt(process.env.PRO_PRICE_CZK || '300', 10));
      const o = origin(req);
      const params = {
        mode: 'subscription',
        locale: 'cs',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'czk',
        'line_items[0][price_data][unit_amount]': String(price * 100),
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][price_data][product_data][name]': 'EFEKTIVE Captions PRO',
        'line_items[0][price_data][product_data][description]': 'Export videí bez vodoznaku. Měsíční předplatné, zrušíš kdykoli.',
        allow_promotion_codes: 'true',
        billing_address_collection: 'auto',
        success_url: o + '/?pro_session={CHECKOUT_SESSION_ID}',
        cancel_url: o + '/?pro_cancel=1',
      };
      if (process.env.STRIPE_PRICE_ID) {   // když je cena založená ve Stripe, použije se ta
        for (const k of Object.keys(params)) if (k.startsWith('line_items[0][price_data]')) delete params[k];
        params['line_items[0][price]'] = process.env.STRIPE_PRICE_ID;
      }
      const s = await stripe('POST', 'checkout/sessions', params);
      return send(res, 200, { url: s.url });
    }

    // 2) Po zaplacení: ověřit platbu a vydat PRO kód
    if (action === 'activate') {
      const id = url.searchParams.get('session_id') || '';
      if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return send(res, 400, { error: 'Neplatné číslo platby.' });
      const s = await stripe('GET', 'checkout/sessions/' + id, { 'expand[]': 'subscription' });
      const sub = s.subscription && typeof s.subscription === 'object' ? s.subscription : null;
      if (s.status !== 'complete' || !sub) return send(res, 402, { error: 'Platba ještě není dokončená.' });
      return send(res, 200, { token: sign(s.customer, sub.id), email: s.customer_details?.email || '', ...state(sub) });
    }

    // 3) Ověření PRO kódu (při spuštění appky a při zadání kódu na jiném zařízení)
    if (action === 'check') {
      const body = req.method === 'POST' ? await readJSON(req) : {};
      const t = unsign(body.token || url.searchParams.get('token'));
      if (!t) return send(res, 400, { error: 'Tenhle PRO kód neznám. Zkontroluj, že je zkopírovaný celý.' });
      const sub = await stripe('GET', 'subscriptions/' + encodeURIComponent(t.s));
      return send(res, 200, state(sub));
    }

    // 4) Správa / zrušení předplatného (Stripe zákaznický portál)
    if (action === 'portal') {
      const body = req.method === 'POST' ? await readJSON(req) : {};
      const t = unsign(body.token || url.searchParams.get('token'));
      if (!t) return send(res, 400, { error: 'Neplatný PRO kód.' });
      const p = await stripe('POST', 'billing_portal/sessions', { customer: t.c, return_url: origin(req) + '/', locale: 'cs' });
      return send(res, 200, { url: p.url });
    }

    // stav plateb (jestli je Stripe nastavený) – appka podle toho ukáže/skryje nákup
    if (action === 'status') return send(res, 200, { enabled: !!process.env.STRIPE_SECRET_KEY, price: parseInt(process.env.PRO_PRICE_CZK || '300', 10) });

    return send(res, 404, { error: 'Neznámá akce' });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message });
  }
};
