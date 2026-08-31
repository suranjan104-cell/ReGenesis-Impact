/* Every function called from an inline HTML handler must be reachable as a
   global.  Run:  node test/handlers.mjs

   This exists because three were not, and none of them showed up in any other
   check. index.html wraps most of its code in closures, so a plain
   `function foo(){}` inside one is invisible to `onclick="foo()"` — the handler
   throws ReferenceError at click time and the button silently does nothing.

   It cost: the Sage AI textarea threw on every keystroke and never grew, and
   every "Draft with Sage AI" button in the report generators was inert. A
   page-load audit reported zero errors for both, because neither fires until
   someone interacts.

   Static analysis is not enough here — whether a declaration is global depends
   on the scope it sits in — so this drives a real browser and asks it. */
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
const html = readFileSync(`${ROOT}/index.html`, 'utf8');

/* Collect the names, in Node, from the attributes themselves. A bare word
   followed by "(" that is not preceded by a dot is a call on something the
   handler expects to find in scope. */
const EVENTS = 'click|input|change|keydown|keyup|submit|focus|blur|mousemove|mouseleave|mouseenter|mousedown';
const BUILTIN = new Set(['if','for','while','return','function','typeof','new','catch','switch','do','else',
  'confirm','alert','prompt','parseInt','parseFloat','Number','String','Boolean','Array','Object','Date',
  'Math','JSON','setTimeout','setInterval','encodeURIComponent','decodeURIComponent','event','this','void']);
const names = new Set();
for (const m of html.matchAll(new RegExp(`\\bon(?:${EVENTS})="([^"]*)"`, 'g')))
  for (const f of m[1].matchAll(/(?<![.\w$'"])([A-Za-z_$][\w$]*)\s*\(/g))
    if (!BUILTIN.has(f[1])) names.add(f[1]);

const probe = `<script>
(function(){
  var NAMES = ${JSON.stringify([...names].sort())};
  setTimeout(function(){
    var missing = NAMES.filter(function(n){ return typeof window[n] !== 'function'; });
    document.body.setAttribute('data-h', btoa(unescape(encodeURIComponent(JSON.stringify({
      checked: NAMES.length, missing: missing })))));
  }, 3000);
})();
</script>`;

mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/handlers.html`;
const anchor = html.lastIndexOf('</body>');
writeFileSync(file, html.slice(0, anchor) + probe + html.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=45000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-h="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('handler probe did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));

/* Names that appear inside a JS template string being *built* — esc(...) inside
   a generated onclick — are evaluated when the HTML is assembled, not when the
   handler runs, so they are legitimately not global. */
const BUILD_TIME = new Set(['esc']);
const missing = out.missing.filter(n => !BUILD_TIME.has(n));

if (missing.length) {
  console.error(`✗ ${missing.length} inline handler(s) call a function that is not reachable as a global:\n`);
  for (const n of missing) {
    const where = (html.match(new RegExp(`\\bon(?:${EVENTS})="[^"]*\\b${n}\\([^"]*"`)) || [''])[0];
    console.error(`  - ${n}()  —  ${where.slice(0, 96)}`);
  }
  console.error(`\n  Fix by assigning it to window (window.${missing[0]} = function...), not by`);
  console.error(`  declaring it inside a closure. The handler runs in global scope.`);
  process.exit(1);
}
console.log(`  ✓ inline handlers — all ${out.checked} referenced functions reachable as globals`);
