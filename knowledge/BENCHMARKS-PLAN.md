# Benchmark repository — what it can be, and what it must not be

The ask: collect as much publicly reported company data as possible, build a
repository under the tools, and produce case studies.

Worth doing. But two constraints shape it, and getting them wrong would damage
the exact credibility the factor register was built to earn.

---

## Constraint 1 — the data cannot be collected from the build environment

Tested, not assumed:

| Source | Result |
|---|---|
| `cdp.net` | `000` — refused |
| `sec.gov` (EDGAR) | `000` — refused |
| `api.worldbank.org` | `000` — refused |
| `responsibilityreports.com` | `000` — refused |
| `raw.githubusercontent.com` | **200** — reachable |

Only GitHub-hosted open datasets are retrievable here. No company filings, no
CDP responses, no sustainability reports. Any company figure in this repo would
therefore have to be typed in by a human who opened the actual report.

## Constraint 2 — a case study with invented numbers is a fabricated record

This is the hard line, and it is not a technical one.

Attaching plausible-looking emissions figures to a real company name produces a
document that reads as genuine and is not. Published on a site whose entire
argument is *we show our sources and flag what we cannot support*, it would be
self-refuting — and it is the same failure as the factor that claimed AR6 while
computing AR5, only with a company's name on it.

So:

- **Never** attribute a figure to a named real company unless it came from that
  company's own published report, with the document and page recorded.
- Worked examples that are illustrative must say so **in the artefact itself**,
  not only in a commit message, and must use an obviously fictional entity.
- The test fixtures currently use "Axis Bank Limited" as a name. That is fine
  inside a local test. **It must not appear in anything published**, and the
  demo project in the app should be renamed before any case study work ships.

## What to build instead — same shape as the factor register

The register worked because provenance was mandatory and gaps were declared
rather than hidden. The benchmark repository should be built the same way.

### Schema — `knowledge/benchmarks/*.json`

```
id            · stable slug
entity        · company name exactly as it appears in the report
market        · IN | AU | SG | …
sector        · reporting sector
period        · FY covered
figures       · { scope1, scope2_location, scope2_market, scope3_total,
                  scope3_cat15?, intensity?, unit }
scope3_categories · which of the 15 are reported, and which are omitted
assurance     · none | limited | reasonable, and by whom
source        · { document, publisher, url, page }   ← all four mandatory
extracted_by  · who read the document, and when
confidence    · high | medium | low
reviewed      · YYYY-MM
```

`source.page` is deliberately mandatory. A figure whose page cannot be cited was
not properly read, and the register's lesson is that an unciteable number should
be visible as such rather than smoothed over.

### What the repository is actually for

1. **Validation, not decoration.** Real inventories are the only way to know
   whether our defaults produce plausible magnitudes. If our spend-based Cat 1
   default puts a mid-cap two orders of magnitude away from its own reported
   figure, that is a finding about our factor — which is exactly the open
   question on `s3-cat1-spend`.
2. **Peer context in the tools.** "Your Scope 2 intensity sits above the median
   of 14 reporting APAC banks" is worth more than any calculator output, and it
   needs only a handful of entries to start.
3. **Evidence for the briefings.** Both existing briefings had to exclude claims
   that could not be sourced. A repository of read-and-cited figures removes
   that constraint for the next one.

### Sequence

1. **Ten entries, hand-read, fully cited.** Ten real inventories with page
   references beat a hundred scraped rows with none, and ten is enough to test
   whether our defaults are sane.
2. **Build the validator first** — same discipline as `build-factors.mjs`, so a
   missing `source.page` fails the build rather than being merged.
3. **Run our defaults against them.** Publish the comparison, including where we
   are wrong. That is the second post, and it writes itself.
4. **Only then** consider automated collection, and only from sources whose
   terms permit it. CDP and most report aggregators do not.

### What I can do from here

- Build the schema and validator.
- Fetch and integrate GitHub-hosted open datasets where genuinely useful — OWID
  CO2 data is reachable and could sanity-check grid factors against national
  figures.
- Everything else needs a human with an unrestricted browser and the actual
  reports open.

---

*The engine itself is now covered separately: `test/simulate.mjs` runs
randomised inventories against ten invariants — additivity, linearity,
monotonicity, tier bounds — so numerical defects surface without needing real
company data at all.*
