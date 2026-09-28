-- Populate only administrator-verified real names.  Existing nickname,
-- display identity, account fields, and all other metadata remain unchanged.
begin;

do $$
begin
  if (
    select count(*)
    from public.member_admin_metadata
    where member_number in (
      'HL-26-001', 'HL-26-002', 'HL-26-003', 'HL-26-004',
      'HL-26-005', 'HL-26-006', 'HL-26-007'
    )
  ) <> 7 then
    raise exception 'expected exactly seven member metadata rows for full-name backfill';
  end if;
end;
$$;

update public.member_admin_metadata
set full_name = case member_number
  when 'HL-26-001' then '하이벨'
  when 'HL-26-002' then '김미란'
  when 'HL-26-003' then '노혜경'
  when 'HL-26-004' then '노혜경'
  when 'HL-26-005' then '신영숙'
  when 'HL-26-006' then '염명재'
  when 'HL-26-007' then '윤형준'
end
where member_number in (
  'HL-26-001', 'HL-26-002', 'HL-26-003', 'HL-26-004',
  'HL-26-005', 'HL-26-006', 'HL-26-007'
);

commit;
