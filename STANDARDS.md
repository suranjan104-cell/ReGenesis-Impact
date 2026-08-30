# GHG Protocol and ISO 14064, built into the tools

The GHG inventory results header used to read
`PCAF & GHG PROTOCOL COMPLIANT`. It checked nothing. The engine did compute to
the standard, but the tool had never asked the preparer for three of the things
the standard requires, and then asserted conformance anyway.

That header now reads `CONFORMANCE CHECKED, NOT ASSERTED`, and there is a check
behind it.

## What is actually checked

Twelve conditions from the GHG Protocol Corporate Accounting and Reporting
Standard, nine required and three recommended, each evaluated against what is in
the form rather than against a checkbox someone ticked:

| Condition | Satisfied by |
|---|---|
| Organisational boundary stated | a consolidation approach selected |
| Operational boundary stated | Scope 1 or Scope 2 present |
| Scope 2 dual reporting | location-based and market-based both computed |
| Base year stated | a base year entered |
| Recalculation policy with a significance threshold | both the policy text and a threshold above zero |
| GWP assessment set stated | the set carried by the factor register |
| Exclusions disclosed and justified | exclusion text entered |
| Methodologies and factors disclosed | every non-zero line traces to at least one register factor |
| Gross emissions separate from trades | holds by construction — nothing here nets offsets |
| Scope 3 screened across all fifteen | the screening statement |
| Data quality assessed | an inventory DQ score exists |
| Verification status stated | a status other than "none" |

Four of those had no input in the tool at all before this: the recalculation
policy, the significance threshold, the exclusions statement, and the Scope 3
screening statement. Asserting compliance while never asking for them was the
actual defect; adding the check without adding the fields would just have
converted a false claim into a permanent red mark.

## ISO 14064-1, as a second view of the same tonnes

ISO 14064-1:2018 dropped the three-scope model for six categories, and the
difference is not cosmetic — it splits the GHG Protocol's Scope 3 across four
categories on a different principle. A company certified to ISO and reporting
under the GHG Protocol is presenting one inventory two ways and should not be
recomputing it.

| ISO category | Scope | What the engine puts here |
|---|---|---|
| 1 Direct emissions and removals | Scope 1 | Scope 1 |
| 2 Imported energy | Scope 2 | Scope 2 |
| 3 Transportation | Scope 3 | business travel, employee commuting |
| 4 Products used by the organisation | Scope 3 | purchased goods and services, waste |
| 5 Use of products from the organisation | Scope 3 | use of sold products, investments |
| 6 Other sources | Scope 3 | nothing — deliberately open, and rare |

Waste is the one placement where sources disagreed. Most put waste disposal in
category 4 as a service purchased by the organisation; one secondary source put
organisation-produced waste in category 6. Category 4 is used, the mapping is
graded medium rather than high, and the row is flagged in the product as
`mapping medium` rather than the disagreement being resolved silently.

## The invariant that makes the second view trustworthy

The six categories must add to exactly what the three scopes add to. That is the
whole basis on which a preparer can hand the ISO view to a certifier, and it is
the property most likely to break quietly: a line that loses its mapping vanishes
from the category view while the scope total stays right, so nothing on the page
looks wrong.

Three separate things defend it.

`build-standards.mjs` refuses to compile if any line the engine can emit has no
ISO category, if a mapped line's scope disagrees with its category's scope, if a
line is mapped twice, or if a mapping names a line the engine does not emit. The
engine's line list is written out in the validator rather than derived from
`index.html` on purpose — adding a Scope 3 category to the engine fails the build
until a human decides which ISO category it belongs to. A mapping that grows on
its own is a mapping nobody checked.

`stdIsoView` surfaces an unmapped line as unmapped, with its tonnage, rather than
dropping it — and the totals row includes it, so the reconciliation still holds
and the problem is visible instead of invisible.

`test/simulate-standards.mjs` drives 900 seeded inventories through eleven
properties: the categories reconcile to the scope total; every line lands in
exactly one category; no line is counted twice; category 1 equals Scope 1 and
category 2 equals Scope 2 exactly; categories 3–6 together equal Scope 3; no
category total is negative or non-finite; removing a mapping still reconciles and
is reported as unmapped; every requirement in the data has a test the engine
implements; an unrecognised test returns "not checked" rather than "met"; each
condition flips when its input is removed; and the reconciliation flag reports
false when the totals genuinely disagree.

That last one was added after the first pass missed it. Every generated case
reconciled, so asserting the flag was `true` proved only that the happy path
worked — a flag hardcoded to `true` passed all of it. The property now feeds a
total that deliberately disagrees with the lines, which is what a drift between
the engine's total and its line list would look like.

Every other property was verified the same way: inject the defect, confirm the
simulation catches it.

## What this is not

It is a self-assessment against published summaries of both standards. It is not
a certification, and it is not verification under ISO 14064-3 — which is a
separate exercise, by an independent verifier, at limited or reasonable
assurance.

`ghgprotocol.org` and `iso.org` are both blocked from the build environment, so
both requirement sets are drawn from professional-firm and practitioner
summaries and graded **medium** confidence. That is stated in the panel footer,
not only here.
