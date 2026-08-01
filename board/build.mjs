/* ═══════════════════════════════════════════════════════════════════
   Builds board.html — "The denominator problem".

   Subject: Scope 3 Category 15 financed emissions for financial
   institutions — how the calculation works, where it breaks, and what
   actually closes the data gap. The reader is a bank, insurer or asset
   manager and is assumed to know what Scope 3 is.

   Standard: BENCHMARK-MBB.md.

   SOURCING: only claims graded VERIFIED in research are asserted.
   Single-source figures are attributed in the sentence. Items research
   could not confirm — the counterparty Scope 3 phase-in calendar, the
   motor-vehicle formula, the circulated SME data-gap percentages, one
   bank's headline reduction figure — are omitted.

   ZERO commercial content before the endnotes.
   ═══════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'fs';
import { S, NEUTRAL } from './charts.mjs';

const DOC_ID = 'RGI-2026-03';
const CUTOFF = '1 August 2026';

/* ── endnote registry ── */
const SRC = [
  ['pcafA',   'PCAF, The Global GHG Accounting and Reporting Standard for the Financial Industry, Part A, Third Edition', 'December 2025', 'carbonaccountingfinancials.com'],
  ['pcaf1',   'PCAF, Part A, First Edition — the six asset classes reviewed as conformant with the GHG Protocol', 'November 2020', 'carbonaccountingfinancials.com'],
  ['pcafB',   'PCAF, Part B — facilitated emissions for capital markets', 'December 2023', 'carbonaccountingfinancials.com'],
  ['pcafdb',  'PCAF emission factor database, following integration of CEDA', '2025', 'carbonaccountingfinancials.com'],
  ['pcafcdp', 'PCAF and CDP, “The importance of data quality in the journey toward decarbonization”', 'June 2023', 'carbonaccountingfinancials.com'],
  ['ghgp15',  'GHG Protocol, Corporate Value Chain (Scope 3) Standard, Technical Guidance chapter 15 — Investments', '2013', 'ghgprotocol.org'],
  ['ghgprev', 'GHG Protocol, Scope 3 revision discussion paper C.1 — Investments (Category 15)', '7 November 2024', 'ghgprotocol.org'],
  ['evic',    'EU Technical Expert Group on Sustainable Finance; EVIC codified in the Benchmark Regulation delegated acts', 'July 2020', 'ec.europa.eu'],
  ['rabo',    'Rabobank, “Double checking double counting: quantifying the overlap in input-output-table-based scope 3 emissions”', '2024', 'rabobank.com'],
  ['ifrs2',   'IFRS S2 “Climate-related Disclosures”, paragraph 29(a)(vi)(2) and paragraphs B58–B63', 'June 2023', 'ifrs.org'],
  ['amend',   'ISSB, Amendments to IFRS S2 — Amendments to Greenhouse Gas Emissions Disclosures (ISSB/2025/1)', '11 December 2025', 'ifrs.org'],
  ['aasb',    'AASB S2 “Climate-related Disclosures”; AASB S2025-1 amending the financed-emissions requirements', 'September 2024; 17 December 2025', 'standards.aasb.gov.au'],
  ['aasbkh',  'AASB S2 Knowledge Hub, on industry-based metrics and financed emissions', '2025', 'aasb.gov.au'],
  ['edsr1',   'AASB Exposure Draft SR1, draft paragraphs AusB59.1, AusB61.1 and AusB63.1 — superseded', 'October 2023', 'aasb.gov.au'],
  ['auasb',   'AUASB, ASSA 5000 and ASSA 5010 sustainability assurance standards', 'January 2025', 'auasb.gov.au'],
  ['mastp',   'MAS, Guidelines on Environmental Risk Management: transition planning', '5 March 2026', 'mas.gov.sg'],
  ['abs',     'Association of Banks in Singapore, Environmental Risk Questionnaire', '2022', 'abs.org.sg'],
  ['db',      'Deutsche Bank, Transition Finance Framework', 'November 2025', 'db.com'],
  ['exio',    'EXIOBASE multi-regional environmentally extended input-output database; US EPA USEEIO', 'current', 'exiobase.eu'],
  ['wbpp',    'World Bank, GDP at purchasing power parity, current international dollars', 'current', 'worldbank.org'],
];
const IDX = Object.fromEntries(SRC.map(([id], i) => [id, i + 1]));
const c = (...ids) => `<sup class="cite">${ids.map(i => IDX[i]).join(',')}</sup>`;

/* ── exhibit stack ── */
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
const mark = (k) => { NAV[k] = PAGE + 1; return ''; };
const slide = (inner, { fill = false, cover = false } = {}) => {
  PAGE++;
  const prose = !fill && !/class="exhibit"/.test(inner);
  return `<section class="slide${fill ? ' slide--fill' : ''}${prose ? ' slide--prose' : ''}${cover ? ' slide--cover' : ''}">${inner}
    <div class="pagenum">${String(PAGE).padStart(2, '0')}</div>
    <div class="brandmark">REGENESIS IMPACT</div>
  </section>`;
};

const slides = [];

/* ═══ 01 COVER ═══ */
slides.push(slide(`
  <div class="eyebrow">Financed emissions briefing</div>
  <div>
    <h1>The denominator<br><em style="font-style:italic;color:var(--emerald)">problem</em></h1>
    <div style="height:26px"></div>
    <p class="lede" style="max-width:860px">
      Scope 3 Category 15 is the only emissions figure that moves when the market moves.
      How financed emissions is calculated, the five places the calculation breaks, and
      what actually closes the data gap.
    </p>
  </div>
  <div class="cover-meta">
    <div><h4>In this briefing</h4><p>{{EXCOUNT}} exhibits · ${SRC.length} sources · data as at ${CUTOFF}</p></div>
    <div><h4>For</h4><p>Banks · insurers · asset managers</p></div>
    <div><h4>Frameworks</h4><p>PCAF Part A and B · GHG Protocol Category 15 · IFRS S2 · AASB S2</p></div>
  </div>
  <div style="font-family:var(--font-mono);font-size:15px;letter-spacing:.1em;color:var(--ink-muted);
              padding-top:20px;border-top:1px solid var(--rule)">
    AUGUST 2026 &nbsp;·&nbsp; ${DOC_ID}
  </div>
`, { cover: true }));

/* ═══ 02 CONTENTS ═══ */
slides.push(slide(`
  <div class="eyebrow">Contents</div>
  <h2>What is in this briefing.</h2>
  <div class="toc">
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Introduction</span><span class="toc-sub">Why this figure behaves unlike any other emissions number</span><span class="toc-page">{{P:intro}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Key findings</span><span class="toc-sub">Six figures</span><span class="toc-page">{{P:findings}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Executive summary</span><span class="toc-sub"></span><span class="toc-page">{{P:summary}}</span></div>
    <div class="toc-row"><span class="toc-num">01</span><span class="toc-title">The calculation</span><span class="toc-sub">Attribution, denominators and the data quality score</span><span class="toc-page">{{P:sec1}}</span></div>
    <div class="toc-row"><span class="toc-num">02</span><span class="toc-title">Where it breaks</span><span class="toc-sub">Five failures, each with a stated mechanism</span><span class="toc-page">{{P:sec2}}</span></div>
    <div class="toc-row"><span class="toc-num">03</span><span class="toc-title">Closing the gap</span><span class="toc-sub">What moves a portfolio up the scale, and the route that does not exist</span><span class="toc-page">{{P:sec3}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">What this means</span><span class="toc-sub">Five actions</span><span class="toc-page">{{P:means}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">About the research</span><span class="toc-sub">Scope, method and limitations</span><span class="toc-page">{{P:method}}</span></div>
    <div class="toc-row"><span class="toc-num">—</span><span class="toc-title">Endnotes</span><span class="toc-sub">${SRC.length} sources</span><span class="toc-page">{{P:notes}}</span></div>
  </div>
  <div class="glance">
    <div class="glance-col">
      <h4>Assumed knowledge</h4>
      <p>The reader is assumed to know what Scope 3 is. Category 15 is not defined here,
      and reporting thresholds are not covered — they are documented by the regulators
      and are not the constraint.</p>
    </div>
    <div class="glance-col">
      <h4>On single-sourced figures</h4>
      <p>Named in the sentence rather than only in the endnote. Several widely circulated
      statistics on portfolio data gaps trace to vendors with a commercial interest in
      the gap and are excluded rather than repeated.</p>
    </div>
  </div>
`));

/* ═══ 03 INTRODUCTION ═══ */
mark('intro');
slides.push(slide(`
  <div class="eyebrow">Introduction</div>
  <h2>A figure that moves when<br>the market moves.</h2>
  <p class="dek">Financed emissions is the only major emissions number where the
  reporting institution has almost no direct access to the underlying data — and where
  the reported total can fall while every borrower emits exactly as much as before.</p>
  <p style="max-width:955px">
    The mechanism is arithmetic, not accounting judgement. Attribution divides an
    institution's exposure by the counterparty's total value. For listed equity and
    corporate bonds that denominator is <strong>EVIC</strong>, a market value. When
    valuations rise the denominator rises, the attribution factor falls, and reported
    financed emissions fall.${c('pcafA', 'evic')}
  </p>
  <p style="max-width:955px">
    Everything downstream inherits the property: targets set against a baseline that
    moves with markets, year-on-year movements that may be vintage artefacts, and — on
    the parts of the book with no counterparty data — a figure that is a restatement of
    sector exposure multiplied by fixed coefficients.
  </p>
  <div class="finding">
    <div class="finding-lab">What this briefing argues</div>
    <p>Financed emissions cannot be read as a single number. The estimate, the method and
    the data quality have to travel together — and the metric worth managing is not the
    tonnage but the share of the portfolio for which the tonnage is actually measured.</p>
  </div>
`));

/* ═══ 04 KEY FINDINGS ═══ */
mark('findings');
slides.push(slide(`
  <div class="eyebrow">Key findings</div>
  <h2>Six figures.</h2>
  <p class="dek">Each is a property of the standard as written, not a criticism of any
  institution applying it.</p>
  <div class="statrow statrow--3 statrow--grow" style="margin-bottom:16px">
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">3</div>
      <div class="stat-lab">data vintages can sit inside one ratio — exposure, EVIC and counterparty emissions are measured at different dates${c('pcafA')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">3–5</div>
      <div class="stat-lab">the only data quality scores an emission factor database can supply; scores 1 and 2 require counterparty data${c('pcafdb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">33<small>%</small></div>
      <div class="stat-lab">weighting applied to facilitated emissions, leaving the remaining two-thirds attributed to no one${c('pcafB')}</div></div>
  </div>
  <div class="statrow statrow--3 statrow--grow">
    <div class="stat"><div class="stat-num">6</div>
      <div class="stat-lab">asset classes carry GHG Protocol conformance review; those added since 2020 do not${c('pcaf1')}</div></div>
    <div class="stat"><div class="stat-num">10</div>
      <div class="stat-lab">asset classes in the December 2025 third edition, from six in 2020${c('pcafA')}</div></div>
    <div class="stat"><div class="stat-num">2030</div>
      <div class="stat-lab">reasonable assurance over Australian climate disclosures, financed emissions included, from 1 July${c('auasb')}</div></div>
  </div>
`));

/* ═══ 05 EXECUTIVE SUMMARY ═══ */
mark('summary');
slides.push(slide(`
  <div class="eyebrow">Executive summary</div>
  <h2>The estimate is only as good<br>as the score attached to it.</h2>
  <p style="max-width:955px">
    Financed emissions attributes a share of a counterparty's emissions to whoever funded
    it: exposure divided by counterparty value, multiplied by that counterparty's
    emissions.${c('pcafA')} The design is deliberate — equity and debt are weighted
    equally so that all capital providers to one company sum to its total emissions, and
    that common denominator is the standard's principal control against double counting.
  </p>
  <p style="max-width:955px">
    The difficulty is that the denominator is not one thing. For listed equity it is
    EVIC, a market value including cash taken at fiscal year end.${c('evic')} For business
    loans it is book equity plus debt. For mortgages and vehicles it is value at
    origination. For sovereign debt it is PPP-adjusted GDP.${c('pcafA')} Only one of those
    moves with markets, and it governs the largest listed exposures.
  </p>
  <p style="max-width:955px">
    Where counterparty data is absent the calculation falls to economic-activity
    estimation: revenue multiplied by a sector emission factor, or at the bottom of the
    scale an exposure converted to implied revenue through sector asset-turnover ratios.
    At that point the figure has stopped measuring the counterparty and started measuring
    the sector.${c('pcafA')}
  </p>
  <div class="finding">
    <div class="finding-lab">The consequence for management</div>
    <p>On a book scored 4 or 5, financed emissions cannot detect a borrower
    decarbonising. It moves only when exposure moves — so the reported figure can be
    reduced by reallocating between sector codes with no change in the real economy.
    That is why the weighted data quality score and the coverage percentage are the
    numbers carrying the information.${c('pcafA')}</p>
  </div>
`));

/* ═══ 06 DIVIDER 01 ═══ */
mark('sec1');
slides.push(slide(`
  <div class="sec-num">01</div>
  <h2>The calculation</h2>
  <p class="sec-lead">One formula, seven denominators and a five-point quality scale.
  The mechanics matter because every failure in the next section is a property of them.</p>
  <div class="sec-toc">
    <div><span>{{P:x1}}</span>The attribution factor</div>
    <div><span>{{P:x3}}</span>The data hierarchy and the score</div>
    <div><span>{{P:x2}}</span>Seven denominators, one formula</div>
    <div><span>{{P:conf}}</span>What carries conformance, and what does not</div>
  </div>
`, { fill: true }));

/* ═══ 07 EXHIBIT 1 — ATTRIBUTION ═══ */
mark('x1');
slides.push(slide(`
  <div class="eyebrow">01 — The calculation</div>
  <h2>Exposure over value,<br>times emissions.</h2>
  ${exhibit(
    'The whole method is one ratio, and the fragile half sits underneath the line.',
    'Attribution of counterparty emissions to a financial institution, per counterparty.',
    `<div class="formula-wrap">
       <div class="formula">
         <div class="formula-term">
           <div class="frac">
             <div class="frac-num">Outstanding amount</div>
             <div class="frac-bar"></div>
             <div class="frac-den">Total value of the counterparty</div>
           </div>
           <div class="formula-note">ATTRIBUTION FACTOR</div>
         </div>
         <div class="formula-op">×</div>
         <div class="formula-term">
           <div class="formula-out">Counterparty emissions</div>
           <div class="formula-note">SCOPE 1 AND 2</div>
         </div>
         <div class="formula-op">=</div>
         <div class="formula-term">
           <div class="formula-out" style="border-color:var(--emerald)">Financed emissions</div>
           <div class="formula-note">SUMMED ACROSS THE PORTFOLIO</div>
         </div>
       </div>
       <table class="dt dt--compact" style="margin-top:6px">
         <tr><th style="width:230px">Half of the ratio</th><th>Who holds it</th><th style="width:230px">Measured</th></tr>
         <tr><td class="k">Numerator</td><td>The institution's own book — a carrying amount it controls and can reconcile</td><td class="num">at the reporting date</td></tr>
         <tr><td class="k">Denominator</td><td>The counterparty, or the market; seven different definitions across the asset classes</td><td class="num" style="color:var(--s2)">varies by asset class</td></tr>
       </table>
     </div>`,
    {
      note: 'PCAF applies the same attribution principle across asset classes, weighting equity and debt equally, so that all capital providers to one counterparty sum to its total emissions. That is the standard’s principal control against double counting within an institution.',
      source: 'PCAF Part A, Third Edition, December 2025',
    }
  )}
  <p style="font-size:19px;margin-top:10px">
    The numerator is a carrying amount from the institution's own books. The denominator
    comes from the counterparty and, for the largest asset class, from the market. The two
    are not measured on the same basis, at the same frequency, or by the same party.
  </p>
`));

/* ═══ 08 EXHIBIT 2 — DENOMINATORS ═══ */
mark('x2');
slides.push(slide(`
  <div class="eyebrow">01 — The calculation</div>
  <h2>Seven denominators,<br>one formula.</h2>
  ${exhibit(
    'Only one denominator moves with markets, and it governs the largest listed exposures.',
    'Denominator by asset class under PCAF Part A, with the basis of measurement.',
    `<table class="dt">
      <tr><th style="width:280px">Asset class</th><th>Denominator</th><th style="width:180px">Basis</th></tr>
      <tr><td class="k">Listed equity and corporate bonds</td><td><strong>EVIC</strong> — market capitalisation of ordinary and preferred shares, plus book value of total debt and minority interests, without deducting cash</td><td class="num" style="color:var(--s2)">market value</td></tr>
      <tr><td class="k">Business loans and unlisted equity</td><td>Total company equity plus debt</td><td class="num">book value</td></tr>
      <tr><td class="k">Project finance</td><td>Total project equity plus debt</td><td class="num">book value</td></tr>
      <tr><td class="k">Commercial real estate</td><td>Property value at loan origination</td><td class="num">at origination</td></tr>
      <tr><td class="k">Mortgages</td><td>Property value at loan origination</td><td class="num">at origination</td></tr>
      <tr><td class="k">Motor vehicle loans</td><td>Vehicle value at loan origination</td><td class="num">at origination</td></tr>
      <tr><td class="k">Sovereign debt</td><td>PPP-adjusted GDP in international dollars</td><td class="num">national accounts</td></tr>
    </table>`,
    {
      note: 'EVIC was proposed by the EU Technical Expert Group on Sustainable Finance and codified in the Benchmark Regulation delegated acts in July 2020; the “including cash” construction avoids treating as cash what the market does not price as cash. PCAF moved the sovereign denominator to PPP-adjusted GDP in 2022, on the reasoning that debt stock is not a proxy for the value of a country.',
      source: 'PCAF Part A; EU Technical Expert Group on Sustainable Finance; World Bank',
    }
  )}
`));

/* ═══ 09 EXHIBIT 3 — THE LADDER ═══ */
mark('x3');
slides.push(slide(`
  <div class="eyebrow">01 — The calculation</div>
  <h2>Five scores, and how far<br>each sits from the borrower.</h2>
  ${exhibit(
    'The scale measures distance from the counterparty, not precision of arithmetic.',
    'PCAF data quality score for corporate asset classes, from reported emissions to sector estimation.',
    `<div class="ladder">
      <div class="ladder-row"><div class="ladder-score" style="background:var(--s1)">1</div>
        <div class="ladder-body"><div class="ladder-t">Reported emissions, verified by a third party</div>
        <div class="ladder-d">The counterparty measured it and someone independent checked it.</div></div></div>
      <div class="ladder-row"><div class="ladder-score" style="background:#3f9169">2</div>
        <div class="ladder-body"><div class="ladder-t">Reported emissions unverified, or primary energy-consumption data</div>
        <div class="ladder-d">Self-calculated by the counterparty, or built from its actual energy use with matched factors.</div></div></div>
      <div class="ladder-row"><div class="ladder-score" style="background:#8a9553">3</div>
        <div class="ladder-body"><div class="ladder-t">Primary production data</div>
        <div class="ladder-d">Physical output — tonnes, megawatt hours, square metres — with production-specific factors.</div></div></div>
      <div class="ladder-row"><div class="ladder-score" style="background:#c9843c">4</div>
        <div class="ladder-body"><div class="ladder-t">Company revenue with a sector emission factor</div>
        <div class="ladder-d">The counterparty's own revenue, multiplied by tCO<sub>2</sub>e per unit of sector revenue.</div></div></div>
      <div class="ladder-row"><div class="ladder-score" style="background:var(--s2)">5</div>
        <div class="ladder-body"><div class="ladder-t">Outstanding amount only</div>
        <div class="ladder-d">Revenue inferred from the exposure using sector asset-turnover ratios, then the sector factor applied. Two estimation layers.</div></div></div>
    </div>`,
    {
      note: 'each asset class has its own table; real estate scores are built on metered building energy, energy performance certificates and floor area rather than company financials. Institutions must disclose a weighted-average score by asset class, weighted by outstanding amount, alongside the percentage of the portfolio covered.',
      source: 'PCAF Part A, Third Edition',
    }
  )}
`));

/* ═══ 10 CONFORMANCE ═══ */
mark('conf');
slides.push(slide(`
  <div class="eyebrow">01 — The calculation</div>
  <h2>What carries conformance,<br>and what does not.</h2>
  <p class="dek">"PCAF is GHG Protocol conformant" is true of the 2020 standard and its
  six asset classes. It is not true of everything published since.</p>
  <div class="cardgrid cardgrid--2" style="margin-bottom:16px">
    <div class="card">
      <h3 style="font-size:25px">Reviewed</h3>
      <p style="font-size:20px">The six asset classes in the 2020 first edition — listed
      equity and corporate bonds, business loans and unlisted equity, project finance,
      commercial real estate, mortgages, and motor vehicle loans — were reviewed and found
      in conformance with the GHG Protocol Scope 3 Standard for Category 15.${c('pcaf1', 'ghgp15')}</p>
    </div>
    <div class="card" style="border-left:3px solid var(--s2)">
      <h3 style="font-size:25px">Not reviewed</h3>
      <p style="font-size:20px">Sovereign debt and emission removals, added in 2023, and
      everything added in the December 2025 third edition — sub-sovereign debt,
      securitisations, use-of-proceeds structures and undrawn commitments. The GHG
      Protocol has since closed the review service that granted the mark.${c('pcafA')}</p>
    </div>
  </div>
  <div class="finding">
    <div class="finding-lab">Why it matters now</div>
    <p>The GHG Protocol has a live revision of Scope 3, including a discussion paper on
    Category 15 dated November 2024.${c('ghgprev')} An institution building a
    financed-emissions capability today is building against a standard whose newest
    components carry no conformance review and whose parent standard is under revision.
    That is an argument for documenting method choices, not for waiting.</p>
  </div>
`));

/* ═══ 11 DIVIDER 02 ═══ */
mark('sec2');
slides.push(slide(`
  <div class="sec-num">02</div>
  <h2>Where it breaks</h2>
  <p class="sec-lead">Five failures. Each has a mechanism that can be stated precisely,
  and each changes what the reported number can be used for.</p>
  <div class="sec-toc">
    <div><span>{{P:x4}}</span>The denominator moves</div>
    <div><span>{{P:x6}}</span>Scores 4 and 5 measure the sector</div>
    <div><span>{{P:x5}}</span>Three vintages in one ratio</div>
    <div><span>{{P:x7}}</span>Double counting, three kinds</div>
    <div><span>{{P:facil}}</span>Two-thirds attributed to no one</div>
  </div>
`, { fill: true }));

/* ═══ 12 EXHIBIT 4 — EVIC ═══ */
mark('x4');
slides.push(slide(`
  <div class="eyebrow">02 — Where it breaks</div>
  <h2>Reported emissions fall<br>when markets rise.</h2>
  ${exhibit(
    'A rising counterparty valuation cuts attributed emissions with no change in the real economy.',
    'Effect of a change in counterparty market value, exposure and physical emissions held constant.',
    `<table class="dt">
      <tr><th style="width:260px"></th><th>Year 1</th><th>Year 2, valuation up 40%</th></tr>
      <tr><td class="k">Exposure held</td><td class="num">100</td><td class="num">100 — unchanged</td></tr>
      <tr><td class="k">Counterparty EVIC</td><td class="num">1,000</td><td class="num" style="color:var(--s2)">1,400</td></tr>
      <tr><td class="k">Attribution factor</td><td class="num">10.0%</td><td class="num" style="color:var(--s2)">7.1%</td></tr>
      <tr><td class="k">Counterparty emissions</td><td class="num">1,000 tCO<sub>2</sub>e</td><td class="num">1,000 tCO<sub>2</sub>e — unchanged</td></tr>
      <tr><td class="k">Financed emissions reported</td><td class="num">100 tCO<sub>2</sub>e</td><td class="num" style="color:var(--s2)"><strong>71 tCO<sub>2</sub>e</strong></td></tr>
    </table>`,
    {
      note: 'illustrative arithmetic, not observed data. The mechanism is the standard as written — EVIC is a market value, so the attribution factor is partly a function of price. The effect reverses in a drawdown: reported financed emissions rise in a falling market.',
      source: 'PCAF Part A; EU Technical Expert Group on Sustainable Finance; ReGenesis Impact analysis',
    }
  )}
  <p style="font-size:19px;margin-top:10px">
    PCAF has acknowledged that institutions may apply corrections, and multi-year EVIC
    averaging is used in practice. Averaging suppresses the variance. It does not change
    the fact that the denominator is a price.${c('pcafA')}
  </p>
`));

/* ═══ 13 EXHIBIT 5 — VINTAGES ═══ */
mark('x5');
slides.push(slide(`
  <div class="eyebrow">02 — Where it breaks</div>
  <h2>Three vintages in<br>one ratio.</h2>
  ${exhibit(
    'The three inputs to a single year’s figure are not measured at the same date.',
    'Typical measurement dates for the components of a financed-emissions disclosure.',
    `<table class="dt">
      <tr><th style="width:270px">Component</th><th>Where it comes from</th><th style="width:210px">Typical vintage</th></tr>
      <tr><td class="k">Outstanding amount</td><td>The institution's own book</td><td class="num">reporting date</td></tr>
      <tr><td class="k">EVIC</td><td>Market data, conventionally at the counterparty's prior fiscal year end</td><td class="num" style="color:var(--s2)">prior year</td></tr>
      <tr><td class="k">Counterparty emissions</td><td>The counterparty closes its year, compiles an inventory, obtains assurance and publishes; a provider then ingests and maps it</td><td class="num" style="color:var(--s2)">up to two years earlier</td></tr>
    </table>`,
    {
      note: 'the lag is structural rather than incidental — it is the time cost of the counterparty’s own reporting cycle plus provider processing. PCAF cites reduced data lag as a benefit of integrating CEDA into its database.',
      source: 'PCAF Part A; PCAF database documentation',
    }
  )}
  <div class="finding" style="margin-top:12px">
    <div class="finding-lab">What it does to a trend</div>
    <p>A year-on-year movement can be produced entirely by vintages shifting — a newer
    emissions dataset arriving, or an EVIC reference date rolling forward — with no change
    in exposure or in counterparty behaviour. A trend line is not evidence of
    decarbonisation unless the vintages are held constant or the movement is decomposed.</p>
  </div>
`));

/* ═══ 14 EXHIBIT 6 — SCORES 4-5 ═══ */
mark('x6');
slides.push(slide(`
  <div class="eyebrow">02 — Where it breaks</div>
  <h2>At the bottom of the scale,<br>the borrower disappears.</h2>
  ${exhibit(
    'Economic-activity estimation cannot distinguish two counterparties in the same sector.',
    'What each data option can and cannot detect.',
    `<table class="dt">
      <tr><th style="width:250px">Option</th><th>Detects a counterparty decarbonising</th><th>Moves when</th></tr>
      <tr><td class="k">1 — reported</td><td><strong>Yes</strong>, once the counterparty reports it</td><td>counterparty emissions change</td></tr>
      <tr><td class="k">2 — physical activity</td><td><strong>Yes</strong>, directly and without reporting lag</td><td>energy use or production changes</td></tr>
      <tr><td class="k">3a — revenue × sector factor</td><td><strong>No</strong> — intra-sector dispersion is not captured</td><td>revenue changes, or the factor is updated</td></tr>
      <tr><td class="k">3b — exposure only</td><td><strong>No</strong> — revenue is itself inferred from exposure</td><td>exposure or sector classification changes</td></tr>
    </table>`,
    {
      note: 'revenue-based factors are denominated in currency, so inflation, exchange-rate movement and margin change shift the estimate with no physical change. PCAF’s 2025 edition recommends applying an inflation adjustment to economic emission factors, and a year-on-year fluctuation analysis to separate real change from mechanical change.',
      source: 'PCAF Part A, Third Edition',
    }
  )}
  <p style="font-size:19px;margin-top:10px">
    Two companies in one sector with a tenfold difference in carbon intensity receive the
    same estimate per unit of revenue. On a book scored 4 or 5 the reported figure is, in
    substance, the institution's <strong>sector exposure mix multiplied by fixed
    coefficients</strong>.
  </p>
`));

/* ═══ 15 EXHIBIT 7 — DOUBLE COUNTING ═══ */
mark('x7');
slides.push(slide(`
  <div class="eyebrow">02 — Where it breaks</div>
  <h2>Double counting,<br>three kinds.</h2>
  ${exhibit(
    'One of the three is controlled by the standard; the other two are not.',
    'Forms of double counting in financed emissions, and their treatment.',
    `<table class="dt">
      <tr><th style="width:230px">Kind</th><th>Mechanism</th><th style="width:210px">Treatment</th></tr>
      <tr><td class="k">Within an institution</td><td>Holding both debt and equity in one counterparty, or lending along a single value chain</td><td class="num" style="color:var(--s1)">controlled by the common denominator</td></tr>
      <tr><td class="k">Across institutions</td><td>Attribution is designed so all capital providers to one counterparty sum to 100% of its emissions — correct per reporter, but the figures are not additive across the system</td><td class="num" style="color:var(--s2)">inherent</td></tr>
      <tr><td class="k">Inside input-output estimates</td><td>Multi-regional input-output models used for counterparty Scope 3 overlap statistically; Rabobank finds the overlap depends on the institution's market share, and that the multipliers give no insight into its size</td><td class="num" style="color:var(--s2)">unquantified</td></tr>
    </table>`,
    {
      note: 'PCAF states that certain metrics should not be aggregated for portfolio-level comparison, citing data availability, aggregation and potential double counting. Rabobank proposes that institutions using an input-output model report the statistical double-counting percentage alongside the figure.',
      source: 'PCAF Part A; Rabobank, “Double checking double counting”',
    }
  )}
  <p style="font-size:19px;margin-top:10px">
    Avoided emissions and emission removals must be reported separately and may not be
    netted against Scope 1, 2 or 3 financed emissions, at facility or portfolio
    level.${c('pcafA')}
  </p>
`));

/* ═══ 16 FACILITATED ═══ */
mark('facil');
slides.push(slide(`
  <div class="eyebrow">02 — Where it breaks</div>
  <h2>Two-thirds attributed<br>to no one.</h2>
  <p class="dek">Capital markets activity sits under a separate standard, with a single
  scalar in place of a measurement — and the gap between the two standards creates an
  arbitrage neither closes.</p>
  <div class="statrow statrow--2" style="margin-bottom:16px">
    <div class="stat"><div class="stat-num">100<small>%</small></div>
      <div class="stat-lab">attribution basis when the exposure sits on the balance sheet, under Part A${c('pcafA')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">33<small>%</small></div>
      <div class="stat-lab">weighting factor applied to facilitated emissions under Part B, with disclosure of the factor required${c('pcafB')}</div></div>
  </div>
  <div class="cardgrid cardgrid--2">
    <div class="card">
      <h3 style="font-size:25px">What the factor is</h3>
      <p style="font-size:20px">A single judgement applied uniformly, reported as derived
      from the methodology used to classify globally systemically important banks — not
      from an estimate of a facilitator's causal contribution to an issuance.${c('pcafB')}</p>
    </div>
    <div class="card" style="border-left:3px solid var(--s2)">
      <h3 style="font-size:25px">What follows from it</h3>
      <p style="font-size:20px">Facilitated emissions are reported separately and are not
      added to financed emissions. Moving an exposure from the balance sheet to a
      facilitated structure reduces the attributed share from the whole to a third, with
      no change in the underlying activity.</p>
    </div>
  </div>
`));

/* ═══ 17 DIVIDER 03 ═══ */
mark('sec3');
slides.push(slide(`
  <div class="sec-num">03</div>
  <h2>Closing the gap</h2>
  <p class="sec-lead">What moves a portfolio up the quality scale — and the one route
  that is closed, which is where most programmes start.</p>
  <div class="sec-toc">
    <div><span>{{P:x8}}</span>The route that does not exist</div>
    <div><span>{{P:x9}}</span>What actually moves the score</div>
    <div><span>{{P:assur}}</span>The deadline that sets the horizon</div>
  </div>
`, { fill: true }));

/* ═══ 18 EXHIBIT 8 — THE CLOSED ROUTE ═══ */
mark('x8');
slides.push(slide(`
  <div class="eyebrow">03 — Closing the gap</div>
  <h2>No database reaches<br>above score 3.</h2>
  ${exhibit(
    'Emission factor databases supply scores 3 to 5 by construction; 1 and 2 exist only where the counterparty supplied data.',
    'What each source delivers, against the data quality score it can support.',
    `<table class="dt">
      <tr><th style="width:290px">Source</th><th>What it supplies</th><th style="width:140px">Score</th></tr>
      <tr><td class="k">Counterparty, assured</td><td>Reported Scope 1 and 2, third-party verified</td><td class="num" style="color:var(--s1)">1</td></tr>
      <tr><td class="k">Counterparty, self-reported<br>or primary energy data</td><td>Self-calculated emissions, or metered energy consumption</td><td class="num" style="color:var(--s1)">2</td></tr>
      <tr><td class="k">Counterparty, production data</td><td>Physical output volumes with matched factors</td><td class="num">3</td></tr>
      <tr><td class="k">PCAF emission factor database<br><span style="font-size:15px;opacity:.68">CEDA integrated, around 60,000 factors</span></td><td>Sector and regional factors, including “rest of world” coverage</td><td class="num" style="color:var(--s2)">3–5</td></tr>
      <tr><td class="k">Input-output models<br><span style="font-size:15px;opacity:.68">EXIOBASE, USEEIO</span></td><td>Emissions per unit of spend or revenue, by sector and region</td><td class="num" style="color:var(--s2)">4–5</td></tr>
    </table>`,
    {
      note: 'a separate PCAF European building emission factor database serves real estate portfolios, covering EU countries plus Norway, Switzerland and the United Kingdom. CDP is the principal route to reported data at scores 1 and 2; PCAF and CDP published a joint mapping of their data quality concepts in June 2023.',
      source: 'PCAF database documentation; PCAF and CDP, June 2023; EXIOBASE; US EPA',
    }
  )}
  <p style="font-size:19px;margin-top:10px">
    This is the finding most programmes reach late. Buying more factors improves coverage
    and consistency. It cannot raise the score above 3, because the score measures
    distance from the counterparty — and a database is, by construction, not the
    counterparty.
  </p>
`));

/* ═══ 19 EXHIBIT 9 — WHAT MOVES IT ═══ */
mark('x9');
slides.push(slide(`
  <div class="eyebrow">03 — Closing the gap</div>
  <h2>What actually moves<br>the score.</h2>
  ${exhibit(
    'Every route above score 3 runs through the counterparty, which makes collection a programme rather than a request.',
    'Approaches with published precedent, and what each delivers.',
    `<table class="dt">
      <tr><th style="width:240px">Approach</th><th>What it delivers</th><th style="width:180px">Precedent</th></tr>
      <tr><td class="k">Standardised industry<br>questionnaire</td><td>A common baseline across lenders, so clients answer once rather than once per bank; MAS points banks to the ABS Environmental Risk Questionnaire as a baseline template for collecting customer information</td><td class="num">Singapore${c('abs', 'mastp')}</td></tr>
      <tr><td class="k">Counterparty transition<br>scoring</td><td>Converts partial counterparty data into a decision-useful signal; Deutsche Bank operates a 1–7 Transition Maturity Score with defined minimum plan requirements, combining an automated score with manual adjustment</td><td class="num">published framework${c('db')}</td></tr>
      <tr><td class="k">Reported-data pipelines</td><td>Routes counterparty disclosure into the calculation at scores 1 and 2; PCAF and CDP have mapped their data quality concepts onto each other</td><td class="num">PCAF and CDP${c('pcafcdp')}</td></tr>
      <tr><td class="k">Proxy governance</td><td>Documented decisions on proxy sources, assumptions, methodologies and limitations, substantiated and feeding the next iteration</td><td class="num">MAS expectation${c('mastp')}</td></tr>
    </table>`,
    {
      note: 'MAS sets expectations on the governance of proxy data rather than mandating a measurement method, and frames portfolio financed emissions as a metric banks may choose to use. The obligation to disclose financed emissions sits in the ISSB-aligned reporting regimes rather than in the transition planning guidelines.',
      source: 'MAS transition planning guidelines; Association of Banks in Singapore; Deutsche Bank; PCAF and CDP',
    }
  )}
`));

/* ═══ 20 ASSURANCE ═══ */
mark('assur');
slides.push(slide(`
  <div class="eyebrow">03 — Closing the gap</div>
  <h2>The deadline that sets<br>the horizon.</h2>
  <p class="dek">Australian financial institutions must reach reasonable assurance over
  financed emissions built on proxy data. That, not the first disclosure date, determines
  how far data quality has to move and by when.</p>
  <div class="statrow statrow--3" style="margin-bottom:16px">
    <div class="stat"><div class="stat-num">Yr 1</div><div class="stat-lab">limited assurance over governance, parts of strategy, and Scope 1 and 2 only${c('auasb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">Yr 2–3</div><div class="stat-lab">limited assurance phases across remaining disclosures — where Scope 3 and financed emissions first attract it${c('auasb')}</div></div>
    <div class="stat" style="border-left-color:var(--s2)"><div class="stat-num">2030</div><div class="stat-lab">reasonable assurance over all climate disclosures, periods commencing on or after 1 July${c('auasb')}</div></div>
  </div>
  <div class="finding">
    <div class="finding-lab">A correction worth carrying</div>
    <p>Financed emissions is <strong>not</strong> an industry-based metric. Under IFRS S2
    it sits in the main body at paragraph 29(a)(vi)(2), with guidance at
    B58–B63.${c('ifrs2')} AASB S2 omitted the industry-based metrics requirement but
    retained the financed-emissions package deliberately,${c('aasbkh')} and AASB S2025-1
    amends it — which a requirement that did not exist could not be.${c('aasb')} The
    weaker "consider the applicability of" wording appeared in Exposure Draft SR1 and was
    not carried into the final standard.${c('edsr1')}</p>
  </div>
`));

/* ═══ 21 WHAT THIS MEANS ═══ */
mark('means');
slides.push(slide(`
  <div class="eyebrow">What this means</div>
  <h2>Five actions.</h2>
  <ul class="ticks" style="margin-bottom:14px">
    <li><strong>Publish the weighted data quality score and the coverage percentage
      beside the tonnage.</strong> PCAF requires both by asset class; a total without them
      cannot be interpreted, and disclosing them is the cheapest credibility
      available.${c('pcafA')}</li>
    <li><strong>Decompose any year-on-year movement before presenting it.</strong>
      Separate exposure change, valuation change, vintage change and real emissions
      change — the fluctuation analysis PCAF's 2025 edition recommends.${c('pcafA')}</li>
    <li><strong>Target the score, not the tonnage, on the book scored 4 or 5.</strong> On
      those exposures the tonnage cannot detect decarbonisation; only moving up the data
      hierarchy changes what the number is able to show.</li>
    <li><strong>Treat counterparty data collection as a programme with a standard
      instrument.</strong> Every route above score 3 runs through the counterparty, and a
      shared questionnaire reduces client fatigue while producing comparable
      answers.${c('abs')}</li>
    <li><strong>Document the method choices now, while they are still
      defensible.</strong> Denominator conventions, EVIC reference dates, averaging,
      sector mapping and proxy sources all become assurance evidence before
      2030.${c('auasb', 'mastp')}</li>
  </ul>
  <div class="finding">
    <div class="finding-lab">The asymmetry</div>
    <p>Coverage and data quality improve only at the speed counterparties respond, which
    is measured in reporting cycles. Assurance arrives on a fixed date. The distance
    between those two clocks is the whole of the problem.</p>
  </div>
`));

/* ═══ 22 ABOUT THE RESEARCH ═══ */
mark('method');
slides.push(slide(`
  <div class="eyebrow">About the research</div>
  <h2>Scope, method and<br>limitations.</h2>
  <p class="note" style="max-width:955px">
    <strong>Scope.</strong> The measurement of Scope 3 Category 15 financed emissions
    under the PCAF standard, its treatment in IFRS S2 and AASB S2, and the assurance
    sequence applying in Australia. Reporting thresholds and phase-in dates are out of
    scope, as are insurance-associated emissions under PCAF Part C.
  </p>
  <p class="note" style="max-width:955px">
    <strong>Method.</strong> Compiled from the standards and supporting documentation
    listed in the endnotes. Where a figure or characterisation rests on a single published
    source, that source is named in the sentence. Illustrative arithmetic is labelled as
    such. <strong>Data as at ${CUTOFF}.</strong>
  </p>
  <div class="finding">
    <div class="finding-lab">Limitations</div>
    <p style="font-size:20px">Three matter. Several widely circulated statistics on the
    share of portfolios lacking counterparty data trace to vendors with a commercial
    interest in the size of that gap; they are excluded rather than repeated. The
    sector-by-sector phase-in of counterparty Scope 3 reporting could not be confirmed and
    is described only in principle. And this briefing describes the standard as published
    — it does not report what any institution has disclosed, and the GHG Protocol's
    revision of Category 15 remains in progress.${c('ghgprev')}</p>
  </div>
`));

/* ═══ 23 ENDNOTES ═══ */
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
  <p class="note" style="font-size:16px">
    Figures are quoted as published by the issuing body. Claims that could not be
    corroborated across independent sources have been excluded rather than qualified.
  </p>
`));

/* ═══ 24 ABOUT ═══ */
slides.push(slide(`
  <div class="eyebrow">About ReGenesis Impact</div>
  <h2>Who produced this<br>briefing.</h2>
  <p style="max-width:920px">
    ReGenesis Impact builds disclosure tooling for companies and financial institutions in
    Australia and Singapore — the GHG inventory, the ISSB and AASB disclosure structures,
    scenario analysis, and PCAF-aligned financed-emissions treatment with data quality
    scoring. The tools are free to use and require no account to start.
  </p>
  <div class="statrow statrow--2">
    <div class="stat"><div class="stat-lab" style="margin-top:0">Web</div>
      <div style="font-family:var(--font-mono);font-size:25px;color:var(--emerald);font-weight:500;margin-top:8px">regenesisimpact.in</div></div>
    <div class="stat"><div class="stat-lab" style="margin-top:0">Correspondence</div>
      <div style="font-family:var(--font-mono);font-size:25px;color:var(--emerald);font-weight:500;margin-top:8px">info@regenesisimpact.in</div></div>
  </div>
  <p style="font-size:19px;max-width:920px">
    Corrections are welcome. This briefing describes a standard that is actively being
    revised; if a requirement or figure has moved, please write and it will be amended.
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

/* ── assemble ── */
const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>The denominator problem — ReGenesis Impact</title>
<link rel="stylesheet" href="board.css">
</head><body>
${slides.join('\n')}
</body></html>`;

const resolved = html
  .replace(/\{\{EXCOUNT\}\}/g, String(EXN))
  .replace(/\{\{P:(\w+)\}\}/g, (_, k) => {
    if (!NAV[k]) throw new Error(`contents references unknown section "${k}"`);
    return String(NAV[k]).padStart(2, '0');
  });
if (/\{\{/.test(resolved)) throw new Error('unresolved token');
writeFileSync(new URL('./board.html', import.meta.url), resolved);
console.log('✓ nav:', NAV);
console.log(`✓ board.html — ${slides.length} pages, ${EXN} exhibits, ${SRC.length} endnotes`);
