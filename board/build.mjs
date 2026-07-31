/* ═══════════════════════════════════════════════════════════════════
   Builds board.html — the thought-leadership carousel.

   VOICE RULE: lead with the figure, not the set-up. No sentence exists only
   to introduce the next one. Where a claim can be a table or a chart, it is
   not a paragraph.

   SOURCING RULE: every factual claim carries a superscript keyed to the
   SOURCES slide. Claims that could not be corroborated across independent
   sources were CUT, not softened. See sources.json for the exclusion list.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'fs';
import { hbar, vbar, timeline, quadrant, legend, S, NEUTRAL } from './charts.mjs';

/* ── citation registry: order here defines the superscript numbers ── */
const SRC = [
  ['pik',    'Kotz, Levermann & Wenz — “The economic commitment of climate change”, Nature 628', '17 Apr 2024', 'pik-potsdam.de'],
  ['ngfs',   'NGFS — Phase V long-term climate macro-financial scenarios (v5.0)', 'Nov 2024', 'ngfs.net'],
  ['ifrs',   'IFRS Foundation — jurisdictional profiles on ISSB Standards adoption', '12 Jun 2025', 'ifrs.org'],
  ['austlii','Treasury Laws Amendment (Financial Market Infrastructure and Other Measures) Act 2024, Sch. 4', '9 Sep 2024', 'legislation.gov.au'],
  ['rg280',  'ASIC Regulatory Guide 280 — Sustainability reporting (MR 25-051)', '31 Mar 2025', 'asic.gov.au'],
  ['aasb',   'AASB S2 — Climate-related Disclosures', 'Sep 2024', 'standards.aasb.gov.au'],
  ['auasb',  'AUASB — ASSA 5000 / ASSA 5010 sustainability assurance standards', 'Jan 2025', 'auasb.gov.au'],
  ['apra',   'APRA — “Mind the Gap: An Insurance Climate Vulnerability Assessment”', '24 Mar 2026', 'apra.gov.au'],
  ['apracva','APRA — Climate Vulnerability Assessment results (five largest banks)', 'Nov 2022', 'apra.gov.au'],
  ['mastp',  'MAS — Guidelines on Environmental Risk Management: Transition Planning', '5 Mar 2026', 'mas.gov.sg'],
  ['acra',   'ACRA & SGX RegCo — Extended timelines for most climate reporting requirements', '25 Aug 2025', 'acra.gov.sg'],
  ['acra24', 'ACRA & SGX RegCo — Climate reporting & assurance roadmap for Singapore', '28 Feb 2024', 'acra.gov.sg'],
  ['nccs',   'NCCS / Ministry of Sustainability & the Environment — Singapore carbon tax', '2026 rates', 'nccs.gov.sg'],
  ['sebi',   'SEBI — BRSR & BRSR Core assurance framework', 'Jul 2023', 'sebi.gov.in'],
  ['tpt',    'UK Transition Plan Taskforce — Disclosure Framework', '9 Oct 2023', 'ifrs.org/knowledge-hub'],
  ['iea',    'IEA — Net Zero Roadmap: A Global Pathway to Keep the 1.5 °C Goal in Reach', 'Sep 2023', 'iea.org'],
  ['em',     'Ecosystem Marketplace (Forest Trends) — State of the Voluntary Carbon Market 2025', '29 May 2025', 'ecosystemmarketplace.com'],
  ['msci',   'MSCI Carbon Markets — “Carbon Credits Come of Age in 2025”', '2025', 'msci.com'],
  ['wb',     'World Bank — State and Trends of Carbon Pricing 2025', '10 Jun 2025', 'worldbank.org'],
  ['masfsr', 'MAS — Financial Stability Review 2023 (transition-risk analysis)', 'Nov 2023', 'mas.gov.sg'],
];
const IDX = Object.fromEntries(SRC.map(([id], i) => [id, i + 1]));
const c = (...ids) => `<sup class="cite">${ids.map(i => IDX[i]).join(',')}</sup>`;
const rail = (...ids) => `<div class="srcrail">${ids.map(i =>
  `<b>${IDX[i]}</b> ${SRC.find(s => s[0] === i)[1]} · ${SRC.find(s => s[0] === i)[2]}`
).join('<br>')}</div>`;

let PAGE = 0;
const slide = (inner, { ink = false } = {}) => {
  PAGE++;
  return `<section class="slide${ink ? ' slide--ink' : ''}">${inner}
    <div class="pagenum">${String(PAGE).padStart(2, '0')}</div>
    <div class="brandmark">REGENESIS IMPACT</div>
  </section>`;
};

const slides = [];

/* ─────────────────────────── 01 · COVER ─────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">Climate disclosure · 2026</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <h1>The<br>Reporting<br><em style="font-style:italic;color:var(--emerald)">Deadlines</em></h1>
    <div style="height:30px"></div>
    <p class="lede" style="max-width:840px">
      Who has to file climate disclosures, and when — the thresholds, the phase-in
      dates and the stress-test numbers now on the record. Every figure sourced on
      the last page.
    </p>
  </div>
  <div class="statrow statrow--4">
    <div class="stat"><div class="stat-num">36</div><div class="stat-lab">jurisdictions moving<br>to ISSB${c('ifrs')}</div></div>
    <div class="stat"><div class="stat-num">A$50<small>m</small></div><div class="stat-lab">revenue threshold,<br>Australia, Jul 2027${c('austlii')}</div></div>
    <div class="stat"><div class="stat-num">S$45</div><div class="stat-lab">carbon tax per tCO<sub>2</sub>e<br>from 2026${c('nccs')}</div></div>
    <div class="stat"><div class="stat-num">$38<small>tn</small></div><div class="stat-lab">annual damages<br>committed by 2050${c('pik')}</div></div>
  </div>
  ${rail('ifrs', 'austlii', 'nccs', 'pik')}
`));

/* ───────────────────── 02 · WHAT CHANGED (table) ────────────────── */
slides.push(slide(`
  <div class="eyebrow">01 — What changed</div>
  <h2>Three changes, 2024–2026.</h2>
  <table class="dt" style="margin-bottom:22px">
    <tr><th style="width:190px">Change</th><th>Instrument</th><th style="width:230px">In force</th></tr>
    <tr>
      <td class="k">It became law</td>
      <td>Climate reporting written into Australia's Corporations Act${c('austlii')}; ISSB-aligned roadmap for Singapore issuers${c('acra24')}; BRSR for India's top 1,000 listed${c('sebi')}</td>
      <td class="num">1 Jan 2025 (AU)</td>
    </tr>
    <tr>
      <td class="k">It became audited</td>
      <td>ASSA 5000 / 5010 assurance standards; limited assurance escalating to reasonable over all climate disclosures${c('auasb')}</td>
      <td class="num">1 Jul 2030 (AU)</td>
    </tr>
    <tr>
      <td class="k">It became<br>forward-looking</td>
      <td>Quantified climate scenario analysis and a transition plan — not last year's emissions${c('aasb', 'mastp')}</td>
      <td class="num">with first report</td>
    </tr>
  </table>
  <div class="statrow statrow--3">
    <div class="stat"><div class="stat-num">Yr 1</div><div class="stat-lab">Scope 1 &amp; 2 emissions<br>required, AASB S2${c('aasb')}</div></div>
    <div class="stat"><div class="stat-num">Yr 2</div><div class="stat-lab">material Scope 3<br>required${c('aasb')}</div></div>
    <div class="stat"><div class="stat-num">3 yr</div><div class="stat-lab">ASIC regulator-only liability<br>window from 1 Jan 2025${c('rg280')}</div></div>
  </div>
  ${rail('austlii', 'acra24', 'sebi', 'auasb', 'aasb', 'rg280')}
`));

/* ─────────────────────── 03 · THE MACRO NUMBER ──────────────────── */
slides.push(slide(`
  <div class="eyebrow">02 — Why supervisors moved</div>
  <h2>19% of global income,<br>already committed.</h2>
  <div class="card" style="border-left:3px solid var(--s2);margin-bottom:24px">
    <div style="font-family:'Playfair Display',serif;font-weight:900;font-size:78px;line-height:1;letter-spacing:-.02em;color:var(--ink)">
      US$38tn / year</div>
    <p style="font-size:20px;margin-top:12px">
      Damages by 2050, likely range US$19–59tn. A ~19% reduction in global income
      relative to a no-climate-change baseline — largely independent of near-term
      emissions choices. Peer-reviewed in <strong>Nature</strong>, April 2024.${c('pik')}
    </p>
  </div>
  <div class="statrow statrow--3" style="margin-bottom:22px">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">2–4×</div><div class="stat-lab">higher physical-risk damages,<br>NGFS Phase V vs prior vintages${c('ngfs')}</div></div>
    <div class="stat"><div class="stat-num">&gt;24<small>%</small></div><div class="stat-lab">of global emissions<br>now carry a carbon price${c('wb')}</div></div>
    <div class="stat"><div class="stat-num">&gt;$100<small>bn</small></div><div class="stat-lab">carbon-pricing revenue,<br>2024${c('wb')}</div></div>
  </div>
  <p style="max-width:940px">
    The 2024 revisions are why a scenario analysis run two years ago now returns a
    materially worse answer on the same inputs.${c('ngfs')}
  </p>
  ${rail('pik', 'ngfs', 'wb')}
`));

/* ─────────────────────── 04 · THE ISSB BASELINE ─────────────────── */
slides.push(slide(`
  <div class="eyebrow">03 — The common baseline</div>
  <h2>One standard, three filings.</h2>
  <div class="statrow statrow--3" style="margin-bottom:24px">
    <div class="stat"><div class="stat-num">36</div><div class="stat-lab">jurisdictions adopting or<br>finalising ISSB adoption${c('ifrs')}</div></div>
    <div class="stat"><div class="stat-num">~60<small>%</small></div><div class="stat-lab">of global GDP<br>represented${c('ifrs')}</div></div>
    <div class="stat"><div class="stat-num">~40<small>%</small></div><div class="stat-lab">of global market<br>capitalisation${c('ifrs')}</div></div>
  </div>
  <table class="dt">
    <tr><th style="width:250px">Market</th><th>Standard</th><th style="width:210px">Relationship to ISSB</th></tr>
    <tr><td class="k">Australia</td><td>AASB S2 Climate-related Disclosures${c('aasb')}</td><td>built on IFRS S2</td></tr>
    <tr><td class="k">Singapore</td><td>ISSB-based climate disclosures${c('acra24')}</td><td>directly aligned</td></tr>
    <tr><td class="k">India</td><td>BRSR / BRSR Core${c('sebi')}</td><td>separate KPI structure</td></tr>
  </table>
  <p style="margin-top:22px;max-width:940px">
    All three inherit the TCFD architecture — governance, strategy, risk management,
    metrics &amp; targets.${c('aasb')} <strong>The divergence is in timing and thresholds,
    not substance.</strong> One GHG inventory feeds all three; the cost sits in the
    translation between them.
  </p>
  ${rail('ifrs', 'aasb', 'acra24', 'sebi')}
`));

/* ─────────────── 05 · MASTER TIMELINE (the centrepiece) ─────────── */
slides.push(slide(`
  <div class="eyebrow">04 — The wave, mapped</div>
  <h2>Who reports, when.</h2>
  <p style="margin-bottom:4px;max-width:930px">Solid = mandatory disclosure in force.
  Translucent = assurance obligation begins.</p>
  ${legend([
    { c: S.s2, label: 'Australia' }, { c: S.s1, label: 'Singapore' }, { c: S.s3, label: 'India' },
  ])}
  ${timeline({
    years: [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032],
    laneH: 62, gap: 16, labelW: 258,
    rows: [
      { label: 'AU · Group 1', c: S.s2, spans: [{ from: 2025, to: 2031, text: 'from 1 Jan 2025' }, { from: 2032, to: 2032, soft: true }] },
      { label: 'AU · Group 2', c: S.s2, spans: [{ from: 2026, to: 2031, text: 'from 1 Jul 2026' }, { from: 2032, to: 2032, soft: true }] },
      { label: 'AU · Group 3', c: S.s2, spans: [{ from: 2027, to: 2031, text: 'from 1 Jul 2027' }, { from: 2032, to: 2032, soft: true }] },
      { label: 'SG · listed (STI)', c: S.s1, spans: [{ from: 2025, to: 2031, text: 'FY2025 Scope 1&2' }, { from: 2032, to: 2032, soft: true }] },
      { label: 'SG · listed ≥S$1bn', c: S.s1, spans: [{ from: 2028, to: 2031, text: 'FY2028' }, { from: 2032, to: 2032, soft: true }] },
      { label: 'SG · large non-listed', c: S.s1, spans: [{ from: 2030, to: 2031, text: 'FY2030' }, { from: 2032, to: 2032, soft: true, text: 'FY2032' }] },
      { label: 'IN · top 1,000 listed', c: S.s3, spans: [{ from: 2025, to: 2026, text: 'BRSR in force' }, { from: 2027, to: 2032, soft: true, text: 'BRSR Core assurance · widening to top 1,000' }] },
    ],
  })}
  <p style="font-size:18px;margin-top:18px">
    Gating rule differs by market: <strong>company size</strong> in Australia,${c('austlii')}
    <strong>listing status and market cap</strong> in Singapore,${c('acra')}
    <strong>market-cap rank</strong> in India.${c('sebi')}
  </p>
  ${rail('austlii', 'acra', 'sebi')}
`));

/* ─────────────────────── 06 · AUSTRALIA · SCOPE ─────────────────── */
slides.push(slide(`
  <div class="eyebrow">05 — Australia · who is captured</div>
  <h2>Two of three criteria.</h2>
  <p style="margin-bottom:18px;max-width:930px">
    An entity is captured if it meets <strong>at least two of the three</strong>
    thresholds for its group.${c('austlii', 'rg280')}
  </p>
  <table class="dt" style="margin-bottom:20px">
    <tr><th>Cohort</th><th>Revenue</th><th>Gross assets</th><th>Employees</th><th>First period begins</th></tr>
    <tr><td class="k">Group 1</td><td class="num">≥ A$500m</td><td class="num">≥ A$1bn</td><td class="num">≥ 500</td><td class="k">on/after 1 Jan 2025</td></tr>
    <tr><td class="k">Group 2</td><td class="num">≥ A$200m</td><td class="num">≥ A$500m</td><td class="num">≥ 250</td><td class="k">on/after 1 Jul 2026</td></tr>
    <tr><td class="k">Group 3</td><td class="num">≥ A$50m</td><td class="num">≥ A$25m</td><td class="num">≥ 100</td><td class="k">on/after 1 Jul 2027</td></tr>
  </table>
  <div class="cardgrid cardgrid--2">
    <div class="card">
      <h3 style="font-size:25px">Two non-size doors</h3>
      <p style="font-size:20px">NGER reporters are captured regardless of size — large
      NGER reporters land in Group 1. Asset owners with <strong>≥ A$5bn</strong> under
      management are captured from Group 2.${c('rg280')}</p>
    </div>
    <div class="card" style="border-left:3px solid var(--s2)">
      <h3 style="font-size:25px">Where it bites</h3>
      <p style="font-size:20px">Group 3 sets the floor at <strong>A$50m revenue and 100
      employees</strong> — companies that typically carry no sustainability function and
      no reporting software.</p>
    </div>
  </div>
  ${rail('austlii', 'rg280')}
`));

/* ─────────────────── 07 · AUSTRALIA · WHAT'S REQUIRED ───────────── */
slides.push(slide(`
  <div class="eyebrow">06 — Australia · AASB S2</div>
  <h2>Four pillars. Two<br>assurance gates.</h2>
  <table class="dt" style="margin-bottom:18px">
    <tr><th style="width:200px">Pillar</th><th>Requirement</th></tr>
    <tr><td class="k">Governance</td><td>Board and management processes, controls and procedures for overseeing climate risks and opportunities.</td></tr>
    <tr><td class="k">Strategy</td><td>Material risks and opportunities, anticipated financial effects, transition plans, and <strong>climate scenario analysis</strong> to assess resilience.</td></tr>
    <tr><td class="k">Risk management</td><td>Processes to identify, assess, prioritise and monitor climate risks.</td></tr>
    <tr><td class="k">Metrics &amp; targets</td><td><strong>Scope 1 and 2 from Year 1. Material Scope 3 from Year 2.</strong></td></tr>
  </table>
  <div class="chart-title">Assurance ramp${c('auasb')}</div>
  ${timeline({
    years: [2025, 2026, 2027, 2028, 2029, 2030], laneH: 46, gap: 12, labelW: 258, w: 928,
    rows: [
      { label: 'Limited assurance', c: S.s2, spans: [{ from: 2025, to: 2029, text: 'governance, parts of strategy, Scope 1 & 2 — widening' }] },
      { label: 'Reasonable assurance', c: S.s2, spans: [{ from: 2030, to: 2030, text: 'all disclosures' }] },
    ],
  })}
  <p style="font-size:18px;margin-top:14px">
    ASSA 5000/5010 apply to periods beginning on or after 1 Jan 2025; reasonable assurance
    over all climate disclosures from <strong>1 Jul 2030</strong>.${c('auasb')} ASIC's RG 280
    gives a fixed three-year, regulator-only liability window from 1 Jan 2025 for Scope 3,
    scenario analysis, transition plans and forward-looking statements —
    <strong>not blanket immunity</strong>.${c('rg280')}
  </p>
  ${rail('aasb', 'auasb', 'rg280')}
`));

/* ─────────────── 08 · AUSTRALIA · STRESS TEST NUMBERS ───────────── */
slides.push(slide(`
  <div class="eyebrow">07 — Climate stress testing</div>
  <h2>APRA priced the<br>protection gap.</h2>
  <p style="max-width:930px;margin-bottom:20px">
    <em class="hl">Mind the Gap</em>, March 2026 — a prudential stress test of home-insurance
    affordability to 2050 under two severe-but-plausible scenarios.${c('apra')}
  </p>
  <div class="statrow statrow--2" style="margin-bottom:4px">
    <div class="stat" style="border-left-color:var(--s2)">
      <div class="stat-num">1 in 4</div>
      <div class="stat-lab">households in freestanding properties uninsured<br>by 2050 — from <b>1 in 7</b> today${c('apra')}</div>
    </div>
    <div class="stat" style="border-left-color:var(--s2)">
      <div class="stat-num">$16<small>bn</small></div>
      <div class="stat-lab">expected national annual weather-peril losses<br>by 2050, from <b>under $7bn</b> in 2024${c('apra')}</div>
    </div>
  </div>
  <div class="chart-title">Expected national weather-peril losses, A$ per year${c('apra')}</div>
  ${vbar({
    h: 356,
    data: [
      { label: '2024 actual', v: 7, disp: '<$7bn', c: NEUTRAL },
      { label: '2050 · higher physical risk', v: 16, disp: '>$16bn', c: S.s2 },
    ],
    note: '2024 baseline shown recessive',
  })}
  <p style="font-size:18px">
    The gap widens most in regional and rural Australia — greater weather exposure, lower
    average incomes.${c('apra')} APRA's 2022 assessment of the five largest banks found
    losses concentrated in northern-Australia mortgages and transition-exposed business
    lending.${c('apracva')}
  </p>
  ${rail('apra', 'apracva')}
`));

/* ───────────────────── 09 · SINGAPORE · MAS ─────────────────────── */
slides.push(slide(`
  <div class="eyebrow">08 — Singapore · MAS</div>
  <h2>Transition planning is<br>now supervisory.</h2>
  <div class="statrow statrow--3" style="margin-bottom:22px">
    <div class="stat"><div class="stat-num">5 Mar<br><small>2026</small></div><div class="stat-lab">guidelines issued${c('mastp')}</div></div>
    <div class="stat"><div class="stat-num">Sep<br><small>2027</small></div><div class="stat-lab">effective, after an<br>18-month transition${c('mastp')}</div></div>
    <div class="stat"><div class="stat-num">3</div><div class="stat-lab">sets — banks, insurers,<br>asset managers${c('mastp')}</div></div>
  </div>
  <table class="dt" style="margin-bottom:22px">
    <tr><th style="width:250px">Expectation</th><th>What it requires</th></tr>
    <tr><td class="k">Risk-proportionate</td><td>A transition-planning process proportionate to the risk profile of the business model and the local circumstances of operations.${c('mastp')}</td></tr>
    <tr><td class="k">Engagement over exit</td><td>Engaging and supporting clients through transition rather than withdrawing financing.${c('mastp')}</td></tr>
    <tr><td class="k">Addendum, not replacement</td><td>Sits on top of the existing Environmental Risk Management guidelines.${c('mastp')}</td></tr>
  </table>
  <div class="card" style="border-left:3px solid var(--s1)">
    <p style="font-size:21px"><strong>Second-order effect:</strong> a supervised lender or
    insurer is assessed on its portfolio's transition. Its diligence questions become your
    disclosure requirements — whether or not your own company is in scope. MAS's 2023
    Financial Stability Review already found a disorderly transition materially more costly
    for banks and insurers than an early, orderly one.${c('masfsr')}</p>
  </div>
  ${rail('mastp', 'masfsr')}
`));

/* ──────────────── 10 · SINGAPORE · THE DEFERRAL ─────────────────── */
slides.push(slide(`
  <div class="eyebrow">09 — Singapore · timelines moved</div>
  <h2>Deferred, not cancelled.</h2>
  <p style="max-width:930px;margin-bottom:20px">
    ACRA and SGX RegCo extended most climate-reporting deadlines on
    <strong>25 August 2025</strong>, citing the uncertain global economic landscape and
    varying company readiness.${c('acra')}
  </p>
  <table class="dt" style="margin-bottom:22px">
    <tr><th>Cohort</th><th style="width:210px">Was</th><th style="width:170px">Now</th></tr>
    <tr><td class="k">Large non-listed cos<br><span style="font-size:15px;opacity:.68">rev ≥ S$1bn <b>and</b> assets ≥ S$500m</span></td>
        <td class="num">FY2027 · Scope 1&nbsp;&amp;&nbsp;2</td><td class="k">FY2030</td></tr>
    <tr><td class="k">Large non-listed cos<br><span style="font-size:15px;opacity:.68">external limited assurance</span></td>
        <td class="num">FY2029</td><td class="k">FY2032</td></tr>
    <tr><td class="k">Listed, non-STI ≥ S$1bn mkt cap<br><span style="font-size:15px;opacity:.68">other ISSB-based disclosures</span></td>
        <td class="num">FY2025</td><td class="k">FY2028</td></tr>
    <tr><td class="k">Listed, non-STI &lt; S$1bn mkt cap</td><td class="num">FY2025</td><td class="k">FY2030</td></tr>
  </table>
  <div class="card" style="border-left:3px solid var(--s1)">
    <p style="font-size:21px">Assurance tests prior-year comparatives. A company that
    starts its baseline in the reporting year arrives at FY2030 with no history —
    the same standing start it would have had in FY2027.</p>
  </div>
  ${rail('acra', 'acra24')}
`));

/* ──────────────── 11 · SINGAPORE · CARBON PRICE ─────────────────── */
slides.push(slide(`
  <div class="eyebrow">10 — Singapore · the price signal</div>
  <h2>S$5 to S$45 in three years.</h2>
  <p style="max-width:930px">
    Carbon Pricing Act in force since 1 January 2019, applying to facilities emitting
    <strong>≥ 25,000 tCO<sub>2</sub>e a year</strong>.${c('nccs')}
  </p>
  <div class="chart-title">Singapore carbon tax, S$ per tCO<sub>2</sub>e${c('nccs')}</div>
  ${vbar({
    h: 386, color: S.s1,
    data: [
      { label: '2019–2023', v: 5, disp: 'S$5' },
      { label: '2024–2025', v: 25, disp: 'S$25' },
      { label: '2026–2027', v: 45, disp: 'S$45' },
      { label: 'by 2030 (intent)', v: 65, disp: 'S$50–80', outline: true },
    ],
    note: 'dashed = stated policy intent, not legislated',
  })}
  <div class="statrow statrow--3" style="margin-top:10px">
    <div class="stat"><div class="stat-num">9×</div><div class="stat-lab">headline rate increase,<br>2023 to 2026${c('nccs')}</div></div>
    <div class="stat"><div class="stat-num">25<small>k</small></div><div class="stat-lab">tCO<sub>2</sub>e/yr facility<br>coverage threshold${c('nccs')}</div></div>
    <div class="stat"><div class="stat-num">5<small>%</small></div><div class="stat-lab">of taxable emissions offsettable<br>with international credits${c('nccs')}</div></div>
  </div>
  ${rail('nccs')}
`));

/* ───────────────────────── 12 · INDIA ───────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">11 — India · BRSR</div>
  <h2>Assurance walks down<br>the ranking.</h2>
  <p style="max-width:930px">
    BRSR has been mandatory for the <strong>top 1,000 listed companies by market
    capitalisation</strong> since FY2022–23. BRSR Core adds a defined KPI set subject to
    assurance, phased by market-cap rank.${c('sebi')}
  </p>
  <div class="chart-title">BRSR Core assurance — phase-in by market-cap rank${c('sebi')}</div>
  ${hbar({
    labelW: 210,
    data: [
      { label: 'FY2023–24', v: 150, disp: 'top 150', c: S.s3 },
      { label: 'FY2024–25', v: 250, disp: 'top 250', c: S.s3 },
      { label: 'FY2025–26', v: 500, disp: 'top 500', c: S.s3 },
      { label: 'FY2026–27', v: 1000, disp: 'top 1,000', c: S.s3 },
    ],
  })}
  <div class="card" style="margin-top:24px">
    <h3 style="font-size:25px">The translation cost</h3>
    <p style="font-size:21px">BRSR is not ISSB — it carries its own KPI structure and a
    broader social dimension. A group operating across all three markets needs
    <strong>one emissions inventory feeding three different disclosure grammars</strong>.
    That translation layer is where most reporting cost accumulates.</p>
  </div>
  ${rail('sebi')}
`));

/* ─────────────────── 13 · NGFS SCENARIO QUADRANT ────────────────── */
slides.push(slide(`
  <div class="eyebrow">12 — Scenario analysis</div>
  <h2>Four futures, quantified.</h2>
  <p style="max-width:940px;margin-bottom:0">
    NGFS Phase V (v5.0), November 2024 — the reference set supervisors and central banks
    use.${c('ngfs')}
  </p>
  ${quadrant({
    w: 928, h: 640, xLab: 'Transition risk', yLab: 'Physical risk',
    quads: [
      { tag: 'HOT HOUSE WORLD', title: 'Current Policies', c: S.s2, lines: ['Insufficient global action', 'Severe physical risk,', 'low transition risk'] },
      { tag: 'TOO LITTLE, TOO LATE', title: 'Fragmented World', c: S.s4, lines: ['Delayed and divergent policy', 'Both risks elevated'] },
      { tag: 'ORDERLY', title: 'Net Zero 2050', c: S.s1, lines: ['Early, gradually stringent policy', 'Both risks relatively subdued'] },
      { tag: 'DISORDERLY', title: 'Delayed Transition', c: S.s3, lines: ['Late, abrupt policy action', 'High transition risk in', 'exposed sectors'] },
    ],
  })}
  <p style="font-size:18px;margin-top:8px">
    AASB S2 requires scenario analysis as a resilience assessment, not a narrative.${c('aasb')}
    Phase V raised projected physical damages <strong>two- to four-fold</strong> against
    earlier vintages.${c('ngfs')}
  </p>
  ${rail('ngfs', 'aasb')}
`));

/* ──────────────────── 14 · TRANSITION PLAN ANATOMY ──────────────── */
slides.push(slide(`
  <div class="eyebrow">13 — Transition planning</div>
  <h2>A target is not a plan.</h2>
  <p style="max-width:930px;margin-bottom:20px">
    The UK Transition Plan Taskforce framework (October 2023) is the reference for what a
    credible plan contains; its disclosure materials now sit with the IFRS Foundation,
    aligning it to the ISSB baseline.${c('tpt')}
  </p>
  <table class="dt" style="margin-bottom:22px">
    <tr><th style="width:250px">Element</th><th>What it must contain</th></tr>
    <tr><td class="k">Ambition</td><td>A strategic objective with interim targets — not a 2050 endpoint alone.</td></tr>
    <tr><td class="k">Action</td><td>Specific decisions in products, operations, policy and finance that deliver it.</td></tr>
    <tr><td class="k">Accountability</td><td>Governance, remuneration linkage, skills, and reporting against milestones.</td></tr>
    <tr><td class="k">Financial resourcing</td><td>The capital allocation that makes the plan real rather than aspirational.</td></tr>
  </table>
  <div class="card" style="border-left:3px solid var(--s2)">
    <h3 style="font-size:25px">The test being applied</h3>
    <p style="font-size:21px">AASB S2 and the MAS guidelines converge on one question:
    <strong>can you show the working?</strong> A plan that cannot be traced to an emissions
    baseline, a scenario run and a capital decision is a marketing document — and, under
    mandatory reporting, a litigation surface.${c('aasb', 'mastp')}</p>
  </div>
  ${rail('tpt', 'aasb', 'mastp')}
`));

/* ─────────────────── 15 · TRANSITION FINANCE GAP ────────────────── */
slides.push(slide(`
  <div class="eyebrow">14 — The capital</div>
  <h2>$1.8tn today.<br>$4.5tn required.</h2>
  <p style="max-width:930px">
    IEA Net Zero Roadmap: annual clean-energy investment must reach
    <strong>~US$4.5 trillion a year by the early 2030s</strong>, from a record ~US$1.8
    trillion in 2023.${c('iea')}
  </p>
  <div class="chart-title">Annual clean-energy investment, US$ trillion${c('iea')}</div>
  ${vbar({
    h: 352,
    data: [
      { label: '2023 actual', v: 1.8, disp: '$1.8tn', c: NEUTRAL },
      { label: 'required, early 2030s', v: 4.5, disp: '~$4.5tn', c: S.s1, outline: true },
    ],
    note: 'dashed = required pathway, not observed investment',
  })}
  <div class="statrow statrow--2" style="margin-top:12px">
    <div class="stat"><div class="stat-num">&gt;80<small>%</small></div><div class="stat-lab">of clean-energy investment occurs in advanced<br>economies and China today${c('iea')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">7×</div><div class="stat-lab">expansion needed in emerging economies ex-China,<br>to above US$1tn/yr by end of decade${c('iea')}</div></div>
  </div>
  ${rail('iea')}
`));

/* ──────────────────── 16 · CARBON MARKET NUMBERS ────────────────── */
slides.push(slide(`
  <div class="eyebrow">15 — Carbon markets</div>
  <h2>Three numbers, three<br>different things.</h2>
  <div class="statrow statrow--3" style="margin-bottom:22px">
    <div class="stat" style="border-left-color:var(--s1)">
      <div class="stat-num">$535<small>m</small></div>
      <div class="stat-lab">VCM reported <b>transaction value</b>, 2024<br>— down 29% from $723m${c('em')}</div>
    </div>
    <div class="stat" style="border-left-color:var(--s3)">
      <div class="stat-num">~$1.5<small>bn</small></div>
      <div class="stat-lab">VCM <b>whole-market valuation</b>, 2024<br>— a different methodology${c('msci')}</div>
    </div>
    <div class="stat" style="border-left-color:var(--s2)">
      <div class="stat-num">&gt;$100<small>bn</small></div>
      <div class="stat-lab"><b>carbon-pricing revenue</b>, 2024 — ETS and<br>carbon taxes, <b>not</b> the voluntary market${c('wb')}</div>
    </div>
  </div>
  <table class="dt">
    <tr><th>Signal</th><th style="width:210px">2024 figure</th><th>What it indicates</th></tr>
    <tr><td class="k">Credits issued</td><td class="num">305 million${c('msci')}</td><td>Supply entering the market</td></tr>
    <tr><td class="k">Credits retired</td><td class="num">180 million${c('msci')}</td><td>Genuine demand — the number that matters</td></tr>
    <tr><td class="k">Unretired inventory</td><td class="num">~1 billion${c('wb')}</td><td>Supply overhang suppressing price</td></tr>
    <tr><td class="k">2030 projection</td><td class="num">US$7–35bn${c('msci')}</td><td>Range reflects real uncertainty, not consensus</td></tr>
  </table>
  ${rail('em', 'msci', 'wb')}
`));

/* ───────────────── 17 · THE MID-MARKET GAP (argument) ───────────── */
slides.push(slide(`
  <div class="eyebrow">16 — The consequence</div>
  <h2>The obligation scaled down.<br>The tooling didn't.</h2>
  <p style="max-width:940px;margin-bottom:22px">
    Australia's Group 3 floor is <strong>A$50m revenue and 100 employees</strong> from July
    2027.${c('austlii')} Singapore's large non-listed cohort reaches
    <strong>S$1bn revenue and S$500m assets</strong> by FY2030.${c('acra')} Both capture
    companies well below the profile the reporting software was built for.
  </p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:18px">
    <div class="card" style="border-left:3px solid var(--s2)">
      <h3 style="font-size:25px">Required</h3>
      <p style="font-size:20px">GHG inventory to the GHG Protocol. Material Scope 3 by
      year two. Quantified scenario analysis. A transition plan. An audit trail that
      survives limited — then reasonable — assurance.${c('aasb', 'auasb')}</p>
    </div>
    <div class="card">
      <h3 style="font-size:25px">Typically available</h3>
      <p style="font-size:20px">A finance lead with a spreadsheet, a consultancy quote
      priced against an ASX 50 balance sheet, and enterprise software with a procurement
      cycle longer than the runway to the first filing.</p>
    </div>
  </div>
  <div class="card" style="border-left:3px solid var(--s1)">
    <p style="font-size:21px">The standards were written for large filers and extended
    downward by threshold. The tools were built for large filers and not extended downward
    at all. <strong>That gap — not the regulation — is the binding constraint in the
    mid-market.</strong></p>
  </div>
  ${rail('austlii', 'acra', 'aasb', 'auasb')}
`));

/* ────────────────────── 18 · THE PRODUCT MAP ────────────────────── */
slides.push(slide(`
  <div class="eyebrow">17 — What we built</div>
  <h2>ReGenesis Impact.</h2>
  <p class="lede" style="max-width:900px;margin-bottom:22px">
    The disclosure workflow large filers buy — as tools you open in a browser, free,
    without a sales call.
  </p>
  <table class="dt">
    <tr><th style="width:250px">Obligation</th><th>The tool</th></tr>
    <tr><td class="k">GHG inventory<br><span style="font-size:15px;opacity:.65">Scope 1, 2 and 3</span></td>
        <td>Calculators built on the GHG Protocol, holding the inventory year over year so the second cycle starts from the first.</td></tr>
    <tr><td class="k">ISSB S2 · AASB S2</td>
        <td>Disclosure hubs structured to the four pillars — you supply numbers, not a template.</td></tr>
    <tr><td class="k">BRSR</td>
        <td>India's KPI structure mapped against the same underlying inventory.</td></tr>
    <tr><td class="k">Scenario analysis</td>
        <td>Physical and transition risk screening against NGFS-style pathways.</td></tr>
    <tr><td class="k">Transition planning</td>
        <td>Ambition, action, accountability and resourcing in the TPT structure.</td></tr>
    <tr><td class="k">Assurance readiness</td>
        <td>An evidence trail assembled as you work, for limited and reasonable assurance.</td></tr>
    <tr><td class="k">Carbon credits</td>
        <td>Portfolio and retirement tracking, with PCAF-aligned financed-emissions treatment.</td></tr>
  </table>
`));

/* ────────────────────── 19 · FIVE MOVES ─────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">18 — What to do this year</div>
  <h2>Five moves, in order.</h2>
  <ul class="ticks" style="margin-bottom:22px">
    <li><strong>Establish your cohort and date.</strong> Size thresholds in Australia,
      listing status and market cap in Singapore, market-cap rank in India.${c('austlii', 'acra', 'sebi')}</li>
    <li><strong>Build the Scope 1 and 2 inventory now, even if you report later.</strong>
      Assurance tests prior-year comparatives; a baseline started in the reporting year has
      no history.${c('auasb')}</li>
    <li><strong>Map Scope 3 categories before measuring them.</strong> Material Scope 3
      lands in year two in Australia${c('aasb')} — identifying which categories are material
      is a scoping exercise you can finish now.</li>
    <li><strong>Run scenario analysis as a quantified exercise.</strong> Phase V raised
      damages two- to four-fold;${c('ngfs')} a qualitative narrative will not survive
      assurance.</li>
    <li><strong>Keep the evidence trail from day one.</strong> Reasonable assurance over all
      climate disclosures arrives 1 July 2030 in Australia${c('auasb')} — retrofitting an
      audit trail costs more than maintaining one.</li>
  </ul>
  <div class="card" style="border-left:3px solid var(--s1)">
    <p style="font-size:21px">Every one of these gets cheaper with time and more expensive
    with delay. That asymmetry is the argument for starting in the quarter you first hear
    about it.</p>
  </div>
  ${rail('austlii', 'acra', 'sebi', 'aasb', 'auasb', 'ngfs')}
`));

/* ───────────────────────── 20 · SOURCES ─────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">Sources</div>
  <h2 style="font-size:46px;margin-bottom:16px">Every figure, and<br>where it comes from.</h2>
  <div style="columns:2;column-gap:44px;font-family:'DM Mono',monospace;font-size:13px;line-height:1.6;color:var(--ink-muted)">
    ${SRC.map(([id, title, date, host], i) =>
      `<div style="break-inside:avoid;margin-bottom:12px">
         <span style="color:var(--emerald);font-weight:500">${i + 1}</span>&nbsp;
         <span style="color:var(--ink)">${title}</span><br>
         <span style="opacity:.72">${host} · ${date}</span>
       </div>`).join('')}
  </div>
  <div class="spacer"></div>
  <div class="card" style="margin-top:14px">
    <p style="font-size:17.5px">Figures are quoted as published by the issuing body on the
    dates shown. Where sources measure the same market on different bases — as with the
    voluntary carbon market — each figure is labelled with its methodology rather than
    blended. Claims that could not be corroborated across independent sources were excluded
    rather than qualified.</p>
  </div>
`));

/* ────────────────────────── 21 · CTA ────────────────────────────── */
slides.push(slide(`
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="eyebrow">Open it and take it apart</div>
    <h1 style="font-size:88px">Run it on<br>your own<br><em style="font-style:italic;color:#3BE38A">numbers.</em></h1>
    <div style="height:34px"></div>
    <p class="lede" style="max-width:820px">
      GHG calculators, ISSB and BRSR hubs, scenario analysis and the assurance workspace —
      live, free, no sign-up to start.
    </p>
    <div style="height:38px"></div>
    <div style="font-family:'DM Mono',monospace;font-size:29px;letter-spacing:.02em;color:#3BE38A;font-weight:500">
      regenesisimpact.in
    </div>
    <div style="height:24px"></div>
    <p style="font-size:19px;max-width:780px">
      If something is wrong, slow or confusing, I would rather hear that than a compliment.
    </p>
  </div>
`, { ink: true }));

/* ───────────────────────── assemble ─────────────────────────────── */
const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>The Reporting Deadlines — ReGenesis Impact</title>
<link rel="stylesheet" href="board.css">
</head><body>
${slides.join('\n')}
</body></html>`;

writeFileSync(new URL('./board.html', import.meta.url), html);
console.log(`✓ board.html written — ${slides.length} slides, ${SRC.length} sources`);
