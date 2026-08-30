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
const taxonomy = JSON.parse(readFileSync(join(dir, 'taxonomy.json'), 'utf8'));
const digital = JSON.parse(readFileSync(join(dir, 'digital.json'), 'utf8'));
const interop = JSON.parse(readFileSync(join(dir, 'interop.json'), 'utf8'));
const competitors = JSON.parse(readFileSync(join(dir, 'competitors.json'), 'utf8'));

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
  /* Where disclosure requirements are enumerated, the list and the count must
     agree. A standard claiming nine DRs while listing eight is the same defect
     as a factor whose label disagrees with its value. */
  if (s.drs !== undefined) {
    if (!Array.isArray(s.drs) || !s.drs.length) errors.push(`${where}: drs must be a non-empty array when present`);
    else {
      if (s.dr_count !== s.drs.length)
        errors.push(`${where}: dr_count ${s.dr_count} does not match ${s.drs.length} enumerated DRs`);
      const codes = new Set();
      for (const dr of s.drs) {
        if (!dr.code) errors.push(`${where}: every DR needs a code`);
        else if (codes.has(dr.code)) errors.push(`${where}: duplicate DR ${dr.code}`);
        else codes.add(dr.code);
        if (!dr.name) errors.push(`${where} ${dr.code}: name required`);
        if (!('evidence_from' in dr)) errors.push(`${where} ${dr.code}: evidence_from required (null if none)`);
      }
    }
  }
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

/* ── EU Taxonomy Article 8 ──────────────────────────────────────────────
   Three KPIs, four gates, six objectives. Each of those counts is fixed by
   the regulation, so each is asserted here: a tool that quietly drops an
   environmental objective or a gate produces an alignment answer that is
   wrong in a direction nobody notices. */
if (!CONFIDENCE.includes(taxonomy.confidence)) errors.push('taxonomy.json: confidence must be high|medium|low');
if (!Array.isArray(taxonomy.sources) || taxonomy.sources.length < 2)
  errors.push('taxonomy.json: at least two sources required — Article 8 KPIs go in a filed report');
for (const src of taxonomy.sources || [])
  if (!/^https?:\/\//.test(src.url ?? '')) errors.push(`taxonomy.json: source url must be a URL (${src.publisher})`);
if ((taxonomy.objectives || []).length !== 6)
  errors.push(`taxonomy.json: the Taxonomy has six environmental objectives, found ${(taxonomy.objectives || []).length}`);
if ((taxonomy.kpis || []).length !== 3)
  errors.push(`taxonomy.json: Article 8 has three KPIs for non-financial undertakings, found ${(taxonomy.kpis || []).length}`);
for (const k of taxonomy.kpis || []) {
  if (!k.code || !k.name) errors.push('taxonomy.json: every KPI needs a code and name');
  // A KPI is a ratio. Stating one without saying what divides what is how a
  // preparer ends up computing OpEx over total operating costs.
  if (!k.numerator || !k.denominator) errors.push(`taxonomy.json ${k.code}: numerator and denominator must both be stated`);
}
const GATES = ['eligible', 'contribution', 'dnsh', 'safeguards'];
const gateCodes = (taxonomy.gates || []).map(g => g.code);
for (const g of GATES) if (!gateCodes.includes(g)) errors.push(`taxonomy.json: gate "${g}" missing — alignment requires all four`);
for (const g of taxonomy.gates || []) if (!g.test) errors.push(`taxonomy.json ${g.code}: test required`);
const sim = taxonomy.simplification || {};
if (!sim.regulation) errors.push('taxonomy.json: simplification.regulation required — name the instrument');
if (!(sim.materiality_threshold_percent > 0 && sim.materiality_threshold_percent < 100))
  errors.push('taxonomy.json: simplification.materiality_threshold_percent must be a percentage');
for (const f of ['published_oj', 'in_force', 'applies_from'])
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sim[f] ?? '')) errors.push(`taxonomy.json: simplification.${f} must be YYYY-MM-DD`);

/* ── Digital tagging ────────────────────────────────────────────────────
   The mandate is suspended. That is the single most useful thing this
   section says, and it is only useful if it names the instrument that
   suspended it — otherwise it is one more vendor asserting a timetable. */
if (!CONFIDENCE.includes(digital.confidence)) errors.push('digital.json: confidence must be high|medium|low');
if (!Array.isArray(digital.sources) || digital.sources.length < 2) errors.push('digital.json: at least two sources required');
const dst = digital.status || {};
if (!['suspended', 'active', 'pending'].includes(dst.mandate))
  errors.push('digital.json: status.mandate must be suspended|active|pending');
if (dst.mandate === 'suspended' && !dst.suspended_by)
  errors.push('digital.json: a suspended mandate must name the instrument that suspended it');
if (!Array.isArray(digital.sequence) || !digital.sequence.length) errors.push('digital.json: sequence required');
for (const st of digital.sequence || []) {
  if (!st.what) errors.push('digital.json: every sequence step needs a description');
  if (!['done', 'in progress', 'pending'].includes(st.state))
    errors.push(`digital.json: step ${st.step} state must be done|in progress|pending`);
  // A step claimed done without a date is an assertion nobody can check.
  if (st.state === 'done' && !st.on) errors.push(`digital.json: step ${st.step} is marked done and must carry a date`);
}
if (!Array.isArray(digital.checklist) || digital.checklist.length < 5) errors.push('digital.json: checklist needs at least five items');
for (const c of digital.checklist || []) if (!c.why) errors.push(`digital.json ${c.code}: why required`);

/* ── ESRS ↔ IFRS S2 ─────────────────────────────────────────────────────
   Telling a preparer a disclosure carries across is advice with consequences.
   Each mapping states its direction so "aligned" is never confused with
   "one of them asks for more". */
const REL = ['aligned', 'esrs-additional', 'issb-additional'];
if (!CONFIDENCE.includes(interop.confidence)) errors.push('interop.json: confidence must be high|medium|low');
if (!Array.isArray(interop.sources) || interop.sources.length < 2) errors.push('interop.json: at least two sources required');
if (!Array.isArray(interop.mappings) || interop.mappings.length < 8)
  errors.push('interop.json: at least eight mappings — a shorter table is not worth a preparer\'s time');
for (const m of interop.mappings || []) {
  if (!m.esrs || !m.issb) errors.push('interop.json: every mapping needs both an esrs and an issb side');
  if (!REL.includes(m.relationship)) errors.push(`interop.json ${m.esrs}: relationship must be ${REL.join('|')}`);
  if (!m.note) errors.push(`interop.json ${m.esrs}: note required — say what actually differs`);
}

/* ── Competitive benchmark ──────────────────────────────────────────────
   The rules in the file's own header, enforced. A benchmark where we grade
   ourselves generously and competitors from memory is marketing; these
   checks are what stop it becoming that. */
const COV = ['yes', 'partial', 'no', 'unknown'];
const capCodes = (competitors.capabilities || []).map(c => c.code);
if (capCodes.length < 8) errors.push('competitors.json: at least eight capabilities to compare');
for (const c of competitors.capabilities || []) {
  if (!c.code || !c.name) errors.push('competitors.json: every capability needs a code and name');
  if (!c.why) errors.push(`competitors.json ${c.code}: why required — say why the capability matters`);
}
if (!Array.isArray(competitors.vendors) || competitors.vendors.length < 3)
  errors.push('competitors.json: at least three vendors, or it is not a benchmark');
for (const v of competitors.vendors || []) {
  const w = v.name || '<unnamed>';
  if (!v.name) errors.push('competitors.json: every vendor needs a name');
  // No assertion about a competitor without something a reader can open.
  if (!Array.isArray(v.sources) || !v.sources.length) errors.push(`${w}: at least one source required for any coverage claim`);
  for (const s2 of v.sources || []) if (!/^https?:\/\//.test(s2.url ?? '')) errors.push(`${w}: source url must be a URL`);
  if (!v.position) errors.push(`${w}: position required`);
  for (const cap of capCodes)
    if (!COV.includes((v.covers || {})[cap])) errors.push(`${w}: coverage of "${cap}" must be ${COV.join('|')}`);
}
// Our own row is graded on the same scale, and every weakness carries a reason.
const us = competitors.us || {};
for (const cap of capCodes)
  if (!COV.includes((us.covers || {})[cap])) errors.push(`competitors.json us: coverage of "${cap}" must be ${COV.join('|')}`);
const explained = new Set((us.honest || []).map(h => h.cap));
for (const cap of capCodes) {
  const v = (us.covers || {})[cap];
  if ((v === 'partial' || v === 'no') && !explained.has(cap))
    errors.push(`competitors.json us: "${cap}" is graded ${v} and needs an entry in us.honest saying what is missing`);
}
for (const h of us.honest || []) {
  if (!capCodes.includes(h.cap)) errors.push(`competitors.json us.honest: unknown capability "${h.cap}"`);
  if (!h.why) errors.push(`competitors.json us.honest ${h.cap}: why required`);
}
if (!competitors.method) errors.push('competitors.json: method required — say how the review was done');
for (const f of [taxonomy, digital, interop, competitors])
  if (!/^\d{4}-\d{2}$/.test(f.reviewed ?? '')) errors.push('every esrs data file needs reviewed as YYYY-MM');

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
  taxonomy,
  digital,
  interop,
  competitors,
};
writeFileSync(join(root, 'esrs.json'), JSON.stringify(out));
console.log(`✓ esrs.json built — ${out.count} standards (${out.topical} topical, ${out.enumerated} with disclosure counts stated)`);
console.log(`  scope confidence: ${scope.confidence} · ${scope.sources.length} sources · simplified set: ${scope.simplified_esrs.status}`);
console.log(`  taxonomy: ${taxonomy.kpis.length} KPIs · ${taxonomy.gates.length} gates · ${taxonomy.objectives.length} objectives · threshold ${taxonomy.simplification.materiality_threshold_percent}%`);
console.log(`  digital: tagging ${digital.status.mandate}${digital.status.suspended_by ? ' by ' + digital.status.suspended_by : ''}`);
console.log(`  interop: ${interop.mappings.length} ESRS↔IFRS S2 mappings`);
console.log(`  benchmark: ${competitors.vendors.length} vendors × ${competitors.capabilities.length} capabilities · ${(competitors.us.honest || []).length} gaps declared against us`);
