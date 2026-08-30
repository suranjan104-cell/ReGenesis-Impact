#!/usr/bin/env node
// Validates the GHG Protocol and ISO 14064 requirement sets, compiling
// knowledge/standards.json.  Usage: node knowledge/build-standards.mjs
//
// Same bar as the factor register and the ESRS data: a tool that tells a
// preparer their inventory conforms to a standard is making a claim someone
// will repeat to an assurance provider. Every requirement carries its test and
// its reason, every category carries its scope, and the mapping must be total —
// an inventory line with no ISO home would silently vanish from the category
// view, and the totals would still look right.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dir = join(root, 'standards');

const CONFIDENCE = ['high', 'medium', 'low'];
const SEVERITY = ['required', 'recommended'];
const errors = [];

const gp = JSON.parse(readFileSync(join(dir, 'ghg-protocol.json'), 'utf8'));
const iso = JSON.parse(readFileSync(join(dir, 'iso-14064.json'), 'utf8'));

/* The inventory lines the engine actually emits. Kept here rather than derived
   from index.html on purpose: if someone adds a Scope 3 category to the engine,
   this list does not move on its own and the build fails until a human decides
   which ISO category the new line belongs to. A mapping that silently grows is
   a mapping nobody checked. */
const ENGINE_LINES = ['Scope 1', 'Scope 2', 'S3 Cat 1', 'S3 Cat 5', 'S3 Cat 6', 'S3 Cat 7', 'S3 Cat 11', 'S3 Cat 15'];

// ── GHG Protocol ────────────────────────────────────────────────────────
if (!CONFIDENCE.includes(gp.confidence)) errors.push('ghg-protocol.json: confidence must be high|medium|low');
if (!Array.isArray(gp.sources) || gp.sources.length < 2)
  errors.push('ghg-protocol.json: at least two sources — a conformance verdict gets repeated to an auditor');
for (const s of gp.sources || [])
  if (!/^https?:\/\//.test(s.url ?? '')) errors.push(`ghg-protocol.json: source url must be a URL (${s.publisher})`);
if ((gp.principles || []).length !== 5)
  errors.push(`ghg-protocol.json: the standard has five accounting principles, found ${(gp.principles || []).length}`);
if ((gp.boundaries?.organizational || []).length !== 3)
  errors.push('ghg-protocol.json: three consolidation approaches — equity share, financial control, operational control');
if (!Array.isArray(gp.requirements) || gp.requirements.length < 8)
  errors.push('ghg-protocol.json: at least eight requirements, or the check is decorative');
const reqCodes = new Set(), testNames = new Set();
for (const r of gp.requirements || []) {
  const w = r.code || '<no code>';
  if (!r.code) errors.push('ghg-protocol.json: every requirement needs a code');
  else if (reqCodes.has(r.code)) errors.push(`${w}: duplicate requirement code`); else reqCodes.add(r.code);
  if (!r.name) errors.push(`${w}: name required`);
  // A requirement with no test cannot be checked, and one that ships unchecked
  // is worse than one that is absent — it reads as covered.
  if (!r.test) errors.push(`${w}: test required — name the condition that satisfies it`);
  else testNames.add(r.test);
  if (!r.why) errors.push(`${w}: why required — say what goes wrong without it`);
  if (!SEVERITY.includes(r.severity)) errors.push(`${w}: severity must be ${SEVERITY.join('|')}`);
}
if (gp.scope3?.categories !== 15) errors.push('ghg-protocol.json: the Scope 3 Standard has fifteen categories');
if (gp.scope3?.mandatory !== false)
  errors.push('ghg-protocol.json: Scope 3 is optional under the Corporate Standard — say so, and say why people report it anyway');

// ── ISO 14064 ───────────────────────────────────────────────────────────
if (!CONFIDENCE.includes(iso.confidence)) errors.push('iso-14064.json: confidence must be high|medium|low');
if (!Array.isArray(iso.sources) || iso.sources.length < 2) errors.push('iso-14064.json: at least two sources required');
const cats = iso.part1?.categories || [];
if (cats.length !== 6) errors.push(`iso-14064.json: ISO 14064-1:2018 has six categories, found ${cats.length}`);
const catCodes = new Set();
for (const c of cats) {
  if (!Number.isInteger(c.code) || c.code < 1 || c.code > 6) errors.push(`iso-14064.json: category code must be 1–6 (${c.code})`);
  else if (catCodes.has(c.code)) errors.push(`iso-14064.json: duplicate category ${c.code}`); else catCodes.add(c.code);
  if (!c.name) errors.push(`iso-14064.json: category ${c.code} needs a name`);
  if (!/^Scope [123]$/.test(c.scope || '')) errors.push(`iso-14064.json: category ${c.code} must state its GHG Protocol scope`);
  if (!c.note) errors.push(`iso-14064.json: category ${c.code} needs a note saying what falls in it`);
}
// Categories 1 and 2 are the two that map one-to-one. If either drifts, the
// whole reconciliation between the scope view and the category view breaks.
if (cats.find(c => c.code === 1)?.scope !== 'Scope 1') errors.push('iso-14064.json: category 1 must map to Scope 1');
if (cats.find(c => c.code === 2)?.scope !== 'Scope 2') errors.push('iso-14064.json: category 2 must map to Scope 2');
if (iso.part1?.significance?.required !== true)
  errors.push('iso-14064.json: ISO 14064-1:2018 requires significance assessment of indirect categories — this is the headline difference from the GHG Protocol');
if ((iso.part3?.levels || []).length !== 2)
  errors.push('iso-14064.json: ISO 14064-3 assurance levels are limited and reasonable');

/* The mapping must be total and sound. Every line the engine can emit needs
   exactly one ISO category, that category must exist, and its scope must match
   the line's scope — otherwise the category view and the scope view disagree
   about the same tonne. */
const mapped = new Map();
for (const m of iso.line_mapping || []) {
  if (mapped.has(m.line)) errors.push(`iso-14064.json: ${m.line} mapped twice`);
  mapped.set(m.line, m);
  if (!catCodes.has(m.iso)) errors.push(`iso-14064.json: ${m.line} maps to category ${m.iso}, which does not exist`);
  if (!CONFIDENCE.includes(m.confidence)) errors.push(`iso-14064.json: ${m.line} mapping needs a confidence`);
  if (!m.note) errors.push(`iso-14064.json: ${m.line} mapping needs a note`);
  const lineScope = m.line.startsWith('Scope ') ? m.line : 'Scope 3';
  const catScope = cats.find(c => c.code === m.iso)?.scope;
  if (catScope && catScope !== lineScope)
    errors.push(`iso-14064.json: ${m.line} is ${lineScope} but category ${m.iso} is ${catScope} — the two views would disagree`);
}
for (const line of ENGINE_LINES)
  if (!mapped.has(line)) errors.push(`iso-14064.json: engine line "${line}" has no ISO category — it would vanish from the category view`);
for (const line of mapped.keys())
  if (!ENGINE_LINES.includes(line)) errors.push(`iso-14064.json: "${line}" is mapped but the engine does not emit it`);

if (!Array.isArray(iso.differences) || iso.differences.length < 3)
  errors.push('iso-14064.json: at least three stated differences — "aligned" on its own helps nobody');
for (const d of iso.differences || []) {
  if (!d.ghgp || !d.iso) errors.push(`iso-14064.json: difference "${d.topic}" needs both sides`);
  if (!d.why_it_matters) errors.push(`iso-14064.json: difference "${d.topic}" needs why_it_matters`);
}

for (const [name, f] of [['ghg-protocol.json', gp], ['iso-14064.json', iso]])
  if (!/^\d{4}-\d{2}$/.test(f.reviewed ?? '')) errors.push(`${name}: reviewed must be YYYY-MM`);

if (errors.length) {
  console.error(`✗ standards validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const out = { ghgProtocol: gp, iso: iso };
writeFileSync(join(root, 'standards.json'), JSON.stringify(out));
const req = gp.requirements.filter(r => r.severity === 'required').length;
console.log(`✓ standards.json built — GHG Protocol: ${gp.requirements.length} requirements (${req} required, ${gp.requirements.length - req} recommended)`);
console.log(`  ISO 14064-1: 6 categories · ${mapped.size} engine lines mapped, all reconciling to their scope`);
console.log(`  ISO 14064-3: ${iso.part3.levels.map(l => l.code).join(', ')} · ${iso.differences.length} differences from the GHG Protocol stated`);
