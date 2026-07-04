import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../../data/useData'
import { EmptyState, SdgChip, Tip } from '../../components/ui'
import { useToast } from '../../components/toast'
import { downloadCsv, scoreColor } from '../../components/exporters'
import { ChartExportButton, DonutChart, HBarChart, TrendLine } from '../../components/charts'
import {
  aggregateMetricTotal, capitalBySdg, capitalWeightedScore, companyScore,
  dataGaps, fmtNum, fmtUsd, fundKpis, metricTrend,
} from '../../domain/aggregate'
import { formatPeriod } from '../../domain/periods'
import { metricMap } from '../../catalog/metrics'
import { sdgByNumber } from '../../catalog/sdgs'
import { buildDemoData } from '../../seed/demoData'

export default function FundDashboard() {
  const { data, reset } = useData()
  const nav = useNavigate()
  const [toast, showToast] = useToast()
  const [confirmClear, setConfirmClear] = useState(false)
  const donutRef = useRef<SVGSVGElement>(null)
  const barsRef = useRef<SVGSVGElement>(null)
  const trendRef = useRef<SVGSVGElement>(null)

  const metrics = useMemo(() => metricMap(data.customMetrics), [data.customMetrics])
  const kpis = useMemo(() => fundKpis(data), [data])

  const scores = useMemo(() => {
    const m = new Map<string, ReturnType<typeof companyScore>>()
    for (const c of data.companies) m.set(c.id, companyScore(c.id, data.assignments, data.dataPoints, metrics))
    return m
  }, [data, metrics])

  const cwScore = useMemo(() => capitalWeightedScore(data.companies, scores), [data.companies, scores])

  const sdgCapital = useMemo(() => {
    const entries = [...capitalBySdg(data.companies).entries()].sort((a, b) => b[1] - a[1])
    return entries.map(([n, v]) => ({
      label: `SDG ${n}`,
      value: v,
      color: sdgByNumber.get(n)?.color ?? '#888',
      n,
    }))
  }, [data.companies])

  // Top aggregate KPIs: most-assigned metrics with data
  const topMetrics = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of data.assignments) counts.set(a.metricId, (counts.get(a.metricId) ?? 0) + 1)
    return [...counts.entries()]
      .map(([metricId, n]) => ({
        metric: metrics.get(metricId),
        n,
        ...aggregateMetricTotal(metricId, data.assignments, data.dataPoints),
      }))
      .filter(x => x.metric && x.companies > 0)
      .sort((a, b) => b.companies - a.companies || b.n - a.n)
      .slice(0, 6)
  }, [data, metrics])

  const trendMetric = topMetrics[0]?.metric
  const trend = useMemo(
    () => trendMetric ? metricTrend(trendMetric.id, data.assignments, data.dataPoints) : [],
    [trendMetric, data],
  )

  const gaps = useMemo(
    () => dataGaps(data.companies, data.assignments, data.dataPoints, metrics),
    [data, metrics],
  )

  if (data.companies.length === 0) {
    // No companies yet: the only thing demo data can overwrite is the fund
    // profile, so flag that in the confirm only when a profile exists.
    const wipesProfile = !!data.fund?.onboarded
    return (
      <>
        <div className="page-head">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your fund's impact at a glance.</p>
        </div>
        <EmptyState icon="◳" title="Your dashboard is waiting for data"
          sub="Add your first portfolio company, assign a couple of metrics, and this page lights up with KPIs, SDG breakdowns and trends."
          action={
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/portfolio" className="btn btn-primary">+ Add first company</Link>
              <button className="btn btn-ghost" onClick={() => {
                if (wipesProfile && !confirmClear) { setConfirmClear(true); return }
                reset(buildDemoData())
                showToast('Demo data loaded')
              }}>Load demo data</button>
            </div>
          } />
        {confirmClear && (
          <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmClear(false) }}>
            <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm demo data">
              <div className="modal-title">Load demo data?</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                This replaces your fund profile "{data.fund?.name}" with a fictional demo fund.
                You can clear the demo and re-enter your details later.
              </p>
              <div className="modal-actions">
                <button className="btn btn-subtle" onClick={() => setConfirmClear(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => {
                  setConfirmClear(false); reset(buildDemoData()); showToast('Demo data loaded')
                }}>Load demo</button>
              </div>
            </div>
          </div>
        )}
        {toast}
      </>
    )
  }

  return (
    <>
      {data.isDemo && (
        <div className="demo-banner" role="status">
          <span>◉ You're exploring <strong>demo data</strong> — a fictional fund with 8 companies and 2 years of history.</span>
          <button className="btn btn-subtle btn-sm" onClick={() => setConfirmClear(true)}>
            Clear demo &amp; start fresh
          </button>
        </div>
      )}

      {confirmClear && (
        <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmClear(false) }}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm clear demo">
            <div className="modal-title">Clear the demo dataset?</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              This removes the fictional fund, companies and data so you can set up your own. Any edits you made to
              the demo (including report narratives) are deleted too.
            </p>
            <div className="modal-actions">
              <button className="btn btn-subtle" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { reset(); nav('/onboarding') }}>Clear &amp; start fresh</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-head page-head-row">
        <div>
          <h1 className="page-title">{data.fund?.name ?? 'Dashboard'}</h1>
          <p className="page-sub">Fund-level impact overview · updates live as data comes in.</p>
        </div>
        <Link to="/reports" className="btn btn-ghost no-print">▣ Generate report</Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-value">{fmtUsd(kpis.totalDeployed)}</div>
          <div className="kpi-label">Capital deployed <Tip text="Sum of deployed capital across all portfolio companies. Committed total shown below." /></div>
        </div>
        <div className="kpi">
          <div className="kpi-value">{kpis.activeCompanies}</div>
          <div className="kpi-label">Active companies ({kpis.totalCompanies} total)</div>
        </div>
        <div className="kpi">
          <div className="kpi-value">{kpis.metricsTracked}</div>
          <div className="kpi-label">Metrics tracked</div>
        </div>
        <div className="kpi">
          <div className="kpi-value">{Math.round(kpis.dataCoverage * 100)}%</div>
          <div className="kpi-label">Data coverage <Tip text="Share of metric assignments that have at least one reported value." /></div>
        </div>
        <div className="kpi">
          <div className="kpi-value" style={{ color: scoreColor(cwScore) }}>{cwScore ?? '—'}</div>
          <div className="kpi-label">Capital-weighted score <Tip text="Average of company impact scores, weighted by deployed capital. Bigger investments move this number more." /></div>
        </div>
      </div>

      {topMetrics.length > 0 && (
        <div className="card">
          <div className="card-title">
            Aggregate impact KPIs
            <Tip text="Latest reported value for each metric, summed across every company that reports it." />
            <span className="spacer" />
            <button className="btn btn-subtle btn-sm no-print" onClick={() => {
              downloadCsv('impact_kpis.csv', [
                ['Metric', 'IRIS+', 'Unit', 'Total (latest)', 'Companies reporting'],
                ...topMetrics.map(t => [t.metric!.name, t.metric!.irisRef ?? '', t.metric!.unit, t.total, t.companies]),
              ])
              showToast('KPIs exported')
            }}>⬇ CSV</button>
          </div>
          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            {topMetrics.map(t => (
              <div className="kpi" key={t.metric!.id} style={{ background: 'rgba(0,232,122,.03)' }}>
                <div className="kpi-value" style={{ fontSize: '1.15rem' }}>{fmtNum(t.total)}<span style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}> {t.metric!.unit}</span></div>
                <div className="kpi-label">{t.metric!.name} · {t.companies} cos</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-title">
            SDG contribution — capital deployed
            <Tip text="Each company's deployed capital counts toward every SDG it is tagged with, so totals can exceed fund size." />
            <span className="spacer" />
            <ChartExportButton svgRef={donutRef} name="sdg_contribution" />
          </div>
          {sdgCapital.length === 0 ? (
            <EmptyState icon="◌" title="No SDG tags yet" sub="Tag companies with SDGs on their profile pages to see this chart." />
          ) : (
            <>
              <DonutChart svgRef={donutRef}
                slices={sdgCapital.map(s => ({ label: s.label, value: s.value, color: s.color }))}
                centerLabel={`${sdgCapital.length} SDGs`} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                {sdgCapital.slice(0, 8).map(s => (
                  <span key={s.n} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                    <SdgChip n={s.n} size={18} /> {fmtUsd(s.value)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="card-title">
            Performance vs targets
            <Tip text="Each company's impact score: progress toward metric targets, weighted by data quality. Click a row to drill in." />
            <span className="spacer" />
            <ChartExportButton svgRef={barsRef} name="company_scores" />
          </div>
          {[...scores.values()].every(s => s.score == null) ? (
            <EmptyState icon="◧" title="No scores yet"
              sub="Set targets on metric assignments and enter data — scores appear as soon as one metric has both." />
          ) : (
            <HBarChart svgRef={barsRef} format={n => String(Math.round(n))}
              rows={data.companies
                .map(c => ({ c, s: scores.get(c.id)?.score }))
                .filter(x => x.s != null)
                .sort((a, b) => (b.s ?? 0) - (a.s ?? 0))
                .map(x => ({ label: x.c.name, value: x.s ?? 0, color: scoreColor(x.s ?? null) }))} />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Data gaps — latest reporting period
          <Tip text="Active-company metric assignments with no value for their most recent complete period. Click one to enter it." />
        </div>
        {gaps.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--ok, #00e87a)', margin: 0 }}>
            ✓ All caught up — every tracked metric has data for its latest period.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {gaps.slice(0, 6).map(g => (
                <Link key={g.assignment.id}
                  to={`/data?company=${encodeURIComponent(g.assignment.companyId)}&period=${encodeURIComponent(g.period)}`}
                  className="nav-link" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>
                    <strong>{g.company?.name ?? 'Unknown company'}</strong>
                    <span style={{ color: 'var(--text-dim)' }}> · {g.metric?.name ?? g.assignment.metricId}</span>
                  </span>
                  <span style={{ color: '#ffb547', whiteSpace: 'nowrap' }}>{formatPeriod(g.period)} missing →</span>
                </Link>
              ))}
            </div>
            {gaps.length > 6 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '8px 0 0' }}>
                +{gaps.length - 6} more — open <Link to="/data">Data Collection</Link> to work through them.
              </p>
            )}
          </>
        )}
      </div>

      {trendMetric && trend.length > 1 && (
        <div className="card">
          <div className="card-title">
            Trend — {trendMetric.name}
            <Tip text="Sum across all companies reporting this metric, per period." />
            <span className="spacer" />
            <ChartExportButton svgRef={trendRef} name="impact_trend" />
          </div>
          <TrendLine svgRef={trendRef} series={trend} />
        </div>
      )}
      {toast}
    </>
  )
}
