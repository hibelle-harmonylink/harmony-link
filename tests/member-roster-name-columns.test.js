const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'automation', 'member-signup.gs'), 'utf8');
const auth = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');
const preview = new Function(`${source}\nreturn previewRosterNameColumns_;`)();
const formatPhone = new Function(`${source}\nreturn formatPhone_;`)();
const migrationRuntime = new Function(`${source}\nreturn { preflight: preflightRosterNameColumns_, migrate: migrateRosterNameColumns, setSheet: sheet => { getSheet_ = () => sheet; } };`)();
const inspectionRuntime = new Function(`const Logger = { entries: [], log: value => Logger.entries.push(value) };\n${source}\nreturn { inspect: inspectRosterSchema, setSheet: sheet => { getExistingRosterSheet_ = () => sheet; }, logs: Logger.entries };`)();

const oldHeaders = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];
const productionHeaders = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '시스템 ID'];
const duplicateSignupPathHeaders = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '가입경로', '시스템 ID'];
const newHeaders = ['회원번호', '가입일', '닉네임/업체명', '한글 이름', '영문 이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID'];

function readonlySheet(headers, rows) {
  let writes = 0;
  return {
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getRange(row) {
      return {
        getDisplayValues: () => row === 1 ? [headers] : rows,
        getValues: () => row === 1 ? [headers] : rows,
        setValues: () => { writes += 1; },
        setValue: () => { writes += 1; }
      };
    },
    getWriteCount: () => writes
  };
}

function inspectionSheet(headers, rows = []) {
  let writes = 0;
  return {
    getName: () => '회원가입 명단',
    getLastRow: () => rows.length + 1,
    getLastColumn: () => headers.length,
    getRange: (row) => ({
      getDisplayValues: () => row === 1 ? [headers] : rows,
      setValue: () => { writes += 1; },
      setValues: () => { writes += 1; }
    }),
    getWriteCount: () => writes
  };
}

function duplicateSignupPathRow(index, firstPath, secondPath) {
  return [
    `HL-26-${String(index).padStart(3, '0')}`,
    `2026-09-${String(index).padStart(2, '0')}`,
    `nickname-${index}`, `Full Name ${index}`, `member${index}@example.com`,
    index === 2 ? '817-905-3468' : '010-9773-0052', 'google', '수강생', 'FREE', '활성',
    'specialty', 'teaching', 'student', 'instructor', firstPath, secondPath, `uuid-${index}`
  ];
}

test('roster name columns have canonical display-name, full-name, and nickname labels', () => {
  assert.match(source, new RegExp(`const HEADERS = \\['${newHeaders.join("', '")}'\\]`));
  assert.match(source, /nickname: 3, displayName: 4, fullName: 5, email: 6, phone: 7/);
  assert.match(source, /const PRE_NAME_COLUMNS_HEADERS = \['회원번호', '가입일', '닉네임', '이름'/);
});

test('actual 15-column Production legacy preview preserves 23 rows while leaving Korean-name cells blank', () => {
  const legacyRows = Array.from({ length: 23 }, (_, index) => [
    `HL-26-${String(index + 1).padStart(3, '0')}`,
    `2026-09-${String((index % 20) + 1).padStart(2, '0')}`,
    index === 22 ? 'DMS Care' : `nickname-${index + 1}`,
    index === 0 ? '김미란' : `Full Name ${index + 1}`,
    `member${index + 1}@example.com`, index === 1 ? '817 905 3468' : '010-9773-0052',
    'google', '수강생', 'FREE', '활성', 'specialty', 'teaching', 'student', 'instructor', `uuid-${index + 1}`
  ]);
  const plan = migrationRuntime.preflight(readonlySheet(productionHeaders, legacyRows));
  const migrated = plan.rows;
  assert.equal(migrated.length, 23);
  migrated.forEach((row, index) => {
    assert.equal(row.length, 17);
    assert.equal(row[0], legacyRows[index][0]);
    assert.equal(row[1], legacyRows[index][1]);
    assert.equal(row[2], legacyRows[index][2]);
    assert.equal(row[3], '');
    assert.equal(row[4], legacyRows[index][3]);
    assert.deepEqual(row.slice(5, 15), legacyRows[index].slice(4, 14));
    assert.equal(row[15], '');
    assert.equal(row[16], legacyRows[index][14]);
  });
});

test('actual 15-column schema tolerates only blank physical trailing columns left by an earlier attempt', () => {
  const legacyRows = Array.from({ length: 23 }, (_, index) => [
    `HL-26-${String(index + 1).padStart(3, '0')}`,
    `2026-09-${String((index % 20) + 1).padStart(2, '0')}`,
    `nickname-${index + 1}`, `Full Name ${index + 1}`, `member${index + 1}@example.com`,
    index === 1 ? '817-905-3468' : '010-9773-0052', 'google', '수강생', 'FREE', '활성',
    'specialty', 'teaching', 'student', 'instructor', `uuid-${index + 1}`, '', ''
  ]);
  const sheet = readonlySheet(productionHeaders.concat(['', '']), legacyRows);
  const plan = migrationRuntime.preflight(sheet);

  assert.equal(plan.rows.length, 23);
  assert.equal(plan.rows[1][6], '817-905-3468');
  assert.equal(plan.rows[22][16], 'uuid-23');
  assert.equal(sheet.getWriteCount(), 0);
});

test('recoverable duplicate 가입경로 schema preserves the first 가입경로 while the second column is empty', () => {
  const rows = Array.from({ length: 23 }, (_, offset) => {
    return duplicateSignupPathRow(offset + 1, offset === 0 ? 'Harmony Link 홈페이지' : '', '');
  });
  const sheet = readonlySheet(duplicateSignupPathHeaders, rows);
  const plan = migrationRuntime.preflight(sheet);

  assert.equal(plan.rows.length, 23);
  assert.deepEqual(plan.matrix[0], newHeaders);
  plan.rows.forEach((row, offset) => {
    assert.equal(row[0], rows[offset][0]);
    assert.equal(row[1], rows[offset][1]);
    assert.equal(row[2], rows[offset][2]);
    assert.equal(row[3], '');
    assert.equal(row[4], rows[offset][3]);
    assert.equal(row[5], rows[offset][4]);
    assert.equal(row[6], rows[offset][5]);
    assert.equal(row[15], rows[offset][14]);
    assert.equal(row[16], rows[offset][16]);
  });
  assert.equal(plan.rows[0][15], 'Harmony Link 홈페이지');
  assert.equal(sheet.getWriteCount(), 0);
});

test('only a nonblank second duplicate 가입경로 value stops before any mutation', () => {
  [
    duplicateSignupPathRow(1, '', 'Google Form'),
    duplicateSignupPathRow(1, '소개', '소개'),
    duplicateSignupPathRow(1, '사이트 가입', 'Google Form')
  ].forEach((row) => {
    const sheet = readonlySheet(duplicateSignupPathHeaders, [row]);
    migrationRuntime.setSheet(sheet);
    assert.throws(() => migrationRuntime.migrate(), /중복 가입경로 열에 값/);
    assert.equal(sheet.getWriteCount(), 0);
  });
});

test('inspectRosterSchema is read-only and reports exact live header diagnostics', () => {
  const rows = Array.from({ length: 23 }, (_, index) => Array.from({ length: 17 }, (__, column) => {
    if (column === 0) return `HL-26-${String(index + 1).padStart(3, '0')}`;
    return '';
  }));
  const sheet = inspectionSheet(productionHeaders.concat(['', '']), rows);
  inspectionRuntime.setSheet(sheet);
  const report = inspectionRuntime.inspect();

  assert.equal(report.sheetName, '회원가입 명단');
  assert.equal(report.lastColumn, 17);
  assert.equal(report.physicalLastColumn, 17);
  assert.equal(report.logicalLastColumn, 15);
  assert.deepEqual(report.ignoredTrailingColumns, [16, 17]);
  assert.equal(report.rowCount, 23);
  assert.equal(report.trailingBlankColumns, 2);
  assert.equal(report.detectedSchema, 'legacy-15-without-signup-path');
  assert.equal(report.headers[2].index, 3);
  assert.equal(report.headers[2].value, '닉네임');
  assert.equal(report.headers[2].trimmed, '닉네임');
  assert.equal(report.firstDifference, null);
  assert.equal(report.supportedSchemas.length, 4);
  assert.equal(sheet.getWriteCount(), 0);

  const inspection = source.slice(source.indexOf('function inspectRosterSchema'), source.indexOf('function ensureSchema_'));
  assert.match(inspection, /getExistingRosterSheet_\(\)/);
  assert.doesNotMatch(inspection, /getSheet_\(\)|ensureSchema_\(|migrateRosterNameColumns\(|setValue|setValues|insert|delete|setBackground|setFont|setDataValidation/);
});

test('inspectRosterSchema reports the duplicate 가입경로 schema as recoverable without writing', () => {
  const sheet = inspectionSheet(duplicateSignupPathHeaders);
  inspectionRuntime.setSheet(sheet);
  const report = inspectionRuntime.inspect();

  assert.equal(report.detectedSchema, 'recoverable-17-duplicate-signup-path');
  assert.equal(sheet.getWriteCount(), 0);
});

test('schema comparison accepts ordinary header whitespace without writing or changing the header', () => {
  const sheet = inspectionSheet(productionHeaders.map((header, index) => index === 2 ? '닉네임 ' : header));
  inspectionRuntime.setSheet(sheet);
  const report = inspectionRuntime.inspect();

  assert.equal(report.detectedSchema, 'legacy-15-without-signup-path');
  assert.equal(report.firstDifference, null);
  assert.equal(report.headers[2].value, '닉네임 ');
  assert.equal(report.headers[2].trimmed, '닉네임');
  assert.equal(sheet.getWriteCount(), 0);
});

test('migration preflight accepts a trimmed logical 15-column header without altering it', () => {
  const headers = productionHeaders.map((header, index) => index === 2 ? ' 닉네임 ' : header).concat(['', '']);
  const rows = Array.from({ length: 23 }, (_, index) => [
    `HL-26-${String(index + 1).padStart(3, '0')}`,
    `2026-09-${String(index + 1).padStart(2, '0')}`,
    `nickname-${index + 1}`, `Full Name ${index + 1}`, `member${index + 1}@example.com`,
    '817-905-3468', 'google', '수강생', 'FREE', '활성', 'specialty', 'teaching', 'student', 'instructor', `uuid-${index + 1}`, '', ''
  ]);
  const sheet = readonlySheet(headers, rows);
  const plan = migrationRuntime.preflight(sheet);

  assert.equal(plan.rows.length, 23);
  assert.equal(plan.rows[0][4], 'Full Name 1');
  assert.equal(plan.rows[22][16], 'uuid-23');
  assert.equal(sheet.getWriteCount(), 0);
});

test('inspectRosterSchema reports a trailing data mismatch and an invisible header without writing', () => {
  const trailingDataSheet = inspectionSheet(productionHeaders.concat(['', '']), [
    Array.from({ length: 17 }, (_, index) => index === 15 ? 'unexpected value' : '')
  ]);
  inspectionRuntime.setSheet(trailingDataSheet);
  const trailingData = inspectionRuntime.inspect();
  assert.equal(trailingData.detectedSchema, 'unsupported');
  assert.deepEqual(trailingData.firstDifference, {
    column: 16,
    expected: '',
    actual: '',
    actualTrimmed: '',
    nonEmptyRowCount: 1,
    nonEmptyRows: [{ row: 2, value: 'unexpected value', trimmed: 'unexpected value' }]
  });
  assert.equal(trailingDataSheet.getWriteCount(), 0);

  const invisibleHeaderSheet = inspectionSheet(productionHeaders.map((header, index) => index === 2 ? '닉네임\u200B' : header));
  inspectionRuntime.setSheet(invisibleHeaderSheet);
  const invisible = inspectionRuntime.inspect();
  assert.equal(invisible.detectedSchema, 'unsupported');
  assert.deepEqual(invisible.firstDifference, {
    column: 3, expected: '닉네임', actual: '닉네임\u200B', actualTrimmed: '닉네임\u200B'
  });
  assert.match(invisible.headers[2].codePoints.join(' '), /U\+200B/);
  assert.equal(invisibleHeaderSheet.getWriteCount(), 0);
});

test('manual migration is preflight-first, idempotent, and only targets the active roster sheet', () => {
  const migration = source.slice(source.indexOf('function migrateRosterNameColumns'), source.indexOf('function migrateLegacySchema_'));
  assert.match(migration, /function migrateRosterNameColumns\(\)/);
  assert.match(migration, /const sheet = getSheet_\(\);/);
  assert.match(migration, /const plan = preflightRosterNameColumns_\(sheet\);/);
  assert.match(migration, /if \(plan\.noOp\) return \{ migrated: false, rows: 0 \};/);
  assert.ok(migration.indexOf('preflightRosterNameColumns_') < migration.indexOf('writeRosterNameColumns_'));
  const preflight = source.slice(source.indexOf('function preflightRosterNameColumns_'), source.indexOf('function legacyRosterSchema_'));
  assert.doesNotMatch(preflight, /ensureSchema_\(/);
  const doPost = source.slice(source.indexOf('function doPost'), source.indexOf('function registerMember_'));
  assert.doesNotMatch(doPost, /migrateRosterNameColumns\(/);
  assert.doesNotMatch(migration, /getSheets\(/);
});

test('migration clears legacy data validations before writing the shifted final matrix', () => {
  const write = source.slice(source.indexOf('function writeRosterNameColumns_'), source.indexOf('function applyFinalRosterSchemaFormatting_'));
  const format = source.slice(source.indexOf('function applyFinalRosterSchemaFormatting_'), source.indexOf('function previewRosterNameColumns_'));
  assert.match(write, /clearDataValidations\(\)/);
  assert.ok(write.indexOf('clearDataValidations()') < write.indexOf('setValues(plan.matrix)'));
  assert.match(format, /COLUMNS\.memberType[\s\S]*setDataValidation/);
  assert.match(format, /COLUMNS\.membership[\s\S]*setDataValidation/);
  assert.match(format, /COLUMNS\.accountStatus[\s\S]*setDataValidation/);
});

test('final 17-column schema is a write-free migration no-op', () => {
  const finalSheet = readonlySheet(newHeaders, [Array.from({ length: 17 }, (_, index) => `value-${index + 1}`)]);
  migrationRuntime.setSheet(finalSheet);

  assert.deepEqual(migrationRuntime.migrate(), { migrated: false, rows: 0 });
  assert.equal(finalSheet.getWriteCount(), 0);
});

test('unknown, width-mismatched, and duplicate legacy data fail before any write', () => {
  const row = ['HL-26-001', '2026-09-01', 'nick', 'Full Name', 'a@example.com', '817-905-3468', 'google', '수강생', 'FREE', '활성', '', '', '', '', 'uuid-a'];
  const unknown = readonlySheet(['잘못된 헤더'], [row]);
  migrationRuntime.setSheet(unknown);
  assert.throws(() => migrationRuntime.migrate(), /지원하는 legacy schema/);
  assert.equal(unknown.getWriteCount(), 0);

  const duplicate = readonlySheet(productionHeaders, [row, row.slice()]);
  migrationRuntime.setSheet(duplicate);
  assert.throws(() => migrationRuntime.migrate(), /중복 회원번호/);
  assert.equal(duplicate.getWriteCount(), 0);

  const badWidth = readonlySheet(productionHeaders, [row.slice(0, 14)]);
  migrationRuntime.setSheet(badWidth);
  assert.throws(() => migrationRuntime.migrate(), /행 폭/);
  assert.equal(badWidth.getWriteCount(), 0);

  const unexpectedTrailingHeader = readonlySheet(productionHeaders.concat(['가입경로']), [row.concat(['unexpected'])]);
  migrationRuntime.setSheet(unexpectedTrailingHeader);
  assert.throws(() => migrationRuntime.migrate(), /지원 schema 밖의 값/);
  assert.equal(unexpectedTrailingHeader.getWriteCount(), 0);

  const unexpectedTrailingValue = readonlySheet(productionHeaders.concat(['']), [row.concat(['unexpected'])]);
  migrationRuntime.setSheet(unexpectedTrailingValue);
  assert.throws(() => migrationRuntime.migrate(), /legacy schema 밖의 데이터/);
  assert.equal(unexpectedTrailingValue.getWriteCount(), 0);
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
  assert.match(source, /PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH_HEADERS/);
});
