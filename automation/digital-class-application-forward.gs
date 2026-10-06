/**
 * Harmony Link 디지털 클래스 신청서 → 회원명단 연동.
 * Bind this script to the 디지털 클래스 신청서 Google Form's response spreadsheet
 * (Form ID 1DWtn1FQD86E4EHzABxeoEpHDuVeoFH_Smak4_C1RU7M, 응답 Sheet
 * "디지털 클래스 신청서(응답)").
 *
 * This mirrors the already-tested partner-application bridge
 * (partner-form-auto-email.gs) and reuses the exact same roster webapp path
 * (member-signup.gs registerMember_ / isSupplementalApplication_) -- no new
 * DB write logic, no new RPC, no direct SQL. A new Digital Class response is
 * forwarded only when its 9.구글이메일 matches an existing 회원가입 명단 row by
 * case-insensitive exact email match (the roster webapp's own
 * findMemberRow_ performs that match); a name-only match is never made, a
 * mismatched/unknown email is skipped and logged, and no new member account,
 * row, or 회원번호 is ever created from a Form submission.
 */
const DIGITAL_CLASS_CONFIG = {
  // Same /exec URL as auth.js's signupAutomationUrl and the other bridges'
  // saved MEMBER_ROSTER_WEBAPP_URL property.
  rosterWebappUrlKey: 'MEMBER_ROSTER_WEBAPP_URL'
};

// Exact, confirmed response-sheet headers (not guessed keywords).
const DIGITAL_CLASS_HEADERS = {
  name: '4.이름',
  email: '9.구글이메일',
  phone: '8.연락처(휴대폰)',
  enrolledSubject: '11.수강 신청반'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Harmony Link 자동화')
    .addItem('1. 회원명단 연동 주소 저장', 'saveDigitalClassRosterWebappUrl')
    .addItem('2. 신규 제출 연동 시작', 'installDigitalClassApplicationTrigger')
    .addItem('설정 상태 확인', 'showDigitalClassApplicationStatus')
    .addToUi();
}

function saveDigitalClassRosterWebappUrl() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '회원가입 명단 연동 주소',
    '회원가입 명단 Apps Script(member-signup.gs)를 배포했을 때 생성된 /exec 주소를 입력하세요.\n(홈페이지 auth.js의 signupAutomationUrl과 동일한 주소입니다.)',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const url = response.getResponseText().trim();
  if (!url) return ui.alert('연동 주소를 입력해 주세요.');
  PropertiesService.getScriptProperties().setProperty(DIGITAL_CLASS_CONFIG.rosterWebappUrlKey, url);
  ui.alert('회원명단 연동 주소가 저장되었습니다.');
}

function showDigitalClassApplicationStatus() {
  const hasTrigger = ScriptApp.getProjectTriggers()
    .some(trigger => trigger.getHandlerFunction() === 'forwardDigitalClassApplication');
  const hasRosterUrl = Boolean(PropertiesService.getScriptProperties().getProperty(DIGITAL_CLASS_CONFIG.rosterWebappUrlKey));
  SpreadsheetApp.getUi().alert(
    `신규 제출 연동: ${hasTrigger ? '작동 중' : '중지됨'}\n회원명단 연동 주소: ${hasRosterUrl ? '저장됨' : '미저장(신청 데이터가 회원 상세에 반영되지 않습니다)'}`
  );
}

// Installed as an onFormSubmit trigger -- only new submissions from this
// point forward are forwarded. The existing 75 historic responses are
// deliberately NOT reprocessed by this installer; that is a separate,
// manual reconciliation decision outside this automation's scope.
function installDigitalClassApplicationTrigger() {
  const ui = SpreadsheetApp.getUi();
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'forwardDigitalClassApplication')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('forwardDigitalClassApplication')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  ui.alert('디지털 클래스 신청서 연동이 시작되었습니다. 새 신청부터 자동 반영됩니다.');
}

// Google Form submit handler. Never raises past this function -- a failure
// here must not interrupt the applicant's own Form submission experience.
function forwardDigitalClassApplication(event) {
  if (!event || !event.namedValues) throw new Error('Form submit event is required.');
  try {
    forwardDigitalClassApplicationToRoster_(event.namedValues);
  } catch (error) {
    console.error('Member roster sync failed for digital class application:', String(error && error.message ? error.message : error));
  }
}

// Forwards only the fields the applicant actually answered (real submitted
// values -- nothing invented here) to the existing 회원가입 명단 webapp, using
// the exact 신청서 field names it already recognizes
// (automation/member-signup.gs applicationValue_/isSupplementalApplication_).
// The webapp itself -- unchanged by this file -- decides whether a matching
// member exists by case-insensitive exact email match, and only then
// updates the Sheet row's mutable application fields and syncs
// application_completed to Supabase via the existing
// internal_sync_member_application_metadata path. This function never
// writes to Supabase or the roster Sheet directly, never issues or changes
// a 회원번호, and never creates a new member row when no match is found.
function forwardDigitalClassApplicationToRoster_(namedValues) {
  const rosterUrl = PropertiesService.getScriptProperties().getProperty(DIGITAL_CLASS_CONFIG.rosterWebappUrlKey);
  if (!rosterUrl) return;

  const email = digitalClassAnswer_(namedValues, DIGITAL_CLASS_HEADERS.email);
  const name = digitalClassAnswer_(namedValues, DIGITAL_CLASS_HEADERS.name) || '신청자';
  if (!email) return;

  const phone = digitalClassAnswer_(namedValues, DIGITAL_CLASS_HEADERS.phone);
  const enrolledSubject = digitalClassAnswer_(namedValues, DIGITAL_CLASS_HEADERS.enrolledSubject);
  if (!phone && !enrolledSubject) return;

  const payload = {
    '이메일': email,
    '이름': name,
    '연락처': phone,
    '수강과목': enrolledSubject
  };
  const response = UrlFetchApp.fetch(rosterUrl, {
    method: 'post', muteHttpExceptions: true, followRedirects: true,
    payload: payload
  });
  const result = JSON.parse(response.getContentText() || '{}');
  if (!result.ok) {
    // Expected, not an error, when this applicant's Form email does not
    // match any existing Harmony Link member by exact email -- there is no
    // row to attach the answers to, and none is created.
    console.warn('Member roster sync skipped/failed:', result.error || response.getResponseCode());
  }
}

function digitalClassAnswer_(namedValues, header) {
  const value = namedValues[header];
  return value ? String(value[0] || '').trim() : '';
}
