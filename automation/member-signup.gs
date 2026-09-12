/** Harmony Link 회원가입 명단·확인메일 자동화 */
const MEMBER_SIGNUP = {
  sheetName: '회원가입 명단',
  propertySpreadsheetId: 'MEMBER_SPREADSHEET_ID',
  // The Apps Script is the single issuer of HL-YY-NNN. This server endpoint
  // only records that already-issued number against the same Supabase UUID.
  metadataWebhookUrl: 'https://ricndeoiomzjacmrsjtg.supabase.co/functions/v1/notify-role-change',
  partnerCenterUrl: 'https://hibelleharmony.com/#partner-center',
  replyTo: 'hibelle@hibelleconsulting.com',
  roleEmailSecretProperty: 'ROLE_EMAIL_WEBHOOK_SECRET'
};

const HEADERS = ['회원번호', '가입일', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];
const LEGACY_HEADERS = ['회원 ID', '가입시각', '이름', '이메일', '가입방식', '회원유형', '파트너등급', '가입경로'];
const PRE_METADATA_HEADERS = ['회원번호', '가입일', '이름', '이메일', '가입방식', '회원유형', '멤버십', '계정상태', '가입경로', '시스템 ID'];
const COLUMNS = Object.freeze({
  memberNumber: 1,
  joinedAt: 2,
  name: 3,
  email: 4,
  phone: 5,
  signupMethod: 6,
  memberType: 7,
  membership: 8,
  accountStatus: 9,
  specialty: 10,
  teachingSubjects: 11,
  enrolledSubject: 12,
  assignedInstructor: 13,
  signupPath: 14,
  systemId: 15
});
const TYPE_LABELS = ['수강생', '입점 파트너', '관리자'];
const MEMBERSHIP_LABELS = ['FREE', 'BASIC $20', 'PREMIUM $50', '관리자'];
const STATUS_LABELS = ['활성', '중지', '탈퇴'];
const DISPLAY_STYLES = Object.freeze({
  type: {
    '수강생': { background: '#fee2e2', foreground: '#b91c1c' },
    '입점 파트너': { background: '#dbeafe', foreground: '#1d4ed8' },
    '관리자': { background: '#dcfce7', foreground: '#15803d' }
  },
  membership: {
    'FREE': { background: '#f3f4f6', foreground: '#4b5563' },
    'BASIC $20': { background: '#ede9fe', foreground: '#6d28d9' },
    'PREMIUM $50': { background: '#ffedd5', foreground: '#c2410c' },
    '관리자': { background: '#dcfce7', foreground: '#15803d' }
  },
  status: {
    '활성': { background: '#dcfce7', foreground: '#15803d' },
    '중지': { background: '#1f2937', foreground: '#ffffff' },
    '탈퇴': { background: '#e5e7eb', foreground: '#374151' }
  },
  fallback: { background: '#ffffff', foreground: '#1f2937' }
});
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
    if (text_(values.action)) return json_({ ok: false, error: 'Unknown action.' });
    const invalidField = missingRegistrationField_(values);
    if (invalidField) return json_({ ok: false, error: `Missing required registration field: ${invalidField}` });
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
    const membership = membershipLabel_(memberType, values['멤버십'] || values['파트너 등급']);
    const row = findMemberRow_(sheet, memberId, email);
    const joinedAt = dateValue_(values['가입 시각'] || new Date().toISOString());
    const memberNumber = row
      ? text_(sheet.getRange(row, COLUMNS.memberNumber).getDisplayValue())
      : nextMemberNumber_(sheet, joinedAt);
    const record = [
      memberNumber,
      joinedAt,
      text_(values['이름']),
      email,
      text_(values.phone || values.phone_number || values.mobile || values.contact),
      text_(values['가입 방식']),
      memberType,
      membership,
      '활성',
      '', '', '', '',
      text_(values['가입 경로']),
      memberId
    ];
    const isNewRow = !row;
    if (row) updateIdentityAndMembership_(sheet, row, record);
    else sheet.appendRow(record);
    SpreadsheetApp.flush();
    // The Sheet holds the sole issuance lock for member numbers.  Register
    // that exact value in Supabase after it is durable here; retrying this
    // request is safe because the server never replaces an existing number.
    const metadataResult = registerMemberMetadata_(memberId, memberNumber, joinedAt);
    if (!metadataResult.ok) {
      // Preserve only traceable, non-secret identifiers.  The next request
      // finds this same Sheet row and retries this registration with the
      // existing member number instead of issuing another one.
      console.error('Member metadata registration needs retry:', JSON.stringify({ memberId: memberId, memberNumber: memberNumber, status: metadataResult.status || 0 }));
      throw new Error(metadataResult.error || '회원번호 메타데이터 등록에 실패했습니다.');
    }
    if (metadataResult.memberNumber !== memberNumber) throw new Error('회원번호 충돌이 감지되어 등록을 중단했습니다.');
    if (isNewRow && email) sendSignupConfirmation_(record);
    return json_({ ok: true, memberId: memberId, memberNumber: memberNumber, duplicate: Boolean(row) });
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

// Admin-panel save sync: updates only the mutable display fields.
// on an EXISTING row only (found by 회원 ID or 이메일) -- never appends a
// new row, since this only ever fires for a member who already exists.
// 회원번호/가입일/가입경로/시스템 ID are immutable in this path.
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
  // Profile sync must not accept the protected database `role` as a mutable
  // field. The Edge Function sends the already-derived roster tier under the
  // explicit partner_tier key instead. Keep the role fallback temporarily so
  // an older deployed function cannot break the roster during rollout.
  const membership = membershipLabel_(memberType, values.membership || values.partner_tier || values.role);
  const statusLabel = statusLabel_(values.account_status);
  sheet.getRange(row, COLUMNS.memberType, 1, 3).setValues([[memberType, membership, statusLabel]]);
  sheet.getRange(row, COLUMNS.phone, 1, 1).setValues([[text_(values.phone)]]);
  sheet.getRange(row, COLUMNS.specialty, 1, 4).setValues([[
    text_(values.specialty), text_(values.teaching_subjects),
    text_(values.enrolled_subject), text_(values.assigned_instructor)
  ]]);
  applyRosterDisplayStyles_(sheet, row, 1);
  SpreadsheetApp.flush();
  return json_({ ok: true });
}

function updateMember_(values, memberType, partnerTier, withdrawal) {
  const sheet = getSheet_();
  ensureSchema_(sheet);
  const id = text_(values.member_id);
  const email = text_(values.member_email);
  let row = findMemberRow_(sheet, id, email);
  const joinedAt = dateValue_(values.member_joined_at || new Date().toISOString());
  const memberNumber = row
    ? text_(sheet.getRange(row, COLUMNS.memberNumber).getDisplayValue())
    : nextMemberNumber_(sheet, joinedAt);
  const displayType = withdrawal ? normalizeType_(memberType) : normalizeType_(memberType);
  const membership = membershipLabel_(displayType, partnerTier);
  const record = [memberNumber, joinedAt, text_(values.member_name), email, text_(values.phone), text_(values.member_signup_method), displayType, membership, withdrawal ? '탈퇴' : '활성', text_(values.specialty), text_(values.teaching_subjects), text_(values.enrolled_subject), text_(values.assigned_instructor), text_(values.member_signup_path) || (withdrawal ? '회원탈퇴 시 자동 기록' : '회원정보 변경 시 자동 반영'), id];
  if (!row) {
    sheet.appendRow(record);
    row = sheet.getLastRow();
  } else updateIdentityAndMembership_(sheet, row, record);
  sheet.getRange(row, COLUMNS.memberType, 1, 3).setValues([[displayType, membership, withdrawal ? '탈퇴' : '활성']]);
  applyRosterDisplayStyles_(sheet, row, 1);
  SpreadsheetApp.flush();
}

// Reapply all three display styles from the values that are now in the row.
// This deliberately replaces the previous fill/font color so an old
// student/partner/membership/status color cannot linger after a change.
function applyRosterDisplayStyles_(sheet, startRow, rowCount) {
  if (!rowCount) return;
  const values = sheet.getRange(startRow, COLUMNS.memberType, rowCount, 3).getDisplayValues();
  ['type', 'membership', 'status'].forEach(function (category, index) {
    const styles = values.map(function (row) {
      return DISPLAY_STYLES[category][text_(row[index])] || DISPLAY_STYLES.fallback;
    });
    const target = sheet.getRange(startRow, COLUMNS.memberType + index, rowCount, 1);
    target.setBackgrounds(styles.map(function (style) { return [style.background]; }));
    target.setFontColors(styles.map(function (style) { return [style.foreground]; }));
    target.setFontWeights(styles.map(function () { return ['bold']; }));
  });
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.propertySpreadsheetId);
  if (!id) throw new Error('MEMBER_SPREADSHEET_ID가 설정되지 않았습니다.');
  const book = SpreadsheetApp.openById(id);
  return book.getSheetByName(MEMBER_SIGNUP.sheetName) || book.insertSheet(MEMBER_SIGNUP.sheetName);
}

function ensureSchema_(sheet) {
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getDisplayValues()[0];
  if (current[0] === LEGACY_HEADERS[0]) migrateLegacySchema_(sheet);
  else if (PRE_METADATA_HEADERS.every(function (header, index) { return current[index] === header; })) migratePreMetadataSchema_(sheet);
  else sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#0d51aa').setFontColor('#ffffff').setFontWeight('bold');
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, COLUMNS.memberType, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TYPE_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, COLUMNS.membership, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MEMBERSHIP_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, COLUMNS.accountStatus, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, COLUMNS.joinedAt, rows, 1).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(2, COLUMNS.memberNumber, rows, 1).setHorizontalAlignment('center');
  sheet.getRange(2, COLUMNS.email, rows, 1).setHorizontalAlignment('left');
  applyRosterDisplayStyles_(sheet, 2, Math.max(sheet.getLastRow() - 1, 0));
  sheet.hideColumns(COLUMNS.systemId);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), HEADERS.length).createFilter();
}

function migrateLegacySchema_(sheet) {
  const count = Math.max(sheet.getLastRow() - 1, 0);
  const legacyRows = count ? sheet.getRange(2, 1, count, Math.max(sheet.getLastColumn(), 10)).getDisplayValues() : [];
  const migrated = buildMigratedRows_(legacyRows);
  if (sheet.getFilter()) sheet.getFilter().remove();
  if (count) sheet.getRange(2, 1, count, Math.max(sheet.getLastColumn(), HEADERS.length)).clearContent();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (migrated.length) sheet.getRange(2, 1, migrated.length, HEADERS.length).setValues(migrated);
  const removedRows = count - migrated.length;
  if (removedRows > 0) sheet.deleteRows(2 + migrated.length, removedRows);
}

function registerMemberMetadata_(memberId, memberNumber, joinedAt) {
  const secret = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.roleEmailSecretProperty);
  if (!secret) throw new Error('ROLE_EMAIL_WEBHOOK_SECRET이 설정되지 않았습니다.');
  const response = UrlFetchApp.fetch(MEMBER_SIGNUP.metadataWebhookUrl, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      action: 'member_metadata_register', webhookSecret: secret,
      memberId: memberId, memberNumber: memberNumber,
      joinedAt: dateValue_(joinedAt).toISOString()
    })
  });
  const status = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (_) { body = {}; }
  if (status < 200 || status >= 300 || body.ok !== true) {
    return { ok: false, status: status, error: body.error || `회원번호 메타데이터 등록 실패 (${status})` };
  }
  return { ok: true, memberNumber: text_(body.memberNumber) };
}

// Adds management-only columns without altering the existing identity,
// member-number, or join-date values.  This is run once when the 10-column
// roster is first opened by the updated deployed script.
function migratePreMetadataSchema_(sheet) {
  const count = Math.max(sheet.getLastRow() - 1, 0);
  const rows = count ? sheet.getRange(2, 1, count, PRE_METADATA_HEADERS.length).getValues() : [];
  const expanded = rows.map(function (row) {
    // Existing roster timestamps may be stored as display strings.  Convert
    // only a parseable value back to a Date so the yyyy-mm-dd number format
    // changes presentation without discarding the timestamp moment.
    const joinedAt = text_(row[1]) ? dateValue_(row[1]) : row[1];
    return [row[0], joinedAt, row[2], row[3], '', row[4], row[5], row[6], row[7], '', '', '', '', row[8], row[9]];
  });
  if (sheet.getFilter()) sheet.getFilter().remove();
  if (count) sheet.getRange(2, 1, count, Math.max(sheet.getLastColumn(), HEADERS.length)).clearContent();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (expanded.length) sheet.getRange(2, 1, expanded.length, HEADERS.length).setValues(expanded);
}

function buildMigratedRows_(legacyRows) {
  const seenIdentities = {};
  const actualRows = legacyRows.filter(function (row) {
    return text_(row[0]) || text_(row[2]) || text_(row[3]);
  }).filter(function (row) {
    const identity = text_(row[0]) || text_(row[3]).toLowerCase();
    if (!identity || seenIdentities[identity]) return false;
    seenIdentities[identity] = true;
    return true;
  }).sort(function (left, right) {
    return new Date(left[1]).getTime() - new Date(right[1]).getTime();
  });
  const sequenceByYear = {};
  return actualRows.map(function (row) {
    const joinedAt = dateValue_(row[1]);
    const year = String(joinedAt.getFullYear()).slice(-2);
    sequenceByYear[year] = (sequenceByYear[year] || 0) + 1;
    const legacy = legacyInfo_(row[5] || row[6]);
    const withdrawn = text_(row[5]) === '탈퇴';
    const memberType = withdrawn ? '수강생' : normalizeType_(legacy.type);
    return [
      formatMemberNumber_(year, sequenceByYear[year]),
      joinedAt,
      text_(row[2]),
      text_(row[3]),
      '',
      text_(row[4]),
      memberType,
      membershipLabel_(memberType, row[6]),
      withdrawn ? '탈퇴' : statusLabel_(row[9]),
      '', '', '', '',
      text_(row[7]),
      text_(row[0])
    ];
  });
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
  const existing = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  for (let column = 0; column < HEADERS.length; column += 1) {
    const immutable = [COLUMNS.memberNumber - 1, COLUMNS.joinedAt - 1, COLUMNS.systemId - 1].includes(column);
    if (!immutable && ([COLUMNS.memberType - 1, COLUMNS.membership - 1, COLUMNS.accountStatus - 1].includes(column) || !existing[column])) {
      sheet.getRange(row, column + 1).setValue(record[column]);
    }
  }
}

function findMemberRow_(sheet, id, email) {
  if (sheet.getLastRow() < 2) return 0;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getDisplayValues();
  const index = rows.findIndex(function (row) { return (id && text_(row[COLUMNS.systemId - 1]) === id) || (email && text_(row[COLUMNS.email - 1]).toLowerCase() === email.toLowerCase()); });
  return index < 0 ? 0 : index + 2;
}

function normalizeType_(value) {
  const label = text_(value);
  if (label === 'student' || label === '수강생') return '수강생';
  if (label === 'partner' || label === '입점 파트너') return '입점 파트너';
  if (label === 'admin' || label === '관리자') return '관리자';
  return '수강생';
}

function membershipLabel_(memberType, value) {
  if (memberType === '관리자') return '관리자';
  if (memberType !== '입점 파트너') return 'FREE';
  const label = text_(value);
  if (['premium', 'partner50', '$50 프리미엄 파트너', '$50 PREMIUM 파트너', 'PREMIUM $50'].includes(label)) return 'PREMIUM $50';
  if (['basic', 'partner20', '$20 베이직 파트너', '$20 BASIC 파트너', 'BASIC $20'].includes(label)) return 'BASIC $20';
  return 'FREE';
}

function statusLabel_(value) {
  const status = text_(value).toLowerCase();
  if (status === 'withdrawn' || status === '탈퇴') return '탈퇴';
  if (status === 'suspended' || status === '중지') return '중지';
  return '활성';
}

function missingRegistrationField_(values) {
  if (!text_(values['회원 ID'])) return '회원 ID';
  if (!text_(values['이메일'] || values.email)) return '이메일';
  if (!text_(values['이름'])) return '이름';
  return '';
}

function nextMemberNumber_(sheet, joinedAt) {
  const year = String(dateValue_(joinedAt).getFullYear()).slice(-2);
  if (sheet.getLastRow() < 2) return formatMemberNumber_(year, 1);
  const values = sheet.getRange(2, COLUMNS.memberNumber, sheet.getLastRow() - 1, 1).getDisplayValues();
  const prefix = `HL-${year}-`;
  const max = values.reduce(function (highest, row) {
    const value = text_(row[0]);
    if (value.indexOf(prefix) !== 0) return highest;
    const sequence = Number(value.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  return formatMemberNumber_(year, max + 1);
}

function formatMemberNumber_(year, sequence) {
  return `HL-${year}-${String(sequence).padStart(3, '0')}`;
}

function dateValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  const parsed = new Date(value || new Date().toISOString());
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function requireWebhookSecret_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.roleEmailSecretProperty);
  if (!expected || text_(values.webhook_secret) !== expected) throw new Error('Authorized webhook required.');
}

function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function text_(value) { return String(value || '').trim(); }
function escapeHtml_(value) { return text_(value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
function authorizeRoleChangeMail() { return MailApp.getRemainingDailyQuota(); }
