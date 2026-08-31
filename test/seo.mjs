/* SEO and AI-discoverability invariants.
   Run:  node test/seo.mjs

   These are the things that break silently: a page drops out of the sitemap, a
   canonical points at the wrong URL, structured data stops parsing, an OG image
   goes missing, or a crawler directive quietly starts excluding the AI agents
   the site deliberately allows. None of it shows up in a browser.

   It checks facts about files, not rankings. Nothing here can tell you whether
   the site ranks — only whether the things that make ranking possible are
   present and consistent. */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SITE = 'https://regenesisimpact.in';
const fail = [];
const read = p => readFileSync(join(ROOT, p), 'utf8');

// ── every indexable page, and what it must carry ──────────────────────
const PAGES = [
  'index.html', 'esrs/index.html', 'research/index.html',
  'research/financed-emissions.html', 'research/emission-factor-register.html',
  ...readdirSync(join(ROOT, 'guides')).filter(f => f.endsWith('.html')).map(f => `guides/${f}`),
];

for (const p of PAGES) {
  if (!existsSync(join(ROOT, p))) { fail.push(`${p}: missing`); continue; }
  const h = read(p);
  const has = (re, what) => { if (!re.test(h)) fail.push(`${p}: no ${what}`); };

  has(/<title>[^<]{15,140}<\/title>/, 'usable <title> (15–140 chars)');
  has(/<meta name="description" content="[^"]{60,320}"/, 'meta description (60–320 chars)');
  has(/<link rel="canonical" href="https:\/\/regenesisimpact\.in\/[^"]*"/, 'canonical');
  has(/<meta property="og:title"/, 'og:title');
  has(/<meta property="og:description"/, 'og:description');
  has(/<meta property="og:image"/, 'og:image');
  has(/<h1[^>]*>/, 'h1');

  // A canonical pointing at the wrong page de-indexes it, and copy-pasting a
  // template is exactly how that happens.
  const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon) {
    const expect = p === 'index.html' ? `${SITE}/`
                 : p.endsWith('/index.html') ? `${SITE}/${p.replace(/index\.html$/, '')}`
                 : `${SITE}/${p}`;
    if (canon !== expect) fail.push(`${p}: canonical is ${canon}, should be ${expect}`);
  }

  /* Exactly one h1 per page — except index.html, which is a single-file app
     holding thirteen routes, each with its own h1 and only one ever visible.
     There the meaningful assertion is that the homepage route has exactly one. */
  if (p === 'index.html') {
    const home = h.slice(h.indexOf('id="page-home"'), h.indexOf('<div class="page" id="page-issb"'));
    const n = (home.match(/<h1[\s>]/g) || []).length;
    if (n !== 1) fail.push(`${p}: the home route has ${n} h1 elements, expected 1`);
  } else {
    const h1s = (h.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) fail.push(`${p}: ${h1s} h1 elements, expected 1`);
  }

  // Structured data must parse. A broken block is silently ignored by every
  // search engine, so it fails as "no rich result" rather than as an error.
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(m[1]);
      if (!d['@context'] || !d['@type']) fail.push(`${p}: structured data missing @context or @type`);
    } catch (e) { fail.push(`${p}: structured data does not parse — ${e.message}`); }
  }
}

// ── sitemap covers every indexable page, and nothing that is gone ──────
const sitemap = read('sitemap.xml');
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const p of PAGES) {
  const url = p === 'index.html' ? `${SITE}/`
            : p.endsWith('/index.html') ? `${SITE}/${p.replace(/index\.html$/, '')}`
            : `${SITE}/${p}`;
  if (!listed.includes(url)) fail.push(`sitemap: ${url} is published but not listed`);
}
for (const url of listed) {
  const rel = url.replace(`${SITE}/`, '');
  const file = rel === '' ? 'index.html' : (rel.endsWith('/') ? `${rel}index.html` : rel);
  if (!existsSync(join(ROOT, file))) fail.push(`sitemap: ${url} is listed but ${file} does not exist`);
}
if (new Set(listed).size !== listed.length) fail.push('sitemap: duplicate <loc> entries');

// ── crawler directives ────────────────────────────────────────────────
const robots = read('robots.txt');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail.push('robots.txt: no sitemap reference');
if (/^\s*Disallow:\s*\/\s*$/m.test(robots)) fail.push('robots.txt: a blanket Disallow: / is present');
/* The AI agents are allowed on purpose. If one of these disappears it is far
   more likely to be an accident than a decision, so the list is asserted. */
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot',
                   'Google-Extended', 'Applebot-Extended', 'CCBot'])
  if (!new RegExp(`User-agent:\\s*${bot}\\b`, 'i').test(robots))
    fail.push(`robots.txt: ${bot} is no longer explicitly allowed`);

// ── llms.txt, the AI-facing summary ───────────────────────────────────
const llms = read('llms.txt');
if (!/^# /m.test(llms)) fail.push('llms.txt: no H1 title');
if (!/^> /m.test(llms)) fail.push('llms.txt: no blockquote summary');
/* The caveats are the point. An AI answer that quotes our thresholds without
   the confidence grade is worse than one that does not quote us at all. */
for (const must of ['medium confidence', 'no establishable source'])
  if (!llms.includes(must)) fail.push(`llms.txt: no longer states "${must}"`);
for (const u of [...llms.matchAll(/https:\/\/regenesisimpact\.in\/(\S*?)\)/g)].map(m => m[1])) {
  const file = u === '' ? 'index.html' : (u.endsWith('/') ? `${u}index.html` : u);
  if (!existsSync(join(ROOT, file))) fail.push(`llms.txt: links to /${u}, which does not exist`);
}

// ── the assets the social cards need ──────────────────────────────────
for (const f of ['og-image.png', 'favicon-32.png', 'sitemap.xml', 'robots.txt', 'llms.txt'])
  if (!existsSync(join(ROOT, f))) fail.push(`${f}: missing`);

if (fail.length) {
  console.error(`✗ SEO checks — ${fail.length} problem${fail.length === 1 ? '' : 's'}:\n`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ SEO — ${PAGES.length} pages carry title, description, canonical, OG and valid structured data; sitemap matches; ${7} AI crawlers allowed; llms.txt states its caveats`);
