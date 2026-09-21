const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'automation', 'member-signup.gs'), 'utf8');
const auth = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');
const preview = new Function(`${source}\nreturn previewRosterNameColumns_;`)();
const formatPhone = new Function(`${source}\nreturn formatPhone_;`)();

const oldHeaders = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];
const newHeaders = ['회원번호', '가입일', '닉네임/업체명', '한글 이름', '영문 이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];

test('roster name columns have canonical display-name, full-name, and nickname labels', () => {
  assert.match(source, new RegExp(`const HEADERS = \\['${newHeaders.join("', '")}'\\]`));
  assert.match(source, /nickname: 3, displayName: 4, fullName: 5, email: 6, phone: 7/);
  assert.match(source, /const PRE_NAME_COLUMNS_HEADERS = \['회원번호', '가입일', '닉네임', '이름'/);
});

test('23-row migration preview preserves every old value while leaving Korean-name cells blank', () => {
  const legacyRows = Array.from({ length: 23 }, (_, index) => [
    `HL-26-${String(index + 1).padStart(3, '0')}`,
    `2026-09-${String((index % 20) + 1).padStart(2, '0')}`,
    index === 22 ? 'DMS Care' : `nickname-${index + 1}`,
    index === 0 ? '김미란' : `Full Name ${index + 1}`,
    `member${index + 1}@example.com`, index === 1 ? '817 905 3468' : '010-9773-0052',
    'google', '수강생', 'FREE', '활성', 'specialty', 'teaching', 'student', 'instructor', 'Harmony Link', `uuid-${index + 1}`
  ]);
  const migrated = preview(legacyRows);
  assert.equal(migrated.length, 23);
  migrated.forEach((row, index) => {
    assert.equal(row.length, 17);
    assert.equal(row[0], legacyRows[index][0]);
    assert.equal(row[1], legacyRows[index][1]);
    assert.equal(row[2], legacyRows[index][2]);
    assert.equal(row[3], '');
    assert.equal(row[4], legacyRows[index][3]);
    assert.deepEqual(row.slice(5), legacyRows[index].slice(4));
  });
});

test('manual migration is opt-in, idempotent, and only targets the active roster sheet', () => {
  const migration = source.slice(source.indexOf('function migrateRosterNameColumns'), source.indexOf('function previewRosterNameColumns_'));
  assert.match(migration, /function migrateRosterNameColumns\(\)/);
  assert.match(migration, /const sheet = getSheet_\(\);/);
  assert.match(migration, /if \(headersMatch_\(current, HEADERS\)\) return \{ migrated: false, rows: 0 \};/);
  const doPost = source.slice(source.indexOf('function doPost'), source.indexOf('function registerMember_'));
  assert.doesNotMatch(doPost, /migrateRosterNameColumns\(/);
  assert.doesNotMatch(migration, /getSheets\(/);
});

test('new signup accepts explicit display_name without treating provider display text as Korean-name data', () => {
  assert.match(source, /displayName: values\.display_name \|\| values\['한글 이름'\]/);
  assert.doesNotMatch(source, /displayName: [^\n]*표시 이름/);
  assert.match(auth, /signupRecord\.set\('display_name', activeMemberName \|\| ''\)/);
  assert.match(auth, /record\.set\('display_name', activeMemberName \|\| ''\)/);
});

test('partner application continues to sync full_name only and cannot modify display_name', () => {
  const application = source.slice(source.indexOf('function syncApplicationMetadata_'), source.indexOf('function updateIdentityAndMembership_'));
  assert.match(application, /fullName: record\[columns\.fullName - 1\]/);
  assert.doesNotMatch(application, /displayName/);
});

test('new column indexes preserve phone formatting and protected identifiers', () => {
  assert.match(source, /const range = sheet\.getRange\(2, columns\.phone, rowCount, 1\)/);
  assert.equal(formatPhone('817 905 3468'), '817-905-3468');
  assert.equal(formatPhone('010-9773-0052'), '010-9773-0052');
  assert.match(source, /immutable = \[columns\.memberNumber - 1, columns\.joinedAt - 1, columns\.systemId - 1\]/);
});

test('existing headers are preserved until the administrator invokes the manual migration', () => {
  assert.equal(oldHeaders.length, 16);
  assert.match(source, /else if \(headersMatch_\(current, PRE_NAME_COLUMNS_HEADERS\)\) columns = PRE_NAME_COLUMNS/);
  assert.match(source, /else if \(!headersMatch_\(current, HEADERS\)\) throw new Error/);
});
