/* Every page, in a real browser, audited for the things a screenshot of the
   homepage cannot tell you.  Run:  node test/pages.mjs

   The contrast audit has only ever run on #page-home. The other twelve pages
   — every tool the product actually sells — were never measured, and they
   were the ones still carrying the old biopunk palette: five greens, three
   off-whites, a cyan and a purple, on a green-black ground with two coloured
   washes behind them. Collapsing all of that onto one token set is exactly
   the kind of change that leaves individual survivors behind, so the audit
   now walks all thirteen.

   Three checks per page:
     1. contrast — every element with its own text, composited through the
        full ancestor stack, at the WCAG AA threshold for its size;
     2. horizontal overflow — nothing may push the document wider than the
        viewport, at desktop and at 390px;
     3. console errors — a page that throws while rendering is a glitch even
        if it looks fine in a screenshot.

   It runs against the same in-memory data the app fetches, so it is
   deterministic and needs no network. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

const CHROME = (() => {
  const c = [process.env.CHROME, process.env.PUPPETEER_EXECUTABLE_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'].filter(Boolean);
  for (const p of c) if (existsSync(p)) return p;
  for (const dir of ['/home/runner/.cache/puppeteer', `${process.env.HOME || ''}/.cache/puppeteer`]) {
    try {
      for (const rev of readdirSync(dir)) for (const sub of readdirSync(`${dir}/${rev}`)) {
        for (const exe of [`${dir}/${rev}/${sub}/chrome-linux64/chrome`, `${dir}/${rev}/${sub}/chrome-linux/chrome`])
          if (existsSync(exe)) return exe;
      }
    } catch { /* absent */ }
  }
  throw new Error('no Chromium found — set CHROME, or npm install puppeteer');
})();

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const read = f => JSON.parse(readFileSync(`${ROOT}/knowledge/${f}`, 'utf8'));
const FILES = {
  'knowledge/esrs.json': read('esrs.json'), 'knowledge/factors.json': read('factors.json'),
  'knowledge/standards.json': read('standards.json'), 'knowledge/kb.json': read('kb.json'),
  'knowledge/markets.json': read('markets.json'),
  'knowledge/markets/australia.json': read('markets/australia.json'),
  'knowledge/markets/singapore.json': read('markets/singapore.json'),
  'knowledge/markets/issb.json': read('markets/issb.json'),
  'knowledge/esrs/scope.json': read('esrs/scope.json'),
  'knowledge/esrs/standards.json': read('esrs/standards.json'),
  'knowledge/esrs/taxonomy.json': read('esrs/taxonomy.json'),
  'knowledge/esrs/digital.json': read('esrs/digital.json'),
  'knowledge/esrs/interop.json': read('esrs/interop.json'),
  'knowledge/esrs/competitors.json': read('esrs/competitors.json'),
  'knowledge/esrs/cases.json': read('esrs/cases.json'),
  'knowledge/esrs/transition.json': read('esrs/transition.json'),
  'knowledge/standards/ghg-protocol.json': read('standards/ghg-protocol.json'),
  'knowledge/standards/iso-14064.json': read('standards/iso-14064.json'),
};

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const PAGES = [...html.matchAll(/id="page-([a-z-]+)"/g)].map(m => m[1]);
if (PAGES.length < 10) throw new Error(`only found ${PAGES.length} pages — the probe is looking in the wrong place`);

const stub = `<script>(function(){
  var M = ${JSON.stringify(FILES)};
  var of = window.fetch;
  window.fetch = function(u){ var k = String(u).replace(/^\\.?\\//, '');
    if (M[k]) return Promise.resolve({ ok:true, status:200, json:function(){ return Promise.resolve(M[k]); } });
    return of.apply(this, arguments); };
  window.__errs = [];
  window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
  window.addEventListener('unhandledrejection', function(e){ window.__errs.push('unhandled rejection: ' + e.reason); });
})();</script>`;

const probe = (width) => `<script>
(function(){
  var PAGES = ${JSON.stringify(PAGES)};
  function report(p){ document.body.setAttribute('data-pages', btoa(unescape(encodeURIComponent(JSON.stringify(p))))); }

  function lum(c){
    var m = c.match(/[\\d.]+/g); if(!m) return null;
    if (m.length > 3 && parseFloat(m[3]) === 0) return null;
    var v = [0,1,2].map(function(i){ var x=parseInt(m[i],10)/255;
      return x<=0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4); });
    return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
  }
  function parse(c){ var m=c.match(/[\\d.]+/g); if(!m) return null;
    return { r:+m[0], g:+m[1], b:+m[2], a: m.length>3 ? parseFloat(m[3]) : 1 }; }
  /* Composite the whole ancestor stack. These pages are translucent panels
     over a dark ground, so the first ancestor with any fill is not the
     background — the flattened stack is. */
  function bgOf(el){
    var stack = [], n = el;
    while (n) { stack.push(getComputedStyle(n).backgroundColor); n = n.parentElement; }
    var out = { r:255, g:255, b:255, a:1 };
    for (var i = stack.length-1; i >= 0; i--) {
      var c = parse(stack[i]); if (!c || !c.a) continue;
      out = { r:c.r*c.a+out.r*(1-c.a), g:c.g*c.a+out.g*(1-c.a), b:c.b*c.a+out.b*(1-c.a), a:1 };
    }
    return 'rgb(' + Math.round(out.r) + ', ' + Math.round(out.g) + ', ' + Math.round(out.b) + ')';
  }

  function auditContrast(root){
    var bad = [], seen = {};
    Array.prototype.forEach.call(root.querySelectorAll(
      'h1,h2,h3,h4,p,li,span,button,a,b,td,th,strong,div,label,legend,summary'), function(el){
      if (!el.offsetParent) return;
      if (!Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType===3 && n.textContent.trim(); })) return;
      var cs = getComputedStyle(el);
      if (cs.visibility==='hidden' || parseFloat(cs.opacity) < 0.3) return;
      if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') return;
      if (cs.backgroundImage && cs.backgroundImage.indexOf('gradient') >= 0) return;
      var bg = bgOf(el), fg = parse(cs.color), bgc = parse(bg);
      if (!fg || !bgc || !fg.a) return;
      var flat = 'rgb(' + Math.round(fg.r*fg.a+bgc.r*(1-fg.a)) + ', ' +
                          Math.round(fg.g*fg.a+bgc.g*(1-fg.a)) + ', ' +
                          Math.round(fg.b*fg.a+bgc.b*(1-fg.a)) + ')';
      var f = lum(flat), b = lum(bg);
      if (f === null || b === null) return;
      var r = (Math.max(f,b)+0.05)/(Math.min(f,b)+0.05);
      var size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight,10) >= 700;
      var need = (size >= 24 || (size >= 18.66 && bold)) ? 3.0 : 4.5;
      if (r >= need) return;
      var key = (el.className||'') + '|' + cs.color + '|' + bg;
      if (seen[key]) return; seen[key] = 1;
      bad.push(r.toFixed(2) + ':1 (needs ' + need + ') ' + cs.color + ' on ' + bg +
               ' — "' + (el.textContent||'').trim().slice(0,40) + '"');
    });
    return bad;
  }

  /* Anything sticking out past the viewport. Reported with the widest
     offender named, because "the page scrolls sideways" is not actionable. */
  function auditOverflow(root){
    var vw = document.documentElement.clientWidth, worst = null;
    Array.prototype.forEach.call(root.querySelectorAll('*'), function(el){
      if (!el.offsetParent) return;
      var cs = getComputedStyle(el);
      if (cs.position === 'fixed') return;
      var r = el.getBoundingClientRect();
      if (r.width === 0) return;
      var over = Math.round(r.right - vw);
      // A scroll container is allowed to hold something wider than itself.
      var p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        var ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { clipped = true; break; }
        p = p.parentElement;
      }
      if (clipped) return;
      if (over > 2 && (!worst || over > worst.over))
        worst = { over: over, what: el.tagName.toLowerCase() + '.' + (el.className||'').toString().split(' ')[0] };
    });
    return worst;
  }

  var out = { width: ${width}, pages: {} }, i = 0;
  function step(){
    if (i >= PAGES.length) { out.errors = window.__errs.slice(0, 8); return report(out); }
    var name = PAGES[i++];
    try { window.showPage(name); } catch (e) { out.pages[name] = { threw: String(e) }; return setTimeout(step, 0); }
    // Give the page's own fetches and renders a beat to land.
    setTimeout(function(){
      var root = document.getElementById('page-' + name);
      if (!root) { out.pages[name] = { missing: true }; return step(); }
      try {
        out.pages[name] = { contrast: auditContrast(root).slice(0, 6), overflow: auditOverflow(root) };
      } catch (e) { out.pages[name] = { threw: String(e && e.stack || e) }; }
      step();
    }, 400);
  }
  if (document.readyState === 'complete') setTimeout(step, 1200);
  else window.addEventListener('load', function(){ setTimeout(step, 1200); });
})();
</script>`;

mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const results = [];
try {
  for (const width of [1440, 390]) {
    const file = `${ROOT}/test/.tmp/pages-${width}.html`;
    const withStub = html.replace('</head>', stub + '</head>');
    const anchor = withStub.lastIndexOf('</body>');
    writeFileSync(file, withStub.slice(0, anchor) + probe(width) + withStub.slice(anchor));
    const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
      `--window-size=${width},900`, '--virtual-time-budget=120000', '--dump-dom', `file://${file}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
    const m = dom.match(/data-pages="([A-Za-z0-9+/=]+)"/);
    if (!m) throw new Error(`the ${width}px probe did not report — the page may not have loaded`);
    results.push(JSON.parse(Buffer.from(m[1], 'base64').toString('utf8')));
  }
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const fail = [];
for (const r of results) {
  for (const [name, p] of Object.entries(r.pages)) {
    if (p.threw) { fail.push(`${name} @${r.width}px threw while rendering: ${p.threw}`); continue; }
    if (p.missing) { fail.push(`${name} @${r.width}px: no #page-${name} in the document`); continue; }
    for (const c of p.contrast || []) fail.push(`${name} @${r.width}px text fails contrast — ${c}`);
    if (p.overflow) fail.push(`${name} @${r.width}px scrolls sideways — ${p.overflow.what} overhangs by ${p.overflow.over}px`);
  }
  for (const e of r.errors || []) fail.push(`@${r.width}px console error: ${e}`);
}

if (fail.length) {
  console.error(`✗ pages — ${fail.length} problem${fail.length > 1 ? 's' : ''}:`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ pages — ${PAGES.length} pages at 1440px and 390px: no contrast failures, `
  + `no horizontal overflow, no console errors`);
