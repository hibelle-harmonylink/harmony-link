begin;

do $$
begin
  if (select count(*) from public.member_admin_metadata where member_number = 'HL-26-009') <> 1 then
    raise exception 'Expected exactly one member_admin_metadata row for HL-26-009';
  end if;
end;
$$;

update public.member_admin_metadata
set full_name = '홍현숙'
where member_number = 'HL-26-009';

commit;
