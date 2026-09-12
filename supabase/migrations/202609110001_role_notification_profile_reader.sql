-- Give the role-notification Edge Function a narrow profile reader without
-- granting service_role direct access to member_profiles.
begin;

create or replace function public.internal_get_member_notification_profile(p_member_id uuid)
returns table (
  id uuid,
  email text,
  display_name text,
  role text,
  user_type text,
  membership text,
  account_status text
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select profile.id,
    user_account.email::text,
    profile.display_name,
    profile.role,
    profile.user_type,
    profile.membership,
    profile.account_status
  from public.member_profiles profile
  join auth.users user_account on user_account.id = profile.id
  where profile.id = p_member_id;
$$;

revoke all on function public.internal_get_member_notification_profile(uuid) from public, anon, authenticated;
grant execute on function public.internal_get_member_notification_profile(uuid) to service_role;

commit;
