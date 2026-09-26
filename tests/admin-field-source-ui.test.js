const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const admin = read('admin.js');
const css = read('admin.css');
const partnerForm = read('automation/partner-form-auto-email.gs');
const signup = read('automation/member-signup.gs');
const applicationSync = read('supabase/migrations/202609130004_member_application_completion.sql');

test('only the Korean public-name field uses the administrator-direct source style', () => {
  assert.match(admin, /member-name-field member-field-korean-name \$\{directFieldClass\}.*관리자 직접 관리/);
  assert.match(admin, /detailName/);
  assert.match(css, /\.admin-editable-field\.field-source-direct>input\{border:2px solid #1a34ac/);
  assert.doesNotMatch(css, /\.admin-editable-field>input,\.admin-editable-field>select\{border:2px solid/);
});

test('application-synced metadata fields are display-only and retain their canonical sync sources', () => {
  ['영문 이름', '연락처', '전문분야', '강의과목', '수강과목', '담당강사'].forEach(label => assert.match(admin, new RegExp(String.raw`syncedReadonlyField\('${label}',`)));
  ['detailFullName', 'detailPhone', 'detailSpecialty', 'detailTeachingSubjects', 'detailEnrolledSubject', 'detailAssignedInstructor'].forEach(id => assert.doesNotMatch(admin, new RegExp(String.raw`id="${id}"`)));
  assert.match(css, /\.member-system-field,\.member-synced-field\{display:grid;grid-template-rows:auto auto/);
  assert.match(css, /\.member-readonly>strong\{[^}]*border:1px solid #d5e0ea/);
  assert.match(partnerForm, /'연락처': phone/);
  assert.match(partnerForm, /'전문분야': specialty/);
  assert.match(partnerForm, /'강의과목': teachingSubjects/);
  assert.match(signup, /fullName: record\[columns\.fullName - 1\]/);
  assert.match(applicationSync, /full_name = coalesce/);
});

test('nickname remains an ordinary administrator-editable field because partner form forwarding has no nickname payload', () => {
  assert.match(admin, /\$\{manualFieldClass\}" title="일반 수정 · 사업체명 또는 활동명"><span class="member-field-heading"><span>닉네임\/업체명<\/span><em>관리자 직접 관리<\/em><\/span><input id="detailNickname"/);
  const forward = partnerForm.slice(partnerForm.indexOf('function forwardApplicationToRoster_'), partnerForm.indexOf('function resyncExistingApplications'));
  assert.doesNotMatch(forward, /['"]닉네임['"]\s*:/);
  assert.match(css, /\.field-source-manual>input\{border:1px solid #c8d8ea/);
});

test('operational settings and automatic system fields remain visually and functionally distinct', () => {
  ['detailType', 'detailMembership', 'detailStatus'].forEach(id => assert.match(admin, new RegExp(String.raw`\$\{settingFieldClass\}"[^>]*>[\s\S]*?<select id="${id}"`)));
  assert.match(css, /\.field-source-setting>select\{border:1px solid #a9bfd6/);
  ['회원번호', '이메일', '가입일'].forEach(label => assert.match(admin, new RegExp(`readonlyField\\('${label}'`)));
  assert.match(admin, /admin_update_member_name', \{ p_member_id: member\.id, p_display_name: nextName \}/);
  assert.match(admin, /p_nickname: metadata\.nickname/);
  assert.match(admin, /p_full_name: latestMember\.full_name \?\? ''/);
  assert.doesNotMatch(admin, /p_full_name: memberFullName\(/);
});

test('source labels preserve bounded dialog scrolling and mobile width protections', () => {
  assert.match(admin, /title="신청서 자동연동 · 신청서 재동기화로 갱신됩니다"/);
  assert.match(admin, /title="관리 설정 · 플랫폼 운영값"/);
  assert.match(css, /\.member-dialog\[open\]\{display:flex;flex-direction:column\}/);
  assert.match(css, /\.member-detail\{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;overflow-x:hidden/);
  assert.match(css, /@media\(max-width:680px\)\{\s*\.member-dialog\{width:calc\(100% - 18px\);max-height:90vh;overflow:hidden\}/);
});
