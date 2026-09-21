const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const applicationSync = fs.readFileSync(path.join(root, 'supabase/migrations/202609130004_member_application_completion.sql'), 'utf8');

test('member-list person name prioritizes display_name, then full_name, without treating nickname as a name fallback', () => {
  assert.match(admin, /const memberPersonName = member => String\(member\.display_name \|\| ''\)\.trim\(\) \|\| String\(member\.full_name \|\| ''\)\.trim\(\) \|\| fallbackMemberName\(member\)/);
  assert.match(admin, /\['이름', escapeHtml\(memberPersonName\(member\)\)/);
  const fallback = admin.slice(admin.indexOf('const fallbackMemberName'), admin.indexOf('const memberNickname'));
  assert.doesNotMatch(fallback, /nickname/);
});

test('list search continues to cover display_name, full_name, nickname, and email', () => {
  assert.match(admin, /member\.nickname \|\| ''\} \$\{member\.full_name \|\| ''\} \$\{member\.display_name \|\| ''\} \$\{member\.email \|\| ''\}/);
});

test('a verified Korean-name save reloads and rerenders the member list before success closes the detail dialog', () => {
  const update = admin.slice(admin.indexOf('const updateMember = async'), admin.indexOf("filters.addEventListener"));
  assert.match(update, /await loadMembers\(\);/);
  assert.match(update, /freshMember\.display_name !== nextName/);
  assert.match(update, /if \(failed\.length > 0\)[\s\S]*?return;[\s\S]*?setMessage\('변경사항이 저장되었습니다\.'/);
});

test('partner application resync still cannot modify member_profiles.display_name', () => {
  const start = applicationSync.indexOf('create or replace function public.internal_sync_member_application_metadata');
  const end = applicationSync.indexOf('revoke all on function public.internal_sync_member_application_metadata', start);
  assert.doesNotMatch(applicationSync.slice(start, end), /member_profiles|display_name/);
});


test('admin placeholder display name renders as 하이벨 in the list person-name helper', () => {
  assert.match(source, /const memberPersonName = member => \{[\s\S]*member\.is_admin && raw === 'Harmony Link'\) return '하이벨'/);
});
