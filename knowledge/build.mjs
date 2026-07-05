#!/usr/bin/env node
// Validates every knowledge entry and compiles knowledge/kb.json —
// the single file the site fetches at runtime for AI retrieval.
// Usage: node knowledge/build.mjs        (fails loudly on any invalid entry)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const entriesDir = join(root, 'entries');

const TOOLS = ['issb', 'ghg', 'climate', 'credits', 'assurance', 'dd', 'advisor'];
const MARKETS = ['sg', 'au', 'in', 'global'];
const CONFIDENCE = ['high', 'medium'];

const errors = [];
const seen = new Set();
const all = [];

for (const file of readdirSync(entriesDir).filter(f => f.endsWith('.json')).sort()) {
  let entries;
  try {
    entries = JSON.parse(readFileSync(join(entriesDir, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(entries)) { errors.push(`${file}: root must be an array`); continue; }

  for (const e of entries) {
    const where = `${file} → ${e?.id ?? '<no id>'}`;
    if (!e.id || typeof e.id !== 'string') errors.push(`${where}: missing id`);
    else if (seen.has(e.id)) errors.push(`${where}: duplicate id`);
    else seen.add(e.id);
    if (!TOOLS.includes(e.tool)) errors.push(`${where}: tool must be one of ${TOOLS.join('|')}`);
    if (e.id && e.tool && !e.id.startsWith(e.tool + '-')) errors.push(`${where}: id must be prefixed "${e.tool}-"`);
    if (!e.title || e.title.length > 90) errors.push(`${where}: title required, ≤90 chars`);
    if (!MARKETS.includes(e.market)) errors.push(`${where}: market must be one of ${MARKETS.join('|')}`);
    if (!Array.isArray(e.tags) || e.tags.length < 2) errors.push(`${where}: at least 2 tags`);
    if (!Array.isArray(e.facts) || e.facts.length < 1 || e.facts.length > 5)
      errors.push(`${where}: 1–5 facts required`);
    else for (const f of e.facts) {
      if (typeof f !== 'string' || f.length < 20) errors.push(`${where}: fact too short — facts must be complete statements`);
      if (typeof f === 'string' && f.length > 400) errors.push(`${where}: fact over 400 chars — split it`);
    }
    if (!e.source || !/^https?:\/\//.test(e.source)) errors.push(`${where}: source must be a URL`);
    if (!CONFIDENCE.includes(e.confidence)) errors.push(`${where}: confidence must be high|medium`);
    if (!/^\d{4}-\d{2}$/.test(e.reviewed ?? '')) errors.push(`${where}: reviewed must be YYYY-MM`);
    all.push(e);
  }
}

if (errors.length) {
  console.error(`✗ Knowledge base validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

// Deterministic output — no volatile timestamps, so rebuilding unchanged
// sources on any day produces a byte-identical kb.json (CI relies on this).
// 'fresh' derives from the newest human review date in the corpus.
const fresh = all.map(e => e.reviewed).sort().pop();
const out = {
  fresh,
  count: all.length,
  entries: all,
};
writeFileSync(join(root, 'kb.json'), JSON.stringify(out));
const perTool = TOOLS.map(t => `${t}: ${all.filter(e => e.tool === t).length}`).join(', ');
console.log(`✓ kb.json built — ${all.length} entries (${perTool})`);
