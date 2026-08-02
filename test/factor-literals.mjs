/* Gate: no emission factor may be written as a literal in a calculation path.
   Run: node test/factor-literals.mjs

   Every factor has to resolve through EF(id) against the register, so that the
   value applied, the value displayed and the value published in factors.json
   are the same object. Before the register they were three separate copies —
   the engine, the audit-trail label and the CSV export each held their own,
   and editing one left the others silently misstating the factor applied.

   Structural numbers are allowed: unit conversions, rounding, array indices.
   Anything else in these functions is a factor hiding in the code. */
import { readFileSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const html = readFileSync(`${ROOT}/index.html`, 'utf8');

// Unit conversion, rounding and indexing — never emission factors.
const STRUCTURAL = new Set([0, 1, 2, 10, 100, 1000]);

/* Brace-matched extraction. A regex cannot find the end of a function body
   that contains nested braces and object literals. */
function body(name, opener) {
  const start = html.indexOf(opener);
  if (start < 0) throw new Error(`${name}: not found — has it been renamed?`);
  let i = html.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end < 0) throw new Error(`${name}: unbalanced braces`);
  return html.slice(i, end + 1);
}

const TARGETS = [
  ['ghg_compute', 'window.ghg_compute = function()'],
  ['ghgExportCSV', 'window.ghgExportCSV = function()'],
  ['ghgGwp', 'window.ghgGwp = function(refType)']
];

const failures = [];
for (const [name, opener] of TARGETS) {
  const src = body(name, opener)
    .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')  // line comments, keeping URLs intact
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")   // string literals — display text, not maths
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    // Regex literals — character classes like [^a-z0-9] are not arithmetic.
    // Anchored to positions where a regex can legally start, so division is
    // not mistaken for one.
    .replace(/([(,=:!&|]\s*)\/(?![*/])(?:[^/\\\n[]|\\.|\[(?:[^\]\\]|\\.)*\])+\/[gimsuy]*/g, '$1RE');

  for (const m of src.matchAll(/(?<![\w.$])\d+(?:\.\d+)?/g)) {
    const n = Number(m[0]);
    if (STRUCTURAL.has(n)) continue;
    const line = html.slice(0, html.indexOf(body(name, opener)) + m.index).split('\n').length;
    failures.push(`${name} (index.html:~${line}): bare number ${m[0]} — move it to knowledge/factors/ and read it via EF(id)`);
  }
}

if (failures.length) {
  console.error(`✗ factor literals found in calculation paths (${failures.length}):\n`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ no factor literals in calculation paths — ${TARGETS.map(t => t[0]).join(', ')}`);
