-- LORA trip locations: additive schema for live trip tracking.
create table if not exists public.trip_locations (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_locations_booking on public.trip_locations(booking_id);
create index if not exists idx_trip_locations_created on public.trip_locations(created_at);

alter table public.trip_locations enable row level security;

drop policy if exists "trip_locations_insert_customer" on public.trip_locations;
drop policy if exists "trip_locations_read" on public.trip_locations;

create policy "trip_locations_insert_customer" on public.trip_locations for insert with check (
  exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
);

create policy "trip_locations_read" on public.trip_locations for select
  using (
    public.is_admin() or
    exists (select 1 from public.bookings b where b.id = booking_id and (b.customer_id = auth.uid() or b.owner_id = auth.uid()))
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_locations') then
    alter publication supabase_realtime add table public.trip_locations;
  end if;
end $$;
