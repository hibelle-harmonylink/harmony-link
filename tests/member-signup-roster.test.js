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

test('requires UUID, email, and a provider display name for signup', () => {
  assert.equal(context.missingRegistrationField_({ '이메일': 'a@b.com', '이름': 'A' }), '회원 ID');
  assert.equal(context.missingRegistrationField_({ '회원 ID': 'uuid', '이름': 'A' }), '이메일');
  assert.equal(context.missingRegistrationField_({ '회원 ID': 'uuid', '이메일': 'a@b.com' }), '표시 이름');
  assert.equal(context.missingRegistrationField_({ '회원 ID': 'uuid', '이메일': 'a@b.com', '이름': 'A' }), '');
});

test('creates the next immutable year sequence without reusing numbers', () => {
  const sheet = {
    getLastRow: () => 4,
    getRange: () => ({ getDisplayValues: () => [['HL-30-101'], ['HL-30-107'], ['HL-29-199']] })
  };
  assert.equal(context.nextMemberNumber_(sheet, new Date('2030-01-15T00:00:00Z')), 'HL-30-108');
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

test('migrates seven sample members, removes fourteen invalid rows, and preserves UUIDs', () => {
  const sample = [
    ['sample-uuid-1', '2030-01-01T12:30:00Z', 'Sample Admin', 'admin@example.test', 'google', '관리자', '관리자', 'Example website'],
    ['sample-uuid-2', '2030-01-02T12:11:06Z', 'Partner One', 'partner@example.test', 'google', '입점 파트너', '$50 프리미엄 파트너', 'Example website'],
    ['sample-uuid-3', '2030-01-03T12:51:23Z', 'Student One', 'student@example.test', 'google', '수강생', '', 'Example website'],
    ['sample-uuid-4', '2030-01-04T12:45:59Z', 'Former Member', 'former@example.test', 'kakao', '탈퇴', '', 'Example website'],
    ['sample-uuid-5', '2030-01-05T12:55:03Z', 'Student Two', 'student2@example.test', 'google', '수강생', '', 'Example website'],
    ['sample-uuid-6', '2030-01-06T12:48:46Z', 'Student Three', 'student3@example.test', 'google', '수강생', '', 'Example website'],
    ['sample-uuid-7', '2030-01-07T12:05:05Z', 'Partner Two', 'partner2@example.test', 'google', '입점 파트너', '무료 파트너', 'Example website']
  ];
  const invalid = Array.from({ length: 14 }, (_, index) => ['', `2030-01-08T23:${String(index).padStart(2, '0')}:00Z`, '', '', '', '일반회원']);
  const migrated = context.buildMigratedRows_([...sample, ...invalid]);

  assert.equal(migrated.length, 7);
  assert.deepEqual(Array.from(migrated, row => row[0]), [
    'HL-30-001', 'HL-30-002', 'HL-30-003', 'HL-30-004', 'HL-30-005', 'HL-30-006', 'HL-30-007'
  ]);
  assert.deepEqual(Array.from(migrated, row => row[15]), sample.map(row => row[0]));
  assert.deepEqual(Array.from(migrated, row => row[2]), sample.map(row => row[2]));
  assert.deepEqual(Array.from(migrated, row => row[3]), Array(7).fill(''));
  assert.equal(migrated[3][7], '수강생');
  assert.equal(migrated[3][9], '탈퇴');
});

test('profile sync preserves member number, join date, and system ID while syncing metadata', () => {
  const body = source.slice(source.indexOf('function syncProfile_'), source.indexOf('function updateMember_'));
  assert.match(body, /COLUMNS\.memberType, 1, 3/);
  assert.doesNotMatch(body, /COLUMNS\.memberNumber/);
  assert.doesNotMatch(body, /COLUMNS\.joinedAt/);
  assert.doesNotMatch(body, /COLUMNS\.systemId/);
  assert.match(body, /COLUMNS\.phone/);
  assert.match(body, /COLUMNS\.specialty, 1, 4/);
});

test('pre-metadata roster expansion retains the join timestamp as a date-formattable value', () => {
  const body = source.slice(source.indexOf('function migratePreMetadataSchema_'), source.indexOf('function buildMigratedRows_'));
  assert.match(body, /const joinedAt = text_\(row\[1\]\) \? dateValue_\(row\[1\]\) : row\[1\]/);
  assert.match(source, /setNumberFormat\('yyyy-mm-dd'\)/);
});

test('profile sync reapplies type, membership, and status colors from current values', () => {
  const values = [
    ['입점 파트너', 'BASIC $20', '활성'],
    ['수강생', 'FREE', '탈퇴']
  ];
  const calls = [];
  const sheet = {
    getRange(startRow, startColumn, rowCount, columnCount) {
      if (columnCount === 3) return { getDisplayValues: () => values };
      return {
        setBackgrounds: matrix => { calls.push({ startColumn, kind: 'background', matrix }); return this; },
        setFontColors: matrix => { calls.push({ startColumn, kind: 'foreground', matrix }); return this; },
        setFontWeights: matrix => { calls.push({ startColumn, kind: 'weight', matrix }); return this; }
      };
    }
  };
  context.applyRosterDisplayStyles_(sheet, 2, values.length);
  assert.equal(calls.length, 9);
  // The identity columns shift roster display fields to H/I/J.
  assert.equal(JSON.stringify(calls.find(call => call.startColumn === 8 && call.kind === 'background').matrix), JSON.stringify([['#dbeafe'], ['#fee2e2']]));
  assert.equal(JSON.stringify(calls.find(call => call.startColumn === 9 && call.kind === 'background').matrix), JSON.stringify([['#ede9fe'], ['#f3f4f6']]));
  assert.equal(JSON.stringify(calls.find(call => call.startColumn === 10 && call.kind === 'background').matrix), JSON.stringify([['#dcfce7'], ['#e5e7eb']]));
});
