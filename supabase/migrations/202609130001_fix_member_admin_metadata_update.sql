-- Qualify the metadata row lookup: `member_id` is also an output-column
-- name of this table-returning PL/pgSQL function, so an unqualified lookup
-- is ambiguous at runtime.
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
  if not exists (
    select 1 from public.member_admin_metadata mam
    where mam.member_id = p_member_id
  ) then raise exception 'member metadata not initialized' using errcode = 'P0002'; end if;
  return query update public.member_admin_metadata mam
  set phone = nullif(btrim(p_phone), ''), specialty = nullif(btrim(p_specialty), ''),
      teaching_subjects = nullif(btrim(p_teaching_subjects), ''),
      enrolled_subject = nullif(btrim(p_enrolled_subject), ''),
      assigned_instructor = nullif(btrim(p_assigned_instructor), '')
  where mam.member_id = p_member_id
  returning mam.member_id, mam.phone, mam.specialty, mam.teaching_subjects,
    mam.enrolled_subject, mam.assigned_instructor;
end;
$$;
