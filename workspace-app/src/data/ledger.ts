import { useEffect, useState } from 'react';

/* The evidence ledger the instruments write (index.html, rg_ledger_v1).
   Same origin, so the workspace reads it directly — and listens for the
   storage event, so running an instrument in another tab updates the
   evidence board here without a reload. */

export type LedgerRecord = {
  key: string; tool: string; title: string; period?: string; ts: string;
  figures?: Record<string, unknown>; dq?: number | null;
  gaps?: { line: string }[];
};

const KEY = 'rg_ledger_v1';

function read(): LedgerRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];   // a corrupt store must never break the workspace
  }
}

export function useLedger(): LedgerRecord[] {
  const [records, set] = useState<LedgerRecord[]>(read);
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === KEY || e.key === null) set(read()); };
    const vis = () => { if (document.visibilityState === 'visible') set(read()); };
    window.addEventListener('storage', on);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('storage', on); document.removeEventListener('visibilitychange', vis); };
  }, []);
  return records;
}

/* Which instrument writes each record, and what it evidences. Product
   knowledge rather than regulation, so it lives here and not in knowledge/. */
export const EVIDENCE: Record<string, { label: string; what: string; href: string }> = {
  'esrs-transition':      { label: 'FY2026 basis chosen',        what: 'Which ESRS the FY2026 statement is prepared against', href: '/#/esrs' },
  'esrs-materiality':     { label: 'Double materiality',         what: 'Topics in scope, impact and financial',               href: '/#/esrs' },
  'esrs-disclosures':     { label: 'Disclosure requirements',    what: 'Readiness against each ESRS disclosure requirement',  href: '/#/esrs' },
  'esrs-taxonomy':        { label: 'EU Taxonomy Article 8',      what: 'Turnover, CapEx and OpEx KPIs through four gates',    href: '/#/esrs' },
  'esrs-tagging':         { label: 'Digital tagging',            what: 'Readiness for XBRL tagging when it resumes',          href: '/#/esrs' },
  'ghg-inventory':        { label: 'GHG inventory',              what: 'Scope 1, 2 and 3 with every factor sourced',          href: '/#/ghg' },
  'standards-conformance':{ label: 'GHG Protocol & ISO 14064-1', what: 'Twelve conformance conditions, six ISO categories',    href: '/#/ghg' },
  'assurance-readiness':  { label: 'Assurance readiness',        what: 'Ten readiness checks before fieldwork',               href: '/#/assurance' },
};

/** The instruments' pages live one level up from /app/. */
export const toSite = (href: string) => href.replace(/^\/#/, '../#');
