-- Align the capacity trigger with the client.
--
-- 0003 counted 'delivered' bookings as still reserving space, but the client
-- treats a delivered booking as released (ABNORMAL_BOOKING_STATUSES in
-- src/lib/bookings-store.tsx = ['cancelled', 'delivered']). On a trip with more
-- than one booking, delivering one shipment made the UI offer that space back
-- while the database kept counting it, so the next booking was rejected with a
-- confusing "Trip capacity exceeded" error.
--
-- 'cancelled' and 'delivered' both free capacity; only the still-live statuses
-- reserve it. Everything else about the trigger is unchanged.

create or replace function public.enforce_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_capacity numeric;
  already_used numeric;
  counting text[] := array['pending', 'confirmed', 'in_transit'];
begin
  if new.status = 'cancelled' or new.status = 'delivered' then
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
