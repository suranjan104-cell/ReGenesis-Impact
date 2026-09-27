import { LOOP_PATH, DOT, DOT_R, STROKE } from '../brand-mark'

/** The ReGenesis Impact mark: the loop in the current text colour, the data point in the first data colour. */
export function BrandMark({ size = 20, dot = 'var(--series)' }: { size?: number; dot?: string }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <path d={LOOP_PATH} style={{ fill: 'none', stroke: 'currentColor', strokeWidth: STROKE, strokeLinejoin: 'round' }} />
      <circle cx={DOT[0]} cy={DOT[1]} r={DOT_R} style={{ fill: dot }} />
    </svg>
  )
}
