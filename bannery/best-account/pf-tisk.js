// PF 2027 – tisková verze 200 × 100 mm, oboustranně
// 300 dpi, spadávka 3 mm na každé straně => 206 × 106 mm = 2433 × 1252 px
// Výstup: vystup/tisk/PF2027-tisk-<A|B>.pdf (strana 1 = přední, strana 2 = zadní) + PNG jednotlivých stran
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const DPI = 300, BLEED_MM = 3, TRIM = [200, 100];
const px = mm => Math.round(mm / 25.4 * DPI);
const W = px(TRIM[0] + 2 * BLEED_MM), H = px(TRIM[1] + 2 * BLEED_MM);

// stejné nastavení jako schválený formát 3400×1800 (souřadnice jsou v jednotkách výšky 1800)
const { TEXT, SIZES } = require('./pf.js');
const big = SIZES.find(s => s.w === 3400);

(async () => {
  const dir = __dirname, out = path.join(dir, 'vystup', 'tisk');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const shot = async (file, o, png) => {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.goto('file://' + path.join(dir, file));
    await p.evaluate(o => render(o), o);
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    await p.screenshot({ path: png });
    await p.close();
  };
  const back = path.join(out, 'PF2027-tisk-zadni-strana.png');
  await shot('pf-zadni.html', { w: W, h: H }, back);
  for (const [name, layout] of [['A', 'flow'], ['B', 'low']]) {
    const front = path.join(out, `PF2027-tisk-${name}-predni-strana.png`);
    await shot('pf.html', { ...big, ...TEXT, w: W, h: H, theme: 'dark', layout, markMode: 'fill', hexPhoto: true }, front);
    const pdf = path.join(out, `PF2027-tisk-${name}.pdf`);
    execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open(sys.argv[2]).convert('RGB')
a.save(sys.argv[3], save_all=True, append_images=[b], resolution=${DPI})
`, front, back, pdf]);
    console.log('✓', pdf);
  }
  await b.close();
  console.log(`rozměr ${W}×${H} px = ${TRIM[0] + 2 * BLEED_MM}×${TRIM[1] + 2 * BLEED_MM} mm při ${DPI} dpi`);
})();
