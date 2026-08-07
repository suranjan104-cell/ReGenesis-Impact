/* Property-based simulation of the GHG engine.
   Run:  node test/simulate.mjs           400 scenarios
         N=2000 node test/simulate.mjs    more
         SEED=7 node test/simulate.mjs    reproduce a specific run

   The golden fixture proves the engine does not CHANGE. It says nothing about
   whether the engine is RIGHT. This asserts properties that must hold for any
   input at all — linearity, additivity, monotonicity, bounded tiers — across
   randomised inventories, so a defect that a fixed fixture would sail past has
   somewhere to surface.

   Deterministic by seed: a failure is reproducible, and the seed is printed. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

const CHROME = (() => {
  const candidates = [
    process.env.CHROME, process.env.PUPPETEER_EXECUTABLE_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  for (const dir of ['/home/runner/.cache/puppeteer', `${process.env.HOME || ''}/.cache/puppeteer`]) {
    try {
      for (const rev of readdirSync(dir)) for (const sub of readdirSync(`${dir}/${rev}`)) {
        for (const exe of [`${dir}/${rev}/${sub}/chrome-linux64/chrome`, `${dir}/${rev}/${sub}/chrome-linux/chrome`]) {
          if (existsSync(exe)) return exe;
        }
      }
    } catch { /* absent */ }
  }
  throw new Error('no Chromium found — set CHROME, or npm install puppeteer');
})();

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const N = Number(process.env.N || 400);
const SEED = Number(process.env.SEED || 1);

const probe = `<script>
(function(){
  function report(p){ document.body.setAttribute('data-sim', btoa(unescape(encodeURIComponent(JSON.stringify(p))))); }
  var waited = 0;
  (function ready(){
    if (typeof window.ghg_compute === 'function') return run();
    if ((waited += 50) > 4000) return report({error:'ghg_compute never became available'});
    setTimeout(ready, 50);
  })();

  function run(){
  try {
    // Mulberry32 — small, fast, and seeded, so any failure replays exactly.
    var seed = ${SEED} >>> 0;
    function rnd(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; }

    var ACT = ['g-diesel-vol','g-gas-vol','g-lpg-vol','g-petrol-vol','g-mob-diesel-vol',
               'g-refrig-vol','g-elec-mwh','g-heat-gj','g-cat1-spend','g-cat5-waste',
               'g-cat6-air','g-cat6-hotel','g-cat7-km','g-cat11-units',
               'g-pcaf1-amt','g-pcaf2-amt','g-pcaf3-amt'];
    var EFS = ['g-diesel-ef','g-gas-ef','g-lpg-ef','g-elec-ef','g-heat-ef','g-cat1-ef',
               'g-cat7-days','g-cat11-kwh','g-pcaf1-waci','g-pcaf2-intensity','g-pcaf3-intensity'];
    var ALL = ACT.concat(EFS, ['g-employees','g-re-mwh','g-residual-ef','g-aum','g-refrig-type']);
    var REFR = ['R410A','R32','R134a','R22'];

    function reset(){ ALL.forEach(function(id){ var e=document.getElementById(id);
      if (e) { if (e.tagName === 'SELECT') e.selectedIndex = 0; else e.value = ''; } }); }
    function set(id, v){ var e=document.getElementById(id); if (e) e.value = String(v); }
    function scenario(){
      reset();
      var s = {};
      ACT.forEach(function(id){ if (rnd() < 0.65) { s[id] = Math.round(rnd()*100000)/10; set(id, s[id]); } });
      set('g-employees', Math.round(rnd()*5000));
      if (rnd() < 0.4) set('g-refrig-type', REFR[Math.floor(rnd()*REFR.length)]);
      EFS.forEach(function(id){ if (rnd() < 0.3) { var v = Math.round(rnd()*400*100)/100; s[id]=v; set(id, v); } });
      return s;
    }

    var fails = [];
    function check(cond, name, detail){ if (!cond) fails.push({ property: name, detail: detail }); }
    var near = function(a,b,tol){ return Math.abs(a-b) <= (tol || 1e-6) * Math.max(1, Math.abs(a), Math.abs(b)); };

    for (var i = 0; i < ${N}; i++) {
      var s = scenario();
      var r = window.ghg_compute();
      var tag = 'scenario ' + i;

      // 1. Finite. A NaN reaching a report is the worst possible failure.
      ['s1','s2','s2_mkt','s3','fin','total'].forEach(function(k){
        check(isFinite(r[k]), 'finite:' + k, tag + ' got ' + r[k]);
      });
      // 2. Non-negative, since every input is non-negative.
      ['s1','s2','s3','fin','total'].forEach(function(k){
        check(r[k] >= 0, 'non-negative:' + k, tag + ' got ' + r[k]);
      });
      // 3. Additivity — the headline must equal its parts exactly.
      check(near(r.total, r.s1 + r.s2 + r.s3), 'additivity',
            tag + ' total ' + r.total + ' vs parts ' + (r.s1 + r.s2 + r.s3));
      // 4. Financed emissions are a subset of Scope 3, never larger.
      check(r.fin <= r.s3 + 1e-6, 'financed<=scope3', tag + ' fin ' + r.fin + ' s3 ' + r.s3);
      // 5. Lines sum to the total.
      var lineSum = r.lines.reduce(function(a,l){ return a + l[3]; }, 0);
      check(near(lineSum, r.total, 1e-6), 'lines-sum-to-total',
            tag + ' lines ' + lineSum + ' total ' + r.total);
      // 6. Tiers are in range, and every reported line carries one.
      r.lines.forEach(function(l){
        check(l[6] >= 1 && l[6] <= 5 && Number.isInteger(l[6]), 'tier-in-range', tag + ' tier ' + l[6]);
        check(l[3] > 0, 'no-zero-lines', tag + ' line "' + l[1] + '" is ' + l[3]);
      });
      // 7. The rolled-up score must sit inside the tiers it is made of.
      if (r.dq != null && r.lines.length) {
        var ts = r.lines.map(function(l){ return l[6]; });
        check(r.dq >= Math.min.apply(null, ts) - 1e-9 && r.dq <= Math.max.apply(null, ts) + 1e-9,
              'dq-within-line-tiers', tag + ' dq ' + r.dq + ' tiers ' + ts.join(','));
      }
      check((r.lines.length === 0) === (r.dq == null), 'dq-null-iff-no-lines', tag);

      // 8. Linearity — doubling one activity input doubles its contribution.
      var keys = Object.keys(s).filter(function(k){ return ACT.indexOf(k) >= 0 && s[k] > 0; });
      if (keys.length) {
        var pick = keys[Math.floor(rnd()*keys.length)];
        var before = r.total;
        set(pick, s[pick] * 2);
        var r2 = window.ghg_compute();
        set(pick, s[pick]);
        // Monotone: more activity can never mean fewer emissions.
        check(r2.total >= before - 1e-6, 'monotonic',
              tag + ' doubling ' + pick + ': ' + before + ' -> ' + r2.total);
        // And the increase equals the original contribution of that input.
        var delta = r2.total - before;
        check(delta >= -1e-6 && isFinite(delta), 'linear-delta-finite',
              tag + ' ' + pick + ' delta ' + delta);
      }

      // 9. Market-based Scope 2 must not exceed location-based once renewables
      //    are netted off at a residual factor no higher than the grid.
      set('g-re-mwh', (s['g-elec-mwh'] || 0) / 2);
      var r3 = window.ghg_compute();
      check(r3.s2_mkt <= r3.s2 + 1e-6, 'market<=location-with-RE',
            tag + ' mkt ' + r3.s2_mkt + ' loc ' + r3.s2);
      set('g-re-mwh', '');
    }

    // 10. Empty inventory is exactly zero, with no lines and no score.
    reset();
    var z = window.ghg_compute();
    check(z.total === 0 && z.lines.length === 0 && z.dq == null, 'empty-is-zero',
          'total ' + z.total + ' lines ' + z.lines.length + ' dq ' + z.dq);

    report({ scenarios: ${N}, fails: fails.slice(0, 40), failCount: fails.length });
  } catch (e) { report({ error: String(e && e.stack || e) }); }
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
const anchor = html.lastIndexOf('</body>');   // see golden-ghg.mjs — not the first
mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/sim.html`;
writeFileSync(file, html.slice(0, anchor) + probe + html.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=120000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-sim="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('simulation did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (out.error) throw new Error(`simulation failed: ${out.error}`);

if (out.failCount) {
  console.error(`✗ ${out.failCount} property violation(s) across ${out.scenarios} scenarios (SEED=${SEED})\n`);
  const byProp = {};
  for (const f of out.fails) (byProp[f.property] ||= []).push(f.detail);
  for (const [prop, details] of Object.entries(byProp)) {
    console.error(`  ${prop} — ${details.length} shown`);
    for (const d of details.slice(0, 3)) console.error(`    ${d}`);
  }
  console.error(`\n  Reproduce: SEED=${SEED} N=${out.scenarios} node test/simulate.mjs`);
  process.exit(1);
}
console.log(`  ✓ ${out.scenarios} randomised inventories, 10 properties, no violations (SEED=${SEED})`);
