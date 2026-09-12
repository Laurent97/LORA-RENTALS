drop policy if exists "vehicles_owner_write" on public.vehicles;
create policy "vehicles_owner_write" on public.vehicles for all
  using (public.is_admin() or (owner_id = auth.uid() and exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'owner' and u.kyc_status = 'verified'
  )))
  with check (public.is_admin() or (owner_id = auth.uid() and exists (
    select 1 from public.users u where u.id = auth.uid() and u.role = 'owner' and u.kyc_status = 'verified'
  )));