# Benchmarking the ESRS tool against the CSRD software market

August 2026. A desk review of published vendor material, done to answer one
question: what do the serious CSRD platforms do that our ESRS tool did not?

No platform was trialled. Everything below is what vendors say about themselves,
plus analyst and law-firm commentary, and it is graded on that basis. The
machine-readable version lives at `knowledge/esrs/competitors.json` and is
rendered inside the tool itself, on the Benchmark tab.

## Who the market actually is

**Workiva** is the enterprise incumbent. Its differentiator is not a feature
list, it is a workflow: iXBRL tagging happens inside the document authoring
environment, alongside the content review, rather than as a technical pass after
the statement is signed off. It carries XBRL tagging for ESRS, Article 8, ESEF
and local taxonomies, and an audit trail built to take the same scrutiny as the
financial statements.

**Position Green** acquired **Greenomy** and is consolidating the fragmented
European market. Greenomy's material is the closest thing to what our tool tries
to be — digitised ESRS and EU Taxonomy requirements you navigate in-product, with
the official reporting template exportable already filled out in Excel, PDF or
XBRL.

**Cozero**, **Sweep** and **Plan A** are the EU-native carbon platforms that
appear in every CSRD comparison. Their published material reachable from here was
thin enough that most of their row is `unknown`, and it stays that way. Marking a
competitor down for something we could not find is how a benchmark becomes
marketing.

## What the benchmark found we were missing

Four gaps, in the order they matter.

**1. EU Taxonomy Article 8 — no coverage at all.** This is the one that mattered.
Article 8 of Regulation (EU) 2020/852 requires an in-scope undertaking to publish
the proportion of turnover, CapEx and OpEx associated with Taxonomy-aligned
activities. It is mandatory alongside the ESRS narrative, every serious
competitor supports it, and we had nothing. Now built as tab 4.

**2. Digital tagging — no position.** Vendors are still selling against a
timetable that no longer exists. Mandatory XBRL tagging of the sustainability
statement is suspended by Directive (EU) 2026/470, in force 18 March 2026, until
the ESEF Delegated Regulation (EU) 2019/815 is amended to cover it. We are not
going to build a tagging engine. Telling a preparer where the mandate actually
stands, and scoring whether their statement could be tagged when it resumes, is
worth more than pretending otherwise. Tab 5.

**3. IFRS S2 carry-across — the thing we should already have had.** We run an
ISSB hub. A company arriving at CSRD from IFRS S2 or AASB S2 has most of the
climate disclosure built, and nothing in the product said which parts carry.
Built from the joint IFRS Foundation / EFRAG Interoperability Guidance. Tab 6.

**4. Our own data was stale, and stated as fact.** The tool asserted in a banner
that the simplified ESRS set was *pending*. It was adopted on 3 July 2026 — 61%
fewer mandatory datapoints, applying to financial years beginning on or after
1 January 2027. That banner had been wrong for nearly two months. It is now
driven off the data file and prints the adoption date, so the next time it goes
stale it goes stale visibly.

## Where we deliberately do not compete

Written into `competitors.json` under `us.honest`, enforced by the build, and
printed in the product beneath the comparison table:

- **Disclosure requirements** are enumerated for ESRS 2 and E1 only.
- **Article 8** computes the KPIs and applies the four gates, but does not ship
  the technical screening criteria per activity per objective. You assert whether
  substantial contribution and DNSH are met; we record the assertion.
- **Tagging** — we assess readiness. We do not tag. Workiva does.
- **Assurance** — the pack prints provenance, data quality and its own
  limitations. It is not a reviewer workflow with sign-offs and role separation,
  which is what an audit firm actually works in.

## Where the win is narrow and real

Every number opens to the factor behind it with source, vintage and confidence,
including the four factors we cannot source. Nothing leaves the browser. There is
no sales call. On a matrix of eleven capabilities that is three columns — but
they are three columns nobody else in this list offers at once.

## What the build now refuses to compile

`knowledge/build-esrs.mjs` enforces the rules this document is written under:

- every vendor carries at least one source URL, or the build fails;
- coverage is `yes | partial | no | unknown`, and `unknown` is the honest default;
- every capability we grade ourselves below `yes` must carry a written reason in
  `us.honest`, or the build fails — so a future edit cannot quietly promote us;
- Article 8 must keep six objectives, three KPIs with both numerator and
  denominator stated, and all four gates;
- a suspended tagging mandate must name the instrument that suspended it;
- a sequence step marked `done` must carry a date.

Each of those was verified by deliberately breaking it and confirming the build
failed with the right message.

## The engine is simulated, not just built

`test/simulate-esrs.mjs` drives `esrsTxCompute` through 1,500 seeded iterations
against three KPIs and ten properties: shares stay finite and inside [0,1],
aligned is always a subset of eligible, the four bands partition the denominator
exactly, failing minimum safeguards zeroes alignment everywhere, sub-threshold
activities are excluded per KPI independently, a zero denominator produces zeros
rather than a division, the KPIs are scale-invariant, turning safeguards on can
only raise alignment, a zero-value activity is inert, and over-entry is flagged
rather than producing a share above 100%.

An eleventh property has nothing to do with arithmetic: `esrsTxCompute` throws if
asked to compute without a threshold and without loaded data, so the 10% figure
cannot acquire a second home in the engine. That is the defect the emission
factor register audit found in our own code — one value living in three places —
and this is the gate that stops it recurring here.

All ten arithmetic properties were verified by injecting the corresponding defect
and confirming the simulation caught it.

## Sources

- [Workiva — CSRD reporting](https://www.workiva.com/solutions/csrd-reporting)
- [Workiva — Use the ESRS XBRL taxonomy](https://support.workiva.com/hc/en-us/articles/22929364571796-Use-the-ESRS-XBRL-taxonomy-for-sustainability-reporting)
- [ESG Today — Position Green acquires Greenomy](https://www.esgtoday.com/position-green-acquires-sustainability-reporting-and-compliance-solutions-provider-greenomy/)
- [Greenomy — ESG & sustainability reporting software](https://www.greenomy.io/esg-reporting-free-trial)
- [Linklaters — EU Taxonomy Article 8 reporting obligations](https://sustainablefutures.linklaters.com/post/102l7by/quick-guide-key-sustainability-disclosure-regimes-eu-taxonomy-regulation-artic)
- [A&O Shearman — Delegated regulation to simplify EU taxonomy reporting published in OJ](https://finreg.aoshearman.com/delegated-regulation-to-simplify-eu-taxonomy-reporting-and-screening-criteria-published-in-oj)
- [Arthur Cox — EU Taxonomy: simplification measures adopted](https://www.arthurcox.com/insights/eu-taxonomy-simplification-measures-adopted/)
- [XBRL International — EFRAG's 2026 work programme](https://www.xbrl.org/news/efrags-2026-work-programme-puts-xbrl-taxonomy-front-and-centre/)
- [EFRAG — Digital reporting with XBRL](https://www.efrag.org/en/sustainability-reporting/esrs-workstreams/digital-reporting-with-xbrl)
- [Cooley — Commission adopts revised EU CSRD reporting standards](https://www.cooley.com/news/insight/2026/2026-07-21-european-commission-adopts-revised-eu-csrd-reporting-standards)
- [EFRAG — Delegated act on revised ESRS and the voluntary standard](https://www.efrag.org/en/news-and-calendar/news/european-commission-publishes-delegated-act-on-revised-esrs-and-voluntary-sustainability-reporting)
- [IFRS Foundation and EFRAG — ESRS–ISSB interoperability guidance](https://www.ifrs.org/content/dam/ifrs/supporting-implementation/issb-standards/esrs-issb-standards-interoperability-guidance.pdf)

Every one of these is a secondary source. EUR-Lex, EFRAG's own site, ESMA and the
Commission's finance pages are all blocked from the build environment, which is
why every ESRS data file in this repository is graded medium confidence and says
so in the product footer rather than only in a commit message.
