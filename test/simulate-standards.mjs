/* Property-based simulation of the standards conformance engine.
   Run:  node test/simulate-standards.mjs   ·   SEED=7 N=1500 node test/simulate-standards.mjs

   Two things are being protected here.

   The conformance verdict, because "conforms to the GHG Protocol" is a
   sentence someone repeats to an assurance provider. A check that returns
   "met" for a condition nobody satisfied is worse than no check.

   And the ISO 14064-1 category view, because it is the same inventory
   presented a second way. The six categories must add to exactly what the
   three scopes add to. A line that loses its mapping vanishes from the
   category view while the scope total stays right — the two views disagree
   and nothing on the page looks wrong.

   The line list and the mapping are read from the compiled data rather than
   restated here, so this fails if the engine and the mapping drift apart. */
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
const N = Number(process.env.N || 900);
const SEED = Number(process.env.SEED || 1);

const std = JSON.parse(readFileSync(`${ROOT}/knowledge/standards.json`, 'utf8'));
const MAPPING = std.iso.line_mapping;
const REQS = std.ghgProtocol.requirements;
if (MAPPING.length < 5) throw new Error('mapping looks empty — did build-standards.mjs run?');

const probe = `<script>
(function(){
  function report(p){ document.body.setAttribute('data-std', btoa(unescape(encodeURIComponent(JSON.stringify(p))))); }
  var w = 0;
  (function ready(){
    if (typeof window.stdIsoView === 'function' && typeof window.stdEvaluate === 'function') return run();
    if ((w += 50) > 5000) return report({error:'standards functions never became available'});
    setTimeout(ready, 50);
  })();

  function run(){
  try {
    var MAPPING = ${JSON.stringify(MAPPING)};
    var REQS = ${JSON.stringify(REQS)};
    var LINES = MAPPING.map(function(m){ return m.line; });
    var seed = ${SEED} >>> 0;
    function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; }

    var fails = [];
    function check(ok, prop, detail){ if (!ok) fails.push({ property: prop, detail: detail }); }
    var EPS = 1e-9;

    /* Every requirement in the data must have a test the engine implements.
       A requirement whose test falls through to the default returns null and
       renders as "not checked" — which is honest, but it means the data and
       the engine have drifted and someone should know. */
    var emptyR = { s1:0, s2:0, s2_mkt:0, s3:0, fin:0, total:0, dq:null, lines:[], prov:{} };
    var fullMeta = { consolidation:'operational', baseyear:'FY2019', recalc:'policy', threshold:5,
                     exclusions:'none material', screened:true, verification:'limited', gwpSet:'AR4' };
    REQS.forEach(function(q){
      check(window.stdEvaluate(q.test, emptyR, fullMeta) !== null,
        'every-requirement-testable', q.code + ' (test "' + q.test + '") is not implemented by the engine');
    });
    // An unknown test must never read as satisfied.
    check(window.stdEvaluate('a_test_that_does_not_exist', emptyR, fullMeta) === null,
      'unknown-test-not-met', 'an unrecognised test did not return null');

    for (var i = 0; i < ${N}; i++) {
      // Build an inventory out of the lines the engine can actually emit.
      var lines = [], s1 = 0, s2 = 0, s3 = 0;
      LINES.forEach(function(name){
        if (rnd() < 0.25) return;                      // this line absent
        var t = Math.round(rnd() * 5000 * 100) / 100;
        if (rnd() < 0.08) t = 0;                       // present but zero
        lines.push([name, 'src', 'calc', t, 'ev', ['some-factor'], 1 + Math.floor(rnd() * 5)]);
        if (name === 'Scope 1') s1 += t; else if (name === 'Scope 2') s2 += t; else s3 += t;
      });
      var total = s1 + s2 + s3;
      var r = { s1:s1, s2:s2, s2_mkt: s2 * (0.7 + rnd() * 0.6), s3:s3, fin:0, total:total,
                dq: rnd() < 0.8 ? 1 + rnd() * 4 : null, lines: lines, prov:{} };
      var view = window.stdIsoView(r, MAPPING);
      var tag = 'i=' + i + ' lines=' + lines.length + ' total=' + total.toFixed(2);

      // 1 — the six categories reconcile to the scope total, exactly.
      check(Math.abs(view.mappedTotal + view.unmappedTotal - total) < 0.01,
        'iso-reconciles-to-scopes', tag + ' categories=' + (view.mappedTotal + view.unmappedTotal).toFixed(2));
      check(view.reconciles === true, 'reconcile-flag-true-when-it-does', tag);

      /* And the flag has to be capable of saying no. Every generated case
         above reconciles, so asserting it is true proves only that the happy
         path works — a flag hardcoded to true passes all of it. This feeds a
         total that deliberately disagrees with the lines, which is exactly
         what a drift between the engine's total and its line list looks like,
         and requires the flag to report the disagreement. */
      if (total > 1) {
        var skewed = { s1:s1, s2:s2, s2_mkt:r.s2_mkt, s3:s3, fin:0,
                       total: total + 1 + rnd() * 100, dq:r.dq, lines:lines, prov:{} };
        var vSkew = window.stdIsoView(skewed, MAPPING);
        check(vSkew.reconciles === false, 'reconcile-flag-false-when-it-does-not',
          tag + ' a total disagreeing with the lines by ' + (skewed.total - total).toFixed(2) + 't still read as reconciled');
      }

      // 2 — every line the engine emitted landed in exactly one category.
      check(view.unmapped.length === 0, 'no-unmapped-engine-lines',
        tag + ' unmapped=' + view.unmapped.map(function(u){ return u.line; }).join(','));

      // 3 — a category's total is the sum of the lines credited to it, and
      //     no line is credited twice.
      var seen = {}, dup = null;
      Object.keys(view.categories).forEach(function(c){
        view.categories[c].lines.forEach(function(ln){ if (seen[ln]) dup = ln; seen[ln] = 1; });
      });
      check(!dup, 'no-line-in-two-categories', tag + ' duplicated ' + dup);

      // 4 — categories 1 and 2 are Scope 1 and Scope 2 exactly. If these
      //     drift the whole cross-standard presentation is wrong.
      var c1 = view.categories[1] ? view.categories[1].tCO2e : 0;
      var c2 = view.categories[2] ? view.categories[2].tCO2e : 0;
      check(Math.abs(c1 - s1) < EPS, 'category1-equals-scope1', tag + ' c1=' + c1 + ' s1=' + s1);
      check(Math.abs(c2 - s2) < EPS, 'category2-equals-scope2', tag + ' c2=' + c2 + ' s2=' + s2);

      // 5 — categories 3 to 6 together are Scope 3 exactly.
      var s3cats = [3,4,5,6].reduce(function(n,c){ return n + (view.categories[c] ? view.categories[c].tCO2e : 0); }, 0);
      check(Math.abs(s3cats - s3) < 0.01, 'categories3to6-equal-scope3', tag + ' cats=' + s3cats + ' s3=' + s3);

      // 6 — no category total is negative or non-finite.
      Object.keys(view.categories).forEach(function(c){
        var t2 = view.categories[c].tCO2e;
        check(isFinite(t2) && t2 >= -EPS, 'category-total-sane', tag + ' cat ' + c + '=' + t2);
      });

      // 7 — a missing mapping must surface as unmapped, never be dropped.
      if (lines.length) {
        var short = MAPPING.filter(function(m){ return m.line !== lines[0][0]; });
        var v2 = window.stdIsoView(r, short);
        check(Math.abs(v2.mappedTotal + v2.unmappedTotal - total) < 0.01,
          'dropped-mapping-still-reconciles', tag + ' lost tonnes when a mapping was removed');
        if (lines[0][3] > 0)
          check(v2.unmapped.length > 0 && v2.unmappedTotal > 0,
            'dropped-mapping-flagged', tag + ' a line with no mapping was not reported as unmapped');
      }

      // 8 — conformance conditions actually depend on their input. Each of
      //     these is met with the full meta and unmet without it.
      var metaPairs = [
        ['consolidation_selected', 'consolidation', ''],
        ['baseyear_stated', 'baseyear', ''],
        ['gwp_stated', 'gwpSet', ''],
        ['exclusions_stated', 'exclusions', ''],
        ['scope3_screened', 'screened', false],
        ['verification_stated', 'verification', 'none']
      ];
      metaPairs.forEach(function(p){
        var m2 = JSON.parse(JSON.stringify(fullMeta));
        check(window.stdEvaluate(p[0], r, fullMeta) === true, 'condition-met-when-satisfied', p[0]);
        m2[p[1]] = p[2];
        check(window.stdEvaluate(p[0], r, m2) === false, 'condition-unmet-when-absent', p[0] + ' still read as met');
      });

      // 9 — a recalculation policy without a threshold is not a policy.
      var noThr = JSON.parse(JSON.stringify(fullMeta)); noThr.threshold = 0;
      check(window.stdEvaluate('recalc_policy', r, noThr) === false,
        'recalc-needs-threshold', 'a policy with no significance threshold read as met');

      // 10 — data quality only counts as present when it exists.
      var noDq = { s1:s1, s2:s2, s2_mkt:r.s2_mkt, s3:s3, fin:0, total:total, dq:null, lines:lines, prov:{} };
      check(window.stdEvaluate('dq_present', noDq, fullMeta) === false, 'dq-absent-detected', tag);
    }

    report({ iterations: ${N}, lines: LINES.length, requirements: REQS.length,
             fails: fails.slice(0, 40), failCount: fails.length });
  } catch (e) { report({ error: String(e && e.stack || e) }); }
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const anchor = html.lastIndexOf('</body>');
mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/standards.html`;
writeFileSync(file, html.slice(0, anchor) + probe + html.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=180000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-std="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('standards simulation did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (out.error) throw new Error(`standards simulation failed: ${out.error}`);

if (out.failCount) {
  console.error(`✗ ${out.failCount} property violation(s) across ${out.iterations} iterations (SEED=${SEED})\n`);
  const byProp = {};
  for (const f of out.fails) (byProp[f.property] ||= []).push(f.detail);
  for (const [prop, details] of Object.entries(byProp)) {
    console.error(`  ${prop} — ${details.length} shown`);
    for (const d of details.slice(0, 3)) console.error(`    ${d}`);
  }
  console.error(`\n  Reproduce: SEED=${SEED} N=${out.iterations} node test/simulate-standards.mjs`);
  process.exit(1);
}
console.log(`  ✓ GHG Protocol conformance and ISO 14064-1 category view — ${out.iterations} iterations, ${out.requirements} requirements, ${out.lines} mapped lines, no violations (SEED=${SEED})`);
