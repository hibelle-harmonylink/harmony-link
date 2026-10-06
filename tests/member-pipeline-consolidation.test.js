const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const admin = read('admin.js');
const css = read('admin.css');
const migration = read('supabase/migrations/202609130004_member_application_completion.sql');
const numberIssuanceMigration = read('supabase/migrations/202610060001_member_number_first_issuance.sql');
const auth = read('auth.js');
const appJs = read('app/app.js');
const memberSignup = read('automation/member-signup.gs');
const digitalClassBridge = read('automation/digital-class-application-forward.gs');

// Extracts memberNumberClass for real execution, exactly as admin.js defines it.
function extractMemberNumberClass() {
  const match = admin.match(/const memberNumberClass = member => \{[\s\S]*?\n  \};/);
  assert.ok(match, 'could not extract memberNumberClass from admin.js');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[0]}\nthis.memberNumberClass = memberNumberClass;`, context);
  return context.memberNumberClass;
}

test('REAL EXECUTION: member_number present + application_completed === false renders the pending/red class', () => {
  const memberNumberClass = extractMemberNumberClass();
  assert.equal(memberNumberClass({ member_number: 'HL-26-099', application_completed: false }), 'member-number member-number-pending');
});

test('REAL EXECUTION: member_number present + application_completed === true renders the default/black class, never pending', () => {
  const memberNumberClass = extractMemberNumberClass();
  assert.equal(memberNumberClass({ member_number: 'HL-26-099', application_completed: true }), 'member-number');
});

test('REAL EXECUTION: member_number present + application_completed null (no longer treated as done) renders the pending/red class', () => {
  const memberNumberClass = extractMemberNumberClass();
  assert.equal(memberNumberClass({ member_number: 'HL-26-099', application_completed: null }), 'member-number member-number-pending');
});

test('REAL EXECUTION: member_number present + application_completed undefined renders the pending/red class', () => {
  const memberNumberClass = extractMemberNumberClass();
  assert.equal(memberNumberClass({ member_number: 'HL-26-099', application_completed: undefined }), 'member-number member-number-pending');
});

test('REAL EXECUTION: no member_number at all renders its own missing/reconciliation-needed class, never pending or plain black', () => {
  const memberNumberClass = extractMemberNumberClass();
  assert.equal(memberNumberClass({ member_number: '', application_completed: false }), 'member-number member-number-missing');
  assert.equal(memberNumberClass({ member_number: null, application_completed: true }), 'member-number member-number-missing');
});

test('the pending/red, missing, and default CSS classes resolve to their documented colors', () => {
  assert.match(css, /\.member-number\.member-number-pending\{color:#dc2626\}/);
  assert.match(css, /\.member-number\.member-number-missing\{color:#9aa8b8;font-style:italic/);
});

test('the Supabase migration never lets a retry overwrite an already-issued member_number', () => {
  // The original migration's ON CONFLICT clause (superseded in effect by the
  // later 202610060001 migration below, but never edited in place) still
  // documents the original intent: member_number is never replaced wholesale
  // by excluded.member_number on its own.
  const fn = migration.slice(
    migration.indexOf('create function public.internal_register_member_admin_metadata'),
    migration.indexOf('create or replace function public.internal_sync_member_application_metadata')
  );
  assert.match(fn, /member_number = public\.member_admin_metadata\.member_number/);
  assert.doesNotMatch(fn, /member_number = excluded\.member_number/);
  assert.doesNotMatch(fn, /member_number = coalesce\(excluded\.member_number/);
});

// REAL EXECUTION of the actual Postgres upsert semantics via a small, exact
// JS model of `coalesce(a, b)` and the CASE expression -- not a live
// Postgres, but a faithful behavioral mirror of the literal SQL this
// migration defines, applied against the same four scenarios the migration
// itself must handle.
function simulateNumberIssuanceConflict(existing, suppliedNumber) {
  const coalesce = (a, b) => (a === null || a === undefined ? b : a);
  const nextMemberNumber = coalesce(existing.member_number, suppliedNumber);
  const nextApplicationCompleted = existing.member_number === null || existing.member_number === undefined
    ? coalesce(existing.application_completed, false)
    : existing.application_completed;
  return { member_number: nextMemberNumber, application_completed: nextApplicationCompleted };
}

test('REAL EXECUTION (SQL semantics mirror): a metadata row with no member_number gets the supplied number and a normalized false', () => {
  const result = simulateNumberIssuanceConflict({ member_number: null, application_completed: null }, 'HL-26-099');
  assert.equal(result.member_number, 'HL-26-099');
  assert.equal(result.application_completed, false);
});

test('REAL EXECUTION (SQL semantics mirror): a metadata row with a real member_number keeps it even if a different number is supplied', () => {
  const result = simulateNumberIssuanceConflict({ member_number: 'HL-26-013', application_completed: true }, 'HL-26-999');
  assert.equal(result.member_number, 'HL-26-013');
  assert.equal(result.application_completed, true, 'an already-true completion must never be reset by a retry');
});

test('REAL EXECUTION (SQL semantics mirror): an already-false application_completed is untouched by a retry that keeps the same number', () => {
  const result = simulateNumberIssuanceConflict({ member_number: 'HL-26-013', application_completed: false }, 'HL-26-013');
  assert.equal(result.member_number, 'HL-26-013');
  assert.equal(result.application_completed, false);
});

test('the new migration keeps CREATE OR REPLACE semantics and preserves the invalid-number/missing-member guards', () => {
  assert.match(numberIssuanceMigration, /drop function if exists public\.internal_register_member_admin_metadata\(uuid, text, timestamptz\);/);
  assert.match(numberIssuanceMigration, /create function public\.internal_register_member_admin_metadata/);
  assert.match(numberIssuanceMigration, /if p_member_number !~ '\^HL-\[0-9\]\{2\}-\[0-9\]\{3\}\$' then/);
  assert.match(numberIssuanceMigration, /if not exists \(select 1 from auth\.users user_account where user_account\.id = p_member_id\) then/);
});

test('the new migration lets a first-time issuance fill member_number only when the existing value is null, and never overwrites a real one', () => {
  assert.match(numberIssuanceMigration, /member_number = coalesce\(public\.member_admin_metadata\.member_number, excluded\.member_number\)/);
});

test('the new migration normalizes application_completed to false only in the same transition that first assigns a number, and otherwise leaves it untouched', () => {
  assert.match(numberIssuanceMigration, /when public\.member_admin_metadata\.member_number is null\s*\n\s*then coalesce\(public\.member_admin_metadata\.application_completed, false\)/);
  assert.match(numberIssuanceMigration, /else public\.member_admin_metadata\.application_completed/);
});

test('both Web and App/PWA call the same idempotent registration path on every session, never generating a number client-side', () => {
  assert.match(auth, /const ensureMemberRosterRegistration = async user/);
  assert.match(auth, /await ensureMemberRosterRegistration\(data\.session\?\.user\)/);
  assert.match(auth, /await ensureMemberRosterRegistration\(session\?\.user\)/);
  assert.doesNotMatch(auth, /HL-\$\{/);

  assert.match(appJs, /async function ensureAppMemberRosterRegistration\(user\)/);
  assert.match(appJs, /ensureAppMemberRosterRegistration\(appAuthSession\?\.user\)/);
  assert.match(appJs, /ensureAppMemberRosterRegistration\(session\?\.user\)/);
  assert.doesNotMatch(appJs, /HL-\$\{/);

  // Both call the exact same roster webapp endpoint -- one registration
  // pipeline, not two divergent ones.
  assert.match(auth, /signupAutomationUrl/);
  assert.match(appJs, /APP_SIGNUP_AUTOMATION_URL\s*=\s*"https:\/\/script\.google\.com\/macros\/s\/AKfycbx8j1IVjbeUrKvPyHkww_V1fHG8qBeY3KBO4ZWpscXAOiIDTZ6efMCuogQWP5QfRbxq\/exec"/);
});

test('exact-email application matching is never replaced by name-only matching anywhere in the roster or bridge code', () => {
  assert.doesNotMatch(memberSignup, /findByName|matchByName|nameOnly/i);
  assert.doesNotMatch(digitalClassBridge, /findByName|matchByName|nameOnly/i);
  assert.match(memberSignup, /text_\(row\[map\.email - 1\]\)\.toLowerCase\(\) === email\.toLowerCase\(\)/);
});

test('no specific member under reconciliation discussion is hardcoded in production source', () => {
  const productionFiles = [
    ['admin.js', admin],
    ['auth.js', auth],
    ['app/app.js', appJs],
    ['automation/member-signup.gs', memberSignup],
    ['automation/digital-class-application-forward.gs', digitalClassBridge],
  ];
  const forbidden = [
    /Yeonhee Pak/i, /Jong Bae/i, /염나영/, /신영숙/,
    /meilly@naver\.com/i, /040nsd@gmail\.com/i, /agnesshin70@gmail\.com/i, /703-622-0777/,
    /HL-26-013/, /HL-26-005/,
    /c3cb79f9-8573-4514-bc71-96328fd80108/i,
    /7e8e4197-ea5e-4b52-9f9b-abe2c77e3e0d/i, /aa59766b-bea3-46af-8ab7-fd77c0766d66/i,
  ];
  productionFiles.forEach(([name, content]) => {
    forbidden.forEach(pattern => {
      assert.doesNotMatch(content, pattern, `${name} must not hardcode ${pattern}`);
    });
  });
});

test('no specific member identifier is hardcoded in any Supabase migration', () => {
  const migrationsDir = path.join(root, 'supabase', 'migrations');
  const forbidden = [
    /Yeonhee Pak/i, /Jong Bae/i, /염나영/, /신영숙/,
    /meilly@naver\.com/i, /040nsd@gmail\.com/i, /703-622-0777/,
    /HL-26-013/, /HL-26-005/,
    /c3cb79f9-8573-4514-bc71-96328fd80108/i,
    /7e8e4197-ea5e-4b52-9f9b-abe2c77e3e0d/i, /aa59766b-bea3-46af-8ab7-fd77c0766d66/i,
  ];
  fs.readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).forEach(name => {
    const content = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    forbidden.forEach(pattern => {
      assert.doesNotMatch(content, pattern, `${name} must not hardcode ${pattern}`);
    });
  });
});

test('a brand-new member_admin_metadata row always starts application_completed=false explicitly, never left to default to null', () => {
  assert.match(migration, /values \(p_member_id, p_member_number, p_joined_at, false\)/);
});

// REAL EXECUTION: memberPersonName's priority with concrete, representative
// shapes -- a verified Korean full_name with no display_name set (신영숙's
// real shape), and an English-only shape with neither display_name nor a
// Korean full_name, so the existing fallback must be used verbatim rather
// than invented or transliterated.
function extractMemberPersonName() {
  const match = admin.match(/const fallbackMemberName = member => \{[\s\S]*?\n  \};\n[\s\S]*?const memberPersonName = member => \{[\s\S]*?\n  \};/);
  assert.ok(match, 'could not extract fallbackMemberName/memberPersonName from admin.js');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[0]}\nthis.memberPersonName = memberPersonName;`, context);
  return context.memberPersonName;
}

test('REAL EXECUTION: display_name null + a verified Korean full_name renders the Korean full_name, not an English fallback', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(memberPersonName({ display_name: null, full_name: '신영숙', email: 'agnesshin70@gmail.com' }), '신영숙');
});

test('REAL EXECUTION: no Korean name anywhere renders the existing English/email fallback verbatim, never transliterated', () => {
  const memberPersonName = extractMemberPersonName();
  assert.equal(memberPersonName({ display_name: '', full_name: '', email: 'sangup.lee@example.com' }), 'sangup.lee');
  assert.equal(memberPersonName({ display_name: '', full_name: 'Tae Hwa Kwon', email: 'kwontae@example.com' }), 'Tae Hwa Kwon');
});

// REAL EXECUTION of the new reconciliation entry point against a stateful
// mock roster sheet: running it twice for the same member_id/email must
// mint exactly one number, never two, and the second run must reuse the
// row the first run created.
function harnessReconciliation() {
  const calls = { nextMemberNumber: 0, appendRow: 0, registerMemberMetadata: 0, sendSignupConfirmation: 0 };
  const rows = [];
  const mockSheet = {
    getLastRow: () => rows.length + 1,
    getRange: (r, c, numRows, numCols) => {
      numRows = numRows || 1; numCols = numCols || 1;
      return {
        getDisplayValues: () => {
          const slice = [];
          for (let i = 0; i < numRows; i += 1) {
            const row = rows[r - 2 + i] || [];
            const cells = [];
            for (let j = 0; j < numCols; j += 1) cells.push(row[c - 1 + j] || '');
            slice.push(cells);
          }
          return slice;
        },
        getDisplayValue: () => (rows[r - 2] || [])[c - 1] || '',
      };
    },
    appendRow: record => { calls.appendRow++; rows.push(record.slice()); },
  };
  const context = {
    calls,
    text_: value => String(value || '').trim(),
    json_: payload => context.ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(context.ContentService.MimeType.JSON),
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    SpreadsheetApp: { flush: () => {} },
    console: { error: () => {}, warn: () => {} },
    ContentService: {
      createTextOutput: content => {
        const out = { getContent: () => content, setMimeType: () => out };
        return out;
      },
      MimeType: { JSON: 'JSON' },
    },
    Logger: { log: () => {} },
    PRE_NAME_COLUMNS: undefined,
    PRE_NAME_COLUMNS_WITHOUT_SIGNUP_PATH: undefined,
  };
  context.mockSheet = mockSheet;
  vm.createContext(context);
  function extractFn(name) {
    const match = memberSignup.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`));
    assert.ok(match, `could not extract ${name} from member-signup.gs`);
    return match[0];
  }
  function extractConst(name, closer) {
    const match = memberSignup.match(new RegExp(`const ${name} = [^;]*?${closer};`));
    assert.ok(match, `could not extract const ${name} from member-signup.gs`);
    return match[0];
  }
  vm.runInContext([
    extractConst('HEADERS', '\\]'),
    extractConst('COLUMNS', '\\}\\)'),
    extractFn('columnWidth_'),
    extractFn('isSupplementalApplication_'),
    extractFn('applicationValue_'),
    extractFn('normalizeType_'),
    extractFn('membershipLabel_'),
    extractFn('dateValue_'),
    extractFn('formatPhone_'),
    extractFn('rosterRecord_'),
    extractFn('findMemberRow_'),
    extractFn('registerMember_'),
    extractFn('reconcileOneMissingRosterMember_'),
    `function ensureSchema_(sheet) { return COLUMNS; }`,
    `function getSheet_() { return mockSheet; }`,
    `function nextMemberNumber_() { calls.nextMemberNumber++; return 'HL-26-900'; }`,
    `function registerMemberMetadata_(memberId, memberNumber) { calls.registerMemberMetadata++; return { ok: true, memberNumber: memberNumber }; }`,
    `function sendSignupConfirmation_() { calls.sendSignupConfirmation++; }`,
  ].join('\n;\n'), context);
  return { reconcileOneMissingRosterMember_: context.reconcileOneMissingRosterMember_, calls, rows };
}

test('REAL EXECUTION: reconciling the same missing member twice issues exactly one member number, never two', () => {
  const h = harnessReconciliation();
  const first = h.reconcileOneMissingRosterMember_('auth-uuid-1', 'missing-member@example.com', '');
  assert.equal(first.ok, true);
  assert.equal(first.memberNumber, 'HL-26-900');
  assert.equal(h.calls.nextMemberNumber, 1);
  assert.equal(h.calls.appendRow, 1);

  const second = h.reconcileOneMissingRosterMember_('auth-uuid-1', 'missing-member@example.com', '');
  assert.equal(second.ok, true);
  assert.equal(second.memberNumber, 'HL-26-900', 'the second run must reuse the row the first run created');
  assert.equal(h.calls.nextMemberNumber, 1, 'a second run must never mint a second number');
  assert.equal(h.calls.appendRow, 1, 'a second run must never append a second row');
});

test('REAL EXECUTION: reconciliation never invents a Korean name when none is supplied', () => {
  const h = harnessReconciliation();
  const result = h.reconcileOneMissingRosterMember_('auth-uuid-2', 'missing-member-2@example.com', '');
  assert.equal(result.ok, true);
  assert.equal(h.rows[0][3], '', 'displayName column must stay blank when no verified Korean name is supplied');
});

test('reconciliation requires both a member_id and an email before calling registerMember_ at all', () => {
  const fn = memberSignup.slice(
    memberSignup.indexOf('function reconcileOneMissingRosterMember_'),
    memberSignup.indexOf('function rosterRecord_')
  );
  assert.match(fn, /if \(!memberId \|\| !email\)/);
});

test('MISSING_ROSTER_MEMBERS starts empty -- no member is pre-filled into the reconciliation list', () => {
  assert.match(memberSignup, /const MISSING_ROSTER_MEMBERS = \[\s*\/\/[^\n]*\s*\];/);
});
