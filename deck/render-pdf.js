const puppeteer = require('puppeteer');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'pdf.html'), { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(800);
  const out = path.resolve(__dirname, 'regenesis-launch.pdf');
  await page.pdf({
    path: out,
    width: '1080px',
    height: '1350px',
    printBackground: true,
    pageRanges: '1-7'
  });
  await browser.close();
  console.log('wrote', out);
})().catch(e => { console.error(e); process.exit(1); });
