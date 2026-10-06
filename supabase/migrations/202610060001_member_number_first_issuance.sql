-- The previous ON CONFLICT clause froze member_number at whatever value the
-- row already held -- including NULL for a metadata row that predates the
-- Google Sheet actually issuing that member a number. That permanently
-- blocked first issuance for any such row: nextMemberNumber_ could mint a
-- real HL-YY-NNN value, but it could never be recorded here. coalesce fixes
-- exactly that gap while preserving the original protection verbatim: once
-- member_number is a real, non-null value, this clause can never replace it
-- with anything else, no matter what a retry or a reconciliation call
-- supplies as p_member_number.
--
-- application_completed keeps its own existing historic-preservation
-- contract (an already-true or already-false value is never touched) with
-- one addition: if this is the same moment member_number is first being
-- filled in from NULL, application_completed is also normalized from NULL
-- to false, so a newly numbered member always starts in the correct
-- "registered, not yet applied" (RED) state instead of inheriting a legacy
-- NULL that predates this column entirely.
begin;

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
    member_number = coalesce(public.member_admin_metadata.member_number, excluded.member_number),
    joined_at = coalesce(public.member_admin_metadata.joined_at, excluded.joined_at),
    application_completed = case
      when public.member_admin_metadata.member_number is null
        then coalesce(public.member_admin_metadata.application_completed, false)
      else public.member_admin_metadata.application_completed
    end;
  return query select metadata.member_id, metadata.member_number, metadata.joined_at
  from public.member_admin_metadata metadata where metadata.member_id = p_member_id;
end;
$$;

revoke all on function public.internal_register_member_admin_metadata(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.internal_register_member_admin_metadata(uuid, text, timestamptz) to service_role;

commit;
