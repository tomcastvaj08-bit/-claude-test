// PF 2027 – světlá verze pro tisk velkoformátových bannerů ve skutečné velikosti
// 3400 × 1800 mm a 3000 × 1350 mm, 72 dpi (běžné pro velkoformátový tisk), bez spadávky
// Výstup: vystup/tisk/PF2027-banner-svetla-<A|B>-<rozměr>mm.pdf
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { TEXT, SIZES } = require('./pf.js');

const DPI = 72;
const px = mm => Math.round(mm / 25.4 * DPI);

(async () => {
  const dir = __dirname, out = path.join(dir, 'vystup', 'tisk');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  for (const s0 of SIZES) {
    const mmW = s0.w, mmH = s0.h; // rozměry od klientky v mm
    const W = px(mmW), H = px(mmH);
    for (const [name, layout] of [['A', 'flow'], ['B', 'low']]) {
      // vykreslí se ve schváleném rozvržení (s0.w × s0.h) a zvětší přes deviceScaleFactor
      const p = await b.newPage({ viewport: { width: s0.w, height: s0.h }, deviceScaleFactor: W / s0.w });
      await p.goto('file://' + path.join(dir, 'pf.html'));
      await p.evaluate(o => render(o), { ...s0, ...TEXT, theme: 'light', layout, markMode: 'fill', hexPhoto: true });
      await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
      const png = path.join(out, `PF2027-banner-svetla-${name}-${mmW}x${mmH}mm.png`);
      await p.screenshot({ path: png });
      await p.close();
      const pdf = png.replace(/\.png$/, '.pdf');
      execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], resolution=${DPI}, quality=92)
`, png, pdf]);
      console.log('✓', pdf, `${W}×${H} px`);
    }
  }
  await b.close();
})();
