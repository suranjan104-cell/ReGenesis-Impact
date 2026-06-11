import { Link } from 'react-router-dom'
import { useData } from '../../data/useData'
import { EmptyState } from '../../components/ui'
import type { ReportKind } from '../../domain/types'

const REPORTS: { kind: ReportKind; icon: string; name: string; desc: string; audience: string }[] = [
  {
    kind: 'annual', icon: '▣', name: 'Annual Impact Report',
    desc: 'The full story: portfolio overview, aggregate KPIs, SDG alignment, company scorecards and your Theory of Change.',
    audience: 'LPs · Board · Public',
  },
  {
    kind: 'lp_quarterly', icon: '◔', name: 'LP Quarterly Summary',
    desc: 'A tight 2-page update: capital deployed, top metric movements this quarter, scores and flags.',
    audience: 'Limited Partners',
  },
  {
    kind: 'sdg_alignment', icon: '◉', name: 'SDG Alignment Summary',
    desc: 'Capital and outcomes mapped to the Sustainable Development Goals, with per-goal detail.',
    audience: 'LPs · ESG teams',
  },
]

export default function ReportsPage() {
  const { data } = useData()

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Reports</h1>
        <p className="page-sub">
          One click builds a report from your live data. Edit the narrative sections right in the report,
          then print to PDF or share the web view.
        </p>
      </div>

      {data.companies.length === 0 ? (
        <EmptyState icon="▣" title="Nothing to report yet"
          sub="Reports populate themselves from your portfolio and data — add companies and metrics first."
          action={<Link to="/portfolio" className="btn btn-primary">Go to Portfolio →</Link>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
          {REPORTS.map(r => (
            <div key={r.kind} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '1.6rem' }} aria-hidden>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.name}</div>
                <span className="tag dim" style={{ marginTop: 4 }}>{r.audience}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.55, flex: 1 }}>{r.desc}</p>
              <Link to={`/reports/view/${r.kind}`} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Generate →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ borderStyle: 'dashed', opacity: 0.75, marginTop: '1.5rem' }}>
        <div className="card-title">How PDF export works</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Open a report, click <strong>Print / Save PDF</strong> and choose "Save as PDF" in the print dialog.
          The report is styled for clean A4 output — charts, tables and your edited narratives included.
        </p>
      </div>
    </>
  )
}
