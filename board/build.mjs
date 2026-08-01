/* ═══════════════════════════════════════════════════════════════════
   Builds board.html — "Mandatory, and moving".

   Written to the standard in BENCHMARK.md, derived from published Big 4
   research. The rules that most shape this file:

   · Findings are stated in impersonal third person; "we" appears only in
     the introduction and the methodology.
   · The reader is "companies", "entities", "boards", "reporters" — not "you".
   · Every figure that has a denominator discloses it.
   · Figures are numbered "Figure N" (not "Exhibit" — that is MBB house
     style), titled with the finding, subtitled with what is plotted, and
     closed with a source line.
   · A sentence earns its place if it could be false. Metaphor-jargon
     ("journey", "unlock", "leverage", "paradigm") is banned.
   · ZERO commercial content before the endnotes. Everything about
     ReGenesis Impact lives on the final page, under a heading that says so.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'fs';
import { hbar, vbar, timeline, quadrant, legend, S, NEUTRAL } from './charts.mjs';

const DOC_ID = 'RGI-2026-01';
const CUTOFF = '31 July 2026';

/* ── endnote registry: order here defines the superscript numbers ── */
const SRC = [
  ['austlii','Treasury Laws Amendment (Financial Market Infrastructure and Other Measures) Act 2024, Schedule 4', '9 September 2024', 'legislation.gov.au'],
  ['rg280',  'ASIC, Regulatory Guide 280 “Sustainability reporting” (media release 25-051)', '31 March 2025', 'asic.gov.au'],
  ['aasb',   'AASB S2 “Climate-related Disclosures”', 'September 2024', 'standards.aasb.gov.au'],
  ['auasb',  'AUASB, ASSA 5000 and ASSA 5010 sustainability assurance standards', 'January 2025', 'auasb.gov.au'],
  ['acra',   'ACRA and SGX RegCo, “Extended timelines for most climate reporting requirements”', '25 August 2025', 'acra.gov.sg'],
  ['acra24', 'ACRA and SGX RegCo, climate reporting and assurance roadmap for Singapore', '28 February 2024', 'acra.gov.sg'],
  ['mastp',  'MAS, Guidelines on Environmental Risk Management: transition planning', '5 March 2026', 'mas.gov.sg'],
  ['masfsr', 'MAS, Financial Stability Review 2023, transition-risk analysis', 'November 2023', 'mas.gov.sg'],
  ['nccs',   'National Climate Change Secretariat / Ministry of Sustainability and the Environment, carbon tax', '2026 rates', 'nccs.gov.sg'],
  ['sebi',   'SEBI, Business Responsibility and Sustainability Reporting and BRSR Core assurance framework', 'July 2023', 'sebi.gov.in'],
  ['ifrs',   'IFRS Foundation, jurisdictional profiles on ISSB Standards adoption', '12 June 2025', 'ifrs.org'],
  ['apra',   'APRA, “Mind the Gap: an insurance climate vulnerability assessment”', '24 March 2026', 'apra.gov.au'],
  ['apracva','APRA, Climate Vulnerability Assessment results, five largest banks', 'November 2022', 'apra.gov.au'],
  ['ngfs',   'NGFS, Phase V long-term climate macro-financial scenarios, version 5.0', 'November 2024', 'ngfs.net'],
  ['ngfsret','NGFS, “Statement regarding physical risk estimates in Phase V of NGFS long-term scenarios”', '2025', 'ngfs.net'],
  ['tpt',    'UK Transition Plan Taskforce, Disclosure Framework', '9 October 2023', 'ifrs.org/knowledge-hub'],
  ['iea',    'International Energy Agency, Net Zero Roadmap: a global pathway to keep the 1.5 °C goal in reach', 'September 2023', 'iea.org'],
  ['em',     'Ecosystem Marketplace (Forest Trends), State of the Voluntary Carbon Market 2025', '29 May 2025', 'ecosystemmarketplace.com'],
  ['msci',   'MSCI Carbon Markets, “Carbon credits come of age in 2025”', '2025', 'msci.com'],
  ['wb',     'World Bank, State and Trends of Carbon Pricing 2025', '10 June 2025', 'worldbank.org'],
];
const IDX = Object.fromEntries(SRC.map(([id], i) => [id, i + 1]));
const c = (...ids) => `<sup class="cite">${ids.map(i => IDX[i]).join(',')}</sup>`;

/* ── exhibit stack (McKinsey Global Institute anatomy) ────────────
   Exhibit label is quieter than the action title beneath it; the number
   addresses, the title talks. Footer order is fixed: Note -> Source ->
   signature, and the signature travels with the exhibit.              */
let EXN = 0;
const exhibit = (title, sub, body, { note, source } = {}) => {
  EXN++;
  return `<div class="exhibit">
    <div class="ex-num">Exhibit ${EXN}</div>
    <div class="ex-title">${title}</div>
    ${sub ? `<div class="ex-sub">${sub}</div>` : ''}
    <div class="ex-body">${body}</div>
    ${note ? `<div class="ex-note">Note: ${note}</div>` : ''}
    <div class="ex-source"><span>Source: ${source}</span><em>ReGenesis Impact</em></div>
  </div>`;
};

let PAGE = 0;
/* Page numbers used by the contents page are captured here as the deck is
   built and substituted at the end, so they can never drift out of sync
   with the actual slide order. */
const NAV = {};
const mark = (key) => { NAV[key] = PAGE + 1; return ''; };
const slide = (inner, { ink = false, divider = false, fill = false, cover = false } = {}) => {
  PAGE++;
  // A page carrying an exhibit fills itself, because the exhibit grows. A prose
  // page has nothing elastic in it, so its blocks are distributed instead —
  // which keeps the rhythm even rather than stacking everything at the top.
  const prose = !fill && !divider && !/class="exhibit"/.test(inner);
  return `<section class="slide${ink ? ' slide--ink' : ''}${divider ? ' divider' : ''}${fill ? ' slide--fill' : ''}${prose ? ' slide--prose' : ''}${cover ? ' slide--cover' : ''}">${inner}
    <div class="pagenum">${String(PAGE).padStart(2, '0')}</div>
    <div class="brandmark">REGENESIS IMPACT</div>
  </section>`;
};

const slides = [];

/* ═══════════════════ 01 · COVER ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">Climate disclosure briefing</div>
  <div>
    <h1>Mandatory,<br>and <em style="font-style:italic;color:var(--emerald)">moving</em></h1>
    <div style="height:30px"></div>
    <p class="lede" style="max-width:820px">
      Climate reporting obligations across Asia-Pacific: who is captured, when they
      file, and what has changed since the deadlines were first set. Ten exhibits,
      twenty sources, and both dates wherever a deadline has been revised.
    </p>
  </div>
  <div class="cover-meta">
    <div>
      <h4>In this briefing</h4>
      <p>Three markets · 10 exhibits · 20 sources</p>
    </div>
    <div>
      <h4>Jurisdictions covered</h4>
      <p>Australia · Singapore · India</p>
    </div>
    <div>
      <h4>Standards referenced</h4>
      <p>AASB S1/S2 · IFRS S1/S2 · BRSR · TCFD · NGFS</p>
    </div>
  </div>
  <div style="font-family:var(--font-mono);font-size:15px;letter-spacing:.1em;color:var(--ink-muted);
              padding-top:22px;border-top:1px solid var(--rule)">
    JULY 2026 &nbsp;·&nbsp; DATA AS AT ${CUTOFF.toUpperCase()} &nbsp;·&nbsp; ${DOC_ID}
  </div>
`, { cover: true }));

/* ═══════════════════ 02 · CONTENTS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">Contents</div>
  <h2 style="margin-bottom:26px">What is in this briefing.</h2>
  <div class="toc">
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Introduction</span><span class="toc-sub">Why the date matters more than the standard</span><span class="toc-page">{{P:intro}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Key findings</span><span class="toc-sub">Six figures that define the obligation</span><span class="toc-page">{{P:findings}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Executive summary</span><span class="toc-sub"></span><span class="toc-page">{{P:summary}}</span></div>
    <div class="toc-row"><span class="toc-num">01</span><span class="toc-title">The obligation</span><span class="toc-sub">Thresholds, phase-in dates and assurance across three markets</span><span class="toc-page">{{P:sec1}}</span></div>
    <div class="toc-row"><span class="toc-num">02</span><span class="toc-title">The evidence</span><span class="toc-sub">What supervisors have measured, and what it showed</span><span class="toc-page">{{P:sec2}}</span></div>
    <div class="toc-row"><span class="toc-num">03</span><span class="toc-title">The capability gap</span><span class="toc-sub">Where the obligation and the available tooling diverge</span><span class="toc-page">{{P:sec3}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">What this means</span><span class="toc-sub">Five actions, by cohort and date</span><span class="toc-page">{{P:means}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">About the research</span><span class="toc-sub">Scope, method and limitations</span><span class="toc-page">{{P:method}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Endnotes</span><span class="toc-sub">Twenty sources</span><span class="toc-page">{{P:notes}}</span></div>
  </div>
  <div class="glance">
    <div class="glance-col">
      <h4>How to read this</h4>
      <p>Each exhibit carries its own source line and, where relevant, a note on
      what is excluded. Superscripts resolve to the endnotes. Dates that have been
      revised show both the original and the current position.</p>
    </div>
    <div class="glance-col">
      <h4>What is not covered</h4>
      <p>The European CSRD, the United States, and voluntary frameworks except
      where a mandatory obligation references them. This is a compilation of
      published regulatory positions, not a survey of company practice.</p>
    </div>
  </div>
`));

/* ═══════════════════ 03 · INTRODUCTION ═══════════════════ */
mark('intro');
slides.push(slide(`
  <div class="eyebrow">Introduction</div>
  <h2>The date, not the standard,<br>sets the work.</h2>
  <p style="margin-bottom:22px;max-width:940px">
    Between January 2025 and July 2027, climate disclosure across three Asia-Pacific
    markets moves from a voluntary exercise to a filed obligation, and then to an
    audited one. The standards themselves are converging: Australia's AASB S2 is built
    on IFRS S2,${c('aasb')} and Singapore's roadmap is explicitly ISSB-aligned.${c('acra24')}
    What differs between markets is not the substance of what must be disclosed, but
    which entities are captured and when they first file.
  </p>
  <p style="margin-bottom:22px;max-width:940px">
    That distinction carries more weight than it appears to. A first reporting period
    determines when an entity needs a defensible emissions baseline, and assurance
    tests prior-year comparatives. An entity that begins measuring in the year it
    reports has no history to compare against.
  </p>
  <div class="finding">
    <div class="finding-lab">Scope of this briefing</div>
    <p>The obligations as they stood at ${CUTOFF} — thresholds, phase-in dates, the
    assurance ramp, and the supervisory stress tests now sitting behind them. Where
    deadlines have been revised, both the original and the current date are shown.
    Every figure is referenced to the endnotes on page 24.</p>
  </div>
`));

/* ═══════════════════ 04 · KEY FINDINGS ═══════════════════ */
mark('findings');
slides.push(slide(`
  <div class="eyebrow">Key findings</div>
  <h2>Six figures define the obligation.</h2>
  <p class="dek">Three markets have set mandatory climate disclosure on different
  gating rules and different dates. Two of those dates have already moved once.
  These are the six numbers that determine which entities are captured, when they
  first file, and what the requirement costs to meet.</p>
  <div class="statrow statrow--3 statrow--grow" style="margin-bottom:18px">
    <div class="stat"><div class="stat-num">A$50<small>m</small></div>
      <div class="stat-lab">revenue at which Australian entities are captured from July 2027${c('austlii')}</div></div>
    <div class="stat"><div class="stat-num">FY2030</div>
      <div class="stat-lab">revised first reporting year for Singapore's large non-listed companies, from FY2027${c('acra')}</div></div>
    <div class="stat"><div class="stat-num">Sep<br><small>2027</small></div>
      <div class="stat-lab">MAS transition-planning guidelines take effect for banks, insurers and asset managers${c('mastp')}</div></div>
  </div>
  <div class="statrow statrow--3 statrow--grow">
    <div class="stat"><div class="stat-num">1 in 4</div>
      <div class="stat-lab">Australian households in freestanding properties projected uninsured by 2050, from 1 in 7 today${c('apra')}</div></div>
    <div class="stat"><div class="stat-num">S$45</div>
      <div class="stat-lab">Singapore carbon tax per tCO<sub>2</sub>e from 2026, rising from S$5 in 2023${c('nccs')}</div></div>
    <div class="stat"><div class="stat-num">36</div>
      <div class="stat-lab">jurisdictions adopting or finalising adoption of ISSB standards, representing about 60% of global GDP${c('ifrs')}</div></div>
  </div>
`));

/* ═══════════════════ 05 · EXECUTIVE SUMMARY ═══════════════════ */
mark('summary');
slides.push(slide(`
  <div class="eyebrow">Executive summary</div>
  <h2>Converging standards,<br>diverging timetables.</h2>
  <p style="margin-bottom:18px;max-width:950px">
    Three markets now require climate disclosure on a statutory or listing-rule basis.
    Australia legislated it into the Corporations Act with effect from 1 January
    2025;${c('austlii')} Singapore set an ISSB-aligned roadmap for listed issuers and
    large non-listed companies;${c('acra24')} India has required BRSR of its top 1,000
    listed companies by market capitalisation since FY2022–23.${c('sebi')}
  </p>
  <p style="margin-bottom:18px;max-width:950px">
    The requirements are more alike than different. All three inherit the TCFD
    architecture of governance, strategy, risk management, and metrics and targets.
    An emissions inventory built once to the GHG Protocol supports all three filings.
    The cost sits in translation between disclosure regimes, not in the underlying
    measurement.
  </p>
  <p style="margin-bottom:18px;max-width:950px">
    Timetables, however, have proved unstable. In August 2025 ACRA and SGX RegCo
    deferred most Singapore deadlines, moving large non-listed companies from FY2027
    to FY2030 and their assurance obligation from FY2029 to FY2032.${c('acra')} The
    direction of travel did not change; the runway did. Deferral is not withdrawal,
    and entities that treat it as such will arrive at the revised date with the
    baseline problem they would have had at the original one.
  </p>
  <p style="max-width:950px">
    Two developments have made the requirement harder rather than easier. Assurance
    escalates from limited to reasonable over all Australian climate disclosures from
    1 July 2030.${c('auasb')} And the NGFS raised projected physical-risk damages two-
    to four-fold in its November 2024 scenarios,${c('ngfs')} so scenario analysis run
    on earlier vintages now returns a materially different answer on the same inputs.
  </p>
`));

/* ═══════════════════ 06 · DIVIDER 01 ═══════════════════ */
mark('sec1');
slides.push(slide(`
  <div class="sec-num">01</div>
  <h2>The obligation</h2>
  <p class="sec-lead">Which entities are captured in each market, when they first
  report, and what the standards require of them. Where deadlines have been revised,
  both dates are shown.</p>
  <div class="sec-toc">
    <div><span>07</span>Three markets, three gating rules</div>
    <div><span>11</span>Singapore: deferred, not withdrawn</div>
    <div><span>08</span>Australia: the threshold falls tenfold</div>
    <div><span>12</span>Singapore: the carbon price</div>
    <div><span>09</span>Australia: what AASB S2 asks for</div>
    <div><span>13</span>India: assurance widens down the ranking</div>
    <div><span>10</span>Singapore: MAS on transition planning</div>
    <div></div>
  </div>
`, { fill: true }));

/* ═══════════════════ 07 · FIGURE 1 — TIMELINE ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation</div>
  <h2>Three markets, three<br>gating rules.</h2>
  ${exhibit(
    'No two markets capture the same entities, and none phase in together.',
    'First mandatory reporting period by cohort. Solid indicates mandatory disclosure in force; translucent indicates the assurance obligation.',
    legend([{ c: S.s2, label: 'Australia' }, { c: S.s1, label: 'Singapore' }, { c: S.s3, label: 'India' }]) +
    timeline({
      years: [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032],
      laneH: 54, gap: 13, labelW: 258,
      rows: [
        { label: 'AU · Group 1', c: S.s2, spans: [{ from: 2025, to: 2031, text: 'from 1 Jan 2025' }, { from: 2032, to: 2032, soft: true }] },
        { label: 'AU · Group 2', c: S.s2, spans: [{ from: 2026, to: 2031, text: 'from 1 Jul 2026' }, { from: 2032, to: 2032, soft: true }] },
        { label: 'AU · Group 3', c: S.s2, spans: [{ from: 2027, to: 2031, text: 'from 1 Jul 2027' }, { from: 2032, to: 2032, soft: true }] },
        { label: 'SG · listed (STI)', c: S.s1, spans: [{ from: 2025, to: 2031, text: 'FY2025, Scope 1 & 2' }, { from: 2032, to: 2032, soft: true }] },
        { label: 'SG · listed ≥ S$1bn', c: S.s1, spans: [{ from: 2028, to: 2031, text: 'FY2028' }, { from: 2032, to: 2032, soft: true }] },
        { label: 'SG · large non-listed', c: S.s1, spans: [{ from: 2030, to: 2031, text: 'FY2030' }, { from: 2032, to: 2032, soft: true, text: 'FY2032' }] },
        { label: 'IN · top 1,000 listed', c: S.s3, spans: [{ from: 2025, to: 2026, text: 'BRSR in force' }, { from: 2027, to: 2032, soft: true, text: 'BRSR Core assurance, widening to top 1,000' }] },
      ],
    }),
    {
      note: 'Australian periods are annual reporting periods beginning on or after the date shown. Singapore and Indian cohorts are stated by financial year.',
      source: 'Treasury Laws Amendment Act 2024; ACRA and SGX RegCo, August 2025; SEBI; ReGenesis Impact analysis',
    }
  )}
  <p style="font-size:19px;margin-top:16px">
    Australia gates on <strong>company size</strong>,${c('austlii')} Singapore on
    <strong>listing status and market capitalisation</strong>,${c('acra')} India on
    <strong>market-capitalisation rank</strong>.${c('sebi')} An entity operating in all
    three can face three different first-report dates for one emissions inventory.
  </p>
`));

/* ═══════════════════ 08 · FIGURE 2 — AU THRESHOLDS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation · Australia</div>
  <h2>The threshold falls by an<br>order of magnitude.</h2>
  ${exhibit(
    'By July 2027 the Australian regime reaches entities ten times smaller than in its first year.',
    'Size thresholds by group. An entity is captured if it meets at least two of the three criteria.',
    `<table class="dt">
      <tr><th>Cohort</th><th>Revenue</th><th>Gross assets</th><th>Employees</th><th>First period begins</th></tr>
      <tr><td class="k">Group 1</td><td class="num">≥ A$500m</td><td class="num">≥ A$1bn</td><td class="num">≥ 500</td><td class="k">on/after 1 Jan 2025</td></tr>
      <tr><td class="k">Group 2</td><td class="num">≥ A$200m</td><td class="num">≥ A$500m</td><td class="num">≥ 250</td><td class="k">on/after 1 Jul 2026</td></tr>
      <tr><td class="k">Group 3</td><td class="num">≥ A$50m</td><td class="num">≥ A$25m</td><td class="num">≥ 100</td><td class="k">on/after 1 Jul 2027</td></tr>
    </table>`,
    {
      note: 'entities registered under the National Greenhouse and Energy Reporting Act are captured irrespective of size; asset owners with A$5bn or more under management are captured from Group 2.',
      source: 'Treasury Laws Amendment Act 2024, Schedule 4; ASIC Regulatory Guide 280',
    }
  )}
  <p style="font-size:19px;margin-top:18px">
    Group 1 broadly describes entities that already carry a sustainability function.
    Group 3, at A$50m of revenue and 100 employees, generally does not.${c('austlii', 'rg280')}
  </p>
`));

/* ═══════════════════ 09 · FIGURE 3 — AASB S2 + ASSURANCE ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation · Australia</div>
  <h2>What AASB S2 asks for,<br>and when it is audited.</h2>
  <table class="dt" style="margin-bottom:6px">
    <tr><th style="width:200px">Pillar</th><th>Requirement</th></tr>
    <tr><td class="k">Governance</td><td>Board and management processes, controls and procedures for overseeing climate-related risks and opportunities.</td></tr>
    <tr><td class="k">Strategy</td><td>Material risks and opportunities, anticipated financial effects, transition plans, and climate scenario analysis as a resilience assessment.</td></tr>
    <tr><td class="k">Risk management</td><td>Processes to identify, assess, prioritise and monitor climate-related risks.</td></tr>
    <tr><td class="k">Metrics and targets</td><td>Scope 1 and 2 emissions from year one; material Scope 3 emissions from year two.</td></tr>
  </table>
  ${exhibit(
    'Assurance escalates from limited to reasonable over all climate disclosures by 2030.',
    'Assurance obligation for Australian reporters, annual periods beginning on or after the date shown.',
    timeline({
      years: [2025, 2026, 2027, 2028, 2029, 2030], laneH: 44, gap: 12, labelW: 258, w: 928,
      rows: [
        { label: 'Limited assurance', c: S.s2, spans: [{ from: 2025, to: 2029, text: 'governance, parts of strategy, Scope 1 and 2 — widening' }] },
        { label: 'Reasonable assurance', c: S.s2, spans: [{ from: 2030, to: 2030, text: 'all disclosures' }] },
      ],
    }),
    { source: 'AUASB, ASSA 5000 and ASSA 5010; AASB S2' }
  )}
  <p style="font-size:18.5px;margin-top:14px">
    ASIC has provided a fixed three-year, regulator-only liability window from 1 January
    2025 covering Scope 3, scenario analysis, transition plans and forward-looking
    statements. It is not a general immunity, and it does not extend to statements made
    outside the sustainability report.${c('rg280')}
  </p>
`));

/* ═══════════════════ 10 · MAS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation · Singapore</div>
  <h2>Transition planning became<br>a supervisory expectation.</h2>
  <p style="margin-bottom:22px;max-width:950px">
    MAS issued guidelines on transition planning for banks, insurers and asset managers
    on 5 March 2026, effective September 2027 after an 18-month transition period. They
    sit as an addendum to the existing environmental risk management guidelines rather
    than replacing them.${c('mastp')}
  </p>
  <table class="dt" style="margin-bottom:22px">
    <tr><th style="width:270px">Expectation</th><th>What it requires</th></tr>
    <tr><td class="k">Risk-proportionate process</td><td>A transition-planning process proportionate to the risk profile of the business model and the local circumstances of operations.</td></tr>
    <tr><td class="k">Engagement over withdrawal</td><td>Engaging and supporting clients through transition rather than withdrawing financing from exposed sectors.</td></tr>
    <tr><td class="k">Multi-year horizon</td><td>A forward-looking view covering both physical and transition risk.</td></tr>
  </table>
  <div class="finding">
    <div class="finding-lab">Second-order effect</div>
    <p>A supervised lender or insurer assessed on its portfolio's transition will put
    those questions to its customers. For companies outside the scope of mandatory
    reporting, this is the more probable route by which disclosure becomes a
    requirement. MAS found in 2023 that a disorderly transition would be materially
    more costly for banks and insurers than an early, orderly one.${c('masfsr')}</p>
  </div>
`));

/* ═══════════════════ 11 · FIGURE 4 — SG DEFERRAL ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation · Singapore</div>
  <h2>Deferral is not withdrawal.</h2>
  ${exhibit(
    'Every Singapore cohort moved back, some by five years.',
    'First reporting year before and after the revision announced 25 August 2025.',
    `<table class="dt">
      <tr><th>Cohort</th><th style="width:230px">Original</th><th style="width:180px">Revised</th></tr>
      <tr><td class="k">Large non-listed companies<br><span style="font-size:15px;opacity:.68">revenue ≥ S$1bn and assets ≥ S$500m</span></td>
          <td class="num">FY2027, Scope 1 and 2</td><td class="k">FY2030</td></tr>
      <tr><td class="k">Large non-listed companies<br><span style="font-size:15px;opacity:.68">external limited assurance</span></td>
          <td class="num">FY2029</td><td class="k">FY2032</td></tr>
      <tr><td class="k">Listed, non-STI, ≥ S$1bn market cap<br><span style="font-size:15px;opacity:.68">other ISSB-based disclosures</span></td>
          <td class="num">FY2025</td><td class="k">FY2028</td></tr>
      <tr><td class="k">Listed, non-STI, &lt; S$1bn market cap</td><td class="num">FY2025</td><td class="k">FY2030</td></tr>
    </table>`,
    {
      note: 'ACRA and SGX RegCo cited the uncertain global economic landscape and varying levels of company readiness.',
      source: 'ACRA and SGX RegCo, 25 August 2025; roadmap of 28 February 2024',
    }
  )}
  <p style="font-size:19px;margin-top:18px">
    Assurance tests prior-year comparatives. An entity that begins measuring in FY2030
    reaches its first assured report with the same absence of history it would have had
    in FY2027.${c('acra')}
  </p>
`));

/* ═══════════════════ 12 · FIGURE 5 — CARBON TAX ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation · Singapore</div>
  <h2>The price signal moved<br>faster than the deadlines.</h2>
  ${exhibit(
    'Singapore’s carbon tax rose ninefold between 2023 and 2026.',
    'Headline rate, S$ per tonne of CO<sub>2</sub> equivalent, for facilities emitting 25,000 tCO<sub>2</sub>e a year or more.',
    vbar({
      h: 372, color: S.s1,
      data: [
        { label: '2019–2023', v: 5, disp: 'S$5' },
        { label: '2024–2025', v: 25, disp: 'S$25' },
        { label: '2026–2027', v: 45, disp: 'S$45' },
        { label: 'by 2030', v: 65, disp: 'S$50–80', outline: true },
      ],
    }),
    {
      note: 'the 2030 range is stated policy intent and is not legislated, shown here as a dashed outline. Up to 5% of taxable emissions may be offset with eligible international carbon credits.',
      source: 'National Climate Change Secretariat; Ministry of Sustainability and the Environment',
    }
  )}
  <p style="font-size:19px;margin-top:16px">
    The Carbon Pricing Act has been in force since 1 January 2019. The rate applies to
    facility-level emissions and is independent of the disclosure obligations above,
    though both draw on the same inventory.${c('nccs')}
  </p>
`));

/* ═══════════════════ 13 · FIGURE 6 — INDIA ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">01 — The obligation · India</div>
  <h2>Assurance widens down<br>the ranking.</h2>
  ${exhibit(
    'BRSR Core assurance reaches the full top 1,000 by FY2026–27.',
    'Companies subject to BRSR Core assurance, by market-capitalisation rank and financial year.',
    hbar({
      labelW: 210, rowH: 58,
      data: [
        { label: 'FY2023–24', v: 150, disp: 'top 150', c: S.s3 },
        { label: 'FY2024–25', v: 250, disp: 'top 250', c: S.s3 },
        { label: 'FY2025–26', v: 500, disp: 'top 500', c: S.s3 },
        { label: 'FY2026–27', v: 1000, disp: 'top 1,000', c: S.s3 },
      ],
    }),
    {
      note: 'Base: the top 1,000 listed companies by market capitalisation, for which BRSR has been mandatory since FY2022–23.',
      source: 'SEBI, BRSR and BRSR Core assurance framework',
    }
  )}
  <p style="font-size:19px;margin-top:18px">
    BRSR is not an ISSB standard. It carries its own KPI structure and a broader social
    dimension, so a group reporting in all three markets maintains one emissions
    inventory against three disclosure structures.${c('sebi')}
  </p>
`));

/* ═══════════════════ 14 · DIVIDER 02 ═══════════════════ */
mark('sec2');
slides.push(slide(`
  <div class="sec-num">02</div>
  <h2>The evidence</h2>
  <p class="sec-lead">What prudential regulators have now measured, and what those
  exercises returned. These are the published numbers behind the requirement, not
  projections commissioned to support it.</p>
  <div class="sec-toc">
    <div><span>15</span>The estimate that moved supervisory opinion</div>
    <div><span>18</span>What separates a plan from a target</div>
    <div><span>16</span>APRA prices the protection gap</div>
    <div><span>19</span>Disclosure quality and capital allocation</div>
    <div><span>17</span>The four reference scenarios</div>
    <div><span>20</span>Three carbon-market figures</div>
  </div>
`, { fill: true }));

/* ═══════════════════ 15 · WHY SUPERVISORS MOVED ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">02 — The evidence</div>
  <h2>The estimate that moved<br>supervisory opinion.</h2>
  <div class="finding" style="margin-bottom:24px">
    <div class="finding-lab">A caveat that travels with the numbers</div>
    <p style="font-size:23px;line-height:1.42">The academic paper underpinning the
    physical-risk damage function in NGFS Phase V has since been <strong>retracted</strong>.
    The NGFS has issued a statement confirming this and noting that it cannot be excluded
    that economic effects turn out more severe than Phase V estimates. Scenario outputs
    that do not incorporate those physical loss estimates are unaffected, as are the
    short-term scenarios.${c('ngfsret')}</p>
  </div>
  <p style="margin-bottom:22px;max-width:950px">
    The finding matters to supervisors because the committed portion is largely
    independent of near-term emissions choices. It describes damage already priced into
    the physical system rather than damage contingent on future policy.
  </p>
  <div class="statrow statrow--2">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">2–4×</div>
      <div class="stat-lab">increase in projected physical-risk damages, NGFS Phase V against earlier vintages${c('ngfs')}</div></div>
    <div class="stat"><div class="stat-num">&gt;24<small>%</small></div>
      <div class="stat-lab">of global emissions covered by a carbon price, 2024${c('wb')}</div></div>
  </div>
`));

/* ═══════════════════ 16 · FIGURE 7 — APRA ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">02 — The evidence · Australia</div>
  <h2>A regulator put a number<br>on the protection gap.</h2>
  ${exhibit(
    'Expected weather-peril losses more than double by 2050 under the higher physical-risk scenario.',
    'Expected national annual weather-peril losses, A$ billion.',
    vbar({
      h: 336,
      data: [
        { label: '2024 actual', v: 7, disp: 'under $7bn', c: NEUTRAL },
        { label: '2050, higher physical risk', v: 16, disp: 'over $16bn', c: S.s2 },
      ],
    }),
    {
      note: 'APRA modelled two severe but plausible scenarios to 2050. The 2024 baseline is shown recessive; the projection is the finding.',
      source: 'APRA, “Mind the Gap: an insurance climate vulnerability assessment”, March 2026',
    }
  )}
  <div class="statrow statrow--2" style="margin-top:20px">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">1 in 4</div>
      <div class="stat-lab">households in freestanding properties projected uninsured by 2050, from 1 in 7 today${c('apra')}</div></div>
    <div class="stat"><div class="stat-num">2022</div>
      <div class="stat-lab">banking assessment of the five largest banks found losses concentrated in northern-Australia mortgages and transition-exposed lending${c('apracva')}</div></div>
  </div>
`));

/* ═══════════════════ 17 · FIGURE 8 — NGFS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">02 — The evidence</div>
  <h2>Scenario analysis is a<br>resilience test, not a narrative.</h2>
  ${exhibit(
    'The reference scenarios pair transition risk against physical risk.',
    'NGFS Phase V scenario families, version 5.0, November 2024.',
    quadrant({
      w: 928, h: 560, xLab: 'Transition risk', yLab: 'Physical risk',
      quads: [
        { tag: 'HOT HOUSE WORLD', title: 'Current Policies', c: S.s2, lines: ['Insufficient global action', 'Severe physical risk, low', 'transition risk'] },
        { tag: 'TOO LITTLE, TOO LATE', title: 'Fragmented World', c: S.s4, lines: ['Delayed and divergent policy', 'Both risks elevated'] },
        { tag: 'ORDERLY', title: 'Net Zero 2050', c: S.s1, lines: ['Early, gradually stringent policy', 'Both risks relatively subdued'] },
        { tag: 'DISORDERLY', title: 'Delayed Transition', c: S.s3, lines: ['Late, abrupt policy action', 'High transition risk in', 'exposed sectors'] },
      ],
    }),
    { source: 'NGFS, Phase V long-term climate macro-financial scenarios, November 2024' }
  )}
  <p style="font-size:19px;margin-top:14px">
    AASB S2 requires scenario analysis to assess climate resilience, by an approach
    commensurate with the entity's circumstances.${c('aasb')} Because Phase V raised
    projected physical damages two- to four-fold, an assessment run on an earlier
    vintage will not reproduce.${c('ngfs')}
  </p>
`));

/* ═══════════════════ 18 · TRANSITION PLANS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">02 — The evidence</div>
  <h2>A target is not a<br>transition plan.</h2>
  <p style="margin-bottom:22px;max-width:950px">
    The UK Transition Plan Taskforce framework, published October 2023, sets out what a
    disclosed plan is expected to contain. Its materials now sit with the IFRS
    Foundation, aligning it to the ISSB baseline that Australia and Singapore both
    reference.${c('tpt')}
  </p>
  <table class="dt" style="margin-bottom:22px">
    <tr><th style="width:260px">Element</th><th>What it is expected to contain</th></tr>
    <tr><td class="k">Ambition</td><td>A strategic objective with interim targets, rather than a 2050 endpoint alone.</td></tr>
    <tr><td class="k">Action</td><td>The decisions in products, operations, policy and finance that deliver it.</td></tr>
    <tr><td class="k">Accountability</td><td>Governance, remuneration linkage, skills, and reporting against milestones.</td></tr>
    <tr><td class="k">Financial resourcing</td><td>The capital allocation supporting the plan.</td></tr>
  </table>
  <div class="finding">
    <div class="finding-lab">The common test</div>
    <p>AASB S2 and the MAS guidelines converge on the same requirement: that a plan can
    be traced to an emissions baseline, a scenario run and a capital decision. Under
    mandatory reporting, a plan that cannot be traced is a disclosure exposure rather
    than a communications one.${c('aasb', 'mastp')}</p>
  </div>
`));

/* ═══════════════════ 19 · FIGURE 9 — CAPITAL ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">02 — The evidence</div>
  <h2>Disclosure quality gates<br>capital allocation.</h2>
  ${exhibit(
    'Required clean-energy investment is roughly two and a half times the level observed in 2023.',
    'Annual global clean-energy investment, US$ trillion.',
    vbar({
      h: 322,
      data: [
        { label: '2023 observed', v: 1.8, disp: '$1.8tn', c: NEUTRAL },
        { label: 'required, early 2030s', v: 4.5, disp: 'about $4.5tn', c: S.s1, outline: true },
      ],
    }),
    {
      note: 'the required figure is a modelled pathway, not observed investment, and is shown as a dashed outline.',
      source: 'International Energy Agency, Net Zero Roadmap, September 2023',
    }
  )}
  <p style="font-size:19px;margin-top:18px">
    More than 80% of clean-energy investment currently occurs in advanced economies and
    China. Annual capital spending in emerging and developing economies excluding China
    would need to expand more than sevenfold, to above US$1 trillion a year, by the end
    of this decade.${c('iea')}
  </p>
`));

/* ═══════════════════ 20 · FIGURE 10 — CARBON MARKETS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">02 — The evidence</div>
  <h2>Three carbon-market figures,<br>three different questions.</h2>
  ${exhibit(
    'Widely quoted carbon-market totals measure different things and are not interchangeable.',
    'Selected 2024 measures, with the basis of each stated.',
    `<table class="dt">
      <tr><th style="width:230px">Measure</th><th style="width:190px">2024 figure</th><th>What it counts</th></tr>
      <tr><td class="k">Voluntary market,<br>transaction value</td><td class="num">US$535m</td><td>Value of reported transactions, down 29% from US$723m in 2023${c('em')}</td></tr>
      <tr><td class="k">Voluntary market,<br>whole-market valuation</td><td class="num">about US$1.5bn</td><td>A different methodology applied to the same market${c('msci')}</td></tr>
      <tr><td class="k">Carbon-pricing revenue</td><td class="num">over US$100bn</td><td>Emissions trading schemes and carbon taxes — compliance, not voluntary${c('wb')}</td></tr>
      <tr><td class="k">Credits retired</td><td class="num">180 million</td><td>The measure closest to genuine demand${c('msci')}</td></tr>
      <tr><td class="k">Unretired inventory</td><td class="num">about 1 billion</td><td>Supply overhang weighing on price${c('wb')}</td></tr>
    </table>`,
    {
      note: 'figures are reported on the basis used by each issuing body and are not combined here.',
      source: 'Ecosystem Marketplace; MSCI Carbon Markets; World Bank; ReGenesis Impact analysis',
    }
  )}
`));

/* ═══════════════════ 21 · DIVIDER 03 ═══════════════════ */
mark('sec3');
slides.push(slide(`
  <div class="sec-num">03</div>
  <h2>The capability gap</h2>
  <p class="sec-lead">The thresholds have fallen faster than the supporting tooling has
  adapted. This section sets out where the two diverge, and for whom.</p>
  <div class="sec-toc">
    <div><span>22</span>The obligation scaled down; the tooling did not</div>
    <div><span>23</span>Five actions, by cohort and date</div>
  </div>
`, { fill: true }));

/* ═══════════════════ 22 · THE GAP ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">03 — The capability gap</div>
  <h2>The obligation scaled down.<br>The tooling did not.</h2>
  <p style="margin-bottom:22px;max-width:950px">
    Australia's Group 3 floor is A$50m of revenue and 100 employees from July
    2027.${c('austlii')} Singapore's large non-listed cohort is defined at S$1bn of
    revenue and S$500m of assets by FY2030.${c('acra')} Both capture entities well below
    the profile for which established reporting software was designed.
  </p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:20px">
    <div class="card" style="border-left:3px solid var(--s2)">
      <h3 style="font-size:25px">What is required</h3>
      <p style="font-size:20px">An emissions inventory to the GHG Protocol, material
      Scope 3 by year two, quantified scenario analysis, a transition plan, and an
      evidence trail that survives limited and then reasonable assurance.${c('aasb', 'auasb')}</p>
    </div>
    <div class="card">
      <h3 style="font-size:25px">What is typically available</h3>
      <p style="font-size:20px">A finance function without dedicated sustainability
      staff, advisory quotes scaled to larger balance sheets, and enterprise systems
      whose implementation period exceeds the time remaining before the first filing.</p>
    </div>
  </div>
  <div class="finding">
    <div class="finding-lab">Observation</div>
    <p>The standards were drafted with large filers in view and extended downward by
    threshold. The tooling was built for large filers and was not extended downward at
    all. For mid-market entities the binding constraint is not the regulation but the
    absence of anything proportionate with which to meet it.</p>
  </div>
`));

/* ═══════════════════ 23 · WHAT THIS MEANS ═══════════════════ */
mark('means');
slides.push(slide(`
  <div class="eyebrow">What this means</div>
  <h2>Five actions, by cohort<br>and date.</h2>
  <ul class="ticks" style="margin-bottom:20px">
    <li><strong>Confirm the cohort and the first reporting date.</strong> Size in
      Australia, listing status and market capitalisation in Singapore, market-cap rank
      in India. Every subsequent decision follows from that date.${c('austlii', 'acra', 'sebi')}</li>
    <li><strong>Begin the Scope 1 and 2 inventory before the reporting year opens.</strong>
      Assurance tests prior-year comparatives, so a baseline started in the reporting
      year carries no history.${c('auasb')}</li>
    <li><strong>Scope the material Scope 3 categories now, ahead of measuring them.</strong>
      Material Scope 3 falls due in year two in Australia; identifying which categories
      are material is separable from measuring them.${c('aasb')}</li>
    <li><strong>Run scenario analysis on the current NGFS vintage.</strong> Phase V
      raised projected physical damages two- to four-fold, and a qualitative narrative
      is unlikely to satisfy a resilience assessment.${c('ngfs', 'aasb')}</li>
    <li><strong>Retain the evidence trail from the first cycle.</strong> Reasonable
      assurance over all climate disclosures applies in Australia from 1 July 2030;
      reconstructing an audit trail after the fact costs more than maintaining
      one.${c('auasb')}</li>
  </ul>
  <div class="finding">
    <div class="finding-lab">For June 2026 and FY2028 reporters in particular</div>
    <p>Each of these actions becomes cheaper with time and more expensive with delay.
    That asymmetry, rather than the regulation itself, is the argument for beginning in
    the current quarter.</p>
  </div>
`));

/* ═══════════════════ 24 · ABOUT THE RESEARCH ═══════════════════ */
mark('method');
slides.push(slide(`
  <div class="eyebrow">About the research</div>
  <h2>Scope, method and<br>limitations.</h2>
  <p class="note" style="margin-bottom:20px;max-width:950px">
    <strong>Scope.</strong> This briefing covers mandatory climate-disclosure
    obligations in Australia, Singapore and India, together with the prudential and
    scenario evidence cited by the regulators concerned. It does not cover the European
    CSRD, the United States, or voluntary frameworks except where an obligation
    references them.
  </p>
  <p class="note" style="margin-bottom:20px;max-width:950px">
    <strong>Method.</strong> Figures are compiled from public announcements, standards
    and reports issued by the twenty bodies listed in the endnotes. Where an issuing
    body has revised a date, both the original and revised dates are shown. Where
    sources measure the same market on different bases — as with the voluntary carbon
    market — each figure is reported on its own basis and the bases are not combined.
    <strong>Data as at ${CUTOFF}.</strong>
  </p>
  <div class="finding">
    <div class="finding-lab">Limitations</div>
    <p style="font-size:20px">Two constraints should be read alongside the figures.
    First, this is a compilation of published positions, not a survey: it describes what
    regulators have stated, not what companies have done in response. Second, several
    timetables have already been revised once, and the August 2025 Singapore deferral
    demonstrates that further revision is possible. Dates should be verified against the
    issuing body before being relied on for a filing decision.</p>
  </div>
`));

/* ═══════════════════ 25 · ENDNOTES ═══════════════════ */
mark('notes');
slides.push(slide(`
  <div class="eyebrow">Endnotes</div>
  <h2>Sources.</h2>
  <div style="columns:2;column-gap:44px;font-family:'DM Mono',monospace;font-size:12.8px;line-height:1.6;color:var(--ink-muted)">
    ${SRC.map(([id, title, date, host], i) =>
      `<div style="break-inside:avoid;margin-bottom:12px">
         <span style="color:var(--emerald);font-weight:500">${i + 1}</span>&nbsp;
         <span style="color:var(--ink)">${title}</span><br>
         <span style="opacity:.72">${host}, ${date}</span>
       </div>`).join('')}
  </div>
  <p class="note" style="font-size:16px;margin-top:12px">
    Figures are quoted as published by the issuing body on the dates shown. Claims that
    could not be corroborated across independent sources have been excluded rather than
    qualified.
  </p>
`));

/* ═══════════════════ 26 · ABOUT (commercial, last, labelled) ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">About ReGenesis Impact</div>
  <h2>Who produced this<br>briefing.</h2>
  <p style="margin-bottom:24px;max-width:900px">
    ReGenesis Impact builds disclosure tooling for companies in Australia, Singapore and
    India — the GHG inventory, the ISSB and BRSR disclosure structures, scenario
    analysis and assurance evidence described in this briefing. The tools are free to
    use and require no account to start.
  </p>
  <div class="statrow statrow--2" style="margin-bottom:26px">
    <div class="stat"><div class="stat-lab" style="margin-top:0">Web</div>
      <div style="font-family:var(--font-mono);font-size:25px;color:var(--emerald);font-weight:500;margin-top:8px">regenesisimpact.in</div></div>
    <div class="stat"><div class="stat-lab" style="margin-top:0">Correspondence</div>
      <div style="font-family:var(--font-mono);font-size:25px;color:var(--emerald);font-weight:500;margin-top:8px">info@regenesisimpact.in</div></div>
  </div>
  <p style="font-size:19px;margin-bottom:26px;max-width:900px">
    Corrections are welcome. If a date or threshold in this briefing has moved, or has
    been misread, please write and it will be amended in the next edition.
  </p>
  <p class="note" style="font-size:15.5px;line-height:1.6">
    This briefing contains general information only and does not constitute accounting,
    legal or other professional advice. It should not be relied upon as a substitute for
    the primary sources listed in the endnotes, or for advice from a qualified adviser.
    Readers remain responsible for determining their own reporting obligations.
    <br><br>
    ${DOC_ID} &nbsp;·&nbsp; July 2026 &nbsp;·&nbsp; Data as at ${CUTOFF}
  </p>
`));

/* ───────────────────────── assemble ─────────────────────────────── */
const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Mandatory, and moving — ReGenesis Impact</title>
<link rel="stylesheet" href="board.css">
</head><body>
${slides.join('\n')}
</body></html>`;

const resolved = html.replace(/\{\{P:(\w+)\}\}/g, (_, k) => {
  if (!NAV[k]) throw new Error(`contents references unknown section "${k}"`);
  return String(NAV[k]).padStart(2, '0');
});
if (/\{\{P:/.test(resolved)) throw new Error('unresolved contents page token');
writeFileSync(new URL('./board.html', import.meta.url), resolved);
console.log(`✓ contents:`, NAV);
console.log(`✓ board.html — ${slides.length} pages, ${EXN} figures, ${SRC.length} endnotes`);
