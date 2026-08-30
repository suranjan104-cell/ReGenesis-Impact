/* Property-based simulation of the EU Taxonomy Article 8 engine.
   Run:  node test/simulate-esrs.mjs     ·     SEED=7 N=2000 node test/simulate-esrs.mjs

   Article 8 KPIs go into a filed report and are read by investors as the
   headline "how green is this company" number. The arithmetic is simple and
   that is precisely the risk: a share that quietly exceeds one, a band set
   that does not sum, or a safeguards failure that does not zero alignment all
   produce a number that looks right.

   The 10% materiality threshold is not hardcoded here. It is read from the
   compiled knowledge/esrs.json and passed in, so this test fails if the data
   file and the engine ever disagree about what the threshold is. */
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
const N = Number(process.env.N || 1500);
const SEED = Number(process.env.SEED || 1);

const esrs = JSON.parse(readFileSync(`${ROOT}/knowledge/esrs.json`, 'utf8'));
const THRESHOLD = esrs.taxonomy.simplification.materiality_threshold_percent / 100;
if (!(THRESHOLD > 0 && THRESHOLD < 1)) throw new Error(`threshold read from esrs.json is not a fraction: ${THRESHOLD}`);

const probe = `<script>
(function(){
  function report(p){ document.body.setAttribute('data-esrs', btoa(unescape(encodeURIComponent(JSON.stringify(p))))); }
  var waited = 0;
  (function ready(){
    if (typeof window.esrsTxCompute === 'function') return run();
    if ((waited += 50) > 4000) return report({error:'esrsTxCompute never became available'});
    setTimeout(ready, 50);
  })();

  function run(){
  try {
    var THR = ${THRESHOLD};
    var KPIS = ['turnover','capex','opex'];
    var seed = ${SEED} >>> 0;
    function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; }

    var fails = [];
    function check(ok, prop, detail){ if (!ok) fails.push({ property: prop, detail: detail }); }
    var EPS = 1e-9;

    // The threshold must have exactly one home. If the engine falls back to a
    // literal of its own, this call succeeds and the number can drift.
    var threw = false;
    try { window.esrsTxCompute('turnover', [], 100, true); } catch (e) { threw = true; }
    check(threw, 'threshold-single-source',
      'esrsTxCompute computed without a threshold and without loaded data — it is carrying a literal copy');

    for (var i = 0; i < ${N}; i++) {
      var n = Math.floor(rnd() * 7);
      var rows = [];
      for (var j = 0; j < n; j++) {
        rows.push({
          id: j, name: 'a' + j, obj: 'CCM',
          turnover: rnd() < 0.15 ? 0 : Math.round(rnd() * 500 * 100) / 100,
          capex:    rnd() < 0.15 ? 0 : Math.round(rnd() * 200 * 100) / 100,
          opex:     rnd() < 0.15 ? 0 : Math.round(rnd() * 80 * 100) / 100,
          sc: rnd() < 0.6, dnsh: rnd() < 0.6
        });
      }
      // Denominators sometimes below the sum, to exercise the over-entry path,
      // and sometimes zero, to exercise the divide-by-nothing path.
      var denom = rnd() < 0.1 ? 0 : Math.round(rnd() * 2000 * 100) / 100;
      var safe = rnd() < 0.7;

      for (var k = 0; k < KPIS.length; k++) {
        var kpi = KPIS[k];
        var r = window.esrsTxCompute(kpi, rows, denom, safe, THR);
        var tag = 'kpi=' + kpi + ' n=' + n + ' denom=' + denom + ' safe=' + safe;

        // 1 — every share is a finite fraction. NaN or Infinity here reaches a
        // filed report as a blank or a nonsense percentage.
        ['eligible','aligned','below','notEligible'].forEach(function(f){
          check(isFinite(r[f]) && r[f] >= -EPS && r[f] <= 1 + EPS, 'share-in-range', tag + ' ' + f + '=' + r[f]);
        });

        // 2 — aligned is a subset of eligible. An activity cannot be aligned
        // without being eligible, by construction of the regulation.
        check(r.aligned <= r.eligible + EPS, 'aligned-subset-of-eligible',
          tag + ' aligned=' + r.aligned + ' eligible=' + r.eligible);

        // 3 — the four bands partition the denominator exactly.
        if (denom > 0 && !r.over) {
          var sum = r.aligned + (r.eligible - r.aligned) + r.below + r.notEligible;
          check(Math.abs(sum - 1) < 1e-6, 'bands-partition', tag + ' sum=' + sum);
        }

        // 4 — minimum safeguards are an entity-level gate. Failing them zeroes
        // alignment across every activity, whatever its screening criteria say.
        if (!safe) check(r.aligned === 0, 'safeguards-zero-alignment', tag + ' aligned=' + r.aligned);

        // 5 — nothing below the threshold is assessed, for this KPI.
        var expectBelow = 0, expectEligible = 0, expectAligned = 0, expectSkipped = 0;
        for (var q = 0; q < rows.length; q++) {
          var v = rows[q][kpi];
          if (!v) continue;
          if (denom > 0 && v / denom < THR) { expectBelow += v; expectSkipped++; continue; }
          expectEligible += v;
          if (rows[q].sc && rows[q].dnsh && safe) expectAligned += v;
        }
        check(Math.abs(r.belowValue - expectBelow) < 1e-6, 'threshold-excludes', tag + ' below=' + r.belowValue + ' expected=' + expectBelow);
        check(r.skipped === expectSkipped, 'skipped-count', tag + ' skipped=' + r.skipped + ' expected=' + expectSkipped);
        check(Math.abs(r.eligibleValue - expectEligible) < 1e-6, 'eligible-value', tag + ' ' + r.eligibleValue + ' vs ' + expectEligible);
        check(Math.abs(r.alignedValue - expectAligned) < 1e-6, 'aligned-value', tag + ' ' + r.alignedValue + ' vs ' + expectAligned);

        // 6 — no denominator means no shares, not a division by zero.
        if (denom === 0) {
          check(r.eligible === 0 && r.aligned === 0 && r.below === 0 && r.notEligible === 0,
            'no-denominator-no-shares', tag);
        }

        // 7 — scale invariance. Article 8 KPIs are ratios; reporting in
        // thousands rather than millions must not move them.
        if (denom > 0) {
          var scaled = rows.map(function(x){
            var c = { sc: x.sc, dnsh: x.dnsh };
            KPIS.forEach(function(kk){ c[kk] = x[kk] * 1000; });
            return c;
          });
          var rs = window.esrsTxCompute(kpi, scaled, denom * 1000, safe, THR);
          check(Math.abs(rs.aligned - r.aligned) < 1e-9 && Math.abs(rs.eligible - r.eligible) < 1e-9,
            'scale-invariant', tag + ' aligned ' + r.aligned + ' -> ' + rs.aligned);
        }

        // 8 — turning safeguards on can only raise alignment, never lower it.
        var rOn = window.esrsTxCompute(kpi, rows, denom, true, THR);
        check(rOn.aligned >= r.aligned - EPS, 'safeguards-monotone', tag + ' off=' + r.aligned + ' on=' + rOn.aligned);

        // 9 — an activity with no value in this KPI cannot change this KPI.
        var padded = rows.concat([{ sc: true, dnsh: true, turnover: 0, capex: 0, opex: 0 }]);
        var rp = window.esrsTxCompute(kpi, padded, denom, safe, THR);
        check(Math.abs(rp.aligned - r.aligned) < 1e-9 && Math.abs(rp.eligible - r.eligible) < 1e-9,
          'zero-activity-inert', tag);

        // 10 — over-entry is flagged rather than silently producing a share
        // above one hundred per cent.
        if (denom > 0) {
          var entered = expectEligible + expectBelow;
          check(r.over === (entered > denom + EPS), 'over-entry-flagged',
            tag + ' entered=' + entered + ' denom=' + denom + ' flag=' + r.over);
        }
      }
    }

    report({ iterations: ${N}, threshold: THR, fails: fails.slice(0, 40), failCount: fails.length });
  } catch (e) { report({ error: String(e && e.stack || e) }); }
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const anchor = html.lastIndexOf('</body>');
mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/esrs.html`;
writeFileSync(file, html.slice(0, anchor) + probe + html.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=180000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-esrs="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('ESRS simulation did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (out.error) throw new Error(`ESRS simulation failed: ${out.error}`);

if (out.failCount) {
  console.error(`✗ ${out.failCount} property violation(s) across ${out.iterations} iterations (SEED=${SEED})\n`);
  const byProp = {};
  for (const f of out.fails) (byProp[f.property] ||= []).push(f.detail);
  for (const [prop, details] of Object.entries(byProp)) {
    console.error(`  ${prop} — ${details.length} shown`);
    for (const d of details.slice(0, 3)) console.error(`    ${d}`);
  }
  console.error(`\n  Reproduce: SEED=${SEED} N=${out.iterations} node test/simulate-esrs.mjs`);
  process.exit(1);
}
console.log(`  ✓ EU Taxonomy Article 8 engine — ${out.iterations} iterations × 3 KPIs × 10 properties, no violations (SEED=${SEED}, threshold ${(out.threshold*100).toFixed(0)}%)`);
