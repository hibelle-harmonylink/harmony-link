/**
 * Harmony Link partner application auto-email.
 * Bind this script to the Google Form response spreadsheet.
 */

const CONFIG = {
  adminEmail: 'hibelle@hibelleconsulting.com',
  partnerCenterUrl: 'https://hibelleharmony.com/#partner-center',
  propertyKey: 'PARTNER_ACCESS_CODE',
  // The 회원가입 명단 webapp's own /exec URL (same value as auth.js's
  // signupAutomationUrl). Without this, a partner's phone/specialty/강의과목
  // answers are only ever emailed to the admin -- they never reach the
  // member roster or the admin panel, and the member number never leaves
  // its pending (빨강) state. This bridges that gap using the roster
  // webapp's existing, unchanged 신청서 sync path (member-signup.gs
  // registerMember_ / isSupplementalApplication_); no DB/RLS change.
  rosterWebappUrlKey: 'MEMBER_ROSTER_WEBAPP_URL'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Harmony Link 자동화')
    .addItem('1. 접근코드 저장', 'savePartnerAccessCode')
    .addItem('2. 자동메일 시작', 'installPartnerEmailTrigger')
    .addItem('3. 회원명단 연동 주소 저장', 'saveMemberRosterWebappUrl')
    .addItem('4. 기존 신청 회원명단 다시 동기화', 'resyncExistingApplications')
    .addItem('설정 상태 확인', 'showPartnerEmailStatus')
    .addToUi();
}

function saveMemberRosterWebappUrl() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '회원가입 명단 연동 주소',
    '회원가입 명단 Apps Script(member-signup.gs)를 배포했을 때 생성된 /exec 주소를 입력하세요.\n(홈페이지 auth.js의 signupAutomationUrl과 동일한 주소입니다.)',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const url = response.getResponseText().trim();
  if (!url) return ui.alert('연동 주소를 입력해 주세요.');
  PropertiesService.getScriptProperties().setProperty(CONFIG.rosterWebappUrlKey, url);
  ui.alert('회원명단 연동 주소가 저장되었습니다.');
}

function savePartnerAccessCode() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '파트너 자료실 접근코드',
    '홈페이지에 설정된 접근코드를 입력하세요.',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const code = response.getResponseText().trim();
  if (!code) return ui.alert('접근코드를 입력해 주세요.');
  PropertiesService.getScriptProperties().setProperty(CONFIG.propertyKey, code);
  ui.alert('접근코드가 안전하게 저장되었습니다.');
}

function installPartnerEmailTrigger() {
  const ui = SpreadsheetApp.getUi();
  if (!PropertiesService.getScriptProperties().getProperty(CONFIG.propertyKey)) {
    return ui.alert('먼저 “접근코드 저장”을 실행해 주세요.');
  }
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'sendPartnerWelcomeEmail')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('sendPartnerWelcomeEmail')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  ui.alert('자동메일이 시작되었습니다. 새 신청부터 자동 발송됩니다.');
}

function showPartnerEmailStatus() {
  const hasCode = Boolean(PropertiesService.getScriptProperties().getProperty(CONFIG.propertyKey));
  const hasTrigger = ScriptApp.getProjectTriggers()
    .some(trigger => trigger.getHandlerFunction() === 'sendPartnerWelcomeEmail');
  const hasRosterUrl = Boolean(PropertiesService.getScriptProperties().getProperty(CONFIG.rosterWebappUrlKey));
  SpreadsheetApp.getUi().alert(
    `접근코드: ${hasCode ? '저장됨' : '미저장'}\n자동메일: ${hasTrigger ? '작동 중' : '중지됨'}\n회원명단 연동: ${hasRosterUrl ? '저장됨' : '미저장(신청 데이터가 회원 상세에 반영되지 않습니다)'}`
  );
}

// Keyword lists reuse the same header-matching strategy as email/name/
// organization above -- they match by substring against whatever the real
// Google Form question text is, so no exact header wording is assumed.
const APPLICATION_FIELD_KEYWORDS = {
  phone: ['연락처', '전화', 'phone', 'mobile', 'contact'],
  specialty: ['전문분야', '전문 분야', 'specialty'],
  teachingSubjects: ['강의과목', '강의 과목', 'teaching'],
  enrolledSubject: ['수강과목', '수강 과목', 'enrolled'],
  assignedInstructor: ['담당강사', '담당 강사', 'instructor']
};

function sendPartnerWelcomeEmail(event) {
  if (!event || !event.namedValues) throw new Error('Form submit event is required.');
  const values = event.namedValues;
  const email = findAnswer(values, ['이메일', 'email', 'e-mail', '메일']);
  const name = findAnswer(values, ['이름', '성명', '담당자', 'name']) || '파트너 신청자';
  const organization = findAnswer(values, ['업체명', '회사명', '기관명', '브랜드명', 'organization', 'company']) || '';
  const accessCode = PropertiesService.getScriptProperties().getProperty(CONFIG.propertyKey);

  if (!email) {
    MailApp.sendEmail({
      to: CONFIG.adminEmail,
      subject: '[Harmony Link] 이메일 주소를 찾지 못한 파트너 신청',
      htmlBody: `<p>새 신청이 접수됐지만 이메일 항목을 찾지 못했습니다.</p>${renderAnswers(values)}`
    });
    return;
  }
  if (!accessCode) throw new Error('PARTNER_ACCESS_CODE is not configured.');

  MailApp.sendEmail({
    to: email,
    name: 'Harmony Link',
    replyTo: CONFIG.adminEmail,
    subject: '[Harmony Link] 입점 파트너 자료실 이용 안내',
    htmlBody: buildWelcomeEmail(name, organization, accessCode)
  });

  MailApp.sendEmail({
    to: CONFIG.adminEmail,
    subject: `[Harmony Link] 새 입점 파트너 신청: ${organization || name}`,
    htmlBody: `<p><b>${name}</b> 님에게 파트너 자료실 안내 메일이 자동 발송되었습니다.</p>${renderAnswers(values)}`
  });

  // Best-effort: never let a roster sync failure break the welcome email
  // that already succeeded above.
  try {
    forwardApplicationToRoster_(email, name, values);
  } catch (error) {
    console.error('Member roster sync failed for partner application:', String(error && error.message ? error.message : error));
  }
}

// Forwards only the application fields the applicant actually answered
// (real submitted values -- nothing is invented here) to the existing
// 회원가입 명단 webapp, using the exact 신청서 field names it already
// recognizes (automation/member-signup.gs applicationValue_/
// isSupplementalApplication_). The webapp itself decides whether a
// matching member exists (UUID first, case-insensitive email fallback)
// and only then updates the Sheet row and syncs application_completed to
// Supabase -- this function does not touch either store directly.
function forwardApplicationToRoster_(email, name, namedValues) {
  const rosterUrl = PropertiesService.getScriptProperties().getProperty(CONFIG.rosterWebappUrlKey);
  if (!rosterUrl) return;

  const phone = findAnswer(namedValues, APPLICATION_FIELD_KEYWORDS.phone);
  const specialty = findAnswer(namedValues, APPLICATION_FIELD_KEYWORDS.specialty);
  const teachingSubjects = findAnswer(namedValues, APPLICATION_FIELD_KEYWORDS.teachingSubjects);
  const enrolledSubject = findAnswer(namedValues, APPLICATION_FIELD_KEYWORDS.enrolledSubject);
  const assignedInstructor = findAnswer(namedValues, APPLICATION_FIELD_KEYWORDS.assignedInstructor);
  if (!phone && !specialty && !teachingSubjects && !enrolledSubject && !assignedInstructor) return;

  const payload = {
    '이메일': email,
    '이름': name,
    '연락처': phone,
    '전문분야': specialty,
    '강의과목': teachingSubjects,
    '수강과목': enrolledSubject,
    '담당강사': assignedInstructor
  };
  const response = UrlFetchApp.fetch(rosterUrl, {
    method: 'post', muteHttpExceptions: true, followRedirects: true,
    payload: payload
  });
  const result = JSON.parse(response.getContentText() || '{}');
  if (!result.ok) {
    // Expected, not an error, when this applicant has not signed up on the
    // site yet -- there is no existing member row to attach the answers to.
    console.warn('Member roster sync skipped/failed:', result.error || response.getResponseCode());
  }
}

// Re-sends every already-submitted response through the same forwarding
// path above, for partners who applied before the roster URL was
// configured (or before this sync existed). Safe to run repeatedly: the
// roster webapp only ever updates an existing matched row's mutable
// application fields, and never reissues or changes 회원번호.
function resyncExistingApplications() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return ui.alert('동기화할 신청 데이터가 없습니다.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();
  let synced = 0;
  let skipped = 0;
  rows.forEach(row => {
    const namedValues = {};
    headers.forEach((header, index) => { namedValues[header] = [row[index]]; });
    const email = findAnswer(namedValues, ['이메일', 'email', 'e-mail', '메일']);
    const name = findAnswer(namedValues, ['이름', '성명', '담당자', 'name']) || '파트너 신청자';
    if (!email) { skipped += 1; return; }
    try {
      forwardApplicationToRoster_(email, name, namedValues);
      synced += 1;
    } catch (error) {
      skipped += 1;
      console.error('Resync failed for', email, String(error && error.message ? error.message : error));
    }
  });
  ui.alert(`동기화 시도: ${synced}건, 건너뜀(이메일 없음/실패): ${skipped}건\n실제 반영 여부는 회원 상세관리에서 확인하세요.`);
}

function findAnswer(namedValues, keywords) {
  const normalized = keywords.map(keyword => keyword.toLowerCase());
  const key = Object.keys(namedValues).find(header => {
    const lower = header.toLowerCase();
    return normalized.some(keyword => lower.includes(keyword));
  });
  return key ? String((namedValues[key] || [''])[0]).trim() : '';
}

function buildWelcomeEmail(name, organization, accessCode) {
  const displayName = escapeHtml(name);
  const displayOrg = organization ? ` (${escapeHtml(organization)})` : '';
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#142a47;line-height:1.7">
      <div style="padding:28px;background:#0b55b7;color:#fff;border-radius:18px 18px 0 0">
        <small style="letter-spacing:2px">HARMONY LINK PARTNER CENTER</small>
        <h1 style="margin:7px 0 0;font-size:25px">입점 파트너 자료실 안내</h1>
      </div>
      <div style="padding:28px;border:1px solid #d9e5f4;border-top:0;border-radius:0 0 18px 18px">
        <p>${displayName}${displayOrg} 님, 입점 파트너 신청을 보내주셔서 감사합니다.</p>
        <p>아래 자료실에서 운영 정책과 파트너 매뉴얼을 확인해 주세요.</p>
        <p><a href="${CONFIG.partnerCenterUrl}" style="display:inline-block;padding:13px 20px;background:#0b55b7;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold">파트너 자료실 열기</a></p>
        <div style="margin:22px 0;padding:18px;background:#f1f6fc;border-radius:12px">
          <small>자료실 접근코드</small><br>
          <strong style="font-size:20px;letter-spacing:1px">${escapeHtml(accessCode)}</strong>
        </div>
        <ol>
          <li>자료실 링크를 엽니다.</li>
          <li>접근코드를 입력합니다.</li>
          <li>운영 정책과 매뉴얼을 확인합니다.</li>
        </ol>
        <p style="font-size:12px;color:#64748b">이 코드는 파트너 전용입니다. 외부 공유를 삼가 주세요.</p>
      </div>
    </div>`;
}

function renderAnswers(namedValues) {
  return '<table style="border-collapse:collapse">' + Object.keys(namedValues).map(key =>
    `<tr><th style="text-align:left;padding:6px;border:1px solid #ddd">${escapeHtml(key)}</th><td style="padding:6px;border:1px solid #ddd">${escapeHtml((namedValues[key] || []).join(', '))}</td></tr>`
  ).join('') + '</table>';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
