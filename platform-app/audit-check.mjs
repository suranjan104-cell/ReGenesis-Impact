#!/usr/bin/env node
// Fails on any high/critical production advisory that is not documented as
// inapplicable in audit-exceptions.json.
//
// Run from platform-app/:  node audit-check.mjs
//
// A permanently red audit is one nobody reads — the same failure mode that let
// the nightly health check go unwatched for a month. But a blanket `|| true`
// is worse. So each excepted advisory has to be named individually with a
// reason and a trigger for re-evaluation, and anything unlisted still fails.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let report;
try {
  // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
  report = execSync('npm audit --omit=dev --json', { encoding: 'utf8', maxBuffer: 1 << 26 });
} catch (e) {
  report = e.stdout || '';
}
if (!report.trim()) {
  console.error('✗ npm audit produced no output — cannot verify, failing closed');
  process.exit(1);
}

const audit = JSON.parse(report);
const { exceptions } = JSON.parse(readFileSync(new URL('./audit-exceptions.json', import.meta.url), 'utf8'));
const excepted = new Map(exceptions.map(e => [e.advisory, e]));

const SEVERE = new Set(['high', 'critical']);
const unhandled = [];
const suppressed = [];

for (const [name, v] of Object.entries(audit.vulnerabilities || {})) {
  if (!SEVERE.has(v.severity)) continue;
  for (const via of v.via) {
    if (typeof via === 'string') continue;         // transitive pointer, not an advisory
    const id = (via.url || '').split('/').pop();   // GHSA-… from the advisory URL
    const ex = excepted.get(id);
    if (ex) suppressed.push(`${name} · ${id} — ${ex.why_not_applicable.slice(0, 90)}…`);
    else unhandled.push(`${name} · ${via.severity} · ${id || 'no advisory id'} — ${via.title || ''}`);
  }
}

for (const s of suppressed) console.log(`  ○ documented as not applicable: ${s}`);

if (unhandled.length) {
  console.error(`\n✗ ${unhandled.length} high/critical production advisor${unhandled.length === 1 ? 'y' : 'ies'} with no documented exception:\n`);
  for (const u of unhandled) console.error('  - ' + u);
  console.error('\nFix it, or add a reasoned entry to audit-exceptions.json saying why it cannot apply here.');
  process.exit(1);
}
console.log(`  ✓ no unhandled high/critical production advisories (${suppressed.length} documented as not applicable)`);
