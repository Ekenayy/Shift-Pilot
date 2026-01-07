-- Extend trips table with additional columns for mileage tracking UI

-- Add route polyline for map display (encoded polyline string)
alter table public.trips add column if not exists route_polyline text;

-- Add favorite flag
alter table public.trips add column if not exists is_favorite boolean default false;

-- Add classification status
alter table public.trips add column if not exists classification_status text
  default 'unclassified'
  check (classification_status in ('unclassified', 'auto_classified', 'manually_classified'));

-- Add reverse-geocoded addresses
alter table public.trips add column if not exists origin_address text;
alter table public.trips add column if not exists dest_address text;

-- Update purpose constraint to include charity, medical, military
-- First drop the old constraint
alter table public.trips drop constraint if exists trips_purpose_check;

-- Add new constraint with expanded options
alter table public.trips add constraint trips_purpose_check
  check (purpose in ('work', 'personal', 'mixed', 'unknown', 'charity', 'medical', 'military'));

-- Index for unclassified trips query (common filter)
create index if not exists trips_classification_status_idx
  on public.trips(user_id, classification_status)
  where classification_status = 'unclassified';

-- Index for favorite trips
create index if not exists trips_favorite_idx
  on public.trips(user_id, is_favorite)
  where is_favorite = true;
