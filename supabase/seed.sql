-- Seed data for local testing
-- Run after creating a test user via Supabase Auth

-- Replace with your test user's auth.users.id
-- You can find this in Supabase Dashboard > Authentication > Users
do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS
begin

-- Create user profile
insert into public.users (id, work_type, primary_platform, hourly_baseline, plan_tier, region)
values (test_user_id, 'rideshare', 'uber', 25.00, 'free', 'US-CA')
on conflict (id) do nothing;

-- Sample trips
insert into public.trips (user_id, started_at, ended_at, duration_seconds, distance_miles, distance_km, purpose, deduction_rate, deduction_value, platform, source)
values
  (test_user_id, now() - interval '2 hours', now() - interval '1 hour 30 minutes', 1800, 12.5, 20.1, 'work', 0.67, 8.38, 'uber', 'manual'),
  (test_user_id, now() - interval '5 hours', now() - interval '4 hours', 3600, 25.0, 40.2, 'work', 0.67, 16.75, 'lyft', 'auto_detected'),
  (test_user_id, now() - interval '1 day', now() - interval '1 day' + interval '45 minutes', 2700, 18.3, 29.4, 'work', 0.67, 12.26, 'uber', 'auto_detected'),
  (test_user_id, now() - interval '1 day 3 hours', now() - interval '1 day 2 hours', 3600, 8.0, 12.9, 'personal', 0.67, 0, null, 'manual');

-- Sample daily summary
insert into public.daily_summaries (user_id, date, work_miles, personal_miles, mixed_miles, deduction_value_total, trips_count)
values
  (test_user_id, current_date - 1, 43.3, 8.0, 0, 29.01, 3);

-- Sample export record
insert into public.exports (user_id, export_type, period_start, period_end, rows_included)
values
  (test_user_id, 'csv', current_date - 30, current_date, 45);

-- Sample subscription
insert into public.subscriptions (user_id, plan, started_at, source)
values
  (test_user_id, 'free', now() - interval '30 days', 'signup');

end $$;
