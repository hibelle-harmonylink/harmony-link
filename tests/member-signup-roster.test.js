const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'automation', 'member-signup.gs'), 'utf8');
const context = {
  console,
  Date,
  Object,
  Number,
  String,
  isNaN,
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput(value) {
      return { value, setMimeType() { return this; } };
    }
  }
};
vm.createContext(context);
vm.runInContext(source, context);

test('rejects incomplete and unknown registration requests before append', () => {
  const missing = JSON.parse(context.doPost({ parameter: {} }).value);
  assert.equal(missing.ok, false);
  assert.match(missing.error, /회원 ID/);

  const unknown = JSON.parse(context.doPost({ parameter: {
    action: 'unexpected',
    '회원 ID': 'uuid',
    '이메일': 'member@example.com',
    '이름': 'TEST'
  } }).value);
  assert.deepEqual(unknown, { ok: false, error: 'Unknown action.' });
});

test('requires UUID, email, and name for signup', () => {
  assert.equal(context.missingRegistrationField_({ '이메일': 'a@b.com', '이름': 'A' }), '회원 ID');
  assert.equal(context.missingRegistrationField_({ '회원 ID': 'uuid', '이름': 'A' }), '이메일');
  assert.equal(context.missingRegistrationField_({ '회원 ID': 'uuid', '이메일': 'a@b.com' }), '이름');
  assert.equal(context.missingRegistrationField_({ '회원 ID': 'uuid', '이메일': 'a@b.com', '이름': 'A' }), '');
});

test('creates the next immutable year sequence without reusing numbers', () => {
  const sheet = {
    getLastRow: () => 4,
    getRange: () => ({ getDisplayValues: () => [['HL-26-001'], ['HL-26-007'], ['HL-25-099']] })
  };
  assert.equal(context.nextMemberNumber_(sheet, new Date('2026-09-12T00:00:00Z')), 'HL-26-008');
});

test('maps roster-facing member type, membership, and status labels', () => {
  assert.equal(context.normalizeType_('student'), '수강생');
  assert.equal(context.normalizeType_('partner'), '입점 파트너');
  assert.equal(context.normalizeType_('admin'), '관리자');
  assert.equal(context.membershipLabel_('수강생', 'premium'), 'FREE');
  assert.equal(context.membershipLabel_('입점 파트너', 'partner20'), 'BASIC $20');
  assert.equal(context.membershipLabel_('입점 파트너', 'partner50'), 'PREMIUM $50');
  assert.equal(context.membershipLabel_('관리자', ''), '관리자');
  assert.equal(context.statusLabel_('suspended'), '중지');
  assert.equal(context.statusLabel_('withdrawn'), '탈퇴');
});

test('migrates seven real members, removes fourteen invalid rows, and preserves UUIDs', () => {
  const real = [
    ['uuid-1', '2026-08-01T00:30:00Z', 'Harmony Link', 'admin@example.com', 'google', '관리자', '관리자', 'Harmony Link 홈페이지'],
    ['uuid-2', '2026-08-04T02:11:06Z', 'meeran melody', 'meeran@example.com', 'google', '입점 파트너', '$50 프리미엄 파트너', 'Harmony Link 홈페이지'],
    ['uuid-3', '2026-08-10T02:51:23Z', '노혜경', 'noh@example.com', 'google', '수강생', '', 'Harmony Link 홈페이지'],
    ['uuid-4', '2026-08-11T02:45:59Z', '혜경(KR)', 'withdrawn@example.com', 'kakao', '탈퇴', '', 'Harmony Link 홈페이지'],
    ['uuid-5', '2026-08-21T22:55:03Z', 'Agnes Shin', 'agnes@example.com', 'google', '수강생', '', 'Harmony Link 홈페이지'],
    ['uuid-6', '2026-09-06T21:48:46Z', 'Jane Yom', 'jane@example.com', 'google', '수강생', '', 'Harmony Link 홈페이지'],
    ['uuid-7', '2026-09-11T20:05:05Z', 'Dan Verrett', 'dan@example.com', 'google', '입점 파트너', '무료 파트너', 'Harmony Link 홈페이지']
  ];
  const invalid = Array.from({ length: 14 }, (_, index) => ['', `2026-09-11T23:${String(index).padStart(2, '0')}:00Z`, '', '', '', '일반회원']);
  const migrated = context.buildMigratedRows_([...real, ...invalid]);

  assert.equal(migrated.length, 7);
  assert.deepEqual(Array.from(migrated, row => row[0]), [
    'HL-26-001', 'HL-26-002', 'HL-26-003', 'HL-26-004', 'HL-26-005', 'HL-26-006', 'HL-26-007'
  ]);
  assert.deepEqual(Array.from(migrated, row => row[16]), real.map(row => row[0]));
  assert.deepEqual(Array.from(migrated, row => row[2]), [
    'Harmony Link', 'meeran melody', '하이벨_샐리', '혜경(KR)', 'Agnes Shin', 'Jane Yom', 'Dan Verrett'
  ]);
  assert.deepEqual(Array.from(migrated, row => row[3]), ['', '', '', '', '', '', '']);
  assert.deepEqual(Array.from(migrated, row => row[4]), ['', '', '노혜경', '', '', '', '']);
  assert.equal(migrated[3][8], '수강생');
  assert.equal(migrated[3][10], '탈퇴');
});

test('profile sync preserves member number, join date, and system ID while syncing metadata', () => {
  const body = source.slice(source.indexOf('function syncProfile_'), source.indexOf('function updateMember_'));
  assert.match(body, /columns\.memberType, 1, 3/);
  assert.doesNotMatch(body, /columns\.memberNumber/);
  assert.doesNotMatch(body, /columns\.joinedAt/);
  assert.doesNotMatch(body, /columns\.systemId/);
  assert.match(body, /columns\.phone/);
  assert.match(body, /columns\.specialty, 1, 4/);
  assert.match(body, /text_\(values\.nickname\)/);
  assert.match(body, /text_\(values\.full_name\)/);
  assert.match(source, /columns\.memberType, 1, 3/);
});

test('pre-metadata roster expansion retains the join timestamp as a date-formattable value', () => {
  const body = source.slice(source.indexOf('function migratePreMetadataSchema_'), source.indexOf('function buildMigratedRows_'));
  assert.match(body, /const joinedAt = text_\(row\[1\]\) \? dateValue_\(row\[1\]\) : row\[1\]/);
  assert.match(source, /setNumberFormat\('yyyy-mm-dd'\)/);
});

test('uses the seventeen-column roster name structure and colours I through K', () => {
  assert.match(source, /const HEADERS = \['회원번호', '가입일', '닉네임\/업체명', '한글 이름', '영문 이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'\]/);
  assert.match(source, /memberType: 9, membership: 10, accountStatus: 11/);
  assert.match(source, /systemId: 17/);
  const styles = source.slice(source.indexOf('function applyRosterDisplayStyles_'), source.indexOf('function normalizeType_'));
  assert.match(styles, /map\.memberType/);
});
