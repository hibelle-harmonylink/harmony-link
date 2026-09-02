-- Give a signed-in member a reliable, security-definer way to read their
-- own member_profiles row for login/homepage rendering.
--
-- Why: the homepage (auth.js) currently reads member_profiles via a plain
-- `select ... eq('id', user.id)`, which goes through PostgREST subject to
-- whatever row/column-level grants exist on the table. The admin screen,
-- by contrast, always reads through security-definer RPCs
-- (admin_list_members, admin_update_member*) which bypass those grants
-- entirely. If the table's grants were never extended to cover the newer
-- member_type/premium_member columns (added in later migrations), a
-- member's own direct select could silently fail or return incomplete
-- data while the admin-side RPC path stays unaffected -- which would
-- explain "admin save verifies fine, but the member's own re-login still
-- shows the old grade" without any RPC actually failing to persist data.
--
-- This function closes that gap the same way the rest of the admin tooling
-- already does, without touching or replacing the existing table grants.
-- Safe and purely additive.
begin;

create or replace function public.get_own_member_profile()
returns table (
  role text,
  account_status text,
  display_name text,
  member_type text,
  premium_member boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
  select profile.role, profile.account_status, profile.display_name, profile.member_type, profile.premium_member
  from public.member_profiles profile
  where profile.id = auth.uid();
end;
$$;

revoke all on function public.get_own_member_profile() from public;
grant execute on function public.get_own_member_profile() to authenticated;

commit;
