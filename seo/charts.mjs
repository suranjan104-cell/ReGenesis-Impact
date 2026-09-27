/* Chart primitives for the static research pages. HTML and CSS rather than
   SVG: an SVG scaled to a 390px phone shrinks its text with it, where HTML
   bars keep text at reading size and wrap. Every chart ships its numbers as
   a table too, direct labels on the marks, a legend when there is more than
   one series, and a native hover title on each mark. Colours are the site's
   tokens, so charts follow the theme; text is always ink, never the series
   colour. */

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Horizontal bars. rows: [{ label, value, display, color?, cite }] */
export function bars({ id, title, caption, unit = '', rows, max, cite }) {
  const top = max ?? Math.max(...rows.map(r => r.value));
  const body = rows.map(r => {
    const pct = Math.max(0.5, (r.value / top) * 100);
    return `<div class="bar-row">
      <span class="bar-label">${esc(r.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${pct.toFixed(2)}%;background:${r.color || 'var(--series)'}" title="${esc(r.label)}: ${esc(r.display ?? r.value)}${esc(unit)}"></span></span>
      <span class="bar-val">${esc(r.display ?? r.value)}${esc(unit)}${r.cite || ''}</span>
    </div>`;
  }).join('');
  return figure({ id, title, caption, cite, body, table: table(['', title], rows.map(r => [r.label, `${r.display ?? r.value}${unit}`])) });
}

/** 100% stacked bars. segments: [{ key, label, color }]; rows: [{ label, parts: {key: value}, cite }] */
export function stacked({ id, title, caption, segments, rows, cite, unit = '%' }) {
  const legend = `<ul class="legend">${segments.map(s =>
    `<li><i style="background:${s.color}"></i>${esc(s.label)}</li>`).join('')}</ul>`;
  const body = legend + rows.map(r => {
    const total = segments.reduce((n, s) => n + (r.parts[s.key] || 0), 0);
    const cells = segments.filter(s => r.parts[s.key]).map(s => {
      const v = r.parts[s.key], pct = (v / total) * 100;
      return `<span class="seg" style="width:${pct.toFixed(2)}%;background:${s.color}" title="${esc(r.label)} — ${esc(s.label)}: ${v}${unit}">${pct >= 9 ? `<b>${v}${unit}</b>` : ''}</span>`;
    }).join('');
    return `<div class="stack-row"><span class="bar-label">${esc(r.label)}${r.cite || ''}</span><span class="stack">${cells}</span></div>`;
  }).join('');
  const trows = rows.map(r => [r.label, ...segments.map(s => r.parts[s.key] == null ? '—' : `${r.parts[s.key]}${unit}`)]);
  return figure({ id, title, caption, cite, body, table: table(['', ...segments.map(s => s.label)], trows) });
}

/** Headline figures. tiles: [{ value, label, cite }] */
export function tiles(list) {
  return `<div class="tiles">${list.map(t =>
    `<div class="tile"><b>${esc(t.value)}</b><span>${esc(t.label)}${t.cite || ''}</span></div>`).join('')}</div>`;
}

function table(head, rows) {
  return `<details class="as-table"><summary>Show as a table</summary><table>
    <thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody>
  </table></details>`;
}

function figure({ id, title, caption, cite, body, table }) {
  return `<figure class="chart" id="${esc(id)}" aria-labelledby="${esc(id)}-t">
    <figcaption><b id="${esc(id)}-t">${esc(title)}</b>${caption ? `<span>${esc(caption)}</span>` : ''}</figcaption>
    <div class="chart-body">${body}</div>
    ${cite ? `<p class="chart-src">Source: ${cite}</p>` : ''}
    ${table}
  </figure>`;
}

export const CHART_CSS = `
.chart{margin:2rem 0;padding:20px 20px 14px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-3)}
.chart figcaption{display:flex;flex-direction:column;gap:4px;margin-bottom:16px}
.chart figcaption b{font-size:1rem;font-weight:600;letter-spacing:-.01em}
.chart figcaption span{font-size:.85rem;color:var(--ink-2)}
.bar-row,.stack-row{display:grid;grid-template-columns:minmax(120px,34%) 1fr auto;gap:12px;align-items:center;padding:6px 0}
.stack-row{grid-template-columns:minmax(120px,34%) 1fr}
.bar-label{font-size:.86rem;color:var(--ink);line-height:1.3}
.bar-track{height:14px;background:var(--sunk);border-radius:0 4px 4px 0;overflow:hidden}
.bar-fill{display:block;height:100%;border-radius:0 4px 4px 0}
.bar-val{font:600 .85rem var(--f-mono);font-variant-numeric:tabular-nums;white-space:nowrap}
.stack{display:flex;gap:2px;height:22px;border-radius:0 4px 4px 0;overflow:hidden}
.seg{display:flex;align-items:center;justify-content:center;min-width:2px}
.seg b{font:600 .7rem var(--f-mono);color:#fff;text-shadow:0 0 2px rgba(0,0,0,.45)}
.legend{list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 10px;padding:0;font-size:.8rem;color:var(--ink-2)}
.legend li{display:inline-flex;align-items:center;gap:6px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:2px}
.chart-src{margin:12px 0 0;font-size:.78rem;color:var(--ink-3)}
.as-table{margin-top:10px;font-size:.82rem}
.as-table summary{cursor:pointer;color:var(--ink-2)}
.as-table table{width:100%;border-collapse:collapse;margin-top:8px}
.as-table th,.as-table td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
.as-table td{font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r-3);overflow:hidden;margin:1.6rem 0}
.tile{background:var(--surface);padding:18px 16px;display:flex;flex-direction:column;gap:6px}
.tile b{font-size:2rem;line-height:1;font-weight:650;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.tile span{font-size:.84rem;color:var(--ink-2);line-height:1.4}
@media(max-width:560px){.bar-row{grid-template-columns:1fr auto}.bar-row .bar-track{grid-column:1/-1;order:3}.stack-row{grid-template-columns:1fr}}
`;
