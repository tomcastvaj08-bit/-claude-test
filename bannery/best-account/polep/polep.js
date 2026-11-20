// Polep stolu 120 × 70 cm (+3 mm spadávka) – vektorové PDF + náhled PNG
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = __dirname;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: Math.round(1206 * 96 / 25.4), height: Math.round(706 * 96 / 25.4) } });
  await p.goto('file://' + path.join(dir, 'polep-stul.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  await p.evaluate(() => layout());
  await p.pdf({ path: path.join(dir, 'Best-Account-polep-stolu-120x70cm.pdf'), width: '1206mm', height: '706mm', printBackground: true, preferCSSPageSize: true });
  await p.screenshot({ path: path.join(dir, 'Best-Account-polep-stolu-nahled.png') });
  await b.close();
  console.log('✓ hotovo');
})();
