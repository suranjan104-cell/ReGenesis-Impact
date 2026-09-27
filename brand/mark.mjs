/* The ReGenesis Impact mark: an infinity loop with one blue data point on it.
   The loop is ink and the point is the site's first data colour, which follows
   the design rule everywhere else: the brand is ink, and colour is for data.

   The curve is a lemniscate of Bernoulli stretched vertically (K) so the loops
   are round and the crossing is gentle rather than a sharp X. Every copy of the
   mark (inline in page headers, the favicon, app icons, the social image, the
   PDF cover) is generated from this one function, so they can never drift. */

const A = 13.4, K = 1.62, CX = 16, CY = 16;
export const STROKE = 3.4;
export const DOT_R = 3;

const pt = t => { const d = 1 + Math.sin(t) ** 2; return [CX + A * Math.cos(t) / d, CY + K * A * Math.sin(t) * Math.cos(t) / d]; };

/** The loop as an SVG path in a 32×32 box. `n` points; more for large renders. */
export function loopPath(n = 96) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = pt((2 * Math.PI * i) / n);
    d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + 'Z';
}

/** Where the data point sits: on the right-hand loop, upper side. */
export const DOT = pt(-Math.PI / 4 + 0.08).map(v => +v.toFixed(2));

/** Inline SVG. `ink` and `dot` are CSS colour expressions (currentColor, var(--eu)),
    written as style so custom properties resolve and theme switches follow. */
export function markSvg({ size = 22, cls = 'mark', ink = 'currentColor', dot = 'var(--eu)', n = 96, title } = {}) {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'} focusable="false">`
    + `<path d="${loopPath(n)}" style="fill:none;stroke:${ink};stroke-width:${STROKE};stroke-linejoin:round"/>`
    + `<circle cx="${DOT[0]}" cy="${DOT[1]}" r="${DOT_R}" style="fill:${dot}"/></svg>`;
}
