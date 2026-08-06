-- Use the organization name for administrator-authored community content.
update public.member_profiles
set display_name = '하모니링크',
    updated_at = now()
where role = 'admin';

update public.partner_community_posts post
set author_name = '하모니링크'
where exists (
  select 1 from public.member_profiles profile
  where profile.id = post.author_id and profile.role = 'admin'
);

update public.partner_community_comments comment
set author_name = '하모니링크'
where exists (
  select 1 from public.member_profiles profile
  where profile.id = comment.author_id and profile.role = 'admin'
);
