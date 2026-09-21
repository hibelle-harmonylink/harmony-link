const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createAdminHarness } = require('./helpers/admin-harness');

const root = path.join(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609130005_backfill_hong_hyunsook_full_name.sql'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('member detail public-name display prioritizes display_name and then application metadata', () => {
  const { memberNickname, memberFullName, resolveDisplayName } = createAdminHarness();
  const member = { display_name: '한글 이름', full_name: 'English Name', nickname: 'Business', email: 'email@example.test' };
  assert.equal(resolveDisplayName(member), '한글 이름');
  assert.equal(resolveDisplayName({ ...member, display_name: null }), 'English Name');
  assert.equal(memberFullName(member), 'English Name');
  assert.equal(memberNickname(member), 'Business');
  assert.equal(memberFullName({ ...member, full_name: null }), '한글 이름');
  assert.match(adminJs, /nicknameInput\.value = memberNickname\(member\)/);
  // The layout class is optional presentation, but the field must use full_name's display helper.
  assert.match(adminJs, /syncedReadonlyField\('영문 이름', memberFullName\(member\)(?:,\s*'[^']*')?\)/);
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
  assert.equal(version.version, '20260916-29');
  assert.match(adminHtml, /const pageVersion = '20260916-19'/);
  assert.match(adminHtml, /admin\.css\?v=20260917-3/);
  assert.match(adminHtml, /admin\.js\?v=20260917-3/);
  assert.match(adminHtml, /회원유형 · 멤버십 · 계정 상태 · 기능 권한을 각각 관리합니다\./);
});
