# The denominator problem — financed emissions briefing

A 24-page, 4:5 briefing PDF on Scope 3 Category 15 financed emissions for
financial institutions: how the calculation works, where it breaks, and what
actually closes the data gap.

**Deliverable:** `ReGenesis-Impact-The-Denominator-Problem.pdf` (~0.96 MB,
810×1013 pt, 24 pages, 9 exhibits, 20 endnotes, all fonts embedded).

Built to the standard in **`BENCHMARK-MBB.md`**. Repositioning rationale in
**`OUTLINE.md`**.

## Thesis

Financed emissions is the only major emissions figure where the reporting
institution has almost no direct access to the underlying data, and where the
reported total can fall while every borrower emits as much as before. The
attribution denominator for listed equity is EVIC — a market value — so the
figure is partly a function of price.

The value-add is not a description of PCAF. It is: where the calculation
breaks, what each failure does to the number's usefulness, and which route out
is closed. The last is the finding most programmes reach late — **an emission
factor database cannot lift a portfolio above data quality score 3**, because
the score measures distance from the counterparty and a database is not the
counterparty.

## Five failures, each with a stated mechanism

1. **EVIC volatility** — a 40% rise in counterparty valuation cuts attributed
   emissions by roughly a third with exposure and physical emissions unchanged.
2. **Three vintages in one ratio** — exposure at the reporting date, EVIC at the
   prior year end, counterparty emissions up to two years earlier. A trend line
   can be a vintage artefact.
3. **Scores 4 and 5 measure the sector, not the borrower** — two companies in
   one sector with a tenfold intensity difference get the same estimate per unit
   of revenue.
4. **Double counting, three kinds** — one controlled by the standard, one
   inherent across institutions, one unquantified inside input-output estimates.
5. **Facilitated emissions at 33%** — two-thirds attributed to no one, and a
   balance-sheet-to-facilitated shift reduces the attributed share by two-thirds
   with no change in activity.

## A correction carried into the briefing

Financed emissions is **not** an industry-based metric. Under IFRS S2 it sits in
the main body at paragraph 29(a)(vi)(2) with guidance at B58–B63. AASB S2
omitted the industry-based metrics requirement but retained the
financed-emissions package deliberately — and AASB S2025-1 amends it, which a
requirement that did not exist could not be. The weaker "consider the
applicability of" wording appeared in Exposure Draft SR1 (October 2023) and was
not carried into the final standard. Australian financial institutions face the
full package from their second reporting year.

## Excluded rather than repeated

Several widely circulated statistics on the share of portfolios lacking
counterparty data trace to vendors with a commercial interest in the size of the
gap. The counterparty Scope 3 phase-in calendar, the motor-vehicle loan formula
circulating in secondary sources, and one bank's headline reduction figure could
not be corroborated and are omitted.

## Page-fill gate

```bash
node fill-check.mjs                 # defaults: fill >=82%, interior <=120px, trailing <=60px
MIN=0 MAXGAP=200 MAXTAIL=60 node fill-check.mjs
```

Reports, per page, the share of the content area occupied and two separate
measurements: the **trailing hole** (empty space at the foot — the real defect)
and the worst **interior gap** (spacing between blocks — rhythm). Full-bleed
colour pages are gated on the trailing hole only.

Current state: worst trailing hole **32px**, mean fill **71.6%**. Exhibit and
table pages fill by construction — the exhibit body is the flexible element and
absorbs the spare height.

## Structure

```
01  Cover                        13  Exhibit 5 — three vintages
02  Contents                     14  Exhibit 6 — scores 4 and 5
03  Introduction                 15  Exhibit 7 — double counting
04  Key findings                 16  Facilitated emissions at 33%
05  Executive summary            17  Divider — 03 Closing the gap
06  Divider — 01 The calculation 18  Exhibit 8 — the closed route
07  Exhibit 1 — attribution      19  Exhibit 9 — what moves the score
08  Exhibit 2 — denominators     20  The assurance deadline
09  Exhibit 3 — the score ladder 21  What this means
10  Conformance                  22  About the research
11  Divider — 02 Where it breaks 23  Endnotes
12  Exhibit 4 — EVIC volatility  24  About ReGenesis Impact
```

Contents-page numbers are **computed from the slide order at build time**, not
hardcoded — the build throws if a section referenced by the contents does not
exist.

## Rebuild

```bash
node build.mjs                       # → board.html
/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --no-pdf-header-footer --print-to-pdf=board.pdf file://$PWD/board.html
```

`build.mjs` holds the content and the citation registry; `charts.mjs` holds the
SVG chart helpers; `board.css` holds the design system; `sources.json` is the
citation registry including the **exclusion list**.

## How sourcing was handled

Every factual claim on a slide carries a superscript that resolves to the
numbered SOURCES page (slide 20). The rule applied throughout: **claims that
could not be corroborated across independent sources were cut, not softened.**

`sources.json` records what was deliberately **excluded** and why, including:

- GFANZ membership/scale and the "US$130 trillion" figure — not verifiable
  against a primary source.
- NGFS "15% of GDP by 2050 / 30% by 2100" — traced only to secondary coverage.
  The deck uses the verified "2–4× higher than prior vintages" framing instead.
- "39 jurisdictions" for ISSB adoption — the deck uses the IFRS Foundation's
  own June 2025 figure of 36.
- SEBI's 2024–25 value-chain/assurance relaxations — actively being amended;
  not asserted.

Three assumptions were **corrected** during research and independently
re-confirmed before use:

| Assumption | Correct position |
|---|---|
| Singapore carbon tax S$45 in 2025 | S$25 in 2024–25; **S$45 from 2026–27** |
| Large non-listed cos report FY2027 | Deferred to **FY2030** (ACRA/SGX, 25 Aug 2025) |
| MAS transition-planning guidelines 2023–24 | Issued **5 Mar 2026**, effective **Sep 2027** |

### ⚠️ Verification caveat — read before publishing

This build environment's network policy blocked direct access to essentially
every primary-source domain (`mas.gov.sg`, `acra.gov.sg`, `apra.gov.au`,
`treasury.gov.au`, `asic.gov.au`, `aasb.gov.au`, `ifrs.org`, `ngfs.net` …), so
**no primary PDF was opened directly.** Every figure was instead corroborated
across multiple independent web-search results, and the highest-stakes figures
were re-verified a second time on independent queries.

That is strong for widely-reported facts (thresholds, dates, standard
structure, the APRA headline numbers) but it is **not** the same as reading the
source document. Before posting publicly, open the URLs on the SOURCES page and
confirm the figures you are least willing to be wrong about — in particular:

1. Australia's Group 1/2/3 thresholds and start dates (ASIC RG 280)
2. The Singapore deferral table (ACRA news announcement 887)
3. The APRA *Mind the Gap* figures (1-in-7 → 1-in-4; <$7bn → >$16bn)
4. Singapore's carbon-tax trajectory (NCCS)

## Design notes

- **Surface is the product's light "Regenerative Editorial" system** — warm paper
  `#F6F1E7`, ink `#0E231A`, emerald `#0B7A47`. The deep-ink variant
  (`.slide--ink`) is used once, for the closing frame.
- **Chart palette re-validated for the beige surface** (it was previously tuned
  for a dark surface and would not have held). Run:
  `node scripts/validate_palette.js "#0B7A47,#C2410C,#2a78d6,#b0306a" --mode light --surface "#F6F1E7"`
  → lightness band, chroma floor, CVD separation (worst adjacent ΔE 8.1),
  normal-vision floor (25.7) and contrast ≥3:1 all pass.
- **Colour follows the entity**: emerald = Singapore, orange = Australia,
  blue = India, across every chart. Grey (`NEUTRAL`) is the muted baseline used
  by the emphasis pattern — never an entity.
- **Print has no hover layer**, so every chart ships direct value labels plus a
  legend; identity is never carried by colour alone.
- **Dashed outline = stated intent / required pathway**, not an observed or
  legislated figure (Singapore's 2030 range; the IEA investment requirement).
  Encoded in the mark, not just a footnote.
- **Voice**: lead with the figure, not the set-up. No sentence exists only to
  introduce the next one; where a claim can be a table or a chart, it is not a
  paragraph.
- **Typography fully embedded** — Playfair Display / DM Sans / DM Mono. The
  Unicode subscript-two and arrow glyphs are absent from these faces, so
  `tCO₂e` uses a real `<sub>` and the quadrant axis arrows are drawn as SVG
  geometry. Verified: zero fallback fonts in the output.
