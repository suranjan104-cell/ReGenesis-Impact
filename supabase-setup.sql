-- ReGenesis Impact — Supabase setup
-- Run this once in the Supabase SQL Editor: https://supabase.com/dashboard/project/xhymjcgtfuionagqjmio/editor

-- ── leads table ──────────────────────────────────────────────
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  email         text not null,
  name          text,
  company       text,
  role          text,
  org_type      text,
  market        text,           -- 'sg' | 'au' | 'in' | 'other'
  frameworks    text[],         -- e.g. ['aasb_s2','tcfd','ghg']
  lead_score    integer,        -- 0-100
  source        text,           -- 'sage_chat' | 'lead_modal' | 'waitlist' | etc.
  page_path     text
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.leads enable row level security;

-- Anon users can INSERT (lead capture from the site)
create policy "Allow anon insert" on public.leads
  for insert to anon with check (true);

-- Only authenticated users (your dashboard) can SELECT
create policy "Allow auth select" on public.leads
  for select to authenticated using (true);

-- ── Index for dashboard queries ───────────────────────────────
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_market_idx     on public.leads (market);
create index if not exists leads_score_idx      on public.leads (lead_score desc);

-- ═══════════════════════════════════════════════════════════════
-- ANALYTICS — run this block to enable visitor/query tracking
-- ═══════════════════════════════════════════════════════════════

-- ── events: page views, tool opens, sign-ins ──────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  session_id  text not null,        -- anonymous per-browser session id
  event_type  text not null,        -- 'page_view' | 'tool_open' | 'signin' | 'signup'
  page        text,                 -- which tool/page
  user_email  text,                 -- set when signed in
  referrer    text,                 -- document.referrer
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  user_agent  text
);

alter table public.events enable row level security;
create policy "events anon insert" on public.events
  for insert to anon with check (true);
create policy "events auth select" on public.events
  for select to authenticated using (true);

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_type_idx    on public.events (event_type);
create index if not exists events_session_idx on public.events (session_id);

-- ── queries: every Sage AI question asked ─────────────────────
create table if not exists public.queries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  session_id  text not null,
  tool        text,                 -- 'advisor' | 'issb' | 'climate' | 'ghg' | ...
  prompt      text,                 -- the question text (truncated to 2000 chars)
  user_email  text
);

alter table public.queries enable row level security;
create policy "queries anon insert" on public.queries
  for insert to anon with check (true);
create policy "queries auth select" on public.queries
  for select to authenticated using (true);

create index if not exists queries_created_idx on public.queries (created_at desc);
create index if not exists queries_tool_idx    on public.queries (tool);
