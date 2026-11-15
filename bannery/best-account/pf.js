// PF 2027 – tmavá verze ve dvou rozměrech do vystup/
const { chromium } = require('playwright');
const path = require('path');
const TEXT = {
  headline: 'Děkujeme za důvěru\nv roce *2026.*',
  body: 'Do nového roku jdeme s plným nasazením.',
  sign: 'Tým Best Account',
};
const WH="255,255,255", BL="95,185,255", GO="255,206,110";
const SIZES = [
  { w: 3400, h: 1800, top: 380, yrSize: 470, bodySize: 124, lowBottom: 120, cut: { src: 'pozadi/lev-sampanske-2.png', h: 1640, x: 2140 }, lionW: 1250, lionTop: -60, lionShift: 0, markX: 2250, markSize: 1500, markDy: 60, markRot: -14, tabW: 1400,
    bursts: [[2080, 250, 210, [WH, BL, GO], 72], [2680, 150, 150, [BL, WH], 52], [2470, 560, 105, [GO, WH], 44]],
    sparkles: [[1980, 760, 26], [2420, 520, 18], [1860, 230, 16], [2560, 360, 14], [3080, 120, 20], [3330, 520, 14], [2050, 1150, 14]] },
  { w: 3000, h: 1350, top: 380, yrSize: 470, bodySize: 148, lowBottom: 110, cut: { src: 'pozadi/lev-sampanske-2.png', h: 1700, x: 2560 }, lionW: 1350, lionTop: -150, lionShift: 0, markX: 2380, markSize: 1550, markDy: 60, markRot: -14, tabW: 1400,
    bursts: [[2080, 250, 180, [WH, BL, GO], 72], [2680, 140, 140, [BL, WH], 52], [2960, 520, 95, [GO, WH], 44]],
    sparkles: [[2150, 800, 26], [2700, 560, 18], [2050, 220, 16], [2850, 380, 14], [3450, 120, 20], [3880, 560, 14], [2300, 1250, 14]] },
];
const VARIANTS = [{ name: 'AB', markMode: 'fill', hexPhoto: true }];
(async () => {
  const dir = __dirname;
  const b = await chromium.launch();
  for (const v of VARIANTS) for (const s0 of SIZES) { const s = { ...s0, ...v };
    const p = await b.newPage({ viewport: { width: s.w, height: s.h } });
    await p.goto('file://' + path.join(dir, 'pf.html'));
    await p.evaluate(o => render(o), { ...s, ...TEXT });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const out = path.join(dir, 'vystup', `PF2027-${s.name}-${s.w}x${s.h}.png`);
    await p.screenshot({ path: out });
    console.log('✓', out);
    await p.close();
  }
  await b.close();
})();
