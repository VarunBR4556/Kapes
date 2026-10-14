-- The trips table carries a denormalised driver snapshot.
--
-- src/lib/trips-store.tsx writes driver_name/driver_vehicle on insert (and
-- updateTripDriver keeps driver_name in sync), and supabase/seed-sample-data.py
-- inserts both. Neither column was ever created by a migration, so a database
-- rebuilt from supabase/migrations alone would reject every trip insert. Add
-- them idempotently so a fresh environment matches production.

alter table public.trips
  add column if not exists driver_name text,
  add column if not exists driver_vehicle text;

-- Backfill any rows that predate the columns (no-op when already populated).
update public.trips t
  set driver_name = p.name
  from public.profiles p
  where t.driver_id = p.id
    and t.driver_name is null
    and p.name <> '';

update public.trips t
  set driver_vehicle = v.vehicle_number
  from public.vehicles v
  where t.driver_id = v.user_id
    and t.driver_vehicle is null
    and v.is_primary
    and v.removed_at is null;
