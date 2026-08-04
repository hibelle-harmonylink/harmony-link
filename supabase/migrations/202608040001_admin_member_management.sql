-- HarmonyLink administrator member management
-- Safe, additive migration: preserves every existing user and role constraint.

begin;

alter table public.member_profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists changed_by uuid null references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.member_profiles'::regclass
      and conname = 'member_profiles_account_status_check'
  ) then
    alter table public.member_profiles
      add constraint member_profiles_account_status_check
      check (account_status in ('active', 'suspended'));
  end if;
end
$$;

update public.member_profiles
set approved_at = coalesce(approved_at, updated_at, created_at, now())
where role in ('partner0', 'partner20', 'partner50')
  and approved_at is null;

create or replace function public.admin_list_members(
  p_search text default null,
  p_role text default null
)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  approved_at timestamptz,
  account_status text,
  updated_at timestamptz,
  changed_by uuid
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

  if p_role is not null and p_role not in ('member', 'partner0', 'partner20', 'partner50', 'admin') then
    raise exception 'invalid role filter' using errcode = '22023';
  end if;

  return query
  select
    profile.id,
    user_account.email::text,
    user_account.created_at,
    user_account.last_sign_in_at,
    profile.role,
    profile.approved_at,
    profile.account_status,
    profile.updated_at,
    profile.changed_by
  from auth.users user_account
  join public.member_profiles profile on profile.id = user_account.id
  where (p_search is null or btrim(p_search) = '' or user_account.email ilike '%' || btrim(p_search) || '%')
    and (p_role is null or profile.role = p_role)
  order by user_account.created_at desc;
end;
$$;

create or replace function public.admin_update_member(
  p_member_id uuid,
  p_role text,
  p_account_status text
)
returns table (
  id uuid,
  role text,
  approved_at timestamptz,
  account_status text,
  updated_at timestamptz,
  changed_by uuid
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_role text;
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

  if p_role not in ('member', 'partner0', 'partner20', 'partner50') then
    raise exception 'role is not allowed in the administrator screen' using errcode = '22023';
  end if;

  if p_account_status not in ('active', 'suspended') then
    raise exception 'invalid account status' using errcode = '22023';
  end if;

  if p_member_id = auth.uid() then
    raise exception 'administrators cannot change their own account here' using errcode = '42501';
  end if;

  select profile.role into current_role
  from public.member_profiles profile
  where profile.id = p_member_id
  for update;

  if current_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if current_role = 'admin' then
    raise exception 'administrator accounts are protected' using errcode = '42501';
  end if;

  return query
  update public.member_profiles profile
  set
    role = p_role,
    approved_at = case
      when p_role in ('partner0', 'partner20', 'partner50')
        then coalesce(profile.approved_at, now())
      else null
    end,
    account_status = p_account_status,
    updated_at = now(),
    changed_by = auth.uid()
  where profile.id = p_member_id
  returning profile.id, profile.role, profile.approved_at, profile.account_status, profile.updated_at, profile.changed_by;
end;
$$;

revoke all on function public.admin_list_members(text, text) from public;
revoke all on function public.admin_update_member(uuid, text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;
grant execute on function public.admin_update_member(uuid, text, text) to authenticated;

commit;
