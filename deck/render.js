const puppeteer = require('puppeteer');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  const file = 'file://' + path.resolve(__dirname, 'deck.html');
  await page.goto(file, { waitUntil: 'networkidle0', timeout: 60000 });
  // ensure web fonts are fully loaded before any layout/paint
  try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
  await sleep(1500);

  const ids = ['s1','s2','s3','s4','s5','s6','s7'];
  for (let i = 0; i < ids.length; i++) {
    const sel = '#' + ids[i];
    // scroll the slide into view and force a reflow + two animation frames
    // so Chromium actually paints this tile before we clip the screenshot
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      el.scrollIntoView({ block: 'start', behavior: 'instant' });
      // force reflow
      void el.offsetHeight;
    }, sel);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await sleep(350);

    const el = await page.$(sel);
    const n = String(i + 1).padStart(2, '0');
    const out = path.resolve(__dirname, `regenesis-slide-${n}.png`);
    await el.screenshot({ path: out, captureBeyondViewport: false });
    console.log('wrote', out);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
