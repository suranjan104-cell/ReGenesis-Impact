import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { sdgByNumber } from '../catalog/sdgs'
import type { QualityFlag } from '../domain/aggregate'

/** Inline help tooltip — keyboard accessible (focusable). */
export function Tip({ text }: { text: string }) {
  return (
    <span className="tip" tabIndex={0} aria-label={text} role="note">
      <span className="tip-icon" aria-hidden>?</span>
      <span className="tip-body">{text}</span>
    </span>
  )
}

export function Field(props: {
  label: string
  help?: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label className="field-label">
        {props.label}
        {props.help && <Tip text={props.help} />}
      </label>
      {props.children}
      {props.error && <div className="field-error" role="alert">{props.error}</div>}
      {!props.error && props.hint && <div className="field-hint">{props.hint}</div>}
    </div>
  )
}

export function EmptyState(props: {
  icon: string
  title: string
  sub: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>{props.icon}</div>
      <div className="empty-title">{props.title}</div>
      <p className="empty-sub">{props.sub}</p>
      {props.action}
    </div>
  )
}

export function LoadingPane({ label = 'LOADING' }: { label?: string }) {
  return (
    <div className="loading-pane" role="status" aria-live="polite">
      <div>
        <div className="spinner" />
        {label}
      </div>
    </div>
  )
}

export function Modal(props: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) props.onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={props.title}
        style={props.wide ? { maxWidth: 760 } : undefined}>
        <div className="modal-title">
          {props.title}
          <button className="modal-close" onClick={props.onClose} aria-label="Close dialog">✕</button>
        </div>
        {props.children}
      </div>
    </div>
  )
}

export function SdgChip({ n, size = 26 }: { n: number; size?: number }) {
  const sdg = sdgByNumber.get(n)
  if (!sdg) return null
  return (
    <span
      className="sdg-chip"
      title={`SDG ${n} — ${sdg.name}`}
      style={{ background: sdg.color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {n}
    </span>
  )
}

const DQ_LABEL: Record<QualityFlag, string> = {
  measured: 'Measured — backed by primary data',
  estimated: 'Estimated — modelled or extrapolated',
  stale: 'Stale — last data is more than 2 quarters old',
  missing: 'Missing — no data reported yet',
}

export function QualityDot({ flag }: { flag: QualityFlag }) {
  return <span className={`dq-dot dq-${flag}`} title={DQ_LABEL[flag]} aria-label={DQ_LABEL[flag]} />
}

export function ProgressBar({ pct, height = 6 }: { pct: number | null; height?: number }) {
  const v = pct == null ? 0 : Math.max(0, Math.min(100, pct))
  const cls = pct == null ? '' : v >= 70 ? '' : v >= 40 ? 'warn' : 'danger'
  return (
    <div className="pbar" style={{ height }} role="progressbar"
      aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`pbar-fill ${cls}`} style={{ width: `${v}%` }} />
    </div>
  )
}

