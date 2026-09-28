const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609120001_member_admin_metadata.sql'), 'utf8');
const adminSource = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const functionSource = fs.readFileSync(path.join(root, 'supabase', 'functions', 'notify-role-change', 'index.ts'), 'utf8');

test('metadata schema is minimal, protected, and includes only approved administrative fields', () => {
  const table = migration.slice(migration.indexOf('create table'), migration.indexOf('revoke all on table'));
  for (const field of ['member_id', 'member_number', 'phone', 'specialty', 'teaching_subjects', 'enrolled_subject', 'assigned_instructor', 'archived_display_name', 'archived_email', 'joined_at', 'archived_at']) {
    assert.match(table, new RegExp(`\\b${field}\\b`));
  }
  assert.doesNotMatch(table, /\b(role|membership|account_status)\b/);
  assert.match(migration, /revoke all on table public\.member_admin_metadata from public, anon, authenticated/i);
});

test('active-member initialization is generic and never issues member numbers', () => {
  const initialization = migration.slice(migration.indexOf('insert into public.member_admin_metadata'), migration.indexOf('drop function'));
  assert.match(initialization, /select profile\.id, user_account\.created_at/);
  assert.match(initialization, /join auth\.users user_account on user_account\.id = profile\.id/);
  assert.doesNotMatch(initialization, /HL-\d{2}-\d{3}/);
  assert.doesNotMatch(initialization, /values\s*\(/i);
  assert.doesNotMatch(migration, /update public\.member_profiles/i);
  assert.doesNotMatch(migration, /delete from/i);
});

test('admin list includes a withdrawn archive while access changes remain unavailable for it', () => {
  assert.match(migration, /union all/);
  assert.match(migration, /not exists \(select 1 from auth\.users/);
  assert.match(migration, /is_withdrawn boolean/);
  assert.match(adminSource, /탈퇴 회원은 권한·멤버십·계정상태 및 관리정보를 변경할 수 없습니다/);
  assert.match(adminSource, /member-save-disabled[\s\S]*?disabled>변경 불가/);
});

test('metadata RPC cannot mutate access fields and profile sync carries metadata to the roster only', () => {
  const rpc = migration.slice(migration.indexOf('create or replace function public.admin_update_member_metadata'), migration.indexOf('revoke all on function public.admin_list_members'));
  assert.match(rpc, /security definer/i);
  assert.match(rpc, /set search_path = pg_catalog, public, auth/i);
  assert.doesNotMatch(rpc, /set\s+(?:role|membership|account_status)\s*=/i);
  assert.match(functionSource, /syncFormData\.set\('phone'/);
  assert.match(functionSource, /syncFormData\.set\('specialty'/);
  assert.match(functionSource, /syncFormData\.set\('assigned_instructor'/);
  assert.match(adminSource, /const emailTask = \(roleChanged && accessSaved\)/);
});

test('single Sheet-issued number is registered through a service-only idempotent RPC', () => {
  assert.match(migration, /internal_register_member_admin_metadata/);
  assert.match(migration, /on conflict \(member_id\) do update set/i);
  assert.match(migration, /member_number = public\.member_admin_metadata\.member_number/);
  assert.match(migration, /grant execute on function public\.internal_register_member_admin_metadata\(uuid, text, timestamptz\) to service_role/i);
  assert.match(migration, /revoke all on function public\.internal_register_member_admin_metadata\(uuid, text, timestamptz\) from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(?:insert|update)\s+on\s+table\s+public\.member_admin_metadata/i);
});

test('withdrawn members are completely read-only while metadata remains visible', () => {
  assert.match(adminSource, /탈퇴 회원은 권한·멤버십·계정상태 및 관리정보를 변경할 수 없습니다/);
  assert.match(adminSource, /member-save-disabled[^]*?disabled>변경 불가/);
  assert.match(adminSource, /if \(withdrawn\) \[nicknameInput, fullNameInput, phone, specialty, teachingSubjects, enrolledSubject, assignedInstructor\][^]*?input\.disabled = true/);
  assert.match(adminSource, /else if \(!protectedAccount && !withdrawn\)/);
});

test('phone is rendered between email and member type in both roster and detail summary', () => {
  const listCells = adminSource.slice(adminSource.indexOf('const cells = ['), adminSource.indexOf('cells.forEach'));
  assert.ok(listCells.indexOf("['이메일'") < listCells.indexOf("['연락처'") && listCells.indexOf("['연락처'") < listCells.indexOf("['회원유형'"));
  const summary = adminSource.slice(adminSource.indexOf('const summary ='), adminSource.indexOf('const accessFields'));
  assert.ok(summary.indexOf('이메일') < summary.indexOf('연락처') && summary.indexOf('연락처') < summary.indexOf('회원유형'));
});
