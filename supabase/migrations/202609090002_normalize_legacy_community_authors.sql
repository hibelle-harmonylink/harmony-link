begin;

update public.partner_community_posts
set author_name = '하이벨'
where author_id = 'f7a5d99b-5866-47f6-a067-09556c44b03b'
  and (
    (id = 1 and title = '미란멜로디 소개합니다.' and author_name = '노혜경')
    or
    (id = 2 and title = '1일 무료 체험 후기' and author_name = '하모니링크')
  );

commit;
