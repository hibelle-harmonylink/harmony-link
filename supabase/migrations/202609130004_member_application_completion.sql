-- A NULL value preserves historic members' existing presentation.  New
-- site-only registrations are explicitly false; a later matched application
-- changes only that member's metadata to true.
begin;

alter table public.member_admin_metadata
  add column if not exists application_completed boolean;

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
  application_completed boolean
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
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, false,
    metadata.application_completed
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
    metadata.application_completed
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

-- Keep the existing three-argument registration call compatible while
-- recording false only for a newly issued site-signup row.  A retry can never
-- replace an existing number, join date, or historic completion state.
drop function if exists public.internal_register_member_admin_metadata(uuid, text, timestamptz);
create function public.internal_register_member_admin_metadata(
  p_member_id uuid, p_member_number text, p_joined_at timestamptz
)
returns table (member_id uuid, member_number text, joined_at timestamptz)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
begin
  if p_member_number !~ '^HL-[0-9]{2}-[0-9]{3}$' then
    raise exception 'invalid member number' using errcode = '22023';
  end if;
  if p_joined_at is null then raise exception 'join date required' using errcode = '22023'; end if;
  if not exists (select 1 from auth.users user_account where user_account.id = p_member_id) then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  insert into public.member_admin_metadata (member_id, member_number, joined_at, application_completed)
  values (p_member_id, p_member_number, p_joined_at, false)
  on conflict (member_id) do update set
    member_number = public.member_admin_metadata.member_number,
    joined_at = coalesce(public.member_admin_metadata.joined_at, excluded.joined_at),
    application_completed = public.member_admin_metadata.application_completed;
  return query select metadata.member_id, metadata.member_number, metadata.joined_at
  from public.member_admin_metadata metadata where metadata.member_id = p_member_id;
end;
$$;

-- Apps Script alone may complete a matched application.  This narrow,
-- service-only RPC updates only non-empty application metadata and never
-- touches member number, join date, role, membership, or account status.
create or replace function public.internal_sync_member_application_metadata(
  p_member_id uuid, p_nickname text, p_full_name text, p_phone text,
  p_specialty text, p_teaching_subjects text, p_enrolled_subject text,
  p_assigned_instructor text
)
returns table (member_id uuid, application_completed boolean)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
begin
  if not exists (select 1 from public.member_admin_metadata metadata where metadata.member_id = p_member_id) then
    raise exception 'member metadata not initialized' using errcode = 'P0002';
  end if;
  return query update public.member_admin_metadata metadata
  set nickname = coalesce(nullif(btrim(p_nickname), ''), metadata.nickname),
      full_name = coalesce(nullif(btrim(p_full_name), ''), metadata.full_name),
      phone = coalesce(nullif(btrim(p_phone), ''), metadata.phone),
      specialty = coalesce(nullif(btrim(p_specialty), ''), metadata.specialty),
      teaching_subjects = coalesce(nullif(btrim(p_teaching_subjects), ''), metadata.teaching_subjects),
      enrolled_subject = coalesce(nullif(btrim(p_enrolled_subject), ''), metadata.enrolled_subject),
      assigned_instructor = coalesce(nullif(btrim(p_assigned_instructor), ''), metadata.assigned_instructor),
      application_completed = true
  where metadata.member_id = p_member_id
  returning metadata.member_id, metadata.application_completed;
end;
$$;

revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;
revoke all on function public.internal_register_member_admin_metadata(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.internal_register_member_admin_metadata(uuid, text, timestamptz) to service_role;
revoke all on function public.internal_sync_member_application_metadata(uuid, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.internal_sync_member_application_metadata(uuid, text, text, text, text, text, text, text) to service_role;

commit;
