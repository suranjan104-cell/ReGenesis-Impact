# ReGenesis Impact — Go-To-Market Plan

The product is live, self-healing and grounded in a verified knowledge base.
GTM is now a distribution problem. This plan is sequenced so every step is
executable by one founder with the automation already in this repo, and
every step is measurable in the Supabase events data you already collect.

## 1 · Positioning

**One-liner:** The AI climate-compliance platform built for Asia-Pacific —
generate ISSB S2, BRSR and AASB S2 disclosures in hours, not months.

**Against incumbents** (Watershed, Persefoni, Workiva): they sell to
enterprise sustainability teams at enterprise prices with quarter-long
onboarding. We win on *time-to-first-report* (minutes, no sign-up), *APAC
regulatory depth* (BRSR Core, AASB S2 groups, SGX/MAS built in — not
add-ons), and *price* (free tools → paid platform).

**Wedge:** the free tools ARE the marketing. Every report generated is a
demo that took the buyer's own data seriously.

## 2 · ICP (in priority order)

| # | Who | Trigger | Entry tool |
|---|---|---|---|
| 1 | Sustainability lead, India top-1000 listed co | BRSR Core assurance phase-in | ISSB hub + Assurance Studio |
| 2 | Finance/risk manager, AU Group 2–3 entity | AASB S2 start date approaching | ISSB hub + Climate tool |
| 3 | ESG analyst at APAC bank/fund | PCAF financed emissions + MAS/APRA pressure | GHG (PCAF) + DD suite |
| 4 | Boutique ESG consultants (SG/AU/IN) | need white-label tooling per client | everything (partner track) |

## 3 · Channels (effort-ranked)

1. **Organic search** — the Stage-1 guides target exactly the queries these
   ICPs make. Owner action: verify domain in Google Search Console, submit
   sitemap.xml. Weekly-improve bot keeps content fresh.
2. **LinkedIn founder-led** — 3 posts/week from the launch kit
   (`gtm/launch-kit.md`); the deck/ carousel assets already exist. All links
   carry UTM tags so Supabase attributes signups to posts.
3. **Direct outreach** — 20 emails/week from the kit's templates, personalised
   with the prospect's own regulatory deadline (the tools compute it).
4. **Communities** — r/esg, LinkedIn ESG groups, CFO/CA communities in India;
   answer regulation questions, link the relevant guide (not the homepage).
5. **Product Hunt / directories** — one coordinated launch (kit includes the
   listing copy) once 2–3 testimonials exist.

## 4 · Launch sequence (4 weeks)

- **Week 1 — Plumbing:** Search Console + sitemap; LinkedIn company page
  links guides; post #1 (the "why" story). Ask 5 friendly contacts to run a
  report and give a quotable reaction.
- **Week 2 — Proof:** post #2 (BRSR deadline explainer → guide); 20 outreach
  emails (India list); collect first testimonials from week-1 users.
- **Week 3 — Momentum:** post #3 (AASB S2 group checker); 20 emails (AU
  list); publish one comparison page ("ReGenesis vs spreadsheet-and-consultant").
- **Week 4 — Launch:** Product Hunt + LinkedIn launch post with testimonials;
  outreach follow-ups; review Supabase funnel data and double down on the
  best-converting channel.

## 5 · Metrics (all already instrumented)

| Funnel stage | Event | Weekly target (M1) |
|---|---|---|
| Visit | `page_view` | 500 |
| Tool used | `tool_open` | 150 |
| AI engaged | `queries` rows | 60 |
| Lead captured | `leads` rows | 10 |
| Feedback quality | `ai_feedback` 👍 ratio | > 80% |

Review cadence: Mondays, owner dashboard Insights panel. Kill/scale channel
decisions at week 4 based on `leads.source` attribution.

## 6 · Pricing hypothesis (validate in outreach)

- **Free:** all tools, watermarked exports, localStorage persistence
- **Pro ₹15k / S$400 / A$450 per month:** cloud workspaces, unwatermarked
  branded exports, year-on-year comparisons, priority AI
- **Partner:** white-label + multi-client workspace, annual
Do not build billing until 10 prospects say yes to a price.
