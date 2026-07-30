/* ═══════════════════════════════════════════════════════════════════
   SVG chart helpers for the board.

   Print/PDF context: there is no hover layer, so every chart ships
   DIRECT LABELS + a legend. Identity is never carried by color alone.
   Marks are thin, gridlines hairline and solid (never dashed), and
   adjacent fills are separated by a 2px surface gap.
   ═══════════════════════════════════════════════════════════════════ */

export const S = { s1: '#199e70', s2: '#d95926', s3: '#3987e5', s4: '#d55181' };
/* Neutral is NOT a categorical slot — it is the "muted baseline" used by the
   emphasis pattern (highlight the point being made, recede the reference).
   Using a series hue for a baseline would falsely imply an entity. */
export const NEUTRAL = 'rgba(234,244,239,.26)';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Legend — always emitted for ≥2 series. */
export function legend(items) {
  return `<div class="legend">${items.map(i =>
    `<div class="legend-item"><span class="legend-swatch" style="background:${i.c}"></span>${esc(i.label)}</div>`
  ).join('')}</div>`;
}

/* ── Horizontal bar chart with direct value labels ───────────────── */
export function hbar({ w = 928, rowH = 54, gap = 12, data, max, unit = '', labelW = 250, color }) {
  const m = max ?? Math.max(...data.map(d => d.v)) * 1.16;
  const plotW = w - labelW - 96;
  const h = data.length * (rowH + gap);
  const rows = data.map((d, i) => {
    const y = i * (rowH + gap);
    const bw = Math.max(3, (d.v / m) * plotW);
    const c = d.c || color || S.s1;
    const barH = rowH - 18;
    return `
      <text x="0" y="${y + rowH / 2 + 1}" class="ser-lab" dominant-baseline="middle">${esc(d.label)}</text>
      <rect x="${labelW}" y="${y + (rowH - barH) / 2}" width="${bw}" height="${barH}" rx="4" fill="${c}"/>
      <text x="${labelW + bw + 14}" y="${y + rowH / 2 + 1}" class="val-lab" dominant-baseline="middle">${esc(d.disp ?? d.v + unit)}</text>`;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
    <line x1="${labelW - 14}" y1="0" x2="${labelW - 14}" y2="${h - gap}" class="ax-line"/>
    ${rows}
  </svg>`;
}

/* ── Vertical column chart (time series of discrete values) ──────── */
export function vbar({ w = 928, h = 340, data, unit = '', color = S.s1, note }) {
  // a note needs its own band below the category labels, or the two collide
  const padB = note ? 84 : 56, padT = 44;
  const plotH = h - padB - padT;
  const max = Math.max(...data.map(d => d.v)) * 1.18;
  const n = data.length;
  const slot = w / n;
  const bw = Math.min(96, slot * 0.46);
  const bars = data.map((d, i) => {
    const cx = slot * i + slot / 2;
    const bh = Math.max(3, (d.v / max) * plotH);
    const y = padT + plotH - bh;
    const c = d.c || color;
    // `outline` marks a value that is stated intent / projection rather than an
    // actual or legislated figure — encoded as an unfilled mark, not just a hue.
    const mark = d.outline
      ? `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${bh}" rx="4" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="7 5"/>`
      : `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${bh}" rx="4" fill="${c}"/>`;
    return `
      ${mark}
      <text x="${cx}" y="${y - 14}" class="val-lab" text-anchor="middle">${esc(d.disp ?? d.v + unit)}</text>
      <text x="${cx}" y="${padT + plotH + 30}" class="ax-lab" text-anchor="middle">${esc(d.label)}</text>`;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
    <line x1="0" y1="${padT + plotH}" x2="${w}" y2="${padT + plotH}" class="ax-line"/>
    ${bars}
    ${note ? `<text x="${w}" y="${h - 6}" class="ax-lab" text-anchor="end">${esc(note)}</text>` : ''}
  </svg>`;
}

/* ── Regulatory timeline (Gantt-style phase-in) ──────────────────── */
export function timeline({ w = 928, years, rows, laneH = 46, gap = 14, labelW = 214 }) {
  const plotW = w - labelW;
  const y0 = years[0], y1 = years[years.length - 1] + 1;
  const span = y1 - y0;
  const x = (yr) => labelW + ((yr - y0) / span) * plotW;
  const headH = 40;
  const h = headH + rows.length * (laneH + gap) + 10;

  const ticks = years.map(yr =>
    `<line x1="${x(yr)}" y1="${headH - 12}" x2="${x(yr)}" y2="${h - 10}" class="ax-line"/>
     <text x="${x(yr) + 8}" y="${headH - 20}" class="ax-lab">${yr}</text>`
  ).join('');

  const lanes = rows.map((r, i) => {
    const y = headH + i * (laneH + gap);
    const bars = r.spans.map(s => {
      // 2px surface gap between adjacent fills
      const bx = x(s.from) + 1, bw = Math.max(6, x(s.to + 1) - x(s.from) - 2);
      const inner = s.text
        ? `<text x="${bx + 14}" y="${y + laneH / 2 + 1}" class="val-lab" dominant-baseline="middle" style="font-size:14px">${esc(s.text)}</text>`
        : '';
      return `<rect x="${bx}" y="${y}" width="${bw}" height="${laneH}" rx="5" fill="${s.c || r.c}" opacity="${s.soft ? .42 : 1}"/>${inner}`;
    }).join('');
    return `
      <text x="0" y="${y + laneH / 2 + 1}" class="ser-lab" dominant-baseline="middle">${esc(r.label)}</text>
      ${bars}`;
  }).join('');

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">${ticks}${lanes}</svg>`;
}

/* ── 2×2 scenario quadrant (NGFS) ────────────────────────────────── */
export function quadrant({ w = 900, h = 620, quads, xLab, yLab }) {
  const pad = 92;
  const pw = w - pad - 30, ph = h - pad - 40;
  const cx = pad + pw / 2, cy = 40 + ph / 2;
  const cellW = pw / 2 - 10, cellH = ph / 2 - 10;
  const pos = [
    { x: pad + 4, y: 44 },                 // top-left
    { x: cx + 14, y: 44 },                 // top-right
    { x: pad + 4, y: cy + 14 },            // bottom-left
    { x: cx + 14, y: cy + 14 },            // bottom-right
  ];
  const cells = quads.map((q, i) => {
    const p = pos[i];
    return `
      <rect x="${p.x}" y="${p.y}" width="${cellW}" height="${cellH}" rx="12"
            fill="${q.c}" opacity=".13" stroke="${q.c}" stroke-width="1.5"/>
      <text x="${p.x + 26}" y="${p.y + 42}" style="font-family:'DM Mono',monospace;font-size:13px;letter-spacing:.14em;fill:${q.c}">${esc(q.tag)}</text>
      <text x="${p.x + 26}" y="${p.y + 82}" style="font-family:'Playfair Display',serif;font-weight:700;font-size:29px;fill:#EAF4EF">${esc(q.title)}</text>
      ${q.lines.map((l, j) =>
        `<text x="${p.x + 26}" y="${p.y + 120 + j * 26}" style="font-family:'DM Sans',sans-serif;font-size:16.5px;fill:rgba(234,244,239,.66)">${esc(l)}</text>`
      ).join('')}`;
  }).join('');

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
    ${cells}
    <line x1="${pad - 26}" y1="${cy}" x2="${w - 10}" y2="${cy}" class="ax-line"/>
    <line x1="${cx}" y1="30" x2="${cx}" y2="${h - 26}" class="ax-line"/>
    <!-- axis-direction arrows are DRAWN, not typed: U+2192 is absent from DM
         Mono and would silently fall back to a system font. -->
    <g transform="translate(${w - 10} ${h - 6})">
      <text x="-34" y="0" class="ax-lab" text-anchor="end">${esc(xLab)}</text>
      <line x1="-28" y1="-5" x2="-6" y2="-5" class="ax-line"/>
      <path d="M-6,-5 l-6,-3.5 v7 z" fill="currentColor" opacity=".45"/>
    </g>
    <g transform="rotate(-90 26 44) translate(26 44)">
      <text x="-34" y="0" class="ax-lab" text-anchor="end">${esc(yLab)}</text>
      <line x1="-28" y1="-5" x2="-6" y2="-5" class="ax-line"/>
      <path d="M-6,-5 l-6,-3.5 v7 z" fill="currentColor" opacity=".45"/>
    </g>
  </svg>`;
}

/* ── Stacked proportion bar (part-to-whole, ≤6 segments) ─────────── */
export function stackbar({ w = 928, h = 62, segs }) {
  const total = segs.reduce((a, s) => a + s.v, 0);
  let x = 0;
  const parts = segs.map(s => {
    const sw = (s.v / total) * w;
    const r = `<rect x="${x + 1}" y="0" width="${Math.max(2, sw - 2)}" height="${h}" rx="4" fill="${s.c}"/>`;
    x += sw;
    return r;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">${parts}</svg>`;
}
