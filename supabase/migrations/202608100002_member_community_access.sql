-- Active general members, learners, partners and administrators can use the community.
begin;

create or replace function public.is_active_community_member(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.member_profiles profile
    where profile.id = p_user_id
      and profile.account_status = 'active'
      and profile.role in ('member', 'partner0', 'partner20', 'partner50', 'admin')
  );
$$;

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

  if profile_status <> 'active' or profile_role not in ('member', 'partner0', 'partner20', 'partner50', 'admin') then
    raise exception 'active member access required' using errcode = '42501';
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

drop policy if exists partner_posts_read on public.partner_community_posts;
create policy partner_posts_read on public.partner_community_posts for select to authenticated
  using (public.is_active_community_member());
drop policy if exists partner_posts_insert on public.partner_community_posts;
create policy partner_posts_insert on public.partner_community_posts for insert to authenticated
  with check (public.is_active_community_member() and author_id = auth.uid());
drop policy if exists partner_comments_read on public.partner_community_comments;
create policy partner_comments_read on public.partner_community_comments for select to authenticated
  using (public.is_active_community_member());
drop policy if exists partner_comments_insert on public.partner_community_comments;
create policy partner_comments_insert on public.partner_community_comments for insert to authenticated
  with check (public.is_active_community_member() and author_id = auth.uid());

grant execute on function public.is_active_community_member(uuid) to authenticated;

commit;
