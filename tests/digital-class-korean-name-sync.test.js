const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const bridge = read('automation/digital-class-application-forward.gs');

// Extracts one top-level function's full source (closing brace alone at
// column 0 -- the codebase's consistent top-level function convention) so it
// can be real-executed in an isolated vm context instead of only pattern
// matched.
function extractFunction(name) {
  const match = bridge.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `could not extract ${name} from digital-class-application-forward.gs`);
  return match[0];
}
function extractConst(name) {
  const match = bridge.match(new RegExp(`const ${name} = \\{[\\s\\S]*?\\n\\};`));
  assert.ok(match, `could not extract const ${name} from digital-class-application-forward.gs`);
  return match[0];
}

// A real, isolated execution context: the actual roster-reading/matching
// functions run for real against an in-memory mock spreadsheet, with a
// fake SpreadsheetApp/PropertiesService standing in for Apps Script's real
// services. No real Google Sheet is ever touched by this harness.
function harness({ rosterSpreadsheetId = 'roster-id-123', rosterSheetMissing = false, rosterHeaders, rosterRows, responseHeaders, responseRows } = {}) {
  const calls = { writes: [], openedSpreadsheetIds: [] };

  function makeSheet(label, headers, rows) {
    const data = [headers.slice()].concat(rows.map(row => row.slice()));
    return {
      getLastColumn: () => (data[0] ? data[0].length : 0),
      getLastRow: () => data.length,
      getRange: (r, c, numRows, numCols) => {
        numRows = numRows || 1;
        numCols = numCols || 1;
        return {
          getDisplayValues: () => {
            const slice = [];
            for (let i = 0; i < numRows; i += 1) {
              const sourceRow = data[r - 1 + i] || [];
              const cells = [];
              for (let j = 0; j < numCols; j += 1) cells.push(sourceRow[c - 1 + j] || '');
              slice.push(cells);
            }
            return slice;
          },
          setValue: value => {
            calls.writes.push({ sheet: label, r, c, value });
            if (!data[r - 1]) data[r - 1] = [];
            data[r - 1][c - 1] = value;
          },
        };
      },
    };
  }

  const responseSheet = makeSheet('response', responseHeaders, responseRows);
  const rosterSheet = rosterSheetMissing ? null : makeSheet('roster', rosterHeaders, rosterRows);

  const context = {
    calls,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: key => (key === 'MEMBER_ROSTER_SPREADSHEET_ID' ? rosterSpreadsheetId : null),
      }),
    },
    SpreadsheetApp: {
      openById: id => {
        calls.openedSpreadsheetIds.push(id);
        return { getSheetByName: () => rosterSheet };
      },
      getUi: () => ({ alert: () => {} }),
      getActiveSheet: () => responseSheet,
    },
  };
  vm.createContext(context);
  vm.runInContext([
    extractConst('DIGITAL_CLASS_CONFIG'),
    extractConst('DIGITAL_CLASS_HEADERS'),
    extractConst('DIGITAL_CLASS_MANAGED_HEADERS'),
    `const MEMBER_ROSTER_SHEET_NAME = '회원가입 명단';`,
    extractConst('MEMBER_ROSTER_HEADERS'),
    extractFunction('buildRosterVerifiedKoreanNameMap_'),
    extractFunction('lookupVerifiedKoreanName_'),
    extractFunction('syncVerifiedKoreanNameForRow_'),
    extractFunction('ensureManagedKoreanNameColumn_'),
    extractFunction('headerColumn_'),
    extractFunction('containsHangul_'),
    extractFunction('trimmed_'),
    extractFunction('syncDigitalClassVerifiedKoreanNameForSubmission_'),
    extractFunction('digitalClassAnswer_'),
  ].join('\n;\n'), context);
  return { context, calls, responseSheet, rosterSheet };
}

const ROSTER_HEADERS = ['회원번호', '가입일', '닉네임', '이름', '이메일', '연락처', '가입방식', '회원유형', '멤버십', '계정상태', '전문분야', '강의과목', '수강과목', '담당강사', '가입경로', '시스템 ID', '시스템 ID'];
function rosterRow({ name, email }) {
  const row = new Array(ROSTER_HEADERS.length).fill('');
  row[3] = name; // 이름
  row[4] = email; // 이메일
  return row;
}

test('REAL EXECUTION: exact-email match with a Hangul roster name is looked up', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [rosterRow({ name: '염나영', email: 'Someone@Example.com' })],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [],
  });
  const result = h.context.lookupVerifiedKoreanName_('someone@example.com');
  assert.equal(result, '염나영');
});

test('REAL EXECUTION: exact-email match but English-only roster name returns blank', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [rosterRow({ name: 'hyunsook hong', email: 'hyunsook848@gmail.com' })],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [],
  });
  const result = h.context.lookupVerifiedKoreanName_('hyunsook848@gmail.com');
  assert.equal(result, '');
});

test('REAL EXECUTION: no roster row for this email returns blank (mismatch)', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [rosterRow({ name: '염나영', email: 'known@example.com' })],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [],
  });
  const result = h.context.lookupVerifiedKoreanName_('unknown@example.com');
  assert.equal(result, '');
});

test('REAL EXECUTION: a name-only coincidence never matches -- only email is the key', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [rosterRow({ name: '염나영', email: 'roster-email@example.com' })],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [],
  });
  // Looking up a different email, even though a roster row with the "right"
  // name exists, must not match.
  const result = h.context.lookupVerifiedKoreanName_('different-email@example.com');
  assert.equal(result, '');
});

test('REAL EXECUTION: missing roster connection throws, never silently invents a name', () => {
  const h = harness({
    rosterSpreadsheetId: null,
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [],
  });
  assert.throws(() => h.context.lookupVerifiedKoreanName_('someone@example.com'), /회원명단 시트가 아직 연결되지 않았습니다/);
});

test('REAL EXECUTION: a new submission writes the verified Korean name to the managed column, creating it if missing', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [rosterRow({ name: '염나영', email: 'nayoung@example.com' })],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [['nayoung', 'nayoung@example.com']],
  });
  const sheet = h.responseSheet;
  const event = {
    namedValues: { '9.구글이메일': ['nayoung@example.com'] },
    range: { getSheet: () => sheet, getRow: () => 2 },
  };
  h.context.syncDigitalClassVerifiedKoreanNameForSubmission_(event);
  const responseWrites = h.calls.writes.filter(call => call.sheet === 'response');
  const dataWrites = responseWrites.filter(call => call.r !== 1);
  assert.equal(dataWrites.length, 1);
  assert.deepEqual(dataWrites[0], { sheet: 'response', r: 2, c: 3, value: '염나영' });
  // The managed header itself was written once, at the new trailing column.
  assert.ok(responseWrites.some(call => call.r === 1 && call.c === 3 && call.value === '관리용 한글 이름'));
});

test('REAL EXECUTION: a new submission with no roster match writes nothing to the managed column', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [rosterRow({ name: '염나영', email: 'someone-else@example.com' })],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [['mismatch', 'mismatch@example.com']],
  });
  const sheet = h.responseSheet;
  const event = {
    namedValues: { '9.구글이메일': ['mismatch@example.com'] },
    range: { getSheet: () => sheet, getRow: () => 2 },
  };
  h.context.syncDigitalClassVerifiedKoreanNameForSubmission_(event);
  const dataWrites = h.calls.writes.filter(call => call.sheet === 'response' && call.r !== 1);
  assert.equal(dataWrites.length, 0);
});

test('REAL EXECUTION: a roster-connection failure during submission sync never throws past the handler slice', () => {
  const h = harness({
    rosterSpreadsheetId: null,
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [],
    responseHeaders: ['4.이름', '9.구글이메일'],
    responseRows: [['x', 'x@example.com']],
  });
  const sheet = h.responseSheet;
  const event = {
    namedValues: { '9.구글이메일': ['x@example.com'] },
    range: { getSheet: () => sheet, getRow: () => 2 },
  };
  // syncDigitalClassVerifiedKoreanNameForSubmission_ itself does not catch --
  // forwardDigitalClassApplication's own try/catch around it is what makes
  // this independent; this test documents that the error does propagate out
  // of this one helper so the outer try/catch has something real to catch.
  assert.throws(() => h.context.syncDigitalClassVerifiedKoreanNameForSubmission_(event), /회원명단 시트가 아직 연결되지 않았습니다/);
});

test('REAL EXECUTION: ensureManagedKoreanNameColumn_ reuses an existing managed column instead of duplicating it', () => {
  const h = harness({
    rosterHeaders: ROSTER_HEADERS,
    rosterRows: [],
    responseHeaders: ['4.이름', '9.구글이메일', '관리용 한글 이름'],
    responseRows: [['x', 'x@example.com', '']],
  });
  const column = h.context.ensureManagedKoreanNameColumn_(h.responseSheet);
  assert.equal(column, 3);
  // No new header was written -- the column already existed.
  assert.equal(h.calls.writes.filter(call => call.r === 1).length, 0);
});

// Static checks -- the contract this feature must hold in the source itself.

test('a new, separate Script Property key is used for the roster Spreadsheet ID, distinct from the webapp URL property', () => {
  assert.match(bridge, /rosterSpreadsheetIdKey:\s*'MEMBER_ROSTER_SPREADSHEET_ID'/);
  assert.match(bridge, /rosterWebappUrlKey:\s*'MEMBER_ROSTER_WEBAPP_URL'/);
});

test('the roster Spreadsheet ID is never hardcoded -- always read from the Script Property', () => {
  const lookupFn = bridge.slice(bridge.indexOf('function buildRosterVerifiedKoreanNameMap_'), bridge.indexOf('function headerColumn_'));
  assert.match(lookupFn, /PropertiesService\.getScriptProperties\(\)\.getProperty\(DIGITAL_CLASS_CONFIG\.rosterSpreadsheetIdKey\)/);
  assert.match(lookupFn, /SpreadsheetApp\.openById\(spreadsheetId\)/);
  assert.doesNotMatch(lookupFn, /openById\(['"][0-9a-zA-Z_-]{20,}['"]/);
});

test('this feature adds no doGet and does not modify member-signup.gs', () => {
  assert.doesNotMatch(bridge, /function doGet/);
  const memberSignup = read('automation/member-signup.gs');
  assert.doesNotMatch(memberSignup, /관리용 한글 이름|rosterSpreadsheetIdKey|MEMBER_ROSTER_SPREADSHEET_ID/);
});

test('roster name/email columns are located by header text, never a hardcoded column index', () => {
  const lookupFn = bridge.slice(bridge.indexOf('function buildRosterVerifiedKoreanNameMap_'), bridge.indexOf('function headerColumn_'));
  assert.match(lookupFn, /headerColumn_\(headers, MEMBER_ROSTER_HEADERS\.name\)/);
  assert.match(lookupFn, /headerColumn_\(headers, MEMBER_ROSTER_HEADERS\.email\)/);
  assert.doesNotMatch(lookupFn, /row\[\d+\]/);
});

test('only 이름/이메일 are read from the roster -- no other roster field is referenced', () => {
  const lookupFn = bridge.slice(bridge.indexOf('function buildRosterVerifiedKoreanNameMap_'), bridge.indexOf('function headerColumn_'));
  assert.doesNotMatch(lookupFn, /회원번호|멤버십|전문분야|강의과목|수강과목|담당강사|계정상태|시스템 ID|가입경로|가입방식|연락처/);
});

test('the Hangul check requires an actual Hangul syllable, matching Unicode Hangul Syllables block', () => {
  assert.match(bridge, /function containsHangul_\(value\) \{\s*return \/\[가-힣\]\/\.test/);
});

test('the managed column is reused if present and appended only once if missing -- never a duplicate', () => {
  const fn = bridge.slice(bridge.indexOf('function ensureManagedKoreanNameColumn_'), bridge.indexOf('function lookupVerifiedKoreanName_'));
  assert.match(fn, /headerColumn_\(headers, DIGITAL_CLASS_MANAGED_HEADERS\.verifiedKoreanName\)/);
  assert.match(fn, /if \(existing\) return existing;/);
});

test('no name-only matching exists anywhere in the Korean-name sync path', () => {
  const section = bridge.slice(bridge.indexOf('function syncDigitalClassVerifiedKoreanNameForSubmission_'), bridge.indexOf('function digitalClassAnswer_'));
  assert.doesNotMatch(section, /nameColumn.*===.*name|matchByName|nameOnly/i);
});

test('the submission handler keeps Korean-name sync in its own independent try/catch', () => {
  const handler = bridge.slice(bridge.indexOf('function forwardDigitalClassApplication('), bridge.indexOf('function alignDigitalClassResponseRowLeft_'));
  const tryBlocks = handler.match(/try \{/g) || [];
  assert.equal(tryBlocks.length, 3, 'alignment, Korean-name sync, and roster sync must each have their own try/catch');
  assert.match(handler, /syncDigitalClassVerifiedKoreanNameForSubmission_\(event\)/);
});

test('this feature adds no new onFormSubmit trigger -- exactly one ScriptApp.newTrigger call in the whole file', () => {
  const newTriggerMatches = bridge.match(/ScriptApp\.newTrigger\(/g) || [];
  assert.equal(newTriggerMatches.length, 1);
});

test('the bulk-sync menu action never deletes, reorders, or sorts response rows', () => {
  const fn = bridge.slice(bridge.indexOf('function syncDigitalClassVerifiedKoreanNames'), bridge.indexOf('function syncVerifiedKoreanNameForRow_'));
  assert.doesNotMatch(fn, /deleteRow|sort\(|moveRows|insertRow/i);
});

test('no roster content (emails or names) is ever logged -- only a numeric match count', () => {
  const fn = bridge.slice(bridge.indexOf('function syncDigitalClassVerifiedKoreanNames'), bridge.indexOf('function syncVerifiedKoreanNameForRow_'));
  assert.doesNotMatch(fn, /console\.(log|warn|error)\(/);
  assert.match(fn, /매칭됨: ' \+ matched \+ '건\./);
});

test('no specific member (by name, email, member number, or UUID) is hardcoded anywhere in this file', () => {
  assert.doesNotMatch(bridge, /염나영|신영숙|Yeonhee Pak|Jong Bae|Haru Lee|young ju ban|MEERAN KIM/);
  assert.doesNotMatch(bridge, /meilly@naver\.com|040nsd@gmail\.com|agnesshin70@gmail\.com/);
  assert.doesNotMatch(bridge, /HL-26-013|HL-26-005/);
  assert.doesNotMatch(bridge, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
});

test('the original 4.이름 response field is never written by this file', () => {
  assert.doesNotMatch(bridge, /DIGITAL_CLASS_HEADERS\.name\]?\s*=|setValue\([^)]*DIGITAL_CLASS_HEADERS\.name/);
  // The only setValue targets in the Korean-name feature are the managed
  // header cell and the managed data cell -- never column 1 (4.이름).
  const koreanSection = bridge.slice(bridge.indexOf('function syncDigitalClassVerifiedKoreanNames'), bridge.indexOf('function trimmed_'));
  assert.doesNotMatch(koreanSection, /getRange\(\s*\d+\s*,\s*1\s*\)\.setValue/);
});

test('the existing roster application-sync function and digital class headers are unchanged by this feature', () => {
  assert.match(bridge, /function forwardDigitalClassApplicationToRoster_\(namedValues\) \{/);
  assert.match(bridge, /name: '4\.이름'/);
  assert.match(bridge, /email: '9\.구글이메일'/);
});
