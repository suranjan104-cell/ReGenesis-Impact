#!/usr/bin/env node
/* Builds a long-form research piece from a data file and a body template.
   Usage: node seo/build-research.mjs <slug>
     reads  knowledge/research/<slug>.json   (sources, figures, charts, meta)
            seo/research/<slug>.html         (the prose, with placeholders)
     writes research/<slug>.html

   The rule this exists to enforce: no number reaches the page without a
   source, and nothing is presented as verified that was not read at its
   source. Every source records how it was checked:
     primary — the figure was read in the publisher's own document
     excerpt — the figure was seen only in a search excerpt of the
               publisher's page, not in the document itself
   While any cited source is excerpt-only the page builds as a DRAFT: a
   banner says how many figures await verification, the page is noindex,
   and it stays out of the sitemap. Publishing requires every cited source
   to be primary; the build refuses otherwise.

   Placeholders in the template:
     {{fig:ID}}    the figure's display value followed by its citation
     {{val:ID}}    the display value alone (for headings)
     {{cite:SRC}}  a citation marker for a source
     {{chart:ID}}  a chart defined in the data file
     {{tiles:ID}}  a row of headline figures
   Chart types: bars, grouped (several series per label), stacked (100%).
   A source dated "n.d." must carry a note.                                    */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bars, grouped, stacked, tiles, esc, CHART_CSS } from './charts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: node seo/build-research.mjs <slug>'); process.exit(2); }
const data = JSON.parse(readFileSync(join(root, 'knowledge/research', `${slug}.json`), 'utf8'));
const tpl = readFileSync(join(root, 'seo/research', `${slug}.html`), 'utf8');
const SITE = 'https://regenesisimpact.in';
const errors = [];

/* ── validate ─────────────────────────────────────────────────────────── */
const SRC = new Map();
for (const s of data.sources) {
  if (SRC.has(s.id)) errors.push(`duplicate source ${s.id}`);
  SRC.set(s.id, s);
  if (!s.publisher || !s.title) errors.push(`${s.id}: publisher and title required`);
  if (!/^https:\/\//.test(s.url || '')) errors.push(`${s.id}: https url required`);
  /* "n.d." is allowed — many publisher pages carry no date — but only with a
     note saying so, so an undated source is never silently undated. */
  if (s.date === 'n.d.') { if (!s.note) errors.push(`${s.id}: an undated source needs a note`); }
  else if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s.date || '')) errors.push(`${s.id}: date must be YYYY, YYYY-MM, YYYY-MM-DD or n.d.`);
  if (!['primary', 'excerpt'].includes(s.verified)) errors.push(`${s.id}: verified must be primary|excerpt`);
}
const FIG = new Map();
for (const f of data.figures) {
  if (FIG.has(f.id)) errors.push(`duplicate figure ${f.id}`);
  FIG.set(f.id, f);
  if (!f.display) errors.push(`${f.id}: display required`);
  if (!f.source || !SRC.has(f.source)) errors.push(`${f.id}: source "${f.source}" is not in the source list`);
  if (!f.refers_to) errors.push(`${f.id}: refers_to required — which year or period the figure describes`);
}

/* ── citations, numbered by first use ─────────────────────────────────── */
const order = [];
const cite = id => {
  if (!SRC.has(id)) { errors.push(`citation to unknown source ${id}`); return ''; }
  if (!order.includes(id)) order.push(id);
  const n = order.indexOf(id) + 1, s = SRC.get(id);
  return `<sup class="cite${s.verified === 'excerpt' ? ' pending' : ''}"><a href="#src-${n}" aria-label="Source ${n}: ${esc(s.publisher)}">${n}</a></sup>`;
};
const fig = (id, withCite = true) => {
  const f = FIG.get(id);
  if (!f) { errors.push(`unknown figure ${id}`); return '??'; }
  return withCite ? `${esc(f.display)}${cite(f.source)}` : esc(f.display);
};

/* ── charts ───────────────────────────────────────────────────────────── */
const chart = id => {
  const c = (data.charts || []).find(x => x.id === id);
  if (!c) { errors.push(`unknown chart ${id}`); return ''; }
  if (c.type === 'bars') {
    const rows = c.rows.map(r => {
      const f = FIG.get(r.fig);
      if (!f) { errors.push(`chart ${id}: unknown figure ${r.fig}`); return null; }
      if (typeof f.value !== 'number') errors.push(`chart ${id}: figure ${r.fig} has no numeric value`);
      return { label: r.label, value: f.value, display: f.display, color: r.color, cite: cite(f.source) };
    }).filter(Boolean);
    return bars({ id, title: c.title, caption: c.caption, rows, max: c.max, legend: c.legend });
  }
  if (c.type === 'grouped') {
    const rows = c.rows.map(r => {
      const values = {}, srcs = new Set();
      for (const [k, figId] of Object.entries(r.values)) {
        const f = FIG.get(figId);
        if (!f) { errors.push(`chart ${id}: unknown figure ${figId}`); continue; }
        if (typeof f.value !== 'number') errors.push(`chart ${id}: figure ${figId} has no numeric value`);
        values[k] = { value: f.value, display: f.display }; srcs.add(f.source);
      }
      return { label: r.label, values, cite: [...srcs].map(cite).join('') };
    });
    return grouped({ id, title: c.title, caption: c.caption, series: c.series, rows, max: c.max });
  }
  if (c.type === 'stacked') {
    const rows = c.rows.map(r => {
      const parts = {};
      for (const [k, figId] of Object.entries(r.parts)) {
        const f = FIG.get(figId);
        if (!f) { errors.push(`chart ${id}: unknown figure ${figId}`); continue; }
        parts[k] = f.value;
      }
      const srcs = [...new Set(Object.values(r.parts).map(x => FIG.get(x)?.source).filter(Boolean))];
      return { label: r.label, parts, cite: srcs.map(cite).join('') };
    });
    return stacked({ id, title: c.title, caption: c.caption, segments: c.segments, rows });
  }
  errors.push(`chart ${id}: unknown type ${c.type}`); return '';
};
const tileRow = id => {
  const t = (data.tiles || []).find(x => x.id === id);
  if (!t) { errors.push(`unknown tiles ${id}`); return ''; }
  return tiles(t.items.map(i => ({ value: FIG.get(i.fig)?.display ?? '??', label: i.label, cite: FIG.get(i.fig) ? cite(FIG.get(i.fig).source) : '' })));
};

let body = tpl
  .replace(/\{\{chart:([\w-]+)\}\}/g, (_, id) => chart(id))
  .replace(/\{\{tiles:([\w-]+)\}\}/g, (_, id) => tileRow(id))
  .replace(/\{\{fig:([\w-]+)\}\}/g, (_, id) => fig(id))
  .replace(/\{\{val:([\w-]+)\}\}/g, (_, id) => fig(id, false))
  .replace(/\{\{cite:([\w-]+)\}\}/g, (_, id) => cite(id));
if (/\{\{[^}]*\}\}/.test(body)) errors.push(`unresolved placeholder: ${body.match(/\{\{[^}]*\}\}/)[0]}`);

const unused = data.sources.filter(s => !order.includes(s.id)).map(s => s.id);
if (unused.length) errors.push(`sources never cited: ${unused.join(', ')} — cite them or remove them`);
const pending = order.filter(id => SRC.get(id).verified === 'excerpt');
const isDraft = data.meta.status !== 'published';
if (!isDraft && pending.length)
  errors.push(`status is "published" but ${pending.length} cited source(s) are excerpt-only: ${pending.join(', ')}`);

if (errors.length) {
  console.error(`✗ research/${slug}.html not built (${errors.length} problem${errors.length > 1 ? 's' : ''}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

/* ── the page ─────────────────────────────────────────────────────────── */
const m = data.meta;
const sourcesHtml = `<ol class="sources">${order.map((id, i) => {
  const s = SRC.get(id);
  return `<li id="src-${i + 1}"><span class="src-pub">${esc(s.publisher)}</span> — <a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a>, ${s.date === 'n.d.' ? 'undated' : esc(s.date)}.`
    + (s.verified === 'excerpt' ? ` <em class="pending-tag">Awaiting check against the full document.</em>` : '')
    + (s.note ? ` <span class="src-note">${esc(s.note)}</span>` : '') + `</li>`;
}).join('')}</ol>`;
const faqLd = m.faq ? { '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: m.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null;
const articleLd = { '@context': 'https://schema.org', '@type': 'Report', name: m.title, headline: m.title,
  description: m.description, datePublished: m.published, dateModified: m.reviewed, inLanguage: 'en',
  publisher: { '@type': 'Organization', name: 'ReGenesis Impact', url: SITE + '/' }, url: `${SITE}/research/${slug}.html`,
  citation: order.map(id => ({ '@type': 'CreativeWork', name: SRC.get(id).title, url: SRC.get(id).url, publisher: SRC.get(id).publisher })) };

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(m.title)} | ReGenesis Impact</title>
<meta name="description" content="${esc(m.description)}">
<link rel="canonical" href="${SITE}/research/${slug}.html">
${isDraft ? '<meta name="robots" content="noindex">\n' : ''}<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(m.title)}">
<meta property="og:description" content="${esc(m.description)}">
<meta property="og:url" content="${SITE}/research/${slug}.html">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(articleLd)}</script>
${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>\n` : ''}<script>try{var t=localStorage.getItem('rg_ws_theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
<meta name="theme-color" content="#F4F3EF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1013" media="(prefers-color-scheme: dark)">
<link rel="preload" href="../fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../fonts/geist.css">
<link rel="stylesheet" href="../styles/site.css">
<style>
.wrap{max-width:780px;margin:0 auto;padding:0 1.25rem 5rem}
.hero h1{font-size:clamp(2rem,5vw,3.1rem);margin:.6rem 0 1rem}
.dek{font-size:1.15rem;color:var(--ink-2);line-height:1.55;margin:0 0 1.2rem}
.byline{font-size:.82rem;color:var(--ink-3);margin:0 0 2rem}
.draft{margin:1.2rem 0 2rem;padding:12px 14px;border:1px solid var(--warn);border-radius:var(--r-3);font-size:.88rem;background:var(--surface)}
.draft b{color:var(--warn)}
.toc{border:1px solid var(--line);border-radius:var(--r-3);padding:16px 18px;background:var(--surface);margin:0 0 2.4rem}
.toc ol{margin:.4rem 0 0;padding-left:1.2rem;display:grid;gap:4px;font-size:.92rem}
.toc a{text-decoration:none}
article h2{font-size:1.55rem;margin:3rem 0 1rem;scroll-margin-top:24px}
article h3{font-size:1.1rem;margin:2rem 0 .6rem}
article p,article li{font-size:1.02rem;line-height:1.7}
article p{margin:0 0 1rem}
.plain{border-left:3px solid var(--ink);padding:10px 16px;margin:1.4rem 0;background:var(--surface);border-radius:0 var(--r-3) var(--r-3) 0}
.plain b{display:block;font:500 .7rem var(--f-mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-bottom:4px}
.steps{counter-reset:s;list-style:none;padding:0;display:grid;gap:12px}
.steps li{counter-increment:s;position:relative;padding:14px 16px 14px 52px;border:1px solid var(--line);border-radius:var(--r-3);background:var(--surface)}
.steps li::before{content:counter(s);position:absolute;left:16px;top:14px;width:24px;height:24px;border-radius:50%;background:var(--ink);color:var(--invert-ink);font:600 .75rem/24px var(--f-mono);text-align:center}
.steps li b{display:block;margin-bottom:2px}
.cite{font:600 .66rem var(--f-mono);margin-left:1px}
.cite a{text-decoration:none;padding:0 2px;border-radius:2px;background:var(--sunk)}
.sources{padding-left:1.4rem;font-size:.86rem;line-height:1.55;display:grid;gap:8px}
.sources li{padding-left:4px}
.src-pub{font-weight:600}
.src-note{display:block;color:var(--ink-3);font-size:.8rem}
.pending-tag{color:var(--warn);font-style:normal;font-size:.8rem}
table.data{width:100%;border-collapse:collapse;font-size:.9rem;margin:1.2rem 0 1.6rem}
table.data th,table.data td{text-align:left;vertical-align:top;padding:9px 10px;border-bottom:1px solid var(--line)}
table.data thead th{font:500 .7rem var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.tbl{overflow-x:auto}
.foot{margin-top:3rem;padding-top:1.25rem;border-top:1px solid var(--line);font-size:.82rem;color:var(--ink-3)}
.takeaways{border:1px solid var(--line);border-radius:var(--r-3);padding:6px 20px 12px;background:var(--surface);margin:0 0 2rem}
.takeaways h2{font-size:1.1rem;margin:1rem 0 .4rem}
.takeaways ul{margin:0;padding-left:1.1rem;display:grid;gap:8px}
.takeaways li{font-size:.97rem;line-height:1.6}
.ladder{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r-3);overflow:hidden;margin:1.2rem 0 .6rem}
.rung{display:grid;grid-template-columns:10px 72px 1fr;gap:12px;align-items:center;background:var(--surface);padding:11px 14px}
.rung i{align-self:stretch;border-radius:3px;min-height:22px}
.rung b{font:600 .8rem var(--f-mono)}
.rung span{font-size:.92rem;line-height:1.45}
.note-s{font-size:.82rem;color:var(--ink-3)}
.evidence{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:1.6rem 0}
.evidence div{border:1px solid var(--line);border-radius:var(--r-3);padding:14px 16px;background:var(--surface);display:flex;flex-direction:column;gap:6px}
.evidence b{font-size:1.5rem;font-weight:650;letter-spacing:-.02em;line-height:1.1}
.evidence span{font-size:.88rem;line-height:1.5;color:var(--ink-2)}
.st{display:inline-block;font:600 .68rem var(--f-mono);letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:var(--r-1);border:1px solid currentColor;margin:0 4px 4px 0;white-space:nowrap}
.st.ok{color:var(--good)}.st.wait{color:var(--warn)}.st.stop{color:var(--crit)}
table.data th[scope=row]{font-weight:600;white-space:nowrap}
.methods{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin:1.4rem 0}
.method{border:1px solid var(--line);border-radius:var(--r-3);padding:16px 18px;background:var(--surface)}
.method b{display:block;font-size:.98rem;margin-bottom:6px}
.method p{font-size:.93rem;line-height:1.6;margin:0 0 10px}
.method span{display:block;font:500 .72rem var(--f-mono);color:var(--ink-3);border-top:1px solid var(--line);padding-top:8px}
.callout-warn{border:1px solid var(--warn);border-radius:var(--r-3);padding:14px 18px;margin:1.6rem 0;background:var(--surface)}
.callout-warn>b{display:block;color:var(--warn);margin-bottom:6px}
.callout-warn ul{margin:0;padding-left:1.1rem;display:grid;gap:6px}
.facts,.checks{padding-left:1.1rem;display:grid;gap:8px}
.checks{list-style:none;padding:0}
.checks li{position:relative;padding-left:26px}
.checks li::before{content:"";position:absolute;left:2px;top:.55em;width:12px;height:6px;border-left:2px solid var(--good);border-bottom:2px solid var(--good);transform:rotate(-45deg)}
.qs{padding-left:1.3rem;display:grid;gap:6px}
.watch{list-style:none;padding:0;margin:1rem 0;border-left:2px solid var(--line-strong)}
.watch li{display:grid;grid-template-columns:110px 1fr;gap:14px;padding:8px 0 8px 16px;position:relative}
.watch li::before{content:"";position:absolute;left:-6px;top:15px;width:10px;height:10px;border-radius:50%;background:var(--ink)}
.watch time{font:600 .8rem var(--f-mono);padding-top:3px}
.faq{border-bottom:1px solid var(--line);padding:12px 0}
.faq summary{cursor:pointer;font-weight:600}
.faq p{margin:.6rem 0 0}
.related{margin:3rem 0 0;padding:16px 18px;border:1px solid var(--line);border-radius:var(--r-3);display:grid;gap:8px;background:var(--surface)}
.related a{font-size:.95rem}
@media(max-width:560px){.rung{grid-template-columns:8px 60px 1fr;gap:10px}.watch li{grid-template-columns:1fr;gap:2px}table.data th[scope=row]{white-space:normal}}
${CHART_CSS}
</style>
</head>
<body>
<div class="wrap">
  <header class="site-top">
    <a class="brand" href="../">ReGenesis Impact</a><span class="sep">/</span><span class="where">Research</span>
    <span class="go"><a class="btn ink" href="../app/">What do I owe? →</a></span>
  </header>
  ${isDraft ? `<div class="draft" role="note"><b>Draft.</b> ${pending.length} of ${order.length} sources have been checked only against a search excerpt of the publisher's page, not the full document. They are marked below. This page is not indexed until every figure is verified at its source.</div>` : ''}
  ${body}
  <section aria-labelledby="sources-h">
    <h2 id="sources-h">Sources</h2>
    <p class="byline">${order.length} sources, numbered in the order they are first cited. Every figure on this page links to one.</p>
    ${sourcesHtml}
  </section>
  <div class="foot"><p>Educational analysis, not investment or legal advice. Figures are as published by each source on the date given; verify against the source before relying on them.</p></div>
</div>
</body>
</html>
`;
writeFileSync(join(root, 'research', `${slug}.html`), html);
console.log(`✓ research/${slug}.html — ${data.figures.length} figures, ${order.length} sources cited`
  + (isDraft ? ` · DRAFT: ${pending.length} awaiting primary verification (noindex)` : ' · published'));
