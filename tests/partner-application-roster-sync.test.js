const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const partnerScript = read(path.join('automation', 'partner-form-auto-email.gs'));
const memberScript = read(path.join('automation', 'member-signup.gs'));
const setupDoc = read(path.join('automation', 'PARTNER_EMAIL_SETUP.md'));

// Investigation finding (this round): the real 입점 파트너 신청 Google Form is
// bound to its OWN Apps Script project (partner-form-auto-email.gs), which is
// completely separate from the 회원가입 명단 project (member-signup.gs). Before
// this change, sendPartnerWelcomeEmail() only ever sent the applicant a
// welcome email and notified the admin -- it never called member-signup.gs's
// /exec webapp, so isSupplementalApplication_()/applicationValue_() (and the
// application_completed sync they gate) were never even reached for a real
// partner application. That is the actual, code-confirmed root cause of a
// matched partner's phone/specialty/teaching_subjects never appearing in the
// admin detail view and their member number never leaving its pending
// (red/검정 아님) state -- not a Google Form header/field-name mismatch, and
// not a UI rendering bug (both were already fixed/correct going into this
// round). No DB/RLS/schema change is required or was made: the fix reuses
// the existing, unchanged registerMember_ / isSupplementalApplication_ /
// syncApplicationMetadata_ path in member-signup.gs end to end.

test('partner-form-auto-email.gs can forward a real application to the existing 회원가입 명단 webapp instead of only emailing it', () => {
  assert.match(partnerScript, /function forwardApplicationToRoster_\(email, name, namedValues\)/);
  assert.match(partnerScript, /rosterWebappUrlKey: 'MEMBER_ROSTER_WEBAPP_URL'/);
  assert.match(partnerScript, /UrlFetchApp\.fetch\(rosterUrl,/);
});

test('the forward only fires once a roster URL is configured, and is a no-op (not a crash) otherwise', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function forwardApplicationToRoster_'), partnerScript.indexOf('function resyncExistingApplications'));
  assert.match(body, /const rosterUrl = PropertiesService\.getScriptProperties\(\)\.getProperty\(CONFIG\.rosterWebappUrlKey\);\s*\n\s*if \(!rosterUrl\) return;/);
});

test('the forward is best-effort and never breaks the welcome email that already succeeded', () => {
  const handler = partnerScript.slice(partnerScript.indexOf('function sendPartnerWelcomeEmail'), partnerScript.indexOf('function forwardApplicationToRoster_'));
  assert.match(handler, /try \{\s*\n\s*forwardApplicationToRoster_\(email, name, values\);\s*\n\s*\} catch \(error\) \{/);
});

test('application fields are matched by real-header substring keywords, including the partner form support-area and offered-program labels', () => {
  assert.match(partnerScript, /phone: \['연락처', '전화', 'phone', 'mobile', 'contact'\]/);
  assert.match(partnerScript, /specialty: \['전문분야', '전문 분야', '지원 분야', '지원분야', 'specialty'\]/);
  assert.match(partnerScript, /teachingSubjects: \['강의과목', '강의 과목', '제공 가능한 프로그램', '제공가능한 프로그램', 'teaching'\]/);
  assert.match(partnerScript, /enrolledSubject: \['수강과목', '수강 과목', 'enrolled'\]/);
  assert.match(partnerScript, /assignedInstructor: \['담당강사', '담당 강사', 'instructor'\]/);
});

test('nothing is forwarded, and no roster row is touched, when the applicant answered none of the application fields', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function forwardApplicationToRoster_'), partnerScript.indexOf('function resyncExistingApplications'));
  assert.match(body, /if \(!phone && !specialty && !teachingSubjects && !enrolledSubject && !assignedInstructor\) return;/);
});

test('only real submitted answers are sent -- no field is invented, defaulted, or guessed', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function forwardApplicationToRoster_'), partnerScript.indexOf('function resyncExistingApplications'));
  assert.match(body, /const phone = findAnswer\(namedValues, APPLICATION_FIELD_KEYWORDS\.phone\);/);
  assert.match(body, /const specialty = findAnswer\(namedValues, APPLICATION_FIELD_KEYWORDS\.specialty\);/);
  assert.doesNotMatch(body, /'000-0000-0000'|'전화번호 없음'|'미상'/);
});

test('the forwarded payload keys are exactly the 신청서 field names member-signup.gs already recognizes end to end', () => {
  const body = partnerScript.slice(partnerScript.indexOf('const payload = {'), partnerScript.indexOf('const response = UrlFetchApp.fetch'));
  assert.match(body, /'이메일': email/);
  assert.match(body, /'이름': name/);
  assert.match(body, /'연락처': phone/);
  assert.match(body, /'전문분야': specialty/);
  assert.match(body, /'강의과목': teachingSubjects/);
  assert.match(body, /'수강과목': enrolledSubject/);
  assert.match(body, /'담당강사': assignedInstructor/);

  // Cross-check against the receiving side in member-signup.gs: every key
  // above must be one of the keys missingRegistrationField_/applicationValue_
  // actually reads, so a forwarded application is never silently dropped.
  assert.match(memberScript, /values\['이메일'\] \|\| values\.email/);
  assert.match(memberScript, /values\['이름'\] \|\| values\.full_name \|\| values\['표시 이름'\] \|\| values\.nickname/);
  assert.match(memberScript, /aliases = \{\s*\n\s*phone: \['phone', 'phone_number', 'mobile', 'contact'\],\s*\n\s*specialty: \['specialty'\],\s*\n\s*teaching_subjects: \['teaching_subjects'\],\s*\n\s*enrolled_subject: \['enrolled_subject'\],\s*\n\s*assigned_instructor: \['assigned_instructor'\]\s*\n\s*\};/);
  assert.match(memberScript, /const keys = \(aliases\[canonical\] \|\| \[canonical\]\)\.concat\(korean \? \[korean\] : \[\]\);/);
});

test('member-signup.gs accepts an email-only (no 회원 ID) supplemental application and matches it to an existing member instead of hard-failing', () => {
  // This is the exact bypass forwardApplicationToRoster_ relies on: the
  // partner form never carries the Supabase UUID, only the applicant's email.
  assert.match(memberScript, /invalidField === '회원 ID' && isSupplementalApplication_\(values\) && text_\(values\['이메일'\] \|\| values\.email\)/);
  assert.match(memberScript, /if \(!row && isSupplementalApplication\) throw new Error\('신청서 이메일과 일치하는 기존 회원을 찾지 못했습니다\.'\);/);
});

test('re-syncing already-submitted responses reuses forwardApplicationToRoster_ instead of a second, divergent code path', () => {
  const body = partnerScript.slice(partnerScript.indexOf('function resyncExistingApplications'), partnerScript.indexOf('function findAnswer'));
  assert.match(body, /forwardApplicationToRoster_\(email, name, namedValues\);/);
  // Reads the sheet's own historic rows (real, already-submitted answers) --
  // it does not accept or require any new externally-supplied data.
  assert.match(body, /sheet\.getRange\(2, 1, lastRow - 1, sheet\.getLastColumn\(\)\)\.getDisplayValues\(\);/);
});

test('the resync is retry-safe: member-signup.gs never reissues or replaces an existing 회원번호 on a repeat sync', () => {
  assert.match(memberScript, /const memberNumber = row\s*\n\s*\? text_\(sheet\.getRange\(row, columns\.memberNumber\)\.getDisplayValue\(\)\)\s*\n\s*: nextMemberNumber_\(sheet, joinedAt, columns\);/);
});

test('operators are told, in the setup doc, that the roster URL is required for application data to reach the admin detail view', () => {
  assert.match(setupDoc, /2\. 회원명단 연동 주소 저장/);
  assert.match(setupDoc, /3\. 기존 신청 회원명단 다시 동기화/);
  assert.match(setupDoc, /이 단계를 건너뛰면 신청서의 연락처·전문분야·강의과목이 자동메일만 보내고 회원 상세관리에는 반영되지 않습니다\./);
});
