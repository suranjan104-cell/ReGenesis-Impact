#!/usr/bin/env node
// Validates the per-market regime data and compiles knowledge/markets.json.
// Usage: node knowledge/build-markets.mjs
//
// These files answer "am I caught, and from when" for three markets. That is
// the same class of assertion as the CSRD thresholds, so it is held to the same
// bar: sourced, graded, dated, and every cohort carrying a commencement date
// that a reader can check.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dir = join(root, 'markets');

const CONFIDENCE = ['high', 'medium', 'low'];
const MATERIALITY = ['financial', 'double'];
const errors = [];
// Markets whose applicability the workspace engine decides from `rule`.
const ENGINE_MARKETS = ['au', 'sg'];
const COMBINE = ['at_least_2_of_3', 'all', 'listed', 'sti_constituent'];
const TRIGGERS = ['nger_publication_threshold', 'nger_reporter', 'asset_owner'];

const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const markets = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));

// Europe is not here: its scope lives in knowledge/esrs/scope.json, which is
// richer than a cohort list and already validated by build-esrs.mjs. Duplicating
// it would create a second home for the CSRD thresholds — the exact defect the
// factor register audit found in our own code.
const EXPECTED = ['au', 'issb', 'sg'];
const codes = markets.map(m => m.code).sort();
if (JSON.stringify(codes) !== JSON.stringify(EXPECTED))
  errors.push(`expected markets ${EXPECTED.join(', ')} — found ${codes.join(', ') || 'none'}`);

for (const m of markets) {
  const w = m.code || '<no code>';
  if (!m.name || !m.regime || !m.standard) errors.push(`${w}: name, regime and standard all required`);
  if (!MATERIALITY.includes(m.materiality)) errors.push(`${w}: materiality must be ${MATERIALITY.join('|')}`);
  if (!CONFIDENCE.includes(m.confidence)) errors.push(`${w}: confidence must be ${CONFIDENCE.join('|')}`);
  if (!/^\d{4}-\d{2}$/.test(m.reviewed ?? '')) errors.push(`${w}: reviewed must be YYYY-MM`);
  if (!Array.isArray(m.sources) || m.sources.length < 2)
    errors.push(`${w}: at least two sources — a scoping answer decides whether a company files at all`);
  for (const s of m.sources || []) {
    if (!s.publisher || !s.title) errors.push(`${w}: every source needs a publisher and title`);
    if (!/^https?:\/\//.test(s.url ?? '')) errors.push(`${w}: source url must be a URL (${s.publisher})`);
  }
  // "At least two of three" versus "both" versus "listing status" is the whole
  // answer for a preparer near a threshold, so it has to be written down.
  if (!m.test) errors.push(`${w}: test required — say how the thresholds combine`);
  if (!m.scope3) errors.push(`${w}: scope3 treatment required`);
  if (!m.assurance) errors.push(`${w}: assurance treatment required`);

  if (!Array.isArray(m.cohorts) || !m.cohorts.length) { errors.push(`${w}: at least one cohort`); continue; }
  const seen = new Set();
  let prev = null;
  for (const c of m.cohorts) {
    const cw = `${w} ${c.code || '<no code>'}`;
    if (!c.code) errors.push(`${cw}: cohort code required`);
    else if (seen.has(c.code)) errors.push(`${cw}: duplicate cohort`); else seen.add(c.code);
    if (!c.name) errors.push(`${cw}: cohort name required`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.first_period_from ?? ''))
      errors.push(`${cw}: first_period_from must be YYYY-MM-DD — a cohort without a start date is not a cohort`);
    if (!Number.isInteger(c.first_reports) || c.first_reports < 2020 || c.first_reports > 2040)
      errors.push(`${cw}: first_reports must be a plausible year`);
    if (!c.note) errors.push(`${cw}: note required`);
    if (!('also' in c)) errors.push(`${cw}: "also" required (null if no non-size trigger)`);
    // Cohorts are listed in the order they commence. Out of order, the timeline
    // renders as a staircase going the wrong way and nobody notices.
    if (prev && c.first_period_from < prev)
      errors.push(`${cw}: commences ${c.first_period_from}, before the cohort listed above it (${prev})`);
    prev = c.first_period_from;
    // The applicability engine reads `rule`, not the prose. So wherever a
    // market is one the engine decides (Australia, Singapore), every cohort
    // carries a rule, and the rule is checked against the fields and the
    // prose beside it — a rule that says "at least two of three" over a cohort
    // with one threshold, or names a trigger the "also" text does not mention,
    // would give a preparer a confident wrong answer.
    if (ENGINE_MARKETS.includes(m.code)) {
      const r = c.rule;
      if (!r || !COMBINE.includes(r.combine))
        errors.push(`${cw}: rule.combine must be one of ${COMBINE.join('|')} — the engine decides this market`);
      else {
        const sizeKeys = Object.keys(c).filter(k => /_over(_[a-z]{3}_m)?$/.test(k) && c[k] !== null);
        if (r.combine === 'at_least_2_of_3' && sizeKeys.length !== 3)
          errors.push(`${cw}: "at least two of three" needs three size thresholds, found ${sizeKeys.length}`);
        if (r.combine === 'all' && sizeKeys.length < 1)
          errors.push(`${cw}: "all" needs at least one size threshold`);
        if (['listed', 'sti_constituent'].includes(r.combine) && sizeKeys.length)
          errors.push(`${cw}: a listing-based cohort must not carry size thresholds (${sizeKeys.join(', ')})`);
        for (const t of r.triggers || [])
          if (!TRIGGERS.includes(t)) errors.push(`${cw}: unknown trigger "${t}"`);
        const hasTriggers = (r.triggers || []).length > 0;
        if (hasTriggers !== (c.also !== null && r.combine === 'at_least_2_of_3'))
          if (r.combine === 'at_least_2_of_3')
            errors.push(`${cw}: rule.triggers and "also" disagree — ${hasTriggers ? 'triggers listed but "also" is null' : '"also" names a trigger the rule does not carry'}`);
        if ((r.triggers || []).includes('asset_owner') && !(r.asset_owner_aum_at_least_aud_bn > 0))
          errors.push(`${cw}: the asset_owner trigger needs asset_owner_aum_at_least_aud_bn`);
        if (r.extends && !m.cohorts.some(o => o.code === r.extends))
          errors.push(`${cw}: extends "${r.extends}", which is not a cohort in this market`);
      }
    }
    // Where size thresholds exist they must be positive numbers, not zero or
    // an empty string standing in for "we did not check".
    for (const k of Object.keys(c)) {
      if (!/_over(_[a-z]{3}_m)?$/.test(k)) continue;
      if (c[k] === null) continue;
      if (!(typeof c[k] === 'number' && c[k] > 0)) errors.push(`${cw}: ${k} must be a positive number or null`);
    }
  }
}

if (errors.length) {
  console.error(`✗ market data validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const out = { count: markets.length, markets };
writeFileSync(join(root, 'markets.json'), JSON.stringify(out));
const cohorts = markets.reduce((n, m) => n + m.cohorts.length, 0);
console.log(`✓ markets.json built — ${markets.length} markets, ${cohorts} cohorts`);
for (const m of markets)
  console.log(`  ${m.code}: ${m.regime} · ${m.cohorts.length} cohort(s) · first reports ${Math.min(...m.cohorts.map(c => c.first_reports))} · ${m.confidence} confidence`);
