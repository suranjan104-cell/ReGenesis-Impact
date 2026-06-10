const puppeteer = require('puppeteer');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// outputs land at the REPO ROOT so they're served by the site
const ROOT = path.resolve(__dirname, '..');

const JOBS = [
  ['#og',   path.join(ROOT, 'og-image.png'),        1], // 1200x630 exact
  ['#i512', path.join(ROOT, 'icon-512.png'),        1],
  ['#i192', path.join(ROOT, 'icon-192.png'),        1],
  ['#i180', path.join(ROOT, 'apple-touch-icon.png'),1],
  ['#i32',  path.join(ROOT, 'favicon-32.png'),      1],
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 900, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, 'assets.html'), { waitUntil: 'networkidle0', timeout: 60000 });
  try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
  await sleep(1200);

  for (const [sel, out] of JOBS) {
    await page.evaluate((s) => { const el = document.querySelector(s); el.scrollIntoView({ block: 'start' }); void el.offsetHeight; }, sel);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await sleep(250);
    const el = await page.$(sel);
    await el.screenshot({ path: out });
    console.log('wrote', out);
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
