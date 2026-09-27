#!/usr/bin/env node
/* Renders a built research page to an A4 PDF for sharing (LinkedIn document
   posts, email). Usage: node seo/build-research-pdf.mjs <slug>
     reads  research/<slug>.html   (run seo/build-research.mjs first)
     writes research/<slug>.pdf

   The PDF is the web page, not a second copy of it: same prose, same charts,
   same figures and citations, re-laid out for paper. A cover and a contents
   page go in front, each numbered section starts a page, charts never split
   across pages, the "show as a table" toggles are dropped (paper cannot
   expand them), FAQ answers are printed open, and every source prints its URL.
   It always prints in the light theme, because paper is light.

   A draft page prints a plain note about how the figures were checked, on the
   sources page, in place of the web banner. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { serve } from '../test/lib/serve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: node seo/build-research-pdf.mjs <slug>'); process.exit(2); }
const src = join(root, 'research', `${slug}.html`);
if (!existsSync(src)) { console.error(`✗ research/${slug}.html not built — run seo/build-research.mjs ${slug}`); process.exit(1); }
const data = JSON.parse(readFileSync(join(root, 'knowledge/research', `${slug}.json`), 'utf8'));
let html = readFileSync(src, 'utf8');
const isDraft = data.meta.status !== 'published';

const cut = (re, what) => {
  const m = html.match(re);
  if (!m) throw new Error(`print layout: could not find ${what} in research/${slug}.html`);
  html = html.replace(m[0], '');
  return m[0];
};
const hero = cut(/<header class="hero">[\s\S]*?<\/header>/, 'the hero');
const heroTiles = cut(/<div class="tiles">[\s\S]*?<\/div><\/div>(?=\s*<section class="takeaways")/, 'the headline tiles');
cut(/<header class="site-top">[\s\S]*?<\/header>/, 'the site header');
if (isDraft) cut(/<div class="draft" role="note">[\s\S]*?<\/div>/, 'the draft banner');
const title = hero.match(/<h1>([\s\S]*?)<\/h1>/)[1];
const dek = (hero.match(/<p class="dek">([\s\S]*?)<\/p>/) || [, ''])[1];
const eyebrow = (hero.match(/<p class="eyebrow">([\s\S]*?)<\/p>/) || [, ''])[1];
const nSources = (html.match(/<li id="src-\d+"/g) || []).length;
const asOf = new Date(data.meta.reviewed + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const onlineUrl = `https://regenesisimpact.in/research/${slug}.html`;

/* The cover graphic is a chart from the page itself, drawn from the same
   data file (meta.cover_chart, a bars chart), so it carries sourced numbers. */
const coverChart = (data.charts || []).find(c => c.id === data.meta.cover_chart);
const FIG = new Map(data.figures.map(f => [f.id, f]));
const motif = coverChart ? `<figure class="cv-chart">${coverChart.rows.map(r => {
  const f = FIG.get(r.fig), top = coverChart.max ?? Math.max(...coverChart.rows.map(x => FIG.get(x.fig).value));
  return `<div class="cv-bar"><span class="cv-bl">${r.label}</span><span class="cv-bt"><i style="width:${(f.value / top * 100).toFixed(1)}%"></i></span><b>${f.display}</b></div>`;
}).join('')}<figcaption>${coverChart.title}</figcaption></figure>` : '';
const cover = `<section class="cover">
  <div class="cv-top"><span class="cv-brand">ReGenesis Impact</span><span class="cv-kind">Research briefing</span></div>
  ${motif}
  <div class="cv-main">
    <p class="cv-eyebrow">${eyebrow}</p>
    <h1 class="cv-title">${title}</h1>
    <p class="cv-dek">${dek}</p>
  </div>
  <div class="cv-tiles">${heroTiles}</div>
  <div class="cv-foot"><span>${asOf}</span><span>${nSources} sources</span><span>regenesisimpact.in</span></div>
</section>`;

const figuresNote = `<div class="print-note"><b>About the figures.</b> Every figure in this briefing is attributed to the publisher named in the numbered source list, with the date that publisher gave it. ${isDraft
  ? 'The figures were compiled from publishers’ pages and published summaries as of ' + asOf + '. Some underlying documents could not be read in full, so check a figure against its source before relying on it.'
  : 'Each was checked against the publisher’s own document as of ' + asOf + '.'} Educational analysis, not investment or legal advice.</div>`;

const back = `<section class="back">
  <p class="cv-eyebrow">ReGenesis Impact</p>
  <h2 class="back-title">Free, browser-only climate compliance tools for ISSB, ESRS, AASB S2 and PCAF.</h2>
  <p>Read this briefing online, with every chart as a table and every source linked:</p>
  <p class="back-url">${onlineUrl.replace('https://', '')}</p>
  <p>Find out which climate rules apply to you, and by when: <b>regenesisimpact.in/app</b></p>
</section>`;

html = html
  .replace('<html lang="en">', '<html lang="en" data-theme="light">')
  .replace(/<script>try\{var t=localStorage[\s\S]*?<\/script>/, '')
  .replace(/<meta name="robots"[^>]*>\n?/, '')
  .replace(/<details class="faq">/g, '<details class="faq" open>')
  .replace('<div class="wrap">', `<div class="wrap">${cover}`)
  .replace(/(<section aria-labelledby="sources-h">\s*<h2 id="sources-h">Sources<\/h2>)/, `$1${figuresNote}`)
  .replace(/<\/div>\s*<\/body>/, `${back}</div>\n</body>`)
  .replace('</style>', `${PRINT_CSS()}</style>`);

function PRINT_CSS() { return `
@page{size:A4;margin:20mm 18mm 20mm 18mm;
  @bottom-left{content:"ReGenesis Impact · Research briefing";font:500 7.5pt 'Geist',system-ui,sans-serif;color:#6b7078;letter-spacing:.04em}
  @bottom-right{content:counter(page);font:600 7.5pt 'Geist',system-ui,sans-serif;color:#6b7078}}
@page :first{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
@page back{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
/* Paper is white edge to edge: a tinted body stops at the page margins and
   reads as a box. Cards keep a faint tint so charts still sit on a surface. */
:root[data-theme="light"]{--surface:#F6F5F1}
body{background:#fff}
.wrap{max-width:none;padding:0}
article p,article li{font-size:9.6pt;line-height:1.58}
article h2{font-size:18pt;margin:0 0 10pt;break-after:avoid}
article h3{font-size:12pt;margin:16pt 0 6pt;break-after:avoid}
article>h2{break-before:page}
#faq{break-before:auto;margin-top:22pt}
.chart,.tile,.tiles,.method,.evidence>div,.steps li,.plain,.callout-warn,.ladder,.rung,.takeaways,.faq,.watch li,table.data tr,.print-note,.related{break-inside:avoid}
p{orphans:3;widows:3}
.as-table{display:none}
.chart{margin:14pt 0;padding:14pt 16pt 10pt}
.cite a{background:none;padding:0 1px}
.takeaways{margin:0 0 18pt}
.toc{break-after:page;margin:0}
.related{display:none}
.foot{display:none}
#sources-h{break-before:page}
.sources{font-size:7.6pt;display:block;columns:2;column-gap:16pt}
.sources li{break-inside:avoid;margin-bottom:5pt}
.sources a{color:inherit;text-decoration:none}
.sources a::after{content:" " attr(href);display:block;color:#6b7078;font-size:7pt;word-break:break-all}
.pending-tag{display:none}
.print-note{font-size:8.5pt;line-height:1.5;color:var(--ink-2);border:1px solid var(--line);border-radius:var(--r-3);padding:9pt 12pt;margin:0 0 14pt;background:var(--surface)}
/* cover */
.cover{height:297mm;box-sizing:border-box;padding:22mm 20mm 18mm;background:#0E1013;color:#F4F3EF;display:flex;flex-direction:column;break-after:page}
.cv-top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #2c3038;padding-bottom:10pt}
.cv-brand{font-weight:650;font-size:11pt;letter-spacing:-.01em}
.cv-kind,.cv-eyebrow{font:500 7.5pt var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:#a3a8b0}
.cv-main{margin-top:auto}
.cv-title{font-size:34pt;line-height:1.04;letter-spacing:-.035em;font-weight:650;margin:10pt 0 14pt;color:#F4F3EF}
.cv-dek{font-size:12pt;line-height:1.5;color:#c7cbd1;max-width:150mm;margin:0}
.cv-tiles{margin:22pt 0 18pt}
.cover .tiles{background:#2c3038;border-color:#2c3038;margin:0;grid-template-columns:1fr 1fr}
.cv-chart{margin:30pt 0 0;display:grid;gap:7pt}
.cv-bar{display:grid;grid-template-columns:62mm 1fr 14mm;gap:10pt;align-items:center}
.cv-bl{font-size:8pt;color:#a3a8b0}
.cv-bt{height:7pt;background:#1d2127;border-radius:0 3px 3px 0;overflow:hidden}
.cv-bt i{display:block;height:100%;background:#3987e5;border-radius:0 3px 3px 0}
.cv-bar b{font:600 8.5pt var(--f-mono);color:#F4F3EF;text-align:right}
.cv-chart figcaption{font:500 7.5pt var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:#6b7078;margin-top:4pt}
.cover .tile{background:#15181d}
.cover .tile b{color:#F4F3EF;font-size:18pt}
.cover .tile span{color:#a3a8b0;font-size:8pt}
.cover .cite a{color:#a3a8b0}
.cv-foot{display:flex;gap:18pt;font:500 8pt var(--f-mono);color:#a3a8b0;border-top:1px solid #2c3038;padding-top:10pt}
.cv-foot span:last-child{margin-left:auto;color:#F4F3EF}
/* back page */
.back{page:back;break-before:page;height:297mm;box-sizing:border-box;padding:0 20mm;background:#0E1013;color:#c7cbd1;display:flex;flex-direction:column;justify-content:center}
.back-title{font-size:22pt;line-height:1.15;letter-spacing:-.025em;color:#F4F3EF;margin:10pt 0 18pt;max-width:150mm}
.back p{font-size:11pt;line-height:1.55;margin:0 0 8pt}
.back b{color:#F4F3EF}
.back-url{font:600 11pt var(--f-mono);color:#F4F3EF!important;margin-bottom:18pt!important}
`; }

const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', process.env.CHROME, '/usr/bin/chromium', '/usr/bin/google-chrome']
  .find(p => p && existsSync(p));
if (!CHROME) { console.error('✗ no Chromium found — set CHROME=/path/to/chrome'); process.exit(1); }
const out = join(root, 'research', `${slug}.pdf`);
const srv = await serve(root, { routes: { [`/research/__print-${slug}.html`]: ['text/html', html] } });
try {
  /* Async on purpose: the page is served from this process, so a synchronous
     spawn would block the server Chromium is waiting on. */
  await promisify(execFile)(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
    '--disable-background-networking', '--no-first-run', '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=8000', `--print-to-pdf=${out}`, `${srv.origin}/research/__print-${slug}.html`],
    { timeout: 90000 });
} finally { await srv.close(); }
const pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`✓ research/${slug}.pdf — ${pages} pages, ${(statSync(out).size / 1024).toFixed(0)} KB`);
