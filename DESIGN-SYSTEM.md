# The design system, and why it is a gate rather than a document

## What was here before

Two `:root` blocks, neither adopted.

The first declared a `--sem-*` semantic layer, a set of primitives, and a note
saying migration would be incremental. It never happened: seventeen thousand
lines of `index.html` contained **one** `.rg-btn` and **zero** `.rg-card`. The
second was the biopunk palette the components actually used.

Underneath both:

| | before | after |
|---|---|---|
| distinct hex literals | 145 | 0 in stylesheets |
| distinct `rgba()` triplets | 574 | 0 in stylesheets |
| total colour decisions in CSS | ~2,400 | 0 |
| greens doing the job of an accent | 5 | 1 |
| off-whites doing the job of ink | 3 | 1 |
| ambers doing the job of a warning | 3 | 1 |
| muted-ink alphas in use | 9 (from .17 to .48) | 2 steps, both computed |

Nothing failed while that was true. That is the whole problem: **a design
system with no gate is a document, not a system.**

## The scheme

The homepage was rebuilt on a near-black neutral ground with hairline rules,
editorial type and one rare accent — and kept. The twelve tool pages were
still running the aurora-and-glass vocabulary it had been rebuilt to escape:
cards lifting 4px behind a 44px shadow and a 32px accent bloom, a nav blurring
28px at 180% saturation, headlines panning a five-stop gradient across
themselves on a nine-second loop, a hero stacking three coloured radial
washes, a 60-node canvas simulation and three 80px-blurred ellipses drifting
behind all of it.

The tools now sit on the homepage's ground. Depth is line weight and one flat
step of surface — the things that stay legible behind a table of numbers.

## Colour is split by job, not by name

There are two greens, and that is deliberate:

- `--acc` `#3BE38A` — text, icons, hairlines, focus. Judged on WCAG contrast:
  **11.77:1** on the page ground.
- `--acc-fill` `#16AD6E` — chart marks and button grounds. Judged on the
  categorical lightness band, where `--acc` fails at L 0.81.

The four fill hues are the categorical theme, validated with the dataviz
checker against this exact ground:

```
#16AD6E,#4187EE,#D9761F,#9163E6  on #0A0B0B
  [PASS] Lightness band      all 4 inside L 0.48–0.67
  [PASS] Chroma floor        all 4 >= 0.1
  [PASS] CVD separation      worst adjacent ΔE 22.9 (deutan)
  [PASS] Normal-vision floor worst adjacent ΔE 24.8
  [PASS] Contrast vs surface all 4 >= 3:1
```

Tritan separation on slot 1↔2 is 5.3, below the floor. That is legal here only
because identity is never carried by colour alone anywhere on this site: every
series is direct-labelled and every chart has a table view.

Status colours are reserved and never used as a categorical slot. Three of
them — critical, info and the fourth categorical — pass as a *mark* and fail as
*text* on a raised panel, so each has a `-tx` step lifted toward white until it
clears 5:1 on the lightest of the four grounds.

## The alphas are computed, not chosen

Ink at alpha .49 is the floor for 4.5:1 on the darkest ground and .51 on the
lightest of the four. The muted step sits at **.58**. Before this there were
nine different muted alphas in use and every one below .49 failed — which is
what the all-pages audit found, 95 times, on pages that had never been
measured.

## Two surfaces

The generated report renders inside the dark app as the light sheet it will
print as. That is not an exception to the system, it is its second surface,
with its own ink (`--pa-*`) — because dark-surface ink on paper is invisible.
The colour sweep proved the point by putting `--ink-2` (58% white) on the white
sheet and `--line-2` (22% white) on the table cells. Nothing failed, because
the report panel is hidden until someone generates a report.

## Where literals are still correct

Six functions build a **standalone** document — a print window, a PDF, a
retirement certificate. Those documents never see our `:root`, so a `var()` in
them resolves to nothing and the page prints unstyled. They keep their
literals, and the gate fails if a token leaks in.

Canvas is the mirror image: it cannot parse `var()`, so canvas charts read the
tokens at runtime through `rgTok()` instead of carrying their own hex — which
is how the emission pathway had ended up a different green from the accent
beside it.

## The gates

`npm test` runs both.

**`test/design-system.mjs`** — token-level, no browser:

1. no custom property in any stylesheet names itself (a cycle silently falls
   back to the inherited value, which is the right colour for the wrong reason
   until the day it isn't — and when `--bg-0` was rewritten to `var(--bg-0)`
   during the sweep, it took every token with it and dropped the entire
   application to browser defaults on a white ground);
2. both ink steps clear 4.5:1 on all four grounds, **computed here**;
3. every paper-surface step clears 4.5:1 on both the sheet and the tint;
4. the paper block references no dark-surface token;
5. the six standalone-document builders carry no token reference;
6. a ratchet on colour literals in stylesheets, currently **0**. Lower it when
   you take literals out; never raise it.

**`test/pages.mjs`** — all thirteen pages in a real browser, at 1440px and
390px:

1. contrast, compositing the full ancestor stack (these pages are translucent
   panels over a dark ground, so the first ancestor with a fill is not the
   background);
2. horizontal overflow, ignoring anything inside a scroll container;
3. console errors — a page that throws while rendering is a glitch even if the
   screenshot looks fine.

Every branch of both gates has been proved by deliberately breaking it.
