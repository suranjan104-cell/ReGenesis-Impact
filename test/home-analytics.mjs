/* The homepage analytics section, driven in a real browser.
   Run:  node test/home-analytics.mjs

   This exists because the section shipped once rendering nothing at all. It
   was wired to the page's DOMContentLoaded handler, which is registered in an
   earlier script block than the one defining anLoad — so the call ran while
   anLoad was still undefined, threw nothing, logged nothing, and left an empty
   section on the homepage. Every gate was green.

   So the assertion is not "the function exists" but "the section has content
   in it, and the content matches the data files". Anything less would have
   passed that bug.

   It also holds the positioning: the homepage leads with Europe, does not
   market India, and names no real company in its demo data. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';

const CHROME = (() => {
  const c = [process.env.CHROME, process.env.PUPPETEER_EXECUTABLE_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'].filter(Boolean);
  for (const p of c) if (existsSync(p)) return p;
  for (const dir of ['/home/runner/.cache/puppeteer', `${process.env.HOME || ''}/.cache/puppeteer`]) {
    try {
      for (const rev of readdirSync(dir)) for (const sub of readdirSync(`${dir}/${rev}`)) {
        for (const exe of [`${dir}/${rev}/${sub}/chrome-linux64/chrome`, `${dir}/${rev}/${sub}/chrome-linux/chrome`])
          if (existsSync(exe)) return exe;
      }
    } catch { /* absent */ }
  }
  throw new Error('no Chromium found — set CHROME, or npm install puppeteer');
})();

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const read = f => JSON.parse(readFileSync(`${ROOT}/knowledge/${f}`, 'utf8'));
const DATA = { esrs: read('esrs.json'), factors: read('factors.json'),
               standards: read('standards.json'), kb: read('kb.json'), markets: read('markets.json') };

// What the page must end up showing, computed here from the same files.
const EXPECT = (() => {
  let named = 0, counted = 0, standards = 0;
  for (const s of DATA.esrs.standards) {
    if (!s.dr_count) continue;
    standards++;
    if (Array.isArray(s.drs)) named += s.drs.length; else counted += s.dr_count;
  }
  const cats = new Set(DATA.factors.factors.map(f => f.category));
  return {
    drTotal: named + counted, drStandards: standards,
    factors: DATA.factors.factors.length,
    unsourced: DATA.factors.factors.filter(f => f.source.publisher === 'Not established').length,
    fxCategories: cats.size,
    gpConditions: DATA.standards.ghgProtocol.requirements.length,
    isoCategories: DATA.standards.iso.part1.categories.length,
    kb: DATA.kb.count,
    // Every cohort in markets.json plus Europe's waves, which live in the ESRS
    // scope file so the CSRD thresholds keep one home.
    cohorts: DATA.markets.markets.reduce((n, m) => n + m.cohorts.length, 0) + DATA.esrs.scope.waves.length,
  };
})();

// file:// cannot fetch relative JSON, so the four files are served from memory
// through the same fetch call the page makes.
const stub = `<script>(function(){
  var M = ${JSON.stringify({
    'knowledge/esrs.json': DATA.esrs, 'knowledge/factors.json': DATA.factors,
    'knowledge/standards.json': DATA.standards, 'knowledge/kb.json': DATA.kb,
    'knowledge/markets.json': DATA.markets })};
  var of = window.fetch;
  window.fetch = function(u){ var k = String(u);
    if (M[k]) return Promise.resolve({ json: function(){ return Promise.resolve(M[k]); } });
    return of.apply(this, arguments); };
})();</script>`;

const probe = `<script>
(function(){
  function report(p){ document.body.setAttribute('data-home', btoa(unescape(encodeURIComponent(JSON.stringify(p))))); }
  var w = 0;
  (function ready(){
    // Wait for actual content, not for a function to exist.
    if (document.querySelectorAll('#an-kpis .an-kpi').length) return run();
    if ((w += 100) > 15000) return report({ error: 'the analytics section never rendered any content' });
    setTimeout(ready, 100);
  })();
  function run(){
    try {
      var q = function(s){ return document.querySelectorAll(s); };
      var txt = function(id){ var e = document.getElementById(id); return e ? e.textContent : ''; };
      var kpis = {};
      Array.prototype.forEach.call(q('#an-kpis .an-kpi'), function(t){
        kpis[t.querySelector('.k').textContent] = Number(t.querySelector('b').textContent);
      });
      // Stacked bars must fill their track exactly.
      var badBars = [];
      Array.prototype.forEach.call(q('.an-bar'), function(b){
        var s = 0;
        Array.prototype.forEach.call(b.children, function(i){ s += parseFloat(i.style.width) || 0; });
        if (Math.abs(s - 100) > 0.5) badBars.push(s.toFixed(2));
      });
      window.anToggle('an-dr-alt', null); window.anToggle('an-fx-alt', null);
      window.anToggle('an-phase-alt', null);
      /* Contrast audit. The redesign flipped the homepage to a dark ground by
         swapping two colour tokens, which is exactly the change that leaves
         individual dark-on-dark survivors behind — four of them, on the first
         pass. Every element with its own text is measured against the nearest
         opaque background it sits on, at the WCAG AA threshold for its size.
         Elements painted by a gradient are skipped: backgroundColor cannot see
         a gradient, so measuring them yields false failures. */
      function lum(c){
        var m = c.match(/[\\d.]+/g); if(!m) return null;
        if (m.length > 3 && parseFloat(m[3]) === 0) return null;
        var v = [0,1,2].map(function(i){ var x=parseInt(m[i],10)/255;
          return x<=0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4); });
        return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
      }
      /* Composite the stack rather than hunting for the first opaque ancestor.
         This page is built from translucent glass over a dark ground, so the
         effective background of a label is the whole stack flattened — taking
         the first ancestor with any fill reports the glass alone and measures
         nothing real. */
      function parse(c){
        var m = c.match(/[\\d.]+/g);
        if (!m) return null;
        return { r:+m[0], g:+m[1], b:+m[2], a: m.length > 3 ? parseFloat(m[3]) : 1 };
      }
      function bgOf(el){
        var stack = [], n = el;
        while (n) { stack.push(getComputedStyle(n).backgroundColor); n = n.parentElement; }
        // Start from the root and paint each layer over the last.
        var out = { r:255, g:255, b:255, a:1 };
        for (var i = stack.length - 1; i >= 0; i--) {
          var c = parse(stack[i]);
          if (!c || !c.a) continue;
          out = { r: c.r*c.a + out.r*(1-c.a),
                  g: c.g*c.a + out.g*(1-c.a),
                  b: c.b*c.a + out.b*(1-c.a), a:1 };
        }
        return 'rgb(' + Math.round(out.r) + ', ' + Math.round(out.g) + ', ' + Math.round(out.b) + ')';
      }
      var contrast = [], seenC = {};
      Array.prototype.forEach.call(
        document.querySelectorAll('#page-home h1,#page-home h2,#page-home h3,#page-home p,#page-home li,#page-home span,#page-home button,#page-home a,#page-home b,#page-home td,#page-home th,#page-home strong,#page-home div'),
        function(el){
          if (!el.offsetParent) return;
          if (!Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType===3 && n.textContent.trim(); })) return;
          var cs = getComputedStyle(el);
          if (cs.visibility==='hidden' || parseFloat(cs.opacity) < 0.3) return;
          if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') return;
          if (cs.backgroundImage && cs.backgroundImage.indexOf('gradient') >= 0) return;
          var bg = bgOf(el), fg = parse(cs.color), bgc = parse(bg);
          if (!fg || !bgc || !fg.a) return;
          // Translucent text is likewise composited over what it sits on.
          var flat = 'rgb(' + Math.round(fg.r*fg.a + bgc.r*(1-fg.a)) + ', ' +
                              Math.round(fg.g*fg.a + bgc.g*(1-fg.a)) + ', ' +
                              Math.round(fg.b*fg.a + bgc.b*(1-fg.a)) + ')';
          var f = lum(flat), b = lum(bg);
          if (f === null || b === null) return;
          var r = (Math.max(f,b)+0.05)/(Math.min(f,b)+0.05);
          var size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight,10) >= 700;
          var need = (size >= 24 || (size >= 18.66 && bold)) ? 3.0 : 4.5;
          if (r >= need) return;
          var key = el.className + '|' + cs.color + '|' + bg;
          if (seenC[key]) return; seenC[key] = 1;
          contrast.push(r.toFixed(2) + ':1 (needs ' + need + ') — ' + cs.color + ' on ' + bg +
                        ' — "' + (el.textContent||'').trim().slice(0,32) + '"');
        });

      var home = document.getElementById('page-home').textContent;
      report({
        kpis: kpis,
        drRows: q('#an-dr .an-row').length,
        fxRows: q('#an-fx .an-row').length,
        drAltRows: q('#an-dr-alt tbody tr').length,
        fxAltRows: q('#an-fx-alt tbody tr').length,
        mxRows: q('#an-mx tbody tr').length,
        mxCols: q('#an-mx thead th').length,
        phaseRows: q('#an-phase .an-prow').length,
        phaseAltRows: q('#an-phase-alt tbody tr').length,
        phaseTicks: q('#an-axis span').length || q('.an-axis span').length,
        phaseLegend: txt('an-phase-legend').length > 0,
        contrast: contrast.slice(0, 12),
        legends: (txt('an-dr-legend').length > 0) && (txt('an-fx-legend').length > 0),
        footMentionsConfidence: txt('an-foot').indexOf('medium') >= 0,
        badBars: badBars,
        // Slugs must not reach the reader.
        rawSlug: /scope\\d_/.test(txt('an-fx')),
        homeIndia: /India|BRSR|SEBI/.test(home),
        homeEurope: /ESRS/.test(home) && /CSRD/.test(home)
      });
    } catch (e) { report({ error: String(e && e.stack || e) }); }
  }
})();
</script>`;

const html = readFileSync(`${ROOT}/index.html`, 'utf8');
mkdirSync(`${ROOT}/test/.tmp`, { recursive: true });
const file = `${ROOT}/test/.tmp/home.html`;
const withStub = html.replace('</head>', stub + '</head>');
const anchor = withStub.lastIndexOf('</body>');
writeFileSync(file, withStub.slice(0, anchor) + probe + withStub.slice(anchor));

let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=60000', '--dump-dom', `file://${file}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });
} finally {
  rmSync(`${ROOT}/test/.tmp`, { recursive: true, force: true });
}

const m = dom.match(/data-home="([A-Za-z0-9+/=]+)"/);
if (!m) throw new Error('homepage probe did not report — the page may not have loaded');
const out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
if (out.error) { console.error(`✗ ${out.error}`); process.exit(1); }

const fail = [];
const eq = (got, want, what) => { if (got !== want) fail.push(`${what}: page shows ${got}, data says ${want}`); };

eq(out.kpis['ESRS disclosure requirements'], EXPECT.drTotal, 'DR total');
eq(out.kpis['Emission factors published'], EXPECT.factors, 'factor count');
eq(out.kpis['GHG Protocol conditions checked'], EXPECT.gpConditions, 'GHG Protocol conditions');
eq(out.kpis['ISO 14064-1 categories'], EXPECT.isoCategories, 'ISO categories');
eq(out.kpis['Sourced knowledge entries'], EXPECT.kb, 'knowledge base entries');
eq(out.kpis['Reporting cohorts tracked'], EXPECT.cohorts, 'reporting cohorts');
eq(out.phaseRows, EXPECT.cohorts, 'phasing chart rows');
eq(out.phaseAltRows, EXPECT.cohorts, 'phasing table rows');
eq(out.drRows, EXPECT.drStandards, 'DR chart rows');
eq(out.drAltRows, EXPECT.drStandards, 'DR table rows');
eq(out.fxRows, EXPECT.fxCategories, 'factor chart rows');
eq(out.fxAltRows, EXPECT.fxCategories, 'factor table rows');
if (out.mxRows < 5) fail.push(`regime matrix has only ${out.mxRows} rows`);
// Dimension column plus one per market: Europe, Australia, Singapore, ISSB.
if (out.mxCols !== 5) fail.push(`regime matrix has ${out.mxCols} columns, expected 5`);
if (!out.phaseLegend) fail.push('the phasing chart is missing its legend');
for (const c of out.contrast || []) fail.push(`text fails contrast — ${c}`);
if (out.phaseTicks < 2) fail.push(`phasing axis has ${out.phaseTicks} year ticks`);
if (!out.legends) fail.push('a chart is missing its legend — colour would be carrying identity alone');
if (!out.footMentionsConfidence) fail.push('the analytics footnote no longer states the confidence grade');
if (out.badBars.length) fail.push(`${out.badBars.length} stacked bar(s) do not sum to 100%: ${out.badBars.join(', ')}`);
if (out.rawSlug) fail.push('raw category slugs (scope3_cat15) are reaching the reader');
if (out.homeIndia) fail.push('the homepage still markets India');
for (const f of readdirSync(`${ROOT}/guides`))
  if (/india|brsr/i.test(f)) fail.push(`an India guide is back: guides/${f}`);
if (!out.homeEurope) fail.push('the homepage no longer leads with ESRS/CSRD');
/* Checked against the source rather than the rendered page: document.body
   .textContent includes the text of inline scripts, so a probe that greps the
   body matches its own pattern and always "finds" a name. */
/* The "Deep guides" stat is typed into the page, so it drifts the moment a
   guide is added or removed — it said 13 while eleven were published. */
/* The instrument count is claimed in three places — the section heading, the
   hero trust line and a counter — and was wrong in all three before the bento
   grid made nine cells visible where a list had hidden them. */
{
  const cells = (html.match(/class="ed-row"/g) || []).length;
  const counter = (html.match(/id="ed-stat-tools"[^>]*data-target="(\d+)"/) || [])[1];
  if (Number(counter) !== cells) fail.push(`instrument counter says ${counter}, ${cells} cells exist`);
  if (!html.includes(`${cells} INSTRUMENTS`)) fail.push(`hero trust line does not say ${cells} INSTRUMENTS`);
}

{
  const guides = (html.match(/id="ed-stat-guides"[^>]*data-target="(\d+)"/) || [])[1];
  const actual = readdirSync(`${ROOT}/guides`).filter(f => f.endsWith('.html')).length;
  if (Number(guides) !== actual)
    fail.push(`homepage claims ${guides} guides, ${actual} are published`);
}

for (const co of ['HSBC', 'Unilever', 'Reliance Industries', 'Standard Chartered',
                  'JPMorgan', 'Kohlberg', 'KKR', 'Axis Bank', 'European Investment Bank'])
  if (html.includes(co))
    fail.push(`demo data names ${co} — a fabricated assessment must not be attributed to a real company`);

if (fail.length) {
  console.error(`✗ homepage analytics — ${fail.length} problem${fail.length === 1 ? '' : 's'}:\n`);
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ homepage analytics — ${Object.keys(out.kpis).length} KPIs, ${out.drRows}+${out.fxRows}+${out.phaseRows} chart rows and ${out.mxRows}×${out.mxCols} matrix, all matching the data, no contrast failures`);
