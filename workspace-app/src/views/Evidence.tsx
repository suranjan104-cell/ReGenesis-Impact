import type { RegimeResult } from '../engine/applicability.js';
import { EVIDENCE, toSite, type LedgerRecord } from '../data/ledger';
import { fmtAgo } from '../lib/format';
import { Check, Gap, Arrow } from '../components/Icons';

const REGION: Record<string, string> = { csrd: 'eu', 'aasb-s2': 'au', sg: 'sg' };
const STALE_DAYS = 365;

type Status = { kind: 'done' | 'gaps' | 'stale' | 'none'; rec?: LedgerRecord };

function statusOf(rec: LedgerRecord | undefined): Status {
  if (!rec) return { kind: 'none' };
  const age = (Date.now() - new Date(rec.ts).getTime()) / 86_400_000;
  if (age > STALE_DAYS) return { kind: 'stale', rec };
  if (rec.gaps && rec.gaps.length) return { kind: 'gaps', rec };
  return { kind: 'done', rec };
}

export function Evidence({ regimes, ledger }: { regimes: RegimeResult[]; ledger: LedgerRecord[] }) {
  const cols = regimes.filter(r => r.verdict === 'yes');
  if (!cols.length) {
    return (
      <section className="card prove empty" id="prove" aria-labelledby="prove-h">
        <div className="panel-head"><span className="eyebrow">03 · Prove</span><h2 id="prove-h">Evidence</h2></div>
        <p className="empty-line">When a regime applies, this shows what it needs evidenced, which instrument produces each piece, and whether you have run it.</p>
      </section>
    );
  }

  const rows: string[] = [];
  for (const r of cols) for (const k of r.evidence) if (!rows.includes(k)) rows.push(k);
  const byKey = new Map(ledger.map(l => [l.key, l]));
  const st = rows.map(k => statusOf(byKey.get(k)));
  const covered = st.filter(s => s.kind === 'done' || s.kind === 'gaps').length;
  const shared = rows.filter(k => cols.filter(r => r.evidence.includes(k)).length > 1);

  return (
    <section className="card prove" id="prove" aria-labelledby="prove-h">
      <div className="panel-head row">
        <div><span className="eyebrow">03 · Prove</span><h2 id="prove-h">Evidence</h2></div>
        <div className="coverage" aria-label={`${covered} of ${rows.length} evidenced`}>
          <span className="coverage-n"><b>{covered}</b>/{rows.length}</span>
          <span className="coverage-bar"><span style={{ width: `${(covered / rows.length) * 100}%` }} /></span>
        </div>
      </div>

      {shared.length > 0 && cols.length > 1 && (
        <p className="insight">
          {shared.map(k => EVIDENCE[k].label).join(', ')} {shared.length > 1 ? 'serve' : 'serves'} every regime
          that applies — run once, evidenced {cols.length} times.
        </p>
      )}

      <div className="mx-wrap">
        <table className="mx">
          <thead>
            <tr>
              <th scope="col">Evidence</th>
              {cols.map(r => (
                <th scope="col" key={r.code} className={`mx-col region-${REGION[r.code]}`}>
                  <span className="swatch" aria-hidden />{r.market}
                </th>
              ))}
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k, i) => {
              const e = EVIDENCE[k], s = st[i];
              return (
                <tr key={k} className={`mx-row row-${s.kind}`}>
                  <th scope="row">
                    <a href={toSite(e.href)}>{e.label}<Arrow size={12} /></a>
                    <span>{e.what}</span>
                  </th>
                  {cols.map(r => (
                    <td key={r.code} className={`mx-cell region-${REGION[r.code]}`}>
                      {r.evidence.includes(k)
                        ? <span className="mx-need" role="img" aria-label={`required for ${r.name}`} />
                        : <span className="mx-no" aria-label="not required">·</span>}
                    </td>
                  ))}
                  <td className="mx-status">
                    {s.kind === 'none' && <span className="st st-none">Not run</span>}
                    {s.kind === 'done' && <span className="st st-done"><Check size={13} />Computed {fmtAgo(s.rec!.ts)}</span>}
                    {s.kind === 'gaps' && <span className="st st-gaps"><Gap size={13} />{s.rec!.gaps!.length} gap{s.rec!.gaps!.length > 1 ? 's' : ''} · {fmtAgo(s.rec!.ts)}</span>}
                    {s.kind === 'stale' && <span className="st st-gaps"><Gap size={13} />Stale · {fmtAgo(s.rec!.ts)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="fine">Read from this browser's evidence ledger, which every instrument writes. Run one in another tab and this updates.</p>
    </section>
  );
}
