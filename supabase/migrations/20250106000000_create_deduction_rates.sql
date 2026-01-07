-- Create deduction_rates table for server-configurable IRS mileage rates
create table public.deduction_rates (
  id uuid primary key default gen_random_uuid(),
  purpose text unique not null check (purpose in ('work', 'charity', 'medical', 'military', 'personal')),
  rate_per_mile numeric not null,
  display_name text not null,
  description text,
  is_active boolean default true,
  effective_from date not null default current_date,
  effective_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed current IRS rates (2024-2025)
insert into public.deduction_rates (purpose, rate_per_mile, display_name, description) values
  ('work', 0.70, 'Business', 'Standard mileage rate for business use'),
  ('charity', 0.14, 'Charity', 'Charitable organization service'),
  ('medical', 0.21, 'Medical/Moving', 'Medical or military moving purposes'),
  ('military', 0.21, 'Military', 'Active duty military moving'),
  ('personal', 0.00, 'Personal', 'No deduction available');

-- Enable RLS
alter table public.deduction_rates enable row level security;

-- All authenticated users can read rates
create policy "deduction_rates_select_authenticated" on public.deduction_rates
  for select using (auth.role() = 'authenticated');

-- Add trigger for updated_at
create trigger deduction_rates_updated_at
  before update on public.deduction_rates
  for each row execute function public.set_updated_at();

-- Index for active rate lookups
create index deduction_rates_active_idx on public.deduction_rates(is_active, effective_from);
