/* Measures how much of each page's content area is actually occupied.
   Run:  node fill-check.mjs
   The gate: every page should sit inside the target band. A page far below it
   has dead space; a page above 100 is overflowing and being clipped. */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIN = Number(process.env.MIN ?? 82);   // floor: below this reads as empty
const MAX = 100;

const html = readFileSync('board.html', 'utf8');
const head = html.split('</head>')[0].replace('href="board.css"', 'href="../board.css"') + '</head><body style="margin:0">';
const secs = html.match(/<section class="slide[\s\S]*?<\/section>/g);

const probe = `<script>
try {
  const s = document.querySelector('.slide');
  const cs = getComputedStyle(s);
  const top = s.getBoundingClientRect().top + parseFloat(cs.paddingTop);
  const floor = s.getBoundingClientRect().bottom - parseFloat(cs.paddingBottom);

  // Visible ink = the union of text-node line boxes plus atomic elements
  // (charts, tables, rules) and anything drawing its own background or border.
  const bands = [];
  const add = (r) => {
    if (!r || r.height <= 0 || r.width <= 0) return;
    const t = Math.max(r.top, top), b = Math.min(r.bottom, floor);
    if (b > t) bands.push([t, b]);
  };
  const skip = (el) => el.closest && el.closest('.pagenum, .brandmark');

  const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    if (n.parentElement && skip(n.parentElement)) continue;
    const rng = document.createRange();
    rng.selectNodeContents(n);
    for (const r of rng.getClientRects()) add(r);
  }
  for (const el of s.querySelectorAll('svg, table, img, hr, .card, .stat, .finding, .toc-row')) {
    if (skip(el)) continue;
    if (getComputedStyle(el).position === 'absolute') continue;
    add(el.getBoundingClientRect());
  }

  bands.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const bd of bands) {
    const last = merged[merged.length - 1];
    // 26px tolerance: intra-paragraph leading is not a hole in the page
    if (last && bd[0] <= last[1] + 26) last[1] = Math.max(last[1], bd[1]);
    else merged.push([bd[0], bd[1]]);
  }
  const avail = floor - top;
  const occupied = merged.reduce((a, b) => a + (b[1] - b[0]), 0);
  let gap = merged.length ? merged[0][0] - top : avail;
  for (let i = 1; i < merged.length; i++) gap = Math.max(gap, merged[i][0] - merged[i - 1][1]);
  if (merged.length) gap = Math.max(gap, floor - merged[merged.length - 1][1]);
  document.title = 'FILL=' + (occupied / avail * 100).toFixed(1) + ';GAP=' + Math.round(gap);
} catch (e) { document.title = 'ERR: ' + e.message; }
</script>`;

mkdirSync('fillmeas', { recursive: true });
secs.forEach((s, i) => writeFileSync(`fillmeas/f${String(i + 1).padStart(2, '0')}.html`, head + s + probe + '</body></html>'));

const rows = [];
for (let i = 1; i <= secs.length; i++) {
  const f = `fillmeas/f${String(i).padStart(2, '0')}.html`;
  const out = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=1400', '--dump-dom', `file://${process.cwd()}/${f}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const m = out.match(/FILL=([\d.]+);GAP=(\d+)/);
  if (!m) {
    const err = out.match(/<title>(ERR:[^<]*)<\/title>/);
    throw new Error(`page ${i}: probe did not report — ${err ? err[1] : 'no title found'}`);
  }
  rows.push({ page: i, fill: Number(m[1]), gap: Number(m[2]) });
}
rmSync('fillmeas', { recursive: true, force: true });

const MAXGAP = Number(process.env.MAXGAP ?? 120);
const bad = rows.filter(r => r.fill < MIN || r.fill > MAX || r.gap > MAXGAP);
const fills = rows.map(r => r.fill);
const mean = fills.reduce((a, b) => a + b, 0) / fills.length;
const sd = Math.sqrt(fills.reduce((a, b) => a + (b - mean) ** 2, 0) / fills.length);

for (const r of rows) {
  const bar = '█'.repeat(Math.round(r.fill / 4)).padEnd(25);
  const flags = [];
  if (r.fill > MAX) flags.push('OVERFLOW');
  else if (r.fill < MIN) flags.push('sparse');
  if (r.gap > MAXGAP) flags.push(`gap ${r.gap}px`);
  console.log(`  p${String(r.page).padStart(2, '0')} ${bar} ${r.fill.toFixed(1).padStart(5)}%  gap ${String(r.gap).padStart(4)}px  ${flags.join(' · ')}`);
}
console.log(`\n  mean ${mean.toFixed(1)}%  ·  spread (sd) ${sd.toFixed(1)}  ·  range ${Math.min(...fills).toFixed(1)}–${Math.max(...fills).toFixed(1)}`);
const gaps = rows.map(r => r.gap);
console.log(`  largest single gap ${Math.max(...gaps)}px  ·  gate: fill ≥${MIN}%, gap ≤${MAXGAP}px`);
console.log(bad.length ? `\n  ${bad.length} page(s) failing: ${bad.map(b => b.page).join(', ')}`
                       : `\n  all ${rows.length} pages pass`);
process.exit(bad.length ? 1 : 0);
