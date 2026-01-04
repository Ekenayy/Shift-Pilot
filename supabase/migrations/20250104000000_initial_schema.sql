-- Initial schema for Shift-Pilot mileage tracking app

-- ============================================
-- USERS
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  onboarded_at timestamptz,
  work_type text,
  primary_platform text,
  hourly_baseline numeric,
  plan_tier text default 'free',
  region text,
  is_active boolean default true
);

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- ============================================
-- TRIPS
-- ============================================
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds int,
  distance_miles numeric,
  distance_km numeric,
  purpose text check (purpose in ('work', 'personal', 'mixed', 'unknown')),
  deduction_rate numeric,
  deduction_value numeric,
  platform text,
  origin_lat numeric,
  origin_lng numeric,
  dest_lat numeric,
  dest_lng numeric,
  source text default 'auto_detected',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index trips_user_id_idx on public.trips(user_id);
create index trips_started_at_idx on public.trips(started_at);
create index trips_user_started_idx on public.trips(user_id, started_at);

alter table public.trips enable row level security;

create policy "trips_insert_own" on public.trips
  for insert with check (auth.uid() = user_id);

create policy "trips_select_own" on public.trips
  for select using (auth.uid() = user_id);

create policy "trips_update_own" on public.trips
  for update using (auth.uid() = user_id);

create policy "trips_delete_own" on public.trips
  for delete using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- ============================================
-- DAILY_SUMMARIES
-- ============================================
create table public.daily_summaries (
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  work_miles numeric default 0,
  personal_miles numeric default 0,
  mixed_miles numeric default 0,
  deduction_value_total numeric default 0,
  trips_count int default 0,
  impact_cash_estimate numeric,
  created_at timestamptz default now(),
  primary key (user_id, date)
);

create index daily_summaries_date_idx on public.daily_summaries(date);

alter table public.daily_summaries enable row level security;

create policy "daily_summaries_select_own" on public.daily_summaries
  for select using (auth.uid() = user_id);

create policy "daily_summaries_insert_own" on public.daily_summaries
  for insert with check (auth.uid() = user_id);

create policy "daily_summaries_update_own" on public.daily_summaries
  for update using (auth.uid() = user_id);

-- ============================================
-- EXPORTS
-- ============================================
create table public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  export_type text check (export_type in ('csv', 'pdf')) not null,
  period_start date not null,
  period_end date not null,
  rows_included int,
  created_at timestamptz default now()
);

create index exports_user_id_idx on public.exports(user_id);

alter table public.exports enable row level security;

create policy "exports_insert_own" on public.exports
  for insert with check (auth.uid() = user_id);

create policy "exports_select_own" on public.exports
  for select using (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  plan text check (plan in ('free', 'pro', 'lifetime')) not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  source text default 'manual'
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- admin-only insert/update (stub: service_role or custom claim check)
create policy "subscriptions_insert_admin" on public.subscriptions
  for insert with check (false); -- TODO: replace with admin check

create policy "subscriptions_update_admin" on public.subscriptions
  for update using (false); -- TODO: replace with admin check
