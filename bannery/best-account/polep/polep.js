// Polep stolu 120 × 70 cm (+3 mm spadávka) – vektorová PDF všech variant z jobs.json (vytváří build.py)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const dir = __dirname;
  const jobs = JSON.parse(fs.readFileSync(path.join(dir, 'jobs.json'), 'utf8'));
  const b = await chromium.launch();
  for (const [html, pdf] of jobs) {
    const p = await b.newPage({ viewport: { width: Math.round(1206 * 96 / 25.4), height: Math.round(706 * 96 / 25.4) } });
    await p.goto('file://' + path.join(dir, html));
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    await p.pdf({ path: path.join(dir, pdf), width: '1206mm', height: '706mm', printBackground: true, preferCSSPageSize: true });
    await p.close();
    console.log('✓', pdf);
  }
  await b.close();
})();
