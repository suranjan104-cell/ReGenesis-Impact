# MBB standard — McKinsey / BCG / Bain

Companion to `BENCHMARK.md` (Big 4). Where the two conflict, this file wins:
the board is now built to MBB conventions.

Unlike the Big 4 study, the core of this one is **measured from primary
sources** — two McKinsey Global Institute PDFs were retrieved and parsed
directly (font names, point sizes, vector fill colours, text bounding boxes):

- *Geopolitics and the geometry of global trade: 2026 update*, MGI, Mar 2026, 59pp
- *McKinsey Global Institute: 2025 in charts*, Dec 2025, 24pp

## Verified directly against those PDFs

| Convention | Measurement |
|---|---|
| Exhibit vs Figure | `Exhibit N` **54**, `Figure N` **0** — McKinsey uses Exhibit |
| Source line | `Source:` **30**, `Sources:` **0** — singular |
| Note line | `Note:` **23**, `Notes:` **0** — singular |
| Page fill | median trailing space at the page foot **1.8%** of page height |
| Pages with a real hole | **5 of 59**, four of which are *deliberately blank* section breaks |

**Correction to the research pass.** The subagent reported that MGI leaves 56%
of pages with two or more inches empty, and concluded that "content never
stretches to fill". That was an artifact of measuring **text baselines only** —
it ignored vector drawings, which is where the charts are. Re-measuring with
drawings included gives a median trailing gap of 1.8%. **MGI pages are densely
filled.** The instruction to remove empty space and the MBB standard agree.

Per-firm nomenclature (Tier B, from search, not verified against a PDF):
BCG uses `Exhibit`; **Bain uses `Figure`, and plural `Sources:` / `Notes:`**.

## The exhibit stack

Every element flush left to one x-coordinate. No indents, no centring.

```
Exhibit N            ← quieter than the title: body weight, body-ish size.
                       The number addresses; the title talks.
Action title.        ← the finding, as a sentence, ending in a full stop
Measure, period, unit  ← neutral descriptor, no full stop, unit last
[ chart / table ]    ← grows to fill the page
Note: …              ← method, definitions, exclusions — never interpretation
Source: …            ← primary providers first, semicolon-delimited,
                       own analysis appended last, no terminal period
FIRM SIGNATURE       ← travels with the exhibit when it is excerpted
```

Measured action-title statistics (n=24, MGI trade report):

- **100% end in a full stop**
- median **11 words / 70 characters**, maximum 2 lines
- sentence case, **finite directional verb in 24 of 24** (grew, surged, fell,
  weakened, boomed, shifted — never "overview of" or "trends in")
- roughly one third carry a concessive that pre-empts the obvious objection:
  *"US trade grew **while** shifting away from China."*
- **set at 1.32× body size, in Medium weight.** Hierarchy comes from weight and
  position, not size — the single most-missed detail when people imitate this.

Source-line grammar, verbatim from MGI:

```
Source: ASEAN Stats; Eurostat; US Census Bureau; McKinsey Global Institute analysis
```

Subtitle grammar: `⟨Measure⟩ ⟨by breakdown⟩, ⟨period⟩, ⟨unit⟩` — unit last, after
the final comma, spelled out (`$ billion`, `%`, `thousand km`).

## Colour

Measured across MGI exhibits: the **median simple exhibit carries one to two
chromatic colours** plus greys. Grey is the default for everything not being
argued about; the brand colour marks the subject of the argument. Multi-hue
categorical palettes appear only where the chart genuinely encodes six or more
nominal categories.

## Typography

Two families, total. In the 59-page report the serif (Bower) is **1.0% of all
characters** — covers, chapter numerals, section headings and pull quotes only.
89.6% of the document is a single cut of the sans at one size. The serif never
appears in body copy, in an exhibit title, or in a source line.

## Argument structure

- **The dek is the apex.** The answer sits above the body, compressed into one
  sentence, usually carrying the count of the recommendations: *"…this can only
  change if **nine** interdependent requirements are met."* A reader who stops
  at the dek still leaves with the finding.
- **Pyramid**: answer first, then supporting arguments, then data. Every heading
  is a claim, not a topic.
- **Ranges for modelled forward-looking figures; point estimates for observed
  stocks and totals.** Modal split: `would` for the cost of a defined scenario,
  `could` for upside.
- **Scope fence** every estimate: "across 63 use cases analyzed".

## What was deliberately NOT copied

The research was critical of its own subject, and these habits were rejected:

- **Closings that carry no information** — "the stakes have never been higher",
  "the time to act is now", "companies ignore these trends only at their peril".
  These can be deleted from any MBB article without loss. This board closes on
  the next decision instead.
- **Correlation presented as causation** — "companies that do X are 27% more
  likely to outperform" surrounded by prescriptive prose. Identified in the
  research as the house style's most consequential intellectual weakness.
- **The adjective tricolon that always lands on optimism** — "fragmented,
  disorderly, and ripe with opportunity". A rhetorical schedule, not an analytic
  one.
- **A range whose upper bound is the only number that travels.** MGI published
  $2.6–4.4tn with six layers of hedging; the firm's own media headline used
  "$4.4 trillion". A range treated that way is a point estimate with deniability.
- **Verbs of unearned agency**: unlock, capture, harness, ignite, drive,
  supercharge, rewire, boost. Plus *step change*, *at scale*, *imperatives*,
  *moves* inflation, *organizing principle*.

The acceptance test carried over from the research: **a term earns its place
only if deleting it would change what the sentence commits you to.**

## Page-fill gate

`fill-check.mjs` enforces this. It distinguishes:

- **trailing hole** — empty space at the foot of the page. This is the defect.
- **interior gap** — spacing between blocks. This is rhythm.

Full-bleed colour pages (section dividers) are gated on the trailing hole only:
the colour field is the design, so absence of ink is not absence of content.
