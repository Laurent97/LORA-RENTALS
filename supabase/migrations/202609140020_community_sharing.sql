-- LORA community car sharing (BonusP20)

create table if not exists public.car_sharing_circles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references public.users(id),
  location text not null,
  rules text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.car_sharing_requests (
  id uuid primary key default uuid_generate_v4(),
  circle_id uuid not null references public.car_sharing_circles(id) on delete cascade,
  requester_id uuid not null references public.users(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_car_sharing_requests_circle on public.car_sharing_requests(circle_id, status);
create index if not exists idx_car_sharing_requests_requester on public.car_sharing_requests(requester_id, status);

alter table public.car_sharing_circles enable row level security;
alter table public.car_sharing_requests enable row level security;

drop policy if exists "car_sharing_circles_public" on public.car_sharing_circles;
drop policy if exists "car_sharing_requests_members" on public.car_sharing_requests;

create policy "car_sharing_circles_public" on public.car_sharing_circles for select using (status = 'active');
create policy "car_sharing_requests_members" on public.car_sharing_requests for all
  using (requester_id = auth.uid() or public.is_admin());
