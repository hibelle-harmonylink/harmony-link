const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const admin = read('admin.js');
const adminCss = read('admin.css');
const community = read('community.js');
const identityMigration = read('supabase/migrations/202608050006_member_name_overrides.sql');
const applicationMigration = read('supabase/migrations/202609130004_member_application_completion.sql');
const metadataMigration = read('supabase/migrations/202609130002_member_identity_metadata.sql');

test('admin member detail labels make the three independent name sources explicit', () => {
  assert.match(admin, /title="일반 수정 · 사업체명 또는 활동명">닉네임\/업체명<input id="detailNickname"/);
  assert.match(admin, /title="신청서 자동연동 · 파트너 신청서 재동기화 시 갱신될 수 있음">영문 이름<input id="detailFullName"/);
  assert.match(admin, /title="관리자 직접 관리 · 신청서 재동기화로 변경되지 않음">한글 이름<input id="detailName"/);
});

test('Korean public name and English application name save through their separate RPC fields', () => {
  assert.match(admin, /admin_update_member_name', \{ p_member_id: member\.id, p_display_name: nextName \}/);
  const metadataCall = admin.match(/admin_update_member_metadata', \{([\s\S]*?)\n        \}\);/)?.[1] || '';
  assert.match(metadataCall, /p_nickname: metadata\.nickname/);
  assert.match(metadataCall, /p_full_name: metadata\.fullName/);
  assert.match(admin, /한글 이름은 2자 이상 50자 이하/);
});

test('partner application resync preserves display_name while refreshing nonempty full_name and nickname metadata', () => {
  const syncStart = applicationMigration.indexOf('create or replace function public.internal_sync_member_application_metadata');
  const syncEnd = applicationMigration.indexOf('revoke all on function public.internal_sync_member_application_metadata', syncStart);
  const sync = applicationMigration.slice(syncStart, syncEnd);
  assert.ok(syncStart >= 0 && syncEnd > syncStart);
  assert.match(sync, /nickname = coalesce\(nullif\(btrim\(p_nickname\), ''\), metadata\.nickname\)/);
  assert.match(sync, /full_name = coalesce\(nullif\(btrim\(p_full_name\), ''\), metadata\.full_name\)/);
  assert.doesNotMatch(sync, /member_profiles|display_name/);
  assert.match(metadataMigration, /add column if not exists nickname text/);
  assert.match(metadataMigration, /add column if not exists full_name text/);
});

test('public community author names prioritize member_profiles.display_name', () => {
  assert.match(community, /author_name: profile\.display_name/);
  assert.match(identityMigration, /update public\.member_profiles\s+set display_name = normalized_name/);
});

test('admin search retains display_name, full_name, and nickname while system fields stay automatic', () => {
  assert.match(admin, /member\.nickname \|\| ''\} \$\{member\.full_name \|\| ''\} \$\{member\.display_name \|\| ''\}/);
  assert.match(admin, /readonlyField\('회원번호'/);
  assert.match(admin, /readonlyField\('이메일'/);
  assert.match(admin, /readonlyField\('가입일'/);
  assert.doesNotMatch(admin, /id="detailMemberNumber"/);
});

test('application resync leaves member numbers alone and the name guidance preserves the existing responsive dialog contract', () => {
  const syncStart = applicationMigration.indexOf('create or replace function public.internal_sync_member_application_metadata');
  const syncEnd = applicationMigration.indexOf('revoke all on function public.internal_sync_member_application_metadata', syncStart);
  const sync = applicationMigration.slice(syncStart, syncEnd);
  assert.doesNotMatch(sync, /member_number/);
  assert.match(adminCss, /@media\(min-width:681px\)\{\s*\.member-dialog\{max-height:none\}\s*\.member-detail\{max-height:none;overflow-y:visible;position:relative\}/);
  assert.match(adminCss, /@media\(max-width:680px\)\{\s*\.member-dialog\{width:calc\(100% - 18px\);max-height:92vh;overflow:hidden\}/);
});
