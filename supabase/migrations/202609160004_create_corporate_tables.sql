-- Create missing corporate base tables if they do not exist yet.

-- Ensure users table exists before referencing it (migration order safety)
create table if not exists public.corporate_accounts (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  tin text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  credit_terms text not null default 'net15' check (credit_terms in ('prepaid','net15','net30')),
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.corporate_members (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.corporate_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  cost_center text,
  unique (account_id, user_id)
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.corporate_accounts(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount int not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  created_at timestamptz not null default now()
);
