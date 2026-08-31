# What the best-designed sites actually do, and what we changed

Two schemes were built and rejected before this one: an indigo aurora and a
jade aurora. The useful conclusion from that is not "try a third hue" — it is
that the *direction* was wrong, and the benchmark says why.

## The finding that matters

The current bar, as described by people tracking award-winning and top-converting
sites, is **cinematic motion, editorial typography, and ruthless restraint**, and
the shared property of the best designs is that they "look genuinely current
without chasing gimmicks."

Aurora gradients over frosted glass is the gimmick. It is the 2021–2023 look —
Big Sur, Stripe's gradient era, every AI startup of that cohort — and it now
reads as dated in the specific way that a trend reads dated once it is
universally available. Worse for us: a diffuse coloured wash behind a data
product actively fights the data. Every chart on the page had to be validated
against a moving, coloured background, and the contrast audit found sixteen
failures largely because the ground was doing work it should not have been doing.

## What replaces it

Three things, each with a reason rather than a preference.

### 1. Bento grids

67% of the top 100 SaaS sites on Product Hunt use bento layouts, correlated with
47% higher dwell time and 38% higher click-through. Linear, Notion and Supabase
use modular cards so a visitor can skim the surface and drop into the one cell
they care about.

This suits us unusually well: we have seven instruments, four regimes, and a
register — genuinely modular content that we were rendering as a uniform list.
A bento grid lets the important cells be physically larger, which a list cannot
express.

### 2. Editorial typography, used as the primary device

The move described is away from neutral system typography toward "more
personality, more contrast, more intentional use of type as a visual tool," with
italic serif headlines called out specifically. We already ship Playfair Display
and were using it at a polite size. It is now the loudest thing on the page,
with italic reserved for the emphasised clause — so the type carries the design
rather than an effect layer behind it.

### 3. Restraint as the surface

Near-black neutral ground, no coloured wash, no glass, hairline rules for
structure, and one accent used sparingly. Dark mode is described as reading
"modern and premium" for data-heavy products specifically, which is what we are
— but dark and *quiet*, not dark and lit.

The practical benefit is measurable rather than aesthetic: on a neutral ground
the chart palette needs no re-validation per background region, every contrast
ratio is stable, and the accent means something because it is rare.

## What we kept

The chart palette. The four market hues and the confidence ramp were validated
against the new ground and pass unchanged — worst adjacent pair ΔE 22.9 deutan.
Colour that encodes data was never the problem; colour used as decoration was.

## Sources

- [Awwwards — Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/)
- [SaaSFrame — 10 SaaS landing page trends for 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Genesys Growth — must-have components for B2B SaaS landing pages](https://genesysgrowth.com/blog/components-b2b-saas-landing-pages)
- [Veza Digital — SaaS landing page design patterns that convert](https://www.vezadigital.com/post/best-saas-landing-page-examples)
- [Pixelish — the best website designs of 2026 and why they work](https://www.pixelish.co.uk/good-web-design-websites/)

These are secondary sources reporting on the field rather than primary research,
and the engagement figures quoted for bento grids are theirs, not ours. Treat
them as direction, which is how they were used.
