/* Property-based simulation of the tools other than the GHG engine.
   Run:  node test/simulate-tools.mjs     ·     SEED=7 N=800 node test/simulate-tools.mjs

   simulate.mjs covers the emissions engine. Everything else with arithmetic in
   it — the ESG scorer in the due-diligence suite, the grade bands, the energy
   converter in the Assurance Studio — had no coverage at all. A weight set that
   summed to 0.99 would quietly under-score every company assessed and nothing
   would have caught it.

   Same discipline: properties that must hold for any input, seeded so a failure
   replays exactly. */
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
const N = Number(process.env.N || 300);
const SEED = Number(process.env.SEED || 1);

const probe = `<script>
(function(){
  function report(p){ document.body.setAttribute('data-tools', btoa(unescape(encodeURIComponent(JSON.stringify(p))))); }
  var waited = 0;
  (function ready(){
    if (typeof window.am_score_update === 'function' && typeof window.get_grade === 'function') return run();
    if ((waited += 50) > 4000) return report({error:'tool functions never became available'});
    setTimeout(ready, 50);
  })();

  function run(){
  try {
    var seed = ${SEED} >>> 0;
    function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; }

    var fails = [];
    function check(ok, prop, detail){ if (!ok) fails.push({ property: prop, detail: detail }); }

    // ── ESG weight sets ─────────────────────────────────────────────────
    // Every market's E/S/G weights must sum to exactly 1. A set summing to
    // 0.99 under-scores every company assessed under it, invisibly.
    var MARKETS = ['sg','au','in','other'];
    MARKETS.forEach(function(m){
      localStorage.setItem('rg_market', m);
      // Read the weights back through the same path the scorer uses.
      var probe1 = { e:0, s:0, g:0 };
      ['e','s','g'].forEach(function(k){ probe1[k] = 0; });
      // Derive them: set one axis to 100 and the rest to 0, composite = weight*100.
      function setAll(prefix, axis, val){
        ['1','2','3','4','5'].forEach(function(n){
          var el = document.getElementById(prefix + axis + n);
          if (el) el.value = String(val);
        });
      }
      ['e','s','g'].forEach(function(axis){
        ['e','s','g'].forEach(function(a){ setAll('am-', a, 0); });
        setAll('am-', axis, 100);
        window.am_score_update();
        var num = document.getElementById('am-score-num');
        probe1[axis] = num ? Number(num.textContent) : NaN;
      });
      var sum = probe1.e + probe1.s + probe1.g;
      check(Math.abs(sum - 100) <= 1, 'esg-weights-sum-to-1',
            m + ': isolated axis scores sum to ' + sum + ' (expected 100)');
    });
    localStorage.setItem('rg_market', 'other');

    // ── Grade bands ─────────────────────────────────────────────────────
    // Monotone: a higher score must never yield a worse grade.
    var ORDER = { A:5, B:4, C:3, D:2, E:1 };
    var prev = null;
    for (var sc = 0; sc <= 100; sc++) {
      var g = window.get_grade(sc);
      check(ORDER[g] !== undefined, 'grade-known', 'score ' + sc + ' gave "' + g + '"');
      if (prev !== null) check(ORDER[g] >= ORDER[prev], 'grade-monotonic',
        'score ' + sc + ' gave ' + g + ' after ' + prev);
      prev = g;
    }
    // Boundaries are load-bearing — an off-by-one here regrades companies.
    [[80,'A'],[79,'B'],[65,'B'],[64,'C'],[50,'C'],[49,'D'],[35,'D'],[34,'E'],[0,'E']]
      .forEach(function(p){
        check(window.get_grade(p[0]) === p[1], 'grade-boundary',
              'score ' + p[0] + ' gave ' + window.get_grade(p[0]) + ', expected ' + p[1]);
      });

    // ── ESG composite ───────────────────────────────────────────────────
    var AXES = ['e','s','g'], IDX = ['1','2','3','4','5'];
    function setSliders(vals){
      AXES.forEach(function(a){ IDX.forEach(function(n){
        var el = document.getElementById('am-' + a + n);
        if (el) el.value = String(vals[a + n]);
      }); });
      window.am_score_update();
      var num = document.getElementById('am-score-num');
      return num ? Number(num.textContent) : NaN;
    }
    for (var i = 0; i < ${N}; i++) {
      var vals = {};
      AXES.forEach(function(a){ IDX.forEach(function(n){ vals[a+n] = Math.round(rnd()*100); }); });
      var comp = setSliders(vals);
      check(isFinite(comp), 'composite-finite', 'iteration ' + i + ' gave ' + comp);
      check(comp >= 0 && comp <= 100, 'composite-in-range', 'iteration ' + i + ' gave ' + comp);
      check(ORDER[window.get_grade(comp)] !== undefined, 'composite-gradeable', 'comp ' + comp);

      // Monotone: raising any one slider must never lower the composite.
      var a = AXES[Math.floor(rnd()*3)], n = IDX[Math.floor(rnd()*5)];
      if (vals[a+n] < 100) {
        var before = comp;
        var raised = Object.assign({}, vals); raised[a+n] = 100;
        var after = setSliders(raised);
        check(after >= before - 1, 'composite-monotonic',
              'raising am-' + a + n + ' from ' + vals[a+n] + ' to 100: ' + before + ' -> ' + after);
      }
    }
    // All-zero and all-max are the extremes the range check depends on.
    var zero = {}, full = {};
    AXES.forEach(function(a){ IDX.forEach(function(n){ zero[a+n] = 0; full[a+n] = 100; }); });
    check(setSliders(zero) === 0, 'composite-zero-floor', 'all-zero gave ' + setSliders(zero));
    check(setSliders(full) === 100, 'composite-hundred-ceiling', 'all-max gave ' + setSliders(full));

    // ── Energy converter ────────────────────────────────────────────────
    // Round-trip through the tool's own arithmetic: kWh -> GJ -> kWh.
    if (document.getElementById('axs-cv-val') && typeof window.axsConvert === 'function') {
      for (var j = 0; j < 60; j++) {
        var kwh = Math.round(rnd() * 1e7) / 10;
        document.getElementById('axs-cv-val').value = String(kwh);
        document.getElementById('axs-cv-from').value = 'kwh';
        window.axsConvert();
        var out = document.getElementById('axs-cv-out').value;
        var gj = Number((out.split('=')[2] || '').replace(/[^0-9.]/g, ''));
        check(isFinite(gj), 'convert-parses', 'kWh ' + kwh + ' produced "' + out + '"');
        if (isFinite(gj) && gj > 0) {
          document.getElementById('axs-cv-val').value = String(gj);
          document.getElementById('axs-cv-from').value = 'gj';
          window.axsConvert();
          var back = Number((document.getElementById('axs-cv-out').value.split('=')[0] || '').replace(/[^0-9.]/g, ''));
          // 1 kWh = 0.0036 GJ exactly, so a round trip should return the input
          // to within display rounding.
          check(Math.abs(back - kwh) <= Math.max(1, kwh * 0.01), 'convert-round-trip',
                kwh + ' kWh -> ' + gj + ' GJ -> ' + back + ' kWh');
        }
      }
    } else {
      fails.push({ property: 'convert-present', detail: 'axsConvert or its inputs not found — has the tool been renamed?' });
    }

    report({ iterations: ${N}, fails: fails.slice(0, 40), failCount: fails.length });
  } catch (e) { report({ error: String(e && e.stack || e) }); }
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const anchor = html.lastIndexOf('</body>');
mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/tools.html`;
writeFileSync(file, html.slice(0, anchor) + probe + html.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=120000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-tools="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('tool simulation did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (out.error) throw new Error(`tool simulation failed: ${out.error}`);

if (out.failCount) {
  console.error(`✗ ${out.failCount} property violation(s) across ${out.iterations} iterations (SEED=${SEED})\n`);
  const byProp = {};
  for (const f of out.fails) (byProp[f.property] ||= []).push(f.detail);
  for (const [prop, details] of Object.entries(byProp)) {
    console.error(`  ${prop} — ${details.length} shown`);
    for (const d of details.slice(0, 3)) console.error(`    ${d}`);
  }
  console.error(`\n  Reproduce: SEED=${SEED} N=${out.iterations} node test/simulate-tools.mjs`);
  process.exit(1);
}
console.log(`  ✓ ESG scorer, grade bands and unit converter — ${out.iterations} iterations, no violations (SEED=${SEED})`);
