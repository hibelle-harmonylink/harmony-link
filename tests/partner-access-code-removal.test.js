const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const partnerScript = fs.readFileSync(path.join(root, 'automation', 'partner-form-auto-email.gs'), 'utf8');
const memberScript = fs.readFileSync(path.join(root, 'automation', 'member-signup.gs'), 'utf8');
const setupDoc = fs.readFileSync(path.join(root, 'automation', 'PARTNER_EMAIL_SETUP.md'), 'utf8');

test('partner email automation no longer has an access-code dependency', () => {
  assert.doesNotMatch(partnerScript, /PARTNER_ACCESS_CODE/);
  assert.doesNotMatch(partnerScript, /function savePartnerAccessCode/);
  assert.doesNotMatch(partnerScript, /접근코드 저장/);
});

test('automatic email trigger installs without an access-code gate', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function installPartnerEmailTrigger'), partnerScript.indexOf('function showPartnerEmailStatus'));
  assert.match(body, /ScriptApp\.newTrigger\('sendPartnerWelcomeEmail'\)/);
  assert.doesNotMatch(body, /getProperty\(/);
  assert.doesNotMatch(body, /접근코드/);
});

test('roster forwarding and retry-safe member-number path remain intact', () => {
  assert.match(partnerScript, /rosterWebappUrlKey: 'MEMBER_ROSTER_WEBAPP_URL'/);
  assert.match(partnerScript, /function forwardApplicationToRoster_\(email, name, namedValues\)/);
  assert.match(partnerScript, /function resyncExistingApplications\(\)/);
  assert.match(memberScript, /const memberNumber = row\s*\n\s*\? text_\(sheet\.getRange\(row, COLUMNS\.memberNumber\)\.getDisplayValue\(\)\)\s*\n\s*: nextMemberNumber_\(sheet, joinedAt\);/);
});

test('welcome email keeps Partner Center and signed-in approved-member guidance without an access code', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function buildWelcomeEmail'), partnerScript.indexOf('function renderAnswers'));
  assert.match(body, /CONFIG\.partnerCenterUrl/);
  assert.match(body, /HarmonyLink 계정으로 로그인/);
  assert.match(body, /승인된 회원\/파트너 권한/);
  assert.doesNotMatch(body, /accessCode|접근코드/);
  assert.match(setupDoc, /HarmonyLink 계정 로그인 안내/);
  assert.doesNotMatch(setupDoc, /접근코드 저장/);
});

test('automation menu has only the current three numbered actions plus status', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function onOpen'), partnerScript.indexOf('function saveMemberRosterWebappUrl'));
  assert.match(body, /1\. 자동메일 시작/);
  assert.match(body, /2\. 회원명단 연동 주소 저장/);
  assert.match(body, /3\. 기존 신청 회원명단 다시 동기화/);
  assert.match(body, /설정 상태 확인/);
  assert.doesNotMatch(body, /4\.|접근코드/);
});
