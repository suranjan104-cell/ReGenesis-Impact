/* Builds the LinkedIn carousel — carousel/esrs.html, rendered to PDF.
   Run:  node carousel/build.mjs
         chromium --headless=new --no-pdf-header-footer \
           --print-to-pdf=carousel/ReGenesis-Impact-European-Stack.pdf \
           file://$PWD/carousel/esrs.html

   LinkedIn document posts render page 1 as the card and swipe the rest, so
   every page is 1080×1350 (4:5) — the tallest aspect the feed shows without
   cropping — and every page has to stand alone, because a reader who stops on
   page 4 sees only page 4.

   The numbers are read from the compiled knowledge files at build time rather
   than typed here, for the same reason the homepage analytics are: a carousel
   that says 64 sourced entries after the corpus passed seventy is a slide
   nobody remembers to update. */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const j = f => JSON.parse(readFileSync(join(root, 'knowledge', f), 'utf8'));
const esrs = j('esrs.json'), fx = j('factors.json'), std = j('standards.json'), mkt = j('markets.json');

const drNamed = esrs.standards.filter(s => Array.isArray(s.drs)).reduce((n, s) => n + s.drs.length, 0);
const drCounted = esrs.standards.filter(s => s.dr_count && !s.drs).reduce((n, s) => n + s.dr_count, 0);
const unsourced = fx.factors.filter(f => f.source.publisher === 'Not established').length;
const cohorts = mkt.markets.reduce((n, m) => n + m.cohorts.length, 0) + esrs.scope.waves.length;
const gpReq = std.ghgProtocol.requirements.filter(r => r.severity === 'required').length;
const T = esrs.scope.thresholds.eu_company;
const num = n => n.toLocaleString('en-GB');
const TX = esrs.taxonomy.simplification;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Each slide is one claim. `kicker` is the running label, `title` the claim,
   `body` the evidence, `foot` the persistent footer. */
const SLIDES = [
  { kind: 'cover',
    kicker: 'ESRS · CSRD · EU TAXONOMY',
    title: 'The European stack,<br><em>end to end</em>',
    body: 'CSRD scoping, double materiality, ' + (drNamed + drCounted) +
          ' disclosure requirements and the EU Taxonomy Article 8 KPIs — free, in a browser tab, with nothing uploaded.' },

  { kicker: '01 · SCOPE',
    title: 'The Omnibus made this<br>an <em>AND</em>, not an either/or.',
    body: 'An EU company is caught only above <b>' + num(T.employees_over) + ' employees</b> ' +
          '<em>and</em> <b>€' + T.net_turnover_over_eur_m + 'mn net turnover</b>. ' +
          'Both tests. A large number of companies that were in scope no longer are — and some ' +
          'that assume they are out are caught by the non-EU group test on EU-generated turnover.',
    stat: ['>' + num(T.employees_over), 'EMPLOYEES', '€' + T.net_turnover_over_eur_m + 'mn', 'NET TURNOVER'] },

  { kicker: '02 · MATERIALITY',
    title: 'Double materiality is<br><em>the whole difference.</em>',
    body: 'A topic counts if it is material to the world <em>or</em> material to the company. ' +
          'IFRS S2 asks only the second. So an ISSB materiality assessment, however good, is ' +
          'never sufficient evidence for omitting an ESRS topical standard — and every omission ' +
          'needs a stated reason.' },

  { kicker: '03 · DISCLOSURES',
    title: drNamed + ' requirements,<br><em>named and tickable.</em>',
    body: 'Enumerated across ten of the twelve standards and filtered by your own materiality ' +
          'assessment, so you see what you file rather than the whole of Set 1. ' +
          'ESRS S1 is the exception: its count of ' + drCounted + ' is sourced, the individual ' +
          'names are not, and we say so rather than invent them.',
    stat: [String(drNamed), 'NAMED', String(drCounted), 'COUNTED, NOT NAMED'] },

  { kicker: '04 · EU TAXONOMY',
    title: 'Article 8, through<br><em>all four gates.</em>',
    body: 'Turnover, CapEx and OpEx — each a ratio over its own denominator, not over the sum of ' +
          'the activities you listed. Alignment needs eligibility, substantial contribution, do no ' +
          'significant harm, and entity-level minimum safeguards. Fail the safeguards and alignment ' +
          'is zero across all three, whatever the screening criteria say.',
    stat: ['3', 'KPIs', TX.materiality_threshold_percent + '%', 'MATERIALITY FLOOR, PER KPI'] },

  { kicker: '05 · DIGITAL TAGGING',
    title: 'The tagging deadline<br><em>you were quoted is gone.</em>',
    body: 'Mandatory XBRL tagging of the sustainability statement is <b>suspended</b> by ' +
          'Directive (EU) 2026/470, in force 18 March 2026, until the ESEF Delegated Regulation is ' +
          'amended to cover it — which needs ESMA technical standards nobody has drafted. ' +
          'Any vendor quoting a resumption date is guessing.' },

  { kicker: '06 · FOUR REGIMES',
    title: cohorts + ' reporting cohorts,<br><em>one timeline.</em>',
    body: 'Europe, Australia, Singapore and the ISSB baseline, each with its own commencement ' +
          'date. Two worth knowing: the revised ESRS were adopted 3 July 2026 and apply from ' +
          'FY2027, and Singapore’s large non-listed obligation moved to FY2030 — sources still ' +
          'saying FY2027 are out of date.' },

  { kicker: '07 · THE NUMBERS',
    title: 'Every figure opens to<br><em>the factor behind it.</em>',
    body: 'All ' + fx.factors.length + ' emission factors are published with source, vintage and ' +
          'confidence — including the <b>' + unsourced + ' we cannot source</b>, which warn you at ' +
          'the point of entry and are named in the assurance pack. The inventory is checked against ' +
          gpReq + ' required GHG Protocol conditions and presented again under the six ISO 14064-1 ' +
          'categories, reconciled to the scope view.',
    stat: [String(fx.factors.length), 'FACTORS PUBLISHED', String(unsourced), 'ADMITTED UNSOURCED'] },

  { kicker: '08 · WHAT IT IS NOT',
    title: 'The limits are<br><em>printed in the product.</em>',
    body: 'It is a self-assessment, not a certification, and not assurance. It does not carry the ' +
          'Taxonomy screening criteria per activity — you assert each gate and it records the ' +
          'assertion. It does not tag XBRL. The regulatory data is graded <b>medium</b> confidence ' +
          'because the primary sources are unreachable from our build. All of that sits beside the ' +
          'comparison against Workiva and Position Green, rather than being left for you to find.' },

  { kind: 'end',
    kicker: 'FREE · NO SIGN-UP · NOTHING UPLOADED',
    title: 'Open it and see<br><em>your own numbers move.</em>',
    body: 'regenesisimpact.in/esrs' },
];

const page = (s, i) => `
<section class="p ${s.kind || ''}">
  <div class="edge"></div>
  <div class="inner">
    <div class="kicker">${esc(s.kicker)}</div>
    <h2>${s.title}</h2>
    <p>${s.body}</p>
    ${s.stat ? `<div class="stats">
      <div><b>${esc(s.stat[0])}</b><span>${esc(s.stat[1])}</span></div>
      <div><b>${esc(s.stat[2])}</b><span>${esc(s.stat[3])}</span></div>
    </div>` : ''}
  </div>
  <div class="foot">
    <span>ReGenesis Impact</span>
    <span>${s.kind === 'cover' || s.kind === 'end' ? 'regenesisimpact.in/esrs' : String(i).padStart(2, '0') + ' / ' + String(SLIDES.length - 1).padStart(2, '0')}</span>
  </div>
</section>`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>ReGenesis Impact — the European stack</title>
<style>
/* Fonts are embedded from board/fonts rather than fetched. The build
   environment cannot reach fonts.googleapis.com, so a remote link silently
   renders the whole carousel in a fallback face — which looks fine on screen
   and wrong the moment it is posted. */
@font-face{font-family:'Playfair Display';font-weight:700;src:url('../board/fonts/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf') format('truetype')}
@font-face{font-family:'Playfair Display';font-weight:900;src:url('../board/fonts/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKfsukDQ.ttf') format('truetype')}
@font-face{font-family:'DM Sans';font-weight:400;src:url('../board/fonts/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf') format('truetype')}
@font-face{font-family:'DM Sans';font-weight:700;src:url('../board/fonts/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf') format('truetype')}
@font-face{font-family:'DM Mono';font-weight:400;src:url('../board/fonts/aFTU7PB1QTsUX8KYhh0.ttf') format('truetype')}
@font-face{font-family:'DM Mono';font-weight:500;src:url('../board/fonts/aFTR7PB1QTsUX8KYvumzIYQ.ttf') format('truetype')}
@page{size:1080px 1350px;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#04120F}
.p{width:1080px;height:1350px;position:relative;overflow:hidden;
  background:#04120F;color:#E4F2EC;font-family:'DM Sans',sans-serif;
  page-break-after:always;display:flex;flex-direction:column;justify-content:center}
.p::before{content:'';position:absolute;inset:-20%;
  background:
    radial-gradient(58% 44% at 12% 6%,  rgba(22,173,110,.34) 0%, transparent 68%),
    radial-gradient(64% 48% at 88% 14%, rgba(18,165,165,.40) 0%, transparent 70%),
    radial-gradient(70% 52% at 50% 78%, rgba(46,143,107,.24) 0%, transparent 72%);
  filter:blur(60px)}
.p::after{content:'';position:absolute;inset:0;opacity:.5;
  background-image:linear-gradient(rgba(228,242,236,.05) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(228,242,236,.05) 1px,transparent 1px);
  background-size:72px 72px;
  -webkit-mask-image:radial-gradient(120% 90% at 50% 0%,#000 0%,transparent 78%)}
.edge{position:absolute;top:0;left:0;width:96px;height:6px;background:#3BE38A;z-index:2}
.inner{position:relative;z-index:2;padding:0 88px;flex:1;display:flex;
  flex-direction:column;justify-content:center}
.foot{position:relative;z-index:2;padding:0 88px 76px;flex:none;display:flex;justify-content:space-between;
  font-family:'DM Mono',monospace;font-size:19px;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(228,242,236,.55)}
.kicker{font-family:'DM Mono',monospace;font-size:21px;letter-spacing:.24em;text-transform:uppercase;
  color:#3BE38A;margin-bottom:40px}
h2{font-family:'Playfair Display',serif;font-weight:900;font-size:82px;line-height:1.03;
  letter-spacing:-.02em;margin-bottom:44px}
h2 em{font-style:italic;color:#3BE38A}
p{font-size:32px;line-height:1.52;color:rgba(228,242,236,.80);max-width:860px}
p b{color:#E4F2EC;font-weight:700}
p em{font-style:italic;color:#7BEDB6}
.stats{display:flex;gap:28px;margin-top:60px}
.stats div{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.11);
  border-radius:18px;padding:36px 32px}
.stats b{display:block;font-family:'Playfair Display',serif;font-size:76px;line-height:1;color:#E4F2EC}
.stats span{display:block;font-family:'DM Mono',monospace;font-size:18px;letter-spacing:.15em;
  color:rgba(228,242,236,.55);margin-top:16px}
.p.cover h2{font-size:104px}
.p.cover p{font-size:36px;color:rgba(228,242,236,.86)}
.p.end h2{font-size:92px}
.p.end p{font-family:'DM Mono',monospace;font-size:38px;color:#3BE38A;letter-spacing:.02em}
</style></head><body>
${SLIDES.map(page).join('\n')}
</body></html>`;

writeFileSync(join(root, 'carousel', 'esrs.html'), html);
console.log(`✓ carousel/esrs.html written — ${SLIDES.length} slides at 1080×1350`);
console.log(`  figures read from knowledge/: ${drNamed} named DRs, ${drCounted} counted, ` +
            `${fx.factors.length} factors (${unsourced} unsourced), ${cohorts} cohorts, ` +
            `${gpReq} required GHG Protocol conditions`);
