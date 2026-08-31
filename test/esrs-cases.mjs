/* Every worked case loads into the real engine and produces a result.
   Run:  node test/esrs-cases.mjs

   These cases are published as "press load and the real calculation runs", so
   the claim has to be true. This drives each one in a browser and asserts that
   the panel it targets actually populates, that nothing throws, and — the bug
   this caught — that one case's result does not survive into the next. A
   taxonomy-only case was leaving the previous case's scope verdict on screen,
   so a reader attributed one entity's numbers to another. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

const CHROME = (() => {
  const c = [process.env.CHROME, process.env.PUPPETEER_EXECUTABLE_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
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
const DATA = { esrs: read('esrs.json'), factors: read('factors.json'),
               standards: read('standards.json'), kb: read('kb.json'), markets: read('markets.json') };
const CASES = DATA.esrs.cases.cases;

const stub = `<script>window.__E__=[];window.alert=function(){};
window.addEventListener('error',function(e){window.__E__.push(e.message);});
window.addEventListener('unhandledrejection',function(e){window.__E__.push('REJ '+((e.reason&&e.reason.message)||e.reason));});
(function(){var M=${JSON.stringify({
  'knowledge/esrs.json': DATA.esrs, 'knowledge/factors.json': DATA.factors,
  'knowledge/standards.json': DATA.standards, 'knowledge/kb.json': DATA.kb,
  'knowledge/markets.json': DATA.markets })};
var of=window.fetch;window.fetch=function(u){var k=String(u);
  if(M[k])return Promise.resolve({ok:true,json:function(){return Promise.resolve(M[k]);}});
  return Promise.resolve({ok:true,json:function(){return Promise.resolve({});}});};})();</script>`;

const probe = `<script>
(function(){
  var CASES = ${JSON.stringify(CASES.map(c => ({ id: c.id, scope: !!c.scope, tax: !!c.taxonomy })))};
  function done(o){ o.errs = window.__E__.slice(0, 8);
    document.body.setAttribute('data-c', btoa(unescape(encodeURIComponent(JSON.stringify(o))))); }
  var w = 0;
  setTimeout(function(){ try { showPage('esrs'); } catch(e){} }, 400);
  (function ready(){
    if (document.querySelectorAll('#es-cases .es-case').length) return run();
    if ((w += 120) > 15000) return done({ error: 'the worked cases never rendered' });
    setTimeout(ready, 120);
  })();
  function run(){
    var out = { cards: document.querySelectorAll('#es-cases .es-case').length, results: {} };
    var shown = function(id){ var e = document.getElementById(id);
      return !!(e && e.className.indexOf('show') >= 0 && (e.textContent || '').trim()); };
    CASES.forEach(function(c){
      try { esrsCaseLoad(c.id); } catch(e){ out.results[c.id] = { threw: e.message }; return; }
      out.results[c.id] = {
        scope: shown('es-scope-res'), tax: shown('es-tx-res'),
        banner: shown('es-case-loaded'),
        // The activity rows the case put into the form, to catch a taxonomy
        // case that loads its denominators but not its activities.
        rows: document.querySelectorAll('#es-tx-rows tr').length
      };
    });
    done(out);
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/cases.html`;
const withStub = html.replace('</head>', stub + '</head>');
const anchor = withStub.lastIndexOf('</body>');
writeFileSync(file, withStub.slice(0, anchor) + probe + withStub.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=60000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-c="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('case probe did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (out.error) { console.error(`✗ ${out.error}`); process.exit(1); }

const fail = [];
if (out.cards !== CASES.length) fail.push(`${out.cards} case cards rendered, ${CASES.length} defined`);
for (const c of CASES) {
  const r = out.results[c.id];
  if (!r) { fail.push(`${c.id}: never loaded`); continue; }
  if (r.threw) { fail.push(`${c.id}: threw — ${r.threw}`); continue; }
  if (!r.banner) fail.push(`${c.id}: loaded without confirming which case is on screen`);
  if (c.scope && !r.scope) fail.push(`${c.id}: has scope inputs but produced no scope verdict`);
  if (c.taxonomy && !r.tax) fail.push(`${c.id}: has taxonomy inputs but produced no Article 8 result`);
  // State bleed: a case with no scope inputs must not leave a scope verdict up.
  if (!c.scope && r.scope) fail.push(`${c.id}: shows a scope verdict from a previously loaded case`);
  if (!c.taxonomy && r.tax) fail.push(`${c.id}: shows an Article 8 result from a previously loaded case`);
  if (c.taxonomy && r.rows < c.taxonomy.activities.length)
    fail.push(`${c.id}: ${r.rows} activity rows loaded, ${c.taxonomy.activities.length} defined`);
}
for (const e of out.errs || []) fail.push(`console error while loading cases — ${e}`);

if (fail.length) {
  console.error(`✗ worked cases — ${fail.length} problem${fail.length === 1 ? '' : 's'}:\n`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ worked cases — all ${CASES.length} load into the real engine, produce their own result, and leave no state behind`);
