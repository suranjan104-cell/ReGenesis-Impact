-- ReGenesis Impact — Supabase setup
-- Run this once in the Supabase SQL Editor: https://supabase.com/dashboard/project/xhymjcgtfuionagqjmio/editor

-- ── admin allowlist + is_admin() ────────────────────────────────
-- Any visitor can self-register via auth.signUp(), so "authenticated" is
-- NOT a trustworthy proxy for "owner". The leads/events/queries SELECT
-- policies below gate on is_admin() instead of `true`, so a regular
-- customer account can insert their own lead/event rows but cannot read
-- anyone else's data, emails, or AI chat prompts.
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- No select/insert/update policies on this table for anon/authenticated —
-- it's only ever read from inside is_admin() via security definer, so
-- nobody can query it directly through the API.

insert into public.admins (email) values ('suranjan104@gmail.com')
  on conflict (email) do nothing;
-- Add more rows here for additional admins, or remove this insert and
-- manage the table directly if you don't want it seeded automatically.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where email = (auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

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
drop policy if exists "Allow anon insert" on public.leads;
create policy "Allow anon insert" on public.leads
  for insert to anon with check (true);

-- Only the admin (owner dashboard) can SELECT — NOT every signed-up user
drop policy if exists "Allow auth select" on public.leads;
create policy "Allow auth select" on public.leads
  for select to authenticated using (public.is_admin());

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
drop policy if exists "events anon insert" on public.events;
create policy "events anon insert" on public.events
  for insert to anon with check (true);
drop policy if exists "events auth select" on public.events;
create policy "events auth select" on public.events
  for select to authenticated using (public.is_admin());

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
drop policy if exists "queries anon insert" on public.queries;
create policy "queries anon insert" on public.queries
  for insert to anon with check (true);
drop policy if exists "queries auth select" on public.queries;
create policy "queries auth select" on public.queries
  for select to authenticated using (public.is_admin());

create index if not exists queries_created_idx on public.queries (created_at desc);
create index if not exists queries_tool_idx    on public.queries (tool);
