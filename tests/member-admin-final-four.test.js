const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const adminCss = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');
const appsScript = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');

test('renders phone between email and member type in the roster, and keeps email/phone together in the 기본 정보 group', () => {
  assert.match(adminHtml, /<th>이메일<\/th><th>연락처<\/th><th>회원유형<\/th>/);
  const cells = adminJs.slice(adminJs.indexOf('const cells = ['), adminJs.indexOf('cells.forEach'));
  assert.ok(cells.indexOf("['이메일'") < cells.indexOf("['연락처'") && cells.indexOf("['연락처'") < cells.indexOf("['회원유형'"));
  // The compact one-screen modal (2026-09) moved 회원유형 into its own
  // 회원·파트너 정보 group, separate from 기본 정보's 이메일/연락처 -- both
  // groups still keep email ahead of phone within 기본 정보 itself.
  const basicInfoFields = adminJs.slice(adminJs.indexOf('const basicInfoFields ='), adminJs.indexOf('const protectedNotice'));
  assert.ok(basicInfoFields.indexOf('이메일') < basicInfoFields.indexOf('연락처'));
  const accessInputs = adminJs.slice(adminJs.indexOf('const accessInputs ='), adminJs.indexOf('const roleMetadataInputs'));
  assert.match(accessInputs, /회원유형/);
});

test('normalizes only unambiguous US phone strings and preserves Korean or international values', () => {
  assert.match(adminJs, /const formatPhone = value => \{/);
  assert.match(adminJs, /digits\.length === 11 && digits\.startsWith\('1'\)/);
  assert.match(adminJs, /usDigits\.length === 10/);
  assert.match(adminCss, /nth-child\(5\).*?width:135px/);
});

test('renders contact as a single synchronized read-only value, not an editable input', () => {
  const detail = adminJs.slice(adminJs.indexOf('const openDetail = raw =>'), adminJs.indexOf('const resendNotification ='));
  assert.match(detail, /syncedReadonlyField\('연락처', formatPhone\(member\.phone \?\? ''\)\)/);
  assert.doesNotMatch(detail, /id="detailPhone"/);
  assert.doesNotMatch(detail, /const summary = /);
  assert.equal((detail.match(/formatPhone\(member\.phone/g) || []).length, 1);
});

test('withdrawn members are fully read-only and cannot submit a save action', () => {
  assert.match(adminJs, /탈퇴 회원은 권한·멤버십·계정상태 및 관리정보를 변경할 수 없습니다/);
  assert.match(adminJs, /member-save-disabled[^]*?disabled>변경 불가/);
  assert.match(adminJs, /if \(withdrawn && nicknameInput\) nicknameInput\.disabled = true/);
  assert.match(adminJs, /else if \(!protectedAccount && !withdrawn\)/);
  assert.match(adminCss, /cursor:not-allowed/);
});

test('only nickname remains editable metadata outside the role-notification email trigger', () => {
  assert.match(adminJs, /const metadataChanged = metadata\.nickname !== memberNickname\(member\)/);
  assert.match(adminJs, /p_nickname: metadata\.nickname/);
  assert.match(adminJs, /p_full_name: memberFullName\(member\)/);
  assert.match(adminJs, /if \(roleChanged && accessSaved\) void \(async \(\) =>/);
});

test('reapplies Sheet G/H/I colors from the current display values', () => {
  assert.match(appsScript, /const DISPLAY_STYLES = Object\.freeze/);
  assert.match(appsScript, /function applyRosterDisplayStyles_\(sheet, startRow, rowCount, columns\)/);
  assert.match(appsScript, /map\.memberType, rowCount, 3/);
  assert.match(appsScript, /applyRosterDisplayStyles_\(sheet, row, 1, columns\)/);
  assert.match(appsScript, /applyRosterDisplayStyles_\(sheet, 2, Math\.max\(sheet\.getLastRow\(\) - 1, 0\), columns\)/);
});

test('detail dialog uses a compact grouped grid with desktop no-scroll and mobile fallback scrolling', () => {
  assert.match(adminCss, /\.member-dialog\{width:min\(900px,calc\(100% - 24px\)\);max-height:92vh;overflow:hidden\}/);
  assert.match(adminCss, /\.member-detail\{max-height:calc\(92vh - 54px\);overflow-y:auto;overflow-x:hidden;gap:\d+px\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{\s*\.member-dialog\{max-height:none\}\s*\.member-detail\{max-height:none;overflow-y:visible;position:relative\}/);
  assert.match(adminCss, /@media\(min-width:681px\)\{[\s\S]*?\.member-detail-groups\{grid-template-columns:1fr 1fr/);
  assert.match(adminCss, /\.partner-region-dialog\{width:min\(640px,calc\(100vw - 32px\)\);max-height:80vh/);
});
