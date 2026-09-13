-- LORA multi-tenant architecture for East Africa expansion (T4P14)

alter table public.users add column if not exists country text not null default 'RW' check (country in ('RW','KE','UG','TZ','CD'));
alter table public.vehicles add column if not exists country text not null default 'RW' check (country in ('RW','KE','UG','TZ','CD'));
alter table public.bookings add column if not exists country text not null default 'RW' check (country in ('RW','KE','UG','TZ','CD'));

create table if not exists public.country_settings (
  country text primary key,
  name text not null,
  currency text not null,
  phone_prefix text not null,
  vat_rate numeric(4,2) default 0,
  booking_fee int default 0,
  payment_rails text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.country_settings (country, name, currency, phone_prefix, payment_rails) values
  ('RW', 'Rwanda', 'RWF', '+250', '{momo,card}'),
  ('KE', 'Kenya', 'KES', '+254', '{mpesa,card}'),
  ('UG', 'Uganda', 'UGX', '+256', '{airtel,card}'),
  ('TZ', 'Tanzania', 'TZS', '+255', '{mpesa,card}'),
  ('CD', 'DR Congo', 'CDF', '+243', '{momo,card}')
on conflict (country) do update set name = excluded.name, currency = excluded.currency;

alter table public.country_settings enable row level security;

drop policy if exists "country_settings_public_read" on public.country_settings;
create policy "country_settings_public_read" on public.country_settings for select using (true);
