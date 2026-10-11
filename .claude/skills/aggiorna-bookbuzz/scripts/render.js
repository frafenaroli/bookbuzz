// Testo delle pagine costruite via JavaScript (siti degli editori).
// Uso: PW=$(npm root -g)/playwright node render.js URL [URL...] > pagine.txt
const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/141' });
  for (const u of process.argv.slice(2)) {
    try { await p.goto(u, { waitUntil: 'networkidle', timeout: 45000 }); } catch (e) { console.log('ERR', u, e.message.split('\n')[0]); }
    await p.waitForTimeout(1500);
    console.log('#####', u, '\n' + await p.evaluate(() => document.body.innerText));
  }
  await b.close();
})();
