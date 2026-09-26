import type { RegimeResult } from '../engine/applicability.js';
import { Check, Cross, Edge, Question, Gap, Arrow } from '../components/Icons';
import { fmtNum } from '../lib/format';
import { toSite } from '../data/ledger';

const REGION: Record<string, string> = { csrd: 'eu', 'aasb-s2': 'au', sg: 'sg' };

export function VerdictChip({ v }: { v: RegimeResult['verdict'] }) {
  const m = {
    yes:      { cls: 'yes', icon: <Check size={13} />,    text: 'Applies' },
    no:       { cls: 'no',  icon: <Cross size={13} />,    text: 'Not in scope' },
    boundary: { cls: 'edge', icon: <Edge size={13} />,    text: 'On the line' },
    unknown:  { cls: 'unk', icon: <Question size={13} />, text: 'Needs input' },
  }[v];
  return <span className={`chip chip-${m.cls}`}>{m.icon}{m.text}</span>;
}

/* A bullet gauge: the track runs to twice the threshold, the tick is the
   threshold, the mark is your value. Beyond the track the mark pins to the
   end with a chevron, so a very large entity does not flatten everything. */
function Gauge({ t }: { t: RegimeResult['tests'][number] }) {
  const max = t.threshold * 2;
  const pos = t.value === null ? null : Math.min(t.value / max, 1);
  const res = t.met === true ? 'met' : t.met === false ? 'unmet' : t.met === 'boundary' ? 'edge' : 'none';
  const word = t.met === true ? 'met' : t.met === false ? 'not met' : t.met === 'boundary' ? 'on the line' : 'not given';
  return (
    <div className={`test test-${res}`}>
      <div className="test-top">
        <span className="test-label">{t.label}</span>
        <span className="test-val">
          <b>{t.value === null ? '—' : fmtNum(t.value)}</b>
          <span className="test-th"> / {t.op === 'over' ? '>' : '≥'} {fmtNum(t.threshold)} {t.unit}</span>
        </span>
      </div>
      <div className="gauge" role="img"
        aria-label={`${t.label}: ${t.value === null ? 'not given' : fmtNum(t.value)} against ${t.op === 'over' ? 'more than' : 'at least'} ${fmtNum(t.threshold)} ${t.unit}, ${word}`}>
        <span className="gauge-th" style={{ left: '50%' }} />
        {pos !== null && <span className={`gauge-mark${pos >= 1 ? ' pinned' : ''}`} style={{ left: `${pos * 100}%` }} />}
      </div>
    </div>
  );
}

export function VerdictCard({ r, focused }: { r: RegimeResult; focused?: boolean }) {
  return (
    <article className={`card verdict region-${REGION[r.code]}${focused ? ' focused' : ''}`} id={`regime-${r.code}`}
      aria-labelledby={`vh-${r.code}`}>
      <header className="verdict-head">
        <div>
          <p className="verdict-market"><span className="swatch" aria-hidden />{r.market}</p>
          <h3 id={`vh-${r.code}`}>{r.name}</h3>
        </div>
        <VerdictChip v={r.verdict} />
      </header>

      <p className="verdict-line">{r.headline}</p>

      {r.tests.length > 0 && <div className="tests">{r.tests.map(t => <Gauge key={t.label} t={t} />)}</div>}

      {r.reasons.length > r.tests.length && (
        <p className="verdict-rule">{r.reasons.slice(r.tests.length).join(' ')}</p>
      )}

      {r.gaps.length > 0 && (
        <ul className="gaps" aria-label="Declared gaps">
          {r.gaps.map(g => <li key={g}><Gap size={14} /><span>{g}</span></li>)}
        </ul>
      )}

      {r.verdict === 'yes' && r.obligations.length > 0 && (
        <a className="verdict-cta" href={toSite(r.obligations[0].instrument.href)}>
          Open {r.obligations[0].instrument.label} <Arrow size={13} />
        </a>
      )}

      <details className="provenance">
        <summary>
          <span className={`grade grade-${r.confidence}`}>{r.confidence} confidence</span>
          <span>· reviewed {r.reviewed} · {r.sources.length} sources</span>
        </summary>
        {r.notes.filter(Boolean).length > 0 && (
          <ul className="notes">{r.notes.filter(Boolean).map(n => <li key={n}>{n}</li>)}</ul>
        )}
        <ul className="sources">
          {r.sources.map(s => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.publisher}</a> — {s.title}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}
