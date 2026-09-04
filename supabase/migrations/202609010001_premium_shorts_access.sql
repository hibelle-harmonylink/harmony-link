-- Add a standalone $50/month Premium membership flag, separate from the
-- partner tier system (partner0/partner20/partner50 gate the B2B partner
-- resource library, not a regular member's own paid plan). Safe and
-- additive: existing roles, partner access, and member types are untouched.
--
-- This flag is what gates the AI Shorts Creation Program (a separate app
-- deployed at ai-shorts-maker-production.up.railway.app, in a different
-- repository). check_premium_access() is callable by that app's backend
-- using the signed-in member's own access token against this same
-- Supabase project, so there is one source of truth for Premium status.
begin;

alter table public.member_profiles
  add column if not exists premium_member boolean not null default false,
  add column if not exists premium_approved_at timestamptz null;

-- Returns whether the calling (authenticated) user currently has Premium
-- access: either an approved Premium member in good standing, or an
-- administrator (for testing). Suspended accounts never pass.
create or replace function public.check_premium_access()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  member_role text;
  member_status text;
  member_premium boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  select profile.role, profile.account_status, profile.premium_member
  into member_role, member_status, member_premium
  from public.member_profiles profile
  where profile.id = auth.uid();

  if member_role is null or member_status <> 'active' then
    return false;
  end if;

  return member_role = 'admin' or member_premium is true;
end;
$$;

-- Admin-only: approve or revoke a member's $50 Premium status. Independent
-- of the partner role select, so partner tiers and permissions are
-- unaffected by this call.
create or replace function public.admin_update_member_premium(
  p_member_id uuid,
  p_premium boolean
)
returns table (
  id uuid,
  premium_member boolean,
  premium_approved_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  target_role text;
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

  select profile.role into target_role
  from public.member_profiles profile
  where profile.id = p_member_id
  for update;

  if target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if target_role = 'admin' then
    raise exception 'administrator accounts are protected' using errcode = '42501';
  end if;

  return query
  update public.member_profiles profile
  set
    premium_member = p_premium,
    premium_approved_at = case when p_premium then coalesce(profile.premium_approved_at, now()) else null end,
    updated_at = now(),
    changed_by = auth.uid()
  where profile.id = p_member_id
  returning profile.id, profile.premium_member, profile.premium_approved_at;
end;
$$;

-- Re-published with the two new Premium columns so the admin screen can
-- show and filter on Premium status alongside partner tier.
drop function if exists public.admin_list_members(text, text);
create function public.admin_list_members(
  p_search text default null,
  p_role text default null
)
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  member_type text,
  approved_at timestamptz,
  account_status text,
  updated_at timestamptz,
  changed_by uuid,
  premium_member boolean,
  premium_approved_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
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
    coalesce(
      nullif(btrim(profile.display_name), ''),
      nullif(user_account.raw_user_meta_data ->> 'full_name', ''),
      nullif(user_account.raw_user_meta_data ->> 'name', ''),
      nullif(user_account.raw_user_meta_data ->> 'nickname', ''),
      identity_name.display_name,
      split_part(user_account.email::text, '@', 1)
    )::text,
    user_account.created_at,
    user_account.last_sign_in_at,
    profile.role,
    profile.member_type,
    profile.approved_at,
    profile.account_status,
    profile.updated_at,
    profile.changed_by,
    profile.premium_member,
    profile.premium_approved_at
  from auth.users user_account
  join public.member_profiles profile on profile.id = user_account.id
  left join lateral (
    select coalesce(
      nullif(identity.identity_data ->> 'full_name', ''),
      nullif(identity.identity_data ->> 'name', ''),
      nullif(identity.identity_data ->> 'nickname', '')
    )::text as display_name
    from auth.identities identity
    where identity.user_id = user_account.id
    order by identity.created_at desc
    limit 1
  ) identity_name on true
  where (p_search is null or btrim(p_search) = '' or user_account.email ilike '%' || btrim(p_search) || '%')
    and (p_role is null or profile.role = p_role)
  order by user_account.created_at desc;
end;
$$;

revoke all on function public.check_premium_access() from public;
grant execute on function public.check_premium_access() to authenticated;
revoke all on function public.admin_update_member_premium(uuid, boolean) from public;
grant execute on function public.admin_update_member_premium(uuid, boolean) to authenticated;
revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;

commit;
