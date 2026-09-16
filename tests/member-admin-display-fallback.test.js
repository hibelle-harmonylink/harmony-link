const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609130005_backfill_hong_hyunsook_full_name.sql'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('member identity display falls back from metadata to display name and email prefix', () => {
  assert.match(adminJs, /const fallbackMemberName = member => \{/);
  assert.match(adminJs, /const memberNickname = member => String\(member\.nickname \|\| ''\)\.trim\(\) \|\| fallbackMemberName\(member\)/);
  assert.match(adminJs, /const memberFullName = member => String\(member\.full_name \|\| ''\)\.trim\(\) \|\| fallbackMemberName\(member\)/);
  assert.match(adminJs, /const resolveDisplayName = member => memberFullName\(member\)/);
  assert.match(adminJs, /nicknameInput\.value = memberNickname\(member\)/);
  assert.match(adminJs, /fullNameInput\.value = memberFullName\(member\)/);
});

test('HL-26-009 full name backfill changes only the intended metadata field', () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /member_number = 'HL-26-009'/);
  assert.match(migration, /set full_name = '홍현숙'/);
  assert.match(migration, /Expected exactly one member_admin_metadata row/);
  assert.match(migration, /commit;\s*$/m);
  assert.doesNotMatch(migration, /nickname\s*=/);
});

test('admin asset query keys and page version advance together', () => {
  assert.equal(version.version, '20260916-2');
  assert.match(adminHtml, /const pageVersion = '20260916-2'/);
  assert.match(adminHtml, /admin\.css\?v=20260916-2/);
  assert.match(adminHtml, /admin\.js\?v=20260916-2/);
  assert.match(adminHtml, /회원유형 · 멤버십 · 계정 상태 · 기능 권한을 각각 관리합니다\./);
});
