-- Add account lifecycle columns to public.users (used by admin user management)

alter table public.users add column if not exists deleted_at timestamptz;
alter table public.users add column if not exists suspended_at timestamptz;
alter table public.users add column if not exists suspension_reason text;
