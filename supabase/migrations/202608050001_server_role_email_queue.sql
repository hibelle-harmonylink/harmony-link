-- Queue role-change emails inside Supabase so browser CORS cannot block delivery.
begin;

create extension if not exists pg_net with schema extensions;

create table if not exists public.role_email_outbox (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  old_role text,
  new_role text not null check (new_role in ('member', 'partner0', 'partner20', 'partner50')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0,
  last_error text
);

alter table public.role_email_outbox enable row level security;
revoke all on table public.role_email_outbox from public, anon, authenticated;

create or replace function public.dispatch_role_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://ricndeoiomzjacmrsjtg.supabase.co/functions/v1/notify-role-change',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60'
    ),
    body := jsonb_build_object('notificationId', new.id)
  );
  return new;
end;
$$;

drop trigger if exists role_email_outbox_dispatch on public.role_email_outbox;
create trigger role_email_outbox_dispatch
after insert on public.role_email_outbox
for each row execute function public.dispatch_role_email();

create or replace function public.admin_queue_role_email(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  member_role text;
  notification_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid()
      and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  select profile.role into member_role
  from public.member_profiles profile
  where profile.id = p_member_id and profile.role in ('member', 'partner0', 'partner20', 'partner50');

  if member_role is null then
    raise exception 'member not found or protected' using errcode = 'P0002';
  end if;

  insert into public.role_email_outbox (member_id, old_role, new_role)
  values (p_member_id, member_role, member_role)
  returning id into notification_id;
  return notification_id;
end;
$$;

create or replace function public.admin_update_member(
  p_member_id uuid,
  p_role text,
  p_account_status text
)
returns table (
  id uuid,
  role text,
  approved_at timestamptz,
  account_status text,
  updated_at timestamptz,
  changed_by uuid
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  current_role text;
  updated_profile public.member_profiles%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid()
      and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;
  if p_role not in ('member', 'partner0', 'partner20', 'partner50') then
    raise exception 'role is not allowed in the administrator screen' using errcode = '22023';
  end if;
  if p_account_status not in ('active', 'suspended') then
    raise exception 'invalid account status' using errcode = '22023';
  end if;
  if p_member_id = auth.uid() then
    raise exception 'administrators cannot change their own account here' using errcode = '42501';
  end if;

  select profile.role into current_role
  from public.member_profiles profile
  where profile.id = p_member_id
  for update;
  if current_role is null then raise exception 'member not found' using errcode = 'P0002'; end if;
  if current_role = 'admin' then raise exception 'administrator accounts are protected' using errcode = '42501'; end if;

  update public.member_profiles profile
  set role = p_role,
      approved_at = case when p_role in ('partner0', 'partner20', 'partner50') then coalesce(profile.approved_at, now()) else null end,
      account_status = p_account_status,
      updated_at = now(),
      changed_by = auth.uid()
  where profile.id = p_member_id
  returning profile.* into updated_profile;

  if current_role is distinct from p_role then
    insert into public.role_email_outbox (member_id, old_role, new_role)
    values (p_member_id, current_role, p_role);
  end if;

  return query select updated_profile.id, updated_profile.role, updated_profile.approved_at,
    updated_profile.account_status, updated_profile.updated_at, updated_profile.changed_by;
end;
$$;

revoke all on function public.admin_queue_role_email(uuid) from public;
grant execute on function public.admin_queue_role_email(uuid) to authenticated;

commit;
