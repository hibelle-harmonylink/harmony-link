-- Persist the pg_net request id and return its result only to an authenticated admin.
begin;

alter table public.role_email_outbox add column if not exists request_id bigint;

create or replace function public.dispatch_role_email()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  publishable_key constant text := 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60';
  queued_request_id bigint;
begin
  select net.http_post(
    url := 'https://ricndeoiomzjacmrsjtg.supabase.co/functions/v1/notify-role-change',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', publishable_key,
      'Authorization', 'Bearer ' || publishable_key
    ),
    body := jsonb_build_object('notificationId', new.id)
  ) into queued_request_id;

  update public.role_email_outbox set request_id = queued_request_id where id = new.id;
  return new;
end;
$$;

drop function if exists public.admin_get_role_email_status(uuid);
create function public.admin_get_role_email_status(p_notification_id uuid)
returns table (
  processed_at timestamptz,
  attempts integer,
  last_error text,
  response_status integer,
  response_error text,
  response_content text
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, net
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
  select queue.processed_at, queue.attempts, queue.last_error,
    response.status_code, response.error_msg, left(response.content, 500)
  from public.role_email_outbox queue
  left join net._http_response response on response.id = queue.request_id
  where queue.id = p_notification_id;
end;
$$;

revoke all on function public.admin_get_role_email_status(uuid) from public;
grant execute on function public.admin_get_role_email_status(uuid) to authenticated;

commit;
