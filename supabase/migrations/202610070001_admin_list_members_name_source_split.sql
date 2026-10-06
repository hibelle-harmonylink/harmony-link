-- admin_list_members() used to fold the OAuth provider's raw_user_meta_data
-- full_name into the display_name column whenever member_profiles.display_name
-- was empty. That silently pre-empted member_admin_metadata.full_name (a
-- verified Korean name synced from a matched application) in the admin UI's
-- own display_name -> full_name -> fallback priority chain: display_name was
-- never actually empty by the time the client saw it, so full_name was never
-- consulted. This migration stops blending the two sources at the SQL layer:
-- display_name now returns member_profiles.display_name verbatim (NULL when
-- unset), and the OAuth name is returned separately as oauth_name so the
-- client can place it at the correct, lower priority. No other column or
-- row-selection behavior changes.
begin;

drop function if exists public.admin_list_members(text, text);
create function public.admin_list_members(p_search text default null, p_role text default null)
returns table (
  id uuid, email text, display_name text, nickname text, full_name text,
  created_at timestamptz, last_sign_in_at timestamptz, role text,
  member_type text, user_type text, membership text, approved_at timestamptz,
  account_status text, updated_at timestamptz, changed_by uuid,
  is_admin boolean, access_migration_review boolean, legacy_access_role text,
  member_number text, phone text, specialty text, teaching_subjects text,
  enrolled_subject text, assigned_instructor text, is_withdrawn boolean,
  application_completed boolean, oauth_name text
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
    nullif(btrim(profile.display_name), '')::text,
    metadata.nickname, metadata.full_name,
    user_account.created_at, user_account.last_sign_in_at, profile.role, profile.member_type,
    profile.user_type, profile.membership, profile.approved_at, profile.account_status,
    profile.updated_at, profile.changed_by, profile.role = 'admin', profile.access_migration_review,
    profile.legacy_access_role, metadata.member_number, metadata.phone, metadata.specialty,
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, false,
    metadata.application_completed,
    nullif(btrim(user_account.raw_user_meta_data ->> 'full_name'), '')::text
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
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, true,
    metadata.application_completed, null::text
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

revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;

commit;
