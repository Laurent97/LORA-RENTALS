-- WhatsApp contact support for owners

alter table users
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_verified boolean default false,
  add column if not exists whatsapp_verified_at timestamptz,
  add column if not exists whatsapp_opt_in boolean default true;

create index if not exists idx_users_whatsapp_number on users(whatsapp_number) where whatsapp_number is not null;

create table if not exists whatsapp_taps (
  id uuid primary key default gen_random_uuid(),
  car_id uuid references vehicles(id),
  owner_id uuid references users(id),
  customer_id uuid references users(id),
  source text not null,
  user_agent text,
  ip_address inet,
  created_at timestamptz default now()
);
