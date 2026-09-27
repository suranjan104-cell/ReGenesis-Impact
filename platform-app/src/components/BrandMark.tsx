import { MARK } from '../brand-mark'

/** The ReGenesis Impact mark, a neural leaf: ink in the current text colour, the lit tip in the first data colour. */
export function BrandMark({ size = 20, dot = 'var(--series)' }: { size?: number; dot?: string }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      {MARK.strokes.map(s => (
        <path key={s.d} d={s.d} style={{ fill: 'none', stroke: 'currentColor', strokeWidth: s.w, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      ))}
      {MARK.nodes.map(([x, y, r]) => <circle key={`${x},${y}`} cx={x} cy={y} r={r} style={{ fill: 'currentColor' }} />)}
      <circle cx={MARK.dot[0]} cy={MARK.dot[1]} r={MARK.dot[2]} style={{ fill: dot }} />
    </svg>
  )
}
