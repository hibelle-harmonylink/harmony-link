-- Edge Functions use service_role; expose two narrow security-definer operations
-- instead of granting the service role direct table access.
begin;

create or replace function public.internal_get_role_email(p_notification_id uuid)
returns table (
  id uuid,
  member_id uuid,
  old_role text,
  new_role text,
  processed_at timestamptz,
  attempts integer
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select queue.id, queue.member_id, queue.old_role, queue.new_role,
    queue.processed_at, queue.attempts
  from public.role_email_outbox queue
  where queue.id = p_notification_id;
$$;

create or replace function public.internal_finish_role_email(
  p_notification_id uuid,
  p_error text default null
)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.role_email_outbox
  set attempts = attempts + 1,
      processed_at = case when p_error is null then now() else processed_at end,
      last_error = p_error
  where id = p_notification_id;
$$;

revoke all on function public.internal_get_role_email(uuid) from public, anon, authenticated;
revoke all on function public.internal_finish_role_email(uuid, text) from public, anon, authenticated;
grant execute on function public.internal_get_role_email(uuid) to service_role;
grant execute on function public.internal_finish_role_email(uuid, text) to service_role;

commit;
