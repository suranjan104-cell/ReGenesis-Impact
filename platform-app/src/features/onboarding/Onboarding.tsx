import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data/useData'
import { newId } from '../../data/store'
import { buildDemoData } from '../../seed/demoData'
import { Field, Tip } from '../../components/ui'
import { formatMoneyShort, parseMoney } from '../../domain/money'
import { FRAMEWORK_INFO, FUND_TYPES, GEOGRAPHIES, SECTORS } from '../../catalog/dimensions'
import type { Framework, FundType, TheoryOfChange } from '../../domain/types'
import './onboarding.css'

const TOC_STEPS: { key: keyof TheoryOfChange; label: string; help: string; placeholder: string }[] = [
  { key: 'inputs', label: 'Inputs', help: 'What you put in: capital, expertise, networks.', placeholder: 'e.g. $50M fund, sector expertise, local partners…' },
  { key: 'activities', label: 'Activities', help: 'What you do with those inputs.', placeholder: 'e.g. Invest $1–5M in early-stage clean energy companies…' },
  { key: 'outputs', label: 'Outputs', help: 'What is directly produced — countable things.', placeholder: 'e.g. 20 portfolio companies scale their products…' },
  { key: 'outcomes', label: 'Outcomes', help: 'The change that happens for people or planet.', placeholder: 'e.g. Households gain reliable clean energy access…' },
  { key: 'impact', label: 'Impact', help: 'The long-term difference you aim to make.', placeholder: 'e.g. 1M people with improved livelihoods by 2030…' },
]

export default function Onboarding() {
  const { data, update, reset } = useData()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [confirmDemo, setConfirmDemo] = useState(false)

  // Prefill everything from the existing fund so re-running the wizard
  // edits the profile instead of silently wiping it.
  const fund = data.fund

  // Step 1 — profile
  const [name, setName] = useState(fund?.name ?? '')
  const [type, setType] = useState<FundType>(fund?.type ?? 'vc')
  const [aum, setAum] = useState(formatMoneyShort(fund?.aumUsd ?? null))
  const [geos, setGeos] = useState<string[]>(fund?.geographies ?? [])
  const [sectors, setSectors] = useState<string[]>(fund?.sectors ?? [])
  const [nameErr, setNameErr] = useState('')

  // Step 2 — theory of change
  const [toc, setToc] = useState<TheoryOfChange>(fund?.theoryOfChange ?? {
    inputs: '', activities: '', outputs: '', outcomes: '', impact: '',
  })

  // Step 3 — frameworks
  const [frameworks, setFrameworks] = useState<Framework[]>(
    fund?.frameworks?.length ? fund.frameworks : ['iris', 'sdg'],
  )

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  function next() {
    if (step === 0) {
      if (!name.trim()) { setNameErr('Give your fund or portfolio a name to continue.'); return }
      setNameErr('')
    }
    setStep(s => s + 1)
  }

  function finish() {
    const aumNum = parseMoney(aum)
    update(d => ({
      ...d,
      fund: {
        id: d.fund?.id ?? newId('fund'),
        name: name.trim(),
        type,
        aumUsd: aumNum != null && Number.isFinite(aumNum) ? aumNum : null,
        geographies: geos,
        sectors,
        frameworks: frameworks.length ? frameworks : ['iris', 'sdg'],
        theoryOfChange: toc,
        createdAt: d.fund?.createdAt ?? new Date().toISOString(),
        onboarded: true,
      },
    }))
    nav('/dashboard')
  }

  const hasRealData = !data.isDemo && (data.companies.length > 0 || data.dataPoints.length > 0 || !!fund?.onboarded)

  function loadDemo() {
    if (hasRealData) { setConfirmDemo(true); return }
    reset(buildDemoData())
    nav('/dashboard')
  }

  return (
    <div className="ob-wrap">
      <div className="ob-card">
        <div className="ob-brand">
          <div className="app-logo-mark" aria-hidden>RI</div>
          <div>
            <div className="app-logo-name">ReGenesis IMM</div>
            <div className="app-logo-sub">Impact Measurement &amp; Management</div>
          </div>
        </div>

        <div className="steps" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map(i => <div key={i} className={`step-pill ${i <= step ? 'done' : ''}`} />)}
        </div>

        {step === 0 && (
          <>
            <h1 className="ob-title">Welcome. Let's set up your fund.</h1>
            <p className="ob-sub">Three quick steps — about 3 minutes. You can change everything later in Settings.</p>

            <Field label="Fund / portfolio name" error={nameErr}>
              <input className={`field-input ${nameErr ? 'invalid' : ''}`} value={name}
                onChange={e => setName(e.target.value)} placeholder="e.g. Horizon Impact Fund I"
                autoFocus />
            </Field>

            <div className="form-grid">
              <Field label="Investor type">
                <select className="field-select" value={type} onChange={e => setType(e.target.value as FundType)}>
                  {FUND_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Assets under management" hint="Optional — used for context in reports." help="Total capital you manage. Type 50M for $50 million.">
                <input className="field-input" value={aum} onChange={e => setAum(e.target.value)} placeholder="e.g. 50M" inputMode="decimal" />
              </Field>
            </div>

            <Field label="Where do you invest?" hint="Pick all that apply.">
              <div className="chip-row">
                {GEOGRAPHIES.map(g => (
                  <button key={g} type="button"
                    className={`pick-chip ${geos.includes(g) ? 'on' : ''}`}
                    aria-pressed={geos.includes(g)}
                    onClick={() => setGeos(toggle(geos, g))}>{g}</button>
                ))}
              </div>
            </Field>

            <Field label="Which sectors?" hint="Pick all that apply.">
              <div className="chip-row">
                {SECTORS.map(s => (
                  <button key={s} type="button"
                    className={`pick-chip ${sectors.includes(s) ? 'on' : ''}`}
                    aria-pressed={sectors.includes(s)}
                    onClick={() => setSectors(toggle(sectors, s))}>{s}</button>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="ob-title">Your Theory of Change</h1>
            <p className="ob-sub">
              How does your money turn into impact? Fill in any boxes you can — one line each is plenty.
              You can skip this and come back later. <Tip text="A Theory of Change is the story of how your inputs lead to real-world impact. LPs increasingly expect one. Keep it simple." />
            </p>

            <div className="toc-chain" aria-hidden>
              {TOC_STEPS.map((s, i) => (
                <span key={s.key}>
                  <span className={`toc-node ${toc[s.key].trim() ? 'filled' : ''}`}>{s.label}</span>
                  {i < TOC_STEPS.length - 1 && <span className="toc-arrow">→</span>}
                </span>
              ))}
            </div>

            {TOC_STEPS.map(s => (
              <Field key={s.key} label={s.label} help={s.help}>
                <textarea className="field-textarea" rows={2} value={toc[s.key]}
                  placeholder={s.placeholder}
                  onChange={e => setToc({ ...toc, [s.key]: e.target.value })} />
              </Field>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="ob-title">How do you want to report?</h1>
            <p className="ob-sub">
              These are reporting "lenses" — standard ways to describe impact that LPs recognise.
              The defaults work for most funds.
            </p>

            {FRAMEWORK_INFO.map(f => (
              <button key={f.key} type="button"
                className={`fw-option ${frameworks.includes(f.key) ? 'on' : ''}`}
                aria-pressed={frameworks.includes(f.key)}
                onClick={() => setFrameworks(toggle(frameworks, f.key))}>
                <span className="fw-check" aria-hidden>{frameworks.includes(f.key) ? '✓' : ''}</span>
                <span className="fw-body">
                  <span className="fw-name">
                    {f.label}
                    {f.recommended && <span className="tag" style={{ marginLeft: 8 }}>Recommended</span>}
                  </span>
                  <span className="fw-help">{f.help}</span>
                </span>
              </button>
            ))}
          </>
        )}

        <div className="ob-actions">
          {step > 0
            ? <button className="btn btn-subtle" onClick={() => setStep(s => s - 1)}>← Back</button>
            : <button className="btn btn-subtle" onClick={loadDemo}>Explore with demo data</button>}
          {step < 2
            ? <button className="btn btn-primary" onClick={next}>Continue →</button>
            : <button className="btn btn-primary" onClick={finish}>Open my dashboard →</button>}
        </div>

        {confirmDemo && (
          <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) setConfirmDemo(false) }}>
            <div className="modal" role="alertdialog" aria-modal="true" aria-label="Confirm demo data">
              <div className="modal-title">Replace your data with the demo?</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Loading the demo replaces your fund profile, {data.companies.length} companies and{' '}
                {data.dataPoints.length} data points with a fictional portfolio. This cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn btn-subtle" onClick={() => setConfirmDemo(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => { reset(buildDemoData()); nav('/dashboard') }}>
                  Load demo anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
