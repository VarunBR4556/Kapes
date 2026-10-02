-- Enforce trip capacity at the database level.
--
-- The booking form only checked remaining capacity in the browser, so any
-- direct PostgREST insert could overbook a trip. Two concurrent bookings could
-- also both pass the browser check before either was written. This trigger is
-- the single source of truth; the browser check stays as a fast UI affordance.

create or replace function public.enforce_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_capacity numeric;
  already_used numeric;
  counting text[] := array['pending', 'confirmed', 'in_transit', 'delivered'];
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  select t.capacity_kg into trip_capacity
    from public.trips t where t.id = new.trip_id;

  if trip_capacity is null then
    raise exception 'Trip % does not exist', new.trip_id using errcode = 'foreign_key_violation';
  end if;

  select coalesce(sum(b.shipment_weight_kg), 0) into already_used
    from public.bookings b
    where b.trip_id = new.trip_id
      and b.id <> new.id
      and b.status = any (counting);

  if already_used + new.shipment_weight_kg > trip_capacity then
    raise exception
      'Trip capacity exceeded: % kg free, % kg requested',
      trip_capacity - already_used, new.shipment_weight_kg
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_booking_capacity on public.bookings;
create trigger guard_booking_capacity
  before insert or update of trip_id, shipment_weight_kg, status on public.bookings
  for each row execute function public.enforce_booking_capacity();