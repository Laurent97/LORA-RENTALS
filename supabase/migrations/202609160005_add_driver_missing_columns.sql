-- Add missing columns to public.drivers used by the owner dashboard

create table if not exists public.drivers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.users(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drivers alter column user_id drop not null;

alter table public.drivers add column if not exists phone text;
alter table public.drivers add column if not exists email text;
alter table public.drivers add column if not exists bio text;
alter table public.drivers add column if not exists languages text[] not null default '{}';

-- Ensure the columns used by the owner form are present
alter table public.drivers add column if not exists full_name text not null default '';
alter table public.drivers add column if not exists photo_url text;
alter table public.drivers add column if not exists license_number text;
alter table public.drivers add column if not exists license_expiry date;
alter table public.drivers add column if not exists years_of_experience int not null default 0;
alter table public.drivers add column if not exists specialties text[] not null default '{}';
alter table public.drivers add column if not exists is_available boolean not null default true;
alter table public.drivers add column if not exists is_verified boolean not null default false;
