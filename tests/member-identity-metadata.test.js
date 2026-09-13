const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609130002_member_identity_metadata.sql'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth.js'), 'utf8');
const sheet = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');
const edge = fs.readFileSync(path.join(root, 'supabase', 'functions', 'notify-role-change', 'index.ts'), 'utf8');

test('preserves existing display identities as nicknames and backfills only the verified real name', () => {
  assert.match(migration, /add column if not exists nickname text/);
  assert.match(migration, /add column if not exists full_name text/);
  assert.match(migration, /'HL-26-003'/);
  assert.match(migration, /set nickname = nullif\(btrim\(profile\.display_name\), ''\)/);
  assert.match(migration, /archived_display_name/);
  assert.match(migration, /nickname = '하이벨_샐리', full_name = '노혜경'/);
  assert.doesNotMatch(migration, /update public\.member_profiles/);
});

test('admin roster searches and renders separate nickname and full-name fields', () => {
  assert.match(admin, /\['닉네임', escapeHtml\(memberNickname\(member\)\)\]/);
  assert.match(admin, /\['이름', escapeHtml\(memberFullName\(member\)\)/);
  assert.match(admin, /member\.nickname \|\| ''} \$\{member\.full_name/);
  assert.match(admin, /id="detailNickname"/);
  assert.match(admin, /id="detailFullName"/);
});

test('new signup and profile sync carry separate provider-backed fields', () => {
  assert.match(auth, /const fullName = signupProvider === 'google'/);
  assert.match(auth, /signupRecord\.set\('닉네임', nickname\)/);
  assert.match(auth, /signupRecord\.set\('이름', fullName\)/);
  assert.match(sheet, /'닉네임', '이름', '이메일'/);
  assert.match(edge, /syncFormData\.set\('nickname'/);
  assert.match(edge, /syncFormData\.set\('full_name'/);
});

test('identity metadata remains email-neutral and withdrawn accounts are server-readonly', () => {
  assert.match(admin, /if \(roleChanged && accessSaved\) void \(async \(\) =>/);
  assert.match(migration, /withdrawn members are read-only/);
  assert.match(migration, /if not exists \(select 1 from auth\.users/);
});

test('identity fields extend the narrow metadata RPC without changing access controls', () => {
  assert.match(migration, /p_nickname text/);
  assert.match(migration, /p_full_name text/);
  assert.match(migration, /nickname text,\s*full_name text/s);
  assert.match(migration, /revoke all on function public\.admin_update_member_metadata/);
});

test('identity-aware profile sync always sends both identity keys, including empty values', () => {
  assert.match(edge, /syncFormData\.set\('nickname', String\(syncProfile\.nickname \|\| ''\)\)/);
  assert.match(edge, /syncFormData\.set\('full_name', String\(syncProfile\.full_name \|\| ''\)\)/);
});

test('provider identity mapping keeps display-name compatibility separate from nickname and full name', () => {
  assert.match(auth, /const fullName = signupProvider === 'google' \? \(providerMetadata\.full_name \|\| providerMetadata\.name \|\| ''\) : ''/);
  assert.match(auth, /const nickname = providerMetadata\.nickname \|\| ''/);
  assert.match(auth, /signupRecord\.set\('표시 이름', profile\.name\)/);
});
