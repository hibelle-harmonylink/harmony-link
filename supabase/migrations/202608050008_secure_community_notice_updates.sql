-- Ensure partners cannot turn an existing post into an administrator notice.
create or replace function public.set_partner_community_author()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  profile_role text;
  profile_status text;
  verified_name text;
begin
  select profile.role, profile.account_status,
    coalesce(nullif(btrim(profile.display_name), ''),
      nullif(user_account.raw_user_meta_data ->> 'full_name', ''),
      nullif(user_account.raw_user_meta_data ->> 'name', ''),
      split_part(user_account.email::text, '@', 1))
  into profile_role, profile_status, verified_name
  from public.member_profiles profile
  join auth.users user_account on user_account.id = profile.id
  where profile.id = auth.uid();

  if profile_status <> 'active' or profile_role not in ('partner0', 'partner20', 'partner50', 'admin') then
    raise exception 'active partner access required' using errcode = '42501';
  end if;
  if tg_table_name = 'partner_community_posts' and new.category = 'notice' and profile_role <> 'admin' then
    raise exception 'only administrators can publish notices' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    new.author_id := old.author_id;
    new.author_name := old.author_name;
    new.updated_at := now();
    return new;
  end if;

  new.author_id := auth.uid();
  new.author_name := verified_name;
  new.updated_at := now();
  return new;
end;
$$;
