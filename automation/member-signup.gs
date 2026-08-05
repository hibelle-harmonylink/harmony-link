/** Harmony Link 회원가입 명단 스프레드시트 누적 자동화 */
const MEMBER_SIGNUP = {
  sheetName: '회원가입 명단',
  propertySpreadsheetId: 'MEMBER_SPREADSHEET_ID',
  supabaseUrl: 'https://ricndeoiomzjacmrsjtg.supabase.co',
  supabasePublishableKey: 'sb_publishable_cGiclRJGjTqHBPVZqgTiQA_tvGKSQ60',
  partnerCenterUrl: 'https://hibelleharmony.com/#partner-center',
  replyTo: 'hibelle@hibelleconsulting.com',
  roleEmailSecretProperty: 'ROLE_EMAIL_WEBHOOK_SECRET'
};

function doPost(e) {
  const values = e && e.parameter ? e.parameter : {};
  if (values.action === 'role_change') return sendRoleChangeEmail_(values);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty(MEMBER_SIGNUP.propertySpreadsheetId);

    if (!spreadsheetId) {
      throw new Error('MEMBER_SPREADSHEET_ID가 설정되지 않았습니다.');
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(MEMBER_SIGNUP.sheetName) ||
      spreadsheet.insertSheet(MEMBER_SIGNUP.sheetName);
    const headers = [
      '회원 ID', '가입시각', '이름', '이메일',
      '가입방식', '회원구분', '가입경로'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#0d51aa')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }

    const memberId = values['회원 ID'] || '';
    if (memberId && sheet.getLastRow() > 1) {
      const existing = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(memberId)
        .matchEntireCell(true)
        .findNext();
      if (existing) {
        return ContentService
          .createTextOutput(JSON.stringify({
            ok: true,
            memberId,
            duplicate: true
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    sheet.appendRow([
      memberId,
      values['가입 시각'] || new Date().toISOString(),
      values['이름'] || '',
      values['이메일'] || values.email || '',
      values['가입 방식'] || '',
      values['회원 구분'] || '일반회원',
      values['가입 경로'] || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        memberId,
        duplicate: false
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function sendRoleChangeEmail_(values) {
  const expectedSecret = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.roleEmailSecretProperty);
  if (!expectedSecret || String(values.webhook_secret || '') !== expectedSecret) throw new Error('Authorized webhook required.');
  const email = String(values.member_email || '').trim();
  const name = String(values.member_name || '회원').trim();
  const newRole = String(values.new_role || 'member');
  if (!email || !['member', 'partner0', 'partner20', 'partner50'].includes(newRole)) {
    throw new Error('Invalid role notification request.');
  }
  const labels = { member: '미승인 일반회원', partner0: '무료 파트너', partner20: '$20 BASIC 파트너', partner50: '$50 PREMIUM 파트너' };
  const benefits = {
    member: '파트너 신청 검토 전 단계입니다. 신청서를 제출했다면 관리자 승인을 기다려 주세요.',
    partner0: '시작 필수자료, 공지사항과 커뮤니티를 이용할 수 있습니다.',
    partner20: '무료 혜택과 운영·수업·홍보·기관 제출 자료를 이용할 수 있습니다.',
    partner50: '모든 자료와 우선 홍보·추천 노출 신청 혜택을 이용할 수 있습니다.'
  };
  MailApp.sendEmail({
    to: email,
    name: 'Harmony Link',
    replyTo: MEMBER_SIGNUP.replyTo,
    subject: `[Harmony Link] 회원 등급이 ${labels[newRole]}로 변경되었습니다`,
    htmlBody: `<div style="font-family:Arial,'Noto Sans KR',sans-serif;max-width:620px;margin:auto;color:#173552;line-height:1.7"><div style="padding:26px;background:#0b5fc2;color:#fff;border-radius:18px 18px 0 0"><small>HARMONY LINK PARTNER CENTER</small><h1 style="margin:6px 0 0;font-size:23px">파트너 등급 변경 안내</h1></div><div style="padding:27px;border:1px solid #d8e5f3;border-top:0;border-radius:0 0 18px 18px"><p><b>${escapeHtml_(name)}</b>님, 회원 등급이 <b>${labels[newRole]}</b>로 변경되었습니다.</p><div style="padding:16px;background:#eef6ff;border-radius:12px"><b>이용 가능한 혜택</b><br>${benefits[newRole]}</div><ol><li>Harmony Link 홈페이지에서 로그아웃합니다.</li><li>같은 Google 또는 카카오 계정으로 다시 로그인합니다.</li><li>파트너 전용 자료실에서 변경된 등급과 자료를 확인합니다.</li></ol><p><a href="${MEMBER_SIGNUP.partnerCenterUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0b5fc2;color:#fff;text-decoration:none;font-weight:bold">파트너 자료실 열기</a></p><p style="font-size:12px;color:#657b93">등급이나 이용 방법에 궁금한 점이 있으면 ${MEMBER_SIGNUP.replyTo}으로 문의해 주세요.</p></div></div>`
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
