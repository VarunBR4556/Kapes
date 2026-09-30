-- Security: stop public sign-up from self-granting privileged roles.
--
-- handle_new_user() is SECURITY DEFINER, so the "profiles insert self" policy
-- (which carries `role <> 'admin'`) never runs for it. Any caller could POST
-- /auth/v1/signup with {"data":{"role":"admin"}} and land an admin profile.
-- Clamp the role here instead, and enforce it in the database for every writer.

-- 1. Clamp the role at profile creation. 'driver' stays self-service; 'admin'
--    can only ever be granted by a deliberate SQL/Dashboard edit.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' = 'driver' then 'driver'
      else 'customer'
    end,
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Guard privileged columns on INSERT as well. The existing trigger is
--    BEFORE UPDATE only, which left the insert side unguarded for any future
--    provisioning path.
create or replace function public.guard_profile_insert_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin'
     or new.driver_verification = 'approved'
     or new.held
     or new.blocked
     or new.warned then
    raise exception 'restricted field';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_insert_privileges on public.profiles;
create trigger guard_profile_insert_privileges
  before insert on public.profiles
  for each row execute function public.guard_profile_insert_privileges();

-- 3. Keep the existing update guard enabled. A prior seed run disabled it with
--    `alter table ... disable trigger`, which leaves role self-writable for
--    everyone until something re-enables it.
do $$
begin
  if exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'profiles'
      and t.tgname = 'guard_profile_privileges'
      and t.tgenabled = 'D'
  ) then
    alter table public.profiles enable trigger guard_profile_privileges;
    raise notice 're-enabled guard_profile_privileges';
  end if;
end;
$$;

-- 4. Close the anon-read leak on live vehicle registration numbers.
--    "removed_at is null" matched every live row for the unauthenticated role.
drop policy if exists "vehicles read own or admin or public" on public.vehicles;
create policy "vehicles read own or admin"
  on public.vehicles for select
  using (user_id = auth.uid() or public.is_admin());

-- 5. Trips stay publicly browsable (the /trips page has no auth wall), but
--    closed and cancelled runs are driver+admin only.
drop policy if exists "trips read all" on public.trips;
create policy "trips read public"
  on public.trips for select
  using (
    status in ('open', 'matched')
    or driver_id = auth.uid()
    or public.is_admin()
  );

-- 6. public_drivers had no RLS and ran as its owner, so it re-exposed every
--    driver's name and vehicle number to the unauthenticated role even after
--    the vehicles policy above was tightened. security_invoker makes it respect
--    the caller's RLS. Requires PG15+ (this project is on 17.6).
alter view public.public_drivers set (security_invoker = true);
