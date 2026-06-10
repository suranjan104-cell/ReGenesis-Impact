const puppeteer = require('puppeteer');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, 'logo.html'), { waitUntil: 'networkidle0', timeout: 60000 });
  try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
  await sleep(1200);

  for (const [id, name] of [['logo','regenesis-logo.png'], ['icon','regenesis-logo-icon.png']]) {
    await page.evaluate((s) => { const el=document.querySelector(s); el.scrollIntoView({block:'start'}); void el.offsetHeight; }, '#'+id);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await sleep(300);
    const el = await page.$('#'+id);
    const out = path.resolve(__dirname, name);
    await el.screenshot({ path: out });
    console.log('wrote', out);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
