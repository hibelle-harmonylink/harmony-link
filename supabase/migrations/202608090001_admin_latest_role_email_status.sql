begin;

create or replace function public.admin_get_latest_role_email_status(
  p_member_id uuid,
  p_after timestamptz
)
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
  where queue.member_id = p_member_id
    and queue.created_at >= p_after
  order by queue.created_at desc
  limit 1;
end;
$$;

revoke all on function public.admin_get_latest_role_email_status(uuid, timestamptz) from public;
grant execute on function public.admin_get_latest_role_email_status(uuid, timestamptz) to authenticated;

commit;
