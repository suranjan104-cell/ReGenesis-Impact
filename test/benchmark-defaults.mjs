/* Tests our defaults against what companies actually reported.
   Run:  node test/benchmark-defaults.mjs

   The simulation proves the engine is internally consistent. The golden fixture
   proves it does not drift. Neither can tell us whether a DEFAULT is anywhere
   near reality — only real disclosures can, and that is what this is for.

   It reports rather than fails. A default landing outside a plausible band is a
   finding about the factor, not a broken build, and the right response is to
   source the factor rather than to go red every night.

   Reads knowledge/benchmarks.json. With no entries it says so and exits 0 —
   the honest state until someone hand-reads ten reports. See
   knowledge/BENCHMARKS-PLAN.md. */
import { readFileSync, existsSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const bPath = `${ROOT}/knowledge/benchmarks.json`;
const fPath = `${ROOT}/knowledge/factors.json`;

if (!existsSync(bPath)) {
  console.log('  ○ no benchmarks.json — run node knowledge/build-benchmarks.mjs first');
  process.exit(0);
}
const bench = JSON.parse(readFileSync(bPath, 'utf8'));
const reg = JSON.parse(readFileSync(fPath, 'utf8'));
const factor = id => reg.factors.find(f => f.id === id);

if (!bench.count) {
  console.log('  ○ 0 benchmark entries — defaults cannot be validated against reality yet.');
  console.log('    Ten hand-read disclosures would test whether our unsourced defaults are');
  console.log('    even the right order of magnitude. See knowledge/BENCHMARKS-PLAN.md.');
  process.exit(0);
}

/* Each check states what it is testing and why the band is what it is. A band
   with no stated reasoning is a number we would have to defend later. */
const findings = [];

// 1. Scope 2 dominance. For a services or financial entity, purchased
//    electricity is normally the largest operational line. If our grid factors
//    were badly wrong, reported Scope 1:2 ratios would sit far from ours.
for (const b of bench.entries) {
  const { scope1, scope2_location } = b.figures;
  if (scope1 > 0 && scope2_location > 0) {
    const ratio = scope2_location / scope1;
    if (/bank|financ|insur|asset/i.test(b.sector) && ratio < 1) {
      findings.push(`${b.entity} ${b.period}: Scope 2 below Scope 1 (ratio ${ratio.toFixed(2)}) — unusual for ${b.sector}; check the boundary or our assumption that it is unusual`);
    }
  }
}

// 2. Scope 3 share. Where Scope 3 is reported at all, it is typically an order
//    of magnitude above operational emissions. A low share usually means few
//    categories were counted, which the omitted list should corroborate.
for (const b of bench.entries) {
  const op = b.figures.scope1 + b.figures.scope2_location;
  if (op > 0 && b.figures.scope3_total > 0) {
    const mult = b.figures.scope3_total / op;
    const reported = (b.scope3_categories_reported || []).length;
    if (mult < 2 && reported >= 8) {
      findings.push(`${b.entity} ${b.period}: Scope 3 only ${mult.toFixed(1)}x operational despite ${reported} categories reported — worth rechecking`);
    }
  }
}

// 3. Financed emissions dominance for FIs — the claim our own briefing makes.
//    If real disclosures do not show it, the briefing is wrong, not the data.
const fis = bench.entries.filter(b => typeof b.figures.scope3_cat15 === 'number' && b.figures.scope3_total > 0);
if (fis.length) {
  const shares = fis.map(b => b.figures.scope3_cat15 / b.figures.scope3_total);
  const median = shares.slice().sort((a, z) => a - z)[Math.floor(shares.length / 2)];
  console.log(`  Cat 15 share of Scope 3 — median ${(median * 100).toFixed(0)}% across ${fis.length} financial institution(s)`);
  if (median < 0.5) {
    findings.push(`Cat 15 median share is ${(median * 100).toFixed(0)}% — our financed-emissions briefing assumes it dominates. Recheck the claim.`);
  }
}

// 4. The one that matters most: is the unsourced Cat 1 default the right order
//    of magnitude? Cannot be answered without spend data, so this states the
//    gap rather than inventing a comparison.
const cat1 = factor('s3-cat1-spend');
if (cat1 && cat1.source.publisher === 'Not established') {
  console.log(`  s3-cat1-spend is still unsourced (${cat1.value} ${cat1.unit}).`);
  console.log('    Validating it needs reported spend alongside reported Cat 1, which few');
  console.log('    disclosures give. Record both where a report does, and this can test it.');
}

console.log('');
if (findings.length) {
  console.log(`  ${findings.length} thing(s) worth looking at:`);
  for (const f of findings) console.log('   - ' + f);
} else {
  console.log(`  ✓ ${bench.count} benchmark entries, nothing anomalous against our defaults`);
}
console.log(`  ${bench.assured} of ${bench.count} carry assurance.`);
