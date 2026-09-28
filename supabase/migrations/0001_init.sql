create extension if not exists "pgcrypto";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('driver', 'customer', 'admin')),
  name text not null default '',
  phone text,
  profile_pic text,
  driver_verification text check (driver_verification in ('pending', 'approved', 'rejected')),
  documents_submitted_at timestamptz,
  held boolean not null default false,
  held_at timestamptz,
  warned boolean not null default false,
  warned_at timestamptz,
  blocked boolean not null default false,
  blocked_at timestamptz,
  created_at timestamptz not null default now()
);

-- vehicles
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text not null check (vehicle_type in ('Mini', 'Truck', 'Container', 'Trailer')),
  is_primary boolean not null default false,
  length_cm integer,
  breadth_cm integer,
  height_cm integer,
  removed_at timestamptz,
  created_at timestamptz not null default now()
);

-- driver_documents
create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  kind text not null check (kind in ('driving_licence', 'vehicle_rc')),
  file_name text not null,
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- trips
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  origin text not null,
  destination text not null,
  departure_date date not null,
  departure_time time not null,
  vehicle_type text not null check (vehicle_type in ('Mini', 'Truck', 'Container', 'Trailer')),
  capacity_kg numeric not null check (capacity_kg > 0),
  price_per_kg numeric not null check (price_per_kg >= 0),
  length_cm integer,
  breadth_cm integer,
  height_cm integer,
  status text not null default 'open' check (status in ('open', 'matched', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  shipment_weight_kg numeric not null check (shipment_weight_kg > 0),
  length_cm integer,
  breadth_cm integer,
  height_cm integer,
  pickup_address text not null,
  dropoff_address text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  total_price numeric not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

-- transit_issues
create table if not exists public.transit_issues (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  origin text not null,
  destination text not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reporter_name text not null default '',
  reporter_role text not null check (reporter_role in ('customer', 'driver')),
  category text not null check (category in ('delay', 'damage', 'missing', 'vehicle', 'other')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- bug_reports
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'other' check (category in ('ui', 'auth', 'booking', 'tracking', 'other')),
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'fixed')),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reporter_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- profile_activity
create table if not exists public.profile_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists trips_driver_idx on public.trips (driver_id);
create index if not exists trips_status_idx on public.trips (status);
create index if not exists trips_route_idx on public.trips (origin, destination);
create index if not exists bookings_trip_idx on public.bookings (trip_id);
create index if not exists bookings_customer_idx on public.bookings (customer_id);
create index if not exists documents_user_idx on public.driver_documents (user_id);
create index if not exists documents_status_idx on public.driver_documents (status);
create index if not exists vehicles_user_idx on public.vehicles (user_id);
create index if not exists activity_user_idx on public.profile_activity (user_id, created_at desc);

-- helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_sanctioned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (held or blocked)
  );
$$;

create or replace function public.trip_driver(trip uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select driver_id from public.trips where id = trip;
$$;

-- profile lifecycle
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
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.held is distinct from old.held
     or new.blocked is distinct from old.blocked
     or new.warned is distinct from old.warned
     or new.driver_verification is distinct from old.driver_verification
  then
    raise exception 'restricted field';
  end if;
  return new;
end;
$$;

create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- row level security
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.driver_documents enable row level security;
alter table public.trips enable row level security;
alter table public.bookings enable row level security;
alter table public.transit_issues enable row level security;
alter table public.bug_reports enable row level security;
alter table public.profile_activity enable row level security;

create policy "profiles read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles insert self"
  on public.profiles for insert
  with check (id = auth.uid() and role <> 'admin');

create policy "profiles update self or admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "vehicles read own or admin or public"
  on public.vehicles for select
  using (user_id = auth.uid() or public.is_admin() or removed_at is null);

create policy "vehicles insert own"
  on public.vehicles for insert
  with check (user_id = auth.uid() and not public.is_sanctioned());

create policy "vehicles update own or admin"
  on public.vehicles for update
  using (user_id = auth.uid() or public.is_admin());

create policy "vehicles delete own or admin"
  on public.vehicles for delete
  using (user_id = auth.uid() or public.is_admin());

create policy "documents read own or admin"
  on public.driver_documents for select
  using (user_id = auth.uid() or public.is_admin());

create policy "documents insert own"
  on public.driver_documents for insert
  with check (user_id = auth.uid() and not public.is_sanctioned());

create policy "documents update admin only"
  on public.driver_documents for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "documents delete own or admin"
  on public.driver_documents for delete
  using (user_id = auth.uid() or public.is_admin());

create policy "trips read all"
  on public.trips for select
  using (true);

create policy "trips insert own driver"
  on public.trips for insert
  with check (driver_id = auth.uid() and not public.is_sanctioned());

create policy "trips update own driver or admin"
  on public.trips for update
  using (driver_id = auth.uid() or public.is_admin())
  with check (driver_id = auth.uid() or public.is_admin());

create policy "trips delete own driver or admin"
  on public.trips for delete
  using (driver_id = auth.uid() or public.is_admin());

create policy "bookings read parties or admin"
  on public.bookings for select
  using (
    customer_id = auth.uid()
    or public.trip_driver(trip_id) = auth.uid()
    or public.is_admin()
  );

create policy "bookings insert own customer"
  on public.bookings for insert
  with check (customer_id = auth.uid() and not public.is_sanctioned());

create policy "bookings update parties or admin"
  on public.bookings for update
  using (
    customer_id = auth.uid()
    or public.trip_driver(trip_id) = auth.uid()
    or public.is_admin()
  )
  with check (
    customer_id = auth.uid()
    or public.trip_driver(trip_id) = auth.uid()
    or public.is_admin()
  );

create policy "bookings delete admin only"
  on public.bookings for delete
  using (public.is_admin());

create policy "issues insert own"
  on public.transit_issues for insert
  with check (reporter_id = auth.uid() and not public.is_sanctioned());

create policy "issues read parties or admin"
  on public.transit_issues for select
  using (
    reporter_id = auth.uid()
    or public.trip_driver(trip_id) = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "issues update parties or admin"
  on public.transit_issues for update
  using (reporter_id = auth.uid() or public.is_admin())
  with check (reporter_id = auth.uid() or public.is_admin());

create policy "bugs insert own"
  on public.bug_reports for insert
  with check (reporter_id = auth.uid());

create policy "bugs read own or admin"
  on public.bug_reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "bugs update admin only"
  on public.bug_reports for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "activity read own or admin"
  on public.profile_activity for select
  using (user_id = auth.uid() or public.is_admin());

create policy "activity insert own"
  on public.profile_activity for insert
  with check (user_id = auth.uid());

-- storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "avatars are public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users manage own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents read owner or admin"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy "users upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_sanctioned()
  );

create policy "admins manage documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());
