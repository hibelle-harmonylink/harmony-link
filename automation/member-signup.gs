/** Harmony Link 회원가입 명단·확인메일 자동화 */
const MEMBER_SIGNUP = {
  sheetName: '회원가입 명단',
  propertySpreadsheetId: 'MEMBER_SPREADSHEET_ID',
  partnerCenterUrl: 'https://hibelleharmony.com/#partner-center',
  replyTo: 'hibelle@hibelleconsulting.com',
  roleEmailSecretProperty: 'ROLE_EMAIL_WEBHOOK_SECRET'
};

// Columns 9-10 (Premium 여부/활성 상태) are appended after the original
// 8 columns rather than inserted in the middle, so every existing function
// that reads/writes columns 1-8 by fixed position (registerMember_,
// updateMember_, updateIdentityAndMembership_) needed no changes at all.
const HEADERS = ['회원 ID', '가입시각', '이름', '이메일', '가입방식', '회원유형', '파트너등급', '가입경로', 'Premium 여부', '활성 상태'];
const TYPE_LABELS = ['일반회원', '수강생', '입점 파트너', '탈퇴'];
const TIER_LABELS = ['무료 파트너', '$20 베이직 파트너', '$50 프리미엄 파트너'];
const PREMIUM_LABELS = ['Premium 승인', 'Premium 미승인'];
const STATUS_LABELS = ['활성', '중지'];
const ROLE_INFO = {
  member: { type: '일반회원', tier: '', label: '일반회원' },
  partner0: { type: '입점 파트너', tier: '무료 파트너', label: '무료 파트너' },
  partner20: { type: '입점 파트너', tier: '$20 베이직 파트너', label: '$20 베이직 파트너' },
  partner50: { type: '입점 파트너', tier: '$50 프리미엄 파트너', label: '$50 프리미엄 파트너' },
  admin: { type: '관리자', tier: '', label: '관리자' }
};

function doPost(e) {
  try {
    const values = e && e.parameter ? e.parameter : {};
    if (values.action === 'role_change') return sendRoleChangeEmail_(values);
    if (values.action === 'member_type_change') return changeMemberType_(values);
    if (values.action === 'member_withdrawal') return markMemberWithdrawn_(values);
    if (values.action === 'profile_sync') return syncProfile_(values);
    return registerMember_(values);
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function registerMember_(values) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_();
    ensureSchema_(sheet);
    const memberId = text_(values['회원 ID']);
    const email = text_(values['이메일'] || values.email);
    const memberType = normalizeType_(values['회원 유형'] || values['회원 구분']);
    const partnerTier = normalizeTier_(values['파트너 등급']);
    const row = findMemberRow_(sheet, memberId, email);
    const record = [
      memberId,
      values['가입 시각'] || new Date().toISOString(),
      text_(values['이름']),
      email,
      text_(values['가입 방식']),
      memberType,
      partnerTier,
      text_(values['가입 경로'])
    ];
    if (row) updateIdentityAndMembership_(sheet, row, record);
    else sheet.appendRow(record);
    SpreadsheetApp.flush();
    if (!row && email) sendSignupConfirmation_(record);
    return json_({ ok: true, memberId: memberId, duplicate: Boolean(row) });
  } finally {
    lock.releaseLock();
  }
}

function sendSignupConfirmation_(record) {
  const name = record[2] || '회원';
  const email = record[3];
  const memberType = record[5];
  const guidance = memberType === '수강생'
    ? '수강생으로 등록되었습니다. 교육 프로그램을 살펴보고 원하는 수업을 신청하실 수 있습니다.'
    : '일반회원으로 등록되었습니다. Harmony Link의 프로그램과 새로운 소식을 확인하실 수 있습니다.';
  MailApp.sendEmail({
    to: email,
    name: 'Harmony Link',
    replyTo: MEMBER_SIGNUP.replyTo,
    subject: '[Harmony Link] 회원가입이 완료되었습니다',
    body: `${name}님, Harmony Link 회원가입이 완료되었습니다.\n\n회원 유형: ${memberType}\n${guidance}\n\n홈페이지: https://hibelleharmony.com/\n문의: ${MEMBER_SIGNUP.replyTo}`,
    htmlBody: `<div style="font-family:Arial,'Noto Sans KR',sans-serif;max-width:620px;margin:auto;color:#173552;line-height:1.75"><div style="padding:25px;background:#0b5fc2;color:#fff;border-radius:18px 18px 0 0"><small>HARMONY LINK</small><h1 style="margin:6px 0 0;font-size:23px">회원가입 완료 안내</h1></div><div style="padding:27px;border:1px solid #d8e5f3;border-top:0;border-radius:0 0 18px 18px"><p><b>${escapeHtml_(name)}</b>님, 회원가입이 완료되었습니다.</p><div style="padding:16px;background:#eef6ff;border-radius:12px"><b>회원 유형</b><br>${escapeHtml_(memberType)}</div><p>${escapeHtml_(guidance)}</p><p><a href="https://hibelleharmony.com/" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0b5fc2;color:#fff;text-decoration:none;font-weight:bold">Harmony Link 방문하기</a></p><p style="font-size:12px;color:#657b93">문의: ${MEMBER_SIGNUP.replyTo}</p></div></div>`
  });
}

function sendRoleChangeEmail_(values) {
  requireWebhookSecret_(values);
  const email = text_(values.member_email);
  const name = text_(values.member_name) || '회원';
  const role = text_(values.new_role);
  if (!email || !ROLE_INFO[role] || role === 'admin') throw new Error('Invalid role notification request.');
  const info = ROLE_INFO[role];
  if (role === 'member') info.type = normalizeType_(values.member_type);
  updateMember_(values, info.type, info.tier, false);
  const benefits = {
    member: '일반회원 또는 수강생으로 Harmony Link의 프로그램을 이용할 수 있습니다.',
    partner0: '시작 필수자료, 공지사항과 커뮤니티를 이용할 수 있습니다.',
    partner20: '무료 혜택과 운영·수업·홍보·기관 제출 자료를 이용할 수 있습니다.',
    partner50: '모든 자료와 우선 홍보·추천 노출 신청 혜택을 이용할 수 있습니다.'
  };
  MailApp.sendEmail({
    to: email,
    name: 'Harmony Link',
    replyTo: MEMBER_SIGNUP.replyTo,
    subject: `[Harmony Link] 회원 등급이 ${info.label}로 변경되었습니다`,
    body: `${name}님, 회원 등급이 ${info.label}로 변경되었습니다.\n\n회원 유형: ${info.type}\n파트너 등급: ${info.tier}\n${benefits[role]}\n\n변경된 권한은 로그아웃 후 다시 로그인하면 정확히 적용됩니다.\n파트너 자료실: ${MEMBER_SIGNUP.partnerCenterUrl}\n문의: ${MEMBER_SIGNUP.replyTo}`,
    htmlBody: `<div style="font-family:Arial,'Noto Sans KR',sans-serif;max-width:620px;margin:auto;color:#173552;line-height:1.7"><div style="padding:26px;background:#0b5fc2;color:#fff;border-radius:18px 18px 0 0"><small>HARMONY LINK</small><h1 style="margin:6px 0 0;font-size:23px">회원 등급 변경 안내</h1></div><div style="padding:27px;border:1px solid #d8e5f3;border-top:0;border-radius:0 0 18px 18px"><p><b>${escapeHtml_(name)}</b>님, 회원 등급이 <b>${escapeHtml_(info.label)}</b>로 변경되었습니다.</p><div style="padding:16px;background:#eef6ff;border-radius:12px"><b>회원 유형</b> ${escapeHtml_(info.type)}<br><b>파트너 등급</b> ${escapeHtml_(info.tier)}</div><p>${escapeHtml_(benefits[role])}</p><p>변경된 권한은 로그아웃 후 다시 로그인하면 정확히 적용됩니다.</p><p><a href="${MEMBER_SIGNUP.partnerCenterUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0b5fc2;color:#fff;text-decoration:none;font-weight:bold">파트너 자료실 열기</a></p></div></div>`
  });
  return json_({ ok: true });
}

function changeMemberType_(values) {
  requireWebhookSecret_(values);
  const type = normalizeType_(values.member_type);
  if (!['일반회원', '수강생'].includes(type)) throw new Error('Invalid member type.');
  updateMember_(values, type, '', false);
  return json_({ ok: true });
}

function markMemberWithdrawn_(values) {
  requireWebhookSecret_(values);
  updateMember_(values, '탈퇴', '', true);
  return json_({ ok: true });
}

// Admin-panel save sync: updates 회원유형/파트너등급/Premium 여부/활성 상태
// on an EXISTING row only (found by 회원 ID or 이메일) -- never appends a
// new row, since this only ever fires for a member who already exists.
// Columns 1-5 and 8 (identity/가입경로) are left untouched.
function syncProfile_(values) {
  requireWebhookSecret_(values);
  const sheet = getSheet_();
  ensureSchema_(sheet);
  const id = text_(values.member_id);
  const email = text_(values.member_email);
  const row = findMemberRow_(sheet, id, email);
  if (!row) {
    return json_({ ok: false, error: '회원 명단 시트에서 해당 회원 행을 찾지 못해 업데이트하지 못했습니다.' });
  }
  const memberType = normalizeType_(values.member_type);
  const partnerTier = (ROLE_INFO[text_(values.role)] || {}).tier || '';
  const premiumLabel = text_(values.premium) === 'true' ? 'Premium 승인' : 'Premium 미승인';
  const statusLabel = text_(values.account_status) === 'suspended' ? '중지' : '활성';
  sheet.getRange(row, 6, 1, 2).setValues([[memberType, partnerTier]]);
  sheet.getRange(row, 9, 1, 2).setValues([[premiumLabel, statusLabel]]);
  SpreadsheetApp.flush();
  return json_({ ok: true });
}

function updateMember_(values, memberType, partnerTier, withdrawal) {
  const sheet = getSheet_();
  ensureSchema_(sheet);
  const id = text_(values.member_id);
  const email = text_(values.member_email);
  let row = findMemberRow_(sheet, id, email);
  const record = [id, values.member_joined_at || new Date().toISOString(), text_(values.member_name), email, text_(values.member_signup_method), memberType, partnerTier, text_(values.member_signup_path) || (withdrawal ? '회원탈퇴 시 자동 기록' : '회원정보 변경 시 자동 반영')];
  if (!row) {
    sheet.appendRow(record);
    row = sheet.getLastRow();
  } else updateIdentityAndMembership_(sheet, row, record);
  sheet.getRange(row, 6, 1, 2).setValues([[memberType, partnerTier]]);
  SpreadsheetApp.flush();
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.propertySpreadsheetId);
  if (!id) throw new Error('MEMBER_SPREADSHEET_ID가 설정되지 않았습니다.');
  const book = SpreadsheetApp.openById(id);
  return book.getSheetByName(MEMBER_SIGNUP.sheetName) || book.insertSheet(MEMBER_SIGNUP.sheetName);
}

function ensureSchema_(sheet) {
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 8)).getDisplayValues()[0];
  if (current[5] === '회원구분' && current[6] === '가입경로') {
    sheet.insertColumnAfter(6);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    const count = sheet.getLastRow() - 1;
    if (count > 0) {
      const legacy = sheet.getRange(2, 6, count, 1).getDisplayValues();
      const converted = legacy.map(function (row) {
        const info = legacyInfo_(row[0]);
        return [info.type, info.tier];
      });
      sheet.getRange(2, 6, count, 2).setValues(converted);
    }
  } else sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#0d51aa').setFontColor('#ffffff').setFontWeight('bold');
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 6, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TYPE_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, 7, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TIER_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, 9, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PREMIUM_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, 10, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LABELS, true).setAllowInvalid(false).build());
  const usedRows = Math.max(sheet.getLastRow() - 1, 0);
  if (usedRows > 0) {
    const membership = sheet.getRange(2, 6, usedRows, 2).getDisplayValues();
    membership.forEach(function (row, index) {
      if (row[0] === '관리자') sheet.getRange(index + 2, 6, 1, 2).clearDataValidations();
    });
  }
}

function legacyInfo_(value) {
  const label = text_(value);
  if (label === '관리자') return ROLE_INFO.admin;
  if (label === '수강생') return { type: '수강생', tier: '' };
  if (label === '무료 파트너') return ROLE_INFO.partner0;
  if (label === '$20 BASIC 파트너' || label === '베이직회원') return ROLE_INFO.partner20;
  if (label === '$50 PREMIUM 파트너' || label === '프리미엄회원') return ROLE_INFO.partner50;
  if (label === '탈퇴') return { type: '탈퇴', tier: '' };
  return ROLE_INFO.member;
}

function updateIdentityAndMembership_(sheet, row, record) {
  const existing = sheet.getRange(row, 1, 1, 8).getValues()[0];
  for (let column = 0; column < 8; column += 1) {
    if (column === 5 || column === 6 || !existing[column]) sheet.getRange(row, column + 1).setValue(record[column]);
  }
}

function findMemberRow_(sheet, id, email) {
  if (sheet.getLastRow() < 2) return 0;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues();
  const index = rows.findIndex(function (row) { return (id && text_(row[0]) === id) || (email && text_(row[3]).toLowerCase() === email.toLowerCase()); });
  return index < 0 ? 0 : index + 2;
}

function normalizeType_(value) {
  const label = text_(value);
  if (label === 'student' || label === '수강생') return '수강생';
  if (label === 'partner' || label === '입점 파트너') return '입점 파트너';
  return '일반회원';
}

function normalizeTier_(value) {
  const label = text_(value);
  const aliases = { '무료': '무료 파트너', '$20 BASIC': '$20 베이직 파트너', '$50 PREMIUM': '$50 프리미엄 파트너' };
  const normalized = aliases[label] || label;
  return TIER_LABELS.includes(normalized) ? normalized : '';
}

function requireWebhookSecret_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.roleEmailSecretProperty);
  if (!expected || text_(values.webhook_secret) !== expected) throw new Error('Authorized webhook required.');
}

function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function text_(value) { return String(value || '').trim(); }
function escapeHtml_(value) { return text_(value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
function authorizeRoleChangeMail() { return MailApp.getRemainingDailyQuota(); }
