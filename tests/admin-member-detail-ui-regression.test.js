const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));

test('1366×768, 1440×900, and 1920×1080 desktop member dialogs use the no-scroll detail rule while mobile retains its fallback', () => {
  [1366, 1440, 1920].forEach(width => assert.ok(width >= 681));
  assert.match(adminCss, /@media\(min-width:681px\)\{\s*\.member-dialog\{max-height:none\}\s*\.member-detail\{max-height:none;overflow-y:visible;position:relative\}/);
  assert.match(adminCss, /@media\(max-width:680px\)\{\s*\.member-dialog\{width:calc\(100% - 18px\);max-height:92vh;overflow:hidden\}/);
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
  assert.match(adminCss, /\.admin-editable-field>input,\.admin-editable-field>select\{border:2px solid #1a34ac!important;background:#f4f8ff!important\}/);
  assert.match(adminCss, /\.member-system-field em\{font-style:normal;color:#718198/);
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

test('partner/student metadata exclusivity and synced partner metadata render path remain unchanged', () => {
  assert.match(detail, /showRoleMetadata\(withdrawn \? 'student' : \(member\.is_admin \? 'admin' : member\.user_type\)\);/);
  assert.match(detail, /if \(specialty\) specialty\.value = member\.specialty \|\| '';/);
  assert.match(detail, /if \(teachingSubjects\) teachingSubjects\.value = member\.teaching_subjects \|\| '';/);
});
