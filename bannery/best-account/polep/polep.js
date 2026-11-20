// Polep stolu 120 × 70 cm (+3 mm spadávka) – vektorové PDF + náhled PNG
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = __dirname;
  const b = await chromium.launch();
  for (const [html, pdf] of [['polep-stul.html', 'Best-Account-polep-stolu-120x70cm-nad-sebou.pdf'], ['polep-vedle-A-jen-nazev.html', 'Best-Account-polep-stolu-120x70cm-A-jen-nazev.pdf'], ['polep-vedle-B-kancelar.html', 'Best-Account-polep-stolu-120x70cm-B-ucetni-a-danova-kancelar.pdf'], ['polep-vedle-C-since-2008.html', 'Best-Account-polep-stolu-120x70cm-C-since-2008.pdf']]) {
  const p = await b.newPage({ viewport: { width: Math.round(1206 * 96 / 25.4), height: Math.round(706 * 96 / 25.4) } });
  await p.goto('file://' + path.join(dir, html));
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  await p.evaluate(() => layout());
  await p.pdf({ path: path.join(dir, pdf), width: '1206mm', height: '706mm', printBackground: true, preferCSSPageSize: true });
  await p.close(); }
  await b.close();
  console.log('✓ hotovo');
})();
