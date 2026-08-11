-- Let administrators manage membership purpose separately from partner tier.
begin;

create or replace function public.sync_member_type_from_role()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.role = 'admin' then
    new.member_type := 'admin';
  elsif new.member_type not in ('general', 'student', 'partner') then
    new.member_type := 'general';
  end if;
  return new;
end;
$$;

create or replace function public.admin_update_member_type(
  p_member_id uuid,
  p_member_type text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_role text;
  resulting_type text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid()
      and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_member_id = auth.uid() then
    raise exception 'administrators cannot change their own account here' using errcode = '42501';
  end if;
  if p_member_type not in ('general', 'student', 'partner') then
    raise exception 'invalid member type' using errcode = '22023';
  end if;

  select role into target_role from public.member_profiles where id = p_member_id for update;
  if target_role is null then raise exception 'member not found' using errcode = 'P0002'; end if;
  if target_role = 'admin' then raise exception 'administrator account is protected' using errcode = '42501'; end if;

  update public.member_profiles
  set member_type = p_member_type,
      updated_at = now(),
      changed_by = auth.uid()
  where id = p_member_id
  returning member_type into resulting_type;
  return resulting_type;
end;
$$;

revoke all on function public.admin_update_member_type(uuid, text) from public;
grant execute on function public.admin_update_member_type(uuid, text) to authenticated;

commit;
