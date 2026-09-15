-- Vehicle admin action flags

alter table public.vehicles add column if not exists is_featured boolean not null default false;
alter table public.vehicles add column if not exists red_flagged_at timestamptz;
alter table public.vehicles add column if not exists deleted_at timestamptz;

create index if not exists idx_vehicles_featured on public.vehicles(is_featured, status, deleted_at) where is_featured = true and deleted_at is null;
create index if not exists idx_vehicles_red_flag on public.vehicles(red_flagged_at, status, deleted_at) where red_flagged_at is not null and deleted_at is null;
