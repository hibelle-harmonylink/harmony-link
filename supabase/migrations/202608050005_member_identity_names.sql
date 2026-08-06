-- Prefer the member's Google/Kakao identity name before falling back to email.
begin;

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
      nullif(user_account.raw_user_meta_data ->> 'full_name', ''),
      nullif(user_account.raw_user_meta_data ->> 'name', ''),
      nullif(user_account.raw_user_meta_data ->> 'nickname', ''),
      identity_name.display_name,
      split_part(user_account.email::text, '@', 1)
    )::text,
    user_account.created_at,
    user_account.last_sign_in_at,
    profile.role,
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

revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;

commit;
