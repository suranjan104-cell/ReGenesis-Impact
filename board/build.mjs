/* ═══════════════════════════════════════════════════════════════════
   Builds board.html → the thought-leadership carousel.

   SOURCING RULE: every factual claim carries a superscript keyed to the
   SOURCES slide. Claims that could not be corroborated across independent
   sources were CUT, not softened. See sources.json for the exclusion list.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'fs';
import { hbar, vbar, timeline, quadrant, legend, stackbar, S, NEUTRAL } from './charts.mjs';

/* ── citation registry: order here defines the superscript numbers ── */
const SRC = [
  ['pik',    'Kotz, Levermann & Wenz — “The economic commitment of climate change”, <i>Nature</i> 628', '17 Apr 2024', 'pik-potsdam.de'],
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
/** superscript citation, e.g. c('apra') or c('apra','ngfs') */
const c = (...ids) => `<sup class="cite">${ids.map(i => IDX[i]).join(',')}</sup>`;
/** source rail shown at the foot of a slide */
const rail = (...ids) => `<div class="srcrail">${ids.map(i =>
  `<b>${IDX[i]}</b> ${SRC.find(s => s[0] === i)[1].replace(/<\/?i>/g, '')} · ${SRC.find(s => s[0] === i)[2]}`
).join('<br>')}</div>`;

let PAGE = 0;
const slide = (inner, { paper = false } = {}) => {
  PAGE++;
  return `<section class="slide${paper ? ' slide--paper' : ''}">${inner}
    <div class="pagenum">${String(PAGE).padStart(2, '0')}</div>
    <div class="brandmark">REGENESIS IMPACT</div>
  </section>`;
};

const slides = [];

/* ─────────────────────────── 01 · COVER ─────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">Thought leadership · ${'2026'}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="tag" style="margin-bottom:34px">Singapore · Australia · India</div>
    <h1>The<br>Compliance<br><em style="font-style:italic;color:${'#22C079'}">Decade</em></h1>
    <div style="height:34px"></div>
    <p class="lede" style="max-width:830px">
      Climate disclosure stopped being a report and became a <strong>filing obligation</strong>.
      Here is what actually changed across three markets — the dates, the thresholds,
      the stress tests — and what it costs the companies now inside the net.
    </p>
  </div>
  <div class="statrow statrow--3">
    <div class="stat"><div class="stat-num">36</div><div class="stat-lab">jurisdictions moving<br>to ISSB standards${c('ifrs')}</div></div>
    <div class="stat"><div class="stat-num">$38<small>tn</small></div><div class="stat-lab">annual climate damages<br>committed by 2050${c('pik')}</div></div>
    <div class="stat"><div class="stat-num">3</div><div class="stat-lab">markets, one<br>convergent standard</div></div>
  </div>
  ${rail('ifrs', 'pik')}
`));

/* ─────────────────────────── 02 · THESIS ────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">01 — The shift</div>
  <h2>Disclosure moved from<br>the brochure to the ledger.</h2>
  <p style="max-width:900px;margin-bottom:30px">
    For a decade, sustainability reporting was voluntary, narrative and unaudited. Between
    2024 and 2026 three things happened at once — and together they changed the nature of
    the work.
  </p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:22px">
    <div class="card">
      <h3>It became law</h3>
      <p style="font-size:19px">Australia legislated mandatory climate reporting under the Corporations Act,
      commencing 1 January 2025.${c('austlii')} Singapore set an ISSB-aligned roadmap for listed
      issuers.${c('acra24')} India mandated BRSR for the top 1,000 listed companies.${c('sebi')}</p>
    </div>
    <div class="card">
      <h3>It became audited</h3>
      <p style="font-size:19px">Australia's assurance standards took effect for periods beginning
      1 January 2025, escalating to <strong>reasonable assurance over all climate disclosures</strong>
      from 1 July 2030.${c('auasb')} Numbers now need an evidence trail.</p>
    </div>
  </div>
  <div class="card" style="border-left:3px solid ${S.s2}">
    <h3>And it became forward-looking</h3>
    <p style="font-size:19px">The hardest requirement isn't last year's emissions — it's
    <strong>climate scenario analysis</strong> and a <strong>transition plan</strong>: a defensible
    account of how the business survives futures that haven't happened yet.${c('aasb', 'mastp')}</p>
  </div>
  ${rail('austlii', 'acra24', 'sebi', 'auasb', 'aasb', 'mastp')}
`));

/* ─────────────────────── 03 · THE MACRO STAKE ───────────────────── */
slides.push(slide(`
  <div class="eyebrow">02 — Why regulators moved</div>
  <h2>The number that changed<br>supervisory minds.</h2>
  <div class="card" style="border-left:3px solid ${S.s2};margin:6px 0 26px">
    <div style="font-family:'Playfair Display',serif;font-weight:900;font-size:84px;line-height:1;letter-spacing:-.02em">
      ~19%</div>
    <p style="font-size:21px;margin-top:14px">
      reduction in global income by 2050 to which the world economy is
      <strong>already committed</strong> — largely independent of near-term emissions choices.
      Equivalent to roughly <strong>US$38 trillion a year</strong> in damages by 2050
      (likely range US$19–59 trillion).${c('pik')}
    </p>
  </div>
  <p style="max-width:920px;margin-bottom:24px">
    Peer-reviewed in <em style="font-style:italic">Nature</em>, this reframed climate from a
    long-horizon externality into a <em class="hl">near-term balance-sheet problem</em>. Supervisors
    responded in kind: the NGFS Phase V scenarios published in November 2024 project physical-risk
    GDP losses <strong>two to four times higher</strong> than earlier vintages.${c('ngfs')}
  </p>
  <div class="statrow statrow--2">
    <div class="stat" style="border-left-color:${S.s2}">
      <div class="stat-num">2–4×</div>
      <div class="stat-lab">higher projected physical-risk damages,<br>NGFS Phase V vs prior vintages${c('ngfs')}</div>
    </div>
    <div class="stat">
      <div class="stat-num">&gt;24<small>%</small></div>
      <div class="stat-lab">of global emissions now covered<br>by a carbon price${c('wb')}</div>
    </div>
  </div>
  ${rail('pik', 'ngfs', 'wb')}
`));

/* ────────────────── 04 · THE GLOBAL BASELINE (ISSB) ─────────────── */
slides.push(slide(`
  <div class="eyebrow">03 — The global baseline</div>
  <h2>One standard is winning.</h2>
  <p style="max-width:900px;margin-bottom:22px">
    The ISSB's IFRS S1/S2 has become the common denominator. Australia's AASB S2 is built on
    it. Singapore's roadmap is explicitly ISSB-aligned. That convergence is the single most
    useful fact for any company reporting in more than one market.
  </p>
  <div class="statrow statrow--3" style="margin-bottom:26px">
    <div class="stat"><div class="stat-num">36</div><div class="stat-lab">jurisdictions adopting or<br>finalising ISSB adoption${c('ifrs')}</div></div>
    <div class="stat"><div class="stat-num">~60<small>%</small></div><div class="stat-lab">of global GDP<br>represented${c('ifrs')}</div></div>
    <div class="stat"><div class="stat-num">~40<small>%</small></div><div class="stat-lab">of global market<br>capitalisation${c('ifrs')}</div></div>
  </div>
  <div class="chart-title">What that means in practice</div>
  <ul class="ticks">
    <li><strong>One inventory, three filings.</strong> A GHG inventory built to the GHG Protocol
      feeds AASB S2, Singapore's ISSB-aligned disclosures and BRSR alike.</li>
    <li><strong>The pillars are the same everywhere</strong> — governance, strategy, risk
      management, metrics &amp; targets — because they all inherit the TCFD architecture.${c('aasb')}</li>
    <li><strong>The divergence is in timing and thresholds</strong>, not substance. Which is
      exactly what the next four slides map.</li>
  </ul>
  ${rail('ifrs', 'aasb')}
`));

/* ─────────────── 05 · MASTER TIMELINE (the centrepiece) ─────────── */
slides.push(slide(`
  <div class="eyebrow">04 — The wave, mapped</div>
  <h2>Who has to report, when.</h2>
  <p style="margin-bottom:6px;max-width:930px">First mandatory reporting period by cohort. Solid = mandatory
  disclosure in force; translucent = assurance obligation begins.</p>
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
    Australia phases by <strong>company size</strong>.${c('austlii')} Singapore phases by
    <strong>listing status and market cap</strong>, and moved several dates back in August
    2025.${c('acra')} India phases by <strong>market-cap rank</strong>.${c('sebi')}
    Three different gating rules — one underlying inventory.
  </p>
  ${rail('austlii', 'acra', 'sebi')}
`));

/* ─────────────────────── 06 · AUSTRALIA I ───────────────────────── */
slides.push(slide(`
  <div class="eyebrow">05 — Australia</div>
  <h2>The widest net in the region.</h2>
  <p style="margin-bottom:20px;max-width:920px">
    Australia legislated climate reporting into the Corporations Act. An entity is captured if it
    meets <strong>at least two of three</strong> criteria — and the thresholds fall sharply with
    each group, pulling in the mid-market by 2027.${c('austlii', 'rg280')}
  </p>
  <table class="dt" style="margin-bottom:20px">
    <tr><th>Cohort</th><th>Revenue</th><th>Gross assets</th><th>Employees</th><th>First period begins</th></tr>
    <tr><td class="k">Group 1</td><td>≥ A$500m</td><td>≥ A$1bn</td><td>≥ 500</td><td class="k">on/after 1 Jan 2025</td></tr>
    <tr><td class="k">Group 2</td><td>≥ A$200m</td><td>≥ A$500m</td><td>≥ 250</td><td class="k">on/after 1 Jul 2026</td></tr>
    <tr><td class="k">Group 3</td><td>≥ A$50m</td><td>≥ A$25m</td><td>≥ 100</td><td class="k">on/after 1 Jul 2027</td></tr>
  </table>
  <div class="cardgrid cardgrid--2">
    <div class="card">
      <h3 style="font-size:26px">Two more doors in</h3>
      <p style="font-size:18.5px">NGER reporters are captured regardless of size — large NGER
      reporters land in Group 1. Asset owners with <strong>≥ A$5bn</strong> under management are
      captured from Group 2.${c('rg280')}</p>
    </div>
    <div class="card" style="border-left:3px solid ${S.s2}">
      <h3 style="font-size:26px">Group 3 is the story</h3>
      <p style="font-size:18.5px">At A$50m revenue, the obligation reaches companies with no
      sustainability function, no consultant retainer and no reporting software — the segment
      the incumbent tools were never priced for.</p>
    </div>
  </div>
  ${rail('austlii', 'rg280')}
`));

/* ─────────────────────── 07 · AUSTRALIA II ──────────────────────── */
slides.push(slide(`
  <div class="eyebrow">06 — Australia · what AASB S2 demands</div>
  <h2>Four pillars, then<br>the hard part.</h2>
  <table class="dt" style="margin-bottom:22px">
    <tr><th style="width:190px">Pillar</th><th>Requirement</th></tr>
    <tr><td class="k">Governance</td><td>Board and management processes, controls and procedures for monitoring and overseeing climate risks and opportunities.</td></tr>
    <tr><td class="k">Strategy</td><td>Material climate risks and opportunities, current and anticipated financial effects, transition plans — and <strong>climate scenario analysis</strong> to assess resilience.</td></tr>
    <tr><td class="k">Risk management</td><td>Processes to identify, assess, prioritise and monitor climate-related risks.</td></tr>
    <tr><td class="k">Metrics &amp; targets</td><td><strong>Scope 1 and 2 from Year 1.</strong> Material <strong>Scope 3 from Year 2.</strong></td></tr>
  </table>
  <div class="chart-title">The assurance ramp — limited to reasonable</div>
  ${timeline({
    years: [2025, 2026, 2027, 2028, 2029, 2030], laneH: 44, gap: 12, labelW: 258, w: 928,
    rows: [
      { label: 'Limited assurance', c: S.s2, spans: [{ from: 2025, to: 2029, text: 'governance, parts of strategy, Scope 1 & 2 — widening' }] },
      { label: 'Reasonable assurance', c: S.s2, spans: [{ from: 2030, to: 2030, text: 'all disclosures' }] },
    ],
  })}
  <p style="font-size:18px;margin-top:12px">
    Assurance standards ASSA 5000/5010 apply to periods beginning on or after 1 Jan 2025;
    <strong>reasonable assurance over all climate disclosures from 1 July 2030</strong>.${c('auasb')}
    ASIC's RG 280 also provides a fixed three-year, regulator-only liability window from
    1 Jan 2025 for Scope 3, scenario analysis, transition plans and forward-looking statements —
    <em class="hl">not blanket immunity</em>.${c('rg280')}
  </p>
  ${rail('aasb', 'auasb', 'rg280')}
`));

/* ────────────── 08 · AUSTRALIA III — stress testing is real ─────── */
slides.push(slide(`
  <div class="eyebrow">07 — Climate stress testing, made concrete</div>
  <h2>APRA priced the<br>protection gap.</h2>
  <p style="max-width:920px;margin-bottom:24px">
    In March 2026 APRA published <em style="font-style:italic">Mind the Gap</em> — a prudential
    stress test of how a changing climate affects home-insurance affordability out to 2050 under
    two severe-but-plausible scenarios. It is the clearest published example of what regulators
    now mean by climate stress testing.${c('apra')}
  </p>
  <div class="statrow statrow--2" style="margin-bottom:24px">
    <div class="stat" style="border-left-color:${S.s2}">
      <div class="stat-num">1 in 4</div>
      <div class="stat-lab">households in freestanding properties<br>uninsured by 2050 — from <b>1 in 7</b> today${c('apra')}</div>
    </div>
    <div class="stat" style="border-left-color:${S.s2}">
      <div class="stat-num">$16<small>bn</small></div>
      <div class="stat-lab">expected national annual weather-peril losses<br>by 2050, from <b>under $7bn</b> in 2024${c('apra')}</div>
    </div>
  </div>
  <div class="chart-title">Expected national weather-peril losses, A$ per year${c('apra')}</div>
  ${vbar({
    h: 386,
    data: [
      { label: '2024 actual', v: 7, disp: '<$7bn', c: NEUTRAL },
      { label: '2050 · higher physical risk', v: 16, disp: '>$16bn', c: S.s2 },
    ],
    note: '2024 baseline shown recessive',
  })}
  <p style="font-size:17.5px;margin-top:4px">
    The gap widens most in regional and rural Australia — areas with greater weather exposure and
    lower average incomes.${c('apra')} APRA's earlier 2022 banking assessment of the five largest
    banks found losses concentrated in northern-Australia mortgages and in transition-exposed
    business lending.${c('apracva')}
  </p>
  ${rail('apra', 'apracva')}
`));

/* ─────────────────────── 09 · SINGAPORE I ───────────────────────── */
slides.push(slide(`
  <div class="eyebrow">08 — Singapore</div>
  <h2>MAS made transition<br>planning supervisory.</h2>
  <p style="max-width:920px;margin-bottom:24px">
    On <strong>5 March 2026</strong> MAS issued three Guidelines on Environmental Risk Management —
    Transition Planning, separately for <strong>banks, insurers and asset managers</strong>. They
    take effect from <strong>September 2027</strong> after an 18-month transition period, as an
    addendum to the 2020 Environmental Risk Management guidelines.${c('mastp')}
  </p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:22px">
    <div class="card">
      <h3 style="font-size:26px">Risk-proportionate</h3>
      <p style="font-size:18.5px">FIs must establish a transition-planning process proportionate to
      the risk profile of their business model and the local circumstances of their
      operations.${c('mastp')}</p>
    </div>
    <div class="card" style="border-left:3px solid ${S.s1}">
      <h3 style="font-size:26px">Engagement, not exit</h3>
      <p style="font-size:18.5px">The guidelines emphasise engaging and supporting clients through
      transition rather than withdrawing financing — resilience built through stewardship.${c('mastp')}</p>
    </div>
  </div>
  <div class="card">
    <h3 style="font-size:26px">Why this reaches far beyond finance</h3>
    <p style="font-size:19px">If your bank, insurer or asset manager is supervised on the credibility
    of <em class="hl">its portfolio's</em> transition, then its questions become
    <em class="hl">your</em> disclosure requirements — regardless of whether your own company is in
    scope for mandatory reporting. MAS's 2023 Financial Stability Review had already found a
    disorderly transition materially more costly for banks and insurers than an early, orderly
    one.${c('masfsr')}</p>
  </div>
  ${rail('mastp', 'masfsr')}
`));

/* ─────────────────── 10 · SINGAPORE II — the deferral ───────────── */
slides.push(slide(`
  <div class="eyebrow">09 — Singapore · the timelines moved</div>
  <h2>Deferral is not<br>cancellation.</h2>
  <p style="max-width:920px;margin-bottom:22px">
    On <strong>25 August 2025</strong> ACRA and SGX RegCo extended most climate-reporting
    deadlines, citing the uncertain global economic landscape and varying company
    readiness.${c('acra')} The direction did not change — the runway did.
  </p>
  <table class="dt" style="margin-bottom:22px">
    <tr><th>Cohort</th><th>Was</th><th>Now</th></tr>
    <tr><td class="k">Large non-listed cos<br><span style="font-size:15px;opacity:.7">rev ≥ S$1bn <b>and</b> assets ≥ S$500m</span></td>
        <td>FY2027 · Scope 1&nbsp;&amp;&nbsp;2</td><td class="k">FY2030</td></tr>
    <tr><td class="k">Large non-listed cos<br><span style="font-size:15px;opacity:.7">external limited assurance</span></td>
        <td>FY2029</td><td class="k">FY2032</td></tr>
    <tr><td class="k">Listed, non-STI ≥ S$1bn mkt cap<br><span style="font-size:15px;opacity:.7">other ISSB-based disclosures</span></td>
        <td>FY2025</td><td class="k">FY2028</td></tr>
    <tr><td class="k">Listed, non-STI &lt; S$1bn mkt cap</td><td>FY2025</td><td class="k">FY2030</td></tr>
  </table>
  <div class="card" style="border-left:3px solid ${S.s1}">
    <h3 style="font-size:26px">The strategic read</h3>
    <p style="font-size:19px">Companies that treat a deferral as a reprieve will meet FY2030 with the
    same standing start they would have had in FY2027. Companies that use it build
    <em class="hl">three extra years of baseline data</em> — which is exactly what makes scenario
    analysis and assurance survivable when they arrive.</p>
  </div>
  ${rail('acra', 'acra24')}
`));

/* ─────────────────── 11 · SINGAPORE III — carbon tax ────────────── */
slides.push(slide(`
  <div class="eyebrow">10 — Singapore · the price signal</div>
  <h2>A carbon price that<br>nearly doubled.</h2>
  <p style="max-width:920px;margin-bottom:10px">
    Singapore was the first economy in Southeast Asia to price carbon, under the Carbon Pricing Act
    in force from 1 January 2019. The rate applies to facilities emitting
    <strong>≥ 25,000 tCO<sub>2</sub>e a year</strong>.${c('nccs')}
  </p>
  <div class="chart-title">Singapore carbon tax, S$ per tCO<sub>2</sub>e${c('nccs')}</div>
  ${vbar({
    h: 392, color: S.s1,
    data: [
      { label: '2019–2023', v: 5, disp: 'S$5' },
      { label: '2024–2025', v: 25, disp: 'S$25' },
      { label: '2026–2027', v: 45, disp: 'S$45' },
      { label: 'by 2030 (intent)', v: 65, disp: 'S$50–80', outline: true },
    ],
    note: 'dashed = stated policy intent, not legislated',
  })}
  <div class="statrow statrow--2" style="margin-top:14px">
    <div class="stat"><div class="stat-num">9×</div><div class="stat-lab">increase in the headline rate<br>between 2023 and 2026${c('nccs')}</div></div>
    <div class="stat"><div class="stat-num">5<small>%</small></div><div class="stat-lab">of taxable emissions may be offset with<br>high-quality international carbon credits${c('nccs')}</div></div>
  </div>
  ${rail('nccs')}
`));

/* ───────────────────────── 12 · INDIA ───────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">11 — India</div>
  <h2>BRSR: assurance<br>arrives by rank.</h2>
  <p style="max-width:920px;margin-bottom:22px">
    SEBI's Business Responsibility and Sustainability Reporting has been mandatory for the
    <strong>top 1,000 listed companies by market capitalisation</strong> since FY2022–23. The
    consequential change is BRSR Core — a defined set of KPIs subject to assurance, phased down the
    market-cap ranking.${c('sebi')}
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
  <div class="card" style="margin-top:22px">
    <h3 style="font-size:26px">Why India matters to the regional picture</h3>
    <p style="font-size:19px">BRSR is not ISSB — it carries its own KPI structure and a broader
    social dimension. A group operating across Singapore, Australia and India therefore needs one
    <em class="hl">emissions inventory</em> feeding three <em class="hl">different disclosure
    grammars</em>. That translation layer is where most reporting cost actually accumulates.</p>
  </div>
  ${rail('sebi')}
`));

/* ───────────── 13 · NGFS QUADRANT — scenario analysis ───────────── */
slides.push(slide(`
  <div class="eyebrow">12 — Climate stress testing</div>
  <h2>The four futures you<br>must now model.</h2>
  <p style="max-width:930px;margin-bottom:4px">
    Scenario analysis is the requirement companies most often get wrong — treating it as a
    narrative rather than a quantified exercise. The NGFS scenarios, updated to Phase V in
    November 2024, are the reference set supervisors and central banks use.${c('ngfs')}
  </p>
  ${quadrant({
    w: 928, h: 660, xLab: 'Transition risk', yLab: 'Physical risk',
    quads: [
      { tag: 'HOT HOUSE WORLD', title: 'Current Policies', c: S.s2, lines: ['Insufficient global action', 'Severe physical risk, low', 'transition risk'] },
      { tag: 'TOO LITTLE, TOO LATE', title: 'Fragmented World', c: S.s4, lines: ['Delayed and divergent policy', 'Both risks elevated —', 'the worst of both'] },
      { tag: 'ORDERLY', title: 'Net Zero 2050', c: S.s1, lines: ['Early, gradually stringent policy', 'Physical and transition', 'risks relatively subdued'] },
      { tag: 'DISORDERLY', title: 'Delayed Transition', c: S.s3, lines: ['Late, abrupt policy action', 'High transition risk', 'concentrated in exposed sectors'] },
    ],
  })}
  <p style="font-size:17.5px;margin-top:10px">
    Phase V also raised projected physical damages <strong>two- to four-fold</strong> against
    earlier vintages${c('ngfs')} — which is why the same scenario run two years ago now returns a
    materially worse answer.
  </p>
  ${rail('ngfs')}
`));

/* ───────────── 14 · TRANSITION PLANNING — what's in one ─────────── */
slides.push(slide(`
  <div class="eyebrow">13 — Transition planning</div>
  <h2>What separates a plan<br>from a pledge.</h2>
  <p style="max-width:920px;margin-bottom:24px">
    A net-zero target is not a transition plan. The UK Transition Plan Taskforce framework
    (October 2023) became the reference for what a credible plan contains — and its disclosure
    materials now sit with the IFRS Foundation, aligning it with the ISSB baseline.${c('tpt')}
  </p>
  <ul class="ticks" style="margin-bottom:24px">
    <li><strong>Ambition</strong> — a strategic objective with interim targets, not a 2050 endpoint alone.</li>
    <li><strong>Action</strong> — the specific decisions in products, operations, policy and finance that deliver it.</li>
    <li><strong>Accountability</strong> — governance, remuneration linkage, skills, and reporting against milestones.</li>
    <li><strong>Financial resourcing</strong> — the capital allocation that makes the plan real rather than aspirational.</li>
  </ul>
  <div class="card" style="border-left:3px solid ${S.s2}">
    <h3 style="font-size:26px">The test regulators apply</h3>
    <p style="font-size:19px">Both Australia's AASB S2 and MAS's guidelines converge on the same
    question: <em class="hl">can you show the working?</em> A plan that cannot be traced to an
    emissions baseline, a scenario run and a capital decision is a marketing document — and
    increasingly, a litigation surface.${c('aasb', 'mastp')}</p>
  </div>
  ${rail('tpt', 'aasb', 'mastp')}
`));

/* ──────────────── 15 · THE CAPITAL — transition finance ─────────── */
slides.push(slide(`
  <div class="eyebrow">14 — The capital at stake</div>
  <h2>Disclosure is the<br>on-ramp to finance.</h2>
  <p style="max-width:920px;margin-bottom:24px">
    Reporting obligations are not an accounting curiosity — they are the mechanism by which capital
    gets allocated. The IEA's Net Zero Roadmap put annual clean-energy investment needs at
    <strong>~US$4.5 trillion a year by the early 2030s</strong>, from a record ~US$1.8 trillion in
    2023.${c('iea')}
  </p>
  <div class="chart-title">Annual clean-energy investment, US$ trillion${c('iea')}</div>
  ${vbar({
    h: 340,
    data: [
      { label: '2023 actual', v: 1.8, disp: '$1.8tn', c: NEUTRAL },
      { label: 'required, early 2030s', v: 4.5, disp: '~$4.5tn', c: S.s1, outline: true },
    ],
    note: 'dashed = required pathway, not observed investment',
  })}
  <div class="card" style="margin-top:20px">
    <h3 style="font-size:26px">Where the gap actually sits</h3>
    <p style="font-size:19px">More than <strong>80%</strong> of clean-energy investment currently
    occurs in advanced economies and China. Annual capital spending in emerging and developing
    economies excluding China must expand <strong>more than seven-fold, to above US$1 trillion a
    year</strong>, by the end of this decade.${c('iea')} Disclosure quality is the gating factor
    for a large share of that flow.</p>
  </div>
  ${rail('iea')}
`));

/* ──────────────────── 16 · CARBON MARKETS ───────────────────────── */
slides.push(slide(`
  <div class="eyebrow">15 — Carbon markets</div>
  <h2>Three numbers that get<br>wrongly conflated.</h2>
  <p style="max-width:930px;margin-bottom:22px">
    Almost every confused claim about "the carbon market" comes from mixing these up. They measure
    different things and none of them substitutes for another.
  </p>
  <div class="statrow statrow--3" style="margin-bottom:24px">
    <div class="stat" style="border-left-color:${S.s1}">
      <div class="stat-num">$535<small>m</small></div>
      <div class="stat-lab">VCM reported <b>transaction value</b>, 2024<br>— down 29% from $723m in 2023${c('em')}</div>
    </div>
    <div class="stat" style="border-left-color:${S.s3}">
      <div class="stat-num">~$1.5<small>bn</small></div>
      <div class="stat-lab">VCM <b>whole-market valuation</b>, 2024<br>— a different methodology${c('msci')}</div>
    </div>
    <div class="stat" style="border-left-color:${S.s2}">
      <div class="stat-num">&gt;$100<small>bn</small></div>
      <div class="stat-lab"><b>carbon-pricing revenue</b> 2024 — ETS and<br>carbon taxes, <b>not</b> the voluntary market${c('wb')}</div>
    </div>
  </div>
  <table class="dt">
    <tr><th>Signal</th><th>2024 figure</th><th>What it tells you</th></tr>
    <tr><td class="k">Credits issued</td><td>305 million${c('msci')}</td><td>Supply entering the market</td></tr>
    <tr><td class="k">Credits retired</td><td>180 million${c('msci')}</td><td>Genuine demand — the number that matters</td></tr>
    <tr><td class="k">Unretired inventory</td><td>~1 billion${c('wb')}</td><td>A supply overhang suppressing price</td></tr>
    <tr><td class="k">2030 projection</td><td>US$7–35bn${c('msci')}</td><td>The range reflects real uncertainty, not consensus</td></tr>
  </table>
  ${rail('em', 'msci', 'wb')}
`));

/* ─────────────────── 17 · THE SQUEEZE (argument) ────────────────── */
slides.push(slide(`
  <div class="eyebrow">16 — The consequence</div>
  <h2>The obligation scaled<br>down. The tooling<br>didn't.</h2>
  <p style="max-width:920px;margin-bottom:26px">
    Put the three markets together and a specific population emerges: companies large enough to be
    captured, small enough to have no sustainability function. Australia's Group 3 alone reaches
    A$50m-revenue businesses from July 2027.${c('austlii')}
  </p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:22px">
    <div class="card" style="border-left:3px solid ${S.s2}">
      <h3 style="font-size:26px">What they're asked for</h3>
      <p style="font-size:18.5px">A GHG inventory to the GHG Protocol. Scope 3 by year two.
      Quantified scenario analysis. A transition plan. An audit trail that survives limited — then
      reasonable — assurance.${c('aasb', 'auasb')}</p>
    </div>
    <div class="card">
      <h3 style="font-size:26px">What they have</h3>
      <p style="font-size:18.5px">A finance lead with a spreadsheet, a quote from a consultancy
      priced for an ASX 50 balance sheet, and enterprise software with a procurement cycle longer
      than the runway to their first filing.</p>
    </div>
  </div>
  <div class="card" style="border-left:3px solid ${S.s1}">
    <h3 style="font-size:26px">The mismatch, plainly</h3>
    <p style="font-size:19.5px">The standards were written with large filers in mind and then
    extended downward by threshold. The <em class="hl">tools</em> were built for the large filers
    and never extended downward at all. That gap — not the regulation — is what makes compliance
    feel impossible in the mid-market.</p>
  </div>
  ${rail('austlii', 'aasb', 'auasb')}
`));

/* ─────────────────── 18 · WHAT WE BUILT (paper) ─────────────────── */
slides.push(slide(`
  <div class="eyebrow">17 — What we built</div>
  <h2>ReGenesis Impact.</h2>
  <p class="lede" style="max-width:900px;margin-bottom:30px">
    The same disclosure workflow the large filers buy — as tools you can open and use, in the
    browser, without a sales call.
  </p>
  <table class="dt" style="margin-bottom:24px">
    <tr><th style="width:250px">Obligation</th><th>The tool</th></tr>
    <tr><td class="k">GHG inventory<br><span style="font-size:15px;opacity:.65">Scope 1, 2 and 3</span></td>
        <td>Emissions calculators built on the GHG Protocol, holding the inventory year over year so the second cycle starts from the first.</td></tr>
    <tr><td class="k">ISSB S2 · AASB S2</td>
        <td>Disclosure hubs structured to the four pillars — you supply numbers, not a template.</td></tr>
    <tr><td class="k">BRSR</td>
        <td>India's KPI structure mapped against the same underlying inventory.</td></tr>
    <tr><td class="k">Scenario analysis</td>
        <td>Physical and transition risk screening against NGFS-style pathways.</td></tr>
    <tr><td class="k">Transition planning</td>
        <td>Ambition → action → accountability → resourcing, in the TPT structure.</td></tr>
    <tr><td class="k">Assurance readiness</td>
        <td>An evidence trail assembled as you work, for limited and reasonable assurance.</td></tr>
    <tr><td class="k">Carbon credits</td>
        <td>Portfolio and retirement tracking, with PCAF-aligned financed-emissions treatment.</td></tr>
  </table>
  <div class="card" style="border-left:3px solid ${S.s1}">
    <p style="font-size:20px">Free to use. No sign-up to start. Built for Singapore, Australia and
    India because that is where the deadlines actually land.</p>
  </div>
`, { paper: true }));

/* ─────────────────── 19 · HOW TO USE THE RUNWAY ─────────────────── */
slides.push(slide(`
  <div class="eyebrow">18 — What to do this year</div>
  <h2>Five moves, in order.</h2>
  <ul class="ticks" style="gap:20px;margin-bottom:26px">
    <li><strong>Establish which cohort you are in — and when.</strong> Size thresholds in Australia,
      listing status and market cap in Singapore, market-cap rank in India. The date drives
      everything else.${c('austlii', 'acra', 'sebi')}</li>
    <li><strong>Build the Scope 1 and 2 inventory now, even if you report later.</strong> Assurance
      tests prior-year comparatives. A baseline started in the reporting year is a baseline with no
      history.</li>
    <li><strong>Map Scope 3 categories before you measure them.</strong> Material Scope 3 lands in
      year two in Australia.${c('aasb')} Knowing which categories are material is a scoping exercise
      you can complete now.</li>
    <li><strong>Run scenario analysis as a quantified exercise, not a workshop.</strong> Phase V
      raised damages two- to four-fold;${c('ngfs')} a qualitative narrative will not survive
      assurance.</li>
    <li><strong>Keep the evidence trail from day one.</strong> Reasonable assurance over all climate
      disclosures arrives in Australia from 1 July 2030${c('auasb')} — retrofitting an audit trail
      costs more than maintaining one.</li>
  </ul>
  <div class="card">
    <h3 style="font-size:26px">The compounding asset</h3>
    <p style="font-size:19.5px">Every one of these gets cheaper with time and more expensive with
    delay. That asymmetry — not the regulation itself — is the real argument for starting in the
    quarter you first hear about it.</p>
  </div>
  ${rail('austlii', 'acra', 'sebi', 'aasb', 'ngfs', 'auasb')}
`));

/* ───────────────────────── 20 · SOURCES ─────────────────────────── */
slides.push(slide(`
  <div class="eyebrow">Sources</div>
  <h2 style="font-size:48px;margin-bottom:18px">Every figure in this deck,<br>and where it comes from.</h2>
  <div style="columns:2;column-gap:44px;font-family:'DM Mono',monospace;font-size:13.2px;line-height:1.62;color:rgba(234,244,239,.66)">
    ${SRC.map(([id, title, date, host], i) =>
      `<div style="break-inside:avoid;margin-bottom:13px">
         <span style="color:${S.s1};font-weight:500">${i + 1}</span>&nbsp;
         <span style="color:rgba(234,244,239,.88)">${title}</span><br>
         <span style="opacity:.72">${host} · ${date}</span>
       </div>`).join('')}
  </div>
  <div class="spacer"></div>
  <div class="card" style="margin-top:16px">
    <p style="font-size:17.5px">Figures are quoted as published by the issuing body on the dates
    shown. Where sources measure the same market on different bases — as with the voluntary carbon
    market — each figure is labelled with its methodology rather than blended. Claims that could not
    be corroborated across independent sources were excluded rather than qualified.</p>
  </div>
`));

/* ────────────────────────── 21 · CTA ────────────────────────────── */
slides.push(slide(`
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="eyebrow">Open it and take it apart</div>
    <h1 style="font-size:88px">Try the tools<br>on your own<br><em style="font-style:italic;color:${'#0B7A47'}">numbers.</em></h1>
    <div style="height:36px"></div>
    <p class="lede" style="max-width:820px">
      The GHG calculators, the ISSB and BRSR hubs, scenario analysis and the assurance workspace are
      live and free to use. No sign-up to start.
    </p>
    <div style="height:40px"></div>
    <div style="font-family:'DM Mono',monospace;font-size:29px;letter-spacing:.02em;color:#0B7A47;font-weight:500">
      regenesisimpact.in
    </div>
    <div style="height:26px"></div>
    <p style="font-size:19px;max-width:760px">
      If something is wrong, slow or confusing, I would rather hear that than a compliment.
      That feedback is what the roadmap is built from.
    </p>
  </div>
`, { paper: true }));

/* ───────────────────────── assemble ─────────────────────────────── */
const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>The Compliance Decade — ReGenesis Impact</title>
<link rel="stylesheet" href="board.css">
</head><body>
${slides.join('\n')}
</body></html>`;

writeFileSync(new URL('./board.html', import.meta.url), html);
console.log(`✓ board.html written — ${slides.length} slides, ${SRC.length} sources`);
