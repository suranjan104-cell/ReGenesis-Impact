/* The ReGenesis Impact mark: a neural leaf. A leaf outline whose veins are a
   small network (nodes on the midrib, edges out to the margin) with the tip
   lit in the first data colour. Climate and machine learning in one shape,
   and it follows the design rule everywhere else: the brand is ink, and
   colour is for data.

   Every copy of the mark (inline in page headers, the favicon, app icons, the
   social image, the PDF cover, the two React apps) is generated from MARK, so
   they can never drift. Coordinates are in a 32×32 box. */

export const MARK = {
  /** Stroked paths: the leaf outline, then the midrib and four veins. */
  strokes: [
    { d: 'M16 3.2C24.8 8.4 27.2 19 16 28.8C4.8 19 7.2 8.4 16 3.2Z', w: 2.2 },
    { d: 'M16 28.8L16 11.5M16 22L22.6 16.6M16 22L9.4 16.6M16 15.5L21.4 10.4M16 15.5L10.6 10.4', w: 1.8 },
  ],
  /** The network's nodes on the midrib, in ink: [cx, cy, r]. */
  nodes: [[16, 22, 1.9], [16, 15.5, 1.9]],
  /** The lit node at the tip, in the data colour. */
  dot: [16, 8.9, 3.3],
};

/** The mark's elements with literal colours, for files that leave the site. */
export function markElements(ink, dot) {
  return MARK.strokes.map(s => `<path d="${s.d}" fill="none" stroke="${ink}" stroke-width="${s.w}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
    + MARK.nodes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ink}"/>`).join('')
    + `<circle cx="${MARK.dot[0]}" cy="${MARK.dot[1]}" r="${MARK.dot[2]}" fill="${dot}"/>`;
}

/** Inline SVG for pages. `ink` and `dot` are CSS colour expressions
    (currentColor, var(--eu)), written as style so custom properties resolve
    and theme switches follow. */
export function markSvg({ size = 22, cls = 'mark', ink = 'currentColor', dot = 'var(--eu)', title } = {}) {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'} focusable="false">`
    + MARK.strokes.map(s => `<path d="${s.d}" style="fill:none;stroke:${ink};stroke-width:${s.w};stroke-linecap:round;stroke-linejoin:round"/>`).join('')
    + MARK.nodes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:${ink}"/>`).join('')
    + `<circle cx="${MARK.dot[0]}" cy="${MARK.dot[1]}" r="${MARK.dot[2]}" style="fill:${dot}"/></svg>`;
}
