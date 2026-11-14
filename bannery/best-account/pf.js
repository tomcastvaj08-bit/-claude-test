// PF 2027 – vykreslí světlou i tmavou verzi ve dvou rozměrech do vystup/
const { chromium } = require('playwright');
const path = require('path');
const TEXT = {
  headline: 'Děkujeme\nza důvěru\nv roce *2026.*',
  body: 'Do nového roku jdeme\ns plným nasazením.',
  sign: 'Tým Best Account',
};
const SIZES = [
  { w: 3400, h: 1800, margin: 200, top: 520, hSize: 190, bSize: 68, yrSize: 640, yrTop: 470 },
  { w: 3000, h: 1350, margin: 200, top: 470, hSize: 175, bSize: 64, yrSize: 640, yrTop: 430 },
];
(async () => {
  const dir = __dirname;
  const b = await chromium.launch();
  for (const s of SIZES) for (const theme of ['svetla', 'tmava']) {
    const p = await b.newPage({ viewport: { width: s.w, height: s.h } });
    await p.goto('file://' + path.join(dir, 'pf.html'));
    await p.evaluate(o => render(o), { ...s, ...TEXT, theme: theme === 'tmava' ? 'dark' : 'light' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const out = path.join(dir, 'vystup', `PF2027-${theme}-${s.w}x${s.h}.png`);
    await p.screenshot({ path: out });
    console.log('✓', out);
    await p.close();
  }
  await b.close();
})();
