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

const HEADERS = ['회원번호', '가입일', '닉네임/업체명', '한글 이름', '영문 이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];
const LEGACY_HEADERS = ['회원 ID', '가입시각', '이름', '이메일', '가입방식', '회원유형', '파트너등급', '가입경로'];
const PRE_METADATA_HEADERS = ['회원번호', '가입일', '이름', '이메일', '가입방식', '회원유형', '멤버십', '계정상태', '가입경로', '시스템 ID'];
const PRE_IDENTITY_HEADERS = ['회원번호', '가입일', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];
// The live roster before this migration.  Keep this explicit map so a newly
// deployed script never shifts an existing row until an administrator runs
// migrateRosterNameColumns() deliberately.
const PRE_NAME_COLUMNS_HEADERS = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];
// This is the actual Production roster backup layout. It has no 가입경로
// column, so 시스템 ID is column 15 rather than column 16.
const PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '시스템 ID'];
// A failed historical migration can leave this exact recoverable 17-column
// shape: the legacy 가입경로 header is present twice and 시스템 ID is last.
// The first 가입경로 is canonical Production data; only the second duplicate
// column must be empty for every row before it can be removed.
const PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH_HEADERS = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '가입경로', '시스템 ID'];
const COLUMNS = Object.freeze({
  memberNumber: 1,
  joinedAt: 2,
  nickname: 3, displayName: 4, fullName: 5, email: 6, phone: 7, signupMethod: 8,
  memberType: 9, membership: 10, accountStatus: 11, specialty: 12,
  teachingSubjects: 13, enrolledSubject: 14, assignedInstructor: 15,
  signupPath: 16, systemId: 17
});
const PRE_NAME_COLUMNS = Object.freeze({
  memberNumber: 1,
  joinedAt: 2,
  nickname: 3, displayName: 0, fullName: 4, email: 5, phone: 6, signupMethod: 7,
  memberType: 8, membership: 9, accountStatus: 10, specialty: 11,
  teachingSubjects: 12, enrolledSubject: 13, assignedInstructor: 14,
  signupPath: 15, systemId: 16
});
const PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH = Object.freeze({
  memberNumber: 1,
  joinedAt: 2,
  nickname: 3, displayName: 0, fullName: 4, email: 5, phone: 6, signupMethod: 7,
  memberType: 8, membership: 9, accountStatus: 10, specialty: 11,
  teachingSubjects: 12, enrolledSubject: 13, assignedInstructor: 14,
  signupPath: 0, systemId: 15
});
const PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH = Object.freeze({
  memberNumber: 1,
  joinedAt: 2,
  nickname: 3, displayName: 0, fullName: 4, email: 5, phone: 6, signupMethod: 7,
  memberType: 8, membership: 9, accountStatus: 10, specialty: 11,
  teachingSubjects: 12, enrolledSubject: 13, assignedInstructor: 14,
  signupPath: 15, duplicateSignupPath: 16, systemId: 17
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
    // A later Google Form application may only have the member email.  It is
    // allowed only when it carries application details; registerMember_ then
    // requires an existing UUID-backed Sheet row before updating anything.
    if (invalidField && !(invalidField === '회원 ID' && isSupplementalApplication_(values) && text_(values['이메일'] || values.email))) {
      return json_({ ok: false, error: `Missing required registration field: ${invalidField}` });
    }
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
    const columns = ensureSchema_(sheet);
    let memberId = text_(values['회원 ID']);
    const email = text_(values['이메일'] || values.email);
    const memberType = normalizeType_(values['회원 유형'] || values['회원 구분']);
    const membership = membershipLabel_(memberType, values['멤버십'] || values['파트너 등급']);
    let row = findMemberRow_(sheet, memberId, email, columns);
    const isSupplementalApplication = isSupplementalApplication_(values);
    if (row && !memberId) memberId = text_(sheet.getRange(row, columns.systemId).getDisplayValue());
    if (!memberId) throw new Error('회원 ID가 없는 신청서는 기존 이메일 회원과만 연결할 수 있습니다.');
    if (!row && isSupplementalApplication) throw new Error('신청서 이메일과 일치하는 기존 회원을 찾지 못했습니다.');
    const joinedAt = dateValue_(values['가입 시각'] || new Date().toISOString());
    const memberNumber = row
      ? text_(sheet.getRange(row, columns.memberNumber).getDisplayValue())
      : nextMemberNumber_(sheet, joinedAt, columns);
    const record = rosterRecord_(columns, {
      memberNumber: memberNumber,
      joinedAt: joinedAt,
      nickname: values.nickname || values['닉네임'],
      // Only an explicit canonical/administrator Korean-name value is a
      // display-name source. Provider/OAuth "표시 이름" is not guessed.
      displayName: values.display_name || values['한글 이름'],
      fullName: values.full_name || values['이름'],
      email: email,
      phone: formatPhone_(applicationValue_(values, 'phone', '연락처')),
      signupMethod: values['가입 방식'],
      memberType: memberType,
      membership: membership,
      accountStatus: '활성',
      specialty: applicationValue_(values, 'specialty', '전문분야'),
      teachingSubjects: applicationValue_(values, 'teaching_subjects', '강의과목'),
      enrolledSubject: applicationValue_(values, 'enrolled_subject', '수강과목'),
      assignedInstructor: applicationValue_(values, 'assigned_instructor', '담당강사'),
      signupPath: values['가입 경로'],
      systemId: memberId
    });
    const isNewRow = !row;
    if (row && isSupplementalApplication) updateExistingApplication_(sheet, row, record, columns);
    // A repeated site login is a registration retry only.  It must not reset
    // type, membership, account status, or any archived member record.
    else if (!row) sheet.appendRow(record);
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
    if (isSupplementalApplication) {
      const applicationResult = syncApplicationMetadata_(memberId, record, columns);
      if (!applicationResult.ok) throw new Error(applicationResult.error || '신청서 메타데이터 동기화에 실패했습니다.');
    }
    if (isNewRow && email) sendSignupConfirmation_(record, columns);
    return json_({ ok: true, memberId: memberId, memberNumber: memberNumber, duplicate: Boolean(row) });
  } finally {
    lock.releaseLock();
  }
}

// An application is intentionally distinguished from the site signup by
// fields that OAuth signup never supplies.  Identity-only provider data does
// not turn the pending member number black.
function isSupplementalApplication_(values) {
  return ['phone', 'phone_number', 'mobile', 'contact', '연락처', 'specialty', '전문분야', 'teaching_subjects', '강의과목', 'enrolled_subject', '수강과목', 'assigned_instructor', '담당강사']
    .some(function (field) { return Boolean(text_(values[field])); });
}

function applicationValue_(values, canonical, korean) {
  const aliases = {
    phone: ['phone', 'phone_number', 'mobile', 'contact'],
    specialty: ['specialty'],
    teaching_subjects: ['teaching_subjects'],
    enrolled_subject: ['enrolled_subject'],
    assigned_instructor: ['assigned_instructor']
  };
  const keys = (aliases[canonical] || [canonical]).concat(korean ? [korean] : []);
  for (let index = 0; index < keys.length; index += 1) {
    const value = text_(values[keys[index]]);
    if (value) return value;
  }
  return '';
}

function sendSignupConfirmation_(record, columns) {
  const name = record[columns.displayName - 1] || record[columns.fullName - 1] || record[columns.nickname - 1] || '회원';
  const email = record[columns.email - 1];
  const memberType = record[columns.memberType - 1];
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
  const columns = ensureSchema_(sheet);
  const id = text_(values.member_id);
  const email = text_(values.member_email);
  const row = findMemberRow_(sheet, id, email, columns);
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
  // Older profile-sync callers do not yet send the identity fields. Preserve
  // their existing roster values until the identity-aware caller is deployed.
  if (Object.prototype.hasOwnProperty.call(values, 'nickname')) {
    sheet.getRange(row, columns.nickname, 1, 1).setValue(text_(values.nickname));
  }
  if (Object.prototype.hasOwnProperty.call(values, 'full_name')) {
    sheet.getRange(row, columns.fullName, 1, 1).setValue(text_(values.full_name));
  }
  sheet.getRange(row, columns.memberType, 1, 3).setValues([[memberType, membership, statusLabel]]);
  sheet.getRange(row, columns.phone, 1, 1).setValues([[formatPhone_(values.phone)]]);
  sheet.getRange(row, columns.specialty, 1, 4).setValues([[
    text_(values.specialty), text_(values.teaching_subjects),
    text_(values.enrolled_subject), text_(values.assigned_instructor)
  ]]);
  applyRosterDisplayStyles_(sheet, row, 1, columns);
  SpreadsheetApp.flush();
  return json_({ ok: true });
}

function updateMember_(values, memberType, partnerTier, withdrawal) {
  const sheet = getSheet_();
  const columns = ensureSchema_(sheet);
  const id = text_(values.member_id);
  const email = text_(values.member_email);
  let row = findMemberRow_(sheet, id, email, columns);
  const joinedAt = dateValue_(values.member_joined_at || new Date().toISOString());
  const memberNumber = row
    ? text_(sheet.getRange(row, columns.memberNumber).getDisplayValue())
      : nextMemberNumber_(sheet, joinedAt, columns);
  const displayType = withdrawal ? normalizeType_(memberType) : normalizeType_(memberType);
  const membership = membershipLabel_(displayType, partnerTier);
  const record = rosterRecord_(columns, {
    memberNumber: memberNumber, joinedAt: joinedAt, nickname: values.nickname,
    displayName: values.display_name, fullName: values.full_name, email: email,
    phone: formatPhone_(values.phone), signupMethod: values.member_signup_method,
    memberType: displayType, membership: membership, accountStatus: withdrawal ? '탈퇴' : '활성',
    specialty: values.specialty, teachingSubjects: values.teaching_subjects,
    enrolledSubject: values.enrolled_subject, assignedInstructor: values.assigned_instructor,
    signupPath: values.member_signup_path || (withdrawal ? '회원탈퇴 시 자동 기록' : '회원정보 변경 시 자동 반영'), systemId: id
  });
  if (!row) {
    sheet.appendRow(record);
    row = sheet.getLastRow();
  } else updateIdentityAndMembership_(sheet, row, record, columns);
  sheet.getRange(row, columns.memberType, 1, 3).setValues([[displayType, membership, withdrawal ? '탈퇴' : '활성']]);
  applyRosterDisplayStyles_(sheet, row, 1, columns);
  SpreadsheetApp.flush();
}

// Reapply all three display styles from the values that are now in the row.
// This deliberately replaces the previous fill/font color so an old
// student/partner/membership/status color cannot linger after a change.
function applyRosterDisplayStyles_(sheet, startRow, rowCount, columns) {
  if (!rowCount) return;
  const map = columns || columnMap_(sheet);
  const values = sheet.getRange(startRow, map.memberType, rowCount, 3).getDisplayValues();
  ['type', 'membership', 'status'].forEach(function (category, index) {
    const styles = values.map(function (row) {
      return DISPLAY_STYLES[category][text_(row[index])] || DISPLAY_STYLES.fallback;
    });
    const target = sheet.getRange(startRow, map.memberType + index, rowCount, 1);
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

// Public, read-only diagnostic for the manual migration.  Unlike getSheet_(),
// this never creates a missing sheet, applies schema formatting, or invokes a
// migration.  Run it from the Apps Script function picker to capture the
// exact live header values before changing any Production data.
function inspectRosterSchema() {
  const sheet = getExistingRosterSheet_();
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  const headers = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0] : [];
  const rows = lastRow > 1 && lastColumn ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getDisplayValues() : [];
  const candidates = rosterSchemaCandidates_();
  const diagnostics = candidates.map(function (candidate) {
    const trailingColumns = rosterTrailingColumnDiagnostics_(headers, rows, candidate.headers.length);
    const headerMatches = schemaHeadersMatch_(headers, candidate.headers);
    const trailingBlank = trailingColumns.every(function (column) {
      return !column.headerTrimmed && column.nonEmptyRowCount === 0;
    });
    return {
      id: candidate.id,
      logicalLastColumn: candidate.headers.length,
      headerMatches: headerMatches,
      trailingColumns: trailingColumns,
      eligible: headerMatches && trailingBlank,
      firstDifference: headerMatches ? firstTrailingColumnDifference_(trailingColumns) : firstRosterHeaderDifference_(headers, candidate.headers)
    };
  });
  const matches = diagnostics.filter(function (diagnostic) { return diagnostic.eligible; });
  const closest = matches.length ? matches[0] : diagnostics.slice().sort(function (left, right) {
    if (left.headerMatches !== right.headerMatches) return left.headerMatches ? -1 : 1;
    return firstDifferenceIndex_(left.firstDifference) - firstDifferenceIndex_(right.firstDifference);
  })[0];
  const ignoredTrailingColumns = matches.length ? closest.trailingColumns.map(function (column) {
    return column.index;
  }) : [];
  const report = {
    sheetName: sheet.getName(),
    physicalLastColumn: lastColumn,
    logicalLastColumn: matches.length ? closest.logicalLastColumn : null,
    // Keep the earlier field for scripts that already consume this diagnostic.
    lastColumn: lastColumn,
    rowCount: rows.length,
    headers: headers.map(function (value, index) {
      return { index: index + 1, value: value, trimmed: String(value).trim(), codePoints: headerCodePoints_(value) };
    }),
    trailingBlankColumns: trailingBlankColumnCount_(headers),
    ignoredTrailingColumns: ignoredTrailingColumns,
    detectedSchema: matches.length ? closest.id : 'unsupported',
    supportedSchemas: candidates.map(function (candidate) {
      return { id: candidate.id, headers: candidate.headers.slice() };
    }),
    firstDifference: matches.length ? null : closest.firstDifference,
    schemaDifferences: diagnostics
  };
  Logger.log(JSON.stringify(report));
  return report;
}

function getExistingRosterSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.propertySpreadsheetId);
  if (!id) throw new Error('MEMBER_SPREADSHEET_ID가 설정되지 않았습니다.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(MEMBER_SIGNUP.sheetName);
  if (!sheet) throw new Error('회원가입 명단 Sheet를 찾지 못했습니다.');
  return sheet;
}

function rosterSchemaCandidates_() {
  return [
    { id: 'legacy-15-without-signup-path', headers: PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS },
    { id: 'legacy-16-with-signup-path', headers: PRE_NAME_COLUMNS_HEADERS },
    { id: 'recoverable-17-duplicate-signup-path', headers: PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH_HEADERS },
    { id: 'final-17', headers: HEADERS }
  ];
}

function trailingHeadersAreBlank_(headers, logicalWidth) {
  return headers.slice(logicalWidth).every(function (value) { return !text_(value); });
}

function rosterTrailingColumnDiagnostics_(headers, rows, logicalWidth) {
  return headers.slice(logicalWidth).map(function (header, offset) {
    const index = logicalWidth + offset;
    const nonEmptyRows = rows.reduce(function (matches, row, rowOffset) {
      const value = row[index] || '';
      if (text_(value)) matches.push({ row: rowOffset + 2, value: value, trimmed: String(value).trim() });
      return matches;
    }, []);
    return {
      index: index + 1,
      header: header,
      headerTrimmed: String(header).trim(),
      nonEmptyRowCount: nonEmptyRows.length,
      nonEmptyRows: nonEmptyRows
    };
  });
}

function trailingBlankColumnCount_(headers) {
  let count = 0;
  for (let index = headers.length - 1; index >= 0 && !text_(headers[index]); index -= 1) count += 1;
  return count;
}

function firstRosterHeaderDifference_(headers, expected) {
  const width = Math.max(headers.length, expected.length);
  for (let index = 0; index < width; index += 1) {
    const actual = index < headers.length ? headers[index] : '';
    const wanted = index < expected.length ? expected[index] : '';
    if (actual !== wanted) {
      return { column: index + 1, expected: wanted, actual: actual, actualTrimmed: String(actual).trim() };
    }
  }
  return null;
}

function firstTrailingColumnDifference_(columns) {
  const column = columns.find(function (entry) {
    return entry.headerTrimmed || entry.nonEmptyRowCount;
  });
  if (!column) return null;
  return {
    column: column.index,
    expected: '',
    actual: column.header,
    actualTrimmed: column.headerTrimmed,
    nonEmptyRowCount: column.nonEmptyRowCount,
    nonEmptyRows: column.nonEmptyRows
  };
}

function headerCodePoints_(value) {
  return Array.from(String(value)).map(function (character) {
    return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
  });
}

function firstDifferenceIndex_(difference) {
  return difference ? difference.column : Number.MAX_SAFE_INTEGER;
}

function ensureSchema_(sheet) {
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getDisplayValues()[0];
  let columns;
  if (current[0] === LEGACY_HEADERS[0]) migrateLegacySchema_(sheet);
  else if (PRE_METADATA_HEADERS.every(function (header, index) { return current[index] === header; })) migratePreMetadataSchema_(sheet);
  else if (PRE_IDENTITY_HEADERS.every(function (header, index) { return current[index] === header; })) migratePreIdentitySchema_(sheet);
  // Do not convert the live 16-column roster implicitly.  A manual, public
  // migration preserves every existing name value before inserting the new
  // Korean-name column.
  else if (headersMatch_(current, PRE_NAME_COLUMNS_HEADERS)) columns = PRE_NAME_COLUMNS;
  else if (headersMatch_(current, PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS)) columns = PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH;
  else if (!headersMatch_(current, HEADERS)) throw new Error('알 수 없는 회원가입 명단 헤더 구조입니다. 수동 migration 전에 중단했습니다.');
  if (!columns) columns = COLUMNS;
  sheet.setFrozenRows(1);
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  const width = columnWidth_(columns);
  sheet.getRange(1, 1, 1, width).setBackground('#0d51aa').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange(2, columns.memberType, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TYPE_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, columns.membership, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MEMBERSHIP_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, columns.accountStatus, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(1, 1, 1, width).setHorizontalAlignment('left');
  sheet.getRange(1, columns.memberNumber, 1, 2).setHorizontalAlignment('center');
  sheet.getRange(2, columns.memberNumber, rows, 1).setHorizontalAlignment('center').setFontWeight('bold');
  sheet.getRange(2, columns.joinedAt, rows, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
  sheet.getRange(2, columns.nickname, rows, width - columns.nickname + 1).setHorizontalAlignment('left');
  applyRosterDisplayStyles_(sheet, 2, Math.max(sheet.getLastRow() - 1, 0), columns);
  sheet.hideColumns(columns.systemId);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), width).createFilter();
  return columns;
}

function headersMatch_(current, expected) {
  return expected.every(function (header, index) { return current[index] === header; });
}

// The manual migration may accept ordinary leading/trailing header whitespace
// without editing the source header first.  This intentionally does not erase
// or normalize zero-width characters; inspectRosterSchema() reports them via
// the raw value and Unicode code points for an explicit administrator decision.
function schemaHeadersMatch_(current, expected) {
  return expected.every(function (header, index) {
    return text_(current[index]) === text_(header);
  });
}

function columnMap_(sheet) {
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getDisplayValues()[0];
  if (headersMatch_(current, HEADERS)) return COLUMNS;
  if (headersMatch_(current, PRE_NAME_COLUMNS_HEADERS)) return PRE_NAME_COLUMNS;
  if (headersMatch_(current, PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS)) return PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH;
  throw new Error('알 수 없는 회원가입 명단 헤더 구조입니다.');
}

function columnWidth_(columns) {
  if (columns === PRE_NAME_COLUMNS) return PRE_NAME_COLUMNS_HEADERS.length;
  if (columns === PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH) return PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS.length;
  return HEADERS.length;
}

// Public, intentionally manual migration entry point. Its complete preflight
// happens before any Sheet mutation, so an unexpected Production schema never
// leaves a partially rewritten header or data range behind.
function migrateRosterNameColumns() {
  const sheet = getSheet_();
  const plan = preflightRosterNameColumns_(sheet);
  if (plan.noOp) return { migrated: false, rows: 0 };
  writeRosterNameColumns_(sheet, plan);
  applyFinalRosterSchemaFormatting_(sheet);
  return { migrated: true, rows: plan.rows.length };
}

function preflightRosterNameColumns_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  if (schemaHeadersMatch_(headers, HEADERS)) {
    validateRosterTrailingColumns_(headers, HEADERS.length);
    return { noOp: true, rows: [] };
  }
  const schema = legacyRosterSchema_(headers);
  if (!schema) throw new Error('회원가입 명단 헤더가 지원하는 legacy schema와 일치하지 않습니다.');
  validateRosterTrailingColumns_(headers, schema.headers.length);
  const rowCount = Math.max(lastRow - 1, 0);
  const rawRows = rowCount ? sheet.getRange(2, 1, rowCount, lastColumn).getValues() : [];
  validateLegacyRosterRows_(rawRows, schema.headers.length);
  // getLastColumn() includes columns that were previously formatted or
  // inserted, even if their header and every cell are blank.  Those empty
  // trailing columns are not part of the named legacy schema.  Read and
  // validate them first, then use only the verified logical roster width.
  const rows = normalizeLegacyRosterRows_(rawRows, schema);
  const memberNumbers = {};
  rows.forEach(function (row) {
    const memberNumber = text_(row[schema.columns.memberNumber - 1]);
    if (memberNumber && memberNumbers[memberNumber]) throw new Error('중복 회원번호가 있어 migration을 중단했습니다.');
    if (memberNumber) memberNumbers[memberNumber] = true;
  });
  return {
    noOp: false,
    schema: schema,
    headers: headers,
    rows: previewRosterNameColumns_(rows, schema.columns),
    // One rectangular write keeps header and all data rows together.
    matrix: [HEADERS].concat(previewRosterNameColumns_(rows, schema.columns))
  };
}

function legacyRosterSchema_(headers) {
  if (schemaHeadersMatch_(headers, PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH_HEADERS)) {
    return {
      headers: PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH_HEADERS,
      columns: PRE_NAME_COLUMNS,
      sourceColumns: PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH
    };
  }
  if (schemaHeadersMatch_(headers, PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS)) {
    return { headers: PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS, columns: PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH, sourceColumns: PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH };
  }
  if (schemaHeadersMatch_(headers, PRE_NAME_COLUMNS_HEADERS)) {
    return { headers: PRE_NAME_COLUMNS_HEADERS, columns: PRE_NAME_COLUMNS, sourceColumns: PRE_NAME_COLUMNS };
  }
  return null;
}

function normalizeLegacyRosterRows_(rows, schema) {
  if (schema.sourceColumns !== PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH) {
    return rows.map(function (row) { return row.slice(0, schema.headers.length); });
  }
  return rows.map(function (row, index) {
    const first = row[PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH.signupPath - 1];
    const second = row[PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH.duplicateSignupPath - 1];
    if (text_(second)) {
      throw new Error(`중복 가입경로 열에 값이 있어 migration을 중단했습니다 (행 ${index + 2}).`);
    }
    return row.slice(0, 15).concat([row[PRE_NAME_COLUMNS_WITH_DUPLICATE_SIGNUP_PATH.systemId - 1]]);
  });
}

function validateLegacyRosterRows_(rows, expectedWidth) {
  rows.forEach(function (row) {
    if (!Array.isArray(row) || row.length < expectedWidth) throw new Error('회원가입 명단 데이터 행 폭이 header와 일치하지 않습니다.');
    if (row.slice(expectedWidth).some(function (value) { return text_(value); })) {
      throw new Error('회원가입 명단에 legacy schema 밖의 데이터가 있어 migration을 중단했습니다.');
    }
  });
}

function validateRosterTrailingColumns_(headers, expectedWidth) {
  if (headers.slice(expectedWidth).some(function (header) { return text_(header); })) {
    throw new Error('회원가입 명단 header에 지원 schema 밖의 값이 있어 migration을 중단했습니다.');
  }
}

function writeRosterNameColumns_(sheet, plan) {
  // Preflight is complete before this first mutation. Apps Script has no
  // transaction, so prefer one bulk setValues over clear/header/row phases.
  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }
  if (sheet.getFilter()) sheet.getFilter().remove();

  // Legacy dropdown rules stay attached to physical columns when the schema
  // shifts. Clear them before writing the final matrix so, for example, the
  // old H=회원유형 rule cannot reject the new H=가입방식 value. Final rules
  // are recreated on I/J/K by applyFinalRosterSchemaFormatting_().
  const validationRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 1, validationRows, HEADERS.length).clearDataValidations();

  sheet.getRange(1, 1, plan.matrix.length, HEADERS.length).setValues(plan.matrix);
}

function applyFinalRosterSchemaFormatting_(sheet) {
  // Formatting is intentionally separate from preflight and only starts once
  // the final 17-column matrix has been written successfully.
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#0d51aa').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('left');
  sheet.getRange(1, COLUMNS.memberNumber, 1, 2).setHorizontalAlignment('center');
  sheet.getRange(2, COLUMNS.memberNumber, rows, 1).setHorizontalAlignment('center').setFontWeight('bold');
  sheet.getRange(2, COLUMNS.joinedAt, rows, 1).setNumberFormat('yyyy-mm-dd').setHorizontalAlignment('center');
  sheet.getRange(2, COLUMNS.nickname, rows, HEADERS.length - COLUMNS.nickname + 1).setHorizontalAlignment('left');
  sheet.getRange(2, COLUMNS.memberType, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TYPE_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, COLUMNS.membership, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MEMBERSHIP_LABELS, true).setAllowInvalid(false).build());
  sheet.getRange(2, COLUMNS.accountStatus, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LABELS, true).setAllowInvalid(false).build());
  applyRosterDisplayStyles_(sheet, 2, Math.max(sheet.getLastRow() - 1, 0), COLUMNS);
  sheet.hideColumns(COLUMNS.systemId);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), HEADERS.length).createFilter();
}

// Pure transformation used by the one-time Sheet migration and regression
// tests. It intentionally creates no display_name values from legacy rows.
function previewRosterNameColumns_(rows, columns) {
  const sourceColumns = columns || PRE_NAME_COLUMNS;
  return rows.map(function (row) {
    // Existing "이름" is retained verbatim as full_name. The display-name
    // cell stays blank unless an authoritative value is supplied elsewhere.
    return rosterRecord_(COLUMNS, {
      memberNumber: row[sourceColumns.memberNumber - 1],
      joinedAt: row[sourceColumns.joinedAt - 1],
      nickname: row[sourceColumns.nickname - 1],
      displayName: '',
      fullName: row[sourceColumns.fullName - 1],
      email: row[sourceColumns.email - 1],
      phone: row[sourceColumns.phone - 1],
      signupMethod: row[sourceColumns.signupMethod - 1],
      memberType: row[sourceColumns.memberType - 1],
      membership: row[sourceColumns.membership - 1],
      accountStatus: row[sourceColumns.accountStatus - 1],
      specialty: row[sourceColumns.specialty - 1],
      teachingSubjects: row[sourceColumns.teachingSubjects - 1],
      enrolledSubject: row[sourceColumns.enrolledSubject - 1],
      assignedInstructor: row[sourceColumns.assignedInstructor - 1],
      signupPath: sourceColumns.signupPath ? row[sourceColumns.signupPath - 1] : '',
      systemId: row[sourceColumns.systemId - 1]
    });
  });
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

function syncApplicationMetadata_(memberId, record, columns) {
  const secret = PropertiesService.getScriptProperties().getProperty(MEMBER_SIGNUP.roleEmailSecretProperty);
  if (!secret) throw new Error('ROLE_EMAIL_WEBHOOK_SECRET이 설정되지 않았습니다.');
  const response = UrlFetchApp.fetch(MEMBER_SIGNUP.metadataWebhookUrl, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      action: 'member_application_sync', webhookSecret: secret, memberId: memberId,
      nickname: record[columns.nickname - 1], fullName: record[columns.fullName - 1],
      phone: record[columns.phone - 1], specialty: record[columns.specialty - 1],
      teachingSubjects: record[columns.teachingSubjects - 1],
      enrolledSubject: record[columns.enrolledSubject - 1],
      assignedInstructor: record[columns.assignedInstructor - 1]
    })
  });
  const status = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (_) { body = {}; }
  if (status < 200 || status >= 300 || body.ok !== true) {
    return { ok: false, status: status, error: body.error || `신청서 메타데이터 동기화 실패 (${status})` };
  }
  return { ok: true };
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
    const identity = migratedIdentity_(row[0], row[2]);
    return [row[0], joinedAt, identity.nickname, '', identity.fullName, row[3], '', row[4], row[5], row[6], row[7], '', '', '', '', row[8], row[9]];
  });
  if (sheet.getFilter()) sheet.getFilter().remove();
  if (count) sheet.getRange(2, 1, count, Math.max(sheet.getLastColumn(), HEADERS.length)).clearContent();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (expanded.length) sheet.getRange(2, 1, expanded.length, HEADERS.length).setValues(expanded);
}

function migratePreIdentitySchema_(sheet) {
  const count = Math.max(sheet.getLastRow() - 1, 0);
  const rows = count ? sheet.getRange(2, 1, count, PRE_IDENTITY_HEADERS.length).getValues() : [];
  const expanded = rows.map(function (row) {
    const identity = migratedIdentity_(row[0], row[2]);
    return [row[0], row[1], identity.nickname, '', identity.fullName, row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], row[12], row[13], row[14]];
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
    const memberNumber = formatMemberNumber_(year, sequenceByYear[year]);
    const identity = migratedIdentity_(memberNumber, row[2]);
    return [
      memberNumber,
      joinedAt,
      identity.nickname,
      '',
      identity.fullName,
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

function migratedIdentity_(memberNumber, legacyDisplayName) {
  if (text_(memberNumber) === 'HL-26-003') {
    return { nickname: '하이벨_샐리', fullName: '노혜경' };
  }
  return { nickname: text_(legacyDisplayName), fullName: '' };
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

function updateIdentityAndMembership_(sheet, row, record, columns) {
  const width = columnWidth_(columns);
  const existing = sheet.getRange(row, 1, 1, width).getValues()[0];
  for (let column = 0; column < width; column += 1) {
    const immutable = [columns.memberNumber - 1, columns.joinedAt - 1, columns.systemId - 1].includes(column);
    if (!immutable && ([columns.memberType - 1, columns.membership - 1, columns.accountStatus - 1].includes(column) || !existing[column])) {
      sheet.getRange(row, column + 1).setValue(record[column]);
    }
  }
}

function updateExistingApplication_(sheet, row, record, columns) {
  const mutableColumns = [
    columns.nickname, columns.fullName, columns.phone, columns.specialty,
    columns.teachingSubjects, columns.enrolledSubject, columns.assignedInstructor
  ];
  mutableColumns.forEach(function (column) {
    const value = text_(record[column - 1]);
    if (value) sheet.getRange(row, column).setValue(value);
  });
}

function findMemberRow_(sheet, id, email, columns) {
  if (sheet.getLastRow() < 2) return 0;
  const map = columns || columnMap_(sheet);
  const width = columnWidth_(map);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getDisplayValues();
  const index = rows.findIndex(function (row) { return (id && text_(row[map.systemId - 1]) === id) || (email && text_(row[map.email - 1]).toLowerCase() === email.toLowerCase()); });
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
  if (!text_(values['이름'] || values.full_name || values['표시 이름'] || values.nickname)) return '이름';
  return '';
}

function nextMemberNumber_(sheet, joinedAt, columns) {
  const year = String(dateValue_(joinedAt).getFullYear()).slice(-2);
  if (sheet.getLastRow() < 2) return formatMemberNumber_(year, 1);
  const map = columns || COLUMNS;
  const values = sheet.getRange(2, map.memberNumber, sheet.getLastRow() - 1, 1).getDisplayValues();
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
// Normalize only unambiguous North American 10-digit input.  International
// and incomplete values are intentionally preserved rather than guessed.
function formatPhone_(value) {
  const original = text_(value);
  const digits = original.replace(/\D/g, '');
  const usDigits = digits.length === 11 && digits.charAt(0) === '1'
    ? digits.slice(1)
    : digits;
  return usDigits.length === 10
    ? `${usDigits.slice(0, 3)}-${usDigits.slice(3, 6)}-${usDigits.slice(6)}`
    : original;
}

// Opt-in maintenance helper for existing roster rows. It is intentionally
// not called by onOpen, registration, or any sync path: an administrator must
// explicitly run it after reviewing the target spreadsheet. Only values that
// safely normalize to a US ten-digit number are changed; every other value is
// preserved verbatim.
function backfillPhoneFormats_() {
  const sheet = getSheet_();
  const columns = ensureSchema_(sheet);
  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  if (!rowCount) return { updated: 0 };
  const range = sheet.getRange(2, columns.phone, rowCount, 1);
  const current = range.getDisplayValues();
  let updated = 0;
  current.forEach(function (row, index) {
    const formatted = formatPhone_(row[0]);
    if (formatted !== row[0]) {
      range.getCell(index + 1, 1).setValue(formatted);
      updated += 1;
    }
  });
  if (updated) SpreadsheetApp.flush();
  return { updated: updated };
}

// Public, intentionally manual Apps Script entry point. The function picker
// exposes names without a trailing underscore, while the implementation stays
// private so no registration or webhook path can invoke it accidentally.
function runPhoneFormatBackfill() {
  return backfillPhoneFormats_();
}

function rosterRecord_(columns, values) {
  const width = columnWidth_(columns);
  const record = Array(width).fill('');
  Object.keys(values).forEach(function (key) {
    const column = columns[key];
    if (column) record[column - 1] = values[key] instanceof Date ? values[key] : text_(values[key]);
  });
  return record;
}
function escapeHtml_(value) { return text_(value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
function authorizeRoleChangeMail() { return MailApp.getRemainingDailyQuota(); }
