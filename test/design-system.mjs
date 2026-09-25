/* One design system, and it can only get tighter.  Run: node test/design-system.mjs

   Before this, index.html held 145 distinct hex literals and 574 distinct
   rgba literals — five greens doing the job of an accent, three off-whites
   doing the job of ink, three ambers doing the job of a warning, on two
   competing :root blocks neither of which was adopted (one .rg-btn and zero
   .rg-card in seventeen thousand lines).

   Nothing failed while that was true, which is the whole problem: a design
   system with no gate is a document, not a system. So this file counts what
   is left and refuses to let the number go back up.

   It also holds the three rules that make the token set mean something:
     · no token may be defined in terms of itself — CSS drops a
       self-referencing custom property AND every token declared with it,
       which takes the entire application to browser defaults on a white
       ground. That happened once here, caught only by the contrast gate.
     · the ink steps must clear 4.5:1 on all four grounds, computed here
       rather than eyeballed;
     · the six functions that build a standalone print or certificate
       document must keep their literals, because a var() in a document that
       never saw our :root resolves to nothing. */
import { readFileSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const src = readFileSync(`${ROOT}/index.html`, 'utf8');
const fail = [];

function styleBlocksForRadius() {
  const out = [];
  for (const m of src.matchAll(/(?<=\n)[ \t]*<style(?:\s[^>]*)?>/g)) {
    const i = m.index + m[0].length, j = src.indexOf('</style>', i);
    if (j > 0) out.push([i, j]);
  }
  return out;
}

/* ── the token block ─────────────────────────────────────────────────── */
const tokStart = src.indexOf(':root{', src.indexOf('DESIGN SYSTEM — "Instrument"'));
if (tokStart < 0) throw new Error('the token block is gone — nothing else here can be checked');
const tokEnd = src.indexOf('\n}', tokStart);
const tokens = src.slice(tokStart, tokEnd);

const declared = new Map();
for (const m of tokens.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) declared.set(m[1], m[2].trim());

/* Every custom property in every stylesheet, not just the token block: a
   cycle anywhere silently falls back to whatever was inherited, which is the
   right colour for the wrong reason until the day it isn't. */
const allStyle = [...src.matchAll(/(?<=\n)[ \t]*<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)]
  .map(m => m[1]).join('\n');
for (const m of allStyle.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/g))
  if (m[2].includes(`var(${m[1]})`))
    fail.push(`${m[1]} is declared as "${m[2].trim()}" — a custom property that names itself is a `
      + `cycle; CSS drops it and every token declared with it`);

/* ── the ink ladder, computed ────────────────────────────────────────── */
const lum = ([r, g, b]) => {
  const v = [r, g, b].map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => { const L = lum(a), M = lum(b); return (Math.max(L, M) + 0.05) / (Math.min(L, M) + 0.05); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const grounds = ['--bg-0', '--bg-1', '--bg-2', '--bg-3'].map(n => {
  const v = declared.get(n);
  if (!v || !/^#[0-9a-f]{6}$/i.test(v)) fail.push(`${n} is "${v}" — the grounds must be plain hex so contrast can be computed`);
  return { n, rgb: /^#[0-9a-f]{6}$/i.test(v || '') ? hex(v) : null };
});
const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));

for (const step of ['--ink-1', '--ink-2']) {
  const v = declared.get(step) || '';
  const m = v.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
  if (!m) { fail.push(`${step} is "${v}" — expected an rgba() so its alpha can be checked`); continue; }
  const fg = [+m[1], +m[2], +m[3]], alpha = parseFloat(m[4]);
  for (const g of grounds) {
    if (!g.rgb) continue;
    const r = ratio(over(fg, g.rgb, alpha), g.rgb);
    if (r < 4.5) fail.push(`${step} at alpha ${alpha} is ${r.toFixed(2)}:1 on ${g.n} — text needs 4.5:1`);
  }
}

/* ── the paper surface ───────────────────────────────────────────────
   The report renders on a light sheet inside a dark application. Its ink is
   checked against both the sheet and the tint block, and the block is checked
   for dark-surface tokens — because the colour sweep put --ink-2 (58% white)
   on the white sheet and --line-2 (22% white) on the table cells, and nothing
   failed, since the report panel is hidden until someone generates a report. */
const paperGrounds = ['--pa-bg', '--pa-bg-2'].map(n => ({ n, v: declared.get(n) }));
for (const step of ['--pa-ink-0', '--pa-ink-1', '--pa-ink-2', '--pa-acc', '--pa-crit', '--pa-warn']) {
  const v = declared.get(step);
  if (!v || !/^#[0-9a-f]{6}$/i.test(v)) { fail.push(`${step} is "${v}" — expected a plain hex`); continue; }
  for (const g of paperGrounds) {
    if (!g.v || !/^#[0-9a-f]{6}$/i.test(g.v)) { fail.push(`${g.n} is "${g.v}" — expected a plain hex`); continue; }
    const r = ratio(hex(v), hex(g.v));
    if (r < 4.5) fail.push(`${step} is ${r.toFixed(2)}:1 on ${g.n} — text on paper needs 4.5:1`);
  }
}

const paperStart = src.indexOf('/* ── PAPER SURFACE');
if (paperStart < 0) fail.push('the paper surface block is gone — the report styles have no home');
else {
  const paperEnd = src.indexOf('@media print{', paperStart);
  const block = src.slice(paperStart, paperEnd);
  // --acc is deliberate on the dark chips inside the sheet (the badge, the
  // section number, the table head), where it sits on --pa-rule.
  const strays = [...block.matchAll(/var\((--(?:ink|line|bg)-[0-9a-z]+)\)/g)].map(m => m[1]);
  if (strays.length)
    fail.push(`the paper surface references ${strays.length} dark-surface token(s) `
      + `(${[...new Set(strays)].join(', ')}) — on a white sheet those are invisible`);
}

/* ── the standalone-document builders keep their literals ────────────── */
const BUILDERS = ['window.cipExportTCFDPdf = function', 'window.rgLedgerPack = function',
  'window.ghgExportReport = function', 'window.srExportPDF = function',
  'window.doExport = function', 'window.crDownloadCert = function'];
const bodySpan = (s, h) => {
  const i = s.indexOf(h);
  if (i < 0) return null;
  let d = 0;
  for (let k = s.indexOf('{', i); k < s.length; k++) {
    if (s[k] === '{') d++;
    else if (s[k] === '}' && --d === 0) return [i, k + 1];
  }
  return null;
};
for (const h of BUILDERS) {
  const span = bodySpan(src, h);
  if (!span) { fail.push(`${h} is gone — if it was renamed, the sweep scripts and this gate must follow`); continue; }
  const body = src.slice(...span);
  const leaked = [...body.matchAll(/var\(--[a-z0-9-]+\)/g)].map(m => m[0]);
  if (leaked.length)
    fail.push(`${h.split(' ')[0]} builds a standalone document but carries ${leaked.length} token `
      + `reference(s) (${[...new Set(leaked)].slice(0, 3).join(', ')}) — that document never sees our `
      + `:root, so each one resolves to nothing and the page prints unstyled`);
}

/* ── colour literals in JS that renders into THIS document ───────────
   Both colour sweeps worked on <style> blocks and style="" attributes, so a
   declaration assembled by string concatenation — 'color:' + (isError ?
   '#ff6c3e' : '#00e87a') — came through untouched, keeping its own near-black,
   its own two greens and a 32px pill. Anything inside the six builders is
   exempt, because those build a document that never sees our :root. */
{
  const scripts = [];
  for (const m of src.matchAll(/(?<=\n)[ \t]*<script(?:\s[^>]*)?>/g)) {
    const i = m.index + m[0].length, j = src.indexOf('</script>', i);
    if (j > 0) scripts.push([i, j]);
  }
  const frozen = BUILDERS.map(h => bodySpan(src, h)).filter(Boolean);
  const decl = /(?:background|background-color|color|border|border-color|border-top|border-left|box-shadow|fill|stroke)\s*:\s*[^;'"]{0,40}?(#[0-9a-fA-F]{3,6}\b|rgba?\(\s*\d+\s*,)/g;
  const found = [];
  for (const m of src.matchAll(decl)) {
    const a = m.index;
    if (!scripts.some(([i, j]) => i <= a && a < j)) continue;   // markup, covered above
    if (frozen.some(([i, j]) => i <= a && a < j)) continue;     // standalone document
    found.push(`line ${src.slice(0, a).split('\n').length}: ${m[0].slice(0, 46)}`);
  }
  for (const f of found.slice(0, 6))
    fail.push(`a colour literal reaches this document from JS — ${f}`);
  if (found.length > 6) fail.push(`…and ${found.length - 6} more colour literals in JS`);
}

/* ── the radius scale ────────────────────────────────────────────────
   55 distinct radius values existed, 62 of them a 32px pill. Circles stay
   circles; everything else is one of four steps. */
{
  const bad = new Set();
  for (const [i, j] of styleBlocksForRadius()) {
    for (const m of src.slice(i, j).matchAll(/border(?:-[a-z]+)?-radius:\s*([^;}"']+)/g)) {
      for (const raw of m[1].split('/')[0].trim().split(/\s+/)) {
        const part = raw.replace('!important', '').trim();
        if (!part || part === '0' || part.endsWith('%')) continue;
        if (part.startsWith('var(') || part.startsWith('calc(') || part === 'inherit') continue;
        bad.add(part);
      }
    }
  }
  bad.delete('');
  if (bad.size)
    fail.push(`${bad.size} radius value(s) off the scale in stylesheets (${[...bad].slice(0, 5).join(', ')}) `
      + `— use --r-1/--r-2/--r-3, or 50% for a circle`);
}

/* ── the ratchet ─────────────────────────────────────────────────────── */
const styleBlocks = styleBlocksForRadius();
const distinct = { hex: new Set(), rgb: new Set() };
let total = 0;
for (const [i, j] of styleBlocks) {
  for (const m of src.slice(i, j).matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    if (i + m.index >= tokStart && i + m.index <= tokEnd) continue;
    distinct.hex.add(m[0].toLowerCase()); total++;
  }
  for (const m of src.slice(i, j).matchAll(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
    if (i + m.index >= tokStart && i + m.index <= tokEnd) continue;
    distinct.rgb.add(m.slice(1, 4).join(',')); total++;
  }
}
/* The ceiling is the count after the collapse, not a round number. Lower it
   whenever you take literals out; never raise it. A new colour belongs in the
   token block, where it gets a name and a contrast check. */
const CEILING = { total: 0, distinctHex: 0, distinctRgb: 0 };
const got = { total, distinctHex: distinct.hex.size, distinctRgb: distinct.rgb.size };
for (const k of Object.keys(CEILING))
  if (got[k] > CEILING[k])
    fail.push(`${k}: ${got[k]} colour literals in the stylesheets, ceiling is ${CEILING[k]} — `
      + `put the new colour in the token block instead`);

if (fail.length) {
  console.error(`✗ design system — ${fail.length} problem${fail.length > 1 ? 's' : ''}:`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ design system — ${declared.size} tokens, no self-reference, ink clears 4.5:1 on all `
  + `four grounds, ${BUILDERS.length} standalone-document builders token-free, `
  + `${got.total} colour literals left in stylesheets (${got.distinctHex} hex, ${got.distinctRgb} rgb)`);
