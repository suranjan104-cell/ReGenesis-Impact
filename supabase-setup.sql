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
