/* The applicability engine: one entity in, every regime's verdict out.

   It is plain JavaScript with JSDoc types so that two very different callers
   can use the same file — the workspace (through TypeScript, which checks the
   types) and the repository's test suite (through bare Node, with nothing
   installed). There is exactly one implementation of "am I caught".

   Three rules govern it.

   1. It reads the registers, never the regulation. Every threshold, date and
      cohort comes from knowledge/**. The engine contains no number that a
      regulator published.

   2. Equality is not decided. The registers are graded medium and built from
      practitioner summaries; whether a test reads "more than" or "or more" is
      exactly the detail such summaries blur. A value sitting exactly on a
      threshold therefore returns `boundary`, with the reason, instead of a
      confident answer in either direction.

   3. A gap is an answer. Where the register holds a threshold but not a date
      (non-EU groups under CSRD), or says a population leaves scope without
      saying when (wave-one reporters below the Omnibus thresholds), the engine
      says so rather than filling it in. */

/** @typedef {'yes'|'no'|'boundary'|'unknown'} Verdict */
/** @typedef {true|false|'boundary'|null} Met */

/**
 * @typedef {Object} Entity
 * @property {string} [name]
 * @property {{eu?: boolean, au?: boolean, sg?: boolean}} regions
 * @property {{kind?: 'eu-company'|'non-eu-group', employees?: number|null,
 *   turnoverEurM?: number|null, euTurnoverEurM?: number|null,
 *   alreadyReporting?: boolean}} [eu]
 * @property {{revenueAudM?: number|null, assetsAudM?: number|null,
 *   employees?: number|null, nger?: 'none'|'reporter'|'publication',
 *   assetOwnerAumAudBn?: number|null}} [au]
 * @property {{listed?: boolean|null, sti?: boolean, revenueSgdM?: number|null,
 *   assetsSgdM?: number|null}} [sg]
 */

/**
 * @typedef {Object} Test
 * @property {string} label
 * @property {number|null} value
 * @property {number} threshold
 * @property {string} unit
 * @property {'over'|'at_least'} op
 * @property {true|false|'boundary'|null} met
 */

/**
 * @typedef {Object} Obligation
 * @property {string} id
 * @property {string} regime
 * @property {string} label
 * @property {'period'|'report'|'scope3'|'decision'} kind
 * @property {string|null} date   exact day where the register gives one
 * @property {number} year        always present; a report year is a span, not a day
 * @property {boolean} derived    true where the date follows from a stated rule
 *                                rather than being written in the register
 * @property {string} why
 * @property {{label: string, href: string}} instrument
 */

/**
 * @typedef {Object} RegimeResult
 * @property {'csrd'|'aasb-s2'|'sg'} code
 * @property {string} name
 * @property {string} market
 * @property {Verdict} verdict
 * @property {string} headline
 * @property {{code: string, name: string}|null} cohort
 * @property {Test[]} tests
 * @property {string[]} reasons
 * @property {Obligation[]} obligations
 * @property {string[]} notes
 * @property {string[]} gaps
 * @property {string[]} evidence  ledger keys that evidence this regime
 * @property {'high'|'medium'|'low'} confidence
 * @property {string} reviewed
 * @property {{publisher: string, title: string, url: string}[]} sources
 */

/** @param {unknown} v @returns {number|null} */
const num = v => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? null : Number(v);

/** A strict test: above the line is met, on the line is not ours to decide.
 * @param {unknown} value @param {number} threshold @returns {Met} */
function over(value, threshold) {
  const v = num(value);
  if (v === null) return null;
  if (v > threshold) return true;
  if (v === threshold) return 'boundary';
  return false;
}
/** An inclusive test, used only where the register itself says "or more".
 * @param {unknown} value @param {number} threshold @returns {boolean|null} */
function atLeast(value, threshold) {
  const v = num(value);
  if (v === null) return null;
  return v >= threshold;
}

/** Combine tests the way a register says they combine.
 * @param {Met[]} mets @returns {Met} */
function all(mets) {
  if (mets.some(m => m === false)) return false;
  if (mets.some(m => m === null)) return null;
  if (mets.some(m => m === 'boundary')) return 'boundary';
  return true;
}
/** @param {Met[]} mets @returns {Met} */
function atLeastTwo(mets) {
  const yes = mets.filter(m => m === true).length;
  const edge = mets.filter(m => m === 'boundary').length;
  const unk = mets.filter(m => m === null).length;
  if (yes >= 2) return true;                 // decided: in
  if (yes + edge + unk < 2) return false;    // cannot reach two even optimistically
  if (unk > 0) return null;                  // a missing input could still decide it
  return 'boundary';                         // it turns on a threshold's wording
}
/** @param {Met} a @param {Met} b @returns {Met} */
function either(a, b) {
  if (a === true || b === true) return true;
  if (a === 'boundary' || b === 'boundary') return 'boundary';
  if (a === null || b === null) return null;
  return false;
}
/** @param {Met} m @returns {Verdict} */
function toVerdict(m) {
  return m === true ? 'yes' : m === false ? 'no' : m === 'boundary' ? 'boundary' : 'unknown';
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
/** @param {string} iso */
const day = iso => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** @param {string} iso @param {number} n */
const addYears = (iso, n) => `${Number(iso.slice(0, 4)) + n}${iso.slice(4)}`;
/** @param {number|null|undefined} n */
const fmt = n => (n === null || n === undefined) ? '—' : Number(n).toLocaleString('en-GB');

/** @param {Test} t */
function testLine(t) {
  const cmp = t.op === 'over' ? 'more than' : 'at least';
  const val = t.value === null ? 'not given' : `${fmt(t.value)} ${t.unit}`;
  const res = t.met === true ? 'met' : t.met === false ? 'not met'
    : t.met === 'boundary' ? 'exactly on the threshold' : 'unknown';
  return `${t.label}: ${val} against ${cmp} ${fmt(t.threshold)} ${t.unit} — ${res}`;
}

/* ─────────────────────────────── CSRD ─────────────────────────────── */

/**
 * @param {Entity} e
 * @param {any} scope      knowledge/esrs/scope.json
 * @param {any} transition knowledge/esrs/transition.json
 * @returns {RegimeResult}
 */
function csrd(e, scope, transition) {
  const x = e.eu || {};
  const th = scope.thresholds;
  const revised = scope.simplified_esrs;
  /** @type {RegimeResult} */
  const r = {
    code: 'csrd', name: 'CSRD · ESRS', market: 'European Union', verdict: 'unknown',
    headline: '', cohort: null, tests: [], reasons: [], obligations: [], notes: [], gaps: [],
    evidence: ['esrs-transition', 'esrs-materiality', 'esrs-disclosures', 'esrs-taxonomy',
               'esrs-tagging', 'ghg-inventory', 'standards-conformance', 'assurance-readiness'],
    confidence: scope.confidence, reviewed: scope.reviewed, sources: scope.sources,
  };

  if (x.kind === 'non-eu-group') {
    const t = { label: 'EU-generated turnover', value: num(x.euTurnoverEurM),
                threshold: th.non_eu_group.eu_turnover_over_eur_m, unit: '€m', op: /** @type {const} */ ('over'),
                met: over(x.euTurnoverEurM, th.non_eu_group.eu_turnover_over_eur_m) };
    r.tests = [t];
    r.verdict = toVerdict(t.met);
    r.reasons = [testLine(t)];
    if (r.verdict === 'yes') {
      r.headline = 'In scope as a non-EU parent group';
      // The register carries the threshold for this population and no date.
      r.gaps.push('The register holds the EU-turnover threshold for non-EU groups but not the '
        + 'financial year their first report covers. We do not state one.');
    } else if (r.verdict === 'no') r.headline = 'Not in scope as a non-EU parent group';
    else if (r.verdict === 'boundary') r.headline = 'On the EU-turnover threshold';
    else r.headline = 'Needs EU-generated turnover';
    return r;
  }

  const tE = { label: 'Employees', value: num(x.employees), threshold: th.eu_company.employees_over,
               unit: 'people', op: /** @type {const} */ ('over'), met: over(x.employees, th.eu_company.employees_over) };
  const tT = { label: 'Net turnover', value: num(x.turnoverEurM), threshold: th.eu_company.net_turnover_over_eur_m,
               unit: '€m', op: /** @type {const} */ ('over'), met: over(x.turnoverEurM, th.eu_company.net_turnover_over_eur_m) };
  r.tests = [tE, tT];
  r.reasons = [testLine(tE), testLine(tT), 'Both tests must be met — the Omnibus made this AND, not OR.'];
  r.verdict = toVerdict(all([tE.met, tT.met]));

  const wave1 = scope.waves.find(/** @param {any} w */ w => w.status === 'reporting now');
  const wave2 = scope.waves.find(/** @param {any} w */ w => w.first_report_year);

  if (r.verdict === 'yes' && x.alreadyReporting) {
    r.cohort = { code: 'wave-1', name: wave1.wave };
    r.headline = `${wave1.wave} — reporting now`;
    const opts = transition.options.map(/** @param {any} o */ o => o.name).join(' · ');
    r.obligations.push({
      id: 'csrd-fy26-basis', regime: 'csrd', kind: 'decision', date: null,
      year: revised.mandatory_from_fy - 1, derived: true,
      label: `Choose the FY${revised.mandatory_from_fy - 1} basis`,
      why: `Until the revised ESRS bind for FY${revised.mandatory_from_fy} there are ${transition.options.length} `
        + `routes: ${opts}. Entry into force of the revised act is expected ${transition.entry_into_force.expected}.`,
      instrument: { label: 'ESRS · FY2026 routes', href: '/#/esrs' },
    });
    r.obligations.push({
      id: 'csrd-fy26-report', regime: 'csrd', kind: 'report', date: null,
      year: revised.mandatory_from_fy, derived: true,
      label: `FY${revised.mandatory_from_fy - 1} sustainability statement published`,
      why: `${wave1.wave} reports each financial year in the following one; FY${revised.mandatory_from_fy - 1} `
        + 'is the last year before the revised standards bind.',
      instrument: { label: 'ESRS disclosures', href: '/#/esrs' },
    });
    r.obligations.push({
      id: 'csrd-revised-binds', regime: 'csrd', kind: 'period',
      date: `${revised.mandatory_from_fy}-01-01`, year: revised.mandatory_from_fy, derived: false,
      label: 'Revised ESRS bind', why: `Mandatory for financial years beginning on or after 1 January ${revised.mandatory_from_fy}; `
        + `first reports under them in ${revised.first_reports}.`,
      instrument: { label: 'ESRS disclosures', href: '/#/esrs' },
    });
    r.obligations.push({
      id: 'csrd-revised-report', regime: 'csrd', kind: 'report', date: null,
      year: revised.first_reports, derived: false,
      label: `First statement under the revised ESRS`,
      why: `Covering FY${revised.mandatory_from_fy}.`,
      instrument: { label: 'ESRS disclosures', href: '/#/esrs' },
    });
  } else if (r.verdict === 'yes') {
    r.cohort = { code: 'wave-2', name: wave2.wave };
    r.headline = `${wave2.wave} — first report ${wave2.first_report_year}`;
    r.obligations.push({
      id: 'csrd-w2-period', regime: 'csrd', kind: 'period', date: `${wave2.covering_fy}-01-01`,
      year: wave2.covering_fy, derived: true,
      label: `First reporting year begins (FY${wave2.covering_fy})`,
      why: `${wave2.wave} reports first on FY${wave2.covering_fy}. The register gives the year; the day `
        + 'depends on your financial year and is shown as 1 January.',
      instrument: { label: 'ESRS double materiality', href: '/#/esrs' },
    });
    r.obligations.push({
      id: 'csrd-w2-report', regime: 'csrd', kind: 'report', date: null,
      year: wave2.first_report_year, derived: false,
      label: 'First sustainability statement published',
      why: `${wave2.note} It will be prepared under the revised ESRS, which bind from FY${revised.mandatory_from_fy}.`,
      instrument: { label: 'ESRS disclosures', href: '/#/esrs' },
    });
  } else if (r.verdict === 'no' && x.alreadyReporting) {
    r.headline = 'Below the post-Omnibus thresholds';
    r.gaps.push('You report today, but fall below the thresholds the Omnibus introduced. When a '
      + 'wave-one reporter in that position stops reporting is not in our register, so we do not state it.');
  } else if (r.verdict === 'no') {
    r.headline = 'Not in scope';
  } else if (r.verdict === 'boundary') {
    r.headline = 'On a CSRD threshold';
  } else {
    r.headline = 'Needs headcount and turnover';
  }
  r.notes.push(th.eu_company.note);
  return r;
}

/* ───────────────────────────── AASB S2 ───────────────────────────── */

/**
 * @param {Entity} e
 * @param {any} au  knowledge/markets/australia.json
 * @returns {RegimeResult}
 */
function aasb(e, au) {
  const x = e.au || {};
  /** @type {RegimeResult} */
  const r = {
    code: 'aasb-s2', name: au.regime, market: au.name, verdict: 'unknown', headline: '',
    cohort: null, tests: [], reasons: [], obligations: [], notes: [au.test], gaps: [],
    evidence: ['ghg-inventory', 'standards-conformance', 'assurance-readiness'],
    confidence: au.confidence, reviewed: au.reviewed, sources: au.sources,
  };

  const earlierUnsure = [];
  let hit = null;
  for (const c of au.cohorts) {
    const tests = [
      { label: 'Consolidated revenue', value: num(x.revenueAudM), threshold: c.revenue_over_aud_m, unit: 'A$m',
        op: /** @type {const} */ ('over'), met: over(x.revenueAudM, c.revenue_over_aud_m) },
      { label: 'Consolidated gross assets', value: num(x.assetsAudM), threshold: c.assets_over_aud_m, unit: 'A$m',
        op: /** @type {const} */ ('over'), met: over(x.assetsAudM, c.assets_over_aud_m) },
      { label: 'Employees', value: num(x.employees), threshold: c.employees_over, unit: 'people',
        op: /** @type {const} */ ('over'), met: over(x.employees, c.employees_over) },
    ];
    const size = atLeastTwo(tests.map(t => t.met));
    let trig = /** @type {true|false|'boundary'|null} */ (false);
    const trigWhy = [];
    for (const t of c.rule.triggers) {
      if (t === 'nger_publication_threshold' && x.nger === 'publication') { trig = true; trigWhy.push('NGER publication-threshold reporter'); }
      if (t === 'nger_reporter' && (x.nger === 'reporter' || x.nger === 'publication')) { trig = true; trigWhy.push('NGER reporter'); }
      if (t === 'asset_owner') {
        const m = atLeast(x.assetOwnerAumAudBn, c.rule.asset_owner_aum_at_least_aud_bn);
        if (m === true) { trig = true; trigWhy.push(`asset owner with A$${c.rule.asset_owner_aum_at_least_aud_bn}bn or more`); }
      }
    }
    const met = either(size, trig);
    if (met === true) { hit = { c, tests, size, trigWhy }; break; }
    if (met === 'boundary' || met === null) earlierUnsure.push({ c, met });
    if (!r.tests.length) r.tests = tests;   // keep the Group 1 tests for display if nothing hits
  }

  if (hit) {
    const c = hit.c;
    r.verdict = 'yes';
    r.cohort = { code: c.code, name: c.name };
    r.tests = hit.tests;
    r.reasons = hit.tests.map(testLine);
    r.reasons.push(hit.size === true ? 'At least two of the three size tests are met.'
      : `Caught by trigger: ${hit.trigWhy.join(', ')}.`);
    r.headline = `${c.name} — first period from ${day(c.first_period_from)}`;
    if (earlierUnsure.length) {
      r.gaps.push(`You may belong to an earlier group (${earlierUnsure.map(u => u.c.name).join(', ')}): `
        + (earlierUnsure.some(u => u.met === null) ? 'a test for it is missing an input.'
           : 'a test for it sits exactly on its threshold.'));
    }
    r.obligations.push({
      id: `aasb-${c.code}-period`, regime: 'aasb-s2', kind: 'period', date: c.first_period_from,
      year: Number(c.first_period_from.slice(0, 4)), derived: false,
      label: `First AASB S2 reporting period begins`, why: c.note,
      instrument: { label: 'GHG inventory · Scope 1 and 2', href: '/#/ghg' },
    });
    r.obligations.push({
      id: `aasb-${c.code}-report`, regime: 'aasb-s2', kind: 'report', date: null, year: c.first_reports,
      derived: false, label: 'First climate statement lodged', why: `${c.name} lodges its first report in ${c.first_reports}.`,
      instrument: { label: 'AASB S2 report builder', href: '/#/issb' },
    });
    // "Not required in an entity's first reporting period; mandatory from the
    // second" — the register states the rule, the date follows from it.
    r.obligations.push({
      id: `aasb-${c.code}-scope3`, regime: 'aasb-s2', kind: 'scope3', date: addYears(c.first_period_from, 1),
      year: Number(c.first_period_from.slice(0, 4)) + 1, derived: true,
      label: 'Scope 3 becomes mandatory', why: au.scope3,
      instrument: { label: 'GHG inventory · Scope 3', href: '/#/ghg' },
    });
    r.notes.push(au.assurance, au.reliefs);
    return r;
  }

  const anyBoundary = earlierUnsure.some(u => u.met === 'boundary');
  const anyUnknown = earlierUnsure.some(u => u.met === null);
  r.verdict = anyUnknown ? 'unknown' : anyBoundary ? 'boundary' : 'no';
  r.reasons = r.tests.map(testLine);
  r.headline = r.verdict === 'no' ? 'Below every AASB S2 group'
    : r.verdict === 'boundary' ? 'On an AASB S2 threshold' : 'Needs revenue, assets and headcount';
  return r;
}

/* ─────────────────────────── Singapore ─────────────────────────── */

/**
 * @param {Entity} e
 * @param {any} sg  knowledge/markets/singapore.json
 * @returns {RegimeResult}
 */
function singapore(e, sg) {
  const x = e.sg || {};
  const by = /** @param {string} k */ k => sg.cohorts.find(/** @param {any} c */ c => c.rule.combine === k);
  const listedC = by('listed'), stiC = by('sti_constituent'), nlco = by('all');
  /** @type {RegimeResult} */
  const r = {
    code: 'sg', name: sg.regime, market: sg.name, verdict: 'unknown', headline: '', cohort: null,
    tests: [], reasons: [], obligations: [], notes: [sg.test], gaps: [],
    evidence: ['ghg-inventory', 'standards-conformance', 'assurance-readiness'],
    confidence: sg.confidence, reviewed: sg.reviewed, sources: sg.sources,
  };

  if (x.listed === null || x.listed === undefined) {
    r.headline = 'Needs listing status';
    r.reasons = ['Listing status decides this market first.'];
    return r;
  }

  if (x.listed) {
    r.verdict = 'yes';
    r.cohort = { code: listedC.code, name: listedC.name };
    r.headline = `${listedC.name} — from FY${listedC.first_period_from.slice(0, 4)}`;
    r.reasons = ['Every SGX-listed issuer is caught, regardless of size.'];
    r.obligations.push({
      id: 'sg-sgx-period', regime: 'sg', kind: 'period', date: listedC.first_period_from,
      year: Number(listedC.first_period_from.slice(0, 4)), derived: false,
      label: 'IFRS S2-aligned climate reporting begins', why: listedC.note,
      instrument: { label: 'GHG inventory · Scope 1 and 2', href: '/#/ghg' },
    });
    r.obligations.push({
      id: 'sg-sgx-report', regime: 'sg', kind: 'report', date: null, year: listedC.first_reports, derived: false,
      label: 'First climate report', why: `First reports in ${listedC.first_reports}.`,
      instrument: { label: 'ISSB report builder', href: '/#/issb' },
    });
    if (x.sti) {
      r.reasons.push('As a Straits Times Index constituent, Scope 3 is mandatory for you on its own timeline.');
      r.obligations.push({
        id: 'sg-sti-scope3', regime: 'sg', kind: 'scope3', date: stiC.first_period_from,
        year: Number(stiC.first_period_from.slice(0, 4)), derived: false,
        label: 'Scope 3 becomes mandatory', why: stiC.note,
        instrument: { label: 'GHG inventory · Scope 3', href: '/#/ghg' },
      });
    } else {
      r.notes.push(sg.scope3);
    }
    r.notes.push(sg.assurance, sg.reliefs);
    return r;
  }

  const tR = { label: 'Annual revenue', value: num(x.revenueSgdM), threshold: nlco.revenue_over_sgd_m, unit: 'S$m',
               op: /** @type {const} */ ('over'), met: over(x.revenueSgdM, nlco.revenue_over_sgd_m) };
  const tA = { label: 'Total assets', value: num(x.assetsSgdM), threshold: nlco.assets_over_sgd_m, unit: 'S$m',
               op: /** @type {const} */ ('over'), met: over(x.assetsSgdM, nlco.assets_over_sgd_m) };
  r.tests = [tR, tA];
  r.reasons = [testLine(tR), testLine(tA), 'A large non-listed company is caught on both, not either.'];
  r.verdict = toVerdict(all([tR.met, tA.met]));
  if (r.verdict === 'yes') {
    r.cohort = { code: nlco.code, name: nlco.name };
    r.headline = `${nlco.name} — from FY${nlco.first_period_from.slice(0, 4)}`;
    r.obligations.push({
      id: 'sg-nlco-period', regime: 'sg', kind: 'period', date: nlco.first_period_from,
      year: Number(nlco.first_period_from.slice(0, 4)), derived: false,
      label: 'Climate reporting begins', why: nlco.note,
      instrument: { label: 'GHG inventory · Scope 1 and 2', href: '/#/ghg' },
    });
    r.obligations.push({
      id: 'sg-nlco-report', regime: 'sg', kind: 'report', date: null, year: nlco.first_reports, derived: false,
      label: 'First climate report', why: `First reports in ${nlco.first_reports}.`,
      instrument: { label: 'ISSB report builder', href: '/#/issb' },
    });
    r.notes.push(sg.assurance);
  } else if (r.verdict === 'no') r.headline = 'Not in scope as a non-listed company';
  else if (r.verdict === 'boundary') r.headline = 'On a Singapore threshold';
  else r.headline = 'Needs revenue and total assets';
  // The note says "at least"; the field is named _over. Equality is where that
  // difference bites, and the engine will not pick a reading for you.
  if (r.verdict === 'boundary')
    r.gaps.push('The register\'s wording for this test says "at least" while its threshold field is a strict '
      + '"over". On the line exactly, check the ACRA text before relying on either answer.');
  return r;
}

/* ─────────────────────────────── entry ─────────────────────────────── */

/**
 * @param {Entity} entity
 * @param {{scope: any, transition: any, au: any, sg: any}} data
 * @param {string} today YYYY-MM-DD
 */
export function assess(entity, data, today) {
  const e = entity || { regions: {} };
  /** @type {RegimeResult[]} */
  const regimes = [];
  if (e.regions?.eu) regimes.push(csrd(e, data.scope, data.transition));
  if (e.regions?.au) regimes.push(aasb(e, data.au));
  if (e.regions?.sg) regimes.push(singapore(e, data.sg));

  const obligations = regimes
    .filter(r => r.verdict === 'yes')
    .flatMap(r => r.obligations)
    .map(o => ({ ...o, when: o.date || `${o.year}-12-31` }))
    .sort((a, b) => a.when.localeCompare(b.when) || a.id.localeCompare(b.id));

  // "Next" is the first obligation that has not fully passed: a report year
  // is live until the year ends; a dated item is live until its day.
  const next = obligations.find(o => o.when >= today) || null;
  const count = /** @param {Verdict} v */ v => regimes.filter(r => r.verdict === v).length;
  return {
    today, regimes, obligations, next,
    summary: { applies: count('yes'), boundary: count('boundary'), unknown: count('unknown'), out: count('no') },
  };
}

export const _internals = { over, atLeast, all, atLeastTwo, either };
