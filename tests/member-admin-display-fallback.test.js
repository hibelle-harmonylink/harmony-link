const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202609130005_backfill_hong_hyunsook_full_name.sql'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('member detail public-name display prioritizes display_name and then application metadata', () => {
  assert.match(adminJs, /const fallbackMemberName = member => \{/);
  // 닉네임/영문 이름 are each their own stored field, with no fallback to
  // fallbackMemberName() (a confirmed 한글 이름 must never leak into either
  // field when they are genuinely unset -- see admin-list-name-display.test.js
  // for the regression this guards).
  assert.match(adminJs, /const memberNickname = member => String\(member\.nickname \|\| ''\)\.trim\(\);/);
  assert.match(adminJs, /const memberFullName = member => String\(member\.full_name \|\| ''\)\.trim\(\);/);
  assert.match(adminJs, /const memberPersonName = member => \{\s*const raw = String\(member\.display_name \|\| ''\)\.trim\(\);\s*if \(member\.is_admin && raw === 'Harmony Link'\) return '하이벨';\s*return raw \|\| String\(member\.full_name \|\| ''\)\.trim\(\) \|\| fallbackMemberName\(member\);\s*\};/);
  assert.match(adminJs, /const resolveDisplayName = member => memberPersonName\(member\)/);
  // 닉네임/업체명 is read-only; its displayed value resolves through
  // memberNickname(member) directly.
  assert.match(adminJs, /syncedReadonlyField\('닉네임\/업체명', memberNickname\(member\)/);
  assert.match(adminJs, /syncedReadonlyField\('영문 이름', memberFullNameDisplay\(member\)\)/);
});

test('production identity backfill migration remains a documented no-op', () => {
  assert.match(migration, /^begin;/m);
  assert.match(migration, /commit;\s*$/m);
  assert.match(migration, /production identity backfills[\s\S]*outside[\s\S]*repository migrations[\s\S]*operational procedure/i);
  assert.doesNotMatch(migration, /update\s+public\.member_admin_metadata/i);
  assert.doesNotMatch(migration, /\b(?:update|insert\s+into|delete\s+from)\b/i);
  assert.doesNotMatch(migration, /\braise\s+exception\b/i);
  assert.doesNotMatch(migration, /\bHL-\d{2}-\d{3}\b/);
  assert.doesNotMatch(migration, /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i);
  assert.doesNotMatch(migration, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
});

test('admin asset query keys and page version advance together', () => {
  assert.equal(version.version, '20260916-29');
  assert.match(adminHtml, /const pageVersion = '20260916-19'/);
  assert.match(adminHtml, /admin\.css\?v=20260917-12/);
  assert.match(adminHtml, /admin\.js\?v=20260917-12/);
  assert.match(adminHtml, /회원유형 · 멤버십 · 계정 상태 · 기능 권한을 각각 관리합니다\./);
});
