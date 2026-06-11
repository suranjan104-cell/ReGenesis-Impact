import { useState } from 'react'
import type { Company } from '../../domain/types'
import { validateCompany } from '../../domain/validation'
import { Field, Modal, SdgChip } from '../../components/ui'
import { GEOGRAPHIES, INSTRUMENTS, SECTORS, STAGES } from '../../catalog/dimensions'
import { SDGS } from '../../catalog/sdgs'
import { newId } from '../../data/store'

export function CompanyForm({ initial, onSave, onClose }: {
  initial?: Company
  onSave: (c: Company) => void
  onClose: () => void
}) {
  const [f, setF] = useState<Company>(initial ?? {
    id: newId('co'),
    name: '', sector: SECTORS[0], geography: GEOGRAPHIES[0],
    instrument: 'equity', investmentDate: new Date().toISOString().slice(0, 10),
    committedUsd: 0, deployedUsd: 0, ownershipPct: null,
    stage: 'early', status: 'active', impactThesis: '', sdgs: [],
    createdAt: new Date().toISOString(),
  })
  const [errs, setErrs] = useState<Record<string, string>>({})

  const set = <K extends keyof Company>(k: K, v: Company[K]) => setF(prev => ({ ...prev, [k]: v }))
  const err = (k: string) => errs[k]

  function submit() {
    const list = validateCompany(f)
    if (list.length) {
      setErrs(Object.fromEntries(list.map(e => [e.field, e.message])))
      return
    }
    onSave(f)
  }

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'Add investment'} onClose={onClose} wide>
      <div className="form-grid">
        <Field label="Company name" error={err('name')}>
          <input className={`field-input ${err('name') ? 'invalid' : ''}`} value={f.name}
            onChange={e => set('name', e.target.value)} placeholder="e.g. SuryaGrid Energy" autoFocus />
        </Field>
        <Field label="Sector" error={err('sector')}>
          <select className="field-select" value={f.sector} onChange={e => set('sector', e.target.value)}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Geography" error={err('geography')}>
          <select className="field-select" value={f.geography} onChange={e => set('geography', e.target.value)}>
            {GEOGRAPHIES.map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Instrument" help="How the capital was provided — equity stake, loan, grant, or a blend.">
          <select className="field-select" value={f.instrument} onChange={e => set('instrument', e.target.value as Company['instrument'])}>
            {INSTRUMENTS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
          </select>
        </Field>
        <Field label="Investment date" error={err('investmentDate')}>
          <input type="date" className="field-input" value={f.investmentDate}
            onChange={e => set('investmentDate', e.target.value)} />
        </Field>
        <Field label="Stage">
          <select className="field-select" value={f.stage} onChange={e => set('stage', e.target.value as Company['stage'])}>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Committed capital (USD)" error={err('committedUsd')} help="Total amount you agreed to invest.">
          <input type="number" min="0" className={`field-input ${err('committedUsd') ? 'invalid' : ''}`}
            value={f.committedUsd || ''} placeholder="0"
            onChange={e => set('committedUsd', Number(e.target.value))} />
        </Field>
        <Field label="Deployed capital (USD)" error={err('deployedUsd')} help="Amount actually transferred so far. Cannot exceed committed.">
          <input type="number" min="0" className={`field-input ${err('deployedUsd') ? 'invalid' : ''}`}
            value={f.deployedUsd || ''} placeholder="0"
            onChange={e => set('deployedUsd', Number(e.target.value))} />
        </Field>
        <Field label="Ownership %" error={err('ownershipPct')} hint="Leave blank for debt or grants.">
          <input type="number" min="0" max="100" step="0.1" className={`field-input ${err('ownershipPct') ? 'invalid' : ''}`}
            value={f.ownershipPct ?? ''} placeholder="—"
            onChange={e => set('ownershipPct', e.target.value === '' ? null : Number(e.target.value))} />
        </Field>
        <Field label="Status">
          <select className="field-select" value={f.status} onChange={e => set('status', e.target.value as Company['status'])}>
            <option value="active">Active</option>
            <option value="exited">Exited</option>
            <option value="written_off">Written off</option>
          </select>
        </Field>
      </div>

      <Field label="Impact thesis" help="One or two sentences: what positive change does this company create, for whom?">
        <textarea className="field-textarea" rows={2} value={f.impactThesis}
          placeholder="e.g. Distributed rooftop solar for SME clusters, displacing diesel generation…"
          onChange={e => set('impactThesis', e.target.value)} />
      </Field>

      <Field label="SDG alignment" hint="Tap the goals this company contributes to.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SDGS.map(s => (
            <button key={s.n} type="button"
              onClick={() => set('sdgs', f.sdgs.includes(s.n) ? f.sdgs.filter(x => x !== s.n) : [...f.sdgs, s.n].sort((a, b) => a - b))}
              aria-pressed={f.sdgs.includes(s.n)}
              title={`SDG ${s.n} — ${s.name}`}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                opacity: f.sdgs.includes(s.n) ? 1 : 0.3,
                transform: f.sdgs.includes(s.n) ? 'scale(1.08)' : 'none',
                transition: 'all .15s',
              }}>
              <SdgChip n={s.n} size={30} />
            </button>
          ))}
        </div>
      </Field>

      <div className="modal-actions">
        <button className="btn btn-subtle" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{initial ? 'Save changes' : 'Add investment'}</button>
      </div>
    </Modal>
  )
}
