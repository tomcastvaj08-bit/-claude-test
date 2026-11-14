// PF 2027 – tmavá verze ve dvou rozměrech do vystup/
const { chromium } = require('playwright');
const path = require('path');
const TEXT = {
  headline: 'Děkujeme za důvěru\nv roce *2026.*',
  body: 'Do nového roku jdeme\ns plným nasazením.',
  sign: 'Tým Best Account',
};
const SIZES = [
  { w: 3400, h: 1800, top: 440, lionW: 1250, lionTop: -60, lionShift: 0, markX: 1950, markSize: 1350, markDy: 40, tabW: 860 },
  { w: 3000, h: 1350, top: 400, lionW: 1350, lionTop: -150, lionShift: 0, markX: 2150, markSize: 1450, markDy: 40, tabW: 860 },
];
(async () => {
  const dir = __dirname;
  const b = await chromium.launch();
  for (const s of SIZES) {
    const p = await b.newPage({ viewport: { width: s.w, height: s.h } });
    await p.goto('file://' + path.join(dir, 'pf.html'));
    await p.evaluate(o => render(o), { ...s, ...TEXT });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const out = path.join(dir, 'vystup', `PF2027-${s.w}x${s.h}.png`);
    await p.screenshot({ path: out });
    console.log('✓', out);
    await p.close();
  }
  await b.close();
})();
