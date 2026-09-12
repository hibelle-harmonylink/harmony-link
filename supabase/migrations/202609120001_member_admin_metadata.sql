-- Administrative metadata is intentionally separate from member access.
-- It retains a minimal record for withdrawn accounts whose auth.users row has
-- been deleted, while keeping role, membership, and account-status logic in
-- member_profiles unchanged.
begin;

create table if not exists public.member_admin_metadata (
  member_id uuid primary key,
  member_number text unique,
  phone text,
  specialty text,
  teaching_subjects text,
  enrolled_subject text,
  assigned_instructor text,
  archived_display_name text,
  archived_email text,
  joined_at timestamptz,
  archived_at timestamptz,
  constraint member_admin_metadata_member_number_format
    check (member_number is null or member_number ~ '^HL-[0-9]{2}-[0-9]{3}$')
);

revoke all on table public.member_admin_metadata from public, anon, authenticated;

-- Read-only backfill from the verified member roster.  No profile, auth, role,
-- membership, or status field is changed.  The withdrawn account is kept as an
-- archive snapshot because it no longer has an auth.users row to join.
insert into public.member_admin_metadata (
  member_id, member_number, archived_display_name, archived_email, joined_at, archived_at
) values
  ('f7a5d99b-5866-47f6-a067-09556c44b03b', 'HL-26-001', null, null, '2026-08-01 00:30:00-04', null),
  ('13cb343a-cdd4-4519-9a1d-2bfeb65faff1', 'HL-26-002', null, null, '2026-08-04 02:11:06-04', null),
  ('c51ace57-d4cd-4f89-97bc-cb3229641be5', 'HL-26-003', null, null, '2026-08-10 02:51:23-04', null),
  ('229e791e-df89-47f8-a2ec-362044ff6466', 'HL-26-004', '혜경(KR)', 'hibellenewyork@kakao.com', '2026-08-11 02:45:59-04', null),
  ('d6b58c79-675a-4edf-8e50-079d4097af04', 'HL-26-005', null, null, '2026-08-21 22:55:03-04', null),
  ('609670ec-40ec-4157-8563-bf27606fcbb5', 'HL-26-006', null, null, '2026-09-06 21:48:46-04', null),
  ('8686931e-e2e8-498d-a153-4da762b841c3', 'HL-26-007', null, null, '2026-09-11 20:05:05-04', null)
on conflict (member_id) do update set
  member_number = excluded.member_number,
  joined_at = coalesce(public.member_admin_metadata.joined_at, excluded.joined_at),
  archived_display_name = coalesce(public.member_admin_metadata.archived_display_name, excluded.archived_display_name),
  archived_email = coalesce(public.member_admin_metadata.archived_email, excluded.archived_email);

drop function if exists public.admin_list_members(text, text);
create function public.admin_list_members(p_search text default null, p_role text default null)
returns table (
  id uuid, email text, display_name text, created_at timestamptz, last_sign_in_at timestamptz,
  role text, member_type text, user_type text, membership text, approved_at timestamptz,
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
    user_account.created_at, user_account.last_sign_in_at, profile.role, profile.member_type,
    profile.user_type, profile.membership, profile.approved_at, profile.account_status,
    profile.updated_at, profile.changed_by, profile.role = 'admin', profile.access_migration_review,
    profile.legacy_access_role, metadata.member_number, metadata.phone, metadata.specialty,
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, false
  from auth.users user_account
  join public.member_profiles profile on profile.id = user_account.id
  left join public.member_admin_metadata metadata on metadata.member_id = profile.id
  where (p_search is null or btrim(p_search) = '' or user_account.email ilike '%' || btrim(p_search) || '%' or profile.display_name ilike '%' || btrim(p_search) || '%')

  union all

  select metadata.member_id, metadata.archived_email, metadata.archived_display_name,
    metadata.joined_at, null::timestamptz, 'member'::text, 'student'::text, 'student'::text,
    'free'::text, null::timestamptz, 'withdrawn'::text, metadata.archived_at, null::uuid,
    false, false, null::text, metadata.member_number, metadata.phone, metadata.specialty,
    metadata.teaching_subjects, metadata.enrolled_subject, metadata.assigned_instructor, true
  from public.member_admin_metadata metadata
  where metadata.archived_display_name is not null
    and not exists (select 1 from auth.users user_account where user_account.id = metadata.member_id)
    and (p_search is null or btrim(p_search) = '' or metadata.archived_email ilike '%' || btrim(p_search) || '%' or metadata.archived_display_name ilike '%' || btrim(p_search) || '%')
  order by created_at desc;
end;
$$;

create or replace function public.admin_update_member_metadata(
  p_member_id uuid, p_phone text, p_specialty text, p_teaching_subjects text,
  p_enrolled_subject text, p_assigned_instructor text
)
returns table (
  member_id uuid, phone text, specialty text, teaching_subjects text,
  enrolled_subject text, assigned_instructor text
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
  if not exists (select 1 from public.member_admin_metadata where member_id = p_member_id) then
    raise exception 'member metadata not initialized' using errcode = 'P0002';
  end if;
  return query update public.member_admin_metadata metadata
  set phone = nullif(btrim(p_phone), ''), specialty = nullif(btrim(p_specialty), ''),
      teaching_subjects = nullif(btrim(p_teaching_subjects), ''),
      enrolled_subject = nullif(btrim(p_enrolled_subject), ''),
      assigned_instructor = nullif(btrim(p_assigned_instructor), '')
  where metadata.member_id = p_member_id
  returning metadata.member_id, metadata.phone, metadata.specialty, metadata.teaching_subjects,
    metadata.enrolled_subject, metadata.assigned_instructor;
end;
$$;

-- Service-only registration path used by the Apps Script after it has
-- atomically issued the member number under its Script Lock. The RPC is
-- deliberately append-only for identity values: retries can read the same
-- number, but can never replace it.
create or replace function public.internal_register_member_admin_metadata(
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
  insert into public.member_admin_metadata (member_id, member_number, joined_at)
  values (p_member_id, p_member_number, p_joined_at)
  on conflict (member_id) do update set
    member_number = public.member_admin_metadata.member_number,
    joined_at = coalesce(public.member_admin_metadata.joined_at, excluded.joined_at);
  return query select metadata.member_id, metadata.member_number, metadata.joined_at
  from public.member_admin_metadata metadata where metadata.member_id = p_member_id;
end;
$$;

revoke all on function public.admin_list_members(text, text) from public;
grant execute on function public.admin_list_members(text, text) to authenticated;
revoke all on function public.admin_update_member_metadata(uuid, text, text, text, text, text) from public;
grant execute on function public.admin_update_member_metadata(uuid, text, text, text, text, text) to authenticated;
revoke all on function public.internal_register_member_admin_metadata(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.internal_register_member_admin_metadata(uuid, text, timestamptz) to service_role;

commit;
