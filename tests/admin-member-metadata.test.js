const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609120001_member_admin_metadata.sql'), 'utf8');
const metadataRpcFix = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609130001_fix_member_admin_metadata_update.sql'), 'utf8');
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

test('metadata RPC cannot mutate access fields and profile sync carries metadata to the roster only', () => {
  const rpc = migration.slice(migration.indexOf('create or replace function public.admin_update_member_metadata'), migration.indexOf('revoke all on function public.admin_list_members'));
  assert.match(rpc, /security definer/i);
  assert.match(rpc, /set search_path = pg_catalog, public, auth/i);
  assert.doesNotMatch(rpc, /set\s+(?:role|membership|account_status)\s*=/i);
  assert.match(functionSource, /syncFormData\.set\('phone'/);
  assert.match(metadataRpcFix, /where mam\.member_id = p_member_id/);
  assert.doesNotMatch(metadataRpcFix, /where\s+member_id\s*=/);
  assert.match(functionSource, /syncFormData\.set\('specialty'/);
  assert.match(functionSource, /syncFormData\.set\('assigned_instructor'/);
  assert.match(adminSource, /if \(roleChanged && accessSaved\) void \(async \(\) =>/);
});

test('single Sheet-issued number is registered through a service-only idempotent RPC', () => {
  assert.match(migration, /internal_register_member_admin_metadata/);
  assert.match(migration, /on conflict \(member_id\) do update set/i);
  assert.match(migration, /member_number = public\.member_admin_metadata\.member_number/);
  assert.match(migration, /grant execute on function public\.internal_register_member_admin_metadata\(uuid, text, timestamptz\) to service_role/i);
  assert.match(migration, /revoke all on function public\.internal_register_member_admin_metadata\(uuid, text, timestamptz\) from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(?:insert|update)\s+on\s+table\s+public\.member_admin_metadata/i);
});
