// Render composition.html frame by frame with headless Chromium.
// Usage: node render_frames.mjs WORK_DIR OUT_DIR [fromF] [toF] [step]
// WORK_DIR must contain composition.html, cam.json, bg_world.png, cut/, fonts/
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [work, out, a = '1', b = '223', st = '1'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const srv = http.createServer((req, res) => {
  const p = path.join(work, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[err]', e.message));
await page.goto(`http://127.0.0.1:${port}/composition.html`);
const ok = await page.evaluate(() => window.init());
if (!ok) console.log('WARNING: fonts not loaded');
for (let F = +a; F <= +b; F += +st) {
  const url = await page.evaluate(f => window.renderFrame(f), F);
  fs.writeFileSync(path.join(out, `r${String(F).padStart(3, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  if (F % 20 === 0) console.log('frame', F);
}
await browser.close(); srv.close();
