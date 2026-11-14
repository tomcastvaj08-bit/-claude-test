// Vykreslí všechny bannery z bannery.json do složky vystup/ (PNG 1254×1254).
// Použití:  node render.js            -> všechny
//           node render.js 02-mzdy    -> jen jeden
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = __dirname;
  const all = JSON.parse(fs.readFileSync(path.join(dir, 'bannery.json'), 'utf8'));
  const only = process.argv[2];
  const list = only ? all.filter(b => b.id === only) : all;
  fs.mkdirSync(path.join(dir, 'vystup'), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1254, height: 1254 } });
  await page.addInitScript(() => { window.__AUTOMATED = true; });
  await page.goto('file://' + path.join(dir, 'sablona.html'));

  for (const b of list) {
    const B = { ...b };
    if (B.bg && !fs.existsSync(path.join(dir, B.bg))) {
      console.warn(`! ${b.id}: chybí pozadí ${B.bg} – kreslím bez fotky`);
      delete B.bg;
    }
    await page.evaluate(B => render(B), B);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const out = path.join(dir, 'vystup', b.id + '.png');
    await page.screenshot({ path: out });
    console.log('✓', out);
  }
  await browser.close();
})();
