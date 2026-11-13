const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  for (const id of process.argv.slice(2)) {
    await p.goto(`http://localhost:8765/_aobake.html?id=${id}`); await p.waitForFunction(() => window.__done, null, { timeout: 600000 });
    const info = await p.evaluate(() => window.__info), ao = await p.evaluate(() => window.__ao);
    fs.writeFileSync(`/home/user/-claude-test/love-bricks/models/${id}.ao.bin`, Buffer.from(ao));
    console.log(id, JSON.stringify(info), (ao.length / 1e3).toFixed(0) + ' kB');
  }
  await b.close();
})();
