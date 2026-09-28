-- Extend community post categories without weakening the existing
-- authenticated-only author and write policy.
begin;

alter table public.partner_community_posts
  drop constraint if exists partner_community_posts_category_check;

alter table public.partner_community_posts
  add constraint partner_community_posts_category_check
  check (category in ('notice', 'intro', 'question', 'review', 'resource', 'info', 'free', 'jobs'));

commit;
