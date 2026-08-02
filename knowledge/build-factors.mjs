#!/usr/bin/env node
// Validates every emission factor and compiles knowledge/factors.json — the
// register the calculators read at runtime and the register view renders.
// Usage: node knowledge/build-factors.mjs   (fails loudly on any invalid factor)
//
// This is the control the Assurance Studio has always told users to build:
// factor, source, vintage, applied-to. We audited people against it without
// providing it. Now we hold ourselves to the same schema.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const factorsDir = join(root, 'factors');

const CATEGORIES = [
  'scope1_stationary', 'scope1_mobile', 'scope1_fugitive',
  'scope2_electricity', 'scope2_heat',
  'scope3_cat1', 'scope3_cat5', 'scope3_cat6', 'scope3_cat7',
  'scope3_cat11', 'scope3_cat15'
];
const REGIONS = ['IN', 'AU', 'SG', 'GB', 'US', 'EU', 'CN', 'global'];
const CONFIDENCE = ['high', 'medium', 'low'];
const GWP_SETS = ['AR4', 'AR5', 'AR6', 'all', 'unverified'];

const errors = [];
const seen = new Set();
const all = [];

for (const file of readdirSync(factorsDir).filter(f => f.endsWith('.json')).sort()) {
  let factors;
  try {
    factors = JSON.parse(readFileSync(join(factorsDir, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(factors)) { errors.push(`${file}: root must be an array`); continue; }

  for (const f of factors) {
    const where = `${file} → ${f?.id ?? '<no id>'}`;
    if (!f.id || typeof f.id !== 'string') errors.push(`${where}: missing id`);
    else if (seen.has(f.id)) errors.push(`${where}: duplicate id`);
    else seen.add(f.id);
    if (!f.name || f.name.length > 90) errors.push(`${where}: name required, ≤90 chars`);
    if (!CATEGORIES.includes(f.category)) errors.push(`${where}: category must be one of ${CATEGORIES.join('|')}`);
    if (typeof f.value !== 'number' || !isFinite(f.value)) errors.push(`${where}: value must be a finite number`);
    if (!f.unit) errors.push(`${where}: unit required`);
    if (!f.basis) errors.push(`${where}: basis required`);
    if (!REGIONS.includes(f.region)) errors.push(`${where}: region must be one of ${REGIONS.join('|')}`);

    // Provenance is mandatory. A factor whose source cannot be stated is the
    // exact defect the register exists to surface, so it must be declared
    // "Not established" explicitly rather than left blank.
    if (!f.source || typeof f.source !== 'object') errors.push(`${where}: source object required`);
    else {
      if (!f.source.publisher) errors.push(`${where}: source.publisher required — use "Not established" if unknown`);
      if (!f.source.document) errors.push(`${where}: source.document required`);
      if (!/^https?:\/\//.test(f.source.url ?? '')) errors.push(`${where}: source.url must be a URL`);
    }
    // vintage may be null, but only deliberately — an unsourced factor has no year.
    if (f.vintage !== null && !(Number.isInteger(f.vintage) && f.vintage >= 1990 && f.vintage <= 2100))
      errors.push(`${where}: vintage must be null or a year 1990–2100`);
    // An undated factor cannot be high confidence — unless it is invariant
    // across assessment reports, which is true of exactly one thing: CO2, the
    // reference gas, whose GWP is 1 by definition everywhere.
    if (f.vintage === null && f.confidence === 'high' && f.gwp_set !== 'all')
      errors.push(`${where}: confidence "high" requires a vintage`);

    if (f.gwp_set !== undefined && !GWP_SETS.includes(f.gwp_set))
      errors.push(`${where}: gwp_set must be one of ${GWP_SETS.join('|')}`);
    if (f.category === 'scope1_fugitive' && f.gwp_set === undefined)
      errors.push(`${where}: fugitive factors must declare a gwp_set`);

    if (typeof f.editable !== 'boolean') errors.push(`${where}: editable must be true|false`);
    if (f.editable && !f.input_id) errors.push(`${where}: editable factors need the input_id they back`);
    if (!f.editable && f.input_id) errors.push(`${where}: non-editable factor must not name an input_id`);

    if (!Array.isArray(f.applies_to) || f.applies_to.length < 1)
      errors.push(`${where}: applies_to must list at least one calculation line`);
    if (!CONFIDENCE.includes(f.confidence)) errors.push(`${where}: confidence must be ${CONFIDENCE.join('|')}`);
    if (!/^\d{4}-\d{2}$/.test(f.reviewed ?? '')) errors.push(`${where}: reviewed must be YYYY-MM`);
    if (f.confidence === 'low' && !f.note)
      errors.push(`${where}: confidence "low" requires a note saying why`);

    all.push(f);
  }
}

if (errors.length) {
  console.error(`✗ Factor register validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// Deterministic output — no wall-clock, so rebuilding unchanged sources on any
// day produces a byte-identical factors.json. CI relies on this.
all.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const fresh = all.map(f => f.reviewed).sort().pop();
// The oldest vintage in use is what an assurance provider asks for first, and
// what our own Assurance Studio test checks. Compute it rather than assert it.
const vintages = all.map(f => f.vintage).filter(v => v !== null);
const out = {
  fresh,
  count: all.length,
  oldestVintage: vintages.length ? Math.min(...vintages) : null,
  unsourced: all.filter(f => f.source.publisher === 'Not established').map(f => f.id),
  factors: all
};
writeFileSync(join(root, 'factors.json'), JSON.stringify(out));

const byConf = CONFIDENCE.map(c => `${c}: ${all.filter(f => f.confidence === c).length}`).join(', ');
console.log(`✓ factors.json built — ${all.length} factors (${byConf})`);
console.log(`  oldest vintage in use: ${out.oldestVintage ?? 'none dated'}`);
if (out.unsourced.length) console.log(`  provenance not established: ${out.unsourced.join(', ')}`);
