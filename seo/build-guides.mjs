#!/usr/bin/env node
// Generates crawlable guide pages (guides/*.html) + sitemap.xml from
// seo/guides-data.mjs, pulling verified facts from knowledge/kb.json so
// the guides always say what the AI says. Run after editing either input:
//   node seo/build-guides.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDES } from './guides-data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const kb = JSON.parse(readFileSync(join(root, 'knowledge', 'kb.json'), 'utf8'));
const kbById = new Map(kb.entries.map(e => [e.id, e]));
const SITE = 'https://regenesisimpact.in';
// Deterministic date stamp: newest KB review month (not "today"), so
// rebuilding unchanged sources yields byte-identical pages and sitemap.
const today = kb.entries.map(e => e.reviewed).sort().pop() + '-01';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function factsBlock(ids, slug) {
  return ids.map(id => {
    const e = kbById.get(id);
    if (!e) throw new Error(`${slug}: unknown kb id ${id}`);
    const host = new URL(e.source).hostname.replace(/^www\./, '');
    return `<div class="fact">
      <h3>${esc(e.title)}</h3>
      <ul>${e.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      <p class="src">Source: <a href="${esc(e.source)}" rel="noopener" target="_blank">${esc(host)}</a> · reviewed ${esc(e.reviewed)}</p>
    </div>`;
  }).join('\n');
}

function page(g) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: g.faq.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ReGenesis Impact', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: g.title, item: `${SITE}/guides/${g.slug}.html` },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(g.title)} | ReGenesis Impact</title>
<meta name="description" content="${esc(g.description)}">
<link rel="canonical" href="${SITE}/guides/${g.slug}.html">
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(g.title)}">
<meta property="og:description" content="${esc(g.description)}">
<meta property="og:url" content="${SITE}/guides/${g.slug}.html">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>
<style>
:root{color-scheme:dark}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#030a06;color:#eafff3;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;line-height:1.7;
background-image:radial-gradient(ellipse 70% 45% at 50% 0%,rgba(0,232,122,.08),transparent 70%)}
.wrap{max-width:760px;margin:0 auto;padding:2.5rem 1.25rem 4rem}
a{color:#00e87a}
.home{display:inline-flex;gap:.5rem;align-items:center;font-size:.85rem;text-decoration:none;margin-bottom:2rem;
border:1px solid rgba(0,232,122,.25);border-radius:2rem;padding:.4rem 1rem}
.eyebrow{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(0,232,122,.7);margin-bottom:.6rem;font-family:ui-monospace,monospace}
h1{font-size:2rem;line-height:1.2;margin-bottom:1rem;letter-spacing:-.01em}
.intro{color:rgba(234,255,243,.75);font-size:1.02rem;margin-bottom:2rem}
h2{font-size:1.25rem;margin:2.4rem 0 1rem;color:#00ff9d}
.fact{background:rgba(3,14,9,.85);border:1px solid rgba(0,232,122,.16);border-radius:.7rem;padding:1.1rem 1.25rem;margin-bottom:1rem;
box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.fact h3{font-size:.95rem;margin-bottom:.5rem}
.fact ul{padding-left:1.1rem;color:rgba(234,255,243,.8);font-size:.9rem}
.fact li{margin-bottom:.35rem}
.src{font-size:.72rem;color:rgba(234,255,243,.45);margin-top:.6rem}
details{background:rgba(3,14,9,.6);border:1px solid rgba(0,232,122,.14);border-radius:.6rem;padding:.85rem 1.1rem;margin-bottom:.7rem}
summary{cursor:pointer;font-weight:600;font-size:.94rem}
details p{margin-top:.6rem;color:rgba(234,255,243,.75);font-size:.9rem}
.cta{display:block;text-align:center;background:linear-gradient(135deg,#00e87a,#0affdb);color:#020806;font-weight:700;
text-decoration:none;border-radius:.6rem;padding:1rem;margin:2.6rem 0 1rem;box-shadow:0 6px 30px -8px rgba(0,232,122,.5)}
.foot{margin-top:3rem;padding-top:1.25rem;border-top:1px solid rgba(0,232,122,.12);font-size:.75rem;color:rgba(234,255,243,.4)}
.foot a{margin-right:1rem}
</style>
</head>
<body>
<div class="wrap">
  <a class="home" href="../">← ReGenesis Impact</a>
  <div class="eyebrow">${esc(g.market)} · Guide · Updated ${today}</div>
  <h1>${esc(g.title)}</h1>
  <p class="intro">${esc(g.intro)}</p>

  <h2>Key facts — verified &amp; sourced</h2>
  ${factsBlock(g.kbIds, g.slug)}

  <h2>Frequently asked questions</h2>
  ${g.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}

  <a class="cta" href="../#${g.toolHash}">${esc(g.toolLabel)} →</a>
  <p style="text-align:center;font-size:.78rem;color:rgba(234,255,243,.5)">No sign-up required · AI-assisted · SG / AU / IN frameworks built in</p>

  <div class="foot">
    <p>Educational guidance, not professional advice — verify against the cited primary sources.
    Facts above are drawn from the <a href="https://github.com/suranjan104-cell/ReGenesis-Impact/tree/main/knowledge">ReGenesis verified knowledge base</a>.</p>
    <p style="margin-top:.6rem">
      ${GUIDES.filter(x => x.slug !== g.slug).slice(0, 5).map(x => `<a href="${x.slug}.html">${esc(x.title.split('—')[0].trim())}</a>`).join('\n      ')}
    </p>
  </div>
</div>
</body>
</html>
`;
}

mkdirSync(join(root, 'guides'), { recursive: true });
for (const g of GUIDES) {
  writeFileSync(join(root, 'guides', `${g.slug}.html`), page(g));
}

// Sitemap: homepage + every guide + every hand-authored research page.
//
// RESEARCH is listed here rather than hand-edited into sitemap.xml, because
// sitemap.xml is regenerated by this script and kb-validate.yml fails the
// build when the committed file differs from the generated one. A hand-added
// entry survives until the next regeneration and then reads as drift — which
// is exactly what broke that workflow. Add research pages here.
const RESEARCH = [
  { path: 'research/', priority: '0.9' },
  { path: 'research/financed-emissions.html', priority: '0.9' },
  { path: 'research/emission-factor-register.html', priority: '0.9' },
  { path: 'demo/how-it-works.html', priority: '0.8' },
];
const urls = [
  `  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ...GUIDES.map(g =>
    `  <url><loc>${SITE}/guides/${g.slug}.html</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`),
  ...RESEARCH.map(r =>
    `  <url><loc>${SITE}/${r.path}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${r.priority}</priority></url>`),
];
writeFileSync(join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

console.log(`✓ ${GUIDES.length} guides + sitemap.xml written`);
