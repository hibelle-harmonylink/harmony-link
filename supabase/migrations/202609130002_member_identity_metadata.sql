-- Keep the existing public/compatibility display_name untouched.  These two
-- nullable fields are administrator-only roster metadata, including for the
-- archived member record retained after an Auth account is removed.
begin;

alter table public.member_admin_metadata
  add column if not exists nickname text,
  add column if not exists full_name text;

-- Preserve each existing display identity as the new nickname.  The display
-- name itself remains untouched; only verified real names populate full_name.
update public.member_admin_metadata metadata
set nickname = nullif(btrim(profile.display_name), '')
from public.member_profiles profile
where metadata.member_id = profile.id
  and metadata.member_number <> 'HL-26-003';

-- The withdrawn member has no active profile row, so retain its immutable
-- archive identity in the same nickname field.
update public.member_admin_metadata metadata
set nickname = nullif(btrim(metadata.archived_display_name), '')
where metadata.member_number = 'HL-26-004'
  and metadata.nickname is null;

-- Only the identity explicitly verified by an administrator gets a real name.
update public.member_admin_metadata
set nickname = '하이벨_샐리', full_name = '노혜경'
where member_id = 'c51ace57-d4cd-4f89-97bc-cb3229641be5'::uuid
  and member_number = 'HL-26-003';

drop function if exists public.admin_list_members(text, text);
create function public.admin_list_members(p_search text default null, p_role text default null)
returns table (
  id uuid, email text, display_name text, nickname text, full_name text,
  created_at timestamptz, last_sign_in_at timestamptz, role text,
  member_type text, user_type text, membership text, approved_at timestamptz,
  account_status text, updated_at timestamptz, changed_by uuid,
  is_admin boolean, access_migration_review boolean, legacy_access_role text,
  member_number text, phone text, specialty text, teaching_subjects text,
  enrolled_subject text, assigned_instructor text, is_withdrawn boolean
)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid() and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then raise exception 'administrator access required' using errcode = '42501'; end if;

  return query
  select profile.id, user_account.email::text,
    coalesce(nullif(btrim(profile.display_name), ''), nullif(user_account.raw_user_meta_data ->> 'full_name', ''), split_part(user_account.email::text, '@', 1))::text,
    metadata.nickname, metadata.full_name,
    user_account.created_at, user_account.last_sign_in_at, profile.role, profile.member_type,
    profile.user_type, profile.membership, profile.approved_at, profile.account_status,
    profile.updated_at, profile.changed_by, profile.role = 'admin', profile.access_migration_review,
    profile.legacy_access_role, metadata.member_number, metadata.phone, metadata.specialty,
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, false
  from auth.users user_account
  join public.member_profiles profile on profile.id = user_account.id
  left join public.member_admin_metadata metadata on metadata.member_id = profile.id
  where (p_search is null or btrim(p_search) = '' or user_account.email ilike '%' || btrim(p_search) || '%'
    or profile.display_name ilike '%' || btrim(p_search) || '%'
    or metadata.nickname ilike '%' || btrim(p_search) || '%'
    or metadata.full_name ilike '%' || btrim(p_search) || '%')
  union all
  select metadata.member_id, metadata.archived_email, metadata.archived_display_name,
    metadata.nickname, metadata.full_name, metadata.joined_at, null::timestamptz,
    'member'::text, 'student'::text, 'student'::text, 'free'::text,
    null::timestamptz, 'withdrawn'::text, metadata.archived_at, null::uuid,
    false, false, null::text, metadata.member_number, metadata.phone, metadata.specialty,
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, true
  from public.member_admin_metadata metadata
  where metadata.archived_display_name is not null
    and not exists (select 1 from auth.users user_account where user_account.id = metadata.member_id)
    and (p_search is null or btrim(p_search) = '' or metadata.archived_email ilike '%' || btrim(p_search) || '%'
      or metadata.archived_display_name ilike '%' || btrim(p_search) || '%'
      or metadata.nickname ilike '%' || btrim(p_search) || '%'
      or metadata.full_name ilike '%' || btrim(p_search) || '%')
  order by created_at desc;
end;
$$;

drop function if exists public.admin_update_member_metadata(uuid, text, text, text, text, text);
create function public.admin_update_member_metadata(
  p_member_id uuid, p_nickname text, p_full_name text, p_phone text,
  p_specialty text, p_teaching_subjects text, p_enrolled_subject text,
  p_assigned_instructor text
)
returns table (
  member_id uuid, nickname text, full_name text, phone text, specialty text,
  teaching_subjects text, enrolled_subject text, assigned_instructor text
)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid() and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then raise exception 'administrator access required' using errcode = '42501'; end if;
  if p_member_id = auth.uid() then raise exception 'administrators cannot change their own account here' using errcode = '42501'; end if;
  -- An archived member has no active Auth account and remains read-only even
  -- if this RPC is invoked outside the browser UI.
  if not exists (select 1 from auth.users user_account where user_account.id = p_member_id) then
    raise exception 'withdrawn members are read-only' using errcode = '42501';
  end if;
  if not exists (select 1 from public.member_admin_metadata metadata where metadata.member_id = p_member_id) then
    raise exception 'member metadata not initialized' using errcode = 'P0002';
  end if;
  return query update public.member_admin_metadata metadata
  set nickname = nullif(btrim(p_nickname), ''), full_name = nullif(btrim(p_full_name), ''),
      phone = nullif(btrim(p_phone), ''), specialty = nullif(btrim(p_specialty), ''),
      teaching_subjects = nullif(btrim(p_teaching_subjects), ''),
      enrolled_subject = nullif(btrim(p_enrolled_subject), ''),
      assigned_instructor = nullif(btrim(p_assigned_instructor), '')
  where metadata.member_id = p_member_id
  returning metadata.member_id, metadata.nickname, metadata.full_name, metadata.phone,
    metadata.specialty, metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor;
end;
$$;

revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;
revoke all on function public.admin_update_member_metadata(uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.admin_update_member_metadata(uuid, text, text, text, text, text, text, text) to authenticated;

commit;
