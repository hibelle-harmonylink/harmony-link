const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const appsScript = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');

test('renders phone between email and member type in the roster and detail summary', () => {
  assert.match(adminHtml, /<th>이메일<\/th><th>연락처<\/th><th>회원유형<\/th>/);
  const cells = adminJs.slice(adminJs.indexOf('const cells = ['), adminJs.indexOf('cells.forEach'));
  const summary = adminJs.slice(adminJs.indexOf('const summary ='), adminJs.indexOf('const accessFields'));
  assert.ok(cells.indexOf("['이메일'") < cells.indexOf("['연락처'") && cells.indexOf("['연락처'") < cells.indexOf("['회원유형'"));
  assert.ok(summary.indexOf('이메일') < summary.indexOf('연락처') && summary.indexOf('연락처') < summary.indexOf('회원유형'));
});

test('withdrawn members are fully read-only and cannot submit a save action', () => {
  assert.match(adminJs, /탈퇴 회원은 권한·멤버십·계정상태 및 관리정보를 변경할 수 없습니다/);
  assert.match(adminJs, /member-save-disabled[^]*?disabled>변경 불가/);
  assert.match(adminJs, /if \(withdrawn\) \[phone, specialty, teachingSubjects, enrolledSubject, assignedInstructor\][^]*?input\.disabled = true/);
  assert.match(adminJs, /else if \(!protectedAccount && !withdrawn\)/);
  assert.match(adminCss, /cursor:not-allowed/);
});

test('metadata edits remain outside the role-notification email trigger', () => {
  assert.match(adminJs, /const metadataChanged = metadata\.phone/);
  assert.match(adminJs, /const emailTask = \(roleChanged && accessSaved\)/);
});

test('reapplies Sheet G/H/I colors from the current display values', () => {
  assert.match(appsScript, /const DISPLAY_STYLES = Object\.freeze/);
  assert.match(appsScript, /function applyRosterDisplayStyles_\(sheet, startRow, rowCount\)/);
  assert.match(appsScript, /COLUMNS\.memberType, rowCount, 3/);
  assert.match(appsScript, /applyRosterDisplayStyles_\(sheet, row, 1\)/);
  assert.match(appsScript, /applyRosterDisplayStyles_\(sheet, 2, Math\.max\(sheet\.getLastRow\(\) - 1, 0\)\)/);
});

test('keeps the detail dialog compact and prevents horizontal overflow at desktop and mobile breakpoints', () => {
  assert.match(adminCss, /\.member-dialog\{width:min\(900px,calc\(100% - 28px\);max-height:calc\(100vh - 28px\);overflow-x:hidden\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{[\s\S]*?\.member-detail\{max-height:none;overflow:visible/);
  assert.match(adminCss, /@media\(max-width:680px\)\{[\s\S]*?overflow-x:hidden/);
});
