#!/usr/bin/env node
// Writes the factor values from knowledge/factors.json into the generated
// block in index.html, so the calculators have exactly one source of truth.
//
//   node knowledge/sync-factors.mjs           rewrite the block
//   node knowledge/sync-factors.mjs --check    fail if index.html is stale
//
// Why generate rather than fetch at runtime: emissions must not be computed
// against an unknown factor set. A runtime fetch that fails would either
// break the tool or silently fall back to a second copy of the numbers —
// which is the duplication the register exists to remove. The register view
// still fetches factors.json for the full provenance metadata; --check in CI
// guarantees the two cannot disagree.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');

const reg = JSON.parse(readFileSync(join(root, 'knowledge', 'factors.json'), 'utf8'));
const htmlPath = join(root, 'index.html');
const html = readFileSync(htmlPath, 'utf8');

const START = '/* ==== GENERATED FROM knowledge/factors.json — DO NOT EDIT BY HAND ==== */';
const END = '/* ==== END GENERATED ==== */';

const values = {};
for (const f of reg.factors) values[f.id] = f.value;

/* Data quality scoring needs to know how good each factor is, and the engine
   runs synchronously — it cannot wait on the factors.json fetch. So a compact
   metadata map ships alongside the values:
     c = confidence initial · u = provenance not established · a = an
     assumption rather than a measured factor. */
const meta = {};
for (const f of reg.factors) {
  meta[f.id] = {
    c: f.confidence[0],
    u: f.source.publisher === 'Not established' ? 1 : 0,
    a: /assumption|no default/.test(f.basis) ? 1 : 0,
  };
}

const body = [
  START,
  '  // Regenerate: node knowledge/sync-factors.mjs   ·   Verify: --check',
  `  // ${reg.count} factors · oldest vintage in use ${reg.oldestVintage ?? 'none dated'}`,
  '  var RG_FACTORS = ' + JSON.stringify(values, null, 2).split('\n').join('\n  ') + ';',
  '  var RG_FACTOR_META = ' + JSON.stringify(meta) + ';',
  '  // Fail loudly rather than compute emissions against a missing factor.',
  '  function EF(id) {',
  '    if (!(id in RG_FACTORS)) throw new Error("unknown emission factor: " + id);',
  '    return RG_FACTORS[id];',
  '  }',
  '  ' + END
].join('\n  ');

const s = html.indexOf(START);
const e = html.indexOf(END);
if (s < 0 || e < 0) {
  console.error('✗ generated block not found in index.html — add the START/END markers first');
  process.exit(1);
}
const next = html.slice(0, s) + body.trimStart() + html.slice(e + END.length);

if (next === html) {
  console.log(`✓ index.html is in sync with the register — ${reg.count} factors`);
  process.exit(0);
}
if (CHECK) {
  console.error('✗ index.html is out of sync with knowledge/factors.json');
  console.error('  run: node knowledge/sync-factors.mjs');
  process.exit(1);
}
writeFileSync(htmlPath, next);
console.log(`✓ synced ${reg.count} factors into index.html`);
