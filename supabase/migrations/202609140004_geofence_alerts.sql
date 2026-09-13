-- LORA geofencing & safety alerts (T1P4)

create table if not exists public.geofence_alerts (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  type text not null default 'out_of_country' check (type in ('out_of_country','restricted_zone','speed','fuel')),
  message text not null,
  lat double precision,
  lng double precision,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_geofence_alerts_booking on public.geofence_alerts(booking_id, created_at desc);

create or replace function public.check_trip_geofence()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lng is not null then
    if new.lat < -2.9 or new.lat > -1.0 or new.lng < 28.8 or new.lng > 30.95 then
      insert into public.geofence_alerts (booking_id, type, message, lat, lng)
      values (new.booking_id, 'out_of_country', 'Vehicle reported outside Rwanda. Admin and owner notified.', new.lat, new.lng);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_geofence on public.trip_locations;
create trigger trg_check_geofence
after insert on public.trip_locations
for each row execute function public.check_trip_geofence();
