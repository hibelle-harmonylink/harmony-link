-- Community posts are meant to be publicly viewable on community.html --
-- only writing (posting, commenting, editing) should require an active
-- member. The existing get_community_posts() revokes execute from anon
-- and raises 'active member access required' for anyone who isn't an
-- active community member, so a signed-out (or not-yet-approved) visitor
-- calling it gets a raw "permission denied for function
-- get_community_posts" error surfaced in the UI instead of a post list.
--
-- This adds a second, public-safe reader with the same shape and no
-- membership check, granted to anon and authenticated. The original
-- get_community_posts() and its membership gate are left untouched for
-- any other caller that still wants it enforced.
begin;

create or replace function public.get_community_posts_public()
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

revoke all on function public.get_community_posts_public() from public;
grant execute on function public.get_community_posts_public() to anon, authenticated;

commit;
