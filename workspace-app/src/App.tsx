import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assess } from './engine/applicability.js';
import { loadRegisters, type Registers } from './data/registers';
import { loadEntity, saveEntity, EMPTY, EXAMPLES, type EntityState } from './data/entity';
import { useLedger, EVIDENCE, toSite } from './data/ledger';
import { fmtWhen, todayISO } from './lib/format';
import { toICS, toCSV, download } from './lib/exports';
import { Scope } from './views/Scope';
import { VerdictCard, VerdictChip } from './views/Verdicts';
import { Timeline } from './views/Timeline';
import { Evidence } from './views/Evidence';
import { Palette, type Cmd } from './components/Palette';
import { Sun, Moon, Search, Download, Upload, Cross, Doc } from './components/Icons';

const WORD = ['No', 'One', 'Two', 'Three'];
const THEME_KEY = 'rg_ws_theme';

const INSTRUMENTS = [
  { href: '/#/esrs', label: 'ESRS & CSRD', hint: 'Scope, materiality, disclosures, Taxonomy, FY2026 routes' },
  { href: '/#/ghg', label: 'GHG inventory', hint: 'Scope 1–3, GHG Protocol and ISO 14064-1' },
  { href: '/#/issb', label: 'ISSB · AASB S2 report builder', hint: 'IFRS S1/S2 and AASB S2 statements' },
  { href: '/#/assurance', label: 'Assurance readiness', hint: 'ISSA 5000 fieldwork checks' },
  { href: '/#/factors', label: 'Emission factor register', hint: 'Every factor with its source and grade' },
  { href: '/#/ledger', label: 'Evidence ledger', hint: 'Everything computed, what it rests on' },
  { href: '/#/climate', label: 'Climate scenarios & physical risk', hint: 'NGFS pathways, hazard map' },
  { href: '/#/tools', label: 'ESG due diligence', hint: 'PE diligence, SPO, supply chain' },
  { href: '/#/credits', label: 'Carbon credits', hint: 'Browse, retire, link to inventory' },
  { href: '/#/advisor', label: 'Sage advisor', hint: 'Ask about any framework' },
];

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(() => {
    try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
  });
  useEffect(() => {
    const el = document.documentElement;
    if (theme) el.dataset.theme = theme; else delete el.dataset.theme;
    try { theme ? localStorage.setItem(THEME_KEY, theme) : localStorage.removeItem(THEME_KEY); } catch { /* fine */ }
  }, [theme]);
  const effective = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  return [effective, () => setTheme(effective === 'dark' ? 'light' : 'dark')] as const;
}

export function App() {
  const [reg, setReg] = useState<Registers | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // ?example=<id> opens a worked example, so the site can link straight to
  // one. It replaces the in-browser entity only for this load's first render;
  // the param is then removed so a refresh does not undo the user's edits.
  const [entity, setEntity] = useState<EntityState>(() => {
    const id = new URLSearchParams(location.search).get('example');
    const x = id ? EXAMPLES.find(e => e.id === id) : undefined;
    if (x) { history.replaceState(null, '', location.pathname + location.hash); return structuredClone(x.entity); }
    return loadEntity();
  });
  const [pal, setPal] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [theme, flipTheme] = useTheme();
  const ledger = useLedger();
  const fileIn = useRef<HTMLInputElement>(null);
  const today = todayISO();

  useEffect(() => { loadRegisters().then(setReg).catch(e => setErr(String(e.message || e))); }, []);
  useEffect(() => { saveEntity(entity); }, [entity]);

  const set = useCallback((fn: (e: EntityState) => EntityState) => setEntity(fn), []);
  const a = useMemo(() => reg ? assess(entity, reg, today) : null, [entity, reg, today]);
  const regimeName = useCallback((code: string) => a?.regimes.find(r => r.code === code)?.name ?? code, [a]);

  const exportObs = useCallback((kind: 'ics' | 'csv') => {
    if (!a) return;
    const slug = (entity.name || 'entity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'entity';
    if (kind === 'ics') download(`${slug}-obligations.ics`, toICS(a.obligations, entity.name, regimeName), 'text/calendar');
    else download(`${slug}-obligations.csv`, toCSV(a.obligations, regimeName), 'text/csv');
  }, [a, entity.name, regimeName]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (id.startsWith('regime-')) { setFocus(id); setTimeout(() => setFocus(null), 1600); }
    if (id === 'scope') setTimeout(() => document.getElementById('entity-name')?.focus(), 300);
  };

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPal(v => !v); }
      else if (e.key === '/' && !typing && !pal) { e.preventDefault(); setPal(true); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [pal]);

  const commands: Cmd[] = useMemo(() => {
    const c: Cmd[] = [
      { id: 'go-scope', group: 'Go to', label: 'Scope', hint: 'Describe the entity', run: () => go('scope') },
      { id: 'go-plan', group: 'Go to', label: 'Plan', hint: 'Obligations timeline', run: () => go('plan') },
      { id: 'go-prove', group: 'Go to', label: 'Prove', hint: 'Evidence matrix', run: () => go('prove') },
      ...(a?.regimes ?? []).map(r => ({
        id: `r-${r.code}`, group: 'Regimes', label: r.name, hint: `${r.market} · ${r.headline}`,
        keywords: r.cohort?.name, run: () => go(`regime-${r.code}`),
      })),
      ...INSTRUMENTS.map(i => ({
        id: `i-${i.href}`, group: 'Open an instrument', label: i.label, hint: i.hint,
        run: () => { location.href = toSite(i.href); },
      })),
      ...EXAMPLES.map(x => ({
        id: `x-${x.id}`, group: 'Load a worked example', label: x.label, hint: x.blurb,
        keywords: 'example demo sample', run: () => setEntity(structuredClone(x.entity)),
      })),
      { id: 'a-theme', group: 'Actions', label: theme === 'dark' ? 'Light theme' : 'Dark theme', keywords: 'theme mode appearance', run: flipTheme },
      { id: 'a-ics', group: 'Actions', label: 'Add obligations to calendar', hint: '.ics', keywords: 'export download ical', run: () => exportObs('ics') },
      { id: 'a-csv', group: 'Actions', label: 'Download obligations', hint: '.csv', keywords: 'export spreadsheet', run: () => exportObs('csv') },
      { id: 'a-exp', group: 'Actions', label: 'Export entity', hint: '.json — move it to another machine', keywords: 'save backup',
        run: () => download('entity.json', JSON.stringify(entity, null, 2), 'application/json') },
      { id: 'a-imp', group: 'Actions', label: 'Import entity', hint: '.json', keywords: 'load restore', run: () => fileIn.current?.click() },
      { id: 'a-clr', group: 'Actions', label: 'Clear entity', keywords: 'reset new blank', run: () => setEntity(structuredClone(EMPTY)) },
    ];
    for (const f of reg?.factors.factors ?? []) {
      c.push({
        id: `f-${f.id}`, group: 'Emission factors', label: f.name,
        hint: `${f.value ?? 'not established'}${f.value !== null ? ' ' + f.unit : ''} · ${f.source.publisher} · ${f.confidence}`,
        keywords: `${f.category.replace(/_/g, ' ')} ${f.region} factor emission`,
        run: () => { location.href = toSite('/#/factors'); },
      });
    }
    return c;
  }, [a, reg, entity, theme, flipTheme, exportObs]);

  const any = entity.regions.eu || entity.regions.au || entity.regions.sg;

  return (
    <div className="ws">
      <a className="skip" href="#main">Skip to the workspace</a>
      <header className="mast">
        <a className="brand" href="../" aria-label="ReGenesis Impact — site home">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M2 16 L16 16 L16 2 Z" fill="currentColor" /></svg>
          <span>ReGenesis</span>
        </a>
        <span className="mast-sep" aria-hidden>/</span>
        <span className="mast-where">Workspace</span>
        <div className="mast-right">
          <button type="button" className="btn ghost pal-btn" onClick={() => setPal(true)} aria-keyshortcuts="Control+K Meta+K">
            <Search size={14} /><span>Search</span><kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K</kbd>
          </button>
          <button type="button" className="btn icon" onClick={flipTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      <section className="answer" aria-live="polite">
        {!any || !a ? (<>
          <p className="eyebrow">Climate reporting · European Union · Australia · Singapore</p>
          <h1>What do you owe, to whom, <em>and by when?</em></h1>
          <p className="lede">Describe the entity once. Every regime we track decides itself from sourced registers,
            lays its dates out on one axis, and shows which evidence you already hold.</p>
          <div className="examples" role="group" aria-label="Worked examples">
            {EXAMPLES.map(x => (
              <button key={x.id} type="button" className="example" onClick={() => setEntity(structuredClone(x.entity))}>
                <b>{x.label}</b><span>{x.blurb}</span>
              </button>
            ))}
          </div>
        </>) : (<>
          <p className="eyebrow">{entity.name || 'Untitled entity'} · as of {today}</p>
          <h1>
            {WORD[a.summary.applies] ?? a.summary.applies} regime{a.summary.applies === 1 ? '' : 's'} appl{a.summary.applies === 1 ? 'ies' : 'y'}.
            {a.next && <><br /><em>Next: {a.next.label.charAt(0).toLowerCase() + a.next.label.slice(1)}, {fmtWhen(a.next)}.</em></>}
          </h1>
          <div className="answer-chips">
            {a.regimes.map(r => (
              <button key={r.code} type="button" className={`answer-chip region-${r.code === 'csrd' ? 'eu' : r.code === 'sg' ? 'sg' : 'au'}`}
                onClick={() => go(`regime-${r.code}`)}>
                <span className="swatch" aria-hidden />{r.market}<VerdictChip v={r.verdict} />
              </button>
            ))}
          </div>
        </>)}
      </section>

      {err && <p className="error" role="alert">The registers could not be loaded ({err}). The workspace needs them to decide anything.</p>}

      <main id="main" className="grid">
        <aside className="card scope-card" id="scope">
          <Scope entity={entity} set={set} />
          <div className="scope-foot">
            <p>Saved in this browser only.</p>
            {notice && <p className="notice" role="alert">{notice}</p>}
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => download('entity.json', JSON.stringify(entity, null, 2), 'application/json')}><Download size={14} />Export</button>
              <button type="button" className="btn ghost" onClick={() => fileIn.current?.click()}><Upload size={14} />Import</button>
              <button type="button" className="btn ghost" onClick={() => setEntity(structuredClone(EMPTY))}><Cross size={14} />Clear</button>
            </div>
          </div>
        </aside>

        <div className="results">
          {a && a.regimes.length > 0 && (
            <section className="verdicts" aria-label="Verdicts">
              {a.regimes.map(r => <VerdictCard key={r.code} r={r} focused={focus === `regime-${r.code}`} />)}
            </section>
          )}
          {a && <Timeline regimes={a.regimes} obligations={a.obligations} today={today} onExport={exportObs} />}
          {a && <Evidence regimes={a.regimes} ledger={ledger} />}
          {!a && !err && <p className="loading">Loading the registers…</p>}
        </div>
      </main>

      <footer className="foot">
        <p><Doc size={14} /> Nothing you enter leaves this browser. Verdicts come from registers graded
          {reg ? ` ${reg.scope.confidence}` : ''} and built from practitioner summaries — verify before a filing decision rests on them.</p>
        <p className="foot-meta">
          {reg && <>CSRD reviewed {reg.scope.reviewed} · AASB S2 {reg.au.reviewed} · Singapore {reg.sg.reviewed} · </>}
          {Object.keys(EVIDENCE).length} evidence types · <a href="../">regenesisimpact.in</a>
        </p>
      </footer>

      <input ref={fileIn} type="file" accept="application/json,.json" hidden onChange={async e => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (!f) return;
        try {
          const v = JSON.parse(await f.text());
          if (!v || typeof v !== 'object' || !v.regions) throw new Error('not an entity file');
          setEntity({ ...structuredClone(EMPTY), ...v, regions: { ...EMPTY.regions, ...v.regions },
            eu: { ...EMPTY.eu, ...v.eu }, au: { ...EMPTY.au, ...v.au }, sg: { ...EMPTY.sg, ...v.sg } });
          setNotice(null);
        } catch { setNotice('That file is not an entity exported from this workspace — nothing was changed.'); }
      }} />

      <Palette open={pal} onClose={() => setPal(false)} commands={commands} quiet={['Emission factors']} />
    </div>
  );
}
