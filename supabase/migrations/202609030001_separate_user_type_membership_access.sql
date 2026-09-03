-- Separate service user type, paid membership, and feature access.
-- Additive migration: legacy role/member_type values are retained as compatibility mirrors.
begin;

alter table public.member_profiles
  add column if not exists user_type text,
  add column if not exists membership text,
  add column if not exists access_migration_review boolean not null default false,
  add column if not exists legacy_access_role text;

update public.member_profiles
set legacy_access_role = coalesce(legacy_access_role, role),
    member_type = case
      when role = 'admin' then 'admin'
      when member_type = 'partner' or role in ('partner0', 'partner20', 'partner50') then 'partner'
      else 'student'
    end,
    user_type = case
      when member_type = 'partner' or role in ('partner0', 'partner20', 'partner50') then 'partner'
      else 'student'
    end,
    membership = case
      when membership in ('free', 'basic', 'premium') then membership
      when role = 'partner50' then 'premium'
      when role = 'partner20' then 'basic'
      else 'free'
    end,
    access_migration_review = access_migration_review
      or role not in ('member', 'partner0', 'partner20', 'partner50', 'admin')
      or member_type not in ('general', 'student', 'partner', 'admin')
      or (membership is not null and membership not in ('free', 'basic', 'premium'));

alter table public.member_profiles
  alter column user_type set default 'student',
  alter column user_type set not null,
  alter column membership set default 'free',
  alter column membership set not null;

alter table public.member_profiles drop constraint if exists member_profiles_user_type_check;
alter table public.member_profiles add constraint member_profiles_user_type_check
  check (user_type in ('student', 'partner'));
alter table public.member_profiles drop constraint if exists member_profiles_membership_check;
alter table public.member_profiles add constraint member_profiles_membership_check
  check (membership in ('free', 'basic', 'premium'));

alter table public.member_profiles drop constraint if exists member_profiles_account_status_check;
alter table public.member_profiles add constraint member_profiles_account_status_check
  check (account_status in ('active', 'expiring', 'expired', 'suspended'));

create or replace function public.sync_member_access_compatibility()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.role = 'admin' then
    new.user_type := coalesce(new.user_type, 'student');
    new.member_type := 'admin';
    new.membership := coalesce(new.membership, 'free');
    return new;
  end if;

  if new.user_type not in ('student', 'partner') then new.user_type := 'student'; end if;
  if new.membership not in ('free', 'basic', 'premium') then new.membership := 'free'; end if;
  new.member_type := new.user_type;
  new.role := case
    when new.user_type = 'partner' and new.membership = 'premium' then 'partner50'
    when new.user_type = 'partner' and new.membership = 'basic' then 'partner20'
    when new.user_type = 'partner' then 'partner0'
    else 'member'
  end;
  new.approved_at := case when new.user_type = 'partner' then coalesce(new.approved_at, now()) else null end;
  return new;
end;
$$;

drop trigger if exists sync_member_type_from_role on public.member_profiles;
drop trigger if exists sync_member_access_compatibility on public.member_profiles;
create trigger sync_member_access_compatibility
before insert or update of role, member_type, user_type, membership on public.member_profiles
for each row execute function public.sync_member_access_compatibility();

create or replace function public.has_feature_access(p_user_id uuid, p_feature text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((
    select case
      when profile.account_status not in ('active', 'expiring') then false
      when profile.role = 'admin' then true
      when p_feature in ('community', 'learning') then true
      when p_feature = 'basic_benefits' then profile.membership in ('basic', 'premium')
      when p_feature in ('partner_center', 'partner_profile', 'partner_resources') then profile.user_type = 'partner'
      when p_feature in ('premium_content', 'premium_apps', 'ai_shorts') then profile.membership = 'premium'
      else false
    end
    from public.member_profiles profile where profile.id = p_user_id
  ), false);
$$;

create or replace function public.is_active_community_member(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$ select public.has_feature_access(p_user_id, 'community'); $$;

drop function if exists public.admin_list_members(text, text);
create function public.admin_list_members(p_search text default null, p_role text default null)
returns table (
  id uuid, email text, display_name text, created_at timestamptz, last_sign_in_at timestamptz,
  role text, member_type text, user_type text, membership text, approved_at timestamptz,
  account_status text, updated_at timestamptz, changed_by uuid,
  is_admin boolean, access_migration_review boolean, legacy_access_role text
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid() and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then raise exception 'administrator access required' using errcode = '42501'; end if;

  return query
  select profile.id, user_account.email::text,
    coalesce(nullif(btrim(profile.display_name), ''),
      nullif(user_account.raw_user_meta_data ->> 'full_name', ''),
      nullif(user_account.raw_user_meta_data ->> 'name', ''),
      nullif(user_account.raw_user_meta_data ->> 'nickname', ''),
      split_part(user_account.email::text, '@', 1))::text,
    user_account.created_at, user_account.last_sign_in_at, profile.role, profile.member_type,
    profile.user_type, profile.membership, profile.approved_at, profile.account_status,
    profile.updated_at, profile.changed_by, profile.role = 'admin',
    profile.access_migration_review, profile.legacy_access_role
  from auth.users user_account
  join public.member_profiles profile on profile.id = user_account.id
  where (p_search is null or btrim(p_search) = ''
    or user_account.email ilike '%' || btrim(p_search) || '%'
    or profile.display_name ilike '%' || btrim(p_search) || '%')
  order by user_account.created_at desc;
end;
$$;

create or replace function public.admin_update_member_access(
  p_member_id uuid, p_user_type text, p_membership text, p_account_status text
)
returns table (id uuid, user_type text, membership text, account_status text, updated_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare target_role text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid() and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then raise exception 'administrator access required' using errcode = '42501'; end if;
  if p_member_id = auth.uid() then
    raise exception 'administrators cannot change their own account here' using errcode = '42501';
  end if;
  if p_user_type not in ('student', 'partner') then raise exception 'invalid user type' using errcode = '22023'; end if;
  if p_membership not in ('free', 'basic', 'premium') then raise exception 'invalid membership' using errcode = '22023'; end if;
  if p_account_status not in ('active', 'expiring', 'expired', 'suspended') then raise exception 'invalid account status' using errcode = '22023'; end if;
  select profile.role into target_role from public.member_profiles profile where profile.id = p_member_id for update;
  if target_role is null then raise exception 'member not found' using errcode = 'P0002'; end if;
  if target_role = 'admin' then raise exception 'administrator account is protected' using errcode = '42501'; end if;

  return query update public.member_profiles profile
  set user_type = p_user_type, membership = p_membership, account_status = p_account_status,
      access_migration_review = false, updated_at = now(), changed_by = auth.uid()
  where profile.id = p_member_id
  returning profile.id, profile.user_type, profile.membership, profile.account_status, profile.updated_at;
end;
$$;

create or replace function public.set_own_member_type(p_member_type text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare resulting_type text;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_member_type not in ('general', 'student') then raise exception 'invalid member type' using errcode = '22023'; end if;
  update public.member_profiles set user_type = 'student', member_type = 'student', updated_at = now()
  where id = auth.uid() and role <> 'admin' and account_status in ('active', 'expiring')
  returning user_type into resulting_type;
  if resulting_type is null then raise exception 'member profile cannot change type' using errcode = '42501'; end if;
  return resulting_type;
end;
$$;

revoke all on function public.has_feature_access(uuid, text) from public;
revoke all on function public.admin_list_members(text, text) from public;
revoke all on function public.admin_update_member_access(uuid, text, text, text) from public;
revoke all on function public.set_own_member_type(text) from public;
grant execute on function public.has_feature_access(uuid, text) to authenticated;
grant execute on function public.is_active_community_member(uuid) to authenticated;
grant execute on function public.admin_list_members(text, text) to authenticated;
grant execute on function public.admin_update_member_access(uuid, text, text, text) to authenticated;
grant execute on function public.set_own_member_type(text) to authenticated;

commit;
