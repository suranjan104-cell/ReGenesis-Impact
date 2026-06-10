const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html':'text/html', '.png':'image/png', '.xml':'application/xml',
  '.txt':'text/plain', '.webmanifest':'application/manifest+json', '.js':'text/javascript' };

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } else { res.writeHead(404); res.end('nf'); }
});

(async () => {
  await new Promise(r => server.listen(8787, r));
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  const failed = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => { if (!r.url().includes('supabase') && !r.url().includes('googleapis') && !r.url().includes('gstatic') && !r.url().includes('jsdelivr')) failed.push(r.url()); });

  await page.goto('http://localhost:8787/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // 1. homepage visible?
  const homeVisible = await page.evaluate(() => {
    const h = document.getElementById('page-home');
    if (!h) return false;
    const r = h.getBoundingClientRect();
    return getComputedStyle(h).display !== 'none' && r.height > 200;
  });

  // 2. what's at viewport center?
  const center = await page.evaluate(() => {
    const el = document.elementFromPoint(640, 400);
    return el ? (el.tagName + (el.id ? '#'+el.id : '') + ' .' + (el.className && el.className.split ? el.className.split(' ')[0] : '')) : 'NONE';
  });

  // 3. new assets resolve
  const assets = {};
  for (const a of ['/og-image.png','/favicon-32.png','/icon-192.png','/icon-512.png','/apple-touch-icon.png','/site.webmanifest','/robots.txt','/sitemap.xml']) {
    const code = await page.evaluate(async (u) => (await fetch(u)).status, a);
    assets[a] = code;
  }

  // 4. autosave round-trip: find a visible-tool text input, set a value, reload, check
  const probe = await page.evaluate(() => {
    const el = document.querySelector('#page-ghg input[id][type="number"], #page-ghg input[id]:not([type]), input[id][type="number"]');
    if (!el) return null;
    el.value = '424242';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return el.id;
  });
  await new Promise(r => setTimeout(r, 700)); // let debounce flush
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  const restoredVal = probe ? await page.evaluate((id) => {
    const el = document.getElementById(id);
    return el ? el.value : 'ELEMENT GONE';
  }, probe) : 'NO PROBE INPUT';

  console.log(JSON.stringify({
    homeVisible, center, assets,
    autosave: { probeId: probe, restoredVal, ok: restoredVal === '424242' },
    pageErrors: errors.slice(0, 5),
    failedLocalRequests: failed.slice(0, 5)
  }, null, 2));

  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
