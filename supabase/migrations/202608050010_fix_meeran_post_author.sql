-- Correct the author of the existing Meeran Melody introduction post.
update public.partner_community_posts post
set author_id = user_account.id,
    author_name = '김미란',
    updated_at = now()
from auth.users user_account
where lower(user_account.email) = 'meeranmelodyny@gmail.com'
  and (
    post.title ilike '%미란%'
    or post.title ilike '%meeran%'
    or post.content ilike '%미란멜로디%'
    or post.content ilike '%meeran melody%'
  );
