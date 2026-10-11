-- Keep the public driver directory readable by everyone, but only expose the
-- minimum needed to gate trip visibility.
--
-- 0002 set `security_invoker = true` on public_drivers. Because the profiles RLS
-- policy only lets a caller read their own row, that silently turned the view
-- into a "self only" view: anonymous visitors saw 0 rows and a signed-in driver
-- saw just their own row. The /trips search hides every trip whose driver is not
-- searchable (isDriverSearchable(userById(driverId))), so the whole catalogue
-- disappeared and search returned nothing.
--
-- Recreate the view running as its owner (so it can read profiles/documents for
-- every driver) but project only `id` and the derived `searchable` flag. Driver
-- names, phones and vehicle plates stay private; the trips table already
-- publishes driver_name/driver_vehicle for the trips it lists.

drop view if exists public.public_drivers;

create view public.public_drivers
  with (security_invoker = false) as
select
  p.id,
  p.driver_verification,
  (exists (
    select 1 from public.driver_documents d where d.user_id = p.id
  )) and not (exists (
    select 1 from public.driver_documents d
    where d.user_id = p.id and d.status <> 'approved'
  )) as searchable
from public.profiles p
where p.role = 'driver';

grant select on public.public_drivers to anon, authenticated;
