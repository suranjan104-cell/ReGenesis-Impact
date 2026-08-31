#!/usr/bin/env node
// Regenerates the worked-cases section of esrs/index.html from
// knowledge/esrs/cases.json.  Usage: node seo/build-esrs-page.mjs
//
// The cases are the page's most citable content — a specific rule, the mistake
// it exposes, and a worked number — which is exactly what an AI answer quotes
// and what a long-tail search matches. Generating them means the page and the
// tool can never describe the same case differently.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esrs = JSON.parse(readFileSync(join(root, 'knowledge', 'esrs.json'), 'utf8'));
const cases = esrs.cases.cases;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const START = '<!-- CASES:START -->';
const END = '<!-- CASES:END -->';

const html = `${START}
  <h2>Six worked cases</h2>
  <p>
    Each one is a fictional entity built to make a single rule visible, and each is loadable in the
    tool &mdash; the figures below are what the calculation actually returns, not a description of
    what it would return. The entities are invented on purpose: a worked example attributed to a
    real company is a fabricated record.
  </p>
${cases.map(c => `  <div class="case">
    <h3>${esc(c.name)}</h3>
    <div class="case-sector">${esc(c.sector)}</div>
    <p class="case-teach"><strong>Shows:</strong> ${esc(c.teaches)}</p>
    <p class="case-trap"><strong>The mistake it exposes:</strong> ${esc(c.trap)}</p>
    <p class="case-res"><strong>Result:</strong> ${esc(c.expect)}</p>
    <p>${esc(c.note)}</p>
  </div>`).join('\n')}
  <p><a class="cta ghost" href="../#esrs">Load any of these in the tool &rarr;</a></p>
${END}`;

/* The cases also go into the FAQ schema: "what happens if minimum safeguards
   are not met" is a real question with a specific answer, and a structured
   answer is what gets surfaced. */
const faq = cases.map(c => ({
  '@type': 'Question',
  name: `${c.teaches.replace(/\.$/, '')} — worked example`,
  acceptedAnswer: { '@type': 'Answer', text: `${c.teaches} ${c.expect} ${c.note}` },
}));

const page = readFileSync(join(root, 'esrs', 'index.html'), 'utf8');
const a = page.indexOf(START), b = page.indexOf(END);
if (a < 0 || b < 0 || b < a) {
  console.error(`✗ esrs/index.html has no ${START} … ${END} block to fill`);
  process.exit(1);
}
let out = page.slice(0, a) + html + page.slice(b + END.length);

const SCHEMA_START = '<script type="application/ld+json" id="cases-faq">';
const SCHEMA_END = '</script>';
const sa = out.indexOf(SCHEMA_START);
if (sa < 0) { console.error('✗ esrs/index.html has no <script id="cases-faq"> block'); process.exit(1); }
const sb = out.indexOf(SCHEMA_END, sa);
out = out.slice(0, sa + SCHEMA_START.length) +
  JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq }) +
  out.slice(sb);

writeFileSync(join(root, 'esrs', 'index.html'), out);
console.log(`✓ esrs/index.html — ${cases.length} worked cases rendered and added to the FAQ schema`);
