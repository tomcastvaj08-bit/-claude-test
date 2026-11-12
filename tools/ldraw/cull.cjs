const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 400, height: 400 } })).newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  for (const id of process.argv.slice(2)) {
    const t = Date.now();
    await p.goto('http://localhost:8765/tools/ldraw/cull.html?id=' + id);
    await p.waitForFunction(() => window.__done, null, { timeout: 600000 });
    const keep = await p.evaluate(() => window.__keep), total = await p.evaluate(() => window.__total);
    fs.writeFileSync(`tools/ldraw/${id}.keep.json`, JSON.stringify(keep));
    console.log(id, 'visible', keep.length, '/', total, ((Date.now() - t) / 1000).toFixed(0) + 's');
  }
  await b.close();
})();
