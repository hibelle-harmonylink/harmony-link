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
  assert.match(admin, /member-name-field \$\{directFieldClass\}.*관리자 직접 관리/);
  assert.match(admin, /detailName/);
  assert.match(css, /\.admin-editable-field\.field-source-direct>input\{border:2px solid #1a34ac/);
  assert.doesNotMatch(css, /\.admin-editable-field>input,\.admin-editable-field>select\{border:2px solid/);
});

test('application-synced metadata fields are display-only and retain their canonical sync sources', () => {
  ['영문 이름', '연락처', '담당강사'].forEach(label => assert.match(admin, new RegExp(String.raw`syncedReadonlyField\('${label}'`)));
  // 전문분야/수강과목 now render as the last item inside 회원·파트너 정보's
  // own grid (no separate card), via the same syncedReadonlyField helper,
  // still display-only and sourced from the same canonical member fields.
  assert.match(admin, /syncedReadonlyField\('전문분야', member\.specialty\)/);
  assert.match(admin, /syncedReadonlyField\('수강과목', member\.enrolled_subject\)/);
  // 강의과목 is the one synced field long enough to need the two-line clamp
  // + 전체 보기 toggle instead of the plain read-only row.
  assert.match(admin, /syncedClampField\('강의과목', member\.teaching_subjects\)/);
  ['detailFullName', 'detailPhone', 'detailSpecialty', 'detailTeachingSubjects', 'detailEnrolledSubject', 'detailAssignedInstructor'].forEach(id => assert.doesNotMatch(admin, new RegExp(String.raw`id="${id}"`)));
  assert.match(css, /\.member-synced-field\{min-width:0;border:1px solid #d5e0ea/);
  assert.match(partnerForm, /'연락처': phone/);
  assert.match(partnerForm, /'전문분야': specialty/);
  assert.match(partnerForm, /'강의과목': teachingSubjects/);
  assert.match(signup, /fullName: record\[columns\.fullName - 1\]/);
  assert.match(applicationSync, /full_name = coalesce/);
});

test('nickname is editable inline (label + input on one row) and the save payload reads the live input value', () => {
  // The input renders inline with its label inside the same compact row
  // style as every other 기본정보 field (not the old stacked <label>text
  // above input</label> layout), pre-filled with the member's current
  // stored nickname.
  assert.match(admin, /const nicknameField = `<div class="member-readonly member-field-full \$\{manualFieldClass\}" title="일반 수정 · 사업체명 또는 활동명"><span>닉네임\/업체명<\/span><input id="detailNickname" type="text" maxlength="80" autocomplete="nickname" value="\$\{escapeHtml\(memberNickname\(member\)\)\}"\$\{editableDisabled\}><\/div>`;/);
  // Both save call sites must read the live input's value, so an edited
  // nickname is what actually gets saved (leaving it untouched sends the
  // same pre-filled value back, which is a no-op for updateMember's own
  // metadataChanged check).
  assert.match(admin, /updateMember\(raw, nameInput\.value, type\.value, membership\.value, status\.value, \{ nickname: nicknameInput\.value \}, partnerRegion, partnerRegion\)/);
  assert.match(admin, /updateMember\(raw, name, member\.user_type, member\.membership, member\.account_status, \{ nickname: nicknameInput\.value \}, partnerRegion, partnerRegion\)/);
  assert.match(css, /\.field-source-manual>input\{border:1px solid #c8d8ea/);
  const forward = partnerForm.slice(partnerForm.indexOf('function forwardApplicationToRoster_'), partnerForm.indexOf('function resyncExistingApplications'));
  assert.doesNotMatch(forward, /['"]닉네임['"]\s*:/);
});

test('operational settings and automatic system fields remain visually and functionally distinct', () => {
  ['detailType', 'detailMembership', 'detailStatus'].forEach(id => assert.match(admin, new RegExp(String.raw`\$\{settingFieldClass\}"[^>]*>[^<]*<select id="${id}"`)));
  assert.match(css, /\.field-source-setting>select\{border:1px solid #a9bfd6/);
  ['회원번호', '이메일', '가입일'].forEach(label => assert.match(admin, new RegExp(`readonlyField\\('${label}'`)));
  assert.match(admin, /admin_update_member_name', \{ p_member_id: member\.id, p_display_name: nextName \}/);
  assert.match(admin, /p_nickname: metadata\.nickname/);
  assert.match(admin, /p_full_name: memberFullName\(member\)/);
});

test('source labels preserve the compact bounded dialog and mobile width protections', () => {
  assert.match(admin, /title="신청서 자동연동 · 신청서 재동기화로 갱신됩니다"/);
  assert.match(admin, /title="관리 설정 · 플랫폼 운영값"/);
  assert.match(css, /\.member-detail-groups\{min-height:0;overflow-y:auto;overflow-x:hidden;align-content:start\}/);
  assert.match(css, /@media\(max-width:680px\)\{\s*\.member-dialog\{width:calc\(100% - 18px\);max-height:90vh;overflow:hidden\}/);
});
