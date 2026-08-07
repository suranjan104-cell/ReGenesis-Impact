#!/usr/bin/env node
// Validates hand-read company disclosures and compiles knowledge/benchmarks.json.
// Usage: node knowledge/build-benchmarks.mjs
//
// Built to the same discipline as the factor register, for the same reason: the
// value of this data is entirely in whether each figure can be traced back to a
// page someone actually read. A benchmark you cannot cite is worse than no
// benchmark, because it looks like evidence.
//
// Files beginning with _ are ignored, so _TEMPLATE.json stays as documentation.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dir = join(root, 'benchmarks');

const MARKETS = ['IN', 'AU', 'SG', 'GB', 'US', 'EU', 'global'];
const ASSURANCE = ['none', 'limited', 'reasonable'];
const CONFIDENCE = ['high', 'medium', 'low'];

const errors = [];
const seen = new Set();
const all = [];

const files = existsSync(dir)
  ? readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort()
  : [];

for (const file of files) {
  let rows;
  try { rows = JSON.parse(readFileSync(join(dir, file), 'utf8')); }
  catch (e) { errors.push(`${file}: invalid JSON — ${e.message}`); continue; }
  if (!Array.isArray(rows)) { errors.push(`${file}: root must be an array`); continue; }

  for (const b of rows) {
    const where = `${file} → ${b?.id ?? '<no id>'}`;
    if (!b.id) errors.push(`${where}: missing id`);
    else if (seen.has(b.id)) errors.push(`${where}: duplicate id`);
    else seen.add(b.id);
    if (!b.entity) errors.push(`${where}: entity required — the legal name as printed in the report`);
    if (!MARKETS.includes(b.market)) errors.push(`${where}: market must be one of ${MARKETS.join('|')}`);
    if (!b.sector) errors.push(`${where}: sector required`);
    if (!/^FY\d{4}(-\d{2})?$/.test(b.period ?? '')) errors.push(`${where}: period must look like FY2024 or FY2024-25`);

    const f = b.figures;
    if (!f || typeof f !== 'object') errors.push(`${where}: figures object required`);
    else {
      for (const k of ['scope1', 'scope2_location', 'scope3_total']) {
        if (typeof f[k] !== 'number' || !isFinite(f[k]) || f[k] < 0)
          errors.push(`${where}: figures.${k} must be a non-negative number`);
      }
      if (f.unit !== 'tCO2e') errors.push(`${where}: figures.unit must be tCO2e — convert before recording`);
      // A reported Scope 3 total below a reported Cat 15 is arithmetically
      // impossible and means one of them was misread.
      if (typeof f.scope3_cat15 === 'number' && typeof f.scope3_total === 'number'
          && f.scope3_cat15 > f.scope3_total)
        errors.push(`${where}: scope3_cat15 (${f.scope3_cat15}) exceeds scope3_total (${f.scope3_total}) — recheck the source`);
    }

    for (const k of ['scope3_categories_reported', 'scope3_categories_omitted']) {
      if (!Array.isArray(b[k])) errors.push(`${where}: ${k} must be an array of category numbers`);
      else for (const n of b[k]) if (!Number.isInteger(n) || n < 1 || n > 15)
        errors.push(`${where}: ${k} contains ${n} — Scope 3 categories run 1 to 15`);
    }
    // Which categories were left out is often the more informative half, so
    // both lists must be present and must not contradict each other.
    if (Array.isArray(b.scope3_categories_reported) && Array.isArray(b.scope3_categories_omitted)) {
      const both = b.scope3_categories_reported.filter(n => b.scope3_categories_omitted.includes(n));
      if (both.length) errors.push(`${where}: category ${both.join(',')} listed as both reported and omitted`);
    }

    if (!b.assurance || !ASSURANCE.includes(b.assurance.level))
      errors.push(`${where}: assurance.level must be ${ASSURANCE.join('|')}`);

    // Provenance, mandatory and complete. This is the whole point of the file.
    if (!b.source || typeof b.source !== 'object') errors.push(`${where}: source object required`);
    else {
      if (!b.source.document) errors.push(`${where}: source.document required`);
      if (!b.source.publisher) errors.push(`${where}: source.publisher required`);
      if (!/^https?:\/\//.test(b.source.url ?? '')) errors.push(`${where}: source.url must be a URL`);
      if (!Number.isInteger(b.source.page) || b.source.page < 1)
        errors.push(`${where}: source.page required — a figure whose page cannot be cited was not properly read`);
    }
    if (!b.extracted_by) errors.push(`${where}: extracted_by required — who read the document`);
    if (!/^\d{4}-\d{2}$/.test(b.extracted_on ?? '')) errors.push(`${where}: extracted_on must be YYYY-MM`);
    if (!CONFIDENCE.includes(b.confidence)) errors.push(`${where}: confidence must be ${CONFIDENCE.join('|')}`);
    if (!/^\d{4}-\d{2}$/.test(b.reviewed ?? '')) errors.push(`${where}: reviewed must be YYYY-MM`);
    if (b.confidence === 'low' && !b.note) errors.push(`${where}: confidence "low" requires a note saying why`);

    all.push(b);
  }
}

if (errors.length) {
  console.error(`✗ Benchmark validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

all.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const byMarket = {};
for (const b of all) byMarket[b.market] = (byMarket[b.market] || 0) + 1;

writeFileSync(join(root, 'benchmarks.json'), JSON.stringify({
  count: all.length,
  markets: byMarket,
  assured: all.filter(b => b.assurance.level !== 'none').length,
  entries: all,
}));

if (!all.length) {
  console.log('  ○ benchmarks.json built — 0 entries. See knowledge/BENCHMARKS-PLAN.md;');
  console.log('    company data cannot be collected from this environment and must be hand-read.');
} else {
  console.log(`✓ benchmarks.json built — ${all.length} entries (${Object.entries(byMarket).map(([m, n]) => `${m}: ${n}`).join(', ')})`);
  console.log(`  assured: ${all.filter(b => b.assurance.level !== 'none').length} of ${all.length}`);
}
