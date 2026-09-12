-- Promote the explicitly requested existing account to application admin.
update public.users
set role = 'admin'
where id = 'bdc1d1a1-cccf-4ed6-b64d-95008367bf0c'
  and lower(email) = 'kizzolaurent@gmail.com';

-- Verify exactly one matching profile before considering the promotion complete.
do $$
begin
  if not exists (
    select 1 from public.users
    where id = 'bdc1d1a1-cccf-4ed6-b64d-95008367bf0c'
      and lower(email) = 'kizzolaurent@gmail.com'
      and role = 'admin'
  ) then
    raise exception 'Requested user profile was not found; no admin role was granted';
  end if;
end $$;
