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
  assert.match(admin, /title="일반 수정 · 사업체명 또는 활동명"><span class="member-field-heading"><span>닉네임\/업체명<\/span><em>관리자 직접 관리<\/em><\/span><input id="detailNickname"/);
  assert.match(admin, /syncedReadonlyField\('영문 이름', memberFullName\(member\), 'member-field-full-name'\)/);
  assert.match(admin, /title="관리자 직접 관리 · 신청서 재동기화로 변경되지 않음"><span class="member-field-heading"><span>한글 이름<\/span><em>관리자 직접 관리<\/em><\/span><input id="detailName"/);
});

test('Korean public name saves directly while the application name remains synchronized', () => {
  assert.match(admin, /admin_update_member_name', \{ p_member_id: member\.id, p_display_name: nextName \}/);
  const metadataCall = admin.slice(admin.indexOf("callRpc('admin_update_member_metadata'"), admin.indexOf('let savedRegion'));
  assert.match(metadataCall, /p_nickname: metadata\.nickname/);
  assert.match(metadataCall, /p_full_name: latestMember\.full_name \?\? ''/);
  assert.doesNotMatch(metadataCall, /memberFullName\(/);
  assert.match(admin, /한글 이름은 2자 이상 50자 이하/);
});

test('a verified Korean-name save remains the detail header and input value after reload', () => {
  assert.match(admin, /const name = resolveDisplayName\(member\)/);
  assert.match(admin, /nameInput\.value = name/);
  assert.match(admin, /const resolveDisplayName = member => memberPersonName\(member\)/);
  assert.match(admin, /if \(nameChanged && freshMember\.display_name !== nextName\)/);
  assert.match(admin, /if \(failed\.length === 0\) \{\s*resultMessage = '저장되었습니다\. \(DB 재조회로 확인함\)'/);
  assert.match(applicationMigration, /full_name = coalesce/);
  const syncStart = applicationMigration.indexOf('create or replace function public.internal_sync_member_application_metadata');
  const syncEnd = applicationMigration.indexOf('revoke all on function public.internal_sync_member_application_metadata', syncStart);
  assert.doesNotMatch(applicationMigration.slice(syncStart, syncEnd), /member_profiles|display_name/);
});

test('a failed Korean-name RPC or failed post-save read cannot show the success save state', () => {
  const updateStart = admin.indexOf('const updateMember = async');
  const updateEnd = admin.indexOf("filters.addEventListener", updateStart);
  const update = admin.slice(updateStart, updateEnd);
  assert.match(update, /results\.push\(\{ field: 'name', label: '한글 이름', ok: !error, error \}\)/);
  assert.match(update, /if \(nameChanged && freshMember\.display_name !== nextName\) \{\s*markUnverified\('name'/);
  assert.match(update, /if \(failed\.length > 0\) \{\s*setMessage\(resultMessage, true\)/);
  assert.match(update, /if \(failed\.length > 0\)[\s\S]*?return;[\s\S]*?setMessage\('변경사항이 저장되었습니다\.'/);
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
  assert.match(adminCss, /\.member-dialog\[open\]\{display:flex;flex-direction:column\}/);
  assert.match(adminCss, /\.member-detail\{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;overflow-x:hidden/);
  assert.match(adminCss, /@media\(max-width:680px\)\{\s*\.member-dialog\{width:calc\(100% - 18px\);max-height:90vh;overflow:hidden\}/);
});
