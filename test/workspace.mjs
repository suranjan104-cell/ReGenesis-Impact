/* The workspace at /app/, driven in a real browser.  Run: node test/workspace.mjs
   (build it first: cd workspace-app && npm run build — the built app/ is what
   the site serves, so the built app/ is what this tests).

   One Chromium launch runs every scenario through a harness page. Each
   scenario loads the app into an iframe of an exact width — 390px means 390px
   here, which a headless window cannot do — with a theme and an evidence
   ledger seeded first, and a same-origin probe reports back what rendered.

   What rendered is compared against the engine run here, in Node, on the same
   worked examples and the same registers. The UI is never its own oracle.

   Per scenario: the headline states the right count and the right next
   obligation; one verdict card per region with the engine's verdict; one
   timeline mark and one list row per obligation, in date order; one
   evidence row per piece of evidence, with ledger status where seeded; every
   text element clears WCAG AA against its composited background; nothing
   overflows the viewport; no console errors. Once, the command palette opens
   on Ctrl+K, finds an emission factor by typing, and closes on Escape. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { serve } from './lib/serve.mjs';
import { assess } from '../workspace-app/src/engine/applicability.js';
import { EXAMPLES } from '../workspace-app/src/data/examples.js';

const run = promisify(execFile);
const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const CHROME = (() => {
  const c = [process.env.CHROME, process.env.PUPPETEER_EXECUTABLE_PATH, '/opt/pw-browsers/chromium',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser',
    '/usr/bin/chromium'].filter(Boolean);
  for (const p of c) if (existsSync(p)) return p;
  for (const dir of ['/home/runner/.cache/puppeteer', `${process.env.HOME || ''}/.cache/puppeteer`]) {
    try {
      for (const rev of readdirSync(dir)) for (const sub of readdirSync(`${dir}/${rev}`))
        for (const exe of [`${dir}/${rev}/${sub}/chrome-linux64/chrome`, `${dir}/${rev}/${sub}/chrome-linux/chrome`])
          if (existsSync(exe)) return exe;
    } catch { /* absent */ }
  }
  throw new Error('no Chromium found — set CHROME, or npm install puppeteer');
})();

if (!existsSync(`${ROOT}/app/index.html`))
  throw new Error('app/index.html is missing — build the workspace: cd workspace-app && npm run build');

/* The committed build must be the build of the committed source. Same hash as
   the stamp in workspace-app/vite.config.ts. */
{
  const APP = `${ROOT}/workspace-app`;
  const info = JSON.parse(readFileSync(`${ROOT}/app/build-info.json`, 'utf8'));
  const walk = p => statSync(p).isDirectory() ? readdirSync(p).sort().flatMap(f => walk(join(p, f))) : [p];
  const h = createHash('sha256');
  for (const f of info.inputs.flatMap(i => walk(join(APP, i)))) {
    h.update(relative(APP, f).split('\\').join('/') + '\0'); h.update(readFileSync(f)); h.update('\0');
  }
  if (h.digest('hex') !== info.source_sha256) {
    console.error('✗ workspace — app/ is stale: workspace-app/ has changed since it was built. '
      + 'Run: cd workspace-app && npm run build, and commit app/.');
    process.exit(1);
  }
}

const read = f => JSON.parse(readFileSync(`${ROOT}/knowledge/${f}`, 'utf8'));
const DATA = { scope: read('esrs/scope.json'), transition: read('esrs/transition.json'),
               au: read('markets/australia.json'), sg: read('markets/singapore.json') };
const TODAY = new Date().toISOString().slice(0, 10);
const WORD = ['No', 'One', 'Two', 'Three'];

/* ── scenarios ──────────────────────────────────────────────────────── */
const LEDGER = [
  { key: 'ghg-inventory', tool: 'GHG inventory', title: 'Scope 1–3 inventory', ts: new Date().toISOString(), gaps: [] },
  { key: 'assurance-readiness', tool: 'Assurance readiness', title: '8 of 10 ready',
    ts: new Date().toISOString(), gaps: [{ line: 'Base-year policy' }, { line: 'Sign-off' }] },
];
const SC = [];
for (const x of EXAMPLES) SC.push({ id: `${x.id}-light-1280`, example: x.id, theme: 'light', width: 1280 });
for (const x of ['three-market', 'eu-wave1']) {
  SC.push({ id: `${x}-dark-1280`, example: x, theme: 'dark', width: 1280, ledger: LEDGER });
  SC.push({ id: `${x}-light-390`, example: x, theme: 'light', width: 390 });
  SC.push({ id: `${x}-dark-390`, example: x, theme: 'dark', width: 390 });
}
SC.push({ id: 'empty-light-1280', example: null, theme: 'light', width: 1280 });
/* Every worked example comes out "Applies" in every region, so without these
   the verdicts that carry the most nuance — a threshold met exactly, a clear
   no, a missing input — would never be rendered by this gate at all. They
   seed the entity directly rather than through an example link. */
const BLANK = EXAMPLES[0].entity;
const ent = over => JSON.parse(JSON.stringify({ ...BLANK, name: 'Gate entity', ...over }));
SC.push({ id: 'none-apply-light-1280', theme: 'light', width: 1280, entity: ent({
  regions: { eu: true, au: true, sg: true },
  eu: { kind: 'eu-company', employees: 1000, turnoverEurM: 600, alreadyReporting: false },   // on the line
  au: { revenueAudM: 10, assetsAudM: 10, employees: 10, nger: 'none', assetOwnerAumAudBn: null }, // clear no
  sg: { listed: null, sti: false, revenueSgdM: null, assetsSgdM: null } }) });                 // needs input
SC.push({ id: 'mixed-dark-390', theme: 'dark', width: 390, entity: ent({
  regions: { eu: true, au: true, sg: true },
  eu: { kind: 'eu-company', employees: 1500, turnoverEurM: 900, alreadyReporting: false },   // wave 2
  au: { revenueAudM: 50, assetsAudM: 25, employees: 10, nger: 'none', assetOwnerAumAudBn: null }, // Group 3 lines, exactly
  sg: { listed: false, sti: false, revenueSgdM: 2000, assetsSgdM: 100 } }) });                // not both → no
SC[0].palette = true;

/* ── the probe, run inside the app ──────────────────────────────────── */
const PROBE = `(function(){
  var errs = [];
  addEventListener('error', function(e){ errs.push(String(e.message)); });
  addEventListener('unhandledrejection', function(e){ errs.push('unhandled: ' + (e.reason && e.reason.message || e.reason)); });
  var P = new URLSearchParams(location.search);
  function send(r){ r.errors = errs; parent.postMessage({ probe: P.get('probe'), result: r }, '*'); }
  var wanted = P.get('expectRegimes') | 0, waited = 0;
  (function wait(){
    var ready = document.querySelector('.answer h1') && document.querySelectorAll('.verdict').length >= wanted;
    if (ready && (!wanted || document.querySelector('.plan'))) return setTimeout(measure, 350);
    if ((waited += 100) > 9000) return send({ error: 'the workspace never rendered' });
    setTimeout(wait, 100);
  })();

  function parse(c){
    if (!c) return null;
    var m;
    if ((m = c.match(/^color\\(srgb ([\\d.]+) ([\\d.]+) ([\\d.]+)(?: \\/ ([\\d.]+))?\\)/)))
      return { r:m[1]*255, g:m[2]*255, b:m[3]*255, a: m[4] === undefined ? 1 : +m[4] };
    if ((m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/)))
      return { r:+m[1], g:+m[2], b:+m[3], a: m[4] === undefined ? 1 : +m[4] };
    return null;
  }
  function lum(o){ var v=[o.r,o.g,o.b].map(function(x){x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);});
    return .2126*v[0]+.7152*v[1]+.0722*v[2]; }
  function bgOf(el){
    var st = [], n = el;
    while (n && n.nodeType === 1) { st.push(getComputedStyle(n).backgroundColor); n = n.parentElement; }
    var o = { r:255, g:255, b:255 };
    for (var i = st.length - 1; i >= 0; i--) { var c = parse(st[i]); if (!c || !c.a) continue;
      o = { r:c.r*c.a+o.r*(1-c.a), g:c.g*c.a+o.g*(1-c.a), b:c.b*c.a+o.b*(1-c.a) }; }
    return o;
  }
  function contrast(){
    var bad = [], seen = {};
    document.querySelectorAll('.ws *').forEach(function(el){
      if (el.closest('svg') || !el.getClientRects().length) return;
      if (!Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); })) return;
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') return;
      var op = 1, n = el; while (n && n.nodeType === 1) { op *= +getComputedStyle(n).opacity; n = n.parentElement; }
      if (op < .3) return;
      var fg = parse(cs.color), bg = bgOf(el); if (!fg) return;
      var flat = { r:fg.r*fg.a+bg.r*(1-fg.a), g:fg.g*fg.a+bg.g*(1-fg.a), b:fg.b*fg.a+bg.b*(1-fg.a) };
      var a = lum(flat), b = lum(bg), r = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      var size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight,10) >= 700;
      var need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
      if (r >= need) return;
      var k = el.className + cs.color; if (seen[k]) return; seen[k] = 1;
      bad.push(r.toFixed(2) + ':1 (needs ' + need + ') "' + el.textContent.trim().slice(0, 40) + '" ' + cs.color);
    });
    return bad.slice(0, 8);
  }
  function overflow(){
    var vw = document.documentElement.clientWidth, worst = null;
    document.querySelectorAll('.ws *').forEach(function(el){
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var p = el.parentElement;
      while (p && p !== document.body) { if (getComputedStyle(p).overflowX !== 'visible') return; p = p.parentElement; }
      var over = Math.round(r.right - vw);
      if (over > 1 && (!worst || over > worst.over)) worst = { over: over, what: el.tagName.toLowerCase() + '.' + String(el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ')[0] };
    });
    return { vw: vw, worst: worst };
  }
  function setInput(el, v){
    var set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function measure(){
    var r = {
      h1: (document.querySelector('.answer h1') || {}).textContent || '',
      verdicts: Array.prototype.map.call(document.querySelectorAll('.verdict'), function(c){
        return { id: c.id, chip: (c.querySelector('.chip') || {}).textContent }; }),
      marks: document.querySelectorAll('.tl-mark').length,
      planEmpty: !!document.querySelector('.plan.empty'), proveEmpty: !!document.querySelector('.prove.empty'),
      rows: Array.prototype.map.call(document.querySelectorAll('.ob'), function(li){
        return { n: li.querySelector('.ob-n').textContent, title: li.querySelector('.ob-title').textContent }; }),
      evidence: Array.prototype.map.call(document.querySelectorAll('.mx tbody tr'), function(tr){
        return { label: tr.querySelector('th a').textContent, status: tr.querySelector('.mx-status').textContent }; }),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      contrast: contrast(), overflow: overflow()
    };
    if (P.get('palette') !== '1') return send(r);
    dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    setTimeout(function(){
      var input = document.querySelector('.pal input');
      r.paletteOpened = !!input;
      if (!input) return send(r);
      setInput(input, 'diesel');
      setTimeout(function(){
        r.paletteHits = Array.prototype.map.call(document.querySelectorAll('.pal-item .pal-label'), function(x){ return x.textContent; }).slice(0, 6);
        r.paletteGroups = Array.prototype.map.call(document.querySelectorAll('.pal-group'), function(x){ return x.textContent; });
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        setTimeout(function(){ r.paletteClosed = !document.querySelector('.pal'); send(r); }, 200);
      }, 250);
    }, 250);
  }
})();`;

/* ── the harness, run around the app ────────────────────────────────── */
const EXPECT_REGIMES = Object.fromEntries(EXAMPLES.map(x =>
  [x.id, Object.values(x.entity.regions).filter(Boolean).length]));
for (const s of SC) if (s.entity) EXPECT_REGIMES[s.id] = Object.values(s.entity.regions).filter(Boolean).length;
const HARNESS = `<!doctype html><meta charset="utf-8"><body><script src="/__harness.js"></script></body>`;
const HARNESS_JS = `(function(){
  var SC = ${JSON.stringify(SC)}, EXPECT = ${JSON.stringify(EXPECT_REGIMES)}, out = {}, i = 0, frame = null, timer = null;
  addEventListener('message', function(e){
    if (!e.data || !e.data.probe || !SC[i] || e.data.probe !== SC[i].id) return;
    clearTimeout(timer); out[SC[i].id] = e.data.result; i++; next();
  });
  function next(){
    if (frame) frame.remove();
    if (i >= SC.length) { document.body.setAttribute('data-result', btoa(unescape(encodeURIComponent(JSON.stringify(out))))); return; }
    var s = SC[i];
    localStorage.clear();
    localStorage.setItem('rg_ws_theme', s.theme);
    if (s.ledger) localStorage.setItem('rg_ledger_v1', JSON.stringify(s.ledger));
    if (s.entity) localStorage.setItem('rg_entity_v1', JSON.stringify(s.entity));
    frame = document.createElement('iframe');
    frame.style.cssText = 'border:0;width:' + s.width + 'px;height:900px';
    var q = '?probe=' + encodeURIComponent(s.id) + (s.example ? '&example=' + s.example : '')
      + ((s.example || s.entity) ? '&expectRegimes=' + EXPECT[s.example || s.id] : '') + (s.palette ? '&palette=1' : '');
    frame.src = '/app/' + q;
    document.body.appendChild(frame);
    timer = setTimeout(function(){ out[s.id] = { error: 'no report within 15s' }; i++; next(); }, 15000);
  }
  next();
})();`;

const srv = await serve(ROOT, {
  routes: { '/__harness.html': ['text/html', HARNESS], '/__harness.js': ['text/javascript', HARNESS_JS],
            '/__probe.js': ['text/javascript', PROBE] },
  // The probe is added to the app's own page, ahead of the app's module script,
  // so it sees errors the app throws while starting.
  rewrite: (path, html, url) => path === '/app/index.html' && url.searchParams.get('probe')
    ? html.replace('<head>', '<head><script src="/__probe.js"></script>') : html,
});
let dom;
try {
  ({ stdout: dom } = await run(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1400,1000',
    '--disable-component-update', '--disable-background-networking', '--no-first-run',
    '--virtual-time-budget=240000', '--dump-dom', `${srv.origin}/__harness.html`], { maxBuffer: 1 << 26 }));
} finally { await srv.close(); }

const m = dom.match(/data-result="([A-Za-z0-9+/=]+)"/);
if (!m) { console.error('✗ workspace — the harness never finished; no scenario reported'); process.exit(1); }
const OUT = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));

/* ── compare ────────────────────────────────────────────────────────── */
const fail = [];
const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
const when = o => o.date ? (() => { const [y, mo, d] = o.date.split('-').map(Number);
  return `${d} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mo - 1]} ${y}`; })() : `during ${o.year}`;

for (const s of SC) {
  const r = OUT[s.id], tag = s.id;
  if (!r) { fail.push(`${tag}: no report`); continue; }
  if (r.error) { fail.push(`${tag}: ${r.error}`); continue; }
  for (const e of r.errors || []) fail.push(`${tag}: console error — ${e}`);
  for (const c of r.contrast || []) fail.push(`${tag}: text fails contrast — ${c}`);
  if (r.overflow.worst) fail.push(`${tag}: scrolls sideways at ${r.overflow.vw}px — ${r.overflow.worst.what} overhangs by ${r.overflow.worst.over}px`);
  if (s.width === 390 && r.overflow.vw > 390) fail.push(`${tag}: the frame is ${r.overflow.vw}px wide, not a phone`);
  const [cr, cg, cb] = (r.bodyBg.match(/[\d.]+/g) || []).map(Number);
  const dark = (0.2126 * cr + 0.7152 * cg + 0.0722 * cb) < 128;
  if ((s.theme === 'dark') !== dark) fail.push(`${tag}: theme ${s.theme} but the body ground is ${r.bodyBg}`);

  if (!s.example && !s.entity) {
    if (!/What do you owe/.test(r.h1)) fail.push(`${tag}: empty state headline is "${r.h1}"`);
    continue;
  }
  const x = s.entity ? { entity: s.entity } : EXAMPLES.find(e => e.id === s.example);
  const a = assess(x.entity, DATA, TODAY);
  const count = `${WORD[a.summary.applies]} regime${a.summary.applies === 1 ? '' : 's'} appl${a.summary.applies === 1 ? 'ies' : 'y'}.`;
  if (!r.h1.startsWith(count)) fail.push(`${tag}: headline "${r.h1}" should open "${count}"`);
  if (a.next) {
    const nx = `Next: ${lc(a.next.label)}, ${when(a.next)}.`;
    if (!r.h1.includes(nx)) fail.push(`${tag}: headline should name the next obligation — "${nx}"`);
  }
  const CHIP = { yes: 'Applies', no: 'Not in scope', boundary: 'On the line', unknown: 'Needs input' };
  if (r.verdicts.length !== a.regimes.length) fail.push(`${tag}: ${r.verdicts.length} verdict cards, engine has ${a.regimes.length}`);
  for (const g of a.regimes) {
    const card = r.verdicts.find(v => v.id === `regime-${g.code}`);
    if (!card) fail.push(`${tag}: no card for ${g.code}`);
    else if (card.chip !== CHIP[g.verdict]) fail.push(`${tag}: ${g.code} card says "${card.chip}", engine says ${g.verdict}`);
  }
  // With nothing to plan, the panel explains itself instead of drawing an empty axis.
  if ((a.obligations.length === 0) !== r.planEmpty)
    fail.push(`${tag}: ${a.obligations.length} obligations but the plan ${r.planEmpty ? 'shows' : 'does not show'} its empty state`);
  if ((a.summary.applies === 0) !== r.proveEmpty)
    fail.push(`${tag}: ${a.summary.applies} regimes apply but evidence ${r.proveEmpty ? 'shows' : 'does not show'} its empty state`);
  if (r.marks !== a.obligations.length) fail.push(`${tag}: ${r.marks} timeline marks, engine has ${a.obligations.length} obligations`);
  if (r.rows.length !== a.obligations.length) fail.push(`${tag}: ${r.rows.length} list rows, engine has ${a.obligations.length}`);
  a.obligations.forEach((o, i) => {
    const row = r.rows[i];
    if (!row || row.title !== o.label || row.n !== String(i + 1))
      fail.push(`${tag}: row ${i + 1} is "${row?.n} ${row?.title}", engine order says "${o.label}"`);
  });
  const keys = [...new Set(a.regimes.filter(g => g.verdict === 'yes').flatMap(g => g.evidence))];
  if (r.evidence.length !== keys.length) fail.push(`${tag}: ${r.evidence.length} evidence rows, engine needs ${keys.length}`);
  if (s.ledger) {
    const ghg = r.evidence.find(e => e.label === 'GHG inventory');
    const asr = r.evidence.find(e => e.label === 'Assurance readiness');
    if (!ghg || !/Computed/.test(ghg.status)) fail.push(`${tag}: a seeded GHG inventory should read "Computed", got "${ghg?.status}"`);
    if (!asr || !/2 gaps/.test(asr.status)) fail.push(`${tag}: a seeded readiness record with 2 gaps should say so, got "${asr?.status}"`);
  } else if (r.evidence.some(e => !/Not run/.test(e.status))) {
    fail.push(`${tag}: with an empty ledger every evidence row should read "Not run"`);
  }
  if (s.palette) {
    if (!r.paletteOpened) fail.push(`${tag}: Ctrl+K did not open the command palette`);
    else {
      if (!r.paletteGroups?.includes('Emission factors') || !r.paletteHits?.some(h => /diesel/i.test(h)))
        fail.push(`${tag}: typing "diesel" should find an emission factor — got ${JSON.stringify(r.paletteHits)}`);
      if (!r.paletteClosed) fail.push(`${tag}: Escape did not close the palette`);
    }
  }
}

if (fail.length) {
  console.error(`✗ workspace — ${fail.length} problem${fail.length > 1 ? 's' : ''}:`);
  for (const f of fail.slice(0, 30)) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ workspace — ${SC.length} scenarios (4 examples plus every verdict state, light and dark, 1280px and a `
  + `true 390px, seeded ledger, command palette) all match the engine; no contrast failures, overflow or console errors`);
