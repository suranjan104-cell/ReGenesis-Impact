# Two decisions that are actually one

Pointers 4 (how this makes money) and 5 (which market) look separate. They are
not: the answer to one determines the answer to the other, and drifting on
either forecloses the other by accident.

This is a memo, not a recommendation to implement. Both decisions are the
owner's.

---

## The constraint nobody can engineer around

**Free, no account, browser-only is an excellent acquisition position and a poor
monetisation one.** There is no server-side state to gate, no seat to charge for,
no usage to meter. That is not an oversight — it follows directly from the thing
that makes the product defensible.

The competitive position is: *a platform whose agents do the work has to hold
your data; we produce the same evidence without ever receiving it.* Every
mechanism for charging — accounts, sync, team workspaces, saved history —
requires holding something. **Charging pulls against the moat.**

So the question is not "what do we charge for" but **"what is the smallest thing
we can hold that is worth paying for, without holding the thing that matters."**

## The three honest options

### A. Stay free. Monetise advisory.
The tools are the credential; the money is consulting and bespoke work.

- Preserves the privacy claim intact.
- Requires no engineering at all.
- Does not scale beyond the founder's hours, and every hour spent on delivery is
  an hour not spent on the product that generates the leads.

### B. Charge for the assurance pack in a team context.
The tools stay free and browser-local forever. What is paid for is the
*deliverable* — a pack with the organisation's branding, a retained history
across reporting cycles, and a reviewer able to comment on it.

- The pack is genuinely the thing worth paying for. Nobody returns for a
  calculator; they return for a document an auditor accepted.
- **Only the pack leaves the browser, and only when exported.** Activity data
  never has to. The privacy claim survives with one honest caveat instead of
  being abandoned.
- Requires accounts, storage and a review flow. That is real work and it is the
  first server-side state in the product.

### C. Licence the register and the method.
Publish the factor register, the data quality scheme and the crosswalk as a
maintained data product other tools embed.

- Plays to the genuinely rare asset: sourced, versioned, deterministic, with
  weaknesses declared.
- The register currently has **four unsourced factors**. It is not licensable
  until that is fixed, which makes this contingent on Pointer 1 rather than
  parallel to it.
- Small market, and it is a data business, not a software one.

**The tension to hold in view:** B is the only option that compounds, and it is
the only one that touches the moat. A is safe and caps out. C is elegant and is
not yet true.

## Why the market decision is the same decision

Three geographies × seven tools is too wide for a small team with no users, and
the width is currently hiding which option above is viable.

**The depth is unambiguously in financed emissions for APAC financial
institutions.** Category 15, PCAF attribution, the data quality tiers, the
register, and both published briefings all point at the same reader. Credibl's
framework list — BRSR, GRI, ESRS, TCFD — stops short of it entirely.

That reader also happens to be the one for whom option B works best:

- A bank's InfoSec function is the single audience that treats "data never
  reaches your servers" as decisive rather than as a nice line.
- Financed emissions is annual, repeated, and assured — so a pack with retained
  history across cycles is worth money to them specifically.
- PCAF data quality scoring is already their vocabulary; the tiers need no
  selling.

Pick a different market and option B weakens: a mid-cap corporate filing BRSR
does not care as much where the data sits, and will not pay for an assurance
pack they only need once a year at low stakes.

**So: choosing the market chooses the model.** Choosing FI narrows to B.
Choosing "everyone in APAC" leaves only A.

## What would settle it

Nothing in this memo is worth more than one conversation with a real preparer at
an APAC bank — which is Pointer 3, and why it was the recommendation.

Three questions worth asking them, in this order:

1. Show them the assurance pack. **Would your assurance provider accept this as
   a starting point?** If no, B is dead and the product needs work before any
   model discussion.
2. **Does it matter to you that the data never leaves the browser?** If they
   shrug, the moat is smaller than we think and A becomes more attractive.
3. **What did you use last year, and what did it cost?** Establishes whether
   there is a budget line at all, which A and B both depend on.

Until those are answered, the sequencing that keeps every option open is:
finish Pointer 1 (it is a precondition for C and a credibility requirement for
B), publish Pointer 2, and do not build accounts.

**Building accounts before question 2 is answered is the one move that cannot be
undone cheaply.**
