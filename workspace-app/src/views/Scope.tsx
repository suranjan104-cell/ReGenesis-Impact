import type { EntityState } from '../data/entity';
import { NumberField, Segmented, Switch } from '../components/Field';

type Props = { entity: EntityState; set: (fn: (e: EntityState) => EntityState) => void };

const REGIONS = [
  { k: 'eu' as const, name: 'European Union', regime: 'CSRD · ESRS' },
  { k: 'au' as const, name: 'Australia', regime: 'AASB S2' },
  { k: 'sg' as const, name: 'Singapore', regime: 'SGX · ACRA' },
];

/* One form, always on screen. Every change recomputes the whole workspace,
   so the fastest way to understand a threshold is to type either side of it. */
export function Scope({ entity: e, set }: Props) {
  const eu = e.eu!, au = e.au!, sg = e.sg!;
  const patch = <K extends 'eu' | 'au' | 'sg'>(k: K, v: Partial<EntityState[K]>) =>
    set(x => ({ ...x, [k]: { ...x[k], ...v } }));

  return (
    <form className="scope" onSubmit={ev => ev.preventDefault()} aria-labelledby="scope-h">
      <div className="panel-head">
        <span className="eyebrow">01 · Scope</span>
        <h2 id="scope-h">The entity</h2>
      </div>

      <div className="field">
        <label htmlFor="entity-name">Name <span className="optional">optional — stays in this browser</span></label>
        <input id="entity-name" className="name-input" value={e.name} placeholder="Untitled entity"
          onChange={ev => set(x => ({ ...x, name: ev.target.value }))} />
      </div>

      <fieldset className="regions">
        <legend>Where does it report, or sell?</legend>
        {REGIONS.map(r => (
          <button key={r.k} type="button" aria-pressed={!!e.regions[r.k]}
            className={`region region-${r.k}${e.regions[r.k] ? ' on' : ''}`}
            onClick={() => set(x => ({ ...x, regions: { ...x.regions, [r.k]: !x.regions[r.k] } }))}>
            <span className="swatch" aria-hidden />
            <span className="region-name">{r.name}</span>
            <span className="region-regime">{r.regime}</span>
          </button>
        ))}
      </fieldset>

      {e.regions.eu && (
        <fieldset className="block region-eu">
          <legend><span className="swatch" aria-hidden /> European Union</legend>
          <Segmented label="Entity" value={eu.kind ?? 'eu-company'}
            options={[{ value: 'eu-company', label: 'EU company' }, { value: 'non-eu-group', label: 'Non-EU parent group' }]}
            onChange={v => patch('eu', { kind: v })} />
          {eu.kind === 'non-eu-group' ? (
            <NumberField label="Turnover generated in the EU" unit="€m" value={eu.euTurnoverEurM}
              onChange={v => patch('eu', { euTurnoverEurM: v })} />
          ) : (<>
            <div className="pair">
              <NumberField label="Employees" unit="people" value={eu.employees} onChange={v => patch('eu', { employees: v })} />
              <NumberField label="Net turnover" unit="€m" value={eu.turnoverEurM} onChange={v => patch('eu', { turnoverEurM: v })} />
            </div>
            <Switch label="Already reporting under CSRD" hint="Decides wave one or wave two"
              checked={!!eu.alreadyReporting} onChange={v => patch('eu', { alreadyReporting: v })} />
          </>)}
        </fieldset>
      )}

      {e.regions.au && (
        <fieldset className="block region-au">
          <legend><span className="swatch" aria-hidden /> Australia</legend>
          <div className="pair">
            <NumberField label="Consolidated revenue" unit="A$m" value={au.revenueAudM} onChange={v => patch('au', { revenueAudM: v })} />
            <NumberField label="Gross assets" unit="A$m" value={au.assetsAudM} onChange={v => patch('au', { assetsAudM: v })} />
          </div>
          <NumberField label="Employees" unit="people" value={au.employees} onChange={v => patch('au', { employees: v })} />
          <Segmented label="NGER status" value={au.nger ?? 'none'}
            options={[{ value: 'none', label: 'None' }, { value: 'reporter', label: 'Reporter' },
                      { value: 'publication', label: 'Publication threshold' }]}
            onChange={v => patch('au', { nger: v })} />
          <NumberField label="Assets under management, if an asset owner" unit="A$bn"
            value={au.assetOwnerAumAudBn} onChange={v => patch('au', { assetOwnerAumAudBn: v })} />
        </fieldset>
      )}

      {e.regions.sg && (
        <fieldset className="block region-sg">
          <legend><span className="swatch" aria-hidden /> Singapore</legend>
          <Segmented label="Listed on SGX?" value={sg.listed ?? null}
            options={[{ value: true, label: 'Listed' }, { value: false, label: 'Not listed' }]}
            onChange={v => patch('sg', { listed: v })} />
          {sg.listed === true && (
            <Switch label="Straits Times Index constituent" hint="Brings Scope 3 forward"
              checked={!!sg.sti} onChange={v => patch('sg', { sti: v })} />
          )}
          {sg.listed === false && (
            <div className="pair">
              <NumberField label="Annual revenue" unit="S$m" value={sg.revenueSgdM} onChange={v => patch('sg', { revenueSgdM: v })} />
              <NumberField label="Total assets" unit="S$m" value={sg.assetsSgdM} onChange={v => patch('sg', { assetsSgdM: v })} />
            </div>
          )}
        </fieldset>
      )}
    </form>
  );
}
