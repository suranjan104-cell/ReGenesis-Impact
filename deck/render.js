const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  const file = 'file://' + path.resolve(__dirname, 'deck.html');
  await page.goto(file, { waitUntil: 'networkidle0', timeout: 60000 });
  // give web fonts a beat to settle
  try { await page.evaluateHandle('document.fonts.ready'); } catch (e) {}
  await new Promise(r => setTimeout(r, 1200));

  const ids = ['s1','s2','s3','s4','s5','s6','s7'];
  for (let i = 0; i < ids.length; i++) {
    const el = await page.$('#' + ids[i]);
    const n = String(i + 1).padStart(2, '0');
    const out = path.resolve(__dirname, `regenesis-slide-${n}.png`);
    await el.screenshot({ path: out });
    console.log('wrote', out);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
