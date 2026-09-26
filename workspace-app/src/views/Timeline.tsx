import { useLayoutEffect, useRef, useState } from 'react';
import type { RegimeResult } from '../engine/applicability.js';
import { fmtDate, fmtWhen, daysUntil } from '../lib/format';
import { toSite } from '../data/ledger';
import { Arrow, Download } from '../components/Icons';

type Ob = RegimeResult['obligations'][number] & { when: string };
const REGION: Record<string, string> = { csrd: 'eu', 'aasb-s2': 'au', sg: 'sg' };
const KIND: Record<string, string> = {
  period: 'Reporting period begins', report: 'Report published', scope3: 'Scope 3 becomes mandatory', decision: 'Decision',
};

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(720);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Timeline(props: {
  regimes: RegimeResult[]; obligations: Ob[]; today: string;
  onExport: (kind: 'ics' | 'csv') => void;
}) {
  const lanes = props.regimes.filter(r => r.verdict === 'yes' && r.obligations.length);
  const obs = props.obligations;
  const [box, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<string | null>(null);

  if (!lanes.length) {
    return (
      <section className="card plan empty" id="plan" aria-labelledby="plan-h">
        <div className="panel-head"><span className="eyebrow">02 · Plan</span><h2 id="plan-h">Obligations</h2></div>
        <p className="empty-line">Nothing to plan yet. When a regime applies, every date it sets appears here, on one axis.</p>
      </section>
    );
  }

  const narrow = width < 640;
  const gutter = narrow ? 0 : 148;
  const todayY = Number(props.today.slice(0, 4));
  const y0 = Math.min(todayY - 1, ...obs.map(o => o.year));
  const y1 = Math.max(todayY + 2, ...obs.map(o => o.year)) + 1;
  const t = (iso: string) => Date.parse(iso + 'T00:00:00Z');
  const T0 = t(`${y0}-01-01`), T1 = t(`${y1}-01-01`);
  // Inner padding so a marker on 1 January of the first year does not sit
  // on the lane labels, and one on 31 December of the last does not clip.
  const PAD = 14;
  const plot = Math.max(240, width - gutter - 12 - PAD * 2);
  const x = (iso: string) => gutter + PAD + ((t(iso) - T0) / (T1 - T0)) * plot;
  const LANE = narrow ? 78 : 64, TOP = 34;
  // The Today pill sits under the lanes, not in the year row, so the two can
  // never collide whatever the date.
  const lanesEnd = TOP + lanes.length * LANE;
  const height = lanesEnd + 30;
  const num = new Map(obs.map((o, i) => [o.id, i + 1]));
  // The pill is sized to its label (10px mono ≈ 6.2px a glyph, plus padding)
  // and kept inside the plot, so it is never clipped at either edge.
  const todayLabel = `TODAY · ${fmtDate(props.today).toUpperCase()}`;
  const PILL = Math.ceil(todayLabel.length * 6.2) + 16;
  const pillX = Math.min(Math.max(x(props.today) - PILL / 2, gutter), gutter + plot + PAD * 2 - PILL);
  const years = Array.from({ length: y1 - y0 }, (_, i) => y0 + i);

  return (
    <section className="card plan" id="plan" aria-labelledby="plan-h">
      <div className="panel-head row">
        <div><span className="eyebrow">02 · Plan</span><h2 id="plan-h">Obligations</h2></div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => props.onExport('ics')}><Download size={14} />Calendar</button>
          <button type="button" className="btn ghost" onClick={() => props.onExport('csv')}><Download size={14} />CSV</button>
        </div>
      </div>

      <div className="tl" ref={box}>
        <svg width={width} height={height} role="img"
          aria-label={`Timeline of ${obs.length} obligations across ${lanes.length} regime${lanes.length > 1 ? 's' : ''}, ${y0} to ${y1 - 1}. The numbered list below describes each one.`}>
          {years.map(y => (
            <g key={y}>
              <line x1={x(`${y}-01-01`)} x2={x(`${y}-01-01`)} y1={TOP - 12} y2={lanesEnd} className="tl-grid" />
              <text x={x(`${y}-01-01`) + (plot / (y1 - y0)) / 2} y={16} className="tl-year" textAnchor="middle">{y}</text>
            </g>
          ))}

          {lanes.map((r, li) => {
            const top = TOP + li * LANE;
            const mine = obs.filter(o => o.regime === r.code);
            return (
              <g key={r.code} className={`tl-lane region-${REGION[r.code]}`}>
                <line x1={gutter} x2={gutter + plot + PAD * 2} y1={top + LANE - 4} y2={top + LANE - 4} className="tl-sep" />
                {narrow ? (
                  <text x={4} y={top + 12} className="tl-lane-label">{r.market} · {r.cohort?.name ?? r.name}</text>
                ) : (<>
                  <rect x={0} y={top + 10} width={4} height={LANE - 24} className="tl-swatch" rx={1} />
                  <text x={14} y={top + 22} className="tl-lane-label">{r.market}</text>
                  <text x={14} y={top + 38} className="tl-lane-sub">{r.cohort?.name ?? r.name}</text>
                </>)}
                {mine.map(o => {
                  const n = num.get(o.id)!;
                  const past = daysUntil(o, props.today) < 0;
                  const on = active === o.id;
                  const common = {
                    tabIndex: 0, role: 'button' as const,
                    'aria-label': `${n}. ${o.label}, ${fmtWhen(o)}`,
                    className: `tl-mark kind-${o.kind}${past ? ' past' : ''}${on ? ' on' : ''}${o.derived ? ' derived' : ''}`,
                    onMouseEnter: () => setActive(o.id), onMouseLeave: () => setActive(null),
                    onFocus: () => setActive(o.id), onBlur: () => setActive(null),
                  };
                  const rowGlyph = top + (narrow ? 34 : 24), rowBar = top + (narrow ? 56 : 44);
                  if (!o.date) {
                    const a = x(`${o.year}-01-01`) + 2, b = x(`${o.year + 1}-01-01`) - 2;
                    return (
                      <g key={o.id} {...common}>
                        <rect x={a} y={rowBar - 4} width={b - a} height={8} rx={4} className="tl-bar" />
                        <circle cx={(a + b) / 2} cy={rowBar} r={8} className="tl-badge" />
                        <text x={(a + b) / 2} y={rowBar + 3.5} textAnchor="middle" className="tl-badge-n">{n}</text>
                      </g>
                    );
                  }
                  const cx = x(o.date);
                  const glyph = o.kind === 'scope3'
                    ? <path d={`M${cx} ${rowGlyph - 6} L${cx + 6} ${rowGlyph + 5} L${cx - 6} ${rowGlyph + 5} Z`} className="tl-glyph" />
                    : <rect x={cx - 5} y={rowGlyph - 5} width={10} height={10} transform={`rotate(45 ${cx} ${rowGlyph})`} className="tl-glyph" />;
                  return (
                    <g key={o.id} {...common}>
                      {glyph}
                      <text x={cx + 10} y={rowGlyph + 4} className="tl-glyph-n">{n}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <g className="tl-today" aria-hidden>
            <line x1={x(props.today)} x2={x(props.today)} y1={TOP - 12} y2={lanesEnd + 6} />
            <rect x={pillX} y={lanesEnd + 6} width={PILL} height={18} rx={2} />
            <text x={pillX + PILL / 2} y={lanesEnd + 18.5} textAnchor="middle">{todayLabel}</text>
          </g>
        </svg>
      </div>

      <div className="tl-legend" aria-hidden>
        <span><i className="lg lg-day" />Exact day</span>
        <span><i className="lg lg-derived" />Day follows from a rule</span>
        <span><i className="lg lg-s3" />Scope 3</span>
        <span><i className="lg lg-year" />Known to the year</span>
        <span><i className="lg lg-decision" />Decision</span>
      </div>

      <ol className="ob-list" aria-label="Obligations in date order">
        {obs.map(o => {
          const n = num.get(o.id)!;
          const d = daysUntil(o, props.today);
          return (
            <li key={o.id} className={`ob region-${REGION[o.regime]}${active === o.id ? ' on' : ''}${d < 0 ? ' past' : ''}`}
              onMouseEnter={() => setActive(o.id)} onMouseLeave={() => setActive(null)}>
              <span className="ob-n">{n}</span>
              <div className="ob-body">
                <p className="ob-title">{o.label}</p>
                <p className="ob-meta">
                  <span className="swatch" aria-hidden />
                  {lanes.find(r => r.code === o.regime)?.market} · {KIND[o.kind]}
                  {o.derived && <span className="ob-derived"> · date follows from a stated rule</span>}
                </p>
                <p className="ob-why">{o.why}</p>
              </div>
              <div className="ob-when">
                <b>{o.date ? fmtDate(o.date) : o.year}</b>
                <span>{d < 0 ? 'passed' : o.date ? `in ${d} days` : 'during the year'}</span>
                <a href={toSite(o.instrument.href)}>{o.instrument.label}<Arrow size={12} /></a>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
