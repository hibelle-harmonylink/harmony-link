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

test('backfills provider identities generically without embedded user data', () => {
  assert.match(migration, /add column if not exists nickname text/);
  assert.match(migration, /add column if not exists full_name text/);
  assert.match(migration, /set nickname = nullif\(btrim\(profile\.display_name\), ''\)/);
  assert.match(migration, /raw_app_meta_data ->> 'provider' = 'google'/);
  assert.match(migration, /raw_user_meta_data ->> 'full_name'/);
  assert.doesNotMatch(migration, /where member_id = '[0-9a-f-]+'/i);
  assert.doesNotMatch(migration, /HL-\d{2}-\d{3}/);
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
  assert.match(admin, /const emailTask = \(roleChanged && accessSaved\)/);
  assert.match(migration, /withdrawn members are read-only/);
  assert.match(migration, /if not exists \(select 1 from auth\.users/);
});
