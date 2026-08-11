-- Separate a person's membership purpose from partner access tier.
-- Safe and additive: existing roles and partner permissions remain unchanged.
begin;

alter table public.member_profiles
  add column if not exists member_type text not null default 'general';

update public.member_profiles
set member_type = case
  when role = 'admin' then 'admin'
  when role in ('partner0', 'partner20', 'partner50') then 'partner'
  when member_type = 'student' then 'student'
  else 'general'
end;

alter table public.member_profiles
  drop constraint if exists member_profiles_member_type_check;

alter table public.member_profiles
  add constraint member_profiles_member_type_check
  check (member_type in ('general', 'student', 'partner', 'admin'));

create or replace function public.sync_member_type_from_role()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.role = 'admin' then
    new.member_type := 'admin';
  elsif new.role in ('partner0', 'partner20', 'partner50') then
    new.member_type := 'partner';
  elsif new.member_type not in ('general', 'student') then
    new.member_type := 'general';
  end if;
  return new;
end;
$$;

drop trigger if exists sync_member_type_from_role on public.member_profiles;
create trigger sync_member_type_from_role
before insert or update of role, member_type on public.member_profiles
for each row execute function public.sync_member_type_from_role();

create or replace function public.set_own_member_type(p_member_type text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  resulting_type text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_member_type not in ('general', 'student') then
    raise exception 'invalid member type' using errcode = '22023';
  end if;

  update public.member_profiles
  set member_type = p_member_type,
      updated_at = now()
  where id = auth.uid()
    and role = 'member'
    and account_status = 'active'
  returning member_type into resulting_type;

  if resulting_type is null then
    raise exception 'member profile cannot change type' using errcode = '42501';
  end if;
  return resulting_type;
end;
$$;

create or replace function public.admin_update_member_type(
  p_member_id uuid,
  p_member_type text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_role text;
  resulting_type text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid()
      and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_member_id = auth.uid() then
    raise exception 'administrators cannot change their own account here' using errcode = '42501';
  end if;
  if p_member_type not in ('general', 'student') then
    raise exception 'only general or student can be selected here' using errcode = '22023';
  end if;

  select role into target_role
  from public.member_profiles
  where id = p_member_id
  for update;

  if target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if target_role <> 'member' then
    raise exception 'partner and administrator member types follow their role automatically' using errcode = '22023';
  end if;

  update public.member_profiles
  set member_type = p_member_type,
      updated_at = now(),
      changed_by = auth.uid()
  where id = p_member_id
  returning member_type into resulting_type;
  return resulting_type;
end;
$$;

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
  changed_by uuid
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
    profile.changed_by
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

revoke all on function public.set_own_member_type(text) from public;
grant execute on function public.set_own_member_type(text) to authenticated;
revoke all on function public.admin_update_member_type(uuid, text) from public;
grant execute on function public.admin_update_member_type(uuid, text) to authenticated;
revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;

commit;
