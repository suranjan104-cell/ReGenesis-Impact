/* The static pages and the IMM platform, in a real browser.
   Run:  node test/static-pages.mjs

   test/pages.mjs audits the thirteen routes of index.html and
   test/workspace.mjs audits /app/. This covers everything else a visitor can
   land on — the eleven guides, the ESRS landing, the research pages, the
   demo, and the IMM platform — which until now carried five private
   palettes and no gate at all.

   Per page, in the light and dark themes (chosen the way a visitor chooses
   them, through the shared rg_ws_theme key), at 1440px and a true 390px:
     · every text element clears WCAG AA against its composited background;
     · nothing scrolls sideways;
     · the theme that rendered is the one asked for;
     · no console errors;
     · no request leaves the site. Every one of these pages used to load its
       fonts from Google, on a site whose promise is that nothing leaves the
       browser. */
import { readdirSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { serve } from './lib/serve.mjs';

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

const PAGES = [
  ...readdirSync(`${ROOT}/guides`).filter(f => f.endsWith('.html')).sort().map(f => `/guides/${f}`),
  '/esrs/', '/research/', '/research/financed-emissions.html', '/research/emission-factor-register.html',
  '/demo/how-it-works.html', '/platform/',
];

const PROBE = `(function(){
  var errs = [];
  addEventListener('error', function(e){ errs.push(String(e.message)); });
  function parse(c){ var m;
    if ((m = c.match(/^color\\(srgb ([\\d.]+) ([\\d.]+) ([\\d.]+)(?: \\/ ([\\d.]+))?\\)/))) return { r:m[1]*255, g:m[2]*255, b:m[3]*255, a:m[4]===undefined?1:+m[4] };
    if ((m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/))) return { r:+m[1], g:+m[2], b:+m[3], a:m[4]===undefined?1:+m[4] };
    return null; }
  function lum(o){ var v=[o.r,o.g,o.b].map(function(x){x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}); return .2126*v[0]+.7152*v[1]+.0722*v[2]; }
  function bgOf(el){ var st=[], n=el; while (n && n.nodeType===1) { st.push(getComputedStyle(n).backgroundColor); n=n.parentElement; }
    var o={r:255,g:255,b:255}; for (var i=st.length-1;i>=0;i--){ var c=parse(st[i]); if(!c||!c.a)continue;
      o={r:c.r*c.a+o.r*(1-c.a),g:c.g*c.a+o.g*(1-c.a),b:c.b*c.a+o.b*(1-c.a)}; } return o; }
  setTimeout(function(){
    var bad=[], seen={};
    document.querySelectorAll('body *').forEach(function(el){
      if (el.closest('svg') || !el.getClientRects().length) return;
      if (!Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType===3 && n.textContent.trim(); })) return;
      var cs=getComputedStyle(el); if (cs.visibility==='hidden') return;
      var op=1, n=el; while (n && n.nodeType===1){ op*=+getComputedStyle(n).opacity; n=n.parentElement; } if (op<.3) return;
      var fg=parse(cs.color), bg=bgOf(el); if(!fg) return;
      var f={r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a)};
      var a=lum(f), b=lum(bg), r=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      var size=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight,10)>=700, need=(size>=24||(size>=18.66&&bold))?3:4.5;
      if (r>=need) return; var k=el.className+cs.color; if (seen[k]) return; seen[k]=1;
      bad.push(r.toFixed(2)+':1 (needs '+need+') "'+el.textContent.trim().slice(0,40)+'"');
    });
    var vw=document.documentElement.clientWidth, worst=null;
    document.querySelectorAll('body *').forEach(function(el){ var r=el.getBoundingClientRect(); if(!r.width) return;
      var p=el.parentElement; while (p && p!==document.body){ if(getComputedStyle(p).overflowX!=='visible') return; p=p.parentElement; }
      var o=Math.round(r.right-vw); if (o>1 && (!worst||o>worst.o)) worst={o:o, what:el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]}; });
    var g=parse(getComputedStyle(document.body).backgroundColor) || {r:255,g:255,b:255,a:0};
    if (!g.a) g=parse(getComputedStyle(document.documentElement).backgroundColor) || g;
    var ext = performance.getEntriesByType('resource').map(function(e){ return e.name; })
      .filter(function(u){ return u.indexOf(location.origin) !== 0 && u.indexOf('data:') !== 0; });
    var out={ contrast:bad.slice(0,5), overflow:worst, vw:vw, ground:.2126*g.r+.7152*g.g+.0722*g.b, external:ext.slice(0,4), errors:errs.slice(0,4) };
    parent.postMessage({ probe: new URLSearchParams(location.search).get('probe') || location.pathname, result: out }, '*');
  }, 1800);
})();`;

const RUNS = [];
for (const p of PAGES) for (const theme of ['light', 'dark']) for (const width of [1440, 390]) RUNS.push({ p, theme, width, id: `${p} ${theme} ${width}` });

const HARNESS_JS = `(function(){
  var R=${JSON.stringify(RUNS)}, out={}, i=0, frame=null, timer=null;
  addEventListener('message', function(e){ if (!e.data || !R[i] || e.data.probe !== R[i].id) return; clearTimeout(timer); out[R[i].id]=e.data.result; i++; next(); });
  function next(){
    if (frame) frame.remove();
    if (i>=R.length) { document.body.setAttribute('data-result', btoa(unescape(encodeURIComponent(JSON.stringify(out))))); return; }
    var r=R[i]; try { localStorage.setItem('rg_ws_theme', r.theme); } catch(e){}
    frame=document.createElement('iframe'); frame.style.cssText='border:0;width:'+r.width+'px;height:900px';
    frame.src=r.p+(r.p.indexOf('?')<0?'?':'&')+'probe='+encodeURIComponent(r.id); document.body.appendChild(frame);
    timer=setTimeout(function(){ out[r.id]={ error:'no report' }; i++; next(); }, 12000);
  }
  next();
})();`;

const srv = await serve(ROOT, {
  routes: { '/__h.html': ['text/html', '<!doctype html><meta charset="utf-8"><body><script src="/__h.js"></script></body>'],
            '/__h.js': ['text/javascript', HARNESS_JS], '/__probe.js': ['text/javascript', PROBE] },
  rewrite: (path, html, url) => url.searchParams.get('probe') ? html.replace('<head>', '<head><script src="/__probe.js"></script>') : html,
});
let dom;
try {
  ({ stdout: dom } = await run(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--window-size=1500,1000',
    '--disable-component-update', '--disable-background-networking', '--no-first-run',
    '--virtual-time-budget=400000', '--dump-dom', `${srv.origin}/__h.html`], { maxBuffer: 1 << 26 }));
} finally { await srv.close(); }
const m = dom.match(/data-result="([A-Za-z0-9+/=]+)"/);
if (!m) { console.error('✗ static pages — the harness never finished'); process.exit(1); }
const OUT = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));

const fail = [];
for (const r of RUNS) {
  const o = OUT[r.id];
  if (!o || o.error) { fail.push(`${r.id}: ${o ? o.error : 'no report'}`); continue; }
  for (const c of o.contrast) fail.push(`${r.id}: text fails contrast — ${c}`);
  if (o.overflow) fail.push(`${r.id}: scrolls sideways — ${o.overflow.what} overhangs by ${o.overflow.o}px`);
  if (r.width === 390 && o.vw > 390) fail.push(`${r.id}: rendered at ${o.vw}px, not a phone`);
  if ((r.theme === 'dark') !== (o.ground < 128)) fail.push(`${r.id}: asked for ${r.theme}, the ground has luminance ${Math.round(o.ground)}`);
  for (const u of o.external) fail.push(`${r.id}: requested ${u} — nothing on these pages may leave the site`);
  for (const e of o.errors) fail.push(`${r.id}: console error — ${e}`);
}
if (fail.length) {
  console.error(`✗ static pages — ${fail.length} problem${fail.length > 1 ? 's' : ''}:`);
  for (const f of fail.slice(0, 30)) console.error('  - ' + f);
  process.exit(1);
}
console.log(`  ✓ static pages — ${PAGES.length} pages (guides, ESRS landing, research, demo, IMM platform), light and dark, `
  + `1440px and a true 390px: no contrast failures, overflow, console errors or third-party requests`);
