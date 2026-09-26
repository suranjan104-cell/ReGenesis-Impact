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
<script>try{var t=localStorage.getItem('rg_ws_theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
<meta name="theme-color" content="#F4F3EF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1013" media="(prefers-color-scheme: dark)">
<link rel="preload" href="../fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../fonts/geist.css">
<link rel="stylesheet" href="../styles/site.css">
<style>
/* The guide's own layout; every colour and face comes from styles/site.css,
   the same values as the workspace and the instruments. */
.wrap{max-width:760px;margin:0 auto;padding:0 1.25rem 4rem}
h1{font-size:clamp(1.9rem,4.4vw,2.6rem);margin:.5rem 0 1rem}
.intro{color:var(--ink-2);font-size:1.06rem;margin:0 0 2rem}
h2{font-size:1.3rem;margin:2.6rem 0 1rem}
.fact{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-3);padding:1.1rem 1.25rem;margin-bottom:1rem}
.fact h3{font-size:.98rem;margin:0 0 .5rem}
.fact ul{padding-left:1.1rem;margin:0;color:var(--ink-2);font-size:.93rem}
.fact li{margin-bottom:.35rem}
.src{font-size:.75rem;color:var(--ink-3);margin-top:.6rem}
details{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-3);padding:.85rem 1.1rem;margin-bottom:.7rem}
summary{cursor:pointer;font-weight:600;font-size:.95rem}
details p{margin:.6rem 0 0;color:var(--ink-2);font-size:.93rem}
.next{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:2.6rem 0 .8rem}
.next a{display:flex;flex-direction:column;gap:4px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-3);
  background:var(--surface);text-decoration:none}
.next a:hover{border-color:var(--ink)}
.next a.ink{background:var(--ink);color:var(--invert-ink);border-color:var(--ink)}
.next b{font-weight:600}
.next span{font-size:.82rem;color:var(--ink-2)}
.next a.ink span{color:inherit;opacity:.78}
.aside{font-size:.8rem;color:var(--ink-3);margin:0}
.foot{margin-top:3rem;padding-top:1.25rem;border-top:1px solid var(--line);font-size:.8rem;color:var(--ink-3)}
.foot a{margin-right:1rem;color:var(--ink-2)}
@media(max-width:560px){.next{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <header class="site-top">
    <a class="brand" href="../">ReGenesis Impact</a><span class="sep">/</span><span class="where">Guides</span>
    <span class="go"><a class="btn ink" href="../app/">What do I owe? →</a></span>
  </header>
  <div class="eyebrow">${esc(g.market)} · Guide · Updated ${today}</div>
  <h1>${esc(g.title)}</h1>
  <p class="intro">${esc(g.intro)}</p>

  <h2>Key facts — verified &amp; sourced</h2>
  ${factsBlock(g.kbIds, g.slug)}

  <h2>Frequently asked questions</h2>
  ${g.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n  ')}

  <nav class="next" aria-label="Next steps">
    <a class="ink" href="../app/"><b>Which rules apply to you, and when</b><span>Describe your entity once — every regime decides itself, with sources.</span></a>
    <a href="../#${g.toolHash}"><b>${esc(g.toolLabel)} →</b><span>The instrument this guide is about.</span></a>
  </nav>
  <p class="aside">No sign-up · runs in your browser · EU, Australian and Singapore frameworks built in</p>

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
  // The product landing page. Highest priority after the homepage: it is the
  // page shared externally, and the one that carries the SoftwareApplication
  // and FAQPage schema.
  { path: 'esrs/', priority: '0.95' },
  // The workspace: one entity in, every regime's verdict and date out. Its
  // index.html carries a static, crawlable version of the landing inside the
  // React root, so crawlers that do not run JavaScript still read it.
  { path: 'app/', priority: '0.95' },
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
