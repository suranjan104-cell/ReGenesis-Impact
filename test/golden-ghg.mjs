/* Golden-value fixture for the GHG calculation engine.
   Run:  node test/golden-ghg.mjs          verify against test/golden-ghg.json
         node test/golden-ghg.mjs --write   regenerate the fixture

   Why this exists: Phase 1 moves every emission factor out of index.html and
   into knowledge/factors.json. That refactor touches live numeric paths. The
   failure mode is silently changing a number a user has already put in a
   report, so this captures the engine's exact output BEFORE the move and
   asserts it byte-identical after.

   It drives the real page in headless Chromium rather than re-implementing the
   maths — a reimplementation would only prove the reimplementation agrees with
   itself. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const FIXTURE = `${ROOT}/test/golden-ghg.json`;
const WRITE = process.argv.includes('--write');

/* Every scenario is a plain id→value map applied to the DOM before calling
   ghg_compute(). Between scenarios all inputs reset, so each is independent.
   Coverage aims at every branch the engine can take, not at realistic totals. */
const BASE = {
  'g-diesel-vol': 12000, 'g-gas-vol': 4500, 'g-lpg-vol': 800,
  'g-petrol-vol': 45000, 'g-mob-diesel-vol': 30000,
  'g-refrig-vol': 500, 'g-refrig-type': 'R410A',
  'g-elec-mwh': 2400, 'g-heat-gj': 900,
  'g-employees': 320, 'g-cat1-spend': 18, 'g-cat5-waste': 140,
  'g-cat6-air': 1250000, 'g-cat6-hotel': 900, 'g-cat7-km': 22,
  'g-cat11-units': 50000,
  'g-pcaf1-amt': 250, 'g-pcaf2-amt': 120, 'g-pcaf3-amt': 60,
  'g-aum': 1800,
};

const SCENARIOS = [
  // 1. every input empty — the zero path, and proves line() suppresses zeros
  { name: 'empty', inputs: {} },
  // 2. activity data only, every factor left at its built-in default
  { name: 'defaults', inputs: BASE },
  // 3. every user-editable factor overridden — proves overrides are honoured
  {
    name: 'overrides',
    inputs: {
      ...BASE,
      'g-diesel-ef': 2.51, 'g-gas-ef': 54.3, 'g-lpg-ef': 3.02,
      'g-elec-ef': 0.408, 'g-heat-ef': 0.071,
      'g-cat1-ef': 410, 'g-cat7-days': 220, 'g-cat11-kwh': 210,
      'g-pcaf1-waci': 175, 'g-pcaf2-intensity': 31, 'g-pcaf3-intensity': 0.042,
    },
  },
  // 4. market-based Scope 2 — renewables netted off, residual factor applied
  {
    name: 'market-based',
    inputs: { ...BASE, 'g-re-mwh': 900, 'g-residual-ef': 0.62 },
  },
  // 5. financed emissions only — isolates the Cat 15 path from everything else
  {
    name: 'financed-only',
    inputs: {
      'g-pcaf1-amt': 250, 'g-pcaf1-waci': 150,
      'g-pcaf2-amt': 120, 'g-pcaf2-intensity': 25,
      'g-pcaf3-amt': 60, 'g-pcaf3-intensity': 0.035,
      'g-aum': 1800,
    },
  },
  // 6. one scenario per refrigerant — pins the whole GWP100 set, which is the
  //    single most error-prone table in the engine
  ...['R410A', 'R32', 'R134a', 'R407C', 'R404A', 'R22', 'CO2'].map(r => ({
    name: `refrigerant-${r}`,
    inputs: { 'g-refrig-vol': 1000, 'g-refrig-type': r },
  })),
  // 7. grid factor sweep — the Scope 2 location-based path across our markets
  ...[['IN', 0.716], ['AU', 0.51], ['SG', 0.408], ['GB', 0.207]].map(([m, ef]) => ({
    name: `grid-${m}`,
    inputs: { 'g-elec-mwh': 2400, 'g-elec-ef': ef },
  })),
];

/* ghg_compute is defined inside the page's DOMContentLoaded handler, so the
   probe polls for it rather than assuming it exists at parse time. */
const probe = `<script>
(function(){
  function report(payload){
    document.body.setAttribute('data-golden', btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
  }
  var waited = 0;
  function ready(){
    if (typeof window.ghg_compute === 'function') return run();
    if ((waited += 50) > 3000) return report({error:'ghg_compute never became available'});
    setTimeout(ready, 50);
  }
  ready();
  function run(){
  try {
    var SC = ${JSON.stringify(SCENARIOS)};
    // Every id the engine reads, so each scenario starts from a clean slate.
    var ALL = ${JSON.stringify([...new Set(SCENARIOS.flatMap(s => Object.keys(s.inputs)))])};
    var out = [];
    for (var i = 0; i < SC.length; i++) {
      ALL.forEach(function(id){
        var el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = '';
      });
      var missing = [];
      for (var id in SC[i].inputs) {
        var el = document.getElementById(id);
        if (!el) { missing.push(id); continue; }
        el.value = String(SC[i].inputs[id]);
      }
      var r = window.ghg_compute();
      out.push({
        name: SC[i].name,
        missingInputs: missing,
        // full precision — rounding here would hide exactly the drift we are testing for
        s1: r.s1, s2: r.s2, s2_mkt: r.s2_mkt, s3: r.s3, fin: r.fin, total: r.total,
        // the calculation strings embed the factor values, so they regress the
        // factors themselves and not merely the arithmetic
        lines: r.lines.map(function(l){ return [l[0], l[1], l[2], l[3]]; })
      });
    }
    report({ scenarios: out });
  } catch (e) { report({ error: String(e && e.message || e) }); }
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
/* Anchor on the LAST </body>. Three export routines build HTML strings that
   contain a literal '</body></html>', so matching the first one splices the
   probe into a JS string literal — and its </script> then terminates the block
   early, taking every global with it. */
const anchor = html.lastIndexOf('</body>');
if (anchor < 0) throw new Error('index.html has no </body> to anchor the probe');

mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const probeFile = `${ROOT}/test/.tmp/golden-probe.html`;
writeFileSync(probeFile, html.slice(0, anchor) + probe + html.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=4000', '--dump-dom', `file://${probeFile}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-golden="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('probe did not report — ghg_compute may not have loaded');
const result = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (result.error) throw new Error(`probe failed: ${result.error}`);

const missing = result.scenarios.flatMap(s => s.missingInputs.map(id => `${s.name}:${id}`));
if (missing.length) throw new Error(`inputs not found in the page: ${missing.join(', ')}`);

const actual = JSON.stringify(result.scenarios, null, 1) + '\n';

if (WRITE || !existsSync(FIXTURE)) {
  writeFileSync(FIXTURE, actual);
  const lines = result.scenarios.reduce((a, s) => a + s.lines.length, 0);
  console.log(`  wrote fixture — ${result.scenarios.length} scenarios, ${lines} audit-trail lines`);
  console.log(`  ${FIXTURE}`);
  process.exit(0);
}

const expected = readFileSync(FIXTURE, 'utf8');
if (actual === expected) {
  const lines = result.scenarios.reduce((a, s) => a + s.lines.length, 0);
  console.log(`  ✓ golden values unchanged — ${result.scenarios.length} scenarios, ${lines} audit-trail lines`);
  process.exit(0);
}

// Report the first differing scenario precisely rather than dumping both files.
const exp = JSON.parse(expected);
console.error('  ✗ GHG engine output changed\n');
for (let i = 0; i < Math.max(exp.length, result.scenarios.length); i++) {
  const a = exp[i], b = result.scenarios[i];
  if (JSON.stringify(a) === JSON.stringify(b)) continue;
  if (!a) { console.error(`  + scenario added: ${b.name}`); continue; }
  if (!b) { console.error(`  - scenario removed: ${a.name}`); continue; }
  console.error(`  scenario "${a.name}"`);
  for (const k of ['s1', 's2', 's2_mkt', 's3', 'fin', 'total']) {
    if (a[k] !== b[k]) console.error(`    ${k.padEnd(7)} ${a[k]}  →  ${b[k]}`);
  }
  const an = a.lines.length, bn = b.lines.length;
  if (an !== bn) console.error(`    lines   ${an}  →  ${bn}`);
  for (let j = 0; j < Math.min(an, bn); j++) {
    if (JSON.stringify(a.lines[j]) === JSON.stringify(b.lines[j])) continue;
    console.error(`    line ${j}  ${a.lines[j][1]}`);
    console.error(`      was  ${a.lines[j][2]}  = ${a.lines[j][3]}`);
    console.error(`      now  ${b.lines[j][2]}  = ${b.lines[j][3]}`);
  }
}
console.error('\n  If the change is intended, rerun with --write and say so in the commit.');
process.exit(1);
