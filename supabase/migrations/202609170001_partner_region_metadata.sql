-- Additive partner location metadata for country → state/region → city lookups.
-- Partner location is intentionally separate from a multi-value service area.
-- No public table grants or existing member/admin RPC signatures are changed.
begin;

alter table public.member_admin_metadata
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists state_code text,
  add column if not exists state_name text,
  add column if not exists city text,
  add column if not exists service_area text[],
  add column if not exists online_available boolean,
  add column if not exists nationwide_available boolean;

alter table public.member_admin_metadata
  drop constraint if exists member_admin_metadata_country_code_format,
  add constraint member_admin_metadata_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  drop constraint if exists member_admin_metadata_state_code_format,
  add constraint member_admin_metadata_state_code_format
    check (state_code is null or state_code ~ '^[A-Z0-9-]{1,12}$');

-- Existing records have no dedicated structured location source.  Only rows
-- whose existing profile location/address itself identifies New York are
-- migrated; unknown city and service coverage remain NULL for later review.
update public.member_admin_metadata metadata
set country_code = 'US',
    country_name = 'United States',
    state_code = 'NY',
    state_name = 'New York'
from public.member_profiles profile
where metadata.member_id = profile.id
  and profile.user_type = 'partner'
  and metadata.country_code is null
  and coalesce(to_jsonb(profile) ->> 'location', to_jsonb(profile) ->> 'address', '')
    ~* '(^|[^[:alpha:]])(new york|ny)([^[:alpha:]]|$)';

-- Supports future country/state/city filters, service-area matching, and the
-- independent online/nationwide filters without a comma-separated field.
create index if not exists member_admin_metadata_partner_location_idx
  on public.member_admin_metadata (country_code, state_code, city)
  where country_code is not null;
create index if not exists member_admin_metadata_service_area_gin_idx
  on public.member_admin_metadata using gin (service_area);
create index if not exists member_admin_metadata_online_available_idx
  on public.member_admin_metadata (member_id)
  where online_available is true;
create index if not exists member_admin_metadata_nationwide_available_idx
  on public.member_admin_metadata (member_id)
  where nationwide_available is true;

-- Keep the existing metadata RPC stable for the current admin UI.  This
-- dedicated operation is available to a future region-management UI and
-- retains the same active-admin, self-update, and withdrawn-account guards.
create or replace function public.admin_update_partner_region(
  p_member_id uuid,
  p_country_code text,
  p_country_name text,
  p_state_code text,
  p_state_name text,
  p_city text,
  p_service_area text[],
  p_online_available boolean,
  p_nationwide_available boolean
)
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
declare
  normalized_service_area text[];
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

  if p_member_id = auth.uid() then
    raise exception 'administrators cannot change their own account here' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users user_account where user_account.id = p_member_id) then
    raise exception 'withdrawn members are read-only' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.member_profiles profile
    where profile.id = p_member_id and profile.user_type = 'partner'
  ) then
    raise exception 'partner metadata is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.member_admin_metadata metadata where metadata.member_id = p_member_id) then
    raise exception 'member metadata not initialized' using errcode = 'P0002';
  end if;

  select nullif(array_agg(area), array[]::text[])
  into normalized_service_area
  from (
    select nullif(btrim(value), '') as area
    from unnest(coalesce(p_service_area, array[]::text[])) as value
  ) normalized
  where area is not null;

  return query
  update public.member_admin_metadata metadata
  set country_code = nullif(upper(btrim(p_country_code)), ''),
      country_name = nullif(btrim(p_country_name), ''),
      state_code = nullif(upper(btrim(p_state_code)), ''),
      state_name = nullif(btrim(p_state_name), ''),
      city = nullif(btrim(p_city), ''),
      service_area = normalized_service_area,
      online_available = p_online_available,
      nationwide_available = p_nationwide_available
  where metadata.member_id = p_member_id
  returning metadata.member_id, metadata.country_code, metadata.country_name,
    metadata.state_code, metadata.state_name, metadata.city,
    metadata.service_area, metadata.online_available, metadata.nationwide_available;
end;
$$;

revoke all on function public.admin_update_partner_region(uuid, text, text, text, text, text, text[], boolean, boolean) from public;
grant execute on function public.admin_update_partner_region(uuid, text, text, text, text, text, text[], boolean, boolean) to authenticated;

commit;
