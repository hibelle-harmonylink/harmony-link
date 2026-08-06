-- Authenticate the database-to-function request and expose admin-only delivery status.
begin;

create or replace function public.dispatch_role_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  publishable_key constant text := 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
begin
  perform net.http_post(
    url := 'https://ricndeoiomzjacmrsjtg.supabase.co/functions/v1/notify-role-change',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', publishable_key,
      'Authorization', 'Bearer ' || publishable_key
    ),
    body := jsonb_build_object('notificationId', new.id)
  );
  return new;
end;
$$;

create or replace function public.admin_get_role_email_status(p_notification_id uuid)
returns table (
  processed_at timestamptz,
  attempts integer,
  last_error text
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.member_profiles administrator
    where administrator.id = auth.uid()
      and administrator.role = 'admin'
      and administrator.account_status = 'active'
  ) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  return query
  select queue.processed_at, queue.attempts, queue.last_error
  from public.role_email_outbox queue
  where queue.id = p_notification_id;
end;
$$;

revoke all on function public.admin_get_role_email_status(uuid) from public;
grant execute on function public.admin_get_role_email_status(uuid) to authenticated;

commit;
