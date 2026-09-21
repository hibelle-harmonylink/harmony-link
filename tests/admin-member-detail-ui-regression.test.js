const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));

test('CSS contract: dialog reserves actual header height and scrolls only its shrinkable body (not a pixel test)', () => {
  assert.match(adminCss, /\.member-dialog\[open\]\{display:flex;flex-direction:column\}/);
  assert.match(adminCss, /\.member-dialog-head\{flex:0 0 auto;min-width:0\}/);
  assert.match(adminCss, /\.member-detail\{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto;overflow-x:hidden/);
  assert.doesNotMatch(adminCss, /\.member-detail\{[^}]*max-height:calc\(90vh -/);
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
  assert.match(adminCss, /\.member-system-field \.member-field-heading em\{color:#718198/);
  assert.doesNotMatch(detail, /id="detailMemberNumber"/);
});

test('partner region text is labeled and feature labels remain compact one-line desktop items', () => {
  assert.match(detail, /regionSummary\.textContent = `지역: \$\{partnerRegionSummary\(partnerRegion\)\}`;/);
  assert.match(detail, /regionServices\.textContent = detail \? `수업 범위: \$\{detail\}` : '';/);
  assert.match(adminCss, /\.partner-region-services\{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10\.5px!important\}/);
  assert.match(adminCss, /\.feature-box li\{min-width:0;max-width:100%;white-space:nowrap\}/);
});

test('equal desktop lower boxes cannot expand from flex or grid min-content widths, and the long learning label spans both tracks', () => {
  assert.match(adminCss, /\.member-region-access-row \.partner-region\{display:grid;flex:none;min-width:0;max-width:100%;height:144px;padding:10px 7px/);
  assert.match(adminCss, /\.member-region-access-row \.partner-region-heading,.member-region-access-row \.partner-region-heading>div,.member-region-access-row \.partner-region-actions\{min-width:0;max-width:100%;box-sizing:border-box\}/);
  assert.match(adminCss, /\.member-region-access-row \.feature-box\{min-width:0;max-width:100%;height:144px;padding:8px 14px/);
  assert.match(adminCss, /\.feature-box ul\{min-width:0;max-width:100%;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(adminCss, /\.feature-box \.feature-learning\{grid-column:1\/-1\}/);
  assert.match(adminJs, /<li class="feature-\$\{item\.feature\}">\$\{item\.label\}<\/li>/);
});

test('partner/student metadata exclusivity preserves the synchronized display path', () => {
  assert.match(detail, /showRoleMetadata\(withdrawn \? 'student' : \(member\.is_admin \? 'admin' : member\.user_type\)\);/);
  assert.match(detail, /syncedReadonlyField\('전문분야', member\.specialty,/);
  assert.match(detail, /syncedReadonlyField\('강의과목', member\.teaching_subjects,/);
});

test('CSS contract: mobile field placement resets legacy spans without overriding desktop widths', () => {
  const mobile = adminCss.slice(adminCss.lastIndexOf('@media(max-width:680px)'));
  assert.match(mobile, /\.member-dialog \.member-group-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(mobile, /\.member-dialog \.member-group-grid>\*\{grid-column:auto\}/);
  assert.match(adminCss, /\.member-role-group \.member-field-korean-name\{grid-column:span 5\}/);
});

test('CSS contract: partner-region hidden wins over desktop display without important', () => {
  assert.match(adminCss, /\.member-region-access-row \.partner-region\[hidden\]\{display:none\}/);
});

test('CSS contract: sticky actions stay inside the scrollport instead of using negative offsets', () => {
  assert.match(adminCss, /\.member-detail-actions\{position:sticky;bottom:0;/);
  assert.doesNotMatch(adminCss, /\.member-detail-actions\{[^}]*bottom:-/);
});

test('field labels and source badges use non-breaking headings while single values ellipsize and long descriptions scroll internally', () => {
  assert.match(adminCss, /\.member-field-heading>span\{min-width:0;white-space:nowrap;word-break:keep-all\}/);
  assert.match(adminCss, /\.member-field-heading em\{[^}]*white-space:nowrap;word-break:keep-all\}/);
  assert.match(adminCss, /\.member-single-value>strong\{white-space:nowrap;text-overflow:ellipsis\}/);
  assert.match(adminCss, /\.member-long-value>strong\{height:auto;min-height:52px;max-height:74px;overflow-y:auto;white-space:normal/);
  assert.match(detail, /member-field-full-name/);
  assert.match(detail, /member-field-phone/);
});

test('desktop field grids allocate wider tracks to email, names, courses, and instructors', () => {
  assert.match(adminCss, /\.member-group-grid\{grid-template-columns:repeat\(12,minmax\(0,1fr\)\);gap:8px 10px\}/);
  assert.match(adminCss, /\.member-basic-group \.member-field-email\{grid-column:span 6\}/);
  assert.match(adminCss, /\.member-basic-group \.member-field-full-name\{grid-column:span 7\}/);
  assert.match(adminCss, /\.member-basic-group \.member-field-phone\{grid-column:1\/-1\}/);
  assert.match(adminCss, /\.member-role-group \.member-field-status,\.member-role-group \.member-field-course,\.member-role-group \.member-field-instructor\{grid-column:span 4\}/);
});
