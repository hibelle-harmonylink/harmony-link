-- Read-only partner region lookup for the admin detail dialog.
-- This leaves admin_list_members() and all existing list consumers intact.
begin;

create or replace function public.admin_get_partner_region(p_member_id uuid)
returns table (
  member_id uuid,
  country_code text,
  country_name text,
  state_code text,
  state_name text,
  city text,
  service_area text[],
  online_available boolean,
  nationwide_available boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.member_profiles administrator
    where administrator.id = auth.uid()
      and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.member_profiles profile
    where profile.id = p_member_id
      and profile.user_type = 'partner'
  ) then
    raise exception 'partner metadata is required' using errcode = '22023';
  end if;

  return query
  select metadata.member_id, metadata.country_code, metadata.country_name,
    metadata.state_code, metadata.state_name, metadata.city,
    metadata.service_area, metadata.online_available, metadata.nationwide_available
  from public.member_admin_metadata metadata
  where metadata.member_id = p_member_id;
end;
$$;

revoke all on function public.admin_get_partner_region(uuid) from public;
grant execute on function public.admin_get_partner_region(uuid) to authenticated;

commit;
