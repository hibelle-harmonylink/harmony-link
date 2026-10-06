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
 *
 * This file also applies left-alignment formatting only (never a value
 * change) to the response sheet: automatically to each new Form submission's
 * row via the same onFormSubmit trigger, and on demand to the whole sheet
 * via the "응답 전체 왼쪽 정렬" admin menu item. Alignment and roster sync are
 * independent of each other -- one failing never blocks the other.
 *
 * It also fills a management-only "관리용 한글 이름" column from the 회원가입
 * 명단 Spreadsheet's own "이름" column, read directly (server-side, inside
 * this Apps Script project only -- never through a new public endpoint and
 * never through member-signup.gs, which this feature does not modify) by
 * exact, case-insensitive email match against that roster's own "이메일"
 * column. Only a roster name that actually contains Hangul is ever written;
 * an English-only roster name, an unmatched email, or an unreachable roster
 * connection all leave the cell untouched. This never reads or writes any
 * other roster field (회원번호/UUID/전화/멤버십/role 등), and is independent
 * of alignment and roster application sync -- any one failing never blocks
 * the other two.
 */
const DIGITAL_CLASS_CONFIG = {
  // Same /exec URL as auth.js's signupAutomationUrl and the other bridges'
  // saved MEMBER_ROSTER_WEBAPP_URL property.
  rosterWebappUrlKey: 'MEMBER_ROSTER_WEBAPP_URL',
  // A separate, admin-entered Script Property -- never a hardcoded or
  // guessed Spreadsheet ID -- pointing at the 회원가입 명단 Spreadsheet itself,
  // read directly and only for the verified-Korean-name lookup below.
  rosterSpreadsheetIdKey: 'MEMBER_ROSTER_SPREADSHEET_ID'
};

// Exact, confirmed response-sheet headers (not guessed keywords).
const DIGITAL_CLASS_HEADERS = {
  name: '4.이름',
  email: '9.구글이메일',
  phone: '8.연락처(휴대폰)',
  enrolledSubject: '11.수강 신청반'
};

// The management-only column this feature owns on the response sheet.
// Reused if already present; appended once, at the end, only if missing.
const DIGITAL_CLASS_MANAGED_HEADERS = {
  verifiedKoreanName: '관리용 한글 이름'
};

// The 회원가입 명단 Spreadsheet's own tab name and the two column headers
// this feature reads -- matched by header text at runtime, never by a
// hardcoded column index, so a future column reorder in that roster cannot
// silently misread the wrong field. Deliberately not the "한글 이름"/"영문
// 이름" split from member-signup.gs's own HEADERS constant: that split is a
// not-yet-migrated future schema. The live roster's real, current name
// column is simply "이름".
const MEMBER_ROSTER_SHEET_NAME = '회원가입 명단';
const MEMBER_ROSTER_HEADERS = {
  name: '이름',
  email: '이메일'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Harmony Link 자동화')
    .addItem('1. 회원명단 연동 주소 저장', 'saveDigitalClassRosterWebappUrl')
    .addItem('2. 신규 제출 연동 시작', 'installDigitalClassApplicationTrigger')
    .addItem('응답 전체 왼쪽 정렬', 'alignAllDigitalClassResponsesLeft')
    .addItem('회원명단 시트 연결', 'saveMemberRosterSpreadsheetId')
    .addItem('관리용 한글 이름 동기화', 'syncDigitalClassVerifiedKoreanNames')
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

// Stores only the 회원가입 명단 Spreadsheet's own ID -- extracted from a pasted
// URL or accepted as a bare ID -- as a Script Property. This is a separate
// property from MEMBER_ROSTER_WEBAPP_URL: it is read directly, server-side,
// by this script to look up a verified Korean name; it is never sent
// anywhere and never exposed through any endpoint.
function saveMemberRosterSpreadsheetId() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '회원명단 시트 연결',
    '회원가입 명단 Spreadsheet의 URL 또는 ID를 입력하세요.',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const id = extractSpreadsheetId_(response.getResponseText());
  if (!id) return ui.alert('올바른 Spreadsheet URL 또는 ID를 입력해 주세요.');
  PropertiesService.getScriptProperties().setProperty(DIGITAL_CLASS_CONFIG.rosterSpreadsheetIdKey, id);
  ui.alert('회원명단 시트가 연결되었습니다.');
}

// Accepts a full Google Sheets URL (any trailing path/query/hash) or a bare
// Spreadsheet ID. Never guesses or invents an ID; an unrecognized input
// returns '' so the caller can reject it.
function extractSpreadsheetId_(input) {
  const value = trimmed_(input);
  if (!value) return '';
  const urlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  return /^[a-zA-Z0-9-_]+$/.test(value) ? value : '';
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

// Menu-triggered, one-time formatting pass over whichever sheet this script
// is bound to -- always the active sheet, never a hardcoded name or ID -- and
// always its actual data range (SpreadsheetApp.Range.getDataRange()), never a
// hardcoded row/column count. Only horizontal alignment is changed; no cell
// value is read or written, so every existing response (timestamp, name,
// email, phone, birth date, application content) is left byte-for-byte
// unchanged.
function alignAllDigitalClassResponsesLeft() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getDataRange();
  if (range.getNumRows() < 1 || range.getNumColumns() < 1) {
    ui.alert('정렬할 데이터가 없습니다.');
    return;
  }
  range.setHorizontalAlignment('left');
  ui.alert('응답 시트 전체가 왼쪽 정렬되었습니다.');
}

// Google Form submit handler. Never raises past this function -- a failure
// here must not interrupt the applicant's own Form submission experience.
// Alignment, verified-Korean-name sync, and roster application sync are each
// wrapped in their own try/catch so that any one of the three failing never
// prevents the other two from running.
function forwardDigitalClassApplication(event) {
  if (!event || !event.namedValues) throw new Error('Form submit event is required.');
  try {
    alignDigitalClassResponseRowLeft_(event);
  } catch (error) {
    console.error('Response row left-alignment failed for digital class application:', String(error && error.message ? error.message : error));
  }
  try {
    syncDigitalClassVerifiedKoreanNameForSubmission_(event);
  } catch (error) {
    console.error('Verified Korean name sync failed for digital class application:', String(error && error.message ? error.message : error));
  }
  try {
    forwardDigitalClassApplicationToRoster_(event.namedValues);
  } catch (error) {
    console.error('Member roster sync failed for digital class application:', String(error && error.message ? error.message : error));
  }
}

// Left-aligns only the newly submitted response row, across every currently
// used column of its own sheet. event.range.getSheet() and
// event.range.getRow() come straight from the real onFormSubmit event --
// no sheet ID and no row number is ever hardcoded here. The column count
// comes from that same sheet's own getLastColumn(), not a hardcoded width,
// so it stays correct even if columns are added later. Only alignment
// formatting is touched -- no value is read or written.
function alignDigitalClassResponseRowLeft_(event) {
  if (!event || !event.range) return;
  const sheet = event.range.getSheet();
  const row = event.range.getRow();
  const lastColumn = sheet.getLastColumn();
  if (!row || lastColumn < 1) return;
  sheet.getRange(row, 1, 1, lastColumn).setHorizontalAlignment('left');
}

// Writes the verified Korean name for exactly the one newly submitted row,
// using the same event.range.getSheet()/getRow() the alignment helper uses
// -- no row number is ever hardcoded here either. A missing/misconfigured
// roster connection, an unmatched email, or an English-only roster name all
// leave this row's managed cell untouched; only a real exact-email match
// whose roster name contains Hangul is ever written.
function syncDigitalClassVerifiedKoreanNameForSubmission_(event) {
  if (!event || !event.range) return;
  const sheet = event.range.getSheet();
  const row = event.range.getRow();
  if (!row) return;
  const email = digitalClassAnswer_(event.namedValues, DIGITAL_CLASS_HEADERS.email);
  if (!email) return;
  syncVerifiedKoreanNameForRow_(sheet, row, email);
}

// Menu-triggered, admin-run-only pass over every existing response row.
// Writes to the managed "관리용 한글 이름" column alone -- every other
// response cell (timestamp, 4.이름, email, phone, birth date, application
// content, etc.) is only ever read here, never written, and no row is ever
// deleted, reordered, or sorted.
function syncDigitalClassVerifiedKoreanNames() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) {
    ui.alert('동기화할 응답이 없습니다.');
    return;
  }
  let nameByEmail;
  try {
    nameByEmail = buildRosterVerifiedKoreanNameMap_();
  } catch (error) {
    ui.alert('회원명단 시트를 읽지 못했습니다: ' + (error && error.message ? error.message : error));
    return;
  }
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const emailColumn = headerColumn_(headers, DIGITAL_CLASS_HEADERS.email);
  if (!emailColumn) {
    ui.alert('응답 시트에서 "' + DIGITAL_CLASS_HEADERS.email + '" 헤더를 찾지 못했습니다.');
    return;
  }
  const managedColumn = ensureManagedKoreanNameColumn_(sheet);
  const emails = sheet.getRange(2, emailColumn, lastRow - 1, 1).getDisplayValues();
  let matched = 0;
  emails.forEach(function (cell, offset) {
    const email = trimmed_(cell[0]).toLowerCase();
    const verifiedName = email ? nameByEmail[email] : '';
    if (!verifiedName) return;
    sheet.getRange(offset + 2, managedColumn).setValue(verifiedName);
    matched += 1;
  });
  ui.alert('관리용 한글 이름 동기화가 완료되었습니다. 매칭됨: ' + matched + '건.');
}

// Writes one row's verified Korean name, looking it up fresh for this one
// email. Only ever sets a value when a real match with a Hangul-containing
// roster name is found; otherwise this is a no-op, leaving the managed cell
// exactly as it was.
function syncVerifiedKoreanNameForRow_(sheet, row, email) {
  const verifiedName = lookupVerifiedKoreanName_(email);
  if (!verifiedName) return;
  const column = ensureManagedKoreanNameColumn_(sheet);
  sheet.getRange(row, column).setValue(verifiedName);
}

// Finds the existing "관리용 한글 이름" column by header text (reused if
// already present) or appends it once, at the end of the sheet's current
// used columns. Never creates a duplicate, and never touches any other
// header or any data cell.
function ensureManagedKoreanNameColumn_(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0] : [];
  const existing = headerColumn_(headers, DIGITAL_CLASS_MANAGED_HEADERS.verifiedKoreanName);
  if (existing) return existing;
  const column = lastColumn + 1;
  sheet.getRange(1, column).setValue(DIGITAL_CLASS_MANAGED_HEADERS.verifiedKoreanName);
  return column;
}

// Looks up exactly one email's verified Korean name. Returns '' for every
// protective case: no roster connection configured, an unreadable/invalid
// roster, no exact-email match, or a matched name with no Hangul in it.
function lookupVerifiedKoreanName_(email) {
  const normalized = trimmed_(email).toLowerCase();
  if (!normalized) return '';
  const nameByEmail = buildRosterVerifiedKoreanNameMap_();
  return nameByEmail[normalized] || '';
}

// Opens the 회원가입 명단 Spreadsheet strictly by the admin-configured Script
// Property ID (never a hardcoded or guessed ID), reads only its "이름" and
// "이메일" columns -- located at runtime by header text, never a hardcoded
// column index -- and returns a { lowercased email: verified Korean name }
// map containing only emails whose roster name actually contains Hangul.
// No other roster column (회원번호/UUID/전화/멤버십/role 등) is ever read.
// This never writes to the roster Spreadsheet and never logs its contents.
function buildRosterVerifiedKoreanNameMap_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(DIGITAL_CLASS_CONFIG.rosterSpreadsheetIdKey);
  if (!spreadsheetId) throw new Error('회원명단 시트가 아직 연결되지 않았습니다. "회원명단 시트 연결" 메뉴를 먼저 실행하세요.');
  const book = SpreadsheetApp.openById(spreadsheetId);
  const sheet = book.getSheetByName(MEMBER_ROSTER_SHEET_NAME);
  if (!sheet) throw new Error('연결된 시트에서 "' + MEMBER_ROSTER_SHEET_NAME + '" 탭을 찾지 못했습니다.');
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  const map = {};
  if (lastColumn < 1 || lastRow < 2) return map;
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const nameColumn = headerColumn_(headers, MEMBER_ROSTER_HEADERS.name);
  const emailColumn = headerColumn_(headers, MEMBER_ROSTER_HEADERS.email);
  if (!nameColumn || !emailColumn) {
    throw new Error('회원명단 시트에서 "' + MEMBER_ROSTER_HEADERS.name + '" 또는 "' + MEMBER_ROSTER_HEADERS.email + '" 헤더를 찾지 못했습니다.');
  }
  const rows = sheet.getRange(2, 1, lastRow - 1, lastColumn).getDisplayValues();
  rows.forEach(function (row) {
    const email = trimmed_(row[emailColumn - 1]).toLowerCase();
    if (!email) return;
    const name = trimmed_(row[nameColumn - 1]);
    if (containsHangul_(name)) map[email] = name;
  });
  return map;
}

// First-occurrence header lookup by exact text match. Returns 0 (falsy)
// when not found, matching this file's existing 1-based column convention.
function headerColumn_(headers, headerName) {
  const index = headers.findIndex(function (header) { return trimmed_(header) === headerName; });
  return index < 0 ? 0 : index + 1;
}

// A verified Korean name must contain at least one actual Hangul syllable.
// An English-only romanized value never passes.
function containsHangul_(value) {
  return /[가-힣]/.test(String(value || ''));
}

function trimmed_(value) {
  return String(value || '').trim();
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
