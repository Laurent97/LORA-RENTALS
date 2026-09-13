-- LORA analytics & business intelligence (T4P13)

-- materialized summary table for fast admin BI (refreshed on demand or by cron)
create table if not exists public.analytics_snapshots (
  id uuid primary key default uuid_generate_v4(),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_snapshots_created on public.analytics_snapshots(created_at desc);

alter table public.analytics_snapshots enable row level security;

drop policy if exists "analytics_snapshots_admin" on public.analytics_snapshots;
create policy "analytics_snapshots_admin" on public.analytics_snapshots for all using (public.is_admin());

create or replace function public.get_analytics_summary()
returns jsonb language plpgsql as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'totalUsers', (select count(*) from public.users),
    'totalOwners', (select count(*) from public.users where role = 'owner'),
    'totalCustomers', (select count(*) from public.users where role = 'customer'),
    'totalVehicles', (select count(*) from public.vehicles),
    'availableVehicles', (select count(*) from public.vehicles where status = 'available'),
    'pendingApprovalVehicles', (select count(*) from public.vehicles where status = 'pending_approval'),
    'totalBookings', (select count(*) from public.bookings),
    'completedBookings', (select count(*) from public.bookings where status = 'completed'),
    'cancelledBookings', (select count(*) from public.bookings where status = 'cancelled'),
    'totalRevenue', coalesce((select sum(total_price) from public.bookings where status = 'completed'), 0),
    'topLocations', coalesce((
      select jsonb_agg(jsonb_build_object('location', location, 'count', cnt) order by cnt desc)
      from (
        select location, count(*) as cnt
        from public.vehicles
        where status = 'available'
        group by location
        order by cnt desc
        limit 10
      ) locs
    ), '[]'::jsonb),
    'topVehicles', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'make', make, 'model', model, 'trips', trips_completed, 'revenue', revenue) order by revenue desc)
      from (
        select v.id, v.make, v.model, v.trips_completed,
          coalesce((select sum(b.total_price) from public.bookings b where b.vehicle_id = v.id and b.status = 'completed'), 0) as revenue
        from public.vehicles v
        order by revenue desc
        limit 10
      ) vehs
    ), '[]'::jsonb),
    'recentSignups', coalesce((
      select jsonb_agg(jsonb_build_object('month', month, 'count', cnt) order by month)
      from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*) as cnt
        from public.users
        where created_at > now() - interval '6 months'
        group by month
        order by month
      ) sigs
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
