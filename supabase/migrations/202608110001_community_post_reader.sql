-- Return community posts to authenticated, active Harmony Link members.
-- This keeps RLS enabled while avoiding nested relationship filtering differences.
begin;

create or replace function public.get_community_posts()
returns table (
  id bigint,
  author_id uuid,
  author_name text,
  category text,
  title text,
  content text,
  resource_url text,
  created_at timestamptz,
  updated_at timestamptz,
  comments jsonb
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_active_community_member(auth.uid()) then
    raise exception 'active member access required' using errcode = '42501';
  end if;

  return query
  select
    post.id,
    post.author_id,
    post.author_name,
    post.category,
    post.title,
    post.content,
    post.resource_url,
    post.created_at,
    post.updated_at,
    coalesce(
      jsonb_agg(to_jsonb(comment) order by comment.created_at)
        filter (where comment.id is not null),
      '[]'::jsonb
    ) as comments
  from public.partner_community_posts post
  left join public.partner_community_comments comment on comment.post_id = post.id
  group by post.id
  order by post.created_at desc;
end;
$$;

revoke all on function public.get_community_posts() from public, anon;
grant execute on function public.get_community_posts() to authenticated;

commit;
