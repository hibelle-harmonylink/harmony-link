/**
 * Harmony Link partner application auto-email.
 * Bind this script to the Google Form response spreadsheet.
 */

const CONFIG = {
  adminEmail: 'hibelle@hibelleconsulting.com',
  partnerCenterUrl: 'https://hibelleharmony.com/#partner-center',
  propertyKey: 'PARTNER_ACCESS_CODE'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Harmony Link 자동화')
    .addItem('1. 접근코드 저장', 'savePartnerAccessCode')
    .addItem('2. 자동메일 시작', 'installPartnerEmailTrigger')
    .addItem('설정 상태 확인', 'showPartnerEmailStatus')
    .addToUi();
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
  SpreadsheetApp.getUi().alert(
    `접근코드: ${hasCode ? '저장됨' : '미저장'}\n자동메일: ${hasTrigger ? '작동 중' : '중지됨'}`
  );
}

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
