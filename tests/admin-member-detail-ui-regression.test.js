const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));

test('desktop and mobile member dialogs cap their height and scroll only the information groups', () => {
  assert.match(adminCss, /\.member-dialog\{width:min\(860px,calc\(100% - 28px\)\);max-height:90vh;overflow:hidden\}/);
  assert.match(adminCss, /\.member-detail-groups\{min-height:0;overflow-y:auto;overflow-x:hidden;align-content:start\}/);
  assert.doesNotMatch(adminCss, /\.member-dialog\{max-height:none\}/);
  assert.match(adminCss, /@media\(max-width:680px\)\{\s*\.member-dialog\{width:calc\(100% - 18px\);max-height:90vh;overflow:hidden\}/);
});

test('sending, success, and error feedback share one fixed-height desktop action slot', () => {
  const resend = adminJs.slice(adminJs.indexOf('const resendNotification = async'), adminJs.indexOf('const updateMember = async'));
  assert.match(resend, /feedback\.textContent = '안내메일 전송 중…'; feedback\.className = 'member-save-feedback pending';/);
  assert.match(resend, /feedback\.textContent = '안내메일을 성공적으로 보냈습니다\.';/);
  assert.match(resend, /feedback\.className = 'member-save-feedback error';/);
  assert.match(adminCss, /\.member-detail-actions\{display:grid;grid-template-columns:minmax\(0,1fr\) auto auto;align-items:center;gap:9px;min-height:36px\}/);
  assert.match(adminCss, /\.member-save-feedback\{display:block;min-height:15px;max-height:15px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis/);
  assert.match(adminCss, /\.member-save-feedback\.success,\.member-save-feedback\.error,\.member-save-feedback\.pending\{display:block;padding:0;border:0;background:transparent\}/);
});

test('editable and system-managed member fields are visually distinct without making member numbers editable', () => {
  assert.match(detail, /member-system-field/);
  assert.match(detail, /readonlyField\('회원번호'/);
  assert.match(detail, /readonlyField\('이메일'/);
  assert.match(detail, /readonlyField\('가입일'/);
  assert.match(detail, /admin-editable-field/);
  assert.match(adminCss, /\.admin-editable-field\.field-source-direct>input\{border:2px solid #1a34ac!important;background:#f4f8ff!important\}/);
  assert.match(adminCss, /\.member-system-field em\{font-style:normal;color:#718198/);
  assert.doesNotMatch(detail, /id="detailMemberNumber"/);
});

test('partner region and feature text wrap at word boundaries without clipping their contents', () => {
  // The compact one-line row no longer repeats a "지역:" label prefix in
  // the JS-set text (the HTML row already prints its own 활동 지역 label).
  assert.match(detail, /regionSummary\.textContent = partnerRegionSummary\(partnerRegion\);/);
  assert.match(detail, /regionServices\.textContent = detail \? `수업 범위: \$\{detail\}` : '';/);
  assert.match(adminCss, /\.partner-region-services\{white-space:normal;word-break:keep-all;overflow-wrap:break-word\}/);
  assert.match(adminCss, /\.feature-box li\{min-width:0;white-space:normal;word-break:keep-all;overflow-wrap:break-word\}/);
});

test('활동 지역 and 기능 권한 are compact one-line rows instead of fixed-height boxes', () => {
  assert.match(adminCss, /\.partner-region\{display:flex;align-items:center;flex-wrap:wrap;/);
  assert.doesNotMatch(adminCss, /min-height:144px/);
  assert.doesNotMatch(adminJs, /partner-region-heading/);
  assert.match(adminJs, /<li class="feature-\$\{item\.feature\}">\$\{item\.label\}<\/li>/);
});

test('partner/student metadata exclusivity preserves the synchronized display path', () => {
  assert.match(detail, /showRoleMetadata\(withdrawn \? 'student' : \(member\.is_admin \? 'admin' : member\.user_type\)\);/);
  assert.match(detail, /syncedReadonlyField\('전문분야', member\.specialty\)/);
  assert.match(detail, /syncedClampField\('강의과목', member\.teaching_subjects\)/);
});
