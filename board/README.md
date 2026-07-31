# The Compliance Decade — thought-leadership board

A 21-page, 4:5 carousel PDF for LinkedIn document posts, on climate-disclosure
regulation across Singapore, Australia and India.

**Deliverable:** `ReGenesis-Impact-The-Compliance-Decade.pdf` (~1 MB, 810×1013 pt,
21 pages, all fonts embedded and subsetted).

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
