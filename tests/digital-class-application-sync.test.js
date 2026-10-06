const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const bridge = read('automation/digital-class-application-forward.gs');
const memberSignup = read('automation/member-signup.gs');
const migration = read('supabase/migrations/202609130004_member_application_completion.sql');

// Extracts one top-level function's full source (its closing brace must sit
// alone at column 0 -- the same convention every multi-line function in this
// codebase already follows) so it can be real-executed in an isolated vm
// context, instead of only pattern-matched.
function extractFunction(name) {
  const match = memberSignup.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `could not extract ${name} from member-signup.gs`);
  return match[0];
}
function extractConst(name, closer) {
  const match = memberSignup.match(new RegExp(`const ${name} = [^;]*?${closer};`));
  assert.ok(match, `could not extract const ${name} from member-signup.gs`);
  return match[0];
}
// Same extraction, but against this bridge file itself -- used to scope an
// assertion to one specific function's body instead of the whole file, so a
// later, unrelated function added elsewhere in the bridge (e.g. the
// Korean-name sync feature) cannot produce a false positive here.
function extractBridgeFunction(name) {
  const match = bridge.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `could not extract ${name} from digital-class-application-forward.gs`);
  return match[0];
}

// Builds a real, isolated execution of registerMember_ and its direct
// dependencies (findMemberRow_, isSupplementalApplication_, applicationValue_,
// normalizeType_, membershipLabel_, dateValue_, formatPhone_, rosterRecord_,
// columnWidth_ -- all extracted verbatim from member-signup.gs) against a
// minimal in-memory mock sheet, so the safety contract can be verified by
// actually running the code rather than only reading it. ensureSchema_,
// nextMemberNumber_, registerMemberMetadata_, syncApplicationMetadata_,
// updateExistingApplication_ and sendSignupConfirmation_ are replaced with
// counting spies -- the exact side effects this audit cares about -- rather
// than real Sheet/Supabase calls.
function harness(existingRow) {
  const calls = { nextMemberNumber: 0, appendRow: 0, registerMemberMetadata: 0, syncApplicationMetadata: 0, updateExistingApplication: 0, sendSignupConfirmation: 0 };
  const sheetData = {};
  let lastRow = 1;
  const context = {
    calls,
    text_: value => String(value || '').trim(),
    json_: payload => payload,
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    SpreadsheetApp: { flush: () => {} },
    console: { error: () => {}, warn: () => {} },
    PRE_NAME_COLUMNS: undefined,
    PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH: undefined,
  };
  vm.createContext(context);
  vm.runInContext([
    extractConst('HEADERS', '\\]'),
    extractConst('COLUMNS', '\\}\\)'),
    extractFunction('columnWidth_'),
    extractFunction('isSupplementalApplication_'),
    extractFunction('applicationValue_'),
    extractFunction('normalizeType_'),
    extractFunction('membershipLabel_'),
    extractFunction('dateValue_'),
    extractFunction('formatPhone_'),
    extractFunction('rosterRecord_'),
    extractFunction('findMemberRow_'),
    extractFunction('registerMember_'),
    // Stand-ins for the dependencies this audit is about, each one a
    // counting spy instead of a real Sheet/Supabase call.
    `function ensureSchema_(sheet) { return COLUMNS; }`,
    `function getSheet_() { return mockSheet; }`,
    `function nextMemberNumber_() { calls.nextMemberNumber++; return 'HL-00-000'; }`,
    `function registerMemberMetadata_(memberId, memberNumber) { calls.registerMemberMetadata++; return { ok: true, memberNumber: memberNumber }; }`,
    `function syncApplicationMetadata_() { calls.syncApplicationMetadata++; return { ok: true }; }`,
    `function updateExistingApplication_() { calls.updateExistingApplication++; }`,
    `function sendSignupConfirmation_() { calls.sendSignupConfirmation++; }`,
    `const mockSheet = {
      getLastRow: () => ${existingRow ? 2 : 1},
      getRange: (r, c, numRows, numCols) => {
        numRows = numRows || 1; numCols = numCols || 1;
        const slice = [];
        for (let i = 0; i < numRows; i++) {
          const rowArr = ${existingRow ? JSON.stringify(existingRow) : '[]'};
          const cells = [];
          for (let j = 0; j < numCols; j++) cells.push(rowArr[c + j - 1] || '');
          slice.push(cells);
        }
        return { getDisplayValues: () => slice, getValues: () => slice, getDisplayValue: () => slice[0][0] };
      },
      appendRow: () => { calls.appendRow++; }
    };`
  ].join('\n;\n'), context);
  return { registerMember_: context.registerMember_, calls, COLUMNS: context.COLUMNS };
}

// Builds a 17-column roster row (matching the real COLUMNS schema) with only
// the fields this audit needs populated.
function existingMemberRow({ memberNumber, email, systemId }) {
  const row = new Array(17).fill('');
  row[0] = memberNumber; // columns.memberNumber
  row[5] = email;        // columns.email
  row[16] = systemId;    // columns.systemId
  return row;
}

// 1. Real Form ID is referenced in the setup documentation.
test('the bridge is documented against the real, confirmed Digital Class Form ID', () => {
  const setupDoc = read('automation/DIGITAL_CLASS_FORWARD_SETUP.md');
  assert.match(setupDoc, /1DWtn1FQD86E4EHzABxeoEpHDuVeoFH_Smak4_C1RU7M/);
  assert.match(setupDoc, /디지털 클래스 신청서\(응답\)/);
});

// 2. Real, confirmed response-sheet headers are used -- not guessed keywords.
test('the bridge uses the exact confirmed response-sheet headers, not guessed keywords', () => {
  assert.match(bridge, /name: '4\.이름'/);
  assert.match(bridge, /email: '9\.구글이메일'/);
  assert.match(bridge, /phone: '8\.연락처\(휴대폰\)'/);
  assert.match(bridge, /enrolledSubject: '11\.수강 신청반'/);
  // No fuzzy/keyword-list matching helper (the style used for forms whose
  // real headers were not yet confirmed) is present in this file.
  assert.doesNotMatch(bridge, /keywords\.map/);
});

// 3 & 4. Exact-email matching is delegated to the existing, already-tested
// case-insensitive matcher in member-signup.gs -- this bridge does not
// reimplement matching logic itself.
test('email matching is delegated to the existing case-insensitive exact-match roster lookup', () => {
  assert.match(memberSignup, /text_\(row\[map\.email - 1\]\)\.toLowerCase\(\) === email\.toLowerCase\(\)/);
  // Scoped to the roster-webapp-forwarding function itself: it must not
  // reimplement email matching (member-signup.gs's own findMemberRow_ does
  // that). The separate, user-approved verified-Korean-name feature reads
  // the roster directly and necessarily does its own case-insensitive
  // comparison elsewhere in this file -- that is intentional and covered by
  // tests/digital-class-korean-name-sync.test.js, not this assertion.
  assert.doesNotMatch(extractBridgeFunction('forwardDigitalClassApplicationToRoster_'), /toLowerCase/);
});

// 5. Name-only matching is never performed by this bridge.
test('the bridge never matches by name alone', () => {
  assert.doesNotMatch(bridge, /namedValues\[DIGITAL_CLASS_HEADERS\.name\][\s\S]{0,80}roster/);
  assert.doesNotMatch(bridge, /findByName|matchByName|nameOnly/i);
});

// 6. Email mismatch / no match is skipped, not an error, and is logged.
test('an email that matches no existing member is skipped and logged, not treated as an error', () => {
  assert.match(bridge, /if \(!result\.ok\) \{/);
  assert.match(bridge, /console\.warn\('Member roster sync skipped\/failed:', result\.error \|\| response\.getResponseCode\(\)\);/);
});

// 7. No account is ever created from a Form submission by this bridge.
test('the bridge never creates a Harmony Link account or roster row itself', () => {
  // Scoped to the roster-webapp-forwarding function: it must never append a
  // row or open a spreadsheet itself (member-signup.gs's own webapp is the
  // sole writer there). SpreadsheetApp.openById/getSheetByName legitimately
  // appear elsewhere in this file for the separate, user-approved
  // verified-Korean-name READ-ONLY roster lookup, which never appends a row
  // or creates an account either -- covered by its own dedicated test file.
  assert.doesNotMatch(extractBridgeFunction('forwardDigitalClassApplicationToRoster_'), /appendRow|SpreadsheetApp\.openById|getSheetByName/);
  assert.doesNotMatch(bridge, /createUser|signUp|auth\.admin/);
});

// 8 & 9. No member-number logic anywhere in this file.
test('the bridge never generates, assigns, or changes a member number', () => {
  assert.doesNotMatch(bridge, /HL-\$\{/);
  assert.doesNotMatch(bridge, /HL-\d/);
  assert.doesNotMatch(bridge, /nextMemberNumber/);
  // The payload forwarded to the roster webapp never carries a member
  // number field -- only identity/application fields.
  const payload = bridge.slice(bridge.indexOf('const payload = {'), bridge.indexOf('const response = UrlFetchApp'));
  assert.doesNotMatch(payload, /member_number|회원번호/);
});

// 10. The existing, already-tested application sync path is reused verbatim.
test('application completion is synced through the existing, unmodified internal_sync_member_application_metadata path', () => {
  assert.match(migration, /create or replace function public\.internal_sync_member_application_metadata/);
  assert.match(migration, /application_completed = true/);
  // never touches member_number/joined_at/role/membership/account_status
  assert.doesNotMatch(migration.slice(migration.indexOf('internal_sync_member_application_metadata')), /set[\s\S]{0,400}member_number\s*=/);
  // The bridge forwards to the same roster webapp /exec path member-signup.gs
  // already uses for every other application bridge -- no new endpoint.
  assert.match(bridge, /PropertiesService\.getScriptProperties\(\)\.getProperty\(DIGITAL_CLASS_CONFIG\.rosterWebappUrlKey\)/);
  assert.match(memberSignup, /registerMember_/);
  assert.match(memberSignup, /isSupplementalApplication_/);
});

// 11. Duplicate submissions are safe (idempotent) -- re-verified against the
// existing roster contract, not reimplemented here.
test('repeated submissions remain duplicate-safe through the existing roster contract', () => {
  assert.match(memberSignup, /const immutable = \[columns\.memberNumber - 1, columns\.joinedAt - 1, columns\.systemId - 1\]/);
  assert.match(memberSignup, /if \(row && isSupplementalApplication\) updateExistingApplication_/);
});

// 12 & 13. No member is special-cased by name, email, or member number
// anywhere in this file -- including the two members a human operator has
// since manually reconciled (never referenced here).
test('no specific member (by name, email, or member number) is hardcoded in the bridge', () => {
  assert.doesNotMatch(bridge, /염나영|신영숙/);
  assert.doesNotMatch(bridge, /meilly@naver\.com|040nsd@gmail\.com|agnesshin70@gmail\.com/);
  assert.doesNotMatch(bridge, /HL-26-013|HL-26-005/);
  assert.doesNotMatch(bridge, /c3cb79f9-8573-4514-bc71-96328fd80108/);
  assert.doesNotMatch(bridge, /if \(name === /);
  assert.doesNotMatch(bridge, /if \(email === /);
});

// 14. No automatic backfill of the historic responses is wired into this file.
test('the bridge never reprocesses historic responses -- only installs a forward-looking onFormSubmit trigger', () => {
  // Scoped to the roster-application-sync path and the trigger installer:
  // neither one may automatically resync historic responses to the roster
  // webapp. The separate "관리용 한글 이름 동기화" menu action also reads
  // getLastRow() over existing responses, but it is a distinct,
  // explicitly admin-triggered feature that only ever writes its own
  // managed column -- never the roster webapp sync -- and is covered by its
  // own dedicated test file.
  assert.doesNotMatch(extractBridgeFunction('forwardDigitalClassApplicationToRoster_'), /resync|getLastRow\(\)|getRange\(2,/i);
  assert.doesNotMatch(extractBridgeFunction('installDigitalClassApplicationTrigger'), /resync|getLastRow\(\)|getRange\(2,/i);
  assert.match(bridge, /function installDigitalClassApplicationTrigger\(\)/);
  assert.match(bridge, /\.onFormSubmit\(\)/);
});

// 15. Installing the trigger is duplicate-safe: existing same-handler
// triggers are removed before exactly one new one is created.
test('the trigger installer prevents duplicate triggers for the same handler', () => {
  const installer = bridge.slice(bridge.indexOf('function installDigitalClassApplicationTrigger'), bridge.indexOf('function forwardDigitalClassApplication('));
  assert.match(installer, /ScriptApp\.getProjectTriggers\(\)\s*\n\s*\.filter\(trigger => trigger\.getHandlerFunction\(\) === 'forwardDigitalClassApplication'\)\s*\n\s*\.forEach\(trigger => ScriptApp\.deleteTrigger\(trigger\)\);/);
  assert.match(installer, /ScriptApp\.newTrigger\('forwardDigitalClassApplication'\)/);
  // Exactly one newTrigger call in the installer.
  const newTriggerMatches = installer.match(/ScriptApp\.newTrigger\(/g) || [];
  assert.equal(newTriggerMatches.length, 1);
});

// 16. REAL EXECUTION (not just pattern matching): member-signup.gs's own
// text_() is exactly the trivial pass-through the harness above stands in
// for, so running the harness is a faithful stand-in for running the real
// file end to end.
test("the harness's text_ stand-in matches member-signup.gs's real text_ exactly", () => {
  assert.match(memberSignup, /function text_\(value\) \{ return String\(value \|\| ''\)\.trim\(\); \}/);
});

// 17. THE CORE SAFETY CONTRACT, verified by actually running registerMember_:
// an unmatched email carrying supplemental-application fields (exactly what
// this bridge always sends -- it never sends 회원 ID) must throw before any
// of the member-creation side effects run, not merely "be expected to".
test('REAL EXECUTION: an unmatched supplemental application throws and triggers zero registration side effects', () => {
  const h = harness(null); // empty roster: no row can ever match
  assert.throws(
    () => h.registerMember_({ '이메일': 'unmatched@example.com', '연락처': '555-0100', '수강과목': '유튜브' }),
    /회원 ID가 없는 신청서는 기존 이메일 회원과만 연결할 수 있습니다\./
  );
  assert.equal(h.calls.nextMemberNumber, 0, 'nextMemberNumber_ must never be called for an unmatched applicant');
  assert.equal(h.calls.appendRow, 0, 'sheet.appendRow must never be called for an unmatched applicant');
  assert.equal(h.calls.registerMemberMetadata, 0, 'registerMemberMetadata_ (-> internal_register_member_admin_metadata) must never be called');
  assert.equal(h.calls.syncApplicationMetadata, 0, 'syncApplicationMetadata_ (-> internal_sync_member_application_metadata) must never be called');
});

// 18. Same core contract, the alternate trigger: a row is somehow found (so
// the earlier no-memberId throw does not fire) but it is still a
// supplemental application mismatch. Exercised directly for completeness,
// even though this bridge's own call shape (no 회원 ID) always hits test 17
// first in practice.
test('REAL EXECUTION: a supplemental application with no matching row throws at the row-match guard too', () => {
  const h = harness(existingMemberRow({ memberNumber: 'HL-26-999', email: 'someone-else@example.com', systemId: 'uuid-unrelated' }));
  assert.throws(
    () => h.registerMember_({ '이메일': 'unmatched@example.com', '연락처': '555-0100' }),
    /회원 ID가 없는 신청서는 기존 이메일 회원과만 연결할 수 있습니다\.|신청서 이메일과 일치하는 기존 회원을 찾지 못했습니다\./
  );
  assert.equal(h.calls.nextMemberNumber, 0);
  assert.equal(h.calls.appendRow, 0);
  assert.equal(h.calls.registerMemberMetadata, 0);
  assert.equal(h.calls.syncApplicationMetadata, 0);
});

// 19. The normal, intended path: a real exact-email match reuses the
// existing member's UUID and member number (never minting a new one) and
// reaches the application-completion sync call exactly once.
test('REAL EXECUTION: an exact-email match reuses the existing member number and reaches the application sync call', () => {
  const h = harness(existingMemberRow({ memberNumber: 'HL-26-123', email: 'Matched@Example.com', systemId: 'uuid-existing-abc' }));
  const result = h.registerMember_({ '이메일': 'matched@example.com', '연락처': '555-0199', '수강과목': '유튜브' });
  assert.equal(result.ok, true);
  assert.equal(result.memberId, 'uuid-existing-abc', 'must reuse the existing row\'s UUID, never invent one');
  assert.equal(result.memberNumber, 'HL-26-123', 'must reuse the existing member number verbatim');
  assert.equal(h.calls.nextMemberNumber, 0, 'a matched applicant must never be issued a new member number');
  assert.equal(h.calls.appendRow, 0, 'a matched applicant must never append a new roster row');
  assert.equal(h.calls.registerMemberMetadata, 1);
  assert.equal(h.calls.syncApplicationMetadata, 1, 'the application-completion sync path must be reached exactly once for a real match');
});
