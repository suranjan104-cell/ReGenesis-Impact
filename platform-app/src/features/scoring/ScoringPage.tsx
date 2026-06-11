import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../data/useData'
import { EmptyState, QualityDot, Tip } from '../../components/ui'
import { useToast } from '../../components/toast'
import { downloadCsv, scoreColor } from '../../components/exporters'

import { companyScore, fmtNum } from '../../domain/aggregate'
import { metricMap } from '../../catalog/metrics'
import { formatPeriod } from '../../domain/periods'

export default function ScoringPage() {
  const { data } = useData()
  const [openId, setOpenId] = useState<string | null>(null)
  const [toast, showToast] = useToast()

  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])
  const rows = useMemo(() =>
    data.companies
      .map(c => ({ c, score: companyScore(c.id, data.assignments, data.dataPoints, metrics) }))
      .sort((a, b) => (b.score.score ?? -1) - (a.score.score ?? -1)),
  [data, metrics])

  const underperformers = rows.filter(r => r.score.score != null && r.score.score < 40)

  if (data.companies.length === 0) {
    return (
      <>
        <div className="page-head">
          <h1 className="page-title">Impact Scores</h1>
          <p className="page-sub">Transparent, no-black-box scoring across your portfolio.</p>
        </div>
        <EmptyState icon="◧" title="No companies to score yet"
          sub="Add companies and assign metrics with targets — scores appear automatically as data comes in."
          action={<Link to="/portfolio" className="btn btn-primary">Go to Portfolio →</Link>} />
      </>
    )
  }

  return (
    <>
      <div className="page-head page-head-row">
        <div>
          <h1 className="page-title">Impact Scores</h1>
          <p className="page-sub">
            Score = average of (progress toward target × data-quality weight) per metric, scaled 0–100.
            Measured data counts 100%, estimated 80%, stale 60%. Click any company to see the exact math.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          downloadCsv('impact_scores.csv', [
            ['Company', 'Score', 'Data coverage %', 'Metrics assigned'],
            ...rows.map(r => [r.c.name, r.score.score ?? '', Math.round(r.score.coverage * 100), r.score.rows.length]),
          ])
          showToast('Scores exported')
        }}>⬇ CSV</button>
      </div>

      {/* Heat map strip */}
      <div className="card">
        <div className="card-title">Portfolio heat map <Tip text="One tile per company, coloured by score: green ≥ 70, amber 40–69, red < 40, grey = not enough data." /></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {rows.map(r => (
            <button key={r.c.id}
              onClick={() => setOpenId(openId === r.c.id ? null : r.c.id)}
              aria-expanded={openId === r.c.id}
              title={`${r.c.name}: ${r.score.score ?? 'no score'}`}
              style={{
                width: 92, height: 64, borderRadius: 8, cursor: 'pointer',
                border: openId === r.c.id ? '2px solid var(--phosphor)' : '1px solid var(--border)',
                background: `${scoreColor(r.score.score)}22`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                color: 'var(--text)',
              }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700, color: scoreColor(r.score.score) }}>
                {r.score.score ?? '—'}
              </span>
              <span style={{ fontSize: '0.56rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 86 }}>
                {r.c.name}
              </span>
            </button>
          ))}
        </div>
        {underperformers.length > 0 && (
          <p style={{ marginTop: 12, fontSize: '0.76rem', color: 'var(--amber)' }}>
            ⚠ {underperformers.length} compan{underperformers.length === 1 ? 'y' : 'ies'} scoring below 40: {underperformers.map(r => r.c.name).join(', ')} — worth a closer look.
          </p>
        )}
      </div>

      {/* Open calculation */}
      {openId && (() => {
        const r = rows.find(x => x.c.id === openId)
        if (!r) return null
        return (
          <div className="card">
            <div className="card-title">
              How {r.c.name}'s score of {r.score.score ?? '—'} is calculated
              <span className="spacer" />
              <Link to={`/portfolio/${r.c.id}`} className="btn btn-subtle btn-sm">Open company →</Link>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Metric</th><th>Latest</th><th>Baseline → Target</th>
                    <th>Progress</th><th>Quality</th><th>Weight</th><th>Counts as</th>
                  </tr>
                </thead>
                <tbody>
                  {r.score.rows.map(row => (
                    <tr key={row.assignment.id}>
                      <td style={{ fontWeight: 600, fontSize: '0.78rem' }}>{row.metric?.name ?? '?'}</td>
                      <td className="num">{row.latest ? `${fmtNum(row.latest.value)} (${formatPeriod(row.latest.period)})` : '—'}</td>
                      <td className="num">{row.assignment.baseline != null ? fmtNum(row.assignment.baseline) : '0'} → {row.assignment.target != null ? fmtNum(row.assignment.target) : 'no target'}</td>
                      <td className="num">{row.progress == null ? '—' : `${Math.round(Math.min(row.progress, 1) * 100)}%`}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><QualityDot flag={row.quality} />{row.quality}</span></td>
                      <td className="num">×{row.qualityWeight}</td>
                      <td className="num" style={{ color: 'var(--phosphor)' }}>
                        {row.contribution == null ? 'excluded' : `${Math.round(row.contribution * 100)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 10 }}>
              Score = average of the "Counts as" column across metrics that have a target and data
              {r.score.score != null && ` = ${r.score.score}`}.
              Metrics without targets or data are excluded rather than guessed.
            </p>
          </div>
        )
      })()}

      <div className="card" style={{ borderStyle: 'dashed', opacity: 0.75 }}>
        <div className="card-title">Coming in Phase 2</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Custom metric weighting · peer benchmarks against industry datasets · score history over time ·
          portfolio-company data submission portal with review &amp; approve.
        </p>
      </div>
      {toast}
    </>
  )
}
