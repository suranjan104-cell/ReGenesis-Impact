/* ═══════════════════════════════════════════════════════════════════
   Builds board.html — "From ledger to forecast".

   Subject: what climate scenario analysis and transition planning ask of
   corporate data, and what the first evidence shows. NOT a compliance
   briefing — thresholds, phase-in dates and deferral timetables are the
   obvious question and are deliberately out of scope.

   Standard: BENCHMARK-MBB.md. Exhibit stack, action titles ending in a full
   stop, singular Note:/Source:, own analysis appended last, colour follows
   the entity, serif is display-only, pages fill.

   ZERO commercial content before the endnotes.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'fs';
import { hbar, vbar, timeline, quadrant, legend, S, NEUTRAL } from './charts.mjs';

const DOC_ID = 'RGI-2026-02';
const CUTOFF = '1 August 2026';

/* ── endnote registry: order here defines the superscript numbers ── */
const SRC = [
  ['ifrs2',   'IFRS S2 “Climate-related Disclosures”, paragraphs 14, 15–21, 22 and 36, and Appendix B', 'June 2023, amended December 2025', 'ifrs.org'],
  ['aasb',    'AASB S2 “Climate-related Disclosures”, Appendix B (AusB1)', 'September 2024', 'standards.aasb.gov.au'],
  ['rg280',   'ASIC, Regulatory Guide 280 “Sustainability reporting”', '31 March 2025', 'asic.gov.au'],
  ['afe',     'IFRS Foundation, “Disclosing information about anticipated financial effects applying ISSB Standards”', 'August 2025', 'ifrs.org'],
  ['tpguid',  'IFRS Foundation, guidance on disclosing information about an entity’s climate-related transition', 'June 2025', 'ifrs.org'],
  ['tpt',     'UK Transition Plan Taskforce, Disclosure Framework; materials transferred to the IFRS Foundation in 2024', 'October 2023', 'ifrs.org/knowledge-hub'],
  ['mastp',   'MAS, Guidelines on Environmental Risk Management: transition planning, for banks, insurers and asset managers', '5 March 2026', 'mas.gov.sg'],
  ['ngfs',    'NGFS, Climate scenarios for central banks and supervisors, Phase V', 'November 2024', 'ngfs.net'],
  ['ngfsret', 'NGFS, “Statement regarding physical risk estimates in Phase V of NGFS long-term scenarios”', '2025', 'ngfs.net'],
  ['ngfsst',  'NGFS, short-term climate scenarios', 'May 2025', 'ngfs.net'],
  ['fsb',     'FSB and NGFS, “Current climate scenario analysis exercises may understate climate exposures and vulnerabilities”', 'November 2022', 'fsb.org'],
  ['ecb',     'ECB, 2022 climate risk stress test', 'July 2022', 'bankingsupervision.europa.eu'],
  ['boe',     'Bank of England, Climate Biennial Exploratory Scenario (CBES) results', '24 May 2022', 'bankofengland.co.uk'],
  ['apracva', 'APRA, Climate Vulnerability Assessment results, five largest banks', 'November 2022', 'apra.gov.au'],
  ['apra',    'APRA, “Mind the Gap: an insurance climate vulnerability assessment”', '24 March 2026', 'apra.gov.au'],
  ['iif',     'PwC and IIF, joint financial institutions survey on sustainability disclosure', 'November–December 2025', 'iif.com'],
  ['dtt',     'Deloitte, “Early insights into Wave 1 of Australian climate reporting”', '2026', 'deloitte.com/au'],
  ['pwcau',   'PwC Australia, “AASB S2 unpacked”, review of 22 first-wave Group 1 reporters', 'February 2026', 'pwc.com.au'],
  ['asic',    'ASIC, early observations on sustainability reporting, Reporting and audit update issue 4', '18 May 2026', 'asic.gov.au'],
  ['auasb',   'AUASB, ASSA 5000 and ASSA 5010 sustainability assurance standards', 'January 2025', 'auasb.gov.au'],
  ['issa',    'IAASB, ISSA 5000 “General requirements for sustainability assurance engagements”', '2024', 'iaasb.org'],
  ['austlii', 'Treasury Laws Amendment (Financial Market Infrastructure and Other Measures) Act 2024, Schedule 4', '9 September 2024', 'legislation.gov.au'],
  ['pwcinv',  'PwC, Global Investor Survey', '2023 and 2025 editions', 'pwc.com'],
  ['actu',    'Actuaries Institute, home insurance affordability research', '2025', 'actuaries.asn.au'],
  ['db',      'Deutsche Bank, Transition Finance Framework', 'November 2025', 'db.com'],
];
const IDX = Object.fromEntries(SRC.map(([id], i) => [id, i + 1]));
const c = (...ids) => `<sup class="cite">${ids.map(i => IDX[i]).join(',')}</sup>`;

/* ── exhibit stack (McKinsey Global Institute anatomy) ──────────── */
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
const NAV = {};
const mark = (key) => { NAV[key] = PAGE + 1; return ''; };
const slide = (inner, { fill = false, cover = false } = {}) => {
  PAGE++;
  const prose = !fill && !/class="exhibit"/.test(inner);
  return `<section class="slide${fill ? ' slide--fill' : ''}${prose ? ' slide--prose' : ''}${cover ? ' slide--cover' : ''}">${inner}
    <div class="pagenum">${String(PAGE).padStart(2, '0')}</div>
    <div class="brandmark">REGENESIS IMPACT</div>
  </section>`;
};

const slides = [];

/* ═══════════════════ 01 · COVER — INFOGRAPHIC ═══════════════════
   The cover states the finding and proves it in one grid. A reader who
   never swipes still leaves with the argument.                        */
slides.push(slide(`
  <div class="eyebrow">Climate disclosure briefing · August 2026</div>
  <div>
    <h1 style="font-size:80px;line-height:1.0">No one is required to<br>have a <em style="font-style:italic;color:var(--emerald)">transition plan</em>.</h1>
    <p class="lede" style="max-width:920px;margin-top:24px">
      IFRS S2 asks an entity to disclose a plan only if it has one. Just under
      two-thirds of Australia's first-wave reporters disclosed one anyway — and once
      disclosed, it carries assumptions, dependencies, a duty to report progress, and
      no assurance for the first year.
    </p>
  </div>

  <div class="cover-graphic">
    <div class="cg-title">The convergence, in one grid</div>
    <div class="matrix">
      <div></div>
      <div class="mx-col">Scope 3<br>emissions</div>
      <div class="mx-col">Climate scenario<br>analysis</div>
      <div class="mx-col">Transition<br>plans</div>

      <div class="mx-row">Assured in the first Australian reporting year</div>
      <div class="mx-cell"><span class="mx-mark mx-no"><span class="mx-dot"></span>NO</span></div>
      <div class="mx-cell"><span class="mx-mark mx-no"><span class="mx-dot"></span>NO</span></div>
      <div class="mx-cell"><span class="mx-mark mx-no"><span class="mx-dot"></span>NO</span></div>

      <div class="mx-row">Inside the three-year modified liability window</div>
      <div class="mx-cell"><span class="mx-mark mx-yes"><span class="mx-dot"></span>YES</span></div>
      <div class="mx-cell"><span class="mx-mark mx-yes"><span class="mx-dot"></span>YES</span></div>
      <div class="mx-cell"><span class="mx-mark mx-yes"><span class="mx-dot"></span>YES</span></div>

      <div class="mx-row">Used to price capital, credit and cover</div>
      <div class="mx-cell"><span class="mx-mark mx-yes"><span class="mx-dot"></span>YES</span></div>
      <div class="mx-cell"><span class="mx-mark mx-yes"><span class="mx-dot"></span>YES</span></div>
      <div class="mx-cell"><span class="mx-mark mx-yes"><span class="mx-dot"></span>YES</span></div>
    </div>
    <div class="ex-source" style="margin-top:14px">
      <span>Source: AUASB ASSA 5000 and ASSA 5010; Treasury Laws Amendment Act 2024; PwC Global Investor Survey; Deutsche Bank; APRA. First-year assurance scope is drawn from published summaries of ASSA 5010 — see page {{P:method}}.</span>
    </div>
  </div>

  <div class="statrow statrow--3">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">~70<small>%</small></div>
      <div class="stat-lab">of reported emissions in the ECB's stress test rested on proxies, not counterparty data${c('ecb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">Withdrawn</div>
      <div class="stat-lab">the paper behind NGFS Phase V physical-risk estimates has been retracted${c('ngfsret')}</div></div>
    <div class="stat"><div class="stat-num">2030</div>
      <div class="stat-lab">reasonable assurance over all Australian climate disclosures, from 1 July${c('auasb')}</div></div>
  </div>

  <div style="font-family:var(--font-mono);font-size:14px;letter-spacing:.1em;color:var(--ink-muted);
              padding-top:16px;border-top:1px solid var(--rule)">
    {{EXCOUNT}} EXHIBITS &nbsp;·&nbsp; ${SRC.length} SOURCES &nbsp;·&nbsp; DATA AS AT ${CUTOFF.toUpperCase()} &nbsp;·&nbsp; ${DOC_ID}
  </div>
`, { cover: true }));

/* ═══════════════════ 02 · CONTENTS ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">Contents</div>
  <h2>What is in this briefing.</h2>
  <div class="toc">
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Introduction</span><span class="toc-sub">The measurement problem is solved; the forecast is not</span><span class="toc-page">{{P:intro}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Key findings</span><span class="toc-sub">Six figures</span><span class="toc-page">{{P:findings}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Executive summary</span><span class="toc-sub"></span><span class="toc-page">{{P:summary}}</span></div>
    <div class="toc-row"><span class="toc-num">01</span><span class="toc-title">What the standards ask for</span><span class="toc-sub">Resilience, anticipated financial effects, transition plans</span><span class="toc-page">{{P:sec1}}</span></div>
    <div class="toc-row"><span class="toc-num">02</span><span class="toc-title">What the exercises found</span><span class="toc-sub">Four supervisory runs and what they said about their own data</span><span class="toc-page">{{P:sec2}}</span></div>
    <div class="toc-row"><span class="toc-num">03</span><span class="toc-title">The data of the future</span><span class="toc-sub">What forward-looking analysis needs that accounting does not produce</span><span class="toc-page">{{P:sec3}}</span></div>
    <div class="toc-row"><span class="toc-num">04</span><span class="toc-title">Why stakeholders read it</span><span class="toc-sub">Where transition credibility is already being priced</span><span class="toc-page">{{P:sec4}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">What this means</span><span class="toc-sub">Five actions</span><span class="toc-page">{{P:means}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">About the research</span><span class="toc-sub">Scope, method and limitations</span><span class="toc-page">{{P:method}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Endnotes</span><span class="toc-sub">Twenty-five sources</span><span class="toc-page">{{P:notes}}</span></div>
  </div>
  <div class="glance">
    <div class="glance-col">
      <h4>What this briefing does not cover</h4>
      <p>Reporting thresholds, phase-in dates and deferral timetables. Those are
      well documented by the regulators themselves and are not the constraint
      most preparers are actually facing.</p>
    </div>
    <div class="glance-col">
      <h4>How to read the exhibits</h4>
      <p>Each carries its own source line and, where relevant, a note on what is
      excluded or uncertain. Superscripts resolve to the endnotes. Where a figure
      rests on a single source, the source is named in the sentence.</p>
    </div>
  </div>
`));

/* ═══════════════════ 03 · INTRODUCTION ═══════════════════ */
mark('intro');
slides.push(slide(`
  <div class="eyebrow">Introduction</div>
  <h2>The measurement problem is<br>solved. The forecast is not.</h2>
  <p class="dek">Emissions accounting has a defined boundary, a standardised method and
  an audit trail. Climate scenario analysis and transition planning have none of those
  things yet — and they are the half of the disclosure that investors, lenders and
  insurers actually price.</p>
  <p style="max-width:950px">
    An emissions inventory is a backward-looking statement about an entity's own
    operations. A resilience assessment is a forward-looking statement about assets,
    counterparties and capital under futures the entity does not control. The two
    require different data, and only one of them is currently produced as a matter of
    course.
  </p>
  <p style="max-width:950px">
    That gap is not a preparer failing. Every supervisory exercise run to date has
    reported the same constraint about its own results, and the FSB and NGFS warned
    jointly in 2022 that climate scenario analysis exercises <strong>may understate
    climate exposures and vulnerabilities</strong>.${c('fsb')} The interesting question
    is not whether the data is missing. It is what the missing data is doing to the
    disclosures being relied upon.
  </p>
`));

/* ═══════════════════ 04 · KEY FINDINGS ═══════════════════ */
mark('findings');
slides.push(slide(`
  <div class="eyebrow">Key findings</div>
  <h2>Six figures.</h2>
  <p class="dek">Three of these describe what supervisors found when they ran the
  analysis themselves. Three describe what the regime does with the results.</p>
  <div class="statrow statrow--3 statrow--grow" style="margin-bottom:16px">
    <div class="stat"><div class="stat-num">~70<small>%</small></div>
      <div class="stat-lab">of reported Scope 1, 2 and 3 emissions in the ECB's 2022 stress test relied on proxies rather than counterparty data${c('ecb')}</div></div>
    <div class="stat"><div class="stat-num">60<small>%</small></div>
      <div class="stat-lab">of sampled banks had no well-integrated climate risk stress-testing framework${c('ecb')}</div></div>
    <div class="stat"><div class="stat-num">Lower</div>
      <div class="stat-lab">loss projections were produced by CBES firms relying on third-party models they could not challenge internally${c('boe')}</div></div>
  </div>
  <div class="statrow statrow--3 statrow--grow">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">0</div>
      <div class="stat-lab">assurance over scenario analysis and transition plans in the first Australian reporting year${c('auasb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">3 yr</div>
      <div class="stat-lab">modified liability covering Scope 3, scenario analysis and transition plans — the same three items${c('austlii')}</div></div>
    <div class="stat"><div class="stat-num">⅔</div>
      <div class="stat-lab">just under two-thirds of first-wave Australian reporters disclosed a transition plan${c('pwcau')}</div></div>
  </div>
`));

/* ═══════════════════ 05 · EXECUTIVE SUMMARY ═══════════════════ */
mark('summary');
slides.push(slide(`
  <div class="eyebrow">Executive summary</div>
  <h2>The least verifiable disclosures<br>are the ones being priced.</h2>
  <p style="max-width:955px">
    IFRS S2 requires an entity to assess the resilience of its strategy and business
    model using climate-related scenario analysis, and to disclose the current and
    anticipated financial effects of climate risks on its financial position,
    performance and cash flows.${c('ifrs2')} AASB S2 goes further than the global
    baseline, requiring at least two scenarios — one consistent with limiting warming
    to 1.5 °C, one in which warming well exceeds 2 °C.${c('aasb')}
  </p>
  <p style="max-width:955px">
    Those requirements are met with data that does not yet exist in most organisations.
    The ECB found roughly <strong>70% of reported emissions rested on proxies</strong>;
    the Bank of England found value-chain emissions and counterparty transition plans
    simply unavailable, down to missing postcodes for physical assets; APRA attributed
    the variance between bank submissions to data quality and the absence of a
    standardised modelling approach.${c('ecb', 'boe', 'apracva')}
  </p>
  <p style="max-width:955px">
    The regime has, in effect, conceded the point. In Australia, scenario analysis and
    transition plans receive no assurance in the first reporting year and only limited
    assurance thereafter,${c('auasb')} and they sit alongside Scope 3 inside a
    three-year modified liability window.${c('austlii')} Those are the same three
    disclosures that investors, lenders and insurers use to price transition
    credibility.
  </p>
  <div class="finding">
    <div class="finding-lab">The consequence</div>
    <p>An entity can satisfy the standard and still publish a resilience assessment that
    nobody — including its own board — can test. ASIC's first review of Australian
    reports found scenario disclosures lacked detail on the assumptions and dependencies
    relied on, and transition plans were not clearly linked to targets and actions.${c('asic')}</p>
  </div>
`));

/* ═══════════════════ 06 · DIVIDER 01 ═══════════════════ */
mark('sec1');
slides.push(slide(`
  <div class="sec-num">01</div>
  <h2>What the standards<br>ask for</h2>
  <p class="sec-lead">The forward-looking requirements, and the reliefs that sit
  alongside them. Proportionality is built into the standard — but it is not a
  permanent exemption.</p>
  <div class="sec-toc">
    <div><span>{{P:x1}}</span>Resilience, and the reliefs</div>
    <div><span>{{P:x3}}</span>What the first wave disclosed</div>
    <div><span>{{P:x2}}</span>Two scenarios, one of them hot</div>
    <div><span>{{P:tp}}</span>A transition plan is a disclosure object</div>
  </div>
`, { fill: true }));

/* ═══════════════════ 07 · EXHIBIT 1 — REQUIREMENT MAP ═══════════════════ */
mark('x1');
slides.push(slide(`
  <div class="eyebrow">01 — What the standards ask for</div>
  <h2>Resilience, and the reliefs.</h2>
  ${exhibit(
    'The forward-looking requirements each carry a proportionality relief.',
    'Selected IFRS S2 requirements and the conditions under which quantitative disclosure is not required.',
    `<table class="dt">
      <tr><th style="width:250px">Requirement</th><th>What is required</th><th style="width:250px">Relief</th></tr>
      <tr><td class="k">Climate resilience<br><span style="font-size:15px;opacity:.68">para 22</span></td>
          <td>Assess the resilience of strategy and business model using scenario analysis; disclose how and when it was carried out, the key assumptions, and significant areas of uncertainty.</td>
          <td>Approach must be commensurate with the entity's circumstances, exposure, skills, capabilities and resources.</td></tr>
      <tr><td class="k">Anticipated financial effects<br><span style="font-size:15px;opacity:.68">paras 15–21</span></td>
          <td>Current and anticipated effects on financial position, performance and cash flows, over short, medium and long term.</td>
          <td>Quantitative information not required where measurement uncertainty is too high, or where the entity lacks the skills, capabilities or resources.</td></tr>
      <tr><td class="k">Transition plan<br><span style="font-size:15px;opacity:.68">para 14</span></td>
          <td>If the entity has one: key assumptions, dependencies it relies on, and quantitative and qualitative progress against plans disclosed previously.</td>
          <td>Conditional — there is no requirement to have a transition plan.</td></tr>
      <tr><td class="k">Carbon credits<br><span style="font-size:15px;opacity:.68">para 36(e)</span></td>
          <td>Extent to which a net target relies on credits, the verifying scheme, the credit type, and factors bearing on credibility and integrity.</td>
          <td>None. This sits in targets, not in the transition plan.</td></tr>
    </table>`,
    {
      note: 'reliefs are available to entities of any size. Where exposure to climate-related financial risk is material, the ISSB expects the effort and resources devoted to increase correspondingly — proportionality is not a permanent exemption.',
      source: 'IFRS S2; IFRS Foundation guidance on anticipated financial effects, August 2025',
    }
  )}
`));

/* ═══════════════════ 08 · EXHIBIT 2 — TWO SCENARIOS ═══════════════════ */
mark('x2');
slides.push(slide(`
  <div class="eyebrow">01 — What the standards ask for · Australia</div>
  <h2>Two scenarios, one of<br>them hot.</h2>
  <p class="dek">IFRS S2 prescribes neither a number of scenarios nor a temperature.
  AASB S2 prescribes both — the clearest departure from the global baseline, and the
  one most often mis-stated.</p>
  ${exhibit(
    'Australia mandates a scenario pair; the widely quoted 2.5 °C figure is the regulator’s interpretation, not the standard.',
    'Scenario requirements under IFRS S2 and AASB S2, with the source of each.',
    `<table class="dt">
      <tr><th style="width:230px">Instrument</th><th>What it says</th></tr>
      <tr><td class="k">IFRS S2</td><td>Requires scenario analysis for the resilience assessment. Prescribes no number of scenarios and no temperature alignment.</td></tr>
      <tr><td class="k">AASB S2<br><span style="font-size:15px;opacity:.68">Appendix B, AusB1</span></td>
          <td><strong>At least two</strong> scenarios: one consistent with limiting warming to <strong>1.5 °C</strong> above pre-industrial levels, and one in which warming <strong>well exceeds 2 °C</strong>.</td></tr>
      <tr><td class="k">ASIC RG 280</td><td>Clarifies that a scenario of <strong>2.5 °C or greater</strong> satisfies “well exceeds 2 °C”, and that using a lower high-warming scenario creates compliance risk.</td></tr>
    </table>`,
    {
      note: 'the 2.5 °C figure does not appear in AASB S2. It is ASIC regulatory guidance interpreting the standard, and should be attributed accordingly.',
      source: 'AASB S2, Appendix B; ASIC Regulatory Guide 280; ReGenesis Impact analysis',
    }
  )}
`));

/* ═══════════════════ 09 · EXHIBIT 3 — WHAT WAVE 1 DID ═══════════════════ */
mark('x3');
slides.push(slide(`
  <div class="eyebrow">01 — What the standards ask for</div>
  <h2>What the first wave<br>actually disclosed.</h2>
  ${exhibit(
    'Most first-wave reporters exceeded the scenario minimum, and over half quantified financial effects to some degree.',
    'Selected findings from reviews of Australian Group 1 entities reporting for years ended 31 December 2025.',
    `<table class="dt">
      <tr><th style="width:300px">Observation</th><th>Finding</th></tr>
      <tr><td class="k">Reference pathways</td><td>Most entities used established pathways from the IPCC, NGFS or IEA.</td></tr>
      <tr><td class="k">Number of scenarios</td><td>Over half disclosed <strong>more than the required minimum</strong>.</td></tr>
      <tr><td class="k">Anticipated financial effects</td><td>Over half provided <strong>some level of quantified information</strong>; approaches ranged from qualitative assessment to advanced quantitative modelling.</td></tr>
      <tr><td class="k">Transition plans</td><td>Just under two-thirds disclosed one, ranging from operational initiatives to defined investment programmes.</td></tr>
      <tr><td class="k">Scope 3</td><td>All entities reported Scope 1 and 2; <strong>40% disclosed Scope 3 voluntarily</strong> despite first-year relief.</td></tr>
      <tr><td class="k">Risk composition</td><td>On average <strong>47% transition risk, 31% physical risk, 22% opportunity</strong>.</td></tr>
    </table>`,
    {
      note: 'PwC reviewed 22 first-wave Group 1 reporters published on the ASX on or before 27 February 2026. Deloitte’s review covers the same reporting population. First-wave entities represent a small fraction of those eventually captured.',
      source: 'Deloitte, Early insights into Wave 1; PwC Australia, AASB S2 unpacked',
    }
  )}
`));

/* ═══════════════════ 10 · TRANSITION PLAN AS OBJECT ═══════════════════ */
mark('tp');
slides.push(slide(`
  <div class="eyebrow">01 — What the standards ask for</div>
  <h2>A transition plan is a<br>disclosure object, not a pledge.</h2>
  <p class="dek">Under IFRS S2 the plan is disclosed conditionally — but once disclosed
  it carries assumptions, dependencies and a requirement to report progress against
  what was said last year.</p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:18px">
    <div class="card">
      <h3 style="font-size:25px">What must accompany it</h3>
      <p style="font-size:20px">Key assumptions used in developing the plan — assumed
      policy settings, assumed technology availability — and the dependencies the plan
      relies on. Then, in later periods, quantitative and qualitative progress against
      what was previously disclosed.${c('ifrs2')}</p>
    </div>
    <div class="card">
      <h3 style="font-size:25px">Where the guidance sits</h3>
      <p style="font-size:20px">The Transition Plan Taskforce materials transferred to
      the IFRS Foundation in 2024, and in June 2025 it published guidance on disclosing
      climate-related transition information under IFRS S2. That guidance is
      <strong>not new requirements</strong> — it does not amend the standard.${c('tpguid', 'tpt')}</p>
    </div>
  </div>
  <div class="finding">
    <div class="finding-lab">The supervisory version</div>
    <p>MAS took a different route. Rather than a disclosure requirement, its March 2026
    guidelines make transition planning a supervisory expectation for banks, insurers
    and asset managers from September 2027 — requiring scenario results to be integrated
    into credit, underwriting and investment decisions, and setting expectations on the
    governance of <em class="hl">proxy data</em>, including the choice of proxies and
    its implications for risk assessment.${c('mastp')}</p>
  </div>
`));

/* ═══════════════════ 11 · DIVIDER 02 ═══════════════════ */
mark('sec2');
slides.push(slide(`
  <div class="sec-num">02</div>
  <h2>What the exercises<br>found</h2>
  <p class="sec-lead">Four supervisors have now run climate scenario analysis at scale.
  Each published what it found about the economy. Each also published what it found
  about its own data.</p>
  <div class="sec-toc">
    <div><span>{{P:x4}}</span>The reference scenario sets</div>
    <div><span>{{P:x6}}</span>What the exercises said about their data</div>
    <div><span>{{P:ret}}</span>A damage function withdrawn</div>
    <div><span>{{P:x7}}</span>Physical risk, priced through insurance</div>
  </div>
`, { fill: true }));

/* ═══════════════════ 12 · EXHIBIT 4 — SCENARIO SETS ═══════════════════ */
mark('x4');
slides.push(slide(`
  <div class="eyebrow">02 — What the exercises found</div>
  <h2>Two scenario sets, two<br>different jobs.</h2>
  ${exhibit(
    'The short-term scenarios published in 2025 answer a question the long-term set cannot.',
    'NGFS long-term (Phase V) and short-term scenario families, by horizon and intended use.',
    `<table class="dt">
      <tr><th style="width:230px"></th><th>Long-term, Phase V</th><th>Short-term</th></tr>
      <tr><td class="k">Published</td><td>November 2024</td><td>May 2025</td></tr>
      <tr><td class="k">Horizon</td><td>To 2050 and 2100</td><td><strong>3 to 5 years</strong></td></tr>
      <tr><td class="k">Scenarios</td><td>Seven pathways, including Net Zero 2050, Low Demand, Below 2 °C, Delayed Transition, NDCs, Current Policies and Fragmented World</td>
          <td>Four: Highway to Paris; Sudden Wake-Up Call; Disasters and Policy Stagnation; Diverging Realities</td></tr>
      <tr><td class="k">Intended use</td><td>Strategic and investment decisions</td><td><strong>Capital planning, credit risk, stress testing</strong></td></tr>
      <tr><td class="k">Distinguishing feature</td><td>Macro-financial pathways by region and sector</td><td>Models climate shocks interacting with the economic cycle, capturing acute physical risk and abrupt repricing within a normal business-planning horizon</td></tr>
    </table>`,
    {
      note: 'the older six-scenario framing grouped as Orderly, Disorderly and Hot House World belongs to Phase III–IV and is superseded. “Divergent Net Zero” no longer exists as a Phase V pathway.',
      source: 'NGFS Phase V, November 2024; NGFS short-term scenarios, May 2025',
    }
  )}
`));

/* ═══════════════════ 13 · EXHIBIT 5 — THE RETRACTION ═══════════════════ */
mark('ret');
slides.push(slide(`
  <div class="eyebrow">02 — What the exercises found</div>
  <h2>A damage function<br>withdrawn.</h2>
  <p class="dek">The most consequential development in climate scenario analysis in the
  last year is not a new scenario. It is the withdrawal of the research underpinning the
  physical-risk estimates in the set most preparers are using.</p>
  <div class="finding" style="margin-bottom:18px">
    <div class="finding-lab">NGFS statement</div>
    <p style="font-size:21px">The academic paper underpinning the physical-risk damage
    function in Phase V has been <strong>retracted</strong>. The NGFS has issued a formal
    statement noting that it cannot be excluded that the economic effects of climate
    change turn out to be more severe than current Phase V estimates. Scenario outputs
    that do not incorporate those physical loss estimates are unaffected, as are all
    short-term scenarios. An updated methodology is expected with the next long-term
    iteration at the end of 2026.${c('ngfsret', 'ngfs')}</p>
  </div>
  <div class="cardgrid cardgrid--2">
    <div class="card" style="border-left:3px solid var(--s2)">
      <h3 style="font-size:25px">Why it is a disclosure issue</h3>
      <p style="font-size:20px">IFRS S2 requires disclosure of the key assumptions and
      significant areas of uncertainty in the resilience assessment.${c('ifrs2')} An
      assessment built on a withdrawn damage function has a material assumption to
      report.</p>
    </div>
    <div class="card">
      <h3 style="font-size:25px">What it does not mean</h3>
      <p style="font-size:20px">It is not evidence that physical risk is overstated. The
      NGFS statement points the other way — that effects may prove more severe than
      Phase V shows.</p>
    </div>
  </div>
`));

/* ═══════════════════ 14 · EXHIBIT 6 — THE DATA FINDINGS ═══════════════════ */
mark('x6');
slides.push(slide(`
  <div class="eyebrow">02 — What the exercises found</div>
  <h2>Every exercise reported the<br>same constraint.</h2>
  ${exhibit(
    'Four supervisors ran the analysis and four reported that the data was not there.',
    'Published findings on data quality from supervisory climate scenario exercises.',
    `<table class="dt">
      <tr><th style="width:230px">Exercise</th><th>What it reported about its own data</th></tr>
      <tr><td class="k">ECB climate risk<br>stress test, 2022</td>
          <td>About <strong>70% of reported Scope 1, 2 and 3 emissions relied on proxies</strong> rather than counterparty data. <strong>65% of banks</strong> used predominantly proxies to allocate exposures to energy-performance ratings. <strong>60%</strong> had no well-integrated climate stress-testing framework. Wide dispersion in estimated borrower Scope 3 — including between data providers for the same counterparty.</td></tr>
      <tr><td class="k">Bank of England<br>CBES, 2022</td>
          <td>Lack of data on corporates' value-chain emissions and future transition plans was a common issue, down to <strong>missing postcodes</strong> for physical assets and out-of-date energy-performance ratings. Firms relying on third-party models without the internal capability to challenge them produced <strong>materially lower</strong> loss projections.</td></tr>
      <tr><td class="k">APRA Climate Vulnerability<br>Assessment, 2022</td>
          <td>Large variance between bank submissions driven by <strong>deviations in data quality and the absence of a standardised modelling approach</strong>, described as a still-maturing approach to using scenario analysis.</td></tr>
      <tr><td class="k">PwC and IIF survey of<br>financial institutions, 2025</td>
          <td>Across 24 institutions managing more than <strong>US$18 trillion</strong>, anticipated financial effects were among the most-cited challenges, with respondents pointing to immature internal systems and controls.</td></tr>
    </table>`,
    {
      note: 'the ECB and CBES exercises predate current disclosure requirements; they are included because they are the largest published runs and the only ones reporting data quality in this detail.',
      source: 'ECB, July 2022; Bank of England CBES, May 2022; APRA, November 2022; PwC and IIF, 2025',
    }
  )}
`));

/* ═══════════════════ 15 · EXHIBIT 7 — APRA ═══════════════════ */
mark('x7');
slides.push(slide(`
  <div class="eyebrow">02 — What the exercises found</div>
  <h2>Physical risk, priced<br>through insurance.</h2>
  ${exhibit(
    'Expected weather losses more than double by 2050 under the higher physical-risk scenario.',
    'Expected national annual weather-peril losses, Australia, A$ billion.',
    vbar({
      h: 330,
      data: [
        { label: '2024 actual', v: 7, disp: 'under $7bn', c: NEUTRAL },
        { label: '2050, higher physical risk', v: 16, disp: 'over $16bn', c: S.s2 },
      ],
    }),
    {
      note: 'APRA modelled two severe but plausible scenarios to 2050. The 2024 baseline is shown recessive; the projection is the finding.',
      source: 'APRA, Mind the Gap, March 2026',
    }
  )}
  <div class="statrow statrow--2" style="margin-top:16px">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">1 in 4</div>
      <div class="stat-lab">households in freestanding properties projected uninsured by 2050, from 1 in 7 today${c('apra')}</div></div>
    <div class="stat"><div class="stat-num">1.6<small>m</small></div>
      <div class="stat-lab">Australian households already in home-insurance affordability stress, up 30% year on year${c('actu')}</div></div>
  </div>
`));

/* ═══════════════════ 16 · DIVIDER 03 ═══════════════════ */
mark('sec3');
slides.push(slide(`
  <div class="sec-num">03</div>
  <h2>The data of<br>the future</h2>
  <p class="sec-lead">What a forward-looking assessment needs, what an emissions
  inventory produces, and why the difference is not closing on its own.</p>
  <div class="sec-toc">
    <div><span>{{P:x8}}</span>Four properties accounting does not have</div>
    <div><span>{{P:x9}}</span>The assurance sequence</div>
    <div><span>{{P:conv}}</span>Where the regime concedes the point</div>
  </div>
`, { fill: true }));

/* ═══════════════════ 17 · EXHIBIT 8 — THE DATA SHIFT ═══════════════════ */
mark('x8');
slides.push(slide(`
  <div class="eyebrow">03 — The data of the future</div>
  <h2>Four properties an inventory<br>does not have.</h2>
  ${exhibit(
    'Forward-looking analysis needs data with a different shape, not simply more of it.',
    'Properties required by scenario analysis and transition planning, against what GHG accounting produces.',
    `<table class="dt">
      <tr><th style="width:200px">Property</th><th style="width:290px">What accounting produces</th><th>What the assessment needs</th></tr>
      <tr><td class="k">Resolution</td><td>Entity-level or facility-level totals</td>
          <td><strong>Asset and location level</strong> — hazard exposure attaches to a coordinate, not to a legal entity. The CBES failure was missing postcodes, not missing emissions.</td></tr>
      <tr><td class="k">Direction</td><td>Historical, for a closed period</td>
          <td><strong>Conditional on a pathway</strong> — the same asset carries different values under 1.5 °C and under well-above-2 °C, and both must be run.</td></tr>
      <tr><td class="k">Boundary</td><td>Own operations, with Scope 3 estimated</td>
          <td><strong>Counterparty and value chain</strong> — transition risk sits with customers and suppliers. The ECB's best performers were distinguished by obtaining clients' actual data and transition plans.</td></tr>
      <tr><td class="k">Object</td><td>Emissions, reported after the fact</td>
          <td><strong>Capital, mapped forward</strong> — anticipated financial effects are a statement about cash flows, not about tonnes.</td></tr>
    </table>`,
    {
      note: 'the four properties are ReGenesis Impact’s framing of constraints reported separately by the ECB, the Bank of England and APRA; the underlying findings are those supervisors’ own.',
      source: 'ECB, 2022; Bank of England CBES, 2022; APRA, 2022; IFRS S2; ReGenesis Impact analysis',
    }
  )}
`));

/* ═══════════════════ 18 · EXHIBIT 9 — ASSURANCE SEQUENCE ═══════════════════ */
mark('x9');
slides.push(slide(`
  <div class="eyebrow">03 — The data of the future</div>
  <h2>The assurance arrives<br>last, by design.</h2>
  ${exhibit(
    'Scenario analysis and transition plans are the last disclosures to be assured, and the only ones with liability protection.',
    'Australian assurance phasing and the statutory liability window, by disclosure.',
    timeline({
      years: [2025, 2026, 2027, 2028, 2029, 2030], laneH: 108, gap: 20, labelW: 268, w: 928,
      rows: [
        { label: 'Governance, strategy, Scope 1 and 2', c: S.s1, spans: [{ from: 2025, to: 2029, text: 'limited assurance from year one' }, { from: 2030, to: 2030, text: 'reasonable' }] },
        { label: 'Scope 3 emissions', c: S.s2, spans: [{ from: 2025, to: 2025, soft: true, text: 'relief' }, { from: 2026, to: 2029, text: 'required, limited assurance' }, { from: 2030, to: 2030, text: 'reasonable' }] },
        { label: 'Scenario analysis, transition plans', c: S.s2, spans: [{ from: 2025, to: 2025, soft: true, text: 'none' }, { from: 2026, to: 2029, text: 'limited assurance, widening' }, { from: 2030, to: 2030, text: 'reasonable' }] },
        { label: 'Modified liability window', c: NEUTRAL, spans: [{ from: 2025, to: 2027, text: 'Scope 3, scenario analysis, transition plans' }] },
      ],
    }),
    {
      note: 'reasonable assurance over all climate disclosures applies for years commencing on or after 1 July 2030. The assurance phasing is drawn from ASSA 5010; readers relying on year-one scope should confirm it against the standard.',
      source: 'AUASB, ASSA 5000 and ASSA 5010; Treasury Laws Amendment Act 2024',
    }
  )}
  <p style="font-size:19px;margin-top:14px">
    ISSA 5000 permits assurance over forward-looking information, while noting it is
    ordinarily <strong>capable of being evaluated only with less precision</strong> than
    historical data.${c('issa')}
  </p>
`));

/* ═══════════════════ 19 · THE CONVERGENCE ═══════════════════ */
mark('conv');
slides.push(slide(`
  <div class="eyebrow">03 — The data of the future</div>
  <h2>Three disclosures, three<br>concessions, one list.</h2>
  <p class="dek">Scope 3, scenario analysis and transition plans appear together in every
  concession the regime has made. That is not coincidence — it is the system recording
  where it knows the evidence is weakest.</p>
  <div class="statrow statrow--3" style="margin-bottom:20px">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">Relief</div>
      <div class="stat-lab">Scope 3 not required in the first Australian reporting year${c('aasb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">No<br><small>assurance</small></div>
      <div class="stat-lab">over scenario analysis and transition plans in year one${c('auasb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">3 yr</div>
      <div class="stat-lab">modified liability covering all three${c('austlii')}</div></div>
  </div>
  <p style="max-width:955px">
    ASIC's first review of Australian reports named the two weaknesses directly: scenario
    analysis disclosures <strong>lacked detail about the underlying assumptions and
    dependencies relied on</strong>, and transition plans <strong>could have been more
    clearly linked to the entity's targets, actions and strategies</strong>. The same
    review recorded a marked improvement in the quantity and quality of climate
    information overall.${c('asic')}
  </p>
  <div class="finding">
    <div class="finding-lab">What follows from that</div>
    <p>The reliefs close. Assurance widens to the full report from year two and becomes
    reasonable from July 2030; the liability window is three years.${c('auasb', 'austlii')}
    The disclosures currently carrying the least scrutiny are the ones that will carry
    the most.</p>
  </div>
`));

/* ═══════════════════ 20 · DIVIDER 04 ═══════════════════ */
mark('sec4');
slides.push(slide(`
  <div class="sec-num">04</div>
  <h2>Why stakeholders<br>read it</h2>
  <p class="sec-lead">Transition credibility is already priced in loan spreads,
  underwriting and coverage decisions. The disclosure is read because something turns
  on it.</p>
  <div class="sec-toc">
    <div><span>{{P:x10}}</span>Who is reading, and what for</div>
  </div>
`, { fill: true }));

/* ═══════════════════ 21 · EXHIBIT 10 — WHO READS IT ═══════════════════ */
mark('x10');
slides.push(slide(`
  <div class="eyebrow">04 — Why stakeholders read it</div>
  <h2>Who is reading, and<br>what turns on it.</h2>
  ${exhibit(
    'Each reader group has a decision attached to the disclosure, and a stated view of its reliability.',
    'Published evidence on the use of transition plans and scenario analysis, by reader.',
    `<table class="dt">
      <tr><th style="width:180px">Reader</th><th>What they do with it</th><th style="width:250px">Stated position</th></tr>
      <tr><td class="k">Investors</td>
          <td>Assess whether sustainability risk management bears on the investment case.</td>
          <td>94% believed corporate sustainability reporting contains unsupported claims; 75% said sustainability risk management was an important factor in investment decisions.${c('pwcinv')}</td></tr>
      <tr><td class="k">Lenders</td>
          <td>Score counterparty transition maturity as a condition of transition finance.</td>
          <td>Deutsche Bank operates a Transition Maturity Score on a 1–7 scale, assessing counterparty plans across transition management and performance.${c('db')}</td></tr>
      <tr><td class="k">Supervisors</td>
          <td>Require scenario results to be integrated into credit, underwriting and investment decisions.</td>
          <td>MAS guidelines effective September 2027 for banks, insurers and asset managers.${c('mastp')}</td></tr>
      <tr><td class="k">Insurers</td>
          <td>Price and, at the margin, withdraw cover.</td>
          <td>The Australian home-insurance protection gap is projected to widen from one in seven households to one in four by 2050.${c('apra')}</td></tr>
    </table>`,
    {
      note: 'the investor figures are from different editions of the same survey and are not a time series. The Deutsche Bank framework is one lender’s published methodology, cited as a concrete example rather than as market practice.',
      source: 'PwC Global Investor Survey; Deutsche Bank Transition Finance Framework; MAS; APRA',
    }
  )}
`));

/* ═══════════════════ 22 · WHAT THIS MEANS ═══════════════════ */
mark('means');
slides.push(slide(`
  <div class="eyebrow">What this means</div>
  <h2>Five actions.</h2>
  <ul class="ticks" style="margin-bottom:18px">
    <li><strong>Record the scenario assumptions as a governed artefact, not a
      paragraph.</strong> ASIC's stated weakness was missing detail on assumptions and
      dependencies — which is a documentation problem before it is an analysis
      problem.${c('asic', 'ifrs2')}</li>
    <li><strong>Establish asset-level location data before the next assessment
      cycle.</strong> The CBES constraint was missing postcodes. Physical hazard
      exposure cannot be modelled against a registered office.${c('boe')}</li>
    <li><strong>Treat counterparty transition data as a collection programme.</strong>
      The ECB's better performers were distinguished by engaging clients for actual data
      and their transition plans, not by better modelling.${c('ecb')}</li>
    <li><strong>State which scenario vintage was used, and when.</strong> Phase V
      physical-risk estimates rest on a withdrawn damage function; an assessment that
      does not say what it ran cannot be re-run.${c('ngfsret')}</li>
    <li><strong>Build the evidence trail for the disclosures that are not yet
      assured.</strong> Scenario analysis and transition plans move from no assurance to
      limited, then to reasonable by July 2030, and the liability window is three
      years.${c('auasb', 'austlii')}</li>
  </ul>
  <div class="finding">
    <div class="finding-lab">The asymmetry</div>
    <p>Each of these is a data-collection decision with a lead time measured in
    reporting cycles, not weeks. An organisation that begins after the requirement
    bites will be assured on a baseline it did not have time to build.</p>
  </div>
`));

/* ═══════════════════ 23 · ABOUT THE RESEARCH ═══════════════════ */
mark('method');
slides.push(slide(`
  <div class="eyebrow">About the research</div>
  <h2>Scope, method and<br>limitations.</h2>
  <p class="note" style="max-width:955px">
    <strong>Scope.</strong> Forward-looking climate disclosure requirements — resilience
    assessment, scenario analysis, anticipated financial effects and transition planning
    — under IFRS S2, AASB S2 and the MAS transition planning guidelines, together with
    the published supervisory exercises that have tested them. Reporting thresholds and
    phase-in timetables are deliberately out of scope.
  </p>
  <p class="note" style="max-width:955px">
    <strong>Method.</strong> Compiled from public standards, regulatory guidance,
    supervisory publications and published reviews of first-wave reporters, listed in
    the endnotes. Where a figure rests on a single published source, that source is named
    in the sentence rather than only in the endnote. Where two figures measure different
    populations or periods, they are not combined. <strong>Data as at ${CUTOFF}.</strong>
  </p>
  <div class="finding">
    <div class="finding-lab">Limitations</div>
    <p style="font-size:20px">Three should be read alongside the figures. This is a
    compilation of published positions, not a survey — it describes what supervisors and
    reviewers reported, not what companies did. The Australian first-wave findings cover
    22 to 25 entities reporting for years ended 31 December 2025, a small fraction of
    those eventually captured, and should not be read as settled practice. And the
    assurance phasing described on page 18 is drawn from secondary summaries of ASSA
    5010; the scope of first-year assurance should be confirmed against the standard
    before it is relied on.</p>
  </div>
`));

/* ═══════════════════ 24 · ENDNOTES ═══════════════════ */
mark('notes');
slides.push(slide(`
  <div class="eyebrow">Endnotes</div>
  <h2>Sources.</h2>
  <div style="columns:2;column-gap:44px;font-family:'DM Mono',monospace;font-size:12.4px;line-height:1.58;color:var(--ink-muted)">
    ${SRC.map(([id, title, date, host], i) =>
      `<div style="break-inside:avoid;margin-bottom:11px">
         <span style="color:var(--emerald);font-weight:500">${i + 1}</span>&nbsp;
         <span style="color:var(--ink)">${title}</span><br>
         <span style="opacity:.72">${host}, ${date}</span>
       </div>`).join('')}
  </div>
  <p class="note" style="font-size:16px">
    Figures are quoted as published by the issuing body. Claims that could not be
    corroborated across independent sources have been excluded rather than qualified;
    one figure previously carried in this series was withdrawn after the underlying paper
    was retracted.
  </p>
`));

/* ═══════════════════ 25 · ABOUT (commercial, last, labelled) ═══════════════════ */
slides.push(slide(`
  <div class="eyebrow">About ReGenesis Impact</div>
  <h2>Who produced this<br>briefing.</h2>
  <p style="max-width:920px">
    ReGenesis Impact builds disclosure tooling for companies in Australia and Singapore —
    the GHG inventory, the ISSB and AASB disclosure structures, scenario analysis and the
    assurance evidence trail described in this briefing. The tools are free to use and
    require no account to start.
  </p>
  <div class="statrow statrow--2">
    <div class="stat"><div class="stat-lab" style="margin-top:0">Web</div>
      <div style="font-family:var(--font-mono);font-size:25px;color:var(--emerald);font-weight:500;margin-top:8px">regenesisimpact.in</div></div>
    <div class="stat"><div class="stat-lab" style="margin-top:0">Correspondence</div>
      <div style="font-family:var(--font-mono);font-size:25px;color:var(--emerald);font-weight:500;margin-top:8px">info@regenesisimpact.in</div></div>
  </div>
  <p style="font-size:19px;max-width:920px">
    Corrections are welcome. If a requirement, figure or date in this briefing has moved
    or has been misread, please write and it will be amended in the next edition.
  </p>
  <p class="note" style="font-size:15.5px;line-height:1.6">
    This briefing contains general information only and does not constitute accounting,
    legal or other professional advice. It should not be relied upon as a substitute for
    the primary sources listed in the endnotes, or for advice from a qualified adviser.
    Readers remain responsible for determining their own reporting obligations.
    <br><br>
    ${DOC_ID} &nbsp;·&nbsp; August 2026 &nbsp;·&nbsp; Data as at ${CUTOFF}
  </p>
`));

/* ───────────────────────── assemble ─────────────────────────────── */
const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>From ledger to forecast — ReGenesis Impact</title>
<link rel="stylesheet" href="board.css">
</head><body>
${slides.join('\n')}
</body></html>`;

const resolved = html.replace(/\{\{EXCOUNT\}\}/g, String(EXN)).replace(/\{\{P:(\w+)\}\}/g, (_, k) => {
  if (!NAV[k]) throw new Error(`contents references unknown section "${k}"`);
  return String(NAV[k]).padStart(2, '0');
});
if (/\{\{P:/.test(resolved)) throw new Error('unresolved contents page token');
writeFileSync(new URL('./board.html', import.meta.url), resolved);
console.log('✓ contents:', NAV);
console.log(`✓ board.html — ${slides.length} pages, ${EXN} exhibits, ${SRC.length} endnotes`);
