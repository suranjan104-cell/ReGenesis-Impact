# ReGenesis Impact — Analytics & Self-Improvement System

## What's running

```
Visitors → site (tracking) → Supabase ← Insights panel (your dashboard)

Nightly  → health-check.yml → tests repo + live site → files issue on failure
                                                          ↓
Issue labeled `auto-improve` → claude-auto.yml → Claude investigates → fix PR
Sundays  → weekly-improve.yml → Claude audits → one improvement PR
```

## One-time setup (2 steps, ~5 minutes)

### 1. Enable analytics tables in Supabase

Open the [Supabase SQL editor](https://supabase.com/dashboard/project/xhymjcgtfuionagqjmio/editor)
and run the **ANALYTICS block** at the bottom of `supabase-setup.sql`
(everything below the `ANALYTICS` banner). This creates:

- **`events`** — page views, tool opens, sign-ins, traffic sources (UTM + referrer)
- **`queries`** — every Sage AI question asked, with tool and user (if signed in)

Both tables are insert-only for anonymous visitors; only you (signed in)
can read them.

### 2. Add your Anthropic API key for the auto-fix workflows

1. Get an API key at https://console.anthropic.com/settings/keys
2. Go to the repo: **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `ANTHROPIC_API_KEY` — Value: your key

Without this secret the two Claude workflows simply won't run; the
nightly health check still works (it only needs the built-in token).

## What you'll see

**Insights panel** — sign in on the site, open Dashboard, scroll to
"Platform Insights": unique visitors, page views, Sage queries, leads,
tool usage ranking, recent questions, recent leads, traffic sources.
Last 30 days, refresh on demand.

**Who logs in** — sign-ins are recorded as `signin` events with the
user's email. Sage queries from signed-in users carry their email too.

**Which marketing works** — share links with UTM tags, e.g.
`https://www.regenesisimpact.in/?utm_source=linkedin&utm_campaign=launch`
and the Traffic sources panel shows which channel each visitor came from.

**Self-improvement loop**
- Every night the site is smoke-tested (repo + live). Failures become
  GitHub issues tagged `auto-improve` with diagnostics attached.
- Claude picks those issues up automatically and opens a fix PR.
- Every Sunday Claude opens one focused improvement PR (rotating across
  performance, accessibility, mobile UX, calculation accuracy, SEO,
  regulatory content freshness).
- You only review and merge. Merging to `main` auto-deploys via the
  existing Pages workflows.

You can also comment `@claude <request>` on any issue or PR and it will
act on it.

## Reaching more customers — playbook

1. **Post the launch carousel** (in `deck/`) on LinkedIn with a UTM link.
2. **Use UTM tags on everything** — every post, bio link, email signature
   gets `?utm_source=...` so Insights shows what converts.
3. **The og-image is live** — any shared link now renders a branded card
   on LinkedIn/WhatsApp/Twitter, which materially lifts click-through.
4. **Watch the queries table** — the questions people ask Sage are your
   content strategy: each common question is a LinkedIn post or a
   landing-page section waiting to be written.
5. **Leads are scored** — the `leads` table captures email, company,
   market and a 0–100 score; the Insights panel surfaces the newest ones
   so you can follow up the same day.
