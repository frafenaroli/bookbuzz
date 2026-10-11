// Controllo delle edizioni italiane precedenti su OPAC SBN (riedizioni).
// Uso: PW=$(npm root -g)/playwright node sbn.js "autore titolo originale" "autore titolo" ...
// Per ogni ricerca stampa luoghi, anni e titolo dell'opera trovati, o NESSUN RISULTATO.
const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const q of process.argv.slice(2)) {
    try {
      await p.goto('https://opac.sbn.it/', { waitUntil: 'networkidle', timeout: 45000 });
      const inp = p.locator('input:visible').first();
      await inp.fill(q); await inp.press('Enter');
      await p.waitForLoadState('networkidle'); await p.waitForTimeout(2000);
      const t = await p.evaluate(() => document.body.innerText);
      const grab = h => { const i = t.indexOf('\n' + h + '\n'); if (i < 0) return ''; return t.slice(i + h.length + 2, i + h.length + 300).split('\nIncludi/Escludi')[0].replace(/\n/g, ' | '); };
      if (t.includes('Nessun risultato')) console.log('#####', q, 'NESSUN RISULTATO');
      else console.log('#####', q, '\n  Luogo:', grab('Luogo'), '\n  Anno:', grab('Anno di pubblicazione'), '\n  Opera:', grab("Titolo dell'opera"));
    } catch (e) { console.log('#####', q, 'ERRORE', e.message.split('\n')[0]); }
  }
  await b.close();
})();
