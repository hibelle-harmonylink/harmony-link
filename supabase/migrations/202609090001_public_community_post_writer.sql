-- Allow carefully validated public post creation without granting anon direct table writes.
-- Existing authenticated write/update/delete policies and the public reader remain unchanged.
begin;

alter table public.partner_community_posts
  alter column author_id drop not null;

alter table public.partner_community_posts
  drop constraint if exists partner_community_posts_category_check;

alter table public.partner_community_posts
  add constraint partner_community_posts_category_check
  check (category in ('notice', 'intro', 'question', 'review', 'resource', 'info', 'free', 'jobs'));

create table if not exists public.community_public_post_rate_limits (
  client_key text primary key,
  last_posted_at timestamptz not null default now()
);

alter table public.community_public_post_rate_limits enable row level security;
revoke all on table public.community_public_post_rate_limits from public, anon, authenticated;

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
  if current_setting('app.public_community_write', true) = 'on' then
    if tg_table_name <> 'partner_community_posts' then
      raise exception 'public post RPC cannot write comments' using errcode = '42501';
    end if;
    if new.category = 'notice' then
      raise exception 'only administrators can publish notices' using errcode = '42501';
    end if;
    new.author_id := null;
    new.updated_at := now();
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'authenticated member or public post RPC required' using errcode = '42501';
  end if;

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

create or replace function public.create_public_community_post(
  p_category text,
  p_author_name text,
  p_title text,
  p_content text,
  p_resource_url text default null,
  p_client_token text default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  clean_name text := btrim(coalesce(p_author_name, ''));
  clean_title text := btrim(coalesce(p_title, ''));
  clean_content text := btrim(coalesce(p_content, ''));
  clean_url text := nullif(btrim(coalesce(p_resource_url, '')), '');
  request_headers jsonb := '{}'::jsonb;
  request_ip text;
  rate_key text;
  new_post_id bigint;
begin
  if p_category not in ('question', 'info', 'free', 'jobs', 'resource') then
    raise exception 'invalid public post category' using errcode = '22023';
  end if;
  if char_length(clean_name) not between 2 and 40
     or clean_name ~ '[<>]' or clean_name ~ '[[:cntrl:]]' then
    raise exception 'author name must be 2-40 safe characters' using errcode = '22023';
  end if;
  if char_length(clean_title) not between 2 and 120
     or char_length(clean_content) not between 2 and 5000 then
    raise exception 'title or content length is invalid' using errcode = '22023';
  end if;
  if clean_url is not null and clean_url !~* '^https?://[^[:space:]]+$' then
    raise exception 'resource URL must use http or https' using errcode = '22023';
  end if;
  if p_client_token is null or p_client_token !~ '^[0-9a-fA-F-]{36}$' then
    raise exception 'valid public client token required' using errcode = '22023';
  end if;

  begin
    request_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  exception when others then
    request_headers := '{}'::jsonb;
  end;
  request_ip := split_part(coalesce(request_headers ->> 'x-forwarded-for', request_headers ->> 'cf-connecting-ip', ''), ',', 1);
  rate_key := md5(coalesce(nullif(btrim(request_ip), ''), p_client_token));
  delete from public.community_public_post_rate_limits
    where last_posted_at < now() - interval '1 day';
  insert into public.community_public_post_rate_limits (client_key, last_posted_at)
  values (rate_key, now())
  on conflict (client_key) do update
    set last_posted_at = excluded.last_posted_at
    where community_public_post_rate_limits.last_posted_at < now() - interval '30 seconds'
  returning client_key into rate_key;
  if rate_key is null then
    raise exception 'please wait before posting again' using errcode = 'P0001';
  end if;

  perform set_config('app.public_community_write', 'on', true);
  insert into public.partner_community_posts
    (author_id, author_name, category, title, content, resource_url)
  values
    (null, clean_name, p_category, clean_title, clean_content, clean_url)
  returning id into new_post_id;
  perform set_config('app.public_community_write', 'off', true);

  return new_post_id;
end;
$$;

revoke all on function public.create_public_community_post(text, text, text, text, text, text) from public;
grant execute on function public.create_public_community_post(text, text, text, text, text, text) to anon, authenticated;

-- Direct anonymous table mutation stays prohibited; only the validated RPC can insert.
revoke insert, update, delete on public.partner_community_posts from anon;

commit;
