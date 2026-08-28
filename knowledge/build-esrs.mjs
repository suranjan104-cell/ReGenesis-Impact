#!/usr/bin/env node
// Validates the ESRS standard set and CSRD scope data, compiling knowledge/esrs.json.
// Usage: node knowledge/build-esrs.mjs
//
// Same discipline as the factor register, for the same reason: a scoping tool
// asserts thresholds and dates that decide whether a company files at all.
// Those assertions must carry their sources and a confidence grade, and must
// fail the build if they do not.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dir = join(root, 'esrs');

const PILLARS = ['cross-cutting', 'environment', 'social', 'governance'];
const CONFIDENCE = ['high', 'medium', 'low'];
const errors = [];

const standards = JSON.parse(readFileSync(join(dir, 'standards.json'), 'utf8'));
const scope = JSON.parse(readFileSync(join(dir, 'scope.json'), 'utf8'));

if (!Array.isArray(standards)) errors.push('standards.json root must be an array');
// Set 1 has twelve standards. A tool that silently lists eleven misrepresents
// the framework, which is how ESRS 1 was left out of the first draft of this file.
if (standards.length !== 12) errors.push(`expected 12 standards in Set 1, found ${standards.length}`);

const seen = new Set();
for (const s of standards) {
  const where = s?.code ?? '<no code>';
  if (!/^ESRS (1|2|[ESG]\d)$/.test(s.code || '')) errors.push(`${where}: code must look like "ESRS 2" or "ESRS E1"`);
  else if (seen.has(s.code)) errors.push(`${where}: duplicate`); else seen.add(s.code);
  if (!s.name) errors.push(`${where}: name required`);
  if (!PILLARS.includes(s.pillar)) errors.push(`${where}: pillar must be one of ${PILLARS.join('|')}`);
  if (typeof s.always_required !== 'boolean') errors.push(`${where}: always_required must be true|false`);
  // null means "deliberately not enumerated", which is a different claim from zero.
  if (s.dr_count !== null && !(Number.isInteger(s.dr_count) && s.dr_count >= 0))
    errors.push(`${where}: dr_count must be null or a non-negative integer`);
  if (!CONFIDENCE.includes(s.confidence)) errors.push(`${where}: confidence must be ${CONFIDENCE.join('|')}`);
  if (!s.note) errors.push(`${where}: note required — say why the count is what it is`);
  if (!/^\d{4}-\d{2}$/.test(s.reviewed ?? '')) errors.push(`${where}: reviewed must be YYYY-MM`);
}

// Scope thresholds decide whether a company files at all, so they are held to
// the register's standard: sourced, graded, and dated.
if (!CONFIDENCE.includes(scope.confidence)) errors.push('scope.json: confidence must be high|medium|low');
if (!Array.isArray(scope.sources) || scope.sources.length < 2)
  errors.push('scope.json: at least two independent sources required for a filing-threshold claim');
for (const src of scope.sources || []) {
  if (!src.publisher || !src.title) errors.push('scope.json: every source needs a publisher and title');
  if (!/^https?:\/\//.test(src.url ?? '')) errors.push(`scope.json: source url must be a URL (${src.publisher})`);
}
const t = scope.thresholds || {};
if (!(t.eu_company?.employees_over > 0)) errors.push('scope.json: eu_company.employees_over required');
if (!(t.eu_company?.net_turnover_over_eur_m > 0)) errors.push('scope.json: eu_company.net_turnover_over_eur_m required');
if (!Array.isArray(scope.waves) || !scope.waves.length) errors.push('scope.json: waves required');
if (scope.simplified_esrs?.status !== 'pending' && scope.simplified_esrs?.status !== 'published')
  errors.push('scope.json: simplified_esrs.status must be pending|published');
if (!scope.simplified_esrs?.note) errors.push('scope.json: simplified_esrs.note required — the pending set changes what a gap analysis means');

if (errors.length) {
  console.error(`✗ ESRS data validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const out = {
  count: standards.length,
  topical: standards.filter(s => !s.always_required).length,
  enumerated: standards.filter(s => s.dr_count !== null).length,
  simplifiedStatus: scope.simplified_esrs.status,
  scope,
  standards,
};
writeFileSync(join(root, 'esrs.json'), JSON.stringify(out));
console.log(`✓ esrs.json built — ${out.count} standards (${out.topical} topical, ${out.enumerated} with disclosure counts stated)`);
console.log(`  scope confidence: ${scope.confidence} · ${scope.sources.length} sources · simplified set: ${scope.simplified_esrs.status}`);
